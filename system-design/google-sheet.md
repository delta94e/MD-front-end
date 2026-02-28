# High-Level Design: Collaborative Spreadsheet Application (Google Sheets/Excel Clone)

## Table of Contents

1. [Problem Statement & Requirements](#1-problem-statement--requirements)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [Data Flow & API Communication](#5-data-flow--api-communication)
6. [Performance Optimization](#6-performance-optimization)
7. [Error Handling & Edge Cases](#7-error-handling--edge-cases)
8. [Testing Strategy](#8-testing-strategy)
9. [Security Considerations](#9-security-considerations)
10. [Interview Cross-Questions](#10-interview-cross-questions)
11. [Summary & Architecture Rationale](#11-summary--architecture-rationale)

---

## 1. Problem Statement & Requirements

### 1.1 Problem Statement

Design and implement a production-grade, collaborative spreadsheet application that supports real-time multi-user editing, handles large datasets (100K+ cells), provides Excel-like functionality, and scales to millions of users. The system must deliver Google Sheets-level performance with <100ms interaction latency, support offline editing with conflict resolution, and maintain consistency across concurrent users.

**Core Challenges:**

- **Real-time Collaboration**: Operational Transform (OT) or CRDT implementation for conflict-free concurrent editing
- **Performance at Scale**: Render and interact with 100K+ cells without jank (60 FPS target)
- **Complex State Management**: Formulas, dependencies, formatting, history across distributed clients
- **Data Synchronization**: Eventual consistency with optimistic updates and rollback
- **Calculation Engine**: Formula evaluation with circular dependency detection

### 1.2 Functional Requirements

#### Core Features (P0)

1. **Grid Operations**

   - Cell editing (text, numbers, formulas, dates)
   - Multi-cell selection (range, non-contiguous)
   - Copy/Cut/Paste (values, formulas, formats)
   - Drag-to-fill (auto-increment, patterns)
   - Insert/Delete rows/columns
   - Cell merge/unmerge

2. **Formulas & Calculations**

   - 200+ Excel-compatible functions (SUM, VLOOKUP, IF, etc.)
   - Cell reference (A1, R1C1 notation)
   - Relative/Absolute references ($A$1)
   - Named ranges
   - Array formulas
   - Dependency graph management
   - Circular reference detection

3. **Formatting**

   - Cell styles (font, color, borders, alignment)
   - Number formats (currency, percentage, date, custom)
   - Conditional formatting
   - Row/column sizing
   - Freeze panes

4. **Real-time Collaboration**

   - Multi-user cursors with user avatars
   - Live cell edits (see typing in real-time)
   - Presence indicators
   - Conflict resolution (Operational Transform)
   - User activity tracking

5. **Data Management**
   - Auto-save (every 2s or on idle)
   - Version history (restore to any point)
   - Undo/Redo (per user, unlimited)
   - Import/Export (CSV, XLSX, PDF)
   - Share & permissions (view, comment, edit)

#### Advanced Features (P1)

- Charts & visualizations (bar, line, pie, scatter)
- Pivot tables
- Data validation (dropdowns, rules)
- Filter & Sort
- Find & Replace
- Comments & discussions
- Offline mode with sync

#### User Roles

- **Owner**: Full control, manage permissions
- **Editor**: Edit, comment, share
- **Commenter**: View, add comments
- **Viewer**: Read-only access

### 1.3 Non-Functional Requirements

#### Performance Metrics

| Metric                     | Target            | Measurement                    |
| -------------------------- | ----------------- | ------------------------------ |
| **Initial Load Time**      | < 2s (FCP)        | Time to First Contentful Paint |
| **Time to Interactive**    | < 3s (TTI)        | Time until user can interact   |
| **Cell Edit Latency**      | < 50ms            | Input to visual update         |
| **Formula Calculation**    | < 100ms           | For 1000 dependent cells       |
| **Scroll Performance**     | 60 FPS            | Virtualized rendering          |
| **Real-time Sync Latency** | < 200ms           | Local edit to remote clients   |
| **Bundle Size**            | < 500KB (gzipped) | Initial JS bundle              |
| **Memory Usage**           | < 200MB           | For 100K cells                 |
| **Network Payload**        | < 100KB/operation | Delta sync only                |

#### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **INP (Interaction to Next Paint)**: < 200ms

#### Scalability

- Support 100+ concurrent editors per spreadsheet
- Handle spreadsheets up to 10M cells (10,000 rows × 1,000 columns)
- Render visible viewport only (virtualization)
- Maintain 60 FPS during interactions

#### Reliability

- 99.9% uptime
- Auto-save with <5s data loss window
- Graceful degradation on network failures
- Conflict resolution with no data loss

#### Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation (arrow keys, Tab, Enter)
- Screen reader support
- High contrast mode

### 1.4 Scale Estimates

#### User Metrics

- **Total Users**: 50 million registered
- **DAU (Daily Active Users)**: 10 million
- **Peak Concurrent Users**: 2 million
- **Avg Concurrent Editors/Sheet**: 5-10 users
- **Max Concurrent Editors/Sheet**: 100 users

#### Data Metrics

- **Total Spreadsheets**: 100 million
- **Avg Cells per Sheet**: 10,000 (100 rows × 100 columns)
- **Max Cells per Sheet**: 10,000,000
- **Avg Cell Size**: 50 bytes
- **Total Storage**: ~500 TB (with versions)

#### Traffic Estimates

- **API Requests**: 100K requests/second (peak)
- **WebSocket Connections**: 2M concurrent
- **Data Transfer**: 10 TB/day
- **Edit Operations**: 50M/hour (peak)

#### Network Bandwidth

- **Initial Load**: 500KB (JS) + 200KB (CSS) + 100KB (data)
- **Per Edit**: 500 bytes (delta)
- **Bulk Operations**: < 50KB (compressed)

---

## 2. High-Level Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BROWSER CLIENT                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │  Grid    │  │ Toolbar  │  │ Formula  │  │ Collab   │        │   │
│  │  │  Canvas  │  │  Panel   │  │   Bar    │  │  Panel   │        │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │   │
│  └───────┼─────────────┼─────────────┼─────────────┼───────────────┘   │
│          │             │             │             │                    │
│  ┌───────┴─────────────┴─────────────┴─────────────┴───────────────┐   │
│  │                    APPLICATION LAYER                             │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Viewport   │  │   Selection  │  │   Command    │          │   │
│  │  │   Manager    │  │   Manager    │  │   Manager    │          │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │   │
│  │         │                  │                  │                  │   │
│  │  ┌──────┴──────────────────┴──────────────────┴───────────┐    │   │
│  │  │              STATE MANAGEMENT LAYER                     │    │   │
│  │  │                                                          │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │   │
│  │  │  │  Cell    │  │  Formula │  │   User   │             │    │   │
│  │  │  │  Store   │  │  Engine  │  │  Presence│             │    │   │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │    │   │
│  │  │       │             │             │                    │    │   │
│  │  │  ┌────┴─────────────┴─────────────┴─────┐             │    │   │
│  │  │  │      Operational Transform (OT)       │             │    │   │
│  │  │  │         / CRDT Engine                 │             │    │   │
│  │  │  └────────────────┬──────────────────────┘             │    │   │
│  │  └───────────────────┼────────────────────────────────────┘    │   │
│  └──────────────────────┼─────────────────────────────────────────┘   │
│                         │                                              │
│  ┌──────────────────────┴──────────────────────────────────────────┐  │
│  │                    DATA ACCESS LAYER                             │  │
│  │                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │     HTTP     │  │   WebSocket  │  │   IndexedDB  │          │  │
│  │  │   API Client │  │    Client    │  │   Cache      │          │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │  │
│  └─────────┼──────────────────┼──────────────────┼─────────────────┘  │
└────────────┼──────────────────┼──────────────────┼────────────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVICES                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   REST   │  │   WS     │  │  Calc    │  │  Storage │               │
│  │   API    │  │  Server  │  │  Engine  │  │  Service │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Hierarchy

```
App
│
├── SheetProvider (Context)
│   │
│   ├── CollaborationProvider (WebSocket, Presence)
│   │   │
│   │   ├── Header
│   │   │   ├── FileMenu
│   │   │   ├── ShareButton
│   │   │   └── CollaboratorAvatars
│   │   │
│   │   ├── Toolbar
│   │   │   ├── FontControls
│   │   │   ├── AlignmentControls
│   │   │   ├── NumberFormatControls
│   │   │   └── BorderControls
│   │   │
│   │   ├── FormulaBar
│   │   │   ├── CellReferenceInput
│   │   │   └── FormulaEditor (Monaco-based)
│   │   │
│   │   ├── SheetCanvas (Main Grid)
│   │   │   ├── VirtualGridContainer
│   │   │   │   ├── ColumnHeaders (Virtualized)
│   │   │   │   ├── RowHeaders (Virtualized)
│   │   │   │   ├── CellGrid (Virtualized)
│   │   │   │   │   └── Cell[] (Memoized)
│   │   │   │   ├── SelectionOverlay
│   │   │   │   ├── CellEditor (Active Cell)
│   │   │   │   ├── CollaboratorCursors
│   │   │   │   └── FillHandle
│   │   │   │
│   │   │   └── ScrollManager
│   │   │
│   │   ├── SheetTabs
│   │   │   └── SheetTab[] (Draggable)
│   │   │
│   │   ├── Sidebar
│   │   │   ├── CommentsPanel
│   │   │   ├── HistoryPanel
│   │   │   └── ExplorePanel
│   │   │
│   │   └── ContextMenu (Right-click)
│   │       ├── CellContextMenu
│   │       ├── RowContextMenu
│   │       └── ColumnContextMenu
│   │
│   └── ModalsManager
│       ├── ChartModal
│       ├── ConditionalFormatModal
│       ├── ShareModal
│       └── ImportExportModal
```

### 2.3 Data Flow Architecture

```
┌─────────────┐
│    USER     │
│   ACTION    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│         EVENT HANDLER (Component)                │
│  - onClick, onKeyDown, onPaste, onDragEnd        │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│         COMMAND DISPATCHER                       │
│  - Transforms event → Command object             │
│  - Commands: UpdateCellCommand,                  │
│              InsertRowCommand, etc.              │
└──────┬───────────────────────────────────────────┘
       │
       ├────────────────────────────────────────────┐
       │                                            │
       ▼                                            ▼
┌─────────────────────┐                  ┌─────────────────────┐
│   LOCAL STORE       │                  │   OT/CRDT ENGINE    │
│   (Optimistic       │                  │   - Transform op    │
│    Update)          │                  │   - Generate delta  │
└──────┬──────────────┘                  └──────┬──────────────┘
       │                                        │
       │                                        ▼
       │                              ┌─────────────────────┐
       │                              │   WEBSOCKET CLIENT  │
       │                              │   - Send operation  │
       │                              └──────┬──────────────┘
       │                                     │
       │                                     ▼
       │                              ┌─────────────────────┐
       │                              │   BACKEND SERVER    │
       │                              │   - OT transform    │
       │                              │   - Broadcast       │
       │                              └──────┬──────────────┘
       │                                     │
       │                                     ▼
       │                              ┌─────────────────────┐
       │                              │  OTHER CLIENTS      │
       │                              │  (Real-time sync)   │
       │                              └─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   FORMULA ENGINE    │
│   - Recalculate     │
│   - Update deps     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   RE-RENDER         │
│   - Only affected   │
│     cells           │
│   - Virtualized     │
└─────────────────────┘
```

### 2.4 Architecture Principles

#### 2.4.1 Unidirectional Data Flow

**WHY**: Predictable state updates, easier debugging, time-travel debugging support.

```typescript
// Command Pattern with Undo/Redo
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

// Data flows: User Action → Command → State → View
// Never: View directly mutates State
```

**Trade-offs**:

- ✅ Pros: Predictable, testable, supports undo/redo naturally
- ❌ Cons: More boilerplate, indirection overhead
- **Decision**: Critical for collaborative editing where we need to replay/transform operations

#### 2.4.2 Immutable State Updates

**WHY**: Enables shallow equality checks, prevents accidental mutations, supports time-travel.

```typescript
// ❌ BAD: Mutating state
state.cells[cellId].value = newValue;

// ✅ GOOD: Immutable update
setState({
  ...state,
  cells: {
    ...state.cells,
    [cellId]: { ...state.cells[cellId], value: newValue },
  },
});

// ✅ BETTER: Using Immer for complex updates
setState((draft) => {
  draft.cells[cellId].value = newValue;
});
```

**Trade-offs**:

- ✅ Pros: Prevents bugs, enables React optimization, supports undo/redo
- ❌ Cons: Memory overhead, verbose syntax
- **Decision**: Use Immer to get mutative syntax with immutable benefits

#### 2.4.3 Virtualized Rendering

**WHY**: Can't render 100K+ DOM nodes without crushing performance.

```typescript
// Only render visible cells (viewport + buffer)
// 1M cells spreadsheet → render ~200 cells (20 rows × 10 cols visible)
```

**Trade-offs**:

- ✅ Pros: Constant render time regardless of data size
- ❌ Cons: Complex scroll logic, dynamic heights are tricky
- **Decision**: Use `react-window` with custom extensions for variable row heights

#### 2.4.4 Optimistic UI Updates

**WHY**: Sub-50ms perceived latency, no waiting for server roundtrip.

```typescript
// 1. Apply change locally immediately
// 2. Send to server
// 3. If server rejects, rollback
// 4. If conflict, apply OT transformation
```

**Trade-offs**:

- ✅ Pros: Instant feedback, feels native
- ❌ Cons: Complex rollback logic, conflict resolution needed
- **Decision**: Essential for spreadsheet UX, worth the complexity

#### 2.4.5 Event Sourcing for State

**WHY**: Complete audit trail, supports undo/redo, enables collaboration.

```typescript
// Store operations, not final state
// State = reduce(initialState, operations[])

// Operations log:
// [UpdateCell(A1, "hello"), UpdateCell(B2, "=A1*2"), InsertRow(5)]
```

**Trade-offs**:

- ✅ Pros: Complete history, undo/redo, collaboration support
- ❌ Cons: Larger storage, replay cost for large histories
- **Decision**: Use event sourcing with periodic snapshots (every 100 ops)

### 2.5 System Invariants

These rules MUST NEVER be violated:

1. **Cell Value Consistency**: A cell's computed value must always reflect its formula and dependencies

   ```typescript
   // If B1 = "=A1*2" and A1 = 5, then B1 MUST display 10
   // Violated by: stale cache, race conditions
   ```

2. **Operational Transform Convergence**: All clients must converge to same state

   ```typescript
   // Given same set of operations (possibly reordered),
   // all clients must reach identical final state
   ```

3. **No Lost Edits**: User edits are never silently discarded

   ```typescript
   // Even on conflict, preserve user intent (via CRDTs or manual resolution)
   ```

4. **60 FPS Interactions**: User interactions (scroll, edit, select) never drop below 60 FPS

   ```typescript
   // Max 16ms per frame budget
   // Violated by: blocking calculations, excessive re-renders
   ```

5. **Data Integrity**: Formulas never reference non-existent cells after row/column deletion

   ```typescript
   // When deleting row 5, update all formulas referencing row 5+
   // =SUM(A1:A10) → delete row 3 → =SUM(A1:A9)
   ```

6. **Undo/Redo Integrity**: Undo must reverse exactly what was done
   ```typescript
   // Action → Undo → state must equal pre-action state
   // Redo → state must equal post-action state
   ```

---

## 3. Component Architecture

### 3.1 Component Breakdown

#### 3.1.1 Core Grid Components

```
GridContainer (Smart Component)
├── ViewportManager (Logic)
│   └── calculates visible cells based on scroll position
│
├── VirtualGrid (Presentational)
│   ├── ColumnHeaders (Virtualized List)
│   │   └── ColumnHeader[] (Memoized)
│   │
│   ├── RowContainer (Virtualized List)
│   │   └── Row[] (Virtualized)
│   │       └── Cell[] (Memoized, Lazy)
│   │
│   └── OverlayLayer (Absolute positioned)
│       ├── SelectionHighlight (Canvas)
│       ├── ActiveCellBorder (DOM)
│       ├── FillHandle (DOM)
│       ├── CollaboratorCursors (SVG)
│       └── ContextMenu (Portal)
```

**GridContainer (Smart Component)**:

```typescript
interface GridContainerProps {
  sheetId: string;
  width: number;
  height: number;
}

const GridContainer: FC<GridContainerProps> = ({ sheetId, width, height }) => {
  // Subscriptions to global state
  const cells = useCells(sheetId);
  const selection = useSelection();
  const viewport = useViewport(width, height);

  // Derived computations
  const visibleCells = useMemo(
    () => calculateVisibleCells(cells, viewport),
    [cells, viewport]
  );

  // Event handlers
  const handleCellClick = useCallback(
    (cellId: CellId) => {
      dispatch(selectCell(cellId));
    },
    [dispatch]
  );

  const handleScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    // Update viewport WITHOUT re-rendering all cells
    setViewport({ scrollTop, scrollLeft });
  }, []);

  return (
    <VirtualGrid
      cells={visibleCells}
      selection={selection}
      viewport={viewport}
      onCellClick={handleCellClick}
      onScroll={handleScroll}
    />
  );
};
```

**Cell Component (Presentational, Highly Optimized)**:

```typescript
interface CellProps {
  cellId: CellId;
  value: CellValue;
  format: CellFormat;
  isSelected: boolean;
  isEditing: boolean;
  collaborators: CollaboratorCursor[];
  onClick: (cellId: CellId) => void;
  onDoubleClick: (cellId: CellId) => void;
}

// CRITICAL: Memoize to prevent unnecessary re-renders
// Only re-render if props actually changed (shallow equality)
const Cell = memo<CellProps>(
  ({ cellId, value, format, isSelected, isEditing, onClick }) => {
    const displayValue = useMemo(
      () => formatCellValue(value, format),
      [value, format]
    );

    const style = useMemo(
      () => generateCellStyle(format, isSelected),
      [format, isSelected]
    );

    if (isEditing) {
      // Use a separate CellEditor component to avoid re-rendering grid
      return <CellEditor cellId={cellId} initialValue={value} />;
    }

    return (
      <div
        className="cell"
        style={style}
        onClick={() => onClick(cellId)}
        data-cell-id={cellId}
      >
        {displayValue}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom equality: only re-render if these specific props changed
    return (
      prevProps.value === nextProps.value &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isEditing === nextProps.isEditing &&
      shallowEqual(prevProps.format, nextProps.format)
    );
  }
);
```

#### 3.1.2 Formula Bar Component

```
FormulaBar (Container)
├── CellReference (Controlled Input)
│   └── displays current cell (e.g., "A1")
│
├── FormulaEditor (Monaco Editor)
│   ├── Syntax Highlighting
│   ├── Autocomplete (functions, cell refs)
│   ├── Error Indicators
│   └── Formula Suggestions
│
└── FunctionHelper (Tooltip)
    └── shows function signature on hover
```

```typescript
const FormulaBar: FC = () => {
  const activeCell = useActiveCell();
  const [formula, setFormula] = useState("");
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor>(null);

  // Sync formula with active cell
  useEffect(() => {
    if (activeCell) {
      setFormula(activeCell.formula || activeCell.value);
    }
  }, [activeCell]);

  const handleFormulaChange = useCallback(
    (newFormula: string) => {
      setFormula(newFormula);

      // Optimistic update: parse and validate formula
      try {
        const parsedFormula = parseFormula(newFormula);
        // Show preview in cell (ghosted)
        dispatch(previewFormulaResult(activeCell.id, parsedFormula));
      } catch (error) {
        // Show error indicator
        dispatch(showFormulaError(error));
      }
    },
    [activeCell]
  );

  const handleSubmit = useCallback(() => {
    dispatch(updateCellFormula(activeCell.id, formula));
    // Move to next cell
    dispatch(moveSelection("down"));
  }, [activeCell, formula]);

  return (
    <div className="formula-bar">
      <CellReference value={activeCell?.address} readOnly />
      <MonacoEditor
        ref={editorRef}
        value={formula}
        onChange={handleFormulaChange}
        onEnter={handleSubmit}
        language="spreadsheet-formula" // Custom language
        options={{
          minimap: { enabled: false },
          lineNumbers: "off",
          scrollbar: { vertical: "hidden" },
          autocomplete: true,
        }}
      />
    </div>
  );
};
```

#### 3.1.3 Collaboration Components

```
CollaborationLayer
├── PresenceProvider (WebSocket connection)
│   └── manages user presence, cursors, selection
│
├── CollaboratorCursors (SVG overlay)
│   └── CollaboratorCursor[] (positioned absolutely)
│       ├── Cursor (triangle)
│       ├── UserLabel (name badge)
│       └── Selection Highlight (colored border)
│
└── ActivityFeed (Sidebar)
    └── ActivityItem[] (user actions timeline)
```

```typescript
interface CollaboratorCursor {
  userId: string;
  userName: string;
  color: string; // Assigned color
  position: CellId;
  selection?: CellRange;
}

const CollaboratorCursors: FC = () => {
  const collaborators = useCollaborators();
  const gridBounds = useGridBounds();

  return (
    <svg className="collaborator-layer" {...gridBounds}>
      {collaborators.map((collab) => (
        <CollaboratorCursor
          key={collab.userId}
          userId={collab.userId}
          userName={collab.userName}
          color={collab.color}
          position={collab.position}
          selection={collab.selection}
        />
      ))}
    </svg>
  );
};

const CollaboratorCursor: FC<CollaboratorCursor> = ({
  userName,
  color,
  position,
}) => {
  // Calculate pixel position from cell position
  const { x, y } = useCellPixelPosition(position);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cursor triangle */}
      <path d="M0,0 L0,16 L4,12 L7,18 L9,17 L6,11 L12,10 Z" fill={color} />
      {/* User name badge */}
      <rect
        x="12"
        y="0"
        width={userName.length * 8}
        height="18"
        fill={color}
        rx="2"
      />
      <text x="14" y="13" fill="white" fontSize="11" fontWeight="bold">
        {userName}
      </text>
    </g>
  );
};
```

### 3.2 Smart vs Presentational Components

#### Smart Components (Container Pattern)

**Responsibilities**:

- Connect to global state (Redux, Zustand)
- Handle business logic
- Dispatch actions
- Manage side effects (API calls, WebSocket)
- Subscribe to external data sources

**Examples**: `GridContainer`, `SheetController`, `CollaborationManager`

```typescript
// SMART: Connects to state, handles logic
const GridContainer: FC = () => {
  const dispatch = useDispatch();
  const cells = useSelector(selectVisibleCells);
  const selection = useSelector(selectSelection);

  const handleCellUpdate = useCallback(
    (cellId: CellId, value: string) => {
      // Business logic
      dispatch(updateCellCommand({ cellId, value }));

      // Side effects
      sendToCollaborators({ type: "CELL_UPDATE", cellId, value });
    },
    [dispatch]
  );

  return <Grid cells={cells} onCellUpdate={handleCellUpdate} />;
};
```

#### Presentational Components (Pure Components)

**Responsibilities**:

- Render UI based on props
- Handle UI events (pass to callbacks)
- No direct state access
- Highly reusable

**Examples**: `Cell`, `ColumnHeader`, `Toolbar`

```typescript
// PRESENTATIONAL: Pure, reusable
interface GridProps {
  cells: Cell[];
  onCellUpdate: (cellId: CellId, value: string) => void;
}

const Grid: FC<GridProps> = ({ cells, onCellUpdate }) => {
  return (
    <div className="grid">
      {cells.map((cell) => (
        <Cell key={cell.id} {...cell} onUpdate={onCellUpdate} />
      ))}
    </div>
  );
};
```

**Why This Separation?**

- ✅ Testability: Presentational components are pure functions (easy to test)
- ✅ Reusability: Presentational components can be reused with different data sources
- ✅ Performance: Can memoize presentational components more effectively
- ✅ Maintainability: Clear separation of concerns

### 3.3 Compound Components Pattern

For complex, stateful UI components like `ContextMenu`, `Dropdown`, use Compound Components pattern:

```typescript
// Compound Component: Components that work together
// Provides flexible API while maintaining internal state coordination

interface ContextMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  position: { x: number; y: number };
}

const ContextMenuContext = createContext<ContextMenuContextValue>(null);

// Root component: manages state
const ContextMenu: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const open = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ContextMenuContext.Provider value={{ isOpen, open, close, position }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

// Sub-components: consume context
ContextMenu.Trigger = ({ children }) => {
  const { open } = useContext(ContextMenuContext);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    open(e.clientX, e.clientY);
  };

  return cloneElement(children, { onContextMenu: handleRightClick });
};

ContextMenu.Content = ({ children }) => {
  const { isOpen, close, position } = useContext(ContextMenuContext);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="context-menu"
      style={{ top: position.y, left: position.x }}
      onClick={close}
    >
      {children}
    </div>,
    document.body
  );
};

ContextMenu.Item = ({ children, onClick }) => (
  <button className="context-menu-item" onClick={onClick}>
    {children}
  </button>
);

// Usage: Flexible, declarative API
<ContextMenu>
  <ContextMenu.Trigger>
    <div>Right-click me</div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item onClick={handleCopy}>Copy</ContextMenu.Item>
    <ContextMenu.Item onClick={handlePaste}>Paste</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>;
```

**When to use Compound Components?**

- ✅ Complex, multi-part UI (Dropdown, Tabs, Accordion, Modal)
- ✅ Need flexible API (consumers control structure)
- ✅ Shared state between sub-components
- ❌ Simple, single-element components (Button, Input)

### 3.4 Render Props vs HOC vs Hooks

#### Render Props Pattern

**When to use**: Need to share rendering logic, dynamic composition

```typescript
// Render Props: Inversion of control for rendering
interface SelectionManagerProps {
  children: (selection: Selection, actions: SelectionActions) => ReactNode;
}

const SelectionManager: FC<SelectionManagerProps> = ({ children }) => {
  const [selection, setSelection] = useState<Selection>(null);

  const actions = useMemo(
    () => ({
      select: (range: CellRange) => setSelection(range),
      clear: () => setSelection(null),
      extend: (to: CellId) => setSelection(extendSelection(selection, to)),
    }),
    [selection]
  );

  return <>{children(selection, actions)}</>;
};

// Usage
<SelectionManager>
  {(selection, actions) => (
    <Grid
      selection={selection}
      onCellClick={(cellId) => actions.select(cellId)}
    />
  )}
</SelectionManager>;
```

**Pros**: Flexible, explicit, no naming collisions
**Cons**: Callback hell, verbose, "wrapper hell"

#### HOC (Higher-Order Component)

**When to use**: Add cross-cutting concerns (auth, logging, analytics)

```typescript
// HOC: Wraps component to inject props
function withCollaboration<P>(Component: ComponentType<P>) {
  return (props: P) => {
    const presence = usePresence();
    const cursors = useCollaboratorCursors();

    return <Component {...props} presence={presence} cursors={cursors} />;
  };
}

// Usage
const GridWithCollaboration = withCollaboration(Grid);
```

**Pros**: Reusable, composable, separation of concerns
**Cons**: Props collision, wrapper hell, hard to type with TypeScript

#### Custom Hooks (RECOMMENDED)

**When to use**: Share stateful logic, side effects

```typescript
// Custom Hook: Encapsulate logic, return values
function useSelection() {
  const [selection, setSelection] = useState<Selection>(null);
  const dispatch = useDispatch();

  const select = useCallback(
    (range: CellRange) => {
      setSelection(range);
      dispatch(selectRange(range));
      // Announce to screen readers
      announceSelection(range);
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    setSelection(null);
    dispatch(clearSelection());
  }, [dispatch]);

  return { selection, select, clear };
}

// Usage: Clean, composable
const Grid: FC = () => {
  const { selection, select } = useSelection();
  const { cursors } = useCollaboration();

  return <GridView selection={selection} onSelect={select} />;
};
```

**Pros**: Clean, composable, TypeScript-friendly, no wrapper hell
**Cons**: Can't be used in class components (rare issue now)

**DECISION**: Prefer Custom Hooks > Render Props > HOC

- Hooks are the modern, React-recommended approach
- Use Render Props for very dynamic composition needs
- Use HOC only for legacy code or specific library integration

### 3.5 Atomic Design Methodology

```
Atoms (Basic building blocks)
├── Button
├── Input
├── Icon
├── Badge
└── Spinner

Molecules (Simple combinations)
├── CellInput (Input + validation)
├── ToolbarButton (Icon + Tooltip)
├── ColorPicker (Input + Popover)
└── NumberInput (Input + increment/decrement)

Organisms (Complex combinations)
├── Toolbar (Multiple ToolbarButtons)
├── ContextMenu (Menu structure)
├── FormulaBar (CellReference + Editor)
└── ShareDialog (Form + Permissions + UserList)

Templates (Page layouts)
├── SheetLayout (Header + Toolbar + Grid + Tabs)
└── EmptyState (Icon + Message + Action)

Pages (Specific instances)
├── SpreadsheetPage
└── HomePage
```

**Example - Building a Toolbar Button (Molecule)**:

```typescript
// Atom: Button
const Button: FC<ButtonProps> = ({ children, onClick, variant }) => (
  <button className={`btn btn-${variant}`} onClick={onClick}>
    {children}
  </button>
);

// Atom: Icon
const Icon: FC<IconProps> = ({ name, size }) => (
  <svg className={`icon icon-${size}`}>
    <use href={`#icon-${name}`} />
  </svg>
);

// Molecule: ToolbarButton (Icon + Tooltip)
const ToolbarButton: FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  isActive,
}) => (
  <Tooltip content={label}>
    <Button
      onClick={onClick}
      variant={isActive ? "primary" : "secondary"}
      aria-label={label}
    >
      <Icon name={icon} size="sm" />
    </Button>
  </Tooltip>
);

// Organism: Toolbar (Multiple ToolbarButtons)
const Toolbar: FC = () => {
  const { bold, italic, underline } = useFormatting();

  return (
    <div className="toolbar">
      <ToolbarButton icon="bold" label="Bold" onClick={bold} />
      <ToolbarButton icon="italic" label="Italic" onClick={italic} />
      <ToolbarButton icon="underline" label="Underline" onClick={underline} />
    </div>
  );
};
```

### 3.6 Component API Design

Good component APIs are:

1. **Minimal**: Only essential props
2. **Consistent**: Similar components have similar APIs
3. **Predictable**: Clear behavior from prop names
4. **Composable**: Can be combined with other components

```typescript
// ✅ GOOD: Minimal, clear API
interface CellProps {
  value: CellValue;
  format?: CellFormat;
  isSelected?: boolean;
  onClick?: (cellId: CellId) => void;
}

// ❌ BAD: Too many props, unclear responsibilities
interface CellProps {
  value: string;
  displayValue: string;
  rawValue: any;
  format: CellFormat;
  isSelected: boolean;
  isEditing: boolean;
  isFocused: boolean;
  isHighlighted: boolean;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  onClick: () => void;
  onDoubleClick: () => void;
  onRightClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  // ... 20 more props
}
```

**Component Props Interface Guidelines**:

```typescript
// 1. Required props first, optional props after
interface GridProps {
  // Required
  data: Cell[][];

  // Optional (with defaults)
  width?: number; // default: 800
  height?: number; // default: 600
  virtualizeRows?: boolean; // default: true

  // Event handlers (always optional)
  onCellClick?: (cellId: CellId) => void;
  onSelectionChange?: (selection: Selection) => void;
}

// 2. Use discriminated unions for variants
interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  size: "sm" | "md" | "lg";
}

// 3. Use generic types for reusable components
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
}

// 4. Explicit over implicit
// ❌ BAD: What does "mode" mean?
interface EditorProps {
  mode: "a" | "b" | "c";
}

// ✅ GOOD: Self-documenting
interface EditorProps {
  editMode: "edit" | "view" | "readonly";
}
```

---

## 4. State Management

### 4.1 Global State Structure

```typescript
// Root state structure (using Zustand + Immer)
interface SpreadsheetState {
  // Document metadata
  document: {
    id: string;
    name: string;
    owner: User;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
  };

  // Sheets (tabs)
  sheets: {
    byId: Record<SheetId, Sheet>;
    allIds: SheetId[];
    activeSheetId: SheetId;
  };

  // Cells (normalized, indexed by sheet)
  cells: {
    [sheetId: SheetId]: {
      byId: Record<CellId, Cell>;
      // Sparse matrix for efficient lookup
      byAddress: Record<string, CellId>; // "A1" -> cellId
    };
  };

  // Formulas and dependencies
  formulas: {
    [sheetId: SheetId]: {
      // Cell -> Cells it depends on
      dependencies: Record<CellId, Set<CellId>>;
      // Cell -> Cells that depend on it
      dependents: Record<CellId, Set<CellId>>;
      // Calculation order (topological sort)
      calculationOrder: CellId[];
      // Circular references
      circularRefs: Set<CellId>;
    };
  };

  // UI State (ephemeral, not synced)
  ui: {
    // Current selection
    selection: {
      anchor: CellId | null; // Where selection started
      focus: CellId | null; // Current cell
      range: CellRange | null; // Selected range
      isEditing: boolean;
    };

    // Viewport (for virtualization)
    viewport: {
      scrollTop: number;
      scrollLeft: number;
      visibleRows: [number, number]; // [start, end]
      visibleCols: [number, number];
    };

    // Clipboard
    clipboard: {
      data: ClipboardData | null;
      mode: "cut" | "copy" | null;
    };

    // UI panels
    panels: {
      sidebar: { isOpen: boolean; activePanel: string };
      formulaBar: { isFocused: boolean };
      contextMenu: { isOpen: boolean; position: Point };
    };
  };

  // Collaboration state
  collaboration: {
    // Current user
    currentUser: User;

    // Active collaborators
    collaborators: {
      byId: Record<UserId, Collaborator>;
      allIds: UserId[];
    };

    // Real-time cursors and selections
    presence: {
      [userId: UserId]: {
        cursor: CellId;
        selection: CellRange | null;
        lastSeen: Date;
      };
    };

    // WebSocket connection
    connection: {
      status: "connected" | "disconnected" | "reconnecting";
      latency: number; // ms
    };
  };

  // History (undo/redo)
  history: {
    past: Operation[][]; // Stack of operation batches
    future: Operation[][];
    maxSize: number; // Limit history size
  };

  // Server sync state
  sync: {
    // Pending operations (not yet acknowledged by server)
    pending: Operation[];

    // Last acknowledged operation ID
    lastAckId: number;

    // Sync status
    status: "synced" | "syncing" | "conflict" | "error";

    // Last sync time
    lastSyncedAt: Date;
  };
}

// Cell model
interface Cell {
  id: CellId;
  sheetId: SheetId;
  row: number;
  col: number;

  // Value and formula
  value: CellValue; // Computed/display value
  formula: string | null; // Formula if cell contains formula
  rawValue: any; // Original input

  // Formatting
  format: CellFormat;

  // Metadata
  createdBy: UserId;
  createdAt: Date;
  updatedBy: UserId;
  updatedAt: Date;

  // Validation
  validation: DataValidation | null;
  validationError: string | null;

  // Comments
  commentIds: string[];
}

interface CellFormat {
  // Text formatting
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  textColor: string;

  // Cell formatting
  backgroundColor: string;
  borders: Borders;
  alignment: {
    horizontal: "left" | "center" | "right";
    vertical: "top" | "middle" | "bottom";
  };

  // Number formatting
  numberFormat: NumberFormat;

  // Conditional formatting
  conditionalFormats: ConditionalFormat[];
}
```

### 4.2 State Management Pattern (Zustand + Immer)

```typescript
// Why Zustand + Immer?
// - Zustand: Lightweight, no Context Provider hell, easy to use
// - Immer: Write mutative code, get immutable updates
// - Alternatives considered: Redux (too verbose), Jotai (atoms too granular)

import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

// Store definition
const useSpreadsheetStore = create<SpreadsheetState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      document: null,
      sheets: { byId: {}, allIds: [], activeSheetId: null },
      cells: {},
      formulas: {},
      ui: {
        selection: { anchor: null, focus: null, range: null, isEditing: false },
        viewport: {
          scrollTop: 0,
          scrollLeft: 0,
          visibleRows: [0, 50],
          visibleCols: [0, 20],
        },
        clipboard: { data: null, mode: null },
        panels: {
          sidebar: { isOpen: false, activePanel: "" },
          formulaBar: { isFocused: false },
          contextMenu: { isOpen: false, position: { x: 0, y: 0 } },
        },
      },
      collaboration: {
        currentUser: null,
        collaborators: { byId: {}, allIds: [] },
        presence: {},
        connection: { status: "disconnected", latency: 0 },
      },
      history: { past: [], future: [], maxSize: 100 },
      sync: {
        pending: [],
        lastAckId: 0,
        status: "synced",
        lastSyncedAt: new Date(),
      },

      // Actions
      actions: {
        // Cell operations
        updateCell: (cellId: CellId, updates: Partial<Cell>) =>
          set((state) => {
            // Immer allows mutative syntax
            const cell = state.cells[state.sheets.activeSheetId].byId[cellId];
            Object.assign(cell, updates);

            // If formula changed, recalculate dependencies
            if (updates.formula !== undefined) {
              recalculateDependents(state, cellId);
            }
          }),

        // Batch updates (for performance)
        updateCells: (updates: Record<CellId, Partial<Cell>>) =>
          set((state) => {
            const sheetId = state.sheets.activeSheetId;
            Object.entries(updates).forEach(([cellId, updates]) => {
              const cell = state.cells[sheetId].byId[cellId];
              Object.assign(cell, updates);
            });

            // Single recalculation pass for all affected cells
            recalculateFormulas(state, sheetId);
          }),

        // Selection
        setSelection: (selection: Partial<SelectionState>) =>
          set((state) => {
            Object.assign(state.ui.selection, selection);
          }),

        // Undo/Redo
        undo: () =>
          set((state) => {
            if (state.history.past.length === 0) return;

            const operations = state.history.past.pop()!;
            state.history.future.push(operations);

            // Reverse operations
            operations.reverse().forEach((op) => {
              applyInverseOperation(state, op);
            });
          }),

        redo: () =>
          set((state) => {
            if (state.history.future.length === 0) return;

            const operations = state.history.future.pop()!;
            state.history.past.push(operations);

            // Apply operations
            operations.forEach((op) => {
              applyOperation(state, op);
            });
          }),
      },
    }))
  )
);

// Selectors (memoized with Zustand's built-in selector optimization)
export const useCells = (sheetId: SheetId) =>
  useSpreadsheetStore(
    (state) => state.cells[sheetId]?.byId || {},
    shallow // Shallow equality check
  );

export const useActiveCell = () =>
  useSpreadsheetStore((state) => {
    const { focus } = state.ui.selection;
    if (!focus) return null;
    const sheetId = state.sheets.activeSheetId;
    return state.cells[sheetId]?.byId[focus] || null;
  });

export const useVisibleCells = () =>
  useSpreadsheetStore((state) => {
    const sheetId = state.sheets.activeSheetId;
    const { visibleRows, visibleCols } = state.ui.viewport;
    const cells = state.cells[sheetId]?.byId || {};

    // Return only visible cells (for virtualization)
    return Object.values(cells).filter(
      (cell) =>
        cell.row >= visibleRows[0] &&
        cell.row <= visibleRows[1] &&
        cell.col >= visibleCols[0] &&
        cell.col <= visibleCols[1]
    );
  }, shallow);
```

### 4.3 Server State vs Client State

```typescript
// Separation of concerns
// Server State: Data from backend (cells, formulas, formatting)
// Client State: UI-only state (selection, viewport, modals)

// Server State Management (React Query)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch spreadsheet data
function useSpreadsheet(spreadsheetId: string) {
  return useQuery({
    queryKey: ["spreadsheet", spreadsheetId],
    queryFn: () => fetchSpreadsheet(spreadsheetId),
    staleTime: Infinity, // Don't refetch (real-time updates via WebSocket)
    cacheTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

// Update cell mutation
function useUpdateCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: CellUpdate) => updateCellAPI(update),

    // Optimistic update
    onMutate: async (update) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["spreadsheet", update.spreadsheetId]);

      // Snapshot current value
      const previous = queryClient.getQueryData([
        "spreadsheet",
        update.spreadsheetId,
      ]);

      // Optimistically update cache
      queryClient.setQueryData(
        ["spreadsheet", update.spreadsheetId],
        (old: any) => ({
          ...old,
          cells: {
            ...old.cells,
            [update.cellId]: { ...old.cells[update.cellId], ...update.data },
          },
        })
      );

      return { previous };
    },

    // Rollback on error
    onError: (err, update, context) => {
      queryClient.setQueryData(
        ["spreadsheet", update.spreadsheetId],
        context.previous
      );

      // Show error toast
      toast.error("Failed to update cell. Changes reverted.");
    },

    // Refetch on success (or trust WebSocket update)
    onSuccess: (data, update) => {
      // Option 1: Trust optimistic update (rely on WebSocket for conflicts)
      // Option 2: Refetch to ensure consistency
      // queryClient.invalidateQueries(['spreadsheet', update.spreadsheetId]);
    },
  });
}

// Client State (Zustand - see above)
// UI-only state doesn't go through React Query
const useUIStore = create((set) => ({
  selection: null,
  viewport: { top: 0, left: 0 },
  modals: {},

  setSelection: (selection) => set({ selection }),
  setViewport: (viewport) => set({ viewport }),
}));
```

**Why Separate Server and Client State?**

- ✅ Server state has different lifecycle (caching, refetching, invalidation)
- ✅ Client state is ephemeral (doesn't need persistence, sync)
- ✅ Easier testing (mock server data separately from UI state)
- ✅ Better performance (don't re-render entire app on viewport scroll)

### 4.4 Caching Strategy

```typescript
// Multi-layer caching strategy

// Layer 1: React Query Cache (Server data)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Never consider data stale (WebSocket updates)
      cacheTime: 1000 * 60 * 30, // Keep unused data for 30 min
      refetchOnWindowFocus: false, // Don't refetch on focus (WebSocket keeps us updated)
      retry: 3, // Retry failed requests
    },
  },
});

// Layer 2: IndexedDB (Offline persistence)
import localforage from "localforage";

const spreadsheetDB = localforage.createInstance({
  name: "spreadsheet-cache",
  storeName: "sheets",
});

// Cache spreadsheet data for offline access
async function cacheSpreadsheet(spreadsheetId: string, data: Spreadsheet) {
  await spreadsheetDB.setItem(spreadsheetId, {
    data,
    cachedAt: Date.now(),
  });
}

// Load from cache if offline
async function loadFromCache(
  spreadsheetId: string
): Promise<Spreadsheet | null> {
  const cached = await spreadsheetDB.getItem<CachedSpreadsheet>(spreadsheetId);

  if (!cached) return null;

  // Check if cache is stale (older than 1 day)
  const isStale = Date.now() - cached.cachedAt > 1000 * 60 * 60 * 24;

  if (isStale && navigator.onLine) {
    // Fetch fresh data
    return null;
  }

  return cached.data;
}

// Layer 3: Memory Cache (Computed values)
import memoize from "memoize-one";

// Cache expensive computations
const getVisibleCells = memoize(
  (cells: Cell[], viewport: Viewport) => {
    return cells.filter(
      (cell) =>
        cell.row >= viewport.startRow &&
        cell.row <= viewport.endRow &&
        cell.col >= viewport.startCol &&
        cell.col <= viewport.endCol
    );
  },
  // Custom equality check (shallow comparison)
  (newArgs, lastArgs) =>
    newArgs[0] === lastArgs[0] && shallowEqual(newArgs[1], lastArgs[1])
);

// Cache formula calculations
const formulaCache = new Map<string, any>();

function evaluateFormula(formula: string, context: FormulaContext): any {
  const cacheKey = `${formula}:${JSON.stringify(context)}`;

  if (formulaCache.has(cacheKey)) {
    return formulaCache.get(cacheKey);
  }

  const result = parseAndEvaluate(formula, context);
  formulaCache.set(cacheKey, result);

  // LRU eviction (keep cache size < 10K entries)
  if (formulaCache.size > 10000) {
    const firstKey = formulaCache.keys().next().value;
    formulaCache.delete(firstKey);
  }

  return result;
}

// Invalidate cache when dependencies change
function invalidateFormulaCache(cellId: CellId, formulas: FormulaGraph) {
  // Get all dependent cells
  const dependents = formulas.dependents[cellId] || new Set();

  // Invalidate cache for this cell and all dependents
  [cellId, ...dependents].forEach((id) => {
    const cell = getCellById(id);
    if (cell?.formula) {
      const cacheKey = `${cell.formula}:*`; // Wildcard pattern
      // Delete all cache entries matching this formula
      for (const key of formulaCache.keys()) {
        if (key.startsWith(cacheKey.split(":")[0])) {
          formulaCache.delete(key);
        }
      }
    }
  });
}
```

### 4.5 Optimistic Updates Implementation

```typescript
// Optimistic updates: Apply change locally immediately, then sync with server
// If server rejects, rollback. If conflict, apply operational transform.

interface PendingOperation {
  id: string;
  operation: Operation;
  timestamp: number;
  clientId: string;
  status: "pending" | "acknowledged" | "rejected";
}

class OptimisticUpdateManager {
  private pending: Map<string, PendingOperation> = new Map();
  private rollbacks: Map<string, () => void> = new Map();

  // Apply operation optimistically
  applyOptimistic(operation: Operation): string {
    const opId = generateOperationId();

    // 1. Apply operation locally
    const rollback = applyOperationToState(operation);

    // 2. Track for rollback
    this.pending.set(opId, {
      id: opId,
      operation,
      timestamp: Date.now(),
      clientId: getClientId(),
      status: "pending",
    });
    this.rollbacks.set(opId, rollback);

    // 3. Send to server
    this.sendToServer(opId, operation);

    // 4. Set timeout (if no ACK in 5s, assume failure)
    setTimeout(() => {
      if (this.pending.get(opId)?.status === "pending") {
        this.handleTimeout(opId);
      }
    }, 5000);

    return opId;
  }

  // Server acknowledged operation
  handleAck(opId: string, serverOperation?: Operation) {
    const pending = this.pending.get(opId);
    if (!pending) return;

    // Mark as acknowledged
    pending.status = "acknowledged";

    // If server transformed our operation, apply the difference
    if (
      serverOperation &&
      !operationsEqual(pending.operation, serverOperation)
    ) {
      this.applyServerTransform(pending.operation, serverOperation);
    }

    // Clean up
    this.rollbacks.delete(opId);
    this.pending.delete(opId);
  }

  // Server rejected operation (validation error, permissions, etc.)
  handleReject(opId: string, reason: string) {
    const pending = this.pending.get(opId);
    if (!pending) return;

    // Rollback optimistic change
    const rollback = this.rollbacks.get(opId);
    if (rollback) {
      rollback();
    }

    // Show error to user
    toast.error(`Operation failed: ${reason}`);

    // Clean up
    pending.status = "rejected";
    this.rollbacks.delete(opId);
    this.pending.delete(opId);
  }

  // Timeout (no response from server)
  handleTimeout(opId: string) {
    const pending = this.pending.get(opId);
    if (!pending) return;

    // Show warning (operation might still succeed)
    toast.warning("Operation taking longer than expected...");

    // Keep operation pending (might get ACK later)
    // Alternatively, rollback after timeout:
    // this.handleReject(opId, 'Timeout');
  }

  // Receive operation from another client
  handleRemoteOperation(operation: Operation) {
    // Transform pending operations against remote operation
    this.pending.forEach((pending) => {
      if (pending.status === "pending") {
        // Operational Transform: adjust pending operation
        const transformed = transformOperation(pending.operation, operation);
        pending.operation = transformed;
      }
    });

    // Apply remote operation
    applyOperationToState(operation);
  }

  private applyServerTransform(clientOp: Operation, serverOp: Operation) {
    // Server may have transformed our operation (e.g., merged concurrent edits)
    // Calculate delta and apply
    const delta = calculateDelta(clientOp, serverOp);
    if (delta) {
      applyOperationToState(delta);
    }
  }

  private sendToServer(opId: string, operation: Operation) {
    websocket.send({
      type: "OPERATION",
      id: opId,
      operation,
      clientId: getClientId(),
      timestamp: Date.now(),
    });
  }
}

// Usage in component
function useOptimisticUpdate() {
  const manager = useRef(new OptimisticUpdateManager()).current;

  const updateCell = useCallback(
    (cellId: CellId, value: string) => {
      const operation: UpdateCellOperation = {
        type: "UPDATE_CELL",
        cellId,
        value,
        previousValue: getCellValue(cellId),
      };

      // Apply optimistically
      const opId = manager.applyOptimistic(operation);

      // Return operation ID (can be used to track status)
      return opId;
    },
    [manager]
  );

  return { updateCell };
}
```

**Why Optimistic Updates?**

- ✅ Instant feedback (feels like native app)
- ✅ Works offline (queue operations)
- ✅ Better UX (no spinners for every action)
- ❌ Complex rollback logic
- ❌ Confusing when conflicts occur

**Decision**: Essential for collaborative editing. Users expect instant feedback.

### 4.6 State Persistence Strategy

```typescript
// Persist state across sessions

// 1. Auto-save to server (every 2 seconds or on idle)
import { debounce } from "lodash";

const debouncedSave = debounce(
  async (state: SpreadsheetState) => {
    await saveToServer(state);
  },
  2000,
  { maxWait: 10000 }
); // Save at least every 10 seconds

useEffect(() => {
  // Subscribe to state changes
  const unsubscribe = useSpreadsheetStore.subscribe((state) => {
    debouncedSave(state);
  });

  return unsubscribe;
}, []);

// 2. Persist UI state to localStorage (viewport, panel positions)
const persistConfig = {
  name: "spreadsheet-ui",
  storage: localStorage,

  // Only persist UI state (not server data)
  partialize: (state: SpreadsheetState) => ({
    ui: {
      panels: state.ui.panels,
      // Don't persist: selection, viewport (session-specific)
    },
  }),
};

const useSpreadsheetStore = create(
  persist(
    immer((set, get) => ({
      /* store definition */
    })),
    persistConfig
  )
);

// 3. IndexedDB for offline support (full spreadsheet cache)
import { openDB } from "idb";

const db = await openDB("spreadsheet-cache", 1, {
  upgrade(db) {
    db.createObjectStore("spreadsheets", { keyPath: "id" });
    db.createObjectStore("pending-operations", { keyPath: "id" });
  },
});

// Cache spreadsheet for offline access
async function cacheForOffline(spreadsheet: Spreadsheet) {
  await db.put("spreadsheets", spreadsheet);
}

// Queue operations when offline
async function queueOperation(operation: Operation) {
  await db.put("pending-operations", {
    id: generateId(),
    operation,
    timestamp: Date.now(),
  });
}

// Sync when back online
window.addEventListener("online", async () => {
  const pending = await db.getAll("pending-operations");

  for (const { id, operation } of pending) {
    try {
      await sendOperationToServer(operation);
      await db.delete("pending-operations", id);
    } catch (error) {
      // Keep in queue, will retry on next online event
      console.error("Failed to sync operation", error);
    }
  }
});
```

---

## 5. Data Flow & API Communication

### 5.1 API Design (REST + GraphQL Hybrid)

```typescript
// REST for CRUD operations
// GraphQL for complex queries and real-time subscriptions

// REST Endpoints
interface SpreadsheetAPI {
  // Spreadsheet management
  GET    /api/spreadsheets/:id                    // Get spreadsheet metadata
  POST   /api/spreadsheets                        // Create spreadsheet
  PATCH  /api/spreadsheets/:id                    // Update metadata (name, permissions)
  DELETE /api/spreadsheets/:id                    // Delete spreadsheet

  // Sheets (tabs)
  GET    /api/spreadsheets/:id/sheets             // List sheets
  POST   /api/spreadsheets/:id/sheets             // Create sheet
  PATCH  /api/spreadsheets/:id/sheets/:sheetId    // Update sheet
  DELETE /api/spreadsheets/:id/sheets/:sheetId    // Delete sheet

  // Cells (bulk operations)
  GET    /api/spreadsheets/:id/cells?range=A1:Z100  // Get cell range
  POST   /api/spreadsheets/:id/cells/batch          // Batch update cells

  // Import/Export
  POST   /api/spreadsheets/:id/import             // Import file (CSV, XLSX)
  GET    /api/spreadsheets/:id/export?format=xlsx // Export spreadsheet

  // Sharing & Permissions
  GET    /api/spreadsheets/:id/permissions        // List permissions
  POST   /api/spreadsheets/:id/permissions        // Grant permission
  DELETE /api/spreadsheets/:id/permissions/:userId // Revoke permission

  // Version History
  GET    /api/spreadsheets/:id/versions           // List versions
  GET    /api/spreadsheets/:id/versions/:version  // Get specific version
  POST   /api/spreadsheets/:id/versions/:version/restore // Restore version

  // Comments
  GET    /api/spreadsheets/:id/comments           // List comments
  POST   /api/spreadsheets/:id/comments           // Create comment
  PATCH  /api/spreadsheets/:id/comments/:commentId // Edit comment
  DELETE /api/spreadsheets/:id/comments/:commentId // Delete comment
}

// GraphQL for complex queries and subscriptions
const typeDefs = gql`
  type Spreadsheet {
    id: ID!
    name: String!
    owner: User!
    permissions: [Permission!]!
    sheets: [Sheet!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Sheet {
    id: ID!
    name: String!
    index: Int!
    cells(range: String): [Cell!]!
    rowCount: Int!
    columnCount: Int!
  }

  type Cell {
    id: ID!
    address: String!
    row: Int!
    col: Int!
    value: String
    formula: String
    format: CellFormat
    updatedBy: User
    updatedAt: DateTime
  }

  type Query {
    spreadsheet(id: ID!): Spreadsheet
    spreadsheets(filter: SpreadsheetFilter): [Spreadsheet!]!

    # Complex query: Get cells with formulas that depend on a specific cell
    dependentCells(spreadsheetId: ID!, cellId: String!): [Cell!]!
  }

  type Mutation {
    updateCells(spreadsheetId: ID!, updates: [CellUpdate!]!): [Cell!]!
    insertRows(spreadsheetId: ID!, sheetId: ID!, startRow: Int!, count: Int!): Sheet!
    deleteColumns(spreadsheetId: ID!, sheetId: ID!, startCol: Int!, count: Int!): Sheet!
  }

  type Subscription {
    # Real-time updates
    cellUpdated(spreadsheetId: ID!): CellUpdatedPayload!
    collaboratorJoined(spreadsheetId: ID!): Collaborator!
    collaboratorLeft(spreadsheetId: ID!): String! # User ID
    cursorMoved(spreadsheetId: ID!): CursorPosition!
  }
`;
```

### 5.2 Real-time Communication (WebSocket)

```typescript
// WebSocket for real-time collaboration
// Protocol: JSON messages with operation-based sync

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId: string;
}

// Message types
type WSMessage =
  | { type: "OPERATION"; operation: Operation; opId: string }
  | { type: "OPERATION_ACK"; opId: string; serverOpId: string }
  | { type: "OPERATION_REJECT"; opId: string; reason: string }
  | { type: "CURSOR_MOVE"; userId: string; cellId: CellId }
  | { type: "SELECTION_CHANGE"; userId: string; range: CellRange }
  | { type: "USER_JOIN"; user: User }
  | { type: "USER_LEAVE"; userId: string }
  | {
      type: "PRESENCE_UPDATE";
      userId: string;
      status: "active" | "idle" | "offline";
    };

// WebSocket client
class SpreadsheetWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: WSMessage[] = [];

  connect(spreadsheetId: string) {
    const wsUrl = `wss://api.example.com/ws/spreadsheets/${spreadsheetId}?token=${getAuthToken()}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;

      // Send queued messages
      this.flushQueue();

      // Send presence
      this.send({
        type: "PRESENCE_UPDATE",
        payload: { status: "active" },
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      });
    };

    this.ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
      this.handleReconnect();
    };
  }

  send(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  private handleMessage(message: WSMessage) {
    switch (message.type) {
      case "OPERATION":
        // Remote user made a change
        handleRemoteOperation(message.payload.operation);
        break;

      case "OPERATION_ACK":
        // Our operation was acknowledged
        optimisticUpdateManager.handleAck(message.payload.opId);
        break;

      case "OPERATION_REJECT":
        // Our operation was rejected
        optimisticUpdateManager.handleReject(
          message.payload.opId,
          message.payload.reason
        );
        break;

      case "CURSOR_MOVE":
        // Update collaborator cursor position
        updateCollaboratorCursor(
          message.payload.userId,
          message.payload.cellId
        );
        break;

      case "USER_JOIN":
        // New collaborator joined
        addCollaborator(message.payload.user);
        toast.info(`${message.payload.user.name} joined`);
        break;

      case "USER_LEAVE":
        // Collaborator left
        removeCollaborator(message.payload.userId);
        break;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error("Unable to reconnect. Please refresh the page.");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000); // Exponential backoff

    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect(getCurrentSpreadsheetId());
    }, delay);
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage
const wsClient = new SpreadsheetWebSocket();

useEffect(() => {
  wsClient.connect(spreadsheetId);

  return () => {
    wsClient.disconnect();
  };
}, [spreadsheetId]);
```

### 5.3 API Layer Abstraction

```typescript
// Centralized API client with interceptors, retries, error handling

import axios, { AxiosInstance, AxiosError } from "axios";

class SpreadsheetAPIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor (add auth token)
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request ID for tracing
        config.headers["X-Request-ID"] = generateRequestId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (handle errors, retry)
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config!;

        // Retry on network errors or 5xx
        if (this.shouldRetry(error)) {
          const retryCount = (config as any).__retryCount || 0;

          if (retryCount < 3) {
            (config as any).__retryCount = retryCount + 1;

            // Exponential backoff
            await this.delay(1000 * 2 ** retryCount);

            return this.client.request(config);
          }
        }

        // Handle auth errors
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        // Transform error for better UX
        const transformedError = this.transformError(error);
        return Promise.reject(transformedError);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) return true;

    // Retry on 5xx server errors (except 501)
    if (error.response.status >= 500 && error.response.status !== 501) {
      return true;
    }

    // Retry on 429 (rate limit)
    if (error.response.status === 429) return true;

    return false;
  }

  private transformError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return new ValidationError(data.message || "Invalid request");
        case 403:
          return new PermissionError(
            "You do not have permission for this action"
          );
        case 404:
          return new NotFoundError("Resource not found");
        case 409:
          return new ConflictError("Conflicting changes detected");
        case 429:
          return new RateLimitError("Too many requests. Please slow down.");
        default:
          return new APIError(`Server error: ${status}`);
      }
    } else if (error.request) {
      // Request made but no response
      return new NetworkError("Network error. Please check your connection.");
    } else {
      // Error setting up request
      return new Error(error.message);
    }
  }

  private handleAuthError() {
    // Clear auth token
    this.authToken = null;

    // Redirect to login
    window.location.href = "/login";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // API methods
  async getSpreadsheet(id: string): Promise<Spreadsheet> {
    const response = await this.client.get(`/spreadsheets/${id}`);
    return response.data;
  }

  async updateCells(
    spreadsheetId: string,
    updates: CellUpdate[]
  ): Promise<Cell[]> {
    const response = await this.client.post(
      `/spreadsheets/${spreadsheetId}/cells/batch`,
      { updates }
    );
    return response.data;
  }

  async getCellRange(spreadsheetId: string, range: string): Promise<Cell[]> {
    const response = await this.client.get(
      `/spreadsheets/${spreadsheetId}/cells`,
      { params: { range } }
    );
    return response.data;
  }

  // ... more methods

  setAuthToken(token: string) {
    this.authToken = token;
  }
}

// Singleton instance
export const apiClient = new SpreadsheetAPIClient(
  "https://api.example.com/api"
);

// Custom error classes
class ValidationError extends Error {
  name = "ValidationError";
}

class PermissionError extends Error {
  name = "PermissionError";
}

class NotFoundError extends Error {
  name = "NotFoundError";
}

class ConflictError extends Error {
  name = "ConflictError";
}

class RateLimitError extends Error {
  name = "RateLimitError";
}

class APIError extends Error {
  name = "APIError";
}

class NetworkError extends Error {
  name = "NetworkError";
}
```

### 5.4 Error Handling Patterns

```typescript
// Centralized error handling with user-friendly messages

interface ErrorHandler {
  handle(error: Error): void;
}

class UIErrorHandler implements ErrorHandler {
  handle(error: Error) {
    // Log to console (and error tracking service)
    console.error(error);
    trackError(error);

    // Show user-friendly message
    if (error instanceof ValidationError) {
      toast.error(error.message);
    } else if (error instanceof PermissionError) {
      toast.error(error.message);
      // Optionally: show upgrade prompt
    } else if (error instanceof NetworkError) {
      toast.error("Network error. Please check your connection.");
      // Show offline indicator
    } else if (error instanceof ConflictError) {
      toast.warning("Conflicting changes detected. Refreshing...");
      // Reload data
      window.location.reload();
    } else {
      // Generic error
      toast.error("Something went wrong. Please try again.");
    }
  }
}

const errorHandler = new UIErrorHandler();

// Usage in components
async function updateCell(cellId: CellId, value: string) {
  try {
    await apiClient.updateCells(spreadsheetId, [{ cellId, value }]);
  } catch (error) {
    errorHandler.handle(error as Error);
  }
}

// Global error boundary
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    trackError(error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

### 5.5 Retry Logic with Exponential Backoff

```typescript
// Retry failed operations with exponential backoff

interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffFactor: number;
  shouldRetry?: (error: Error) => boolean;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffFactor,
    shouldRetry = () => true,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if should retry
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // Last attempt, don't delay
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;

      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError!;
}

// Usage
async function saveSpreadsheet() {
  return retryWithBackoff(
    () => apiClient.updateCells(spreadsheetId, pendingUpdates),
    {
      maxAttempts: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffFactor: 2,
      shouldRetry: (error) => {
        // Only retry on network errors or 5xx
        return (
          error instanceof NetworkError ||
          (error instanceof APIError && error.message.includes("5"))
        );
      },
    }
  );
}
```

---

## 6. Performance Optimization

### 6.1 Bundle Optimization

```typescript
// Code splitting strategy

// 1. Route-based code splitting
const SpreadsheetPage = lazy(() => import('./pages/SpreadsheetPage'));
const HomePage = lazy(() => import('./pages/HomePage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sheets/:id" element={<SpreadsheetPage />} />
      </Routes>
    </Suspense>
  );
}

// 2. Component-level code splitting (lazy load heavy components)
const ChartEditor = lazy(() => import('./components/ChartEditor'));
const FormulaEditor = lazy(() =>
  import(/* webpackChunkName: "formula-editor" */ './components/FormulaEditor')
);

// 3. Library code splitting (load Monaco editor only when needed)
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// 4. Dynamic imports for features
async function loadExportFeature() {
  const { exportToExcel } = await import('./features/export');
  return exportToExcel;
}

// Webpack configuration
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor bundle
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        // React/React-DOM separate bundle
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20,
        },
        // Heavy libraries (Monaco, Chart.js)
        heavy: {
          test: /[\\/]node_modules[\\/](monaco-editor|chart\.js)[\\/]/,
          name: 'heavy-libs',
          priority: 15,
        },
      },
    },
    // Minimize bundle
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
          },
        },
      }),
    ],
  },
};

// Tree shaking (remove unused code)
// Use ES6 imports (not CommonJS)
import { sum, average } from 'lodash-es'; // ✅ Tree-shakeable
const _ = require('lodash'); // ❌ Not tree-shakeable

// Package.json
{
  "sideEffects": false, // Enable tree shaking for all files
  // OR specify side effect files
  "sideEffects": ["*.css", "*.scss"]
}
```

**Bundle Size Targets**:
| Bundle | Size (gzipped) | Notes |
|--------|----------------|-------|
| Main (critical path) | < 200KB | Core app, grid, state |
| Vendors | < 150KB | React, Zustand, etc. |
| Formula Editor | < 100KB | Lazy loaded |
| Charts | < 80KB | Lazy loaded |
| Export | < 50KB | Lazy loaded |
| **Total (initial)** | **< 350KB** | Main + Vendors |

### 6.2 Rendering Optimization

```typescript
// 1. Virtualization (only render visible cells)

import { FixedSizeGrid } from "react-window";

const VirtualGrid: FC<VirtualGridProps> = ({
  rowCount,
  columnCount,
  rowHeight,
  columnWidth,
}) => {
  // Cell renderer (called for each visible cell)
  const Cell = ({ columnIndex, rowIndex, style }: GridCellProps) => {
    const cellId = getCellId(rowIndex, columnIndex);
    const cell = useCellData(cellId);

    return (
      <div style={style}>
        <CellComponent {...cell} />
      </div>
    );
  };

  return (
    <FixedSizeGrid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={800}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={1200}
      // Overscan: render extra rows/cols outside viewport for smooth scrolling
      overscanRowCount={5}
      overscanColumnCount={3}
    >
      {Cell}
    </FixedSizeGrid>
  );
};

// 2. Memoization (prevent unnecessary re-renders)

// Memoize cell component
const Cell = memo<CellProps>(
  ({ cellId, value, format, isSelected }) => {
    // Only re-render if these props change
    return <div className="cell">{value}</div>;
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.isSelected === nextProps.isSelected &&
      shallowEqual(prevProps.format, nextProps.format)
    );
  }
);

// Memoize expensive computations
const visibleCells = useMemo(
  () => calculateVisibleCells(allCells, viewport),
  [allCells, viewport]
);

// Memoize callbacks
const handleCellClick = useCallback(
  (cellId: CellId) => {
    dispatch(selectCell(cellId));
  },
  [dispatch] // Only recreate if dispatch changes
);

// 3. React.memo vs useMemo vs useCallback
// React.memo: Memoize entire component
// useMemo: Memoize computed value
// useCallback: Memoize function

// 4. Concurrent Rendering (React 18+)
import { startTransition, useDeferredValue } from "react";

function SearchableGrid() {
  const [searchQuery, setSearchQuery] = useState("");

  // Defer non-urgent updates
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredCells = useMemo(
    () => filterCells(allCells, deferredQuery),
    [allCells, deferredQuery]
  );

  const handleSearch = (query: string) => {
    // Mark as low-priority update
    startTransition(() => {
      setSearchQuery(query);
    });
  };

  return <Grid cells={filteredCells} />;
}

// 5. Windowing for large lists
import { VariableSizeList } from "react-window";

// For rows with different heights
const VariableHeightGrid = () => {
  const rowHeights = useRef<Record<number, number>>({});

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 28; // Default 28px
  };

  const Row = ({ index, style }: ListChildComponentProps) => {
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (rowRef.current) {
        const height = rowRef.current.getBoundingClientRect().height;
        if (height !== rowHeights.current[index]) {
          rowHeights.current[index] = height;
          // Recalculate list size
          listRef.current?.resetAfterIndex(index);
        }
      }
    }, [index]);

    return (
      <div ref={rowRef} style={style}>
        {/* Row content */}
      </div>
    );
  };

  return (
    <VariableSizeList
      height={600}
      itemCount={rowCount}
      itemSize={getRowHeight}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
};
```

### 6.3 Network Optimization

```typescript
// 1. Prefetching (load data before needed)

// Prefetch adjacent cells when scrolling
const usePrefetch = () => {
  const viewport = useViewport();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch cells just outside viewport
    const prefetchRange = {
      startRow: viewport.startRow - 10,
      endRow: viewport.endRow + 10,
      startCol: viewport.startCol - 5,
      endCol: viewport.endCol + 5,
    };

    // Prefetch in background
    queryClient.prefetchQuery({
      queryKey: ["cells", prefetchRange],
      queryFn: () => fetchCells(prefetchRange),
    });
  }, [viewport, queryClient]);
};

// 2. Request deduplication
// React Query automatically deduplicates simultaneous requests

// Multiple components request same data
// Only 1 actual network request is made
const ComponentA = () => {
  const { data } = useQuery(["cells", "A1:B10"], fetchCells);
  // ...
};

const ComponentB = () => {
  const { data } = useQuery(["cells", "A1:B10"], fetchCells);
  // Same query key → reuses ComponentA's request
  // ...
};

// 3. Compression
// Request compression
axios.defaults.headers["Accept-Encoding"] = "gzip, deflate, br";

// Response compression (server-side)
// Server should enable Brotli/Gzip compression

// 4. HTTP/2 Server Push
// Server can push resources before client requests them
// (Configured on server)

// 5. Request batching (combine multiple requests)
class RequestBatcher {
  private queue: Array<{ cellId: CellId; resolve: Function }> = [];
  private timeoutId: number | null = null;

  request(cellId: CellId): Promise<Cell> {
    return new Promise((resolve) => {
      this.queue.push({ cellId, resolve });

      if (!this.timeoutId) {
        // Batch requests over 50ms window
        this.timeoutId = window.setTimeout(() => {
          this.flush();
        }, 50);
      }
    });
  }

  private async flush() {
    const batch = this.queue.splice(0, this.queue.length);
    this.timeoutId = null;

    // Single request for all cells
    const cellIds = batch.map((item) => item.cellId);
    const cells = await apiClient.getCells(cellIds);

    // Resolve individual promises
    batch.forEach((item, index) => {
      item.resolve(cells[index]);
    });
  }
}

const batcher = new RequestBatcher();

// Usage: Multiple calls batched into one request
const cell1 = await batcher.request("A1");
const cell2 = await batcher.request("A2");
const cell3 = await batcher.request("A3");
// → Single API call: GET /cells?ids=A1,A2,A3

// 6. Delta sync (only send changes)
interface DeltaUpdate {
  op: "update" | "insert" | "delete";
  cellId: CellId;
  value?: any;
}

// Send only changed cells
const delta: DeltaUpdate[] = [
  { op: "update", cellId: "A1", value: "new value" },
  { op: "delete", cellId: "B2" },
];

await apiClient.applyDelta(spreadsheetId, delta);
// vs sending entire spreadsheet (100KB+)
```

### 6.4 Image Optimization

```typescript
// For charts, screenshots, cell images

// 1. Lazy loading images
<img
  src="/chart.png"
  loading="lazy" // Browser native lazy loading
  alt="Sales Chart"
/>

// 2. Responsive images (serve different sizes)
<img
  srcSet="
    /chart-320.png 320w,
    /chart-640.png 640w,
    /chart-1280.png 1280w
  "
  sizes="(max-width: 640px) 320px, (max-width: 1280px) 640px, 1280px"
  src="/chart-640.png"
  alt="Sales Chart"
/>

// 3. WebP/AVIF with fallback
<picture>
  <source srcSet="/chart.avif" type="image/avif" />
  <source srcSet="/chart.webp" type="image/webp" />
  <img src="/chart.png" alt="Sales Chart" />
</picture>

// 4. Image compression
// Use tools like imagemin, sharp
import sharp from 'sharp';

await sharp('input.png')
  .resize(800) // Resize
  .webp({ quality: 80 }) // Convert to WebP
  .toFile('output.webp');

// 5. SVG for charts (vector graphics, small size)
// Use recharts, which renders to SVG
import { LineChart, Line, XAxis, YAxis } from 'recharts';

<LineChart width={600} height={300} data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
// SVG output is small, scalable, no quality loss
```

### 6.5 Core Web Vitals Optimization

```typescript
// 1. LCP (Largest Contentful Paint) - Target: < 2.5s
// Optimize largest element load time

// Prioritize critical resources
<link rel="preload" href="/grid.js" as="script" />
<link rel="preconnect" href="https://api.example.com" />

// Inline critical CSS
<style>
  .grid { /* critical grid styles */ }
</style>

// Defer non-critical JS
<script defer src="/analytics.js"></script>

// 2. FID (First Input Delay) - Target: < 100ms
// Reduce main thread blocking

// Code splitting (reduce initial JS parse time)
const ChartEditor = lazy(() => import('./ChartEditor'));

// Use Web Workers for heavy computation
const worker = new Worker('/formula-worker.js');
worker.postMessage({ formula: '=SUM(A1:A1000)' });
worker.onmessage = (e) => {
  const result = e.data;
  updateCell(result);
};

// Debounce expensive operations
const debouncedSearch = debounce((query) => {
  searchCells(query);
}, 300);

// 3. CLS (Cumulative Layout Shift) - Target: < 0.1
// Prevent unexpected layout shifts

// Reserve space for dynamic content
<div style={{ minHeight: '400px' }}>
  {isLoading ? <Skeleton /> : <Grid />}
</div>

// Use aspect ratio for images
<img
  src="/chart.png"
  width="800"
  height="400"
  style={{ aspectRatio: '2/1' }}
/>

// Font loading optimization
<link rel="preload" href="/fonts/roboto.woff2" as="font" type="font/woff2" crossOrigin />
<style>
  @font-face {
    font-family: 'Roboto';
    src: url('/fonts/roboto.woff2') format('woff2');
    font-display: swap; // Prevent invisible text during load
  }
</style>

// 4. INP (Interaction to Next Paint) - Target: < 200ms
// Optimize interaction responsiveness

// Use startTransition for non-urgent updates
import { startTransition } from 'react';

const handleSort = (column: string) => {
  startTransition(() => {
    // Non-urgent: sorting can be deferred
    sortData(column);
  });
};

// Debounce rapid interactions
const handleScroll = debounce((e) => {
  updateViewport(e.target.scrollTop);
}, 16); // ~60 FPS

// Measure Core Web Vitals
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
getFCP(console.log);
getTTFB(console.log);

// Send to analytics
function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  navigator.sendBeacon('/analytics', body);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

### 6.6 Memory Leak Prevention

```typescript
// Common memory leak sources and fixes

// 1. Event listeners not cleaned up
useEffect(() => {
  const handleScroll = () => {
    updateViewport();
  };

  window.addEventListener("scroll", handleScroll);

  // ✅ CLEANUP
  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

// 2. Timers not cleared
useEffect(() => {
  const intervalId = setInterval(() => {
    syncWithServer();
  }, 5000);

  // ✅ CLEANUP
  return () => {
    clearInterval(intervalId);
  };
}, []);

// 3. Subscriptions not unsubscribed
useEffect(() => {
  const unsubscribe = store.subscribe(() => {
    forceUpdate();
  });

  // ✅ CLEANUP
  return unsubscribe;
}, []);

// 4. WebSocket not closed
useEffect(() => {
  const ws = new WebSocket("wss://api.example.com/ws");

  ws.onmessage = handleMessage;

  // ✅ CLEANUP
  return () => {
    ws.close();
  };
}, []);

// 5. Large closures in callbacks
// ❌ BAD: Captures large dataset in closure
const handleClick = () => {
  // This closure captures entire dataset
  console.log(largeDataset.length);
};

// ✅ GOOD: Only capture what's needed
const datasetLength = largeDataset.length;
const handleClick = () => {
  console.log(datasetLength);
};

// 6. Detached DOM nodes
// ❌ BAD: Keeping references to removed DOM nodes
const cellRefs = useRef<Record<CellId, HTMLDivElement>>({});

// ✅ GOOD: Clean up refs when cells unmounted
useEffect(() => {
  return () => {
    delete cellRefs.current[cellId];
  };
}, [cellId]);

// 7. Memory profiling
// Use Chrome DevTools Memory profiler
// - Take heap snapshot before/after operation
// - Look for detached DOM nodes
// - Check object retention

// Measure memory usage
if (performance.memory) {
  console.log(
    "Used JS Heap:",
    performance.memory.usedJSHeapSize / 1048576,
    "MB"
  );
  console.log(
    "Total JS Heap:",
    performance.memory.totalJSHeapSize / 1048576,
    "MB"
  );
}
```

### 6.7 Performance Monitoring

```typescript
// Production performance monitoring

// 1. Performance Observer API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Send to analytics
    sendToAnalytics({
      type: entry.entryType,
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }
});

// Observe various metrics
observer.observe({
  entryTypes: ["measure", "navigation", "resource", "paint"],
});

// 2. Custom performance marks
performance.mark("cell-update-start");
updateCell(cellId, value);
performance.mark("cell-update-end");

performance.measure("cell-update", "cell-update-start", "cell-update-end");

const measure = performance.getEntriesByName("cell-update")[0];
console.log("Cell update took:", measure.duration, "ms");

// 3. Long Tasks API (detect jank)
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Task took > 50ms (blocking main thread)
    console.warn("Long task detected:", entry.duration, "ms");
    sendToAnalytics({
      type: "long-task",
      duration: entry.duration,
      attribution: entry.attribution,
    });
  }
});

longTaskObserver.observe({ entryTypes: ["longtask"] });

// 4. FPS monitoring
let lastFrameTime = performance.now();
let frameCount = 0;

function measureFPS() {
  const now = performance.now();
  frameCount++;

  if (now >= lastFrameTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastFrameTime));

    if (fps < 50) {
      console.warn("Low FPS detected:", fps);
      sendToAnalytics({ type: "low-fps", fps });
    }

    frameCount = 0;
    lastFrameTime = now;
  }

  requestAnimationFrame(measureFPS);
}

measureFPS();

// 5. Budget monitoring
const performanceBudget = {
  "bundle-main": 200 * 1024, // 200 KB
  "bundle-vendor": 150 * 1024, // 150 KB
  "initial-load": 3000, // 3s
  "time-to-interactive": 5000, // 5s
};

function checkBudget(metric: string, value: number) {
  const budget = performanceBudget[metric];

  if (budget && value > budget) {
    console.error(
      `Performance budget exceeded for ${metric}:`,
      value,
      ">",
      budget
    );
    sendToAnalytics({
      type: "budget-exceeded",
      metric,
      value,
      budget,
    });
  }
}

// 6. Real User Monitoring (RUM)
// Use services like Datadog, New Relic, or custom solution
import { datadogRum } from "@datadog/browser-rum";

datadogRum.init({
  applicationId: "xxx",
  clientToken: "xxx",
  site: "datadoghq.com",
  service: "spreadsheet-app",
  env: "production",
  version: "1.0.0",
  sampleRate: 100,
  trackInteractions: true,
  defaultPrivacyLevel: "mask-user-input",
});

// Track custom actions
datadogRum.addAction("cell-edited", {
  cellId,
  formula: hasFormula,
  duration: editDuration,
});
```

---

## 7. Error Handling & Edge Cases

### 7.1 Error Boundary Implementation

```typescript
// Error boundaries catch rendering errors in child components

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error tracking service
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Track error
    trackError(error, {
      componentStack: errorInfo.componentStack,
      ...errorInfo,
    });

    // Call optional onError callback
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo!);
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Error fallback component
const ErrorFallback: FC<{
  error: Error;
  errorInfo: ErrorInfo;
  onReset: () => void;
}> = ({ error, errorInfo, onReset }) => (
  <div className="error-fallback">
    <h1>Something went wrong</h1>
    <p>We're sorry, but something unexpected happened.</p>

    <details>
      <summary>Error details</summary>
      <pre>{error.message}</pre>
      <pre>{errorInfo.componentStack}</pre>
    </details>

    <button onClick={onReset}>Try again</button>
    <button onClick={() => window.location.reload()}>Reload page</button>
  </div>
);

// Usage: Wrap critical sections
<ErrorBoundary
  fallback={(error) => (
    <div>Failed to load grid: {error.message}</div>
  )}
  onError={(error) => {
    // Send to error tracking
    Sentry.captureException(error);
  }}
>
  <Grid />
</ErrorBoundary>

// Multiple error boundaries for isolation
<App>
  <ErrorBoundary> {/* Top-level boundary */}
    <Header />
  </ErrorBoundary>

  <ErrorBoundary> {/* Grid boundary */}
    <Grid />
  </ErrorBoundary>

  <ErrorBoundary> {/* Sidebar boundary */}
    <Sidebar />
  </ErrorBoundary>
</App>
```

### 7.2 Graceful Degradation

```typescript
// Feature detection and fallback strategies

// 1. WebSocket fallback to polling
class RealtimeConnection {
  private ws: WebSocket | null = null;
  private pollingInterval: number | null = null;

  connect(url: string) {
    if ('WebSocket' in window) {
      // Modern browsers: Use WebSocket
      this.connectWebSocket(url);
    } else {
      // Fallback: Use long polling
      this.startPolling(url);
    }
  }

  private connectWebSocket(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };

    this.ws.onerror = () => {
      // WebSocket failed, fallback to polling
      this.startPolling(url);
    };
  }

  private startPolling(url: string) {
    this.pollingInterval = window.setInterval(async () => {
      const data = await fetch(`${url}/poll`).then(r => r.json());
      this.handleMessage(data);
    }, 2000); // Poll every 2 seconds
  }

  disconnect() {
    this.ws?.close();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}

// 2. IndexedDB fallback to localStorage
class Storage {
  private db: IDBDatabase | null = null;

  async init() {
    if ('indexedDB' in window) {
      this.db = await this.openIndexedDB();
    }
    // Else: fall back to localStorage
  }

  async set(key: string, value: any) {
    if (this.db) {
      // Use IndexedDB (supports large data)
      const tx = this.db.transaction(['data'], 'readwrite');
      await tx.objectStore('data').put(value, key);
    } else {
      // Fallback: localStorage (5MB limit)
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        // Quota exceeded
        console.warn('localStorage full, data not saved');
      }
    }
  }

  async get(key: string): Promise<any> {
    if (this.db) {
      const tx = this.db.transaction(['data'], 'readonly');
      return await tx.objectStore('data').get(key);
    } else {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  }
}

// 3. CSS Grid fallback to Flexbox
// Use @supports for feature detection
.grid {
  /* Fallback: Flexbox */
  display: flex;
  flex-wrap: wrap;
}

@supports (display: grid) {
  .grid {
    /* Modern: CSS Grid */
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

// 4. Intersection Observer fallback
class VisibilityObserver {
  private observer: IntersectionObserver | null = null;
  private pollingInterval: number | null = null;

  observe(element: HTMLElement, callback: () => void) {
    if ('IntersectionObserver' in window) {
      // Modern: IntersectionObserver
      this.observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      });
      this.observer.observe(element);
    } else {
      // Fallback: Scroll event polling
      this.pollingInterval = window.setInterval(() => {
        if (this.isInViewport(element)) {
          callback();
        }
      }, 100);
    }
  }

  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  disconnect() {
    this.observer?.disconnect();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}

// 5. Canvas fallback for unsupported browsers
const Grid: FC = () => {
  const [canUseCanvas] = useState(() => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  });

  if (canUseCanvas) {
    return <CanvasGrid />; // High-performance canvas rendering
  } else {
    return <DOMGrid />; // Fallback: DOM-based grid
  }
};
```

### 7.3 Offline Support

```typescript
// Service Worker for offline functionality

// service-worker.ts
const CACHE_NAME = "spreadsheet-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/app.css",
  "/fonts/roboto.woff2",
];

// Install event: Cache static assets
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event: Serve from cache, fallback to network
self.addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Cache hit: return cached response
        if (response) {
          return response;
        }

        // Cache miss: fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache non-GET requests or error responses
          if (
            event.request.method !== "GET" ||
            !response ||
            response.status !== 200
          ) {
            return response;
          }

          // Clone response (can only be consumed once)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Network failed and no cache: show offline page
        return caches.match("/offline.html");
      })
  );
});

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      console.log("Service Worker registered:", registration);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}

// Offline indicator
const OfflineIndicator: FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <Icon name="wifi-off" />
      <span>You're offline. Changes will sync when you're back online.</span>
    </div>
  );
};

// Queue operations when offline
class OfflineQueue {
  private queue: Operation[] = [];
  private db: IDBDatabase | null = null;

  async init() {
    // Persist queue to IndexedDB
    const request = indexedDB.open("offline-queue", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore("operations", {
        keyPath: "id",
        autoIncrement: true,
      });
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      this.loadQueue();
    };
  }

  async add(operation: Operation) {
    this.queue.push(operation);

    if (this.db) {
      const tx = this.db.transaction(["operations"], "readwrite");
      await tx.objectStore("operations").add(operation);
    }
  }

  async flush() {
    if (!navigator.onLine) return;

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        await sendOperationToServer(operation);

        // Success: remove from queue
        this.queue.shift();

        if (this.db) {
          const tx = this.db.transaction(["operations"], "readwrite");
          await tx.objectStore("operations").delete(operation.id);
        }
      } catch (error) {
        // Failed: stop flushing, will retry later
        console.error("Failed to sync operation:", error);
        break;
      }
    }
  }

  private async loadQueue() {
    if (!this.db) return;

    const tx = this.db.transaction(["operations"], "readonly");
    const operations = await tx.objectStore("operations").getAll();

    this.queue = operations;
  }
}

const offlineQueue = new OfflineQueue();
offlineQueue.init();

// Sync when back online
window.addEventListener("online", () => {
  offlineQueue.flush();
});
```

### 7.4 Race Condition Prevention

```typescript
// Prevent race conditions in async operations

// 1. Request cancellation (abort previous request)
function useAbortableQuery<T>(queryFn: (signal: AbortSignal) => Promise<T>): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    // Abort previous request
    abortControllerRef.current?.abort();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn(abortControllerRef.current.signal);
      setData(result);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    fetch();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetch]);

  return { data, loading, error };
}

// Usage
const { data } = useAbortableQuery((signal) =>
  fetch("/api/cells", { signal }).then((r) => r.json())
);

// 2. Debouncing (ignore rapid-fire calls)
const debouncedSave = debounce((data) => {
  saveToServer(data);
}, 500);

// User types rapidly: only last call is executed
debouncedSave(value); // ignored
debouncedSave(value); // ignored
debouncedSave(value); // ignored
debouncedSave(value); // executed after 500ms

// 3. Throttling (limit execution rate)
const throttledScroll = throttle((scrollTop) => {
  updateViewport(scrollTop);
}, 100); // Max once per 100ms

// 4. Request ID tracking (ignore stale responses)
let requestId = 0;

async function search(query: string) {
  const currentRequestId = ++requestId;

  const results = await fetchSearchResults(query);

  // Ignore if newer request was made
  if (currentRequestId !== requestId) {
    return;
  }

  setResults(results);
}

// 5. Optimistic locking (detect concurrent modifications)
interface VersionedData {
  data: any;
  version: number;
}

async function updateWithVersionCheck(data: any, expectedVersion: number) {
  const response = await fetch("/api/update", {
    method: "POST",
    body: JSON.stringify({ data, version: expectedVersion }),
  });

  if (response.status === 409) {
    // Conflict: data was modified by someone else
    throw new ConflictError("Data has been modified. Please refresh.");
  }

  return response.json();
}

// 6. Mutex (serialize async operations)
class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();

    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const mutex = new AsyncMutex();

// Ensure only one save operation at a time
async function save(data: any) {
  await mutex.runExclusive(async () => {
    await saveToServer(data);
  });
}
```

### 7.5 Form Validation

```typescript
// Robust form validation for cell editing, data validation rules

// 1. Cell value validation
interface ValidationRule {
  type: "number" | "text" | "date" | "email" | "url" | "custom";
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  message: string;
}

class CellValidator {
  validate(value: any, rules: ValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const error = this.validateRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  private validateRule(
    value: any,
    rule: ValidationRule
  ): ValidationError | null {
    // Required check
    if (
      rule.required &&
      (value === null || value === undefined || value === "")
    ) {
      return { field: "value", message: "This field is required" };
    }

    // Type checks
    switch (rule.type) {
      case "number":
        if (isNaN(Number(value))) {
          return { field: "value", message: "Must be a number" };
        }

        if (rule.min !== undefined && Number(value) < rule.min) {
          return { field: "value", message: `Must be at least ${rule.min}` };
        }

        if (rule.max !== undefined && Number(value) > rule.max) {
          return { field: "value", message: `Must be at most ${rule.max}` };
        }
        break;

      case "date":
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { field: "value", message: "Must be a valid date" };
        }
        break;

      case "email":
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return { field: "value", message: "Must be a valid email" };
        }
        break;

      case "url":
        try {
          new URL(value);
        } catch {
          return { field: "value", message: "Must be a valid URL" };
        }
        break;

      case "custom":
        if (rule.customValidator && !rule.customValidator(value)) {
          return { field: "value", message: rule.message };
        }
        break;
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(String(value))) {
      return { field: "value", message: rule.message };
    }

    return null;
  }
}

// Usage
const validator = new CellValidator();

const rules: ValidationRule[] = [
  {
    type: "number",
    required: true,
    min: 0,
    max: 100,
    message: "Must be 0-100",
  },
];

const errors = validator.validate(cellValue, rules);

if (errors.length > 0) {
  // Show validation errors
  showValidationErrors(errors);
} else {
  // Save cell
  updateCell(cellId, cellValue);
}

// 2. Form-level validation (for complex dialogs)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod schema
const shareFormSchema = z.object({
  email: z.string().email("Must be a valid email"),
  permission: z.enum(["view", "comment", "edit"]),
  message: z.string().max(500, "Message too long").optional(),
});

type ShareFormData = z.infer<typeof shareFormSchema>;

const ShareDialog: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
  });

  const onSubmit = async (data: ShareFormData) => {
    await shareSpreadsheet(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <select {...register("permission")}>
        <option value="view">View</option>
        <option value="comment">Comment</option>
        <option value="edit">Edit</option>
      </select>

      <textarea {...register("message")} />

      <button type="submit">Share</button>
    </form>
  );
};
```

---

## 8. Testing Strategy

### 8.1 Unit Testing

```typescript
// Unit tests for individual functions, utilities, hooks

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react-hooks";

// 1. Testing utility functions
describe("formatCellValue", () => {
  it("formats numbers with thousand separators", () => {
    expect(formatCellValue(1000, { numberFormat: "number" })).toBe("1,000");
    expect(formatCellValue(1000000, { numberFormat: "number" })).toBe(
      "1,000,000"
    );
  });

  it("formats currency", () => {
    expect(formatCellValue(99.99, { numberFormat: "currency" })).toBe("$99.99");
  });

  it("formats percentages", () => {
    expect(formatCellValue(0.5, { numberFormat: "percent" })).toBe("50%");
  });

  it("formats dates", () => {
    const date = new Date("2024-01-15");
    expect(formatCellValue(date, { numberFormat: "date" })).toBe("01/15/2024");
  });
});

// 2. Testing React components
describe("Cell", () => {
  it("renders cell value", () => {
    render(<Cell cellId="A1" value="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies formatting", () => {
    const format: CellFormat = {
      fontWeight: "bold",
      textColor: "#ff0000",
    };

    render(<Cell cellId="A1" value="Test" format={format} />);

    const cell = screen.getByText("Test");
    expect(cell).toHaveStyle({ fontWeight: "bold", color: "#ff0000" });
  });

  it("calls onClick when clicked", async () => {
    const handleClick = jest.fn();

    render(<Cell cellId="A1" value="Test" onClick={handleClick} />);

    await userEvent.click(screen.getByText("Test"));

    expect(handleClick).toHaveBeenCalledWith("A1");
  });

  it("shows editor on double-click", async () => {
    render(<Cell cellId="A1" value="Test" />);

    await userEvent.dblClick(screen.getByText("Test"));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

// 3. Testing custom hooks
describe("useSelection", () => {
  it("initializes with no selection", () => {
    const { result } = renderHook(() => useSelection());

    expect(result.current.selection).toBeNull();
  });

  it("updates selection", () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.select({ start: "A1", end: "B2" });
    });

    expect(result.current.selection).toEqual({ start: "A1", end: "B2" });
  });

  it("clears selection", () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.select({ start: "A1", end: "B2" });
      result.current.clear();
    });

    expect(result.current.selection).toBeNull();
  });
});

// 4. Testing async operations
describe("updateCell", () => {
  it("updates cell value", async () => {
    const mockApiClient = {
      updateCells: jest
        .fn()
        .mockResolvedValue([{ id: "A1", value: "new value" }]),
    };

    await updateCell("A1", "new value", mockApiClient);

    expect(mockApiClient.updateCells).toHaveBeenCalledWith([
      { cellId: "A1", value: "new value" },
    ]);
  });

  it("handles errors", async () => {
    const mockApiClient = {
      updateCells: jest.fn().mockRejectedValue(new Error("Network error")),
    };

    await expect(updateCell("A1", "new value", mockApiClient)).rejects.toThrow(
      "Network error"
    );
  });
});

// 5. Testing state management (Zustand)
describe("spreadsheet store", () => {
  beforeEach(() => {
    // Reset store before each test
    useSpreadsheetStore.setState(initialState);
  });

  it("updates cell value", () => {
    const { result } = renderHook(() => useSpreadsheetStore());

    act(() => {
      result.current.actions.updateCell("A1", { value: "new value" });
    });

    const cell = result.current.cells["sheet1"].byId["A1"];
    expect(cell.value).toBe("new value");
  });

  it("recalculates formulas when dependency changes", () => {
    const { result } = renderHook(() => useSpreadsheetStore());

    // B1 = "=A1*2"
    act(() => {
      result.current.actions.updateCell("A1", { value: 10 });
      result.current.actions.updateCell("B1", { formula: "=A1*2" });
    });

    expect(result.current.cells["sheet1"].byId["B1"].value).toBe(20);

    // Update A1, B1 should recalculate
    act(() => {
      result.current.actions.updateCell("A1", { value: 15 });
    });

    expect(result.current.cells["sheet1"].byId["B1"].value).toBe(30);
  });
});
```

### 8.2 Integration Testing

```typescript
// Integration tests for multiple components working together

describe("Grid Integration", () => {
  it("renders grid with cells", async () => {
    const mockData = {
      cells: [
        { id: "A1", row: 0, col: 0, value: "Hello" },
        { id: "B1", row: 0, col: 1, value: "World" },
      ],
    };

    render(<GridContainer sheetId="sheet1" data={mockData} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("updates cell when edited", async () => {
    const mockUpdateCell = jest.fn();

    render(<GridContainer sheetId="sheet1" onUpdateCell={mockUpdateCell} />);

    // Double-click cell to edit
    const cell = screen.getByTestId("cell-A1");
    await userEvent.dblClick(cell);

    // Type new value
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New Value");
    await userEvent.keyboard("{Enter}");

    expect(mockUpdateCell).toHaveBeenCalledWith("A1", "New Value");
  });

  it("handles selection", async () => {
    render(<GridContainer sheetId="sheet1" />);

    // Click cell A1
    await userEvent.click(screen.getByTestId("cell-A1"));

    expect(screen.getByTestId("cell-A1")).toHaveClass("selected");

    // Shift-click cell B2 to select range
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(screen.getByTestId("cell-B2"));
    await userEvent.keyboard("{/Shift}");

    // All cells in range should be selected
    expect(screen.getByTestId("cell-A1")).toHaveClass("selected");
    expect(screen.getByTestId("cell-A2")).toHaveClass("selected");
    expect(screen.getByTestId("cell-B1")).toHaveClass("selected");
    expect(screen.getByTestId("cell-B2")).toHaveClass("selected");
  });
});

// Test collaboration features
describe("Collaboration Integration", () => {
  it("shows collaborator cursors", async () => {
    const mockWs = new MockWebSocket();

    render(
      <CollaborationProvider ws={mockWs}>
        <GridContainer sheetId="sheet1" />
      </CollaborationProvider>
    );

    // Simulate remote user cursor move
    act(() => {
      mockWs.emit("cursor-move", {
        userId: "user2",
        userName: "Alice",
        cellId: "B3",
        color: "#ff0000",
      });
    });

    await waitFor(() => {
      const cursor = screen.getByTestId("cursor-user2");
      expect(cursor).toBeInTheDocument();
      expect(cursor).toHaveTextContent("Alice");
    });
  });

  it("applies remote edits", async () => {
    const mockWs = new MockWebSocket();

    render(
      <CollaborationProvider ws={mockWs}>
        <GridContainer sheetId="sheet1" />
      </CollaborationProvider>
    );

    // Simulate remote edit
    act(() => {
      mockWs.emit("operation", {
        type: "UPDATE_CELL",
        cellId: "A1",
        value: "Remote Edit",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Remote Edit")).toBeInTheDocument();
    });
  });
});
```

### 8.3 E2E Testing (Playwright)

```typescript
// End-to-end tests simulating real user workflows

import { test, expect } from "@playwright/test";

test.describe("Spreadsheet E2E", () => {
  test("create and edit spreadsheet", async ({ page }) => {
    // Navigate to app
    await page.goto("http://localhost:3000");

    // Create new spreadsheet
    await page.click("text=New Spreadsheet");

    // Wait for grid to load
    await expect(page.locator('[data-testid="grid"]')).toBeVisible();

    // Click cell A1
    await page.click('[data-cell-id="A1"]');

    // Type value
    await page.keyboard.type("Hello");
    await page.keyboard.press("Enter");

    // Verify value saved
    await expect(page.locator('[data-cell-id="A1"]')).toHaveText("Hello");

    // Enter formula in B1
    await page.click('[data-cell-id="B1"]');
    await page.keyboard.type('=A1&" World"');
    await page.keyboard.press("Enter");

    // Verify formula calculated
    await expect(page.locator('[data-cell-id="B1"]')).toHaveText("Hello World");
  });

  test("collaboration workflow", async ({ browser }) => {
    // Open 2 browser contexts (simulate 2 users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both users open same spreadsheet
    await page1.goto("http://localhost:3000/sheets/123");
    await page2.goto("http://localhost:3000/sheets/123");

    // User 1 edits cell
    await page1.click('[data-cell-id="A1"]');
    await page1.keyboard.type("User 1");
    await page1.keyboard.press("Enter");

    // User 2 should see the edit
    await expect(page2.locator('[data-cell-id="A1"]')).toHaveText("User 1", {
      timeout: 5000, // Wait up to 5s for real-time sync
    });

    // User 2's cursor should be visible to User 1
    await page2.click('[data-cell-id="B2"]');
    await expect(page1.locator('[data-testid="cursor-user2"]')).toBeVisible();
  });

  test("offline functionality", async ({ page, context }) => {
    await page.goto("http://localhost:3000/sheets/123");

    // Go offline
    await context.setOffline(true);

    // Edit cell while offline
    await page.click('[data-cell-id="A1"]');
    await page.keyboard.type("Offline Edit");
    await page.keyboard.press("Enter");

    // Verify offline indicator shows
    await expect(page.locator(".offline-banner")).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Verify sync occurs
    await expect(page.locator(".offline-banner")).not.toBeVisible();

    // Verify edit was synced (should persist after refresh)
    await page.reload();
    await expect(page.locator('[data-cell-id="A1"]')).toHaveText(
      "Offline Edit"
    );
  });

  test("performance with large dataset", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/large");

    // Measure initial load time
    const loadStart = Date.now();
    await page.waitForSelector('[data-testid="grid"]');
    const loadTime = Date.now() - loadStart;

    expect(loadTime).toBeLessThan(3000); // < 3s load time

    // Measure scroll performance
    const scrollFPS = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function measureFrame() {
          frameCount++;

          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(measureFrame);
          } else {
            resolve(frameCount);
          }
        }

        // Start scrolling
        const grid = document.querySelector('[data-testid="grid"]');
        grid.scrollTop = 0;

        const interval = setInterval(() => {
          grid.scrollTop += 50;
          if (grid.scrollTop >= 10000) {
            clearInterval(interval);
          }
        }, 16);

        requestAnimationFrame(measureFrame);
      });
    });

    expect(scrollFPS).toBeGreaterThan(50); // > 50 FPS while scrolling
  });
});
```

### 8.4 Visual Regression Testing

```typescript
// Visual regression tests to catch UI changes

import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("grid appearance", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Wait for grid to render
    await page.waitForSelector('[data-testid="grid"]');

    // Take screenshot
    await expect(page).toHaveScreenshot("grid-default.png", {
      maxDiffPixels: 100, // Allow minor differences
    });
  });

  test("cell selection", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Select range A1:C3
    await page.click('[data-cell-id="A1"]');
    await page.keyboard.down("Shift");
    await page.click('[data-cell-id="C3"]');
    await page.keyboard.up("Shift");

    // Screenshot selection highlight
    await expect(page.locator('[data-testid="grid"]')).toHaveScreenshot(
      "selection.png"
    );
  });

  test("toolbar appearance", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    await expect(page.locator('[data-testid="toolbar"]')).toHaveScreenshot(
      "toolbar.png"
    );
  });

  test("dark mode", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');

    // Wait for theme transition
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("dark-mode.png");
  });
});
```

### 8.5 Performance Testing

```typescript
// Performance benchmarks and load testing

import { test, expect } from "@playwright/test";

test.describe("Performance Benchmarks", () => {
  test("bundle size", async ({ page }) => {
    const bundles = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.endsWith(".js"))
        .map((entry) => ({
          name: entry.name,
          size: entry.transferSize,
        }));
    });

    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);

    // Total JS should be < 500KB
    expect(totalSize).toBeLessThan(500 * 1024);
  });

  test("time to interactive", async ({ page }) => {
    const start = Date.now();

    await page.goto("http://localhost:3000/sheets/test");

    // Wait for page to be interactive
    await page.waitForLoadState("networkidle");

    const tti = Date.now() - start;

    // TTI should be < 3s
    expect(tti).toBeLessThan(3000);
  });

  test("cell render performance", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Measure time to render 1000 cells
    const renderTime = await page.evaluate(() => {
      const start = performance.now();

      // Trigger re-render of all visible cells
      const event = new Event("resize");
      window.dispatchEvent(event);

      return performance.now() - start;
    });

    // Should render in < 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test("formula calculation performance", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Create formula with 100 dependencies
    await page.evaluate(() => {
      // A1:A100 = 1
      for (let i = 1; i <= 100; i++) {
        window.spreadsheet.updateCell(`A${i}`, { value: 1 });
      }

      // B1 = SUM(A1:A100)
      window.spreadsheet.updateCell("B1", { formula: "=SUM(A1:A100)" });
    });

    // Measure recalculation time when A1 changes
    const calcTime = await page.evaluate(() => {
      const start = performance.now();

      window.spreadsheet.updateCell("A1", { value: 2 });

      return performance.now() - start;
    });

    // Should recalculate in < 50ms
    expect(calcTime).toBeLessThan(50);
  });
});
```

### 8.6 Accessibility Testing

```typescript
// Accessibility tests (WCAG 2.1 compliance)

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("no accessibility violations", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test("keyboard navigation", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Tab to first cell
    await page.keyboard.press("Tab");

    let focusedCell = await page.evaluate(() => {
      return document.activeElement?.getAttribute("data-cell-id");
    });
    expect(focusedCell).toBe("A1");

    // Arrow keys move focus
    await page.keyboard.press("ArrowRight");
    focusedCell = await page.evaluate(() => {
      return document.activeElement?.getAttribute("data-cell-id");
    });
    expect(focusedCell).toBe("B1");

    await page.keyboard.press("ArrowDown");
    focusedCell = await page.evaluate(() => {
      return document.activeElement?.getAttribute("data-cell-id");
    });
    expect(focusedCell).toBe("B2");
  });

  test("screen reader support", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Check for ARIA labels
    const cell = page.locator('[data-cell-id="A1"]');
    await expect(cell).toHaveAttribute("role", "gridcell");
    await expect(cell).toHaveAttribute("aria-label");

    // Check for live regions (for formula bar updates)
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toHaveAttribute("aria-live", "polite");
  });

  test("color contrast", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    // Run contrast check
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("focus indicators", async ({ page }) => {
    await page.goto("http://localhost:3000/sheets/test");

    await page.keyboard.press("Tab");

    // Check for visible focus indicator
    const focusedElement = page.locator(":focus");
    const outline = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });

    expect(outline).not.toBe("none");
  });
});
```

---

## 9. Security Considerations

### 9.1 XSS Prevention

```typescript
// Cross-Site Scripting (XSS) prevention strategies

// 1. Input sanitization (sanitize user-provided HTML)
import DOMPurify from 'dompurify';

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em'],
    ALLOWED_ATTR: [],
  });
}

// Usage: Sanitize before rendering
const userInput = '<script>alert("XSS")</script><b>Bold text</b>';
const safe = sanitizeHTML(userInput);
// Result: "<b>Bold text</b>" (script removed)

// 2. React automatically escapes values
// ✅ SAFE: React escapes by default
<div>{userInput}</div>

// ❌ DANGEROUS: dangerouslySetInnerHTML bypasses escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE: Sanitize before using dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />

// 3. Formula injection prevention
function sanitizeFormula(formula: string): string {
  // Remove potential CSV injection attempts
  // =cmd|'/c calc'!A1 (Excel formula injection)

  if (formula.startsWith('=')) {
    // Only allow safe formula functions
    const allowedFunctions = ['SUM', 'AVERAGE', 'IF', 'VLOOKUP', /* ... */];
    const functionPattern = new RegExp(`^=(${allowedFunctions.join('|')})\\(`, 'i');

    if (!functionPattern.test(formula)) {
      throw new Error('Unsafe formula function');
    }
  }

  return formula;
}

// 4. Content Security Policy (CSP)
// Set via HTTP headers or meta tag
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.example.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' wss://api.example.com https://api.example.com;
    frame-ancestors 'none';
  "
/>

// 5. Avoid eval() and Function() constructor
// ❌ DANGEROUS: eval executes arbitrary code
eval(userInput);

// ✅ SAFE: Use a safe formula parser
import FormulaParser from 'hot-formula-parser';
const parser = new FormulaParser();
const result = parser.parse(formula);
```

### 9.2 CSRF Protection

```typescript
// Cross-Site Request Forgery (CSRF) prevention

// 1. CSRF token in requests
const apiClient = axios.create({
  baseURL: "https://api.example.com",
});

// Add CSRF token to all requests
apiClient.interceptors.request.use((config) => {
  const csrfToken = document.querySelector<HTMLMetaElement>(
    'meta[name="csrf-token"]'
  )?.content;

  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

// Server validates CSRF token
// (Backend implementation)
app.use((req, res, next) => {
  const token = req.headers["x-csrf-token"];
  const sessionToken = req.session.csrfToken;

  if (token !== sessionToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
});

// 2. SameSite cookies
// Set cookies with SameSite=Strict or SameSite=Lax
document.cookie = "auth=token123; SameSite=Strict; Secure; HttpOnly";

// 3. Check Referer header (defense in depth)
// Server-side
app.use((req, res, next) => {
  const referer = req.headers.referer;

  if (referer && !referer.startsWith("https://example.com")) {
    return res.status(403).json({ error: "Invalid referer" });
  }

  next();
});

// 4. Double-submit cookies
// Send CSRF token in both cookie and request header
// Server verifies they match
```

### 9.3 Secure Storage

```typescript
// Securely store sensitive data (tokens, user info)

// 1. Token storage (JWT, access tokens)
class SecureStorage {
  // ❌ BAD: localStorage (accessible to XSS)
  static setTokenLocalStorage(token: string) {
    localStorage.setItem("token", token);
  }

  // ✅ GOOD: httpOnly cookies (not accessible to JS)
  // Set via server response
  // Set-Cookie: token=xyz; HttpOnly; Secure; SameSite=Strict

  // For tokens that must be accessible to JS (e.g., for API calls):
  // Store in memory (lost on refresh) + use refresh token in httpOnly cookie

  private static tokenCache: string | null = null;

  static setToken(token: string) {
    this.tokenCache = token;
    // Don't store in localStorage or sessionStorage
  }

  static getToken(): string | null {
    return this.tokenCache;
  }

  static clearToken() {
    this.tokenCache = null;
  }
}

// 2. Encrypt sensitive data before storing
import CryptoJS from "crypto-js";

function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

function decryptData(ciphertext: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Usage
const sensitiveData = JSON.stringify({
  userId: 123,
  email: "user@example.com",
});
const encrypted = encryptData(sensitiveData, userPassword);

// Store encrypted data
localStorage.setItem("userData", encrypted);

// Retrieve and decrypt
const stored = localStorage.getItem("userData");
if (stored) {
  const decrypted = decryptData(stored, userPassword);
  const data = JSON.parse(decrypted);
}

// 3. IndexedDB for larger data (still vulnerable to XSS)
// Only store non-sensitive data
const db = await openDB("spreadsheet-cache", 1);
await db.put("spreadsheets", { id: 123, name: "My Sheet" });

// 4. Clear storage on logout
function logout() {
  SecureStorage.clearToken();
  localStorage.clear();
  sessionStorage.clear();

  // Clear IndexedDB
  indexedDB.deleteDatabase("spreadsheet-cache");

  // Clear cookies
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}
```

### 9.4 Input Sanitization

```typescript
// Sanitize and validate all user inputs

// 1. Cell value sanitization
function sanitizeCellValue(value: any): any {
  if (typeof value === "string") {
    // Remove null bytes
    value = value.replace(/\0/g, "");

    // Limit length
    if (value.length > 32000) {
      value = value.slice(0, 32000);
    }

    // Detect and prevent formula injection in CSV export
    if (/^[=+\-@]/.test(value)) {
      // Prefix with single quote to neutralize
      value = `'${value}`;
    }
  }

  return value;
}

// 2. URL validation
function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Optionally: whitelist domains
    const allowedDomains = ["example.com", "cdn.example.com"];
    if (!allowedDomains.some((domain) => parsed.hostname.endsWith(domain))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// 3. Email validation
function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!pattern.test(email)) {
    return false;
  }

  // Additional checks
  const [local, domain] = email.split("@");

  if (local.length > 64 || domain.length > 255) {
    return false;
  }

  return true;
}

// 4. SQL injection prevention (if using raw SQL)
// ✅ ALWAYS use parameterized queries
const query = "SELECT * FROM cells WHERE sheet_id = ? AND cell_id = ?";
const params = [sheetId, cellId];

// ❌ NEVER concatenate user input into SQL
const badQuery = `SELECT * FROM cells WHERE sheet_id = '${sheetId}'`; // VULNERABLE!

// 5. NoSQL injection prevention (MongoDB)
// ✅ Use Mongoose schema validation
const cellSchema = new Schema({
  value: {
    type: String,
    validate: {
      validator: (v: string) => v.length <= 32000,
      message: "Value too long",
    },
  },
});

// ❌ Avoid query object injection
const badQuery = { sheetId: req.body.sheetId }; // If body = { sheetId: { $ne: null } }

// ✅ Explicitly specify query structure
const safeQuery = { sheetId: String(req.body.sheetId) };
```

### 9.5 Authentication & Authorization

```typescript
// Secure authentication and authorization

// 1. JWT authentication
interface JWTPayload {
  userId: string;
  email: string;
  exp: number; // Expiration timestamp
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));

    // Verify not expired
    if (payload.exp * 1000 < Date.now()) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}

// 2. Permission checks
enum Permission {
  VIEW = "view",
  COMMENT = "comment",
  EDIT = "edit",
  ADMIN = "admin",
}

interface SpreadsheetPermissions {
  userId: string;
  permission: Permission;
}

function hasPermission(
  user: User,
  spreadsheet: Spreadsheet,
  requiredPermission: Permission
): boolean {
  // Owner has all permissions
  if (spreadsheet.ownerId === user.id) {
    return true;
  }

  // Check explicit permissions
  const userPermission = spreadsheet.permissions.find(
    (p) => p.userId === user.id
  );

  if (!userPermission) {
    return false;
  }

  // Permission hierarchy: admin > edit > comment > view
  const hierarchy = [
    Permission.VIEW,
    Permission.COMMENT,
    Permission.EDIT,
    Permission.ADMIN,
  ];

  const userLevel = hierarchy.indexOf(userPermission.permission);
  const requiredLevel = hierarchy.indexOf(requiredPermission);

  return userLevel >= requiredLevel;
}

// Usage
if (!hasPermission(currentUser, spreadsheet, Permission.EDIT)) {
  throw new PermissionError(
    "You do not have permission to edit this spreadsheet"
  );
}

// 3. Rate limiting (prevent abuse)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(userId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside window
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);

    return true;
  }
}

const rateLimiter = new RateLimiter();

// Check before processing request
if (!rateLimiter.isAllowed(userId, 100, 60000)) {
  throw new RateLimitError("Too many requests. Please try again later.");
}

// 4. Secure session management
class SessionManager {
  private sessions: Map<string, Session> = new Map();

  create(userId: string): string {
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return sessionId;
  }

  validate(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
```

---

## 10. Interview Cross-Questions

### Q1: How would you optimize rendering performance for a spreadsheet with 1 million cells?

**Answer:**
The key is **virtualization** - only render what's visible. Here's the approach:

1. **Virtual Scrolling**: Use `react-window` or `react-virtualized` to render only visible rows/columns

   - For a 1M cell sheet (1000×1000), if viewport shows 20×10 cells, render only 200 cells
   - Use `overscan` to pre-render a few extra rows/cols for smooth scrolling

2. **Cell Memoization**: Wrap cells in `React.memo` with custom equality check

   ```typescript
   const Cell = memo(
     ({ value, format }) => <div>{value}</div>,
     (prev, next) =>
       prev.value === next.value && shallowEqual(prev.format, next.format)
   );
   ```

3. **Lazy Rendering**: Don't mount cells until they scroll into view

   - Use Intersection Observer to detect when cells enter viewport

4. **Canvas Rendering**: For very large sheets, render grid to `<canvas>` instead of DOM

   - Single canvas element vs 1M DOM nodes
   - Trade-off: Lose DOM features (accessibility, text selection)

5. **Data Windowing**: Keep only visible + buffer data in memory

   - Load additional data on-demand as user scrolls

6. **Debounced Scroll**: Update viewport state with `requestAnimationFrame`
   ```typescript
   const handleScroll = useCallback(() => {
     rafRef.current = requestAnimationFrame(() => {
       updateViewport(container.scrollTop, container.scrollLeft);
     });
   }, []);
   ```

**Performance Metrics Achieved:**

- Initial render: <2s
- Scroll FPS: 60
- Memory usage: ~100MB (vs 5GB+ for full DOM)

---

### Q2: How do you handle concurrent edits from multiple users (Operational Transform vs CRDT)?

**Answer:**

**Operational Transform (OT)**:

- Transform operations to preserve intent when applied in different orders
- Example: User A inserts "x" at position 2, User B deletes character at position 3
  - Without OT: conflicts
  - With OT: transform B's operation to account for A's insertion

**Implementation:**

```typescript
function transformOperation(op1: Operation, op2: Operation): Operation {
  if (op1.type === "insert" && op2.type === "delete") {
    if (op2.position >= op1.position) {
      return { ...op2, position: op2.position + op1.length };
    }
  }
  return op2;
}
```

**CRDT (Conflict-free Replicated Data Types)**:

- Data structures that converge automatically without coordination
- Example: Each character has globally unique ID
  - Concurrent edits don't conflict because they operate on different IDs

**Trade-offs:**

| Aspect                | OT                                        | CRDT                            |
| --------------------- | ----------------------------------------- | ------------------------------- |
| **Complexity**        | High (must transform all operation pairs) | Medium                          |
| **Server dependency** | Required (central authority)              | Optional (P2P possible)         |
| **Memory**            | Lower                                     | Higher (metadata per character) |
| **Performance**       | Better for small edits                    | Better for offline/poor network |

**Choice for Spreadsheets**: **OT**

- Reasons:
  1. Cell-based editing (coarser granularity than text)
  2. Central server already required (permissions, storage)
  3. Lower memory overhead
  4. Google Sheets uses OT successfully

**Conflict Resolution Example:**

```typescript
// User A: Update cell A1 = "10"
// User B: Update cell A1 = "20" (concurrent)

// Server receives both operations:
1. Apply A's operation: A1 = "10"
2. Transform B's operation against A's:
   - B's timestamp > A's timestamp → B wins
   - Result: A1 = "20"
3. Broadcast to all clients: "A1 updated to 20"
4. Client A sees: A1 changes from "10" → "20" (reconciliation)
```

---

### Q3: How would you implement undo/redo for a collaborative spreadsheet?

**Answer:**

**Challenge**: In collaborative editing, each user has their own undo/redo stack, but operations from other users can affect your operations.

**Approach: Per-User Operation History**

```typescript
interface HistoryState {
  past: Operation[][]; // Stack of operation batches
  future: Operation[][]; // Redo stack
}

const userHistories = new Map<UserId, HistoryState>();

// When user makes edit
function executeCommand(userId: UserId, operations: Operation[]) {
  // 1. Apply operations
  operations.forEach((op) => applyOperation(op));

  // 2. Add to user's history
  const history = userHistories.get(userId);
  history.past.push(operations);
  history.future = []; // Clear redo stack

  // 3. Broadcast to other users
  broadcast({ type: "OPERATIONS", operations, userId });
}

// When user clicks undo
function undo(userId: UserId) {
  const history = userHistories.get(userId);

  if (history.past.length === 0) return;

  const operations = history.past.pop();
  history.future.push(operations);

  // Generate inverse operations
  const inverseOps = operations.reverse().map((op) => invertOperation(op));

  // Apply inverse
  inverseOps.forEach((op) => applyOperation(op));

  // Broadcast
  broadcast({ type: "OPERATIONS", operations: inverseOps, userId });
}

// Invert operation
function invertOperation(op: Operation): Operation {
  switch (op.type) {
    case "UPDATE_CELL":
      return {
        type: "UPDATE_CELL",
        cellId: op.cellId,
        value: op.previousValue, // Swap current/previous
        previousValue: op.value,
      };
    case "INSERT_ROW":
      return { type: "DELETE_ROW", rowIndex: op.rowIndex };
    case "DELETE_ROW":
      return {
        type: "INSERT_ROW",
        rowIndex: op.rowIndex,
        data: op.deletedData,
      };
  }
}
```

**Edge Cases:**

1. **User A undoes, but User B's operation depended on A's**
   - Solution: Mark dependent operations as "orphaned", show warning
2. **User A undoes cell update, but User B deleted that row**

   - Solution: Undo fails gracefully, show "Cannot undo: row deleted by User B"

3. **Undo limit**
   - Keep last 100 operations per user to prevent memory issues

**Google Sheets Approach:**

- Per-user undo/redo (not global)
- Undo only your own operations
- If your operation affected others' work, warn before undo

---

### Q4: How do you implement a formula calculation engine that handles circular dependencies?

**Answer:**

**Approach: Dependency Graph + Topological Sort + Cycle Detection**

```typescript
interface FormulaGraph {
  dependencies: Map<CellId, Set<CellId>>; // Cell -> cells it depends on
  dependents: Map<CellId, Set<CellId>>; // Cell -> cells that depend on it
}

class FormulaEngine {
  private graph: FormulaGraph = {
    dependencies: new Map(),
    dependents: new Map(),
  };

  // 1. Update formula and rebuild dependencies
  setFormula(cellId: CellId, formula: string) {
    // Parse formula to extract cell references
    const refs = this.parseReferences(formula);

    // Update dependency graph
    this.graph.dependencies.set(cellId, refs);

    refs.forEach((ref) => {
      if (!this.graph.dependents.has(ref)) {
        this.graph.dependents.set(ref, new Set());
      }
      this.graph.dependents.get(ref).add(cellId);
    });

    // Check for circular dependencies
    if (this.hasCircularDependency(cellId)) {
      throw new Error("#CIRCULAR_REF");
    }

    // Recalculate affected cells
    this.recalculate(cellId);
  }

  // 2. Detect circular dependencies (DFS)
  private hasCircularDependency(startCell: CellId): boolean {
    const visited = new Set<CellId>();
    const stack = new Set<CellId>();

    const dfs = (cellId: CellId): boolean => {
      if (stack.has(cellId)) return true; // Cycle detected
      if (visited.has(cellId)) return false;

      visited.add(cellId);
      stack.add(cellId);

      const deps = this.graph.dependencies.get(cellId) || new Set();
      for (const dep of deps) {
        if (dfs(dep)) return true;
      }

      stack.delete(cellId);
      return false;
    };

    return dfs(startCell);
  }

  // 3. Calculate in correct order (topological sort)
  private recalculate(changedCell: CellId) {
    // Get all dependent cells (BFS)
    const toRecalc = this.getAllDependents(changedCell);

    // Topological sort (calculation order)
    const order = this.topologicalSort([changedCell, ...toRecalc]);

    // Calculate in order
    order.forEach((cellId) => {
      const formula = this.getFormula(cellId);
      const value = this.evaluateFormula(formula);
      this.setCellValue(cellId, value);
    });
  }

  // 4. Topological sort (Kahn's algorithm)
  private topologicalSort(cells: CellId[]): CellId[] {
    const inDegree = new Map<CellId, number>();
    const queue: CellId[] = [];
    const result: CellId[] = [];

    // Calculate in-degrees
    cells.forEach((cellId) => {
      const deps = this.graph.dependencies.get(cellId) || new Set();
      inDegree.set(cellId, deps.size);
      if (deps.size === 0) queue.push(cellId);
    });

    // Process queue
    while (queue.length > 0) {
      const cellId = queue.shift()!;
      result.push(cellId);

      const dependents = this.graph.dependents.get(cellId) || new Set();
      dependents.forEach((dependent) => {
        const degree = inDegree.get(dependent)! - 1;
        inDegree.set(dependent, degree);
        if (degree === 0) queue.push(dependent);
      });
    }

    return result;
  }

  // 5. Parse formula references
  private parseReferences(formula: string): Set<CellId> {
    const refs = new Set<CellId>();

    // Match A1-style references
    const pattern = /\b([A-Z]+\d+)\b/g;
    let match;

    while ((match = pattern.exec(formula)) !== null) {
      refs.add(match[1]);
    }

    // Match range references (A1:B10)
    const rangePattern = /\b([A-Z]+\d+):([A-Z]+\d+)\b/g;
    while ((match = rangePattern.exec(formula)) !== null) {
      const range = this.expandRange(match[1], match[2]);
      range.forEach((cell) => refs.add(cell));
    }

    return refs;
  }
}
```

**Circular Reference Handling:**

```typescript
// Example: A1 = B1, B1 = C1, C1 = A1 (circular)

// Detection:
hasCircularDependency('A1') → true

// Error display:
setCellValue('A1', '#CIRCULAR_REF');
setCellValue('B1', '#CIRCULAR_REF');
setCellValue('C1', '#CIRCULAR_REF');
```

**Performance Optimization:**

- **Incremental Recalculation**: Only recalculate affected cells
- **Lazy Evaluation**: Don't calculate off-screen cells until visible
- **Memoization**: Cache formula results, invalidate on dependency change

---

### Q5: How would you implement real-time cursor/selection synchronization across clients?

**Answer:**

**Architecture:**

1. **WebSocket for low-latency updates** (not HTTP polling)
2. **Throttle cursor position broadcasts** (30-60 FPS max)
3. **Predictive positioning** (smooth interpolation)

**Implementation:**

```typescript
// Client-side
class CursorSync {
  private ws: WebSocket;
  private localCursor: CellId;
  private remoteCursors: Map<UserId, CursorPosition> = new Map();
  private throttledSend: Function;

  constructor(ws: WebSocket) {
    this.ws = ws;

    // Throttle cursor updates (max 30/sec = ~30ms)
    this.throttledSend = throttle((position: CellId) => {
      this.ws.send(
        JSON.stringify({
          type: "CURSOR_MOVE",
          cellId: position,
          timestamp: Date.now(),
        })
      );
    }, 33);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "CURSOR_MOVE") {
        this.handleRemoteCursorMove(msg);
      }
    };
  }

  // Local cursor moved
  moveCursor(cellId: CellId) {
    this.localCursor = cellId;
    this.throttledSend(cellId);
  }

  // Remote cursor moved
  handleRemoteCursorMove(msg: CursorMoveMessage) {
    const { userId, cellId, timestamp } = msg;

    // Interpolate for smooth movement (if old position exists)
    const oldPos = this.remoteCursors.get(userId);

    if (oldPos) {
      this.animateCursor(userId, oldPos.cellId, cellId);
    } else {
      this.setCursor(userId, cellId);
    }

    this.remoteCursors.set(userId, { cellId, timestamp });
  }

  // Smooth cursor animation
  animateCursor(userId: UserId, from: CellId, to: CellId) {
    const fromPixels = this.cellToPixels(from);
    const toPixels = this.cellToPixels(to);

    // CSS transition
    const cursor = document.querySelector(`[data-cursor-id="${userId}"]`);
    cursor.style.transition = "transform 100ms ease-out";
    cursor.style.transform = `translate(${toPixels.x}px, ${toPixels.y}px)`;
  }

  // Selection synchronization
  syncSelection(range: CellRange) {
    this.ws.send(
      JSON.stringify({
        type: "SELECTION_CHANGE",
        range,
        timestamp: Date.now(),
      })
    );
  }
}
```

**Optimization Techniques:**

1. **Cursor Throttling**

   - Don't send every mouse move (100s per second)
   - Throttle to 30-60 updates/sec (imperceptible to user)

2. **Delta Compression**

   ```typescript
   // Only send if moved to different cell
   if (newCellId !== lastSentCellId) {
     sendCursorUpdate(newCellId);
   }
   ```

3. **Predictive Rendering**

   - Interpolate cursor position between updates
   - Makes movement appear smoother even with network latency

4. **Presence Timeout**

   - Remove cursors of inactive users (>30s no updates)

   ```typescript
   setInterval(() => {
     const now = Date.now();
     remoteCursors.forEach((cursor, userId) => {
       if (now - cursor.timestamp > 30000) {
         remoteCursors.delete(userId);
         removeCursorElement(userId);
       }
     });
   }, 5000);
   ```

5. **Visual Differentiation**
   - Assign unique color to each user
   - Show user name next to cursor
   - Dim cursor for idle users

**Server-side:**

```typescript
// Broadcast cursor updates to all clients in room
io.on("connection", (socket) => {
  socket.on("CURSOR_MOVE", (data) => {
    socket.to(data.spreadsheetId).emit("CURSOR_MOVE", {
      ...data,
      userId: socket.userId,
      userName: socket.userName,
    });
  });
});
```

---

### Q6: How do you handle formula evaluation with 200+ Excel functions?

**Answer:**

**Approach: Parser + Evaluator + Function Registry**

```typescript
// 1. Formula Parser (using PEG grammar)
import { Parser } from "hot-formula-parser";

const parser = new Parser();

// Parse formula
const result = parser.parse("=SUM(A1:A10) + IF(B1>10, B1*2, B1)");
// Result: { result: 150, error: null }

// 2. Function Registry
class FunctionRegistry {
  private functions: Map<string, FormulaFunction> = new Map();

  register(name: string, fn: FormulaFunction) {
    this.functions.set(name.toUpperCase(), fn);
  }

  call(name: string, args: any[]): any {
    const fn = this.functions.get(name.toUpperCase());

    if (!fn) {
      throw new Error(`#NAME? - Unknown function: ${name}`);
    }

    return fn(...args);
  }
}

const registry = new FunctionRegistry();

// 3. Implement core functions
registry.register("SUM", (...args) => {
  return args.flat(Infinity).reduce((sum, val) => sum + Number(val), 0);
});

registry.register("AVERAGE", (...args) => {
  const values = args.flat(Infinity);
  const sum = values.reduce((s, v) => s + Number(v), 0);
  return sum / values.length;
});

registry.register("IF", (condition, trueValue, falseValue) => {
  return condition ? trueValue : falseValue;
});

registry.register(
  "VLOOKUP",
  (searchValue, tableRange, colIndex, exactMatch = true) => {
    // Implementation...
  }
);

// 4. Lazy evaluation for performance
class LazyFormulaEvaluator {
  private cache: Map<CellId, any> = new Map();

  evaluate(cellId: CellId): any {
    // Check cache
    if (this.cache.has(cellId)) {
      return this.cache.get(cellId);
    }

    const formula = this.getFormula(cellId);

    if (!formula) {
      return this.getCellValue(cellId);
    }

    // Parse and evaluate
    const ast = parser.parse(formula);
    const result = this.evaluateAST(ast);

    // Cache result
    this.cache.set(cellId, result);

    return result;
  }

  invalidateCache(cellId: CellId) {
    this.cache.delete(cellId);

    // Invalidate dependents
    const dependents = this.getDependents(cellId);
    dependents.forEach((dep) => this.invalidateCache(dep));
  }
}

// 5. Handle array formulas
registry.register("ARRAYFORMULA", (formula) => {
  // Evaluate formula for each cell in range
  // Return array of results
});

// Example: =ARRAYFORMULA(A1:A10 * 2)
// Multiplies each cell in A1:A10 by 2
```

**Function Categories:**

1. **Math** (40+): SUM, AVERAGE, MAX, MIN, ROUND, ABS, POWER, SQRT, etc.
2. **Statistical** (30+): STDEV, VAR, MEDIAN, MODE, PERCENTILE, etc.
3. **Logical** (10+): IF, AND, OR, NOT, IFS, SWITCH, etc.
4. **Text** (25+): CONCATENATE, LEFT, RIGHT, MID, TRIM, UPPER, LOWER, etc.
5. **Lookup** (10+): VLOOKUP, HLOOKUP, INDEX, MATCH, OFFSET, etc.
6. **Date/Time** (20+): DATE, TIME, NOW, TODAY, YEAR, MONTH, DAY, etc.
7. **Financial** (30+): NPV, IRR, PMT, FV, PV, RATE, etc.
8. **Database** (10+): DSUM, DAVERAGE, DCOUNT, etc.
9. **Information** (15+): ISBLANK, ISERROR, ISNUMBER, CELL, etc.

**Error Handling:**

```typescript
// Excel error values
const ERRORS = {
  DIV_ZERO: "#DIV/0!", // Division by zero
  NAME: "#NAME?", // Unknown function
  VALUE: "#VALUE!", // Wrong argument type
  REF: "#REF!", // Invalid cell reference
  NUM: "#NUM!", // Invalid numeric value
  NA: "#N/A", // Value not available
  CIRCULAR_REF: "#CIRCULAR_REF!",
};

// Example
registry.register("DIVIDE", (a, b) => {
  if (b === 0) throw ERRORS.DIV_ZERO;
  return a / b;
});
```

---

### Q7: What's your approach to handling offline mode with conflict resolution?

**Answer:**

**Strategy: Offline Queue + Operational Transform on Reconnect**

```typescript
class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private operationQueue: Operation[] = [];
  private db: IDBDatabase;

  constructor() {
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());
  }

  // 1. Queue operations when offline
  async queueOperation(operation: Operation) {
    // Apply locally (optimistic)
    applyOperationLocally(operation);

    if (this.isOnline) {
      // Online: send immediately
      await this.sendToServer(operation);
    } else {
      // Offline: queue for later
      this.operationQueue.push(operation);

      // Persist to IndexedDB
      await this.persistOperation(operation);
    }
  }

  // 2. When back online, sync queued operations
  async handleOnline() {
    this.isOnline = true;

    // Load queued operations from IndexedDB
    const queue = await this.loadQueuedOperations();

    for (const operation of queue) {
      try {
        // Send to server
        const serverOp = await this.sendToServer(operation);

        // Server may have transformed our operation (concurrent edits)
        if (!this.operationsEqual(operation, serverOp)) {
          // Apply server's transformation
          this.applyTransformation(operation, serverOp);
        }

        // Remove from queue
        await this.removeFromQueue(operation.id);
      } catch (error) {
        // Conflict detected
        await this.handleConflict(operation, error);
      }
    }
  }

  // 3. Conflict resolution strategies
  async handleConflict(localOp: Operation, error: ConflictError) {
    // Strategy 1: Last-write-wins (server wins)
    if (error.strategy === "server-wins") {
      const serverValue = error.serverValue;

      // Rollback local change
      applyOperationLocally(invertOperation(localOp));

      // Apply server value
      setCellValue(localOp.cellId, serverValue);

      // Notify user
      toast.warning("Your changes were overwritten by another user");
    }

    // Strategy 2: Manual resolution
    else if (error.strategy === "manual") {
      const resolution = await showConflictDialog({
        local: localOp.value,
        remote: error.serverValue,
      });

      if (resolution === "keep-local") {
        // Force our value
        await this.sendToServer({ ...localOp, force: true });
      } else {
        // Accept server value
        setCellValue(localOp.cellId, error.serverValue);
      }
    }

    // Strategy 3: Operational Transform
    else if (error.strategy === "transform") {
      const transformed = transformOperation(localOp, error.serverOp);
      await this.sendToServer(transformed);
    }
  }

  // 4. Persist spreadsheet data for offline access
  async cacheSpreadsheet(spreadsheet: Spreadsheet) {
    await this.db.put("spreadsheets", spreadsheet);
  }

  async loadCachedSpreadsheet(id: string): Promise<Spreadsheet | null> {
    return await this.db.get("spreadsheets", id);
  }
}

// Conflict Resolution Dialog
function showConflictDialog({
  local,
  remote,
}: ConflictData): Promise<"keep-local" | "keep-remote"> {
  return new Promise((resolve) => {
    const modal = (
      <Modal>
        <h2>Conflict Detected</h2>
        <p>Cell A1 was modified while you were offline.</p>

        <div>
          <strong>Your version:</strong> {local}
        </div>
        <div>
          <strong>Server version:</strong> {remote}
        </div>

        <button onClick={() => resolve("keep-local")}>Keep Mine</button>
        <button onClick={() => resolve("keep-remote")}>Use Server's</button>
      </Modal>
    );

    showModal(modal);
  });
}
```

**Offline Features:**

1. **Service Worker**: Cache static assets (JS, CSS, fonts)
2. **IndexedDB**: Cache spreadsheet data
3. **Operation Queue**: Persist user edits
4. **Auto-sync**: Resume sync when back online
5. **Conflict UI**: Show clear conflict resolution options

**Trade-offs:**

- ✅ Users can work offline
- ✅ No data loss
- ❌ Complex conflict resolution
- ❌ Storage limits (IndexedDB: ~50MB-1GB depending on browser)

---

### Q8: How would you implement cell formatting (bold, colors, borders) efficiently?

**Answer:**

**Approach: Sparse Storage + CSS Classes + Style Inheritance**

```typescript
// 1. Sparse storage (don't store default formats)
interface CellFormat {
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textColor?: string;
  backgroundColor?: string;
  borders?: Borders;
  alignment?: Alignment;
  numberFormat?: NumberFormat;
}

// Store only non-default values
const cellFormats: Map<CellId, CellFormat> = new Map();

function setCellFormat(cellId: CellId, format: Partial<CellFormat>) {
  const existing = cellFormats.get(cellId) || {};
  const merged = { ...existing, ...format };

  // Remove default values (reduce storage)
  if (merged.fontWeight === "normal") delete merged.fontWeight;
  if (merged.textColor === "#000000") delete merged.textColor;

  // If all defaults, remove entry
  if (Object.keys(merged).length === 0) {
    cellFormats.delete(cellId);
  } else {
    cellFormats.set(cellId, merged);
  }
}

// 2. CSS classes for common formats (reduce inline styles)
// Generate CSS classes for all format combinations
const formatClasses: Map<string, string> = new Map();

function getFormatClass(format: CellFormat): string {
  const key = JSON.stringify(format);

  if (formatClasses.has(key)) {
    return formatClasses.get(key)!;
  }

  // Generate unique class name
  const className = `fmt-${formatClasses.size}`;

  // Generate CSS
  const css = generateCSS(className, format);
  injectCSS(css);

  formatClasses.set(key, className);
  return className;
}

function generateCSS(className: string, format: CellFormat): string {
  let css = `.${className} {`;

  if (format.fontWeight) css += `font-weight: ${format.fontWeight};`;
  if (format.fontStyle) css += `font-style: ${format.fontStyle};`;
  if (format.textColor) css += `color: ${format.textColor};`;
  if (format.backgroundColor)
    css += `background-color: ${format.backgroundColor};`;

  if (format.borders) {
    if (format.borders.top) css += `border-top: ${format.borders.top};`;
    if (format.borders.right) css += `border-right: ${format.borders.right};`;
    if (format.borders.bottom)
      css += `border-bottom: ${format.borders.bottom};`;
    if (format.borders.left) css += `border-left: ${format.borders.left};`;
  }

  css += "}";
  return css;
}

// 3. Cell rendering with format
const Cell: FC<CellProps> = ({ cellId, value, format }) => {
  const className = useMemo(
    () => (format ? getFormatClass(format) : "cell-default"),
    [format]
  );

  return (
    <div className={`cell ${className}`}>{formatCellValue(value, format)}</div>
  );
};

// 4. Conditional formatting (evaluated at render time)
interface ConditionalFormat {
  condition: (value: any) => boolean;
  format: CellFormat;
}

function applyConditionalFormats(
  value: any,
  baseFormat: CellFormat,
  conditionalFormats: ConditionalFormat[]
): CellFormat {
  let mergedFormat = { ...baseFormat };

  for (const cf of conditionalFormats) {
    if (cf.condition(value)) {
      mergedFormat = { ...mergedFormat, ...cf.format };
    }
  }

  return mergedFormat;
}

// Example: Highlight cells > 100 in red
const conditionalFormat: ConditionalFormat = {
  condition: (value) => Number(value) > 100,
  format: { backgroundColor: "#ffcccc" },
};

// 5. Number formatting
function formatNumber(value: number, format: NumberFormat): string {
  switch (format.type) {
    case "number":
      return value.toLocaleString("en-US", {
        minimumFractionDigits: format.decimals || 0,
        maximumFractionDigits: format.decimals || 0,
      });

    case "currency":
      return value.toLocaleString("en-US", {
        style: "currency",
        currency: format.currency || "USD",
      });

    case "percent":
      return (value * 100).toFixed(format.decimals || 0) + "%";

    case "date":
      return new Date(value).toLocaleDateString(format.locale || "en-US");

    case "custom":
      return applyCustomFormat(value, format.pattern);
  }
}
```

**Performance Optimizations:**

1. **CSS Classes > Inline Styles**

   - 10K cells with bold → 1 CSS class vs 10K inline styles
   - Browser can optimize class-based styling

2. **Sparse Storage**

   - Don't store default formats
   - 1M cells, 10K formatted → 10K format objects (not 1M)

3. **Format Deduplication**

   - Same format → same CSS class
   - Reduces CSS size and class lookup time

4. **Lazy CSS Injection**
   - Only inject CSS for visible formats
   - Remove unused CSS classes (LRU cache)

---

### Q9: How would you implement copy/paste functionality including formulas and formats?

**Answer:**

**Approach: Serialize to Clipboard + Adjust References + Handle Cross-Sheet**

```typescript
class ClipboardManager {
  // 1. Copy cells
  async copy(range: CellRange) {
    const cells = this.getCellsInRange(range);

    // Serialize cells to clipboard
    const clipboardData = {
      type: 'spreadsheet-cells',
      cells: cells.map(cell => ({
        relativeRow: cell.row - range.start.row,
        relativeCol: cell.col - range.start.col,
        value: cell.value,
        formula: cell.formula,
        format: cell.format,
      })),
      range: {
        rows: range.end.row - range.start.row + 1,
        cols: range.end.col - range.start.col + 1,
      },
    };

    // Multiple clipboard formats for compatibility
    const htmlTable = this.serializeToHTML(cells);
    const plainText = this.serializeToText(cells);
    const json = JSON.stringify(clipboardData);

    // Write to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([htmlTable], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
        'application/json': new Blob([json], { type: 'application/json' }),
      }),
    ]);

    // Store in internal clipboard (for formulas, which can't go to OS clipboard)
    this.internalClipboard = clipboardData;
  }

  // 2. Paste cells
  async paste(targetCell: CellId) {
    let clipboardData: ClipboardData;

    try {
      // Try to read from clipboard
      const items = await navigator.clipboard.read();
      const jsonBlob = await items[0].getType('application/json');
      const json = await jsonBlob.text();
      clipboardData = JSON.parse(json);
    } catch {
      // Fallback to internal clipboard
      clipboardData = this.internalClipboard;
    }

    if (!clipboardData) return;

    // Paste cells at target position
    const operations: Operation[] = [];

    for (const cell of clipboardData.cells) {
      const targetRow = targetCell.row + cell.relativeRow;
      const targetCol = targetCell.col + cell.relativeCol;
      const targetCellId = this.getCellId(targetRow, targetCol);

      // Adjust formula references
      const adjustedFormula = cell.formula
        ? this.adjustFormulaReferences(
            cell.formula,
            cell.relativeRow,
            cell.relativeCol
          )
        : null;

      operations.push({
        type: 'UPDATE_CELL',
        cellId: targetCellId,
        value: adjustedFormula ? null : cell.value,
        formula: adjustedFormula,
        format: cell.format,
      });
    }

    // Apply operations (with undo support)
    this.applyOperations(operations);
  }

  // 3. Adjust formula references (relative/absolute)
  adjustFormulaReferences(
    formula: string,
    rowOffset: number,
    colOffset: number
  ): string {
    return formula.replace(
      /(\$?)([A-Z]+)(\$?)(\d+)/g,
      (match, col$, col, row$, row) => {
        // Absolute column ($A)
        if (col$) col = col;
        else col = this.offsetColumn(col, colOffset);

        // Absolute row ($1)
        if (row$) row = row;
        else row = Number(row) + rowOffset;

        return `${col$}${col}${row$}${row}`;
      }
    );
  }

  // 4. Serialize to HTML (for Excel/Sheets compatibility)
  serializeToHTML(cells: Cell[][]): string {
    let html = '<table>';

    for (const row of cells) {
      html += '<tr>';

      for (const cell of row) {
        const style = this.formatToCSS(cell.format);
        html += `<td style="${style}">${cell.value}</td>`;
      }

      html += '</tr>';
    }

    html += '</table>';
    return html;
  }

  // 5. Serialize to plain text (TSV format)
  serializeToText(cells: Cell[][]): string {
    return cells
      .map(row => row.map(cell => cell.value).join('\t'))
      .join('\n');
  }

  // 6. Handle special paste modes
  async pasteSpecial(mode: 'values' | 'formats' | 'formulas') {
    const clipboardData = this.internalClipboard;

    for (const cell of clipboardData.cells) {
      const targetCellId = /* ... */;

      switch (mode) {
        case 'values':
          // Paste only values (no formulas, no formats)
          updateCell(targetCellId, { value: cell.value });
          break;

        case 'formats':
          // Paste only formats
          updateCell(targetCellId, { format: cell.format });
          break;

        case 'formulas':
          // Paste only formulas
          updateCell(targetCellId, { formula: cell.formula });
          break;
      }
    }
  }
}
```

**Edge Cases:**

1. **Circular References After Paste**

   ```typescript
   // A1 = B1, paste to B1 → would create B1 = B1
   // Solution: Detect and prevent
   if (this.wouldCreateCircularRef(formula, targetCell)) {
     throw new Error("Cannot paste: would create circular reference");
   }
   ```

2. **Cross-Sheet Paste**

   ```typescript
   // Formula refers to Sheet2!A1
   // Preserve sheet reference or convert to current sheet?
   // Google Sheets: Preserve
   // Excel: User choice
   ```

3. **Large Paste (100K cells)**
   ```typescript
   // Batch operations, show progress
   async pasteLarge(cells: Cell[], targetCell: CellId) {
     const batchSize = 1000;

     for (let i = 0; i < cells.length; i += batchSize) {
       const batch = cells.slice(i, i + batchSize);
       await this.pasteBatch(batch, targetCell, i);

       // Update progress
       updateProgress((i / cells.length) * 100);
     }
   }
   ```

---

### Q10: How do you implement autosave without disrupting the user experience?

**Answer:**

**Strategy: Debounced Save + Optimistic UI + Background Sync**

```typescript
class AutosaveManager {
  private saveQueue: Operation[] = [];
  private lastSaveTime: number = Date.now();
  private isSaving: boolean = false;
  private saveDebounceMs: number = 2000; // 2 seconds
  private saveTimeoutId: number | null = null;

  // 1. Debounced save (wait for user to pause typing)
  queueSave(operation: Operation) {
    this.saveQueue.push(operation);

    // Clear existing timeout
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }

    // Set new timeout
    this.saveTimeoutId = window.setTimeout(() => {
      this.save();
    }, this.saveDebounceMs);
  }

  // 2. Intelligent save timing
  async save() {
    if (this.isSaving) {
      // Already saving, will retry after current save completes
      return;
    }

    if (this.saveQueue.length === 0) {
      return;
    }

    this.isSaving = true;
    this.showSavingIndicator();

    const operations = this.saveQueue.splice(0, this.saveQueue.length);

    try {
      await this.saveToServer(operations);

      this.lastSaveTime = Date.now();
      this.showSavedIndicator();
    } catch (error) {
      // Save failed, re-queue operations
      this.saveQueue.unshift(...operations);
      this.showErrorIndicator();

      // Retry with exponential backoff
      this.retryLater();
    } finally {
      this.isSaving = false;

      // If more operations queued during save, save again
      if (this.saveQueue.length > 0) {
        this.save();
      }
    }
  }

  // 3. Force save (on user action like closing tab)
  async forceSave(): Promise<boolean> {
    if (this.saveQueue.length === 0) {
      return true; // Nothing to save
    }

    // Cancel debounce
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }

    // Save immediately
    await this.save();

    return this.saveQueue.length === 0; // All saved?
  }

  // 4. Before unload handler (prevent data loss)
  setupBeforeUnload() {
    window.addEventListener("beforeunload", (e) => {
      if (this.saveQueue.length > 0) {
        // Unsaved changes
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";

        // Try to save using sendBeacon (guaranteed to complete even if page unloads)
        const data = JSON.stringify({ operations: this.saveQueue });
        navigator.sendBeacon("/api/autosave", data);
      }
    });
  }

  // 5. Periodic save (every 60s even if idle)
  setupPeriodicSave() {
    setInterval(() => {
      const timeSinceLastSave = Date.now() - this.lastSaveTime;

      if (timeSinceLastSave > 60000 && this.saveQueue.length > 0) {
        this.save();
      }
    }, 60000); // Check every minute
  }

  // 6. Visual indicators
  showSavingIndicator() {
    const indicator = document.getElementById("save-status");
    indicator.textContent = "Saving...";
    indicator.className = "saving";
  }

  showSavedIndicator() {
    const indicator = document.getElementById("save-status");
    indicator.textContent = "✓ Saved";
    indicator.className = "saved";

    // Fade out after 2s
    setTimeout(() => {
      indicator.className = "saved fade-out";
    }, 2000);
  }

  showErrorIndicator() {
    const indicator = document.getElementById("save-status");
    indicator.textContent = "⚠ Save failed";
    indicator.className = "error";
  }

  // 7. Retry with exponential backoff
  private retryCount = 0;

  retryLater() {
    const delay = Math.min(1000 * 2 ** this.retryCount, 30000); // Max 30s

    setTimeout(() => {
      this.retryCount++;
      this.save();
    }, delay);
  }
}

// Usage
const autosave = new AutosaveManager();

// On user edit
function handleCellEdit(cellId: CellId, value: string) {
  // Apply locally (instant feedback)
  updateCellLocally(cellId, value);

  // Queue for autosave
  autosave.queueSave({
    type: "UPDATE_CELL",
    cellId,
    value,
  });
}

// Setup
autosave.setupBeforeUnload();
autosave.setupPeriodicSave();
```

**UX Considerations:**

1. **Save Status Indicator**

   - "Saving..." (active)
   - "✓ Saved" (success)
   - "⚠ Unsaved changes" (offline/error)

2. **Non-blocking**

   - Save happens in background
   - User can keep editing while saving

3. **Conflict Handling**

   - If concurrent edit detected during save, show conflict UI
   - Let user choose which version to keep

4. **Network Efficiency**
   - Batch operations (don't save every keystroke)
   - Send only deltas (not entire spreadsheet)
   - Compress payload

**Performance:**

- Debounce: 2s (balance between data loss risk and save frequency)
- Max wait: 60s (even if continuously editing)
- Batch size: unlimited (all pending ops in one request)

---

### Q11: How would you approach building charts/visualizations in the spreadsheet?

**Answer:**

**Architecture: Separate Charting Module + Data Abstraction**

```typescript
// 1. Chart configuration
interface ChartConfig {
  type: "bar" | "line" | "pie" | "scatter" | "area";
  dataRange: CellRange;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis;
  series: ChartSeries[];
  title?: string;
  legend?: LegendConfig;
  colors?: string[];
}

interface ChartSeries {
  name: string;
  dataRange: CellRange;
  color?: string;
  type?: "bar" | "line"; // For combo charts
}

// 2. Chart component (using Recharts)
const Chart: FC<ChartProps> = ({ config }) => {
  // Subscribe to data changes
  const data = useChartData(config.dataRange);

  // Memoize chart to prevent unnecessary re-renders
  const chartElement = useMemo(() => {
    switch (config.type) {
      case "bar":
        return (
          <BarChart data={data} width={600} height={400}>
            <XAxis dataKey={config.xAxis.dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.series.map((series) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color}
              />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={data} width={600} height={400}>
            <XAxis dataKey={config.xAxis.dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.series.map((series) => (
              <Line
                key={series.name}
                dataKey={series.name}
                stroke={series.color}
              />
            ))}
          </LineChart>
        );

      // ... other chart types
    }
  }, [config, data]);

  return <div className="chart-container">{chartElement}</div>;
};

// 3. Live chart updates (reacts to cell changes)
function useChartData(dataRange: CellRange): ChartData[] {
  const cells = useCells();

  return useMemo(() => {
    const data: ChartData[] = [];

    // Extract data from range
    for (let row = dataRange.start.row; row <= dataRange.end.row; row++) {
      const rowData: Record<string, any> = {};

      for (let col = dataRange.start.col; col <= dataRange.end.col; col++) {
        const cellId = getCellId(row, col);
        const cell = cells[cellId];

        // First row = headers
        if (row === dataRange.start.row) {
          // Skip headers
          continue;
        }

        const header = cells[getCellId(dataRange.start.row, col)]?.value;
        rowData[header] = cell?.value;
      }

      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    }

    return data;
  }, [cells, dataRange]);
}

// 4. Chart editor modal
const ChartEditor: FC<ChartEditorProps> = ({ onSave }) => {
  const [config, setConfig] = useState<ChartConfig>({
    type: "bar",
    dataRange: { start: "A1", end: "C10" },
    series: [],
  });

  // Preview chart while editing
  return (
    <Modal>
      <div className="chart-editor">
        <div className="editor-panel">
          <h3>Chart Settings</h3>

          <label>
            Chart Type
            <select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value })}
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
              <option value="scatter">Scatter</option>
            </select>
          </label>

          <label>
            Data Range
            <input
              type="text"
              value={formatRange(config.dataRange)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  dataRange: parseRange(e.target.value),
                })
              }
            />
          </label>

          {/* More settings... */}
        </div>

        <div className="preview-panel">
          <h3>Preview</h3>
          <Chart config={config} />
        </div>
      </div>

      <button onClick={() => onSave(config)}>Insert Chart</button>
    </Modal>
  );
};

// 5. Embedded charts in grid
const EmbeddedChart: FC<{ chartId: string }> = ({ chartId }) => {
  const config = useChartConfig(chartId);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 400 });

  // Draggable
  const handleDrag = (e: DragEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  // Resizable
  const handleResize = (newSize: Size) => {
    setSize(newSize);
  };

  return (
    <Draggable position={position} onDrag={handleDrag}>
      <Resizable size={size} onResize={handleResize}>
        <div className="embedded-chart">
          <Chart config={config} />
        </div>
      </Resizable>
    </Draggable>
  );
};
```

**Performance Optimizations:**

1. **Lazy Load Charts**

   ```typescript
   const Chart = lazy(() => import("./components/Chart"));

   // Only load when chart is created
   <Suspense fallback={<Spinner />}>
     <Chart config={config} />
   </Suspense>;
   ```

2. **Memoize Chart Data**

   - Only recalculate when source cells change
   - Use `useMemo` to prevent re-processing on every render

3. **SVG > Canvas for Small Charts**

   - SVG: Better for small datasets, accessibility
   - Canvas: Better for large datasets (>1000 points)

4. **Export Charts**
   ```typescript
   async function exportChartAsPNG(chartId: string): Promise<Blob> {
     const chartElement = document.getElementById(chartId);
     const canvas = await html2canvas(chartElement);

     return new Promise((resolve) => {
       canvas.toBlob((blob) => resolve(blob), "image/png");
     });
   }
   ```

---

### Q12: What's your strategy for handling large file imports (CSV, XLSX) without blocking the UI?

**Answer:**

**Approach: Web Workers + Streaming + Progress Feedback**

```typescript
// 1. File upload with progress
async function importFile(file: File) {
  const fileSize = file.size;
  let uploadedSize = 0;

  // Show progress modal
  const progressModal = showProgressModal();

  // Upload file to server with progress tracking
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/import", {
    method: "POST",
    body: formData,
    onUploadProgress: (event) => {
      uploadedSize = event.loaded;
      const progress = (uploadedSize / fileSize) * 100;

      progressModal.setProgress(progress, "Uploading...");
    },
  });

  // File uploaded, now parse
  progressModal.setProgress(0, "Processing...");

  // Process on server (large files) or client (small files)
  if (fileSize > 10 * 1024 * 1024) {
    // > 10MB
    // Server-side processing
    await processOnServer(response);
  } else {
    // Client-side processing (Web Worker)
    await processInWorker(file, progressModal);
  }
}

// 2. Web Worker for parsing (non-blocking)
// import-worker.ts
self.addEventListener("message", async (event) => {
  const { file, type } = event.data;

  if (type === "csv") {
    await parseCSV(file);
  } else if (type === "xlsx") {
    await parseXLSX(file);
  }
});

async function parseCSV(file: File) {
  const Papa = await import("papaparse");

  Papa.parse(file, {
    worker: true, // Use Web Worker
    chunk: (results, parser) => {
      // Process chunk
      const rows = results.data;

      // Send chunk to main thread
      self.postMessage({
        type: "CHUNK",
        rows,
        progress: (results.meta.cursor / file.size) * 100,
      });

      // Throttle to prevent overwhelming main thread
      if (results.data.length > 1000) {
        parser.pause();
        setTimeout(() => parser.resume(), 10);
      }
    },
    complete: () => {
      self.postMessage({ type: "COMPLETE" });
    },
  });
}

async function parseXLSX(file: File) {
  const XLSX = await import("xlsx");

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Process sheets
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Send in chunks
    const chunkSize = 1000;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      self.postMessage({
        type: "CHUNK",
        sheetName,
        rows: chunk,
        progress: (i / data.length) * 100,
      });

      // Yield to main thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  self.postMessage({ type: "COMPLETE" });
}

// Main thread
function importWithWorker(file: File) {
  const worker = new Worker("/import-worker.js");

  worker.postMessage({
    file,
    type: file.name.endsWith(".csv") ? "csv" : "xlsx",
  });

  worker.onmessage = (event) => {
    const { type, rows, sheetName, progress } = event.data;

    if (type === "CHUNK") {
      // Insert rows into spreadsheet
      insertRows(sheetName || "Sheet1", rows);

      // Update progress
      updateProgress(progress);
    } else if (type === "COMPLETE") {
      // Import complete
      hideProgress();
      worker.terminate();
    }
  };
}

// 3. Batch insert (prevent UI freeze)
async function insertRows(sheetName: string, rows: any[][]) {
  const batchSize = 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    // Insert batch
    const operations = batch.map((row, idx) => ({
      type: "INSERT_ROW",
      sheetName,
      rowIndex: i + idx,
      data: row,
    }));

    applyOperations(operations);

    // Yield to browser (prevent jank)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Update progress
    updateProgress((i / rows.length) * 100);
  }
}

// 4. Streaming parse (for very large files)
async function streamParseCSV(file: File) {
  const stream = file.stream();
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let rowCount = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      const row = parseCSVLine(line);
      insertRow(rowCount++, row);

      // Yield periodically
      if (rowCount % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
}
```

**UX Enhancements:**

1. **Progress Indicator**

   - Show percentage
   - Show rows processed
   - Estimate time remaining

2. **Cancelable**

   - Allow user to cancel import mid-way
   - Clean up partial data

3. **Error Handling**

   - Show which rows failed
   - Offer to skip or fix errors

4. **Preview Before Import**
   - Show first 10 rows
   - Let user map columns
   - Choose which sheet to import into

---

### Q13: How do you handle different timezones for date values and timestamps?

**Answer:**

**Strategy: Store UTC + Display in User Timezone**

```typescript
// 1. Store all dates in UTC
interface CellValue {
  type: "date" | "datetime" | "time";
  value: string; // ISO 8601 in UTC (e.g., "2024-01-15T10:30:00Z")
}

// When user enters date
function parseDateInput(input: string, userTimezone: string): CellValue {
  // Parse in user's timezone
  const date = parseDate(input, userTimezone);

  // Convert to UTC for storage
  const utc = toUTC(date);

  return {
    type: "datetime",
    value: utc.toISOString(), // "2024-01-15T10:30:00Z"
  };
}

// When displaying date
function formatDateForDisplay(
  cellValue: CellValue,
  userTimezone: string,
  format: string
): string {
  // Parse UTC date
  const utcDate = new Date(cellValue.value);

  // Convert to user's timezone
  const localDate = toTimezone(utcDate, userTimezone);

  // Format
  return formatDate(localDate, format);
}

// 2. Use library for timezone handling
import { DateTime } from "luxon";

function toTimezone(date: Date, timezone: string): DateTime {
  return DateTime.fromJSDate(date, { zone: "UTC" }).setZone(timezone);
}

// Example
const utcDate = new Date("2024-01-15T10:30:00Z");
const nyTime = toTimezone(utcDate, "America/New_York");
const tokyoTime = toTimezone(utcDate, "Asia/Tokyo");

console.log(nyTime.toFormat("yyyy-MM-dd HH:mm")); // "2024-01-15 05:30"
console.log(tokyoTime.toFormat("yyyy-MM-dd HH:mm")); // "2024-01-15 19:30"

// 3. Formula functions with timezone awareness
registry.register("NOW", () => {
  // Return current time in UTC
  return new Date().toISOString();
});

registry.register("TODAY", () => {
  // Return today's date at midnight UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString();
});

// User-timezone-aware functions
registry.register("NOW_LOCAL", () => {
  const userTimezone = getUserTimezone();
  return DateTime.now().setZone(userTimezone).toISO();
});

// 4. Detect user timezone
function getUserTimezone(): string {
  // Option 1: Browser API
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Option 2: User preference (stored in profile)
  const userPreference = loadUserPreference("timezone");

  return userPreference || detected;
}

// 5. Timezone conversion formula
registry.register(
  "CONVERT_TZ",
  (date: string, fromTZ: string, toTZ: string) => {
    const dt = DateTime.fromISO(date, { zone: fromTZ });
    return dt.setZone(toTZ).toISO();
  }
);

// Example: =CONVERT_TZ("2024-01-15 10:00", "America/New_York", "Asia/Tokyo")
// Result: "2024-01-16 00:00"

// 6. Relative time display
function formatRelativeTime(date: Date): string {
  const now = DateTime.now();
  const then = DateTime.fromJSDate(date);

  const diff = now.diff(then, ["years", "months", "days", "hours", "minutes"]);

  if (diff.years > 0) return `${Math.floor(diff.years)} years ago`;
  if (diff.months > 0) return `${Math.floor(diff.months)} months ago`;
  if (diff.days > 0) return `${Math.floor(diff.days)} days ago`;
  if (diff.hours > 0) return `${Math.floor(diff.hours)} hours ago`;
  if (diff.minutes > 0) return `${Math.floor(diff.minutes)} minutes ago`;

  return "Just now";
}
```

**Edge Cases:**

1. **Daylight Saving Time**

   - Store in UTC (not affected by DST)
   - Display respects DST in user timezone

2. **Ambiguous Times**

   - During "fall back", 1:30 AM occurs twice
   - Luxon handles this: `DateTime.fromObject({ hour: 1, minute: 30 }, { zone: 'America/New_York' })`

3. **Cross-User Collaboration**

   - User A (NYC) enters "Jan 15, 10:00 AM"
   - Stored as UTC: "2024-01-15T15:00:00Z"
   - User B (Tokyo) sees "Jan 16, 12:00 AM" (their local time)

4. **Formula Calculations**
   - Date math always in UTC
   - `=A1 + 1` adds 1 day, regardless of DST changes

---

### Q14: How would you implement data validation (dropdown lists, number ranges, custom rules)?

**Answer:**

**Approach: Validation Rules + UI Feedback + Server-side Enforcement**

```typescript
// 1. Validation rule types
interface ValidationRule {
  type: "list" | "range" | "regex" | "custom";
  errorMessage?: string;
  showDropdown?: boolean;
}

interface ListValidation extends ValidationRule {
  type: "list";
  values: string[] | CellRange; // Static list or reference to range
  allowBlank?: boolean;
}

interface RangeValidation extends ValidationRule {
  type: "range";
  dataType: "number" | "date";
  min?: number | Date;
  max?: number | Date;
}

interface RegexValidation extends ValidationRule {
  type: "regex";
  pattern: string;
}

interface CustomValidation extends ValidationRule {
  type: "custom";
  validator: (value: any) => boolean;
}

// 2. Validation manager
class ValidationManager {
  private rules: Map<CellId, ValidationRule> = new Map();

  setRule(cellId: CellId, rule: ValidationRule) {
    this.rules.set(cellId, rule);
  }

  validate(cellId: CellId, value: any): ValidationResult {
    const rule = this.rules.get(cellId);

    if (!rule) {
      return { valid: true };
    }

    switch (rule.type) {
      case "list":
        return this.validateList(value, rule as ListValidation);

      case "range":
        return this.validateRange(value, rule as RangeValidation);

      case "regex":
        return this.validateRegex(value, rule as RegexValidation);

      case "custom":
        return this.validateCustom(value, rule as CustomValidation);
    }
  }

  private validateList(value: any, rule: ListValidation): ValidationResult {
    const values = Array.isArray(rule.values)
      ? rule.values
      : this.getCellRangeValues(rule.values);

    if (rule.allowBlank && (value === "" || value === null)) {
      return { valid: true };
    }

    if (!values.includes(String(value))) {
      return {
        valid: false,
        error:
          rule.errorMessage || `Value must be one of: ${values.join(", ")}`,
      };
    }

    return { valid: true };
  }

  private validateRange(value: any, rule: RangeValidation): ValidationResult {
    const num = Number(value);

    if (isNaN(num)) {
      return {
        valid: false,
        error: "Value must be a number",
      };
    }

    if (rule.min !== undefined && num < rule.min) {
      return {
        valid: false,
        error: `Value must be at least ${rule.min}`,
      };
    }

    if (rule.max !== undefined && num > rule.max) {
      return {
        valid: false,
        error: `Value must be at most ${rule.max}`,
      };
    }

    return { valid: true };
  }

  private validateRegex(value: any, rule: RegexValidation): ValidationResult {
    const pattern = new RegExp(rule.pattern);

    if (!pattern.test(String(value))) {
      return {
        valid: false,
        error: rule.errorMessage || "Invalid format",
      };
    }

    return { valid: true };
  }

  private validateCustom(value: any, rule: CustomValidation): ValidationResult {
    const isValid = rule.validator(value);

    if (!isValid) {
      return {
        valid: false,
        error: rule.errorMessage || "Invalid value",
      };
    }

    return { valid: true };
  }
}

// 3. Cell editor with validation
const CellEditor: FC<CellEditorProps> = ({ cellId, initialValue, onSave }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const validationRule = useValidationRule(cellId);

  // Live validation
  useEffect(() => {
    if (validationRule) {
      const result = validationManager.validate(cellId, value);
      setError(result.valid ? null : result.error);
    }
  }, [value, validationRule]);

  // Show dropdown for list validation
  if (validationRule?.type === "list" && validationRule.showDropdown) {
    const values = Array.isArray(validationRule.values)
      ? validationRule.values
      : getCellRangeValues(validationRule.values);

    return (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(value)}
        className={error ? "error" : ""}
      >
        <option value="">-- Select --</option>
        {values.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
    );
  }

  // Regular input with validation
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!error) {
            onSave(value);
          }
        }}
        className={error ? "error" : ""}
      />
      {error && <div className="validation-error">{error}</div>}
    </div>
  );
};

// 4. Bulk validation
function validateAll(cells: Cell[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const cell of cells) {
    const result = validationManager.validate(cell.id, cell.value);

    if (!result.valid) {
      errors.push({
        cellId: cell.id,
        error: result.error,
      });
    }
  }

  return errors;
}

// 5. Data validation UI (settings dialog)
const DataValidationDialog: FC = ({ cellId }) => {
  const [rule, setRule] = useState<ValidationRule>({
    type: "list",
    values: [],
  });

  return (
    <Modal>
      <h2>Data Validation</h2>

      <label>
        Validation Type
        <select
          value={rule.type}
          onChange={(e) => setRule({ ...rule, type: e.target.value })}
        >
          <option value="list">List</option>
          <option value="range">Number Range</option>
          <option value="regex">Pattern</option>
          <option value="custom">Custom Formula</option>
        </select>
      </label>

      {rule.type === "list" && (
        <label>
          Values (comma-separated)
          <input
            type="text"
            onChange={(e) =>
              setRule({
                ...rule,
                values: e.target.value.split(",").map((v) => v.trim()),
              })
            }
          />
        </label>
      )}

      {rule.type === "range" && (
        <>
          <label>
            Min Value
            <input
              type="number"
              onChange={(e) =>
                setRule({ ...rule, min: Number(e.target.value) })
              }
            />
          </label>

          <label>
            Max Value
            <input
              type="number"
              onChange={(e) =>
                setRule({ ...rule, max: Number(e.target.value) })
              }
            />
          </label>
        </>
      )}

      <label>
        Error Message
        <input
          type="text"
          value={rule.errorMessage || ""}
          onChange={(e) => setRule({ ...rule, errorMessage: e.target.value })}
        />
      </label>

      <button onClick={() => validationManager.setRule(cellId, rule)}>
        Apply
      </button>
    </Modal>
  );
};
```

**Server-side Enforcement:**

```typescript
// Never trust client-side validation alone
// Always validate on server before saving

app.post("/api/cells/update", async (req, res) => {
  const { cellId, value } = req.body;

  // Get validation rule from database
  const rule = await getValidationRule(cellId);

  if (rule) {
    const result = validate(value, rule);

    if (!result.valid) {
      return res.status(400).json({
        error: result.error,
      });
    }
  }

  // Save value
  await updateCell(cellId, value);

  res.json({ success: true });
});
```

---

### Q15: What are the security implications of allowing users to execute formulas, and how do you mitigate them?

**Answer:**

**Risks:**

1. **Formula Injection** (CSV Injection)
2. **Cross-User Data Access**
3. **Denial of Service** (infinite loops, massive calculations)
4. **Information Leakage** (accessing unauthorized data via formulas)

**Mitigation Strategies:**

```typescript
// 1. Sandboxed Formula Execution
class SecureFormulaEvaluator {
  private allowedFunctions = new Set([
    "SUM",
    "AVERAGE",
    "IF",
    "VLOOKUP", // ... safe functions
  ]);

  private dangerousFunctions = new Set([
    "IMPORTXML",
    "IMPORTDATA",
    "IMPORTHTML", // Can fetch external data
    "EXEC",
    "SYSTEM", // Don't even exist, but block anyway
  ]);

  parse(formula: string): AST {
    // Parse formula
    const ast = parser.parse(formula);

    // Check for dangerous functions
    this.validateAST(ast);

    return ast;
  }

  private validateAST(ast: AST) {
    if (ast.type === "function") {
      const fnName = ast.name.toUpperCase();

      // Block dangerous functions
      if (this.dangerousFunctions.has(fnName)) {
        throw new SecurityError(
          `Function ${fnName} is not allowed for security reasons`
        );
      }

      // Block unknown functions
      if (!this.allowedFunctions.has(fnName)) {
        throw new Error(`Unknown function: ${fnName}`);
      }
    }

    // Recursively validate child nodes
    if (ast.arguments) {
      ast.arguments.forEach((arg) => this.validateAST(arg));
    }
  }

  // 2. Execution timeout (prevent infinite loops)
  evaluate(formula: string, context: FormulaContext): any {
    const startTime = Date.now();
    const maxExecutionTime = 5000; // 5 seconds

    const checkTimeout = () => {
      if (Date.now() - startTime > maxExecutionTime) {
        throw new Error("Formula execution timeout");
      }
    };

    // Inject timeout check into evaluation
    return this.evaluateWithTimeout(formula, context, checkTimeout);
  }

  // 3. Resource limits
  private maxCellReferences = 10000; // Max cells a formula can reference

  validateReferences(references: CellId[]) {
    if (references.length > this.maxCellReferences) {
      throw new Error(
        `Formula references too many cells (max: ${this.maxCellReferences})`
      );
    }
  }

  // 4. Permission checks (can only access authorized data)
  private async checkCellAccess(
    cellId: CellId,
    userId: UserId
  ): Promise<boolean> {
    const cell = await getCell(cellId);
    const spreadsheet = await getSpreadsheet(cell.spreadsheetId);

    return hasPermission(userId, spreadsheet, Permission.VIEW);
  }

  async evaluateSecure(
    formula: string,
    context: FormulaContext,
    userId: UserId
  ): Promise<any> {
    // Parse and validate
    const ast = this.parse(formula);

    // Extract all cell references
    const references = this.extractReferences(ast);

    // Check resource limits
    this.validateReferences(references);

    // Check permissions for all referenced cells
    for (const cellId of references) {
      const hasAccess = await this.checkCellAccess(cellId, userId);

      if (!hasAccess) {
        throw new SecurityError(`Access denied to cell ${cellId}`);
      }
    }

    // Evaluate with timeout
    return this.evaluate(formula, context);
  }
}

// 5. CSV Injection Prevention
function sanitizeForExport(value: any): string {
  let str = String(value);

  // Prefix dangerous characters
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str; // Single quote prefix neutralizes formula
  }

  return str;
}

// When exporting to CSV
function exportToCSV(cells: Cell[][]): string {
  return cells
    .map((row) => row.map((cell) => sanitizeForExport(cell.value)).join(","))
    .join("\n");
}

// 6. Rate limiting (prevent DoS)
const formulaRateLimiter = new RateLimiter();

async function evaluateFormula(userId: UserId, formula: string) {
  // Max 100 formulas per minute per user
  if (!formulaRateLimiter.isAllowed(userId, 100, 60000)) {
    throw new Error("Too many formula evaluations. Please slow down.");
  }

  return evaluator.evaluateSecure(formula, context, userId);
}

// 7. Audit logging
async function logFormulaExecution(
  userId: UserId,
  formula: string,
  cellId: CellId
) {
  await auditLog.create({
    userId,
    action: "FORMULA_EXECUTE",
    formula,
    cellId,
    timestamp: new Date(),
  });
}

// 8. Content Security Policy (prevent XSS in formulas)
// If formulas can return HTML (e.g., CONCATENATE with HTML)
function sanitizeFormulaResult(result: any): any {
  if (typeof result === "string") {
    // Remove script tags, event handlers
    return DOMPurify.sanitize(result, {
      ALLOWED_TAGS: ["b", "i", "u"],
      ALLOWED_ATTR: [],
    });
  }

  return result;
}
```

**Additional Security Measures:**

1. **Separate Formula Execution Environment**

   - Run formulas in separate process/container
   - Limit CPU, memory, network access

2. **Static Analysis**

   - Analyze formulas before execution
   - Detect suspicious patterns

3. **User Education**

   - Warn users about CSV injection risks
   - Display warnings when opening files with formulas

4. **Disable Dangerous Features by Default**
   - External data functions disabled for free users
   - Require explicit opt-in for advanced features

---

## 11. Summary & Architecture Rationale

### 11.1 Key Architectural Decisions

#### **1. State Management: Zustand + Immer**

**Rationale:**

- **Zustand** is lightweight (1KB), no Provider wrapper hell, easy to use
- **Immer** allows mutative syntax while maintaining immutability
- **Alternative considered**: Redux (too verbose, 100s of lines for simple updates)
- **Trade-off**: Less ecosystem support than Redux, but productivity gain outweighs it

**Why this matters**: In spreadsheets, state updates are frequent (every keystroke, scroll, selection change). Verbose state management slows development and increases bug surface.

#### **2. Virtualization: react-window with Custom Extensions**

**Rationale:**

- Can't render 1M+ DOM nodes without performance collapse
- `react-window` proven, maintained, extensible
- **Alternatives**: `react-virtualized` (heavier), custom solution (reinventing wheel)
- **Trade-off**: Complex scroll logic, dynamic heights require custom work

**Why this matters**: Virtualization is non-negotiable for large data. Without it, 100K cells = browser crash.

#### **3. Real-time Sync: WebSocket + Operational Transform**

**Rationale:**

- **WebSocket** for low-latency (<200ms), bidirectional communication
- **OT** for conflict resolution (proven by Google Docs, proven algorithms)
- **Alternatives**: HTTP polling (too slow), CRDT (higher memory overhead)
- **Trade-off**: OT is complex to implement correctly, but necessary for collaborative editing

**Why this matters**: Users expect Google Sheets-level real-time collaboration. Half-second delays feel broken.

#### **4. Formula Engine: Custom Parser + Function Registry**

**Rationale:**

- Need Excel compatibility (200+ functions)
- Existing libraries (`hot-formula-parser`) cover 80%, custom code for 20%
- **Alternatives**: Embed Excel engine (impossible), Web Assembly port (maintenance burden)
- **Trade-off**: Maintaining formula compatibility is ongoing work

**Why this matters**: Formulas are core value. Incompatibility with Excel = dealbreaker for many users.

#### **5. Offline Support: Service Worker + IndexedDB + Operation Queue**

**Rationale:**

- Users work on planes, in poor connectivity areas
- **Service Worker** caches static assets (JS, CSS)
- **IndexedDB** caches spreadsheet data
- **Operation Queue** ensures no data loss when offline
- **Alternatives**: No offline (poor UX), full client-side app (sync complexity)
- **Trade-off**: Conflict resolution complexity, storage limits

**Why this matters**: Offline is expected in 2024. Apps that break offline feel outdated.

#### **6. Performance: Lazy Loading + Code Splitting + Memoization**

**Rationale:**

- Initial bundle < 500KB (loads in <2s on 3G)
- Lazy load heavy features (charts, export, formula editor)
- Memoize expensive computations (formula calculation, format rendering)
- **Alternatives**: Load everything upfront (slow), over-optimize (premature)
- **Trade-off**: Complexity of split points, lazy boundaries

**Why this matters**: Users abandon apps that load slowly. <3s load time is table stakes.

### 11.2 Trade-off Analysis

| Decision                    | Pros                                | Cons                               | Verdict                           |
| --------------------------- | ----------------------------------- | ---------------------------------- | --------------------------------- |
| **Zustand over Redux**      | Simple, less code, no Provider hell | Less ecosystem, fewer devtools     | ✅ Worth it for productivity      |
| **OT over CRDT**            | Lower memory, proven                | Complex, server required           | ✅ Necessary for spreadsheets     |
| **Virtualization**          | Handles 1M+ cells                   | Complex scroll logic               | ✅ Non-negotiable                 |
| **Canvas over DOM**         | High performance                    | Lose accessibility, text selection | ❌ Only for specialized use cases |
| **TypeScript**              | Type safety, better DX              | Compile step, learning curve       | ✅ Essential for large codebases  |
| **Web Workers for parsing** | Non-blocking                        | Message passing overhead           | ✅ For files >1MB                 |
| **IndexedDB**               | Large storage (GB)                  | Async API, browser quirks          | ✅ For offline support            |

### 11.3 Scaling Considerations

**Current Architecture Handles:**

- ✅ 10M users (distributed load)
- ✅ 100 concurrent editors per sheet (OT, WebSocket)
- ✅ 10M cells per sheet (virtualization, sparse storage)
- ✅ 1000 formulas with dependencies (dependency graph)

**Future Scaling Needs:**

1. **100M+ cells per sheet**
   - Solution: Database-backed cells (load on demand), server-side calculation
2. **1000+ concurrent editors per sheet**
   - Solution: Sharding (split sheet into regions), eventual consistency
3. **Complex formulas (10K+ dependencies)**

   - Solution: Server-side formula worker pool, caching

4. **Real-time across continents (high latency)**
   - Solution: Regional servers, CRDT hybrid (eventual consistency)

### 11.4 Future Improvements

1. **Micro-frontends** (for large teams)

   - Split grid, toolbar, sidebar into separate apps
   - Pros: Independent deployments, team autonomy
   - Cons: Complexity, shared state challenges

2. **WebAssembly for formula engine**

   - Port calculation engine to Rust/C++
   - Pros: 10-100x faster calculations
   - Cons: Larger bundle, compilation complexity

3. **AI-powered features**

   - Formula suggestions (autocomplete)
   - Data cleaning (detect/fix errors)
   - Smart formatting (detect patterns)

4. **Advanced collaboration**

   - Voice/video chat in app
   - Screen sharing for specific cells
   - Mentions, threaded comments

5. **Mobile optimization**
   - Touch-optimized UI
   - Reduced bundle for mobile networks
   - Offline-first mobile app

### 11.5 Why This Architecture? (Interview Answer)

When asked "Why did you choose this architecture?", here's the response:

**"I designed this architecture with three core principles:**

**1. Performance at Scale**: The virtualized grid can handle millions of cells without degradation. We render only what's visible (200 cells vs 1M), use memoization to prevent unnecessary re-renders, and leverage Web Workers for heavy computation. This ensures 60 FPS interactions even with large datasets.

**2. Real-time Collaboration**: The WebSocket + Operational Transform approach provides sub-200ms sync latency across users. OT handles conflict resolution automatically, so concurrent edits don't overwrite each other. This is the same approach Google Docs uses—it's proven at massive scale.

**3. Developer Productivity**: Zustand + Immer lets us write clean, maintainable code without Redux boilerplate. TypeScript catches bugs at compile time. Component architecture (smart/presentational) makes testing and reuse easy. This architecture minimizes bug surface while maximizing velocity.

**Trade-offs I accepted:**

- OT is complex to implement, but necessary for collaboration
- Virtualization adds scroll complexity, but unlocks massive datasets
- Offline support adds sync complexity, but is expected by users

**This architecture is production-ready, scalable to 10M users, and maintainable by a team of engineers. It prioritizes the right things: performance, collaboration, and maintainability."**

---

## Conclusion

This High-Level Design covers a production-grade collaborative spreadsheet application from architecture to implementation details. The design prioritizes:

1. **Performance**: <2s load, 60 FPS interactions, handles 10M cells
2. **Scalability**: 10M users, 100 concurrent editors, distributed architecture
3. **Reliability**: Offline support, auto-save, conflict resolution
4. **Maintainability**: Clean architecture, typed code, comprehensive testing

**Key Takeaways for Interviews:**

- Always justify decisions with trade-offs (not just "it's better")
- Provide concrete metrics (not "fast", but "<100ms latency")
- Show awareness of edge cases (circular deps, concurrent edits, offline conflicts)
- Demonstrate production experience (monitoring, error handling, security)

This architecture can scale from MVP to Google Sheets-level application while maintaining code quality and developer productivity.
