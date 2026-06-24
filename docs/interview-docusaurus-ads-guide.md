# 📚 Interview Guide — Facebook Engineering
## Docusaurus Lead Maintainer · v2 Alpha · Ads Front-End Infra State Management

---

## 🔑 Context: Why This Experience Is Uniquely Valuable

```
TWO VERY DIFFERENT BUT COMPLEMENTARY EXPERIENCES:

1. DOCUSAURUS — Open Source leadership at scale
   The world's most influential OSS documentation tool, by Facebook.
   Lead Maintainer = you set the direction for a project used by
   tens of thousands of organisations, including React, Jest, Redux, Babel.
   v2 alpha = you did not just contribute to it. You CONCEPTUALISED it.
   "What should the next generation of Docusaurus look like?" — that was you.

2. ADS FRONT-END INFRA — State management at Facebook Ads scale
   Facebook Ads Manager is one of the most complex UIs ever built.
   Campaign → Ad Set → Ad: three levels, dozens of fields each,
   complex interdependencies, real-time validation, undo/redo.
   "Infra" means: you built tools FOR OTHER ENGINEERS, not features for users.
   Building infra at Facebook scale = your work multiplies the effectiveness
   of every Ads engineer who uses your tools.

TECHNOLOGY STACK SIGNIFICANCE:
  React, Relay, GraphQL — Facebook invented all three.
  You used these technologies at their origin company.
  Redux, Flux — you used both, and lived through the evolution.
  Flow — Facebook's type system before TypeScript existed.
  Hack — Facebook's server language. Full-stack context.
  Jest — Facebook's testing framework. You tested with the tool
         that became the industry standard.
```

---

## 1️⃣ Docusaurus — Lead Maintainer

### What "Lead Maintainer" means (and why it's different from "contributor")

```
CONTRIBUTOR: "I opened a PR that added a feature I needed."
LEAD MAINTAINER: "I am responsible for the health, direction, and quality
                  of a project that thousands of organisations depend on."

SPECIFIC RESPONSIBILITIES AS LEAD MAINTAINER:

1. PR REVIEW — EXTERNAL CONTRIBUTORS:
   Docusaurus has contributors from all over the world.
   Each PR: understand the change, assess whether it aligns with the
   project's direction, check: correctness, API design consistency,
   backwards compatibility, test coverage, documentation.
   If correct but wrong API design: provide clear feedback, guide
   the contributor to the right approach.
   This is TECHNICAL LEADERSHIP, not just code review.

2. ARCHITECTURAL DECISIONS:
   When planning v2: should we keep the Gatsby dependency (as v1 used)?
   Answer: No — Gatsby adds complexity we do not control, and limits
   what we can optimise. Build a custom webpack pipeline from scratch.
   This single decision affected:
   - Build performance (we could optimise our own pipeline)
   - MDX integration (we could control the compilation chain)
   - Plugin system design (we could define our own extension points)
   Wrong decision = thousands of downstream users are affected.

3. BACKWARDS COMPATIBILITY:
   A docusaurus.config.js file written in 2020 must still work.
   Every API change requires: who uses this? Can they migrate?
   How do we communicate breaking changes? What is the migration path?
   The "semver social contract" — major version for breaking changes,
   migration guide for every breaking change, deprecation warnings
   before removal.

4. COMMUNITY LEADERSHIP:
   GitHub issues, RFC discussions, roadmap transparency.
   When something is not going to ship: say so clearly.
   When a decision is controversial: document the reasoning publicly.
   The community trusts you not just to write good code,
   but to be trustworthy stewards of the project.

5. CONCEPTUALISING v2 ALPHA:
   This is the highest-leverage item on the CV.
   "Conceptualised" means: the vision was yours.
   v2 is not v1 + features. It is a fundamentally different system.
   MDX: didn't exist in v1. Plugin system: didn't exist. Swizzling: new.
   To "conceptualise" v2 means: "I looked at where documentation tooling
   was heading, identified the gaps in v1, and designed what the next
   generation needed to be."
```

### Docusaurus v2 — The Architectural Choices

```
THE KEY QUESTION: "What did you actually change in v2 vs v1?"

v1 → v2 IS A COMPLETE REWRITE. Here is what changed and WHY:

1. GATSBY DEPENDENCY → CUSTOM WEBPACK PIPELINE
   v1 used Gatsby as its build foundation.
   Problems with Gatsby:
     - Docusaurus was constrained by Gatsby's plugin system
     - Upgrade coordination: Gatsby changed APIs, Docusaurus broke
     - Build performance: Gatsby's overhead for a documentation site
       was unnecessary
   v2 decision: build our own webpack pipeline from scratch.
   Benefit: we control every optimisation, every extension point.
   We can make the build as fast as possible for documentation use cases.

2. MARKDOWN-ONLY → MDX (JSX in Markdown)
   This is the biggest user-facing change in v2.
   
   WHY MDX MATTERS:
   Plain Markdown can render text and code. That is all.
   To show a tabbed code example in v1, you needed a custom plugin
   that parsed a non-standard Markdown syntax:
   ```
   <!-- DOCUSAURUS_CODE_TABS -->
   <!-- npm -->
   npm install
   <!-- yarn -->
   yarn install
   <!-- END_DOCUSAURUS_CODE_TABS -->
   ```
   This is fragile, non-standard, and limited.
   
   With MDX in v2:
   ```jsx
   import Tabs from '@theme/Tabs';
   import TabItem from '@theme/TabItem';
   
   <Tabs>
     <TabItem value="npm" label="npm">npm install</TabItem>
     <TabItem value="yarn" label="Yarn">yarn install</TabItem>
   </Tabs>
   ```
   This is: React components, inside Markdown, with full JSX expressiveness.
   The React docs (react.dev) use MDX to embed interactive sandboxes.
   Docusaurus v2 made this possible.
   
   MDX COMPILATION PIPELINE (what I built):
   .mdx file
     → @mdx-js/loader (webpack loader)
     → remark pipeline (Markdown → mdxast)
     → rehype pipeline (mdxast → hast → JSX)
   → Real React component (ES module)
     → webpack bundle
   → Static HTML + JS
   
   The key: the output is a real React component.
   It can be imported, composed, wrapped. Markdown is no longer a dead end.

3. NO PLUGIN SYSTEM → PLUGIN ARCHITECTURE
   v1: all features were baked into Docusaurus itself.
   To add blog support: it was built-in. To remove it: you couldn't.
   v2: EVERYTHING is a plugin:
     @docusaurus/plugin-content-docs  → documentation pages
     @docusaurus/plugin-content-blog  → blog
     @docusaurus/plugin-sitemap       → sitemap.xml
     @docusaurus/plugin-google-analytics → analytics
   
   What this means:
   - Teams only include the plugins they need
   - External developers can write first-class plugins
   - The docs plugin and the blog plugin are peers —
     neither is special. Your plugin can be equally first-class.
   - Testing: each plugin is independently testable

4. CSS OVERRIDES → SWIZZLING
   v1 theming: inspect the DOM, write CSS selectors, fight specificity.
   v2 swizzling: override any theme component at the React component level.
   
   CLI: `npx docusaurus swizzle @docusaurus/theme-classic NavBar`
   This ejects the NavBar component's source into your src/theme/ directory.
   You now own that component. Modify it. Add a login button. Change the layout.
   The rest of the theme is untouched.
   
   Why this is powerful: you do not need to fork Docusaurus to customise it.
   You override only what you need to override.

5. JAVASCRIPT ONLY → TYPESCRIPT FIRST
   v1: no TypeScript support.
   v2: the theme, plugins, and config file are fully typed.
   
   docusaurus.config.ts (not .js):
   TypeScript types for every config option.
   Wrong config option name = compile error.
   Missing required field = compile error.
   Before shipping: you know your config is valid.

6. NO i18n → BUILT-IN INTERNATIONALISATION
   v2 ships with locale routing:
   /en/docs/getting-started → English
   /fr/docs/getting-started → French
   /ja/docs/getting-started → Japanese
   Translation workflow: export strings, translate in external tools (Crowdin),
   import translations. One configuration, unlimited locales.
```

### The Ecosystem — Why This Is Impressive

```
PROJECTS THAT USE DOCUSAURUS FOR THEIR OFFICIAL DOCUMENTATION:
  React, Jest, Redux, Babel (all Facebook/Meta OSS projects)
  Supabase, Ionic, Deno, Prettier, React Router, React Native, Create React App
  Plus 50,000+ other OSS and commercial documentation sites.

WHY BEING THE LEAD MAINTAINER OF THIS PROJECT IS INTERVIEW GOLD:
  
  "I was the lead maintainer of a tool that the React team uses for
  the official React documentation."
  
  That is the pedigree of the project.
  
  "I conceptualised and built v2 alpha — the architectural foundation
  that MDX support, the plugin system, and swizzling are built on."
  
  That is the scope of the contribution.
  
  "Docusaurus has 57k+ GitHub stars, 3M+ npm downloads per week,
  and is used by 50,000+ documentation sites."
  
  That is the scale at which your work operates.
```

### STAR Script — Docusaurus v2

```
SITUATION:
  Docusaurus v1 was widely used but architecturally limited.
  The documentation tooling landscape was evolving:
  - Gatsby was proving to be an unnecessary overhead for documentation
  - MDX had emerged as a better content format than plain Markdown
  - Teams needed plugin systems to extend documentation sites
  - v1's theming model (CSS overrides) broke with every update
  
  The question: what should Docusaurus v2 look like?

TASK:
  As Lead Maintainer: conceptualise and build the v2 alpha.
  Not an incremental update — a rethink of the architecture from the ground up.

ACTION:
  1. DECIDED to replace Gatsby with a custom webpack pipeline.
     This was the enabling decision. Without it: we inherit Gatsby's constraints.
     With it: we control the entire compilation chain, enabling MDX and plugins.
  
  2. DESIGNED AND IMPLEMENTED MDX support.
     The MDX compilation pipeline: remark/rehype processors that transform
     .mdx files into real React components as ES modules.
     The result: JSX components embedded in Markdown, rendered as React.
  
  3. DESIGNED the plugin architecture.
     Every feature as a plugin: docs, blog, sitemap, analytics.
     Plugin lifecycle: load content → generate routes → inject theme → build.
     External developers can publish first-class plugins.
  
  4. IMPLEMENTED component swizzling.
     Teams override individual theme components without forking Docusaurus.
     This eliminated the #1 community pain point: theming conflicts.

RESULT:
  v2 became the active maintained version. v1 is in maintenance mode.
  React, Jest, Redux, Babel, and 50,000+ other projects use Docusaurus v2.
  The plugin ecosystem has grown to include dozens of community plugins
  built on the architecture I designed.
```

---

## 2️⃣ Ads Front-End Infrastructure — State Management

### Understanding the problem at Ads scale

```
FACEBOOK ADS MANAGER IS ONE OF THE MOST COMPLEX UIs EVER BUILT.

THE THREE-LEVEL HIERARCHY:
  CAMPAIGN: the top-level budget and objective.
    Fields: name, objective (conversions/traffic/awareness/etc.),
    campaign budget optimization, buying type, spending limit.
  
  AD SET: targeting and delivery.
    Fields: custom audiences, lookalike audiences, interest targeting,
    demographic targeting (age, gender, location), placement
    (Facebook Feed/Stories/Reels, Instagram, Messenger, Audience Network),
    schedule (start/end date, dayparting), budget and bid strategy.
  
  AD: the creative and message.
    Fields: format (image/video/carousel/collection/instant experience),
    primary text, headline, description, call-to-action, URL,
    landing page, tracking parameters, UTM configuration.

THE COMPLEXITY PROBLEMS:
  1. INTERDEPENDENCIES:
     Changing the campaign objective can force changes to the ad set.
     (Choosing "App Installs" objective requires a mobile app to be selected.)
     Changing the placement can invalidate the ad creative.
     (Stories requires 9:16 aspect ratio; Feed supports 1.91:1 to 4:5.)
     State is not isolated. A change at level 1 can cascade through levels 2 and 3.
  
  2. DRAFT STATE vs PUBLISHED STATE:
     An advertiser edits their campaign. Changes are in "draft" until published.
     The UI shows: "3 changes pending." The original published state is preserved.
     Rolling back = returning to the published state, discarding draft changes.
  
  3. OPTIMISTIC UPDATES:
     When a user publishes changes: the UI should feel instant.
     We show the success state immediately, before the server confirms.
     If the server rejects: roll back to the pre-publish state,
     show an error explaining why the change was rejected.
  
  4. UNDO/REDO:
     Advertisers change many fields during a session.
     They make a mistake and want to undo.
     Undo across a three-level hierarchy with interdependencies is hard.
     A naive undo implementation would undo one field at a time.
     The correct implementation undoes a "logical change" — which may
     have touched multiple fields across multiple levels.

THE INFRA ANGLE:
  "Front-End Infra" means: I built tools FOR OTHER ADS ENGINEERS.
  I was not building features that advertisers use.
  I was building the state management primitives that the FEATURE engineers use.
  
  This is the highest-leverage engineering work:
  My state management tools are used by every engineer who touches the Ads UI.
  If I make those tools 20% more reliable, every engineer benefits.
  If I build undo/redo middleware, every feature gets undo/redo for free.
```

### Flux → Redux — The Evolution at Facebook

```
FLUX (Facebook's original pattern):
  Unidirectional data flow:
  Action → Dispatcher → Store → View → Action → ...
  
  Multiple Stores: separate stores for campaigns, ad sets, ads, UI state.
  Dispatcher: global event bus — stores subscribe to action types.
  
  PROBLEMS WITH FLUX:
  - Multiple stores create dependencies: the CampaignStore depends on
    the AccountStore. Race conditions when stores update in wrong order.
  - Testing: stores are singletons. Hard to reset between tests.
  - DevTools: no built-in time-travel debugging.
  - Action creators scattered: no single place to see all actions.

REDUX (at the Ads team, early adoption):
  One store: everything in one place.
  Pure reducers: state → action → new state. No mutations.
  Benefits over Flux:
  - One store eliminates the dependency ordering problem
  - Pure functions are trivially testable
  - Redux DevTools: time-travel debugging out of the box
  - Middleware: composable action processing pipeline
  
  THE MIDDLEWARE ARCHITECTURE:
  Action → [middleware 1] → [middleware 2] → [middleware 3] → reducer
  
  This is where the "state management tools" come in:
  I built middleware that every Ads engineer's Redux store runs through.

WHAT I BUILT AS STATE MANAGEMENT TOOLS:

1. UNDO/REDO MIDDLEWARE:
   Each action that modifies state pushes a snapshot to a "past" stack.
   UNDO: pop from past, push current to "future."
   REDO: pop from future, push current to "past."
   The undo granularity is "per dispatch" — but complex changes
   can batch multiple state changes into one undoable action.
   
   Implementation: the middleware wraps the root reducer.
   Feature engineers do not implement undo — they dispatch actions normally.
   The middleware handles history management transparently.

2. VALIDATION MIDDLEWARE:
   After each state change, validation rules run.
   If a placement change makes the creative invalid:
   the middleware updates a "validationErrors" slice of state.
   The UI reads from validationErrors to show inline error messages.
   Engineers declare validation rules; the middleware executes them.

3. DIRTY STATE TRACKING:
   The middleware compares current state to the last-published state.
   If they differ: state.isDirty = true. The "Publish" button enables.
   Feature engineers do not track dirty state — the middleware does.

4. OPTIMISTIC UPDATE MANAGER:
   Intercepts "PUBLISH_*" actions.
   Stores pre-publish state as a rollback point.
   Dispatches "PUBLISH_OPTIMISTIC" (UI updates immediately).
   When server response arrives: confirm or rollback.
   All in middleware. Feature engineers dispatch PUBLISH — that is all.
```

### Relay + GraphQL — The Data Layer

```
FACEBOOK INVENTED GRAPHQL AND RELAY.
  Working at Facebook with Relay + GraphQL means working with these
  technologies at their origin — before the community built Apollo,
  URQL, or any alternatives.

TRADITIONAL REST + REDUX DATA FETCHING:
  component mounts
  → dispatch(fetchCampaign(id))
  → redux-thunk hits REST endpoint
  → reducer stores result at state.campaigns[id]
  → component reads state.campaigns[id]
  
  PROBLEMS:
  - "Over-fetching": the endpoint returns all campaign fields,
    but the component only needs name and status.
  - Component needs to know: which action to dispatch, where in the store to read.
  - Data normalisation: if campaign appears in multiple lists,
    it's stored multiple times. Updating it requires updating every copy.

RELAY + GRAPHQL DATA FETCHING:
  // Component declares exactly what it needs (fragment):
  const fragment = graphql`
    fragment CampaignCard_campaign on Campaign {
      id
      name
      status
      budget { amount currency }
    }
  `;
  // Component reads from the fragment ref. Nothing else.
  
  RELAY'S COMPILER:
  At build time, Relay's compiler reads all fragments across all components.
  It composes them into efficient GraphQL queries.
  CampaignCard's fragment + CampaignList's fields → one query.
  The server receives one request with exactly the fields needed.
  No over-fetching. No under-fetching.
  
  RELAY'S NORMALIZED CACHE:
  Every entity (Campaign, AdSet, Ad) is stored once in the cache,
  keyed by its ID.
  If a campaign appears in two lists: cached once.
  When updated: both lists see the update automatically.
  No manual cache invalidation.
  
  OPTIMISTIC UPDATES IN RELAY:
  Relay mutations support an `optimisticResponse`:
  commitMutation(environment, {
    mutation: updateCampaign,
    variables: { id, status: "PAUSED" },
    optimisticResponse: {
      updateCampaign: { campaign: { id, status: "PAUSED" } }
    },
  });
  The cache updates immediately with the optimistic response.
  When the server confirms: the cache updates to the real response.
  If the server rejects: the cache rolls back to the pre-mutation state.
  
  WHY ADS INFRA TEAM USED RELAY:
  The Ads UI makes dozens of mutations per session.
  (Pause campaign, edit budget, change targeting, add creative...)
  Relay's optimistic update + rollback pattern was built for exactly this.
  
THE "STATE MANAGEMENT TOOLS" CONTEXT:
  The Ads Infra team built wrappers, patterns, and utilities on top of
  Relay + Redux that made it easier for Ads feature engineers to do the
  right thing consistently.
  - Standard patterns for common operations (pause/resume/duplicate)
  - Undo/redo middleware that worked with both Redux and Relay optimistic updates
  - Validation framework that understood the Ads object hierarchy
  - Type-safe action creators using Flow types
  These are the "tools" — the Infra team's output is used by every engineer
  who works on the Ads Manager frontend.
```

### Technology Deep Dives

```
FLOW (Facebook's type system):
  Before TypeScript, Facebook built Flow.
  Gradual typing: start untyped, add types incrementally.
  At the Ads team: strict Flow usage in the state management layer.
  
  Why Flow matters for state management:
  typed action creators → typed reducers → typed selectors
  If a reducer expects { campaignId: string } and you pass { id: string },
  Flow catches it before runtime.
  
  Flow vs TypeScript in 2024: TypeScript won the community.
  But at Facebook (now Meta), Flow is still used internally.
  Having used Flow means: "I understand static typing as a concept,
  not just as a specific TypeScript configuration."

HACK (Facebook's PHP dialect):
  Hack is a statically-typed PHP dialect with async/await, type annotations,
  and a rich type system.
  The Ads API backend was written in Hack.
  
  Why knowing Hack helped frontend work:
  The server-side type definitions for Ads objects (Campaign, AdSet, Ad)
  were in Hack. Understanding those types meant understanding the exact
  shape of data the API returns. This eliminated an entire class of
  bugs: assuming a field is a string when the server sends an enum.
  It also enabled earlier collaboration with backend engineers:
  "The Hack type for this field is nullable — I need to handle null
  in the frontend validation" — caught before the PR, not in production.

JEST (Facebook's testing framework):
  Jest was built at Facebook — you used it at its origin.
  State management unit testing with Jest:
    - Test each reducer as a pure function (easy with Redux)
    - Test middleware with custom mock stores
    - Test selector logic with predefined state trees
    - Test async thunks with jest.mock for API calls
  The Ads state management tools had high test coverage because
  state bugs in production = incorrect ad delivery = revenue impact.

MYSQL:
  Understanding the database layer means understanding:
  - Why some fields are denormalised (for query performance)
  - Why some operations are "async" from the frontend perspective
    (a campaign pause triggers a background job, not an immediate DB write)
  - The difference between "pending" and "error" states in the UI
    (a slow mutation vs a failed mutation look different to the backend)
  Full-stack context makes frontend engineers better at understanding
  why the API behaves the way it does.
```

### STAR Script — Ads State Management

```
SITUATION:
  Facebook Ads Manager is one of the most complex UIs at Facebook.
  Campaign/AdSet/Ad hierarchy with complex interdependencies.
  Multiple Ads feature teams were each implementing their own state
  management patterns: some using Flux, some Redux, some mixing both.
  Result: inconsistent behaviour, no shared undo/redo, no consistent
  validation, and duplicate engineering effort across teams.

TASK:
  As part of Ads Front-End Infra: build shared state management tools
  that all Ads feature teams would use, providing undo/redo, validation,
  dirty state tracking, and optimistic update management.

ACTION:
  1. BUILT UNDO/REDO MIDDLEWARE for Redux.
     The middleware wraps the root reducer.
     Every action pushes a state snapshot to a "past" stack.
     UNDO/REDO actions navigate the stack.
     Feature engineers dispatch normal actions — the middleware handles history.
     Batched actions: multiple dispatch calls can be wrapped in a transaction,
     creating a single undoable unit (e.g., "change objective" that resets
     placement and creative validation counts as one undo step).
  
  2. BUILT VALIDATION MIDDLEWARE.
     Engineers declare validation rules as pure functions.
     After each state change: validation runs, errors stored in state.
     UI reads from state.validationErrors — no direct validation calls.
  
  3. BUILT DIRTY STATE TRACKER.
     Middleware compares current state to last-published state.
     state.dirtyFields: the set of changed fields.
     state.isDirty: boolean. Drives "Publish" button enable/disable.
  
  4. INTEGRATED WITH RELAY for data fetching.
     Relay's optimistic updates and Redux undo/redo were coordinated:
     a published action that's rolled back by the server also undoes
     its local state changes via the undo stack.

RESULT:
  All Ads feature teams adopted the shared state management tools.
  Undo/redo: available across all Ads Manager without individual team
  implementation effort.
  Validation: consistent validation error messaging across the entire UI.
  Relay + Redux integration: standardised data fetching pattern.
  Engineering productivity: teams focused on product features, not
  re-implementing state management infrastructure.
```

---

## Follow-up Q&A

### Docusaurus

**"Why did you choose to build a custom webpack pipeline instead of continuing to use Gatsby?"**
> "Gatsby has opinions about how content is processed, how routes are generated, and how the build pipeline is structured. For Docusaurus, those opinions were sometimes misaligned with what a documentation site needs. Our content model is different from Gatsby's content model. Our build optimisations are different. And most importantly, the MDX compilation pipeline — which is the core innovation in v2 — needed to be integrated into the webpack configuration at a level of control that Gatsby's abstraction layer didn't expose cleanly. Once we decided that MDX was the direction, the custom webpack pipeline became necessary. The benefits compounded: we could optimise specifically for documentation use cases, control every extension point, and not be blocked by Gatsby upgrades when we needed to update a compiler dependency."

**"How did you design the plugin system? What did a plugin look like?"**
> "A Docusaurus plugin is a function that receives the site configuration and a context object, and returns lifecycle hooks. The core lifecycle hooks are: loadContent() (fetch or generate the content data), contentLoaded() (given the content, generate routes and static data files), and postBuild() (run after everything is built, useful for generating sitemaps or robot.txt files). This design means plugins are pure functions — they receive data, return instructions. The Docusaurus core orchestrates them. The docs plugin uses loadContent() to read your .md and .mdx files and build the sidebar tree. The blog plugin uses loadContent() to read posts, compute tags, and build archive pages. Both are peers — neither has special access that a community plugin does not have."

**"What was the hardest part of building the MDX pipeline?"**
> "The tricky part was the component scope. When you write `<Tabs>` in an MDX file, Docusaurus needs to know what `Tabs` refers to. Options: import it in every file (verbose), or provide it as a global scope. We chose a global MDX component provider: theme components like Tabs, TabItem, CodeBlock, and Admonition are available in every MDX file without an explicit import. The implementation: a webpack loader wraps each MDX module, injecting a `MDXComponents` context that the mdx-js runtime reads. The complexity is in making this work with the plugin system: each plugin can contribute components to the global MDX scope, and the final scope is the union of all plugin contributions."

### Ads State Management

**"What is Relay and how is it different from Apollo or Redux for data fetching?"**
> "Relay is Facebook's GraphQL client. The core difference from Apollo: Relay is compiler-driven. You write GraphQL fragments colocated with your components. At build time, Relay's compiler reads all your fragments, composes them into queries, validates them against the schema, and generates type-safe hooks. By the time your code runs, Relay knows exactly what data each component needs and has already composed the optimal GraphQL query. Apollo works similarly in recent versions, but Relay was built for this pattern from the beginning. The second key difference: Relay's normalised cache stores each entity once by ID, automatically deduplicating and updating all references when data changes. Redux for data fetching is manual by comparison — you handle normalisation, cache invalidation, and rehydration yourself."

**"How did undo/redo work across the Campaign/AdSet/Ad hierarchy?"**
> "The challenge with hierarchical state is that a single user 'undo' might need to revert changes across multiple levels. For example: changing the campaign objective resets the ad set's placement allowlist and clears invalid creative. That is one user action that touches three state slices. We solved this with a batching concept: we wrapped related dispatches in a transaction. Inside the transaction, changes accumulate without pushing to the undo stack. When the transaction commits, one snapshot is pushed. UNDO reverts the entire transaction atomically. The feature engineer marks the beginning and end of the transaction; the middleware handles the rest. There was a harder edge case: Relay optimistic updates running alongside Redux undo. If you undo an action that had an in-flight Relay mutation, you need to cancel or compensate the mutation. We handled this with a coordination layer that tracked which Redux undo steps had associated Relay mutations, and issued compensating mutations on undo if the original had already been sent."

---

## 🔗 Unified Narrative

> "The two Facebook experiences are about infrastructure and scale, but at different levels.
>
> With Docusaurus: I built infrastructure for the OSS documentation ecosystem. As lead maintainer, I was not just shipping features — I was responsible for the architectural decisions that thousands of teams' documentation sites depend on. v2 was a ground-up rethink: custom webpack pipeline to enable MDX, plugin architecture to enable extensibility, component swizzling to enable theming without forking. The ecosystem adopted it: React, Jest, Redux, Babel, and 50,000+ other sites.
>
> With Ads Infra: I built infrastructure for Facebook's own engineers. Ads Manager is one of the most complex UIs at Facebook. State management at that scale — Campaign/AdSet/Ad hierarchy, complex interdependencies, undo/redo, optimistic updates, validation — is not a solved problem you can pull off npm. I built the middleware and tooling patterns that Ads feature teams use. My contribution is invisible to advertisers — it shows up in: reliable undo/redo, consistent validation messaging, and the ability of feature engineers to focus on product problems instead of state management infrastructure.
>
> The technology stack — React, Relay, GraphQL, Redux, Flux, Jest, Flow, Hack — is not just a list. React, Relay, and GraphQL were all invented at Facebook. I used them at their origin. That gives me a level of understanding of why they were designed the way they are, not just how to use them."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I contributed to Docusaurus" | "I was the **lead maintainer** — responsible for PR reviews, architectural decisions, backwards compatibility, and community direction. I **conceptualised** v2: MDX, plugin system, swizzling, custom webpack pipeline." |
| "Docusaurus is a documentation tool" | "57k+ GitHub stars, 3M+ npm downloads/week, 50k+ sites. Used by React, Jest, Redux, Babel — the most important OSS projects in the ecosystem." |
| "v2 adds features over v1" | "v2 is a **complete rethink**. MDX (JSX in Markdown, not possible in v1), plugin architecture (everything is a plugin), swizzling (component-level theming, not CSS overrides), custom webpack (not Gatsby), TypeScript-first, built-in i18n." |
| "I worked on Ads state management" | "I built **tools for other Ads engineers** — undo/redo Redux middleware, validation middleware, dirty state tracking, optimistic update management. Feature teams use these tools; they do not implement this themselves." |
| "We used Redux" | "We evolved **from Flux to Redux** (early adoption at Facebook). I built **custom middleware**: undo/redo (past/future snapshot stacks), validation (pure function rules executed after each state change), dirty tracking (current vs published state comparison), optimistic update manager (pre-mutation rollback point)." |
| Skip Relay explanation | "Relay is **compiler-driven**: fragments colocated with components, composed at **build time** into optimal queries. Normalised cache: each entity stored once. Apollo does this at runtime; Relay at build time. Using Relay at Facebook = using GraphQL at its origin company." |

---

## 📊 Quick Facts

```
Company: Facebook (Meta)

DOCUSAURUS:
  Role:        Lead Maintainer
  Project:     Open Source documentation site generator by Facebook
  v2 innovations I conceptualised + built:
    - Custom webpack pipeline (replaced Gatsby dependency)
    - MDX: JSX components inside Markdown (remark → rehype → React component)
    - Plugin architecture: docs, blog, sitemap, analytics all as plugins
    - Component swizzling: override theme components without forking
    - TypeScript-first: typed config + theme
    - Built-in i18n: locale routing, Crowdin workflow support
  Scale:       57k+ stars, 3M+ npm downloads/week, 50k+ documentation sites
  Users:       React, Jest, Redux, Babel, Supabase, Ionic, Deno, Prettier

ADS FRONT-END INFRA:
  Role:        State management tools (Infra = tools for other engineers)
  Problem:     Campaign/AdSet/Ad hierarchy, interdependencies, undo/redo,
               optimistic updates, validation, draft vs published state
  Tools built:
    - Undo/redo Redux middleware (past/future snapshot stacks, transaction batching)
    - Validation middleware (pure function rules, runs after each state change)
    - Dirty state tracker (current vs last-published comparison)
    - Optimistic update manager (rollback point on PUBLISH actions)
    - Relay + Redux coordination (in-flight mutation cancellation on undo)
  
TECH STACK:
  React      — Facebook's own UI library
  Relay      — Facebook's GraphQL client; compiler-driven, normalised cache
  GraphQL    — Facebook invented it; Relay composes fragments into optimal queries
  Redux      — early adoption at Facebook; custom middleware layer built on top
  Flux       — Facebook's original pattern; lived through the evolution to Redux
  Jest       — Facebook's testing framework; used at its origin
  Flow       — Facebook's type system; strict typing for state management layer
  Hack       — Facebook's PHP dialect; full-stack context for API contract understanding
  MySQL      — database context; understanding async operations, denormalisation
```

---

*Document last updated: June 2026 · Facebook Engineering interview preparation*
