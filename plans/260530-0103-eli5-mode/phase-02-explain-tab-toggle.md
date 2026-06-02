---
phase: 2
title: "Explain Tab Toggle UI"
status: completed
priority: P2
effort: "30min"
dependencies: [1]
---

# Phase 2: Explain Tab Toggle UI

## Overview

Add a toggle button to the Explain tab that switches between Technical and ELI5 modes.

## Requirements

- Functional: Toggle button shows current mode ("Technical" / "Simple")
- Functional: ELI5 mode passes `mode: "eli5"` to API
- Functional: Technical mode passes `mode: "technical"` (or no mode)
- Non-functional: Toggle is visually distinct, easy to find

## Related Code Files

- Modify: `components/ai-panel.tsx` — ExplainTab gets mode state + toggle

## Implementation Steps

1. Add `mode` state to `ExplainTab`: `"technical" | "eli5"` (default: "technical")
2. Add toggle button below description text:
   - Two-segment toggle: "Technical" | "Simple"
   - Use `Button variant="outline"` for inactive, `variant="default"` for active
3. Pass `mode` in `complete()` body:
   ```
   complete("", { body: { selectedText, surroundingContext, mode } })
   ```
4. Visual indicator: when ELI5 active, show small badge "ELI5" near the toggle

## Success Criteria

- [ ] Toggle visible in Explain tab
- [ ] Clicking toggle switches mode
- [ ] ELI5 mode sends mode="eli5" to API
- [ ] Mode state persists during session
