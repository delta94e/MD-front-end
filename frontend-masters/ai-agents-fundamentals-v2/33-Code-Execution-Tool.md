# AI Agents Fundamentals, v2 — Phần 33: Code Execution Tool — "Higher Level Tools, NOT Atomic!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Code Execution Tool — "Workflow Tool = Deterministic! MCP Notion = TOO LOW LEVEL!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Workflow tools, tool abstraction, MCP critique, deterministic patterns!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | Code Execution Without A Tool — "Already Have Everything!"    |
| 2   | The Problem With Atomic Tools — "Workflow Every Single Time!" |
| 3   | Higher Level Tools — "One Tool That Does ALL Three!"          |
| 4   | Execute Code Tool Implementation                              |
| 5   | Tool = Unlimited — "Another LLM, Another Agent, Anything!"    |
| 6   | The Notion MCP Rant — "I HATE It!"                            |
| 7   | Tool Design Philosophy — "Start HIGH, Take Down As Needed!"   |
| 8   | Tự Implement: Code Execution As Workflow Tool                 |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu            |

---

## §1. Code Execution Without A Tool — "Already Have Everything!"

> Scott: _"If you think about it, we already have ALL the tools we need. We need to write to a file and execute it. That's it."_

```
PRIMITIVE CODE EXECUTION:
═══════════════════════════════════════════════════════════════

  We ALREADY have:
  ┌──────────────────────────────────────────────────┐
  │ ✅ Write file → Save generated code!           │
  │ ✅ Terminal   → Execute the file!              │
  │ ✅ Read file  → Verify (optional!)             │
  │ ✅ Delete file → Clean up temp file!           │
  │                                                  │
  │ WORKFLOW:                                        │
  │ 1. LLM generates code!                          │
  │ 2. Write to temp file!                          │
  │ 3. Execute: node temp.js!                       │
  │ 4. Get results!                                  │
  │ 5. Delete temp file!                             │
  │                                                  │
  │ "We only need TWO tools. Write + Terminal.       │
  │  Read just to verify. Delete to clean up."      │
  └──────────────────────────────────────────────────┘
```

---

## §2. The Problem With Atomic Tools — "Workflow Every Single Time!"

> Scott: _"These tools are very ATOMIC. That's a set of tools that run in a certain order every single time. What if I want more than one thing? It gets COMPLICATED."_

```
THE ATOMIC PROBLEM:
═══════════════════════════════════════════════════════════════

  APPROACH 1 — "Just ask the agent!":
  ┌──────────────────────────────────────────────────┐
  │ Agent already has write + terminal + read!       │
  │ "We can just ASK it to do it right now."        │
  │                                                  │
  │ PROBLEM:                                         │
  │ "That's very much a WORKFLOW. I think it should │
  │  do this every SINGLE time."                    │
  │                                                  │
  │ → "I have to tell it: THIS IS HOW YOU EXECUTE  │
  │    CODE. Write a file, then use terminal to     │
  │    run node on that file, then..."              │
  │                                                  │
  │ → "What if I want more than ONE thing?          │
  │    It gets really COMPLICATED."                 │
  │                                                  │
  │ → "The tools are very ATOMIC. Read, write,     │
  │    delete. Each does one thing."                │
  └──────────────────────────────────────────────────┘

  APPROACH 2 — "Make a HIGHER LEVEL tool!":
  ┌──────────────────────────────────────────────────┐
  │ ONE tool that encapsulates ALL of that!          │
  │ "Why have the agent waste cycles on something   │
  │  that's a workflow I want to be the SAME        │
  │  every single time?"                             │
  │                                                  │
  │ → DETERMINISTIC!                                │
  │ → No wasted LLM cycles!                        │
  │ → Same result every time!                       │
  └──────────────────────────────────────────────────┘
```

---

## §3. Higher Level Tools — "One Tool That Does ALL Three!"

> Scott: _"Instead of expecting the agent to figure out the workflow, I could just make ONE tool that does that. This tool is like a WORKFLOW."_

```
ATOMIC vs HIGHER LEVEL:
═══════════════════════════════════════════════════════════════

  ATOMIC TOOLS (what we built!):
  ┌──────────────────────────────────────────────────┐
  │ readFile()   → Does ONE thing!                 │
  │ writeFile()  → Does ONE thing!                 │
  │ deleteFile() → Does ONE thing!                 │
  │ runCommand() → Does ONE thing!                 │
  │                                                  │
  │ AGENT must figure out workflow:                  │
  │ "Write file → run command → read output →     │
  │  delete file" = 4 loops! 4 LLM calls!          │
  └──────────────────────────────────────────────────┘

  HIGHER LEVEL = WORKFLOW TOOL:
  ┌──────────────────────────────────────────────────┐
  │ executeCode() → Does EVERYTHING in ONE call!   │
  │ → Write temp file (deterministic!)             │
  │ → Execute with right binary (deterministic!)   │
  │ → Capture output (deterministic!)              │
  │ → Delete temp file (deterministic!)            │
  │                                                  │
  │ AGENT: 1 tool call! 1 LLM cycle!               │
  │                                                  │
  │ "A WORKFLOW, not an atomic tool."               │
  └──────────────────────────────────────────────────┘
```

---

## §4. Execute Code Tool Implementation

> Scott: _"It has the code, the language (JS, Python, TS), and does exactly what I described. Create temp file, write, run binary, get results, delete."_

```javascript
const executeCode = tool({
  name: "executeCode",
  description:
    "Execute code in a specified language. " +
    "Creates a temporary file, executes it, " +
    "and returns the results.",
  parameters: z.object({
    code: z.string().describe("The code to execute"),
    language: z
      .enum(["javascript", "python", "typescript"])
      .describe("Programming language"),
  }),
  execute: async ({ code, language }) => {
    // Determine file extension + binary!
    const config = {
      javascript: { ext: ".js", binary: "node" },
      python: { ext: ".py", binary: "python3" },
      typescript: { ext: ".ts", binary: "npx tsx" },
    };
    const { ext, binary } = config[language];

    // Create temp file!
    const tmpFile = `/tmp/agent_code_${Date.now()}${ext}`;
    fs.writeFileSync(tmpFile, code);

    try {
      // Execute!
      const result = shell.exec(`${binary} ${tmpFile}`, { silent: true });

      if (result.code !== 0) {
        return `Error: ${result.stderr}`;
      }
      return result.stdout || "Code executed. No output.";
    } finally {
      // ALWAYS clean up!
      fs.unlinkSync(tmpFile);
    }
  },
});
```

---

## §5. Tool = Unlimited — "Another LLM, Another Agent, Anything!"

> Scott: _"You can put another LLM in this tool, another agent. There's NO END to what you can do. You're only bound by your transport mechanism."_

```
TOOLS ARE UNLIMITED:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Inside a tool's execute function, you can:       │
  │                                                  │
  │ ✅ Call another LLM!                            │
  │ ✅ Spin up another agent!                       │
  │ ✅ Start a database query!                      │
  │ ✅ Make HTTP requests!                          │
  │ ✅ Run shell commands!                          │
  │ ✅ Process files!                               │
  │ ✅ Do ANYTHING!                                 │
  │                                                  │
  │ "There's NO END to what you can do in the tool."│
  │                                                  │
  │ ONLY LIMIT — TRANSPORT:                          │
  │ "If tool takes 3 minutes over HTTP → TIMEOUT." │
  │ "Maybe WebSockets or SSE streaming is better."  │
  │ "You're NOT limited by the LLM in any way.      │
  │  It doesn't know, it doesn't CARE."             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. The Notion MCP Rant — "I HATE It!"

> Scott: _"The Notion MCP server — I HATE it. Can't stand it. They made tools SO atomic that no one can use them!"_

```
THE NOTION MCP RANT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WHAT NOTION DID:                                 │
  │ → "update_block", "find_block", "get_block_id" │
  │ → 30 micro super tiny tools!                   │
  │ → "The LLM has NO IDEA what a 'block' means    │
  │    in Notion's context."                        │
  │ → "It's just trying to WRITE TO A FILE."       │
  │                                                  │
  │ WHAT HAPPENED:                                   │
  │ → "Not obvious how to write to a Notion doc    │
  │    by looking at the tools."                    │
  │ → "Oh sorry you gotta call THIS other one      │
  │    first to get a block ID. Did you know that?" │
  │ → "It's TOO LOW LEVEL."                        │
  │                                                  │
  │ WHAT NOTION SHOULD HAVE DONE:                    │
  │ → writeFile() ← Does all the block stuff!     │
  │ → updateFile() ← Abstracts the complexity!    │
  │ → deleteFile() ← Simple, obvious!             │
  │ → searchFiles() ← What users actually want!   │
  │                                                  │
  │ "If a PhD-performing model cannot READ your     │
  │  MCP server descriptions and understand how     │
  │  to write to a file, YOU DID SOMETHING WRONG.  │
  │  I promise you."                                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tool Design Philosophy — "Start HIGH, Take Down As Needed!"

> Scott: _"Start high level. Each tool solves a USE CASE. Not the other way around. Don't start low and go up."_

```
TOOL DESIGN PHILOSOPHY:
═══════════════════════════════════════════════════════════════

  ❌ WRONG — BOTTOM UP:
  ┌──────────────────────────────────────────────────┐
  │ "Every API route = one tool."                   │
  │ "Every SDK method = one tool."                  │
  │ "Now LLM works WAY HARDER."                    │
  │ "Nobody gets use out of it."                    │
  └──────────────────────────────────────────────────┘

  ✅ RIGHT — TOP DOWN:
  ┌──────────────────────────────────────────────────┐
  │ "What use case do people ALWAYS do?"            │
  │ "Is there ONE tool that solves that use case    │
  │  perfectly every single time?"                   │
  │                                                  │
  │ OBSERVED PATTERN:                                │
  │ "People did tool A → then tool B → then tool C │
  │  every single time. And it was PERFECT."        │
  │                                                  │
  │ SOLUTION:                                        │
  │ "Make ONE tool that does A + B + C in code!     │
  │  DETERMINISTIC! Get rid of the other three!"   │
  │ "Everyone benefits from the deterministic       │
  │  workflow-as-a-tool."                            │
  │                                                  │
  │ "Start as HIGH as you can.                      │
  │  Take it DOWN as you need.                       │
  │  You WILL need to. But start HIGH."             │
  └──────────────────────────────────────────────────┘

  EVALS BENEFIT TOO:
  ┌──────────────────────────────────────────────────┐
  │ "Makes it EASIER on your evals too."            │
  │ "Instead of eval-ing 3 atomic steps,            │
  │  eval ONE workflow tool that always works."     │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Code Execution As Workflow Tool

```javascript
// ═══════════════════════════════════
// COMPLETE Workflow Tool Pattern
// ═══════════════════════════════════

import { tool } from "ai";
import { z } from "zod";
import fs from "fs";
import shell from "shelljs";

export const executeCode = tool({
  name: "executeCode",
  description:
    "Execute code in JavaScript, Python, or TypeScript. " +
    "Handles file creation, execution, and cleanup " +
    "automatically.",
  parameters: z.object({
    code: z.string().describe("The code to execute"),
    language: z
      .enum(["javascript", "python", "typescript"])
      .describe("The programming language"),
  }),
  execute: async ({ code, language }) => {
    // Language → binary + extension mapping!
    const languageConfig = {
      javascript: { ext: ".js", cmd: "node" },
      python: { ext: ".py", cmd: "python3" },
      typescript: { ext: ".ts", cmd: "npx tsx" },
    };

    const config = languageConfig[language];
    if (!config) {
      return `Unsupported language: ${language}`;
    }

    // Step 1: Create temp file!
    const tmpPath = `/tmp/agent_exec_${Date.now()}${config.ext}`;

    try {
      // Step 2: Write code to file!
      fs.writeFileSync(tmpPath, code, "utf-8");

      // Step 3: Execute with appropriate binary!
      const result = shell.exec(
        `${config.cmd} ${tmpPath}`,
        { silent: true, timeout: 30000 }, // 30sec timeout!
      );

      // Step 4: Collect output!
      let output = "";
      if (result.stdout) output += result.stdout;
      if (result.stderr) output += `\nSTDERR: ${result.stderr}`;

      if (result.code !== 0) {
        return `Execution failed (exit ${result.code}):\n${output}`;
      }

      return output || "Code executed. No output produced.";
    } catch (error) {
      return `Execution error: ${error.message}`;
    } finally {
      // Step 5: ALWAYS clean up!
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* file already deleted */
      }
    }
  },
});

// ═══════════════════════════════════
// Pattern: Workflow Tool = Multiple Atomic Steps
// ═══════════════════════════════════

// BEFORE (agent needs 4 turns!):
// Turn 1: writeFile → "saved to /tmp/code.js"
// Turn 2: runCommand → "node /tmp/code.js"
// Turn 3: readFile → verify output
// Turn 4: deleteFile → cleanup

// AFTER (agent needs 1 turn!):
// Turn 1: executeCode → code + language → DONE!
//   Internally does write + run + cleanup!
//   DETERMINISTIC every time!
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO MCP NOTION TỆ?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao khó dùng?
  └→ "Not obvious how to write to a Notion doc
     by looking at the tools."

  WHY ②: Tại sao không obvious?
  └→ "30 micro tools. update_block, find_block.
     LLM has NO IDEA what a 'block' means."

  WHY ③: Tại sao nhiều micro tools?
  └→ "They took every API route and made each one
     a tool. Very atomic. Too low level."

  WHY ④: Tại sao low level = bad?
  └→ "LLM works WAY harder. Needs to figure out
     which tools, which order, which IDs."

  WHY ⑤: Tại sao nên high level?
  └→ "One tool = one use case. DETERMINISTIC.
     Easier to eval. Everyone benefits."
```

### 9.2 Pattern ②: Mental Mapping

```
MENTAL MAP — TOOL DESIGN PHILOSOPHY:
═══════════════════════════════════════════════════════════════

  OBSERVATION: Users always do A→B→C in same order!
       │
       ▼
  QUESTION: Can we make ONE tool that does A+B+C?
       │
       ▼
  YES → Make workflow tool!
       │ → Deterministic!
       │ → Fewer LLM cycles!
       │ → Easier evals!
       │ → Remove atomic tools A, B, C!
       │
       ▼
  "Start HIGH. Take down as you NEED."
```

### 9.3 Pattern ③: Trade-off Analysis

```
ATOMIC vs WORKFLOW TOOLS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Atomic        │ Workflow          │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Flexibility      │ ✅ Mix & match│ ⚠️ Fixed workflow │
  │ LLM cycles       │ ❌ Many!     │ ✅ One!           │
  │ Determinism      │ ❌ Agent decides│ ✅ Always same! │
  │ Eval difficulty  │ ❌ Hard!     │ ✅ Easy!          │
  │ LLM understanding│ ❌ Complex!  │ ✅ Obvious!       │
  │ Tool count       │ ❌ Many!     │ ✅ Few!           │
  └──────────────────┴───────────────┴───────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 33:
═══════════════════════════════════════════════════════════════

  CODE EXECUTION:
  [ ] Already have everything! Write + terminal!
  [ ] Workflow tool = one call does everything!
  [ ] Create temp → execute → capture → cleanup!
  [ ] Support JS, Python, TypeScript!

  TOOL DESIGN:
  [ ] Start HIGH LEVEL, not atomic!
  [ ] "One tool = one USE CASE!"
  [ ] Observe patterns → make workflow tools!
  [ ] "PhD model can't use your tools = YOU failed!"

  MCP LESSON:
  [ ] "Notion MCP = I HATE it! Too atomic!"
  [ ] "LLM has no idea what a 'block' means!"
  [ ] Higher level = obvious + deterministic!

  TOOLS ARE UNLIMITED:
  [ ] Execute function = ANY CODE!
  [ ] "Another LLM, another agent, anything!"
  [ ] "Only bound by TRANSPORT mechanism!"

  TIẾP THEO → Phần 34: Human in the Loop!
```
