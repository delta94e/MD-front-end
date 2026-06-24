# 🦅 Interview Guide — Shopee | SeaMoney Digital Bank
## State Architecture · CV Asset Pipeline · CLS Elimination · Credit Card Delivery

---

## 🔑 Context: What SeaMoney Is

```
SEAMONEY: Shopee's digital financial services arm.
Products: digital wallet, credit card, buy-now-pay-later (SPayLater), insurance.
Market: Singapore, Indonesia, Thailand, Vietnam, Philippines, Malaysia.
Scale: millions of active users across SEA. High-stakes fintech context.

MY ROLE:
"I build and maintain core features for Android and iOS using React Native and TypeScript.
Beyond product delivery, I proactively identify improvements that meaningfully upgrade
both UX and developer workflows."

This framing is key: NOT just "I implement features."
It's "I see problems that affect users or developers, and I fix them without being asked."

The two categories:
USER-FACING: CLS elimination (mis-tap prevention), homepage stability (100K users).
DEVELOPER-FACING: CV asset pipeline (30+ engineers, daily use), state architecture.
Both matter to a senior hiring manager. Pure feature work is expected. Proactive improvement is rare.
```

---

## 1️⃣ Homepage State Calls: 600 → 60

### Zustand + MMKV Persistent Architecture · ~100K Users Impacted

---

```
WHAT "STATE CALLS" ARE:
  
  The homepage has 7 sections:
  - Wallet Balance
  - Promotions Carousel
  - Credit Card Widget
  - Transaction History
  - Quick Actions Grid (Transfer, Pay, Top Up, QR)
  - Offers & Rewards
  - Nearby Merchants
  
  Each section: a separate React component.
  Each component: on mount, fires API calls to fetch its data.
  
  Before the fix: every component was entirely self-contained.
  WalletCard mounted → called walletAPI.getBalance(), walletAPI.getCards(), walletAPI.getLimit(), ...
  PromoCarousel mounted → called promoAPI.getActive(), promoAPI.getPersonalized(), ...
  
  7 sections × ~85 API calls each = ~600 calls on every homepage load.
  Every time the user navigated back to the home screen: another 600 calls.
  Every time the app was foregrounded: another 600 calls.

THE OXYGENOS PROBLEM (why this hurt users):
  
  Android is not one OS. It's one kernel with dozens of manufacturer skins:
  - OxygenOS: OnePlus
  - ColorOS: Oppo
  - MIUI: Xiaomi
  - Funtouch OS: Vivo
  - One UI: Samsung (most permissive)
  
  OxygenOS and ColorOS are known for AGGRESSIVE MEMORY MANAGEMENT.
  They kill background processes aggressively to reclaim RAM.
  
  What happens when 600 API calls fire simultaneously on a 3GB OnePlus phone:
  1. Each API call: allocates a network request object, a response buffer, a JSON parser.
  2. 600 × each: significant memory allocation on the JavaScript heap.
  3. OxygenOS memory manager: detects high memory pressure.
  4. Kills background JS processes. Not the visible foreground. Background threads.
  5. Result: 3-4 API calls resolve, 3-4 are killed mid-flight.
  6. Components that depended on killed calls: never receive data.
  7. Those components: remain in loading state indefinitely. Or render empty.
  
  From the user's perspective:
  - Wallet balance: blank
  - Quick Actions: blank
  - Transaction History: infinite spinner
  - The Promotions Carousel: works (got lucky, fired first)
  
  ~100,000 users on mid-range OnePlus/Oppo devices: experienced this daily.
  These are mainstream devices in the SEA market (Indonesia, Vietnam, Thailand).
  Not edge cases. Not 0.1% of users. 100K daily affected.
  
  How I identified this:
  NOT: a bug report said "homepage broken."
  YES: I analyzed Sentry crash reports + Datadog network traces.
  Pattern: on OxygenOS/ColorOS devices, specific sections consistently showed
  "No data received" errors at much higher rates than other OS versions.
  Correlated with: device memory < 4GB AND network request count > 400 concurrent.
  The intersection: a specific problem class. I built the solution for it.

THE SOLUTION: PERSISTENT ZUSTAND + MMKV
  
  CORE INSIGHT:
  The homepage doesn't NEED fresh data on every render.
  The wallet balance from 45 seconds ago is still accurate (balance doesn't change 10×/second).
  Promotions from 3 minutes ago are still valid.
  Quick Actions layout never changes (it's configuration, not dynamic data).
  
  If we serve CACHED data: the homepage renders instantly with zero API calls.
  Then we check staleness in the background.
  Only stale sections make API calls (and they do so one at a time, not 600 simultaneously).
  
  WHY MMKV (NOT ASYNCSTORAGE):
  
  AsyncStorage (React Native built-in):
  - JavaScript thread (shares CPU with React renders)
  - Asynchronous: returns a Promise
  - Read speed: ~10ms per item
  - Cannot be read before the first render (async Promise must resolve first)
  
  MMKV (react-native-mmkv):
  - Native C++ implementation (separate from JS thread)
  - SYNCHRONOUS reads: no async/await, returns immediately
  - Read speed: ~0.1ms per item (100× faster than AsyncStorage)
  - Can be read synchronously in Zustand's persist middleware BEFORE the first render
  
  The MMKV advantage for this use case:
  Zustand's persist middleware calls getItem() to hydrate the store.
  With AsyncStorage: getItem() is async. Zustand must wait. First render: empty store.
  With MMKV: getItem() is sync. Zustand hydrates BEFORE React renders.
  First render: store already populated with cached data.
  Homepage: renders with real content immediately. Zero blank state.
  Zero API calls needed for the first render.

TTL STALENESS STRATEGY (per section):
  
  Different sections have different freshness requirements:
  
  walletStore:          TTL = 30 seconds  (balance must be recent: recent transactions change it)
  promoStore:           TTL = 300 seconds (promotions change every 5 minutes at most)
  cardStore:            TTL = 60 seconds  (card limit changes per transaction)
  transactionStore:     TTL = 15 seconds  (user wants to see recent transactions)
  quickActionsStore:    TTL = 3600 seconds (button layout is configuration, rarely changes)
  offersStore:          TTL = 300 seconds (offers are marketing, not time-critical)
  nearbyMerchantsStore: TTL = 120 seconds (location-based, changes if user moves)
  
  On app launch:
  1. MMKV provides all 7 sections' cached data synchronously.
  2. Zustand hydrates. React renders the homepage with cached data.
  3. AFTER render (non-blocking): each section checks isStale(lastFetched, TTL).
  4. Stale sections: ONE API call each. Update store. Component re-renders (diff-based, efficient).
  5. Fresh sections: zero API calls.
  
  Result:
  Typical morning launch: wallet stale (>30s since background), promos fresh, card stale.
  Total API calls: ~3-4 sections × ~15 calls each = 45-60 calls.
  600 → 60 (−90%).
  
  OxygenOS memory manager: 60 calls is far below the threshold for process killing.
  Homepage: always complete. 100% of 100K users affected: no longer experience the bug.

IMPLEMENTATION NOTES:
  
  The fetchIfStale pattern:
  Each store exposes: fetchIfStale() → async function.
  Each component: calls fetchIfStale() in useEffect (runs AFTER render).
  
  The key: useEffect (or useLayoutEffect for layout concerns) runs AFTER paint.
  The user sees the cached content.
  Background fetch starts.
  When data arrives: React updates only the changed parts (diff).
  User experience: instant content → subtle refresh when stale data updates.
  No blank state. No loading spinner on normal loads (only on very first launch, ever).
  
  First launch (no cache):
  Cache miss: store has no data. Component shows a skeleton.
  API call fires: receives data. Store updates. Skeleton replaced with real content.
  MMKV persists the data for next launch.
  Next launch: cache hit. No skeleton.
```

---

## 2️⃣ Computer Vision Asset Pipeline

### 30+ Engineers Daily · Zero Image Collisions · −7% App Size

---

```
THE PROBLEM CONTEXT:
  React Native app: hundreds of image assets (icons, banners, illustrations).
  30+ frontend engineers: adding new assets regularly.
  No governance: anyone can add any image file with any name.
  
  This creates two classes of problems:

PROBLEM CLASS 1: IMAGE COLLISION (correctness bug)
  
  Scenario:
  Engineer A (Platform team): adds "ic_share.png" to the assets folder.
  The icon: 32×32, orange Shopee-branded share icon.
  12 screens now use this icon.
  
  3 weeks later.
  Engineer B (Promotions team): adds "ic_share.png" to the same assets folder.
  Their icon: 28×28, generic blue share icon (different style entirely).
  Git: Engineer B's PR merges. Their "ic_share.png" overwrites Engineer A's.
  
  Result: 12 screens now show the wrong (blue, generic) share icon.
  Nobody notices until a user reports "the share button looks different."
  By then: it's in production. Requires a hotfix deployment.
  
  This is a real risk in a large team. It happened before the pipeline was built.
  
PROBLEM CLASS 2: DUPLICATE STORAGE (bloat)
  
  Scenario:
  Engineer C adds "share_button.png" to the assets folder.
  This image: visually identical to "ic_share.png" but differently cropped and resized.
  Different filename → Git treats it as a new file.
  Both files exist in the repository: same visual content, double the storage.
  
  Over 2 years: 300+ such duplicates or near-duplicates accumulated.
  Pre-pipeline app bundle: inflated by approximately 7%.
  A 7% larger app = slower downloads = more abandon during installation.
  In the SEA market: where users are on 3G/4G with data caps, app size matters significantly.

THE SOLUTION: COMPUTER VISION ASSET PIPELINE
  
  Implemented as a Git pre-commit hook. Engineers cannot bypass it.
  When a new image file is staged for commit: the pipeline runs automatically.
  
  STEP 1: PERCEPTUAL HASH (pHash)
  
  Why NOT a cryptographic hash (SHA-256)?
  SHA-256 produces a completely different hash if even ONE PIXEL changes.
  A 1-pixel crop: different SHA-256. Different compression level: different SHA-256.
  Two visually identical images: could have completely different SHA-256 hashes.
  Cryptographic hashes: designed for exact byte-level equality. Not visual similarity.
  
  Why perceptual hash (dHash — difference hash)?
  dHash: designed to capture VISUAL content, not byte content.
  Algorithm:
  1. Resize the image to 9×8 pixels (discards fine details, captures structure).
  2. Convert to grayscale (removes color, captures luminance pattern).
  3. For each of the 8 rows: compare adjacent pixels (9 pixels = 8 comparisons).
     If left pixel is brighter than right pixel: bit = 1.
     If right pixel is brighter: bit = 0.
  4. Result: 8 rows × 8 bits = 64-bit fingerprint.
  
  Property: visually similar images → similar 64-bit strings.
  Property: visually different images → very different 64-bit strings.
  Measurement: Hamming distance (number of bit positions that differ).
  
  Hamming distance 0: bit-for-bit identical (same visual content).
  Hamming distance ≤ 3: near-identical (minor crop, minor resize, same icon).
  Hamming distance ≤ 8: similar (same concept, different style — warn engineer).
  Hamming distance > 8: distinct (genuinely different image — allow).
  
  STEP 2: COLLISION DETECTION
  
  Compare incoming image's pHash against all ~300 existing catalog entries.
  Uses: efficient Hamming distance computation (XOR + popcount, O(n) for n catalog entries).
  
  If Hamming ≤ 3: REJECT. "This image is 96% similar to ic_share.png (used in 12 screens).
                   Use the existing asset instead."
  If Hamming ≤ 8: WARN. "Similar image exists. Review before proceeding. [y/N]"
  If Hamming > 8: proceed to next step.
  
  STEP 3: LOSSLESS COMPRESSION
  
  PNG: pngcrush + optipng → lossless optimization. Typically 15-40% size reduction.
  No quality loss. Same visual result.
  WebP: generated alongside PNG for React Native's Image component.
  WebP: typically 30% smaller than optimized PNG. React Native uses WebP when available.
  
  STEP 4: CATALOG REGISTRATION
  
  JSON registry (committed to the repository):
  {
    "ic_share.png": {
      "hash": "a3f9e2b1c4d7",
      "dimensions": "32×32",
      "addedBy": "engineer.a@seamoney.com",
      "addedAt": "2024-01-15",
      "usedInScreens": ["HomeScreen", "ProfileScreen", ...(12 total)]
    }
  }
  
  "usedInScreens" updated via AST analysis: scans all TSX files for Image source references.
  
  ENABLES:
  "Which screens use ic_share?" → instant answer from catalog.
  "What assets are used in 0 screens?" → candidates for removal.
  Unused asset removal script: removed 300+ assets. −7% bundle size.

RESULT:
  Zero image collision incidents in the 12 months following pipeline launch.
  300+ duplicate/near-duplicate images identified and removed: −7% app bundle.
  30+ engineers: use the pipeline daily. Transparent (pre-commit hook). Zero friction.
  
  The pipeline caught:
  - Engineers accidentally reusing a filename from a different feature.
  - Engineers uploading a 2× version of an existing 1× icon.
  - Engineers adding an image that was nearly identical to one from another team.
  All caught before commit. Zero incidents reached production.
```

---

## 3️⃣ CLS 0.1 → 0 (Layout Shift Elimination)

### Mis-tap Prevention · Skeleton Screens · Perceived Responsiveness

---

```
WHAT CLS IS IN REACT NATIVE CONTEXT:
  
  Web: CLS (Cumulative Layout Shift) is a standardized Core Web Vitals metric.
  React Native: no official CLS metric, but the same phenomenon occurs.
  Definition: visible content shifts position after the user can see it.
  
  THE SPECIFIC BUG:
  
  User journey (before fix):
  1. Homepage loads. Balance card visible. Quick Actions Grid appears: [Transfer] [Pay Bills] [Card] [History]
  2. User's thumb moves toward [Transfer] (top-left quick action).
  3. Async component (Promotions Banner) finishes loading. It was React.lazy()-loaded.
  4. The banner inserts ABOVE the Quick Actions Grid.
  5. The Quick Actions Grid shifts DOWN by 44 pixels (the banner's height).
  6. The shift happens in <16ms (one frame). The user's eyes don't track it.
  7. The user's tap registers on [Pay Bills] (now in the position [Transfer] was).
  8. Bill payment flow opens. User didn't intend this.
  
  This is a MIS-TAP.
  In a financial app: mis-taps are not just annoying. They are alarming.
  A user who accidentally opens "Pay Bills" when they wanted "Transfer": immediate distrust.
  "Did I accidentally pay a bill? Did something happen to my money?"
  Support tickets, app store reviews: "The app does random things when I tap."
  
  HOW WE MEASURED IT:
  React Native doesn't have web's PerformanceObserver for layout shifts.
  We measured by:
  1. Recording the screen with slow-motion camera (240fps).
  2. Frame analysis: identifying the frame where each component appears vs the frame of user tap.
  3. If a component's position changed between "visible" frame and "tapped" frame: a shift occurred.
  4. Estimated CLS score (approximating web's formula): ~0.1
     (impact fraction × distance fraction. Banner: 20% of screen height. Shift: 10% of viewport. ≈ 0.02 per event)
  5. Frequency: this happened on ~40% of first-load homepage views (whenever promos were not cached).
  
  CLS 0.1 is above Google's "Good" threshold (0.1 for web). Signal: real user impact.

THE THREE FIXES:
  
  FIX 1: SKELETON SCREENS WITH MATCHING HEIGHT (primary fix)
  
  Before:
  <Suspense fallback={<ActivityIndicator />}>
    <PromoBanner />
  </Suspense>
  
  ActivityIndicator: a spinning circle. No fixed height. Height = 24px.
  When PromoBanner (44px) loads: content below shifts DOWN by 20px.
  
  After:
  <Suspense fallback={<PromoBannerSkeleton />}>
    <PromoBanner />
  </Suspense>
  
  PromoBannerSkeleton: a grey shimmer box. Height = exactly 44px (same as real banner).
  The space is RESERVED from the initial render.
  When PromoBanner loads: it fills the 44px that was always there. Zero shift.
  
  The skeleton animation (shimmer):
  Animated gradient: left-to-right shimmer effect.
  Signal to users: "content is loading here." Not: "this is an error."
  Users perceive this as fast loading, not blank/broken content.
  
  FIX 2: SYNCHRONOUS LOADING FOR CRITICAL COMPONENTS
  
  Components that sit ABOVE the Quick Actions Grid (the tappable area):
  BalanceCard: synchronous. Always in the bundle. Never lazy.
  Quick Actions Grid: synchronous. Always in the bundle. Never lazy.
  
  Components that can load asynchronously (below or after the grid):
  PromoBanner: lazy. Load async (skeleton reserves space).
  TransactionHistory: lazy (it's below the fold anyway).
  OffersAndRewards: lazy (below the fold).
  
  Why this works: the user's thumb position (targeting [Transfer]) is established
  AFTER they see the Quick Actions Grid. The Quick Actions Grid is always the same height.
  Async components below it don't affect the Grid's position. Only async components
  ABOVE the Grid can cause a mis-tap.
  After the fix: nothing loads above the Grid asynchronously (without a fixed-height skeleton).
  
  FIX 3: FLEX LAYOUT VS ABSOLUTE LAYOUT
  
  The bug had a second cause: the Promotions Banner was using absolute positioning.
  Absolute positioned elements are REMOVED from the normal flow.
  When they transition from absolute to visible: they can affect surrounding elements unexpectedly.
  
  Changed: PromoBanner to a standard flex item in the parent FlexColumn.
  Flex items in a FlexColumn: each pushes the next item down predictably.
  With a fixed-height skeleton: the flex column's total height doesn't change when the banner loads.
  The Grid's flex offset: constant.

RESULT:
  CLS: 0.1 → 0 (measured by the same 240fps recording method).
  Zero mis-taps recorded in the 30 days following the fix (monitored via analytics).
  Perceived responsiveness: improved (skeletons feel faster than spinners — users feel the app is doing something).
```

---

## 4️⃣ Credit Card Vertical — Cross-Functional Delivery

### Aligned Product · Design · Backend · Leadership · Shipped on Time, Both Platforms

---

```
WHAT "COORDINATED DELIVERY" ACTUALLY MEANS:
  
  A feature involving 5 teams is not delivered by attending the kickoff meeting.
  It's delivered by actively unblocking each team's dependency on every other team.
  
  The typical failure mode for a 5-team feature:
  Week 1: Product writes PRD. Design starts mockups (need PRD to be done first).
  Week 2: Design finishes mockups. Backend starts API design (need mockups to be done first).
  Week 3: Backend starts implementation (need API design done first).
  Week 4: Frontend starts (need backend API done first).
  Week 6: Backend finishes. Frontend has 1 week to implement what needs 3 weeks.
  Week 8: Ship (2 weeks late). With bugs (rushed). First hotfix: 3 days later.
  
  What I did differently:

HOW I UNBLOCKED THE TEAM:
  
  1. EARLY API CONTRACT (Week 1)
  
  I didn't wait for backend to finish their implementation to know the API shape.
  Week 1: I scheduled a 1-hour session with the backend engineer.
  Agenda: "Let's agree on the API contracts now, before you write any code."
  
  Output (agreed in 1 hour):
  GET /api/v1/card/info
  Response: { cardNumber (masked, last 4 digits), limit, usedAmount, availableAmount,
              dueDate, minPayment, rewardPoints, cardStatus: "active"|"frozen"|"expired" }
  
  GET /api/v1/card/transactions?cursor=string&limit=20
  Response: { items: Transaction[], nextCursor: string, hasMore: boolean }
  
  POST /api/v1/card/payment
  Body: { amount: number, fromWalletId: string, note?: string }
  Response: { paymentId: string, status: "pending"|"success"|"failed" }
  
  Frontend immediately: built mock API using MSW (Mock Service Worker).
  MSW: intercepts network requests and returns mock data matching the agreed contracts.
  
  Result: frontend development starts Week 1 (not Week 4).
  When backend finished Week 4: swap MSW config for real API URL.
  Integration: half a day (API shapes matched exactly — contracts were agreed upfront).
  0 days of frontend blocked on backend.
  
  2. DESIGN HANDOFF CHECKLIST
  
  Before this checklist existed:
  Designer delivers Figma mockups. Frontend implements. Sends back for review.
  Designer: "the spacing is wrong, this should be 16pt not 14pt."
  Frontend: fix. Designer: "the card number font isn't the right weight."
  Frontend: fix. This back-and-forth: 3-5 round trips per feature. Days of delay.
  
  I wrote a "Frontend Spec Checklist" sent to the designer at kickoff:
  
  ☐ All spacing measurements in pt (not px — React Native uses pt, not px)
  ☐ All colors as design system tokens (not "#EE4D2D" — as "color.brand.primary")
  ☐ Animation: easing curve specified (not "smooth" — specify cubic-bezier values)
  ☐ All states mocked: loading, empty state, error state, limit exceeded state
  ☐ Card flip animation: duration (300ms), direction (Y-axis), face-down state design
  ☐ Android vs iOS differences explicitly called out (Android: Material ripple / iOS: opacity)
  ☐ Safe area handling: designs shown with notch/dynamic island awareness
  
  Designer delivers a spec meeting these criteria.
  Frontend implementation: one round trip at most (genuine design decisions, not measurements).
  
  3. DEMO-DRIVEN LEADERSHIP COMMUNICATION
  
  Leadership doesn't make decisions from PRDs. They make decisions from seeing the product.
  Week 2: I built a functional prototype. MSW mocks. Ran on real devices.
  Showed: credit card screen with animated card flip, limit widget with progress bar,
          transaction list, tap-to-pay flow, empty state (no transactions yet).
  
  This is a working app, not a Figma prototype. They can tap on things. They feel the real UX.
  
  Leadership feedback Week 2:
  "The card flip animation should be faster. 300ms feels sluggish."
  "We need to show the minimum payment amount prominently — compliance requirement."
  "The available amount should show in green, the used amount in amber/red."
  
  This feedback: incorporated in Week 3 (during active development).
  Zero changes at Week 7 (when it's painful and risky to change).
  No surprises at the final stakeholder demo.
  
  RESULT:
  Shipped on the planned date. Both Android AND iOS simultaneously.
  No rollback in the first 30 days.
  No emergency hotfix in the first 30 days.
  Leadership: saw the exact product they had approved in Week 2. No surprises.
```

---

## STAR Scripts

### State Calls 600 → 60

```
SITUATION:
  ~100,000 SeaMoney users on OxygenOS/ColorOS Android devices experienced
  incomplete homepage loads daily. Specific sections (Wallet Balance, Quick Actions)
  were missing — not due to network issues but due to the Android memory manager
  killing background processes when too many concurrent API calls were in flight.

TASK:
  Identify the root cause and design a solution that eliminates the incomplete homepage
  problem without requiring backend changes or infrastructure upgrades.

ACTION:
  Analyzed Sentry + Datadog traces: found the OxygenOS memory manager correlation.
  Designed a Zustand + MMKV persistent store architecture:
  - MMKV: synchronous native storage, provides cached data before first React render.
  - Zustand persist middleware: hydrates with MMKV data. Homepage renders instantly.
  - TTL staleness strategy: each section has a different freshness requirement (15s–3600s).
  - fetchIfStale(): runs after render (non-blocking). Only stale sections make API calls.

RESULT:
  Homepage state calls: 600 → 60 (−90%).
  Incomplete homepage incidents: eliminated on OxygenOS/ColorOS devices.
  ~100,000 users: no longer affected. Zero user-reported homepage loading failures in 30 days.
```

### CV Asset Pipeline

```
SITUATION:
  30+ frontend engineers adding images to a shared React Native codebase with no governance.
  Two classes of problems: image collisions (wrong icons in production) and
  duplicate storage (same visual content, different filenames — inflating app bundle).
  After 2 years: 300+ duplicate images accumulated. App bundle inflated by ~7%.

TASK:
  Build a scalable, transparent solution that engineers adopt without friction.

ACTION:
  Built a pre-commit hook pipeline:
  1. Perceptual hashing (dHash 64-bit): captures visual content fingerprint.
  2. Collision detection: Hamming distance against catalog. ≤3: reject. ≤8: warn.
  3. Lossless compression (pngcrush + WebP generation).
  4. Catalog registration: JSON with hash, dimensions, usedInScreens, addedBy.
  5. Unused asset detection script: identifies 0-use assets for removal.

RESULT:
  Zero image collision incidents in 12 months post-launch.
  300+ duplicate images removed: −7% app bundle size.
  30+ engineers use it daily. Pre-commit hook = transparent, no behavior change required.
```

---

## Follow-up Q&A

**"Why MMKV instead of Redux Persist + AsyncStorage?"**
> "Three reasons. Speed: MMKV reads are synchronous and ~0.1ms per item. AsyncStorage is async and ~10ms. For a homepage hydration use case: synchronous is critical because we need data before the first render, not after a Promise resolves. Redux Persist + AsyncStorage has a 'rehydration delay' — there's a brief window where the store is empty before AsyncStorage resolves. With MMKV: Zustand's persist middleware reads synchronously. The store is populated before React renders. The homepage: never renders in an empty state. Second: MMKV is a C++ native module. It doesn't share the JS thread with React renders. AsyncStorage shares the JS thread — storage reads compete with rendering for thread time. Third: Zustand's API is simpler than Redux Persist. The team adopted it faster."

**"How did you know it was OxygenOS specifically and not a network issue?"**
> "Network issues would affect all Android devices proportionally. What we saw in Datadog was: the same network conditions (latency, packet loss) on Samsung One UI → homepage loaded correctly. Same conditions on OnePlus OxygenOS → 3-4 sections missing. The device OS variable was the distinguishing factor. We also saw: the pattern happened consistently at specific concurrent request counts. Below 400 concurrent requests: fine. Above 450: failures on OxygenOS. That threshold is consistent with OxygenOS's documented memory pressure trigger. Combining the OS correlation with the concurrency threshold: the root cause was clear. We confirmed by artificially throttling the request count in a test build on a OnePlus device — dropped from 450 to 60 requests → no failures."

**"What is perceptual hashing? Why not just use a sha256 of the file content?"**
> "SHA-256 detects BYTE differences, not VISUAL differences. If I take an image, re-export it at slightly different compression, the bytes change completely — SHA-256 says they're totally different. But visually, they're identical. For asset collision detection, I need visual similarity, not byte similarity. Perceptual hashing (dHash in our case) generates a fingerprint from the IMAGE'S VISUAL STRUCTURE: resize to 9×8 pixels, convert to grayscale, compute brightness gradients between adjacent pixels, encode as 64 bits. Similar images → similar fingerprints → low Hamming distance. Different images → different fingerprints → high Hamming distance. This correctly catches: the same icon re-exported at different quality settings, the same icon resized slightly, or two icons with nearly identical visual appearance. SHA-256 would miss all of these."

**"What was harder: the state architecture or the CLS fix?"**
> "The CLS fix was harder to DIAGNOSE than to implement. The implementation was straightforward (skeleton screens + synchronous loading). But IDENTIFYING that the layout shift was causing mis-taps — not just 'annoying jumps' — required careful measurement. React Native doesn't have web's PerformanceObserver. We had to use 240fps slow-motion screen recording, watch frame-by-frame, and correlate component position changes with the tap event frame. The analytics confirmed it: we added an 'intended_action vs. actual_action' log on the quick actions. After the fix: 0 instances of 'Transfer' intended but 'Pay Bills' recorded for 30 days. Before the fix: dozens per day. The measurement methodology was more creative than the fix itself."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I optimized the homepage by reducing API calls" | "**Root cause**: OxygenOS/ColorOS aggressive memory manager kills background processes at >450 concurrent API calls → incomplete homepage for **~100K users** on mid-range Android. **Solution**: Zustand + MMKV persistent store (MMKV: synchronous C++ reads, 0.1ms, hydrates before first render). **TTL per section**: walletStore 30s/promoStore 300s/quickActions 3600s. **fetchIfStale()**: non-blocking, runs after render, only stale sections call API. **Result**: 600→60 calls (−90%), OxygenOS kill risk eliminated, zero incomplete homepage incidents." |
| "I built an asset management tool" | "**Computer vision pipeline** (pre-commit hook, transparent to 30+ engineers). **dHash perceptual hash**: 9×8 resize → grayscale → brightness gradient → 64-bit fingerprint. **Why not SHA-256**: SHA-256 changes on recompression/crop even if visually identical. **Hamming distance**: ≤3=reject/≤8=warn/8=allow. **Caught**: same icon re-exported at different quality, same icon resized, near-duplicate from different team. **Result**: zero collision incidents 12 months, 300+ duplicates removed, **−7% app bundle**, 30+ engineers daily with zero friction." |
| "I fixed a layout shift issue" | "**CLS 0.1→0** in React Native (no official metric: measured via 240fps slow-motion + frame analysis). **Root cause**: async banner (React.lazy) inserted ABOVE quick actions after user positioned thumb on Transfer → grid shifted 44px → tap registered on Pay Bills (financial mis-tap). **Three fixes**: (1) Skeleton with EXACT matching height (44px reserved from initial render). (2) Critical components above quick actions = synchronous (never lazy). (3) Flex layout instead of absolute (predictable flow). **Result**: 0 mis-taps in 30-day post-fix monitoring." |
| "I coordinated the credit card feature delivery" | "**Specific mechanisms**: (1) Week 1 API contract session: agreed GET /card/info, GET /card/transactions, POST /card/payment before ANY backend code. Built MSW mocks same day. Parallel development. Integration: half a day week 4. 0 frontend-blocked-on-backend days. (2) Design handoff checklist: pt units/design system tokens/easing curves/all states/Android vs iOS differences. One round trip max. (3) Week 2 functional prototype (real device, MSW data): leadership feedback incorporated week 3, not week 7. **Result**: shipped on planned date Android+iOS, zero rollback, zero hotfix first 30 days." |

---

## 📊 Quick Facts

```
ROLE: Frontend Engineer — Shopee | SeaMoney Digital Bank
STACK: React Native · TypeScript · Android/iOS · Node.js · Zustand · MMKV · CI/CD

ACHIEVEMENT 1: HOMEPAGE STATE ARCHITECTURE
  Problem:    ~100K users on OxygenOS/ColorOS got incomplete homepages daily
  Root cause: 600 concurrent API calls → OxygenOS memory manager kills processes
  Solution:   Zustand + MMKV persistent store (MMKV synchronous, native C++, 0.1ms reads)
  Strategy:   TTL per section (15s–3600s) · fetchIfStale() non-blocking after render
  Result:     600 → 60 API calls (−90%) · ~100K users fixed · zero incomplete loads

ACHIEVEMENT 2: CV ASSET PIPELINE
  Problem:    30+ engineers adding images with no collision governance; 300+ duplicates
  Solution:   Pre-commit hook: dHash pHash → Hamming distance collision detection → compress → catalog
  Key choice: dHash over SHA-256 (visual similarity, not byte similarity)
  Result:     Zero collision incidents (12 months) · −7% app bundle · 30+ engineers daily

ACHIEVEMENT 3: CLS 0.1 → 0
  Problem:    Async component (promo banner) loading above quick actions → 44px shift → mis-taps
  Measurement: 240fps slow-motion recording + intended vs actual action analytics
  Solution:   Skeleton with exact matching height + synchronous critical components + flex layout
  Result:     CLS 0 · Zero mis-taps in 30-day post-fix monitoring

ACHIEVEMENT 4: CREDIT CARD VERTICAL
  Challenge:  5 teams, 2 platforms, 1 deadline; typical failure = sequential blocking
  Mechanism:  Week 1 API contracts (MSW mocks same day, parallel dev, 0 blocked days)
              Design checklist (pt units/tokens/all states/platform differences)
              Week 2 functional prototype → leadership feedback → incorporated week 3
  Result:     Shipped on schedule · Android + iOS simultaneous · zero rollback · zero hotfix
```

---

*Document last updated: June 2026 · Shopee | SeaMoney Digital Bank interview preparation*
