## Code Review: Concept Map Generator

### Scope
- **Files reviewed:** `lib/concept-map-extractor.ts`, `components/concept-map.tsx`, `components/content-viewer.tsx`
- **LOC:** ~150 + ~235 + ~500 (component diff ~30 new lines for concept map integration)
- **Focus:** New concept map feature — correctness, edge cases, integration

### Overall Assessment
Solid feature with clean separation of concerns (extractor vs component). A few correctness bugs in link resolution and some minor issues worth fixing before merge.

---

### Critical Issues

None.

### High Priority

**1. Anchor link resolution has false-positive matching (concept-map-extractor.ts:126)**

```ts
const targetNode = nodes.find((n) => n.id === targetId || n.id.startsWith(targetId));
```

The `startsWith` check causes incorrect matches:
- Heading `[Get Started](#get-started)` slugs to `get-started`
- If `get-started` appears twice, the second node gets ID `get-started-1`
- `startsWith("get-started")` matches BOTH `get-started` AND `get-started-1`
- The link incorrectly attaches to the first match rather than the intended duplicate

Fix: compare against the exact slugified heading text, not `startsWith`. For deduplicated headings, the link should resolve to the first occurrence (index 0) explicitly:

```ts
const targetNode = nodes.find((n) => n.id === targetId);
if (!targetNode) {
  // fallback: find first node whose base slug matches (for deduplicated targets)
  const fallback = nodes.find((n) => n.id === targetId || n.id.startsWith(targetId + "-"));
  if (fallback) edges.push({ source: currentHeadingId, target: fallback.id, label: link.text });
  continue;
}
```

**2. DRY violation — `stripInline` duplicates `stripMarkdown` (concept-map-extractor.ts:38-46 vs toc-extractor.ts:24-31)**

`stripInline` in the extractor is functionally identical to `stripMarkdown` in `toc-extractor.ts`. This creates a divergence risk — if one is updated (e.g., to handle `__bold__` or `_italic_`), the other will silently fall out of sync, causing heading IDs to mismatch between the TOC and concept map.

Fix: export `stripMarkdown` from `toc-extractor.ts` and reuse it in `concept-map-extractor.ts`. Or move the shared utility to a common module.

**3. Heading parsing logic is also duplicated (concept-map-extractor.ts:31-35 vs toc-extractor.ts:53-54)**

Both files independently parse headings with the same regex pattern. The `extractConceptMap` function essentially reimplements `extractHeadings` with link extraction bolted on. This is the second DRY violation.

Fix: consider having `extractConceptMap` call `extractHeadings` internally for node extraction, then handle edges in a second pass.

### Medium Priority

**4. `graphRef` is dead code (concept-map.tsx:35)**

```ts
const graphRef = useRef<any>(null);
```

Declared and passed to `<ForceGraph2D ref={graphRef}>` but never read or used. Should either be removed or used for programmatic graph control (e.g., zoom-to-fit on search).

**5. No test coverage**

No tests exist for `extractConceptMap`. Edge cases worth testing:
- Empty markdown
- Headings inside fenced code blocks (``` and ~~~)
- Headings with inline formatting (`## **Bold** heading`)
- Duplicate headings (`## Intro` appearing twice)
- Anchor links with special characters
- File links with relative paths (`../../file.md`)
- Headings with only whitespace after `#`
- Lines like `#` with no text (should not be parsed)
- Nested code fences (indented ```)
- `~~~~` tildes as fence (not handled — see issue 6)

**6. Code fence detection only handles backtick fences, not tilde fences (concept-map-extractor.ts:89)**

```ts
if (line.trimStart().startsWith("```")) {
```

Per CommonMark spec, `~~~` is also a valid fenced code block delimiter. Content inside tilde fences will be incorrectly parsed for headings and links. Same issue exists in `toc-extractor.ts:46`.

**7. Concept map and TOC panels can both be open simultaneously (content-viewer.tsx:470-481)**

When both TOC and concept map are open, they consume 520px (200 + 320) of horizontal space. On a 1280px viewport, this leaves ~760px for content — acceptable but tight. Consider making them mutually exclusive, or collapsing the TOC when the concept map opens.

**8. Heading label retains inline formatting (concept-map-extractor.ts:98)**

The node ID is derived from `stripInline(text)`, but `label` is set to the stripped text too:

```ts
const text = stripInline(heading.text);
// ...
nodes.push({ id, label: text, ... });
```

This means a heading like `## **Important** Notes` gets label `"Important Notes"` (stripped). But in the graph, the label won't match the visual heading in the document. Consider using the raw heading text for `label` and the stripped version only for `id`.

### Low Priority

**9. `handleNodeHover` callback recreated every render (concept-map.tsx:176-178)**

```ts
const handleNodeHover = useCallback((node: any) => {
  setHoveredNodeId(node ? (node as ConceptNode).id : null);
}, []);
```

The `useCallback` with `[]` is correct here (stable reference), so this is fine. No action needed.

**10. Hardcoded `dark` class check for label color (concept-map.tsx:131)**

```ts
ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#374151";
```

Reads DOM directly during canvas render. Works but won't react to theme changes until the graph re-renders. Acceptable for canvas rendering where you can't use CSS variables.

**11. `console.log` statements in content-viewer.tsx (lines 209, 223-224, 226)**

Debug logging left in production code. Should be removed or guarded behind a dev flag.

---

### Positive Observations

- Clean separation: extractor is a pure function, component handles rendering only
- Good use of `useMemo` for expensive computations (concept map extraction, adjacency, search)
- Proper SSR handling with `dynamic` import for `ForceGraph2D`
- Code block tracking correctly skips headings inside fenced blocks
- Node deduplication handles repeated heading text
- Search, hover dimming, and click-to-scroll are well-implemented
- ResizeObserver for responsive graph dimensions

### Recommended Actions (Priority Order)

1. Fix anchor link `startsWith` false-positive matching (High #1)
2. Deduplicate `stripInline`/`stripMarkdown` and heading parsing logic (High #2, #3)
3. Add unit tests for `extractConceptMap` (Medium #5)
4. Remove dead `graphRef` code (Medium #4)
5. Remove `console.log` debug statements (Low #11)
6. Consider tilde fence support (Medium #6)

### Unresolved Questions

- Should file-link edges that target nonexistent files create phantom nodes or be silently dropped? Current behavior creates dangling edges.
- Should clicking a file-link node trigger navigation to that file in the file tree?
- Should concept map and TOC panels be mutually exclusive to save screen space?
