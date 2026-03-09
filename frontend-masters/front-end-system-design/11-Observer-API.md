# Front-End System Design — Phần 11: Observer API — "Born From Pain! 50× Faster Than Vanilla!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Observer API — "Born from engineer pain! 3 types: IntersectionObserver (virtualization, lazy load, analytics), MutationObserver (text editors, drawing tools), ResizeObserver (charts, adaptive). Native level tracking = 50× faster than vanilla setInterval! API: constructor(callback, config), observe(target)."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — efficient patterns that replace hacky solutions!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Why Observer API? — "Born From Pain!"               |
| 2   | Three Types — Intersection, Mutation, Resize        |
| 3   | Before Observers — "The Hacky setInterval Way!"     |
| 4   | IntersectionObserver — "Target + Root + Threshold!" |
| 5   | IntersectionObserver API                            |
| 6   | Callback: entries + isIntersecting                  |
| 7   | Native Level = 50× Faster!                          |
| 8   | MutationObserver — "Track DOM Subtree Changes!"     |
| 9   | ResizeObserver — "Track Element Size Changes!"      |
| 10  | Use Cases Deep Dive                                 |
| 11  | Tự Code: Observer Implementations                   |

---

## §1. Why Observer API? — "Born From Pain!"

> Evgenii: _"This API was born from the pain of engineers. Engineers had to create very hacky solutions to common problems. Spec developers saw this pain and implemented the Observer API."_

```
THE PAIN:
═══════════════════════════════════════════════════════════════

  Before Observers:
  "Is element visible?" → setInterval + getBoundingClientRect!
  "Did DOM change?" → polling + manual comparison!
  "Did element resize?" → window.onresize + manual check!

  → Hacky! Expensive! Janky! Battery-draining! 💀

  After Observers:
  "Is element visible?" → IntersectionObserver!
  "Did DOM change?" → MutationObserver!
  "Did element resize?" → ResizeObserver!

  → Native! Efficient! Smooth! Battery-friendly! ✅

  "Very different from traditional event-based functions." — Evgenii
```

---

## §2. Three Types — Intersection, Mutation, Resize

```
THREE OBSERVER TYPES:
═══════════════════════════════════════════════════════════════

  IntersectionObserver
  ├── Track: element visibility in viewport/container
  ├── Use: virtualization, lazy loading, analytics
  └── Use: dynamic UI elements

  MutationObserver
  ├── Track: DOM subtree changes (add/remove/modify)
  ├── Use: text editors, drawing tools
  └── Use: third-party script monitoring

  ResizeObserver
  ├── Track: element size changes
  ├── Use: adaptive charts, responsive components
  └── Use: drawing tools, dashboard widgets
```

---

## §3. Before Observers — "The Hacky setInterval Way!"

> Evgenii: _"Before, you'd query two elements, set up 15ms interval, calculate coordinates, check intersection. Multiple observers = performance degradation because callback queue works only for observers."_

```javascript
// ❌ BEFORE: Hacky vanilla intersection detection!
const elementA = document.querySelector(".element-a");
const elementB = document.querySelector(".element-b");

// Poll every 15ms!
setInterval(() => {
  const rectA = elementA.getBoundingClientRect(); // → REFLOW!
  const rectB = elementB.getBoundingClientRect(); // → REFLOW!

  // Manual intersection math!
  const isIntersecting =
    rectA.left < rectB.right &&
    rectA.right > rectB.left &&
    rectA.top < rectB.bottom &&
    rectA.bottom > rectB.top;

  if (isIntersecting) {
    handleIntersection();
  }
}, 15);
```

```
PROBLEMS WITH VANILLA APPROACH:
═══════════════════════════════════════════════════════════════

  1. setInterval(15ms) = 66 calls/second PER observer!
  2. getBoundingClientRect = triggers REFLOW!
  3. Multiple observers = callback queue flooded!
  4. Main thread blocked by calculations!
  5. Battery drain on mobile! 🔋💀

  10 observers × 66 calls/sec = 660 callbacks/second!
  Each callback triggers reflow = DISASTER!
```

---

## §4. IntersectionObserver — "Target + Root + Threshold!"

> Evgenii: _"Track intersection with target element. Single observer can track multiple elements. Set root container (default: viewport). Threshold = ratio of intersection before callback fires."_

```
INTERSECTION OBSERVER CONCEPT:
═══════════════════════════════════════════════════════════════

  ROOT (viewport or container)
  ┌──────────────────────────────────────┐
  │                                       │
  │                                       │
  │      ┌─── Target ───┐                │
  │      │               │  ← INTERSECTING!
  │      │  threshold:   │    (50% visible)
  │      │  0.5 = 50%    │
  │      └───────────────┘                │
  │                                       │
  └──────────────────────────────────────┘
  │      ┌───────────────┐                │
  │      │  Not visible! │  ← NOT intersecting!
  │      └───────────────┘                │

  Properties:
  • target: element we're tracking
  • root: container (default = viewport!)
  • threshold: 0-1 ratio (0.5 = 50% visible!)
  • callback: async function when intersection changes!

  "Single observer can track MULTIPLE elements!" — Evgenii
```

---

## §5. IntersectionObserver API

```javascript
// ═══ INTERSECTION OBSERVER API ═══

// 1. Create observer with callback + config
const observer = new IntersectionObserver(
  // Callback: fires when intersection STARTS or STOPS!
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log("Element is visible!", entry.target);
        // entry.intersectionRatio: 0-1
        // entry.boundingClientRect: element position
        // entry.rootBounds: root position
        // entry.target: the observed element
      }
    });
  },
  // Config
  {
    root: null, // null = viewport (default!)
    threshold: 0.5, // Fire when 50% visible
    rootMargin: "0px", // Expand/shrink root bounds
  },
);

// 2. Start observing target(s)
observer.observe(targetElement1);
observer.observe(targetElement2); // Same observer, multiple targets!

// 3. Stop observing
observer.unobserve(targetElement1);

// 4. Disconnect all
observer.disconnect();
```

---

## §6. Callback: entries + isIntersecting

> Evgenii: _"Callback triggered in two cases: when target intersects and when intersection stops. That's why we have isIntersecting property. Array because multiple entries can intersect in a single event."_

```
CALLBACK DETAILS:
═══════════════════════════════════════════════════════════════

  callback(entries, observer)

  entries = Array of IntersectionObserverEntry:
  ┌─────────────────────────────────────────────┐
  │ entry.isIntersecting    → true/false!        │
  │ entry.intersectionRatio → 0.0 to 1.0         │
  │ entry.target            → the DOM element     │
  │ entry.boundingClientRect→ element position    │
  │ entry.rootBounds        → root position       │
  │ entry.time              → timestamp            │
  └─────────────────────────────────────────────┘

  WHY an ARRAY?
  Multiple elements can enter/exit viewport
  in the same event (fast scrolling!)

  FIRES when:
  ✅ Element ENTERS intersection → isIntersecting = true!
  ✅ Element LEAVES intersection → isIntersecting = false!
```

---

## §7. Native Level = 50× Faster!

> Evgenii: _"The intersection event is tracked on the native level instead of event level. On average, intersection observers perform 50 times faster than vanilla."_

```
PERFORMANCE COMPARISON:
═══════════════════════════════════════════════════════════════

  Vanilla (setInterval):
  ├── JavaScript level tracking
  ├── Runs on main thread
  ├── Triggers reflow (getBoundingClientRect!)
  ├── Blocks callback queue
  └── Performance: 1× (baseline)

  IntersectionObserver:
  ├── NATIVE level tracking (browser engine!)
  ├── Runs OUTSIDE main thread
  ├── NO reflow triggered
  ├── Batched async callbacks
  └── Performance: 50× FASTER! 🚀

  "Pretty safe to use in production apps." — Evgenii
```

---

## §8. MutationObserver — "Track DOM Subtree Changes!"

> Evgenii: _"MutationObserver is useful for text editors — track changes in subtree performantly. Also heavily used in drawing tools."_

```javascript
// ═══ MUTATION OBSERVER API ═══

const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    switch (mutation.type) {
      case "childList":
        console.log("Children added/removed!");
        console.log("Added:", mutation.addedNodes);
        console.log("Removed:", mutation.removedNodes);
        break;
      case "attributes":
        console.log(
          "Attribute changed:",
          mutation.attributeName,
          mutation.oldValue,
          "→",
          mutation.target.getAttribute(mutation.attributeName),
        );
        break;
      case "characterData":
        console.log("Text content changed!");
        break;
    }
  });
});

// Observe with config
mutationObserver.observe(targetElement, {
  childList: true, // Track child add/remove
  attributes: true, // Track attribute changes
  characterData: true, // Track text changes
  subtree: true, // Track ALL descendants!
  attributeOldValue: true, // Capture old attribute values
});
```

```
MUTATION OBSERVER USE CASES:
═══════════════════════════════════════════════════════════════

  Text Editors (contenteditable):
  → Track every character typed/deleted
  → Track formatting changes (bold, italic)
  → Build undo/redo history

  Drawing Tools:
  → Track SVG element additions/removals
  → Track attribute changes (position, color)

  Third-Party Script Monitoring:
  → Detect unwanted DOM modifications
  → Track ad injections
  → Security: detect XSS attempts
```

---

## §9. ResizeObserver — "Track Element Size Changes!"

> Evgenii: _"ResizeObserver tracks resize of elements. Heavily used in adaptive design, charting tools — trading app with 10 charts, resize observer updates toolbar as you resize."_

```javascript
// ═══ RESIZE OBSERVER API ═══

const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const { width, height } = entry.contentRect;
    console.log(`Element resized: ${width}×${height}`);

    // entry.contentRect: content box dimensions
    // entry.borderBoxSize: border box dimensions
    // entry.target: the observed element

    // Example: responsive chart
    if (width < 400) {
      entry.target.classList.add("compact");
    } else {
      entry.target.classList.remove("compact");
    }
  });
});

resizeObserver.observe(chartElement);
```

```
RESIZE OBSERVER USE CASES:
═══════════════════════════════════════════════════════════════

  Trading App Dashboard:
  ┌──────────┬──────────┬──────────┐
  │ Chart 1  │ Chart 2  │ Chart 3  │
  │          │          │          │
  │ Resize ←→│          │          │
  │ Observer │          │          │
  │ updates  │          │          │
  │ toolbar! │          │          │
  └──────────┴──────────┴──────────┘

  → 10 charts, each with ResizeObserver!
  → User resizes panel → chart re-draws!
  → No window.onresize needed!
  → Element-level precision!

  Other uses:
  • Responsive components (without media queries!)
  • Drawing tools (canvas resize!)
  • Text editors (dynamically adjust layout!)
```

---

## §10. Use Cases Deep Dive

```
OBSERVER API — REAL-WORLD PATTERNS:
═══════════════════════════════════════════════════════════════

  INTERSECTION OBSERVER:
  ┌── Virtualization ──────────────────────────┐
  │ Track when sentinel elements enter viewport │
  │ → Load/unload list items as user scrolls!   │
  └─────────────────────────────────────────────┘
  ┌── Lazy Loading ────────────────────────────┐
  │ Track when image placeholder enters viewport│
  │ → Replace with real image src!              │
  └─────────────────────────────────────────────┘
  ┌── Analytics ───────────────────────────────┐
  │ Track which sections user actually sees     │
  │ → "50% of users never see the footer!"     │
  └─────────────────────────────────────────────┘
  ┌── Infinite Scroll ─────────────────────────┐
  │ Track when "load more" sentinel appears     │
  │ → Fetch next page of data!                  │
  └─────────────────────────────────────────────┘

  MUTATION OBSERVER:
  ┌── WYSIWYG Editor ──────────────────────────┐
  │ Track contenteditable changes               │
  │ → Update toolbar state, save to model       │
  └─────────────────────────────────────────────┘

  RESIZE OBSERVER:
  ┌── Container Queries (polyfill!) ───────────┐
  │ Track element size, not window size         │
  │ → True component-level responsive design!   │
  └─────────────────────────────────────────────┘
```

---

## §11. Tự Code: Observer Implementations

```javascript
// ═══ LAZY IMAGE LOADER (IntersectionObserver) ═══

class LazyImageLoader {
  #observer;

  constructor(options = {}) {
    this.#observer = new IntersectionObserver(
      this.#handleIntersection.bind(this),
      {
        root: options.root || null,
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "100px",
      },
    );
  }

  #handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        // Load real image!
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        // Stop observing (already loaded!)
        this.#observer.unobserve(img);
      }
    });
  }

  observe(selector) {
    document.querySelectorAll(selector).forEach((img) => {
      this.#observer.observe(img);
    });
    return this;
  }

  disconnect() {
    this.#observer.disconnect();
  }
}

// Usage:
const lazyLoader = new LazyImageLoader({ rootMargin: "200px" });
lazyLoader.observe("img[data-src]");

// ═══ INFINITE SCROLL (IntersectionObserver) ═══

class InfiniteScroll {
  #observer;
  #loadMore;
  #sentinel;

  constructor(container, loadMoreFn) {
    this.#loadMore = loadMoreFn;

    // Create sentinel element
    this.#sentinel = document.createElement("div");
    this.#sentinel.className = "scroll-sentinel";
    this.#sentinel.style.height = "1px";
    container.appendChild(this.#sentinel);

    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.#loadMore();
        }
      },
      { threshold: 0 },
    );

    this.#observer.observe(this.#sentinel);
  }

  disconnect() {
    this.#observer.disconnect();
    this.#sentinel.remove();
  }
}

// Usage:
const scroller = new InfiniteScroll(
  document.getElementById("feed"),
  async () => {
    const items = await fetchNextPage();
    renderItems(items);
  },
);

// ═══ VIEWPORT ANALYTICS (IntersectionObserver) ═══

class ViewportAnalytics {
  #observer;
  #visibleSections = new Map();

  constructor() {
    this.#observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id || entry.target.className;
          if (entry.isIntersecting) {
            this.#visibleSections.set(id, Date.now());
          } else if (this.#visibleSections.has(id)) {
            const duration = Date.now() - this.#visibleSections.get(id);
            console.log(`Section "${id}" visible for ${duration}ms`);
            this.#visibleSections.delete(id);
          }
        });
      },
      { threshold: 0.5 },
    );
  }

  track(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      this.#observer.observe(el);
    });
  }
}

console.log("═══ OBSERVER API ═══");
console.log("IntersectionObserver: viewport visibility, 50× faster!");
console.log("MutationObserver: DOM subtree changes!");
console.log("ResizeObserver: element size changes!");
console.log("All native level = efficient, non-blocking!");
```

---

## Checklist

```
[ ] Observer API born from engineer pain!
[ ] 3 types: Intersection, Mutation, Resize!
[ ] Before: setInterval + getBoundingClientRect = hacky!
[ ] IntersectionObserver: target + root + threshold!
[ ] Callback fires on intersect START and STOP!
[ ] isIntersecting property to distinguish!
[ ] entries = array (multiple elements in one event!)
[ ] Native level tracking = 50× faster than vanilla!
[ ] MutationObserver: childList, attributes, characterData!
[ ] ResizeObserver: element-level resize (not window!)
[ ] Use cases: virtualization, lazy load, analytics, editors!
TIẾP THEO → Phần 12: IntersectionObserver Exercises!
```
