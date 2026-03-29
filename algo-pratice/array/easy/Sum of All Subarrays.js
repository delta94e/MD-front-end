// ============================================================
// Sum of All Subarrays
// Given arr[], compute sum of all possible sub-arrays.
// Key formula: arr[i] appears in (i+1) * (n-i) subarrays
// ============================================================

// --- Solution 1: Brute Force --- O(n³)
function sumSubarraysBrute(arr) {
  const n = arr.length;
  let total = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      // Sum of subarray arr[i..j]
      for (let k = i; k <= j; k++) {
        total += arr[k];
      }
    }
  }

  return total;
}

// --- Solution 2: Prefix Sum --- O(n²)
function sumSubarraysPrefix(arr) {
  const n = arr.length;
  let total = 0;

  for (let i = 0; i < n; i++) {
    let subarraySum = 0;
    for (let j = i; j < n; j++) {
      subarraySum += arr[j]; // extend subarray by 1
      total += subarraySum;
    }
  }

  return total;
}

// --- Solution 3: Contribution Technique (Optimal) --- O(n)
function sumSubarraysContribution(arr) {
  const n = arr.length;
  let total = 0;

  for (let i = 0; i < n; i++) {
    // arr[i] appears in (i+1) * (n-i) subarrays
    total += arr[i] * (i + 1) * (n - i);
  }

  return total;
}

// --- Test ---
const tests = [
  { arr: [1, 4, 5, 3, 2], expected: 116 },
  { arr: [1, 2, 3, 4], expected: 50 },
  { arr: [1], expected: 1 },
  { arr: [1, 2], expected: 6 },
  { arr: [1, 2, 3], expected: 20 },
  { arr: [5, 5, 5], expected: 50 },
];

console.log("=== Brute Force O(n³) ===");
for (const { arr, expected } of tests) {
  const res = sumSubarraysBrute(arr);
  console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}

console.log("\n=== Prefix Sum O(n²) ===");
for (const { arr, expected } of tests) {
  const res = sumSubarraysPrefix(arr);
  console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}

console.log("\n=== Contribution O(n) ===");
for (const { arr, expected } of tests) {
  const res = sumSubarraysContribution(arr);
  console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}
