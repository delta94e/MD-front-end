---
phase: 1
title: "Sandbox Executor & Output UI"
status: completed
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Sandbox Executor & Output UI

## Overview

Build the core sandbox execution engine (iframe-based) and the output display component. This is the foundation — code runs securely in an isolated iframe with console capture.

## Requirements

- Functional: Execute arbitrary JS code in sandboxed iframe
- Functional: Capture console.log, console.warn, console.error output
- Functional: Display output in collapsible panel below code
- Functional: 5-second timeout prevents infinite loops
- Functional: Errors caught and displayed in red
- Non-functional: Zero new npm dependencies
- Non-functional: Sandbox cannot access parent DOM/storage

## Architecture

```
lib/code-sandbox.ts
├── buildSandboxHtml(code: string): string
│   ├── Returns full HTML page for iframe srcdoc
│   ├── Intercepts console.log/warn/error
│   ├── Posts messages to parent via postMessage
│   ├── Wraps code in try/catch
│   └── Sets 5s timeout to kill execution
├── parseConsoleArgs(args: unknown[]): string
│   ├── Handles strings, numbers, objects, arrays
│   └── JSON.stringify for objects, toString for primitives
└── EXECUTE/OUTPUT message protocol
    ├── Parent → iframe: { type: "execute", code: string }
    └── iframe → Parent: { type: "output", level: "log"|"warn"|"error"|"result", data: string }

components/code-playground.tsx
├── SandboxRunner
│   ├── Renders hidden iframe with sandbox="allow-scripts"
│   ├── Posts code to iframe on execute
│   ├── Listens for output messages
│   └── Manages execution state (idle/running/done)
└── OutputPanel
    ├── Collapsible panel with toggle
    ├── Color-coded output lines (log=default, warn=yellow, error=red)
    └── "Clear" button
```

## Related Code Files

- Create: `lib/code-sandbox.ts` — sandbox HTML builder, message protocol
- Create: `components/code-playground.tsx` — SandboxRunner + OutputPanel

## Implementation Steps

1. Create `lib/code-sandbox.ts`:
   - `buildSandboxHtml(code)` — returns HTML string with:
     - `console.log/warn/error` interception → `parent.postMessage()`
     - `try/catch` wrapper around user code
     - `setTimeout` 5s kill switch
     - Error event listener for uncaught errors
   - `parseConsoleArgs(args)` — serialize any value to string
2. Create `components/code-playground.tsx`:
   - `SandboxRunner` component:
     - Hidden iframe with `sandbox="allow-scripts"` + `srcdoc`
     - `postMessage` to send code
     - `message` event listener for output
     - State: `idle` | `running` | `done`
   - `OutputPanel` component:
     - Collapsible div with output lines
     - Each line has level indicator (log/warn/error/result)
     - Clear button
3. Unit test `buildSandboxHtml` output contains expected patterns

## Success Criteria

- [x] `buildSandboxHtml` returns valid HTML with console interception
- [x] `SandboxRunner` executes code and captures console output
- [x] `OutputPanel` displays color-coded output
- [x] 5s timeout kills infinite loops
- [x] Errors caught and displayed
- [x] Sandbox cannot access parent window

## Risk Assessment

- **Risk:** iframe sandbox too restrictive for some code patterns
  - **Mitigation:** `allow-scripts` is sufficient for console.log capture; document limitations
- **Risk:** postMessage origin validation
  - **Mitigation:** Check `event.source === iframe.contentWindow` in message handler
