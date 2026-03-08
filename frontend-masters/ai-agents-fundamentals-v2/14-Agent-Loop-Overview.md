# AI Agents Fundamentals, v2 — Phần 14: Agent Loop Overview — "While True — The Heart Of Every Agent!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Agent Loop Overview — "Workflow = Known Paths. Agent = UNKNOWN. You Need A Loop!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Conceptual — Why loops, when to use agents!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | Workflow vs Agent — "Known vs Unknown Steps!"        |
| 2   | The Loop — "While True Until Done!"                  |
| 3   | Stop Reasons — "When To Kill The Loop!"              |
| 4   | Streaming vs Generating — "Token By Token!"          |
| 5   | Agency Spectrum — "Most Problems Don't Need Agents!" |
| 6   | Tự Implement: Agent Loop Pseudocode                  |
| 7   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu   |

---

## §1. Workflow vs Agent — "Known vs Unknown Steps!"

> Scott: _"If you know how many nodes there are, you can traverse with a FINITE loop. But if it's unknown, you need recursion or a while loop."_

```
WORKFLOW vs AGENT — THE CORE DIFFERENCE:
═══════════════════════════════════════════════════════════════

  WORKFLOW (deterministic!):
  ┌──────────────────────────────────────────────────┐
  │ "A set of NODES. Each node is some work.         │
  │  There's a PATH where a node traverses           │
  │  to another node."                               │
  │                                                  │
  │ Email comes in                                   │
  │     │                                            │
  │     ▼                                            │
  │ Is it long?                                      │
  │   ├── YES → Summarize it                        │
  │   └── NO  → Forward it                          │
  │                                                  │
  │ YOU decide the paths! DETERMINISTIC!             │
  │ Number of steps = KNOWN!                         │
  │ → Use a for loop or fixed path!                │
  │                                                  │
  └──────────────────────────────────────────────────┘

  AGENT (non-deterministic!):
  ┌──────────────────────────────────────────────────┐
  │ "We don't really know what the end goal is.      │
  │  We have to give all that AGENCY to the LLM     │
  │  and let it decide when it's time to finish."   │
  │                                                  │
  │ User prompt → ???                               │
  │     │                                            │
  │     ▼                                            │
  │ while (true) {                                   │
  │   LLM decides → tool call? → execute!          │
  │              → ready? → RESPOND & BREAK!       │
  │ }                                                │
  │                                                  │
  │ Number of steps = UNKNOWN!                       │
  │ → Need while loop or recursion!                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```
WHEN TO USE WHAT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Workflow      │ Agent             │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Steps known?     │ ✅ Yes!       │ ❌ No!            │
  │ Deterministic?   │ ✅ Always!    │ ❌ Varies!        │
  │ Cost efficient?  │ ✅ Predictable│ ⚠️ Unpredictable! │
  │ Resilient?       │ ✅ Very!      │ ⚠️ Depends!       │
  │ Use case         │ Business logic│ General tasks!    │
  │                  │               │                   │
  │ "Most business use cases are probably easily     │
  │  solved with WORKFLOWS. You can just add LLMs   │
  │  into different NODES on that workflow."         │
  │                                                  │
  │ "Agents aren't a solution for MOST problems."   │
  └──────────────────┴───────────────┴───────────────────┘
```

---

## §2. The Loop — "While True Until Done!"

> Scott: _"It's just going to be a while loop. Give the LLM the new user message. The LLM is either going to say 'I'm done' or 'hey, can you call this tool for me?'"_

```
THE AGENT LOOP — PSEUDOCODE:
═══════════════════════════════════════════════════════════════

  messages = [systemPrompt, ...history, userMessage]

  while (true) {
    // 1. Send messages to LLM
    response = await LLM(messages)

    // 2. Check what LLM wants
    if (response.hasToolCalls) {
      // LLM: "Call these tools for me!"
      for (toolCall of response.toolCalls) {
        result = await execute(toolCall)
        messages.push(toolCall)    // "It generated
        messages.push(result)      //  but doesn't SEE it!"
      }
      // CONTINUE loop!
    } else {
      // LLM: "I'm done! Here's my answer."
      messages.push(response)
      break  // END loop!
    }
  }
```

```
THE MESSAGES DANCE:
═══════════════════════════════════════════════════════════════

  ITERATION 1:
  ┌──────────────────────────────────────────────────┐
  │ messages = [                                     │
  │   { role: "system", content: "..." },           │
  │   { role: "user", content: "Read foo.txt" },    │
  │ ]                                                │
  │ → LLM says: "Call readFile!"                   │
  │ → Push tool call + result!                     │
  └──────────────────────────────────────────────────┘

  ITERATION 2:
  ┌──────────────────────────────────────────────────┐
  │ messages = [                                     │
  │   { role: "system", content: "..." },           │
  │   { role: "user", content: "Read foo.txt" },    │
  │   { role: "assistant", toolCall: "readFile" },  │
  │   { role: "tool", result: "contents of foo" },  │
  │ ]                                                │
  │ → LLM sees tool result!                        │
  │ → LLM says: "Here's foo.txt content: ..."     │
  │ → No more tool calls! BREAK!                   │
  └──────────────────────────────────────────────────┘
```

---

## §3. Stop Reasons — "When To Kill The Loop!"

> Scott: _"If it's up to the LLM, it'll just keep going until it's ready to respond. But we can step in."_

```
STOP REASONS — WHO CONTROLS THE EXIT:
═══════════════════════════════════════════════════════════════

  LLM-CONTROLLED:
  ┌──────────────────────────────────────────────────┐
  │ ① LLM is ready to answer! (no more tool calls) │
  │ → "Cool, I have everything. Here's my answer." │
  │ → finishReason !== "tool-calls"                │
  └──────────────────────────────────────────────────┘

  SYSTEM-CONTROLLED:
  ┌──────────────────────────────────────────────────┐
  │ ② Token limit! "This is costing too much!"     │
  │ ③ Max iterations! "We've looped 50 times!"     │
  │ ④ Error threshold! "3 tool errors, stop!"      │
  │ ⑤ Timeout! "This is taking too long!"          │
  │ ⑥ User intervention! "Ctrl+C!"                 │
  │                                                  │
  │ "We don't want to give the LLM control of that.│
  │  That'll be a WASTE OF TOKENS."                 │
  │                                                  │
  │ EXAMPLE:                                         │
  │ "If the tool threw an error and that should      │
  │  kill our server — like a 500 — we don't need  │
  │  to feed that to the LLM. Just recover your     │
  │  server."                                        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Streaming vs Generating — "Token By Token!"

> Scott: _"We want to STREAM the tokens versus generating them at once. It's just a better experience."_

```
GENERATE TEXT vs STREAM TEXT:
═══════════════════════════════════════════════════════════════

  generateText (what we've been doing):
  ┌──────────────────────────────────────────────────┐
  │ await generateText({ ... })                      │
  │                                                  │
  │ [waiting... waiting... waiting...]               │
  │                                                  │
  │ BOOM! "Here's ALL the text at once!" 😱         │
  │ "Jump scares you"                                │
  └──────────────────────────────────────────────────┘

  streamText (what we're building!):
  ┌──────────────────────────────────────────────────┐
  │ const stream = streamText({ ... })               │
  │                                                  │
  │ H...e...l...l...o...,...                         │
  │ h...e...r...e...'...s...                         │
  │ Token by token! ✨                               │
  │                                                  │
  │ "An experience we all EXPECT from chat."        │
  │ "More performant. Just better."                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Agency Spectrum — "Most Problems Don't Need Agents!"

> Scott: _"Most business use cases are probably easily solved with workflows. That's the more resilient, accurate, deterministic, cost efficient approach."_

```
WHEN TO USE AGENTS:
═══════════════════════════════════════════════════════════════

  Agents are BEST when:
  ┌──────────────────────────────────────────────────┐
  │ ① Unknown number of steps!                      │
  │ ② Steps themselves aren't clear!                │
  │ ③ Problem is GENERAL, not specific!             │
  │                                                  │
  │ "That's why GENERAL agents are the #1 use case. │
  │  In being general there is no specific problem  │
  │  to solve. The only thing that could solve it   │
  │  is something that can keep going."             │
  └──────────────────────────────────────────────────┘

  Workflows are BEST when:
  ┌──────────────────────────────────────────────────┐
  │ "Most business problems are WELL DEFINED.        │
  │  They don't need to be reinvented every time.    │
  │  They're usually the same always."              │
  │                                                  │
  │ → Process emails? Workflow!                    │
  │ → Generate invoices? Workflow!                 │
  │ → Route customer tickets? Workflow!             │
  │                                                  │
  │ "Maybe they change and then you change the       │
  │  workflow. But they definitely don't change      │
  │  EVERY SINGLE TIME."                            │
  └──────────────────────────────────────────────────┘
```

---

## §6. Tự Implement: Agent Loop Pseudocode

```javascript
// THE AGENT LOOP — Built from scratch!

async function agentLoop(userMessage, systemPrompt, tools) {
  // 1. Build initial messages
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  let fullResponse = "";

  // 2. THE LOOP!
  while (true) {
    // Call LLM with current messages
    const response = await callLLM(messages);

    // Check: does LLM want tool calls?
    if (response.toolCalls && response.toolCalls.length > 0) {
      // Push the assistant's tool call message!
      // "It generated but DOESN'T SEE IT unless we push!"
      messages.push({
        role: "assistant",
        tool_calls: response.toolCalls,
      });

      // Execute each tool call!
      for (const tc of response.toolCalls) {
        const result = await tools[tc.name].execute(tc.args);

        // Push tool result!
        // "The very next thing after a tool call MUST be
        //  the tool result. Otherwise OpenAI = ERROR!"
        messages.push({
          role: "tool",
          tool_call_id: tc.id, // MUST match!
          content: JSON.stringify(result),
        });
      }

      // Continue the loop!
      continue;
    }

    // No tool calls! LLM is ready to respond!
    fullResponse = response.text;

    // Push response to messages for future conversations
    messages.push({
      role: "assistant",
      content: fullResponse,
    });

    break; // EXIT the loop!
  }

  return { response: fullResponse, messages };
}
```

---

## §7. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 7.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO CẦN AGENT LOOP?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không dùng generateText + maxSteps?
  └→ "We had it for free with Vercel AI SDK.
     Now we're building it from scratch."
     Tự build = hiểu sâu + kiểm soát hoàn toàn!

  WHY ②: Tại sao while(true)?
  └→ Vì KHÔNG BIẾT bao nhiêu steps!
     "We don't really know what the end goal is."

  WHY ③: Tại sao push tool call VÀ result?
  └→ "Generated but doesn't SEE it. Must put
     back in array. Otherwise LLM: 'what are you
     talking about? I didn't say that.'"

  WHY ④: Tại sao cần system-controlled stops?
  └→ "We don't want to give LLM control of that.
     That'll be a WASTE OF TOKENS. Just recover server."

  WHY ⑤: Tại sao streaming thay vì generating?
  └→ "It just JUMP SCARES you."
     Better UX! Expected from chat experience!
```

### 7.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — THE LOOP:
═══════════════════════════════════════════════════════════════

  Agent = while(true) + LLM + tools + messages array

  ┌──────────────────────────────────────────────────┐
  │ CORE MECHANIC:                                   │
  │ → LLM sees messages, generates response!       │
  │ → Response = text? → Done! Break!              │
  │ → Response = tool calls? → Execute, push,      │
  │   continue loop!                                 │
  │                                                  │
  │ The messages array IS the memory!               │
  │ "You can FAKE a conversation. You can say        │
  │  'no, you DID say this,' and if role was         │
  │  assistant, LLM: 'oh yeah, I said that.'"      │
  └──────────────────────────────────────────────────┘
```

### 7.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ generateText  │ streamText        │
  ├──────────────────┼───────────────┼───────────────────┤
  │ UX               │ ❌ Jump scare │ ✅ Token by token │
  │ Complexity       │ ✅ Simple     │ ⚠️ More code      │
  │ Performance      │ ⚠️ Wait all   │ ✅ Progressive    │
  │ Error handling   │ ✅ One try    │ ⚠️ Stream errors  │
  └──────────────────┴───────────────┴───────────────────┘
```

### 7.4 Pattern ④: Mental Mapping

```
MENTAL MAP — AGENT LOOP:
═══════════════════════════════════════════════════════════════

  User message
       │
       ▼
  [system, ...history, user] ← messages array!
       │
       ▼
  ┌─── while(true) ──────────────────────────┐
  │                                           │
  │  streamText(messages, tools) → response  │
  │       │                                   │
  │       ├── text-delta? → accumulate text! │
  │       ├── tool-call? → collect calls!    │
  │       └── error? → handle gracefully!    │
  │       │                                   │
  │  finishReason?                            │
  │       ├── NOT tool-calls → BREAK! ──────→ EXIT
  │       └── tool-calls:                     │
  │            ├── push tool call messages!   │
  │            ├── execute tools!             │
  │            ├── push results!              │
  │            └── continue loop! ──────────→ TOP
  │                                           │
  └───────────────────────────────────────────┘
```

### 7.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — Messages Array Manipulation:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ABORT A TOOL CALL:                               │
  │ "Just wouldn't add the tool call to the array.  │
  │  The LLM didn't know it asked you to do it."    │
  │                                                  │
  │ FAKE A CONVERSATION:                             │
  │ "Put whatever you want. Role assistant? LLM     │
  │  thinks it said that. Easy to manipulate."      │
  │                                                  │
  │ INJECT CONTEXT:                                  │
  │ "Put system message mid-conversation for        │
  │  dynamic instructions."                          │
  │                                                  │
  │ The messages array is THE source of truth.      │
  │ Nothing exists outside of it!                   │
  └──────────────────────────────────────────────────┘
```

### 7.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — FROM SINGLE CALL TO AGENT LOOP:
═══════════════════════════════════════════════════════════════

  Single LLM call (prompt → text):
  │ → "Hello World" of AI!
  │
  ↓
  LLM + tools (generateText + maxSteps):
  │ → SDK handles loop for us!
  │ → Good enough for 90% of cases!
  │
  ↓
  Manual loop (what we're building!):
  │ → Full control!
  │ → Custom stop conditions!
  │ → Approvals, streaming, error handling!
  │ → "I personally don't use traditional tool loop.
  │    Not because it's not good — 90% of problem.
  │    But there's a lot of VALUE in creating your own."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 14:
═══════════════════════════════════════════════════════════════

  CONCEPTS:
  [ ] Workflow = known steps, for loop!
  [ ] Agent = unknown steps, while loop!
  [ ] "Most business use cases = WORKFLOWS!"
  [ ] General agents = best use case for agents!

  THE LOOP:
  [ ] while(true) → LLM decides when to stop!
  [ ] Tool call → execute, push results, continue!
  [ ] No tool call → respond, break!
  [ ] Must push BOTH tool call AND result to messages!

  STOP REASONS:
  [ ] LLM ready (no tool calls!)
  [ ] Token limit, max iterations, error threshold!
  [ ] "Don't waste tokens on system errors!"

  STREAMING:
  [ ] streamText instead of generateText!
  [ ] Token by token vs "jump scare!"
  [ ] Same arguments, different output!

  TIẾP THEO → Phần 15: Coding an Agent Loop!
```
