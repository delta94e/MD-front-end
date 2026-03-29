// ============================================================
// Unique Number I (Single Number) — LeetCode #136 / GfG Easy
// Every element appears twice except one. Find the unique one.
// Key insight: XOR all elements → duplicates cancel out!
// ============================================================

// --- Solution 1: HashMap (Frequency Count) --- O(n) time, O(n) space
function uniqueNumberMap(arr) {
  const freq = new Map();
  for (const val of arr) {
    freq.set(val, (freq.get(val) || 0) + 1);
  }
  for (const [key, count] of freq) {
    if (count === 1) return key;
  }
  return -1;
}

// --- Solution 2: Sort + Pair Check --- O(n log n) time, O(1) space
function uniqueNumberSort(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i += 2) {
    if (sorted[i] !== sorted[i + 1]) return sorted[i];
  }
  return sorted[sorted.length - 1]; // last element is unique
}

// --- Solution 3: XOR (Optimal) --- O(n) time, O(1) space
function uniqueNumberXOR(arr) {
  let result = 0;
  for (const val of arr) {
    result ^= val;
  }
  return result;
}

// --- Test ---
const tests = [
  { arr: [2, 3, 5, 4, 5, 3, 4], expected: 2 },
  { arr: [2, 2, 5, 5, 20, 30, 30], expected: 20 },
  { arr: [1], expected: 1 },
  { arr: [4, 1, 2, 1, 2], expected: 4 },
  { arr: [7, 3, 5, 3, 5, 7, 99], expected: 99 },
  { arr: [0, 1, 0], expected: 1 },
];

console.log("=== HashMap O(n)/O(n) ===");
for (const { arr, expected } of tests) {
  const res = uniqueNumberMap(arr);
  console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}

console.log("\n=== Sort O(n log n)/O(1) ===");
for (const { arr, expected } of tests) {
  const res = uniqueNumberSort(arr);
  console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}

console.log("\n=== XOR O(n)/O(1) ===");
for (const { arr, expected } of tests) {
  const res = uniqueNumberXOR(arr);
  console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}
