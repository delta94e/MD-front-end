# 🎬 Interview Guide — Front-End Engineer, Frame.io (Adobe)
## i18n "Go Global" · Zero-Click Auth · Premiere Pro & After Effects CEP Integration

> **Role:** React front-end engineer on Frame.io's integrations into Adobe Premiere Pro and After Effects. Led the "Go Global" internationalization initiative. Implemented zero-click authentication via Adobe IMS token exchange. Stack: React, Next.js, TypeScript, Apollo, GraphQL, react-intl, Vite, CircleCI, Storybook.

---

## 🧭 Three Core Themes

| Theme | Your one-liner |
|---|---|
| **i18n "Go Global"** | *"We made the panel accessible to creative professionals in 5 new major markets — Japan, Germany, France, Brazil, and Korea — without changing a single product feature"* |
| **Zero-click auth** | *"The panel should open and already know who you are. Asking a creative professional to log in every session is a workflow interruption we could eliminate"* |
| **CEP panel constraints** | *"A browser extension and a CEP panel feel similar. They're very different. Fixed width, Adobe themes, no browser navigation, host app communication — all constraints that shape every design decision"* |

---

## 🌐 Part 1 — i18n "Go Global" Initiative

### What the initiative was

Frame.io's integration into Premiere Pro and After Effects was English-only at launch. "Go Global" = make the panel accessible to users in:
- **Japan** (ja-JP) — huge video production market
- **Germany** (de-DE) — large European production hub
- **France** (fr-FR)
- **Brazil** (pt-BR)
- **Korea** (ko-KR)

> *"We didn't add any new product features. We opened the existing product to 5 new markets. For business, that's massive. For engineering, the challenge is: do this without embedding i18n assumptions everywhere in the codebase — because adding locale support after the fact to 400+ strings is painful."*

### Why locale detection from the host app is different

In a normal web app: read `navigator.language`.

In a CEP panel inside Premiere Pro: the panel's locale should match Premiere Pro's UI language, not the browser/OS locale.

```typescript
const hostLocale = window.__adobe_cep__
  ? JSON.parse(window.cep.utils.getSystemLocale()) // Adobe CEP API
  : navigator.language;                             // dev fallback (browser)
```

### react-intl implementation

**Lazy-loaded message bundles:**
```typescript
useEffect(() => {
  import(`../i18n/${hostLocale}.json`)
    .then(m => setMessages(m.default))
    .catch(() => import('../i18n/en-US.json').then(m => setMessages(m.default)));
  // If ja-JP.json fails to load → fallback to en-US. Never a blank panel.
}, [hostLocale]);
```

**ICU message syntax for plurals:**
```
{count, plural, one {# comment} other {# comments}}
```
Different languages have different plural rules. Japanese has only one form. Arabic has six. ICU handles all of them correctly with the same syntax.

**Date and number formatting — automatic:**
```tsx
<FormattedDate value={createdAt} month="long" day="numeric" year="numeric" />
// en-US: "June 18, 2024"
// ja-JP: "2024年6月18日"
// de-DE: "18. Juni 2024"

<FormattedNumber value={fileSizeBytes} />
// en-US: "1,234.56"
// de-DE: "1.234,56"  ← comma/period swap, automatic
```

### The "no hardcoded strings" enforcement

```javascript
// .eslintrc.js
"formatjs/no-literal-string-in-jsx": "error"
// Prevents: <button>Upload</button>
// Requires: <button><FormattedMessage id="upload.button" /></button>
// CI fails if any developer adds a hardcoded string. Enforced from day 1.
```

### CircleCI i18n pipeline

```yaml
- run: npx formatjs extract 'src/**/*.tsx' --out-file /tmp/extracted.json
- run: node scripts/check-i18n-coverage.js
# check-i18n-coverage.js:
# For every key in extracted.json: verify it exists in ALL 5 locale files.
# If ANY key is missing: CI fails. PR cannot merge.
# Translators must complete their work before the feature ships.
```

> *"We had one near-miss: a developer added an error message string, translated it for en-US, but the translation vendor hadn't delivered the Japanese version yet. The CI check caught it before merge. Without that check: Japanese users would have seen English in an error state."*

### String expansion — the layout challenge

German strings are 30-40% longer than English:
- "Upload to Frame.io" (18 chars, en-US)
- "Zu Frame.io hochladen" (21 chars, de-DE)

In a fixed-width panel (280-360px): a button sized for English text can't fit German.

**Solution:** Never use fixed pixel widths for text containers. Use flexbox, `min-content`, or `max-content` sizing. Storybook `AllLocales` story: renders every component in all 6 locales simultaneously. Chromatic visual diff in CI: catches layout breaks from string expansion before merge.

---

## 🔐 Part 2 — Zero-Click Authentication

### The UX problem it solved

**Before:** Every new Premiere Pro session:
1. Open Frame.io panel
2. See login screen
3. Click "Sign in with Frame.io"
4. Browser opens
5. Complete OAuth flow
6. Return to Premiere Pro

**~45 seconds. Breaks creative flow.** In user research: described as "frustrating" and "breaks my rhythm."

**After:**
1. Open Frame.io panel
2. Panel loads your projects

**~2 seconds. Zero user interaction.**

### How it works technically

Frame.io was acquired by Adobe in 2021. Adobe's identity system: **Adobe IMS (Identity Management Service)**. All Creative Cloud users have an IMS account. Frame.io was integrated into IMS.

**The 4-step flow:**
```
Panel mounts
  → Get Adobe IMS token (CEP provides this — user is always signed into CC)
  → POST /auth/adobe-ims { ims_token }
  → Frame.io: verify IMS token → find linked account → issue session
  → Panel loads with user's projects
```

**Implementation:**
```typescript
type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User; token: string }
  | { status: "needs_link" }  // IMS OK, no linked Frame.io account
  | { status: "error"; message: string };

function useZeroClickAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    async function attempt() {
      try {
        // Step 1: Get IMS token (CEP API — always available in the panel)
        const imsToken = await adobeIMS.getAccessToken();
        if (!imsToken) { setState({ status: "needs_link" }); return; }

        // Step 2: Exchange with Frame.io
        const session = await frameioAuth.exchangeIMS(imsToken);

        // Step 3: Done — no user interaction
        setState({ status: "authenticated", user: session.user, token: session.access_token });
      } catch (err) {
        if (err instanceof AuthError && err.code === "ACCOUNT_NOT_LINKED") {
          setState({ status: "needs_link" });
        } else {
          setState({ status: "error", message: err.message });
        }
      }
    }
    attempt();
  }, []);

  return state;
}
```

### Edge cases

| Scenario | Handling |
|---|---|
| IMS token expired | `adobeIMS.refreshToken()` → retry exchange silently |
| Frame.io session expired (mid-session) | Apollo error link: on 401 → `refreshSession()` → retry original request |
| No linked Frame.io account | "needs_link" state → show "Sign in to link your account" prompt. After linking: zero-click forever |
| User switches Adobe accounts | Host fires a "user changed" event. Panel listens → re-run auth flow → new IMS token may map to different Frame.io account |
| Panel opened offline | Detect: show cached content where available with an "offline" indicator |

> *"The needs_link state is critical UX. If a new Creative Cloud user opens the Frame.io panel for the first time: they've never linked their accounts. We show them a clear prompt: 'Sign in once, and the panel will open automatically from now on.' This first-time setup is the one click they'll ever have to make."*

---

## 🎬 Part 3 — CEP Panel: What Makes It Different

### What CEP is

Common Extensibility Platform — Adobe's extension framework. Frame.io's integration runs as a CEP extension: a Chromium WebView hosting our React app, running inside Premiere Pro/After Effects.

### The key constraints

**1. Fixed panel width (280-360px)**
No control over width. Users can resize, but we must design for the minimum. Every component: must work at 280px. String expansion: critical here.

**2. Adobe themes (dark/medium/light)**
```typescript
const theme = CSInterface.getHostEnvironment().appSkinInfo.panelBackgroundColor;
document.body.classList.add(`theme-${getThemeName(theme)}`);
// CSS custom properties: --panel-bg, --panel-text, --panel-border
// Styled components: use CSS variables — never hardcode #252525
```

**3. No browser navigation**
No address bar, no reload button. React Router hash mode (`/#/projects`) or memory router.

**4. Host app communication (ExtendScript bridge)**
```typescript
// Get the current playhead position from Premiere Pro:
csInterface.evalScript('getCurrentTimecode()', (result) => {
  const timecode = JSON.parse(result);
  setActiveTimecode(timecode); // Frame.io shows comments at this exact frame
});
// This is the core value: comment at timecode 01:24:18 → click it → Premiere jumps to that frame
```

**5. Vite HMR in CEP context**
Vite's default WebSocket HMR doesn't reach the CEP WebView. Custom Vite config: serves HMR via HTTP polling as a fallback, or configures `server.hmr.host` to point to where the CEP panel can reach it.

### Storybook as a CEP substitute

> *"Developing UI inside Premiere Pro: slow. Launch Adobe app, install extension, open panel, make a change, reload. 2-3 minute cycle. In Storybook: make a change, see it in under 1 second. We do 90% of UI development in Storybook. The integration-specific CEP parts (host communication, IMS auth): we mock those in Storybook stories."*

```typescript
// Storybook decorator: mock the CEP environment for development
const withCEPMock = (Story) => (
  <CEPContextProvider value={{ hostLocale: 'ja-JP', theme: 'dark', currentTimecode: '01:24:18;12' }}>
    <Story />
  </CEPContextProvider>
);
```

---

## ⚙️ Part 4 — Tech Stack Rationale

### Apollo + GraphQL

Frame.io's API is GraphQL-based. Key Apollo features used:

**Real-time comments via subscriptions:**
```graphql
subscription OnNewComment($assetId: ID!) {
  commentAdded(assetId: $assetId) {
    id text timecode author { name avatar }
  }
}
```
When a collaborator adds a comment: the panel updates in real-time. No polling.

**Normalised cache:** Project entity stored by ID. Project name update: automatically reflected in every view that shows that project — zero extra code.

**Precise queries (no over-fetching):** Project list needs name + thumbnail + comment count, not the comments array. GraphQL: each view requests exactly what it needs.

### Context API (why not Redux)

Three contexts:
- **Auth context:** current user, token, permissions
- **Locale context:** current locale, text direction (LTR/RTL for future Arabic support)
- **Theme context:** Adobe's dark/medium/light panel theme

> *"We used Redux on a previous project and found we were writing a lot of boilerplate for state that was simple. For a panel this size, Context + useMemo + useCallback is sufficient. If state complexity grows: we'd add Zustand. Redux is for complex, frequently-updated shared state. Our auth, locale, and theme state: rarely changes."*

### Styled Components + CSS Modules — why both

- **Styled Components:** dynamic theming (read from Context, apply at runtime)
- **CSS Modules:** component-scoped styles where dynamic theming is not needed (layout, spacing, typography)

> *"Mixing them intentionally: not inconsistency. Styled Components for anything that changes based on theme or state. CSS Modules for everything static. This gives clear intent: if a file uses Styled Components, you know it's doing dynamic styling."*

### Vite over Create React App / webpack

- Faster dev server (esbuild transform, not webpack rebuild)
- TypeScript: esbuild for transform speed, separate `tsc --noEmit` for type checking
- Smaller production bundles
- Better code splitting for lazy-loaded locale message bundles

### CircleCI

Jobs in sequence:
1. `type-check` — `tsc --noEmit` (no `any`, strict mode)
2. `lint-i18n` — `formatjs/no-literal-string-in-jsx` + coverage check
3. `test` — React Testing Library unit tests
4. `build-storybook` — validates component library compiles
5. `chromatic` — visual diff against baseline for all locale/theme story variants
6. `build` — production build

**Merge blocked if any job fails.** No untranslated strings in production, ever.

---

## ❓ 25 Interview Q&As

#### Q1: What is the "Go Global" initiative?
> *"An effort to open Frame.io's Premiere Pro and After Effects integrations to 5 new major markets: Japan, Germany, France, Brazil, and Korea. Before: English-only. After: 6 locales fully supported. No new product features — we opened the existing product to millions of new users."*

#### Q2: How do you detect the correct locale in a CEP panel?
> *"Read it from the host application, not the browser. CEP provides `window.cep.utils.getSystemLocale()` which returns Adobe's language setting. That's what we use. If the user has Premiere Pro in Japanese: the panel should be in Japanese — regardless of their OS or browser language."*

#### Q3: What is react-intl and why use it?
> *"react-intl is part of FormatJS — the industry standard for React i18n. It handles message IDs, ICU plural syntax, formatted dates, formatted numbers, and it integrates with the formatjs CLI for message extraction and CI coverage checks."*

#### Q4: What is ICU message syntax?
> *(Explain: `{count, plural, one {# comment} other {# comments}}` — handles all plural forms for all languages with a single syntax. Japanese has one form, English two, Arabic six.)*

#### Q5: How did you prevent hardcoded strings?
> *"ESLint rule: formatjs/no-literal-string-in-jsx as error. No PR with a hardcoded user-visible string can pass CI. The rule enforces that every string goes through FormattedMessage or useIntl().formatMessage()."*

#### Q6: How does the CI i18n coverage check work?
> *"CircleCI runs formatjs extract to get all message IDs from source, then a custom script checks that every ID exists in every locale's message file. If any key is missing in any locale: CI fails. The feature cannot ship until translators deliver."*

#### Q7: What is string expansion and how did you handle it?
> *"German strings are 30-40% longer than English. In a fixed-width panel, buttons sized for English text won't fit German. Solution: flexbox layouts instead of fixed pixel widths. Storybook AllLocales stories render every component in all 6 locales. Chromatic visual diff catches layout breaks before merge."*

#### Q8: How do you lazy-load locale message bundles?
> *"Dynamic import: `import('../i18n/${locale}.json')`. The bundle for the active locale is loaded on mount. Other locales: never loaded. If the locale file fails: graceful fallback to en-US."*

#### Q9: What is zero-click authentication?
> *"When a user opens the Frame.io panel in Premiere Pro: the panel detects their Adobe IMS identity, exchanges the IMS token with Frame.io's auth service, and loads the panel authenticated. No user interaction required."*

#### Q10: What is Adobe IMS?
> *"Adobe Identity Management Service. Adobe's OAuth 2.0 identity system. All Creative Cloud users have an IMS account. After Frame.io was acquired by Adobe, Frame.io was integrated into IMS — so IMS tokens can be exchanged for Frame.io sessions."*

#### Q11: How do you get the IMS token from within a CEP panel?
> *(Explain: `adobeIMS.getAccessToken()` — the IMS library is available in the CEP JavaScript environment. Returns the current user's access token without any user action.)*

#### Q12: What are the 4 auth states in the zero-click flow?
> *(loading, authenticated, needs_link — IMS OK but no linked Frame.io account, error — IMS acquisition failed)*

#### Q13: What does "needs_link" mean and how do you handle it?
> *"The user is signed into Creative Cloud (IMS is valid) but hasn't linked a Frame.io account yet. We show a prompt: 'Sign in to Frame.io once and the panel will open automatically from now on.' After they link: their accounts are connected. Future opens: zero-click."*

#### Q14: What happens when the Frame.io session expires mid-session?
> *"Apollo error link: intercepts 401 responses. Calls refreshSession() → gets a new Frame.io token from IMS. Retries the original request. User sees nothing. The panel just keeps working."*

#### Q15: What happens when the user switches Adobe accounts?
> *"The host application fires a 'user changed' event. The panel listens and re-runs the auth flow. New IMS token may map to a different Frame.io account. We handle the transition gracefully: clear current state, show loading, re-authenticate."*

#### Q16: What is a CEP panel?
> *"Common Extensibility Platform — Adobe's extension framework. Our React app runs in a Chromium WebView inside Premiere Pro or After Effects. We get JavaScript access to CEP APIs for host communication, and our app behaves like a web app otherwise."*

#### Q17: What's the biggest constraint of a CEP panel for front-end development?
> *"Fixed panel width. Users can resize but there's a minimum we have to design for (~280px). Every component must work at 280px. Combined with string expansion in German: this creates real layout challenges that browser-first development wouldn't surface."*

#### Q18: How did you communicate with Premiere Pro from the panel?
> *"CEP's evalScript API: sends JavaScript to the host application's ExtendScript runtime. We used it to read the current timeline timecode. When the user scrubs the timeline: we receive the timecode and highlight comments at that frame. That's the core Frame.io value in Premiere Pro."*

#### Q19: How did you use Storybook for CEP development?
> *"As a substitute for Premiere Pro in development. Opening an Adobe app for every UI change: 2-3 minute cycle. In Storybook: sub-second. We mocked the CEP APIs (IMS, host communication) in Storybook decorators. 90% of UI development: done in Storybook."*

#### Q20: Why Apollo specifically?
> *"Frame.io's API is GraphQL-based. Apollo's normalised cache: project entity stored by ID, so any view that shows the same project updates automatically on mutation. Subscriptions: real-time comments without polling — essential for a collaboration tool."*

#### Q21: Why Vite over webpack?
> *"Dev server startup: milliseconds instead of seconds. HMR: fast module-level updates. For a CEP panel where reload means re-launching the WebView: faster HMR saves significant development time. Also: better code splitting for lazy-loaded locale bundles."*

#### Q22: How did you handle Adobe's panel themes (dark/medium/light)?
> *"Read the active theme from the CEP host environment on mount. Set a CSS class on the body. All colours: defined as CSS custom properties per theme. Styled Components: read the CSS variables. Never hardcode colour values — always reference a custom property."*

#### Q23: Why Context API over Redux?
> *"State complexity: auth, locale, theme. Three rarely-changing global values. Redux would add boilerplate for no benefit. Context + useMemo: sufficient. If state became more complex (frequent updates, complex derived state): we'd add Zustand or Redux Toolkit. Use the simplest tool that fits."*

#### Q24: How did you test the i18n implementation?
> *"Three layers: unit tests (React Testing Library — render in ja-JP locale, assert Japanese text appears), Storybook AllLocales stories (visual), and Chromatic visual diff in CI (automated regression for every locale/theme combination). The Chromatic diff is the most powerful — it catches layout breaks from string expansion automatically."*

#### Q25: What's the most important thing you learned from the "Go Global" project?
> *"Start with i18n from the beginning. We were retrofitting i18n onto an existing codebase — finding hardcoded strings everywhere, discovering that some layouts assumed short English labels. The ESLint rule and the CI coverage check are the two things I'd add to any new project from day one: prevent the problems instead of fixing them."*

---

## 🎤 Opening Statement (60 seconds)

> *"I was a front-end engineer at Frame.io, working on their integrations into Adobe Premiere Pro and After Effects. These integrations are React apps that run as panels inside Adobe's host applications — which creates unique constraints: fixed panel width, Adobe's three colour themes, no browser navigation, and communication with the host app via CEP APIs.*
>
> *Two things I'm most proud of: leading the internationalization effort called 'Go Global', which opened the panel to five new major markets — Japan, Germany, France, Brazil, and Korea — using react-intl, ICU message syntax, and a CircleCI pipeline that prevents any untranslated string from shipping. And implementing zero-click authentication — when a user opens the Frame.io panel in Premiere Pro, the panel detects their Adobe IMS identity and loads already authenticated, with no user action required.*
>
> *The stack was React with hooks, TypeScript, Apollo and GraphQL for real-time collaboration features, react-intl for i18n, Vite for builds, and Storybook heavily for developing UI without needing to launch Premiere Pro for every change."*

---

## 📎 Demo Tab in App

Live at: **🎬 Frame.io (Adobe)** tab.

- **🌐 Go Global i18n** — Live locale switcher (6 languages), real-time message preview, string expansion visualizer, plural rules demo
- **🔐 Zero-Click Auth** — Before/after UX comparison (45s→2s), animated 4-step IMS exchange with success/needs-link/error scenarios
- **🎬 Panel Preview** — Realistic Frame.io panel mock inside simulated Premiere Pro window, switchable locale and auth state
- **⚙️ Tech Stack** — Apollo subscriptions code, CircleCI i18n pipeline, Storybook locale stories pattern
