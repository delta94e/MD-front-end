// ═══════════════════════════════════════════════════════════════
// Product of Array Except Self
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Brute Force — O(n²) ──────────────────────────
function productExceptSelfBrute(arr) {
  const n = arr.length;
  const res = [];

  for (let i = 0; i < n; i++) {
    let product = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) product *= arr[j];
    }
    res.push(product);
  }
  return res;
}

// ─── Solution 2: Prefix × Suffix (2 mảng) — O(n) time, O(n) space
function productExceptSelf2Arrays(arr) {
  const n = arr.length;
  const prefix = new Array(n);
  const suffix = new Array(n);
  const res = new Array(n);

  // Pass 1: Prefix products (trái → phải)
  prefix[0] = 1;
  for (let i = 1; i < n; i++) {
    prefix[i] = prefix[i - 1] * arr[i - 1];
  }

  // Pass 2: Suffix products (phải → trái)
  suffix[n - 1] = 1;
  for (let i = n - 2; i >= 0; i--) {
    suffix[i] = suffix[i + 1] * arr[i + 1];
  }

  // Pass 3: Kết hợp
  for (let i = 0; i < n; i++) {
    res[i] = prefix[i] * suffix[i];
  }

  return res;
}

// ─── Solution 3: Output as buffer — O(n) time, O(1) space ⭐ ──
function productExceptSelf(arr) {
  const n = arr.length;
  const res = new Array(n);

  // Pass 1: Lưu prefix VÀO res[]
  res[0] = 1;
  for (let i = 1; i < n; i++) {
    res[i] = res[i - 1] * arr[i - 1];
  }

  // Pass 2: Nhân suffix TRỰC TIẾP vào res[]
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    res[i] *= suffix;
    suffix *= arr[i];
  }

  return res;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { input: [10, 3, 5, 6, 2], expected: [180, 600, 360, 300, 900] },
  { input: [12, 0], expected: [0, 12] },
  { input: [0, 0], expected: [0, 0] },
  { input: [1, 2, 3, 4], expected: [24, 12, 8, 6] },
  { input: [1, 1], expected: [1, 1] },
  { input: [-1, 1, 0, -3, 3], expected: [0, 0, 9, 0, 0] },
  { input: [2, 3], expected: [3, 2] },
];

const solutions = [
  { name: "Brute Force", fn: productExceptSelfBrute },
  { name: "Prefix × Suffix (2 arrays)", fn: productExceptSelf2Arrays },
  { name: "Output as buffer ⭐", fn: productExceptSelf },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ input, expected }) => {
    const result = fn([...input]);
    const pass = JSON.stringify(result) === JSON.stringify(expected);
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} [${input}] → [${result}] (expected [${expected}])`
    );
  });
});
