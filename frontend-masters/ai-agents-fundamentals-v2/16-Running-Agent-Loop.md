# AI Agents Fundamentals, v2 — Phần 16: Running an Agent Loop — "You Just Built A Chat Thing In Your Terminal!"

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Running an Agent Loop — "Making The Agent Work Is EASY. Making It GOOD Is Hard!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Hands-on — Execute tools, test memory, run CLI!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | Tool Execution — "Execute, Update UI, Push Results!"           |
| 2   | Tool Result Format — "Everything Must Be A String!"            |
| 3   | The 3 Exit Paths — "Error, Done, or More Tools!"               |
| 4   | Build & Run — "npm run build → agi → MAGIC!"                   |
| 5   | Testing Memory — "What Is My Name?"                            |
| 6   | Security Concern — "GPT Tells You EVERYTHING!"                 |
| 7   | Traditional vs Advanced Loops — "This Is Just The Foundation!" |
| 8   | Tự Implement: Complete Tool Execution                          |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu             |

---

## §1. Tool Execution — "Execute, Update UI, Push Results!"

> Scott: _"For each tool call, we execute it, update the UI to stop the spinner, and push the results into the messages array."_

```javascript
// EXECUTING TOOL CALLS INSIDE THE LOOP

// We already have: toolCalls = [{ toolCallId, toolName, args }]

for (const toolCall of toolCalls) {
  // 1. EXECUTE the tool!
  const result = await executeTool(toolCall.toolName, toolCall.args);

  // 2. UPDATE UI — stop the spinner!
  callbacks.onToolCallEnd(toolCall.toolName, result);
  // "The UI is showing the name and a spinner.
  //  We want to stop to let the user know we're done."

  // 3. PUSH results into messages array!
  messages.push({
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: toolCall.toolCallId, // MUST match!
        toolName: toolCall.toolName,
        result: result, // Must be string!
      },
    ],
  });
}

// Loop continues! Back to top of while(true)!
// "What has changed since last time? The MESSAGES ARRAY.
//  That is the conversation in the LLM's eyes."
```

```
THE EXECUTION FLOW:
═══════════════════════════════════════════════════════════════

  toolCalls = [
    { id: "call_abc", name: "readFile", args: { path: "foo.txt" } },
    { id: "call_def", name: "writeFile", args: { ... } },
  ]
       │
       ▼
  FOR EACH tool call:
  ┌──────────────────────────────────────────────────┐
  │ 1. executeTool("readFile", { path: "foo.txt" }) │
  │    → result = "contents of foo.txt"             │
  │                                                  │
  │ 2. onToolCallEnd("readFile", result)             │
  │    → UI: Stop spinner! ✅                      │
  │                                                  │
  │ 3. messages.push({                               │
  │      role: "tool",                               │
  │      content: [{                                 │
  │        type: "tool-result",                      │
  │        toolCallId: "call_abc",  ← MUST match!  │
  │        result: "contents of foo.txt"             │
  │      }]                                          │
  │    })                                            │
  └──────────────────────────────────────────────────┘
       │
       ▼
  CONTINUE while(true) → back to streamText!
```

---

## §2. Tool Result Format — "Everything Must Be A String!"

> Scott: _"Does that mean the result of every tool call has to be a string? YES. Does that mean it has to be human language? NO. You can put JSON. JSON IS a string."_

```
TOOL RESULT = ALWAYS A STRING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ content: [{                                      │
  │   type: "tool-result",                           │
  │   toolCallId: "call_abc",                        │
  │   toolName: "readFile",                          │
  │   result: "..."  ← MUST be a string!           │
  │ }]                                               │
  │                                                  │
  │ VALID RESULTS:                                   │
  │ → "Hello world" (plain text!)                  │
  │ → '{"name":"foo","version":"1.0"}' (JSON!)     │
  │ → "Error: file not found" (error message!)     │
  │ → "true" (boolean as string!)                  │
  │                                                  │
  │ "Everything you return to the LLM has to be      │
  │  a STRING. Remember that."                      │
  │                                                  │
  │ WHY: LLMs work with TEXT!                        │
  │ → They tokenize strings!                       │
  │ → Objects → JSON.stringify() → string!         │
  │ → Arrays → JSON.stringify() → string!          │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```
UX CONCERN — SHOWING RESULTS TO USERS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Claude Code will show you a preview of the      │
  │  results — it crawled this website, here's       │
  │  a preview."                                     │
  │                                                  │
  │ "But showing a non-technical user a bunch of     │
  │  JSON that a tool returned would NOT be a        │
  │  good experience."                               │
  │                                                  │
  │ "There's a LOT of work left to be done on        │
  │  the DESIGN side."                               │
  │                                                  │
  │ → Technical users: show raw JSON! Fine!        │
  │ → Non-technical: needs formatting! UX problem! │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. The 3 Exit Paths — "Error, Done, or More Tools!"

> Scott: _"We either hit an error, hit a finish reason that is NOT tool-calls, or the AI wants to run more tools and the loop continues."_

```
THREE EXIT PATHS:
═══════════════════════════════════════════════════════════════

  while (true) {
    streamText(...)

    // Process chunks (text-delta, tool-call)...

    ┌────────────────────────────────────────┐
    │ PATH A: ERROR! 💥                      │
    │ → streamError && no text?             │
    │ → Show friendly message!              │
    │ → BREAK!                              │
    ├────────────────────────────────────────┤
    │ PATH B: LLM IS DONE! ✅               │
    │ → finishReason !== "tool-calls"       │
    │ → AND toolCalls.length === 0          │
    │ → Push response, BREAK!              │
    ├────────────────────────────────────────┤
    │ PATH C: MORE TOOLS! 🔧                │
    │ → Execute each tool call!             │
    │ → Push results to messages!           │
    │ → CONTINUE (loop again!)             │
    │ → "What changed? The MESSAGES ARRAY.  │
    │    That is the conversation."         │
    └────────────────────────────────────────┘
  }

  // After loop: update UI, return messages!
```

---

## §4. Build & Run — "npm run build → agi → MAGIC!"

> Scott: _"Because it's a CLI that needs to run on your machine, you need to install it globally. The command is AGI."_

```
BUILD & RUN WORKFLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ STEP 1: Build!                                   │
  │ $ npm run build                                  │
  │ → Compiles TypeScript!                         │
  │ → "You might get TypeScript errors.             │
  │    Just put 'any' on stuff. Call it a day."     │
  │                                                  │
  │ STEP 2: Install globally!                        │
  │ $ npm install -g .                               │
  │ → Installs CLI on your machine!                │
  │                                                  │
  │ STEP 3: Run!                                     │
  │ $ agi                                            │
  │ → Agent starts!                                │
  │ → Type messages, get streaming responses!      │
  │                                                  │
  │ ⚠️ IMPORTANT:                                   │
  │ "Whatever change you make, you need to           │
  │  npm run build AND npm install again."          │
  │ "If you're wondering why changes aren't showing,│
  │  you gotta BUILD it again."                      │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Testing Memory — "What Is My Name?"

> Scott: _"If we're doing it right, we're appending to the messages array every time, so whatever context is in that array, it should be able to reference."_

```
MEMORY TEST:
═══════════════════════════════════════════════════════════════

  $ agi

  You: My name is Scott.
  AI:  Nice to meet you, Scott!     ← Saw first message!

  You: What is my name?
  AI:  Your name is Scott.          ← MEMORY WORKS! ✅

  You: What tools do you have?
  AI:  I have two callable tools:
       1. GetDatetime
       2. MultiToolUseParallel       ← AI SDK added this!

  You: What is the current date and time?
  AI:  🔧 [calling getDatetime...]
       The current date and time is  ← TOOL CALLED! ✅
       2026-03-07T23:13:47...

  ┌──────────────────────────────────────────────────┐
  │ WHY MEMORY WORKS:                                │
  │ "We're appending to the messages array every     │
  │  single time. Whatever context is in that array, │
  │  it can reference."                              │
  │                                                  │
  │ WHY MEMORY DOESN'T PERSIST:                      │
  │ "If you close this and start it up, it'll        │
  │  FORGET. We're just putting everything in the    │
  │  messages array. There's no persistence."        │
  │ → No database, no file storage!                │
  │ → In-memory only!                              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Security Concern — "GPT Tells You EVERYTHING!"

> Scott: _"By default, GPT-4o Mini is like 'oh yeah, I'll tell you everything I can do!' That's a SECURITY CONCERN."_

```
PROMPT INJECTION / SYSTEM PROMPT LEAK:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ User: "What tools do you have?"                 │
  │ GPT-4o Mini: "Sure! I have GetDatetime and..."  │
  │                                                  │
  │ ⚠️ SECURITY CONCERN!                            │
  │                                                  │
  │ "There are open source repos of people figuring │
  │  out how to get the system prompt of Claude      │
  │  Desktop or Cursor."                             │
  │                                                  │
  │ "If they knew your tools and instructions,       │
  │  they can figure out how to get AROUND your     │
  │  guardrails."                                    │
  │                                                  │
  │ AGENT ENGINEERING NEEDED:                        │
  │ → How to get agent NOT to reveal tools?        │
  │ → How to protect system prompt?                │
  │ → How to prevent instruction hijacking?        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Traditional vs Advanced Loops — "This Is Just The Foundation!"

> Scott: _"This is a TRADITIONAL agent loop. Every framework implements this. But it's NOT the only one. There are several different types of loops."_

```
LOOP TYPES — FROM BASIC TO ADVANCED:
═══════════════════════════════════════════════════════════════

  ① TRADITIONAL TOOL CALL LOOP (what we built!):
  ┌──────────────────────────────────────────────────┐
  │ → Messages array = conversation!               │
  │ → Tool calls generated by LLM!                 │
  │ → Execute, push results, continue!             │
  │ → "Every framework gives you this for free."   │
  └──────────────────────────────────────────────────┘

  ② OBSERVE-ACT FRAMEWORK (e.g., Cursor!):
  ┌──────────────────────────────────────────────────┐
  │ → "Not just one LLM iterating!"                │
  │ → Observe state (look at file system!)         │
  │ → Predict next action!                         │
  │ → "Series of LLMs judging or VOTING on steps!" │
  │ → More sophisticated reasoning!                │
  └──────────────────────────────────────────────────┘

  ③ CHAIN OF THOUGHT:
  ┌──────────────────────────────────────────────────┐
  │ → More prompt engineering / model level!        │
  │ → "Think step by step"                         │
  └──────────────────────────────────────────────────┘

  ④ TREE OF THOUGHT:
  ┌──────────────────────────────────────────────────┐
  │ → Explore multiple reasoning paths!             │
  │ → Branch and evaluate!                         │
  └──────────────────────────────────────────────────┘

  "There's no category for them. Some people call them
   REASONING FRAMEWORKS. This loop is just the DEFAULT
   reasoning framework."

  "The things I build aren't conversational — they're
   more like BACKGROUND JOBS. I don't need a messages
   array or conversation array."
```

```
THE REAL TRUTH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ "Making the agent technically WORK is very       │
  │  simple. It's SO EASY. You don't even need      │
  │  to write code anymore — you can click and      │
  │  drag things around."                            │
  │                                                  │
  │ "But that doesn't mean it's GOOD."              │
  │                                                  │
  │ "The real work is making it:                     │
  │  → GOOD                                        │
  │  → RELIABLE                                    │
  │  → USEFUL"                                     │
  │                                                  │
  │ "That is a combination of:                       │
  │  → Prompt engineering                           │
  │  → Tool choice                                 │
  │  → Context management                          │
  │  → Evals                                       │
  │  → So many different things!"                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Complete Tool Execution

```javascript
// COMPLETE TOOL EXECUTION SYSTEM — From scratch!

// ═══════════════════════════════════
// Tool Registry
// ═══════════════════════════════════

const toolRegistry = {
  getDatetime: {
    description: "Get the current date and time",
    parameters: {
      type: "object",
      properties: {},
    },
    execute: async () => {
      return new Date().toISOString();
      // Returns STRING! "Everything to LLM = string!"
    },
  },

  readFile: {
    description: "Read a file at the specified path",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
      },
      required: ["path"],
    },
    execute: async ({ path }) => {
      const fs = await import("fs/promises");
      const content = await fs.readFile(path, "utf-8");
      return content; // Already a string!
    },
  },

  listFiles: {
    description: "List files in a directory",
    parameters: {
      type: "object",
      properties: {
        directory: { type: "string", description: "Directory path" },
      },
      required: ["directory"],
    },
    execute: async ({ directory }) => {
      const fs = await import("fs/promises");
      const files = await fs.readdir(directory);
      return JSON.stringify(files); // Array → JSON string!
    },
  },
};

// "Does the result have to be a string? YES.
//  Does it have to be human language? NO.
//  JSON is a string."
```

```javascript
// ═══════════════════════════════════
// Execute Tool Function
// ═══════════════════════════════════

async function executeTool(toolName, args) {
  const tool = toolRegistry[toolName];

  if (!tool) {
    return JSON.stringify({
      error: `Unknown tool: ${toolName}`,
    });
  }

  try {
    const result = await tool.execute(args);
    // Ensure result is always a string!
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({
      error: error.message,
      tool: toolName,
    });
  }
}
```

```javascript
// ═══════════════════════════════════
// The Complete Agent Loop (with tool execution!)
// ═══════════════════════════════════

async function runAgent(userMessage, history = []) {
  const messages = [
    { role: "system", content: "You are a helpful coding agent." },
    ...history,
    { role: "user", content: userMessage },
  ];

  let fullResponse = "";
  let iteration = 0;

  while (true) {
    iteration++;
    if (iteration > 20) {
      console.log("⚠️ Max iterations!");
      break;
    }

    // Call LLM
    const response = await callLLM(messages);
    const msg = response.choices[0].message;

    // Push assistant message
    messages.push(msg);

    // PATH C: Tool calls!
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        const args = JSON.parse(tc.function.arguments || "{}");

        console.log(`🔧 Executing: ${name}`);

        // Execute!
        const result = await executeTool(name, args);

        console.log(`✅ Done: ${name}`);

        // Push result (MUST match ID!)
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result, // Always a string!
        });
      }

      // Continue loop! LLM will see results!
      continue;
    }

    // PATH B: LLM is done!
    fullResponse = msg.content || "";
    break;
  }

  return { response: fullResponse, messages, iteration };
}
```

```javascript
// ═══════════════════════════════════
// Interactive CLI Loop!
// ═══════════════════════════════════

const readline = await import("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversationHistory = [];

function ask(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

console.log("🤖 Agent ready! Type 'exit' to quit.\n");

while (true) {
  const input = await ask("You: ");
  if (input.toLowerCase() === "exit") break;

  const result = await runAgent(input, conversationHistory);

  console.log(`\nAI: ${result.response}\n`);
  console.log(`   (${result.iteration} iterations)\n`);

  // Update history for next message!
  conversationHistory = result.messages;
  // "As long as we keep it open, memory works!
  //  Close it? It forgets. No persistence."
}

rl.close();
console.log("👋 Goodbye!");
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO LOOP DESIGN NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao result phải là string?
  └→ "Everything you return to the LLM has to be a STRING.
     LLMs work with TEXT. They tokenize strings."

  WHY ②: Tại sao không break sau tool execution?
  └→ Vì loop phải CONTINUE! LLM cần thấy results
     để quyết định tiếp: thêm tools? hay respond?

  WHY ③: Tại sao memory không persist?
  └→ "We're just putting everything in the messages array.
     There's no persistence. No database, no file storage."

  WHY ④: Tại sao cần npm run build + npm install -g?
  └→ Vì đây là CLI app! TypeScript → compile → install
     globally → "agi" command available anywhere!

  WHY ⑤: Tại sao Scott doesn't use traditional loop?
  └→ "The things I build aren't CONVERSATIONAL.
     They're more like BACKGROUND JOBS. I don't need
     a messages array or conversation array."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — WHAT CHANGES BETWEEN ITERATIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Q: "What changed since the last time you looped?"│
  │ A: "There's only ONE thing: the MESSAGES ARRAY." │
  │                                                  │
  │ That IS the conversation in LLM's eyes!         │
  │                                                  │
  │ → Append tool calls → LLM sees what it asked!  │
  │ → Append results → LLM sees what happened!     │
  │ → Loop continues → LLM decides next step!      │
  │                                                  │
  │ "All we have to do is keep APPENDING to the      │
  │  messages array, keep MANIPULATING it, and       │
  │  allow the loop to continue."                   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Loop type        │ Traditional   │ Observe-Act       │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Complexity       │ ✅ Simple!    │ ❌ Very complex!  │
  │ Reasoning        │ ⚠️ Basic!     │ ✅ Sophisticated! │
  │ LLMs needed      │ ✅ One!       │ ❌ Multiple!      │
  │ Cost             │ ✅ Lower!     │ ❌ Higher!        │
  │ "Every framework │ ✅ Free!      │ ❌ Custom build!  │
  │  gives this"     │               │                   │
  │                  │               │                   │
  │ "This is just the FOUNDATION. When you see other │
  │  things, they're BUILT ON TOP of this."          │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Memory           │ In-memory     │ Persisted (DB)    │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Speed            │ ✅ Fast!      │ ⚠️ IO overhead!   │
  │ Persistence      │ ❌ Lost on    │ ✅ Survives       │
  │                  │   restart!    │   restarts!       │
  │ Scalability      │ ❌ One session│ ✅ Multi-session! │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — FULL AGENT RUN:
═══════════════════════════════════════════════════════════════

  $ agi
  "My name is Scott"
       │
       ▼
  messages = [system, user:"My name is Scott"]
       │
       ▼
  LLM → "Nice to meet you, Scott!"
  messages = [..., assistant:"Nice to meet you!"]
  BREAK! ← No tool calls!
       │
       ▼
  "What is my name?"
  messages = [..., user:"What is my name?"]
       │
       ▼
  LLM → "Your name is Scott." ← SEES history!
  BREAK!
       │
       ▼
  "What is the current date?"
  messages = [..., user:"What is the current date?"]
       │
       ▼
  LLM → tool-call: getDatetime()
  messages = [..., assistant:{tool_call}, tool:{result}]
  CONTINUE! → loop again!
       │
       ▼
  LLM → "The current date is 2026-03-07..."
  BREAK! ← No more tool calls!
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — What Makes Agents "Good":
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ EASY (anyone can do!):                           │
  │ → Write the loop! (we just did it!)            │
  │ → Add tools! (just functions!)                 │
  │ → "You can click and drag things around."       │
  │                                                  │
  │ HARD (the real work!):                           │
  │ → Prompt engineering                            │
  │ → Tool choice & descriptions                   │
  │ → Context management                           │
  │ → Evals & improvement                          │
  │ → Security (system prompt protection!)          │
  │ → UX (showing tool results to users!)           │
  │ → Persistence (memory across sessions!)         │
  │ → Error recovery & resilience                   │
  │                                                  │
  │ "Making the agent technically WORK: very simple. │
  │  Making it GOOD, RELIABLE, USEFUL: that's the   │
  │  real work."                                     │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — REASONING FRAMEWORKS:
═══════════════════════════════════════════════════════════════

  Traditional tool call loop (what we built!):
  │ → One LLM, messages array, tool calls!
  │ → "The DEFAULT reasoning framework."
  │ → Every framework gives this for free!
  │
  ↓
  Chain of Thought (CoT):
  │ → "Think step by step"
  │ → Prompt engineering / model level!
  │
  ↓
  Tree of Thought (ToT):
  │ → Explore multiple reasoning paths!
  │ → Branch, evaluate, prune!
  │
  ↓
  Observe-Act (e.g., Cursor):
  │ → Multiple LLMs!
  │ → "Observe state, predict next action,
  │    other LLMs judging or VOTING on steps."
  │
  ↓
  Custom reasoning frameworks:
  │ → "There's no category for them."
  │ → "Different ways to teach the agent
  │    HOW to reason."
  │ → Background jobs, not conversational!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 16:
═══════════════════════════════════════════════════════════════

  TOOL EXECUTION:
  [ ] Execute tool → get result (string!)!
  [ ] Update UI → stop spinner!
  [ ] Push result → messages array!
  [ ] toolCallId MUST match!

  TOOL RESULTS:
  [ ] "Everything to LLM = STRING!"
  [ ] JSON.stringify for objects/arrays!
  [ ] "Does it have to be human language? NO."

  THREE EXIT PATHS:
  [ ] Error → show message, break!
  [ ] LLM done → push response, break!
  [ ] Tool calls → execute, push, continue!

  BUILD & RUN:
  [ ] npm run build → npm install -g → agi!
  [ ] "Changes? Gotta BUILD again!"

  MEMORY:
  [ ] In-memory via messages array!
  [ ] "Close it? It forgets. No persistence."

  SECURITY:
  [ ] GPT tells users everything by default!
  [ ] Protect system prompt! Protect tool list!

  TRADITIONAL vs ADVANCED:
  [ ] Traditional = one LLM, messages, tools!
  [ ] Observe-Act, CoT, ToT = more sophisticated!
  [ ] "This is just the FOUNDATION!"

  THE REAL TRUTH:
  [ ] "Making it WORK = easy. Making it GOOD = hard."
  [ ] "The real work: prompts, tools, context, evals!"

  TIẾP THEO → Phần 17: Tool Execution & Approvals!
```
