# Test Report: graph-extractor.ts

**Date:** 2026-05-29
**File:** `/Users/truongnguyen/MD-front-end/lib/graph-extractor.ts`
**Test file:** `/Users/truongnguyen/MD-front-end/__tests__/lib/graph-extractor.test.ts`

## Results

| Metric | Value |
|--------|-------|
| Test suites | 1 passed, 1 total |
| Tests | **43 passed, 0 failed** |
| Time | 0.623s |

## Coverage by Function

| Function | Tests | Key scenarios |
|----------|-------|---------------|
| `getCategoryColor` | 7 | known categories, case-insensitive, special chars, substring match, palette fallback, determinism, empty string |
| `buildNodes` | 9 | correct count, category mapping, `.md` strip, path as id, uncategorized fallback, nested dirs, dir-only nodes ignored, empty tree, correct color |
| `buildCategoryEdges` | 5 | 2-node chain, 3-node chain+ring, single node, multiple categories, empty input |
| `buildDirectoryEdges` | 5 | same-dir chain, nodeSet filter, subdirectory recursion, empty tree, dir without children |
| `buildFilenameEdges` | 7 | cross-category similarity, same-category exclusion, high threshold filtering, low threshold inclusion, stop-word skip, default threshold (0.6), single node |
| `mergeEdges` | 7 | dedup highest weight, reversed source/target, distinct edges, single set, no args, empty arrays, many overlapping sets |

## Issues Found

None. All functions behave as expected.

## Unresolved Questions

None.
