# 🎯 Interview Guide — File Browser Performance at Scale
## Virtual Scrolling · Cursor Pagination · Cross-layer Architecture · Mentoring

---

## 🔑 Context: Why "Performance for Large Organisations" Is Hard

```
SMALL ORGANISATION (~50 files):
  Naive implementation works fine:
  - Fetch all files in one request → tiny payload
  - Render all rows as DOM nodes → 50 nodes, no problem
  - Sort/filter client-side → fast, dataset is small
  - No real-time collaboration complexity

LARGE ORGANISATION (~50,000+ files in one folder):
  Every naive assumption breaks:
  - "Fetch all files" → 12MB JSON, 18-second page load
  - "Render all rows" → 50,000 DOM nodes → browser freezes (5 fps scroll)
  - "Sort client-side" → sorting 50K objects in JS → tab crash
  - "Check permissions after fetch" → fetch 50K, show 8K = 85% wasted work
  - Concurrent users → stale file lists → user confusion

WHAT THIS MEANS FOR AN INTERVIEWER:
  Performance engineering for scale is not just "add a cache."
  It requires understanding WHERE the bottleneck actually is (DOM? Network? DB?),
  which layer to fix it in (FE? API? DB?), and how to coordinate cross-layer changes.
  Most frontend engineers only think about the frontend layer.
  Leading this work shows architectural thinking that crosses all layers.
```

---

## 1️⃣ Virtual Scrolling — Solving DOM Explosion

### Why the DOM is the bottleneck

```
WHAT HAPPENS WITH 10,000 DOM ROWS:
  Every DOM node has:
  - Layout box: the browser calculates position and size
  - Style: resolved CSS properties cached per node
  - Event listeners: if you attach any (hover, click)
  - Paint record: tracked by the compositor

  10,000 rows × this overhead = browser layout takes 800ms+
  On scroll: browser recalculates layout for all visible + nearby nodes
  On every mousemove: event bubbling through 10,000 nodes

  The symptom: scroll drops to 5fps, browser tab becomes unresponsive.
  The user cannot even interact with the few files they CAN see.

THE VIRTUAL SCROLLING INSIGHT:
  The user can only see ~12 rows at a time (in a 400px container with 36px rows).
  Why render all 50,000?
  Render only the visible ~12, plus a small buffer above and below.
  As the user scrolls, destroy offscreen rows and create newly visible rows.
  DOM node count: constant ~16, regardless of file count.
  Scroll performance: 60fps, always.
```

### STAR Script

```
SITUATION:
  The File Browser was completely unusable for large organisations —
  clients with 50,000 files in a folder would open the File Browser
  and get a white screen for 18 seconds, then a frozen tab.

  I profiled the page using Chrome DevTools Performance:
  - 12 seconds: waiting for the API response (50K files in one JSON)
  - 4 seconds: parsing 12MB of JSON
  - 2 seconds: React rendering 50,000 DOM nodes
  - After load: scroll animation at 5fps, completely unusable

TASK:
  Lead the frontend performance improvement — make the File Browser
  usable for organisations of any size.

ACTION — VIRTUAL SCROLLING:
  The core insight: only render what's visible.

  Implementation:
  - Track scrollTop in a state variable (onScroll event)
  - Calculate startIndex = Math.floor(scrollTop / rowHeight)
  - Calculate endIndex = startIndex + visibleCount + buffer
  - Render only rows[startIndex..endIndex] — typically 12–16 rows
  - Use CSS padding-top and padding-bottom on the scroll container
    to maintain the correct total scrollable height (so the scrollbar
    reflects the full file count) without rendering all rows

  The paddingTop pushes rendered rows to their correct visual position.
  The paddingBottom fills the remaining scroll distance.
  The browser sees a container whose total height = 50,000 × rowHeight,
  but only 16 actual DOM nodes exist at any time.

  Additional optimisations:
  - React.memo on the row component — prevents re-renders for unchanged rows
  - Stable keys: row key = file.id, not array index (prevents DOM destruction on sort)
  - useTransition for search/filter: keep current list visible while new one loads

RESULT:
  - Scroll performance: 5fps → 60fps, immediately
  - DOM node count: 50,000 → 16, always
  - The File Browser became usable for any organisation size
  - The technique was documented and applied to other list views in the product
```

### Follow-up Q&A

**"Why not just use react-window or react-virtualized?"**
> "We did evaluate react-window. For straightforward use cases, it is the right choice — battle-tested, handles edge cases, handles variable height rows with react-window-infinite-loader. We ended up implementing a simplified version from scratch for two reasons: our rows were fixed height (simplifying the implementation significantly), and we needed specific integration with our permission-aware file loading — the virtualised list needed to coordinate with our cursor pagination to prefetch the next page when the user approached the bottom of the loaded data. A lightweight custom implementation was easier to wire into our data-fetching layer than adapting react-window's APIs. But I would not make that choice if the rows were variable height — react-window handles that complexity well and I would not want to reinvent it."

**"How do you handle the case where the user jumps to position 30,000 in the list?**"
> "This is the hardest case for virtual + paginated lists. If we have only loaded the first 500 files (25 pages), and the user scrolls rapidly to position 30,000, we don't have that data. Our approach: we render a loading skeleton for rows beyond the loaded range, trigger fetching the relevant pages in the background, and show the real rows as they arrive. We also implemented a scroll-throttle: rapid scrolling (faster than X pixels per second) was batched — we waited for the scroll to stop before triggering page loads, which prevented firing 20 page requests during a single fast scroll gesture."

---

## 2️⃣ Cursor Pagination — Solving the Data Fetching Problem

### Why offset pagination breaks at scale

```
OFFSET PAGINATION (the naive approach):
  SELECT * FROM files WHERE folder_id = 'abc'
  ORDER BY modified_at DESC
  LIMIT 20 OFFSET 10000

  What the database does:
  1. Scan from the beginning of the table/index
  2. Skip 10,000 rows (they are read into memory, then discarded)
  3. Return the next 20 rows

  Page 1: skip 0, return 20 → fast
  Page 500: skip 10,000 → slow (reads and discards 10,000 rows)
  Page 5000: skip 100,000 → very slow (100,000 wasted reads)

  The deeper you paginate, the slower it gets. Linearly.
  For a user scrolling down a 50,000-file list, this is unacceptable.

CURSOR PAGINATION (the solution):
  The cursor encodes the "last seen position" — typically the ID or
  a combination of (sort_column, id) of the last returned item.

  SELECT * FROM files WHERE folder_id = 'abc'
  AND (modified_at, id) < (:last_modified, :last_id)  ← cursor
  ORDER BY modified_at DESC, id DESC
  LIMIT 20

  What the database does:
  1. Index seek to the cursor position (O(log n) — instant)
  2. Scan forward 20 rows
  3. Return

  Page 1: same speed as page 500. Constant time. Scales to any depth.
  Additional benefit: consistent results even when files are added/deleted
  between pages (offset shifts when rows are inserted — cursor does not).
```

### STAR Script

```
SITUATION:
  Even after virtual scrolling fixed the DOM problem, large organisations
  still faced slow initial load — because the API returned all 50,000 files
  in a single response. The API was designed before the product had large
  enterprise customers.

TASK:
  Redesign the data fetching strategy — both the frontend approach and
  the backend API contract — to enable fast initial load and scalable
  pagination for any folder size.

ACTION:
  This required coordinating three teams:
  - Frontend: change from "load all" to "load 20 at a time" with scroll-triggered fetching
  - Backend: new API endpoint with cursor pagination, field selection, server-side sort
  - Database: new composite index to make cursor queries fast

  FRONTEND CHANGES:
  - Initial load: fetch only the first 20 files → first contentful paint in <400ms
  - As user scrolls to 80% of loaded data → prefetch next page (invisible to user)
  - Stale-while-revalidate: serve cached list immediately, revalidate in background
  - Optimistic updates: rename/delete/move feels instant → confirm with server

  BACKEND API REDESIGN:
  New endpoint signature:
    GET /api/folders/:id/files
      ?cursor=<opaque_token>
      &limit=20
      &sort=modified_desc
      &fields=id,name,type,size,modified_at,permissions

  Response:
    { items: [...20 files with only requested fields],
      cursor: "next_page_token",
      hasMore: true,
      total: 48392 }

  The cursor is opaque to the client (base64 of last-seen id + sort value).
  sort and filter parameters are executed at the database layer — not in-memory.

  DATABASE:
  Added composite index:
    CREATE INDEX idx_files_folder_modified
    ON files (folder_id, modified_at DESC, id)
    WHERE deleted_at IS NULL;

  This index covers:
  - The WHERE clause (folder_id)
  - The ORDER BY (modified_at DESC, id)
  - The cursor condition ((modified_at, id) < (:last_modified, :last_id))
  Query cost: O(log n) seek + O(page_size) scan. Constant regardless of depth.

RESULT:
  - First contentful paint: 18 seconds → 380ms (47× improvement)
  - Page N load time: was O(n×page_size), now O(log n + page_size) — constant
  - API response size: 12MB → ~48KB per page (250× reduction)
  - Engineers on the team learned the cursor vs offset distinction —
    now applied to every new paginated endpoint in the product
```

### Follow-up Q&A

**"How do you implement 'load more as user scrolls' without the user seeing a loading flash?"**
> "Two things. First, prefetch aggressively: when the user reaches 80% of the currently loaded data (not 100%), we trigger fetching the next page. At 60fps scroll, the user reaches the bottom of the loaded content in about 300ms — fetching at 80% gives us 300ms head start. Most network requests return in 200-400ms, so by the time the user reaches the bottom, the next page is usually already loaded. Second, stale-while-revalidate: we show the cached (stale) data immediately and update it in the background. Even if the cache is slightly out of date, the user sees content instantly. The visible experience is: infinite smooth scroll, no loading states between pages."

**"What do you do if files are added or deleted between pages?**"
> "Cursor pagination is naturally stable — adding or deleting files between pages does not shift the cursor position. With offset pagination, if one file is deleted on page 1, all subsequent pages shift by one position and the user might see a duplicate or miss a file. With cursor pagination, the cursor points to a specific file by ID, so the next page starts correctly regardless of insertions or deletions before the cursor. The remaining problem: files deleted AFTER the cursor might still appear in the next page (we fetched them before deletion). We handle this with a soft-delete approach — deleted files have a deleted_at timestamp. The query filters WHERE deleted_at IS NULL. If a file is soft-deleted between pages, it simply does not appear in the next page. The user might see a gap, but they never see a deleted file."

---

## 3️⃣ Cross-layer Redesign — DB + API + Frontend Together

### The key insight

```
WHY FRONTEND ALONE IS INSUFFICIENT:

  Virtual scrolling solves: DOM performance
  Cursor pagination solves: network payload and page load time
  DB index solves: query performance

  These three are required TOGETHER. Any one without the others does not work:

  Virtual scroll WITHOUT cursor pagination:
    You render only 12 rows at a time. But the API still fetches 50,000 files
    in one request (12MB, 18 seconds). The DOM renders instantly once loaded —
    but the load is still agonising. User experience: 18-second wait, then smooth.
    Not acceptable.

  Cursor pagination WITHOUT DB index:
    The API returns 20 files per request — payload is small. But the database
    uses a full table scan for each page: 200ms for page 1, 12 seconds for page 500.
    The pagination degrades at depth. The last pages of a 50K-file folder are
    unusable. Not acceptable.

  DB index WITHOUT cursor pagination (offset with index):
    The index makes the SORT fast. But OFFSET still scans and discards:
    OFFSET 10,000 with an index still reads 10,000 index entries before returning 20.
    Better than without an index, but still degrades at depth. Not acceptable.

  All three TOGETHER:
    DB index: cursor queries are O(log n) — constant speed at any depth
    Cursor pagination: 48KB payload, first page returns in 380ms
    Virtual scroll: 60fps, 16 DOM nodes, regardless of total file count
    = genuinely usable at 50,000+ files
```

### How to talk about coordinating across teams

```
"The hardest part was not the technical work — it was the coordination.

The frontend team could ship virtual scrolling independently. Done.
But the frontend team could NOT ship cursor pagination alone — it required
a backend API change, which required a DB index.

I owned the cross-team coordination:
1. Wrote the API contract first (request parameters, response shape, cursor format)
   and shared it with both frontend and backend teams before any code was written.
   This prevented building things in parallel that would not fit together.

2. Established the DB index requirement with the backend team — they initially
   proposed implementing cursor pagination at the application layer (sorting
   all files in memory, then slicing). I pushed back: 'Show me the query plan.
   If it's not O(log n) at page 500, it's not done.' That conversation required
   understanding the DB well enough to argue the point.

3. Deployed in phases:
   Phase 1: Add DB index (no user-visible change, zero risk)
   Phase 2: Backend ships new cursor-paginated endpoint alongside old endpoint
   Phase 3: Frontend switches to new endpoint — old endpoint sunset after 2 weeks
   This phased approach meant no big-bang risk. Each phase was independently
   rollback-able."
```

---

## 4️⃣ Mentoring — Scalable FE Engineering Practices

### Patterns introduced

```
1. PERFORMANCE RFC (Request for Comments):
   Before writing any performance-related code, write a one-page document:
   - Problem: what is the user experience symptom?
   - Measurement: what is the current metric? (Time to interactive, FPS, payload size)
   - Root cause: where is the actual bottleneck? (profiled, not guessed)
   - Proposed solution: what will change in each layer?
   - Expected result: what will the metric be after the fix?

   This prevents the most common mistake: building the right thing in the wrong layer.
   ("Let me add React.memo everywhere" when the problem is a 12MB API response.)

2. "MEASURE BEFORE FIX" RULE:
   No performance PR is accepted without a before/after measurement.
   Acceptable tools:
   - Chrome DevTools Performance tab (flame chart, layout time, paint time)
   - React Profiler (component render time, wasted renders)
   - Lighthouse (LCP, CLS, FID)
   - Real user metrics via analytics (p50, p95, p99 page load)

   If you cannot measure the improvement, you cannot claim the improvement.

3. "WHAT BREAKS AT 50K FILES?" CHECK:
   For every PR touching data fetching or list rendering:
   The reviewer asks: "What is the behaviour with 50,000 files?"
   If the answer is "I don't know" or "it degrades slowly" → the PR needs changes.
   This forces engineers to think about scale early, not when a large customer complains.

4. PAIRED REVIEW FOR COMPLEXITY:
   Virtual scroll, cursor pagination, optimistic updates, stale-while-revalidate —
   these are all patterns where a subtle bug is easy to introduce and hard to catch in review.
   Complex PRs get a paired review: reviewer must CHECK OUT THE BRANCH,
   RUN THE CODE, and test the edge cases. Code-only review is not sufficient.
```

### Follow-up Q&A

**"How do you mentor an engineer to think about performance?"**
> "I change the question they ask. Most engineers ask 'how do I implement this feature?' I teach them to ask 'what are the performance characteristics of this implementation at 10× and 100× the current scale?' Concretely: when an engineer proposes loading all files into state and filtering client-side, I don't say 'that's wrong.' I ask 'what happens when there are 50,000 files?' They work through it: 50,000 objects in memory, filter runs on every keystroke, React re-renders the full list. Then they see why server-side filtering with cursor pagination is necessary. The insight lands much more deeply when the engineer derives it themselves."

**"How do you balance performance work with shipping features?"**
> "Performance work that is not tied to a specific user complaint or metric is hard to prioritise — it competes with features that have clearer business value. My approach: always have the metric. 'The File Browser loads in 18 seconds for large organisations' is not a performance concern, it is a customer retention risk. Frame it in terms the business understands, tie it to customer feedback or support tickets, and have a specific target: 'we can get this to under 400ms.' That framing turns performance work from 'technical debt cleanup' into 'fix the thing that is costing us enterprise customers.' It also makes it easier to scope: we ship the fix that gets us to 400ms, not everything that could possibly make it faster."

---

## 🔗 Unified Narrative

> "The File Browser performance work is one of the most complete examples I have of full-stack performance engineering — not just 'I made the frontend faster.'
>
> The problem was clear: the File Browser was unusable for large enterprise customers with 50,000+ files. My first step was measurement: Chrome DevTools told me the 18-second load was split three ways — 12 seconds network, 4 seconds JSON parsing, 2 seconds DOM rendering. That decomposition told me WHERE to fix things.
>
> Virtual scrolling fixed the DOM. Cursor pagination fixed the network. A composite database index fixed the query. But these only work together — cursor pagination is slow without the index, and virtual scrolling is irrelevant if the initial load takes 18 seconds.
>
> Coordinating the three-layer change required writing the API contract before any coding started, phasing the deployment so each change was independently rollbackable, and sitting in the DB query plan review to ensure the backend team's implementation was actually O(log n) at depth.
>
> On the mentoring side: I introduced a performance RFC process — every performance change requires a before metric, root cause analysis, and expected after metric. The 'what breaks at 50K files?' question is now part of every code review that touches data fetching. Those practices outlast any individual performance fix."

---

## ⚠️ Common Mistakes to Avoid

| Sai | Đúng |
|---|---|
| "I improved performance" (vague) | Specific metrics: "18 seconds → 380ms first paint. 5fps scroll → 60fps." |
| "I added virtual scrolling" (no explanation) | "DOM nodes: 50,000 → 16 constant. Here is the padding-top/padding-bottom technique that makes it work." |
| "We switched to cursor pagination" | "Offset pagination is O(page × size) — cursor is O(log n). Here is why: OFFSET scans and discards N rows before returning." |
| Nói chỉ về FE | "Real performance required three layers: DB index, API contract redesign, and frontend virtual scroll. Any one without the others doesn't work." |
| Skip cross-team coordination | "The hardest part was coordination: writing the API contract before coding, phasing the deployment, arguing the DB query plan with the backend team." |
| Mentoring as an afterthought | "Performance RFC process, measure-before-fix rule, 'what breaks at 50K?' check — these are the practices that scale beyond individual fixes." |

---

## 📊 Quick Facts

```
Product:     File Browser (enterprise file management)
Problem:     Unusable for large orgs — 18s load, browser freeze, 5fps scroll
Scope:       Led frontend, coordinated backend + database teams

Techniques:
  Virtual scroll:      DOM nodes constant at ~16, regardless of file count
                       Padding-top/bottom maintain scroll height without rendering
  Cursor pagination:   O(log n) query at any depth (vs offset O(n×page))
                       API response: 12MB → 48KB per page
  SWR cache:           Show stale, revalidate in background → instant perceived load
  Optimistic updates:  File ops feel instant → rollback on failure
  DB index:            Composite (folder_id, modified_at DESC, id) — covers cursor queries
  Prefetch:            Trigger next page at 80% scroll → user never sees loading

Results:
  First paint:     18 seconds → 380ms (47× improvement)
  Scroll FPS:      5fps → 60fps
  DOM nodes:       50,000 → 16 (constant)
  API payload:     12MB → 48KB (250× reduction)
  Query time:      O(n) → O(log n) — constant at any depth

Mentoring:
  Performance RFC process, measure-before-fix rule,
  "what breaks at 50K?" code review check, paired review for complex patterns
```

---

*Document last updated: June 2026 · File Browser Performance interview preparation*
