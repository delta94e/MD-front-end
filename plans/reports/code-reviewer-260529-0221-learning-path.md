## Code Review: AI Learning Path Generator

### Scope
- New: `lib/topic-index.ts`, `lib/learning-path-types.ts`, `app/api/learning-path/route.ts`, `components/learning-path-tab.tsx`
- Modified: `app/actions/files.ts`, `components/ai-panel.tsx`, `components/keyboard-help-dialog.tsx`
- TypeScript: clean (zero errors)

### Critical Issues

None.

### High Priority

1. **Unhandled promise rejection** — `learning-path-tab.tsx:68`: `getTopicIndex().then(setCategories)` has no `.catch()`. If the server action throws, it's an unhandled rejection. Add `.catch(() => setCategories([]))`.

2. **API error leaking upstream details** — `route.ts:75-78`: raw `errText` from Mimo API forwarded to client. Could expose internal API structure. Replace with generic message; log `errText` server-side only.

3. **No request body validation** — `route.ts:21`: `body as { topic: string; files: TopicFile[] }` is an unsafe cast. Only truthy checks on `topic` and `files?.length`. Missing shape validation on each `TopicFile` (could receive arbitrary objects).

### Medium Priority

4. **Module-level cache never invalidates** — `topic-index.ts:83`: `cachedIndex` is set once. If README.md changes at runtime, stale data served until process restart. Acceptable for production README, confusing in dev.

5. **No tests** — Zero test coverage for all new files. `__tests__/` has only `fs.test.ts`.

6. **`aiPanelTab` is typed as `string`** — `store.ts:11`: should be a union type (`"summarize" | "explain" | "translate" | "write" | "path"`) for type safety.

### Low Priority

7. **`toCategoryId` edge case** — `topic-index.ts:18`: category name with only special chars produces empty slug. Unlikely with current README but no guard.

8. **JSON parse fragility** — `route.ts:94`: if Mimo wraps response in markdown code fences despite `response_format`, `JSON.parse` fails. Consider stripping code fences before parsing.

### Positive Observations
- Path traversal protection in `fs.ts` properly validates resolved paths.
- AI response paths correctly filtered against valid file list.
- Clean component separation; `PathStep` is a good sub-component.
- Error states with retry button in UI.

### Recommended Actions
1. Add `.catch()` to `getTopicIndex()` call (line 68).
2. Sanitize error messages before forwarding to client.
3. Validate request body shape with runtime checks (or zod).
4. Add tests for `parseReadmeIndex`, API route validation, and component rendering.
