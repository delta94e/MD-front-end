# 📈 Interview Guide — Alpha Trading Web Platform
## Order Book · OTOCO Orders · Tokenised Securities · Lighthouse 65→82 · LCP −60%

---

## 🔑 Context: Why These Achievements Signal Senior Engineering

```
TRADING FEATURES signal:
  → Domain depth: you understand financial instruments, not just UI components.
  → Real-time complexity: WebSocket order book at 50 updates/second is a performance challenge.
  → Business logic correctness: an OTOCO validation bug = a trader loses money.
  → Nuanced product thinking: tokenised securities require explaining custody models and
    regulatory constraints — not just rendering a price.

PERFORMANCE SIGNAL:
  → Data-driven diagnosis: you found the render-blocking resources with tools, not guessing.
  → Concrete impact: 65→82 Lighthouse, LCP −60% are measurable, verifiable outcomes.
  → Trade-off thinking: "Why not 90+?" shows you understand that performance has limits
    given the product's real-time requirements.
```

---

## 1️⃣ Order Book — Real-Time Bid/Ask Depth

### Technical Depth

```
WHAT AN ORDER BOOK IS:

A real-time list of all open buy and sell orders at every price level for a trading pair.

ASKS (red):  sell orders. Someone willing to sell BTC at $45,008.
  Lowest ask: at the top (closest to the mid price). Highest ask: at the bottom.
BIDS (green): buy orders. Someone willing to buy BTC at $44,992.
  Highest bid: at the top (closest to mid). Lowest bid: at the bottom.
SPREAD: gap between lowest ask and highest bid.
  Tight spread (e.g., $16): liquid market. Large spread (e.g., $500): illiquid.
  Spread: one of the key metrics traders use to assess market quality.
DEPTH BARS: horizontal bars showing cumulative volume at each level.
  The width: proportional to the total quantity from that level to the top/bottom.
  A fat bar at the $44,980 bid level: many buyers defending that price.
  Traders: use depth bars to identify support and resistance levels.

WHY IT'S HARD TO BUILD:

1. DATA FREQUENCY.
   A liquid market: order book updates 10-50 times per second.
   50 renders/second × React reconciliation × 20 rows: performance disaster.
   Without optimisation: the browser maxes out the CPU on the order book alone.

2. FLICKER.
   Naive re-render: every row flickers on every update.
   Traders: cannot read the book if it flickers constantly.
   Fix: React.memo on each row. Only re-render rows with changed data.
   Key: stable (price level as key, not index). Prevents unnecessary re-mounts.

3. FLASH ANIMATION.
   Traders need visual feedback when a price level changes.
   Standard pattern: green flash on price increase, red flash on decrease.
   CSS: background transitions from the flash color back to transparent over 300ms.
   Without this: traders don't know which levels changed.

WEBSOCKET DESIGN:

Snapshot + Diff protocol (standard exchange protocol):
  1. Initial message: SNAPSHOT of the full book (all levels).
  2. Subsequent messages: DIFFS (only changed price levels).
     { bids: [[45000, 1.5]], asks: [[45012, 0]] }
     A quantity of 0: remove that price level from the book.
  Why diff: minimal data over the wire. Only changes transmitted.

Local state: maintained in a Map<price, qty> for O(1) updates.
  On each diff: update Map entries. Reconstruct the sorted level list.
  Map update: O(1). Array sort: O(n log n). For 20 levels: negligible.
  BUT: the Map mutability pattern means useRef, not useState.
  Mutation without triggering React re-render. Then force render at 60fps via requestAnimationFrame.

DEPTH BAR CALCULATION:
  Cumulative volume at each level:
    Level 1 ask: 0.5 BTC total
    Level 2 ask: 0.5 + 0.8 = 1.3 BTC cumulative
    Level 3 ask: 1.3 + 0.3 = 1.6 BTC cumulative
  Bar width = (level.total / max_total_across_all_levels) * 100%
  CSS: width: {pct}%; transition: width 0.15s; background: rgba(239, 68, 68, 0.1);
  Smooth transitions: bars flow instead of jumping.

SPREAD CALCULATION:
  spread = lowest_ask.price - highest_bid.price
  spread_pct = (spread / last_price) * 100
  Display: "$16.00 (0.036%)"
  Color: green if tight, yellow if moderate, red if wide.
```

---

## 2️⃣ OTOCO Orders — One-Triggers-One-Cancels-Other

### Technical Depth

```
WHAT IS OTOCO:

A compound order type consisting of 3 linked orders:
  1. PRIMARY ORDER:  the entry order. Buy 0.1 BTC at $45,000 (limit).
  2. TAKE-PROFIT:    sell 0.1 BTC at $47,500 (target price).
  3. STOP-LOSS:      sell 0.1 BTC at $43,500 (protection price).

EXECUTION LOGIC:
  Step 1: primary order submitted. Waits to fill.
  Step 2: primary order fills (at $44,987, per price improvement).
          → Both TP and SL orders ACTIVATE simultaneously.
  Step 3a (TP scenario): price rises to $47,500. TP fills.
          → SL order AUTOMATICALLY CANCELLED.
          → Position closed at +$250 profit.
  Step 3b (SL scenario): price falls to $43,500. SL triggers.
          → TP order AUTOMATICALLY CANCELLED.
          → Position closed at −$150 (loss capped).

WHY TRADERS NEED OTOCO:
  Crypto markets: 24/7. A trader cannot watch the screen while sleeping.
  Without OTOCO: buy BTC, set a mental target and stop, hope you wake up in time.
  If the price crashes at 3am: no protection. Full loss.
  With OTOCO: the exchange enforces the TP and SL automatically.
  Position: always protected. No manual monitoring required.

THE VALIDATION CHALLENGE (where most engineers miss):

OTOCO has hard business logic rules. Incorrect values: the wrong leg fires immediately.

For a BUY OTOCO:
  TP price MUST be ABOVE entry price. (Taking profit above where you bought.)
  SL price MUST be BELOW entry price. (Protecting against price falling.)

  ❌ Wrong: Buy at $45,000, TP at $43,000, SL at $47,000.
     The "SL" at $47,000 is above the entry. It would fill immediately as a sell.
     The "TP" at $43,000 is below the entry. It would fill on any small dip.

For a SELL OTOCO (short position):
  TP MUST be BELOW entry price. (Price falling = profit for a short.)
  SL MUST be ABOVE entry price. (Protection against price rising against you.)

Frontend validation:
  const validateOtoco = (order: OtocoOrder): string | null => {
    if (order.primarySide === "buy") {
      if (order.tpPrice <= order.primaryPrice) return "TP must be above entry";
      if (order.slPrice >= order.primaryPrice) return "SL must be below entry";
    } else {
      if (order.tpPrice >= order.primaryPrice) return "TP must be below entry";
      if (order.slPrice <= order.primaryPrice) return "SL must be above entry";
    }
    return null;
  };

Validation runs on every input change. Instant feedback.
Cannot submit if validation fails. The API also validates: defense in depth.

THE STATE MACHINE:

PENDING:    primary submitted. Awaiting fill.
TRIGGERED:  primary filled. TP + SL now active. Show live price vs TP/SL.
TP_FILLED:  take-profit filled. SL cancelled. P&L: positive.
SL_FILLED:  stop-loss filled. TP cancelled. P&L: negative but capped.
CANCELLED:  primary cancelled before fill. TP + SL never activated.

UI COMPLEXITY:
  PENDING:    show the 3-leg form. "Awaiting fill."
  TRIGGERED:  disable editing. Show live market price vs TP and SL distances.
              "TP: $47,500 (+5.6% remaining)" / "SL: $43,500 (−2.2% remaining)".
  TP_FILLED:  green P&L card. "Position closed. Profit: +$250."
  SL_FILLED:  red P&L card. "Position closed. Loss capped at −$150."

The UI for each state: completely different. One state machine drives all of it.

REAL-TIME P&L PREVIEW:
  As users type TP and SL prices: show estimated outcomes in real time.
  estimatedProfit = (tpPrice - primaryPrice) × qty
  estimatedLoss   = (primaryPrice - slPrice) × qty
  risk/reward ratio = estimatedProfit / estimatedLoss
  These: update live. Helps traders calibrate their risk before placing.

API CONTRACT:
  POST /orders/otoco
  {
    primary: { side: "buy", type: "limit", price: 45000, qty: 0.1, symbol: "BTC/USDT" },
    tpOrder: { side: "sell", type: "limit", price: 47500 },
    slOrder: { side: "sell", type: "stop",  price: 43500 }
  }
  The exchange: atomically creates all 3 orders, linked by a parent orderId.
  Frontend: subscribes to order status updates via WebSocket.
  On state transition message: update local state machine → UI updates.
```

---

## 3️⃣ Tokenised Securities Trading

### Technical Depth

```
WHAT TOKENISED SECURITIES ARE:

Traditional stock (TSLA on NASDAQ):
  - Listed on regulated exchange (NASDAQ)
  - Market hours: 9:30 AM - 4:00 PM ET weekdays only
  - Settlement: T+2 (you legally own it 2 business days after purchase)
  - Minimum: 1 share (~$247)
  - Price feed: direct exchange data (NASDAQ market data)

Tokenised stock (TSLA.T on Alpha Trading):
  - A blockchain token (on Ethereum) representing 1 TSLA share
  - Underlying share: held by a licensed custodian (Prime Trust, Paxos)
  - Trading: 24/7, 365 days (crypto market hours)
  - Settlement: T+0 (instant — the token transfer is the settlement)
  - Fractional: can buy 0.001 TSLA tokens (fractional ownership)
  - Price feed: oracle-based (Chainlink aggregates from multiple sources)

THE CUSTODY MODEL (what you should be able to explain):
  1. User buys 1 TSLA.T token.
  2. Alpha Trading's custodian (Prime Trust): purchases 1 TSLA share.
  3. Prime Trust: issues 1 TSLA.T token to user's wallet. 1:1 backed.
  4. User: holds the token. Prime Trust: holds the underlying in custody.
  5. User redeems: Prime Trust sells TSLA share, returns proceeds.
  
  The token is backed 1:1 by the underlying. It is NOT a derivative.
  The user's claim: on a real share, held by a regulated custodian.

WHY THIS MATTERS FOR FRONTEND COMPLEXITY:

1. TWO PRICE FEEDS — showing both clearly:
   Token price:      from the on-chain oracle (updates every ~30 seconds)
   Underlying price: from the exchange data feed (real-time)
   Premium/discount: (tokenPrice - underlyingPrice) / underlyingPrice
   
   The UI: shows both prices. And the premium.
   "TSLA.T: $247.12 | Underlying: $247.08 | Premium: +0.02%"
   
   A 0.02% premium: normal (liquidity cost). If the premium is 5%: something is wrong.
   Traders: use the premium to decide whether to trade the token or the underlying.

2. ORACLE VS EXCHANGE LATENCY:
   Exchange feed: real-time (millisecond latency)
   Oracle feed: 30-second update frequency
   The UI: must indicate data freshness. "Price as of 14 seconds ago."
   Without this: a trader might think the token price is real-time and make a decision
   on stale data. This is a financial risk.

3. SETTLEMENT DISPLAY:
   T+0 is the key competitive advantage over traditional brokers.
   The UI: prominently shows "Settlement: T+0" on the order ticket.
   Below it: a tooltip explaining what T+0 means vs the T+2 they know from traditional brokers.
   Users who understand T+0: make better decisions and appreciate the platform more.

4. REGULATORY JURISDICTION CHECK:
   Tokenised securities: NOT available in all jurisdictions.
   Some countries: classify them as securities requiring broker registration.
   Others: classify them as unregulated crypto assets.
   
   Frontend: checks on load:
     1. IP geolocation → map to jurisdiction
     2. User's KYC jurisdiction from JWT
     3. If jurisdiction is restricted: hide order entry. Show "Not available in your region."
   
   This is NOT just a backend check. The frontend hides the entire order entry UI.
   Users in restricted regions: never see a form they can't use. Clean UX.

5. ORDER ROUTING (invisible to user, important to understand):
   Traditional stock order: routed to the exchange's matching engine.
   Tokenised stock order: routed to Alpha Trading's internal liquidity pool.
   If the pool lacks liquidity: market maker steps in. User never sees this.
   
   The frontend: shows buy/sell like any other order. Routing: backend concern.
   BUT: error messages must be meaningful.
     "Insufficient liquidity — try again or reduce order size."
     NOT: "Error 503."
   This requires mapping backend liquidity errors to user-friendly messages.
```

---

## 4️⃣ Performance — Lighthouse 65 → 82, LCP −60%

### Technical Depth

```
WHAT LIGHTHOUSE MEASURES (and which levers matter):

Performance score = composite of 6 metrics:
  FCP (First Contentful Paint):   10% weight
  LCP (Largest Contentful Paint): 25% weight  ← biggest impact
  TBT (Total Blocking Time):      30% weight  ← biggest impact
  CLS (Cumulative Layout Shift):  15% weight
  Speed Index:                    10% weight
  TTI (Time to Interactive):      10% weight

LCP + TBT = 55% of the score. Optimising these: biggest return.

STARTING SCORE: 65 — WHY IT WAS THAT LOW:

Lighthouse: "Eliminate render-blocking resources" was the primary warning.
6 render-blocking resources: identified with Chrome DevTools Performance panel.

  analytics-suite.js:  180KB. Synchronous. 820ms blocking. NOT IN USE.
  styles-full.css:     340KB. Render-blocking. Only 8KB needed above-fold.
  trading-chart-lib:   240KB. Loaded for all users. Only used when chart visible.
  intercom-widget.js:   98KB. Customer support widget. Not needed on initial load.
  google-fonts-embed:   28KB. Loading via @import in CSS — 2 extra round trips.
  i18n-all-locales:    120KB. ALL 12 language files. Most users: 1 language.

Total blocking time: ~3,800ms. That's nearly 4 seconds where nothing renders.

STEP 1: REMOVE UNUSED SCRIPTS (biggest single win)

analytics-suite.js: from a previous analytics vendor. Contract ended.
The script: still in the HTML. Synchronous (no defer, no async).
Browser: downloads and executes the ENTIRE script before rendering anything.
At 820ms blocking: the single highest-impact resource.

Discovered with webpack-bundle-analyzer: showed the script in the bundle.
Cross-referenced with the network requests: 0 requests from this script in 30 days.
Decision: remove completely.

Two other unused tracking scripts: also removed (98KB combined).
Total eliminated: ~280KB. TBT reduction: ~1,200ms.

STEP 2: CRITICAL CSS INLINING

Full stylesheet: 340KB. Render-blocking (browser waits for it before rendering).
Above-fold audit: only 8KB of CSS needed for the initial viewport.
  (The order book, the price ticker, the navigation — these are above-fold.)
  (The trading chart, the order history, the settings panel — these are below-fold.)

Fix:
  <style>/* 8KB: header, hero, price ticker, navigation */</style>
  <link rel="stylesheet" href="styles.css"
        media="print"
        onload="this.media='all'">

The "media=print" trick: browser fetches the stylesheet but doesn't block rendering.
After load: media changes to "all" → styles applied.
From the user's perspective: styles appear before the full stylesheet is parsed.
LCP impact: −680ms (CSS was blocking the LCP element from rendering).

STEP 3: CODE SPLITTING — CHART LIBRARY

trading-chart-lib.js: 240KB. Used ONLY for the TradingView chart component.
The chart: 400px below the fold. Not visible on initial load.
Before: this 240KB was in the main bundle. Parsed before anything rendered.

Fix:
  const TradingChart = React.lazy(() =>
    import("./components/TradingChart")
  );
  // TradingChart.tsx imports the chart library — so the library
  // is code-split into its own chunk. Only downloaded when TradingChart renders.
  
  IntersectionObserver on the chart container:
    triggers the lazy load when the container is 200px from viewport.
    So by the time the user scrolls to the chart: it's already loaded.
  
Initial bundle: −240KB. JS parsing time: significantly reduced.
TBT reduction: −940ms (JS parsing is single-threaded; less JS = less blocking).

STEP 4: PRELOAD + PRECONNECT

The LCP element: the live price ticker component.
  It required: Inter font (via Google Fonts) + the price ticker CSS.
  Before: browser discovered the font AFTER:
    HTML parse → CSS parse → @font-face rule → font fetch
    3 steps. ~400ms before the font download starts.

Fix:
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        crossorigin>

"preconnect": establishes TCP + TLS connection early. Saves ~150ms per domain.
"preload" for the font: browser fetches during HTML parse. Zero wait.
LCP impact: −310ms. The price ticker: renders with the correct font immediately.

Also added "preconnect" for:
  - The order book WebSocket endpoint (conn established before the JS runs)
  - The CDN serving trading chart images
  - The Stripe SDK domain (for deposit/withdrawal flows)

STEP 5: FONT OPTIMIZATION + font-display: swap

Without font-display: swap: browser shows NOTHING (FOIT — Flash of Invisible Text).
User sees blank text until the font loads. The price ticker: invisible during load.
The price ticker IS the LCP element. Invisible = LCP delayed.

With font-display: swap:
  Browser: renders text in system font immediately.
  When Inter loads: swaps in.
  LCP: recorded when the text first becomes visible (system font render). NOT when Inter loads.
  LCP: improved because the element is visible earlier.

STEP 6: LAZY LOAD BELOW-FOLD CONTENT

Order history table: 200 rows of data. Below the fold.
Before: loaded eagerly on page load. JavaScript executing. DOM nodes created.
After: IntersectionObserver + React.lazy.
  Only loaded when the user scrolls to within 100px of the table.
  Initial load: completely unaffected by the table.
  LCP delta: small (−110ms) but reduces initial JS work.

TOTAL RESULTS:
  LCP:            4.8s → 1.9s (−60%)
  TBT:            3800ms → 420ms (−89%)
  FCP:            3.1s → 1.2s (−61%)
  CLS:            0.12 → 0.04 (Good threshold: < 0.1)
  Lighthouse:     65 → 82
  
WHY 82 AND NOT 90+:
  The order book: a WebSocket that starts on page load. JavaScript execution on load.
  The trading chart: even lazy-loaded, its initialisation takes ~120ms of main thread.
  These: inherent to the product requirements. Cannot be eliminated.
  "Performance is a trade-off. 82 on a page with a real-time order book
   (WebSocket + 50 renders/second) and a TradingView chart: actually excellent.
   90+ would require removing the product features. That's not an option."
```

---

## STAR Scripts

### Lighthouse Performance Improvement

```
SITUATION:
The Alpha Trading web platform had a Lighthouse performance score of 65
and LCP of 4.8 seconds. At these speeds: ~32% of users leave before
the page loads (Google research). For a trading platform: slow load = missed trades.

TASK:
Diagnose and fix the performance issues to improve Lighthouse score
and reduce LCP. Without degrading the product's real-time features.

ACTION:
Profiled with Chrome DevTools Performance panel: identified main thread blocking.
Ran webpack-bundle-analyzer: found render-blocking resources in the critical path.
Found 3 unused analytics scripts (280KB combined): removed entirely.
Inline critical CSS (8KB): 340KB stylesheet no longer render-blocking.
Code split the trading chart library (240KB): lazy loaded via IntersectionObserver.
Preloaded Inter font + preconnect to 3 external domains.
Applied font-display: swap: price ticker (the LCP element) renders immediately in system font.
Lazy loaded the order history table via IntersectionObserver.

RESULT:
LCP: 4.8s → 1.9s (−60%).
TBT: 3,800ms → 420ms (−89%).
Lighthouse score: 65 → 82 (+17 points).
The score plateaued at 82 — inherent to the product's real-time WebSocket and
chart library. A data-driven decision to stop: further gains would require removing
product features.
```

### OTOCO Order Type

```
SITUATION:
Traders on Alpha Trading requested OTOCO (One-Triggers-One-Cancels-Other) orders.
Crypto markets are 24/7. Without OTOCO: traders had to manually place TP and SL
after their primary order filled — impossible while sleeping or travelling.

TASK:
Build the OTOCO order entry form with real-time validation and a state machine
to reflect the 5 possible states of a compound order.

ACTION:
Designed the 3-leg form: primary order (trigger) with take-profit and stop-loss legs.
Implemented real-time validation: TP must be above entry for buys (below for shorts),
SL must be below entry for buys (above for shorts). Validation: runs on every input change.
Showed real-time P&L preview as users type TP/SL prices.
Built the state machine: PENDING → TRIGGERED → TP_FILLED or SL_FILLED.
UI: completely different for each state (form view / active monitoring view / closed position view).
WebSocket order status updates: drive state transitions.
Integrated with the order book: when in TRIGGERED state, show live distance to TP and SL.

RESULT:
OTOCO orders: live in production. Used by the majority of active traders on the platform.
Zero validation-related order errors post-launch (the correct TP/SL relationship enforced).
Trader feedback: "I can finally sleep without worrying about my positions."
```

---

## Follow-up Q&A

**"How does an order book work technically?"**
> "An order book is a live list of all open buy and sell orders at every price level. The exchange sends updates via WebSocket using a snapshot-plus-diff protocol: you get the full book initially, then only the changed price levels with each update. Locally, I maintain a Map of price to quantity for O(1) updates. The challenge is performance — in a liquid market, the book updates 10-50 times per second. Without optimization, React reconciliation maxes out the CPU. The fix: React.memo on each row, stable keys (price level, not array index), and batching DOM updates with requestAnimationFrame."

**"What's the hardest part of building OTOCO orders?"**
> "Validation. Most engineers think of OTOCO as a UI problem — 'just show three inputs.' But the business logic is subtle. For a buy OTOCO, the take-profit MUST be above the entry price and the stop-loss MUST be below. If they're reversed — say TP at $43,000 and SL at $47,000 on a buy at $45,000 — the SL would fire immediately as the price is already above it, locking in an instant loss. The same validation inverts for a sell/short. I implemented this as real-time validation running on every input change, with clear user-facing error messages explaining WHY the prices are invalid. The second hard part is the state machine — the OTOCO order has 5 states (pending, triggered, TP filled, SL filled, cancelled) and the UI is completely different for each one."

**"How did you diagnose the Lighthouse score being 65?"**
> "I used Chrome DevTools Performance panel to record a page load and look at the main thread timeline. I could see where rendering was blocked — long grey bars on the main thread before the first paint. Then I used webpack-bundle-analyzer to generate a treemap of the bundle. That's where I found three analytics scripts totaling 280KB that weren't sending any requests — they were from a previous vendor contract that had ended but nobody had removed them from the HTML. Each was loaded synchronously, blocking the browser from rendering for 820ms combined. That single fix — removing unused scripts — was the biggest win. The rest: critical CSS inlining, code splitting the chart library, and preloading the font."

**"Why did the score stop at 82?"**
> "Two inherent constraints of the product. The order book: a WebSocket that connects on page load and renders at up to 50 times per second. That JavaScript execution contributes to Total Blocking Time. And the trading chart library: even lazy-loaded, its initialization takes about 120ms of main thread when the user scrolls to it. Both are core to the trading platform. Removing them would make the score 95+ but break the product. 82 is the practical ceiling given what the page needs to do. I documented this explicitly — 'here's why 82 is the right target, and here's what it would cost to go higher.'"

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built an order book" | "**Real-time order book**: WebSocket snapshot+diff protocol, local Map<price,qty> for O(1) updates, React.memo on rows (prevents re-render for unchanged levels), requestAnimationFrame batching for 60fps at 50 updates/second. CSS flash animation (green/red 300ms transition) for price change direction. Depth bars: cumulative volume visualization with smooth CSS width transitions." |
| "I implemented OTOCO" | "**OTOCO state machine** with hard validation: TP must be above entry for buys (inverted for shorts) — enforced on every keystroke with clear error messaging. 5 states (pending→triggered→TP_filled/SL_filled/cancelled). UI completely different per state (form view / live monitoring with distance-to-TP/SL / closed position P&L card). Real-time P&L preview: (tpPrice − entry) × qty = estimated profit, updated live as user types." |
| "I worked on tokenised securities" | "**Tokenised securities frontend complexity**: dual price feeds (oracle at 30s frequency vs underlying exchange feed + premium display), data freshness indicator (oracle lag), T+0 settlement display as key competitive differentiator vs T+2 traditional brokers, jurisdiction gate (IP + KYC from JWT → hides order entry in restricted regions), custody model explanation modal. Order routing: internal liquidity pool, not the exchange — error messages surface liquidity errors meaningfully." |
| "I improved performance" | "**Data-driven Lighthouse 65→82 (+17pts), LCP 4.8s→1.9s (−60%)**. Diagnosed with DevTools Performance panel + webpack-bundle-analyzer. Found 3 unused analytics scripts (280KB, 820ms blocking) → removed. Critical CSS inline (8KB vs 340KB blocking). Chart library (240KB) → lazy loaded via React.lazy + IntersectionObserver. Preload Inter font + preconnect for 3 CDN domains. font-display:swap for LCP element. Score plateaued at 82 — data-driven decision: further gains would require removing real-time WebSocket features." |

---

## 📊 Quick Facts

```
ACHIEVEMENT 1: ORDER BOOK
  Protocol: WebSocket, snapshot+diff
  Data structure: Map<price, qty> — O(1) updates
  Performance: React.memo on rows, stable keys, requestAnimationFrame
  Flash animation: 300ms CSS transition per changed level
  Spread: (lowest_ask − highest_bid) displayed with %
  Depth bars: cumulative volume, CSS width transition 0.15s

ACHIEVEMENT 2: OTOCO ORDERS
  Full name: One-Triggers-One-Cancels-Other
  Legs: Primary (trigger) + Take-Profit + Stop-Loss
  Validation: TP above entry (buys) / TP below entry (shorts). SL opposite.
  State machine: pending → triggered → TP_filled / SL_filled / cancelled
  P&L preview: (tpPrice − primary) × qty, live as user types
  Risk/reward ratio: displayed to help traders calibrate
  API: POST /orders/otoco with all 3 legs atomically

ACHIEVEMENT 3: TOKENISED SECURITIES
  What: blockchain token backed 1:1 by real underlying asset (held by custodian)
  Settlement: T+0 (token transfer) vs T+2 (traditional stocks)
  Price feed: oracle (Chainlink, ~30s) + underlying exchange feed (real-time)
  Premium displayed: (tokenPrice − underlyingPrice) / underlyingPrice
  Jurisdiction check: IP geolocation + KYC jurisdiction from JWT
  24/7 trading: crypto market hours, not exchange hours

ACHIEVEMENT 4: LIGHTHOUSE 65→82
  LCP: 4.8s → 1.9s (−60%)
  TBT: 3,800ms → 420ms (−89%)
  Main fix: 3 unused analytics scripts removed (280KB, ~1,200ms TBT reduction)
  Critical CSS: 340KB → 8KB inline + async rest (−680ms LCP)
  Code splitting: chart library (240KB) lazy loaded (−940ms TBT)
  Preload: Inter font + preconnect for 3 domains (−310ms LCP)
  font-display: swap: LCP element visible immediately in system font
  Ceiling: 82 — WebSocket + chart library are inherent to product. Data-driven stop.
```

---

*Document last updated: June 2026 · Alpha Trading — Order Book · OTOCO · Tokenised Securities · Performance*
