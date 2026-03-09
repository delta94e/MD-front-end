# Front-End System Design — Phần 28: Wrapping Up — "Course Summary!"

> 📅 2026-03-09 · ⏱ 10 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Wrapping Up — Course summary + final Q&A on streaming UI updates and minimizing runtime state.
> Độ khó: ⭐️ | Summary — toàn khoá học!

---

## §1. Course Summary

> Evgenii: _"We went through core fundamentals, DOM API, intersection observer, virtualization from scratch, application state design, network protocols, and JavaScript asset optimization."_

```
COURSE MAP:
═══════════════════════════════════════════════════════════════

  SECTION 1: CORE FUNDAMENTALS (Parts 1-7)
  ├── Box Model, Formatting Context, Positioning
  ├── Reflow, Composition Layers
  └── Browser Rendering Pipeline
      → "How browser renders elements!"

  SECTION 2: DOM API (Parts 8-10)
  ├── DOM Querying (getElementById vs querySelector)
  ├── DOM Performance Best Practices
  └── DOM Templating Exercise
      → "Brush up knowledge on DOM API usage!"

  SECTION 3: OBSERVER API (Parts 11-16)
  ├── IntersectionObserver → Infinite Scroll
  ├── MutationObserver → DOM Change Tracking
  └── ResizeObserver → Element Size Tracking
      → "Built virtualization from scratch!"

  SECTION 4: VIRTUALIZATION (Parts 17-18)
  ├── Virtualization Technique (concept)
  └── Building Virtualization from Scratch (6 steps!)
      → "Utilizing core fundamentals knowledge!"

  SECTION 5: APPLICATION STATE (Part 19)
  ├── Data Normalization (1NF, 2NF, 3NF)
  ├── Inverted Index + Composite Key
  └── Data Sharding (Runtime ↔ IndexedDB)
      → "Optimize client data storage!"

  SECTION 6: NETWORK (Parts 20-23)
  ├── TCP vs UDP, Long Polling
  ├── Server-Sent Events (SSE)
  ├── WebSockets
  └── REST vs GraphQL
      → "How to fetch data efficiently!"

  SECTION 7: PERFORMANCE (Parts 24-26)
  ├── HTTP/2 Migration, Web Vitals
  ├── JS Bundling, Code Split, Compression
  └── CSS, Images, Fonts, Rendering
      → "Optimize JavaScript assets!"

  SECTION 8: MOCK INTERVIEW (Part 27)
  └── Twitter Newsfeed System Design
      → "Apply knowledge in practice!"
```

---

## §2. Final Q&A

```
Q&A:
═══════════════════════════════════════════════════════════════

  Q: "Best practice for updating UI when streaming?
      Like ChatGPT responses?"
  A: "Connect to endpoint via SSE (great for text streaming).
     ChatGPT already received chunk of data it wants to render.
     Wait until chunk is ready, then simulate streaming
     of the answer." — Evgenii

  Q: "'Minimize runtime state' means normalizing
      or simplifying data?"
  A: "BOTH! Minimize duplication (store less nested objects)
     AND store things on hard drive (IndexedDB).
     Offload data → reduce RAM consumption." — Evgenii
```

---

## §3. Key Takeaways — Toàn Khoá Học

```
KEY TAKEAWAYS:
═══════════════════════════════════════════════════════════════

  BROWSER:
  → Understand rendering pipeline!
  → Avoid reflows (use transform, opacity!)
  → Use composition layers wisely!

  DOM:
  → Minimize DOM nodes!
  → Use DocumentFragment for batch operations!
  → Template → cloneNode for performance!

  OBSERVERS:
  → IntersectionObserver: infinite scroll, lazy load!
  → MutationObserver: DOM change tracking!
  → ResizeObserver: element size changes!

  VIRTUALIZATION:
  → Constant DOM nodes, recycle elements!
  → Pool of elements, swap halves!
  → translateY (GPU), position: absolute!
  → 6-step implementation from scratch!

  STATE:
  → Normalize data (1NF, 2NF)!
  → O(1) access via Map/Object!
  → Inverted index for search!
  → Shard: active=RAM, inactive=IndexedDB!

  NETWORK:
  → SSE for most real-time use cases!
  → SSE + POST for chat (not WebSocket!)
  → WebSocket only for sensors/gaming/trading!
  → REST for most APIs, GraphQL for complex!

  PERFORMANCE:
  → Migrate to HTTP/2 (200 streams!)
  → Code split, multi-target bundles!
  → Brotli > Gzip, WebP > JPEG, AVIF for photos!
  → font-display: fallback!
  → Don't block UI thread!
  → Service Worker for offline!

  INTERVIEW:
  → 35-45 min, don't over-commit!
  → Requirements → Mockup → State → API → Performance!
```

---

## 🎉 Hoàn thành khoá Front-End System Design!

```
"I hope this will be useful to you and you will
be able to apply this knowledge in your
real life and daily job." — Evgenii Ray

[APPLAUSE] 👏👏👏
```
