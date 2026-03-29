// ═══════════════════════════════════════════════════════════════
// Count Possible Triangles
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Brute Force — O(n³) ──────────────────────────
function countTrianglesBrute(arr) {
  const n = arr.length;
  let count = 0;

  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        if (
          arr[i] + arr[j] > arr[k] &&
          arr[i] + arr[k] > arr[j] &&
          arr[j] + arr[k] > arr[i]
        ) {
          count++;
        }
      }
    }
  }

  return count;
}

// ─── Solution 2: Sort + Two Pointers — O(n²) ⭐ ──────────────
function countTriangles(arr) {
  const n = arr.length;
  arr.sort((a, b) => a - b);
  let count = 0;

  for (let i = n - 1; i >= 2; i--) {
    let left = 0;
    let right = i - 1;

    while (left < right) {
      if (arr[left] + arr[right] > arr[i]) {
        count += right - left; // ⭐ Batch count!
        right--;
      } else {
        left++;
      }
    }
  }

  return count;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [4, 6, 3, 7], expected: 3 },
  { arr: [10, 21, 22, 100, 101, 200, 300], expected: 6 },
  { arr: [1, 2, 3], expected: 0 },
  { arr: [3, 3, 3], expected: 1 },
  { arr: [1, 1, 1, 1], expected: 4 },
  { arr: [5], expected: 0 },
  { arr: [1, 2], expected: 0 },
  { arr: [2, 3, 4, 5], expected: 3 },
];

const solutions = [
  { name: "Brute Force", fn: countTrianglesBrute },
  { name: "Sort + Two Pointers ⭐", fn: countTriangles },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ arr, expected }) => {
    const result = fn([...arr]);
    const pass = result === expected;
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} [${arr}] → ${result} (expected ${expected})`
    );
  });
});
