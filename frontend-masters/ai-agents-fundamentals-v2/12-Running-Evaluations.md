# AI Agents Fundamentals, v2 — Phần 12: Running Evaluations — "Put On A Lab Coat, You're Doing SCIENCE!"

> 📅 2026-03-07 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Running Evaluations — "This Is The HARDEST Skill Set. This Gets You The Job!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Critical — Full eval pipeline + career advice!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Wiring It Together — "Data + Executor + Scorer = Eval!"    |
| 2   | Skip Secondary — "Don't Penalize What We Don't Solve For!" |
| 3   | Every Framework Is The Same — "Just Different Names!"      |
| 4   | Experiments & Group Name — "Compare Over Time!"            |
| 5   | The 40% Rule — "Evals = 40% Of Your Time!"                 |
| 6   | The Hardest Skill Set — "This Gets You The Job!"           |
| 7   | Model Comparison & Simulations — "The Future Of Evals!"    |
| 8   | Tự Implement: Full Eval Pipeline                           |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu         |

---

## §1. Wiring It Together — "Data + Executor + Scorer = Eval!"

> Scott: _"We have the scores, we have the mock data, we have the executors. Now we can put those all together and RUN an evaluation."_

```javascript
// file: evals/filetools.eval.ts

import { evaluate } from "@lmnr-ai/lmnr";
import { toolSelectionScore } from "./evaluators";
import { singleTurnExecutorWithMocks } from "./executors";
import dataSet from "./data/file-agent.json";

// 1. EXECUTOR — runs the agent for each data entry
const executor = async (data) => {
  return singleTurnExecutorWithMocks(data);
};

// 2. EVALUATOR — scores each result
const evaluators = {
  selectionScore: (output, target) => {
    // Skip secondary prompts!
    if (target.category === "secondary") {
      return 1; // Don't penalize!
    }
    return toolSelectionScore(output, target);
  },
};

// 3. RUN THE EVAL (experiment!)
await evaluate({
  data: dataSet,
  executor,
  evaluators,
  groupName: "file-tools-selection",
  // "So I can compare experiments over time!"
});
```

```
THE THREE PIECES — EVERY FRAMEWORK:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ① DATA (dataset):                               │
  │ → "Collected, synthetic, wherever you got it"  │
  │ → "Always: input, output, expected."           │
  │ → "ALWAYS. Every eval framework, every         │
  │    methodology is that."                        │
  │                                                  │
  │ ② EXECUTOR (implementation):                     │
  │ → "Give us the thing you're evaling."          │
  │ → "One turn, whole agent, one sub-agent —     │
  │    whatever the thing that takes input           │
  │    and generates output!"                        │
  │                                                  │
  │ ③ SCORERS (evaluators):                          │
  │ → "Functions that take outputs and convert      │
  │    to quantitative scores we can chart."        │
  │ → In Laminar: called "evaluators"!             │
  │                                                  │
  │ "They just have DIFFERENT NAMES.                 │
  │  Don't get confused if you go use BrainTrust    │
  │  or something else. It's ALL THE SAME."         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Skip Secondary — "Don't Penalize What We Don't Solve For!"

> Scott: _"I don't wanna penalize a secondary data set for getting the tool selection wrong. It's not something we're trying to build for."_

```
THE SECONDARY STRATEGY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ GOLDEN USE CASES:                                │
  │ → NO leeway! Must get it right!                │
  │ → "Somebody typed a very specific thing.        │
  │    We SHOULD have figured that out."            │
  │ → Score: 0 if wrong, 1 if right!              │
  │                                                  │
  │ SECONDARY USE CASES:                             │
  │ → Return 1.0 regardless!                       │
  │ → "I'll REWARD you if you got it right.         │
  │    If you got it WRONG, that's OK."             │
  │ → "I don't want that to mess up my eval        │
  │    scores because something we AREN'T           │
  │    solving for wasn't perfect."                  │
  │                                                  │
  │ WHY:                                             │
  │ "I DO want my eval score to be diminished if     │
  │  something we ARE solving for didn't do well."  │
  │                                                  │
  │ ALTERNATIVE: Filter them out!                    │
  │ "You could filter the data set and only do      │
  │  the ones that aren't secondary. That's         │
  │  totally fine."                                   │
  │                                                  │
  │ "There's literally no right or wrong way.        │
  │  This is something I made up. You just kind     │
  │  of have to figure out what matters."           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Every Framework Is The Same — "Just Different Names!"

> Scott: _"Every single one has data, executors, scorers. They just have different names. It's literally the SAME THING no matter what you use."_

```
UNIVERSAL EVAL ANATOMY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ EVERY FRAMEWORK HAS:                             │
  │                                                  │
  │ ┌──────────┬────────────┬──────────────────┐    │
  │ │ Concept  │ Laminar    │ Other Names      │    │
  │ ├──────────┼────────────┼──────────────────┤    │
  │ │ Data     │ data       │ dataset, inputs  │    │
  │ │ Runner   │ executor   │ task, target fn  │    │
  │ │ Scorer   │ evaluators │ scorers, metrics │    │
  │ │ Grouping │ groupName  │ experiment ID,   │    │
  │ │          │            │ experiment name  │    │
  │ └──────────┴────────────┴──────────────────┘    │
  │                                                  │
  │ "If you use Python, it's all the same.           │
  │  Don't get confused. It's literally              │
  │  the same thing no matter what you use."        │
  │                                                  │
  │ They're all wrapped in: EXPERIMENT!              │
  │ "This one whole thing is an experiment.           │
  │  You'll have MANY experiments."                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Experiments & Group Name — "Compare Over Time!"

> Scott: _"I can group them to see averages, changes over time. How much better is this V2 than last year? I want to COMPARE them."_

```
EXPERIMENTS & GROUPING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ONE EVAL RUN = ONE EXPERIMENT!                   │
  │                                                  │
  │ await evaluate({                                 │
  │   data,                                          │
  │   executor,                                      │
  │   evaluators,                                    │
  │   groupName: "file-tools-selection", ← GROUP!  │
  │ });                                              │
  │                                                  │
  │ WHY GROUP NAME:                                  │
  │ "If I make another experiment that's another     │
  │  variation — different data, different model,    │
  │  different scores — I can group them together."  │
  │                                                  │
  │ "How much better is this V2 version of this      │
  │  executor than the previous version we had       │
  │  last year? I want to COMPARE them."            │
  │                                                  │
  │ "I put them in the same group name, so when      │
  │  I go look in the dashboard, it'll put them      │
  │  in ONE PLACE so I can compare them."           │
  │                                                  │
  └──────────────────────────────────────────────────┘

  EXPERIMENT VARIATIONS:
  ┌──────────────────────────────────────────────────┐
  │ Experiment A: model = gpt-4o-mini               │
  │ Experiment B: model = gpt-4o                    │
  │ Experiment C: model = claude-3.5-sonnet         │
  │                                                  │
  │ All in groupName: "file-tools-selection"        │
  │ → Dashboard: compare side by side!             │
  │ → See which model performs best!               │
  └──────────────────────────────────────────────────┘
```

---

## §5. The 40% Rule — "Evals = 40% Of Your Time!"

> Scott: _"If you aren't doing evals for at least 40% of the time of agent development, you're not doing it right."_

```
TIME ALLOCATION — AGENT DEVELOPMENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ 40% — EVALS!                                     │
  │ "This will take up SO MUCH TIME                  │
  │  and it SHOULD."                                 │
  │ "This is the PROCESS of making an agent."       │
  │                                                  │
  │ 30% — IMPROVING (so evals go up!)               │
  │ Prompt engineering, descriptions, architecture! │
  │ "Improving it so this is BETTER."               │
  │                                                  │
  │ 30% — EVERYTHING ELSE                            │
  │ "Fixing bugs, making tools — making tools       │
  │  is EASY. It's just functions, stuff you've     │
  │  always done. It's not HARD."                   │
  │ "You can npm install a tool, it's DONE."        │
  │                                                  │
  │ "But it's THESE THINGS [evals] that are hard.   │
  │  These things are NEW. We've never had to do    │
  │  this as traditional software engineers."        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. The Hardest Skill Set — "This Gets You The Job!"

> Scott: _"This is the HARDEST skill set. If you can do that, you'll probably get a job ANYWHERE. This is what gets you the job."_

```
CAREER ADVICE — WHAT MATTERS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT ANYONE CAN DO:                              │
  │ "I made a call to an LLM and I added tools.     │
  │  ANYBODY can do that. Anybody."                 │
  │                                                  │
  │ WHAT NOBODY CAN DO (= VALUE!):                   │
  │ → Come up with METRICS that matter!            │
  │ → Design EVALUATORS for them!                  │
  │ → Make architecture FLEXIBLE for experiments!  │
  │ → Know what LEVERS to pull to improve!         │
  │                                                  │
  │ "Companies that do this and spend time on this  │
  │  are actually selling to ENTERPRISE companies   │
  │  and getting contracts and deals because         │
  │  they've evaluated the HELL out of their        │
  │  system and they feel good at night about it."  │
  │                                                  │
  └──────────────────────────────────────────────────┘

  YOUR TOOLBOX — LEVERS TO PULL:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PROMPT ENGINEERING:                              │
  │ → System prompt? Tool descriptions?            │
  │ → Hints from tool calls? Personalization?      │
  │ → RAG?                                         │
  │                                                  │
  │ FINE TUNING:                                     │
  │ → "Do we need to look into fine tuning now?"   │
  │                                                  │
  │ MODEL SELECTION:                                 │
  │ → Better model? But slower + more expensive!   │
  │ → Smaller token window? What does that do?     │
  │                                                  │
  │ ARCHITECTURE:                                    │
  │ → "How do we have our run function take in      │
  │    arguments so it can run in production        │
  │    AND in the eval?"                             │
  │ → Don't duplicate code!                        │
  │ → "If it was super complicated, imagine         │
  │    having to replicate that in all evals."      │
  │                                                  │
  │ "You just put on a LAB COAT. You're gonna be    │
  │  doing SCIENCE all day. That's all you're       │
  │  gonna be doing."                                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Model Comparison & Simulations — "The Future Of Evals!"

> Scott: _"I call those SIMULATIONS. Those are the next level of evaluations. Simulating what an agent can do and how to quantify that."_

```
MODEL COMPARISON STRATEGY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ HOW: Same data, different models!               │
  │                                                  │
  │ dataSet: [                                       │
  │   { prompt: "Read config.json",                  │
  │     config: { model: "gpt-4o-mini" } },         │
  │   { prompt: "Read config.json",                  │
  │     config: { model: "gpt-4o" } },              │
  │   { prompt: "Read config.json",                  │
  │     config: { model: "claude-sonnet" } },       │
  │ ]                                                │
  │                                                  │
  │ "Same inputs, outputs, expectations.             │
  │  Only thing that changed was the MODEL.          │
  │  Then I track it over time."                     │
  │                                                  │
  │ "When a new frontier model comes out,            │
  │  update it and see what happens."               │
  │                                                  │
  └──────────────────────────────────────────────────┘

  SIMULATIONS — THE FUTURE:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ "Create a FAKE ENVIRONMENT in which your agent  │
  │  will run. What does your agent have access to? │
  │  FAKE THAT."                                     │
  │                                                  │
  │ EXAMPLE (our agent = has a computer access):     │
  │ 1. Spin up a VM!                                │
  │ 2. Give agent input! "Build a todo app"        │
  │ 3. Agent runs in sandbox!                       │
  │ 4. INSPECT the environment after:               │
  │    → Did it make these files? ✅              │
  │    → Do files have correct content? ✅        │
  │    → Did it delete what it should? ✅         │
  │    → Is this in bash history? ✅              │
  │ 5. Score based on inspection!                   │
  │                                                  │
  │ "It's like giving an agent a TAKE HOME TEST.    │
  │  Put it in the environment and say, here are    │
  │  a bunch of tasks."                              │
  │                                                  │
  │ ⚠️ CHALLENGES:                                  │
  │ "Not every environment is under your control.   │
  │  Third party APIs that rate limit, break,        │
  │  and cost money."                                │
  │                                                  │
  └──────────────────────────────────────────────────┘

  SAMPLE SIZE:
  ┌──────────────────────────────────────────────────┐
  │ Q: "How do you think about sample size?"        │
  │                                                  │
  │ A: "The MORE the better. There's no limit."     │
  │ "It's more about QUALITY than quantity."        │
  │                                                  │
  │ "It depends on the SCOPE of your agent:          │
  │  → Only checks weather? Don't need many.       │
  │  → Does everything? NEVER enough!"             │
  │                                                  │
  │ "Imagine users can add MCP servers — you         │
  │  literally don't KNOW what your agent will do!  │
  │  You couldn't write evals for something          │
  │  that doesn't EXIST yet."                        │
  │                                                  │
  │ "At some point you'll start SAMPLING             │
  │  because it's too much."                         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Full Eval Pipeline

```javascript
// COMPLETE EVAL PIPELINE — From scratch!

// ═══════════════════════════════════
// STEP 1: Define data set
// ═══════════════════════════════════

const dataSet = [
  {
    data: {
      prompt: "Read the contents of package.json",
      tools: ["readFile", "writeFile", "deleteFile"],
    },
    target: {
      expectedTools: ["readFile"],
      category: "golden",
    },
  },
  {
    data: {
      prompt: "Hey, read this file, then write a " + "summary to summary.txt",
      tools: ["readFile", "writeFile"],
    },
    target: {
      expectedTools: ["readFile", "writeFile"],
      expectedToolOrder: ["readFile", "writeFile"],
      category: "golden",
    },
  },
  {
    data: {
      prompt: "Can you start the dev server?",
      tools: ["runCommand", "readFile"],
    },
    target: {
      expectedTools: ["runCommand"],
      category: "secondary",
    },
  },
  {
    data: {
      prompt: "Tell me a programming joke",
      tools: ["readFile", "writeFile", "runCommand"],
    },
    target: {
      expectedTools: [],
      forbiddenTools: ["readFile", "writeFile", "runCommand"],
      category: "negative",
    },
  },
];
```

```javascript
// ═══════════════════════════════════
// STEP 2: Executor
// ═══════════════════════════════════

async function executor(data) {
  // Build messages
  const messages = [{ role: "user", content: data.prompt }];

  // Build mock tools (description + schema only!)
  const tools = buildMockTools(data.tools);

  // Call LLM (single turn!)
  const response = await callLLM({
    model: data.config?.model || "gpt-4o-mini",
    messages,
    tools,
  });

  return {
    toolCalls: response.toolCalls || [],
    toolNames: (response.toolCalls || []).map((tc) => tc.name),
    toolsSelected: (response.toolCalls || []).length > 0,
  };
}
```

```javascript
// ═══════════════════════════════════
// STEP 3: Scorers (evaluators)
// ═══════════════════════════════════

const evaluators = {
  // Selection score with category handling!
  selectionScore: (output, target) => {
    // "Don't penalize secondary data!"
    if (target.category === "secondary") {
      return 1.0;
    }
    return toolSelectionScore(target.expectedTools, output.toolNames);
  },

  // Forbidden tool check!
  forbiddenCheck: (output, target) => {
    if (!target.forbiddenTools) return 1.0;
    return forbiddenToolScore(target.forbiddenTools, output.toolNames);
  },

  // Order check (golden cases only!)
  orderScore: (output, target) => {
    if (!target.expectedToolOrder) return 1.0;
    if (target.category === "secondary") return 1.0;
    return toolOrderScore(target.expectedToolOrder, output.toolNames);
  },
};
```

```javascript
// ═══════════════════════════════════
// STEP 4: Run the evaluation (experiment!)
// ═══════════════════════════════════

async function runExperiment(name, dataSet, executor, evaluators) {
  console.log(`\n🧪 Experiment: ${name}`);
  console.log("═".repeat(50));

  const allScores = [];

  for (const entry of dataSet) {
    // Execute!
    const output = await executor(entry.data);

    // Score!
    const scores = {};
    for (const [scorerName, scorerFn] of Object.entries(evaluators)) {
      scores[scorerName] = scorerFn(output, entry.target);
    }

    // Overall
    const scoreValues = Object.values(scores);
    const overall = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

    allScores.push({
      prompt: entry.data.prompt,
      category: entry.target.category,
      scores,
      overall,
    });

    const emoji = overall >= 0.8 ? "✅" : overall >= 0.5 ? "⚠️" : "❌";
    console.log(
      `${emoji} [${entry.target.category}] ` +
        `"${entry.data.prompt.slice(0, 40)}..." → ${overall.toFixed(2)}`,
    );
  }

  // Summary by category!
  const categories = ["golden", "secondary", "negative"];
  console.log("\n📊 Summary by category:");
  for (const cat of categories) {
    const catScores = allScores.filter((s) => s.category === cat);
    if (catScores.length === 0) continue;

    const avg =
      catScores.reduce((sum, s) => sum + s.overall, 0) / catScores.length;
    console.log(`  ${cat}: ${(avg * 100).toFixed(1)}%`);
  }

  // Overall!
  const totalAvg =
    allScores.reduce((sum, s) => sum + s.overall, 0) / allScores.length;
  console.log(`\n🎯 Overall: ${(totalAvg * 100).toFixed(1)}%`);

  return { scores: allScores, overall: totalAvg };
}

// Run it!
await runExperiment("file-tools-selection-v1", dataSet, executor, evaluators);
```

```javascript
// ═══════════════════════════════════
// STEP 5: Compare experiments! (Group!)
// ═══════════════════════════════════

// Experiment 1: original descriptions
const result1 = await runExperiment(
  "v1-original",
  dataSet,
  executor,
  evaluators,
);

// Experiment 2: improved descriptions
// (change tool descriptions, re-run!)
const result2 = await runExperiment(
  "v2-better-descriptions",
  dataSet,
  executorV2,
  evaluators,
);

// Compare!
const delta = result2.overall - result1.overall;
if (delta > 0) {
  console.log(`\n📈 V2 is BETTER by ${(delta * 100).toFixed(1)}%!`);
  console.log("Keep the changes! New baseline!");
} else {
  console.log(`\n📉 V2 is WORSE by ${(Math.abs(delta) * 100).toFixed(1)}%!`);
  console.log("Revert! git stash, that ain't it!");
}
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys — Running Evals

```
5 WHYS: TẠI SAO EVAL LÀ QUAN TRỌNG NHẤT?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao 40% thời gian cho evals?
  └→ "This is the PROCESS of making an agent."
     "These things are NEW. We've never had to do
     this as traditional software engineers."

  WHY ②: Tại sao making tools không khó?
  └→ "Tools is EASY. It's just functions, code.
     Stuff you've ALWAYS done. You can npm install
     a tool, it's DONE."

  WHY ③: Tại sao cần flexible architecture?
  └→ "What if our run function was flexible enough
     to run in production AND in the eval?
     Instead of DUPLICATING code everywhere."

  WHY ④: Tại sao group name matters?
  └→ Vì cần COMPARE experiments over time!
     "How much better is V2 than last year?"
     Same group → same dashboard → easy compare!

  WHY ⑤: Tại sao đây là hardest skill?
  └→ "I made a call to an LLM and added tools —
     ANYBODY can do that. This is stuff NOBODY can
     do. This is what gets you the JOB."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EVALUATION PIPELINE:
═══════════════════════════════════════════════════════════════

  EVALUATION = DATA × EXECUTOR × SCORERS

  ┌──────────────────────────────────────────────────┐
  │ DATA → What to test!                            │
  │ → input + expected + category!                 │
  │ → "Always input, output, expected. ALWAYS."    │
  │                                                  │
  │ EXECUTOR → How to run!                          │
  │ → "The thing that takes input, generates output"│
  │ → Dynamic, configurable!                       │
  │                                                  │
  │ SCORERS → How to score!                         │
  │ → "Convert to quantitative scores we can chart"│
  │ → Handle categories differently!               │
  │                                                  │
  │ EXPERIMENT → One complete eval run!             │
  │ → Data + executor + scorers wrapped together!   │
  │ → Group by name for comparison!                │
  └──────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — EVAL STRATEGIES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Category handling │ Skip secondary│ Filter them out  │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Secondary bonus   │ ✅ If correct │ ❌ Never tested  │
  │   score!         │   still shows! │                  │
  │ Clean data       │ ⚠️ Inflated   │ ✅ Only golden!  │
  │ Insight          │ ✅ See if agent│ ❌ Miss insights │
  │                  │   handles it! │                   │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Architecture     │ Duplicate code│ Flexible runner   │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Speed            │ ✅ Quick!     │ ⚠️ Design time!   │
  │ Maintenance      │ ❌ Change     │ ✅ Change once!   │
  │                  │  everywhere!  │                   │
  │ Consistency      │ ❌ May drift! │ ✅ Same code!     │
  │ Complexity       │ ✅ Simple!    │ ⚠️ Abstractions!  │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — COMPLETE EVAL SYSTEM:
═══════════════════════════════════════════════════════════════

  ┌─── DATA LAYER ────────────────────────┐
  │ file-agent.json                       │
  │ ├── golden cases                      │
  │ ├── secondary cases                   │
  │ └── negative cases                    │
  └──────────┬────────────────────────────┘
             │
  ┌─── EXECUTOR LAYER ────────────────────┐
  │ singleTurnExecutorWithMocks(data)     │
  │ ├── buildMessages(data)               │
  │ ├── buildMockTools(data.tools)        │
  │ └── generateText({...})              │
  │     → { toolCalls, toolNames }       │
  └──────────┬────────────────────────────┘
             │
  ┌─── SCORER LAYER ──────────────────────┐
  │ evaluators:                           │
  │ ├── selectionScore (skip secondary!)  │
  │ ├── forbiddenCheck (binary!)          │
  │ └── orderScore (golden only!)         │
  └──────────┬────────────────────────────┘
             │
  ┌─── EXPERIMENT LAYER ──────────────────┐
  │ evaluate({                            │
  │   data, executor, evaluators,         │
  │   groupName: "file-tools-selection"   │
  │ })                                    │
  │ → Laminar dashboard: charts, trends! │
  └───────────────────────────────────────┘
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — PRODUCTION EVAL TEAMS:
═══════════════════════════════════════════════════════════════

  WHAT COMPANIES THAT WIN DO:
  ┌──────────────────────────────────────────────────┐
  │ "Companies that do this and spend a lot of       │
  │  time on this are actually selling to ENTERPRISE │
  │  companies and getting contracts and deals."     │
  │                                                  │
  │ 1. Define metrics that matter for THEIR system! │
  │ 2. Build flexible architecture for experiments! │
  │ 3. Run evals continuously!                      │
  │ 4. Know which levers to pull:                   │
  │    → Prompt engineering (where? system? tools?) │
  │    → Fine tuning (do we need it?)              │
  │    → Model selection (trade-offs!)             │
  │    → RAG (context matters?)                    │
  │    → Architecture changes!                     │
  │ 5. "Feel good at night about it."              │
  │                                                  │
  │ SIMULATIONS (the future!):                       │
  │ → Spin up sandboxed environment!               │
  │ → Give agent a "take home test"!               │
  │ → Inspect environment after!                   │
  │ → Score based on inspection!                   │
  │ → "This is the NEXT LEVEL of evaluations."     │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — EVAL MATURITY LEVELS:
═══════════════════════════════════════════════════════════════

  Level 0: "Vibes" 🎭
  │ → "I typed 3 prompts. Ship it."
  │ → "It's going to be BAD. I promise you."
  │ → "I don't care what Google told you about Gemini"
  │
  ↓
  Level 1: Manual testing 👀
  │ → Run agent, look at output manually!
  │ → Better than vibes, but not scalable!
  │
  ↓
  Level 2: Offline evals 📊
  │ → What we just built!
  │ → Data + executor + scorers!
  │ → Compare experiments!
  │
  ↓
  Level 3: Continuous evals 🔄
  │ → Run in CI! Block on regressions!
  │ → Collect real data! Human annotation!
  │
  ↓
  Level 4: Online evals ⚡️
  │ → Live production data!
  │ → Thumbs up/down! Sampling!
  │
  ↓
  Level 5: SIMULATIONS 🧪
  │ → "The NEXT LEVEL of evaluations!"
  │ → Sandboxed environments!
  │ → "Like giving an agent a take home test!"
  │ → "The FUTURE of evaluations!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 12:
═══════════════════════════════════════════════════════════════

  EVAL PIPELINE:
  [ ] Data + Executor + Scorers = Experiment!
  [ ] "Always input, output, expected. ALWAYS."
  [ ] "Every framework is the SAME. Different names!"
  [ ] groupName for comparing experiments over time!

  CATEGORY HANDLING:
  [ ] Golden = no leeway! Must score well!
  [ ] Secondary = return 1.0 if wrong! "Don't penalize!"
  [ ] Negative = forbiddenToolScore (binary!)
  [ ] "There's literally no right or wrong way."

  THE 40% RULE:
  [ ] 40% evals! 30% improving! 30% everything else!
  [ ] "Making tools is EASY. This is HARD."
  [ ] "These things are NEW for software engineers."

  THE HARDEST SKILL:
  [ ] Come up with metrics that matter!
  [ ] Know which levers to pull!
  [ ] Make architecture flexible for experiments!
  [ ] "Anybody can call an LLM. This is what gets
      you the JOB."

  THE FUTURE:
  [ ] Simulations = sandboxed environments!
  [ ] "Like giving an agent a TAKE HOME TEST!"
  [ ] Model comparison = same data, different models!

  TIẾP THEO → Phần 13: Building The Agent Loop!
```
