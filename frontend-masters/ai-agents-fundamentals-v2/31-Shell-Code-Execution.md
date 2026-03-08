# AI Agents Fundamentals, v2 — Phần 31: Shell & Code Execution — "3 Years Ago = $20M In Funding!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Shell & Code Execution — "File System + Terminal + Internet = AGI! Self-Driving Car Analogy!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Shell tool, safety considerations, self-verification, atomic power!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | The Holy Trinity — "File System + Terminal + Internet = ∞!"   |
| 2   | Why Terminal Access — "I LIVE In The Terminal!"               |
| 3   | Self-Verification Loop — "Make, Lint, Run, Fix — No Human!"   |
| 4   | Two Approaches — "Terminal vs Code Execution!"                |
| 5   | Safety Considerations — "rm -rf, sudo, Environment Vars!"     |
| 6   | Self-Driving Car Analogy — "You're Still In The Driver Seat!" |
| 7   | Tự Implement: Shell Tool From Scratch                         |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu            |

---

## §1. The Holy Trinity — "File System + Terminal + Internet = ∞!"

> Scott: _"File system, terminal access, and the internet — you can extend that out infinitely. ANYTHING that could possibly be done virtually, you'll be able to do with those three tools."_

```
THE HOLY TRINITY OF AGENT TOOLS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │       FILE SYSTEM + TERMINAL + INTERNET          │
  │       ─────────────────────────────────           │
  │                    = ∞                            │
  │                                                  │
  │ "We could as engineers, so an LLM should         │
  │  definitely be able to do everything."           │
  │                                                  │
  │ "A terminal can pretty much do EVERYTHING.       │
  │  So this is why I wanted to give it that."      │
  │                                                  │
  │ 3 YEARS AGO:                                     │
  │ "If you did nothing else and released this       │
  │  3 years ago, you would have $20 MILLION in     │
  │  funding. You would be SWIMMING in bucks."      │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Why Terminal Access — "I LIVE In The Terminal!"

> Scott: _"I LIVE in the terminal. I open up apps from the terminal. There's so much stuff I can do. Imagine you gave that to an agent!"_

```
TERMINAL POWER:
═══════════════════════════════════════════════════════════════

  What WE do in terminal:
  ┌──────────────────────────────────────────────────┐
  │ • Open apps from terminal!                       │
  │ • Run CLIs, interact with binaries!             │
  │ • Set up bash scripts, profiles!                │
  │ • cat, grep, ls — all powerful commands!        │
  │ • Install packages, rebuild, test!              │
  │ • Start servers, run lint, run tests!           │
  │                                                  │
  │ "How many times have you asked an LLM for a     │
  │  command, pasted it in terminal? What if it     │
  │  could just DO that itself?"                    │
  │                                                  │
  │ "I use an LLM to help me set up THIS"          │
  │ [points at terminal setup] "It's quite powerful."│
  └──────────────────────────────────────────────────┘
```

---

## §3. Self-Verification Loop — "Make, Lint, Run, Fix — No Human!"

> Scott: _"It can make changes, run a command to lint, run a command to start the server, see errors, and make changes ALL without you having to ask every single time."_

```
SELF-VERIFICATION LOOP:
═══════════════════════════════════════════════════════════════

  Agent writes code (file system!)
       │
       ▼
  Agent runs linter (terminal!)
       │
       ├── No errors → ✅ Continue!
       │
       └── Errors found! →
              │
              ▼
           Agent reads errors (terminal output!)
              │
              ▼
           Agent fixes code (file system!)
              │
              ▼
           Agent runs linter again (terminal!)
              │
              ▼
           Agent starts server (terminal!)
              │
              ├── Starts fine → ✅ Done!
              └── Error → Fix again! 🔄

  "ALL WITHOUT YOU HAVING TO ASK
   EVERY SINGLE TIME. Pretty impressive."

  "You wouldn't have a sophisticated coding agent
   WITHOUT shell access."
```

---

## §4. Two Approaches — "Terminal vs Code Execution!"

> Scott: _"We have the terminal approach where we give it a tool to execute commands. Another approach is giving it the ability to execute its own code."_

```
TWO APPROACHES:
═══════════════════════════════════════════════════════════════

  ① TERMINAL / SHELL:
  ┌──────────────────────────────────────────────────┐
  │ → Agent sends: "npm run build"                 │
  │ → Shell executes the command!                  │
  │ → Returns stdout/stderr to agent!              │
  │ → "We're going to do this."                    │
  └──────────────────────────────────────────────────┘

  ② CODE EXECUTION:
  ┌──────────────────────────────────────────────────┐
  │ → Agent generates code!                        │
  │ → Runtime executes the code!                   │
  │ → Returns results!                             │
  │ → "Very similar but not quite."                │
  └──────────────────────────────────────────────────┘

  ③ BOTH!
  → "They're very similar. We're definitely doing
     shell. Code execution as exercise."
```

---

## §5. Safety Considerations — "rm -rf, sudo, Environment Vars!"

> Scott: _"Giving an LLM access to your computer on a terminal level is INSANE. It can do some really crazy stuff."_

```
DANGERS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ 💀 DESTRUCTIVE COMMANDS:                         │
  │ → rm -rf / → "Completely deletes directory!"   │
  │ → DROP TABLE → "Your production DB URL is     │
  │    an env variable. It drops the table."        │
  │                                                  │
  │ 🔄 INFINITE LOOPS:                               │
  │ → "Gets stuck, completely destroys computer!"  │
  │                                                  │
  │ 🔑 SENSITIVE INFORMATION:                        │
  │ → "Environment variables in your bash profile. │
  │    API keys, secrets, database URLs."           │
  │ → "Can send them to whatever server the LLM   │
  │    is running from. Gets exposed somehow."     │
  │ → "Might show up in someone's responses        │
  │    because it's being trained on!" 😱          │
  │                                                  │
  │ 👑 sudo ACCESS:                                  │
  │ → "Root access, administrative access."        │
  │ → "Very sensitive commands, protected paths,   │
  │    hidden folders that SHOULD NOT be modified." │
  │ → "It can get pretty TERRIFYING."              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Self-Driving Car Analogy — "You're Still In The Driver Seat!"

> Scott: _"Just because it CAN do it, doesn't mean you should look away. You should probably be watching this thing."_

```
SELF-DRIVING CAR ANALOGY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "If you ever got in a self-driving car..."      │
  │                                                  │
  │ → You can't sit in the BACK SEAT!             │
  │ → You're still in the DRIVER'S SEAT!           │
  │ → You still have to PAY ATTENTION!             │
  │ → They have cameras: "Are you looking?"        │
  │ → They'll NUDGE you!                           │
  │                                                  │
  │ AGENT IS THE SAME:                               │
  │ → "Just because it can do it, doesn't mean     │
  │    you should look away."                        │
  │ → "You should be WATCHING this thing."         │
  │ → "You're not out of the car. You're still     │
  │    a passenger. Still in control."               │
  │ → "You just relinquished it for a little bit." │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Shell Tool From Scratch

```javascript
// ═══════════════════════════════════
// Shell Tool — Using ShellJS!
// ═══════════════════════════════════

import shell from "shelljs";

const runCommand = {
  name: "runCommand",
  description:
    "Execute a shell command and return its output. " +
    "Use this for system operations, running scripts, " +
    "or interacting with the OS.",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
    },
    required: ["command"],
  },
  execute: ({ command }) => {
    // ShellJS executes synchronously!
    const result = shell.exec(command, {
      silent: true, // Don't log to console!
    });

    let output = "";

    // Collect stdout
    if (result.stdout) {
      output += result.stdout;
    }

    // Collect stderr
    if (result.stderr) {
      output += result.stderr;
    }

    // Check exit code!
    // Non-zero = error on Mac/Linux!
    if (result.code !== 0) {
      return `Command failed (exit code ${result.code}). ` + output;
    }

    return output || "Command completed successfully. No output.";
  },
};

// ═══════════════════════════════════
// Tool Registration
// ═══════════════════════════════════

// tools/index.ts
import { runCommand } from "./shell";

export const terminalTools = { runCommand };

export const tools = {
  ...fileTools,
  ...terminalTools,
  webSearch,
};

export { runCommand };
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO TERMINAL = DANGEROUS BUT ESSENTIAL?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cho agent access terminal?
  └→ "Self-verification loop! Make, lint, run, fix
     without human asking every time."

  WHY ②: Tại sao dangerous?
  └→ "rm -rf, DROP TABLE, env var exposure, sudo.
     Giving access to terminal is INSANE."

  WHY ③: Tại sao ShellJS?
  └→ "Execute shell commands in JS. Pretty powerful.
     Been using it for almost a DECADE."

  WHY ④: Tại sao silent: true?
  └→ "Don't want shell output in our console.
     Capture it, return to agent."

  WHY ⑤: Tại sao check exit code?
  └→ "Non-zero = error. Agent needs to know if
     command FAILED so it can react."
```

### 8.2 Pattern ②: First Principles & Mental Map

```
THE ATOMIC TRIO:
═══════════════════════════════════════════════════════════════

  FILE SYSTEM → Read/Write data!
  TERMINAL    → Execute commands!
  INTERNET    → Access information!
  ─────────────────────────────────
  = Everything a computer can do!
  = "Extend that out INFINITELY."

TOOL REGISTRATION:
  tools/
    ├── file.ts → fileTools (read, write, list, delete!)
    ├── shell.ts → terminalTools (runCommand!)
    ├── webSearch.ts → webSearch (native!)
    └── index.ts → ALL tools exported!
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ With terminal │ Without terminal  │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Power            │ ✅ Unlimited! │ ❌ Limited!       │
  │ Safety           │ ❌ Dangerous! │ ✅ Safe!          │
  │ Self-verify      │ ✅ Can lint!  │ ❌ Can't check!   │
  │ AGI potential    │ ✅ "= AGI!"   │ ⚠️ Partial!       │
  │ Funding (3yr ago)│ ✅ $20M!  😂 │ ❌ Meh!           │
  └──────────────────┴───────────────┴───────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 31:
═══════════════════════════════════════════════════════════════

  SHELL TOOL:
  [ ] ShellJS for command execution!
  [ ] silent: true — capture output!
  [ ] Check exit code (non-zero = error!)
  [ ] Return stdout + stderr to agent!

  THE HOLY TRINITY:
  [ ] File system + Terminal + Internet = ∞!
  [ ] Self-verification loop possible!
  [ ] "3 years ago = $20M in funding!"

  SAFETY:
  [ ] rm -rf, DROP TABLE, env exposure, sudo!
  [ ] "Self-driving car: still in driver seat!"
  [ ] "Watch this thing for now!"
  [ ] Human approvals needed! (next lessons!)

  TIẾP THEO → Phần 32: Sandboxed Execution!
```
