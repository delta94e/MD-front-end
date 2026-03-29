// ═══════════════════════════════════════════════════════════════
// Reorder Array According to Given Indexes
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Mảng phụ — O(n) time, O(n) space ─────────────
function reorderByIndex(arr, index) {
  const n = arr.length;
  const result = new Array(n);

  for (let i = 0; i < n; i++) {
    result[index[i]] = arr[i]; // ⭐ Công thức CỐT LÕI!
  }

  // Copy kết quả về arr
  for (let i = 0; i < n; i++) {
    arr[i] = result[i];
  }

  return arr;
}

// ─── Solution 2: Cyclic Sort (in-place) — O(n) time, O(1) space ⭐
function reorderByIndexInPlace(arr, index) {
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    while (index[i] !== i) {
      const targetIdx = index[i];

      // Swap arr
      [arr[i], arr[targetIdx]] = [arr[targetIdx], arr[i]];

      // Swap index (CẬP NHẬT bản đồ!)
      [index[i], index[targetIdx]] = [index[targetIdx], index[i]];
    }
  }

  return arr;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  {
    arr: [10, 11, 12],
    index: [1, 0, 2],
    expected: [11, 10, 12],
  },
  {
    arr: [1, 2, 3, 4],
    index: [3, 2, 0, 1],
    expected: [3, 4, 2, 1],
  },
  {
    arr: [50, 40, 70, 60, 90],
    index: [3, 0, 4, 1, 2],
    expected: [40, 60, 90, 50, 70],
  },
  {
    arr: [5],
    index: [0],
    expected: [5],
  },
  {
    arr: [1, 2],
    index: [1, 0],
    expected: [2, 1],
  },
  {
    arr: [1, 2, 3],
    index: [0, 1, 2],
    expected: [1, 2, 3],
  },
  {
    arr: [7, 8, 9, 10],
    index: [2, 3, 0, 1],
    expected: [9, 10, 7, 8],
  },
];

console.log("=== Mảng phụ ===");
tests.forEach(({ arr, index, expected }) => {
  const a = [...arr];
  const idx = [...index];
  const result = reorderByIndex(a, idx);
  const pass = JSON.stringify(result) === JSON.stringify(expected);
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} arr=[${arr}], index=[${index}] → [${result}] (expected [${expected}])`
  );
});

console.log("\n=== Cyclic Sort (in-place) ===");
tests.forEach(({ arr, index, expected }) => {
  const a = [...arr];
  const idx = [...index];
  const result = reorderByIndexInPlace(a, idx);
  const pass = JSON.stringify(result) === JSON.stringify(expected);
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} arr=[${arr}], index=[${index}] → [${result}] (expected [${expected}])`
  );
});
