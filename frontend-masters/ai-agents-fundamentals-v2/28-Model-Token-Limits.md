# AI Agents Fundamentals, v2 — Phần 28: Model Token Limits — "I Just Guessed!"

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Model Token Limits — "Hardcode Limits, Threshold Math, Token Estimation!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — Token counting, threshold logic, model limits registry!

---

## Mục Lục

| #   | Phần                                                             |
| --- | ---------------------------------------------------------------- |
| 1   | Why Count Tokens — "We Need Compaction Even Without Web Search!" |
| 2   | Model Limits Registry — "Numbers From Their Model Cards!"        |
| 3   | Token Estimation — "I Kind Of Just Guessed!"                     |
| 4   | isOverThreshold — "Basic Math!"                                  |
| 5   | calculateUsagePercentage — "Show The User!"                      |
| 6   | Threshold = Your Choice — "Flying Close To The Sun!"             |
| 7   | Recursive Compaction Problem — "Gets SLOPPY Quick!"              |
| 8   | Tự Implement: Token Limits System                                |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu               |

---

## §1. Why Count Tokens — "We Need It Even Without Web Search!"

> Scott: _"Web search introduces tons of tokens. But even without web search, someone's gonna have a long chatty conversation. We STILL need it."_

```
WHY TOKEN COUNTING MATTERS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "We need to count tokens and know the limits."  │
  │                                                  │
  │ Reason 1: Web search = lots of tokens!          │
  │ Reason 2: Long chatty conversations!            │
  │ Reason 3: Tool results accumulate!              │
  │ Reason 4: To trigger compaction at right time!  │
  │                                                  │
  │ "OpenAI MIGHT already compact web results.      │
  │  I don't know. Regardless, we're building our   │
  │  own because we need it anyway."                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Model Limits Registry — "Numbers From Their Model Cards!"

> Scott: _"I didn't come up with these numbers. That's what these models say. Every model has different limits. I just put them in here so I can do my math."_

```javascript
// context/modelLimits.ts — Hardcoded registry!

const DEFAULT_THRESHOLD = 0.8; // 80%!

const MODEL_LIMITS = {
  "gpt-4.5": {
    inputTokens: 128_000,
    outputTokens: 128_000,
    contextWindow: 400_000,
  },
  "gpt-4o-1": {
    inputTokens: 128_000,
    outputTokens: 128_000,
    contextWindow: 400_000,
  },
  "o3-pro": {
    inputTokens: 100_000,
    outputTokens: 100_000,
    contextWindow: 300_000,
  },
};

// Default for unknown models!
const DEFAULT_LIMITS = {
  inputTokens: 100_000,
  outputTokens: 50_000,
  contextWindow: 200_000,
};
```

```
WHY HARDCODE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "There ARE npm packages that have these listed   │
  │  and keep them up to date."                      │
  │                                                  │
  │ "I just don't want to get burdened later.       │
  │  Somebody kills that package with npm.           │
  │  Or it ends up creating a WORM on someone's     │
  │  computer because somebody hacked npm."          │
  │                                                  │
  │ "I was like I'm just NOT going to do that.      │
  │  I'm just going to hardcode it.                  │
  │  I don't want those problems."                   │
  │                                                  │
  │ = DEPENDENCY AVOIDANCE for critical config!     │
  └──────────────────────────────────────────────────┘
```

---

## §3. Token Estimation — "I Kind Of Just Guessed!"

> Scott: _"On average, every 3.75 characters is a token. It's not 100% accurate but I did it for brevity."_

```javascript
// The PROPER way to count tokens:
// → Needs a tokenizer model!
// → Is ASYNC! Costs money!
// → Changes depending on model!
// → "Too many variables."

// The SIMPLE way (what we're doing!):
function estimateTokens(text) {
  // "On average, every 3.75 characters is a token."
  return Math.ceil(text.length / 3.75);
}

function estimateMessageTokens(messages) {
  let input = 0;
  let output = 0;

  for (const msg of messages) {
    const content =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);
    const tokens = estimateTokens(content);

    if (msg.role === "assistant") {
      output += tokens;
    } else {
      input += tokens;
    }
  }

  return { input, output, total: input + output };
}
```

```
PROPER vs SIMPLE:
═══════════════════════════════════════════════════════════════

  PROPER WAY:
  ┌──────────────────────────────────────────────────┐
  │ → Use tiktoken or provider API!                │
  │ → Async! Costs $$!                             │
  │ → Different per model!                         │
  │ → 100% accurate!                               │
  │ → "Too many variables, too slow, too resource   │
  │    intensive, respectfully."                    │
  └──────────────────────────────────────────────────┘

  SIMPLE WAY:
  ┌──────────────────────────────────────────────────┐
  │ → text.length / 3.75                           │
  │ → Synchronous! Free!                           │
  │ → Model-agnostic!                              │
  │ → ~95% accurate! "Close enough!"              │
  │ → "I kind of just GUESSED."                   │
  └──────────────────────────────────────────────────┘
```

---

## §4. isOverThreshold — "Basic Math!"

> Scott: _"Are the total tokens greater than the context window times the threshold? Basic math."_

```javascript
function isOverThreshold(totalTokens, contextWindow, threshold = 0.8) {
  return totalTokens >= contextWindow * threshold;
  // 400,000 * 0.8 = 320,000
  // If totalTokens >= 320,000 → COMPACT!
}
```

```
THE MATH:
═══════════════════════════════════════════════════════════════

  Context window: 400,000 tokens
  Threshold:      0.8 (80%)
  Trigger at:     400,000 × 0.8 = 320,000 tokens!

  If totalTokens >= 320,000 → Time to compact!

  "What if you're like: I like flying close to the sun?
   I'll put 90%. Actually, 99%."
   → 400,000 × 0.99 = 396,000! Living dangerously! 🔥
```

---

## §5. calculateUsagePercentage — "Show The User!"

> Scott: _"What is the percentage of context window have we used already? That way we can show the user."_

```javascript
function calculateUsagePercentage(totalTokens, contextWindow) {
  return (totalTokens / contextWindow) * 100;
  // 50,000 / 400,000 * 100 = 12.5%
}
```

---

## §6. Threshold = Your Choice — "Flying Close To The Sun!"

> Scott: _"When you want to compress, you can change that number and everything changes. It's up to YOU."_

```
THRESHOLD CHOICES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ 0.8 (80%) = Conservative! Room to breathe!     │
  │ 0.9 (90%) = "Flying close to the sun!"         │
  │ 0.99 = "Actually, 90.99%, whatever you want!"  │
  │                                                  │
  │ "The threshold is the number that I came up      │
  │  with. I just put 80%."                         │
  │                                                  │
  │ TOO LOW:                                         │
  │ → Compacts too often! Loses detail!            │
  │                                                  │
  │ TOO HIGH:                                        │
  │ → Risks hitting the hard limit!                │
  │ → "What if a single message is huge?"          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  Q: "What if you changed those model limit numbers?"
  ┌──────────────────────────────────────────────────┐
  │ LOWER: "You'd never hit the limit because       │
  │  ChatGPT says 400K but you think it's 40K."    │
  │                                                  │
  │ HIGHER: "You'll get an error REALLY QUICK       │
  │  because you thought it was 4M but OpenAI       │
  │  says it's only 400K."                           │
  │                                                  │
  │ "I didn't come up with these. I READ them       │
  │  from their model cards."                        │
  └──────────────────────────────────────────────────┘
```

---

## §7. Recursive Compaction Problem — "Gets SLOPPY Quick!"

> Scott: _"You compact one time, sure, one summary. 300 chat messages later, compacting AGAIN including a previous summary. Merge those summaries. Gets SLOPPY really quick."_

```
RECURSIVE DEGRADATION:
═══════════════════════════════════════════════════════════════

  Turn 1-50:    Full detail! Great conversation!
       │
       ▼ COMPACT!
  Summary 1:    Preserved key points! Lost some detail.

  Turn 51-350:  More conversation + Summary 1!
       │
       ▼ COMPACT AGAIN!
  Summary 2:    Summary of Summary 1 + new stuff!
                → "Now you got to MERGE those summaries."
                → Losing MORE detail!

  Turn 351-650: Even more conversation + Summary 2!
       │
       ▼ COMPACT AGAIN!
  Summary 3:    Summary of a summary of a summary!
                → "Gets SLOPPY really quick." 😵

  "Most agents just say: I'm about to compact.
   If you don't like that, you can just CLEAR IT."
   → "Which is what Claude does."
```

---

## §8. Tự Implement: Token Limits System

```javascript
// ═══════════════════════════════════
// COMPLETE Token Limits System
// ═══════════════════════════════════

// context/modelLimits.ts

const DEFAULT_THRESHOLD = 0.8;

const MODEL_LIMITS = {
  "gpt-4.5": {
    inputTokens: 128_000,
    outputTokens: 128_000,
    contextWindow: 400_000,
  },
  "gpt-4o": {
    inputTokens: 128_000,
    outputTokens: 16_384,
    contextWindow: 128_000,
  },
  "gpt-4o-mini": {
    inputTokens: 128_000,
    outputTokens: 16_384,
    contextWindow: 128_000,
  },
};

const DEFAULT_LIMITS = {
  inputTokens: 100_000,
  outputTokens: 50_000,
  contextWindow: 200_000,
};

function getModelLimits(modelName) {
  return MODEL_LIMITS[modelName] || DEFAULT_LIMITS;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 3.75);
}

function estimateMessageTokens(messages) {
  let input = 0;
  let output = 0;

  for (const msg of messages) {
    const content =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);
    const tokens = estimateTokens(content);

    if (msg.role === "assistant") {
      output += tokens;
    } else {
      input += tokens;
    }
  }

  return { input, output, total: input + output };
}

function isOverThreshold(
  totalTokens,
  contextWindow,
  threshold = DEFAULT_THRESHOLD,
) {
  return totalTokens >= contextWindow * threshold;
}

function calculateUsagePercentage(totalTokens, contextWindow) {
  return (totalTokens / contextWindow) * 100;
}

export {
  getModelLimits,
  estimateTokens,
  estimateMessageTokens,
  isOverThreshold,
  calculateUsagePercentage,
  DEFAULT_THRESHOLD,
};
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO KHÔNG DÙNG TOKENIZER CHÍNH XÁC?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao ước lượng thay vì chính xác?
  └→ "Async, costs money, changes per model. Too
     many variables. Too slow. Too resource intensive."

  WHY ②: Tại sao hardcode model limits?
  └→ "npm packages could be hacked. Somebody creates
     a worm. I don't want those problems."

  WHY ③: Tại sao 80% threshold chứ không phải 100%?
  └→ "You need ROOM. One huge message could push
     you over. Buffer zone for safety."

  WHY ④: Tại sao cần default limits?
  └→ "If model not in registry, still need SOME
     limits. Conservative defaults."

  WHY ⑤: Tại sao summarization suy giảm recursively?
  └→ "Summary of summary of summary. Merging gets
     SLOPPY. No perfect solution."
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TOKEN MATH:
═══════════════════════════════════════════════════════════════

  Token = smallest unit of text for LLM!
  Context window = maximum tokens in memory!
  Threshold = when to act before limit!

  Everything else is just: count, compare, act!
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │ Token counting   │ Exact         │ Estimated         │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Accuracy         │ ✅ 100%!      │ ⚠️ ~95%!          │
  │ Speed            │ ❌ Slow!      │ ✅ Instant!       │
  │ Cost             │ ❌ $$$!       │ ✅ Free!          │
  │ Complexity       │ ❌ Async!     │ ✅ One line!      │
  │ Model-specific   │ ❌ Yes!       │ ✅ Universal!     │
  └──────────────────┴───────────────┴───────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — TOKEN FLOW:
═══════════════════════════════════════════════════════════════

  Messages array
       │
       ▼
  estimateMessageTokens(messages)
       │ → { input: X, output: Y, total: Z }
       │
       ▼
  isOverThreshold(Z, contextWindow, 0.8)
       │
       ├── false → Continue normally! ✅
       │
       └── true → COMPACT! Trigger summarization!
                   │
                   ▼
              calculateUsagePercentage(Z, contextWindow)
                   → "Hey user, you're at 82%!" 📊
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — WHY 3.75?
═══════════════════════════════════════════════════════════════

  English text average: ~4 chars per token!
  Code average: ~3.5 chars per token (symbols!)
  Mixed content: ~3.75 chars!

  "On average, every 3.75 characters is a token."
  "Not 100% accurate, but close enough."

  Real tokenizers (BPE, SentencePiece):
  → Split by frequency patterns!
  → "the" = 1 token, "pneumonoultramicro..." = many!
  → Model-specific vocabulary!
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — TOKEN MANAGEMENT:
═══════════════════════════════════════════════════════════════

  No limits: "Tokens? What are tokens?"
  │
  ↓ GPT-3: 4K tokens! ("Tiny window!")
  │
  ↓ GPT-4: 8K-32K tokens!
  │
  ↓ Claude: 100K tokens! ("Breakthrough!")
  │
  ↓ GPT-4.5: 400K tokens!
  │
  ↓ Gemini: 1M+ tokens! ("But accuracy...")
  │
  → "Million tokens? Cool, but accuracy so BAD.
     What's the POINT?" — Lost in the middle!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 28:
═══════════════════════════════════════════════════════════════

  TOKEN ESTIMATION:
  [ ] ~3.75 chars per token (estimate!)
  [ ] "Too slow and resource intensive" for exact!
  [ ] Free, sync, universal → good enough!

  MODEL LIMITS:
  [ ] Hardcoded from model cards!
  [ ] "I didn't come up with these numbers!"
  [ ] Default limits for unknown models!

  THRESHOLD:
  [ ] 80% default — conservative!
  [ ] isOverThreshold = totalTokens >= window * threshold!
  [ ] calculateUsagePercentage for UI display!

  RISKS:
  [ ] Recursive compaction = "sloppy!"
  [ ] "No perfect solution!"

  TIẾP THEO → Phần 29: Context Window Compaction!
```
