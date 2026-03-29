// ═══════════════════════════════════════════════════════════════
// Maximum Occurring Integer in Given Ranges
// ═══════════════════════════════════════════════════════════════

// ─── Solution: Difference Array + Prefix Sum — O(n + maxVal) ⭐
function maxOccurring(l, r) {
  const n = l.length;

  let maxVal = 0;
  for (let i = 0; i < n; i++) {
    maxVal = Math.max(maxVal, r[i]);
  }

  // Difference array
  const diff = new Array(maxVal + 2).fill(0);
  for (let i = 0; i < n; i++) {
    diff[l[i]]++;
    diff[r[i] + 1]--;
  }

  // Prefix sum + find max
  let maxFreq = 0;
  let result = 0;
  let current = 0;

  for (let x = 0; x <= maxVal; x++) {
    current += diff[x];
    if (current > maxFreq) {
      maxFreq = current;
      result = x;
    }
  }

  return result;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { l: [1, 2, 4, 3], r: [6, 4, 8, 5], expected: 4 },
  { l: [1, 5, 9, 13, 21], r: [15, 8, 12, 20, 30], expected: 5 },
  { l: [1], r: [5], expected: 1 },
  { l: [1, 1], r: [3, 3], expected: 1 },
  { l: [5], r: [5], expected: 5 },
  { l: [1, 3, 5], r: [2, 4, 6], expected: 1 },
];

console.log("=== Max Occurring in Ranges ===\n");
tests.forEach(({ l, r, expected }) => {
  const result = maxOccurring([...l], [...r]);
  const pass = result === expected;
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} l=[${l}], r=[${r}] → ${result} (expected ${expected})`
  );
});
