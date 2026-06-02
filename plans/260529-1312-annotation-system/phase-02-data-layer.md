---
phase: 2
title: Data Layer
status: completed
priority: P2
effort: 2h
dependencies:
  - 1
---

# Phase 2: Data Layer

## Overview

Implement SQLite storage for annotations and Zustand store integration.

## Requirements

- Functional: CRUD operations for annotations, query by file path
- Non-functional: WAL mode for concurrent reads, indexed queries

## Architecture

```
lib/annotations-db.ts
  ├── SQLite table: annotations
  ├── Functions: getAnnotations, addAnnotation, updateAnnotation, deleteAnnotation
  └── Cleanup: none needed (annotations are user-created, no TTL)

lib/store.ts (additions)
  ├── annotations: Annotation[]
  ├── loadAnnotations: (filePath: string) => void
  ├── addAnnotation: (annotation) => void
  ├── updateAnnotation: (id, updates) => void
  └── deleteAnnotation: (id) => void
```

## Related Code Files

- Create: `lib/annotations-db.ts`
- Modify: `lib/store.ts`
- Reference: `lib/content-cache.ts` — SQLite patterns

## Implementation Steps

1. Create `lib/annotations-db.ts`
   - SQLite table: `annotations` with columns matching the data model
   - Index on `file_path` for fast per-file queries
   - WAL mode, same pattern as content-cache.ts
   - Export CRUD functions

2. Add to Zustand store (`lib/store.ts`)
   - `annotations: Annotation[]` state
   - `loadAnnotations(filePath)` — fetch from SQLite via server action
   - `addAnnotation(annotation)` — insert via server action, update local state
   - `updateAnnotation(id, updates)` — update via server action, update local state
   - `deleteAnnotation(id)` — delete via server action, update local state

3. Create server actions in `app/actions/annotations.ts`
   - `getAnnotations(filePath)` — read from SQLite
   - `addAnnotation(annotation)` — insert into SQLite
   - `updateAnnotation(id, updates)` — update SQLite
   - `deleteAnnotation(id)` — delete from SQLite

## Success Criteria

- [ ] SQLite table created with proper schema and indexes
- [ ] CRUD server actions working
- [ ] Zustand store loads/saves annotations
- [ ] Can add and retrieve annotations for a file

## Risk Assessment

- **Risk**: Server action round-trips add latency
  - **Mitigation**: Optimistic updates in store, sync to DB async
