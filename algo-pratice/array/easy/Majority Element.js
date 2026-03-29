// ═══════════════════════════════════════════════════════════════
// Majority Element
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: HashMap — O(n) time, O(n) space ──────────────
function majorityElementHash(arr) {
  const n = arr.length;
  const map = {};

  for (const num of arr) {
    map[num] = (map[num] || 0) + 1;
    if (map[num] > Math.floor(n / 2)) {
      return num; // Return sớm!
    }
  }

  return -1;
}

// ─── Solution 2: Boyer-Moore Voting — O(n) time, O(1) space ⭐
function majorityElement(arr) {
  const n = arr.length;

  // Phase 1: Tìm candidate
  let candidate = arr[0];
  let count = 0;

  for (const num of arr) {
    if (count === 0) {
      candidate = num;
      count = 1;
    } else if (num === candidate) {
      count++;
    } else {
      count--;
    }
  }

  // Phase 2: Verify
  count = 0;
  for (const num of arr) {
    if (num === candidate) count++;
  }

  return count > Math.floor(n / 2) ? candidate : -1;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [1, 1, 2, 1, 3, 5, 1], expected: 1 },
  { arr: [7], expected: 7 },
  { arr: [2, 13], expected: -1 },
  { arr: [3, 3, 4, 2, 4, 4, 2, 4, 4], expected: 4 },
  { arr: [1, 2, 3], expected: -1 },
  { arr: [1, 1, 1, 1, 2, 3, 4], expected: 1 },
  { arr: [2, 2, 2, 2, 2], expected: 2 },
  { arr: [1, 2, 1], expected: 1 },
];

const solutions = [
  { name: "HashMap", fn: majorityElementHash },
  { name: "Boyer-Moore ⭐", fn: majorityElement },
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
