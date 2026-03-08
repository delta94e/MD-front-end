# AI Agents Fundamentals, v2 — Phần 22: Read & Write — "Return Language, Not Data!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Read & Write — "readFile, writeFile — Simple Tools, Critical Details!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — Tool implementation, error handling, description hints!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | Tool Organization — "One File, All Tools. A Toolset!"   |
| 2   | readFile — "Description Matters. ALWAYS Use This Tool!" |
| 3   | Input Schema — "z.string().describe() = LLM Knows!"     |
| 4   | Error Handling — "Tell The LLM What Happened!"          |
| 5   | writeFile — "Description MUST Match Behavior!"          |
| 6   | Recursive Mkdir — "Create All Parent Directories!"      |
| 7   | Return Hints — "Successfully Wrote X Characters!"       |
| 8   | Suggesting Next Actions — "You Should Verify!"          |
| 9   | MCP Description Wars — "Always Pick This One!"          |
| 10  | Tự Implement: readFile & writeFile From Scratch         |
| 11  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu      |

---

## §1. Tool Organization — "One File, All Tools. A Toolset!"

> Scott: _"Instead of one file per tool, we'll put them all in this file. Call it a toolset — a collection of tools."_

```javascript
// tools/file.ts — All file tools in one place!

import { tool } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import nodePath from "node:path";

// "node: prefix = 100% guaranteed from Node, not npm.
//  If somebody made an npm package called 'fs',
//  they're being MALICIOUS. 100%. Don't install it."

// Export individual tools + grouped toolset!
export const readFile = tool({
  /* ... */
});
export const writeFile = tool({
  /* ... */
});
export const listFiles = tool({
  /* ... */
});
export const deleteFile = tool({
  /* ... */
});

// Toolset — import all at once!
export const fileTools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};
```

---

## §2. readFile — "Description Matters. ALWAYS Use This Tool!"

> Scott: _"Two things to think about when writing descriptions: What does this tool DO? And WHEN would you use it?"_

```javascript
// readFile — The most important tool!

export const readFile = tool({
  description:
    "Read the full contents of a file at the given path. " +
    "Use this always. Use this to read a file.",
  // ↑ "ALWAYS use this to read a file."
  // Why? Because shell tool can ALSO read files
  // with 'cat'. We want agent to prefer THIS one!

  parameters: z.object({
    path: z.string().describe(
      "The path to the file to read",
      // Could also specify:
      // "The relative or absolute path..."
      // "This is where you would have to EVAL."
    ),
  }),

  execute: async ({ path }) => {
    try {
      const content = await fs.readFile(path, "utf-8");
      return content;
    } catch (error) {
      return (
        `There was an error reading the file. ` +
        `Here is the native error from Node.js: ${error}`
      );
      // "Stringify an error just gives you the message."
    }
  },
});
```

```
DESCRIPTION STRATEGY — TWO QUESTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ① WHAT does this tool do?                        │
  │ "Read the full contents of a file at the path." │
  │                                                  │
  │ ② WHEN would you use it?                         │
  │ "Use this ALWAYS. Use this to read a file."     │
  │                                                  │
  │ WHY "ALWAYS"?                                    │
  │ → MCP tools might overlap!                     │
  │ → Shell tool can also 'cat' files!             │
  │ → "JUST IN CASE there's another tool that      │
  │    might read a file, like the shell command."  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Input Schema — "z.string().describe() = LLM Knows!"

> Scott: _"Zod for input schemas so the agent knows what to pass in."_

```javascript
// INPUT SCHEMA OPTIONS

// Basic:
parameters: z.object({
  path: z.string().describe("The path to the file to read"),
});

// With encoding option:
parameters: z.object({
  path: z.string().describe("The path to the file to read"),
  encoding: z
    .enum(["utf-8", "ascii", "base64"])
    .describe("File encoding to use"),
  // "Supports ENUMS — the LLM picks from a list!"
});

// Strict mode (default in AI SDK!):
// → LLM MUST fulfill ALL fields in schema!
// → No extra properties allowed!
// → To make optional: use union with null!
parameters: z.object({
  path: z.string(),
  encoding: z
    .union([z.enum(["utf-8", "ascii", "base64"]), z.literal(null)])
    .describe("Optional encoding, null = utf-8"),
});
```

---

## §4. Error Handling — "Tell The LLM What Happened!"

> Scott: _"A very common error: trying to read a file that doesn't exist. Help the LLM understand that."_

```javascript
// ERROR HANDLING STRATEGIES

// BASIC (what we did live!):
execute: async ({ path }) => {
  try {
    const content = await fs.readFile(path, "utf-8");
    return content;
  } catch (error) {
    return (
      `There was an error reading the file. ` +
      `Here is the native error from Node.js: ${error}`
    );
  }
};

// DETAILED (what the notes have!):
execute: async ({ path }) => {
  try {
    const content = await fs.readFile(path, "utf-8");
    return content;
  } catch (error) {
    if (error.code === "ENOENT") {
      return (
        `File not found at ${path}. ` +
        `You may want to use listFiles to see ` +
        `what files are available.`
      );
      // ↑ HINT at next action!
    }
    return `Error reading file: ${error.message}`;
  }
};
```

```
ERROR HANDLING PHILOSOPHY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "How do I make it EASY for this LLM to really   │
  │  understand what's going on?"                    │
  │                                                  │
  │ → Switch on error codes! Better detail!        │
  │ → Hint at what to do next!                     │
  │ → "You might say: you should try THIS instead" │
  │                                                  │
  │ EVAL THIS:                                       │
  │ → Mock tool always returns error!              │
  │ → Expected behavior A: ask user for new path!  │
  │ → Expected behavior B: call listFiles!         │
  │ → "It can get pretty GRANULAR."                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. writeFile — "Description MUST Match Behavior!"

> Scott: _"If you say it creates files but it DOESN'T, the LLM will panic. Start trying things. Maybe get stuck in a loop. Or give up."_

```javascript
// writeFile — Description accuracy is CRITICAL!

export const writeFile = tool({
  description:
    "Write to a file at a specified given path. " +
    "Creates the file if it does not exist " +
    "and will overwrite it if it does.",
  // ↑ MUST match actual behavior!
  // "If you say it creates files but it doesn't,
  //  the LLM will start panicking."

  parameters: z.object({
    path: z.string().describe("The path to the file to write to"),
    content: z.string().describe("The content to write to the file"),
  }),

  execute: async ({ path, content }) => {
    try {
      // Create parent directories if needed!
      const directory = nodePath.dirname(path);
      await fs.mkdir(directory, { recursive: true });
      // "recursive: true = if path includes
      //  directories that don't exist, make those TOO."

      await fs.writeFile(path, content, "utf-8");

      return `Successfully wrote ${content.length} ` + `characters to ${path}`;
      // "Putting the NUMBER is super helpful!
      //  Tells LLM that ALL content was written,
      //  it's not partial."
    } catch (error) {
      return (
        `Was not able to write to the file ` +
        `at ${path}. Here is the Node.js error: ${error}`
      );
    }
  },
});
```

---

## §6. Recursive Mkdir — "Create All Parent Directories!"

> Scott: _"If this path includes directories that don't exist, make those TOO. Versus having to do each one by one — so annoying."_

```
RECURSIVE MKDIR:
═══════════════════════════════════════════════════════════════

  Path: /tools/config/thing/other/file.json

  WITHOUT recursive:
  ┌──────────────────────────────────────────────────┐
  │ mkdir("tools")     ← exists? create!           │
  │ mkdir("config")    ← exists? create!           │
  │ mkdir("thing")     ← exists? create!           │
  │ mkdir("other")     ← exists? create!           │
  │ writeFile("file.json") ← finally!             │
  │ → "SO ANNOYING!" 😤                           │
  └──────────────────────────────────────────────────┘

  WITH recursive: true:
  ┌──────────────────────────────────────────────────┐
  │ mkdir("/tools/config/thing/other",               │
  │       { recursive: true })                       │
  │ → Creates ALL directories at once! ✅          │
  │ writeFile("file.json") ← done!                │
  └──────────────────────────────────────────────────┘
```

---

## §7. Return Hints — "Successfully Wrote X Characters!"

> Scott: _"Putting the NUMBER here is super helpful. It tells the LLM that ALL your content was written, not partial."_

```
RETURN MESSAGE STRATEGY:
═══════════════════════════════════════════════════════════════

  ❌ BAD: return "success"
  → LLM: "OK... but did it write ALL of it? 🤔"

  ❌ BAD: return "done"
  → LLM: "Done what exactly?"

  ✅ GOOD: return `Successfully wrote ${content.length}
           characters to ${path}`
  → LLM: "All 2847 characters written. ✅"
  → "Tells the LLM it's not PARTIAL."
```

---

## §8. Suggesting Next Actions — "You Should Verify!"

> Scott: _"You could hint: 'you should verify by listing files.' Then eval: every time it calls writeFile, next call BETTER be listFiles."_

```
GUIDING AGENT BEHAVIOR VIA RETURN:
═══════════════════════════════════════════════════════════════

  return `Successfully wrote ${content.length} characters `
    + `to ${path}. You should verify by listing files.`;
                     ↑
  ┌──────────────────────────────────────────────────┐
  │ This is a SEMI-WORKFLOW!                         │
  │ → "Strongly suggesting next action."            │
  │ → "It doesn't HAVE to listen, but..."          │
  │ → "Creating a little bit of DETERMINISM."      │
  │                                                  │
  │ EVAL THIS:                                       │
  │ → After writeFile → next tool = listFiles?     │
  │ → If not: adjust prompt or tool description!   │
  │                                                  │
  │ ALTERNATIVE:                                     │
  │ "Maybe just make a tool that does BOTH."        │
  │ → writeAndVerify = write + list + confirm!     │
  │ → "One tool, fewer steps, less error-prone!"   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. MCP Description Wars — "Always Pick This One!"

> Scott: _"If I'm Firecrawl, I'm going into our MCP tool description and saying: ALWAYS pick this one. That's why MCP might not be the future — that's SCARY."_

```
MCP TOOL CONFLICT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Claude Code has:                                 │
  │ → Built-in: web_fetch (native!)                │
  │ → MCP: firecrawl_search (paid service!)        │
  │                                                  │
  │ "Sometimes Claude would use Firecrawl,           │
  │  sometimes web search."                          │
  │                                                  │
  │ IF YOU'RE FIRECRAWL:                             │
  │ → "I'm going into our MCP description and      │
  │    saying: ALWAYS pick this one. If there's     │
  │    another search tool, DON'T USE that one."    │
  │ → "You want someone's agent to use YOUR thing  │
  │    so they'll PAY you."                          │
  │                                                  │
  │ "That's why MCP is great but might NOT be the   │
  │  future — because that's SCARY."                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §10. Tự Implement: readFile & writeFile From Scratch

```javascript
// COMPLETE FILE TOOLS — No libraries!

import {
  readFile as nodeReadFile,
  writeFile as nodeWriteFile,
  mkdir,
} from "node:fs/promises";
import { dirname } from "node:path";

// ═══════════════════════════════════
// readFile Tool
// ═══════════════════════════════════

const readFileTool = {
  name: "readFile",
  description:
    "Read the full contents of a file at the given path. " +
    "Use this always. Use this to read a file.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to read",
      },
    },
    required: ["path"],
  },
  execute: async ({ path }) => {
    try {
      // Input validation: block path traversal!
      if (path.includes("../")) {
        return (
          "Error: Path traversal with '../' is not allowed. " +
          "Please use absolute or relative paths without " +
          "directory traversal."
        );
      }

      const content = await nodeReadFile(path, "utf-8");
      return content;
    } catch (error) {
      if (error.code === "ENOENT") {
        return (
          `File not found at ${path}. ` +
          `Try using listFiles to see available files.`
        );
      }
      if (error.code === "EACCES") {
        return (
          `Permission denied reading ${path}. ` +
          `This file may require elevated permissions.`
        );
      }
      return `Error reading file: ${error.message}`;
    }
  },
};

// ═══════════════════════════════════
// writeFile Tool
// ═══════════════════════════════════

const writeFileTool = {
  name: "writeFile",
  description:
    "Write to a file at a specified path. " +
    "Creates the file if it does not exist " +
    "and will overwrite if it does.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to write to",
      },
      content: {
        type: "string",
        description: "The content to write to the file",
      },
    },
    required: ["path", "content"],
  },
  execute: async ({ path, content }) => {
    try {
      // Create parent directories!
      const dir = dirname(path);
      await mkdir(dir, { recursive: true });

      await nodeWriteFile(path, content, "utf-8");

      return `Successfully wrote ${content.length} ` + `characters to ${path}`;
    } catch (error) {
      return (
        `Was not able to write to ${path}. ` + `Node.js error: ${error.message}`
      );
    }
  },
};
```

---

## §11. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 11.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO TOOL DESCRIPTION QUAN TRỌNG?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao nói "ALWAYS use this tool"?
  └→ "Shell tool can ALSO read files with 'cat'.
     We want agent to prefer THIS one."

  WHY ②: Tại sao description must match behavior?
  └→ "If you say it creates files but it doesn't,
     the LLM will panic, get stuck in a loop,
     or just GIVE UP."

  WHY ③: Tại sao return character count?
  └→ "Tells the LLM ALL content was written,
     not partial. Super helpful."

  WHY ④: Tại sao hint at next action?
  └→ "Creating a little bit of DETERMINISM.
     Strongly suggesting what to do next."

  WHY ⑤: Tại sao check ENOENT specifically?
  └→ "Very common error. Help LLM better
     understand that the FILE doesn't exist
     vs other types of errors."
```

### 11.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TOOL DESCRIPTION:
═══════════════════════════════════════════════════════════════

  Description = WHAT it does + WHEN to use it!

  "Read the full contents" = WHAT!
  "Use this always to read a file" = WHEN!

  These two pieces of information let
  the LLM make the RIGHT DECISION.
```

### 11.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Error handling   │ Generic       │ Specific          │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Code             │ ✅ Simple!    │ ⚠️ More code!     │
  │ LLM understanding│ ⚠️ Guesses   │ ✅ Knows exactly! │
  │ Recovery         │ ⚠️ Random!   │ ✅ Guided!        │
  │ Maintenance      │ ✅ Easy!      │ ⚠️ More work!     │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Return message   │ "success"     │ "Wrote X to Y"    │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Tokens           │ ✅ 1 token!   │ ⚠️ 10+ tokens!    │
  │ LLM confidence   │ ❌ Uncertain! │ ✅ Confirmed!     │
  │ Debugging        │ ❌ Blind!     │ ✅ Clear!         │
  └──────────────────┴───────────────┴───────────────────┘
```

### 11.4 Pattern ④: Mental Mapping

```
MENTAL MAP — readFile FLOW:
═══════════════════════════════════════════════════════════════

  LLM sees description
       │ "Read the full contents... Use this ALWAYS!"
       ▼
  LLM generates tool call
       │ { name: "readFile", args: { path: "src/index.js" } }
       ▼
  Zod validates schema
       │ path: string ✅
       ▼
  execute({ path })
       │
       ├── TRY: fs.readFile(path, "utf-8")
       │   └── SUCCESS → return content!
       │
       └── CATCH: error
           ├── ENOENT → "File not found. Try listFiles."
           └── OTHER → "Error: ${error.message}"
       │
       ▼
  Result pushed to messages array → LLM sees it!
```

### 11.5 Pattern ⑤: Reverse Engineering — node: Prefix

```
REVERSE ENGINEERING — node: PREFIX:
═══════════════════════════════════════════════════════════════

  import fs from "node:fs/promises";
  import nodePath from "node:path";
                    ↑
  ┌──────────────────────────────────────────────────┐
  │ "This is a 100% GUARANTEED for sure way that     │
  │  we're importing from Node and not some          │
  │  coincidentally named npm module."              │
  │                                                  │
  │ "If somebody made an npm package called 'fs',    │
  │  they're being MALICIOUS. 100%. Don't install." │
  │                                                  │
  │ node: prefix → ALWAYS Node built-in!           │
  │ no prefix → could be npm package!              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 11.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — Tool Description Evolution:
═══════════════════════════════════════════════════════════════

  Simple: "Reads a file"
  │ → LLM: "OK... when should I use it?"
  ↓
  Descriptive: "Read the full contents of a file"
  │ → LLM: "I know what it does but WHEN?"
  ↓
  Actionable: "Read file. Use this ALWAYS to read."
  │ → LLM: "I KNOW to pick this one!" ✅
  ↓
  Competitive: "ALWAYS pick this over other tools!"
  │ → MCP wars! "That's why MCP is SCARY."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 22:
═══════════════════════════════════════════════════════════════

  TOOL DESIGN:
  [ ] Description = WHAT + WHEN!
  [ ] "node:" prefix for built-in modules!
  [ ] Toolset = group related tools!

  readFile:
  [ ] "Use this ALWAYS" in description!
  [ ] Handle ENOENT with helpful message!
  [ ] Hint at next action (try listFiles!)

  writeFile:
  [ ] Description MUST match behavior!
  [ ] recursive: true for mkdir!
  [ ] Return character count ("not partial!")
  [ ] Optionally hint: "verify by listing files"

  MCP:
  [ ] Description wars — vendors want THEIR tool picked!
  [ ] "That's why MCP might NOT be the future!"

  TIẾP THEO → Phần 23: List & Delete!
```
