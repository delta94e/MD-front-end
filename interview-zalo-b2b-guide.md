# 💧 Interview Guide — Zalo B2B Products
## ZNS · ZBA · ZCC · Ant Design + Less · Redux · Next.js

---

## 🔑 Context: Why Zalo B2B Is Significant

```
ZALO:
  Vietnam's dominant messaging application.
  74M+ registered users in Vietnam (population: 97M).
  Owned by VNG Corporation (Vietnam's largest tech company).
  Penetration rate: ~76% of Vietnam's population uses Zalo.
  For context: WhatsApp has ~90% penetration in some markets.
  Zalo IS the default messaging app in Vietnam.
  
THE B2B MONETISATION LAYER:
  Zalo's consumer product (messaging) is free.
  Zalo monetises through its B2B products:
  businesses pay to reach Zalo's 74M users.
  
  THREE KEY B2B PRODUCTS:
  
  ZBA (Zalo Business Account):
    A verified official presence for businesses on Zalo.
    Like Facebook Business Page, but on Vietnam's #1 messaging platform.
    Businesses pay for verification, premium features, analytics.
  
  ZNS (Zalo Notification Service):
    Businesses send transactional notifications to Zalo users.
    "Your OTP is 123456." "Your order has shipped." "Your appointment is tomorrow."
    Pay-per-notification model. Priced by volume tier.
    Vietnam equivalent of Twilio SMS or WhatsApp Business API.
  
  ZCC (Zalo Cloud Connect):
    The integration layer: connects businesses' CRM/ERP systems to Zalo.
    Webhook delivery, event streaming, API management.
    
  "Millions of dollars in revenue each year" = these are the products that
  convert Zalo's massive user base into business revenue.
  
YOUR ROLE:
  Building the management tools — the dashboards and configuration UIs —
  that businesses use to operate all three products.
  Not the consumer-facing Zalo app. The B2B operator dashboards.
```

---

## 1️⃣ ZNS — Zalo Notification Service

### What ZNS is and why it is complex

```
THE PRODUCT:
  A business wants to send a notification to a Zalo user.
  Example: Bank sends "Your card ending in 4521 was charged $50 at Lotte Mart."
  
  Without ZNS: the bank uses SMS. Expensive. Not branded. No delivery receipts.
  With ZNS: the message arrives inside Zalo as a rich notification from the bank's
  official Zalo Business Account. Branded. Trusted. Receipt delivery tracking.
  
  Revenue model: businesses purchase notification credits.
  High volume = lower price per notification. Millions of notifications/day across all businesses.
  
  WHY ZNS IS NOT JUST "SENDING A MESSAGE":
  Zalo controls who can send notifications and what they can say.
  This is not optional — it is a regulatory and trust requirement.
  If any business could send any message to any Zalo user:
  → spam → users disable Zalo notifications → the platform loses its notification value.
  
  Zalo's solution: template approval system.

TEMPLATE LIFECYCLE:
  
  1. Business creates a template in the management UI.
     Content: "Xin chào {{customer_name}}, đơn hàng {{order_id}} đã được giao."
     Category: ORDER (not PROMOTION — promotional templates have stricter rules).
  
  2. Template submitted for review → status: PENDING_REVIEW.
     Zalo's content moderation team reviews the template.
     Review time: 1-3 business days.
  
  3. Template approved → status: APPROVED.
     Business can now send notifications using this template.
  
  4. Template rejected → status: REJECTED.
     Reason given (e.g., "Template content includes promotional language").
     Business must revise and resubmit.
  
  WHY THIS IS AN INTERESTING FRONTEND PROBLEM:
  The management UI must handle:
  - Template builder with variable syntax ({{variable_name}})
  - Live preview rendering (replace variables with sample values)
  - Template status tracking (polling for review status or webhook update)
  - Category selection with business rules (PROMOTION templates have different approval criteria)
  - Rejection handling (show reason, allow edit and resubmit)
  - Version history (APPROVED templates cannot be edited — create a new version)

TEMPLATE VARIABLE SYSTEM:
  Variables allow one template to serve many users.
  
  Template:   "Đơn hàng {{order_id}} của bạn đã đến {{address}}."
  API call:   { order_id: "VN-12345", address: "123 Nguyễn Huệ, Q1, HCM" }
  Sent as:    "Đơn hàng VN-12345 của bạn đã đến 123 Nguyễn Huệ, Q1, HCM."
  
  FRONTEND RESPONSIBILITIES:
  1. Parse template content to extract {{variable}} placeholders.
  2. Render a form with one input per variable (for preview).
  3. Show a live preview of the rendered message.
  4. Validate: all variables used in the content have names matching the API schema.
  5. On send: validate that all variable values are provided and non-empty.

DELIVERY TRACKING:
  After sending, the business needs to know: did the message arrive?
  
  Events tracked:
  - QUEUED: notification entered the delivery queue.
  - SENT: delivered to Zalo's servers.
  - DELIVERED: confirmed received by the user's device.
  - FAILED: delivery failed (user blocked the OA, invalid phone number, quota exceeded).
  - CLICKED: user clicked the CTA button in the notification (if present).
  
  These events arrive via webhook to ZCC.
  The ZNS management UI aggregates them into delivery reports:
  - Sent today: total dispatched.
  - Delivered: confirmed receipt.
  - Failed: with failure reason breakdown.
  - Delivery rate: delivered / sent × 100%.
  - Click-through rate: clicked / delivered × 100%.
  
  The delivery report updates in near real-time (WebSocket or periodic polling).
  A business team running a time-sensitive campaign needs to see the current state.

QUALITY TIERS AND RATE LIMITS:
  New templates start with a low daily send limit (e.g., 10,000/day).
  As delivery quality improves (high delivery rate, low block rate):
  Zalo automatically increases the limit.
  
  Poor quality (many users blocking the OA, high failed rate):
  Zalo may reduce the limit or suspend the template.
  
  The management UI surfaces quality tier information:
  "Your template is at Tier 2 (100,000/day). Maintain >95% delivery rate to advance."
  
  This is not just a display feature — it helps businesses understand
  how to manage their notification quality to stay in good standing with Zalo.
```

---

## 2️⃣ ZBA — Zalo Business Account

### The management tool responsibilities

```
WHAT A BUSINESS ACCOUNT IS:
  A verified official Zalo account for a business (not a personal account).
  The verification badge tells users: this is the real [Company Name], not an impersonator.
  
  Features:
  - Business profile (name, logo, description, category, operating hours)
  - Follower management (users follow the ZBA to receive updates)
  - Messaging (customers can send messages; business responds)
  - Content publishing (posts appear in followers' feeds)
  - Analytics (follower growth, message volume, response rate)

FOLLOWER ANALYTICS:
  Businesses want to track: is our Zalo presence growing?
  
  The management UI provides:
  - Daily/weekly/monthly follower growth (time series chart)
  - Follower demographics (age, gender, location — Zalo provides aggregate data)
  - Follow/unfollow sources (where did new followers come from?)
  - Engagement metrics (post views, shares, reactions)
  
  Why this is not trivial:
  - Data comes from Zalo Open API (not a direct database query)
  - Rate-limited (cannot fetch arbitrary time ranges on every render)
  - Requires caching and pre-computation (daily stats pre-aggregated in the backend)
  - Charting: time series data visualized with Ant Design Charts or Recharts

MESSAGE MANAGEMENT AT SCALE:
  A large business (e.g., a bank or telecom) receives thousands of messages per day.
  The management UI must handle:
  
  - Infinite scroll / pagination (cannot load all messages at once)
  - Real-time updates (new messages appear without page refresh)
  - Assignment (message routed to specific CS agent)
  - Status tracking (unanswered, in progress, resolved)
  - Quick replies (pre-defined templates for common questions)
  - SLA indicators (how long since message received with no reply?)
  
  Technical: real-time updates via WebSocket.
  The management tool subscribes to new message events.
  When a new message arrives: notification + UI update.
  
  PERFORMANCE: with thousands of messages, list virtualization is essential.
  Ant Design List with virtual rendering (react-window).
  Only render what is visible. Scroll performance maintained even with 10,000+ messages.
```

---

## 3️⃣ ZCC — Zalo Cloud Connect

### Webhook management and event architecture

```
WHAT ZCC IS:
  The middleware layer between Zalo and a business's internal systems.
  
  Without ZCC:
  Business polls the Zalo API: "Any new messages?" every N seconds. Inefficient.
  
  With ZCC:
  When a user messages the ZBA, Zalo pushes the event to the business's webhook.
  The business's CRM receives the event instantly. No polling.
  
  This is a push-based event architecture.
  Every interaction (follow, unfollow, message, reaction, payment) becomes an event.
  The business configures: which events go to which webhook URL.

WEBHOOK MANAGEMENT UI:
  The management tool allows businesses to:
  
  1. CONFIGURE ENDPOINTS:
     Add a webhook URL (e.g., https://crm.company.com/zalo/webhook).
     Select which events the webhook receives (message, follow, payment, etc.).
     Test the endpoint: ZCC sends a test event. UI shows the response.
  
  2. MONITOR HEALTH:
     Each webhook shows its current status:
     - Active (200 OK responses within last 30 seconds)
     - Warning (slow responses, some non-200, last ping > 5 minutes ago)
     - Inactive (not responding, suspended by ZCC)
     
     Last ping time. Success rate. Average response time.
  
  3. VIEW EVENT LOG:
     Real-time stream of events being delivered to each webhook.
     Useful for debugging: "Did Zalo send the event? Did our webhook receive it?"
     Filter by event type, status (delivered/failed), timestamp.
  
  4. MANAGE FAILURE MODES:
     ZCC retries failed deliveries with exponential backoff (3 retries max).
     The UI shows failed events and allows manual retry.
     Businesses can configure their dead-letter queue for undeliverable events.

SECURITY — SIGNATURE VERIFICATION:
  The webhook receives POST requests from ZCC.
  A business's webhook must verify that the request came from ZCC (not a fake request).
  
  ZCC signs each request with HMAC-SHA256:
  Signature: sha256=HMAC(payload, secret_key)
  
  The secret key is generated when the webhook is configured.
  The business's server verifies:
  
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  
  // Timing-safe comparison prevents timing attacks:
  const isValid = crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSig}`),
    Buffer.from(receivedSignature)
  );
  
  WHY TIMING-SAFE:
  A naive string comparison (===) returns early when it finds a mismatch.
  A timing attacker can measure how long the comparison takes.
  Longer time = more matching characters.
  By measuring timing of many requests, the attacker reconstructs the signature.
  crypto.timingSafeEqual always takes the same time regardless of match point.
  This prevents the attack.
  
  The management UI generates and displays the secret key once (at configuration time).
  It cannot be retrieved later (only regenerated). The business must copy it immediately.
  This is documented prominently in the UI.

API KEY MANAGEMENT:
  ZCC provides API keys for programmatic access to Zalo APIs.
  The management UI handles:
  - Key creation (with name, permissions, expiry)
  - Key display (shown once, must be copied immediately)
  - Key rotation (generate a new key, old key remains valid for N days for migration)
  - Key revocation (immediate)
  - Audit log (who created/revoked which key, when)
```

---

## 4️⃣ Ant Design + Less — The UI Framework

### Why this combination and how it works

```
ANT DESIGN:
  An enterprise-grade React UI component library by Alibaba.
  Originally built for Alibaba's B2B management tools (very similar use case).
  
  WHY ANT DESIGN FOR ZALO B2B:
  1. Comprehensive component set: Table, Form, Modal, DatePicker, Tree, Transfer.
     Every component a management tool needs.
     Zalo did not need to build these from scratch.
  
  2. Enterprise patterns built-in:
     Complex table features: sorting, filtering, pagination, row selection, fixed columns.
     Form validation with rules: required, regex, min/max length, custom validators.
     Upload with progress: document uploads, image crops.
     
  3. Accessibility: Ant Design components are keyboard-navigable and screen reader-compatible.
  
  4. TypeScript support: full type definitions. TypeScript type safety throughout.

LESS THEMING:
  Ant Design uses Less (CSS preprocessor) internally.
  All design tokens are Less variables:
  @primary-color, @border-radius-base, @font-size-base, @menu-bg, etc.
  
  To theme Ant Design for Zalo's brand:
  Override these variables in the build configuration.
  The Less compiler rebuilds Ant Design with the new values.
  
  Result: one CSS file with the entire Ant Design design system
  compiled with Zalo's colors, radii, and typography.
  
  HOW IT WORKS IN NEXT.JS:
  
  In next.config.js, configure the Less loader:
  
  const withLess = require("next-with-antd");
  module.exports = withLess({
    lessVarsFilePath: "./styles/zalo-theme.less",
    lessVars: {
      "@primary-color": "#0068ff",     // Zalo blue
      "@border-radius-base": "8px",    // rounded corners
      "@font-size-base": "14px",
      "@menu-bg": "#001529",           // dark sidebar
    },
  });
  
  At build time: Less compiler processes all Ant Design's Less files
  with the overridden variables.
  The output is standard CSS — no Less in the browser.
  Zero runtime overhead.
  
  WHY NOT CSS-IN-JS (styled-components, emotion):
  CSS-in-JS adds JavaScript runtime overhead.
  For a management tool with complex tables and many UI elements:
  the overhead accumulates. Less-compiled CSS is parsed once by the browser.
  No runtime style injection. Better performance for data-heavy UIs.
  
  WHY NOT TAILWIND:
  Ant Design components have internal styles. Tailwind utility classes do not
  automatically customize Ant Design's internal component structure.
  Less variable override is the correct integration point for Ant Design.
  Tailwind is better suited for bespoke component systems, not pre-built component libraries.

COMPLEX TABLE PATTERNS:
  The most-used component in management tools: Table.
  ZNS template list, delivery reports, message history, API key list — all tables.
  
  Challenge: business requirements for tables grow continuously.
  "Can we add inline edit?" "Can we add multi-select delete?" "Can we export to CSV?"
  
  Pattern: a composable Table wrapper with standardized behaviors:
  
  type ManagedTableProps<T> = {
    dataSource: T[];
    columns: ColumnsType<T>;
    features?: {
      search?: boolean;           // add a search bar
      export?: boolean;           // add CSV export
      rowSelection?: boolean;     // add multi-select
      inlineEdit?: boolean;       // allow editing rows in place
    };
    onAction?: (action: "delete" | "edit" | "export", records: T[]) => void;
  };
  
  By wrapping Ant Design's Table, all tables get the same feature set.
  Adding a new feature (e.g., bulk action) once → all tables get it.
```

---

## 5️⃣ Redux — State Management

### Why Redux and how it's organized

```
WHY REDUX FOR B2B MANAGEMENT TOOLS:
  React's built-in state (useState, useContext) works well for local UI state.
  B2B management tools have complex server state that spans many components:
  
  - The template list in the sidebar (left panel)
  - The selected template editor (center panel)
  - The delivery report dashboard (right panel)
  - The notification badge in the header (total unread alerts)
  
  All of these need to know: the current state of templates, delivery reports, API keys.
  If this state lives in a parent component: prop drilling through many levels.
  If it lives in Context: re-renders when any part of the state changes.
  Redux: normalized state, fine-grained subscriptions via selectors.
  
  The B2B tool use case is exactly what Redux was designed for:
  complex, interconnected application state that many components read and write.

STATE SHAPE (ZNS slice):
  
  interface ZNSState {
    // Normalized template storage: by ID for O(1) lookup
    templates: {
      byId: Record<string, Template>;
      allIds: string[];
    };
    
    // The currently selected template ID
    selectedTemplateId: string | null;
    
    // Delivery reports: by template ID, by date
    deliveryReports: Record<string, Record<string, DeliveryReport>>;
    
    // API key management
    apiKeys: ApiKey[];
    
    // Filter state (UI state, but kept in Redux for URL sync)
    filter: {
      status: TemplateStatus | "ALL";
      category: TemplateCategory | "ALL";
    };
    
    // Async status
    loading: boolean;
    error: string | null;
  }
  
  WHY NORMALIZED:
  Templates can be updated independently (status changes, delivery stats update).
  With a flat array: to update one template, spread the entire array.
  With normalized (byId Map): update one entry → O(1). No array copy.
  At scale (100s of templates): the performance difference is noticeable.

SELECTOR PATTERNS:
  Selectors transform Redux state for component consumption.
  Using Reselect for memoization:
  
  const selectFilteredTemplates = createSelector(
    [selectAllTemplates, selectFilter],
    (templates, filter) =>
      templates.filter(tpl =>
        (filter.status === "ALL" || tpl.status === filter.status) &&
        (filter.category === "ALL" || tpl.category === filter.category)
      )
  );
  
  This computation runs only when templates or filter changes.
  If the component re-renders for another reason: selector returns cached result.
  In a management tool where filter state changes frequently:
  this avoids O(n) filter on every render.

ASYNC THUNKS FOR ZNS API:
  
  const fetchTemplates = createAsyncThunk(
    "zns/fetchTemplates",
    async (params: FetchParams, { rejectWithValue }) => {
      try {
        const res = await zaloAPI.getTemplates(params);
        return res.data;
      } catch (err) {
        return rejectWithValue(err.message);
      }
    }
  );
  
  const submitTemplate = createAsyncThunk(
    "zns/submitTemplate",
    async (template: NewTemplate, { dispatch }) => {
      const res = await zaloAPI.createTemplate(template);
      // Optimistic update: add to list immediately as PENDING_REVIEW
      dispatch(znsSlice.actions.addTemplate({ ...res.data, status: "PENDING_REVIEW" }));
      return res.data;
    }
  );
  
  WHY OPTIMISTIC UPDATES:
  Submitting a template takes 2-3 seconds (network round trip).
  Without optimistic: user clicks submit → 2-3 second wait → template appears.
  With optimistic: user clicks submit → template appears immediately as PENDING_REVIEW
  → server confirms → state reconciled.
  The user sees immediate feedback. The UI feels fast.
```

---

## 6️⃣ Next.js — Why SSR for a Management Tool

```
THE UNUSUAL CHOICE:
  Most B2B management dashboards are Single Page Applications (CSR).
  Client-side React, no server rendering.
  Why use Next.js with SSR?

REASONS:

1. INITIAL DATA LOAD PERFORMANCE:
   An operations team opens the ZNS dashboard 20+ times per day.
   With CSR: open dashboard → loading spinner → fetch data → display.
   With SSR: open dashboard → data already in the HTML → display immediately.
   
   getServerSideProps pre-fetches:
   - Template list (filtered by default state)
   - Today's delivery stats
   - Recent alerts
   
   The user sees content 400-600ms faster on every dashboard open.
   Over 20 opens per day × 50 operations team members = significant time saved.

2. API ROUTES AS BFF (Backend for Frontend):
   Zalo's Open API requires an access token.
   The access token is obtained with an app_id and app_secret.
   
   NEVER expose app_secret to the browser:
   - Browser JavaScript is readable by anyone opening DevTools
   - The app_secret, if stolen, gives full API access
   
   Next.js API routes solve this:
   - The browser calls: /api/zns/templates (Next.js API route)
   - The Next.js server calls: Zalo Open API (with app_secret, server-side only)
   - The response is returned to the browser without the secret being exposed
   
   Additionally: the Next.js server handles token refresh.
   Access tokens expire. The BFF refreshes them automatically.
   The browser never sees the refresh token flow.

3. DYNAMIC ROUTING FOR MULTI-OA:
   One management tool can manage multiple Zalo Official Accounts.
   URL: /dashboard/[oaId]/templates
   Next.js file-based routing: pages/dashboard/[oaId]/templates.tsx
   
   The OA ID is in the URL. Shareable links for specific views.
   getServerSideProps receives the OA ID from context.params and fetches the right data.

4. BUILT-IN OPTIMIZATIONS:
   Image optimization (next/image) for business profile photos and thumbnails.
   Font optimization (automatic font subsetting and caching).
   Bundle splitting (each page only loads what it needs).
```

---

## STAR Scripts

### ZNS Management Tool

```
SITUATION:
  Zalo's B2B notification service (ZNS) generates millions of dollars/year.
  Businesses needed a management tool to create templates, track delivery,
  and manage their API keys — all through a self-service web interface.
  Without a quality management tool, the business team had to manually handle
  template submissions and delivery report requests.

TASK:
  Build the ZNS management tool frontend.
  Template builder with variable system, review status tracking, delivery dashboards.

ACTION:
  Implemented template builder: {{variable}} parsing, live preview rendering,
  category-based business rules, version history (approved templates immutable).
  Delivery report dashboard: near real-time aggregation (sent/delivered/failed/CTR).
  Redux normalized state for O(1) template updates.
  Ant Design + Less theming for Zalo's brand design system.

RESULT:
  Operations team self-serves template submissions without engineering involvement.
  Average template submission to approval: tracked and visible in the UI.
  Delivery report latency reduced from "email request → manual export" to real-time.
  Supports the ZNS product that generates millions of dollars in annual revenue.
```

### ZCC Webhook Management

```
SITUATION:
  Businesses integrating Zalo Cloud Connect needed to:
  configure webhook endpoints, debug event delivery, rotate API keys —
  all through the management UI, without filing support tickets.

TASK:
  Build ZCC webhook management frontend: endpoint configuration, health monitoring,
  real-time event log, API key lifecycle management.

ACTION:
  Webhook configuration UI: endpoint URL, event type multi-select, test event delivery.
  Health dashboard: status indicators (active/warning/inactive), last ping, success rate.
  Real-time event log: WebSocket subscription, live event stream, filter by type/status.
  API key management: create (with permissions), display-once pattern, rotation, revocation, audit log.
  Documented HMAC-SHA256 signature verification for businesses to implement.

RESULT:
  Businesses self-configure and debug integrations without ZCC team involvement.
  Signature verification guide reduced integration security issues.
  Real-time event log became the #1 debugging tool for integration partners.
```

---

## Follow-up Q&A

**"What are the most complex parts of building a ZNS template management UI?"**
> "Three things. First: the variable system. Templates use {{variable_name}} placeholders. The UI needs to: parse these from the content in real-time, render one input per variable for preview, validate that variable names match the API schema (no typos, no undefined variables), and show a live rendered preview. This is non-trivial because the content updates as the user types, so the parsing runs on every keystroke. Second: status management. Templates have states (PENDING_REVIEW, APPROVED, REJECTED) that change asynchronously — Zalo's review team approves/rejects externally. The UI needs to poll or receive webhook updates about status changes. When a template is rejected, the UI must show the rejection reason and guide the user to fix and resubmit. Third: version control. An APPROVED template cannot be modified — it would invalidate the approval. Instead, the user creates a new version. The UI must make this distinction clear: 'To change this template, create a new version for review. The current version remains active.' Getting this UX right required multiple iterations with the product and compliance teams."

**"Why did you use Ant Design + Less instead of a custom design system?"**
> "The honest answer: build vs buy. A management tool has a very long list of required UI primitives: data tables with sorting/filtering/pagination, complex forms with validation, date pickers, modals, tree components, upload with progress, cascading selects. Building any of these from scratch is weeks of work. Ant Design provides all of them, tested, accessible, and typed. The Less theming system lets us brand them with Zalo's colors and corner radii without touching the component internals. The alternative — a bespoke design system — would have taken the entire team six months and still would not have all Ant Design's features. For a B2B management tool, engineering time is better spent on domain logic (template approval workflows, delivery analytics, webhook management) than on a custom DatePicker component."

**"You mention Redux — when would you NOT use Redux?"**
> "For local UI state: open/close state of a modal, the current value in a form input, which row is hovered. These don't need to be in Redux — useState is simpler. Also: server cache state (data that comes from the API and needs to be refreshed). For that, React Query or SWR is better than Redux — they handle stale-while-revalidate, cache invalidation, background refetching out of the box. Redux is best for: application state that multiple components need to read and write, state that needs to persist across navigations, and complex derived state (filtered template lists, sorted by status + category). In the Zalo B2B tools: the template list, selected template, delivery reports, filter state — Redux. The hover state on a table row — useState. The template list fetched from the API with automatic refresh — React Query feeding into the Redux store."

**"What is the most challenging thing about building B2B management tools vs consumer products?"**
> "Power user expectations. In a consumer product: most users do the same 3-5 actions. You optimize for simplicity. In a B2B management tool: the users are operations teams who are in the tool for 6-8 hours a day. They use every feature. They discover edge cases you didn't think of. They need keyboard shortcuts. They need bulk operations. They need to export data. They need audit logs. They file bug reports with precise reproduction steps because they know the tool better than you do. The technical challenge is: a consumer product can launch with 70% of use cases covered. A B2B management tool with 70% of use cases covered is not usable — the other 30% are things the ops team needs to do daily. You have to be more thorough, talk to the users more, and iterate faster because the feedback loop is tighter. The ops team is using your tool all day. They will tell you immediately when something is wrong."

---

## 🔗 Unified Narrative

> "The Zalo B2B management tools sit at the intersection of revenue, scale, and complexity that makes for rich engineering challenges.
>
> ZNS is not just a notification system — it is the mechanism through which Zalo monetises its 74 million users at scale. The template approval workflow, the variable substitution system, the delivery tracking dashboard — these are features that directly affect whether businesses can reach their customers and whether Zalo earns its revenue. Getting the template builder right matters: a confusing submission UI means businesses file support tickets instead of self-serving. A broken delivery dashboard means the operations team cannot see whether their campaigns are working.
>
> The technology choices were deliberate. Ant Design + Less is not the fashionable choice, but for a B2B management tool with 20+ different table variants, Ant Design's pre-built table component alone saved months of engineering. The Less theming system means all Ant Design components use Zalo's brand colors through a single configuration change — no component-level style overrides.
>
> Next.js for a management tool is unusual. The reason: SSR pre-loads the initial dashboard data. Operations teams open the dashboard dozens of times per day. If each open requires a loading spinner, that is minutes of accumulated delay every day for every team member. The API route pattern solved a real security concern: Zalo's API secrets belong on the server, not in browser JavaScript.
>
> Redux normalized state was the right call for the ZNS template management — a single template can be referenced from the template list, the editor, the delivery dashboard, and the notification badge. Normalized state means one update touches the right place. Selectors with Reselect memoization mean filtered views don't recompute on unrelated state changes."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I worked on Zalo" | "Worked on **management tools for Zalo's B2B products**: ZNS (pay-per-notification, Vietnam's Twilio), ZBA (business presence, follower analytics), ZCC (webhook integration layer). These products generate **millions of dollars/year** in B2B revenue." |
| "I used Ant Design" | "Ant Design + **Less theming**: override design tokens (@primary-color: #0068ff) in next.config.js → Less compiler rebuilds entire component library with Zalo brand. **Zero runtime overhead** (pure CSS output, not CSS-in-JS). One config change propagates to all 20+ table/form/modal component variants." |
| "I used Redux" | "Redux with **normalized state** (byId Map, not flat array): O(1) template updates vs O(n) array copy. **Reselect memoized selectors** for filtered views. **Optimistic updates** for template submission (appears as PENDING_REVIEW immediately, 2-3s faster perceived response). Thunks for async API with rejectWithValue error handling." |
| "I used Next.js" | "Next.js as **BFF (Backend for Frontend)**: API routes proxy Zalo Open API. App secrets stay server-side, never in browser JavaScript. **getServerSideProps** pre-loads template list + delivery stats → no loading spinner for ops team on every dashboard open." |
| "ZNS sends notifications" | "ZNS is Zalo's **pay-per-notification B2B service** (Vietnam equivalent of Twilio/WhatsApp Business API). Management UI: **template builder** ({{variable}} parsing, live preview, category rules), **approval workflow** (PENDING→APPROVED/REJECTED by Zalo content moderation), **delivery tracking** (sent/delivered/failed/CTR, near real-time), **quality tier** system (daily send limits tied to delivery quality)." |

---

## 📊 Quick Facts

```
Company: VNG Corporation (Vietnam's largest tech company)
Product: Zalo B2B management tools
Platform: Zalo (74M+ users, Vietnam's #1 messaging app)

PRODUCTS:
  ZNS: Zalo Notification Service
       Pay-per-notification (like Twilio for Zalo)
       Template approval system (PENDING_REVIEW → APPROVED/REJECTED)
       Variables: {{name}}, {{order_id}} → rendered per recipient
       Delivery tracking: queued/sent/delivered/failed/clicked
       Quality tiers: daily send limits tied to delivery quality
  
  ZBA: Zalo Business Account
       Verified official business presence
       Follower analytics (growth, demographics, engagement)
       Message management (inbox, assignment, SLA tracking)
       Content publishing
  
  ZCC: Zalo Cloud Connect
       Webhook configuration (endpoint, event type filtering)
       Health monitoring (active/warning/inactive, success rate)
       Real-time event log (debug delivery)
       API key lifecycle (create, display-once, rotate, revoke, audit log)
       Security: HMAC-SHA256 signature verification, timing-safe comparison

TECH STACK:
  Frontend:   ReactJS, TypeScript, Next.js
  UI library: Ant Design (enterprise components)
  Styling:    Less (Ant Design theming via @primary-color overrides)
  State:      Redux (normalized state, Reselect, async thunks)
  Server:     Next.js API routes as BFF (API secret protection)

KEY PATTERNS:
  Less theming:       @primary-color: #0068ff in next.config.js → compiles entire Ant Design
  Normalized state:   templates.byId Map → O(1) updates
  Optimistic updates: PENDING_REVIEW appears immediately on submit
  Memoized selectors: Reselect → O(1) filter recompute on unrelated changes
  BFF pattern:        Next.js API routes proxy Zalo Open API (secrets stay server-side)
  Signature verify:   HMAC-SHA256 + crypto.timingSafeEqual (prevents timing attacks)
```

---

*Document last updated: June 2026 · Zalo B2B interview preparation*
