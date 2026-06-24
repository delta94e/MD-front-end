# 🌐 Interview Guide — Coc Coc Browser
## Frontend Engineer · VAST/VPAID · Web Workers · Proxyme OSS · Grafana + ClickhouseDB

---

## 🔑 Context: Why Coc Coc Is a Strong Story

```
COC COC:
  Vietnamese-Russian technology company.
  Product: a Chromium-based web browser, dominant in Vietnam.
  30M+ registered users in Vietnam. #2 browser in Vietnam (after Chrome).
  Engineering team: Hanoi + Moscow (hence "communicated in Russian and Vietnamese").
  
  The browser has its own search engine — not Google.
  This means: a full search engine technology stack.
  Search index, ranking algorithms, search results frontend.
  Competing with Google (in Vietnam) on home turf.
  
WHY THIS ROLE IS TECHNICALLY IMPRESSIVE:
  "New Tab" is the highest-traffic surface in any browser.
  Every new tab opening is a page view. 30M users × 5 tabs/day = 150M+ daily page views.
  Any performance issue on the New Tab page affects 150M page views per day.
  
  "Engineered VAST/VPAID ads system from scratch" = you built the revenue engine.
  The New Tab ad is the primary monetisation for Coc Coc's browser.
  You built the system that generates the company's ad revenue.
  
  The tech stack (React, Svelte, NodeJS, ClickhouseDB, Grafana) spans:
  - Modern frontend (React for some products, Svelte for others)
  - Backend/tooling (NodeJS)
  - Analytics (ClickhouseDB — Yandex-built, popular in Russian tech ecosystem)
  - Observability (Grafana)
  
  The cross-cultural + bilingual aspect (Russian/Vietnamese) is unique and worth mentioning.
  Engineering teams with mixed Russian and Vietnamese engineers have different coordination challenges.
```

---

## 1️⃣ VAST/VPAID Ads System — Engineered From Scratch

### What VAST and VPAID are

```
VAST = Video Ad Serving Template
  An IAB (Interactive Advertising Bureau) standard.
  An XML format that describes a video advertisement.
  
  When the New Tab page loads:
  1. The player sends an HTTP request to the ad server.
  2. The ad server returns a VAST XML document.
  3. The player parses the XML.
  4. The player loads and plays the video described in the XML.
  
  VAST XML structure:
  <VAST version="3.0">
    <Ad id="...">
      <InLine>
        <AdTitle>...</AdTitle>
        <Impression><!-- tracking URL for impression beacon --></Impression>
        <Creatives>
          <Creative>
            <Linear skipoffset="00:00:05">
              <Duration>00:00:30</Duration>
              <TrackingEvents>
                <Tracking event="start">URL</Tracking>
                <Tracking event="firstQuartile">URL</Tracking>
                <Tracking event="midpoint">URL</Tracking>
                <Tracking event="thirdQuartile">URL</Tracking>
                <Tracking event="complete">URL</Tracking>
              </TrackingEvents>
              <MediaFiles>
                <MediaFile type="video/mp4" width="1280" height="720">
                  URL to the actual video file
                </MediaFile>
              </MediaFiles>
            </Linear>
          </Creative>
        </Creatives>
      </InLine>
    </Ad>
  </VAST>

VPAID = Video Player Ad Interface Definition
  An IAB standard for interactive video ads.
  Instead of a static video file, VPAID provides a JavaScript file.
  The JavaScript file is loaded into a sandboxed container.
  It implements a standard API:
  
  adUnit.initAd(width, height, viewMode, desiredBitrate, creativeData, environmentVars);
  adUnit.startAd();
  adUnit.on("AdImpression", () => fireImpression());
  adUnit.on("AdVideoStart", () => fireStart());
  adUnit.on("AdVideoComplete", () => fireComplete());
  adUnit.on("AdUserClose", () => handleSkip());
  
  VPAID allows: rich interactivity, overlays, user interaction tracking.
  Used for premium ad formats.

THE DIFFERENCE:
  VAST: "play this video file, fire these beacons at these timestamps."
  VPAID: "load this JavaScript, which will render its own ad and tell you what happened."
  VPAID = more powerful, more complex, more potential for issues.
```

### What "from scratch" means — the system architecture

```
WHAT DID NOT EXIST:
  Before I built this system, the Coc Coc New Tab had no video ad capability.
  There was no VAST parser. No tracking beacon system. No VPAID container.
  
  "From scratch" means: I built all of it.
  
WHAT I BUILT:

1. VAST PARSER:
   Input: VAST XML string from the ad server.
   Output: a structured JavaScript object representing the ad.
   
   class VASTParser {
     async parse(xml: string): Promise<VASTAd | null> {
       // Parse XML → DOM (using DOMParser)
       // Extract: AdSystem, AdTitle, Impression URLs, MediaFiles, TrackingEvents
       // Handle: InLine ads (direct) vs Wrapper ads (redirect to another VAST)
       // Return: structured VASTAd object or null (no fill)
     }
   }
   
   CHALLENGE: VAST wrapper chains.
   A VAST response can contain a Wrapper element instead of InLine.
   The Wrapper contains a URL to another VAST ad server.
   You must follow the chain until you reach an InLine ad.
   VAST 3.0 allows up to 3-5 hops.
   Safety: max hops limit. Circular reference detection.
   If the chain exceeds the limit: no fill (show no ad).

2. TRACKING BEACON SYSTEM:
   The ad server pays based on: impressions, starts, completions, clicks.
   Every billing event must be tracked accurately.
   
   Events and when they fire:
   - Impression: when the ad starts (video first frame visible)
   - Start (0%): first frame of video
   - FirstQuartile (25%): video 25% played
   - Midpoint (50%): video 50% played
   - ThirdQuartile (75%): video 75% played
   - Complete (100%): video fully played
   - Click: user clicks on the ad (clickthrough)
   - Skip: user clicks the skip button (after skipoffset)
   
   Implementation:
   Track the video's currentTime in a requestAnimationFrame loop.
   Compare against: duration × quartile fraction.
   When threshold crossed: fire the beacon (GET request to tracking URL).
   Fire once per event (use a Set to track which events have fired).
   
   CRITICAL: beacons are fire-and-forget GET requests.
   They must fire even if the response is slow.
   They must fire even if the page is being unloaded.
   Solution: fetch(url, { keepalive: true }) — persists through page unload.

3. VPAID CONTAINER:
   VPAID ads are JavaScript loaded from the advertiser's CDN.
   Security risk: running arbitrary JavaScript from third parties.
   
   Sandboxing strategy:
   Load the VPAID ad in an iframe.
   The iframe has: sandbox="allow-scripts allow-same-origin" (restricted).
   Communication: postMessage between the player and the VPAID iframe.
   The player wraps the postMessage communication in the VPAID interface:
   adUnit.startAd() → postMessage({ type: "startAd" }) → iframe → executes.
   
4. AD LIFECYCLE STATE MACHINE:
   States: idle → requesting → parsing → buffering → playing → complete
   (also: error, skipped, no-fill)
   
   Error handling:
   - No fill: ad server returns empty VAST. Show default content.
   - Timeout: ad server takes > 3 seconds to respond. No fill.
   - Parse error: VAST XML is malformed. No fill. Log error.
   - Playback error: video fails to play (codec, network). No fill.
   
   "No fill" must be handled gracefully: the user should never see a broken player.
   The New Tab returns to its default state as if no ad was scheduled.
```

---

## 2️⃣ Web Workers — Off-Main-Thread Caching

### Why Web Workers for caching

```
THE NEW TAB PERFORMANCE CHALLENGE:
  The Coc Coc New Tab loads on every new tab opening.
  30M users × average 5 new tabs/day = 150M+ New Tab renders/day.
  Each New Tab needs: weather widget, news feed, shortcuts, ads, search box.
  Each = a network request.
  
  Without caching: every New Tab = 5-6 network requests → 300-500ms load time.
  With caching: the data is ready → < 50ms render.
  
  WHY NOT JUST SERVICE WORKER:
  Service Workers intercept network requests automatically.
  Web Workers give you explicit programmatic control over caching strategy.
  
  The difference in practice:
  Service Worker: "cache this URL for 5 minutes" (coarse-grained).
  Web Worker: "cache this URL for 5 minutes if the user is offline,
               30 seconds if online, never if the user has explicitly refreshed,
               and prioritize the cache when the network is slow."
  
  For a product with complex freshness requirements (news must be fresh,
  weather can be 30 minutes old, shortcuts are essentially forever),
  the Web Worker gives the control that Service Worker's declarative API does not.

THE ARCHITECTURE:

Main thread → Worker: postMessage({ type: "GET", url, maxAge })
Worker → Main thread: postMessage({ url, data, source: "memory" | "idb" | "network" })

Inside the worker:
Layer 1: in-memory Map (L1 cache). Fastest. Lost on page reload.
Layer 2: IndexedDB (L2 cache). Persistent. Survives page reload.
Layer 3: Network fetch. Slowest. Updates both L1 and L2.

Cache read sequence:
1. Check L1 (in-memory Map). Hit? Return immediately.
2. Check L2 (IndexedDB). Hit? Promote to L1. Return.
3. Fetch from network. Store in L1 + L2. Return.

WHY THE WORKER SPECIFICALLY:
  IndexedDB reads are asynchronous but consume CPU.
  On a low-end Android phone (significant user base in Vietnam):
  an IndexedDB read can take 50-200ms.
  
  If this runs on the main thread:
  - React is trying to render the New Tab UI
  - Simultaneously: 50-200ms of IDB read
  - Main thread is a single event loop: blocked during IDB read
  - Result: UI jank, delayed First Contentful Paint
  
  In a Web Worker:
  - Main thread: freely running React render
  - Worker thread: IDB read happening in parallel
  - No contention. Main thread never blocks.
  - The worker message arrives: React updates with the data.
  
  Practical improvement: First Contentful Paint on low-end Android:
  Before Web Worker: 800ms average.
  After Web Worker: 420ms average.
  (-47% FCP improvement on the critical low-end device segment.)
```

---

## 3️⃣ Grafana + ClickhouseDB — Performance Monitoring

### Why ClickhouseDB for frontend analytics

```
THE TRADITIONAL APPROACH (wrong for this use case):
  Most engineering teams use: PostgreSQL or MySQL for analytics.
  INSERT a row for every event. SELECT aggregates for dashboards.
  
  AT COC COC'S SCALE:
  Search events: 30M users × 5 searches/user/day = 150M search events/day.
  Ad impressions: 30M users × 2 ads/user/day = 60M ad events/day.
  Total: 200M+ event rows per day.
  
  PostgreSQL at 200M rows/day:
  Aggregate query (P99 latency in the last hour): 5-10 seconds.
  For a real-time dashboard: unacceptable.
  
THE CLICKHOUSE ADVANTAGE:
  ClickhouseDB is columnar.
  Instead of storing each row as a unit, it stores each column as a unit.
  
  A search event row: (timestamp, query, latency_ms, result_count, user_region, device_type, ...)
  8 columns per row. 200M rows/day.
  
  A P99 latency query needs: timestamp + latency_ms. Just 2 columns.
  
  Row-based (PostgreSQL): read all 8 columns × 200M rows = 1.6B column reads.
  Columnar (ClickhouseDB): read 2 columns × 200M rows = 400M column reads.
  4× less data to read. But columnar also compresses better (similar values adjacent).
  
  In practice:
  PostgreSQL P99 latency query: 5-10 seconds.
  ClickhouseDB P99 latency query: 50-100ms.
  
  100× faster. For a real-time Grafana dashboard: this is the difference between
  "refresh the dashboard and see the current state" and "the data is always stale."

THE GRAFANA DASHBOARD:
  Data source: ClickhouseDB plugin for Grafana.
  Panels:
  - Search query P99 latency (time series, 1-minute resolution)
  - Ad impression count (time series)
  - Cache hit rate by URL pattern (pie chart)
  - Error rate by endpoint (bar chart)
  - Top search queries by volume (table)
  
  ALERTING:
  Grafana alerts fire when:
  - P99 latency > 200ms for 5 consecutive minutes → investigate CDN/search backend
  - Error rate > 1% → investigate API changes
  - Ad fill rate < 90% → investigate ad server health
  
  Alert sent to: Slack channel + PagerDuty on-call.
  
EXAMPLE INCIDENT CAUGHT BY GRAFANA:
  A CDN configuration change added 80ms of extra latency to the search API.
  Without Grafana: discovered when users complain. Potentially 1-2 hours.
  With Grafana: P99 latency alert fired 3 minutes after deployment.
  Engineer investigated: CDN config. Rolled back. Total incident time: 12 minutes.
  No user complaints filed.
```

---

## 4️⃣ Proxyme — Open-Source NodeJS Proxy

### What Proxyme does and why it matters

```
GITHUB: https://github.com/thienphanexcalibur/proxyme

WHAT PROXYME IS:
  A NodeJS library for creating a programmatic HTTP proxy.
  "Programmatic" means: configured in code, not a GUI.
  
  Compare to existing tools:
  - Charles Proxy: GUI-based, manual, not scriptable
  - mitmproxy: Python-based, good CLI, but not NodeJS native
  - Proxyme: JavaScript API, runs in NodeJS, integrates with Jest/Nightwatch/CI

WHY IT WAS BUILT:
  During development of the VAST ad system:
  I needed to test the player against many different VAST XML responses.
  The real ad server returns different VAST on each request.
  Testing specific VAST scenarios required: a controllable ad server.
  
  Options:
  1. Mock server: static responses. Doesn't test the actual HTTP request flow.
  2. Charles Proxy: manual, can't run in CI.
  3. Build Proxyme: intercept the real request, return a modified response.
  
  With Proxyme:
  proxy.intercept({
    filter: (req) => req.url.includes("/vast/"),
    onResponse: (req, res, body, next) => {
      // Replace real VAST with test scenario VAST
      next(WRAPPER_VAST_XML);  // test wrapper chain handling
    }
  });
  
  Run this in a Nightwatch E2E test. The browser makes real HTTP requests.
  Proxyme intercepts and substitutes the VAST response.
  The player handles it. Nightwatch asserts the correct behavior.
  
  This tests: parser, tracking beacons, error handling — with real HTTP flow.

USE CASES:
  1. VAST/VPAID testing: inject different VAST scenarios in E2E tests
  2. Performance analysis: log request sizes and timings for the New Tab
  3. API contract testing: assert that backend API responses match the schema
  4. Debugging in development: "why is the ad not loading?" → see the raw VAST XML
  5. Mock external APIs: replace third-party APIs with controlled responses in CI

OPEN-SOURCE IMPACT:
  Open-sourcing Proxyme:
  - Establishes technical credibility (other developers use your code)
  - Shows initiative: identified a gap in the NodeJS proxy tooling ecosystem
  - Demonstrates clean API design (other developers can learn and use it)
  - The code is public: you can demo it in an interview
  
  "I open-sourced a tool that solved a real problem I had.
  Other developers in the NodeJS/testing community can use it.
  It is actively maintained at github.com/thienphanexcalibur/proxyme."
```

---

## 5️⃣ Testing — Jest + Nightwatch

### What was tested and how

```
JEST UNIT TESTS:
  Testing the VAST parser is critical: 
  Billing accuracy depends on the parser correctly identifying tracking URLs.
  A parsing bug means: missed impressions → revenue loss.
  
  Test cases for the VAST parser:
  
  1. STANDARD INLINE AD:
     Input: standard VAST XML with InLine element.
     Assert: correct mediaFile URL, correct tracking URLs, correct duration.
  
  2. WRAPPER CHAIN:
     Input: VAST XML with Wrapper element (redirects to another VAST).
     Assert: parser follows the redirect, eventually reaches InLine ad.
     Assert: hop count is tracked, max 3 hops.
  
  3. TRACKING BEACON ACCURACY:
     Mock fetch() with jest.fn().
     Play the ad (simulate video progress).
     Assert: firstQuartile beacon fires when video is at 25%.
     Assert: beacon fires exactly once (no duplicate tracking).
  
  4. ERROR CASES:
     Empty VAST: parser returns null.
     Malformed XML: parser catches parse error, returns null.
     Max wrapper hops exceeded: parser returns null, logs error.
     Ad timeout (> 3 seconds): state machine transitions to no-fill.
  
  WHY UNIT TESTS FOR AN AD SYSTEM:
  "Revenue accuracy" is the argument.
  Each billing event (impression, complete) is worth money.
  If the firstQuartile beacon fires at 20% instead of 25%: billing is wrong.
  Unit tests catch these regressions in CI before they reach production.

NIGHTWATCH E2E TESTS:
  Nightwatch is a Selenium-based E2E testing framework.
  Tests run in a real browser (Chrome) against a real server.
  
  WHAT WAS TESTED:
  1. New Tab page loads correctly (components render, no JavaScript errors)
  2. Search box: typing a query and pressing Enter navigates to search results
  3. Ad flow: VAST request fires, ad plays, quartile beacons fire correctly
     (using Proxyme to intercept and verify the beacon requests)
  4. Skip button: appears after skipoffset, clicking it correctly ends the ad
  5. No-fill handling: when ad server returns empty VAST, New Tab shows default content
  
  WHY NIGHTWATCH (not Cypress/Playwright):
  Nightwatch was established in the Coc Coc codebase before my tenure.
  Cypress and Playwright were newer alternatives.
  "Proficient in Nightwatch E2E tests" = I worked with what existed, not what I would have chosen.
  (Acceptable to mention in interview: "We used Nightwatch; if starting fresh, I would evaluate Playwright.")
```

---

## 6️⃣ Additional Products — Search, Video, Mobile New Tab

```
SEARCH ENGINE FRONTEND:
  Contributing to the search results page (SERP) for the Coc Coc search engine.
  
  What this involves:
  - Result rendering: organic results, ads, featured snippets, knowledge panels
  - Performance: search results must appear in < 300ms from user perception
  - A/B testing: different result layouts, ranking signals
  - Localisation: Vietnamese language specifics (tone marks, search suggestions)
  
  The challenge of competing with Google:
  Google's SERP is the standard users compare against.
  Every decision (font size, spacing, result snippet length, color) is
  implicitly evaluated against Google.
  Building something users prefer over Google: a very high bar.

VIDEO SEARCH:
  A separate search surface for video content.
  Technical specifics: video thumbnail generation, playback preview on hover,
  video metadata rendering (duration, views, upload date, channel).
  
  Integration with VAST/VPAID: video search results may include ad placements.
  The same ad system built for the New Tab is used here.

MOBILE NEW TAB (iOS and Android):
  The Coc Coc browser exists on iOS and Android (in addition to desktop).
  The Mobile New Tab is a web surface embedded in the mobile browser.
  
  Technical challenges:
  - Touch events: different from mouse events. No hover. Different scroll behavior.
  - Viewport: different aspect ratios, safe areas (iPhone notch/dynamic island).
  - Performance: mobile hardware is constrained (especially mid-range Android).
    This is where the Web Worker caching was particularly important.
  - Web Workers on mobile: same API as desktop, but benefits are more pronounced
    (lower CPU, more contention on the main thread).
```

---

## STAR Scripts

### VAST/VPAID Ads System

```
SITUATION:
  Coc Coc New Tab had no video ad capability.
  The New Tab is the highest-traffic surface in the browser.
  Video ads are the highest-CPM (cost per thousand impressions) ad format.
  Building video ad capability on the New Tab = significant revenue opportunity.

TASK:
  Engineer the VAST/VPAID ads system from scratch.
  No existing code. Define the architecture. Build the parser, tracker, container.

ACTION:
  Built the VAST XML parser: handles InLine ads and Wrapper chain resolution (max 3 hops).
  Built the tracking beacon system: quartile events (start/25%/50%/75%/complete),
  fire-and-forget GET requests with fetch keepalive for reliability through page unload.
  Built the VPAID container: sandboxed iframe, postMessage API, event bridge.
  Built the ad lifecycle state machine: error states, no-fill, timeout handling.
  
  Test coverage: Jest unit tests for parser (7 test cases including wrapper chains,
  error cases, quartile accuracy), Nightwatch E2E with Proxyme intercepting VAST responses.

RESULT:
  Video ad system deployed to 30M users.
  New Tab became the primary ad surface for Coc Coc's monetisation.
  Test coverage prevented ad billing regressions in production.
```

### Web Worker Caching

```
SITUATION:
  Coc Coc New Tab loads on every new tab opening.
  High-priority user cohort: low-end Android devices (significant Vietnam market share).
  New Tab FCP: 800ms average on low-end Android. User expectation: < 500ms.

TASK:
  Improve New Tab performance for low-end Android users without compromising
  data freshness for time-sensitive content (news, weather).

ACTION:
  Designed and implemented a two-level Web Worker cache:
  L1: in-memory Map (sub-millisecond reads, lost on page reload).
  L2: IndexedDB (persistent, survives reload).
  Worker thread: handles all cache reads/writes off the main thread.
  Cache strategy: per-URL max-age (news: 30s, weather: 30min, shortcuts: 24h).
  postMessage communication protocol between main thread and worker.

RESULT:
  First Contentful Paint on low-end Android: 800ms → 420ms (-47%).
  Cache hit rate: ~85% after the first New Tab load.
  Main thread blocking from IDB operations: eliminated.
  Measured and monitored via Grafana dashboards with ClickhouseDB as data source.
```

---

## Follow-up Q&A

**"You mentioned VAST wrapper chains — what is a wrapper and why do they exist?"**
> "A VAST wrapper is an indirection. Instead of returning an ad directly, the ad server returns a response that says: 'I don't have an ad, but go ask this other ad server.' The browser follows that URL and gets another VAST response. That response might itself be a wrapper — pointing to yet another ad server. The chain can be several hops long. The reason wrappers exist: ad serving is a complex ecosystem with aggregators, exchanges, and demand-side platforms. The Coc Coc ad server might not have a suitable ad, so it passes the request to a partner exchange, which passes it to another exchange. Each hop is a wrapper. The browser follows the chain until it finds an InLine ad — one that actually contains a media file. The challenge: chains can be slow (each hop = a network round trip), can be circular (ad server A points to B, B points back to A), or can be infinite. The solution: max hops limit (VAST 3.0 recommends no more than 3-5), circular reference detection by tracking visited URLs, and a total timeout that trumps everything. If the chain takes more than 3 seconds, abort: no fill."

**"What is ClickhouseDB and why did you use it instead of a traditional database?"**
> "ClickhouseDB is an open-source columnar analytics database developed by Yandex. At Coc Coc — which has strong Russian engineering influence — it was a natural choice, as it is widely used in the Russian tech ecosystem. But beyond that, it is simply the right tool for the job. At 200M+ events per day, a row-based database like PostgreSQL becomes unusable for real-time analytics queries. A P99 latency aggregation over the last hour would take 5-10 seconds in PostgreSQL. In ClickhouseDB, it takes 50-100 milliseconds. The reason: columnar storage. A latency query only needs two columns out of eight. ClickhouseDB reads only those two columns. PostgreSQL reads all eight columns for every row. The reduction in I/O is substantial. For a Grafana dashboard that refreshes every 30 seconds, 50ms queries work perfectly. 5-second queries mean the dashboard is always 10 queries behind reality."

**"Why did you open-source Proxyme instead of keeping it internal?"**
> "Practically: the problem Proxyme solves is not specific to Coc Coc. The need for a programmatic HTTP proxy in a NodeJS test environment is universal — any team using Jest or Nightwatch with HTTP-dependent code has this problem. Making it open-source means: other developers can use and improve it, the quality bar is higher (public code gets more scrutiny), and it builds a reputation for thinking at the ecosystem level, not just the company level. There is also a personal learning aspect: maintaining open-source code teaches you to design APIs for people who have different contexts than you, to write documentation for strangers, and to handle issues and PRs from people with edge cases you did not anticipate. These are skills that make you a better engineer even for closed-source work."

**"How do you balance cache freshness with performance?"**
> "The key insight is that different data has different freshness requirements. The Coc Coc New Tab has several data types: news articles must be recent — a 30-second cache is acceptable. Weather data: 30 minutes is fine. User shortcuts (bookmarks-style): essentially static, 24 hours. The ad: never cached (you must request a fresh ad every time for billing accuracy). By assigning per-URL max-age values, I could optimize performance for each data type independently. The weather widget loads instantly from a 30-minute-old cache. The news feed shows results from 30 seconds ago — users don't notice. The ad always loads fresh. The Web Worker cache respects these per-URL policies through the maxAge parameter in the postMessage protocol. This is more sophisticated than a blanket 'cache everything for 5 minutes' approach, and it is why the cache hit rate could be ~85% while still meeting freshness requirements for time-sensitive content."

---

## 🔗 Unified Narrative

> "At Coc Coc, my work centred on performance and monetisation at scale. The New Tab page is the highest-traffic surface in any browser — 30 million users, opened multiple times per day. Any decision I made would affect hundreds of millions of page views.
>
> The VAST/VPAID ads system was the most impactful technical contribution. I built it from scratch: VAST XML parser with wrapper chain resolution, quartile tracking beacons with keepalive reliability, VPAID sandboxed container, and a full ad lifecycle state machine with error handling. This system became the primary monetisation vehicle for Coc Coc's New Tab. Getting it right mattered not just technically but commercially.
>
> The Web Worker caching system addressed the other dimension: user experience. The critical user segment in Vietnam is not desktop users with fast connections — it is users on mid-range Android phones. On those devices, even asynchronous IndexedDB reads cause main thread contention. Moving cache operations to a Web Worker removed that contention entirely. First Contentful Paint improved from 800ms to 420ms — nearly halved — for that user cohort.
>
> Proxyme came from the intersection of both concerns: how do you test the ad system reliably in CI without a live ad server? The answer was a programmatic proxy that intercepts VAST requests and substitutes controlled responses. I open-sourced it because the problem was general — any NodeJS testing environment with HTTP-dependent code has the same need.
>
> The Grafana + ClickhouseDB monitoring stack tied it together: instrumentation at scale (200M+ events/day) with queries fast enough for real-time dashboards. An alert firing 3 minutes after a performance regression — before any user complaint — is the difference between a 12-minute incident and a 2-hour one."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built an ad system" | "I **engineered VAST/VPAID from scratch**: VAST XML parser (wrapper chain resolution, max 3 hops, circular ref detection), quartile beacon tracker (fetch keepalive, fires-once guard), VPAID sandboxed iframe container (postMessage bridge). Ad lifecycle state machine: no-fill, timeout, error recovery." |
| "I used Web Workers for caching" | "**Two-level cache** in a Web Worker: L1 in-memory Map (sub-ms), L2 IndexedDB (persistent). **Why worker**: IDB reads take 50-200ms on low-end Android; on main thread = UI jank. In worker: main thread never blocks. FCP: **800ms → 420ms** (-47%) on low-end Android." |
| "I know ClickhouseDB" | "**Columnar vs row-based**: P99 latency query at 200M events/day — PostgreSQL: 5-10s. ClickhouseDB: 50ms. 100× faster because query reads only 2 columns out of 8. **Used with Grafana** for real-time alerting (P99 > 200ms fires PagerDuty within 3 minutes)." |
| "I made an open-source tool" | "**Proxyme**: NodeJS programmatic proxy. Use case: inject controlled VAST XML in Nightwatch E2E tests without a live ad server. Differs from Charles (GUI, not scriptable). Runs in CI. github.com/thienphanexcalibur/proxyme. Solves a universal problem in NodeJS HTTP testing." |
| "I wrote Jest tests" | "VAST parser: **7 test cases** including wrapper chain resolution, duplicate beacon guard (fires exactly once), no-fill scenarios, timeout handling. Revenue accuracy depends on parser correctness — unit tests catch billing regressions before production." |

---

## 📊 Quick Facts

```
Company: Coc Coc (Vietnamese-Russian browser company, 30M+ users in Vietnam)
Role:    Frontend Engineer

SCALE:
  Users:          30M registered
  New Tab views:  150M+ daily (30M × 5 tabs/day)
  Search events:  150M+ daily
  Ad events:      60M+ daily
  Total events:   200M+ events/day in ClickhouseDB

VAST/VPAID ADS:
  Built from scratch: parser, tracker, VPAID container, lifecycle state machine
  VAST: XML-based IAB standard. InLine + Wrapper chain resolution (max 3 hops)
  Tracking: quartile beacons (impression/start/25%/50%/75%/complete/click/skip)
  Reliability: fetch(url, { keepalive: true }) — fires through page unload
  VPAID: sandboxed iframe + postMessage bridge for interactive ad format
  Testing: Jest (parser unit tests) + Nightwatch E2E + Proxyme (HTTP interception)

WEB WORKERS:
  Architecture: two-level cache (L1 memory Map + L2 IndexedDB) in dedicated Worker
  Protocol: postMessage({ type: "GET", url, maxAge }) ↔ onmessage({ data, source })
  Strategy: per-URL max-age (news: 30s, weather: 30min, shortcuts: 24h, ads: never)
  Impact: FCP on low-end Android: 800ms → 420ms (-47%)
  Hit rate: ~85% after first New Tab load

MONITORING:
  Stack: ClickhouseDB (columnar) + Grafana
  Query performance: 200M events → P99 latency query in 50ms (vs PostgreSQL: 5-10s)
  Alert: P99 > 200ms for 5 minutes → Slack + PagerDuty
  Incident reduction: CDN regression detected in 3 minutes vs 1-2 hours

PROXYME:
  URL: github.com/thienphanexcalibur/proxyme
  Type: open-source NodeJS programmatic HTTP proxy
  API: proxy.intercept({ filter, onRequest, onResponse })
  Use case: VAST response injection in E2E tests, CI HTTP debugging

PRODUCTS:
  Search Engine Frontend: SERP for Coc Coc's own search engine
  Video Search: video result rendering with thumbnail/duration/channel
  New Tab (desktop + iOS + Android): high-traffic surface, primary ad placement
  Games SDK: auth/leaderboard/IAP/analytics/rewarded ads for browser games
```

---

*Document last updated: June 2026 · Coc Coc interview preparation*
