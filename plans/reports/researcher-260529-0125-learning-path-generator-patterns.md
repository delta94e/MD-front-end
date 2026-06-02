# Research: AI-Powered Learning Path Generator Patterns

**Date**: 2026-05-29
**Context**: Next.js app with 485 markdown files (frontend topics), Vercel AI SDK + Claude/Gemini

---

## 1. Knowledge Graph from Markdown Files

**Current state**: No frontmatter in markdown files. Files use H1 title, blockquote description, and TOC. Topics organized by directory (javascript/, react/, typescript/, browser/, css/, security/, performance/).

**Recommended approach**: Build graph in two layers:

| Layer | Data | Source |
|-------|------|--------|
| **Structural** | category, file path, title | Directory name + H1 heading (already parsed in `lib/fs.ts`) |
| **Semantic** | prerequisites, difficulty, tags | LLM extraction (one-time batch) or manual frontmatter |

**Graph structure** (adjacency list, not Neo4j):

```ts
interface TopicNode {
  id: string;           // relative path
  title: string;        // from H1
  category: string;     // directory name
  difficulty: 1 | 2 | 3;
  tags: string[];
  prerequisites: string[];  // ids of other TopicNodes
  estimatedMinutes: number;
}
```

**Why adjacency list over graph DB**: 485 nodes is small. JSON file or Zustand store handles it. No need for Neo4j/graph database. Build-time JSON index (like existing `buildFileTree`) is sufficient.

**Prerequisite extraction strategy**: Use LLM once to batch-analyze file titles + first 500 chars, output prerequisite relationships. Store as static JSON. Re-run when files change (SSR/ISR pattern already in use).

---

## 2. UX Patterns for Study Paths

**Ranked by fit for this project**:

| Pattern | Fit | Why |
|---------|-----|-----|
| **Vertical timeline/roadmap** | Best | Matches existing sidebar + content viewer layout. roadmap.sh style. |
| **Syllabus with progress** | Good | Coursera/Udemy pattern. Collapsible modules, checkmarks. |
| **Node graph (Duolingo)** | Overkill | Requires complex graph visualization library. YAGNI. |

**Recommended**: Vertical timeline with:
- Nodes connected by lines (prerequisite edges)
- Color-coded by category (JS=yellow, React=blue, TS=blue-dark)
- Difficulty badges (1-3 stars, matching existing pattern in files)
- Click node to open file in existing content viewer
- Progress tracking via Zustand (already in `lib/store.ts`)

**Component**: Use existing `react-arborist` for tree view OR build simple vertical list with Tailwind. Avoid new graph visualization libs.

---

## 3. LLM for Learning Path Generation

**Vercel AI SDK `generateObject` with Zod** is the right tool. Key API pattern:

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const LearningPathSchema = z.object({
  title: z.string(),
  description: z.string(),
  steps: z.array(z.object({
    fileId: z.string(),
    title: z.string(),
    reason: z.string(),         // why this order
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedMinutes: z.number(),
  })),
  totalEstimatedMinutes: z.number(),
});

const { output } = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  output: Output.object({ schema: LearningPathSchema }),
  prompt: `Given these topics: ${topicIndexJson}
Generate a learning path for: "${userGoal}"
Respect prerequisites. Order from foundation to advanced.`,
});
```

**Key decisions**:
- Use `Output.object()` (not `Output.array()`) since learning path is a single structured object with nested array
- Pass topic index (id, title, category, prerequisites, difficulty) as JSON context, not full file content
- Use Claude Sonnet for quality; Gemini Flash for cost-sensitive batch operations
- Stream with `elementStream` if showing steps progressively

**Route pattern**: Add `/api/learning-path/route.ts` following existing `createStreamingRoute` pattern in `lib/ai-helpers.ts`.

---

## 4. Extract Topic Metadata from Markdown

**Current files have no frontmatter**. Three options:

| Approach | Pros | Cons |
|----------|------|------|
| **A. Add frontmatter to all 485 files** | Clean, standard, fast parsing | Manual work or risky batch edit |
| **B. LLM batch extraction** | No file changes needed | Cost (~$2-5 one-time), latency |
| **C. Hybrid: parse what exists + LLM for rest** | Best of both | More code |

**Recommended: Option C (Hybrid)**

1. **Parse existing structure** (free, deterministic):
   - Title: first H1 heading
   - Category: parent directory name
   - Difficulty: look for existing patterns (some files already have difficulty markers like "Do kho: 3 stars")
   - Estimated time: look for "thoi gian doc" patterns

2. **LLM enrichment** (one-time, store as JSON):
   - Tags extraction from content
   - Prerequisite inference from content references
   - Difficulty normalization

**Implementation**: Build-time script that:
1. Reads all 485 files via existing `readDirRecursive`
2. Extracts structural metadata (regex)
3. Batches remaining extraction to LLM (10-20 files per call)
4. Outputs `topic-index.json` consumed by the app

**Storage**: `lib/topic-index.json` (static, rebuilt on content change). Import in server components.

---

## Architectural Fit

| Concern | Assessment |
|---------|-----------|
| **Bundle size** | Zero new deps. Uses existing `ai` SDK, `zod`, `zustand` |
| **Server/client split** | LLM calls in API routes (server). Path display in client components. |
| **Caching** | Topic index is static JSON. Learning paths generated on-demand, cacheable. |
| **Existing patterns** | Follows `createStreamingRoute` + `streamText` pattern from `lib/ai-helpers.ts` |

---

## Unresolved Questions

1. Should learning paths be user-specific (persisted) or session-only?
2. How to handle files that reference each other circularly (e.g., JS closures <-> scope)?
3. Should the topic index auto-rebuild on file changes or require manual trigger?
4. Priority: is this feature more important than other planned features?
