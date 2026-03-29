// Maximum Subarray Sum — Kadane's Algorithm
// LeetCode #53 / GfG Easy
// Key: maxEndingHere = max(arr[i], maxEndingHere + arr[i])

// --- Solution 1: Brute Force --- O(n²)
function maxSubarrayBrute(arr) {
  let maxSum = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    for (let j = i; j < arr.length; j++) {
      sum += arr[j];
      maxSum = Math.max(maxSum, sum);
    }
  }
  return maxSum;
}

// --- Solution 2: Kadane's --- O(n)/O(1)
function maxSubarrayKadane(arr) {
  let maxEndingHere = arr[0];
  let maxSoFar = arr[0];

  for (let i = 1; i < arr.length; i++) {
    maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
}

// --- Solution 3: Kadane's with indices --- O(n)/O(1)
function maxSubarrayWithIndices(arr) {
  let maxEndingHere = arr[0], maxSoFar = arr[0];
  let start = 0, end = 0, tempStart = 0;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxEndingHere + arr[i]) {
      maxEndingHere = arr[i];
      tempStart = i;
    } else {
      maxEndingHere += arr[i];
    }
    if (maxEndingHere > maxSoFar) {
      maxSoFar = maxEndingHere;
      start = tempStart;
      end = i;
    }
  }

  return { sum: maxSoFar, subarray: arr.slice(start, end + 1) };
}

// --- Test ---
const tests = [
  { arr: [2, 3, -8, 7, -1, 2, 3], expected: 11 },
  { arr: [-2, -4], expected: -2 },
  { arr: [5, 4, 1, 7, 8], expected: 25 },
  { arr: [-1], expected: -1 },
  { arr: [1, -2, 3, -1, 2], expected: 4 },
  { arr: [-3, -2, -1, -4], expected: -1 },
];

console.log("=== Brute ===");
for (const { arr, expected } of tests) {
  const r = maxSubarrayBrute(arr);
  console.log(`[${arr}] → ${r} ${r === expected ? "✅" : `❌ exp ${expected}`}`);
}
console.log("\n=== Kadane ===");
for (const { arr, expected } of tests) {
  const r = maxSubarrayKadane(arr);
  console.log(`[${arr}] → ${r} ${r === expected ? "✅" : `❌ exp ${expected}`}`);
}
console.log("\n=== With Indices ===");
for (const { arr, expected } of tests) {
  const { sum, subarray } = maxSubarrayWithIndices(arr);
  console.log(`[${arr}] → ${sum} [${subarray}] ${sum === expected ? "✅" : `❌ exp ${expected}`}`);
}
