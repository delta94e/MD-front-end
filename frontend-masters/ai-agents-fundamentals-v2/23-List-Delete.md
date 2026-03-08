# AI Agents Fundamentals, v2 — Phần 23: List & Delete — "Return Language, Not JSON!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: List & Delete — "Format For Intelligence, Not Code! Strict Mode, Defaults, Toolsets!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — listFiles, deleteFile, tool registration, strict mode!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | listFiles — "Default Directory = Don't Ask, Just Do!"  |
| 2   | Strict Mode & Optionals — "Union With Null!"           |
| 3   | Format For Intelligence — "Return Language, Not JSON!" |
| 4   | Token Efficiency — "Think About All Those Brackets!"   |
| 5   | deleteFile — "Use With Caution. Very Destructive!"     |
| 6   | fs.unlink — "Safer Than Delete, Handles Symlinks!"     |
| 7   | Tool Registration — "Toolsets = Import All At Once!"   |
| 8   | EDD — "Eval Driven Development! Like TDD!"             |
| 9   | User Intervention — "Do It At The Loop, Not The Tool!" |
| 10  | Tự Implement: listFiles & deleteFile From Scratch      |
| 11  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu     |

---

## §1. listFiles — "Default Directory = Don't Ask, Just Do!"

> Scott: _"If the user asked to list a directory but didn't tell you WHICH directory, the default will take over. It's letting the agent know you DON'T NEED to ask."_

```javascript
// listFiles — With smart defaults!

export const listFiles = tool({
  description:
    "List all the files and directories " + "in the specified directory path.",
  // "Specifically, give me a DIRECTORY path,
  //  not a file path."

  parameters: z.object({
    directory: z
      .string()
      .describe("The directory path to list the contents of")
      .default("."),
    // ↑ DEFAULT to current directory!
    // "If user didn't tell you a directory,
    //  you DON'T HAVE TO ASK for follow up.
    //  The default will take over."
  }),

  execute: async ({ directory }) => {
    try {
      const entries = await fs.readdir(directory, {
        withFileTypes: true,
        // "I want to see file types!
        //  Imagine index.py and index.js —
        //  without types, SO confusing!"
      });

      const items = entries.map((entry) => {
        const type = entry.isDirectory()
          ? "[DIR]" // ← Hint: it's a directory!
          : "[FILE]"; // ← Hint: it's a file!
        return `${type} ${entry.name}`;
      });

      return items.length > 0
        ? items.join("\n")
        : `Directory ${directory} is empty.`;
      // "Just giving hints."
    } catch (error) {
      return (
        `Could not list the contents in this directory. ` +
        `Here is the Node.js error: ${error}`
      );
    }
  },
});
```

---

## §2. Strict Mode & Optionals — "Union With Null!"

> Scott: _"By default strict mode is ON. It ALWAYS has to fulfill the schema. To make something optional: union type with null."_

```javascript
// STRICT MODE (default in AI SDK!)

// All fields = REQUIRED! LLM must always pass a value!
// No extra properties allowed either!

// TO MAKE OPTIONAL:
parameters: z.object({
  directory: z
    .union([z.string(), z.literal(null)])
    .describe("Optional directory path, null = current dir"),
});

// LLM can now pass:
// { directory: "/src" }  ← has a value!
// { directory: null }    ← explicitly optional!
```

```
STRICT MODE EXPLAINED:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ STRICT MODE ON (default!):                       │
  │ → LLM MUST fill ALL fields!                    │
  │ → NO extra properties allowed!                 │
  │ → "Won't pass in additional properties          │
  │    that you didn't even ask for."               │
  │                                                  │
  │ STRICT MODE OFF:                                 │
  │ → LLM fills your schema...                     │
  │ → AND might pass EXTRA properties!             │
  │ → "How would you know they were there?          │
  │    How would you USE them?"                     │
  │ → "You probably DON'T want that."              │
  │                                                  │
  │ TO MAKE OPTIONAL:                                │
  │ → z.union([z.string(), z.literal(null)])       │
  │ → "LLM can pass null if optional."             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Format For Intelligence — "Return Language, Not JSON!"

> Scott: _"The LLM needs LANGUAGE. Returning structured data is not that helpful. Returning language, it UNDERSTANDS language."_

```javascript
// RETURN FORMATTING — For intelligence, not code!

// ❌ BAD: Return raw data!
execute: async ({ directory }) => {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });
  return entries; // Raw objects! LLM can't parse well!
};

// ✅ GOOD: Return formatted language!
execute: async ({ directory }) => {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const items = entries.map((entry) => {
    const type = entry.isDirectory() ? "[DIR]" : "[FILE]";
    return `${type} ${entry.name}`;
  });

  return items.join("\n");
  // "[DIR] src
  //  [DIR] node_modules
  //  [FILE] package.json
  //  [FILE] index.js"
};
```

```
WHY LANGUAGE > JSON:
═══════════════════════════════════════════════════════════════

  JSON RETURN (100 files):
  ┌──────────────────────────────────────────────────┐
  │ [{"name":"src","type":"directory"},              │
  │  {"name":"index.js","type":"file"},              │
  │  {"name":"package.json","type":"file"},          │
  │  ... 97 more entries ...]                        │
  │                                                  │
  │ "Think about all the BRACKETS and COLONS!        │
  │  For WHAT? We can just format this beautifully." │
  │                                                  │
  │ → Wasted tokens on syntax characters!          │
  │ → Harder for LLM to parse!                    │
  │ → More expensive!                              │
  └──────────────────────────────────────────────────┘

  LANGUAGE RETURN (same 100 files):
  ┌──────────────────────────────────────────────────┐
  │ [DIR] src                                        │
  │ [DIR] node_modules                               │
  │ [FILE] index.js                                  │
  │ [FILE] package.json                              │
  │ ... 96 more entries                              │
  │                                                  │
  │ "SO much better. Easy language, easier to see."  │
  │ → Fewer tokens!                                │
  │ → LLM understands immediately!                 │
  │ → Cheaper and faster!                          │
  └──────────────────────────────────────────────────┘

  "If results were for ANOTHER FUNCTION, we'd return
   entries and be done — structured data. But the LLM
   needs LANGUAGE. We have to return language."
```

---

## §4. Token Efficiency — "Think About All Those Brackets!"

> Scott: _"What if you had 100 files and 100 folders with hundreds of files? Just return that as JSON? Think about all the brackets and colons that are gonna be in there."_

```
TOKEN COMPARISON:
═══════════════════════════════════════════════════════════════

  JSON: {"name":"index.js","type":"file"}
  → ~10 tokens per entry!
  → 100 entries = ~1000 tokens!

  Language: [FILE] index.js
  → ~3 tokens per entry!
  → 100 entries = ~300 tokens!

  SAVINGS: ~70% fewer tokens! 💰
  → Cheaper! Faster! More room in context window!
```

---

## §5. deleteFile — "Use With Caution. Very Destructive!"

> Scott: _"The most scary one. Use with caution. Very destructive and cannot be recovered from."_

```javascript
// deleteFile — The scary one!

export const deleteFile = tool({
  description:
    "Delete a file at a given path. " +
    "Use with caution as this is very destructive " +
    "and cannot be recovered from.",
  // "It already KIND OF knows this, the best
  //  ones do, but yeah, tell it anyway."

  parameters: z.object({
    path: z.string().describe("The path to the file you want to delete"),
  }),

  execute: async ({ path }) => {
    try {
      await fs.unlink(path);
      return `Successfully deleted the file at ${path}`;
    } catch (error) {
      return (
        `Could not delete that file. ` + `Here is the Node.js error: ${error}`
      );
    }
  },
});
```

---

## §6. fs.unlink — "Safer Than Delete, Handles Symlinks!"

> Scott: _"unlink is safer because some paths are virtual — symbolic links. The traditional delete wouldn't account for that."_

```
fs.unlink vs fs.rm:
═══════════════════════════════════════════════════════════════

  fs.unlink(path):
  ┌──────────────────────────────────────────────────┐
  │ If path = symbolic link:                         │
  │ → Removes the LINK, not the target!            │
  │ → No floating symlinks! No memory leaks!       │
  │                                                  │
  │ If path = real file:                             │
  │ → Deletes the file normally!                   │
  │                                                  │
  │ "It's just a SAFER delete. Handles both cases." │
  └──────────────────────────────────────────────────┘

  fs.rm(path):
  ┌──────────────────────────────────────────────────┐
  │ → More aggressive! Can delete directories!     │
  │ → Doesn't handle symlinks as gracefully!       │
  │ → "The traditional delete method wouldn't       │
  │    account for symlinks."                        │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tool Registration — "Toolsets = Import All At Once!"

> Scott: _"Sometimes it's helpful to group these into their own toolset. Just bring over all the file stuff as one pack."_

```javascript
// tools/index.ts — Registration!

// Individual exports!
export { readFile, writeFile, listFiles, deleteFile } from "./file";

// Grouped toolset!
export { fileTools } from "./file";
// → import { fileTools } from "./tools";
// → Brings ALL file tools at once!

// In tools/file.ts:
export const fileTools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};
```

```
TOOLSET PATTERN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ INDIVIDUAL:                                      │
  │ import { readFile, writeFile } from "./tools";  │
  │ → Pick exactly what you need!                  │
  │                                                  │
  │ TOOLSET:                                         │
  │ import { fileTools } from "./tools";            │
  │ → All file tools at once!                      │
  │ → "Just bring over all the file stuff as        │
  │    ONE pack versus installing all the tools."   │
  │                                                  │
  │ USAGE in agent:                                  │
  │ const tools = {                                  │
  │   ...fileTools,  // All file tools!             │
  │   ...shellTools, // All shell tools!            │
  │   dateTime,      // Individual tool!            │
  │ };                                               │
  └──────────────────────────────────────────────────┘
```

---

## §8. EDD — "Eval Driven Development! Like TDD!"

> Scott: _"We MOCKED them out first. They didn't do anything. I like to make the evals FIRST to get a baseline, then make the tools."_

```
EDD — EVAL DRIVEN DEVELOPMENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Student: "It seemed like we've been through all  │
  │ this like list files — we did, we made MOCKS."  │
  │                                                  │
  │ Scott: "Yeah, of course! We mocked them out.     │
  │ They didn't do anything yet because I like to    │
  │ make the evals for things that we WILL DO        │
  │ to get a baseline."                              │
  │                                                  │
  │ "And then I make the tools, so I know WHERE      │
  │ TO START because I already had an eval."         │
  │                                                  │
  │ Student: "It's like TDD."                        │
  │ Scott: "Yeah, EDD. Eval Driven Development!"    │
  │                                                  │
  │ ORDER:                                           │
  │ ① Write evals with MOCK tools!                  │
  │ ② Get a baseline score!                         │
  │ ③ Implement REAL tools!                         │
  │ ④ Run evals again — score should improve!      │
  │ ⑤ Iterate on prompts, tools, architecture!      │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. User Intervention — "Do It At The Loop, Not The Tool!"

> Scott: _"You SHOULD do it at the control plane — the loop. I think you want to do it at the loop."_

```
USER INTERVENTION — WHERE TO PUT IT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Q: "Would you build user intervention at the     │
  │  TOOL level or between steps?"                   │
  │                                                  │
  │ A: "You should do it at the CONTROL PLANE,       │
  │  which is the LOOP."                             │
  │                                                  │
  │ WHY NOT TOOL LEVEL:                              │
  │ → Would have to pass UI stuff DOWN to tool!    │
  │ → Tool needs context object (user ID, DB, etc.)│
  │ → "Our architecture is not set up that way."   │
  │                                                  │
  │ ADVANCED TOOL CONTEXT:                           │
  │ → execute(args, context)                       │
  │ → context.userId, context.db, context.pushUI   │
  │ → "What if one tool does a lot of async things  │
  │    and you want to show the UI 'searching...    │
  │    found 63 results'? Pass pushUI in context." │
  │ → "But that depends on architecture."          │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §10. Tự Implement: listFiles & deleteFile From Scratch

```javascript
// COMPLETE LIST & DELETE — No libraries!

import { readdir, unlink } from "node:fs/promises";

// ═══════════════════════════════════
// listFiles Tool
// ═══════════════════════════════════

const listFilesTool = {
  name: "listFiles",
  description:
    "List all the files and directories " + "in the specified directory path.",
  parameters: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description:
          "The directory path to list. " + "Defaults to current directory.",
        default: ".",
      },
    },
    required: ["directory"],
  },
  execute: async ({ directory }) => {
    try {
      const entries = await readdir(directory || ".", {
        withFileTypes: true,
      });

      if (entries.length === 0) {
        return `Directory '${directory}' is empty.`;
      }

      const lines = entries.map((entry) => {
        const type = entry.isDirectory() ? "[DIR]" : "[FILE]";
        return `${type} ${entry.name}`;
      });

      return lines.join("\n");
      // "[DIR] src\n[FILE] index.js\n[FILE] package.json"
      // NOT JSON! Language for the LLM!
    } catch (error) {
      if (error.code === "ENOENT") {
        return (
          `Directory '${directory}' does not exist. ` + `Try a different path.`
        );
      }
      if (error.code === "ENOTDIR") {
        return (
          `'${directory}' is a file, not a directory. ` +
          `Use readFile instead.`
        );
      }
      return `Could not list directory: ${error.message}`;
    }
  },
};

// ═══════════════════════════════════
// deleteFile Tool
// ═══════════════════════════════════

const deleteFileTool = {
  name: "deleteFile",
  description:
    "Delete a file at a given path. " +
    "Use with caution as this is very destructive " +
    "and cannot be recovered from.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to delete",
      },
    },
    required: ["path"],
  },
  execute: async ({ path }) => {
    try {
      await unlink(path);
      // unlink = safer! Handles symlinks properly!
      return `Successfully deleted the file at ${path}`;
    } catch (error) {
      if (error.code === "ENOENT") {
        return `File '${path}' does not exist. Nothing to delete.`;
      }
      if (error.code === "EISDIR") {
        return (
          `'${path}' is a directory, not a file. ` +
          `This tool only deletes files.`
        );
      }
      return `Could not delete file: ${error.message}`;
    }
  },
};

// ═══════════════════════════════════
// Toolset Pattern
// ═══════════════════════════════════

const fileTools = {
  readFile: readFileTool,
  writeFile: writeFileTool,
  listFiles: listFilesTool,
  deleteFile: deleteFileTool,
};
```

---

## §11. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 11.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO FORMAT LANGUAGE CHO LLM?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao return string thay vì JSON?
  └→ "The LLM needs LANGUAGE. It UNDERSTANDS language.
     Returning structured data is not helpful."

  WHY ②: Tại sao thêm [DIR] và [FILE] prefix?
  └→ "Giving hints. Imagine index.py and index.js
     without file types — very confusing!"

  WHY ③: Tại sao join("\n") thay vì return array?
  └→ "We're not returning an array. Put them on
     ONE string with new lines between."

  WHY ④: Tại sao dùng default "." cho directory?
  └→ "Let the agent know: if user didn't specify,
     you DON'T HAVE TO ASK, the default takes over."

  WHY ⑤: Tại sao unlink thay vì rm?
  └→ "Safer! Handles symbolic links. The traditional
     delete wouldn't account for virtual paths."
```

### 11.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════

  Consumer = Intelligence → Return = Language!
  Consumer = Code        → Return = Data!

  "Just returning some structured data is NOT helpful.
   The LLM UNDERSTANDS language."
```

### 11.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Return format    │ JSON          │ Language          │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Token cost       │ ❌ Expensive! │ ✅ Cheap!         │
  │ LLM parsing      │ ⚠️ Possible   │ ✅ Natural!       │
  │ Code processing  │ ✅ Easy!      │ ❌ Harder!        │
  │ Readability      │ ⚠️ Verbose    │ ✅ Clean!         │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Intervention     │ Tool level    │ Loop level        │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Architecture     │ ❌ Complex!   │ ✅ Clean!         │
  │ UI access        │ ❌ Pass down! │ ✅ Already there! │
  │ Flexibility      │ ⚠️ Per-tool   │ ✅ Global!        │
  │ Reusability      │ ❌ Coupled!   │ ✅ Decoupled!     │
  └──────────────────┴───────────────┴───────────────────┘
```

### 11.4 Pattern ④: Mental Mapping

```
MENTAL MAP — TOOL REGISTRATION:
═══════════════════════════════════════════════════════════════

  tools/file.ts
       │
       ├── readFile (tool!)
       ├── writeFile (tool!)
       ├── listFiles (tool!)
       ├── deleteFile (tool!)
       └── fileTools = { readFile, writeFile, ... }
       │
       ▼
  tools/index.ts
       │
       ├── export individuals! (cherry-pick!)
       └── export fileTools! (all at once!)
       │
       ▼
  run.ts imports tools object → agent uses them!
```

### 11.5 Pattern ⑤: Reverse Engineering — EDD Workflow

```
REVERSE ENGINEERING — EDD:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "We MOCKED them out first."                      │
  │ "They didn't do anything yet."                   │
  │ "I make evals FIRST to get a baseline."         │
  │ "Then I make the tools, so I know WHERE          │
  │  TO START."                                      │
  │ "Yeah, EDD. Eval Driven Development!"           │
  │                                                  │
  │ TDD:  test → code → pass!                     │
  │ EDD:  eval → mock → baseline → real → pass!  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 11.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — Tool Return Format Evolution:
═══════════════════════════════════════════════════════════════

  Raw data: return entries;
  │ → "LLM gets confusing objects."
  ↓
  JSON string: return JSON.stringify(entries);
  │ → "All those brackets and colons!"
  ↓
  Formatted language: return "[DIR] src\n[FILE] index.js";
  │ → "SO much better. Easy language."
  │ → "LLM understands language!" ✅
  ↓
  Guided returns: "Wrote X chars. Verify by listing files."
  │ → "Semi-workflow. Creating determinism."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 23:
═══════════════════════════════════════════════════════════════

  listFiles:
  [ ] Default to "." — agent doesn't need to ask!
  [ ] withFileTypes: true for type information!
  [ ] Format: "[DIR] name" and "[FILE] name"!
  [ ] join("\n") — one string, not array!

  deleteFile:
  [ ] Description says "destructive, CANNOT recover!"
  [ ] Use unlink, not rm — safer with symlinks!

  FORMAT:
  [ ] Return LANGUAGE, not JSON!
  [ ] "Think about all the brackets for 100 files!"
  [ ] ~70% fewer tokens with formatted strings!

  PATTERNS:
  [ ] Strict mode = ALL fields required by default!
  [ ] Optional = z.union([type, z.literal(null)])!
  [ ] Toolsets = group and export together!
  [ ] EDD = Eval Driven Development!
  [ ] User intervention = do at LOOP level!

  TIẾP THEO → Phần 24: Testing File Tools!
```
