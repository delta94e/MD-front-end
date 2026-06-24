# ✈ Interview Guide — TERA (Traveloka Extranet)
## Accommodation Partner Dashboard · Web + Mobile · Migration 35 Man-Weeks · Soya DS

---

## 🔑 Context: What TERA Is and Why It Matters

```
TRAVELOKA:
  Southeast Asia's largest Online Travel Agency (OTA).
  Based in Indonesia. Operates in: Indonesia, Thailand, Vietnam, Philippines,
  Malaysia, Singapore, and Australia.
  Products: flights, hotels, activities, financial services.
  Hundreds of millions of bookings processed.
  
TERA (Traveloka Extranet for Accommodation Partners):
  The B2B management dashboard for hotel and property partners.
  "Supply-side" — the backend of Traveloka's hotel business.
  
  What hotel partners do in TERA:
  - Manage room availability (which rooms are bookable on which dates)
  - Set pricing (base rates, weekend rates, promotions)
  - View and respond to booking requests
  - Upload property photos and update descriptions
  - Read and respond to guest reviews
  - View revenue analytics (occupancy rate, RevPAR, ADR)
  
  WHY TERA IS CRITICAL FOR TRAVELOKA'S BUSINESS:
  Without a working TERA, hotels cannot:
  - Update room availability → double bookings → guest complaints
  - Update pricing → revenue management failures
  - Respond to guests → lower review scores → fewer bookings
  
  TERA is the infrastructure that keeps Traveloka's hotel supply working.
  A broken TERA = broken hotel business for Traveloka.
  
YOUR SCOPE:
  Both TERA website (React, Next.js, TypeScript, Redux)
  AND TERA mobile app (React Native, iOS + Android).
  This is the full product surface for accommodation partners.
  
  Additionally: contributor and maintainer for Soya (Traveloka's internal design system).
  This means: your work affects not just TERA but all Traveloka frontend products.
```

---

## 1️⃣ TERA Dashboard — The Core Product

### Availability and Rate Management

```
THE CORE TERA FEATURE:
  A hotel partner opens TERA and sees an availability calendar.
  Rows: room types (Standard, Deluxe, Junior Suite).
  Columns: dates (today + 30 days, typically).
  Cells: for each room type × date:
    - Status: Available / Closed / Sold-Out
    - Inventory: how many rooms of this type are available on this date
    - Rate: price per night in IDR (Indonesian Rupiah)
  
  The partner's job: keep this grid accurate.
  "July 15 my hotel is sold out." → toggle cells to SOLD-OUT.
  "Weekend rates should be higher." → update rates for Sat/Sun.
  "I'll close for maintenance on August 10." → toggle CLOSED.
  
  WHY THIS IS A COMPLEX FRONTEND PROBLEM:
  
  1. SCALE: A large hotel chain may have:
     100+ properties × 10+ room types × 365 days = 365,000 cells.
     Not all are loaded at once, but the UI must feel responsive.
  
  2. OPTIMISTIC UPDATES:
     A partner clicks a cell to toggle it from Available to Closed.
     If the UI waits for the API to confirm before updating:
     the partner sees a 500ms delay on every click.
     At 365,000 cells with many edits per session: frustrating.
     
     Solution: optimistic update. Click → UI changes immediately.
     API call in background. If API fails → roll back with error toast.
     
  3. BATCH SAVES:
     Partner makes 20 cell edits before saving.
     Instead of 20 API calls: one batch request.
     Frontend tracks "dirty" cells (edited but unsaved).
     "Save All" button sends one request with all changes.
  
  4. CONFLICT RESOLUTION:
     Two admins edit the same property simultaneously.
     Admin A sets July 15 rate to 800K VND.
     Admin B sets July 15 rate to 900K VND (at the same time).
     Who wins? How does the UI handle this?
     Solution: last-write-wins with ETag/version conflict detection.
     Conflicting cell: highlighted, partner asked to resolve.

REDUX STATE FOR AVAILABILITY:
  
  The state shape:
  
  interface AvailabilityState {
    byProperty: Record<propertyId, {
      byRoomType: Record<roomTypeId, {
        byDate: Record<dateString, {
          status: "available" | "closed" | "sold-out";
          inventory: number;
          rate: number;
          dirty: boolean;         // has unsaved changes
          originalRate: number;   // for rollback if save fails
          originalStatus: string; // for rollback if save fails
        }>;
      }>;
    }>;
    pendingChanges: CellChange[];
    syncStatus: "idle" | "saving" | "error" | "conflict";
  }
  
  WHY NORMALIZED (not flat array):
  Lookup: availability[propertyId][roomTypeId][date] → O(1).
  Flat array: search through N items → O(n).
  At 365,000 cells: the difference between instant and sluggish.

BOOKING MANAGEMENT:
  Partners receive booking requests (for some booking types).
  TERA shows: guest name, room type, check-in/out, amount.
  Partner can: accept, decline, request modification.
  
  STATE MACHINE for a booking:
  PENDING → CONFIRMED → CHECKED-IN → CHECKED-OUT
          → CANCELLED (from any state)
          → NO-SHOW (from CONFIRMED)
  
  Each transition has business rules:
  Cannot cancel after check-in (must go through process).
  Cannot check-in before the check-in date.
  The Redux reducer enforces these rules: invalid transitions rejected.
```

---

## 2️⃣ React Native — Cross-Platform Mobile App

### What TERA mobile does and how it differs from the web

```
WHY MOBILE MATTERS FOR ACCOMMODATION PARTNERS:
  Hotel front desk managers are not always at a computer.
  They need to: check new bookings during breakfast service,
  update availability from their phone when a room becomes unavailable,
  respond to urgent guest messages from anywhere.
  
  Mobile = TERA for on-the-go property management.
  
  KEY MOBILE-FIRST FEATURES:
  1. Push notifications: new booking → instant notification → accept/decline in 2 taps.
  2. Quick availability toggle: mark a room closed without opening a computer.
  3. Photo upload: take a photo of a renovated room → upload directly to TERA.
  4. Review alerts: guest leaves a 1-star review → partner gets notified immediately.

CODE SHARING ARCHITECTURE:
  > 80% of the codebase is shared between Android and iOS.
  
  SHARED:
  - API service layer (axios-based, same endpoints)
  - Redux state management (same reducers, selectors)
  - Business logic (rate calculation, validation, date utilities)
  - React Navigation structure (same screen hierarchy)
  - Custom hooks (useAvailability, useBookings, useReviews)
  - Utility functions (date formatting, currency formatting)
  
  PLATFORM-SPECIFIC (< 20%):
  - Push notifications:
    Android: Firebase Cloud Messaging (FCM), requires google-services.json
    iOS: Apple Push Notification service (APNs), requires certificates
    Pattern: abstract behind useNotifications hook → platform impl behind scenes
  
  - Biometric authentication:
    Android: Fingerprint
    iOS: Face ID or Touch ID
    Pattern: react-native-biometrics wraps both
  
  - Date picker: each platform has its own native date picker UX
    (iOS: scrolling wheel. Android: calendar-style dialog)
    Pattern: Platform.select() to render the right component
  
  - Camera and photo library access: permissions differ by platform
  
  REACT NATIVE vs ALTERNATIVES:
  
  WHY NOT SEPARATE NATIVE APPS (Swift + Kotlin):
  Two codebases = two engineering teams = 2× cost.
  Any feature: implemented twice. Any bug: fixed twice.
  For TERA (a B2B management tool), native performance is not the priority.
  Fast feature delivery for partners is the priority.
  
  WHY NOT REACT NATIVE WEB (monorepo for web + mobile):
  TERA web is already in Next.js with server-side rendering.
  React Native Web would sacrifice SSR capabilities.
  The web and mobile have different user needs and layouts.
  Separate but sharing: business logic layer (API, Redux, hooks).

PERFORMANCE CONSIDERATIONS:
  React Native's bridge (JavaScript ↔ Native):
  All communication between JS code and native UI goes through a bridge.
  Heavy JS computation: no bridge impact (JS thread is separate from UI).
  But: excessive state updates → many bridge messages → UI lag.
  
  Pattern for TERA's availability calendar on mobile:
  - Virtualize the list: only render visible rows (FlatList with windowSize).
  - Batch Redux updates: one dispatch for multiple cell changes.
  - Memoize selectors: useSelector with Reselect → no recompute on unrelated changes.
  
  The mobile calendar shows 30 days by default (not 365 like web).
  Each day shows 1-3 room types for the selected room type filter.
  Scrollable horizontally for dates, vertically for room types.
```

---

## 3️⃣ Soya — Traveloka's Internal Design System

### What it is and what being a contributor means

```
WHAT SOYA IS:
  Traveloka's internal React component library.
  Used across: TERA, flights booking, hotel consumer, payments, activities, etc.
  Similar to: Shopify's Polaris, Airbnb's DLS, Material-UI, Ant Design.
  
  Why it exists: consistency and velocity.
  Consistency: all Traveloka products look and feel like Traveloka.
  Velocity: teams don't rebuild a DatePicker for every product.
  
  Without Soya: 10 teams each build their own Button, Table, Modal.
  - 10 versions of the same component.
  - 10 different accessibility implementations.
  - 10 different TypeScript type definitions.
  - When the design team updates the primary color: 10 codebases to update.
  
  With Soya: update once → all products get it on next version upgrade.

WHAT "CONTRIBUTOR" MEANS:
  
  1. CODE REVIEW on PRs to Soya:
     When another team needs a new component or wants to change an existing one,
     they open a PR against the soya-web repository.
     
     As a maintainer, I review for:
     - ACCESSIBILITY: Does the component have correct ARIA attributes?
       Is it keyboard navigable? Does it work with screen readers?
       (Traveloka serves users with disabilities — this is not optional.)
     
     - TYPESCRIPT: Are the prop types correct and documented?
       Are edge cases typed? Are optional props optional?
       Is the generic type flexible enough for all use cases?
     
     - VISUAL CONSISTENCY: Does it use Traveloka's design tokens?
       Correct colors, spacing, typography from the token system.
       Not ad-hoc hardcoded values.
     
     - BACKWARD COMPATIBILITY: Does this change break existing consumers?
       Adding a new required prop breaks all current usages.
       Adding an optional prop with a default is safe.
       Changing component behavior is a breaking change.
     
     - TEST COVERAGE: Does it have sufficient unit tests?
       Each variant, each state, each edge case.
  
  2. ADDING COMPONENTS TO SOYA:
     When TERA needs a component that doesn't exist in Soya:
     
     Decision: should this be a TERA-specific component or a Soya component?
     
     TERA-specific: if it's TERA domain-specific (availability cell, booking card).
     Soya component: if 2+ products could use it (a date range picker, a file upload).
     
     Adding to Soya: follow the contribution guide, write documentation,
     add Storybook stories for each variant, write unit tests, submit PR for review.
  
  3. VERSIONING AND RELEASES:
     Soya uses semantic versioning: X.Y.Z
     - X (major): breaking changes. All consumers must upgrade and test.
     - Y (minor): new features, backward-compatible additions.
     - Z (patch): bug fixes.
     
     For major versions: write a migration guide.
     Provide codemods where possible (scripts that automatically update consumer code).
     Coordinate with all consuming teams before releasing.
     
     This requires: understanding all the products that use Soya,
     and communicating changes before they break people's builds.

WHAT BEING A MAINTAINER TEACHES:
  1. API DESIGN: a component's API is a contract.
     Once in Soya, many teams depend on it.
     Changing the API is costly (migration effort × number of teams).
     Get the API right the first time: think about the use cases carefully.
  
  2. DOCUMENTATION: a component without documentation is a component nobody uses.
     Write prop documentation, usage examples, and known limitations.
     The Storybook story IS the documentation.
  
  3. COMMUNICATION: when releasing changes, communicate clearly.
     "We changed Button's size prop to accept 'sm' | 'md' | 'lg' instead of 'small' | 'medium' | 'large'."
     Tell people what changed, how to migrate, and when the old API is removed.
```

---

## 4️⃣ Apache Velocity → React Migration

### What this migration was and why it took 35 man-weeks

```
WHAT APACHE VELOCITY IS:
  A Java-based template engine.
  HTML templates with server-side data binding.
  Common in Java web applications from the early 2010s.
  
  Traveloka was founded in 2012. Its early web pages used Java + Velocity.
  By 2022-2024, Velocity is legacy: no TypeScript, no components, no unit tests.
  Every UI update requires a Java build. Every interaction causes a page reload.
  
  Velocity template example:
  #foreach($room in $rooms)
    <tr>
      <td>$room.name</td>
      <td>$velocityHelper.formatNumber($room.rate)</td>
    </tr>
  #end
  
  Problems:
  - $room.name is a string. Could be null. No compile-time warning.
  - The table re-fetches from the server on every sort/filter click.
  - Adding a TypeScript type: impossible (server-rendered HTML).
  - Writing a unit test: impossible (business logic is in Java controllers).
  - The table does not update when data changes: full page reload required.

THE MIGRATION: Apache Velocity → React + TypeScript + Next.js

  WHY THIS IS HARD:
  
  1. UNDERSTANDING THE EXISTING DATA FLOW:
     Velocity pages bind data from Java controllers.
     The React replacement needs the same data via REST API.
     Sometimes: the API doesn't exist yet. Must be created by the backend team.
     This coordination alone adds 20-30% to the timeline.
  
  2. FEATURE PARITY:
     The new page must do everything the old page does.
     Every edge case in the Velocity template must be preserved.
     Some edge cases are undocumented: you find them during QA.
  
  3. TYPESCRIPT TYPES:
     The Velocity template had no types. The data shape was implicit.
     Creating TypeScript interfaces for all data models: from scratch.
     Requires reading Java model classes and translating to TypeScript.
  
  4. STATE MANAGEMENT:
     Velocity had no client-side state (it was all server-side).
     The React replacement needs Redux for: filters, sorts, unsaved edits, pagination.
     This is a design exercise: what state goes in Redux vs local useState?
  
  5. TESTING:
     The old Velocity page had zero unit tests (it was untestable).
     The React replacement gets full test coverage: standard, boundary, incorrect.
     Writing tests adds ~30% to the migration time.
     But it is non-negotiable: we cannot migrate to React and not test it.
  
  6. RELEASE MANAGEMENT:
     Cannot switch off the old page and switch on the new one simultaneously.
     Use the Strangler Fig pattern (see below).

STRANGLER FIG MIGRATION PATTERN:
  
  Named after the strangler fig tree: grows around an existing tree,
  eventually replacing it while the old tree continues to support it during transition.
  
  THE PROCESS (for each of the 11 pages):
  
  PHASE 1: Shadow deployment (1-2 weeks)
    New React page deployed at /v2/tera/rooms (not visible to partners).
    Old Velocity page at /tera/rooms (all partner traffic).
    Internal QA + Traveloka staff test the new page.
    Fix bugs found in testing.
  
  PHASE 2: Canary release (2-3 weeks)
    Feature flag: ENABLE_REACT_ROOM_PAGE in the feature flag system.
    1% of partners → new React page. Monitor: error rates, load times, complaints.
    If stable for 2-3 days: increase to 10%.
    If stable for 3-4 days: increase to 50%.
    If stable for 3-4 days: increase to 100%.
    At any point: if error rate spikes → instantly roll back to 0% (old page).
  
  PHASE 3: Full cutover (stable period)
    100% traffic on React page.
    Old Velocity page kept as emergency fallback for 4 weeks.
    Monitor: no increase in support tickets, no error rate increase.
    After 4 weeks without incidents: remove Velocity page from codebase.
  
  WHY THIS APPROACH:
  Partners use TERA to manage their hotel's inventory and revenue.
  A broken TERA during peak booking season → real financial damage.
  The strangler fig approach: zero partner-facing downtime.
  We never had a situation where partners couldn't access TERA due to migration.

35 MAN-WEEKS: WHAT THIS MEANS:
  
  35 man-weeks = approximately 8-9 months of full-time engineering.
  For one engineer. Or for multiple engineers over fewer months.
  
  Breakdown per page:
  - Large pages (5 pages × ~4 weeks): 20 weeks
  - Medium pages (4 pages × ~2.5 weeks): 10 weeks
  - Small/XS pages (2 pages × ~2.5 weeks): 5 weeks
  Total: 35 weeks.
  
  What those weeks actually include:
  Week 1: Understand the Velocity template + Java controller + API requirements.
  Week 2-3: Build the React components + Redux state.
  Week 4: Write unit tests (standard, boundary, incorrect).
  Week 5: Shadow deployment + internal QA + bug fixes.
  Week 6-7: Canary release (monitoring, adjustments).
  Week 8: Full cutover + monitoring period.
  
  The "35 man-weeks" is the total engineering cost of the migration.
  Completed in less calendar time with parallel work on multiple pages.
  
  WHY QUANTIFYING IN MAN-WEEKS MATTERS IN AN INTERVIEW:
  It shows you understand project scope and estimation.
  "Migrated 11 pages" sounds like a small task.
  "35 man-weeks = ~8 months of single-engineer work" shows you understand
  the actual engineering investment required to do it correctly.
```

---

## 5️⃣ Jest Testing — Standard, Boundary, Incorrect Input

```
THE THREE CATEGORIES:
  Jest tests should cover three categories of inputs:
  
  1. STANDARD (happy path): normal, expected inputs → expected outputs.
     "User books a Deluxe room for 3 nights at the base rate."
     Most of the system works correctly for standard inputs.
     These tests verify the core functionality works.
  
  2. BOUNDARY (edge cases): inputs at the edge of valid ranges.
     "User books exactly 1 room (minimum)."
     "User books exactly 365 nights (maximum stay)."
     "Rate set to exactly 50,000 VND (minimum allowed rate)."
     
     Off-by-one errors are the most common source of boundary bugs.
     A function that works for N=5 might fail for N=0 or N=1.
     
  3. INCORRECT (invalid input): inputs that should be rejected.
     "Negative room rate (-1 VND)."
     "Check-out date before check-in date."
     "Null date string."
     "Room ID that doesn't exist."
     
     These tests verify: the system fails gracefully.
     Not silently (returning null when it should throw).
     Not catastrophically (crashing the server).
     But predictably: throwing a specific, named error with an actionable message.

THE STANDARD CASE:
  
  describe("Availability Service — standard", () => {
    it("returns available rooms for a valid date range", async () => {
      // Given: a property with 5 Deluxe rooms
      // When: partner queries June 19-22
      // Then: 5 available rooms returned with correct rate and currency
      
      const result = await getAvailability({
        propertyId: "prop-001",
        checkIn: "2024-06-19",
        checkOut: "2024-06-22",
        roomType: "DELUXE",
      });
      
      expect(result.available).toBe(true);
      expect(result.rooms).toHaveLength(5);
      expect(result.rooms[0]).toMatchObject({
        roomType: "DELUXE",
        rate: expect.any(Number),
        currency: "IDR",
      });
    });
  });

THE BOUNDARY CASE:
  
  describe("Availability Service — boundary", () => {
    it("handles 0 available rooms (sold-out property)", async () => {
      // The tricky case: what does "sold out" look like?
      // Does it return null? An empty array? An error?
      // Boundary test specifies: empty array, soldOut flag true.
      
      const result = await getAvailability({ propertyId: "sold-out" });
      expect(result.available).toBe(false);
      expect(result.rooms).toEqual([]);    // NOT null, NOT undefined
      expect(result.soldOut).toBe(true);
    });
    
    it("accepts exactly 365 nights (maximum stay)", async () => {
      // At the boundary: should succeed
      const result = await getAvailability({
        checkIn: "2024-01-01",
        checkOut: "2025-01-01",  // 365 nights exactly
      });
      expect(result.error).toBeUndefined();
    });
    
    it("rejects 366 nights (one past the boundary)", async () => {
      // One past the boundary: should fail
      await expect(
        getAvailability({ checkIn: "2024-01-01", checkOut: "2025-01-02" })
      ).rejects.toThrow("MAX_STAY_EXCEEDED");
    });
  });

THE INCORRECT INPUT CASE:
  
  describe("Availability Service — incorrect input", () => {
    it("throws DateRangeError when check-out is before check-in", async () => {
      await expect(
        getAvailability({ checkIn: "2024-06-22", checkOut: "2024-06-19" })
      ).rejects.toThrow(DateRangeError);
    });
    
    it("throws InvalidDateError for null date", async () => {
      await expect(
        getAvailability({ checkIn: null, checkOut: "2024-06-22" })
      ).rejects.toThrow(InvalidDateError);
    });
    
    it("throws RateValidationError for negative rate", async () => {
      await expect(
        setRate({ roomId: "room-001", date: "2024-06-19", rate: -1 })
      ).rejects.toThrow(RateValidationError);
    });
  });

WHY NAMED ERRORS (DateRangeError, not generic Error):
  When a specific named error is thrown, the API consumer knows what went wrong.
  The frontend can map: DateRangeError → "Check-out must be after check-in."
  Generic Error → "Something went wrong." (unhelpful to the user.)
  
  Named errors are part of the API contract.
  Tests that assert specific error types verify the contract is maintained.

TESTING PHILOSOPHY FOR TERA:
  Tests serve two purposes: verification and documentation.
  
  As documentation:
  A new engineer reads the test file and learns:
  - What does getAvailability return when sold out?
  - What is the maximum stay allowed?
  - What error is thrown for a negative rate?
  
  This is why test names must be full sentences:
  BAD:  it("handles error")
  GOOD: it("throws RateValidationError when rate is negative")
  
  As verification:
  Every CI run: all tests pass before merge.
  Coverage targets:
  - Service layer (API calls): > 90% branch coverage
  - Redux reducers + selectors: > 85%
  - React components: > 70% (critical interactions)
  - Pure utility functions: 100%
  
  "Untested code is unfinished code."
  This was enforced at the PR level: coverage below threshold = blocked PR.
```

---

## STAR Scripts

### Apache Velocity → React Migration

```
SITUATION:
  TERA's core pages were built on Apache Velocity — a Java template engine.
  Every UI interaction (sort, filter, edit) caused a full page reload.
  No TypeScript, no unit tests, no component reuse.
  Developers required a Java build for any frontend change.
  Partners experienced 2-3 second page reloads for every action.

TASK:
  Migrate 11 TERA pages from the Java monorepo (Velocity) to the React/Next.js
  frontend repository. Maintain full feature parity. Zero partner-facing downtime.

ACTION:
  Applied the Strangler Fig pattern: shadow deployment → canary release
  (1% → 10% → 50% → 100%) → full cutover → Velocity page removal.
  Created TypeScript interfaces for all data models (reverse-engineered from Java classes).
  Built Redux state management replacing server-side rendering.
  Wrote comprehensive Jest tests: standard, boundary, and incorrect input cases.
  Used feature flags for instant rollback capability.

RESULT:
  11 pages migrated. Equivalent to 35 man-weeks of engineering effort.
  Zero partner-facing downtime across all 11 releases.
  Each migrated page: interactive without page reload, fully typed, 85%+ test coverage.
  Post-migration: frontend developers could ship changes without Java build.
  Page interaction response: 2-3 seconds (Velocity) → < 50ms (React optimistic updates).
```

### Soya Design System Maintainer

```
SITUATION:
  TERA needed several UI components not in Traveloka's internal design system (Soya).
  Building them only in TERA would create duplicates across Traveloka's products.
  New Soya PRs from other teams needed review for accessibility and type safety.

TASK:
  Contribute new components to Soya. Review PRs from other teams. Maintain backward compatibility.

ACTION:
  Reviewed and merged PRs for accessibility compliance (ARIA attributes, keyboard navigation).
  Contributed new components: defined prop APIs, wrote Storybook stories, wrote unit tests,
  wrote documentation.
  For breaking changes: wrote migration guides and provided codemods for consuming teams.
  Coordinated with teams across Traveloka before any major version release.

RESULT:
  Components contributed to Soya: used by multiple Traveloka products.
  Zero regressions in TERA from Soya version upgrades (due to thorough review).
  PR review reduced accessibility issues in Soya components: all components keyboard-navigable.
```

---

## Follow-up Q&A

**"What was the hardest part of migrating from Apache Velocity to React?"**
> "Two things. First: understanding the implicit data flow. Velocity templates bind data from Java controllers. The binding was often undocumented — I had to read Java model classes and the controller code to understand what data was available and in what format. Then translate that into TypeScript interfaces and REST API contracts. Sometimes the API I needed didn't exist: the data came straight from the Java controller's model, bypassing any REST layer. I had to coordinate with the backend team to create API endpoints, which added time. Second: edge cases in the Velocity templates. These templates had been accumulating edge-case handling for years. A comment like '// special case for group bookings with > 30 rooms.' When migrating, I had to find and replicate every edge case — some documented, some in the template as undocumented if/else conditions. Missing one would break a specific type of partner's workflow. The only way to catch them all: thorough QA with real partner accounts."

**"How did you handle rollback during the canary release?"**
> "Feature flags with instant toggle. The canary mechanism was: a feature flag `ENABLE_REACT_ROOM_PAGE` in our flag management system. The value: a percentage (0-100). At 10%: 10% of partners see the React page, 90% see the Velocity page. The assignment is deterministic: hash(partnerId + flagName) % 100 < threshold. If error rates spike or monitoring alerts trigger: set the flag back to 0%. Takes effect immediately — no deploy required. The old Velocity page is still running, just receiving 100% of traffic again. This is the most important property of the canary approach: rollback does not require a code deploy. A deploy can take 5-10 minutes. A flag change: seconds. For TERA, where a broken page means partners cannot update their inventory, seconds matter."

**"What does 'contributor and maintainer for Soya' actually mean in your day-to-day?"**
> "Three concrete things. First: reviewing PRs from other teams. When a team opens a PR to add or modify a Soya component, I review for: accessibility (are ARIA attributes correct? Is it keyboard-navigable?), TypeScript (are the prop types correct and documented?), visual consistency (using Traveloka's design tokens, not hardcoded colors), and backward compatibility (will this break any existing consumers?). These reviews can take 1-2 hours for complex components — it is detailed, not just a glance. Second: contributing components. When TERA needs something that's generalizable, I build it for Soya rather than just TERA. This requires thinking beyond my specific use case: 'What would the optimal API for this component be, given all the ways it might be used across Traveloka?' Third: version releases. For major versions: I coordinate with all consuming teams, write migration guides, and provide codemods where possible. This is more communication work than code work."

**"Why Jest for unit testing? What alternatives did you consider?"**
> "Jest was the established standard at Traveloka when I joined the team — not a decision I made from scratch. But I understand why it was chosen. Jest has zero-configuration setup for React/TypeScript projects. It includes: test runner, assertion library, mocking framework, and code coverage — all in one package. Alternatives like Vitest are faster, but in a monorepo with many packages, Jest's broad ecosystem and stability were pragmatic. The testing pyramid approach: Jest for unit tests (services, reducers, pure functions), React Testing Library for component integration tests, Playwright/Cypress for E2E. For the migration work specifically: unit tests in Jest gave me confidence that each migrated function behaved identically to the Velocity template's server-side logic. Boundary tests caught several off-by-one errors in date range calculations that QA would have missed."

---

## 🔗 Unified Narrative

> "TERA represents a specific kind of engineering challenge: a B2B management tool where correctness matters more than innovation. Hotel partners use TERA to manage their real-world inventory and revenue. A miscalculated rate or an incorrectly toggled availability cell has direct financial consequences for the partner. This shapes every engineering decision.
>
> The Redux state design for the availability calendar — normalized by property × room type × date, with dirty flags for unsaved changes and optimistic updates for instant feedback — exists because partners need to make dozens of edits in one session and cannot wait for an API round-trip per click. The correctness requirement means those edits are tracked precisely and can be rolled back if the save fails.
>
> The Velocity migration story is about engineering courage and patience. Velocity-to-React is not a technical novelty — both are ways to render HTML. The value is in the outcome: TypeScript types that catch errors at compile time instead of in production, unit tests that document the behavior of the system, and a development workflow where a frontend change doesn't require a Java build. The 35 man-weeks reflects the real cost of doing this migration correctly: with full feature parity, zero partner downtime, and complete test coverage on the new code.
>
> The Soya maintainer role is where the impact goes beyond TERA. A component I review and merge into Soya becomes part of every Traveloka product's user interface. An accessibility issue I catch in a PR review: never ships to any user, on any Traveloka product. That leverage — one review, many products — is why design system maintainership is a senior-level responsibility."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I used Redux" | "Redux with **normalized availability matrix** (byProperty→byRoomType→byDate): O(1) cell lookup. **Optimistic updates**: click → immediate UI change → API confirm → rollback on failure. **Dirty flag** tracking: batch 20 edits → 1 API call. **Conflict detection**: ETag-based version check, UI flags conflicting cells." |
| "I worked on React Native" | "React Native: **>80% shared code** (API layer/Redux/hooks/navigation). Platform-specific: FCM (Android) vs APNs (iOS) push notifications, biometrics (fingerprint vs Face ID), native date pickers. **Platform.select()** pattern. Key mobile features: 2-tap booking accept/decline, quick availability toggle, direct camera upload." |
| "I was a Soya contributor" | "Soya = Traveloka's internal design system (like Shopify Polaris). Maintainer responsibilities: (1) **accessibility review** (ARIA/keyboard nav) for all component PRs; (2) **backward compatibility** enforcement (new required prop = breaking change → blocked); (3) **migration guides + codemods** for major version bumps; (4) **component API design** that generalizes beyond one team's use case." |
| "I migrated pages" | "**Strangler Fig pattern**: shadow (/v2/tera/rooms) → canary 1%→10%→50%→100% (feature flag, instant rollback) → full cutover → Velocity removal after 4 weeks. **Zero partner downtime** across all 11 pages. **35 man-weeks** = understanding Java/Velocity data flow + TypeScript interfaces + Redux state + Jest tests + canary management. Post-migration: interactions 2-3s → <50ms (optimistic UI)." |
| "I wrote unit tests" | "**3 Jest categories**: Standard (happy path, core functionality), Boundary (0/1/max values — off-by-one errors, date boundary: 365N passes/366N fails), Incorrect input (null date → InvalidDateError, negative rate → RateValidationError, inverted dates → DateRangeError). **Named errors** (not generic Error) → frontend can show actionable messages. **Coverage targets**: services >90%, Redux >85%, components >70%. **CI enforcement**: below threshold = blocked PR." |

---

## 📊 Quick Facts

```
Company:    Traveloka (Southeast Asia's largest OTA)
Product:    TERA (Traveloka Extranet for Accommodation Partners)
Surfaces:   Web (Next.js, React, TypeScript, Redux) + Mobile (React Native, iOS + Android)
Scale:      Properties across Indonesia, TH, VN, PH, MY, SG, AU

TERA FEATURES OWNED:
  Availability management: status (available/closed/sold-out), inventory, rate per cell
  Rate management:        base rate, weekend surcharge, promotional rates
  Booking management:     pending/confirmed/checked-in/checked-out/cancelled state machine
  Analytics:              occupancy rate, RevPAR, ADR, review score
  Content management:     photos, amenities, descriptions
  Review management:      read + respond to guest reviews

MIGRATION:
  From: Apache Velocity (Java monorepo, server-rendered, no TS, no tests)
  To:   React + TypeScript + Next.js (FE repo, optimistic updates, typed, tested)
  Pages: 11 pages
  Size:  35 man-weeks total
  Method: Strangler Fig (shadow → canary 1%→10%→50%→100% → cutover)
  Result: zero partner downtime, 85%+ test coverage, interaction speed 2-3s → <50ms

SOYA (INTERNAL DESIGN SYSTEM):
  Role:        Contributor and maintainer
  Reviews:     Accessibility, TypeScript types, backward compat, visual consistency
  Contributed: Components promoted from TERA to Soya for cross-product use
  Impact:      Changes reviewed once → all Traveloka products benefit

JEST TESTING:
  Standard:   happy path, expected behavior
  Boundary:   0/1/max values, date boundaries, minimum rates
  Incorrect:  null inputs, negative values, inverted ranges → named errors
  Coverage:   services >90%, Redux >85%, components >70%, utils 100%
  CI:         blocked PR if tests fail or coverage below threshold

TECH STACK:
  Web:    React, Next.js, TypeScript, Redux
  Mobile: React Native (iOS + Android), > 80% shared codebase
  DS:     Soya (Traveloka internal), semantic versioning, Storybook
  Tests:  Jest (standard/boundary/incorrect), React Testing Library
```

---

*Document last updated: June 2026 · TERA interview preparation*
