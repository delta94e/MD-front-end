# Inline Explain Feature Implementation

**Date**: 2026-05-29 16:12
**Severity**: Low
**Component**: Markdown Viewer / AI Explain
**Status**: Resolved

## What Happened

Implemented inline AI explanations that render directly below selected text in the markdown viewer, rather than opening a side panel. The feature lets users select a paragraph, click "Explain," and see a streaming explanation card appear right where they are reading. Save converts it to a blockquote; Dismiss strips it cleanly.

## The Brutal Truth

This went smoother than expected. The hardest part was not the streaming or the state management -- it was figuring out how to inject React components into a string-based markdown renderer. ReactMarkdown does not render HTML comment nodes, so the initial plan of just inserting `<!--inline-explain:ID-->` markers hit a wall immediately. Had to write a custom rehype plugin to convert those comments into renderable `div` elements with `data-explain-id` attributes. That detour cost maybe 30 minutes but the solution ended up being clean.

## Technical Details

The architecture uses three layers:

1. **State layer** (`lib/store.ts`): `ExplanationEntry` type with `id`, `selectedText`, `content`, `status` fields. Zustand store holds an `explanations` array with add/update/remove actions.

2. **Rendering layer** (`lib/rehype-inline-explain.ts`): Custom rehype plugin that walks the HAST tree, finds comment nodes matching `<!--inline-explain:ID-->`, and replaces them with `div` elements carrying `data-explain-id`. Plugin order matters -- `rehype-raw` must run before this plugin, and both must run before `rehype-prism-plus` and `rehype-annotate`.

3. **Wiring layer** (`components/content-viewer.tsx`): Intercepts the "explain" action from the selection toolbar, finds the paragraph boundary in the markdown string, inserts the marker, creates the store entry, and kicks off streaming via `fetch` + `ReadableStream` reader.

Key implementation detail: paragraph boundary detection uses `split("\n\n")` to find which paragraph contains the selected text, then inserts the marker after that paragraph's index. Falls back to appending at end if no match.

## What We Tried

- **First approach**: Just insert HTML comments and let ReactMarkdown handle it. Failed because ReactMarkdown silently skips comment nodes.
- **Second approach**: Custom rehype plugin to transform comments into `div` elements. Worked. The `rehype-raw` plugin converts raw HTML comments into HAST comment nodes, then our plugin transforms those into renderable elements.

No other significant detours. The streaming pattern was copied directly from the existing `/api/explain` endpoint client-side code.

## Root Cause Analysis

The only real friction was the ReactMarkdown limitation with HTML comments. This is documented behavior but easy to miss if you assume `rehype-raw` handles everything. The plan accounted for this risk ("ReactMarkdown does NOT render comment nodes by default") but the mitigation was listed as a revision, meaning the initial plan was slightly optimistic about how straightforward the marker approach would be.

## Lessons Learned

1. **Rehype plugin order is critical and fragile.** `rehype-raw` must come before any plugin that needs to see HTML-derived nodes. Document this in the markdown-viewer file with a comment -- future devs will trip on this.

2. **String-based markdown manipulation is inherently fragile.** The paragraph boundary detection using `split("\n\n")` will break on edge cases (code blocks with double newlines, list items). Acceptable for v1 but worth noting as tech debt.

3. **Ephemeral markers are the right call.** The alternative (persisting markers to the file) would pollute the markdown format with app-specific syntax. Keeping markers in-memory and only persisting via save-as-blockquote is cleaner.

4. **No concurrency limit is a conscious decision.** The plan noted "no limit" which means a user could spam Explain on 20 paragraphs and flood the API. Monitor for abuse but do not over-engineer preemptively.

## Next Steps

- Monitor for edge cases in paragraph detection (nested lists, code blocks, frontmatter)
- Consider adding a concurrency cap (plan suggests 5) if users report performance issues
- Test with very long explanations to verify the `max-height: 400px` + scroll works well
- Verify dark theme styling matches the purple accent spec in design guidelines
