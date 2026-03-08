# AI Agents Fundamentals, v2 — Phần 21: Use Cases for File System Tools — "File System = The MOST Powerful Tool!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Use Cases for File System Tools — "Give An Agent A Computer And It Can Do ANYTHING!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Tool design philosophy, agent memory, inter-agent communication!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Why Files Matter — "The #1 Tool. Take Away Everything Else!" |
| 2   | Give It A Computer — "Write Its Own Code To Solve Problems!" |
| 3   | Use Cases — "Memory, Context, Communication, Config!"        |
| 4   | Tool Design Philosophy — "You're Influencing The Agent!"     |
| 5   | Implementation Considerations — "Path, Errors, Binary!"      |
| 6   | Error Handling For LLMs — "Return Strings, Not Invariants!"  |
| 7   | Atomic vs Composite Tools — "99% Over A Million = <50%!"     |
| 8   | Tự Implement: File System Use Case Patterns                  |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu           |

---

## §1. Why Files Matter — "The #1 Tool. Take Away Everything Else!"

> Scott: _"If you took away every single tool and it only had file system, it could STILL help you write code. That is the #1 tool."_

```
WHY FILE SYSTEM IS #1:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Giving an agent access to a file system is      │
  │  ONE OF THE MOST POWERFUL things you can do."   │
  │                                                  │
  │ IF YOU TOOK AWAY EVERYTHING:                     │
  │ ❌ No web search                                │
  │ ❌ No shell                                     │
  │ ❌ No database                                  │
  │ ❌ No API calls                                 │
  │ ✅ ONLY file system!                            │
  │                                                  │
  │ →"It could STILL help you write code."         │
  │ → Read your whole repo!                        │
  │ → Edit your files!                             │
  │ → Delete files!                                │
  │ → Create files!                                │
  │                                                  │
  │ "That is the #1 tool that Cursor or Claude Code │
  │  uses. It's the FILE SYSTEM."                   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Give It A Computer — "Write Its Own Code To Solve Problems!"

> Scott: _"We write code to solve a problem. What if you let an agent write its OWN code to solve a problem? Then it becomes as powerful as YOU."_

```
THE DEEP INSIGHT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ What we do NOW:                                  │
  │ human problem → agent helps write code → done! │
  │                                                  │
  │ What's NEXT:                                     │
  │ agent has problem → agent writes OWN CODE!     │
  │ → "Then it becomes as powerful as YOU because   │
  │    YOU can solve a lot of problems with code."  │
  │                                                  │
  │ GIVE AN AGENT:                                   │
  │ + File system (read/write!)                     │
  │ + Terminal (execute!)                            │
  │ + Internet (research!)                           │
  │ = "They can accomplish ANYTHING that an          │
  │    engineer would accomplish."                   │
  │                                                  │
  │ "I'm not talking about writing code. We write   │
  │  code to SOLVE A PROBLEM. We write scripts to   │
  │  AUTOMATE things. That's solving a problem."    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Use Cases — "Memory, Context, Communication, Config!"

> Scott: _"Files as agent MEMORY. You don't need a database. A Claude MD file is just markdown that an agent can reference later."_

```
FILE SYSTEM USE CASES:
═══════════════════════════════════════════════════════════════

  ① CODE INTERACTION:
  ┌──────────────────────────────────────────────────┐
  │ Reading source code! Writing files!             │
  │ Configuration! Writing outputs!                 │
  │ → "The most obvious one."                      │
  └──────────────────────────────────────────────────┘

  ② DATA ANALYSIS:
  ┌──────────────────────────────────────────────────┐
  │ "Take a CSV. Give it a tool to generate images. │
  │  It'll generate a CHART for a presentation or   │
  │  YouTube video. Quite useful."                  │
  └──────────────────────────────────────────────────┘

  ③ AGENT MEMORY (Scratch Pad!):
  ┌──────────────────────────────────────────────────┐
  │ "You DON'T NEED a database."                    │
  │ "Short-term memory — write things down!"       │
  │                                                  │
  │ Agent: "Ah, I tried this, it didn't work."     │
  │ Agent: "Here was the result, I might use later."│
  │                                                  │
  │ WHY NOT messages array?                          │
  │ → "Might blow up context window"               │
  │ → "Run out of tokens"                          │
  │ → "Slow things down"                           │
  │ → "Cost too much money"                        │
  │                                                  │
  │ "A Claude MD file or Cursor rule is JUST         │
  │  markdown files that an agent can reference."   │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ④ CONTEXT LOADING:
  ┌──────────────────────────────────────────────────┐
  │ "Read your code = context loading!"             │
  │ "Contents of files are returned from readFile.  │
  │  We know what that looks like — adds to array." │
  │ "That ONE simple tool allows the agent to        │
  │  understand EVERYTHING about your codebase."    │
  └──────────────────────────────────────────────────┘

  ⑤ INTER-AGENT COMMUNICATION:
  ┌──────────────────────────────────────────────────┐
  │ "Imagine 3 agents working on your repo."        │
  │                                                  │
  │ Agent A writes: "Working on auth module"        │
  │ Agent B reads:  "OK, I'll skip auth"           │
  │ Agent C writes: "Working on API routes"         │
  │                                                  │
  │ "Every step, write what you're doing to a file. │
  │  Before each step, read it to make sure         │
  │  someone else isn't doing it."                  │
  │                                                  │
  │ "Like a LIVE GOOGLE DOC they can collaborate    │
  │  together to not step on each other's toes."    │
  │                                                  │
  │ "I open up SIX TABS, have them talk to this     │
  │  file. Messages popping in like 'oh I'm doing  │
  │  this, don't touch this' — it's kind of CRAZY  │
  │  but it works really well."                      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ⑥ TOOL OUTPUT STORAGE:
  ┌──────────────────────────────────────────────────┐
  │ "Web search returned a bunch of stuff? Don't    │
  │  keep it in context window — too expensive!"    │
  │ → Write to file! "Look at it when you need it."│
  │ → "Versus keeping it the WHOLE time."          │
  └──────────────────────────────────────────────────┘

  ⑦ SELF-CONFIGURATION:
  ┌──────────────────────────────────────────────────┐
  │ "Claude Code does a lot of this."               │
  │ "MCP = just a JSON file. Tell Claude Code to    │
  │  go modify its OWN JSON to add the MCP."       │
  │                                                  │
  │ → "Hey Claude, install this MCP on yourself."  │
  │ → "It'll do it because it can EDIT ITS OWN     │
  │    FILE. You don't even have to open the file." │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Tool Design Philosophy — "You're Influencing The Agent!"

> Scott: _"Whatever you return, that's what the agent is going to SEE. You're INFLUENCING the agent. Be responsible with that influence."_

```
TOOL DESIGN — AGENT vs FUNCTION:
═══════════════════════════════════════════════════════════════

  REGULAR FUNCTION:
  ┌──────────────────────────────────────────────────┐
  │ → Returns data for code to consume!            │
  │ → Structured data (objects, arrays!)           │
  │ → Throw errors, invariants!                    │
  │ → Another function will process the output!    │
  └──────────────────────────────────────────────────┘

  AGENT TOOL:
  ┌──────────────────────────────────────────────────┐
  │ → Returns data for INTELLIGENCE to parse!      │
  │ → Language, not just data!                     │
  │ → Helpful error messages, not crashes!         │
  │ → "Whatever the result is, it's meant for      │
  │    some type of INTELLIGENCE to understand."    │
  │                                                  │
  │ "You have to be responsible with that influence.│
  │  You're INFLUENCING the agent."                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Implementation Considerations — "Path, Errors, Binary!"

> Scott: _"How might an agent input a path? Relative? Absolute? Traversal? We have to come up with that POLICY."_

```
IMPLEMENTATION CHALLENGES:
═══════════════════════════════════════════════════════════════

  ① PATH HANDLING:
  ┌──────────────────────────────────────────────────┐
  │ Relative path? /src/index.js                    │
  │ Absolute path? /Users/scott/project/src/...     │
  │ Traversal? ../../secret/passwords.txt 😱       │
  │                                                  │
  │ POLICY OPTIONS:                                  │
  │ → Prompt engineering: "Only use relative paths!"│
  │ → Input validation: check for "../" and block! │
  │ → Return hint: "We don't accept these paths."  │
  │ → "Agent sees that: 'ah, my mistake' and       │
  │    hopefully calls again with correct path."    │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ② LARGE FILES:
  ┌──────────────────────────────────────────────────┐
  │ "What happens when an agent tries to read a      │
  │  10 MEGABYTE log file?"                         │
  │                                                  │
  │ Options:                                         │
  │ → "Hey, this file is too big!"                 │
  │ → Truncate: first few lines only!              │
  │ → Stream: output progressively!                │
  │ → Summarize: upload to another LLM!            │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ③ BINARY FILES:
  ┌──────────────────────────────────────────────────┐
  │ → Use multimodal models with attachments!      │
  │ → Local parser (Base64 encoding!)              │
  │ → "Not supporting uploading to LLM as          │
  │    attachment — that's a DIFFERENT thing."      │
  └──────────────────────────────────────────────────┘
```

---

## §6. Error Handling For LLMs — "Return Strings, Not Invariants!"

> Scott: _"You definitely wouldn't have returned a string for some person to read — that wouldn't make sense for a regular function."_

```
ERROR HANDLING — AGENT TOOLS:
═══════════════════════════════════════════════════════════════

  REGULAR FUNCTION:
  ┌──────────────────────────────────────────────────┐
  │ throw new Error("File not found!");             │
  │ → Crashes! Stack trace! Invariant!             │
  │ → "You'd have just thrown an invariant error."  │
  └──────────────────────────────────────────────────┘

  AGENT TOOL:
  ┌──────────────────────────────────────────────────┐
  │ return "File not found at /src/config.json.     │
  │ You should use the listFiles tool to see what   │
  │ files are available in the directory.";          │
  │                                                  │
  │ → Helpful string! Agent understands!           │
  │ → Hint at next action!                         │
  │ → "Every token carries WEIGHT."                │
  │                                                  │
  │ EVAL THIS:                                       │
  │ → Mock tool always returns error!              │
  │ → What does agent do next?                     │
  │ → Expected: ask user OR call listFiles!        │
  │ → "So you eval THAT."                         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Atomic vs Composite Tools — "99% Over A Million = <50%!"

> Scott: _"The more atomic your tools are, the more steps. The more steps, the more error-prone. 99% accuracy over a million tasks is LESS THAN 50%."_

```
ATOMIC vs COMPOSITE TOOLS:
═══════════════════════════════════════════════════════════════

  ATOMIC (what we're building!):
  ┌──────────────────────────────────────────────────┐
  │ readFile → one thing!                          │
  │ writeFile → one thing!                         │
  │ listFiles → one thing!                         │
  │ deleteFile → one thing!                        │
  │                                                  │
  │ Task: "Write and verify" = 2 tool calls!       │
  └──────────────────────────────────────────────────┘

  COMPOSITE (as you evolve!):
  ┌──────────────────────────────────────────────────┐
  │ writeAndVerify → write + list + confirm!       │
  │ → ONE tool call instead of THREE!              │
  │ → Less error-prone!                            │
  │                                                  │
  │ "Your tools don't have to be atomic. As you     │
  │  build out, you'll start to realize your tools  │
  │  will be COMBINATIONS of many things."         │
  │                                                  │
  └──────────────────────────────────────────────────┘

  THE MATH — WHY THIS MATTERS:
  ┌──────────────────────────────────────────────────┐
  │ 99% accuracy per task. Sounds GREAT!            │
  │                                                  │
  │ 99%^1    = 99%     ← one task! great!          │
  │ 99%^10   = 90.4%   ← ten tasks! still ok!     │
  │ 99%^100  = 36.6%   ← hundred tasks! BAD!      │
  │ 99%^1000 = 0.004%  ← thousand tasks! DEAD! 💀 │
  │                                                  │
  │ "That 99% accuracy over a million tasks is      │
  │  LESS THAN 50% now."                            │
  │                                                  │
  │ → FEWER steps = FEWER chances to fail!         │
  │ → Composite tools = fewer steps!               │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: File System Use Case Patterns

```javascript
// ═══════════════════════════════════
// PATTERN 1: Agent Memory (Scratch Pad!)
// ═══════════════════════════════════

// "You don't need a database. Just write markdown."

const scratchPadTool = {
  name: "scratchPad",
  description:
    "Write notes, observations, and plans to your scratch pad. " +
    "Use this to remember things across steps.",
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The note to add to the scratch pad",
      },
    },
    required: ["content"],
  },
  execute: async ({ content }) => {
    const pad = ".agent-memory/scratch.md";
    const existing = await readFileSafe(pad);
    const timestamp = new Date().toISOString();
    const entry = `\n## ${timestamp}\n${content}\n`;
    await writeFile(pad, existing + entry);
    return `Note saved. You can read the scratch pad later.`;
  },
};
```

```javascript
// ═══════════════════════════════════
// PATTERN 2: Inter-Agent Communication
// ═══════════════════════════════════

// "Like a live Google Doc. Messages popping in!"

const communicationFile = ".agent-comms/status.json";

const reportStatusTool = {
  name: "reportStatus",
  description:
    "Report what you're currently working on so other agents " +
    "know not to work on the same thing.",
  parameters: {
    type: "object",
    properties: {
      agentId: { type: "string" },
      status: { type: "string" },
      workingOn: { type: "string" },
    },
    required: ["agentId", "status", "workingOn"],
  },
  execute: async ({ agentId, status, workingOn }) => {
    const existing = JSON.parse(await readFileSafe(communicationFile, "[]"));
    existing.push({
      agentId,
      status,
      workingOn,
      timestamp: Date.now(),
    });
    await writeFile(communicationFile, JSON.stringify(existing, null, 2));
    return `Status reported. Other agents can see your work.`;
  },
};
```

```javascript
// ═══════════════════════════════════
// PATTERN 3: Tool Output Storage
// ═══════════════════════════════════

// "Don't keep web search results in context window!"

const storeResultsTool = {
  name: "storeResults",
  description:
    "Store large tool outputs to a file instead of keeping " +
    "them in the conversation. Reference the file later.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name for this result set" },
      content: { type: "string", description: "The content to store" },
    },
    required: ["name", "content"],
  },
  execute: async ({ name, content }) => {
    const path = `.agent-cache/${name}.md`;
    await writeFile(path, content);
    return (
      `Results stored at ${path}. ` +
      `You can read this file later when needed ` +
      `instead of keeping it in conversation.`
    );
  },
};
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO FILE SYSTEM QUAN TRỌNG NHẤT?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao file system là tool #1?
  └→ "Take away EVERYTHING else and it can STILL
     help you write code. Read, edit, delete, create."

  WHY ②: Tại sao agent cần viết code cho chính nó?
  └→ "We write code to SOLVE problems. If an agent
     can write its own code, it becomes as powerful as YOU."

  WHY ③: Tại sao dùng file thay vì database cho memory?
  └→ "You DON'T NEED a SQL database. Just write
     markdown. Claude MD = just markdown files."

  WHY ④: Tại sao return string thay vì throw error?
  └→ "The result is meant for INTELLIGENCE to parse.
     Returning language — it UNDERSTANDS language."

  WHY ⑤: Tại sao composite tools tốt hơn atomic?
  └→ "99% accuracy over a million tasks = less than 50%.
     More steps = more error-prone. FEWER steps = better."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TOOL DESIGN:
═══════════════════════════════════════════════════════════════

  Regular function: Input → Process → Output (for code!)
  Agent tool: Input → Process → Output (for INTELLIGENCE!)

  "The ONLY difference is: the consumer of your output
   is an intelligence, not another function."

  "You have to be RESPONSIBLE with that influence.
   Every token carries WEIGHT."
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Memory storage   │ messages array│ File system       │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Speed            │ ✅ In memory! │ ⚠️ Disk I/O!     │
  │ Token cost       │ ❌ Expensive! │ ✅ Free!          │
  │ Persistence      │ ❌ Session!   │ ✅ Permanent!     │
  │ Size limit       │ ❌ Context!   │ ✅ Unlimited!     │
  │ Cross-session    │ ❌ Lost!      │ ✅ Preserved!     │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Tool granularity │ Atomic        │ Composite         │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Flexibility      │ ✅ Modular!   │ ⚠️ Less flexible! │
  │ Error rate       │ ❌ High!      │ ✅ Low!           │
  │ Steps needed     │ ❌ Many!      │ ✅ Few!           │
  │ Development      │ ✅ Simple!    │ ⚠️ Complex!       │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — FILE SYSTEM USE CASES:
═══════════════════════════════════════════════════════════════

  FILE SYSTEM
       │
       ├── Code: read, write, edit, create, delete!
       │
       ├── Memory: scratch pad, observations, plans!
       │   └── "A Claude MD file is JUST markdown."
       │
       ├── Communication: multi-agent coordination!
       │   └── "Live Google Doc between agents!"
       │
       ├── Storage: cache expensive tool outputs!
       │   └── "Don't keep in context window!"
       │
       ├── Config: self-configuration!
       │   └── "Agent edits its OWN config file!"
       │
       └── Context: load codebase understanding!
           └── "ONE tool = understand EVERYTHING!"
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — Programming Agents Like People:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "The way you have to program these things is     │
  │  WAY DIFFERENT than what we're used to."        │
  │                                                  │
  │ "The moment you start thinking about building    │
  │  an agent as similar to creating STEP BY STEP   │
  │  instructions for a NEW HIRE, then the more     │
  │  it'll start CLICKING."                          │
  │                                                  │
  │ "It's more closely related to talking to         │
  │  something that can REASON than to I/O of       │
  │  functions."                                     │
  │                                                  │
  │ "Every token carries WEIGHT. You have to be     │
  │  very specific. That's why PROMPT ENGINEERING   │
  │  is the first thing you try."                    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — File System In AI Agents:
═══════════════════════════════════════════════════════════════

  Early agents: No file access, text-only chatbots!
  │
  ↓ Code assistants get file read!
  │ → "ONE tool to understand EVERYTHING."
  │
  ↓ Code agents get file write!
  │ → Can edit, create, delete!
  │
  ↓ Memory via files!
  │ → Claude MD, Cursor rules, scratch pads!
  │ → "You DON'T NEED a database!"
  │
  ↓ Inter-agent coordination!
  │ → Files as communication channel!
  │ → "Six tabs talking to ONE file!"
  │
  ↓ Self-configuration!
  │ → "Hey Claude, install this MCP on yourself."
  │ → Agent modifies its OWN config!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 21:
═══════════════════════════════════════════════════════════════

  WHY FILES:
  [ ] "#1 tool! Take away everything else, still works!"
  [ ] "Give it file + terminal + internet = ANYTHING!"
  [ ] "Agent writes its OWN code = as powerful as YOU!"

  USE CASES:
  [ ] Code interaction (read/write/edit!)
  [ ] Agent memory (scratch pad, no database needed!)
  [ ] Context loading (readFile = understand codebase!)
  [ ] Inter-agent communication (live Google Doc!)
  [ ] Tool output storage (don't bloat context!)
  [ ] Self-configuration (edit own config files!)

  TOOL DESIGN:
  [ ] Output is for INTELLIGENCE, not code!
  [ ] Return helpful strings, not throw errors!
  [ ] "Every token carries WEIGHT!"
  [ ] "Like step-by-step for a NEW HIRE!"

  COMPOSITE TOOLS:
  [ ] "99% accuracy × million tasks = <50%!"
  [ ] Fewer steps = fewer failures!
  [ ] "Your tools will become COMBINATIONS!"

  TIẾP THEO → Phần 22: Read & Write (Implementation!)
```
