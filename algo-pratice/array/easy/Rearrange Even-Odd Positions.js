// ============================================================
// Rearrange Even-Odd Positions (Wave/Zigzag Sort)
// arr[i] >= arr[i-1] if i is even (1-based)
// arr[i] <= arr[i-1] if i is odd (1-based)
// Pattern: arr[0] ≤ arr[1] ≥ arr[2] ≤ arr[3] ≥ ... (0-based)
// ============================================================

// --- Solution 1: Sort + Swap Adjacent Pairs --- O(n log n)
function rearrangeSort(arr) {
  const result = [...arr];
  result.sort((a, b) => a - b);

  // Swap adjacent pairs: (1,2), (3,4), (5,6), ...
  for (let i = 1; i < result.length - 1; i += 2) {
    [result[i], result[i + 1]] = [result[i + 1], result[i]];
  }

  return result;
}

// --- Solution 2: Greedy Single Pass (Optimal) --- O(n)
function rearrangeGreedy(arr) {
  const result = [...arr];
  const n = result.length;

  for (let i = 1; i < n; i++) {
    // 1-based: i+1 (even → arr[i] >= arr[i-1])
    // 0-based: i is odd → arr[i] should be >= arr[i-1] (peak)
    //          i is even → arr[i] should be <= arr[i-1] (valley)

    if (i % 2 !== 0) {
      // i odd (0-based) = even position (1-based) → PEAK: arr[i] >= arr[i-1]
      if (result[i] < result[i - 1]) {
        [result[i], result[i - 1]] = [result[i - 1], result[i]];
      }
    } else {
      // i even (0-based) = odd position (1-based) → VALLEY: arr[i] <= arr[i-1]
      if (result[i] > result[i - 1]) {
        [result[i], result[i - 1]] = [result[i - 1], result[i]];
      }
    }
  }

  return result;
}

// --- Verify ---
function verify(arr) {
  for (let i = 1; i < arr.length; i++) {
    const pos1based = i + 1;
    if (pos1based % 2 === 0) {
      // Even position: arr[i] >= arr[i-1]
      if (arr[i] < arr[i - 1]) return false;
    } else {
      // Odd position: arr[i] <= arr[i-1]
      if (arr[i] > arr[i - 1]) return false;
    }
  }
  return true;
}

// --- Test ---
const tests = [
  [1, 2, 2, 1],
  [1, 3, 2],
  [4, 7, 5, 6],
  [1, 2, 3, 4, 5, 6, 7],
  [5],
  [3, 1],
  [1, 1, 1, 1],
  [7, 3, 5, 1, 9, 2],
];

console.log("=== Sort + Swap ===");
for (const t of tests) {
  const res = rearrangeSort([...t]);
  console.log(`[${t}] → [${res}] valid=${verify(res)}`);
}

console.log("\n=== Greedy Single Pass ===");
for (const t of tests) {
  const res = rearrangeGreedy([...t]);
  console.log(`[${t}] → [${res}] valid=${verify(res)}`);
}
