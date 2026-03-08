# AI Agents Fundamentals, v2 — Phần 37: Wrapping Up — "Go Get Lost. Get Those Questions!"

> 📅 2026-03-07 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Wrapping Up — "Frameworks, Tools, Career Advice, Go Build Agents!"
> Độ khó: ⭐️⭐️ | Overview — Frameworks, resources, career advice, inspiration!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | Agent Frameworks — "OpenAI Agents SDK, Mastra, Volt!"       |
| 2   | Cool Tools — "Browser Base, Director, Cloudflare!"          |
| 3   | Career Advice — "Evals + Infrastructure = Drop Everything!" |
| 4   | Final Words — "Go Get Lost. Have Fun!"                      |
| 5   | 🔬 Course Retrospective — Everything We Built!              |

---

## §1. Agent Frameworks — "OpenAI Agents SDK, Mastra, Volt!"

> Scott: _"If you're going to use a framework, HIGHLY recommend the OpenAI Agents SDK. Everything we just did — done in three short lines."_

### OpenAI Agents SDK — "#1 Recommendation!"

```javascript
// EVERYTHING we built from scratch — in 3 lines!

import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "My Agent",
  instructions: "You are a helpful assistant.",
  tools: [myTool],
});

const result = await run(agent, "Hello!");
// Done. That's it!
```

```
WHAT IT INCLUDES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ ✅ Agent creation (name, instructions!)         │
  │ ✅ Tools (name, description, parameters, execute)│
  │ ✅ Handoffs (pass to another agent!)            │
  │ ✅ Context management (what we built!)          │
  │ ✅ Guard rails (check input before sending!)    │
  │ ✅ Human-in-the-loop (needs_approval on tool!)  │
  │ ✅ GUI (attach to client!)                      │
  │                                                  │
  │ "All the stuff we just built, this thing has    │
  │  it built in. And it's OpenAI."                 │
  │                                                  │
  │ Tools look EXACTLY like ours:                    │
  │ → name, description, parameters (Zod), execute!│
  │ → "It's literally the same thing."             │
  └──────────────────────────────────────────────────┘
```

### Mastra — "New Kid, Gatsby Creators!"

```
MASTRA:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ → From creators of GATSBY!                     │
  │ → "They're doing this now."                    │
  │ → Agents + WORKFLOWS!                          │
  │ → Steps with control flow!                     │
  │ → Guard rails!                                 │
  │ → Hosting platform (deploy directly!)          │
  │                                                  │
  │ COOL FEATURE — WORKFLOWS:                        │
  │ → Create steps!                                │
  │ → Depending on output → do other steps!       │
  │ → "Control flow inside workflows, pretty cool."│
  └──────────────────────────────────────────────────┘
```

### Volt Agents — "Event-Based!"

```
VOLT AGENTS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ → Agents that respond to EVENTS, not prompts!  │
  │ → "Slack message, GitHub event, Airtable change│
  │    — let the agent handle it."                  │
  │                                                  │
  │ → "Event-based is the ONLY real way to make    │
  │    agents outside of terminal agents."           │
  │                                                  │
  │ → "Very similar: agent, name, description,     │
  │    model, tools. Not nothing crazy."            │
  └──────────────────────────────────────────────────┘
```

---

## §2. Cool Tools — "Browser Base, Director, Cloudflare!"

### Browser Base — "Give Your Agent A Browser!"

```
BROWSER BASE / STAGEHAND:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ Browser Base: Headless browsers as a service!   │
  │                                                  │
  │ Stagehand: AI agent that USES a browser!        │
  │ → Uses Playwright under the hood!              │
  │ → Generates Playwright code from human lang!   │
  │ → "Theirs is way better than mine."            │
  │ → "These folks know what they're doing."       │
  │                                                  │
  │ Scott's story:                                   │
  │ "One of the FIRST agents I built was this.     │
  │  Before Playwright. For my startup.             │
  │  Then everybody started building them."         │
  └──────────────────────────────────────────────────┘
```

### Director — "Find Me LeBron's, Size 14!"

```
DIRECTOR:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ → Type: "Find me LeBron's on Nike, size 14"    │
  │ → Opens a browser!                             │
  │ → You see it NAVIGATING!                       │
  │ → Goes to nike.com!                            │
  │ → Shows all steps!                             │
  │ → "Helpful for crawling a browser."            │
  └──────────────────────────────────────────────────┘
```

### Cloudflare — "KILLING IT For Agents!"

```
CLOUDFLARE — SCOTT'S GO-TO:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ → "Not sponsoring me. I could care less."      │
  │ → "But for agents, they're KILLING IT."        │
  │                                                  │
  │ WHAT THEY HAVE:                                  │
  │ → Agent abstraction!                           │
  │ → State management!                            │
  │ → Workflows!                                   │
  │ → Durable execution!                           │
  │ → WebSockets for FREE!                         │
  │ → Streaming for FREE!                          │
  │ → V8 isolates on the edge = FAST!             │
  │                                                  │
  │ "EVERYTHING I need is in ONE PLACE.             │
  │  Outside of a Postgres database."               │
  │                                                  │
  │ "Nobody is on par with them. In my opinion.     │
  │  Not for background agents that do events.      │
  │  Nobody's CLOSE."                                │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Career Advice — "Evals + Infrastructure = Drop Everything!"

> Scott: _"If I was learning right now, 3 years or less experience, I would drop EVERYTHING and learn evals and infrastructure."_

```
CAREER ADVICE — THE ANTHROPIC JOB LISTINGS:
═══════════════════════════════════════════════════════════════

  Research Engineer, Model Evaluations — Anthropic
  ┌──────────────────────────────────────────────────┐
  │ → NO degree requirements!                      │
  │ → "Nowhere does it say master's or PhD."       │
  │                                                  │
  │ QUALIFICATIONS:                                  │
  │ → Experience with eval during model training!  │
  │ → Safety eval frameworks + red teaming!        │
  │ → Psychometrics + experimental psychology!     │
  │ → Reinforcement learning!                      │
  │ → Open source contributions!                   │
  │ → Prompt engineering!                          │
  │ → Evaluation infrastructure!                   │
  │                                                  │
  │ SALARY: $300K — $400K! 💰                      │
  │ "You just gotta be a PSYCHO, apparently."      │
  └──────────────────────────────────────────────────┘

  Founding Design Engineer — Anthropic
  ┌──────────────────────────────────────────────────┐
  │ → Front-end! Motion! Animations!               │
  │ → "Really likes front part of front-end."     │
  │ → SALARY: $320K — $405K! EVEN MORE! 🤯        │
  │                                                  │
  │ "Still a HIGH NEED for people who can build     │
  │  delightful experiences. Problem with AI right  │
  │  now is UX and UI, it's ALL BAD."              │
  └──────────────────────────────────────────────────┘

  TWO THINGS TO MASTER:
  ┌──────────────────────────────────────────────────┐
  │ ① EVALS — "Really important!"                  │
  │ ② INFRASTRUCTURE — "The infrastructure side."  │
  │                                                  │
  │ "Everything else is MOSTLY solved."             │
  │ "If I was 3 years or less experience,           │
  │  I would DROP EVERYTHING and learn that."      │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. Final Words — "Go Get Lost. Have Fun!"

> Scott: _"Go get lost. Have fun. The more lost you get, the more questions you have, the more knowledgeable you'll be."_

```
FINAL WORDS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ "I CHALLENGE you to:                             │
  │  → Continue building on this!                  │
  │  → Learn from code you didn't write!           │
  │  → Go make your OWN! Experiment!"              │
  │                                                  │
  │ "Massive OPPORTUNITY for quite some time.       │
  │  If you're already skilled, upskilling WON'T   │
  │  be that difficult."                             │
  │                                                  │
  │ "If you're new, you're gonna have to grind     │
  │  anyway. Might as well grind on THIS."          │
  │                                                  │
  │ "That person in your company that knows the     │
  │  most about AI? That person's going to be      │
  │  doing WELL very soon."                         │
  │                                                  │
  │ "You think I know this stuff? I have WAY MORE  │
  │  QUESTIONS than I have to share with you.       │
  │  It's those open questions that DRIVE me."      │
  │                                                  │
  │ "The day I don't have questions is the day      │
  │  I stop learning."                               │
  │                                                  │
  │ "GO GET LOST. Get those questions.              │
  │  And upskill yourself." 🚀                     │
  └──────────────────────────────────────────────────┘
```

---

## §5. 🔬 Course Retrospective — Everything We Built!

```
WHAT WE BUILT — FROM SCRATCH:
═══════════════════════════════════════════════════════════════

  PART 1: FOUNDATIONS
  ├── What is an AI Agent? [Part 1-5]
  ├── CLI demo, structured output, tools concept
  ├── Agent loop architecture
  └── Turn flow (user → LLM → tool → LLM → done)

  PART 2: EVALUATIONS [Part 10-20]
  ├── Why evals matter ("Most IMPORTANT thing!")
  ├── Single-turn eval executor
  ├── LLM judges, human judges
  ├── Eval strategies (rubric, exact, includes)
  └── Multi-turn conversation evals

  PART 3: TOOLS [Part 21-25]
  ├── File system (read, write, list, delete)
  ├── Tool composition standard
  ├── System prompt for coding agent
  └── Live demo: agent reads/writes files!

  PART 4: CONTEXT MANAGEMENT [Part 26-30]
  ├── 6 strategies for managing context
  ├── Web search tool (native OpenAI!)
  ├── Token counting + model limits
  ├── Compaction (summarize + rebuild + fake msg!)
  └── Integration into agent loop

  PART 5: EXECUTION [Part 31-33]
  ├── Shell tool (ShellJS, "damn near AGI!")
  ├── Sandboxing (VMs, Docker, services)
  └── Code execution as workflow tool

  PART 6: HUMAN-IN-THE-LOOP [Part 34-37]
  ├── RLHF, approval contexts
  ├── Sync vs async approval flows
  ├── Implementation (loop level, NOT as tool!)
  └── "LLM has NO IDEA about approvals!"

  FRAMEWORKS:
  ├── OpenAI Agents SDK (#1!)
  ├── Mastra (workflows!)
  └── Volt Agents (event-based!)

  INFRASTRUCTURE:
  └── Cloudflare ("KILLING IT. Nobody close.")
```

```
CORE LESSONS — THE GEMS:
═══════════════════════════════════════════════════════════════

  "Evals are the MOST IMPORTANT THING."

  "Tools are just functions with GOOD NAMES."

  "3.75 chars per token — I kind of GUESSED."

  "Mind control: tell LLM 'you said this.'"

  "Don't make approval TOOL — 3 months. NEVER works."

  "Start tools HIGH LEVEL, take down as needed."

  "Notion MCP — I HATE it. Too atomic!"

  "File system + terminal + internet = damn near AGI."

  "3 years ago = $20M in funding."

  "Go get lost. Get those questions. Upskill yourself."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 37:
═══════════════════════════════════════════════════════════════

  FRAMEWORKS:
  [ ] OpenAI Agents SDK = #1 recommendation!
  [ ] Mastra = workflows + agents! (Gatsby creators!)
  [ ] Volt Agents = event-based! ("Only real way!")

  TOOLS/INFRA:
  [ ] Browser Base / Stagehand = browser for agents!
  [ ] Director = visual browser automation!
  [ ] Cloudflare = "KILLING IT. Nobody close."

  CAREER:
  [ ] Evals + Infrastructure = master these!
  [ ] "Drop everything if < 3 years experience!"
  [ ] Front-end UX/UI = still high demand!
  [ ] No degree required at Anthropic!
  [ ] $300K-$405K salary range!

  MINDSET:
  [ ] "Go get LOST. Get questions. Upskill."
  [ ] "The more lost, the more knowledgeable."
  [ ] "The day I don't have questions = stop learning."

  🎉 COURSE COMPLETE! 🎉
```
