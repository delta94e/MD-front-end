# ✈ Interview Guide — TERA Software Engineer II (Web)
## FE Web PIC · Quarterly Planning · Release Owner · Messaging Platform Engineering PIC · District

---

## 🔑 Context: SE II vs SE I — The Difference

```
SOFTWARE ENGINEER I: Build features.
  - Receives requirements from PM.
  - Implements features with guidance.
  - Writes unit tests.
  - Participates in code review.

SOFTWARE ENGINEER II: Own projects and represent the team.
  - Assesses what needs to be built (not just what is assigned).
  - Makes technical decisions for a domain.
  - Coordinates with other teams to unblock delivery.
  - Owns the release process — production is your responsibility.
  - Mentors SE I engineers.
  - Speaks for the team in planning meetings.

THE DISTINCTION THAT MATTERS IN AN INTERVIEW:
  SE I: "I built Feature X."
  SE II: "I owned the Supply frontend. I assessed all incoming projects,
          allocated engineers, managed the release, and was the point of contact
          for Backend and QA when things went wrong."
  
  SE II engineers reduce the burden on engineering managers.
  An EM trusts an SE II to run a team area without daily oversight.

YOUR SPECIFIC SE II SCOPE:
  FE Web PIC for Supply = two mission teams:
    Direct Sourcing: getting hotels to list directly on Traveloka (vs GDS aggregators).
    Business Operations: internal tools for Traveloka's ops team managing partners.
  
  Engineering PIC for Messaging Platform = cross-product notification system.
  (Different scope: the messaging project spans multiple product teams.)
  
  Plus: maintaining internal tools for Multi-platform Infra (Soya web + District mobile).
```

---

## 1️⃣ FE Web PIC for Supply Mission Teams

### What "PIC" means and what owning a team area entails

```
PIC = Person In Charge.
  Common in Southeast Asian tech companies (Traveloka, Grab, Gojek, Shopee).
  The PIC is the single accountable technical owner for a domain or project.
  
  NOT a manager: you don't do performance reviews.
  NOT just a contributor: you make decisions, not just follow them.
  
  The PIC is the person who gets called when something is wrong
  and the person who is praised when things go right.

SUPPLY MISSION TEAMS — WHAT THEY BUILD:
  
  Direct Sourcing team:
  Goal: onboard hotels directly onto Traveloka (not through GDS/aggregators like Expedia).
  Direct-listed hotels = higher margin for Traveloka (no aggregator commission).
  
  Frontend projects owned:
  - Partner Onboarding Flow: the wizard hotels complete to get listed on Traveloka.
    Complex: property details, room types, rate plans, photos, amenities, legal agreements.
    Multi-step, multi-session (partners don't complete it in one sitting).
    Progress saved per step (Redux persisted state + backend draft endpoint).
  
  - Digital Contract Signing: instead of mailing physical contracts to hotels,
    display the contract in-browser, collect e-signature, store signed PDF.
    Legal requirement: signature must be cryptographically verifiable.
    Frontend: PDF rendering (pdf.js), signature capture canvas, submit to API.
  
  Business Operations team:
  Goal: internal tools for Traveloka's ops team to manage partner relationships.
  
  Frontend projects owned:
  - Property Audit Dashboard: ops team can view all properties,
    filter by compliance status, identify partners who need attention.
  - Bulk Rate Update Tool: ops team can update rates for multiple properties simultaneously.
    (Partners sometimes need help updating pricing for a campaign.)

QUARTERLY PLANNING — THE PIC'S PROCESS:
  
  1. PROJECT SIZING:
     Before each quarter starts: PM presents the roadmap (what we want to build).
     PIC's job: break each project into frontend tasks and estimate man-weeks.
     
     Sizing rubric:
     XS: < 1 week.   One new page with no new API surface.
     S:  1-2 weeks.  One feature with a new API endpoint.
     M:  2-4 weeks.  Multiple pages or a complex single page with state management.
     L:  4-6 weeks.  Major feature (new user flow, significant state, API design).
     XL: 6+ weeks.   New product area (new navigation, new patterns, new architecture).
     
     Estimation method:
     a) Decompose: how many screens? How many new components? How many API calls?
        How many Redux reducers? How many test files?
     b) Multiply by complexity: Is this a familiar pattern or new territory?
        Does it touch legacy code? Does it require backend API design collaboration?
     c) Add 20% buffer: always. Things take longer than expected.
        There will be: an edge case in QA, a design revision, a dependency delay.
     d) Review with the team: present the estimate. Does the team agree?
        "You said 4 weeks for the audit dashboard. I think it's 3."
        Discuss. Adjust. Commit to an agreed estimate.
  
  2. CAPACITY PLANNING:
     Not all engineers are 100% available for feature development.
     Overhead activities: code review, Soya/District maintenance, incidents, 1:1s, planning.
     Typical overhead: 15-20% per engineer.
     
     Rule: never commit to 100% capacity.
     Commit to: total capacity × 0.8 (80% rule).
     The remaining 20%: absorbs incidents, reviews, unexpected asks.
     
     If estimated project work > committed capacity:
     Options: (a) descope features, (b) push to next quarter, (c) request headcount.
     PIC surfaces this to PM early. Not when the quarter is half over.
  
  3. DEPENDENCY MAPPING:
     For each project: what does FE need from other teams before it can start?
     
     - Backend API: "The audit dashboard needs GET /api/v2/properties/audit-status.
       Is this API ready? When is it ready? Have we agreed on the contract?"
     - Design: "Are all wireframes approved? Have we reviewed with UX for edge cases?"
     - QA: "Is the test plan written? Do we know what scenarios QA will cover?"
     
     Unresolved dependency = project risk.
     Risk identified in planning = solvable.
     Risk identified during sprint = crisis.
     
  4. RISK FLAGGING:
     "Messaging Platform — Backend API delayed 2 weeks."
     
     As PIC: surfaced in the next planning sync.
     "The messaging inbox is blocked by backend. Our 5 FE-weeks of work cannot start.
     Two options: (a) start another project in parallel and come back to this,
     or (b) adjust the timeline. I recommend option A."
     
     The PIC is the person who knows about this risk.
     If the PIC doesn't say anything: the PM assumes it's on track.
     Proactive communication > being right at the retrospective.
```

---

## 2️⃣ TERA Web Release Schedule — Ownership

### What owning the release schedule means

```
BI-WEEKLY RELEASE CADENCE:
  TERA Web releases every 2 weeks (Thursday).
  Regular cadence creates predictability for: partners, ops team, backend team, QA.
  Partners know: new features appear every 2 weeks.
  
AS RELEASE OWNER, MY RESPONSIBILITIES:
  
  WEEK 1 — Development:
  - Track: which features are being developed? On track?
  - Code freeze: Wednesday of Week 1. No new features after Wednesday.
    Only bug fixes merged after the code freeze.
  - Communicate code freeze: "Feature X is in the next release, not this one."
    This requires sometimes saying no to a PM who wants to add "just one more thing."
  
  WEEK 2 — QA and Release:
  - Monday: deploy to staging environment. QA begins testing.
  - During QA: I am the first contact for reported issues.
    QA finds a bug → I triage: is this a blocker or can it go in the next release?
  - Wednesday: QA sign-off deadline.
    All critical and major issues resolved. Minor issues may be deferred with PM agreement.
  - Thursday: canary deploy (5% of partners on new version).
    Monitor: error rates, loading times, console errors.
    If error rate increases: rollback immediately.
  - Following Monday: if canary stable → 100% rollout.
  
THE RELEASE BLOCKED DECISION:
  Sometimes QA finds a critical issue (a regression) that cannot be fixed before Thursday.
  Decision: delay the release or release without the affected feature?
  
  If the issue is in Feature X and Feature X is behind a flag:
  Turn off Feature X's flag → release without it → no regression for users.
  Feature X goes into the next release.
  
  If the issue is in core functionality (availability calendar, booking management):
  Delay the release. No negotiation.
  A broken core feature in production costs more than a 2-week delay.

COORDINATING WITH BACKEND RELEASE MANAGER:
  
  TERA Backend has its own release manager.
  TERA's web and backend releases are coordinated.
  
  WHY THIS MATTERS:
  If the FE ships before the backend: FE makes API calls that don't exist yet → 404 errors.
  If the backend ships first and makes a breaking change: FE breaks on old API → 500 errors.
  
  COORDINATION RULES:
  1. API contract: agreed weeks before release. Both sides implement to the spec.
  2. Deploy order: backend first, FE after.
  3. Backward compatibility: backend ships API that supports both old and new FE
     during the transition window (canary period).
  4. DB migrations: backend communicates when DB migrations run.
     Some migrations cause brief API unavailability.
     Coordinate: FE maintains a loading state during the migration window.
  
  WEEKLY SYNC:
  FE release owner + BE release manager: 30-minute sync every Monday.
  Agenda: API status, pending contracts, deployment window, rollback plans.

FEATURE FLAG STRATEGY:
  Every new feature in a TERA release is behind a feature flag.
  
  WHY:
  1. Canary releases: enable the feature for 5% of partners first.
     If a bug appears: turn off the flag. 95% of partners never see the bug.
  2. Kill switch: if a bug is found post-release: turn off the flag immediately.
     No deploy required. Instant mitigation.
  3. Separate FE and backend releases: FE can ship the UI before the backend is ready.
     The flag is off. Users don't see the UI. Backend team can take their time.
  4. Partner-specific enablement: some features roll out to specific partner segments first.
     Flags enable per-partner or per-segment targeting.
  
  NAMING CONVENTION:
  FF_{PRODUCT}_{FEATURE_NAME}
  FF_TERA_DIGITAL_SIGNING
  FF_TERA_RATE_MANAGEMENT_V2
  FF_MSG_PARTNER_INBOX
  
  All flags default to false (off). Opt-in enablement only.
  This ensures: a newly deployed flag cannot accidentally activate.

HOTFIX PROCEDURE:
  
  P0: Complete feature unavailability. Partners cannot update availability, bookings broken.
  SLA: mitigate within 1 hour. Fix visible to all partners within 3 hours.
  
  Step 1 (0-5 minutes):
    Turn off the feature flag for the affected feature.
    Partners immediately see the previous behavior.
    If no flag: rollback the deployment.
    Do NOT investigate root cause at this step. Mitigate first.
  
  Step 2 (5-30 minutes):
    Root cause investigation. What changed that caused this?
    Narrow: was it a FE change, a backend change, or infrastructure?
    Coordinate with backend and infra as needed.
  
  Step 3 (30-60 minutes):
    Hotfix implemented and reviewed (≥ 2 engineers review, even under time pressure).
    Hotfix branch is from the PRODUCTION tag, not from main.
    Why: main might have other unreleased changes. Hotfix must be surgical.
  
  Step 4 (60-120 minutes):
    Hotfix deployed to staging (5-minute test) → canary 5% (30 minutes) → 100%.
    Expedited but not skipped. Canary for 30 minutes catches obvious issues.
  
  Step 5 (within 48 hours):
    Post-mortem. Root cause documented.
    Prevention: what test would have caught this?
    Action items assigned with owners and due dates.
    
  COMMUNICATION DURING P0:
  Every 15 minutes: status update in the incident channel.
  "09:30 — Investigating. Feature X flagged off. Partners on old behavior."
  "09:45 — Root cause identified: null check missing in RateInput component."
  "10:00 — Fix ready. Code review in progress."
  "10:15 — Fix deployed to canary (5%). Monitoring."
  "10:45 — Canary stable. Rolling out to 100%."
  "11:00 — Incident resolved. Post-mortem scheduled for Wednesday."
```

---

## 3️⃣ Engineering PIC — Messaging Platform

### What it means to be the Engineering PIC of a cross-product project

```
SCOPE OF THE MESSAGING PLATFORM:
  A centralized notification system across multiple Traveloka products.
  
  Producers (systems that send events to the platform):
  - TERA: "Booking confirmed" → notify the partner.
  - Payments: "Payment received" → notify partner and guest.
  - CRM: "Guest left a review" → notify the partner.
  - Ops Tools: "Partner audit due" → notify the ops team member.
  
  Channels (how notifications are delivered):
  - In-app: notification bell in TERA web + TERA mobile.
  - Push: mobile push notification (FCM for Android, APNs for iOS).
  - Email: transactional emails (via SendGrid or similar).
  - SMS: for high-priority messages (booking confirmations with payment).
  
  The platform: routes events to the right channels based on routing rules,
  renders the message using templates, delivers, and tracks delivery status.
  
  WHY A CENTRALIZED PLATFORM:
  Before: each product team built its own notification logic.
  TERA had its own: ad-hoc emails, manual push notifications, no tracking.
  Payments had its own: separate email templates, no deduplication.
  
  Problems:
  - Partner receives 4 separate notifications for one booking (one from each system).
  - No delivery tracking: "did the partner receive the booking confirmation?"
  - Duplicate notifications on partner email.
  - No per-partner notification preferences.
  
  The messaging platform: solves all of these at the infrastructure level.

ENGINEERING PIC RESPONSIBILITIES (DIFFERENT FROM FE PIC):
  
  As FE Web PIC: I represent the frontend of my team.
  As Engineering PIC of Messaging Platform: I represent the ENTIRE engineering
  of this cross-team project.
  
  1. TECHNICAL DESIGN DOCUMENT (TDD):
     Authored by the Engineering PIC.
     Contents: system architecture, data model, API contracts, event schema,
     channel routing rules, retry policy, delivery tracking mechanism.
     
     Review process: circulate TDD to all stakeholder teams.
     FE team reviews: can we implement this from the frontend?
     BE team reviews: can our services produce events to this schema?
     Platform team reviews: can our infrastructure support this load?
     
     Sign-off: "This design is correct and complete. All teams agree."
     
  2. EVENT SCHEMA DEFINITION:
     Every event has a common structure:
     {
       eventId:      UUID (idempotency key),
       eventType:    "BOOKING_CONFIRMED" | "PAYMENT_RECEIVED" | ...,
       producerId:   "tera" | "payments" | "crm",
       recipientId:  partner_id or user_id,
       channels:     ["in-app", "email"],
       payload:      {...},  // event-specific data
       templateId:   "booking_confirmed_v2",
       priority:     "high" | "normal" | "low",
       expiresAt:    ISO date or null,
       idempotencyKey: UUID (prevents duplicate delivery),
     }
     
     WHY IDEMPOTENCY KEY:
     A producer might send the same event twice (network retry, at-least-once delivery).
     The messaging platform uses the idempotencyKey to detect: "I've seen this before."
     Second delivery: no-op. Partner receives one notification, not two.
     
     WHY eventId ≠ idempotencyKey:
     eventId: identifies this specific event record.
     idempotencyKey: identifies the real-world event (e.g., this booking confirmation).
     Multiple events can have the same idempotencyKey if they represent the same fact.
     
  3. CROSS-TEAM ALIGNMENT (the hardest part):
     Payments team calls the event: "ORDER_PAID".
     CRM team calls it: "PAYMENT_SUCCESS".
     TERA calls it: "BOOKING_PAYMENT_CONFIRMED".
     
     The Messaging Platform needs: ONE canonical event type name.
     Choosing "BOOKING_CONFIRMED" as the canonical name:
     Payments team disagrees: "It's ORDER_PAID in our domain."
     
     Resolution: canonical name for the messaging platform (consumer view).
     Internal names in each system can differ.
     The event producer adapts its internal name to the canonical schema before sending.
     
     This requires: multiple alignment meetings, firm decisions, documented rationale.
     As Engineering PIC: I run these meetings. I make the call when teams disagree.
     
  4. RETRY POLICY:
     Delivery can fail: push notification token expired, email bounced, SMS gateway down.
     
     Policy: 3 retries with exponential backoff.
     Attempt 1: immediate.
     Attempt 2: 30 seconds later.
     Attempt 3: 5 minutes later.
     If all fail: event goes to the dead letter queue (DLQ).
     Ops team monitors DLQ. Manual review for critical events (P0 notifications).
     
     This policy is defined by the Engineering PIC and applies to ALL channels.
     
  5. INCIDENT OWNERSHIP:
     Messaging Platform goes down: partner notifications stop.
     Partners don't know their booking was confirmed. Support tickets spike.
     
     As Engineering PIC: I am the incident commander.
     Not just the FE owner — the entire incident.
     Coordinate: FE team (is the inbox UI broken?), BE team (are events being produced?),
     Platform team (is the delivery service down?).
     
     Communicate status every 15 minutes to all stakeholders.
     After resolution: Engineering PIC writes the post-mortem.
```

---

## 4️⃣ District — Mobile Design System

### How it differs from Soya and what maintainer means

```
SOYA (web) vs DISTRICT (mobile):
  
  Soya: React components for web. Renders to the DOM.
  District: React Native components for mobile. Renders to native iOS and Android UI.
  
  They cannot share rendering code because React Native uses different primitives:
  Web:    <div>, <span>, <button>, <input>
  Mobile: <View>, <Text>, <TouchableOpacity>, <TextInput>
  
  WHAT IS SHARED between Soya and District:
  1. Design tokens: colors, spacing, typography scales, border radii.
     A single source of truth generates:
     CSS custom properties for Soya.
     JavaScript constants for District.
     
  2. Icon set: SVG for web, vector assets for native.
     Same icons, different format.
  
  3. API design: the prop interface is aligned.
     Soya:    <Button size="md" variant="primary" onPress={fn} />
     District:<Button size="md" variant="primary" onPress={fn} />
     Same props → engineer switching from web to mobile work: minimal learning curve.

PLATFORM-SPECIFIC DIFFERENCES IN DISTRICT:
  A component must work correctly on BOTH iOS and Android.
  Sometimes they look/behave differently by design:
  
  Shadow vs Elevation:
  iOS: box-shadow is supported.
  Android: uses elevation (a different model, no x/y offset).
  District Card component handles both:
    Platform.select({ ios: { boxShadow: "..." }, android: { elevation: 4 } })
  
  Tap feedback:
  iOS: opacity dim on press (TouchableOpacity).
  Android: ripple effect (TouchableNativeFeedback).
  District Button abstracts this: uses the correct native feedback per platform.
  
  Fonts:
  iOS: SF Pro is the default system font.
  Android: Roboto is the default.
  District's text components use the system font by default,
  but allow override with Traveloka's custom brand font.

DISTRICT MAINTAINER RESPONSIBILITIES:
  Same principles as Soya, with mobile-specific additions:
  
  1. REVIEW for accessibility on mobile:
     Screen readers: VoiceOver (iOS), TalkBack (Android).
     Accessible prop: accessibilityLabel on interactive components.
     accessibilityRole: "button" | "link" | "text" | etc.
     Component must be reachable and usable with system screen reader.
  
  2. PLATFORM TESTING:
     Every PR: manually tested on both iOS (physical device or simulator) and Android.
     CI: snapshot tests with both platform configurations.
  
  3. REACT NATIVE UPGRADE:
     When React Native releases a major version:
     All District components must be tested for compatibility.
     Breaking changes in React Native → potential breaking changes in District.
     Migration guide required.
  
  4. VERSIONING:
     Same semantic versioning as Soya.
     BREAKING changes require major version bump and migration guide.
     
     Example: Button's onPress API changed from `onPress: () => void`
     to `onPress: (event: GestureEvent) => void`.
     This is a breaking change. All consumers must update.
     Provide a codemod: script that automatically updates the prop signature.
```

---

## STAR Scripts

### Quarterly Planning as FE Web PIC

```
SITUATION:
  Q3 planning: 8 projects proposed for the Supply FE Web team.
  Total estimated FE effort: 44 man-weeks.
  Available capacity: 5 engineers × 10 weeks × 80% = 40 man-weeks.
  4-week gap. Needed to make decisions before the quarter started.

TASK:
  As FE Web PIC: assess all projects, produce man-week estimates,
  identify dependencies and risks, and propose a deliverable plan.

ACTION:
  Sized all 8 projects using XS/S/M/L/XL framework with team review.
  Identified: Messaging Platform blocked by backend API (2-week delay).
  Proposed: start Bulk Rate Update Tool while waiting for Messaging Platform API.
  Descoped: Property Category Taxonomy Refactor to Q4 (P2, no Q3 business deadline).
  Flagged to PM: "Digital Signing needs design sign-off by Week 3 or it slips."
  After planning: 8 projects → 7 projects, adjusted for capacity, risks documented.

RESULT:
  Q3 ended with 6/7 planned projects delivered on time.
  1 project (Messaging Platform inbox) delivered 1 week late due to the backend delay
  (which I had flagged in planning). Stakeholders were not surprised.
  Digital Signing delivered on time: design was ready by Week 2 as agreed.
```

### Release Management — Preventing Production Incident

```
SITUATION:
  Q3 release cycle: new Rate Management v2 UI shipping in v2.14.0.
  QA found a critical issue on Wednesday: rate input allows negative values.
  Partners could set a room rate to -100 VND. Would cause billing errors.

TASK:
  As release owner: decide whether to delay the release, fix and release, or release without the feature.

ACTION:
  Triaged: the issue is in the FF_RATE_V2 feature only (behind a flag).
  Decision: release on schedule with FF_RATE_V2 turned off.
  Partners see the existing rate management UI (no regression).
  Fix implemented: server-side validation + client-side validation for negative values.
  Fix reviewed and merged Thursday morning.
  FF_RATE_V2 re-enabled in a subsequent patch release (same day, no QA gate required for a 1-line fix).

RESULT:
  Release shipped on schedule. No partners impacted by the negative rate bug.
  The fix was deployed same-day. Rate Management v2 went live Friday.
  Approach: feature flags enable clean separation of "ship the code" from "enable the feature."
  No delay. No regression. No incident.
```

---

## Follow-up Q&A

**"What does being a FE Web PIC actually involve day-to-day?"**
> "The PIC role is the connective tissue between the team and everyone else. Day-to-day: I'm the first contact when another team has a question about our frontend ('Can TERA web support this new API contract?'). I'm in planning meetings representing the frontend perspective ('That feature will take 4 weeks, not 1'). I'm unblocking engineers who hit cross-team dependencies ('The audit dashboard needs the backend GET /audit-status endpoint — I'll chase the backend team for a timeline'). I'm watching the release pipeline to make sure we're on track. None of this prevents me from writing code — I still contribute to features. But I carry the meta-level awareness of where the team is heading, what's at risk, and what decisions need to be made."

**"How do you estimate project sizes?**
> "It starts with decomposition. I break the project into: screens, components, API calls, Redux state slices, test files, and integration points. Then I estimate each piece independently. A new screen with a complex table: 3 days. A new Redux slice with async thunks: 1-2 days. Then I apply a complexity multiplier: is this a familiar pattern? Or is it new architecture (first time we're doing X)? New patterns add 50% because we'll hit unexpected problems. Then I add a 20% buffer — always — and I mean always. Something always takes longer. Finally, I review with the team. If someone who will build it thinks my estimate is off, I want to know before I commit it to PM. The team's estimate is always more accurate than mine alone."

**"What's the hardest part of being Engineering PIC for a cross-product project?**
> "Naming and schema alignment. I know that sounds trivial. It is not. Each team has its own domain language. Payments calls an event 'ORDER_PAID'. TERA calls the same event 'BOOKING_PAYMENT_CONFIRMED'. Both are correct in their domains. But the Messaging Platform needs one canonical name. Choosing that name requires: convincing teams to adapt their producer code to a new name, which feels like extra work to them. The way I handled it: I didn't choose arbitrarily. I documented the naming rationale in the TDD: 'We use BOOKING_CONFIRMED because it describes the outcome (booking is confirmed) rather than the mechanism (order paid). This is consumer-centric language.' Teams were more willing to accept a decision with documented reasoning than an arbitrary decree. Still took 2 alignment meetings. But we got there."

**"What is the purpose of the 80% capacity rule in planning?**
> "Incidents happen. They are not predictable but they are inevitable. A P0 in production takes an engineer fully offline for half a day: triage, fix, deploy, post-mortem. If I plan for 100% capacity: one incident destroys the sprint. The other 20% is also for: code reviews (which take longer than engineers estimate), Soya and District maintenance work (reviewing PRs, releasing versions), and the inevitable ad-hoc asks from PMs ('quick question: can we add this small thing?'). The 80% rule is not pessimistic. It is honest. Engineers who plan for 100% and deliver 75% look unreliable. Engineers who plan for 80% and deliver 80-90% look excellent. Realistic commitments build more trust than ambitious commitments."

---

## 🔗 Unified Narrative

> "The SE II role at TERA is best understood as moving from 'building the thing' to 'owning the thing.' As a PIC, I was accountable not just for the features I personally wrote, but for the health of the entire frontend for the Supply teams — Direct Sourcing and Business Operations. That means: accurate estimates at planning time, dependency identification before the quarter starts, clear communication when risks materialize, and a release process that doesn't surprise anyone.
>
> The release ownership is where accountability becomes concrete. Every bi-weekly release is my signature on the quality of what goes to production. The decision to delay a release because QA found a blocker, or to release without a feature because it's safely behind a flag, is my call. Getting that decision right consistently is what distinguishes SE II from SE I.
>
> The Engineering PIC role for Messaging Platform was a different dimension: cross-team technical ownership. The TDD, the event schema, the canonical naming, the retry policy — these were design decisions that affected every team that produced events to the platform. Writing the TDD is not the hardest part. Getting every team to agree on it is. That required understanding each team's constraints well enough to design a solution that worked for all of them, and being willing to make final calls when alignment was slow.
>
> The District maintainer role is a multiplier: a component I review and approve ships to every mobile app at Traveloka. The accessibility review I do on a PR affects every user who uses a screen reader. That leverage is why design system maintenance is taken seriously at the senior level — not because it's glamorous, but because the blast radius of a mistake is enormous."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I was a PIC" | "**FE Web PIC for Supply**: single accountable technical owner for Direct Sourcing + BizOps frontend. **Quarterly planning**: project sizing (XS/S/M/L/XL + man-weeks), capacity planning (80% rule, overhead 15-20%), dependency mapping (API readiness/design/QA plan), risk flagging before the quarter starts." |
| "I managed releases" | "**Release owner**: code freeze discipline, **feature flag strategy** (FF_{PRODUCT}_{FEATURE}, default false, canary 5%→100%), weekly sync with Backend RM (API versions, DB migration windows, deploy order BE-first), QA gate (blocked until sign-off), **hotfix procedure** (flag off first/hotfix from PRODUCTION tag/≥2 reviewers/expedited 30-min canary)." |
| "I worked on Messaging Platform" | "**Engineering PIC**: authored TDD (data model/event schema/channel routing/retry policy). Cross-team canonical naming alignment. Event schema with idempotencyKey (prevents duplicate delivery). Retry: 3 attempts exponential backoff, DLQ for failures. **Incident commander** for platform outages: 15-min stakeholder updates, post-mortem within 48h." |
| "I maintained District" | "District = Traveloka's mobile React Native design system (counterpart to Soya). **Shared with Soya**: design tokens (→CSS custom properties for web, →JS constants for mobile), icon set, aligned prop APIs. **Mobile-specific**: platform overrides (shadow→elevation, TouchableOpacity→TouchableNativeFeedback), VoiceOver/TalkBack accessibility, React Native upgrade compatibility. BREAKING changes: major version + migration guide + codemods." |

---

## 📊 Quick Facts

```
Company:   Traveloka (Southeast Asia's largest OTA)
Role:      Software Engineer II (Web) — TERA Supply + Messaging Platform
Level:     SE II = beyond SE I: project ownership, planning, release management

FE WEB PIC — SUPPLY MISSION TEAMS:
  Teams:     Direct Sourcing, Business Operations
  Projects:  Partner onboarding flow, digital contract signing,
             property audit dashboard, bulk rate update tool
  Quarterly: sizing XS/S/M/L/XL, capacity 80% rule, dependency map, risk flags
  Engineers: 5 FE engineers, managed through PIC (not manager) role

RELEASE MANAGEMENT:
  Cadence:   Bi-weekly (Thursday)
  Process:   Code freeze Wed W1 → QA Mon W2 → sign-off Wed W2 → canary 5% Thu → 100% Mon
  FF:        Feature flags on everything (FF_{PRODUCT}_{FEATURE}, default: false)
  Sync:      Weekly with Backend Release Manager (API contracts, deploy order, migrations)
  Hotfix:    Flag off → root cause → hotfix branch from PROD tag → expedited canary → post-mortem 48h

MESSAGING PLATFORM — ENGINEERING PIC:
  Scope:     Cross-product: TERA + Payments + CRM + Ops Tools → in-app/push/email/SMS
  TDD:       Data model, event schema, routing rules, retry policy, delivery tracking
  Schema:    eventId + idempotencyKey (duplicate prevention) + canonical eventType + channels[]
  Retry:     3 attempts, exponential backoff (0s/30s/5m), DLQ for failures
  Alignment: Canonical event naming across teams, Engineering PIC makes final call
  Incident:  PIC = incident commander (15-min updates, post-mortem owner)

DISTRICT (MOBILE DESIGN SYSTEM):
  Role:       Contributor + maintainer
  Stack:      React Native (iOS + Android)
  vs Soya:    Same design tokens + icon set + prop APIs; different rendering (View vs div)
  Platform:   iOS shadow/TapOpacity vs Android elevation/Ripple; VoiceOver vs TalkBack
  Process:    PR review: accessibility + platform compat + RN upgrade compat + BREAKING management
```

---

*Document last updated: June 2026 · TERA SE II interview preparation*
