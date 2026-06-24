# 🎯 Interview Guide — Sales Workflow Platform
## Workflow Builder · Sequence V2 · AI Copilot · Test Coverage · UX Quality

---

## 🔑 Context: What This Product Does

```
PRODUCT: B2B Sales Engagement Platform (think: Apollo.io, Outreach, Salesloft)

PURPOSE:
  Sales reps create "workflows" (sequences) — automated outreach cadences
  that reach prospects across multiple channels: email, LinkedIn, phone, tasks.
  
  Example workflow:
  Day 1: Auto-email (personalised intro)
  Day 3: LinkedIn connection request
  Day 5: Manual email (rep reviews before sending)
  Day 7: Task: research account before call
  Day 9: Call attempt
  Day 12: Break-up email

KEY CONCEPTS:
  Workflow:   A named sequence of steps with timing, assigned to prospects.
  Enrollment: A prospect entered into a workflow.
  Step:       One action in the workflow (email, LinkedIn, task, call, condition).
  Credits:    Compute/send budget. Auto-emails cost credits. Over-sending = reputation risk.
  Signals:    Intent data (pricing page visit, G2 profile view, 3+ email opens) that
              indicate a prospect's buying readiness.
  AI-SDR:     AI-powered sales development rep — suggests/drafts outreach automatically.
  Outbound Copilot: AI assistant embedded in the sequence surface.

WHY THIS WORK IS IMPRESSIVE:
  - End-to-end ownership across product, design, and engineering
  - High-leverage surfaces: the workflow builder is used every day by every rep
  - Technical depth: React Hook Form + Zod discriminated unions for dynamic forms
  - Growth impact: measurable time-to-first-value reduction
  - Engineering rigour: test coverage doubled, 28 real UX bugs systematically closed
```

---

## 1️⃣ Workflow Builder — End-to-End Surface Ownership

### What "end to end across product, design, and engineering" means

```
MOST ENGINEERS get a spec, implement it, and hand it back.
END-TO-END OWNERSHIP means:

  - DISCOVERY: Talking to sales reps who use the workflow builder every day.
    "What's frustrating about the current experience?"
    "Where do you hesitate?" "What do you avoid doing?"
  
  - DESIGN REVIEW: Participating in design critiques — not just consuming specs.
    Flagging design decisions that have non-obvious engineering costs.
    Suggesting UX patterns that are simpler to implement AND better for users.
  
  - TECHNICAL DECISIONS: Choosing how to implement, not just implementing.
    "Should per-step email metrics live in the details surface or a separate page?"
    "What state should be URL-serialised so sharing links work?"
  
  - SHIPPING: GA rollout strategy, feature flags, monitoring.
    "Who sees this first? What do we measure? When do we go to 100%?"
  
  - FOLLOW-UP: Reading the data, closing CX tickets, fixing edge cases
    that only appear in production.
```

### Key features: What was built and why

```
PUBLIC SHARING + CLONING:
  Problem: New users struggle with blank canvas syndrome.
           "I need to build my first workflow, but I don't know where to start."
  Solution: Existing workflows can be shared via a public link.
            Anyone with the link can clone the workflow into their account.
  Impact: Reduced time-to-first-value — users start with a working workflow.
  Technical: URL token-based sharing, fork-on-clone semantics
             (clone creates an independent copy; edits don't affect the source).
  
CREDIT-USAGE BREAKDOWN:
  Problem: Users don't know why their monthly credit budget is depleted.
           "I ran out of credits but I don't know which steps are expensive."
  Solution: A breakdown widget in the workflow details surface:
            Auto emails: 2,493 / 3,000 credits
            LinkedIn steps: 834 / 1,000
            Manual tasks: 412 / 600
            Each bar shows usage vs budget at a glance.
  Insight for interviews: "The interesting technical decision was where to
  aggregate this. We compute it server-side in a dedicated endpoint that
  groups credits by step type — rather than summing on the client from raw events,
  which would be too slow for large accounts with millions of events."

PER-STEP EMAIL METRICS:
  Problem: "I know my sequence has a low reply rate, but I don't know
            WHICH email is underperforming."
  Solution: Each email step shows: open rate, click rate, reply rate, bounce rate.
            Reps can identify and fix the specific underperforming step.
  Technical: Per-step aggregation at the database level (step_id as partition key).

MAX CREDITS / PEOPLE-PER-COMPANY LIMITS:
  Problem: Over-touching (emailing the same company too frequently) damages
           sender reputation and violates the account's email health policy.
  Solution: Two configurable limits:
            - Max credits/month: cap total outreach volume
            - Max people/company: stop adding prospects from a company once
              N people are already enrolled in any active workflow
  Technical: Server-side enforcement — enrollment API rejects prospects that
             would exceed limits. Frontend shows the limit controls and
             communicates rejections clearly in the enrollment UI.
```

### STAR Script

```
SITUATION:
  The workflow details surface — the page a rep views to monitor an active
  workflow's performance — showed only basic aggregate statistics. Reps had
  no visibility into individual step performance, credit consumption by step type,
  or real-time signals from enrolled prospects.

TASK:
  Revamp the workflow details surface to give reps and managers a clear view
  of what is happening in their funnel without leaving the page.

ACTION:
  Designed and implemented four composable widgets:

  TASKS widget:
    Upcoming tasks across all enrolled prospects, sorted by urgency.
    Rep sees "4 tasks due today" immediately on opening the workflow.
    Actions: mark complete, snooze, reassign — all inline.

  ACTIVITY widget:
    Real-time feed of events: email opened, LinkedIn accepted, replied, opted out.
    Colour-coded by event type. Time-relative display ("2 minutes ago").
    Signals appear here first — before any report.

  ENROLLMENT widget:
    Funnel: Enrolled → Active → Replied → Completed → Converted → Opted Out.
    Each stage shows count and conversion rate from the top.
    "7.1% conversion on a cold outbound sequence" — immediately visible.

  SIGNALS widget:
    Intent data surfaced in-context: "Acme Corp visited your pricing page."
    Reps can act on this without leaving the workflow view.

  CREDIT BREAKDOWN:
    By step type — auto email, LinkedIn, task, call — vs monthly budget.
    Explains credit consumption without requiring a support ticket.

  PER-STEP METRICS (toggle):
    Each email step's open, click, reply, bounce rates side-by-side.
    Step 1: 48% open rate → Step 2: 39% → Step 3 (break-up): 22%.
    Reps see which step to improve.

RESULT:
  Reps can answer "how is this workflow performing?" in under 10 seconds.
  CX tickets about "I don't know why credits are depleted" dropped significantly.
  Signals widget created a new use case: reps monitor workflows as a prospecting surface.
```

---

## 2️⃣ Inline Sequence Builder V2 — React Hook Form + Zod

### Why this is technically interesting

```
THE CHALLENGE:
  A sequence builder is a dynamic form where each step has a different schema.
  An email step needs: subject, body, send mode (auto/manual), timing.
  A LinkedIn step needs: action type (connect/message/view), and if
  action = "message", also a message field that is required.
  A task step needs: task type, due offset.
  A call step needs: call script, follow-up instructions.

  The traditional approach: one giant form schema with every possible field.
  The problem: TypeScript loses the discriminated relationship — you cannot
  know that message is required IF AND ONLY IF linkedInAction === "message".

  React Hook Form + Zod discriminated union solves this:
  Each step type has its own Zod schema.
  The discriminated union type-safely routes validation to the correct schema.
  useFieldArray manages the dynamic list of steps.

THE ZOD DISCRIMINATED UNION PATTERN:
  z.discriminatedUnion("type", [
    emailStepSchema,      // z.object({ type: z.literal("email"), ... })
    linkedInStepSchema,   // z.object({ type: z.literal("linkedin"), ... })
    taskStepSchema,       // z.object({ type: z.literal("task"), ... })
  ])

  Benefits:
  1. TypeScript knows: if step.type === "linkedin", then step has a linkedInAction field.
     Not maybe has, but definitely has. Discriminated union.
  2. Zod validates each step with the correct schema — cross-field validation
     (.refine()) works per step type.
  3. errors.steps[i] is typed to the correct error shape based on the step type.
```

### STAR Script

```
SITUATION:
  The existing sequence builder was built before we added LinkedIn, task, and call
  steps. It was an email-only form. Each new step type was added as a bolt-on:
  separate UI sections, separate state management, separate validation.
  Result: inconsistent UX (LinkedIn steps validated differently from email steps),
  difficult to add new step types, and fragile state when reordering steps.

TASK:
  Build the inline sequence builder V2 — a single dynamic form that handles
  all step types (email, LinkedIn, task, call) with type-safe validation,
  correct conditional fields, and the ability to add new step types without
  refactoring the form infrastructure.

ACTION:
  1. FORM LIBRARY SELECTION:
     Chose React Hook Form for its uncontrolled component model — performance
     with large forms (300+ steps in an enterprise sequence is not uncommon).
     Controlled forms re-render the entire form on every keystroke. RHF does not.

  2. ZOD SCHEMA DESIGN:
     Each step type has its own z.object() schema with its specific fields.
     Cross-field validation (message required when action = "message") implemented
     as z.refine() on the LinkedIn schema — not as a global form-level rule.
     The discriminated union composes them: one resolver, many schemas.

  3. CONDITIONAL FIELDS:
     A step's visible fields are determined by the watched value of step.type.
     React Hook Form's useWatch() gives real-time access to any field's value
     without triggering form-level re-renders.
     When action changes from "connect" to "message", the message field:
     - Appears in the DOM
     - Is registered with RHF (register())
     - Participates in Zod validation
     When action changes back, the message field is unregistered — its
     value does not pollute the form submission.

  4. FIELDARRAY FOR DYNAMIC STEPS:
     useFieldArray() manages the ordered list of steps.
     append(), remove(), move() are the only mutations — no manual array management.
     Each step has a stable id assigned by RHF (not the array index) — this
     ensures React does not re-render the wrong step when steps are reordered.
     (This was a bug in V1: reordering a step would lose its configuration
     because the form used array index as the key.)

RESULT:
  - New step type (AI-generated step) added in one day — new Zod schema + new StepRow component.
    No changes to the form infrastructure.
  - Reorder bug eliminated: stable RHF ids, not array indexes as keys.
  - Validation is correct: cross-field rules work per step type, not globally.
  - TypeScript errors surface when step schemas are inconsistent with StepRow props.
```

### Follow-up Q&A

**"Why useFieldArray instead of controlled state?"**
> "Two reasons. First, performance: useFieldArray with RHF is uncontrolled — updating one step's subject field does not re-render other steps. With a useState array of steps in a controlled form, every keystroke re-renders the entire list. For a sequence with 20 steps, that is 20 components re-rendering on every character typed. At scale (enterprise customers with 50+ step sequences), this was visibly slow. Second, move() semantics: when the user drags a step from position 3 to position 1, useFieldArray's move() updates the internal field order without creating new form registrations. With manual state, you have to manage the entire form state synchronisation yourself."

**"How do you handle server-side validation errors in a form like this?"**
> "Two categories. Synchronous Zod errors are handled automatically by RHF's zodResolver — they show immediately on submit attempt. Server errors (from the API) are applied via RHF's setError() API: `setError('steps.2.subject', { message: 'This subject was detected as spam by our email scanner' })`. The error appears on the specific field of the specific step, exactly where the user needs to fix it. The tricky case: server errors that do not map to a specific field (e.g., 'You have exceeded your monthly credit limit'). Those go to a toast notification, not a field error — because there is no field to highlight."

---

## 3️⃣ AI-SDR / Outbound Copilot — Entry Point Ownership

### What was owned and why it matters

```
THE FEATURE:
  AI-SDR (AI Sales Development Rep) / Outbound Copilot is an AI-powered
  assistant embedded in the sequence surface. It can:
  - Suggest personalised email copy based on prospect data
  - Recommend sequence templates based on ICP (ideal customer profile)
  - Auto-draft LinkedIn messages
  - Analyse sequence engagement and suggest improvements

THE ENTRY POINT CHALLENGE:
  Entry points for new AI features are high-stakes:
  - Too aggressive: users find it annoying, dismiss, and never engage with the feature
  - Too subtle: users never discover it exists
  - Wrong surface: shown on the wrong page at the wrong time

  IMPRESSION-CAPPED AUTO-SKIP:
  A specific UX decision I owned: the Copilot entry point has a maximum
  impression count (shown to the same user at most N times without engagement).
  After N impressions without a click, it auto-skips — the user's workflow
  surface is clean again.

  Why: A feature that 95% of users ignore but that permanently clutters the UI
  for 100% of users is a net-negative product decision. Impression capping
  respects the user's implicit signal ("I have seen this, I am not interested").

THE ROLLOUT:
  Owned the full GA (general availability) rollout:
  1. Alpha: 5 internal users — validate the Copilot's suggestions quality
  2. Beta: 10% of customers who opted into beta features
  3. Limited GA: 50% of customers — monitor error rates, session recording
  4. Full GA: 100% — with impression cap active from day 1

  Feature flag strategy: Copilot entry point is one flag; Copilot functionality
  is a separate flag. You can show the entry point (UI change, low risk) before
  the full Copilot is stable (high risk). Roll them out independently.
```

---

## 4️⃣ Growth — Templates, Sharing, Time-to-First-Value

### The growth thinking behind the features

```
TIME-TO-FIRST-VALUE (TTFV) PROBLEM IN SALES TOOLS:
  The biggest drop-off in onboarding happens when a new user opens the
  workflow builder for the first time. They see a blank canvas.
  "What do I build? Where do I start?"
  For a sales rep, the blank canvas is a problem — they are paid to sell,
  not to design workflows. If the first experience is hard, they leave.

STARTER TEMPLATES:
  Pre-built workflows for common use cases: cold outbound, inbound follow-up,
  conference connections, re-engagement, champion change, referral requests.
  "Use template" = the workflow is created, configured, and ready to enroll
  prospects — all in one click.

  The design decisions:
  - Templates are opinionated: they have specific timing, specific step types.
    A template that requires configuration before it works is not a template —
    it's a pre-filled form. The template works on day 1 without modification.
  - Templates are public: customers can find, filter, and clone templates
    shared by other users (via the public sharing feature).
    This creates a network effect: power users share templates,
    new users benefit from expert-designed sequences.

ONE-CLICK CREATION:
  Surface a CTA that creates a workflow from a template with one click.
  No modal, no wizard, no "name your workflow" step (the template's name is used).
  The user is immediately in the workflow details view, which shows the steps
  and an "Enroll prospects" CTA. Getting to the first enrollment in under 60 seconds.

PUBLIC SHARING:
  Two use cases:
  1. INTERNAL: share a high-performing sequence with teammates
  2. EXTERNAL: share with prospects or partners (e.g., a vendor shares their
     recommended engagement sequence with their resellers)
  The shared link renders a read-only preview; "Clone to my account" creates
  a fork (independent copy). Edits to the fork do not affect the original.
```

---

## 5️⃣ Engineering Quality — Coverage 38% → 65%, 28 CX Tickets

### The test coverage initiative

```
STARTING POINT:
  38% unit test coverage. Specifically:
  - 47 files at 0% coverage
  - Many of those were high-import utility files and validation hooks
  - Engineers were writing new features without tests (not out of laziness —
    tests were genuinely painful to write: 15-20 lines of setup per file)

METHODOLOGY:

  1. PRIORITISE BY IMPACT:
     Generated a coverage report, joined it with an import-count analysis.
     A utility file imported by 40 components with 0% coverage is higher risk
     than a one-off component with 0% coverage.
     Prioritised the high-import, zero-coverage files first.

  2. AI-ACCELERATED TEST CREATION:
     For pure functions and utility hooks: fed the source file to an AI assistant.
     Prompt: "Write comprehensive Jest + React Testing Library tests for this function.
     Cover: happy path, edge cases (empty input, null, undefined), error paths."
     The AI generated 80% of the tests. Engineers reviewed and added the 20%
     the AI missed (usually: async edge cases, complex state transitions).
     Time saved per file: 2-4 hours → 30-60 minutes.

  3. CI GATE:
     Added Jest coverage thresholds after reaching 50%:
     If a PR drops coverage below 50%, CI fails. PR cannot merge.
     Raised the threshold 5% per quarter as coverage improved.
     This prevents regression — new features cannot ship untested.

  4. TEST QUALITY FOCUS:
     Coverage percentage is a proxy, not the goal.
     We audited a sample of the new tests for quality:
     - Do they test behaviour (what the function does for the user)?
     - Or implementation (what the function calls internally)?
     Behaviour tests survive refactoring. Implementation tests break it.
     Added a PR comment template: "What user behaviour does this test verify?"

RESULT:
  - 38% → 65% in 3 months (Month 1: +10%, Month 2: +10%, Month 3: +7%)
  - 47 zero-coverage files → 3 remaining (intentionally excluded: legacy code scheduled for deletion)
  - CI coverage gate catches regressions automatically
  - Engineers report: "writing tests is much less painful" — the utilities
    (renderWithTheme, factory functions) reduced setup from 15 lines to 3.
```

### The 28 CX tickets usability sprint

```
APPROACH:
  Ran a 2-week focused sprint on CX (customer experience) tickets.
  Criteria for inclusion: reproducible in-product issue (not a feature request),
  affecting user flow quality rather than missing functionality.

  The top categories:
  - Filter/sort persistence: 6 tickets.
    Filters reset on navigation. URL state serialisation fixed this.
    Now: /workflows?status=active&sort=enrolled_desc — state survives nav.
  
  - Table state: 5 tickets.
    Column sort resets unexpectedly. Root cause: table key was the route,
    not the table identifier. React remounted the component (and reset state)
    on any route param change. Fix: stable table ID, useState persisted in URL.
  
  - Inline edit errors: 4 tickets.
    Silent failures on save — the API returned an error but the UI showed success.
    Fix: explicit error toast with rollback, and optimistic update pattern
    (show change immediately, revert if API fails).
  
  - Step reorder loses config: 3 tickets.
    Reordering a step in the sequence builder would sometimes clear its
    configuration. Root cause: array index used as React key.
    Fix: stable step ID as key (now enforced by useFieldArray).

RESULT:
  28 tickets closed in 2 weeks.
  "The product just works better" — this is the goal of a usability sprint.
  Not new features. The existing features working correctly.
```

### Follow-up Q&A

**"How did you get 28 CX tickets closed in 2 weeks?"**
> "Batching and categorisation. I grouped the CX tickets by root cause — filter persistence is one root cause fix that closes 6 tickets. Inline edit error handling is one pattern that closes 4 tickets. I was not closing 28 individual tickets with 28 independent investigations. I was fixing 7 root causes, each of which closed multiple surface-level tickets. The prioritisation question was: which root causes, if fixed, close the most tickets AND affect the most-used surfaces? Filter persistence: high frequency (every table view in the app), high ticket count (6). That goes first."

**"How do you balance shipping features vs fixing technical debt like CX tickets?"**
> "I don't think of them as competing. CX tickets are usually symptoms of technical debt — the filter state bug exists because someone serialised state to component memory rather than URL. Fixing it means introducing URL state, which is a technical improvement that also fixes the CX complaint. I also find that CX ticket sprints build trust with the customer success team, who then become better partners in feature requirements. When CS says 'this is important,' engineers who have shipped CX work believe them — because they have seen the impact. It is a relationship investment as much as a technical investment."

---

## 🔗 Unified Narrative

> "I work on the highest-leverage surfaces in the product — the workflow builder is where every rep spends their day; the sequence surface is how campaigns are actually executed. Getting these right has an outsized impact.
>
> The sequence builder V2 is the best example of technical and product thinking combined. I could have built another bespoke form. Instead, I introduced React Hook Form with Zod discriminated unions — which means adding a new step type (like an AI-generated step) takes one afternoon: new schema, new StepRow component, nothing else changes. That is the right architecture for a product that is growing its step type library.
>
> The AI-SDR Copilot entry point is where I think about the second-order effects: if the entry point annoys users, they develop a negative association with the AI feature before they have tried it. Impression-capped auto-skip is a small design decision that protects the feature's reputation with users who are not ready for it yet.
>
> On the engineering quality side: 38% to 65% test coverage in three months is not about adding tests for their own sake. It is about building a codebase where engineers can refactor confidently. When I revamped the workflow details surface, I could move fast because the underlying utilities were tested. The coverage initiative paid dividends on subsequent feature work."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built a workflow builder" (vague) | "I owned the workflow details surface revamp: Tasks, Activity, Enrollment, Signals widgets, credit breakdown, per-step email metrics — all composable, all on one page" |
| "I used React Hook Form" | "RHF with Zod discriminated union — each step type has its own schema. Cross-field validation (.refine()) works per step type. This is what enables adding a new step type in one afternoon." |
| "I shipped the AI Copilot" | "I led the entry point: design reviews, impression-capped auto-skip (prevents annoyance for non-engagers), GA rollout (feature flag separation: entry point flag vs functionality flag)" |
| "I improved test coverage" | "38% → 65% in 3 months. Methodology: prioritise zero-coverage high-import files, AI-accelerated test generation (2-4h → 30-60min per file), CI gate to prevent regression" |
| Skip the 28 tickets sprint | "2-week usability sprint. 28 tickets → 7 root causes. Filter persistence, table sort reset, inline edit silent errors, step reorder key bug. Each fix closes multiple tickets." |

---

## 📊 Quick Facts

```
Product: B2B sales engagement / workflow automation platform

Workflow Builder:
  Features: public sharing/cloning, credit-usage breakdown, per-step email metrics
            Tasks/Activity/Enrollment/Signals widgets, max credits + max per-company limits
  Details: URL-serialised filter state, stable step IDs (useFieldArray), optimistic updates

Sequence Builder V2:
  Stack:   React Hook Form + Zod discriminated union
  Steps:   email (auto/manual), LinkedIn (connect/message/view), task, call, condition
  Key:     discriminated union — each step type has its own schema + field set
           useFieldArray with stable IDs (not array index) — prevents reorder bugs
           useWatch for conditional fields — message field appears only when needed

AI-SDR / Copilot:
  Ownership: entry point UI, design reviews, technical decisions, GA rollout
  Auto-skip: impression-capped — after N impressions without engagement, suppressed
  Rollout:   Alpha → Beta (10%) → Limited GA (50%) → Full GA — feature flags split
             between entry point (low risk) and functionality (high risk)

Growth:
  Templates:    6 starter templates, one-click creation (no blank canvas)
  Public share: token-based URL, fork-on-clone semantics
  TTFV:         New user → enrolled prospects in under 60 seconds

Engineering:
  Coverage:   38% → 65% in 3 months
  Method:     prioritise by import-count × zero-coverage, AI-accelerated generation,
              CI gate (threshold raised 5% per quarter)
  CX sprint:  28 tickets closed in 2 weeks (7 root causes, not 28 individual fixes)
  Patterns:   filter/sort state in URL, useFieldArray stable IDs, optimistic + rollback
```

---

*Document last updated: June 2026 · Sales Workflow Platform interview preparation*
