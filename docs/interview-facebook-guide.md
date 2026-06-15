# 🎯 Interview Guide — Facebook Engineering
## Deploy Interface · Hack→Flow Type Generator · Profile Picture Editor

---

## 🔑 Context: Facebook Engineering Culture

```
KEY THINGS TO KNOW BEFORE THE INTERVIEW:

  HACK (PHP):
    Facebook's proprietary typed PHP dialect. Backend services are written in Hack.
    Compiles to run on HHVM (HipHop Virtual Machine), Facebook's custom PHP runtime.
    Hack has a type system: int, string, bool, shape(), Vector<T>, ?T (nullable), etc.
    Engineers write typed Hack — the type checker runs at deploy time.

  FLOW:
    Facebook's static type checker for JavaScript (open source, like TypeScript).
    React was originally built with Flow. Frontend code at Facebook is Flow-typed.
    Flow has its own type syntax: number (not int), boolean (not bool), Array<T>, ?T, etc.

  THE API BOUNDARY PROBLEM:
    Backend defines types in Hack. Frontend consumes them via GraphQL / REST.
    If a backend engineer changes a Hack type, the Flow type on the frontend
    must also be updated — manually. This creates drift and type-mismatch bugs.

  "MOVE FAST":
    Facebook's culture emphasised high deployment frequency.
    Tools that make deploying faster and safer enable this culture.
    A deploy interface that is painful to use → engineers deploy less often.

  SCALE:
    Facebook runs at a scale that changes assumptions.
    The profile picture flow you rewrote is used by billions of accounts.
    The deploy interface you built is used by thousands of engineers every day.
```

---

## 1️⃣ Deploy Interface for Facebook Backend Services

### STAR Script

```
SITUATION:
  Facebook's backend is composed of hundreds of independent Hack services.
  When I joined, the tooling for deploying these services was functional
  but had significant usability problems:

  - The UI showed raw deployment pipeline logs without meaningful state
    (engineers could not tell if a deploy was healthy or about to fail)
  - Canary analysis (the stage where 1% of traffic goes to the new version)
    had no clear visual feedback — engineers would switch to a separate
    monitoring dashboard to watch metrics
  - Rollback was buried in a secondary flow — under pressure (production incident),
    engineers wasted time finding it
  - The interface did not surface code quality gate failures clearly —
    engineers would get a failed deploy without a clear error explanation

  The result: engineers were deploying less frequently than they should have
  because the tool felt risky and opaque. The culture value of "move fast"
  was being undermined by tooling that made speed feel unsafe.

TASK:
  Redesign and rebuild the deploy interface to improve three things:
  1. USABILITY: make the current state of a deploy immediately obvious
  2. DEPLOYMENT FREQUENCY: reduce the friction and anxiety of deploying
  3. CODE QUALITY: surface quality gate results clearly so engineers
     understand what failed and why, not just that it failed

ACTION:
  I approached this as a product problem before a technical problem.
  I interviewed engineers who used the tool — what confused them?
  What made them hesitate to deploy? What did they have to do outside
  the tool (e.g., open a separate monitoring tab) that should be built in?

  KEY DESIGN DECISIONS:

  1. Stage-based progress view (not log-first):
     The UI shows the pipeline as named stages: Build → Test → Canary → Production.
     Each stage has a clear status (in progress, passed, failed).
     The log is still available but is secondary — the primary view is the stages.
     Engineers can see at a glance: "canary passed, ramping to production."

  2. Canary metrics inline:
     During canary stage, key health metrics (error rate, p99 latency, CPU)
     were surfaced inline — not in a separate tab. Engineers could see:
     "error rate: 0.02% (baseline: 0.01%) — within threshold" without leaving
     the deploy interface.

  3. Rollback as a first-class action:
     Rollback button is visible and accessible during every post-build stage —
     not hidden. This sounds small but matters enormously under pressure.

  4. Quality gate failures with context:
     Instead of "build failed," the interface showed:
     - Which check failed (type error, lint warning, test failure)
     - The exact error message
     - A link to the relevant CI log section
     Engineers went from "it failed, now I have to dig" to
     "it failed here, for this reason, here is where to look."

RESULT:
  - Post-launch survey: engineers rated the new interface significantly higher
    on "I feel confident deploying with this tool"
  - Deployment frequency for teams using the interface increased notably —
    the barrier to initiating a deploy dropped
  - Incident response time improved — rollback was faster to initiate
    because the button was immediately visible
```

### Follow-up Q&A

**"How do you improve the usability of an internal tool? Users have no alternative."**
> "Internal tools have a different dynamic from consumer products — users cannot choose a competitor, but they CAN route around the tool. Engineers who find a deploy interface frustrating will either batch deployments (reducing frequency) or use alternative workflows like manual CLI commands (reducing visibility). The feedback mechanism is not churn, it is avoidance. So I treated 'how often is this tool used per engineer per day?' as a proxy metric for usability. Higher frequency = more confidence in the tool. Lower frequency = the tool is being avoided. I also ran qualitative sessions: sat with engineers as they deployed and asked them to narrate what they were thinking. The 'I always open a second tab for monitoring during canary' insight came directly from that."

**"Deployment frequency is a business metric. How did you connect a UI change to that?"**
> "There are two types of deployment friction: technical friction (slow builds, flaky tests) and psychological friction (the tool feels risky, I'm not sure what's happening). Technical friction is solved by engineers. Psychological friction is solved by UX. The insight I worked from was that engineers were technically capable of deploying more often but were hesitant because the tool felt opaque. When you cannot see what is happening, you slow down. Making the canary stage legible — 'here are the metrics, here is the threshold, you are within it' — removed the uncertainty that caused hesitation. The frequency increase was a direct consequence of removing psychological friction."

**"What was the hardest part of building this?"**
> "The hardest part was the canary metrics display — specifically, deciding what to show and at what granularity. Showing too much data (every metric, raw numbers) was overwhelming and increased anxiety. Showing too little (just 'canary: passing') was not actionable if something was wrong. I landed on: show the 3 most deployment-relevant metrics (error rate, p99 latency, traffic volume), with a baseline comparison, and a clear threshold indicator. That took several design iterations and feedback from engineers who had experience managing production incidents — 'what do YOU look at first?' is the right question to ask."

---

## 2️⃣ Hack → FlowJS Type Generator

### Why this is the most technically impressive of the three

```
WHAT THE TOOL DOES:
  Takes Hack type definitions (backend) and outputs Flow type declarations (frontend).
  Runs as part of the CI pipeline — when a Hack type changes, Flow types are
  automatically regenerated and checked in.

WHY THIS IS COMPILER WORK:
  - Parses Hack type syntax (a domain-specific language with its own grammar)
  - Builds an AST (Abstract Syntax Tree) representation
  - Traverses the AST and maps each Hack type node to the equivalent Flow type node
  - Emits Flow type declaration syntax

  This is the same conceptual work as a compiler frontend:
  Lex → Parse → AST → Transform → Emit

  It is not as complex as a full compiler, but the pattern is the same.

THE TYPE MAPPING PROBLEM:
  Hack and Flow have different type systems — similar but not identical:
  - Hack: int, float → Flow: number (two Hack types map to one Flow type)
  - Hack: bool → Flow: boolean
  - Hack: shape('key' => Type) → Flow: { key: Type }
  - Hack: Vector<T> → Flow: Array<T>
  - Hack: ImmVector<T> → Flow: $ReadOnlyArray<T>
  - Hack: ?T (nullable) → Flow: ?T (same syntax, different runtime semantics)
  - Hack function signatures → Flow declare function declarations
  - Hack $variable (dollar prefix) → Flow variable (no dollar prefix)

  The tool must handle nested types, generics, and function signatures correctly.

WHY IT MATTERS AT SCALE:
  Without the tool: engineer changes Hack type → updates Flow type manually →
  makes a mistake (typo, forgets a field) → type error in production.

  With the tool: engineer changes Hack type → CI regenerates Flow type automatically →
  type mismatch is caught at build time, not runtime.

  At Facebook's scale, with hundreds of engineers changing types daily,
  "caught at build time" vs "caught at runtime" is a massive difference
  in reliability and developer confidence.
```

### STAR Script

```
SITUATION:
  The Hack backend and Flow frontend were type-checked independently.
  There was no automated way to keep them in sync.
  Engineers who changed a Hack service response type had to:
  1. Identify all frontend consumers of that endpoint
  2. Manually update the Flow type declarations in each consumer
  3. Run Flow type check and hope they got it right

  The result was frequent type drift — Hack said a field was string,
  Flow thought it was int, runtime error. Or more subtle: Hack added
  a new required field, Flow didn't know about it, frontend silently
  ignored it and users saw missing data.

TASK:
  Design and build a tool that reads Hack type definitions and generates
  the equivalent Flow type declarations automatically. The tool should be
  runnable in CI so type sync happens on every backend change.

ACTION:
  DESIGN PHASE:
    First, I mapped the type systems comprehensively — every Hack type
    construct that could appear in a service interface, and its Flow equivalent.
    This revealed several non-obvious cases:
    - Hack int and float both map to Flow number (information loss — documented)
    - Hack shape() is an object type with string keys — needs quote stripping
    - Generic types (Vector<T>) need recursive processing of the type parameter
    - Nullable (?) syntax is the same but semantics differ — needs a comment in output
    - Function parameter dollar signs ($param) must be stripped for Flow

  IMPLEMENTATION:
    I chose to write a parser rather than use regex, because Hack type syntax
    is recursive (types can contain types) and regex cannot handle recursion correctly.

    The pipeline:
    1. Tokenize: split Hack source into a stream of tokens (keywords, identifiers,
       punctuation, strings)
    2. Parse: consume token stream, build an AST representing the type structure
    3. Transform: walk the AST and map each Hack node to its Flow equivalent
    4. Emit: serialize the transformed AST back to Flow declaration syntax

    TESTING STRATEGY:
    - Snapshot tests: for each Hack input, record the expected Flow output.
      Any change in output fails the test — prevents regressions.
    - Property tests: generate random valid Hack types (within the supported grammar)
      and verify the output is valid Flow syntax by running Flow's parser.
    - Edge case corpus: collected real Hack types from the codebase
      that had unusual patterns, added as explicit test cases.

  INTEGRATION:
    The tool was added to the CI pipeline for services that had frontend consumers.
    On Hack type change: tool runs → generates Flow → Flow type check runs →
    any mismatch surfaces as a CI failure before merge.

RESULT:
  - Type drift incidents dropped to near zero for services using the tool
  - Engineers stopped manually updating Flow types for those services —
    the tool did it
  - The tool also served as living documentation: by reading the generated
    Flow types, frontend engineers could understand exactly what the backend
    returned, without reading Hack source
  - Later adopted by other teams as a template for their own type-gen tooling
```

### Follow-up Q&A

**"Why write a parser instead of using regex for the type extraction?"**
> "Regex is insufficient for recursive grammars. A Hack type like `Vector<Map<string, ?shape('id' => int, 'name' => string)>>` has nested structure that regex cannot handle correctly — you cannot express 'match the content between angle brackets, where the content may itself contain angle brackets' in a regular expression without look-ahead tricks that become unmaintainable. A proper recursive descent parser handles arbitrarily nested types cleanly. The extra upfront investment in a parser paid off the moment we encountered the first nested generic in a real service type definition."

**"How did you handle types that don't have a direct Flow equivalent?"**
> "There were several cases. Hack int and float both map to Flow number — information loss. I documented this explicitly in the generator output as a comment: `// Hack: float → Flow: number (precision semantics differ, see FLOW_TYPES.md)`. Hack's mixed type maps to Flow's mixed, but they have different semantics — Flow's mixed requires an explicit type refinement before use, Hack's does not. For cases where the semantic difference was meaningful, I added a warning in the generated output so the consuming engineer was aware. The principle was: be conservative — emit what is correct, document what is uncertain, and never silently generate code that would pass type-checking but be semantically wrong."

**"How did you test a code generation tool?"**
> "Three test layers. Snapshot tests are the foundation — for each known Hack input, I stored the expected Flow output. If the generator output changes unexpectedly, the snapshot fails. This catches regressions immediately. On top of that, property tests: I wrote a simple Hack type generator that produced random valid types (within the supported grammar), ran them through the generator, and verified the output was parseable by Flow's own parser. This caught edge cases I had not thought of explicitly. Finally, an integration test: I took real Hack types from actual services in the codebase, generated Flow types, and ran Flow check on the output. If Flow itself rejected the generated types, the test failed. Real-world data surfaces problems that synthetic test cases miss."

---

## 3️⃣ Profile Picture Rewrite — Adding Editing Capabilities

### STAR Script

```
SITUATION:
  The existing profile picture flow was a simple upload-and-save:
  user selects a file, it uploads immediately, the result is whatever
  the center crop of the image happened to be.

  Users had no way to:
  - Zoom in (to better fill the circle)
  - Reposition (to center their face, not the middle of the photo)
  - Preview (to see what the circular crop would look like before saving)

  The result was frequent complaints about profile pictures looking wrong —
  subjects off-center, too much background, key detail cropped out.
  The friction of "upload and get a bad result, re-upload to try again"
  was high, and re-upload rates were measurable.

TASK:
  Rewrite the profile picture changing flow to add editing capabilities:
  crop preview, zoom, and reposition — all before the final save.

ACTION:
  ARCHITECTURE DECISION:
    Two implementation options:
    a) Server-side: send the full image, let the server crop it
    b) Client-side: do all editing in the browser, send crop parameters with the upload

    I chose a hybrid: client-side for the editing experience (instant feedback,
    no server round-trips during editing), server-side for the actual processing
    (consistent output quality, format conversion, CDN distribution).

    The client sends: { zoom, offsetX, offsetY } to the server as crop parameters.
    The server applies the crop with precise pixel math and generates the profile images
    at all required resolutions (thumbnail, medium, full).

  CANVAS IMPLEMENTATION:
    The editor uses a Canvas element for real-time preview:
    - The source image is drawn to a hidden canvas at natural size
    - A visible 200×200 canvas shows the crop preview
    - On every state change (drag, zoom), the preview canvas redraws:
      ctx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, 200, 200)
    - The circular crop is a CSS border-radius on the canvas container —
      not drawn in canvas, which keeps the code simpler

  DRAG TO REPOSITION:
    MouseDown → record start (x, y) and current offset
    MouseMove → calculate delta → clamp to max offset bounds → update state
    MouseUp → commit
    Touch events mirrored for mobile (touchstart, touchmove, touchend)

    The clamping constraint: the user cannot drag the image out of frame —
    the maximum offset is (renderedSize - cropSize) / 2.
    This prevents the circular preview showing a blank area at the edge.

  CROP PARAMETER CALCULATION:
    When the user saves, the client calculates what crop the server should apply:

    renderedSize = naturalSize × zoom
    srcLeft = (renderedSize - cropSize) / 2 - offsetX
    srcTop  = (renderedSize - cropSize) / 2 - offsetY
    srcW = cropSize / zoom   (in natural image coordinates)

    These four values (x, y, width, height in natural coordinates) are sent
    to the GraphQL mutation. The server applies an exact pixel crop at those
    coordinates, then generates all profile image sizes.

  PERFORMANCE:
    The canvas redraws on every mousemove event — potentially 60 times per second.
    To keep this fast:
    - Used requestAnimationFrame to throttle canvas redraws (batch multiple
      state updates into one draw per frame)
    - Kept the preview canvas small (200×200) — the actual image is processed
      server-side at full resolution
    - Did not apply any filters or transformations in canvas (kept to drawImage only)

RESULT:
  - Re-upload rate (uploading a new photo immediately after saving) decreased
    significantly — users were getting the crop right on the first try
  - User satisfaction signals (positive reactions, fewer support tickets about
    profile pictures) improved post-launch
  - The editing pattern was later applied to cover photos and other image
    upload flows in the product
```

### Follow-up Q&A

**"How did you make the drag feel natural, not laggy?"**
> "Two things. First, I used CSS `will-change: transform` on the preview container — this promotes it to its own compositor layer, so redraws do not affect the main document layout. Second, I batched state updates with requestAnimationFrame: instead of calling setState on every mousemove event (which can fire 300+ times per second on a fast mouse), I accumulated the delta and applied it once per animation frame. The perceived result is 60fps smooth drag — even though mousemove fires much more frequently. For mobile, I also added `touch-action: none` on the container to prevent the browser's default scroll behaviour from interfering with the drag."

**"How did you validate that the crop parameters were correct?"**
> "Integration test: I created a test suite that generated known images (solid colors with a marker pixel at a specific position), applied specific zoom and offset values through the editor, computed the crop parameters, sent them to the server processing function, and verified that the output image contained the marker pixel at the expected position. This caught an off-by-one error in the coordinate math that I had missed in unit tests — the unit tests checked the formula was applied correctly, but the integration test checked the formula was correct. Those are different things."

**"How did you handle the differences between different image sizes and aspect ratios?"**
> "The editor constrains the image to a minimum rendered size: the natural width×height must cover the 200×200 preview circle after zooming. If the user uploads a 100×100 image, it is scaled up to at least 200×200 before editing can begin (and the user is warned about the low resolution). For landscape and portrait photos, the initial zoom is set so the shorter dimension fills the circle — this matches the user's intuition of 'start with something sensible.' The zoom slider then lets them adjust from there. The maximum zoom is capped at 2.5× to prevent users from over-zooming into pixelation."

---

## 🔗 Unified Narrative — How to answer "Tell me about your time at Facebook"

> "At Facebook I had three quite different engineering contributions, which I think illustrates something important about how I work.
>
> The first was an internal deploy interface for backend services — a tooling problem. The insight was that deployment frequency was being suppressed not by technical limitations but by psychological friction: the tool felt opaque, engineers couldn't tell what was happening during canary, rollback was hard to find under pressure. I rebuilt the interface around making deployment state legible — visible stages, inline metrics, prominent rollback — and frequency increased.
>
> The second was a type generation tool — a developer infrastructure problem. Facebook's backend is Hack (typed PHP) and the frontend is Flow-typed JavaScript. Without automation, Hack type changes required manual Flow updates — which produced drift and runtime bugs. I built a parser that reads Hack type definitions and emits Flow equivalents automatically, integrated into CI. The class of type-mismatch bugs dropped to near zero for services using it.
>
> The third was the profile picture editing flow — a product problem. The original flow was upload-and-save with no editing. I added a canvas-based editor: drag to reposition, zoom slider, real-time circular preview. The crop parameters are calculated client-side and sent to the server for precise processing.
>
> What connects these three: I approached all of them as problems that needed to be understood before being solved. I interviewed the engineers who used the deploy tool. I mapped the type systems comprehensively before writing the parser. I measured the re-upload rate before and after the profile picture change. The technical implementation follows from understanding the problem clearly."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| Nói "tôi làm việc ở Facebook" mà không nói về Hack/Flow | Luôn explain the tech stack: "Facebook's backend is Hack (typed PHP), frontend uses FlowJS" |
| "I built a deploy tool" (no usability angle) | "The tool improved deployment frequency by removing psychological friction — here is what I changed and why" |
| "I made a type converter" | "I wrote a parser — not regex — because Hack types are recursive. Here is the pipeline: tokenize → parse → transform → emit" |
| Không nhắc Canvas API cho profile picture | "Canvas-based real-time preview, requestAnimationFrame for 60fps drag, crop parameter calculation in natural image coordinates" |
| Nói 3 projects riêng lẻ mà không kết nối | "These three show breadth: internal tooling, developer infrastructure, and user-facing product" |

---

## 📊 Quick Facts

```
Company:    Facebook (Meta)
Stack:      Hack (PHP), FlowJS, React, GraphQL, HHVM
Team area:  (1) Deploy tooling, (2) Developer infra, (3) Product (user growth)

Deploy interface:
  Problem:  Opaque deploy tool → low deployment frequency
  Solution: Stage-based UI, inline canary metrics, prominent rollback
  Result:   Higher deployment frequency, faster incident rollback

Type generator:
  Problem:  Manual Hack→Flow type sync → drift, runtime bugs
  Solution: Parser: tokenize → AST → transform → emit Flow declarations
  Key:      Parser (not regex) to handle recursive type grammar
  Result:   Type drift near zero, CI integration, becomes living documentation

Profile picture:
  Problem:  Upload-only flow → wrong crops → high re-upload rate
  Solution: Canvas editor: drag (clamped), zoom, circular preview
  Key:      Crop params = natural-image coords sent to server (hybrid client/server)
  Result:   Re-upload rate dropped, pattern extended to other image upload flows
```

---

*Document last updated: June 2026 · Facebook Engineering interview preparation*
