# AI Agents Fundamentals, v2 — Phần 10: Evaluators — "Turn Qualitative Into Quantitative!"

> 📅 2026-03-07 · ⏱ 22 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Evaluators — "It's Like An Assertion — The Thing That Scores!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core skill — Viết scorer cho AI Agent!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Evaluator = Assertion — "Qualitative → Quantitative!"     |
| 2   | Single Turn = Deterministic — "It's JSON, We Can Test!"   |
| 3   | Tool Selection Score — "F1 Score, Scales 0 to 1!"         |
| 4   | Forbidden Tool Score — "0 or 1, No In-Between!"           |
| 5   | Multi-Turn = Text — "We Need INTELLIGENCE To Score That!" |
| 6   | The Art of Scoring — "Science + Art + Guessing!"          |
| 7   | Tự Implement: Full Evaluator System                       |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu        |

---

## §1. Evaluator = Assertion — "Qualitative → Quantitative!"

> Scott: _"An evaluator is essentially like an ASSERTION. It's the thing that turns the qualitative thing to a quantitative thing."_

```
EVALUATOR — WHAT IT DOES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ INPUT:                                           │
  │ → Output from LLM (what it DID!)              │
  │ → Expected output (what it SHOULD do!)         │
  │                                                  │
  │ OUTPUT:                                          │
  │ → Score (0 to 1!)                              │
  │ → 1 = perfect!                                 │
  │ → 0 = complete failure!                        │
  │                                                  │
  │ "This thing would LOOK at the output and the    │
  │  expected output and try to GIVE IT A SCORE."   │
  │                                                  │
  │ Also called: SCORER!                             │
  │ "This is technically called a scorer, but        │
  │  we're calling them an evaluator."              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Single Turn = Deterministic — "It's JSON, We Can Test!"

> Scott: _"Tool calls are STRUCTURED OUTPUTS. It always spits back a JSON object. If it's JSON, we can write CODE against that that is DETERMINISTIC."_

```
WHY SINGLE TURN EVALS ARE EASIER:
═══════════════════════════════════════════════════════════════

  SINGLE TURN → Tool calls = JSON!
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ LLM returns:                                     │
  │ [{                                               │
  │   toolName: "dateTime",     ← Structured!      │
  │   args: {},                  ← Structured!      │
  │   toolCallId: "call_abc123" ← Structured!      │
  │ }]                                               │
  │                                                  │
  │ "It's a JSON object, so we can write CODE        │
  │  against that. We can TEST for these."          │
  │ "It's not spitting out a string, it's JSON."    │
  │                                                  │
  │ → DETERMINISTIC testing possible!              │
  │ → "Did this tool get called, yes or no?         │
  │    Yeah, that's deterministic."                  │
  │                                                  │
  └──────────────────────────────────────────────────┘

  MULTI TURN → Text output = Non-deterministic!
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Agent returns:                                   │
  │ "The current time is 3:30 PM and the NBA MVP    │
  │  candidates include Nikola Jokic and..."        │
  │                                                  │
  │ "Multi-turn returns TEXT. It's LANGUAGE.          │
  │  We can't score language without INTELLIGENCE,  │
  │  so we need some intelligence to score that."   │
  │                                                  │
  │ → Need LLM-as-judge or human review!           │
  │ → MUCH harder to evaluate!                     │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ┌────────────────────┬─────────────┬─────────────────┐
  │                    │ Single Turn │ Multi Turn       │
  ├────────────────────┼─────────────┼─────────────────┤
  │ Output type        │ JSON!       │ Text!            │
  │ Testable with code │ ✅ Yes!     │ ❌ No!           │
  │ Deterministic      │ ✅ Yes!     │ ❌ No!           │
  │ Scoring method     │ Code logic! │ LLM/Human judge!│
  │ Complexity         │ Simple!     │ "INSANE!"        │
  └────────────────────┴─────────────┴─────────────────┘
```

---

## §3. Tool Selection Score — "F1 Score, Scales 0 to 1!"

> Scott: _"There is this thing called an F1 score. It's going to give you a score based on how many hits you got correctly — expected tools vs actual tools."_

```javascript
// TOOL SELECTION SCORER — From Scott's code!

function toolSelectionScore(expected, actual) {
  // expected = tools we SAID it should call
  // actual   = tools LLM ACTUALLY called

  // Example:
  // expected: ["dateTime", "webSearch"]
  // actual:   ["dateTime"]
  // → Not perfect, missed webSearch!

  // Count hits (correct matches!)
  const hits = actual.filter((tool) => expected.includes(tool));

  // If perfect match:
  if (hits.length === expected.length && actual.length === expected.length) {
    return 1.0; // Perfect score!
  }

  // Otherwise: F1 score!
  // F1 = 2 * (precision * recall) / (precision + recall)
  const precision = hits.length / actual.length;
  const recall = hits.length / expected.length;

  if (precision + recall === 0) return 0;

  const f1 = (2 * (precision * recall)) / (precision + recall);
  return f1;
}
```

```
F1 SCORE — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PRECISION = Of what I selected, how many right? │
  │ RECALL    = Of what was expected, how many hit? │
  │                                                  │
  │ F1 = 2 × (precision × recall)                   │
  │          ─────────────────────                   │
  │          (precision + recall)                    │
  │                                                  │
  │ EXAMPLE 1: Perfect match!                        │
  │ Expected: [dateTime]                             │
  │ Actual:   [dateTime]                             │
  │ → Precision: 1/1 = 1.0                         │
  │ → Recall:    1/1 = 1.0                         │
  │ → F1 = 1.0 ✅                                  │
  │                                                  │
  │ EXAMPLE 2: Missed one!                           │
  │ Expected: [dateTime, webSearch]                  │
  │ Actual:   [dateTime]                             │
  │ → Precision: 1/1 = 1.0 (what I picked was right)│
  │ → Recall:    1/2 = 0.5 (only got half!)        │
  │ → F1 = 2×(1.0×0.5)/(1.0+0.5) = 0.67           │
  │                                                  │
  │ EXAMPLE 3: Extra + missed!                       │
  │ Expected: [dateTime, webSearch]                  │
  │ Actual:   [dateTime, writeFile]                  │
  │ → Precision: 1/2 = 0.5 (half my picks wrong!)  │
  │ → Recall:    1/2 = 0.5 (only got half!)        │
  │ → F1 = 2×(0.5×0.5)/(0.5+0.5) = 0.50           │
  │                                                  │
  │ EXAMPLE 4: Total miss!                           │
  │ Expected: [dateTime]                             │
  │ Actual:   [writeFile]                            │
  │ → Precision: 0/1 = 0                            │
  │ → Recall:    0/1 = 0                            │
  │ → F1 = 0.0 ❌                                  │
  │                                                  │
  │ Scott: "I don't know exactly how it works,       │
  │ but I've used it enough to find it pretty        │
  │ ACCURATE. It scales nicely from 0 to 1."        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Forbidden Tool Score — "0 or 1, No In-Between!"

> Scott: _"If you selected ANY tool I told you NOT to select, you FAIL. That's an immediate 0."_

```javascript
// FORBIDDEN TOOL SCORER — For negative cases!

function forbiddenToolScore(forbiddenTools, actualTools) {
  // forbiddenTools = tools LLM should NEVER call
  // actualTools    = tools LLM actually called

  // Check if ANY forbidden tool was selected:
  const violated = actualTools.some((tool) => forbiddenTools.includes(tool));

  // BINARY! No F1, no gradient!
  return violated ? 0.0 : 1.0;

  // "If any one of those is selected, it's a FAIL.
  //  It's a 0. There's no F1-ish score here.
  //  If you selected ANY tool I told you not to,
  //  you FAIL. That's an immediate 0."
}
```

```
FORBIDDEN TOOL SCORER — USE CASE:
═══════════════════════════════════════════════════════════════

  TEST DATA:
  ┌──────────────────────────────────────────────────┐
  │ input: "Tell me a joke about programming"        │
  │ forbiddenTools: ["webSearch", "writeFile",       │
  │                  "runCommand", "dateTime"]       │
  │ expectedBehavior: "Just tell a joke! No tools!" │
  └──────────────────────────────────────────────────┘

  SCENARIO A: Agent just responds (correct!)
  ┌──────────────────────────────────────────────────┐
  │ actual toolCalls: []  (no tools called!)        │
  │ text: "Why do programmers prefer dark mode?..."  │
  │ → forbiddenToolScore = 1.0 ✅                  │
  │   "Good! You answered without using tools!"     │
  └──────────────────────────────────────────────────┘

  SCENARIO B: Agent calls webSearch (BAD!)
  ┌──────────────────────────────────────────────────┐
  │ actual toolCalls: ["webSearch"]                  │
  │ → forbiddenToolScore = 0.0 ❌                  │
  │   "WHY are you searching the web for a joke?    │
  │    That's a tool I told you NOT to use!"        │
  │   "Oh sure, let me pick the Gmail tool to       │
  │    mop your floor. Why are you DOING that?"     │
  └──────────────────────────────────────────────────┘
```

---

## §5. Multi-Turn = Text — "We Need INTELLIGENCE To Score That!"

> Scott: _"Multi-turn returns TEXT. We can't score LANGUAGE without intelligence. So we need some intelligence to score that language."_

```
SINGLE TURN vs MULTI TURN SCORING:
═══════════════════════════════════════════════════════════════

  SINGLE TURN (what we're doing now!):
  ┌──────────────────────────────────────────────────┐
  │ Output: JSON tool calls!                         │
  │ Score with: CODE (deterministic!)               │
  │                                                  │
  │ toolCalls: [{ toolName: "dateTime", args: {} }] │
  │                 ↓                                │
  │ toolSelectionScore(expected, actual)             │
  │ → 1.0 or 0.67 or 0.0                           │
  │                                                  │
  │ "Just objects we can test for."                  │
  │ "Three lines of code, nothing crazy."           │
  └──────────────────────────────────────────────────┘

  MULTI TURN (later!):
  ┌──────────────────────────────────────────────────┐
  │ Output: TEXT! Natural language!                  │
  │ Score with: LLM-as-judge or HUMAN!              │
  │                                                  │
  │ text: "Based on my search, the NBA MVP is..."   │
  │                 ↓                                │
  │ ??? How to score this ???                        │
  │ → Need another LLM to read and judge!          │
  │ → Or a human expert to rate it!                │
  │                                                  │
  │ "We can't score language without intelligence." │
  │ "Multi-turn stuff is INSANE."                    │
  │ "It's absolutely INSANE."                        │
  └──────────────────────────────────────────────────┘
```

---

## §6. The Art of Scoring — "Science + Art + Guessing!"

> Scott: _"This is someone's JOB to come up with metrics. It is literally science and art and kind of guessing."_

```
THE REALITY OF EVAL ENGINEERING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ "You can get really CREATIVE with these scores.  │
  │  And this is just SCRATCHING THE SURFACE."      │
  │                                                  │
  │ "This is just like single turn. Multi-turn       │
  │  stuff is INSANE. It's absolutely insane."      │
  │                                                  │
  │ WHO DOES THIS:                                   │
  │ "This is someone's JOB to come up with metrics  │
  │  and figure out what matters. Create them.       │
  │  Update them."                                   │
  │                                                  │
  │ → Data science people                          │
  │ → ML engineers                                 │
  │ → Combination of both!                         │
  │ → "It is very complicated."                    │
  │                                                  │
  │ THE ONGOING PROCESS:                             │
  │ "Figure out interesting ways as the agent gets   │
  │  more abilities and tools and possibilities.     │
  │  Update the scores. Are they still relevant?    │
  │  Are there NEW ones we need to introduce?"      │
  │                                                  │
  │ "It is literally SCIENCE and ART and             │
  │  kind of GUESSING."                              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Full Evaluator System

```javascript
// COMPLETE EVALUATOR SYSTEM — From scratch!

// ═══════════════════════════════════════════════
// SCORER 1: Tool Selection (F1 Score!)
// ═══════════════════════════════════════════════

function toolSelectionScore(expectedTools, actualToolCalls) {
  const actual = actualToolCalls.map((tc) => tc.toolName);

  if (expectedTools.length === 0 && actual.length === 0) {
    return 1.0; // Both empty = correct (no tools needed!)
  }

  if (expectedTools.length === 0 || actual.length === 0) {
    return 0.0; // One empty, other not = mismatch!
  }

  // Count hits
  const hits = actual.filter((t) => expectedTools.includes(t));

  // Perfect match shortcut
  if (
    hits.length === expectedTools.length &&
    actual.length === expectedTools.length
  ) {
    return 1.0;
  }

  // F1 score for partial matches
  const precision = hits.length / actual.length;
  const recall = hits.length / expectedTools.length;

  if (precision + recall === 0) return 0;

  return (2 * (precision * recall)) / (precision + recall);
}
```

```javascript
// ═══════════════════════════════════════════════
// SCORER 2: Tool Order (sequence matters!)
// ═══════════════════════════════════════════════

function toolOrderScore(expectedOrder, actualToolCalls) {
  const actual = actualToolCalls.map((tc) => tc.toolName);

  if (!expectedOrder || expectedOrder.length === 0) {
    return 1.0; // No order requirement!
  }

  if (actual.length !== expectedOrder.length) {
    return 0.0; // Different lengths = wrong!
  }

  let matches = 0;
  for (let i = 0; i < expectedOrder.length; i++) {
    if (actual[i] === expectedOrder[i]) {
      matches++;
    }
  }

  return matches / expectedOrder.length;
  // 1.0 = perfect order!
  // 0.5 = half in right position!
  // 0.0 = nothing in right position!
}
```

```javascript
// ═══════════════════════════════════════════════
// SCORER 3: Forbidden Tools (binary 0 or 1!)
// ═══════════════════════════════════════════════

function forbiddenToolScore(forbiddenTools, actualToolCalls) {
  const actual = actualToolCalls.map((tc) => tc.toolName);

  // "If you selected ANY tool I told you not to,
  //  you FAIL. That's an immediate 0."
  const violated = actual.some((t) => forbiddenTools.includes(t));

  return violated ? 0.0 : 1.0;
  // Binary! No gradient! ZERO or ONE!
}
```

```javascript
// ═══════════════════════════════════════════════
// FULL EVALUATION RUNNER
// ═══════════════════════════════════════════════

async function runSingleTurnEval(testCase, agentResult) {
  const scores = {};

  // Run appropriate scorers based on test case type:

  if (testCase.expectedTools) {
    scores.toolSelection = toolSelectionScore(
      testCase.expectedTools,
      agentResult.toolCalls || [],
    );
  }

  if (testCase.expectedToolOrder) {
    scores.toolOrder = toolOrderScore(
      testCase.expectedToolOrder,
      agentResult.toolCalls || [],
    );
  }

  if (testCase.forbiddenTools) {
    scores.forbiddenTool = forbiddenToolScore(
      testCase.forbiddenTools,
      agentResult.toolCalls || [],
    );
  }

  // Calculate overall score
  const scoreValues = Object.values(scores);
  const overall = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

  return { ...scores, overall };
}
```

```javascript
// ═══════════════════════════════════════════════
// TEST DATA — 3 Buckets!
// ═══════════════════════════════════════════════

const testData = [
  // GOLDEN: Must be perfect!
  {
    input: "What time is it right now?",
    expectedTools: ["dateTime"],
    expectedToolOrder: ["dateTime"],
    bucket: "golden",
  },

  // SECONDARY: Should figure it out!
  {
    input: "uhh date plz",
    expectedTools: ["dateTime"],
    // No expectedToolOrder — don't care!
    bucket: "secondary",
  },

  // NEGATIVE: Must NOT use tools!
  {
    input: "Tell me a joke",
    expectedTools: [],
    forbiddenTools: ["dateTime", "webSearch", "writeFile", "runCommand"],
    bucket: "negative",
  },
];

// Run all evals:
async function runAllEvals(agent) {
  const results = [];

  for (const testCase of testData) {
    // Run agent for single turn
    const agentResult = await agent(testCase.input);

    // Evaluate
    const scores = await runSingleTurnEval(testCase, agentResult);

    results.push({
      input: testCase.input,
      bucket: testCase.bucket,
      scores,
    });

    console.log(
      `[${testCase.bucket}] "${testCase.input}"` +
        ` → ${scores.overall.toFixed(2)}`,
    );
  }

  // Overall averages by bucket
  const buckets = ["golden", "secondary", "negative"];
  for (const bucket of buckets) {
    const bucketResults = results.filter((r) => r.bucket === bucket);
    const avg =
      bucketResults.reduce((sum, r) => sum + r.scores.overall, 0) /
      bucketResults.length;

    console.log(`${bucket}: ${(avg * 100).toFixed(1)}%`);
  }
}
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — Evaluators

```
5 WHYS: TẠI SAO ĐÁNH GIÁ NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao single turn eval dùng code?
  └→ Vì tool calls là JSON — structured output!
     "We can write CODE against a JSON object.
     That's DETERMINISTIC."

  WHY ②: Tại sao multi turn cần LLM judge?
  └→ Vì output là TEXT — natural language!
     "We can't score LANGUAGE without intelligence."
     Code không hiểu ngôn ngữ tự nhiên!

  WHY ③: Tại sao dùng F1 score?
  └→ Vì cho phép partial credit!
     Not just 0 or 1 — "scales nicely from 0 to 1."
     Precision × recall = balanced measurement!

  WHY ④: Tại sao forbidden tool là binary?
  └→ Vì vi phạm là vi phạm! No gradient!
     "ANY tool you told me not to pick = FAIL!
     Immediate 0. No F1-ish score."

  WHY ⑤: Tại sao evaluators cần update liên tục?
  └→ Vì agent evolves! New tools, new abilities!
     "Are they still relevant? Are there NEW ones?"
     "It is literally science and art and guessing."
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EVALUATOR:
═══════════════════════════════════════════════════════════════

  EVALUATOR = function(output, expected) → score

  ┌──────────────────────────────────────────────────┐
  │ THREE TYPES:                                     │
  │                                                  │
  │ ① CODE-BASED (deterministic!):                  │
  │   → For structured data (JSON tool calls!)     │
  │   → toolSelectionScore, toolOrderScore          │
  │   → "Just objects we can test for!"             │
  │                                                  │
  │ ② LLM-BASED (non-deterministic!):               │
  │   → For text output (language!)                │
  │   → "Need intelligence to score language!"     │
  │   → Used in multi-turn evals!                  │
  │                                                  │
  │ ③ HUMAN-BASED (expensive!):                      │
  │   → Expert reviews output!                     │
  │   → Most accurate, least scalable!             │
  │   → Used for building golden datasets!         │
  │                                                  │
  │ "You can get really CREATIVE with these scores. │
  │  This is just SCRATCHING THE SURFACE."          │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — SCORER TYPES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ F1 Score      │ Binary (0/1)      │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Granularity      │ ✅ Gradient!  │ ❌ All or nothing!│
  │ Use case         │ Selection!    │ Forbidden tools!  │
  │ Partial credit   │ ✅ Yes!       │ ❌ No!            │
  │ Strictness       │ ⚠️ Lenient!   │ ✅ Strict!        │
  │ Simplicity       │ ⚠️ Math!      │ ✅ "3 lines!"     │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Code Scorer   │ LLM Judge         │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Works on         │ JSON!         │ Text!             │
  │ Deterministic    │ ✅ Yes!       │ ❌ No!            │
  │ Cost             │ ✅ Free!      │ ⚠️ API calls!     │
  │ Accuracy         │ ✅ Exact!     │ ⚠️ Approximate!   │
  │ Flexibility      │ ❌ Rigid!     │ ✅ Any text!      │
  │ Complexity       │ ✅ Simple!    │ ⚠️ Prompt design! │
  └──────────────────┴───────────────┴───────────────────┘
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — EVALUATOR ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  TEST CASE (from dataset):
  ┌─────────────────────────┐
  │ input: "What time?"     │
  │ expectedTools: [dateTime]│
  │ forbiddenTools: []      │
  │ bucket: "golden"        │
  └──────────┬──────────────┘
             │
             ▼
  RUN AGENT (single turn):
  ┌─────────────────────────┐
  │ toolCalls: [{           │
  │   toolName: "dateTime", │
  │   args: {}              │
  │ }]                      │
  └──────────┬──────────────┘
             │
    ┌────────┴────────┬──────────────┐
    ▼                 ▼              ▼
  Scorer 1         Scorer 2       Scorer 3
  toolSelection    toolOrder      forbidden
  F1 score!        Sequence!      Binary!
    │                 │              │
    ▼                 ▼              ▼
  1.0              1.0            1.0
    │                 │              │
    └────────┬────────┘──────────────┘
             ▼
  Overall: (1.0 + 1.0 + 1.0) / 3 = 1.0 ✅
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — F1 SCORE:
═══════════════════════════════════════════════════════════════

  F1 Score đến từ Information Retrieval!
  (Lĩnh vực tìm kiếm thông tin!)

  ┌──────────────────────────────────────────────────┐
  │ PRECISION:                                       │
  │ "Of what I SELECTED, how many were CORRECT?"    │
  │ → precision = correct_hits / total_selected    │
  │ → Penalizes EXTRA picks!                       │
  │                                                  │
  │ RECALL:                                          │
  │ "Of what was EXPECTED, how many did I GET?"     │
  │ → recall = correct_hits / total_expected        │
  │ → Penalizes MISSING picks!                     │
  │                                                  │
  │ F1 = Harmonic mean of both!                      │
  │ → Balanced! Neither too forgiving nor harsh!    │
  │ → 1.0 = all correct, none missed, none extra!  │
  │ → 0.0 = complete mismatch!                     │
  │                                                  │
  │ WHY HARMONIC MEAN (not arithmetic)?              │
  │ → Punishes extreme imbalances!                 │
  │ → precision=1.0, recall=0.0 → F1=0.0!         │
  │   (You picked 1 correct but missed 9 others!)  │
  │ → Arithmetic would say 0.5 — too generous!     │
  └──────────────────────────────────────────────────┘
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — EVALUATION METHODS:
═══════════════════════════════════════════════════════════════

  1960s: Precision & Recall in IR
  │ → Information retrieval research!
  │ → F1 score = harmonic mean!
  │
  ↓
  2000s: ML Model evaluation
  │ → Accuracy, F1, AUC, BLEU, ROUGE!
  │ → Standardized metrics for models!
  │
  ↓
  2023: LLM evaluation crisis
  │ → "How do you score TEXT?"
  │ → LLM-as-judge emerges!
  │ → "Non-deterministic judging!"
  │
  ↓
  2024: Agent evaluation
  │ → Tool calls = structured = testable!
  │ → Single turn vs multi-turn!
  │ → "Single turn is like unit testing"
  │
  ↓
  NOW: "Science + Art + Guessing!"
  │ → Scott: "This is someone's JOB."
  │ → "Data science + ML engineers"
  │ → "Scratching the SURFACE!"
  │ → "Multi-turn is absolutely INSANE!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 10:
═══════════════════════════════════════════════════════════════

  EVALUATOR CONCEPT:
  [ ] Evaluator = assertion! Score output!
  [ ] "Turn qualitative → quantitative!"
  [ ] Score range: 0 (fail) to 1 (perfect)!

  SINGLE TURN vs MULTI TURN:
  [ ] Single turn → JSON → test with CODE!
  [ ] Multi turn → text → need INTELLIGENCE!
  [ ] "We can't score language without intelligence!"

  SCORERS:
  [ ] Tool Selection → F1 score (0 to 1, gradient!)
  [ ] Tool Order → sequence matching!
  [ ] Forbidden Tools → binary 0 or 1! "Immediate fail!"

  F1 SCORE:
  [ ] precision = hits / selected!
  [ ] recall = hits / expected!
  [ ] F1 = 2 × (p × r) / (p + r)!
  [ ] "Scales nicely from 0 to 1!"

  THE ART:
  [ ] "Science + art + guessing!"
  [ ] "Someone's JOB — data science + ML!"
  [ ] "Scratching the surface!"
  [ ] "Multi-turn is ABSOLUTELY INSANE!"

  TIẾP THEO → Phần 11: Running Evals!
```
