# ♪ Interview Guide — TikTok Live Data Platform & Operations
## Data Catalog · User Segmentation (15+ pages) · CI/CD · Developer Efficiency

---

## 🔑 Context: What TikTok Live Is At Scale

```
TIKTOK LIVE: SCALE THAT MATTERS FOR THE INTERVIEW
  Millions of concurrent live streams at any moment.
  Hundreds of millions of concurrent viewers globally.
  Events generated: billions per day (viewer joins, leaves, gifts, comments, shares).
  Data pipelines: dozens of datasets, refreshed on sub-hourly schedules.
  
  WHY SCALE MATTERS FOR FRONTEND TOOLING:
  The data platform tools I built: used by data engineers operating at this scale.
  When a data pipeline has a SLA breach: engineers need to know IMMEDIATELY.
  When an analyst queries a dataset schema: they need the right answer NOW.
  When an ops team builds a user segment: they're selecting from 680M+ users.
  
  The tools I built: designed with this scale and these stakes in mind.
  Not CRUD apps. Decision-support tools for engineers working on global infrastructure.

THREE DISTINCT DOMAINS:
  1. TikTok Live Data Platform: internal tooling for data engineers.
     Users: data engineers, data analysts, platform on-call engineers.
     Tools: data catalog, schema browser, pipeline health dashboard.
  
  2. TikTok Live Operation Platform: internal tooling for operations teams.
     Users: campaign managers, content safety reviewers, monetisation analysts, anti-spam.
     Tools: user segmentation (the component library).
  
  3. Developer experience: improvements that benefit the engineering team itself.
     Users: all frontend engineers on the team.
     Tools: CI/CD optimisation, TypeScript strictness, pre-commit hooks, test tooling.
```

---

## 1️⃣ Data Inventory, Management & Visualisation Tools

### Data Catalog · Schema Browser · Pipeline Health · Real-Time Metrics

---

```
THE PROBLEM (what existed before):
  
  A data engineer wants to answer:
  "What's the freshest dataset that has per-user watch time at the daily granularity?"
  
  Without the data inventory tool:
  1. Post in Slack: "Does anyone know which table has daily watch time by user?"
  2. Wait. Sometimes hours. Sometimes the answer is wrong (dataset was deprecated).
  3. Find the table name. Query it. Discover the schema is wrong for their use case.
  4. Repeat.
  
  At scale: 20+ data engineers × 2-3 such questions per day = massive productivity loss.
  Incorrect assumptions about schema or freshness: lead to incorrect analytics dashboards.
  Incorrect analytics: lead to incorrect product decisions.
  
  THE SOLUTION: FOUR PILLARS OF THE DATA CATALOG

PILLAR 1: DISCOVER
  
  Search interface: find datasets by domain, keyword, owner, or schema column name.
  
  "I need 'gifts' data" → type "gifts" → results sorted by:
  1. Usage frequency (datasets used by the most downstream pipelines rank first).
  2. Freshness (recently updated datasets rank higher).
  
  NOT alphabetical. NOT by creation date. By relevance.
  A deprecated dataset with "gifts" in the name: ranked below the active replacement.
  
  Domain filtering:
  Datasets organized by domain: Live Core / User Analytics / Creator / Platform Infra.
  Engineers filter by their domain first, then search within it.
  Reduces noise: a Creator team engineer doesn't need to wade through Platform Infra datasets.
  
  Column-level search:
  "Which dataset has a column called 'gifts_sent_usd'?" → search the schema.
  The catalog: indexes every column name and description across all datasets.
  This is unique: most data catalogs only search table names and descriptions.
  Column-level search: answers the specific question engineers actually have.

PILLAR 2: UNDERSTAND
  
  Every dataset entry: a complete profile.
  
  Schema:
  - Column name: exact name to use in SQL queries.
  - Type: string / int64 / float64 / boolean / timestamp / struct / array.
  - Nullable: can this column have NULL values? Critical for JOIN logic.
  - Description: what this column means in business terms.
  - Sample values: 2-3 real examples from the dataset (anonymised).
  
  Why sample values matter:
  "country_code" — what format? ISO 3166 (US, ID, BR) or country name (United States)?
  Without sample values: engineer writes a query with the wrong format. Gets no results.
  With sample values: "US, ID, BR" → they know immediately.
  
  Ownership:
  - Team: which team maintains this dataset.
  - Contact: Slack channel for questions.
  - Last modified by: who made the most recent schema change.
  Knowing the owner: engineers ask the RIGHT people, not the whole Slack channel.
  
  SLA (Service Level Agreement):
  Every dataset: a freshness contract.
  "user_engagement_daily: data will be ready within 3 hours of midnight UTC."
  If it's 4 AM UTC and the data isn't there: SLA is breached. On-call is notified.
  The SLA is displayed in the catalog: engineers know when to expect the data.
  This prevents: engineers assuming data is stale when it's just within SLA.

PILLAR 3: MONITOR
  
  Pipeline health: real-time status of every data pipeline job.
  
  Each pipeline job: shows:
  - Status: OK / WARN / ERROR / RUNNING
  - Last run: "2 min ago"
  - Latency: "47 minutes" (how long the last successful run took)
  - SLA compliance: green/yellow/red based on latency vs SLA.
  
  WARN: job completed but took longer than expected (potential degradation trend).
  ERROR: job failed. Cause: OOMKilled / upstream failure / schema mismatch.
  
  Why this matters vs just using Airflow directly:
  Airflow is powerful but complex. Not all data consumers are Airflow experts.
  The catalog: shows a clear, opinionated view.
  "pipeline_audit_roll_up: WARN — completed 3h 52m ago, SLA is 1h."
  One glance: this job is significantly late. Call the on-call engineer.
  
  The on-call alert: links directly to the catalog entry.
  Engineer: clicks the link, lands on the pipeline status page, sees the error log.
  Time to understand the incident: seconds instead of navigating Airflow.

PILLAR 4: MANAGE
  
  Deprecation workflow:
  Dataset owner: marks a dataset as DEPRECATED in the catalog.
  Provides: migration guide ("use live_stream_events instead").
  Deprecation notice: appears prominently in the dataset entry.
  All downstream usages: flagged (catalog tracks lineage).
  
  New engineers building pipelines: see the deprecation notice BEFORE writing SQL.
  Old engineers: warned if they add a new dependency on a deprecated dataset.
  This prevents: "I built a new pipeline on live_stream_events_v1, it worked in dev,
  and now it's pulling stale data because v1 was deprecated last month."

REAL-TIME VISUALISATION LAYER:
  
  Dashboard showing live metrics: active streams, concurrent viewers, events/second.
  
  WHY WEBSOCKET (not polling):
  These metrics update every 1-3 seconds.
  Polling at 1-second intervals: 1 HTTP request/second = 86,400 requests/day per client.
  Multiply by 100+ internal users: 8.6M requests/day just for dashboard metrics.
  Server: handles these requests AND the actual data pipelines. Unnecessary load.
  
  WebSocket: one TCP connection per client. Server pushes updates when they arrive.
  Client: receives updates passively. Zero polling requests.
  For metrics dashboards: WebSocket is the correct choice.
  Connection overhead: negligible vs the request reduction.
  
  Metric: events/second (proxy for pipeline health).
  Normal: ~220K events/second.
  Drop to 50K: ingestion pipeline degraded. Likely a source issue.
  Spike to 500K: viral moment (celebrity starts streaming). Normal. No action needed.
  The dashboard: gives context engineers previously lacked.
```

---

## 2️⃣ Component Library — 15+ Pages, Segmenting Millions of Users

### Segment Builder · Rule Engine · Audience Estimation · Shared Across Teams

---

```
WHY USER SEGMENTATION IS CENTRAL TO LIVE OPERATIONS:
  
  TikTok Live Operations: teams that manage and optimise the TikTok Live platform.
  Every team: constantly asks "which users match condition X?"
  
  Examples:
  Campaign managers: "Send push notification to users who watched >1h yesterday."
  Content safety:    "Review creator accounts with >100K followers AND policy violations in last 30d."
  Monetisation:      "Identify users with gifts_sent_usd > 50 in the last 30 days."
  Anti-spam:         "Flag accounts with follower_count > 10K AND last_active_days > 30."
  Creator support:   "Users who streamed AND had a stream quality p50 < 800 kbps."
  
  BEFORE THE SHARED COMPONENT LIBRARY:
  Each team built their own filter/segment UI.
  4 different teams: 4 different implementations of the same concept.
  Same bugs fixed in 4 places (or 3 places if someone forgot).
  Different behaviour: "Campaign's segment of 'active users' ≠ Anti-spam's 'active users'."
  Because the logic was inconsistent across implementations.
  
  AFTER: ONE SEGMENT BUILDER COMPONENT:
  Used on 15+ pages across all teams.
  Consistent: "active users" means the same thing everywhere.
  Bug fix: one fix. All pages benefit.
  New attribute added (e.g., "stream_quality"): add once. All 15 pages get it.

THE COMPONENT API DESIGN:
  
  KEY DECISION: INVERSION OF CONTROL FOR DATA FETCHING.
  
  The Segment Builder: knows how to RENDER rules. It does NOT know how to ESTIMATE audience size.
  Different pages: use different backend services for estimation.
  Campaign page: estimates from the campaign microservice (considers active campaigns, budget constraints).
  Content safety: estimates from the trust & safety service (considers suspended accounts).
  
  If the component fetched its own data: it would need to know about both services.
  It would need special-case logic. It would become a mess.
  
  Solution: onEstimateRequest as a prop.
  
  interface SegmentBuilderProps {
    value: SegmentDefinition;
    onChange: (def: SegmentDefinition) => void;
    attributes: Attribute[];          // which attributes this page's service supports
    onEstimateRequest: (def: SegmentDefinition) => Promise<EstimateResult>;
    allowMultipleGroups?: boolean;    // some pages: single group only
    readOnly?: boolean;               // audit logs: view-only mode
  }
  
  The component: calls onEstimateRequest(currentDefinition) on every change (debounced 300ms).
  The page: provides its own implementation.
  
  This is the "composition over coupling" principle.
  The component: knows UI. The page: knows data fetching. Neither knows the other's internals.

THE SEGMENT DEFINITION (serialisable JSON):
  
  {
    "groupLogic": "AND",
    "groups": [
      {
        "id": "g1",
        "logic": "AND",
        "rules": [
          { "id": "r1", "attribute": "watch_time_mins", "operator": ">", "value": "30" },
          { "id": "r2", "attribute": "last_active_days", "operator": "<", "value": "7" }
        ]
      },
      {
        "id": "g2",
        "logic": "AND",
        "rules": [
          { "id": "r3", "attribute": "country_code", "operator": "in", "value": ["ID", "PH", "VN"] }
        ]
      }
    ]
  }
  
  This JSON: stored in the database. Sent to the backend when a campaign is created.
  
  Backend translation to SQL:
  Group 1 (AND): watch_time_mins > 30 AND last_active_days < 7
  Group 2 (AND): country_code IN ('ID', 'PH', 'VN')
  Group logic (AND): (watch_time_mins > 30 AND last_active_days < 7)
                     AND (country_code IN ('ID', 'PH', 'VN'))
  
  This translation: deterministic. Same JSON → same SQL every time. Testable.
  We had 40+ unit tests: input JSON → expected SQL WHERE clause.
  Any change to the translation logic: tests catch regressions.

OPERATOR TYPES BY ATTRIBUTE:
  
  Attribute types → available operators:
  boolean:  "=" only (true/false, no other comparison makes sense)
  enum:     "=", "!=", "in", "not_in" (pick from a list of valid values)
  number:   "=", "!=", ">", "<", ">=", "<=" (full numeric comparison)
  string:   "=", "!=", "contains" (text matching)
  
  The attribute dropdown: determines which operators are shown.
  Engineers cannot create an invalid rule (e.g., country_code > 50).
  TypeScript: enforces this at the type level.
  
  This is IMPORTANT for interviews: the UI prevents invalid state.
  Not just frontend validation. The serialised JSON: cannot represent invalid combinations.
  The type system: reflects the domain rules.

AUDIENCE SIZE ESTIMATION AT SCALE:
  
  The segment definition: runs as a COUNT query on user_engagement_daily.
  This table: 680M rows.
  COUNT with a complex WHERE clause: could take 30-60 seconds on a full scan.
  Users: expect a response in under 1 second.
  
  SOLUTION: 1% RANDOM SAMPLE FOR FAST ESTIMATES.
  
  user_engagement_daily_sample: a pre-computed 1% random sample of user_engagement_daily.
  6.8M rows. COUNT on 6.8M rows: under 200ms (columnar storage, Presto/Athena).
  
  Accuracy: COUNT(sample) × 100 = estimate. Accurate to ±3% for segments > 50K users.
  
  For segments BELOW 10K (rare but possible, e.g., whale tier users):
  1% sample → estimated count of 0-100 → unreliable.
  Fall back: full scan on the actual table.
  Full scan with a highly selective WHERE clause (whale tier): fast anyway.
  
  Frontend: calls estimate API (debounced 300ms after any rule change).
  User perception: as they add rules, the estimate updates within 600ms.
  Feels instant. Actually running a COUNT on 6.8M rows.
  
  The estimate API: is the same endpoint for all 15+ pages.
  Shared infrastructure. The component library uses it uniformly.
```

---

## 3️⃣ Developer Efficiency — CI/CD · Code Quality · DX

### CI Runtime −72% · Bundle −60% · TypeScript Errors Eliminated · Coverage +129%

---

```
FRAMING THIS ACHIEVEMENT IN AN INTERVIEW:
  "Developer efficiency" sounds vague. Make it concrete.
  
  Concrete framing:
  "I identified that our CI pipeline was a 12-minute bottleneck.
   Engineers: wait 12 minutes for every commit feedback cycle.
   For a team of 10 engineers: 12 minutes × 5 commits/day × 10 engineers = 10 hours/day wasted.
   I reduced CI to 3.5 minutes. That's 7+ hours/day returned to the team.
   Compounded over a year: weeks of engineering time."
  
  This is how a staff engineer presents developer efficiency work.
  Not: "I made builds faster."
  Yes: "Here's the productivity cost, here's the improvement, here's the compound value."

CI RUNTIME: 12m 18s → 3m 24s (−72%)
  
  Finding the bottleneck:
  Added timing to each CI stage. Identified the top 3 offenders.
  
  OFFENDER 1: npm install (142s → 8s via pnpm + store cache):
  
  npm install: downloads packages from npm registry every time. No cache.
  node_modules: 380MB. Download + extract: 142 seconds.
  
  Switch to pnpm:
  pnpm uses a content-addressable store (~/.pnpm-store).
  When a package is installed: it's stored by hash.
  Future installs of the same package version: link from the store. No download.
  
  CI cache setup:
  GitHub Actions: cache the pnpm store.
  Cache key: hash of pnpm-lock.yaml.
  If lockfile unchanged (most PRs): cache hit. Restore store. pnpm links packages.
  Time: 8 seconds (only creating symlinks, no downloads).
  
  Cache miss (lockfile changed): pnpm downloads only the NEW or CHANGED packages.
  Not all packages. Just the delta. Still faster than npm install.
  
  OFFENDER 2: TypeScript + ESLint running sequentially (83s → 12s via parallelism):
  
  Before: TypeScript check completes → ESLint starts.
  Both: read the same source files. Neither depends on the other's output.
  
  After: GitHub Actions parallel job (or parallel steps in the same job).
  tsc --noEmit and eslint --ext .ts,.tsx run simultaneously.
  Wall time: max(12s, 9s) = 12s instead of 83s.
  
  The mental model: these jobs share the file input but not the output.
  Sequential: serial dependency that doesn't exist. Unnecessary.
  Parallel: correct model. Each independently validates.
  
  OFFENDER 3: Unit tests (210s → 55s via Jest sharding):
  
  Jest --shard 1/4, 2/4, 3/4, 4/4 across 4 parallel GitHub Actions jobs.
  Each shard: runs 1/4 of the test suite.
  Wall time: ~210s / 4 = ~55s.
  
  PREREQUISITE: test isolation.
  Tests must not share state. If test A creates a database record that test B reads:
  different shards running A and B concurrently → B fails because A hasn't run yet.
  
  Before sharding: 2 sprints cleaning up test isolation.
  Found: 12 tests with implicit ordering dependencies. Fixed each.
  After: sharding worked. All tests pass in any shard order.
  
  ADDITIONAL: Turborepo (monorepo build orchestration):
  
  The codebase: a monorepo with 8 packages (component library + 7 page packages).
  Building all 8 on every PR: unnecessary if only 2 changed.
  
  Turborepo: tracks the dependency graph.
  Component library changes: rebuild component library + all 7 pages that import from it.
  Page A changes: rebuild Page A only (nothing depends on it).
  Average CI: rebuilds 2-3 packages per PR (not all 8).
  Cache: per-package output cached. Cache hit: use cached output, skip build.
  
  This is incremental computation. Only recompute what changed.

BUNDLE SIZE: 4.8MB → 1.9MB (−60%)
  
  Analysis tool: webpack-bundle-analyzer (visual treemap of what's in the bundle).
  
  THREE MAIN OFFENDERS:
  
  1. moment.js → date-fns:
  moment.js: 280KB gzipped. Imported as: import moment from 'moment'.
  The entire library (all locales, all functions) included in the bundle.
  Replacement: date-fns with tree-shaking.
  import { format, addDays } from 'date-fns': only format and addDays included.
  Import size: ~12KB for the functions we actually used.
  Saving: 268KB.
  Migration: codemod script to transform moment API calls to date-fns equivalents.
  Not manual. Automated. Applied across the codebase in one commit.
  
  2. lodash → lodash-es + named imports:
  import _ from 'lodash': entire lodash (72KB gzipped) in the bundle.
  Even if we only used _.debounce.
  
  import { debounce } from 'lodash-es': only debounce (2.3KB) included.
  lodash-es: ESM version of lodash. Tree-shakeable.
  
  Added ESLint rule to ban: import _ from 'lodash' and import { ... } from 'lodash'.
  Only import from 'lodash-es' allowed.
  The lint rule: encoded the decision as machine-enforceable.
  Not a doc. An error that prevents regression.
  
  3. Antd → babel-plugin-import (tree-shaking for CommonJS libraries):
  import { Button, Table, Form } from 'antd': all of antd in the bundle.
  Antd: CommonJS. Tree-shaking doesn't work natively with CommonJS.
  
  babel-plugin-import: transforms imports at build time.
  import { Button } from 'antd' → import Button from 'antd/es/button'
  Only Button's module included.
  
  4. Route-level code splitting:
  Before: one bundle. All pages. All components. Downloaded by every user.
  After: dynamic import per route.
  import('./pages/SegmentBuilder').then(...) → loaded only when navigating to that page.
  Users visiting the catalog page: never download the segment builder code.

TYPESCRIPT ERRORS: ~40/week → 0
  
  ROOT CAUSE: "strict": false in tsconfig.json.
  
  With strict: false:
  - implicit any: no error. Functions can accept and return anything.
  - null checks: not required. Unchecked null access common.
  - No pre-commit type checking.
  - CI TypeScript check: non-blocking (just a warning, not a failure).
  
  APPROACH: INCREMENTAL STRICTNESS (the right way to migrate):
  
  NOT: enable strict: true globally.
  → 834 errors immediately. Blocks everyone. Nothing can merge.
  
  NOT: ignore existing errors with // @ts-ignore everywhere.
  → No improvement. Just hiding the debt.
  
  YES: Incremental strictness with two tsconfig files.
  
  tsconfig.json: base config, strict: false (for existing files).
  tsconfig.strict.json: extends base, strict: true.
  
  Build script: runs tsc against tsconfig.strict.json for new files.
  Existing files: use tsconfig.json. Not broken. Can still merge.
  New files: MUST pass strict TypeScript. No new debt introduced.
  
  Each sprint: migrated 2-3 existing files from base to strict.
  Tracked in a shared spreadsheet: 834 errors → 780 → 650 → ...
  6 months: zero remaining errors. Moved strict: true to tsconfig.json.
  
  Result: for 4 consecutive months: zero TypeScript errors introduced at merge.
  
  PRE-COMMIT HOOKS (prevent errors from reaching CI):
  
  Husky: Git hooks framework.
  lint-staged: runs linters only on staged files (not the whole codebase).
  
  Why lint-staged (not just running eslint on everything):
  Running ESLint on 50,000 lines on every commit: 45 seconds.
  Engineers bypass slow hooks. They commit with --no-verify.
  
  lint-staged: runs ESLint only on the files being committed.
  Typical commit: 3-5 files. ESLint on 5 files: 3-8 seconds.
  Engineers: tolerate 3-8 seconds. They don't bypass it.
  
  Pre-commit hook catches:
  - TypeScript errors in staged files.
  - ESLint violations (including no-restricted-imports for moment.js/lodash).
  Engineers: fix locally before committing. CI: never sees these errors.

TEST COVERAGE: 34% → 78% (+129%)
  
  NOT ACHIEVED by mandating "write more tests."
  Mandating coverage without reducing friction: engineers write trivial tests to hit the number.
  
  ACHIEVED by making testing easier and more valuable.
  
  IMPROVEMENT 1: Component testing utilities.
  Before: each test file: 20 lines of boilerplate setup.
    Setup: React Testing Library + router + Recoil store + mock API + i18n.
    Total boilerplate: 20 lines before the actual test begins.
    Cognitive overhead: significant. Engineers procrastinate testing.
  
  After: one import.
  import { render, screen } from "@/test-utils";
  The test-utils: pre-configured wrapper. Provides everything in one import.
  Test files: start writing the actual test in line 2.
  Result: more tests written per sprint (lower barrier = higher volume).
  
  IMPROVEMENT 2: Segment Builder integration tests.
  The segment builder: core component. Most complex logic.
  Written before the implementation was finished (TDD for the translation layer).
  40+ integration tests: input SegmentDefinition JSON → expected SQL WHERE clause.
  These tests: define the contract between frontend and backend.
  If the translation changes: tests catch the regression immediately.
  
  IMPROVEMENT 3: Chromatic for Storybook visual regression.
  Every Storybook story: Chromatic captures a screenshot on every PR.
  PR compares to baseline: any visual change flagged for explicit review.
  This is "free" coverage for the visual layer.
  Zero visual regressions merged without explicit approval in 8 months.
```

---

## STAR Scripts

### Data Platform Tools

```
SITUATION:
  Data engineers on TikTok Live lacked a central source of truth for datasets.
  Questions about schema, ownership, and freshness went to Slack.
  Incorrect assumptions led to dashboards built on deprecated or misunderstood data.

TASK:
  Build a data inventory tool with discovery, schema documentation, pipeline monitoring,
  and deprecation management. Visualise live platform metrics for on-call engineers.

ACTION:
  Built a searchable data catalog (indexed by table name, domain, owner, column names).
  Schema browser: column types, nullability, sample values for every dataset.
  Pipeline health dashboard: real-time SLA compliance per pipeline job (WebSocket for updates).
  Deprecation workflow: dataset owners mark deprecated, migration guide shown prominently to all consumers.
  Live metrics dashboard: active streams, concurrent viewers, events/second via WebSocket.

RESULT:
  Data engineers: reduced time-to-dataset from Slack thread (~hours) to catalog search (<1 minute).
  SLA breach visibility: engineers see pipeline status without navigating Airflow.
  Deprecated datasets: zero new downstream pipelines built on deprecated sources after the tool launched.
```

### User Segmentation Component Library

```
SITUATION:
  Four TikTok Live operations teams (campaign managers, content safety, monetisation, anti-spam)
  each built their own user segment filter UI. Four implementations. Inconsistent logic.
  The same concept of "active users" meant different things across four pages.

TASK:
  Design and implement a shared SegmentBuilder component used across all 15+ operations pages.

ACTION:
  Designed the SegmentDefinition JSON schema (serialisable, stored in DB, translates to SQL).
  Built the SegmentBuilder component with inversion of control (onEstimateRequest as prop:
  each page provides its own estimation backend).
  Implemented 1% random sampling for fast audience estimates (<600ms on 680M user table).
  Rule validation: operator types determined by attribute type (prevents invalid rules at the type level).
  Rolled out to 15+ pages across all operations teams.

RESULT:
  Four implementations replaced by one. Consistent segment logic across all teams.
  Audience estimation: <600ms (vs no estimate available before).
  Bug fixes: applied once. All 15 pages benefit simultaneously.
  New attributes: added once. All 15 pages get them automatically.
```

### Developer Efficiency

```
SITUATION:
  CI pipeline: 12+ minutes. TypeScript errors: ~40 per week merged to main.
  Bundle: 4.8MB. Test coverage: 34%. Developers losing significant time to CI wait and debugging.

TASK:
  Identify and resolve the highest-impact developer efficiency bottlenecks.

ACTION:
  CI: pnpm + pnpm store cache (install 142s → 8s), parallel TypeScript + ESLint,
  Jest sharding 4 parallel jobs (210s → 55s), Turborepo for monorepo incremental builds.
  Bundle: moment.js → date-fns codemod (−268KB), lodash → lodash-es named imports,
  babel-plugin-import for Antd, route-level code splitting.
  TypeScript: incremental strict migration (tsconfig.strict.json for new files, 6-month migration),
  Husky + lint-staged pre-commit hooks (3-8s on staged files only).
  Testing: component test-utils to reduce boilerplate (20 lines → 2 lines setup),
  40+ segment builder integration tests, Chromatic visual regression.

RESULT:
  CI runtime: 12m 18s → 3m 24s (−72%). Bundle: 4.8MB → 1.9MB (−60%).
  TypeScript errors at merge: 40/week → 0 (4 months clean).
  Test coverage: 34% → 78%. PR cycle time: 3.1 days → 0.9 days.
```

---

## Follow-up Q&A

**"What's a data catalog and why does it matter?"**
> "A data catalog is a centralised inventory of all the datasets in an organization. Every table: documented with its schema, ownership, SLA, and lineage. The alternative: engineers ask in Slack what datasets exist, get inconsistent answers, and sometimes build on deprecated sources. At TikTok Live's scale — dozens of teams, hundreds of datasets — the catalog is the single source of truth. Without it: data engineers spend a significant portion of their time on discovery work instead of actual analysis. With it: discovery takes a search query."

**"What does 'used across 15+ pages' mean technically for the segment builder?"**
> "Fifteen different pages in the TikTok Live Operations platform import the same SegmentBuilder component. Each page provides its own props: which attributes are available (each page's backend supports a different attribute set), the estimation function (each page calls a different backend service), and feature flags (some pages allow single-group segments only, others allow multi-group). The component handles rendering, validation, and rule serialisation. The pages handle their domain-specific data fetching. This is why we chose inversion of control: the component is domain-agnostic. It works on the campaign page, the content safety page, and the anti-spam page without knowing anything about those domains."

**"How did you migrate TypeScript to strict mode without blocking the team?"**
> "Incremental strictness. I created a second tsconfig — tsconfig.strict.json — that extended the base with strict: true. The build script: validated new files against the strict config. Existing files: continued using the base config with strict: false. This meant: zero files broken, zero commits blocked, zero disruption to ongoing work. Each sprint: I migrated 2-3 existing files from base to strict, fixing the errors introduced by the strict mode. Tracked in a spreadsheet: 834 errors on day one, zero after 6 months. Once all files were migrated: I moved strict: true to the main tsconfig. For 4 months since then: zero TypeScript errors merged to main."

**"Why does 1% sampling work for audience size estimation?"**
> "For large segments — which is most of what the operations teams work with — the law of large numbers makes a 1% sample statistically reliable. If our full table has 680M users and a segment captures 10M of them (1.5% of total), our 1% sample will have ~100K of those users. COUNT(100K) × 100 = 10M. Accurate to ±3% for large segments. The 1% sample is pre-computed and cached. COUNT on 6.8M rows in a columnar store (Presto/Athena) completes in under 200ms. Total latency including network: under 600ms. Users experience it as instant. For segments below 10K users, we fall back to a full table scan — those queries are inherently selective, so they're fast even on 680M rows."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built data tools for TikTok" | "**TikTok Live** (not TikTok): billions of events/day from millions of concurrent streams/hundreds of millions of viewers. Built **four capabilities**: (1) **Discover**: column-level search (not just table names), usage-ranked results; (2) **Understand**: schema with column types+nullability+sample values (prevents wrong-format queries), SLA contract (engineers know when to expect data); (3) **Monitor**: pipeline health with SLA compliance — engineers see breaches without navigating Airflow, on-call alerts link directly to catalog; (4) **Manage**: deprecation with migration guide — zero new pipelines on deprecated sources after launch. **WebSocket** not polling for live metrics (86,400 HTTP requests/day per client if polling at 1s vs one persistent connection)." |
| "I built a segment builder used on 15 pages" | "**Inversion of control**: onEstimateRequest as prop (each of 15+ pages provides its own estimation backend — campaign service vs trust & safety service — component owns UI not data fetching). **SegmentDefinition JSON** serialisable schema → deterministic SQL WHERE clause translation → 40+ integration tests. **Operators by attribute type**: boolean=only/enum=in+not_in/number=numeric comparisons/string=contains. **Audience estimation**: 1% pre-computed random sample (6.8M rows vs 680M), COUNT in <200ms, accurate ±3% for large segments, full scan fallback <10K. **Result**: 4 inconsistent implementations → 1 canonical/bug fix once benefits all 15 pages." |
| "I improved CI/CD and developer experience" | "**CI 12m18s→3m24s (−72%)**: (1) pnpm+store cache: install 142s→8s (symlinks not downloads on cache hit); (2) TypeScript+ESLint parallel: 83s→12s (shared file input, independent outputs, run simultaneously); (3) Jest sharding 4 jobs: 210s→55s (required 2 sprints fixing test isolation first); (4) Turborepo: only rebuilds changed packages (not all 8 in monorepo). **Bundle 4.8MB→1.9MB**: moment→date-fns codemod/lodash→lodash-es named imports/babel-plugin-import for Antd/route code splitting. **TS errors 40/wk→0**: incremental strict tsconfig (new files strict, existing files migrate over 6 months)/Husky+lint-staged 3-8s not 45s/ESLint custom rules encode decisions. **Coverage 34%→78%**: test-utils (20 lines boilerplate→2)/Chromatic visual regression." |

---

## 📊 Quick Facts

```
ROLE: Frontend Engineer — TikTok Live (Data Platform + Operations)
STACK: React · TypeScript · WebSocket · Webpack · Jest · Turborepo · pnpm

ACHIEVEMENT 1: DATA INVENTORY & VISUALISATION TOOLS
  Problem:  Engineers asking in Slack about dataset schemas and freshness (~hours to answer)
  Solution: 4-pillar data catalog (Discover/Understand/Monitor/Manage)
  Key:      Column-level search, SLA display, deprecation workflow, pipeline health dashboard
  Tech:     WebSocket for live metrics (not polling: 86,400 req/day per client with polling)
  Result:   Discovery: hours → <1 minute. Zero new pipelines on deprecated datasets.

ACHIEVEMENT 2: COMPONENT LIBRARY — 15+ PAGES, MILLIONS OF USERS
  Problem:  4 teams × 4 segment builder implementations = 4 maintenance surfaces, inconsistency
  Solution: Single SegmentBuilder component with inversion of control API design
  Key:      SegmentDefinition JSON → SQL translation with 40+ integration tests
  Scale:    680M user table, 1% sampling for <600ms estimates, accurate ±3%
  Result:   15+ pages, consistent logic, one bug fix benefits all pages

ACHIEVEMENT 3: DEVELOPER EFFICIENCY
  CI runtime:     12m 18s → 3m 24s (−72%)
                  pnpm cache (install 142s→8s) + parallel jobs + Jest sharding + Turborepo
  Bundle size:    4.8MB → 1.9MB (−60%)
                  moment→date-fns / lodash-es / babel-plugin-import / code splitting
  TS errors:      ~40/week → 0 at merge
                  Incremental strict migration + Husky+lint-staged + ESLint custom rules
  Test coverage:  34% → 78% (+129%)
                  Test utilities / 40+ segment integration tests / Chromatic visual regression
  PR cycle time:  3.1 days → 0.9 days
```

---

*Document last updated: June 2026 · TikTok Live Data Platform & Operations interview preparation*
