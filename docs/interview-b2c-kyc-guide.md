# 🔐 Interview Guide — B2C Web + Electron Desktop
## KYC Configurable Architecture · A/B Testing · Webview Pool · RTL · CVD

---

## 🔑 Context: What This Role Represents

```
THE PRODUCT CONTEXT:
  A high-traffic B2C platform serving millions of users.
  Fintech / payments context: KYC (Know Your Customer) is the gating flow.
  Before users can use the core product, they must complete identity verification.
  
  KYC completion rate is a direct revenue metric:
  More users who complete KYC → more paying customers → more revenue.
  12.19% → 20.03% conversion is not just a UX improvement.
  It means: 64% more users unlock the product. 64% more potential revenue.
  
THE SCOPE OF IMPACT:
  High-traffic applications serving millions of users.
  5 countries (SE Asia market: SG, TH, PH, MY, ID).
  24/7 on-call responsibility for P0 incidents.
  20+ cross-functional partners across timezones.
  
  This is not a "build features and hand off" role.
  Primary front-end owner = you maintain it, you own incidents, you evolve it.
  
THE UNUSUAL ASPECTS:
  1. Both B2C web AND Electron desktop in the same role.
     You span the full product surface: web + native-feeling desktop.
  2. Arabic RTL + CVD accessibility = market expansion into new demographics.
  3. Compliance-driven migration = regulated product with real legal stakes.
  4. AI-assisted development = forward-looking engineering practice.
```

---

## 1️⃣ KYC Configurable Architecture — 12.19% → 20.03%

### What KYC is and why conversion matters

```
KYC = Know Your Customer
  A regulatory requirement for financial services.
  Before users can send money, invest, or access financial products:
  they must prove their identity to the platform.
  
  The KYC flow: upload a government ID → pass a liveness check → verify address → approved.
  
  WHY CONVERSION RATE IS CRITICAL:
  The KYC flow is a GATE. Users who do not complete KYC:
  - Cannot use the product
  - Cannot generate revenue for the business
  - May churn and never return
  
  7-day conversion rate = percentage of users who start the KYC process
  and complete it successfully within 7 days.
  
  12.19% baseline: 87.81% of users who started KYC abandoned within 7 days.
  This means: 88 out of every 100 users who wanted to use the product
  were lost in the verification step.
  
  20.03% after refactor: still 80% abandon rate — but the improvement is:
  +64% relative = 8 more users complete KYC per 100 who start.
  At millions of users: this is thousands of additional verified users per day.
```

### What "fully configurable, frontend-maintained" means

```
THE BEFORE STATE (hardcoded):
  The KYC flow was implemented as a rigid sequence of screens.
  Each screen was hardcoded for a specific step.
  Country-specific requirements were handled with if/else:
  
  if (country === "SG") {
    showAddressStep = true;
    livenessThreshold = 0.87;
    acceptedDocs = ["nric", "passport", "fin"];
  } else if (country === "TH") {
    showAddressStep = false;
    livenessThreshold = 0.82;
    acceptedDocs = ["national_id", "passport"];
  }
  // ...
  
  PROBLEMS:
  1. Adding a new country: backend team + frontend team + QA + deploy cycle.
     Takes 2-4 weeks per new market.
  2. Changing a threshold: code change, PR, review, staging, deploy.
     Even for a simple number change.
  3. No retry logic per country: max retries was the same globally.
  4. Step ordering was fixed: cannot reorder steps for a market without code changes.
  5. Compliance changes: when a regulatory body requires a new document type,
     the turnaround is weeks instead of days.

THE AFTER STATE (fully configurable):
  A country configuration object drives the entire flow.
  
  const KYC_CONFIGS: Record<string, KYCConfig> = {
    SG: {
      steps: [
        { id: "identity_doc", required: true,  label: "Identity Document" },
        { id: "liveness",     required: true,  label: "Liveness Check"    },
        { id: "address",      required: true,  label: "Proof of Address"  },
      ],
      docTypes: ["national_id", "passport", "driving_license"],
      livenessThreshold: 0.87,
      maxRetries: 3,
    },
    TH: {
      steps: [
        { id: "identity_doc", required: true,  label: "Identity Document" },
        { id: "liveness",     required: true,  label: "Liveness Check"    },
      ],
      docTypes: ["national_id", "passport"],
      livenessThreshold: 0.82,
      maxRetries: 2,
    },
    // ...
  };
  
  The KYC React flow reads this config. Same components, different data.
  
  WHY "FRONTEND-MAINTAINED":
  The config file lives in the frontend repository.
  Product managers can open a PR to change a country's config.
  Compliance team can review and approve the change.
  No backend team involvement. No API changes. No database migrations.
  
  Adding a new country: copy an existing country's config, edit the fields.
  Deploy the frontend. New country is live.
  Time: 1 day (vs 2-4 weeks with the hardcoded approach).

HOW THIS IMPROVED CONVERSION:
  The configuration unlocked specific improvements per country:
  
  1. STEP ORDERING OPTIMIZED:
     Data showed: users abandoned most at the liveness check.
     Hypothesis: seeing the liveness step first was unfamiliar and scary.
     New order: identity_doc first (familiar) → liveness (warmer now) → address.
     Previously: impossible to reorder without code changes.
     After: change step order in the config. A/B test. If conversion improves: keep.
  
  2. RETRY LOGIC TUNED PER MARKET:
     Thai users showed higher liveness failure rates (lighting conditions, device quality).
     Increased maxRetries for Thailand from 2 to 3.
     Abandonment at liveness step dropped significantly.
     Previously: one global maxRetries value.
  
  3. DOCUMENT TYPE EXPANSION:
     Philippines data: many users did not have a national ID or passport.
     Added "driving_license" to the Philippines config.
     More users could complete step 1.
     Previously: adding a doc type required backend + frontend + QA.
     After: one line in the config file.
  
  NET RESULT: these targeted per-country optimizations added up to:
  12.19% → 20.03% 7-day conversion. +64% relative improvement.
```

### 5-Country Centralized Config — Market Expansion

```
14.5% LIFETIME PASS RATE:
  "7-day conversion" counts users who complete within 7 days.
  Some users start, fail a step, try again the next week.
  "Lifetime pass rate" counts all users who eventually pass — regardless of when.
  
  14.5% lifetime pass rate means: across all 5 countries, 14.5% of users
  who start the KYC process eventually complete it.
  
  WHY THIS ENABLED MARKET EXPANSION:
  The centralized config means: to launch in a new market, we need:
  1. One new country config block (1 day of work)
  2. Country-specific regulatory review (legal/compliance team, not engineering)
  3. Deploy
  
  Without the centralized config: each new market required significant engineering.
  Expanding from 2 countries to 5 countries would have required 3× the engineering effort.
  With the config: expansion velocity is limited by regulatory review, not engineering capacity.
  
  This is the kind of architectural decision that enables a business to move faster.
  The 14.5% lifetime pass rate is the evidence that the multi-country launch worked:
  users are completing KYC across all 5 markets.
```

---

## 2️⃣ Compliance-Driven Migration Flow

### What compliance migration means and why it is hard

```
WHAT A COMPLIANCE MIGRATION IS:
  A regulatory requirement that existing users must be re-verified.
  Example scenarios:
  - AML (Anti-Money Laundering) regulations tightened: existing KYC is no longer sufficient.
  - A new country's regulator requires additional verification steps for existing users.
  - The platform's banking partner changes compliance standards.
  
  KEY PROPERTIES OF A COMPLIANCE MIGRATION:
  1. NON-OPTIONAL: existing users must complete the new flow or lose access.
     There is no "skip" button.
  2. HIGH-STAKES: wrong implementation = regulatory breach = fines/license revocation.
  3. HIGH-FRICTION by nature: asking existing users to re-verify creates churn risk.
  4. TIMED: regulators often set deadlines.
  
  THE ENGINEERING CHALLENGE:
  You are changing a flow for users who:
  - Already trust the platform (they are existing customers)
  - Did not expect to be asked for more verification
  - May be mid-session when the migration requirement activates
  
  The UX must:
  - Explain why this is happening (regulatory language, carefully reviewed by legal)
  - Make the process as fast as possible (users are already verified, minimal new steps)
  - Handle interruption gracefully (user starts migration, loses network, comes back later)
  - NOT lose any existing user data (migration is additive, not a replacement)

BEING THE PRIMARY FRONT-END OWNER:
  "Primary front-end owner for ongoing maintenance and feature enhancements."
  
  This means:
  - You are the go-to engineer for any frontend questions about this flow
  - Production incidents in this flow: your first responsibility
  - New regulatory requirements: you assess frontend feasibility
  - 20+ cross-functional partners: you are the frontend liaison for this product area
  
  Owner is different from contributor.
  Contributors build features. Owners carry the flow's health indefinitely.
  This includes: monitoring, on-call rotations, incident response, technical debt.
```

---

## 3️⃣ A/B Testing — Data-Informed Product Decisions

### The methodology

```
WHY A/B TEST RATHER THAN JUST SHIP THE IMPROVEMENT:
  In a KYC flow, changes can have unintended consequences.
  A change that seems better UX might have a worse conversion rate.
  Example: showing a progress bar might make users feel the flow is longer
           than they expected, causing more abandonment.
  
  Without A/B testing: you ship the change to 100% of users.
  If it is worse: you realise 7 days later. Rolled back. Users impacted.
  
  With A/B testing: 10-20% of users see the new UX.
  If it is worse: you catch it with a small user impact.
  If it is better: you roll out with confidence.

THE VARIANT I TESTED: Progressive Disclosure
  Multi-step form (Variant A): all fields visible on one screen.
  Progressive disclosure (Variant B): one field at a time, with a progress indicator.
  
  Hypothesis: one field at a time reduces cognitive load.
  Users who see all fields at once → overwhelmed → abandon.
  Users who see one field at a time → manageable → complete.
  
  This is supported by the literature on form design (the "survey length" effect).
  But in a KYC context, the question was: does it work for identity verification specifically?
  (The documents + liveness check are unusual. Users might need to see the full scope first.)
  
  RESULT: Variant B (progressive disclosure) won.
  7-day conversion: 12.4% (A) vs 19.8% (B). +59.7% relative.
  p < 0.001 (statistically significant at 99.9% confidence).
  Decision: roll out Variant B to 100%.

THE IMPLEMENTATION:
  Assignment: deterministic hashing (hash(userId + experimentName) % 100).
  Same user → same variant. Consistent experience across sessions.
  
  Tracking: analytics events at each step.
  kyc_step_started, kyc_step_completed, kyc_abandoned (with step where abandoned).
  
  Analysis: in the analytics backend.
  Compare: (verified in 7 days) / (started KYC) by variant.
  
  Statistical significance check: chi-squared test or z-test for proportions.
  Minimum sample size: calculated before starting (to avoid peeking problem).
  "Peeking problem": checking results before the sample size is reached leads to
  false positives. You see significance by chance. You stop the test early. Wrong decision.
```

---

## 4️⃣ P0 On-Call — 24/7 Service Stability

```
WHAT P0 MEANS:
  P0 = Priority 0 = complete service outage or critical revenue/compliance impact.
  Examples:
  - KYC flow is down: all new users are blocked from verifying. Revenue impact every minute.
  - Payment processing is down: existing users cannot transact.
  - Data breach: compliance + legal emergency.
  
  SLA: resolve within 1 hour.
  
  "1 hour" means: the issue must be mitigated (not necessarily root-caused) in 1 hour.
  Mitigation: could be a rollback, a feature flag turning off the broken feature,
  a traffic re-route, or a hotfix deploy.
  Root cause analysis: happens after the incident, in the post-mortem.

THE ON-CALL PROCESS:
  1. Alert fires (PagerDuty or equivalent). Engineer receives a page.
  2. Acknowledge within 5 minutes.
  3. Assess: what is broken? What is the user impact?
  4. Communicate: update the incident channel. Notify PM, backend, stakeholders.
  5. Mitigate: rollback, feature flag off, hotfix — whichever is fastest.
  6. Verify: confirm the issue is resolved. Monitor dashboards.
  7. Communicate resolution: all stakeholders notified.
  8. Post-mortem: within 48 hours. Root cause. Prevention measures.
  
  "Resolving critical production issues within 1 hour" is a hard commitment.
  Missing the 1-hour SLA for a P0 financial product can have:
  - Direct revenue loss (every minute users cannot verify is a lost customer)
  - Regulatory consequences (downtime in financial services is strictly monitored)
  - Contractual penalties (SLAs with banking partners)
  
ON-CALL AS A SENIOR ENGINEER:
  Being on the P0 rotation means: you are trusted to make production decisions alone.
  At 3am, you do not wait for a manager's approval to rollback.
  You assess the situation, make the call, execute.
  This is the definition of ownership at the senior engineer level.

THE CROSS-FUNCTIONAL ASPECT:
  "20+ cross-functional partners across multiple time zones."
  During a P0 incident: you are coordinating with:
  - Backend engineers (is this a backend issue?)
  - iOS/Android engineers (is this happening on other platforms?)
  - QA (help verify the fix)
  - PM (what is the user impact? What is the business impact?)
  - UX (does the mitigated state look acceptable?)
  - Customer support (what to tell affected users)
  
  All of this while debugging. The communication is as important as the debugging.
  A silent on-call engineer who fixes the issue but tells no one: bad.
  An on-call engineer who communicates clearly, coordinates effectively, fixes fast: excellent.
```

---

## 5️⃣ AI-Assisted Development

```
"ACCELERATED DELIVERY VELOCITY THROUGH AI-ASSISTED DEVELOPMENT"

WHAT THIS ACTUALLY MEANS:
  Not: using GitHub Copilot for autocomplete.
  Means: integrating AI agents into the development workflow at a deeper level.

AI AGENTS IN THE DAILY CYCLE:

1. AUTONOMOUS TESTING WORKFLOWS:
   Instead of manually writing test cases for every component:
   Describe the component's behavior in natural language.
   AI agent generates the test scaffolding.
   Engineer reviews, edits, and commits.
   Time savings: 40-60% on test writing for standard components.
   
   More importantly: the AI agent runs the tests autonomously.
   "Autonomous testing workflow" = the agent can run, evaluate, and iterate on tests
   without a human triggering each step.

2. CODE GENERATION FOR BOILERPLATE:
   KYC flow had many similar components: form screens with validation, error states.
   Instead of writing each screen from scratch: describe the screen to the AI agent.
   Agent generates the component, including accessibility attributes, TypeScript types,
   and unit test stubs.
   Engineer focuses on: the unique logic, the business rule edge cases.
   
3. DOCUMENTATION GENERATION:
   AI agent reads a component's code and generates JSDoc comments.
   Keeps documentation up-to-date with the implementation.
   
4. PR REVIEW ASSISTANCE:
   Before submitting a PR: run the AI agent on the diff.
   Agent checks: potential null pointer exceptions, missing error handling,
   accessibility issues, TypeScript type safety.
   Catches issues before human review.

WHY THIS MATTERS IN AN INTERVIEW:
  "AI-assisted development" is not a novelty. It is an engineering productivity multiplier.
  Engineers who effectively integrate AI into their workflow deliver more in the same time.
  
  The key question: how do you use AI without introducing risk?
  Answer: AI generates, human reviews, tests verify.
  Never ship AI-generated code without understanding it.
  AI is a junior engineer with infinite availability but no context.
  Your job: provide context, review output, ensure quality.
```

---

## 6️⃣ Electron Webview Pool — 30% Speed Improvement

### The problem and the solution

```
ELECTRON AND WEBVIEWS:
  Electron is a framework for building desktop applications using web technologies.
  HTML + CSS + JS, but running as a native application.
  
  "Micro-apps" in the desktop application = distinct features (Home, Wallet, History, etc.)
  Each micro-app is a separate webview (equivalent to an iframe in a browser).
  
  WHY SEPARATE WEBVIEWS:
  Security: each micro-app runs in its own process (Chromium process isolation).
  Independence: one micro-app crashing doesn't crash others.
  Team independence: different teams own different micro-apps.

THE COLD START PROBLEM:
  When a user clicks "Wallet" in the desktop app:
  1. Electron creates a new WebContentsView (empty webview)
  2. Loads the URL (app://wallet)
  3. Downloads and parses HTML, CSS, JavaScript
  4. React renders the component tree
  5. First paint
  
  This takes: 2.0-2.5 seconds on typical hardware.
  In a desktop application, 2 seconds feels extremely slow.
  Mobile apps navigate between screens in < 200ms. Users expect similar on desktop.

THE WEBVIEW POOL SOLUTION:
  The key insight: the most frequently accessed micro-apps can be pre-loaded.
  
  At app startup (while the user is reading the home screen):
  Hidden webviews are created for: Wallet, History, Notifications.
  These webviews load their URLs and complete their first paint — hidden from the user.
  
  When the user clicks "Wallet":
  Instead of creating a new webview: the pre-loaded Wallet webview is made visible.
  What was a 2.3-second wait becomes: a position change of a DOM element.
  Perceived time: < 100ms.
  
  MEASURED IMPROVEMENT:
  Cold start (no pool): 2,300ms average.
  Pool hit: 1,600ms (30% faster — this measures even the pool miss path).
  Actually: pool hit path = ~100ms (essentially instant).
  The 30% figure is the average across all navigations (mix of pool hits and misses).
  
  POOL MANAGEMENT:
  Pool size: top N micro-apps by access frequency (e.g., N=3: Wallet, History, Notifications).
  After pool use: webview is returned to the pool and refreshed (reload the URL).
  This takes a few seconds — done in the background after the user is already viewing the content.
  Fallback: if the user navigates to a non-pooled app: cold start.
  
  EDGE CASES:
  Pool entry that failed to load: detect via did-fail-load event, remove from pool.
  Memory pressure: if system memory is low, reduce pool size or empty pool.
  User logged out: clear pool on logout (webviews might have stale session data).
```

---

## 7️⃣ RTL Layout — Arabic Language Support

```
WHY RTL IS NON-TRIVIAL:
  RTL (Right-to-Left): Arabic, Hebrew, Farsi, Urdu read from right to left.
  In RTL, everything that is left/right is mirrored:
  - Text alignment: right-aligned instead of left-aligned
  - Navigation: Back arrow points right (not left)
  - Layout: the logo moves to the right; the account icon moves to the left
  - Icons: directional icons are mirrored (arrows, chevrons, progress indicators)
  - Scroll: horizontal scroll direction reverses
  - Animations: slide-in comes from the left (not right) for RTL
  
  THE NAIVE APPROACH (wrong):
  Add CSS: direction: rtl; to the root element.
  Problem: this reverses text direction but not necessarily layout.
  Icons that use absolute positioning are not automatically mirrored.
  Custom scroll implementations need to be rewritten.
  Time-based animations assume LTR.
  
  THE CORRECT APPROACH: CSS Logical Properties
  
  Instead of physical properties (left, right, margin-left, padding-right):
  Use logical properties that are direction-aware:
  
  Physical:   padding-left: 16px;          → always adds padding on the left
  Logical:    padding-inline-start: 16px;  → adds padding at the start direction
                                              LTR: left. RTL: right.
  
  Physical:   margin-right: 8px;
  Logical:    margin-inline-end: 8px;
  
  Physical:   border-left: 2px solid blue;
  Logical:    border-inline-start: 2px solid blue;
  
  When dir="rtl" is set on the root:
  padding-inline-start: 16px → applies to the right side.
  The same CSS works in both LTR and RTL. Zero duplication.
  
  ICON MIRRORING:
  Directional icons (back arrow, chevron, progress arrow) need to flip.
  CSS: html[dir="rtl"] .icon-directional { transform: scaleX(-1); }
  Non-directional icons (person icon, heart icon): should NOT flip.
  The engineer must classify each icon: directional or not.
  
  TESTING RTL:
  The browser DevTools "Emulate forced-colors" cannot test RTL.
  Testing: set dir="rtl" in DevTools Elements panel.
  Or: add a language switcher in the dev build.
  Every new component must be tested in both LTR and RTL before shipping.

ARABIC TYPOGRAPHY SPECIFICS:
  Arabic text uses a connected script. Characters connect to adjacent characters.
  The font must support Arabic glyph variants (initial, medial, final, isolated).
  Font recommendation: Google Noto Sans Arabic, Cairo, Tajawal.
  Line height and letter spacing differ from Latin fonts.
  Arabic has no uppercase: no text-transform: uppercase for Arabic text.
```

---

## 8️⃣ CVD Color Schemes — Accessibility

```
CVD = Color Vision Deficiency
  Approximately 8% of men and 0.5% of women have some form of CVD.
  The most common form: deuteranopia (red-green color blindness, 5% of males).
  
  WHY THIS MATTERS FOR FINTECH:
  A financial app uses colors for critical status indicators:
  - Green: verified / approved / positive balance
  - Red: error / rejected / negative balance / warning
  - Amber: pending / in progress
  
  For a user with deuteranopia: red and green look similar.
  "Your KYC was rejected" (red) vs "Your KYC was approved" (green):
  both look like the same yellowish color to a user with deuteranopia.
  This is not just a UX issue — it is a financial services accessibility issue.
  In some jurisdictions: WCAG 2.1 compliance is a regulatory requirement.

IMPLEMENTATION:
  
  All colors come from CSS custom properties:
  
  :root { /* default = "normal" vision */
    --color-success: #22c55e;  /* green */
    --color-warning: #f59e0b;  /* amber */
    --color-error:   #ef4444;  /* red   */
    --color-info:    #3b82f6;  /* blue  */
  }
  
  :root[data-cvd="deuteranopia"] {
    /* Deuteranopia: red-green color blind.
       Replace red/green distinction with blue/orange distinction. */
    --color-success: #0ea5e9;  /* sky blue — distinctly different from orange */
    --color-warning: #f97316;  /* orange  */
    --color-error:   #7c3aed;  /* violet  — very different from orange */
    --color-info:    #0891b2;  /* cyan    */
  }
  
  :root[data-cvd="protanopia"] {
    /* Protanopia: cannot see red.
       Anything red disappears. Replace with purple/cyan contrast. */
    --color-success: #06b6d4;  /* cyan    */
    --color-warning: #eab308;  /* yellow  */
    --color-error:   #8b5cf6;  /* purple  — visible to protanopes */
    --color-info:    #0284c7;  /* blue    */
  }
  
  :root[data-cvd="monochrome"] {
    /* Achromatopsia: complete color blindness.
       Distinguish via brightness and pattern, not color. */
    --color-success: #94a3b8;
    --color-warning: #64748b;
    --color-error:   #1e293b;
    --color-info:    #cbd5e1;
  }
  
  // React: apply on startup and persist
  const useCVDTheme = () => {
    const [cvd, setCVD] = useState(() => localStorage.getItem("cvd-mode") ?? "normal");
    useEffect(() => {
      document.documentElement.setAttribute("data-cvd", cvd);
      localStorage.setItem("cvd-mode", cvd);
    }, [cvd]);
    return { cvd, setCVD };
  };
  
  BEYOND COLORS:
  WCAG 2.1 also requires: color is NOT the only way to convey information.
  "Your KYC was approved" should not ONLY use a green color.
  It should also use: a checkmark icon, the word "Approved", or both.
  Color-blind users can read text. They cannot distinguish colors.
  
  The CVD scheme is an enhancement — not a replacement for text + icons.
```

---

## STAR Scripts

### KYC Conversion Improvement

```
SITUATION:
  The KYC verification flow had a 12.19% 7-day conversion rate.
  ~88% of users who started KYC abandoned within 7 days.
  Each abandoned user: a potential customer permanently blocked from the product.
  The flow was hardcoded: adding country-specific optimizations required
  backend + frontend + QA involvement and 2-4 week cycle times.
  
TASK:
  Refactor the KYC flow into a configurable, frontend-maintained architecture.
  Improve conversion. Enable faster country-specific optimization cycles.
  
ACTION:
  Designed and implemented a centralized country configuration system.
  Every aspect of the KYC flow — step ordering, document types, liveness thresholds,
  retry policies — driven by a config object, not hardcoded logic.
  A/B tested specific UX changes (progressive disclosure) enabled by the new config.
  Centralized 5-country configs: SG, TH, PH, MY, ID.
  
RESULT:
  7-day KYC conversion: 12.19% → 20.03% (+64% relative).
  Time to launch in a new country: 2-4 weeks → 1 day.
  14.5% lifetime pass rate across 5 markets.
  Compliance team can now review and adjust country requirements as PRs.
  No backend dependency for country-specific configuration changes.
```

### Electron Webview Pool

```
SITUATION:
  Users of the Electron desktop application experienced 2-3 second delays
  when switching between micro-apps (Wallet, History, etc.).
  Desktop applications are expected to navigate instantly.
  The 2-3 second cold start was a top user complaint.
  
TASK:
  Reduce perceived navigation time for frequently accessed micro-apps.
  
ACTION:
  Designed and implemented a Webview Pool: a pool of pre-loaded hidden webviews
  for the top N most-accessed micro-apps (Wallet, History, Notifications).
  At app startup: pre-load the pool in background hidden webviews.
  On navigation: swap the pre-loaded webview into view (instant).
  After use: return to pool and refresh asynchronously.
  Edge cases handled: load failures, memory pressure, session invalidation.
  
RESULT:
  Average navigation speed improved by 30%.
  Pool hit path: effectively instant (<100ms vs 2.3s cold start).
  Top user complaint (slow navigation) resolved.
  No increase in memory usage beyond the pre-loaded webview size.
```

---

## Follow-up Q&A

**"How did you decide what to put in the country config vs hardcode in the component?"**
> "The guiding principle was: anything that might differ by country, or might need to change due to regulatory requirements, belongs in the config. Anything that is a core UI behavior (how the progress indicator works, how error messages are displayed) stays in the component. The config is essentially the 'contract' between product/compliance and engineering. Product says: 'for Malaysia, we need the liveness check before the document upload.' That's a config change. Engineering says: 'the retry UI shows a countdown timer.' That's always the same, so it's in the component. The practical test: if a product manager or compliance officer might need to change this without writing code, it belongs in the config."

**"You said progressive disclosure improved conversion by 59.7%. What was your methodology for the A/B test?"**
> "Three things were critical. First: deterministic assignment. We used hash(userId + experimentName) % 100 to assign users to variants. The same user always saw the same variant — no flickering between sessions, which would corrupt the data. Second: pre-calculating the minimum sample size before starting. If you check results before you have enough data, you see false significance by chance. We calculated: we needed approximately 50,000 users per variant for 80% power at a 5% minimum detectable effect. We did not look at results until we hit that number. Third: the right metric. We measured 7-day KYC completion rate, not step-by-step completion. A variant could show better step 1 completion but worse overall completion — that would be a failure, not a success. The end metric is what matters."

**"What is the hardest part of P0 on-call for a financial application?"**
> "The combination of speed and accuracy under pressure. You have a 1-hour SLA. You are debugging in production, usually at odd hours. You cannot afford to make the situation worse. There are two failure modes: (a) you act too slowly — 1-hour SLA breached. (b) you act too fast — you roll back the wrong thing, or you push a hotfix that introduces a new bug. The skill is: quickly triage (is this a frontend issue, backend issue, infrastructure issue, or third-party?), escalate to the right team immediately, and mitigate aggressively but carefully. My approach: rollback is always the first option. If I deployed something in the last 2 hours and the incident started shortly after: rollback first. Investigate second. A rollback is reversible. A wrong hotfix might not be."

**"How do you handle RTL testing across a complex application?"**
> "The honest answer: it requires discipline and automation. The temptation is to add dir='rtl' on the body and call it done. But RTL support is not a switch you flip — it is a property you maintain over time. Every new component added by any engineer can break RTL if it uses physical instead of logical CSS properties. My approach: an ESLint rule that warns on margin-left, margin-right, padding-left, padding-right, border-left, border-right and suggests the logical equivalents. This catches 80% of RTL bugs at write time. Then: Storybook stories for every component with a 'RTL' variant. Visual regression testing against those stories. And a dedicated RTL smoke test in our E2E suite that navigates key user journeys with dir='rtl' and screenshots each page. That catches the remaining edge cases."

---

## 🔗 Unified Narrative

> "The KYC conversion work is the clearest example of how architectural decisions directly impact business outcomes. 12.19% to 20.03% is not a number that appears without a specific cause. The cause: moving from a hardcoded flow that required 2-4 weeks to change anything, to a configurable architecture where optimizations can be made and tested in days. The A/B test methodology ensured that the changes we shipped were validated — we had statistical confidence in the improvement before rolling it out to all users.
>
> The compliance migration flow shows a different dimension of the same capability: owning a product area end-to-end. Not just building it and moving on, but carrying its health, responding to incidents (P0 on-call), coordinating 20+ stakeholders, and evolving it as regulatory requirements change. That is what 'primary front-end owner' means in practice.
>
> The desktop work — Webview Pool, RTL, CVD — shows breadth. Each of these is a self-contained technical challenge. The Webview Pool is a performance architecture problem (pre-loading, pool management, fallback). RTL is an internationalization correctness problem (logical properties, icon mirroring, typography). CVD is an accessibility design problem (color palette design under multiple vision deficiencies, not just slapping a CSS filter). Solving all three in one role means: you can move across dimensions of engineering quality without losing depth."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I improved KYC conversion" | "**Refactored into a fully configurable, frontend-maintained architecture**: country config drives steps/docTypes/livenessThreshold/maxRetries. No backend dependency. PM/compliance can propose changes as PRs. Time to change: 2-4 weeks → 1 day. Result: **12.19% → 20.03%** (+64% relative) 7-day conversion." |
| "I did A/B testing" | "**Deterministic assignment** (hash(userId+exp)%100), pre-calculated sample size (no peeking), correct metric (7-day completion not step completion). Tested progressive disclosure. Result: **12.4% → 19.8%** (+59.7%), p<0.001, 99.9% confidence. Then shipped to 100%." |
| "I was on-call" | "**P0 on-call rotations**, 1-hour SLA. Triage → escalate → mitigate (rollback first, hotfix second) → communicate → post-mortem. Coordinating 20+ partners (BE/iOS/Android/QA/PM/UX/support) while debugging under time pressure." |
| "I implemented RTL" | "**CSS logical properties** (padding-inline-start, not padding-left). Icon mirroring classification (directional vs non-directional). ESLint rule warning on physical properties. Storybook RTL stories + visual regression tests. E2E RTL smoke tests." |
| "I added CVD support" | "**CSS custom properties** for all status colors. Separate palette per CVD type (deuteranopia: blue/orange, protanopia: cyan/purple, monochrome: brightness). WCAG principle: **color is not the only signal** — text + icon always accompanies color. localStorage persistence." |
| "I improved Electron performance" | "**Webview Pool**: pre-load top N micro-apps in hidden WebContentsViews. Pool hit → instant (<100ms). Cold start → 2.3s. **-30% average** navigation time. Edge cases: load failure detection, memory pressure handling, session invalidation on logout." |

---

## 📊 Quick Facts

```
Product: B2C Web + Electron Desktop (Fintech / Payments)

B2C WEB:
  KYC conversion (7-day): 12.19% → 20.03% (+64% relative)
  Architecture: country config JSON drives steps/docs/thresholds/retries
  Countries:    5 (SG, TH, PH, MY, ID)
  Pass rate:    14.5% lifetime KYC pass rate across 5 countries
  A/B test win: progressive disclosure 12.4% → 19.8% (+59.7%)
  On-call:      P0 rotations, 1-hour SLA, 20+ cross-functional partners
  AI dev:       AI agents for code generation, autonomous testing workflows
  Stack:        React, TypeScript, Monorepo

ELECTRON DESKTOP:
  Webview Pool: pre-load top 3 micro-apps → -30% navigation time
  Cold start:   2,300ms → pool hit ~100ms (30% average improvement)
  RTL:          CSS logical properties, icon mirroring, Storybook RTL stories
  CVD:          Deuteranopia / protanopia / monochrome color schemes
                CSS custom properties, localStorage persistence
                WCAG: color not sole signal (text + icon always present)

COMPLIANCE MIGRATION:
  Type:   Regulatory re-verification for existing users
  Stakes: Wrong implementation = regulatory breach
  Role:   Primary front-end owner (build + maintain + incidents)

METHODOLOGY:
  A/B:    Deterministic hash, pre-calculated sample size, 7-day end metric
  KYC:    Country config removes backend dependency for market adaptation
  On-call: Rollback first → investigate → hotfix → post-mortem
```

---

*Document last updated: June 2026 · B2C KYC interview preparation*
