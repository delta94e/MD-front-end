## Code Review Summary

### Scope
- Files: `components/code-playground.tsx`, `components/markdown-viewer.tsx`, `lib/ai-helpers.ts`, `app/api/generate-exercises/route.ts`, `components/ai-panel.tsx`
- LOC: ~792 added / 139 removed across 14 files (this review covers 5 key files)
- Focus: autoRun feature, exercise generation API, ExerciseTab UI
- Scout findings: className parsing fragility, API error leaks, no response validation

### Overall Assessment
Functional implementation with a few production-risk items. The auto-run pattern is a common mount-only idiom that works correctly here. The API route has error message leakage that should be fixed before shipping. The exercise UI works but trusts AI response data without validation, which will cause runtime crashes on malformed outputs.

---

### Critical Issues

None.

---

### High Priority

**H1. API route leaks internal error details to client**
File: `/Users/truongnguyen/MD-front-end/app/api/generate-exercises/route.ts`, lines 39-44 and 62-63

```typescript
// Line 40: upstream error text passed verbatim to client
const errText = await response.text();
return NextResponse.json(
  { error: `Mimo API error: ${response.status} - ${errText}` },
  { status: response.status }
);

// Line 63: internal error message passed verbatim
const message = err instanceof Error ? err.message : "Internal server error";
return NextResponse.json({ error: message }, { status: 500 });
```

The upstream Mimo API error text could contain internal URLs, API key fragments, or infrastructure details. The catch block leaks Node.js error messages (e.g., network errors with internal hostnames).

Fix: Return generic error messages to the client, log the details server-side.
```typescript
console.error("[generate-exercises] Mimo API error:", response.status, errText);
return NextResponse.json(
  { error: `Upstream service error (${response.status})` },
  { status: response.status }
);
```

**H2. No input type validation on API route**
File: `/Users/truongnguyen/MD-front-end/app/api/generate-exercises/route.ts`, line 9

```typescript
const { content } = await req.json();
if (!content) { ... }
```

`content` could be a number, boolean, object, or array. The `!content` check only catches falsy values. Passing `{ content: 0 }` or `{ content: [] }` would pass validation but produce unexpected behavior. The `content.slice(0, 4000)` on line 31 would throw if content is not a string.

Fix:
```typescript
const { content } = await req.json();
if (typeof content !== "string" || !content.trim()) {
  return NextResponse.json({ error: "Content must be a non-empty string" }, { status: 400 });
}
```

**H3. Exercise response data not validated before rendering**
File: `/Users/truongnguyen/MD-front-end/components/ai-panel.tsx`, lines 425-429

```typescript
const data = await res.json();
if (data.error) {
  setError(data.error);
} else {
  setExercises(data);  // trusts shape completely
}
```

If the AI returns malformed JSON (e.g., quiz without `options`, `correctIndex` out of bounds, missing `code` field), the component will crash at render time. The `Exercise` TypeScript type provides compile-time safety only -- the runtime data from the API is untyped.

Fix: Add runtime validation before setting state.
```typescript
function isValidExerciseArray(data: unknown): data is Exercise[] {
  return Array.isArray(data) && data.every(ex =>
    typeof ex === "object" && ex !== null &&
    "type" in ex && "explanation" in ex &&
    (ex.type === "predict-output" || ex.type === "fix-bug" || ex.type === "quiz")
  );
}
// ...
if (isValidExerciseArray(data)) {
  setExercises(data);
} else {
  setError("Invalid exercise format received");
}
```

---

### Medium Priority

**M1. Greedy JSON extraction regex**
File: `/Users/truongnguyen/MD-front-end/app/api/generate-exercises/route.ts`, line 50

```typescript
const jsonMatch = text.match(/\[[\s\S]*\]/);
```

This regex is greedy. If the AI response contains multiple arrays or the array is embedded in prose with `[` and `]` characters, it could match too broadly. Example: "Here are the exercises: [note: ...] [ {...}, {...} ]" would capture the outer brackets including the note.

Fix: Use a non-greedy match or find the first `[` and last `]` more carefully. Or better yet, instruct the prompt to return ONLY JSON (already done) and use `JSON.parse` directly after trimming markdown code fences.

**M2. className "run" keyword may not survive rehype processing**
File: `/Users/truongnguyen/MD-front-end/components/markdown-viewer.tsx`, lines 37-39

```typescript
const parts = className?.replace("language-", "").split(/\s+/) ?? [];
const language = parts[0] ?? "";
const autoRun = parts.includes("run");
```

When markdown has ````js run`, remark-parse sets `lang="js"` and `meta="run"`. remark-rehype creates `<code class="language-js run">`. However, rehype-prism-plus may normalize the `<pre>` element's className to only include the language part (dropping meta). If "run" is stripped by rehype-prism-plus, `autoRun` will always be `false` and the feature silently does nothing.

Recommendation: Verify with a test markdown file containing ````js run` that the feature actually triggers. If it doesn't, consider reading the meta from the `<code>` element's className instead, or using a custom rehype plugin to propagate meta to a data attribute.

**M3. No rate limiting on exercise generation endpoint**
File: `/Users/truongnguyen/MD-front-end/app/api/generate-exercises/route.ts`

The endpoint calls an external paid API (Mimo) with no rate limiting or abuse protection. A single user could spam the endpoint and rack up API costs. This applies to other API routes too, but exercise generation is particularly expensive since it generates 5 exercises per call.

**M4. ai-panel.tsx exceeds 200-line guideline**
File: `/Users/truongnguyen/MD-front-end/components/ai-panel.tsx` -- 563 lines

The file contains 6 tab components (SummarizeTab, ExplainTab, TranslateTab, WriteTab, ExerciseTab, AiResponse) plus ExerciseCard plus the main AiPanel. The ExerciseTab and ExerciseCard (~175 lines combined) are self-contained and good candidates for extraction.

---

### Low Priority

**L1. Quiz correctIndex bounds not validated**
File: `/Users/truongnguyen/MD-front-end/components/ai-panel.tsx`, line 383

If the AI returns `correctIndex: 5` for a 4-option quiz, no option highlights as correct on reveal. Not a crash, but confusing UX. The runtime validation in H3 should also check this.

**L2. ExerciseCard uses array index as React key**
File: `/Users/truongnguyen/MD-front-end/components/ai-panel.tsx`, line 467

```typescript
{exercises.map((ex, i) => (
  <ExerciseCard key={i} ...
```

Using index as key is fine here since the exercise list is static (generated once, not reordered). Not a bug, just noting it.

**L3. Duplicate function: getTextFromChildren vs getTextContent**
File: `/Users/truongnguyen/MD-front-end/components/markdown-viewer.tsx`, lines 19-27 and 104-112

`getTextFromChildren` and `getTextContent` are identical functions. One should be removed.

---

### Positive Observations

1. The auto-run useEffect with empty deps is a correct mount-only pattern for this use case. The eslint-disable is justified.
2. The sandbox iframe uses `sandbox="allow-scripts"` attribute, which is good security practice.
3. The 5-second timeout in the sandbox prevents infinite loops from hanging the UI.
4. The 4000-char slice on content prevents sending excessively large payloads to the AI API.
5. The Exercise discriminated union type is well-designed and makes the ExerciseCard rendering clean.
6. The two-row tab layout (4 primary + 6 secondary) is a good UX improvement over cramming 8 tabs into one row.

---

### Recommended Actions
1. **Before merge**: Fix API error message leakage (H1) -- trivial fix, real security risk
2. **Before merge**: Add input type validation on API route (H2) -- prevents runtime crash
3. **Before merge**: Add runtime validation for exercise response (H3) -- prevents render crash on malformed AI output
4. **Verify**: Test that ````js run` in markdown actually triggers auto-run (M2)
5. **Soon**: Extract ExerciseTab/ExerciseCard to separate file (M4)
6. **Later**: Add rate limiting to API routes (M3)

---

### Metrics
- Type Coverage: Good (Exercise discriminated union, proper interfaces)
- Test Coverage: No tests visible for new code
- Linting Issues: 1 eslint-disable (justified)
- File Size: ai-panel.tsx at 563 lines (exceeds 200-line guideline)

---

### Unresolved Questions
1. Does rehype-prism-plus preserve the "run" meta string in the `<pre>` element's className? If not, the auto-run feature is silently broken.
2. Should the exercise generation endpoint require authentication or have rate limiting before production?
3. Is the `DailyDevTab` component new in this diff? It's imported and rendered but wasn't listed in the review scope.
