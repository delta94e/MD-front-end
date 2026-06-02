# "Why This Works" Explainer

## Overview
Add a "Why" action to the selection toolbar that explains not just WHAT code does, but WHY it was designed that way — design rationale, trade-offs, and alternatives. Different from existing "Explain" (which describes behavior).

## Phases

| # | Phase | Status | Progress |
|---|-------|--------|----------|
| 1 | API Endpoint + Prompt | completed | 100% |
| 2 | Selection Toolbar Integration | completed | 100% |
| 3 | Inline Card Differentiation | completed | 100% |

## Key Design Decisions

**Differentiator from "Explain":**
- "Explain" → "This function parses markdown headings using regex"
- "Why" → "Regex was chosen over a parser library because headings have simple, predictable syntax. A full AST parser would add 50KB+ for negligible accuracy gain."

**Prompt strategy:** The "Why" prompt must include surrounding code context (not just selected text) so the AI can reason about architectural decisions, not just describe behavior.

**Reuse:** Leverages existing inline-explain infrastructure (markers, streaming, save/dismiss). Only the API prompt and toolbar icon differ.

## Dependencies
- Existing: `app/api/explain/route.ts` (inline explain API)
- Existing: `components/selection-toolbar.tsx` (toolbar with actions)
- Existing: `components/content-viewer.tsx` (handles selection actions)
- Existing: `components/inline-explain-card.tsx` (inline card component)
