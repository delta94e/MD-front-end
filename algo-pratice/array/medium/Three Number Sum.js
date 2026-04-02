// ============================================================
// Three Number Sum — AlgoExpert / LeetCode #15
// ============================================================

// ============================================================
// Approach 1: BRUTE FORCE — O(n³) time, O(n) space
// 3 nested loops thử mọi bộ 3
// ============================================================
function threeNumberSumBrute(array, targetSum) {
  array.sort((a, b) => a - b);
  const triplets = [];
  for (let i = 0; i < array.length - 2; i++) {
    for (let j = i + 1; j < array.length - 1; j++) {
      for (let k = j + 1; k < array.length; k++) {
        if (array[i] + array[j] + array[k] === targetSum) {
          triplets.push([array[i], array[j], array[k]]);
        }
      }
    }
  }
  return triplets;
}

// ============================================================
// Approach 2: SORT + TWO POINTERS — O(n²) time, O(n) space ⭐
// Fix 1 số + Two Sum cho 2 còn lại
// ============================================================
function threeNumberSum(array, targetSum) {
  array.sort((a, b) => a - b); // SORT!
  const triplets = [];

  for (let i = 0; i < array.length - 2; i++) {
    let left = i + 1;
    let right = array.length - 1;

    while (left < right) {
      const sum = array[i] + array[left] + array[right];

      if (sum === targetSum) {
        triplets.push([array[i], array[left], array[right]]);
        left++; // move CẢ HAI!
        right--;
      } else if (sum < targetSum) {
        left++; // cần lớn hơn
      } else {
        right--; // cần nhỏ hơn
      }
    }
  }
  return triplets;
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Three Number Sum ===\n");

function test(name, array, targetSum, expected) {
  const r1 = threeNumberSumBrute([...array], targetSum);
  const r2 = threeNumberSum([...array], targetSum);

  const fmt = (arr) => arr.map((t) => `[${t}]`).join(", ");

  console.log(`${name}:`);
  console.log(`  Brute:    [${fmt(r1)}]`);
  console.log(`  Optimal:  [${fmt(r2)}]`);
  console.log(`  Expected: [${fmt(expected)}]`);

  const match =
    JSON.stringify(r2) === JSON.stringify(expected) ? "✅" : "❌";
  console.log(`  ${match}`);
  console.log();
}

test(
  "Test 1 — AlgoExpert example",
  [12, 3, 1, 2, -6, 5, -8, 6],
  0,
  [
    [-8, 2, 6],
    [-8, 3, 5],
    [-6, 1, 5],
  ]
);

test("Test 2 — single triplet", [1, 2, 3], 6, [[1, 2, 3]]);

test("Test 3 — no triplet", [1, 2, 3], 10, []);

test("Test 4 — multiple triplets", [1, 2, 3, 4, 5], 9, [
  [1, 3, 5],
  [2, 3, 4],
]);

test("Test 5 — with zero", [-1, 0, 1], 0, [[-1, 0, 1]]);

test("Test 6 — all negative", [-5, -3, -1, -2, -4], -6, [
  [-3, -2, -1],
]);

test("Test 7 — larger", [1, 2, 3, 4, 5, 6, 7, 8, 9, 15], 18, [
  [1, 2, 15],
  [1, 8, 9],
  [2, 7, 9],
  [3, 6, 9],
  [3, 7, 8],
  [4, 5, 9],
  [4, 6, 8],
  [5, 6, 7],
]);
