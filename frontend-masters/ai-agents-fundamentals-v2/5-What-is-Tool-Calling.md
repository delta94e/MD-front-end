# AI Agents Fundamentals, v2 — Phần 5: What is Tool Calling? — "A Genie That Can Actually DO Things!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: What is Tool Calling? — "If You Know How To Make Functions, You Know Tools!"
> Độ khó: ⭐️⭐️⭐️ | Core concept — Biến LLM thành Agent!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | The Problem — "This Genie Kinda SUCKS!"                   |
| 2   | Training Cutoff — "It's Gonna LIE or Say I Don't Know!"   |
| 3   | What Is Tool Calling — "Interact With The Outside World!" |
| 4   | Function Calling — "You Wrote The Functions!"             |
| 5   | How It Works — "The LLM Doesn't RUN The Code!"            |
| 6   | Why Tools Matter — "No Tools = Just Greeting Cards!"      |
| 7   | The Tool Loop — "Observe, Think, Observe, Think!"         |
| 8   | Tự Implement: Tool Calling From Scratch                   |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu        |

---

## §1. The Problem — "This Genie Kinda SUCKS!"

> Scott: _"The first time I ran an LLM API, I was blown away. I felt like I had a WAND in my hand and there was somebody on the other line that was like a GENIE. But this genie kinda sucks because I can't really ask it to do anything past its training cutoff date."_

```
THE PROBLEM WITH BARE LLMs:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Scott's experience:                              │
  │ "I felt like I had a WAND in my hand and there  │
  │ was a GENIE on the other line."                  │
  │                                                  │
  │ BUT:                                             │
  │ "This genie kinda SUCKS because I can't really  │
  │  ask it to do anything past its training         │
  │  cutoff date."                                   │
  │                                                  │
  │ EXAMPLE:                                         │
  │ Q: "Who won the 2025 NBA finals?"                │
  │                                                  │
  │ LLM: "I should note my training only goes to    │
  │ June 2024, so I don't have confirmed 2025       │
  │ results. I can help make a prediction."          │
  │                                                  │
  │ Scott: "It's really NOT THAT USEFUL."            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Training Cutoff — "It's Gonna LIE or Say I Don't Know!"

> Scott: _"Models are trained up to information on a certain date, and by the time you get access, that cutoff was probably almost a YEAR AGO because there's tons of checks for safety."_

```
TRAINING CUTOFF PROBLEM:
═══════════════════════════════════════════════════════════════

  Timeline:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Model trained ──────► Safety checks ──────► You │
  │ (data stops)          (takes months!)      use it│
  │ June 2024             ~~~~~~~~~~~~~~~~~~~~~~ NOW │
  │                                                  │
  │ Gap: ~1 year of NO KNOWLEDGE!                   │
  │                                                  │
  │ What happens when you ask about recent events:  │
  │                                                  │
  │ Option A: It LIES (hallucination!)              │
  │ → Makes up confident but wrong answers!        │
  │                                                  │
  │ Option B: It says "I don't know"               │
  │ → Honest but useless!                          │
  │                                                  │
  │ Scott: "It's either gonna LIE or it's           │
  │ gonna say I DON'T KNOW."                        │
  │                                                  │
  │ SOLUTION: TOOLS! Give it the ability to          │
  │ reach outside and get CURRENT information!       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. What Is Tool Calling — "Interact With The Outside World!"

> Scott: _"We have to give it the ability to INTERACT with its environment and the way we do that is with something called TOOL CALLING."_

```
TOOL CALLING — DEFINITION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ TOOL CALLING = The mechanism that allows LLMs   │
  │ to INTERACT with the outside world!              │
  │                                                  │
  │ HOW:                                             │
  │ "If you know how to make FUNCTIONS and you       │
  │  know how to DESCRIBE what those functions do,   │
  │  like you would normally write COMMENTS above    │
  │  your functions — then guess what? You know      │
  │  how to make TOOLS. That's it."                  │
  │                                                  │
  │ TOOL = Function + Description!                   │
  │                                                  │
  │ ┌────────────────────────────────────────────┐   │
  │ │ // Searches the web for current info       │   │
  │ │ // @param query - search query string      │   │
  │ │ // @returns search results                 │   │
  │ │ function webSearch(query: string) {        │   │
  │ │   // ... implementation                    │   │
  │ │ }                                          │   │
  │ │                                            │   │
  │ │ ↑ You ALREADY write this!                 │   │
  │ │   That's basically a tool definition!      │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Function Calling — "You Wrote The Functions!"

> Scott: _"Function calling just means a type of tool calling where the tool being called is a custom function on YOUR system. A function that YOU wrote."_

```
TYPES OF TOOL CALLING:
═══════════════════════════════════════════════════════════════

  ① FUNCTION CALLING (what we're doing!):
  ┌──────────────────────────────────────────────────┐
  │ → Functions that YOU wrote!                     │
  │ → Running on YOUR system!                      │
  │ → "Used interchangeably with tool calling."     │
  │                                                  │
  │ Examples:                                        │
  │ → webSearch() — your function, your API key!   │
  │ → writeFile() — your filesystem!               │
  │ → runCommand() — your terminal!                │
  └──────────────────────────────────────────────────┘

  ② OTHER TYPES (not in this course):
  ┌──────────────────────────────────────────────────┐
  │ → Execution on ANOTHER system (external API!)  │
  │ → Execution on PROVIDER'S side (hosted tools!) │
  │ → Execution SOMEWHERE ELSE!                    │
  │                                                  │
  │ Scott: "Function calling just means you wrote   │
  │ the functions, running on YOUR system, and      │
  │ that's what's happening."                        │
  └──────────────────────────────────────────────────┘
```

---

## §5. How It Works — "The LLM Doesn't RUN The Code!"

> Scott: _"The model itself DOESN'T actually run the function. It's NOT gonna take your function, put it on OpenAI server and run it. You're not gonna serialize a function as a string and go eval on some server."_

```
HOW TOOL CALLING WORKS — STEP BY STEP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ STEP 1: DEFINE THE TOOL                          │
  │                                                  │
  │ You give the model:                              │
  │ ① Description — what it does, WHEN to use it!  │
  │ ② Input schema — what arguments it needs!      │
  │ ③ Execute function — the actual code!           │
  │                                                  │
  │ "Guaranteed contract — here's what you're going │
  │  to get to this function."                       │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │ STEP 2: PROMPT THE MODEL                         │
  │                                                  │
  │ User: "Who won the 2025 NBA finals?"            │
  │ + Tools: [webSearch, writeFile, ...]            │
  │                                                  │
  │ Model READS the descriptions!                   │
  │ "Hmm, I could probably use webSearch            │
  │  to get closer to answering this!"              │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │ STEP 3: MODEL RETURNS A REQUEST (not execution!)│
  │                                                  │
  │ ⚠️ KEY INSIGHT: LLM does NOT run the code!     │
  │                                                  │
  │ LLM returns: {                                  │
  │   "type": "tool_call",                          │
  │   "tool": "webSearch",                          │
  │   "arguments": {                                │
  │     "query": "2025 NBA finals winner"           │
  │   }                                              │
  │ }                                                │
  │                                                  │
  │ Scott: "Hey, here's an object. This describes   │
  │ the tool I need you to call. You said I have    │
  │ access to this tool. Here are the parameters.   │
  │ Can you GO DO THAT for me and give me results?" │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │ STEP 4: YOUR CODE EXECUTES THE TOOL             │
  │                                                  │
  │ → You receive the tool call request!            │
  │ → You call YOUR function with those args!       │
  │ → You get the results!                          │
  │ → You feed results BACK to the LLM!            │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │ STEP 5: LLM DECIDES WHAT'S NEXT                 │
  │                                                  │
  │ → "Oh I have enough to answer!" → ANSWER!      │
  │ → "I need more info!" → CALL ANOTHER TOOL!     │
  │ → "I gave up!" → STOP!                         │
  └──────────────────────────────────────────────────┘

  FULL FLOW DIAGRAM:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ You: "Who won 2025 NBA finals?"                 │
  │  │                                               │
  │  ▼                                               │
  │ LLM: "I need webSearch" (returns REQUEST!)      │
  │  │                                               │
  │  ▼                                               │
  │ Your code: executes webSearch("2025 NBA...")     │
  │  │                                               │
  │  ▼                                               │
  │ Results → fed BACK to LLM!                      │
  │  │                                               │
  │  ▼                                               │
  │ LLM: "Now I know! The winner was..."            │
  │  │                                               │
  │  ▼                                               │
  │ ANSWER to user!                                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Why Tools Matter — "No Tools = Just Greeting Cards!"

> Scott: _"Without tools, LLMs would be only good at writing greeting cards or sci-fi stories. They wouldn't be able to do anything RECENT."_

```
WHY TOOLS MATTER:
═══════════════════════════════════════════════════════════════

  WITHOUT TOOLS:
  ┌──────────────────────────────────────────────────┐
  │ LLM = "Greeting card writer" 😅                 │
  │ → Can write text!                               │
  │ → Can answer from training data!                │
  │ → CANNOT access current info!                   │
  │ → CANNOT interact with your system!             │
  │ → CANNOT search the web!                        │
  │ → CANNOT read/write files!                      │
  │ → "Only good at writing greeting cards          │
  │    or sci-fi stories!"                          │
  └──────────────────────────────────────────────────┘

  WITH TOOLS:
  ┌──────────────────────────────────────────────────┐
  │ LLM + Tools = AGENT! 🚀                        │
  │ → Can search the web for current info!          │
  │ → Can read, write, update, delete files!        │
  │ → Can run terminal commands!                    │
  │ → Can call APIs!                                │
  │ → Can interact with databases!                  │
  │ → Can browse the internet!                      │
  └──────────────────────────────────────────────────┘

  REAL WORLD EXAMPLE — CODING AGENTS:
  ┌──────────────────────────────────────────────────┐
  │ Scott: "You wouldn't have a CODING AGENT if      │
  │ that agent didn't have access to:"              │
  │                                                  │
  │ → Read files (understand codebase!)             │
  │ → Write files (make changes!)                   │
  │ → Update files (modify code!)                   │
  │ → Delete files (cleanup!)                       │
  │ → Search the internet (docs, Stack Overflow!)   │
  │ → Terminal (npm install, git, tests!)           │
  │                                                  │
  │ "Those are TOOLS that that agent has.            │
  │  There would be NO coding agents without them!"  │
  └──────────────────────────────────────────────────┘
```

---

## §7. The Tool Loop — "Observe, Think, Observe, Think!"

> Scott: _"That is the whole point of just OBSERVING, THINKING, OBSERVING, THINKING, and then eventually reaching a conclusion."_

```
THE TOOL LOOP:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │   User Task                                        │
  │      │                                             │
  │      ▼                                             │
  │   ┌──────────┐                                     │
  │   │  THINK   │ "Which tool gets me CLOSER          │
  │   │          │  to the goal?"                      │
  │   └────┬─────┘                                     │
  │        │                                           │
  │        ├── want tool? ──► REQUEST tool call!       │
  │        │                     │                     │
  │        │                     ▼                     │
  │        │              YOUR CODE executes!          │
  │        │                     │                     │
  │        │                     ▼                     │
  │        │              ┌──────────┐                 │
  │        │              │ OBSERVE  │ "Got results!"  │
  │        │              └────┬─────┘                 │
  │        │                   │                       │
  │        │                   ▼                       │
  │        │              Back to THINK! ──────┐       │
  │        │                                   │       │
  │        │               ┌───────────────────┘       │
  │        │               ▼                           │
  │        │          enough info?                     │
  │        │          ├── NO → LOOP AGAIN!            │
  │        │          └── YES ↓                       │
  │        │                                           │
  │        ├── has answer → RESPOND to user!          │
  │        ├── gave up → STOP!                        │
  │        └── error → BREAK!                         │
  │                                                    │
  └────────────────────────────────────────────────────┘

  Scott: "It keeps doing that until it's like,
  'Oh yeah, I have ENOUGH to answer' or 'I GAVE UP'
  or some other thing."
```

---

## §8. Tự Implement: Tool Calling From Scratch

```javascript
// TOOL CALLING — From Scratch!

// A tool has 3 parts:
// ① Description (when to use it!)
// ② Input schema (what args it needs!)
// ③ Execute function (the actual code!)

const webSearchTool = {
  // ① Description — LLM reads this!
  name: "webSearch",
  description:
    "Search the web for current information. " +
    "Use this when asked about recent events, " +
    "current data, or anything after training cutoff.",

  // ② Input schema — guaranteed contract!
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
    },
    required: ["query"],
  },

  // ③ Execute function — YOUR code!
  execute: async ({ query }) => {
    const response = await fetch(
      `https://api.search.com?q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();
    return data.results;
  },
};
```

```javascript
// THE KEY INSIGHT: LLM doesn't run code!

// What the LLM sees:
const toolsForLLM = [
  {
    name: "webSearch",
    description: "Search the web for current info...",
    parameters: {
      /* schema */
    },
  },
  // LLM does NOT see the execute function!
  // It only sees name + description + parameters!
];

// What the LLM returns:
const llmResponse = {
  type: "tool_call",
  tool: "webSearch",
  arguments: { query: "2025 NBA finals winner" },
  // LLM says: "I want THIS tool with THESE args!
  //  Can you go do that for me and give results?"
};

// YOUR CODE does the actual work:
async function handleToolCall(response, tools) {
  const tool = tools[response.tool];
  const result = await tool.execute(response.arguments);
  // Feed result back to LLM!
  return result;
}
```

```javascript
// FULL FLOW — Tool calling in the agent loop:

async function agentWithTools(task, tools) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  while (true) {
    // Send messages + tool DESCRIPTIONS to LLM
    const response = await callLLM(messages, tools);

    // LLM wants to answer directly?
    if (response.type === "text") {
      return response.content; // Done!
    }

    // LLM wants to use a tool?
    if (response.type === "tool_call") {
      // LLM returned: { tool: "webSearch", args: {...} }
      // It did NOT run the function!
      // It's asking US to run it!

      const tool = tools[response.tool];
      const result = await tool.execute(response.arguments);

      // Feed result back to LLM
      messages.push({
        role: "assistant",
        tool_calls: [response.rawCall],
      });
      messages.push({
        role: "tool",
        content: JSON.stringify(result),
      });

      // → LOOP AGAIN! LLM will OBSERVE and THINK!
    }
  }
}

// Scott: "Observe, think, observe, think,
// and then eventually reaching a conclusion."
```

```javascript
// WHY SCHEMA MATTERS — Guaranteed contract!

// Without schema:
// LLM might pass: webSearch("NBA", 2025, true)
// Or: webSearch({ q: "NBA", year: 2025 })
// Or: webSearch("find NBA stuff please")
// → UNPREDICTABLE! Breaking your function!

// With schema:
const schema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Search query" },
  },
  required: ["query"],
};
// LLM WILL pass: { query: "2025 NBA finals winner" }
// → GUARANTEED! Your function always gets what it expects!

// Scott: "The agent will abide to that schema
// when it passes in those arguments.
// We get GUARANTEED CONTRACT."
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys — Tool Calling

```
5 WHYS: TẠI SAO CẦN TOOL CALLING?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao LLM alone không đủ?
  └→ Vì training cutoff! "It's gonna LIE or say
     I don't know." Can't access current info!

  WHY ②: Tại sao không update training data?
  └→ Vì takes MONTHS for safety checks!
     "By the time you get access, cutoff was
     almost a YEAR AGO!"

  WHY ③: Tại sao tool calling thay vì fine-tuning?
  └→ Vì tools = REAL-TIME data! Dynamic!
     Fine-tuning = still static, still outdated!

  WHY ④: Tại sao LLM không tự run code?
  └→ Vì security! "You're not gonna serialize a
     function as a string and eval on some server!"
     LLM returns a REQUEST, YOUR code executes!

  WHY ⑤: Tại sao cần schema?
  └→ Vì "guaranteed contract"!
     Without schema = unpredictable args!
     With schema = LLM ABIDES to the contract!
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TOOL CALLING:
═══════════════════════════════════════════════════════════════

  TOOL = Description + Schema + Function

  ┌──────────────────────────────────────────────────┐
  │ Description (for LLM):                           │
  │ → WHAT it does!                                 │
  │ → WHEN to use it!                               │
  │ → "Like comments above your functions!"         │
  │                                                  │
  │ Schema (contract):                               │
  │ → Input format (JSON Schema!)                   │
  │ → "Guaranteed contract!"                        │
  │ → LLM WILL follow this format!                  │
  │                                                  │
  │ Function (execution):                            │
  │ → The actual code!                              │
  │ → Runs on YOUR system!                          │
  │ → LLM never sees or runs this!                 │
  └──────────────────────────────────────────────────┘

  KEY: LLM = DECISION maker, not EXECUTOR!
  Your code = EXECUTOR, not decision maker!
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — WITH vs WITHOUT TOOLS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ LLM Only      │ LLM + Tools       │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Current info     │ ❌ No!        │ ✅ Yes! (search!) │
  │ File access      │ ❌ No!        │ ✅ Yes! (R/W!)    │
  │ Safety           │ ✅ Safe!      │ ⚠️ Need approvals!│
  │ Speed            │ ✅ Fast!      │ ⚠️ Slower (loops!)│
  │ Cost             │ ✅ Cheap!     │ ⚠️ More tokens!   │
  │ Usefulness       │ ❌ "Greeting  │ ✅ "Actually      │
  │                  │   cards!"    │   useful!"        │
  │ Complexity       │ ✅ Simple!    │ ⚠️ More code!     │
  │ Reliability      │ ✅ Predictable│ ⚠️ Can go wrong!  │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — TOOL CALLING FLOW:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │                YOUR SYSTEM                      │
  │                                                 │
  │  User: "Who won 2025 NBA finals?"              │
  │    │                                            │
  │    ▼                                            │
  │  ┌───────────┐  tools[]   ┌──────────────────┐ │
  │  │ Your Code │──────────→│ OpenAI API (LLM)  │ │
  │  │           │           │                    │ │
  │  │           │ ◄─────────│ "I want webSearch  │ │
  │  │           │ tool_call │  with these args!" │ │
  │  │           │           └──────────────────┘ │ │
  │  │           │                                 │ │
  │  │  Execute! │──→ webSearch("2025 NBA...")     │ │
  │  │           │         │                       │ │
  │  │           │ ◄───────┘ results               │ │
  │  │           │                                 │ │
  │  │ Feed back │──────────→ LLM sees results!   │ │
  │  │           │           │                     │ │
  │  │           │ ◄─────────│ "The winner was..." │ │
  │  └───────────┘  answer   └─────────────────┘  │ │
  │    │                                            │
  │    ▼                                            │
  │  User sees: "The 2025 NBA finals winner was..." │
  │                                                 │
  └─────────────────────────────────────────────────┘

  KEY: 2 round trips to LLM!
  1st: Send prompt → get tool_call request
  2nd: Send tool result → get final answer
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — CODING AGENTS:
═══════════════════════════════════════════════════════════════

  Cursor / Claude Code — what tools do they have?

  ┌──────────────────────────────────────────────────┐
  │ Tool: readFile                                   │
  │ → Reads file content from your project!         │
  │ → LLM can understand your codebase!             │
  │                                                  │
  │ Tool: writeFile                                  │
  │ → Creates or overwrites files!                  │
  │ → LLM can write new code!                      │
  │                                                  │
  │ Tool: editFile                                   │
  │ → Modifies specific parts of files!             │
  │ → LLM can make targeted changes!               │
  │                                                  │
  │ Tool: searchFiles                                │
  │ → Searches codebase for patterns!               │
  │ → LLM can find relevant code!                  │
  │                                                  │
  │ Tool: runCommand                                 │
  │ → Runs terminal commands!                       │
  │ → npm install, git commit, tests!              │
  │                                                  │
  │ Tool: webSearch                                  │
  │ → Searches the internet!                        │
  │ → Documentation, Stack Overflow!                │
  │                                                  │
  │ Scott: "You wouldn't have a coding agent if      │
  │ it didn't have access to these tools!"          │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — TOOL CALLING EVOLUTION:
═══════════════════════════════════════════════════════════════

  2020: GPT-3 — NO tools!
  │ → Text in, text out only!
  │ → "Greeting card writer!"
  │
  ↓
  2023 (June): OpenAI Function Calling!
  │ → First official tool support!
  │ → LLM can request function execution!
  │ → GAME CHANGER for agents!
  │
  ↓
  2023 (Nov): Parallel Function Calling!
  │ → Multiple tools in one response!
  │ → Faster, more efficient agents!
  │
  ↓
  2024: Universal Tool Calling!
  │ → Anthropic, Google, Meta adopt same pattern!
  │ → SDKs like Vercel AI abstract providers!
  │ → "Switch out providers with same SDK!"
  │
  ↓
  NOW: Tools = standard feature!
  │ → Every major LLM supports tool calling!
  │ → Schema-based, guaranteed contracts!
  │ → The foundation of ALL modern agents!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 5:
═══════════════════════════════════════════════════════════════

  THE PROBLEM:
  [ ] LLMs have training CUTOFF — can't know recent info!
  [ ] Without tools = "greeting cards or sci-fi stories!"
  [ ] "This genie kinda SUCKS!"

  TOOL CALLING:
  [ ] Tool = Description + Schema + Execute function!
  [ ] Function calling = tools on YOUR system!
  [ ] LLM does NOT run the code! Returns a REQUEST!
  [ ] YOUR code executes, feeds result BACK to LLM!

  HOW IT WORKS:
  [ ] Define tool (name, description, schema, function!)
  [ ] LLM reads descriptions, decides which to use!
  [ ] LLM returns tool_call object with arguments!
  [ ] Your code runs the function, returns results!
  [ ] LLM observes results, decides next action!

  WHY IT MATTERS:
  [ ] "This is the ONLY way to provide up-to-date context!"
  [ ] "No tools = no coding agents, no useful agents!"
  [ ] "Observe, think, observe, think → conclusion!"

  TIẾP THEO → Phần 6: Implementing Tools!
```
