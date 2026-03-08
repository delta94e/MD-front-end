# AI Agents Fundamentals, v2 — Phần 11: Single-Turn Eval Executor — "A Dynamic Run Function!"

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Single-Turn Eval Executor — "Mock Tools, Real Scores!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Hands-on — Build executor + mock tools + messages!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Test Data — "Fake Data From My Head!"                  |
| 2   | Mock Tool Definitions — "Like TDD For AI!"             |
| 3   | Messages vs Prompt — "Pass A Conversation!"            |
| 4   | Single Turn Executor — "Dynamic Run Function!"         |
| 5   | Model Config & Temperature — "Reasoning Models Break!" |
| 6   | Return Shape — "toolCalls, toolNames, toolsSelected!"  |
| 7   | Tự Implement: Full Executor From Scratch               |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu     |

---

## §1. Test Data — "Fake Data From My Head!"

> Scott: _"This is the data I made. This is the data in my head. I'm like, I think these are the things I want to eval against."_

```
TEST DATA STRUCTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ EACH DATA ENTRY HAS:                             │
  │                                                  │
  │ data: {                                          │
  │   prompt: "Can you start the dev server?",      │
  │   tools: ["runCommand"],                         │
  │   system?: "optional system prompt",             │
  │   model?: "optional model override",             │
  │   temperature?: 0.7,                             │
  │ }                                                │
  │                                                  │
  │ target: {                                        │
  │   expectedTools: ["runCommand"],                 │
  │   category: "secondary",                        │
  │ }                                                │
  │                                                  │
  │ → data = variables for the experiment!         │
  │ → target = what we expect to happen!           │
  │ → category = golden / secondary / negative!    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```
CATEGORIES REVISITED:
═══════════════════════════════════════════════════════════════

  "Can you start the development server?"
  category: "secondary"

  ┌──────────────────────────────────────────────────┐
  │ WHY SECONDARY?                                   │
  │                                                  │
  │ Scott: "Without enough context, I don't know     │
  │ if it would have known to use the terminal.      │
  │ You didn't tell it what the command was.         │
  │ You didn't add any context."                     │
  │                                                  │
  │ "If it tried to do a terminal thing, sure,       │
  │  but I'm not REALLY expecting it to."           │
  │                                                  │
  │ "This would indicate we might want to build      │
  │  features around better CONTEXT GATHERING."     │
  │                                                  │
  │ "Maybe we can make secondary things PRIMARY      │
  │  things because they're so good at context."    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Mock Tool Definitions — "Like TDD For AI!"

> Scott: _"We don't have any of these tools. I'm just evaling on the DESCRIPTIONS of what the tools will be. The tool itself doesn't have to be done. It's like TDD!"_

```
THE KEY INSIGHT — WHY MOCK?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ "I'm only evaluating if you PICKED the right    │
  │  tool. I'm not actually going to EXECUTE them." │
  │                                                  │
  │ "I don't want my eval to have to interact with  │
  │  the file system and be SLOW like that."        │
  │                                                  │
  │ "I just need the things the AI SEES, which is   │
  │  just the DESCRIPTION of the tool."             │
  │                                                  │
  │ "That is a UNIT TEST that I can write for that  │
  │  execute function. I don't need AI to test that.│
  │  Just write UNIT TESTS for that code."          │
  │                                                  │
  │ TDD Analogy:                                     │
  │ "It's like writing a test for a function you    │
  │  HAVEN'T MADE YET, but you know what it         │
  │  should do."                                     │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```javascript
// MOCK TOOL DEFINITIONS — Description + Schema only!

import { tool } from "ai";
import { z } from "zod";

const toolDefinitions = {
  readFile: {
    description: "Read the contents of a file at the specified path",
    parameters: z.object({
      path: z.string().describe("The path to the file you want to read"),
    }),
    // NO execute function! "Always optional!"
  },

  writeFile: {
    description: "Write given content to the file at the given path",
    parameters: z.object({
      path: z.string().describe("The path to the file you want to write to"),
      content: z.string().describe("The content you want to write to the file"),
    }),
  },

  listFiles: {
    description: "List all the files in a directory",
    parameters: z.object({
      directory: z
        .string()
        .describe("The directory in which you want to list the files"),
    }),
  },

  deleteFile: {
    description: "Delete a file at the given path",
    parameters: z.object({
      path: z.string().describe("The path to the file that you want to delete"),
    }),
  },

  runCommand: {
    description: "Executes a shell command and return its output",
    parameters: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
    // Scott: "Pretty damn scary."
  },
};

// "There's no wrong answers here. You can describe
//  these however you want. You can put A, B, C, D.
//  Your evals are going to be BAD, but that's okay,
//  that's a BASELINE."
//
// "You'll get a RAISE if you show your evals went
//  from this to this. So might be a good strategy
//  to start off that way actually." 😄
```

---

## §3. Messages vs Prompt — "Pass A Conversation!"

> Scott: _"If you want to pass in a conversation, you wouldn't use prompt, you would use MESSAGES."_

```
PROMPT vs MESSAGES:
═══════════════════════════════════════════════════════════════

  PROMPT (what we've been using):
  ┌──────────────────────────────────────────────────┐
  │ await generateText({                             │
  │   prompt: "What time is it?",                   │
  │ });                                              │
  │ → Single user message! No history!             │
  └──────────────────────────────────────────────────┘

  MESSAGES (new! conversations!):
  ┌──────────────────────────────────────────────────┐
  │ await generateText({                             │
  │   messages: [                                    │
  │     { role: "system", content: "You are..." },  │
  │     { role: "user",   content: "Hello!" },      │
  │     { role: "assistant", content: "Hi!" },      │
  │     { role: "user",   content: "What time?" }, │
  │   ],                       ↑ LAST = user!      │
  │ });                                              │
  │ → Full conversation history!                   │
  │ → LLM sees the entire context!                 │
  └──────────────────────────────────────────────────┘
```

```
MESSAGE ROLES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ role: "user"                                     │
  │ → Human asking something!                      │
  │ → content = text string!                       │
  │                                                  │
  │ role: "assistant"                                │
  │ → AI responding!                               │
  │ → content = text string!                       │
  │                                                  │
  │ role: "tool"                                     │
  │ → Tool call results!                           │
  │ → content = tool name, ID, results!            │
  │                                                  │
  │ role: "system"                                   │
  │ → System prompt!                               │
  │ → content = instructions for agent!            │
  │                                                  │
  │ For multimodal models:                           │
  │ → content might be objects (attachments!)       │
  │ → Not just strings!                            │
  └──────────────────────────────────────────────────┘
```

```
CRITICAL RULE — LAST MESSAGE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ LAST MESSAGE = "user" → LLM will RESPOND! ✅   │
  │ "It will respond as if you typed something       │
  │  and hit enter."                                 │
  │                                                  │
  │ LAST MESSAGE = "assistant" → LLM will WAIT! ⏸️ │
  │ "It's going to think it's waiting on YOU.        │
  │  It said something last, so you should be        │
  │  saying something, so it won't respond."        │
  │                                                  │
  │ "If the last message is always type user,        │
  │  it's always going to RESPOND to that."         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```
FAKE CONVERSATIONS FOR EVALS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ POWER MOVE: Fake conversation history!           │
  │                                                  │
  │ "You can just put whatever you want.             │
  │  It's just an array of objects!"                │
  │                                                  │
  │ messages: [                                      │
  │   { role: "user", content: "Read foo.txt" },    │
  │   { role: "assistant", content: "Sure..." },    │
  │   { role: "user", content: "Now delete it" },   │
  │   { role: "assistant", content: "Done..." },    │
  │   { role: "user", content: "List files now" },  │
  │   // ↑ Eval THIS response!                     │
  │ ]                                                │
  │                                                  │
  │ "I can just put whatever conversation state      │
  │  I want to PRIME it to be whatever I want!"     │
  │                                                  │
  │ "And this is where ONLINE evals are great        │
  │  because you could just take someone's           │
  │  conversation and just PLUG IT IN there."       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Single Turn Executor — "Dynamic Run Function!"

> Scott: _"An executor is basically a VARIATION of the runner. It changes depending on what prompt, system prompt, tools we give it. That's what an executor is."_

```
EXECUTOR = CONFIGURABLE RUN FUNCTION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ EXECUTOR TYPES:                                  │
  │ → Single turn executor (one pass!)             │
  │ → Multi-turn executor (full agent run!)        │
  │                                                  │
  │ "An executor is just a variation of the runner. │
  │  That runner will change depending on what       │
  │  prompt, system prompt, and tools we give it."  │
  │                                                  │
  │ VS STATIC RUN:                                   │
  │ Run function: hardcoded config!                 │
  │ Executor: takes config as ARGUMENTS!            │
  │ → Different data = different experiment!       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```javascript
// SINGLE TURN EXECUTOR — The implementation!

import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const singleTurnExecutor = async (data) => {
  // 1. Build messages from data
  const messages = buildMessages(data);
  // → Puts system prompt + user prompt into
  //   message array format!

  // 2. Build mock tool set from data
  const tools = {};
  for (const toolName of data.tools) {
    const definition = toolDefinitions[toolName];
    if (definition) {
      tools[toolName] = tool({
        description: definition.description,
        parameters: definition.parameters,
        // NO execute! We don't need it!
      });
    }
  }

  // 3. Generate text (single turn!)
  const { toolCalls } = await generateText({
    model: openai(data.model || "gpt-4o-mini"),
    messages,
    tools,
    maxSteps: 1, // Force single turn!
    temperature: data.model
      ? data.temperature // User knows what they're doing
      : undefined, // Omit for reasoning models!
    // "OpenAI reasoning models don't do temperature.
    //  undefined gets OMITTED in JSON.stringify
    //  over the wire in HTTP."
  });

  // 4. Process results
  const calls = toolCalls.map((tc) => ({
    toolName: tc.toolName,
    args: tc.args || {},
  }));

  const toolNames = toolCalls.map((tc) => tc.toolName);

  return {
    toolCalls: calls,
    toolNames,
    toolsSelected: toolNames.length > 0,
    // "Did you pick a tool? Yes or no?
    //  Just a little helper."
  };
};
```

---

## §5. Model Config & Temperature — "Reasoning Models Break!"

> Scott: _"O1 is a reasoning model. You can't do temperature on a reasoning model. undefined gets omitted in JSON.stringify, so OpenAI never sees it."_

```
TEMPERATURE + REASONING MODELS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PROBLEM:                                         │
  │ O1 Mini = reasoning model!                      │
  │ Reasoning models DON'T support temperature!     │
  │ → SDK will warn you!                           │
  │ → "It won't break, but you'll get a warning."  │
  │                                                  │
  │ SOLUTION:                                        │
  │ temperature: data.model                          │
  │   ? data.temperature    // User-specified!      │
  │   : undefined           // Omit entirely!       │
  │                                                  │
  │ WHY undefined WORKS:                             │
  │ "When you JSON.stringify an object, anything     │
  │  with undefined gets OMITTED."                  │
  │                                                  │
  │ { model: "o1-mini", temperature: undefined }     │
  │ → JSON: { "model": "o1-mini" }                 │
  │ → temperature never sent to API!               │
  │ → OpenAI never sees it!                        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Return Shape — "toolCalls, toolNames, toolsSelected!"

> Scott: _"I just want to know quickly, did you pick a tool? Yes or no? It's just a little helper."_

```
EXECUTOR OUTPUT:
═══════════════════════════════════════════════════════════════

  {
    toolCalls: [
      { toolName: "readFile", args: { path: "foo.txt" } },
      { toolName: "writeFile", args: { path: "bar.txt",
        content: "hello" } },
    ],
    toolNames: ["readFile", "writeFile"],
    toolsSelected: true,
  }

  ┌──────────────────────────────────────────────────┐
  │ toolCalls:    Full details! Name + args!        │
  │ toolNames:    Just names! For quick matching!   │
  │ toolsSelected: Boolean! Any tool picked at all? │
  │                                                  │
  │ These feed directly into our SCORERS:            │
  │ → toolSelectionScore(expected, toolNames)       │
  │ → forbiddenToolScore(forbidden, toolNames)      │
  │ → toolOrderScore(expectedOrder, toolNames)     │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Full Executor From Scratch

```javascript
// COMPLETE EXECUTOR — Built from scratch!

// ═══════════════════════════════════════════════
// MESSAGE BUILDER
// ═══════════════════════════════════════════════

function buildMessages(data) {
  const messages = [];

  // System prompt first (if any)
  if (data.system) {
    messages.push({
      role: "system",
      content: data.system,
    });
  }

  // User prompt last (MUST be last!)
  // "If the last message is type user,
  //  it's ALWAYS going to respond to that."
  messages.push({
    role: "user",
    content: data.prompt,
  });

  return messages;
}
```

```javascript
// ═══════════════════════════════════════════════
// MOCK TOOL BUILDER
// ═══════════════════════════════════════════════

// "I don't need the tools to be done.
//  I just need the DESCRIPTIONS."
// "Like TDD — writing tests for functions
//  you haven't made yet!"

const toolDefinitions = {
  readFile: {
    description: "Read the contents of a file at the specified path",
    parameters: { path: "string: The path to the file" },
  },
  writeFile: {
    description: "Write given content to the file at the given path",
    parameters: {
      path: "string: The path to write to",
      content: "string: The content to write",
    },
  },
  listFiles: {
    description: "List all the files in a directory",
    parameters: { directory: "string: The directory to list" },
  },
  deleteFile: {
    description: "Delete a file at the given path",
    parameters: { path: "string: The path to delete" },
  },
  runCommand: {
    description: "Executes a shell command and return its output",
    parameters: { command: "string: The shell command to execute" },
  },
};

function buildToolSet(toolNames) {
  const tools = {};

  for (const name of toolNames) {
    const def = toolDefinitions[name];
    if (!def) continue; // Skip unknown tools!

    // Convert to OpenAI function format:
    tools[name] = {
      type: "function",
      function: {
        name,
        description: def.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(def.parameters).map(([key, desc]) => [
              key,
              {
                type: "string",
                description: desc.split(": ")[1],
              },
            ]),
          ),
        },
      },
      // NO execute! Mock only!
    };
  }

  return tools;
}
```

```javascript
// ═══════════════════════════════════════════════
// SINGLE TURN EXECUTOR (raw API version!)
// ═══════════════════════════════════════════════

async function singleTurnExecutor(data) {
  const messages = buildMessages(data);
  const tools = buildToolSet(data.tools || []);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: data.model || "gpt-4o-mini",
      messages,
      tools: Object.values(tools),
      // Temperature: omit for reasoning models!
      ...(data.temperature !== undefined
        ? { temperature: data.temperature }
        : {}),
    }),
  });

  const result = await response.json();
  const message = result.choices[0].message;

  // Extract tool calls
  const toolCalls = (message.tool_calls || []).map((tc) => ({
    toolName: tc.function.name,
    args: JSON.parse(tc.function.arguments || "{}"),
  }));

  const toolNames = toolCalls.map((tc) => tc.toolName);

  return {
    toolCalls,
    toolNames,
    toolsSelected: toolNames.length > 0,
  };
}
```

```javascript
// ═══════════════════════════════════════════════
// PUTTING IT ALL TOGETHER
// ═══════════════════════════════════════════════

// Test data entries:
const evalData = [
  {
    data: {
      prompt: "Read the contents of config.json",
      tools: ["readFile", "writeFile", "deleteFile"],
    },
    target: {
      expectedTools: ["readFile"],
      category: "golden",
    },
  },
  {
    data: {
      prompt: "Can you start the development server?",
      tools: ["runCommand", "readFile"],
    },
    target: {
      expectedTools: ["runCommand"],
      category: "secondary",
      // "Without enough context, I don't know
      //  if it would have known."
    },
  },
  {
    data: {
      prompt: "Read foo.txt, then write bar.txt, then delete baz.txt",
      tools: ["readFile", "writeFile", "deleteFile"],
    },
    target: {
      expectedTools: ["readFile", "writeFile", "deleteFile"],
      expectedToolOrder: ["readFile", "writeFile", "deleteFile"],
      category: "golden",
      // "I would expect you to run those three
      //  tools in that order because that's
      //  what the prompt said."
    },
  },
];

// Run executor on each test case:
for (const entry of evalData) {
  const result = await singleTurnExecutor(entry.data);
  console.log(`Prompt: "${entry.data.prompt}"`);
  console.log(`Expected: ${entry.target.expectedTools}`);
  console.log(`Actual:   ${result.toolNames}`);
  console.log(`Selected: ${result.toolsSelected}`);
  console.log("---");
}
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — Executor Design

```
5 WHYS: TẠI SAO THIẾT KẾ NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao mock tools, không dùng real tools?
  └→ "I'm only evaluating if you PICKED the right tool.
     I'm NOT actually going to EXECUTE them."
     "I don't want evals to interact with file system
     and be SLOW like that."

  WHY ②: Tại sao executor thay vì dùng run function?
  └→ Vì cần DYNAMIC configuration!
     Different data = different model, tools, prompt!
     "It's a variation of the runner that changes
     depending on what we give it."

  WHY ③: Tại sao messages thay vì prompt?
  └→ Vì cần pass CONVERSATION HISTORY!
     "You can fake a conversation to PRIME the eval
     to whatever state you want."
     Perfect for testing multi-turn scenarios!

  WHY ④: Tại sao undefined thay vì 0 cho temperature?
  └→ Vì "JSON.stringify omits undefined!"
     Reasoning models crash with temperature!
     undefined = field never sent to API!

  WHY ⑤: Tại sao toolsSelected boolean?
  └→ "I just want to know quickly, did you pick a tool?
     Yes or no? It's just a helper method."
     Quick boolean check before detailed scoring!
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EVAL EXECUTOR:
═══════════════════════════════════════════════════════════════

  EXECUTOR = buildMessages + buildTools + generateText

  ┌──────────────────────────────────────────────────┐
  │ DATA IN:                                         │
  │ → prompt (what to ask!)                        │
  │ → tools (which mock tools to provide!)         │
  │ → model (optional override!)                   │
  │ → system (optional system prompt!)             │
  │ → temperature (optional!)                      │
  │                                                  │
  │ PROCESS:                                         │
  │ → Build messages array!                        │
  │ → Build mock tool set from definitions!        │
  │ → Call generateText (single turn!)             │
  │                                                  │
  │ DATA OUT:                                        │
  │ → toolCalls (full details!)                    │
  │ → toolNames (just names!)                      │
  │ → toolsSelected (boolean!)                     │
  └──────────────────────────────────────────────────┘

  SEPARATION OF CONCERNS:
  ┌──────────────────────────────────────────────────┐
  │ Tool SELECTION → eval with executor!            │
  │ Tool EXECUTION → unit test with code!           │
  │                                                  │
  │ "I don't need AI to test the execute function.  │
  │  That's deterministic code. Just write UNIT     │
  │  TESTS for that."                                │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — EXECUTOR DESIGN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Static config │ Dynamic executor  │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Flexibility      │ ❌ Fixed!     │ ✅ Per-data!      │
  │ Reusability      │ ❌ One use!   │ ✅ Many datasets! │
  │ Complexity       │ ✅ Simple!    │ ⚠️ More code!     │
  │ Experimentation  │ ❌ Manual!    │ ✅ Data-driven!   │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Data source      │ Human-made    │ Live data         │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Has category     │ ✅ Yes!       │ ❌ No!            │
  │ Has model config │ ✅ Yes!       │ ❌ No!            │
  │ Realistic        │ ⚠️ Synthetic! │ ✅ Real!          │
  │ Needs annotation │ ❌ Pre-done!  │ ✅ Human review!  │
  │                  │               │                   │
  │ Scott: "Live data wouldn't have 'golden or       │
  │ secondary.' That's stuff I put there.            │
  │ Human annotated."                                │
  └──────────────────┴───────────────┴───────────────────┘
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — EXECUTOR FLOW:
═══════════════════════════════════════════════════════════════

  EVAL DATA ENTRY:
  ┌───────────────────────────────┐
  │ prompt: "Read config.json"   │
  │ tools: ["readFile"]          │
  │ target: { expected: [...] }  │
  └──────────┬────────────────────┘
             │
       ┌─────┴─────┐
       ▼           ▼
  buildMessages  buildToolSet
  ┌──────────┐  ┌──────────────┐
  │ [{        │  │ { readFile:  │
  │  role:    │  │   { desc,   │
  │  "user",  │  │     params  │
  │  content  │  │   }         │
  │ }]        │  │ }           │
  └─────┬─────┘  └──────┬──────┘
        │                │
        └───────┬────────┘
                ▼
         generateText({
           model, messages, tools,
           maxSteps: 1
         })
                │
                ▼
         { toolCalls, toolNames,
           toolsSelected }
                │
                ▼
         → Feed to SCORERS!
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — THE DATA → EXECUTOR → SCORER PIPELINE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ LAYER 1: DATA (what to test!)                   │
  │ → Input prompts + expected outputs!            │
  │ → Categories (golden/secondary/negative!)      │
  │ → Config (model, temperature, tools!)          │
  │                                                  │
  │ LAYER 2: EXECUTOR (run the test!)               │
  │ → Takes one data entry!                        │
  │ → Builds messages + mock tools!                │
  │ → Calls LLM for one turn!                     │
  │ → Returns structured result!                   │
  │                                                  │
  │ LAYER 3: SCORER (evaluate the result!)          │
  │ → toolSelectionScore (F1!)                     │
  │ → forbiddenToolScore (binary!)                 │
  │ → toolOrderScore (sequence!)                   │
  │                                                  │
  │ LAYER 4: REPORTER (track over time!)            │
  │ → Average scores per category!                 │
  │ → Compare with baseline!                       │
  │ → Hill climbing!                               │
  └──────────────────────────────────────────────────┘
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — FROM MANUAL TO AUTOMATED EVALS:
═══════════════════════════════════════════════════════════════

  Manual testing:
  │ → "I typed 3 prompts, it worked. Ship it!"
  │ → No structure, no reproducibility!
  │
  ↓
  Static scripts:
  │ → Hardcoded prompts in a run file!
  │ → Better, but not scalable!
  │
  ↓
  Data-driven executors (what we built!):
  │ → Separate data from execution logic!
  │ → Mock tools for speed!
  │ → "Like TDD for AI!"
  │ → Configurable per experiment!
  │
  ↓
  Production eval systems:
  │ → Online evals with live data!
  │ → Human annotation pipelines!
  │ → A/B testing between models!
  │ → "AI is built on human review, let's be real."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 11:
═══════════════════════════════════════════════════════════════

  EXECUTOR CONCEPT:
  [ ] Executor = dynamic runner! Config from data!
  [ ] Single turn = one LLM call, maxSteps: 1!
  [ ] Returns: toolCalls, toolNames, toolsSelected!

  MOCK TOOLS:
  [ ] "Only need DESCRIPTIONS, not real execute!"
  [ ] "Like TDD — test before function exists!"
  [ ] "Execute logic = unit test, not AI eval!"

  MESSAGES:
  [ ] messages array instead of prompt!
  [ ] role: user, assistant, tool, system!
  [ ] LAST message must be "user" to get response!
  [ ] Can FAKE conversation history!

  TEMPERATURE:
  [ ] Reasoning models (O1) don't support it!
  [ ] Use undefined to OMIT from API call!
  [ ] "JSON.stringify omits undefined!"

  DATA STRUCTURE:
  [ ] data: prompt, tools, model, system!
  [ ] target: expectedTools, category!
  [ ] "This is the data in my head!"

  TIẾP THEO → Phần 12: Running The Evals!
```
