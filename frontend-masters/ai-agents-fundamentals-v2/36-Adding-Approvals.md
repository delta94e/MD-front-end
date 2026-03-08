# AI Agents Fundamentals, v2 — Phần 36: Adding Approvals — "LLM Has NO IDEA About Approvals!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Adding Approvals — "Sync In-Line State, onToolApproval Callback, LLM Is CLUELESS!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Implementation, approval callbacks, rejection handling, tool-in-tool critique!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | Approach — "Seek Approval For ALL Tool Calls!"                |
| 2   | Implementation — "Keep Track In-Line, Process Still Running!" |
| 3   | onToolApproval Callback — "Promise Resolves On User Answer!"  |
| 4   | Rejection Handling — "Break The Loop, Could Signal LLM!"      |
| 5   | Live Demo — "Read Package.json? Yes! It DID Read It!"         |
| 6   | The LLM Is Clueless — "No Concept Of Approvals!"              |
| 7   | Where To Put Approval Logic — "NOT As A Tool!"                |
| 8   | Ask-User Tool Tangent — "Claude Code Does This WELL!"         |
| 9   | Tự Implement: Complete Approval System                        |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu            |

---

## §1. Approach — "Seek Approval For ALL Tool Calls!"

> Scott: _"I'm just going to seek approval for ALL tool calls for now. Eventually you can limit to specific tools, specific inputs."_

```
APPROACH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ START: Approve ALL tool calls!                   │
  │                                                  │
  │ LATER EXPANSION:                                 │
  │ → Specific tools only!                         │
  │ → Specific inputs only!                        │
  │ → Session trust!                               │
  │                                                  │
  │ "This is synchronous. We can just keep track    │
  │  of state in-line because the process is still  │
  │  running."                                       │
  └──────────────────────────────────────────────────┘
```

---

## §2. Implementation — "Keep Track In-Line!"

> Scott: _"Instead of executing this tool, make sure it was approved first."_

```javascript
// Inside the agent loop — tool execution section!

let rejected = false;

for (const toolCall of response.toolCalls) {
  // Ask for approval BEFORE executing!
  const approved = await callbacks.onToolApproval({
    toolName: toolCall.name,
    args: toolCall.args,
    // ↑ "Can't ask to approve if user doesn't
    //    know the arguments. If I said 'approve
    //    writing this file?' — WHAT file? What
    //    are you writing? I need to SEE the args."
  });

  if (!approved) {
    rejected = true;
    break; // Stop processing this set of tools!
  }

  // Approved! Execute the tool!
  const result = await executeTool(toolCall);
  messages.push({
    role: "tool",
    content: JSON.stringify(result),
    toolCallId: toolCall.id,
  });
}
```

---

## §3. onToolApproval Callback — "Promise Resolves On User Answer!"

> Scott: _"This will show a prompt to the user. We will WAIT for them to answer. When they answer, the promise will resolve."_

```javascript
// callbacks.onToolApproval implementation

const onToolApproval = async ({ toolName, args }) => {
  // Show prompt in terminal!
  console.log(`\n🔒 Tool: ${toolName}`);
  console.log(`   Args: ${JSON.stringify(args, null, 2)}`);

  // readline prompt — blocks until user responds!
  const answer = await readline.question("Approve? (yes/no): ");

  return answer.toLowerCase() === "yes";
  // "That will stay up as long as your terminal's
  //  up. So we want to pass in the tool name and
  //  the args."
};
```

```
APPROVAL FLOW:
═══════════════════════════════════════════════════════════════

  Agent wants to call readFile!
       │
       ▼
  UI shows:
  ┌──────────────────────────────────────────────────┐
  │ 🔒 Tool: readFile                               │
  │    Args: { path: "package.json" }               │
  │                                                  │
  │    Approve? (yes/no): _                          │
  └──────────────────────────────────────────────────┘
       │
       ├── "yes" → Execute! Return results to agent!
       │
       └── "no"  → rejected = true! Break loop!
```

---

## §4. Rejection Handling — "Break The Loop, Could Signal LLM!"

> Scott: _"You can tell the LLM: user said no, do with that whatever you will. You can decide. We could do that, but I'm just gonna break."_

```javascript
// After the tool processing for loop:

if (rejected) {
  break; // Exit the while loop entirely!
  // ↑ "There's nothing else to do."
}

// ALTERNATIVE — signal the LLM:
if (rejected) {
  messages.push({
    role: "tool",
    content: "User rejected this tool call. " +
      "The user does not want you to proceed " +
      "with this action.",
    toolCallId: toolCall.id,
  });
  // Let the agent decide what to do!
  // "Which is probably BETTER." — Scott
  continue;
}
```

```
REJECTION OPTIONS:
═══════════════════════════════════════════════════════════════

  Option A — BREAK:
  ┌──────────────────────────────────────────────────┐
  │ → Exit loop! Conversation over!                │
  │ → Simple! No wrong answer!                     │
  │ → "There's no wrong answer here."              │
  └──────────────────────────────────────────────────┘

  Option B — SIGNAL LLM:
  ┌──────────────────────────────────────────────────┐
  │ → Tell agent: "User said no!"                  │
  │ → Agent can: ask for follow-up!                │
  │ → Agent can: tell user they should let it!     │
  │ → Agent can: try different approach!            │
  │ → "Which is PROBABLY better." — Scott          │
  └──────────────────────────────────────────────────┘
```

---

## §5. Live Demo — "Read Package.json? Yes! It DID Read It!"

> Scott: _"Read the package.json and tell me what dependencies this project has."_

```
LIVE DEMO:
═══════════════════════════════════════════════════════════════

  TEST 1 — REJECTION:
  ┌──────────────────────────────────────────────────┐
  │ USER: "Read the package.json, tell me deps."    │
  │ AGENT: "I want to call readFile(package.json)"  │
  │ Approve? → "no"                                │
  │ → Loop breaks! It's over!                      │
  │ → "Right? It's over cause I did break."        │
  └──────────────────────────────────────────────────┘

  TEST 2 — APPROVAL:
  ┌──────────────────────────────────────────────────┐
  │ USER: "Read the package.json, tell me deps."    │
  │ AGENT: "I want to call readFile(package.json)"  │
  │ Approve? → "yes"                               │
  │ → It DID read the file! ✅                    │
  │ → Lists all dependencies!                      │
  │ → "And then it thinks I wanted to do stuff,    │
  │    like, I didn't say that. I just want you    │
  │    to read the file, CHILL OUT."               │
  └──────────────────────────────────────────────────┘
```

---

## §6. The LLM Is Clueless — "No Concept Of Approvals!"

> Scott: _"The sweet thing is the LLM has NO idea about it. No concept about approvals. It had no idea it was suspended."_

```
LLM CLUELESSNESS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ LLM: "I want to call readFile!"                 │
  │                                                  │
  │ [SYSTEM SUSPENDS... 5 min pass...]              │
  │ [User approves]                                  │
  │                                                  │
  │ LLM: "Got the results! Here are the deps!"     │
  │                                                  │
  │ → "Had no idea it was SUSPENDED."              │
  │ → "Had no idea user was ASKED."                │
  │ → "Had no idea if user APPROVED or not."       │
  │ → "At least in MY implementation."             │
  │                                                  │
  │ THE BEAUTY:                                      │
  │ → Approvals are INVISIBLE to the model!        │
  │ → DETERMINISTIC — system controls it!          │
  │ → No unreliable LLM judgment involved!         │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Where To Put Approval Logic — "NOT As A Tool!"

> Scott: _"Creating a tool called 'ask for approval' is BAD. The first time I made approvals, that's what I did. I spent 3 MONTHS trying to eval that."_

```
THREE APPROACHES — RANKED:
═══════════════════════════════════════════════════════════════

  ❌ WORST — Approval as a TOOL:
  ┌──────────────────────────────────────────────────┐
  │ tool({ name: "askForApproval", ... })            │
  │ → "What if it decided NOT to use it?"          │
  │ → "You're SCREWED."                            │
  │ → "I spent 3 MONTHS eval-ing. NEVER works."   │
  │ → "Why am I trying to get you to pick the      │
  │    right time when I can just do it myself?     │
  │    It's DETERMINISTIC."                         │
  └──────────────────────────────────────────────────┘

  ⚠️ OK — Inside each tool:
  ┌──────────────────────────────────────────────────┐
  │ execute: async (args) => {                       │
  │   const approved = await context.ui.askApproval()│
  │   if (!approved) return "Rejected";             │
  │   // ... actual logic                            │
  │ }                                                │
  │ → Works! But "write in SO MANY places!"        │
  │ → Need to pass context down!                   │
  └──────────────────────────────────────────────────┘

  ✅ BEST — At the loop level:
  ┌──────────────────────────────────────────────────┐
  │ → Universal! One place!                        │
  │ → DETERMINISTIC!                               │
  │ → LLM doesn't know!                           │
  │ → "This is what I did." — Scott                │
  └──────────────────────────────────────────────────┘
```

---

## §8. Ask-User Tool Tangent — "Claude Code Does This WELL!"

> Scott: _"Sometimes having a tool that says 'ask user for help' is super useful. Claude Code just came out with this a week ago."_

```
ASK-USER TOOL (different from approval!):
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WHEN:                                            │
  │ → "Fork in the road, not sure which response"  │
  │ → "Need more context"                          │
  │ → "User wasn't specific enough"                │
  │ → "Unsure of anything"                         │
  │ → "BEFORE you give up!"                        │
  │                                                  │
  │ INPUT:                                           │
  │ → Array of questions!                          │
  │ → Suggested options per question!              │
  │                                                  │
  │ NIKE EXAMPLE:                                    │
  │ "Find me Ja Morant's in this color."            │
  │ → Found them! But no size specified!            │
  │ → Question: "What size?"                       │
  │ → Options: [8, 9, 10, 11, 12, 13, 14]         │
  │                                                  │
  │ CLAUDE CODE:                                     │
  │ → Shows questions with keyboard options!        │
  │ → "Option 1, option 2, something else,         │
  │    hit enter. That's pretty good."              │
  │                                                  │
  │ "I had this in here, but it's mostly all UI    │
  │  so I was like I don't want to do that."       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Complete Approval System

```javascript
// ═══════════════════════════════════
// COMPLETE Approval System
// ═══════════════════════════════════

import readline from "readline/promises";

// ── onToolApproval callback ──

async function createApprovalCallback() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return async ({ toolName, args }) => {
    console.log("\n" + "═".repeat(50));
    console.log(`🔒 APPROVAL REQUIRED`);
    console.log(`Tool: ${toolName}`);
    console.log(`Args: ${JSON.stringify(args, null, 2)}`);
    console.log("═".repeat(50));

    const answer = await rl.question("Approve? (yes/no): ");
    return answer.toLowerCase().startsWith("y");
  };
}

// ── Agent loop with approvals ──

async function run(messages, modelName, callbacks) {
  const modelLimits = getModelLimits(modelName);

  // ... precheck, compaction, etc ...

  while (true) {
    const response = await generateText({
      model: openai(modelName),
      messages,
      tools,
    });

    messages.push({
      role: "assistant",
      content: response.text,
      toolCalls: response.toolCalls,
    });

    if (response.toolCalls?.length) {
      let rejected = false;

      for (const toolCall of response.toolCalls) {
        // ── APPROVAL CHECK ──
        const approved = await callbacks.onToolApproval({
          toolName: toolCall.name,
          args: toolCall.args,
        });

        if (!approved) {
          rejected = true;
          break;
        }

        // Approved! Execute!
        const result = await executeTool(toolCall);
        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
        });
      }

      // Check rejection OUTSIDE the for loop!
      // "If you were rejected, break the loop."
      if (rejected) {
        break;
      }

      reportTokenUsage();
      continue;
    }

    break; // No tool calls = done!
  }

  return messages;
}
```

---

## §10. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 10.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO LLM KHÔNG BIẾT VỀ APPROVAL?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không nói LLM?
  └→ "I don't WANT the agent to decide when
     approval happens. DETERMINISTIC."

  WHY ②: Tại sao break thay vì signal?
  └→ "Simple. No wrong answer. Could signal
     which is probably better."

  WHY ③: Tại sao show args?
  └→ "Can't ask to approve write file if user
     doesn't know WHAT file and WHAT content."

  WHY ④: Tại sao check rejected outside for loop?
  └→ "If no more tool calls to make but there was
     a rejection from previous turn, catch it!"

  WHY ⑤: Tại sao approval tool fail 3 tháng?
  └→ "LLM decides NOT to use it sometimes.
     Unreliable. Can't eval. NEVER works."
```

### 10.2 Pattern ②: Mental Mapping

```
APPROVAL FLOW:
═══════════════════════════════════════════════════════════════

  LLM returns toolCalls
       │
       ▼
  for each toolCall:
       │
       ├── await onToolApproval(name, args)
       │   │
       │   ├── approved → execute! push result!
       │   │
       │   └── NOT approved → rejected = true! break!
       │
       ▼
  if (rejected) break while loop!
  else continue → loop again with results!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 36:
═══════════════════════════════════════════════════════════════

  IMPLEMENTATION:
  [ ] Approve ALL tool calls (start simple!)
  [ ] onToolApproval callback with name + args!
  [ ] rejected state tracked in-line!
  [ ] Break for loop on rejection!
  [ ] Check rejected outside for loop too!

  LLM CLUELESSNESS:
  [ ] "Has NO idea about approvals!"
  [ ] "Has NO concept it was suspended!"
  [ ] "Invisible to the model!" = DETERMINISTIC!

  ANTI-PATTERNS:
  [ ] ❌ Approval TOOL = "3 months eval, NEVER works!"
  [ ] ✅ Loop level = universal, one place!
  [ ] ⚠️ Inside tool = works but "SO many places!"

  ASK-USER TOOL:
  [ ] Different from approval! Questions + options!
  [ ] "Claude Code does this. Pretty good."
  [ ] Force specific questions from model!

  TIẾP THEO → Phần 37: Wrapping Up!
```
