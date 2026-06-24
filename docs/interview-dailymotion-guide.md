# 🎥 Interview Guide — Dailymotion
## Engineering Lead · Senior Frontend Engineer · GateKeeper · React Introduction · Flash→HTML5

---

## 🔑 Context: Why Dailymotion Is an Exceptional Story

```
DAILYMOTION:
  One of the world's largest video platforms.
  Founded 2005 in France. Peak: 300M+ monthly visitors.
  Competing directly with YouTube globally.
  
YOUR ROLE:
  Engineering Lead + Senior Frontend Engineer.
  Not "I worked on features." You shaped the engineering culture.
  You introduced React before it was obvious. You invented the GateKeeper.
  You managed 13 developers. You shipped the HTML5 player.
  
HISTORICAL CONTEXT:
  Your tenure spans some of the most significant shifts in web development:
  - Flash → HTML5 video (2010-2012): everyone had to do this, but you led it
  - jQuery → React (2013-2015): most companies did this 2-3 years later
  - Monolith → component model (Toolkit + TWIG): ahead of the industry
  - Feature flags (GateKeeper): industry standard now, you invented yours
  
  What makes this exceptional: at every inflection point, you were ahead.
  You did not follow. You proposed the change and drove adoption.
```

---

## 1️⃣ GateKeeper — The Feature Flag System

### What the GateKeeper is and why it matters

```
THE SIMPLE DEFINITION:
  A GateKeeper is a configurable wall in front of functionalities.
  Before your code renders a feature, it asks: "is this gate open?"
  
  Code:
  if (GateKeeper.isEnabled("new-player-design", user)) {
    renderNewPlayer();
  } else {
    renderOldPlayer();
  }
  
  The gate configuration lives outside the code.
  Ops team, product managers, or engineers can change it without a deployment.
  Changes take effect in seconds across all servers.

WHY YOU INTRODUCED IT:
  Before GateKeeper:
  - A new feature ships when the code ships. No way to ship code and delay the feature.
  - A/B tests require forked codebases or complex server-side rendering logic.
  - A bad feature requires a rollback: git revert + deploy (30-60 minutes of incident).
  - Geographic restrictions require server-side logic scattered across the codebase.
  
  After GateKeeper:
  - Ship code anytime. Turn the feature on/off independently.
  - A/B test: set rollout to 50%. Half of users see version A, half see version B.
  - Kill switch: set rollout to 0% to hide a broken feature in < 1 second.
  - Geo-restriction: gate configured with allowed country list. One config change.
  - Premium features: gate configured for "premium" segment only.

SCALE: "CALLED HUNDREDS OF MILLIONS OF TIMES PER DAY"
  Dailymotion served 300M+ monthly visitors.
  Approximately 10M+ daily page views.
  Each page view calls the GateKeeper ~5-10 times (once per feature on that page).
  10M × 7 = 70M+ calls/day. At peak traffic: hundreds of millions.
  
  PERFORMANCE REQUIREMENT:
  GateKeeper must be sub-millisecond. Synchronous. No network request.
  
  IMPLEMENTATION:
  The gate configuration is a JSON file served from CDN.
  Loaded ONCE at server startup. Cached in memory.
  Each gate check: hashmap lookup (O(1)) + integer comparison.
  Zero I/O. Zero async. < 0.1ms per call.
```

### The gate evaluation algorithm — why it is deterministic

```
THE ROLLOUT CONSISTENCY PROBLEM:
  A gate is set to 30% rollout.
  User visits the page. Should they see the feature? Yes (they are in the 30%).
  User refreshes the page. Should they see the feature? YES — the same answer.
  User visits again tomorrow. Same answer.
  
  If the answer changes on each visit:
  - User sees the feature. Clicks it. Saves a preference.
  - User refreshes. Feature is gone. Their preference is lost.
  - User is confused. This is a bad user experience.
  
  SOLUTION: deterministic hashing.
  Instead of: Math.random() < 0.30 (random, changes every call)
  Use: hash(userId + gateName) % 100 < 30
  
  The hash function maps the (userId, gateName) pair to a number 0-99.
  For any given userId + gateName: always the same number.
  If that number < rollout%: the user is in the feature.
  Always. Consistently. Regardless of when they visit.
  
  This also means: different gates have independent rollouts.
  A user in the 30% for "dark-mode" is not necessarily in the 30% for "recommendations-v2."
  The gate name is part of the hash input. Independence is guaranteed.

GATE CONFIGURATION SCHEMA:
  {
    "dark-mode": {
      "enabled": true,
      "rollout": 20,
      "segment": "beta",        // only beta users
      "geo": ["fr", "de"],      // only France and Germany
      "expires": "2024-12-01"   // automatic cleanup
    },
    "recommendations-v2": {
      "enabled": true,
      "rollout": 100,
      "segment": "all",
      "geo": "global"
    }
  }
  
  Each gate is evaluated against:
  1. Is "enabled" true? (kill switch)
  2. Is the user in the allowed segment?
  3. Is the user's country in the allowed geo?
  4. Is hash(userId + gateName) % 100 < rollout?
  All four conditions must be true for the feature to show.

WHY THIS ENABLES MULTIPLE DEPLOYS PER DAY:
  The release system works like this:
  
  Day 1: Engineer ships new feature code. Gate is OFF (rollout: 0%).
         No users see the new feature. But the code is in production.
  
  Day 2: QA team sets gate to 5% (internal team). They test in production.
  
  Day 3: Gate set to 20%. Monitor metrics. No regressions.
  
  Day 4: Gate set to 100%. Feature is fully launched.
  
  If a bug is found at any step: gate set to 0%. Instant rollback.
  No code rollback. No emergency deployment. No incident.
  
  This decoupling of code deployment from feature visibility is what enables
  shipping code to production multiple times per day safely.
```

---

## 2️⃣ Introduced React — Universal SSR POC

### Why this was pioneering and how you convinced the company

```
THE CONTEXT (2014-2015):
  React was open-sourced by Facebook at JSConf 2013.
  In 2014: most usage was for small, isolated SPAs.
  Dailymotion had a large existing PHP + Smarty (later TWIG) backend.
  The codebase had thousands of server-rendered HTML pages.
  
  THE OBJECTION TO REACT (at the time):
  "React is client-side only. If we use React, Google can't index our pages."
  For a video platform: SEO is existential. Google can't find your videos = no organic traffic.
  "We can't use React."
  
  YOUR SOLUTION: The Universal (Isomorphic) POC
  "Universal" = the same React components render on server AND client.
  Server renders HTML for SEO. Client hydrates for interactivity.
  
  THE PROOF OF CONCEPT:
  
  Step 1: Server renders the component tree to an HTML string:
  const html = ReactDOMServer.renderToString(<VideoPage video={data} />);
  
  Step 2: Server sends the HTML with inline state:
  res.send(`<html><body>
    <div id="app">${html}</div>
    <script>window.__INITIAL_STATE__ = ${JSON.stringify(data)};</script>
  </body></html>`);
  
  Step 3: Client hydrates — attaches event handlers WITHOUT re-rendering:
  const state = window.__INITIAL_STATE__;
  ReactDOM.hydrate(<VideoPage video={state.video} />, document.getElementById("app"));
  
  WHAT THE POC PROVED:
  1. SEO: the HTML that arrives is fully rendered. Google indexes it normally.
  2. Performance: First Contentful Paint (FCP) is immediate — HTML is already rendered.
  3. Progressive enhancement: the page works even with JavaScript disabled.
  4. Gradual adoption: not a rewrite. Pages can be migrated one at a time.
     The PHP backend still serves most pages. React is adopted incrementally.
  
  HOW YOU CONVINCED THE COMPANY:
  A POC is not an argument. "This works in theory" loses to "we've always done it this way."
  The POC was a working demonstration: take this Dailymotion page, render it with React,
  view source in the browser — the HTML is there.
  Then check Google Search Console: Google indexes it.
  Then load the page: instant FCP, then React takes over for interactions.
  
  The objection was: "React is client-side, no SEO."
  The POC disproved it empirically.
  Stakeholders could see the HTML in View Source. They could see Google indexing it.
  Arguments are debatable. Demos are not.
  
  BEFORE NEXT.JS:
  This was before Next.js, before Gatsby, before "SSR" was a mainstream term.
  "Universal React" was the bleeding edge. Engineers were figuring it out in blog posts.
  Doing this at a scale-production site — for a 300M-user platform — was pioneering.
```

---

## 3️⃣ TWIG — Doubled Page Speed

```
THE BEFORE STATE (Smarty):
  Smarty was a popular PHP template engine (early 2000s).
  Smarty interprets templates at runtime:
  - Read the template file
  - Parse it (tokenize, build AST)
  - Execute the AST
  - Generate HTML
  Every request: all four steps. Even if the template has not changed.
  
  This is expensive because: file I/O + parsing on every request.
  Even with PHP opcode caching: the Smarty interpretation layer added overhead.
  
THE AFTER STATE (TWIG):
  TWIG (created by Fabien Potencier, also behind Symfony) compiles templates to PHP.
  Compilation happens ONCE (when the template changes).
  After compilation: the template is a PHP file.
  Execution: pure PHP — no parsing, no interpretation. Maximum speed.
  
  Smarty: interpret on every request → 420ms average template rendering
  TWIG:   execute pre-compiled PHP → 210ms average template rendering
  Result: 2× faster page rendering.
  
  ADDITIONAL BENEFITS:
  1. Cleaner separation of logic and presentation.
     TWIG intentionally restricts what you can do in templates.
     You cannot call arbitrary PHP functions. You cannot access global state.
     This forced engineers to move business logic out of templates and into controllers.
     Cleaner code. Easier to test.
  
  2. Template inheritance.
     TWIG has a proper inheritance model: extends, block, parent.
     Define a base layout. Page templates extend it.
     Before: copy-paste the header/footer into every template.
     After: define it once. All pages inherit it.
  
  3. Caching.
     TWIG has a built-in cache layer. Compiled PHP files are saved to disk.
     Hot path: file read + PHP execution (no compilation overhead).
  
THE MIGRATION STRATEGY:
  You do not rewrite all templates at once.
  Template-by-template migration: convert one view, deploy, measure, repeat.
  The TWIG and Smarty templates coexist during the migration.
  Result: page speed improves incrementally with each converted template.
  By the end: all templates on TWIG. 2× speed improvement sustained.
```

---

## 4️⃣ Flash Player → HTML5 Video

### The ActionScript 3 rewrite

```
CONTEXT:
  Dailymotion's Flash player (pre-2010) was in ActionScript 2.
  ActionScript 2 is a dynamically-typed, weakly-OOP language.
  It was difficult to maintain and extend as the player grew in complexity.
  
WHAT I BUILT:
  Rewrote the player in ActionScript 3 with a new architecture.
  ActionScript 3 introduced:
  - Proper OOP: classes, interfaces, inheritance
  - Strict typing: compile-time type checking
  - AVM2: new virtual machine, ~10× faster than AVM1
  - E4X: XML handling built into the language (for RTMP streams)
  
  NEW ARCHITECTURE (separated concerns):
  
  PlayerCore: video state machine
    States: idle → loading → buffering → playing → paused → ended
    Transitions: strict. Cannot go from idle to playing without loading.
    Manages: RTMP/HTTP streaming, quality switching, buffering logic.
  
  PlayerUI: display objects and skins
    Completely separate from PlayerCore.
    Receives events from PlayerCore. Renders the UI state.
    Skinnability: different publishers could use different UI skins.
  
  PlayerComm: JavaScript bridge
    ExternalInterface: the Flash API for JavaScript communication.
    Player exposes: play(), pause(), seek(), setVolume(), getState().
    Fires events: onPlay, onPause, onProgress, onEnd.
    This bridge became the contract that the HTML5 player later maintained.
    Same JavaScript API. Drop-in replacement.
  
  PlayerAnalytics: event tracking
    Every play, pause, seek, quality change: tracked.
    Video quality metrics collected (bitrate, buffer health).
    Foundation for what later became the HTML5 quality monitoring system.
  
WHY THE ARCHITECTURE MATTERED:
  Before: one monolithic .swf. Change anything, risk breaking everything.
  After: PlayerCore changes don't affect PlayerUI. PlayerComm is a stable contract.
  The UI could be redesigned without touching the streaming code.
  The streaming code could be optimized without touching the UI.
  This is the principle of single responsibility applied to a media player.
```

### HTML5 video — the technical transition

```
WHY HTML5 WAS HARD IN 2011:
  In 2011: Flash was the default. HTML5 video was experimental.
  
  THE BROWSER FRAGMENTATION PROBLEM:
  
  Each browser supported different video codecs:
  
  Chrome:  H.264 (MPEG-4) + WebM (VP8 from Google)
  Firefox: Ogg Theora ONLY (Firefox refused H.264 due to patent licensing concerns)
  Safari:  H.264 ONLY (Apple's preferred codec)
  IE 9:    H.264 only (Microsoft finally added HTML5 video in IE9)
  IE 6-8:  No HTML5 video. Flash required.
  
  SOLUTION: multiple source formats + progressive fallback:
  
  <video>
    <source src="video.mp4"  type="video/mp4">    <!-- H.264: Chrome, Safari, IE9 -->
    <source src="video.webm" type="video/webm">   <!-- VP8: Chrome, Firefox 4+ -->
    <source src="video.ogv"  type="video/ogg">    <!-- Theora: Firefox 3.6 -->
    <object data="player.swf" type="application/x-shockwave-flash">
      <!-- Flash fallback: IE8 and older browsers -->
    </object>
  </video>
  
  But: Dailymotion had millions of videos. Transcoding all to three formats was expensive.
  Prioritization strategy:
  1. Transcode new uploads immediately to H.264 + WebM (Chrome covers both).
  2. Backfill existing videos on a background job queue.
  3. Ogg Theora: only if explicitly needed (Firefox 3.6 users declining).
  4. Flash fallback: serve until IE8 market share dropped below threshold.
  
  PLAYER IMPLEMENTATION CHALLENGES:
  
  1. Custom controls (no native UI):
     The native HTML5 video controls look different in every browser.
     For a consistent branded experience: native controls hidden (controls attribute removed).
     Custom UI built in CSS/JS on top of the video element.
     This means: implementing play/pause, seek, volume, fullscreen — all in JavaScript.
  
  2. Fullscreen API differences:
     Chrome: element.webkitRequestFullscreen()
     Firefox: element.mozRequestFullScreen()
     Safari: element.webkitRequestFullscreen()
     IE11: element.msRequestFullscreen()
     Standard: element.requestFullscreen() (appeared much later)
     Solution: vendor-prefix detection + unified API wrapper.
  
  3. Adaptive bitrate (MPEG-DASH, later HLS):
     A single quality level is wrong for users on different connections.
     Implement adaptive bitrate: detect bandwidth, switch quality automatically.
     Used Media Source Extensions (MSE) API: manually feed video segments to the player.
     This was not a trivial feature — it required implementing a segment downloader,
     bandwidth estimator, and buffer manager in JavaScript.
  
  4. DRM:
     Premium content required DRM. No standard DRM in HTML5 at the time.
     Solution: EME (Encrypted Media Extensions) — proposed standard, Chrome-only initially.
     Required different DRM systems per browser (Widevine, FairPlay, PlayReady).
```

---

## 5️⃣ ES6 SDK + Relay Pattern

```
THE DAILYMOTION JAVASCRIPT SDK:
  Purpose: a JavaScript library for embedding and controlling the Dailymotion player.
  External developers use it. Internal teams use it.
  
  Built in ES6 (2014-2015 era), when ES6 support was ~15% of browsers.
  Transpilation with Babel to ES5. One of the early large-scale Babel adoptions.
  
  Why ES6:
  - Classes: proper OOP for player/API/events modules
  - Arrow functions: no more var self = this; hacks
  - Promises: async API calls with proper chaining
  - Modules (import/export): before this, everything was in the global scope
  - Template literals: cleaner string construction for URLs, HTML snippets
  - Destructuring: cleaner API surface

THE RELAY PATTERN:
  The Dailymotion player runs in an iframe.
  The iframe is sandboxed: different origin, isolated JavaScript context.
  The embedding page (the "host") and the player cannot directly call each other's functions.
  
  COMMUNICATION: postMessage() API
  The relay is a bidirectional message bridge:
  
  Host page → Player:
  relay.send("seek", { position: 120 });
  // → iframe.contentWindow.postMessage({ event: "seek", data: { position: 120 } }, "*")
  
  Player → Host page:
  relay.on("play", (data) => console.log("started at", data.position));
  // window.addEventListener("message", ...) → routes to registered handler
  
  SECURITY:
  The origin check is critical:
  if (event.origin !== "https://www.dailymotion.com") return;
  Without this: any page could send fake messages to the player.
  
  WHY "RELAY":
  The relay does not execute the action itself. It relays the message.
  The player receives the message and decides what to do.
  The host receives the event and decides what to do.
  The relay is a dumb pipe with a well-defined protocol.
  
  WHY THIS PATTERN MATTERS:
  It is the same concept as the Chrome Extension message passing,
  the Electron IPC system, and React Native's JavaScript bridge.
  Any time two JavaScript contexts cannot share memory, they communicate via messages.
  The relay is the abstraction that makes this manageable.
```

---

## 6️⃣ Google TV / Stream — 10-Foot UI

```
WHAT "10-FOOT UI" MEANS:
  Standard UI: user is 1-2 feet from a laptop or phone screen.
  TV UI: user is 10 feet from the television.
  
  The distance changes everything:
  - Font sizes: minimum 24px at 10 feet (vs 12px on desktop)
  - Click targets: large (remote D-pad has limited precision)
  - Information density: much less per screen (far away, harder to scan)
  - Navigation model: no mouse. No touch. Only D-pad: up/down/left/right + select + back.
  
WHY HTML5 FOR GOOGLE TV (not a native app):
  Google TV ran a full Chrome browser. Same rendering engine as Chrome for desktop.
  One HTML5 codebase → Chrome Web Store app + TV interface + future set-top boxes.
  "Future set-top boxes" = the vision: any device with a browser runs the same player.
  This was the "write once, render everywhere" promise of HTML5.

SPATIAL NAVIGATION:
  The biggest technical challenge: focus management.
  On desktop: mouse moves focus. Tab key for accessibility.
  On TV: D-pad moves focus spatially: left/right/up/down.
  
  The browser has no built-in spatial navigation (not in 2012).
  Implemented a custom focus manager:
  
  function findNextFocusable(direction, currentElement, allFocusable) {
    const currentRect = currentElement.getBoundingClientRect();
    return allFocusable
      .filter(el => {
        const rect = el.getBoundingClientRect();
        // Filter to elements in the correct direction
        if (direction === "right") return rect.left > currentRect.right - 10;
        if (direction === "left")  return rect.right < currentRect.left + 10;
        if (direction === "down")  return rect.top > currentRect.bottom - 10;
        if (direction === "up")    return rect.bottom < currentRect.top + 10;
        return false;
      })
      .sort((a, b) => {
        // Sort by proximity (Manhattan distance from current element)
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const distA = Math.abs(aRect.left - currentRect.left) + Math.abs(aRect.top - currentRect.top);
        const distB = Math.abs(bRect.left - currentRect.left) + Math.abs(bRect.top - currentRect.top);
        return distA - distB;
      })[0];
  }
  
  document.addEventListener("keydown", (e) => {
    const directionMap = { 37: "left", 38: "up", 39: "right", 40: "down" };
    const direction = directionMap[e.keyCode];
    if (!direction) return;
    const next = findNextFocusable(direction, document.activeElement, focusableElements);
    if (next) next.focus();
  });

PERFORMANCE FOR TV HARDWARE:
  Google TV (2010 era) had limited CPU (ARM processor, ~500MHz effective).
  JavaScript-heavy animations: unacceptable.
  
  Rules:
  Only CSS transitions for animations. Never JavaScript-driven animation.
  Only transform + opacity for GPU-accelerated animations (no width/height/margin).
  No complex selectors (descendant selectors are expensive).
  Virtual scrolling for video grids (only render what is visible).
```

---

## 7️⃣ Team Leadership — 13 Developers

```
THE SCOPE:
  13 developers = a significant team for a web product.
  Responsibilities: recruitment, training, technical direction, delivery.
  
RECRUITMENT:
  Technical phone screen + take-home coding challenge + pair programming session.
  Looking for: problem-solving, code quality, ability to articulate tradeoffs.
  "Not looking for developers who know the right answers.
   Looking for developers who reason well about unknown problems."
  
TRAINING:
  Internal workshops: JavaScript (ES6), CSS architecture, React (post-adoption).
  Code review culture: every PR reviewed by at least two engineers.
  The review is a teaching opportunity: not just "change line 12" but "change line 12 because..."
  
TECHNICAL DIRECTION:
  You set the technical bar.
  The GateKeeper, Toolkit, TWIG, React introduction, HTML5 player, SDK —
  all of these were your initiatives, proposed to leadership, approved, led.
  Being Engineering Lead means: shaping what the engineering org builds next.
  
DELIVERY:
  A team of 13 shipped:
  - GateKeeper (100M+ calls/day, still running years later)
  - Dailymotion Toolkit (UX consistency, dev speed)
  - TWIG migration (2× page speed)
  - React adoption (company-wide)
  - HTML5 player (Flash replacement)
  - ES6 SDK + relay
  - Google TV / Stream HTML5 interface
  - Multiple deploys per day release system
  
  Measuring a team lead's effectiveness: the sum of what the team ships.
  This team shipped architecture changes that outlasted individual tenures.
  GateKeeper ran for years after you left. That is the measure.
```

---

## STAR Scripts

### GateKeeper

```
SITUATION:
  Dailymotion needed to: (a) A/B test features without forked codebases,
  (b) roll out features gradually with kill-switch capability,
  (c) ship code frequently without each deployment being a "feature launch."
  None of this was possible with a direct code→feature coupling.

TASK:
  Introduce the GateKeeper concept — a configurable feature flag system —
  to Dailymotion. Design the architecture. Get buy-in. Lead implementation.

ACTION:
  Designed GateKeeper: a CDN-cached JSON config + O(1) in-memory evaluation engine.
  Deterministic hashing for consistent rollout (same user, same result, every time).
  Segments (all/logged-in/premium/beta), geo-restrictions, rollout %, kill switch.
  Integrated into every feature render path. Documented the pattern for all engineers.
  Trained the team on GateKeeper-first development: ship code with gate OFF.

RESULT:
  GateKeeper runs in production. Called hundreds of millions of times per day.
  Multiple deploys to production per day became safe: feature visibility decoupled from deployment.
  A/B testing without code branches. Geo launches without server-side logic changes.
  Rollbacks: change a config value, not a deployment.
```

### Introducing React

```
SITUATION:
  Dailymotion's frontend used PHP/TWIG + jQuery.
  The industry was moving to component-based frontend frameworks.
  React offered reusability, testability, and a better developer model.
  The objection: "React is client-side only. We'll lose SEO."
  For a video platform, losing SEO was not acceptable.

TASK:
  Prove React was viable for Dailymotion by removing the SEO objection.
  Create a POC. If the POC convinced stakeholders, lead the adoption.

ACTION:
  Built a Universal React POC: same components render on server (Node.js + ReactDOMServer)
  and client (ReactDOM.hydrate). Server sends pre-rendered HTML.
  Google indexes it. Client hydrates for interactivity.
  Demonstrated in a working prototype: View Source → full HTML. Google can index this.
  Presented to technical and product leadership with a live demo.

RESULT:
  Company decided to adopt React. Led the migration strategy.
  React is now the standard for all Dailymotion web surfaces.
  The universal SSR architecture (before Next.js, before "isomorphic" was mainstream)
  set the pattern for the entire engineering organisation.
```

---

## Follow-up Q&A

**"How did you design the GateKeeper to handle hundreds of millions of calls per day?"**
> "The key constraint was: the GateKeeper must be sub-millisecond, synchronous, and require no network request. If it added even 5ms to every page render, the cumulative effect on page load time would be unacceptable. The solution: the gate configuration is a JSON file fetched from CDN and loaded into memory at server startup. Each gate evaluation is then a hashmap lookup (O(1)) followed by an integer comparison. No I/O, no async, no network. The consistency requirement was the trickier design problem. A gate at 30% rollout must always give the same user the same answer. If the answer changed on each page view, users would see features appear and disappear randomly — a terrible experience. The solution: deterministic hashing. hash(userId + gateName) % 100 < rollout%. The same userId and gateName always hash to the same value. Same user, same gate, same result. Every time."

**"Why did you use TWIG instead of staying with Smarty?"**
> "The primary technical reason was performance: TWIG compiles templates to PHP bytecode at first use and caches the result. Subsequent requests execute native PHP — no parsing overhead. Smarty interprets templates at runtime. We measured: 2× rendering speed improvement on the average page. But the secondary reason was equally important: TWIG enforces a cleaner separation of concerns. TWIG is intentionally limited in what it can do. You cannot call arbitrary PHP functions from a TWIG template. You cannot access global state. This might sound like a limitation, but it is actually a feature. Before TWIG, engineers had been putting business logic inside Smarty templates — fetching data, computing values, making API calls — inside the template. This made templates slow, hard to test, and tightly coupled to implementation details. TWIG said 'no, you cannot do that here' — and forced the logic into controllers where it belonged."

**"What was the hardest part of introducing React at Dailymotion?"**
> "It was not the technology. It was the objection. 'React is client-side only, we'll lose SEO' was a genuine concern — not a conservative reaction. For a video platform competing with YouTube, organic search traffic is existential. If Google can't index your video pages, you lose. The universal SSR POC addressed this technically: you could View Source and see fully rendered HTML. Google could index it. But I learned that technical correctness is not always sufficient to change an organisation's direction. What convinced people was not the explanation — it was the demo. I built a working page using React, rendering on the server. I showed it in the browser. I showed View Source. Then I showed the same page in Google's Search Console being indexed correctly. Arguments are debatable. Demos are not. After that, the conversation shifted from 'should we use React?' to 'how do we migrate?'"

**"What made the Flash player rewrite in ActionScript 3 significant?"**
> "Three things. First, the technology: AS3 introduced strict typing and a new VM (AVM2) that was about 10× faster than AS2. Performance improvements for video playback are directly visible to users — faster seeking, less buffering, smoother playback. Second, the architecture: I separated the player into four layers: core (video state machine), UI (display objects), communication (JavaScript bridge), and analytics. The old player was monolithic — change anything, risk breaking everything. With the layered architecture, each concern was isolated. The JavaScript bridge in particular was significant: by defining a stable API contract (play, pause, seek, getState, event callbacks), the transition from Flash to HTML5 was much smoother. The HTML5 player simply implemented the same JavaScript API. Existing integrations did not need to change. Third, the timing: this was preparation for HTML5. We knew Flash's days were numbered when Apple announced the iPhone would not support Flash. The clean architecture made the eventual migration manageable."

---

## 🔗 Unified Narrative

> "My years at Dailymotion were fundamentally about being ahead of the curve — identifying where the industry was going and driving the organisation to get there before it became obvious.
>
> The GateKeeper is the clearest example. In 2013-2014, feature flags were not mainstream. I proposed the concept, designed the architecture, and led the implementation. It is now called hundreds of millions of times per day. The pattern — ship code with the feature off, turn it on separately, roll back with a config change — became the foundation of how Dailymotion ships software. Multiple deploys per day is only safe because the GateKeeper decouples code deployment from feature visibility.
>
> React is another example. In 2014, React was controversial. 'Client-side only, no SEO' was a reasonable objection for a video platform. I built the Universal SSR proof of concept — the same components rendering on server and client — before Next.js, before 'isomorphic' was a term. I demonstrated it worked. Dailymotion adopted React company-wide. The approach I proved has since become the standard architecture for production React applications globally.
>
> The Flash player rewrite and HTML5 migration followed the same pattern: anticipate the shift (Apple's no-Flash announcement was the signal), design a clean architecture that makes the transition manageable, execute. The ActionScript 3 player's layered architecture — with a stable JavaScript API — meant the HTML5 player was a drop-in replacement. Existing integrations continued working.
>
> Leading a 13-person team across all of this was the force multiplier. The team shipped the GateKeeper, the Toolkit, the TWIG migration, the React adoption, the HTML5 player, the SDK, and the Google TV interface. A 2× page speed improvement. A company-wide framework adoption. A feature flag system at hundreds-of-millions-of-calls/day scale. That is the output of a well-led engineering team that stays ahead of the industry."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built a feature flag system" | "I **introduced the GateKeeper concept** to Dailymotion — didn't exist before. **Designed the architecture**: O(1) hashmap, **deterministic hashing** (hash(userId+gate)%100 for consistent rollout), CDN-cached config. Called **hundreds of millions of times/day**. Enabled multiple deploys/day." |
| "I introduced React" | "I built a **Universal SSR POC** (before Next.js, before 'isomorphic' was mainstream) to remove the SEO objection. Same components on server (renderToString) and client (hydrate). **Showed View Source = full HTML**. Persuaded the company. React is now the Dailymotion standard." |
| "I switched to TWIG" | "TWIG compiles templates to PHP bytecode (once). Smarty interprets at runtime (every request). Result: **2× page rendering speed**. Also enforced separation of concerns: TWIG won't let you put business logic in templates — improved code quality organisation-wide." |
| "I worked on the Flash player" | "**New architecture** in ActionScript 3: 4 separated layers (Core/UI/Comm/Analytics). Stable JavaScript API contract (play/pause/seek/events). This API was **maintained identically in the HTML5 player** — existing integrations required zero changes on migration." |
| "I managed a team" | "**Management of 13 developers**. Full scope: technical interviews, hiring bar, training (JS/React workshops, code review culture), technical direction (proposed and drove GateKeeper, TWIG, React, HTML5 player, SDK, Google TV — all shipped). The team's output spans **years after I left**." |

---

## 📊 Quick Facts

```
Company: Dailymotion (French video platform, 300M+ monthly users)
Role:    Engineering Lead · Senior Frontend Engineer · 13-person team

GATEKEEPER:
  Concept: configurable wall in front of functionalities
  Scale:   hundreds of millions of evaluations per day
  Architecture: CDN-cached JSON + O(1) hashmap + deterministic hashing
  Evaluation: segment × geo × hash(userId+gate)%100 < rollout
  Enables: multiple deploys/day, A/B tests, gradual rollouts, kill switches

REACT INTRODUCTION:
  POC type:  Universal SSR (isomorphic React) — before Next.js
  Technique: ReactDOMServer.renderToString() → HTTP HTML → ReactDOM.hydrate()
  Why novel: removes SEO objection (View Source = full HTML) without losing SPA interactivity
  Outcome:   company-wide React adoption

TWIG:
  Before: Smarty (interpret at runtime → 420ms)
  After:  TWIG (compile to PHP bytecode once → 210ms)
  Result: 2× page rendering speed + enforced separation of concerns

FLASH → HTML5:
  AS3 player: 4-layer architecture (Core/UI/Comm/Analytics), stable JS API contract
  HTML5 player: implemented same JS API → existing integrations unaffected
  HTML5 challenge: browser codec fragmentation (H.264/WebM/Ogg) + custom controls + Fullscreen API vendors

ES6 SDK + RELAY:
  SDK: ES6 + Babel transpilation (early large-scale Babel usage)
  Relay: postMessage bridge between sandboxed iframe player and host page
  Security: origin validation on all messages

GOOGLE TV / STREAM:
  Interface: 10-foot UI for TV + Chrome Web Store
  Challenge: no mouse, D-pad only, spatial navigation (custom focus manager)
  Performance: CSS transitions only, transform/opacity for GPU, virtual scrolling

TEAM:
  Size: 13 developers
  Scope: recruitment (technical interviews), training (workshops, review culture), technical direction, delivery
  Shipped: GateKeeper, Toolkit, TWIG, React, HTML5 player, SDK, Google TV, release system
```

---

*Document last updated: June 2026 · Dailymotion interview preparation*
