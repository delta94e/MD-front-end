// ═══════════════════════════════════════════════════════════════
// Construct Array from Pair-Sum
// ═══════════════════════════════════════════════════════════════

function constructFromPairSum(pair) {
  const m = pair.length;

  // Bước 1: Tính n
  const n = Math.floor((1 + Math.sqrt(1 + 8 * m)) / 2);

  // Edge case: n = 2
  if (n === 2) {
    return [1, pair[0] - 1];
  }

  // Bước 2: Tìm res[0]
  const res = new Array(n);
  res[0] = (pair[0] + pair[1] - pair[n - 1]) / 2;

  // Bước 3: Tìm res[1..n-1]
  for (let i = 1; i < n; i++) {
    res[i] = pair[i - 1] - res[0];
  }

  return res;
}

// ─── Helper: Generate pair-sum from array (for verification) ──
function generatePairSum(arr) {
  const n = arr.length;
  const pair = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pair.push(arr[i] + arr[j]);
    }
  }
  return pair;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { pair: [4, 5, 3], expected: [3, 1, 2] },
  { pair: [3], expected: [1, 2] },
  { pair: [12, 15, 18, 13, 16, 19], expected: [7, 5, 8, 11] },
  { pair: [6], expected: [1, 5] },
  { pair: [5, 8, 11, 7, 10, 13], expected: [1, 4, 7, 10] },
];

console.log("=== Construct from Pair-Sum ===\n");
tests.forEach(({ pair, expected }) => {
  const result = constructFromPairSum([...pair]);

  // Verify by regenerating pair-sum
  const regenerated = generatePairSum(result);
  const pairMatch = JSON.stringify(regenerated) === JSON.stringify(pair);
  const status = pairMatch ? "✅" : "❌";

  console.log(`${status} pair=[${pair}]`);
  console.log(`   → result=[${result}]`);
  console.log(`   → regenerated pair=[${regenerated}]`);
  console.log(`   → match: ${pairMatch}\n`);
});
