// Only Repeating From 1 To n-1
// Array size n, elements 1..n-1, exactly one repeats
// Similar to Missing Number but finding the DUPLICATE

// --- Solution 1: XOR --- O(n)/O(1)
function findRepeatingXOR(arr) {
  const n = arr.length;
  let xor = 0;
  for (let i = 0; i < n; i++) xor ^= arr[i];
  for (let i = 1; i < n; i++) xor ^= i; // XOR with 1..n-1
  return xor;
}

// --- Solution 2: Sum --- O(n)/O(1)
function findRepeatingSum(arr) {
  const n = arr.length;
  const expectedSum = (n - 1) * n / 2; // sum of 1..n-1
  const actualSum = arr.reduce((a, b) => a + b, 0);
  return actualSum - expectedSum;
}

// --- Solution 3: Index Mark --- O(n)/O(1)*
function findRepeatingMark(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    const idx = Math.abs(a[i]);
    if (a[idx] < 0) return idx;
    a[idx] = -a[idx];
  }
  return -1;
}

// --- Test ---
const tests = [
  { arr: [1, 3, 2, 3, 4], expected: 3 },
  { arr: [1, 5, 1, 2, 3, 4], expected: 1 },
  { arr: [2, 1, 2], expected: 2 },
  { arr: [1, 1], expected: 1 },
  { arr: [3, 1, 4, 2, 5, 3], expected: 3 },
];

for (const { name, fn } of [
  { name: "XOR", fn: findRepeatingXOR },
  { name: "Sum", fn: findRepeatingSum },
  { name: "Mark", fn: findRepeatingMark },
]) {
  console.log(`\n=== ${name} ===`);
  for (const { arr, expected } of tests) {
    const res = fn([...arr]);
    console.log(`[${arr}] → ${res} ${res === expected ? "✅" : `❌ exp ${expected}`}`);
  }
}
