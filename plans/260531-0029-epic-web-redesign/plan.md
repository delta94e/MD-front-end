# Epic Web Style Redesign Plan

## Overview
Redesign Knowledge Hub UI following the **Epic Web / Epic React** workshop aesthetic: dark-mode-first, developer-centric, bold typography, clean functional layout, monospace accents, content-first approach.

## Design Direction

### Target Aesthetic (Epic Web Style)
- **Dark-mode-first** with deep navy/slate backgrounds (#0F172A, #1E293B)
- **Bold, confident typography** with clear hierarchy (Inter/Geist + monospace accents)
- **High contrast** — bright text on dark surfaces, vibrant accent colors
- **Content-first** — minimal chrome, maximum space for reading/code
- **Developer-centric** — monospace for technical elements, code-style decorations
- **Clean functional layout** — workshop-style side-by-side panels

### Current State vs Target

| Aspect | Current | Target (Epic Web) |
|--------|---------|-------------------|
| Default theme | Light | Dark |
| Background | oklch(1 0 0) white | #0F172A deep navy |
| Primary color | oklch(0.205 0 0) near-black | #3B82F6 vibrant blue |
| Accent | Muted gray | #22C55E green (code/run) |
| Typography | Geist (good) | Geist/Inter + JetBrains Mono |
| Header | 48px, minimal | Bold branding, workshop feel |
| Sidebar | Plain file tree | Styled with depth, categories |
| Content area | Standard markdown | Enhanced code blocks, better spacing |
| AI panel | Tab-heavy, cramped | Cleaner tabs, better visual hierarchy |

## Implementation Phases

### Phase 1: Color System Overhaul
**Files:** `app/globals.css`, `tailwind.config.ts`

1. Redesign dark mode color tokens (primary palette):
   - Background: `#0F172A` (slate-950) → `#1E293B` (slate-800) for cards
   - Foreground: `#F8FAFC` (slate-50)
   - Primary: `#3B82F6` (blue-500) — links, active states
   - Accent: `#22C55E` (green-500) — success, code highlights
   - Muted: `#1E293B` backgrounds, `#94A3B8` text
   - Border: `rgba(255,255,255,0.08)` subtle dividers

2. Update light mode to complement (not just invert):
   - Background: `#F8FAFC` (slate-50)
   - Card: `#FFFFFF`
   - Primary: `#2563EB` (blue-600)
   - Text: `#1E293B` (slate-800)

3. Add semantic color tokens:
   - `--code-bg`: code block background
   - `--code-border`: code block border
   - `--ai-glow`: AI feature accent (keep existing purple)
   - `--success`: green for completions
   - `--warning`: amber for dirty state

### Phase 2: Typography Enhancement
**Files:** `app/globals.css`, `app/layout.tsx`

1. Keep Geist as primary (already modern, dev-friendly)
2. Add JetBrains Mono as code font option
3. Improve type scale:
   - H1: 1.75rem/700 weight, tight tracking
   - H2: 1.35rem/600 weight
   - H3: 1.15rem/600 weight
   - Body: 1rem/400, line-height 1.75
   - Code: 0.875rem/400 monospace
   - Labels: 0.75rem/500 uppercase tracking

4. Improve markdown content styles:
   - Better code block styling (syntax-aware background)
   - Enhanced blockquote styling (left border accent)
   - Better table styling (zebra stripes, sticky headers)

### Phase 3: Header Redesign
**File:** `components/app-header.tsx`

1. Increase height to 56px for more presence
2. Add brand styling:
   - App icon with subtle glow effect
   - "Knowledge Hub" in bold with monospace accent
   - Breadcrumb path styled as code path
3. Improve action buttons:
   - Active state with primary color background
   - Icon + label on desktop, icon-only on mobile
   - Subtle hover glow effect
4. Add keyboard shortcut hints in tooltips

### Phase 4: Sidebar Enhancement
**File:** `components/file-tree.tsx`

1. Style the search input:
   - Dark background with subtle border
   - Focus ring with primary color
   - Search icon with muted color
2. Improve tree item styling:
   - Active item with primary/10% background + left border accent
   - Hover state with subtle highlight
   - Directory icons with category-based colors
   - File count badges with muted styling
3. Add subtle depth indicators (indent guides)
4. Improve loading skeleton (shimmer effect)

### Phase 5: Content Area Polish
**Files:** `components/content-viewer.tsx`, `components/markdown-viewer.tsx`, `app/globals.css`

1. Improve toolbar:
   - Sticky toolbar with backdrop blur
   - Button groups with visual separation
   - Active mode indicator
2. Enhance markdown rendering:
   - Code blocks with darker background, subtle border
   - Inline code with background tint
   - Better heading anchors (visible on hover)
   - Improved link styling (underline on hover)
3. Reading mode improvements:
   - Better focus dimming
   - Smoother transitions
4. Empty state:
   - Centered with icon and helpful text
   - Subtle animation

### Phase 6: AI Panel Refinement
**File:** `components/ai-panel.tsx`

1. Improve tab styling:
   - Active tab with bottom border accent
   - Better spacing between primary/secondary rows
   - Icon + label alignment
2. Enhance AI response cards:
   - Subtle gradient background
   - Better code block rendering
   - Copy button with feedback
3. Improve exercise cards:
   - Better visual hierarchy
   - Reveal animation
   - Code blocks with proper styling
4. Loading states:
   - Skeleton shimmer instead of plain pulse
   - Streaming text animation

### Phase 7: Micro-interactions & Polish
**Files:** Various components

1. Add transition tokens:
   - `--transition-fast`: 150ms ease
   - `--transition-normal`: 200ms ease
   - `--transition-slow`: 300ms ease
2. Improve focus states:
   - 2px ring with primary/50% opacity
   - Offset for better visibility
3. Add hover effects:
   - Cards: subtle lift with shadow
   - Buttons: background darken
   - Links: underline animation
4. Improve scroll behavior:
   - Smooth scrolling
   - Custom scrollbar styling
   - Scroll-to-top button

## Files to Modify

| File | Changes |
|------|---------|
| `app/globals.css` | Color tokens, typography, markdown styles, animations |
| `app/layout.tsx` | Font imports, metadata |
| `components/app-header.tsx` | Layout, branding, actions |
| `components/file-tree.tsx` | Search, tree items, loading |
| `components/content-viewer.tsx` | Toolbar, empty states |
| `components/ai-panel.tsx` | Tabs, responses, exercises |
| `components/ui/button.tsx` | Variant styles |
| `components/ui/tabs.tsx` | Tab styling |
| `components/markdown-viewer.tsx` | Content rendering |
| `components/selection-toolbar.tsx` | Toolbar styling |
| `components/toc-panel.tsx` | TOC styling |

## Success Criteria

- [ ] Dark mode is default and visually matches Epic Web aesthetic
- [ ] Light mode complements dark mode (not just inverted)
- [ ] Typography hierarchy is clear and readable
- [ ] Code blocks are visually distinct and readable
- [ ] AI panel feels integrated, not bolted-on
- [ ] All interactive elements have proper hover/focus states
- [ ] Transitions are smooth (150-300ms)
- [ ] Mobile layout is functional and readable
- [ ] No accessibility regressions (contrast, focus, keyboard nav)

## Visual Reference

The Epic Web workshop uses:
- Deep navy backgrounds (#0F172A)
- Vibrant blue accents (#3B82F6)
- Green for success/code (#22C55E)
- Clean sans-serif headings (Inter/Geist)
- Monospace for code elements
- Minimal borders, subtle shadows
- Content-first layout with generous spacing
