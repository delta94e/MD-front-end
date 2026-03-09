# Front-End System Design — Phần 27: Mock Interview — Twitter Newsfeed — "Requirements → Mockup → State → API → Performance!"

> 📅 2026-03-09 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Mock Interview (3 lessons combined) — "35-45 minutes. Don't over-commit! Requirements: infinite stories, media, mobile+desktop, network efficient, CPU/memory efficient, offline support. Virtualization: absolute positioning + translateY + observers. Normalized state: stories, comments, attachments by ID. API: SSE + GET (not WebSocket!). Performance: HTTP/2, bundle split, Brotli, WebP, defer, virtualization, IndexedDB, Service Worker."
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Final — system design interview simulation!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | Interview Tips — "35-45 Minutes, Don't Over-Commit!" |
| 2   | Requirements — Functional & Non-Functional           |
| 3   | Mockup & Virtualization Design                       |
| 4   | Data & Sliding Window                                |
| 5   | Application State — "Normalized 2NF!"                |
| 6   | API Design — "SSE + GET, Not WebSocket!"             |
| 7   | Short Polling vs SSE Analysis                        |
| 8   | Performance Optimization — Network, Rendering, JS    |
| 9   | Q&A — Accessibility, Offline, Cache                  |

---

## §1. Interview Tips — "35-45 Minutes!"

> Evgenii: _"Very limited timeframe. You won't handle all cases. Make sure you commit to requirements you can actually complete. Don't over-commit — it won't look good."_

```
INTERVIEW FORMAT:
═══════════════════════════════════════════════════════════════

  Time: 35-45 minutes!
  Structure:
  1. Requirements (5 min)
  2. Mockup + rendering explanation (10 min)
  3. State design (5 min)
  4. API design (5 min)
  5. Performance optimization (10 min)
  6. Q&A (5 min)

  GOLDEN RULES:
  ✅ Commit only to what you can complete!
  ✅ Start with requirements!
  ✅ Simple mockup is enough!
  ❌ Don't over-commit!
  ❌ Don't try to cover everything!
```

---

## §2. Requirements — Functional & Non-Functional

```
FUNCTIONAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Stories render top to bottom
  2. Infinite number of stories
  3. Media support (images!)

NON-FUNCTIONAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Mobile + Desktop support
     → "Most social network content consumed from mobile"

  2. Network efficient
     → "User may have slow 3G connection"

  3. CPU and memory efficient
     → "Infinite list shouldn't impact CPU/memory"

  4. Offline support
     → "On plane/train, still check loaded stories"
```

---

## §3. Mockup & Virtualization Design

> Evgenii: _"Unlimited stories → implement virtualization. Register 2 observers top+bottom. Move elements to separate stacking context with absolute positioning. Use CSS transformation (GPU pipeline)."_

```
MOCKUP:
═══════════════════════════════════════════════════════════════

  ┌──── Container (position: relative) ────┐
  │  [Top Observer] ← translateY(topY)     │
  │                                         │
  │  ┌── Story 1 ──┐ ← position: absolute  │
  │  │  Title       │   translateY(y1)      │
  │  │  Content     │                       │
  │  └─────────────┘                       │
  │  ┌── Story 2 ──┐ ← translateY(y2)     │
  │  │  Title       │                       │
  │  │  Content     │                       │
  │  └─────────────┘                       │
  │  ┌── Story 3 ──┐                       │
  │  │  ...         │                       │
  │  └─────────────┘                       │
  │  ┌── Story 4 ──┐                       │
  │  │  ...         │                       │
  │  └─────────────┘                       │
  │                                         │
  │  [Bottom Observer] ← translateY(botY)  │
  └─────────────────────────────────────────┘
  │  container.style.height = scrollHeight  │

  Position formula:
  newY = prevY + margin + height(prev)
  → CSS transform: translateY(newY)px
  → GPU-accelerated! No reflow! ✅
```

```
VARYING HEIGHT CARDS Q&A:
═══════════════════════════════════════════════════════════════

  Q: "How would this work with varying height cards?"
  A: "Works the same! Formula uses height of previous card.
     Cards can be different sizes.
     getBoundingClientRect().height handles it!" — Evgenii

  Q: "What if content squeezed and card height changes?"
  A: "Trigger re-rendering of virtual list.
     Recalculate all positions." — Evgenii
```

---

## §4. Data & Sliding Window

```
SLIDING WINDOW:
═══════════════════════════════════════════════════════════════

  Data array: [d1, d2, d3, d4, d5, d6, d7, d8, ...]
                        ↑ start      ↑ end

  Initial render: page1=[d1,d2] + page2=[d3,d4]
  start=0, end=2

  After scroll down (bottom observer triggered):
  start=1, end=3 → render page2 + page3
  Recycle d1,d2 → update with d5,d6 data!

  "Once loaded, don't reload. Use cached data
   from global state, just move start/end pointers." — Evgenii
```

---

## §5. Application State — "Normalized 2NF!"

> Evgenii: _"Apply first and second normal form. Story accessed by id. No comments nested in story — separate table. Attachments separate too."_

```javascript
// Normalized state (2NF):
const state = {
  stories: {
    // Accessed by id → O(1)!
    s1: { id: "s1", text: "Hello world", timestamp: 1001 },
    s2: { id: "s2", text: "Great day", timestamp: 1002 },
  },
  comments: {
    // Accessed by story_id → array of comments!
    s1: [
      { id: "c1", text: "Nice!", author: "Jane" },
      { id: "c2", text: "Cool!", author: "Bob" },
    ],
  },
  attachments: {
    // Accessed by story_id → array of URLs!
    s1: ["https://cdn.example.com/img1.webp"],
    s2: ["https://cdn.example.com/img2.webp"],
  },
};

// No nesting! Each entity is its own table! ✅
// Access story: state.stories['s1'] → O(1)!
// Access comments: state.comments['s1'] → O(1)!
```

```
Q&A:
═══════════════════════════════════════════════════════════════

  Q: "Where do you keep chronological order?"
  A: "Add timestamp to story. Extract IDs to render,
     sort by timestamp. Virtual list renders limited subset,
     so sorting is fast." — Evgenii

  Q: "Map vs Object?"
  A: "Map is fancy wrapper around Object. Not important
     for this design. Don't focus too much on that." — Evgenii

  Q: "react-window for virtualization?"
  A: "Depends on company. System design evaluates
     fundamentals. Be framework-agnostic.
     'What would you do with Vanilla API?'" — Evgenii
```

---

## §6. API Design — "SSE + GET!"

> Evgenii: _"Combination of GET request + Server-Sent Events. When scroll down, don't wait for SSE — just GET. SSE for real-time new stories pushed by server."_

```
API:
═══════════════════════════════════════════════════════════════

  Endpoint: getStories(token, limit, previousPage)

  Parameters:
  • token: API authentication!
  • limit: how many items per page
    → Large screens: more items
    → Mobile: 4-5 items
  • previousPage: resume from where stopped!
    → First time: load with current timestamp
    → Returning: load from last position

  Data fetching strategy:
  SSE → receive new stories pushed by server!
  GET → fetch on-demand when scrolling! ✅

  "Combination of GET + SSE is the answer." — Evgenii
```

---

## §7. Short Polling vs SSE Analysis

```
PROTOCOL COMPARISON FOR NEWSFEED:
═══════════════════════════════════════════════════════════════

  Short Polling:
  ✅ Simple, HTTP protocol
  ❌❌ Battery drain (duplex antenna!)
  ❌ Not network efficient
  ❌ Latency (mobile tower switching!)
  ❌ Duplex antenna = double energy! 💀

  WebSockets:
  ✅ Real-time
  ❌ "Do we need real-time for stories? No!" — Evgenii
  ❌ Huge infrastructure cost
  ❌ "Remove from consideration completely!" — Evgenii

  SSE + GET: ✅ WINNER!
  ✅ Energy efficient (mono antenna!)
  ✅ Comparable performance to WebSocket!
  ✅ HTTP/2: hundreds of parallel requests!
  ✅ Single TCP connection!
  ✅ Auto-reconnection!
```

---

## §8. Performance Optimization

```
NETWORK:
═══════════════════════════════════════════════════════════════

  1. Migrate to HTTP/2 (200 SSE parallel, 1 TCP!)
  2. Bundle split (HTTP/2 era!)
  3. Multi-target bundles (ES5, ES.next by user-agent!)
  4. Defer non-critical scripts (analytics!)
  5. Compression: Gzip (85%) or Brotli (91%)!
  6. Serve from CDN (not API server!)
  7. WebP/AVIF images + JPEG fallback!
  8. font-display for custom fonts!
  9. Image optimization service (per viewport!)

RENDERING:
═══════════════════════════════════════════════════════════════

  1. DOM: constant number of nodes (virtualization!)
  2. Flat CSS selectors (naming methodology!)
  3. No reflows: CSS transform for animations!
  4. Loading placeholders (visual feedback!)

JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  1. Don't block UI thread!
  2. Heavy tasks → Web Worker!
  3. Or → requestIdleCallback!
  4. Async storage: IndexedDB (not localStorage!)
  5. Service Worker: cache assets in IndexedDB!
     → Intercepts requests → serves from cache!
     → Enables OFFLINE SUPPORT! ✅
  6. Reduce JS payload (split, multi-target!)
```

---

## §9. Q&A — Accessibility, Offline, Cache

```
Q&A:
═══════════════════════════════════════════════════════════════

  Q: "How does offline work?"
  A: "Service Worker caches HTML/CSS/images in IndexedDB.
     Next load: intercepts request, serves from IndexedDB.
     App opens even offline!" — Evgenii

  Q: "Cache invalidation for IndexedDB?"
  A: "Good problem. If time, discuss it.
     But better to discuss accessibility instead!" — Evgenii

  Q: "Accessibility with virtualization?"
  A: "Complex topic! Screen reader loses understanding
     when elements moved via CSS transform.
     Twitter: re-renders list fully (no transform optimization)
     but limits to 10-20 elements.
     Or: manually handle keyboard events,
     focus elements, force browser to read." — Evgenii

  Q: "When is performance optimization worth the complexity?"
  A: "Follow Web Vitals guidelines. If yellow zone,
     4-second first load = bad experience.
     Don't need 99% score. Optimize when needed.
     If website loads fast, don't overcomplicate!" — Evgenii
```

---

## Checklist

```
[ ] Interview: 35-45 min, don't over-commit!
[ ] Requirements: functional + non-functional!
[ ] Mockup: simple drawing + virtualization explanation!
[ ] Virtualization: absolute + translateY + observers!
[ ] Sliding window: start/end pointers, cache data!
[ ] State: normalized 2NF (stories, comments, attachments)!
[ ] API: SSE + GET (not WebSocket!)
[ ] getStories(token, limit, previousPage)!
[ ] Performance: HTTP/2, split, Brotli, WebP, defer!
[ ] Rendering: virtualization, flat selectors, CSS animations!
[ ] JS: Web Worker, idle callback, IndexedDB!
[ ] Offline: Service Worker + IndexedDB cache!
[ ] Accessibility: re-render or manual keyboard handling!
TIẾP THEO → Phần 28: Wrapping Up!
```
