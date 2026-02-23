# Next.js `Link` Component — Deep Dive!

> **Chủ đề**: `next/link` — Client-side Navigation + Prefetching!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/components/link
> **Hình ảnh**: 0 diagrams trong trang gốc — TẤT CẢ sơ đồ tự vẽ!

---

## Mục Lục

1. [§1. Tổng Quan — Link Component!](#1)
2. [§2. Props — Complete Reference!](#2)
3. [§3. Prefetching — Deep Dive!](#3)
4. [§4. onClick vs onNavigate!](#4)
5. [§5. Examples — All Patterns!](#5)
6. [§6. Blocking Navigation — Advanced!](#6)
7. [§7. Tự Viết — NextLinkEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Link Component!

```
  NEXT/LINK COMPONENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Extends HTML <a> for prefetching + SPA navigation!   │
  │                                                              │
  │  import Link from 'next/link'                                │
  │  <Link href="/dashboard">Dashboard</Link>                   │
  │                                                              │
  │  WHAT IT DOES:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Client-side navigation → no full page reload!    │    │
  │  │ ② Prefetching          → load route in background! │    │
  │  │ ③ History management    → push/replace URL!         │    │
  │  │ ④ Scroll behavior      → smart scroll handling!    │    │
  │  │ ⑤ Active link detection → usePathname check!       │    │
  │  │ ⑥ Navigation blocking  → unsaved changes guard!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  <a> vs <Link>:                                               │
  │  ┌──────────────────┬────────────────┬──────────────────┐    │
  │  │                  │ <a>            │ <Link>           │    │
  │  ├──────────────────┼────────────────┼──────────────────┤    │
  │  │ Navigation       │ Full reload!   │ Client-side! ✅ │    │
  │  │ Prefetching      │ ❌ None!      │ ✅ Auto!        │    │
  │  │ History          │ Browser default│ ✅ Push/Replace!│    │
  │  │ Scroll           │ Always top!    │ ✅ Smart!       │    │
  │  │ Active state     │ Manual!        │ usePathname! ✅ │    │
  │  │ Block nav        │ onbeforeunload │ onNavigate! ✅  │    │
  │  │ Renders as       │ <a>            │ <a> too! ✅     │    │
  │  └──────────────────┴────────────────┴──────────────────┘    │
  │                                                              │
  │  NAVIGATION FLOW:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  User sees <Link href="/about">About</Link>         │    │
  │  │       │                                              │    │
  │  │       ▼ (enters viewport)                            │    │
  │  │  ① PREFETCH: Load /about route data in background!  │    │
  │  │       │                                              │    │
  │  │       ▼ (user clicks)                                │    │
  │  │  ② CHECK onNavigate → allow/block?                  │    │
  │  │       │                                              │    │
  │  │       ▼ (allowed)                                    │    │
  │  │  ③ CLIENT-SIDE NAVIGATION:                           │    │
  │  │     ├── Update URL (push or replace)                │    │
  │  │     ├── Swap RSC payload (no full reload!)          │    │
  │  │     ├── Handle scroll (maintain/top/disable)        │    │
  │  │     └── Update browser history                       │    │
  │  │       │                                              │    │
  │  │       ▼                                              │    │
  │  │  ④ New page rendered INSTANTLY! ✅                  │    │
  │  │     (data was prefetched!)                           │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Props — Complete Reference!

```
  ALL PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  href (REQUIRED):                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ String: href="/dashboard"                            │    │
  │  │ String: href="/blog/hello-world"                     │    │
  │  │ String: href="/dashboard#settings"  ← with hash!   │    │
  │  │                                                      │    │
  │  │ Object: href={{                                      │    │
  │  │   pathname: '/about',                                │    │
  │  │   query: { name: 'test' },                           │    │
  │  │ }}                                                   │    │
  │  │ → Navigates to /about?name=test                     │    │
  │  │                                                      │    │
  │  │ Dynamic: href={`/blog/${post.slug}`}                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  replace:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Default: false                                       │    │
  │  │ false → history.pushState (NEW entry in history!)   │    │
  │  │ true  → history.replaceState (REPLACE current!)     │    │
  │  │                                                      │    │
  │  │ VISUAL:                                              │    │
  │  │ replace={false}:  [Home] → [About] → [Blog]        │    │
  │  │   Back button: Blog → About → Home ✅               │    │
  │  │                                                      │    │
  │  │ replace={true}:   [Home] → [About replaced by Blog] │    │
  │  │   Back button: Blog → Home (About gone!) ✅         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  scroll:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Default: true                                        │    │
  │  │                                                      │    │
  │  │ BEHAVIOR (scroll={true}):                            │    │
  │  │ ┌────────────────────────────────────────────────┐   │    │
  │  │ │ IF new page visible in viewport → MAINTAIN pos!│   │    │
  │  │ │ IF new page NOT visible → scroll to TOP!       │   │    │
  │  │ │ Back/Forward → MAINTAIN position!              │   │    │
  │  │ └────────────────────────────────────────────────┘   │    │
  │  │                                                      │    │
  │  │ scroll={false}: NO scrolling! Stay where you are!   │    │
  │  │                                                      │    │
  │  │ Smart scroll logic:                                  │    │
  │  │ → Skips sticky/fixed elements!                       │    │
  │  │ → Skips invisible elements!                          │    │
  │  │ → Uses getBoundingClientRect!                        │    │
  │  │ → Finds first scrollable visible element!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  prefetch:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ "auto" / null (DEFAULT):                             │    │
  │  │   Static route → prefetch FULL route + all data!    │    │
  │  │   Dynamic route → prefetch PARTIAL (to loading.js!) │    │
  │  │                                                      │    │
  │  │ true:                                                │    │
  │  │   FULL prefetch for ALL routes (static + dynamic!)  │    │
  │  │                                                      │    │
  │  │ false:                                               │    │
  │  │   NO prefetching at all! (viewport OR hover!)       │    │
  │  │                                                      │    │
  │  │ WHEN IT HAPPENS:                                     │    │
  │  │ ① Link enters viewport → prefetch!                  │    │
  │  │ ② User hovers over Link → re-prefetch if expired!  │    │
  │  │ ③ Only in PRODUCTION! (disabled in dev!)             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  onNavigate:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Handler for CLIENT-SIDE navigation events!           │    │
  │  │                                                      │    │
  │  │ onNavigate={(e) => {                                 │    │
  │  │   console.log('Navigating...')                       │    │
  │  │   // Cancel navigation:                              │    │
  │  │   e.preventDefault()                                 │    │
  │  │ }}                                                   │    │
  │  │                                                      │    │
  │  │ → ONLY fires for SPA navigation!                    │    │
  │  │ → Does NOT fire for Ctrl+Click (new tab!)           │    │
  │  │ → Does NOT fire for external URLs!                  │    │
  │  │ → Does NOT fire for download links!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OTHER <a> PROPS:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ className, target, rel, download, etc.               │    │
  │  │ → ALL passed through to underlying <a> element!     │    │
  │  │ <Link href="/about" className="nav-link"             │    │
  │  │       target="_blank">About</Link>                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Prefetching — Deep Dive!

```
  PREFETCHING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  STATIC ROUTE (prefetch="auto"):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  <Link href="/about">About</Link>                    │    │
  │  │       │                                              │    │
  │  │       ▼ (enters viewport)                            │    │
  │  │  Next.js prefetches:                                 │    │
  │  │  ├── RSC payload for /about                         │    │
  │  │  ├── All data (fetch results!)                      │    │
  │  │  └── Full page ready! ✅                            │    │
  │  │       │                                              │    │
  │  │       ▼ (user clicks)                                │    │
  │  │  INSTANT navigation! (0ms data fetch!)              │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DYNAMIC ROUTE (prefetch="auto"):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  <Link href="/blog/post-123">Post</Link>             │    │
  │  │       │                                              │    │
  │  │       ▼ (enters viewport)                            │    │
  │  │  Next.js prefetches PARTIAL:                         │    │
  │  │  ├── Layout RSC payload ✅                          │    │
  │  │  ├── loading.js ✅ (skeleton!)                      │    │
  │  │  └── Page data? ❌ NOT prefetched!                  │    │
  │  │       │                                              │    │
  │  │       ▼ (user clicks)                                │    │
  │  │  Shows loading.js INSTANTLY!                         │    │
  │  │  Then fetches page data...                           │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PREFETCHING WITH PROXY REWRITES:                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Proxy rewrites /dashboard → /auth/dashboard!        │    │
  │  │                                                      │    │
  │  │ Problem: Link can't know which page to prefetch!    │    │
  │  │                                                      │    │
  │  │ Solution: Use `as` prop!                             │    │
  │  │ <Link                                                │    │
  │  │   as="/dashboard"         ← URL shown to user!     │    │
  │  │   href="/auth/dashboard"  ← actual page to fetch!  │    │
  │  │ >Dashboard</Link>                                    │    │
  │  │                                                      │    │
  │  │ → Prefetches /auth/dashboard!                        │    │
  │  │ → Displays /dashboard in URL bar!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. onClick vs onNavigate!

```
  onClick vs onNavigate:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬────────────────┬──────────────────┐    │
  │  │                  │ onClick        │ onNavigate       │    │
  │  ├──────────────────┼────────────────┼──────────────────┤    │
  │  │ Fires when       │ ANY click!     │ SPA nav only!    │    │
  │  │ Ctrl+Click       │ ✅ Fires!     │ ❌ No! (new tab)│    │
  │  │ External URL     │ ✅ Fires!     │ ❌ No!          │    │
  │  │ Download link    │ ✅ Fires!     │ ❌ No!          │    │
  │  │ preventDefault   │ Prevents click!│ Prevents nav!    │    │
  │  │ Use case         │ Analytics!     │ Block nav!       │    │
  │  └──────────────────┴────────────────┴──────────────────┘    │
  │                                                              │
  │  SCENARIOS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ Normal click:                                        │    │
  │  │   onClick ✅ → onNavigate ✅ → navigate!           │    │
  │  │                                                      │    │
  │  │ Ctrl+Click (new tab):                                │    │
  │  │   onClick ✅ → onNavigate ❌ → browser new tab!    │    │
  │  │                                                      │    │
  │  │ External URL:                                        │    │
  │  │   onClick ✅ → onNavigate ❌ → full page load!     │    │
  │  │                                                      │    │
  │  │ Download link:                                       │    │
  │  │   onClick ✅ → onNavigate ❌ → browser download!   │    │
  │  │                                                      │    │
  │  │ onNavigate e.preventDefault():                       │    │
  │  │   onClick ✅ → onNavigate ✅ → BLOCKED! ❌        │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Examples — All Patterns!

```
  COMMON PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  DYNAMIC ROUTES with template literals:                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ {posts.map((post) => (                               │    │
  │  │   <li key={post.id}>                                 │    │
  │  │     <Link href={`/blog/${post.slug}`}>               │    │
  │  │       {post.title}                                   │    │
  │  │     </Link>                                          │    │
  │  │   </li>                                              │    │
  │  │ ))}                                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ACTIVE LINK DETECTION:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                         │    │
  │  │ import { usePathname } from 'next/navigation'        │    │
  │  │                                                      │    │
  │  │ const pathname = usePathname()                       │    │
  │  │                                                      │    │
  │  │ <Link                                                │    │
  │  │   className={`link ${pathname === '/' ? 'active' : ''}`}│  │
  │  │   href="/"                                           │    │
  │  │ >Home</Link>                                         │    │
  │  │                                                      │    │
  │  │ → Requires 'use client'! (hooks!)                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SCROLLING TO #id:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <Link href="/dashboard#settings">Settings</Link>    │    │
  │  │ → Renders: <a href="/dashboard#settings">            │    │
  │  │ → Navigates to /dashboard, scrolls to #settings!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REPLACE vs PUSH:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Default: push (add to history)                    │    │
  │  │ <Link href="/about">About</Link>                     │    │
  │  │                                                      │    │
  │  │ // Replace (no new history entry)                    │    │
  │  │ <Link href="/about" replace>About</Link>             │    │
  │  │                                                      │    │
  │  │ Use replace for:                                     │    │
  │  │ → Login → redirect (don't go back to login!)        │    │
  │  │ → Filter changes (don't pollute history!)           │    │
  │  │ → Tab switches                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DISABLE SCROLL:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Link:                                             │    │
  │  │ <Link href="/#hashid" scroll={false}>                │    │
  │  │   No scroll to top!                                  │    │
  │  │ </Link>                                              │    │
  │  │                                                      │    │
  │  │ // Also works with router:                           │    │
  │  │ router.push('/dashboard', { scroll: false })        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Blocking Navigation — Advanced!

```
  BLOCKING NAVIGATION WITH onNavigate:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ARCHITECTURE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  RootLayout                                          │    │
  │  │  └─ NavigationBlockerProvider (Context!)             │    │
  │  │     ├── { isBlocked, setIsBlocked }                  │    │
  │  │     │                                                │    │
  │  │     ├── Nav (CustomLink)                             │    │
  │  │     │   └── <Link onNavigate={(e) => {               │    │
  │  │     │         if (isBlocked && !confirm('Leave?'))   │    │
  │  │     │           e.preventDefault()                   │    │
  │  │     │       }}>                                      │    │
  │  │     │                                                │    │
  │  │     └── Form                                         │    │
  │  │         ├── onChange → setIsBlocked(true)            │    │
  │  │         └── onSubmit → setIsBlocked(false)           │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① User types in form → isBlocked = true!           │    │
  │  │ ② User clicks Link → onNavigate fires!             │    │
  │  │ ③ Check isBlocked? → YES!                           │    │
  │  │ ④ Show confirm dialog: "Leave with unsaved data?"  │    │
  │  │ ⑤ User clicks "Cancel" → e.preventDefault()! 🛑    │    │
  │  │ ⑥ User clicks "OK" → navigation proceeds! ✅      │    │
  │  │ ⑦ User submits form → isBlocked = false!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  IMPLEMENTATION — 4 FILES:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① contexts/navigation-blocker.tsx                   │    │
  │  │   → createContext({ isBlocked, setIsBlocked })       │    │
  │  │   → NavigationBlockerProvider (useState)             │    │
  │  │   → useNavigationBlocker() hook                      │    │
  │  │                                                      │    │
  │  │ ② components/custom-link.tsx                        │    │
  │  │   → Wraps <Link> with onNavigate check!             │    │
  │  │   → if (isBlocked && !confirm()) e.preventDefault() │    │
  │  │                                                      │    │
  │  │ ③ components/form.tsx                               │    │
  │  │   → onChange → setIsBlocked(true)                   │    │
  │  │   → onSubmit → setIsBlocked(false)                  │    │
  │  │                                                      │    │
  │  │ ④ layout.tsx                                        │    │
  │  │   → Wrap with <NavigationBlockerProvider>            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — NextLinkEngine!

```javascript
var NextLinkEngine = (function () {
  // ═══════════════════════════════════
  // 1. ROUTER STATE
  // ═══════════════════════════════════
  var historyStack = ["/"];
  var currentIndex = 0;
  var prefetchCache = {};
  var scrollPositions = {};
  var navigationBlockers = [];
  var stats = { navigations: 0, prefetches: 0, blocked: 0 };

  // ═══════════════════════════════════
  // 2. PREFETCH ENGINE
  // ═══════════════════════════════════
  function prefetch(href, mode) {
    mode = mode || "auto";
    if (mode === false) return;

    var cacheKey = href;
    if (prefetchCache[cacheKey] && !prefetchCache[cacheKey].expired) {
      return; // already prefetched!
    }

    var isStatic = href.indexOf("[") === -1; // simplified check

    var result = {
      href: href,
      mode: mode,
      timestamp: Date.now(),
      expired: false,
      data: null,
    };

    if (mode === true || isStatic) {
      // Full prefetch!
      result.data = {
        rscPayload: "FULL RSC for " + href,
        pageData: "All fetch results for " + href,
        type: "full",
      };
    } else {
      // Partial prefetch (dynamic route)!
      result.data = {
        rscPayload: "Layout RSC for " + href,
        loadingUI: "loading.js skeleton for " + href,
        type: "partial",
      };
    }

    prefetchCache[cacheKey] = result;
    stats.prefetches++;
    return result;
  }

  // ═══════════════════════════════════
  // 3. SCROLL MANAGER
  // ═══════════════════════════════════
  function resolveScroll(scrollOption, fromPath, toPath) {
    // Save current scroll position
    scrollPositions[fromPath] = {
      x: 0,
      y: Math.floor(Math.random() * 2000),
    };

    if (scrollOption === false) {
      return {
        action: "none",
        reason: "scroll={false} — stay at current position!",
      };
    }

    // Smart scroll behavior!
    var pageVisible = Math.random() > 0.3; // simulate
    if (pageVisible) {
      return {
        action: "maintain",
        reason: "New page visible in viewport — maintain position!",
      };
    }
    return {
      action: "scrollTop",
      reason: "New page NOT visible — scroll to first visible element!",
    };
  }

  // ═══════════════════════════════════
  // 4. NAVIGATION ENGINE
  // ═══════════════════════════════════
  function navigate(href, options) {
    options = options || {};
    var replace = options.replace || false;
    var scroll = options.scroll !== false;
    var fromPath = historyStack[currentIndex];

    // Check blockers
    for (var i = 0; i < navigationBlockers.length; i++) {
      var blocker = navigationBlockers[i];
      if (blocker.isBlocked) {
        var confirmed = blocker.onBlock(fromPath, href);
        if (!confirmed) {
          stats.blocked++;
          return {
            success: false,
            reason: "Navigation blocked by: " + blocker.name,
          };
        }
      }
    }

    // Update history
    if (replace) {
      historyStack[currentIndex] = href;
    } else {
      // Remove forward history
      historyStack = historyStack.slice(0, currentIndex + 1);
      historyStack.push(href);
      currentIndex++;
    }

    // Handle scroll
    var scrollResult = resolveScroll(scroll, fromPath, href);

    // Check prefetch cache
    var cached = prefetchCache[href];
    var loadTime = cached
      ? "0ms (prefetched!)"
      : Math.floor(Math.random() * 500) + "ms";

    stats.navigations++;

    return {
      success: true,
      from: fromPath,
      to: href,
      method: replace ? "REPLACE" : "PUSH",
      scroll: scrollResult,
      cached: !!cached,
      cacheType: cached ? cached.data.type : "none",
      loadTime: loadTime,
      historyLength: historyStack.length,
      currentIndex: currentIndex,
    };
  }

  // ═══════════════════════════════════
  // 5. ONCLICK vs ONNAVIGATE RESOLVER
  // ═══════════════════════════════════
  function resolveClickEvent(href, eventType) {
    var scenarios = {
      "normal-click": {
        onClick: true,
        onNavigate: true,
        action: "SPA navigation!",
      },
      "ctrl-click": {
        onClick: true,
        onNavigate: false,
        action: "Open in new tab!",
      },
      "cmd-click": {
        onClick: true,
        onNavigate: false,
        action: "Open in new tab!",
      },
      "external-url": {
        onClick: true,
        onNavigate: false,
        action: "Full page load!",
      },
      "download-link": {
        onClick: true,
        onNavigate: false,
        action: "Browser download!",
      },
    };
    return scenarios[eventType] || { error: "Unknown event type!" };
  }

  // ═══════════════════════════════════
  // 6. ACTIVE LINK CHECKER
  // ═══════════════════════════════════
  function isActive(href) {
    var currentPath = historyStack[currentIndex];
    if (href === currentPath) return { active: true, type: "exact" };
    if (currentPath.startsWith(href) && href !== "/") {
      return { active: true, type: "partial" };
    }
    return { active: false, type: "none" };
  }

  // ═══════════════════════════════════
  // 7. NAVIGATION BLOCKER
  // ═══════════════════════════════════
  function addBlocker(name, isBlocked, onBlock) {
    navigationBlockers.push({
      name: name,
      isBlocked: isBlocked,
      onBlock: onBlock,
    });
  }

  // ═══════════════════════════════════
  // 8. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║   NEXT LINK ENGINE DEMO               ║");
    console.log("╚══════════════════════════════════════╝");

    // Prefetching
    console.log("\n── Prefetching ──");
    var p1 = prefetch("/about", "auto");
    console.log("  /about (static):", p1.data.type);
    var p2 = prefetch("/blog/[slug]", "auto");
    console.log("  /blog/[slug] (dynamic):", p2.data.type);
    var p3 = prefetch("/dashboard", true);
    console.log("  /dashboard (force full):", p3.data.type);

    // Navigation
    console.log("\n── Navigation ──");
    var nav1 = navigate("/about");
    console.log(
      "  → /about:",
      nav1.method,
      "cached:",
      nav1.cached,
      "load:",
      nav1.loadTime,
    );

    var nav2 = navigate("/blog/hello", { replace: true });
    console.log("  → /blog/hello:", nav2.method, "cached:", nav2.cached);

    var nav3 = navigate("/dashboard", { scroll: false });
    console.log(
      "  → /dashboard:",
      nav3.scroll.action,
      "(" + nav3.scroll.reason + ")",
    );

    // Active links
    console.log("\n── Active Links ──");
    console.log("  /dashboard:", JSON.stringify(isActive("/dashboard")));
    console.log("  /about:", JSON.stringify(isActive("/about")));
    console.log("  /:", JSON.stringify(isActive("/")));

    // onClick vs onNavigate
    console.log("\n── onClick vs onNavigate ──");
    var events = [
      "normal-click",
      "ctrl-click",
      "external-url",
      "download-link",
    ];
    for (var i = 0; i < events.length; i++) {
      var r = resolveClickEvent("/page", events[i]);
      console.log(
        "  " + events[i] + ":",
        "onClick=" + r.onClick,
        "onNavigate=" + r.onNavigate,
        "→",
        r.action,
      );
    }

    // Navigation blocker
    console.log("\n── Navigation Blocker ──");
    addBlocker("UnsavedForm", true, function (from, to) {
      console.log("    ⚠️ Block attempt: " + from + " → " + to);
      return false; // deny!
    });
    var blocked = navigate("/new-page");
    console.log("  Blocked:", !blocked.success, "→", blocked.reason);

    // Stats
    console.log("\n── Stats ──");
    console.log(
      "  Navigations:",
      stats.navigations,
      "Prefetches:",
      stats.prefetches,
      "Blocked:",
      stats.blocked,
    );
    console.log("  History:", JSON.stringify(historyStack));
  }

  return { demo: demo };
})();
// Chạy: NextLinkEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: `prefetch` — 3 chế độ hoạt động thế nào?

<details><summary>Đáp án</summary>

```
prefetch="auto" (DEFAULT):
  Static route → FULL prefetch!
    RSC payload + ALL data + ready to render!
  Dynamic route → PARTIAL prefetch!
    Layout + loading.js only! Page data on click!

prefetch={true}:
  FULL prefetch for EVERYTHING!
  Static AND dynamic = full data!
  → Heavy! Use only for critical pages!

prefetch={false}:
  NO prefetching at all!
  Not on viewport enter, not on hover!
  → Use for: links user rarely clicks!
  → Use for: heavy pages to save bandwidth!

TIMING:
  ① Viewport enter → prefetch triggered!
  ② Hover → re-prefetch if data expired!
  ③ Only in PRODUCTION! Dev mode = disabled!
```

</details>

---

**Câu 2**: `replace` vs default `push` — khi nào dùng replace?

<details><summary>Đáp án</summary>

```
push (default):
  history: [Home] → [About] → [Blog]
  Back button works: Blog → About → Home ✅
  → URL THÊM vào stack!

replace:
  history: [Home] → [Blog]  (About replaced!)
  Back button: Blog → Home (About BỊ XÓA!)
  → URL THAY THẾ entry hiện tại!

USE CASES for replace:
  → Login page → dashboard (don't go back to login!)
  → Filter/sort params (don't pollute history!)
  → Tab switching in same page
  → Redirect after form submission
  → OAuth callback → profile page
  → Language/locale switching
```

</details>

---

**Câu 3**: `onNavigate` vs `onClick` — tại sao cần cả hai?

<details><summary>Đáp án</summary>

```
onClick:
  → ALL click events! Mọi khi user click!
  → Ctrl+Click → onClick fires! (new tab)
  → External URL → onClick fires!
  → Download → onClick fires!
  → USE: analytics tracking, logging!

onNavigate:
  → ONLY SPA navigation!
  → Ctrl+Click → NOT fired! (browser handles)
  → External URL → NOT fired!
  → Download → NOT fired!
  → USE: block navigation! Unsaved changes guard!

WHY BOTH:
  onClick: low-level, always fires (like native <a>!)
  onNavigate: high-level, only for SPA transitions!

  Block nav example:
  <Link
    onClick={() => analytics.track('click')}  // always track!
    onNavigate={(e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()  // block SPA nav only!
      }
    }}
  />
```

</details>

---

**Câu 4**: Scroll behavior — cơ chế thế nào?

<details><summary>Đáp án</summary>

```
scroll={true} (DEFAULT):
  ① Navigate to new page
  ② Check: Is new page visible in viewport?
  ③ YES → Maintain current scroll position! ✅
  ④ NO → Scroll to top of first visible element!
  ⑤ Skip sticky/fixed elements!
  ⑥ Skip invisible elements (display:none etc!)
  ⑦ Use getBoundingClientRect to find first scrollable!
  ⑧ Back/Forward → Restore saved scroll position!

scroll={false}:
  → NOTHING happens! Stay at current position!
  → Also available in router.push('/path', { scroll: false })

WITH #hash:
  <Link href="/page#section">
  → Navigate to /page
  → Auto-scroll to element with id="section"!

USE CASES for scroll={false}:
  → Tab switching (stay at current section!)
  → Filter updates (maintain scroll position!)
  → Infinite scroll pagination links
```

</details>
