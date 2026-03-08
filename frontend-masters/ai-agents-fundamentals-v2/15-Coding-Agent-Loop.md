# AI Agents Fundamentals, v2 — Phần 15: Coding an Agent Loop — "While True, Stream Text, Tool Calls!"

> 📅 2026-03-07 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Coding an Agent Loop — "We're Building The Loop FROM SCRATCH!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Full streaming agent loop!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | Setup — "Filter Messages, Stream Text!"                 |
| 2   | Working History & Messages — "System + History + User!" |
| 3   | The While Loop — "While True, I Promise It'll Stop!"    |
| 4   | Streaming Chunks — "text-delta vs tool-call!"           |
| 5   | Error Handling — "Graceful, Not Explosive!"             |
| 6   | Finish Reason — "Done Or Need More Tools?"              |
| 7   | Tool Call Execution — "Push TWICE, Always!"             |
| 8   | Aborting Tool Calls — "Just Don't Put It In The Array!" |
| 9   | Tự Implement: Full Streaming Agent Loop                 |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu      |

---

## §1. Setup — "Filter Messages, Stream Text!"

> Scott: _"What we show the user in the UI and what the LLM sees might be TWO DIFFERENT THINGS. The LLM would actually ERROR if you showed it UI-specific stuff."_

```
FILTER MESSAGES — WHY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ UI MESSAGES (what user sees):                    │
  │ → Rich objects! Statuses! Token counts!         │
  │ → Approval buttons! Spinners! Metadata!         │
  │ → Human-friendly formatting!                    │
  │                                                  │
  │ LLM MESSAGES (what LLM needs):                   │
  │ → Simple objects! role + content!               │
  │ → No UI metadata! No statuses!                  │
  │ → "The LLM not only does it NOT want to see     │
  │    that, it would actually ERROR if you showed  │
  │    it that!"                                     │
  │                                                  │
  │ SOLUTION:                                        │
  │ filterCompatibleMessages(conversationHistory)    │
  │ → Strips UI-only fields!                       │
  │ → Returns only LLM-compatible messages!        │
  │                                                  │
  │ "In production, you'd have TWO SEPARATE SYSTEMS.│
  │  Chat state vs conversation state."             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```javascript
// IMPORTS
import { streamText } from "ai";
import { filterCompatibleMessages } from "./system/filterMessages";
import { openai } from "@ai-sdk/openai";

// "Same arguments as generateText. Nothing's different.
//  Just a different name. Everything's exactly the same
//  except we don't await it."
```

---

## §2. Working History & Messages — "System + History + User!"

> Scott: _"The system prompt is like the preamble. The hidden instructions. If you use ChatGPT there's a settings where you can add custom instructions — that's the system prompt."_

```javascript
// BUILD THE MESSAGES ARRAY

// 1. Filter UI messages → LLM-compatible only!
const workingHistory = filterCompatibleMessages(conversationHistory);

// 2. Build messages array!
const messages = [
  // FIRST: System prompt (always first!)
  {
    role: "system",
    content: systemPrompt,
    // "Usually the first message. You don't NEED one,
    //  but it's pretty great. As reasoning models
    //  become a thing, it becomes less of a thing."
  },

  // SECOND: Conversation history (filtered!)
  ...workingHistory,
  // "The chat so far, filtered from the UI."

  // THIRD: New user message (always last!)
  {
    role: "user",
    content: userMessage,
    // "This is what we used for 'prompt' on generateText.
    //  Instead we put it here in messages array."
  },
];
```

```
MESSAGES ARRAY STRUCTURE:
═══════════════════════════════════════════════════════════════

  messages = [
    ┌──────────────────────────────────────────┐
    │ { role: "system", content: "..." }       │ ← #1 Always!
    ├──────────────────────────────────────────┤
    │ { role: "user", content: "..." }         │ ← History
    │ { role: "assistant", content: "..." }    │ ← History
    │ { role: "user", content: "..." }         │ ← History
    │ { role: "assistant", content: "..." }    │ ← History
    ├──────────────────────────────────────────┤
    │ { role: "user", content: userMessage }   │ ← #LAST Always!
    └──────────────────────────────────────────┘

    "Last message = role user → LLM RESPONDS!"
    "If it was assistant → LLM waits on YOU!"
```

---

## §3. The While Loop — "While True, I Promise It'll Stop!"

> Scott: _"I know you're probably like 'I don't want to run a while true loop on my computer,' but trust me, it'll be fine. We'll have our stop cases."_

```javascript
// THE LOOP STRUCTURE

let fullResponse = ""; // Entire response across ALL turns!

while (true) {
  // streamText instead of generateText!
  // "We don't await this because it's a STREAM.
  //  It's like a generator that yields new tokens."
  const result = streamText({
    model: openai(modelName),
    messages,
    tools,
    experimental_telemetry: {
      /* Laminar tracing */
    },
    // "Literally the same arguments as generateText.
    //  Nothing's different. Just a different name."
  });

  // Track state for THIS turn
  let toolCalls = []; // Tool calls collected this turn
  let currentText = ""; // Text for just this turn
  let streamError = null; // Any errors from stream

  // ... (process stream chunks)
  // ... (handle finish reason)
  // ... (execute tool calls or break)
}
```

---

## §4. Streaming Chunks — "text-delta vs tool-call!"

> Scott: _"As a new chunk comes in, we check the type. text-delta = new token. tool-call = LLM wants a function."_

```javascript
// PROCESSING THE STREAM

try {
  for await (const chunk of result.fullStream) {
    // CASE 1: Text token!
    if (chunk.type === "text-delta") {
      currentText += chunk.textDelta;
      // Show in terminal token by token!
      callbacks.onToken(chunk.textDelta);
      // "This is literally rendering it on the screen."
    }

    // CASE 2: Tool call!
    if (chunk.type === "tool-call") {
      const input = chunk.input || {};
      toolCalls.push({
        toolCallId: chunk.toolCallId,
        // "The LLM GENERATES this ID. We MUST reuse it
        //  to respond back. If ID doesn't match = ERROR!"
        toolName: chunk.toolName,
        // "This helps us figure out WHICH function to call."
        args: input,
        // "The arguments to pass into that function."
      });

      // Show spinner in UI!
      callbacks.onToolCallStart(chunk.toolName, input);
    }
  }
} catch (error) {
  streamError = error;
  // Check if it's a real error or just "no output"
  if (!currentText && !error.message.includes("no output generated")) {
    throw error; // Real error! Let it crash!
  }
}
```

```
CHUNK TYPES EXPLAINED:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ chunk.type === "text-delta"                      │
  │ → LLM is generating TEXT!                      │
  │ → chunk.textDelta = "Hell" (a few chars!)      │
  │ → Append to currentText!                       │
  │ → Show in UI token by token!                   │
  │                                                  │
  │ chunk.type === "tool-call"                       │
  │ → LLM wants to call a FUNCTION!                │
  │ → chunk.toolCallId = "call_abc123"             │
  │ → chunk.toolName = "readFile"                  │
  │ → chunk.input = { path: "foo.txt" }            │
  │ → Collect into toolCalls array!                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Error Handling — "Graceful, Not Explosive!"

> Scott: _"If there is no current text and a stream error, we want to show the user something and break. Don't just crash."_

```javascript
// AFTER THE STREAM LOOP

// Append this turn's text to full response
fullResponse += currentText;

// Error case: stream failed, no text generated
if (streamError && !currentText) {
  // Show a friendly error message!
  const errorMsg = "Sorry about that, I'm working on it.";
  callbacks.onToken(errorMsg);
  break; // End the loop gracefully!
}

// "This is where you get the LLM to say some
//  DETERMINISTIC error message when there shouldn't
//  have been an error."
```

---

## §6. Finish Reason — "Done Or Need More Tools?"

> Scott: _"An LLM will keep generating until it has a finish reason. Either 'I'm done' or 'I need you to call a tool.'"_

```javascript
// CHECK FINISH REASON

const finishReason = await result.finishReason;
// "Wait until stream is COMPLETELY done."

// BREAK CASE: No tool calls! LLM is ready to answer!
if (finishReason !== "tool-calls" && toolCalls.length === 0) {
  // Get response messages and push them!
  const responseMessages = await result.response;
  messages.push(...responseMessages.messages);
  // "If we don't push, user replies and LLM says
  //  'what are you talking about? I didn't say that!'
  //  Because it DOESN'T REMEMBER unless it's in array."
  break;
}

// If we get HERE → tool calls exist!
// "We can assume the LLM said: 'Hey, I need you to
//  run these functions for me right quick.'"
```

```
FINISH REASONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ finishReason: "stop"                             │
  │ → "I'm done generating. Here's my answer."     │
  │ → BREAK the loop!                              │
  │                                                  │
  │ finishReason: "tool-calls"                       │
  │ → "I need you to call these tools for me."     │
  │ → Execute tools, push results, CONTINUE!       │
  │                                                  │
  │ finishReason: "length"                           │
  │ → "I ran out of tokens."                       │
  │ → Handle gracefully!                           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tool Call Execution — "Push TWICE, Always!"

> Scott: _"In the case of a tool call, you push at LEAST twice. Once for the tool call the LLM generated, once for the result after executing it."_

```javascript
// TOOL CALL BRANCH

// 1. Push the LLM's response (tool calls!)
const responseMessages = await result.response;
messages.push(...responseMessages.messages);
// "Because it generated but DOESN'T SEE IT.
//  You still got to put it in the array."

// 2. Execute each tool call and push results!
for (const tc of toolCalls) {
  // Execute the tool!
  const result = await tools[tc.toolName].execute(tc.args);

  // Push the result back to messages!
  messages.push({
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: tc.toolCallId, // MUST match!
        result: JSON.stringify(result),
      },
    ],
  });
}

// Continue the while loop! 🔄
// Next iteration: LLM sees tool results, decides next step!
```

```
WHY PUSH TWICE:
═══════════════════════════════════════════════════════════════

  BEFORE TOOL EXECUTION:
  messages = [
    system, ...history, user
  ]

  AFTER LLM RESPONDS WITH TOOL CALL:
  messages = [
    system, ...history, user,
    assistant: { toolCall: readFile("foo.txt") },  ← PUSH 1!
  ]

  AFTER TOOL EXECUTION:
  messages = [
    system, ...history, user,
    assistant: { toolCall: readFile("foo.txt") },  ← PUSH 1!
    tool: { id: "call_abc", result: "contents..." }, ← PUSH 2!
  ]

  "If you respond to a tool call WITHOUT the result,
   OpenAI gives you an API ERROR. 'The very next thing
   after a tool call MUST be the tool result.'"

  PARALLEL TOOL CALLS:
  messages = [
    ...,
    assistant: { toolCalls: [readFile, writeFile] }, ← PUSH!
    tool: { id: "call_1", result: "..." },           ← PUSH!
    tool: { id: "call_2", result: "..." },           ← PUSH!
  ]
```

---

## §8. Aborting Tool Calls — "Just Don't Put It In The Array!"

> Scott: _"Just wouldn't add the tool call into the messages array. You would just ignore it. And the LLM didn't know that it asked you to do it."_

```
HOW TO ABORT A TOOL CALL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ LLM: "Please call deleteFile('important.db')"  │
  │                                                  │
  │ YOUR OPTIONS:                                    │
  │                                                  │
  │ ① EXECUTE (normal flow):                         │
  │ → messages.push(toolCall)                      │
  │ → messages.push(result)                        │
  │ → Continue loop!                               │
  │                                                  │
  │ ② ABORT (skip it!):                              │
  │ → Just DON'T push the tool call to messages!   │
  │ → LLM never knows it asked!                    │
  │ → "Even though it generated it, it doesn't     │
  │    remember. If it's not in the array,          │
  │    it didn't happen."                            │
  │ → Start fresh or inject different message!     │
  │                                                  │
  │ "That's the truth — the messages array IS       │
  │  the source of truth for everything."           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Full Streaming Agent Loop

```javascript
// COMPLETE AGENT LOOP — From scratch!

// ═══════════════════════════════════
// STEP 1: Message filtering
// ═══════════════════════════════════

function filterCompatibleMessages(messages) {
  return messages
    .filter((msg) => {
      // Only keep standard roles!
      const validRoles = ["system", "user", "assistant", "tool"];
      if (!validRoles.includes(msg.role)) return false;

      // Must have content or tool_calls!
      if (!msg.content && !msg.tool_calls) return false;

      // Filter out UI-only metadata!
      return true;
    })
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {}),
      ...(msg.tool_call_id ? { tool_call_id: msg.tool_call_id } : {}),
    }));
}

// "In production, you'd have TWO SEPARATE SYSTEMS.
//  Chat state vs conversation state.
//  We don't have a database, so we filter instead."
```

```javascript
// ═══════════════════════════════════
// STEP 2: The Agent Loop!
// ═══════════════════════════════════

async function agentLoop({
  userMessage,
  systemPrompt,
  conversationHistory = [],
  tools = {},
  model = "gpt-4o-mini",
  maxIterations = 20,
  onToken = () => {},
  onToolCall = () => {},
}) {
  // Build initial messages
  const filteredHistory = filterCompatibleMessages(conversationHistory);
  const messages = [
    { role: "system", content: systemPrompt },
    ...filteredHistory,
    { role: "user", content: userMessage },
  ];

  let fullResponse = "";
  let iteration = 0;

  while (true) {
    iteration++;

    // Safety: max iterations!
    if (iteration > maxIterations) {
      console.log("⚠️ Max iterations reached!");
      break;
    }

    // Call LLM (streaming!)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        tools: Object.entries(tools).map(([name, t]) => ({
          type: "function",
          function: {
            name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        stream: false, // Simplified — not streaming in raw impl
      }),
    });

    const data = await response.json();
    const choice = data.choices[0];
    const assistantMessage = choice.message;

    // Push assistant response to messages!
    messages.push(assistantMessage);

    // Check for tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute each tool call!
      for (const tc of assistantMessage.tool_calls) {
        const toolName = tc.function.name;
        const args = JSON.parse(tc.function.arguments || "{}");

        onToolCall(toolName, args);
        console.log(`🔧 Calling: ${toolName}(${JSON.stringify(args)})`);

        // Execute!
        let result;
        try {
          result = await tools[toolName].execute(args);
        } catch (err) {
          result = { error: err.message };
        }

        // Push tool result! (MUST match toolCallId!)
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Continue the loop!
      // "Next iteration: LLM sees tool results,
      //  decides what to do next!"
      continue;
    }

    // No tool calls! LLM is done!
    fullResponse = assistantMessage.content || "";
    onToken(fullResponse);
    break;
  }

  return {
    response: fullResponse,
    messages,
    iterations: iteration,
  };
}
```

```javascript
// ═══════════════════════════════════
// STEP 3: Using the Agent Loop!
// ═══════════════════════════════════

const tools = {
  readFile: {
    description: "Read the contents of a file at the specified path",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
    execute: async ({ path }) => {
      const fs = await import("fs/promises");
      return await fs.readFile(path, "utf-8");
    },
  },
  writeFile: {
    description: "Write content to a file at the specified path",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to write" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
    execute: async ({ path, content }) => {
      const fs = await import("fs/promises");
      await fs.writeFile(path, content, "utf-8");
      return { success: true, path };
    },
  },
};

// Run it!
const result = await agentLoop({
  userMessage: "Read the package.json and tell me the project name",
  systemPrompt: "You are a helpful coding agent.",
  tools,
  onToken: (text) => process.stdout.write(text),
  onToolCall: (name, args) =>
    console.log(`\n🔧 ${name}: ${JSON.stringify(args)}`),
});

console.log(`\n\n✅ Done in ${result.iterations} iterations!`);
```

---

## §10. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 10.1 Pattern ①: 5 Whys — Agent Loop

```
5 WHYS: TẠI SAO THIẾT KẾ NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao filter messages?
  └→ "UI shows rich objects. LLM would ERROR if you
     showed it that. Two different things!"

  WHY ②: Tại sao push tool call VÀ result?
  └→ "Generated but doesn't SEE it. If you respond
     to user without pushing, LLM: 'I didn't say that.'"
     OpenAI: "very next thing after tool call MUST
     be the result. Otherwise = API ERROR!"

  WHY ③: Tại sao toolCallId phải match?
  └→ "The only way to match tool call request to response
     is this ID. If it doesn't match or is missing = ERROR."

  WHY ④: Tại sao streamText thay vì generateText?
  └→ "Generate = jump scare. Stream = token by token.
     Better UX, more performant. Expected from chat."

  WHY ⑤: Tại sao fullResponse VÀ currentText?
  └→ fullResponse = entire response across ALL turns!
     currentText = just this one turn inside the loop!
     Different scopes, different purposes!
```

### 10.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — STREAMING LOOP:
═══════════════════════════════════════════════════════════════

  STREAM = Iterable that yields chunks

  ┌──────────────────────────────────────────────────┐
  │ Each chunk has a TYPE:                           │
  │ → "text-delta" = LLM generating text!          │
  │ → "tool-call" = LLM wants a function!          │
  │                                                  │
  │ After stream completes:                          │
  │ → finishReason tells us WHY it stopped!        │
  │ → "stop" = done! "tool-calls" = needs tools!   │
  │                                                  │
  │ Key variables:                                   │
  │ → fullResponse (across all turns!)             │
  │ → currentText (this turn only!)                │
  │ → toolCalls[] (collected this turn!)            │
  │ → streamError (graceful error handling!)        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 10.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Message approach │ Separate DBs  │ Filter function   │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Production ready │ ✅ Yes!       │ ⚠️ Prototype!     │
  │ Complexity       │ ⚠️ More infra │ ✅ Simple!        │
  │ Data loss risk   │ ✅ Isolated   │ ⚠️ Can lose data  │
  │                  │               │                   │
  │ "In production, you'd have TWO SEPARATE SYSTEMS. │
  │  But we don't have a database."                  │
  └──────────────────┴───────────────┴───────────────────┘
```

### 10.4 Pattern ④: Mental Mapping

```
MENTAL MAP — ONE LOOP ITERATION:
═══════════════════════════════════════════════════════════════

  ┌─── ENTER while(true) ────────────────────────┐
  │                                               │
  │  streamText(messages, tools)                  │
  │       │                                       │
  │  for await (chunk of result.fullStream)       │
  │       │                                       │
  │       ├── type: "text-delta"                  │
  │       │   → currentText += chunk!            │
  │       │   → onToken(chunk)! (render!)        │
  │       │                                       │
  │       └── type: "tool-call"                   │
  │           → toolCalls.push({id, name, args}) │
  │           → onToolCallStart(name)!           │
  │                                               │
  │  fullResponse += currentText                  │
  │                                               │
  │  finishReason = await result.finishReason     │
  │       │                                       │
  │       ├── NOT "tool-calls"?                   │
  │       │   → push response → BREAK! ──────→ EXIT
  │       │                                       │
  │       └── "tool-calls"!                       │
  │           → push assistant response!         │
  │           → execute each tool!               │
  │           → push each result!                │
  │           → CONTINUE! ──────────────────→ TOP │
  │                                               │
  └───────────────────────────────────────────────┘
```

### 10.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — Messages Array As Source Of Truth:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ EVERYTHING is the messages array!               │
  │                                                  │
  │ LLM generates text?                              │
  │ → Must push to messages or it FORGETS!         │
  │                                                  │
  │ LLM generates tool call?                         │
  │ → Push the call! Push the result!              │
  │ → "The very next thing MUST be the result!"    │
  │                                                  │
  │ Want to abort a tool call?                       │
  │ → Just don't push it! LLM never knew!         │
  │                                                  │
  │ Want to fake history?                            │
  │ → Put objects in array! Role assistant?         │
  │   "Oh yeah, I said that." 🙃                   │
  │                                                  │
  │ Want to change behavior mid-conversation?        │
  │ → Inject system message! Remove messages!       │
  │ → IT'S JUST AN ARRAY OF OBJECTS!               │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 10.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — FROM SINGLE CALL TO STREAMING LOOP:
═══════════════════════════════════════════════════════════════

  Single prompt call:
  │ → generateText({ prompt: "..." })
  │ → Wait. Get text. Done.
  │
  ↓
  Messages array:
  │ → generateText({ messages: [...] })
  │ → Conversation history! But still wait.
  │
  ↓
  SDK-managed loop:
  │ → generateText({ maxSteps: 5 })
  │ → SDK handles tool calls internally!
  │ → "We had it for FREE with maxSteps."
  │
  ↓
  Manual loop (what we built!):
  │ → while(true) + streamText + manual tool handling!
  │ → Full control! Approvals! Custom stops!
  │ → "I don't use a traditional tool loop.
  │    There's a lot of VALUE in creating your own."
  │
  ↓
  Next: Approvals + streaming optimizations!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 15:
═══════════════════════════════════════════════════════════════

  SETUP:
  [ ] filterCompatibleMessages — strip UI metadata!
  [ ] streamText not generateText!
  [ ] "Same arguments, just different name!"

  MESSAGES ARRAY:
  [ ] Position 1: system prompt!
  [ ] Middle: filtered history!
  [ ] Last: user message (MUST be last!)
  [ ] "If last = user → LLM responds!"

  STREAMING:
  [ ] for await (chunk of result.fullStream)!
  [ ] text-delta → accumulate text!
  [ ] tool-call → collect into array!
  [ ] fullResponse (all turns) vs currentText (this turn)!

  TOOL CALLS:
  [ ] Push assistant message (tool call) → PUSH 1!
  [ ] Execute tool + push result → PUSH 2!
  [ ] toolCallId MUST match! Otherwise API error!
  [ ] "Very next thing after tool call = result!"

  FINISH REASON:
  [ ] "stop" → LLM done, break!
  [ ] "tool-calls" → execute, continue loop!

  ERROR HANDLING:
  [ ] Stream errors → show friendly message, break!
  [ ] Real errors → throw! Let system handle!

  ABORT TRICK:
  [ ] "Don't push tool call to array = LLM never knew!"
  [ ] Messages array IS the source of truth!

  TIẾP THEO → Phần 16: Tool Execution & Approvals!
```
