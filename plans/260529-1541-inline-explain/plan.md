---
title: "Inline Explain Feature"
description: "Append AI explanations inline below selected text in markdown viewer instead of opening the side panel"
status: completed
priority: P2
effort: 3h
branch: main
tags: [ai, inline, explain, markdown-viewer]
created: 2026-05-29
---

# Inline Explain — Implementation Plan

## Architecture Decision

**Chosen approach: Option A — Modify markdown string temporarily.**

The `MarkdownViewer` renders from a `content: string` prop via `ReactMarkdown`. To inject explanation cards inline, we insert HTML comment markers (`<!--inline-explain:id-->`) into the markdown string. A custom component override in `ReactMarkdown` renders these markers as `InlineExplainCard` React components.

**Why this approach:**
- No DOM manipulation or portal hacks — stays within React's declarative model
- Reuses the existing `ReactMarkdown` rendering pipeline
- Position is relative to markdown structure (paragraphs), not fragile pixel offsets
- Clean save/dismiss: either keep the blockquote or strip the marker from the string
- `rehype-raw` (already in `package.json`) handles HTML comment nodes in the HAST

**Alternatives rejected:**
- **Option B (Portal/overlay):** Breaks with scroll, hard to position relative to paragraph boundaries
- **Option C (Sibling rendering):** Requires splitting content into chunks and interleaving React components — complex, breaks TOC extraction and scroll spy

## Data Flow

```
User selects text → clicks "Explain" in SelectionToolbar
  → content-viewer intercepts "explain" action (does NOT open AI panel)
  → finds selected text's paragraph boundary in markdown string
  → inserts `<!--inline-explain:{id}-->` marker after that paragraph
  → creates ExplanationEntry in store (status: "streaming")
  → fires fetch to /api/explain with streaming response
  → chunks arrive → store.updateExplanation(id, { content: chunk })
  → MarkdownViewer re-renders with updated markdown string
  → ReactMarkdown's custom component override sees the marker
  → renders InlineExplainCard with streaming content

User clicks "Save":
  → convert explanation to permanent blockquote in markdown string
  → remove HTML comment marker
  → persist via writeFileContent (existing server action)

User clicks "Dismiss":
  → strip marker and any trailing whitespace from markdown string
  → remove entry from store
```

## Failure Modes

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Text-to-offset mismatch (DOM selection vs markdown string) | Medium | Card appears in wrong position | Use paragraph-level granularity, not character-level; fall back to appending at selection position |
| Streaming re-renders cause jank | Low | Poor UX | Buffer chunks in ref, flush to store on requestAnimationFrame |
| User selects text across multiple paragraphs | Low | Ambiguous insertion point | Anchor to the paragraph containing the END of selection |
| `rehype-raw` breaks existing annotation plugin | Low | Annotations stop working | Test annotation rendering after adding `rehype-raw`; `rehype-raw` runs before `rehype-annotate` in plugin order |
| Multiple explanations on same document | Medium | Performance | Cap at 5 concurrent explanations; warn user |

## Phases

### Phase 1: State & Component

**Files to modify:**
- `lib/store.ts` — add `ExplanationEntry` type and state/actions
- `components/inline-explain-card.tsx` — NEW file

**Files to read for context:**
- `components/ai-panel.tsx:113-163` — existing `ExplainTab` pattern (useCompletion usage)
- `components/annotation-popover.tsx` — card UI pattern reference

### Phase 2: Markdown Rendering

**Files to modify:**
- `components/markdown-viewer.tsx` — add `rehype-raw`, custom component for explain markers

**Files to read for context:**
- `lib/rehype-annotate.ts` — existing rehype plugin pattern

### Phase 3: Wiring & Save/Dismiss

**Files to modify:**
- `components/content-viewer.tsx` — intercept "explain" action, build modified markdown, handle save/dismiss

**Files to read for context:**
- `app/actions/files.ts:42-55` — existing `writeFileContent` server action

---

## Phase 1 — State & Component (1h)

### 1.1 Add `ExplanationEntry` to store (`lib/store.ts`)

```ts
export interface ExplanationEntry {
  id: string;
  selectedText: string;
  content: string;       // streamed explanation markdown
  status: "streaming" | "done" | "error";
  paragraphIndex: number; // which paragraph (0-indexed) to insert after
}
```

Add to `PKMStore` interface and implementation:
- `explanations: ExplanationEntry[]`
- `addExplanation(entry: ExplanationEntry): void`
- `updateExplanation(id: string, updates: Partial<ExplanationEntry>): void`
- `removeExplanation(id: string): void`

**Store is instantiated once** (zustand singleton). No lifetime concern.

### 1.2 Create `InlineExplainCard` (`components/inline-explain-card.tsx`)

Props:
```ts
interface InlineExplainCardProps {
  id: string;
  selectedText: string;
  content: string;
  status: "streaming" | "done" | "error";
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
}
```

Visual design (per `docs/design-guidelines.md`):
- Background: `bg-ai-glow-subtle` (purple tint)
- Border: 1px solid with `border-ai-glow` / purple accent
- Left border accent: 3px `--ai-glow` (matches blockquote pattern)
- Icon: `BookOpen` (Lucide) + "AI Explanation" label
- Selected text shown as muted quote above explanation
- Explanation rendered via `ReactMarkdown` with `remarkGfm`
- Streaming state: blinking cursor or `Loader2` spinner
- Buttons: "Save" (primary) and "Dismiss" (ghost)
- `max-height: 400px` with `overflow-y-auto`
- Entry animation: `fade-in` (200ms ease-out, per design guidelines)

### 1.3 Unit test

- Test store actions: add, update, remove explanations
- Test `InlineExplainCard` renders correctly in all 3 states (streaming, done, error)
- Test Save/Dismiss button callbacks fire

---

## Phase 2 — Markdown Rendering (45min)

### 2.1 Modify `MarkdownViewer` (`components/markdown-viewer.tsx`)

**Add `rehype-raw`** to the rehype plugin list so HTML comments become HAST nodes:
```tsx
import rehypeRaw from "rehype-raw";

// In component:
rehypePlugins={[
  rehypeRaw,  // Must come BEFORE rehypePrism
  [rehypePrism, { ignoreMissing: true }],
  [rehypeAnnotate, annotationParams],
]}
```

Plugin order matters: `rehype-raw` must run before `rehype-prism-plus` and `rehype-annotate` so the HTML comment is already converted to a HAST node before other plugins process text nodes.

**Add `explanations` prop** to `MarkdownViewer`:
```ts
interface MarkdownViewerProps {
  content: string;
  explanations?: ExplanationEntry[];
  onSaveExplanation?: (id: string) => void;
  onDismissExplanation?: (id: string) => void;
}
```

**Add custom component override** in the `components` prop of `ReactMarkdown`:

The HTML comment `<!--inline-explain:abc123-->` becomes a HAST `comment` node. `ReactMarkdown` does NOT render comment nodes by default. We need to handle this.

**Revised approach:** Since `ReactMarkdown` skips HTML comments, we need a custom rehype plugin that converts comment nodes matching the pattern into `div` elements with a data attribute, which `ReactMarkdown` CAN render via a custom component.

### 2.2 Create rehype plugin (`lib/rehype-inline-explain.ts`)

NEW file. Walks the HAST tree, finds comment nodes matching `<!--inline-explain:ID-->`, replaces them with:
```json
{
  "type": "element",
  "tagName": "div",
  "properties": { "data-explain-id": "ID", "className": ["inline-explain-marker"] },
  "children": []
}
```

### 2.3 Add custom component in MarkdownViewer

```tsx
div: ({ node, ...props }) => {
  const explainId = props["data-explain-id"];
  if (explainId && explanations) {
    const entry = explanations.find(e => e.id === explainId);
    if (entry) {
      return (
        <InlineExplainCard
          id={entry.id}
          selectedText={entry.selectedText}
          content={entry.content}
          status={entry.status}
          onSave={onSaveExplanation}
          onDismiss={onDismissExplanation}
        />
      );
    }
  }
  return <div {...props} />;
}
```

### 2.4 Unit test

- Test rehype plugin converts matching comment nodes to div elements
- Test non-matching comments pass through unchanged
- Test `MarkdownViewer` renders `InlineExplainCard` when explanation exists in props

---

## Phase 3 — Wiring & Save/Dismiss (45min)

### 3.1 Modify `content-viewer.tsx` — intercept "explain" action

In `handleSelectionAction`, add a branch for `action === "explain"`:

```ts
if (action === "explain") {
  const id = crypto.randomUUID();
  // 1. Find paragraph boundary in editorContent
  const paragraphIndex = findParagraphContaining(editorContent, text);
  // 2. Insert marker after that paragraph
  const marker = `\n\n<!--inline-explain:${id}-->\n\n`;
  const newContent = insertAfterParagraph(editorContent, paragraphIndex, marker);
  setEditorContent(newContent);
  // 3. Add explanation entry to store
  addExplanation({ id, selectedText: text, content: "", status: "streaming", paragraphIndex });
  // 4. Start streaming
  streamExplanation(id, text, newContent);
  return;
}
```

### 3.2 Helper functions (inline in content-viewer.tsx, not a new file)

**`findParagraphContaining(markdown, text)`**: Split markdown by `\n\n` (double newline = paragraph separator). Find the index of the paragraph containing `selectedText`. Return `-1` if not found (fallback: append at end).

**`insertAfterParagraph(markdown, index, marker)`**: Split by `\n\n`, insert marker after the paragraph at `index`, rejoin.

**`streamExplanation(id, text, fullContent)`**: Uses `fetch` with streaming reader (same pattern as `/api/explain` endpoint). On each chunk, calls `updateExplanation(id, { content: prev.content + chunk })`. On completion, sets status to `"done"`. On error, sets status to `"error"`.

### 3.3 Pass explanations to MarkdownViewer

```tsx
<MarkdownViewer
  content={editorContent}
  explanations={explanations}
  onSaveExplanation={handleSaveExplanation}
  onDismissExplanation={handleDismissExplanation}
/>
```

### 3.4 Save handler (`handleSaveExplanation`)

```ts
const handleSaveExplanation = useCallback((id: string) => {
  const entry = explanations.find(e => e.id === id);
  if (!entry) return;
  // Replace the HTML comment marker with a blockquote
  const marker = `<!--inline-explain:${id}-->`;
  const blockquote = `\n\n> **AI Explanation** (for: "${entry.selectedText.slice(0, 60)}...")\n>\n> ${entry.content.replace(/\n/g, "\n> ")}\n\n`;
  const newContent = editorContent.replace(marker, blockquote);
  setEditorContent(newContent);
  setDirty(true); // Mark as unsaved so user can Ctrl+S to persist
  removeExplanation(id);
  toast.success("Explanation saved to document");
}, [explanations, editorContent, setEditorContent, removeExplanation]);
```

### 3.5 Dismiss handler (`handleDismissExplanation`)

```ts
const handleDismissExplanation = useCallback((id: string) => {
  const marker = `<!--inline-explain:${id}-->`;
  // Remove marker + surrounding blank lines
  const newContent = editorContent.replace(/\n*\s*<!--inline-explain:[^>]+-->\n*/g, "");
  setEditorContent(newContent);
  removeExplanation(id);
}, [editorContent, setEditorContent, removeExplanation]);
```

### 3.6 Streaming implementation

Use native `fetch` + `ReadableStream` reader (same pattern as the API route's client side):

```ts
async function streamExplanation(id: string, selectedText: string, surroundingContext: string) {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedText, surroundingContext }),
    });
    if (!res.ok || !res.body) throw new Error("Failed to fetch explanation");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
      updateExplanation(id, { content: accumulated });
    }
    updateExplanation(id, { status: "done" });
  } catch (err) {
    updateExplanation(id, { status: "error" });
    toast.error("Failed to generate explanation");
  }
}
```

### 3.7 Integration test

- Select text → click Explain → verify inline card appears below correct paragraph
- Verify streaming content updates card in real-time
- Click Save → verify blockquote replaces marker, `dirty` flag set
- Click Dismiss → verify marker removed, card disappears
- Verify existing AI panel actions (Translate, Summarize, Rewrite) still work unchanged

---

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `lib/store.ts` | Modify — add ExplanationEntry, state, actions | 1 |
| `components/inline-explain-card.tsx` | Create — new component | 1 |
| `lib/rehype-inline-explain.ts` | Create — new rehype plugin | 2 |
| `components/markdown-viewer.tsx` | Modify — add rehype-raw, plugin, custom component | 2 |
| `components/content-viewer.tsx` | Modify — intercept explain, stream, save/dismiss | 3 |

## Success Criteria

1. Selecting text and clicking "Explain" shows a purple-accented card inline below the paragraph
2. Explanation streams in character by character
3. "Save" converts explanation to a blockquote in the document (user can Ctrl+S to persist to file)
4. "Dismiss" removes the card cleanly
5. Other selection toolbar actions (Annotate, Translate, Summarize, Rewrite) are unaffected
6. No existing tests broken
7. Works in both light and dark themes

## Decisions

1. **Concurrency**: No limit on concurrent inline explanations
2. **Save behavior**: Mark dirty only — user Ctrl+S to persist to file (consistent with edit flow)
3. **Persistence**: Ephemeral — markers lost on file reload unless saved as blockquotes
