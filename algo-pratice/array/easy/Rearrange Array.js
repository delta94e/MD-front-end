/**
 * 🔄 Rearrange Array — arr[i] = i
 *
 * Given an array of n elements (0 to n-1, with -1 for missing),
 * rearrange so that arr[i] = i. If i is not present, arr[i] = -1.
 *
 * Input:  [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]
 * Output: [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9]
 */

// ============================================================
// Approach 1: Brute Force — O(n²) Time, O(n) Space
// ============================================================
function rearrangeBrute(arr) {
  const n = arr.length;
  const result = new Array(n).fill(-1);

  // Dùng mảng mới để tránh bug ghi đè
  for (const val of arr) {
    if (val !== -1) {
      result[val] = val; // đặt giá trị val vào vị trí val
    }
  }

  return result;
}

// ============================================================
// Approach 2: Hash Set — O(n) Time, O(n) Space
// ============================================================
function rearrangeHash(arr) {
  const n = arr.length;

  // Bước 1: Thu thập tất cả giá trị vào Set
  const present = new Set();
  for (const val of arr) {
    if (val !== -1) {
      present.add(val);
    }
  }

  // Bước 2: Build kết quả
  for (let i = 0; i < n; i++) {
    arr[i] = present.has(i) ? i : -1;
  }

  return arr;
}

// ============================================================
// Approach 3: In-place Swap — O(n) Time, O(1) Space ⭐
// ============================================================
function rearrangeInPlace(arr) {
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    // Tiếp tục swap cho đến khi arr[i] đúng chỗ hoặc trống
    while (arr[i] !== -1 && arr[i] !== i) {
      const correctPos = arr[i]; // vị trí đúng của giá trị arr[i]

      // Swap arr[i] về đúng vị trí
      [arr[i], arr[correctPos]] = [arr[correctPos], arr[i]];
    }
  }

  return arr;
}

// ============================================================
// Test
// ============================================================
function test(name, fn) {
  console.log(`\n=== ${name} ===`);

  console.log(fn([-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]));
  // Expected: [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9]

  console.log(fn([0, 1, 2, 3, 4, 5]));
  // Expected: [0, 1, 2, 3, 4, 5]

  console.log(fn([-1, -1, -1]));
  // Expected: [-1, -1, -1]

  console.log(fn([2, 0, 1]));
  // Expected: [0, 1, 2]
}

test("Brute Force", (arr) => rearrangeBrute([...arr]));
test("Hash Set", (arr) => rearrangeHash([...arr]));
test("In-place Swap", (arr) => rearrangeInPlace([...arr]));
