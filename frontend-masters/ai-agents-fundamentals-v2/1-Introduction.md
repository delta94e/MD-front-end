# AI Agents Fundamentals, v2 — Phần 1: Introduction — Chào Mừng Đến Với AI Agents!

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Introduction — "Agents Themselves Aren't That Hard To Make!"
> Độ khó: ⭐️⭐️ | Giới thiệu + Demo Browser Agent!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Welcome — "So Much Has Changed!"                   |
| 2   | The Demo — Browser-Controlling Agent!              |
| 3   | Anatomy of The Agent — "Just A Few Lines of Code!" |
| 4   | Tools — "Just Functions!"                          |
| 5   | Demo vs Production — "This Is Not Reliable!"       |
| 6   | Course Goal — "From Scratch, Without A Framework!" |
| 7   | Tự Implement: Agent Loop Concept                   |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu |

---

## §1. Welcome — "So Much Has Changed!"

> Scott: _"Welcome to AI Agents V2. Since the last time I taught it, so much has changed in the community, the technology, and even with my own opinions since I haven't stopped building."_

```
GIỚI THIỆU:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ 🎓 Instructor: Scott Moss                       │
  │ 📚 Course: AI Agents Fundamentals, v2            │
  │ 🏢 Platform: Frontend Masters                    │
  │                                                  │
  │ "Back again with the Frontend Masters team       │
  │  and super excited to be back to UPDATE          │
  │  this course because since the last time         │
  │  I taught it, so much has CHANGED."              │
  │                                                  │
  │ WHAT CHANGED:                                    │
  │ → Community — more adoption, more tools!        │
  │ → Technology — better models, better SDKs!      │
  │ → Scott's own opinions — hasn't stopped building!│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. The Demo — Browser-Controlling Agent!

> Scott: _"If you've never seen an AI agent, this demo might be super impressive. If you've seen AI agents, you might be wondering HOW it's done."_

```
THE DEMO — HACKER NEWS AGENT:
═══════════════════════════════════════════════════════════════

  COMMAND:
  $ npm run agent
  > "Go to Hacker News and summarize the top 3 posts, please."

  WHAT HAPPENED:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ① Agent opens a BROWSER! 🌐                     │
  │ ② Navigates to Hacker News!                     │
  │ ③ Inspects the DOM to see clickable elements!   │
  │ ④ Reads titles of top posts!                    │
  │ ⑤ Decides: "I don't need to click, titles are  │
  │    enough to summarize!"                         │
  │ ⑥ Outputs summary with scores, authors,         │
  │    comments for top 3 posts!                     │
  │                                                  │
  │ Scott: "We didn't have to do ANYTHING. I could   │
  │ have asked this thing to go to Nike and find     │
  │ some shoes for me and it WOULD HAVE done it."    │
  │                                                  │
  └──────────────────────────────────────────────────┘

  THE AGENT'S TOOLS:
  ┌──────────────────────────────────────────────────┐
  │ navigate   → go to a URL!                       │
  │ click      → click on elements!                 │
  │ type       → type text into inputs!             │
  │ getText    → read text from page!               │
  │ getPageInfo→ inspect the DOM!                   │
  │ scroll     → scroll the page!                   │
  │ waitForElement → wait for DOM to load!          │
  │                                                  │
  │ "It looked at all the tools that it has           │
  │  and DECIDED on what it should do."              │
  └──────────────────────────────────────────────────┘

  AGENT'S DECISION PROCESS:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Step 1: navigate("https://news.ycombinator.com")│
  │ Step 2: getPageInfo() → see all elements!       │
  │ Step 3: getText() → read titles!                │
  │ Step 4: waitForElement() → ensure loaded!       │
  │ Step 5: DECIDE → "Titles are enough,            │
  │         no need to click into articles!"        │
  │ Step 6: Return summary!                         │
  │                                                  │
  │ KEY INSIGHT: Agent DECIDED on its own            │
  │ that clicking wasn't necessary!                 │
  │ → This is AGENCY — making decisions!           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Anatomy of The Agent — "Just A Few Lines of Code!"

> Scott: _"The agent itself is just a FEW LINES OF CODE. Everything else is mostly just for setting up the browser and logging."_

```
AGENT ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ AGENT CODE (few lines!):                         │
  │ ┌────────────────────────────────────────────┐   │
  │ │ 1. Take user input (human language!)       │   │
  │ │ 2. Send to LLM with available tools!       │   │
  │ │ 3. LLM decides which tool to use!          │   │
  │ │ 4. Execute tool, get result!               │   │
  │ │ 5. Send result back to LLM!                │   │
  │ │ 6. LOOP until LLM says "done!"            │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  │ SETUP CODE (most of the file!):                  │
  │ ┌────────────────────────────────────────────┐   │
  │ │ → Browser setup (Playwright!)             │   │
  │ │ → Logging / inspection!                   │   │
  │ │ → Tool definitions!                       │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  │ TOOLS (just functions!):                         │
  │ ┌────────────────────────────────────────────┐   │
  │ │ → Functions that map to Playwright actions│   │
  │ │ → click, scroll, view page, etc.          │   │
  │ │ → "Tools are just FUNCTIONS."             │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  │ Scott: "I used an SDK that does the heavy        │
  │ lifting, and the agent itself is just a FEW      │
  │ LINES OF CODE."                                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Tools — "Just Functions!"

> Scott: _"Tools are just FUNCTIONS. In this case, they're functions that map to Playwright things like click, scroll, and view a page."_

```
TOOLS = FUNCTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ TOOL DEFINITION:                                 │
  │                                                  │
  │ A tool is:                                       │
  │ ① A NAME (what the LLM calls it!)              │
  │ ② A DESCRIPTION (how the LLM knows when to     │
  │    use it!)                                      │
  │ ③ PARAMETERS (what inputs it needs!)            │
  │ ④ A FUNCTION (what it actually does!)           │
  │                                                  │
  │ EXAMPLE:                                         │
  │ ┌────────────────────────────────────────────┐   │
  │ │ Name: "navigate"                           │   │
  │ │ Description: "Navigate to a URL"           │   │
  │ │ Parameters: { url: string }                │   │
  │ │ Function: async (url) => {                 │   │
  │ │   await page.goto(url);                    │   │
  │ │   return "Navigated to " + url;            │   │
  │ │ }                                          │   │
  │ └────────────────────────────────────────────┘   │
  │                                                  │
  │ LLM SEES:                                        │
  │ "I have these tools: navigate, click, type,      │
  │  getText, getPageInfo, scroll, waitForElement.   │
  │  Based on the user's request, I should decide    │
  │  which one to use."                              │
  │                                                  │
  │ → LLM doesn't RUN the tools!                   │
  │ → LLM DECIDES which to call + parameters!      │
  │ → YOUR CODE runs the actual function!           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Demo vs Production — "This Is Not Reliable!"

> Scott: _"This is just a demo. This is NOT something that you would actually build in production. It's not reliable, it has TOO MUCH AGENCY."_

```
DEMO vs PRODUCTION:
═══════════════════════════════════════════════════════════════

  DEMO:
  ┌──────────────────────────────────────────────────┐
  │ ✅ "Really cool to show off!"                    │
  │ ✅ "A great thing to use personally!"            │
  │ ✅ Shows the POWER of agents!                    │
  │ ✅ "How EASY it is to make them!"                │
  │                                                  │
  │ ❌ "Not RELIABLE!"                               │
  │ ❌ "Has TOO MUCH AGENCY!"                        │
  │ ❌ "Not something you would build in production!"│
  └──────────────────────────────────────────────────┘

  KEY CONCEPT — AGENCY:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Agency = How much FREEDOM the agent has          │
  │ to make DECISIONS on its own!                    │
  │                                                  │
  │ TOO MUCH AGENCY:                                 │
  │ → Agent can go anywhere on the internet!        │
  │ → Agent decides everything itself!              │
  │ → Unpredictable behavior!                       │
  │ → "You're going to learn about what             │
  │    agency means."                                │
  │                                                  │
  │ RIGHT AMOUNT:                                    │
  │ → Constrained to specific tasks!               │
  │ → Guardrails and boundaries!                   │
  │ → Predictable, reliable!                       │
  │ → "TRUSTWORTHY and USEFUL!"                    │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────┐
  │        AGENCY SPECTRUM:                          │
  │                                                  │
  │  ◄───────────────────────────────────────────►   │
  │  Less Agency              More Agency            │
  │                                                  │
  │  Simple chatbot   Constrained   Browser agent   │
  │  (no tools!)      agent with    (can go          │
  │                   defined       ANYWHERE!)       │
  │                   tools!                         │
  │                   ↑                              │
  │                   │                              │
  │              PRODUCTION                          │
  │              SWEET SPOT!                         │
  └──────────────────────────────────────────────────┘
```

---

## §6. Course Goal — "From Scratch, Without A Framework!"

> Scott: _"How do we do this FROM SCRATCH? How do we do this WITHOUT A FRAMEWORK? How do we make this RELIABLE?"_

```
COURSE OBJECTIVES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ① FROM SCRATCH!                                 │
  │   "How do we do this from scratch?"              │
  │   → Not relying on frameworks!                  │
  │   → Understanding every piece!                  │
  │                                                  │
  │ ② WITHOUT A FRAMEWORK!                          │
  │   "How do we do this without a framework?"       │
  │   → Build our own agent loop!                   │
  │   → Understand what SDKs hide from you!         │
  │                                                  │
  │ ③ MAKE IT RELIABLE!                             │
  │   "How do we make this reliable?"                │
  │   → Control agency!                             │
  │   → Add guardrails and boundaries!              │
  │   → Production-quality agents!                  │
  │                                                  │
  │ ④ THOUGHT FRAMEWORK!                            │
  │   "What is the thought framework we need to      │
  │    adopt to build something TRUSTWORTHY,         │
  │    USEFUL, and goes BEYOND expectations?"        │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHAT YOU'LL LEARN:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ → What IS an AI agent? (definition + concepts!) │
  │ → What is AGENCY and how to control it!         │
  │ → The AGENT LOOP (core mechanism!)              │
  │ → TOOLS (functions the LLM can call!)           │
  │ → How to make agents RELIABLE!                  │
  │ → Production vs demo patterns!                  │
  │ → Building WITHOUT frameworks first!            │
  │                                                  │
  │ Scott: "I wanted to show you the POWER of agents│
  │ and just quite frankly, how EASY it is to make  │
  │ them."                                           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Agent Loop Concept

```javascript
// CONCEPT: The Agent Loop — Core of Every Agent!

// An agent is fundamentally a LOOP:
// 1. User gives a task
// 2. LLM decides what to do
// 3. Execute the action (tool)
// 4. Feed result back to LLM
// 5. REPEAT until done

// Pseudo-code of what Scott's browser agent does:

async function runAgent(userTask) {
  // The messages array is the "memory" of the agent
  const messages = [
    { role: "system", content: "You are a browser agent..." },
    { role: "user", content: userTask },
  ];

  // Available tools (just functions!)
  const tools = {
    navigate: async (url) => {
      /* go to URL */
    },
    click: async (selector) => {
      /* click element */
    },
    type: async (selector, text) => {
      /* type text */
    },
    getText: async (selector) => {
      /* read text */
    },
    getPageInfo: async () => {
      /* inspect DOM */
    },
    scroll: async (direction) => {
      /* scroll page */
    },
    waitForElement: async (selector) => {
      /* wait */
    },
  };

  // THE LOOP — core of the agent!
  while (true) {
    // Ask LLM: "What should I do next?"
    const response = await callLLM(messages, tools);

    // If LLM says "I'm done!", break the loop
    if (response.type === "final_answer") {
      console.log("Agent result:", response.content);
      return response.content;
    }

    // If LLM wants to use a tool, execute it!
    if (response.type === "tool_call") {
      const toolName = response.tool;
      const toolArgs = response.arguments;

      // Execute the tool (just a function!)
      const result = await tools[toolName](...toolArgs);

      // Feed result back to LLM
      messages.push({
        role: "tool",
        content: JSON.stringify(result),
      });
    }
  }
}

// Usage:
// runAgent("Go to Hacker News and summarize the top 3 posts");
```

```javascript
// CONCEPT: Tool Definition — "Tools Are Just Functions!"

// What Scott meant by "tools are just functions":

const navigateTool = {
  // Name — LLM uses this to call the tool
  name: "navigate",

  // Description — LLM reads this to decide WHEN to use
  description: "Navigate the browser to a specific URL",

  // Parameters — what inputs the tool needs
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to navigate to",
      },
    },
    required: ["url"],
  },

  // The actual function — YOUR CODE!
  execute: async ({ url }) => {
    await page.goto(url);
    return `Navigated to ${url}`;
  },
};

// LLM sees: "I have a 'navigate' tool that goes to URLs"
// LLM decides: "User wants Hacker News → navigate to it!"
// LLM outputs: { tool: "navigate", args: { url: "https://..." } }
// YOUR CODE runs: navigateTool.execute({ url: "https://..." })
// Result sent back to LLM for next decision!
```

```javascript
// CONCEPT: Agency Levels — "Too Much vs Right Amount"

// TOO MUCH AGENCY (demo):
const demoAgent = {
  tools: ["navigate", "click", "type", "getText", "scroll"],
  constraints: "NONE!", // Can go anywhere!
  // → Unreliable! Unpredictable! Fun but not production!
};

// RIGHT AMOUNT (production):
const productionAgent = {
  tools: ["searchProducts", "getPrice", "addToCart"],
  constraints: [
    "Only search within our catalog!",
    "Price must be under user's budget!",
    "Require confirmation before checkout!",
  ],
  // → Reliable! Predictable! Trustworthy!
};

// Scott: "This is just a demo. Not something you would
// actually build in production. It's not reliable."
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — AI Agents

```
5 WHYS: TẠI SAO AI AGENTS?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần agents?
  └→ Vì LLMs alone chỉ trả lời text!
     Agents có thể HÀNH ĐỘNG — browse, click, search!
     "Give it any task in human language!"

  WHY ②: Tại sao agents cần tools?
  └→ Vì LLMs không thể trực tiếp click hay navigate!
     Tools = bridge giữa LLM decisions và real actions!
     "Tools are just FUNCTIONS!"

  WHY ③: Tại sao cần agent loop?
  └→ Vì tasks phức tạp cần NHIỀU bước!
     LLM quyết định từng bước → execute → check → next!
     "Continue to do this on a LOOP until satisfied!"

  WHY ④: Tại sao cần control agency?
  └→ Vì too much freedom = unreliable!
     Agent có thể làm điều không mong muốn!
     Production = constrained, predictable, trustworthy!

  WHY ⑤: Tại sao learn from scratch?
  └→ Vì frameworks ẩn đi cơ chế bên trong!
     Hiểu internals = debug + customize + optimize!
     Same philosophy as JS Hard Parts!
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — WHAT IS AN AGENT?
═══════════════════════════════════════════════════════════════

  An AI Agent = LLM + TOOLS + LOOP

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ LLM (Brain):                                    │
  │ → Understands natural language!                 │
  │ → DECIDES what to do next!                      │
  │ → Chooses which tool to call!                   │
  │                                                  │
  │ TOOLS (Hands):                                   │
  │ → Functions that interact with the world!       │
  │ → Browse, click, search, calculate!             │
  │ → "Just functions!"                             │
  │                                                  │
  │ LOOP (Persistence):                              │
  │ → Keep going until task is DONE!                │
  │ → Each iteration = observe → decide → act!     │
  │ → "Continue on a loop until satisfied!"         │
  │                                                  │
  └──────────────────────────────────────────────────┘

  Without LLM: no understanding, no decisions!
  Without TOOLS: no actions, just text!
  Without LOOP: one-shot, can't handle multi-step!

  AGENT = All three combined!
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — DEMO vs PRODUCTION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Demo Agent    │ Production Agent  │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Agency           │ ✅ Maximum    │ ⚠️ Constrained    │
  │ Reliability      │ ❌ Low        │ ✅ High!          │
  │ Impressiveness   │ ✅ "Wow!"     │ ⚠️ "Boring"       │
  │ Safety           │ ❌ Risky      │ ✅ Guardrails!    │
  │ Predictability   │ ❌ Random     │ ✅ Deterministic  │
  │ Usefulness       │ ⚠️ Personal   │ ✅ Business-ready │
  │ Complexity       │ ✅ Simple code│ ⚠️ More work!     │
  └──────────────────┴───────────────┴───────────────────┘

  Scott: "Agents aren't hard to MAKE. The problem
  is making them RELIABLE."
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP — AGENT ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  USER INPUT
  "Summarize top 3 Hacker News posts"
       │
       ▼
  ┌──────────────────┐
  │    AGENT LOOP    │ ◄────────────────┐
  │                  │                  │
  │  ┌────────────┐  │                  │
  │  │    LLM     │  │     Tool Result  │
  │  │  "Brain"   │──┼──────────────────┘
  │  │  Decides!  │  │
  │  └─────┬──────┘  │
  │        │         │
  │   Tool Call?     │
  │   ┌────┴────┐    │
  │   │ YES │ NO │    │
  │   └──┬──┴──┬─┘    │
  │      │     │      │
  │      ▼     ▼      │
  │   Execute  Done!  │
  │   Tool     Return │
  │   (func!)  Answer │
  │      │            │
  │      └────────────┘
  │                   │
  └───────────────────┘

  Scott: "It's going to continue to do this
  on a loop until it's SATISFIED and has all
  the information it needs."
```

### 8.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — SCOTT'S DEMO:
═══════════════════════════════════════════════════════════════

  WHAT WE SAW:
  $ npm run agent
  > "Go to Hacker News and summarize top 3 posts"

  WHAT ACTUALLY HAPPENED:
  ┌──────────────────────────────────────────────────┐
  │ Iteration 1:                                     │
  │   LLM thinks: "I need to go to Hacker News"     │
  │   → calls: navigate("https://news.ycombinator") │
  │                                                  │
  │ Iteration 2:                                     │
  │   LLM thinks: "Page loaded, let me see content" │
  │   → calls: getPageInfo()                        │
  │                                                  │
  │ Iteration 3:                                     │
  │   LLM thinks: "I see links, let me read titles" │
  │   → calls: getText(".title")                    │
  │                                                  │
  │ Iteration 4:                                     │
  │   LLM thinks: "I have enough info to summarize!"│
  │   → returns: final_answer with summary!         │
  │                                                  │
  │ KEY: LLM DECIDED it didn't need to click!       │
  │ "It was enough to just look at the links."       │
  └──────────────────────────────────────────────────┘

  COMPONENTS USED:
  → SDK (AI library for LLM calls!)
  → Playwright (browser automation!)
  → Tool definitions (navigate, click, etc.)
  → Agent loop (while loop + LLM decisions!)
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ: AI AGENTS:
═══════════════════════════════════════════════════════════════

  2020: GPT-3 — Large Language Models emerge!
  │     → Text generation only!
  │     → No tools, no agency!
  │
  ↓
  2022: ChatGPT — Conversational AI explodes!
  │     → Still no tools!
  │     → "Just a chatbot"
  │
  ↓
  2023: Function Calling / Tool Use!
  │     → LLMs can call FUNCTIONS!
  │     → Birth of modern AI agents!
  │     → LangChain, AutoGPT emerge!
  │     → Scott's AI Agents v1 course!
  │
  ↓
  2024: Agent frameworks mature!
  │     → Vercel AI SDK, CrewAI, AutoGen!
  │     → Browser agents (Playwright + LLM!)
  │     → "So much has CHANGED!"
  │
  ↓
  2025-2026: AI Agents v2!
  │     → More reliable patterns!
  │     → Better understanding of agency!
  │     → Production-ready approaches!
  │     → Scott: "My own opinions changed
  │       since I haven't stopped building!"
  │
  ↓
  PRESENT: Scott teaches from scratch!
           → "How do we do this WITHOUT a framework?"
           → "How do we make this RELIABLE?"

  Scott: "Since the last time I taught it,
  so much has changed in the community,
  the technology, and even my own opinions."
```

```
TÓM TẮT 6 PATTERNS:
═══════════════════════════════════════════════════════════════

  ① 5 WHYS         → Agents = LLM + tools + loop!
                      Need control, need reliability!

  ② FIRST PRINCIPLES→ LLM (brain) + Tools (hands) + Loop!
                      Remove any one = not an agent!

  ③ TRADE-OFFS     → Demo = impressive but unreliable!
                      Production = constrained but trustworthy!

  ④ MENTAL MAPPING → User → Loop → LLM decides → Tool
                      executes → Result → Loop again!

  ⑤ REVERSE ENG.   → Demo = 4 iterations! Navigate, inspect,
                      read, summarize! LLM decides each step!

  ⑥ HISTORY        → 2020 GPT-3 → 2023 Function calling
                      → 2025 AI Agents v2 (reliable!)
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 1:
═══════════════════════════════════════════════════════════════

  AI AGENT BASICS:
  [ ] Agent = LLM + Tools + Loop!
  [ ] Tools are JUST FUNCTIONS!
  [ ] LLM DECIDES which tool to use!
  [ ] Loop continues until task is DONE!

  DEMO vs PRODUCTION:
  [ ] Demo = cool but NOT reliable!
  [ ] Too much agency = unpredictable!
  [ ] Production = constrained, trustworthy!
  [ ] "You're going to learn what agency means!"

  COURSE GOALS:
  [ ] Build from SCRATCH!
  [ ] WITHOUT a framework!
  [ ] Make it RELIABLE!
  [ ] Adopt the right THOUGHT FRAMEWORK!

  TIẾP THEO → Phần 2: What Is An AI Agent? (Deep Dive!)
```
