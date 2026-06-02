# Edge-Building for Knowledge Graph (No Cross-References)

## Context

485 markdown files, standalone deep-dives, zero wikilinks/internal links. Only index: `README.md` with structured tables per category. No frontmatter, no inline `#tags`. Files use `---` as section dividers only.

---

## Approach Analysis

### 1. README Topic Index — **RECOMMENDED for V1**

Parse `README.md` tables. Each section (e.g., `## JavaScript`) already maps files to categories. Edges = files sharing a category.

- **Quality**: High. Human-curated, semantically meaningful groupings (21 categories).
- **Complexity**: Trivial. One regex pass over README.
- **Performance**: O(n) — 485 files, instant.
- **Edge weight**: Uniform within category, or boost by table proximity (adjacent rows = higher weight).
- **Limitation**: No cross-category edges. A JS file about Promises and a React file about useEffect won't connect.

### 2. Directory Co-Location — **RECOMMENDED (combine with #1)**

Files in same folder are siblings. Essentially same signal as README categories (folder = category).

- **Quality**: Same as README but misses sub-categories (e.g., `nextjs/core/` vs `nextjs/caching/`).
- **Complexity**: Zero. Just `path.dirname()`.
- **Enhancement**: Use subdirectory depth for finer granularity. `nextjs/core/` and `nextjs/caching/` share parent `nextjs/` but are distinct sub-groups.

### 3. Content Similarity (Headings) — **NOT recommended for V1**

Sampled headings: 541 files share "Muc Luc" (TOC), 119 share "Self-Assessment Checklist", 82 share interview pattern headings. These are **structural templates, not semantic signals**. Extracting meaningful topic headings requires filtering out boilerplate, which is fragile.

- **Quality**: Low without heavy filtering. High false-positive rate.
- **Complexity**: Medium. Need heading extraction + stoplist.
- **Risk**: Produces noisy edges (all files connect via "Checklist" heading).

### 4. Tag Extraction — **NOT APPLICABLE**

No frontmatter found. `---` used as section dividers. No inline `#tags`. Would require retrofitting all 485 files.

### 5. Filename Keyword Overlap — **Bonus signal, low cost**

Filenames are descriptive kebab-case (e.g., `React-Scheduler-Deep-Dive.md`, `React-Scheduler-SourceP1-Deep-Dive.md`). Shared tokens like `React`, `Scheduler` indicate relatedness.

- **Quality**: Medium. Good for detecting near-duplicates and sub-topics.
- **Complexity**: Low. Split filename on `-`, compute Jaccard similarity.
- **Performance**: O(n^2) pairwise but n=485, so ~117K comparisons — trivial at build time.

---

## Recommended V1 Strategy

**Combine approaches 1 + 2 + 5 in a layered edge model:**

| Edge Type | Source | Weight | Example |
|-----------|--------|--------|---------|
| `category` | README table section | 1.0 | All 48 JS files connected |
| `subfolder` | Directory path | 0.8 | `nextjs/core/` files vs `nextjs/caching/` |
| `filename-similarity` | Shared filename tokens (Jaccard > 0.5) | 0.5 | `React-Scheduler-*.md` files |
| `cross-category-keyword` | Shared tokens across categories | 0.3 | "Performance" in `browser/` and `performance/` |

**Build-time pre-computation:**
1. Parse README once → category map (JSON).
2. Walk directory tree → folder map (JSON).
3. Tokenize filenames → similarity matrix (JSON).
4. Merge into single edge list with weighted edges.
5. Output: `graph.json` (~50KB estimated for 485 nodes).

**Runtime:** Load pre-built `graph.json`. No on-demand computation needed.

---

## Trade-off Matrix

| Criteria | README | Directory | Headings | Tags | Filename |
|----------|--------|-----------|----------|------|----------|
| Signal quality | High | High | Low | N/A | Medium |
| Implementation cost | Trivial | Trivial | Medium | N/A | Low |
| Cross-category edges | No | No | Noisy | N/A | Yes |
| Maintenance | Update README | Auto | Auto | Manual | Auto |
| V1 recommendation | YES | YES | NO | NO | Bonus |

---

## Unresolved Questions

1. **Sub-category granularity**: Should `nextjs/core/` and `nextjs/caching/` be separate clusters or merged under `nextjs`?
2. **Cross-category threshold**: What Jaccard threshold for filename similarity produces useful cross-category edges without noise?
3. **Graph format**: JSON adjacency list vs edge list? Affects downstream visualization (D3, Cytoscape, etc.)
4. **Edge directionality**: Are edges bidirectional by default, or should "prerequisite" relationships be modeled (e.g., JS basics → React hooks)?
