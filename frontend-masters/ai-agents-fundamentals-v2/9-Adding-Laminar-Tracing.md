# AI Agents Fundamentals, v2 — Phần 9: Adding Laminar Tracing — "Fully Traced, Everything Visible!"

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Adding Laminar Tracing — "3 Lines Of Code And You Have Full Observability!"
> Độ khó: ⭐️⭐️ | Setup thực tế — Instrument agent với tracing!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | Setup — "Import, Initialize, Done!"                      |
| 2   | Instrument generateText — experimentalTelemetry!         |
| 3   | The Dashboard — "Fully Traced, Every Span!"              |
| 4   | Flushing Events — "Race Condition With Your Process!"    |
| 5   | CLI Build — "npm run build, agi, Just Works!"            |
| 6   | Online vs Offline Evals — "Online = Scale, Python Only!" |
| 7   | Tự Implement: Tracing Concept From Scratch               |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu       |

---

## §1. Setup — "Import, Initialize, Done!"

> Scott: _"All we need to do is say Laminar initialize. That's a function, takes a project API key. And that's it."_

```javascript
// file: src/agent/run.ts

// Step 1: Import from Laminar!
import { Laminar, getTracer } from "@lmnr-ai/lmnr";

// Step 2: Initialize with API key!
Laminar.initialize({
  projectApiKey: process.env.LMNR_PROJECT_API_KEY,
});

// That's it! 2 lines to set up tracing!
```

```
SETUP RECAP:
═══════════════════════════════════════════════════════════════

  .env FILE:
  ┌──────────────────────────────────────────────────┐
  │ OPENAI_API_KEY=sk-...                            │
  │ LMNR_PROJECT_API_KEY=lmnr-...  ← From dashboard│
  └──────────────────────────────────────────────────┘

  IMPORTS:
  ┌──────────────────────────────────────────────────┐
  │ import { Laminar, getTracer } from "@lmnr-ai/lmnr"│
  │                                                  │
  │ Laminar    → initialize connection!             │
  │ getTracer  → create tracer for SDK!             │
  └──────────────────────────────────────────────────┘

  INITIALIZE:
  ┌──────────────────────────────────────────────────┐
  │ Laminar.initialize({                             │
  │   projectApiKey: process.env.LMNR_PROJECT_API_KEY│
  │ });                                              │
  │                                                  │
  │ → Put this at the TOP of your entry file!      │
  │ → Before any LLM calls!                        │
  └──────────────────────────────────────────────────┘
```

---

## §2. Instrument generateText — experimentalTelemetry!

> Scott: _"Set experimental telemetry isEnabled to true, tracer is getTracer. That's it. We've enabled telemetry."_

```javascript
// Add telemetry to generateText call:

const { text, toolCalls } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: userMessage,
  system: systemPrompt,
  tools,

  // NEW! Enable tracing:
  experimental_telemetry: {
    isEnabled: true,
    tracer: getTracer(),
  },
});

// "Everything our agent does will now be TRACED,
//  and we can go visualize it on the dashboard."
```

```
WHAT GETS TRACED:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ experimental_telemetry: {                        │
  │   isEnabled: true,    ← Turn it on!            │
  │   tracer: getTracer() ← Otel tracer!           │
  │ }                                                │
  │                                                  │
  │ WHAT IT CAPTURES:                                │
  │ → Every generateText call!                     │
  │ → System prompt content!                       │
  │ → User message!                                │
  │ → Model response!                              │
  │ → Tool calls (if any!)                         │
  │ → Token usage!                                 │
  │ → Timing/duration!                             │
  │ → Internal SDK operations!                     │
  │                                                  │
  │ "Right now it's very basic, we only call one    │
  │  thing. But as this gets more complicated with  │
  │  multiple turns and more tool calls, this thing │
  │  is going to get REALLY CRAZY."                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. The Dashboard — "Fully Traced, Every Span!"

> Scott: _"And it's fully traced. Here was the span that got traced. Here's the text it generated, the output, different attributes the SDK added."_

```
LAMINAR DASHBOARD — WHAT YOU SEE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ TRACES TAB                                       │
  │                                                  │
  │ ┌────────────────────────────────────────────┐   │
  │ │ Trace: generate-text-abc123                │   │
  │ │ Time: 2026-03-07 15:30:02                  │   │
  │ │                                            │   │
  │ │ ├── generateText (root span)              │   │
  │ │ │   Duration: 1.8s                         │   │
  │ │ │   Output: "The current time is..."       │   │
  │ │ │                                          │   │
  │ │ │   ├── AI.generateText.doGenerate        │   │
  │ │ │   │   System prompt: "You are helpful..."│   │
  │ │ │   │   User message: "What time is it?"  │   │
  │ │ │   │   Model: gpt-4o-mini                │   │
  │ │ │   │   Tokens: 150 in, 50 out            │   │
  │ │ │   │   Duration: 1.2s                     │   │
  │ │ │   │                                      │   │
  │ │ │   └── (attributes, events...)           │   │
  │ │ │                                          │   │
  │ │ └── End                                    │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  │ EACH SPAN SHOWS:                                 │
  │ → Input / Output                                │
  │ → Attributes (model, tokens, etc.)              │
  │ → Events (internal SDK operations)              │
  │ → Duration                                      │
  │ → Child spans (nested operations!)              │
  │                                                  │
  └──────────────────────────────────────────────────┘

  Scott: "This is really great for when you get into
  the WEEDS of trying to track down what's going on
  in my system."
```

---

## §4. Flushing Events — "Race Condition With Your Process!"

> Scott: _"Most analytics tools batch the calls to the server. Your process might have ENDED before Laminar sent those events off."_

```
THE FLUSH PROBLEM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT HAPPENS INTERNALLY:                         │
  │                                                  │
  │ Your code runs → generates events!             │
  │              ↓                                   │
  │ Laminar BATCHES events in an array!             │
  │ (doesn't send each one immediately!)            │
  │              ↓                                   │
  │ On some interval → flushes the array!           │
  │ (sends all events to server at once!)           │
  │                                                  │
  │ ⚠️ RACE CONDITION:                              │
  │ Your Node.js process might EXIT before           │
  │ Laminar gets a chance to flush!                  │
  │              ↓                                   │
  │ Events are LOST! Dashboard shows nothing! 😱    │
  │                                                  │
  │ SOLUTION: Call flush manually!                   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

```javascript
// Force flush before process exits:

const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: userMessage,
  system: systemPrompt,
  tools,
  experimental_telemetry: {
    isEnabled: true,
    tracer: getTracer(),
  },
});

console.log(text);

// IMPORTANT: Flush telemetry events!
await Laminar.flush();
// "Hey Laminar, I'm DONE, so can you send off
//  your events to your server please?"

// "Very typical for analytics tools to do this."
// "If you didn't see your stuff show up,
//  it's a possibility that that's the case."
```

```
WHY BATCHING EXISTS:
═══════════════════════════════════════════════════════════════

  WITHOUT BATCHING:
  Event 1 → HTTP POST → Server    (slow!)
  Event 2 → HTTP POST → Server    (slow!)
  Event 3 → HTTP POST → Server    (slow!)
  = 3 network calls! Expensive!

  WITH BATCHING:
  Event 1 → [array]
  Event 2 → [array]
  Event 3 → [array]
  flush()  → HTTP POST (all 3!) → Server
  = 1 network call! Efficient!

  "Most analytics tools batch the calls versus
   calling them every time you tell them to."
```

---

## §5. CLI Build — "npm run build, agi, Just Works!"

> Scott: _"Going forward, use this. You don't need to do the tsx stuff anymore. Just do agi."_

```
NEW WORKFLOW — CLI MODE:
═══════════════════════════════════════════════════════════════

  BEFORE:
  $ npx tsx src/agent/run.ts
  → Manual, needs .env handling!

  NOW:
  $ npm run build          ← Compile TypeScript!
  $ npm install -g .       ← Install as global CLI!
  $ agi                    ← Just works! ✨

  ┌──────────────────────────────────────────────────┐
  │ "This cleans it up. You don't have to do the    │
  │  .env stuff. It just WORKS."                    │
  │                                                  │
  │ "Going forward, use this. You have a             │
  │  conversation with this thing. Because the       │
  │  next lesson will actually make it               │
  │  CONVERSATIONAL."                                │
  └──────────────────────────────────────────────────┘
```

---

## §6. Online vs Offline Evals — "Online = Scale, Python Only!"

> Scott: _"We will literally NOT be running evals in this dashboard. We'll use this dashboard to VIEW the evaluations."_

```
LAMINAR EVAL FEATURES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ WHAT LAMINAR DASHBOARD SHOWS:                    │
  │ → Traces (every LLM call, visualized!)         │
  │ → Eval results (scores, averages!)             │
  │ → Span details (input/output per step!)        │
  │                                                  │
  │ ONLINE EVALS (in dashboard):                     │
  │ "You give them CODE for the evaluation           │
  │  you want to run, so THEY can run it for you."  │
  │                                                  │
  │ ⚠️ LIMITATIONS:                                 │
  │ → "They only support PYTHON online!"           │
  │ → "You don't really need that until you have   │
  │    massive SCALE."                               │
  │ → "Better to collect data and run offline       │
  │    evals later."                                 │
  │                                                  │
  │ OUR APPROACH:                                    │
  │ → Run evals OFFLINE (our code!)                │
  │ → Use dashboard to VIEW results!               │
  │ → Evals + traces in same place!                │
  │                                                  │
  │ Scott: "Online evals are for people with SCALE.  │
  │ Like you just have MASSIVE scale."              │
  │                                                  │
  └──────────────────────────────────────────────────┘

  TRACING + EVALS = POWERFUL COMBO:
  ┌──────────────────────────────────────────────────┐
  │ "It goes HAND IN HAND for evals because you     │
  │  can enable tracing with the evals."            │
  │                                                  │
  │ "We can go look at an eval and then also        │
  │  follow the TRACES for that eval to see where   │
  │  we might want to IMPROVE things."              │
  │                                                  │
  │ 1. Eval shows: tool selection score = 0.6 ⚠️   │
  │ 2. Click trace → see exactly what happened!    │
  │ 3. "Ah, description was too vague!"            │
  │ 4. Update description → re-eval!              │
  │ 5. Score = 0.9! 📈                             │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Tracing Concept From Scratch

```javascript
// TRACING — Build the concept from scratch!

// A trace = tree of spans!
class SimpleTracer {
  constructor(projectKey) {
    this.projectKey = projectKey;
    this.events = []; // Batch array!
  }

  // Create a span (unit of work!)
  startSpan(name) {
    const span = {
      id: crypto.randomUUID(),
      name,
      startTime: Date.now(),
      endTime: null,
      attributes: {},
      children: [],
      input: null,
      output: null,
    };

    return {
      // Set attributes on the span
      setAttribute: (key, value) => {
        span.attributes[key] = value;
      },

      // Record what went in
      setInput: (input) => {
        span.input = input;
      },

      // Record what came out
      setOutput: (output) => {
        span.output = output;
      },

      // End the span
      end: () => {
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        this.events.push(span);
      },
    };
  }

  // Flush — send all batched events!
  async flush() {
    if (this.events.length === 0) return;

    // "Most analytics tools batch the calls
    //  and then on some interval, flush that array
    //  and send them all at one time."
    await fetch("https://api.laminar.run/traces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.projectKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ spans: this.events }),
    });

    this.events = []; // Clear the batch!
    console.log("Telemetry flushed!");
  }
}
```

```javascript
// USING OUR TRACER — Instrument an LLM call:

const tracer = new SimpleTracer(process.env.LMNR_PROJECT_API_KEY);

async function tracedGenerateText(prompt) {
  // Start a span for the whole operation
  const span = tracer.startSpan("generateText");
  span.setInput(prompt);
  span.setAttribute("model", "gpt-4o-mini");

  try {
    const { text, toolCalls } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      system: systemPrompt,
      tools,
    });

    span.setOutput(text || JSON.stringify(toolCalls));
    span.setAttribute("hasToolCalls", !!toolCalls?.length);
    span.end(); // End the span!

    return { text, toolCalls };
  } catch (error) {
    span.setAttribute("error", error.message);
    span.end();
    throw error;
  }
}

// Don't forget to flush!
await tracedGenerateText("What time is it?");
await tracer.flush();
// "If you didn't see your stuff show up,
//  call flush! Your process might have ended
//  before events were sent."
```

```javascript
// WHAT LAMINAR SDK DOES FOR YOU:

// Instead of our manual tracer, Laminar:
// 1. Auto-instruments generateText calls!
// 2. Captures system prompt, messages, tokens!
// 3. Creates parent-child span relationships!
// 4. Batches + flushes automatically!
// 5. Sends to dashboard for visualization!

// Our manual version = 50 lines of code
// Laminar = 3 lines:

import { Laminar, getTracer } from "@lmnr-ai/lmnr";
Laminar.initialize({
  projectApiKey: process.env.LMNR_PROJECT_API_KEY,
});
// + add experimental_telemetry to generateText!
// That's it!
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — Tracing

```
5 WHYS: TẠI SAO CẦN TRACING?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao console.log không đủ?
  └→ Vì không structured! No relationships!
     Can't see parent-child spans!
     "We've been logging, but now we add TRACING."

  WHY ②: Tại sao cần dashboard?
  └→ Vì complex agents = many turns, many tools!
     "As this gets more complicated, this thing
     is going to get REALLY CRAZY."

  WHY ③: Tại sao Otel (Open Telemetry)?
  └→ Vì "open standard, doesn't belong to anybody!"
     Works with any visualization tool!
     Not locked to one vendor!

  WHY ④: Tại sao cần flush?
  └→ Vì batching = race condition!
     "Process might end before events are sent!"
     "Very typical for analytics tools!"

  WHY ⑤: Tại sao tracing + evals together?
  └→ Vì "goes HAND IN HAND!"
     See eval score → trace the span → find why!
     "See where we might want to IMPROVE things."
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — OBSERVABILITY:
═══════════════════════════════════════════════════════════════

  OBSERVABILITY = Tracing + Metrics + Logs

  ┌──────────────────────────────────────────────────┐
  │ TRACING (what we set up!):                       │
  │ → Spans = units of work!                       │
  │ → Parent-child tree!                            │
  │ → Input/output at each step!                   │
  │ → Duration, tokens, model info!                │
  │                                                  │
  │ METRICS (from evals!):                           │
  │ → Scores over time!                             │
  │ → Averages, trends, regressions!               │
  │                                                  │
  │ LOGS (what we had before!):                      │
  │ → console.log statements!                      │
  │ → Text in terminal!                             │
  │ → Still useful, but limited!                   │
  │                                                  │
  │ ALL THREE together = full picture!              │
  └──────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — TRACING OPTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ No Tracing    │ With Tracing      │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Visibility       │ ❌ "Blind!"   │ ✅ "Full picture!"│
  │ Setup cost       │ ✅ Zero!      │ ✅ "3 lines!"     │
  │ Performance      │ ✅ No overhead│ ⚠️ Slight overhead│
  │ Debugging        │ ❌ Guess!     │ ✅ See exactly!   │
  │ Production ready │ ❌ No!        │ ✅ Yes!           │
  │ Cost             │ ✅ Free!      │ ✅ "Also free!"   │
  └──────────────────┴───────────────┴───────────────────┘

  Scott: "It's like adding analytics. Having analytics
  or not is not going to BREAK your app. But having
  it does HELP."
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — FULL STACK WITH TRACING:
═══════════════════════════════════════════════════════════════

  YOUR CODE                        LAMINAR
  ┌──────────────┐                ┌──────────────┐
  │ run.ts       │                │ Dashboard    │
  │              │                │              │
  │ Laminar.init │───── API ─────→│ Traces tab  │
  │ getTracer()  │     key        │ ├── Span 1   │
  │              │                │ │  input/out │
  │ generateText │  telemetry     │ ├── Span 2   │
  │  + telemetry │──── events ───→│ │  tokens    │
  │              │   (batched!)   │ └── Span 3   │
  │              │                │    duration  │
  │ Laminar.flush│── force send ─→│              │
  │              │                │ Evals tab   │
  └──────────────┘                │ ├── Scores  │
                                  │ └── Trends  │
                                  └──────────────┘
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — THE TRACE TREE:
═══════════════════════════════════════════════════════════════

  What Scott saw in the dashboard:

  generateText (root span)
  │ Duration: 1.8s
  │ Output: "Done"
  │
  ├── AI.generateText.doGenerate
  │   │ This is INTERNAL to the AI SDK!
  │   │ System prompt: "You are helpful..."
  │   │ Input: user message
  │   │ Output: LLM response
  │   │
  │   ├── Attributes (SDK metadata!)
  │   └── Events (internal operations!)
  │
  └── End

  "This is the text it generated, this is the output.
   Here are different ATTRIBUTES the SDK added,
   different EVENTS that might have been there."

  As agent gets complex, tree grows:
  generateText
  ├── doGenerate → tool_call: dateTime
  ├── tool.dateTime.execute → "2026-03-07..."
  ├── doGenerate → tool_call: webSearch
  ├── tool.webSearch.execute → results
  ├── doGenerate → final answer
  └── "The current time is... NBA scores are..."
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — TRACING TOOLS:
═══════════════════════════════════════════════════════════════

  BEFORE: "We've been LOGGING everything"
  │ → console.log() everywhere!
  │ → Text in terminal, hard to search!
  │
  ↓
  2015+: Open Telemetry standard
  │ → Structured spans! Parent-child!
  │ → "Open standard, doesn't belong to anybody!"
  │
  ↓
  2023: LLM-specific tools emerge
  │ → BrainTrust (de facto standard!)
  │ → "Confusing as HELL. Could teach a
  │    whole COURSE on it."
  │ → LangSmith, Weights & Biases, etc.
  │
  ↓
  2024: Laminar (YC Company)
  │ → "Does everything BrainTrust does!"
  │ → "Better INTERFACE!"
  │ → Free! No credit card!
  │ → "Not sponsoring me!" 😄
  │
  ↓
  NOW: Tracing = table stakes!
  │ → 3 lines to set up!
  │ → "Without this = flying blind!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 9:
═══════════════════════════════════════════════════════════════

  SETUP:
  [ ] import { Laminar, getTracer } from "@lmnr-ai/lmnr"!
  [ ] Laminar.initialize({ projectApiKey })!
  [ ] experimental_telemetry in generateText!
  [ ] Remember to flush! await Laminar.flush()!

  DASHBOARD:
  [ ] Traces tab → see every LLM call!
  [ ] Spans → parent-child tree!
  [ ] Attributes → model, tokens, metadata!
  [ ] Events → internal SDK operations!

  KEY CONCEPTS:
  [ ] Batching → events queued, sent together!
  [ ] Flush → force send before process exits!
  [ ] "Race condition" if not flushed!
  [ ] Tracing + evals = "hand in HAND!"

  CLI:
  [ ] npm run build → compile!
  [ ] npm install -g . → install globally!
  [ ] agi → "just works, use this going forward!"

  TIẾP THEO → Phần 10: Building The Agent Loop!
```
