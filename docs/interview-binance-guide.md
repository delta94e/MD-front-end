# ₿ Interview Guide — Binance Pay + KYB
## Red Packet 800K MAU · Send Cash +31.6% DAU · KYB AI · Micro-FE · Mini Program

---

## 🔑 Context: Why Binance Is the Strongest Story

```
BINANCE:
  The world's largest cryptocurrency exchange by trading volume.
  Binance Pay: Binance's crypto payment product.
  Think: PayPal but with crypto — send/receive crypto globally.
  
WHY THIS ROLE IS ELITE:
  Scale: Binance operates at global scale (28M+ daily active users on the exchange).
  Complexity: crypto payments involve: order matching, P2P liquidity, multi-rail routing,
  compliance (KYC/KYB), cross-border regulations, mini programs, checkout widgets.
  You did not just "build features." You were the FE owner of campaigns.
  You drove metrics that directly affect Binance's revenue.
  
THE QUANTIFIED STORY:
  Red Packet: 800K Monthly Active Users from ONE campaign you owned.
  Send Cash Revamp: FOUR major metrics improved simultaneously.
  KYB: AI-powered features at scale for merchant onboarding.
  
  These are not "I contributed to" — these are "I owned" and "I drove."
  That ownership distinction matters at the senior/staff level.
```

---

## 1️⃣ Red Packet Campaign — FE Owner

### What a Red Packet is and why it drove 100K+ new users/month

```
RED PACKET (红包) CONTEXT:
  Red packets are a Chinese cultural tradition: gifting money in a red envelope
  during celebrations (Chinese New Year, weddings, birthdays).
  WeChat popularized digital red packets in 2014 — massive viral adoption.
  Binance Pay's red packet campaign brought this to crypto.
  
  Users can: create a red packet with USDT/BNB/etc., set a total amount and count,
  share a link. Recipients open the link to claim their share.
  
WHY THIS DROVE 100K+ NEW USERS/MONTH:
  The viral acquisition loop:
  
  Step 1: Existing user creates a red packet ($10 USDT split among 5 people).
  Step 2: User shares the link to non-Binance friends.
  Step 3: Friend receives the link. "Claim your $2 USDT!"
  Step 4: Friend is NOT a Binance user → must register to claim.
  Step 5: Registration + light KYC → friend claims the packet.
  Step 6: Friend now has crypto in a Binance Pay wallet → likely to use more features.
  
  KEY INSIGHT: The claimable value ($) overcomes registration friction.
  Users who would never download a "crypto app" will register to claim free money.
  This is the same mechanism as: Uber's "give a free ride, get $15 credit" referral.
  Except the mechanism is embedded in a culturally resonant tradition.
  
  March 2023 = Chinese New Year period (timing was intentional).
  Cultural alignment + monetary incentive = 100K+ new users/month.
  
FRONT-END OWNER RESPONSIBILITIES:
  "FE owner" means: I was the accountable engineer for the entire frontend.
  
  1. Campaign landing page (red packet opening experience):
     The visual design matters: the moment of "opening" must feel delightful.
     Animation: envelope unfolds → amount revealed → confetti.
     Performance: this page is shown to non-users. No assumption of fast devices.
     Must load in < 2 seconds on mid-range mobile (Africa, Southeast Asia, etc.).
  
  2. Share flow:
     Multiple share mechanisms: copy link, QR code, social share (WeChat, Telegram).
     Deep link: if user has Binance app installed → open directly in the app.
     If not: web flow with registration prompt.
  
  3. Claim flow:
     Soft KYC (phone number verification for non-users).
     Then: claim the packet. Credit to wallet.
     
  4. Create flow:
     Amount input, currency selector, count (number of packets in one envelope),
     expiry time (unclaimed packets return after N hours).
  
  5. History and status:
     Who claimed? How much remains? How long until expiry?
  
  TECHNICAL REQUIREMENTS:
  Atomicity: two users cannot both claim the "last" packet.
  Solution: Redis atomic decrement + database transaction.
  Frontend: optimistic claim UI → confirm with backend → handle "already claimed" gracefully.
  
  The claim being atomic is backend. But the UX of "already claimed by someone else"
  is a frontend design problem: what do you show? How do you recover the user?

METRICS EXPLANATION:
  800K Monthly Active Users: users who engaged with red packets (created or claimed) in March.
  100K+ new users: new registrations attributable to the red packet campaign.
  Attribution: user registered via a red packet claim link → counted as campaign-driven.
```

---

## 2️⃣ Send Cash Revamp — Every Metric Improved

### The four metrics and why each improved

```
BINANCE PAY "SEND CASH":
  Users can send crypto to other users directly (P2P).
  Or: buy crypto and send it immediately (via TripleA, an external processor).
  This is how non-crypto users receive crypto from Binance Pay senders.
  
  The revamp: a comprehensive redesign of the Send Cash flow.
  November 2023.

METRIC 1: ORDER SUBMISSION CONVERSION 12% → 15% (+25%)
  
  WHAT THIS MEANS:
  100 users land on the Send Cash page.
  Before: 12 users reach the "order submitted" confirmation. 88 give up.
  After: 15 users submit. 88% drop-off → 85% drop-off.
  
  WHY USERS DROPPED OFF (BEFORE):
  - Too many form fields on a single screen.
  - No contextual help: "What is a recipient ID?" leaves users stuck.
  - Validation errors only shown on submit (not inline).
  
  WHAT CHANGED:
  - Progressive disclosure: amount → recipient → review → submit.
    One decision at a time. Less cognitive load.
  - Inline validation: error shown immediately when the field loses focus.
    User fixes it immediately, not after filling the entire form.
  - Contextual help: "?" buttons explaining recipient ID, amount limits, fees.
  
METRIC 2: P2P ORDER SUCCESS RATE 74.3% → 79.8% (+7.4%)
  
  WHAT THIS MEANS:
  Of orders that go through P2P routing: 74.3% successfully complete.
  25.7% fail. That is 1 in 4 orders failing. Significant revenue loss.
  
  P2P ORDER: matched with a real person willing to sell crypto.
  Failure reasons: peer cancels, peer is unresponsive, liquidity insufficient.
  
  WHAT CHANGED:
  1. Smart routing pre-check: before routing to P2P, check real-time liquidity.
     If P2P capacity for the requested currency is < 80%: pre-route to TripleA.
     The user doesn't see the routing decision. They just see: order succeeded.
  
  2. Peer quality score: Binance already had peer ratings.
     Filter: only route to peers with > 95% completion rate.
     Reduces peer cancellations.
  
  3. Timeout UX: if peer doesn't accept within 3 minutes, automatically reroute.
     Before: user waited 10 minutes for a failed order. Terrible experience.
     After: 3-minute timeout, reroute or retry prompt.
  
METRIC 3: TRIPLEA ORDER SUCCESS RATE 76.1% → 87.3% (+14.7%)
  
  WHAT THIS MEANS:
  TripleA processes fiat-to-crypto payments via credit card / bank transfer.
  Success rate 76.1% means: 1 in 4 card payments fail. Very high failure rate.
  
  WHY CARD PAYMENTS FAIL:
  - 3DS (3D Secure) authentication abandoned by user.
  - Insufficient funds.
  - Bank declines due to "suspicious" crypto transaction.
  - User enters wrong card details.
  
  WHAT CHANGED (Frontend's role):
  1. 3DS UX: the 3DS authentication popup was previously implemented as a native
     browser popup (blocked by many mobile browsers).
     New implementation: 3DS iframe embedded in the page. No popup blockers.
     3DS completion rate improved significantly.
  
  2. Error message overhaul: "Payment failed" (before) → "Your bank declined this
     transaction. This sometimes happens with crypto purchases. Try: a different card,
     bank transfer, or contact your bank to allow crypto transactions." (after).
     Actionable. Reduces "what do I do now?" drop-off.
  
  3. Pre-fill: saved cards from previous transactions. One tap to pay.
     Before: re-enter card details every time. Friction.
  
  4. Fallback presentation: if card fails, immediately present P2P as alternative.
     "Card declined — pay with peer-to-peer instead?" One click.
  
METRIC 4: DAILY ACTIVE USERS 2,246 → 2,956 (+31.6%)
  
  WHAT THIS MEANS:
  More users are using Send Cash daily. This is the outcome of all improvements above.
  
  WHY DAU GREW:
  1. More successful transactions = more users who come back (habit formation).
  2. Optimistic UI: perceived wait reduced from 3 seconds to < 1 second.
     The order confirmation appears immediately while the backend confirms.
     "Wow, that was fast" = user is more likely to use it again tomorrow.
  3. Word of mouth: successful payments get shared. "I sent $50 in crypto in 30 seconds."

OPTIMISTIC UI IN A PAYMENT CONTEXT:
  This requires careful engineering.
  
  Standard approach: submit → wait for 200 OK → show confirmation.
  Problem: backend order processing can take 3-10 seconds (P2P matching, 3DS, fraud check).
  
  Optimistic approach: submit → immediately show "Order submitted! Processing..."
  While the backend processes: show a live status animation.
  When backend confirms: transition to "Order complete!"
  If backend fails: transition to "Order failed. Here's why. Try again?"
  
  The perceived wait: from "button click → result": ~10 seconds (old) → ~1 second (new).
  The actual wait: unchanged. The user experience: dramatically better.
  
  RISK: the optimistic state must be clearly "pending" not "success."
  "Processing" ≠ "Confirmed." This distinction is critical in payments.
  A user who thinks the payment succeeded but it failed will be very upset.
  Design: clear "processing" state with animated indicator.
  Clear "confirmed" state with a different visual treatment (green, checkmark).
```

---

## 3️⃣ Mini Program — Binance App Embedded Surface

### What a Mini Program is and its engineering constraints

```
WHAT A MINI PROGRAM IS:
  A lightweight application running inside a larger host application.
  Examples: WeChat Mini Programs, Alipay Mini Programs, TikTok Mini Programs.
  Binance has its own Mini Program runtime inside the Binance mobile app.
  
  Binance Pay on Mini Program: users can access Pay features inside the Binance app
  without switching to a browser or a native screen.
  
  KEY DISTINCTION: a Mini Program is NOT a WebView of a website.
  It has its own component model, its own lifecycle, its own APIs.
  A website that works in Chrome may not work in a Mini Program.

ENGINEERING CONSTRAINTS:

1. NO DOM:
   React renders to the DOM: document.createElement, appendChild, etc.
   Mini Programs have no DOM.
   They have their own rendering layer (native or custom engine).
   
   Consequence: cannot use standard React for Mini Programs.
   Use the platform's framework: <View>, <Text>, <Button> instead of HTML.
   
   Workaround: frameworks like Taro (cross-compile React to Mini Program component syntax).
   But even Taro has differences: certain DOM APIs don't work.
   Engineers must write Mini Program-aware code even when using Taro.

2. NO STANDARD WEB APIs:
   fetch() → use tt.request() (or wx.request() in WeChat).
   localStorage → use tt.setStorageSync().
   window.location → use routing APIs (router.navigateTo()).
   EventEmitter → use global event bus provided by the platform.
   
   Every third-party library that uses fetch or localStorage breaks in Mini Programs.
   Must audit dependencies: axios? No (uses XMLHttpRequest). Use the platform's http client.
   moment.js? Might work but adds 60KB of unnecessary size. Use dayjs.

3. PACKAGE SIZE LIMIT: 2MB main package, 2MB per sub-package.
   A typical React app with dependencies easily exceeds 2MB.
   
   Every dependency is a deliberate decision:
   - lodash: 70KB. Banned. Use native JS methods.
   - react-icons: can add 100KB+. Use a curated SVG sprite.
   - large charting libraries: not for mini programs.
   
   Tree shaking is mandatory. Bundle analysis on every build.
   CI checks: if bundle exceeds 1.8MB, the build fails.
   
4. JAVASCRIPT THREAD ≠ RENDER THREAD:
   (Identical concept to React Native's architecture.)
   Two isolated threads: the JS thread and the render thread.
   They communicate via a bridge (postMessage equivalent: setData).
   
   Consequence:
   - Heavy JS computation does NOT block the UI. UI stays smooth.
   - Excessive setData() calls DO cause performance issues.
     Each setData is a cross-thread message. Expensive.
   - Pattern: diff before calling setData. Only send changed data.
   - Pattern: batch multiple updates into one setData call.
   
5. REVIEW PROCESS:
   Every Mini Program release goes through Binance's internal review team.
   (Similar to App Store review for native apps.)
   
   This means: a hotfix for a critical bug takes: build → submit → review (hours) → approved.
   Not instant deployment like web.
   
   Engineering discipline: higher quality bar before submission.
   Comprehensive testing before release. "We get one shot."
   Feature flags (equivalent to GateKeeper) to enable features remotely
   without new submissions.
```

---

## 4️⃣ KYB — Know Your Business

### Architecture and AI-powered features

```
WHY KYB IS DIFFERENT FROM KYC:
  KYC: verify a person's identity (individuals using Binance Pay as consumers).
  KYB: verify a business's legitimacy (merchants using Binance Pay to accept crypto).
  
  KYB is more complex:
  - Businesses have legal documents (registration certificates, articles of incorporation).
  - Businesses have directors and ultimate beneficial owners (UBOs).
  - Ownership can be complex: A owns 40% of B, B owns 60% of C.
    Who ultimately controls C? Determining UBO from corporate structures is hard.
  - Businesses can be incorporated across multiple jurisdictions.
  - Regulatory requirements differ by country (Singapore, EU, US, etc.).
  
  A KYB rejection or approval has higher stakes than KYC:
  A rejected individual loses access for themselves.
  A rejected business loses access for all their customers.

TWO PORTALS:
  
  CLIENT PORTAL (Next.js):
  The business submits their KYB application.
  Multi-step wizard: business info → document upload → directors → UBO structure → submission.
  Document upload: certificate of incorporation, board resolutions, director IDs.
  Status tracking: submitted → under review → additional information requested → approved/rejected.
  
  ADMIN PORTAL (React + Zustand):
  Compliance officers review submitted applications.
  Review queue: sorted by risk score, date, country.
  Case view: all submitted documents, AI extractions, risk scores, sanctions results.
  Decision: approve / reject / request more information.
  Audit log: every action recorded (regulatory requirement).

AI-POWERED FEATURES:
  
  1. DOCUMENT OCR EXTRACTION:
  Business uploads their certificate of incorporation (a PDF or image).
  The AI pipeline processes it:
  - Detect: this is a Singapore ACRA certificate.
  - Extract: company name, registration number, incorporation date, address.
  - Pre-populate the KYB form with extracted values.
  
  Impact: before AI extraction, businesses manually typed all this information.
  Typing errors → form rejection → resubmission.
  After AI extraction: user reviews and confirms, not re-types.
  Data accuracy improved. Form completion time reduced.
  
  2. RISK SCORING MODEL:
  ML model trained on features:
  - Industry vertical (gambling, fintech, crypto: higher risk)
  - Country of incorporation (FATF grey list, high-risk jurisdictions)
  - Business age (< 6 months: higher risk)
  - Directors' PEP/sanctions status
  - Transaction volume vs declared revenue ratio
  - Corporate structure complexity (deep holding chains: higher risk)
  
  Score: 0-100.
  > 80: LOW RISK → AUTO-APPROVE (no human review required).
  40-80: MEDIUM → MANUAL REVIEW.
  < 40: HIGH RISK → ENHANCED DUE DILIGENCE required.
  
  Impact: compliance team only manually reviews borderline cases.
  Throughput: 3× more KYB applications processed per day with same team size.
  
  3. AML SANCTIONS SCREENING:
  Director and UBO names are screened against:
  - OFAC (US Treasury Office of Foreign Assets Control)
  - EU sanctions list
  - UN sanctions list
  - Dow Jones / ComplyAdvantage commercial databases (PEP, adverse media)
  
  Real-time API: results in seconds.
  The AI component: fuzzy name matching with context.
  
  WHY FUZZY MATCHING:
  A sanctions list may have: "MUKHTAR AKHMEDOV" (Russian oligarch).
  The business submits: "Mukhtar A." — partial match.
  Simple string matching: no match → missed.
  Fuzzy matching with: country (Russian), DOB, business type → high probability match → flag.
  
  4. DUPLICATE DETECTION:
  A rejected business might reapply under a slightly different name.
  "Acme Corp Ltd" was rejected → reapplies as "Acme Corporation Ltd."
  
  Detection: hash(registration_number) → check against all existing applications.
  Registration number is unique per jurisdiction. Name changes → same registration number.
  Frontend displays: "This registration number was previously submitted (Application ID: xxx)."
  Compliance officer can view the previous application's history.
  
  5. AUTO-REVIEW SUGGESTIONS:
  When a compliance officer opens a case, they see:
  
  AI RECOMMENDATION: APPROVE
  Confidence: 94%
  
  Reasons:
  ✓ Risk score: 91/100 (Low risk)
  ✓ All documents verified and OCR-confirmed
  ✓ No sanctions matches for any director
  ✓ Industry: Software/SaaS (low risk)
  ✓ Incorporation: Singapore (FATF compliant jurisdiction)
  ✓ Business age: 4 years (established)
  
  Officer reviews the AI's reasoning. If they agree: one-click approve.
  Audit log records: "Approved by [officer] · AI recommendation: APPROVE · Confidence: 94%"
  
  This is not replacing the compliance officer. It is augmenting them.
  The officer is responsible for the decision. The AI does the research.
```

---

## 5️⃣ Zustand vs Redux

```
THE PROBLEM WITH REDUX FOR PAYMENT FLOWS:
  A payment flow has: complex state (amount, currency, method, orderId, status, errorCode).
  In Redux:
  - Define the state interface
  - Define action types (constants or enum)
  - Define action creators (functions that return action objects)
  - Define a reducer (switch statement handling each action type)
  - Define selectors (functions that read specific parts of state)
  - Connect components (useSelector, useDispatch)
  
  For a payment flow: this is 5+ files before writing any business logic.
  
WITH ZUSTAND:
  Define state + actions in one create() call.
  Use the store directly in any component with a hook.
  No boilerplate. No connect. No dispatch.
  
  The payment store:
  - State: amount, currency, method, orderId, orderStatus, errorCode
  - Actions: setAmount, setCurrency, setMethod, submitOrder, reset
  
  All in one file. One hook: usePaymentStore().
  
  Selector subscription: usePaymentStore(s => s.amount) subscribes only to amount.
  If orderStatus changes but amount doesn't: the component does NOT re-render.
  Same behavior as Redux + Reselect, with 90% less code.

WHEN TO USE REDUX OVER ZUSTAND:
  Redux is better for:
  - Very large teams where the strict action/reducer pattern enforces conventions.
  - Time-travel debugging (Redux DevTools).
  - Complex derived state across many slices (reselect cross-slice selectors).
  
  For Binance Pay's payment flow: Zustand is clearly the right choice.
  Payment state is self-contained. The team is focused. Zustand reduces cognitive overhead.
```

---

## 6️⃣ React Query — Order Status Polling

```
THE POLLING CHALLENGE:
  A payment order is not instant.
  P2P: wait for a peer to accept (seconds to minutes).
  TripleA: wait for 3DS completion + bank confirmation.
  
  The frontend must poll the order status API:
  GET /api/orders/{id} → { status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" }
  
  NAIVE IMPLEMENTATION:
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await fetchOrderStatus(orderId);
      setStatus(status);
      if (status !== "PENDING") clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [orderId]);
  
  PROBLEMS:
  1. Memory leak: if component unmounts before the order completes, interval continues.
  2. Race condition: two requests can be in flight simultaneously.
  3. No error handling: fetch failure stops polling silently.
  4. Duplicated polling: if two components show order status, two polling intervals run.
  
  REACT QUERY SOLUTION:
  
  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => payAPI.getOrderStatus(orderId),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "PENDING" || status === "PROCESSING") return 2000;
      return false; // stop when terminal
    },
    staleTime: 0,  // payment status: never use cached version
    retry: 3,      // network failure: retry 3 times before giving up
  });
  
  WHAT REACT QUERY SOLVES:
  1. Automatic cleanup: polling stops when component unmounts.
  2. Deduplication: multiple components with same queryKey → ONE request.
  3. Error handling: retry + error state without custom code.
  4. Cache: other components reading order status get the cached result.
  5. staleTime: 0 ensures no stale data for payments.
  6. Conditional stop: refetchInterval returning false stops polling automatically.
```

---

## STAR Scripts

### Red Packet Campaign

```
SITUATION:
  Binance Pay needed a user acquisition mechanism that would drive registrations
  organically, without relying purely on paid advertising.
  Chinese New Year 2023 presented a cultural opportunity:
  red packets (红包) are a tradition with 100% recognition in target demographics.

TASK:
  Frontend owner for the Share Red Packet Campaign.
  Own the entire frontend: create, share, claim, history, status.
  Target: meaningful new user acquisition.

ACTION:
  Built the red packet creation flow, share mechanisms (link + QR + deep link),
  claim experience (optimistic claim UI, graceful "already claimed" error handling),
  and non-user registration integration (soft KYC inline with claiming).
  Performance-optimized the claim landing page for < 2s load on mid-range mobile.
  Launched March 2023 (Chinese New Year timing, intentional).

RESULT:
  800K Monthly Active Users. 100K+ new users attributable to the campaign monthly.
  The viral acquisition loop: share URL → non-user registers to claim → new Binance user.
  One of the highest-impact campaigns in Binance Pay's history.
```

### Send Cash Revamp

```
SITUATION:
  Binance Pay's Send Cash flow had: 12% order submission conversion, 74.3% P2P success,
  76.1% TripleA success, 2,246 daily active users.
  Each failed order is: a frustrated user + lost revenue + potential churn.

TASK:
  Core developer on the Send Cash Revamp.
  Improve conversion and success rates without compromising security or compliance.

ACTION:
  Progressive disclosure form (reduced cognitive load → submission conversion).
  Smart P2P routing with real-time liquidity check + peer quality filter.
  3DS iframe implementation (eliminated popup-blocker failures in TripleA).
  Actionable error messages replacing generic error codes.
  Saved card pre-fill for returning users.
  Fallback prompt: card declined → P2P offered immediately.
  Optimistic UI: order "submitted" immediately, backend confirms in background.

RESULT:
  Order submission conversion: 12% → 15% (+25%).
  P2P success rate: 74.3% → 79.8% (+7.4%).
  TripleA success rate: 76.1% → 87.3% (+14.7%).
  Daily Active Users: 2,246 → 2,956 (+31.6%).
  All four metrics improved simultaneously, confirming the revamp's systemic impact.
```

---

## Follow-up Q&A

**"How did you attribute the 100K+ new users to the Red Packet campaign specifically?"**
> "Attribution required careful instrumentation. When a user registers via a red packet claim link, the registration URL contains a campaign parameter: binance.com/register?source=red-packet&packetId=xxx. The backend records this at registration time. Every user registered via this path is attributed to the campaign. We also measured: the organic registration rate (users who register without the red packet link) as a control. The delta — registrations above the organic baseline during the campaign period — is the campaign attribution. 100K+ represents new registrations via the red packet path. We cross-validated by checking that these users had a claimed red packet in their account activity."

**"What was the biggest risk of the optimistic UI for payment confirmation?"**
> "Misrepresenting the payment state to the user. If the optimistic UI shows 'Payment Sent!' but the backend subsequently fails the order, the user believes they've paid when they haven't. This is a trust and compliance problem — potentially a financial dispute if the recipient thinks they received money that was never actually sent. The solution is precise language and distinct visual states. The optimistic state shows 'Submitting...' or 'Processing — your order is being confirmed.' NOT 'Payment complete.' The success state (after backend confirmation) shows 'Payment sent ✓' with a checkmark. The user clearly understands: 'Processing' means in progress, 'Sent ✓' means final. The animation and color differ enough that there's no ambiguity. We user-tested this with UX research before launch."

**"Why use Zustand instead of Redux for Binance Pay?"**
> "Redux's boilerplate has a cost. For a payment flow, I am writing: action types enum, action creator functions, a reducer with a switch statement, selectors, and then wiring all of this with useDispatch and useSelector. That is five separate abstractions before I write one line of business logic. Zustand collapses this: state and actions live in one create() call. I write the submitOrder function directly in the store definition. Any component subscribed to the specific slice it needs (usePaymentStore(s => s.orderStatus)) without re-rendering on unrelated state changes. The store is simpler to reason about, easier to test (just call the actions directly), and requires no configuration. For Binance Pay's focused payment state, Zustand was clearly the right tool."

**"What is the most technically challenging aspect of Mini Program development?"**
> "The package size constraint combined with the JavaScript thread separation. The 2MB limit means every dependency is a deliberate decision — you cannot 'just add' lodash or moment.js. Bundle analysis is mandatory on every build. And the thread separation changes performance reasoning. In a browser: a 100ms JS operation blocks the main thread, causing a visible frame drop. In a Mini Program: that same 100ms operation is on the JS thread, which is separate from the render thread — the UI stays smooth. But excessive setData calls (the cross-thread communication mechanism) cause visible lag because each setData is an expensive bridge message. You shift from 'minimize JavaScript execution time' to 'minimize cross-thread communication frequency.' Different mental model. The strategy: batch setData calls, diff before sending (only send changed keys), and do expensive computations on the JS thread without worrying about UI smoothness."

---

## 🔗 Unified Narrative

> "My time at Binance spans three distinct engineering challenges, each demonstrating a different dimension of senior frontend engineering.
>
> The Red Packet campaign is the product ownership story. 800K Monthly Active Users from a campaign I owned end-to-end — not just the implementation, but the entire frontend: create, share, claim, history, status, performance optimization. The viral loop worked because the mechanics were right: a culturally resonant tradition, monetary incentive to overcome registration friction, and a non-user registration flow that was fast enough to not lose the claimant mid-process.
>
> The Send Cash Revamp is the metrics-driven engineering story. Four metrics improved simultaneously — that is not luck. It is the result of a systematic diagnosis: look at where users drop off (order submission at 12%), trace the cause (friction, validation), fix it (progressive disclosure, inline validation). Then look at post-submission failures: P2P at 74.3%, TripleA at 76.1%. Different causes, different solutions: smart routing and peer quality filtering for P2P, 3DS iframe and actionable errors for TripleA. The DAU improvement (+31.6%) is the outcome of all of this: more successful transactions → more users who come back.
>
> KYB with AI features is the scale and intelligence story. OCR extraction, risk scoring, sanctions screening, duplicate detection, auto-review suggestions — these are not 'AI for AI's sake.' Each feature addresses a real operational problem: manual data entry errors, compliance team throughput, regulatory AML requirements, resubmission abuse. The 3× throughput improvement for the compliance team is the measure: they review the same number of applications in one day that previously took three."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I worked on Red Packet" | "**FE owner** for Share Red Packet Campaign (March 2023). End-to-end: create/share/claim/history/status. **Viral loop**: non-Binance users register to claim → 100K+ new users/month. **800K MAU**. Performance: < 2s load on mid-range mobile. Deep link: existing users open directly in app." |
| "I improved conversion" | "**Send Cash Revamp**: 4 metrics simultaneously — Order submission **12%→15%** (progressive disclosure + inline validation), P2P **74.3%→79.8%** (smart routing with liquidity pre-check + peer quality filter), TripleA **76.1%→87.3%** (3DS iframe replacing popup + actionable errors), DAU **2,246→2,956 (+31.6%)** (optimistic UI: perceived wait 3s → <1s)." |
| "I used Mini Program" | "Mini Program = **no DOM, custom JS runtime**. <View>/<Text> not HTML. **2MB package limit** (no lodash, dayjs not moment, curated SVG sprites). **JS thread ≠ render thread** (like RN bridge): minimize setData() calls, diff before sending. Internal review process = 'one shot' quality bar." |
| "I used Zustand" | "Zustand vs Redux: **no action files, no reducers, no dispatch**. State + actions in one create(). Selector subscription: usePaymentStore(s => s.amount) → only re-renders on amount change. For payment flow (focused, self-contained state): Zustand reduces boilerplate 90% with same performance characteristics." |
| "I used React Query" | "React Query for order polling: **refetchInterval**: polls every 2s while PENDING/PROCESSING, returns false on terminal state → stops automatically. **staleTime: 0** (payment status must always be fresh). **Deduplication**: two components showing status → one request. **Automatic cleanup**: polling stops on unmount (no manual clearInterval)." |
| "I worked on KYB AI" | "5 AI features: (1) **OCR extraction** → auto-populates form, reduces data entry errors; (2) **Risk scoring** 0-100, >80 AUTO-APPROVE → 3× compliance throughput; (3) **AML sanctions screening** with fuzzy name matching (country/DOB context reduces false negatives); (4) **Duplicate detection** via registration number hash; (5) **Auto-review suggestions** with reasoning → compliance officer approves in one click." |

---

## 📊 Quick Facts

```
Company: Binance (world's largest crypto exchange by volume)
Product: Binance Pay (crypto payment product) + KYB (merchant onboarding)

RED PACKET CAMPAIGN (March 2023):
  Role:          Front-End Owner
  MAU:           800,000
  New users/mo:  100,000+
  Mechanism:     Share link → non-user registers to claim → new Binance user
  Cultural:      Chinese New Year timing (intentional)
  Tech:          Deep link (app) + web fallback, optimistic claim, atomic backend

SEND CASH REVAMP (November 2023):
  Role:          Core Developer
  Order submission conversion:  12% → 15%   (+25%)
  P2P success rate:             74.3% → 79.8% (+7.4%)
  TripleA success rate:         76.1% → 87.3% (+14.7%)
  Daily Active Users:           2,246 → 2,956 (+31.6%)
  
  Causes:
  - Progressive disclosure → submission conversion
  - Smart P2P routing (liquidity pre-check + peer quality filter) → P2P success
  - 3DS iframe + actionable errors + saved card pre-fill → TripleA success
  - Optimistic UI (perceived wait 3s → <1s) → DAU retention

PRODUCT SURFACES:
  Web:              Pay web app (React, Next.js)
  Checkout Widget:  Embeddable iframe for merchants
  Mini Program:     Binance app embedded (2MB limit, no DOM, setData bridge)
  Merchant Portal:  Vue.js management dashboard
  KYB Client:       Next.js multi-step wizard
  KYB Admin:        React + Zustand compliance review portal

KYB AI FEATURES:
  1. OCR extraction (auto-populate from business registration cert)
  2. Risk scoring (0-100, >80 auto-approve, 3× compliance throughput)
  3. AML screening (OFAC/EU/UN + fuzzy name matching)
  4. Duplicate detection (hash registration number)
  5. Auto-review suggestions (reasoning + confidence score)

TECH STACK:
  React, Next.js, TypeScript, JavaScript
  VueJS (Merchant Portal)
  Zustand (payment state, no Redux boilerplate)
  React Query (order polling, deduplication, auto-cleanup)
  Micro-Frontend (Module Federation / custom)
  Mini Program (custom Binance runtime)
```

---

*Document last updated: June 2026 · Binance Pay interview preparation*
