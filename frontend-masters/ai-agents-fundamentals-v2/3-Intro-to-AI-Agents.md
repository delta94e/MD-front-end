# AI Agents Fundamentals, v2 — Phần 3: Intro to AI Agents — Định Nghĩa, Agent Loop, Tương Lai!

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Intro to AI Agents — "The LLM Is In The Driver's Seat!"
> Độ khó: ⭐️⭐️⭐️ | Lý thuyết nền tảng + Agent Loop!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | Định Nghĩa Agent — "I've Never Heard The Same Thing Twice!" |
| 2   | Agent vs Workflow — "Like Recursion vs For Loop!"           |
| 3   | Các Định Nghĩa Khác — Và Tại Sao Chưa Đủ!                   |
| 4   | The Car Analogy — "LLM Is In The Driver's Seat!"            |
| 5   | Agents Bad At — "Confidently Doing Something WRONG!"        |
| 6   | The Agent Loop — Think → Act → Observe → Repeat!            |
| 7   | Future of Agents — Multi-Agent, Specialized, Guardrails!    |
| 8   | Tự Implement: Agent Loop From Scratch                       |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu          |

---

## §1. Định Nghĩa Agent — "I've Never Heard The Same Thing Twice!"

> Scott: _"There really isn't a good definition of agents. I've asked so many people what they think agents are and I don't think I've heard the same thing TWICE."_

```
SCOTT'S DEFINITION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ An AGENT is essentially an LLM that can          │
  │ DECIDE what path to take using a                 │
  │ REASONING FRAMEWORK and a SET OF TOOLS           │
  │ to get the job done.                             │
  │                                                  │
  │ BREAKDOWN:                                       │
  │ ① LLM         → The brain (GPT-4, Claude...)   │
  │ ② DECIDE      → Chooses next action!            │
  │ ③ PATH        → Unknown at design time!         │
  │ ④ REASONING   → How it thinks about decisions! │
  │ ⑤ TOOLS       → Functions it can call!          │
  │ ⑥ JOB DONE   → Has a goal, works toward it!   │
  │                                                  │
  │ "The simplest to understand and probably covers  │
  │  everything, but I still think it's QUITE BROAD."│
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Agent vs Workflow — "Like Recursion vs For Loop!"

> Scott: _"An agent is very similar to a workflow, except the PATH that it has to take is UNKNOWN. It happens at runtime."_

```
WORKFLOW vs AGENT:
═══════════════════════════════════════════════════════════════

  WORKFLOW (Deterministic):
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Input → Step A → Step B → Step C → Output      │
  │                     │                            │
  │                     ├── if X → Step D            │
  │                     └── if Y → Step E            │
  │                                                  │
  │ → "Rigid, designed by someone like YOU."        │
  │ → "Deterministic — always follows same paths    │
  │    depending on variables."                      │
  │ → "That's the FEATURE of it."                   │
  │                                                  │
  └──────────────────────────────────────────────────┘

  AGENT (Dynamic):
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Input → ??? → ??? → ??? → Output               │
  │                                                  │
  │ → "The path is UNKNOWN!"                        │
  │ → "Happens at RUNTIME!"                         │
  │ → "Either planned at beginning or figured out   │
  │    AS IT GOES."                                  │
  │ → "Different every time we run!"                │
  │                                                  │
  └──────────────────────────────────────────────────┘

  THE ANALOGY — RECURSION vs FOR LOOP:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ FOR LOOP (= Workflow):                           │
  │ → Array has FINITE end! Known depth!            │
  │ → "You probably don't need recursion."          │
  │                                                  │
  │ RECURSION (= Agent):                             │
  │ → Tree has UNKNOWN depth!                       │
  │ → "You don't know the depth, so you might       │
  │    need recursion. That's a BETTER tool."       │
  │                                                  │
  │ KEY: "An agent is something we throw a problem   │
  │ where we DON'T KNOW the vastness of it, we      │
  │ don't know the DEPTH of it, and we need to      │
  │ FIGURE IT OUT as we go."                         │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHEN TO USE WHAT:
  ┌──────────────────────┬─────────────────────────┐
  │ Use WORKFLOW when:   │ Use AGENT when:         │
  ├──────────────────────┼─────────────────────────┤
  │ Path is known!       │ Path is UNKNOWN!        │
  │ Steps are fixed!     │ Steps vary each time!   │
  │ Same task every run! │ Different tasks each run│
  │ Depth is finite!     │ Depth is UNKNOWN!       │
  │ Like a FOR loop!     │ Like RECURSION!         │
  └──────────────────────┴─────────────────────────┘
```

---

## §3. Các Định Nghĩa Khác — Và Tại Sao Chưa Đủ!

> Scott: _"Other definitions you might hear..."_

```
DEFINITIONS SCOTT HAS HEARD:
═══════════════════════════════════════════════════════════════

  ① "An LLM with tools"
  ┌──────────────────────────────────────────────────┐
  │ Scott: "Yeah, that's true, but an LLM with      │
  │ tools doesn't HAVE TO LOOP, so it's not         │
  │ entirely true."                                  │
  │ → Missing: the LOOP! Single tool call ≠ agent! │
  └──────────────────────────────────────────────────┘

  ② "An autonomous AI"
  ┌──────────────────────────────────────────────────┐
  │ Scott: "I think that's just a TYPE of an agent.  │
  │ Something in the background, invisible,          │
  │ responding to events. There aren't too many of  │
  │ those out there right now."                      │
  │ → Missing: agents don't HAVE to be autonomous! │
  └──────────────────────────────────────────────────┘

  ③ "AI that can plan and execute"
  ┌──────────────────────────────────────────────────┐
  │ Scott: "Sure, not all agents PLAN though.        │
  │ Some of them just FIGURE IT OUT as they go."    │
  │ → Missing: planning is optional, not required! │
  └──────────────────────────────────────────────────┘

  ④ "A system where an LLM controls the flow" ⭐
  ┌──────────────────────────────────────────────────┐
  │ Scott: "This is probably the BEST one I heard.   │
  │ Because that's EXACTLY it — the flow, as in     │
  │ which DIRECTION to take in this workflow.        │
  │ An agent decides that, NOT a human, and it's    │
  │ figured out ON THE FLY."                        │
  │ → CLOSEST to Scott's definition! ✅            │
  └──────────────────────────────────────────────────┘
```

---

## §4. The Car Analogy — "LLM Is In The Driver's Seat!"

> Scott: _"The LLM is in the driver's seat, figuring out based off its environment what to do next. YOU'RE NOT in the driver's seat. You just gave the LLM the car and put it on the road, and YOU'RE STILL AT HOME."_

```
THE CAR ANALOGY:
═══════════════════════════════════════════════════════════════

  REGULAR LLM:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  🚗 YOU are driving the car!                    │
  │  🗣️ LLM = voice navigation (GPS!)               │
  │                                                  │
  │  "Turn left in 200 meters..."                    │
  │  "Take the freeway exit..."                      │
  │                                                  │
  │  → YOU make all the decisions!                  │
  │  → LLM just SUGGESTS!                          │
  │  → YOU execute!                                 │
  │                                                  │
  └──────────────────────────────────────────────────┘

  AGENT:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  🤖 LLM is driving the car!                    │
  │  🏠 YOU are at home!                             │
  │                                                  │
  │  → LLM decides WHERE to go!                    │
  │  → LLM decides WHICH ROUTE to take!            │
  │  → LLM decides WHEN to stop!                   │
  │  → YOU just gave it the keys and the address!  │
  │                                                  │
  │  Scott: "You just gave the LLM the car,         │
  │  put it on the road, and you're STILL AT HOME." │
  │                                                  │
  └──────────────────────────────────────────────────┘

  COMPARISON:
  ┌────────────────┬─────────────┬────────────────┐
  │                │ Regular LLM │ Agent          │
  ├────────────────┼─────────────┼────────────────┤
  │ Driver         │ YOU!        │ LLM!           │
  │ LLM role       │ GPS voice   │ Full driver!   │
  │ Your role      │ Execute!    │ Give keys!     │
  │ Decisions      │ You decide  │ LLM decides    │
  │ Control        │ Full!       │ Minimal!       │
  └────────────────┴─────────────┴────────────────┘
```

---

## §5. Agents Bad At — "Confidently Doing Something WRONG!"

> Scott: _"Agents CONFIDENTLY doing something wrong, where they don't know that they messed up. In fact, they think they did the RIGHT THING."_

```
WHAT AGENTS ARE BAD AT:
═══════════════════════════════════════════════════════════════

  ❌ 1. Physical presence
  ┌──────────────────────────────────────────────────┐
  │ "For now — because they ARE putting LLMs in     │
  │ ROBOTS now. If you thought ChatGPT was wrong,    │
  │ imagine the robot getting it wrong." 😬          │
  └──────────────────────────────────────────────────┘

  ❌ 2. High stakes decisions without oversight
  ┌──────────────────────────────────────────────────┐
  │ "Like self-driving cars — you still have to be  │
  │ in the driver's seat, you still have to be      │
  │ WATCHING. For reliability, trust, insurance,    │
  │ SAFETY, you still need oversight."              │
  └──────────────────────────────────────────────────┘

  ❌ 3. Creative work requiring human taste
  ┌──────────────────────────────────────────────────┐
  │ "LLMs can't create anything NEW. They can only  │
  │ REMIX what they've been trained on."            │
  └──────────────────────────────────────────────────┘

  ❌ 4. Ambiguous success criteria
  ┌──────────────────────────────────────────────────┐
  │ "LLMs are trained with reinforcement learning,  │
  │ which means they're trained on achieving a      │
  │ GOAL. If the goal is NOT CLEAR, you will not    │
  │ have success. You'll just be BURNING tokens."   │
  └──────────────────────────────────────────────────┘

  ❌ 5. Real-time / latency sensitive operations
  ┌──────────────────────────────────────────────────┐
  │ "Mostly not going to be true NOW and into the   │
  │ near future, but in the recent past, this       │
  │ would be true." (đang cải thiện!)               │
  └──────────────────────────────────────────────────┘

  ❌ 6. Tasks requiring TRUE reasoning
  ┌──────────────────────────────────────────────────┐
  │ "They're just PREDICTING what to do next.       │
  │ Not real intelligence. How do you codify        │
  │ COMMON SENSE? It's really difficult."           │
  └──────────────────────────────────────────────────┘

  ⚠️ THE BIGGEST FAILURE MODE:
  ┌──────────────────────────────────────────────────┐
  │ "Agents CONFIDENTLY doing something WRONG       │
  │ — where they DON'T KNOW that they messed up.   │
  │ In fact, they think they did the RIGHT thing."   │
  │                                                  │
  │ "Where's the MISALIGNMENT?"                     │
  │ → Did I say something wrong?                   │
  │ → Did I not give the right CONTEXT?            │
  │ → Is this thing just not GOOD?                 │
  │ → Or a COMBINATION of the three?               │
  │                                                  │
  │ "And that's some of what we're going to          │
  │ discover in this course."                        │
  └──────────────────────────────────────────────────┘
```

---

## §6. The Agent Loop — Think → Act → Observe → Repeat!

> Scott: _"Everything works on a LOOP. You give it a task, it THINKS about what to do — that's reasoning."_

```
THE AGENT LOOP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │        USER: "Find NBA MVP candidates"           │
  │                     │                            │
  │                     ▼                            │
  │        ┌─── THINK (Reasoning) ───┐               │
  │        │ "Which tool helps me    │               │
  │        │  get closer to the goal?"│               │
  │        └────────┬────────────────┘               │
  │                 │                                │
  │                 ▼                                │
  │        ┌─── ACT (Use Tool) ──────┐               │
  │        │ Execute: web_search()   │               │
  │        └────────┬────────────────┘               │
  │                 │                                │
  │                 ▼                                │
  │        ┌─── OBSERVE (Results) ───┐               │
  │        │ "Got search results.    │               │
  │        │  Do I have enough?"     │               │
  │        └────────┬────────────────┘               │
  │                 │                                │
  │            ┌────┴────┐                           │
  │            │ Enough? │                           │
  │            ├─NO──┐   ├─YES─┐                     │
  │            │     │   │     │                     │
  │            │     ▼   │     ▼                     │
  │            │   LOOP  │   ANSWER                  │
  │            │   AGAIN!│   to user!                │
  │            └─────────┘                           │
  │                                                  │
  └──────────────────────────────────────────────────┘

  Scott: "If it decides I have all the information
  I need, it'll go ahead and ANSWER. If it thinks
  it needs more information, it'll start the loop
  OVER AGAIN."

  WHAT CAN HAPPEN:
  ┌──────────────────────────────────────────────────┐
  │ ✅ Loop → gather enough → answer! (happy path!)│
  │ 🔄 Loop INDEFINITELY (no clear stopping point!)│
  │ 💥 Break / crash (error in tool!)               │
  │ 🏳️ Give up (model decides it can't do it!)     │
  └──────────────────────────────────────────────────┘

  KEY INSIGHT:
  ┌──────────────────────────────────────────────────┐
  │ "It's about putting an agent in an ENVIRONMENT  │
  │ in which it has access to TOOLS to interact     │
  │ with that environment, and it can gather the    │
  │ CONTEXT that it needs for its own decisions."   │
  │                                                  │
  │ "When it feels comfortable answering, given     │
  │ that it has ENOUGH CONTEXT, it'll answer."      │
  └──────────────────────────────────────────────────┘
```

---

## §7. Future of Agents — Multi-Agent, Specialized, Guardrails!

> Scott: _"The future of agents is a combination of ALL these things."_

```
FUTURE OF AGENTS:
═══════════════════════════════════════════════════════════════

  ① BETTER TOOL USE
  ┌──────────────────────────────────────────────────┐
  │ → More sophisticated tool selection!            │
  │ → Better at knowing WHEN to use which tool!    │
  │ → Parallel tool execution!                     │
  └──────────────────────────────────────────────────┘

  ② LONGER CONTEXT
  ┌──────────────────────────────────────────────────┐
  │ → More memory, more context awareness!          │
  │ → Handle larger, more complex tasks!            │
  └──────────────────────────────────────────────────┘

  ③ MULTI-AGENT SYSTEMS
  ┌──────────────────────────────────────────────────┐
  │ → "Agents interacting with EACH OTHER           │
  │    to achieve a common goal!"                   │
  │ → Agent A: research! Agent B: write!            │
  │ → Collaboration between specialized agents!    │
  └──────────────────────────────────────────────────┘

  ④ SPECIALIZED AGENTS
  ┌──────────────────────────────────────────────────┐
  │ → "Fine-tuned, hyper-trained on a specific      │
  │    vertical."                                    │
  │ → "Put this agent in a doctor's pocket and      │
  │    it understands everything about this type    │
  │    of disease or medicine."                      │
  │ → Super specific! Super reliable!              │
  └──────────────────────────────────────────────────┘

  ⑤ BETTER GUARDRAILS
  ┌──────────────────────────────────────────────────┐
  │ → "If they become more POWERFUL but we don't    │
  │    have guardrails, there won't be any TRUST."  │
  │ → "Being powerful means NOTHING if we don't     │
  │    trust them."                                  │
  │ → Safe environments! Accountability!            │
  │ → "Can't cause harm to things that matter!"    │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Agent Loop From Scratch

```javascript
// THE AGENT LOOP — Core mechanism!

// Scott's definition in code:
// "An LLM that can DECIDE what path to take
//  using a REASONING FRAMEWORK and TOOLS
//  to get the job done."

async function agentLoop(task, tools) {
  const messages = [
    {
      role: "system",
      content: `You are an AI agent. You have access to tools.
      Use them to accomplish the user's task.
      When you have enough information, respond directly.`,
    },
    { role: "user", content: task },
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 20; // safety limit!

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // ① THINK — LLM reasons about what to do
    const response = await callLLM(messages, tools);

    // ② CHECK — Does it want to answer or use a tool?
    if (response.type === "answer") {
      // Agent has enough context → answer!
      console.log("Agent answer:", response.content);
      return response.content;
    }

    if (response.type === "tool_call") {
      // ③ ACT — Execute the tool
      const tool = tools[response.toolName];
      console.log(`Using tool: ${response.toolName}`);
      const result = await tool.execute(response.args);

      // ④ OBSERVE — Feed result back to LLM
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [response.rawToolCall],
      });
      messages.push({
        role: "tool",
        content: JSON.stringify(result),
      });

      // → LOOP AGAIN! Back to THINK!
    }
  }

  // Safety: max iterations reached
  return "Agent could not complete the task in time.";
}
```

```javascript
// AGENT vs WORKFLOW — In Code!

// WORKFLOW (deterministic, like a for loop):
function processOrder(order) {
  // Path is KNOWN! Always the same steps!
  const validated = validateOrder(order); // Step 1
  const payment = chargePayment(validated); // Step 2
  const shipped = createShipment(payment); // Step 3
  const email = sendConfirmation(shipped); // Step 4
  return email;
  // ALWAYS: validate → charge → ship → email!
}

// AGENT (dynamic, like recursion):
async function handleRequest(task) {
  // Path is UNKNOWN! Different every time!
  // "Find me the best pizza near my office"
  //   → search_web? → get_location? → compare?
  //   → HOW MANY searches? WHO KNOWS!
  //   → LLM decides AT RUNTIME!
  return await agentLoop(task, tools);
}

// Scott: "It's a different tool for a different use case.
// You wouldn't need an agent for EVERYTHING, just like
// you wouldn't need recursion for everything."
```

```javascript
// THE BIGGEST FAILURE MODE — Confidently wrong!

// Scott: "Agents confidently doing something WRONG,
// where they don't know that they messed up."

// Example of misalignment:
async function demonstrateFailure() {
  const task = "Delete all test files";

  // Agent might interpret "test" differently:
  // User meant: files in __tests__/ folder
  // Agent did:  deleted files containing "test" in name!
  //             Including "testimonials.md"! 💀

  // The agent THINKS it succeeded:
  // "Successfully deleted all test files ✅"
  // But it deleted the WRONG files!

  // Scott: "Where's the MISALIGNMENT?"
  // → Did I say something wrong? (ambiguous "test")
  // → Did I not give right context? (no folder specified)
  // → Is the model not good? (maybe)
  // → Combination of all three? (likely!)
}
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys — Agent Definition

```
5 WHYS: TẠI SAO AGENT KHÁC LLM?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao LLM alone không đủ?
  └→ Vì LLM chỉ generate text! Không action!
     Agent = LLM + tools + loop = CAN ACT!

  WHY ②: Tại sao cần tools?
  └→ Vì LLM không thể tự search web hay write file!
     Tools = hands/feet cho LLM brain!
     "Tools are just FUNCTIONS!"

  WHY ③: Tại sao cần loop?
  └→ Vì complex tasks = NHIỀU bước!
     Mỗi bước cần observe result trước khi quyết!
     "It figures it out AS IT GOES!"

  WHY ④: Tại sao cần reasoning?
  └→ Vì phải CHỌN tool nào! Khi nào dừng!
     "Which set of tools are most likely to help
     me get CLOSER to achieving the goal?"

  WHY ⑤: Tại sao agent giống recursion?
  └→ Vì UNKNOWN DEPTH!
     Không biết cần bao nhiêu steps!
     "You don't know the depth of that tree!"
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — AGENT COMPONENTS:
═══════════════════════════════════════════════════════════════

  AGENT = LLM + TOOLS + LOOP + REASONING

  ┌──────────────────────────────────────────────────┐
  │ LLM (Language Model):                            │
  │ → Understands natural language!                 │
  │ → Generates responses!                          │
  │ → "The brain"                                   │
  │                                                  │
  │ TOOLS (Functions):                               │
  │ → Interface with external world!                │
  │ → web_search, write_file, run_command!          │
  │ → "The hands"                                   │
  │                                                  │
  │ LOOP (Iteration):                                │
  │ → Keep going until goal achieved!               │
  │ → Think → Act → Observe → Repeat!             │
  │ → "The persistence"                             │
  │                                                  │
  │ REASONING (Decision Framework):                  │
  │ → Choose which tool, which args!                │
  │ → Decide when to stop!                          │
  │ → "The judgment"                                │
  └──────────────────────────────────────────────────┘

  Remove LLM → can't understand language!
  Remove TOOLS → can't interact with world!
  Remove LOOP → one-shot only, not an agent!
  Remove REASONING → random actions, useless!
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — AGENT vs TRADITIONAL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────┐
  │                  │ Workflow      │ Agent         │
  ├──────────────────┼───────────────┼───────────────┤
  │ Path             │ Known!        │ UNKNOWN!      │
  │ Deterministic    │ ✅ Yes!       │ ❌ No!        │
  │ Flexibility      │ ❌ Rigid!     │ ✅ Dynamic!   │
  │ Predictability   │ ✅ High!      │ ⚠️ Low!       │
  │ Cost             │ ✅ Fixed!     │ ⚠️ Variable!  │
  │ Debugging        │ ✅ Easy!      │ ❌ Hard!      │
  │ Novel tasks      │ ❌ Can't!     │ ✅ Can!       │
  │ Speed            │ ✅ Fast!      │ ⚠️ Slow!      │
  │ Reliability      │ ✅ 99.9%!     │ ⚠️ Variable!  │
  └──────────────────┴───────────────┴───────────────┘

  Scott: "A different tool for a different use case."
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — AGENT ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  USER: "Find NBA MVP and write to file"            │
  │         │                                           │
  │         ▼                                           │
  │  ┌── ENVIRONMENT ──────────────────────────┐        │
  │  │                                         │        │
  │  │  ┌─────────────────────────────────┐    │        │
  │  │  │         AGENT LOOP              │    │        │
  │  │  │                                 │    │        │
  │  │  │  ┌──────┐   ┌──────────────┐   │    │        │
  │  │  │  │ LLM  │──→│  Reasoning   │   │    │        │
  │  │  │  │      │   │  "Which tool │   │    │        │
  │  │  │  │      │   │   to use?"   │   │    │        │
  │  │  │  └──────┘   └──────┬───────┘   │    │        │
  │  │  │                    │            │    │        │
  │  │  │              ┌─────▼─────┐      │    │        │
  │  │  │              │   TOOLS   │      │    │        │
  │  │  │              │ 🌐 search │      │    │        │
  │  │  │              │ 📁 files  │      │    │        │
  │  │  │              │ 💻 terminal│      │    │        │
  │  │  │              └─────┬─────┘      │    │        │
  │  │  │                    │            │    │        │
  │  │  │              Results → LLM      │    │        │
  │  │  │              (observe & repeat) │    │        │
  │  │  └─────────────────────────────────┘    │        │
  │  │                                         │        │
  │  └─────────────────────────────────────────┘        │
  │         │                                           │
  │         ▼                                           │
  │  📄 OUTPUT: MVP.md with table!                     │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

### 9.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — SCOTT'S DEFINITIONS:
═══════════════════════════════════════════════════════════════

  TESTING EACH DEFINITION AGAINST REALITY:

  ① "LLM with tools" → INCOMPLETE
     Test: LLM calls one tool, returns answer
     → That's tool use, not an agent!
     → Missing: LOOP! Decision-making over time!

  ② "Autonomous AI" → TOO NARROW
     Test: Agent that always asks for approval
     → Still an agent! Just less autonomous!
     → Missing: agents can be human-in-the-loop!

  ③ "AI that can plan and execute" → INCOMPLETE
     Test: Scott's AGI agent doesn't plan ahead
     → "Some just figure it out AS THEY GO!"
     → Missing: planning is OPTIONAL!

  ④ "LLM controls the flow" → BEST! ✅
     Test: LLM decides next step at each iteration
     → Yes! LLM is in the driver's seat!
     → Covers all cases!

  SCOTT'S DEFINITION = ④ + tools + reasoning!
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — FROM CHATBOT TO AGENT:
═══════════════════════════════════════════════════════════════

  1966: ELIZA — first chatbot!
  │     → Pattern matching, no intelligence!
  │
  ↓
  2011: Siri — voice assistant!
  │     → Scripted responses, workflows!
  │     → NOT an agent (deterministic!)
  │
  ↓
  2020: GPT-3 — LLM emerges!
  │     → Text generation only!
  │     → No tools, no loop!
  │
  ↓
  2022-2023: "The demo days"
  │     → AutoGPT, BabyAGI
  │     → Scott: "Gone are THOSE days!"
  │     → Impressive demos, unreliable!
  │
  ↓
  2024: Tool use matures!
  │     → Function calling standard!
  │     → Agents become practical!
  │
  ↓
  NOW: Production agents!
  │     → Scott: "I'm sharing experience from
  │       building agents in PRODUCTION for
  │       startups and MASSIVE companies."
  │
  ↓
  FUTURE:
  → Multi-agent systems!
  → Specialized agents (doctor's pocket!)
  → Better guardrails!
  → "Powerful means NOTHING without trust!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 3:
═══════════════════════════════════════════════════════════════

  DEFINITION:
  [ ] Agent = LLM + reasoning + tools + loop!
  [ ] "LLM controls the flow" = best definition!
  [ ] "LLM is in the DRIVER'S SEAT!"
  [ ] Path is UNKNOWN, figured out at RUNTIME!

  AGENT vs WORKFLOW:
  [ ] Workflow = deterministic, known path! (for loop!)
  [ ] Agent = dynamic, unknown path! (recursion!)
  [ ] "Different tool for different use case!"

  AGENTS BAD AT:
  [ ] Physical presence (for now!)
  [ ] High stakes without oversight!
  [ ] Creative work requiring taste!
  [ ] Ambiguous success criteria!
  [ ] True reasoning / common sense!
  [ ] #1 FAILURE: "Confidently doing something WRONG!"

  AGENT LOOP:
  [ ] Think → Act → Observe → Repeat!
  [ ] Loop until satisfied with enough context!
  [ ] Can: answer, loop, break, give up!

  TIẾP THEO → Phần 4: Building The Agent Loop!
```
