---
title: "Explain Like I'm 5 Mode"
description: "Toggle between technical and plain language explanations using analogies instead of jargon."
status: completed
priority: P2
branch: "main"
tags: [ai, explain, eli5, ux]
blockedBy: []
blocks: []
created: "2026-05-30T01:03:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Explain Like I'm 5 Mode

## Overview

Add a toggle to the Explain tab that switches between "Technical" and "Simple" (ELI5) modes. Simple mode uses analogies, everyday language, and avoids jargon. Technical mode keeps the current behavior.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [ELI5 Prompt & API](./phase-01-eli5-prompt-api.md) | Completed |
| 2 | [Explain Tab Toggle UI](./phase-02-explain-tab-toggle.md) | Completed |

## Architecture

```
lib/ai-helpers.ts
├── SYSTEM_PROMPTS.explain (existing — technical mode)
└── SYSTEM_PROMPTS.explainELI5 (new — simple mode with analogies)

app/api/explain/route.ts
├── Read body.mode ("technical" | "eli5")
├── If "eli5" → use SYSTEM_PROMPTS.explainELI5
└── Else → use SYSTEM_PROMPTS.explain (current behavior)

components/ai-panel.tsx → ExplainTab
├── Add mode state: "technical" | "eli5"
├── Toggle button: "Technical" ↔ "Simple (ELI5)"
├── Pass mode in complete() body
└── Visual: ELI5 mode shows 🧒 icon, different accent color
```

## Key Decisions

1. **Mode scope:** Per-session, stored in component state (not global store) — YAGNI for persistence
2. **Prompt strategy:** ELI5 prompt instructs AI to use analogies, avoid jargon, explain like talking to a beginner
3. **Toggle placement:** Inside ExplainTab only, not a global setting — each tab is independent
4. **API change:** Add optional `mode` field to request body, default to "technical"

## Dependencies

- Zero new npm packages
- Modifies: `lib/ai-helpers.ts`, `app/api/explain/route.ts`, `components/ai-panel.tsx`

## Success Criteria

- Toggle switches between Technical and Simple modes
- ELI5 mode produces explanations with analogies, no jargon
- Technical mode unchanged from current behavior
- Mode persists during session (until page refresh)
