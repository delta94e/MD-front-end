// ═══════════════════════════════════════════════════════════════
// Smallest Difference Triplet from Three Arrays
// ═══════════════════════════════════════════════════════════════

// ─── Solution: Sort + 3 Pointers — O(n log n) ⭐ ─────────────
function smallestDiffTriplet(arr1, arr2, arr3) {
  arr1.sort((a, b) => a - b);
  arr2.sort((a, b) => a - b);
  arr3.sort((a, b) => a - b);

  let i = 0, j = 0, k = 0;
  let bestDiff = Infinity;
  let bestTriplet = [];

  while (i < arr1.length && j < arr2.length && k < arr3.length) {
    const a = arr1[i], b = arr2[j], c = arr3[k];
    const curMin = Math.min(a, b, c);
    const curMax = Math.max(a, b, c);
    const diff = curMax - curMin;

    if (diff < bestDiff ||
       (diff === bestDiff && a + b + c < bestTriplet[0] + bestTriplet[1] + bestTriplet[2])) {
      bestDiff = diff;
      bestTriplet = [a, b, c];
    }

    if (curMin === a) i++;
    else if (curMin === b) j++;
    else k++;
  }

  return bestTriplet.sort((a, b) => b - a);
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { a1: [5, 2, 8], a2: [10, 7, 12], a3: [9, 14, 6], expected: [7, 6, 5] },
  { a1: [15, 12, 18, 9], a2: [10, 17, 13, 8], a3: [14, 16, 11, 5], expected: [11, 10, 9] },
  { a1: [1], a2: [1], a3: [1], expected: [1, 1, 1] },
  { a1: [1, 2], a2: [3, 4], a3: [5, 6], expected: [5, 3, 2] },
  { a1: [1, 5, 10], a2: [2, 6, 11], a3: [3, 7, 12], expected: [3, 2, 1] },
];

console.log("=== Smallest Difference Triplet ===\n");
tests.forEach(({ a1, a2, a3, expected }) => {
  const result = smallestDiffTriplet([...a1], [...a2], [...a3]);
  const pass = JSON.stringify(result) === JSON.stringify(expected);
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} [${a1}],[${a2}],[${a3}] → [${result}] (expected [${expected}])`
  );
});
