# ✈⚙ Interview Guide — TERA Software Engineer III (Web) / Infra Lead
## Build −64.18% · Memory −49.15% · Vulnerabilities −42.2% · Test Flake 0% · Tech Roadmap

---

## 🔑 Context: SE III — The Platform Engineer for the Team

```
SOFTWARE ENGINEER I: Build features assigned to me.
SOFTWARE ENGINEER II: Own a project area. Coordinate. Release.
SOFTWARE ENGINEER III: Own the PLATFORM the team builds on.

SE III is not "more features." It is a shift in scope.
SE III's job: make every engineer on the team more effective.

WHAT "OWNING THE PLATFORM" MEANS:
  If the build takes 3 minutes: every engineer loses 3 minutes × N times per day.
  For a team of 10 engineers: a 3-minute build costs ~30 engineer-minutes per build run.
  At 20 build runs per engineer per day: 600 engineer-minutes lost daily.
  That is 10 engineer-hours per day. 50 engineer-hours per week.
  
  SE III fixes the build. Once. The fix benefits every engineer, every day, forever.
  
  This is the leverage of infrastructure work.
  It is why the 64.18% build time reduction is a senior-level achievement:
  it is not "I made my own development faster."
  It is "I made every developer on the team faster, every day."

THE SE III SCOPE AT TRAVELOKA:
  Accommodation Front-End Web Domain: TERA + all accommodation-related web products.
  "SE III" responsibilities: build toolchain, security, test stability, memory, tech roadmap.
  
  Collaborative responsibilities:
  - Tech roadmap: with the Domain Lead (who sets product+people direction).
  - Best practices: published across Accommodation FE Web team.
  - Tech stack auditing: periodic review of all tools and dependencies.
  - Mentoring: junior engineers' technical progression.
```

---

## 1️⃣ Build Time: −64.18% — From 28.1s to 10.1s

### The problem, the diagnosis, and the solution

```
THE PROBLEM:
  Local build time: ~28 seconds (cold build).
  Hot Module Replacement (HMR) on change: 1.5–3 seconds per change.
  For a team of engineers making dozens of changes per day: significant friction.
  
  Slow feedback loop → reduced developer productivity.
  Engineers compensate: make multiple changes before rebuilding.
  Multiple changes per build → harder to isolate what caused a bug.
  
  Symptom: developers avoided "just checking if this compiles."
  They batched changes. This is a sign the feedback loop is too slow.

THE DIAGNOSIS:
  Profile the build to find where time is spent.
  
  Tool: webpack-bundle-analyzer + speed-measure-webpack-plugin.
  Output: time spent in each loader and plugin.
  
  Finding: 
  - babel-loader: 8.4 seconds (30% of total build time). Single-threaded JS transpilation.
  - tsc type checking: 6.8 seconds (24%). Sequential, blocking the bundle step.
  - webpack module resolution: 3.2 seconds (11%). No caching between runs.
  
  Three problems: slow transpiler (Babel), blocking type checking (tsc), no caching.

THE SOLUTION — THREE CHANGES:

  1. BUNDLER: Webpack 4 → Rspack 1 (compatibility: > 95% Webpack API)
     
     Rspack is written in Rust. Module processing is parallelized across all CPU cores.
     Webpack is JavaScript: modules processed sequentially (with limited parallelism via thread-loader).
     
     The build graph traversal: Rspack does it in Rust with native parallelism.
     The asset writing: Rspack batches I/O operations more efficiently.
     
     Migration effort: Rspack is designed to be a drop-in Webpack replacement.
     webpack.config.js → rspack.config.js (90% identical).
     Most Webpack plugins are supported. Rspack-specific alternatives for the rest.
     
     Rspack includes SWC by default:
     No babel-loader needed. SWC is written in Rust (10-70× faster than Babel per file).
  
  2. TRANSPILER: Babel → SWC (included with Rspack)
     
     Babel: JavaScript. Parses each file into an AST, transforms, generates code.
     Single-threaded per file. Plugin chain adds overhead.
     
     SWC: same job (TypeScript/JSX → JavaScript) but written in Rust.
     Benchmarks: 10-70× faster than Babel for the same transformations.
     Rspack uses SWC's built-in loader: no configuration needed.
     
     IMPORTANT: SWC does not type-check.
     SWC only transpiles (strips types). Same as Babel with @babel/preset-typescript.
     Type checking must be handled separately.
  
  3. TYPE CHECKING: tsc blocking → isolatedModules + fork-ts-checker
     
     BEFORE: tsc ran as part of the bundle step.
     The bundler waited for tsc to complete before generating output.
     tsc processing all files: 6.8 seconds of blocking wait.
     
     AFTER: two-step approach.
     - isolatedModules: true in tsconfig.json.
       TypeScript transpiles each file independently (no cross-file type inference).
       SWC/Rspack handles transpilation — fast, per-file, parallel.
     - fork-ts-checker-webpack-plugin:
       Type checking runs in a SEPARATE PROCESS, in parallel with bundling.
       The bundle completes while type checking is still running.
       Type errors appear after the bundle (not as a build blocker).
       
     Net effect on build time: the 6.8 seconds is removed from the critical path.
     Type errors are still caught — just not in a blocking way during hot reload.
     In CI: type checking is a separate step. Both must pass. Safety maintained.
  
  4. CSS: PostCSS → LightningCSS
     
     PostCSS: JavaScript, plugin chain (autoprefixer, cssnano, custom plugins).
     Multiple parsing passes. Slow on large CSS files.
     
     LightningCSS: Rust. Parse + transform + vendor prefix + minify in ONE pass.
     100× faster than PostCSS for equivalent transformations.
     Rspack has built-in LightningCSS support.
  
  5. PACKAGE MANAGER: npm → pnpm
     
     pnpm uses a content-addressable store: all packages stored once globally.
     Multiple projects that use React 18 share ONE copy in the store.
     Install: symlinks from the project's node_modules to the store.
     
     Benefits:
     - Initial install: faster (downloads fewer files when packages are cached).
     - node_modules size: 40-60% smaller (hard links, not copies).
     - Strict: cannot accidentally use a package not declared in package.json.
       This catches hidden dependencies that would fail in CI.

THE RESULT:
  Before: 28.1 seconds (webpack 4 + Babel + tsc blocking + PostCSS + npm)
  After:  10.1 seconds (Rspack + SWC + fork-ts-checker + LightningCSS + pnpm)
  Reduction: 64.18%
  
  HMR (hot reload on change):
  Before: 1.5–3 seconds.
  After: 200–400ms (nearly instant).
  Engineers can now iterate rapidly.

HOW TO COMMUNICATE THIS IN AN INTERVIEW:
  Don't just say "I migrated from Webpack to Rspack."
  Tell the full story:
  1. The problem (slow feedback loop, 28 seconds, engineer frustration).
  2. The diagnosis (profiled, found babel-loader + tsc are the bottlenecks).
  3. The solution (Rspack+SWC removes babel-loader, isolatedModules removes blocking tsc).
  4. The result (64.18% faster, HMR near-instant).
  5. The leverage (every engineer on the team benefits, every day, forever).
```

---

## 2️⃣ Memory Usage: −49.15%

### Why memory matters and how it was reduced

```
WHY MEMORY USAGE MATTERS FOR DEVELOPER TOOLS:
  High dev server memory → macOS/Linux starts swapping (using disk as RAM).
  Swapping: orders of magnitude slower than RAM.
  On a 16GB MacBook with multiple apps open: 1.3GB dev server + 640MB Jest leaves little for browser.
  Engineers: "My computer is slow." → context switching, frustration.
  
  In CI: memory limits per container.
  Jest OOM kills (Out Of Memory): a test run is killed mid-way.
  "The CI failed because Jest ran out of memory" = flaky CI for memory reasons.

WHAT WAS CONSUMING MEMORY:
  
  DEV SERVER (Webpack 4, peak: 1340MB during HMR):
  Webpack stores the entire module graph in JavaScript heap.
  Each module: its source, its AST, its dependencies, its compiled output.
  For TERA (hundreds of modules): the graph is large.
  
  HMR (Hot Module Replacement):
  When a file changes: Webpack reprocesses its dependency subtree.
  The old processed modules remain in memory until GC.
  JavaScript GC is non-deterministic: memory doesn't free immediately.
  Result: peak memory spikes during HMR cycles.
  
  JEST (640MB at peak):
  Jest by default runs all tests in a single process (--runInBand) or
  spawns workers that each load the full application module graph.
  Each worker: imports React, Redux, all test utilities, mocks.
  10 workers × 64MB each = 640MB.

HOW IT WAS REDUCED:
  
  DEV SERVER (1340MB → 590MB, −56%):
  Switch to Rspack reduced memory at the JavaScript level.
  Rspack stores the module graph in Rust memory, not JavaScript heap.
  Rust memory: more compact (no V8 overhead), manual management (no GC spikes).
  The JavaScript heap (where V8 lives) is smaller.
  
  JEST (640MB → 360MB, −44%):
  --maxWorkers=50%: limit workers to half of CPU cores.
  Instead of N workers: N/2 workers. Memory proportionally lower.
  Tradeoff: slightly longer test run time, but tests don't OOM.
  
  --workerIdleMemoryLimit=512MB:
  If a worker exceeds 512MB: Jest kills and restarts it.
  Prevents one leaking test from growing unbounded.
  
  jest-circus (test runner, since Jest 27 default):
  Lighter than the jasmine-based runner used in Jest 26 and below.
  Cleaner lifecycle, less memory overhead per test.

MEMORY PROFILING METHODOLOGY:
  How do you find a memory leak in a long-running dev server?
  
  1. Heap snapshot before: Node.js --inspect, Chrome DevTools → Memory → Heap Snapshot.
  2. Perform operations (HMR cycle × 10, rebuild × 5).
  3. Heap snapshot after.
  4. Compare: what objects grew? What was not collected?
  
  Finding for Webpack 4: webpack's ModuleGraph retained references
  to old module versions even after HMR (they were still reachable from the graph).
  This was a known Webpack 4 issue. Webpack 5 fixed it. Rspack also handles it correctly.
```

---

## 3️⃣ Vulnerabilities: −42.2% per Audited Package

### The audit process and how it was sustained

```
WHAT "VULNERABILITIES PER AUDITED PACKAGE" MEANS:
  Before: N vulnerabilities found across M packages = N/M per package.
  After: fewer vulnerabilities per package.
  
  "Per audited package" normalizes for codebase size.
  A larger codebase has more packages and thus more vulnerabilities by default.
  The metric: per package, how many vulnerabilities exist?
  
  42.2% reduction: for each package in the audit, there are 42.2% fewer CVEs on average.

THE BASELINE AUDIT:
  Step 1: run npm audit (or pnpm audit).
  Report: N vulnerabilities, broken down by: CRITICAL, HIGH, MEDIUM, LOW.
  
  Initial audit result: 73 vulnerabilities across the project.
  Breakdown:
  - 1 CRITICAL (lodash prototype pollution, via node-fetch transitive dependency)
  - 5 HIGH
  - 18 MEDIUM
  - 49 LOW
  
  Priority: fix CRITICAL and HIGH first. They have real exploitability.
  MEDIUM: fix within 1 sprint. LOW: track and fix in batches.

HOW EACH CATEGORY WAS FIXED:
  
  1. NODE.JS UPGRADE (Node 14 → Node 20 LTS): eliminated 12 vulnerabilities
     Node 14 reached End of Life in April 2023.
     EOL = no security patches. Any CVE found after EOL: unpatched.
     Node 20 is the current LTS (Long-Term Support): security patches until 2026.
     
     Upgrade process:
     a) Test: run the full test suite on Node 20 locally.
     b) Fix Node 20 breaking changes: some native modules required updates.
     c) Update CI: specify node: '20' in the CI YAML.
     d) Update package.json engines: "node": ">=20.0.0"
     
     Side effect: Node 20 required updated versions of some dependencies.
     Updated them: eliminated 12 more CVEs in those dependencies.
  
  2. REMOVED UNUSED PACKAGES: eliminated 8 vulnerabilities
     npm audit reports vulnerabilities in packages you may not actually use.
     Run: npx depcheck (finds packages listed in package.json but never imported).
     Found: aws-sdk (added for a one-off migration script, never used in production).
         webpack-bundle-analyzer (dev tool, only needed in analysis mode, already replaced).
     Remove packages → their transitive dependencies are also removed → their CVEs gone.
  
  3. DIRECT UPGRADES: eliminated 26 vulnerabilities
     For each remaining vulnerability: check if an upgrade of the direct dependency fixes it.
     Example: "lodash < 4.17.21" vulnerable. Upgrade lodash to 4.17.21 → CVE gone.
     Not all are this clean: some vulnerabilities are in transitive dependencies
     that the direct dependency hasn't updated yet.
     Resolution: file an issue with the direct dependency's maintainer, or use npm overrides.
  
  4. NPM OVERRIDES (for transitive dep vulnerabilities):
     package.json overrides: { "nth-check": "^2.0.1" }
     Forces the specified version of a transitive dependency.
     Use sparingly: overrides can break the package that depends on the old version.
     Test carefully after each override.

SUSTAINING THE IMPROVEMENT (preventing regression):
  
  RENOVATE BOT:
  After fixing: the baseline is clean. How to keep it clean?
  Renovate: open-source dependency update bot (like Dependabot).
  Runs daily. Checks for: outdated packages, new vulnerability patches.
  Opens PRs automatically. Engineers review and merge.
  
  Configuration:
  - Grouped minor/patch updates (reduce PR noise: one PR per day for small updates).
  - Automerge: patch updates with 0 test failures (no engineer review needed).
  - Pin: lock file always updated with the version in package.json.
  
  Effect: vulnerabilities are patched within days of a fix being released.
  Before Renovate: patches were applied manually every quarter (at best).
  
  CI GATE:
  pnpm audit --audit-level=high added to CI pipeline.
  CRITICAL or HIGH: blocked PR. Cannot merge until fixed.
  MEDIUM: PR warning. Must be resolved within 1 sprint (tracked in backlog).
  LOW: logged, not blocking.
  
  SEMGREP (Static Application Security Testing):
  Runs on every PR. Checks for: React-specific XSS patterns, open redirect risks.
  Example: dangerouslySetInnerHTML with user-supplied content.
  Example: window.location constructed from URL parameters without validation.
  Semgrep comments directly on the PR line: "This pattern risks XSS. Consider: ..."
```

---

## 4️⃣ Test Stability: 0% Flake Rate in CI

### Eliminating flaky tests — the four root causes

```
WHAT IS A FLAKY TEST:
  A test that sometimes passes and sometimes fails, without code changes.
  Running the same test 10 times: 8 pass, 2 fail. No code changed.
  
  WHY FLAKY TESTS ARE DANGEROUS:
  Engineers learn to ignore CI failures: "It's probably a flaky test."
  But sometimes: the failure is a real bug. The engineer merges anyway.
  Real bug ships to production.
  
  A CI that cries wolf (flaky tests) destroys trust in the CI.
  Goal: CI red = your code is broken. Always. No exceptions.

BEFORE: 18% of CI runs had at least 1 flaky test failure.
  Each flaky run: re-run (15 minutes wasted).
  At 10% re-run rate: 10% extra CI cost. 10% more developer waiting time.

ROOT CAUSE 1: TIME-DEPENDENT TESTS
  
  Code: a relative time formatter.
  "Just now" (< 1 minute), "2 minutes ago", "Yesterday", etc.
  
  Flaky test:
  it("shows 'just now' for events within the last minute", () => {
    const timestamp = new Date();
    expect(formatRelativeTime(timestamp)).toBe("just now");
  });
  
  WHY IT'S FLAKY:
  If the test starts at 09:59:59.980 and new Date() is called at 10:00:00.010:
  The 20ms gap spans a second boundary. The formatter might calculate 1 second ago.
  "1 second ago" ≠ "just now". Test fails.
  On a slow CI machine: the gap is larger. More failures.
  
  FIX: jest.useFakeTimers()
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-17T10:00:00.000Z")); // fixed
  });
  afterEach(() => { jest.useRealTimers(); });
  
  it("shows 'just now' for events within the last minute", () => {
    const timestamp = new Date("2024-06-17T09:59:30.000Z"); // 30 seconds ago
    expect(formatRelativeTime(timestamp)).toBe("just now");
  });
  
  Now: time is fixed. Test result is deterministic. No flakiness.

ROOT CAUSE 2: REAL NETWORK CALLS IN UNIT TESTS
  
  A component makes a fetch() call in useEffect.
  Unit test renders the component.
  fetch() makes a real HTTP request to the local dev server (or fails in CI).
  CI: no dev server running. Network call fails. Test fails.
  Local: dev server running. Test passes. CI: fails.
  
  FIX: Mock Service Worker (MSW) with Node adapter.
  
  MSW intercepts fetch() at the network layer (not by mocking fetch itself).
  No real HTTP. No dependency on external servers.
  
  // test-setup.ts
  import { setupServer } from "msw/node";
  import { http, HttpResponse } from "msw";
  
  const server = setupServer(
    http.get("/api/v2/rooms", () =>
      HttpResponse.json({ rooms: mockRooms })
    )
  );
  
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers()); // reset between tests
  afterAll(() => server.close());
  
  onUnhandledRequest: "error":
  If a test makes a network call not covered by a handler: test fails.
  This forces engineers to explicitly mock every network call.
  No accidental real HTTP. No silent test failures from unmocked endpoints.
  
ROOT CAUSE 3: RACE CONDITIONS IN ASYNC TESTS
  
  Flaky: state update after async operation hasn't completed.
  
  BAD:
  await userEvent.click(submitButton);
  expect(screen.getByText("Success")).toBeInTheDocument();
  // Race: React state update might not have rendered yet
  
  FIX: waitFor from React Testing Library
  
  await userEvent.click(submitButton);
  await waitFor(() => {
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
  // waitFor retries the assertion until it passes or timeout
  
  waitFor: retries the callback every 50ms until: it passes or 1000ms timeout.
  Handles React batched state updates (React 18 automatic batching).

ROOT CAUSE 4: TEST ISOLATION FAILURES
  
  Module-level state shared between tests.
  Test A: imports a module, modifies its internal state.
  Test B: imports the same module (cached by Jest), reads the modified state.
  Test A must run before Test B for Test B to pass.
  Test order is non-deterministic in parallel runs.
  
  FIX: beforeEach(() => { jest.resetModules(); })
  
  Or: structure modules to not have mutable module-level state.
  Prefer: factory functions that create fresh state each time.
  
  Module-level:   let count = 0; (shared between tests)
  Factory:        const createCounter = () => { let count = 0; return { increment: () => count++ }; }
  Each test gets a fresh counter. No sharing. No order dependency.

THE RESULT:
  0% flake rate in CI (measured over 100 consecutive PR runs).
  CI re-runs: eliminated.
  CI time: reduced 23% (no re-run overhead).
  Engineer trust: "CI red means my code broke something" — restored.
```

---

## 5️⃣ Tech Roadmap — Collaborating with the Domain Lead

```
WHAT A TECH ROADMAP IS:
  A quarterly plan for the technical evolution of the platform.
  NOT a feature roadmap (that is the PM's domain).
  The tech roadmap: "what technical capabilities do we build, maintain, or improve?"
  
  Example items:
  - "Upgrade to Node 20 before Node 14 EOL in April."
  - "Migrate bundler to Rspack to improve developer productivity."
  - "Set up Renovate for automated dependency management."
  - "Establish test stability: 0% flake rate target."
  
  The tech roadmap is the SE III's primary output as a platform engineer.
  It is where the quantified improvements (−64.18%, −49.15%, −42.2%) come from.

COLLABORATING WITH THE DOMAIN LEAD:
  The Domain Lead: accountable for the overall direction of the Accommodation FE Web domain.
  The SE III: provides the technical vision for what the platform should look like.
  
  Division of responsibility:
  Domain Lead: "We need developers to ship features faster. What slows them down?"
  SE III: "The build time. Here's the analysis. Here's the proposal."
  Domain Lead: "How long will this take? What's the risk?"
  SE III: "2 weeks of migration, low risk (Rspack is API-compatible). ROI: 64% faster builds."
  Domain Lead: "Approved. Schedule it for Q1."
  
  The SE III is the technical expert. The Domain Lead is the business context expert.
  Together: a roadmap that is both technically rigorous and business-justified.

THE TECH DEBT AUDIT (start of year):
  Before proposing a roadmap, understand what you have.
  Inventory every component of the tech stack:
  
  | Component    | Version | EOL Date   | Known Issues     | Migration Effort |
  |---|---|---|---|---|
  | Node.js      | 14.x    | Apr 2023   | CVEs after EOL   | 2 weeks          |
  | Webpack      | 4.x     | Dec 2022   | Slow, no caching | 3 weeks          |
  | React        | 17.0.2  | Sep 2022*  | Missing features | 4 weeks          |
  | TypeScript   | 4.5     | 2022       | Missing TS 5 DX  | 1 week           |
  
  Prioritization criteria (in order):
  1. Security risk: EOL + CVEs. Cannot defer this.
  2. Developer experience impact: slow builds = slow feature delivery.
  3. Operational cost: high memory = expensive cloud infra.
  4. Feature velocity: outdated APIs = workarounds in product code.
  
  Output: ranked list. Propose the top 4-5 for the next quarter.

PROPOSAL FORMAT (one page per roadmap item):
  Why now:
    "Node 14 reaches EOL on April 30, 2023. After that date:
     no security patches. Any new CVE found in Node 14 will be unpatched.
     We have 2 months to migrate."
  
  What:
    "Upgrade from Node 14.x to Node 20 LTS."
  
  Effort:
    "2 weeks. Includes: test all packages for Node 20 compatibility,
     fix breaking changes (1-2 packages require minor updates),
     update CI configuration."
  
  Risk:
    "Low. Node 20 is backward-compatible for our use cases.
     Tested against the full test suite locally: all 1,847 tests pass on Node 20."
  
  Impact:
    "Eliminates 12 known CVEs. Unblocks pnpm migration (pnpm 8 requires Node 16+).
     No performance impact expected."
  
  Domain Lead reads this: can make an informed decision in 5 minutes.
  No ambiguity. No surprises.
```

---

## 6️⃣ ADRs — Architectural Decision Records

```
WHAT AN ADR IS:
  A short document that records: what decision was made, why, and what alternatives were considered.
  
  WHY ADRs MATTER:
  In 6 months: "Why are we using Rspack and not Vite?"
  Without an ADR: nobody remembers. The reasoning is lost.
  New engineers: don't know why decisions were made. May unknowingly reverse them.
  
  With an ADR: the reasoning is permanent and searchable.
  "ADR-001: We chose Rspack over Vite because TERA has existing webpack plugin usage
  that Rspack supports but Vite does not. Vite's plugin API is incompatible with
  our internal asset pipeline plugin."

ADR STANDARD FORMAT:
  
  # ADR-001: Rspack over Vite for TERA Web
  
  Status: Accepted
  Date: 2024-Q1
  Deciders: [SE III], [Domain Lead]
  
  ## Context
  TERA web uses Webpack 4. Build time is 28 seconds. We need a faster bundler.
  Two strong candidates: Rspack (Webpack-compatible, Rust-based) and Vite (ESM-based, esbuild).
  
  ## Decision
  We will use Rspack.
  
  ## Rationale
  Rspack:
  + Near-identical Webpack config (migration effort: ~1 week)
  + Supports webpack plugins API (our internal asset-pipeline-plugin is compatible)
  + Uses SWC by default (no additional transpiler configuration)
  + Production build output is identical to Webpack (same chunking strategy)
  
  Vite:
  - Requires rewriting the build config from scratch
  - Vite's plugin API is different from Webpack's (our internal plugin incompatible)
  - Vite uses esbuild for dev and Rollup for production:
    two different tools → possible dev/prod inconsistencies
  
  ## Consequences
  - Build time: 28s → 10s (measured after migration)
  - Rspack is newer than Vite: less community ecosystem
  - Must track Rspack releases for compatibility with future plugins
  
  ## Alternatives Considered
  Turbopack: still in beta (2024-Q1). Not production-ready.
  Vite: rejected as above.
  Stay on Webpack: rejected — no improvement in build time.

WHEN TO WRITE AN ADR:
  - Choosing between two or more non-trivial alternatives.
  - A decision that is hard to reverse (changing the bundler, the package manager).
  - A decision that affects every engineer on the team.
  - When you're confident: "in 6 months, someone will ask why we did this."
  
  DO NOT write an ADR for: component implementation details, small API design choices.
  The bar: "does this affect the platform every engineer works on?"
```

---

## 7️⃣ Mentoring Junior Engineers

```
WHAT EFFECTIVE MENTORING LOOKS LIKE:

  STRUCTURED 1:1s (weekly, 30-45 minutes):
  Not a status check ("are you on track?") — that is the manager's job.
  Purpose: technical growth.
  
  Two-part structure:
  Part 1 (10 minutes): blockers.
  "Where are you stuck? What have you tried? What's your current hypothesis?"
  I help unblock. But: I don't give the answer. I give the next step.
  "Have you checked what happens when X is undefined?"
  They go figure it out. They come back. They solved it.
  Solving it themselves: they remember. Being told the answer: they forget.
  
  Part 2 (20 minutes): growth topic.
  We agreed last week to focus on: TypeScript generics.
  I bring a code example from TERA. We work through it together.
  "Why does this TypeScript error happen? What is the compiler trying to tell you?"
  
  Growth topics rotate: async/await patterns, Redux architecture, React performance,
  how to read a flame graph, how to write a good code review comment.

  CODE REVIEW AS TEACHING:
  Not: "This should be X." (juniors: change it, don't understand why)
  But: "This works. Here's why X might be better: [reason].
       What do you think happens if [edge case]?"
  
  The question at the end is key. It forces the mentee to think, not just accept.
  If they can answer: they understood. If not: explain deeper.
  
  Good code review comment:
  "null check missing here: if `rooms` is null, this will throw.
  Consider: rooms?.map(...) or add an explicit null check.
  Under what condition would rooms be null? Is that condition possible?"
  
  The question: "under what condition would rooms be null?"
  Makes the engineer think about data flow, not just the syntax fix.

  PAIR PROGRAMMING (for genuinely hard problems):
  Do NOT take the keyboard.
  Sit next to the engineer. They drive. I navigate.
  "What does this error say? What does the stack trace tell us?"
  "Where would you look first? Why?"
  
  When they're stuck: don't jump in with the answer.
  "Let's think about what the code is doing step by step."
  "Add a console.log here. What do you expect to see?"
  
  Outcome: they solved the problem.
  Important for confidence: "I figured this out with a bit of guidance."
  Not: "My senior fixed it for me."
  
  GRADUATED OWNERSHIP:
  Month 1: shadow.
  Watch a feature built from start to finish. Ask any question.
  No independent work yet. Absorb the patterns.
  
  Month 2: co-build.
  We build a feature together. I write some code, they write some.
  I explain every decision as I make it.
  
  Month 3: solo with review.
  They build a feature independently. I review every PR.
  Reviews are detailed: teaching reviews, not just approval.
  
  Month 4+: own a small project.
  I review only at the architecture level (before implementation starts)
  and at the end (before release). They own the middle.
  
  MEASURING MENTORING EFFECTIVENESS:
  Not: "do they thank me?" (not a reliable metric)
  But:
  - Can they debug a TypeScript error independently?
  - Do their PRs require fewer revision rounds than 3 months ago?
  - Do they proactively ask "what are the edge cases?" before implementation?
  - Did they progress to the next level? (Junior → Mid is the ultimate metric)
  
  The goal: an engineer who does not need my help for the problems they know.
  They save "ask for help" for genuinely novel problems.
```

---

## STAR Scripts

### Build time reduction

```
SITUATION:
  TERA local build time: 28 seconds cold. HMR: 1.5-3 seconds per change.
  Team of 10 engineers × ~20 rebuilds per day: thousands of minutes lost weekly.
  Engineers avoided rapid iteration because the feedback loop was too slow.

TASK:
  Diagnose the build bottlenecks and reduce build time across the Accommodation FE Web team.
  Presented findings and plan to Domain Lead for tech roadmap approval.

ACTION:
  Profiled with speed-measure-webpack-plugin: found babel-loader (8.4s) + tsc (6.8s) as primary bottlenecks.
  Proposed: Rspack (Rust bundler with SWC) + isolatedModules + fork-ts-checker.
  Migrated over 2 weeks: updated build config, adapted 2 internal plugins for Rspack API, tested full suite.
  Also: LightningCSS replacing PostCSS, pnpm replacing npm.

RESULT:
  Build time: 28.1s → 10.1s (−64.18%).
  HMR: 1.5-3s → 200-400ms (near-instant feedback).
  Memory during dev: −56% (Rspack's Rust module graph vs JS heap).
  Every engineer on the team benefits from this improvement, every day.
```

### Test stability

```
SITUATION:
  18% of CI runs had at least one flaky test failure.
  Engineers re-ran CI without code changes. "It's probably flaky."
  When CI was red: engineers couldn't trust it. Some merged anyway.
  CI credibility was compromised.

TASK:
  Eliminate flaky tests. Achieve 0% flake rate. Restore CI trust.

ACTION:
  Audited all flaky tests. Categorized root causes:
  (1) Time-dependent tests: fixed with jest.useFakeTimers() + jest.setSystemTime().
  (2) Real network calls: fixed with MSW (Mock Service Worker) with node adapter.
  (3) Race conditions: fixed with React Testing Library's waitFor.
  (4) Module state leaks: fixed with jest.resetModules() and factory patterns.
  Documented each pattern in the team's best practices wiki.
  Added CI configuration: --forceExit, --detectOpenHandles to catch new issues.

RESULT:
  0% flake rate over 100 consecutive CI runs.
  CI re-runs: eliminated. CI time: -23%.
  Engineers: "CI red = my code is broken." Trust restored.
```

---

## Follow-up Q&A

**"Why Rspack over Vite?"**
> "Both are excellent. For TERA specifically: we had existing Webpack plugins in use — an internal asset pipeline plugin that was incompatible with Vite's plugin API. Rspack's value proposition is Webpack API compatibility: nearly identical config file, same plugin API, same loader API. Our internal plugin worked with Rspack without any changes. Vite would have required rewriting the plugin, which adds risk and effort. Vite also uses esbuild for development and Rollup for production — two different tools, potential dev/prod inconsistencies. Rspack uses SWC for both. For a team that needs to migrate without disruption, Rspack was the pragmatic choice. That said: for a greenfield project with no existing Webpack tooling, I would evaluate Vite seriously."

**"Didn't isolatedModules break type safety?"**
> "Common question. No — it changes *when* type errors are surfaced, not *whether* they are. With isolatedModules, TypeScript transpiles each file independently (like Babel does). The SWC transpiler doesn't understand cross-file types. But fork-ts-checker runs the full type checker in a separate process concurrently. Type errors appear in the terminal output after the bundle completes. In CI: type checking is a mandatory step that must pass before merge. The tradeoff: during local development, you get the build output faster (the type checker hasn't finished), but type errors still appear within a few seconds. For most engineers: this is actually better. The browser refreshes immediately with the new code, and the type errors appear while you're looking at the result. Before: you waited 6.8 seconds staring at the terminal before seeing anything. The constraint: modules with `const enum` must use `declare const enum` with isolatedModules. We had 3 occurrences — fixed in the migration."

**"How do you prioritize tech debt vs feature work?"**
> "The framing I use with the Domain Lead: tech debt has a carrying cost. Node 14 on EOL: every day we delay is a day of unpatched security risk. That's not theoretical — it's measurable. The 28-second build time: if I can show that fixing it saves X engineer-hours per week, and the migration costs Y engineer-hours, then ROI = X / Y. If ROI is > 2 (payback in less than 2 quarters): hard to argue against. Most infrastructure improvements have ROI > 10. The harder conversation is 'medium' tech debt: old patterns that work but are suboptimal. These I schedule for quiet periods (after a big feature launch) rather than forcing them to compete with P0 features."

**"What's your mentoring philosophy in one sentence?"**
> "Teach the reasoning, not the answer: an engineer who understands *why* a pattern is correct can apply it to the next problem; an engineer who just copied the fix cannot."

**"How do you ensure best practices are actually followed, not just documented?"**
> "Documentation alone fails. People don't read wikis. Three enforcement mechanisms: (1) ESLint custom rules for patterns we care about — if the linter catches it, the engineer sees it immediately in their IDE, not at code review. (2) Code review is the second gate — I mention the best practice in the PR comment and link to the wiki page. Over time, engineers internalize the pattern. (3) New engineer onboarding — the first task is reading the best practices and asking questions. Understanding the 'why' during onboarding means you don't need to re-explain it in every code review. The goal: engineers enforce the standards on each other. When that happens, I know the culture is set."

---

## 🔗 Unified Narrative

> "The SE III role at TERA is fundamentally about leverage. Every infrastructure improvement I make applies to every engineer on the team, every day. The 64.18% build time reduction — that is not one engineer being faster. That is the entire team getting faster. The 0% flake rate — that is every PR that passes CI being trustworthy. These are platform investments, not feature contributions.
>
> The four quantified improvements are not isolated wins. They are part of a systematic approach: audit → diagnose → propose → implement → measure. The tech roadmap with the Domain Lead is the structure that makes this systematic. Without the roadmap, improvements happen reactively (when something breaks). With the roadmap, improvements happen proactively (before things break).
>
> Node 14 reaching EOL is not a surprise — the date is announced years in advance. A team without a tech roadmap discovers this when Node 14 stops receiving security patches and suddenly has unpatched CVEs. A team with a tech roadmap migrated to Node 20 two months before the EOL date, on schedule, without urgency.
>
> The mentoring work is the longest-leverage investment. A senior engineer's impact through code is bounded by how fast they can write. A senior engineer's impact through mentoring scales: every junior engineer who becomes mid-level is now contributing at a higher level. The three engineers I mentored — their improved code quality, their faster debugging, their better PRs — these compound over their entire careers at Traveloka and beyond."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I migrated to Rspack" | "**64.18% build time reduction**: profiled with speed-measure-webpack-plugin → bottlenecks: babel-loader (8.4s/30%) + tsc (6.8s/24%). Solution: **Rspack** (Rust, parallel, SWC included) + **isolatedModules** + **fork-ts-checker** (type checking non-blocking, parallel). Also: LightningCSS replacing PostCSS, pnpm replacing npm. Cold build: 28.1s → 10.1s. HMR: 1.5s → 200ms." |
| "I reduced memory usage" | "**49.15% memory reduction**: dev server 1340MB → 590MB (Rspack stores module graph in Rust heap, not V8 JS heap, no GC pressure). Jest 640MB → 360MB (--maxWorkers=50%, --workerIdleMemoryLimit=512MB, jest-circus lighter runner). **Diagnosed via**: heap snapshots before/after in Chrome DevTools + Node --inspect." |
| "I fixed vulnerabilities" | "**42.2% reduction in vulns/package**: baseline npm audit (73 vulns: 1 critical/5 high/18 medium/49 low). Fixed: Node 14 EOL→20 (−12 vulns), removed unused packages aws-sdk+webpack-bundle-analyzer (−8 vulns), direct upgrades (−26 vulns). **Sustained**: Renovate bot (daily dep updates, automerge patches), pnpm audit --audit-level=high in CI (CRITICAL/HIGH block PR)." |
| "I fixed flaky tests" | "**0% flake rate** (from 18%): 4 root causes → 4 fixes. (1) Time-dependent: jest.useFakeTimers()+setSystemTime. (2) Real network in tests: **MSW node adapter** (intercepts fetch, onUnhandledRequest:'error' forces explicit mocking). (3) Async race: waitFor() instead of bare expect after click. (4) Module state leaks: jest.resetModules()+factory functions. CI: no re-runs needed, −23% CI time." |
| "I mentored juniors" | "Mentored 3 engineers (Junior→Mid, Intern→SE I, Junior→Mid). **Approach**: weekly 1:1 (blockers+growth topic), code review as teaching ('what happens when X is null?'), pair programming with **mentee driving** keyboard, graduated ownership (shadow→co-build→solo+review→project owner). **Metric**: engineer independence, PR revision rounds decreasing, level progression." |

---

## 📊 Quick Facts

```
Company:   Traveloka — Accommodation Front-End Web Domain
Role:      Software Engineer III (Web) / Infrastructure Lead
Scope:     Platform for the entire Accommodation FE Web team

FOUR KEY METRICS:
  Build time:    −64.18% (28.1s → 10.1s cold build)
  Memory usage:  −49.15% (dev server + test runner)
  Vulnerabilities: −42.2% per audited package
  Test flake rate: 0% (from 18% in CI)

BUILD TOOLCHAIN MIGRATION:
  Bundler:       Webpack 4 → Rspack 1 (Rust, parallel, Webpack-compatible)
  Transpiler:    Babel → SWC (built into Rspack)
  Type checking: tsc blocking → isolatedModules + fork-ts-checker (parallel)
  CSS:           PostCSS → LightningCSS (Rust, single-pass)
  Pkg Manager:   npm → pnpm (content-addressable store, strict)

SECURITY:
  Baseline:  npm audit (73 vulnerabilities)
  Fixed:     Node 14 EOL→20, unused pkg removal, direct upgrades
  Sustained: Renovate bot + CI gate (CRITICAL/HIGH block PR) + Semgrep SAST

TEST STABILITY:
  Root causes eliminated: fake timers, MSW API mocking, waitFor, module reset
  Result: 0% flake over 100 consecutive CI runs. CI time −23%.

TECH ROADMAP:
  Structure:  Quarterly roadmap with Domain Lead
  Process:    Tech debt audit → prioritization → one-page proposal → approval
  ADRs:       7 architectural decisions documented (Rspack, SWC, pnpm, MSW, Renovate, LightningCSS, Vitest eval)

MENTORING:
  Engineers:  3 (Junior→Mid × 2, Intern→SE I × 1)
  Approach:   Structured 1:1s, teaching code reviews, mentee-driven pair programming, graduated ownership
  Metric:     Engineer independence, level progression (ultimate goal)
```

---

*Document last updated: June 2026 · TERA SE III interview preparation*
