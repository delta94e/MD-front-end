---
title: "Inline Code Runner & Exercise Generator"
description: "Auto-run code blocks marked with `run` annotation, and generate exercises from notes using AI."
status: completed
priority: P2
branch: "main"
tags: [code-runner, exercises, ai, playground, interactive]
blockedBy: []
blocks: []
created: "2026-05-30T01:18:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Inline Code Runner & Exercise Generator

## Overview

Two features: (1) Extend code playground to auto-run code blocks annotated with `js run` in markdown fence, showing output inline on document load. (2) AI-powered exercise generator that reads current note and produces interactive exercises (predict-output, fix-bug, quiz) on-the-fly.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Inline Code Runner Auto-Run](./phase-01-inline-code-runner-auto-run.md) | Completed |
| 2 | [Exercise Generator API](./phase-02-exercise-generator-api.md) | Completed |
| 3 | [Exercise Generator UI](./phase-03-exercise-generator-ui.md) | Completed |
| 4 | [Testing & Verification](./phase-04-testing-verification.md) | Completed |

## Architecture

```
Feature 1: Inline Code Runner
─────────────────────────────
Markdown: ```js run          ← new annotation
           console.log("hi")
           ```

markdown-viewer.tsx → CodeBlock
├── Detect `run` in language class (e.g., "language-js run")
├── Strip "run" → language = "js", autoRun = true
├── If autoRun → render CodePlayground with autoRun=true
└── CodePlayground auto-executes on mount

Feature 2: Exercise Generator
─────────────────────────────
components/ai-panel.tsx → ExerciseTab (new)
├── Button: "Generate Exercises"
├── Shows exercises in cards
├── Types: predict-output, fix-bug, quiz (multiple choice)
└── User answers → reveal correct answer

app/api/generate-exercises/route.ts (new)
├── Reads note content from request body
├── AI generates 3-5 exercises per note
└── Returns JSON array of exercises

lib/ai-helpers.ts
└── SYSTEM_PROMPTS.generateExercises (new)
```

## Key Decisions

1. **Auto-run trigger**: `js run` in fence language class — simple, no new syntax
2. **Exercise storage**: On-the-fly only (no DB) — YAGNI, generate fresh each time
3. **Exercise types**: predict-output, fix-bug, quiz — covers most learning scenarios
4. **Reuse**: `CodePlayground` gets optional `autoRun` prop, exercises reuse AI panel pattern

## Dependencies

- Zero new npm packages
- Modifies: `components/markdown-viewer.tsx`, `components/code-playground.tsx`, `components/ai-panel.tsx`, `lib/ai-helpers.ts`
- Creates: `app/api/generate-exercises/route.ts`

## Success Criteria

- `js run` code blocks auto-execute on document load
- Output appears inline below the code block
- Exercise tab generates exercises from current note
- Exercises are interactive (select answer, reveal)
- No new dependencies
