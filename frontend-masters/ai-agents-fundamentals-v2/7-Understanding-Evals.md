# AI Agents Fundamentals, v2 — Phần 7: Understanding Evals — "Without Evals, You're Flying BLIND!"

> 📅 2026-03-07 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Understanding Evals — "Evals Are NOT Tests, They're MEASUREMENTS!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Critical concept — Đo lường chất lượng Agent!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Single Turn Eval — "Unit Test For Agents!"                |
| 2   | Why Non-Deterministic? — "It's The GPU Kernel!"           |
| 3   | Tests vs Evals — "You MEASURE, Not Yes/No!"               |
| 4   | Snapshot Testing Analogy — "Compare Previous vs Current!" |
| 5   | Vibe-Coding — "It Worked On MY Computer!"                 |
| 6   | Offline vs Online Evals — "Thumbs Up, Thumbs Down!"       |
| 7   | LLM As Judge — "Non-Deterministic Judging!"               |
| 8   | The 5 Variables — "Things You Can Change!"                |
| 9   | Tự Implement: Eval System Concept                         |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu        |

---

## §1. Single Turn Eval — "Unit Test For Agents!"

> Scott: _"A single turn eval is just us evaling just ONE PASS. What are the things we want to track in just one pass of an agent?"_

```
SINGLE TURN vs FULL RUN EVALS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ SINGLE TURN EVAL (= Unit Test):                 │
  │ → Evaluate ONE pass of the agent!              │
  │ → Did it pick the right tool?                  │
  │ → Were the args correct?                       │
  │ → Was the output quality good?                 │
  │ → "Like UNIT TESTING almost!"                  │
  │                                                  │
  │ FULL RUN EVAL (= End-to-End Test):              │
  │ → Evaluate the ENTIRE agent run!               │
  │ → How many steps did it take?                  │
  │ → How many tool calls?                         │
  │ → Did it reach the right conclusion?           │
  │ → "Like an END-TO-END test!"                   │
  │                                                  │
  │ Scott: "Is this the official thing people do?    │
  │ No. There are NO STANDARDS on evals.            │
  │ This is what I'VE done. I like to eval on       │
  │ single turn, then eval the full run."           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Why Non-Deterministic? — "It's The GPU Kernel!"

> Scott: _"If I ask the LLM the same thing 3 times in a row, am I gonna get back the exact same thing? NO."_

```
WHY LLMs ARE NON-DETERMINISTIC:
═══════════════════════════════════════════════════════════════

  Q: "Even with temperature = 0 and same seed?"
  A: "STILL non-deterministic!"

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ THE RESEARCH PAPER:                              │
  │ "If you hit the SAME GPU and you were the ONLY  │
  │ request, temperature zero, everything same,      │
  │ you WILL most likely get deterministic results." │
  │                                                  │
  │ BUT:                                             │
  │ "Because you're hitting a GPU that's also        │
  │ responding to OTHER requests, there's something  │
  │ on the KERNEL LEVEL that affects the output.     │
  │ It introduces a bit of randomness that was NOT  │
  │ part of an algorithm."                           │
  │                                                  │
  │ ROOT CAUSE:                                      │
  │ → GPU kernel level!                             │
  │ → How math is done under DIFFERENT LOADS!       │
  │ → Infrastructure related!                       │
  │ → ELECTRICITY related!                          │
  │                                                  │
  │ Scott: "That is very FASCINATING. It's on a      │
  │ kernel level and it has to do with LOAD."        │
  │                                                  │
  │ PLUS:                                            │
  │ "Some models also like to sprinkle in a little  │
  │ RNG in there just to mess with you." 😄         │
  │                                                  │
  └──────────────────────────────────────────────────┘

  CÁC YẾU TỐ GÂY NON-DETERMINISTIC:
  ┌──────────────────────────────────────────────────┐
  │ ① Temperature > 0  → adds randomness!          │
  │ ② GPU load         → kernel-level variance!    │
  │ ③ Provider RNG     → intentional sprinkle!     │
  │ ④ Infrastructure   → which GPU, which node?    │
  │                                                  │
  │ Kết quả: KHÔNG THỂ test như code bình thường!  │
  │ → Must MEASURE, not assert!                    │
  └──────────────────────────────────────────────────┘
```

---

## §3. Tests vs Evals — "You MEASURE, Not Yes/No!"

> Scott: _"We can try to take this QUALITATIVE output from an LLM and QUANTIFY it. And then just MEASURE it. You don't test analytics, you MEASURE analytics."_

```
TESTS vs EVALS — FUNDAMENTAL DIFFERENCE:
═══════════════════════════════════════════════════════════════

  TESTS (Traditional Code):
  ┌──────────────────────────────────────────────────┐
  │ → Input is deterministic!                       │
  │ → Output is predictable!                       │
  │ → A or B or C — FINITE options!                │
  │ → Result: PASS or FAIL (boolean!)              │
  │ → "Yes or no. True or false."                  │
  │                                                  │
  │ expect(add(2, 3)).toBe(5);  // ✅ or ❌       │
  │ → Luôn trả về 5! Finite! Predictable!        │
  └──────────────────────────────────────────────────┘

  EVALS (AI/Agent):
  ┌──────────────────────────────────────────────────┐
  │ → Output is NON-DETERMINISTIC!                  │
  │ → Can't predict exact response!                │
  │ → Result: METRIC (0.0 → 1.0!)                 │
  │ → "It's not a boolean, it's a MEASUREMENT."    │
  │ → COMPARE previous vs current!                 │
  │                                                  │
  │ const score = evaluate(response);               │
  │ // score = 0.85 → Is this going UP or DOWN?    │
  │ // "You want it to go UP, not DOWN."            │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────┬───────────────────────────┐
  │ Tests               │ Evals                     │
  ├──────────────────────┼───────────────────────────┤
  │ Deterministic!       │ Non-deterministic!        │
  │ Pass/Fail!           │ Score/Metric!             │
  │ Finite options!      │ Infinite outputs!         │
  │ Boolean!             │ Measurement!              │
  │ One-time check!      │ Track over time!          │
  │ "Does it work?"      │ "Is it getting BETTER?"   │
  └──────────────────────┴───────────────────────────┘

  Scott: "You don't TEST analytics, you MEASURE
  analytics and you WATCH it. You see what happens.
  Does it go THIS way or THAT way? It's a METRIC."
```

---

## §4. Snapshot Testing Analogy — "Compare Previous vs Current!"

> Scott: _"An evaluation is a COMPARISON between something you know versus what you're currently doing. A test is just yes or no."_

```
SNAPSHOT TESTING — THE PERFECT ANALOGY:
═══════════════════════════════════════════════════════════════

  HOW SNAPSHOT TESTING WORKS:
  ┌──────────────────────────────────────────────────┐
  │ ① Take screenshot of web app!                  │
  │ ② Someone makes a change!                      │
  │ ③ Take NEW screenshot!                         │
  │ ④ Put them ON TOP of each other!               │
  │ ⑤ See what pixels DON'T MATCH!                 │
  │                                                  │
  │ "We do TONS of that at Netflix.                  │
  │  Thousands of those. Really effective."          │
  └──────────────────────────────────────────────────┘

  HOW EVALS WORK (same principle!):
  ┌──────────────────────────────────────────────────┐
  │ ① Run eval → get score 0.82!                   │
  │ ② Change something (prompt, tool, model!)      │
  │ ③ Run eval again → get score 0.87!             │
  │ ④ COMPARE: 0.87 > 0.82? → Going UP! ✅        │
  │                                                  │
  │ "You're evaluating the DISCREPANCY between      │
  │  the previous run and the next run."            │
  │                                                  │
  │ "You're not checking if something PASSED or     │
  │  FAILED. You're comparing THIS vs THAT."        │
  └──────────────────────────────────────────────────┘

  THE RULE:
  ┌──────────────────────────────────────────────────┐
  │ "Typically you don't want it going DOWN.         │
  │  You want the latest one to GO UP."             │
  │                                                  │
  │ "If it's BIGGER, that means you had a really    │
  │  huge breakthrough — whether you upgraded to    │
  │  a new model or made a new agent architecture.  │
  │  That's even BETTER."                            │
  │                                                  │
  │ "The SIZE of the difference doesn't matter.      │
  │  You just want the latest one to GO UP."        │
  └──────────────────────────────────────────────────┘
```

---

## §5. Vibe-Coding — "It Worked On MY Computer!"

> Scott: _"Without evals, you are literally FLYING BLIND. There's no way you can make a better agent without evals. I've tried it."_

```
THE VIBE-CODING TRAP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Scott's Story:                                   │
  │ "When I was running my company, we were just     │
  │ going off VIBES."                                │
  │                                                  │
  │ "I would do something and it was PERFECT.        │
  │  I was like 'oh my God, we figured out how      │
  │  to make the PERFECT agent!' And one of my      │
  │  co-founders would try it and be like,           │
  │  'This is SHIT.'"                                │
  │                                                  │
  │ "I'm like, what'd you type in?"                 │
  │ "And they're like, 'The thing you gave me.'"    │
  │ "And I'm like, 'No, that worked for me!         │
  │  I did it 10 TIMES IN A ROW, it worked!'"       │
  │                                                  │
  │ "There's something wrong with YOUR computer.    │
  │  Use MY computer! It's YOU!"                    │
  │                                                  │
  │ "And then, no. It was just the                   │
  │  NON-DETERMINISTIC nature of the thing           │
  │  and I wasn't MEASURING it."                     │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHAT IS VIBE-CODING:
  ┌──────────────────────────────────────────────────┐
  │ "I typed 3 prompts, it worked pretty good.       │
  │  SHIP IT."                                       │
  │                                                  │
  │ → Then one customer types the EXACT SAME thing! │
  │ → It DIES! 💀                                   │
  │ → "Damn, that worked on MINE."                  │
  │                                                  │
  │ Scott: "Vibe-coding came from people just        │
  │ making agents off VIBES."                        │
  │                                                  │
  │ SOLUTION: EVALS!                                 │
  │ → Measure, don't assume!                       │
  │ → Track scores over time!                      │
  │ → Compare changes!                             │
  │ → "Without evals, FLYING BLIND."               │
  └──────────────────────────────────────────────────┘
```

---

## §6. Offline vs Online Evals — "Thumbs Up, Thumbs Down!"

> Scott: _"Offline evals are very similar to tests. You just run them locally. Online evals — you use a chat app with thumbs up, thumbs down on the output."_

```
OFFLINE vs ONLINE EVALS:
═══════════════════════════════════════════════════════════════

  OFFLINE EVALS (what we're doing!):
  ┌──────────────────────────────────────────────────┐
  │ → Run LOCALLY on your machine!                  │
  │ → Very similar to running tests!               │
  │ → Not live, not real-time!                     │
  │ → "For the most part, you're running them       │
  │    locally, offline."                            │
  │ → "You wouldn't even need CI unless you         │
  │    really want to block on regressions."        │
  │ → Uses: test data, synthetic data, golden sets !│
  │                                                  │
  │ Like: npm test → but for AI quality!           │
  └──────────────────────────────────────────────────┘

  ONLINE EVALS (advanced, production!):
  ┌──────────────────────────────────────────────────┐
  │ → Live in production!                           │
  │ → Real user input → real evaluation!           │
  │ → 👍👎 next to chat output!                     │
  │                                                  │
  │ HOW IT WORKS:                                    │
  │ 1. User gets response from agent!              │
  │ 2. User clicks 👍 or 👎!                       │
  │ 3. Input + output → added to DATASET!          │
  │ 4. If 👎 → marked as BAD!                      │
  │ 5. Human-in-the-loop expert reviews!           │
  │ 6. OR another LLM evaluates!                   │
  │                                                  │
  │ "Way ADVANCED. For most people you don't        │
  │  really need that."                              │
  │                                                  │
  │ "Super EXPENSIVE, so you don't want to run it   │
  │  on every input. Maybe sample less than 1%."    │
  └──────────────────────────────────────────────────┘

  WHEN FAILURE HAPPENS — THE PROCESS:
  ┌──────────────────────────────────────────────────┐
  │ User 👎 → Why did it fail?                      │
  │                                                  │
  │ ├── User asked something agent CAN'T do?        │
  │ │   → "Screw them! Change our MARKETING!        │
  │ │      Make sure people aren't asking for that!" │
  │ │                                                │
  │ └── Agent SHOULD have done it but failed?       │
  │     → Why?                                      │
  │     → Change prompts!                           │
  │     → Change descriptions!                      │
  │     → Architecture issue?                       │
  │     → Missing tool coverage?                    │
  │     → "You gotta EXPERIMENT."                   │
  │     → "Then eval those changes to make sure     │
  │        that input-output pair PASSES."          │
  └──────────────────────────────────────────────────┘
```

---

## §7. LLM As Judge — "Non-Deterministic Judging!"

> Scott: _"Typically you would use an LLM as a judge — to have an LLM judge whether something is good or bad. Which is also NON-DETERMINISTIC!"_

```
LLM AS JUDGE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ CONCEPT:                                         │
  │ Use ANOTHER LLM to judge the output quality!    │
  │                                                  │
  │ Agent output → "Judge LLM" → Score (0-10)      │
  │                                                  │
  │ EXAMPLE:                                         │
  │ Input: "What is the current time?"               │
  │ Agent output: "The current time is 3:30 PM EST" │
  │ Judge prompt: "Rate this response 0-10 for       │
  │ accuracy and helpfulness."                       │
  │ Judge: 8/10                                      │
  │                                                  │
  │ ⚠️ PROBLEM:                                     │
  │ "Which is ALSO non-deterministic!"              │
  │ → The judge itself can give different scores!   │
  │ → But it's the best we have for now!            │
  │ → Run multiple times, take average!             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. The 5 Variables — "Things You Can Change!"

> Scott: _"Those are 5 different possible things that you could change to INFLUENCE the results of your evals."_

```
THE 5 VARIABLES YOU CAN TUNE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ① TOOLS (descriptions + schemas!)               │
  │   → Change description wording!                │
  │   → Add/remove tools!                          │
  │   → Change input schemas!                      │
  │                                                  │
  │ ② TOOL DESCRIPTIONS (per-input descriptions!)   │
  │   → Be more/less specific!                     │
  │   → Add usage hints!                           │
  │                                                  │
  │ ③ SYSTEM PROMPT (agent instructions!)            │
  │   → Personality, constraints, behavior!        │
  │   → "Be concise" vs "Be detailed"             │
  │                                                  │
  │ ④ CHAT HISTORY (conversation context!)           │
  │   → How much history to include?               │
  │   → Summarize or full history?                 │
  │                                                  │
  │ ⑤ MODEL (which LLM!)                            │
  │   → gpt-4o-mini vs gpt-4o vs Claude!          │
  │   → Different models = different results!      │
  │   → (+ hyperparameters like temperature!)      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  COMPLEXITY MULTIPLIER:
  ┌──────────────────────────────────────────────────┐
  │ Simple agent (ours): 5 variables!               │
  │ → Tools, descriptions, system prompt,           │
  │   chat history, model!                          │
  │                                                  │
  │ Complex agent: 5 × N variables!                 │
  │ → Sub-agents (agents talking to agents!)       │
  │ → Different reasoning logic!                   │
  │ → Chain of thought! ReAct!                     │
  │ → Planner + executor!                          │
  │                                                  │
  │ Scott: "That shit gets COMPLICATED.              │
  │ The more variables, the more things you          │
  │ gotta change to see if evals go UP."            │
  │                                                  │
  │ "It's KIND OF guessing and kind of NOT           │
  │  because it WORKS. All you have to do is         │
  │  know all the different things you can change   │
  │  and HOW to change them."                        │
  └──────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Eval System Concept

```javascript
// EVAL SYSTEM — Conceptual Implementation

// An eval has:
// 1. Input (what we ask the agent)
// 2. Expected behavior (what SHOULD happen)
// 3. Actual output (what DID happen)
// 4. Score (0.0 to 1.0)

// SINGLE TURN EVAL:
async function singleTurnEval(testCase) {
  const { input, expectedTool, expectedOutput } = testCase;

  // Run the agent for ONE turn
  const { toolCalls, text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: input,
    system: systemPrompt,
    tools,
  });

  // Score: Did it pick the RIGHT tool?
  const toolScore = toolCalls?.[0]?.toolName === expectedTool ? 1.0 : 0.0;

  // Score: Was the output quality good?
  // → Use LLM as judge!
  const qualityScore = await llmJudge(
    input,
    text || "used tool",
    expectedOutput,
  );

  return {
    input,
    toolScore,
    qualityScore,
    overall: (toolScore + qualityScore) / 2,
  };
}
```

```javascript
// LLM AS JUDGE — Another LLM evaluates quality

async function llmJudge(input, output, expected) {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `
      Rate the following response on a scale of 0 to 10:

      User asked: "${input}"
      Expected: "${expected}"
      Agent responded: "${output}"

      Score (just the number):
    `,
  });

  const score = parseInt(text) / 10; // Normalize to 0-1
  return score;

  // ⚠️ This is ALSO non-deterministic!
  // Run multiple times, take average!
}
```

```javascript
// EVAL RUNNER — Track scores over time!

async function runEvals(testCases) {
  const results = [];

  for (const testCase of testCases) {
    const result = await singleTurnEval(testCase);
    results.push(result);
  }

  // Calculate averages
  const avgToolScore = average(results.map((r) => r.toolScore));
  const avgQuality = average(results.map((r) => r.qualityScore));
  const avgOverall = average(results.map((r) => r.overall));

  console.log(`Tool accuracy: ${avgToolScore * 100}%`);
  console.log(`Quality score: ${avgQuality * 100}%`);
  console.log(`Overall score: ${avgOverall * 100}%`);

  // COMPARE with previous run!
  const previousScore = loadPreviousScore();
  const delta = avgOverall - previousScore;

  if (delta > 0) {
    console.log(`📈 Improved by ${delta * 100}%!`);
  } else if (delta < 0) {
    console.log(`📉 REGRESSION! Down by ${Math.abs(delta) * 100}%!`);
  } else {
    console.log(`→ No change.`);
  }

  // Save current as new baseline
  saveScore(avgOverall);
}

// Test cases (like a "golden dataset"):
const testCases = [
  {
    input: "What time is it?",
    expectedTool: "dateTime",
    expectedOutput: "Current time in ISO format",
  },
  {
    input: "Search for NBA MVP",
    expectedTool: "webSearch",
    expectedOutput: "Recent NBA MVP candidates",
  },
];
```

```javascript
// SNAPSHOT TESTING ANALOGY — In Code!

// Previous run:
const previousBaseline = {
  toolAccuracy: 0.85,
  qualityScore: 0.78,
  overall: 0.82,
  timestamp: "2026-03-06",
};

// Current run (after changing a tool description):
const currentRun = {
  toolAccuracy: 0.9, // ← UP! ✅
  qualityScore: 0.8, // ← UP! ✅
  overall: 0.85, // ← UP! ✅
  timestamp: "2026-03-07",
};

// Compare like snapshot testing:
// "Put them on top of each other and see
//  what pixels don't match."

function compareEvals(previous, current) {
  const toolDelta = current.toolAccuracy - previous.toolAccuracy;
  const qualityDelta = current.qualityScore - previous.qualityScore;
  const overallDelta = current.overall - previous.overall;

  // "You just want the latest one to GO UP."
  if (overallDelta > 0) {
    console.log("🎉 Eval scores improved!");
    console.log("Your change was GOOD! Keep it!");
  } else {
    console.log("⚠️ REGRESSION detected!");
    console.log("Your change made things WORSE! Revert!");
  }
}

// Scott: "It's like test coverage — 90% = confident!
// 30% of your code? I know you're SCARED!
// At least we're ACCOUNTING for something."
```

---

## §10. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 10.1 Pattern ①: 5 Whys — Evals

```
5 WHYS: TẠI SAO CẦN EVALS?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không dùng unit test?
  └→ Vì LLM output là NON-DETERMINISTIC!
     Same input ≠ same output!
     "Can't predict what output will be — infinite options!"

  WHY ②: Tại sao non-deterministic, kể cả temp=0?
  └→ Vì GPU kernel level! Load ảnh hưởng math!
     "Infrastructure related. Electricity related!"
     Research paper confirmed this!

  WHY ③: Tại sao cần COMPARE, không chỉ check?
  └→ Vì không có "correct answer" cố định!
     "An eval is a COMPARISON — previous vs current."
     "You don't test analytics, you MEASURE analytics!"

  WHY ④: Tại sao vibe-coding không work?
  └→ Vì "it worked on mine, 10 times in a row!"
     Nhưng co-founder try → "this is SHIT!"
     Non-deterministic = can't trust vibes!

  WHY ⑤: Tại sao cần evals trước khi build loop?
  └→ Vì "without evals = FLYING BLIND!"
     Must verify single turn quality first!
     Then build loop with confidence!
```

### 10.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EVALUATION:
═══════════════════════════════════════════════════════════════

  EVAL = Measure + Compare + Track

  ┌──────────────────────────────────────────────────┐
  │ MEASURE:                                         │
  │ → Take qualitative output!                     │
  │ → QUANTIFY it (score 0–1)!                     │
  │ → Use LLM as judge or heuristics!              │
  │                                                  │
  │ COMPARE:                                         │
  │ → Previous score vs current score!              │
  │ → "Put them on top of each other!"             │
  │ → Is it going UP or DOWN?                      │
  │                                                  │
  │ TRACK:                                           │
  │ → Over time, see trends!                        │
  │ → Regressions = something broke!               │
  │ → Improvements = change worked!                │
  │ → "Like test coverage but for AI quality!"     │
  └──────────────────────────────────────────────────┘
```

### 10.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — EVAL APPROACHES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Offline Evals │ Online Evals      │
  ├──────────────────┼───────────────┼───────────────────┤
  │ When             │ Dev time!     │ Production!       │
  │ Data             │ Synthetic!    │ Real users!       │
  │ Cost             │ ✅ Lower!     │ ❌ "Super         │
  │                  │               │   expensive!"     │
  │ Realism          │ ⚠️ Simulated! │ ✅ Real world!    │
  │ Complexity       │ ✅ Simple!    │ ❌ Complex!       │
  │ Edge cases       │ ⚠️ Predicted! │ ✅ "Real world    │
  │                  │               │   edge cases!"   │
  │ Frequency        │ Every change! │ "Sample < 1%!"   │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Vibes         │ Evals             │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Speed            │ ✅ Instant!   │ ⚠️ Takes time!    │
  │ Accuracy         │ ❌ "It's YOU" │ ✅ Measured!      │
  │ Reproducible     │ ❌ No!        │ ✅ Yes!           │
  │ Confidence       │ ❌ "Ship it!" │ ✅ "90% score!"   │
  │ Team trust       │ ❌ "It's your │ ✅ Data-backed!   │
  │                  │   computer!"  │                   │
  └──────────────────┴───────────────┴───────────────────┘
```

### 10.4 Pattern ④: Mental Mapping

```
MENTAL MAP — EVAL WORKFLOW:
═══════════════════════════════════════════════════════════════

  CHANGE SOMETHING:
  (prompt, tool description, model, etc.)
       │
       ▼
  RUN EVALS:
  ┌──────────────────────────────┐
  │ Test case 1 → score 0.90   │
  │ Test case 2 → score 0.85   │
  │ Test case 3 → score 0.70   │
  │ ...                         │
  │ Average score → 0.82       │
  └──────────────┬───────────────┘
                 │
                 ▼
  COMPARE WITH PREVIOUS:
  ┌──────────────────────────────┐
  │ Previous: 0.78              │
  │ Current:  0.82              │
  │ Delta:    +0.04 📈          │
  └──────────────┬───────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
     UP! ✅          DOWN! ⚠️
     Keep change!    Revert!
     New baseline!   Investigate!
```

### 10.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — NETFLIX SNAPSHOT TESTING:
═══════════════════════════════════════════════════════════════

  NETFLIX APPROACH (Scott worked there!):
  ┌──────────────────────────────────────────────────┐
  │ "We do TONS of that at Netflix.                  │
  │  Thousands of snapshot tests."                   │
  │                                                  │
  │ 1. Screenshot of UI → BASELINE!                │
  │ 2. Code change → new screenshot!              │
  │ 3. Overlay → find pixel differences!           │
  │ 4. Set THRESHOLDS!                              │
  │ 5. Expected changes? → New baseline!           │
  │    "I actually added a new button, so           │
  │    those pixels SHOULD be different."            │
  │                                                  │
  │ APPLY TO AGENTS:                                 │
  │ 1. Agent response → BASELINE score!            │
  │ 2. Change prompt → new response!              │
  │ 3. Compare → score difference!                 │
  │ 4. Set THRESHOLDS (don't drop below 0.80!)     │
  │ 5. Expected regression? → New baseline!         │
  └──────────────────────────────────────────────────┘
```

### 10.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — FROM VIBES TO EVALS:
═══════════════════════════════════════════════════════════════

  2022-2023: "The Vibe Era"
  │ → "I typed 3 prompts, it worked. Ship it!"
  │ → No measurement, no tracking!
  │ → "It worked on MY computer!"
  │
  ↓
  2023: Early eval attempts
  │ → Manual review of outputs!
  │ → Human judges (expensive, slow!)
  │ → No standardization!
  │
  ↓
  2024: LLM-as-Judge
  │ → Use LLM to evaluate LLM output!
  │ → Faster, cheaper than humans!
  │ → "Also non-deterministic, but works!"
  │ → Frameworks emerge!
  │
  ↓
  2025: Eval best practices
  │ → Offline evals (like unit tests!)
  │ → Online evals (thumbs up/down!)
  │ → Golden datasets, negative datasets!
  │ → Tracing + observability!
  │
  ↓
  NOW: "No standards, but opinions!"
  │ → Scott: "There are NO standards.
  │    This is what I'VE done."
  │ → Single turn + full run evals!
  │ → "Without evals = FLYING BLIND!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 7:
═══════════════════════════════════════════════════════════════

  WHY EVALS:
  [ ] LLMs are NON-DETERMINISTIC (GPU kernel level!)
  [ ] Can't use traditional tests!
  [ ] "Without evals = FLYING BLIND!"
  [ ] "Vibe-coding = it worked on MY computer!"

  TESTS vs EVALS:
  [ ] Tests = pass/fail, deterministic!
  [ ] Evals = scores, metrics, MEASUREMENTS!
  [ ] "You don't test analytics, you MEASURE!"
  [ ] Compare previous vs current!

  TYPES:
  [ ] Single turn = unit test for agents!
  [ ] Full run = end-to-end test for agents!
  [ ] Offline = run locally (what we're doing!)
  [ ] Online = production, thumbs up/down!

  THE 5 VARIABLES:
  [ ] Tools + descriptions!
  [ ] System prompt!
  [ ] Chat history!
  [ ] Model!
  [ ] (+ hyperparameters like temperature!)

  KEY QUOTES:
  [ ] "Evals are COMPARISONS, not booleans!"
  [ ] "Like snapshot testing at Netflix!"
  [ ] "Test coverage 30%? I know you're SCARED!"
  [ ] "No standards — just what I'VE done!"

  TIẾP THEO → Phần 8: Building The Agent Loop!
```
