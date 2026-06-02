# Jotai Key Concepts Reference

## API / Interface Reference

### Core Types (`src/vanilla/atom.ts`)

```ts
// Atom — base type
type Atom<Value> = { read: Read<Value>; toString: () => string }

// WritableAtom — has write function
type WritableAtom<Value, Args extends unknown[], Result> = {
  read: Read<Value>
  write: Write<Args, Result>
  toString: () => string
}

// PrimitiveAtom — read-write with direct value
type PrimitiveAtom<Value> = WritableAtom<Value, [SetStateAction<Value>], void>

// Read/Write function signatures
type Read<Value> = (get: Getter) => Value | Promise<Value>
type Write<Args, Result> = (get: Getter, set: Setter, ...args: Args) => Result

type Getter = <Value>(atom: Atom<Value>) => Value
type Setter = <Value, Args extends unknown[], Result>(atom: WritableAtom<Value, Args, Result>, ...args: Args) => Result
```

### atom() Factory

```ts
// Primitive atom
atom(0)  // PrimitiveAtom<number>

// Read-only derived
atom((get) => get(base) + 1)  // Atom<number>

// Read-write derived
atom(
  (get) => get(base) * 2,
  (get, set, value: number) => set(base, value / 2)
)  // WritableAtom<number, [number], void>
```

### Store API (`src/vanilla/store.ts`)

```ts
interface Store {
  get: <Value>(atom: Atom<Value>) => Value
  set: <Value, Args extends unknown[], Result>(atom: WritableAtom<Value, Args, Result>, ...args: Args) => Result
  sub: (atom: Atom<unknown>, listener: () => void) => () => void  // returns unsubscribe
}

const store: Store = createStore()
```

### React Hooks (`src/react/`)

```ts
function useAtom<Value>(atom: Atom<Value>): [Value, never]        // read-only
function useAtom<Value>(atom: WritableAtom<Value, ...>): [Value, Setter]  // read-write
function useAtomValue<Value>(atom: Atom<Value>): Value            // read only
function useSetAtom<Value, Args>(atom: WritableAtom<Value, Args, ...>): Setter // write only
```

### Vanilla Utilities (`src/vanilla/utils/`)

```ts
// atomFamily — memoized atom factory keyed by param
atomFamily<Value, Param>(
  atomFn: (param: Param) => Atom<Value> | WritableAtom<Value, ...>
): (param: Param) => Atom<Value>

// selectAtom — derive a slice with shallow equality
selectAtom<Value, Slice>(atom: Atom<Value>, selector: (v: Value) => Slice): Atom<Slice>

// atomWithDefault — resettable default value
atomWithDefault<Value>(getDefault: Read<Value>): WritableAtom<Value, [SetStateAction<Value>], void>
```

## Configuration Guide

### TypeScript Path Aliases (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "paths": {
      "jotai": ["./src/index.ts"],
      "jotai/*": ["./src/*.ts"],
      "jotai/vanilla": ["./src/vanilla.ts"],
      "jotai/vanilla/*": ["./src/vanilla/*.ts"],
      "jotai/react": ["./src/react.ts"],
      "jotai/react/*": ["./src/react/*.ts"]
    }
  }
}
```

### Package Exports (`package.json`)

The package defines multiple entry points:
- `jotai` → `dist/index.js` (atom + React hooks)
- `jotai/vanilla` → `dist/vanilla.js` (atom + store, no React)
- `jotai/react` → `dist/react.js` (React hooks only)
- `jotai/utils` → `dist/utils.js` (mixed vanilla + React utils)
- `jotai/vanilla/utils` → `dist/vanilla/utils.js`
- `jotai/react/utils` → `dist/react/utils.js`

### Build Config (`rollup.config.mjs`)

Produces three formats: CJS (`.js`), ESM (`.mjs`), UMD (`.umd.js`). External dependencies: `react`, `react-dom`.

### Environment Variables

- `NODE_ENV=development` / `production` — controls dev-only warnings and assertions
- Test markers: `[DEV-ONLY]` and `[PRD-ONLY]` test name prefixes control which tests run in which mode

## Common Tasks

### Creating a new vanilla utility

1. Create `src/vanilla/utils/myUtil.ts`:
```ts
import { atom } from '../atom.ts'
import type { Atom } from '../atom.ts'

export function myUtil<Value>(baseAtom: Atom<Value>): Atom<Value> {
  return atom((get) => get(baseAtom))
}
```

2. Re-export from `src/vanilla/utils.ts`:
```ts
export { myUtil } from './utils/myUtil.ts'
```

3. Add test `tests/vanilla/utils/myUtil.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { atom } from 'jotai/vanilla'
import { createStore } from 'jotai/vanilla'
import { myUtil } from 'jotai/vanilla/utils'

it('should work', () => {
  const store = createStore()
  const base = atom(0)
  const derived = myUtil(base)
  expect(store.get(derived)).toBe(0)
  store.set(base, 1)
  expect(store.get(derived)).toBe(1)
})
```

### Writing a React hook utility

1. Create in `src/react/utils/useMyHook.ts`
2. Export from `src/react/utils.ts`
3. Use `useAtomValue` or `useSetAtom` internally
4. Test with `@testing-library/react` and `<Provider>`

### Running specific test suites
```bash
pnpm vitest run tests/vanilla/atom.test.ts        # single file
pnpm vitest run tests/react/                       # all React tests
pnpm vitest run --reporter verbose                 # verbose output
```

## Troubleshooting

### "Cannot read properties of undefined (reading 'read')"
Atom created inside component body. Move atom declaration to module top level.

### Tests failing with DEV-ONLY/PRD-ONLY
Check the test name prefix. `[DEV-ONLY]` tests skip in production; `[PRD-ONLY]` skip in development. The CI workflow patches these via sed.

### TypeScript: cannot find module 'jotai/vanilla/utils'
Ensure `tsconfig.json` has matching path aliases. Run `pnpm run build` if using built types.

### Re-renders not triggering
Verify atom is subscribed via a hook (`useAtom`/`useAtomValue`). Derived atoms only recompute when their dependencies change and the derived atom has active subscribers.

### Build fails with missing exports
Check `rollup.config.mjs` input entries match the source files. Each public entry (`index.ts`, `vanilla.ts`, `react.ts`, `utils.ts`) needs a corresponding input in the rollup config.

### pnpm install fails
Use `pnpm install --frozen-lockfile` in CI. The project uses pnpm workspaces (`pnpm-workspace.yaml`) — examples are separate workspace packages.