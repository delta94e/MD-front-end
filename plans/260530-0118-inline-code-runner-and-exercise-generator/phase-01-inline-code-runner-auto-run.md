---
phase: 1
title: "Inline Code Runner Auto-Run"
status: completed
priority: P2
effort: "30min"
dependencies: []
---

# Phase 1: Inline Code Runner Auto-Run

## Overview

Extend the existing code playground to auto-run code blocks on document load when the fence language includes `run` annotation (e.g., ` ```js run `). Output renders inline below the code block without user interaction.

## Requirements

- Functional: `js run` or `ts run` in fence language triggers auto-execution
- Functional: Output appears below code block on document load
- Functional: Regular `js`/`ts` blocks keep manual Run button (current behavior)
- Non-functional: No performance regression for documents without `run` blocks

## Architecture

```
Markdown fence: ```js run
                console.log("hello")
                ```

Parsed by rehype-prism → class="language-js run"

CodeBlock component:
├── Parse className: "language-js run" → language="js", autoRun=true
├── If autoRun → <CodePlayground autoRun={true} />
└── Else → show Play button (current behavior)

CodePlayground component:
├── New prop: autoRun?: boolean
├── If autoRun → execute on mount (useEffect)
└── Otherwise → manual Run button (current behavior)
```

## Related Code Files

- Modify: `components/markdown-viewer.tsx` — CodeBlock parses `run` annotation
- Modify: `components/code-playground.tsx` — add `autoRun` prop

## Implementation Steps

1. **CodeBlock in markdown-viewer.tsx** — Parse language class:
   ```typescript
   const parts = className?.replace("language-", "").split(/\s+/) ?? [];
   const language = parts[0] ?? "";
   const autoRun = parts.includes("run");
   const canExecute = isExecutableLanguage(language);
   ```
2. Pass `autoRun` to `CodePlayground`:
   ```tsx
   {showPlayground && canExecute && (
     <CodePlayground code={...} language={language} autoRun={autoRun} />
   )}
   ```
3. When `autoRun=true`, also set `showPlayground=true` by default so playground is visible
4. **CodePlayground** — Add `autoRun` prop:
   ```typescript
   interface CodePlaygroundProps {
     code: string;
     language: string;
     autoRun?: boolean;
   }
   ```
5. Auto-execute on mount when `autoRun`:
   ```typescript
   useEffect(() => {
     if (autoRun) {
       handleRun();
     }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps
   ```

## Success Criteria

- [ ] `js run` code blocks auto-execute on document load
- [ ] Output renders inline below code block
- [ ] Regular `js` blocks unchanged (manual Run)
- [ ] No performance impact on documents without `run` blocks
