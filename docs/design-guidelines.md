# Design Guidelines — AI-Powered Markdown Knowledge Hub

> Personal Knowledge Management (PKM) web app for software engineers.
> Stack: Next.js, Tailwind CSS, shadcn/ui, next-themes.

---

## 1. Design Tokens

### 1.1 Color Palette

#### Dark Mode (Default)

| Token                  | Hex       | Usage                          |
|------------------------|-----------|--------------------------------|
| `--bg-primary`         | `#0f1117` | App background                 |
| `--bg-secondary`       | `#161822` | Sidebar, panels                |
| `--bg-tertiary`        | `#1e2030` | Cards, elevated surfaces       |
| `--bg-hover`           | `#262940` | Hover states                   |
| `--bg-active`          | `#2d3150` | Active/selected items          |
| `--border-default`     | `#2a2d3e` | Default borders                |
| `--border-subtle`      | `#1e2030` | Subtle dividers                |
| `--text-primary`       | `#e2e4f0` | Primary text                   |
| `--text-secondary`     | `#8b8fa8` | Secondary/muted text           |
| `--text-tertiary`      | `#5c6078` | Disabled/hint text             |
| `--accent-primary`     | `#6c8aff` | Primary actions, links         |
| `--accent-hover`       | `#8ba3ff` | Accent hover                   |
| `--accent-subtle`      | `#6c8aff1a` | Accent background (10% opacity) |
| `--success`            | `#4ade80` | Success states                 |
| `--warning`            | `#fbbf24` | Warning states                 |
| `--error`              | `#f87171` | Error states                   |
| `--ai-glow`            | `#a78bfa` | AI panel accent (purple)       |
| `--ai-glow-subtle`     | `#a78bfa1a` | AI panel background           |

#### Light Mode

| Token                  | Hex       | Usage                          |
|------------------------|-----------|--------------------------------|
| `--bg-primary`         | `#ffffff` | App background                 |
| `--bg-secondary`       | `#f8f9fb` | Sidebar, panels                |
| `--bg-tertiary`        | `#f0f1f5` | Cards, elevated surfaces       |
| `--bg-hover`           | `#e8eaf0` | Hover states                   |
| `--bg-active`          | `#dde0ea` | Active/selected items          |
| `--border-default`     | `#dde0ea` | Default borders                |
| `--border-subtle`      | `#eef0f5` | Subtle dividers                |
| `--text-primary`       | `#1a1d2e` | Primary text                   |
| `--text-secondary`     | `#6b7089` | Secondary/muted text           |
| `--text-tertiary`      | `#9ca0b5` | Disabled/hint text             |
| `--accent-primary`     | `#4f6ae6` | Primary actions, links         |
| `--accent-hover`       | `#3d56cc` | Accent hover                   |
| `--accent-subtle`      | `#4f6ae614` | Accent background             |
| `--success`            | `#22c55e` | Success states                 |
| `--warning`            | `#eab308` | Warning states                 |
| `--error`              | `#ef4444` | Error states                   |
| `--ai-glow`            | `#7c3aed` | AI panel accent (purple)       |
| `--ai-glow-subtle`     | `#7c3aed10` | AI panel background           |

### 1.2 Spacing Scale (4px base)

| Token  | Value | Usage                    |
|--------|-------|--------------------------|
| `xs`   | 4px   | Icon gaps, tight padding |
| `sm`   | 8px   | Inner padding, gaps      |
| `md`   | 12px  | Component padding        |
| `lg`   | 16px  | Section padding, gaps    |
| `xl`   | 24px  | Panel padding            |
| `2xl`  | 32px  | Large section gaps       |
| `3xl`  | 48px  | Page-level spacing       |

### 1.3 Border Radius

| Token      | Value | Usage                      |
|------------|-------|----------------------------|
| `sm`       | 4px   | Badges, small elements     |
| `md`       | 6px   | Buttons, inputs            |
| `lg`       | 8px   | Cards, panels              |
| `xl`       | 12px  | Modals, dropdowns          |
| `full`     | 9999px| Avatars, pills             |

### 1.4 Shadows (Dark Mode)

| Token     | Value                                      | Usage              |
|-----------|--------------------------------------------|--------------------|
| `sm`      | `0 1px 2px rgba(0,0,0,0.3)`               | Subtle elevation   |
| `md`      | `0 4px 12px rgba(0,0,0,0.4)`              | Dropdowns, popups  |
| `lg`      | `0 8px 24px rgba(0,0,0,0.5)`              | Modals             |
| `glow`    | `0 0 20px rgba(108,138,255,0.15)`          | Focus rings        |
| `ai-glow` | `0 0 20px rgba(167,139,250,0.15)`          | AI panel highlight |

---

## 2. Typography

### 2.1 Font Stack

| Role          | Font Family                              | Fallback          |
|---------------|------------------------------------------|-------------------|
| UI Text       | `Geist` (next/font/google)               | system-ui, sans   |
| Code/Mono     | `Geist Mono` (next/font/google)          | monospace         |

**Load strategy:** CSS variables `--font-geist-sans` and `--font-geist-mono` set via `next/font`.

### 2.2 Type Scale

| Name      | Size | Weight | Line Height | Letter Spacing | Usage               |
|-----------|------|--------|-------------|----------------|---------------------|
| `h1`      | 28px | 700    | 1.3         | -0.02em        | Page titles         |
| `h2`      | 22px | 600    | 1.35        | -0.01em        | Section headings    |
| `h3`      | 18px | 600    | 1.4         | 0              | Subsection headings |
| `body`    | 14px | 400    | 1.6         | 0              | Body text           |
| `body-sm` | 13px | 400    | 1.5         | 0              | Secondary text      |
| `caption` | 12px | 400    | 1.4         | 0.01em         | Labels, badges      |
| `code`    | 13px | 400    | 1.6         | 0              | Inline code         |
| `code-blk`| 13px | 400    | 1.7         | 0              | Code blocks         |

### 2.3 Markdown Content Typography

Inside the rendered markdown viewer:

- Headings: `h1` 24px, `h2` 20px, `h3` 17px (slightly smaller than page UI)
- Paragraphs: 15px, line-height 1.75 for readability
- Code blocks: `Geist Mono 13px`, bg `var(--muted)`, padding 16px, rounded 8px
- Inline code: `Geist Mono 13px`, bg `var(--muted)`, padding 2px 6px, rounded 4px
- Blockquotes: left border 3px `accent-primary`, italic, `text-secondary`
- Links: `accent-primary`, underline on hover
- Lists: 1.6 line-height, 24px indent
- Tables: bordered, header bg `bg-tertiary`, zebra stripe `bg-secondary`

---

## 3. Layout System

### 3.1 Three-Panel Layout

```
+--------------------------------------------------+
| Header (48px)                                      |
+--------+---------------------------+-------------+
| Sidebar| Content Area              | AI Panel    |
| 280px  | flex-1                    | 320px       |
| (resiz) |                           | (collapsible)|
|        |                           |             |
|        |                           |             |
+--------+---------------------------+-------------+
```

| Panel      | Width        | Behavior                          |
|------------|--------------|-----------------------------------|
| Header     | 100%, 48px   | Fixed top, z-50                   |
| Sidebar    | 280px default| Resizable 200-400px, collapsible  |
| Content    | flex-1       | Min 400px, scrollable             |
| AI Panel   | 320px default| Collapsible (right side), overlay on mobile |

### 3.2 Breakpoints

| Name     | Min Width | Behavior                                      |
|----------|-----------|-----------------------------------------------|
| `sm`     | 640px     | Minor text/icon adjustments                   |
| `lg`     | 1024px    | Sidebar + AI panel visible (desktop layout)   |
| `xl`     | 1280px    | Wider content area                            |
| `2xl`    | 1536px    | Maximum content width                         |

### 3.3 Responsive Behavior

- **Mobile (< 1024px):** Sidebar as overlay drawer with backdrop. Hamburger menu in header. AI panel hidden. Content full-width.
- **Desktop (1024px+):** Sidebar + content visible. AI panel collapsible (320px). All panels resizable.

---

## 4. Component Patterns

### 4.1 Sidebar / File Tree

- **Folder item:** Icon (folder) + name + file count badge. Indented children (16px per level).
- **File item:** Icon (file-text) + name. Hover: `bg-hover`. Active: `bg-active` + left border accent.
- **Expand/collapse:** Chevron icon rotates 90deg on expand. Transition: 150ms ease.
- **Search bar:** Sticky top of sidebar. Input with search icon. Debounced filter (300ms).
- **Collapse button:** At bottom of sidebar. Slides sidebar to 0 width, shows expand icon.

### 4.2 Markdown Viewer

- **Breadcrumb:** `category > filename` at top. Caption size, `text-secondary`.
- **TOC:** Floating right or integrated. Shows h2/h3 with scroll-spy highlight.
- **Code blocks:** Syntax highlighting via `rehype-prism-plus` (Prism.js). Copy button top-right.
- **Action bar:** Top-right of viewer. Icon buttons: Edit (pencil), Summarize (sparkles), Translate (globe), AI Explain (bot).

### 4.3 Markdown Editor (Split-Pane)

- **Layout:** 50/50 split. Draggable divider (4px wide, cursor-col-resize).
- **Editor:** CodeMirror 6 with markdown mode, line numbers, active line highlight.
- **Preview:** react-markdown with same styling as viewer.
- **Toolbar:** Top bar with Save button, mode toggle (view/edit), word count.
- **Save indicator:** Dot next to filename when unsaved. Ctrl+S saves.

### 4.4 AI Panel

- **Header:** "AI Assistant" title + collapse button.
- **Tab bar:** 7 tabs in a grid: Summarize | Explain | Translate | Write | Path | Guide | Skill. Active tab: accent underline.
- **Streaming output:** Typewriter animation, markdown rendered in real-time.
- **Input area:** For Translate/Write, textarea with send button.
- **Empty state:** Subtle illustration + prompt text ("Select text and click Explain").
- **Loading state:** Pulsing dots or skeleton lines.

### 4.5 Buttons

| Variant   | Style                                                    |
|-----------|----------------------------------------------------------|
| Primary   | `bg-accent-primary`, white text, hover: `bg-accent-hover`|
| Secondary | `bg-tertiary`, `text-primary`, border `border-default`   |
| Ghost     | Transparent, `text-secondary`, hover: `bg-hover`         |
| Icon      | 32x32, ghost style, icon only                            |
| Danger    | `bg-error`, white text                                   |

### 4.6 Inputs

- Height: 36px. Padding: 8px 12px. Border: 1px `border-default`. Radius: 6px.
- Focus: border `accent-primary`, ring 2px `accent-subtle`.
- Placeholder: `text-tertiary`.

---

## 5. Iconography

- **Icon set:** Lucide React (consistent with shadcn/ui)
- **Size:** 16px default, 20px for headings, 14px for inline
- **Stroke width:** 1.75px
- **Color:** `currentColor` (inherits text color)

Key icons:
| Action        | Icon Name    |
|---------------|-------------|
| Folder        | `folder`     |
| Folder open   | `folder-open`|
| File          | `file-text`  |
| Search        | `search`     |
| Edit          | `pencil`     |
| Save          | `save`       |
| AI/Sparkle    | `sparkles`   |
| Translate     | `languages`  |
| Explain       | `bot`        |
| Sun/Moon      | `sun`/`moon` |
| Collapse      | `panel-left-close` / `panel-left-open` |
| Chevron       | `chevron-right` |
| Copy          | `copy`       |
| Check         | `check`      |

---

## 6. Motion & Animation

| Element           | Property    | Duration | Easing          |
|-------------------|-------------|----------|-----------------|
| Sidebar collapse  | width       | 200ms    | ease-in-out     |
| Folder expand     | height      | 150ms    | ease-out        |
| AI panel slide    | transform   | 250ms    | ease-in-out     |
| Tab switch        | opacity     | 150ms    | ease            |
| Hover states      | bg-color    | 100ms    | ease            |
| AI text stream    | opacity     | per-char | linear          |
| Button press      | scale(0.97) | 100ms    | ease            |
| Toast/feedback    | slide-up    | 200ms    | ease-out        |

**Utility classes:** `slide-in-left`, `slide-in-right`, `fade-in` (200ms ease-out). Used for mobile sidebar overlay and AI responses.

**CSS Keyframes:** `slideInLeft`, `slideInRight`, `fadeIn` defined in `globals.css`.

**Respect `prefers-reduced-motion`:** All animations/transitions disabled via `@media (prefers-reduced-motion: reduce)`.

---

## 7. Accessibility

- **Focus visible:** 2px ring `var(--ring)`, 2px offset. All interactive elements.
- **Keyboard nav:** Tab through sidebar items, Enter to open, Arrow keys (Up/Down/Left/Right) for tree navigation. Right arrow expands, Left arrow collapses.
- **Screen reader:** `aria-expanded` on folders, `aria-current="page"` on active file, `role="tree"` on file tree container, `role="treeitem"` on each item.
- **Icon buttons:** `aria-label` on all icon-only buttons (menu, theme toggle, graph, AI panel).
- **Color contrast:** All text meets WCAG AA (4.5:1 normal, 3:1 large).
- **Touch targets:** Min 44x44px on mobile.
- **Reduced motion:** See section 6.

---

## 8. Markdown Content Specifics

### 8.1 Code Block Styling

```
+--[ Copy ]----------------------------------------+
|  1 | const x = 42;                                |
|  2 | function hello() {                           |
|  3 |   return "world";                            |
|  4 | }                                            |
+---------------------------------------------------+
```

- Background: `var(--muted)` (theme-aware via shadcn/ui tokens)
- Border: 1px `var(--border)`
- Line numbers: `text-tertiary`, 40px width, right-aligned
- Copy button: top-right, ghost icon, shows checkmark on copy

### 8.2 Heading Anchors

- Hover on heading shows link icon (anchor)
- Click copies URL with hash fragment
- Smooth scroll to heading on navigation

---

## 9. Implementation Notes

### 9.1 shadcn/ui Components to Use

- `Sidebar` — main sidebar component
- `ResizablePanel` — for sidebar/content/AI panel resizing
- `Tabs` — AI panel tabs
- `Button`, `Input`, `Textarea` — standard form elements
- `Tooltip` — icon button labels
- `ScrollArea` — custom scrollbars
- `Sheet` — mobile sidebar drawer
- `Dialog` — modals
- `DropdownMenu` — context menus
- `Skeleton` — loading states

### 9.2 Key Libraries

| Library           | Purpose                          |
|-------------------|----------------------------------|
| `next-themes`     | Dark/light theme switching       |
| `react-markdown`  | Markdown rendering               |
| `rehype-prism-plus`| Syntax highlighting (Prism.js)  |
| `@codemirror/view`| Editor                           |
| `lucide-react`    | Icons                            |
| `zustand`         | State management                 |
| `sonner`          | Toast notifications              |

---

## 10. Design Principles

1. **Dark-first:** Design for dark mode, adapt to light. Developers prefer dark.
2. **Content density:** Show more content, less chrome. Tight but not cramped.
3. **Keyboard-first:** Every action has a keyboard shortcut.
4. **Progressive disclosure:** AI features are discoverable but not intrusive.
5. **Instant feedback:** Every click has immediate visual response.
6. **Code readability:** Syntax highlighting and monospace fonts are first-class.
