# AI Agents Fundamentals, v2 — Phần 19: Coding a User Message & Multi-Turn Executor — "Collect Everything For The Judge!"

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Coding a User Message — "Generate Object Returns .object, Build The Executor, Collect All Steps!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Multi-turn executor, step collection, judge integration!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | User Message For Judge — "Task + Tools + Results + Response!" |
| 2   | result.object — "Always .object When Using generateObject!"   |
| 3   | Multi-Turn Executor — "Like run.ts But For Evals!"            |
| 4   | Building Mock Tools — "Same Format, Fake Results!"            |
| 5   | Using SDK Loop — "generateText + maxSteps = Free Loop!"       |
| 6   | Collecting Steps — "result.steps For Everything!"             |
| 7   | The Levers You Can Pull — "Prompt, Model, Loop, Context!"     |
| 8   | Tự Implement: Full Multi-Turn Executor                        |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu            |

---

## §1. User Message For Judge — "Task + Tools + Results + Response!"

> Scott: _"We want to add context: the original task, the tools that were called, the tool results, and the agent's final answer."_

```javascript
// THE USER MESSAGE TO THE JUDGE

messages: [
  {
    role: "system",
    content: "You are an evaluation judge...",
    // Scoring rubric here!
  },
  {
    role: "user",
    content: `
Here's the task that the user was given:
${target.originalTask}

Here are the tools that were called:
${JSON.stringify(output.toolCallOrder)}

Here are the tool results for each tool:
${JSON.stringify(target.mockToolResults)}

Here is the agent's final answer:
${output.text}

Evaluate if this response correctly uses
the tool results to answer the task.
    `,
  },
],
```

```
USER MESSAGE BREAKDOWN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ① Original task:                                 │
  │ "Read the package.json and tell me the name"    │
  │ → target.originalTask!                         │
  │                                                  │
  │ ② Tools called (in ORDER!):                      │
  │ ["readFile"] or ["listFiles", "readFile"]       │
  │ → JSON.stringify(output.toolCallOrder)!        │
  │ → "Must stringify! Everything = string!"       │
  │                                                  │
  │ ③ Tool results:                                  │
  │ { readFile: '{"name":"my-project",...}' }       │
  │ → JSON.stringify(target.mockToolResults)!       │
  │                                                  │
  │ ④ Agent's final answer:                          │
  │ "The project name is my-project"                │
  │ → output.text!                                 │
  │                                                  │
  │ ⑤ Evaluation instruction:                        │
  │ "Evaluate if this response correctly uses        │
  │  the tool results to answer the task."          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ALTERNATIVES — "There's so many ways to represent this!":
  ┌──────────────────────────────────────────────────┐
  │ → Put this in system prompt instead?            │
  │ → Convert to XML? (some models prefer XML!)    │
  │ → Better formatting/spacing?                   │
  │ → "You'd have to EXPERIMENT."                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. result.object — "Always .object When Using generateObject!"

> Scott: _"It's always a .object. When you do generateObject, that object is going to be in the shape of the schema."_

```javascript
// RETURNING THE JUDGE SCORE

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: judgeSchema,
  schemaName: "evaluation",
  // ...messages
});

// result.object IS the typed object!
// { score: 8, reason: "..." }

return result.object.score / 10;
// 8 / 10 = 0.8 ← Normalized!

// "It's 1 through 10 and we want 0 through 1,
//  so we divide by 10."
```

```
generateText vs generateObject — RETURN VALUES:
═══════════════════════════════════════════════════════════════

  generateText:
  ┌──────────────────────────────────────────────────┐
  │ result.text = "Here's my response..."           │
  │ result.toolCalls = [...]                         │
  │ result.steps = [...]                             │
  │ result.finishReason = "stop"                     │
  └──────────────────────────────────────────────────┘

  generateObject:
  ┌──────────────────────────────────────────────────┐
  │ result.object = { score: 8, reason: "..." }     │
  │ → TYPED! Matches schema shape!                 │
  │ → "It's always a .object"                      │
  │                                                  │
  │ "Just another LLM call. Pretty self-explanatory."│
  └──────────────────────────────────────────────────┘
```

---

## §3. Multi-Turn Executor — "Like run.ts But For Evals!"

> Scott: _"We're going to do something very similar to the run function, but we're not going to stream. We need the loop that does the thing and collects all information."_

```javascript
// MULTI-TURN EXECUTOR — The eval version of run.ts!

export const multiTurnWithMocks = async (data) => {
  // 1. Build mock tools!
  const tools = buildMockTools(data);
  // "Make sure tools are formatted correctly
  //  and execute returns the mock return value."

  // 2. Build messages!
  const messages = [];

  // If there's a pre-existing conversation, start with that!
  if (data.messages) {
    messages.push(...data.messages);
  } else {
    // Otherwise, start fresh!
    messages.push({
      role: "system",
      content: systemPrompt, // Same as our runner!
    });
  }

  // Add user prompt!
  messages.push({
    role: "user",
    content: data.prompt!,
  });

  // 3. Use generateText with internal loop!
  const result = await generateText({
    model: openai(data.model || "gpt-4o-mini"),
    messages,
    tools,
    maxSteps: data.maxSteps || 20,
    // "We don't want to build the loop ourselves.
    //  We can use Vercel AI SDK to do the looping."
  });

  // 4. Collect everything for the judge!
  // ... (see §6)
};
```

```
WHY A SEPARATE EXECUTOR:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ run.ts (the actual agent!):                      │
  │ → Streaming! (streamText)                      │
  │ → UI callbacks! (onToken, onToolCall)          │
  │ → Interactive! User sees output!               │
  │                                                  │
  │ multiTurnWithMocks (the eval executor!):         │
  │ → No streaming! (generateText)                 │
  │ → No UI! Just collect data!                    │
  │ → Mock tools! Not real file system!            │
  │ → "We need to collect info to REPORT it."      │
  │                                                  │
  │ "We're not going to stream, not going to do      │
  │  any of that stuff. But we DO need the loop."   │
  └──────────────────────────────────────────────────┘
```

---

## §4. Building Mock Tools — "Same Format, Fake Results!"

> Scott: _"buildMockTools makes sure tools are formatted correctly and the execute function returns whatever the mock return we set up."_

```javascript
// BUILD MOCK TOOLS

function buildMockTools(data) {
  const tools = {};

  for (const toolConfig of data.mockTools) {
    tools[toolConfig.name] = {
      description: toolConfig.description,
      parameters: toolConfig.parameters || {
        type: "object",
        properties: {},
      },
      execute: async (args) => {
        // Return the MOCK result, not real execution!
        return toolConfig.mockReturn;
        // "The execute function returns whatever
        //  the mock return for that tool."
      },
    };
  }

  return tools;
}
```

```
MOCK TOOL DATA EXAMPLE:
═══════════════════════════════════════════════════════════════

  // From multi-turn.json:
  {
    "name": "readFile",
    "description": "Read the contents of a file",
    "parameters": {
      "type": "object",
      "properties": {
        "path": { "type": "string" }
      },
      "required": ["path"]
    },
    "mockReturn": "{\"name\":\"my-project\",\"version\":\"1.0\"}"
  }

  // buildMockTools turns this into:
  tools.readFile = {
    description: "Read the contents of a file",
    parameters: { ... },
    execute: async () => '{"name":"my-project","version":"1.0"}',
    //                    ↑ Always returns mock data!
  }
```

---

## §5. Using SDK Loop — "generateText + maxSteps = Free Loop!"

> Scott: _"We don't want to build this loop ourselves. We can just use the Vercel AI SDK. maxSteps = controllable by the data."_

```javascript
// USING THE SDK'S INTERNAL LOOP

const result = await generateText({
  model: openai(data.model || "gpt-4o-mini"),
  messages,
  tools,
  maxSteps: data.maxSteps || 20,
  // "Because we don't want to build this loop ourselves,
  //  we'll just say maxSteps. We can use the SDK."
  // "If you passed in a maxSteps, we honor that.
  //  Otherwise, pick a number: 20."
});

// result.steps gives us ALL the step data!
// "We get access to the steps property on generateText
//  if we do the internal loop with the AI SDK."
```

```
WHY USE SDK LOOP HERE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ In run.ts:                                       │
  │ → Custom while(true) loop!                     │
  │ → Full control! Streaming! UI callbacks!        │
  │ → "I personally don't use traditional loop."    │
  │                                                  │
  │ In eval executor:                                │
  │ → SDK loop with maxSteps!                      │
  │ → No UI needed! Just collect data!             │
  │ → "We didn't write our own custom loop, so we  │
  │    have to go back and inspect all the steps    │
  │    and get the data ourselves."                 │
  │                                                  │
  │ TRADE-OFF:                                       │
  │ Custom loop = data available during execution!  │
  │ SDK loop = data available AFTER via result.steps!│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Collecting Steps — "result.steps For Everything!"

> Scott: _"We have to go back and inspect all the steps and get the data ourselves. Collect tool calls, results, and text."_

```javascript
// COLLECTING ALL THE DATA FROM result.steps

const allToolCalls = [];

const steps = result.steps.map((step) => {
  // Get tool calls for this step (might be parallel!)
  const stepToolCalls = (step.toolCalls || []).map((tc) => {
    allToolCalls.push(tc.toolName); // Track order!
    return {
      toolName: tc.toolName,
      args: tc.args,
    };
  });

  // Get tool results for this step
  const stepToolResults = (step.toolResults || []).map((tr) => ({
    toolName: tr.toolName,
    result: tr.result || null,
  }));

  // Return step summary!
  return {
    toolCalls: stepToolCalls.length > 0 ? stepToolCalls : undefined,
    toolResults: stepToolResults.length > 0 ? stepToolResults : undefined,
    text: step.text, // Final step has text, others don't!
  };
});

// Deduplicated tool names!
const toolsUsed = [...new Set(allToolCalls)];

// Return everything!
return {
  text: result.text, // Final agent response!
  steps, // All step details!
  toolsUsed, // Unique tools used!
  toolCallOrder: allToolCalls, // Order matters!
};
```

```
WHAT result.steps LOOKS LIKE:
═══════════════════════════════════════════════════════════════

  result.steps = [
    STEP 0:
    ┌──────────────────────────────────────────┐
    │ toolCalls: [{ toolName: "readFile",      │
    │              args: { path: "pkg.json" } }]│
    │ toolResults: [{ toolName: "readFile",    │
    │                result: '{"name":"..."}' }]│
    │ text: undefined ← Not done yet!         │
    └──────────────────────────────────────────┘

    STEP 1:
    ┌──────────────────────────────────────────┐
    │ toolCalls: [] ← No more tools!          │
    │ toolResults: []                           │
    │ text: "The project name is my-project"   │
    │       ↑ Final response!                  │
    └──────────────────────────────────────────┘
  ]

  FROM THIS WE COLLECT:
  → allToolCalls = ["readFile"]
  → toolsUsed = ["readFile"]
  → text = "The project name is my-project"
```

---

## §7. The Levers You Can Pull — "Prompt, Model, Loop, Context!"

> Scott: _"Every time I look up inspiration on how to eval agents, I've NEVER seen the same thing twice. The only thing consistent is: you're running experiments against a non-deterministic system."_

```
THE LEVERS TO IMPROVE AGENT QUALITY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "There's a bunch of stuff in your tool bag        │
  │  that you can change to get results closer to    │
  │  what you feel more comfortable with."           │
  │                                                  │
  │ ① Prompt engineering                             │
  │ ② Fine tuning                                    │
  │ ③ Model changing                                 │
  │ ④ Hyperparameters (temperature, etc.)           │
  │ ⑤ Reasoning framework (what happens in the loop)│
  │ ⑥ Context management                            │
  │ ⑦ Tool descriptions & choice                    │
  │                                                  │
  │ "What I just did is just some process that I     │
  │  came up with. It's NOT some standard.           │
  │  This is NOT 'the best way.'"                   │
  │                                                  │
  │ "Different technologies, different frameworks,   │
  │  different methodologies, different metrics,     │
  │  different evaluators — everything is DIFFERENT."│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Full Multi-Turn Executor

```javascript
// COMPLETE MULTI-TURN EXECUTOR — From scratch!

// ═══════════════════════════════════
// 1. Build Mock Tools
// ═══════════════════════════════════

function buildMockTools(toolConfigs) {
  const tools = {};

  for (const config of toolConfigs) {
    tools[config.name] = {
      description: config.description,
      parameters: config.parameters || {
        type: "object",
        properties: {},
      },
      execute: async (args) => {
        // Mock! Return predefined result!
        const result = config.mockReturn;
        return typeof result === "string" ? result : JSON.stringify(result);
      },
    };
  }

  return tools;
}
```

```javascript
// ═══════════════════════════════════
// 2. Multi-Turn Executor (using SDK loop)
// ═══════════════════════════════════

async function multiTurnExecutor(data) {
  const tools = buildMockTools(data.mockTools);

  // Build messages (support pre-primed conversations!)
  const messages = [];

  if (data.messages && data.messages.length > 0) {
    messages.push(...data.messages);
  } else {
    messages.push({
      role: "system",
      content: data.systemPrompt || "You are a helpful agent.",
    });
  }

  messages.push({
    role: "user",
    content: data.prompt,
  });

  // Use SDK loop!
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: data.model || "gpt-4o-mini",
      messages,
      tools: Object.entries(tools).map(([name, t]) => ({
        type: "function",
        function: {
          name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    }),
  });

  // Manual loop since we're doing it from scratch!
  const allToolCalls = [];
  const allToolResults = [];
  let finalText = "";
  let iteration = 0;
  const maxSteps = data.maxSteps || 20;

  while (iteration < maxSteps) {
    iteration++;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: data.model || "gpt-4o-mini",
        messages,
        tools: Object.entries(tools).map(([name, t]) => ({
          type: "function",
          function: {
            name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
      }),
    });

    const result = await resp.json();
    const msg = result.choices[0].message;
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        const args = JSON.parse(tc.function.arguments || "{}");

        allToolCalls.push({ toolName: name, args });

        // Execute MOCK tool!
        const toolResult = await tools[name].execute(args);
        allToolResults.push({ toolName: name, result: toolResult });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolResult,
        });
      }
      continue;
    }

    finalText = msg.content || "";
    break;
  }

  const toolsUsed = [...new Set(allToolCalls.map((tc) => tc.toolName))];

  return {
    text: finalText,
    toolsUsed,
    toolCallOrder: allToolCalls,
    toolResults: allToolResults,
    iterations: iteration,
  };
}
```

```javascript
// ═══════════════════════════════════
// 3. LLM Judge (with user message!)
// ═══════════════════════════════════

async function llmJudge(output, target) {
  const judgeResponse = await callLLM(
    [
      {
        role: "system",
        content: `You are an evaluation judge. Score the agent's response 
on a scale of 1 to 10.

Scoring criteria:
- 10: Fully addresses the task using tool results correctly
- 7-9: Mostly correct with minor issues
- 4-6: Partially addresses the task
- 1-3: Mostly incorrect or irrelevant

Return JSON: { "score": <number>, "reason": "<string>" }`,
      },
      {
        role: "user",
        content: `
Here's the task: ${target.originalTask}

Here are the tools that were called:
${JSON.stringify(output.toolCallOrder)}

Here are the tool results:
${JSON.stringify(target.mockToolResults)}

Here is the agent's final answer:
${output.text}

Evaluate if this response correctly uses the tool results 
to answer the task.`,
      },
    ],
    { responseFormat: "json" },
  );

  const parsed = JSON.parse(judgeResponse);
  return parsed.score / 10; // Normalize 1-10 → 0-1!
}
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO EXECUTOR DESIGN NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần executor riêng cho eval?
  └→ "We're not going to stream, not going to do
     any of that stuff. But we DO need the loop
     and to COLLECT all information."

  WHY ②: Tại sao dùng SDK loop thay vì custom loop?
  └→ "We don't want to build this loop ourselves.
     We can just use the Vercel AI SDK."
     Trade-off: phải inspect result.steps sau!

  WHY ③: Tại sao JSON.stringify tool results?
  └→ "Everything must be STRING! Must stringify
     because everything has to be a string."

  WHY ④: Tại sao cần wrapper function cho executor?
  └→ "If I wanted to do manipulation on the data
     first — filter, transform — I can do it here
     BEFORE I pass to my eval."

  WHY ⑤: Tại sao collect allToolCalls riêng?
  └→ "We didn't write our own custom loop, so we
     have to go BACK and inspect all the steps
     and get the data ourselves."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — MULTI-TURN EXECUTOR:
═══════════════════════════════════════════════════════════════

  Executor = Agent Loop + Data Collection

  ┌──────────────────────────────────────────────────┐
  │ INPUT:                                           │
  │ → prompt (user's task!)                        │
  │ → mockTools (with mock returns!)               │
  │ → messages (optional: pre-primed!)             │
  │ → maxSteps (loop limit!)                       │
  │                                                  │
  │ PROCESS:                                         │
  │ → Run full agent loop (SDK or manual!)         │
  │ → Mock tools execute with fake data!           │
  │ → Collect every step's tool calls & results!   │
  │                                                  │
  │ OUTPUT:                                          │
  │ → text (final answer!)                         │
  │ → toolsUsed (unique names!)                    │
  │ → toolCallOrder (sequence!)                    │
  │ → steps (all details!)                         │
  │                                                  │
  │ → Fed to JUDGE for scoring!                    │
  └──────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Loop approach    │ Custom loop   │ SDK maxSteps      │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Code             │ ⚠️ More code  │ ✅ Less code!     │
  │ Data access      │ ✅ During!    │ ⚠️ After only!    │
  │ Control          │ ✅ Full!      │ ⚠️ Limited!       │
  │ For eval?        │ ⚠️ Overkill   │ ✅ Perfect!       │
  │ For production?  │ ✅ Best!      │ ⚠️ Less control   │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ User msg format  │ JSON.stringify│ XML format        │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Simplicity       │ ✅ Easy!      │ ⚠️ More work!     │
  │ Some models      │ ⚠️ OK        │ ✅ Prefer XML!    │
  │ Readability      │ ⚠️ Dense     │ ✅ Structured!    │
  │ "You'd have to   │    EXPERIMENT to find best!"     │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — DATA FLOW:
═══════════════════════════════════════════════════════════════

  Test data (JSON!)
       │
       ▼
  multiTurnWithMocks(data)
       │
       ├── buildMockTools(data.mockTools)
       │   → readFile.execute = () => '{"name":"..."}'
       │
       ├── messages = [system, ...primed?, user: prompt]
       │
       ├── generateText({ messages, tools, maxSteps })
       │   → SDK runs the loop internally!
       │
       └── result.steps.map(step => {
             collect toolCalls (name, args)!
             collect toolResults (name, result)!
             collect text (final step only)!
           })
       │
       ▼
  { text, toolsUsed, toolCallOrder, steps }
       │
       ▼
  llmJudge(output, target)
       │
       ├── System: scoring rubric!
       └── User: task + tools + results + response!
       │
       ▼
  result.object.score / 10 → 0.8 ✅
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — No Standard Exists:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "What I just did is just some process that I     │
  │  came up with."                                  │
  │                                                  │
  │ "It's NOT some standard or 'this is the best     │
  │  way.'"                                          │
  │                                                  │
  │ "Every time I look up inspiration on how to eval │
  │  agents, I've NEVER seen the same thing twice."  │
  │                                                  │
  │ WHY:                                             │
  │ → Different technologies!                      │
  │ → Different frameworks!                        │
  │ → Different methodologies!                     │
  │ → Different metrics!                           │
  │ → Different evaluators!                        │
  │ → "Everything is just DIFFERENT."              │
  │                                                  │
  │ THE CONSISTENT PART:                             │
  │ "You're running EXPERIMENTS against some          │
  │  NON-DETERMINISTIC system and there's a bunch   │
  │  of stuff in your tool bag you can change."     │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — EXECUTOR EVOLUTION:
═══════════════════════════════════════════════════════════════

  Single-turn executor:
  │ → One LLM call! Check tool selection!
  │ → No tool execution! Just descriptions!
  │
  ↓
  Multi-turn executor (SDK loop):
  │ → generateText + maxSteps!
  │ → Mock tools that execute!
  │ → Collect steps via result.steps!
  │
  ↓
  Multi-turn executor (custom loop):
  │ → Full control! Streaming! UI!
  │ → Data available DURING execution!
  │
  ↓
  Production eval pipelines:
  │ → Live user sessions → golden data!
  │ → Thumbs up/down → classification!
  │ → Automated regression testing!
  │ → "Billion-dollar companies whose product
  │    is JUST this."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 19:
═══════════════════════════════════════════════════════════════

  USER MESSAGE:
  [ ] Include: task + tools called + results + response!
  [ ] JSON.stringify everything = STRING!
  [ ] "Evaluate if this response correctly uses..."!
  [ ] "Could put in system prompt, XML... EXPERIMENT!"

  RESULT.OBJECT:
  [ ] generateObject → result.object!
  [ ] result.object.score / 10 → normalize to 0-1!

  MULTI-TURN EXECUTOR:
  [ ] Like run.ts but for evals! No streaming!
  [ ] buildMockTools → format tools with mock returns!
  [ ] Support pre-primed conversations!
  [ ] maxSteps controllable by data!

  SDK LOOP:
  [ ] generateText + maxSteps = free loop!
  [ ] result.steps for all step data!
  [ ] "Didn't write own loop → inspect steps after!"

  COLLECTING STEPS:
  [ ] step.toolCalls (might be parallel!)
  [ ] step.toolResults
  [ ] step.text (final step only!)
  [ ] allToolCalls for order! Set for unique!

  THE LEVERS:
  [ ] Prompt, fine-tuning, model, hyperparameters!
  [ ] Reasoning framework, context management!
  [ ] "Never seen the same thing twice!"

  TIẾP THEO → Phần 20: Coding the Eval (Running Multi-Turn!)
```
