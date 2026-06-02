# Code Review: "Why This Works" Explainer

**Reviewer:** code-reviewer
**Date:** 2026-05-30
**Files reviewed:** 7

---

## Scope

| File | Lines | Change Type |
|------|-------|-------------|
| `lib/ai-helpers.ts` | ~125 | Modified (added `whyExplain` prompt) |
| `app/api/why-explain/route.ts` | ~7 | New API route |
| `components/selection-toolbar.tsx` | ~136 | Modified (added "Why" button) |
| `components/content-viewer.tsx` | ~500 | Modified (why action handling) |
| `lib/store.ts` | ~156 | Modified (added `type` field) |
| `components/inline-explain-card.tsx` | ~116 | Modified (amber/purple differentiation) |
| `components/markdown-viewer.tsx` | ~356 | Modified (passes `type` to card) |

---

## Overall Assessment

The "why" flow is correctly wired end-to-end: toolbar button dispatches `"why"` action, `content-viewer` routes to `/api/why-explain` endpoint, streams response into an `InlineExplainCard` with amber styling. Type safety is clean. Two functional bugs and a few minor issues found.

---

## Critical Issues

None.

---

## High Priority

### 1. Save-to-document label ignores "why" type

**File:** `components/content-viewer.tsx:186-195`

`handleSaveExplanation` hardcodes `**AI Explanation**` and the toast `"Explanation saved to document"` regardless of whether the entry is type `"explain"` or `"why"`. A "why" explanation saved to the document will be mislabeled.

```ts
// Current (line 190)
const blockquote = `\n\n> **AI Explanation** (for: "${entry.selectedText...

// Should be
const label = entry.type === "why" ? "Why This Works" : "AI Explanation";
const blockquote = `\n\n> **${label}** (for: "${entry.selectedText...`;
```

Same for the toast on line 195 -- use `"Why saved to document"` for `"why"` type.

### 2. Dead code block filtering in `selection-toolbar.tsx`

**File:** `components/selection-toolbar.tsx:96-106`

The comment on line 97 says "Inside code blocks: only show Annotate" and the `inCodeBlock` state is computed (line 67), but `actions` is set to `allActions` unconditionally (line 106). The `inCodeBlock` state is never consumed. This means "Explain", "Why", "Translate", etc. all appear inside code blocks, which contradicts the comment's intent and the original design.

```ts
// Line 106 — currently:
const actions = allActions;

// Should be:
const actions = inCodeBlock
  ? allActions.filter((a) => a.id === "annotate")
  : allActions;
```

If showing all actions inside code blocks is intentional, remove the dead `inCodeBlock` state and the misleading comment to avoid confusion.

---

## Medium Priority

### 3. Hardcoded amber color outside design token system

**File:** `components/inline-explain-card.tsx:28-29`

The "why" accent color `oklch(0.7 0.15 80)` is hardcoded inline rather than using a CSS custom property. The design guidelines define `--ai-glow` (purple) and `--ai-glow-subtle` as design tokens but have no amber/why token. This means:

- The color cannot be overridden by theme switching (light vs dark)
- It's inconsistent with how other colors are managed in `globals.css`

**Recommendation:** Add `--why-glow` and `--why-glow-subtle` tokens to `globals.css` for both light and dark themes, then reference them in the component:

```css
/* dark theme */
--why-glow: oklch(0.7 0.15 80);
--why-glow-subtle: oklch(0.7 0.15 80 / 10%);

/* light theme */
--why-glow: oklch(0.55 0.15 80);
--why-glow-subtle: oklch(0.55 0.15 80 / 10%);
```

### 4. Icon mismatch: Lightbulb not in design guidelines icon table

**File:** `docs/design-guidelines.md` Section 5

The design guidelines icon table lists `bot` for "Explain" but has no entry for the new "Why" / `Lightbulb` icon. Should be added for consistency.

### 5. No input validation on `selectedText` size in why-explain route

**File:** `app/api/why-explain/route.ts:6`

The route passes `selectedText` directly into the prompt with no length limit. A user could select an entire large document and send it as the "selected text", resulting in a massive prompt. The `surroundingContext` is truncated to 2000 chars but `selectedText` is not.

This matches the existing pattern in `/api/explain` so it's not a regression, but worth noting.

---

## Low Priority

### 6. `console.log` left in toolbar click handler

**File:** `components/selection-toolbar.tsx:122`

```ts
console.log("[SelectionToolbar] onClick", id, selectedText.slice(0, 50));
```

And `content-viewer.tsx:209`:
```ts
console.log("[ContentViewer] handleSelectionAction", action, text.slice(0, 50));
```

These debug logs will appear in production browser consoles. Remove or gate behind `process.env.NODE_ENV === "development"`.

### 7. `type` field is optional with no runtime default

**File:** `lib/store.ts:25`

```ts
type?: "explain" | "why"; // default: "explain"
```

The comment says "default: explain" but there's no runtime default in the store. The default is applied downstream in `InlineExplainCard` (line 23: `type = "explain"`). This works but is fragile -- if another consumer reads `entry.type` without the default, it could be `undefined`.

**Recommendation:** Make it non-optional with a default at the store level, or keep optional and document that consumers must handle `undefined`.

---

## Flow Verification

| Step | Status | Notes |
|------|--------|-------|
| Toolbar renders "Why" button | OK | Lightbulb icon, correct label |
| Click dispatches `"why"` action | OK | `onAction("why", selectedText)` |
| Content-viewer creates explanation entry | OK | `type: "why"` set correctly |
| Routes to `/api/why-explain` | OK | Endpoint correct |
| API uses `whyExplain` system prompt | OK | Design rationale focus |
| Stream updates card content | OK | Same streaming pattern as explain |
| Card renders amber styling | OK | Visual differentiation works |
| `type` passed through MarkdownViewer | OK | `entry.type` forwarded to card |
| Save-to-document | **BUG** | Label says "AI Explanation" not "Why" |

---

## Positive Observations

- Clean reuse of `createStreamingRoute` factory -- zero boilerplate duplication
- `ExplanationEntry.type` is backward-compatible (optional field)
- Amber/purple color differentiation is a good UX choice for distinguishing card types
- The `InlineExplainCard` component handles the type prop cleanly with `isWhy` boolean

---

## Recommended Actions (Priority Order)

1. Fix `handleSaveExplanation` to label "why" entries correctly (High)
2. Fix or remove dead `inCodeBlock` filtering in selection toolbar (High)
3. Add `--why-glow` CSS tokens for theme consistency (Medium)
4. Add `Lightbulb` to design guidelines icon table (Medium)
5. Remove debug `console.log` calls (Low)
