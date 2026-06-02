---
phase: 1
title: "Project Setup & Configuration"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Project Setup & Configuration

## Overview

Initialize Next.js 15 project with App Router, install all dependencies, configure Tailwind CSS 4, shadcn/ui, TypeScript, ESLint, and environment variables. Create the foundational project structure.

## Requirements

- Functional: Next.js 15 app running with `npm run dev`, Tailwind working, shadcn/ui installed
- Non-functional: Clean TypeScript config, ESLint + Prettier configured, `.env.example` with required vars

## Architecture

```
app/                          # Next.js App Router root
├── layout.tsx                # Root layout (providers, fonts)
├── page.tsx                  # Home redirect to first doc
├── globals.css               # Tailwind + CSS variables
├── [category]/
│   └── [slug]/
│       └── page.tsx          # Document page (placeholder)
├── api/                      # API routes (placeholder dirs)
├── components/               # Shared components
├── lib/                      # Utilities, stores, helpers
└── providers.tsx             # Theme + Zustand providers

tailwind.config.ts            # Tailwind config with design tokens
components.json               # shadcn/ui config
.env.local                    # Environment variables
.env.example                  # Template for env vars
```

## Related Code Files

- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/providers.tsx`
- Create: `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`, `components.json`
- Create: `.env.example`, `.env.local`
- Create: `lib/utils.ts` (shadcn/ui utility)

## Implementation Steps

1. Run `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint
2. Install core dependencies:
   - `npm install zustand next-themes lucide-react`
   - `npm install react-arborist flexsearch`
   - `npm install react-markdown remark-gfm rehype-prism-plus rehype-raw`
   - `npm install @uiw/react-codemirror @codemirror/lang-markdown @codemirror/theme-one-dark`
   - `npm install allotment`
   - `npm install ai @ai-sdk/google @ai-sdk/anthropic`
3. Initialize shadcn/ui: `npx shadcn@latest init` (New York style, Zinc base)
4. Add shadcn components: `npx shadcn@latest add sidebar button input tabs tooltip scroll-area sheet dialog skeleton separator badge`
5. Configure `tailwind.config.ts` with design tokens from `docs/design-guidelines.md`
6. Create `app/globals.css` with CSS custom properties for dark/light themes
7. Create `app/providers.tsx` with ThemeProvider (next-themes) wrapping
8. Update `app/layout.tsx` to use providers, load Inter + JetBrains Mono fonts
9. Create `.env.example` with `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`, `CONTENT_DIR`
10. Create placeholder directory structure for `app/api/`, `app/components/`, `app/lib/`
11. Run `npm run build` to verify no errors

## Success Criteria

- [ ] `npm run dev` starts without errors
- [ ] Tailwind CSS classes work (test with a colored div)
- [ ] shadcn/ui Button component renders correctly
- [ ] Dark/light theme toggle works via next-themes
- [ ] Fonts (Inter, JetBrains Mono) load correctly
- [ ] `npm run build` succeeds with zero errors
- [ ] `.env.example` contains all required variables

## Risk Assessment

- **Risk:** Tailwind CSS 4 has breaking changes from v3 (new config format). **Mitigation:** Use `@tailwindcss/postcss` plugin, follow v4 migration guide.
- **Risk:** shadcn/ui may not fully support Tailwind v4 yet. **Mitigation:** Check shadcn/ui docs for v4 compatibility; fall back to v3 if needed.

## Security Considerations

- `.env.local` must be in `.gitignore`
- No API keys in code — all via environment variables
