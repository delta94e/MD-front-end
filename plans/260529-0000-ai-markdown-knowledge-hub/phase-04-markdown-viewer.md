---
phase: 4
title: "Markdown Viewer"
status: completed
priority: P1
effort: "3h"
dependencies: [2]
---

# Phase 4: Markdown Viewer

## Overview

Implement the markdown viewer using react-markdown with GFM support, syntax-highlighted code blocks (rehype-prism-plus), table of contents generation, and action bar with buttons for AI features (wired in Phase 6).

## Requirements

- Functional: Render markdown with headings, lists, tables, code blocks, images, links, blockquotes
- Non-functional: Syntax highlighting for 200+ languages, copy button on code blocks, TOC with scroll-spy

## Architecture

```
Content Area (from Phase 2 layout)
├── Breadcrumb — category > filename
├── Action bar — Edit, Summarize, Translate, AI Explain buttons
├── Table of Contents — floating right or top (h2/h3 extracted)
└── MarkdownViewer (react-markdown)
    ├── remark-gfm (tables, task lists, strikethrough)
    ├── rehype-prism-plus (syntax highlighting)
    ├── rehype-raw (raw HTML support)
    └── Custom components (code block with copy, heading anchors, images)
```

## Related Code Files

- Create: `components/markdown-viewer.tsx` (main viewer component)
- Create: `components/code-block.tsx` (syntax-highlighted code with copy button)
- Create: `components/table-of-contents.tsx` (TOC with scroll-spy)
- Create: `components/breadcrumb.tsx`
- Create: `components/action-bar.tsx` (Edit, Summarize, Translate, Explain buttons)
- Create: `app/[category]/[slug]/page.tsx` (document page)
- Create: `app/[category]/[slug]/layout.tsx` (document layout)

## Implementation Steps

1. Create `components/code-block.tsx`:
   - Wraps `<pre><code>` from rehype-prism-plus
   - Copy button (top-right): copies code to clipboard, shows checkmark for 2s
   - Line numbers: optional, via rehype-prism-plus config
   - Language badge (top-left): shows language name
   - Style: bg `#1e2030` (dark) / `#f6f8fa` (light), rounded 8px, 16px padding

2. Create `components/markdown-viewer.tsx`:
   - Props: `content: string`
   - Uses `ReactMarkdown` with plugins:
     - `remarkGfm` — tables, task lists, strikethrough, autolinks
     - `rehypePrismPlus` — syntax highlighting with line numbers
     - `rehypeRaw` — allow raw HTML in markdown
   - Custom component overrides:
     - `code` → CodeBlock (inline code vs block detection)
     - `h2, h3` → heading with anchor link (id from slug, hover shows link icon)
     - `img` → Next.js Image with lazy loading (or regular img with loading="lazy")
     - `a` → external links open in new tab, internal links use router
     - `table` → wrapper with horizontal scroll
     - `blockquote` → styled with left accent border
   - Apply typography from design guidelines (font sizes, line heights, colors)

3. Create `components/table-of-contents.tsx`:
   - Parse markdown headings (h2, h3) using regex or AST
   - Render as nested list with indentation
   - Scroll-spy: highlight current heading based on scroll position (IntersectionObserver)
   - Click: smooth scroll to heading
   - Position: floating right on desktop, collapsible section on mobile

4. Create `components/breadcrumb.tsx`:
   - Shows: category name > file name
   - Category: from URL params or folder name
   - Style: caption size, text-secondary, folder icon

5. Create `components/action-bar.tsx`:
   - Buttons: Edit (pencil icon), Summarize (sparkles), Translate (globe), AI Explain (bot)
   - Edit button: toggles editor mode (Phase 5)
   - AI buttons: open AI panel with appropriate tab (Phase 6)
   - Position: top-right of content area, sticky
   - Style: ghost icon buttons with tooltips

6. Create `app/[category]/[slug]/page.tsx`:
   - Server component
   - Read file content using `getFileContent` server action
   - Resolve path from URL params: `{CONTENT_DIR}/{category}/{slug}.md`
   - Pass content to client MarkdownViewer
   - Handle file not found (404)

7. Create `app/[category]/[slug]/layout.tsx`:
   - Wraps page with breadcrumb + action bar + TOC sidebar
   - Pass category/slug to breadcrumb

8. Wire up file selection from Phase 3:
   - When user clicks file in tree → navigate to `/{category}/{slug}`
   - Or: update Zustand activeFile, fetch content client-side
   - Prefer URL-based routing for deep linking / back button

9. Add loading state:
   - `loading.tsx` in `[category]/[slug]/` with skeleton
   - Skeleton: gray lines mimicking paragraph structure

10. Run `npm run build` to verify all markdown renders

## Success Criteria

- [ ] Markdown renders correctly (headings, lists, tables, code, images, links)
- [ ] Code blocks have syntax highlighting with copy button
- [ ] GFM features work (tables, task lists, strikethrough)
- [ ] TOC shows h2/h3, highlights current section on scroll
- [ ] Breadcrumb shows category > filename
- [ ] Action bar buttons render (functionality wired in Phase 6)
- [ ] Large markdown files (>5000 lines) render without jank
- [ ] External links open in new tab

## Risk Assessment

- **Risk:** rehype-prism-plus bundle size with all languages. **Mitigation:** Import only common languages, lazy-load others.
- **Risk:** rehype-raw XSS vulnerability. **Mitigation:** Sanitize HTML input or disable rehype-raw for user-editable content.
- **Risk:** TOC scroll-spy performance on large docs. **Mitigation:** Throttle IntersectionObserver callbacks.

## Security Considerations

- **XSS:** rehype-raw allows raw HTML. Since these are local trusted files, this is acceptable. If user-generated content is added later, add DOMPurify sanitization.
- **External links:** Add `rel="noopener noreferrer"` to all external links.
