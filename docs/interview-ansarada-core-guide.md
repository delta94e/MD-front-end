# 🎯 Interview Guide — Ansarada Core Team (Collectives)
## IC → Cross-team Tech Lead · Component Framework · MFE Pioneer · Tech Meetup 2017

---

## 🔑 Context: What Makes This Period Impressive

```
TIMING MATTERS:
  2016-2017 was early for these patterns:
  - Shared React component libraries were not standard yet (Material-UI was small, Ant Design was Chinese-market only)
  - Microfrontend as a term was coined in 2016 — doing it in 2017 was pioneering
  - Module Federation (Webpack 5) did not exist — MFE required manual architecture work
  - React vs AngularJS was a live debate — speaking publicly about it took a position

  This is not "I used a framework."
  This is "I made foundational architectural decisions before the industry had settled answers."
```

---

## 1️⃣ Career Evolution: Interface Engineer → Cross-team Tech Lead

### How to frame this story

```
The evolution was not a formal promotion — it was organic expansion of impact:

  Year 1-2 (Interface Engineer, Core/Collectives Team):
    Shipped product features as IC. Developed deep React knowledge.
    Noticed cross-team problem: every team reinventing the same components.

  Year 2-3 (Platform Builder, still IC title):
    Proposed and built the shared component library.
    Established CI/CD pipeline adopted across all teams.
    This is the moment the "tech lead" identity formed — before the title.

  Year 3 (Architect):
    Identified the monolith as the reason teams could not ship independently.
    Designed and led the decomposition into 4 independent apps.
    This required coordinating multiple teams — de facto leadership.

  Year 3+ (Cross-team TL, de facto):
    Floated between teams as a specialist and architectural advisor.
    Gave a tech talk — external recognition of internal thought leadership.
```

### STAR Script

```
SITUATION:
  The Ansarada frontend org had 4 product teams all working in different areas.
  As an Interface Engineer on the Core (Collectives) team, I was shipping features
  for one team — but I could see that each team was independently solving the same
  problems: building their own Button components, their own Modal, their own CI setup.
  There was no shared foundation.

TASK:
  I was not asked to fix this. I proposed it. That is the distinction I want to highlight.
  Going from IC to cross-team TL was not about being promoted — it was about seeing a
  problem at the organisation level and choosing to solve it.

ACTION:
  I started with the component library because it had the clearest immediate value —
  you could demo "here are 4 different Buttons, here is one that replaces them all."
  Once the library was adopted, it created trust. That trust opened the door to the
  bigger conversation: the monolith.

  Then I proposed the MFE decomposition — a harder sell because it required every
  team to change their development workflow. I wrote a detailed technical proposal,
  presented it to engineering leadership, and got 3 months to execute it.

RESULT:
  - Component library adopted by all 4 teams — eliminated duplicate work
  - CI/CD pipeline standardised — every team shipping reliably with the same process
  - Monolith decomposed into 4 independent apps — teams shipped independently for the first time
  - Invited to speak at the Ansarada Tech Meetup — external recognition
```

### Follow-up Q&A

**"How do you describe the difference between an Interface Engineer and a Cross-team Tech Lead?"**
> "An Interface Engineer's output is code — shipped features, fixed bugs, reviewed PRs. A cross-team tech lead's output is other engineers' effectiveness. The transition happened when I stopped asking 'what feature should I build next?' and started asking 'what is the thing that, if I solved it, would make all four teams faster?' That is a fundamentally different question. The component library and the MFE architecture were both answers to that question."

**"You grew into a leadership role without a formal title change — how did that work?"**
> "Trust is the currency of informal leadership. I earned it by solving a problem everyone felt but no one had proposed to solve — the duplicate component problem. When I delivered the component library, it was immediately, visibly useful to people. That gave me the credibility to make a bigger proposal: the MFE architecture. The title came later, but the reality of the role came from demonstrating impact. I think this is actually a better way to grow into leadership than being handed a title and figuring it out — you prove the impact first."

---

## 2️⃣ Custom Component Framework + CI/CD for SPAs

### Context — 2016/2017 ecosystem

```
WHAT "COMPONENT FRAMEWORK" MEANT IN 2016/17:
  There was no Material-UI (v1 was released late 2018, not widely adopted before that).
  No Ant Design in Western markets. No Chakra. No Radix.
  Teams either:
  a) Used Bootstrap with jQuery — not React-native, fought the component model
  b) Built their own components ad-hoc — the problem we solved
  c) Built a shared component library — what we did

  This was HARDER in 2016/17 because:
  - No styled-components / CSS-in-JS (styled-components released 2016, niche)
  - CSS Modules were the state of the art — we used those
  - No TypeScript (or TypeScript with poor React support) — we documented via PropTypes
  - No Storybook (Storybook for React released 2016, but barely adopted until 2017-2018)
  - Chromatic, Figma — didn't exist in this form
```

### STAR Script

```
SITUATION:
  Ansarada had 4 product teams, each building their own UI components.
  When I audited the codebase, I found:
  - 4 Button implementations with different prop APIs, styling, and accessibility
  - 3 Modal implementations, only one of which properly managed focus
  - No consistent spacing, no colour token system — each team hardcoded hex values
  - No CI/CD — deployments were manual, nerve-wracking, and inconsistent

TASK:
  Build a shared React component library and a standardised CI/CD pipeline
  that all 4 teams would adopt.

ACTION — Component Library:
  The hardest part was not the code — it was the API design.
  A shared component that 4 teams use cannot have a breaking API change without
  coordinating with all 4 teams. So the API had to be:
  1. Composable (children, not label — so teams could put anything inside)
  2. Accessible by default (focus management, ARIA, keyboard nav built-in —
     you should not have to think about it)
  3. Variant-driven, not className-based (prevents one-off styling drift)
  4. Version-controlled with CHANGELOG — breaking changes had a process

  I also introduced PropTypes (TypeScript was not yet the standard at the time)
  so consumers knew the exact API contract.

ACTION — CI/CD:
  The pipeline I established (Jenkins at the time):
  1. Install (npm ci — reproducible installs)
  2. Lint + Type check (parallel — fast feedback)
  3. Unit tests with coverage gate (80% branch coverage to merge)
  4. Production webpack build (hashed filenames, tree-shaking)
  5. Auto-deploy to staging (shareable URL for QA and design review)
  6. E2E smoke tests (Cypress, critical user journeys)
  7. Manual approval gate → production deploy (S3 + CloudFront cache invalidation)

RESULT:
  - All 4 teams adopted the library within 2 months
  - Duplicate component count reduced by ~68%
  - Deploy reliability: 0 failed deployments in the first quarter
    (previously, deploys failed ~25% of the time due to manual steps)
  - New engineers onboarded ~40% faster — "use the shared component,
    here is the Storybook, it works" vs "find the component, read the code,
    guess the API"
```

### Follow-up Q&A

**"How did you get 4 teams to adopt your component library?"**
> "I treated adoption as a product problem, not a mandate problem. I did not say 'you must use this.' I made it obviously better than the alternative and made migration as low-friction as possible. Specifically: I started with one component that every team was building anyway — Button — and I made the shared Button demonstrably better: accessible, animated, with a loading state they all needed but kept re-implementing. I migrated one team's Button myself, showed them the diff (100 lines removed, 3 lines added), and asked for their feedback. By the time it reached teams 3 and 4, the earlier teams were selling it for me."

**"How did you version breaking API changes?"**
> "Semantic versioning with a CHANGELOG. Breaking changes got a major version bump and a migration guide. I also introduced a deprecation period — old props still worked but logged a console.warn for one minor version cycle before being removed. This gave teams time to migrate at their own pace. The key rule was: never remove a feature without providing the equivalent capability. If I removed a prop, I added a better way to achieve the same outcome."

**"What was the hardest component to get right?"**
> "The DataTable. It had the most varied usage across teams — some needed sorting, some needed filtering, some needed both, some had 10 rows, some had 10,000. The naive solution (one component with all features enabled) was too heavy for the simple cases. The solution was a layered architecture: a core DataTable that did layout, a SortableDataTable that wrapped it, a FilterableDataTable that wrapped that. Consumers chose the layer they needed. I learned from that: shared components need to be composable at the feature level, not just the render level."

---

## 3️⃣ Microfrontend Architecture — Monolith → 4 Independent Apps

### Why 2017 MFE was harder (and more impressive)

```
WHAT DID NOT EXIST IN 2017:
  - Webpack Module Federation (Webpack 5, 2020)
  - Single-SPA was very early stage (released 2016, barely production-ready)
  - No industry playbook for MFE — it was a 2016 ThoughtWorks Radar item,
    not an established pattern with known solutions

WHAT WE USED INSTEAD:
  - Separate Webpack builds per app (each team builds independently)
  - Nginx reverse proxy routing (/rooms/* → data-rooms SPA, /bidder/* → bidder SPA)
  - Shared auth via httpOnly cookie (same domain — *.ansarada.com)
  - Shared context via URL (deal ID in URL path, not in shared memory)
  - Cross-app events via CustomEvent API (global notifications from any app)
  - User preferences via localStorage (same origin, all apps can read)

  No runtime module sharing. No dynamic remote loading.
  The "independence" was at the HTTP layer — each app was a separate bundle
  served from a separate S3 path, behind Nginx routing.
```

### STAR Script

```
SITUATION:
  The Ansarada frontend was a single monolithic React application.
  When one team pushed a bug to production, all 4 teams had to roll back.
  When Data Rooms (the heaviest feature) had a slow build, all teams waited.
  Deploy frequency had dropped to twice a week — everyone afraid to touch it.

TASK:
  I proposed separating the monolith into 4 independent SPAs, each with its
  own build, deploy, and CI pipeline. Teams would be able to ship independently.

ACTION:
  Step 1 — Identify boundaries:
    The decomposition was not arbitrary. I mapped every component, route, and
    piece of state to its primary owner. The boundary question was:
    "If two features are always deployed together, they belong in the same app.
    If they have different deployment cadences, they belong in different apps."

    Four natural boundaries emerged:
    - Core Shell: auth, navigation — shared by all, deployed rarely
    - Data Rooms: VDR document management — the biggest, most complex, daily deploys
    - Bidder Portal: bid submission, Q&A — separate team, different users, different pace
    - Analytics: reporting — small team, experimental, needed to move fast

  Step 2 — The plumbing (2017 approach, without Module Federation):
    - Nginx configured to route /rooms/* to the Data Rooms S3 bucket,
      /bidder/* to the Bidder Portal bucket, etc.
    - Shared auth: httpOnly cookie on *.ansarada.com — all apps see it
    - Cross-app navigation: hard page load when crossing app boundaries
      (e.g., /rooms → /analytics) — acceptable because it happens rarely
    - Global notifications: window.CustomEvent API — any app fires an event,
      Core Shell listens and renders the toast

  Step 3 — Migration, not big bang:
    I ran the decomposition over 3 months. One app extracted per month.
    Core Shell first (smallest scope, highest leverage).
    Data Rooms last (largest scope, highest risk).
    Each extraction was done with feature parity testing before cutover.

RESULT:
  - 4 independent apps, each team deploys independently
  - Deploy frequency: 2x/week → 8x/week (each team on their own cadence)
  - Data Rooms bug → Data Rooms rollback only. Other apps unaffected.
  - Build time: was 18 min for the whole monolith; became 4-6 min per app
  - Team morale: "we can ship on Fridays now" — a real measure of confidence
```

### Follow-up Q&A

**"How is this different from what Module Federation does today?"**
> "Module Federation, which shipped with Webpack 5 in 2020, solves the runtime sharing problem — multiple independently deployed SPAs can share the same React instance, share components at runtime, and communicate through a shared state layer. What we did in 2017 was the deployment independence layer only — each app was fully self-contained. Crossing app boundaries required a full page load. There was no runtime component sharing. Module Federation makes the user experience seamless. Our 2017 approach made the team experience seamless. Both are valid; we just had fewer tools available."

**"What was the hardest part of the migration?"**
> "The shared state question — specifically, what data needed to cross app boundaries at runtime, and how to pass it without a shared memory model. The answer was: minimise it. Design the apps so they barely need to talk to each other. When we could not avoid communication, we used the URL (the deal ID is in the URL path, readable by every app), the cookie (auth), and CustomEvents (notifications). Every time someone proposed adding a new cross-app dependency, I pushed back: 'can this app be redesigned so it doesn't need to know that?' Usually it could."

**"How did you convince engineering leadership to spend 3 months on architecture?"**
> "I did not pitch it as architecture — I pitched it as a delivery problem with a technical solution. 'We are deploying twice a week because teams are afraid to touch the monolith. Here is the cost: we estimate 6 features delayed per month due to release coordination. Here is the solution, here is the 3-month investment, here is the projected outcome: each team deploys independently, deploy frequency should increase 4x.' Leadership understood that framing immediately. 'Microfrontend architecture' as a concept would have generated questions. 'Teams blocked because of shared deploys — here is how to fix it' generated approval."

---

## 4️⃣ Tech Talk: React vs AngularJS (Ansarada Tech Meetup, 2017)

### Why this is impressive in an interview

```
WHAT IT SIGNALS:
  - You had a clear technical opinion and the confidence to express it publicly
  - You did enough research to make a well-reasoned argument (not just personal preference)
  - You were connected to the external tech community — meetups, not just work
  - You helped shape the technical direction of your organisation
    (the talk was the final push for the internal React adoption decision)

  In 2017, React vs AngularJS was NOT an obvious answer.
  Angular had Google backing. Angular was the "enterprise" choice.
  React was newer, made by Facebook, "just a view library."
  Taking a clear public position took intellectual courage.
```

### STAR Script

```
SITUATION:
  In 2016-2017, the Ansarada frontend team was at a decision point.
  The existing codebase had some AngularJS. New products were being spec'd.
  The question was: do we double down on Angular (1.x or the new 2.x),
  or do we migrate to React?

  This was a real debate at the time. Angular had Google backing and enterprise
  credibility. React was growing fast but was "just a view library" — you had
  to assemble the rest of the stack yourself.

TASK:
  I was asked to give a tech talk at the Ansarada Tech Meetup sharing my analysis.
  The implicit ask was: help the team make a decision, and share our reasoning
  with the broader Sydney tech community.

ACTION:
  I structured the talk around 6 dimensions:
  1. Learning curve — React wins (JavaScript knowledge transfers; AngularJS requires
     learning Angular-specific concepts on top)
  2. Performance — React wins (Virtual DOM is predictable; Angular's dirty-checking
     degrades with watcher count)
  3. Ecosystem stability — React wins (AngularJS 1.x end-of-life announced;
     Angular 2 is a complete rewrite — your AngularJS knowledge doesn't transfer)
  4. Component model — React wins (f(props) = UI is simple; AngularJS directives
     have compile/link phase complexity)
  5. Testing — React wins (render and assert; AngularJS requires bootstrapping
     the full framework or complex mocking)
  6. Architecture fit — React wins for SPA (just a view library — you control
     the architecture; Angular gives you opinions you may not want)

  I was honest about React's trade-offs:
  - You have to choose your own router, state management, data fetching
  - That is EXPLICIT complexity — better than Angular's IMPLICIT complexity
  - Recommendation: React + React Router + Redux (standard 2017 stack)

RESULT:
  - The team officially adopted React as the primary frontend library for all new development
  - By 2018, the entire Ansarada frontend org was React-first
  - The component library, CI pipeline, and MFE architecture were all built on React
  - Received good audience engagement — engineers from other Sydney companies
    approached after the talk with questions and to share their own experiences
```

### Follow-up Q&A

**"Would you make the same recommendation today?"**
> "For a new SPA in 2024, React is still a strong choice — the ecosystem, tooling, and community are unmatched. But the recommendation I made in 2017 was also about rejecting AngularJS specifically, not just choosing React. In 2017, AngularJS 1.x was end-of-life, and Angular 2 was unproven. That asymmetry made the decision clear. Today, Vue, Svelte, and solid alternatives exist. I would still recommend React for a team that values ecosystem stability and talent availability. But I would not rule out alternatives the way I did in 2017 — the landscape is more mature and the choice is less obvious."

**"What was the hardest question from the audience?"**
> "Someone asked: 'But React is just a view library — doesn't that mean we have to make all these architecture decisions ourselves? How do we know we'll make the right ones?' My answer: that is exactly the right concern, and the right response is to make those decisions explicitly and document them, rather than have a framework make them for you implicitly. We picked React Router for routing, Redux for state management, and axios for HTTP. We documented why. When those decisions needed revisiting, we could — because they were explicit. With AngularJS, the decisions were made by the framework, and revisiting them meant fighting the framework. Explicit complexity is manageable. Hidden complexity is a trap."

**"How did you prepare for the talk?"**
> "I spent two weeks reading deeply: the AngularJS source for the digest cycle, the React source for the reconciler, both teams' GitHub issue trackers, and every technical blog post I could find comparing the two. I also built the same small application twice — once in AngularJS, once in React — and used that as a concrete code comparison in the talk. The benchmark, not the theory. I also prepared for being wrong: I listed every argument I could think of for AngularJS, and made sure I had a real answer for each one. If you can argue the other side better than your opponent, you own the debate."

---

## 🔗 Unified Narrative for "Tell me about your time at Ansarada"

> "At Ansarada I had one of those rare opportunities where you start as an individual contributor and, through the work you choose to do, end up shaping the technical direction of the whole frontend organisation.
>
> I joined as an Interface Engineer on the Core team. In the first year, I was shipping features and developing deep React knowledge — this was 2016, and React was still a somewhat controversial choice. I noticed that every team was independently solving the same UI problems: building their own Button, their own Modal, their own CI pipeline. So I proposed and built a shared React component library and standardised the CI/CD pipeline. All four teams adopted it.
>
> That platform work created trust. Which opened the door to a bigger conversation: the monolith. The entire frontend was one application — when one team pushed a bug, everyone rolled back. Teams had stopped deploying on Fridays. I proposed decomposing it into four independent apps, and got three months to execute it. We did it without Webpack Module Federation, which did not exist yet — we used Nginx routing, shared cookies for auth, and CustomEvents for cross-app communication.
>
> By the time I spoke at the Ansarada Tech Meetup in 2017 about why we chose React over AngularJS, I was representing decisions I had actually implemented. The talk was not theoretical — it was a post-mortem on a live codebase.
>
> What I take from that period is that technical leadership is not a title. It is the pattern of seeing a problem at the organisational level and choosing to solve it, even when you have not been asked to."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "We used React" | "In 2017, React vs AngularJS was a real debate. I gave a public talk making the case for React — here is the reasoning" |
| "I built a component library" | "I designed the API to be adopted by 4 teams with different needs — the API design was the hard part, not the code" |
| "We did MFE" | "We did MFE in 2017 without Module Federation — here is how we solved shared auth, cross-app state, and independent deploys manually" |
| "I became a tech lead" | "I grew into a cross-team TL role organically — through platform work that created trust, not through a formal promotion" |
| Không đề cập historical context | The timing (2017) is a key part of what makes this impressive — emphasise it |

---

## 📊 Quick facts

```
Role evolution: Interface Engineer → Platform Builder → Architect → Cross-team TL
Period: ~2016–2018
Stack: React, CSS Modules, PropTypes (pre-TypeScript), Webpack, Jenkins, AWS S3 + CloudFront
MFE approach: Nginx routing + httpOnly cookies + CustomEvents (pre-Module Federation)
Apps extracted: 4 (Core Shell, Data Rooms, Bidder Portal, Analytics)
Component library: Adopted by 4 teams, reduced duplicate components ~68%
CI/CD: Jenkins pipeline — lint, types, test, build, staging deploy, E2E, production gate
Talk: Ansarada Tech Meetup 2017, Sydney — React vs AngularJS
Talk outcome: Ansarada adopted React org-wide for all new FE development
```

---

*Document last updated: June 2026 · Ansarada Core Team interview preparation*
