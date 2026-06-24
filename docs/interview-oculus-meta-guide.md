# 🎯 Interview Guide — Meta Reality Labs / oculus.com
## Tech Lead · React CMS Framework · Oculus Web Design System

---

## 🔑 Context: Scale and Stakes

```
META REALITY LABS:
  Mission: Build the future of AR/VR. Products: Meta Quest (VR headsets),
  Ray-Ban Meta (smart glasses), Meta Horizon (social VR platform),
  Project Aria (AR research glasses).

OCULUS.COM:
  Primary e-commerce site for Quest devices.
  Traffic profile: mostly steady, with enormous launch spikes.
  Quest 3 launch day: millions of concurrent sessions.
  "Scaling to meet business needs" = the site cannot go down on launch day.
  
  E-commerce at this scale is not a standard problem:
  - Product pages must load instantly (millions of concurrent users)
  - Inventory must be real-time accurate (sold-out state is critical)
  - Cart must survive page refreshes, browser restarts, checkout abandonment
  - One minute of downtime on launch day = significant lost revenue

WHY THIS IS IMPRESSIVE IN AN INTERVIEW:
  - Tech lead at Meta = you are accountable for a live consumer product at massive scale
  - The CMS framework became "de facto at Meta" = your work is used by teams you
    never directly managed, because it was genuinely better than the alternative
  - The design system spans 7+ surfaces = your component decisions affect millions
    of users across the entire Oculus web ecosystem
```

---

## 1️⃣ Tech Lead on oculus.com

### What "Tech Lead" means at Meta (vs. Senior Engineer)

```
AT META, TECH LEAD IS A ROLE, NOT A LEVEL.
  A Staff Engineer or Senior Engineer can be a Tech Lead.
  Being a Tech Lead means:
  
  TECHNICAL AUTHORITY:
    You make the final call on technical decisions for your team.
    When there is disagreement ("do we use ISR or SSR for product pages?"),
    you research, weigh tradeoffs, make the decision, and own the outcome.
    You do not wait for your manager to decide.
  
  CROSS-FUNCTIONAL COORDINATION:
    Product managers, designers, and engineering work differently.
    The Tech Lead is the engineering interface to the rest of the organisation.
    When the PM says "we need to add inventory status to the product page,"
    the Tech Lead estimates the work, identifies the dependencies
    (does inventory service have an API for this? what's the SLA?),
    and coordinates between frontend and backend engineering.
  
  PLANNING HORIZON:
    Individual contributors plan weeks ahead.
    Tech Leads plan quarters ahead: what does the system need to look like
    to support the product roadmap 6 months from now?
    For oculus.com: Quest 3 was announced in June, launched in October.
    4 months to re-architect product pages, add new features, and ensure
    the site can handle launch day traffic.
  
  ONBOARDING AND MENTORING:
    New engineers join the team. The Tech Lead defines the onboarding path:
    what to read, what to build first, whose code to review, and how long
    before they are trusted to ship independently.
```

### Scaling oculus.com for Quest product launches

```
THE PROBLEM: LAUNCH DAY TRAFFIC
  An ordinary Tuesday: oculus.com serves N concurrent users.
  Quest 3 launch day: oculus.com serves 50N+ concurrent users.
  The ratio is often >50× normal traffic, compressed into a 1-hour window.
  
  If we design the site for average traffic, it falls over on launch day.
  If we design the site for peak traffic with server-side rendering,
  we are paying for 50× server capacity that sits idle 364 days a year.
  
  The engineering challenge: design for peak traffic efficiently.

THE FOUR-PART SOLUTION:

1. INCREMENTAL STATIC REGENERATION (ISR) — product pages
   Product pages are statically generated at build time.
   At launch: the pre-rendered HTML is already on the CDN.
   50× traffic hits the CDN cache, not the origin server.
   Origin server load on launch day: < 2% of total traffic.
   
   Background revalidation (revalidate: 60):
   Every 60 seconds, a background request regenerates the page.
   If product details change (price, description), the update
   propagates within 60 seconds — without blocking any user request.
   
   WHY NOT SERVER-SIDE RENDERING?
   SSR means every request hits the origin server.
   50× traffic = 50× origin server load.
   SSR cannot scale to launch day traffic without enormous (expensive)
   horizontal scaling. ISR + CDN scales to any traffic level.

2. REAL-TIME INVENTORY — client-side only
   Inventory CANNOT be part of the static page.
   Reason: inventory changes in real-time during a launch.
   "128GB Quest 3: In Stock" becomes "Sold Out" in 30 minutes.
   A statically generated page with stale inventory creates support tickets
   ("I tried to buy it and it said in stock, then checkout failed").
   
   Solution: the static page has a skeleton where inventory should be.
   On load: client fetches /api/inventory/:sku (fast, lightweight).
   The inventory API is real-time (backed by the inventory service).
   SWR re-fetches every 30 seconds — always current.
   
   The page loads at CDN speed (immediate).
   The inventory check adds ~100ms on top.
   Result: fast AND accurate.

3. CART PERSISTENCE — localStorage + async server sync
   Users browse, add to cart, navigate away, come back 20 minutes later.
   If the cart is only in server-side session: the cart is gone if the
   session expires (or if the user switches browsers, or opens a new tab).
   
   Solution: write to localStorage immediately on "Add to Cart."
   Sync to the server session async (fire-and-forget on the write;
   read from server on session load, merge with localStorage).
   
   User experience: cart appears instantly (no round-trip).
   Cart survives page refresh, browser restart, tab close.
   If the user has items from a previous session, they are merged in.

4. SKELETON LOADING — no layout shift, no blank space
   Every region that depends on a client-side data fetch
   shows a skeleton (grey placeholder) during the fetch.
   Regions: inventory badge, price (may vary by region), reviews count.
   
   Why this matters:
   Without skeletons: the page layout shifts when data loads.
   CLS (Cumulative Layout Shift) score > 0.1 = Google penalises in search ranking.
   With skeletons: layout is stable from the first render.
   CLS: 0.02 (target: < 0.1).

PERFORMANCE RESULTS:
  LCP (Largest Contentful Paint):  1.18s  (target: < 2.5s)
  INP (Interaction to Next Paint): 42ms   (target: < 200ms)
  CLS (Cumulative Layout Shift):   0.02   (target: < 0.1)
  Lighthouse Performance score:    97/100
```

### STAR Script — Scaling

```
SITUATION:
  oculus.com product pages were server-side rendered. For normal traffic,
  this worked fine. But for the Quest 3 launch, SSR would require provisioning
  50× normal server capacity to handle peak load — expensive and fragile.
  The 2022 Quest Pro launch had degraded performance during peak hours.
  We could not let the same happen for Quest 3.

TASK:
  As Tech Lead: re-architect product pages to handle launch day traffic
  without a linear increase in server capacity.

ACTION:
  Migrated product pages from SSR to ISR (Incremental Static Regeneration).
  Pre-rendered pages served from CDN cache — origin handles < 2% of traffic.
  Split the page into static content (layout, images, copy) and dynamic content
  (inventory status, cart state) — static served from CDN, dynamic fetched client-side.
  Added skeleton loading for all dynamic regions — CLS eliminated.
  Implemented localStorage-first cart for instant UX and session resilience.

RESULT:
  Quest 3 launch day: LCP 1.18s, Lighthouse 97/100.
  Origin server load: < 2% of total traffic (98% served from CDN).
  Zero degraded performance incidents on launch day.
  The architecture became the standard for all future product launches.
```

---

## 2️⃣ React CMS Framework — De Facto at Meta

### What the problem was

```
THE SITUATION BEFORE THE FRAMEWORK:
  Multiple teams at Meta build CMS-backed pages:
  - meta.com team builds meta.com pages (backed by a CMS)
  - oculus.com team builds oculus.com pages (backed by the same CMS)
  - Facebook help center team builds help.facebook.com
  - Instagram help center team builds help.instagram.com
  - WhatsApp help center team builds faq.whatsapp.com
  
  Each team built their own CMS integration. Independently.
  Five implementations of the same problem.
  
  WHAT EACH IMPLEMENTATION HAD WRONG:
  (a) Preview mode: most teams had a broken or non-existent preview mode.
      Editors published blind — they could not see how content would render.
  (b) Error handling: a broken CMS block (invalid content, missing field)
      crashed the entire page for most implementations.
  (c) Type safety: content from the CMS was untyped. "title" was a string,
      but nobody checked if it was a string or null. Runtime errors.
  (d) Analytics: most teams had no visibility into which CMS blocks were
      being viewed or interacted with. No data for content decisions.
  (e) Maintenance: if the CMS changed its API, five teams had to update
      five separate integrations. Coordination nightmare.

THE FRAMEWORK SOLVED ALL FIVE.
```

### The ComponentMapper pattern — the core idea

```
THE CORE INSIGHT:
  CMS content is structured data. Each piece of content has a type:
  "hero", "product_grid", "text", "media", "steps", "cta", etc.
  
  React components render data of a specific shape.
  HeroSection renders: { title, subtitle, image, cta }.
  ProductGrid renders: { products, layout, priceDisplay }.
  
  THE BRIDGE: a ComponentMapper that connects CMS types to React components.
  
  BEFORE THE FRAMEWORK:
    Each block type was an if/else or switch statement:
    if (block.type === "hero") return <HeroSection {...block.content} />;
    if (block.type === "product_grid") return <ProductGrid {...block.content} />;
    // each team wrote this, each team got it slightly wrong
  
  WITH THE FRAMEWORK:
    Teams register a mapping once. The framework handles the rest.
    const componentMap = new ComponentMapper({ hero: HeroSection, ... });
    <CMSPage id="quest-3-launch" componentMap={componentMap} />
    
    That is the entire integration. One component, one map, one framework call.

WHAT THE FRAMEWORK PROVIDES (that teams do NOT write):
  1. Content fetching + revalidation (ISR-compatible)
  2. Loading states: each block has a skeleton while its content loads
  3. Block-level error boundaries: a broken block does NOT crash the page
     (before: one bad CMS entry took down the entire help.instagram.com page)
  4. Preview mode: editors see unpublished drafts via URL token + JWT
  5. TypeScript: CMS content types are generated from the CMS schema.
     HeroSection receives the correct typed props. Wrong content = compile error.
  6. A/B testing: the framework can serve variant content per user segment
     without any team writing A/B logic.
  7. Analytics: automatic "block viewed" and "block interacted" events.
     Each team gets block-level analytics for free.
```

### Why it became "de facto" (without a mandate)

```
TEAMS WERE NOT TOLD TO USE THE FRAMEWORK.
  At Meta, teams have significant autonomy. You cannot mandate adoption.
  If the framework is not better than rolling your own, teams will roll their own.
  
  The framework became de facto because of four specific features:

1. BLOCK-LEVEL ERROR BOUNDARIES:
   The oculus.com team had a P1 incident in 2022: a CMS editor published
   a content block with a null title field. The page rendered a JavaScript error
   and showed a blank screen to all users.
   The framework's block-level error boundary catches this error.
   The page renders correctly except for the broken block, which shows a
   graceful fallback: "Content temporarily unavailable."
   When the oculus.com team learned the framework prevented this class of P1,
   they adopted it immediately.

2. FUNCTIONAL PREVIEW MODE:
   CMS editors need to see how content will look before publishing.
   At Meta, most CMS-backed pages had broken or missing preview modes.
   The framework's preview mode works: ?preview=true&previewToken=<jwt>
   returns unpublished draft content. Editors preview before publishing.
   The help center teams adopted the framework specifically for this feature.

3. TYPESCRIPT-FIRST CONTENT TYPES:
   The framework generates TypeScript types from the CMS schema.
   If a content type has a required "title" field, the generated type
   enforces that HeroSection receives a non-null title.
   At compile time — not at runtime.
   Teams using TypeScript (increasingly all of them) adopted the framework
   because it eliminated a whole category of production bugs.

4. BUILT-IN ANALYTICS:
   Every block emits "block_viewed" and "block_interacted" events.
   Content teams could answer: "Which section of the Quest 3 page gets
   the most engagement? Where do users scroll to?"
   Teams without the framework had no block-level analytics data at all.

THE RESULT:
  meta.com:      adopted → CMS team's next-gen page framework
  oculus.com:    adopted → after P1 incident (error boundaries)
  fb/ig/wa help: adopted → for preview mode
  All future CMS-backed pages at Meta: built on the framework
```

### STAR Script

```
SITUATION:
  Five teams at Meta building CMS-backed pages, each with their own integration.
  Problems: broken preview modes, page-level crashes from bad CMS entries,
  untyped content (runtime errors instead of compile errors), no block analytics.
  No shared infrastructure — the same bugs existed in five separate codebases.

TASK:
  Build a React-based CMS framework that teams would actually adopt,
  solving the shared problems without requiring a mandate.

ACTION:
  The framework is built around the ComponentMapper pattern:
  teams register a mapping of CMS content types to React components.
  The framework provides everything else: fetching, ISR, error boundaries,
  preview mode, TypeScript types, A/B testing hooks, analytics.
  
  The adoption strategy: solve the most painful problem for each team first.
  For oculus.com: block-level error boundaries (after their P1 incident).
  For help centers: functional preview mode (editors were publishing blind).
  For TypeScript teams: generated content types (compile-time safety).
  The framework solved each team's specific pain point —
  adoption followed naturally.

RESULT:
  Adopted on: meta.com, oculus.com, Facebook/Instagram/WhatsApp help centers.
  De facto framework for CMS-backed pages at Meta.
  Teams report: "The framework saved us 6 weeks of component development"
  (from the developer.oculus.com launch).
  Block-level error boundaries: eliminated the class of P1 incident that
  caused the 2022 oculus.com outage.
```

### Follow-up Q&A

**"How is your CMS framework different from a headless CMS SDK?"**
> "A headless CMS SDK (like Contentful's JavaScript SDK) handles content fetching and caching — it gives you the data from the CMS. My framework handles the rendering layer: how CMS content maps to React components, how errors are handled, how the loading state looks, how preview mode works. The CMS SDK is a library; my framework is an opinionated rendering layer built on top of it. Teams use both: the SDK fetches the content, the framework renders it. The framework is the missing piece between 'I have CMS data' and 'I have a working page.'"

**"What does the TypeScript integration look like?"**
> "The CMS has a content type definition (schema) — for example, 'Hero' has fields: title (required string), subtitle (optional string), image (required URL), cta (required object with href and label). We run a code generation step that reads the CMS schema and emits TypeScript interfaces for each content type. The ComponentMapper enforces that the React component you register for a content type accepts the correct typed props. If HeroSection expects `{ title: string; subtitle?: string; ... }` and you register it for a content type whose schema has `{ title: string | null; ... }` — that is a TypeScript error. You fix it before you ship. Previously: it was a runtime error in production, after a CMS editor published content with a null title."

---

## 3️⃣ Oculus Web Design System

### What a design system is (and is not)

```
A DESIGN SYSTEM IS NOT:
  - A collection of styled components (that is a component library)
  - A Figma file (that is a design library)
  - A style guide (that is documentation)

A DESIGN SYSTEM IS:
  - Design tokens (the single source of truth for visual decisions)
  - A component library (the implementation of those tokens in React)
  - Documentation (how to use the components correctly)
  - A process (how the system is maintained, how teams contribute, how it evolves)
  - An adoption contract (teams that use the system get consistency and maintenance;
    in exchange, they use the components as designed)

THE OCULUS WEB DESIGN SYSTEM (OWDS):
  Design tokens: colour, typography, spacing, border radius, motion.
  React components: Button, ProductCard, Badge, Navigation, MediaCarousel,
    SizeSelector, PriceDisplay, Toast, Modal, SearchBar.
  Documentation: Storybook with live playground and usage guidelines.
  Process: design reviews for new components, versioned releases.
  Adoption: 7 Oculus web surfaces.
```

### The token system — the foundation

```
WHY TOKENS MATTER:
  Without tokens: each component hardcodes its colours.
  Button has `background: #0064E0`. ProductCard has `color: #0064E0`.
  When Oculus rebrands (this happened), you grep for `#0064E0` across
  6 repositories and update every instance. Miss one = inconsistency.
  
  With tokens: components reference tokens, not raw values.
  Button has `background: var(--ow-color-primary)`.
  ProductCard has `color: var(--ow-color-primary)`.
  Rebrand: update `--ow-color-primary` in one file.
  ALL components updated automatically on the next deploy.

THE SEMANTIC LAYER:
  Primitive tokens: raw values. `--ow-blue-600: #0064E0`
  Semantic tokens: meanings.  `--ow-color-primary: var(--ow-blue-600)`
  
  Why the separation?
  The button's background is "primary action colour."
  That is a semantic meaning, not a raw colour.
  In a dark theme, primary action might still be blue.
  In a high-contrast mode, primary action might be something else entirely.
  The semantic token abstracts the colour decision.
  Components use semantic tokens, never primitive tokens.
  Themes change semantic-to-primitive mappings, never primitives directly.

THE OCULUS TOKEN SYSTEM:
  Colours: 10 semantic tokens covering: primary, pro/premium, success,
    warning, error, background, surface, text primary, text secondary.
  Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64, 96px).
  Border radius: sm(4px), md(8px), lg(12px), full(9999px).
  Typography: 6 levels from Display (40px/700) to Label (12px/600).
  Motion: duration and easing for micro-animations.
```

### Adoption — the organic spread

```
THE ADOPTION STORY:
  Created for oculus.com. Spread to 7 surfaces WITHOUT mandating adoption.
  
  WHY support.meta.com ADOPTED IT:
    Team rebuilt their support site and needed components.
    Option A: build from scratch (6-8 weeks).
    Option B: npm install @oculus/design-system.
    Option B won. The components were already built, tested, accessible,
    and documented. The barrier to adoption was deliberately kept low.
  
  WHY developer.oculus.com ADOPTED IT:
    New site launch. "We had a production-quality site in 3 hours
    because we could assemble platform components."
    Without the design system: months of component work before any
    content could go on the site.
  
  WHY oculus.com/blog AND SUBDOMAINS ADOPTED IT:
    They are part of the same design language.
    When the oculus.com team updated a component in the design system,
    the blog automatically got the update on its next deploy.
    No separate component work needed.

THE REBRAND PAYOFF:
  Oculus brand refresh (2023): Meta Reality Labs updated the visual identity.
  New primary colour, new typography weights, updated component styling.
  
  WITH THE DESIGN SYSTEM:
    1 PR to update tokens and component styles.
    All 7 surfaces got the updated brand on their next deploy.
    No coordination between teams required.
  
  WITHOUT THE DESIGN SYSTEM:
    7 PRs, 7 teams, 7 coordination meetings.
    Inevitable inconsistencies during the transition period.
    (Surface A deployed the rebrand. Surface B is still on old brand.
    User navigates between them: jarring inconsistency.)
  
  The design system's value is invisible when everything works.
  It becomes visible the moment you have a brand update, a dark mode
  launch, or an accessibility audit. One change propagates everywhere.

THE ACCESSIBILITY BENEFIT:
  Every component in the design system is accessible:
  ARIA roles, keyboard navigation, colour contrast (WCAG 2.1 AA).
  Teams that use the system get accessibility for free.
  Teams that build their own components: accessibility is their problem.
  At scale: the design system dramatically reduced the number of
  accessibility issues found in audits — not because engineers got better
  at accessibility, but because the system handled it automatically.
```

### STAR Script

```
SITUATION:
  Multiple Oculus web surfaces — oculus.com, subdomains, developer site, support site —
  were each building their own components independently.
  A "Buy Now" button on oculus.com looked different from the "Buy Now" button
  on the accessories subdomain. Both were built by different engineers,
  neither matching the latest Figma spec from the design team exactly.
  
  The consequences: brand inconsistency, accessibility gaps,
  and months of coordinated work for any design system update.

TASK:
  Create a centralised React component library (the Oculus Web Design System)
  that would become the standard way to build UI across Oculus web surfaces.

ACTION:
  Started with a token system: colour, spacing, typography, radius — all in CSS
  custom properties. Semantic tokens map to primitives, enabling theme support.
  
  Built 10 core components covering every recurring pattern across Oculus surfaces:
  Button, ProductCard, Badge, Navigation, MediaCarousel, SizeSelector, PriceDisplay,
  Toast, Modal, SearchBar. All components: TypeScript-strict props, WCAG 2.1 AA,
  Storybook documentation with live playground.
  
  Adoption strategy: npm install and use. No mandatory migration.
  The system spread organically to 7 surfaces because the barrier was low
  and the value was immediate.

RESULT:
  7 Oculus web surfaces using the design system.
  Brand refresh (2023): 1 PR updated all 7 surfaces.
  developer.oculus.com launched in 3 hours (not months) using design system components.
  Accessibility audits: significantly fewer component-level findings
  (accessible by default, not by individual effort).
```

### Follow-up Q&A

**"How do you handle component versioning when breaking changes are needed?"**
> "Semantic versioning. We follow semver strictly: patch for bug fixes, minor for new features, major for breaking changes. For breaking changes: we first release the new version in a major version bump. We publish a migration guide: what changed, why, how to migrate. We then run a migration sprint where we help each surface migrate (sometimes we write the PR for them). We support the old major version for 6 months after the new one is released — bug fixes backported, but no new features. The most common breaking change trigger: a component's prop API changing (renaming 'variant' to 'appearance', say). We avoid this by defining component APIs deliberately before implementation — use a TypeScript interface review to get multiple eyes on the API before building it. Changing an interface after it is adopted is expensive; getting it right the first time is cheap."

**"How do you ensure component accessibility across all surfaces?"**
> "Two ways. First: the components are built accessible once, correctly. Button has correct aria-label support, correct focus ring, correct keyboard activation. Every surface that uses Button gets that accessibility automatically — they do not have to implement it. Second: automated testing. Each component has `@testing-library/user-event` tests for keyboard navigation and focus management, and `jest-axe` for automated WCAG violation detection. If a PR introduces an accessibility regression in a component, CI fails. The accessibility tests are not optional and cannot be skipped. The payoff: when we do manual or automated accessibility audits, findings are mostly content-level issues (missing alt text, etc.) not component-level issues. The component layer is structurally correct."

---

## 🔗 Unified Narrative

> "The three pieces of work at Meta Reality Labs are connected by a single theme: infrastructure that multiplies the effectiveness of other teams.
>
> The CMS framework is the clearest example. Five teams were solving the same problem independently. My framework replaced five separate implementations with one. But here is the key: I did not mandate adoption. I built something genuinely better — block-level error boundaries that prevented a class of P1 incident, preview mode that actually worked, TypeScript content types that caught bugs at compile time — and teams adopted it because it solved their specific pain points. When adoption is voluntary and widespread, it is a signal that the solution is right, not just that you had authority.
>
> The design system follows the same pattern. Seven surfaces, one component library. The rebrand was the proof: one PR, all seven surfaces updated. Without the system: seven coordinated PRs, inevitable inconsistency during transition, weeks of engineering time. The design system makes this kind of change trivial. That is invisible value — you only notice it when you need it.
>
> The e-commerce scaling work is where the business impact is most direct. Quest 3 launch day: LCP 1.18s, Lighthouse 97, zero degraded performance incidents, origin server serving only 2% of traffic. ISR + CDN + client-side inventory + skeleton loading is the architecture. But the decisions were the hard part: knowing that inventory must be client-side (it changes too fast for static generation), knowing that cart must be in localStorage first (the round-trip is too slow for the user's perception), knowing that skeleton loading is the difference between CLS 0.02 and CLS 0.3.
>
> The through-line: I build infrastructure that makes everything above it easier, faster, and more consistent."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I built a component library" | "I created the Oculus Web Design System — token system first, then components built on tokens. 7 surfaces. Brand rebrand = 1 PR." |
| "I built a CMS integration" | "I built a React CMS FRAMEWORK — ComponentMapper, block-level error boundaries, preview mode, typed content, analytics built-in. It became the de facto standard at Meta because teams chose it, not because they were told to." |
| "I worked on performance" | "ISR + CDN: origin serves < 2% of Quest launch day traffic. LCP 1.18s (target < 2.5s). Inventory split: static page loads at CDN speed, client checks real-time stock. Skeleton loading: CLS 0.02." |
| Skip the "de facto" story | "The framework spread to meta.com, oculus.com, FB/IG/WA help centers WITHOUT mandate. Each team adopted for a specific reason: error boundaries (oculus P1), preview mode (help centers), TypeScript safety (meta.com). Organic adoption = genuinely better." |
| "I was Tech Lead" (vague) | "Tech lead = technical decision authority + cross-functional coordination + planning horizon. Quest 3: 4 months from announcement to launch. Re-architected product pages (SSR → ISR) in that window." |

---

## 📊 Quick Facts

```
Company:  Meta (Reality Labs division)
Products: oculus.com (primary e-commerce), VR/AR hardware lineup

E-Commerce Tech Lead:
  Scaling:    ISR + CDN → origin serves < 2% of launch day traffic
  Inventory:  Client-side real-time check (SWR, 30s refresh) — static page + dynamic stock
  Cart:       localStorage first → async server sync → instant UX, session resilient
  Skeletons:  All dynamic regions — CLS 0.02 (target < 0.1)
  Metrics:    LCP 1.18s, INP 42ms, CLS 0.02, Lighthouse 97/100

CMS Framework:
  Pattern:    ComponentMapper — teams register CMS type → React component mapping
  Framework:  Fetching, ISR, block-level error boundaries, preview mode, TS types, analytics
  Surfaces:   meta.com, oculus.com, facebook.com/help, instagram.com/help, whatsapp.com/faq
  De facto:   Adopted WITHOUT mandate — better error handling + preview mode + TS safety
  Key win:    Block-level error boundaries eliminated P1 class (bad CMS entry ≠ page crash)

Oculus Web Design System:
  Tokens:     Semantic over primitive — rebrand = 1 file change
  Components: 10 components, TypeScript-strict, WCAG 2.1 AA, Storybook
  Surfaces:   7 Oculus web surfaces
  Payoff:     Brand refresh 2023 = 1 PR → all 7 surfaces updated on next deploy
  Adoption:   Organic (npm install + use) — no mandate, low barrier
```

---

*Document last updated: June 2026 · Meta Reality Labs / oculus.com interview preparation*
