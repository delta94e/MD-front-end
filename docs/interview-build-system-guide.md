# 🎯 Interview Guide — JS Build & Deploy System
## Breaking the FE Monolith · Modular Pipeline · Scala + JavaScript Infrastructure

---

## 🔑 Context: Why This Work Is Impressive

```
HISTORICAL CONTEXT (~2014-2016):
  Webpack 1.x existed but was not yet dominant — it was complex and poorly documented.
  Grunt and Gulp were the standard task runners.
  Browserify was the leading bundler for CommonJS modules.
  Babel was new (released 2014) — ES6 was just landing.
  "Microfrontend" as a term did not exist yet (coined 2016).
  Module Federation did not exist (Webpack 5, 2020).

  In this context, breaking a frontend monolith required:
  - INVENTING the architecture, not following a documented pattern
  - Building or composing tooling from scratch
  - Convincing engineering leadership that this was worth the investment
  - Doing it in Scala (the company's backend language) as well as JavaScript

  This is harder and more impressive than it sounds when described on a resume.
  The interviewer who understands the era will recognize this immediately.

SCALA ON A FE TEAM — WHY IT HAPPENS:
  Companies with Scala/Play Framework backends have their entire deployment
  infrastructure, CI system, and build tooling integrated with sbt (Scala Build Tool)
  and Play's asset pipeline. The "front-end infrastructure" team owns the full stack:
  - JavaScript build tooling (Node.js, Babel, Browserify)
  - The Scala services that serve assets (Play Framework HTTP)
  - The build orchestration layer (Akka actors, sbt plugins)
  You cannot own FE infra at a Scala shop without writing Scala.
```

---

## 1️⃣ Breaking the Front-End Monolith

### What the monolith meant in practice

```
THE MONOLITH PROBLEM (concrete):
  One Git repository. One package.json. One Webpack/Grunt config (or equivalent).
  One build: takes every team's JavaScript, compiles it together, produces one bundle.

  When a monolith serves 4 product teams:
  - Checkout team: /checkout/* — buy flow, payment, order confirmation
  - Dashboard team: /app/* — user dashboard, settings, profile
  - Admin team: /admin/* — internal tooling, support features
  - Marketing team: /landing/* — landing pages, campaigns

  Every deploy requires all 4 teams to be ready:
  - Marketing wants to ship a campaign landing page → blocked until Checkout is ready
  - Checkout has a critical bug fix → pushes all 4 teams to rush their QA
  - Admin has a regression → everyone rolls back, including the unrelated teams
  - Build takes 18 minutes because it compiles all code — even unchanged apps

  The bundle delivered to EVERY user:
  - User visits /checkout (buy flow) → downloads 2.4MB including admin and marketing code
  - Admin code: never used by this user
  - Marketing code: never used by this user
  - 60% of the bundle is wasted bandwidth for most users

  The psychological effect:
  - Teams stop deploying frequently — too risky, too much coordination overhead
  - Engineers start batching changes → larger, riskier PRs
  - "We only deploy on Tuesdays" becomes policy because deploys are events, not routine
```

### STAR Script

```
SITUATION:
  The company's frontend was a single monolithic JavaScript application.
  Four product teams all committed code to one repository, built one bundle,
  and deployed together. The consequences were measurable:
  - Average deploy frequency: twice per week (industry best practice: many times per day)
  - Build time: 18 minutes — every change in any team triggered the full build
  - Any rollback affected all teams — a Marketing bug could roll back a Checkout release
  - The bundle size was 2.4MB, delivered to every user regardless of which app they used

TASK:
  I was on the front-end infrastructure team, responsible for building a JavaScript
  build and deploy system that would enable each SPA to be built and deployed
  independently. The system needed to work within the existing Scala/Play infrastructure
  the company had built — which meant writing Scala, not just JavaScript.

ACTION:
  ARCHITECTURE DECISIONS:

  1. APP REGISTRY:
     A single configuration file declaring all SPAs:
     their entry point, route prefix, shared dependencies, and deploy config.
     This is the source of truth — CI and the build system read from it.

  2. PER-APP BUILD PIPELINE:
     Each SPA gets its own isolated build pipeline:
     transpile (Babel) → lint (ESLint) → bundle (Browserify) → test (Mocha)
     → hash (content-addressable filename) → deploy (S3 upload)
     Builds run in parallel — 4 SPAs build simultaneously, not sequentially.

  3. ASSET MANIFEST:
     A JSON file mapping app name → hashed bundle URL:
     { "checkout": "bundle.a4f2c3d1.js", "dashboard": "bundle.9c2e1a4f.js", ... }
     When Checkout deploys a new bundle, only the checkout key updates.
     Dashboard, Admin, Marketing entries are untouched.
     The Scala asset server reads this manifest to serve the correct script tag.

  4. CONTENT HASHING:
     Bundle filenames include a content hash: bundle.a4f2c3d1.js
     This enables aggressive CDN caching (1-year cache headers) without stale content.
     When the bundle changes, the hash changes, the URL changes — cache automatically
     invalidates. No server-side cache invalidation config required.

  5. SHARED VENDORS BUNDLE:
     React, Lodash, and other shared dependencies are compiled into a separate
     vendors bundle, also content-hashed. Each SPA declares these as "external"
     and does not include them in its own bundle.
     A React upgrade changes the vendors bundle only — SPA bundles are unaffected.

RESULT:
  - Deploy frequency: 2×/week → 5-10× per day (each team on their own schedule)
  - Build time: 18 min (monolith) → 3-5 min per SPA (parallel, independent)
  - Rollback blast radius: from "all teams" to "the specific SPA"
  - Bundle size for a /checkout user: 2.4MB → 240KB + 120KB vendors = 360KB total
  - Marketing team ships landing page campaigns independently — no coordination
    with Checkout, Dashboard, or Admin required
```

### Follow-up Q&A

**"Why build a custom system instead of just using Webpack?"**
> "In 2014-2015, Webpack was not the mature, well-documented tool it became later. Webpack 1.x existed but had poor documentation and inconsistent behavior — especially for the multi-SPA use case we needed. More importantly, our requirements were specific: the system needed to integrate with a Scala/Play deployment infrastructure that had its own build model and asset pipeline. Off-the-shelf tools assumed you were starting fresh. We were plugging into an existing system. We used Babel and Browserify as components within our pipeline — we did not reinvent transpilation or bundling. But the orchestration layer (how you trigger a build for one app without rebuilding others, how you update the manifest atomically, how you integrate with the Scala CI system) required custom work."

**"How do you decompose a monolith without breaking everything at once?"**
> "Strangler fig pattern — you do not switch all at once. We started with the app that had the clearest boundaries and the lowest risk: Marketing. Marketing pages shared almost no code with the other apps, had their own team, and were frequently updated. We extracted Marketing first, proving the architecture, and left the monolith serving the other three apps unchanged. Then Admin — also relatively isolated. Then Dashboard. Checkout last because it was the most complex and most business-critical. Each extraction reduced the monolith by one SPA. At the end, the monolith was gone. But no one had to deploy a 'big bang' migration — each extraction was its own low-risk change."

**"What was the hardest part?"**
> "The shared state problem — specifically, user session and authentication. In the monolith, all four apps shared one session model, one auth library, one cookie. When we extracted them as independent SPAs, each app needed to authenticate the user. The solution: a single httpOnly session cookie on the top-level domain (company.com), shared across all subpaths. Each SPA reads the same cookie — no changes required. But this exposed a problem: if the cookie format changed, all four SPAs needed to update simultaneously. We solved this by introducing a session microservice — a tiny Scala service that validated the session token and returned user identity. SPAs called the service, not the cookie directly. This decoupled SPAs from the session format."

---

## 2️⃣ Modular Build Pipeline: Transpile → Bundle → Test → Deploy

### Each stage explained for an interview

```
STAGE 1: TRANSPILE (Babel)
  Why: ES6+ features (arrow functions, classes, modules, template literals)
       are not supported in all browsers of the era (IE11, old Safari).
  What Babel does: walks the AST and transforms ES6 syntax to ES5 equivalent.
  Input:  src/checkout/index.js (ES6+)
  Output: build/checkout/transpiled/index.js (ES5)
  Config: .babelrc with preset-env (target: > 1% browser market share)
  Also: JSX → React.createElement() calls

STAGE 2: LINT (ESLint)
  Why: Catch errors early — before bundling or tests run.
       Consistency: one code style across teams using the same config.
  What it checks: unused variables, console.log in production, unsafe patterns,
                  code style (semicolons, quotes, indent) via shared .eslintrc.
  Hard failure: any lint error fails the build — not a warning.
  Key rule: "fail fast" — lint before bundling saves the bundling time.

STAGE 3: BUNDLE (Browserify)
  Why: Browsers in 2014-2015 do not support require() or CommonJS modules.
       The bundle resolves all require() calls at build time, producing one file.
  What Browserify does: starts at the entry point (index.js), traverses the
       dependency graph by following every require(), concatenates all modules
       into one file with a lightweight runtime for module resolution.
  External: React, Lodash etc. are declared external → not included in the bundle.
            They are loaded separately from the vendors bundle.
  Output: build/checkout/bundle.js

STAGE 4: UNIT TESTS (Mocha + Karma)
  Mocha: Node.js-based test runner for pure logic tests.
  Karma: Browser test runner — runs the same tests in a headless browser
         to catch browser-specific issues (DOM APIs, event handling).
  Coverage gate: builds fail below 80% branch coverage.
  Key: only the changed SPA's tests run — not all tests.
       This is a huge CI time saving vs the monolith.

STAGE 5: CONTENT HASH
  Why: CDN caching. We set Cache-Control: max-age=31536000 (1 year) on bundles.
       If the URL never changes, the CDN never re-fetches — even if the content changes.
       Content hashing solves this: the hash changes when the content changes.
       New hash = new URL = CDN fetches the new file.
  How: MD5 or SHA-256 of the bundle content → append to filename.
       bundle.js → bundle.a4f2c3d1.js (first 8 chars of hash)
  Manifest update: { "checkout": "bundle.a4f2c3d1.js" }

STAGE 6: DEPLOY (S3 + CDN)
  Upload: hashed bundle to S3 at /assets/checkout/bundle.a4f2c3d1.js
  Manifest: update dist/manifest.json with new checkout entry
  Old bundle: remains in S3 — users who loaded the old page before the deploy
              still have the old URL in their browser — it still works.
  CDN: S3 bucket is fronted by a CDN (CloudFront).
       First request per CDN edge: fetches from S3 → caches.
       Subsequent requests: served from CDN edge.
```

### Follow-up Q&A

**"Why content hashing instead of version numbers?"**
> "Version numbers are sequential — you have to decide what they mean and increment them manually or via a process. Content hashes are automatic and deterministic: the same source code always produces the same hash. If I make two changes and revert one, the hash goes back to the previous value — the CDN will hit the cache for the unchanged version. With version numbers, you would have incremented to v1.3, and v1.1 would be gone. Content hashing also prevents accidental cache poisoning: if two different people build the same source code, they get the same hash — you can verify the build is reproducible."

**"How did you ensure the old bundle was still accessible after a new deploy?"**
> "We never deleted old bundles from S3. Every deploy added a new file (bundle.new-hash.js) and updated only the manifest pointer. Users who had the old page loaded in their browser were still referencing bundle.old-hash.js — it was still in S3, still served from CDN. Their session worked fine until they refreshed. This is the 'continuous delivery' property: deploys are not destructive. The only thing that changes is the manifest — which is a tiny JSON file with a short cache header (60 seconds). New users get the new bundle within a minute of a deploy."

---

## 3️⃣ Scala on the Front-End Infrastructure Team

### What Scala was used for

```
THE SCALA/PLAY STACK:
  Play Framework: Scala's primary web framework (similar to Ruby on Rails for Scala).
  sbt (Simple Build Tool): Scala's build tool — the make/npm equivalent.
  Akka: Scala's actor-model library — for concurrent, distributed systems.

  In a Scala shop, the entire deployment pipeline is Scala.
  The CI/CD system, the asset serving, the build orchestration — all Scala.
  If the FE infra team does not write Scala, they cannot integrate with
  the rest of the company's infrastructure.

THREE SCALA CONTRIBUTIONS:

1. ASSET MANIFEST SERVER (Play Framework):
   An HTTP endpoint that reads the asset manifest JSON and returns
   the correct script URL for each SPA. HTML templates call this service
   to get the current bundle URL — they do not hardcode paths.

2. BUILD ORCHESTRATOR (Akka Actors):
   A service that receives build triggers (from CI webhook or API call),
   routes them to per-app build worker actors, and manages worker capacity.
   Each SPA has its own actor — builds run in parallel without interference.
   On completion: updates the manifest, notifies the requester.

3. sbt PLUGIN:
   An sbt plugin that hooks the JavaScript build pipeline into the Scala
   build lifecycle. `sbt deploy` builds BOTH the Scala backend and the
   JavaScript SPAs. Ensures they are always deployed as a matched pair.
```

### Follow-up Q&A

**"Isn't it unusual for a front-end engineer to work in Scala?"**
> "It is less unusual than it sounds when you are on a front-end INFRASTRUCTURE team rather than a product team. A product front-end engineer uses the build system; a front-end infrastructure engineer builds and maintains it. At a company with a Scala backend, the infrastructure — CI, deployment, asset serving — is Scala. You cannot build a build orchestrator that integrates with the company's CI system without writing in the language that CI system is written in. The Scala work was not exotic — it was Write an HTTP handler, parse a JSON file, trigger a child process, return a response. Straightforward Scala. The interesting part was the system design: what does the asset manifest look like, how does the Akka build actor handle concurrent builds for different apps, how does the sbt plugin integrate the JS and Scala builds."

**"What specifically did you learn from writing Scala as a JavaScript engineer?"**
> "Several things that improved my JavaScript: Scala's type system is much stricter than TypeScript — working in Scala made me appreciate what a genuinely sound type system catches. Scala's immutability by default (val vs var, immutable collections) made me more deliberate about mutation in JavaScript. And Akka's actor model is a specific form of message-passing concurrency — understanding it gave me a clearer mental model for the event loop in JavaScript. They are different concurrency models, but thinking carefully about one helps you reason about the other. The exposure to functional programming (Scala encourages it strongly) also changed how I approach data transformation in JavaScript — I reached for map/filter/reduce more naturally after writing Scala."

---

## 🔗 Unified Narrative

> "The build and deploy system project is one of those foundational infrastructure investments that most engineers never get to make — because by the time it's needed, it already exists.
>
> We were at the point where the monolith was visibly hurting teams: deploy frequency was twice a week, build times were 18 minutes, and one team's rollback affected everyone. The solution was architectural, not just tooling: separate the monolith into independently buildable, independently deployable SPAs, each with its own pipeline.
>
> The pipeline design was straightforward once you understood the requirements: transpile (Babel for ES6), bundle (Browserify for CommonJS resolution), test (Mocha, with a coverage gate), hash (content-addressable filenames for CDN caching), deploy (S3, manifest update). The interesting decisions were in the system design: the asset manifest as the decoupling mechanism between builds and deployments, the shared vendors bundle as the one thing all SPAs share, the never-delete-old-bundles policy for safe deploys.
>
> The Scala work was required, not optional — the company's build and deployment infrastructure was Scala/Play/Akka. I wrote the asset manifest server in Play Framework, the build orchestrator using Akka actors, and an sbt plugin that hooked the JavaScript builds into the Scala build lifecycle.
>
> The outcome: teams went from deploying twice a week to deploying independently, multiple times a day. That is a cultural change enabled by an infrastructure change."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I used Webpack to break up the monolith" | "This was 2014-2015 — Webpack was not yet dominant. I built the orchestration layer using Babel and Browserify as components" |
| Không đề cập historical context | "In 2014, there was no Module Federation, no established MFE pattern — we designed the architecture ourselves" |
| "I built a build system" (too vague) | Describe the 6 stages: transpile → lint → bundle → test → hash → deploy, and why each stage exists |
| Không giải thích content hashing | "Content hash in the filename enables 1-year CDN cache without stale content — same source always produces same hash" |
| "I also did some Scala" | "The Scala work was required — the company's build infrastructure was Scala/Play. I wrote the asset server, build orchestrator, and sbt plugin" |
| Skip the deploy frequency metric | "Twice a week → many times per day is the business result. That is the metric that matters" |

---

## 📊 Quick Facts

```
Era:          ~2014-2016 (pre-Webpack dominance, pre-Module Federation)
Problem:      Frontend monolith — one build, coupled deploys, 2×/week frequency
Solution:     Custom build system: per-app pipeline + asset manifest + content hashing

JS tooling:   Babel (transpile ES6), Browserify (bundle CommonJS),
              Mocha + Karma (test), MD5 (hash), S3 + CDN (deploy)

Scala work:   Play Framework (asset manifest HTTP server)
              Akka actors (build orchestrator, parallel per-app workers)
              sbt plugin (JS build hooks into Scala build lifecycle)

Architecture: App registry → per-app parallel pipeline → asset manifest → Nginx routing
Key design:   Asset manifest decouples build from deployment
              Content hash enables aggressive CDN caching
              Shared vendors bundle prevents React duplication across SPAs
              Old bundles never deleted — safe rolling deploys

Results:      Deploy freq: 2×/week → many times per day per team
              Build time: 18 min → 3-5 min per SPA (parallel)
              Blast radius: all teams → specific SPA only
              Bundle size: 2.4MB → 240-380KB per SPA (10×+ reduction for most users)
```

---

*Document last updated: June 2026 · JS Build System & Scala FE Infrastructure interview preparation*
