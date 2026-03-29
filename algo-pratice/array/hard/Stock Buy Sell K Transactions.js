// ═══════════════════════════════════════════════════════════════
// Stock Buy and Sell — At Most K Transactions
// ═══════════════════════════════════════════════════════════════

// ─── Helper: Unlimited Profit (Greedy) ────────────────────────
function unlimitedProfit(prices) {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      profit += prices[i] - prices[i - 1];
    }
  }
  return profit;
}

// ─── Solution: DP — O(n×k) time, O(k) space ⭐ ───────────────
function maxProfit(prices, k) {
  const n = prices.length;
  if (n <= 1 || k === 0) return 0;

  // Optimization: k ≥ n/2 → unlimited
  if (k >= Math.floor(n / 2)) {
    return unlimitedProfit(prices);
  }

  // DP: buy[t], sell[t]
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);

  for (let d = 0; d < n; d++) {
    const price = prices[d];
    for (let t = 1; t <= k; t++) {
      sell[t] = Math.max(sell[t], buy[t] + price);
      buy[t] = Math.max(buy[t], sell[t - 1] - price);
    }
  }

  return Math.max(...sell);
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { prices: [10, 22, 5, 80], k: 2, expected: 87 },
  { prices: [90, 80, 70, 60, 50], k: 1, expected: 0 },
  { prices: [2, 4, 1], k: 1, expected: 2 },
  { prices: [3, 2, 6, 5, 0, 3], k: 2, expected: 7 },
  { prices: [1, 2, 3, 4, 5], k: 1, expected: 4 },
  { prices: [7, 1, 5, 3, 6, 4], k: 2, expected: 7 },
  { prices: [1], k: 1, expected: 0 },
  { prices: [1, 2], k: 1, expected: 1 },
];

console.log("=== Stock Buy Sell — K Transactions ===\n");
tests.forEach(({ prices, k, expected }) => {
  const result = maxProfit([...prices], k);
  const pass = result === expected;
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} prices=[${prices}], k=${k} → ${result} (expected ${expected})`
  );
});
