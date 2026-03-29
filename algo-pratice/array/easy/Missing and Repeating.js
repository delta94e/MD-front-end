// ============================================================
// Missing and Repeating in an Array
// Array of size n, elements 1..n, one missing, one repeated
// Find both the duplicate and the missing number
// ============================================================

// --- Solution 1: HashMap (Frequency Count) --- O(n)/O(n)
function findMissingRepeatingMap(arr) {
  const n = arr.length;
  const freq = new Map();
  let repeating = -1, missing = -1;

  for (const val of arr) {
    freq.set(val, (freq.get(val) || 0) + 1);
  }

  for (let i = 1; i <= n; i++) {
    const count = freq.get(i) || 0;
    if (count === 2) repeating = i;
    if (count === 0) missing = i;
  }

  return [repeating, missing];
}

// --- Solution 2: Math (Sum + Sum of Squares) --- O(n)/O(1)
function findMissingRepeatingMath(arr) {
  const n = arr.length;

  // S - Sn = repeating - missing
  let sumDiff = 0;
  let sqDiff = 0;
  for (let i = 0; i < n; i++) {
    sumDiff += arr[i] - (i + 1);       // S - Sn
    sqDiff += arr[i] * arr[i] - (i + 1) * (i + 1); // S² - Sn²
  }

  // sumDiff = R - M
  // sqDiff = R² - M² = (R-M)(R+M)
  // sumPlus = (R+M) = sqDiff / sumDiff
  const sumPlus = sqDiff / sumDiff;

  const repeating = (sumDiff + sumPlus) / 2;
  const missing = (sumPlus - sumDiff) / 2;

  return [repeating, missing];
}

// --- Solution 3: XOR --- O(n)/O(1)
function findMissingRepeatingXOR(arr) {
  const n = arr.length;

  // Step 1: XOR all array elements and 1..n
  let xorAll = 0;
  for (let i = 0; i < n; i++) {
    xorAll ^= arr[i];
    xorAll ^= (i + 1);
  }
  // xorAll = repeating ^ missing

  // Step 2: Find rightmost set bit
  const setBit = xorAll & (-xorAll);

  // Step 3: Partition into two groups
  let group0 = 0, group1 = 0;
  for (let i = 0; i < n; i++) {
    if (arr[i] & setBit) group1 ^= arr[i];
    else group0 ^= arr[i];

    if ((i + 1) & setBit) group1 ^= (i + 1);
    else group0 ^= (i + 1);
  }

  // Step 4: Determine which is repeating, which is missing
  for (const val of arr) {
    if (val === group0) return [group0, group1];
  }
  return [group1, group0];
}

// --- Solution 4: Index Marking (Negate) --- O(n)/O(1)
function findMissingRepeatingMark(arr) {
  const a = [...arr]; // copy to avoid mutating input
  const n = a.length;
  let repeating = -1, missing = -1;

  // Mark visited by negating
  for (let i = 0; i < n; i++) {
    const idx = Math.abs(a[i]) - 1;
    if (a[idx] < 0) {
      repeating = Math.abs(a[i]);
    } else {
      a[idx] = -a[idx];
    }
  }

  // Find unmarked (positive) → missing
  for (let i = 0; i < n; i++) {
    if (a[i] > 0) {
      missing = i + 1;
      break;
    }
  }

  return [repeating, missing];
}

// --- Test ---
const tests = [
  { arr: [3, 1, 3], expected: [3, 2] },
  { arr: [4, 3, 6, 2, 1, 1], expected: [1, 5] },
  { arr: [1, 1], expected: [1, 2] },
  { arr: [2, 2], expected: [2, 1] },
  { arr: [2, 3, 1, 5, 1], expected: [1, 4] },
  { arr: [1, 3, 2, 5, 4, 6, 7, 5], expected: [5, 8] },
];

const solutions = [
  { name: "HashMap", fn: findMissingRepeatingMap },
  { name: "Math", fn: findMissingRepeatingMath },
  { name: "XOR", fn: findMissingRepeatingXOR },
  { name: "Index Mark", fn: findMissingRepeatingMark },
];

for (const { name, fn } of solutions) {
  console.log(`\n=== ${name} ===`);
  for (const { arr, expected } of tests) {
    const res = fn([...arr]);
    const ok = res[0] === expected[0] && res[1] === expected[1];
    console.log(`[${arr}] → [${res}] ${ok ? "✅" : `❌ expected [${expected}]`}`);
  }
}
