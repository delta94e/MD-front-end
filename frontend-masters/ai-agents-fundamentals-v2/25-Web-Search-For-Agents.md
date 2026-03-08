# AI Agents Fundamentals, v2 — Phần 25: Web Search for Agents — "Don't Build Your Own. Just DON'T."

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Web Search for Agents — "Function Calling vs Native Tools, Grounding, Context Window Crisis!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Tool types, context management, attention mechanism, lost in the middle!

---

## Mục Lục

| #   | Phần                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | Web Search = Grounding — "Real Up-To-Date Truth!"                 |
| 2   | Function Calling vs Native Tools — "Your Machine vs Theirs!"      |
| 3   | Web Search Providers — "Don't Build Your Own. Just DON'T."        |
| 4   | OpenAI's Greedy Search — "Many Many Many Times!"                  |
| 5   | Parallel Web Search — "Multiple Tabs, Just Like You!"             |
| 6   | Deep Research — "10 Minutes But INCREDIBLE Results!"              |
| 7   | Context Window Explained — "400K Tokens = Precious Gold!"         |
| 8   | Attention Mechanism — "The T in ChatGPT!"                         |
| 9   | Lost In The Middle — "Remembers Beginning & End, Forgets Middle!" |
| 10  | Context Efficiency — "Only Let In What You Need!"                 |
| 11  | Tự Implement: Context Window Concepts                             |
| 12  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu                |

---

## §1. Web Search = Grounding — "Real Up-To-Date Truth!"

> Scott: _"Grounding — making sure your LLM has accurate, up-to-date information before it decides. It's grounded in truth."_

```
WEB SEARCH FOR AGENTS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "What if your LLM could use Google?              │
  │  That's essentially it."                         │
  │                                                  │
  │ BUT: "It's harder than that. REALLY harder."    │
  │                                                  │
  │ How YOU use Google:                               │
  │ → Browser! Visual! Click links! Scroll!        │
  │ → "I don't think anyone uses Google with API."  │
  │                                                  │
  │ How AGENT uses web search:                       │
  │ → API! Programmatic! Structured results!       │
  │ → "Programmatically hitting some API and        │
  │    getting results from the web."               │
  │                                                  │
  │ This is NOT a browser agent:                     │
  │ → "There ARE tools for browser (Playwright,    │
  │    Browser Base). This course was going to be   │
  │    a browser-driving agent. Too complicated."   │
  │                                                  │
  │ = GROUNDING!                                     │
  │ → "Grounded in truth. Real, up-to-date truth." │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Function Calling vs Native Tools — "Your Machine vs Theirs!"

> Scott: _"A native tool is running on the PROVIDER, not our infrastructure. The compute is on THEIR side."_

```
TWO TYPES OF TOOL CALLING:
═══════════════════════════════════════════════════════════════

  ① FUNCTION CALLING (what we've been doing!):
  ┌──────────────────────────────────────────────────┐
  │ → execute() runs on YOUR machine!              │
  │ → "A function that WE wrote."                  │
  │ → "Even if npm installed, still on our machine."│
  │ → Full control! See the code!                  │
  │                                                  │
  │ Agent → "call readFile" → YOUR computer runs it│
  │                           → returns result!    │
  └──────────────────────────────────────────────────┘

  ② NATIVE TOOLS (provider-hosted!):
  ┌──────────────────────────────────────────────────┐
  │ → Runs on the PROVIDER'S infrastructure!       │
  │ → "Not running on OUR infrastructure,           │
  │    running on THEIRS."                           │
  │ → "They make the call, they have their own      │
  │    function."                                    │
  │ → Less control! It's their algorithm!          │
  │                                                  │
  │ Agent → "search web" → OPENAI's server runs it │
  │                         → returns results!     │
  └──────────────────────────────────────────────────┘

  COMPARISON:
  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Function Call │ Native Tool       │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Runs on          │ YOUR machine! │ THEIR server!     │
  │ Control          │ ✅ Full!      │ ❌ Limited!       │
  │ Customizable     │ ✅ Anything!  │ ❌ Their way!     │
  │ Cost             │ Free (yours!) │ $$$ (their API!)  │
  │ Rate limits      │ Your limits!  │ Their limits!     │
  │ Model locked     │ ❌ Any model! │ ✅ Their model!   │
  │ Setup            │ Write code!   │ Just enable!      │
  └──────────────────┴───────────────┴───────────────────┘
```

---

## §3. Web Search Providers — "Don't Build Your Own. Just DON'T."

> Scott: _"Please do not make your own web search tool. As an exercise, yes, go do it. But then STOP. Use something else."_

```
WEB SEARCH PROVIDERS:
═══════════════════════════════════════════════════════════════

  NATIVE (provider-hosted!):
  ┌──────────────────────────────────────────────────┐
  │ • OpenAI web search (what we'll use!)           │
  │ • Google Gemini grounding                        │
  │ • Perplexity                                     │
  │                                                  │
  │ → "Only works for specific models."             │
  │ → "Can't customize search sources."             │
  │ → "Their algorithm. You just call with a query." │
  └──────────────────────────────────────────────────┘

  TOOL-BASED (API services!):
  ┌──────────────────────────────────────────────────┐
  │ • Xa / Exa — "Literally Google for AI!"        │
  │   → Crawl, answers, research, web sets!        │
  │                                                  │
  │ • Parallel Web — "I want to try it!"           │
  │   → "Pretty clean design. They're boasting      │
  │     they're better than everyone else."         │
  │                                                  │
  │ • Firecrawl — "Very popular!"                   │
  │                                                  │
  │ → "There are A LOT of people trying to solve   │
  │    this. That's the point I'm making."          │
  │                                                  │
  │ → "Please do NOT make your own. As an exercise, │
  │    yes. But then STOP. Use something else."     │
  │                                                  │
  └──────────────────────────────────────────────────┘

  BROWSER-BASED (agent drives browser!):
  ┌──────────────────────────────────────────────────┐
  │ • Playwright MCP                                 │
  │ • Browser Base                                   │
  │ → "Not what we're doing. Different approach."   │
  └──────────────────────────────────────────────────┘
```

---

## §4. OpenAI's Greedy Search — "Many Many Many Times!"

> Scott: _"It will call the web search tool MANY many many many many times for the simplest query. I'm sure it's to make you PAY them more money."_

```
OPENAI'S WEB SEARCH BEHAVIOR:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "I don't know the descriptions or prompts that  │
  │  it's telling our LLM."                         │
  │                                                  │
  │ "I'm GUESSING OpenAI is like: 'You should use  │
  │  this as many times as you want, Mr. LLM,      │
  │  and DON'T BE AFRAID to use it.'"              │
  │                                                  │
  │ RESULT:                                          │
  │ Simple query → 6-10 web search calls! 😱      │
  │                                                  │
  │ "I'm sure it's to make sure you PAY them more   │
  │  money." 💸                                     │
  │                                                  │
  │ → Can't control search behaviour!              │
  │ → Can't see internal tool descriptions!        │
  │ → Unless you do tracing! (Laminar!)            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Parallel Web Search — "Multiple Tabs, Just Like You!"

> Scott: _"It's the equivalent of opening multiple tabs and Googling in multiple tabs. Different branches of Googling."_

```
PARALLEL SEARCH STRATEGY:
═══════════════════════════════════════════════════════════════

  "If you were REALLY good at Googling..."

  YOU:
  ┌──────────────────────────────────────────────────┐
  │ Tab 1: "best react state management 2025"       │
  │ Tab 2: "zustand vs jotai comparison"            │
  │ Tab 3: "react server components state"          │
  │                                                  │
  │ Wait for all tabs → pick best results!         │
  │ → "This one sucks. Dive into this one."        │
  └──────────────────────────────────────────────────┘

  AGENT does the SAME THING:
  ┌──────────────────────────────────────────────────┐
  │ Tool call 1: search("react state management")   │
  │ Tool call 2: search("zustand vs jotai")          │
  │ Tool call 3: search("server components state")   │
  │ → All running PARALLEL!                        │
  │ → Wait, compare, dive deeper!                  │
  │                                                  │
  │ "Multiple tabs! All running parallel.            │
  │  Which one's better? Dive into this one!"       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Deep Research — "10 Minutes But INCREDIBLE Results!"

> Scott: _"Highly recommend using deep research. It takes 10 minutes but comes back with a FULL REPORT with annotated sources. I use it for EVERYTHING."_

```
DEEP RESEARCH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "Deep research on ChatGPT or Gemini."           │
  │ "A little thing you can toggle on."             │
  │                                                  │
  │ WHAT IT DOES:                                    │
  │ → Set of tools (web search + more!)            │
  │ → Takes ~10 minutes to run!                    │
  │ → Full report! Annotated sources! Citations!   │
  │ → "I use it for EVERYTHING."                   │
  │                                                  │
  │ BUILD YOUR OWN — HIGHLY RECOMMEND:               │
  │ → Deep research on ANY index!                  │
  │ → Web? GitHub repo? Database?                  │
  │ → "The INDEX doesn't matter."                  │
  │ → "Being able to deeply research something     │
  │    to find truth and CITE those sources         │
  │    is a really good tool to have."              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Context Window Explained — "400K Tokens = Precious Gold!"

> Scott: _"That token window is PRECIOUS. RAM prices are insane. It's literally GOLD."_

```
CONTEXT WINDOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ WHAT IS IT:                                      │
  │ → The messages array! Everything in it!        │
  │ → "How many tokens can you have in that array?" │
  │ → Input + output = total window!               │
  │                                                  │
  │ TOKEN ≈ 3.5 characters (on average!)            │
  │ → Each model calculates differently!           │
  │                                                  │
  │ MODEL LIMITS:                                    │
  │ ┌──────────────┬───────────┬──────────┐         │
  │ │ Model        │ Window    │ Max Out  │         │
  │ ├──────────────┼───────────┼──────────┤         │
  │ │ GPT-4.5      │ 400K     │ 128K     │         │
  │ │ GPT-4o-1     │ 400K     │ 128K     │         │
  │ │ o3 Pro       │ 300K     │ 100K     │         │
  │ │ Gemini       │ 1M+      │ varies   │         │
  │ └──────────────┴───────────┴──────────┘         │
  │                                                  │
  │ Input = Window - Max Output                      │
  │ 400K - 128K = 272K input tokens!                │
  │                                                  │
  │ "Once you get PAST that, the model can no        │
  │  longer do inference."                           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Attention Mechanism — "The T in ChatGPT!"

> Scott: _"The T in ChatGPT. It considers all the words before it and all the words after it to calculate the next token."_

```
ATTENTION MECHANISM:
═══════════════════════════════════════════════════════════════

  "The T in ChatGPT = TRANSFORMER = Attention!"

  HOW IT WORKS:
  ┌──────────────────────────────────────────────────┐
  │ To predict the NEXT token:                       │
  │                                                  │
  │ ← looks this way    looks this way →           │
  │ [tokens before]  ?  [tokens after]              │
  │                  ↑                               │
  │          "What should I be?"                     │
  │                                                  │
  │ "It considers ALL the words before it and ALL   │
  │  the words after it."                            │
  │                                                  │
  │ MORE tokens in both directions:                  │
  │ → Takes LONGER! More RAM! More compute!        │
  │ → "RAM is literally GOLD right now.             │
  │    There's a RAM catastrophe in America."       │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHY LIMITS EXIST:
  ┌──────────────────────────────────────────────────┐
  │ All tokens must be kept IN MEMORY!              │
  │ Attention = O(n²) complexity!                   │
  │ → 100K tokens = 10 billion computations!       │
  │ → 400K tokens = 160 billion computations!      │
  │ → 1M tokens = 1 TRILLION! 🤯                  │
  │                                                  │
  │ "This directly affects inference."              │
  └──────────────────────────────────────────────────┘
```

---

## §9. Lost In The Middle — "Remembers Beginning & End, Forgets Middle!"

> Scott: _"Things at the beginning, definitely things at the end, the most recent. But somewhere in the MIDDLE, it kind of FORGETS."_

```
LOST IN THE MIDDLE PROBLEM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ BEGINNING: ✅ Remembers well!                   │
  │ → "Less influenced by other tokens."           │
  │ → "Nothing before it."                         │
  │ → System prompt lives here! Still strong!      │
  │                                                  │
  │ MIDDLE: ❌ FORGETS! "Lost in the middle!"       │
  │ → "Heavily influenced by tokens before AND     │
  │    tokens after."                                │
  │ → "Harder to remember or consider."            │
  │ → "A lot of information. Hard to think about." │
  │                                                  │
  │ END: ✅ Remembers most!                         │
  │ → "Most recent, influenced less by others."    │
  │ → "Haven't gotten there yet."                  │
  │ → User's latest message! Very strong!          │
  └──────────────────────────────────────────────────┘

  VISUALIZATION:

  Memory strength: ████████░░░░░░░░░░░░░░████████
                    ^                          ^
                 Beginning                    End
                 (good!)                   (best!)
                           ^ Middle ^
                         (forgotten! 😱)

  WHY:
  ┌──────────────────────────────────────────────────┐
  │ Beginning tokens: less "polluted" by others!    │
  │ End tokens: most recent, freshest!              │
  │ Middle tokens: "heavily influenced by the        │
  │ tokens before it AND the tokens after it."      │
  │                                                  │
  │ "POSITIONAL MATTERS."                            │
  │                                                  │
  │ "That's why a million token limit is like        │
  │ 'oh cool, but the accuracy is so BAD,           │
  │  I don't even want to approach that.'           │
  │  What's the POINT?"                             │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §10. Context Efficiency — "Only Let In What You Need!"

> Scott: _"Your GOAL is to keep the context window as EFFICIENT as possible. Only let in what you need. Find ways to NOT have things that don't matter."_

```
CONTEXT WINDOW EFFICIENCY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ CONSEQUENCES of big context:                     │
  │                                                  │
  │ At 360K of 400K limit:                           │
  │ → "Performance and accuracy getting WORSE!"    │
  │ → "That 99% model isn't 99% anymore."         │
  │ → Speed: slower inference!                     │
  │ → Cost: more tokens = more money!              │
  │ → Lost in middle: forgets information!         │
  │                                                  │
  │ THE GOAL:                                        │
  │ "Keep context as EFFICIENT as possible."        │
  │ "Only let in what you NEED to let in."          │
  │ "Find ways to NOT have things that don't matter."│
  │                                                  │
  │ THE SCIENCE:                                     │
  │ "How do you know what matters? How do you know  │
  │  what DOESN'T matter when it's all SEMANTICS?   │
  │  It's not something you can just write code for."│
  │                                                  │
  └──────────────────────────────────────────────────┘

  STRATEGIES:
  ┌──────────────────────────────────────────────────┐
  │ ① Write to files: don't keep in context!       │
  │ ② Summarize: compress old messages!             │
  │ ③ Truncate: keep recent, drop old!             │
  │ ④ Relevance filter: only important messages!   │
  │ ⑤ Tool output storage: cache big results!      │
  │                                                  │
  │ "But that's the SCIENCE. It's semantic, not     │
  │  logical. Can't just write code for it."        │
  └──────────────────────────────────────────────────┘
```

---

## §11. Tự Implement: Context Window Concepts

```javascript
// ═══════════════════════════════════
// 1. Token Estimation
// ═══════════════════════════════════

function estimateTokens(text) {
  // "On average, a token is every 3.5 letters."
  return Math.ceil(text.length / 3.5);
}

function getContextSize(messages) {
  let totalTokens = 0;
  for (const msg of messages) {
    totalTokens += estimateTokens(
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content),
    );
  }
  return totalTokens;
}

// ═══════════════════════════════════
// 2. Context Window Monitor
// ═══════════════════════════════════

function checkContextHealth(messages, maxTokens = 400000) {
  const current = getContextSize(messages);
  const usage = current / maxTokens;

  if (usage > 0.9) {
    return {
      status: "CRITICAL",
      message:
        `${(usage * 100).toFixed(0)}% used! ` +
        "Accuracy degrading significantly!",
      action: "MUST trim context immediately!",
    };
  }
  if (usage > 0.7) {
    return {
      status: "WARNING",
      message:
        `${(usage * 100).toFixed(0)}% used. ` +
        "Lost-in-middle effects starting!",
      action: "Consider summarizing old messages.",
    };
  }
  return {
    status: "HEALTHY",
    message: `${(usage * 100).toFixed(0)}% used.`,
    action: "No action needed.",
  };
}

// ═══════════════════════════════════
// 3. Context Trimming Strategies
// ═══════════════════════════════════

function trimContext(messages, maxTokens) {
  // STRATEGY 1: Keep system + recent messages!
  const system = messages.filter((m) => m.role === "system");
  const recent = messages.slice(-10); // Last 10 messages!

  // STRATEGY 2: Summarize middle!
  const middle = messages.slice(system.length, messages.length - 10);

  if (middle.length > 0) {
    const summary = {
      role: "system",
      content:
        `[Previous conversation summary: ` +
        `${middle.length} messages about ` +
        `${extractTopics(middle).join(", ")}]`,
    };
    return [...system, summary, ...recent];
  }

  return messages;
}

// ═══════════════════════════════════
// 4. Smart Tool Output Storage
// ═══════════════════════════════════

// "Web search returned a bunch of stuff?
//  Write to file! Look at it when you need it."

async function storeAndReference(toolName, result) {
  if (estimateTokens(result) > 1000) {
    // Too big for context! Store to file!
    const path = `.cache/${toolName}-${Date.now()}.md`;
    await writeFile(path, result);
    return (
      `Results stored at ${path}. ` +
      `Read this file when you need the details. ` +
      `Summary: ${result.slice(0, 200)}...`
    );
  }
  return result; // Small enough, keep in context!
}
```

---

## §12. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 12.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO CONTEXT WINDOW QUAN TRỌNG?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao web search gây context problems?
  └→ "Search results = lots of tokens! Multiple
     searches = overwhelming the context!"

  WHY ②: Tại sao million-token window không tốt hơn?
  └→ "Accuracy is so BAD approaching that limit.
     Lost in the middle. What's the POINT?"

  WHY ③: Tại sao LLM quên thông tin ở giữa?
  └→ "Middle tokens heavily influenced by tokens
     before AND after. Harder to consider."

  WHY ④: Tại sao không tự build web search?
  └→ "Please don't. As exercise yes. But STOP.
     Use something else. So many providers."

  WHY ⑤: Tại sao native tools locked to provider?
  └→ "Code runs on THEIR server. Can only use
     with THEIR model. You're locked in."
```

### 12.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — CONTEXT = MEMORY:
═══════════════════════════════════════════════════════════════

  Context window = LLM's working memory!

  Like human working memory:
  → Limited capacity! (7±2 items for humans!)
  → Forgets middle! (Primacy & Recency effects!)
  → Overloading = worse performance!
  → "More" ≠ "better"!

  "Your GOAL: keep it EFFICIENT.
   Only let in what you NEED."
```

### 12.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Web search       │ Native        │ Tool-based        │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Setup            │ ✅ Easy!      │ ⚠️ More code!     │
  │ Control          │ ❌ None!      │ ✅ Full!          │
  │ Model locked     │ ❌ Yes!       │ ✅ Any model!     │
  │ Cost control     │ ❌ Greedy!    │ ✅ You decide!    │
  │ Customizable     │ ❌ Their algo │ ✅ Your logic!    │
  └──────────────────┴───────────────┴───────────────────┘

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Context strategy │ Keep all      │ Trim/store        │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Information      │ ✅ Complete!  │ ⚠️ May lose some! │
  │ Speed            │ ❌ Slow!      │ ✅ Fast!          │
  │ Cost             │ ❌ Expensive! │ ✅ Cheaper!       │
  │ Accuracy         │ ❌ Degraded!  │ ✅ Better focus!  │
  │ "Lost in middle" │ ❌ YES!       │ ✅ Mitigated!     │
  └──────────────────┴───────────────┴───────────────────┘
```

### 12.4 Pattern ④: Mental Mapping

```
MENTAL MAP — WEB SEARCH & CONTEXT:
═══════════════════════════════════════════════════════════════

  User query: "What's the latest React news?"
       │
       ▼
  Agent decides: "I need web search!"
       │
       ├── NATIVE TOOL:
       │   Agent → OpenAI server → search → results
       │   → "Runs on THEIR infrastructure!"
       │   → Multiple parallel searches! (greedy!)
       │
       └── FUNCTION TOOL:
           Agent → YOUR code → Exa API → results
           → "Runs on YOUR machine!"
           → You control how many searches!
       │
       ▼
  Results returned (many tokens!)
       │
       ├── KEEP IN CONTEXT:
       │   → Messages array grows!
       │   → Context window fills up!
       │   → Lost in the middle! 😱
       │
       └── STORE TO FILE:
           → Write to .cache/search-results.md
           → Small summary in context!
           → Read file when needed!
           → Context stays efficient! ✅
```

### 12.5 Pattern ⑤: Reverse Engineering — Attention Math

```
REVERSE ENGINEERING — WHY O(n²):
═══════════════════════════════════════════════════════════════

  Attention = Each token looks at EVERY other token!

  For each token i:
    For each token j:
      Calculate attention(i, j)

  n tokens = n × n computations = O(n²)!

  100K tokens:  10,000,000,000   ops  ← manageable!
  400K tokens: 160,000,000,000   ops  ← heavy!
  1M tokens:   1,000,000,000,000 ops  ← INSANE! 🤯

  "RAM prices are insane. It's literally GOLD.
   That token window is PRECIOUS."
```

### 12.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — WEB SEARCH IN AI:
═══════════════════════════════════════════════════════════════

  No internet: LLM knows nothing after cutoff!
  │ → "Knowledge up to June 2024."
  ↓
  RAG (Retrieval Augmented Generation):
  │ → Search YOUR data, inject into prompt!
  ↓
  Web search tools (API-based):
  │ → Exa, Perplexity, Firecrawl!
  │ → "Google for AI!"
  ↓
  Native provider tools:
  │ → OpenAI built-in web search!
  │ → "Runs on THEIR infrastructure!"
  │ → But GREEDY! "Many many many times!"
  ↓
  Deep research:
  │ → 10 minutes! Full report! Sources!
  │ → "I use it for EVERYTHING."
  │ → "Precursor to making your OWN
  │    deep research tool."
  ↓
  Browser-driving agents:
  │ → Playwright, Browser Base!
  │ → "This course was going to be that.
  │    Too complicated."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 25:
═══════════════════════════════════════════════════════════════

  WEB SEARCH TYPES:
  [ ] Function calling = YOUR machine!
  [ ] Native tools = THEIR server!
  [ ] "Grounding = up-to-date truth!"

  PROVIDERS:
  [ ] OpenAI (native, greedy, locked in!)
  [ ] Exa, Firecrawl, Parallel Web (API tools!)
  [ ] "Don't build your own. Just DON'T."

  CONTEXT WINDOW:
  [ ] 400K tokens ~ messages array capacity!
  [ ] Token ≈ every 3.5 characters!
  [ ] Input + Output = total window!
  [ ] "Once past limit, can't do inference!"

  ATTENTION:
  [ ] The T in ChatGPT = Transformer = Attention!
  [ ] O(n²) complexity! Each token looks at ALL others!
  [ ] "RAM is literally GOLD right now!"

  LOST IN THE MIDDLE:
  [ ] Beginning = remembered well!
  [ ] Middle = FORGOTTEN! "Heavily influenced!"
  [ ] End = remembered BEST! Most recent!
  [ ] "Million tokens? Cool but accuracy SO BAD."

  EFFICIENCY:
  [ ] "Only let in what you NEED!"
  [ ] Store big results to files!
  [ ] Summarize old messages!
  [ ] "That's the SCIENCE — semantic, not logical."

  TIẾP THEO → Phần 26: Context Management!
```
