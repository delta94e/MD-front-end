# Force-Directed Knowledge Graph: Library Comparison

**Date:** 2026-05-29 | **Context:** Next.js 15 App Router, ~200-500 nodes (markdown files), grouped by category

---

## Comparison Matrix

| Criteria | d3-force (vanilla) | react-force-graph-2d | @visx/force | react-graph-vis | sigma.js + graphology |
|---|---|---|---|---|---|
| **npm package** | `d3-force` (~7KB gzip) | `react-force-graph-2d` (~55KB gzip) | `@visx/force` (~5KB gzip) | `react-graph-vis` (~160KB gzip) | `@react-sigma/core` + `graphology` (~120KB gzip) |
| **Rendering** | You choose (SVG/Canvas) | Canvas 2D | SVG (React DOM) | Canvas (vis-network) | WebGL |
| **React integration** | Manual (ref + useEffect) | Good (React component, props) | Excellent (React components) | Poor (unmaintained wrapper) | Good (@react-sigma/core hooks) |
| **200-500 node perf** | Depends on renderer | Excellent (Canvas) | Mediocre (SVG DOM) | Good (Canvas) | Excellent (WebGL, overkill) |
| **Touch/mobile** | Manual (d3-zoom) | Built-in zoom/pan/drag | Manual via d3-zoom | Built-in | Built-in |
| **Clustering** | Manual (forceX/forceY) | Manual (custom forces) | Manual (forceX/forceY) | Built-in cluster API | graphology-communities-louvain |
| **Custom node render** | Full control (draw anything) | `nodeCanvasObject` prop | Full SVG control | Limited (shapes/colors) | Sigma reducers |
| **Zoom/pan/click/hover** | Build yourself | Props: `onNodeClick`, `onNodeHover`, built-in zoom | Build yourself | Built-in | Built-in via @react-sigma |
| **SSR (Next.js)** | `dynamic({ ssr: false })` | `dynamic({ ssr: false })` | Works SSR (SVG) | `dynamic({ ssr: false })` | `dynamic({ ssr: false })` |
| **Maintenance** | D3 core (excellent) | Active (vasturiano, 2.7k GH stars) | Airbnb visx (moderate activity) | Abandoned/unmaintained | Active (v3+) |

---

## Eliminated Options

1. **react-graph-vis** -- Unmaintained. The original wrapper (crubier/react-graph-vis) has not seen significant updates. Community forks exist but lack stability guarantees. Skip.

2. **@visx/force** -- SVG-based rendering degrades badly at 200-500 nodes (SVG DOM overhead). Also requires building zoom/pan/click from scratch. Wrong tool for this scale.

3. **sigma.js + graphology** -- Powerful but overkill. WebGL is unnecessary for 200-500 nodes. The graphology ecosystem adds complexity (separate layout, separate renderer, separate React bindings). Best for 10k+ nodes or when you need advanced graph analytics (community detection, centrality).

---

## Top 2 Contenders

### Option A: react-force-graph-2d (Recommended)

**Why it wins:**
- Single `<ForceGraph2D graphData={...} />` component -- works in minutes
- Built-in zoom/pan/drag/touch -- zero config
- `nodeCanvasObject` for custom rendering (draw file names, color by category)
- `onNodeClick`, `onNodeHover`, `nodeLabel` for interactivity
- Canvas rendering handles 200-500 nodes at 60fps trivially
- SSR: `next/dynamic` with `ssr: false` is well-documented pattern
- Active maintenance, 2.7k GitHub stars
- Under the hood uses d3-force -- so D3 familiarity applies

**Trade-offs:**
- ~55KB gzipped (includes d3-force + d3-zoom + d3-drag)
- Canvas tooltips require manual positioning (HTML overlay pattern)
- Less granular control than raw d3-force for exotic force configurations

**Clustering approach:** Use `forceX`/`forceY` with category-based target positions, or `nodeCanvasObject` to draw cluster backgrounds. No built-in cluster API, but straightforward to implement.

### Option B: d3-force directly

**Why consider:**
- Maximum control over physics, rendering, and interaction
- Smallest bundle (d3-force alone is ~7KB gzip)
- Full D3 ecosystem access (d3-zoom, d3-quadtree, etc.)

**Why not:**
- Must build everything: canvas renderer, zoom/pan, hit detection, touch events, animation loop
- 2-3x more code than react-force-graph-2d for the same result
- Risk of D3/React DOM conflicts if using SVG
- Weeks of extra work for features react-force-graph-2d provides out of the box

---

## Recommendation: react-force-graph-2d

**Ranked choice:** `react-force-graph-2d` > `d3-force` (raw) > `sigma.js` (only if 10k+ nodes needed later)

**Rationale:** react-force-graph-2d is built on d3-force (preserving D3 familiarity), wraps it in a clean React component with built-in interactivity, and uses Canvas for performance. It eliminates the boilerplate of raw d3-force while retaining full custom rendering via `nodeCanvasObject`. For 200-500 nodes with category grouping, file name labels, and click/hover interactions, it hits the sweet spot of DX, performance, and bundle size.

**SSR pattern for Next.js 15 App Router:**
```tsx
"use client";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div>Loading graph...</div>,
});
```

---

## Unresolved Questions

1. Does the project already use any D3 modules? If `d3-zoom` or `d3-selection` are already in the bundle, the incremental cost of react-force-graph-2d drops further.
2. What is the expected interaction model for "grouped by category" -- visual cluster boundaries (hulls), color coding only, or collapsible groups?
3. Is offline/mobile-first a requirement? Canvas touch events work, but performance on low-end devices at 500 nodes should be tested.
