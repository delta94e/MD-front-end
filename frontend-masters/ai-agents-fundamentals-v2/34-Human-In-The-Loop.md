# AI Agents Fundamentals, v2 — Phần 34: Human in the Loop — "True Freedom = Not Watching!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Human in the Loop — "RLHF, Runtime Approvals, Trust, True Productivity Gains!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Approval patterns, trust models, human oversight philosophy!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Human-in-the-Loop Contexts — "It Means MANY Things!"      |
| 2   | RLHF — "Reinforcement Learning, Human Feedback!"          |
| 3   | Runtime Approvals — "What WE'RE Doing!"                   |
| 4   | Why Approvals Matter — "True Freedom vs WATCHING!"        |
| 5   | The Productivity Promise — "Still Doing 75% Of The Work!" |
| 6   | Tự Implement: Approval Concepts                           |
| 7   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu        |

---

## §1. Human-in-the-Loop Contexts — "It Means MANY Things!"

> Scott: _"Human-in-the-loop means a LOT when it comes to AI. It's not just about what we're doing. It's different based on context."_

```
HUMAN-IN-THE-LOOP — MULTIPLE MEANINGS:
═══════════════════════════════════════════════════════════════

  ① Training & Fine-tuning → RLHF!
  ② Evals & Quality Control → Human evaluators!
  ③ Active Learning → Route uncertain to human!
  ④ Runtime Approvals → "What WE'RE doing!" ✅
```

---

## §2. RLHF — "Reinforcement Learning, Human Feedback!"

> Scott: _"The technique on which we train LLMs TODAY. Reinforcement learning — we REWARD you by not changing your weights, we PUNISH you by changing them."_

```
RLHF EXPLAINED:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ RAW MODEL → Neural networks not tuned!          │
  │ → Weights not adjusted, layers not tuned!      │
  │                                                  │
  │ WEIGHT = "A fork in the road" (0 to 1!)        │
  │ → Determines which path a node takes!          │
  │ → Eventually leads to a statistical outcome!   │
  │ → That gives you a TOKEN!                      │
  │                                                  │
  │ REINFORCEMENT LEARNING:                          │
  │ Feed pictures of dogs over and over!             │
  │ "Was this a dog? Yes or no?"                    │
  │                                                  │
  │ ✅ Got it RIGHT → Reward! Don't change weights!│
  │ ❌ Got it WRONG → Punish! Change weights!      │
  │                                                  │
  │ Repeat until model is statistically better!     │
  │                                                  │
  │ HUMAN FEEDBACK:                                  │
  │ "You need a HUMAN to give the reward/punishment."│
  │ "Although now they use LLMs as the human.       │
  │  Don't get me STARTED on that."                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Runtime Approvals — "What WE'RE Doing!"

> Scott: _"Agents requesting human approval before executing a certain action. I don't want the agent to DECIDE when approval happens. I want it DETERMINISTIC."_

```
RUNTIME APPROVALS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Things like deleting a file, running any        │
  │  terminal command — you need my APPROVAL."      │
  │                                                  │
  │ CRITICAL INSIGHT:                                │
  │ "I DON'T want the agent to DECIDE when          │
  │  approval happens. I want it DETERMINISTIC.     │
  │  Every single time."                             │
  │                                                  │
  │ OTHER CONTEXTS:                                  │
  │ • Evals: "Human subject matter expert needs     │
  │   to look because we have NO IDEA if good."     │
  │ • Active learning: "Model encounters uncertain  │
  │   prediction, routes to human for labeling."    │
  │   Example: "Alzheimer scan AI fed a kneecap.    │
  │   'What IS this?' → Human labels it."          │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Why Approvals Matter — "True Freedom vs WATCHING!"

> Scott: _"We aren't actually FREE from tasks. We've just OFFLOADED it to watching someone else do it. That's not actual freedom."_

```
THE TRUST PROBLEM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ TWO GENERATIONS:                                 │
  │                                                  │
  │ US (knew world before LLMs!):                    │
  │ → "We DON'T trust it."                         │
  │ → "Because we know what it was like before."   │
  │                                                  │
  │ NEW GENERATION:                                  │
  │ → "Trusts LLMs entirely."                      │
  │ → "Like we trusted Google."                    │
  │                                                  │
  │ RESULT:                                          │
  │ "We aren't actually FREE from these tasks.      │
  │  We've just offloaded it to WATCHING someone    │
  │  else do it."                                    │
  │                                                  │
  │ "I went from TYPING to WATCHING somebody else   │
  │  type and then typing sometimes."               │
  │                                                  │
  │ "It's great that LLMs make us 20X engineers.    │
  │  But I'm still SITTING IN MY EDITOR watching    │
  │  Cursor work just to see what's going on."      │
  │                                                  │
  └──────────────────────────────────────────────────┘

  THE CODE REVIEW ANALOGY:
  ┌──────────────────────────────────────────────────┐
  │ "That's how we work as engineers ANYWAY."       │
  │                                                  │
  │ → PRs and code reviews!                        │
  │ → Someone works on their own time!             │
  │ → Random time: asks for review!                │
  │ → You get to it when you get to it!            │
  │ → "Yes or no, fix this, don't fix that."       │
  │                                                  │
  │ "What if EVERYTHING was like that?"             │
  │ → "The agent's not going to feel BAD, OK?"     │
  │ → No guilt! No urgency pressure!               │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. The Productivity Promise — "Still Doing 75% Of The Work!"

> Scott: _"The ratio goes from 1 to 0.75. We're still doing 75% of it, just a different TYPE of work. I'd rather be at 0.25."_

```
PRODUCTIVITY REALITY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ PROMISE: "LLMs will free us!"                   │
  │ REALITY: "We trade typing for watching."        │
  │                                                  │
  │ BEFORE LLMs: 1.0x effort (100%)                 │
  │ NOW:         0.75x effort (75%) — different type!│
  │ GOAL:        0.25x effort (25%) — true freedom! │
  │                                                  │
  │ "We're just TRADING. Not FREEING."              │
  │ "We're bound to chat interfaces that require    │
  │  us to SIT HERE and WAIT for tokens to stream   │
  │  just to be like: why'd you do that?"           │
  │                                                  │
  │ "Human-in-the-loop is ONE of the things we      │
  │  need to get us to that NEXT LEVEL of true      │
  │  productivity gains."                            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Tự Implement: Approval Concepts

```javascript
// ═══════════════════════════════════
// Approval Pattern — Conceptual
// ═══════════════════════════════════

// The key insight: DETERMINISTIC, not agent-decided!

// ❌ BAD: Agent decides when to ask
const badApprovalTool = tool({
  name: "askForApproval",
  description: "Ask user for approval before dangerous ops",
  // "What if it decided NOT to do that on one
  //  of the tools? You're SCREWED."
});

// ✅ GOOD: System ALWAYS asks, agent doesn't know
async function executeWithApproval(toolCall, callbacks) {
  // Agent has NO IDEA about approvals!
  // System handles it deterministically!
  const approved = await callbacks.onToolApproval({
    toolName: toolCall.name,
    args: toolCall.args,
  });

  if (!approved) {
    return { rejected: true };
  }

  // Execute the tool normally
  return await toolCall.execute(toolCall.args);
}

// The agent doesn't even know it was suspended!
// "It has NO concept about approvals."
```

---

## §7. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 7.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO APPROVAL PHẢI DETERMINISTIC?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không để agent quyết định?
  └→ "What if it decided NOT to? You're SCREWED."

  WHY ②: Tại sao không tạo approval tool?
  └→ "I spent 3 MONTHS trying to eval that.
     It's NEVER gonna work."

  WHY ③: Tại sao agent không biết về approval?
  └→ "Has no concept. Doesn't know it was suspended.
     Doesn't know if user approved or not."

  WHY ④: Tại sao chưa đạt true freedom?
  └→ "Still sitting in editor WATCHING Cursor work.
     Trading typing for watching. Not free."

  WHY ⑤: Tại sao HITL là next level?
  └→ "Guarantees nothing bad happens WITHOUT me
     sitting at my computer. THAT is freedom."
```

### 7.2 Pattern ②: Trade-off Analysis

```
WHERE TO IMPLEMENT APPROVALS:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬───────────────┬───────────────────┐
  │ Approach        │ Pros          │ Cons              │
  ├─────────────────┼───────────────┼───────────────────┤
  │ Approval tool   │ Agent-aware   │ "NEVER works!"   │
  │ (agent decides) │               │ "3 months eval!"  │
  ├─────────────────┼───────────────┼───────────────────┤
  │ Inside tool     │ Per-tool ctrl │ "Write in SO many │
  │ (in execute)    │               │  places!"         │
  ├─────────────────┼───────────────┼───────────────────┤
  │ Loop level ✅   │ Deterministic │ "All or nothing   │
  │ (system decides)│ Universal!    │  (start here!)"   │
  └─────────────────┴───────────────┴───────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 34:
═══════════════════════════════════════════════════════════════

  HUMAN-IN-THE-LOOP:
  [ ] Multiple contexts: RLHF, evals, active learning, runtime!
  [ ] RLHF: reward by NOT changing weights, punish BY changing!
  [ ] Runtime approvals = what we're building!

  APPROVALS:
  [ ] DETERMINISTIC, not agent-decided!
  [ ] Agent has NO CONCEPT of approvals!
  [ ] "Don't make an approval tool. 3 months eval. NEVER works."

  TRUE FREEDOM:
  [ ] "Still doing 75% of work, different type!"
  [ ] "Sitting in editor watching = not freedom!"
  [ ] Code review analogy: async, no guilt!

  TIẾP THEO → Phần 35: Approval Flow Architectures!
```
