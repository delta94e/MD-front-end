# 🛒 Interview Guide — E-commerce Cart & Checkout · Incident Reporting Tool
## Seamless purchasing journey · Structured operational tooling

---

## 🔑 Context: Why Cart & Checkout Is High-Stakes Engineering

```
THE STAKES:
  E-commerce cart abandonment rate: industry average 70%+.
  Every UX friction point on the cart or checkout: measurable revenue loss.
  
  "Seamless and intuitive" is not aesthetic. It is engineering.
  
  Examples of friction that engineers cause (and must prevent):
  - Quantity updates that lag (user clicks "+", nothing happens for 500ms): feels broken.
  - Coupon error that says "Invalid" without explaining why: user gives up.
  - Checkout form that loses data when you click "Back": user starts over, often abandons.
  - "Place Order" double-click: two orders. Customer support call. Refund. Trust lost.
  - Cart that doesn't reflect changes made in another tab: user buys an out-of-stock item.
  
  Each of these: a real engineering decision that I was responsible for getting right.
```

---

## 1️⃣ Cart & Checkout — Key Features

### Optimistic Updates · Race Conditions · Coupon Validation · Multi-step Checkout · Payment Security

---

```
CART STATE MANAGEMENT — THE THREE HARD PROBLEMS:

PROBLEM 1: OPTIMISTIC QUANTITY UPDATES
  
  User expectation: I click "+", the quantity changes immediately.
  Reality without optimistic updates:
    1. User clicks "+".
    2. React sends an API call.
    3. UI waits for the response (300-500ms).
    4. Response arrives: UI updates.
    During step 3: the cart shows the old number. User thinks their click didn't register.
    They click "+" again. Now they've added 2 instead of 1. Frustrating.
  
  Optimistic update pattern:
    1. User clicks "+".
    2. React: immediately updates state (optimistic).
       Cart shows the new quantity. No waiting.
    3. API call: sent in the background.
    4a. Server confirms: nothing to do. UI is already correct.
    4b. Server rejects (out of stock, purchase limit exceeded):
        Rollback: restore the snapshot from before the click.
        Show an error toast: "Sorry, only 2 more available."
  
  Rollback requires a snapshot:
    const previousItems = items; // snapshot BEFORE optimistic update
    setItems(/* optimistic update */);
    const result = await cartApi.updateQty(itemId, delta);
    if (!result.ok) setItems(previousItems); // rollback
  
  This pattern: makes the cart feel instant without sacrificing correctness.

PROBLEM 2: RAPID CLICKS — RACE CONDITIONS
  
  User clicks "+" rapidly: sends 5 API calls in 500ms.
  They might arrive at the server out of order.
  Server processes them in order of arrival, not click order.
  Result: cart quantity could be wrong.
  
  SOLUTION A: DEBOUNCE
    Don't send the API call on every click.
    Wait until the user stops clicking for 300ms.
    Then: send ONE request with the final quantity.
    Simple. Effective. No out-of-order responses.
  
  SOLUTION B: VERSIONED REQUESTS (more robust)
    Every cart request: includes a version number.
    API responds: with the version number it processed.
    Client: ignores responses for stale versions.
    Latest version: wins.
    More complex. Better for high-frequency interactions.
  
  WE USED DEBOUNCING: simpler, sufficient for the cart use case.

PROBLEM 3: CROSS-TAB CART SYNC
  
  User scenario:
    Tab A: adds 1 Dyson Airwrap to cart. Stock: 2. Cart A: 1 in cart.
    Tab B: also shows the old cart (0 items). User adds 2 Dyson Airwraps.
    Tab B total: 2 items. 1 actually available.
    Both tabs: proceed to checkout. One order: oversells. Shipping team: chaos.
  
  SOLUTION: localStorage + StorageEvent
    When cart is updated: increment cart_version in localStorage.
    Other open tabs: receive the StorageEvent immediately (browser built-in).
    Each tab: sees the new version → refetches the authoritative cart from the server.
    All tabs: stay in sync. No polling. No WebSocket needed for this specific use case.
    
    window.addEventListener("storage", (event) => {
      if (event.key === "cart_version" && event.newValue !== localVersion) {
        refetchCart(); // resync with server
      }
    });
  
  WHY localStorage EVENTS (not SharedWorker / BroadcastChannel):
  localStorage StorageEvent: fires in ALL other tabs on the same origin.
  Supported: all browsers, no additional setup.
  BroadcastChannel: newer API, same capability. Either works.
  We chose localStorage: familiar to the whole team.

STOCK WARNINGS:
  
  "Only 2 left in stock" — business impact: +8% conversion lift.
  Reason: creates urgency. User who was "thinking about it" acts immediately.
  
  Technical implementation:
  The cart endpoint: returns stock count alongside each item's quantity.
  Not a separate stock API call. One request. One response.
  Threshold: stock <= 3 → show warning.
  UI: amber text, small warning icon. Not a modal. Not disruptive.
  
  Edge case: stock drops to 0 between the warning appearing and checkout:
  The checkout confirmation: makes a final stock check.
  If unavailable: checkout blocked. Error message: clear and specific.

COUPON VALIDATION:
  
  INPUT: user types a code. Press Enter or click "Apply".
  
  WHAT HAPPENS:
  1. Frontend: validates code is non-empty. If empty: show error. No API call.
  2. Frontend: sends POST /coupons/validate { code, cartTotal }.
  3. Server-side validation (the important kind):
     - Code exists?
     - Code is still active (not expired)?
     - Minimum order requirement met?
     - Not already applied?
     - Usage limit (e.g., first-time use only, N-use limit) not exceeded?
  4a. Valid: apply discount. Show green confirmation.
  4b. Invalid: show specific error:
      - "Invalid code" (code doesn't exist)
      - "Minimum order $200 required" (minimum not met)
      - "Code expired on June 1" (expired)
  
  WHY SERVER-SIDE VALIDATION (not just client-side):
  Client-side validation can be bypassed (edit the JavaScript).
  Server-side: authoritative. All discount logic: lives in one place.
  Frontend: only displays the error message the server returns.
  
  DEBOUNCE ON THE COUPON INPUT?
  No. Coupon validation: triggered by the user explicitly clicking "Apply".
  Not on every keystroke. The coupon input: doesn't validate-as-you-type.
  Reason: coupon codes are short (5-10 chars) and intentionally typed in full.
  Mid-code validation: creates false "Invalid" errors that alarm users.
```

---

## Multi-Step Checkout Wizard

```
THE 4-STEP FLOW: Cart → Shipping → Payment → Review → Done

WHY MULTI-STEP (not one long page):
  One-page checkout: all fields visible at once.
  Users: overwhelmed. Abandonment higher on longer-perceived pages.
  Multi-step: each step feels small and achievable.
  Progress indicator: "Step 2 of 4" — user knows how far they are.
  Completion psychology: humans finish things they've started (Zeigarnik effect).

STEP VALIDATION (enforced, not just UI):
  User cannot advance to Payment without completing Shipping.
  The "Continue" button: runs validation before advancing.
  If any fields are invalid: do NOT advance. Show errors inline.
  
  VALIDATION TIMING (the UX nuance):
  "Show error on every keystroke" is wrong.
  User starts typing their name: "N". Error: "Name is required."
  The user is still typing! The error is premature. It feels adversarial.
  
  CORRECT APPROACH: progressive validation.
  FIRST visit to a field: validate on blur (when they leave the field).
  AFTER the first submission attempt: validate on change (they already know there's an error).
  React Hook Form: mode: "onBlur" for first visit. After first submit: switches to "onChange".
  
  WHERE to show errors: inline, below the field. NOT toast notifications.
  Toast: disappears after 3 seconds. User hasn't fixed the error yet. They submit again. Toast reappears. Frustrating cycle.
  Inline: always visible as long as the field is invalid. User can see what to fix.

SESSION RECOVERY:
  User fills out shipping details. Navigates to payment.
  Their phone rings. They close the browser tab.
  They come back: step 1 (Cart). All shipping details: gone. They start over.
  Many users: abandon at this point.
  
  SOLUTION: persist checkout state to localStorage.
  After EACH step advance: save the completed steps' data.
  On page load: check localStorage for a draft.
  If draft found (and not expired): restore state, advance to saved step.
  User: returns to exactly where they left off.
  TTL (time-to-live): 30 minutes. After 30 minutes: draft expires. Restart.
  
  WHAT GETS SAVED:
  Shipping form: fields (name, phone, address, city, zip).
  Step progress: which step the user was on.
  Cart state: already persisted to the server. Retrieved on refetch.
  
  WHAT DOES NOT GET SAVED:
  Payment details: NEVER. Card numbers: not stored client-side.

PAYMENT SECURITY:
  
  MISCONCEPTION: "We store card numbers in our database."
  REALITY: we never see raw card numbers. Here's how:
  
  1. User types card number in our input.
     The input: lives in our React component, in our domain.
     The value: exists in memory. Never sent to our backend.
  
  2. User clicks "Place Order".
     We call Stripe.js (the payment SDK): createPaymentMethod({ cardNumber, expiry, cvv }).
     Stripe.js: sends the card data DIRECTLY to Stripe's servers. Not through us.
     Stripe: tokenizes the card. Returns: a paymentMethodId.
  
  3. We send ONLY the paymentMethodId to our backend.
     POST /orders { paymentMethodId: "pm_1a2b3c4d", cartId: "c_xyz" }
     No card number. No expiry. No CVV. Never in our request logs.
  
  4. Our backend: creates a Stripe PaymentIntent with the paymentMethodId.
     Stripe: charges the card.
  
  PCI DSS: we are SAQ A compliant.
  SAQ A: the simplest compliance tier. Requires: no card data ever touches our servers.
  The Stripe.js integration: meets this requirement.
  Alternative (the wrong way): POST /payments { cardNumber: "4111..." } to our server.
    Our server: calls Stripe API with the card number.
    This: SAQ D. 300+ compliance requirements. Very expensive and complex.
  
  WE CHOSE STRIPE.JS: zero card data on our servers. SAQ A. Lowest risk.

DOUBLE-SUBMIT PREVENTION:
  
  User clicks "Place Order". Network is slow. Nothing happens for 1 second.
  User clicks "Place Order" again. Two requests sent. Two orders created.
  Customer gets two order confirmations. Customer service call. Refund.
  
  SOLUTION 1: Disable the button on click.
  setPlacing(true) → button: disabled + shows "Placing Order…".
  Cannot be clicked again until the request resolves.
  
  SOLUTION 2: Idempotency key.
  Headers: { "Idempotency-Key": `${sessionId}-${cartVersion}` }
  Server: stores the key with the created order.
  If the same key arrives again: server returns the SAME order, not a new one.
  
  WHY BOTH:
  Solution 1: prevents most cases.
  Solution 2: handles the edge case where the first request timed out and the user retried.
  The network: dropped the response. The server: processed the order.
  Without idempotency: the retry creates a second order.
  With idempotency: the retry gets back the first order's confirmation.
```

---

## 2️⃣ Internal Incident Reporting Tool

### Severity Triage · SLA Timers · Audit Timeline · MTTR Reduction −60%

---

```
THE PROBLEM — UNSTRUCTURED INCIDENT REPORTING

  AN ENGINEER DISCOVERS: Checkout page is returning 500 errors.
  
  WITHOUT THE TOOL (the antipattern):
  They post in #engineering Slack:
  "Hey, checkout seems broken for some users, can someone look?"
  
  Problems with this:
  No severity: is this affecting 1 user or 100,000 users?
  No scope: which part of checkout? Which users? Which regions?
  No assignee: who is responsible for fixing this? Everyone? No one?
  No timeline: when did it start? What changed recently?
  No SLA: when MUST this be resolved?
  No audit trail: post-incident review: "what did we do and when?" = unclear.
  
  Result:
  Engineers: spend 30 minutes triaging before they start fixing.
  Multiple engineers: each investigate independently. Duplicate work.
  Customer impact: extends because the response is disorganised.
  Post-incident review: "we're not sure exactly what happened when."
  
  WITH THE INCIDENT REPORTING TOOL:
  The engineer: opens the tool. Fills in the structured form.
  Mandatory fields: title, severity, affected system, initial diagnosis.
  Cannot submit without all required fields: enforces completeness.
  Creates the incident: auto-pages the right team. SLA timer starts.
  All engineers: share ONE incident record. No duplicate investigations.

SEVERITY TRIAGE — THE MOST IMPORTANT DECISION:

  P0 — CRITICAL:
    Definition: complete outage OR data loss.
    Examples: checkout page returning 500 for all users. Payment processing down.
    SLA: 15-minute response. Someone must acknowledge and start investigating within 15 minutes.
    Auto-page: on-call engineer + team lead + CTO notification.
    Why CTO?: P0 means users cannot buy. Every minute of P0: measurable GMV loss.
    The CTO: needs to know. May need to make resourcing decisions.
  
  P1 — MAJOR:
    Definition: significant user impact. >10% of requests affected.
    Examples: checkout 5× slower than normal. Cart failing for SG users only.
    SLA: 1-hour response.
    Auto-page: on-call engineer + team lead.
  
  P2 — MODERATE:
    Definition: partial degradation. <10% of requests. Workaround exists.
    Examples: coupon validation slow for some codes. Cart page p95 >8s on mobile.
    SLA: 4-hour response.
    Auto-page: on-call engineer.
  
  P3 — MINOR:
    Definition: low/no user impact. Nice-to-fix. Business hours only.
    Examples: a specific edge case in the checkout UI that affects <0.1% of users.
    SLA: 24-hour response. Slack message to team channel (not PagerDuty).
  
  WHY SEVERITY MATTERS FOR THE FRONTEND:
  The incident tool: the severity selection drives everything else.
  Wrong severity selection: wrong escalation, wrong SLA, wrong urgency.
  The tool: shows a description of what each severity means.
  "P0 = complete outage or data loss." Engineers cannot misclassify P0.
  If they're unsure: default to the HIGHER severity. Downgrade when confirmed.
  "It's better to over-escalate a P2 than to under-escalate a P0."

SLA TIMERS — WHY FRONTEND URGENCY MATTERS:

  The SLA timer: starts when the incident is created.
  Frontend: shows a countdown bar per incident.
  Green: >50% of SLA time remaining.
  Yellow: 20-50% of SLA time remaining.
  Red: <20% remaining (or SLA breached).
  
  WHY TRACK SLA ON THE FRONTEND (not just backend alerts):
  On-call engineer: has the incident tool open on their second monitor.
  They're working on the issue. The countdown: visible at all times.
  When the bar turns red: visceral urgency. They update the status.
  
  Behavioral observation:
  Before the timer was added: engineers would work on the issue without updating the incident status.
  Stakeholders (on-call manager, CTO): couldn't tell if the incident was being worked on.
  After the timer: engineers updated statuses regularly. The countdown motivated action.
  MTTA (Mean Time To Acknowledge): improved significantly with the visual timer.

MTTA AND MTTR — THE METRICS THAT MATTER:

  MTTA: Mean Time To Acknowledge.
    createdAt → first status update (open → investigating).
    Before the tool: MTTA ~35 minutes (engineers had to find the right Slack thread).
    After the tool: MTTA ~4 minutes (PagerDuty pages link directly to the incident).
  
  MTTR: Mean Time To Resolve.
    createdAt → status = "resolved".
    Before the tool: MTTR ~3.2 hours.
    After the tool: MTTR ~1.3 hours (−60%).
    
  WHY MTTR IMPROVED:
  1. Structured initial diagnosis: responders start from a brief, not a Slack thread.
     "Checkout returning 500 after the 14:30 deploy. Affected system: Checkout Service.
      Initial hypothesis: null pointer in coupon validation. Severity: P0."
     This brief: usually written by the person who first noticed the issue.
     They often have context the on-call engineer lacks. Now that context is captured.
  
  2. Single shared incident record: all engineers update the SAME timeline.
     No duplicate investigation. No "we both looked at the same logs."
  
  3. SLA urgency: engineers move faster when they can see time running out.

AUDIT TIMELINE — IMMUTABLE LOG:

  Every action: logged with actor name + timestamp.
    "INC-001 created at 09:00:00 by Alice. Severity: P0."
    "Auto-paged Platform Team via PagerDuty at 09:00:02."
    "Acknowledged by Bob (Platform) at 09:01:42."
    "Bob: Investigating checkout service logs. at 09:02:30."
    "Bob: Root cause found: null pointer after deploy. Rollback initiated. at 09:05:00."
    "INC-001 resolved at 09:08:15 by Bob."
  
  IMMUTABLE: cannot be edited after the fact.
  Post-incident review: "walk me through the timeline" = open the incident.
  
  Computed from the timeline:
  MTTA: 09:01:42 - 09:00:00 = 1m 42s.
  MTTR: 09:08:15 - 09:00:00 = 8m 15s.
  
  SLA compliance: P0 SLA = 15 minutes. MTTR = 8m 15s. Compliant.
  This data: feeds into the SLA compliance dashboard.
  Teams: can see their P0 MTTR trend over time.
  If trending up: there's a systemic problem (staffing, tooling, training).
  
AUTO-CREATED INCIDENTS (via webhooks):

  INC-002 in the demo: auto-created by a Sentry alert.
  Configuration: "If p95 latency > 8s for cart page: create P2 incident."
  Sentry: fires a webhook → POST /incidents.
  The tool: creates the incident with pre-configured severity and affected system.
  On-call engineer: gets paged with a link to the structured incident.
  They don't need to create it. They just need to investigate.
  
  Other sources: Datadog (infrastructure alerts), Grafana (custom thresholds).
  The tool: accepts webhooks from any monitoring system.
  Integration: standardizes ALL incident creation through one tool.
  No matter how the incident was detected: it's in the same place.
```

---

## STAR Scripts

### Cart & Checkout

```
SITUATION:
  The e-commerce platform's cart and checkout pages had friction:
  quantity updates that lagged, checkout state lost on navigation,
  and no protection against double-order submission.
  Cart abandonment was above industry benchmarks.

TASK:
  Implement and maintain key cart and checkout features with a focus on
  UX smoothness and correctness throughout the entire purchasing journey.

ACTION:
  Cart: implemented optimistic updates (immediate UI + background sync + rollback on failure).
  Cross-tab sync: localStorage + StorageEvent to prevent overselling.
  Stock warnings: inline "Only N left" using data from the cart endpoint (no extra API call).
  Coupon validation: server-side with specific error messages (not "Invalid" for all cases).
  Checkout wizard: 4-step flow with progressive validation (onBlur first, onChange after submit).
  Session recovery: persist checkout state to localStorage, restore on page load (30-min TTL).
  Payment security: Stripe.js tokenization, paymentMethodId only sent to our backend. SAQ A compliant.
  Double-submit: button disabled on click + idempotency key in order request headers.

RESULT:
  Cart: feels instant. Stock warnings drove measurable conversion lift (+8% measured for "last N" pattern).
  Zero double-order incidents since idempotency key implementation.
  Session recovery: checkout abandonment on "Back" navigation reduced by ~25%.
```

### Incident Reporting Tool

```
SITUATION:
  Incident response was unstructured. Engineers posted in Slack.
  No consistent severity. No clear assignee. No audit trail.
  MTTA ~35 minutes. MTTR ~3.2 hours.
  Post-incident reviews: inconsistent because the timeline wasn't captured.

TASK:
  Build an internal incident reporting tool to streamline the incident process,
  reduce response times, and capture structured data for post-incident reviews.

ACTION:
  Incident form: mandatory structured fields (title, severity, system, initial diagnosis).
  Severity triage: P0–P3 with SLA definitions displayed inline.
  Auto-page: on incident creation, page the right team based on severity via PagerDuty.
  SLA countdown: visual timer per incident (green → yellow → red), updates every second.
  Status transitions: Open → Investigating → Mitigated → Resolved.
  Audit timeline: immutable log of every action with actor and timestamp.
  Auto-creation: webhook endpoint for Sentry/Datadog/Grafana to create structured incidents.

RESULT:
  MTTA: 35 minutes → 4 minutes.
  MTTR: 3.2 hours → 1.3 hours (−60%).
  Post-incident reviews: all questions answered by the immutable timeline.
  SLA compliance: trackable and reportable. P0 compliance rate: from unmeasured to 94%.
```

---

## Follow-up Q&A

**"What's an optimistic update and when do you use it?"**
> "An optimistic update is when you update the UI immediately, before the server confirms the change — optimistically assuming the server will accept it. When the server responds, if it confirms, you do nothing. If it rejects, you roll back to the state before the update. You use it when the operation succeeds the vast majority of the time, and when the perceived latency of waiting for the server confirmation meaningfully hurts the user experience. Cart quantity changes: perfect candidate. They succeed almost always, and a 300-500ms lag makes the cart feel broken. Order submission: NOT a candidate. The consequences of an incorrect optimistic update (showing 'Order placed' when the payment failed) are too severe."

**"How do you prevent double order submission?"**
> "Two layers. First: disable the button immediately when clicked and show 'Placing Order…'. This prevents the 99% case where the user double-clicks. Second: include an idempotency key in the order request header — a unique key derived from the session ID and cart version. The server: stores the key with each created order. If the same key arrives again (network retry after a timeout), the server returns the original order ID instead of creating a new order. This handles the 1% edge case where the first request was processed but the response was lost in transit."

**"How do you validate a checkout form?"**
> "Progressive validation. On the first visit to a field: validate on blur (when the user leaves the field). Not on every keystroke — showing 'Field is required' while someone is still typing their name is alarming. After the first form submission attempt: switch to validating on change. The user already knows there's an error. Seeing it update as they fix it: helpful, not alarming. React Hook Form has a mode option that supports exactly this pattern. Errors: displayed inline, below the field. Not toast notifications — those disappear before the user fixes the error."

**"Why do you track SLA timers on the frontend for incidents?"**
> "Behavioral engineering. The on-call engineer has the incident tool open. The visual SLA countdown — turning from green to yellow to red — creates felt urgency. Before we added the timer, engineers would work on the issue without updating the incident status. Stakeholders couldn't tell if anyone was responding. After the timer: status updates became more frequent, because the countdown made the stakes visible. MTTA dropped significantly. The backend already enforces SLAs by sending second-page notifications on breach. The frontend timer: changes engineer behavior BEFORE the breach, not after."

**"What's the difference between MTTA and MTTR?"**
> "MTTA is Mean Time To Acknowledge: the time from when an incident is created to when an engineer first acknowledges it and starts working. It measures: how fast does the team respond? MTTR is Mean Time To Resolution: the time from incident creation to resolution. It measures: how fast does the team fix it? You need both. A team can have great MTTA (fast acknowledgment) but poor MTTR (slow fix) — they're responsive but ineffective. Or great MTTR (fast fix once they start) but poor MTTA (slow to notice or start). With the incident tool: both are computed directly from the audit timeline, so they're factual, not estimated."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built the cart page" | "**Cart engineering** at high-velocity e-commerce: optimistic updates (update UI immediately + rollback pattern if server rejects — specific state snapshot approach), race conditions from rapid +/- clicks (debounce so only one request after user stops clicking), cross-tab sync via localStorage+StorageEvent (prevents overselling when user has two tabs), stock warnings from cart endpoint not separate API call (+8% conversion lift from urgency), coupon server-side validation with specific error messages (not just 'Invalid')." |
| "I built the checkout" | "**4-step checkout wizard**: progressive validation (onBlur first visit/onChange after first submission attempt — React Hook Form pattern, inline errors not toast), session recovery (localStorage draft per step with 30-min TTL, user returns to exact step), payment security (Stripe.js tokenization: card data goes directly to Stripe servers, we send only paymentMethodId, PCI DSS SAQ A compliant), double-submit prevention (button disabled immediately + idempotency key: sessionId+cartVersion so server returns same order on retry)." |
| "I built an incident tracker" | "**Operational tooling** that reduced MTTR by 60%: structured form with mandatory severity+system+initial diagnosis (responder starts from contextualised brief not Slack thread), P0–P3 triage (P0=complete outage SLA 15min auto-page CTO/lead/on-call / P1=major SLA 1hr / P2=moderate SLA 4hrs / P3=minor SLA 24hrs), frontend SLA countdown timer changes engineer behavior (engineers update status faster when they see time running out), immutable audit timeline computes MTTA+MTTR from events, webhook auto-creation from Sentry/Datadog for monitoring-detected incidents." |

---

## 📊 Quick Facts

```
ACHIEVEMENT 1: CART & CHECKOUT
  Domain:   E-commerce purchasing journey (cart abandonment rate: 70%+ industry avg)
  Cart:     Optimistic updates + rollback pattern, rapid-click debounce, cross-tab sync
  Coupons:  Server-side validation, specific error messages per failure mode
  Stock:    Inline warnings from cart endpoint (no extra API), +8% conversion on scarcity
  Checkout: 4-step wizard, progressive validation (onBlur→onChange), session recovery (30-min draft)
  Payment:  Stripe.js tokenization, paymentMethodId only, PCI DSS SAQ A, idempotency keys
  Result:   Zero double-orders since idempotency. −25% checkout abandonment on back-navigation.

ACHIEVEMENT 2: INCIDENT REPORTING TOOL
  Domain:   Internal operational tooling for engineering on-call workflow
  Severity: P0/P1/P2/P3 triage with SLA definitions (15min/1hr/4hr/24hr)
  Paging:   Severity-driven auto-page (P0=CTO+lead+on-call, P1=lead+on-call, P2=on-call)
  Timer:    Frontend SLA countdown (green→yellow→red) — changes engineer behavior
  Timeline: Immutable audit log (actor+timestamp per action), MTTA+MTTR computed from events
  Webhooks: Auto-creation from Sentry/Datadog/Grafana → structured incident, zero manual work
  Result:   MTTA 35min→4min. MTTR 3.2hr→1.3hr (−60%). P0 SLA compliance: from unmeasured to 94%.
```

---

*Document last updated: June 2026 · E-commerce Cart & Checkout · Incident Reporting Tool interview preparation*
