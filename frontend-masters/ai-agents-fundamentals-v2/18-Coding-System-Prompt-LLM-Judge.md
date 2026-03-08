# AI Agents Fundamentals, v2 — Phần 18: Coding a System Prompt (LLM Judge) — "Generate Object, Not Text!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Coding a System Prompt — "Schema + Generate Object + Reasoning Effort HIGH!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Structured outputs, LLM judge implementation!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Judge Schema — "Score 1-10, Not 0-1! And ALWAYS A Reason!" |
| 2   | Why 1-10? — "Floating Points With LLMs Don't Work!"        |
| 3   | The Reason Trick — "Explain Yourself = Better Quality!"    |
| 4   | Generate Object — "Same As Generate Text, But Schema!"     |
| 5   | Structured Outputs History — "Tool Calling Was The Hack!"  |
| 6   | Judge System Prompt — "Scoring Rubric = Clear Rules!"      |
| 7   | Tự Implement: Full LLM Judge                               |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu         |

---

## §1. Judge Schema — "Score 1-10, Not 0-1! And ALWAYS A Reason!"

> Scott: _"We're going to make a Zod schema. Score must be a number, minimum 1, maximum 10. And I always like to put a REASON."_

```javascript
// THE JUDGE SCHEMA — Structured output!

import { z } from "zod";

const judgeSchema = z.object({
  score: z
    .number()
    .min(1)
    .max(10)
    .describe("Score from 1 to 10 where 10 is perfect"),

  reason: z.string().describe("Brief explanation for the score"),
});

// "This schema is very similar to tool calling INPUT schemas.
//  Same concept! Structured outputs!"
```

```
SCHEMA BREAKDOWN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ judgeSchema = {                                  │
  │   score: number (1-10)                           │
  │   → .min(1) .max(10)                           │
  │   → .describe("Score 1 to 10, 10 = perfect")  │
  │                                                  │
  │   reason: string                                 │
  │   → .describe("Brief explanation")             │
  │ }                                                │
  │                                                  │
  │ OUTPUT EXAMPLE:                                  │
  │ {                                                │
  │   score: 8,                                      │
  │   reason: "Agent correctly identified the file  │
  │     and used readFile, but missed sorting."     │
  │ }                                                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Why 1-10? — "Floating Points With LLMs Don't Work!"

> Scott: _"In my experience, it's really hard to get accurate results with floating points. I just do real numbers and divide by 10 myself."_

```
WHY 1-10 INSTEAD OF 0-1:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ❌ WHAT YOU MIGHT EXPECT: 0.0 to 1.0            │
  │ "I don't know if Zod even supports that.         │
  │  Floating points with LLMs — really hard.       │
  │  You're NOT going to get really good accurate   │
  │  results."                                       │
  │                                                  │
  │ LLM output: 0.7                                  │
  │ But actually: 0.700000001 ← floating point! 🤮 │
  │ Or: 0.7000 ← extra zeros!                      │
  │ Or: "0.7" ← string instead of number!          │
  │                                                  │
  │ ✅ WHAT ACTUALLY WORKS: 1 to 10                 │
  │ "Just do real numbers! I'll divide by 10 myself.│
  │  It's easier, and that's through TONS of         │
  │  testing."                                       │
  │                                                  │
  │ LLM output: 7 ← clean integer!                 │
  │ Your math: 7 / 10 = 0.7 ← you do the division!│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. The Reason Trick — "Explain Yourself = Better Quality!"

> Scott: _"By asking an LLM to give a REASON why it did what it did, it makes it THINK HARDER about it. The quality goes up LIKE CRAZY."_

```
THE REASON FIELD — DUAL PURPOSE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PURPOSE 1: Useful for US (developers!)           │
  │ → See WHY the judge gave that score!           │
  │ → Debug: "Oh, it scored 3 because it missed    │
  │   the file sorting requirement."                │
  │                                                  │
  │ PURPOSE 2: Makes LLM THINK HARDER! 🧠          │
  │ → "What I've noticed: by asking an LLM to      │
  │    give us a reason, it makes it THINK HARDER   │
  │    about it."                                    │
  │                                                  │
  │ → "Before reasoning models, this was literally  │
  │    like if you added this ONE THING, quality    │
  │    will go up LIKE CRAZY."                      │
  │                                                  │
  │ → "It's like: explain yourself, give me the     │
  │    steps that led to this conclusion. And it's  │
  │    like, oh well, now that I got to TELL you... │
  │    And the quality is SO much better."          │
  │                                                  │
  │ → "Less important with reasoning models, but    │
  │    still ensures LLM isn't going to be LAZY."  │
  │                                                  │
  │ → "Now that you have to EXPLAIN it, you really │
  │    got to think about it."                      │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Generate Object — "Same As Generate Text, But Schema!"

> Scott: _"Generate object is the same as generate text, except it takes a schema and returns an OBJECT in the shape of the schema."_

```javascript
// GENERATE OBJECT — The LLM Judge!

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

export async function llmJudge(output, target) {
  const result = await generateObject({
    // Use a BIGGER model!
    model: openai("gpt-4o-2024-01-01"),

    // The schema! Judge MUST return this shape!
    schema: judgeSchema,

    // Required: name for the schema
    schemaName: "evaluation",

    // Required: describe what the schema is
    schemaDescription: "An evaluation of an AI agent response",

    // Reasoning effort: HIGH!
    providerOptions: {
      openai: {
        reasoningEffort: "high",
        // "I want this thing to REALLY think about it."
      },
    },

    // Messages!
    messages: [
      {
        role: "system",
        content: `You are an evaluation judge. Score the agent's 
response on a scale of 1 to 10.

Scoring criteria:
- 10: Fully addresses the task using tool results correctly
- 7-9: Response is mostly correct with minor issues
- 4-6: Response partially addresses the task
- 1-3: Response is mostly incorrect or irrelevant`,
      },
      {
        role: "user",
        content: `Task: ${output.task}
Tool Results: ${JSON.stringify(output.toolResults)}
Agent Response: ${output.response}
Expected Behavior: ${JSON.stringify(target)}`,
      },
    ],
  });

  // result.object is ALREADY typed!
  // { score: 8, reason: "..." }
  return result.object;
}
```

```
GENERATE TEXT vs GENERATE OBJECT:
═══════════════════════════════════════════════════════════════

  generateText:
  ┌──────────────────────────────────────────────────┐
  │ Input: model, messages, tools                    │
  │ Output: STRING! "Here's what I think..."        │
  │ → "Having the judge spit out MORE TEXT would    │
  │    defeat the purpose!"                          │
  └──────────────────────────────────────────────────┘

  generateObject:
  ┌──────────────────────────────────────────────────┐
  │ Input: model, messages, SCHEMA!                  │
  │ Output: OBJECT! { score: 8, reason: "..." }     │
  │                                                  │
  │ NEW arguments:                                   │
  │ → schema: z.object({...}) ← Zod schema!       │
  │ → schemaName: "evaluation"                     │
  │ → schemaDescription: "An evaluation of..."     │
  │                                                  │
  │ "Literally the SAME thing minus passing          │
  │  in that schema."                                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Structured Outputs History — "Tool Calling Was The Hack!"

> Scott: _"Before structured outputs, people would use tool calling inputs — not to EXECUTE a tool, just to get the args object."_

```
THE EVOLUTION:
═══════════════════════════════════════════════════════════════

  ERA 1: No structured outputs! 😢
  ┌──────────────────────────────────────────────────┐
  │ LLM: "I think the score is about 7 out of 10   │
  │ because the response was mostly correct..."     │
  │                                                  │
  │ Developer: *parses text with regex* 😵          │
  │ → Unreliable! Nondeterministic!                │
  └──────────────────────────────────────────────────┘

  ERA 2: Tool calling HACK! 🧠
  ┌──────────────────────────────────────────────────┐
  │ "People set up tool calls NOT for executing a   │
  │  tool, but JUST for structured outputs."        │
  │                                                  │
  │ 1. Define tool with desired schema!            │
  │ 2. LLM returns tool call with structured args! │
  │ 3. Take the args! That's the output!           │
  │ 4. NEVER execute the tool! Never feed back!    │
  │ 5. "Not even an execute function."              │
  │                                                  │
  │ // Fake tool just for structured output!        │
  │ const judgeTool = {                              │
  │   name: "submit_score",                         │
  │   schema: { score: number, reason: string },   │
  │   execute: null, // Never called!              │
  │ };                                               │
  │                                                  │
  │ "Tool calling IS structured outputs.             │
  │  An array of objects. Always that schema."      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ERA 3: Native structured outputs! ✅
  ┌──────────────────────────────────────────────────┐
  │ generateObject({ schema: judgeSchema })         │
  │ → Returns typed object directly!               │
  │ → No hack needed!                              │
  │ → Clean API!                                   │
  └──────────────────────────────────────────────────┘
```

---

## §6. Judge System Prompt — "Scoring Rubric = Clear Rules!"

> Scott: _"You can put WHATEVER you want. There's no wrong answer. But you need clear scoring criteria."_

```
SYSTEM PROMPT FOR JUDGE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "You are an evaluation judge. Score the agent's  │
  │  response on a scale of 1 to 10."              │
  │                                                  │
  │ SCORING CRITERIA:                                │
  │ ┌────────────────────────────────────────────┐  │
  │ │ 10:  Fully addresses the task using tool   │  │
  │ │      results CORRECTLY!                    │  │
  │ │ 7-9: Response is mostly correct with       │  │
  │ │      MINOR issues!                         │  │
  │ │ 4-6: Response PARTIALLY addresses the task!│  │
  │ │ 1-3: Response is mostly INCORRECT or       │  │
  │ │      IRRELEVANT!                           │  │
  │ └────────────────────────────────────────────┘  │
  │                                                  │
  │ "You can put whatever you want here. You got    │
  │  to figure out what works for YOU."             │
  │                                                  │
  │ "You can even out this thing — adjust the       │
  │  ranges, add more criteria, make it stricter    │
  │  or more lenient."                               │
  │                                                  │
  └──────────────────────────────────────────────────┘

  USER MESSAGE TO JUDGE:
  ┌──────────────────────────────────────────────────┐
  │ Include:                                         │
  │ → The original TASK (what user asked!)          │
  │ → The TOOL RESULTS (what tools returned!)      │
  │ → The agent's RESPONSE (what it said!)          │
  │ → The EXPECTED behavior (what we wanted!)      │
  │                                                  │
  │ "The judge can look at the original task,        │
  │  the mock results, and the response. Does it    │
  │  make sense? Did it accomplish the goal?"       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Full LLM Judge

```javascript
// COMPLETE LLM JUDGE — From scratch!

// ═══════════════════════════════════
// 1. Judge Schema (Zod!)
// ═══════════════════════════════════

const judgeSchema = {
  type: "object",
  properties: {
    score: {
      type: "number",
      minimum: 1,
      maximum: 10,
      description: "Score from 1 to 10 where 10 is perfect",
    },
    reason: {
      type: "string",
      description: "Brief explanation for the score",
    },
  },
  required: ["score", "reason"],
};

// "Why not 0-1? Floating points with LLMs don't work.
//  Just use integers and divide by 10 yourself."
```

```javascript
// ═══════════════════════════════════
// 2. Judge Function (raw API!)
// ═══════════════════════════════════

async function llmJudge({
  task,
  toolResults,
  agentResponse,
  expectedBehavior,
  criteria,
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o", // "Use a BIGGER model!"
      messages: [
        {
          role: "system",
          content: `You are an evaluation judge. Score the agent's 
response on a scale of 1 to 10.

Scoring criteria:
- 10: Fully addresses the task using tool results correctly
- 7-9: Response is mostly correct with minor issues
- 4-6: Response partially addresses the task
- 1-3: Response is mostly incorrect or irrelevant

${criteria || "Be fair and thorough in your evaluation."}`,
        },
        {
          role: "user",
          content: `
Original Task: ${task}
Tool Results Available: ${JSON.stringify(toolResults, null, 2)}
Agent's Response: ${agentResponse}
Expected Behavior: ${JSON.stringify(expectedBehavior, null, 2)}

Evaluate the agent's response. Return your evaluation as JSON.`,
        },
      ],
      // Structured outputs with JSON schema!
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evaluation",
          description: "An evaluation of an AI agent response",
          schema: judgeSchema,
        },
      },
    }),
  });

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    score: parsed.score / 10, // Normalize to 0-1!
    rawScore: parsed.score, // Keep original 1-10!
    reason: parsed.reason,
  };
}
```

```javascript
// ═══════════════════════════════════
// 3. The Reason Trick — In action!
// ═══════════════════════════════════

// WITHOUT reason field:
// Judge: { score: 7 }
// → Fast, lazy, might not think hard!

// WITH reason field:
// Judge: {
//   score: 7,
//   reason: "The agent correctly used readFile to access
//     package.json and extracted the project name. However,
//     it failed to mention the version number which was
//     also requested in the task."
// }
// → THINKS HARDER! Better quality scoring!
// → "Now that you have to EXPLAIN it, you really
//    got to think about it."
```

```javascript
// ═══════════════════════════════════
// 4. Usage in multi-turn eval!
// ═══════════════════════════════════

async function evaluateMultiTurn(testCase) {
  // Run agent loop (with mock tools!)
  const agentResult = await runAgentLoop(testCase);

  // Deterministic scores
  const toolOrderScore = checkToolOrder(
    testCase.expected.toolOrder,
    agentResult.toolsUsed,
  );
  const forbiddenScore = checkForbiddenTools(
    testCase.expected.forbiddenTools,
    agentResult.toolsUsed,
  );

  // LLM Judge score!
  const judgeResult = await llmJudge({
    task: testCase.input,
    toolResults: agentResult.toolResults,
    agentResponse: agentResult.response,
    expectedBehavior: testCase.expected,
    criteria: testCase.judgeCriteria,
  });

  // Combine!
  const overall = (toolOrderScore + forbiddenScore + judgeResult.score) / 3;

  console.log(`
    📊 Eval Results:
    ├── Tool Order:  ${(toolOrderScore * 100).toFixed(0)}%
    ├── Forbidden:   ${(forbiddenScore * 100).toFixed(0)}%
    ├── Judge:       ${(judgeResult.score * 100).toFixed(0)}%
    │   └── "${judgeResult.reason}"
    └── Overall:     ${(overall * 100).toFixed(0)}%
  `);

  return { overall, details: { toolOrderScore, forbiddenScore, judgeResult } };
}
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO JUDGE DESIGN NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần Zod schema cho judge?
  └→ "Having judge spit out text defeats the purpose.
     We need to QUANTIFY qualitative output."

  WHY ②: Tại sao score 1-10 thay vì 0-1?
  └→ "Floating points with LLMs — really hard.
     Through TONS of testing. Just integers!"

  WHY ③: Tại sao luôn có reason field?
  └→ "Makes LLM THINK HARDER. Before reasoning models,
     add this ONE THING = quality goes up LIKE CRAZY."

  WHY ④: Tại sao generateObject thay vì generateText?
  └→ "Same thing, but returns an OBJECT in the shape
     of the schema. No text parsing needed!"

  WHY ⑤: Tại sao reasoning effort = high?
  └→ "I want this thing to REALLY think about it.
     This is a JUDGE — accuracy matters more than speed!"
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — STRUCTURED OUTPUTS:
═══════════════════════════════════════════════════════════════

  Tool calling inputs = Structured Outputs!
  generateObject = Structured Outputs!
  They're THE SAME CONCEPT!

  ┌──────────────────────────────────────────────────┐
  │ TOOL CALLING:                                    │
  │ Schema → LLM returns args matching schema!     │
  │ → For tool execution!                          │
  │                                                  │
  │ GENERATE OBJECT:                                 │
  │ Schema → LLM returns object matching schema!   │
  │ → For any structured data needs!               │
  │                                                  │
  │ "Tool calling IS structured outputs.             │
  │  An array of objects. Always that schema.        │
  │  The ONLY difference is what you DO with it."   │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ generateText  │ generateObject    │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Output           │ Free text     │ Typed object      │
  │ Parsing needed   │ ❌ YES! Regex │ ✅ No! Built-in   │
  │ Reliability      │ ⚠️ Non-det   │ ✅ Schema enforced │
  │ Use case         │ Chat, prose   │ Scores, data      │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Reason field     │ Without       │ With              │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Quality          │ ⚠️ Lazy!      │ ✅ Thinks harder! │
  │ Debugging        │ ❌ Blind!     │ ✅ Know why!      │
  │ Tokens           │ ✅ Fewer!     │ ⚠️ More tokens!   │
  │ With reasoning   │ ⚠️ Matters   │ ✅ Still helps!    │
  │ models           │    less       │                   │
  └──────────────────┴───────────────┴───────────────────┘
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — JUDGE PIPELINE:
═══════════════════════════════════════════════════════════════

  Agent output (text!)
       │
       ▼
  generateObject({
    model: "gpt-4o" (bigger!),
    schema: judgeSchema,
    schemaName: "evaluation",
    providerOptions: { reasoningEffort: "high" },
    messages: [system rubric, user context],
  })
       │
       ▼
  result.object = { score: 8, reason: "..." }
       │
       ▼
  Normalize: 8 / 10 = 0.8
       │
       ▼
  Combine with deterministic scores → final!
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — ERA 2 HACK:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ BEFORE generateObject existed:                   │
  │                                                  │
  │ const fakeTool = {                               │
  │   name: "submit_evaluation",                    │
  │   description: "Submit your evaluation",        │
  │   schema: z.object({                            │
  │     score: z.number().min(1).max(10),           │
  │     reason: z.string(),                          │
  │   }),                                            │
  │   // NO execute function!                       │
  │ };                                               │
  │                                                  │
  │ const result = await generateText({              │
  │   tools: { submit_evaluation: fakeTool },       │
  │   toolChoice: "required",                        │
  │ });                                              │
  │                                                  │
  │ // Grab the args! That's the structured output! │
  │ const evaluation = result.toolCalls[0].args;    │
  │ // { score: 8, reason: "..." }                  │
  │                                                  │
  │ // NEVER feed back to LLM!                      │
  │ // "Not even an execute function."              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — STRUCTURED OUTPUTS:
═══════════════════════════════════════════════════════════════

  Regex parsing LLM text:
  │ → "Unreliable! LLMs are nondeterministic!"
  │
  ↓
  Tool calling hack (Era 2):
  │ → Use tool schema for structured output!
  │ → Never execute! Just grab the args!
  │ → "Clever but hacky!"
  │
  ↓
  Native structured outputs (Era 3):
  │ → generateObject({ schema })!
  │ → Clean API! First-class support!
  │ → "The same thing as tool calling
  │    but without the hack."
  │
  ↓
  Future: More sophisticated schemas!
  │ → Nested objects, arrays, enums!
  │ → Multi-schema validation!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 18:
═══════════════════════════════════════════════════════════════

  JUDGE SCHEMA:
  [ ] Zod schema: score (1-10) + reason!
  [ ] "Floating points don't work — use integers!"
  [ ] "Reason makes LLM THINK HARDER!"

  GENERATE OBJECT:
  [ ] Same as generateText but with SCHEMA!
  [ ] schema + schemaName + schemaDescription!
  [ ] Returns typed object, not text!

  REASONING EFFORT:
  [ ] providerOptions: { openai: { reasoningEffort: "high" } }!
  [ ] "I want this thing to REALLY think about it."

  SYSTEM PROMPT:
  [ ] Clear scoring rubric (10, 7-9, 4-6, 1-3)!
  [ ] "You can put whatever you want!"
  [ ] "Figure out what works for YOU!"

  STRUCTURED OUTPUTS HISTORY:
  [ ] Era 1: regex parsing (unreliable!)
  [ ] Era 2: tool calling hack (clever!)
  [ ] Era 3: generateObject (clean!)
  [ ] "Tool calling IS structured outputs!"

  TIẾP THEO → Phần 19: Multi-Turn Eval Executor!
```
