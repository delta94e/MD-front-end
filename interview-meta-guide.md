# 🎯 Interview Guide — Meta Engineering
## Design System · Lexical Editor · Testing Workflows · FE Infrastructure

---

## 🔑 Context: What FE Infrastructure at Meta Means

```
META'S SCALE:
  Facebook, Instagram, Messenger, WhatsApp Web, Workplace, Portal,
  Oculus (VR), Meta AI — all built by thousands of engineers.
  
  Each product has the same needs:
  - Consistent UI (buttons look like buttons everywhere)
  - Rich text editing (posts, comments, captions, documents)
  - Reliable tests that engineers trust and actually write
  
  The FE infrastructure team solves these needs ONCE.
  Product engineers consume the solution. They do not reinvent it.

THE VALUE PROPOSITION OF INFRASTRUCTURE:
  Feature engineering: ship feature X → X users benefit.
  Infrastructure engineering: build tool Y → every engineer who uses Y becomes
  more effective. Impact scales with adoption.
  
  A custom renderWithTheme() helper used by 200 engineers every day
  saves 15 lines × 200 × every test written = millions of saved lines per year.
  That is infrastructure impact.

WHAT INTERVIEWERS WANT TO HEAR:
  Not "I used Lexical" — but "I understand WHY Lexical was built
  the way it was, what problems the EditorState model solves,
  and how I contributed to making it more reliable."
  
  Not "I improved test coverage" — but "I built utilities that reduced
  test setup from 18 lines to 1 line, which measurably increased how many
  tests engineers wrote."
```

---

## 1️⃣ Meta's Design System

### Why a design system matters at Meta's scale

```
THE PROBLEM WITHOUT A DESIGN SYSTEM:
  Each team implements their own Button, their own colours, their own spacing.
  - Team A's primary blue: #1877f2
  - Team B's primary blue: #0866ff (updated brand colour)
  - Team C's primary blue: #007bff (Bootstrap default they kept using)
  When the brand team updates the primary blue, they must find and update
  every hex value in every codebase. The update is never complete.

  With a design system:
  --color-primary: #0866ff;
  One change. Every product updates automatically.

META'S APPROACH — STYLEX:
  StyleX is Meta's CSS-in-JS solution (open-sourced 2023).
  Key properties:
  - ATOMIC: each CSS declaration becomes one class. No duplication.
    background: blue → bg_blue_class; padding: 8px → p8_class
    Two components using the same property share the class. Zero duplication.
  - CO-LOCATED: styles live next to the component, not in a separate CSS file.
  - DETERMINISTIC SPECIFICITY: no cascade. Later-applied styles always win.
    This eliminates the "whose CSS wins?" class of bugs entirely.
  - TYPE-SAFE: tokens are TypeScript literals. You cannot use a token that
    does not exist (caught at build time, not runtime).
  - ZERO RUNTIME: StyleX generates CSS at build time. There is no JavaScript
    running to apply styles in the browser — zero runtime cost.
```

### STAR Script

```
SITUATION:
  Multiple Meta product teams were building the same UI components independently.
  A design review would show: "This button in Facebook looks slightly different
  from this button in Messenger. They're supposed to be the same product family."
  The root cause was engineers using ad-hoc styles (hardcoded hex values, magic
  number padding) rather than the design system tokens.

TASK:
  Contribute to Meta's design system — build and improve reusable components
  that product teams would adopt, and improve the tooling that prevented
  ad-hoc styles from being introduced.

ACTION:
  1. COMPONENT DEVELOPMENT:
     Built reusable components following the design system contract:
     - Each component exposes a typed API (variants, sizes, states)
     - All visual properties use design tokens — never hardcoded values
     - Accessibility built-in: ARIA roles, keyboard navigation, focus management
     - Snapshot tests for every variant (catches visual regressions)

  2. TOKEN ENFORCEMENT:
     Added a custom ESLint rule that flagged hardcoded colour values
     and suggested the equivalent design token:
     "#0866ff" → "Use colors.primary from @meta/tokens instead."
     This moved enforcement from code review (manual, inconsistent) to CI
     (automated, consistent).

  3. COMPONENT API DESIGN PRINCIPLES I FOLLOWED:
     - Minimal API surface: fewer props = easier to use correctly
     - Composition over configuration: complex use cases compose primitives,
       not configure one giant prop-driven component
     - Unstyled escape hatch: advanced users can extend, but it's not the default path
     - Storybook documentation with live examples for every variant

RESULT:
  - Components adopted across multiple product surfaces
  - Hardcoded colour incidents in code review: reduced significantly
  - Snapshot test suite: every variant protected against regressions
  - New engineers onboarding: "I just use the component" instead of
    "let me figure out the correct button style for this surface"
```

### Follow-up Q&A

**"How do you design a component API that scales to many teams?"**
> "Three principles. First: small surface, composable primitives. A Button component should have variant, size, disabled, loading — not 40 props for every edge case. Edge cases are handled by composition: wrapping the Button with a tooltip component, not adding a tooltip prop to Button. Second: the common case should require zero configuration. `<Button>Click me</Button>` should work and look correct without any props. Props are for customisation, not required setup. Third: make the wrong thing hard. If the API only exposes themed colours (no arbitrary hex), engineers cannot easily introduce design inconsistency. The API should guide toward correct usage by default."

**"What is StyleX and how is it different from Tailwind or CSS Modules?"**
> "StyleX generates atomic CSS at build time — each CSS declaration becomes one class. Two components using `padding: 8px` share the same generated class — there is no duplication in the CSS output, regardless of how many components use it. Tailwind is similar in the atomic idea, but Tailwind's classes are predefined strings like `p-2` — you cannot type-check whether `p-2` exists. StyleX's tokens are TypeScript literals — if you reference a token that does not exist, TypeScript catches it at build time. CSS Modules give you scoped class names but do not enforce design tokens — you can still write `color: #ff0000` in a CSS Module. StyleX prevents that by making tokens the only way to specify visual properties."

---

## 2️⃣ Lexical — Meta's Next-Generation Web Text Editor

### Why Lexical replaced Draft.js

```
DRAFT.JS PROBLEMS (why Lexical was built):
  Draft.js (Facebook's previous editor, open-source 2016) had fundamental issues
  at scale:
  
  1. MUTABLE STATE:
     Draft.js used Immutable.js for EditorState, but the API exposed mutable
     objects in callbacks. Engineers could inadvertently mutate editor state
     in ways that caused inconsistent updates and hard-to-reproduce bugs.
  
  2. RENDERER COUPLING:
     Draft.js is tightly coupled to React. The editor state and the React tree
     were deeply intertwined. This made testing without React difficult, and
     made it impossible to use Draft.js in non-React contexts.
  
  3. SELECTION COMPLEXITY:
     Draft.js's selection model did not handle complex cases well:
     nested lists, tables, or mixed content types caused edge cases.
  
  4. NO COLLABORATION MODEL:
     Draft.js had no built-in model for operational transforms or CRDTs —
     real-time collaborative editing required significant custom work.

LEXICAL'S SOLUTION:
  A clean-room redesign with three core principles:
  
  1. IMMUTABLE EditorState:
     Every edit produces a new EditorState snapshot.
     No mutation — same model as React's state.
     Old snapshots = undo stack. Diff two snapshots = collaborative ops.
  
  2. FRAMEWORK-AGNOSTIC CORE:
     The core Lexical library has no React dependency.
     It runs in any JavaScript environment (Node.js, vanilla JS, React, Vue).
     React bindings are a separate package (lexical-react).
  
  3. PLUGIN ARCHITECTURE:
     Every feature is a plugin. Core is minimal.
     Plugins compose via the Command/Transform/Node registration system.
     A plugin adds features by registering — not by modifying core.
```

### STAR Script

```
SITUATION:
  I worked on Lexical at a stage where it was being prepared for broader
  internal adoption and open-source release. The core editing was functional,
  but the tooling, testing infrastructure, and reliability had gaps that
  would make wider adoption difficult.

TASK:
  Contribute to tooling, testing, and reliability — specifically:
  - Make the editor easier to test in isolation (without a browser/DOM)
  - Improve the reliability of async editor update handling in tests
  - Contribute to the plugin development workflow tooling

ACTION:
  1. createMockEditor() — TEST FACTORY FOR LEXICAL:
     Testing Lexical required setting up a DOM, an editor instance,
     waiting for async initialization, then cleaning up.
     This was 18 lines of boilerplate per test file.
     I created a factory that handled all of this:
     - Creates a Lexical editor with specified plugins
     - Attaches to a lightweight DOM element
     - Handles teardown in afterEach automatically
     - Exposes a typed API (state, dispatch, getContent) on the returned object
     
     After: every Lexical test starts with one line.

  2. waitForEditorUpdate() — ELIMINATING FLAKY TESTS:
     Lexical's update cycle is asynchronous — editor.update() schedules work
     in a microtask queue. Tests that checked editor state synchronously after
     an update were reading stale state. The naive fix was setTimeout(fn, 50) —
     which was both slow and flaky (50ms might not be enough on a busy CI machine).
     
     I implemented waitForEditorUpdate(): it resolves after Lexical's reconciler
     completes its pending update, using Lexical's internal listener APIs.
     Result: tests are both fast and reliable — no timeouts.

  3. PLUGIN DEVELOPMENT TOOLING:
     Lexical plugins need to verify they register correctly with the editor.
     I built test helpers for plugin verification: assertCommandRegistered(),
     assertTransformRegistered() — which verify that a plugin's effects are
     active in the editor without having to trigger user interactions.

RESULT:
  - Test setup time (boilerplate lines): 18 lines → 1 line
  - Flaky test rate in the Lexical test suite: significantly reduced
    (removed all setTimeout-based assertions)
  - New plugin developers could write tests for their plugin on day one —
    the patterns were documented and the utilities made it straightforward
  - The testing patterns were adopted as the standard for Lexical's test suite
```

### Follow-up Q&A

**"How does Lexical's EditorState model enable undo/redo?"**
> "Undo/redo requires knowing the state before and after each edit. With mutable state, you need to manually record 'undo deltas' (what changed). With immutable EditorState, every edit produces a new snapshot — the HistoryPlugin simply maintains a stack of snapshots. Undo means: pop the current snapshot, push onto the redo stack, apply the previous snapshot. The EditorState carries everything needed to restore the editor exactly: node structure, selection, all formatting. There is nothing to manually track. This is the same reason React's time-travel debugger (Redux DevTools) is possible — immutable state snapshots make it trivially implementable."

**"What is a Lexical Transform and when do you use one?"**
> "A Transform is a function registered on a specific node type that runs after every editor update, inspecting the new state and potentially mutating it. Transforms are used for real-time conversions: 'if a TextNode starts with ## followed by a space, convert the paragraph to a HeadingNode.' The MarkdownShortcuts plugin is entirely built on Transforms. The key design: Transforms run inside the update transaction — so they can mutate the state without triggering additional render cycles. The risk: Transforms can fire other Transforms (a Transform that changes a TextNode might fire the TextNode Transform). Lexical handles this carefully — Transforms have a maximum iteration count to prevent infinite loops."

**"How is testing a Lexical editor different from testing a regular React component?"**
> "Two main differences. First, Lexical's state updates are asynchronous — they're batched and applied in a microtask queue. Tests that assert synchronously after an update read stale state. You need to wait for the reconciler to complete. Second, Lexical's EditorState is separate from React state — React re-renders are not the right signal for Lexical's update cycle. I addressed this by building waitForEditorUpdate() which resolves by listening to Lexical's own update event, not React's render cycle. The other important pattern: you can test Lexical's EditorState directly, without involving React rendering at all. getEditorState().read() lets you inspect the node tree programmatically. Tests that check 'did the bold command work?' can be pure state assertions — no DOM querying needed."

---

## 3️⃣ Testing Workflows — Scaling Without Scaling Complexity

### The core insight

```
THE TESTING PROBLEM AT SCALE:
  A shared infrastructure codebase (design system, editor) is used by hundreds
  of engineers. If writing tests is painful, engineers skip them.
  If tests are flaky, engineers lose trust in them and stop caring when they fail.
  
  The quality of testing is not a function of how much time engineers spend on tests.
  It is a function of how hard it is to write a good test.
  
  Reduce the friction → more tests get written → fewer regressions.
  It is a leverage problem, not a discipline problem.

THREE FRICTION REDUCERS:

1. renderWithTheme() — handles all provider wrapping
   Without: 15 lines of ThemeProvider, FeatureFlagProvider, I18nProvider, Router
   With: 1 line
   Impact: every test that needs providers (= almost all of them) benefits.

2. createMockEditor() — handles Lexical setup and teardown
   Without: 18 lines of DOM setup, editor init, wait for async init, cleanup
   With: 1 line
   Impact: every Lexical test benefits. Test count per feature went up.

3. waitForEditorUpdate() — eliminates setTimeout antipattern
   Without: await new Promise(r => setTimeout(r, 50)) (flaky, slow)
   With: await waitForEditorUpdate(editor) (reliable, fast)
   Impact: flaky test rate in Lexical suite reduced. Engineers trust test results.
```

### Follow-up Q&A

**"How do you prevent flaky tests in an async-heavy system like a text editor?"**
> "Three rules I enforce. First: never use setTimeout to wait for state — always wait for a specific signal (Lexical's update event, a specific DOM state, a promise to resolve). setTimeout-based waits are flaky because CI machines run at unpredictable speeds. Second: test one thing per test — a flaky test often flakes because it's testing too much and one of those things has timing dependencies. A test that checks 'bold command correctly formats text' is less likely to flake than a test that checks 'type some text, bold it, save it, reload it, check it's still bold.' Third: add flaky test detection to CI — any test that fails in < 3% of runs but not consistently is automatically flagged for investigation. Treating flakiness as a bug, not as noise, is the culture shift."

**"What's your philosophy on test coverage thresholds?"**
> "Coverage thresholds are a floor, not a ceiling, and they should not be the goal. A codebase at 85% coverage with high-quality tests is healthier than one at 95% coverage with tests that assert implementation details and break on every refactor. My approach: enforce a minimum threshold in CI (fail the build if coverage drops below X%), but treat the threshold as a 'this area has no tests' signal, not as a 'we have enough tests' signal. I also distinguish types of coverage: branch coverage is more meaningful than line coverage — 100% line coverage can miss entire code paths if branches are not exercised."

---

## 4️⃣ How These Connect — Infrastructure as a Platform

### The unified narrative

```
DESIGN SYSTEM + LEXICAL + TESTING = A COHERENT PLATFORM

  Think of it as layers:

  FOUNDATION (Design Tokens):
    Colors, spacing, typography — the atoms of the visual language.
    StyleX enforces them. ESLint flags violations. TypeScript catches typos.

  COMPONENTS (Design System):
    Assembled from design tokens. Typed API. Accessible. Tested.
    Product engineers compose these — they don't build them.

  EDITOR (Lexical):
    Built using design system components for its UI (toolbar, menus).
    Styled with design tokens for its visual treatment of text.
    Plugin architecture means product teams add capabilities without forking.

  TESTING (Utilities):
    renderWithTheme() wraps design system providers.
    createMockEditor() wraps Lexical setup.
    Both are used together: testing a component that contains an editor
    is still one line of setup.

  THE METRIC THAT MATTERS FOR INFRASTRUCTURE:
    Not "how many components did we build?"
    But: "how much faster can product teams ship good UI?"
    
    "How many tests are written per PR?" (proxy for test friction)
    "How often does a design regression slip through?" (proxy for component quality)
    "How often does Lexical regress in production?" (proxy for editor reliability)
```

### Follow-up Q&A

**"How do you measure the success of infrastructure work?"**
> "You measure the adoption and the outcomes it enables. For the design system: how many product teams are using the component library? Is that number growing? For the test utilities: how many tests are written per new feature PR? Is that number going up after the utilities were introduced? For Lexical: what is the production regression rate for editing functionality? These are all proxy metrics — the real outcome is 'product engineers are more productive and ship fewer bugs.' But proxy metrics give you something concrete to track. I also conduct periodic interviews with the product engineers who use the infrastructure: 'what is the most painful thing about using this?' That qualitative signal often reveals problems that metrics miss."

**"What's the difference between working on infrastructure and working on product features?"**
> "The feedback loop is longer and the customer is different. In product engineering, your customer is an end user and you can see their reaction in usage data within days. In infrastructure, your customer is another engineer and the impact shows up indirectly — in how quickly they ship, how many bugs they introduce, how many tests they write. The feedback loop is weeks or months. This requires a different discipline: you have to define the success criteria before you build, because you won't have immediate feedback to course-correct from. It also requires more deliberate communication — product engineers don't automatically know about infrastructure improvements. Migrations, release notes, and examples are part of the work, not afterthoughts."

---

## 🔗 Unified Narrative

> "My Meta work spanned three areas that form a coherent platform: design system, Lexical editor, and testing infrastructure.
>
> On the design system side, I contributed components and pushed for token enforcement at the tooling level — an ESLint rule that catches hardcoded colours is more reliable than a code review comment. On Lexical, I focused on what makes an infrastructure project actually usable: testing. I built utilities that reduced test setup from 18 lines to 1 line and eliminated flaky setTimeout-based assertions in the editor test suite. On the broader testing workflow, the principle was the same — reduce friction and more tests get written.
>
> What connects all three: they are multipliers. The design system doesn't benefit the team that built it — it benefits every product team that uses it. The test utilities don't save me time — they save every engineer who writes a test. Lexical doesn't serve users directly — it serves the engineers who build the editing surfaces that users interact with.
>
> Working on infrastructure teaches you to think about API design very deliberately. A bad test utility API means engineers find workarounds instead of using the utility. A bad component API means engineers build their own version. The discipline of 'what is the simplest API that covers the necessary cases?' transfers directly to product engineering."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I worked on Meta's design system" (no specifics) | Explain: design tokens, StyleX atomic CSS, TypeScript enforcement, snapshot tests for variants |
| "I know Lexical" | "EditorState is immutable — every edit creates a snapshot. This enables undo/redo and collaboration without manual delta tracking" |
| "I improved test coverage" | "I reduced test setup from 18 lines to 1 line — which directly increased how many tests engineers wrote" |
| Skip the WHY of infrastructure | "The metric is not how many components we built — it's how much faster product teams ship because of what we built" |
| Nói về Lexical mà không đề cập Draft.js | "Lexical replaced Draft.js — the key improvements were immutable EditorState, framework-agnostic core, and plugin architecture" |
| "I removed flaky tests" | "I eliminated the setTimeout antipattern by implementing waitForEditorUpdate() which resolves via Lexical's own update events — not timing" |

---

## 📊 Quick Facts

```
Company:   Meta (Facebook)
Products:  Design system (cross-product), Lexical editor (open source), testing infra

Design System:
  Approach: StyleX — atomic CSS, co-located, type-safe, zero-runtime
  Tokens:   colors, spacing, typography — one change updates everywhere
  ESLint:   custom rule flags hardcoded hex, suggests token equivalent
  Tests:    snapshot tests for every component variant

Lexical:
  What:     Open-source rich text editor (github.com/facebook/lexical)
  Model:    Immutable EditorState — node tree, atomic updates via editor.update()
  Plugins:  RichText, List, History, Markdown, Table, Mention, AutoLink, Code
  Key APIs: $createTextNode(), $getRoot(), registerNodeTransform(), COMMAND dispatch
  Draft.js: Lexical replaced it — mutable state, React-coupled, no collab model

Testing:
  renderWithTheme()      — 15 lines of providers → 1 line
  createMockEditor()     — 18 lines Lexical setup → 1 line  
  waitForEditorUpdate()  — eliminates setTimeout flakiness, uses Lexical events
  Snapshot tests         — every design system variant protected
  Philosophy:            Reduce friction → more tests written (leverage, not discipline)

North-star metrics:
  Tests per PR, design regressions per sprint, editor production regression rate,
  time to first test for new Lexical plugin
```

---

*Document last updated: June 2026 · Meta Engineering interview preparation*
