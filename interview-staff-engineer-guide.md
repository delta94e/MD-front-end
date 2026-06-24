# 🎯 Interview Guide — Sr. Staff Frontend Engineer
## Agents · Tech Modernisation · CI Strategy · Engineering Culture

---

## 🔑 Context: What "Sr. Staff" Actually Means

```
IC LEVELS AT MOST TECH COMPANIES:
  L4: Software Engineer       — ships assigned features
  L5: Senior Engineer         — owns features, mentors L4s
  L6: Staff Engineer          — influences across teams, sets technical direction
  L7: Sr. Staff / Principal   — shapes organisational engineering strategy

SR. STAFF IS NOT ABOUT WRITING MORE CODE.
  It is about:
  - Making the WHOLE TEAM write better code, faster
  - Identifying the highest-leverage technical problems
  - Leading initiatives (not just contributing to them)
  - Creating a culture that outlasts any individual project
  - Ensuring engineering decisions at the team level align with company direction

THE FOUR FOCUS AREAS:
  1. AGENTS — leading project planning for a new product surface
     (Staff-level: not just "I built the feature" but "I set up the team to build it")
  
  2. TECH MODERNISATION — identifying and executing tech stack improvements
     (Staff-level: not just "I migrated to Vite" but "I built a framework for deciding
     what to modernise and in what order, and then executed the highest-priority items")
  
  3. CI STRATEGY — stability while minimising CI run time
     (Staff-level: not just "CI is slow" but "here is the specific bottleneck,
     here is the specific optimisation, here is the measured result")
  
  4. ENGINEERING CULTURE — radical transparency and learning fast
     (Staff-level: not just "I write good code" but "I create the conditions
     in which the team learns faster and ships value more consistently")
```

---

## 1️⃣ Agents — Leading Project Planning

### What "leading project planning" means at Staff level

```
COMMON MISUNDERSTANDING:
  Engineers think "project planning" = writing a Jira board.
  At Staff level, project planning is a technical leadership skill:
  
  1. DECOMPOSITION:
     An "Agents" product is a vague concept. "AI agents that autonomously execute tasks."
     Leading planning means decomposing that into shippable milestones:
     
     M1: Agent execution API + basic step streaming (SSE)
     M2: Think/Tool/Observe/Respond step types rendered in UI
     M3: Agent configuration UI (model selection, tool access, memory settings)
     M4: Run history, success rates, error inspection
     M5: Multi-agent orchestration (agents that call other agents)
     
     Each milestone ships independently. M1 alone is useful for debugging.
     M4 alone is useful for ops. M5 can slip without breaking M1-M4.
  
  2. RISK IDENTIFICATION:
     Which part of this is most likely to derail the project?
     For Agents: the streaming UI is novel — we have not built SSE UIs before.
     Risk: the step state machine is more complex than it looks
     (what if a step errors mid-stream? what if the connection drops?).
     Mitigation: prototype the SSE layer first, before committing to M2+ timeline.
  
  3. DEPENDENCY MAPPING:
     The Agents UI depends on the Agents API (owned by BE team).
     If the API is not ready, the FE cannot build M1.
     Leading planning means surfacing this dependency early and establishing
     a contract (API schema, mock server) so FE can build in parallel.
  
  4. UNBLOCKING:
     A Staff engineer's job is to remove blockers for other engineers.
     "We can't build the streaming UI until the API is ready" is a blocker.
     Leading planning converts this from a waiting problem to a parallel-work problem:
     build a mock SSE server that the FE team develops against.
     When the real API is ready, swap out the mock.
```

### The Agent Architecture — Frontend

```
WHAT MAKES AGENTS FRONTEND INTERESTING:

  Traditional product UI:    user action → API call → render response
  Agent UI:                  user action → API call → stream of events → progressive render

  The agent runs asynchronously, potentially for minutes.
  The user needs to see: what is the agent doing right now?
  Not: wait for the result and display it.

STEP TYPES:
  THINK:   The agent reasons about what to do next.
           Shows the agent's "chain of thought" in real-time.
  TOOL:    The agent calls an external tool (web search, CRM lookup, email draft).
           Shows: which tool, what arguments, duration.
  OBSERVE: The agent processes the tool's result.
           Shows: what the agent extracted and understood.
  RESPOND: The agent produces its final output.
           Shows: the result, ready for the user to act on.

TECHNICAL IMPLEMENTATION — Server-Sent Events (SSE):
  SSE is the right choice for this pattern (not WebSocket, not polling):
  - Agents run for 5-30 seconds — too long for a single HTTP response
  - WebSocket is bidirectional; agents only need server→client streaming
  - Polling introduces latency proportional to the polling interval
  - SSE: persistent HTTP connection, server pushes events as they happen
  
  The frontend opens an EventSource connection to /api/agents/:id/run.
  Each agent step fires a series of events:
    step_start → { stepId, stepType, label }
    step_done  → { stepId, detail, durationMs }
  When all steps complete: agent_complete → { totalMs, summary }
  
  React state: an array of steps, updated as events arrive.
  Each update appends or modifies one step — not a full re-render.
  The step list renders progressively: completed steps stay rendered;
  current step shows a spinner; pending steps show placeholders.

FAILURE HANDLING:
  SSE connections can drop (network interruption, server restart).
  EventSource automatically reconnects (built into the browser API).
  BUT: if the agent is still running server-side, we need to resume
  the event stream from where it dropped.
  Solution: The agent run has a runId. On reconnect, the client passes
  the last received stepId. The server resumes streaming from that step.
```

### STAR Script

```
SITUATION:
  The company was launching an Agents product — AI agents that autonomously
  research prospects, draft outreach, and keep CRM data clean.
  The engineering work was complex: novel API patterns (streaming), new UI paradigms
  (progressive rendering of multi-step processes), and no existing team knowledge.

TASK:
  Lead the frontend planning for Agents — not just build, but plan:
  decompose the product into shippable milestones, identify technical risks,
  establish parallel work tracks with backend, and set up the team to build.

ACTION:
  1. DECOMPOSED into 5 milestones (see above). M1-M3 shipped in 6 weeks.
     M4 (run history) shipped in week 8. M5 (multi-agent) is Q3.
  
  2. IDENTIFIED the SSE streaming layer as the highest risk.
     Built a prototype in week 1: EventSource connection to a mock server,
     step state machine in React, basic UI.
     Proved: the pattern works, the complexity is manageable.
     Revised the timeline based on the prototype (it was harder than expected).
  
  3. ESTABLISHED API CONTRACT early.
     Before the BE team built the real API, I defined the event schema:
     { type: "step_start" | "step_done" | "agent_complete", stepId, ... }
     Built a mock SSE server using Node's native http module.
     FE team built against the mock. When real API arrived: swap, minimal changes.
  
  4. BUILT THE STEP STATE MACHINE in useAgentStream() hook.
     Handles: connection drops (auto-reconnect with last stepId), step errors
     (show error inline without closing the run), agent_complete cleanup.
     Other engineers build agent UIs by using this hook — they do not implement
     the SSE logic themselves.

RESULT:
  M1-M3 shipped on schedule. Three agents (Research, Outreach, Data Sync) live in production.
  The useAgentStream() hook is used by 4 different agent UIs — the abstraction worked.
```

### Follow-up Q&A

**"Why SSE instead of WebSocket for agents?"**
> "WebSocket is bidirectional — you use it when the client also needs to send messages during the streaming session (like a chat interface). Agents are one-directional: the user starts a run, the server streams back step events, the user observes. There is nothing to send mid-stream. SSE is simpler for this: it is a plain HTTP connection, no upgrade handshake, works through standard HTTP proxies and CDNs without special configuration. EventSource in the browser handles reconnection automatically. The only scenario where I would switch to WebSocket is if we added real-time collaborative viewing of an agent run — multiple users watching the same run's steps — but even then, a broadcast mechanism over SSE would work."

**"How do you handle agent step errors in the UI?"**
> "Error states are first-class in the step model. A step can be: pending, running, done, or error. An error step shows the error message inline in the step row — it does not close the run or show a generic error screen. Why: in multi-step agents, a single step error does not necessarily abort the entire run. The agent might retry, or route around the failed step. The user should see: 'Step 3 (web_search) failed: rate limited. Retrying…' — not a generic 'something went wrong.' For fatal errors (the agent cannot continue), the agent_complete event carries a status field: 'complete' | 'failed'. A failed run shows a summary of what completed before the failure, which is more useful than a blank error screen."

---

## 2️⃣ Tech Stack Modernisation

### The prioritisation framework

```
COMMON MISTAKE: modernising because something is "new."
CORRECT APPROACH: modernising because it removes real engineer pain.

THE MATRIX (score 1-5 on each dimension):
  pain:   How much does the current tool slow engineers down every day?
  impact: How much better is the "after" state than the "before" state?
  risk:   How risky is the migration? (inverted: 5 = low risk, 1 = high risk)
  days:   How many engineer-days does the migration take?

priority = (pain × impact × risk) / days

SCORED EXAMPLES:
  Biome (ESLint+Prettier → Biome):
    pain=3 (slow lint, config conflicts), impact=4, risk=5 (1 binary, no side effects), days=2
    priority = (3×4×5)/2 = 30  ← do this first

  Webpack → Vite:
    pain=5 (45s cold start), impact=5, risk=4 (module federation needs plugin), days=5
    priority = (5×5×4)/5 = 20

  Jest → Vitest:
    pain=4 (slow tests), impact=5, risk=4 (codemod handles 90%), days=4
    priority = (4×5×4)/4 = 20

  TypeScript strict:
    pain=2 (not painful daily), impact=5 (prevents bugs), risk=2 (800 errors to fix), days=30
    priority = (2×5×2)/30 = 0.7 ← do this last

RESULT: Biome → Vite/Vitest (tie) → TypeScript strict
This is exactly the order we executed.
```

### The five migrations — know the key facts

```
1. WEBPACK 4 → VITE 5
   Before: 45-second cold start. HMR changes take 3-8 seconds.
   After:  1.8-second cold start. HMR changes take <100ms.
   Why it's faster: Webpack bundles everything at startup (even things not yet requested).
     Vite serves native ES modules in dev — it only transforms the file the browser requests.
     For a 400-module project, Webpack transforms 400 modules at startup.
     Vite transforms 1 module at startup. The rest are transformed on demand.
   Risk: Dynamic require() patterns do not work in ESM.
     We had 12 dynamic requires — all converted to import().
     Module Federation (our MFE setup) required vite-plugin-federation.

2. JEST → VITEST
   Before: 120-second test run in CI. Local re-run: 8-15 seconds.
   After:  22-second test run in CI. Local re-run: <1 second (only changed files).
   Why it's faster:
     Vitest reuses Vite's transform pipeline — no separate Babel, no separate resolver.
     TypeScript paths, env variables, and aliases: just work. Zero config duplication.
     Worker threads enabled by default: each file runs in its own thread in parallel.
   Risk: jest.mock() → vi.mock() (300 files). Codemod automated 90%.
     Timer mocking API differs (vi.useFakeTimers). Manual fix: 12 files.

3. ESLINT + PRETTIER → BIOME
   Before: 8.2s lint + format (plugins, separate Prettier process, resolver overhead).
   After:  0.4s lint + format (20× faster).
   Why it's faster: Biome is a single Rust binary. No plugin resolution.
     Processes files in parallel natively. One pass for both lint AND format.
   Risk: jsx-a11y and import-order have no Biome equivalent.
     We kept ESLint for those two specific plugins. Biome handles everything else.
     Net: 90% of lint/format moved to Biome; 10% remains in ESLint (a11y + imports).

4. TYPESCRIPT 4.x LENIENT → 5.x STRICT
   Before: strict: false, 234 'any' usages.
   After:  strict: true, 0 'any' (enforced by lint rule).
   What strict enables:
     noImplicitAny: "const x = []" is an error — you must type it.
     strictNullChecks: "maybeNull.property" is an error — you must check for null.
     exactOptionalPropertyTypes: { a?: number } means a: number | undefined.
       You cannot assign undefined to it as if it were optional. This is correct TypeScript.
   Migration: 6 weeks, gradual, file by file. Started with utility files.
     800 errors on the first run. Fixed in batches, module by module.
     The runtime bugs these catches: nullable access, implicit any in API responses.

5. REACT 17 → 18
   Before: ReactDOM.render(), manual batching in async code.
   After:  createRoot(), auto-batching, startTransition(), useId().
   Key change — auto-batching:
     In React 17: state updates inside setTimeout fired two separate renders.
     In React 18: state updates inside setTimeout are batched — one render.
     For our pipeline view: filtering + sorting + updating count = 3 updates.
     React 17: 3 renders. React 18: 1 render. Visually: no intermediate flicker.
   startTransition():
     Marks search/filter state updates as non-urgent.
     React can interrupt them to render urgent updates (user typing).
     Before: fast typing in a search box could lag behind if re-render was expensive.
     After: typing always feels instant; search result update can be slightly deferred.
```

---

## 3️⃣ CI Strategy — Stability + Minimal CI Run Time

### Why CI time is an engineering quality metric

```
CI RUN TIME IS A DEVELOPER EXPERIENCE METRIC.
  If CI takes 20 minutes, engineers either:
  (a) Push and wait 20 minutes for feedback — slow iteration
  (b) Push without checking — CI catches bugs after the fact, not during review
  (c) Merge without CI — happens when CI is perceived as too slow to wait for

  Each of these outcomes is bad. Fast CI enables fast iteration AND reliable feedback.
  
  TARGET: CI feedback in under 10 minutes for the critical path.
  (Critical path = the slowest parallel lane — not the sum of all lanes)

THE BEFORE STATE:
  Sequential pipeline: each step waits for the previous to finish.
  Lint: 2.1m → TS check: 3.4m → Unit tests: 7.8m → Integration: 4.2m → E2E: 14.0m → Build: 3.6m
  Total: 35.1 minutes.
  Engineers would push, go to lunch, and come back to check results.
  This is not fast iteration. It is waiting.

THE AFTER STATE:
  Parallel pipeline. Critical path: ~4.8 minutes.
  
  Row 1: Biome lint (0.2m) + TS check (1.1m) — fastest, always on critical path
  Row 2: Unit tests × 4 shards (1.4m each) — parallel workers
  Row 3: Integration tests × 2 shards (1.6m each)
  Row 4: E2E tests × 3 shards (2.9m each) — this is the new critical path
  Row 5: Build (0.4m with cache hit, 2m cold)
  
  The critical path is determined by the slowest parallel lane: E2E × 3 = 2.9m.
  Total wall clock: ~4.8 minutes.
```

### The six optimisations — know each one

```
1. TEST SHARDING
   What: split test files across N parallel workers.
     Unit tests: 4 shards. Each shard runs 25% of tests.
     E2E: 3 shards. Each shard runs 33% of tests.
   How: `npx vitest run --shard=2/4` (Vitest), `npx playwright test --shard=2/3` (Playwright).
   Impact: Unit 7.8m → 1.4m (critical path). E2E 14m → 2.9m.
   Key consideration: E2E test isolation. Each shard needs its own DB and auth session.
     Shared state between shards causes flaky tests. Isolated DB per shard eliminates this.

2. SELECTIVE TEST RUNS (nx affected)
   What: on a PR, only run tests for modules affected by the changed files.
   How: `nx affected --target=test --base=origin/main` analyses the dependency graph.
     If PR changes `src/utils/format.ts`, only run tests that import from `format.ts`.
   Impact: most feature PRs touch 3-5 files → run ~20% of the test suite.
   Saves 80% of CI time on the most common PR type.
   IMPORTANT: Trunk branch CI (main/master) always runs the full test suite.
   Selective runs are a PR-time optimisation only.

3. VITEST WORKER THREADS
   What: Vitest processes test files in parallel worker threads by default.
   How: no configuration required. Enabled automatically.
   Impact: 2× throughput on the same CI runner vs Jest's default single-thread mode.
   Why Jest was single-threaded: Jest-worker required manual configuration.
   Why Vitest is parallel: it was designed from the start for native ES module + worker thread use.

4. TURBOREPO / NX CACHING
   What: build and lint outputs are content-hashed and cached.
   If the input files have not changed since the last CI run, the output is replayed.
   Impact: cache hit = 0s (instant). Cache miss = normal execution.
   Cache hit rate: 68% on feature branch CI.
   What is cached: TypeScript build output, build artifacts, lint results.
   What is NOT cached: tests (tests should always run — they check behaviour, not artifacts).

5. E2E PARALLELISATION WITH ISOLATION
   What: 3 Playwright shards, each with an isolated test database and auth session.
   Before: E2E tests shared state. Test B depended on state created by Test A.
     This caused: flakiness (if Test A failed, Test B also failed for a different reason)
     and forced sequential execution (Test A must finish before Test B can start).
   After: Each shard has its own DB. Tests within a shard still run sequentially,
     but shards run in parallel. Zero shared state between shards.
   Impact: 14m → 2.9m, AND flakiness rate dropped significantly.
   The insight: parallelisation and flakiness reduction have the same root cause fix.

6. BIOME IN CI
   What: replace ESLint + Prettier with Biome for lint and format checks.
   Impact: 8.2s → 0.2s. Lint is no longer on the critical path.
   Before: lint ran sequentially after install, before tests.
   After: lint runs in parallel with the TS type check (both take < 1.5m).
   The CI runner is not blocked by lint — it is fully parallelised from minute 0.
```

---

## 4️⃣ Engineering Culture — Radical Transparency + Learning Fast

### What "radical transparency" means in practice

```
"RADICAL TRANSPARENCY" IS NOT:
  - "We have open Slack channels"
  - "We do all-hands meetings"
  - "I am honest with my team"

"RADICAL TRANSPARENCY" IS:
  Information that usually stays hidden (metrics, decisions, incidents)
  is made visible — to the whole team, including people who did not ask for it.

THREE SPECIFIC IMPLEMENTATIONS:

1. PUBLIC DORA METRICS DASHBOARD:
   Deploy frequency, change failure rate, MTTR, and lead time for changes.
   Visible to everyone — including non-engineers, including leadership.
   Why this matters: "we're doing great" is a subjective claim.
   "Deploy frequency is 8×/week, failure rate is 1.8%, MTTR is 12 minutes" is a fact.
   When a metric dips, anyone can see it — not just the engineering manager.
   This creates accountability that does not rely on reporting chains.

2. PUBLIC RFC PROCESS:
   Every significant technical decision is documented as an RFC (Request for Comments)
   before implementation begins.
   Who can comment: anyone (including PMs, designers, other engineers).
   When the decision is made: documented in the RFC, with reasoning.
   This is radical transparency because: decisions are not made in Slack DMs
   or hallway conversations. They are made in writing, in public, with reasoning.
   An engineer who joins 6 months later can read RFC-089 and understand
   why we use Vitest instead of Jest. The institutional knowledge is preserved.

3. BLAMELESS POSTMORTEMS:
   Every P1/P2 incident: postmortem published within 48 hours.
   Format: timeline, root cause (5 whys), action items with owners.
   Visible to: the whole engineering team (and sometimes beyond).
   Blameless means: "what in our system allowed this to happen?"
   not "who caused this?"
   Why publish to the whole team: incidents are learning opportunities for everyone,
   not just the team that was involved. A shared postmortem culture means every
   engineer learns from every incident.
```

### "Learning fast" — the mechanisms

```
LEARNING FAST IS A SYSTEM, NOT A VALUE.
  "We value learning" is a value. Values do not make teams learn faster.
  Systems do.

MECHANISMS:
  
  1. WEEKLY ASYNC DEMOS (Loom format):
     Each engineer records a 3-5 minute Loom: what they shipped, a live demo,
     and one thing they learned. Published to a shared Notion page.
     Why async: a global team cannot all attend a synchronous demo.
     Async means: record once, watch at your local timezone, comment when convenient.
     Learning transfer: if I discover a useful pattern in my work,
     the async demo is how the whole team learns it — within the same week.

  2. 20% TIME (one day per week):
     Dedicated to: learning (courses, books, conferences), experimentation
     (proof-of-concepts for potential improvements), or paying tech debt
     (the CX ticket backlog, the flaky test, the confusing code).
     The tech modernisation initiatives (Vite, Vitest, Biome) all started
     as 20% time experiments before they became funded projects.
     This is the mechanism: 20% time is the exploration budget.
     The exploration budget is what generates the ideas that become
     the modernisation backlog.

  3. RFC CULTURE (cross-team knowledge transfer):
     RFCs are written for decisions, not just for migrations.
     "Why did we choose React Query over Redux?" — that is in an RFC.
     "Why is the CI pipeline structured this way?" — RFC.
     New engineers join and the institutional knowledge is in writing.
     They do not need to find the person who made the decision 18 months ago.

  4. STRUCTURED POSTMORTEM DISTRIBUTION:
     Postmortems are not just for the incident responders.
     Every postmortem is shared to the engineering all-hands and summarised
     in the weekly digest. The question asked in every postmortem: 
     "Is there a similar pattern anywhere else in our system?"
     This propagates the learning from one incident across the whole system.
```

### Follow-up Q&A

**"What does 'fostering a culture of radical transparency' look like day-to-day?"**
> "It is mostly about information defaults. The default in most organisations is: information stays with the person who has it until someone asks. Radical transparency inverts the default: information is shared proactively unless there is a specific reason not to. In practice: when I make a technical decision, I write a short RFC instead of just implementing it. When something goes wrong, I write a postmortem and share it with the whole team — not just the people involved. When the DORA metrics are bad, I put them in the all-hands presentation, not in an email to my manager. The discomfort of making bad news visible is short-term. The benefit — a team that can see reality clearly and course-correct quickly — is long-term."

**"How do you balance 20% learning time with shipping velocity?"**
> "20% learning time increases shipping velocity — it does not reduce it. The teams that skip learning time consistently are the ones that make the same mistake twice, or that stay on a slow build tool for three years because 'we don't have time to migrate.' The tech modernisation work — Vite, Vitest, Biome — saved far more time than the 20% that was spent on it. Vite's 45s→1.8s cold start saves every engineer 10-20 minutes per day. Across a 10-person team, that is 100-200 minutes saved daily, indefinitely. The 5 days spent migrating paid back within the first week. The ROI on 20% time is usually very high — the problem is that the cost is visible (time spent not shipping features) and the benefit is diffuse (faster for everyone, forever)."

---

## 🔗 Unified Narrative

> "My Sr. Staff focus has three layers that reinforce each other.
>
> On Agents: I led the planning — not just the building. I decomposed the product into shippable milestones, identified the SSE streaming layer as the key technical risk, prototyped it before committing to a timeline, and established an API contract that let the frontend team build in parallel with the backend. The useAgentStream() hook I built is now used by four agent UIs — the abstraction worked.
>
> On tech modernisation: I built a prioritisation framework (pain × impact × risk / days) so the team was not just chasing 'shiny new tools' but solving real engineer pain in priority order. Biome first (easy win, highest priority score), then Vite and Vitest (highest pain relief), then TypeScript strict (most important but longest). The result: a developer experience that is measurably better — sub-2-second cold starts, 22-second test runs, sub-1-second lint.
>
> On CI: 35 minutes sequential to 4.8 minutes parallel. The mechanism: test sharding, selective runs on PRs, Turborepo caching, and E2E isolation. Engineers get feedback in under 5 minutes — which changes the iteration dynamic. You can push and check back in 5 minutes, not after lunch.
>
> Culture is the foundation that makes all of this possible. Radical transparency means the DORA metrics are visible to everyone — no hiding behind 'we're doing well.' RFCs mean technical decisions are made in writing, not in hallway conversations. 20% learning time means the Vite prototype got built on a Friday before it became a funded project. The culture creates the conditions; the conditions enable the outcomes."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I led the Agents project" | "I led the PLANNING: milestone decomposition, risk identification (SSE prototype first), API contract before BE was ready, useAgentStream() as a shared abstraction" |
| "I migrated to Vite" | "I used a prioritisation framework: pain × impact × risk / days. Biome scored 30 (highest), Vite/Vitest scored 20, TypeScript strict scored 0.7 (last). We executed in that order." |
| "I made CI faster" | "35m sequential → 4.8m parallel. Six specific optimisations: sharding (unit ×4, E2E ×3), nx affected on PRs (80% less on most runs), Turborepo cache (68% hit rate), E2E isolation (flakiness elimination too)" |
| "We have a good culture" | "Radical transparency: DORA metrics public to all. RFCs for every significant decision. Blameless postmortems within 48h. 20% time generated the Vite/Vitest/Biome prototypes that became funded projects." |
| Skip the STAR on Agents | "SSE streaming UI: why SSE (not WebSocket, not polling). Step state machine: pending/running/done/error. Agent error ≠ run failure — step-level errors shown inline, run continues." |

---

## 📊 Quick Facts

```
Role: Sr. Staff Frontend Engineer

Agents:
  Architecture:  SSE (EventSource) + step state machine (think/tool/observe/respond)
  Planning:      5 milestones (M1-M5), SSE prototype first (highest risk)
  Abstraction:   useAgentStream() hook — used by 4 agent UIs
  Key insight:   Step error ≠ run failure. Error state is inline, run can continue.

Tech Modernisation:
  Framework:     (pain × impact × risk) / days — prioritise by ROI, not novelty
  Webpack→Vite:  45s → 1.8s cold start (−96%)
  Jest→Vitest:   120s → 22s test run (−82%)
  ESLint+Prettier→Biome: 8.2s → 0.4s (−95%)
  TS lenient→strict: 800 errors → 0, 234 'any' → 0
  React 17→18:   auto-batching, startTransition(), −2 unnecessary renders avg

CI Strategy:
  Before:  35.1m sequential
  After:   4.8m parallel (critical path)
  Methods: unit sharding ×4, E2E sharding ×3 (isolated DB), nx affected (PRs),
           Turborepo cache (68% hit rate), Biome in parallel with TS check

Culture:
  Radical transparency: DORA metrics public, RFC for every significant decision
  Blameless postmortems: published within 48h, shared to all-hands
  Async weekly demos: Loom, 3-5min, shipped to shared Notion page
  20% time: source of Vite/Vitest/Biome prototypes before they became funded projects
```

---

*Document last updated: June 2026 · Sr. Staff Frontend Engineer interview preparation*
