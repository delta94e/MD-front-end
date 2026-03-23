// ============================================================
// Kadane's Algorithm — Maximum Subarray (LeetCode #53)
// ============================================================

// ============================================================
// Approach 1: BRUTE FORCE — O(n²) time, O(1) space
// Thử TẤT CẢ subarray
// ============================================================
function kadanesBrute(array) {
  let maxSum = -Infinity;
  for (let i = 0; i < array.length; i++) {
    let currentSum = 0;
    for (let j = i; j < array.length; j++) {
      currentSum += array[j];
      maxSum = Math.max(maxSum, currentSum);
    }
  }
  return maxSum;
}

// ============================================================
// Approach 2: KADANE'S ALGORITHM — O(n) time, O(1) space ⭐
// maxEndingHere = max(num, maxEndingHere + num)
// maxSoFar = max(maxSoFar, maxEndingHere)
// ============================================================
function kadanesAlgorithm(array) {
  let maxEndingHere = array[0];
  let maxSoFar = array[0];

  for (let i = 1; i < array.length; i++) {
    const num = array[i];
    maxEndingHere = Math.max(num, maxEndingHere + num);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Kadane's Algorithm — Maximum Subarray ===\n");

function test(name, array, expected) {
  const r1 = kadanesBrute([...array]);
  const r2 = kadanesAlgorithm([...array]);

  const pass1 = r1 === expected ? "✅" : "❌";
  const pass2 = r2 === expected ? "✅" : "❌";

  console.log(`${name}:`);
  console.log(`  Brute:   ${r1} ${pass1} | Expected: ${expected}`);
  console.log(`  Kadane:  ${r2} ${pass2} | Expected: ${expected}`);
  console.log();
}

test(
  "Test 1 — AlgoExpert example",
  [3, 5, -9, 1, 3, -2, 3, 4, 7, 2, -9, 6, 3, 1, -5, 4],
  19
);

test("Test 2 — small neg OK", [3, -2, 4], 5);

test("Test 3 — big neg restart", [3, -10, 4], 4);

test("Test 4 — all negative", [-3, -2, -1], -1);

test("Test 5 — all positive", [1, 2, 3], 6);

test("Test 6 — single element", [5], 5);

test("Test 7 — single negative", [-1], -1);

test("Test 8 — alternating", [1, -1, 1, -1, 1], 1);

test("Test 9 — LeetCode example", [-2, 1, -3, 4, -1, 2, 1, -5, 4], 6);

test("Test 10 — all zeros", [0, 0, 0], 0);
