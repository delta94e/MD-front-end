# The Last Algorithms Course You'll Want (Part 2) — Phần 8: Dynamic Programming & Bloom Filter — Wrapping Up!

> 📅 2026-03-09 · ⏱ 50 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Factorials & Fibonacci + Max Subarray + Coin Change Problem + Bloom Filter + Wrapping Up
> — "Using past results to compute future values, Kadane's algorithm, DP table, hash bits!"
> Độ khó: ⭐⭐⭐⭐ | Advanced — The epitome of skill issues!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Dynamic Programming là gì? — "Past Results → Future Values!" |
| 2   | Factorial — "Recursive → Iterative!"                         |
| 3   | Fibonacci — "The Classic DP Problem!"                        |
| 4   | Max Subarray (Kadane's) — "O(n³) → O(n)!"                    |
| 5   | Coin Change Problem — "The World's Worst Denominations!"     |
| 6   | Bloom Filter — "Fast Maybes, 100% Definite No's!"            |
| 7   | course Recap & Wrapping Up — "Need vs Want!"                 |
| 8   | Tự Code: DP + Bloom Filter from Scratch!                     |

---

## §1. Dynamic Programming là gì?

> Prime: _"Dynamic programming is using past results to compute future values. It's very, very simple."_

```
DYNAMIC PROGRAMMING:
═══════════════════════════════════════════════════════════════

  Core idea:
  → Use PREVIOUS ANSWERS to calculate NEXT answers!
  → Don't recompute the same thing twice!
  → Usually: recursion → iterative + memoization!

  Two approaches:
  1. TOP-DOWN (Memoization):
     → Start with big problem → break into subproblems!
     → Cache results of subproblems!
     → Usually recursive!

  2. BOTTOM-UP (Tabulation):
     → Start with smallest problem → build up!
     → Fill a table row by row!
     → Usually iterative! ← Prime prefers!

  "DP is hard. Anyone that says it's easy is being
   a jerk because it's not easy. I only know how to
   solve DP problems because I know how to solve those
   problems already." — Prime 😅

  "Skill issues — dynamic programming is the epitome
   of skill issues." — Prime 😂
```

---

## §2. Factorial — "Recursive → Iterative!"

```
FACTORIAL — SIMPLEST DP EXAMPLE:
═══════════════════════════════════════════════════════════════

  RECURSIVE (old people molding about no tail recursion!):

  function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1); // ← Not tail recursion!
  }

  Call stack: factorial(5)
  → 5 × factorial(4)
    → 4 × factorial(3)
      → 3 × factorial(2)
        → 2 × factorial(1)
          → 1!
        ← 2
      ← 6
    ← 24
  ← 120

  ITERATIVE (DP — use past to compute future!):

  function factorial(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i; // ← Previous result × current!
    }
    return result;
  }

  result: 1 → 2 → 6 → 24 → 120!

  "Typically, DP is a recursion to iterative solution,
   but you usually reduce the dimensions." — Prime
```

---

## §3. Fibonacci — "The Classic DP Problem!"

> Prime: _"For every single time you go down that tree, you're computing a huge subset over and over again."_

```
FIBONACCI — WHY RECURSION IS BAD:
═══════════════════════════════════════════════════════════════

  Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21...

  RECURSIVE (exponential!):
  function fib(n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
  }

  Call tree for fib(5):
              fib(5)
             /       \
          fib(4)     fib(3)       ← fib(3) computed TWICE!
         /    \      /    \
      fib(3) fib(2) fib(2) fib(1) ← fib(2) computed 3x!
      /   \
   fib(2) fib(1)
   /   \
 fib(1) fib(0)

  → O(2ⁿ) runtime! Exponential! 💀
  → "You're going to compute that value MULTIPLE TIMES.
     That is why people don't like this way." — Prime


ITERATIVE DP (linear!):
═══════════════════════════════════════════════════════════════

  function fib(n) {
    if (n <= 1) return n;
    let a = 0;  // fib(n-2)
    let b = 1;  // fib(n-1)
    for (let i = 2; i <= n; i++) {
      const temp = b;
      b = a + b;  // fib(n) = fib(n-1) + fib(n-2)!
      a = temp;
    }
    return b;
  }

  Steps for fib(7):
  i=2: a=0, b=1 → b=1, a=1     → fib(2)=1
  i=3: a=1, b=1 → b=2, a=1     → fib(3)=2
  i=4: a=1, b=2 → b=3, a=2     → fib(4)=3
  i=5: a=2, b=3 → b=5, a=3     → fib(5)=5
  i=6: a=3, b=5 → b=8, a=5     → fib(6)=8
  i=7: a=5, b=8 → b=13, a=8    → fib(7)=13!

  → O(n) runtime! O(1) space! ✅
  → "Using past results to calculate future values!" — Prime
```

---

## §4. Max Subarray (Kadane's Algorithm) — "O(n³) → O(n)!"

> Prime: _"At this point we know the maximum value. We start at 1. If you have an array of one, the maximum value is just that first element."_

```
MAX SUBARRAY PROBLEM:
═══════════════════════════════════════════════════════════════

  Array: [3, -4, 1, 2, -1, 5, -7]

  Find contiguous subarray with MAXIMUM sum!

  Answer: [1, 2, -1, 5] → sum = 7! ✅


NAIVE: O(n³)! — "Not what you want in your life!"
═══════════════════════════════════════════════════════════════

  For each start i:
    For each end j:
      Sum all elements from i to j → O(n)!
  → n × n × n = O(n³)! 💀

  "Unless you're multiplying matrices, n³ is bad." — Prime


KADANE'S ALGORITHM: O(n)!
═══════════════════════════════════════════════════════════════

  Array:    [3,  -4,  1,   2,  -1,  5,  -7]

  Two variables:
  → maxValue = current best answer!
  → currentSum = running sum of current subarray!

  RULE:
  → If currentSum < 0 → RESET to current element!
  → Otherwise → ADD current element!
  → Update maxValue if currentSum > maxValue!

  Walk-through:

  i=0: val=3
       currentSum=3, maxValue=3      ✅ Start!

  i=1: val=-4
       currentSum < 0? No (3)! → add: 3+(-4)=-1
       -1 > maxValue? No!
       currentSum=-1, maxValue=3

  i=2: val=1
       currentSum < 0? YES (-1)! → RESET: currentSum=1
       1 > maxValue(3)? No!
       currentSum=1, maxValue=3

  i=3: val=2
       currentSum < 0? No! → add: 1+2=3
       3 > maxValue(3)? No (equal)!
       currentSum=3, maxValue=3

  i=4: val=-1
       currentSum < 0? No! → add: 3+(-1)=2
       2 > maxValue(3)? No!
       currentSum=2, maxValue=3

  i=5: val=5
       currentSum < 0? No! → add: 2+5=7
       7 > maxValue(3)? YES! ✅ Update!
       currentSum=7, maxValue=7      ← NEW MAX!

  i=6: val=-7
       currentSum < 0? No! → add: 7+(-7)=0
       0 > maxValue(7)? No!
       currentSum=0, maxValue=7

  ANSWER: 7! (subarray [1, 2, -1, 5])!

  "We are using previous values to compute forward values.
   We're taking it and walking across this." — Prime
```

---

## §5. Coin Change Problem — "The World's Worst Denominations!"

> Prime: _"Given some number, how many different ways can we make change with these coins? We have chosen perhaps the world's worst denominations."_ 😂

```
COIN CHANGE PROBLEM:
═══════════════════════════════════════════════════════════════

  Coins: [3, 7, 8, 9]  ← "World's worst denominations!" — Prime
  Target: 15
  Question: How many WAYS to make change for 15?


DP TABLE:
═══════════════════════════════════════════════════════════════

  Build table: rows = coins, columns = amounts 0→15!

  Rule: ways[coin][amount] = ways[prev_coin][amount]
                            + ways[coin][amount - coin_value]

  → "Previous row's value" (ways WITHOUT this coin!)
  → + "Look back by coin size" (ways WITH this coin!)

       0  1  2  3  4  5  6  7  8  9  10  11  12  13  14  15
  ──────────────────────────────────────────────────────────
  [3]  1  0  0  1  0  0  1  0  0  1   0   0   1   0   0   1
  [7]  1  0  0  1  0  0  1  1  0  1   1   0   1   1   0   1
  [8]  1  0  0  1  0  0  1  1  1  1   1   1   1   1   1   2
  [9]  1  0  0  1  0  0  1  1  1  2   1   1   2   1   1   3

  ANSWER: 3 ways to make 15!

  Let's verify:
  1. 3+3+3+3+3 = 15 (five 3's!)
  2. 7+8 = 15!
  3. 3+3+9 = 15!

  "There's our three different ways we can make change!" — Prime


HOW THE TABLE WORKS:
═══════════════════════════════════════════════════════════════

  At cell [coin=7, amount=10]:
  → From above: ways[3][10] = 0 (can't make 10 with 3s!)
  → Look back: ways[7][10-7] = ways[7][3] = 1!
  → Total: 0 + 1 = 1!

  At cell [coin=9, amount=15]:
  → From above: ways[8][15] = 2
  → Look back: ways[9][15-9] = ways[9][6] = 1
  → Total: 2 + 1 = 3! ✅

  "This is where DP really made sense to me.
   You build past solutions to compute the next step.
   You don't recompute the same thing over and over." — Prime
```

---

## §6. Bloom Filter — "Fast Maybes, 100% Definite No's!"

> Prime: _"This is my favorite one. It's a very fast way to tell if something is in or not in a set."_

```
BLOOM FILTER:
═══════════════════════════════════════════════════════════════

  What it does:
  → "Definitely NOT in set" → 100% correct! ✅
  → "MAYBE in set" → could be false positive! ⚠️
  → NO FALSE NEGATIVES! ← Key property!

  "Chance of false positives, but NO chance
   of false negatives." — Prime

  How it works:
  1. Fixed-size bit array (all 0s initially!)
  2. K hash functions!
  3. To ADD: run all K hashes → set those bits to 1!
  4. To CHECK: run all K hashes → ALL bits 1? Maybe! Any 0? Definitely NOT!


  EXAMPLE (10-bit array, 3 hash functions!):

  h1(x) = x mod 10
  h2(x) = x² mod 10
  h3(x) = 2x mod 10

  Bit array: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  Index:      0  1  2  3  4  5  6  7  8  9

  INSERT 10:
  h1(10) = 0 → set bit 0!
  h2(10) = 100 mod 10 = 0 → set bit 0! (already set!)
  h3(10) = 20 mod 10 = 0 → set bit 0! (already set!)
  Array: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  INSERT 7:
  h1(7) = 7 → set bit 7!
  h2(7) = 49 mod 10 = 9 → set bit 9!
  h3(7) = 14 mod 10 = 4 → set bit 4!
  Array: [1, 0, 0, 0, 1, 0, 0, 1, 0, 1]


CHECK 8:
═══════════════════════════════════════════════════════════════
  h1(8) = 8 → bit 8 = 0! → NOT IN SET! ❌ Fast bail!
  "We can just fast bail right out of it." — Prime

CHECK 9:
  h1(9) = 9 → bit 9 = 1! → maybe...
  h2(9) = 81 mod 10 = 1 → bit 1 = 0! → NOT IN SET! ❌

CHECK 20 (FALSE POSITIVE!):
═══════════════════════════════════════════════════════════════
  h1(20) = 0 → bit 0 = 1! → maybe...
  h2(20) = 400 mod 10 = 0 → bit 0 = 1! → maybe...
  h3(20) = 40 mod 10 = 0 → bit 0 = 1! → MAYBE IN SET! ⚠️

  "Is 20 in the set? No! But it COULD BE.
   And so you use this if you have a really expensive
   operation that takes seconds of time." — Prime


  ⚠️ CANNOT REMOVE VALUES!
  → "You can't remove values because there's
     overlapping at any one point." — Prime
  → Removing bits would destroy other entries!
```

### Real-World Applications:

```
BLOOM FILTER APPLICATIONS:
═══════════════════════════════════════════════════════════════

  1. CHROME MALICIOUS WEBSITE CHECK:
  → "Chrome had a basic Bloom filter for malicious websites.
     Could you be malicious? Based on our hashing functions,
     you COULD be. Then verify against slower service." — Prime

  2. AKAMAI CDN "ONE-HIT WONDERS":
  → "One website got loaded. Do we cache it?
     Probably not right now, but if we see it again,
     we want to cache it." — Prime

  3. DATABASE QUERIES:
  → Check if key EXISTS before expensive disk lookup!
  → If Bloom says no → skip disk read!
  → If Bloom says maybe → do the lookup!

  4. SPELL CHECKERS:
  → Quick check: is this a valid word?
  → False positive = say valid for invalid word (rare, OK!)
  → False negative = never miss a valid word! ✅

  "This is probably one of the most practical algorithms
   we've shown today. You can actually do something
   with this in the real world pretty easily." — Prime
```

---

## §7. Course Recap & Wrapping Up

> Prime: _"I hope at the end of this you never wanna look at algorithms again. That's why the other one's the one you need, this one's the one you want to stop wanting ever again."_ 😂

```
COURSE OVERVIEW — "NEED vs WANT":
═══════════════════════════════════════════════════════════════

  Part 1 (Need): Interview prep basics!
  → Arrays, Linked Lists, Stacks, Queues
  → Sorting, Binary Search
  → Trees, Graphs (BFS, DFS, Dijkstra's)

  Part 2 (Want): Deep understanding!
  → BST (traversals, deletion 3 cases!)
  → AVL Trees (balance factor, 4 rotations!)
  → Red-Black Trees (5 rules!)
  → M-Way Trees + B-Trees (split, promote, grow UP!)
  → Graphs (adjacency, BFS, DFS, topological sort!)
  → MST (Prim's, Kruskal's, Union-Find!)
  → Max Flow (Ford-Fulkerson, min cut!)
  → Dynamic Programming (Fibonacci, Kadane's, Coin Change!)
  → Bloom Filter (fast maybes!)


Q&A HIGHLIGHTS:
═══════════════════════════════════════════════════════════════

  Q: "Difference between DP and recursion?"
  A: "Recursion uses a stack and calls itself, you may solve
      the same sub-problem multiple times. DP avoids that." — Prime

  Q: "Drawbacks of DP?"
  A: "It's hard. Really good DP problems are hard until you
      understand it. Recursion is elegant, you can look at it
      and understand. DP is a skill issue." — Prime

  Q: "Does memorization relate to DP?"
  A: "We're memorizing! Remembering the previous answer.
      Same concept as React.memo — remember what came
      before, use the same value again." — Prime

  Q: "What language for implementing algorithms?"
  A: "Any language but Rust! Rust is horrible for data structures.
      You'll get stuck on a linked list and quit.
      C is great (actual picture!), TypeScript, Java, C#." — Prime 😂

  Q: "Is every graph problem reducible to a tree?"
  A: "Not all trees are graphs, not all graphs are trees.
      A tree is a directed acyclic graph, but not all DAGs
      are trees." — Prime


PRIME'S FINAL WORDS:
═══════════════════════════════════════════════════════════════

  "Solve them, do them, enjoy them, experience them."

  "Anytime you can make a concept go from something
   abstract in your head to practical in an editor,
   you're just plus one in your ability to solve
   larger and larger problems."

  "I really wanted to emphasize the fun stuff.
   Trees, graphs, and diving into analysis.
   B-trees: super useful. Union-Find path compression:
   pretty useful just to know."

  Prime's top picks from the course:
  → B-Trees: "Super, super-duper useful!"
  → Union-Find: "Amortized constant time, pretty cool!"
  → Prim's analysis: "We broke it down several levels!"
  → Bloom Filter: "Most practical algorithm shown today!"
```

---

## §8. Tự Code: DP + Bloom Filter from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: FACTORIAL (recursive vs iterative!)
// ═══════════════════════════════════════════════════════════

function factorialRecursive(n) {
  if (n <= 1) return 1;
  return n * factorialRecursive(n - 1);
}

function factorialDP(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

console.log(factorialDP(10)); // 3628800!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: FIBONACCI (3 approaches!)
// ═══════════════════════════════════════════════════════════

// ❌ Recursive: O(2ⁿ) — DON'T DO THIS!
function fibRecursive(n) {
  if (n <= 1) return n;
  return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// ✅ DP Top-Down (Memoization): O(n)!
function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

// ✅✅ DP Bottom-Up (Iterative): O(n) time, O(1) space!
function fibDP(n) {
  if (n <= 1) return n;
  let a = 0; // fib(i-2)
  let b = 1; // fib(i-1)
  for (let i = 2; i <= n; i++) {
    const temp = b;
    b = a + b;
    a = temp;
  }
  return b;
}

console.log(fibDP(50)); // 12586269025!
// fibRecursive(50) would take YEARS!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: MAX SUBARRAY — KADANE'S ALGORITHM!
// ═══════════════════════════════════════════════════════════

function maxSubarray(arr) {
  if (arr.length === 0) return { maxSum: 0, subarray: [] };

  let maxSum = arr[0];
  let currentSum = arr[0];
  let start = 0;
  let end = 0;
  let tempStart = 0;

  for (let i = 1; i < arr.length; i++) {
    // If currentSum is negative → RESET!
    if (currentSum < 0) {
      currentSum = arr[i];
      tempStart = i;
    } else {
      currentSum += arr[i];
    }

    // Update max if better!
    if (currentSum > maxSum) {
      maxSum = currentSum;
      start = tempStart;
      end = i;
    }
  }

  return {
    maxSum,
    subarray: arr.slice(start, end + 1),
  };
}

const result = maxSubarray([3, -4, 1, 2, -1, 5, -7]);
console.log("Max sum:", result.maxSum); // 7!
console.log("Subarray:", result.subarray); // [1, 2, -1, 5]!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: COIN CHANGE — DP TABLE!
// ═══════════════════════════════════════════════════════════

function coinChangeWays(coins, target) {
  // dp[i] = number of ways to make change for amount i!
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1; // 1 way to make 0: use no coins!

  // Process each coin type!
  for (const coin of coins) {
    for (let amount = coin; amount <= target; amount++) {
      // Add ways we can make (amount - coin)!
      dp[amount] += dp[amount - coin];
    }
  }

  return dp[target];
}

console.log(coinChangeWays([3, 7, 8, 9], 15)); // 3!
// Ways: 3+3+3+3+3=15, 7+8=15, 3+3+9=15!

// Bonus: MINIMUM coins to make change!
function minCoins(coins, target) {
  const dp = new Array(target + 1).fill(Infinity);
  dp[0] = 0;

  for (let amount = 1; amount <= target; amount++) {
    for (const coin of coins) {
      if (coin <= amount && dp[amount - coin] + 1 < dp[amount]) {
        dp[amount] = dp[amount - coin] + 1;
      }
    }
  }

  return dp[target] === Infinity ? -1 : dp[target];
}

console.log(minCoins([3, 7, 8, 9], 15)); // 2! (7+8!)
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: BLOOM FILTER!
// ═══════════════════════════════════════════════════════════

class BloomFilter {
  constructor(size = 1024) {
    this.size = size;
    this.bits = new Uint8Array(size); // Bit array!
    this.hashCount = 3; // Number of hash functions!
  }

  // Hash functions!
  _hash1(value) {
    return Math.abs(value) % this.size;
  }

  _hash2(value) {
    return Math.abs(value * value) % this.size;
  }

  _hash3(value) {
    return Math.abs(value * 2) % this.size;
  }

  // Better hash: string support!
  _hashString(str, seed) {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.size;
    }
    return Math.abs(hash);
  }

  _getHashes(value) {
    if (typeof value === "number") {
      return [this._hash1(value), this._hash2(value), this._hash3(value)];
    }
    const str = String(value);
    return [
      this._hashString(str, 7),
      this._hashString(str, 13),
      this._hashString(str, 31),
    ];
  }

  // ADD value to filter!
  add(value) {
    const hashes = this._getHashes(value);
    for (const h of hashes) {
      this.bits[h] = 1;
    }
  }

  // CHECK if value MIGHT be in filter!
  mightContain(value) {
    const hashes = this._getHashes(value);
    for (const h of hashes) {
      if (this.bits[h] === 0) return false; // DEFINITELY NOT! ❌
    }
    return true; // MAYBE! ⚠️
  }

  // Statistics!
  fillRate() {
    let filled = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.bits[i] === 1) filled++;
    }
    return ((filled / this.size) * 100).toFixed(2) + "%";
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 6: DEMO
// ═══════════════════════════════════════════════════════════

const bloom = new BloomFilter(1000);

// Add some values!
bloom.add(10);
bloom.add(7);
bloom.add(42);
bloom.add("hello");
bloom.add("world");

// Check!
console.log(bloom.mightContain(10)); // true ← Correct!
console.log(bloom.mightContain(7)); // true ← Correct!
console.log(bloom.mightContain(8)); // false ← Definitely NOT!
console.log(bloom.mightContain(9)); // false ← Definitely NOT!
console.log(bloom.mightContain("hello")); // true ← Correct!
console.log(bloom.mightContain("world")); // true ← Correct!
console.log(bloom.mightContain("foo")); // false ← Definitely NOT!

// False positive possibility!
console.log(bloom.mightContain(20)); // might be true! ⚠️
// 20 uses same hash slots as 10 → false positive!

console.log("Fill rate:", bloom.fillRate());

// Real-world usage: expensive URL check!
function checkMaliciousURL(url, bloom, expensiveCheck) {
  // Fast Bloom check first!
  if (!bloom.mightContain(url)) {
    return false; // Definitely not malicious! Skip expensive call!
  }

  // Maybe malicious → do expensive verification!
  return expensiveCheck(url);
}

// "Bloom filters allow for super fast maybes.
//  Maybes are way, way, way important.
//  You can do a lot of super cool stuff." — Prime
```

---

## Checklist — Toàn Bộ Khoá Học!

```
PART 2 COMPLETE CHECKLIST:
═══════════════════════════════════════════════════════════════

  TREES:
  [x] BST: search O(log n), insert/delete 3 cases!
  [x] AVL: balance factor, 4 rotations (RR/LL/LR/RL)!
  [x] Red-Black: 5 rules, 2x height worst case!
  [x] M-Way: multiple keys per node, x keys → x+1 children!
  [x] B-Tree: order, split & promote, grow UPWARDS!
  [x] B-Tree deletion: 4 leaf cases + 3 internal cases!

  GRAPHS:
  [x] Directed/Undirected, Weighted, Connected Components!
  [x] Adjacency List vs Matrix!
  [x] BFS: Queue, concentric rings, shortest path (unweighted)!
  [x] DFS: Stack, recursive, topological sort!
  [x] Prim's MST: greedy, O(E log V) with PIQ!
  [x] Kruskal's MST: sort edges, Union-Find, O(E log E)!
  [x] Union-Find: path compression = amortized O(1)!
  [x] Ford-Fulkerson: max flow, augmenting path, back links!
  [x] Min Cut = Max Flow! "Car algo British people!" 😂

  DYNAMIC PROGRAMMING:
  [x] "Using past results to compute future values!" — Prime
  [x] Fibonacci: O(2ⁿ) recursive → O(n) iterative!
  [x] Kadane's Max Subarray: O(n³) → O(n)!
  [x] Coin Change: DP table, look back by coin size!

  BONUS:
  [x] Bloom Filter: fast maybe, definite no, no removal!
  [x] "Most practical algorithm today!" — Prime

  🎓 COURSE COMPLETE! "Smarter, faster, stronger!"
```
