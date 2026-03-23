# Frontend System Design: Notion-Like Application

**Tác giả:** Senior Frontend Engineer
**Phiên bản:** 1.0
**Ngày:** Tháng 3, 2026
**Đối tượng:** Senior Engineers, System Design Interview Preparation

---

## Table of Contents

1. [Tổng Quan & Giới Thiệu Notion](#1-tổng-quan--giới-thiệu-notion)
2. [Yêu Cầu Hệ Thống](#2-yêu-cầu-hệ-thống)
3. [Mockup & Kiến Trúc High-Level](#3-mockup--kiến-trúc-high-level)
4. [Component Types — Phân Loại Components](#4-component-types--phân-loại-components)
5. [Lexer & Parser — Kiến Trúc Markdown Parser](#5-lexer--parser--kiến-trúc-markdown-parser)
6. [Database Design — Hệ Thống Views](#6-database-design--hệ-thống-views)
7. [State & Entity Model](#7-state--entity-model)
8. [API Design — Thiết Kế API](#8-api-design--thiết-kế-api)
9. [Performance Optimization](#9-performance-optimization)
10. [Accessibility](#10-accessibility)
11. [Presentation Script — Notion System Design (English)](#11-presentation-script--notion-system-design-english)

---

## 1. Tổng Quan & Giới Thiệu Notion

### 1.1 Notion là gì?

Notion là một **web application** cho phép xây dựng **custom workspaces** sử dụng hệ thống **markdown syntax tự phát triển** cực kỳ tiên tiến. Về bản chất, Notion là một **rich-text editor** kết hợp với **database system** — mỗi page là một markdown page có thể chứa nhiều loại components khác nhau: headings, tables, toggles, callouts, databases...

```
┌─────────────────────────────────────────────────┐
│                    NOTION                        │
│                                                  │
│  ┌──────────┐   ┌─────────────────────────────┐ │
│  │ Workspace│   │       Page Content           │ │
│  │ Sidebar  │   │                              │ │
│  │          │   │  # Heading 1                 │ │
│  │ 📄 Page 1│   │  Some text content...        │ │
│  │ 📄 Page 2│   │                              │ │
│  │  └ Sub   │   │  ☑ Checkbox item             │ │
│  │ 📄 Page 3│   │  > Callout block             │ │
│  │          │   │                              │ │
│  │ 📊 DB 1  │   │  ┌─────────────────────┐    │ │
│  │          │   │  │ Database View        │    │ │
│  │          │   │  │ (Table/Calendar/     │    │ │
│  │          │   │  │  Timeline)           │    │ │
│  │          │   │  └─────────────────────┘    │ │
│  └──────────┘   └─────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 1.2 Tại sao Notion là bài System Design hay?

Notion là bài toán **đặc biệt** trong frontend system design vì nó tổng hợp nhiều challenge cùng lúc:

| Challenge | Chi tiết |
|-----------|----------|
| **Custom Markdown Parser** | Xây dựng lexer/parser/renderer pipeline cho syntax riêng |
| **Extendable Component Library** | Thiết kế để dễ dàng thêm component mới mà không sửa core |
| **Page Hierarchy** | Pages lồng nhau tạo tree structure — cần quản lý efficiently |
| **Database/Views System** | Nhóm pages thành views (table, calendar, timeline) — plugin architecture |
| **Offline-First** | Desktop-first app cần hoạt động offline, sync khi có mạng |
| **Collaborative Editing** | Nhiều users edit cùng page — conflict resolution |
| **Content Editable** | Sử dụng `contentEditable` thay vì `<input>` — MutationObserver tracking |

### 1.3 Khác biệt so với bài toán khác

So với Financial Dashboard (data-heavy, real-time, multi-window) — Notion thiên về **content authoring**, **extensibility**, và **offline capability**:

```
Financial Dashboard              Notion
─────────────────────           ─────────────────────
Real-time data stream    vs     Content authoring
WebSocket / Binary       vs     REST / GraphQL
IndexedDB for cache      vs     IndexedDB for offline
Multi-window sync        vs     Collaborative editing
Chart rendering perf     vs     DOM manipulation perf
Fixed component set      vs     Extendable components
```

---

## 2. Yêu Cầu Hệ Thống

### 2.1 General Requirements (Yêu cầu chính)

#### 2.1.1 Custom Editor với Live Transformation

Khi user gõ `# Hello` rồi nhấn Space — text **tự động** chuyển thành `<h1>Hello</h1>`. Đây không phải render sau khi submit — đây là **live transformation** ngay trong lúc gõ.

```
User gõ:     "# Hello World"
             ↓ nhấn Space
Kết quả:     <h1>Hello World</h1>  ← rendered ngay lập tức

User gõ:     "[] Buy milk"
             ↓ nhấn Space  
Kết quả:     ☐ Buy milk  ← checkbox component
```

**Cơ chế hoạt động:**

```
┌──────────────────────────────────────────────────┐
│ User gõ text vào contentEditable div             │
│            ↓                                     │
│ MutationObserver detect DOM change               │
│            ↓                                     │
│ Extract raw string từ modified node              │
│            ↓                                     │
│ Lexer tokenize string → component tokens         │
│            ↓                                     │
│ Parser match tokens → rendering functions        │
│            ↓                                     │
│ Renderer output HTML elements → replace DOM node │
└──────────────────────────────────────────────────┘
```

#### 2.1.2 Extendable Component Library

Component library phải được thiết kế theo **Open-Closed Principle** — open for extension, closed for modification. Thêm component mới = thêm 1 rule + 1 renderer. Không sửa core lexer hay parser.

```
Hiện tại:
  Rules: [H1Rule, H2Rule, H3Rule, ParagraphRule, CheckboxRule]
  Renderers: { h1: renderH1, h2: renderH2, ... }

Thêm Accordion:
  Rules: [H1Rule, H2Rule, H3Rule, ParagraphRule, CheckboxRule, AccordionRule]  ← thêm 1
  Renderers: { h1: renderH1, ..., accordion: renderAccordion }  ← thêm 1

Core lexer/parser: KHÔNG ĐỔI
```

#### 2.1.3 Page Hierarchy

Notion workspace là **cây pages** — page có thể chứa sub-pages, sub-page lại chứa sub-sub-pages. Cần thiết kế data structure hỗ trợ:

- **O(1) access** tới bất kỳ page nào bằng ID
- **Lazy loading** — không load toàn bộ tree khi mở app
- **Efficient updates** — thêm/xóa/di chuyển page không rebuild toàn bộ tree

```
Root Page
├── 📄 Work
│   ├── 📄 Project Alpha
│   │   ├── 📄 Sprint 1
│   │   └── 📄 Sprint 2
│   └── 📄 Project Beta
├── 📄 Personal
│   ├── 📄 Reading List
│   └── 📄 Travel Plans
└── 📊 Task Database
    ├── 📄 Task 1
    ├── 📄 Task 2
    └── 📄 Task 3
```

#### 2.1.4 Accessibility & Performance

- **Accessible by default** — semantic HTML, keyboard navigation, screen reader support
- **Performance** — Notion là desktop-first nên mobile performance ít critical hơn, nhưng vẫn cần optimize CPU rendering và network

### 2.2 Advanced Requirements (Yêu cầu nâng cao)

#### 2.2.1 Database System

Notion database = **page chứa nhiều pages** + hiển thị dưới dạng **custom views** (Table, Calendar, Timeline). Mỗi view cần **plugin metadata** riêng trên từng page.

```
Database "Tasks"
│
├── View: Table      → cần columns metadata
├── View: Calendar   → cần date metadata
├── View: Timeline   → cần start/end metadata
│
└── Pages:
    ├── Page "Design Review"  { date: "2026-03-15", start: ..., end: ..., cols: [...] }
    ├── Page "Code Review"    { date: "2026-03-16", start: ..., end: ..., cols: [...] }
    └── Page "Deploy"         { date: "2026-03-17", start: ..., end: ..., cols: [...] }
```

#### 2.2.2 Offline-First

Notion là offline-first — user edit được khi không có mạng. Khi có mạng lại thì sync changes lên server. Cần:

- **IndexedDB** để lưu pages locally
- **Delta-based sync** — không gửi toàn bộ page content, chỉ gửi diff/delta
- **Conflict resolution** — khi 2 users edit cùng page offline rồi sync

#### 2.2.3 Cross-Platform & Multi-Viewport

Notion chạy trên web → tự nhiên cross-platform. Nhưng cần responsive design cho different viewports. Desktop-first — sidebar visible. Mobile — sidebar collapsed thành hamburger menu.

---

## 3. Mockup & Kiến Trúc High-Level

### 3.1 Mockup

```
┌──────────────────────────────────────────────────────────┐
│  NOTION WORKSPACE                                 ⚙️ ···  │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│ SIDEBAR  │              CONTENT AREA                     │
│          │                                               │
│ 🔍 Search │  ┌─────────────────────────────────────────┐  │
│          │  │ 📄 Page Title                            │  │
│ ───────  │  │                                          │  │
│          │  │ # Heading 1                              │  │
│ 📄 Page A │  │                                          │  │
│ 📄 Page B │  │ Some paragraph text here with **bold**   │  │
│  └ Sub 1 │  │ and *italic* formatting.                 │  │
│  └ Sub 2 │  │                                          │  │
│ 📄 Page C │  │ > 💡 This is a callout block             │  │
│          │  │                                          │  │
│ 📊 Tasks │  │ ☑ Task completed                         │  │
│          │  │ ☐ Task pending                           │  │
│          │  │                                          │  │
│ ───────  │  │ ┌──────┬──────────┬────────┐            │  │
│ + New    │  │ │ Name │ Status   │ Date   │            │  │
│          │  │ ├──────┼──────────┼────────┤            │  │
│          │  │ │ ...  │ ...      │ ...    │            │  │
│          │  │ └──────┴──────────┴────────┘            │  │
│          │  └─────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────┘
```

### 3.2 High-Level Component Architecture

Đây là sơ đồ kiến trúc high-level cho toàn bộ hệ thống:

```
┌───────────────────────────────────────────────────────────────┐
│                     APPLICATION ROOT                          │
│                    (receives rootPageId)                       │
│                                                               │
│  ┌─────────────────┐          ┌────────────────────────────┐ │
│  │  APPLICATION     │          │     APPLICATION ROUTER      │ │
│  │  MENU (Sidebar)  │          │     (receives pageId)       │ │
│  │                  │          │                             │ │
│  │  Renders page    │          │  ┌──────────────────────┐  │ │
│  │  hierarchy tree  │          │  │    PAGE ROUTE         │  │ │
│  │  from rootPageId │          │  │    (pageId)           │  │ │
│  │                  │          │  │                       │  │ │
│  │  Click page →    │ ────────→│  │  ┌────────────────┐  │  │ │
│  │  navigate        │          │  │  │  PAGE CONTENT   │  │  │ │
│  │                  │          │  │  │  (raw string)   │  │  │ │
│  └─────────────────┘          │  │  │       ↓         │  │  │ │
│                                │  │  │  ┌──────────┐  │  │  │ │
│                                │  │  │  │ LEXER    │  │  │  │ │
│                                │  │  │  │ PARSER   │  │  │  │ │
│                                │  │  │  │ RENDERER │  │  │  │ │
│                                │  │  │  └──────────┘  │  │  │ │
│                                │  │  │       ↓         │  │  │ │
│                                │  │  │  HTML Elements  │  │  │ │
│                                │  │  └────────────────┘  │  │ │
│                                │  └──────────────────────┘  │ │
│                                └────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow — Luồng Dữ Liệu

Đây là phần **quan trọng nhất** về mặt kiến trúc — hiểu được data flow là hiểu được toàn bộ hệ thống:

```
                    ┌──────────────┐
                    │  GLOBAL STATE │
                    │  (pages map)  │
                    └───────┬──────┘
                            │ page content (raw string)
                            ↓
                    ┌──────────────┐
                    │ PAGE CONTENT  │
                    └───────┬──────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
        ┌──────────────┐       ┌──────────────┐
        │ STATIC AREA   │       │ SELECTED AREA │
        │ (cached HTML)  │       │ (editable)    │
        └──────────────┘       └───────┬──────┘
                                       │ user edits
                                       ↓
                               ┌──────────────────┐
                               │ MUTATION OBSERVER  │
                               │ (track DOM changes)│
                               └───────┬──────────┘
                                       │ changed string
                                       ↓
                               ┌──────────────────┐
                               │   DISPATCHER      │
                               │ dispatch(action)  │
                               └───────┬──────────┘
                                       │ UPDATE_CONTENT action
                                       ↓
                               ┌──────────────────┐
                               │  ACTION HANDLER   │
                               │  (reducer logic)  │
                               └───────┬──────────┘
                                       │ new state
                                       ↓
                               ┌──────────────┐
                               │ GLOBAL STATE  │ ← cycle repeats
                               └──────────────┘
```

**Giải thích chi tiết:**

**1. Static Area vs Selected Area**

Tại sao tách content thành 2 phần? Performance. Static area là phần user **không đang edit** — đã được parse và render rồi, có thể cache. Chỉ cần re-render khi page data thay đổi (từ server hoặc từ undo/redo). Selected area là phần user **đang gõ** — cần track changes real-time.

**2. contentEditable + MutationObserver**

Notion sử dụng `contentEditable` attribute thay vì `<input>` hay `<textarea>`. Lý do:

```javascript
// contentEditable cho phép bất kỳ HTML element nào trở thành editable
const div = document.createElement('div');
div.contentEditable = 'true';
// User có thể gõ trực tiếp vào div này — bao gồm rich text, images...
```

**Vấn đề:** `contentEditable` không fire `onChange` event như `<input>`. Giải pháp — **MutationObserver**:

```javascript
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'characterData' || mutation.type === 'childList') {
      const newContent = mutation.target.textContent;
      dispatcher.dispatch({
        type: 'UPDATE_CONTENT',
        pageId: currentPageId,
        content: newContent
      });
    }
  }
});

observer.observe(editableNode, {
  characterData: true,
  childList: true,
  subtree: true
});
```

**3. Dispatcher + Action Handler (Event-Based Architecture)**

Pattern tương tự Redux — nhưng simplified:

```javascript
class Dispatcher {
  constructor() {
    this.handlers = new Map();
  }

  register(actionType, handler) {
    this.handlers.set(actionType, handler);
  }

  dispatch(action) {
    const handler = this.handlers.get(action.type);
    if (handler) {
      const newState = handler(globalState, action);
      globalState = newState;
      notifySubscribers(); // trigger re-render
    }
  }
}

// Action handler (reducer)
function contentReducer(state, action) {
  if (action.type === 'UPDATE_CONTENT') {
    return {
      ...state,
      pages: {
        ...state.pages,
        [action.pageId]: {
          ...state.pages[action.pageId],
          content: action.content,
          hash: generateHash(action.content) // invalidate cache
        }
      }
    };
  }
  return state;
}
```

**Tại sao event-based?** Vì nó decouple hoàn toàn — MutationObserver không biết state structure, Action Handler không biết DOM. Mỗi phần thay đổi independently.

---

## 4. Component Types — Phân Loại Components

### 4.1 Ba loại Components

Notion components chia thành **3 loại** dựa trên behavior, không phải visual:

```
┌────────────────────────────────────────────────────────┐
│                   COMPONENT TYPES                       │
├──────────────┬──────────────────┬──────────────────────┤
│   VISUAL     │   STRUCTURAL     │  DATABASE            │
│              │                  │  CONNECTABLE          │
├──────────────┼──────────────────┼──────────────────────┤
│ Functional   │ Accept children  │ Accept PAGES as      │
│ components   │ components       │ children             │
│              │                  │                      │
│ Take data →  │ Provide layout   │ Provide custom VIEW  │
│ render UI    │ structure        │ of grouped pages     │
│              │                  │                      │
│ No children  │ Any component    │ Plugin metadata      │
│ allowed      │ as child         │ per page             │
├──────────────┼──────────────────┼──────────────────────┤
│ Examples:    │ Examples:        │ Examples:            │
│ • H1, H2, H3│ • Toggle/Accordion│ • Table View        │
│ • Paragraph  │ • Callout        │ • Calendar View     │
│ • Checkbox   │ • Column Layout  │ • Timeline View     │
│ • Image      │ • Quote Block    │ • Board/Kanban      │
│ • Divider    │ • Numbered List  │ • Gallery View      │
└──────────────┴──────────────────┴──────────────────────┘
```

### 4.2 Tại sao phân loại?

Phân loại giúp **chuẩn hoá interface** — tất cả visual components share 1 interface, tất cả structural components share 1 interface. Khi thêm component mới:

1. Xác định type (visual / structural / database)
2. Implement cùng interface với type đó
3. Đăng ký rule + renderer

**Không cần sửa core system.**

### 4.3 Interface cho từng loại

```typescript
// Base: mọi component đều có attributes
interface ComponentToken<Props> {
  type: string;           // "h1", "checkbox", "toggle"...
  attributes: Props;      // data specific to this component
}

// Visual: chỉ render, không có children
// → sử dụng ComponentToken<Props> trực tiếp

// Structural: có children
interface ContainerComponentToken<Props> extends ComponentToken<Props> {
  children: ComponentToken<unknown>[];  // bất kỳ component nào
}

// Database: children là PAGES, có plugin data
interface DatabaseComponentToken<Props> extends ComponentToken<Props> {
  databaseData: DatabasePluginData;     // timeline/calendar/table metadata
}
```

**Ví dụ cụ thể:**

```javascript
// Visual — H1 token
{
  type: 'h1',
  attributes: { text: 'Hello World', id: 'block-123' }
}

// Structural — Toggle token
{
  type: 'toggle',
  attributes: { summary: 'Click to expand' },
  children: [
    { type: 'paragraph', attributes: { text: 'Hidden content here' } },
    { type: 'checkbox', attributes: { text: 'Sub-task', checked: false } }
  ]
}

// Database — Table View token
{
  type: 'database-table',
  attributes: { title: 'Project Tasks' },
  databaseData: {
    pages: ['page-1', 'page-2', 'page-3'],
    columns: ['Name', 'Status', 'Due Date'],
    pluginType: 'table'
  }
}
```


---

## 5. Lexer & Parser — Kiến Trúc Markdown Parser

### 5.1 Tổng Quan Pipeline

Đây là **core** của toàn bộ hệ thống Notion — pipeline biến raw text thành rendered components. Pipeline gồm 3 giai đoạn:

```
Raw String → LEXER → Component Tokens → PARSER → HTML Elements → DOM
     ↑                                     ↑
     │                                     │
  Rules Set                          Render Set + Global State
  (regex patterns)                   (token → render function map)
```

**Tại sao tách thành 3 giai đoạn?**

- **Lexer** chỉ biết text → tokens. Không biết state, không biết render.
- **Parser** biết tokens → elements. Có access global state để inject data.
- **Renderer** (bên trong parser) biết cách output HTML.

Tách ra vì **mỗi phần thay đổi independently** — thêm syntax mới chỉ sửa Lexer rules. Thay đổi UI chỉ sửa renderer. Thay đổi data flow chỉ sửa parser.

### 5.2 Lexer Interface

```typescript
interface Lexer {
  process(rules: Rule[], content: string): ComponentToken[];
}
```

Lexer nhận **danh sách rules** và **raw string content**. Với mỗi dòng trong content, nó chạy qua tất cả rules, tìm rule match đầu tiên, và tạo token.

```javascript
function lexer(rules, content) {
  const lines = content.split('\n');
  const tokens = [];

  for (const line of lines) {
    let matched = false;

    for (const rule of rules) {
      if (rule.isValid(line)) {
        tokens.push(rule.getToken(line));
        matched = true;
        break; // first match wins
      }
    }

    if (!matched) {
      // Default: treat as paragraph
      tokens.push({ type: 'paragraph', attributes: { text: line } });
    }
  }

  return tokens;
}
```

**Lưu ý về performance:** Rules chạy sequentially trên mỗi dòng. Nếu có 500 rules thì mỗi dòng chạy tối đa 500 lần check — vẫn OK vì string matching rất nhanh và số components thực tế không quá nhiều. Nếu cần optimize thêm thì dùng **trie** hoặc **prefix matching** cho ký tự đầu.

### 5.3 Rule Interface

```typescript
interface Rule {
  isValid(line: string): boolean;
  getToken(line: string): ComponentToken;
}
```

Mỗi Rule có 2 methods:
- `isValid(line)` — kiểm tra dòng text này có match syntax không
- `getToken(line)` — parse dòng text thành ComponentToken

**Ví dụ implementations:**

```javascript
// Rule cho H1: bắt đầu bằng "# "
const h1Rule = {
  isValid(line) {
    return line.startsWith('# ');
  },
  getToken(line) {
    return {
      type: 'h1',
      attributes: { text: line.slice(2) }
    };
  }
};

// Rule cho Checkbox: bắt đầu bằng "[] " hoặc "[x] "
const checkboxRule = {
  isValid(line) {
    return /^\[[ x]\] /.test(line);
  },
  getToken(line) {
    return {
      type: 'checkbox',
      attributes: {
        text: line.slice(4),
        checked: line.startsWith('[x]')
      }
    };
  }
};

// Rule cho Accordion/Toggle: bắt đầu bằng "> "
const toggleRule = {
  isValid(line) {
    return line.startsWith('> ');
  },
  getToken(line) {
    return {
      type: 'toggle',
      attributes: { summary: line.slice(2) },
      children: [] // children parsed separately
    };
  }
};
```

### 5.4 Syntax Specification Table

Bảng quy định mapping giữa syntax và component:

| Syntax | Component | Type | Ví dụ |
|--------|-----------|------|-------|
| `# text` | Heading 1 | Visual | `# Hello World` |
| `## text` | Heading 2 | Visual | `## Section Title` |
| `### text` | Heading 3 | Visual | `### Sub Section` |
| `[] text` | Checkbox (unchecked) | Visual | `[] Buy milk` |
| `[x] text` | Checkbox (checked) | Visual | `[x] Done` |
| `> text` | Toggle/Accordion | Structural | `> Click to expand` |
| `\| text` | Table Row | Database | `\| Name \| Status \|` |
| `--- ` | Divider | Visual | `---` |
| `! text` | Callout | Structural | `! Important note` |
| *(default)* | Paragraph | Visual | `Hello world` |

**Extending:** Thêm component mới = thêm 1 hàng vào bảng + implement Rule + implement Renderer.

### 5.5 Parser Interface

```typescript
interface Parser {
  process(token: ComponentToken): HTMLElement;
}
```

Parser nhận component token, kết nối với **global state** để inject data, rồi dùng **render set** để tạo HTML:

```javascript
function parser(token, globalState, renderSet) {
  // 1. Get render function for this token type
  const renderFn = renderSet[token.type];
  if (!renderFn) {
    console.warn(`No renderer for type: ${token.type}`);
    return document.createTextNode(token.attributes.text || '');
  }

  // 2. Inject state data if needed
  const enrichedToken = enrichWithState(token, globalState);

  // 3. Render to HTML element
  const element = renderFn(enrichedToken);

  // 4. Recursively process children (for structural/database components)
  if (token.children) {
    for (const child of token.children) {
      const childEl = parser(child, globalState, renderSet);
      element.appendChild(childEl);
    }
  }

  return element;
}
```

### 5.6 Render Set

Render Set là **map từ token type → rendering function**. Đây là nơi duy nhất tạo HTML:

```javascript
const renderSet = {
  h1: (token) => {
    const el = document.createElement('h1');
    el.textContent = token.attributes.text;
    el.id = token.attributes.id || '';
    return el;
  },

  checkbox: (token) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'checkbox-block';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = token.attributes.checked;

    const label = document.createElement('label');
    label.textContent = token.attributes.text;

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    return wrapper;
  },

  toggle: (token) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = token.attributes.summary;
    details.appendChild(summary);

    const content = document.createElement('div');
    content.className = 'toggle-content';
    details.appendChild(content);
    return details; // children sẽ được append vào content bởi parser
  }
};
```

**Thêm component mới — ví dụ Callout:**

```javascript
// 1. Thêm Rule
const calloutRule = {
  isValid(line) { return line.startsWith('! '); },
  getToken(line) {
    return { type: 'callout', attributes: { text: line.slice(2) } };
  }
};

// 2. Thêm vào Render Set
renderSet.callout = (token) => {
  const div = document.createElement('div');
  div.className = 'callout-block';
  div.innerHTML = `<span class="callout-icon">💡</span><p>${token.attributes.text}</p>`;
  return div;
};

// 3. Đăng ký Rule vào rules array
rules.push(calloutRule);

// DONE. Core lexer/parser: KHÔNG ĐỔI.
```

### 5.7 Full Pipeline Example

```
Input: "# My Notes\n[] Buy milk\n[x] Clean house\n> FAQ\nWhat is Notion?"

Step 1 — LEXER
  Line "# My Notes"        → h1Rule matches     → { type: 'h1', attributes: { text: 'My Notes' } }
  Line "[] Buy milk"       → checkboxRule matches → { type: 'checkbox', attributes: { text: 'Buy milk', checked: false } }
  Line "[x] Clean house"   → checkboxRule matches → { type: 'checkbox', attributes: { text: 'Clean house', checked: true } }
  Line "> FAQ"              → toggleRule matches  → { type: 'toggle', attributes: { summary: 'FAQ' }, children: [] }
  Line "What is Notion?"   → default             → { type: 'paragraph', attributes: { text: 'What is Notion?' } }

Step 2 — PARSER (with renderSet)
  { type: 'h1' }       → renderSet.h1()       → <h1>My Notes</h1>
  { type: 'checkbox' } → renderSet.checkbox()  → <div class="checkbox-block"><input type="checkbox">...</div>
  { type: 'checkbox' } → renderSet.checkbox()  → <div class="checkbox-block"><input type="checkbox" checked>...</div>
  { type: 'toggle' }   → renderSet.toggle()    → <details><summary>FAQ</summary>...</details>
  { type: 'paragraph' }→ renderSet.paragraph() → <p>What is Notion?</p>

Step 3 — DOM
  Append all elements to page content container
```

---

## 6. Database Design — Hệ Thống Views

### 6.1 Khái Niệm

Notion "database" **không phải** relational database truyền thống. Nó là:

> **Page chứa nhiều Pages** + hiển thị dưới dạng **custom views**

Mỗi database là 1 page đặc biệt. Các pages bên trong database có thể được hiển thị dưới dạng Table, Calendar, Timeline, Board (Kanban), Gallery...

```
DATABASE PAGE "Project Tasks"
│
├── Contains:  Page "Design System"
│              Page "API Integration"
│              Page "Deploy to Prod"
│
├── View 1: TABLE
│   ┌───────────────────┬──────────┬────────────┐
│   │ Name              │ Status   │ Due Date   │
│   ├───────────────────┼──────────┼────────────┤
│   │ Design System     │ Done     │ Mar 10     │
│   │ API Integration   │ Active   │ Mar 15     │
│   │ Deploy to Prod    │ Planned  │ Mar 20     │
│   └───────────────────┴──────────┴────────────┘
│
├── View 2: CALENDAR
│   ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│   │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun  │
│   ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│   │      │ 📄DS │      │      │ 📄API│      │      │
│   │      │      │      │      │      │      │ 📄Dep│
│   └──────┴──────┴──────┴──────┴──────┴──────┴──────┘
│
└── View 3: TIMELINE
    Mar 10 ─────── Mar 15 ─────── Mar 20
    ████ Design ████
                   ████ API ██████
                                  ████ Deploy
```

### 6.2 Plugin Architecture

Để hỗ trợ **nhiều views mà không hardcode**, dùng **plugin data** pattern:

```
┌──────────────────────────────────────────┐
│                 PAGE                      │
│                                          │
│  id: "page-123"                          │
│  title: "Design System"                  │
│  content: "..."                          │
│                                          │
│  plugins: {                              │
│    table:    { cols: ["Name", "Status"] } │
│    calendar: { date: 1710460800000 }     │
│    timeline: { start: 17104..., end: ... }│
│  }                                       │
└──────────────────────────────────────────┘
```

Mỗi view type define metadata cần thiết:

```typescript
// Timeline cần start + end timestamps
interface TimelinePluginData {
  start: number;
  end: number;
}

// Calendar chỉ cần 1 ngày
interface CalendarPluginData {
  date: number;
}

// Table cần columns config
interface TablePluginData {
  cols: string[];
}
```

**Thêm view mới — ví dụ Kanban Board:**

```typescript
interface KanbanPluginData {
  column: string; // "To Do", "In Progress", "Done"
  order: number;  // vị trí trong column
}
// → Thêm vào Page.plugins.kanban
// → Implement KanbanView component
// → Đăng ký vào renderSet
// DONE. Không sửa core.
```

### 6.3 View Interface

Tất cả views implement cùng 1 interface:

```typescript
interface PageView {
  render(pages: Page[], pluginData: PluginData[]): HTMLElement;
}

class TableView implements PageView {
  render(pages, pluginData) {
    // Tạo <table> với rows = pages, columns = pluginData.cols
  }
}

class CalendarView implements PageView {
  render(pages, pluginData) {
    // Tạo calendar grid, place pages on correct dates
  }
}

class TimelineView implements PageView {
  render(pages, pluginData) {
    // Tạo horizontal timeline, place pages as bars
  }
}
```

---

## 7. State & Entity Model

### 7.1 Page Entity

```typescript
interface Page {
  id: string;                    // unique ID từ server
  title: string;                 // page title
  content?: string;              // optional — có thể empty
  icon?: string;                 // emoji icon cho sidebar
  children?: string[];           // IDs của sub-pages
  hash?: string;                 // internal — rendering cache key
  plugins?: {
    table?: TablePluginData;
    calendar?: CalendarPluginData;
    timeline?: TimelinePluginData;
  };
}
```

### 7.2 Application State (Normalized)

```typescript
interface AppState {
  rootPageId: string;
  pages: Record<string, Page>;   // Normalized — O(1) access bằng ID
  activePage: string | null;     // page đang hiển thị
}
```

**Tại sao normalized (flat map) thay vì nested tree?**

```javascript
// ❌ Nested — update page sâu 5 cấp = spread 5 lần
const nested = {
  id: 'root',
  children: [{
    id: 'work',
    children: [{
      id: 'project',
      children: [{ id: 'sprint-1', title: '...' }]
    }]
  }]
};
// Update sprint-1.title cần 4 tầng spread operators. O(depth).

// ✅ Normalized — update bất kỳ page = 1 operation
const normalized = {
  'root': { id: 'root', children: ['work'] },
  'work': { id: 'work', children: ['project'] },
  'project': { id: 'project', children: ['sprint-1'] },
  'sprint-1': { id: 'sprint-1', title: '...' }
};
// Update sprint-1:
normalized['sprint-1'] = { ...normalized['sprint-1'], title: 'New Title' };
// O(1). Không cần biết page ở depth bao nhiêu.
```

**Thêm benefits:**
- Server trả page mới → `state.pages[newPage.id] = newPage` — done
- Xóa page → `delete state.pages[pageId]` — done
- Di chuyển page → update `parent.children` array — done
- Navigate tới page → `state.pages[pageId]` — O(1)

### 7.3 Ví dụ State thực tế

```javascript
const appState = {
  rootPageId: 'root-001',
  activePage: 'page-003',
  pages: {
    'root-001': {
      id: 'root-001',
      title: 'My Workspace',
      icon: '🏠',
      children: ['page-001', 'page-002', 'db-001']
    },
    'page-001': {
      id: 'page-001',
      title: 'Work Notes',
      icon: '💼',
      content: '# Work\n[] Review PRs\n[x] Update docs',
      children: ['page-003'],
      hash: 'abc123'
    },
    'page-002': {
      id: 'page-002',
      title: 'Personal',
      icon: '🏡',
      content: '# Personal\nSome notes here...',
      children: [],
      hash: 'def456'
    },
    'page-003': {
      id: 'page-003',
      title: 'Sprint 5',
      icon: '🚀',
      content: '# Sprint 5 Planning\n...',
      children: [],
      hash: 'ghi789'
    },
    'db-001': {
      id: 'db-001',
      title: 'Task Tracker',
      icon: '📊',
      children: ['task-001', 'task-002'],
      plugins: {}
    },
    'task-001': {
      id: 'task-001',
      title: 'Design Review',
      content: '...',
      plugins: {
        table: { cols: ['Name', 'Status', 'Due'] },
        calendar: { date: 1710460800000 },
        timeline: { start: 1710460800000, end: 1710547200000 }
      }
    },
    'task-002': {
      id: 'task-002',
      title: 'Code Review',
      content: '...',
      plugins: {
        table: { cols: ['Name', 'Status', 'Due'] },
        calendar: { date: 1710547200000 },
        timeline: { start: 1710547200000, end: 1710633600000 }
      }
    }
  }
};
```


---

## 8. API Design — Thiết Kế API

### 8.1 Lựa chọn Protocol

Notion là **offline-first desktop app** — khác biệt lớn so với trading dashboard (real-time, latency-critical). Điều này ảnh hưởng trực tiếp tới API design:

| Tiêu chí | Trading Dashboard | Notion |
|-----------|-------------------|--------|
| Data direction | Server → Client (continuous) | Bidirectional (CRUD) |
| Latency requirement | < 100ms P99 | < 1s acceptable |
| Data format | Binary (OHLCV) | JSON (page content) |
| Update frequency | 1 tick/second | User-driven (typing) |
| Offline support | Không | **Bắt buộc** |
| Protocol | WebSocket | REST / GraphQL |

**WebSocket cho Notion?** Overkill. WebSocket phức tạp về implementation (state management, reconnection, scaling) và Notion không cần real-time streaming. User type → save → done. Ngoại trừ collaborative editing — nhưng collaborative editing có thể dùng SSE.

### 8.2 REST vs GraphQL

```
┌────────────────────────────────────────────────────────┐
│                    REST API                             │
├────────────────────────────────────────────────────────┤
│ ✅ Pros:                                               │
│   • Simple implementation                              │
│   • HTTP/2 caching (GET requests cacheable)            │
│   • Well understood, extensive tooling                 │
│   • 200 parallel requests via HTTP/2 multiplexing      │
│                                                        │
│ ❌ Cons:                                               │
│   • Over-fetching / under-fetching                    │
│   • Hard to evolve (breaking changes affect clients)   │
│   • Multiple endpoints to maintain                     │
│   • Need custom field selection (query params)         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   GraphQL API                           │
├────────────────────────────────────────────────────────┤
│ ✅ Pros:                                               │
│   • Single endpoint for all entities                   │
│   • Client decides which fields to fetch               │
│   • Strongly typed schema                              │
│   • Built-in subscription support (for live updates)   │
│   • Entity model aligned with client state             │
│                                                        │
│ ❌ Cons:                                               │
│   • Always uses POST → lose HTTP caching               │
│   • Need additional client library (Apollo, urql)      │
│   • Additional point of failure (GraphQL client)       │
│   • Query complexity attacks possible                  │
└────────────────────────────────────────────────────────┘
```

**Chọn GraphQL.** Lý do chính:

1. **Flexibility** — Page entity có nhiều optional fields (plugins, children, content). GraphQL cho client chọn exactly fields cần thiết. REST thì phải design query params phức tạp hoặc over-fetch.

2. **Single endpoint** — Notion có nhiều entity types (pages, databases, blocks). GraphQL gộp 1 endpoint thay vì N REST endpoints.

3. **Subscription** — GraphQL subscriptions (dựa trên SSE) hỗ trợ live collaborative editing mà không cần WebSocket.

4. **Entity alignment** — GraphQL schema match 1:1 với client state model → giảm transformation code.

### 8.3 API Methods

```typescript
// 1. GET PAGE — fetch page data
function getPage(id: string, apiToken: string): Promise<Page> {
  return graphqlClient.query({
    query: GET_PAGE,
    variables: { id },
    context: { headers: { Authorization: `Bearer ${apiToken}` } }
  });
}

// GraphQL query — client chọn fields cần
const GET_PAGE = `
  query GetPage($id: ID!) {
    page(id: $id) {
      id
      title
      content
      icon
      children { id title icon }
      plugins {
        table { cols }
        calendar { date }
        timeline { start end }
      }
    }
  }
`;
```

```typescript
// 2. UPDATE PAGE — gửi delta thay vì full content
function updatePage(id: string, delta: string, apiToken: string): Promise<Page> {
  return graphqlClient.mutate({
    mutation: UPDATE_PAGE,
    variables: { id, delta },
    context: { headers: { Authorization: `Bearer ${apiToken}` } }
  });
}

const UPDATE_PAGE = `
  mutation UpdatePage($id: ID!, $delta: String!) {
    updatePage(id: $id, delta: $delta) {
      id
      hash
    }
  }
`;
```

**Tại sao delta?** Page content có thể rất lớn — hàng nghìn dòng. Mỗi lần user gõ 1 ký tự mà gửi full content = lãng phí bandwidth. **Delta** chỉ gửi phần thay đổi:

```javascript
// Tương tự git diff
const previousContent = "# Hello World\nSome text";
const newContent = "# Hello World\nSome text\nNew paragraph";

const delta = calculateDelta(previousContent, newContent);
// delta = { position: 24, insert: "\nNew paragraph" }
// Gửi 20 bytes thay vì 50 bytes
```

```typescript
// 3. SUBSCRIBE — live updates cho collaborative editing
function subscribeToPage(id: string, apiToken: string): void {
  graphqlClient.subscribe({
    query: PAGE_SUBSCRIPTION,
    variables: { id }
  }).subscribe({
    next(update) {
      // Apply remote change to local state
      dispatcher.dispatch({
        type: 'REMOTE_UPDATE',
        pageId: id,
        delta: update.data.pageUpdated.delta
      });
    }
  });
}

const PAGE_SUBSCRIPTION = `
  subscription OnPageUpdated($id: ID!) {
    pageUpdated(id: $id) {
      delta
      userId
      timestamp
    }
  }
`;
```

GraphQL subscription internally dùng **Server-Sent Events (SSE)** — HTTP/2 based, unidirectional (server → client), auto-reconnection. Phù hợp vì collaborative editing chỉ cần nhận updates từ server.

### 8.4 Offline Sync Strategy

```
┌──────────────────────────────────────────┐
│            OFFLINE SYNC FLOW             │
│                                          │
│  Online:                                 │
│    User edit → Delta → API → Server ✓    │
│                                          │
│  Offline:                                │
│    User edit → Delta → Queue in IDB      │
│                                          │
│  Back Online:                            │
│    Flush queue → Send deltas one by one  │
│    Server responds with merged state     │
│    Update local state with server truth  │
└──────────────────────────────────────────┘
```

```javascript
async function saveContent(pageId, newContent) {
  const delta = calculateDelta(previousContent, newContent);

  if (navigator.onLine) {
    await updatePage(pageId, delta, apiToken);
  } else {
    // Queue delta in IndexedDB for later sync
    await idb.add('pendingDeltas', { pageId, delta, timestamp: Date.now() });
  }

  previousContent = newContent;
}

// When back online
window.addEventListener('online', async () => {
  const pending = await idb.getAll('pendingDeltas');
  for (const { pageId, delta } of pending) {
    await updatePage(pageId, delta, apiToken);
  }
  await idb.clear('pendingDeltas');
});
```

---

## 9. Performance Optimization

### 9.1 Network Optimization

#### HTTP/2

Bật HTTP/2 trên server để tận dụng **multiplexing** — 200 requests qua 1 TCP connection. Quan trọng cho initial load khi cần fetch nhiều assets.

#### Service Worker cho Offline

```javascript
// sw.js — cache assets cho offline mode
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('notion-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/app.js',
        '/styles.css',
        '/fonts/inter.woff2'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
```

#### Non-Critical Resources

Dùng `rel="preconnect"` cho resources không cần ngay:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://api.notion.com">
```

### 9.2 Bundle Optimization

Notion là desktop-first, modern browsers → **không cần polyfills cho ES5**:

```
┌─────────────────────────────────────────┐
│          BUNDLE STRATEGY                 │
│                                          │
│  ES6+ bundle (no polyfills)              │
│  → Giảm 30-40% bundle size              │
│                                          │
│  Code splitting:                         │
│  ├── vendor.js    (React, GraphQL client)│
│  ├── core.js      (lexer, parser, state) │
│  ├── components/  (lazy loaded)          │
│  │   ├── table.js                        │
│  │   ├── calendar.js                     │
│  │   └── timeline.js                     │
│  └── fonts/       (preloaded)            │
│                                          │
│  Components loaded dynamically:          │
│  Page chỉ dùng H1 + Checkbox?           │
│  → Chỉ load h1.js + checkbox.js         │
│  → Table, Calendar... chưa load          │
└─────────────────────────────────────────┘
```

#### Compression

- **Brotli** (br) — hiệu quả nhất, supported bởi tất cả modern browsers
- **Gzip** fallback
- Images → **WebP** format (savings 25-34% vs PNG)
- SVG icons thay vì image icons

### 9.3 Rendering Optimization

#### CSS

```
┌─────────────────────────────────────────┐
│          CSS OPTIMIZATION                │
│                                          │
│  • Avoid reflows — batch DOM reads/writes│
│  • CSS animations thay vì JS animations │
│    (GPU accelerated, 60fps)              │
│  • Flat CSS class names (BEM or similar) │
│    → Faster style recalculation          │
│  • CSS containment cho isolated sections │
└─────────────────────────────────────────┘
```

#### DOM — Minimize Rendering

Đây là optimization **đã được design vào kiến trúc** từ đầu:

1. **Static/Selected area split** — chỉ re-render vùng user đang edit
2. **Hash-based caching** — `page.hash` thay đổi mới re-parse. Nếu hash không đổi → dùng cached HTML
3. **MutationObserver chỉ trên selected area** — không track toàn bộ page DOM

```javascript
function renderPage(page) {
  if (page.hash === cachedHash) {
    // Hash không đổi → skip re-parse, dùng cached DOM
    return cachedDOM;
  }

  const tokens = lexer(rules, page.content);
  const elements = tokens.map(t => parser(t, globalState, renderSet));

  cachedHash = page.hash;
  cachedDOM = elements;
  return elements;
}
```

#### Virtualization cho Database Views

Table view với 1000+ rows cần **virtualization** — chỉ render rows visible trong viewport:

```javascript
function virtualizedTable(pages, containerHeight, rowHeight, scrollTop) {
  const startIndex = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const endIndex = Math.min(startIndex + visibleCount + 2, pages.length); // +2 buffer

  const visiblePages = pages.slice(startIndex, endIndex);

  // Spacer trên và dưới để maintain scroll height
  const topSpacer = startIndex * rowHeight;
  const bottomSpacer = (pages.length - endIndex) * rowHeight;

  return { visiblePages, topSpacer, bottomSpacer };
}
```

---

## 10. Accessibility

### 10.1 Rem Units

Dùng `rem` thay vì `px` cho tất cả sizing. `1rem` = browser default font size (thường 16px). Khi user thay đổi zoom/font settings → UI tự scale:

```css
/* ✅ Accessible */
h1 { font-size: 2rem; }      /* scales with user settings */
.sidebar { width: 15rem; }

/* ❌ Not accessible */
h1 { font-size: 32px; }      /* fixed, ignores user settings */
.sidebar { width: 240px; }
```

### 10.2 Keyboard Navigation & Hotkeys

Notion sử dụng rất nhiều hotkeys — `Cmd+B` bold, `Cmd+/` search, `/` command palette. Thiết kế hotkey system:

```javascript
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + B = Bold
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault();
    wrapSelection('**');
  }

  // / = Command palette (khi không trong input)
  if (e.key === '/' && !isEditing()) {
    showCommandPalette();
  }
});
```

### 10.3 Semantic HTML

**HTML accessible by default** — dùng đúng tag = screen readers tự hiểu:

```html
<!-- ✅ Đúng -->
<nav aria-label="Workspace">...</nav>
<main role="main">...</main>
<h1>Page Title</h1>
<table><thead>...</thead><tbody>...</tbody></table>
<button>Add Page</button>

<!-- ❌ Sai — div soup -->
<div class="nav">...</div>
<div class="content">...</div>
<div class="heading">Page Title</div>
<div class="table"><div class="row">...</div></div>
<div class="btn" onclick="...">Add Page</div>
```

### 10.4 Color Accessibility

Hỗ trợ **color schemes** cho người có khuyết tật thị giác:

```css
/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --text-color: #000000;
    --bg-color: #ffffff;
    --border-color: #000000;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #e0e0e0;
    --bg-color: #191919;
    --border-color: #333333;
  }
}
```

### 10.5 Images Alt Attributes

Mọi image component phải require `alt` attribute. Với sự phát triển của AI, alt text có thể auto-generate:

```javascript
const imageRule = {
  isValid(line) { return line.startsWith('!['); },
  getToken(line) {
    const match = line.match(/!\[(.+)\]\((.+)\)/);
    return {
      type: 'image',
      attributes: {
        alt: match[1],  // REQUIRED for accessibility
        src: match[2]
      }
    };
  }
};
```



## 11. Presentation Script — Notion System Design (English)

> **Context**: This is a solo YouTube-style presentation script walking through the complete system design of a Notion-like application. The speaker explains each concept step by step on a drawing board, with natural spoken English.

---

### Intro

Hello everyone and welcome to the Frontend Engineer channel. Today is another system design video episode — we're going to look at how to build a Notion-like system. So we're going to try to understand how we can build an extendable component library that's easy to support, how we can implement a custom markdown syntax so we can easily extend it to support more components, and we're also going to see how we can build Notion-like databases — basically a way to group pages and represent them as different views, for instance a timeline view, a calendar view, a table view, and so on. So yeah, I think it's a pretty interesting problem, let's get started.

### Notion Overview

So before we jump into the design, I think it will be useful to understand what Notion actually is. Notion is a web application that allows you to build custom workspaces and it uses a very advanced, self-developed markdown syntax. Basically you can create pages — each page is, for simplicity, a markdown page — and you can use multiple components within that page. So for instance, different types of headings, checkboxes, toggles, callouts, tables, and so on.

Also, Notion has this really nice concept of databases. It's basically the way you can group your content — a database is just a list of pages that can be displayed in different view implementations. So there's a table view, a timeline view, a calendar view, a board view. And each view shows the same data in a completely different layout.

So yeah, it's a very highly advanced custom markdown syntax parser that allows you to structure pages in a very flexible way. All right, with that in mind, let's start the design.

### Design Plan

All right, so before we start any system design, we need to have a plan. So here's what we're going to cover. First — collecting the requirements, split into general requirements and advanced requirements. Second — a quick mockup so we can see the high-level layout. Third — the component hierarchy and data flow, which is going to help us understand how data moves through the system. Fourth — the markdown parser, which is really the core of this design — we need to make sure it's extendable so we can easily add new components. Fifth — the database design, so how do we group pages and support multiple views. Sixth — state and entity design. Seventh — API design, because although Notion is an offline-first application, it's still a web app, so we still need to save data to the server and fetch live updates. And finally — optimization and accessibility. Let's go.

### General Requirements

So what are the general requirements? I think the first and most important one is that we need to implement a custom editor that supports **live element transformation**. This means that when the user types something — for instance, types `#` followed by a space — the text automatically converts into an H1 heading. It's not like a build step or a preview mode — it transforms in real time as you type.

The second thing is we need an **extendable component library**. Our component library should be built in a way that we can extend it with more components in the future, and these new components should automatically be supported by our custom markdown syntax. So adding a new component should be a matter of adding a new rule and a new renderer — nothing else should change.

The third requirement — our workspace is a **hierarchy of pages**. Pages can be inside pages, and we need to support this hierarchy efficiently. We need to be able to navigate, create, and rearrange pages in this tree structure.

And as a general requirement, we want to make sure our content is **accessible**. Semantic HTML, keyboard navigation, screen reader support.

And finally — **performance**. Although Notion is a desktop-first application, which means mobile performance is less of a concern, we still want to make sure the application performs well on both CPU and network sides.

### Advanced Requirements

For the advanced functionality — first, we need to support **databases**. A Notion database is basically a way to group pages into custom views — table, calendar, timeline. We want to be able to connect pages to these views and in the future support even more views.

Second is **offline support**. Because Notion is an offline-first application, we need to store data locally and sync when we have an internet connection. And instead of sending the entire page content every time, we want to calculate the difference — the delta — and submit just that.

And third — the application should be **cross-platform** with **multi-viewport support**. Since Notion is a web application, we get cross-platform for free, but we need to handle different screen sizes — desktop with sidebar visible, mobile with sidebar collapsed.

### Mockup & High-Level Architecture

All right, so let me draw a quick mockup. Notion essentially consists of two main sections. On the left you have the workspace hierarchy — that's the sidebar where all your pages are listed in a tree structure. And in the center you have the content area where you can add components, make edits, and so on.

Now, the high-level architecture. Every application needs to start somewhere, and I think the application root is the logical starting point. The application root receives the root page ID — it knows which workspace to load. From there, we can build the workspace hierarchy for the sidebar.

We're going to use a **single page application** architecture, because when you click on a page in the sidebar, the content immediately renders in the center — there's no full page reload. So we need an application router that takes a page ID and renders the corresponding page content.

The page content goes through a processing pipeline — I call it **lexer, parser, renderer**. The lexer takes the raw content string and tokenizes it into structured objects. The parser takes these tokens, connects them with the global state to inject any needed data, and matches them to rendering functions. The renderer outputs HTML elements.

Now here's the interesting part — how do we handle editing? Notion uses `contentEditable`. So instead of a hidden `<input>` or `<textarea>`, Notion sets `contentEditable` on a div, which allows the user to type directly into the DOM. The problem with this approach is that `contentEditable` doesn't fire `onChange` events like a regular input does. So how do we track changes?

The answer is **MutationObserver**. MutationObserver allows us to track any DOM modifications within a node. So when the user types something and the DOM changes, MutationObserver detects it, extracts the new content, and sends an action to update the global state.

And for the state management, we use an **event-based architecture** — similar to Redux if you're familiar with it. We have a global dispatcher that any part of the application can use to trigger actions. Each action goes to an action handler — basically a reducer — which generates a new state. When the state updates, the cycle repeats — the page re-renders with the new content through the lexer-parser-renderer pipeline.

One important optimization here — we split the page content into a **static area** and a **selected area**. The static area is the part the user is not currently editing — it's already been parsed and rendered, so we can cache it. We only need to track changes and re-render the selected area — the part the user is actively typing in. This saves us a lot of unnecessary DOM manipulation.

### Types of Components

So now let's talk about the types of components we can have in this system.

If we look at Notion, there are basically three types of components. The first type is **visual components** — these are simple functional components. They take data and render it. H1, H2, paragraph, checkbox, image, divider — all visual. They don't accept any children components.

The second type is **structural components**. The key difference is that structural components can accept other components as children. So think of a toggle — you click it and it expands to show more content, which can be any other component. Or a columns layout that contains multiple components side by side. Or a callout block that wraps content in a highlighted box.

The third type is **database connectable components**. These are advanced structural components that specifically accept pages as children and render them in a custom view. So a table component takes a list of pages and displays them as rows. A calendar takes pages and places them on dates. A timeline shows pages as horizontal bars.

And what's nice about this classification is that all components of the same type share the same interface. So adding a new visual component, you follow the same pattern as every other visual component. Adding a new database view, same pattern as every other view. The system is consistent and extendable.

### Lexer & Parser

All right, so now let's get into the really interesting part — the custom markdown parser. This is the core of the whole system.

So the idea is — the raw content from the page goes into a **lexer**. The lexer has a set of **rules**. Each rule defines how to recognize a specific piece of syntax. For instance, the H1 rule checks if a line starts with `# ` — if it does, it's valid for this rule, and the rule can extract the text and create a component token.

The lexer interface is simple — it has a single method called `process` that takes an array of rules and a string of content, and it returns an array of component tokens. For each line of content, we run through all the rules, and the first rule that matches wins — it creates the token for that line. If no rule matches, we default to a paragraph.

Each **rule** has two methods — `isValid`, which takes a line and returns true or false, and `getToken`, which takes the line and extracts all the attributes into a component token object.

And the **component token** — that's the object representation of the parsed content. It has a type — like "h1" or "checkbox" — and attributes — the data specific to that component. For structural components, the token also has children. For database components, it has database-specific data.

Now the **parser** takes these component tokens and maps them to actual HTML rendering functions using a **render set**. The render set is basically a map from token type to rendering function. So when the parser receives an H1 token, it looks up the render set, finds the H1 rendering function, and calls it to generate the HTML element.

And one thing I want to emphasize — the parser has access to the **global state**. This is important because some components need state data — for instance, a database view needs to know which pages belong to the database. The parser is the layer that connects static tokens with dynamic application data.

So the beauty of this architecture is extending it. If you want to add a new component — say an accordion — you do three things. One — write the rule that recognizes the accordion syntax. Two — write the rendering function. Three — add the rule to the rules array and the renderer to the render set. That's it. You don't touch the lexer code, you don't touch the parser code. Everything is pluggable.

### Database Design

So to tackle the databases, we first need to understand what a Notion database really is. It's not a relational database — it's a **page that contains pages** and can display them in different views.

And the key insight for supporting multiple views is the **plugin data** concept. Each page inside a database can have plugin metadata for each view type. So for instance, for the timeline view, a page needs a start timestamp and an end timestamp. For the calendar view, it just needs a single date. For the table view, it needs column data.

So when we switch from table view to calendar view, the system looks at the calendar plugin data for each page and renders accordingly. And the really nice thing is — if we want to add a new view, say a Kanban board, we just define what plugin data a Kanban needs — like a column name and an order — add it to the page model, and implement the view component. The core system doesn't change.

All views implement the same **PageView** interface — they take a list of pages and their plugin data, and they return the rendered view. Table view renders rows and columns. Calendar view renders a grid with pages on dates. Timeline view renders horizontal bars. Same interface, different implementations.

### State & Entity Design

For the application state, I think the most important design decision is to use a **normalized** — or flattened — data structure for our pages. So instead of having nested objects where pages contain their children directly, we have a flat map from page ID to page data.

Why? Because with a nested structure, if you want to update a page that's five levels deep, you need to spread and copy five levels of objects. That's expensive and error-prone. With a normalized map, updating any page is always O(1) — you just replace the entry at that key.

It's also good for server sync — when the server sends a new page or an update, you just set it directly in the map. And navigating to a page is instant — just look up the ID in the map.

### API Design

For the API layer, we have to choose between REST and GraphQL. And I'd lean towards **GraphQL** for this specific use case. The main reason is — our page entity has many optional fields. Some pages have plugin data, some don't. Some have children, some don't. With REST, you'd either over-fetch every possible field, or you'd need to implement complex query parameter logic to specify which fields you want. GraphQL gives the client the ability to specify exactly which fields it needs per request.

Another benefit — GraphQL supports **subscriptions** built on Server-Sent Events. So if we want to support collaborative editing — multiple users editing the same page — the subscription mechanism gives us live updates without the complexity of WebSocket infrastructure.

For the update mechanism, we use **delta-based updates**. Instead of sending the entire page content every time the user types a character, we calculate the diff between the previous content and the new content, and send just that difference. This significantly reduces network traffic.

And for offline support — when the user is offline, we queue the deltas in IndexedDB. When they come back online, we flush the queue and send all pending deltas to the server. The server merges the changes and responds with the canonical state.

### Optimization

For optimization, since Notion is a desktop-first application, the network part is perhaps less critical than for a mobile app. But we still want to optimize the initial loading experience.

First — enable **HTTP/2** for the initial asset loading. HTTP/2 gives us multiplexing — up to 200 parallel requests over a single connection.

Second — set up a **Service Worker** to cache all assets. This is what enables our offline mode — once the assets are cached, the user can use the application without an internet connection.

Third — **bundle optimization**. Since we're targeting modern browsers on desktop, we don't need polyfills for ES5. We can ship an ES6+ bundle which is significantly smaller. We also want to maximize code splitting — the core lexer and parser are loaded immediately, but individual components can be loaded dynamically. If the user's page only uses headings and checkboxes, we don't need to load the table component, the calendar component, and so on.

For rendering optimization — we already designed the **static area and selected area split** into our architecture. We only re-render what the user is actively editing. We use a **hash-based cache** — if a page's hash hasn't changed, we skip re-parsing and reuse the cached DOM. And for large database views, we use **virtualization** — only rendering the rows that are visible in the viewport.

### Accessibility

And finally, accessibility. A few important things.

We use **rem units** throughout the application instead of pixels. Rem units scale with the user's browser font size settings — so if a user increases their default font size for accessibility reasons, our entire UI scales accordingly.

We ensure we're using **semantic HTML** everywhere — `<table>` for tables, `<button>` for buttons, `<nav>` for navigation. HTML is accessible by default when you use the right tags. The problem comes when you build everything with `<div>` elements — screen readers can't make sense of that.

We support **keyboard navigation and hotkeys** — this is actually core to Notion's user experience, not just an accessibility feature.

And we provide **color contrast schemes** for users with visual disabilities — high contrast mode, dark mode, respecting the user's `prefers-contrast` and `prefers-color-scheme` media queries.

### Outro

All right, so I think we covered quite a lot of ground today. We looked at how to build the custom markdown parser with the lexer-parser-renderer pipeline and an extendable rule system. We explored the component type hierarchy — visual, structural, and database connectable. We designed the database system with plugin-based views. We chose GraphQL for our API with delta-based updates and offline sync. And we covered optimization and accessibility.

I hope you found this useful. If you did, please subscribe to the channel, leave a comment — it really helps. And I'll see you guys in the next episode. Bye!

---

*This document provides a comprehensive foundation for designing and interviewing for Notion-Like Application system design. All code examples are handwritten without external libraries.*
