# 💳 Interview Guide — Staff Frontend Engineer · Billing
## SurveyMonkey (2020–2023) — Stripe Migration · Python→React/TS/GraphQL · TypeScript Guild

> **Role:** Staff Frontend Engineer on the Billing team at SurveyMonkey, San Mateo CA. Led the multi-quarter migration from in-house billing to Stripe. Drove modernization of legacy Python billing apps to React + TypeScript + GraphQL. Co-founded and led the company-wide TypeScript Guild for 3 years (0% → 83% coverage).

---

## 🧭 Three Core Themes

| Theme | Your one-liner |
|---|---|
| **Stripe migration** | *"We were in the business of building surveys. Not billing platforms. The in-house billing system: 3 engineers maintaining it, 12% failed payment recovery, no Apple Pay. Stripe solved all three. My job: migrate 50,000 subscribers without a single missed charge."* |
| **Python → modern stack** | *"The strangler fig pattern: replace Django billing templates with React components one by one. Users never notice the transition. Engineers: go from 3-week onboarding to 4-day onboarding."* |
| **TypeScript Guild** | *"I didn't write most of the TypeScript at SurveyMonkey. I created the conditions where 80+ frontend engineers adopted it consistently, correctly, without being mandated. That's the difference between impact and influence."* |

---

## 💳 Part 1 — Stripe Migration

### The business context

**In-house billing (before):**
- Custom Python billing service: 8,000 lines, 3 engineers dedicated to maintenance
- Payment methods: Visa/MC only. No Apple Pay, Google Pay, PayPal, SEPA
- Dunning (failed payment recovery): manual 3-retry schedule. Recovery rate: 12%
- PCI DSS: card data on SurveyMonkey servers. Annual PCI audit: expensive
- New payment method: 3-4 weeks engineering work each

**Why Stripe (the business case):**
> *"Total cost of maintaining in-house billing vs Stripe fees: break-even above ~$2M GMV/month. SurveyMonkey: well above that. And Stripe brings 30%+ dunning recovery, Apple Pay out-of-box, automatic tax for 40+ countries. The build-vs-buy decision: easy. The execution: hard."*

### Frontend architecture decisions

**Stripe Payment Element (over individual Elements):**
> *"We chose the Payment Element — a single component that handles all payment methods automatically. As Stripe adds new methods: they appear in our checkout with zero frontend work. Future-proofed."*

```tsx
import { Elements, PaymentElement, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY!);

function BillingPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Backend creates SetupIntent → returns client_secret
    fetch('/api/billing/setup-intent')
      .then(r => r.json())
      .then(({ client_secret }) => setClientSecret(client_secret));
  }, []);

  if (!clientSecret) return <LoadingSpinner />;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}

// confirmSetup — Stripe handles PCI, we handle UX
const handleSubmit = async (e: FormEvent) => {
  const { error } = await stripe.confirmSetup({
    elements,
    confirmParams: { return_url: `${window.location.origin}/billing/confirmation` },
  });
  // Map Stripe error codes → user-friendly messages
};
```

**PCI scope reduction:**
> *"With in-house billing: card data touched our servers. Annual PCI audit. With Stripe Elements: card data is tokenized in the browser by Stripe.js. It never reaches our servers. Our PCI scope: minimal. Annual audit: eliminated."*

### The migration strategy

**Phase 0 — Audit:** Map 47 billing interactions (subscription creation, upgrade, downgrade, cancellation, refunds, dunning, invoices, receipts).

**Phase 1 — Parallel systems:** New signups → Stripe only. Existing subscribers → stay on in-house. Zero risk to existing revenue.

**Phase 2 — Phased migration:** Migrate by cohort (Basic → Pro → Enterprise). Each cohort: create Stripe Customer + Subscription objects matching current state.

**Card migration:**
> *"PCI prevents moving card numbers directly. Stripe's card network token import: works with major issuers (Visa, Mastercard, Amex). ~85% of cards migrate without customer action. ~15% (older Visa cards, pre-paid): need re-entry. We sent pre-migration emails to those customers. The re-entry form: Stripe Elements, pre-filled with name/email."*

**Phase 3 — Decommission:** In-house billing: turned off. 14k lines of Python billing code: deleted. 3 engineers freed from billing maintenance.

### Shadow mode (the risk mitigation)

> *"Shadow mode: fire both in-house AND Stripe billing events in parallel for 30 days. Automated reconciliation in DataDog: expected revenue (from our DB) vs Stripe dashboard revenue. Any $0.01+ discrepancy: PagerDuty alert → manual investigation. Zero surprises on migration day."*

> *"The engineering team wanted to skip shadow mode to save 4 weeks. My decision: non-negotiable. A 0.5% error rate on 50,000 subscribers = 250 wrong charges. Cost of fixing: CS time, Stripe dispute fees, trust damage. 4 weeks of shadow mode << cost of 250 wrong charges."*

### Dunning flow (Stripe Smart Retry)

| Day | Event | Result |
|---|---|---|
| 0 | Payment fails | Immediate retry. Yellow banner: "Update payment method" |
| 1 | Email sent | Automated: "Your payment didn't go through." |
| 3 | Smart Retry | ML picks optimal time. ~28% recovered at this step |
| 7 | Warning escalates | Banner turns red: "Subscription paused in 7 days" |
| 14 | Final retry | Last automatic attempt. Final email. |
| 21 | Subscription paused | Data preserved. Surveys: read-only. No data lost. |

**Before (in-house): 12% recovery. After (Stripe Smart Retry): 31% recovery.**

---

## 🐍→⚛️ Part 2 — Python → React + TypeScript + GraphQL

### The legacy stack

- 12 Django/Jinja2 billing views
- jQuery for interactivity
- ~8,000 lines Python mixing data access + business logic + presentation
- 0% frontend test coverage
- Onboarding: 3 weeks before a new engineer could safely modify billing UI

### The strangler fig pattern

> *"No big rewrite. The strangler fig: gradually replace the old system, piece by piece. Users never notice the transition."*

**Step 1: React island in Django template**
```html
{# billing.html — Django still owns routing #}
<div id="billing-subscriptions-root"
     data-initial-data="{{ subscriptions_json }}">
</div>
<script src="/static/js/billing-subscriptions.bundle.js"></script>
```

**Step 2: GraphQL schema for billing domain**
```graphql
type Subscription {
  id:              ID!
  status:          SubscriptionStatus!
  nextBillingDate: Date!
  plan:            Plan!
}
type Plan { id: ID! name: String! price: Float! }
```

**Step 3: Full React page (when Python view removed)**
```tsx
// graphql-codegen generates this hook from schema:
const { data } = useGetSubscriptionsQuery();
// Fully typed. No manual interface maintenance.
// If schema changes: codegen error surfaces immediately.
```

### Modernization results

| Metric | Before | After |
|---|---|---|
| Python billing lines | 8,000 | 0 |
| Django view lines | 4,200 | 0 |
| Frontend test coverage | 0% | 74% |
| Onboarding time | 3 weeks | 4 days |
| Type safety | None | 100% typed via graphql-codegen |

---

## 📘 Part 3 — TypeScript Guild (3 years)

### What the Guild did

- Bi-weekly 45-min meeting (15-20 engineers, cross-team)
- Slack channel: `#typescript-guild` (Q&A, pattern sharing)
- Internal wiki: TypeScript Style Guide + Migration Guide
- Shared `tsconfig.base.json` maintained by the guild
- Champions: one engineer per product team

### The strictness ratchet (one option per quarter)

**Year 1 (2020):** `allowJs: true`, `noImplicitAny: false` — gentle start, allow existing JS files

**Year 2 (2021):** Added `noImplicitAny: true`, `strictNullChecks: true` — biggest impact. After strictNullChecks: teams started proactively converting JS files.

**Year 3 (2022):** Full `strict: true` + `noUncheckedIndexedAccess: true`. `allowJs: false` for new code.

> *"`noUncheckedIndexedAccess` alone caught 23 real bugs in the billing codebase. `array[i]` now types as `T | undefined` — forcing engineers to handle the empty array case that previously caused silent runtime errors."*

### 4 key patterns taught in Guild sessions

**1. Branded Types (Nominal Types)**
```typescript
type UserId   = string & { readonly __brand: 'UserId'   };
type TeamId   = string & { readonly __brand: 'TeamId'   };

function createSurvey(ownerId: UserId, teamId: TeamId) { ... }
createSurvey(teamId, ownerId); // TypeScript ERROR ✓ — can't swap string IDs
```

**2. Discriminated Unions for Billing State**
```typescript
type Subscription =
  | { status: "active";    nextBillingDate: Date                 }
  | { status: "paused";    pausedAt: Date;   resumeDate?: Date   }
  | { status: "cancelled"; cancelledAt: Date; reason: string     };

// TypeScript narrows fields correctly per status:
if (sub.status === "paused") {
  console.log(sub.pausedAt);    // ✓ exists on paused
  console.log(sub.cancelledAt); // ✗ TypeScript ERROR
}
```

**3. GraphQL Codegen (zero drift)**
```yaml
# codegen.yml:
schema: './src/graphql/schema.graphql'
generates:
  ./src/__generated__/graphql.ts:
    plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo']
```
> *"Every React component: auto-typed from the GraphQL schema. Schema changes: TypeScript errors immediately. Manual interface maintenance: eliminated."*

**4. Template Literal Types (type-safe events)**
```typescript
type BillingEvent =
  `billing_${"upgrade" | "downgrade" | "cancel" | "reactivate"}_${"clicked" | "completed" | "failed"}`;

function trackEvent(event: BillingEvent) { ... }
trackEvent("billing_upgrade_clicked");    // ✓
trackEvent("billing_bussines_clicked");   // ✗ TypeScript error catches typo
```

### Adoption metrics

| Quarter | Milestone | Coverage |
|---|---|---|
| Q1 | Guild founded | 0% |
| Q4 | Style guide v1 | 16% |
| Q7 | graphql-codegen standard | 44% |
| Q10 | strict mode org-wide | 70% |
| Q12 | End of 3-year tenure | 83% |

---

## 🤝 Part 4 — Cross-Functional Leadership

### The 6 teams you coordinated

| Team | Key concern | Your engagement |
|---|---|---|
| **Product** | Timeline, feature parity | Weekly sync, monthly OKR review |
| **Design** | New payment UI, subscription management | Design sprints, weekly review |
| **Customer Support** | New billing flows, training | Monthly demo, pre-launch training |
| **Backend Engineering** | API contracts, webhooks, data migration | Daily standup, async design docs |
| **Finance** | Revenue recognition timing, invoices | Monthly, sign-off on invoice template |
| **Security/Legal** | PCI scope, Stripe DPA | Async doc review, sign-off required |

### The CS team insight

> *"Customer Support discovered that 40% of their billing-related tickets were about specific in-house features Stripe wouldn't replicate. Without CS involvement: we'd have shipped Stripe missing those features. With CS: identified 3 features to custom-build on top of Stripe. CS is the team I most needed and most frequently forgot to include in previous projects."*

### The Finance alignment

> *"Finance: revenue recognition timing changes with Stripe. In-house: recognized on billing date. Stripe: settled T+2 business days later. Without early Finance involvement: this would have been a blocker at launch. With Finance: resolved during Phase 1."*

### Risk register (5 key risks)

| Risk | Severity | Mitigation |
|---|---|---|
| Cards can't transfer (15% re-entry) | HIGH | Pre-flight emails. Custom Stripe re-entry form. Tracked per cohort. |
| Revenue recognition timing changes | MEDIUM | Finance engaged from month 1. Shadow mode reconciliation for 60 days. |
| Stripe outage during migration window | HIGH | Migrations: 3–6am off-peak. Rollback: in-house kept live per cohort. |
| Customers see "Stripe" not "SurveyMonkey" on statement | MEDIUM | Stripe statement descriptor: "SURVEYMONKEY". Pre-launch email to all. |
| Pricing/proration calculation differences | HIGH | Shadow mode: $0.01+ discrepancy → PagerDuty → manual review. |

---

## ❓ 25 Interview Q&As

#### Q1: Why migrate from in-house billing to Stripe?
> *"Three reasons. First: maintenance burden — 3 engineers dedicated to billing instead of features. Second: dunning — our 12% recovery rate vs Stripe's 30%+ Smart Retry. Third: payment methods — adding Apple Pay was a 3-week project. With Stripe: it's automatic."*

#### Q2: What is Stripe Elements and why did you choose it?
> *"Stripe Elements: React components (PaymentElement, CardElement) that render Stripe-hosted UI inside your page. Card data is tokenized by Stripe.js in the browser — never reaches our servers. PCI scope: dramatically reduced. We chose the Payment Element (not individual Elements) — one component handles all payment methods. Future payment methods appear automatically."*

#### Q3: What is a SetupIntent vs PaymentIntent?
> *(Explain: PaymentIntent = charge now. SetupIntent = save payment method for future charges. Subscriptions: use SetupIntent to capture payment method, then Stripe auto-charges on the billing cycle.)*

#### Q4: How did you migrate 50,000 subscribers without disrupting revenue?
> *"Shadow mode: 30 days running both in-house and Stripe in parallel. Automated reconciliation in DataDog: expected vs actual Stripe revenue. Any discrepancy: PagerDuty alert. Then phased cohort migration: Basic → Pro → Enterprise. In-house kept live until each cohort stable for 2 weeks. Zero missed charges."*

#### Q5: How did you migrate payment methods without asking customers to re-enter cards?
> *"Stripe's card network token import: works with major issuers. ~85% of cards migrate invisibly. ~15% (older Visa, pre-paid) need re-entry. We identified these customers in advance, sent pre-migration emails explaining the change, provided a Stripe Elements re-entry form."*

#### Q6: What is dunning?
> *(Explain: the process of recovering failed subscription payments. Stripe Smart Retry: ML model that picks optimal retry timing based on the customer's bank, time of day, day of week. SurveyMonkey: 12% recovery (in-house) → 31% with Stripe Smart Retry.)*

#### Q7: How did you structure the dunning UX?
> *"TypeScript discriminated union for dunning state: `{ status: 'none' } | { status: 'payment_failed', failedAt: Date, nextRetry: Date } | { status: 'paused', pausedAt: Date }`. React context reads subscription status from GraphQL. Renders correct banner per state. Yellow at day 0, red at day 7, content paused at day 21 (not cancelled — data preserved)."*

#### Q8: What is the strangler fig pattern?
> *"Martin Fowler's pattern: replace a legacy system by incrementally extracting pieces into a new system, until the old system is strangled and can be removed. For billing: embed React components in Django templates first (strangler begins). Gradually take over pages. Eventually: Django removed. Users never notice."*

#### Q9: What is graphql-codegen and why is it important?
> *"Tool that reads your GraphQL schema and generates TypeScript types + React hooks. Every query: fully typed. Schema changes: codegen regenerates types → TypeScript errors surface immediately. Before: manual interface definitions that drifted from the actual schema. After: types always in sync."*

#### Q10: Why was 0% frontend test coverage a problem?
> *(Explain: 0% coverage means no regression safety. Any change could break billing flows with no automated detection. Moving to React + React Testing Library: component-level tests. GraphQL: mocked with `@apollo/client/testing`. Coverage: 0% → 74%.)*

#### Q11: What is the TypeScript Guild and why did you co-found it?
> *"2020: SurveyMonkey's 12 frontend teams adopting TypeScript independently, inconsistently. Team A: no strict mode. Team B: @ts-ignore everywhere. No shared tsconfig. The guild: a community of practice (not a mandate) that creates the shared patterns, tooling, and knowledge that makes consistent TypeScript adoption the path of least resistance."*

#### Q12: What is the strictness ratchet?
> *"Can't add all strict options at once — too many errors. Can't loosen options once set — loses the benefit. The ratchet: one new strict option per quarter. Engineers: fix their files when the option is added, then it's locked in forever. After 12 quarters: full strict mode without a single big-bang migration."*

#### Q13: What does noUncheckedIndexedAccess do?
> *(Explain: `array[i]` types as `T | undefined` instead of `T`. Forces handling of the empty array case. `array[0].property` → TypeScript error: possibly undefined. Fix: `array[0]?.property`. Caught 23 real billing bugs — places where the code assumed the array was non-empty.)*

#### Q14: What are branded types and why use them?
> *"Branded types make primitive types nominally distinct. `UserId = string & { __brand: 'UserId' }`. Now `UserId` and `TeamId` are both strings but not interchangeable. Passing `teamId` where `userId` is expected: TypeScript error. Without branding: `createSurvey(teamId, ownerId)` compiles fine — silent bug. With branding: caught at compile time."*

#### Q15: How do you convince teams to adopt TypeScript without mandating it?
> *"Three things: show, don't tell (the billing TypeScript migration demonstrates the value concretely), make it easy (the CLI migration guide, the tsconfig template, the codegen setup), and build community (the guild: peer support, shared patterns, shared wins). By the time we had 50% adoption, teams were asking to join — not being asked."*

#### Q16: What was the hardest part of the TypeScript Guild?
> *"Year 2: adding `strictNullChecks`. This broke every team's code simultaneously. The decision: announce 60 days in advance, provide the migration guide, run 'office hours' for teams who got stuck. The result: 80% of teams migrated within 45 days. The rest: 2 weeks of extra help. 'strictNullChecks is the most important TypeScript option. It's worth the short-term pain.' "*

#### Q17: How do you measure the impact of TypeScript adoption?
> *"Three metrics: (1) TypeScript coverage % (0% → 83%), (2) Production JavaScript errors (tracked in DataDog — `undefined is not a function` type errors: ↓ 61% over 18 months), (3) Developer survey: 'confidence in changing billing code' — 4.1/5 (with TypeScript) vs 2.8/5 (without)."*

#### Q18: What is a discriminated union and when should you use it?
> *"A union type where one field (the discriminant) tells TypeScript which variant you have. `status: 'active' | 'paused' | 'cancelled'` — when you narrow `status === 'paused'`, TypeScript knows exactly which other fields exist. Use whenever a type has mutually exclusive states with different associated data."*

#### Q19: Why did you use the strangler fig instead of a big rewrite?
> *"Big rewrite risks: scope creep, never finishes, breaks existing users, 6+ months with no value shipped. Strangler fig: every sprint delivers working code that replaces one piece. Users: continuous improvements. Stakeholders: visible progress. Engineers: no 'rewrite purgatory.'"*

#### Q20: How did you coordinate 6 stakeholder teams on the Stripe migration?
> *"RFC first: 12-page document shared with all 6 teams, 2-week comment period. Weekly syncs with Product and Design. Monthly demos for CS. DataDog dashboard for Finance (revenue reconciliation). Bi-weekly written update to VP Engineering. The rule: no surprises. If something's going wrong: they hear from me first, with a mitigation plan."*

#### Q21: How did you work with Finance on the billing migration?
> *"Revenue recognition timing: in-house recognized on billing date. Stripe: T+2 business days. Finance needed accounting system changes. I brought Finance in during Phase 1 — before any customer migrated. Shadow mode: compare in-house vs Stripe invoice dates for 60 days. Finance: updated their accounting integration before any real money moved."*

#### Q22: What is PCI DSS and how does Stripe change your compliance requirements?
> *(Explain: PCI DSS = Payment Card Industry Data Security Standard. With in-house billing: card data on servers = PCI Level 2, expensive annual audit, quarterly vulnerability scans. With Stripe Elements: card data tokenized in browser by Stripe, never touches servers = SAQ A compliance, much lighter requirements.)*

#### Q23: How did you handle the 15% of cards that couldn't be migrated automatically?
> *"Six weeks before migration: query our DB to identify which customers would need re-entry. Send personalized email: 'We're updating our billing system — please update your payment details by [date].' Provide direct link to Stripe Elements form (pre-filled name/email). Track completion rate weekly. For non-responders: 2 reminder emails. Escalation: CS team manually reached out to high-value accounts."*

#### Q24: What does Staff Engineer mean in this context (vs Senior)?
> *"Senior: executes the Stripe migration for the billing team. Staff: defines the migration strategy, coordinates 6 teams, makes the architectural decisions (Stripe vs Chargebee vs Recurly), manages the risk register, owns the communication cadence, and is accountable for zero missed charges across 50,000 subscribers. The difference: scope of accountability."*

#### Q25: What would you do differently?
> *"Involve Customer Support from the very first kickoff meeting. In our case: CS joined in month 2 and identified 3 features we'd missed. 6 weeks of rework that could have been avoided. Lesson: the team closest to customer problems always knows things engineering doesn't. Bring them in at day zero."*

---

## 🎤 Opening Statement (60 seconds)

> *"I was a Staff Frontend Engineer on the Billing team at SurveyMonkey from 2020 to 2023. Three things defined my time there.*
>
> *First: the Stripe migration. We had an in-house billing platform — 8,000 lines of Python, 3 engineers maintaining it, 12% failed payment recovery rate. I led a multi-quarter initiative to migrate 50,000 subscribers to Stripe. Working with 6 teams across product, design, customer support, backend engineering, finance, and legal. Zero missed charges. Failed payment recovery went from 12% to 31% with Stripe's Smart Retry.*
>
> *Second: the Python → React modernization. I led the migration of legacy Django billing pages to React + TypeScript + GraphQL, using the strangler fig pattern — replacing one page at a time without users noticing. 12,000 lines of Python removed. Frontend test coverage: 0% → 74%. Onboarding time: 3 weeks → 4 days.*
>
> *Third: the TypeScript Guild. I co-founded it and ran it for all 3 years. Zero TypeScript coverage in 2020 to 83% across 12 frontend teams by 2023. Through a shared tsconfig, a strictness ratchet, graphql-codegen integration, and a community of practice — not a mandate."*

---

## 📎 Demo Tab in App

Live at: **💳 SurveyMonkey Billing** tab.

- **💳 Stripe Migration** — In-house vs Stripe comparison, 3 migration phases, Stripe Elements mock with focus animation, 6-step dunning flow
- **🐍→⚛️ Modernisation** — 3-view page simulator (Python → Strangler Fig → React/TS), 6-step migration playbook
- **📘 TypeScript Guild** — SVG adoption chart (12 quarters), tsconfig year-by-year, 4 TypeScript patterns with before/after
- **🤝 Cross-Functional** — 5-quarter timeline, 6-team stakeholder map, 5-risk register with mitigations
