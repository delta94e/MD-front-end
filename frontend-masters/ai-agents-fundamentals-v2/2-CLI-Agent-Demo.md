# AI Agents Fundamentals, v2 — Phần 2: CLI Agent Demo — "AGI" In Your Terminal!

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: CLI Agent Demo — Course Setup, AGI CLI, Approval Mechanisms!
> Độ khó: ⭐️⭐️ | Tour + Setup + Demo

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Course Format — "Build Up To Something, Lessons 1–9!"      |
| 2   | The Agent We'll Build — "AGI" CLI!                         |
| 3   | AGI Demo — NBA MVP + Write File!                           |
| 4   | Approval Mechanisms — "Quite Terrifying, But Don't Worry!" |
| 5   | Repo Setup — Clone, Checkout, .env!                        |
| 6   | Repo Tour — Source, Agent, Evals!                          |
| 7   | Tự Implement: CLI Agent Concept                            |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu         |

---

## §1. Course Format — "Build Up To Something, Lessons 1–9!"

> Scott: _"We're going to learn how to build agents from scratch, NO FRAMEWORK. Everything from scratch — from the tool loop to the tools, the decision framework, and even how to improve it."_

```
COURSE STRUCTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ FORMAT:                                          │
  │ → Lessons 1–9, each builds on previous!         │
  │ → Each lesson has its own BRANCH in the repo!   │
  │ → Each branch has SOLUTION for previous lesson! │
  │ → Code also in lesson notes (copy if needed!)   │
  │                                                  │
  │ APPROACH:                                        │
  │ "We're going to be working on a PERSONAL agent, │
  │ kind of like an EVERYTHING agent. Not some       │
  │ vertical agent that does one thing — it kind     │
  │ of does EVERYTHING."                             │
  │                                                  │
  │ LIKE WHAT?                                       │
  │ "If you're familiar with Cursor or Claude Code,  │
  │ but WITHOUT the coding abilities — that's what   │
  │ this is going to be."                            │
  │                                                  │
  │ FROM SCRATCH:                                    │
  │ → Tool loop → from scratch!                    │
  │ → Tools → from scratch!                        │
  │ → Decision framework → from scratch!            │
  │ → Improvements → from scratch!                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. The Agent We'll Build — "AGI" CLI!

> Scott: _"AGI stands for Artificial General Intelligence. It's the thing every AI company is racing for. So AGI is just a bubble term that we use as a JOKE."_

```
THE "AGI" AGENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ NAME: AGI (Artificial General Intelligence)     │
  │       → "Just a joke name!" 😄                 │
  │                                                  │
  │ TYPE: CLI Agent (lives in your terminal!)        │
  │                                                  │
  │ CAPABILITIES:                                    │
  │ ┌────────────────────────────────────────────┐   │
  │ │ 🌐 API Calls — search the web!            │   │
  │ │ 📁 File System — read/write files!        │   │
  │ │ 💻 Terminal — run commands!                │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  │ vs BROWSER AGENT (demo from Part 1):             │
  │ ┌────────────────────────────────────────────┐   │
  │ │ Browser agent: navigate, click, type       │   │
  │ │ → "Looks impressive but will NEVER be      │   │
  │ │   useful in its current state."            │   │
  │ │                                            │   │
  │ │ AGI CLI: web search, file system, terminal │   │
  │ │ → "In this course, we learn how to take    │   │
  │ │   that idea and IMPROVE upon it!"          │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. AGI Demo — NBA MVP + Write File!

> Scott: _"I can ask this agent to quickly find the current NBA MVP front runners and put it in a markdown file."_

```
DEMO — NBA MVP SEARCH + FILE WRITE:
═══════════════════════════════════════════════════════════════

  $ agi "find current NBA MVP candidate front runners
         this season and put it in a table in MVP.md"

  EXECUTION:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ 🔄 Step 1: web_search (yellow text + spinner!)  │
  │   → "It's using a tool called web search."      │
  │   → Searches for NBA MVP candidates!            │
  │   → Agent decides HOW MANY searches needed!     │
  │   → "Not up to me — up to the AGENT!"          │
  │                                                  │
  │ 🔄 Step 2: More web_search (if needed!)         │
  │   → "If we needed to search in parallel,        │
  │     we'll see MULTIPLE web searches."            │
  │   → "It'll keep doing that on the LOOP          │
  │     until it's satisfied."                       │
  │                                                  │
  │ ⚠️ Step 3: APPROVAL REQUEST!                    │
  │   → "Asking for approval to call write_file!"   │
  │   → Shows file path: MVP.md                    │
  │   → Shows FULL content it wants to write!       │
  │   → User types "yes" → proceed! ✅             │
  │                                                  │
  │ ✅ Step 4: File written!                        │
  │   → MVP.md created with markdown table!         │
  │   → Nikola Jokić, Shai, Luka, Tyrese Maxey!   │
  │                                                  │
  └──────────────────────────────────────────────────┘

  RESULT — MVP.md:
  ┌──────────────────────────────────────────────────┐
  │ | Player            | Notes              |       │
  │ |-------------------|--------------------|       │
  │ | Nikola Jokić      | Triple-double king |       │
  │ | Shai Gilgeous-A.  | Scoring leader     |       │
  │ | Luka Dončić       | Elite playmaker    |       │
  │ | Tyrese Maxey      | Breakout season!   |       │
  │                                                  │
  │ Scott: "It did a really good job!"               │
  └──────────────────────────────────────────────────┘
```

---

## §4. Approval Mechanisms — "Quite Terrifying, But Don't Worry!"

> Scott: _"It has the ability to run commands in the terminal, which is QUITE TERRIFYING. But don't worry, we're going to learn how to put APPROVAL MECHANISMS in front of some of those commands."_

```
APPROVAL MECHANISMS:
═══════════════════════════════════════════════════════════════

  WHY NEED APPROVALS?
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ DANGEROUS TOOLS:                                 │
  │ → write_file → could overwrite important files!│
  │ → delete_file → could delete your code!        │
  │ → run_command → could run ANYTHING! 😱          │
  │                                                  │
  │ Scott: "Which is quite TERRIFYING."              │
  │                                                  │
  │ SAFE TOOLS:                                      │
  │ → web_search → just reads the internet!        │
  │ → read_file → just reads, doesn't modify!     │
  │ → No approval needed!                          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  HOW IT WORKS:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Agent wants to write_file:                       │
  │                                                  │
  │ ⚠️ "Requesting approval to call: write_file"    │
  │    Path: /Users/you/MVP.md                      │
  │    Content: (shows full content)                │
  │                                                  │
  │    [yes/no]: _                                  │
  │                                                  │
  │ → User reviews → types "yes" → proceeds! ✅   │
  │ → User types "no" → agent skips! ❌            │
  │                                                  │
  │ "We're going to learn how to put approval        │
  │ mechanisms in tools like writing to a file       │
  │ and deleting a file."                            │
  │                                                  │
  └──────────────────────────────────────────────────┘

  TOOL CATEGORIES:
  ┌──────────────────────────────────────────────────┐
  │ 🟢 AUTO-RUN (safe):                              │
  │   web_search, read_file                          │
  │                                                  │
  │ 🟡 NEEDS APPROVAL (dangerous):                   │
  │   write_file, delete_file, run_command           │
  │                                                  │
  │ → This is how you control AGENCY!               │
  │ → Constrain what agent can do autonomously!     │
  └──────────────────────────────────────────────────┘
```

---

## §5. Repo Setup — Clone, Checkout, .env!

> Scott: _"Prerequisites: TypeScript, Node. You'll need an OpenAI API key. Cost-wise, this course will probably cost you LESS THAN A PENNY."_

```
SETUP STEPS:
═══════════════════════════════════════════════════════════════

  ① CLONE THE REPO:
  $ git clone https://github.com/Hendrixer/agents-v2
  $ cd agents-v2

  ② CHECKOUT LESSON 1:
  $ git checkout lesson-1

  ③ CREATE .env FILE:
  $ echo "OPENAI_API_KEY=sk-your-key-here" > .env
  → Already in .gitignore!

  ④ INSTALL DEPENDENCIES:
  $ npm install

  PREREQUISITES:
  ┌──────────────────────────────────────────────────┐
  │ ✅ TypeScript & Node familiarity                 │
  │ ✅ Terminal basics                               │
  │ ⚡ OpenAI API key (requires credit card)         │
  │ 💰 Cost: "Less than a PENNY!" (~$0.01!)         │
  │ 💡 Optional: LLM experience (helpful but not    │
  │    required!)                                    │
  └──────────────────────────────────────────────────┘

  BRANCHES:
  ┌──────────────────────────────────────────────────┐
  │ lesson-1 → Starting point                      │
  │ lesson-2 → Solution for lesson 1               │
  │ lesson-3 → Solution for lesson 2               │
  │ ...                                              │
  │ lesson-9 → Solution for lesson 8               │
  │ done     → Completely finished agent!           │
  └──────────────────────────────────────────────────┘

  Scott: "You could potentially use a different
  model provider, but you'd have to make changes
  on your own. Best to use OpenAI to keep it easy
  and keep the mental overhead LOW."
```

---

## §6. Repo Tour — Source, Agent, Evals!

> Scott: _"There are a lot of things in here that you will NOT be making, specifically the UI stuff. Most things we'll discuss will be in the source/agent folder."_

```
REPO STRUCTURE:
═══════════════════════════════════════════════════════════════

  agents-v2/
  ├── .env                  ← YOUR API key!
  ├── .gitignore
  ├── package.json
  │
  ├── src/
  │   ├── agent/            ← 🎯 MAIN WORK HERE!
  │   │   ├── (agent loop)  ← We'll build this!
  │   │   ├── (tools)       ← We'll build this!
  │   │   └── (utilities)   ← Pre-built helpers!
  │   │
  │   ├── ui/               ← Terminal UI (pre-built!)
  │   │   └── (spinners, colors, prompts)
  │   │
  │   └── utils/            ← Utility functions!
  │       └── (helpers)
  │
  ├── evals/                ← 🎯 We'll work here too!
  │   └── (evaluation tests)
  │
  ├── lessons/              ← Course notes + code!
  │   ├── 01/
  │   ├── 02/
  │   └── ... → 09/
  │
  └── open-spec/            ← Context for AI assistants!
      └── (specs for Cursor/Claude Code)

  WHAT WE'LL BUILD:
  ┌──────────────────────────────────────────────────┐
  │ ✅ Agent loop (core!)                            │
  │ ✅ Tools (web search, file ops, terminal!)       │
  │ ✅ Decision framework!                          │
  │ ✅ Approval mechanisms!                         │
  │ ✅ Evals (testing agents!)                       │
  │ ❌ UI stuff (pre-built!)                        │
  │ ❌ Utilities (pre-built!)                       │
  └──────────────────────────────────────────────────┘

  Scott: "Gone are the days of 2022, 2023 where you
  can get away with grabbing an SDK and giving it a
  prompt and watching it go. I'm going to share all
  the experience from building agents in PRODUCTION
  for startups and at MASSIVE companies."
```

---

## §7. Tự Implement: CLI Agent Concept

```javascript
// CONCEPT: What the AGI CLI agent looks like

// The agent has 3 types of tools:
const tools = {
  // 🟢 AUTO-RUN (safe):
  web_search: {
    name: "web_search",
    description: "Search the web for information",
    requiresApproval: false, // ← safe!
    execute: async (query) => {
      // Search API call
      return searchResults;
    },
  },

  // 🟡 NEEDS APPROVAL (dangerous):
  write_file: {
    name: "write_file",
    description: "Write content to a file",
    requiresApproval: true, // ← dangerous!
    execute: async (path, content) => {
      // Write to filesystem
      await fs.writeFile(path, content);
      return `Wrote to ${path}`;
    },
  },

  // 🟡 NEEDS APPROVAL (dangerous):
  run_command: {
    name: "run_command",
    description: "Run a terminal command",
    requiresApproval: true, // ← TERRIFYING!
    execute: async (command) => {
      // Execute in shell
      const result = await exec(command);
      return result.stdout;
    },
  },
};
```

```javascript
// CONCEPT: Approval mechanism in the agent loop

async function agentLoop(userTask) {
  const messages = [
    { role: "system", content: "You are AGI, a CLI agent..." },
    { role: "user", content: userTask },
  ];

  while (true) {
    const response = await callLLM(messages, tools);

    if (response.type === "final_answer") {
      return response.content;
    }

    if (response.type === "tool_call") {
      const tool = tools[response.toolName];

      // APPROVAL CHECK! 🛡️
      if (tool.requiresApproval) {
        console.log(`⚠️ Requesting approval: ${tool.name}`);
        console.log(`   Args: ${JSON.stringify(response.args)}`);

        const approved = await askUser("[yes/no]: ");

        if (!approved) {
          messages.push({
            role: "tool",
            content: "User DENIED this action.",
          });
          continue; // Skip! Let LLM decide next!
        }
      }

      // Execute the tool!
      const result = await tool.execute(...response.args);

      messages.push({
        role: "tool",
        content: JSON.stringify(result),
      });
    }
  }
}
```

```javascript
// CONCEPT: Branch-based learning structure

// Each lesson builds on previous:
// lesson-1: Start here (empty agent)
// lesson-2: Has solution for lesson-1 + new challenge
// lesson-3: Has solution for lesson-2 + new challenge
// ...
// done: Complete agent with all features!

// You can always catch up:
// $ git checkout lesson-3  ← skip to lesson 3!

// Or copy code from notes:
// lessons/03/solution.ts  ← code for lesson 3

// Scott: "Each lesson has a BRANCH with the solution
// to the PREVIOUS lesson. You can check out to that
// branch to catch up."
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — CLI Agent Design

```
5 WHYS: TẠI SAO CLI AGENT?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao CLI thay vì browser?
  └→ Vì CLI = practical, useful, controllable!
     Browser agent = "cool demo, never useful"!
     CLI = real tool developers use daily!

  WHY ②: Tại sao "everything agent" thay vì vertical?
  └→ Vì teaches GENERAL agent patterns!
     Vertical = one specific task!
     Everything = learn to handle ANY task!

  WHY ③: Tại sao from scratch, no framework?
  └→ Vì frameworks hide the internals!
     Understanding = debugging + customizing!
     "Gone are the days of 2022-2023 demos!"

  WHY ④: Tại sao cần approval mechanisms?
  └→ Vì run_command = "quite TERRIFYING"!
     Agent could delete files, run rm -rf!
     Human-in-the-loop = safety net!

  WHY ⑤: Tại sao cần evals?
  └→ Vì "vibes-based" testing is not enough!
     Production agents need measurable quality!
     Evals = automated testing for AI!
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — PRODUCTION AGENT:
═══════════════════════════════════════════════════════════════

  PRODUCTION AGENT = Demo Agent + GUARDRAILS

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Demo Agent:                                      │
  │ → SDK + prompt + tools + GO!                    │
  │ → "Those demo very well."                       │
  │ → Unreliable, unpredictable!                   │
  │                                                  │
  │ Production Agent:                                │
  │ → Same core (LLM + tools + loop!)              │
  │ → + Approval mechanisms! 🛡️                    │
  │ → + Tool categorization! (safe vs dangerous!)  │
  │ → + Decision framework!                        │
  │ → + Evals! (testing!)                          │
  │ → + Error handling!                            │
  │ → + Logging + observability!                   │
  │                                                  │
  │ Scott: "It's a lot MORE than just grabbing an    │
  │ SDK and giving it a prompt and watching it go."  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — BROWSER vs CLI AGENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Browser Agent │ CLI Agent (AGI)   │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Impressiveness   │ ✅ "Wow!"     │ ⚠️ "Functional"   │
  │ Reliability      │ ❌ Low        │ ✅ High!          │
  │ Practicality     │ ❌ "Never     │ ✅ "Daily use!"   │
  │                  │   useful"     │                   │
  │ Speed            │ ❌ Slow (DOM) │ ✅ Fast (APIs!)   │
  │ Safety           │ ⚠️ Medium     │ ✅ Approvals!     │
  │ Scope            │ Web browsing  │ Web + files +     │
  │                  │               │ terminal!         │
  └──────────────────┴───────────────┴───────────────────┘
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — AGI CLI ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  $ agi "find NBA MVP and write to MVP.md"
       │
       ▼
  ┌─────────────────────────────────────────┐
  │            AGENT LOOP                   │
  │                                         │
  │  ┌─────────┐    ┌──────────────────┐    │
  │  │   LLM   │───→│  Tool Decision   │    │
  │  │ (GPT-4) │    │  "web_search!"   │    │
  │  └─────────┘    └────────┬─────────┘    │
  │       ▲                  │              │
  │       │          ┌───────▼───────┐      │
  │       │          │ Requires      │      │
  │       │          │ approval?     │      │
  │       │          ├───┬───────┬───┤      │
  │       │          │ NO│       │YES│      │
  │       │          ├───┘       ├───┘      │
  │       │          │           │           │
  │       │          ▼           ▼           │
  │       │        Execute    ⚠️ Ask User   │
  │       │        Tool!      [yes/no]      │
  │       │          │           │           │
  │       │          ▼           ▼           │
  │       └──── Result back to LLM          │
  │                                         │
  └─────────────────────────────────────────┘
       │
       ▼
  📄 MVP.md created!
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — THE NBA MVP DEMO:
═══════════════════════════════════════════════════════════════

  $ agi "find NBA MVP front runners, table in MVP.md"

  ITERATION 1:
  → LLM: "I need to search for NBA MVP candidates"
  → Tool: web_search("NBA MVP candidates 2025")
  → Approval? NO (safe tool!) → auto-execute!
  → Result: {articles about Jokić, Shai, Luka...}

  ITERATION 2: (maybe)
  → LLM: "I need more specific stats"
  → Tool: web_search("NBA MVP race stats 2025")
  → Auto-execute again!
  → Result: {detailed stats}

  ITERATION 3:
  → LLM: "I have enough info, time to write file!"
  → Tool: write_file("MVP.md", "| Player | Notes...")
  → Approval? YES! (dangerous tool!)
  → ⚠️ "Requesting approval: write_file"
  → Shows full content to user
  → User: "yes"
  → File written! ✅

  ITERATION 4:
  → LLM: "Task complete!"
  → Returns: final_answer
  → Agent exits loop!

  KEY: Agent DECIDED how many searches to do!
  "It's not up to me — it's up to the AGENT!"
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — AGENT FRAMEWORKS EVOLUTION:
═══════════════════════════════════════════════════════════════

  2022-2023: "The demo days"
  │ → Grab SDK, give prompt, watch it go!
  │ → AutoGPT, BabyAGI hype!
  │ → Scott: "Gone are THOSE days!"
  │
  ↓
  2023: LangChain, LlamaIndex
  │ → First serious agent frameworks!
  │ → But over-abstracted, hard to debug!
  │
  ↓
  2024: Vercel AI SDK, CrewAI
  │ → Better abstractions!
  │ → But still hiding internals!
  │
  ↓
  2025: Cursor, Claude Code
  │ → Practical CLI agents!
  │ → "If you're familiar with these —
  │    that's what we're building!"
  │
  ↓
  NOW: From Scratch!
  │ → Scott: "Everything from scratch."
  │ → "I'm going to share all experience
  │    from building agents in PRODUCTION
  │    for startups and at MASSIVE companies."
  │
  → Lesson: Don't just use a framework!
    Understand what's underneath!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 2:
═══════════════════════════════════════════════════════════════

  THE AGI AGENT:
  [ ] CLI agent in your terminal!
  [ ] 3 capabilities: web search, file system, terminal!
  [ ] Like Cursor/Claude Code without coding abilities!
  [ ] "AGI = just a joke name!" 😄

  APPROVAL MECHANISMS:
  [ ] Safe tools = auto-run (web_search!)
  [ ] Dangerous tools = need approval (write_file!)
  [ ] "run_command is quite TERRIFYING!"
  [ ] Human-in-the-loop for safety!

  REPO SETUP:
  [ ] Clone github.com/Hendrixer/agents-v2
  [ ] Checkout lesson-1!
  [ ] Create .env with OPENAI_API_KEY!
  [ ] Cost: "less than a PENNY!"

  COURSE GOALS:
  [ ] From scratch, no framework!
  [ ] Production-quality patterns!
  [ ] Real experience from startups + massive companies!
  [ ] "Gone are the days of 2022-2023 demos!"

  TIẾP THEO → Phần 3: What Is An AI Agent? (Theory!)
```
