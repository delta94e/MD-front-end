# AI Agents Fundamentals, v2 — Phần 29: Context Window Compaction — "Mind Control The Agent!"

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Context Window Compaction — "Summarization Prompt, Messages To Text, Fake Assistant Memory!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Compaction LLM, prompt engineering, conversation rebuilding!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Compaction = Another LLM — "Its Own Context Window!"         |
| 2   | Summarization Prompt — "Preserve Key Decisions!"             |
| 3   | Messages To Text — "One Big Text Blob, Not JSON!"            |
| 4   | The Compact Function — "prompt, Not messages!"               |
| 5   | Rebuilding Conversation — "Mind Control The Agent!"          |
| 6   | The Fake Assistant Response — "I Understand, I've Reviewed!" |
| 7   | Automatic Fact Extraction — "ChatGPT Remembers Your Blue!"   |
| 8   | Tự Implement: Complete Compaction System                     |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu           |

---

## §1. Compaction = Another LLM — "Its Own Context Window!"

> Scott: _"Compaction is just another LLM with its own context window. We need a system prompt for it."_

```
COMPACTION ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  MAIN AGENT (gpt-4o, 400K window!)
       │
       │ "Context getting too big!"
       │
       ▼
  COMPACTION LLM (can be different model!)
       │ → Takes conversation as input!
       │ → Summarizes it!
       │ → Returns condensed version!
       │
       ▼
  MAIN AGENT gets rebuilt conversation!
       → "Conversation can continue INDEFINITELY."

  "You might have to EVAL this too.
   Figure out what model works for you."
```

---

## §2. Summarization Prompt — "Preserve Key Decisions!"

> Scott: _"You are a conversation summarizer. Preserve key decisions, important context, pending tasks, overall goal."_

```javascript
// context/compaction.ts

const summarizationPrompt = `You are a conversation summarizer.
Your task is to create a concise summary of the conversation
so far that preserves:

- Key decisions and conclusions reached
- Important context and facts mentioned
- Any pending tasks or questions
- The overall goal of the conversation

Be concise but complete.
The summary should allow the conversation to continue naturally.

Conversation to summarize:`;

// "I'll leave off on 'conversation to summarize'
//  and then the next thing will be the actual text."
```

---

## §3. Messages To Text — "One Big Text Blob, Not JSON!"

> Scott: _"Instead of trying to feed this whole array in JSON format, convert it all to one big text blob. Here is all the information — versus trying to feed JSON objects."_

```javascript
// Helper: messagesToText

function messagesToText(messages) {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

// INPUT (JSON messages array):
// [
//   { role: "user", content: "Hello" },
//   { role: "assistant", content: "Hi there!" },
//   { role: "user", content: "Help me code" },
// ]

// OUTPUT (text blob):
// "user: Hello
//
//  assistant: Hi there!
//
//  user: Help me code"

// "Just getting the role and content and putting them
//  with two new lines after each other in ONE BIG STRING
//  versus all that JSON stuff."
```

---

## §4. The Compact Function — "prompt, Not messages!"

> Scott: _"We don't need the messages array. We can just pass in a prompt. This is not an agent loop, we just need you to do ONE THING and be done."_

```javascript
async function compactConversation(messages, modelName) {
  // Step 1: Filter out system prompt!
  const conversationMessages = messages.filter((m) => m.role !== "system");

  if (conversationMessages.length === 0) return messages;

  // Step 2: Convert to text blob!
  const conversationText = messagesToText(conversationMessages);

  // Step 3: Summarize with LLM!
  // "It's either or. Either prompt or messages."
  // "Not having a conversation. Just do one thing."
  const summary = await generateText({
    model: openai(modelName),
    prompt: summarizationPrompt + "\n" + conversationText,
    // ↑ Using PROMPT, not messages!
    // "Why messages? I'm not having a conversation.
    //  I just need you to do ONE THING and give me results."
  });

  // Step 4: Rebuild conversation!
  // ...
}
```

```
prompt vs messages:
═══════════════════════════════════════════════════════════════

  PROMPT (what we're using!):
  ┌──────────────────────────────────────────────────┐
  │ prompt: "System instructions + text to summarize"│
  │ → One shot! No conversation!                   │
  │ → "This is the same thing we did at the         │
  │    BEGINNING of the course."                    │
  └──────────────────────────────────────────────────┘

  MESSAGES (equivalent, but unnecessary here!):
  ┌──────────────────────────────────────────────────┐
  │ messages: [                                      │
  │   { role: "system", content: summarizationPrompt}│
  │   { role: "user", content: conversationText }   │
  │ ]                                                │
  │ → "This is the same thing. Why do that?"       │
  └──────────────────────────────────────────────────┘
```

---

## §5. Rebuilding Conversation — "Mind Control The Agent!"

> Scott: _"We're rebuilding the conversation, but now with the compaction. So we're building the compacted messages array."_

```javascript
// Step 4: Build compacted messages!

const compactedMessages = [
  // Keep original system prompt!
  messages.find((m) => m.role === "system"),

  // Summary as user message!
  {
    role: "user",
    content:
      `Conversation summary so far:\n\n` +
      `The following content is a summary of the ` +
      `conversation so far.\n\n` +
      summary.text +
      `\n\nPlease continue where we left off.`,
  },

  // FAKE assistant response! "Mind control!"
  {
    role: "assistant",
    content:
      "I understand. I've reviewed the summary " +
      "of our conversation and I'm ready to continue. " +
      "How can I help?",
  },
];

return compactedMessages;
```

---

## §6. The Fake Assistant Response — "I Understand, I've Reviewed!"

> Scott: _"I'm telling the LLM that's what you said. So when the LLM sees it, it's like: 'Oh yeah, I DID say that. Yeah, I DO understand.'"_

```
MIND CONTROL TECHNIQUE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WE PUT:                                          │
  │ { role: "assistant",                             │
  │   content: "I understand. I've reviewed the      │
  │   summary and I'm ready to continue." }         │
  │                                                  │
  │ LLM SEES:                                        │
  │ "Oh yeah, I DID say that.                       │
  │  Yeah, I DO understand.                          │
  │  I AM ready to help."                            │
  │                                                  │
  │ → "You're telling the LLM that's what YOU said."│
  │ → "It accepts it as its own memory."            │
  │                                                  │
  │ WHY END ON ASSISTANT:                            │
  │ "We don't want to leave off on a user role      │
  │  because then the LLM would generate another    │
  │  message. It's probably the USER'S turn when    │
  │  compaction happened."                           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Automatic Fact Extraction — "ChatGPT Remembers Your Blue!"

> Scott: _"ChatGPT will REMEMBER that your favorite color is blue without you telling it to remember. Every other chat just knows it."_

```
CHATGPT MEMORY SYSTEM:
═══════════════════════════════════════════════════════════════

  USER says: "Can you pick up my blue suit?
   I love the color blue, my favorite."
       │
       ▼ SEPARATE LLM processes EVERY message!
       │ "Are there facts or preferences here?"
       │
       ▼
  Extracted: "User's favorite color is blue."
       │ Stored OUTSIDE conversation!
       │
       ▼
  EVERY FUTURE CONVERSATION:
       │ System prompt includes:
       │ "User preferences: favorite color = blue"
       │
       ▼
  Even after compaction loses the detail:
       │ → The FACT is still there!
       │ → "Restores those details."
       │
  "Another strategy: automatic fact extraction.
   Derived and stored separately. Injected on
   every instance. Feels like it LEARNS you."
```

---

## §8. Tự Implement: Complete Compaction System

```javascript
// ═══════════════════════════════════
// COMPLETE Compaction System
// ═══════════════════════════════════

const summarizationPrompt = `You are a conversation summarizer.
Your task is to create a concise summary that preserves:
- Key decisions and conclusions reached
- Important context and facts mentioned
- Any pending tasks or questions
- The overall goal of the conversation

Be concise but complete.
The summary should allow conversation to continue naturally.

Conversation to summarize:`;

function messagesToText(messages) {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

async function compactConversation(messages, modelName) {
  // 1. Filter out system prompt!
  const conversationMessages = messages.filter((m) => m.role !== "system");

  if (conversationMessages.length === 0) {
    return messages; // Nothing to compact!
  }

  // 2. Convert messages to text blob!
  const conversationText = messagesToText(conversationMessages);

  // 3. Generate summary with LLM!
  const { text: summaryText } = await generateText({
    model: openai(modelName),
    prompt: summarizationPrompt + "\n" + conversationText,
  });

  // 4. Rebuild conversation with compacted messages!
  const systemMsg = messages.find((m) => m.role === "system");

  const compactedMessages = [
    systemMsg,
    {
      role: "user",
      content:
        `Conversation summary so far:\n\n` +
        `The following content is a summary of the ` +
        `conversation so far.\n\n` +
        summaryText +
        `\n\nPlease continue where we left off.`,
    },
    {
      role: "assistant",
      content:
        "I understand. I've reviewed the summary " +
        "of our conversation and I'm ready to " +
        "continue. How can I help?",
    },
  ];

  return compactedMessages;
}

export { compactConversation, messagesToText };
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO FAKE ASSISTANT MESSAGE?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao để role assistant ở cuối?
  └→ "If user role is last, LLM would generate
     ANOTHER message. It's the user's turn!"

  WHY ②: Tại sao nói 'I understand, I've reviewed'?
  └→ "Telling the LLM that's what YOU said. It
     accepts it as its own memory."

  WHY ③: Tại sao prompt thay vì messages array?
  └→ "Not having a conversation. Just need ONE
     thing done. Prompt = simpler."

  WHY ④: Tại sao filter system prompt?
  └→ "Don't want to SUMMARIZE the system prompt.
     It stays intact. Only summarize conversation."

  WHY ⑤: Tại sao text blob thay vì JSON?
  └→ "One big string with role: content. No JSON
     overhead. LLM reads it naturally."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — COMPACTION:
═══════════════════════════════════════════════════════════════

  Compaction = Compress + Rebuild + Resume!

  1. COMPRESS: LLM summarizes text!
  2. REBUILD: New messages array with summary!
  3. RESUME: Agent thinks it remembers everything!

  "The summary should allow the conversation
   to continue NATURALLY."
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Full history  │ Compacted         │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Detail           │ ✅ Complete!  │ ⚠️ Summary only!  │
  │ Context size     │ ❌ Huge!      │ ✅ Tiny!          │
  │ Cost             │ ❌ $$$!       │ ✅ Cheaper!       │
  │ Speed            │ ❌ Slow!      │ ✅ Fast!          │
  │ Nuance           │ ✅ Preserved! │ ❌ "Dog attack!"  │
  │ Indefinite chat  │ ❌ Limit hit! │ ✅ Forever!       │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — COMPACTION FLOW:
═══════════════════════════════════════════════════════════════

  messages[] (big! 320K+ tokens!)
       │
       ├── Filter: remove system prompt!
       │
       ├── Convert: messagesToText (text blob!)
       │
       ├── LLM: generateText with summarizationPrompt!
       │   → "One shot, not conversation."
       │
       ├── Rebuild:
       │   ├── [system] (original, untouched!)
       │   ├── [user] "Here's the summary..."
       │   └── [assistant] "I understand..." (FAKE!)
       │
       └── Return: compactedMessages[] (tiny!)
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — MESSAGE ROLES MATTER:
═══════════════════════════════════════════════════════════════

  [system] → Instructions! NEVER summarized!
  [user]   → Summary goes here! "Please continue."
  [assistant] → FAKE! "I understand."
                → "Mind control the agent!"
                → Must be LAST! (user's turn next!)

  If last = user → LLM generates response!
  If last = assistant → Waits for user input! ✅
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — COMPACTION EVOLUTION:
═══════════════════════════════════════════════════════════════

  Manual: "Make a new chat. This thing is getting big."
  │
  ↓ Simple truncation: Just drop oldest messages!
  │
  ↓ Summarization: LLM compresses conversation!
  │ → "Preserves key info. Loses nuance."
  ↓
  ↓ Memory systems: Extract facts automatically!
  │ → "ChatGPT remembers your favorite color!"
  ↓
  ↓ File-based: Save to markdown, read in new session!
  │ → "Go read this file from my previous convo."
  ↓
  ↓ Future: Combination of all approaches!
  │ → "No perfect solution."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 29:
═══════════════════════════════════════════════════════════════

  COMPACTION:
  [ ] Filter out system prompt first!
  [ ] messagesToText = role + content as text blob!
  [ ] Use prompt, not messages (one-shot!)
  [ ] Summarization prompt preserves key info!

  REBUILDING:
  [ ] System prompt stays UNCHANGED!
  [ ] Summary as user message!
  [ ] FAKE assistant response at the end!
  [ ] "Mind control — LLM thinks it said that!"
  [ ] End on assistant role (user's turn next!)

  FACT EXTRACTION:
  [ ] Separate LLM extracts user preferences!
  [ ] Stored outside conversation!
  [ ] Injected into every future session!

  TIẾP THEO → Phần 30: Adding Context Window Management!
```
