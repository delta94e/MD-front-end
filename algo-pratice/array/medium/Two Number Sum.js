// ============================================================
// Two Number Sum — AlgoExpert / LeetCode #1
// 3 Approaches: Brute Force, Hash Table, Two Pointers
// ============================================================

// ============================================================
// Approach 1: BRUTE FORCE — O(n²) time, O(1) space
// Thử TẤT CẢ cặp (i, j) → nếu tổng = target → return!
// ============================================================
function twoNumberSumBrute(array, targetSum) {
  for (let i = 0; i < array.length - 1; i++) {
    const firstNum = array[i];
    for (let j = i + 1; j < array.length; j++) {
      const secondNum = array[j];
      if (firstNum + secondNum === targetSum) {
        return [firstNum, secondNum];
      }
    }
  }
  return [];
}

// ============================================================
// Approach 2: HASH TABLE — O(n) time, O(n) space ⭐ OPTIMAL
// y = targetSum - x → check y trong hash → ghi x
// ============================================================
function twoNumberSum(array, targetSum) {
  const seen = {};
  for (const num of array) {
    const match = targetSum - num; // "tôi cần số mấy?"
    if (match in seen) return [match, num]; // tìm thấy bạn!
    seen[num] = true; // ghi sổ: "tôi đã đến rồi"
  }
  return [];
}

// ============================================================
// Approach 3: TWO POINTERS — O(n log n) time, O(1) space
// Sort → left/right pointers tiến vào giữa
// ============================================================
function twoNumberSumPointers(array, targetSum) {
  array.sort((a, b) => a - b); // SORT trước!
  let left = 0;
  let right = array.length - 1;

  while (left < right) {
    const currentSum = array[left] + array[right];

    if (currentSum === targetSum) {
      return [array[left], array[right]]; // tìm thấy!
    } else if (currentSum < targetSum) {
      left++; // tổng nhỏ quá → tăng số nhỏ
    } else {
      right--; // tổng lớn quá → giảm số lớn
    }
  }
  return [];
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Two Number Sum ===\n");

function test(name, array, targetSum, expected) {
  const r1 = twoNumberSumBrute([...array], targetSum);
  const r2 = twoNumberSum([...array], targetSum);
  const r3 = twoNumberSumPointers([...array], targetSum);

  const sort = (arr) => arr.sort((a, b) => a - b).join(",");

  console.log(`${name}:`);
  console.log(`  Brute:    [${sort(r1)}] | Expected: [${sort(expected)}]`);
  console.log(`  Hash:     [${sort(r2)}] | Expected: [${sort(expected)}]`);
  console.log(`  Pointers: [${sort(r3)}] | Expected: [${sort(expected)}]`);
  console.log();
}

test("Test 1 — basic", [3, 5, -4, 8, 11, 1, -1, 6], 10, [11, -1]);
test("Test 2 — no pair", [1, 2, 3, 4], 10, []);
test("Test 3 — negative", [-3, 7], 4, [-3, 7]);
test("Test 4 — single element", [1], 1, []);
test("Test 5 — exact pair", [4, 6], 10, [4, 6]);
test("Test 6 — all negative", [-1, -3, -5], -8, [-3, -5]);
test("Test 7 — large target", [14], 15, []);
test("Test 8 — zeros", [0, 10, 5, -5], 0, [5, -5]);
