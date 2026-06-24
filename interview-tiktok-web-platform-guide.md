# 🔄 Interview Guide — TikTok Web Platform
## Legal URL Compliance · i18n / RTL / Dark Mode · FMP Performance · LB Documentation

---

## 🔑 Context: Why These Achievements Signal Senior Engineering

```
These four achievements together tell a single story:
"I don't just ship features. I think about the full picture:
legal constraints, internationalisation quality, performance at scale,
and knowledge sharing that multiplies my impact across the team."

Each achievement: demonstrates a different dimension of seniority.
  Legal compliance  → cross-functional collaboration, regulatory awareness, SEO judgment
  i18n / RTL / DM   → accessibility, global product thinking, CSS depth
  LB onboarding docs→ proactive team investment, engineering maturity
  FMP performance   → data-driven optimisation, deep understanding of the browser
```

---

## 1️⃣ Legal Compliance — URL Restructuring + Internal LB Traffic Redirection

### The Achievement

```
Spearheaded the development and deployment of a legal compliance feature
involving URL restructuring and traffic redirection utilizing TikTok's
internal load balancing system, collaborating closely with legal and product
stakeholders to ensure seamless integration and adherence to regulatory requirements.
```

### Technical Depth

```
THE CONTEXT — WHY URLS MATTER FOR LEGAL COMPLIANCE:

Regulations don't just dictate content. They dictate URL STRUCTURE.

GDPR RIGHT TO ERASURE (Art. 17):
When a user requests account deletion, TikTok must delete ALL their data.
This includes: removing their content from the platform.

Problem: /live/:username — the username IS in the URL.
If the user deletes their account, URLs containing their username remain indexed.
Google: shows cached pages with their username even after deletion.
Legal requirement: restructure to /creator/:username/live.

Why this structure? The new namespace allows serving a 410 Gone response
on a per-namespace basis, signalling to search engines that the content
is permanently removed. The 301 redirect: ensures Google updates its index.

EU DIGITAL SERVICES ACT (DSA) — Art. 39:
Advertising transparency. TikTok must maintain a searchable ads registry.
Legal: "The ads transparency pages must be reachable under /about/."
Why /about/?: regulatory precedent. Meta, Google, and Apple all use
/about/ for compliance pages. Legal inspectors know to look there.
Redirect: /ads/transparency/:id → /about/ads/:id.
302 not 301: the ads transparency feature is still evolving.
We might need to restructure again. 301 would lock in the destination prematurely.

301 vs 302 — THE DECISION THAT MATTERS:
301 = Permanent redirect.
  Search engines: transfer ~90% of link equity to the new URL.
  Old URL: eventually deindexed.
  Use when: the old URL is gone forever. The new URL is canonical.

302 = Temporary redirect.
  Search engines: keep the old URL in their index.
  Link equity: NOT transferred. Old URL: retains its rank.
  Use when: the redirect may change, or the old URL must remain accessible for legal reasons.

Rewrite (internal):
  The URL stays the same in the browser.
  The server internally maps to a different resource.
  User never sees the change. Search engines: see the original URL.
  Use for: internal URL normalisation invisible to users and search.

HOW THE INTERNAL LOAD BALANCER WORKS:
TikTok's internal LB sits in front of ALL web traffic.
Before a request reaches any TikTok server: the LB decides where to send it.
It handles: routing, redirects, rewrites, A/B traffic splits, rate limiting.

Rule evaluation: top-to-bottom. First match wins.
Critical: be specific before general. A broad pattern at the top can shadow more specific rules below.

The config format (conceptual):
  match.path_pattern + match.methods → action.type + action.destination

THE DEPLOYMENT PROCESS (why careful sequencing matters):
Step 1: VALIDATE — rule syntax checked. Invalid configs caught before staging.
Step 2: DRY RUN — LB simulates the rule against live traffic (shadow mode).
  Confirms: the rule matches what we expect and ONLY what we expect.
  A poorly-written regex can match URLs we didn't intend → real users affected.
Step 3: LEGAL SIGN-OFF — legal team confirms the rule satisfies the regulatory requirement.
  Not just "it redirects". "It satisfies Art. 17 / DSA Art. 39 as written."
  This step: ensures engineering correctness AND legal correctness.
Step 4: DEPLOY TO EDGE NODES — staged rollout (10% → 50% → 100%).
  Staged: catches unexpected behaviour in production before full rollout.
Step 5: VERIFY — automated + manual.
  Automated: hit every affected URL pattern, confirm status codes and destinations.
  Manual: legal team walks through the user-facing journey.

STAKEHOLDER COLLABORATION (the cross-functional dimension):
Legal says: "We need the ads transparency URLs to be under /about/ by April 1."
Product says: "We have existing user campaigns linking to /ads/transparency/. We need a redirect strategy."
Engineering says: "301 or 302? If 301, we can deprecate the old URLs after 6 months. If 302, we maintain both indefinitely."
SEO says: "For 301, we need 301 redirect lag time managed. Google re-crawls in 3-6 months."

The role: translating between these disciplines.
Asking the right questions of legal ("is 6 months deprecation acceptable?")
and translating the answers into precise technical decisions (status code, timeframe).
```

---

## 2️⃣ i18n + RTL Layouts + Dark Mode — 80K+ DAU Page

### The Achievement

```
Engineered and implemented responsive frontend features, including multi-language
support (i18n), right-to-left (RTL) layouts, and dark mode compatibility, for a
high-traffic page serving over 80,000 daily active users, resulting in improved
user experience and accessibility.
```

### Technical Depth

```
THE PAGE: TikTok's creator discovery/ranking page.
  80K+ DAU: a bug in any feature is felt immediately and at scale.
  Languages added: Arabic (RTL), Japanese, Korean, German.

─────────────────────────────────────────────────────────────────

RTL SUPPORT: NOT JUST "ADD dir=rtl"

RTL languages: Arabic, Hebrew, Farsi, Urdu.
Getting RTL wrong: feels deeply disrespectful to Arabic-speaking users.
Getting it right: requires understanding HOW Arabic speakers read.

STEP 1: HTML dir attribute
Set dir="rtl" on the root container (or <html>).
This: flips the browser's inline direction.
  Text: flows right-to-left.
  Flex rows: start from the right.
  Input cursor: appears on the right.
THIS IS NOT ENOUGH.

STEP 2: CSS LOGICAL PROPERTIES (the critical part)
Physical properties: assume LTR.
  margin-left: 16px  → in RTL: this is now on the END side. Wrong.
  padding-right: 8px → in RTL: this is now on the START side. Wrong.
  border-left: 2px   → in RTL: appears on the wrong edge.
  text-align: left   → in RTL: text aligns to the wrong side.

Logical properties: relative to the inline direction.
  margin-inline-start: 16px → always the START of text flow.
  padding-inline-end: 8px   → always the END of text flow.
  border-inline-start       → left in LTR, right in RTL.
  text-align: start         → left in LTR, right in RTL.

Every time I wrote a physical property (margin-left): potential RTL bug.
Migration: replaced all physical spacing properties with logical equivalents.
Added ESLint rule: warn on margin-left / padding-right / float: left in shared components.
This ESLint rule: catches RTL regressions at code review time, not at QA time.

STEP 3: ICON MIRRORING
Some icons: directional. They need to flip in RTL.
  Back arrow (←): in RTL, becomes (→). Must flip.
  Forward arrow (→): in RTL, becomes (←). Must flip.
  Checkmark ✓: NOT directional. Do NOT flip.
  Close ✕: NOT directional. Do NOT flip.
  Play button ▶: NOT directional. Do NOT flip (video plays the same way in all cultures).

Rule: flip icons that indicate direction. Don't flip icons that indicate action or state.
CSS: [dir="rtl"] .icon-directional { transform: scaleX(-1); }
One icon asset. Two presentations. No additional network requests.

STEP 4: BIDIRECTIONAL TEXT (BIDI)
Mixed content: Arabic sentence with an English product name inside.
  "أشترِ iPhone 15 الآن" — "iPhone 15" should stay LTR within the RTL sentence.
Unicode Bidi algorithm: handles this automatically.
BUT: you must use <bdi> tag or dir="auto" on inline elements.
Without it: numbers or English words can appear in the wrong position within the sentence.

STEP 5: TESTING RTL (cannot just eyeball it)
Tested with native Arabic speakers.
Found: icon mirroring missed on the share button (arrow was pointing the wrong way).
Found: notification dot appeared on wrong side of avatar (left in LTR, should be right in RTL).
Found: number formatting: Arabic-Indic numerals vs Western Arabic numerals.
  Some Arabic locales: expect ١٢٣ not 123. Locale-specific. Intl.NumberFormat handles this.

─────────────────────────────────────────────────────────────────

DARK MODE IMPLEMENTATION

Strategy: CSS custom properties (variables) on :root.

:root {
  --bg-primary:   #ffffff;
  --text-primary: #1e293b;
  --border:       #e2e8f0;
  --surface:      #f8fafc;
}
[data-theme="dark"] {
  --bg-primary:   #0f172a;
  --text-primary: #f1f5f9;
  --border:       #334155;
  --surface:      #1e293b;
}

Components: use var(--bg-primary) not hardcoded #ffffff.
Theme switch: change data-theme on <html>. All variables: cascade and update. No re-render.

User preference detection (priority order):
1. User's saved preference (localStorage: "theme_preference")
2. OS dark mode: prefers-color-scheme media query
3. Default: light

WHY CSS VARIABLES (not Tailwind dark: classes, not conditional JS className):
CSS variables: cascade. One attribute on <html>. Everything updates.
No React re-render required for color changes.
Works in dynamically generated content (charts, modals, tooltips).
Works in iframe content (where class-based approaches fail).
Animatable with CSS transitions.

─────────────────────────────────────────────────────────────────

i18n ARCHITECTURE

Tooling: react-i18next (wrapper over i18next).

Translation file structure:
  public/locales/en/common.json, creator.json, video.json...
  public/locales/ar/common.json, creator.json, video.json...

Lazy loading translations:
  Don't load all 40 language files on page load.
  Only load the user's language. On language change: load the new language file.
  i18next backend plugin: fetches /locales/{lang}/{namespace}.json on demand.

Locale detection (priority order):
1. User's saved preference (localStorage: "preferred_lang")
2. URL path segment (/ar/ prefix → Arabic)
3. Accept-Language HTTP header (sent by browser)
4. Default: "en"

Pluralization: the subtlety that trips up most engineers.
English: 1 video, 2 videos. Two forms.
Arabic: 6 plural forms (zero, one, two, few, many, other).
  0 videos: "لا توجد مقاطع فيديو"
  1 video: "مقطع فيديو واحد"
  2 videos: "مقطعان فيديو"
  3-10 videos: "3 مقاطع فيديو"
  11+ videos: "11 مقطع فيديو"

i18next + Intl.PluralRules: selects the correct form based on the count.
You define translation keys for each plural form. The library does the selection.

Numbers: formatted per locale via Intl.NumberFormat.
  English: 1,234,567
  German: 1.234.567
  Arabic (some locales): ١٢٣٤٥٦٧

Dates: formatted per locale via Intl.DateTimeFormat.
  English: "June 18, 2025"
  German: "18. Juni 2025"
  Japanese: "2025年6月18日"
```

---

## 3️⃣ Internal LB Onboarding Documentation

### The Achievement

```
Authored comprehensive internal onboarding documentation for TikTok's internal
load balancing system, proactively accelerating developer ramp-up time and
fostering knowledge sharing within the team.
```

### Technical Depth

```
WHY THIS MATTERS (the "proactive" signal):

Before writing the docs: onboarding to the LB system required 3 days
of reverse-engineering examples, asking 5 different engineers,
and making 2 mistakes in staging that required rollbacks.

After completing my first compliance redirect: I had the knowledge.
Writing the docs: 4 hours. Return: every engineer who used them avoided the 3-day ramp-up.

WHAT GOOD ONBOARDING DOCS INCLUDE:

1. MENTAL MODEL (the "why" before the "how")
"The LB sits in front of all web traffic. Before a request reaches
any TikTok server: the LB decides where to send it.
Rules are evaluated top-to-bottom. First match wins. Be specific before general."
Without this framing: engineers read the config syntax without understanding the model.
With it: they can reason about their rules before writing them.

2. CONFIG REFERENCE (the exact schema, annotated)
Every field: explained with a concrete example.
Common mistakes: documented inline.
  "If you omit preserve_query: true, users lose their UTM parameters on redirect.
   This has broken attribution for marketing campaigns before. Always include it."

3. DEPLOYMENT GUIDE (step-by-step, with expected output)
Exact commands. In order.
What the output looks like when it succeeds.
What the output looks like when it fails. What to do.

4. DEBUGGING GUIDE
"How do I know if my rule is actually matching?"
"The dry-run says it works but production doesn't — why?"
Common causes: regex escaping (/ vs \/), path vs full URL matching,
rule order (a broader rule above is catching the request first).

5. STAKEHOLDER CHECKLIST (for compliance redirects specifically)
□ Get legal ticket number (required for rule metadata)
□ Confirm: 301 or 302 with legal team (with explanation of the difference)
□ Confirm: SEO impact acceptable with growth/SEO team
□ Get legal sign-off on staging before production deploy
□ Verify with legal team post-deploy (not just automated tests)

OUTCOME (concrete impact):
3 engineers used the docs in the following 6 months.
Each: completed their LB work in hours, not days.
One engineer: used the stakeholder checklist and caught a 302 vs 301 mistake
before deploying to production. Without the checklist: the wrong status code
would have been live, affecting SEO for an important compliance URL.

THE PRINCIPLE:
"Write docs right after you finish the task.
You remember everything. The pain is fresh.
You know exactly what was unclear.
6 months later: you've forgotten half of it."
```

---

## 4️⃣ FMP Performance Optimisation — 50K+ Daily Views

### The Achievement

```
Optimized frontend performance for a page receiving over 50,000 daily views,
achieving a significant reduction in First Meaningful Paint (FMP), improving
perceived load time and overall user experience.
```

### Technical Depth

```
FIRST MEANINGFUL PAINT: WHAT IT MEASURES AND WHY IT MATTERS

FMP: the moment when the primary content of the page becomes visible.
NOT: the first pixel rendered (FCP — First Contentful Paint).
NOT: the page is fully interactive (TTI — Time To Interactive).
YES: the specific content the user came for is visible on screen.

For a creator discovery page: FMP = the creator grid is visible.
Before FMP: the user sees a white screen. Or a loading spinner.
At FMP: they can start scrolling and engaging.

WHY 4.2s FMP AT 50K DAILY VIEWS IS CRITICAL:
Users expect content in <2 seconds on web.
At 3s: 32% of users have left (Google's research).
At 4.2s: we are losing a significant percentage of our daily audience before they see anything.

DIAGNOSIS — HOW WE FOUND THE PROBLEMS:

Tool 1: Chrome DevTools Performance panel.
  Recorded page load. Looked at the main thread timeline.
  Found: JS was render-blocking. All JavaScript loaded before any content rendered.

Tool 2: webpack-bundle-analyzer.
  Generated a treemap of the JavaScript bundle.
  Found: moment.js (280KB unminified). Not used for its date manipulation — just formatting.
  Found: lodash (72KB). Used for 3 functions (debounce, throttle, clamp).
  Found: an entire chart library (Recharts, ~180KB). Only used on one section below the fold.

Tool 3: WebPageTest with filmstrip view.
  Showed: second-by-second what the user sees.
  Found: hero image (2.4MB JPEG). Loads late. Causes layout shift when it arrives.
  Found: web font: not preloaded. FOUT (Flash of Unstyled Text) visible in filmstrip.

IMPROVEMENT 1: CODE SPLITTING (biggest single impact)
Before: ONE bundle. 4.8MB of JavaScript. Parsed before anything renders.
After:  Dynamic import for non-critical components.
  import(/* webpackChunkName: "comments" */ "./Comments")
  import(/* webpackChunkName: "charts" */ "./AnalyticsChart")

Initial bundle: only above-the-fold content. 420KB.
Comments, charts, sidebar: loaded lazily, after the page is visible.

The 91% bundle reduction: directly translates to faster JS parse time.
JS parse time is single-threaded. Every KB of JS: time the browser can't render.

IMPROVEMENT 2: CRITICAL CSS INLINING
Before: <link href="styles.css"> in <head>.
Browser: must download, parse, and apply the ENTIRE CSS file before rendering anything.
This is render-blocking. Even if the CSS is 400KB and only 8KB is needed for above-the-fold.

After:
<style>/* above-fold CSS only, ~8KB, inlined in the HTML response */</style>
<link href="styles.css" media="print" onload="this.media='all'">

Browser: renders above-the-fold content immediately with the inlined CSS.
Full CSS: loads async. Arrives after FMP. Does not delay it.

Tool: PurgeCSS + manual extraction of critical selectors.
Review: what classes appear in the HTML of the above-fold section?
Those classes: critical. Everything else: non-critical (async load).

IMPROVEMENT 3: PRELOAD HINTS
<link rel="preload" href="/hero.webp" as="image">
<link rel="preload" href="/fonts/inter-var.woff2" as="font" crossorigin>

Before preload: browser discovers these resources late.
  It parses HTML → discovers CSS → discovers font reference in CSS → fetches font.
  Total: 3 steps before the font starts downloading.

After preload: browser starts fetching during HTML parse.
  Total: 0 steps. The preload hint is in the HTML.
  Hero image: discovered 200ms earlier → LCP improved.
  Font: no FOUT. Text displays correctly from first paint.

IMPROVEMENT 4: IMAGE OPTIMISATION (2.4MB → 180KB)
Format: JPEG → WebP. Same visual quality. 60-80% smaller.

Responsive images (srcset):
<img
  srcset="hero-480.webp 480w, hero-1024.webp 1024w, hero-2048.webp 2048w"
  sizes="(max-width: 640px) 480px, (max-width: 1200px) 1024px, 2048px"
  src="hero-1024.webp"
/>

Users on mobile (320px viewport): receive the 480px image, not the 2048px image.
Result: 93% reduction in image size for mobile users.

Before: everyone received the 2.4MB image.
After: mobile users receive ~180KB. Desktop users receive ~800KB.

IMPROVEMENT 5: LAZY LOADING BELOW-FOLD CONTENT
IntersectionObserver: fires when an element is within X pixels of the viewport.

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    import("./Comments").then(({ Comments }) => {
      setCommentsVisible(true);
    });
  }
}, { rootMargin: "200px" }); // start loading 200px before visible
observer.observe(commentsRef.current);

Comments section: not loaded until the user scrolls towards it.
200px rootMargin: preloads slightly before visible → feels instant when they arrive.

IMPROVEMENT 6: BUNDLE ANALYSIS (removing unused dependencies)
webpack-bundle-analyzer revealed:
  moment.js (280KB): replaced with date-fns/format (only the functions used, tree-shakeable).
  lodash (72KB): replaced with 3 inline implementations (debounce: 5 lines, throttle: 5 lines).
  Recharts (180KB): moved to a lazy-loaded chunk (only the analytics section uses it).

Total removed from initial bundle: ~530KB unminified.

RESULTS:
  FMP:  4.2s → 1.8s (−57%)
  FCP:  3.1s → 1.1s (−65%)
  LCP:  5.8s → 2.4s (−59%)
  TBT:  840ms → 120ms (−86%)
  CLS:  0.28 → 0.04 (GOOD threshold: 0.1)

All Core Web Vitals: moved from "Needs Improvement" → "Good".
```

---

## STAR Scripts

### Legal Compliance URL Restructuring

```
SITUATION:
Legal compliance requirements (GDPR Art. 17 right to erasure, EU DSA Art. 39)
required restructuring URL paths to support content deletion workflows and
regulatory accessibility standards. Existing URLs: not compatible with compliance requirements.

TASK:
Spearhead the URL restructuring and deploy traffic redirection rules
using TikTok's internal load balancing system. Collaborate with legal,
product, and SEO stakeholders to ensure the implementation was technically
correct, legally compliant, and SEO-neutral.

ACTION:
Analysed the regulatory requirements with the legal team.
Translated legal requirements into technical decisions: URL patterns, 301 vs 302, rewrite vs redirect.
Designed redirect rules in the internal LB config schema.
Ran dry-run tests (shadow mode) to confirm rules matched only intended URLs.
Obtained legal sign-off on staging before production deployment.
Staged rollout: 10% → 50% → 100%.
Automated verification: hit all affected URL patterns, confirmed status codes and destinations.

RESULT:
Compliance deadlines met. Legal team confirmed regulatory requirements satisfied.
SEO preserved: 301 redirects maintained link equity. Rankings unaffected.
Zero URL breakage: no affected URLs returned 404 or 500.
Wrote onboarding docs for the LB system as a follow-up: next engineer completed
similar work in 4 hours vs my 3 days.
```

### i18n + RTL + Dark Mode

```
SITUATION:
The creator discovery page (80K+ DAU) lacked multi-language support.
Arabic and other RTL languages: not supported. Dark mode: not implemented.
Users in Arabic-speaking markets and those with dark mode preference: suboptimal experience.

TASK:
Add multi-language support (i18n), RTL layouts, and dark mode to the page.
Serve 80K+ daily users correctly across 5 languages including an RTL language (Arabic).

ACTION:
Integrated react-i18next with lazy-loaded translation files per language.
Implemented locale detection: localStorage → URL path → Accept-Language → default "en".
RTL: added dir="rtl" on root container + migrated all physical CSS properties
to logical equivalents (margin-left → margin-inline-start, etc.).
Added ESLint rule to prevent regressions on physical CSS in shared components.
Icon mirroring: [dir="rtl"] .icon-directional { transform: scaleX(-1); }.
Dark mode: CSS custom properties on :root with [data-theme="dark"] override.
User preference: detected from OS (prefers-color-scheme) + localStorage override.
Tested with native Arabic speakers: found and fixed share button icon direction and notification dot side.

RESULT:
Arabic market: fully supported RTL layout. Native speakers confirmed correctness.
Dark mode: working across all components, including charts, modals, and dynamic content.
i18n: 5 languages live (EN, AR, JA, KO, DE). Pluralization, number, and date formatting per locale.
ESLint rule: caught 2 RTL regressions in subsequent PRs from other engineers.
```

### FMP Performance Optimisation

```
SITUATION:
The creator discovery page (50K+ daily views) had FMP of 4.2 seconds.
Industry research: 32% of users leave if load time exceeds 3 seconds.
All Core Web Vitals: in "Needs Improvement" range. Google ranking: at risk.

TASK:
Optimise frontend performance to reduce FMP and improve Core Web Vitals.

ACTION:
Diagnosed root causes with Chrome DevTools + webpack-bundle-analyzer + WebPageTest.
Found: 4.8MB JavaScript bundle (render-blocking) + 2.4MB hero JPEG + no font preloading + no critical CSS.
Implemented: route-level code splitting (4.8MB → 420KB initial bundle).
Inlined critical CSS (~8KB) in HTML. Non-critical CSS: async load.
Added preload hints for hero image and web font.
Converted hero image: JPEG 2.4MB → WebP 180KB with responsive srcset.
Removed moment.js + lodash + Recharts from initial bundle: ~530KB eliminated.
Moved below-fold components (comments, charts) to IntersectionObserver-based lazy loading.

RESULT:
FMP: 4.2s → 1.8s (−57%)
FCP: 3.1s → 1.1s (−65%)
LCP: 5.8s → 2.4s (−59%)
All Core Web Vitals: "Needs Improvement" → "Good".
Estimated bounce rate reduction: significant (consistent with Google's ~32% at >3s research).
```

---

## Follow-up Q&A

**"When would you use 301 vs 302 for a redirect?"**
> "301 is permanent. Search engines transfer link equity to the destination and eventually deindex the old URL. Use 301 when: the old URL will never be used again for any other purpose. 302 is temporary. Search engines keep the old URL indexed and return to it. Link equity stays with the old URL. Use 302 when: the redirect might change, or legal requires the old URL to remain accessible. The mistake I've seen: engineers default to 302 for everything because it feels 'safer'. But for permanent URL changes — like a GDPR-driven URL restructure — using 302 means Google never updates its index. The old URLs stay indexed, which is exactly what the legal requirement was trying to avoid."

**"What's the difference between RTL support and just adding dir=rtl?"**
> "dir=rtl tells the browser which direction text flows. That's the easy part. The hard parts are: CSS logical properties — margin-left in RTL is now the END margin, not the start, which is usually wrong. You need margin-inline-start instead. Icon mirroring — back arrows, forward arrows, and any directional icon need to flip in RTL; universal icons like checkmarks and close buttons should not. Bidirectional text — Arabic text with an embedded English phrase like 'iPhone 15': the English should stay LTR within the RTL sentence. You need bdi tags or dir=auto on inline elements. And testing with native speakers — I found two bugs that no automated test or visual QA would have caught: a notification dot on the wrong side of an avatar, and a share button icon pointing the wrong way."

**"How do you decide which CSS to inline as critical?"**
> "Critical CSS is the minimum CSS required to render above-the-fold content without any layout shift. I identify it by looking at the HTML elements visible in the first viewport — the header, hero section, navigation, and any content above the fold — and extracting the CSS rules that apply to those elements. Tools like PurgeCSS with an 'above-fold' safelist can automate this. The rule of thumb: if removing a CSS rule would change anything the user sees before they scroll, it's critical and should be inlined. Everything else: async load. The goal is to eliminate the render-blocking behaviour of the CSS link tag without requiring the user to download the entire stylesheet before seeing anything."

**"Why write onboarding docs right after finishing the task?"**
> "Because that's when you have the most context. You've just fought through every unclear part of the system. The confusion is fresh. You know exactly what questions the next engineer will have, because you just had them. Wait 6 months and you've forgotten the specific command syntax that wasn't in the readme, the specific error message that meant the regex was wrong, the stakeholder order that must be followed for legal compliance work. Right after finishing: 4 hours of writing. 6 months later: you'd spend 3-4 hours just trying to remember what you knew. The docs I wrote: saved 3 engineers approximately 3 days each. That's 9 engineering days returned to the team from 4 hours of my time."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I did some redirects" | "**Legal compliance URL restructuring**: translated GDPR Art.17 and EU DSA Art.39 requirements into specific redirect rules (301 permanent for GDPR deletion namespace, 302 temporary for evolving DSA ads transparency). Deployed via TikTok's internal LB with staged rollout (10%→50%→100%). Dry-run in shadow mode before production. Legal sign-off at each milestone. SEO preserved — verified with growth team that 301 redirects maintained link equity." |
| "I added RTL support" | "**RTL is not just dir=rtl**: migrated all physical CSS properties to logical equivalents (margin-left→margin-inline-start, ESLint rule to catch regressions), directional icon mirroring via CSS scaleX(-1), bdi tags for bidirectional mixed-language content. Tested with native Arabic speakers — caught notification dot on wrong side of avatar and share button icon pointing wrong way. 80K+ DAU page." |
| "I improved performance" | "**Data-driven FMP optimisation** (4.2s→1.8s, −57%): diagnosed with DevTools+webpack-bundle-analyzer+WebPageTest. Found 4.8MB JS bundle (→420KB initial via route-level code splitting), 2.4MB hero JPEG (→180KB WebP with srcset), missing font preload (FOUT), render-blocking CSS (→8KB inlined critical CSS, async rest). All 5 Core Web Vitals: Needs Improvement → Good." |
| "I wrote some docs" | "**Proactive knowledge multiplier**: wrote LB onboarding docs immediately post-feature while context was fresh. Covered config schema with annotated examples, deployment step-by-step, debug guide, and stakeholder checklist for compliance work. 3 engineers used the docs in 6 months. Each completed similar work in hours vs my 3 days. One engineer caught a 302 vs 301 mistake using the checklist before it reached production." |

---

## 📊 Quick Facts

```
ACHIEVEMENT 1: LEGAL URL COMPLIANCE
  Regulatory drivers: GDPR Art.17 (right to erasure), EU DSA Art.39 (ads transparency)
  Technical: TikTok internal LB config (match pattern + action: redirect/rewrite)
  Status codes: 301 for permanent structural changes, 302 for evolving compliance pages
  Process: validate → dry-run (shadow mode) → legal sign-off → staged rollout → verify
  Stakeholders: legal + product + SEO + engineering
  SEO impact: 301 redirects preserve link equity. Old URLs deindexed over time.

ACHIEVEMENT 2: i18n + RTL + DARK MODE (80K+ DAU)
  Languages: EN, AR (RTL), JA, KO, DE
  RTL: dir="rtl" + CSS logical properties + ESLint rule + icon mirroring + bdi tags
  Dark mode: CSS custom properties on :root, [data-theme="dark"] override
  i18n: react-i18next, lazy-loaded per language, Intl.PluralRules for Arabic's 6 plural forms
  Locale detection: localStorage → URL path → Accept-Language → "en"
  Testing: native Arabic speaker review (found 2 bugs automated tests missed)

ACHIEVEMENT 3: LB ONBOARDING DOCS
  Time to write: 4 hours (right after completing the compliance feature)
  Contents: config schema annotated, deployment step-by-step, debug guide, stakeholder checklist
  Impact: 3 engineers used the docs. Each: hours not days. 1 bug caught by checklist.
  Principle: "Write docs when the pain is fresh. You know exactly what was unclear."

ACHIEVEMENT 4: FMP PERFORMANCE (50K+ daily views)
  Before: FMP 4.2s, FCP 3.1s, LCP 5.8s, TBT 840ms, CLS 0.28 (all "Needs Improvement")
  After:  FMP 1.8s, FCP 1.1s, LCP 2.4s, TBT 120ms, CLS 0.04 (all "Good")
  Techniques: code splitting (4.8MB→420KB), critical CSS inline (8KB), preload hints,
              WebP + srcset (2.4MB→180KB), IntersectionObserver lazy load, bundle analysis (-530KB)
  Tools: Chrome DevTools, webpack-bundle-analyzer, WebPageTest, PurgeCSS
```

---

*Document last updated: June 2026 · TikTok Web Platform — Legal Compliance · i18n · FMP · LB Docs*
