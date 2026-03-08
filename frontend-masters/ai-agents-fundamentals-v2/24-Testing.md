# AI Agents Fundamentals, v2 — Phần 24: Testing File Tools — "AGI CLI In Action!"

> 📅 2026-03-07 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Testing — "Build, Install Globally, Run In A Safe Directory, Test Tools Live!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — Build, test, debug, safety!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Build & Install — "Get The AGI Command Globally!"            |
| 2   | Safe Directory — "Don't Mess Up Your Code Directory!"        |
| 3   | Environment Variables — "Different Branch = Different Name!" |
| 4   | Live Testing — "Show Me The Directory Structure!"            |
| 5   | Tool Call Visibility — "Yellow = Tool Being Executed!"       |
| 6   | Context Window & Training Cutoff                             |
| 7   | Tự Implement: CLI Agent Test Workflow                        |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu           |

---

## §1. Build & Install — "Get The AGI Command Globally!"

> Scott: _"Build this, see if I get TypeScript errors. Install globally so I get the AGI command."_

```
BUILD & INSTALL WORKFLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ $ npm run build                                  │
  │ → TypeScript compilation!                      │
  │ → "Got errors because I forgot .ts extension." │
  │                                                  │
  │ Common fixes:                                    │
  │ → Add .ts to imports!                          │
  │ → Fix export keywords!                         │
  │ → Check tool registration!                     │
  │                                                  │
  │ $ npm install -g .                               │
  │ → Install CLI globally!                        │
  │ → Now 'agi' command works anywhere!            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Safe Directory — "Don't Mess Up Your Code Directory!"

> Scott: _"Since we're messing with files, you probably don't want to do that in the directory where your code is. That's why I made it a CLI."_

```
SAFE TESTING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "You probably don't want to mess with files      │
  │  in the directory where YOUR CODE is."          │
  │                                                  │
  │ "That's why I made it a CLI — you can POINT     │
  │  it to any directory."                           │
  │                                                  │
  │ $ mkdir fun-env                                  │
  │ $ cd fun-env                                     │
  │ $ agi                                            │
  │                                                  │
  │ → Now testing in SAFE sandbox directory!        │
  │ → "You might mess that up. Just to be safe."   │
  │ → "You can just change it with Git, but..."    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Environment Variables — "Different Branch = Different Name!"

> Scott: _"On this branch I must have called it a different name in my .env file."_

```
ENV DEBUGGING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ERROR: "Laminar object with project"            │
  │                                                  │
  │ CAUSE 1: Wrong env variable name!               │
  │ → Different branch = different naming!          │
  │ → Check .env matches code expectations!        │
  │                                                  │
  │ CAUSE 2: CLI runs outside project directory!    │
  │ → .env file not found!                         │
  │ → "I didn't consider that. I didn't think       │
  │    it would matter since I bundled as CLI."     │
  │                                                  │
  │ CAUSE 3: TSX bundling behavior!                  │
  │ → "It's because of how I'm using it with TSX." │
  │ → Environment variables scoped to project!     │
  │                                                  │
  │ → Always verify .env names match across branches!│
  └──────────────────────────────────────────────────┘
```

---

## §4. Live Testing — "Show Me The Directory Structure!"

> Scott: _"Show me the directory structure. It quickly showed the listFile tool being executed in yellow. That totally works."_

```
LIVE TESTING SESSION:
═══════════════════════════════════════════════════════════════

  USER: "What tools or what can you help me with?"
  ┌──────────────────────────────────────────────────┐
  │ AGENT: "I can help with:                         │
  │ • Programming, creative work, translation       │
  │ • List files and folders                         │
  │ • Read file contents                             │
  │ • Write/overwrite files                          │
  │ • My knowledge is up to June 2024" ← cutoff!  │
  │                                                  │
  │ "They JUST released this model, this year. The  │
  │  cutoff was last SUMMER. Think about how much   │
  │  SAFETY goes into it after. And they're still   │
  │  NOT THAT SAFE."                                │
  └──────────────────────────────────────────────────┘

  USER: "Show me the directory structure"
  ┌──────────────────────────────────────────────────┐
  │ 🟡 [listFiles tool executing...]                │
  │                                                  │
  │ AGENT: "Here's the directory structure at the    │
  │ current path:                                    │
  │ [DIR] src                                        │
  │ [FILE] tsconfig.json                             │
  │ [FILE] package.json"                             │
  │                                                  │
  │ → "It quickly showed the listFile tool in       │
  │    YELLOW. That TOTALLY works!"                 │
  └──────────────────────────────────────────────────┘

  USER: "Show me the contents of tsconfig.json"
  ┌──────────────────────────────────────────────────┐
  │ 🟡 [listFiles tool executing...]                │
  │ 🟡 [readFile tool executing...]                 │
  │                                                  │
  │ AGENT shows tsconfig contents!                   │
  │ → "It listed files FIRST, then read the file."  │
  │ → "Cool, it works!" ✅                         │
  └──────────────────────────────────────────────────┘
```

---

## §5. Tool Call Visibility — "Yellow = Tool Being Executed!"

> Scott: _"If you saw it, it quickly showed the listFile tool being executed in yellow."_

```
UI INDICATOR DESIGN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Normal text: White/default color!               │
  │ Tool execution: 🟡 YELLOW! (in-progress!)      │
  │ Tool result: Hidden from user, sent to LLM!    │
  │ Final response: Normal text output!             │
  │                                                  │
  │ "I do have a blinking UI bug, so if you're      │
  │  seeing that, that's where it came from."       │
  │                                                  │
  │ → Users see WHICH tool is running!             │
  │ → Transparency builds trust!                   │
  │ → "Yellow = thinking, doing work!"             │
  └──────────────────────────────────────────────────┘
```

---

## §6. Context Window & Training Cutoff

> Scott: _"Knowledge up to June 2024. They JUST released this model this year. Think about how much SAFETY goes into it after training."_

```
TRAINING REALITY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Model released: 2025 (this year!)               │
  │ Training cutoff: June 2024 (last summer!)       │
  │ Gap: ~6-12 months of safety work!               │
  │                                                  │
  │ "Think about how much SAFETY goes into it       │
  │  AFTER training. And they're STILL not that     │
  │  safe."                                          │
  │                                                  │
  │ This is exactly WHY we need:                     │
  │ → Web search tools (real-time info!)           │
  │ → File system tools (current code!)            │
  │ → "Grounding" in up-to-date truth!             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: CLI Agent Test Workflow

```javascript
// COMPLETE TEST WORKFLOW — From build to test!

// ═══════════════════════════════════
// Step 1: Build verification
// ═══════════════════════════════════

async function verifyBuild() {
  console.log("🔨 Building project...");

  // Check all tool imports have .ts extensions
  // Check all exports are correct
  // Check tool registration in index.ts

  const toolsIndex = await readFile("src/tools/index.ts");
  const requiredTools = ["readFile", "writeFile", "listFiles", "deleteFile"];

  for (const tool of requiredTools) {
    if (!toolsIndex.includes(tool)) {
      console.error(`❌ Missing tool: ${tool}`);
      return false;
    }
  }

  console.log("✅ All tools registered!");
  return true;
}

// ═══════════════════════════════════
// Step 2: Safe directory setup
// ═══════════════════════════════════

function createSafeTestDir() {
  const testDir = "/tmp/agent-test-sandbox";
  // Create isolated test environment!

  // Add some test files for the agent to find:
  const testFiles = {
    "package.json": '{"name":"test-project","version":"1.0"}',
    "README.md": "# Test Project\nThis is a test.",
    "src/index.js": 'console.log("hello");',
    "src/utils.js": "module.exports = {};",
  };

  return { testDir, testFiles };
}

// ═══════════════════════════════════
// Step 3: Integration test scenarios
// ═══════════════════════════════════

const testScenarios = [
  {
    name: "List directory",
    userMessage: "Show me the files in the current directory",
    expectedToolCalls: ["listFiles"],
    expectedInResponse: ["package.json", "README.md"],
  },
  {
    name: "Read file",
    userMessage: "Show me the contents of package.json",
    expectedToolCalls: ["readFile"],
    expectedInResponse: ["test-project"],
  },
  {
    name: "Write and verify",
    userMessage: "Create a file called hello.txt with 'Hello World'",
    expectedToolCalls: ["writeFile"],
    expectedInResponse: ["Successfully wrote"],
  },
  {
    name: "Multi-step: list then read",
    userMessage: "What files are in src/ and show me index.js",
    expectedToolCalls: ["listFiles", "readFile"],
    expectedInResponse: ["index.js", "hello"],
  },
];
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO TEST TRONG SAFE DIRECTORY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không test trong project dir?
  └→ "You might MESS UP your code directory!
     Agent can writeFile and deleteFile!"

  WHY ②: Tại sao làm CLI thay vì script?
  └→ "You can POINT it to ANY directory.
     That's why I made it a CLI."

  WHY ③: Tại sao env vars broken khi cd?
  └→ "TSX bundling scopes env to project dir.
     Running outside = can't find .env!"

  WHY ④: Tại sao agent listed files THEN read?
  └→ "It's smart enough to explore first,
     THEN read the specific file!"

  WHY ⑤: Tại sao training cutoff 6 months?
  └→ "So much SAFETY work after training.
     And they're STILL not that safe."
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TESTING AGENTS:
═══════════════════════════════════════════════════════════════

  Test = Run in isolation + Observe behavior!

  1. ISOLATION: separate test directory!
  2. OBSERVATION: tool call indicators (yellow!)
  3. VERIFICATION: does output match expectation?

  "The same as testing any software, but the
   output is NON-DETERMINISTIC."
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Test approach    │ Same dir      │ Safe sandbox      │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Risk             │ ❌ Dangerous! │ ✅ Safe!          │
  │ Convenience      │ ✅ Easy!      │ ⚠️ Extra step!    │
  │ Recovery         │ ❌ Git reset! │ ✅ Just delete!   │
  │ Realistic        │ ✅ Real env!  │ ⚠️ Isolated!      │
  └──────────────────┴───────────────┴───────────────────┘
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — BUILD → TEST:
═══════════════════════════════════════════════════════════════

  Code changes (tools/file.ts)
       │
       ├── npm run build → TypeScript → JS!
       │   └── Fix errors (.ts ext, exports!)
       │
       ├── npm install -g . → CLI available!
       │
       ├── mkdir safe-dir → cd safe-dir
       │
       └── agi → Interactive testing!
           ├── "What can you help with?" → capabilities!
           ├── "Show directory" → listFiles (yellow!)
           ├── "Read tsconfig" → listFiles + readFile!
           └── Multi-step tool chaining works! ✅
```

### 8.5 Pattern ⑤: Reverse Engineering — Debug Methodology

```
REVERSE ENGINEERING — DEBUGGING:
═══════════════════════════════════════════════════════════════

  ERROR: "Laminar object with project"
  ┌──────────────────────────────────────────────────┐
  │ Debug process:                                   │
  │ 1. Check env variable name → wrong name!       │
  │ 2. Check .env file location → outside project! │
  │ 3. Check bundling → TSX scopes to project!     │
  │                                                  │
  │ ROOT CAUSE: Both wrong name AND wrong directory! │
  │ "Yeah, it was a wrong name, but ALSO the CLI    │
  │  was running outside the project dir."          │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — Agent Testing Evolution:
═══════════════════════════════════════════════════════════════

  Manual testing: "Does it work? 🤷"
  │
  ↓ EDD: Eval mock tools first!
  │ → Baseline before implementation!
  ↓
  ↓ Integration testing: Run real tools!
  │ → Safe directory! Observe behavior!
  ↓
  ↓ Dashboard monitoring: Laminar!
  │ → Scores over time! Regression detection!
  ↓
  ↓ Live user feedback: Thumbs up/down!
  │ → Golden data set! Continuous improvement!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 24:
═══════════════════════════════════════════════════════════════

  BUILD:
  [ ] Fix TypeScript errors (.ts extensions!)
  [ ] Verify tool exports and registration!
  [ ] npm install -g . for global CLI!

  TESTING:
  [ ] ALWAYS test in safe/sandbox directory!
  [ ] Watch for yellow tool call indicators!
  [ ] Test multi-step tool chaining!
  [ ] Observe agent behavior, not just output!

  DEBUGGING:
  [ ] Check env variable NAMES across branches!
  [ ] Check .env file LOCATION for CLI!
  [ ] TSX bundles scope env to project dir!

  SAFETY:
  [ ] Training cutoff ≠ release date!
  [ ] 6-12 months of safety work after training!
  [ ] "STILL not that safe!"

  TIẾP THEO → Phần 25: Web Search for Agents!
```
