// ============================================================
// Stock Buy and Sell — Multiple Transactions Allowed
// LeetCode #122 / GfG Easy
// Key insight: sum ALL positive consecutive differences
// ============================================================

// --- Solution 1: Peak-Valley --- O(n)
function maxProfitPeakValley(prices) {
  const n = prices.length;
  if (n < 2) return 0;

  let totalProfit = 0;
  let i = 0;

  while (i < n - 1) {
    // Find valley (local minimum)
    while (i < n - 1 && prices[i] >= prices[i + 1]) {
      i++;
    }
    const valley = prices[i];

    // Find peak (local maximum)
    while (i < n - 1 && prices[i] <= prices[i + 1]) {
      i++;
    }
    const peak = prices[i];

    totalProfit += peak - valley;
  }

  return totalProfit;
}

// --- Solution 2: Greedy (Sum consecutive gains) --- O(n)
function maxProfitGreedy(prices) {
  let totalProfit = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      totalProfit += prices[i] - prices[i - 1];
    }
  }

  return totalProfit;
}

// --- Test ---
const tests = [
  { prices: [100, 180, 260, 310, 40, 535, 695], expected: 865 },
  { prices: [4, 2], expected: 0 },
  { prices: [1, 2, 3, 4, 5], expected: 4 },
  { prices: [5, 4, 3, 2, 1], expected: 0 },
  { prices: [7, 1, 5, 3, 6, 4], expected: 7 },
  { prices: [1], expected: 0 },
  { prices: [3, 3, 3], expected: 0 },
  { prices: [1, 2], expected: 1 },
];

console.log("=== Peak-Valley ===");
for (const { prices, expected } of tests) {
  const res = maxProfitPeakValley(prices);
  console.log(`[${prices}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}

console.log("\n=== Greedy ===");
for (const { prices, expected } of tests) {
  const res = maxProfitGreedy(prices);
  console.log(`[${prices}] → ${res} ${res === expected ? "✅" : `❌ expected ${expected}`}`);
}
