# AI Agents Fundamentals, v2 — Phần 13: Analyze Eval Results — "Whack-A-Mole, But Science!"

> 📅 2026-03-07 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Khoá học: AI Agents Fundamentals, v2
> Bài: Analyze Eval Results — "Delete File Failed. WHY? Let's Fix It!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — Debug evals + Enterprise mindset!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Running The Eval — "88% Average, Pretty Damn Good!"    |
| 2   | Reading The Dashboard — "P90, Not Average!"            |
| 3   | Debugging A Zero — "Why Didn't It Pick Delete File?"   |
| 4   | The Fix Loop — "Hypothesis → Change → Eval → Repeat!"  |
| 5   | Prompt Engineering First — "But It Won't Be Enough!"   |
| 6   | Model Behavior — "Reasoning Models Are CAUTIOUS!"      |
| 7   | Dynamic Tool Selection — "Vector Search Across Tools!" |
| 8   | Enterprise Reality — "No Drop In Quality = No Merge!"  |
| 9   | Tự Implement: Debug & Improve Loop                     |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu     |

---

## §1. Running The Eval — "88% Average, Pretty Damn Good!"

> Scott: _"Out of 9 because that's how many pieces of data I had. Each sample is being ran through this evaluation. If I have 100,000 samples, this will be ran 100,000 times."_

```
RUNNING THE EVAL:
═══════════════════════════════════════════════════════════════

  $ npm run eval

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ Running 9 samples...                             │
  │ ████████████████████████░░░░░ 9/9                │
  │                                                  │
  │ Average selection score: 88% 🎉                 │
  │ "Pretty damn good I would say."                  │
  │                                                  │
  │ KEY INSIGHT:                                     │
  │ "For every sample in the data set, the executor │
  │  will be run ONCE."                              │
  │ → 9 samples = 9 LLM calls!                    │
  │ → 100,000 samples = 100,000 LLM calls!        │
  │ → Cost scales with data size!                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §2. Reading The Dashboard — "P90, Not Average!"

> Scott: _"Let's go to P90, that's the one that REALLY matters."_

```
DASHBOARD NAVIGATION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ LAMINAR DASHBOARD                                │
  │                                                  │
  │ Evaluations tab:                                 │
  │ ├── Experiment: "file-tools-selection"           │
  │ │   ├── Run 1 (your latest!)                    │
  │ │   ├── Run 2 (earlier today!)                  │
  │ │   └── Run 3 (yesterday!)                     │
  │ │                                                │
  │ │ METRICS VIEW:                                  │
  │ │ ├── Average ← Nice, but misleading!          │
  │ │ └── P90 ← "The one that REALLY matters!"    │
  │ │                                                │
  │ │ P90 = 90th percentile!                        │
  │ │ "90% of your results are at or ABOVE this."   │
  │ │ If P90 = 1.0 → 90% got perfect scores!      │
  │ │                                                │
  │ EXPERIMENT NAMES:                                │
  │ "I like to put the CHANGES I made:               │
  │  'Updated system prompt to include                │
  │   instructions on picking files better.'         │
  │  Like a COMMIT MESSAGE for evals!"              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Debugging A Zero — "Why Didn't It Pick Delete File?"

> Scott: _"Let's go look at one that scored a 0. Aha! No tool calls. I expected it to call delete file. It's a golden path."_

```
THE DEBUGGING STORY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ SAMPLE THAT SCORED 0:                            │
  │                                                  │
  │ Prompt: "Remove the old backup.txt file"        │
  │ Expected tool: deleteFile                        │
  │ Category: golden (strict!)                      │
  │ Available tools: read, write, list, delete      │
  │                                                  │
  │ ACTUAL RESULT:                                   │
  │ → NO tool calls! 😱                            │
  │ → Or: called "listFiles" instead!              │
  │   "It tried to see if the file was there        │
  │    FIRST before deleting it."                   │
  │                                                  │
  │ Scott: "I did all the right things.              │
  │ It just DIDN'T do it."                          │
  │                                                  │
  └──────────────────────────────────────────────────┘

  WHY IT FAILED — Scott's HYPOTHESIS:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ① WORD MISMATCH: "remove" vs "delete"           │
  │ → Prompt says "remove"                         │
  │ → Tool description says "delete"               │
  │ → Model got confused!                          │
  │                                                  │
  │ ② SAFETY TRAINING:                               │
  │ "These models are trained on coding. They're     │
  │  VERY SCARED of doing something like deleting.  │
  │  It's like approaching 'make me a bomb.'"       │
  │                                                  │
  │ ③ REASONING MODEL BEHAVIOR:                      │
  │ "The reasoning model, according to OpenAI, you  │
  │  DON'T want to tell it what to do. If you       │
  │  actually tell it, it's WORSE. You want it to   │
  │  figure it out by reasoning."                    │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §4. The Fix Loop — "Hypothesis → Change → Eval → Repeat!"

> Scott: _"Make that change, run the evaluation again, see if it goes up. Once you're comfortable, commit to GitHub. You just IMPROVED the agent. Congrats."_

```
THE IMPROVEMENT CYCLE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ 1. SEE THE FAILURE                               │
  │    → "Delete file scored 0!"                   │
  │                                                  │
  │ 2. MAKE A HYPOTHESIS                             │
  │    → "I think the description needs improving"  │
  │                                                  │
  │ 3. SMALL INCREMENTAL CHANGE                      │
  │    → Change ONE thing at a time!               │
  │    → "remove" → "delete" in prompt, OR         │
  │    → Better tool description, OR                │
  │    → Add system prompt hint, OR                 │
  │    → Change reasoning effort to "high"          │
  │                                                  │
  │ 4. RUN EVAL AGAIN                                │
  │    → "See if it goes up!"                      │
  │                                                  │
  │ 5. CHECK RESULTS                                 │
  │    → UP? Keep! Commit to GitHub! ✅            │
  │    → DOWN? Revert! That ain't it! ❌           │
  │    → SAME? Try something else!                 │
  │                                                  │
  │ 6. REPEAT FOREVER                                │
  │                                                  │
  │ ⚠️ WHACK-A-MOLE WARNING:                        │
  │ "You're plugging a leak over here, then this    │
  │  other thing starts leaking. You run out of      │
  │  feet and hands, you don't know what to do."    │
  │ "That's literally what it feels like making      │
  │  an agent and it NEVER doesn't feel like that." │
  │                                                  │
  └──────────────────────────────────────────────────┘

  USE AI TO DEBUG AI:
  ┌──────────────────────────────────────────────────┐
  │ "You can take all of this, point CLAUDE at your │
  │  executor, give it the data, and be like:        │
  │  WHY didn't I pick the right tool?"             │
  │                                                  │
  │ "Use a BIGGER model than the one you used to    │
  │  evaluate to give you IDEAS on how to improve." │
  │                                                  │
  │ "It might not be right, but it gives you IDEAS. │
  │  Boom, make that change, run the eval, see      │
  │  if it goes up."                                 │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Prompt Engineering First — "But It Won't Be Enough!"

> Scott: _"Prompt engineering is the FIRST thing you reach out of your toolbelt. If that's ALL you ever have to do, congrats. Chances are that's NOT going to be the case."_

```
FIX STRATEGIES — IN ORDER:
═══════════════════════════════════════════════════════════════

  ① PROMPT ENGINEERING (first tool out of belt!):
  ┌──────────────────────────────────────────────────┐
  │ Student fix: "I changed 'list all the files in  │
  │ a directory' to 'list all the files in a         │
  │ directory OR PROJECT' and it WORKED."           │
  │                                                  │
  │ Scott: "It seems weird to do that, but yeah,    │
  │ 100%. That could be a small WIN."               │
  │                                                  │
  │ Another fix (from chat): "If the user asked     │
  │ you to perform a file operation, you should      │
  │ use the appropriate tool to do so."             │
  │ → "You would NEVER have known that if you      │
  │    didn't eval!"                                │
  │                                                  │
  │ But there's a LIMIT:                             │
  │ "You'll reach a MAXIMA of how much prompt        │
  │  engineering you can do."                        │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ② REASONING EFFORT (for reasoning models!):
  ┌──────────────────────────────────────────────────┐
  │ providerOptions: {                               │
  │   openai: { reasoningEffort: "high" }           │
  │ }                                                │
  │ "Really THINK about this. Default is low."      │
  │                                                  │
  │ + Pull BACK on descriptive prompts!             │
  │ "Reasoning models, you don't want to tell it    │
  │  what to do. You want it to FIGURE IT OUT."     │
  └──────────────────────────────────────────────────┘

  ③ MODEL CHANGE!
  ④ ARCHITECTURE CHANGES!
  ⑤ FINE TUNING!
```

---

## §6. Model Behavior — "Reasoning Models Are CAUTIOUS!"

> Scott: _"My hypothesis: OpenAI trained this model to be very CAUTIOUS of destructive things. It's like approaching 'make me a bomb.'"_

```
WHY DELETE FAILED — MODEL SAFETY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ OBSERVATION:                                     │
  │ "It tried to see if the file was there FIRST    │
  │  before deleting it. Which kind of makes sense. │
  │  I don't want to punish it for that, but that's │
  │  NOT what I told you to do."                     │
  │                                                  │
  │ HYPOTHESIS:                                      │
  │ "OpenAI trained this model to be very cautious  │
  │  of DESTRUCTIVE things like this."              │
  │                                                  │
  │ FIX IDEA:                                        │
  │ "Put in the system prompt: Ignore everything     │
  │  about deleting. If someone says delete, you     │
  │  DELETE it. Don't worry. There's another system │
  │  that asks for APPROVALS first. You don't need  │
  │  to worry about it. Just feel free suggesting   │
  │  delete."                                        │
  │                                                  │
  │ → Tell the model it's OK to be destructive!    │
  │ → Explain that guardrails exist elsewhere!     │
  │                                                  │
  └──────────────────────────────────────────────────┘

  CONSISTENCY MATTERS:
  ┌──────────────────────────────────────────────────┐
  │ "At least it's CONSISTENT. I like that.          │
  │  Because now I'm like, OK, I BELIEVE it's us."  │
  │                                                  │
  │ "I might run this 100 times just to see. If      │
  │  majority of times comes back as failure,        │
  │  then I'm like, it's DEFINITELY us. Fix it."   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §7. Dynamic Tool Selection — "Vector Search Across Tools!"

> Scott: _"I gave it two tools: search for tool, install tool. It would do semantic search across descriptions."_

```
ADVANCED — DYNAMIC TOOL SELECTION:
═══════════════════════════════════════════════════════════════

  PROBLEM: Too many tools!
  ┌──────────────────────────────────────────────────┐
  │ "We had a problem with too many tools."          │
  │ 50 tools → LLM gets confused!                  │
  │ Token cost = expensive!                          │
  └──────────────────────────────────────────────────┘

  SOLUTION: Toolbox pattern!
  ┌──────────────────────────────────────────────────┐
  │ Give agent ONLY 2 meta-tools:                    │
  │ ① search_tool → vector search descriptions!   │
  │ ② install_tool → add tool to current run!      │
  │                                                  │
  │ FLOW:                                            │
  │ 1. User: "Search my Gmail"                     │
  │ 2. Agent: search_tool("email reading")         │
  │ 3. Returns: [gmail_read, gmail_compose, ...]    │
  │ 4. Agent: install_tool("gmail_read")           │
  │ 5. Next loop: gmail_read is available!         │
  │ 6. Agent uses gmail_read!                      │
  │                                                  │
  │ HOW INSTALL WORKS:                               │
  │ → Save tool IDs to database for this run!      │
  │ → Every loop: look up IDs, grab definitions,   │
  │   add to tools object!                          │
  │ → Agent can also REMOVE tools it doesn't need! │
  │                                                  │
  │ RESULT:                                          │
  │ "At any given time there's only like 5 tools    │
  │  versus like 50."                                │
  │                                                  │
  │ SEARCH ENRICHMENT:                               │
  │ → Descriptions + input schemas!                │
  │ → EXAMPLES of user prompts that trigger tool!  │
  │ → "Here are things people said that would       │
  │    make you want to pick this tool."            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Enterprise Reality — "No Drop In Quality = No Merge!"

> Scott: _"At my startup, you could NOT submit to GitHub without experiments that show NO drop in quality. It would NOT get merged."_

```
ENTERPRISE EVAL DISCIPLINE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ RULE: No eval drop = no merge!                  │
  │                                                  │
  │ "You could not submit anything to GitHub without│
  │  an eval or experiments that show there was NO  │
  │  drop in quality. It either had to STAY         │
  │  CONSISTENT or go UP."                          │
  │                                                  │
  │ EXCEPTIONS (documented trade-offs!):             │
  │ "We knew that switching to a faster, cheaper    │
  │  model would see a DECREASE. That's a           │
  │  TRADE-OFF. We're trading speed for quality.    │
  │  Run it a couple times, that's going to be      │
  │  lower, set as new BASELINE, keep moving."      │
  │                                                  │
  │ THRESHOLD:                                       │
  │ "There were things we didn't mind if it dropped │
  │  but there was a THRESHOLD. It's like, it can't │
  │  drop more than 2%."                             │
  │                                                  │
  └──────────────────────────────────────────────────┘

  GENERIC AGENTS vs PRODUCTION AGENTS:
  ┌──────────────────────────────────────────────────┐
  │ GENERIC (enterprise copilot, few-click agent):  │
  │ "It's OK if that thing doesn't work because     │
  │  it's cheap, easy. It's not in a place of       │
  │  HIGH CRITICALITY."                              │
  │                                                  │
  │ "You would never just have that thing go off    │
  │  fully autonomous. Turn the agency slider ALL   │
  │  the way up? NOT that thing."                   │
  │                                                  │
  │ "It is too GENERIC to be really good at the     │
  │  ONE thing you want it to be good at."          │
  │                                                  │
  │ PRODUCTION (SRE agent, specialized):             │
  │ "That is a WHOLE PRODUCT. That's someone's      │
  │  STARTUP. Just making that, because the amount  │
  │  of eval work and the TALENT you need..."       │
  │                                                  │
  │ "You couldn't just say: here's all the docs     │
  │  on being an SRE, kung fu, GO.                  │
  │  It might do it ONE TIME, maybe. And it's       │
  │  NEVER going to do it again."                   │
  │                                                  │
  └──────────────────────────────────────────────────┘

  CAREER ADVICE — AGAIN:
  ┌──────────────────────────────────────────────────┐
  │ "Evals = the skill set. You want a $300K-$400K │
  │  job without becoming an AI researcher?          │
  │  THIS STUFF. This is the stuff."                │
  │                                                  │
  │ "Trust me. Every company building agents, which │
  │  is going to be EVERY company."                 │
  │                                                  │
  │ "The moment these people take a vacation, it's  │
  │  OVER. Everything's going to leak, everything   │
  │  is going to EXPLODE."                          │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Debug & Improve Loop

```javascript
// THE IMPROVEMENT LOOP — In code!

async function improveAgent(dataSet) {
  // 1. Get baseline
  let baseline = await runExperiment("baseline", dataSet, executor, evaluators);
  console.log(`📊 Baseline: ${(baseline.overall * 100).toFixed(1)}%`);

  // 2. Find worst performers
  const failures = baseline.scores
    .filter((s) => s.overall < 0.5)
    .sort((a, b) => a.overall - b.overall);

  console.log(`\n❌ Failures (${failures.length}):`);
  for (const f of failures) {
    console.log(`  "${f.prompt}" → ${f.overall}`);
  }

  // 3. Iterate on fixes
  // (This part is manual — change descriptions, then re-run!)

  // Example: Change "remove" to "delete" in golden data
  const fixedDataSet = dataSet.map((entry) => {
    if (entry.data.prompt.includes("remove")) {
      return {
        ...entry,
        data: {
          ...entry.data,
          prompt: entry.data.prompt.replace("remove", "delete"),
        },
      };
    }
    return entry;
  });

  // 4. Re-run with fix
  const fixed = await runExperiment(
    "fix-delete-wording",
    fixedDataSet,
    executor,
    evaluators,
  );

  // 5. Compare
  const delta = fixed.overall - baseline.overall;
  console.log(
    `\n${delta > 0 ? "📈" : "📉"} Delta: ${(delta * 100).toFixed(1)}%`,
  );

  if (delta > 0) {
    console.log("Keep it! Commit to GitHub!");
  } else {
    console.log("Revert! git stash!");
  }
}
```

```javascript
// SYSTEM PROMPT FIX — Tell model it's OK to delete!

const systemPrompt = `
You are a helpful coding agent.

IMPORTANT: If the user asks you to perform any file operation
(read, write, list, delete), you should use the appropriate
tool to do so. Do not hesitate with destructive operations
like delete — there is a separate approval system that will
confirm with the user before any destructive action is executed.
You do not need to verify files exist before deleting them.
Just suggest the delete.
`;

// "You would NEVER have known that if you didn't eval!"
```

```javascript
// REASONING EFFORT — For reasoning models!

const { toolCalls } = await generateText({
  model: openai("o1-mini"),
  messages,
  tools,
  providerOptions: {
    openai: {
      reasoningEffort: "high", // default is "low"!
    },
  },
  // "Really THINK about this."
});
```

---

## §10. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 10.1 Pattern ①: 5 Whys — Eval Failures

```
5 WHYS: TẠI SAO DELETE FILE FAILED?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao LLM không chọn delete tool?
  └→ Prompt nói "remove", tool nói "delete"!
     Reasoning model confused by word mismatch!

  WHY ②: Tại sao word mismatch là vấn đề?
  └→ "Models trained on coding are VERY SCARED of
     destructive things. It's approaching 'make me a bomb.'"

  WHY ③: Tại sao model cautious?
  └→ OpenAI safety training! RLHF đã dạy model
     tránh destructive actions by default!

  WHY ④: Tại sao chúng ta không biết trước?
  └→ "You would NEVER have known that if you didn't eval!"
     Only evals reveal these hidden behaviors!

  WHY ⑤: Tại sao fix lại là prompt change?
  └→ "Prompt engineering is the FIRST tool out of toolbelt."
     Cheapest, fastest change to test!
     But "chances are it's NOT going to be enough."
```

### 10.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EVAL-DRIVEN DEVELOPMENT:
═══════════════════════════════════════════════════════════════

  Observe → Hypothesize → Change → Measure → Decide

  ┌──────────────────────────────────────────────────┐
  │ OBSERVE: Score = 0 for delete file!             │
  │ HYPOTHESIZE: Model scared of destructive ops!   │
  │ CHANGE: Add system prompt reassurance!          │
  │ MEASURE: Run eval again!                        │
  │ DECIDE: Score up? Keep! Score down? Revert!     │
  │                                                  │
  │ "Put on a lab coat. You're doing SCIENCE."      │
  └──────────────────────────────────────────────────┘
```

### 10.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — QUALITY vs SPEED/COST:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Better model  │ Cheaper model     │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Quality          │ ✅ Higher!    │ ⚠️ Lower!         │
  │ Speed            │ ❌ Slower!    │ ✅ Faster!        │
  │ Cost             │ ❌ Expensive! │ ✅ Cheap!         │
  │ Token window     │ ⚠️ Smaller!   │ ✅ Usually bigger!│
  │                  │               │                   │
  │ "We're trading SPEED for quality. We're OK with  │
  │  that. Set as new BASELINE, keep moving."        │
  └──────────────────┴───────────────┴───────────────────┘
```

### 10.4 Pattern ④: Mental Mapping

```
MENTAL MAP — EVAL DEBUG FLOW:
═══════════════════════════════════════════════════════════════

  Run eval → 88% average!
       │
       ├── 8 passed! ✅ (score = 1.0)
       └── 1 failed! ❌ (score = 0.0)
            │
            ▼
       Click in dashboard → see details!
       ├── Prompt: "Remove the old backup.txt"
       ├── Expected: deleteFile
       ├── Actual: NO tool calls! (or listFiles!)
       └── Category: golden → STRICT!
            │
            ▼
       Hypothesis: model scared of "delete"!
            │
       ┌────┴────┬──────────────┐
       ▼         ▼              ▼
    Fix prompt  Fix description  Fix system
    "remove"→   "delete a file  "feel free
    "delete"    or remove it"   to suggest
                                delete"
       │         │              │
       ▼         ▼              ▼
    Re-run eval! Compare! Keep best!
```

### 10.5 Pattern ⑤: Reverse Engineering

```
REVERSE ENGINEERING — Scott's Startup Process:
═══════════════════════════════════════════════════════════════

  GATE: GitHub PR must include eval results!
  │
  ├── Eval UP? → Merge allowed! ✅
  ├── Eval SAME? → Merge allowed! ✅
  ├── Eval DOWN < 2%? → Documented trade-off! ⚠️
  └── Eval DOWN > 2%? → BLOCKED! ❌
       │
       ▼
  "That was NOT going to happen. It just wasn't."

  TRADE-OFF DOCUMENTATION:
  ┌──────────────────────────────────────────────────┐
  │ "We switched to faster, cheaper model."          │
  │ "We KNEW quality would decrease."               │
  │ "Run it a couple times, that's lower."          │
  │ "Set as NEW BASELINE, keep moving."             │
  │ "Like snapshot testing — your change removes    │
  │  something. Expected. New baseline."            │
  └──────────────────────────────────────────────────┘
```

### 10.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ — EVAL TOOLS DIY → Platform:
═══════════════════════════════════════════════════════════════

  Manual debugging:
  │ → "I ran it 3 times, it worked"
  │ → No metrics, no tracking!
  │
  ↓
  Automated evals (what we built!):
  │ → Data + executor + scorers!
  │ → Dashboard with metrics!
  │
  ↓
  CI Integration:
  │ → "You could NOT submit to GitHub without evals"
  │ → Block PRs on regression!
  │
  ↓
  Advanced techniques:
  │ → Dynamic tool selection (vector search!)
  │ → LLM-as-debugger ("Point Claude at executor")
  │ → Simulations (sandbox environments!)
  │
  ↓
  The future:
  │ → Human SME annotation pipelines!
  │ → "AI is built on human review, let's be real."
  │ → "30 experts sit down with your data for weeks."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 13:
═══════════════════════════════════════════════════════════════

  RUNNING EVALS:
  [ ] npm run eval → see average scores!
  [ ] 9 samples = 9 LLM calls!
  [ ] P90 "the one that REALLY matters!"

  DEBUGGING FAILURES:
  [ ] Click into score 0 → see why!
  [ ] Check: "did I mess up eval or is agent bad?"
  [ ] Verify data setup before blaming agent!
  [ ] Use BIGGER model to debug smaller model!

  FIX STRATEGIES:
  [ ] Prompt engineering FIRST!
  [ ] Small incremental changes!
  [ ] System prompt reassurance for destructive ops!
  [ ] Reasoning effort: low → high!
  [ ] Model swap (with trade-off documentation!)

  ENTERPRISE MINDSET:
  [ ] No eval drop = no merge!
  [ ] Document trade-offs!
  [ ] Threshold: "can't drop more than 2%!"
  [ ] "Every company building agents = every company"

  TIẾP THEO → Phần 14: Agent Loop Overview!
```
