// ═══════════════════════════════════════════════════════════════
// Trapping Rain Water
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Prefix Max + Suffix Max — O(n) time, O(n) space
function trapPrefixSuffix(height) {
  const n = height.length;
  if (n <= 2) return 0;

  const leftMax = new Array(n);
  const rightMax = new Array(n);

  leftMax[0] = height[0];
  for (let i = 1; i < n; i++) {
    leftMax[i] = Math.max(leftMax[i - 1], height[i]);
  }

  rightMax[n - 1] = height[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    rightMax[i] = Math.max(rightMax[i + 1], height[i]);
  }

  let water = 0;
  for (let i = 0; i < n; i++) {
    water += Math.min(leftMax[i], rightMax[i]) - height[i];
  }

  return water;
}

// ─── Solution 2: Two Pointers — O(n) time, O(1) space ⭐ ──────
function trap(height) {
  const n = height.length;
  if (n <= 2) return 0;

  let left = 0,
    right = n - 1;
  let leftMax = 0,
    rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { height: [3, 0, 1, 0, 4, 0, 2], expected: 10 },
  { height: [3, 0, 2, 0, 4], expected: 7 },
  { height: [1, 2, 3, 4], expected: 0 },
  { height: [4, 3, 2, 1], expected: 0 },
  { height: [0, 1, 0, 2, 1, 0, 3], expected: 4 },
  { height: [], expected: 0 },
  { height: [5], expected: 0 },
  { height: [5, 2], expected: 0 },
  { height: [5, 2, 5], expected: 3 },
  { height: [2, 0, 2], expected: 2 },
];

const solutions = [
  { name: "Prefix + Suffix Max", fn: trapPrefixSuffix },
  { name: "Two Pointers ⭐", fn: trap },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ height, expected }) => {
    const result = fn([...height]);
    const pass = result === expected;
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} [${height}] → ${result} (expected ${expected})`
    );
  });
});
