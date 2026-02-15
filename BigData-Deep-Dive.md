# Handling 100,000 Data Entries on the Frontend — Deep Dive

> 📅 2026-02-12 · ⏱ 15 phút đọc
>
> Backend sends 100K records → How do you render them?
> 3 levels: Junior (brute force) → Mid (lazy load) → Senior (virtual scroll + Worker)
> Độ khó: ⭐️⭐️⭐️⭐️ | Performance & System Design Interview

---

## Mục Lục

| #   | Section                                                  |
| --- | -------------------------------------------------------- |
| 0   | Problem Statement & Mock Server                          |
| 1   | Junior: Direct Render (❌ Crash!)                        |
| 2   | Mid-level: Lazy Load + Pagination + Debounce             |
| 3   | Senior: Virtual Scroll + Chunked Processing + Web Worker |
| 4   | Complete Virtual List Implementation                     |
| 5   | Bonus: requestAnimationFrame Chunking                    |
| 6   | Summary & Interview Strategy                             |

---

## §0. Problem Statement

```
SCENARIO:
═══════════════════════════════════════════════════════════════

  Backend returns 100,000 records at once (no pagination API!)
  → Need to render them all in a scrollable list
  → Need to support SEARCH (also frontend-side!)
  → Must NOT crash or lag the browser!

  REAL CASE: Select dropdown with 20,000 options
  → Direct render → page freezes → user rage-quits 💀

  3 APPROACHES (by engineer level):

  ┌─────────┬───────────────────────────────────┬────────────┐
  │ Level   │ Approach                          │ Perf       │
  ├─────────┼───────────────────────────────────┼────────────┤
  │ Junior  │ Render all 100K DOM nodes         │ 💀 Crash   │
  │ Mid     │ Lazy load + pagination + debounce │ ✅ Usable  │
  │ Senior  │ Virtual scroll + Worker + chunk   │ ⭐ Optimal │
  └─────────┴───────────────────────────────────┴────────────┘
```

```javascript
// Mock Server (Koa) — generates 100K records
app.use(async (ctx, next) => {
  if (ctx.url === "/api/getMock") {
    let list = [];

    function generateRandomWords(n) {
      const chars = "abcdefghijklmnopqrstuvwxyz前端后端设计产品开发";
      let ret = "";
      for (let i = 0; i < n; i++) {
        ret += chars[Math.floor(Math.random() * chars.length)];
      }
      return ret;
    }

    for (let i = 0; i < 100000; i++) {
      list.push({
        name: `user_${i}`,
        title: generateRandomWords(12),
        text: `Item #${i} — scroll me! 🌀`,
        tid: `id_${i}`,
      });
    }

    ctx.body = { state: 200, data: list };
  }
  await next();
});
```

---

## §1. Junior: Direct Render (❌ Crash!)

```
FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────┐     ┌───────────────────┐
  │ Fetch 100K   │────→│ Render ALL 100K   │──→ 💀 PAGE FREEZE!
  │ from backend │     │ DOM nodes at once  │
  └──────────────┘     └───────────────────┘
                              ↓
                       ┌───────────────────┐
                       │ Search: filter all │──→ Re-render 100K!
                       │ then render again  │
                       └───────────────────┘
```

```javascript
// ❌ JUNIOR APPROACH — renders everything
fetch("/api/getMock")
  .then((res) => res.json())
  .then((res) => {
    data = res.data;
    setList(data); // 💀 100,000 DOM nodes created!
  });

// Render
{
  list.map((item) => (
    <div key={item.tid}>
      <div>
        {item.title} <span>{item.name}</span>
      </div>
      <div>{item.text}</div>
    </div>
  ));
}

// Search — also naive
const handleSearch = (v) => {
  const filtered = data.filter((item) => item.title.indexOf(v) > -1);
  setList(filtered); // May still be huge!
};
```

```
WHY IT CRASHES:
═══════════════════════════════════════════════════════════════

  1. DOM NODE COUNT: 100K items × ~3 nodes each = 300K+ DOM nodes!
     → Browser rendering engine chokes
     → Layout/paint takes SECONDS

  2. MEMORY: Each DOM node ≈ 1KB → 300MB+ memory usage!
     → GC pressure → more jank

  3. REFLOW: Any state change triggers full reflow of 300K nodes
     → Search re-renders everything → freeze again!

  RESULT: 5-10 second white screen, then laggy scrolling 💀
```

---

## §2. Mid-level: Lazy Load + Pagination + Debounce

```
FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────┐     ┌──────────────────────────────────────┐
  │ Fetch 100K   │────→│ Store all data in memory (NOT DOM!)  │
  │ from backend │     │ Render ONLY first page (16 items)    │
  └──────────────┘     └──────────────────────────────────────┘
                              ↓
                       ┌──────────────────────────────────────┐
                       │ Debounced scroll listener (300ms)    │
                       │ → poll element enters viewport?      │
                       │ → YES: load next page (16 more)      │
                       │ → One-way lock (only scroll DOWN!)   │
                       └──────────────────────────────────────┘
                              ↓
                       ┌──────────────────────────────────────┐
                       │ Search: regex filter → reset page    │
                       │ → Render filtered page 1             │
                       │ → Lazy load continues for results    │
                       └──────────────────────────────────────┘

  KEY INSIGHT:
  → Data lives in JS memory (100K objects = ~20MB — fine!)
  → DOM only has visible items (~16-50 nodes — fast!)
  → More items added on scroll (pagination)
```

### 2a. Lazy Loading with Scroll Detection

```
SCROLL DETECTION — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  ┌─────────── Viewport (window.innerHeight) ──────────────┐
  │                                                         │
  │   ┌─── List Items (rendered so far) ───────────────┐   │
  │   │  item 1                                         │   │
  │   │  item 2                                         │   │
  │   │  ...                                            │   │
  │   │  item 16                                        │   │
  │   └─────────────────────────────────────────────────┘   │
  │                                                         │
  │   ┌─── Poll Element (height=0, sentinel) ───────────┐  │
  │   │  getBoundingClientRect().top ≤ innerHeight?      │  │
  │   │  YES → Load next page!                           │  │
  │   └─────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘

  Poll element = invisible sentinel at bottom of list
  → When it enters viewport → user scrolled to bottom → load more!
```

```javascript
let data = []; // All 100K records (in memory)
let searchData = []; // Filtered results
let curPage = 1;
let pageSize = 16;
let prevY = 0; // One-way scroll lock

// Debounce utility
function debounce(fn, delay) {
  return function (args) {
    const ctx = this;
    clearTimeout(fn._tid);
    fn._tid = setTimeout(() => fn.call(ctx, args), delay);
  };
}

// Scroll handler — load next page when poll visible
function scrollAndLoading() {
  if (window.scrollY > prevY) {
    // Only scroll DOWN!
    prevY = window.scrollY; // Update lock position
    const pollTop = poll.current.getBoundingClientRect().top;

    if (pollTop <= window.innerHeight) {
      curPage++;
      setList(searchData.slice(0, pageSize * curPage));
    }
  }
}

// Setup scroll listener with debounce
useEffect(() => {
  fetch("/api/getMock")
    .then((res) => res.json())
    .then((res) => {
      data = res.data;
      searchData = data;
      setList(data.slice(0, pageSize)); // First page only!
    });

  const debouncedScroll = debounce(scrollAndLoading, 300);
  window.addEventListener("scroll", debouncedScroll, false);

  return () => {
    window.removeEventListener("scroll", debouncedScroll, false);
  };
}, []);
```

### 2b. Search with Pagination Reset

```javascript
const handleSearch = (v) => {
  curPage = 1; // Reset pagination!
  prevY = 0; // Reset scroll lock!

  searchData = data.filter((item) => {
    const reg = new RegExp(v, "gi"); // Case-insensitive regex
    return reg.test(item.title);
  });

  setList(searchData.slice(0, pageSize * curPage));
};
```

```
MID-LEVEL ANALYSIS:
═══════════════════════════════════════════════════════════════

  ✅ Initial render: only 16 items → FAST!
  ✅ Scroll loads more incrementally
  ✅ Search filters in memory → re-paginates results
  ✅ Debounce prevents excessive scroll events

  ⚠️ PROBLEM: DOM nodes ACCUMULATE!
  → After scrolling through 1000 items → 1000 DOM nodes still exist!
  → Performance degrades over time
  → Not ideal for 100K total items

  → Solution: VIRTUAL SCROLL (Senior approach!)
```

---

## §3. Senior: Virtual Scroll + Chunked Processing + Web Worker

```
VIRTUAL SCROLL — CORE IDEA:
═══════════════════════════════════════════════════════════════

  Only render items VISIBLE in the viewport!
  → 100K data but only ~20 DOM nodes at any time!
  → Scroll → update which items are "visible"
  → Padding simulates full scroll height

  ┌─── Container (overflow: auto) ─────────────────────────┐
  │                                                         │
  │  ┌── Phantom (height = totalItems × itemHeight) ─────┐ │
  │  │  ← Creates scrollbar proportional to full list!    │ │
  │  │                                                     │ │
  │  │  ┌── translateY(startOffset) ───────────────────┐  │ │
  │  │  │  ╔═══════════════════════════════════════╗    │  │ │
  │  │  │  ║ Item 50   ← only visible items!       ║    │  │ │
  │  │  │  ║ Item 51                                ║    │  │ │
  │  │  │  ║ Item 52                                ║    │  │ │
  │  │  │  ║ ...                                    ║    │  │ │
  │  │  │  ║ Item 65                                ║    │  │ │
  │  │  │  ╚═══════════════════════════════════════╝    │  │ │
  │  │  └──────────────────────────────────────────────┘  │ │
  │  │                                                     │ │
  │  └─────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘

  KEY CALCULATIONS:
  → visibleCount = Math.ceil(containerHeight / itemHeight)
  → startIndex = Math.floor(scrollTop / itemHeight)
  → endIndex = startIndex + visibleCount
  → startOffset = startIndex * itemHeight (translateY)
  → visibleData = data.slice(startIndex, endIndex)
```

---

## §4. Complete Virtual List Implementation

```javascript
// VirtualList.jsx — full implementation
import React, { useState, useRef, useMemo, useCallback } from "react";

function VirtualList({ data, itemHeight = 50, containerHeight = 600 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Buffer: render extra items above/below for smooth scrolling
  const bufferCount = 5;

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = data.length * itemHeight;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - bufferCount,
  );
  const endIndex = Math.min(
    data.length,
    startIndex + visibleCount + 2 * bufferCount,
  );

  const startOffset = startIndex * itemHeight;
  const visibleData = data.slice(startIndex, endIndex);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
    >
      {/* Phantom — creates full scrollbar */}
      <div style={{ height: totalHeight }} />

      {/* Visible items — positioned with transform */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${startOffset}px)`,
        }}
      >
        {visibleData.map((item, i) => (
          <div
            key={startIndex + i}
            style={{
              height: itemHeight,
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
            }}
          >
            <span>{item.title}</span>
            <span style={{ marginLeft: 8, color: "#999" }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```
VIRTUAL LIST — KEY DETAILS:
═══════════════════════════════════════════════════════════════

  WHY BUFFER?
  → Without buffer: items flash in/out during fast scroll
  → Buffer renders 5 extra above + 5 extra below viewport
  → Smooth scrolling experience!

  WHY translateY instead of paddingTop?
  → Transform is GPU-accelerated (compositor layer)
  → PaddingTop triggers layout recalculation (expensive!)
  → Transform = paint-only change = buttery smooth 🧈

  FIXED vs DYNAMIC HEIGHT:
  → Fixed: easy! itemHeight constant, simple math
  → Dynamic: need to MEASURE each item
    → Use ResizeObserver or pre-measure
    → Store height cache: Map<index, height>
    → Binary search for startIndex (cumulative heights)
```

### Search with Virtual List

```javascript
// Debounced search — filters data, virtual list handles rendering
function App() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetch("/api/getMock")
      .then((res) => res.json())
      .then((res) => {
        setAllData(res.data);
        setFilteredData(res.data);
      });
  }, []);

  const handleSearch = useMemo(() => {
    let timer;
    return (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const query = e.target.value;
        if (!query) {
          setFilteredData(allData);
          return;
        }
        const reg = new RegExp(query, "gi");
        setFilteredData(allData.filter((item) => reg.test(item.title)));
      }, 300);
    };
  }, [allData]);

  return (
    <div>
      <input onChange={handleSearch} placeholder="Search..." />
      <VirtualList data={filteredData} itemHeight={50} containerHeight={600} />
    </div>
  );
}
```

---

## §5. Bonus: requestAnimationFrame Chunking

```
FOR MILLION-RECORD SCENARIOS:
═══════════════════════════════════════════════════════════════

  Problem: processing 1M records blocks main thread!
  → UI freezes during filter/sort/transform operations

  Solution 1: TIME-SLICING with rAF
  → Break work into small chunks
  → Yield to browser between chunks (paint, handle events)
  → User sees progressive rendering

  Solution 2: WEB WORKER
  → Move heavy computation OFF main thread entirely
  → Worker does filter/sort → posts result back
  → Main thread stays responsive!
```

```javascript
// TIME-SLICING with requestAnimationFrame
function processInChunks(items, processFn, chunkSize = 500, callback) {
  let index = 0;

  function doChunk() {
    const end = Math.min(index + chunkSize, items.length);

    for (; index < end; index++) {
      processFn(items[index], index);
    }

    if (index < items.length) {
      requestAnimationFrame(doChunk); // Yield to browser!
    } else {
      callback(); // All done!
    }
  }

  requestAnimationFrame(doChunk);
}

// Usage: render 100K items progressively
processInChunks(
  data,
  (item, i) => {
    // Append DOM node for this item
    const div = document.createElement("div");
    div.textContent = item.title;
    container.appendChild(div);
  },
  500,
  () => {
    console.log("All 100K items rendered!");
  },
);
```

```javascript
// Alternative: setTimeout chunking (classic pattern)
function multistep(steps, args, callback) {
  const tasks = steps.concat();

  setTimeout(function tick() {
    const task = tasks.shift();
    task.apply(null, args || []);

    if (tasks.length > 0) {
      setTimeout(tick, 25); // 25ms gap = 40fps
    } else {
      callback();
    }
  }, 25);
}
```

### Web Worker for Heavy Search

```javascript
// search.worker.js
self.onmessage = function (e) {
  const { data, query } = e.data;
  const reg = new RegExp(query, "gi");
  const results = data.filter((item) => reg.test(item.title));
  self.postMessage(results);
};

// Main thread — stays responsive!
const worker = new Worker("search.worker.js");

function handleSearch(query) {
  worker.postMessage({ data: allData, query });
}

worker.onmessage = function (e) {
  setFilteredData(e.data); // Worker finished → update UI
};
```

```
WEB WORKER — KEY POINTS:
═══════════════════════════════════════════════════════════════

  ✅ Runs in SEPARATE THREAD (no main thread blocking!)
  ✅ Perfect for: search, sort, complex data transforms
  ✅ Communication via postMessage (structured clone)

  ❌ Cannot access DOM
  ❌ Data transfer has overhead (serialization/copy)
  → For huge data: use SharedArrayBuffer or Transferable

  Fuzzy search optimization:
  → Binary search (if sorted)
  → Trie data structure (prefix search)
  → Fuse.js library (fuzzy matching)
```

---

## §6. Summary & Interview Strategy

```
3-LEVEL COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────┬──────────────┬───────────────┬──────────────────┐
  │ Level   │ DOM Nodes    │ Search        │ Scrolling        │
  ├─────────┼──────────────┼───────────────┼──────────────────┤
  │ Junior  │ 100K (ALL!)  │ filter→render │ 💀 Frozen        │
  │         │              │ all results   │                  │
  │ Mid     │ Grows (lazy) │ filter→paginate│ ⚠️ Accumulates  │
  │         │ 16→32→48→... │ re-render page│ degrades slowly  │
  │ Senior  │ ~20 (fixed!) │ Worker search │ ⭐ Always smooth │
  │         │ Virtual only │ +virtual list │ constant DOM!    │
  └─────────┴──────────────┴───────────────┴──────────────────┘
```

```
INTERVIEW ANSWER FRAMEWORK:
═══════════════════════════════════════════════════════════════

  Step 1 — CHALLENGE ASSUMPTIONS:
  "First, I'd push back: backend should paginate!
   But if we MUST handle 100K client-side..."

  Step 2 — DATA vs DOM:
  "Store ALL data in JS memory (~20MB = fine).
   But NEVER render all to DOM (300K nodes = crash)."

  Step 3 — PROGRESSIVE DEPTH:

  Level 1: Frontend Pagination
  → Store data in memory
  → Render page 1 (e.g., 20 items)
  → Scroll to bottom → load next page
  → Debounce scroll listener

  Level 2: Virtual Scrolling ⭐ (best answer!)
  → Only render visible viewport items (~20 nodes)
  → Phantom div for scroll height
  → translateY for positioning (GPU accelerated!)
  → Buffer items for smooth fast-scroll

  Level 3: Heavy Computation
  → Web Worker for search/sort (off main thread!)
  → requestAnimationFrame chunking for progressive render
  → Trie / binary search for optimized lookup

  Step 4 — LIBRARIES IN PRODUCTION:
  → react-window (lightweight virtual list)
  → react-virtualized (full-featured)
  → @tanstack/virtual (framework-agnostic)
  → Ant Design Select with virtual scroll (4.0+)

  BONUS POINTS — IntersectionObserver:
  → Replace scroll+getBoundingClientRect
  → More performant (no scroll event spam!)
  → Native API, fewer calculations
```

```javascript
// IntersectionObserver — modern lazy load (bonus!)
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        curPage++;
        setList(data.slice(0, pageSize * curPage));
      }
    });
  },
  { threshold: 0.1 },
);

// Observe sentinel element
observer.observe(document.querySelector("#sentinel"));
```

### Checklist

- [ ] 100K data in memory OK (~20MB), 100K DOM nodes NOT OK (300K+ nodes)
- [ ] Junior: render all → crash, no pagination
- [ ] Mid: lazy load + scroll sentinel + debounce + pagination
- [ ] Scroll detection: `getBoundingClientRect().top ≤ innerHeight`
- [ ] One-way lock: `scrollY > prevY` — only trigger on scroll DOWN
- [ ] Search: regex filter → reset curPage to 1 → re-paginate
- [ ] Virtual scroll: only render visible items (~20 DOM nodes)
- [ ] Phantom div: `height = totalItems × itemHeight` (fake scrollbar)
- [ ] `translateY(startOffset)` — GPU-accelerated positioning
- [ ] Buffer: render 5 extra above + below for smooth fast-scroll
- [ ] Dynamic height: ResizeObserver + height cache + binary search
- [ ] rAF chunking: process 500 items per frame, yield to browser
- [ ] Web Worker: offload search/sort to separate thread
- [ ] IntersectionObserver: modern replacement for scroll+getBoundingClientRect
- [ ] Libraries: react-window, react-virtualized, @tanstack/virtual
- [ ] Interview: always start with "push back on backend" then show depth!

---

_Nguồn: "If the backend sends you 100,000 data entries at once, how would you handle it?"_
_Cập nhật lần cuối: Tháng 2, 2026_
