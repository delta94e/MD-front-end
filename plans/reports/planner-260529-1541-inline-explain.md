# Planner Report: Inline Explain Feature

**Date:** 2026-05-29
**Plan:** `/Users/truongnguyen/MD-front-end/plans/260529-1541-inline-explain/plan.md`

## Summary

Created a 3-phase plan for the Inline Explain feature. The core architecture decision is **Option A (modify markdown string temporarily)** — inserting HTML comment markers (`<!--inline-explain:id-->`) into the markdown content, which a custom rehype plugin converts to renderable elements, and a ReactMarkdown component override renders as `InlineExplainCard` components.

## Architecture Decision

Option A chosen over portals (breaks on scroll) and sibling rendering (complex chunking). The approach leverages `rehype-raw` (already in `package.json`) + a small custom rehype plugin to bridge HTML comments into React components within the existing rendering pipeline.

## Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| 1. State & Component | `lib/store.ts` (add ExplanationEntry), `components/inline-explain-card.tsx` (new) | 1h |
| 2. Markdown Rendering | `lib/rehype-inline-explain.ts` (new plugin), `components/markdown-viewer.tsx` (add rehype-raw + custom component) | 45min |
| 3. Wiring & Save/Dismiss | `components/content-viewer.tsx` (intercept explain, streaming, save/dismiss handlers) | 45min |

## Key Risks

- **Text-to-offset mismatch** (Medium): Mitigated by using paragraph-level granularity, not character-level
- **rehype-raw + rehype-annotate ordering** (Low): Must place `rehype-raw` first in plugin array
- **Streaming re-render jank** (Low): Buffer in ref, flush per-RAF

## Open Questions

1. Cap concurrent explanations? (Suggest: 5)
2. Save to file directly or mark-dirty? (Suggest: mark-dirty, consistent with existing flow)
3. Markers survive file reload? (Suggest: no, ephemeral by design)
