---
phase: 3
title: "TS Transpilation & Edge Cases"
status: completed
priority: P2
effort: "2h"
dependencies: [2]
---

# Phase 3: TS Transpilation & Edge Cases

## Overview

Handle TypeScript code execution by stripping type annotations before sending to sandbox. Handle edge cases: async code, imports, syntax errors in source.

## Requirements

- Functional: TS code runs after type stripping
- Functional: `const x: number = 5` → `const x = 5`
- Functional: `interface`, `type` declarations stripped
- Functional: `as` type assertions stripped
- Functional: Generic syntax `<T>` stripped where unambiguous
- Functional: Async/await works (wrap in async IIFE)
- Non-functional: Graceful fallback if transpilation fails (show error, don't crash)

## Architecture

```
lib/code-sandbox.ts (existing, extend)
├── transpileTS(code: string): string
│   ├── Remove type annotations: `: Type` after identifiers
│   ├── Remove interface declarations
│   ├── Remove type declarations
│   ├── Remove `as Type` assertions
│   ├── Remove generic `<T>` on function calls (simple cases)
│   └── Return cleaned JS string
└── prepareCode(code: string, lang: string): string
    ├── If lang === "ts" | "typescript" | "tsx": call transpileTS
    ├── Wrap in async IIFE if code contains await
    └── Return final JS string
```

## Related Code Files

- Modify: `lib/code-sandbox.ts` — add `transpileTS`, `prepareCode`

## Implementation Steps

1. Add `transpileTS(code)`:
   - Regex: remove `: <Type>` after variable/param declarations
   - Regex: remove `interface ... { ... }` blocks
   - Regex: remove `type ... = ...` declarations
   - Regex: remove `as <Type>` assertions
   - Regex: remove `<Type>` on generic calls (careful with JSX/TSX)
2. Add `prepareCode(code, lang)`:
   - If TS/TSX: run through `transpileTS`
   - If code contains `await`: wrap in `(async () => { ... })()`
3. Update `CodePlayground` to use `prepareCode` before execution
4. Add error boundary: if transpilation produces invalid JS, show error message

## Success Criteria

- [x] `const x: number = 5` executes as `const x = 5`
- [x] `interface Foo { bar: string }` stripped cleanly
- [x] `value as string` becomes `value`
- [x] `fetch().then()` and async/await both work
- [x] Transpilation errors shown gracefully, don't crash

## Risk Assessment

- **Risk:** Regex-based TS stripping is imperfect for complex types
  - **Mitigation:** Cover 80% common cases. Document limitations. Users can write JS for complex code.
- **Risk:** Generic `<T>` conflicts with JSX `<Tag>` in TSX
  - **Mitigation:** Only strip `<T>` after function names, not after identifiers followed by attributes
