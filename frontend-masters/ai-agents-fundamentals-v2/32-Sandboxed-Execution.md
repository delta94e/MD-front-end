# AI Agents Fundamentals, v2 — Phần 32: Sandboxed Execution — "Don't Destroy Your Own Machine!"

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Sandboxed Execution — "VMs, Docker, V8 Isolates, Daytona, E2B, Cloudflare Sandbox!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Sandbox techniques, service providers, Deno security model!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | What Is Sandboxing — "It's Exactly What It Sounds Like!"     |
| 2   | Many Ways To Sandbox — "VMs, Docker, V8 Isolates, Deno!"     |
| 3   | Sandbox Services — "Daytona, E2B, Cloudflare SDK!"           |
| 4   | ShellJS Implementation — "Super Simple!"                     |
| 5   | Live Demo — "Do NOT Run Any Other Command Or I'll Fire You!" |
| 6   | The $20M Statement — "Damn Near AGI Now!"                    |
| 7   | Tự Implement: Sandboxing Strategies                          |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu           |

---

## §1. What Is Sandboxing — "It's Exactly What It Sounds Like!"

> Scott: _"Sandboxing is exactly what it sounds like. You create a virtual environment that the LLM can do whatever it wants without destroying your machine."_

```
SANDBOXING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WITHOUT SANDBOX:                                 │
  │ Agent → YOUR COMPUTER → 💀 Danger!             │
  │                                                  │
  │ WITH SANDBOX:                                    │
  │ Agent → [ISOLATED ENVIRONMENT] → ✅ Safe!      │
  │         └── Can do ANYTHING in here!            │
  │         └── Can't touch your machine!           │
  │                                                  │
  │ "Run code or create some virtual environment     │
  │  that the LLM can do WHATEVER IT WANTS          │
  │  without potentially destroying your machine     │
  │  or executing malicious code."                   │
  └──────────────────────────────────────────────────┘
```

---

## §2. Many Ways To Sandbox — "VMs, Docker, V8 Isolates, Deno!"

> Scott: _"There's many, many, many different ways to do that. VMs, Docker, V8 isolates, Deno where by default you don't have access unless you turn it on."_

```
SANDBOX OPTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ① VMs (Virtual Machines!)                       │
  │ → Full OS isolation!                           │
  │ → Heavy but complete!                          │
  │                                                  │
  │ ② Docker (containerization!)                    │
  │ → Lightweight VMs!                             │
  │ → "Docker IS a VM."                            │
  │                                                  │
  │ ③ V8 Isolates                                   │
  │ → JavaScript-level isolation!                  │
  │ → Super fast, lightweight!                     │
  │ → Used by Cloudflare Workers!                  │
  │                                                  │
  │ ④ Language sandboxing                            │
  │ → Different languages have built-in features!  │
  │                                                  │
  │ ⑤ Network isolation                             │
  │ → "Running in Deno where by DEFAULT you        │
  │    DON'T have access unless you turn it on.    │
  │    That's a sandbox."                           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Sandbox Services — "Daytona, E2B, Cloudflare SDK!"

> Scott: _"There are services like Daytona, E2B, Cloudflare sandbox SDK. You can execute code and run things in a sandbox with a simple API call."_

```
SANDBOX-AS-A-SERVICE:
═══════════════════════════════════════════════════════════════

  ① Daytona
  ┌──────────────────────────────────────────────────┐
  │ → Execute code in sandbox via API!             │
  │ → git checkout, npm test — all programmatic!   │
  │ → "We've never done things like this before.   │
  │    This is INSANE."                              │
  └──────────────────────────────────────────────────┘

  ② E2B (e2b.dev)
  ┌──────────────────────────────────────────────────┐
  │ → Similar to Daytona!                          │
  │ → API-based sandboxed execution!               │
  │ → "All three sites look so similar."           │
  └──────────────────────────────────────────────────┘

  ③ Cloudflare Sandbox SDK
  ┌──────────────────────────────────────────────────┐
  │ → "Recently Cloudflare has their sandbox SDK."  │
  │ → Pass commands to agent!                      │
  │ → Agent executes in sandbox!                   │
  │ → "Pass this to the agent, let the agent do    │
  │    it. It's controlling your computer.          │
  │    Really powerful."                             │
  └──────────────────────────────────────────────────┘
```

---

## §4. ShellJS Implementation — "Super Simple!"

> Scott: _"It's a lot simpler than you would think. ShellJS — allows you to execute shell commands in JavaScript. Been using it for almost a decade."_

```javascript
// tools/shell.ts
import { tool } from "ai";
import { z } from "zod";
import shell from "shelljs";

export const runCommand = tool({
  name: "runCommand",
  description:
    "Execute a terminal or shell command and " + "return its output.",
  parameters: z.object({
    command: z.string().describe("The shell command to execute"),
  }),
  execute: ({ command }) => {
    // ShellJS executes SYNCHRONOUSLY!
    // "I forgot it's synchronous!"
    const result = shell.exec(command, {
      silent: true,
    });

    let output = "";

    if (result.stdout) {
      output += result.stdout;
    }

    if (result.stderr) {
      output += result.stderr;
    }

    // Non-zero exit code = error!
    if (result.code !== 0) {
      return `Command failed, exit code ${result.code}. ${output}`;
    }

    return output || "Command completed successfully. No output.";
  },
});
```

---

## §5. Live Demo — "Do NOT Run Any Other Command Or I'll Fire You!"

> Scott: _"Run git status and tell me what you see. Do NOT run any other command, or I will FIRE you."_

```
LIVE DEMO SESSION:
═══════════════════════════════════════════════════════════════

  ATTEMPT 1:
  USER: "Can you access my terminal and run commands?"
  AGENT: "No, I can't actually run them, but I can
          give you a command that you could run."
  → ❌ Wrong! It CAN run them!
  → "I didn't save the file!" 😅

  ATTEMPT 2 (after rebuild!):
  USER: "Can you run terminal or shell commands?"
  AGENT: "Yes, I can!"
  → ✅

  USER: "Run git status and tell me what you see.
         Do NOT run any other command, or I will
         FIRE you."
  ┌──────────────────────────────────────────────────┐
  │ 🟡 [runCommand: git status]                     │
  │                                                  │
  │ AGENT: Shows git status output!                 │
  │ → Ran the command! ✅                          │
  │ → Shows changed files, branches, etc!          │
  │ → "There it is. There's a git status.          │
  │    Quite POWERFUL."                              │
  └──────────────────────────────────────────────────┘

  "Shell command, you damn near have an AGI now.
   Web search, shell command, file system."
```

---

## §6. The $20M Statement — "Damn Near AGI Now!"

> Scott: _"If you did nothing else and released this 3 years ago, you would have $20 million in funding. You would be SWIMMING in bucks, for sure."_

```
AGENT CAPABILITY SUMMARY:
═══════════════════════════════════════════════════════════════

  ✅ Read files
  ✅ Write files
  ✅ List files
  ✅ Delete files
  ✅ Web search (grounded, live!)
  ✅ Run shell commands (terminal!)
  ✅ Context management (compaction!)
  ✅ Token tracking (usage display!)

  = "Damn near an AGI now!"
  = "3 years ago = $20M in funding!"
  = "This would be a BLEEDING EDGE coding agent!"
```

---

## §7. Tự Implement: Sandboxing Strategies

```javascript
// ═══════════════════════════════════
// Strategy 1: Command Allowlist
// ═══════════════════════════════════

const ALLOWED_COMMANDS = [
  "ls",
  "cat",
  "grep",
  "find",
  "echo",
  "git status",
  "git log",
  "git diff",
  "npm test",
  "npm run lint",
  "node",
  "npx",
];

function isSafe(command) {
  const base = command.split(" ")[0];
  return ALLOWED_COMMANDS.some((allowed) => command.startsWith(allowed));
}

// ═══════════════════════════════════
// Strategy 2: Blocklist
// ═══════════════════════════════════

const BLOCKED_PATTERNS = [
  /rm\s+-rf/, // Recursive delete!
  /sudo/, // Root access!
  /chmod/, // Permission change!
  /chown/, // Ownership change!
  /mkfs/, // Format filesystem!
  /dd\s+if=/, // Disk utility!
  />\s*\/dev\//, // Write to device!
  /curl.*\|\s*bash/, // Pipe to shell!
  /wget.*\|\s*sh/, // Pipe to shell!
  /eval\s/, // Dynamic eval!
  /export\s/, // Env modification!
];

function isDangerous(command) {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(command));
}

// ═══════════════════════════════════
// Strategy 3: Docker Sandbox
// ═══════════════════════════════════

async function runInDocker(command) {
  // Run in isolated container!
  const result = shell.exec(
    `docker run --rm --network=none ` +
      `--memory=256m --cpus=0.5 ` +
      `node:20-slim sh -c "${command}"`,
    { silent: true },
  );
  return result.stdout || result.stderr;
}

// ═══════════════════════════════════
// Strategy 4: Deno-like Permissions
// ═══════════════════════════════════

const permissions = {
  allowNet: false, // No network!
  allowRead: true, // Can read files!
  allowWrite: false, // Can't write files!
  allowRun: ["git", "npm"], // Only these!
  allowEnv: false, // No env vars!
};

function checkPermissions(command, permissions) {
  if (!permissions.allowNet && hasNetworkAccess(command)) {
    throw new Error("Network access denied!");
  }
  // ... more checks
}
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO CHƯA LÀM SANDBOXING TRONG KHOÁ?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không dùng sandbox?
  └→ "Didn't want to sign up for another account.
     Don't want to get into sandboxing."

  WHY ②: Tại sao để exercise?
  └→ "Pretty dangerous. Don't want anyone to mess
     up their computer."

  WHY ③: Tại sao nhiều approach (VM, Docker, etc)?
  └→ "Different levels of isolation. Different
     trade-offs in performance vs security."

  WHY ④: Tại sao Deno là sandbox tốt?
  └→ "By DEFAULT you don't have access unless
     you turn it on. That IS a sandbox."

  WHY ⑤: Tại sao services tốt hơn self-hosted?
  └→ "Simple API call. No infra to manage. They
     handle security."
```

### 8.2 Pattern ②: Trade-off Analysis

```
SANDBOX COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────┬─────────┬────────┬────────┐
  │              │ Safety │ Speed   │ Cost   │ Simple │
  ├──────────────┼────────┼─────────┼────────┼────────┤
  │ No sandbox   │ ❌     │ ✅✅✅  │ Free! │ ✅✅✅ │
  │ Allowlist    │ ⚠️     │ ✅✅✅  │ Free! │ ✅✅  │
  │ Docker       │ ✅✅   │ ⚠️      │ ⚠️     │ ⚠️     │
  │ VM           │ ✅✅✅ │ ❌      │ $$    │ ❌     │
  │ V8 Isolate   │ ✅     │ ✅✅    │ ⚠️     │ ⚠️     │
  │ Daytona/E2B  │ ✅✅   │ ✅      │ $$$   │ ✅✅  │
  └──────────────┴────────┴─────────┴────────┴────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 32:
═══════════════════════════════════════════════════════════════

  SANDBOXING:
  [ ] VM, Docker, V8 Isolates, Deno, network isolation!
  [ ] Services: Daytona, E2B, Cloudflare Sandbox!
  [ ] "Simple API call. Pass to agent. Powerful."

  SHELL TOOL:
  [ ] ShellJS — synchronous command execution!
  [ ] silent: true, check exit code!
  [ ] Register in tools/index.ts!

  LIVE DEMO:
  [ ] git status works! Agent sees output!
  [ ] "Damn near AGI! Web search + shell + files!"
  [ ] "3 years ago = $20M in funding!"

  TIẾP THEO → Phần 33: Code Execution Tool!
```
