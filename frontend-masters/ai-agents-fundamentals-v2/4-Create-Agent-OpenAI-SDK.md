# AI Agents Fundamentals, v2 — Phần 4: Create an Agent with OpenAI SDK — Hello World LLM!

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Create an Agent with OpenAI SDK — "Building Is Not Hard, Making It GOOD Is!"
> Độ khó: ⭐️⭐️ | Setup + First LLM Call!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Setup — npm install, .env, Packages!                |
| 2   | The Vercel AI SDK — "Not Sure Who They Had To Pay!" |
| 3   | System Prompt — "You Are A Helpful AI!"             |
| 4   | Hello World LLM Call — generateText!                |
| 5   | Running It — "That's ALL You Have To Do!"           |
| 6   | From Hello World to Agent — "Not Too Difficult!"    |
| 7   | Tự Implement: First LLM Call From Scratch           |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu  |

---

## §1. Setup — npm install, .env, Packages!

> Scott: _"The first thing you want to do is npm install. Make sure you have your OpenAI API key in your .env file. This won't work WITHOUT that."_

```
SETUP STEPS:
═══════════════════════════════════════════════════════════════

  $ cd agents-v2
  $ npm install          ← "Probably won't need to do
                            npm install at any other point!"

  .env FILE:
  ┌──────────────────────────────────────────────────┐
  │ OPENAI_API_KEY=sk-your-key-here                 │
  │                                                  │
  │ → Required! Won't work without it!             │
  │ → Already in .gitignore!                       │
  └──────────────────────────────────────────────────┘

  FILE LOCATION:
  src/agent/run.ts       ← We'll write code here!

  KEY PACKAGES:
  ┌──────────────────────────────────────────────────┐
  │ ai           → Vercel AI SDK (core!)            │
  │ @ai-sdk/openai → OpenAI adapter!               │
  │ dotenv       → Load .env automatically!        │
  └──────────────────────────────────────────────────┘
```

---

## §2. The Vercel AI SDK — "Not Sure Who They Had To Pay!"

> Scott: _"One of the packages we're going to use is called AI. This is made from Vercel. Not sure who they had to pay to get the AI package from npm, but they got it!"_

```
VERCEL AI SDK — WHY USE IT?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PACKAGE: "ai" (from Vercel!)                    │
  │ → Generic AI SDK that works with any provider! │
  │                                                  │
  │ ADAPTER: "@ai-sdk/openai"                       │
  │ → "An adapter module that allows us to          │
  │    SWITCH OUT different model providers          │
  │    with the SAME SDK. Very useful."             │
  │                                                  │
  │ WHY THIS MATTERS:                                │
  │ ┌────────────────────────────────────────────┐   │
  │ │                                            │   │
  │ │ Same code, different providers:             │   │
  │ │                                            │   │
  │ │ import { openai } from "@ai-sdk/openai"    │   │
  │ │ import { anthropic } from "@ai-sdk/anthropic│   │
  │ │ import { google } from "@ai-sdk/google"    │   │
  │ │                                            │   │
  │ │ → Swap provider, keep same generateText! │   │
  │ │ → No code changes needed!                │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. System Prompt — "You Are A Helpful AI!"

> Scott: _"It's essentially the base instructions for an LLM. Like 'you are a blank, be helpful, talk to the user.'"_

```
SYSTEM PROMPT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT IS IT?                                      │
  │ → Instructions that PRIME the LLM!              │
  │ → Sets personality, behavior, constraints!      │
  │ → Like giving a new employee their job desc!    │
  │                                                  │
  │ EXAMPLE:                                         │
  │ "You are a helpful AI system. You provide clear, │
  │  accurate, and concise responses."               │
  │                                                  │
  │ Scott: "It's just a system prompt that gets      │
  │ passed to the LLM to PRIME it with its own      │
  │ background and instructions."                    │
  │                                                  │
  │ WHERE IT GOES:                                   │
  │ messages: [                                      │
  │   { role: "system",  content: systemPrompt },   │
  │   { role: "user",    content: userMessage },    │
  │ ]                                                │
  │ → System prompt = FIRST message, always!        │
  │ → Sets the context for everything after!        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Hello World LLM Call — generateText!

> Scott: _"generateText does exactly what it sounds like. You give it a prompt and it generates text with the model that you want."_

```
THE CODE — STEP BY STEP:
═══════════════════════════════════════════════════════════════

  // file: src/agent/run.ts

  import "dotenv/config";          // ← Auto-load .env!
  import { generateText } from "ai";
  import { openai } from "@ai-sdk/openai";
  import type { ModelMessage } from "ai";
  import { systemPrompt } from "./system-prompt";

  const modelName = "gpt-4o-mini";
  // "Good blend between FAST and GOOD."
  // "Costs literally NOTHING and it's really fast."

  export async function runAgent(
    userMessage: string,
    conversationHistory: ModelMessage[],
    callbacks: Callbacks,
  ) {
    // Call the LLM!
    const { text } = await generateText({
      model: openai(modelName),    // ① Which model!
      prompt: userMessage,          // ② What to ask!
      system: systemPrompt,         // ③ Instructions!
    });

    console.log(text);
  }

  // Run it directly for testing:
  runAgent("hello, can you hear me?", [], {});

  ANATOMY:
  ┌──────────────────────────────────────────────────┐
  │ generateText({                                   │
  │   model: openai("gpt-4o-mini"),                  │
  │   │       │      └→ Model name!                 │
  │   │       └→ Adapter (OpenAI provider!)         │
  │   │                                              │
  │   prompt: "hello, can you hear me?",             │
  │   │       └→ User's message!                    │
  │   │                                              │
  │   system: "You are a helpful AI system...",      │
  │           └→ System prompt (instructions!)      │
  │ })                                               │
  │                                                  │
  │ → Returns: { text: "..." }                      │
  │ → Destructure: const { text } = await ...       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Running It — "That's ALL You Have To Do!"

> Scott: _"It literally thought that I was asking if it could HEAR me. So, you know, it's SMART, right?"_

```
RUNNING THE CODE:
═══════════════════════════════════════════════════════════════

  $ npx tsx src/agent/run.ts

  → Loading... (not streaming, so it waits!)

  OUTPUT:
  ┌──────────────────────────────────────────────────┐
  │ "I can read your message. I don't have a         │
  │  microphone, so I can't hear your audio, but     │
  │  I can process the text and images you send."    │
  └──────────────────────────────────────────────────┘

  Scott: "It literally thought that I was asking
  if it could HEAR me. So it's smart, right?"

  "That's it. That's ALL you have to do to talk
  to an LLM. You give it some text, it generates
  some text. At its core, that's basically it."

  THE FLOW:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Your code                                        │
  │    │                                             │
  │    ▼                                             │
  │ generateText()                                   │
  │    │                                             │
  │    ▼                                             │
  │ OpenAI API (over internet!)                      │
  │    │                                             │
  │    ▼                                             │
  │ GPT-4o-mini processes prompt                     │
  │    │                                             │
  │    ▼                                             │
  │ Returns generated text                           │
  │    │                                             │
  │    ▼                                             │
  │ { text: "I can read your message..." }           │
  │    │                                             │
  │    ▼                                             │
  │ console.log(text)                                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. From Hello World to Agent — "Not Too Difficult!"

> Scott: _"The ART of building an agent is not hard. The art of making an agent that's GOOD is infinitely hard. We're going to cover BOTH."_

```
THE GAP — From LLM Call to Agent:
═══════════════════════════════════════════════════════════════

  WHAT WE HAVE NOW:
  ┌──────────────────────────────────────────────────┐
  │ Input → LLM → Output                           │
  │ → One-shot! Send text, get text! Done!         │
  │ → No tools, no loop, no memory!                │
  └──────────────────────────────────────────────────┘

  WHAT WE NEED:
  ┌──────────────────────────────────────────────────┐
  │ Input → LLM → Tool? → Loop? → Output           │
  │ → Conversational (remembers history!)           │
  │ → Can use TOOLS (search, write, execute!)       │
  │ → Loops until task is done!                    │
  │ → Has approval mechanisms!                     │
  └──────────────────────────────────────────────────┘

  THE BRIDGE:
  ┌──────────────────────────────────────────────────┐
  │ ① Add TOOLS → functions LLM can call!          │
  │ ② Add LOOP → keep going until done!            │
  │ ③ Add MEMORY → conversation history!           │
  │ ④ Add APPROVALS → safety for dangerous tools!  │
  │ ⑤ Add REASONING → system prompt that guides!   │
  │                                                  │
  │ Scott: "How do we turn THIS to something that    │
  │ works on a LOOP, that's conversational,          │
  │ that can DO THINGS?"                              │
  │                                                  │
  │ "Believe it or not, it's NOT TOO DIFFICULT."    │
  │ "The art of BUILDING is not hard."              │
  │ "The art of making it GOOD is INFINITELY hard."  │
  │ "We're going to cover BOTH."                    │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: First LLM Call From Scratch

```javascript
// STEP 1: Without any SDK — raw HTTP call!

// At its core, calling an LLM is just an HTTP request:

async function callLLMRaw(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
  // That's it! Just an API call!
}

// Usage:
const answer = await callLLMRaw("Hello, can you hear me?");
console.log(answer);
// "I can read your message..."
```

```javascript
// STEP 2: With Vercel AI SDK (what Scott uses)

import "dotenv/config";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

async function runAgent(userMessage) {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: userMessage,
    system: "You are a helpful AI assistant.",
  });

  return text;
}

// Same result, less boilerplate!
const answer = await runAgent("Hello, can you hear me?");
console.log(answer);
```

```javascript
// STEP 3: Understanding model choice

// Scott chose gpt-4o-mini because:
const modelChoices = {
  "gpt-4o-mini": {
    speed: "⚡ Fast!",
    quality: "✅ Good!",
    cost: "💰 Literally NOTHING!",
    scottSays: "Good blend between fast and good.",
  },
  "gpt-4o": {
    speed: "⚠️ Slower",
    quality: "✅ Best!",
    cost: "💰 More expensive",
    scottSays: "Use whatever you want, it's your money.",
  },
  "gpt-4-turbo": {
    speed: "⚠️ Medium",
    quality: "✅ Very good",
    cost: "💰 Expensive",
  },
};

// Key point: The SDK lets you swap models easily!
// Just change the string:
// openai("gpt-4o-mini") → openai("gpt-4o")
// No other code changes needed!
```

```javascript
// STEP 4: Understanding the function signature

export async function runAgent(
  userMessage: string,
  // ↑ What the user wants!

  conversationHistory: ModelMessage[],
  // ↑ Past messages (memory!)
  // For now: empty array []
  // Later: will enable conversations!

  callbacks: Callbacks,
  // ↑ UI-related only! NOT agent logic!
  // Scott: "The callback stuff is all UI
  // related, nothing to do with the agent."
  // Ties into terminal display (spinners, colors)
) {
  // Agent logic here!
}

// For testing, call directly:
runAgent("hello, can you hear me?", [], {});
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — First LLM Call

```
5 WHYS: TẠI SAO BẮT ĐẦU TỪ HELLO WORLD?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao bắt đầu đơn giản?
  └→ Vì LLM call = FOUNDATION of everything!
     Agent = just LLM calls in a loop!
     Must understand the basic unit first!

  WHY ②: Tại sao dùng Vercel AI SDK?
  └→ Vì provider-agnostic! Swap OpenAI → Anthropic
     without changing logic code!
     "An adapter module, very useful."

  WHY ③: Tại sao gpt-4o-mini?
  └→ Vì "good blend between FAST and GOOD!"
     Cost = "literally NOTHING" for this course!
     Perfect for learning and prototyping!

  WHY ④: Tại sao cần system prompt?
  └→ Vì LLM cần context! Personality! Constraints!
     Without it = generic, unpredictable responses!
     "Prime it with background and instructions!"

  WHY ⑤: Tại sao dotenv/config?
  └→ Vì API key phải secret! Not in code!
     .env file → auto-loaded → SDK picks up!
     "This won't work WITHOUT that."
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — LLM CALL:
═══════════════════════════════════════════════════════════════

  At its CORE, an LLM call is:

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ INPUT:                                           │
  │ ┌──────────────────────────────────────────┐     │
  │ │ 1. Model (which LLM to use!)             │     │
  │ │ 2. System prompt (instructions!)          │     │
  │ │ 3. User message (what to do!)             │     │
  │ │ 4. (Optional) History (past messages!)    │     │
  │ └──────────────────────────────────────────┘     │
  │                                                  │
  │ PROCESS:                                         │
  │ → HTTP POST to API endpoint!                    │
  │ → Model processes tokens!                       │
  │ → Generates response token by token!            │
  │                                                  │
  │ OUTPUT:                                          │
  │ ┌──────────────────────────────────────────┐     │
  │ │ Generated text (string!)                  │     │
  │ │ "I can read your message..."              │     │
  │ └──────────────────────────────────────────┘     │
  │                                                  │
  │ That's it! Everything else (tools, loops,        │
  │ agents) is built ON TOP of this!                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — SDK vs RAW API:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Raw API       │ Vercel AI SDK     │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Boilerplate      │ ❌ Lots!      │ ✅ Minimal!       │
  │ Provider swap    │ ❌ Rewrite!   │ ✅ One line!      │
  │ Type safety      │ ❌ Manual!    │ ✅ Built-in!      │
  │ Streaming        │ ⚠️ Complex!   │ ✅ Built-in!      │
  │ Tool calling     │ ⚠️ Manual!    │ ✅ Built-in!      │
  │ Understanding    │ ✅ Full!      │ ⚠️ Abstracted!    │
  │ Control          │ ✅ Full!      │ ⚠️ Limited!       │
  └──────────────────┴───────────────┴───────────────────┘

  Scott's approach: Use SDK for convenience,
  but understand what's underneath!
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — FROM HELLO WORLD TO AGENT:
═══════════════════════════════════════════════════════════════

  CURRENT STATE (Part 4):
  ┌─────────────┐
  │ generateText│ → Single call → text out!
  └─────────────┘

  NEXT STEPS (Parts 5–9):
  ┌─────────────┐
  │ + Tools     │ → LLM can call functions!
  ├─────────────┤
  │ + Loop      │ → Keep going until done!
  ├─────────────┤
  │ + Memory    │ → Remember conversation!
  ├─────────────┤
  │ + Approvals │ → Safety for dangerous ops!
  ├─────────────┤
  │ + Evals     │ → Test agent quality!
  └─────────────┘

  Scott: "Building is NOT HARD.
  Making it GOOD is INFINITELY hard.
  We're going to cover BOTH."
```

### 8.5 Pattern ⑤: Reverse Engineering

```javascript
// WHAT generateText() DOES UNDER THE HOOD:

// When you call:
const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "hello",
  system: "You are helpful",
});

// The SDK does THIS for you:

// 1. Creates the messages array:
const messages = [
  { role: "system", content: "You are helpful" },
  { role: "user", content: "hello" },
];

// 2. Calls OpenAI API:
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages,
  }),
});

// 3. Parses the response:
const data = await response.json();
const text = data.choices[0].message.content;

// 4. Returns structured result:
return { text };

// That's what the SDK abstracts!
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — LLM API EVOLUTION:
═══════════════════════════════════════════════════════════════

  2020: GPT-3 API
  │ → completions endpoint (text in → text out!)
  │ → No chat, no messages array!
  │ → const response = await openai.complete(prompt);
  │
  ↓
  2023: Chat Completions API
  │ → messages array (system, user, assistant!)
  │ → Chat format that we use today!
  │ → + Function calling (tools!)
  │
  ↓
  2024: Vercel AI SDK
  │ → Provider-agnostic! One SDK, any model!
  │ → generateText, streamText, generateObject!
  │ → Scott: "Not sure who they had to PAY
  │    to get the AI package from npm!" 😄
  │
  ↓
  NOW: Simplified but powerful!
  │ → 3 lines of code to call an LLM!
  │ → model + prompt + system = done!
  │ → "That's ALL you have to do!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 4:
═══════════════════════════════════════════════════════════════

  SETUP:
  [ ] npm install done!
  [ ] .env with OPENAI_API_KEY!
  [ ] Using gpt-4o-mini ("fast + good + cheap!")

  FIRST LLM CALL:
  [ ] import generateText from "ai"!
  [ ] import openai adapter from "@ai-sdk/openai"!
  [ ] generateText({ model, prompt, system })!
  [ ] Returns { text } — destructure it!

  KEY CONCEPTS:
  [ ] System prompt = instructions for LLM!
  [ ] Model adapter = swap providers easily!
  [ ] dotenv/config = auto-load API key!
  [ ] callbacks = UI only, not agent logic!

  THE GAP:
  [ ] Current: one-shot text generation!
  [ ] Need: tools + loop + memory + approvals!
  [ ] "Building is NOT HARD."
  [ ] "Making it GOOD is INFINITELY HARD!"

  TIẾP THEO → Phần 5: Adding Tools to the Agent!
```
