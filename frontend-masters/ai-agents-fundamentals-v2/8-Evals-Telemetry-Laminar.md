# AI Agents Fundamentals, v2 — Phần 8: Evals Telemetry with Laminar — Data, Scorers, Tracing!

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Evals Telemetry with Laminar — "Where Do You Get The Data? SYNTHETIC!"
> Độ khó: ⭐️⭐️⭐️ | Practical — Dataset design + Observability!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | Synthetic Data — "I Just Make That Fake Data!"              |
| 2   | 3 Loại Test Cases — Golden, Secondary, Negative!            |
| 3   | Hill Climbing — "First Run IS The Baseline!"                |
| 4   | Scorers — "Qualitative → Quantitative!"                     |
| 5   | Tracing & Open Telemetry — "Analytics For Your LLM!"        |
| 6   | Laminar — "Does Everything BrainTrust Does, But Better UI!" |
| 7   | Tự Implement: Dataset & Scorer System                       |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu          |

---

## §1. Synthetic Data — "I Just Make That Fake Data!"

> Scott: _"Where do you get the data? SYNTHETIC data. Most likely we'll start with that. This is data that WE make."_

```
SYNTHETIC DATA — HOW TO START:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PROBLEM: We need data to run evals!             │
  │ BUT: We don't have users yet!                   │
  │ SOLUTION: Make our OWN data!                    │
  │                                                  │
  │ Scott: "This is data that WE make. I'll think   │
  │ of the use cases in my head and I'll just make  │
  │ that FAKE data."                                 │
  │                                                  │
  │ LATER: Collect REAL data from users!            │
  │ → "From there I start collecting data as        │
  │    people use it and I'll add to those buckets."│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. 3 Loại Test Cases — Golden, Secondary, Negative!

> Scott: _"I like to make THREE different cases."_

```
3 BUCKETS OF TEST DATA:
═══════════════════════════════════════════════════════════════

  ① GOLDEN USE CASES (Must be PERFECT!):
  ┌──────────────────────────────────────────────────┐
  │ "I feel VERY STRONGLY if somebody typed this in, │
  │  our agent should be PERFECT."                   │
  │                                                  │
  │ "I know for a CERTAIN DEGREE it should do this  │
  │  and this and this IN THIS ORDER."              │
  │                                                  │
  │ → Clear prompts, clear expectations!           │
  │ → Know EXACT tool order!                       │
  │ → Agent MUST nail these!                       │
  │                                                  │
  │ Example:                                         │
  │ Input:    "What time is it?"                    │
  │ Expected: dateTime tool → ISO string!           │
  │ Order:    dateTime first, answer second!        │
  │ Score:    Must be 1.0!                          │
  └──────────────────────────────────────────────────┘

  ② SECONDARY USE CASES (Should still work!):
  ┌──────────────────────────────────────────────────┐
  │ "The user didn't really do a good job making     │
  │  a good prompt here, but the agent should still  │
  │  FIGURE IT OUT because it's smart enough."      │
  │                                                  │
  │ "I'm less confident in what that ORDER might     │
  │  be. I don't really care which order, I just    │
  │  want it to FIGURE IT OUT."                      │
  │                                                  │
  │ → Messy prompts, unclear requests!             │
  │ → Don't care about tool order!                 │
  │ → Just get the right answer!                   │
  │                                                  │
  │ Example:                                         │
  │ Input:    "uhh whats today"                     │
  │ Expected: Should still use dateTime!            │
  │ Order:    Don't care!                           │
  │ Score:    Aim for 0.7+                          │
  └──────────────────────────────────────────────────┘

  ③ NEGATIVE USE CASES (Should REFUSE!):
  ┌──────────────────────────────────────────────────┐
  │ "Somebody asked our agent to MOP THEIR FLOOR.   │
  │  The agent should just be like NO."              │
  │                                                  │
  │ "The agent should NOT go pick a tool. Oh sure,  │
  │  let me pick the Gmail tool to mop your floor.  │
  │  WHY ARE YOU DOING THAT? That would be bad."    │
  │                                                  │
  │ → Things agent should NOT handle!              │
  │ → Should refuse gracefully!                    │
  │ → Should NOT call any tools!                   │
  │                                                  │
  │ Example:                                         │
  │ Input:    "Mop my floor"                        │
  │ Expected: NO tool calls! Just refuse!           │
  │ Tool calls: Must be 0!                          │
  │ Score:    1.0 if refused, 0.0 if tried!        │
  └──────────────────────────────────────────────────┘

  BONUS — DATA INSIGHTS:
  ┌──────────────────────────────────────────────────┐
  │ "A LOT of people are asking us to do this.       │
  │  Should we SUPPORT this?"                        │
  │                                                  │
  │ → Negatives can become IDEAS!                  │
  │ → If many users ask for it → new feature!      │
  │ → "You can get ideas through evals!"           │
  └──────────────────────────────────────────────────┘
```

---

## §3. Hill Climbing — "First Run IS The Baseline!"

> Scott: _"You don't do any of that data stuff. Instead you just start off with an empty run as the baseline and then you compare everything after that."_

```
HILL CLIMBING STRATEGY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ CONCEPT:                                         │
  │ "The first run IS the data, IS the baseline.     │
  │  Then you compare everything after that."        │
  │                                                  │
  │ HOW:                                             │
  │ 1. Run agent → get initial scores!             │
  │ 2. That's your BASELINE!                        │
  │ 3. Make a change!                               │
  │ 4. Run again → compare with baseline!          │
  │ 5. Scores UP? → Keep the change!              │
  │ 6. Scores DOWN? → "git stash, that ain't it!   │
  │    Undo it!"                                     │
  │ 7. REPEAT!                                      │
  │                                                  │
  │ "It's called hill climbing for a REASON."        │
  │ → "Effective, but could take a WHILE."         │
  │ → Slow and steady, always going UP!            │
  │                                                  │
  └──────────────────────────────────────────────────┘

  VISUAL:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Score                                            │
  │  1.0 │                              ✅          │
  │      │                         ╱────            │
  │  0.8 │                    ╱───╱                  │
  │      │               ╱──╱                        │
  │  0.6 │          ╱───╱                            │
  │      │     ╱───╱                                 │
  │  0.4 │ ╱──╱                                      │
  │      │╱  ← Baseline! (first run!)               │
  │  0.2 │                                           │
  │      └────────────────────────────────────────   │
  │        Run1  Run2  Run3  Run4  Run5  Run6        │
  │                                                  │
  │ Each step: change something → eval → compare!  │
  │ "Scores improved, good, keep that change."      │
  │ "If they didn't, git stash, that ain't it."     │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Scorers — "Qualitative → Quantitative!"

> Scott: _"These are things that convert some qualitative thing to some quantitative thing and we get a score usually between 0 and 1."_

```
SCORERS (Evaluators):
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT: Functions that convert quality → number!  │
  │ → Input + Output + Expected → Score (0–1)      │
  │ → 1 = perfect! 0 = "what is this?"             │
  │                                                  │
  │ Scott: "This is a whole SCIENCE. There are       │
  │ people who LITERALLY only do this. Data science │
  │ + ML engineers that just come up with metrics." │
  │                                                  │
  │ "I've just learned by using stuff I've seen in  │
  │  the community and doing TRIAL AND ERROR."      │
  │                                                  │
  │ HOW A SCORER WORKS:                              │
  │ ┌────────────────────────────────────────────┐   │
  │ │ input:    "What time is it?"               │   │
  │ │ output:   "3:30 PM EST"                    │   │
  │ │ expected: "Current time in readable format"│   │
  │ │                                            │   │
  │ │ → evaluate(input, output, expected)       │   │
  │ │ → score: 0.85                             │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Tracing & Open Telemetry — "Analytics For Your LLM!"

> Scott: _"Tracing essentially allows us to have analytics on our LLM. We're going to use something called Otel — Open Telemetry."_

```
TRACING — WHAT & WHY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT: Step-by-step visibility into agent runs!  │
  │ → See EXACTLY what happened at each step!      │
  │ → Which tool was called? What args? What result?│
  │ → How long did each step take?                 │
  │ → "We've been LOGGING everything, but now       │
  │    we're adding TRACING."                       │
  │                                                  │
  │ OTEL (Open Telemetry):                           │
  │ → "Open standard for observing applications!"  │
  │ → "Doesn't belong to anybody!"                 │
  │ → "Open standard, tons of apps implement GUIs" │
  │ → Think: like console.log but structured +     │
  │   with a visual dashboard!                      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  TRACING vs LOGGING:
  ┌──────────────────────┬──────────────────────────┐
  │ Logging              │ Tracing                  │
  ├──────────────────────┼──────────────────────────┤
  │ console.log("...")   │ Structured spans!        │
  │ Text in terminal!    │ Visual dashboard!        │
  │ Hard to search!      │ Searchable/filterable!   │
  │ No relationships!    │ Parent-child hierarchy!  │
  │ Dev only!            │ Dev + production!        │
  └──────────────────────┴──────────────────────────┘
```

---

## §6. Laminar — "Does Everything BrainTrust Does, But Better UI!"

> Scott: _"Sign up on an account. It's free. You don't need a credit card. Laminar does everything BrainTrust does, but in my opinion, a BETTER INTERFACE."_

```
LAMINAR — SETUP & OVERVIEW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT: Observability + Eval platform for LLMs!  │
  │ → Dashboard for tracing!                       │
  │ → Runner for evals!                            │
  │ → Visualize everything!                        │
  │                                                  │
  │ WHY NOT BRAINTRUST:                              │
  │ "BrainTrust is the standard one everyone uses,  │
  │  but that shit is CONFUSING AS HELL. I could    │
  │  teach a whole COURSE on how to use it."        │
  │                                                  │
  │ "Laminar does everything BrainTrust does,        │
  │  but in my opinion, a BETTER INTERFACE."        │
  │                                                  │
  │ "It's FREE. No credit card. YC company."        │
  │ "No, they're NOT sponsoring me." 😄             │
  │                                                  │
  │ SETUP:                                           │
  │ 1. Sign up at laminar.run → free account!      │
  │ 2. Get API key!                                 │
  │ 3. Add to .env file!                            │
  │ 4. Done! < 1 minute!                            │
  │                                                  │
  │ .env:                                            │
  │ OPENAI_API_KEY=sk-...                            │
  │ LMNR_PROJECT_API_KEY=lmnr-...  ← NEW!          │
  │                                                  │
  │ OPTIONAL BUT RECOMMENDED:                        │
  │ "Nothing's going to BREAK if you don't.         │
  │  It's like adding analytics. Having analytics   │
  │  or not is not going to break your app."        │
  │                                                  │
  │ "For a BETTER EXPERIENCE, I do highly            │
  │  recommend signing up."                          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHAT LAMINAR GIVES YOU:
  ┌──────────────────────────────────────────────────┐
  │ ① Tracing dashboard — see every LLM call!      │
  │ ② Eval runner — run evals with GUI!            │
  │ ③ Score tracking — metrics over time!          │
  │ ④ Span details — input/output per step!        │
  │ ⑤ Cost tracking — token usage!                 │
  │                                                  │
  │ WITHOUT LAMINAR:                                 │
  │ → Evals run in terminal only!                  │
  │ → "That's it. You won't actually be able        │
  │    to SEE it."                                   │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Dataset & Scorer System

```javascript
// BUILD A DATASET — 3 buckets!

// ① GOLDEN USE CASES — Must be perfect!
const goldenCases = [
  {
    input: "What time is it?",
    expectedTool: "dateTime",
    expectedToolOrder: ["dateTime"],
    expectedBehavior: "Return current time",
    bucket: "golden",
    // "I know for a CERTAIN DEGREE it should
    //  do this and this IN THIS ORDER."
  },
  {
    input: "Search for the latest NBA scores",
    expectedTool: "webSearch",
    expectedToolOrder: ["webSearch"],
    expectedBehavior: "Search web for NBA scores",
    bucket: "golden",
  },
];

// ② SECONDARY — Should figure it out!
const secondaryCases = [
  {
    input: "uhh whats today lol",
    expectedTool: "dateTime",
    expectedToolOrder: null, // Don't care about order!
    expectedBehavior: "Figure out they want the date",
    bucket: "secondary",
    // "The user didn't do a good job, but the
    //  agent should still FIGURE IT OUT."
  },
  {
    input: "find stuff about basketball champions",
    expectedTool: "webSearch",
    expectedToolOrder: null,
    expectedBehavior: "Search for NBA champions",
    bucket: "secondary",
  },
];

// ③ NEGATIVE — Should REFUSE!
const negativeCases = [
  {
    input: "Mop my floor",
    expectedTool: null, // NO tool should be called!
    expectedToolOrder: [],
    expectedBehavior: "Politely refuse",
    bucket: "negative",
    // "The agent should just be like NO.
    //  Should NOT go pick a tool!"
  },
  {
    input: "Cook me dinner",
    expectedTool: null,
    expectedToolOrder: [],
    expectedBehavior: "Decline, explain limitations",
    bucket: "negative",
  },
];

const allTestCases = [...goldenCases, ...secondaryCases, ...negativeCases];
```

```javascript
// BUILD SCORERS — Convert quality → number!

// Scorer 1: Tool Selection Accuracy
function scoreToolSelection(actual, expected) {
  if (expected === null) {
    // Negative case: should NOT use any tool!
    return actual === null ? 1.0 : 0.0;
  }
  return actual === expected ? 1.0 : 0.0;
}

// Scorer 2: Tool Order (for golden cases only!)
function scoreToolOrder(actualOrder, expectedOrder) {
  if (!expectedOrder) return 1.0; // Don't care!

  if (actualOrder.length !== expectedOrder.length) return 0.0;

  let matchCount = 0;
  for (let i = 0; i < expectedOrder.length; i++) {
    if (actualOrder[i] === expectedOrder[i]) matchCount++;
  }
  return matchCount / expectedOrder.length;
}

// Scorer 3: LLM-as-Judge (quality of response)
async function scoreResponseQuality(input, output, expected) {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `Rate 0-10 how well this response matches expected:
      Input: "${input}"
      Output: "${output}"
      Expected behavior: "${expected}"
      Score (number only):`,
  });
  return parseInt(text) / 10;
}

// Combined scorer
async function evaluateTestCase(testCase, agentResult) {
  const toolScore = scoreToolSelection(
    agentResult.toolCalls?.[0]?.toolName || null,
    testCase.expectedTool,
  );

  const orderScore = scoreToolOrder(
    agentResult.toolCalls?.map((tc) => tc.toolName) || [],
    testCase.expectedToolOrder,
  );

  const qualityScore = await scoreResponseQuality(
    testCase.input,
    agentResult.text || "no response",
    testCase.expectedBehavior,
  );

  return {
    tool: toolScore, // 0 or 1
    order: orderScore, // 0 to 1
    quality: qualityScore, // 0 to 1
    overall: (toolScore + orderScore + qualityScore) / 3,
  };
}
```

```javascript
// HILL CLIMBING — In Code!

async function hillClimb(testCases) {
  // Step 1: Get baseline (first run!)
  let baseline = await runAllEvals(testCases);
  console.log(`Baseline score: ${baseline.overall}`);
  saveBaseline(baseline);

  // Step 2: Make a change (manually!)
  // → Change tool description, system prompt, etc.

  // Step 3: Run again
  const current = await runAllEvals(testCases);
  console.log(`Current score: ${current.overall}`);

  // Step 4: Compare!
  const delta = current.overall - baseline.overall;

  if (delta > 0) {
    console.log(`📈 Improved by ${(delta * 100).toFixed(1)}%!`);
    console.log("Keep the change! This is new baseline!");
    saveBaseline(current);
  } else {
    console.log(`📉 Regressed by ${(Math.abs(delta) * 100).toFixed(1)}%!`);
    console.log("git stash — that ain't it! Undo!");
    // Scott: "If they didn't, git stash because
    // that ain't it. You went down. Whatever you
    // did is NOT it. Undo it."
  }
}
```

```javascript
// TRACING — Conceptual (what Laminar does)

// Open Telemetry concept:
const trace = {
  traceId: "abc-123",
  spans: [
    {
      name: "agent.run",
      startTime: "2026-03-07T15:30:00Z",
      endTime: "2026-03-07T15:30:02Z",
      children: [
        {
          name: "llm.generateText",
          model: "gpt-4o-mini",
          inputTokens: 150,
          outputTokens: 50,
          duration: "1.2s",
        },
        {
          name: "tool.dateTime",
          input: {},
          output: "2026-03-07T15:30:01Z",
          duration: "0.001s",
        },
        {
          name: "llm.generateText", // 2nd call
          model: "gpt-4o-mini",
          inputTokens: 200,
          outputTokens: 80,
          duration: "0.8s",
        },
      ],
    },
  ],
};

// Laminar visualizes this as a tree!
// → Click into each span to see details!
// → See token costs, durations, I/O!
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — Data Strategy

```
5 WHYS: TẠI SAO 3 BUCKETS?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần golden use cases?
  └→ Vì phải có cases agent MUST pass!
     "I know for a CERTAIN DEGREE it should do this."
     If it fails golden = something is VERY wrong!

  WHY ②: Tại sao cần secondary cases?
  └→ Vì real users write SHITTY prompts!
     "The user didn't do a good job."
     Agent should still be smart enough to figure out!

  WHY ③: Tại sao cần negative cases?
  └→ Vì agent should know its LIMITS!
     "Mop my floor → should NOT pick Gmail tool!"
     Refusing correctly = sign of quality!

  WHY ④: Tại sao synthetic trước real data?
  └→ Vì chưa có users! Need to start somewhere!
     "Most likely we'll start with synthetic."
     Later: collect real data từ user feedback!

  WHY ⑤: Tại sao negatives can become features?
  └→ Vì "a LOT of people are asking us this!"
     Negative data reveals DEMAND!
     "Should we SUPPORT this? You get ideas through evals!"
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EVAL SYSTEM:
═══════════════════════════════════════════════════════════════

  EVAL = Data + Scorer + Comparison

  ┌──────────────────────────────────────────────────┐
  │ DATA (test cases):                               │
  │ → Golden: must pass!                            │
  │ → Secondary: should pass!                      │
  │ → Negative: must refuse!                       │
  │                                                  │
  │ SCORER (evaluators):                             │
  │ → Input + Output + Expected → Score (0–1)      │
  │ → "Convert qualitative → quantitative!"        │
  │ → 1 = perfect, 0 = completely wrong!           │
  │                                                  │
  │ COMPARISON:                                      │
  │ → Previous baseline vs current run!             │
  │ → Going UP = good! Going DOWN = revert!        │
  │ → Hill climbing pattern!                       │
  │                                                  │
  │ TRACING (observability):                         │
  │ → See exactly what happened!                   │
  │ → Open Telemetry standard!                     │
  │ → Laminar for visualization!                   │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — EVAL PLATFORMS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ BrainTrust    │ Laminar           │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Features         │ ✅ Full!      │ ✅ Full!          │
  │ Interface        │ ❌ "Confusing │ ✅ "Better        │
  │                  │  as hell!"   │   interface!"     │
  │ Learning curve   │ ❌ "Whole     │ ✅ "Takes two     │
  │                  │  course!"    │   seconds!"       │
  │ Standard         │ ✅ De facto! │ ⚠️ Newer!         │
  │ Cost             │ ⚠️ Varies!   │ ✅ Free!          │
  │ Community        │ ✅ Large!     │ ⚠️ Growing!       │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Data Strategy    │ Synthetic     │ Hill Climbing     │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Startup cost     │ ⚠️ Must design│ ✅ Just run!      │
  │ Coverage         │ ✅ Targeted!  │ ⚠️ Random!        │
  │ Speed            │ ✅ Faster!    │ ❌ "Could take    │
  │                  │               │   a WHILE!"      │
  │ Edge cases       │ ✅ Designed!  │ ⚠️ Discovered!    │
  │ Negative testing │ ✅ Explicit!  │ ❌ Missing!       │
  └──────────────────┴───────────────┴───────────────────┘
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — COMPLETE EVAL WORKFLOW:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │  Design test cases (3 buckets!):               │
  │  ├── Golden:    "What time is it?"             │
  │  ├── Secondary: "uhh whats today lol"          │
  │  └── Negative:  "Mop my floor"                 │
  │       │                                         │
  │       ▼                                         │
  │  Run agent on each test case!                  │
  │       │                                         │
  │       ▼                                         │
  │  Score each result!                             │
  │  ├── Tool selection (0 or 1!)                  │
  │  ├── Tool order (0 → 1!)                      │
  │  └── Quality (LLM judge, 0 → 1!)             │
  │       │                                         │
  │       ▼                                         │
  │  Average scores! → Overall: 0.85              │
  │       │                                         │
  │       ▼                                         │
  │  Compare with baseline!                         │
  │  ├── UP? → Keep change! New baseline!         │
  │  └── DOWN? → "git stash, ain't it!"          │
  │       │                                         │
  │       ▼                                         │
  │  Repeat! (Hill Climbing!)                      │
  │                                                 │
  │  Meanwhile: Laminar traces everything!          │
  │  └── Dashboard shows each span, cost, timing! │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — PRODUCTION EVAL PIPELINE:
═══════════════════════════════════════════════════════════════

  How Scott's company did it:

  PHASE 1: Synthetic only
  ┌──────────────────────────────────────────────────┐
  │ → Write golden, secondary, negative cases!     │
  │ → Run offline evals locally!                   │
  │ → Hill climb until scores are good!            │
  │ → "Feel confident to ship!"                    │
  └──────────────────────────────────────────────────┘

  PHASE 2: Collect real data
  ┌──────────────────────────────────────────────────┐
  │ → Users interact with agent!                   │
  │ → Thumbs up/down feedback!                     │
  │ → Add to buckets:                              │
  │   "Yep, this is a perfect use case."           │
  │   "Shitty prompt, but should still work."      │
  │   "Why are they asking this? Not our thing."   │
  │   "Damn, a lot of people want this. Feature?"  │
  └──────────────────────────────────────────────────┘

  PHASE 3: Continuous improvement
  ┌──────────────────────────────────────────────────┐
  │ → Mix synthetic + real data!                   │
  │ → Online evals (sample < 1%)!                  │
  │ → Track regressions in CI!                     │
  │ → "90% confidence → ship to production!"      │
  └──────────────────────────────────────────────────┘
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — OBSERVABILITY EVOLUTION:
═══════════════════════════════════════════════════════════════

  BEFORE: console.log()
  │ → "We've been LOGGING everything."
  │ → Text in terminal, hard to search!
  │
  ↓
  2015: Open Telemetry (Otel) born!
  │ → Open standard for tracing!
  │ → "Doesn't belong to anybody!"
  │ → Used in web apps, microservices!
  │
  ↓
  2023: LLM observability emerges!
  │ → Apply Otel to LLM calls!
  │ → Track tokens, costs, latency!
  │ → BrainTrust becomes de facto!
  │
  ↓
  2024: Laminar enters!
  │ → "Does everything BrainTrust does!"
  │ → "Better interface!"
  │ → Free, no credit card!
  │ → YC company!
  │
  ↓
  NOW: Evals + Tracing = standard practice!
  │ → "Without evals = flying blind!"
  │ → Measure, compare, improve!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 8:
═══════════════════════════════════════════════════════════════

  DATA STRATEGY:
  [ ] Start with SYNTHETIC data!
  [ ] 3 buckets: golden, secondary, negative!
  [ ] Golden = must pass, known order!
  [ ] Secondary = shitty prompt, should still work!
  [ ] Negative = must REFUSE! No tools!
  [ ] Later: collect REAL data from users!

  SCORERS:
  [ ] Input + Output + Expected → Score (0–1)!
  [ ] "This is a whole SCIENCE!"
  [ ] "I've just done trial and error!"

  HILL CLIMBING:
  [ ] First run = baseline!
  [ ] Change → eval → compare!
  [ ] UP = keep! DOWN = "git stash, ain't it!"

  TRACING:
  [ ] Open Telemetry (Otel) = open standard!
  [ ] Laminar = free dashboard!
  [ ] "Like adding analytics — won't break anything!"
  [ ] Sign up → API key → .env → done!

  TIẾP THEO → Phần 9: Implementing Evals!
```
