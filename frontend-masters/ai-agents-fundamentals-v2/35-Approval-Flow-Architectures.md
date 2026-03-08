# AI Agents Fundamentals, v2 — Phần 35: Approval Flow Architectures — "Synchronous = Terrible, Async = The Future!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Approval Flow Architectures — "Sync vs Async, Per-Tool vs Input-Based, Agent Inboxes!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Durable execution, approval surfaces, notification channels!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | Synchronous Flow — "Terrible! But We're Doing It!"          |
| 2   | Asynchronous Flow — "The FUTURE! Background Agents!"        |
| 3   | Approval Surfaces — "Per-Tool, Input-Based, Session-Based!" |
| 4   | Notification Channels — "iMessage, Slack, Email, ANYTHING!" |
| 5   | Ask User Tool — "Force Model To Ask SPECIFIC Questions!"    |
| 6   | Tự Implement: Approval Architectures                        |
| 7   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu          |

---

## §1. Synchronous Flow — "Terrible! But We're Doing It!"

> Scott: _"It's TERRIBLE. Doesn't give us any of the benefits. But we're doing it because we're in a terminal."_

```
SYNCHRONOUS APPROVAL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ HOW IT WORKS:                                    │
  │ → Agent loop SUSPENDS and pauses!              │
  │ → Process is still RUNNING!                    │
  │ → Waiting for user approval!                   │
  │ → Nothing else can happen!                     │
  │                                                  │
  │ BOUND BY:                                        │
  │ → "Shut your computer = DONE."                 │
  │ → "Quit the terminal = DONE."                  │
  │ → "It's not durable, it's out of there."       │
  │                                                  │
  │ DOESN'T WORK FOR:                                │
  │ → Multiple users!                              │
  │ → HTTP (you'll get a TIMEOUT!)                 │
  │ → Being away from your computer!               │
  │                                                  │
  │ WORKS FOR:                                       │
  │ → CLI tools! Local development!                │
  │ → Self-driving car ("you're IN the car!")      │
  │ → Real-time interactive sessions!              │
  │                                                  │
  │ "Sure this thing can do that, but I still had   │
  │  to WATCH it and APPROVE. I could have just     │
  │  DID that. What was the POINT?"                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Asynchronous Flow — "The FUTURE! Background Agents!"

> Scott: _"The FUTURE. Stateful, persistent, durable execution. When they ask for approval, they just STOP. No compute. Everything saved. You can approve a YEAR later."_

```
ASYNCHRONOUS APPROVAL — THE FUTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ HOW IT WORKS:                                    │
  │ → Agent asks for approval → STOPS!             │
  │ → Shuts down! No compute!                      │
  │ → State saved in persistent storage!           │
  │ → You approve at your own leisure!             │
  │ → "A YEAR later, doesn't matter."              │
  │ → Spins back up! Sees approval! Continues!     │
  │                                                  │
  │ SMART AGENT:                                     │
  │ "It might be like: 'Man, so much TIME has       │
  │  passed. I need to look at my world again       │
  │  and see what changed, because I'm already      │
  │  on step 20 and things have probably changed.'" │
  │                                                  │
  │ FIRE AND FORGET:                                 │
  │ → "Send off 20 different tasks!"               │
  │ → "Go on with your day!"                       │
  │ → Updates throughout the day!                  │
  │ → "Just like a CO-WORKER would."               │
  │ → "You're not wasting money — compute shut DOWN"│
  │ → "If it's urgent, you'd respond."             │
  │ → "If not, it just waits." (**               │
  │                                                  │
  └──────────────────────────────────────────────────┘

  "This is possible TODAY. People just aren't
   building them, unfortunately."
```

---

## §3. Approval Surfaces — "Per-Tool, Input-Based, Session-Based!"

> Scott: _"There are many different surfaces on which you can implement approvals."_

```
APPROVAL STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① PER-TOOL:
  ┌──────────────────────────────────────────────────┐
  │ "Every call to shell command = approval."       │
  │ "That's why I was exporting tools in GROUPS.    │
  │  File group → approvals. Terminal → approvals." │
  └──────────────────────────────────────────────────┘

  ② INPUT-BASED:
  ┌──────────────────────────────────────────────────┐
  │ "Auto-approve if shell command is just ls or cat"│
  │ "Auto-approve read file if path doesn't include │
  │  this secret path I don't want you to see."     │
  └──────────────────────────────────────────────────┘

  ③ SESSION-BASED:
  ┌──────────────────────────────────────────────────┐
  │ "Claude Code does this. Trust this tool for      │
  │  the rest of the session. Trust all tools        │
  │  that match this pattern."                       │
  └──────────────────────────────────────────────────┘

  ④ RISK SCORING:
  ┌──────────────────────────────────────────────────┐
  │ "Gets complicated."                              │
  └──────────────────────────────────────────────────┘

  ⑤ TIME & COST BASED (Enterprise!):
  ┌──────────────────────────────────────────────────┐
  │ "Auto-approve if operation < X time."           │
  │ "We know how much these APIs cost."             │
  │ "Compute average over logs to estimate time."   │
  └──────────────────────────────────────────────────┘
```

---

## §4. Notification Channels — "iMessage, Slack, Email, ANYTHING!"

> Scott: _"With background agents, you can notify someone ANYWHERE. iMessage, call them, email, Slack, custom client."_

```
NOTIFICATION CHANNELS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Background agent needs approval →              │
  │                                                  │
  │ 📱 iMessage!                                    │
  │ 📧 Email!                                      │
  │ 💬 Slack!                                      │
  │ 📞 Call them!                                  │
  │ 🖥️ Custom client!                              │
  │ 📲 Push notification!                          │
  │                                                  │
  │ "There's NOT MUCH you can't do because          │
  │  everything is distributed and disconnected."   │
  │                                                  │
  │ "You CAN'T do that with synchronous.            │
  │  The process is sitting there WAITING."         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Ask User Tool — "Force Model To Ask SPECIFIC Questions!"

> Scott: _"An 'ask user' tool forces the model to be SPECIFIC about questions and even offer OPTIONS. Claude Code just did this."_

```
ASK USER TOOL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ NOT an approval tool! An ASK tool!               │
  │                                                  │
  │ "When you're in a fork in the road, unsure     │
  │  what response to use, need more context, or    │
  │  user wasn't specific enough — use this tool."  │
  │                                                  │
  │ INPUT: Array of questions!                       │
  │ BONUS: Suggested options per question!           │
  │                                                  │
  │ EXAMPLE — Nike shoes:                            │
  │ "Find me Ja Morant's in this color."            │
  │ Agent goes to Nike, finds them, but...          │
  │ "I didn't tell it my SIZE."                     │
  │                                                  │
  │ Questions: [                                     │
  │   { q: "What size?",                            │
  │     options: [8, 9, 10, 11, 12, 13, 14] }      │
  │ ]                                                │
  │                                                  │
  │ "Claude Code does this! Option 1, option 2,     │
  │  something else, hit enter. That's pretty good."│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Tự Implement: Approval Architectures

```javascript
// ═══════════════════════════════════
// 1. Synchronous Approval (what we build!)
// ═══════════════════════════════════

async function agentLoopWithApproval(messages, tools, callbacks) {
  while (true) {
    const response = await generateText({ messages, tools });
    let rejected = false;

    if (response.toolCalls?.length) {
      for (const toolCall of response.toolCalls) {
        // Ask for approval — DETERMINISTIC!
        const approved = await callbacks.onToolApproval({
          toolName: toolCall.name,
          args: toolCall.args,
        });

        if (!approved) {
          rejected = true;
          break; // Stop processing tools!
        }

        // Approved! Execute!
        const result = await executeTool(toolCall);
        messages.push({ role: "tool", content: result });
      }

      if (rejected) break; // Exit agent loop!
      continue;
    }

    break;
  }
}

// ═══════════════════════════════════
// 2. Input-Based Auto-Approval
// ═══════════════════════════════════

const AUTO_APPROVE_RULES = {
  runCommand: {
    patterns: [/^ls/, /^cat /, /^echo /, /^git status/],
    // "If it's just ls or cat, auto-approve."
  },
  readFile: {
    blockedPaths: ["/etc/", "/.env", "/secrets/"],
    // "If path doesn't include secret path, approve."
  },
};

function shouldAutoApprove(toolName, args) {
  const rules = AUTO_APPROVE_RULES[toolName];
  if (!rules) return false;

  if (rules.patterns) {
    return rules.patterns.some((p) => p.test(args.command));
  }
  if (rules.blockedPaths) {
    return !rules.blockedPaths.some((p) => args.path?.includes(p));
  }
  return false;
}

// ═══════════════════════════════════
// 3. Session-Based Trust
// ═══════════════════════════════════

const sessionTrust = new Set();

async function approveWithSession(toolName, args, callbacks) {
  // Already trusted for this session?
  if (sessionTrust.has(toolName)) return true;
  if (sessionTrust.has("*")) return true; // Trust all!

  const result = await callbacks.onToolApproval({
    toolName,
    args,
    options: [
      "approve_once",
      "trust_this_session",
      "trust_all_session",
      "reject",
    ],
  });

  if (result === "trust_this_session") {
    sessionTrust.add(toolName);
  }
  if (result === "trust_all_session") {
    sessionTrust.add("*");
  }

  return result !== "reject";
}

// ═══════════════════════════════════
// 4. Ask User Tool
// ═══════════════════════════════════

const askUser = tool({
  name: "askUser",
  description:
    "Ask the user questions when you need more " +
    "context, are at a fork, or need clarification. " +
    "Include suggested options when possible.",
  parameters: z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        suggestedOptions: z.array(z.string()).optional(),
      }),
    ),
  }),
  execute: async ({ questions }) => {
    // Show form to user with questions!
    const answers = await ui.showQuestions(questions);
    return answers
      .map((a, i) => `Q: ${questions[i].question}\nA: ${a}`)
      .join("\n\n");
  },
});
```

---

## §7. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 7.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO ASYNC LÀ TƯƠNG LAI?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao sync không đủ?
  └→ "Process running. Computer shut = DONE.
     Can't do anything else while waiting."

  WHY ②: Tại sao cần durable execution?
  └→ "Approve a year later. State saved. No
     compute wasted while waiting."

  WHY ③: Tại sao notify anywhere?
  └→ "Distributed. Disconnected. iMessage, Slack,
     email. CAN'T do this with sync."

  WHY ④: Tại sao fire-and-forget?
  └→ "20 tasks. Go on with your day. Updates
     like a co-worker would. No guilt."

  WHY ⑤: Tại sao chưa ai build?
  └→ "Possible TODAY but nobody building them.
     Unfortunately."
```

### 7.2 Pattern ②: Trade-off Analysis

```
SYNC vs ASYNC:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Synchronous   │ Asynchronous      │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Simplicity       │ ✅ Easy!      │ ❌ Complex!       │
  │ Durability       │ ❌ Lost!      │ ✅ Persistent!    │
  │ Multi-user       │ ❌ No!        │ ✅ Yes!           │
  │ HTTP compatible  │ ❌ Timeout!   │ ✅ Yes!           │
  │ True freedom     │ ❌ Still here!│ ✅ Fire & forget! │
  │ Notification     │ ❌ Terminal!  │ ✅ Anywhere!      │
  │ Cost while wait  │ ❌ Running!   │ ✅ Shut down!     │
  └──────────────────┴───────────────┴───────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 35:
═══════════════════════════════════════════════════════════════

  SYNC vs ASYNC:
  [ ] Synchronous = process running, terminal bound!
  [ ] Asynchronous = durable, fire-and-forget!
  [ ] "Approve a year later. Doesn't matter!"

  APPROVAL SURFACES:
  [ ] Per-tool, input-based, session-based!
  [ ] Risk scoring, time & cost based (enterprise!)
  [ ] Tool groups: file tools, terminal tools!

  ASK USER:
  [ ] NOT approval tool! Questions + options!
  [ ] "Claude Code does this. Option 1, option 2."
  [ ] Force model to be SPECIFIC!

  TIẾP THEO → Phần 36: Adding Approvals!
```
