# 🔧 Interview Guide — Platform / Frontend Infrastructure Engineering
## Component Library · CI Check System (30+) · Data Reporting · Scaffolding Tool

---

## 🔑 Context: Platform Engineering vs. Product Engineering

```
PRODUCT ENGINEER: builds features for end users (customers, partners).
PLATFORM ENGINEER: builds tools and infrastructure for other engineers.

THE DIFFERENCE IN IMPACT:
  Product engineer ships Feature X → one team's users benefit.
  Platform engineer ships shared CI check system → 30+ teams benefit.
  Platform engineer fixes a bug in the component library → 34 teams get the fix.

WHY THIS IS SENIOR/STAFF-LEVEL WORK:
  Platform engineering requires:
  1. Understanding other teams' problems well enough to solve them generically.
  2. Building APIs and tools that are flexible enough for diverse use cases.
  3. Convincing other teams to adopt your solution (adoption requires trust).
  4. Maintaining backward compatibility (other teams depend on your API contract).
  
  A bad product feature: affects one team's users.
  A breaking change in a shared library: breaks 34 teams simultaneously.
  The responsibility is higher. The impact is higher.

WHAT "SIGNIFICANTLY IMPROVING RELIABILITY ACROSS 30+ PROJECTS" MEANS:
  Before: each of 30+ projects had its own ad-hoc quality checks (or none).
  After: every project has the same CI gates — bundle size, coverage, performance.
  One engineer changes the shared CI workflow → 30+ projects improved.
  This is the multiplier effect of platform work.
```

---

## 1️⃣ Shared Front-End Component Library

### Leading development AND adoption — the two separate challenges

```
BUILDING THE LIBRARY (the easier part):

  WHAT THE LIBRARY PROVIDES:
  - UI Components: Button, Input, Select, Checkbox, Radio, Modal, Toast,
    DataTable, Avatar, Badge, Card, Tabs, DatePicker, FileUpload, ...
  - Design tokens: colors, spacing, typography, border radii, shadows.
    Defined once. All components use tokens. No hardcoded #0066ff in components.
  - Storybook: every component has stories for every variant, state, and size.
  - TypeScript: full prop types. Generics where appropriate (DataTable<TRow>).
  - Accessibility: ARIA attributes, keyboard navigation, focus management.
    Every component passes aXe automated accessibility audit.
  - Tree-shaking: import { Button } → only Button is bundled. Not the entire library.
    This requires: named exports, no side-effect-causing code at module level.
  
  VERSIONING STRATEGY:
  Semantic versioning: X.Y.Z
  X (major): breaking changes. Prop renamed. Behavior changed. Component removed.
  Y (minor): new features. New component added. New prop added (optional with default).
  Z (patch): bug fixes. Accessibility fix. Visual regression fix.
  
  The version contract is a PROMISE to consumers.
  If I bump minor: no consumer code needs to change.
  If I bump major: consumers must update. Cost: migration effort.
  Keep major version bumps rare (once or twice per year).
  
ADOPTING THE LIBRARY (the harder part):

  WHY ADOPTION IS HARD:
  Teams have existing components. Migrating is work.
  "We'll migrate when we have time." → never.
  The library competes with feature development for engineering time.
  Without a strategy: the library exists but is used by 3 teams out of 20.
  
  ADOPTION STRATEGY:
  
  1. DOGFOOD FIRST:
     Our team adopted the library for our own project first.
     Worked out rough edges: TypeScript type issues, missing props, styling bugs.
     Fixed them before other teams encountered them.
     
     When we pitched to other teams: "We've been using it for 3 months.
     Here are the pain points we fixed. It's ready."
     Credibility: we use our own tool. We feel the same pain you would feel.
  
  2. STORYBOOK AS THE PITCH:
     Instead of: "Read our documentation."
     We said: "Go to storybook.company.com and click around for 5 minutes."
     Storybook renders every component interactively.
     Teams evaluate the library by using it, not reading about it.
     "Oh, the DataTable has sorting built in? We spent a week building that ourselves."
     
     A Storybook that looks good is the best sales pitch.
  
  3. MIGRATION SUPPORT FOR EARLY ADOPTERS:
     The first 3 teams: we provided hands-on support.
     Pair programming sessions: we migrated their first 5 components together.
     After those 5: they understood the patterns. Migrated the rest independently.
     
     Lesson: the first few components are the hardest. After that: it's mechanical.
     The migration support investment (2-3 days per team) unlocked adoption.
  
  4. CODEMOD FOR BREAKING CHANGES:
     v3.0.0: renamed Button's size prop.
     Before: size="small" | "medium" | "large"
     After: size="sm" | "md" | "lg"
     
     Without a codemod: every team must manually find+replace across their codebase.
     Grep for: `size="small"` → replace with `size="sm"`. N times. Error-prone.
     
     With a codemod:
     npx @company/ui-codemod v3 ./src
     
     The codemod: reads the AST (abstract syntax tree) of each file.
     Finds: Button components with size="small" or size="medium" or size="large".
     Replaces: the size value with the new format.
     Does this reliably, for every file, in seconds.
     
     Teams upgraded v3 without manual migration effort.
     Result: teams were willing to upgrade to a major version quickly.
     Without a codemod: teams would stay on the old major version for months.

THE ISSUE RESOLUTION EFFICIENCY INSIGHT:
  
  WITHOUT A SHARED LIBRARY:
  Bug: "Button's border radius is wrong on Safari."
  This bug exists in: 34 different Button implementations across 34 teams.
  Each team's QA finds it at a different time.
  Each team's engineer fixes it separately.
  34 duplicate bug reports. 34 duplicate fixes. 34 deployments to fix the same bug.
  Time to full resolution: weeks (each team on their own schedule).
  
  WITH A SHARED LIBRARY:
  Bug: same Button border radius issue.
  1 engineer fixes it in @company/ui.
  1 PR. 1 review. 1 version bump: v3.2.1.
  34 teams bump their dependency: bump @company/ui 3.2.0 → 3.2.1.
  All 34 are fixed. In one Renovate PR cycle (same day in most teams).
  
  Time to full resolution: 1 day (the fix + teams upgrading).
  
  "Enhancing issue resolution efficiency" = this.
  One fix → all teams protected. Simultaneously. Automatically.
```

---

## 2️⃣ CI Reliability/Performance Check System

### Standardizing quality across 30+ projects

```
THE PROBLEM BEFORE:
  30+ web projects in the organization.
  Each team: makes their own decisions about CI quality gates.
  Some teams: no bundle size check. Bundle grows unchecked.
  Some teams: no test coverage minimum. Coverage drops to 30%.
  Some teams: no performance check. LCP is 4 seconds. Nobody notices.
  
  Quality degrades silently, per team, at different rates.
  Engineering leadership: no visibility across teams.
  "Which teams have a bundle problem? Which have a coverage gap?"
  No central answer.

THE SOLUTION — CENTRALIZED CI CHECK SYSTEM:
  
  A shared GitHub Actions workflow stored in a central repository.
  Every project's CI references the shared workflow.
  
  # In every project's .github/workflows/ci.yml:
  jobs:
    quality-checks:
      uses: org/shared-workflows/.github/workflows/quality.yml@main
      with:
        bundle-limit-kb: 300
        coverage-threshold: 80
        lighthouse-threshold: 85
  
  The shared workflow (in org/shared-workflows) runs:
  1. Build the project
  2. Measure bundle size → compare to bundle-limit-kb
  3. Run tests → measure coverage → compare to coverage-threshold
  4. Run Lighthouse CI → measure performance score → compare to lighthouse-threshold
  5. Post results as PR comment (color-coded: ✓ green / ⚠ yellow / ✗ red)
  6. Send metrics to the data reporting system
  7. Pass or fail the CI based on gate levels

GATE LEVELS — WHY THREE LEVELS:
  
  PASS (green): metric is within acceptable range. No action needed.
  WARN (yellow): metric is approaching the limit. Awareness, not blocking.
  FAIL (red): metric exceeded the threshold. PR blocked. Must fix.
  
  WHY WARN EXISTS (not just pass/fail):
  If everything either passes or fails: teams start ignoring FAIL.
  "It always fails. The threshold is too strict."
  WARN: "you're close to the limit. Fix before it becomes a FAIL."
  Warn → teams self-correct before hitting the wall.
  
  Alert fatigue prevention:
  If too many things FAIL for legitimate reasons: engineers learn to ignore CI.
  "It's probably a false positive." → engineers start merging despite red CI.
  Carefully calibrated thresholds prevent this.

HOW THRESHOLDS ARE SET PER PROJECT:
  
  Not every project has the same needs.
  A simple landing page: 100KB bundle limit is reasonable.
  A complex data-heavy dashboard: 400KB may be unavoidable.
  
  Projects define their own bundle-limit-kb in the ci.yml configuration.
  The shared workflow enforces whatever limit the project sets.
  
  But: projects cannot change coverage-threshold or lighthouse-threshold.
  These are set centrally. All projects have the same minimum quality floor.
  
  WHY:
  If teams can set their own coverage threshold: they set it to 0%.
  The coverage gate exists for the organization. Not for individual team preference.

WHAT CHANGED WITH "IMPROVED RELIABILITY":
  
  Before: CI sometimes passes, sometimes fails, for non-code-related reasons.
  Engineers re-run CI on failures. "Might be flaky."
  
  After:
  - Deterministic tests (flaky tests eliminated — see TERA SE III guide).
  - Performance metrics stable (Lighthouse measures real page load).
    Previously: Lighthouse ran on a different machine with different resources each time.
    Fixed: Lighthouse CI with throttling enabled (simulates a consistent network).
    CPU slowdown: 4× (simulates a mid-range phone). Consistent results run to run.
  - Bundle size: consistent (build output is deterministic — same code = same bundle).
    Previously: some teams saw "bundle size varies by ±20KB between builds."
    Root cause: webpack bundle IDs assigned non-deterministically.
    Fixed: deterministic module IDs in the webpack/Rspack config.

THE LEVERAGE:
  One update to the shared workflow → all 30+ projects get the improvement.
  Example: added Lighthouse with CPU throttling to prevent inconsistent results.
  Changed 1 file in org/shared-workflows.
  All 30+ projects now run Lighthouse with consistent throttling.
  
  This is the same leverage as the component library:
  fix once → all teams benefit.
```

---

## 3️⃣ Data Reporting System

### Making performance visible to create accountability

```
THE CORE INSIGHT:
  You cannot fix what you cannot see.
  And: when teams see their own numbers, they fix them without being told to.
  
  The data reporting system is not a performance optimization tool.
  It is a visibility tool. Optimization follows visibility automatically.

WHAT THE REPORTING SYSTEM COLLECTS (from every CI run):
  
  For every PR and every main branch merge:
  - Bundle size: total JS, total CSS, per-chunk breakdown.
    Per-chunk: identifies which feature/route is responsible for size growth.
  - Lighthouse metrics:
    LCP (Largest Contentful Paint): when the main content is visible.
    CLS (Cumulative Layout Shift): page stability during load.
    FID/INP (First Input Delay / Interaction to Next Paint): responsiveness.
    TBT (Total Blocking Time): JS blocking the main thread.
    Performance score: composite of the above.
  - Build time: developer productivity metric.
  - Test coverage percentage.
  - Dependency count + vulnerability count.
  
  Stored: with timestamp, project name, commit SHA, PR number.
  
  Queryable: "Show me hotel-search bundle size over the last 90 days."
  "Which commit caused the bundle to grow by 200KB?"
  (Answer: find the commit where the metric spiked.)

HOW IT REDUCED LOAD TIMES AND BUNDLE SIZES:
  
  The reporting system did not reduce load times directly.
  It created the conditions where teams reduced their own load times.
  
  SEQUENCE OF EVENTS:
  1. Reporting system launched. Teams see their metrics for the first time.
  2. Team lead: "Our bundle is 1.2MB. The category average is 310KB."
     (The dashboard shows per-project AND category averages for context.)
  3. Team: "How did it get to 1.2MB? Let's look at the per-chunk breakdown."
     Chunk: vendor.js is 800KB. React + 12 other libraries.
  4. Discovery: they imported all of lodash: import _ from "lodash"
     But only used 3 functions. Tree-shakeable alternative: import { groupBy } from "lodash-es"
     Or: replace 3 lodash functions with native equivalents.
  5. Fix: replaced lodash with native + lodash-es. Bundle: 1.2MB → 580KB.
  6. More fixes: dynamic import for the analytics dashboard (loaded on navigation, not upfront).
     Bundle: 580KB → 338KB.
  7. Result: LCP went from 4.2s → 1.9s.
  
  The team made these discoveries on their own, driven by seeing their own data.
  
  THE DASHBOARD SHOWS:
  - All projects ranked by bundle size (largest to smallest).
    Embarrassment is a motivator: "We're the worst in the org."
  - Trend lines: "bundle is growing 20KB per week." Warning before it becomes critical.
  - Regression alerts: "booking-flow bundle grew 150KB in the last PR."
    Automated Slack notification. Team investigates before merge is forgotten.
  - Before/after: "analytics-dash bundle reduced from 1480KB to 338KB. −77%."
    Visibility of wins is also important. Teams celebrate their improvements.

REGRESSION DETECTION:
  The most valuable feature.
  
  Without regression detection:
  A team ships a feature that adds 200KB to the bundle.
  Nobody notices until the next performance audit (quarterly).
  3 months of slow performance.
  
  With regression detection:
  PR is opened. CI builds the bundle.
  Bundle increased by 198KB compared to main.
  Automated comment on the PR: "⚠ Bundle size increased by 198KB.
  Largest new chunk: analytics-sdk-v2.js (185KB).
  Review if this dependency is needed."
  
  The engineer sees this before merging. Investigates.
  "Oh, I imported the entire analytics SDK for one tracking call.
  Let me use the lightweight version."
  Bundle regression: caught and fixed before it shipped.
```

---

## 4️⃣ Scaffolding Tool

### From 3-5 days of setup to 12 seconds

```
THE PROBLEM BEFORE:
  New project setup: 3-5 days of boilerplate work.
  
  What those days included:
  - Configure TypeScript (tsconfig.json with correct options)
  - Configure the bundler (webpack config, loaders, plugins)
  - Configure ESLint (rules, plugins, ignore patterns)
  - Configure Prettier (formatting rules)
  - Set up Husky (pre-commit hooks: lint, format, type-check)
  - Configure Jest/Vitest (transformers, module resolution, coverage)
  - Set up CI/CD (GitHub Actions: build, test, deploy)
  - Add CI quality gates (bundle size, coverage) — often forgotten
  - Install and configure the component library
  - Set up path aliases (no more ../../..)
  - Configure environment variables
  - Create the folder structure
  
  Engineers copy from an old project.
  The old project's quirks come along: that project's webpack config has
  3-year-old workarounds for issues that no longer exist.
  Each project is a unique snowflake.
  
  Common result: "We couldn't set up CI in time for the launch, we'll add it later."
  "Later" often never comes.

AFTER — THE SCAFFOLDING TOOL:
  
  npx create-fe-app my-dashboard --template react-ts
  
  12 seconds later: a production-ready project.
  All configuration is correct and up-to-date.
  All quality gates are configured from day 1.
  CI is running before the engineer writes a single line of product code.
  
  WHAT IS AUTO-CONFIGURED:
  
  Build:
  - Vite (or Next.js for the SSR template)
  - TypeScript with strict mode (no implicit any, strict null checks)
  - Path aliases: @/components → src/components
  
  Testing:
  - Vitest + React Testing Library
  - MSW (Mock Service Worker) pre-configured for API mocking
  - Coverage threshold: 80% (same as the CI gate)
  
  Code quality:
  - ESLint with the shared @company/eslint-config
    (includes: react rules, accessibility rules, security rules, import rules)
  - Prettier with shared @company/prettier-config
  - Husky pre-commit: lint + type-check (catches issues before CI)
  - lint-staged: only lints changed files (fast)
  
  CI/CD (GitHub Actions):
  - Build and test workflow
  - Quality gates: bundle size, coverage, Lighthouse CI
  - PR comment with results (the CI check system)
  - Deploy to staging on PR (for review)
  - Deploy to production on main merge
  
  Component library:
  - @company/ui pre-installed
  - Provider component wrapped around the app (theme, toast, etc.)
  
  Environment:
  - .env.local for local development
  - .env.staging and .env.production with correct variable names
  - Vite's import.meta.env typed (no string access without type safety)

TEMPLATE VARIANTS:
  
  --template react-ts (standard web app):
  The default. Vite, Vitest, React, TypeScript. For SPAs.
  
  --template next-ts (SSR application):
  Next.js App Router. tRPC-ready. SSR/SSG/ISR configured.
  For: public-facing pages that need SEO.
  
  --template lib (publishable package):
  Rollup build (not Vite/webpack). Generates ESM + CJS + TypeScript declarations.
  TypeDoc for documentation generation.
  For: internal packages that are imported by other projects.
  
  --template micro-fe (Module Federation remote):
  Rspack with Module Federation plugin pre-configured.
  The remote exposes components to a host application.
  For: teams contributing to a micro-frontend architecture.

WHY THE SCAFFOLDING TOOL IS A PLATFORM ENGINEERING ACHIEVEMENT:
  
  It encodes 2 years of learnings into a template.
  New teams get the benefit of:
  - The CI quality gates (from the CI reliability project).
  - The component library (pre-installed and configured).
  - The data reporting integration (metrics automatically sent to the dashboard).
  - The testing patterns (MSW, Vitest, coverage configuration).
  - The security configuration (dependency audit, Semgrep-compatible ESLint rules).
  
  Without reading any documentation.
  Without pairing with anyone.
  By typing one command.
  
  "Streamlining MVP development" = this.
  Teams go from "we need to set up the project" to "we're writing features" in 12 seconds.
  The organizational knowledge about how to build good web projects is now executable.
```

---

## STAR Scripts

### Shared Component Library

```
SITUATION:
  Multiple teams across the organization were building the same UI components independently.
  A Button component bug required fixing in N different codebases.
  Inconsistent UX across products. No shared design tokens.

TASK:
  Lead the development and adoption of a shared component library
  that all frontend teams would use as the single source of truth for UI components.

ACTION:
  Built @company/ui: 58 TypeScript components with Storybook stories, design tokens,
  ARIA accessibility, and tree-shaking support.
  Adoption strategy: dogfooded in our own product, then offered pair programming sessions
  to early adopters. Provided codemods for every major version's breaking changes.
  Grew adoption from 3 to 34 teams over 4 quarters.

RESULT:
  34 teams on the shared library. UI consistency across all products.
  Bug fixed in @company/ui → 34 teams protected in one release cycle.
  Before: same bug fixed 34 times separately. After: fixed once, deployed everywhere.
  Issue resolution time: weeks (per team) → 1 day (one fix, one PR).
```

### CI Reliability/Performance Check System

```
SITUATION:
  30+ web projects had inconsistent or missing quality gates.
  Some projects had no bundle size limit: bundles growing unchecked.
  Some had no test coverage requirement. Performance regressions undetected.
  Engineering leadership: no visibility into cross-team quality state.

TASK:
  Build a centralized CI quality gate system that applies consistent standards
  across all 30+ projects without each team needing to configure it independently.

ACTION:
  Built a shared GitHub Actions workflow in org/shared-workflows.
  Each project references the shared workflow with project-specific limits
  (bundle-limit-kb, coverage-threshold, lighthouse-threshold as inputs).
  Shared workflow: builds, tests, runs Lighthouse CI, posts color-coded PR comments,
  reports to the data reporting dashboard.
  Fixed Lighthouse consistency: added CPU throttling to normalize results across CI machines.
  Fixed bundle non-determinism: deterministic module IDs in build config.

RESULT:
  30+ projects on the system. Consistent quality gates across the organization.
  One workflow change → all 30+ projects improved simultaneously.
  Reliability: CI passes/fails are now deterministic. Re-runs eliminated.
  Bundle regressions: caught at PR time before they ship.
```

---

## Follow-up Q&A

**"How did you convince other teams to adopt the component library?"**
> "The honest answer: I didn't convince them with arguments. Arguments don't work for adoption. What worked was removing the adoption barrier. Three things: First, we used the library ourselves. When teams asked 'does this actually work?', I could say 'we've used it in production for 3 months. Here are the issues we found and fixed.' Second, Storybook. I sent teams a link to storybook.company.com and said 'spend 5 minutes clicking around.' They came back saying 'the DataTable has sorting built in? We spent a sprint building that ourselves.' That's a better pitch than any slide deck. Third, migration support. For the first 3 teams: we sat with them and migrated their first 5 components together. After those 5, they could do the rest themselves. The support investment was maybe 2 days per team. The return: a team that goes from skeptic to advocate. Those teams then told other teams."

**"How do you handle a team that doesn't want to upgrade to a major version?"**
> "First: understand why. Usually it's one of: 'we don't have time,' 'we're afraid of breaking changes,' or 'the codemod didn't handle our specific pattern.' 'We don't have time' is legitimate — respect it. Set a sunset date for the old major version (e.g., 6 months of overlap). Give teams enough runway. 'Afraid of breaking changes': the codemod handles 95% of cases. I offer to review the remaining 5% with them. Usually 30 minutes of work. 'Codemod missed something': fix the codemod. When you discover a pattern the codemod doesn't handle, it means another team has the same pattern. Fix it once, the codemod handles it everywhere. The principle: my job is to make upgrading easy, not to force it."

**"How did the data reporting system reduce load times — you didn't change any product code?"**
> "Correct. The reporting system is a visibility tool, not an optimization tool. The optimization was done by the product teams, but only after they saw their numbers. Before the dashboard, teams didn't know their bundle was 1.2MB. Not because they didn't care — because it wasn't visible. The dashboard made the size impossible to ignore. The team lead saw their project ranked last by bundle size. That's uncomfortable. Within a week: the team audited their dependencies, found an accidental full-lodash import, switched to tree-shakeable imports, and added code splitting. Bundle: 1.2MB → 338KB. LCP: 4.2s → 1.9s. None of that required my involvement. The visibility created the accountability. The accountability drove the action."

**"What's the difference between a scaffolding tool and just a project template?"**
> "A project template is a static snapshot: you copy it once, then it diverges. A scaffolding tool is living: it pulls from the latest version of shared configurations every time you use it. When the ESLint config is updated — new rules added, outdated rules removed — the next project created with the scaffolding tool gets the latest config automatically. Also: a scaffolding tool can run interactively — 'Do you want SSR? What's your bundle size limit?' — and generate the appropriate configuration for each answer. A template cannot do that. Finally: the scaffolding tool integrates the entire platform. It installs @company/ui, connects to the CI system, sets up the data reporting integration. A template is a starting point. The scaffolding tool is 'the complete platform in one command.'"

---

## 🔗 Unified Narrative

> "Platform engineering work is defined by leverage. The component library: I wrote a component once, and 34 teams used it. I fixed a bug once, and 34 teams were protected. The CI system: I updated one shared workflow, and 30+ projects got improved quality gates simultaneously. The data reporting system: I built a dashboard, and teams across the organization self-identified and self-corrected their performance problems without being told. The scaffolding tool: I encoded 2 years of organizational learnings into a template that runs in 12 seconds.
>
> The common thread: one change, many beneficiaries. This is what distinguishes platform engineering from product engineering. The scale of impact is not determined by how fast I code — it's determined by how many teams depend on what I build.
>
> The adoption story for the component library is the one I'm most proud of. Building the library was the technical challenge. Getting 34 teams to use it was the organizational challenge. The technical challenge is bounded: you eventually finish building. The organizational challenge is ongoing: adoption requires trust, and trust is built through consistency, through quality, through making the upgrade path easy, and through caring about the teams' experience as much as your own."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built a component library" | "**Led development and adoption**: built @company/ui (58 components, TypeScript, Storybook, design tokens, ARIA a11y, tree-shaking). **Adoption grew 3→34 teams** via: dogfooding first, Storybook as the demo, pair-programming migration support for early adopters, codemods for breaking changes. **Issue resolution efficiency**: bug fixed once in the library → all 34 teams protected automatically vs. 34 teams fixing independently." |
| "I set up CI for 30+ projects" | "**Shared GitHub Actions workflow**: projects declare their limits (bundle-limit-kb/coverage-threshold/lighthouse-threshold). One workflow change → all 30+ projects improved. **PASS/WARN/FAIL gates** (WARN prevents alert fatigue). Lighthouse with CPU throttling for consistent results. Deterministic bundle IDs. **Reliability**: CI passes/fails are deterministic — re-runs eliminated." |
| "I set up performance monitoring" | "**Data reporting system**: collects per CI run: bundle size (total + per chunk), Lighthouse metrics (LCP/CLS/FID/TBT), build time, coverage, vuln count. **Core insight**: visibility creates accountability — teams self-corrected without being told. Regression detection: PR comment when bundle increases >X KB. Result: teams reduced bundle sizes (example: 1.2MB → 338KB, LCP 4.2s → 1.9s) by fixing their own issues after seeing data." |
| "I created project templates" | "**create-fe-app scaffolding tool**: npx create-fe-app my-app --template react-ts → 12s. Auto-configures: build (Vite/Next.js), testing (Vitest+MSW+RTL), quality (ESLint/Prettier/Husky/lint-staged), CI/CD (GitHub Actions + quality gates from day 1), @company/ui pre-installed, data reporting connected. **4 templates**: react-ts/next-ts/lib/micro-fe. Encodes 2 years of platform learnings — new teams benefit without reading documentation." |

---

## 📊 Quick Facts

```
COMPONENT LIBRARY (@company/ui):
  Components:     58 (Button, Input, DataTable, Modal, Toast, Avatar, Badge, ...)
  Teams adopted:  34 (grew from 3 in Q1 to 34 in Q4)
  Adoption path:  dogfood → Storybook demo → migration support → codemod for breaking changes
  Issue resolution: bug fixed once → 34 teams protected (vs. 34 independent fixes)
  Versioning:     semver with codemods for major version migrations
  Quality:        TypeScript generics, ARIA accessibility, tree-shaking, design tokens

CI RELIABILITY/PERFORMANCE CHECK SYSTEM:
  Projects covered: 30+
  Metrics checked: bundle size (per-project limit), test coverage (≥80%), Lighthouse (≥85)
  Implementation:   shared GitHub Actions workflow (one change → all projects)
  Gate levels:     PASS/WARN/FAIL (WARN = approaching limit, not blocking — prevents alert fatigue)
  Lighthouse:      CPU throttling (4×) for consistent results across CI machines
  Bundle:          deterministic module IDs (prevents ±20KB variance between builds)

DATA REPORTING SYSTEM:
  Metrics per run: bundle size, LCP/CLS/FID/TBT, build time, coverage, vulnerability count
  Core value:      visibility → accountability → self-correction (no mandate needed)
  Features:        per-project trend lines, org-wide ranking, regression alerts (PR comments)
  Impact:          teams reduced load times ~60% avg after seeing their own data
  Regression:      automated PR comment when bundle increases beyond threshold

SCAFFOLDING TOOL (create-fe-app):
  Time:       12 seconds (vs 3-5 days manual setup)
  Templates:  react-ts, next-ts, lib, micro-fe
  Auto-config: build, testing (Vitest+MSW), ESLint, Prettier, Husky, CI/CD, @company/ui,
               path aliases, env handling, quality gates, data reporting integration
  Key value:  encodes organizational best practices; new teams benefit without reading docs
```

---

*Document last updated: June 2026 · Platform Engineering interview preparation*
