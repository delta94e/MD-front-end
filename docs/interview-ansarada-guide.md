# 🎯 Interview Guide — Ansarada Workflow

> **Context:** Greenfield product, new MFE architecture established from scratch, React + TypeScript + MobX, delivered on schedule with a small team.

---

## 🔑 Domain Context — Hiểu trước khi nói

```
ANSARADA:
  Công ty SaaS Úc chuyên về Virtual Data Room (VDR) cho M&A transactions.
  Sản phẩm chính: nơi an toàn để share tài liệu nhạy cảm trong quá trình
  mua bán doanh nghiệp. Clients: investment banks, law firms, private equity.

ANSARADA WORKFLOW:
  Sản phẩm MỚI — project management tool được xây từ đầu (greenfield).
  Mục đích: giúp advisors quản lý tasks, phases, và workstreams trong M&A deal.
  Tương tự Asana/Jira nhưng built specifically cho M&A domain:
  - Deal phases: Preparation → Due Diligence → Negotiation → Closing
  - Workstreams: Legal, Financial, Tax, Compliance, Operations
  - Team members: M&A advisors từ nhiều firms (buyer, seller, banks, lawyers)

M&A ADVISORS:
  Financial advisors, investment bankers, lawyers, accountants — những người
  dẫn dắt quá trình mua bán doanh nghiệp. Họ cần track:
  - Hàng trăm tasks trên nhiều workstreams
  - Deadlines cứng (deal SLAs, regulatory filings)
  - Collaboration giữa nhiều parties (buyer side, seller side, regulators)
  - Confidentiality (không ai thấy gì ngoài phạm vi của mình)
```

---

## 1️⃣ "Led setup and delivery of Ansarada Workflow"

### STAR Script

```
SITUATION:
  Ansarada identified a gap in their product suite: advisors using the VDR
  platform for document management had no first-party project management tool.
  They were tracking deal tasks in spreadsheets, email threads, or generic
  tools like Asana — none of which understood the M&A domain.

  The opportunity: build a Workflow product purpose-built for M&A deal management,
  deeply integrated with Ansarada's existing document and identity infrastructure.

TASK:
  I was brought onto the greenfield team to help lead setup and delivery.
  My mandate was:
  - Make early technical decisions that the product would live with for years
  - Establish a codebase structure the whole team could work in consistently
  - Keep the team unblocked while shipping on schedule

ACTION (in roughly chronological order):

  WEEK 1-2: DISCOVERY & ARCHITECTURE DECISION
    Worked with senior engineers and product to understand the roadmap.
    Key question: monolith or microfrontend?
    Given: Ansarada had multiple existing FE products, a platform team,
    and a plan for Workflow to eventually integrate with Documents and Team.
    Decision: MFE — not for complexity's sake, but for independence.
    Workflow team could ship without coordinating with legacy teams.

  WEEK 2-3: SCAFFOLD & SHARED CONTRACTS
    Set up the monorepo structure (pnpm workspaces).
    Established what was shared vs what was Workflow-owned:
    - Shared: design tokens, auth, navigation shell, MobX shared store
    - Workflow-owned: deal board, phases, tasks, Gantt view, everything domain-specific
    Got team agreement on this before writing domain code. The contracts
    came first — implementation came second.

  WEEK 3-4: TECH STACK DECISIONS
    React (team knew it), TypeScript (non-negotiable for domain complexity),
    MobX (chosen over Redux — rationale documented in ADR).
    Set up ESLint, Prettier, Husky, tsconfig, CI pipeline.
    Everything a developer needs from day 1. No "I cannot run this" on day 3.

  ONGOING: DELIVERY EXECUTION
    Participated in sprint planning and code review.
    Helped unblock engineers who hit architecture questions.
    Escalated scope risks to product early — "this feature as specced is 3
    sprints, not 1. Here are two trimmed versions. Which outcome do you need?"

RESULT:
  - Shipped Ansarada Workflow on schedule — a fully functional product.
  - MFE architecture enabled the team to deploy independently from legacy products.
  - The codebase was set up so thoroughly in week 1-3 that new engineers
    could contribute meaningfully from day 2 of onboarding.
  - Achieved balance between performance (code-split bundles, lazy loading)
    and usability (no skeleton screens visible to users in practice).
```

### Follow-up Q&A

**"What does 'led setup' specifically mean — were you a team lead or a senior IC?"**
> "I was a senior individual contributor with architectural ownership. There was a formal tech lead above me, but I was the person closest to the scaffold and early decisions. 'Led setup' means I drove the choices that the whole team would live with: repository structure, module boundaries, tech stack rationale, CI configuration. Those decisions were collaborative — I worked closely with two senior engineers — but I was the one synthesising the options, writing the ADRs, and getting them over the line. When someone on day 3 asks 'why do we use MobX and not Redux?' I was the one who had that answer documented."

**"It was a greenfield project — what was the biggest risk?"**
> "The biggest risk in any greenfield is making irreversible architectural decisions too early without enough information. The counterintuitive response to that risk is to delay some decisions — keep them reversible as long as possible — and establish the decisions that have to be made early with as much rigour as you can. The MFE decision had to be made in week 1 because it affected everything. The specific state management library could wait until week 3, because we could defer it behind an abstraction. I was deliberate about which decisions were urgent and which were important-but-not-yet-urgent."

---

## 2️⃣ "Established a new Microfrontend architecture"

### STAR Script — The Architecture Decision

```
THE PROBLEM WITH THE ALTERNATIVE:
  The safe choice was to add Workflow as a module inside Ansarada's existing
  React monolith. Why we did not:

  1. The monolith had a release cadence locked to other teams' work.
     The Workflow team would have to wait for legacy code to stabilise before
     shipping. Unacceptable for a new product trying to iterate quickly.

  2. The monolith had accumulated technical debt from 5+ years. Adding new
     code into it risks inheriting those patterns. Starting in isolation
     means starting clean.

  3. The roadmap called for Workflow to eventually surface inside the Document
     viewer and the Team management area. MFE makes that composition natural.
     A monolith makes it a mess of prop drilling and shared state conflicts.

THE ARCHITECTURE ESTABLISHED:
  Module Federation (Webpack 5) — each module:
  - Builds independently (its own webpack config, its own remoteEntry.js)
  - Deploys independently (its own CI pipeline, its own CDN path)
  - Shares runtime singletons: React, MobX (via Module Federation shared config)

  SHARED LAYER (host shell owns):
  - Auth context (current user, current deal)
  - Navigation (routing, active section)
  - Design tokens (@ansarada/tokens package)
  - Shared MobX store (authStore, dealStore — read by all, written by none)

  WORKFLOW MODULE (owns completely):
  - DealBoardView, PhaseList, TaskCard, TaskDetailPanel, GanttView
  - WorkflowStore (MobX) — tasks, filters, selections, optimistic updates
  - Everything that would change if product pivoted the deal board UX

KEY DECISION: STRICT MODULE BOUNDARIES
  The rule I established: "A module never imports from another module."
  Workflow cannot import a component from Documents. If they need to share
  something, it becomes a package in /packages/shared.
  This rule prevents the "MFE in name only" anti-pattern where you have
  separate deployments but tangled runtime dependencies.
```

### Follow-up Q&A

**"How did you decide on Module Federation vs iframes vs Web Components?"**
> "Iframes are the safest isolation but the worst user experience — no shared auth, no consistent styling, hard to communicate between panels. Web Components give you isolation but you lose the React component model, which the team was productive in. Module Federation was the right tradeoff: you get the developer experience of React everywhere, shared runtime singletons (so React is loaded once, not five times), and deployment independence. The trade-off is that all MFEs must use compatible versions of shared libraries. We mitigated that with strict versioning policies in the shared config and a lightweight integration test that checks the manifest on each deploy."

**"What was the hardest part of the MFE setup to get right?"**
> "The shared singleton configuration. If React or MobX are loaded multiple times, you get subtle runtime bugs — two React roots, two MobX reactive graphs. The fix is the `singleton: true` flag in the Module Federation shared config, but you also need `requiredVersion` constraints and a discipline of not letting modules pin their own conflicting version. I set this up carefully in week 2, and tested it by inspecting the network waterfall — if I saw `react` downloaded twice, something was wrong. We got it to load once and cache."

**"What trade-offs did you accept with MFE?"**
> "Three honest trade-offs. First: tooling complexity — debugging a cross-module issue is harder than debugging a monolith. The fix is clear module contracts and good error boundaries. Second: build time increases slightly because each module builds separately. We mitigated this with Turborepo cache — a module that did not change does not rebuild. Third: type safety across module boundaries requires effort — you cannot just import a type across remotes. We solved this with shared type packages. Every trade-off was documented, accepted intentionally, and managed. The alternative trade-offs with a monolith were worse for this specific context."

---

## 3️⃣ "Why MobX over Redux?" — Technical Depth

### The Decision + Rationale

```
CONTEXT OF THE DECISION:
  The team had mixed opinions. Redux had broad familiarity.
  MobX was less known. I was asked to make the call and document the rationale.

WHY MOBX WON:

  1. DOMAIN MODEL COMPLEXITY
     An M&A deal is a deeply nested, relationship-heavy domain:
     Deal → Phases → Tasks → Assignees → Dependencies → Documents
     MobX's class-based observable model maps directly to this.
     Redux's flat, normalised state requires non-trivial denormalisation.

  2. BOILERPLATE VS TEAM SIZE
     We had 3 front-end engineers. Redux requires: action types, action creators,
     reducers, selectors, thunks/sagas for async. For a 3-person team building
     a new product fast, every hour of boilerplate is an hour not building features.
     MobX: define @observable, @computed, @action — done.

  3. COMPUTED VALUES (DERIVED STATE)
     Deal progress (%) is computed from task statuses.
     Phase unlock state is computed from previous phase completion.
     Filtered task lists are computed from store + UI filters.
     MobX @computed is lazy (only recalculates when accessed), memoised,
     and automatically invalidated. Redux selectors (Reselect) work but
     require explicit definition and are not as ergonomic.

  4. REACT INTEGRATION
     mobx-react-lite's observer() is declarative and precise:
     exactly the component properties that changed trigger re-renders.
     No over-rendering, no manual optimisation with useMemo/useCallback everywhere.

  RISK I ACKNOWLEDGED:
     "MobX is less commonly known — onboarding new engineers will require learning
     time." I documented this in the ADR and recommended adding MobX to the
     onboarding doc with a curated reading list. Over the first month, two
     engineers who had only used Redux became comfortable with MobX and
     later said they preferred it for this type of domain.
```

### Follow-up Q&A

**"Would you choose MobX again for a different project?"**
> "It depends on the domain. For a product with a complex, relationship-heavy domain model and a small team — yes. For a product where many engineers need to onboard quickly and the state is relatively flat — Redux Toolkit's pattern is more widely understood and the boilerplate gap has shrunk significantly. The decision is always contextual. What I value is documenting the rationale so the decision can be revisited when the context changes — not treating it as permanent."

---

## 4️⃣ "Worked closely with senior engineers"

### What "working closely" actually means in an interview context

```
WHAT INTERVIEWERS ARE TESTING:
  - Can you collaborate without being told exactly what to do?
  - Can you learn from more experienced people without becoming dependent?
  - Can you contribute meaningfully even when you are not the most senior?
  - Can you navigate disagreement professionally?

HOW TO FRAME IT:

  "I was not the most senior engineer on the project. There were two engineers
  with more years of experience and a deeper knowledge of Ansarada's existing
  platform. I treated that as an advantage, not a limitation.

  Specifically:
  - Before making architectural decisions, I would draft a proposal and
    specifically ask for their critique. Not just 'does this look good?' but
    'what would you do differently, and why?' Their context about Ansarada's
    platform constraints saved us from two decisions that would have been
    painful later.

  - When I disagreed with a direction they preferred, I would write out the
    tradeoffs explicitly — not argue in real-time. It's easier to change
    someone's mind with a document than a debate, because a document gives
    them time to think without the pressure of the moment.

  - On areas where I had stronger knowledge (e.g., React Hook patterns, MobX
    setup), I made sure to share that knowledge proactively — not wait to be
    asked. I ran a quick 30-min session on the MobX reactive model for the
    whole team before we started writing stores. Shared mental model =
    more consistent code, fewer review comments."
```

### Follow-up Q&A

**"Tell me about a time you disagreed with a more senior engineer."**
> "One of the senior engineers preferred to keep our shared state in React Context rather than MobX, on the grounds that it was 'simpler and less magic.' I respected the concern — MobX's implicit reactivity is genuinely harder to debug if you do not understand it. But I thought it was the wrong call for the domain complexity. Instead of arguing in a standup, I spent an evening writing a comparison: a specific feature (real-time deal progress recalculation across multiple views) implemented in both approaches. The Context version was 80 lines with manual dependency arrays. The MobX version was 20 lines with zero manual orchestration. He read it, acknowledged the tradeoff was real, and we agreed on MobX with the condition that I document the reactive model clearly for the team. Which I did. He became one of the strongest MobX proponents on the team."

---

## 5️⃣ "Helped deliver on schedule — balancing performance and usability"

### STAR Script

```
"DELIVERED ON SCHEDULE" — what made this non-trivial:

  RISK 1: SCOPE CREEP
    Product kept adding "small" additions to features mid-sprint.
    My approach: I tracked a "scope delta" document — any change from
    the original sprint scope was added with an estimated cost.
    At the end of sprint 2, I showed product: "we added 6 days of scope
    to a 10-day sprint. Here are the 3 features we need to defer to keep
    the ship date." Product agreed. This is not being difficult —
    it is giving product the information they need to make real decisions.

  RISK 2: PERFORMANCE VS USABILITY TENSION
    Early in the project, the design had complex animations and a rich
    sidebar that felt beautiful but caused layout thrash on load.
    I ran a lighthouse audit and profiled the First Contentful Paint:
    3.4s. Unacceptable.

    The fix was a negotiation with design, not a unilateral technical decision:
    "Here are the 2 animations causing the most FCP regression. Can we achieve
    the same visual feel with CSS transitions instead of JS-driven animations?
    It would be imperceptible to users but cut FCP to ~1.1s."
    Design agreed. We shipped a product that felt premium AND loaded fast.

    Technical implementation:
    - Code-split by MFE module (largest: 420KB, loaded only when needed)
    - React.lazy() + Suspense for heavy panels (Gantt view, document tree)
    - MobX @computed values are lazy — no eager recalculation on mount
    - No layout thrash: all layout-affecting reads batched before writes

RESULT:
  - Shipped on time with the full feature set agreed in sprint 3
    (some nice-to-haves deferred, all must-haves delivered).
  - FCP: 3.4s → 1.1s (Lighthouse lab conditions).
  - User research sessions post-launch: "feels fast," "easy to understand."
    No performance complaints in the first 30 days.
```

### Follow-up Q&A

**"How do you define 'on schedule' — did anything slip?"**
> "Honest answer: the initial definition of 'on schedule' slipped by one sprint, but what shipped on the original date was the agreed scope, not the original scope. I distinguish between 'we slipped' and 'we negotiated scope to protect the date.' We negotiated scope. Three features moved to the next release: a Gantt view, CSV export, and notification preferences. All were genuinely nice-to-have. The core deal board, phase management, task assignment, and filtering shipped on the original date. That is a delivery success, in my view — the stakeholders knew weeks in advance what would and would not be in the first release."

**"How did you think about performance vs usability tradeoffs?"**
> "I treat performance as a usability concern, not a separate engineering concern. A slow interface is a bad interface. So the framing I used with design was never 'we have to make this less beautiful for performance.' It was 'here is how to achieve the same emotional effect with a faster implementation.' In almost every case, there is a performant way to get the same design outcome. The cases where there genuinely is not — where the beautiful thing is irreducibly expensive — I quantify the cost clearly and let stakeholders decide. 'This particle animation adds 800ms to FCP. Is that the right trade-off for this screen?' I gave them the data. They made the call."

---

## 🔗 Unified Narrative — How to connect all 4 bullets

When asked **"Tell me about your role at Ansarada and the Workflow product"**:

> "At Ansarada I was part of a small team building Workflow — a greenfield project management product for M&A advisors. It was new territory for the company, which meant I had the opportunity to make foundational decisions that shaped everything that followed.
>
> The first thing I focused on was the architecture. We chose Microfrontend using Module Federation because the roadmap required Workflow to integrate into Ansarada's existing platform without being blocked by it. Independent deployment was a strategic requirement, not a technical preference.
>
> Within the MFE, I established MobX as the state management solution. The M&A domain is relationship-heavy — a deal has phases, phases have tasks, tasks have assignees, assignees have roles, roles determine what you can see. MobX's reactive object model maps to that domain naturally, and MobX's @computed values gave us real-time derived state (deal progress, phase completion %) without manual orchestration.
>
> I worked closely with two senior engineers who had deeper context on Ansarada's platform. I made a point of learning from them before making calls — their context shaped the shared-layer design in ways that saved us real pain later. And on the areas where I had stronger knowledge, I made sure to share proactively rather than waiting to be asked.
>
> The product shipped on schedule. The discipline that made that possible was scope transparency — I tracked every change to sprint scope and surfaced it early so product could make real trade-off decisions, not discover them at the end of the sprint."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "Ansarada Workflow là một project management tool" | Add context: "for M&A advisors — people managing complex multi-party transactions" |
| Nói MobX mà không giải thích WHY | Always follow with: "because the domain was deeply nested and relationship-heavy..." |
| "Greenfield was easy because we started clean" | "Greenfield is harder in a different way — you cannot learn from existing code, every decision is yours" |
| "We delivered on schedule" (no nuance) | "We negotiated scope to protect the date — here are the three things we deferred and why" |
| "I worked with senior engineers" (passive) | "I specifically sought their critique before finalising decisions — their platform context changed X" |
| Không đề cập performance numbers | FCP 3.4s → 1.1s is concrete and memorable |

---

## 📊 Quick facts to remember

```
Product:       Ansarada Workflow — project management for M&A advisors
Architecture:  Microfrontend (Module Federation, Webpack 5)
Stack:         React, React Hooks, TypeScript, MobX
Team size:     Small (3 FE engineers + collaboration with senior engineers)
Type:          Greenfield — built from scratch
Result:        Fully functional product delivered on schedule
Performance:   FCP 3.4s → 1.1s
Deploy:        Independent per module — workflow team ships without blocking others
MobX choice:   ADR documented, OOP model fits M&A domain, less boilerplate for small team
Key skill:     Scope management — "scope delta tracking to protect the ship date"
```

---

*Document last updated: June 2026 · Ansarada Workflow interview preparation*
