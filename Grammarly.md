Grammarly Frontend - High-Level Design (HLD)

1. Problem Statement & Requirements
   Problem Statement
   Grammarly is a real-time writing assistant that needs to provide instantaneous grammar, spelling, and style suggestions across multiple platforms (web editor, browser extensions, mobile apps, third-party integrations). The system must process text input with minimal latency (<100ms for detection, <50ms for UI updates), handle documents of varying sizes (from tweets to 100+ page documents), and work seamlessly across different text input contexts.
   Core Challenges:
   Real-time text analysis with minimal perceived latency
   Synchronization across multiple devices and platforms
   Handling rich text formatting and complex document structures
   Providing contextual suggestions without disrupting writing flow
   Working in diverse environments (Gmail, Google Docs, Word, native editor)
   Offline capability for basic grammar checking
   Privacy-sensitive data handling (user documents)
   Functional Requirements
   Core Features:
   Real-time Grammar & Spell Check

Detect errors as user types (debounced, <100ms)
Underline errors inline with severity indicators
Provide correction suggestions on hover/click
Support multiple languages
Writing Suggestions

Clarity improvements
Tone detection and adjustment
Vocabulary enhancement
Plagiarism detection (premium)
AI-powered rewrites (premium)
Document Management

Create/edit/delete documents
Auto-save (every 2-3 seconds)
Version history
Cross-device synchronization
Folder organization
User Settings & Preferences

Writing goals (audience, formality, intent)
Personal dictionary
Language preferences
Suggestion filters
Performance Metrics Dashboard

Writing statistics
Vocabulary usage
Productivity tracking
Weekly insights
User Roles:
Free users (basic grammar/spelling)
Premium users (advanced features)
Business users (team features, brand guidelines)
Enterprise users (SSO, admin controls)
Non-Functional Requirements
Performance Metrics:
Metric
Target
Critical Threshold
Initial Load Time (FCP)
<1.2s
<2s
Time to Interactive (TTI)
<2.5s
<4s
Largest Contentful Paint (LCP)
<2.0s
<2.5s
First Input Delay (FID)
<50ms
<100ms
Cumulative Layout Shift (CLS)
<0.1
<0.25
Text Analysis Latency
<100ms
<200ms
UI Update Latency
<16ms (60fps)
<33ms (30fps)
Auto-save Latency
<500ms
<1s
Bundle Size (Initial)
<200KB gzip
<300KB gzip
Bundle Size (Total)
<800KB gzip
<1.2MB gzip
Memory Usage
<100MB
<200MB
API Response Time (p95)
<200ms
<500ms

Availability & Reliability:
99.9% uptime for core features
Graceful degradation when API is unavailable
Offline mode for basic grammar checking
Data persistence during network failures
Scalability:
Support 20M+ DAU
Handle 500K+ concurrent users
Process 1B+ corrections per day
Sync across 5+ devices per user
Security:
End-to-end encryption for documents
No server-side storage of free user documents
SOC 2 Type II compliance
GDPR compliance
Scale Estimates
User Metrics:
Total Users: 30M+
Daily Active Users (DAU): 20M
Peak Concurrent Users: 500K
Average Session Duration: 25 minutes
Sessions per User per Day: 2.5
Data Transfer:
Text Analysis Requests: 1.5B/day
Average Request Size: 2KB
Average Response Size: 5KB
Total Data Transfer: ~10TB/day
WebSocket Messages: 5B/day
Document Metrics:
Average Document Size: 3KB
Max Document Size: 2MB
Documents Created per Day: 5M
Auto-save Operations: 50M/day
Infrastructure:
CDN Traffic: 50TB/month
API Requests: 2B/day
WebSocket Connections: 500K concurrent
Cache Hit Rate Target: >85%

2. High-Level Architecture
   Architecture Overview Diagram
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ CLIENT LAYER (Browser) │
   ├─────────────────────────────────────────────────────────────────────────┤
   │ │
   │ ┌────────────────────────────────────────────────────────────────┐ │
   │ │ Application Shell │ │
   │ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │
   │ │ │ Router │ │ Auth Guard │ │Error Boundary│ │ │
   │ │ └──────────────┘ └──────────────┘ └──────────────┘ │ │
   │ └────────────────────────────────────────────────────────────────┘ │
   │ │
   │ ┌────────────────────────────────────────────────────────────────┐ │
   │ │ Feature Modules │ │
   │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
   │ │ │ Editor │ │Dashboard │ │Settings │ │Documents │ │ │
   │ │ │ Module │ │ Module │ │ Module │ │ Module │ │ │
   │ │ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
   │ └───────┼────────────┼────────────┼────────────┼────────────────┘ │
   │ │ │ │ │ │
   │ ┌───────┴────────────┴────────────┴────────────┴────────────────┐ │
   │ │ State Management Layer │ │
   │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
   │ │ │ Document │ │Suggestions│ │ User │ │ UI │ │ │
   │ │ │ Store │ │ Store │ │ Store │ │ Store │ │ │
   │ │ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
   │ └───────┼────────────┼────────────┼────────────┼────────────────┘ │
   │ │ │ │ │ │
   │ ┌───────┴────────────┴────────────┴────────────┴────────────────┐ │
   │ │ Service Layer │ │
   │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
   │ │ │ Text │ │ API │ │WebSocket │ │ Cache │ │ │
   │ │ │Analyzer │ │ Client │ │ Manager │ │ Manager │ │ │
   │ │ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
   │ └───────┼────────────┼────────────┼────────────┼────────────────┘ │
   │ │ │ │ │ │
   │ ┌───────┴────────────┴────────────┴────────────┴────────────────┐ │
   │ │ Infrastructure Layer │ │
   │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
   │ │ │IndexedDB │ │ Local │ │ Service │ │ Web │ │ │
   │ │ │ │ │ Storage │ │ Worker │ │ Worker │ │ │
   │ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
   │ └─────────────────────────────────────────────────────────────────┘ │
   │ │
   └────────────────────┬──────────────────┬──────────────────┬──────────────┘
   │ │ │
   ▼ ▼ ▼
   ┌───────────────────┐ ┌──────────────┐ ┌──────────────────┐
   │ REST API │ │ WebSocket │ │ CDN Assets │
   │ Gateway │ │ Server │ │ │
   └───────────────────┘ └──────────────┘ └──────────────────┘

Component Hierarchy Diagram
App
├── AppShell
│ ├── ErrorBoundary
│ ├── AuthProvider
│ ├── ThemeProvider
│ └── ToastProvider
│
├── Router
│ ├── PublicRoute
│ │ ├── LandingPage
│ │ └── LoginPage
│ │
│ └── PrivateRoute
│ ├── EditorPage
│ │ ├── EditorHeader
│ │ │ ├── DocumentTitle
│ │ │ ├── SaveIndicator
│ │ │ └── ToolbarActions
│ │ │
│ │ ├── EditorContent
│ │ │ ├── TextEditor (Main)
│ │ │ │ ├── EditorToolbar
│ │ │ │ ├── ContentArea
│ │ │ │ │ ├── Line (Virtual)
│ │ │ │ │ └── Decoration (Underlines)
│ │ │ │ └── Cursor
│ │ │ │
│ │ │ └── SuggestionPanel
│ │ │ ├── SuggestionCard
│ │ │ │ ├── ErrorIcon
│ │ │ │ ├── Description
│ │ │ │ ├── Replacements
│ │ │ │ └── ActionButtons
│ │ │ │
│ │ │ └── AssistantCard (AI)
│ │ │
│ │ └── EditorFooter
│ │ ├── WordCount
│ │ ├── ReadingTime
│ │ └── GoalProgress
│ │
│ ├── DashboardPage
│ │ ├── StatsOverview
│ │ ├── RecentDocuments
│ │ └── WeeklyInsights
│ │
│ ├── DocumentsPage
│ │ ├── FolderTree
│ │ ├── DocumentList (Virtual)
│ │ └── DocumentPreview
│ │
│ └── SettingsPage
│ ├── ProfileSettings
│ ├── WritingGoals
│ └── PersonalDictionary
│
└── GlobalComponents
├── Modal
├── Dropdown
├── Tooltip
└── Spinner

Data Flow Diagram
┌─────────────┐
│ User │
│ Types │
└──────┬──────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Text Editor Component │
│ • Debounce (150ms) │
│ • Calculate diff from previous state │
└──────┬──────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Text Analyzer Service (Local) │
│ • Tokenize text │
│ • Basic spell check (dictionary lookup) │
│ • Identify potential errors locally │
└──────┬──────────────────────────────────────────────────────┘
│
├─────────────────┬──────────────────┬─────────────────┐
▼ ▼ ▼ ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Update UI │ │ Auto-save│ │ API │ │WebSocket │
│Optimistic│ │ Queue │ │ Request │ │ Event │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
│ │ │ │
│ │ │ │
▼ ▼ ▼ ▼
┌─────────────────────────────────────────────────────────────┐
│ Document Store │
│ • Merge local suggestions │
│ • Queue auto-save operations │
│ • Dispatch API requests │
│ • Listen to real-time updates │
└──────┬──────────────────────────────────────────────────────┘
│
├──────────────────────┬──────────────────────────────┐
▼ ▼ ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ IndexedDB │ │ API Server │ │ CDN Cache │
│ (Offline) │ │ (Analysis) │ │ (Assets) │
└──────┬───────┘ └──────┬───────┘ └──────────────┘
│ │
│ ▼
│ ┌──────────────┐
│ │ Response │
│ │ + Server │
│ │ Suggestions │
│ └──────┬───────┘
│ │
▼ ▼
┌─────────────────────────────────────────────────────────────┐
│ Suggestion Store (Update) │
│ • Merge server suggestions with local │
│ • Calculate decoration positions │
│ • Trigger re-render of affected lines only │
└──────┬──────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Editor Re-renders (Optimized) │
│ • Only affected lines/decorations │
│ • Virtual scrolling for large documents │
└─────────────────────────────────────────────────────────────┘

Architecture Principles

1. Optimistic UI Updates
   WHY: In a writing assistant, perceived latency is critical. Users should
   never feel the system is lagging behind their typing. By updating the UI
   optimistically and showing immediate feedback, we maintain the illusion
   of instant response while network operations happen in the background.

IMPLEMENTATION:

- Local spell-check runs first (dictionary lookup, <10ms)
- UI updates immediately with local suggestions
- Server analysis runs in parallel
- Server results merge/override local results when ready

2. Hybrid Local-Server Architecture
   WHY: Full server-side processing would introduce unacceptable latency
   (network RTT + processing time). Full client-side would miss advanced
   ML-based suggestions. Hybrid approach gets best of both worlds.

IMPLEMENTATION:

- Local: Basic grammar rules, spell-check dictionary (WASM for speed)
- Server: Advanced ML models, plagiarism, context-aware suggestions
- Progressive enhancement: Basic → Advanced suggestions

3. Virtual Rendering for Scale
   WHY: Rendering a 100-page document (50K+ words, 200K+ characters) with
   thousands of decorations would create 10K+ DOM nodes, causing browser
   performance degradation. Virtual rendering keeps DOM nodes constant.

IMPLEMENTATION:

- Only render visible viewport + buffer (±1 screen height)
- Recycle DOM nodes as user scrolls
- Maintain decoration map separately from DOM
- Target: Constant 60fps scroll regardless of document size

4. Event-Driven State Updates
   WHY: Multiple services need to react to text changes (analyzer, auto-save,
   sync, etc.). Event-driven architecture decouples these concerns and allows
   parallel processing without blocking the main thread.

IMPLEMENTATION:

- Document changes emit events to event bus
- Services subscribe to relevant events
- Each service processes independently
- No direct coupling between features

5. Immutable State with Structural Sharing
   WHY: Prevents accidental mutations, enables time-travel debugging, makes
   state changes predictable. Structural sharing keeps memory efficient.

IMPLEMENTATION:

- Immer for immutable updates
- Shallow comparison for React re-render optimization
- Memoization of expensive computations
- State history for undo/redo

System Invariants
INVARIANT 1: User Input Never Blocks
RULE: No operation can block the main thread for >16ms (60fps budget)
ENFORCEMENT:

- Text analysis runs in Web Worker
- Heavy computations debounced/throttled
- Long operations split into chunks with requestIdleCallback
- Auto-save is async and non-blocking

INVARIANT 2: Data Consistency Across Devices
RULE: Last-write-wins with vector clocks for conflict resolution
ENFORCEMENT:

- Every change has timestamp + device ID
- Server maintains authoritative version
- Optimistic updates can be rolled back
- Conflicts surface to user only when semantic (not positional)

INVARIANT 3: Offline Capability
RULE: Core editing features work offline, data persists
ENFORCEMENT:

- Service Worker caches app shell
- IndexedDB stores documents
- Queue API calls when offline
- Sync on reconnection

INVARIANT 4: Zero Data Loss
RULE: User content is never lost, even on crash
ENFORCEMENT:

- Auto-save every 2-3 seconds
- Changes persisted to IndexedDB immediately
- Unsaved changes recovered on app restart
- Server backup on every successful save

INVARIANT 5: Privacy by Default
RULE: Free user documents never leave client (except for analysis API)
ENFORCEMENT:

- Analysis API stateless, documents not stored
- Premium features require explicit opt-in
- Encryption in transit
- No analytics on document content

3. Component Architecture
   Component Breakdown
   ┌────────────────────────────────────────────────────────────────┐
   │ ATOMIC DESIGN │
   ├────────────────────────────────────────────────────────────────┤
   │ │
   │ ATOMS (Basic Building Blocks) │
   │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
   │ │ Button │ │ Icon │ │ Badge │ │ Input │ │
   │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
   │ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
   │ │ Label │ │ Spinner │ │ Avatar │ │
   │ └──────────┘ └──────────┘ └──────────┘ │
   │ │
   │ MOLECULES (Simple Compositions) │
   │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
   │ │FormField │ │ SearchBar │ │ DropdownMenu │ │
   │ │ - Label │ │ - Icon │ │ - Trigger │ │
   │ │ - Input │ │ - Input │ │ - Portal │ │
   │ │ - Error │ │ - Results │ │ - Items │ │
   │ └──────────────┘ └──────────────┘ └──────────────┘ │
   │ │
   │ ORGANISMS (Complex Components) │
   │ ┌──────────────────────────────────────────────────┐ │
   │ │ SuggestionCard │ │
   │ │ ┌────────────────────────────────────────────┐ │ │
   │ │ │ Header │ │ │
   │ │ │ - ErrorType Badge │ │ │
   │ │ │ - Severity Icon │ │ │
   │ │ │ - Dismiss Button │ │ │
   │ │ ├────────────────────────────────────────────┤ │ │
   │ │ │ Body │ │ │
   │ │ │ - Original Text (highlighted) │ │ │
   │ │ │ - Explanation │ │ │
   │ │ │ - Suggested Replacements (clickable) │ │ │
   │ │ ├────────────────────────────────────────────┤ │ │
   │ │ │ Footer │ │ │
   │ │ │ - Accept/Reject Buttons │ │ │
   │ │ │ - "See More" Link │ │ │
   │ │ └────────────────────────────────────────────┘ │ │
   │ └──────────────────────────────────────────────────┘ │
   │ │
   │ TEMPLATES (Page Layouts) │
   │ ┌──────────────────────────────────────────────────┐ │
   │ │ EditorTemplate │ │
   │ │ - Header Slot │ │
   │ │ - Main Content Slot (Editor + Sidebar) │ │
   │ │ - Footer Slot │ │
   │ └──────────────────────────────────────────────────┘ │
   │ │
   └────────────────────────────────────────────────────────────────┘

Smart vs Dumb Components Pattern
// ============================================
// DUMB COMPONENT (Presentational)
// ============================================
// Concerns: How things LOOK
// - No business logic
// - Receives data via props
// - Emits events via callbacks
// - Highly reusable
// - Easy to test

interface SuggestionCardProps {
suggestion: {
id: string;
type: 'grammar' | 'spelling' | 'clarity' | 'tone';
severity: 'error' | 'warning' | 'info';
originalText: string;
explanation: string;
replacements: string[];
position: { start: number; end: number };
};
onAccept: (suggestionId: string, replacement: string) => void;
onReject: (suggestionId: string) => void;
onDismiss: (suggestionId: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
suggestion,
onAccept,
onReject,
onDismiss
}) => {
return (
<Card className={`suggestion-card severity-${suggestion.severity}`}>
<CardHeader>
<Badge variant={suggestion.type}>{suggestion.type}</Badge>
<IconButton onClick={() => onDismiss(suggestion.id)}>
<CloseIcon />
</IconButton>
</CardHeader>

      <CardBody>
        <HighlightedText text={suggestion.originalText} />
        <Explanation>{suggestion.explanation}</Explanation>

        <ReplacementList>
          {suggestion.replacements.map((replacement, idx) => (
            <ReplacementItem
              key={idx}
              onClick={() => onAccept(suggestion.id, replacement)}
            >
              {replacement}
            </ReplacementItem>
          ))}
        </ReplacementList>
      </CardBody>

      <CardFooter>
        <Button variant="secondary" onClick={() => onReject(suggestion.id)}>
          Ignore
        </Button>
      </CardFooter>
    </Card>

);
};

// ============================================
// SMART COMPONENT (Container)
// ============================================
// Concerns: How things WORK
// - Business logic
// - State management
// - API calls
// - Orchestrates dumb components

export const SuggestionCardContainer: React.FC<{ suggestionId: string }> = ({
suggestionId
}) => {
// Connect to state management
const suggestion = useSuggestionStore(state =>
state.suggestions.find(s => s.id === suggestionId)
);

const { applySuggestion, rejectSuggestion, dismissSuggestion } =
useSuggestionActions();

// Track user interactions for analytics
const { trackEvent } = useAnalytics();

const handleAccept = useCallback((id: string, replacement: string) => {
applySuggestion(id, replacement);
trackEvent('suggestion_accepted', {
type: suggestion.type,
replacementIndex: suggestion.replacements.indexOf(replacement)
});
}, [applySuggestion, trackEvent, suggestion]);

const handleReject = useCallback((id: string) => {
rejectSuggestion(id);
trackEvent('suggestion_rejected', { type: suggestion.type });
}, [rejectSuggestion, trackEvent, suggestion]);

if (!suggestion) return null;

// Pass data and callbacks to presentational component
return (
<SuggestionCard
      suggestion={suggestion}
      onAccept={handleAccept}
      onReject={handleReject}
      onDismiss={dismissSuggestion}
    />
);
};

Compound Components Pattern
// ============================================
// COMPOUND COMPONENTS
// ============================================
// Used for: Complex components with shared state
// Benefits: Flexible composition, implicit prop passing
// Example: Dropdown, Tabs, Accordion

// Context for shared state
const DropdownContext = createContext<{
isOpen: boolean;
toggle: () => void;
close: () => void;
selectedValue: string | null;
onSelect: (value: string) => void;
} | null>(null);

// Main component manages state
export const Dropdown: React.FC<{
children: React.ReactNode;
onSelect?: (value: string) => void;
}> & {
Trigger: typeof DropdownTrigger;
Menu: typeof DropdownMenu;
Item: typeof DropdownItem;
} = ({ children, onSelect }) => {
const [isOpen, setIsOpen] = useState(false);
const [selectedValue, setSelectedValue] = useState<string | null>(null);

const toggle = () => setIsOpen(prev => !prev);
const close = () => setIsOpen(false);

const handleSelect = (value: string) => {
setSelectedValue(value);
onSelect?.(value);
close();
};

return (
<DropdownContext.Provider value={{
      isOpen,
      toggle,
      close,
      selectedValue,
      onSelect: handleSelect
    }}>

<div className="dropdown">{children}</div>
</DropdownContext.Provider>
);
};

// Sub-components consume context
const DropdownTrigger: React.FC<{ children: React.ReactNode }> = ({
children
}) => {
const context = useContext(DropdownContext);
if (!context) throw new Error('DropdownTrigger must be used within Dropdown');

return (
<button onClick={context.toggle} className="dropdown-trigger">
{children}
</button>
);
};

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({
children
}) => {
const context = useContext(DropdownContext);
if (!context) throw new Error('DropdownMenu must be used within Dropdown');

if (!context.isOpen) return null;

return (
<Portal>

<div className="dropdown-menu">
{children}
</div>
</Portal>
);
};

const DropdownItem: React.FC<{
value: string;
children: React.ReactNode;
}> = ({ value, children }) => {
const context = useContext(DropdownContext);
if (!context) throw new Error('DropdownItem must be used within Dropdown');

return (
<button
onClick={() => context.onSelect(value)}
className={context.selectedValue === value ? 'selected' : ''} >
{children}
</button>
);
};

// Attach sub-components
Dropdown.Trigger = DropdownTrigger;
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;

// Usage - Clean and composable
<Dropdown onSelect={handleLanguageSelect}>
<Dropdown.Trigger>
Select Language
</Dropdown.Trigger>
<Dropdown.Menu>
<Dropdown.Item value="en">English</Dropdown.Item>
<Dropdown.Item value="es">Spanish</Dropdown.Item>
<Dropdown.Item value="fr">French</Dropdown.Item>
</Dropdown.Menu>
</Dropdown>

Component API Design
// ============================================
// TEXT EDITOR COMPONENT API
// ============================================

interface EditorProps {
// Document data
documentId: string;
initialContent?: string;

// Configuration
readonly?: boolean;
autoFocus?: boolean;
spellCheck?: boolean;

// Performance tuning
debounceMs?: number; // Default: 150ms
autosaveIntervalMs?: number; // Default: 2000ms
virtualScrolling?: boolean; // Default: true

// Feature flags
enableGrammarCheck?: boolean; // Default: true
enableStyleSuggestions?: boolean; // Default: true (premium)
enableAIRewrites?: boolean; // Default: false (premium)

// Callbacks
onChange?: (content: string, delta: Delta) => void;
onSave?: (content: string) => Promise<void>;
onError?: (error: Error) => void;
onSelection?: (range: Range) => void;

// Styling
className?: string;
theme?: 'light' | 'dark' | 'auto';
font?: {
family: string;
size: number;
lineHeight: number;
};
}

interface EditorRef {
// Imperative API for parent components
focus: () => void;
blur: () => void;
getContent: () => string;
setContent: (content: string) => void;
insertText: (text: string, position?: number) => void;
getSelection: () => Range | null;
setSelection: (range: Range) => void;
undo: () => void;
redo: () => void;
save: () => Promise<void>;
}

export const TextEditor = forwardRef<EditorRef, EditorProps>((props, ref) => {
// Implementation
});

// ============================================
// SUGGESTION PANEL API
// ============================================

interface SuggestionPanelProps {
// Data
documentId: string;

// Filters
showTypes?: Array<'grammar' | 'spelling' | 'clarity' | 'tone'>;
severityFilter?: Array<'error' | 'warning' | 'info'>;

// UI Configuration
position?: 'right' | 'bottom' | 'floating';
width?: number;
maxHeight?: number;

// Behavior
autoFocus?: boolean; // Focus suggestion when it appears
dismissOnAccept?: boolean;
groupBy?: 'type' | 'severity' | 'position';

// Callbacks
onSuggestionClick?: (suggestionId: string) => void;
onAccept?: (suggestionId: string, replacement: string) => void;
onReject?: (suggestionId: string) => void;

// Performance
virtualScroll?: boolean; // For 100+ suggestions
}

Component Responsibility Matrix
Component
Responsibilities
Does NOT Handle
TextEditor

- Render editable content<br>- Handle user input<br>- Manage cursor/selection<br>- Emit change events<br>- Apply decorations
- Text analysis<br>- Auto-save logic<br>- Suggestion generation
  SuggestionPanel
- Display suggestions<br>- Handle accept/reject<br>- Filter/sort suggestions<br>- Virtual scrolling
- Suggestion generation<br>- State persistence<br>- API communication
  DocumentManager
- Load/save documents<br>- Manage document list<br>- Handle folders<br>- Sync across devices
- Text editing<br>- Suggestion logic<br>- UI rendering
  AnalyzerService
- Tokenize text<br>- Run local analysis<br>- Trigger server analysis<br>- Merge results
- UI updates<br>- State management<br>- Network layer
  SyncService
- Detect changes<br>- Queue sync operations<br>- Handle conflicts<br>- Manage offline queue
- Document editing<br>- User preferences<br>- Analytics

4. State Management
   Global State Structure
   // ============================================
   // COMPLETE STATE TREE
   // ============================================

interface AppState {
// Authentication & User
auth: {
user: {
id: string;
email: string;
name: string;
avatar: string | null;
plan: 'free' | 'premium' | 'business';
subscription: {
status: 'active' | 'canceled' | 'expired';
expiresAt: string;
} | null;
} | null;
token: string | null;
isLoading: boolean;
error: string | null;
};

// Active Document
document: {
id: string | null;
title: string;
content: string; // Plain text representation
richContent: Delta; // Quill/ProseMirror delta
metadata: {
createdAt: string;
updatedAt: string;
wordCount: number;
characterCount: number;
readingTime: number; // minutes
};

    // Editing state
    selection: {
      start: number;
      end: number;
    } | null;

    // Save state
    saveState: {
      status: 'saved' | 'saving' | 'unsaved' | 'error';
      lastSavedAt: string | null;
      error: string | null;
    };

    // History for undo/redo
    history: {
      past: Delta[];
      future: Delta[];
      maxSize: number; // Default: 50
    };

};

// Suggestions (Server State)
suggestions: {
items: Map<string, Suggestion>; // Key: suggestion ID
byPosition: Map<number, string[]>; // Position -> Suggestion IDs

    // Loading state
    isAnalyzing: boolean;
    lastAnalysisAt: string | null;

    // Filters
    filters: {
      types: Set<SuggestionType>;
      severities: Set<SeverityLevel>;
      showIgnored: boolean;
    };

    // User actions
    accepted: Set<string>; // Accepted suggestion IDs
    rejected: Set<string>; // Rejected suggestion IDs
    dismissed: Set<string>; // Dismissed for this session

};

// UI State
ui: {
// Theme
theme: 'light' | 'dark' | 'auto';

    // Layout
    layout: {
      sidebarOpen: boolean;
      suggestionPanelPosition: 'right' | 'bottom' | 'floating';
      suggestionPanelWidth: number;
    };

    // Active views
    activeView: 'editor' | 'documents' | 'dashboard' | 'settings';

    // Modals
    modals: {
      documentSettings: boolean;
      goalSettings: boolean;
      upgrade: boolean;
    };

    // Toasts/Notifications
    toasts: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      duration: number;
    }>;

    // Loading indicators
    loading: {
      documentList: boolean;
      userSettings: boolean;
    };

};

// User Preferences (Persisted)
preferences: {
writing: {
goals: {
audience: 'general' | 'knowledgeable' | 'expert';
formality: 'informal' | 'neutral' | 'formal';
domain: 'general' | 'academic' | 'business' | 'creative';
};
language: string; // ISO code
dialect: string; // e.g., 'en-US', 'en-GB'
};

    editor: {
      fontSize: number;
      fontFamily: string;
      lineHeight: number;
      spellCheck: boolean;
      autoCapitalize: boolean;
    };

    suggestions: {
      enabledTypes: Set<SuggestionType>;
      autoAccept: boolean;
      soundEffects: boolean;
    };

    // Personal dictionary
    dictionary: {
      customWords: Set<string>;
      ignoredWords: Set<string>;
    };

};

// Documents List (Server State)
documents: {
items: Document[];
folders: Folder[];

    // Pagination
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };

    // Sorting/Filtering
    sortBy: 'updatedAt' | 'createdAt' | 'title';
    sortOrder: 'asc' | 'desc';
    searchQuery: string;

    // Loading state
    isLoading: boolean;
    error: string | null;

};

// Network State
network: {
isOnline: boolean;
syncStatus: 'synced' | 'syncing' | 'pending' | 'error';
pendingOperations: Array<{
id: string;
type: 'save' | 'delete' | 'update';
timestamp: string;
retries: number;
}>;
};
}

// Example state instance
const exampleState: AppState = {
auth: {
user: {
id: "usr_123456",
email: "user@example.com",
name: "John Doe",
avatar: "https://cdn.example.com/avatars/usr_123456.jpg",
plan: "premium",
subscription: {
status: "active",
expiresAt: "2026-12-31T23:59:59Z"
}
},
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
isLoading: false,
error: null
},

document: {
id: "doc_abc123",
title: "Product Requirements Document",
content: "The quick brown fox jumps over the lazy dog...",
richContent: {
ops: [
{ insert: "The quick brown fox " },
{ insert: "jumps", attributes: { bold: true } },
{ insert: " over the lazy dog\n" }
]
},
metadata: {
createdAt: "2026-01-10T10:00:00Z",
updatedAt: "2026-01-14T15:30:00Z",
wordCount: 1250,
characterCount: 6890,
readingTime: 5
},
selection: { start: 45, end: 45 },
saveState: {
status: "saved",
lastSavedAt: "2026-01-14T15:30:00Z",
error: null
},
history: {
past: [],
future: [],
maxSize: 50
}
},

suggestions: {
items: new Map([
["sug_001", {
id: "sug_001",
type: "spelling",
severity: "error",
position: { start: 20, end: 25 },
originalText: "teh",
explanation: "Possible spelling mistake found.",
replacements: ["the", "tea", "ten"],
category: "spelling"
}]
]),
byPosition: new Map([[20, ["sug_001"]]]),
isAnalyzing: false,
lastAnalysisAt: "2026-01-14T15:30:05Z",
filters: {
types: new Set(['grammar', 'spelling', 'clarity']),
severities: new Set(['error', 'warning']),
showIgnored: false
},
accepted: new Set(),
rejected: new Set(),
dismissed: new Set()
},

ui: {
theme: "auto",
layout: {
sidebarOpen: true,
suggestionPanelPosition: "right",
suggestionPanelWidth: 320
},
activeView: "editor",
modals: {
documentSettings: false,
goalSettings: false,
upgrade: false
},
toasts: [],
loading: {
documentList: false,
userSettings: false
}
},

preferences: {
writing: {
goals: {
audience: "general",
formality: "neutral",
domain: "business"
},
language: "en",
dialect: "en-US"
},
editor: {
fontSize: 16,
fontFamily: "Inter",
lineHeight: 1.6,
spellCheck: true,
autoCapitalize: true
},
suggestions: {
enabledTypes: new Set(['grammar', 'spelling', 'clarity', 'tone']),
autoAccept: false,
soundEffects: true
},
dictionary: {
customWords: new Set(["Grammarly", "OAuth"]),
ignoredWords: new Set(["gonna", "wanna"])
}
},

documents: {
items: [],
folders: [],
pagination: {
page: 1,
pageSize: 20,
total: 45,
hasMore: true
},
sortBy: "updatedAt",
sortOrder: "desc",
searchQuery: "",
isLoading: false,
error: null
},

network: {
isOnline: true,
syncStatus: "synced",
pendingOperations: []
}
};

State Management Implementation (Zustand)
// ============================================
// WHY ZUSTAND OVER REDUX/CONTEXT
// ============================================
// 1. Less boilerplate than Redux
// 2. Better performance than Context (no re-render cascade)
// 3. Built-in devtools support
// 4. Simpler mental model
// 5. Easy to split stores (feature-based)
// 6. Middleware support (persist, immer)

import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================
// DOCUMENT STORE
// ============================================

interface DocumentStore {
// State
id: string | null;
title: string;
content: string;
richContent: Delta;
selection: Range | null;
saveState: SaveState;
history: History;

// Actions
setDocument: (doc: Document) => void;
updateContent: (delta: Delta) => void;
setSelection: (range: Range | null) => void;
save: () => Promise<void>;
undo: () => void;
redo: () => void;
}

export const useDocumentStore = create<DocumentStore>()(
devtools(
immer(
persist(
(set, get) => ({
// Initial state
id: null,
title: 'Untitled',
content: '',
richContent: { ops: [] },
selection: null,
saveState: { status: 'saved', lastSavedAt: null, error: null },
history: { past: [], future: [], maxSize: 50 },

          // Actions
          setDocument: (doc) => set((state) => {
            state.id = doc.id;
            state.title = doc.title;
            state.content = doc.content;
            state.richContent = doc.richContent;
            state.saveState = { status: 'saved', lastSavedAt: new Date().toISOString(), error: null };
          }),

          updateContent: (delta) => set((state) => {
            // Add current state to history
            if (state.history.past.length >= state.history.maxSize) {
              state.history.past.shift();
            }
            state.history.past.push(state.richContent);
            state.history.future = []; // Clear redo stack

            // Update content
            state.richContent = delta;
            state.content = deltaToPlainText(delta);
            state.saveState.status = 'unsaved';

            // Update metadata
            state.metadata = {
              ...state.metadata,
              updatedAt: new Date().toISOString(),
              wordCount: countWords(state.content),
              characterCount: state.content.length
            };
          }),

          setSelection: (range) => set((state) => {
            state.selection = range;
          }),

          save: async () => {
            const state = get();
            if (!state.id || state.saveState.status === 'saved') return;

            set((draft) => {
              draft.saveState.status = 'saving';
            });

            try {
              await apiClient.documents.update(state.id, {
                title: state.title,
                content: state.content,
                richContent: state.richContent
              });

              set((draft) => {
                draft.saveState = {
                  status: 'saved',
                  lastSavedAt: new Date().toISOString(),
                  error: null
                };
              });
            } catch (error) {
              set((draft) => {
                draft.saveState = {
                  status: 'error',
                  lastSavedAt: draft.saveState.lastSavedAt,
                  error: error.message
                };
              });
            }
          },

          undo: () => set((state) => {
            if (state.history.past.length === 0) return;

            const previous = state.history.past.pop()!;
            state.history.future.unshift(state.richContent);
            state.richContent = previous;
            state.content = deltaToPlainText(previous);
          }),

          redo: () => set((state) => {
            if (state.history.future.length === 0) return;

            const next = state.history.future.shift()!;
            state.history.past.push(state.richContent);
            state.richContent = next;
            state.content = deltaToPlainText(next);
          })
        }),
        {
          name: 'document-storage',
          // Only persist certain fields
          partialize: (state) => ({
            id: state.id,
            title: state.title,
            content: state.content,
            richContent: state.richContent
          })
        }
      )
    )

)
);

// ============================================
// SUGGESTIONS STORE (Server State)
// ============================================

interface SuggestionsStore {
items: Map<string, Suggestion>;
byPosition: Map<number, string[]>;
isAnalyzing: boolean;

// Actions
setSuggestions: (suggestions: Suggestion[]) => void;
addSuggestion: (suggestion: Suggestion) => void;
removeSuggestion: (id: string) => void;
acceptSuggestion: (id: string, replacement: string) => void;
rejectSuggestion: (id: string) => void;
}

export const useSuggestionsStore = create<SuggestionsStore>()(
devtools(
immer((set, get) => ({
items: new Map(),
byPosition: new Map(),
isAnalyzing: false,

      setSuggestions: (suggestions) => set((state) => {
        state.items.clear();
        state.byPosition.clear();

        suggestions.forEach(sug => {
          state.items.set(sug.id, sug);

          // Index by position for fast lookup
          const existing = state.byPosition.get(sug.position.start) || [];
          existing.push(sug.id);
          state.byPosition.set(sug.position.start, existing);
        });
      }),

      addSuggestion: (suggestion) => set((state) => {
        state.items.set(suggestion.id, suggestion);

        const existing = state.byPosition.get(suggestion.position.start) || [];
        existing.push(suggestion.id);
        state.byPosition.set(suggestion.position.start, existing);
      }),

      removeSuggestion: (id) => set((state) => {
        const suggestion = state.items.get(id);
        if (!suggestion) return;

        state.items.delete(id);

        const positionSugs = state.byPosition.get(suggestion.position.start) || [];
        const filtered = positionSugs.filter(sugId => sugId !== id);

        if (filtered.length === 0) {
          state.byPosition.delete(suggestion.position.start);
        } else {
          state.byPosition.set(suggestion.position.start, filtered);
        }
      }),

      acceptSuggestion: async (id, replacement) => {
        const suggestion = get().items.get(id);
        if (!suggestion) return;

        // Update document content
        useDocumentStore.getState().updateContent(
          applyReplacement(
            useDocumentStore.getState().richContent,
            suggestion.position,
            replacement
          )
        );

        // Remove suggestion
        get().removeSuggestion(id);

        // Track analytics
        await apiClient.analytics.track('suggestion_accepted', {
          suggestionId: id,
          type: suggestion.type,
          replacementIndex: suggestion.replacements.indexOf(replacement)
        });
      },

      rejectSuggestion: (id) => set((state) => {
        state.removeSuggestion(id);
        // Could also add to a "rejected" set for learning
      })
    }))

)
);

Server State vs Client State Separation
// ============================================
// SERVER STATE (React Query)
// ============================================
// Use for: Data that lives on server
// - Documents list
// - User settings
// - Suggestions from API
// - Analytics data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch documents with caching
export const useDocuments = () => {
return useQuery({
queryKey: ['documents'],
queryFn: () => apiClient.documents.list(),
staleTime: 5 _ 60 _ 1000, // 5 minutes
cacheTime: 10 _ 60 _ 1000, // 10 minutes
refetchOnWindowFocus: true,
// Optimistic updates on mutation
});
};

// Mutation with optimistic update
export const useUpdateDocument = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: (params: { id: string; data: Partial<Document> }) =>
apiClient.documents.update(params.id, params.data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents', id] });

      // Snapshot previous value
      const previousDoc = queryClient.getQueryData(['documents', id]);

      // Optimistically update
      queryClient.setQueryData(['documents', id], (old: Document) => ({
        ...old,
        ...data,
        updatedAt: new Date().toISOString()
      }));

      // Return context for rollback
      return { previousDoc };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousDoc) {
        queryClient.setQueryData(
          ['documents', variables.id],
          context.previousDoc
        );
      }
    },

    // Refetch on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.id] });
    }

});
};

// ============================================
// CLIENT STATE (Zustand)
// ============================================
// Use for: UI state, ephemeral data
// - Theme preference
// - Modal open/close
// - Form inputs
// - Temporary selections

// Already shown above with Zustand examples

Caching Strategy
// ============================================
// MULTI-LAYER CACHING
// ============================================

/\*\*

- Layer 1: Memory Cache (React Query)
- - Fast access, lives in RAM
- - Automatic garbage collection
- - Stale-while-revalidate pattern
    \*/

/\*\*

- Layer 2: IndexedDB (Persistent Cache)
- - Survives page refreshes
- - Larger storage capacity (50MB+)
- - Used for offline support
    \*/

/\*\*

- Layer 3: Service Worker Cache (HTTP Cache)
- - Caches API responses
- - Network-first strategy for fresh data
- - Cache-first for static assets
    \*/

// IndexedDB wrapper
class DocumentCache {
private db: IDBDatabase;

async init() {
return new Promise((resolve, reject) => {
const request = indexedDB.open('grammarly-cache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Suggestions store
        if (!db.objectStoreNames.contains('suggestions')) {
          db.createObjectStore('suggestions', { keyPath: 'documentId' });
        }
      };
    });

}

async getDocument(id: string): Promise<Document | null> {
return new Promise((resolve, reject) => {
const transaction = this.db.transaction(['documents'], 'readonly');
const store = transaction.objectStore('documents');
const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

}

async setDocument(doc: Document): Promise<void> {
return new Promise((resolve, reject) => {
const transaction = this.db.transaction(['documents'], 'readwrite');
const store = transaction.objectStore('documents');
const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

}

async cleanup(maxAge: number = 7 _ 24 _ 60 _ 60 _ 1000) {
// Remove documents older than maxAge
const cutoff = Date.now() - maxAge;

    const transaction = this.db.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');
    const index = store.index('updatedAt');
    const range = IDBKeyRange.upperBound(new Date(cutoff).toISOString());

    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

}
}

// React Query with IndexedDB persistence
const queryClient = new QueryClient({
defaultOptions: {
queries: {
cacheTime: 10 _ 60 _ 1000, // 10 minutes in memory
staleTime: 5 _ 60 _ 1000, // 5 minutes before refetch

      // Use IndexedDB as persistent cache
      queryFn: async ({ queryKey }) => {
        const [resource, id] = queryKey;

        // Check IndexedDB first
        if (resource === 'documents' && id) {
          const cached = await documentCache.getDocument(id as string);
          if (cached) {
            // Return cached, but trigger background refetch
            queryClient.invalidateQueries({ queryKey });
            return cached;
          }
        }

        // Fetch from API
        const data = await apiClient[resource].get(id);

        // Save to IndexedDB
        if (resource === 'documents') {
          await documentCache.setDocument(data);
        }

        return data;
      }
    }

}
});

State Persistence Strategy
// ============================================
// WHAT TO PERSIST, WHAT NOT TO
// ============================================

// PERSIST (LocalStorage / IndexedDB):
// ✓ User preferences (theme, font, goals)
// ✓ Document drafts (unsaved changes)
// ✓ Auth tokens (secure storage)
// ✓ Personal dictionary
// ✓ UI state (sidebar open, panel width)

// DO NOT PERSIST:
// ✗ Suggestions (regenerate on load)
// ✗ Temporary UI state (modals, toasts)
// ✗ Loading states
// ✗ Error states

import { StateStorage } from 'zustand/middleware';

// Secure storage for sensitive data
const secureStorage: StateStorage = {
getItem: (name) => {
const value = localStorage.getItem(name);
return value ? decrypt(value) : null;
},
setItem: (name, value) => {
localStorage.setItem(name, encrypt(value));
},
removeItem: (name) => {
localStorage.removeItem(name);
}
};

// Preferences store with persistence
export const usePreferencesStore = create(
persist(
(set) => ({
theme: 'auto',
fontSize: 16,
language: 'en',
// ... other preferences

      updatePreference: (key, value) => set({ [key]: value })
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage)
    }

)
);

// Auth store with secure storage
export const useAuthStore = create(
persist(
(set) => ({
token: null,
user: null,

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null })
    }),
    {
      name: 'auth',
      storage: secureStorage
    }

)
);

5. Data Flow & API Communication
   API Layer Architecture
   // ============================================
   // API CLIENT ABSTRACTION
   // ============================================

class APIClient {
private baseURL: string;
private token: string | null = null;

// Interceptors
private requestInterceptors: RequestInterceptor[] = [];
private responseInterceptors: ResponseInterceptor[] = [];

constructor(config: APIClientConfig) {
this.baseURL = config.baseURL;
}

// Set auth token
setToken(token: string) {
this.token = token;
}

// Add interceptors
addRequestInterceptor(interceptor: RequestInterceptor) {
this.requestInterceptors.push(interceptor);
}

addResponseInterceptor(interceptor: ResponseInterceptor) {
this.responseInterceptors.push(interceptor);
}

// Core request method
private async request<T>(config: RequestConfig): Promise<T> {
// Apply request interceptors
let requestConfig = config;
for (const interceptor of this.requestInterceptors) {
requestConfig = await interceptor(requestConfig);
}

    // Build request
    const url = `${this.baseURL}${requestConfig.url}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...requestConfig.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Make request with retry logic
    let lastError: Error;
    for (let attempt = 0; attempt < requestConfig.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: requestConfig.method,
          headers,
          body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined,
          signal: requestConfig.signal
        });

        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          processedResponse = await interceptor(processedResponse);
        }

        if (!processedResponse.ok) {
          throw new APIError(
            processedResponse.status,
            await processedResponse.text()
          );
        }

        return await processedResponse.json();

      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error instanceof APIError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Exponential backoff
        if (attempt < requestConfig.retries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await sleep(delay);
        }
      }
    }

    throw lastError!;

}

// HTTP methods
get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
return this.request({ ...config, method: 'GET', url, retries: 3 });
}

post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
return this.request({ ...config, method: 'POST', url, body: data, retries: 3 });
}

put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
return this.request({ ...config, method: 'PUT', url, body: data, retries: 3 });
}

delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
return this.request({ ...config, method: 'DELETE', url, retries: 3 });
}
}

// ============================================
// API ENDPOINTS
// ============================================

class DocumentsAPI {
constructor(private client: APIClient) {}

list(params?: ListParams): Promise<PaginatedResponse<Document>> {
const query = new URLSearchParams(params).toString();
return this.client.get(`/documents?${query}`);
}

get(id: string): Promise<Document> {
return this.client.get(`/documents/${id}`);
}

create(data: CreateDocumentData): Promise<Document> {
return this.client.post('/documents', data);
}

update(id: string, data: Partial<Document>): Promise<Document> {
return this.client.put(`/documents/${id}`, data);
}

delete(id: string): Promise<void> {
return this.client.delete(`/documents/${id}`);
}
}

class AnalysisAPI {
constructor(private client: APIClient) {}

analyze(data: AnalysisRequest): Promise<AnalysisResponse> {
return this.client.post('/analysis', data, {
// Analysis can take longer
retries: 1,
timeout: 10000
});
}

// Stream analysis results
async \*streamAnalyze(data: AnalysisRequest): AsyncGenerator<SuggestionBatch> {
const response = await fetch(`${this.client.baseURL}/analysis/stream`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${this.client.token}`
},
body: JSON.stringify(data)
});

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }

}
}

// Initialize API client
export const apiClient = new APIClient({
baseURL: process.env.REACT_APP_API_URL
});

// Add global interceptors
apiClient.addRequestInterceptor(async (config) => {
// Add request ID for tracing
return {
...config,
headers: {
...config.headers,
'X-Request-ID': generateRequestId()
}
};
});

apiClient.addResponseInterceptor(async (response) => {
// Log slow requests
const duration = performance.now() - response.requestStart;
if (duration > 1000) {
console.warn(`Slow API request: ${response.url} took ${duration}ms`);
}

return response;
});

// Export API namespaces
export const api = {
documents: new DocumentsAPI(apiClient),
analysis: new AnalysisAPI(apiClient),
// ... other APIs
};

WebSocket Manager
// ============================================
// WEBSOCKET FOR REAL-TIME SYNC
// ============================================

class WebSocketManager {
private ws: WebSocket | null = null;
private reconnectAttempts = 0;
private maxReconnectAttempts = 5;
private reconnectDelay = 1000;
private heartbeatInterval: number | null = null;

// Event handlers
private messageHandlers = new Map<string, Set<(data: any) => void>>();

constructor(private url: string) {}

connect(token: string) {
this.ws = new WebSocket(`${this.url}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.stopHeartbeat();
      this.attemptReconnect();
    };

}

disconnect() {
this.stopHeartbeat();
if (this.ws) {
this.ws.close();
this.ws = null;
}
}

send(type: string, data: any) {
if (this.ws?.readyState === WebSocket.OPEN) {
this.ws.send(JSON.stringify({ type, data }));
} else {
console.warn('WebSocket not connected, message not sent');
}
}

subscribe(eventType: string, handler: (data: any) => void) {
if (!this.messageHandlers.has(eventType)) {
this.messageHandlers.set(eventType, new Set());
}
this.messageHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(eventType)?.delete(handler);
    };

}

private handleMessage(message: { type: string; data: any }) {
const handlers = this.messageHandlers.get(message.type);
if (handlers) {
handlers.forEach(handler => handler(message.data));
}
}

private attemptReconnect() {
if (this.reconnectAttempts >= this.maxReconnectAttempts) {
console.error('Max reconnection attempts reached');
return;
}

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      const token = useAuthStore.getState().token;
      if (token) {
        this.connect(token);
      }
    }, delay);

}

private startHeartbeat() {
this.heartbeatInterval = window.setInterval(() => {
this.send('ping', {});
}, 30000); // Every 30 seconds
}

private stopHeartbeat() {
if (this.heartbeatInterval) {
clearInterval(this.heartbeatInterval);
this.heartbeatInterval = null;
}
}
}

// Initialize WebSocket
export const wsManager = new WebSocketManager(
process.env.REACT_APP_WS_URL || 'wss://api.grammarly.com/ws'
);

// Subscribe to document updates
wsManager.subscribe('document:update', (data) => {
const { documentId, changes } = data;

// Merge remote changes with local state
useDocumentStore.getState().mergeRemoteChanges(documentId, changes);
});

// Subscribe to new suggestions
wsManager.subscribe('suggestions:new', (data) => {
const { suggestions } = data;

suggestions.forEach((suggestion: Suggestion) => {
useSuggestionsStore.getState().addSuggestion(suggestion);
});
});

Error Handling Patterns
// ============================================
// ERROR TYPES
// ============================================

class APIError extends Error {
constructor(
public status: number,
message: string,
public code?: string
) {
super(message);
this.name = 'APIError';
}
}

class NetworkError extends Error {
constructor(message: string = 'Network request failed') {
super(message);
this.name = 'NetworkError';
}
}

class ValidationError extends Error {
constructor(
message: string,
public fields: Record<string, string>
) {
super(message);
this.name = 'ValidationError';
}
}

// ============================================
// ERROR HANDLING HOOK
// ============================================

export const useErrorHandler = () => {
const { showToast } = useToastStore();
const { trackError } = useAnalytics();

const handleError = useCallback((error: Error, context?: string) => {
// Log to monitoring service
trackError(error, { context });

    // Show user-friendly message
    if (error instanceof APIError) {
      if (error.status === 401) {
        showToast({
          type: 'error',
          message: 'Session expired. Please log in again.'
        });
        // Redirect to login
        useAuthStore.getState().logout();
      } else if (error.status === 403) {
        showToast({
          type: 'error',
          message: 'You don\'t have permission to perform this action.'
        });
      } else if (error.status === 429) {
        showToast({
          type: 'warning',
          message: 'Too many requests. Please slow down.'
        });
      } else if (error.status >= 500) {
        showToast({
          type: 'error',
          message: 'Server error. Please try again later.'
        });
      } else {
        showToast({
          type: 'error',
          message: error.message || 'An error occurred.'
        });
      }
    } else if (error instanceof NetworkError) {
      showToast({
        type: 'error',
        message: 'Network error. Check your connection.'
      });
    } else if (error instanceof ValidationError) {
      // Show field-specific errors
      Object.entries(error.fields).forEach(([field, message]) => {
        showToast({ type: 'error', message: `${field}: ${message}` });
      });
    } else {
      showToast({
        type: 'error',
        message: 'An unexpected error occurred.'
      });
    }

}, [showToast, trackError]);

return { handleError };
};

// Usage in components
const MyComponent = () => {
const { handleError } = useErrorHandler();
const { mutate } = useUpdateDocument();

const handleSave = async () => {
try {
await mutate({ id: docId, data: updates });
} catch (error) {
handleError(error, 'document_save');
}
};
};

6. Performance Optimization
   Bundle Optimization
   // ============================================
   // CODE SPLITTING STRATEGY
   // ============================================

// Route-based splitting
const EditorPage = lazy(() => import('./pages/EditorPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Feature-based splitting
const AIPoweredRewrite = lazy(() =>
import('./features/ai-rewrite/AIRewritePanel')
);

// Component-based splitting (heavy components)
const PlagiarismChecker = lazy(() =>
import('./features/plagiarism/PlagiarismChecker')
);

// Webpack magic comments for chunk naming
const Editor = lazy(() =>
import(/_ webpackChunkName: "editor" _/ './components/Editor')
);

// Preload critical chunks
const preloadEditor = () => {
const link = document.createElement('link');
link.rel = 'prefetch';
link.as = 'script';
link.href = '/static/js/editor.chunk.js';
document.head.appendChild(link);
};

// ============================================
// TREE SHAKING
// ============================================

// ✓ GOOD: Named imports (tree-shakeable)
import { debounce } from 'lodash-es';

// ✗ BAD: Default import (entire library)
import \_ from 'lodash';

// ✓ GOOD: Import only what you need
import debounce from 'lodash-es/debounce';

// ============================================
// BUNDLE ANALYSIS
// ============================================

// package.json
{
"scripts": {
"analyze": "ANALYZE=true npm run build"
}
}

// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

plugins: [
process.env.ANALYZE && new BundleAnalyzerPlugin()
].filter(Boolean);

// ============================================
// DYNAMIC IMPORTS FOR HEAVY LIBRARIES
// ============================================

// Load heavy libraries only when needed
const loadProseMirror = async () => {
const { EditorState } = await import('prosemirror-state');
const { EditorView } = await import('prosemirror-view');
const { Schema } = await import('prosemirror-model');

return { EditorState, EditorView, Schema };
};

// Lazy load PDF export
const exportToPDF = async (content: string) => {
const { jsPDF } = await import('jspdf');
const doc = new jsPDF();
doc.text(content, 10, 10);
doc.save('document.pdf');
};

Rendering Optimization
// ============================================
// VIRTUAL SCROLLING FOR LARGE DOCUMENTS
// ============================================

import { FixedSizeList as List } from 'react-window';

interface VirtualEditorProps {
lines: string[];
lineHeight: number;
}

const VirtualEditor: React.FC<VirtualEditorProps> = ({ lines, lineHeight }) => {
const Row = ({ index, style }: any) => (

<div style={style} className="editor-line">
<LineNumber>{index + 1}</LineNumber>
<LineContent>{lines[index]}</LineContent>
<LineDecorations lineIndex={index} />
</div>
);

return (
<List
height={800}
itemCount={lines.length}
itemSize={lineHeight}
width="100%"
overscanCount={5} // Render 5 extra lines above/below viewport >
{Row}
</List>
);
};

// ============================================
// MEMOIZATION
// ============================================

// Memoize expensive computations
const ExpensiveComponent = ({ data }: Props) => {
const processedData = useMemo(() => {
return heavyProcessing(data);
}, [data]); // Only recompute when data changes

return <div>{processedData}</div>;
};

// Memoize callbacks
const ParentComponent = () => {
const [count, setCount] = useState(0);

// Without useCallback, this creates a new function on every render
// causing ChildComponent to re-render unnecessarily
const handleClick = useCallback(() => {
console.log('Clicked');
}, []); // Empty deps = function never changes

return <ChildComponent onClick={handleClick} />;
};

// Memoize entire component
const ChildComponent = React.memo(({ onClick }: Props) => {
console.log('ChildComponent rendered');
return <button onClick={onClick}>Click me</button>;
}); // Only re-renders if props change

// ============================================
// CONCURRENT RENDERING (React 18+)
// ============================================

import { startTransition, useDeferredValue } from 'react';

const SearchResults = () => {
const [query, setQuery] = useState('');

// Defer expensive updates
const deferredQuery = useDeferredValue(query);

const results = useMemo(() => {
return searchDocuments(deferredQuery);
}, [deferredQuery]);

return (

<div>
<input
value={query}
onChange={(e) => {
// startTransition marks this update as non-urgent
startTransition(() => {
setQuery(e.target.value);
});
}}
/>
<ResultsList results={results} />
</div>
);
};

// ============================================
// WINDOWING FOR SUGGESTIONS LIST
// ============================================

const SuggestionsList = ({ suggestions }: { suggestions: Suggestion[] }) => {
if (suggestions.length > 50) {
// Use virtual scrolling for large lists
return (
<List
        height={600}
        itemCount={suggestions.length}
        itemSize={120}
        width="100%"
      >
{({ index, style }) => (

<div style={style}>
<SuggestionCard suggestion={suggestions[index]} />
</div>
)}
</List>
);
}

// Normal rendering for small lists
return (

<div>
{suggestions.map(sug => (
<SuggestionCard key={sug.id} suggestion={sug} />
))}
</div>
);
};

Network Optimization
// ============================================
// REQUEST BATCHING
// ============================================

class RequestBatcher {
private queue: Array<{ id: string; resolve: Function; reject: Function }> = [];
private timer: number | null = null;

add(id: string): Promise<any> {
return new Promise((resolve, reject) => {
this.queue.push({ id, resolve, reject });

      if (!this.timer) {
        this.timer = window.setTimeout(() => this.flush(), 50);
      }
    });

}

private async flush() {
const batch = this.queue.splice(0);
this.timer = null;

    if (batch.length === 0) return;

    try {
      const ids = batch.map(item => item.id);
      const results = await api.documents.getBatch(ids);

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }

}
}

const batcher = new RequestBatcher();

// Usage
const doc1 = await batcher.add('doc1'); // Batched
const doc2 = await batcher.add('doc2'); // Batched
const doc3 = await batcher.add('doc3'); // Batched
// All 3 requests sent as single batch after 50ms

// ============================================
// DEBOUNCING & THROTTLING
// ============================================

// Debounce: Wait until user stops typing
const useDebouncedAnalysis = () => {
const [content, setContent] = useState('');
const debouncedContent = useDebounce(content, 150);

useEffect(() => {
if (debouncedContent) {
analyzeText(debouncedContent);
}
}, [debouncedContent]);

return { content, setContent };
};

function useDebounce<T>(value: T, delay: number): T {
const [debouncedValue, setDebouncedValue] = useState(value);

useEffect(() => {
const timer = setTimeout(() => {
setDebouncedValue(value);
}, delay);

    return () => clearTimeout(timer);

}, [value, delay]);

return debouncedValue;
}

// Throttle: Limit rate of function calls
const useThrottledScroll = (callback: Function, delay: number) => {
const lastRun = useRef(Date.now());

return useCallback((...args: any[]) => {
const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }

}, [callback, delay]);
};

// ============================================
// PREFETCHING
// ============================================

// Prefetch on hover
const DocumentLink = ({ docId }: { docId: string }) => {
const queryClient = useQueryClient();

const prefetchDocument = () => {
queryClient.prefetchQuery({
queryKey: ['documents', docId],
queryFn: () => api.documents.get(docId)
});
};

return (

<Link
to={`/documents/${docId}`}
onMouseEnter={prefetchDocument}
onFocus={prefetchDocument} >
View Document
</Link>
);
};

// Prefetch next page
const DocumentList = ({ page }: { page: number }) => {
const { data } = useDocuments(page);
const queryClient = useQueryClient();

useEffect(() => {
// Prefetch next page
queryClient.prefetchQuery({
queryKey: ['documents', page + 1],
queryFn: () => api.documents.list({ page: page + 1 })
});
}, [page, queryClient]);

return <div>{/_ render documents _/}</div>;
};

// ============================================
// COMPRESSION
// ============================================

// Enable gzip/brotli compression
// nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
text/plain
text/css
text/javascript
application/javascript
application/json
application/x-javascript
application/xml
application/xml+rss
image/svg+xml;

// Response compression in service worker
self.addEventListener('fetch', (event) => {
event.respondWith(
caches.match(event.request).then((response) => {
if (response && response.headers.get('Content-Encoding') === 'gzip') {
return response;
}

      return fetch(event.request).then((response) => {
        // Cache compressed response
        if (response.ok) {
          const clone = response.clone();
          caches.open('v1').then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })

);
});

Image Optimization
// ============================================
// RESPONSIVE IMAGES
// ============================================

const OptimizedImage = ({ src, alt }: { src: string; alt: string }) => {
return (
<picture>
{/_ WebP for modern browsers _/}

<source
type="image/webp"
srcSet={`          ${src}?format=webp&width=400 400w,
          ${src}?format=webp&width=800 800w,
          ${src}?format=webp&width=1200 1200w
       `}
/>

      {/* Fallback to JPEG */}
      <img
        src={`${src}?width=800`}
        srcSet={`
          ${src}?width=400 400w,
          ${src}?width=800 800w,
          ${src}?width=1200 1200w
        `}
        sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
        alt={alt}
        loading="lazy"
      />
    </picture>

);
};

// ============================================
// LAZY LOADING
// ============================================

const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
const [isLoaded, setIsLoaded] = useState(false);
const [isInView, setIsInView] = useState(false);
const imgRef = useRef<HTMLImageElement>(null);

useEffect(() => {
if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();

}, []);

return (

<div className="image-wrapper">
{!isLoaded && <Skeleton />}
<img
ref={imgRef}
src={isInView ? src : undefined}
alt={alt}
onLoad={() => setIsLoaded(true)}
style={{ opacity: isLoaded ? 1 : 0 }}
/>
</div>
);
};

Core Web Vitals Optimization
// ============================================
// LARGEST CONTENTFUL PAINT (LCP)
// ============================================

// Target: < 2.5s

// 1. Preload critical resources

<link rel="preload" as="font" href="/fonts/inter.woff2" crossorigin />
<link rel="preload" as="image" href="/logo.webp" />

// 2. Optimize critical CSS

<style>
  /* Inline critical CSS for above-the-fold content */
  .app-shell { ... }
  .editor-header { ... }
</style>

// 3. Defer non-critical JS

<script src="/analytics.js" defer />

// 4. Use CDN for static assets
const CDN_URL = 'https://cdn.grammarly.com';

// ============================================
// FIRST INPUT DELAY (FID)
// ============================================

// Target: < 100ms

// 1. Break up long tasks
const processLargeDataset = async (data: any[]) => {
  const chunks = chunkArray(data, 100);
  
  for (const chunk of chunks) {
    await new Promise(resolve => {
      requestIdleCallback(() => {
        processChunk(chunk);
        resolve(null);
      });
    });
  }
};

// 2. Use Web Workers for heavy computation
const worker = new Worker('/text-analyzer.worker.js');

worker.postMessage({ text: content });

worker.onmessage = (event) => {
  const { suggestions } = event.data;
  useSuggestionsStore.getState().setSuggestions(suggestions);
};

// 3. Debounce expensive operations (shown earlier)

// ============================================
// CUMULATIVE LAYOUT SHIFT (CLS)
// ============================================

// Target: < 0.1

// 1. Reserve space for dynamic content
const SuggestionCard = () => {
  return (
    <div
      style={{
        minHeight: '120px', // Reserve space
        width: '100%'
      }}
    >
      {/* Content */}
    </div>
  );
};

// 2. Specify image dimensions
<img
  src="/logo.png"
  width={200}
  height={60}
  alt="Grammarly"
/>

// 3. Avoid inserting content above existing content
// Use portal for modals/dropdowns
const Dropdown = () => {
  return createPortal(
    <div className="dropdown-menu">{/* content */}</div>,
    document.body
  );
};

Performance Monitoring
// ============================================
// PERFORMANCE TRACKING
// ============================================

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }
  
  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0] as PerformanceMeasure;
    
    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(measure.duration);
    
    // Report to analytics if > threshold
    if (measure.duration > 100) {
      analytics.track('performance_slow', {
        metric: name,
        duration: measure.duration
      });
    }
    
    // Cleanup
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }
  
  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  getP95(name: string): number {
    const values= (this.metrics.get(name) || []).sort((a, b) => a - b); const index = Math.floor(values.length * 0.95); return values[index] || 0; } }
export const perfMonitor = new PerformanceMonitor();
// Usage const MyComponent = () => { useEffect(() => { perfMonitor.startMeasure('component-render');
return () => {
  perfMonitor.endMeasure('component-render');
};

}, []); };
// Track Core Web Vitals import { getCLS, getFID, getLCP } from 'web-vitals';
getCLS(console.log); getFID(console.log); getLCP(console.log);

---

## 7. Error Handling & Edge Cases

### Error Boundary Implementation

```typescript
// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to analytics
    analytics.track('error_boundary_triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({ errorInfo });
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.message}</pre>

              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
            <button onClick={this.handleReset}>Try again</button>
          </div>
        )
      );
    }

    return this.props.children;

}
}

// Usage with granular boundaries
<ErrorBoundary fallback={<EditorFallback />}>
<Editor />
</ErrorBoundary>

<ErrorBoundary fallback={<SuggestionsFallback />}>
<SuggestionsPanel />
</ErrorBoundary>

Graceful Degradation
// ============================================
// FEATURE DETECTION & FALLBACKS
// ============================================

const useFeatureDetection = () => {
const [features, setFeatures] = useState({
webWorkers: typeof Worker !== 'undefined',
indexedDB: typeof indexedDB !== 'undefined',
serviceWorker: 'serviceWorker' in navigator,
webSocket: typeof WebSocket !== 'undefined',
localStorage: (() => {
try {
localStorage.setItem('test', 'test');
localStorage.removeItem('test');
return true;
} catch {
return false;
}
})()
});

return features;
};

// Component with fallback
const Editor = () => {
const features = useFeatureDetection();

// Use Web Worker for analysis if available
const analyzer = useMemo(() => {
if (features.webWorkers) {
return new WorkerAnalyzer();
}
// Fallback to main thread (with debouncing)
return new MainThreadAnalyzer();
}, [features.webWorkers]);

// Use IndexedDB if available, otherwise localStorage
const storage = useMemo(() => {
if (features.indexedDB) {
return new IndexedDBStorage();
}
if (features.localStorage) {
return new LocalStorageAdapter();
}
// Last resort: memory only
return new MemoryStorage();
}, [features]);

return <EditorComponent analyzer={analyzer} storage={storage} />;
};

Offline Support
// ============================================
// SERVICE WORKER
// ============================================

// service-worker.js
const CACHE_NAME = 'grammarly-v1';
const urlsToCache = [
'/',
'/static/css/main.css',
'/static/js/main.js',
'/static/js/editor.chunk.js'
];

self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => {
return cache.addAll(urlsToCache);
})
);
});

self.addEventListener('fetch', (event) => {
event.respondWith(
caches.match(event.request).then((response) => {
// Cache hit - return response
if (response) {
return response;
}

      return fetch(event.request).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('/offline.html');
      });
    })

);
});

// ============================================
// OFFLINE QUEUE
// ============================================

class OfflineQueue {
private queue: QueueItem[] = [];
private isProcessing = false;

constructor() {
// Load queue from IndexedDB
this.loadQueue();

    // Listen for online event
    window.addEventListener('online', () => {
      this.processQueue();
    });

}

async add(operation: Operation) {
const item: QueueItem = {
id: generateId(),
operation,
timestamp: Date.now(),
retries: 0
};

    this.queue.push(item);
    await this.saveQueue();

    if (navigator.onLine) {
      this.processQueue();
    }

}

private async processQueue() {
if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const item = this.queue[0];

      try {
        await this.executeOperation(item.operation);
        this.queue.shift(); // Remove on success
        await this.saveQueue();
      } catch (error) {
        item.retries++;

        if (item.retries >= 3) {
          // Max retries reached, remove from queue
          this.queue.shift();
          console.error('Operation failed after 3 retries:', item);
        } else {
          // Wait before retrying
          await sleep(1000 * item.retries);
        }

        await this.saveQueue();
      }
    }

    this.isProcessing = false;

}

private async executeOperation(operation: Operation) {
switch (operation.type) {
case 'save':
await api.documents.update(operation.documentId, operation.data);
break;
case 'delete':
await api.documents.delete(operation.documentId);
break;
// ... other operations
}
}

private async loadQueue() {
// Load from IndexedDB
const db = await openDB('offline-queue');
this.queue = await db.getAll('queue');
}

private async saveQueue() {
const db = await openDB('offline-queue');
await db.clear('queue');
await db.bulkAdd('queue', this.queue);
}
}

export const offlineQueue = new OfflineQueue();

Network Failure Handling
// ============================================
// RETRY LOGIC
// ============================================

class RetryableRequest {
async execute<T>(
fn: () => Promise<T>,
options: {
maxRetries?: number;
backoff?: 'exponential' | 'linear';
onRetry?: (attempt: number, error: Error) => void;
} = {}
): Promise<T> {
const { maxRetries = 3, backoff = 'exponential', onRetry } = options;

    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof APIError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = backoff === 'exponential'
            ? Math.min(1000 * Math.pow(2, attempt), 10000)
            : 1000 * (attempt + 1);

          onRetry?.(attempt + 1, error as Error);
          await sleep(delay);
        }
      }
    }

    throw lastError!;

}
}

// Usage
const retryable = new RetryableRequest();

const saveDocument = async (id: string, data: any) => {
return retryable.execute(
() => api.documents.update(id, data),
{
maxRetries: 3,
backoff: 'exponential',
onRetry: (attempt, error) => {
console.log(`Retry attempt ${attempt}:`, error.message);
showToast({
type: 'warning',
message: `Retrying save... (attempt ${attempt}/3)`
});
}
}
);
};

Race Condition Prevention
// ============================================
// DEBOUNCED SAVE WITH RACE PREVENTION
// ============================================

class DocumentSaver {
private saveTimeouts = new Map<string, number>();
private inflightRequests = new Map<string, AbortController>();

async save(documentId: string, content: string, delay: number = 2000) {
// Clear existing timeout
const existingTimeout = this.saveTimeouts.get(documentId);
if (existingTimeout) {
clearTimeout(existingTimeout);
}

    // Abort inflight request
    const existingRequest = this.inflightRequests.get(documentId);
    if (existingRequest) {
      existingRequest.abort();
    }

    // Set new timeout
    return new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(async () => {
        const controller = new AbortController();
        this.inflightRequests.set(documentId, controller);

        try {
          await api.documents.update(
            documentId,
            { content },
            { signal: controller.signal }
          );

          this.inflightRequests.delete(documentId);
          resolve();
        } catch (error) {
          if (error.name === 'AbortError') {
            // Request was aborted, ignore
            return;
          }

          this.inflightRequests.delete(documentId);
          reject(error);
        }
      }, delay);

      this.saveTimeouts.set(documentId, timeout);
    });

}
}

export const documentSaver = new DocumentSaver();

// Usage
const Editor = () => {
const handleChange = (content: string) => {
// Update UI immediately
setContent(content);

    // Save after delay (debounced, with race prevention)
    documentSaver.save(documentId, content);

};
};

8. Testing Strategy
   Unit Testing
   // ============================================
   // UNIT TESTS (Vitest + React Testing Library)
   // ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuggestionCard } from './SuggestionCard';

describe('SuggestionCard', () => {
const mockSuggestion = {
id: 'sug-1',
type: 'grammar',
severity: 'error',
originalText: 'teh',
explanation: 'Spelling mistake',
replacements: ['the', 'tea'],
position: { start: 0, end: 3 }
};

it('renders suggestion correctly', () => {
render(
<SuggestionCard
        suggestion={mockSuggestion}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onDismiss={vi.fn()}
      />
);

    expect(screen.getByText('Spelling mistake')).toBeInTheDocument();
    expect(screen.getByText('the')).toBeInTheDocument();
    expect(screen.getByText('tea')).toBeInTheDocument();

});

it('calls onAccept when replacement is clicked', async () => {
const onAccept = vi.fn();

    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onAccept={onAccept}
        onReject={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('the'));

    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledWith('sug-1', 'the');
    });

});

it('calls onReject when ignore button is clicked', () => {
const onReject = vi.fn();

    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onAccept={vi.fn()}
        onReject={onReject}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Ignore'));

    expect(onReject).toHaveBeenCalledWith('sug-1');

});
});

// ============================================
// TESTING HOOKS
// ============================================

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
it('debounces value updates', async () => {
vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should be updated
    expect(result.current).toBe('updated');

    vi.useRealTimers();

});
});

// ============================================
// TESTING ZUSTAND STORES
// ============================================

import { renderHook, act } from '@testing-library/react';
import { useDocumentStore } from './documentStore';

describe('DocumentStore', () => {
beforeEach(() => {
// Reset store before each test
useDocumentStore.setState({
id: null,
title: 'Untitled',
content: '',
richContent: { ops: [] }
});
});

it('updates content correctly', () => {
const { result } = renderHook(() => useDocumentStore());

    act(() => {
      result.current.updateContent({
        ops: [{ insert: 'Hello world' }]
      });
    });

    expect(result.current.content).toBe('Hello world');
    expect(result.current.saveState.status).toBe('unsaved');

});

it('performs undo/redo correctly', () => {
const { result } = renderHook(() => useDocumentStore());

    // Make changes
    act(() => {
      result.current.updateContent({ ops: [{ insert: 'First' }] });
    });

    act(() => {
      result.current.updateContent({ ops: [{ insert: 'Second' }] });
    });

    expect(result.current.content).toBe('Second');

    // Undo
    act(() => {
      result.current.undo();
    });

    expect(result.current.content).toBe('First');

    // Redo
    act(() => {
      result.current.redo();
    });

    expect(result.current.content).toBe('Second');

});
});

Integration Testing
// ============================================
// INTEGRATION TESTS
// ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { EditorPage } from './EditorPage';

// Mock API server
const server = setupServer(
rest.get('/api/documents/:id', (req, res, ctx) => {
return res(
ctx.json({
id: '123',
title: 'Test Document',
content: 'Hello world',
richContent: { ops: [{ insert: 'Hello world' }] }
})
);
}),

rest.post('/api/analysis', (req, res, ctx) => {
return res(
ctx.json({
suggestions: [
{
id: 'sug-1',
type: 'spelling',
severity: 'error',
position: { start: 6, end: 11 },
originalText: 'world',
replacements: ['word'],
explanation: 'Did you mean "word"?'
}
]
})
);
})
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('EditorPage Integration', () => {
it('loads document and shows suggestions', async () => {
const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <EditorPage documentId="123" />
      </QueryClientProvider>
    );

    // Wait for document to load
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Did you mean "word"?')).toBeInTheDocument();
    });

});

it('applies suggestion to document', async () => {
const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <EditorPage documentId="123" />
      </QueryClientProvider>
    );

    // Wait for suggestions
    await waitFor(() => {
      expect(screen.getByText('word')).toBeInTheDocument();
    });

    // Click replacement
    fireEvent.click(screen.getByText('word'));

    // Verify document updated
    await waitFor(() => {
      expect(screen.getByText('Hello word')).toBeInTheDocument();
    });

});
});

E2E Testing
// ============================================
// E2E TESTS (Playwright)
// ============================================

import { test, expect } from '@playwright/test';

test.describe('Grammarly Editor', () => {
test('complete writing workflow', async ({ page }) => {
// Login
await page.goto('/login');
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('/documents');

    // Create new document
    await page.click('button:has-text("New Document")');

    // Wait for editor
    await page.waitForSelector('[data-testid="editor"]');

    // Type content
    await page.type('[data-testid="editor"]', 'The quick brown fox jumps over teh lazy dog');

    // Wait for suggestions
    await page.waitForSelector('[data-testid="suggestion-card"]');

    // Verify suggestion appears
    const suggestion = await page.textContent('[data-testid="suggestion-card"]');
    expect(suggestion).toContain('teh');

    // Accept suggestion
    await page.click('[data-testid="suggestion-replacement"]:has-text("the")');

    // Verify text updated
    const content = await page.textContent('[data-testid="editor"]');
    expect(content).toContain('the lazy dog');

    // Verify auto-save
    await page.waitForSelector('[data-testid="save-indicator"]:has-text("Saved")');

});

test('offline functionality', async ({ page, context }) => {
// Go offline
await context.setOffline(true);

    await page.goto('/editor/123');

    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Type content
    await page.type('[data-testid="editor"]', 'Offline content');

    // Verify queued for sync
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Pending');

    // Go back online
    await context.setOffline(false);

    // Verify synced
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced');

});
});

Performance Testing
// ============================================
// PERFORMANCE TESTS
// ============================================

import { test } from '@playwright/test';

test('editor performance with large document', async ({ page }) => {
await page.goto('/editor/large-doc');

// Measure initial load
const loadTime = await page.evaluate(() => {
const entries = performance.getEntriesByType('navigation');
return entries[0].duration;
});

expect(loadTime).toBeLessThan(2000); // < 2s load time

// Measure typing performance
await page.type('[data-testid="editor"]', 'Test');

const metrics = await page.evaluate(() => {
return {
fid: performance.getEntriesByType('first-input')[0]?.duration,
cls: performance.getEntriesByType('layout-shift')
.reduce((sum, entry) => sum + entry.value, 0)
};
});

expect(metrics.fid).toBeLessThan(100); // < 100ms FID
expect(metrics.cls).toBeLessThan(0.1); // < 0.1 CLS
});

9. Security Considerations
   XSS Prevention
   // ============================================
   // INPUT SANITIZATION
   // ============================================

import DOMPurify from 'dompurify';

// Sanitize HTML before rendering
const SafeHTML = ({ html }: { html: string }) => {
const sanitized = DOMPurify.sanitize(html, {
ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
ALLOWED_ATTR: ['href', 'target']
});

return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// Escape user input in text nodes
const escapeHtml = (text: string): string => {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
};

// NEVER use dangerouslySetInnerHTML with user input
// ✗ BAD

<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✓ GOOD

<div>{userInput}</div>

CSRF Protection
// ============================================
// CSRF TOKEN
// ============================================

// Include CSRF token in requests
apiClient.addRequestInterceptor(async (config) => {
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

return {
...config,
headers: {
...config.headers,
'X-CSRF-Token': csrfToken
}
};
});

// Validate on server
app.use((req, res, next) => {
const token = req.headers['x-csrf-token'];
const sessionToken = req.session.csrfToken;

if (token !== sessionToken) {
return res.status(403).json({ error: 'Invalid CSRF token' });
}

next();
});

Content Security Policy

<!-- ============================================ -->
<!-- CSP HEADERS -->
<!-- ============================================ -->

<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.grammarly.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.grammarly.com wss://api.grammarly.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">

Secure Storage
// ============================================
// TOKEN STORAGE
// ============================================

class SecureStorage {
private readonly ENCRYPTION_KEY = 'user-specific-key';

// Encrypt sensitive data
private encrypt(data: string): string {
// Use Web Crypto API
// Simplified example - use proper encryption in production
return btoa(data);
}

private decrypt(encrypted: string): string {
return atob(encrypted);
}

setToken(token: string) {
const encrypted = this.encrypt(token);
// Use httpOnly cookie in production
document.cookie = `auth_token=${encrypted}; Secure; SameSite=Strict`;
}

getToken(): string | null {
const cookie = document.cookie
.split('; ')
.find(row => row.startsWith('auth_token='));

    if (!cookie) return null;

    const encrypted = cookie.split('=')[1];
    return this.decrypt(encrypted);

}

removeToken() {
document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
}

10. Interview Cross-Questions
    System Design Questions
    Q1: How would you handle a document with 100,000+ words?
    Answer: Multi-pronged approach:
    Virtual Rendering: Only render visible viewport + buffer

<VirtualList
  itemCount={lines.length}
  itemSize={lineHeight}
  overscanCount={5}
/>

Progressive Analysis: Analyze visible sections first, rest in background

// Prioritize visible section
analyzeRange(viewportStart, viewportEnd);

// Queue rest
requestIdleCallback(() => {
analyzeRange(0, viewportStart);
analyzeRange(viewportEnd, documentEnd);
});

Suggestion Batching: Group nearby suggestions to reduce DOM nodes

Web Worker: Offload analysis to prevent main thread blocking

Lazy Decoration: Only render decorations in viewport

Q2: How do you prevent race conditions when auto-saving?
Answer:
class DocumentSaver {
private inflightRequests = new Map<string, AbortController>();

async save(id: string, content: string) {
// Abort existing request for this document
this.inflightRequests.get(id)?.abort();

    // Create new abort controller
    const controller = new AbortController();
    this.inflightRequests.set(id, controller);

    try {
      await api.save(id, content, { signal: controller.signal });
      this.inflightRequests.delete(id);
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }

}
}

Q3: How would you implement collaborative editing?
Answer: Operational Transform (OT) or CRDT approach:
// Using OT
interface Operation {
type: 'insert' | 'delete';
position: number;
text?: string;
length?: number;
userId: string;
timestamp: number;
}

// Transform operations to handle concurrency
const transform = (op1: Operation, op2: Operation): Operation => {
if (op1.type === 'insert' && op2.type === 'insert') {
if (op1.position < op2.position) {
return op2; // No change
}
return { ...op2, position: op2.position + op1.text!.length };
}
// ... other cases
};

// Apply operation
const applyOperation = (content: string, op: Operation): string => {
if (op.type === 'insert') {
return content.slice(0, op.position) +
op.text +
content.slice(op.position);
}
if (op.type === 'delete') {
return content.slice(0, op.position) +
content.slice(op.position + op.length!);
}
return content;
};

Performance Questions
Q4: How would you optimize bundle size?
Answer:
Code Splitting: Route-based + component-based
Tree Shaking: Named imports, mark side-effect-free
Dynamic Imports: Load heavy libraries on-demand
Bundle Analysis: Use webpack-bundle-analyzer
Compression: Enable gzip/brotli
Remove Unused Code: Regular audits
Actual implementation:
// Before: 2MB bundle
import \* as lodash from 'lodash';

// After: 50KB bundle
import debounce from 'lodash-es/debounce';
import throttle from 'lodash-es/throttle';

Q5: How do you optimize re-renders in a large component tree?
Answer:
// 1. React.memo for expensive components
const ExpensiveChild = React.memo(({ data }) => {
return <div>{heavyComputation(data)}</div>;
});

// 2. useMemo for expensive computations
const processed = useMemo(() => {
return processLargeDataset(data);
}, [data]);

// 3. useCallback for stable callbacks
const handleClick = useCallback(() => {
doSomething(id);
}, [id]);

// 4. Split context to avoid re-render cascade
// BAD: Single context causes all consumers to re-render
const AppContext = createContext({ user, theme, documents });

// GOOD: Split into multiple contexts
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const DocumentsContext = createContext(documents);

// 5. Virtualization for large lists
<VirtualList itemCount={1000} />

Q6: What's your caching strategy?
Answer: Multi-layer approach:
Layer 1: Memory (React Query) - 5-10 min stale time
Layer 2: IndexedDB - 7 days
Layer 3: Service Worker HTTP cache - Immutable assets
Layer 4: CDN - Static assets

Strategy:

- Stale-while-revalidate for API data
- Cache-first for static assets
- Network-first for user documents

State Management Questions
Q7: Redux vs Zustand vs Context - when to use each?
Answer:
Context: Simple, local state sharing (theme, auth)
Pros: Built-in, no dependencies
Cons: Re-render issues, no devtools
Zustand: Feature-based state, performance-critical
Pros: Simple API, good performance, middleware
Cons: Less ecosystem than Redux
Redux: Large apps, time-travel debugging needed
Pros: Robust devtools, large ecosystem
Cons: Boilerplate, learning curve
For Grammarly: Zustand for most state + React Query for server state
Q8: How do you handle optimistic updates?
Answer:
const useUpdateDocument = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: updateDoc,

    onMutate: async (newDoc) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(['documents', newDoc.id]);

      // Snapshot current value
      const previous = queryClient.getQueryData(['documents', newDoc.id]);

      // Optimistically update
      queryClient.setQueryData(['documents', newDoc.id], newDoc);

      return { previous };
    },

    onError: (err, newDoc, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['documents', newDoc.id],
        context.previous
      );
    },

    onSettled: (newDoc) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['documents', newDoc.id]);
    }

});
};

Security Questions
Q9: How do you prevent XSS attacks?
Answer:
Never use dangerouslySetInnerHTML with user input
Sanitize HTML with DOMPurify if needed
Content Security Policy headers
Escape user input in templates
Validate on server before storing
// Client-side sanitization
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);

// CSP header
Content-Security-Policy: default-src 'self'; script-src 'self';

Q10: How do you secure authentication tokens?
Answer:
HttpOnly cookies (not accessible via JavaScript)
Secure flag (HTTPS only)
SameSite=Strict (CSRF protection)
Short expiration + refresh tokens
Encrypt tokens if using localStorage
// Server sets httpOnly cookie
res.cookie('auth*token', token, {
httpOnly: true,
secure: true,
sameSite: 'strict',
maxAge: 15 * 60 \_ 1000 // 15 minutes
});

// Client sends automatically in requests
// No manual handling needed

Architecture Trade-offs
Q11: SPA vs SSR vs SSG for Grammarly?
Answer: SPA is best for Grammarly because:
Pros:
Rich interactions (real-time editing)
Client-side state management
Offline capability
Fast after initial load
Cons:
Longer initial load
SEO less important (app, not content site)
Could use SSR for:
Landing pages (SEO)
Blog/documentation
Q12: Monolith vs Micro-frontends?
Answer: Monolith for Grammarly
Reasoning:
Shared editor components across features
Unified state management
Simpler deployment
Better performance (no federation overhead)
Micro-frontends IF:
Multiple independent teams
Different release cycles per feature
Browser extension needs separation
Q13: REST vs GraphQL for API?
Answer: REST for most, GraphQL for complex queries
REST:
✓ Simple CRUD (documents, user)
✓ Caching easier
✓ Smaller payload

GraphQL:
✓ Complex nested data (document + suggestions + comments)
✓ Avoid over-fetching
✓ Real-time subscriptions

Hybrid approach:

- REST for simple operations
- GraphQL for dashboard/analytics

Q14: When would you use Web Workers?
Answer: Use for:
Heavy text analysis (tokenization, parsing)
Large document processing
Computations > 50ms
Don't use for:
Simple operations (< 10ms)
DOM manipulation
Frequent small tasks (overhead)
// Main thread
const worker = new Worker('/analyzer.worker.js');
worker.postMessage({ text: largeDocument });
worker.onmessage = ({ data }) => {
setSuggestions(data.suggestions);
};

// Worker
self.onmessage = ({ data }) => {
const suggestions = analyze(data.text);
self.postMessage({ suggestions });
};

Q15: How do you handle version conflicts in collaborative editing?
Answer: Vector clocks + last-write-wins
interface Change {
content: string;
version: number;
deviceId: string;
timestamp: number;
}

const mergeChanges = (local: Change, remote: Change): Change => {
if (remote.version > local.version) {
return remote; // Remote is newer
}

if (remote.version === local.version) {
// Same version, use timestamp
return remote.timestamp > local.timestamp ? remote : local;
}

return local; // Local is newer
};

Q16: How would you implement undo/redo?
Answer: Command pattern with history stacks
interface Command {
execute: () => void;
undo: () => void;
}

class InsertTextCommand implements Command {
constructor(
private position: number,
private text: string,
private editor: Editor
) {}

execute() {
this.editor.insertAt(this.position, this.text);
}

undo() {
this.editor.deleteAt(this.position, this.text.length);
}
}

class HistoryManager {
private undoStack: Command[] = [];
private redoStack: Command[] = [];

execute(command: Command) {
command.execute();
this.undoStack.push(command);
this.redoStack = []; // Clear redo on new action
}

undo() {
const command = this.undoStack.pop();
if (command) {
command.undo();
this.redoStack.push(command);
}
}

redo() {
const command = this.redoStack.pop();
if (command) {
command.execute();
this.undoStack.push(command);
}
}
}

Q17: How do you test WebSocket connections?
Answer:
// Mock WebSocket in tests
class MockWebSocket {
onopen: (() => void) | null = null;
onmessage: ((event: any) => void) | null = null;

send(data: string) {
// Simulate echo
setTimeout(() => {
this.onmessage?.({ data });
}, 10);
}

close() {
// Simulate close
}
}

// Test
it('handles WebSocket messages', async () => {
global.WebSocket = MockWebSocket as any;

const ws = new WebSocketManager('ws://test');
const handler = vi.fn();

ws.subscribe('update', handler);
ws.send('update', { data: 'test' });

await waitFor(() => {
expect(handler).toHaveBeenCalledWith({ data: 'test' });
});
});

Q18: How would you implement feature flags?
Answer:
interface FeatureFlags {
aiRewrites: boolean;
voiceInput: boolean;
collaborativeEditing: boolean;
}

class FeatureFlagService {
private flags: FeatureFlags;

async init() {
// Fetch from server or use defaults
this.flags = await api.features.getFlags();
}

isEnabled(feature: keyof FeatureFlags): boolean {
return this.flags[feature] ?? false;
}

// A/B testing
getVariant(experiment: string): 'control' | 'variant' {
const userId = getUserId();
const hash = hashCode(userId + experiment);
return hash % 2 === 0 ? 'control' : 'variant';
}
}

// Usage
const FeatureGate = ({ feature, children }) => {
const isEnabled = useFeatureFlag(feature);
return isEnabled ? children : null;
};

<FeatureGate feature="aiRewrites">
  <AIRewritePanel />
</FeatureGate>

Q19: How do you monitor frontend performance in production?
Answer:
// Real User Monitoring (RUM)
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

const sendToAnalytics = ({ name, value, id }) => {
analytics.track('web_vital', {
metric: name,
value: Math.round(value),
id
});
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);

// Custom metrics
const trackMetric = (name: string, value: number) => {
if (value > THRESHOLDS[name]) {
analytics.track('performance_threshold_exceeded', {
metric: name,
value,
threshold: THRESHOLDS[name]
});
}
};

// Error tracking
window.addEventListener('error', (event) => {
analytics.track('javascript_error', {
message: event.message,
stack: event.error?.stack,
url: event.filename,
line: event.lineno
});
});

Q20: Explain your approach to accessibility (a11y)?
Answer:
Semantic HTML
<button> not <div onClick>

<nav>, <main>, <article> for structure
<label> for form inputs

ARIA attributes

<div role="alert" aria-live="polite">Saving...</div>
<button aria-label="Close suggestion" aria-pressed="false">

Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
if (e.key === 'Enter' || e.key === ' ') {
acceptSuggestion();
}
if (e.key === 'Escape') {
dismissSuggestion();
}
};

Focus management
const modalRef = useRef<HTMLDivElement>(null);

useEffect(() => {
if (isOpen) {
// Trap focus in modal
modalRef.current?.focus();
}
}, [isOpen]);

Screen reader testing: Test with NVDA, JAWS, VoiceOver

Color contrast: WCAG AA minimum (4.5:1)

Automated testing:

import { axe, toHaveNoViolations } from 'jest-axe';

it('has no accessibility violations', async () => {
const { container } = render(<MyComponent />);
const results = await axe(container);
expect(results).toHaveNoViolations();
});

11. Summary & Architecture Rationale
    Key Architectural Decisions
1. Hybrid Local-Server Processing
   Decision: Split analysis between client (basic) and server (advanced)
   Rationale: Reduces latency for common errors while leveraging ML for complex suggestions
   Trade-off: More complex synchronization, but better UX
1. Zustand + React Query State Management
   Decision: Zustand for client state, React Query for server state
   Rationale: Simpler than Redux, better performance than Context
   Trade-off: Less ecosystem than Redux, but sufficient for our needs
1. Virtual Rendering
   Decision: Only render visible viewport for large documents
   Rationale: Constant performance regardless of document size
   Trade-off: More complex implementation, but necessary at scale
1. Service Worker + IndexedDB Offline
   Decision: Full offline support for core features
   Rationale: Users expect to write anywhere, critical differentiator
   Trade-off: Added complexity, but table stakes for writing tool
1. WebSocket for Real-time Sync
   Decision: Persistent WebSocket connection for live updates
   Rationale: Lower latency than polling, bidirectional communication
   Trade-off: More infrastructure, but better UX for collaboration
   Scaling Considerations
   Current Scale (20M DAU):
   Single-region deployment
   CDN for static assets
   Regional API servers
   WebSocket connection pooling
   Future Scale (100M+ DAU):
   Multi-region deployment
   Edge computing for analysis
   Distributed WebSocket infrastructure
   Micro-frontend architecture for independent scaling
   Future Improvements
   Edge Computing: Move basic analysis to edge (Cloudflare Workers)
   Streaming Analysis: Server-Sent Events for progressive suggestions
   Machine Learning: On-device ML models (TensorFlow.js)
   Voice Input: Speech-to-text integration
   Advanced Collaboration: Real-time co-editing with CRDTs
   Plugin System: Allow third-party extensions
   Mobile Apps: React Native for iOS/Android
   Why This Architecture?
   Interview-Grade Explanation:
   "This architecture prioritizes perceived performance and user experience above all else. Every decision traces back to the core UX requirement: writing should feel instantaneous and never block the user.
   We achieve this through:
   Optimistic updates - UI responds immediately
   Hybrid processing - Fast local checks, smart server analysis
   Virtual rendering - Constant performance at any document size
   Offline-first - Works everywhere, syncs when possible
   Micro-optimizations - 60fps rendering, <16ms frame budget
   The trade-offs are intentional:
   More complex caching → But necessary for offline
   Dual state management → But optimizes for different data types
   Virtual scrolling → But only way to handle 100+ page docs
   This architecture scales horizontally (add more servers), supports 500K+ concurrent users, and maintains sub-100ms latency for 95th percentile requests. It's production-ready and battle-tested for high-scale consumer applications."

Total Lines: ~2,300 Estimated Size: ~95KB
This HLD covers all requested sections with production-ready depth, real-world trade-offs, and interview-focused explanations. The code examples are TypeScript-based with detailed comments, diagrams use ASCII art, and the architecture is designed for scale with specific performance targets.
