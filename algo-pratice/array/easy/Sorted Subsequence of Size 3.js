// Sorted Subsequence of Size 3
// Find a[i] < a[j] < a[k] where i < j < k in O(n)
// Key: track smallest and second-smallest seen so far

// --- Solution 1: Brute Force --- O(n³)
function findTripletBrute(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 2; i++)
    for (let j = i + 1; j < n - 1; j++)
      for (let k = j + 1; k < n; k++)
        if (arr[i] < arr[j] && arr[j] < arr[k]) return [arr[i], arr[j], arr[k]];
  return null;
}

// --- Solution 2: Auxiliary Arrays (leftMin, rightMax) --- O(n)/O(n)
function findTripletAux(arr) {
  const n = arr.length;
  if (n < 3) return null;

  const leftMin = new Array(n);
  const rightMax = new Array(n);

  leftMin[0] = arr[0];
  for (let i = 1; i < n; i++) leftMin[i] = Math.min(leftMin[i - 1], arr[i]);

  rightMax[n - 1] = arr[n - 1];
  for (let i = n - 2; i >= 0; i--) rightMax[i] = Math.max(rightMax[i + 1], arr[i]);

  for (let j = 1; j < n - 1; j++) {
    if (leftMin[j] < arr[j] && arr[j] < rightMax[j]) {
      return [leftMin[j], arr[j], rightMax[j]];
    }
  }
  return null;
}

// --- Solution 3: Optimal — Track small and mid --- O(n)/O(1)
function findTripletOptimal(arr) {
  let small = Infinity, mid = Infinity;

  for (const val of arr) {
    if (val <= small) {
      small = val;
    } else if (val <= mid) {
      mid = val;
    } else {
      return [small, mid, val]; // found! small < mid < val
    }
  }
  return null;
}

// --- Test ---
const tests = [
  { arr: [12, 11, 10, 5, 6, 2, 30], expected: true },
  { arr: [1, 2, 3, 4], expected: true },
  { arr: [4, 3, 2, 1], expected: false },
  { arr: [1, 1, 1], expected: false },
  { arr: [5, 1, 3, 2, 4], expected: true },
  { arr: [2, 4, 1, 3, 5], expected: true },
];

for (const { name, fn } of [
  { name: "Brute", fn: findTripletBrute },
  { name: "Aux", fn: findTripletAux },
  { name: "Optimal", fn: findTripletOptimal },
]) {
  console.log(`\n=== ${name} ===`);
  for (const { arr, expected } of tests) {
    const res = fn([...arr]);
    const ok = expected ? (res !== null && res[0] < res[1] && res[1] < res[2]) : res === null;
    console.log(`[${arr}] → ${res ? `[${res}]` : "null"} ${ok ? "✅" : "❌"}`);
  }
}
