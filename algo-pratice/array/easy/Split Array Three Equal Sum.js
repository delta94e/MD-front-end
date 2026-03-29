// Split Array into Three Equal Sum Segments — Prefix Sum
function splitArray(arr) {
  const total = arr.reduce((a, b) => a + b, 0);
  if (total % 3 !== 0) return [-1, -1];

  const target = total / 3;
  let sum = 0;
  let firstEnd = -1;

  for (let i = 0; i < arr.length - 2; i++) {
    sum += arr[i];
    if (sum === target && firstEnd === -1) {
      firstEnd = i;
    }
  }

  if (firstEnd === -1) return [-1, -1];

  // Find second split
  sum = 0;
  for (let j = firstEnd + 1; j < arr.length - 1; j++) {
    sum += arr[j];
    if (sum === target) return [firstEnd, j];
  }

  return [-1, -1];
}

const tests = [
  { arr: [1, 3, 4, 0, 4], expected: [1, 2] },
  { arr: [2, 3, 4], expected: [-1, -1] },
  { arr: [1, -1, 1, -1, 1, -1, 1, -1], expected: [1, 3] },
  { arr: [0, 0, 0, 0], expected: [0, 1] },
  { arr: [3, 3, 3], expected: [0, 1] },
];

console.log("=== Split Array ===");
for (const { arr, expected } of tests) {
  const r = splitArray(arr);
  const ok = r[0] === expected[0] && r[1] === expected[1];
  console.log(`[${arr}] → [${r}] ${ok ? "✅" : `❌ exp [${expected}]`}`);
}
