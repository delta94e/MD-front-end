# 🏡 Interview Guide — Listings Platform & Micro-Frontend Architect
## Tech Lead / Architect — Listings Applications · "Federation One" Framework · CSS Modules Refactor

> **Role:** Tech Lead / Architect for the Listings Platform. Led the frontend architecture and development for Listings applications, enhancing user experience across multiple client platforms. Designed the custom "Federation One" micro-frontend framework, adopted by 17 engineering teams to enable independent module development. Addressed technical debt by modularizing legacy components and migrating styling to CSS Modules, significantly improving system maintainability and web performance.

---

## 🧭 Four Core Themes

| Theme | Your one-liner |
|---|---|
| **Listings Catalog Platform** | *"A listings marketplace requires fast initial page load and smooth interactions. Decoupling the search layout from auxiliary elements kept page load under 300ms."* |
| **"Federation One" Framework** | *"We designed Federation One to allow 17 product teams to build and deploy independent micro-frontend apps on their own release schedules, without breaking the host shell runtime."* |
| **CSS Modules Refactor** | *"Global CSS in micro-frontends is a ticking time bomb. Class name collisions cause silent visual regressions; migrating to scoped CSS Modules hashes resolved style bleeding permanently."* |
| **Governance & Adoption** | *"Scaling architecture to 17 teams requires guardrails, not checklists. By writing automated package singleton validators in CI pipelines, we made it impossible for teams to ship duplicate dependencies."* |

---

## 🏠 Part 1 — Listings Applications Platform

### The Challenge
- The Listings catalog application is the core of the business. It must load quickly, adapt to mobile/desktop layouts, and support rich features (like search, dynamic sorting, maps, and bookmarking).
- **The problem:** Legacy architecture compiled everything into a single monolithic bundle. A minor style update to the Checkout form required building and deploying the entire listings marketplace, causing release bottlenecks.

### Architectural Decisions
1. **Vertical Slice Architecture:** Broke the monolithic listings page into independent micro-frontends (Listing Details, Image Gallery, Pricing & Bookings, User Reviews) compiled as separate federated modules.
2. **Intersection Observer Lazy-Loading:** Designed the catalog cards list to load dynamically only when scrolled into the viewport, reducing initial DOM footprint by **60%**.

---

## 🔌 Part 2 — "Federation One" Micro-Frontend Framework

### Why Federation One?
Instead of hardcoding Webpack Module Federation scripts for every app, we designed **Federation One**, a unified shell framework that handles:
1. **Dynamic Module Resolution:** Resolves remote entry points dynamically at runtime based on environment descriptors (JSON configs) rather than hardcoded configurations.
2. **Shared Singleton Scope:** Maps React, react-dom, and common utility libraries as host-provided singletons. Remote components load in **0ms** since they reuse the host's existing JS memory context.
3. **Graceful Degradation:** If a remote MFE (like the User Reviews service) fails or times out, the host intercepts the script error and renders a mock skeleton card, keeping the main Listings interface functional.

---

## 🎨 Part 3 — Resolving Styling Debt: Global CSS → CSS Modules

### The Style Bleed Problem
- With 17 teams deploying modules independently, global SASS stylesheets clashed constantly.
- **Example:** The Reviews team deployed a class `.title { color: red; }` which overrode the Listings team's `.title { color: gold; }` class because Reviews compiled later in the document body.

### CSS Modules Migration
- Led the complete refactor to CSS Modules:
  - Class selectors are parsed and hashed at compile-time: `.title` becomes `.ListingsCard_title__7e3ab`.
  - Hashed selectors are unique to each component file, preventing any style bleeding across MFEs.
- Removed legacy global stylesheet declarations, reducing total network bundle CSS weight by **48%**.

---

## 🤝 Part 4 — 17-Team Adoption and Governance

### Rollout Strategy
To coordinate adoption across 17 engineering domains:
1. **Standardized Webpack Presets:** Published a central `@listings/bundler` preset package that configures Module Federation and CSS Modules. Teams import this preset to get correct settings out-of-the-box.
2. **CI Shared Scope Validation:** Wrote a Git hook validation script that checks the team's build config. If a team mistakenly overrides a shared singleton definition (e.g. including duplicate copies of React), the build is failed in CI immediately, preventing production bundle bloat.

---

## ❓ 25 Interview Q&As

#### Q1: What is "Federation One" and why did you design it?
> *"Federation One is a custom micro-frontend orchestration framework built on top of Webpack Module Federation. It was designed to allow 17 independent engineering teams to develop, test, and deploy listings platform features on their own schedules without rebuilding or breaking the host application shell."*

#### Q2: How does Module Federation resolve shared dependencies at runtime?
> *"Webpack's Module Federation Plugin exposes a `shared` configuration field. If both the host shell and a remote MFE declare React as a shared singleton, the remote MFE's loader checks if React is already loaded in the host window memory space. If present, it reuses it, downloading 0 extra bytes."*

#### Q3: What happens if a remote MFE uses React 18, but the host is running React 17?
> *"Webpack Module Federation performs semver checks. If the versions are incompatible and cannot be resolved as a single instance, it downloads the remote's React version as a fallback, creating a separate runtime scope. To prevent this bundle bloat at Slack, we enforced version locks across all team package files using CI validations."*

#### Q4: What is dynamic remote importing in micro-frontends?
> *"Instead of hardcoding remote URLs in the webpack config at build time, we load them dynamically at runtime. The host fetches a config JSON file containing active version hashes and entry points (e.g. `listingsSearch: 'https://cdn.slack.com/search/1.4.2/remoteEntry.js'`), then injects script elements into the DOM dynamically."*

#### Q5: How did you implement graceful degradation when a remote MFE crashed?
> *"We wrapped all dynamic remote loads in React Lazy, combined with custom React Error Boundaries. If a remote entry script fails to load due to a CDN timeout or JavaScript error, the boundary intercepts the error, reports the stack trace to observability metrics, and renders a fallback UI component, preventing page crashes."*

#### Q6: Why did you migrate the listings application to CSS Modules?
> *"In a micro-frontend environment where multiple teams deploy code independently, global stylesheets are a major risk. A team can accidentally write a class name that conflicts with another team's component, causing visual style bleed. CSS Modules compiles classes to local hashes, making style collisions impossible."*

#### Q7: How does Webpack compile class names in CSS Modules?
> *"We configure the `css-loader` with localIdentName options, such as `[name]__[local]___[hash:base64:5]`. A selector named `.title` inside `ListingsCard.module.css` is compiled to `.ListingsCard_title__7e3ab` in both the compiled CSS stylesheet and the imported JS styles object."*

#### Q8: What are the main performance benefits of CSS Modules?
> *"It allows us to prune unused styles at the component level. With global CSS, styles are concatenated and must be loaded completely on page load. With CSS Modules, we split CSS files alongside their React components. CSS chunks are only downloaded when the corresponding MFE is loaded, reducing bundle weight by 48%."*

#### Q9: How did you coordinate the rollout of Federation One to 17 different teams?
> *"By focusing on developer experience. We didn't just write guidelines; we published a shared `@listings/webpack-config` npm package. Teams replaced their custom webpack configs with this single preset, which handled Module Federation, CSS Modules, and TypeScript out-of-the-box, ensuring zero setup friction."*

#### Q10: How do you prevent teams from polluting the shared global namespace in a micro-frontend shell?
> *"We enforce strict rules via ESLint and CI checks. Teams cannot modify `window` properties directly. For cross-MFE communications, they must use our typed Event Bus utility or write to shared redux slices mapped by the host shell, preserving runtime safety."*

#### Q11: What is a content security policy (CSP) challenge in micro-frontend architectures?
> *"Since MFEs load script entry points from different domains or CDN version paths, the host's CSP header must permit dynamically executing scripts from those specific URLs. We managed this by generating dynamic script hashes or maintaining a secure whitelist in our cloud infrastructure routing configs."*

#### Q12: How do you handle routing across different micro-frontend apps?
> *"We use a centralized router in the host shell. The shell maps paths (e.g. `/listings/:id` or `/checkout`) to dynamic remote loaders. When the route matches, the shell downloads the required remote MFE bundle and mounts it inside the main layout content area, handling route parameters natively."*

#### Q13: What is the role of eager loading in Webpack Module Federation?
> *"Setting `eager: true` forces a shared package to be loaded immediately during the initial host bootstrap cycle rather than being lazily requested. We set eager loading for React and react-dom in the host shell config to guarantee they are available in memory before any remote components are rendered."*

#### Q14: How do you test a micro-frontend component in isolation?
> *"We use Storybook and custom mock hosts. For each MFE package, we run a local dev server that hosts the component inside a mock container mimicking the shell's global stores. This allows developers to develop and run unit tests for their module without running the entire listings platform locally."*

#### Q15: How did you audit and resolve styling debt in your codebase?
> *"We wrote script scans that parsed our legacy SASS files to detect duplicate selectors, unused rules, and deep nested overrides. We then modularized them into component-specific `.module.css` files, deleting over 14,000 lines of legacy global SASS."*

#### Q16: How do you structure a shared component library in a federated architecture?
> *"We host a core component library as a separate shared package. The host shell registers this library as a singleton. When remote MFEs need buttons, input fields, or icons, they import them from the shared package, ensuring visual consistency and reducing bundle size."*

#### Q17: What is visual regression testing and why is it critical for listings apps?
> *"Visual regression testing captures screenshots of components in all states and compares them to reference baselines. When refactoring styles from global SASS to CSS Modules, visual regression checks (using tools like Percy) ensured that not a single pixel drifted visually for our listings catalog users."*

#### Q18: How do you manage version pinning for federated remote modules?
> *"For development and staging, we use dynamic 'latest' tags for fast iteration. For production releases, we pin the remote URLs to specific Git commit hashes in our deployment config files. This ensures that a team's code is only released to production when their pipeline explicitly updates the version pin in Git."*

#### Q19: What is the main difference between Module Federation and npm package integration?
> *"NPM packages are integrated at build time; a package update requires rebuilds of all consumer apps. Module Federation resolves imports at runtime; updating a remote module instantly updates all consumer applications without rebuilding the host shell, decoupling team deployments."*

#### Q20: How do you check for duplicate package loads in a running browser?
> *"We inspect Webpack's shared scope indicators by running `__webpack_share_scopes__` in the browser console. It outputs a tree of loaded modules, their versions, and active sources. If we see multiple versions of React, we know a MFE config has drifted and is bypassing the singleton lock."*

#### Q21: What is a chunk loading error and how does the shell handle it?
> *"A chunk loading error occurs when a client fails to download a child JS asset due to network drops or asset overrides on the CDN. We catch this error inside our dynamic loader. The loader retries the fetch three times with exponential backoff before throwing a visual error fallback card to the user."*

#### Q22: What is the benefit of a Monorepo for managing 17 micro-frontend teams?
> *"A monorepo allows all 17 teams to share lint configurations, test setups, and utility codes easily. It also facilitates code refactoring: if we make a change to a shared core API, we can search, update, and run test suites across all 17 MFE packages in a single pull request."*

#### Q23: How do you configure a dev server in a Module Federation setup?
> *"The host shell runs locally on port 3000. In development mode, the shell maps remote URLs to localhost ports (e.g. `listingsSearch: 'localhost:3001'`). Developers can run only their specific search MFE locally on port 3001 while loading all other components from the production CDN."*

#### Q24: What is an AST-based webpack plugin and did you write one?
> *"An AST (Abstract Syntax Tree) plugin parses code files into node structures. We wrote a custom validation plugin for Webpack that scans import statements. If a remote module imports a component from another remote instead of using the shared library, the plugin throws a warning to enforce clean boundaries."*

#### Q25: How does a micro-frontend architecture save engineering runtime?
> *"By isolating team boundaries. Previously, a build queue bottleneck would delay all listings releases. In the federated setup, each of the 17 teams has their own independent pipeline. A build takes 2 minutes instead of 20, and teams release code 5x more frequently."*

---

## 🎤 Opening Statement (60 seconds)

> *"I am a Frontend Architect and Tech Lead, specializing in building high-performance Listings platforms and micro-frontend architectures.
>
> In my previous role, I led the frontend architecture for our Listings applications, improving user experiences across our mobile and web client platforms. I designed and rolled out the 'Federation One' micro-frontend framework, which has been adopted by 17 engineering teams to develop and deploy features independently at runtime. By configuring shared singleton scopes for core packages, we achieved a 0ms load delay for child modules.
>
> Additionally, I addressed significant technical debt by refactoring legacy codebases, modularizing components, and implementing CSS Modules. This eliminated SASS overrides and styling conflicts, cut CSS bundle weights by 48%, and completely resolved visual regressions.
>
> To support this architecture, I built automated CI validators to prevent dependency duplication, ensuring code maintainability and high performance as the platform scaled."*

---

## 📎 Demo Tab in App

Live at: **🏡 Listings & MFE** tab.

- **🏠 Listings Catalog** — Interactive listings search catalog. Filter items by categories and toggle favorites with smooth layout updates.
- **🔌 Federation One** — Dynamic MFE loader visualizer. Click to load/unload remote modules dynamically and monitor shared singleton memory allocations.
- **🎨 CSS Modules Scope** — Visual collision sandbox. Switch between Global SASS (visual collision bleed) and Scoped CSS Modules (protected output hashes).
- **🤝 17-Team Rollout** — Adoption dashboard mapping migration milestones, version control check scripts, and bundle weights.
