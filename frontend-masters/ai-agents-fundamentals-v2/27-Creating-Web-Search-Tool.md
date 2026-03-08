# AI Agents Fundamentals, v2 — Phần 27: Creating a Web Search Tool — "The Easiest Tool You've EVER Written!"

> 📅 2026-03-07 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Creating a Web Search Tool — "One Line! OpenAI Native Tool! Agent Is No Longer Bound By Training Cutoff!"
> Độ khó: ⭐️⭐️ | Beginner — Native tool registration, grounding live demo!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | The Easiest Tool Ever — "One Line. That's It."       |
| 2   | OpenAI's Available Native Tools                      |
| 3   | Tool Registration — "Fits Our Standard Composition!" |
| 4   | Live Demo — "No Longer Bound By Training Cutoff!"    |
| 5   | Compaction Strategy Preview — "80% Threshold!"       |
| 6   | Tự Implement: Web Search Integration                 |
| 7   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu   |

---

## §1. The Easiest Tool Ever — "One Line. That's It."

> Scott: _"This is going to be the EASIEST tool you've ever written in your life."_

```javascript
// tools/webSearch.ts — ONE LINE!

export const webSearch = openai.tools.webSearch();

// "We're not gonna make it at all because it's
//  ALREADY MADE. We're just making sure it fits
//  within our standard of tool composition."
```

```
WHY SO SIMPLE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ It's a NATIVE TOOL!                              │
  │ → Runs on OpenAI's servers!                    │
  │ → No execute function to write!                │
  │ → No parameters to define!                     │
  │ → No error handling needed!                    │
  │ → "Just call it. That's it."                   │
  │                                                  │
  │ But we still wrap it in our tool system:         │
  │ → "So we don't have to change any other code." │
  │ → Same import pattern!                         │
  │ → Same registration!                           │
  └──────────────────────────────────────────────────┘
```

---

## §2. OpenAI's Available Native Tools

> Scott: _"If you do this, you can see ALL the tools that we get from OpenAI on their service."_

```javascript
// openai.tools — All available native tools!

openai.tools.webSearch(); // ← We're using this!
openai.tools.codeInterpreter(); // Execute Python/JS!
openai.tools.fileSearch(); // Search uploaded files!
openai.tools.imageGeneration(); // Dolly ("not good" 😅)
openai.tools.localShell(); // Give shell commands!
openai.tools.webSearchPreview(); // Experimental version!
```

```
NATIVE TOOLS BREAKDOWN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────────────────────┐
  │ Tool             │ What it does                    │
  ├──────────────────┼─────────────────────────────────┤
  │ webSearch        │ Search the internet! ✅ Using! │
  │ codeInterpreter  │ Execute code on their servers!  │
  │ fileSearch       │ Search files stored at OpenAI!  │
  │ imageGeneration  │ Generate images ("not good" 😅)│
  │ localShell       │ Gives commands (YOU run them!)  │
  │ webSearchPreview │ Experimental web search!        │
  └──────────────────┴─────────────────────────────────┘

  localShell — "Kind of cool!":
  ┌──────────────────────────────────────────────────┐
  │ "They DON'T run the commands. They GIVE you     │
  │  the commands that you can then run."            │
  │ → "We'll be doing a shell tool but not this way."│
  └──────────────────────────────────────────────────┘
```

---

## §3. Tool Registration — "Fits Our Standard Composition!"

> Scott: _"We just want to make sure it fits within our standard of how we do our tool composition, so we don't have to change any other code."_

```javascript
// tools/webSearch.ts
export const webSearch = openai.tools.webSearch();

// tools/index.ts
import { webSearch } from "./webSearch";

// Add to tools object!
export const tools = {
  ...fileTools,
  webSearch, // ← Just add it! Same pattern!
};

// Also export individually!
export { webSearch };
```

```
REGISTRATION PATTERN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ 1. Create tool file (webSearch.ts!)             │
  │ 2. Export the tool!                              │
  │ 3. Import in tools/index.ts!                    │
  │ 4. Add to tools object!                         │
  │ 5. Build, install, test!                        │
  │                                                  │
  │ "So we don't have to change any other code."    │
  │ → run.ts still imports tools!                  │
  │ → Agent loop unchanged!                        │
  │ → Just NEW capabilities!                       │
  └──────────────────────────────────────────────────┘
```

---

## §4. Live Demo — "No Longer Bound By Training Cutoff!"

> Scott: _"Your agent is no longer bound by its training date cutoff. You can ground it. Pretty powerful."_

```
LIVE DEMO SESSION:
═══════════════════════════════════════════════════════════════

  USER: "You have the ability to search the web."
  ┌──────────────────────────────────────────────────┐
  │ AGENT: "Yes, I can search the web using a        │
  │ browsing tool."                                  │
  │ → Knows about its own capabilities!             │
  └──────────────────────────────────────────────────┘

  USER: "Who won the F1 Vegas Grand Prix in 2025?
         Please only use ONE web search, no more."
  ┌──────────────────────────────────────────────────┐
  │ 🟡 [web search executing...]                    │
  │                                                  │
  │ AGENT: "Max Verstappen won!"                    │
  │ → CORRECT! ✅                                  │
  │ → With SOURCES and links!                      │
  │ → "Click this → took me to the source."       │
  │                                                  │
  │ "Your agent is NO LONGER BOUND by its training  │
  │  date cutoff. You can make it LIVE.             │
  │  You can GROUND it. Pretty powerful."           │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHY "only ONE search":
  ┌──────────────────────────────────────────────────┐
  │ "I don't want this thing to BREAK."             │
  │ "There might be a bug where after 4-5 tool     │
  │  calls, it gets a streaming error."             │
  │ "Hopefully it listens to me."                   │
  │ → It DID! Only one search! ✅                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Compaction Strategy Preview — "80% Threshold!"

> Scott: _"We use a simple compaction strategy. Estimate token usage before each turn. If over 80% of context window, trigger compaction."_

```
COMPACTION OVERVIEW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ 1. Estimate token usage BEFORE each turn!       │
  │ 2. If over 80% threshold → trigger!           │
  │ 3. Summarize conversation history!              │
  │ 4. Replace history with summary!                │
  │ 5. Continue conversation!                       │
  │                                                  │
  │ "Not the most sophisticated approach, but it's  │
  │  reliable and easy to understand."              │
  │                                                  │
  │ WHY NOW:                                         │
  │ "Web search introduces TONS of tokens.          │
  │  I'm assuming OpenAI doesn't compact already.  │
  │  Even without web search, someone's going to   │
  │  have a long chatty conversation. We need it."  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. Tự Implement: Web Search Integration

```javascript
// ═══════════════════════════════════
// COMPLETE Web Search Setup
// ═══════════════════════════════════

// tools/webSearch.ts
import { openai } from "@ai-sdk/openai";

// Simplest tool ever!
export const webSearch = openai.tools.webSearch();

// tools/index.ts
import { readFile, writeFile, listFiles, deleteFile } from "./file";
import { webSearch } from "./webSearch";

// Individual + grouped exports!
export { readFile, writeFile, listFiles, deleteFile, webSearch };

export const fileTools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};

export const tools = {
  ...fileTools,
  webSearch,
};

// ═══════════════════════════════════
// If you wanted TOOL-BASED web search instead:
// (Using Exa as example)
// ═══════════════════════════════════

import { tool } from "ai";
import { z } from "zod";

// This would be a FUNCTION CALLING tool
// running on YOUR machine!
const toolBasedWebSearch = tool({
  description:
    "Search the web for information. " +
    "Use this to find up-to-date information.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    // Using Exa API (or any provider!)
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXA_API_KEY}`,
      },
      body: JSON.stringify({ query, numResults: 5 }),
    });
    const data = await response.json();

    // Format for LLM! Language, not JSON!
    return data.results
      .map((r) => `${r.title}: ${r.url}\n${r.snippet}`)
      .join("\n\n");
  },
});
```

---

## §7. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 7.1 Pattern ①: 5 Whys

```
5 WHYS: TẠI SAO NATIVE TOOL DỄ NHẤT?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao chỉ một dòng code?
  └→ "It's ALREADY MADE. Runs on OpenAI's servers.
     No execute function to write."

  WHY ②: Tại sao vẫn wrap trong toolset?
  └→ "Fits our standard composition so we don't
     have to change any other code."

  WHY ③: Tại sao cần compaction sau web search?
  └→ "Web search introduces TONS of tokens.
     Even without it, someone will be chatty."

  WHY ④: Tại sao nói "only one search"?
  └→ "There's a streaming bug after 4-5 tool calls.
     Also OpenAI is GREEDY with search calls."

  WHY ⑤: Tại sao agent NEEDS grounding?
  └→ "Training cutoff = June 2024. Without web
     search, agent doesn't know ANYTHING recent."
```

### 7.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — TOOL TYPES:
═══════════════════════════════════════════════════════════════

  Tool = Input → Process → Output!

  Function calling: Process runs on YOUR machine!
  Native tool: Process runs on THEIR server!

  Same concept, different location.
  "The compute is on their side."
```

### 7.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Native tool   │ Self-built tool    │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Code             │ ✅ One line!  │ ⚠️ Lots of code!  │
  │ Control          │ ❌ None!      │ ✅ Full!          │
  │ Cost visibility  │ ❌ Hidden!    │ ✅ You see it!    │
  │ Model lock-in    │ ❌ Yes!       │ ✅ Any model!     │
  │ Quality          │ ✅ OpenAI's!  │ ⚠️ You build it!  │
  │ Maintenance      │ ✅ They do it!│ ❌ Your problem!  │
  └──────────────────┴───────────────┴───────────────────┘
```

### 7.4 Pattern ④: Mental Mapping

```
MENTAL MAP — WEB SEARCH TOOL FLOW:
═══════════════════════════════════════════════════════════════

  openai.tools.webSearch()
       │
       ▼
  tools/webSearch.ts → export!
       │
       ▼
  tools/index.ts → register!
       │
       ▼
  Agent loop → detects web search needed!
       │
       ▼
  OpenAI API → runs search on THEIR servers!
       │
       ▼
  Results returned → put in context!
       │
       ▼
  Agent responds with grounded, up-to-date info!
  + Source links! ✅
```

### 7.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — HOW NATIVE TOOLS WORK:
═══════════════════════════════════════════════════════════════

  When you call openai.tools.webSearch():
  ┌──────────────────────────────────────────────────┐
  │ 1. Creates tool definition (hidden!)            │
  │ 2. Tool description (hidden, probably GREEDY!)  │
  │ 3. Sent to OpenAI API with your request!        │
  │ 4. LLM decides to use it!                       │
  │ 5. Search runs on THEIR infrastructure!         │
  │ 6. Results formatted and returned!              │
  │ 7. You put results back in messages!            │
  │                                                  │
  │ "I don't know the descriptions or prompts       │
  │  they're telling our LLM."                      │
  │ "Unless I do some TRACING." (Laminar!)          │
  └──────────────────────────────────────────────────┘
```

### 7.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — FROM NO WEB TO GROUNDED:
═══════════════════════════════════════════════════════════════

  No internet: Agent stuck at training cutoff!
  │ → "Knowledge up to June 2024."
  ↓
  One line of code:
  │ → openai.tools.webSearch()
  │ → "Agent is no longer BOUND."
  │ → "You can make it LIVE."
  │ → "You can GROUND it."
  ↓
  But now context window is in danger!
  │ → Web search = lots of tokens!
  │ → Need compaction strategy!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 27:
═══════════════════════════════════════════════════════════════

  NATIVE TOOL:
  [ ] openai.tools.webSearch() = one line!
  [ ] No execute function needed!
  [ ] Runs on OpenAI's servers!
  [ ] "The easiest tool you've EVER written!"

  REGISTRATION:
  [ ] Wrap in our tool composition standard!
  [ ] Import + add to tools object!
  [ ] Build, install, test!

  GROUNDING:
  [ ] Agent can now access real-time info!
  [ ] "No longer bound by training cutoff!"
  [ ] Returns sources with links!

  NEXT STEPS:
  [ ] Need compaction because web search = tokens!
  [ ] "Even without web search, someone chatty!"

  TIẾP THEO → Phần 28: Model Token Limits!
```
