# AI Agents Fundamentals, v2 — Phần 6: Create an Agent Tool Call — Build Your First Tool!

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Create an Agent Tool Call — "Description, Schema, Execute — That's It!"
> Độ khó: ⭐️⭐️⭐️ | Hands-on — Tạo tool đầu tiên + executeTool!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Anatomy Review — "Description, Schema, Execute!"           |
| 2   | DateTime Tool — "The Hello World of Tools!"                |
| 3   | Zod Schema — "Runtime Schema Maker!"                       |
| 4   | Tool Description — "A Prompt To The LLM!"                  |
| 5   | executeTool — Switch Statement For All Tools!              |
| 6   | Passing Tools To generateText — toolChoice Options!        |
| 7   | Single Turn vs Multi Turn — "Cool, But How Does LLM Know?" |
| 8   | Tự Implement: Tool System From Scratch                     |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu         |

---

## §1. Anatomy Review — "Description, Schema, Execute!"

> Scott: _"It's a description, there's a schema, and then there's an execute function."_

```
TOOL ANATOMY — 3 PARTS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ① DESCRIPTION (string):                         │
  │   → What the tool does!                         │
  │   → WHEN the agent should use it!               │
  │   → "This is essentially a PROMPT to the LLM!" │
  │                                                  │
  │ ② SCHEMA (Zod object):                          │
  │   → Input parameters definition!                │
  │   → Guaranteed contract!                        │
  │   → "Pretty much always has to be an object"    │
  │                                                  │
  │ ③ EXECUTE (async function):                      │
  │   → The actual code that runs!                  │
  │   → Receives args matching the schema!          │
  │   → MUST return a string (for LLM to read!)    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. DateTime Tool — "The Hello World of Tools!"

> Scott: _"Most agents or LLMs don't know what the current time is unless the provider is injecting that. So it's best to have a tool the agent can lean on."_

```javascript
// file: src/agent/tools/dateTime.ts

import { tool } from "ai"; // Helper from Vercel AI SDK
import { z } from "zod"; // Runtime schema validator

export const dateTime = tool({
  // ① DESCRIPTION — tells the LLM when to use it!
  description:
    "Returns the current time and date. " +
    "Use this tool before any time related task.",

  // ② SCHEMA — input parameters!
  parameters: z.object({}),
  // Empty object because dateTime needs no args!
  // "At least for this library, pretty much always
  //  has to be an object, even if no arguments."

  // ③ EXECUTE — the actual function!
  execute: async () => {
    return new Date().toISOString();
    // Returns string! Because:
    // "The input to an LLM is always TEXT.
    //  LLMs understand LANGUAGE. That's the
    //  second L in LLM — Large LANGUAGE Model."
  },
});
```

```
WHY STRING OUTPUT?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Scott: "The output, the input to an LLM is       │
  │ always going to be TEXT."                        │
  │                                                  │
  │ ① It's serializable over the network!           │
  │ ② LLMs understand LANGUAGE!                     │
  │   → "That's the second L in LLM —              │
  │      Large LANGUAGE Model."                      │
  │   → "They don't understand anything             │
  │      that's not language."                       │
  │                                                  │
  │ BASIC:                                           │
  │ return new Date().toISOString();                  │
  │ → "2026-03-07T15:30:00.000Z"                   │
  │                                                  │
  │ MORE EXPRESSIVE:                                 │
  │ return `The current date time in ISO format is   │
  │ ${new Date().toISOString()}`;                    │
  │ → Helps LLM understand WHAT it received!        │
  │                                                  │
  │ Scott: "There's no right or wrong answer.        │
  │ Once you get to evals, we'll learn how to        │
  │ improve this and MEASURE the differences."       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Zod Schema — "Runtime Schema Maker!"

> Scott: _"Zod is just a runtime schema maker that we can use to validate objects. It's the de facto one in JavaScript land."_

```
ZOD — WHAT & WHY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT: Runtime schema validation library!        │
  │ → "Like a database schema but at RUNTIME"       │
  │ → "The DE FACTO one in JavaScript land"         │
  │                                                  │
  │ WHY FOR TOOLS:                                   │
  │ → Defines what INPUT the tool accepts!          │
  │ → SDK converts Zod → JSON Schema for the LLM! │
  │ → LLM follows the schema = guaranteed contract!│
  │                                                  │
  └──────────────────────────────────────────────────┘

  EXAMPLES:
  ┌──────────────────────────────────────────────────┐
  │ // No args (dateTime):                           │
  │ parameters: z.object({})                         │
  │                                                  │
  │ // With args (webSearch):                        │
  │ parameters: z.object({                           │
  │   query: z.string().describe("Search query"),    │
  │ })                                               │
  │                                                  │
  │ // With optional args (timezone):                │
  │ parameters: z.object({                           │
  │   timezone: z.string()                           │
  │     .describe("The timezone you want")           │
  │     .optional(),                                 │
  │ })                                               │
  │                                                  │
  │ → .describe() = tells LLM what each arg means!│
  │ → .optional() = LLM doesn't have to provide!   │
  └──────────────────────────────────────────────────┘
```

---

## §4. Tool Description — "A Prompt To The LLM!"

> Scott: _"This description matters because this is essentially a PROMPT to the LLM. The same way you would have typed a prompt to the LLM is the same thing you would type into the tool description."_

```
DESCRIPTION = PROMPT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ KEY INSIGHT:                                     │
  │ Tool description = LLM prompt!                  │
  │ "You're CODIFYING A WORKFLOW with English!"     │
  │                                                  │
  │ WHAT TO INCLUDE:                                 │
  │ → What the tool DOES!                           │
  │ → WHEN the agent should use it!                 │
  │ → Hints for behavior!                           │
  │                                                  │
  │ EXAMPLE:                                         │
  │ "Returns the current time and date.              │
  │  Use this tool before any time related task."    │
  │     ↑ What it does    ↑ When to use it          │
  │                                                  │
  │ IMPORTANT:                                       │
  │ "It's always just a SUGGESTION.                  │
  │  It's never a rule. This isn't deterministic."   │
  │                                                  │
  │ "There are no WRONG answers here."              │
  │ "When we get to evals, you'll understand         │
  │  how much INFLUENCE this has."                   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. executeTool — Switch Statement For All Tools!

> Scott: _"We create a function that, given a tool name and arguments, does a switch statement on all the tools, picks the right one and executes it."_

```javascript
// file: src/agent/tools/index.ts

import { dateTime } from "./dateTime";

// Register all tools in one object:
export const tools = {
  dateTime,
  // Later: webSearch, writeFile, etc.
};
```

```javascript
// file: src/agent/executeTool.ts

import { tools } from "./tools/index";

type ToolName = keyof typeof tools;

export const executeTool = async (
  toolName: string,
  args: any,
) => {
  // Get the tool from registry
  const tool = tools[toolName as ToolName];

  // Tool not found? Tell the LLM!
  if (!tool) {
    return "Unknown tool, this does not exist.";
    // "Hint to your LLM that this is not a known tool."
    // "Instead of throwing an error and breaking
    //  your application."
  }

  // Tool has no execute function?
  const execute = tool.execute;
  if (!execute) {
    return "This tool has no execute function.";
    // "Not every tool will have an execute function."
    // "Some are just for stopping a process."
  }

  // Execute the tool!
  const result = await execute(args);

  // Return as string (LLMs need text!)
  return String(result);
  // "It should be the RESPONSIBILITY of the
  //  tool itself to make sure it returns a string,
  //  not the executeTool function."
};
```

```
executeTool FLOW:
═══════════════════════════════════════════════════════════════

  LLM: "I want dateTime tool!"
       │
       ▼
  executeTool("dateTime", {})
       │
       ├── Is "dateTime" in tools? → YES!
       │
       ├── Does it have execute? → YES!
       │
       ├── await execute({})
       │       │
       │       ▼
       │   new Date().toISOString()
       │   → "2026-03-07T15:30:00.000Z"
       │
       └── Return string result!

  IF UNKNOWN TOOL:
  executeTool("fooBar", {})
       │
       └── "Unknown tool, this does not exist."
           → LLM will try something else!
           → No crash! No error! Just a hint!
```

---

## §6. Passing Tools To generateText — toolChoice Options!

> Scott: _"We did not get back a text, we got back an ARRAY of objects. This is a tool call."_

```javascript
// file: src/agent/run.ts (updated!)

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { tools } from "./tools";
import { executeTool } from "./executeTool";

export async function runAgent(userMessage) {
  const { text, toolCalls } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: userMessage,
    system: systemPrompt,
    tools, // ← NEW! Pass tools to the LLM!
    // toolChoice: "auto"  ← default! LLM decides!
  });

  console.log("text:", text);
  console.log("toolCalls:", toolCalls);
}

runAgent("What is the current time right now?");
```

```
OUTPUT — TOOL CALL RESPONSE:
═══════════════════════════════════════════════════════════════

  text: undefined  ← NO text! Because LLM chose a tool!

  toolCalls: [
    {
      toolCallId: "call_abc123...",    ← Provider-generated ID!
      toolName: "dateTime",            ← Tool WE registered!
      args: {}                          ← Empty (no args needed!)
    }
  ]

  KEY OBSERVATIONS:
  ┌──────────────────────────────────────────────────┐
  │ ① No text returned! LLM chose tool INSTEAD!    │
  │                                                  │
  │ ② It's an ARRAY! Because:                       │
  │   "By default, the LLM can run PARALLEL tools.  │
  │    It can decide 'I want you to run THREE tools  │
  │    in parallel at the same time.' We can turn    │
  │    that off if we want."                         │
  │                                                  │
  │ ③ toolCallId is IMPORTANT:                      │
  │   "Generated on the server from the provider.    │
  │    We have to use that ID to identify results    │
  │    for this tool when we add it back to LLM."   │
  │                                                  │
  │ ④ toolName matches our registered tool!         │
  │                                                  │
  │ ⑤ args is {} because dateTime has no params!    │
  └──────────────────────────────────────────────────┘
```

```
TOOL CHOICE OPTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ toolChoice: "auto" (DEFAULT!)                    │
  │ → "Let the LLM DECIDE which tool to pick"      │
  │ → Can also choose NO tool (just text!)          │
  │                                                  │
  │ toolChoice: "none"                               │
  │ → "Don't pick ANY tools"                        │
  │ → LLM will only generate text!                  │
  │                                                  │
  │ toolChoice: "required"                           │
  │ → "You HAVE TO pick at least one tool"          │
  │ → Forces tool usage!                            │
  │                                                  │
  │ activeTools: ["dateTime", "webSearch"]           │
  │ → "I gave you a bunch of tools, but only        │
  │    pick from these ACTIVE ones."                 │
  │ → Subset filtering!                             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Single Turn vs Multi Turn — "Cool, But How Does LLM Know?"

> Scott: _"So far this is a SINGLE TURN. Cool, the LLM said I need to run this tool, we're like, got it, I ran it. But HOW does the LLM know about the RESULTS? We have to FEED IT BACK."_

```
SINGLE TURN (current state!):
═══════════════════════════════════════════════════════════════

  User: "What time is it?"
    │
    ▼
  LLM: "I want dateTime tool!"  (tool_call!)
    │
    ▼
  Your code: executes dateTime → "2026-03-07..."
    │
    ▼
  ??? LLM doesn't know the result! ???

  "But how does the LLM KNOW about the results
   of that tool? We have to FEED IT BACK to the
   LLM to be like, 'hey, we ran that tool for
   you, you remember that tool you wanted for
   this ID? Here are the RESULTS. Is there
   anything else you want me to do?'"


MULTI TURN (what we need to build!):
═══════════════════════════════════════════════════════════════

  User: "What time is it?"
    │
    ▼
  LLM: "I want dateTime!" (tool_call!)
    │
    ▼
  Execute → "2026-03-07T15:30:00.000Z"
    │
    ▼
  FEED BACK to LLM! ◄── THIS IS THE KEY!
    │  "Hey, remember call_abc123?"
    │  "Here's the result: 2026-03-07..."
    │
    ▼
  LLM: "The current time is 3:30 PM!"
    │
    ▼
  Answer to user! ✅
```

```
EXECUTING TOOL CALLS — OVERSIMPLIFIED:
═══════════════════════════════════════════════════════════════

  const { toolCalls } = await generateText({...});

  // Execute each tool call:
  for (const toolCall of toolCalls) {
    const result = await executeTool(
      toolCall.toolName,
      toolCall.args,
    );
    console.log(result);
    // → "2026-03-07T15:30:00.000Z"
  }

  // But this is SINGLE TURN!
  // We need to feed results BACK to LLM!
  // That's the LOOP — coming in next lesson!

  Scott: "That's the next thing we're going to do.
  But FIRST, before we get into the loop, we want
  to write EVALUATIONS for a single turn."
```

---

## §8. Tự Implement: Tool System From Scratch

```javascript
// BUILD IT FROM SCRATCH — No SDK!

// Step 1: Define a tool (just an object!)
const dateTimeTool = {
  name: "dateTime",
  description:
    "Returns the current time and date. " +
    "Use this before any time related task.",
  parameters: {
    type: "object",
    properties: {},
    // No properties = no arguments needed!
  },
  execute: async () => {
    return new Date().toISOString();
  },
};

// Step 2: Register tools
const toolRegistry = {
  dateTime: dateTimeTool,
};

// Step 3: executeTool function
async function executeTool(toolName, args) {
  const tool = toolRegistry[toolName];

  if (!tool) {
    return "Unknown tool, this does not exist.";
    // Don't throw! Hint to LLM instead!
  }

  if (!tool.execute) {
    return "This tool has no execute function.";
  }

  const result = await tool.execute(args);
  return String(result);
}
```

```javascript
// Step 4: Send tools to LLM (raw API!)

async function callLLMWithTools(prompt, tools) {
  const toolDescriptions = Object.values(tools).map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are helpful." },
        { role: "user", content: prompt },
      ],
      tools: toolDescriptions,
      tool_choice: "auto",
      // ↑ "auto" = let LLM decide!
      // "none" = no tools!
      // "required" = must use a tool!
    }),
  });

  const data = await response.json();
  const message = data.choices[0].message;

  // Did LLM choose a tool?
  if (message.tool_calls) {
    return {
      type: "tool_calls",
      calls: message.tool_calls.map((tc) => ({
        id: tc.id, // Provider ID!
        name: tc.function.name, // Our tool name!
        args: JSON.parse(tc.function.arguments),
      })),
    };
  }

  // Or did it respond with text?
  return {
    type: "text",
    content: message.content,
  };
}
```

```javascript
// Step 5: Single turn execution

async function singleTurn(prompt) {
  const response = await callLLMWithTools(prompt, toolRegistry);

  if (response.type === "text") {
    console.log("Answer:", response.content);
    return;
  }

  if (response.type === "tool_calls") {
    // LLM wants tools! Execute each one:
    for (const call of response.calls) {
      console.log(`Tool: ${call.name}`);
      console.log(`Args: ${JSON.stringify(call.args)}`);

      const result = await executeTool(call.name, call.args);
      console.log(`Result: ${result}`);

      // BUT! We're NOT feeding back to LLM!
      // This is just SINGLE TURN!
      // Multi-turn (the loop) comes next!
    }
  }
}

// Test:
singleTurn("What is the current time right now?");
// Tool: dateTime
// Args: {}
// Result: 2026-03-07T15:30:00.000Z

// Scott: "This is a single turn.
// The LOOP comes next. But FIRST — evals!"
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys — Tool Creation

```
5 WHYS: TẠI SAO LÀM TOOL NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần description?
  └→ Vì "description is a PROMPT to the LLM!"
     LLM đọc description để biết KHI NÀO dùng!
     "You're codifying a workflow with ENGLISH!"

  WHY ②: Tại sao schema phải là Zod object?
  └→ Vì cần "guaranteed contract"!
     SDK converts Zod → JSON Schema!
     LLM sẽ ABIDE to schema khi truyền args!

  WHY ③: Tại sao execute phải return string?
  └→ Vì "LLMs understand LANGUAGE!"
     "That's the second L in LLM!"
     Object/number = LLM không hiểu!

  WHY ④: Tại sao executeTool không throw error?
  └→ Vì throwing = crash app!
     Return "unknown tool" = hint to LLM!
     LLM sẽ try something else!

  WHY ⑤: Tại sao toolCallId quan trọng?
  └→ Vì LLM cần match result với request!
     "We have to use that ID to identify
     the results for this tool when we add
     it back to the LLM."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TOOL SYSTEM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ TOOL = Description + Schema + Execute            │
  │                                                  │
  │ Registration:                                    │
  │ tools = { dateTime: tool({...}) }               │
  │ → Central registry of ALL tools!               │
  │                                                  │
  │ Execution:                                       │
  │ executeTool(name, args) → result string          │
  │ → Switch on name, call execute, return string!  │
  │                                                  │
  │ Integration:                                     │
  │ generateText({ tools }) → { toolCalls }         │
  │ → Pass tools in, get tool_call objects out!     │
  │                                                  │
  │ The LLM sees: name + description + schema       │
  │ The LLM returns: toolCallId + name + args       │
  │ Your code does: execute(args) → string result   │
  └──────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — TOOL DESIGN:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬─────────────┬───────────────────┐
  │ Description       │ Vague       │ Detailed          │
  ├───────────────────┼─────────────┼───────────────────┤
  │ LLM accuracy      │ ❌ Low      │ ✅ High!          │
  │ Flexibility       │ ✅ High     │ ⚠️ Constrained    │
  │ Token cost        │ ✅ Low      │ ⚠️ More tokens    │
  │ Predictability    │ ❌ Random   │ ✅ Consistent     │
  └───────────────────┴─────────────┴───────────────────┘

  ┌───────────────────┬─────────────┬───────────────────┐
  │ Output format     │ Raw value   │ Expressive string │
  ├───────────────────┼─────────────┼───────────────────┤
  │ Example           │ "2026-03-07"│ "The current date │
  │                   │             │  in ISO is: ..."  │
  │ LLM understanding │ ⚠️ OK      │ ✅ Better!        │
  │ Simplicity        │ ✅ Simple   │ ⚠️ More code      │
  └───────────────────┴─────────────┴───────────────────┘

  Scott: "There's no right or wrong answer.
  Once you get to EVALS, we'll learn how to
  improve this and MEASURE it."
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — TOOL CALL FLOW:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │  tools/dateTime.ts → export dateTime = tool()  │
  │        │                                        │
  │        ▼                                        │
  │  tools/index.ts → { dateTime }                 │
  │        │                                        │
  │        ├──────────────────────┐                 │
  │        ▼                      ▼                 │
  │  executeTool.ts          run.ts                 │
  │  (switch + execute)      (generateText)         │
  │        │                      │                 │
  │        │    ┌─────────────────┘                 │
  │        │    │                                   │
  │        │    ▼                                   │
  │        │  generateText({                        │
  │        │    model, prompt,                      │
  │        │    tools ← from index!                │
  │        │  })                                    │
  │        │    │                                   │
  │        │    ▼                                   │
  │        │  { toolCalls: [{                       │
  │        │      toolName: "dateTime",             │
  │        │      args: {}                          │
  │        │  }]}                                   │
  │        │    │                                   │
  │        │    ▼                                   │
  │        └──► executeTool("dateTime", {})         │
  │              │                                  │
  │              ▼                                  │
  │            "2026-03-07T15:30:00.000Z"           │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — THE TOOL_CALL RESPONSE:
═══════════════════════════════════════════════════════════════

  toolCalls: [{
    toolCallId: "call_abc123...",
    toolName: "dateTime",
    args: {},
  }]

  WHAT EACH FIELD MEANS:
  ┌──────────────────────────────────────────────────┐
  │ toolCallId: "call_abc123..."                    │
  │ → Generated by PROVIDER (OpenAI server!)       │
  │ → Unique for this specific call!               │
  │ → MUST be used when feeding result back!       │
  │ → "The ID is IMPORTANT."                       │
  │                                                  │
  │ toolName: "dateTime"                             │
  │ → Matches our registered key!                  │
  │ → LLM picked this from available tools!        │
  │ → Used to look up in executeTool!              │
  │                                                  │
  │ args: {}                                         │
  │ → Matches our Zod schema!                      │
  │ → Empty because dateTime needs no args!        │
  │ → LLM followed our "guaranteed contract!"      │
  └──────────────────────────────────────────────────┘

  WHY ARRAY?
  ┌──────────────────────────────────────────────────┐
  │ "By default, the LLM can run PARALLEL tools.    │
  │ It can decide 'I want you to run three tools    │
  │ in parallel at the same time.'"                  │
  │                                                  │
  │ Example of parallel tool calls:                  │
  │ toolCalls: [                                     │
  │   { toolName: "webSearch", args: {q: "NBA"} },  │
  │   { toolName: "webSearch", args: {q: "NFL"} },  │
  │   { toolName: "dateTime", args: {} },            │
  │ ]                                                │
  │ → LLM wants ALL THREE at once!                 │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — TOOL CREATION PATTERNS:
═══════════════════════════════════════════════════════════════

  EARLY 2023: Raw JSON Schema
  │ → Define tools as raw JSON objects!
  │ → Verbose, error-prone!
  │ → No type safety!
  │
  ↓
  MID 2023: Zod enters the scene!
  │ → z.object() instead of raw JSON!
  │ → Type-safe! Runtime validation!
  │ → "De facto in JavaScript land!"
  │
  ↓
  LATE 2023: SDK helpers
  │ → tool() from Vercel AI SDK!
  │ → Wraps description + schema + execute!
  │ → "Super easy for us to create a tool!"
  │
  ↓
  NOW: Standardized pattern!
  │ → Description + Schema + Execute!
  │ → Same pattern across all SDKs!
  │ → "If you know how to make functions
  │    and write comments, you know tools!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 6:
═══════════════════════════════════════════════════════════════

  TOOL CREATION:
  [ ] tool() helper from "ai" SDK!
  [ ] Description = "prompt to the LLM!"
  [ ] Zod schema = guaranteed contract!
  [ ] Execute = async function, returns STRING!

  TOOL REGISTRATION:
  [ ] tools/index.ts = central registry!
  [ ] executeTool.ts = switch + execute!
  [ ] Don't throw on unknown tool — return hint text!

  INTEGRATION:
  [ ] Pass tools to generateText()!
  [ ] toolChoice: "auto" (default), "none", "required"!
  [ ] Response: text OR toolCalls (not both!)
  [ ] toolCalls is an ARRAY (parallel!)
  [ ] toolCallId = IMPORTANT for feeding back!

  SINGLE vs MULTI TURN:
  [ ] Current state = SINGLE turn!
  [ ] "But how does LLM know the results?"
  [ ] Must feed back → that's the LOOP!
  [ ] "FIRST, before the loop → EVALS!"

  TIẾP THEO → Phần 7: Evaluations (Single Turn!)
```
