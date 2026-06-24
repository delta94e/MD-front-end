# 🏦 Interview Guide — FinTech & Banking Engineering
## Shopee Financial App · Account Opening (PIC) · Bank Website ISR · Micro-Frontend BMS

---

## 🔑 Context: FinTech Engineering — Where Trust is the Core Constraint

```
WHAT MAKES FINTECH DIFFERENT FROM OTHER SOFTWARE:
  
  In a typical web app: user action fails → error message → user retries.
  Cost of failure: annoyance.
  
  In a financial app: user taps "Transfer ₫5,000,000" → error → is money gone?
  Cost of failure: loss of trust. Potentially: actual financial loss.
  
  This changes EVERY technical decision:
  
  State management: optimistic updates REQUIRE rollback on failure.
  (A deducted balance must be restored if the API call fails.)
  
  Offline handling: never show an error that implies money is lost.
  Show: "Last updated: 3 minutes ago." Not: "Cannot load balance."
  
  Currency formatting: ₫12,480,000 (Vietnamese) ≠ 12,480,000 ¥ (Chinese).
  Wrong format: regulatory non-compliance, user confusion.
  
  Hot updates: a bug in the transfer flow is a P0 incident.
  Without hot updates: fix reaches users in 1-7 days (App Store review).
  With hot updates: fix deployed in HOURS. Critical in financial apps.
  
  EVERY DESIGN DECISION in this section comes from this constraint:
  financial apps must maintain user trust under all conditions.
```

---

## 1️⃣ Shopee Financial App — Key Architect (React Native / TypeScript / Zustand)

### Architecture · Multi-language · Hot Updates · Complex Data Operations

```
ROLE: KEY ARCHITECT
  "Key Architect" means:
  - Designed the overall application architecture.
  - Made technology choices and justified them.
  - Set patterns that other engineers followed.
  - Accountable for architectural quality and performance.

WHY REACT NATIVE (not Flutter, not native iOS/Android separately):
  
  ShopeePay targets: Vietnam, Indonesia, Thailand, Philippines, Malaysia.
  5 different markets = 5 different localizations, but shared business logic.
  
  React Native:
  - ONE JavaScript codebase for both iOS and Android.
  - 80-90% code sharing between platforms.
  - Platform-specific UI where needed (iOS conventions vs Android).
  - Shopee is already a React company: existing expertise, shared libraries.
  
  Flutter alternative: different language (Dart), separate ecosystem.
  The team's JavaScript expertise would not transfer.
  
  Native iOS + Android separately: 2× developer cost for the same features.
  At a startup scale (early financial app): not justified.

WHY ZUSTAND OVER REDUX:
  
  Redux requires:
  - Action types (constants)
  - Action creators (functions that return action objects)
  - Reducers (pure functions handling each action)
  - Selectors (extracting data from the store)
  - Connecting components (mapStateToProps / useSelector)
  
  For a complex financial app: this is a lot of boilerplate.
  A "transfer money" feature in Redux:
  TRANSFER_INITIATE, TRANSFER_SUCCESS, TRANSFER_FAILURE actions.
  transferReducer handling all three. transferSelector. connectTransfer.
  
  Zustand: one function. Mutation and async in the same place.
  
  walletStore:
  transfer: async (to, amount) => {
    set(s => ({ balance: s.balance - amount }));  // optimistic
    try { await api.transfer({ to, amount }); }
    catch { set(s => ({ balance: s.balance + amount })); throw; }  // rollback
  }
  
  Why Zustand specifically for React Native:
  - No Provider wrapper required (works with Expo, any entry point).
  - persist middleware + AsyncStorage: offline persistence in 2 lines.
  - Works with React Native's synchronous and asynchronous patterns.
  - TypeScript: full type inference without boilerplate.

ZUSTAND STORE ARCHITECTURE:
  
  NOT: one giant store. That's the Redux mistake.
  NOT: one store per component. That defeats the purpose.
  
  SLICE PATTERN (4 domain stores):
  
  walletStore:     balance, accounts, virtual cards, fetchBalance(), transfer()
  transactionStore: history (paginated), filters, cursor, loadMore()
  userStore:       profile, KYC status, verification level, preferences
  configStore:     locale, feature flags, A/B variant assignments
  
  WHY SEPARATE SLICES:
  - walletStore updates → only WalletScreen re-renders.
  - transactionStore updates → only TransactionListScreen re-renders.
  - No unnecessary re-renders across unrelated screens.
  
  Zustand's selector pattern:
  const balance = useWalletStore(s => s.balance);
  // Only re-renders when balance changes. Not when accounts change.

COMPLEX DATA OPERATIONS:
  
  1. CURSOR-BASED PAGINATION:
     Transaction history can have thousands of entries.
     Offset pagination: "rows 1000-1020" → at large offsets, database scans 1020 rows.
     Cursor pagination: "20 rows after txn_abc123" → jumps to position via index.
     O(log n) vs O(n). At thousands of records: significantly faster.
     Also: infinite scroll. Each scroll load: append to existing list.
  
  2. OPTIMISTIC UPDATES WITH ROLLBACK:
     User taps Transfer ₫2,000,000.
     Balance deducted immediately (optimistic).
     API call runs in background.
     If success: balance stays deducted. Server balance confirmed on next sync.
     If failure: balance restored (rollback). Toast: "Transfer failed. Tap to retry."
     
     WHY OPTIMISTIC UPDATES IN FINANCIAL APPS:
     Users expect instant feedback. "Did it go through?"
     Waiting 1-2 seconds with no visual change: anxiety. "Did something happen?"
     Optimistic update: immediate visual confirmation.
     Rollback: handles the edge case (network issue, server error).
  
  3. DATA NORMALIZATION:
     User "Nguyen Van A" appears as sender/receiver in 50 transactions.
     Without normalization: 50 copies of the user object.
     If profile photo changes: must update all 50 copies. 50 re-renders.
     
     With normalization:
     { users: { "u_nguyenvana": { name, photo, verified } },
       transactions: { "t1": { senderId: "u_nguyenvana", ... } } }
     Profile photo change: update ONE user object. All 50 transactions see the new photo.
  
  4. OFFLINE-FIRST BACKGROUND SYNC:
     Financial app users must trust their balance even when offline.
     Strategy:
     - persist middleware: last known state in AsyncStorage (phone storage).
     - NetInfo: detect connectivity (connected, disconnected, weak).
     - When offline: show cached balance. Indicator: "Updated 3 min ago."
     - When reconnected: sync in background. Update state. Remove indicator.
     - If sync fails: subtle banner "Sync issue. Tap to refresh." NOT "Error: cannot load."
     
     The language matters: "sync issue" preserves trust. "Error" destroys it.
     Users do not interpret app errors clinically. They interpret emotionally.
     "Error loading balance" = "is my money gone?"

MULTI-LANGUAGE (5 locales):
  
  react-i18next for React Native.
  5 locales: en (English), vi (Vietnamese), th (Thai), id (Indonesian), zh (Chinese).
  
  LAZY LOADING LOCALES:
  Do NOT bundle all 5 locale files at startup.
  App bundle grows: startup time increases.
  Solution: bundle only English (default) at startup.
  When user switches to Vietnamese: fetch vi.json on demand.
  Add to i18next resource bundle. Cache in AsyncStorage.
  Next app launch: load from cache, not from network.
  
  NUMBER AND CURRENCY FORMATTING:
  Vietnamese: 12.480.000 đ (period thousands separator, đ suffix)
  English: $12,480 (comma thousands, $ prefix)
  Thai: ฿12,480 (฿ prefix, comma thousands)
  
  Wrong: show "₫12,480.00" to a Vietnamese user (decimal, not period thousands).
  Correct: use Intl.NumberFormat(locale, { style: "currency", currency: "VND" })
  
  DATE AND TIME:
  Vietnamese convention: DD/MM/YYYY.
  "01/06/2024" → Vietnamese: June 1. American: January 6.
  Use Intl.DateTimeFormat(locale) to format consistently.
  
  RTL SUPPORT:
  Not required for EN/VI/TH/ID/ZH (all LTR).
  But: architected to support RTL (Arabic) if markets expand.
  React Native: I18nManager.forceRTL(true) + RTL-aware flexbox (start/end, not left/right).

HOT UPDATES (CodePush / EAS Update):
  
  WHAT IT IS:
  React Native apps: native container (compiled C++/Java/Swift) + JavaScript bundle.
  The native container: goes through App Store review (1-7 days).
  The JavaScript bundle: can be updated independently. No App Store review.
  
  HOW IT WORKS:
  1. Developer fixes a bug in the JavaScript code.
  2. Build: new JavaScript bundle compiled.
  3. Push: bundle uploaded to CodePush CDN.
  4. Check: app checks for updates on launch (configurable: launch, background, or on demand).
  5. Download: only the DELTA (changed files) — not the full bundle. Fast.
  6. Apply: on next app launch — new JavaScript runs in the existing native container.
  7. Rollback: if crash rate exceeds a threshold → one command to roll back to previous bundle.
  
  WHY THIS MATTERS FOR FINANCIAL APPS:
  Bug: user reports that the transfer confirmation screen is showing the wrong amount.
  This is a P0 issue. Users are transferring money with the wrong amount displayed.
  
  Without hot updates: fix goes through App Store review (1-7 days).
  1-7 days of users potentially sending wrong amounts.
  
  With hot updates: fix deployed in 2-4 hours.
  
  LIMITATION: hot updates only apply to JavaScript/React Native code.
  New native permissions (camera, biometrics) → must go through App Store.
  New native modules → must go through App Store.
  Bug fixes and UI changes → hot update eligible.
```

---

## 2️⃣ Account Opening & Loan Module — PIC · From Scratch to Launch

### KYC Onboarding · Loan Calculator · Leading 3 Junior Members

```
PIC ROLE:
  Person in Charge.
  Not the manager (the manager handles HR, compensation, performance reviews).
  The PIC: technical accountable owner.
  If the module ships late: PIC explains why.
  If the module has an architectural flaw: PIC owns the fix.
  "PIC" in Shopee / SEA company culture = tech lead for a scope.

ACCOUNT OPENING FROM SCRATCH TO LAUNCH:
  
  Month 0:
  - No code. No API contracts. No design specs (in progress).
  
  Week 1:
  - Defined the onboarding state machine (the most critical design decision).
  - Aligned with backend team on API contracts.
  - Set up the skeleton (folder structure, form library, navigation).
  - Assigned work to 3 junior members.
  
  Month 3:
  - Both Account Opening and Loan modules in production.
  - Serving real customers.

THE ONBOARDING STATE MACHINE:
  
  WHY A STATE MACHINE (not just a step counter):
  A step counter assumes: steps are sequential, no branching.
  Onboarding has branching:
  - KYC check fails → go to "KYC Failed" state, not "Address" state.
  - User quits at step 3 → save state. Resume from step 3 next time.
  - Regulatory requirement: user in Province X → skip employment step.
  
  A boolean ("is KYC done?") cannot model this. 3 booleans = chaos.
  A state machine: each state has explicit transitions.
  
  States: initial → personal_info → identity_upload → kyc_processing
       → (kyc_success: address → employment → review → submitted)
       → (kyc_failure: kyc_failed → support_contact)
       → (submitted: approved → account_active)
       → (submitted: rejected → rejection_reason)
  
  Benefits:
  - Impossible states prevented: cannot be in both "approved" and "rejected".
  - Serializable: store the current state string. Resume on next app launch.
  - Testable: given state + event → assert expected next state.

API CONTRACT DESIGN (before any backend code):
  
  Frontend and backend can develop in parallel if the API contracts are agreed first.
  
  Week 1: defined together with backend:
  POST /api/v1/accounts/onboarding/start
  → { session_id, state: "personal_info" }
  
  PUT /api/v1/accounts/onboarding/:id/personal-info
  Body: { full_name, dob, phone }
  → { state: "identity_upload" }
  
  POST /api/v1/accounts/onboarding/:id/kyc-check
  → { status: "processing", webhook_url }
  (async: KYC result delivered via webhook)
  
  Frontend team: builds the UI against a mock API (MSW).
  Backend team: implements the real endpoints.
  
  Integration day: replace MSW with real API.
  Frontend needed to change: only the base URL.
  Zero UI changes.
  Integration done in half a day.
  
  Without upfront API contracts: frontend blocks waiting for backend.
  Or: frontend assumes API shape → backend ships differently → 2-day rework.

LOAN MODULE TECHNICAL DETAILS:
  
  LOAN CALCULATION:
  Monthly payment formula (reducing balance):
  M = P × r × (1+r)^n / ((1+r)^n - 1)
  Where: P = principal, r = monthly rate, n = term in months
  For 10.8% annual rate: r = 0.9% monthly.
  
  Implemented client-side: instant recalculation as user adjusts sliders.
  No API call for the calculator. API call only on application submit.
  
  LOAN STATUS STATE MACHINE:
  applied → under_review → credit_assessment → approved → pending_disbursement → disbursed
  Or: under_review → rejected (with reason: score, income, collateral)
  
  Credit scoring: backend integration with credit bureau (external).
  The frontend shows status without exposing the raw score.
  "Under Review" → user sees progress animation. Doesn't see "credit score: 620/900".
  
  REGULATORY COMPLIANCE in the frontend:
  Loan limits based on declared income (regulatory requirement):
  Max loan = 3× monthly income (configurable per market).
  The slider maximum is capped server-side AND client-side.
  Client-side: immediate feedback ("based on your income, max is ₫50M").
  Server-side: validation on submit (client-side can be bypassed).
  Both layers required.

LEADING 3 JUNIOR MEMBERS:
  
  TASK ASSIGNMENT STRATEGY:
  Break work into modules with clear boundaries.
  Junior A: Personal Info step + Identity Upload step.
  Junior B: Address step + Employment step + Review page.
  Junior C: Loan Calculator UI + Loan Status Tracker.
  PIC (me): state machine, routing logic, form validation library setup,
            API integration layer, error handling patterns.
  
  WHY THIS DIVISION:
  Juniors own UI-heavy work with clear acceptance criteria.
  PIC owns cross-cutting concerns (state, routing, error handling).
  If a junior is blocked: only their module is affected, not the entire flow.
  
  DAILY SYNC (15 minutes, at the start of the day):
  Format:
  "What did you ship yesterday?"  [1-2 sentences]
  "What are you building today?"  [1-2 sentences]
  "What is blocking you?"         [if any]
  
  If blocked > 2 hours without progress: escalate immediately.
  Do not spend a day on a problem that needs 15 minutes of senior input.
  
  CODE REVIEW AS TEACHING:
  NOT: "This is wrong. Change it to X."
  YES: "This useEffect fires on every render because transactionId is not in the deps array.
       Add transactionId to the deps array.
       Reason: [link to React docs on dependencies].
       What do you think happens if transactionId changes between renders?"
  
  The question at the end: forces the junior to think, not just change and forget.
  After 3 months: the junior catches this class of problem themselves.
  
  MEASURING JUNIOR PROGRESS:
  Not: "are they delivering?"
  Yes: "are their PRs improving?"
  Month 1: 8 review comments per PR on average.
  Month 3: 3 comments per PR on average.
  The comments that remain: design decisions, not patterns.
  That's a sign of growth.
```

---

## 3️⃣ Full-Stack Bank Website — Next.js ISR · Nest.js Low-Code · CDN

### &lt;50ms TTFB · Non-developer Content Updates · Zero Deployment Required

```
THE PROBLEM:
  A bank's public website (home, products, rates, promotions).
  Marketing team: changes content frequently.
  "Savings rate changed to 6.8% effective next week."
  "New promotion: zero transfer fees for July."
  
  BEFORE:
  Marketing → requests change to dev team → developer updates hardcoded strings → PR → review → deploy.
  Time from marketing decision to website update: 1-3 days (developer bandwidth permitting).
  Marketing: frustrated. "Why do we need a developer to change a headline?"
  
  AFTER:
  Marketing logs into CMS. Edits the headline. Clicks Publish.
  Website updated in < 2 minutes. No developer. No deployment.

NEXT.JS ISR — HOW IT ACHIEVES &lt;50ms TTFB:
  
  TTFB options:
  
  1. CSR (React SPA): server sends minimal HTML + JS bundle.
     Browser downloads JS, runs it, renders content.
     TTFB: fast (tiny HTML). Time to first meaningful content: 1-2 seconds.
     Search engines: see empty HTML. Bad SEO for a public bank website.
  
  2. SSR (Server-Side Rendering): server generates HTML for every request.
     TTFB: 200-400ms (server must process data before responding).
     At 10K requests/hour: server processes 10K pages/hour. CPU-heavy.
     Each request: database query + template rendering + response.
     Expensive. Doesn't scale without significant infrastructure.
  
  3. ISR (Incremental Static Regeneration) + CDN:
     Pages generated ONCE (static HTML) and cached at CDN edge.
     TTFB: < 50ms (CDN serves pre-built HTML from the nearest edge node).
     
     How ISR works:
     a. On build (or first request): Next.js generates static HTML page.
     b. CDN caches the page (edge nodes: Singapore, Hong Kong, Tokyo, Sydney).
     c. User visits the page: CDN serves the cached HTML. < 50ms.
     d. After `revalidate` seconds (e.g., 60): next request triggers background rebuild.
        The user gets the old page (still fast). Rebuild happens in background.
        NEXT user gets the freshly built page.
     e. On content publish: trigger immediate revalidation (invalidate the CDN cache).
     
     Result: static performance (< 50ms) with dynamic content (updated within 2 minutes of publish).
     
     Code:
     export const getStaticProps = async () => ({
       props: { content: await cmsAPI.getContent() },
       revalidate: 60,  // seconds before allowing a rebuild
     });

CDN ACCELERATION:
  CDN (Content Delivery Network): global network of edge servers.
  User in Hanoi → CDN Singapore edge node (~12ms) instead of origin server (~80ms).
  68% latency reduction just from serving from the nearest edge.
  
  Cache strategy:
  ISR pages: Cache-Control: s-maxage=60, stale-while-revalidate
  Static assets (images, fonts, JS): Cache-Control: public, max-age=31536000, immutable
  (immutable: browser doesn't re-check for updates during the cache period)
  
  On content publish: ISR revalidation endpoint invalidates the CDN cache for that page.
  Next CDN edge request: cache miss → fetches from Next.js origin → caches again.

NEST.JS LOW-CODE CMS:
  
  WHY NEST.JS (not Express, not a headless CMS like Contentful):
  Nest.js: provides TypeScript-first, enterprise-grade structure.
  dependency injection → services are testable (mock the repository, test the service).
  class-validator → input validation as decorators on DTOs.
  Built-in OpenAPI support → auto-generated API documentation for the marketing team's dashboard.
  
  Why custom CMS (not Contentful / Strapi):
  Banks have specific requirements: audit logging, compliance, data residency.
  External CMS: data stored on their servers. Regulatory risk.
  Custom CMS: data stays within the bank's infrastructure.
  
  CONTENT UPDATE FLOW (what the marketing team experiences):
  
  1. Marketing logs in (SSO → bank's identity provider).
  2. Sees: list of editable content blocks (hero, rates, promotions, banners).
  3. Edits: "Savings Rate" → changes "6.5%" to "6.8%".
  4. Clicks Publish.
  
  WHAT HAPPENS IN THE SYSTEM:
  a. POST /cms/blocks/rate { value: "6.8% p.a." }
  b. Nest.js: validates (IsString, MaxLength, auth check, rate cannot be negative).
  c. Saves to database.
  d. Writes audit log: { user: marketing@bank.com, action: "update", field: "savings_rate", old: "6.5%", new: "6.8%", timestamp }
  e. Calls Next.js revalidation API: POST /api/revalidate?secret=...&path=/products/savings
  f. Next.js rebuilds the savings page in background.
  g. CDN cache for that page invalidated.
  h. Response to marketing dashboard: "Published. Live in ~30 seconds."
  
  Total: marketing to live = < 2 minutes. No developer. No deployment.
  
  AUDIT LOG: regulatory requirement.
  Every content change: logged with user, timestamp, old value, new value.
  Compliance team can review: who changed the savings rate, when, and what it was before.
```

---

## 4️⃣ Micro-Frontend Bank Management System

### Module Federation · Independent Deployment · Team Autonomy

```
WHAT THE BANK MANAGEMENT SYSTEM IS:
  Internal tool for bank staff (not customers).
  Used by: branch managers, operations staff, compliance team, risk team.
  Modules: account management, transaction processing, reporting, user management.
  
  Scale: 4+ teams. Each team owns their module. Hundreds of features.
  One monolithic React app: coordination nightmare. Every deploy: all teams affected.
  
  Micro-frontend architecture: each team owns, builds, and deploys their module independently.

MODULE FEDERATION:
  
  HOW IT WORKS:
  Each team's code: a separate webpack/Rspack build.
  Each build: exposes its components via Module Federation.
  The shell (host): loads remote components at runtime, not at build time.
  
  Remote (Account Management team's webpack.config.js):
  new ModuleFederationPlugin({
    name: "accountModule",
    filename: "remoteEntry.js",
    exposes: {
      "./AccountDashboard": "./src/AccountDashboard",
      "./AccountDetail":    "./src/AccountDetail",
    },
    shared: { react: { singleton: true }, "react-dom": { singleton: true } },
  });
  
  Host (shell webpack.config.js):
  new ModuleFederationPlugin({
    name: "shell",
    remotes: {
      accountModule: "accountModule@https://accounts.bank.com/remoteEntry.js",
      txnModule:     "txnModule@https://transactions.bank.com/remoteEntry.js",
    },
    shared: { react: { singleton: true }, "react-dom": { singleton: true } },
  });
  
  Shell code:
  const AccountDashboard = React.lazy(() => import("accountModule/AccountDashboard"));
  // When user navigates to /accounts: AccountDashboard is downloaded and rendered.
  // Before navigation: zero bytes downloaded for accountModule.

KEY BENEFITS IN A BANK CONTEXT:
  
  1. INDEPENDENT DEPLOYMENT:
     Core Banking team: deploys every 2 weeks (careful, slower cadence).
     Payments team: deploys every week (frequent feature updates).
     Reporting team: deploys when new reports are ready (irregular).
     
     With a monolith: deploy cadence = slowest team's cadence.
     All teams wait for Core Banking's 2-week release.
     With micro-frontends: each team deploys on their own schedule.
     Payments deploys on Friday. Core Banking deploys the following Tuesday.
     Zero coordination required.
  
  2. TECHNOLOGY ISOLATION:
     Reporting team: wants to use React Query for data fetching.
     Core Banking team: uses Redux.
     In a monolith: one state management library for all teams.
     In micro-frontends: each team picks what works for their module.
     
     Risk isolation: if Reporting module has a bug that crashes React:
     Only the Reporting module goes down. Shell and other modules continue.
     Error boundary around each lazy-loaded remote.
  
  3. TEAM AUTONOMY:
     Each team owns: their code, their tests, their CI pipeline, their deployment.
     No waiting for another team's PR to be reviewed before your deploy.
     Faster iteration. More ownership.
  
  IMPORTANT — SHARED REACT (singleton: true):
  Both the shell and the Account module import React.
  Without singleton: two React instances loaded. React is not designed for this.
  useState in the Account module uses a different React than the shell.
  Context from the shell is NOT visible to the Account module.
  
  singleton: true tells Module Federation: share ONE React instance.
  The first loaded version wins. All modules use that version.
  Every team must use a compatible React version (semver compatible).
  This is the main coordination point: React version upgrades must be synchronized.

WHAT I CONTRIBUTED:
  
  "Contributed to the development" = not the primary architect (that was a lead engineer).
  But: meaningful contribution to the foundation.
  
  What to say when asked:
  "I contributed to the core shell application: the routing system that loads
  remote modules dynamically, the shared auth context (all modules read user
  role and permissions from the shell's context), and the error boundary setup
  that prevents one module's failure from crashing the shell."
  
  If asked about architecture: you can speak to the overall architecture
  from the experience of implementing parts of it.
```

---

## STAR Scripts

### Shopee Financial App

```
SITUATION:
  ShopeePay was expanding its financial app to 5 Southeast Asian markets.
  Each market: different language, currency format, date format.
  A critical bug in the transfer flow required same-day hotfix without App Store wait.

TASK:
  Serve as Key Architect for the React Native financial app: design the state management
  architecture, multi-language system, offline behavior, and hot update capability.

ACTION:
  Chose Zustand (slice pattern: walletStore/transactionStore/userStore/configStore).
  Implemented optimistic updates with rollback for transfer operations.
  Built lazy-loading i18n (only English bundled at startup; other locales loaded on-demand).
  Designed offline-first background sync with careful error messaging.
  Implemented CodePush for hot updates (critical for financial bug fixes).

RESULT:
  5 locales (EN/VI/TH/ID/ZH) with correct number/currency/date formatting.
  Hot update used in production: critical bug fixed and deployed in < 4 hours.
  Offline balance display maintained user trust when connectivity dropped.
```

### Account Opening & Loan (PIC)

```
SITUATION:
  Shopee Finance needed to launch an account opening flow and loan product.
  No existing code, no API contracts, 3 junior team members, 3-month deadline.

TASK:
  Lead the technical design and delivery of both modules as PIC.
  Ensure both ship on schedule and with correct KYC regulatory compliance.

ACTION:
  Designed a state machine for KYC onboarding (handling: KYC failure, resume after quit,
  conditional steps by region). Defined API contracts with backend in Week 1 so both
  teams could develop in parallel (frontend mocked with MSW). Assigned work to 3 juniors
  by module (clear boundaries, parallel development). Daily 15-minute syncs.
  Code review focused on teaching (explained WHY, linked to docs, asked follow-up question).

RESULT:
  Both modules launched on schedule. Regulatory KYC compliance met.
  Junior PR quality improved: average review comments dropped from 8 to 3 over 3 months.
  API integration completed in half a day (upfront contract → zero interface mismatch).
```

---

## Follow-up Q&A

**"Why Zustand and not Redux Toolkit (which reduces boilerplate)?"**
> "RTK (Redux Toolkit) does reduce Redux boilerplate significantly. I evaluated it seriously. The remaining differences with Zustand: RTK still requires Provider wrapping at the component tree root — this matters in React Native where Expo manages the app entry point. RTK's createSlice generates reducers and action creators, but the pattern is still 'dispatch an action → reducer handles it.' With Zustand: the store function IS the action. The transfer() function is the action, the reducer, and the optimistic update in one place. For async logic (which is dominant in a financial app), RTK requires createAsyncThunk or RTK Query. Zustand: async is just `await` inside a store function. The team adopted it faster. Less ceremony for the same result."

**"How did the low-code CMS handle security? Non-developers editing bank content sounds risky."**
> "Two layers of protection. First: the CMS validates every input server-side (Nest.js class-validator decorators). Interest rate fields: IsNumber, Min(0), Max(100). Text fields: MaxLength, no HTML tags allowed (prevent XSS if content is ever rendered with dangerouslySetInnerHTML). Second: RBAC in the CMS. Not all marketing team members can publish to production. Junior content editors: can draft and preview. Senior content managers: can approve and publish. The approval workflow is built into the Nest.js service layer. Third: the audit log. Every published change is logged with the user identity (from SSO), old value, new value, and timestamp. If wrong content is published: we know who, when, and what they changed. This satisfies the compliance team's requirement for content governance."

**"What was the hardest part of the micro-frontend BMS?"**
> "The shared state between modules. Each module is isolated, which is good. But some state must be shared: the logged-in user's identity and role (auth state). And the selected customer account (if a user navigates from Account Management to Transaction Processing for the same account, the selected account should carry over). We solved this with two mechanisms: auth state lives in the shell's React context. All modules consume it via useShellContext() (a shared hook exported from the shell). Selected account state: we used URL parameters as the source of truth (/accounts/ACC123/transactions → the txnModule reads :accountId from the URL). The URL is the shared state. It's accessible to any module via the router. This avoids the need for a shared Zustand store between independently deployed modules — which would create a hard dependency."

**"What happens if the ISR revalidation fails? Does the website go down?"**
> "No. ISR is designed for resilience. If the rebuild fails (CMS API returns an error during the page build): Next.js keeps serving the previous static page. The user sees slightly stale content, not an error. The failed revalidation is logged and alerts fire. The marketing team sees 'Published' on their dashboard, but the page rebuild fails silently for the user (showing old content). We have monitoring on revalidation success rate. If it drops below 99%: an alert fires and we investigate. In practice: the main failure mode is CMS API downtime. We set the CMS to retry revalidation 3 times before giving up, with exponential backoff. Most transient failures are handled by the retry."

---

## 🔗 Unified Narrative

> "Financial applications are where frontend engineering gets serious. The constraint — user trust must be maintained under all conditions — changes everything. A slow API? The balance still shows from cache. A transfer fails? The deducted amount is restored immediately. A critical bug? Hot update deployed in hours, not days after App Store review. These are not nice-to-haves. In a financial app, they are table-stakes.
>
> The Account Opening PIC role was the leadership experience that showed me the difference between being the best individual contributor and being the person who makes a team effective. I could have written all the onboarding code faster by myself. That's not the point. The juniors I led — after three months, their code required 60% fewer review comments. They were independently handling the same class of problem. That compounding is the real output of the PIC role.
>
> The bank website project is the one I use when explaining ISR to engineers who haven't used it. 'The page is static — but it updates when content changes. How?' The revalidation system is the insight. Static performance with dynamic content is not a contradiction when you understand how Next.js separates the page-building step from the page-serving step."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I used React Native with Zustand" | "**Key Architect**: chose Zustand (slice pattern: walletStore/transactionStore/userStore/configStore). **Why over Redux**: hook-first (no Provider), persist middleware (AsyncStorage 2 lines), async store functions (no createAsyncThunk). **Financial-specific decisions**: optimistic updates with rollback (balance deducted immediately, restored on API failure), offline-first (cached balance + 'Updated 3 min ago', never 'Error loading'), data normalization (user stored once, 50 transactions reference by ID)." |
| "I added i18n and hot updates" | "**5 locales (EN/VI/TH/ID/ZH)**: lazy-loaded (only English bundled at startup, other locales fetched on first switch → cached in AsyncStorage). Intl.NumberFormat per locale for currency/date. **Hot updates (CodePush)**: JS bundle delta only (not full bundle), background download, applied on next launch. **Why critical**: financial P0 bug → fix deployed in <4 hours vs 1-7 days App Store review. Rollback: one command if crash rate spikes." |
| "I was PIC of account opening" | "**From scratch to launch in 3 months**. State machine (not booleans: KYC fail→different state than address, quit→resume from saved state). **API contracts before code**: both teams built in parallel (frontend mocked with MSW), integration done in half a day. **Led 3 juniors**: module assignment by clear boundaries, daily 15-min sync (what shipped/what today/blockers), code review = teaching ('WHY + link + follow-up question'). Metric: PR review comments 8→3 over 3 months." |
| "I used Next.js and built a CMS" | "**ISR + CDN**: TTFB <50ms (vs SSR ~340ms, vs raw server ~80ms). Mechanism: static HTML cached at CDN edge, background rebuild after revalidate seconds, immediate invalidation on content publish. **Nest.js low-code CMS**: class-validator DTOs, dependency injection (testable), audit log (regulatory), RBAC (draft/approve/publish workflow). Marketing publishes → CMS validates → audit log → Next.js revalidation API called → CDN cache invalidated → live in <2 min. **Zero developer involvement after CMS built.**" |
| "I worked on a micro-frontend project" | "**Contributed to**: shell routing (dynamic module loading with React.lazy+Suspense+error boundary), shared auth context (all remotes consume via useShellContext), URL-as-shared-state for cross-module navigation. **Module Federation**: singleton React (prevents 2 React instances, required for context sharing). Key benefit: **independent deploy cadence** (Core Banking 2-week, Payments weekly, Reporting irregular — zero coordination). Technology isolation: one module crash doesn't affect shell." |

---

## 📊 Quick Facts

```
SHOPEE FINANCIAL APP:
  Platform:    React Native (iOS + Android, single codebase)
  State:       Zustand (4 slices: wallet/transaction/user/config)
  Key patterns: optimistic updates with rollback, cursor pagination,
               data normalization, offline-first background sync
  i18n:        5 locales (EN/VI/TH/ID/ZH), lazy-loaded, Intl.* formatting
  Hot updates: CodePush, JS bundle delta, applied on next launch, rollback capable
  P0 scenario: critical bug deployed in < 4 hours (vs 1-7 days App Store)

ACCOUNT OPENING & LOAN (PIC):
  Timeline:    Scratch → production in 3 months
  Team:        PIC + 3 junior members
  Design:      KYC state machine (conditional transitions, serializable state)
  Strategy:    API contracts in Week 1 → parallel frontend/backend development
  Leadership:  module-level task assignment, daily 15-min sync, teaching code review
  Metric:      PR comments 8→3 over 3 months (junior skill improvement)
  Loan:        monthly payment formula (reducing balance), status state machine
  Compliance:  max loan capped both client-side (UX) and server-side (security)

BANK WEBSITE:
  Frontend:    Next.js with ISR (revalidate: 60)
  TTFB:        < 50ms (CDN edge) vs ~340ms (SSR) vs ~80ms (unoptimized)
  CDN:         Cache-Control s-maxage=60 stale-while-revalidate, edge nodes APAC
  CMS backend: Nest.js (class-validator, DI, audit log, RBAC, revalidation webhook)
  Workflow:    marketing edit → validate → audit → Next.js revalidate → CDN purge → live < 2min
  Why custom:  data residency requirements (bank data cannot leave internal infra)

MICRO-FRONTEND BMS:
  Architecture: Module Federation (shell + 4 remote modules)
  Modules:     Account Mgmt (Core Banking), Transactions (Payments), Reports (BI), Users (Identity)
  Shell:       routing, auth context, shared nav, error boundaries
  Deploy:      each team: independent cadence. No coordinated releases.
  Shared state: auth via shell React context, cross-module navigation via URL params
  React:       singleton: true (prevents 2 React instances, enables context sharing)
  My contribution: shell routing, shared auth context, error boundary setup
```

---

*Document last updated: June 2026 · FinTech & Banking Engineering interview preparation*
