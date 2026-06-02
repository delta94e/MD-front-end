---
name: pmndrs-jotai
description: "Jotai atomic state management library. Trigger on: atom creation, state management, React hooks, vanilla store, derived atoms, jotai utils/extensions."
metadata:
  author: topic-skill-generator
  version: "1.0.0"
  source: https://github.com/pmndrs/jotai
---

# Jotai Codebase Skill

## Overview

Jotai is a minimal atomic state management library for React (2kb core). It provides primitive atoms (hold values) and derived atoms (compute from other atoms). Built with TypeScript, uses pnpm monorepo, Rollup for builds, Vitest for testing.

**Tech stack:** TypeScript, React 16–19, Rollup, Vitest, pnpm, ESLint, Prettier.

**Key concept:** Atoms are the unit of state. `atom(value)` creates a primitive atom, `atom((get) => get(other) + 1)` creates a derived/read-only atom. The vanilla store manages atom lifecycle; React hooks bridge atoms to components.

## Architecture

```
src/
  vanilla/          # Framework-agnostic core (no React dependency)
    atom.ts         # atom() factory — creates primitive & derived atoms
    store.ts        # createStore() — manages atom values, subscriptions, dependencies
    internals.ts    # Internal store mechanics (reconciliation, dependency tracking)
    utils/          # Vanilla utilities (atomFamily, selectAtom, etc.)
  react/            # React bindings
    Provider.tsx    # React context provider wrapping a store
    useAtom.ts      # useAtom() — read/write hook
    useAtomValue.ts # useAtomValue() — read-only hook
    useSetAtom.ts   # useSetAtom() — write-only hook
    utils/          # React utilities (useHydrateAtoms, useReducerAtom, etc.)
  babel/            # Babel/SWC plugins for devtools labels & React Refresh
  index.ts          # Public entry (re-exports atom + React hooks)
  vanilla.ts        # Public entry for jotai/vanilla
  react.ts          # Public entry for jotai/react
  utils.ts          # Public entry for jotai/utils
```

**Data flow:** Component → `useAtom(atom)` → reads/writes via store → store notifies subscribers → dependent atoms recomputed → component re-renders.

## Core Patterns

### Creating atoms
```ts
import { atom } from 'jotai'

// Primitive (read-write)
const countAtom = atom(0)

// Derived (read-only)
const doubledAtom = atom((get) => get(countAtom) * 2)

// Derived (read-write)
const derivedRW = atom(
  (get) => get(countAtom) * 2,
  (get, set, arg) => set(countAtom, get(countAtom) + arg)
)
```

### Using atoms in React
```tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

const Counter = () => {
  const [count, setCount] = useAtom(countAtom)     // read + write
  const doubled = useAtomValue(doubledAtom)         // read only
  const set = useSetAtom(countAtom)                 // write only
  return <button onClick={() => set(c => c + 1)}>{count}</button>
}
```

### Creating a standalone store (vanilla)
```ts
import { atom } from 'jotai/vanilla'
import { createStore } from 'jotai/vanilla'

const store = createStore()
store.set(countAtom, 5)
store.get(countAtom) // 5
const unsub = store.sub(countAtom, () => { /* notify */ })
unsub()
```

### atomFamily pattern
```ts
import { atomFamily } from 'jotai/vanilla/utils'
const todoAtom = atomFamily((id) => ({ id, text: '', done: false }))
// Usage: todoAtom(1), todoAtom(2)
```

## Workflow

### Adding a new utility
1. Create file in `src/vanilla/utils/` (vanilla) or `src/react/utils/` (React)
2. Export from corresponding `src/vanilla/utils.ts` or `src/react/utils.ts`
3. Add documentation in `docs/utilities/`
4. Write tests in `tests/` mirroring the src structure
5. Run `pnpm run test:spec` to verify

### Fixing a bug
1. Write failing test in `tests/` that reproduces the bug
2. Fix code in `src/`
3. Run `pnpm run test:spec` — all tests must pass
4. Run `pnpm run fix` (format + lint)
5. Commit with `fix(scope): description` format

### Building & releasing
```bash
pnpm install
pnpm run build           # produces dist/ with CJS, ESM, UMD
pnpm run test            # format + types + lint + spec
pnpm run fix             # auto-fix formatting/linting
```

### Adding a benchmark
1. Create `benchmarks/your-bench.ts` using benny
2. Import from `../src/vanilla/atom.ts` and `../src/vanilla/store.ts`
3. Run via `npx tsx benchmarks/your-bench.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/vanilla/atom.ts` | `atom()` factory — the core primitive |
| `src/vanilla/store.ts` | `createStore()` — state container with dependency graph |
| `src/vanilla/internals.ts` | Internal reconciliation & subscription logic |
| `src/react/Provider.tsx` | React context provider for the store |
| `src/react/useAtom.ts` | Primary React hook for reading/writing atoms |
| `src/react/utils/useHydrateAtoms.ts` | SSR atom initialization |
| `src/babel/preset.ts` | Babel preset combining debug-label + react-refresh plugins |
| `package.json` | Exports map defining `jotai`, `jotai/vanilla`, `jotai/react`, etc. |
| `rollup.config.mjs` | Build config producing CJS/ESM/UMD bundles |
| `tsconfig.json` | TypeScript config with path aliases for `jotai/*` |

## Anti-Patterns

- **Don't create atoms inside components** — define at module scope. Creating in render causes infinite re-renders.
- **Don't mutate atom values directly** — always use `set()` or the setter from `useAtom`.
- **Don't import React hooks in vanilla code** — `src/vanilla/` must remain React-free.
- **Don't skip the Provider** — atoms need a store context in React; wrap your app with `<Provider>`.
- **Don't use `useAtom` for write-only** — use `useSetAtom` to avoid unnecessary re-renders.
- **Don't forget to test both DEV and PROD** — tests use `[DEV-ONLY]` and `[PRD-ONLY]` prefixes to control environment-specific tests.

## Quick Reference

```bash
# Install & setup
pnpm install

# Development
pnpm run test:spec      # Run tests
pnpm run test:types     # Type checking
pnpm run test:lint      # Lint
pnpm run test:format    # Format check
pnpm run build          # Build all formats
pnpm run fix            # Auto-fix lint + format

# Benchmarks
npx tsx benchmarks/run-all.ts
```

```ts
// Import paths
import { atom } from 'jotai'               // main entry
import { atom } from 'jotai/vanilla'        // vanilla only
import { useAtom } from 'jotai/react'       // React hooks only
import { atomFamily } from 'jotai/vanilla/utils' // vanilla utils
import { useHydrateAtoms } from 'jotai/react/utils' // React utils
```

**Conventional commits:** `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:` — with optional scope like `fix(react):`.