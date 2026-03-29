// ═══════════════════════════════════════════════════════════════
// Next Permutation
// ═══════════════════════════════════════════════════════════════

function reverse(arr, left, right) {
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
}

// ─── Solution: 4-Step Algorithm — O(n) time, O(1) space ⭐ ────
function nextPermutation(arr) {
  const n = arr.length;

  // Step 1: Find PIVOT (right → left)
  let pivot = -1;
  for (let i = n - 2; i >= 0; i--) {
    if (arr[i] < arr[i + 1]) {
      pivot = i;
      break;
    }
  }

  // No pivot → last permutation → reverse all
  if (pivot === -1) {
    reverse(arr, 0, n - 1);
    return arr;
  }

  // Step 2: Find SUCCESSOR + Step 3: SWAP
  for (let j = n - 1; j > pivot; j--) {
    if (arr[j] > arr[pivot]) {
      [arr[pivot], arr[j]] = [arr[j], arr[pivot]];
      break;
    }
  }

  // Step 4: REVERSE suffix
  reverse(arr, pivot + 1, n - 1);
  return arr;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { input: [2, 4, 1, 7, 5, 0], expected: [2, 4, 5, 0, 1, 7] },
  { input: [3, 2, 1], expected: [1, 2, 3] },
  { input: [1, 3, 5, 4, 2], expected: [1, 4, 2, 3, 5] },
  { input: [1, 2, 3], expected: [1, 3, 2] },
  { input: [1], expected: [1] },
  { input: [1, 1, 5], expected: [1, 5, 1] },
  { input: [1, 2], expected: [2, 1] },
  { input: [2, 1], expected: [1, 2] },
  {
    input: [1, 5, 8, 4, 7, 6, 5, 3, 1],
    expected: [1, 5, 8, 5, 1, 3, 4, 6, 7],
  },
];

console.log("=== Next Permutation ===\n");
tests.forEach(({ input, expected }) => {
  const original = [...input];
  const result = nextPermutation([...input]);
  const pass = JSON.stringify(result) === JSON.stringify(expected);
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} [${original}] → [${result}] (expected [${expected}])`
  );
});
