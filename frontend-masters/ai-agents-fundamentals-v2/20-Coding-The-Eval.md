# AI Agents Fundamentals, v2 — Phần 20: Coding the Eval — "100%! Our Agent's PERFECT... Or Is It?"

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Coding the Eval — "Data + Executor + Judge = Eval Pipeline! Run It, Score It, Dashboard It!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Full eval implementation, test data design, Laminar dashboard!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | The Evaluate Function — "Data + Executor + Evaluators!"        |
| 2   | Executor Wrapper — "Why Not Use Directly?"                     |
| 3   | Test Data Design — "Think Like A User, Test Like A Scientist!" |
| 4   | Mid-Conversation Testing — "Prime The Messages Array!"         |
| 5   | Running & Dashboard — "100% Score... Wait, Really?"            |
| 6   | Poisoning Data — "Try To Make It Fail!"                        |
| 7   | Judge vs Deterministic — "Semantic ≠ Deterministic!"           |
| 8   | Live Eval Data — "Thumbs Up = Golden Data Set!"                |
| 9   | Multi-Language Support — "Detect, Classify, Respond!"          |
| 10  | Tự Implement: Full Eval Pipeline                               |
| 11  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu             |

---

## §1. The Evaluate Function — "Data + Executor + Evaluators!"

> Scott: _"Because we already did all the hard work, the eval is going to be pretty simple."_

```javascript
// THE EVAL FILE — multi-turn.eval.ts

import { evaluate } from "laminar"; // Eval framework!
import { llmJudge } from "./evaluators";
import { multiTurnWithMocks } from "./executor";
import dataset from "./data/agent-multi-turn.json";

// Executor wrapper
const executor = (data) => {
  return multiTurnWithMocks(data);
  // "Why wrapper? If I wanted to manipulate
  //  data first — filter, transform — I can
  //  do it here BEFORE I pass to eval."
};

// Run the evaluation!
evaluate({
  name: "agent-multi-turn",

  data: dataset,

  executor: executor,

  evaluators: {
    // THE ONE WE CARE ABOUT:
    outputQuality: (output, target) => {
      if (!target) return 1;
      // "No target? Don't waste an LLM call.
      //  Nothing to test. Just return 1."
      return llmJudge(output, target);
    },

    // Optional deterministic scorers:
    // toolOrder: (output, target) => { ... },
    // toolsAvoided: (output, target) => { ... },
  },

  config: {
    projectApiKey: process.env.LAMINAR_API_KEY,
    group: "agent-multi-turn",
    // "What do we call this set of experiments?
    //  They're all grouped and we can see scores
    //  over time."
  },
});
```

```
EVAL ANATOMY:
═══════════════════════════════════════════════════════════════

  evaluate({
    ┌──────────────────────────────────────────┐
    │ name: "agent-multi-turn"                 │ ← Dashboard ID!
    │                                          │
    │ data: dataset (JSON!)                    │ ← Test cases!
    │                                          │
    │ executor: (data) => multiTurnWithMocks() │ ← Run agent!
    │                                          │
    │ evaluators: {                            │ ← Score it!
    │   outputQuality: llmJudge()              │
    │ }                                        │
    │                                          │
    │ config: { group: "agent-multi-turn" }    │ ← Track over time!
    └──────────────────────────────────────────┘
  })
```

---

## §2. Executor Wrapper — "Why Not Use Directly?"

> Scott: _"Why make this versus just using the executor? If I wanted to do manipulation on the data first, I can do it here."_

```javascript
// WHY A WRAPPER?

// OPTION A: Direct (simple!)
evaluate({
  executor: multiTurnWithMocks,
  // Works! But no flexibility!
});

// OPTION B: Wrapper (flexible!)
const executor = (data) => {
  // Transform data before passing!
  // Filter out certain test cases!
  // Add default values!
  // Log something!
  return multiTurnWithMocks(data);
};

evaluate({ executor });
// "If I wanted to do some manipulation here
//  on the data first — filter something out
//  or do something — I can do it here before
//  I pass it to my eval."
```

---

## §3. Test Data Design — "Think Like A User, Test Like A Scientist!"

> Scott: _"Creating the synthetic data really helps you THINK about what are the use cases I'm solving for and what is this supposed to do."_

```javascript
// TEST CASE 1: Simple tool selection!
{
  "prompt": "Read the package.json and tell me the project name",
  "mockTools": [
    {
      "name": "readFile",
      "description": "Read the contents of a file",
      "parameters": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        }
      },
      "mockReturn": "{\"name\":\"my-project\",\"version\":\"1.0\"}"
    },
    {
      "name": "shell",
      "description": "Execute shell commands and return output",
      "parameters": {
        "type": "object",
        "properties": {
          "command": { "type": "string" }
        }
      },
      "mockReturn": "command executed"
    }
  ],
  "target": {
    "originalTask": "Read the package.json...",
    "expectedToolOrder": ["readFile"],
    "forbiddenTools": ["shell"],
    "mockToolResults": { /* ... */ }
  },
  "category": "file-reading"
}
```

```
WHY TWO TOOLS FOR ONE TASK:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "You COULD just call readFile to read the file,  │
  │  but you could ALSO do 'cat' inside a shell."   │
  │                                                  │
  │ "I REALLY want it to use readFile. I don't      │
  │  want it to use shell to read a file."          │
  │                                                  │
  │ IF IT USES SHELL INSTEAD:                        │
  │ → Go to readFile description: "ALWAYS use this  │
  │   tool to read files over any other tool."      │
  │ → Go to shell description: "Don't use this      │
  │   tool to read files."                           │
  │ → Put it in the system prompt!                 │
  │ → Or in the loop: detect cat command → swap    │
  │   with readFile tool call!                       │
  │                                                  │
  │ "There's SO MANY ways you could do this."       │
  │ "This would tell me whether it's good at         │
  │  picking the one I want."                        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Mid-Conversation Testing — "Prime The Messages Array!"

> Scott: _"This one is mid-conversation. 'Hey I'm working with Node, help me understand it.' Then: 'List the files and read the main entry point.'"_

```javascript
// TEST CASE 2: Mid-conversation!
{
  "messages": [
    { "role": "user",
      "content": "I'm working with Node, help me understand it" },
    { "role": "assistant",
      "content": "I'm happy to help! What would you like to know?" },
    { "role": "user",
      "content": "List the files in src and read the main entry point" }
  ],
  "mockTools": [
    {
      "name": "listFiles",
      "description": "List all files in a directory",
      "mockReturn": "[\"index.js\", \"utils.js\", \"config.json\"]"
    },
    {
      "name": "readFile",
      "description": "Read the contents of a file",
      "mockReturn": "const express = require('express');\n..."
    }
  ],
  "target": {
    "expectedToolOrder": ["listFiles", "readFile"],
    // "I expect: listFiles FIRST (to see what's there),
    //  then readFile (to read index.js — the entry point)."
  }
}
```

```
EXPECTED AGENT BEHAVIOR:
═══════════════════════════════════════════════════════════════

  Step 1: Agent calls listFiles("src/")
  Result: ["index.js", "utils.js", "config.json"]
                ↑ Agent sees this!

  Step 2: Agent calls readFile("src/index.js")
  → "It should SEE index.js in the list and figure
     out THAT's the entry point!"
  Result: "const express = require('express')..."

  Step 3: Agent responds with explanation!
  → "Here's what index.js does..."

  "You can get PRETTY CREATIVE with this. You really
   have to think: what would it do? How would it do it?"
```

---

## §5. Running & Dashboard — "100% Score... Wait, Really?"

> Scott: _"100%. Look at that. Our agent's PERFECT. It's flawless, right?"_

```
RUNNING AND RESULTS:
═══════════════════════════════════════════════════════════════

  $ npm run eval

  ┌──────────────────────────────────────────────────┐
  │ Running evaluations...                           │
  │                                                  │
  │ ✅ agent-multi-turn:                            │
  │   Case 1: outputQuality = 10/10 (1.0)          │
  │   Case 2: outputQuality = 10/10 (1.0)          │
  │   Case 3: outputQuality = 10/10 (1.0)          │
  │                                                  │
  │ Average: 100% 🎉                               │
  │                                                  │
  │ "I didn't expect it actually. I guess I had      │
  │  some good prompts in there."                    │
  │                                                  │
  └──────────────────────────────────────────────────┘

  LAMINAR DASHBOARD:
  ┌──────────────────────────────────────────────────┐
  │ Evaluations → agent-multi-turn                  │
  │                                                  │
  │ Run #1: 100% ██████████████████████ 10/10       │
  │                                                  │
  │ Scores per case:                                 │
  │ ├── package.json read: 10 ✅                   │
  │ ├── mid-conversation: 10 ✅                    │
  │ └── file listing: 10 ✅                        │
  │                                                  │
  │ ⚠️ "I wanted to see the REASON, but I didn't   │
  │  include the reason in the return function.      │
  │  Would be super helpful to see WHY."            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Poisoning Data — "Try To Make It Fail!"

> Scott: _"Let's go POISON its data. I changed expected tool order to 'shell' instead of 'readFile'. Let's see what happens."_

```
POISONING EXPERIMENT:
═══════════════════════════════════════════════════════════════

  CHANGE: expectedToolOrder = ["shell"] instead of ["readFile"]

  RESULT: Still 100%! 😮

  WHY?
  ┌──────────────────────────────────────────────────┐
  │ "The judge is evaluating based off SEMANTICS     │
  │  of the result, not something deterministic      │
  │  like whether the order was there or not."      │
  │                                                  │
  │ "The judge might look at that and be like,       │
  │  'Yeah, I don't really care. The output...       │
  │  It got you what you wanted.'"                  │
  │                                                  │
  │ "It's VERY SUBJECTIVE because the judge might   │
  │  see that and still be like 'well, it still     │
  │  did the thing. It doesn't matter because       │
  │  it's just focused on OUTPUT.'"                 │
  │                                                  │
  │ "It's not really focused on HOW it got there."  │
  │                                                  │
  │ → That's what DETERMINISTIC scores are for!    │
  │   Tool order score! Tool avoidance score!       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Judge vs Deterministic — "Semantic ≠ Deterministic!"

> Scott: _"It's hard to trick the judge because it's judging based off its own opinions. It's not deterministic."_

```
TWO TYPES OF SCORING:
═══════════════════════════════════════════════════════════════

  DETERMINISTIC (code-based!):
  ┌──────────────────────────────────────────────────┐
  │ Tool order: Did tools run in expected sequence? │
  │ Tools avoided: Were forbidden tools NOT used?   │
  │ → YES/NO answers! Can't be gamed!             │
  │ → "These individual scores are FOR this."      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  SEMANTIC (LLM judge!):
  ┌──────────────────────────────────────────────────┐
  │ Output quality: Does the response make sense?   │
  │ → "Evaluating based off SEMANTICS of result"   │
  │ → "Not focused on HOW it got there"            │
  │ → Can't be easily poisoned!                    │
  │ → But also can't catch process issues!         │
  │                                                  │
  │ "It's really hard to try to TRICK that into     │
  │  doing something else."                          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  COMBINE BOTH → COMPLETE PICTURE!
```

---

## §8. Live Eval Data — "Thumbs Up = Golden Data Set!"

> Scott: _"Every tool, including Laminar, does that — capture live sessions. Thumbs up = add to GOLDEN data set. Thumbs down = things we need to fix."_

```
LIVE DATA COLLECTION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Q: "Are there tools to capture a LIVE SESSION   │
  │  and generate test data?"                        │
  │                                                  │
  │ A: "YES! Every tool does that. That's what       │
  │  would be considered the LIVE EVAL stack."      │
  │                                                  │
  │ 👍 Thumbs up:                                   │
  │ → "Great session! Add to GOLDEN DATA SET!"     │
  │ → "Everything good. Should always pass."       │
  │                                                  │
  │ 👎 Thumbs down:                                  │
  │ → "Stuff we need to CHANGE and FIX."           │
  │ → "Run evals on these, try to fix them."       │
  │ → "That is a team's JOB."                      │
  │                                                  │
  │ "There are BILLION-DOLLAR companies whose        │
  │  product is just that."                          │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. Multi-Language Support — "Detect, Classify, Respond!"

> Scott: _"Yeah, that's a great eval. You could also make it DETERMINISTIC with a classifier before the agent."_

```
MULTI-LANGUAGE EVAL STRATEGY:
═══════════════════════════════════════════════════════════════

  OPTION A: Eval approach (LLM decides!)
  ┌──────────────────────────────────────────────────┐
  │ Input: "Bonjour, aide-moi s'il vous plaît"     │
  │ Agent detects French → responds in French!     │
  │ Judge: "Is the response in the same language?"  │
  │ → Need to eval detection + response!           │
  └──────────────────────────────────────────────────┘

  OPTION B: Classifier approach (more deterministic!)
  ┌──────────────────────────────────────────────────┐
  │ Input → Classifier LLM: "This is French"       │
  │ → Pass to agent: "Language: French"            │
  │ → Agent KNOWS the language! Don't detect!      │
  │ → "More deterministic. Agent doesn't have      │
  │    to detect what the language is."             │
  │ → "You can just write CODE for that because    │
  │    it outputs a specific string."               │
  └──────────────────────────────────────────────────┘
```

---

## §10. Tự Implement: Full Eval Pipeline

```javascript
// COMPLETE MULTI-TURN EVAL — From scratch!

// ═══════════════════════════════════
// 1. Test Data
// ═══════════════════════════════════

const testData = [
  {
    prompt: "Read the package.json and tell me the project name",
    mockTools: [
      {
        name: "readFile",
        description: "Read the full contents of a file at the given path",
        parameters: {
          type: "object",
          properties: { path: { type: "string" } },
          required: ["path"],
        },
        mockReturn: '{"name":"awesome-project","version":"2.1.0"}',
      },
      {
        name: "shell",
        description: "Execute shell commands",
        parameters: {
          type: "object",
          properties: { command: { type: "string" } },
          required: ["command"],
        },
        mockReturn: "command executed",
      },
    ],
    target: {
      originalTask: "Read the package.json and tell me the project name",
      expectedToolOrder: ["readFile"],
      forbiddenTools: ["shell"],
    },
    category: "file-reading",
  },
  {
    // Mid-conversation test!
    messages: [
      { role: "user", content: "I'm working with Node.js" },
      { role: "assistant", content: "Happy to help! What do you need?" },
    ],
    prompt: "List the files in src/ and read the entry point",
    mockTools: [
      {
        name: "listFiles",
        description: "List files in a directory",
        mockReturn: '["index.js","utils.js","config.json"]',
      },
      {
        name: "readFile",
        description: "Read file contents",
        mockReturn: 'const app = require("express")();',
      },
    ],
    target: {
      originalTask: "List files and read entry point",
      expectedToolOrder: ["listFiles", "readFile"],
    },
    category: "mid-conversation",
  },
];
```

```javascript
// ═══════════════════════════════════
// 2. Evaluate Function
// ═══════════════════════════════════

async function runEvaluation(testData) {
  const results = [];

  for (const data of testData) {
    console.log(`\n📝 Testing: "${data.prompt.slice(0, 50)}..."`);

    // Run executor!
    const output = await multiTurnExecutor(data);

    // Score: deterministic!
    const orderScore = data.target.expectedToolOrder
      ? toolOrderScore(data.target.expectedToolOrder, output.toolCallOrder)
      : 1.0;

    const forbiddenScore = data.target.forbiddenTools
      ? forbiddenToolScore(data.target.forbiddenTools, output.toolsUsed)
      : 1.0;

    // Score: LLM judge!
    let judgeScore = 1.0;
    if (data.target) {
      judgeScore = await llmJudge(output, data.target);
    }
    // "No target? Don't waste an LLM call. Return 1."

    const overall = (orderScore + forbiddenScore + judgeScore) / 3;

    results.push({
      prompt: data.prompt,
      category: data.category,
      scores: { orderScore, forbiddenScore, judgeScore, overall },
      toolsUsed: output.toolsUsed,
    });

    console.log(
      `   📊 Order: ${(orderScore * 100).toFixed(0)}% | ` +
        `Forbidden: ${(forbiddenScore * 100).toFixed(0)}% | ` +
        `Judge: ${(judgeScore * 100).toFixed(0)}% | ` +
        `Overall: ${(overall * 100).toFixed(0)}%`,
    );
  }

  // Summary!
  const avg =
    results.reduce((s, r) => s + r.scores.overall, 0) / results.length;
  console.log(`\n📈 Overall average: ${(avg * 100).toFixed(1)}%`);

  return results;
}

// Run!
runEvaluation(testData);
```

---

## §11. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 11.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO EVAL DESIGN NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao wrap executor?
  └→ "If I wanted to manipulate data first —
     filter, transform — I can do it BEFORE
     passing to my eval."

  WHY ②: Tại sao return 1 khi no target?
  └→ "Don't waste an LLM call. Nothing to test.
     Judge can't score if there's no target."

  WHY ③: Tại sao group name?
  └→ "When we keep making different versions,
     they're all GROUPED and we can see scores
     OVER TIME on the dashboard."

  WHY ④: Tại sao test data cố ý thêm shell tool?
  └→ "I really wanted to use readFile. Testing
     to see WHICH ONE it picks. Then I can
     persuade in some other way."

  WHY ⑤: Tại sao bắt đầu với evals first?
  └→ "Creating synthetic data helps you THINK
     about use cases. It's a really good
     exercise. That's why I had you doing
     this on the THIRD lesson."
```

### 11.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — DATA-DRIVEN EVAL:
═══════════════════════════════════════════════════════════════

  Eval = Data × Executor × Evaluators

  → Data: what to test (prompt + mock tools + targets!)
  → Executor: how to run (agent loop with mocks!)
  → Evaluators: how to score (deterministic + judge!)

  "Because we did all the hard work,
   the eval itself is PRETTY SIMPLE."
```

### 11.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — Scoring Strategies:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Deterministic │ LLM Judge         │
  ├──────────────────┼───────────────┼───────────────────┤
  │ What it checks   │ HOW (process) │ WHAT (output!)    │
  │ Can be poisoned  │ ✅ Yes!       │ ❌ Hard to trick! │
  │ Cost             │ ✅ Free!      │ ❌ LLM call!      │
  │ Handles wording  │ ❌ Rigid!     │ ✅ Flexible!      │
  │ Catches process  │ ✅ Yes!       │ ❌ "Doesn't care  │
  │  issues          │               │  HOW it got there"│
  └──────────────────┴───────────────┴───────────────────┘
```

### 11.4 Pattern ④: Mental Mapping

```
MENTAL MAP — EVAL PIPELINE:
═══════════════════════════════════════════════════════════════

  multi-turn.json (test data!)
       │
       ▼
  evaluate({
    data → executor → evaluators → dashboard!
  })
       │
       ├── executor(data):
       │   → buildMockTools → generateText + maxSteps
       │   → collect steps, tool calls, results, text
       │
       └── evaluators:
           ├── outputQuality: llmJudge(output, target)
           │   → generateObject → score 1-10 / 10
           ├── toolOrder: deterministic check!
           └── toolsAvoided: deterministic check!
       │
       ▼
  Laminar dashboard → grouped by experiment name!
```

### 11.5 Pattern ⑤: Reverse Engineering — Data Design Philosophy

```
REVERSE ENGINEERING — "THINK LIKE A USER":
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Creating synthetic data really helps you        │
  │  THINK about use cases."                         │
  │                                                  │
  │ For EACH test case, ask:                         │
  │ → What would a user type?                      │
  │ → What tools SHOULD the agent pick?            │
  │ → What tools should it NEVER pick?             │
  │ → What does the mock result look like?         │
  │ → What's the EXPECTED behavior?                │
  │                                                  │
  │ "That's why I like to START with evals first.   │
  │  You really need to think about this stuff."    │
  └──────────────────────────────────────────────────┘
```

### 11.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — EVAL DATA SOURCES:
═══════════════════════════════════════════════════════════════

  Synthetic data (what we're doing!):
  │ → Hand-crafted test cases!
  │ → "Data in my head. I think these are
  │    the things I want to test."
  ↓
  Live user data:
  │ → 👍 Thumbs up → golden data set!
  │ → 👎 Thumbs down → fix these!
  │ → "Billion-dollar companies do JUST this."
  ↓
  Automated capture:
  │ → Every session recorded and labeled!
  │ → Auto-generate test cases from usage!
  │ → "The live eval stack."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 20:
═══════════════════════════════════════════════════════════════

  EVALUATE FUNCTION:
  [ ] data + executor + evaluators!
  [ ] Wrapper for flexibility!
  [ ] Group name for dashboard tracking!

  TEST DATA DESIGN:
  [ ] Test tool SELECTION (readFile vs shell!)
  [ ] Test mid-conversation scenarios!
  [ ] "Getting creative = really good exercise!"

  SCORING:
  [ ] Deterministic: tool order, forbidden tools!
  [ ] Semantic: LLM judge for output quality!
  [ ] "Judge doesn't care HOW, only WHAT!"
  [ ] "Hard to trick the judge!"

  LIVE DATA:
  [ ] 👍 = golden data set!
  [ ] 👎 = things to fix!
  [ ] "Start with evals FIRST!"

  TIẾP THEO → Phần 21: Use Cases for File System Tools!
```
