# Lexical Rich Text Editor Research Report

**Date**: 2026-05-29  
**Target Stack**: Next.js 16.2.6, React 19.2.4, TypeScript  
**Latest Lexical Version**: v0.45.0 (May 28, 2026)

---

## Core NPM Packages

```bash
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/code @lexical/link @lexical/selection @lexical/utils
```

| Package | Purpose |
|---------|---------|
| `lexical` | Core editor framework (22kb min+gzip) |
| `@lexical/react` | React bindings (LexicalComposer, plugins) |
| `@lexical/markdown` | Markdown import/export, TRANSFORMERS |
| `@lexical/rich-text` | Rich text features (bold, italic, headings) |
| `@lexical/list` | List support (ordered, unordered) |
| `@lexical/code` | Code block support |
| `@lexical/link` | Link handling |
| `@lexical/selection` | Selection utilities ($setBlocksType) |
| `@lexical/utils` | Utility helpers |

---

## Key Components & Plugins

### Core Setup
```jsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
```

### Markdown Conversion API
```jsx
import { 
  TRANSFORMERS, 
  $convertToMarkdownString, 
  $convertFromMarkdownString 
} from '@lexical/markdown';

// Export to markdown
editor.update(() => {
  const markdown = $convertToMarkdownString(TRANSFORMERS);
});

// Import from markdown
editor.update(() => {
  $convertFromMarkdownString(markdown, TRANSFORMERS);
});
```

### Toolbar Implementation Pattern
```jsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  
  const formatBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  const formatItalic = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  // Headings, lists, code blocks use $setBlocksType
}
```

---

## Architecture: WYSIWYG + Markdown Source Mode

### Option A: Dual Editor (Recommended)

```
┌─────────────────────────────────────────┐
│ ToolbarPlugin                           │
├─────────────────────┬───────────────────┤
│ WYSIWYG Editor      │ Markdown Source   │
│ (Lexical)           │ (CodeMirror)      │
│                     │                   │
│ Rich text editing   │ Raw markdown      │
└─────────────────────┴───────────────────┘
```

**Implementation**:
1. **WYSIWYG pane**: Lexical with RichTextPlugin, HistoryPlugin, toolbar
2. **Source pane**: CodeMirror with markdown syntax highlighting
3. **Sync**: 
   - WYSIWYG → Source: `$convertToMarkdownString(TRANSFORMERS)` on editor change
   - Source → WYSIWYG: `$convertFromMarkdownString(markdown, TRANSFORMERS)` on text change
4. **Debounce**: 300ms to avoid cursor jank

### Option B: Single Editor with Mode Toggle

- Single Lexical editor instance
- Toggle between WYSIWYG and markdown source view
- Source view: Read-only CodeMirror showing current markdown
- Less complex but no simultaneous editing

---

## React 19 / Next.js 16 Compatibility

### Known Issues
- Lexical v0.45.0 should support React 19 (check GitHub issues for specific bugs)
- SSR conflicts: Lexical is client-side only
- Hydration mismatches with RSC (React Server Components)

### Workarounds
```jsx
// Use dynamic import with ssr: false
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('./Editor'), { 
  ssr: false,
  loading: () => <div>Loading editor...</div>
});
```

---

## Trade-off Matrix

| Aspect | Lexical | TipTap | Plate |
|--------|---------|--------|-------|
| Bundle size | 22kb core | ~50kb | ~100kb |
| Learning curve | Medium | Low | Low |
| Markdown support | Built-in | Plugin | Plugin |
| React integration | Official | Official | Official |
| Community size | Large (Meta) | Large | Medium |
| Maintenance | Active | Active | Active |

---

## Unresolved Questions

1. **Lexical + React 19 specific bugs**: Need to test v0.45.0 with React 19.2.4 for hydration issues
2. **CodeMirror integration**: Which CodeMirror version works best with Lexical?
3. **Performance**: Large document handling with bidirectional sync
4. **Custom nodes**: How to handle custom Lexical nodes in markdown conversion

---

## Recommendation

**Use Lexical v0.45.0** with dual-pane architecture (WYSIWYG + CodeMirror source).

**Why**:
- Official Meta framework, well-maintained
- Built-in markdown support via `@lexical/markdown`
- Smallest bundle size among alternatives
- Good React integration
- Active community and documentation

**Next Steps**:
1. Install packages and test basic setup with React 19
2. Implement WYSIWYG editor with toolbar
3. Add CodeMirror source pane
4. Implement bidirectional sync with debouncing
5. Test performance with large documents

---

**Sources**:
- [Lexical Official Docs](https://lexical.dev)
- [Lexical GitHub Repository](https://github.com/facebook/lexical)
- [Lexical v0.45.0 Release](https://github.com/facebook/lexical/releases/tag/v0.45.0)
- [React 19 Compatibility Issues](https://github.com/facebook/lexical/issues)
