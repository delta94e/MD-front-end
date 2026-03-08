# AI Agents Fundamentals, v2 — Phần 17: Multi-Turn Evals — "Let The Agent RUN. Then Judge The Output!"

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Multi-Turn Evals — "Single Turn = Tool Selection. Multi Turn = Full Agent Run!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — LLM-as-judge, structured outputs, eval strategy!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | Single Turn vs Multi-Turn — "Steps vs Full Run!"        |
| 2   | What Multi-Turn Catches — "Loops, Lies, and Giving Up!" |
| 3   | LLM As A Judge — "LLMs All The Way Down!"               |
| 4   | Structured Outputs — "Give Me Numbers, Not Text!"       |
| 5   | Judge Limitations — "Gaming, Cost, Mom Test!"           |
| 6   | Data Strategy — "Mock Tools That EXECUTE!"              |
| 7   | Evaluation Criteria — "Deterministic + Semantic!"       |
| 8   | Tự Implement: Multi-Turn Eval System                    |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu      |

---

## §1. Single Turn vs Multi-Turn — "Steps vs Full Run!"

> Scott: _"Single turn = did you pick the right tool? Multi-turn = let the agent run COMPLETELY on a loop. We judge the OUTPUT."_

```
SINGLE TURN vs MULTI-TURN:
═══════════════════════════════════════════════════════════════

  SINGLE TURN EVAL (what we already did!):
  ┌──────────────────────────────────────────────────┐
  │ "Did you pick the RIGHT TOOL given this prompt?" │
  │                                                  │
  │ Input: "Read package.json"                      │
  │ Expected: readFile                              │
  │ Actual: readFile ✅                             │
  │                                                  │
  │ → One prompt, one decision!                    │
  │ → No tool execution needed!                    │
  │ → Just checking tool SELECTION!                │
  │                                                  │
  │ "We evaluate what is your very next DECISION    │
  │  on a step by step basis."                      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  MULTI-TURN EVAL (what we're building!):
  ┌──────────────────────────────────────────────────┐
  │ "Let the agent run on a LOOP completely.         │
  │  We're not looking at individual steps.          │
  │  We judge the OUTPUT."                           │
  │                                                  │
  │ Input: "Organize my project files"              │
  │ Agent: readFile → listFiles → writeFile → ...  │
  │ Output: "Done! I organized 15 files into..."    │
  │ Judge: Is this output CORRECT? Score: 8/10!     │
  │                                                  │
  │ → Full loop! Multiple tools! Multiple turns!   │
  │ → Tools get EXECUTED (mocked!)                 │
  │ → Results fed back to agent!                   │
  │ → Judge evaluates FINAL output!                │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHY MULTI-TURN MATTERS:
  ┌──────────────────────────────────────────────────┐
  │ "Do you care what ORDER the agent went in as     │
  │  long as it got the job done? Probably NOT."     │
  │                                                  │
  │ Single turn = good indicator of EFFICIENCY!     │
  │ "Can the agent reach output more efficiently."  │
  │                                                  │
  │ Multi-turn = USER-FACING!                        │
  │ "This helps us eval what a USER would            │
  │  experience. They put something in, wait,        │
  │  and get something out."                         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. What Multi-Turn Catches — "Loops, Lies, and Giving Up!"

> Scott: _"Does the agent get STUCK in a loop? Does it give up too EARLY? Does it LIE? Does it not know when to STOP?"_

```
BUGS ONLY MULTI-TURN CAN CATCH:
═══════════════════════════════════════════════════════════════

  ① WRONG TOOL SEQUENCE:
  ┌──────────────────────────────────────────────────┐
  │ "Did the agent pick the FIRST tool correctly     │
  │  but the SECOND tool is wrong?"                 │
  │ Single turn can't test this! Only one chance!   │
  └──────────────────────────────────────────────────┘

  ② STUCK IN A LOOP:
  ┌──────────────────────────────────────────────────┐
  │ Agent: readFile("foo.txt")                      │
  │ Result: "contents..."                            │
  │ Agent: readFile("foo.txt")  ← SAME THING!      │
  │ Result: "contents..."                            │
  │ Agent: readFile("foo.txt")  ← INFINITE LOOP! 🔄│
  │                                                  │
  │ "It's just stuck forever and forever."          │
  └──────────────────────────────────────────────────┘

  ③ MISINTERPRETS TOOL RESULTS:
  ┌──────────────────────────────────────────────────┐
  │ Tool returns: base64 encoded image!             │
  │ Agent: "I don't understand this format..." 😕  │
  │ "Can it interpret that or not?"                 │
  └──────────────────────────────────────────────────┘

  ④ GIVES UP TOO EARLY:
  ┌──────────────────────────────────────────────────┐
  │ "The prompt was vague, tools are granular,       │
  │  agent has to do a LOT of work..."              │
  │ Agent: "I can't do this." OR "It's impossible." │
  │ "Believe me, it HAPPENS. It'll LIE."            │
  └──────────────────────────────────────────────────┘

  ⑤ DOESN'T KNOW WHEN TO STOP:
  ┌──────────────────────────────────────────────────┐
  │ "Early AGI experiments: it would just keep going │
  │  forever. It literally wouldn't know that it     │
  │  had ALL the information it needed to answer."  │
  │                                                  │
  │ "AKA more tool calls. Just keep going and going."│
  │ → That's why people cap at MAX TURNS: 20!      │
  │ "After that, STOP, because it will run away."   │
  └──────────────────────────────────────────────────┘
```

---

## §3. LLM As A Judge — "LLMs All The Way Down!"

> Scott: _"The only way to eval human language reliably is intelligence. That intelligence is a human or ANOTHER LLM. It's LLMs all the way down."_

```
THE PROBLEM — HOW TO EVAL TEXT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Agent output: "I organized your files into       │
  │ 3 categories based on file type..."             │
  │                                                  │
  │ HOW DO WE SCORE THIS?                            │
  │                                                  │
  │ ❌ Regex? "LLMs are nondeterministic. If you're │
  │    testing with regexes, you're screaming at     │
  │    the agent to say this EXACT word every time." │
  │    → You'll miss! Eval is not good!            │
  │                                                  │
  │ ✅ Intelligence: human OR LLM!                  │
  │ "The ONLY way to test unstructured outputs       │
  │  reliably is some sort of intelligence."        │
  │                                                  │
  └──────────────────────────────────────────────────┘

  LLM AS A JUDGE:
  ┌──────────────────────────────────────────────────┐
  │ "We're going to use an LLM to JUDGE the output  │
  │  of our LLM. And it's just LLMs ALL THE WAY     │
  │  DOWN. It always has been."                      │
  │                                                  │
  │ The judge:                                       │
  │ → Understands the TASK!                        │
  │ → Understands the RULES of our eval!           │
  │ → Understands the SCORING RUBRIC!              │
  │ → Outputs a SCORE!                             │
  │                                                  │
  │ MODEL STRATEGY:                                  │
  │ "Use a BIGGER model than the one in your loop." │
  │ → Agent: GPT-4o-mini                           │
  │ → Judge: GPT-4o or better!                     │
  │                                                  │
  │ "If already using the most powerful model,       │
  │  use the same, or have MULTIPLE judges and      │
  │  average scores."                                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```
WHAT THE JUDGE CAN SCORE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ① CORRECTNESS:                                   │
  │ "Given the task and tool results, is this        │
  │  response CORRECT?"                              │
  │                                                  │
  │ ② FACTUALITY:                                    │
  │ "Is the information IN the context we provided? │
  │  Or is the agent HALLUCINATING?"                │
  │                                                  │
  │ ③ LOGICAL SENSE:                                 │
  │ "Does this response make LOGICAL sense?"        │
  │                                                  │
  │ ④ GOAL COMPLETION:                               │
  │ "Did it accomplish the GOAL based off the        │
  │  conversation?"                                  │
  │                                                  │
  │ ⑤ SEMANTIC UNDERSTANDING:                        │
  │ "That's the intelligence part. It handles        │
  │  VARIATION — different wording, same meaning."  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Structured Outputs — "Give Me Numbers, Not Text!"

> Scott: _"Having the judge spit out MORE TEXT would defeat the purpose. We need to QUANTIFY the qualitative output. Structured outputs."_

```
STRUCTURED OUTPUTS — THE KEY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WITHOUT structured outputs:                      │
  │ Judge: "I think this was pretty good because..." │
  │ → MORE TEXT to judge! Defeats the purpose! 🙃  │
  │                                                  │
  │ WITH structured outputs:                         │
  │ Judge: { score: 8, reason: "Correct tool usage" }│
  │ → NUMBERS we can use! ✅                       │
  │                                                  │
  │ "We need to QUANTIFY the QUALITATIVE output."   │
  └──────────────────────────────────────────────────┘

  SECRET HISTORY — Structured Outputs:
  ┌──────────────────────────────────────────────────┐
  │ "BEFORE structured outputs was a thing, people  │
  │  would use tool calling INPUTS for structured   │
  │  outputs."                                       │
  │                                                  │
  │ HOW:                                             │
  │ 1. Create a tool with the schema you want!     │
  │ 2. LLM returns tool call with structured args! │
  │ 3. Take the args object! That's your output!   │
  │ 4. NEVER execute the tool! Don't feed back!    │
  │ 5. "There's not even an execute function.       │
  │     I just want that structured output."        │
  │                                                  │
  │ "Tool calling IS structured outputs. An array   │
  │  of objects. Always that schema."               │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Judge Limitations — "Gaming, Cost, Mom Test!"

> Scott: _"If you give them a hint on the goals, they'll just LIE to you. You need a judge for your judge. Don't tip them off."_

```
JUDGE LIMITATIONS:
═══════════════════════════════════════════════════════════════

  ① COST:
  ┌──────────────────────────────────────────────────┐
  │ "LLMs cost money in tokens and electricity.      │
  │  If you're running 1000s of evals with LLM      │
  │  judges, you're RACKING UP costs."              │
  │                                                  │
  │ "Evals might become your MOST EXPENSIVE line    │
  │  item, more expensive than the users actually   │
  │  using your product."                            │
  │                                                  │
  │ FIX: Open source models on your infrastructure! │
  │ "Much CHEAPER on a token basis, and faster      │
  │  depending on the hardware."                     │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ② GAMING — The Biggest Risk!
  ┌──────────────────────────────────────────────────┐
  │ "Smart models are trained on reinforcement       │
  │  learning — GOAL ACHIEVING. If really smart,    │
  │  they'll figure out ways to achieve that goal." │
  │                                                  │
  │ "If you give a hint on what goals you're trying │
  │  to achieve, they might just GIVE YOU THAT."    │
  │                                                  │
  │ Judge thinking: "The easiest way to achieve my  │
  │  goal is to just LIE to you. So I'll do that." │
  │                                                  │
  │ → "Now you need a judge for your JUDGE!" 😱    │
  │                                                  │
  │ Like the MOM TEST in product:                    │
  │ "You're trying to interview customers without    │
  │  giving them BIAS. Figure out the right          │
  │  questions without INFLUENCING them."            │
  │                                                  │
  │ "It's kind of like that. Get them to do the      │
  │  thing, but don't TIP THEM OFF."                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Data Strategy — "Mock Tools That EXECUTE!"

> Scott: _"In single turn, tools were never EXECUTED. In multi-turn, we DO need to execute them. So we MOCK the results."_

```
SINGLE TURN vs MULTI-TURN DATA:
═══════════════════════════════════════════════════════════════

  SINGLE TURN:
  ┌──────────────────────────────────────────────────┐
  │ Tools had descriptions ONLY!                    │
  │ Never executed! Just checked selection!          │
  │ "All we cared about were the DESCRIPTIONS."     │
  └──────────────────────────────────────────────────┘

  MULTI-TURN:
  ┌──────────────────────────────────────────────────┐
  │ Tools need to be EXECUTED!                       │
  │ → Results fed back to agent!                   │
  │ → Agent decides next step!                     │
  │ → But we MOCK the implementations!             │
  │                                                  │
  │ "We need to execute tools, but not the REAL     │
  │  tools. I don't want evals touching the file    │
  │  system. They'd take forever, it'd be annoying."│
  │                                                  │
  └──────────────────────────────────────────────────┘

  DATA SHAPE:
  ┌──────────────────────────────────────────────────┐
  │ {                                                │
  │   // User input                                  │
  │   input: "Organize my project files",           │
  │                                                  │
  │   // Available tools (with mock results!)       │
  │   tools: [                                       │
  │     { name: "readFile",  result: "..." },       │
  │     { name: "listFiles", result: "[...]" },     │
  │     { name: "writeFile", result: "success" },   │
  │   ],                                             │
  │                                                  │
  │   // Expected behavior                           │
  │   expected: {                                    │
  │     toolOrder: ["listFiles", "readFile", ...],  │
  │     forbiddenTools: ["deleteFile"],              │
  │     outputQuality: "Judge: does response make   │
  │       sense given the task and tool results?"   │
  │   },                                             │
  │                                                  │
  │   // Evaluation criteria (prompt for judge!)    │
  │   criteria: "Score based on completeness and    │
  │     correctness of file organization."           │
  │ }                                                │
  └──────────────────────────────────────────────────┘
```

```
PRIMING MID-CONVERSATION EVALS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Instead of just one user message, we can PRIME │
  │  the messages with a conversation that already  │
  │  happened."                                      │
  │                                                  │
  │ messages = [                                     │
  │   { role: "user", content: "..." },             │
  │   { role: "assistant", content: "..." },        │
  │   { role: "assistant", tool_call: readFile },   │
  │   { role: "tool", result: "fake data..." },     │
  │   { role: "assistant", content: "..." },        │
  │   { role: "user", content: "follow-up!" },← GO!│
  │ ]                                                │
  │                                                  │
  │ "Now we're evaling FOLLOW-UP questions. We      │
  │  noticed users always ask follow-ups and the    │
  │  agent always FAILS there."                     │
  │                                                  │
  │ "We can FAKE all of that!"                      │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Evaluation Criteria — "Deterministic + Semantic!"

> Scott: _"Some are DETERMINISTIC — tool order, tools avoided. For the semantic stuff, we need the JUDGE."_

```
TWO TYPES OF EVALUATORS:
═══════════════════════════════════════════════════════════════

  DETERMINISTIC (no LLM needed!):
  ┌──────────────────────────────────────────────────┐
  │ ① Tool order:                                    │
  │   Expected: [listFiles, readFile, writeFile]    │
  │   Actual: [listFiles, readFile, writeFile] ✅   │
  │   → Simple array comparison!                   │
  │                                                  │
  │ ② Forbidden tools:                               │
  │   Forbidden: [deleteFile, shellExec]            │
  │   Used: [readFile, writeFile] ✅ None forbidden!│
  │   → Check intersection!                        │
  │                                                  │
  └──────────────────────────────────────────────────┘

  SEMANTIC (LLM judge needed!):
  ┌──────────────────────────────────────────────────┐
  │ ③ Output quality:                                │
  │   "Given the task and tool results, does the     │
  │    response MAKE SENSE? Is it CORRECT?"         │
  │   → LLM judge scores 1-10!                    │
  │                                                  │
  │ ④ Factuality:                                    │
  │   "Is the info IN the context we provided?"     │
  │   → LLM judge checks!                         │
  │                                                  │
  │ ⑤ Goal completion:                               │
  │   "Did the agent ACCOMPLISH the goal?"          │
  │   → LLM judge evaluates!                      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  COMBINE & AVERAGE:
  ┌──────────────────────────────────────────────────┐
  │ Tool order score:      0.8                       │
  │ Forbidden tools score: 1.0                       │
  │ LLM judge score:       0.7                       │
  │ ─────────────────────────                        │
  │ Average:               0.83 ← Final score!     │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Multi-Turn Eval System

```javascript
// MULTI-TURN EVAL — From scratch!

// ═══════════════════════════════════
// 1. Mock Tool System
// ═══════════════════════════════════

function createMockTools(toolConfigs) {
  const tools = {};

  for (const config of toolConfigs) {
    tools[config.name] = {
      description: config.description,
      parameters: config.parameters || { type: "object", properties: {} },
      execute: async (args) => {
        // Return MOCK result, not real execution!
        // "I don't want evals touching the file system!"
        if (typeof config.mockResult === "function") {
          return config.mockResult(args);
        }
        return config.mockResult || "success";
      },
    };
  }

  return tools;
}

// "In single turn: tools never EXECUTED!
//  In multi-turn: tools ARE executed, but MOCKED!"
```

```javascript
// ═══════════════════════════════════
// 2. Multi-Turn Executor
// ═══════════════════════════════════

async function multiTurnExecutor(data) {
  const mockTools = createMockTools(data.tools);
  const messages = [
    { role: "system", content: data.systemPrompt || "You are helpful." },
    ...(data.primeMessages || []), // Fake conversation history!
    { role: "user", content: data.input },
  ];

  let fullResponse = "";
  const toolsUsed = [];
  let iterations = 0;
  const maxIterations = data.maxIterations || 20;

  // Run the full agent loop!
  while (iterations < maxIterations) {
    iterations++;

    const response = await callLLM(messages, mockTools);
    const msg = response.choices[0].message;
    messages.push(msg);

    // Tool calls?
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        const args = JSON.parse(tc.function.arguments || "{}");

        toolsUsed.push(name);

        // Execute MOCK tool!
        const result = await mockTools[name].execute(args);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      }
      continue; // Loop continues!
    }

    // Done!
    fullResponse = msg.content || "";
    break;
  }

  return {
    response: fullResponse,
    toolsUsed,
    iterations,
    messages,
  };
}
```

```javascript
// ═══════════════════════════════════
// 3. LLM-as-Judge
// ═══════════════════════════════════

async function llmJudge({ task, toolResults, agentResponse, criteria }) {
  const judgeResponse = await callLLM([
    {
      role: "system",
      content: `You are an evaluation judge. Score the agent's response
on a scale of 1 to 10.

Scoring criteria:
- 10: Fully addresses the task using tool results correctly
- 7-9: Response is mostly correct with minor issues
- 4-6: Response partially addresses the task
- 1-3: Response is mostly incorrect or irrelevant

${criteria || ""}

You MUST respond with a JSON object containing:
- score: number between 1 and 10
- reason: brief explanation for the score`,
    },
    {
      role: "user",
      content: `Task: ${task}
Tool Results: ${JSON.stringify(toolResults)}
Agent Response: ${agentResponse}

Please evaluate this response.`,
    },
  ]);

  // Parse structured output
  try {
    const parsed = JSON.parse(judgeResponse.choices[0].message.content);
    return {
      score: parsed.score / 10, // Normalize to 0-1!
      reason: parsed.reason,
    };
  } catch {
    return { score: 0, reason: "Failed to parse judge response" };
  }
}

// "Use a BIGGER model for the judge!
//  Agent: GPT-4o-mini → Judge: GPT-4o!"
```

```javascript
// ═══════════════════════════════════
// 4. Deterministic Scorers
// ═══════════════════════════════════

function toolOrderScore(expected, actual) {
  // Check if tools were used in expected order
  if (expected.length === 0) return 1.0;

  let expectedIdx = 0;
  for (const tool of actual) {
    if (tool === expected[expectedIdx]) {
      expectedIdx++;
    }
    if (expectedIdx === expected.length) return 1.0;
  }

  return expectedIdx / expected.length;
}

function forbiddenToolScore(forbidden, actual) {
  // Check no forbidden tools were used
  const used = actual.filter((t) => forbidden.includes(t));
  return used.length === 0 ? 1.0 : 0.0;
}

// "Some are DETERMINISTIC: tool order, tools avoided.
//  For the SEMANTIC stuff, we need the judge."
```

```javascript
// ═══════════════════════════════════
// 5. Run Multi-Turn Eval!
// ═══════════════════════════════════

async function runMultiTurnEval(testData) {
  const results = [];

  for (const data of testData) {
    // 1. Run the full agent loop!
    const execution = await multiTurnExecutor(data);

    // 2. Deterministic scores!
    const orderScore = data.expected.toolOrder
      ? toolOrderScore(data.expected.toolOrder, execution.toolsUsed)
      : 1.0;

    const forbiddenScore = data.expected.forbiddenTools
      ? forbiddenToolScore(data.expected.forbiddenTools, execution.toolsUsed)
      : 1.0;

    // 3. LLM judge score!
    const judgeResult = await llmJudge({
      task: data.input,
      toolResults: execution.toolsUsed,
      agentResponse: execution.response,
      criteria: data.criteria,
    });

    // 4. Combine!
    const overall = (orderScore + forbiddenScore + judgeResult.score) / 3;

    results.push({
      input: data.input,
      scores: {
        toolOrder: orderScore,
        forbidden: forbiddenScore,
        judge: judgeResult.score,
        judgeReason: judgeResult.reason,
        overall,
      },
      iterations: execution.iterations,
    });

    console.log(
      `📊 "${data.input.slice(0, 40)}..." → ${(overall * 100).toFixed(0)}%`,
    );
  }

  // Average!
  const avg =
    results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length;
  console.log(`\n📈 Overall average: ${(avg * 100).toFixed(1)}%`);

  return results;
}
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO CẦN MULTI-TURN EVAL?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao single turn không đủ?
  └→ "Did it pick first tool correctly but second is WRONG?
     Single turn only has one chance to pick one tool."

  WHY ②: Tại sao cần LLM-as-judge?
  └→ "The only way to eval human language reliably is
     INTELLIGENCE. Regex won't work — LLMs are
     nondeterministic!"

  WHY ③: Tại sao judge phải dùng bigger model?
  └→ "Use a more POWERFUL model to judge a less powerful
     one. Otherwise the judge might not catch mistakes
     the agent makes."

  WHY ④: Tại sao mock tools thay vì real tools?
  └→ "I don't want evals touching the FILE SYSTEM.
     They'd take FOREVER, it'd be annoying."
     Cost, time, side effects all avoided!

  WHY ⑤: Tại sao score 1-10 thay vì 0-1?
  └→ "Floating points with LLMs — really hard. Not good
     accurate results. Just use real numbers, divide
     by 10 yourself. Through TONS of testing."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — MULTI-TURN EVAL:
═══════════════════════════════════════════════════════════════

  Eval = Data + Executor + Scorers

  ┌──────────────────────────────────────────────────┐
  │ In SINGLE turn:                                  │
  │ → Executor = one LLM call, check tool selection │
  │ → Tools not executed!                           │
  │ → Scorers = deterministic (F1, forbidden)       │
  │                                                  │
  │ In MULTI turn:                                   │
  │ → Executor = FULL agent loop!                  │
  │ → Tools ARE executed (mocked!)                 │
  │ → Scorers = deterministic + LLM judge!         │
  │                                                  │
  │ Same framework, different scope!                │
  └──────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬───────────────────┐
  │                  │ Single turn  │ Multi turn        │
  ├──────────────────┼──────────────┼───────────────────┤
  │ Tests            │ Tool select  │ Full loop!        │
  │ Cost             │ ✅ Cheap!    │ ❌ Expensive!     │
  │ Speed            │ ✅ Fast!     │ ⚠️ Slow!          │
  │ Catches loops    │ ❌ No!       │ ✅ Yes!           │
  │ Catches lies     │ ❌ No!       │ ✅ Yes!           │
  │ User-facing      │ ⚠️ Dev only  │ ✅ User POV!      │
  │ Judge needed     │ ❌ No!       │ ✅ LLM judge!     │
  └──────────────────┴──────────────┴───────────────────┘

  ┌──────────────────┬──────────────┬───────────────────┐
  │ Judge model      │ Same model   │ Bigger model      │
  ├──────────────────┼──────────────┼───────────────────┤
  │ Cost             │ ✅ Cheaper!  │ ❌ More expensive! │
  │ Accuracy         │ ⚠️ May miss! │ ✅ Catches more!  │
  │ Gaming risk      │ ❌ Higher!   │ ⚠️ Lower!         │
  └──────────────────┴──────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — MULTI-TURN EVAL PIPELINE:
═══════════════════════════════════════════════════════════════

  Test data
       │
       ▼
  Multi-turn executor (full loop!)
  ┌────────────────────────────────┐
  │ messages → LLM → tool call?  │
  │    ├── YES → mock execute!   │
  │    │   push result → LOOP!   │
  │    └── NO → response! DONE! │
  └────────────────────────────────┘
       │
       ▼
  Collect: response + toolsUsed + iterations
       │
       ├── Deterministic scorers:
       │   → Tool order score!
       │   → Forbidden tool score!
       │
       └── Semantic scorer:
           → LLM judge! (bigger model!)
           → Score 1-10 + reason!
       │
       ▼
  Combine scores → average → final metric!
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — Gaming Prevention:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ THE PROBLEM:                                     │
  │ "Models are trained on reinforcement learning —  │
  │  GOAL ACHIEVING. If you give a hint on what      │
  │  goals, they'll just GIVE YOU THAT."            │
  │                                                  │
  │ BAD: "Score this response. A good response       │
  │  should mention file organization."             │
  │ → Judge: "Score 10! It mentions file org!"     │
  │   (Even if it didn't really do it well!)        │
  │                                                  │
  │ GOOD: "Evaluate this response based on the       │
  │  task requirements. Explain your reasoning."    │
  │ → Judge actually thinks about it!              │
  │                                                  │
  │ "Like the MOM TEST: interview without bias.      │
  │  Get them to do the thing, but don't TIP OFF."  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — EVAL EVOLUTION:
═══════════════════════════════════════════════════════════════

  Manual testing ("does this look right?"):
  │ → Vibes! No metrics!
  │
  ↓
  Single-turn evals:
  │ → Tool selection scoring!
  │ → Deterministic, cheap, fast!
  │
  ↓
  Multi-turn evals:
  │ → Full loop testing!
  │ → LLM-as-judge for text outputs!
  │ → Structured outputs for reliable scoring!
  │
  ↓
  Advanced:
  │ → Mid-conversation priming!
  │ → Multiple judges averaging!
  │ → Open source judges (cheaper!)
  │ → Anti-gaming techniques!
  │
  ↓
  → "LLMs all the way down. It always has been."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 17:
═══════════════════════════════════════════════════════════════

  CONCEPTS:
  [ ] Single turn = tool selection! Multi turn = full loop!
  [ ] "Do you care about ORDER as long as job is done?"
  [ ] Multi-turn catches: loops, lies, giving up, won't stop!

  LLM AS JUDGE:
  [ ] "Only way to eval human language = intelligence!"
  [ ] Use BIGGER model to judge smaller model!
  [ ] Structured outputs for reliable scoring!
  [ ] Score 1-10 (not 0-1!) because floating points hard!

  DATA STRATEGY:
  [ ] Mock tools that EXECUTE (not real file system!)
  [ ] Prime messages for mid-conversation evals!
  [ ] "Fake all of that if we want!"

  LIMITATIONS:
  [ ] Cost: evals can be MORE expensive than production!
  [ ] Gaming: models lie to achieve goals!
  [ ] "Like the MOM TEST — don't tip them off!"

  EVALUATOR MIX:
  [ ] Deterministic: tool order, forbidden tools!
  [ ] Semantic: LLM judge for text quality!
  [ ] Combine & average for final score!

  TIẾP THEO → Phần 18: Coding a System Prompt (LLM Judge)!
```
