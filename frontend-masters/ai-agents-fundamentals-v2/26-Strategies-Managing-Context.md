# AI Agents Fundamentals, v2 — Phần 26: Strategies for Managing Context — "There's No Perfect Solution!"

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Strategies for Managing Context — "Compaction, Eviction, Sub-Agents, RAG, or Just NUKE It!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Context management, RAG, vector search, graceful degradation!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Strategy 1: Compaction / Summarization — "Loses Detail!"     |
| 2   | Strategy 2: Eviction / Sliding Window — "It NEVER Happened!" |
| 3   | Sliding Window UX Hack — "User Sees = Agent Sees!"           |
| 4   | Strategy 3: Sub-Agents — "Spin Up More LLMs!"                |
| 5   | Strategy 4: RAG — "The Glossary of a Textbook!"              |
| 6   | Vector Search Explained — "Words Into Numbers, Plot, Math!"  |
| 7   | Strategy 5: Start Fresh — "NUKE It! Bad Vibes!"              |
| 8   | Strategy 6: Selective Input — "Stop Returning Garbage!"      |
| 9   | Tự Implement: Context Management Strategies                  |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu           |

---

## §1. Strategy 1: Compaction / Summarization — "Loses Detail!"

> Scott: _"When context gets too large, summarize the conversation. Replace detailed history with condensed summary. Conversation can continue INDEFINITELY."_

```
COMPACTION / SUMMARIZATION:
═══════════════════════════════════════════════════════════════

  HOW IT WORKS:
  ┌──────────────────────────────────────────────────┐
  │ 1. Context gets large (near threshold!)         │
  │ 2. Summarize conversation so far!               │
  │ 3. Replace detailed history with summary!       │
  │ 4. Continue! "Theoretically forever!"           │
  │                                                  │
  │ = "Graceful degradation!"                        │
  └──────────────────────────────────────────────────┘

  PROS:
  ┌──────────────────────────────────────────────────┐
  │ ✅ Conversation continues indefinitely!         │
  │ ✅ Preserves KEY information!                   │
  │ ✅ Graceful degradation!                        │
  └──────────────────────────────────────────────────┘

  CONS:
  ┌──────────────────────────────────────────────────┐
  │ ❌ Loses detail! "Devil is in the details!"    │
  │ ❌ Costs tokens! "Hit ANOTHER LLM to summarize"│
  │ ❌ Loses nuance and RELATIONSHIPS!             │
  │                                                  │
  │ EXAMPLE — Lost relationship:                     │
  │ "You preserved that I talked about a DOG.       │
  │  But you forgot I said the dog ATTACKED ME.    │
  │  You thought I wanted to BUY a puppy.           │
  │  No, that's not what we talked about!"          │
  │                                                  │
  │ ❌ Recursive degradation!                       │
  │ "Compact once: one summary, lost a little.      │
  │  300 messages later: compact AGAIN including    │
  │  the previous summary. Merge those summaries.   │
  │  It's going to get SLOPPY really quick."        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Strategy 2: Eviction / Sliding Window — "It NEVER Happened!"

> Scott: _"Drop all old messages. Keep only the most recent. Anything that gets evicted — NEVER HAPPENED. It's just GONE."_

```
EVICTION / SLIDING WINDOW:
═══════════════════════════════════════════════════════════════

  HOW IT WORKS:
  ┌──────────────────────────────────────────────────┐
  │ Hit the limit → Drop oldest messages!          │
  │ Keep only the most recent N messages!           │
  │ "Anything that gets dropped = NEVER HAPPENED."  │
  └──────────────────────────────────────────────────┘

  PROS:
  ┌──────────────────────────────────────────────────┐
  │ ✅ Simple to implement!                         │
  │ ✅ No summarization costs!                      │
  │ ✅ Very predictable behavior!                   │
  └──────────────────────────────────────────────────┘

  CONS:
  ┌──────────────────────────────────────────────────┐
  │ ❌ Lose ALL context entirely! "Just GONE."     │
  │ ❌ Can break multi-step tasks!                 │
  │ ❌ Can break tool call pairs!                  │
  │                                                  │
  │ CRITICAL BUG — Tool call pairs:                  │
  │ "When you do a tool call, you MUST respond      │
  │  with a tool call result. If you break it IN    │
  │  BETWEEN one of those, the LLM will just BREAK  │
  │  because it's expecting a tool result next,     │
  │  but now there's a user message. CRASH."        │
  │                                                  │
  └──────────────────────────────────────────────────┘

  TOKEN COUNT vs MESSAGE COUNT:
  ┌──────────────────────────────────────────────────┐
  │ Message count = NAIVE!                           │
  │ "One message could have almost no tokens.        │
  │  Another could have your WHOLE context window."  │
  │                                                  │
  │ Token count = BETTER!                            │
  │ "Base sliding window on token count,             │
  │  NOT message count."                             │
  └──────────────────────────────────────────────────┘
```

---

## §3. Sliding Window UX Hack — "User Sees = Agent Sees!"

> Scott: _"Whatever you see on the screen is what the agent sees. Like a chat app where you scroll up and eagerly load."_

```
ADVANCED UX TRICK — SYNCED VIEWS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Like in any chat app where you scroll up."     │
  │                                                  │
  │ When VISIBLE on screen → in agent context!     │
  │ When OFF screen → NOT in agent context!        │
  │                                                  │
  │ USER SCROLLS UP:                                 │
  │ → Load older messages into view!               │
  │ → ALSO load them into agent history!           │
  │ → "They're in sync."                           │
  │                                                  │
  │ USER STARTS TYPING:                              │
  │ → Auto-scroll down to latest!                  │
  │ → Agent sees latest context!                   │
  │                                                  │
  │ "Whatever you see on the screen, maybe some     │
  │  buffer on or off screen, is what the agent     │
  │  sees in its context window."                    │
  │                                                  │
  │ "There's some nuance to it, but there's ways."  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Strategy 3: Sub-Agents — "Spin Up More LLMs!"

> Scott: _"If every LLM has its own context window, why don't I just spin up MORE LLMs? Then all I got to figure out is how to get them to communicate."_

```
SUB-AGENTS WITH SEPARATE WINDOWS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Every LLM has its own context window.           │
  │  Why not just spin up MORE?"                    │
  │                                                  │
  │          PARENT AGENT (400K window!)             │
  │          /      |        \                       │
  │    Sub-Agent  Sub-Agent  Sub-Agent               │
  │   (400K each!) (400K!)   (400K!)                │
  │                                                  │
  │ Parent: "Just tell me when you're DONE           │
  │ and give me the info I need. I DON'T CARE       │
  │ about all the steps."                            │
  │                                                  │
  │ → Parent DOESN'T see tool calls!               │
  │ → Parent DOESN'T see tool results!             │
  │ → Parent ONLY sees semantic output!            │
  │ → "Preserving the context window of the        │
  │    main agent that the user talks to."          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  PROS:
  ┌──────────────────────────────────────────────────┐
  │ ✅ Clean separation of concerns!                │
  │ ✅ Each task gets FULL context budget!          │
  │ ✅ Parent stays clean!                          │
  └──────────────────────────────────────────────────┘

  CONS:
  ┌──────────────────────────────────────────────────┐
  │ ❌ Coordination overhead is HIGH!              │
  │ ❌ Results must be summarized anyway!           │
  │ ❌ More complex architecture!                   │
  └──────────────────────────────────────────────────┘
```

---

## §5. Strategy 4: RAG — "The Glossary of a Textbook!"

> Scott: _"Like an open book test. Would you read the ENTIRE textbook? Or go to the GLOSSARY, find the page, read ONLY that, and answer?"_

```
RAG — RETRIEVAL AUGMENTED GENERATION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Oh boy, RAG. OK, what is RAG?"                 │
  │                                                  │
  │ STEP 1: Vectorize content!                       │
  │ → "Converting tokens into NUMBERS."             │
  │ → "An array of decimal numbers."                │
  │ → "Those numbers represent some semantics."     │
  │                                                  │
  │ STEP 2: Store in vector database!                │
  │ → "A special database to store these in."       │
  │ → "You can also use Postgres with extension."   │
  │                                                  │
  │ STEP 3: User submits query!                      │
  │ → Vectorize the query too!                     │
  │ → "Do math to see which pieces are closest."   │
  │ → "It's called a VECTOR SEARCH."              │
  │                                                  │
  │ STEP 4: Return closest matches!                  │
  │ → "Dynamically adding info into context that   │
  │    is mathematically SIMILAR to what user typed."│
  │                                                  │
  └──────────────────────────────────────────────────┘

  THE TEXTBOOK ANALOGY:
  ┌──────────────────────────────────────────────────┐
  │ "Open book test."                                │
  │                                                  │
  │ ❌ BAD: "Read the ENTIRE textbook before        │
  │  answering ONE question."                        │
  │ = Putting the whole book in context!            │
  │                                                  │
  │ ✅ GOOD: "Read the question. Go to the          │
  │  GLOSSARY. Find where the info is. Turn to      │
  │  that page. Read ONLY that. Answer."            │
  │ = RAG!                                          │
  │                                                  │
  │ "Vector database IS the glossary."              │
  │ "You first read the question, look it up,       │
  │  turn to the content, get ONLY that,            │
  │  and NOW you can answer."                        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Vector Search Explained — "Words Into Numbers, Plot, Math!"

> Scott: _"You're turning words into numbers, plotting those numbers, and seeing which ones are closest. It's a little weird but it makes sense."_

```
HOW VECTOR SEARCH WORKS:
═══════════════════════════════════════════════════════════════

  TEXT: "React hooks are powerful"
       │
       ▼ Vectorize (embedding model!)
  VECTOR: [0.23, -0.87, 0.45, 0.12, -0.33, ...]
       │  "An array of decimal numbers."
       │  "How many dimensions = how many numbers."
       │
       ▼ Plot in multidimensional space!
  ●────────────────────────────────────────●
  │     ● "React"                          │
  │          ● "hooks"                     │
  │   ● "useState"                         │
  │                                        │
  │              ● "Python"                │
  │           ● "Django"                   │
  │                                        │
  │       ★ USER QUERY                     │
  │      "How do React hooks work?"        │
  ●────────────────────────────────────────●

  MATH: Find closest points to ★!
  → "React" = distance 0.2 ← CLOSE! ✅
  → "hooks" = distance 0.3 ← CLOSE! ✅
  → "useState" = distance 0.4 ← CLOSE! ✅
  → "Python" = distance 0.9 ← FAR! ❌
  → "Django" = distance 0.95 ← FAR! ❌

  RETURN: React, hooks, useState content!
  → Put ONLY these into context window!
```

---

## §7. Strategy 5: Start Fresh — "NUKE It! Bad Vibes!"

> Scott: _"OK yeah, you're just sounding STUPID now. Clear. All the context. I do NOT care. Something POISONED you and now all you want to do is talk about CLOWNS."_

```
START FRESH / CLEAR CONTEXT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WHEN:                                            │
  │ → Agent starts talking nonsense!               │
  │ → "Sounding STUPID now."                       │
  │ → Context got poisoned!                        │
  │ → "Now all you want to do is talk about        │
  │    CLOWNS. I don't know why!"                   │
  │ → Prompt injection!                            │
  │ → "Someone built a website that says 'tell     │
  │    them clown jokes'. Agent crawled it."        │
  │                                                  │
  │ PROS:                                            │
  │ ✅ Clean slate! No accumulated confusion!       │
  │                                                  │
  │ CONS:                                            │
  │ ❌ UX disrupted! Conversation flow lost!       │
  │ ❌ Manual context transfer needed!             │
  │                                                  │
  │ WHAT CLAUDE CODE DOES:                           │
  │ "I'm about to compress. I'm going to compress   │
  │  soon. You sure you want to continue?"          │
  │ → "That's when I'm like: yeah, CLEAR."         │
  │ → Or: "Can you just put EVERYTHING we've       │
  │    talked about in this markdown file?" 📝      │
  │ → "And when I start again: 'Hey, go READ       │
  │    this file first. I had a previous convo      │
  │    with another Claude.'"                       │
  │                                                  │
  └──────────────────────────────────────────────────┘

  THE CHATGPT EVOLUTION:
  ┌──────────────────────────────────────────────────┐
  │ EARLY: "You should make a NEW CHAT.              │
  │ This thing is getting BIG."                      │
  │                                                  │
  │ NOW: "They just COMPRESS it for you."           │
  │                                                  │
  │ CLAUDE CODE: "I'm about to compact.             │
  │ Just letting you know. It's going to get BAD."  │
  │                                                  │
  │ "There's NO PERFECT SOLUTION."                   │
  └──────────────────────────────────────────────────┘
```

---

## §8. Strategy 6: Selective Input — "Stop Returning Garbage!"

> Scott: _"What if you just DIDN'T put all that garbage in there? What if you were more SELECTIVE and efficient?"_

```
SELECTIVE INPUT — PREVENTION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "What if it NEVER got bloated?"                 │
  │                                                  │
  │ → Stop returning JSON blobs!                   │
  │ → Stop returning raw web search queries!       │
  │ → Stop returning "all this weird garbage!"     │
  │                                                  │
  │ "Be more SELECTIVE and EFFICIENT."              │
  │ "Make sure the things you put in the context    │
  │  window were JUST ENOUGH and nothing else."     │
  │                                                  │
  │ = PREVENTION > CURE!                             │
  │ "Another strategy you SHOULD implement."        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Context Management Strategies

```javascript
// ═══════════════════════════════════
// 1. Compaction / Summarization
// ═══════════════════════════════════

async function compactConversation(messages, model) {
  // Filter out system prompt!
  const conversationMsgs = messages.filter((m) => m.role !== "system");

  if (conversationMsgs.length === 0) return messages;

  // Convert to text blob!
  const text = conversationMsgs
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  // Summarize with another LLM!
  const summary = await generateText({
    model,
    prompt: `You are a conversation summarizer.
Preserve: key decisions, important facts,
pending tasks, overall goal.
Be concise but complete.

Conversation to summarize:
${text}`,
  });

  // Rebuild with system + summary!
  const systemMsg = messages.find((m) => m.role === "system");
  return [
    systemMsg,
    {
      role: "user",
      content: `Conversation summary so far:\n${summary.text}\n
Please continue where we left off.`,
    },
    {
      role: "assistant",
      content: "I've reviewed the summary and I'm ready to continue.",
    },
  ];
}

// ═══════════════════════════════════
// 2. Sliding Window (Token-based!)
// ═══════════════════════════════════

function slidingWindow(messages, maxTokens) {
  const system = messages.filter((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");

  let totalTokens = estimateTokens(system.map((m) => m.content).join(""));
  const kept = [];

  // Walk backwards, keeping recent messages!
  for (let i = nonSystem.length - 1; i >= 0; i--) {
    const msg = nonSystem[i];
    const tokens = estimateTokens(msg.content);

    if (totalTokens + tokens > maxTokens) break;

    // CRITICAL: Don't break tool call pairs!
    if (msg.role === "tool") {
      // Must also include the tool_call that triggered it!
      kept.unshift(msg);
      totalTokens += tokens;
    } else {
      kept.unshift(msg);
      totalTokens += tokens;
    }
  }

  return [...system, ...kept];
}

// ═══════════════════════════════════
// 3. Sub-Agent Pattern
// ═══════════════════════════════════

async function delegateToSubAgent(task, parentMessages) {
  // Sub-agent gets its own FULL context window!
  const result = await generateText({
    model: openai("gpt-4o"),
    system:
      "You are a specialized sub-agent. " +
      "Complete the assigned task and return " +
      "ONLY the semantic result.",
    prompt: task,
  });

  // Parent only sees the RESULT, not the details!
  parentMessages.push({
    role: "assistant",
    content: `Sub-task completed: ${result.text}`,
  });

  return result.text;
}

// ═══════════════════════════════════
// 4. Simple RAG pattern
// ═══════════════════════════════════

// "Like an open book test. Go to the glossary."
async function ragSearch(query, vectorDb) {
  // Step 1: Vectorize the query!
  const queryVector = await embed(query);

  // Step 2: Find closest matches!
  const results = await vectorDb.search(queryVector, {
    limit: 5, // Only top 5!
  });

  // Step 3: Return ONLY relevant context!
  return results.map((r) => r.content).join("\n");
}

// ═══════════════════════════════════
// 5. Automatic User Facts Extraction
// ═══════════════════════════════════

// "ChatGPT remembers your favorite color is blue
//  WITHOUT you telling it to remember."

async function extractUserFacts(message) {
  const result = await generateText({
    model: openai("gpt-4o-mini"), // Cheap model!
    prompt: `Extract personal facts/preferences from:
"${message}"
Return JSON array of facts, or empty array.`,
  });

  return JSON.parse(result.text);
}

// Store facts separately, inject every conversation!
async function injectUserFacts(messages, userId) {
  const facts = await db.getUserFacts(userId);
  if (facts.length > 0) {
    const systemMsg = messages.find((m) => m.role === "system");
    systemMsg.content +=
      `\n\nKnown user preferences:\n` + facts.map((f) => `- ${f}`).join("\n");
  }
  return messages;
}
```

---

## §10. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 10.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO KHÔNG CÓ PERFECT SOLUTION?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao context management khó?
  └→ "How do you know what matters? It's SEMANTICS,
     not logical. Can't just write code for it."

  WHY ②: Tại sao summarization suy giảm dần?
  └→ "Compact once: lost a little. 300 messages later:
     compact AGAIN including the previous summary.
     Merge summaries. Gets SLOPPY really quick."

  WHY ③: Tại sao sliding window dangerous?
  └→ "Can break tool call PAIRS. LLM expects tool
     result next but gets user message. BREAKS."

  WHY ④: Tại sao sub-agents vẫn cần summarization?
  └→ "Results from each sub-agent must be summarized
     into one message for the parent anyway."

  WHY ⑤: Tại sao RAG tốt nhất?
  └→ "Only puts RELEVANT info in context. Like
     going to the GLOSSARY not reading the textbook."
```

### 10.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — CONTEXT = FINITE MEMORY:
═══════════════════════════════════════════════════════════════

  LLM context = human working memory!
  → Limited! Finite! Precious!
  → Must manage what goes in!
  → Must decide what to forget!

  6 strategies = 6 ways to manage memory:
  1. Summarize (compress)
  2. Evict (forget oldest)
  3. Delegate (more brains)
  4. Index (external memory — RAG)
  5. Reset (start over)
  6. Prevent (don't overload)
```

### 10.3 Pattern ③: Trade-off Analysis

```
STRATEGY COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌────────────┬──────────┬────────┬────────┬────────┐
  │ Strategy   │ Detail   │ Cost   │ Simple │ Durable│
  ├────────────┼──────────┼────────┼────────┼────────┤
  │ Compaction │ ⚠️ Some  │ $$ LLM │ ✅     │ ⚠️     │
  │ Eviction   │ ❌ None  │ Free!  │ ✅✅   │ ❌     │
  │ Sub-agents │ ✅ Full  │ $$$    │ ❌     │ ✅     │
  │ RAG        │ ✅ Best  │ $$     │ ❌     │ ✅✅   │
  │ Reset      │ ❌ Gone  │ Free!  │ ✅✅✅  │ ❌❌   │
  │ Selective  │ ✅ Good  │ Free!  │ ⚠️     │ ✅     │
  └────────────┴──────────┴────────┴────────┴────────┘
```

### 10.4 Pattern ④: Mental Mapping

```
MENTAL MAP — CONTEXT MANAGEMENT:
═══════════════════════════════════════════════════════════════

  Context window filling up!
       │
       ├── COMPRESS → Summarization (lose detail!)
       │
       ├── DROP → Sliding window (lose history!)
       │   └── DANGER: Don't break tool pairs!
       │
       ├── SPLIT → Sub-agents (more windows!)
       │   └── "Just tell me when you're DONE."
       │
       ├── INDEX → RAG (external memory!)
       │   └── "The GLOSSARY of a textbook."
       │
       ├── NUKE → Start fresh (clean slate!)
       │   └── "You're sounding STUPID. Clear."
       │
       └── PREVENT → Selective input (be efficient!)
           └── "Stop returning GARBAGE!"
```

### 10.5 Pattern ⑤: Reverse Engineering — ChatGPT Memory

```
REVERSE ENGINEERING — CHATGPT REMEMBERS:
═══════════════════════════════════════════════════════════════

  USER: "Can you pick up my suit? It's this
   blue suit. My favorite color is blue."
       │
       ▼
  SEPARATE LLM extracts:
  → Fact: "User's favorite color is blue"
  → Stored outside conversation!
       │
       ▼
  EVERY new conversation:
  → Facts injected into system prompt!
  → "Here's a list of user facts/preferences."
  → "ChatGPT REMEMBERS your favorite color
     WITHOUT you telling it to remember."
       │
       ▼
  Even after compaction:
  → Detail "blue" might be lost in summary!
  → But the FACT is stored separately!
  → "Restores those details."
```

### 10.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — CONTEXT MANAGEMENT:
═══════════════════════════════════════════════════════════════

  Early ChatGPT: "Make a NEW CHAT. Getting big."
  │ → Manual reset! User decides!
  ↓
  Claude Code: "I'm about to compress. Letting you know."
  │ → Warning! "It's going to get BAD."
  ↓
  ChatGPT memory: "Remembers facts WITHOUT asking."
  │ → Automatic fact extraction!
  ↓
  RAG: "Only relevant info in context."
  │ → The glossary approach!
  ↓
  Sub-agents: "Spin up more LLMs!"
  │ → "Each gets FULL context budget."
  ↓
  Future: "There's NO PERFECT SOLUTION."
  │ → Combination of all strategies!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 26:
═══════════════════════════════════════════════════════════════

  COMPACTION:
  [ ] Summarize when near threshold!
  [ ] Loses detail! "Devil in the details!"
  [ ] Recursive summarization gets SLOPPY!
  [ ] Costs extra LLM tokens!

  EVICTION:
  [ ] Drop oldest, keep recent!
  [ ] Use TOKEN count, not MESSAGE count!
  [ ] DON'T break tool call pairs! CRITICAL!
  [ ] UX hack: sync user view with agent view!

  SUB-AGENTS:
  [ ] Each agent has own context window!
  [ ] Parent only sees semantic output!
  [ ] Coordination overhead is HIGH!

  RAG:
  [ ] Vectorize content → numbers → plot → math!
  [ ] "Glossary of a textbook! NOT the textbook!"
  [ ] Only RELEVANT info in context!

  PRACTICAL:
  [ ] Start fresh when poisoned!
  [ ] File-based memory transfer!
  [ ] Selective input prevention!
  [ ] "There's NO PERFECT SOLUTION."

  TIẾP THEO → Phần 27: Creating a Web Search Tool!
```
