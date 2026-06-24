# 🔍 Interview Guide — TikTok Content Safety Search Platform
## Zero to Production in 2 Weeks · Multi-level Filters · RBAC · Modular Architecture

---

## 🔑 Context: Why This Achievement Stands Out

```
WHAT MAKES THIS SPECIAL:

1. ZERO TO PRODUCTION IN 2 WEEKS.
   Not inheriting a codebase. Not adding a feature to an existing system.
   Conception → architecture → implementation → testing → production.
   All in 14 days. With a regulatory deadline.

2. BREADTH OF OWNERSHIP.
   Most engineers: own one layer (frontend or backend).
   This project: owned the full stack of the platform:
     Frontend: React + MobX search UI with multi-level filters.
     BFF: permission middleware, aggregation layer.
     Infrastructure: webpack config, CI/CD, deployment.
   "Full-stack ownership" at a company that usually has separate teams for these.

3. SECURITY REQUIREMENT.
   Content safety: reviewers see content that could be harmful.
   A permission bug: a junior reviewer sees content they're not cleared for.
   Or: a sophisticated actor reverse-engineers the API and accesses content without authorization.
   The permission system: a security requirement, not a feature.

4. MODULAR DESIGN FOR LEVERAGE.
   Not just a tool. A platform that other teams could extend.
   "@tt-safety/search" was later integrated by the Creator Ops team in 4 hours.
   The 2 weeks of work: multiplied across the organization.
```

---

## 1️⃣ Search Platform — Multi-level Filters

### Technical Depth

```
THE PROBLEM WITHOUT THE SEARCH PLATFORM:

Content reviewers: assigned a queue. Review items one by one.
Cannot search. Cannot filter by category AND region AND severity simultaneously.

Scenario: legal team says "We have a spike in P0 violence content in the US.
We need to prioritize those immediately."

Without search: reviewers must go through the queue sequentially.
They cannot see "show me only P0 violence from US, sorted by reporter count."
The highest-risk content: might not surface until reviewers happen to reach it.

WITH THE SEARCH PLATFORM:
A reviewer opens the search tab. Sets:
  Category: Violence (a colored toggle button turns on)
  Severity: P0 (red button activates)
  Region: US (blue pill activates)
  Sort: by reporter count (highest first)

Result: the most-reported P0 violence content from the US appears immediately.
The reviewer with the most authority: tackles the highest-risk content first.

THE FILTER ARCHITECTURE:

5 filter dimensions:
  1. Content Type:  video / live / comment / account
  2. Category:      violence / hate_speech / spam / misinfo / adult / minor_safety
  3. Severity:      P0 (critical) / P1 / P2 / P3 (minor)
  4. Region:        US / EU / SEA / MENA / LATAM / APAC
  5. Status:        unreviewed / in_review / reviewed
  + free-text search query + minimum reporter count (slider)

EACH FILTER: independent. Any combination: valid.
The filter state: a single object. Any change to any dimension: triggers a debounced re-query.

DEBOUNCING (the key implementation detail):
Free-text search: fires on every keystroke.
Without debounce: 10 characters typed = 10 API calls = 10 flickering result updates.
With debounce (250ms): only fires 250ms after the user stops typing.
Result: one API call. One result update. Smooth UX.

const debouncedSearch = useMemo(() =>
  debounce((filters: SearchFilters) => {
    dispatch(searchActions.execute(filters));
  }, 250),
  []
);

The 250ms threshold:
  Too short (50ms): still multiple calls for fast typists.
  Too long (500ms): the search feels slow. User wonders if it registered.
  250ms: imperceptible delay. Feels instant.

SORT: multiple dimensions
  By reporter count: prioritise most-reported content (most community-flagged).
  By date: prioritise newest content (time-sensitive incidents).
  By severity: prioritise P0 first.
  Sort: applied client-side after filtering. No additional API call.

PERFORMANCE: why client-side filtering (for this scale)?
  The reviewer's queue: typically 50-200 items loaded per session.
  Not millions of records. Client-side filtering: sub-millisecond.
  No network round trip for each filter change.
  Filter updates: instant. No loading spinner.

  If the scale were millions of records: server-side filtering required.
  Debounce + server-side query: same 250ms pattern, but results come from server.
  We designed the hook interface to support both:
  useSearch({ mode: "client" | "server" })
```

---

## 2️⃣ Dev Environment Setup — webpack / Babel / ESLint / Prettier / lint-staged / Jest

### Technical Depth

```
WHY START WITH TOOLCHAIN (the counterintuitive decision):

Timeline: 2 weeks. Temptation: start building features on Day 1.
Decision: spend Days 1-2 on toolchain. Why?

"Without proper tooling: every hour after costs 3x."

WHAT BAD TOOLING COSTS DURING A FAST DELIVERY:

No ESLint:
  PRs: 200 lines of formatting debates in code review.
  Code review: 40% of comments about style. 60% about substance.
  Every PR: slow. Engineers demoralised.
  With ESLint: zero style debates. Code review: pure substance.

No lint-staged:
  Engineers: skip the mental overhead. Write --no-verify commits.
  Broken code: gets committed. Debugging on top of debugging.
  With lint-staged: it's automatic. 2 seconds on commit. No skip.

No module aliases:
  Imports: ../../../../modules/search/FilterPanel
  Every refactor: update 20 import paths.
  With aliases: import { FilterPanel } from "@search/FilterPanel"
  Refactor: move the file. Alias handles the rest.

No Jest configured with coverage gate:
  Tests: optional. Engineers skip them under deadline pressure.
  With a CI gate (build fails < 70%): tests are mandatory. Not optional.

WEBPACK: configured from scratch

Key decisions:
1. Content hash for cache busting: [name].[contenthash:8].js
   Deploy new version: content hash changes. Browser: fetches new file.
   Old version: cached indefinitely (same hash = same content).
   Without this: deploy new code. Users: might get cached old code.

2. Module aliases: @search, @perms, @ui, @bff
   "Barrel imports": import multiple things from one module path.
   import { FilterPanel, useSearch } from "@search";
   Not: import FilterPanel from "../../modules/search/FilterPanel";

3. Code splitting: vendor (React, MobX) in separate chunk.
   Vendor chunk: rarely changes. Browser: caches it.
   Feature code: changes per deploy. Content hash: changes.
   Users: download only what changed. Not the entire bundle every deploy.

4. Permissions module: separate chunk.
   Loaded only when the user is authorized.
   Unauthorized users: don't download permission-checking logic.
   (Defence in depth: permissions are also enforced at BFF.)

BABEL: TypeScript + React + MobX decorators

Challenge: MobX 6 uses decorators (@observable, @action, @computed).
Decorators: a JavaScript proposal, not yet standard.
Babel: must be configured to understand them.
@babel/plugin-proposal-decorators with legacy: true.

Separate test environment:
  Production Babel: transpiles for browsers (targets: > 1%).
  Includes polyfills for older browsers.
  Test Babel: targets Node.js "current".
  No browser polyfills in tests. Tests: run faster.
  Without this: Jest fails on ES Module syntax. Cryptic errors.

ESLINT + PRETTIER:

They have different jobs:
  ESLint: code QUALITY (unused variables, missing exhaustive deps, accessibility).
  Prettier: code FORMATTING (indentation, quotes, line length).

Why both?
  ESLint CAN enforce formatting rules. But: slower. Conflicts with Prettier.
  "prettier" ESLint config: disables all ESLint formatting rules.
  Let Prettier handle formatting. Let ESLint handle quality.

Domain-specific rules:
  "no-console": "warn" — content safety: no PII in console logs. Security.
  "@typescript-eslint/no-explicit-any": "error" — permission checks: must be typed.
  "jsx-a11y/interactive-supports-focus": "error" — reviewer tools: must be keyboard navigable.
  "react-hooks/exhaustive-deps": "error" — stale closures in search debounce: real bugs.

LINT-STAGED + HUSKY:

lint-staged: runs only on files staged for THIS commit.
  Not on all files. Not a full lint run. Just the changed files.
  Why: running ESLint on 1000 files: 30+ seconds. Engineers skip it.
  Running ESLint on 3 changed files: 2 seconds. Engineers don't skip it.

"--findRelatedTests" Jest flag:
  Changed src/modules/permissions/gate.ts?
  Jest: finds gate.test.ts and any test importing gate.ts.
  Runs ONLY those tests. Not the full suite.
  Fast targeted feedback on every commit.

JEST: coverage thresholds

Global threshold: 70% (branches, functions, lines, statements).
Permission module: 90% threshold (security-critical code).
CI: fails if coverage drops below threshold.
This: prevents the "we'll add tests later" anti-pattern.
"Later" never comes. The gate: enforces it.

WHY 90% FOR PERMISSIONS (not 70%):
Permission logic: if/else branches for each role × each category × each region.
A missed test branch: an authorization bug.
An authorization bug: a reviewer accesses content they shouldn't.
Or: a sophisticated user bypasses authorization.
90% branch coverage: most edge cases tested.
The 10% gap: the acceptance. Not 100% because: infinite edge cases exist.
90%: practical high confidence for security-critical code.
```

---

## 3️⃣ 2-Week Delivery — Conception to Production

### Technical Depth

```
THE 2-WEEK BREAKDOWN:

DAYS 1–2: TOOLCHAIN (do this first, counterintuitively)
  webpack config, Babel, ESLint, Prettier, lint-staged, Jest.
  The groundwork that makes Days 3–14 go faster.

DAYS 3–4: PERMISSION SYSTEM (security first)
  RBAC data model: Role → { allowedCategories, allowedRegions, allowedActions }.
  JWT scope encoding: what the token carries for each role.
  BFF permission middleware: the server-side enforcement layer.
  Frontend PermissionGate component: the UX layer.
  Security FIRST: if permissions are wrong, we have a compliance problem.
  Built and hardened before any product feature.

DAYS 5–7: CORE PRODUCT (multi-level filter search)
  FilterPanel: 5 filter dimensions, toggle UI, debounced query.
  SearchResults: result cards, sort controls, active filter chips.
  Search state management: MobX store with actions + computed values.
  This is the longest phase: most user-facing complexity here.

DAYS 8–10: TESTING + MODULARIZATION
  Jest: component tests, store tests, permission middleware tests.
  Coverage: targeted at base components first (most impact per test).
  Module extraction: publishable packages (@tt-safety/search, etc.).
  Staging deployment: smoke tests. Legal team review of the search UX.

DAYS 11–14: PRODUCTION + STABILIZATION
  Production deployment: with feature flags.
  Feature flags: the deferred features (bulk actions, export) deployed but hidden.
  Staged rollout: limited reviewer group first. Expand over 2 days.
  Post-launch monitoring: Datadog dashboard.
  Hotfixes: Day 12 JWT parsing bug. Detected in 4 minutes. Fixed in 30 minutes.

WHY 2 WEEKS WAS ACHIEVABLE (not magic):

1. SCOPE DISCIPLINE.
   We said no to:
     - Advanced analytics dashboard (post-launch)
     - Saved search presets (post-launch)
     - Export functionality (post-launch)
   What we shipped: core search with filters, permissions, and production deployment.
   Clean scope: no scope creep. Every day: clear deliverable.

2. TOOLCHAIN DAY 1 (paradoxically faster).
   Counter-intuitive: 2 days on toolchain when time is tight.
   Result: every subsequent day: no friction. No formatting debates.
   No broken commits to debug. Tests run on every commit.
   The 2 days paid back in every remaining day.

3. FEATURE FLAGS.
   Deferred features: built and deployed behind flags.
   Can be enabled per reviewer group without a new deployment.
   Parallel development: backend team builds export API while frontend ships.
   When ready: flip the flag. No new deploy needed.

4. POST-LAUNCH MONITORING (mandatory, not optional).
   At this delivery speed: you WILL miss something.
   The question: do you find it before users do, or after?
   Datadog: p95 search latency, error rates, permission rejection rate.
   Day 12 JWT bug: detected in 4 minutes (alert on permission rejection spike).
   Without monitoring: a reviewer would have reported it. Much slower discovery.
```

---

## 4️⃣ Permission Control System — Frontend + BFF

### Technical Depth

```
THE PERMISSION PROBLEM IN CONTENT SAFETY:

Content safety reviewers: see disturbing content as part of their job.
TikTok: responsible for the psychological safety of reviewers.
A junior reviewer: should NOT see the most graphic content.
A reviewer assigned to spam: should NOT see minor safety content.
These are not just UX restrictions. They are regulatory and ethical requirements.

THE TWO LAYERS (and why you need both):

LAYER 1: FRONTEND PERMISSIONGATE (UX layer, not security boundary)
  React component: wraps UI elements.
  If the user's role doesn't have permission: renders a fallback instead.
  The reviewer doesn't see the content card. Doesn't see the button.
  Purpose: UX. Prevent confusion. Don't show things the user can't use.
  Security level: ZERO. Frontend code: runs in the browser. Can be bypassed.
  A sophisticated user: can open DevTools, call the API directly.
  The PermissionGate: meaningless to them.

LAYER 2: BFF PERMISSION MIDDLEWARE (actual security boundary)
  Express middleware: runs on EVERY request to the BFF.
  Extracts and verifies the JWT (if invalid: 401).
  Checks the request parameters against the role's allowed scope.
  If category or region is not in the role's scope: 403.
  The response: "Unauthorized. Category 'minor_safety' not in role scope."
  This check: happens on the server. The browser cannot bypass it.
  Even with DevTools open, calling the API directly: the BFF rejects it.

WHY NOT JUST THE BFF?
  Without the PermissionGate: the reviewer sees a "Violence" content card.
  They click it. The BFF rejects it. The UI shows an error.
  Confusing. Why is this card visible if they can't open it?
  PermissionGate: removes the card from view entirely. Clean, understandable UX.

WHY NOT JUST THE FRONTEND?
  Frontend: runs in the browser. The browser: untrusted.
  A motivated actor: modifies the JavaScript, bypasses the PermissionGate.
  Makes a direct API call to the BFF.
  Without BFF validation: they get the data.
  With BFF validation: they get a 403.

"Defense in depth: use both layers. For different reasons."

THE RBAC DATA MODEL:

Role → Permissions mapping. Four roles:
  junior_reviewer:  spam + misinformation. US + EU only. No bulk actions.
  senior_reviewer:  + hate_speech + violence. + SEA + APAC. Bulk actions allowed.
  team_lead:        + adult. + MENA + LATAM. Export allowed.
  admin:            all categories. all regions. all actions.

ONE SOURCE OF TRUTH: the ROLE_PERMISSIONS constant.
Imported by both:
  - The BFF middleware (server-side checks)
  - The frontend permission utilities (client-side UX)
If a role gets a new permission: update ROLE_PERMISSIONS once.
Both layers update automatically. Cannot be out of sync.

JWT DESIGN:
  Payload: { sub: "reviewer_id", role: "senior_reviewer", exp: ... }
  The role is in the JWT. The ROLE_PERMISSIONS: maps role → capabilities.
  The JWT: signed by the auth server. Cannot be tampered with by the client.
  If a reviewer modifies their JWT: the signature is invalid. 401.

AUDIT LOGGING (the overlooked security requirement):
  Every request to the BFF: logged to the audit system.
  Fields: reviewerId, role, endpoint, category, region, result (allowed/denied), timestamp.
  Denied requests: flagged as security events.
  Purpose: "Who accessed what, when, under what authority?"
  If there's a content breach: the audit log answers the question.
  Required for regulatory compliance in content safety.
  "You're not just building a search. You're building evidence."
```

---

## 5️⃣ Modular Architecture — Extractable + Reusable

### Technical Depth

```
THE PROBLEM WITHOUT MODULARIZATION:

TikTok has 10+ internal content safety tools (review platform, search, live ops, etc.).
Without modularization:
  - Each tool: implements its own search filter panel.
  - 10 different filter UX patterns. Reviewers: confused switching between tools.
  - 10 different permission implementations. One might have a bug the others don't.
  - Bug fix in one: doesn't help the others. Must be fixed 10 times.

WITH MODULARIZATION:
  4 publishable npm packages: @tt-safety/search, @tt-safety/permissions, @tt-safety/ui, @tt-safety/audit-logger.
  Other teams: install the packages. Use the public API.
  A bug fix in @tt-safety/permissions: released as a new version.
  Other teams: bump their version dependency. All fixed.

THE MODULE DESIGN:

@tt-safety/search
  Public API (what consumers can import):
    - FilterPanel component
    - useSearch hook
    - SearchConfig type
  Internal (not exported, hidden):
    - debounce logic
    - filter application algorithm
    - result ranking
  Why hide internals?
    Consumers: depend on the public API.
    If I need to change the internal algorithm: I can. Without breaking consumers.
    If internals were public: consumers might import them. Change = breaking change.

@tt-safety/permissions
  Public API:
    - PermissionGate (React component)
    - usePermissions (hook)
    - permissionMiddleware (Express middleware)
    - ROLE_PERMISSIONS (the source of truth)
  Design decision: exports BOTH frontend AND BFF code.
    Same package. One import path.
    Frontend: imports PermissionGate, usePermissions.
    BFF: imports permissionMiddleware, ROLE_PERMISSIONS.
    One update: affects both layers. Always in sync.

CLEAN INTERFACE PRINCIPLE:
  "Import only from the package root, never from internal paths."
  CORRECT: import { FilterPanel } from "@tt-safety/search";
  WRONG:   import { FilterPanel } from "@tt-safety/search/src/modules/FilterPanel";
  The wrong import: bypasses the public API. Creates tight coupling.
  If I move the file internally: wrong import breaks. Correct import: never breaks.
  Enforced by: package.json exports field (Node.js conditional exports).
  Importing from a non-exported path: Node throws an error.

SEMVER VERSIONING:
  Breaking change (new required prop, removed export): major version (1.x → 2.0.0).
  New non-breaking feature: minor version (1.0.x → 1.1.0).
  Bug fix: patch version (1.0.0 → 1.0.1).
  Other teams: pin to a major version (^1.0.0).
  They opt into major versions intentionally (read the changelog first).
  No surprises: a dependency update never breaks their code unexpectedly.

CONCRETE IMPACT:
  Creator Ops team: integrated @tt-safety/search into their platform in 4 hours.
  They didn't need to understand the debounce logic or filter state management.
  They read the README, imported FilterPanel and useSearch, and it worked.
  "The best API: one you don't need to explain."
```

---

## STAR Scripts

### Full Platform Build

```
SITUATION:
Legal and policy teams needed content reviewers to search for harmful content
using multiple simultaneous filters (category, region, severity, reporter count).
No such tool existed. The need: urgent (regulatory deadline in 2 weeks).

TASK:
Build a comprehensive search platform from conception to production in 2 weeks.
Own the full stack: frontend UI, BFF aggregation, permission system, toolchain, deployment.

ACTION:
Days 1–2: set up the full toolchain (webpack 5, Babel, ESLint, Prettier, lint-staged, Jest).
  Counter-intuitive under deadline pressure. Rationale: toolchain friction costs more over 12 days.
Days 3–4: RBAC permission system. One source of truth (ROLE_PERMISSIONS constant).
  BFF middleware (Express): validates every request. Frontend PermissionGate: UX layer.
  Both layers: necessary. Frontend = UX. BFF = actual security boundary.
Days 5–7: multi-level filter search. 5 filter dimensions.
  Debounced query (250ms): prevents excessive API calls on keystroke.
  Client-side filtering for the reviewer's queue size (50-200 items). Sub-millisecond.
  Sort by reporter count / date / severity.
Days 8–10: Jest test coverage (70%+ gate, 90% for permission module).
  Modular extraction: @tt-safety/search and @tt-safety/permissions as npm packages.
  Staging deployment + legal team review.
Days 11–14: production deployment with feature flags.
  Datadog monitoring: detected a JWT parsing bug within 4 minutes on Day 12.
  Hotfix deployed in 30 minutes. Rolled out to all reviewers by Day 14.

RESULT:
Regulatory deadline met. Reviewers: could filter to highest-priority content immediately.
Creator Ops team: adopted @tt-safety/search in 4 hours (no ramp-up needed: public API).
Permission system: zero security incidents. Audit log: provided compliance evidence.
```

---

## Follow-up Q&A

**"Why did you spend 2 days on toolchain when you only had 2 weeks?"**
> "Counter-intuitive, but the right call. Without proper tooling, every subsequent day costs extra. No ESLint means code reviews fill with formatting debates instead of substance. No lint-staged means engineers write --no-verify commits to bypass slow hooks, and broken code reaches the repo. No module aliases means imports are paths like ../../../../modules/search/FilterPanel that become painful during any refactoring. The 2 days invested in toolchain: paid back across the remaining 12 days by removing friction from every single commit, review, and refactor."

**"Why do you need both a frontend PermissionGate AND a BFF permission middleware?"**
> "They serve different purposes. The frontend PermissionGate is a UX layer, not a security boundary. If a junior reviewer doesn't have permission to see 'minor safety' content, the PermissionGate removes that card from their view. Clean UX. But the browser is untrusted — a motivated person can open DevTools, find the API endpoint, and call it directly. The PermissionGate: meaningless to them. The BFF middleware is the actual security boundary. It runs on the server. It extracts and verifies the JWT, checks the request parameters against the role's allowed scope, and returns 403 if unauthorized. The browser cannot bypass this. You need both: PermissionGate for good UX, BFF middleware for actual security."

**"How do you handle permission changes when a role gets new capabilities?"**
> "ROLE_PERMISSIONS is a single constant — the source of truth. It maps each role to its allowed categories, regions, and actions. Both the BFF middleware and the frontend permission utilities import from this same constant. If a role gets a new permission, I update ROLE_PERMISSIONS in one place. Both layers — frontend and BFF — see the change automatically. There's no possibility of them being out of sync, because they share the same source. This is the key design decision: don't define permissions in two places."

**"How do you ensure code quality on a 2-week deadline?"**
> "Three things: lint-staged, Jest coverage gate, and feature flags. Lint-staged: runs ESLint + Prettier + related tests on every commit — only on changed files, so it takes 2 seconds, not 30. Engineers don't skip it. Jest coverage gate: CI fails if coverage drops below 70% (90% for the permissions module). Tests become mandatory. Feature flags: let us deploy incomplete features to production without making them visible to users. Deferred features (bulk actions, export) were in the codebase by Day 8, deployed but behind flags. When ready: enable the flag. No new deploy."

**"What would you change if you did this again?"**
> "I'd add a dedicated integration test layer. We had unit tests for components and stores, but the integration between the permission system and the search module — specifically the case where a search request is partially within scope — was tested manually. Two weeks in: we found an edge case where a reviewer could see a result card for content they couldn't open, because the frontend permission check happened at click time, not at query time. The fix was straightforward, but an integration test would have caught it earlier. The lesson: unit tests verify components in isolation. Integration tests verify the contract between components."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built a search filter" | "**Multi-level search platform** (5 independent filter dimensions: type/category/severity/region/status + free-text + reporter count slider) with 250ms debounce (why: <250ms = multiple API calls per character typed; >250ms = feels slow; 250ms = imperceptible delay + single request). Client-side filtering for reviewer's queue scope (50-200 items = sub-millisecond). Sort by reporter count/date/severity. Result: reviewers could surface highest-priority P0 violence content for a specific region in seconds." |
| "I set up ESLint" | "**Full toolchain from scratch** (2 days, intentionally): webpack 5 (content hash cache busting, module aliases @search/@perms/@ui, vendor+permissions code splitting), Babel (TS+React+MobX decorators, separate test env to avoid ES Module issues in Jest), ESLint with domain rules (no-console for PII safety, no-explicit-any for typed permission checks, jsx-a11y for keyboard accessibility), lint-staged (runs on changed files only = 2s not 30s, engineers don't skip it). Result: zero formatting debates in code review, no broken commits." |
| "I built a permission system" | "**RBAC with defense-in-depth**: frontend PermissionGate (UX layer — removes unauthorized content from view, but browser-bypassable), BFF Express middleware (actual security boundary — verifies JWT, checks role.allowedCategories + role.allowedRegions, 403 on violation, audit logs every request). ONE source of truth: ROLE_PERMISSIONS constant imported by both frontend and BFF — can never be out of sync. JWT: role in payload, signed — cannot be tampered. Audit log: answers 'who accessed what when' for compliance." |
| "I extracted some modules" | "**Publishable npm packages** with clean public APIs: @tt-safety/search (FilterPanel, useSearch, SearchConfig — internals hidden by index.ts barrel, so debounce logic and filter algorithm can change without breaking consumers), @tt-safety/permissions (PermissionGate + usePermissions + Express middleware from same package — one source of truth). Semver: consumers pin to major version, opt into breaking changes explicitly. Creator Ops team integrated @tt-safety/search in 4 hours — zero ramp-up needed." |

---

## 📊 Quick Facts

```
ACHIEVEMENT: CONTENT SAFETY SEARCH PLATFORM — ZERO TO PRODUCTION

Timeline:   2 weeks (regulatory deadline, no extensions)
Stack:      React + MobX (search state) + Express BFF + webpack 5 + Jest
Ownership:  Full-stack: UI + BFF + toolchain + deployment + monitoring

MULTI-LEVEL FILTERS:
  Dimensions: content type / category (6) / severity (P0-P3) / region (6) / status
  UX: toggle buttons (colored per category/severity), slider for reporter count
  Debounce: 250ms (one API call per "pause", not per keystroke)
  Filtering: client-side for reviewer queue size (sub-millisecond). Server-side for global search.
  Sort: by reporter count / date / severity

PERMISSION SYSTEM (RBAC):
  Roles: junior_reviewer / senior_reviewer / team_lead / admin
  Frontend: PermissionGate (wraps UI elements) — UX only, NOT security
  BFF: Express middleware — verifies JWT + checks category + region scope — actual security
  One source of truth: ROLE_PERMISSIONS (used by both layers)
  Audit log: every request (allowed + denied) — compliance requirement
  JWT: signed — cannot be tampered by client
  
TOOLCHAIN:
  webpack 5: contenthash, aliases, code splitting (vendor + permissions chunks)
  Babel: TS + React + MobX decorators; separate test env
  ESLint: domain-specific rules (no-console, no-explicit-any, jsx-a11y)
  lint-staged: 2-second commit hooks (changed files only)
  Jest: 70% coverage gate global / 90% for permissions module

MODULAR ARCHITECTURE:
  @tt-safety/search:      FilterPanel + useSearch + SearchConfig
  @tt-safety/permissions: PermissionGate + usePermissions + BFF middleware (one package)
  @tt-safety/ui:          shared component library
  @tt-safety/audit-logger:compliance-ready event logging
  Semver: consumers pin to major. No surprise breaking changes.
  Creator Ops: adopted @tt-safety/search in 4 hours.

2-WEEK DELIVERY:
  Day 1-2:  toolchain (webpack/Babel/ESLint/Jest)
  Day 3-4:  permission system (RBAC + BFF middleware + PermissionGate)
  Day 5-7:  search UI (5 filter dimensions + results + sort)
  Day 8-10: Jest 70%+ coverage + module extraction + staging deploy
  Day 11-14:production deploy + monitoring + hotfix (JWT bug: 4min detect, 30min fix)
  Feature flags: deferred features deployed but hidden. No surprises on deadline.
```

---

*Document last updated: June 2026 · TikTok Content Safety Search Platform — Zero to Production*
