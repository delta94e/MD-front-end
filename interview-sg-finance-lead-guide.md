# 🇸🇬 Interview Guide — Singapore Financial Super-App Engineering Lead
## Leading 9 Engineers · App Store Rankings · A/B Testing

---

## 🔑 Context: What This Role Actually Is

```
WHAT "ENGINEERING LEAD FOR A 9-PERSON TEAM" MEANS:
  
  Not a manager (no HR, compensation, performance reviews — that's the manager's job).
  Not just a senior developer (not the best individual contributor on the team).
  
  Engineering Lead = Technical accountable owner.
  If the architecture is wrong: I own the fix.
  If the team is consistently slow: I diagnose why and change it.
  If a senior engineer makes a decision that creates technical debt: I caught it in RFC review.
  
  THE CORE SHIFT FROM IC TO LEAD:
  As an IC: I write the best code.
  As a lead: I set up conditions where 9 engineers consistently write great code.
  
  A 30-minute code review that teaches a senior engineer a pattern
  they'll use in every PR for the next year: that's 100× more valuable
  than spending that 30 minutes writing code myself.
  
  This is "amplify, not replace."
  
  THE MEASUREMENT OF A LEAD:
  Bad signal: "I did X." (An IC says this.)
  Good signal: "My team shipped X. Here's how I enabled it."
  The best signal: "Junior A joined 6 months ago knowing nothing about PayNow integration.
  Today, they designed and shipped the payment retry logic independently. I reviewed it."
  That growth is the output of good engineering leadership.
```

---

## 1️⃣ Leading 9 Engineers — Singapore Fintech Super-App

### Team Structure · Ceremonies · Singapore Market Specifics

```
THE PRODUCT: SINGAPORE FINTECH SUPER-APP (Alipay-equivalent)
  
  Singapore's financial ecosystem:
  - PayNow: national instant payment rail (by mobile number or NRIC, not account number)
  - NETS: local card payment network
  - DBS, OCBC, UOB, Maybank: the major banks users link to
  - MAS (Monetary Authority of Singapore): the regulator
  
  The app: peer-to-peer transfers, QR payments (merchant and peer), bill payments
  (SP Group utilities, Singtel, StarHub), top-up from bank, insurance products, investments.
  
  Similar to Alipay in scope: payments + wealth + insurance in one super-app.
  Singapore-specific: must integrate with PayNow, comply with MAS regulations.

TEAM OF 9 — STRUCTURE AND RATIONALE:
  
  Tech Lead (Staff):         Architecture, performance, cross-team unblocking, hiring bar-raiser
  Senior A (Payments Core):  PayNow integration, FAST payment rail, transfer idempotency
  Senior B (Auth/Security):  Biometric auth, MAS KYC compliance, token management, jailbreak detection
  Senior C (QA Lead):        Test strategy, release cadence, regression suite, incident response
  Mid A (QR & Scan):         QR generation/scan, merchant payment flow, NFC tap-to-pay
  Mid B (Bill Pay):          Utilities integration, recurring payments, invoice parsing
  Mid C (Wallet & Top-Up):   Balance display, top-up from bank, withdrawal, transaction history
  Junior A (UI Components):  Design system, accessibility (WCAG AA), animations
  Junior B (Test Automation): Detox E2E tests, Jest unit tests, coverage tracking
  
  WHY DOMAIN OWNERSHIP (not feature-team ownership):
  
  Alternative: 3 cross-functional squads (Payments squad, Wallet squad, UX squad).
  Each squad: full stack, owns features end-to-end.
  
  For a 9-person mobile team: squads add coordination overhead.
  9 engineers / 3 squads = 3 per squad. Too small to be self-sufficient.
  
  Domain ownership: each engineer owns an area of the codebase.
  They are the expert. PRs in their domain: they are the primary reviewer.
  
  WHY THIS WORKS:
  - Accountability: "Who broke the QR scanner?" → Mid A. Clear.
  - Expertise accumulation: Mid A has worked on QR for 6 months. Deep context.
  - No "I don't know who owns this": every file has an owner in CODEOWNERS.

ENGINEERING CEREMONIES:
  
  SPRINT PLANNING (every 2 weeks, 1 hour):
  Format: each engineer proposes their next sprint goals.
  NOT: I assign tasks. THEY propose. I challenge: "Is this realistic given the on-call rotation?"
  Dependencies surfaced: "Senior B's KYC API affects Mid A's QR payment flow."
  Dependencies logged: blocker tracked. Daily check: is the blocker resolved?
  
  TECH SYNC (weekly, 30 minutes):
  Agenda: pending RFCs, architecture decisions, shared concerns.
  Examples: "How do we handle network timeout for transfer in poor connectivity?"
            "Should we adopt React Query or keep custom fetch logic?"
  Decision made → logged in the tech wiki. Not in Slack (Slack is ephemeral).
  
  1:1 MEETINGS (bi-weekly, 30 minutes per engineer):
  NOT status updates (those are in standup).
  Topics: growth aspirations, challenges, feedback (bi-directional — I get feedback too),
          "What's one thing I do that slows you down?" (asked every quarter).
  
  DEMO DAY (end of sprint):
  Engineers demo what they shipped. NOT me demo-ing for them.
  Why: ownership signal. If they demo it, they own it fully.
  Engineers who demo well learn to think about user perspective, not just code.
  
  RFC PROCESS (Request for Comments):
  Any technical decision affecting > 1 engineer: write an RFC.
  Template:
  - Problem: what are we solving?
  - Options considered: what did we evaluate?
  - Proposed solution: what are we doing?
  - Trade-offs: what are we NOT getting with this choice?
  - Decision: final decision + date + author
  
  Engineers comment on RFC async. 48-hour comment period.
  Then: decision. If consensus → straightforward. If disagreement → tech sync.
  Result: no "why did we do X?" 6 months later. It's documented.
  No: "I thought we discussed this" debates. Everything is written.

HIRING AS BAR-RAISER:
  
  Role: for every candidate the team interviews, I'm the bar-raiser.
  Bar-raiser: a second opinion who can veto a hire even if the team wants to proceed.
  
  What I look for:
  NOT: "Is this the best coder in the room?"
  YES: "Will this person make the engineers around them better?"
  
  A senior engineer who mentors juniors, writes good comments, explains their thinking
  in code reviews = more valuable than a senior engineer who produces great code alone.
  
  Interview approach: technical depth + communication quality.
  Can they explain complex things simply? (If you can't explain it simply: you don't understand it.)
  Do they say "I don't know" cleanly, or do they bullshit?
  Do they ask good clarifying questions, or do they rush to code?

SINGAPORE MARKET SPECIFICS:
  
  PAYNOW (what makes SG payments unique):
  PayNow: Singapore's national instant payment system.
  Transfers by: mobile number (+65 XXXX XXXX) or NRIC/FIN (national ID).
  NOT by: bank account number (like traditional wire transfers).
  
  The app's PayNow integration:
  User enters: +65 9123 4567
  App queries: PayNow proxy registry API → resolves to: "DBS Bank, account ****4892, name: TAN AH KENG"
  User confirms: name and bank shown. User must see the resolved name before confirming.
  
  WHY THIS MATTERS FOR THE UI:
  If user types a mobile number with a typo: PayNow proxy may resolve to a DIFFERENT real person.
  Design decision: always show the resolved name prominently. Bold. Large font.
  "You are sending to: TAN AH KENG (DBS, ****4892)."
  User must explicitly confirm the name. NOT just the amount.
  This is a UX decision driven by regulatory guidance and real user errors we saw in testing.
  
  MAS REGULATORY REQUIREMENTS:
  
  MAS Notice PSN01: Strong Customer Authentication (SCA).
  SCA required when:
  - Adding a new payee (new person receiving money for the first time)
  - Transaction amount exceeds SGD 1,000
  
  SCA means: biometric (FaceID / fingerprint) OR one-time password (OTP). NOT password alone.
  
  Implementation:
  const requireSCA = (context: TransferContext): boolean =>
    context.amount > 1000 || context.isNewPayee;
  
  If requireSCA: trigger biometric prompt. If biometric fails/unavailable: SMS OTP.
  Backend validates: transfer request includes SCA proof. No SCA proof → rejected.
  The check is BOTH frontend (UX gating) and backend (security).
  Frontend: for UX. Backend: for security (frontend can be bypassed by technical users).
  
  AML (ANTI-MONEY LAUNDERING):
  MAS: financial institutions must monitor for suspicious activity.
  Transactions > SGD 5,000: flagged for internal review system (asynchronous).
  
  UX decision: user sees "Transfer submitted. We're processing it."
  NOT: "Your transfer is under review." (creates anxiety, support calls)
  Internal: compliance team reviews flagged transactions within 24 hours.
  If cleared: transfer completes. If flagged: compliance team contacts the user.
  
  DATA RESIDENCY:
  MAS regulations: financial transaction data must remain within Singapore.
  All production databases: AWS ap-southeast-1 (Singapore region).
  No cross-border data replication for financial transaction records.
  Engineering decision: backend teams must use the correct AWS region.
  I enforced this via infrastructure-as-code templates: region is hardcoded, not configurable.
  Accidental misconfiguration is not possible.
```

---

## 2️⃣ Performance Optimizations → App Store Rankings

### Cold Start −58% · Bundle −62% · FPS 42→60 · Rating 4.1→4.6

```
THE CONNECTION BETWEEN PERFORMANCE AND APP STORE RANKINGS:
  
  Many engineers think: "App store rating = user reviews."
  Reality: ranking algorithm factors BOTH user reviews AND technical metrics.
  
  Google Play Store ranking factors (confirmed by Google documentation):
  - ANR (Application Not Responding) rate: UI thread frozen > 5 seconds.
    If ANR rate > 2%: Play Store suppresses the app in search results.
    Our ANR rate before optimization: 1.8% (below threshold, but close).
    After: 0.3%. Direct impact: search ranking improved. More organic installs.
  - Crash rate: apps with high crash rates are downranked.
  - Startup time: Play Store measures and factors this in (since Android 14 signals).
  
  Apple App Store ranking factors:
  - Crash reports (via Xcode Organizer → App Store connects).
    More crashes → Apple may show warnings in search results.
  - User reviews: if users mention "slow" or "crashes": review sentiment analyzed.
  
  HOW RATING WENT FROM 4.1 TO 4.6:
  Not by asking users to rate. By fixing what they were complaining about.
  
  Reviews before optimization: "App is slow." "Freezes when scrolling transactions." "Crashes every few days."
  After optimization: "Much smoother." "Finally fixed the lag." "No crashes in months."
  
  The reviews changed because the app changed. The rating followed.
  A 4.6 rating from genuine improvement converts at higher rates than 4.6 from incentivized reviews.

OPTIMIZATION 1: JS BUNDLE SPLITTING (biggest single win)
  
  PROBLEM:
  React Native: compiles JavaScript to a single bundle.
  Before: one bundle containing ALL screens: Home, QR Pay, Bill Pay, Transfer, Settings, KYC, Profile.
  Bundle size: 8.4 MB.
  On cold start: device downloads + parses 8.4 MB of JavaScript before showing anything.
  Cold start time: 4.2 seconds on a mid-range Android.
  4.2 seconds: users quit. "This app is slow." One-star review.
  
  SOLUTION: Dynamic import per route.
  Only the critical path (Home + Auth screens) loaded at startup.
  Every other screen: loaded on first navigation.
  
  const QRPayScreen  = React.lazy(() => import("./screens/QRPayScreen"));
  const BillPayScreen = React.lazy(() => import("./screens/BillPayScreen"));
  const TransferScreen = React.lazy(() => import("./screens/TransferScreen"));
  
  Startup bundle: Home + Auth + navigation shell. ~3.2 MB.
  User opens the app: 1.78 seconds to first meaningful content.
  When user navigates to QR Pay: QR Pay bundle loads (typically < 300ms on WiFi).
  First-time navigation: 300ms delay (acceptable). Every subsequent navigation: from cache.
  
  Cold start: 4.2s → 1.78s (−58%).
  
  ADDITIONAL WIN: smaller startup bundle = less JS to parse.
  JavaScript parsing is CPU-bound. Older phones: parsing 8.4MB takes longer.
  Mid-range Android (target market): the improvement was even more dramatic.

OPTIMIZATION 2: FLATLIST VIRTUALIZATION
  
  PROBLEM:
  Transaction list: users accumulate thousands of transactions.
  React Native's FlatList (if misconfigured): renders ALL items in the DOM.
  1,000 items × (image + text + divider): massive memory pressure.
  Result: 42 FPS (noticeable janky scrolling). Memory: 320MB P90.
  
  AFTER (properly configured FlatList):
  <FlatList
    data={transactions}
    renderItem={renderItem}              // wrapped in React.memo — prevents unnecessary re-renders
    keyExtractor={t => t.id}             // STABLE: must be a string, must not change between renders
    getItemLayout={(_, index) => ({      // eliminates measurement — FlatList doesn't measure items
      length: ITEM_HEIGHT,               // known fixed height
      offset: ITEM_HEIGHT * index,       // exact position of each item
      index,
    })}
    maxToRenderPerBatch={10}             // render at most 10 items per JS frame (prevents stuttering)
    windowSize={5}                       // render ±2 viewport heights above/below visible area
    removeClippedSubviews={true}         // unmount items more than 2 viewports away from visible
    initialNumToRender={12}              // only render what's visible at startup
  />
  
  Result: 60 FPS (smooth). Memory: 175MB P90 (−45%).
  
  THE MOST IMPORTANT PROPERTY: getItemLayout.
  Without it: FlatList must measure the height of every item when it scrolls into view.
  Measurement is synchronous on the main thread.
  1,000 items: 1,000 measurements = dropped frames = janky scroll.
  With getItemLayout: FlatList knows the position of every item in advance. Zero measurement.
  
  PRECONDITION: all items must be the SAME height. Variable height: cannot use getItemLayout.
  Our transaction items: designed to be fixed height. This was an intentional design constraint.

OPTIMIZATION 3: IMAGE CACHE (LRU EVICTION)
  
  PROBLEM:
  Transaction list: each transaction shows a merchant logo or user profile photo.
  React Native's built-in Image: no disk caching. Re-fetches on every mount.
  Scroll down → items unmounted. Scroll up → items re-mounted → images re-fetched.
  Result: constant network requests for images the user has already seen.
  
  SOLUTION: react-native-fast-image (or custom image caching layer).
  LRU (Least Recently Used) cache: 50MB on disk.
  When cache fills: the image last accessed the longest ago is evicted.
  
  Result: after the first scroll-through of the transaction list:
  all merchant logos and profile photos are cached locally.
  Subsequent scrolls: zero network requests for images. Near-instant display.
  
  Memory optimization: the LRU cache also prevents unbounded memory growth.
  Without LRU: images accumulate indefinitely. Eventually: OOM (Out of Memory) crash.
  With LRU: memory stays within 50MB for images.

OPTIMIZATION 4: MEMORY LEAK FIXES (crash-free sessions 96.1% → 99.3%)
  
  The 3.9% crash rate came from three root causes:
  
  1. ANDROID OOM (Out of Memory) CRASH:
     Large bitmap loaded without sub-sampling: high-resolution merchant logo loaded at full resolution.
     On devices with 1GB RAM: OOM crash when 10+ large images loaded simultaneously.
     Fix: specify resizeMode="contain" + explicit width/height bounds. FastImage respects bounds.
     Android sub-sampling: large images decoded at a fraction of their full resolution.
  
  2. NULL-CHECKED NAVIGATION PARAMS:
     Screen A: passes params to Screen B via navigation.navigate().
     Bug: Screen B accessed params without checking for null.
     Scenario: deep link opens Screen B directly (no Screen A) → params undefined → crash.
     Fix: destructure with defaults: const { amount = 0, recipientId = "" } = route.params ?? {};
  
  3. ASYNC RACE CONDITION:
     User starts a transfer. Navigation animates to confirmation screen.
     User rapidly taps "Back" during the animation.
     Component unmounts → async call resolves → setState called on unmounted component → crash.
     Fix: useEffect cleanup + AbortController:
     useEffect(() => {
       const controller = new AbortController();
       fetchTransferStatus({ signal: controller.signal });
       return () => controller.abort();
     }, []);
```

---

## 3️⃣ A/B Tested UX Updates — Data-Informed Decisions

### 4 Experiments Shipped · Statistical Rigor · Guardrail Metrics

```
WHY A/B TESTING IN A FINANCIAL APP IS HARDER THAN USUAL:
  
  In a typical app: wrong variant = wrong button color. Annoying, easily rolled back.
  In a financial app: wrong variant = wrong transfer confirmation flow.
  User could confirm and send money to the wrong person.
  Regulatory implication: MAS may require incident reporting.
  
  Therefore: A/B testing in a financial app requires additional safeguards
  that most apps don't need.

THE A/B TESTING INFRASTRUCTURE:
  
  EXPERIMENT SCOPE LIMITS:
  Every experiment: declared scope type.
  
  "UI_ONLY": only visual/layout changes. Button color, spacing, typography.
  "FLOW": can modify steps in a user flow. Cannot change amounts, recipients, or security steps.
  "COPY": text changes only. Button labels, instructional text.
  
  The backend: validates experiment configs against declared scope.
  A "UI_ONLY" experiment cannot modify which API calls are made.
  A "FLOW" experiment cannot remove a security step (biometric prompt) from the flow.
  This prevents a poorly designed experiment from compromising security.
  
  GUARDRAIL METRICS:
  Every experiment: one PRIMARY metric (what we're trying to improve)
  AND multiple GUARDRAIL metrics (what we must not worsen).
  
  Transfer Confirmation A/B test:
  Primary:    transfer completion rate (want to increase)
  Guardrails: error rate, wrong-recipient reports, support ticket volume
  
  Guardrail rule: if any guardrail metric worsens by >5% relative to control:
  experiment automatically pauses. Alert fires. Investigation required.
  
  This is a kill switch. No engineer needs to monitor 24/7.
  The system detects the problem and stops the experiment.
  
  DETERMINISTIC VARIANT ASSIGNMENT:
  User is assigned to a variant server-side, at login.
  Assignment persisted in user profile.
  
  NOT: assigned randomly on each page load.
  
  Why deterministic matters:
  If a user sees Variant B on Page 1 but Variant A on Page 2: inconsistent experience.
  They may see Variant B (new grid layout) on home, but Variant A (old list) on a sub-page.
  The experience makes no sense. The data is polluted (user saw both variants).
  
  Deterministic assignment via murmurhash:
  const hash = murmurhash(userId + experimentId) % 100;
  const variant = hash < splitPercentage ? "treatment" : "control";
  
  Same userId + experimentId → same hash → same variant. Always.
  Even if the app is reinstalled. Even on a new device. Same user → same variant.

STATISTICAL RIGOR:
  
  MINIMUM SAMPLE SIZE (calculated BEFORE starting):
  Power analysis inputs:
  - Minimum detectable effect: 5% relative improvement
  - Statistical power: 80% (probability of detecting a real effect if it exists)
  - Significance level: α = 0.05 (false positive rate)
  
  These inputs determine: how many users we need per variant.
  We calculate this before starting. We run the experiment until we reach N.
  
  DO NOT STOP EARLY (the peeking problem):
  Temptation: "We've run 5 days. Variant B is already winning. Ship it!"
  Problem: if you check results mid-experiment and stop when significant, you inflate false positives.
  
  Illustration: flip 10 coins. By random chance, you might see 8 heads early.
  If you stop then: "heads is more likely!" But it's just random early noise.
  Continue to 100 flips: converges to 50/50.
  
  A/B tests work the same way. Early "significance" is often noise.
  Run until your pre-calculated N. Then analyze. Once.
  
  INTERPRETATION: p-value < 0.05:
  p-value: probability that the observed difference (or greater) would occur by random chance.
  p = 0.003: there is a 0.3% chance this difference is random noise. 99.7% likely: real effect.
  p < 0.05: conventional threshold for "statistically significant."
  NOT: "proof" that the effect is real. A 5% false positive rate means 1 in 20 experiments
  will show a "significant" result by chance. This is why we have guardrails.

THE 4 SHIPPED EXPERIMENTS:
  
  1. HOME SCREEN LAYOUT (Grid vs. List) — +12.6% 7-day transaction rate:
  Hypothesis: A grid of feature tiles increases feature discovery.
  Why: the list layout showed 4 features. The grid showed 8 in the same space.
  Result: grid users transacted more (7-day transaction rate: 34.2% → 38.5%).
  Decision: shipped grid. Business impact: more transactions = more revenue.
  Interesting: the effect was stronger for NEW users (more to discover) than returning users.
  
  2. TRANSFER CONFIRMATION (2-step vs. 1-step) — +18% completion rate:
  Hypothesis: the review screen is redundant. User already confirmed on the previous screen.
  Risk: removing a review step might increase accidental sends.
  Guardrail: wrong-recipient complaint rate.
  Result: completion rate: 61.8% → 72.9%. Wrong-recipient rate: unchanged (0.02% delta, noise).
  Decision: shipped 1-step confirm. The review screen was friction without safety benefit.
  Important: we monitored wrong-recipient complaints for 30 days post-ship. No increase.
  
  3. PUSH NOTIFICATION TIMING (9 AM vs. 8 PM) — +31% open rate:
  Hypothesis: Singapore working professionals (majority of users) are busy at 9 AM.
  They see the notification but don't have mental bandwidth to act on it.
  At 8 PM: dinner/evening. More likely to open and act.
  Result: open rate: 18.4% → 24.1%. 30-day retention: +2.3%.
  Decision: shifted all non-urgent notifications to 8 PM.
  "Non-urgent": transaction summaries, offers, reminders. NOT: fraud alerts (those are immediate).
  
  4. ONBOARDING FLOW LENGTH (5-step vs. 3-step) — +8.6% completion:
  Hypothesis: 5-step onboarding has too much friction.
  What was removed: 2 screens asking for optional information (investment preferences, referral source).
  Risk: we might lose valuable data about user preferences.
  Guardrail: 30-day KYC fraud rate (removing steps might attract fraudsters who quit at friction).
  Result: completion rate: 67.3% → 73.1%. Fraud rate: unchanged.
  Decision: shipped 3-step. Moved optional data collection to in-app prompts post-onboarding.
  Better: users complete onboarding, THEN are asked for preferences when they're engaged.

A/B TESTING PHILOSOPHY:
  "A/B testing is not about running experiments. It's about making better decisions than your gut."
  
  Your intuition: "users want a simpler confirmation screen."
  The data: agrees (completion +18%).
  But: your intuition also said "removing the step will increase wrong sends."
  The data: disagrees (wrong-recipient rate unchanged).
  
  A/B testing separates what you believe from what is true.
  In a financial app: belief-driven decisions can harm users. Data-driven decisions protect them.
```

---

## STAR Scripts

### Leading 9 Engineers

```
SITUATION:
  Building a Singapore fintech super-app (Alipay-equivalent) from early stage.
  Team grew from 4 to 9 engineers over 8 months. Coordination overhead grew.
  Engineers were blocking each other. No clear ownership. Architecture decisions
  made verbally in Slack → forgotten or disputed 3 months later.

TASK:
  Become the engineering lead: define team structure, ownership model, and ceremonies
  to enable 9 engineers to ship fast with high quality and low friction.

ACTION:
  Established domain ownership (CODEOWNERS). Implemented RFC process for cross-cutting decisions.
  Set weekly tech sync, bi-weekly 1:1s (growth-focused, not status), and sprint demo day
  (engineers present their own work). Defined Singapore-specific architecture requirements:
  PayNow proxy integration, MAS SCA enforcement, AML pipeline, data residency.

RESULT:
  Team ships consistently. No "who owns this?" questions. RFC log: 23 decisions documented,
  0 ownership disputes in 6 months. Junior A progressed from component work to owning
  the full transfer retry logic independently. That growth is the actual output.
```

### Performance → App Store Rankings

```
SITUATION:
  Cold start time: 4.2 seconds on mid-range Android. FPS during transaction list scroll: 42.
  ANR rate: 1.8% (close to Play Store's suppression threshold of 2%).
  App Store rating: 4.1 with reviews mentioning "slow" and "freezes."

TASK:
  Profile and optimize the app to improve real user experience and App Store ranking metrics.

ACTION:
  Profiled with Android Profiler + Flipper. Top issues: (1) 8.4MB monolithic JS bundle parsed at startup,
  (2) FlatList without getItemLayout (measuring 1,000+ items on scroll), (3) no image cache (re-fetching
  on every mount), (4) 3 crash categories (OOM, null navigation params, async race condition).
  Implemented: dynamic imports per route, FlatList virtualization with getItemLayout, FastImage LRU cache,
  and specific bug fixes for each crash category.

RESULT:
  Cold start: 4.2s → 1.78s (−58%). FPS: 42 → 60. Crash-free sessions: 96.1% → 99.3%.
  ANR rate: 1.8% → 0.3% (well below Play Store suppression threshold).
  App Store rating: 4.1 → 4.6 (driven by genuine improvement, not incentivized reviews).
```

---

## Follow-up Q&A

**"How do you make architectural decisions when 9 engineers have different opinions?"**
> "The RFC process handles this. When there's a disagreement, I ask whoever has the strongest opinion to write it up as an RFC. Problem, options, proposed solution, trade-offs. The act of writing it reveals the assumption gaps. Someone says 'we should use React Query' — great, write the RFC. Compare it to our current approach. What do we gain? What do we lose? Then everyone reads it and comments with their objections written down. A written objection requires more precision than a verbal one. 'I don't like it' doesn't hold up when you have to write it with reasoning. In my experience: 70% of disagreements resolve in the RFC writing process because the person realizes their assumption was wrong. The other 30%: we discuss in tech sync. Decision logged. Disagreement recorded but closed. We move forward."

**"How did you know JS bundle splitting would be the biggest win?"**
> "Profiling told us. I used Android Profiler's CPU profiling mode and captured a startup trace. The startup was dominated by 'JavaScript parse and execute' — a single 8.4MB JavaScript bundle taking 2.8 seconds to parse before any React code ran. That 2.8s was the low-hanging fruit. Everything else (image loading, API calls, component rendering) happened after the JS was parsed. Fix the parse time: everything else improves proportionally. The lesson: don't guess what to optimize. Profile first. The thing you think is slow is usually not the bottleneck."

**"What did you learn from A/B testing that surprised you most?"**
> "The push notification timing experiment. I expected maybe 5-10% improvement. We got 31%. The insight: the timing of a communication matters as much as the content. The same message at 9 AM and at 8 PM produces completely different outcomes. People are in 'receive mode' at different times of day. For a financial app, this has downstream effects: users who open push notifications are more likely to check their balance, initiate a transfer, or click a promotion. A 31% open rate improvement compounds into meaningful business impact. The second surprise was how clear the data was: p < 0.0001 at 31,200 users. That's not a borderline result — it was a definitive signal within 2 weeks of running."

**"How did you ensure MAS compliance without it slowing down feature delivery?"**
> "By treating compliance requirements as architecture constraints from day one, not as checkboxes at the end. SCA is not implemented as 'add a biometric check before transfer.' It's implemented as a requireSCA() function that returns a boolean based on the transfer context — amount, payee novelty. Every transfer flow calls this function. New flows automatically get compliance by default. The same for data residency: the AWS region is hardcoded in our infrastructure templates. Nobody can accidentally deploy to the wrong region. Compliance baked into defaults is cheaper than compliance as a review step. The alternative — compliance review at the end — creates last-minute blockers. We had zero compliance-related late discoveries in 12 months of development."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I led a team of 9 engineers" | "**Engineering Lead** (technical owner, not manager). Key shift: from 'I write best code' to 'I set conditions for 9 engineers to write great code'. **Domain ownership** (not task ownership): each engineer owns an area (Payments/Auth/QR/Bills/Wallet/UI/QA), CODEOWNERS enforced, eliminates 'who owns this?'. **RFC process**: any decision affecting >1 engineer → Problem/Options/Proposed/Trade-offs/Decision written down, async comments, logged. 23 RFCs in 6 months, 0 ownership disputes. **1:1 cadence**: growth-focused (not status), includes 'what do I do that slows you down?' quarterly." |
| "I improved app performance" | "**6 specific optimizations with numbers**: (1) JS bundle splitting: 8.4MB→3.2MB, dynamic import per route, cold start 4.2s→1.78s (−58%). (2) FlatList: getItemLayout eliminates measurement, renderItem memoized, windowSize=5, removeClippedSubviews, FPS 42→60. (3) FastImage LRU 50MB cache: eliminated re-fetches on remount. (4) 3 crash fixes: OOM (image bounds), null nav params (default destructure), async race (AbortController cleanup). **Result**: crash-free 96.1→99.3%, ANR 1.8→0.3%, **Play Store ANR threshold is 2%** (our 1.8% was near-suppression), rating 4.1→4.6 from genuine improvement." |
| "I ran A/B tests for UX" | "**4 shipped experiments**: Home Layout (grid vs list +12.6% 7-day tx rate/24,800 users/p=0.003), Transfer Confirm (2-step vs 1-step +18% completion/guardrail: wrong-recipient rate unchanged), Push Timing (9AM vs 8PM +31% open rate→+2.3% 30-day retention), Onboarding (5-step vs 3-step +8.6% completion/guardrail: fraud rate unchanged). **Financial app A/B safeguards**: scope types (UI_ONLY/FLOW/COPY enforced by backend), **guardrail metrics with auto-stop kill switch** (>5% worsening pauses experiment), deterministic assignment (murmurhash userId+experimentId, same user same variant across devices), **peeking problem** (pre-calculate N, run until N, analyze once — stopping early inflates false positives)." |
| "I integrated PayNow" | "PayNow proxy registry: user enters mobile number → app queries proxy → resolves to bank name + last 4 digits + **account holder name**. UX: show resolved name prominently before confirmation (design decision: user must see TAN AH KENG, not just +65 9123 4567, to prevent wrong-recipient transfers). **MAS SCA**: biometric or OTP required for transfers >SGD1000 AND new payee additions — enforced BOTH client-side (UX gate) AND server-side (security gate, frontend can be bypassed). **AML**: >SGD5000 flagged internally, user sees 'Processing' not 'Under review' (trust-preserving language). **Data residency**: all DBs in AWS ap-southeast-1, hardcoded in IaC templates (not configurable to prevent accidental cross-border data transfer)." |

---

## 📊 Quick Facts

```
TEAM & PRODUCT:
  Size:        9 engineers (Staff + 3 Senior + 3 Mid + 2 Junior)
  Structure:   Domain ownership (not squads) — each engineer owns one area
  Market:      Singapore (PayNow, MAS regulations, SGD currency)
  Product:     Fintech super-app: P2P transfers, QR payments, bill pay, wallet, insurance
  Scale:       SGD multi-million daily transaction volume
  
PERFORMANCE OPTIMIZATIONS:
  Method:      Android Profiler + Flipper → profiled before optimizing
  Cold start:  4.2s → 1.78s (−58%) via dynamic route-level JS imports
  JS bundle:   8.4MB → 3.2MB (−62%) via tree-shaking + bundle splitting
  FPS:         42 → 60 via FlatList virtualization (getItemLayout key insight)
  Memory P90:  320MB → 175MB via FastImage LRU cache + data normalization
  Crash-free:  96.1% → 99.3% (3 specific bug categories fixed)
  ANR rate:    1.8% → 0.3% (below Play Store 2% suppression threshold)
  Rating:      4.1 → 4.6 (organic, driven by genuine improvement)

A/B TESTING:
  Framework:   Feature flags + server-side deterministic assignment (murmurhash)
  Safeguards:  Scope types + guardrail metrics + auto-stop kill switch
  Rigor:       Pre-calculated sample size, no peeking, analyze once at N
  Significance: p < 0.05 (all 4 experiments exceeded this)
  
  Experiment 1: Home Layout       — grid vs list        +12.6% 7-day tx rate   (n=24,800, p=0.003)
  Experiment 2: Transfer Confirm  — 1-step vs 2-step    +18%   completion rate  (n=18,400, p=0.0008)
  Experiment 3: Push Timing       — 8PM vs 9AM          +31%   open rate        (n=31,200, p<0.0001)
  Experiment 4: Onboarding Length — 3-step vs 5-step    +8.6%  completion rate  (n=8,900,  p=0.04)
```

---

*Document last updated: June 2026 · Singapore Financial Super-App Engineering Lead interview preparation*
