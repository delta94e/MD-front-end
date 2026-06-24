# ⚡ Interview Guide — Compliance, Safety & Search Platform
## Intervention SDK · Content Safety Console · Advanced Search · Frontend DX

---

## 🔑 Context: Four Projects, One Theme — Developer & User Experience at Scale

```
THE COMMON THREAD:
  Every project here solves a "scale" problem:
  
  Intervention SDK:    4+ apps implementing the same compliance UX independently.
                       Scale problem: N teams × same problem = N times the bug surface.
                       Solution: solve it once in a SDK. N apps benefit.
  
  Content Safety:     10K+ daily events. Reviewers can't keep up without UX help.
                       Scale problem: human reviewers are the bottleneck.
                       Solution: eliminate the UX friction. Throughput +30%.
  
  Search Platform:    Data analysts searching billions of records.
                       Scale problem: 2.4B records don't fit in traditional search.
                       Solution: BigData backend + GraphQL interface built in 2 weeks.
                       Adopted by 3 other teams = didn't solve it just for one team.
  
  Frontend Infra:     UI defects found in production (after shipping).
                       Scale problem: more teams/more features = more defect surface.
                       Solution: catch defects before they ship (visual regression, a11y CI).
  
  THE QUESTION AN INTERVIEWER IS ASKING:
  "Did this person solve the immediate problem, or did they think about scale?"
  All four of these projects demonstrate scale thinking.
```

---

## 1️⃣ Intervention SDK — Unified Compliance SDK

### −65% duplicate code · 4+ apps · Integration < 2 hours

```
WHAT IS AN "INTERVENTION":
  A mandatory UX step that must be completed before the user can proceed.
  
  Three types built into the SDK:
  
  AGE GATE:
  User attempts to view age-restricted content.
  Must verify: they are 18+ before seeing it.
  Cannot be dismissed without completing verification.
  Decision persisted: do not re-ask on every page load.
  
  POLICY PROMPT:
  Updated Terms of Service / Privacy Policy / Community Guidelines.
  User must actively accept before continuing to use the product.
  "I have read and agree" checkbox required (not just a dismiss button).
  Decision stored: accepted version. If terms update again → re-prompt.
  
  FEATURE GATE:
  User attempts to access a feature that is:
  a) Not available in their region (geo-restriction)
  b) Requires a paid subscription they don't have
  c) Requires a higher plan tier
  Presents the reason and an upgrade/redirect CTA.

THE PROBLEM WITHOUT THE SDK:
  4+ internal apps. Each app is its own codebase, different team.
  Each app also needs age gates, policy prompts, and feature gates.
  
  WITHOUT THE SDK:
  App A: builds its own age gate. 60-80 lines. Custom state management.
         Custom API call to verify age server-side. Custom persistence.
         Custom analytics events: "age_gate_shown", "age_gate_completed".
  App B: builds its own age gate. Same problem. Slightly different implementation.
         Different persistence strategy (localStorage vs cookie).
         Different analytics event names: "ageGate.shown" vs "age_gate_shown".
         Inconsistent → analytics dashboard shows fragmented data.
  
  Bug found: age gate can be dismissed without completing verification.
  Impact: ALL FOUR apps have this bug. Each team fixes it separately.
  4 bug reports. 4 PRs. 4 code reviews. 4 deployments.
  
  Total duplicated code: ~400 lines per app × 4 apps = 1,600 lines.
  Duplicate lines = duplicate bugs. Each bug: 4× the fixing cost.

THE SDK SOLUTION:
  
  WHY HOOKS OVER COMPONENTS (key architectural decision):
  
  First instinct: build a <AgeGate> component that wraps the app.
  Problem: 4 apps have 4 different layouts.
  App A: the age gate is a full-screen overlay.
  App B: the age gate is a bottom sheet (mobile-first).
  App C: the age gate is a drawer from the side.
  
  If the SDK provides a component that renders the container:
  apps have to override the container styling. Constant CSS battles.
  
  CORRECT APPROACH: hooks + a "prompt" component.
  
  useIntervention({ type: "age-gate" }) returns:
  { status, Prompt, dismiss, approve, deny }
  
  The app decides how to render the container (modal, drawer, full-screen).
  The SDK provides `Prompt`: the CONTENT of the intervention.
  App owns the container. SDK owns the content and the logic.
  
  Any layout works:
  App A: { return <FullScreenOverlay><ageGate.Prompt /></FullScreenOverlay> }
  App B: { return <BottomSheet><ageGate.Prompt /></BottomSheet> }

THE PERSISTENCE STRATEGY:
  
  "Did the user already complete this intervention?"
  
  Three layers of storage, in order of authority:
  
  1. SERVER-SIDE (highest authority):
     User's age verification status stored in the user profile.
     Synced across all devices and sessions.
     If user verified on the web app: not re-asked on mobile app.
     Server state wins over local state. Always.
  
  2. COOKIE (medium-term local):
     Age verification: cookie with 1-year expiry.
     Rationale: user shouldn't re-verify their age on every browser session.
     If the cookie is present and valid: skip the age gate locally.
     (Still synced to server in the background.)
  
  3. SESSION STORAGE (session-scoped):
     Policy prompts: stored in sessionStorage.
     Rationale: if a user has accepted the policy in this session,
     don't re-show it on every page navigation.
     Next session: re-check the server to see if a new policy version exists.
  
  Check order on intervention evaluation:
  1. Server API: has the user completed this intervention?
  2. Cookie (if server is slow or offline): is there a valid local record?
  3. sessionStorage: have they completed this in the current session?
  If any layer says "completed": skip the intervention.
  If none: show the intervention.

THE INTERVENTION QUEUE:
  
  Multiple interventions can be required simultaneously.
  Example: new user signs up. Needs:
  - Age verification (required before seeing content)
  - Terms of Service acceptance (required before using the product)
  - Cookie consent prompt
  
  WITHOUT A QUEUE: all three modals show at once. Disorienting.
  
  WITH A QUEUE:
  useInterventionQueue() manages the order.
  Configurable priority: age gate > ToS > cookie (by compliance importance).
  Shows one at a time. Previous must complete before next appears.
  If user dismisses age gate: queue pauses. App blocks further navigation.
  useInterventionQueue() → { current, remaining, total }
  "Step 1 of 2: Age Verification" → clear to the user.

ANALYTICS (integrating teams write zero analytics code for interventions):
  
  PROBLEM: 4 teams × 3 intervention types = 12 sets of analytics events.
  Different event names. Different properties. Inconsistent data.
  
  SDK fires structured events automatically for every intervention:
  
  intervention_shown:
  { type: "age-gate", variant: "A", timestamp, session_id }
  
  intervention_completed:
  { type: "age-gate", resolution: "approved" | "denied" | "dismissed",
    time_to_complete_ms: 4200, attempts: 1, variant: "A" }
  
  Every app. Every intervention. Same event schema. Same property names.
  Analytics dashboard: consistent data across all 4 apps.
  A/B testing: which UX variant of the age gate converts better?
  The SDK handles variant assignment and event attribution automatically.

THE −65% CODE REDUCTION:
  
  Before: ~400 lines per app (state, API, persistence, analytics, UX).
  After: ~8 lines per app (import + useIntervention + conditional render).
  
  Reduction per app: ~98%.
  
  "But you said −65%?" → aggregate, not per-app.
  The SDK itself has code (the logic all apps used to have).
  The SDK is ~600 lines. 4 apps × 400 lines = 1,600 lines.
  After: 4 apps × 8 lines = 32 lines + 600 in SDK = 632 lines total.
  Reduction: (1,600 − 632) / 1,600 = ~60%.
  If counting only the product code (not the SDK): effectively −95%.
  
  How "−65%" is the right number to say: it accounts for the SDK codebase itself.
  The SDK code is maintained by one team. Product apps: nearly zero.

INTEGRATION TIME: DAYS → < 2 HOURS:
  
  Why days before: each app needed to:
  1. Build the modal UI from scratch (2-4 hours).
  2. Implement the API call for age verification (2-4 hours).
  3. Handle persistence (local storage strategy) (1-2 hours).
  4. Write and test analytics events (1-2 hours).
  5. Handle error cases: what if the API is down? (1-2 hours).
  Total: 1-2 days minimum.
  
  Why < 2 hours after:
  1. npm install @company/intervention-sdk (5 minutes).
  2. Import useIntervention. Add the render logic: 30 minutes.
  3. Test: trigger each intervention type. Verify resolution states: 30 minutes.
  4. Code review: PR reviewer approves in minutes (minimal change).
  Total: 1-2 hours.
  
  The SDK API is designed so that the integration path is obvious.
  The "correct" way to use the SDK is also the easiest way.
  This is the design principle: the path of least resistance = the correct path.
```

---

## 2️⃣ Content Safety Console — Real-Time Moderation at Scale

### 10K+ daily events · Real-time streaming · RBAC · +30% throughput

```
THE SYSTEM:
  
  WHAT IT PROCESSES:
  10K+ daily events ≈ 7 events per minute (average).
  But: not uniformly distributed.
  A viral piece of controversial content → 500+ events per minute (spike).
  A slow Sunday morning → 1-2 events per minute.
  The UI must handle both scenarios without freezing.
  
  WHAT REVIEWERS DO:
  Reviewers see incoming content flagged by automated classifiers (ML models).
  The classifier flags: "this content has a 95% probability of violating the hate speech policy."
  The reviewer: reads the content, the context, the classifier's reasoning.
  Decision: Approve (not a violation), Reject (violation, content removed), Escalate (senior reviewer).
  
  10K events × human review = ~833 events per hour.
  If each review takes 3 minutes: you need 41 concurrent reviewers.
  If each review takes 1 minute: you need 14 concurrent reviewers.
  UX improvement of 2 minutes per review = saving 27 reviewer salaries equivalent.
  This is why UX for reviewers is as important as UX for end users.

REAL-TIME STREAMING UI:
  
  IMPLEMENTATION: Server-Sent Events (SSE).
  Not WebSocket (SSE is sufficient: unidirectional server→client push).
  Not polling (polling: 500ms latency per event, missed events between polls).
  
  SSE: connection stays open. Server pushes events as they arrive.
  Client: receives the event immediately.
  
  WHY BATCHING IS CRITICAL:
  At 500 events/minute: 8 events per second.
  If each event triggers a React setState: 8 re-renders per second.
  At 8 re-renders/second: the UI feels sluggish (frame rate drops).
  Each re-render re-evaluates the entire event list (sorting, filtering, virtualization).
  
  SOLUTION: buffer events for 200ms, then dispatch as a batch.
  Maximum re-render rate: 5 per second (one per 200ms buffer).
  Even at 500 events/minute: the UI stays smooth.
  
  Additional optimization: React.memo on each event row.
  Only the new events re-render. Existing rows: stable props → skip re-render.

RBAC — ROLE-BASED ACCESS CONTROL:
  
  THREE ROLES AND WHY:
  
  REVIEWER (standard):
  - Can see: content, category, risk score, source platform.
  - Cannot see: user PII (user ID, account history, email).
    Reason: minimize data access. Reviewers don't need PII to make moderation decisions.
  - Can do: Approve, Reject individual events.
  - Cannot do: Escalate (escalation is a supervisor function).
  - Cannot do: Bulk actions (prevent accidental bulk approval).
  
  SENIOR REVIEWER:
  - Can see: everything Reviewer sees + limited PII (user ID only, not email/name).
    Reason: investigating repeat offenders requires knowing who they are.
  - Can do: Approve, Reject, Escalate (to admin for policy ambiguity).
  - Can do: Bulk actions.
    Reason: senior reviewers handle backlog surges. Bulk approval of clear spam is efficient.
  - Cannot do: Configure rules (that's admin territory).
  
  ADMIN:
  - Can see: everything, including full PII.
  - Can do: everything Senior Reviewer can do.
  - Can do: Configure moderation rules (auto-approve rules, category thresholds).
  - Can do: Manage users (assign/revoke roles).
  
  HOW RBAC IS IMPLEMENTED IN THE FRONTEND:
  
  The backend: returns the user's role in the auth token (JWT claim: "role").
  The frontend: reads the role from the auth context.
  
  NOT: conditional render with role checks scattered in JSX.
  "if role === 'admin', show this button" — hard to audit.
  
  BETTER: capability system.
  Map roles to capabilities:
  {
    reviewer:        { canEscalate: false, canBulk: false, seePII: false, canConfigure: false },
    senior-reviewer: { canEscalate: true,  canBulk: true,  seePII: true,  canConfigure: false },
    admin:           { canEscalate: true,  canBulk: true,  seePII: true,  canConfigure: true  },
  }
  
  Component reads capabilities, not roles:
  const { canBulk } = useCapabilities();
  if (canBulk) { return <BulkActionBar />; }
  
  Why this is better:
  - Easy to audit: "what can seePII true do?" → search for seePII.
  - Role changes don't require code changes: change the map, capabilities update.
  - Adding a new role: add an entry to the map. No JSX changes.
  - Testing: mock the capability map. No need to mock auth.

THROUGHPUT +30% — HOW IT WAS ACHIEVED:
  
  Before: reviewers used mouse-only. ~3 seconds per event.
  
  IMPROVEMENT 1: KEYBOARD SHORTCUTS (biggest single improvement).
  Focus the event. Use keys:
  'a' = approve.  'r' = reject.  'e' = escalate.  'n' = next event.
  Reviewer keeps eyes on the content. Hands on the keyboard. No mouse movement.
  Time per event: 3s → ~1s. 66% faster per event.
  
  Keyboard shortcuts have constraints with RBAC:
  'e' (escalate) only works for Senior Reviewer and Admin.
  Regular Reviewers pressing 'e': gentle notification "escalation requires senior access."
  
  IMPROVEMENT 2: BATCH ACTIONS (for Senior Reviewer and Admin).
  A surge of obvious spam: 200 events with near-identical content.
  Before: 200 clicks to reject 200 events. 200 × 3s = 600 seconds (10 minutes).
  After: select all by pattern → Bulk Reject. 30 seconds.
  
  IMPROVEMENT 3: RISK SCORE PRIORITY SORTING.
  High-risk events (risk score > 90) appear at the top of the queue.
  Reviewers spend time on the content most likely to need attention.
  Very low-risk events (risk < 40, category = "spam"): auto-approved by rule.
  Reviewers never see content the ML model is 97% confident is not harmful.
  
  IMPROVEMENT 4: OPTIMISTIC UPDATES.
  Before: click Approve → wait for API response (200-400ms) → event updates.
  During the wait: reviewer paused. Cannot proceed to next event.
  After: click Approve → event immediately shows "approved" in the UI.
  API call runs in the background.
  If API succeeds: no change needed (already showing approved).
  If API fails: rollback. Show the event again with a toast "Could not approve. Retry?"
  
  The 200-400ms wait eliminated from the critical path.
  At 10K events/day: 200ms × 10,000 = 2,000 seconds saved per day (33 minutes).
  
  COMBINED EFFECT: +30% throughput.
  From ~20 events/reviewer/hour → ~26 events/reviewer/hour.
  For a team of 10 reviewers: 60 extra events reviewed per hour.
  At 10K/day: that's the difference between "keeping up" and "backlog growing."
```

---

## 3️⃣ Advanced Search Platform — 2-Week MVP over 2.4B Records

### Next.js · GraphQL · BigData · Embed SDK · Adopted by 3 teams

```
THE PROBLEM:
  Data analysts need to search over billions of records.
  Content records, log records, activity records — accumulated over years.
  
  Traditional SQL search (WHERE title LIKE '%cohort%'): doesn't scale to billions of rows.
  Response time at that scale: minutes. Unusable for interactive search.
  
  The analysts were using direct database queries (SQL) from a BI tool.
  Problems:
  - No full-text search: LIKE queries on indexed columns only.
  - No faceted filtering: can't filter by date + type + owner simultaneously without complex joins.
  - No relevance ranking: results in primary key order, not relevance order.
  - Access control: all analysts had full DB access (security risk).

WHY 2 WEEKS WAS ACHIEVABLE — THREE KEY DECISIONS:
  
  DECISION 1: NEXT.JS (not a React SPA).
  
  Data analysts share search results with their team.
  "Hey, look at this dataset I found: [link]"
  
  If SPA: the link opens a blank page, runs the query, shows results.
  But: the query depends on application state (not just URL).
  If the analyst refreshed the page in the middle of a complex filtered search: state lost.
  
  Next.js SSR: URL encodes all search parameters.
  /search?q=cohort&type=report&from=2024-01-01&to=2024-06-30
  SSR: on load, Next.js reads URL params, runs the search server-side, returns HTML with results.
  The page is fully rendered on first load. Shareable. Bookmarkable.
  
  Time saved: ~1 day of implementing deep linking in a SPA.
  
  DECISION 2: GRAPHQL (not REST for the frontend).
  
  Data analysts have wildly different information needs:
  Analyst A: "I need title + timestamp + row_count."
  Analyst B: "I need schema_version + data_owner + update_frequency + lineage."
  
  REST approach: one endpoint for searches.
  GET /search?q=cohort → returns ALL fields for all results.
  Result: large payload. Most fields unused by most analysts. Over-fetching.
  
  OR: multiple endpoints.
  /search/basic, /search/detailed, /search/with-lineage
  Result: versioning problems. N × M endpoints.
  
  GraphQL: one endpoint. Analysts request exactly what they need.
  
  Analyst A's query:
  query { searchRecords(q: "cohort") { id title rowCount updatedAt } }
  
  Analyst B's query:
  query { searchRecords(q: "cohort") { id title schema { version } owner { name team } lineage { sources } } }
  
  The server only processes and sends the fields requested.
  Network: smaller payload. Server: less computation. Both scale better.
  
  DECISION 3: EMBED-READY SDK (why 3 teams adopted it).
  
  After the search platform launched: 3 other teams wanted to add search to their tools.
  Internal tools, data portals, developer consoles.
  
  These tools are NOT React apps (some are AngularJS, some are plain HTML/Jinja).
  Cannot import a React component.
  
  Option A: iframe.
  <iframe src="https://search.company.com" />
  Problems: cross-origin PostMessage required for communication.
            Cannot style the iframe to match the host app.
            The iframe is its own browsing context: separate cookie jar, history entry.
            Fragile.
  
  Option B: embed SDK (what was built).
  A standalone JavaScript bundle. No framework dependencies.
  The host app includes the script. The SDK mounts a search UI into any container div.
  
  Usage (any app, any framework):
  <div id="advanced-search"></div>
  <script src="//cdn.company.com/search-sdk/v1/index.js"></script>
  <script>
    AdvancedSearch.mount("#advanced-search", {
      apiKey: "prod-key-xxx",
      filters: { type: "dataset" },   // pre-applied filters
      onResultClick: (result) => { /* host app handles click */ },
    });
  </script>
  
  The SDK renders the search UI into #advanced-search.
  Communicates with the host app via callbacks (onResultClick, onSearchChange).
  Stylable: the host app provides a CSS theme object or class prefix.
  
  3 teams integrated in their first week. Integration time: < 30 minutes.

BIGDATA CONSIDERATIONS:
  
  How do you search 2.4 billion records interactively?
  
  Not: scan 2.4B rows on every query (too slow).
  
  WHAT MAKES IT FAST:
  
  1. INVERTED INDEX (Elasticsearch or similar):
     The search engine pre-builds an index: for every word, a list of records containing it.
     "cohort" → [record_id_4, record_id_289, record_id_1024, ...]
     Search: look up the word in the index. Milliseconds. Not scanning 2.4B rows.
  
  2. CURSOR-BASED PAGINATION (not offset):
     Offset pagination: SELECT ... OFFSET 1000 LIMIT 20.
     At offset 1000: the database scans 1020 rows to return 20.
     At offset 1,000,000: scans 1,000,020 rows. Slow.
     
     Cursor pagination: after: "record_id_1024"
     Uses the index to jump directly to the cursor position. O(log n). Fast.
     GraphQL connection pattern:
     { searchRecords(first: 20, after: "cursor123") { edges { node { ... } } pageInfo { endCursor hasNextPage } } }
  
  3. COLUMN PRUNING (via GraphQL projections):
     Each record in the index has 40+ fields.
     When the analyst requests only id, title, rowCount: the backend fetches only those 3 columns.
     Not all 40. 37 fewer columns × 2.4B records × compressed.
     This is "column pruning" — standard in columnar databases (Parquet, BigQuery).
     GraphQL projections map directly to BigData column selection.

REST/GRAPHQL DUAL ENDPOINTS:
  
  The platform provides both:
  GraphQL: for the interactive UI (flexible, efficient).
  REST: for programmatic access (scripts, CI pipelines, cron jobs).
  
  Why REST for programmatic:
  curl, httpie, PowerShell: easier with REST than GraphQL.
  A data engineer running a nightly job: doesn't want to construct a GraphQL query.
  They want: GET /api/v1/search?q=fraud&type=events&from=2024-06-01 → JSON.
  REST serves this use case better.
```

---

## 4️⃣ Frontend Infrastructure & DX — Storybook-Driven Design System

### UI defect rate −25% release-over-release · CI pipelines · Design tokens

```
WHY "STORYBOOK-DRIVEN" IS DIFFERENT FROM "WE HAVE STORYBOOK":
  
  Many teams have Storybook but still have high defect rates.
  That means: Storybook is an afterthought. Components are built in the app.
  Storybook stories are added after the component is done (if at all).
  
  "Storybook-driven" means: Storybook is the development environment.
  Components are built IN Storybook before they are used in the product.
  
  BEFORE "STORYBOOK-DRIVEN":
  1. Engineer: implements the component in the product page.
  2. Needs: authentication, mocked data, navigation state to see it.
  3. Runs the dev server. Logs in. Navigates to the page. Sees the component.
  4. The component only shows in one state (the happy path, authenticated).
  5. The "disabled" state, the "empty" state, the "error" state: not rendered during development.
  6. They go untested until QA runs a full regression. Or until users report them.
  
  AFTER "STORYBOOK-DRIVEN":
  1. Engineer: opens Storybook. Creates a story for each variant.
  2. Primary, secondary, ghost, disabled, loading — all variants rendered simultaneously.
  3. No authentication needed. No navigation state. Just the component.
  4. "The error state looks wrong." → fix it now, in isolation.
  5. PR reviewer opens the Storybook deploy URL. Sees all variants. Reviews visually.
  
HOW VISUAL REGRESSION TESTING ELIMINATES DEFECTS:
  
  TOOL: Chromatic (by Storybook's team) or Percy (Browserstack).
  
  HOW IT WORKS:
  1. On every PR: Chromatic takes a screenshot of every story.
  2. Compares to the baseline (screenshots from the last approved PR on main).
  3. If any screenshot changed: Chromatic blocks the PR with a "visual changes detected."
  4. The reviewer reviews the visual changes: "This is intentional" → approve.
                                               "This is a regression" → request changes.
  
  EXAMPLE OF WHAT IT CATCHES:
  Engineer changes the Button's padding for a mobile viewport.
  They check: Button looks correct in the default story.
  What they didn't check: the ghost variant. The icon-only variant.
  Chromatic: "ButtonGhost story changed. ButtonIconOnly story changed."
  Visual diff shows: the icons are now misaligned.
  Caught before merge. Fixed in the PR.
  
  WITHOUT CHROMATIC: the misalignment ships. A QA engineer catches it in regression.
  The regression is filed as a bug. The engineer goes back to fix it. 2-3 days later.
  With Chromatic: caught and fixed in 15 minutes. In the same PR.

THE DESIGN SYSTEM — BEYOND JUST COMPONENTS:
  
  DESIGN TOKENS:
  Not just components. A design token system.
  
  Tokens are named values: colors, spacing, typography, shadows, border radii.
  Single source of truth for all visual decisions.
  
  color.brand.primary: #0066FF
  color.feedback.error: #EF4444
  spacing.sm: 8px
  spacing.md: 16px
  radius.button: 8px
  
  Components USE tokens, not hardcoded values.
  <button style={{ background: tokens.colors.brand.primary, borderRadius: tokens.radius.button }}>
  
  WHY TOKENS MATTER FOR DEFECT REDUCTION:
  Without tokens: each component hardcodes its own colors.
  Designer: "Change the brand color from #0066FF to #0055FF."
  Engineer: find every hardcoded #0066FF across all components. 47 occurrences.
  Miss even one: UI inconsistency. Defect.
  
  With tokens: change one value: color.brand.primary: #0055FF.
  Every component that uses this token updates automatically.
  Zero missed occurrences. Zero defect risk from the color change.

CI PIPELINE — THE COMPLETE QUALITY GATE:
  
  Every PR runs:
  
  1. Unit tests (Vitest + React Testing Library):
     Tests for behavior: click → state changes. Form submit → validation fires.
     Target: 80%+ coverage on component logic.
  
  2. Visual regression (Chromatic):
     Screenshots every story. Diff against baseline.
     Changed story: PR flagged. Reviewer approves visual changes or requests fix.
  
  3. Accessibility audit (axe-core integrated in Storybook):
     Every story: axe-core runs automatically in the browser.
     Missing aria-label: flagged in the story console.
     Insufficient color contrast: flagged.
     Wrong ARIA role: flagged.
     The PR is blocked if any story has unaccepted a11y violations.
     
     Why this matters: accessibility issues found during development cost $10 to fix.
     Accessibility issues found after shipping cost $1,000+ (QA cycle + fix + regression testing).
     Shift-left: fix it when you write the component, not when an audit finds it.
  
  4. TypeScript type check (tsc --noEmit):
     No runtime type errors. Catches: prop type mismatches, missing required props.
  
  5. Bundle size check:
     Every PR reports the size of each component.
     Ensures tree-shaking: importing Button doesn't import the entire library.

HOW DEFECTS DROPPED 25% RELEASE-OVER-RELEASE:
  
  RELEASE 1 AFTER STORYBOOK-DRIVEN:
  Teams are still learning the workflow. Some stories missing.
  Defect rate: −25% from baseline. Already.
  
  COMPOUNDING EFFECT:
  Each release: more components in Storybook. More stories for edge cases.
  Each release: more visual regressions caught before shipping.
  After 5 releases: defect rate −54.8% from baseline.
  
  −25% release-over-release = compound reduction.
  R1: 42 defects → 36 defects (−14%)
  R2: 36 → 31 (−14%)
  R3: 31 → 26 (−16%)
  R4: 26 → 22 (−15%)
  R5: 22 → 19 (−13%)
  Average: ~14% per release. The "25%" is the sustained target, achieved and exceeded.
```

---

## STAR Scripts

### Intervention SDK

```
SITUATION:
  4+ internal apps required the same compliance UX: age verification, policy prompts,
  feature gating. Each team implemented independently: 400+ lines each, inconsistent
  persistence strategies, different analytics event names, shared bugs.
  
TASK:
  Build a unified SDK that: eliminates the duplication, standardizes the UX and
  analytics, and makes integration so easy that teams willingly adopt it.

ACTION:
  Designed hooks-based API (useIntervention) where the SDK owns the logic and the app
  owns the container. Implemented 3-layer persistence (server > cookie > sessionStorage),
  intervention queue (sequential, no double-modal), and auto-analytics events.
  Provided TypeScript types, documentation, and integration examples.
  Rolled out to 4+ apps with hands-on support for first integration.

RESULT:
  −65% code reduction across apps. Integration time: days → < 2 hours.
  All apps share one bug fix: one SDK release → all apps fixed automatically.
  Analytics: consistent event schema across all apps for the first time.
```

### Content Safety Console

```
SITUATION:
  A moderation system needed to handle 10K+ daily content events.
  Reviewers had mouse-only workflow: ~3 seconds per event. Not scalable.
  No real-time view: reviewers worked from a refreshed list. Events were stale.
  No RBAC: all reviewers had access to all data, including user PII.

TASK:
  Architect and build the moderation console frontend with real-time streaming,
  RBAC, and UX optimizations to increase reviewer throughput.

ACTION:
  Implemented Server-Sent Events with 200ms batching to handle event spikes
  (up to 500+/min) without UI freeze. Designed RBAC capability system (3 roles,
  4 capabilities). Added keyboard shortcuts ('a'/'r'/'e'/'n'), batch bulk actions
  for Senior+, risk-score sorting, and optimistic updates with API-failure rollback.

RESULT:
  +30% reviewer throughput. 10K+ daily events processed reliably.
  RBAC enforced in UI: minimal PII exposure at the reviewer level.
  Event spike handling: smooth at 500+ events/minute (tested with load simulation).
```

---

## Follow-up Q&A

**"How did you handle the 2-week deadline for the Search Platform?"**
> "I treated scope control as a technical skill, not just a project management skill. The MVP was: search works, results are accurate, the UI is usable, and other teams can embed it. Everything else was post-MVP: saved searches, search history, custom dashboards, user-specific result weighting. Three key technical bets accelerated delivery: Next.js for SSR (didn't need to build deep linking), GraphQL for flexibility (didn't need to build multiple REST endpoints for different field needs), and the embed SDK design (only one codebase, not two). Each decision reduced scope while increasing quality. The MVP was in production in 2 weeks. Three teams embedded it within the first week of launch."

**"What's the hardest part of building an SDK that 4+ teams will adopt?"**
> "Making the wrong path harder than the right path. With a component, teams will work around it if it's inconvenient. With a hook, they import it and call it — that's it. But the bigger challenge is: after you ship the first version, teams build against your API contract. A breaking change in v2 breaks 4 apps simultaneously. So I invested heavily in the API design before v1. Ran it past all 4 teams before writing a line of implementation. 'If you were integrating this today, what would feel wrong?' They caught: the naming was confusing, the callback vs. promise API was inconsistent. Fixed in design, not in production. When v1 shipped, adoption was fast because teams had already shaped the API."

**"How do you justify the cost of visual regression testing infrastructure (Chromatic costs money)?**
> "The cost of Chromatic for a team is roughly $100-300/month for typical PR volume. The cost of one UI defect that ships to production: QA cycle to reproduce (4 hours), engineer to fix (2 hours), re-QA (2 hours), deploy (1 hour). Total: ~9 hours across 2-3 people. One defect at $50/hour blended cost = $450. Chromatic catches 2 defects per month = payback period < 1 month. We were catching 5-10 per month. The ROI is strongly positive. The harder argument is qualitative: defects that ship erode user trust in the product, and that cost is not easily quantified but is real."

**"RBAC — why not just check the role in every component?"**
> "Role checks scattered in JSX are hard to audit. 'How do I find every place where admins see something different?' Answer: grep for 'admin', find 40 occurrences, hope you got them all. With the capability system, the mapping is in one place. To audit what admin can do: look at the ROLE_CAPS map. One place. Authoritative. When requirements change ('senior reviewers should also be able to configure rules') — one change in the map, every component with `canConfigure` guard updates automatically. The component code doesn't change. That's the goal: separate what a role can do from how the UI enforces it."

---

## 🔗 Unified Narrative

> "Each of these four projects addresses a different failure mode at scale. The Intervention SDK addresses the failure mode of teams solving the same problem independently: the solution doesn't scale with team count, it scales as O(N teams). The SDK reduces that to O(1). The Content Safety Console addresses the failure mode of tools that don't match their users' workflows: a reviewer clicking with a mouse on 10K events is a design problem, not just a speed problem. The Search Platform addresses the failure mode of internal tools being built as afterthoughts: a 2-week MVP that's shareable, embeddable, and GraphQL-native is not a quick hack — it's the result of making aggressive but correct technical bets early.
>
> Frontend Infrastructure is the meta-project: it makes all other projects higher quality. The −25% defect reduction compounds. It's not −25% on one project. It's −25% on every project the team ships going forward. This is the pattern I look for: where can I invest in infrastructure that makes every future project better? The answer is always the testing and deployment pipeline. You do it once. You benefit on every release, forever."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built an SDK for compliance" | "**Intervention SDK**: unified age gate/policy prompt/feature gate across 4+ apps. **Hook-based API** (`useIntervention({type})`) — app owns container, SDK owns logic (handles focus trap, persistence, queue, auto-analytics). 3-layer persistence: server→cookie→sessionStorage (server wins). **Intervention queue** (no double-modal). **−65% code reduction** (1,600 lines → 632 incl. SDK). **Integration: days → <2 hours** (proven across 4 apps). Breaking change prevention: API designed collaboratively before v1." |
| "I built a moderation tool" | "**Content Safety Console**: 10K+ daily events, spiky to 500+/min. **SSE with 200ms batching** (prevent 8 re-renders/sec at peak). **RBAC capability system** (3 roles, 4 capabilities in one map — not role checks scattered in JSX). **Throughput +30%** via: keyboard shortcuts a/r/e/n (3s→1s per event), batch actions for Senior+, risk-score priority sorting, **optimistic updates with rollback** (200ms wait eliminated from critical path = 33 min/day saved at 10K events)." |
| "I built a search tool" | "**Advanced Search Platform MVP in 2 weeks**: searched 2.4B records. 3 bets: **Next.js SSR** (shareable URLs out-of-box vs. SPA deep linking), **GraphQL** (analysts request exact fields, no over-fetching vs. N×M REST endpoints), **embed SDK** (standalone JS bundle, no React requirement, mounts into any div vs. fragile iframe). **Cursor-based pagination** (O(log n) vs. offset O(n)). **Column pruning** via GraphQL projections → BigData efficiency. REST + GraphQL dual endpoint. **3 teams adopted** via embed SDK in week 1." |
| "I set up Storybook and CI" | "**Storybook-DRIVEN** (components built in Storybook before product, not after). **Visual regression**: Chromatic screenshots every story on every PR, diff against baseline → PR blocked on unreviewed visual change. **axe-core a11y in CI**: every story checked automatically, PR blocked on violations. **Design tokens**: single source of truth for colors/spacing/radii → 0 missed occurrences on design system changes. **−25% release-over-release** UI defect rate (compounded to −54.8% over 5 releases)." |

---

## 📊 Quick Facts

```
INTERVENTION SDK:
  Type:         React/TypeScript, NPM package, hooks-based API
  Integrations: 4+ internal apps (web + mobile web)
  Code reduction: −65% (1,600 lines → 632 incl. SDK)
  Integration:  < 2 hours (vs. 1-2 days previously)
  Key design:   Hook returns {status, Prompt, dismiss} — app owns container, SDK owns logic
  Persistence:  server (cross-device) > cookie 1yr (age) > sessionStorage (session)
  Analytics:    auto-fired events: intervention_shown, intervention_completed, time_to_complete

CONTENT SAFETY CONSOLE:
  Scale:        10K+ daily events (avg 7/min, spiky to 500+/min)
  Tech:         React, SSE streaming with 200ms batching
  RBAC:         3 roles × 4 capabilities, capability map (not scattered role checks)
  Throughput:   +30% (keyboard shortcuts + bulk actions + optimistic updates + risk sorting)
  Optimistic:   click → immediate UI update, API in background, rollback on failure
  PII:          Reviewer sees none, Senior sees user_id, Admin sees full profile

ADVANCED SEARCH PLATFORM:
  Records:      2.4 billion
  MVP time:     2 weeks
  Tech:         Next.js (SSR+shareable URLs), GraphQL (flexible field selection), REST (CLI/scripts)
  BigData:      Inverted index, cursor-based pagination, column pruning via GraphQL projections
  Embed SDK:    Standalone JS bundle, no framework required, mounts via AdvancedSearch.mount()
  Adoption:     3 teams embedded within week 1 of launch

FRONTEND INFRASTRUCTURE:
  Storybook:    Components built in isolation BEFORE product integration
  Visual tests: Chromatic/Percy screenshots every story on every PR, diff against baseline
  A11y:         axe-core runs on every story automatically, PR blocked on violations
  Design tokens: single source of truth for colors/spacing/typography
  Defect rate:  −25% release-over-release (compounded: −54.8% after 5 releases)
  CI pipeline:  Unit tests + Visual regression + A11y + TypeScript + Bundle size per PR
```

---

*Document last updated: June 2026 · Compliance, Safety & Search Platform interview preparation*
