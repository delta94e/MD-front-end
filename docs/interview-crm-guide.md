# 🎯 Interview Guide — CRM Platform Engineering
## Core Modules · Ember→React MFE Migration · Framework Upgrades · Best Practices

---

## 🔑 Context: What CRM Platform Engineering Means

```
A CRM (Customer Relationship Management) platform is mission-critical business
software. The stakes of getting it wrong:
  - A lost deal record = lost revenue
  - A broken territory assignment = sales reps not knowing who their leads are
  - A broken pipeline view = management cannot see forecast

This means:
  - Data integrity is non-negotiable (deals must not silently disappear)
  - Performance matters: sales reps use this tool all day
  - User-centricity is a business requirement: a confusing UI → reps avoid the tool
  - Framework upgrades carry high risk: a regression in production
    = reps cannot log calls, update deals, or close business

WHAT MAKES THIS IMPRESSIVE TO AN INTERVIEWER:
  - You worked on multiple modules of a complex, interconnected system
  - You led a major architectural change (Ember → React MFE) on a live production system
  - You executed framework upgrades that most teams avoid because they are risky
  - You established engineering practices that outlast any individual feature
```

---

## 1️⃣ Core CRM Modules — Lead, Contact, Deals, Users, Territory

### The CRM data model (know this cold)

```
LEAD:
  A potential customer who has expressed interest.
  Fields: name, email, company, source (inbound/referral/event),
          lead score, assigned rep, territory, status.
  State machine: New → Working → Qualified → Converted | Disqualified

CONTACT:
  A person at a company with whom there is an ongoing relationship.
  A qualified Lead becomes a Contact.
  Fields: name, role, company (Account), phone, email, lifecycle stage.
  Relationship: Contact belongs to an Account; an Account has many Contacts.

DEAL (Opportunity):
  A specific revenue opportunity with a company.
  Fields: name, amount, stage, probability, close date, owner, territory.
  State machine: Lead → Qualified → Proposal → Negotiation → Won | Lost
  The pipeline view is the primary interface — sales managers live here.

USER:
  CRM users have roles: Admin, Manager, Sales Rep, Read-only.
  Role-based access: Managers see all deals in their team's territory;
  Reps see only their own deals.

TERRITORY:
  Geographic or segment-based grouping for lead and deal assignment.
  Examples: North America, EMEA, APAC; or SMB, Enterprise, Strategic.
  Rules engine: new Leads are auto-assigned to a Rep based on territory rules.
```

### STAR Script — "User-centric approach to enhance functionality and UX"

```
SITUATION:
  The CRM had grown organically over several years. Each module was built
  independently by different engineers at different times. The result:
  - Leads module and Deals module had different UI patterns for the same
    actions (adding a note, logging a call, changing owner)
  - Territory assignment was a manual process — an admin had to individually
    assign each new lead to a rep
  - The pipeline view loaded all deals at once — slow for large sales teams
    with hundreds of open deals

TASK:
  Design and develop improvements to core CRM modules with a focus on
  user experience — making the tool something reps actually want to use.

ACTION:
  1. CONSISTENCY ACROSS MODULES:
     Introduced a shared set of interaction patterns — an "activity log" component
     used identically in Lead, Contact, and Deal detail views.
     Before: each module had its own activity log with different keyboard shortcuts,
     different date formats, different "add note" UX.
     After: one component, same behaviour everywhere. Reps learned it once.

  2. TERRITORY AUTO-ASSIGNMENT:
     Implemented a rules engine for territory assignment.
     Rules format: { field: "company.country", operator: "in", value: ["US", "CA"] } → territory: "North America"
     Admin configures rules in a UI; rules are evaluated on Lead creation.
     Before: 15 minutes of admin work per new lead.
     After: instant, automatic. Admin only intervenes for edge cases.

  3. DEAL PIPELINE PERFORMANCE:
     Replaced the "load all deals" pipeline view with a paginated,
     virtualised Kanban board. Deal cards for stages beyond "Negotiation"
     are loaded on demand (expand to see more).
     Before: 8-second load for a team with 300 open deals.
     After: < 1 second initial load; remaining stages lazy-load.

  4. INLINE EDITING:
     Sales reps update deal amounts and close dates constantly.
     Before: click "Edit," full form, click "Save" — 4 interactions.
     After: double-click the value in the deal card, edit inline, press Enter — 2 interactions.
     Optimistic update: the UI reflects the change immediately; server confirms in background.

RESULT:
  - Daily active usage of the pipeline view increased after the performance fix
  - Territory assignment errors (manual mis-assignment) dropped to near zero
  - "The tool finally feels like it was designed for us" — feedback from sales team
```

### Follow-up Q&A

**"How do you approach user-centric design as an engineer (not a designer)?"**
> "I watch users use the tool. Literally sit next to a sales rep for 30 minutes while they do their daily CRM work and observe where they hesitate, where they make mistakes, where they switch tabs. You do not need a formal usability study — direct observation gives you the 80% of insights you need. The specific insight that led to the inline editing feature came from watching a rep open the deal edit form 40 times in an afternoon to update amounts during negotiation. 40 form opens × 4 clicks × 3 seconds = 8 minutes per day wasted on friction. That is a clear target. The design question was simple: 'how do we make this one interaction as close to zero friction as possible?'"

**"How do you implement a deal stage state machine in a React + API context?"**
> "The state machine lives in the backend (source of truth), and the frontend enforces valid transitions at the UI level. The backend has a `transitions` table: { from: 'qualified', to: 'proposal', allowed: true }, and rejects any API call for an invalid transition with a 422. The frontend reads the allowed next states from the API (the deal response includes `allowedTransitions: ['proposal', 'lost']`) and renders only those options. This pattern — frontend shows what the backend allows — prevents the UX from getting out of sync with business rules, and means business rule changes (e.g., 'you cannot skip Negotiation') only need to change in one place."

---

## 2️⃣ Microfrontend Migration — Ember Monolith → React MFEs

### The problem with a CRM monolith

```
THE EMBER MONOLITH PROBLEM:
  One codebase. One deployment. One team's change can break another's module.
  In a CRM, this is especially painful because:
  - Leads, Contacts, Deals, Territory, Users are developed by different teams
  - A broken deploy of the Deals module cannot be rolled back independently
    of the Leads module
  - Ember.js was losing momentum — React had become the industry standard.
    Recruiting Ember engineers was increasingly difficult.

THE MFE SOLUTION:
  Each CRM module becomes an independently deployable React SPA.
  A broken Deals deploy does not affect Leads. Each team owns their deploy.
  Teams can adopt React incrementally without a "big bang" rewrite.

WHY STRANGLER FIG, NOT BIG BANG:
  The CRM is in daily use by the sales team. There is no maintenance window.
  A big bang migration (rewrite everything, then switch) carries huge risk:
  - 6–12 months of parallel maintenance
  - One go-live that can go wrong in many ways simultaneously
  - No fallback

  Strangler fig: add new behaviour to the new system, stop adding to the old one.
  Migrate one module at a time. Each migration is a contained, reversible risk.
  The Ember monolith shrinks. React MFEs grow. Eventually Ember is gone.
```

### STAR Script

```
SITUATION:
  The CRM was built on Ember.js. Ember had served well in 2016-2018 but by 2020:
  - New engineers joined expecting React — they had to learn Ember from scratch
  - The Ember ecosystem was shrinking — fewer packages, fewer updates
  - The monolith architecture meant Deals team deployments required coordination
    with Leads, Contacts, and Territory teams

TASK:
  Spearhead the architectural design and implementation of a migration from
  the Ember monolith to independent React microfrontends.

ACTION:
  ARCHITECTURE DESIGN:

  1. ROUTING-BASED SEPARATION (Nginx):
     Each module path is served by its own React MFE:
     - /leads/* → Leads React SPA
     - /contacts/* → Contacts React SPA
     - /deals/* → Deals React SPA
     - /territory/* → Territory React SPA
     - /* → Ember monolith (unmigratedmodules)

  2. SHARED CONCERNS — THREE THINGS:
     a) AUTH: One httpOnly session cookie on .crm.company.com.
        Every MFE sends it automatically. No explicit token management.
     b) NAVIGATION: Each MFE navigates to other modules with <a href> — full page load.
        This is correct: cross-MFE navigation IS a boundary crossing.
     c) SHARED DATA: A tiny shared API layer (not a shared JS bundle).
        If Leads module needs a Contact name, it calls the Contacts API.
        No shared React state across module boundaries.

  3. MIGRATION ORDER:
     Leads first — most isolated, least risky.
     Contacts second — established the React Query pattern.
     Deals third — most complex (Kanban, drag-and-drop, real-time updates).
     Territory and Users last — most sensitive (assignments and permissions).

  4. ROLLOUT STRATEGY:
     Each MFE launched behind a feature flag at first.
     5% of users → 20% → 100%, over 2 weeks per module.
     Ember route stayed active as fallback for the first 2 weeks.

RESULT:
  - All major modules migrated to React by end of year
  - Each team deploys independently — zero inter-team coordination for deploys
  - Ember bundle eliminated from production
  - React recruitment significantly easier
  - New hires contributing to their module in their first week
```

### Follow-up Q&A

**"How did you handle cross-module communication in the MFE architecture?"**
> "The most important decision: we treated cross-module communication as an API call, not as shared JavaScript state. If the Deals module needs to display a Contact's name, it calls GET /api/contacts/:id. It does not import a shared React context or a shared Redux store. This keeps modules truly independent — no shared bundle, no shared state that creates implicit coupling. The only shared contracts are API contracts and the session cookie. The downside: if you navigate from Deals to the Contact detail in Contacts, it is a full page load. We decided this was acceptable — CRM users are not doing rapid, app-like navigations. They navigate to a module, work in it, then navigate away."

**"What was the hardest module to migrate?"**
> "Deals, for three reasons. First, the Kanban pipeline view had a custom drag-and-drop implementation in Ember that had accumulated years of edge-case fixes — faithfully reproducing all of them in React took careful testing. Second, Deals had real-time update requirements: if a colleague moves a deal to 'Won,' your pipeline view should update. We implemented this with WebSocket subscriptions in the React MFE — the Ember monolith had no equivalent, so this was genuinely new work added to the migration. Third, Deals had the most complex permission logic — which deals a rep can see and edit depended on territory, role, and deal assignment. We had to make that logic explicit and testable during the migration, because the Ember version had it buried in templates and route hooks."

---

## 3️⃣ Framework Upgrades — Ember, Node, ReactJS

### The philosophy of upgrade work

```
WHY FRAMEWORK UPGRADES ARE HARD AND UNDERVALUED:
  Feature work has a clear output: "The user can now do X."
  Upgrade work has an invisible output: "The application still does everything
  it did before, but now on a modern foundation."

  The difficulty:
  - Breaking changes require finding and updating every affected call site
  - Third-party packages may not yet support the new version
  - Tests catch some regressions — but not all
  - The risk is asymmetric: if the upgrade goes perfectly, nothing changes for users.
    If it goes wrong, users notice immediately.

  The value:
  - Security: older Node versions stop receiving security updates
  - Performance: React 18's auto-batching reduces renders; Ember Octane is faster
  - Hiring: engineers want to work on current technology
  - Future features: some features only available in newer versions

THE PRINCIPLE I APPLIED:
  Upgrade incrementally. Never skip major versions.
  Node 12 → 14 → 16 → 18 (not 12 → 18).
  Ember 3.x Classic → Ember Octane (3.28) before Ember 4.x.
  React 15 → 16 → 17 → 18 (not 15 → 18).

  Each version jump is a contained risk. If something breaks, you know it
  broke between version N and N+1 — not somewhere in a 3-major-version span.
```

### STAR Script — Ember Classic → Octane

```
SITUATION:
  The Ember codebase was on Ember 3.x Classic syntax — the old Ember.Object
  model with .extend(), .set(), and computed() properties. Ember Octane
  (shipping with Ember 3.28) introduced a completely different programming
  model based on native JavaScript classes, @tracked reactive state, and
  Glimmer components.

  The problem: Ember Classic and Octane can coexist in one codebase,
  but mixing them creates confusion and prevents using new Octane features.
  New engineers writing Octane syntax in an existing Classic component would
  cause subtle bugs. We needed a coherent codebase.

TASK:
  Lead the Ember Classic → Octane migration across 200+ components
  without breaking the production CRM.

ACTION:
  1. AUDIT: Categorised all 200+ components:
     - Simple (30%): stateless or nearly stateless — automated codemod can handle
     - Medium (50%): have computed properties and actions — require manual review
     - Complex (20%): have lifecycle hooks, observers, or mixins — require careful rewrite

  2. CODEMODS: Used ember-codemods (official codemod package):
     - ember-codemods native-classes: .extend() → class syntax
     - ember-codemods ember-data-codemod: updates Ember Data models
     - These handled ~30% of the migration automatically

  3. MIGRATION GUIDE: Wrote an internal guide with before/after examples
     for the 10 most common Classic patterns, mapping them to Octane equivalents.
     This allowed the rest of the team to do their own module's migration safely.

  4. LINTING: Added ember-template-lint rules that flagged Classic syntax —
     ensured no new Classic syntax was introduced during the migration.

  5. PHASED: Migrated module by module (same cadence as the React MFE migration —
     Leads, Contacts, Deals, Territory, Users).

RESULT:
  - All 200+ components migrated to Octane in 3 months
  - Zero production incidents during the migration
  - Build performance improved (Octane's tree-shaking is better than Classic)
  - New engineers writing their first Ember code were writing Octane — simpler,
    closer to native JavaScript
```

### Follow-up Q&A (Framework upgrades general)

**"How do you de-risk a major framework upgrade in production?"**
> "Four things. First: CI test suite with good coverage — regressions show up in tests before they show up in production. If you have low test coverage, the upgrade is as risky as the coverage is bad. Before the Ember Octane migration, I spent two weeks adding tests to the areas with lowest coverage — not because I was planning to test the Octane migration specifically, but because I needed confidence in the safety net. Second: codemods for mechanical changes — anything that can be automated should be automated. Manual changes introduce human errors; codemods are consistent. Third: phased rollout using feature flags — the new code goes to 5% of users first. Issues surface on 5%, not 100%. Fourth: rollback plan — always have a specific, practised answer to 'what do we do if the upgrade is wrong in production?' For Ember Octane, the rollback was: revert the branch, re-deploy previous commit. For Node upgrades, the rollback was: switch the load balancer back to the previous instance group. Having these steps documented and practised makes the upgrade less stressful."

---

## 4️⃣ Best Practices — Culture of Excellence

### What "establishing best practices" actually means

```
"ESTABLISHED BEST PRACTICES" IS NOT THE SAME AS "WROTE A DOCUMENT":
  Many teams write a coding standards document.
  Few teams have engineers follow it.

  The difference is enforcement:
  - Practices enforced by linting (ESLint rules) are followed by everyone,
    automatically, without code review comments
  - Practices enforced by code review are followed inconsistently
    (depends on the reviewer's attention)
  - Practices enforced by documentation are followed by no one
    (engineers do not read documentation)

  The most effective practice introduction:
  1. Make the right thing the easy thing
  2. Make the wrong thing fail automatically (lint error, CI failure)
  3. Document WHY (not just what) — in ADRs, not in a wiki that goes stale

THREE PRACTICES I INTRODUCED:

1. ARCHITECTURE DECISION RECORDS (ADRs):
   Every significant decision has a structured document committed to Git:
   Context → Decision → Rationale → Consequences.
   New engineers read ADRs to understand "why is this built this way?"
   without asking the original engineer.

2. AUTOMATED REVIEW CHECKLIST (ESLint):
   Code review checklist items that can be automated ARE automated.
   - No console.log → eslint: "no-console"
   - Correct useEffect dependencies → "react-hooks/exhaustive-deps"
   - No any types → "@typescript-eslint/no-explicit-any"
   Code review time is spent on architecture and logic, not style.

3. REACT QUERY ADOPTION (via ADR):
   Standardised server state management across all React modules.
   One pattern for data fetching, caching, invalidation.
   Engineers do not re-invent the pattern per module.
   Documented in ADR-014 (context, decision, rationale, consequences).
```

### Follow-up Q&A

**"How do you get a team to adopt a new practice or guideline?"**
> "I distinguish between practices that require active adoption (engineers must choose to do it) and practices that are built into the tooling (engineers do it automatically). For the latter — ESLint rules, TypeScript configs, CI checks — I just add them. They take effect immediately with no adoption required. For practices that require active adoption — like writing ADRs or using React Query — I do three things. First, I use the practice myself on the first PR that has a relevant decision, and make the PR the template others see. Second, I add it to the code review checklist — which gets reviewed on every PR. Third, I make it easy: I create a template for the ADR format so engineers do not have to think about structure. The friction of 'I don't know how to write an ADR' is eliminated. Adoption follows."

**"How do you measure whether a best practice is actually working?**"
> "By the symptom that motivated the practice in the first place. If I introduced a performance budget rule in CI because engineers were accidentally shipping large bundles, I measure: how often is a large bundle caught by CI vs slipping to production? If I introduced the React Query pattern to reduce duplicate API call bugs, I measure: how often do we have bugs caused by stale cache or duplicate requests? The practice is working if the symptom frequency drops. The practice is not working — regardless of whether it is documented or in a linter — if the symptom persists. I do a 'practice health check' quarterly: are the practices we have preventing the problems they were designed to prevent?"

---

## 🔗 Unified Narrative

> "The CRM platform work spans four dimensions that reinforce each other.
>
> Building the core modules (Lead, Contact, Deals, Territory, Users) gave me deep understanding of the business domain — I understood what a sales rep actually needs, not just what the requirements document says. That led directly to the user-centric improvements: territory auto-assignment, inline editing, pipeline performance.
>
> The MFE migration was the architectural centrepiece. We took a live, production-critical Ember monolith and migrated it module by module to React, using routing-based separation so that each team could deploy independently. The strangler fig pattern was the right choice — it meant no big-bang risk and no maintenance window.
>
> The framework upgrades — Ember Octane, Node LTS, React 18 — were the infrastructure work that keeps the platform healthy. They are not glamorous, but a team that avoids upgrades accumulates technical debt that eventually makes feature development painful. I led these because someone had to, and because I understood the risk management approach: incremental versions, codemods for automation, phased rollout, practised rollback.
>
> The best practices and guidelines are the multiplier that makes all of the above sustainable over time. ADRs so decisions are not lost when engineers leave. ESLint rules that enforce the checklist automatically. React Query adopted consistently so every engineer can understand every module's data-fetching pattern."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I worked on CRM modules" (too vague) | Name the modules: "Lead, Contact, Deals pipeline, Territory, Users" + one specific UX improvement for each |
| "We migrated to React MFE" | "Strangler fig pattern via Nginx routing — one module at a time, Ember as fallback for 2 weeks per module, feature flagged rollout" |
| Skip the Ember Octane difficulty | "Classic → Octane is a completely different programming model: .set() vs @tracked, Ember.Object.extend() vs native class. 200+ components, 3 months, codemods + manual review + lint enforcement" |
| "I wrote coding standards" | "I automated the checklist: ESLint rules make the wrong thing a CI failure. Manual checklists are inconsistently followed. Automated ones always fire." |
| Không đề cập ADR | "Every significant decision has an ADR committed to Git. New engineers read ADRs to understand WHY, not just WHAT." |

---

## 📊 Quick Facts

```
Product:   CRM platform (Lead, Contact, Deals, Users, Territory)
Key UX:    Inline editing (double-click to edit in pipeline), territory auto-assignment,
           activity log consistency across all modules, paginated+virtualised pipeline

MFE:       Ember 3.x monolith → React 17/18 MFEs
Pattern:   Strangler fig via Nginx routing (not iframes, not custom events)
Auth:      httpOnly session cookie on root domain — shared across all MFEs
Order:     Leads → Contacts → Deals → Territory → Users (complexity ascending)
Rollout:   Feature flag → 5% → 20% → 100% + 2-week Ember fallback per module

Upgrades:
  Ember:   Classic (.extend, .set, computed) → Octane (@tracked, @action, native class)
           200+ components, 3 months, codemods + lint enforcement
  Node:    Strict LTS-only policy, CI matrix (current + next LTS), staged rollout
  React:   16→17 (new JSX transform) → 18 (createRoot, auto-batching, startTransition)

Practices:
  ADR:         Architecture Decision Records — committed to Git, searchable, permanent
  ESLint:      Automated enforcement — no-console, exhaustive-deps, no-any, etc.
  React Query: Standardised server state — staleTime, invalidation, optimistic updates
  Review:      Categorised checklist: Code Quality, React, TypeScript, Performance, Testing
```

---

*Document last updated: June 2026 · CRM Platform Engineering interview preparation*
