// ═══════════════════════════════════════════════════════════════
// Top K Frequent Elements
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: HashMap + Sort — O(n log n) ──────────────────
function topKFrequentSort(arr, k) {
  const map = {};
  for (const num of arr) {
    map[num] = (map[num] || 0) + 1;
  }

  const entries = Object.entries(map).map(([key, freq]) => [
    Number(key),
    freq,
  ]);

  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // freq DESC
    return b[0] - a[0]; // value DESC (tie-break)
  });

  return entries.slice(0, k).map(([val]) => val);
}

// ─── Solution 2: HashMap + Bucket Sort — O(n) ⭐ ──────────────
function topKFrequent(arr, k) {
  const n = arr.length;

  // Step 1: Count frequency
  const map = {};
  for (const num of arr) {
    map[num] = (map[num] || 0) + 1;
  }

  // Step 2: Bucket sort — buckets[freq] = [elements]
  const buckets = new Array(n + 1).fill(null).map(() => []);
  for (const [num, freq] of Object.entries(map)) {
    buckets[freq].push(Number(num));
  }

  // Step 3: Collect top K from highest freq
  const result = [];
  for (let freq = n; freq >= 1 && result.length < k; freq--) {
    if (buckets[freq].length > 0) {
      buckets[freq].sort((a, b) => b - a); // tie-break: value DESC
      for (const num of buckets[freq]) {
        result.push(num);
        if (result.length === k) break;
      }
    }
  }

  return result;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [3, 1, 4, 4, 5, 2, 6, 1], k: 2, expected: [4, 1] },
  {
    arr: [7, 10, 11, 5, 2, 5, 5, 7, 11, 8, 9],
    k: 4,
    expected: [5, 11, 7, 10],
  },
  { arr: [1, 1, 1, 2, 2, 3], k: 1, expected: [1] },
  { arr: [1, 1, 1, 2, 2, 3], k: 2, expected: [1, 2] },
  { arr: [1], k: 1, expected: [1] },
  { arr: [5, 5, 5, 5], k: 1, expected: [5] },
  { arr: [1, 2], k: 2, expected: [2, 1] },
];

const solutions = [
  { name: "HashMap + Sort", fn: topKFrequentSort },
  { name: "HashMap + Bucket Sort ⭐", fn: topKFrequent },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ arr, k, expected }) => {
    const result = fn([...arr], k);
    const pass = JSON.stringify(result) === JSON.stringify(expected);
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} arr=[${arr}], k=${k} → [${result}] (expected [${expected}])`
    );
  });
});
