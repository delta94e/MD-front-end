# Code Review: Topic Skill Generator

## Scope
- Files: 7 (types.ts, topic-content-extractor.ts, skill-template.ts, skill-generator-engine.ts, route.ts, skill-generator-tab.tsx, ai-panel.tsx)
- LOC: ~430 new/modified
- Focus: New feature review - security, type safety, error handling

## Overall Assessment
Clean, well-structured feature with good separation of concerns. However, there are two **critical path traversal vulnerabilities** and a few high-priority issues that should be fixed before shipping.

---

## Critical Issues

### 1. Path Traversal in `readFileSafe` (topic-content-extractor.ts:76)

```typescript
const fullPath = join(rootDir, filePath);
return await readFile(fullPath, "utf-8");
```

`join()` does NOT prevent traversal. If `file.path` from the README index is `../../../etc/passwd`, this reads arbitrary files. The `TopicFile.path` comes from parsing markdown links in `topic-index.ts:parseReadmeRow()` -- user-controlled content from README.md.

**Fix:** Validate resolved path stays within `rootDir`:
```typescript
import { resolve } from "path";

async function readFileSafe(filePath: string): Promise<string> {
  try {
    const fullPath = resolve(rootDir, filePath);
    if (!fullPath.startsWith(resolve(rootDir))) return "";
    return await readFile(fullPath, "utf-8");
  } catch {
    return "";
  }
}
```

### 2. Path Traversal in `writeSkillToDisk` (skill-generator-engine.ts:50)

```typescript
const skillDir = join(outputDir, config.name);
await rm(skillDir, { recursive: true, force: true });
```

`config.name` is derived from category names in README.md. While `generateSkillName()` strips most special characters, it doesn't prevent `..` sequences. A category named `..--system` would produce a name containing `..`. Combined with `rm({recursive: true, force: true})`, this could delete arbitrary directories.

**Fix:** Validate the resolved path:
```typescript
import { resolve } from "path";

async function writeSkillToDisk(...): Promise<void> {
  const skillDir = resolve(outputDir, config.name);
  if (!skillDir.startsWith(resolve(outputDir))) {
    throw new Error("Invalid skill name: path traversal detected");
  }
  // rest of function
}
```

---

## High Priority

### 3. Unescaped YAML in `generateSkillMd` (skill-template.ts:66)

```typescript
`description: "${config.description}"`,
```

If `config.description` contains a double quote, the YAML frontmatter breaks. The description is built from category names which could contain quotes.

**Fix:** Escape or sanitize:
```typescript
`description: "${config.description.replace(/"/g, '\\"')}"`,
```

### 4. Error Swallowed in Initial Fetch (skill-generator-tab.tsx:28)

```typescript
fetch("/api/generate-skills")
  .then((r) => r.json())
  .then((data) => setCategories(data.categories || []))
  .catch(() => {});
```

Silent failure. If the API is down, user sees empty state with no feedback. At minimum, set an error state.

### 5. No Rate Limiting on POST (route.ts)

The POST endpoint triggers file system writes (`rm` + `mkdir` + `writeFile`). A malicious or runaway client could spam this endpoint and cause disk I/O issues. Consider adding basic rate limiting or a debounce mechanism.

### 6. Sequential Skill Generation (skill-generator-engine.ts:37)

```typescript
for (const cat of categories) {
  const skill = await generateSkill(cat.id, outputDir);
```

Each category is processed sequentially. With many categories, this is slow. Use `Promise.all` or `Promise.allSettled` for parallelism (they write to separate directories, no conflict).

```typescript
const results = await Promise.allSettled(
  categories.map((cat) => generateSkill(cat.id, outputDir))
);
return results
  .filter((r): r is PromiseFulfilledResult<SkillContent | null> => r.status === "fulfilled" && r.value !== null)
  .map((r) => r.value!);
```

---

## Medium Priority

### 7. Module-Level Root Dir (topic-content-extractor.ts:11)

```typescript
const rootDir = process.env.CONTENT_DIR || process.cwd();
```

Evaluated at module load time. If `CONTENT_DIR` is set after module import (e.g., in tests), it won't pick up the change. Consider making this a parameter or using a function.

### 8. Fragile Relative Links in Skill Output (skill-template.ts:50)

```typescript
section += `- [${file.title}](../../../${file.path})\n`;
```

Hardcoded `../../../` assumes a fixed directory depth. If output directory changes, links break. Consider using absolute paths from project root or making the relative depth configurable.

### 9. Category ID Not Validated at API Boundary (route.ts:8)

```typescript
const categoryId = body.categoryId as string | undefined;
```

No runtime validation that `categoryId` is a non-empty string. While it won't crash (returns null from `generateSkill`), a defensive check would be clearer:
```typescript
if (typeof categoryId === "string" && categoryId.length > 0) {
```

### 10. `cachedIndex` Never Invalidated (topic-index.ts)

The module-level cache in `topic-index.ts` means if README.md changes during the session, `getTopicCategories()` returns stale data. Not a blocker for this feature, but worth noting since the skill generator reads from this index.

---

## Low Priority

### 11. Grid Columns Layout (ai-panel.tsx:284)

`grid-cols-7` with 7 tabs may be tight on narrow panels. The existing 6 tabs were already compact. Consider responsive handling or a scrollable tab list.

### 12. `generateSkillName` Truncation (topic-content-extractor.ts:21)

`.slice(0, 40)` could produce a name ending mid-word or with a trailing hyphen after other transforms. Minor, but could be cleaner with a word-boundary-aware truncation.

---

## Positive Observations

- Good use of bounded extraction (`.slice()` limits on headers, terms, code blocks) preventing runaway output
- Clean type definitions in `types.ts` -- minimal, no over-engineering
- Proper separation: extraction, templating, orchestration, and API are all distinct layers
- `readFileSafe` pattern (catch and return empty) is appropriate for this use case
- UI component follows existing patterns from other tabs (SummarizeTab, etc.)
- Error handling in the API route catches and returns structured errors

---

## Recommended Actions (Priority Order)

1. **Fix path traversal in `readFileSafe`** -- critical security hole
2. **Fix path traversal in `writeSkillToDisk`** -- critical security hole (rm + traversal = data loss risk)
3. **Escape YAML description** -- will cause parsing failures
4. **Add error state for initial fetch** -- UX issue
5. **Parallelize skill generation** -- performance improvement
6. **Consider rate limiting** -- defense in depth

## Unresolved Questions

- What is the expected volume of categories? If <10, sequential generation is fine.
- Is `CONTENT_DIR` ever set dynamically, or always via `.env`?
- Should generated skills be version-controlled or gitignored?
- Is there a cleanup mechanism for stale skills when categories are removed from README?
