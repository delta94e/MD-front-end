// Equilibrium Index — Prefix Sum
function equilibriumIndex(arr) {
  const total = arr.reduce((a, b) => a + b, 0);
  let leftSum = 0;
  for (let i = 0; i < arr.length; i++) {
    const rightSum = total - leftSum - arr[i];
    if (leftSum === rightSum) return i;
    leftSum += arr[i];
  }
  return -1;
}

const tests1 = [
  { arr: [1, 2, 0, 3], expected: 2 },
  { arr: [1, 1, 1, 1], expected: -1 },
  { arr: [-7, 1, 5, 2, -4, 3, 0], expected: 3 },
  { arr: [1], expected: 0 },
  { arr: [1, 3, 5, 2, 2], expected: 2 },
];
console.log("=== Equilibrium ===");
for (const { arr, expected } of tests1) {
  const r = equilibriumIndex(arr);
  console.log(`[${arr}] → ${r} ${r === expected ? "✅" : `❌ exp ${expected}`}`);
}
