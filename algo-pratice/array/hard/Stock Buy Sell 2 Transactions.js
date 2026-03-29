// ═══════════════════════════════════════════════════════════════
// Stock Buy and Sell — Max 2 Transactions Allowed
// ═══════════════════════════════════════════════════════════════

// ─── Solution: 4-Variable DP — O(n) time, O(1) space ⭐ ──────
function maxProfit2(prices) {
  const n = prices.length;
  if (n <= 1) return 0;

  let buy1 = -Infinity;
  let sell1 = 0;
  let buy2 = -Infinity;
  let sell2 = 0;

  for (const price of prices) {
    buy1 = Math.max(buy1, -price);
    sell1 = Math.max(sell1, buy1 + price);
    buy2 = Math.max(buy2, sell1 - price);
    sell2 = Math.max(sell2, buy2 + price);
  }

  return sell2;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { prices: [10, 22, 5, 75, 65, 80], expected: 87 },
  { prices: [100, 30, 15, 10, 8, 25, 80], expected: 72 },
  { prices: [90, 80, 70, 60, 50], expected: 0 },
  { prices: [1, 2, 3, 4, 5], expected: 4 },
  { prices: [3, 3, 5, 0, 0, 3, 1, 4], expected: 6 },
  { prices: [1, 2, 4, 2, 5, 7, 2, 4, 9, 0], expected: 13 },
  { prices: [1], expected: 0 },
  { prices: [1, 2], expected: 1 },
];

console.log("=== Stock Buy Sell — Max 2 Transactions ===\n");
tests.forEach(({ prices, expected }) => {
  const result = maxProfit2([...prices]);
  const pass = result === expected;
  const status = pass ? "✅" : "❌";
  console.log(
    `${status} [${prices}] → ${result} (expected ${expected})`
  );
});
