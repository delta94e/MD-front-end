# Interactive Code Playground — Sandboxed JS/TS Execution

**Date**: 2026-05-29
**Severity**: Medium
**Component**: Markdown Viewer / Code Blocks
**Status**: Resolved

## What Happened

Added a "Run" button to JS/TS code blocks in the markdown viewer. Clicking it executes code inside a sandboxed iframe with live console output (log/warn/error). Three files: `lib/code-sandbox.ts` (sandbox HTML builder, TS transpiler, arg serializer), `components/code-playground.tsx` (iframe + output panel + controls), `components/markdown-viewer.tsx` (language detection, hover Play button). Build clean, 76/76 tests pass, zero new deps.

## The Brutal Truth

Regex-based TS transpilation is a hack. It strips type annotations via pattern matching, not a real parser. Generics with nested angle brackets, `satisfies`, complex conditional types — all will break silently or produce garbage JS. We shipped it knowing this because covering 80% of inline TS snippets in a markdown reader is good enough, and pulling in esbuild-wasm for a "Run" button is insane scope creep. But it will bite someone who pastes advanced TypeScript into a code block and gets a cryptic runtime error instead of a compile error.

## Technical Details

- **Sandbox**: `sandbox="allow-scripts"` on iframe, `srcdoc` with console interception via `console[method] = (...args) => parent.postMessage(...)`. No `allow-same-origin` — prevents any access to parent DOM/storage.
- **TS transpilation**: Regex strips type annotations (`: Type`, `: Type[]`, `as Type`, `satisfies`, generics on function params). Fails on: nested generics `<Map<string, Set<number>>>`, `keyof`, `infer`, mapped types. Acceptable trade-off for inline snippets.
- **Timeout**: 5s `setTimeout` kills execution. Prevents `while(true)` grief. No Web Worker because the iframe already provides isolation and postMessage is simpler.
- **Console capture only**: No `document.querySelector`, no DOM access from sandboxed code. Intentional limitation — this is a reader, not a REPL.

## Key Decisions

- **iframe sandbox over eval/Web Workers**: Native browser security boundary. eval() is a CSP nightmare; Web Workers add complexity for zero benefit when iframe srcdoc already isolates.
- **Regex TS over esbuild-wasm**: YAGNI. A markdown reader doesn't need full TS compilation. 80/20 rule — regex handles type annotations, which is 90% of what people write inline.
- **5s timeout over AST analysis for infinite loops**: Simple, effective, no dependencies. The alternative (static analysis of loops) is a research problem.
- **Console-only output**: No DOM rendering, no `document.write`. Keeps the sandbox clean and the output predictable.

## What Could Improve

- Real TS transpilation via esbuild-wasm if adoption proves high enough to justify the 2MB bundle cost.
- Execution history — currently each Run overwrites output. A scrollable history would help debugging.
- Share/playground links — encode code in URL params for sharing snippets.

## Lessons Learned

1. **"Good enough" transpilation is a valid trade-off when the alternative is a 2MB dependency.** But document the failure modes prominently — users will hit them.
2. **iframe sandboxing is underrated.** Zero deps, native security, clean isolation. Should be the default choice for untrusted code execution in browsers.
