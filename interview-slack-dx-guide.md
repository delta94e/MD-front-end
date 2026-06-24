# 💬 Interview Guide — Tech Lead · Frontend Developer Experience · Slack
## Slack, San Mateo CA — TypeScript Compiler Migration · Rust-based Bundling · DX Metrics

> **Role:** Tech Lead for the Frontend Developer Experience (DX) team at Slack. Focused on providing engineers with fast, stable, and ergonomic development tools. Led the migration of Slack's massive frontend codebase from standard `tsc` to a custom parallel Go-based typechecker `tsgo` (resulting in a 5x speedup). Coordinated the ongoing migration of Webpack to a Rust-based, high-performance bundler, cutting local HMR latency to 120ms. Established company-wide developer telemetry and led rollout strategies to 1,200+ engineers.

---

## 🧭 Four Core Themes

| Theme | Your one-liner |
|---|---|
| **Typecheck Speedup (tsc → tsgo)** | *"A 45-second typechecking loop destroys flow state. By writing a parallel typecheck graph partitioner in Go, we shrunk the edit-check loop to 9 seconds, saving hours of aggregate developer wait time every day."* |
| **Bundling Modernization** | *"Replacing Webpack is not just about choosing a modern compiler; it's about bridging 8 years of custom loaders and loaders in a zero-downtime transition. The Rust bundler config bridge achieved exactly that."* |
| **Telemetry-Driven DX** | *"If you don't measure compiler speeds on developer laptops, you are blind to silent regressions. Telemetry was our eyes, showing us when and where developers were getting blocked by build issues."* |
| **Organizational Rollout** | *"Rolling out tooling changes to 1,200+ developers is an exercise in risk mitigation and empathy. A one-command fallback flag (`--fallback`) was key to building developer trust during the transition."* |

---

## 🚀 Part 1 — Typecheck Speedup: `tsc` → `tsgo`

### The Slack context
- Slack’s frontend client is a massive monorepo containing over 1.5 million lines of TypeScript.
- Using standard, single-threaded `tsc` for complete project diagnostics was taking upwards of 45 seconds on standard developer laptops (MacBooks).
- **The problem:** Developers would write code, hit save, and wait almost a minute to see if they made a type error. This triggered context-switching, distraction, and massive productivity loss.

### The solution: `tsgo`
`tsgo` is a high-performance, concurrent typechecking pipeline developed at Slack. It wraps and optimizes type check tasks:
1. **Dependency Graph Partitioning:** Instead of running a single `tsc` process on the whole repo, `tsgo` maps imports and partitions the project into isolated type check sub-graphs.
2. **Go-based Parallel Runner:** Orchestrated via Go's concurrent channels and routines, it runs multiple typecheck workers concurrently, mapping to the processor cores of the developer's machine (e.g. 4 to 8 parallel checks).
3. **AST & Cache Serialization:** It hashes code blocks. If a package's exports (.d.ts API surface) haven't changed, all parent files that depend on it skip typecheck diagnostics entirely.

### Key Metrics
- Full check duration: **45s** down to **9s** (5x speedup).
- Local compile cache hits: **60%+** on average daily edits.
- Aggregate developer time saved: **2,200 hours/week** across the Slack engineering org.

---

## ⚡ Part 2 — Bundler Modernization: Webpack → Rust

### The Webpack bottleneck
- Slack's local bundler was Webpack. For deep files, Hot Module Replacement (HMR) took **1.8 to 2.5 seconds**.
- JavaScript-based loaders (Babel, custom CSS loaders) had to parse and compile assets on a single Node.js thread.
- As the code grew, Node memory limits frequently caused heap out-of-memory errors on developers' machines.

### The transition to Rust-based Bundling (Rspack / SWC)
We initiated the project to replace Webpack with a native, Rust-based bundler:
1. **Parallel Compilation:** Native Rust compilers execute tree-shaking, parsing, and HMR across all available CPU threads using Rayon.
2. **The Loader Bridge:** Created a translation layer mapping Slack's custom JS loaders to native SWC plugin equivalents, ensuring backward compatibility.
3. **Fast Refresh Integration:** Integrated React Fast Refresh inside the Rust bundle loop to enable state-preserving updates directly in the browser within **120ms**.

---

## 📊 Part 3 — Developer Experience Telemetry

### Why telemetry matters
> *"If you don't collect build telemetry, you don't know if your engineers are productive. We treated developer tooling with the same operational rigor as production Slack servers."*

### Telemetry framework
- **Local Dev Daemon:** A lightweight, non-blocking background script that hooks into compiling tasks and reports timing stats directly to an internal StatsD cluster.
- **CI Pipeline Observability:** Monitors test suite compile runtimes, webpack chunk sizes, and typecheck errors on pull requests.
- **Developer Sentiment Surveys:** Paired build metrics with monthly anonymous developer surveys to match quantitative performance with qualitative engineer happiness.

---

## 🤝 Part 4 — Platform Rollout & Leadership

### Rollout phases
To transition 1,200+ engineers without stopping product feature delivery:
1. **DX Internal Alpha:** Rolled out to the DX team (30 engineers) to catch obvious bugs.
2. **Product Teams Beta:** Opt-in program for 250 developers on specific product branches.
3. **Core Client GA:** Default compilation engine for all 900+ client developers.
4. **Org-wide Adoption:** Final migration, deprecation of older config files, and removal of legacy Webpack scripts.

### Risk Mitigation Strategy
- **Compiler Parity Validation:** An automated pipeline that checks if `tsgo` outputs the exact same diagnostic errors as standard `tsc`. If they mismatch, it flags it as a CI block.
- **Fallback Switch (`--fallback`):** If a local build fails or exhibits bugs, developers can immediately run `slack-dx --fallback` to revert their environment to Webpack/tsc instantly, preserving their day's work.

---

## ❓ 25 Interview Q&As

#### Q1: What is `tsgo` and why did you build it instead of using standard TypeScript tooling?
> *"`tsgo` is a custom, Go-based concurrent typechecking compiler wrapper built at Slack. Standard `tsc` is single-threaded and struggles on repositories with over 1.5 million lines of code. We built `tsgo` to partition the type graph, parallelize check tasks across all available CPU cores, and cache results based on module exports."*

#### Q2: How does `tsgo` parallelize typechecking when the TypeScript compiler is inherently single-threaded?
> *"It partitions the monorepo into independent packages or directories. It analyzes imports to construct a dependency graph. If two sub-graphs are independent (e.g. `packages/huddles` and `packages/canvas`), `tsgo` spawns concurrent Go routines to check them in parallel, communicating via Go channels."*

#### Q3: How do you prevent type-safety differences between `tsgo` and standard `tsc`?
> *"This was our biggest challenge. We ran a 'shadow validation' pipeline in CI post-merge. For 60 days, we ran both `tsc` and `tsgo` side-by-side on 24,000+ commits. If `tsgo` missed an error caught by `tsc`, it triggered a telemetry alert. We found 4 core AST resolution discrepancies and patched them until we achieved 100% parity."*

#### Q4: What is cache serialization in `tsgo` and how does it save time?
> *"We hash the `.d.ts` (declaration files) representing the API surface of a module. If the source file changes but its external exports remain identical, we skip re-typechecking all parent packages that import it. This cuts typechecking time for daily incremental edits from 45s down to under 5s."*

#### Q5: Why did you decide to replace Webpack?
> *"Webpack is JS-based and single-threaded. At our scale, compile/HMR loops were taking up to 2.5 seconds, and memory consumption regularly triggered Node.js out-of-memory crashes on dev laptops. We needed a multi-core, native-compiled solution to keep compile times sub-second."*

#### Q6: Which Rust-based alternative did you choose and why?
> *"We chose Rspack paired with SWC. It was designed as a high-performance Webpack replacement, matching its architecture closely. This allowed us to keep Webpack's layout and plugin system while gaining the raw execution speed of Rust."*

#### Q7: How does Rspack improve HMR times to 120ms?
> *"Rspack performs incremental compilation in native Rust. It keeps an in-memory dependency tree and only re-compiles the exact path of the edited file, sending tiny hot patches directly over the WebSockets connection without re-bundling other files."*

#### Q8: What was the hardest part of migrating away from Webpack?
> *"The sheer volume of custom configurations. Over 8 years, product teams had written 180+ custom Webpack loaders, plugins, and overrides. We built a translation bridge to map old configs to SWC options, and ran visual regression checks to verify bundle parity."*

#### Q9: How do you verify visual parity between Webpack and Rust-produced builds?
> *"We integrated Percy into our automated testing framework. For candidate builds, it renders pages built by both engines side-by-side, taking visual screenshots. Any visual diff (a button shifted by 1px or a different font weight) immediately blocks the release."*

#### Q10: How did you implement developer experience telemetry without slowing down local builds?
> *"We ran a lightweight, non-blocking Go daemon locally. It listens to compilation hook outputs and pushes small JSON payloads asynchronously to a StatsD metric gatherer. It consumes less than 0.5% CPU and is completely invisible to developers."*

#### Q11: What metrics did your DX dashboard track?
> *"We monitored four core metrics: (1) local compiler edit-to-refresh time (p95), (2) local typechecking time, (3) CI pipeline duration, and (4) local tool crash rates. We tracked these metrics on a dashboard accessible to all teams."*

#### Q12: How do you measure the success of a developer experience team?
> *"Success is measured by developer flow: keeping build loop times under 2 seconds, typechecking under 10 seconds, and minimizing local setup failure rates. We also pair this data with monthly sentiment surveys to ensure qualitative happiness is high."*

#### Q13: What is the fallback mechanism (`--fallback`) and why is it important?
> *"When distributing experimental tooling to 1,200+ developers, some setups will break. To preserve trust, we added a `--fallback` flag. If an engineer runs into an issue, the CLI immediately reverts their configuration to standard Webpack and `tsc`, and logs the debug files to us."*

#### Q14: How did you handle rollout communication to developers?
> *"We did not force developers to upgrade. We created an opt-in beta channel. When developers saw colleagues typechecking in 9 seconds instead of 45, organic interest drove beta adoption from 10% to 70% within a month."*

#### Q15: What is AST type checking and why does it slow down compilers?
> *"AST (Abstract Syntax Tree) parsing turns text into structured syntax nodes. Typechecking requires traversing this tree and resolving references across files. This is computationally expensive, especially when navigating complex nested TypeScript interface trees."*

#### Q16: How did you deal with Node.js heap out-of-memory errors?
> *"By moving from Node-based Webpack loaders to SWC. SWC performs compilation in native Rust, which uses C-like memory allocations outside the Node V8 garbage collection limits, eliminating memory exhaustion issues."*

#### Q17: What role does React Fast Refresh play in your dev toolchain?
> *"It allows components to hot-reload in the browser while maintaining their current React state (e.g. open dropdowns or filled inputs). Moving to a Rust compiler allowed us to execute Fast Refresh in 120ms, making style edits instant."*

#### Q18: What is shadow verification mode in CI?
> *"Running a new compiler in the background on production code changes without blocking the PR build. We compiled every PR with both `tsc` and `tsgo`, outputting logs to validation checkers. This proved `tsgo` was production-ready before any developer used it."*

#### Q19: Why not just use ESBuild for typechecking?
> *"ESBuild is a bundler and transpiler, but it explicitly does not perform typechecking. It strips types and converts TS to JS. We still needed a static diagnostic tool, which is why we built `tsgo` using a parallel graph approach."*

#### Q20: How do you resolve merge conflicts in a 1,200-developer monorepo?
> *"We wrote automatic lockfile regenerators in our Git hooks. When developers merge and face lockfile discrepancies, the local git hook automatically runs a fast resolution script to re-align dependencies, preventing manual merge pain."*

#### Q21: What is a dependency graph partitioner?
> *"A parser that reads package import statements to detect references. It divides a massive repository into nodes. Independent branches of this graph can be compiled simultaneously, while branches that depend on each other are scheduled in order."*

#### Q22: What is the difference between static typechecking and transpilation?
> *"Transpilation converts code (TypeScript to JavaScript) by stripping types. It is very fast. Typechecking validates that variables match their type interfaces. It requires deep analysis of cross-file imports and is the slow part of builds."*

#### Q23: How do you gather developer feedback qualitatively?
> *"We hold monthly open developer forums, distribute anonymous satisfaction forms, and monitor a dedicated Slack channel (`#frontend-dx-feedback`) where developers report bugs or suggest feature tooling changes."*

#### Q24: What is the biggest lesson you learned as a DX Tech Lead?
> *"A developer tooling change is only successful if it is adopted. You can build the fastest compiler in the world, but if engineers find it unstable and use fallbacks, your team's impact is zero. Build for stability first, then speed."*

#### Q25: How does a DX team save company revenue?
> *"A 5x reduction in check loops saves 10-15 minutes of developer waiting time per day. For 1,200 developers, that aggregates to 200+ developer hours saved daily, representing millions of dollars in developer productivity returned to the business."*

---

## 🎤 Opening Statement (60 seconds)

> *"I am the Tech Lead for the Frontend Developer Experience team at Slack, where our goal is to provide engineers with fast, stable, and ergonomic development tools. 
>
> Recently, I led a major project migrating our massive TypeScript codebase from single-threaded `tsc` to `tsgo` — a custom parallel Go-based typecheck runner. By partitioning our dependency graph and running checks concurrently across cores, we achieved a 5x reduction in local typechecking, dropping loop runtimes from 45 seconds down to 9 seconds.
>
> We also modernised our bundler loop, starting a migration from Webpack to Rspack and SWC. By building a loaders translation bridge and integrating React Fast Refresh, we got local HMR latency down to 120ms.
>
> Key to these projects was our implementation of non-blocking developer telemetry on compile metrics, paired with a phased rollout and a zero-risk `--fallback` flag. This saved the engineering organization thousands of wait hours per week while maintaining developer trust throughout the transition."*

---

## 📎 Demo Tab in App

Live at: **💬 Slack Dev Experience** tab.

- **🚀 tsc → tsgo** — Side-by-side compile runner. Contrast single-threaded progress vs concurrent GoRoutine execution with caching.
- **⚡ Webpack → Rust** — Interactive HMR latency editor. Change button color and see instant hot reload updates.
- **📊 DX Telemetry** — Interactive comparison showing build speed metrics before and after the migration.
- **🤝 Rollout Playbook** — Phased cohort tracker and expandable list of risks and developer fallback strategies.
