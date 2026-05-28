---
phase: 1
title: "Topic Index Builder"
status: completed
priority: P2
effort: "2h"
dependencies: []
---

# Phase 1: Topic Index Builder

## Overview

Build a topic index from the README.md table of contents and directory structure. This index maps categories to their files, providing the AI with structured context for path generation.

## Requirements

- Parse README.md to extract category → file mappings (20 categories, 485 files)
- Extract file metadata: title (from filename), category, relative path
- Output a structured `TopicIndex` type usable by both server and client
- No new dependencies — use existing `lib/fs.ts` utilities

## Related Code Files

- Create: `lib/topic-index.ts` — parse README, build index, export types
- Modify: `README.md` — only if parsing requires structural changes (unlikely)

## Implementation Steps

1. Create `lib/topic-index.ts` with:
   - `TopicCategory` type: `{ id: string, name: string, files: TopicFile[] }`
   - `TopicFile` type: `{ title: string, path: string, category: string }`
   - `parseReadmeIndex()` function — reads README.md, extracts tables per section
   - `getTopicCategories()` — returns all categories for UI dropdown
   - `getFilesForCategory(categoryId)` — returns files in a category

2. The parser should:
   - Split README by `## ` headers to find sections
   - Extract markdown table rows (skip header/separator lines)
   - Parse `| # | Title | [Link](path) |` format
   - Map section names to clean category IDs (e.g., "JavaScript" → "javascript", "Next.js — Core" → "nextjs-core")

3. Add server action `getTopicIndex()` in `app/actions/files.ts` that returns the full index

## Success Criteria

- [ ] `parseReadmeIndex()` returns all 20 categories with correct file counts
- [ ] Each file has title, path, and category
- [ ] Server action `getTopicIndex()` callable from client
- [ ] No new npm dependencies added

## Risk Assessment

- **Low risk:** README format is consistent (markdown tables). Parser is straightforward string manipulation.
- **Edge case:** Some categories have sub-sections (Next.js has 5 sub-sections). Handle by flattening or keeping sub-categories.
