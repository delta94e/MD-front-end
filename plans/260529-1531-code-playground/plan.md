---
title: "Interactive Code Playground"
description: "Execute JS/TS code snippets from markdown in-browser with live console output, using iframe sandbox."
status: completed
priority: P2
branch: "main"
tags: [playground, code-execution, sandbox, interactive]
blockedBy: []
blocks: []
created: "2026-05-29T15:31:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Interactive Code Playground

## Overview

Add a "Run" button to JS/TS code blocks in the markdown viewer. Code executes in a sandboxed iframe with console output displayed below. No external dependencies — uses native `iframe.srcdoc` + `postMessage` for secure execution.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Sandbox Executor & Output UI](./phase-01-sandbox-executor.md) | Completed |
| 2 | [Code Block Integration](./phase-02-code-block-integration.md) | Completed |
| 3 | [TS Transpilation & Edge Cases](./phase-03-ts-transpilation.md) | Completed |

## Architecture

```
markdown-viewer.tsx
├── CodeBlock component
│   ├── Detects language === "js" | "javascript" | "ts" | "typescript"
│   ├── Renders existing syntax-highlighted <pre>
│   ├── [NEW] "Run" button in toolbar
│   └── [NEW] <CodePlayground> component
│       ├── SandboxRunner (iframe with srcdoc)
│       │   ├── Creates hidden iframe
│       │   ├── Posts code via postMessage
│       │   ├── Receives console output via postMessage
│       │   └── Handles errors, timeouts (5s limit)
│       └── OutputPanel (collapsible)
│           ├── Shows console.log output
│           ├── Shows errors in red
│           └── Shows return value (if any)

lib/code-sandbox.ts
├── buildSandboxHtml(code: string): string
│   └── Returns HTML string for iframe srcdoc
├── parseConsoleArgs(args: any[]): string
│   └── Serializes console arguments to string
└── transpileTS(code: string): string
    └── Strips type annotations (simple regex for common cases)
```

## Key Decisions

1. **Sandboxing:** `iframe[sandbox="allow-scripts"]` — no external deps, native browser security
2. **TS transpilation:** Simple regex-based type stripping (covers 80% of cases). No esbuild-wasm — YAGNI for a markdown reader
3. **Timeout:** 5s execution limit via `setTimeout` in iframe
4. **Output:** Console.log capture only. No DOM manipulation support
5. **Async:** Support top-level await via wrapping in async function

## Dependencies

- Zero new npm packages
- Uses existing shadcn/ui Button, ScrollArea

## Success Criteria

- JS code blocks show "Run" button
- Clicking "Run" executes code in sandbox, shows console output
- TS code blocks also work (types stripped)
- Errors display in red
- Execution timeout prevents infinite loops
- No security vulnerabilities (sandboxed iframe)
