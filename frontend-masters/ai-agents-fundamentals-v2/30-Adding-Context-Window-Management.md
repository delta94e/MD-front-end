# AI Agents Fundamentals, v2 — Phần 30: Adding Context Window Management — "Report Token Usage!"

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Adding Context Window Management — "Precheck, Compact, Report! Prompt Injection Yourself!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Loop integration, token reporting, self prompt injection!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Integration Overview — "Import All The Context Stuff!" |
| 2   | Precheck Before Loop — "Are We Already Over?"          |
| 3   | Report Token Usage — "Show The User Cool Stuff!"       |
| 4   | Calling Report After Every Change                      |
| 5   | Live Demo — "0.6% Used, And I Prompt Injected Myself!" |
| 6   | Tự Implement: Context Management In The Agent Loop     |
| 7   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu     |

---

## §1. Integration Overview — "Import All The Context Stuff!"

> Scott: _"We need to import a lot of these things: estimateTokens, getModelLimits, isOverThreshold, calculateUsagePercentage, compactConversation, and our default threshold."_

```javascript
// run.ts — Import context management!

import {
  estimateTokens,
  getModelLimits,
  isOverThreshold,
  calculateUsagePercentage,
  compactConversation,
  DEFAULT_THRESHOLD,
} from "./context";
```

---

## §2. Precheck Before Loop — "Are We Already Over?"

> Scott: _"Before the loop starts, we want to check if we're over the threshold. If we are, go ahead and compact."_

```javascript
async function run(messages, modelName, callbacks) {
  // 1. Get model limits!
  const modelLimits = getModelLimits(modelName);

  // 2. PRECHECK before loop starts!
  const precheckTokens = estimateMessageTokens(messages);

  if (isOverThreshold(precheckTokens.total, modelLimits.contextWindow)) {
    // Already over! Compact BEFORE starting!
    messages = await compactConversation(messages, modelName);
  }

  // 3. Start the agent loop!
  while (true) {
    // ... agent loop ...
  }
}
```

```
PRECHECK FLOW:
═══════════════════════════════════════════════════════════════

  run() starts
       │
       ▼
  getModelLimits(modelName)
       │ → { contextWindow: 400_000, ... }
       │
       ▼
  estimateMessageTokens(messages)
       │ → { total: 350_000 }
       │
       ▼
  isOverThreshold(350_000, 400_000, 0.8)
       │ → 350K >= 320K? YES!
       │
       ▼
  compactConversation(messages, modelName)
       │ → Summarized! messages = compacted!
       │
       ▼
  while (true) { ... }  ← Loop starts with clean context!
```

---

## §3. Report Token Usage — "Show The User Cool Stuff!"

> Scott: _"We need a way to report the token usage. I have a feature in the UI that shows the user how many tokens they've used so far."_

```javascript
// Inside run(), before the loop!

const reportTokenUsage = () => {
  if (callbacks?.onTokenUsage) {
    const usage = estimateMessageTokens(messages);

    callbacks.onTokenUsage({
      inputTokens: usage.input,
      outputTokens: usage.output,
      totalTokens: usage.total,
      contextWindow: modelLimits.contextWindow,
      threshold: DEFAULT_THRESHOLD,
      percentage: calculateUsagePercentage(
        usage.total,
        modelLimits.contextWindow,
      ),
    });
  }
};
```

```
TOKEN USAGE UI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ 📊 Token Usage:                                  │
  │ Input:  1,250 tokens                             │
  │ Output: 850 tokens                               │
  │ Total:  2,100 / 400,000 tokens                   │
  │ Usage:  0.6%                                     │
  │ Threshold: 80%                                   │
  │ ████░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.6%            │
  └──────────────────────────────────────────────────┘

  "The UI can see all this and show you cool stuff."
```

---

## §4. Calling Report After Every Change

> Scott: _"All we have to do is call this function after each significant change to messages. Anywhere we are pushing to messages."_

```javascript
// Inside the while loop:

// After user message added:
messages.push(userMessage);
reportTokenUsage(); // ← Report!

// After assistant response:
messages.push(assistantMessage);
reportTokenUsage(); // ← Report!

// After tool results:
messages.push(toolResult);
reportTokenUsage(); // ← Report!
```

---

## §5. Live Demo — "0.6% Used, And I Prompt Injected Myself!"

> Scott: _"I pasted a bunch of stuff with links. Agent did a web search because it saw links! I prompt injected MYSELF!"_

```
LIVE DEMO:
═══════════════════════════════════════════════════════════════

  $ agi
  Hello! → Tokens: 0%, Threshold: 80% ✅

  USER: Pastes giant text with URLs
  ┌──────────────────────────────────────────────────┐
  │ 🟡 [web search executing...]                    │
  │                                                  │
  │ "Why did it do a web search? There's LINKS on   │
  │  here, that's why! It saw links and started     │
  │  crawling!"                                      │
  │                                                  │
  │ "See what I mean? I need to write an email:     │
  │  if you see links, don't be crawling links!"    │
  │                                                  │
  │ "You can see how EASY it is to prompt inject    │
  │  yourself! This thing could have done some      │
  │  CRAZY stuff."                                   │
  │                                                  │
  │ Tokens: 0.6% → Going up!                       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Tự Implement: Context Management In The Agent Loop

```javascript
// ═══════════════════════════════════
// COMPLETE Agent Loop With Context Management
// ═══════════════════════════════════

async function run(messages, modelName, callbacks) {
  const modelLimits = getModelLimits(modelName);

  // ── PRECHECK ──
  const precheck = estimateMessageTokens(messages);
  if (isOverThreshold(precheck.total, modelLimits.contextWindow)) {
    messages = await compactConversation(messages, modelName);
  }

  // ── REPORT FUNCTION ──
  const reportTokenUsage = () => {
    if (!callbacks?.onTokenUsage) return;
    const usage = estimateMessageTokens(messages);
    callbacks.onTokenUsage({
      inputTokens: usage.input,
      outputTokens: usage.output,
      totalTokens: usage.total,
      contextWindow: modelLimits.contextWindow,
      threshold: DEFAULT_THRESHOLD,
      percentage: calculateUsagePercentage(
        usage.total,
        modelLimits.contextWindow,
      ),
    });
  };

  // ── AGENT LOOP ──
  while (true) {
    const response = await generateText({
      model: openai(modelName),
      messages,
      tools,
    });

    // Report after LLM response!
    messages.push({
      role: "assistant",
      content: response.text,
    });
    reportTokenUsage();

    // Handle tool calls
    if (response.toolCalls?.length) {
      for (const toolCall of response.toolCalls) {
        const result = await executeTool(toolCall);
        messages.push({
          role: "tool",
          content: result,
          toolCallId: toolCall.id,
        });
      }
      reportTokenUsage(); // Report after tool results!

      // Check if we need to compact again!
      const currentUsage = estimateMessageTokens(messages);
      if (isOverThreshold(currentUsage.total, modelLimits.contextWindow)) {
        messages = await compactConversation(messages, modelName);
        reportTokenUsage(); // Report after compaction!
      }

      continue; // Loop again with tool results!
    }

    break; // No tool calls = done!
  }

  return messages;
}
```

---

## §7. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 7.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO REPORT SAU MỖI THAY ĐỔI?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao report nhiều lần?
  └→ "Messages constantly changing. Report after
     each significant change."

  WHY ②: Tại sao precheck trước loop?
  └→ "What if messages ALREADY over threshold
     before we even start? Compact first!"

  WHY ③: Tại sao prompt injection từ link?
  └→ "Agent saw URLs in pasted text and decided
     to crawl them. Easy to inject yourself!"

  WHY ④: Tại sao function thay vì inline code?
  └→ "Don't want to write this thing TWICE.
     Extract to function, call everywhere."

  WHY ⑤: Tại sao callback pattern?
  └→ "UI needs to display this. Callbacks let
     the runner notify the UI layer."
```

### 7.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — CONTEXT MANAGEMENT IN LOOP:
═══════════════════════════════════════════════════════════════

  Agent loop = Messages grow indefinitely!
  → Must CHECK before each turn!
  → Must REPORT after changes!
  → Must COMPACT when threshold hit!
  → Must CONTINUE seamlessly!
```

### 7.3 Pattern ③: Mental Mapping

```
MENTAL MAP — INTEGRATION POINTS:
═══════════════════════════════════════════════════════════════

  run() entry
    │
    ├── getModelLimits ← Know the boundaries!
    ├── estimateTokens ← How big are we?
    ├── isOverThreshold ← Check BEFORE loop!
    │   └── compactConversation (if needed!)
    │
    └── while (true)
        ├── generateText → response!
        ├── messages.push → reportTokenUsage!
        ├── tool execution → reportTokenUsage!
        └── isOverThreshold → compact if needed!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 30:
═══════════════════════════════════════════════════════════════

  INTEGRATION:
  [ ] Import all context utilities!
  [ ] getModelLimits BEFORE the loop!
  [ ] Precheck BEFORE the loop starts!
  [ ] reportTokenUsage as reusable function!

  REPORTING:
  [ ] Call after EVERY messages.push!
  [ ] Show input, output, total, percentage!
  [ ] Callback pattern for UI updates!

  SAFETY:
  [ ] Watch for accidental prompt injection!
  [ ] "Links in pasted text → web search!"
  [ ] "How EASY it is to inject yourself!"

  TIẾP THEO → Phần 31: Shell & Code Execution!
```
