# 🔧 Interview Guide — GitLab, Verify Domain
## Senior Frontend Engineer · Pipeline Editor · CI/CD Catalog · Rails→Vue.js Modernization

---

## 🔑 Context: The Verify Domain at GitLab

```
GITLAB'S DOMAIN STRUCTURE:
  GitLab is organized into product domains:
  - Plan:   Project management (issues, boards, milestones)
  - Create: Source code management (MR, code review, Wiki)
  - Verify: CI/CD pipelines — build, test, deploy automation  ← THIS DOMAIN
  - Release: Deployment management, feature flags, environments
  - Secure: Security scanning (SAST, DAST, dependency scanning)

THE VERIFY DOMAIN:
  CI/CD is GitLab's highest-value feature for enterprise customers.
  "Source of truth for DevOps" = the CI/CD pipeline.
  
  Key surfaces in Verify:
  - Pipeline list: every pipeline ever run on a project
  - Pipeline detail: the execution view (stages, jobs, logs)
  - Pipeline Editor: the YAML editor for .gitlab-ci.yml
  - CI/CD Catalog: marketplace of reusable CI components
  - CI Variables, Runner management, CI settings
  
WHY THIS DOMAIN IS IMPRESSIVE TO DISCUSS:
  "I worked on the feature that every developer uses every time they push code."
  Every GitLab commit triggers a pipeline. Every pipeline runs in Verify's surfaces.
  High-traffic, high-stakes, high-visibility.
  
  "The Pipeline Editor reduced the barrier to writing CI config from
  'edit YAML in a text editor, push, wait for the pipeline to fail,
  repeat' to 'visual editor with real-time validation and DAG visualization.'"
  That is a qualitative improvement to the developer experience
  of the entire GitLab user base.
```

---

## 1️⃣ Modernization — Replacing Legacy Rails + JavaScript

### What the legacy stack was and why it was a problem

```
THE LEGACY STACK (what I replaced):
  Server-side: Rails ERB templates
  Client-side: jQuery (or vanilla JavaScript for newer code)
  Data fetching: REST API + polling
  Testing: near-zero (jQuery code is effectively untestable)

RAILS ERB TEMPLATES:
  ERB (Embedded Ruby) is Rails' default template language.
  The server renders HTML for every request. The browser displays it.
  
  WHY ERB TEMPLATES ARE UNMAINTAINABLE FOR COMPLEX UIs:
  
  1. NO COMPONENT MODEL:
     ERB has partials, but they are not components.
     A "job card" partial in the pipeline view:
     app/views/pipelines/_job.html.erb
     This partial is not reusable across different pages without tight coupling.
     The pipeline list, the MR widget, and the pipeline editor all need job cards.
     In ERB: three separate implementations of the same UI, diverging over time.
     In Vue: one JobCard component, imported by all three.
  
  2. NO REACTIVITY:
     ERB renders at request time. If a job's status changes
     (from running to success), the page must reload to see the change.
     With jQuery: you poll the REST API every 5 seconds and update the DOM.
     This is slow (5s latency), expensive (server load from polling), and fragile.
  
  3. UNTESTABLE:
     Unit-testing jQuery code is a known problem in the industry.
     The Verify domain had ~23% frontend test coverage.
     Most of that was in the few Vue components that already existed.
     The jQuery code: zero unit tests. Engineers were afraid to refactor
     because any change could break something with no test to catch it.
  
  4. TIGHT COUPLING TO RAILS:
     ERB templates render Rails ActiveRecord objects directly.
     The frontend and backend are tightly coupled.
     If the backend model changes, the template breaks.
     No API contract. No type safety.

JQUERY:
  jQuery was the right tool in 2010 when browser APIs were inconsistent.
  In 2023, it is a liability:
  - Imperative: you write "find this element, change this attribute."
    React/Vue: you declare what the UI should look like, the framework updates it.
  - No component model: jQuery code is event handler spaghetti.
  - Mutation-based: you mutate the DOM directly.
    Debugging: why does this element have this class? Impossible to trace.
  - Not a data model: jQuery has no concept of application state.
    State is scattered across DOM attributes, global variables, event callbacks.
```

### The new stack — and why each choice was made

```
VUE.JS (Single File Components):
  Why Vue, not React?
  GitLab standardised on Vue in 2016. New components must use Vue.
  The choice was already made; my job was to apply it consistently.
  
  WHY VUE SFCs ARE A QUALITATIVE IMPROVEMENT:
  
  Reactive component model:
  A JobCard component receives job data as props.
  When the job status changes: Vue's reactivity system re-renders
  only the parts of the DOM that changed. No manual DOM manipulation.
  
  Component isolation:
  Each component has its own template, script, and scoped CSS.
  JobCard: the template, the logic, the styles are all in one file.
  Testable: mount JobCard with mock props, assert the rendered output.
  
  Composables (Vue 3):
  Shared logic extracted into composables (equivalent to React hooks).
  usePipelineStatus(): the status polling/subscription logic used by
  multiple views. Extracted once, used everywhere.

GRAPHQL (with Apollo Client, via @vue/apollo-composable):
  Why GraphQL over REST?
  
  The REST problem in Verify:
  The pipeline API endpoint returned the entire pipeline object:
  all jobs, all stages, all logs. Even if you only needed job names.
  Over-fetching: the network payload was always larger than necessary.
  
  GraphQL solution:
  Each Vue component declares exactly the fields it needs via a fragment.
  Apollo composes all fragments into one efficient query.
  JobCard declares: id, name, status, duration. Nothing else is fetched.
  
  Real-time via subscriptions:
  Instead of polling /api/v4/pipelines/:id every 5 seconds,
  a GraphQL subscription (WebSocket) streams status updates.
  Job status changes arrive in < 200ms (vs 5s with polling).
  No server load from polling. No client complexity from managing timers.

PAJAMAS DESIGN SYSTEM:
  GitLab's internal design system.
  Pre-built, accessible, consistently styled Vue components.
  GlButton, GlIcon, GlBadge, GlTooltip — the building blocks.
  
  Why this matters for the modernization story:
  Before: every ERB view had its own CSS for buttons, badges, icons.
  After: every Vue component uses Pajamas. Consistent visual language.
  No more "which shade of grey is the disabled button?"
  The design system answers that once, for everyone.
```

### The migration strategy — how "opportunistic migration" works

```
THE WRONG APPROACH: "Big bang migration"
  Stop all feature work for 3 months.
  Convert every ERB template to Vue.
  
  This never works:
  - Product teams need features shipped
  - 3 months of no features = business pressure to abandon the migration
  - Engineers are bored (no product work)
  - By the time you are done, new ERB templates have been added
  
THE RIGHT APPROACH: "Opportunistic migration"
  The rule: when a developer needs to add or change something in an ERB view,
  they convert that view to Vue first, then add the feature.
  
  This works because:
  - Feature work still ships (no 3-month pause)
  - The migration happens incrementally, alongside product work
  - Engineers develop the conversion skill through practice
  - By the end: every view that has received product attention is converted
    (and those are the views users actually use)
  - Views that no one has touched in 2 years: probably not critical
  
  THE DOCUMENTATION'S ROLE:
  The opportunistic strategy requires that every engineer knows how to convert.
  Without documentation: each engineer figures it out alone. 3x the effort.
  With documentation: the first developer learns it, writes the guide,
  every subsequent developer follows it. 1x the effort.
  
  This is why "documented these changes" is listed as a separate achievement —
  it is the force multiplier that makes the strategy work at team scale.
```

---

## 2️⃣ Pipeline Editor — Technical Deep Dive

### What the Pipeline Editor is

```
THE PROBLEM IT SOLVES:
  Before Pipeline Editor:
  1. Developer writes .gitlab-ci.yml in a text editor (no CI-specific syntax help)
  2. Commits and pushes to GitLab
  3. Pipeline runs
  4. Pipeline fails with a YAML syntax error or CI configuration error
  5. Developer reads the error, edits the file, pushes again
  6. Repeat until the pipeline runs correctly
  
  Average: 3-5 push cycles to get a first working pipeline.
  Each cycle: commit + push + wait for runner to pick up the job.
  Total time: 15-30 minutes of iteration on CI config.
  
  With Pipeline Editor:
  1. Developer opens the Pipeline Editor (in-browser)
  2. Real-time YAML validation: syntax errors shown instantly
  3. CI Lint: GitLab's engine validates the config server-side
  4. DAG visualization: see the pipeline structure before running
  5. Commit from the editor: one click
  6. Pipeline runs correctly on first (or second) try
  
  Result: +140% daily active users vs raw YAML editing.
  Developers adopted the editor because it eliminated the push-fail-fix loop.
```

### Monaco editor integration in Vue — the hard part

```
MONACO IS VS CODE'S EDITOR (not designed for Vue):
  Monaco is a standalone JavaScript library.
  It manages its own DOM node.
  It has its own event system.
  
  The challenge: integrate a DOM-managing library into Vue's reactivity system.
  
  NAIVE APPROACH (wrong):
  <div ref="editorContainer" />
  onMounted(() => {
    monaco.editor.create(editorContainer.value, { value: content });
  });
  Problem: if the parent component passes a new `content` prop,
  the Monaco editor does not update. It is disconnected from Vue's reactivity.
  
  CORRECT APPROACH:
  The key insight: Monaco owns the DOM. Vue owns the data.
  They communicate through a well-defined interface.
  
  onMounted(() => {
    editor = monaco.editor.create(container, { value: props.content });
    // Monaco → Vue: notify parent when content changes
    editor.onDidChangeModelContent(() => {
      emit("update:content", editor.getValue());
    });
  });
  
  watch(() => props.content, (newContent) => {
    // Vue → Monaco: push new content without recreating the editor
    // CRITICAL: use pushEditOperations, not setValue()
    // setValue() resets undo history and cursor position
    if (editor.getValue() !== newContent) {
      editor.pushEditOperations([], [{ range: fullRange, text: newContent }], null);
    }
  });
  
  beforeUnmount(() => {
    // CRITICAL: dispose() releases Monaco's memory.
    // Missing this = memory leak every time the editor is unmounted.
    editor.dispose();
  });
  
  YAML LANGUAGE SERVER INTEGRATION:
  Monaco supports custom language servers.
  I registered a YAML language server worker for .gitlab-ci.yml.
  This provides: syntax highlighting, auto-completion, hover documentation.
  The language server knows GitLab CI keywords (stages, jobs, image, script,
  rules, needs, environment) and provides context-aware suggestions.
```

### Two-level validation — the architecture that matters

```
WHY TWO LEVELS?
  Validation has a tension: speed vs accuracy.
  
  Client-side validation:
  + Instant feedback (< 50ms)
  − Limited: can only check structure, not CI semantics
  
  Server-side validation (CI Lint API):
  + Accurate: uses GitLab's actual CI engine
  + Checks: variable interpolation, include file resolution,
             runner tag availability, template inheritance
  − Slow: network round-trip + engine execution (500ms-2s)
  
  Using only client-side: fast but misses important errors.
  Using only server-side: accurate but user waits 500ms per keypress.
  
  SOLUTION: BOTH, in parallel, shown in different UI zones.
  
  LEVEL 1 — CLIENT-SIDE (every keypress):
  js-yaml parses the YAML.
  Custom validators run on the AST:
    - job references valid stage names
    - 'needs' references existing jobs
    - required fields present (script or trigger)
    - 'when' has valid value (on_success/on_failure/always/manual/delayed)
  Results shown as Monaco editor inline annotations (red squiggles).
  Latency: < 50ms.
  
  LEVEL 2 — CI LINT API (on save / debounced 2s after typing stops):
  POST /api/v4/ci/lint with the YAML content.
  GitLab's CI engine validates:
    - include: files exist and are accessible
    - Variables referenced exist (either in the YAML or known CI variables)
    - extends: templates exist and are valid
    - rules: expressions are syntactically valid
  Results shown in a "CI Lint" panel below the editor.
  Latency: 500ms-2s.
  
  USER EXPERIENCE:
  The user sees immediate inline feedback (client-side).
  When they pause typing, the CI Lint result updates (server-side).
  Two different UI zones, two different latencies, two different purposes.
  Neither replaces the other — they complement each other.
```

### DAG visualization

```
WHY A DAG VIEW?
  A CI/CD pipeline is a Directed Acyclic Graph:
  - Nodes: jobs
  - Directed edges: "needs" relationships (job B needs job A to complete first)
  - Acyclic: cycles (A needs B, B needs A) are invalid
  
  The stage-based view (stages as columns, jobs in each stage) is the
  simplified view. It is easy to understand but hides dependencies.
  
  The DAG view shows actual dependencies:
  If compile is in "build" stage but unit-tests "needs" compile,
  unit-tests can start as soon as compile finishes — not at the end of "build."
  This is the key DAG insight: DAG pipelines are faster than stage-based pipelines
  because jobs start as soon as their dependencies are done, not when the stage ends.
  
  WHAT I BUILT:
  - Parse the YAML into a job graph (nodes + edges from "needs" relationships)
  - Detect cycles: Kahn's algorithm (topological sort; if not all nodes are sorted, there is a cycle)
  - Render stages as column groups, jobs as cards, "needs" as SVG connecting lines
  - Highlight: if job X is selected, highlight all transitive dependencies
  
  CYCLE DETECTION:
  If job A needs job B and job B needs job A:
  CI Lint API will catch this. But the client-side validator catches it immediately.
  Cycles are shown as a red overlay on both job cards and the connecting edge.
  The user knows before the CI Lint API responds.
```

---

## 3️⃣ CI/CD Catalog — The Component Marketplace

### What the CI/CD Catalog is

```
THE PROBLEM:
  Every company using GitLab CI needs to:
  - Build and push Docker images
  - Deploy to AWS/GCP/Azure
  - Run security scans
  - Send Slack notifications
  - Apply Terraform configurations
  
  Before CI/CD Catalog:
  Every team wrote their own YAML for each of these.
  No sharing between teams, between companies.
  Thousands of teams solved the same problem independently.
  Quality varied: some were correct and maintained; most were not.
  
  WITH CI/CD CATALOG:
  Teams publish CI components to the Catalog.
  Other teams include them with one line:
  include:
    - component: gitlab-org/components/aws-deploy@~latest
  
  The component handles all the complexity.
  The consumer team writes ~5 lines instead of ~50.
  The component maintainer handles updates — consumers get improvements
  automatically on the next pipeline run.

THE TECHNICAL DESIGN:
  A CI component is: a YAML template + documentation + inputs schema.
  
  INPUTS (variables the consumer passes):
    inputs:
      service:
        type: string
        description: "ECS service name"
      strategy:
        type: string
        default: rolling
        options: [rolling, blue-green, canary]
  
  VERSIONING:
  Semantic versioning: major.minor.patch
  include: component@~latest    → resolves to latest minor/patch
  include: component@2          → resolves to latest 2.x.x
  include: component@2.4.1      → pinned to exact version
  
  Pinned versions are for production pipelines (stable).
  ~latest is for development (always current).
```

### GraphQL design — cursor pagination and why it matters

```
THE CATALOG QUERY:
  The catalog is a searchable, filterable list of components.
  Classic REST problem: GET /catalog?search=deploy&page=2
  
  OFFSET PAGINATION BUG:
  User loads page 1 (items 1-20).
  While reading page 1, a new popular component is added at the top.
  User loads page 2 (items 21-40) — but now the offset is wrong.
  Item 21 is what was item 20 before. User sees item 20 twice.
  
  CURSOR PAGINATION (what I implemented):
  The response includes a cursor for the last item.
  The next request says: "give me 20 items AFTER this cursor."
  Adding items at the top does not affect the cursor.
  The user never sees duplicate items.
  
  This is the correct design for a live data source.
  
  GRAPHQL DESIGN DECISIONS:
  1. Expose only what the UI needs:
     The component model in the database has many fields.
     The Catalog UI needs: name, description, version, download_count, verified, inputs.
     The GraphQL schema exposes exactly these. Nothing else.
     No over-fetching.
  
  2. Nested pagination:
     The query paginates components. Each component has a versions connection.
     For the catalog list: fetch first: 1 version (latest version only).
     For the component detail page: fetch all versions with version history.
     One query, different args, different amounts of version data.
  
  3. Verified tier:
     Components are either VERIFIED (by GitLab) or UNVERIFIED (community).
     This is a trust signal — enterprises use only verified components.
     The UI shows a badge. The GraphQL type exposes verificationLevel.
```

---

## 4️⃣ Documenting Changes and Assisting Other Teams

### What "documented the changes" actually means

```
WHAT DOCUMENTATION MEANS AT GITLAB:
  GitLab has a public handbook (handbook.gitlab.com).
  Engineering decisions are documented there, not in Confluence or Notion.
  The handbook is public — any engineer in the world can read it.
  
  FOR THE VERIFY DOMAIN MODERNIZATION:
  I wrote a handbook section: "Frontend modernization in the Verify domain."
  
  WHAT IT CONTAINS:
  1. Context: why we are migrating (the ERB/jQuery problems)
  2. The opportunistic migration strategy: when to migrate
  3. Step-by-step conversion guide: how to convert an ERB view to Vue SFC
  4. GraphQL migration patterns: 5 common REST→GraphQL conversions
  5. Testing requirements: what tests are required for a migrated component
  6. The MR checklist: what reviewers check in modernization PRs
  7. Examples: two complete before/after conversions with explanation
  
  WHY THIS IS AN ACHIEVEMENT (not just "writing docs"):
  The documentation is what enables the strategy to scale.
  Without it: each engineer who wants to modernize spends 3-4 days
  figuring out the patterns. Then forgets them and re-figures-out later.
  With it: each engineer spends 2 hours reading, then starts contributing.
  3-4 days × N engineers vs 2 hours × N engineers = the value of the doc.

ASSISTING OTHER TEAMS:
  "Other teams" = engineers in Plan, Release, Create domains
  who have the same ERB legacy and want to modernize.
  
  HOW I ASSISTED:
  
  1. OFFICE HOURS:
     Weekly 45-minute session (optional, open to all).
     Engineers bring specific questions: "How do I convert this partial?"
     Answer once in public → the recording benefits everyone who asks later.
  
  2. MR REVIEWS WITH TEACHING COMMENTS:
     When another team's engineer opens a modernization MR:
     I review with explanatory comments.
     Not: "Change line 12 to X."
     But: "Change line 12 to X because Vue's reactivity system works by tracking
           reactive dependencies during a component's render function execution.
           Your current approach reads from a non-reactive source, so Vue
           cannot detect the change."
     The engineer understands WHY. They won't make the same mistake again.
  
  3. PAIRING SESSIONS (one per team):
     One pairing session when a team starts their first migration.
     I navigate, they drive. They do the conversion; I explain as they go.
     After one session: the team can continue independently.
  
  RESULT:
  3 other domains (Plan, Release, Create) adopted the Verify modernization patterns.
  The patterns are now the GitLab standard for frontend modernization.
  Not just "the Verify way" — the GitLab way.
```

---

## STAR Scripts

### Modernization

```
SITUATION:
  The GitLab Verify domain frontend had significant technical debt.
  47+ ERB templates with embedded jQuery: no reactivity, near-zero test coverage
  (23%), 5-second polling for real-time data, and no component reuse model.
  Engineers were afraid to change code because any change could break
  something with no test to catch it.
  The debt was slowing feature delivery.

TASK:
  As Senior Frontend: modernize the Verify domain frontend stack
  (ERB + jQuery → Vue.js + GraphQL) while continuing to ship product features.
  Document the patterns and assist other teams in adopting them.

ACTION:
  Established opportunistic migration strategy: convert ERB views to Vue
  when adding or changing functionality, without stopping feature work.
  
  Wrote the technical guide: migration framework, step-by-step conversion,
  GraphQL patterns, testing requirements, MR review checklist.
  
  Ran weekly office hours for cross-team adoption.
  Reviewed modernization MRs for Plan, Release, Create domain engineers
  with teaching comments explaining the patterns.
  
  Delivered Pipeline Editor and CI/CD Catalog during the migration period —
  both built on the modern stack, demonstrating the patterns in production.

RESULT:
  47 ERB views converted to Vue SFCs.
  Frontend test coverage: 23% → 81%.
  Job status update latency: 5s (polling) → 200ms (GraphQL subscription).
  3 other domains adopted the Verify modernization patterns.
  Patterns became the GitLab standard for frontend modernization.
```

### Pipeline Editor

```
SITUATION:
  GitLab developers writing CI config faced a painful iteration loop:
  write YAML → push → wait for pipeline → fail → fix → repeat.
  3-5 cycles per developer for a first working pipeline.
  No in-browser editing experience. No real-time validation.

TASK:
  Build the Pipeline Editor: a Monaco-based YAML editor with real-time
  validation, CI Lint integration, and DAG visualization.

ACTION:
  Monaco integration: custom Vue wrapper managing Monaco's lifecycle
  (mount, dispose, reactive content sync without undo history loss).
  
  Two-level validation:
  Client-side (< 50ms): js-yaml + custom AST validators for immediate feedback.
  Server-side CI Lint API (500ms-2s): GitLab's engine for semantic accuracy.
  Both shown simultaneously in different UI zones.
  
  DAG visualization: parse YAML into job graph, detect cycles (Kahn's algorithm),
  render stages as columns, jobs as cards, "needs" as SVG edges.
  Highlight transitive dependencies on selection.

RESULT:
  +140% daily active users vs raw YAML editing.
  Developers adopted the editor — the push-fail-fix loop was eliminated.
  The editor became GitLab's recommended way to write CI configuration.
```

---

## Follow-up Q&A

**"Why did you choose Vue.js for the modernization, not React?"**
> "GitLab standardised on Vue.js in 2016. By the time I was working on the modernization, Vue was already the established choice for new frontend components at GitLab. My job was not to choose between Vue and React — it was to apply Vue consistently across a domain that had not yet migrated. That said, I can speak to why Vue was a reasonable choice for GitLab's context: Vue's Single File Component format (template, script, style in one file) is very learnable for engineers coming from Rails ERB templates. The mental model is familiar: a template that renders data. The jump from ERB to Vue is smaller than the jump from ERB to React's JSX. For a large organisation with hundreds of engineers at different frontend experience levels, Vue's gentler learning curve was an advantage."

**"What was the hardest part of the Monaco editor integration?"**
> "Two things. First, the reactive content sync. Monaco owns the DOM and its own model. When I want to push new content from Vue's reactive system into Monaco, I cannot call setValue() — that resets the editor's undo history and cursor position, which is jarring for users. I had to use pushEditOperations() with the delta of what changed, preserving cursor position and undo stack. Second, memory management. Monaco creates a WebGL canvas and allocates significant memory for its language services. If you unmount the Vue component without calling editor.dispose(), you have a memory leak. The dispose call is easy to forget — you don't notice the leak in development (the page is refreshed frequently), but in production with long user sessions, it accumulates. I added a lint rule to enforce that every component using Monaco has a dispose call in beforeUnmount."

**"How did you decide which ERB views to migrate first?"**
> "The opportunistic strategy meant: we did not pick an order. The order was determined by product priorities. Whichever view was being modified for a feature: that view gets migrated first. But there was a second criterion: impact. We wanted early wins that demonstrated the value of the migration. The pipeline job status view — the component that shows running/success/failed for each job — was both high-traffic and frequently modified. Migrating it early had two benefits: first, users immediately saw the improvement (real-time status via GraphQL subscription instead of 5-second polling). Second, the job card component became reusable: the same component was used in the pipeline list, the MR widget, and eventually the Pipeline Editor. That single migration replaced three separate ERB implementations with one Vue component. Showing that multiplier effect early helped build team support for the migration."

**"How do you measure whether the documentation actually helped other teams?"**
> "Two ways. First, adoption: I tracked whether other domain teams opened modernization MRs that followed the patterns. Within 6 months: Plan, Release, and Create domains all had engineers converting ERB views using the Verify guide. That is adoption. Second, the quality of questions in office hours. In the first month: questions were basic — how do I create a Vue SFC, what goes in script setup. By month three: questions were sophisticated — how do I handle optimistic updates in Apollo, how do I test a composable that uses provide/inject. The sophistication of questions is a signal that the documentation handled the basics well enough that engineers could get through the fundamentals independently and were now solving the harder problems."

---

## 🔗 Unified Narrative

> "At GitLab in the Verify domain, my work fell into two categories: improving how we work, and shipping features that improve how users work.
>
> The modernization was the first category. The Verify domain had 47+ ERB templates with jQuery — untestable, unreactive, 5-second polling. I did not stop feature work for a big-bang migration. I established an opportunistic strategy: convert each view as you touch it. I wrote the documentation that made this strategy scale beyond just my own work. Three other domains adopted the patterns. Test coverage went from 23% to 81%. Polling latency went from 5 seconds to 200 milliseconds. That is the improvement to how we work.
>
> The Pipeline Editor and CI/CD Catalog are the improvements to how users work. The Pipeline Editor eliminated the push-fail-fix loop that every developer writing CI config faced. Two-level validation (client-side for speed, CI Lint API for accuracy), Monaco editor with YAML language server, DAG visualization showing actual job dependencies — these together turned a frustrating iteration process into an interactive authoring experience. +140% daily active users means developers chose the editor over raw file editing. The CI/CD Catalog turned reusable CI patterns from a copy-paste problem into a versioned, searchable, include-in-one-line solution.
>
> The thread connecting all of it: documentation and adoption. I built the modernization guide. I ran office hours. I reviewed cross-team MRs with teaching comments. The goal was not just to modernize the Verify domain — it was to establish the pattern that would modernize GitLab's entire frontend codebase, domain by domain."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I replaced old code with new code" | "I replaced **ERB templates + jQuery** (server-rendered, no reactivity, 23% coverage, 5s polling) with **Vue SFC + GraphQL subscriptions** (reactive, 81% coverage, 200ms real-time). Opportunistic strategy: migrate as you touch, no feature pause." |
| "I built a YAML editor" | "**Pipeline Editor**: Monaco Vue wrapper (pushEditOperations, not setValue — preserves undo/cursor), **two-level validation** (client-side js-yaml < 50ms + CI Lint API 500ms-2s, different UI zones), **DAG** (Kahn's cycle detection, SVG edges, transitive dependency highlighting). +140% DAU." |
| "I built a component catalog" | "**CI/CD Catalog**: GraphQL with **cursor pagination** (not offset — stable for live data), component versioning (semver, @~latest vs pinned), inputs schema, verified trust tier. Turns 50-line copy-pasted YAML into 5-line include." |
| "I documented things" | "**Wrote the GitLab handbook section** that 3 other domains used to migrate. **Ran weekly office hours**. **Reviewed MRs with teaching comments** (not 'change this' but 'change this because'). The doc is the multiplier — N engineers × 2h vs N × 3-4 days." |
| "I helped other teams" | "**Plan, Release, Create domains** adopted Verify patterns. Now the **GitLab standard** for frontend modernization, not just the Verify way. Visible in the public GitLab handbook." |

---

## 📊 Quick Facts

```
Company: GitLab
Role:    Senior Frontend Engineer, Verify Domain (CI/CD pipelines)

MODERNIZATION:
  Legacy:  Rails ERB templates + jQuery + REST polling
  Modern:  Vue.js SFCs + GraphQL subscriptions + Pajamas DS
  Strategy: Opportunistic migration — convert when adding/changing functionality
  Results:
    ERB views converted:   47
    Test coverage:         23% → 81%
    Status update latency: 5s (polling) → 200ms (GraphQL subscription)
    Cross-domain adoption: Plan, Release, Create domains
    Standard:              Now the GitLab-wide frontend modernization standard

PIPELINE EDITOR:
  Monaco integration: custom Vue wrapper, pushEditOperations (not setValue), dispose() in beforeUnmount
  Validation level 1: js-yaml + custom AST validators → Monaco inline annotations (< 50ms)
  Validation level 2: CI Lint API → server-side GitLab engine → separate lint panel (500ms-2s)
  DAG: Kahn's topological sort for cycle detection, SVG edges, transitive dependency highlighting
  YAML language server: CI keywords autocomplete, hover documentation
  Adoption: +140% DAU vs raw YAML editing

CI/CD CATALOG:
  Purpose: Reusable CI components — include in one line instead of 50 lines
  GraphQL: cursor pagination (stable for live data), nested versions connection, verificationLevel enum
  Component features: semver versioning (@~latest or pinned), typed inputs, verified/unverified tier
  At launch: 200+ components (official + community)

DOCUMENTATION & CROSS-TEAM:
  GitLab handbook section: migration framework, patterns, testing requirements, MR checklist
  Weekly office hours: open Q&A for all domains
  MR reviews with teaching comments: reasoning, not just corrections
  3 domains adopted patterns; became GitLab standard
```

---

*Document last updated: June 2026 · GitLab Verify Domain interview preparation*
