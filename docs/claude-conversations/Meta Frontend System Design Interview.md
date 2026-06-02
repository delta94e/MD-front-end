# Meta Frontend System Design Interview

## Claude


# Cuộc Phỏng Vấn Front-end System Design: Collaborative Document Editor


*Mô phỏng phỏng vấn tại Meta - Senior Frontend Engineer Position*


---


## Phần Mở Đầu


*[Thời gian: 09:00 AM - 09:10 AM]*


**Người phỏng vấn:** Chào bạn! Tôi là Minh, hiện đang làm Staff Engineer ở Meta, focus chủ yếu vào frontend infrastructure và các hệ thống collaboration tools. Tôi đã có 8 năm kinh nghiệm trong việc xây dựng các ứng dụng web quy mô lớn, đặc biệt là những hệ thống real-time collaboration như Workplace và một số internal tools. Hôm nay tôi sẽ phỏng vấn bạn cho vị trí Senior Frontend Engineer trong team chúng tôi.


**Ứng viên:** Chào anh Minh! Em là Nam, rất vui được tham gia buổi phỏng vấn hôm nay. Em có 5 năm kinh nghiệm làm frontend engineer, chủ yếu với React ecosystem. Trong công việc trước, em đã build và maintain một số ứng dụng có tính collaborative như project management tool và real-time dashboard cho ecommerce platform.


**Người phỏng vấn:** Tuyệt vời! Trước khi chúng ta bắt đầu, để em hiểu rõ hơn về format cuộc phỏng vấn hôm nay. Đây là buổi phỏng vấn frontend system design, chúng ta sẽ có khoảng 45 phút để discuss một bài toán thiết kế hệ thống. Tôi sẽ đánh giá based trên 6 tiêu chí chính:


1. **Problem Exploration** - khả năng hiểu và clarify requirements
2. **Architecture** - thiết kế kiến trúc comprehensive và scalable
3. **Technical Proficiency** - kiến thức frontend fundamentals và advanced concepts
4. **Exploration and Tradeoffs** - đưa ra multiple solutions và explain pros/cons
5. **Product and UX Sense** - consider user experience và edge cases
6. **Communication and Collaboration** - express ideas clearly và engage effectively


Chúng ta sẽ follow cấu trúc **RADIO framework**:


- **R**equirements exploration
- **A**rchitecture / High-level design
- **D**ata model
- **I**nterface definition
- **O**ptimizations and deep dive


Mình khuyến khích bạn ask questions, think out loud, và treat this như một collaborative problem-solving session. Có câu hỏi gì về format không?


**Ứng viên:** Em hiểu rồi ạ. Em có thể clarify là requirements sẽ được provide upfront hay em cần tự hỏi để gather requirements?


**Người phỏng vấn:** Excellent question! Đây chính xác là điều tôi muốn thấy - problem exploration mindset. Tôi sẽ give high-level problem statement, nhưng một part quan trọng của bài test này là ability để ask right questions để clarify và define scope properly. Ready to start?


**Ứng viên:** Dạ, em sẵn sàng ạ!


**Người phỏng vấn:** Perfect! Trước khi dive vào main problem, em có thể briefly share về experience với real-time applications không? Đặc biệt là những challenges về data synchronization hoặc collaborative features mà em đã encounter?


**Ứng viên:** Có ạ! Trong project management tool em build trước đây, em đã implement tính năng collaborative task boards với real-time updates. Một số challenges chính mà em gặp:


1. **Conflict resolution** - khi multiple users edit cùng một task simultaneous, cần strategy để merge changes
2. **Network reliability** - handle disconnection và reconnection gracefully
3. **Performance** - với nhiều users active, việc broadcast mọi change có thể overwhelming
4. **UI consistency** - đảm bảo UI state consistent across users khi có updates


Em đã solve bằng cách sử dụng WebSocket cho real-time communication, implement optimistic updates, và design một simple operational transformation system cho text fields.


**Người phỏng vấn:** Great background! Những experiences đó sẽ rất useful cho problem chúng ta sắp tackle. Tôi có thể thấy bạn đã có solid foundation về real-time systems. Now, let's dive into our main challenge.


---


## Bài Toán Chính: Collaborative Document Editor


*[Thời gian: 09:10 AM - 09:55 AM]*


**Người phỏng vấn:** Hôm nay chúng ta sẽ thiết kế một **Collaborative Document Editor** - basically một simplified version của Google Docs. Users có thể create, edit, và collaborate trên text documents trong real-time.


Tôi muốn bạn approach this systematically theo RADIO framework. Hãy bắt đầu với Requirements exploration first. What questions would you ask để better understand this problem?


---


## [RADIO Phase: Requirements]


*[Thời gian: 09:10 AM - 09:18 AM | Duration: 8 phút]*


**Ứng viên:** Tuyệt! Em sẽ start với requirements exploration. Em có một số câu hỏi để better understand scope và constraints:


**1. Core Functionality:**


- Đây có phải là rich text editor không? Hay chỉ là plain text?
- Users có thể format text không (bold, italic, headers, lists)?
- Có support images, tables, hoặc embedded content không?


**2. Collaboration Features:**


- Có bao nhiêu users có thể collaborate simultaneously trên một document?
- Có cần show real-time cursors của other users không?
- Có cần comment system hoặc suggestion mode không?


**3. Document Management:**


- Users có thể create/delete documents không?
- Có version history và ability to revert changes không?
- Có sharing và permission system không?


**4. Platform và Scale:**


- Đây là web-only hay cần support mobile?
- Expected number of concurrent users globally?
- Documents có size limit không?


**Người phỏng vấn:** Excellent questions! Tôi thích cách bạn breakdown thành different categories. Đây shows good problem exploration skills. Let me provide clarity:


**Core Functionality:**


- Rich text editor với basic formatting (bold, italic, underline, headers, lists)
- No images hoặc complex embedded content for now
- Focus on text editing experience


**Collaboration:**


- Support up to 10 concurrent editors per document (reasonable limit)
- Yes, show real-time cursors và user presence
- Comments system là nice-to-have, không required for MVP


**Document Management:**


- Users có thể create/delete documents
- Version history là good-to-have, không critical for initial version
- Basic sharing với link sharing, no complex permissions initially


**Platform & Scale:**


- Web-first, desktop và mobile responsive
- Assume medium scale: thousands of users, hundreds of concurrent documents
- Documents up to 100 pages (reasonable limit)


Any follow-up questions trước khi chúng ta move to architecture?


**Ứng viên:** Em có thêm một số technical questions:


**Performance Requirements:**


- Latency expectation cho real-time updates? Sub-second?
- Có offline editing capability requirement không?


**Browser Support:**


- Có cần support legacy browsers hay chỉ modern browsers?


**Infrastructure:**


- Có constraints gì về backend technology hay infrastructure không?


**Người phỏng vấn:** Great follow-ups!


**Performance:** Sub-500ms latency cho real-time updates, offline editing không required cho MVP nhưng architecture should allow for future addition.


**Browser Support:** Modern browsers only (Chrome, Firefox, Safari, Edge - last 2 versions).


**Infrastructure:** No specific constraints, assume chúng ta có flexibility to choose appropriate technologies.


Perfect! Tôi thấy bạn đã thoroughly explore requirements. Điều này shows strong problem exploration skills - một trong những evaluation criteria quan trọng nhất. You're asking right questions để clarify ambiguity trước khi jump into solution.


Now let's move to Architecture design. How would you approach structuring this system?


---


## [RADIO Phase: Architecture]


*[Thời gian: 09:18 AM - 09:28 AM | Duration: 10 phút]*


**Ứng viên:** Great! Based trên requirements vừa clarify, em sẽ thiết kế architecture cho collaborative document editor. Em sẽ break down thành các key components:


### High-Level Architecture


**1. Client-Side Architecture (React-based):**


```
┌─────────────────────────────────────────────────────┐
│                   CLIENT SIDE                       │
├─────────────────────────────────────────────────────┤
│  UI Layer                                           │
│  ├── DocumentEditor Component                       │
│  ├── Toolbar Component                              │
│  ├── Cursor & User Presence                         │
│  └── Comments & Collaboration UI                    │
├─────────────────────────────────────────────────────┤
│  State Management Layer                             │
│  ├── Document State (Redux/Zustand)                 │
│  ├── Collaboration State                            │
│  ├── UI State                                       │
│  └── User Session State                             │
├─────────────────────────────────────────────────────┤
│  Business Logic Layer                               │
│  ├── Operational Transform Engine                   │
│  ├── Conflict Resolution                            │
│  ├── Local Operations Queue                         │
│  └── Synchronization Manager                        │
├─────────────────────────────────────────────────────┤
│  Communication Layer                                │
│  ├── WebSocket Manager                              │
│  ├── HTTP API Client                                │
│  ├── Retry & Error Handling                         │
│  └── Connection State Management                    │
└─────────────────────────────────────────────────────┘
```


**2. Server-Side Architecture:**


```
┌─────────────────────────────────────────────────────┐
│                   SERVER SIDE                       │
├─────────────────────────────────────────────────────┤
│  API Gateway / Load Balancer                        │
├─────────────────────────────────────────────────────┤
│  WebSocket Server (Real-time)                       │
│  ├── Connection Management                          │
│  ├── Room Management (Document Sessions)            │
│  ├── Operation Broadcasting                         │
│  └── Conflict Resolution                            │
├─────────────────────────────────────────────────────┤
│  HTTP API Server (REST/GraphQL)                     │
│  ├── Document CRUD Operations                       │
│  ├── User Authentication                            │
│  ├── Permission Management                          │
│  └── Document Metadata                              │
├─────────────────────────────────────────────────────┤
│  Business Logic Services                            │
│  ├── Operational Transform Service                  │
│  ├── Document Persistence Service                   │
│  ├── History Tracking Service                       │
│  └── Collaboration Service                          │
├─────────────────────────────────────────────────────┤
│  Data Layer                                         │
│  ├── Document Storage (MongoDB/PostgreSQL)          │
│  ├── Operation Log Store                            │
│  ├── User Session Store (Redis)                     │
│  └── File Storage (for exports)                     │
└─────────────────────────────────────────────────────┘
```


### Key Architectural Decisions:


**1. Operational Transform (OT) Approach:**


- Sử dụng OT algorithm để handle concurrent edits
- Client-side prediction với server-side resolution
- Operation log để maintain document history


**2. Hybrid Communication:**


- WebSocket cho real-time operations và presence
- HTTP API cho document management và metadata
- Separation of concerns giữa real-time và stateful operations


**3. React Architecture Pattern:**


- Component composition với clear separation
- Custom hooks cho business logic isolation
- Context API cho collaboration state
- State management library cho complex state


**Người phỏng vấn:** Solid architectural thinking! Tôi thích cách bạn separate concerns và think về both client và server side. Một số observations:


1. **Component separation** rất clean - UI, state, business logic, communication
2. **Operational Transform choice** shows good understanding của collaborative editing challenges
3. **Hybrid communication approach** là practical - WebSocket cho real-time, HTTP cho stateful


Tôi muốn dig deeper vào một số areas. Tại sao bạn chọn Operational Transform thay vì alternatives như Conflict-free Replicated Data Types (CRDTs)?


**Ứng viên:** Tuyệt câu hỏi! Em đã consider cả hai approaches:


**Operational Transform (OT):**


- **Pros:** Mature, battle-tested (Google Docs uses OT), smaller memory footprint, deterministic conflict resolution
- **Cons:** Complex implementation, requires central server for ordering operations
- **Best for:** Real-time editing với central authority


**Conflict-free Replicated Data Types (CRDTs):**


- **Pros:** Eventual consistency, works offline, no central coordination needed
- **Cons:** Larger memory overhead, harder to implement undo/redo, complex for text editing
- **Best for:** Distributed systems, offline-first applications


**Decision rationale:** Given requirements với central server architecture và real-time collaboration focus, OT là better fit. OT provides immediate consistency và deterministic results mà users expect trong collaborative editing. Memory efficiency cũng important cho text documents.


**Người phỏng vấn:** Excellent analysis! Đây chính xác là loại tradeoff discussion tôi muốn thấy. Bạn considered alternatives và provided clear reasoning. This demonstrates strong exploration and tradeoffs evaluation.


Một question khác về React architecture: tại sao bạn mention cả Redux/Zustand và Context API? How would you decide giữa chúng?


**Ứng viên:** Great question! Em sẽ explain decision criteria:


**Context API approach:**


```javascript
// Suitable cho collaboration state
const CollaborationContext = createContext();
const DocumentContext = createContext();

// Pros: Built-in React, no external deps, good for domain-specific state
// Cons: Performance issues với frequent updates, provider hell
```


**External State Management (Zustand):**


```javascript
// Better cho document content state
const useDocumentStore = create((set, get) => ({
  content: '',
  operations: [],
  updateContent: (newContent) => set({ content: newContent }),
  addOperation: (op) => set(state => ({
    operations: [...state.operations, op]
  }))
}));

// Pros: Better performance, devtools, time-travel debugging
// Cons: External dependency, learning curve
```


**Em sẽ use hybrid approach:**


- **Zustand** cho document content và operations (high-frequency updates)
- **Context API** cho user presence và UI state (low-frequency updates)
- **useState/useReducer** cho component-local state


Rationale: Document content changes frequently và needs efficient updates, while collaboration UI state changes less often.


**Người phỏng vấn:** Perfect explanation! Bạn đã show understanding of performance implications và made practical decisions. The hybrid approach shows maturity trong architectural thinking.


Giờ chúng ta có solid architecture overview. Let's move to data modeling để define specific data structures we'll need.


---


## [RADIO Phase: Data Model]


*[Thời gian: 09:28 AM - 09:33 AM | Duration: 5 phút]*


**Ứng viên:** Em sẽ define data models cho collaborative document editor, chia thành server-side và client-side data:


### Server-Side Data Models:


**1. Document Entity:**


```javascript
interface Document {
  id: string;                    // Unique document identifier
  title: string;                 // Document title
  content: DocumentContent;      // Rich text content
  ownerId: string;              // Creator user ID
  collaborators: string[];       // Array of user IDs with access
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modification timestamp
  version: number;              // Current document version
  isPublic: boolean;            // Public sharing flag
  shareToken?: string;          // Optional share token for link sharing
}

interface DocumentContent {
  type: 'doc';
  content: ContentBlock[];      // Array of content blocks
}

interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list' | 'listItem';
  attrs?: { level?: number; listType?: 'bullet' | 'ordered' };
  content?: TextNode[];
}

interface TextNode {
  type: 'text';
  text: string;
  marks?: Mark[];               // Formatting marks
}

interface Mark {
  type: 'bold' | 'italic' | 'underline' | 'link';
  attrs?: { href?: string };    // For link marks
}
```


**2. Operation Log:**


```javascript
interface Operation {
  id: string;                   // Unique operation ID
  documentId: string;           // Target document
  userId: string;              // User who performed operation
  type: 'insert' | 'delete' | 'format' | 'transform';
  position: number;            // Position in document
  content?: string;            // For insert operations
  length?: number;             // For delete operations
  marks?: Mark[];              // For format operations
  timestamp: Date;             // Operation timestamp
  version: number;             // Document version when applied
  clientId: string;            // Client session ID
}
```


**3. User Session:**


```javascript
interface UserSession {
  userId: string;
  documentId: string;
  cursor: {
    position: number;
    selection?: { from: number; to: number };
  };
  presence: {
    isActive: boolean;
    lastSeen: Date;
    connectionId: string;
  };
  user: {
    name: string;
    avatar?: string;
    color: string;              // Unique color for cursor/selection
  };
}
```


### Client-Side Data Models:


**1. Document Store State:**


```javascript
interface DocumentState {
  // Current document data
  document: Document | null;

  // Content state
  content: DocumentContent;
  selection: Selection | null;

  // Operation tracking
  pendingOperations: Operation[];
  acknowledgedVersion: number;

  // Collaboration state
  collaborators: Map<string, UserSession>;

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';

  // Error handling
  error: string | null;
}

interface Selection {
  from: number;
  to: number;
  head: number;                 // Cursor position for caret
}
```


**2. Operational Transform Data:**


```javascript
interface TransformContext {
  documentVersion: number;
  pendingOps: Operation[];
  serverOps: Operation[];
  transformedOps: Operation[];
}
```


### Data Classification:


**Server-originated data:**


- Document metadata và content
- Operation logs
- User information
- Share settings


**Client-only data:**


- Current selection state
- Pending operations queue
- UI state (loading, errors)
- Local cursor position


**Persistent vs Ephemeral:**


- **Persistent:** Documents, operations log, user accounts
- **Ephemeral:** User presence, cursor positions, UI state


**Người phỏng vấn:** Excellent data modeling! Tôi thấy bạn đã thought through several important aspects:


1. **Rich text representation** với structured blocks và marks - this is practical
2. **Operation tracking** với version numbers - essential cho OT
3. **Separation of concerns** giữa persistent và ephemeral data
4. **Client-side state structure** organized well cho performance


Question về rich text structure: tại sao bạn chọn block-based approach thay vì flat string với markup?


**Ứng viên:** Good question! Em chọn block-based structure vì several reasons:


**Block-based advantages:**


- **Operational Transform efficiency:** Easier to isolate operations to specific blocks
- **Rendering performance:** React có thể optimize re-renders per block
- **Selection handling:** Cleaner cursor positioning và selection logic
- **Future extensibility:** Easy to add new block types (tables, images)


**Alternative flat string approach:**


```javascript
// Flat approach - harder to manage
interface FlatContent {
  text: string;  // "Hello **world** this is *italic*"
  marks: Array<{ start: number; end: number; type: string }>;
}
```


**Trade-offs:**


- Flat structure: Simpler initially, harder to maintain, complex OT
- Block structure: More complex upfront, cleaner operations, better performance


Block structure aligns better với React's component model và provides cleaner operational semantics.


**Người phỏng vấn:** Perfect reasoning! The performance và maintainability considerations show good architectural maturity. Bạn đã demonstrate solid technical proficiency trong data modeling.


Now let's define the interfaces - both API contracts và React component interfaces.


---


## [RADIO Phase: Interface Definition]


*[Thời gian: 09:33 AM - 09:41 AM | Duration: 8 phút]*


**Ứng viên:** Em sẽ define comprehensive interfaces cho cả API contracts và React component interfaces:


### Server-Client API Interfaces:


**1. HTTP REST API:**


```javascript
// Document Management APIs
interface DocumentAPI {
  // CRUD Operations
  createDocument(data: { title: string; content?: DocumentContent }): Promise<Document>;
  getDocument(id: string): Promise<Document>;
  updateDocument(id: string, data: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Collaboration
  getDocumentCollaborators(id: string): Promise<UserSession[]>;
  shareDocument(id: string, settings: ShareSettings): Promise<{ shareToken: string }>;
  joinDocument(id: string, shareToken?: string): Promise<{
    document: Document;
    userSession: UserSession;
    collaborators: UserSession[];
  }>;
}

// User Management APIs
interface UserAPI {
  getCurrentUser(): Promise<User>;
  updateUserProfile(data: Partial<User>): Promise<User>;
}

// Share Settings
interface ShareSettings {
  isPublic: boolean;
  allowedUsers?: string[];
  permissions: 'read' | 'write' | 'admin';
}
```


**2. WebSocket Real-time API:**


```javascript
// Client to Server Events
interface ClientEvents {
  // Document Operations
  'operation:submit': {
    documentId: string;
    operation: Operation;
    clientVersion: number;
  };

  // Presence Updates
  'presence:update': {
    documentId: string;
    cursor: CursorPosition;
    selection?: SelectionRange;
  };

  // Connection Management
  'document:join': { documentId: string };
  'document:leave': { documentId: string };
}

// Server to Client Events
interface ServerEvents {
  // Operation Broadcasting
  'operation:applied': {
    operation: Operation;
    documentVersion: number;
    userId: string;
  };

  'operation:acknowledged': {
    operationId: string;
    serverVersion: number;
  };

  // Presence Broadcasting
  'presence:user-joined': UserSession;
  'presence:user-left': { userId: string };
  'presence:cursor-moved': {
    userId: string;
    cursor: CursorPosition;
    selection?: SelectionRange;
  };

  // Error Handling
  'error:operation-rejected': {
    operationId: string;
    reason: string;
    serverVersion: number;
  };

  // Connection Status
  'connection:reconnected': {
    documentVersion: number;
    missedOperations: Operation[];
  };
}

interface CursorPosition {
  position: number;
  blockId?: string;
}

interface SelectionRange {
  from: number;
  to: number;
}
```


### React Component Interfaces:


**1. Main Editor Component:**


```javascript
interface DocumentEditorProps {
  documentId: string;
  initialContent?: DocumentContent;
  readOnly?: boolean;
  className?: string;

  // Event Handlers
  onContentChange?: (content: DocumentContent) => void;
  onSelectionChange?: (selection: Selection) => void;
  onSave?: (document: Document) => void;
  onError?: (error: Error) => void;

  // Collaboration Props
  showCollaborators?: boolean;
  enableComments?: boolean;

  // UI Customization
  toolbar?: ToolbarConfig;
  theme?: EditorTheme;
}

interface ToolbarConfig {
  enabledTools: ToolbarTool[];
  customTools?: CustomTool[];
  position: 'top' | 'bottom' | 'floating';
}

type ToolbarTool =
  | 'bold' | 'italic' | 'underline'
  | 'h1' | 'h2' | 'h3'
  | 'bulletList' | 'orderedList'
  | 'undo' | 'redo';

interface CustomTool {
  id: string;
  icon: React.ComponentType;
  label: string;
  onClick: (editor: EditorInstance) => void;
}
```


**2. Collaboration Components:**


```javascript
interface CollaboratorCursorsProps {
  collaborators: Map<string, UserSession>;
  currentUserId: string;
  editorRef: React.RefObject<HTMLElement>;
}

interface UserPresenceListProps {
  collaborators: UserSession[];
  maxVisible?: number;
  showDetails?: boolean;
  onUserClick?: (user: User) => void;
}

interface CommentSystemProps {
  documentId: string;
  selection?: Selection;
  comments: Comment[];
  onAddComment?: (content: string, selection: Selection) => void;
  onResolveComment?: (commentId: string) => void;
}
```


**3. Custom Hooks Interfaces:**


```javascript
// Document Management Hook
interface UseDocumentEditor {
  (documentId: string, options?: EditorOptions): {
    // Document State
    document: Document | null;
    content: DocumentContent;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Editor Methods
    updateContent: (content: DocumentContent) => void;
    insertText: (text: string, position: number) => void;
    deleteText: (from: number, to: number) => void;
    formatText: (from: number, to: number, marks: Mark[]) => void;

    // History
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Save Management
    save: () => Promise<void>;
    autoSave: boolean;
  };
}

// Collaboration Hook
interface UseCollaboration {
  (documentId: string): {
    // Collaboration State
    collaborators: Map<string, UserSession>;
    isConnected: boolean;
    connectionStatus: ConnectionStatus;

    // Presence Methods
    updateCursor: (position: CursorPosition) => void;
    updateSelection: (selection: SelectionRange) => void;

    // Operation Methods
    submitOperation: (operation: Operation) => void;

    // Events
    onUserJoined: (callback: (user: UserSession) => void) => void;
    onUserLeft: (callback: (userId: string) => void) => void;
  };
}

// Real-time Sync Hook
interface UseRealTimeSync {
  (documentId: string): {
    // Sync State
    pendingOperations: Operation[];
    lastSyncedVersion: number;
    syncStatus: 'synced' | 'pending' | 'error';

    // Sync Methods
    submitOperation: (operation: Operation) => Promise<void>;
    resolvePendingOperations: () => void;

    // Event Handlers
    onOperationReceived: (operation: Operation) => void;
    onSyncError: (error: SyncError) => void;
  };
}

interface EditorOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableCollaboration?: boolean;
  readOnly?: boolean;
  spellCheck?: boolean;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface SyncError {
  type: 'conflict' | 'network' | 'permission' | 'version_mismatch';
  message: string;
  operation?: Operation;
  serverVersion?: number;
}
```


### API Error Handling:


**1. HTTP API Errors:**


```javascript
interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Common Error Codes
type APIErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_EXCEEDED';
```


**2. WebSocket Error Handling:**


```javascript
interface WebSocketError {
  type: 'connection' | 'operation' | 'sync' | 'permission';
  code: string;
  message: string;
  data?: any;
}
```


**Người phỏng vấn:** Outstanding interface design! Tôi rất impressed với comprehensive coverage. Một số highlights:


1. **API separation** rõ ràng giữa HTTP và WebSocket - good architectural decision
2. **React component interfaces** well-structured với proper TypeScript usage
3. **Custom hooks design** encapsulate complexity và provide clean APIs
4. **Error handling** được thought through với specific error types


Tôi muốn dig deeper vào custom hooks design. Tại sao bạn separate `useDocumentEditor`, `useCollaboration`, và `useRealTimeSync` thay vì một single hook?


**Ứng viên:** Excellent question! Em design với **separation of concerns principle**:


**Why separate hooks:**


```javascript
// Single responsibility - easier testing and reusability
const DocumentEditor = ({ documentId }) => {
  // Document editing concerns
  const { content, updateContent, save } = useDocumentEditor(documentId);

  // Collaboration concerns
  const { collaborators, updateCursor } = useCollaboration(documentId);

  // Sync concerns
  const { syncStatus, submitOperation } = useRealTimeSync(documentId);

  // Clean composition
  return (
    <div>
      <Editor content={content} onChange={updateContent} />
      <CollaboratorList users={collaborators} />
      <SyncStatus status={syncStatus} />
    </div>
  );
};
```


**Benefits:**


1. **Single Responsibility:** Mỗi hook handle một specific concern
2. **Testability:** Có thể test document editing mà không cần collaboration
3. **Reusability:** `useRealTimeSync` có thể reuse cho other collaborative features
4. **Performance:** Selective re-renders based on specific state changes
5. **Debugging:** Easier to identify which layer has issues


**Alternative monolithic approach:**


```javascript
// Harder to maintain and test
const useCollaborativeEditor = (documentId) => {
  // All concerns mixed together - harder to reason about
  return { /* everything mixed */ };
};
```


**Người phỏng vấn:** Perfect explanation! Separation of concerns là fundamental principle, và bạn applied it effectively. This shows mature understanding của React patterns và API design.


Quick question về error handling: làm sao handle network partitions hoặc temporary disconnections trong WebSocket communication?


**Ứng viên:** Great question! Em sẽ implement robust reconnection strategy:


**Network Resilience Strategy:**


```javascript
const useReconnection = (documentId: string) => {
  const [connectionState, setConnectionState] = useState('connected');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const handleDisconnection = useCallback(() => {
    setConnectionState('disconnected');

    // Exponential backoff reconnection
    const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

    setTimeout(() => {
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setConnectionState('reconnecting');
        reconnectAttempts.current++;
        // Attempt reconnection
        initializeWebSocket();
      } else {
        setConnectionState('error');
        // Fallback to HTTP polling or manual reconnect
      }
    }, reconnectDelay);
  }, []);

  return { connectionState, handleDisconnection };
};

// Queue operations during disconnection
const useOperationQueue = () => {
  const [queuedOperations, setQueuedOperations] = useState([]);

  const queueOperation = (operation) => {
    setQueuedOperations(prev => [...prev, operation]);
  };

  const flushQueue = async () => {
    // Send all queued operations when reconnected
    for (const operation of queuedOperations) {
      await submitOperation(operation);
    }
    setQueuedOperations([]);
  };

  return { queueOperation, flushQueue };
};
```


Excellent! Giờ chúng ta đã có solid foundation với clear interfaces. Let's move to optimizations và deep dive - đây là phần quan trọng nhất chiếm 40% thời gian.


---


## [RADIO Phase: Optimizations and Deep Dive]


*[Thời gian: 09:41 AM - 09:55 AM | Duration: 14 phút]*


**Người phỏng vấn:** Giờ chúng ta sẽ dive deep vào optimizations và advanced topics. Đây là phần tôi muốn thấy technical proficiency và problem-solving depth của bạn. Let's start với performance optimizations.


### Performance Optimizations


**Ứng viên:** Em sẽ approach performance optimizations từ multiple angles:


#### 1. React Rendering Optimizations


**Component-Level Optimizations:**


```javascript
// Memoized Editor Component để avoid unnecessary re-renders
const DocumentEditor = React.memo(({
  content,
  collaborators,
  onContentChange
}) => {
  // Memoize expensive operations
  const parsedContent = useMemo(() =>
    parseDocumentContent(content), [content]
  );

  // Callback memoization
  const handleContentChange = useCallback((newContent) => {
    onContentChange?.(newContent);
  }, [onContentChange]);

  // Split UI concerns for selective updates
  return (
    <EditorContainer>
      <EditorToolbar /> {/* Won't re-render on content change */}
      <EditorContent
        content={parsedContent}
        onChange={handleContentChange}
      />
      <CollaboratorPresence users={collaborators} />
    </EditorContainer>
  );
});

// Block-level rendering optimization
const ContentBlock = React.memo(({
  block,
  index,
  onChange
}) => {
  // Only re-render this block when its content changes
  const handleBlockChange = useCallback((newBlock) => {
    onChange(index, newBlock);
  }, [index, onChange]);

  return (
    <div className="content-block">
      {renderBlockContent(block, handleBlockChange)}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for deep equality
  return deepEqual(prevProps.block, nextProps.block);
});
```


**Virtual Scrolling cho Large Documents:**


```javascript
const VirtualizedDocument = ({ blocks, viewportHeight = 600 }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef();

  // Calculate visible blocks based on scroll position
  const updateVisibleRange = useCallback(
    throttle((scrollTop) => {
      const blockHeight = 50; // Average block height
      const start = Math.floor(scrollTop / blockHeight);
      const end = start + Math.ceil(viewportHeight / blockHeight) + 5;

      setVisibleRange({ start, end: Math.min(end, blocks.length) });
    }, 100),
    [blocks.length, viewportHeight]
  );

  return (
    <div
      ref={containerRef}
      style={{ height: viewportHeight, overflow: 'auto' }}
      onScroll={(e) => updateVisibleRange(e.target.scrollTop)}
    >
      {/* Render spacer for non-visible top blocks */}
      <div style={{ height: visibleRange.start * 50 }} />

      {/* Render only visible blocks */}
      {blocks.slice(visibleRange.start, visibleRange.end).map((block, index) => (
        <ContentBlock
          key={visibleRange.start + index}
          block={block}
          index={visibleRange.start + index}
        />
      ))}

      {/* Render spacer for non-visible bottom blocks */}
      <div style={{
        height: (blocks.length - visibleRange.end) * 50
      }} />
    </div>
  );
};
```


#### 2. Real-time Operation Optimizations


**Operation Batching:**


```javascript
const useOperationBatching = (documentId) => {
  const [pendingOperations, setPendingOperations] = useState([]);
  const batchTimeoutRef = useRef();

  const submitOperation = useCallback((operation) => {
    setPendingOperations(prev => [...prev, operation]);

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Batch operations for 100ms
    batchTimeoutRef.current = setTimeout(() => {
      if (pendingOperations.length > 0) {
        // Combine operations where possible
        const optimizedOps = optimizeOperations(pendingOperations);

        // Send batch to server
        sendOperationBatch(documentId, optimizedOps);
        setPendingOperations([]);
      }
    }, 100);
  }, [documentId, pendingOperations]);

  return { submitOperation };
};

// Optimize consecutive operations
const optimizeOperations = (operations) => {
  const optimized = [];

  for (let i = 0; i < operations.length; i++) {
    const current = operations[i];
    const next = operations[i + 1];

    // Combine consecutive inserts at same position
    if (next &&
        current.type === 'insert' &&
        next.type === 'insert' &&
        current.position + current.content.length === next.position) {

      operations[i + 1] = {
        ...current,
        content: current.content + next.content
      };
      continue; // Skip current, use combined next
    }

    optimized.push(current);
  }

  return optimized;
};
```


**Operational Transform Performance:**


```javascript
class OptimizedOTEngine {
  constructor() {
    this.transformCache = new Map();
  }

  // Cache transform results để avoid recomputation
  transform(op1, op2) {
    const cacheKey = `${op1.id}-${op2.id}`;

    if (this.transformCache.has(cacheKey)) {
      return this.transformCache.get(cacheKey);
    }

    const result = this.computeTransform(op1, op2);
    this.transformCache.set(cacheKey, result);

    // Limit cache size
    if (this.transformCache.size > 1000) {
      const firstKey = this.transformCache.keys().next().value;
      this.transformCache.delete(firstKey);
    }

    return result;
  }

  computeTransform(op1, op2) {
    // Optimized transform logic
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return {
          ...op2,
          position: op2.position + op1.content.length
        };
      }
      return op2; // No change needed
    }

    // Handle other operation combinations
    return this.handleOtherTransforms(op1, op2);
  }
}
```


#### 3. Network và Caching Optimizations


**Intelligent Caching Strategy:**


```javascript
const useCachedDocument = (documentId) => {
  const cacheRef = useRef(new Map());

  const getCachedDocument = useCallback(async (id) => {
    // Check memory cache first
    if (cacheRef.current.has(id)) {
      const cached = cacheRef.current.get(id);

      // Check if cache is still valid (5 minutes)
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return cached.document;
      }
    }

    // Check browser cache
    const cachedResponse = await caches.match(`/api/documents/${id}`);
    if (cachedResponse) {
      const document = await cachedResponse.json();

      // Verify cache freshness with server
      const headResponse = await fetch(`/api/documents/${id}`, {
        method: 'HEAD'
      });

      const serverETag = headResponse.headers.get('ETag');
      const cachedETag = cachedResponse.headers.get('ETag');

      if (serverETag === cachedETag) {
        // Update memory cache
        cacheRef.current.set(id, {
          document,
          timestamp: Date.now()
        });
        return document;
      }
    }

    // Fetch fresh data
    const response = await fetch(`/api/documents/${id}`);
    const document = await response.json();

    // Update both caches
    const cache = await caches.open('documents-v1');
    cache.put(`/api/documents/${id}`, response.clone());

    cacheRef.current.set(id, {
      document,
      timestamp: Date.now()
    });

    return document;
  }, []);

  return { getCachedDocument };
};
```


**WebSocket Message Compression:**


```javascript
const useWebSocketOptimization = (documentId) => {
  const wsRef = useRef();

  const sendCompressedMessage = useCallback((message) => {
    // Compress large messages
    const serialized = JSON.stringify(message);

    if (serialized.length > 1024) {
      // Use compression for large messages
      const compressed = compressMessage(serialized);

      wsRef.current.send(JSON.stringify({
        type: 'compressed',
        data: compressed
      }));
    } else {
      wsRef.current.send(serialized);
    }
  }, []);

  return { sendCompressedMessage };
};

// Simple compression using browser's built-in compression
const compressMessage = async (message) => {
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  writer.write(new TextEncoder().encode(message));
  writer.close();

  const chunks = [];
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) chunks.push(value);
  }

  return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
};
```


**Người phỏng vấn:** Excellent performance optimizations! Tôi thấy bạn có deep understanding của React performance patterns và real-time system optimizations. Việc combine virtual scrolling, operation batching, và intelligent caching shows comprehensive thinking.


Tôi đặc biệt impressed với OT cache optimization - this is advanced stuff. Giờ let's talk về một challenge khác: **conflict resolution trong edge cases**.


### Advanced Conflict Resolution


**Ứng viên:** Em sẽ dive deep vào conflict resolution, đặc biệt là edge cases phức tạp:


#### 1. Complex Conflict Scenarios


**Scenario 1: Overlapping Operations**


```javascript
class AdvancedConflictResolver {
  resolveOverlappingOperations(localOp, remoteOp) {
    // Case: User A deletes text while User B formats same text
    if (localOp.type === 'delete' && remoteOp.type === 'format') {
      const overlap = this.calculateOverlap(localOp, remoteOp);

      if (overlap.type === 'complete') {
        // Remote format operation becomes invalid
        return {
          localOp, // Keep local delete
          remoteOp: null // Discard remote format
        };
      } else if (overlap.type === 'partial') {
        // Adjust format operation to non-deleted portion
        return {
          localOp,
          remoteOp: {
            ...remoteOp,
            position: overlap.adjustedPosition,
            length: overlap.adjustedLength
          }
        };
      }
    }

    // Case: Simultaneous block-level operations
    if (localOp.type === 'block-split' && remoteOp.type === 'block-merge') {
      return this.resolveBlockConflict(localOp, remoteOp);
    }

    return { localOp, remoteOp };
  }

  calculateOverlap(op1, op2) {
    const op1End = op1.position + (op1.length || op1.content?.length || 0);
    const op2End = op2.position + (op2.length || 0);

    // Check for overlap
    if (op1.position < op2End && op1End > op2.position) {
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1End, op2End);

      return {
        type: overlapEnd - overlapStart >= op2.length ? 'complete' : 'partial',
        adjustedPosition: op1End,
        adjustedLength: Math.max(0, op2.length - (overlapEnd - op2.position))
      };
    }

    return { type: 'none' };
  }
}
```


**Scenario 2: Network Partition Recovery**


```javascript
const usePartitionRecovery = (documentId) => {
  const [partitionState, setPartitionState] = useState('connected');
  const queuedOperations = useRef([]);

  const handlePartitionRecovery = useCallback(async () => {
    setPartitionState('recovering');

    try {
      // Get server's current document version
      const serverState = await fetch(`/api/documents/${documentId}/state`);
      const { version: serverVersion, operations: missedOperations } = await serverState.json();

      // Resolve conflicts between queued local operations và missed server operations
      const conflictResolver = new ConflictResolver();
      const resolvedOperations = conflictResolver.resolveMultipleConflicts(
        queuedOperations.current,
        missedOperations
      );

      // Apply resolved operations
      for (const operation of resolvedOperations) {
        await applyOperation(operation);
      }

      // Clear queue và mark as recovered
      queuedOperations.current = [];
      setPartitionState('connected');

    } catch (error) {
      setPartitionState('error');
      // Fallback: force reload document
      window.location.reload();
    }
  }, [documentId]);

  return { partitionState, handlePartitionRecovery };
};
```


#### 2. User Experience During Conflicts


**Optimistic UI với Rollback:**


```javascript
const useOptimisticUpdates = () => {
  const [optimisticOperations, setOptimisticOperations] = useState([]);
  const [confirmedOperations, setConfirmedOperations] = useState([]);

  const applyOptimisticOperation = useCallback((operation) => {
    // Apply immediately to UI
    setOptimisticOperations(prev => [...prev, operation]);

    // Send to server
    submitOperationToServer(operation)
      .then((serverOp) => {
        // Operation confirmed - move to confirmed list
        setOptimisticOperations(prev =>
          prev.filter(op => op.id !== operation.id)
        );
        setConfirmedOperations(prev => [...prev, serverOp]);
      })
      .catch((error) => {
        // Operation rejected - rollback
        setOptimisticOperations(prev =>
          prev.filter(op => op.id !== operation.id)
        );

        // Show user-friendly error
        showConflictResolutionUI(operation, error);
      });
  }, []);

  return { applyOptimisticOperation };
};

// Conflict Resolution UI
const ConflictResolutionModal = ({
  conflictedOperation,
  suggestions,
  onResolve
}) => {
  return (
    <Modal>
      <div className="conflict-resolution">
        <h3>Conflict Detected</h3>
        <p>Your change conflicts with a recent edit by another user.</p>

        <div className="conflict-options">
          <button onClick={() => onResolve('keep-mine')}>
            Keep My Changes
          </button>
          <button onClick={() => onResolve('keep-theirs')}>
            Keep Their Changes
          </button>
          <button onClick={() => onResolve('merge')}>
            Try to Merge
          </button>
        </div>

        {/* Show diff visualization */}
        <DiffViewer
          original={suggestions.original}
          modified={suggestions.modified}
          mine={conflictedOperation}
        />
      </div>
    </Modal>
  );
};
```


#### 3. Advanced Collaboration Features


**Smart Merge với AI/ML:**


```javascript
const useIntelligentMerge = () => {
  const [mergeEngine] = useState(() => new IntelligentMergeEngine());

  const suggestMerge = useCallback(async (conflictingOperations) => {
    // Analyze operation patterns
    const context = await mergeEngine.analyzeContext(conflictingOperations);

    // Generate merge suggestions
    const suggestions = await mergeEngine.generateSuggestions(
      conflictingOperations,
      context
    );

    return suggestions.map(suggestion => ({
      confidence: suggestion.confidence,
      mergedOperation: suggestion.operation,
      explanation: suggestion.reasoning
    }));
  }, [mergeEngine]);

  return { suggestMerge };
};

class IntelligentMergeEngine {
  async analyzeContext(operations) {
    // Analyze text patterns, user behavior, document structure
    return {
      textSimilarity: this.calculateTextSimilarity(operations),
      userIntentions: this.inferUserIntentions(operations),
      documentStructure: this.analyzeDocumentStructure(operations)
    };
  }

  async generateSuggestions(operations, context) {
    // Use heuristics hoặc ML model để suggest merge strategies
    const suggestions = [];

    // Rule-based suggestions
    if (context.textSimilarity > 0.8) {
      suggestions.push({
        confidence: 0.9,
        operation: this.createMergedOperation(operations),
        reasoning: "Similar text changes detected - auto-merge suggested"
      });
    }

    // Intent-based suggestions
    if (context.userIntentions.areComplementary) {
      suggestions.push({
        confidence: 0.75,
        operation: this.createComplementaryMerge(operations),
        reasoning: "Changes appear complementary - combined merge suggested"
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
```


**Người phỏng vấn:** Impressive! Bạn đã demonstrate advanced understanding của conflict resolution và user experience considerations. Intelligent merge với ML suggestions là particularly innovative.


Giờ tôi muốn test technical proficiency deeper. **Làm thế nào bạn handle accessibility trong collaborative editor, đặc biệt là screen reader support?**


### Accessibility và Screen Reader Support


**Ứng viên:** Accessibility là critical concern, đặc biệt cho collaborative editors. Em sẽ implement comprehensive accessibility support:


#### 1. Screen Reader Optimizations


**Semantic HTML Structure:**


```javascript
const AccessibleEditor = ({ content, collaborators }) => {
  const [announcements, setAnnouncements] = useState([]);
  const liveRegionRef = useRef();

  // Announce collaboration events
  const announceCollaborationEvent = useCallback((event) => {
    const message = formatAnnouncementMessage(event);
    setAnnouncements(prev => [...prev, message]);

    // Clear old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(-3));
    }, 1000);
  }, []);

  return (
    <div className="editor-container" role="application" aria-label="Collaborative Document Editor">
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* Main editor content */}
      <div
        role="textbox"
        aria-multiline="true"
        aria-label="Document content"
        contentEditable
        aria-describedby="editor-status collaborator-list"
      >
        {content.blocks.map((block, index) => (
          <AccessibleBlock
            key={block.id}
            block={block}
            index={index}
            totalBlocks={content.blocks.length}
          />
        ))}
      </div>

      {/* Collaboration status */}
      <div id="editor-status" className="sr-only">
        {collaborators.length > 0 &&
          `${collaborators.length} other users are editing this document`
        }
      </div>

      {/* Collaborator list for screen readers */}
      <div id="collaborator-list" className="sr-only">
        Collaborators: {collaborators.map(user => user.name).join(', ')}
      </div>
    </div>
  );
};

const AccessibleBlock = ({ block, index, totalBlocks }) => {
  const getBlockLabel = () => {
    switch (block.type) {
      case 'heading':
        return `Heading level ${block.attrs?.level || 1}`;
      case 'paragraph':
        return 'Paragraph';
      case 'list':
        return block.attrs?.listType === 'ordered' ? 'Numbered list' : 'Bullet list';
      default:
        return 'Text block';
    }
  };

  return (
    <div
      role={block.type === 'heading' ? 'heading' : undefined}
      aria-level={block.type === 'heading' ? block.attrs?.level : undefined}
      aria-label={`${getBlockLabel()}, ${index + 1} of ${totalBlocks}`}
      aria-describedby={`block-${block.id}-meta`}
    >
      {renderBlockContent(block)}

      {/* Hidden metadata for screen readers */}
      <span id={`block-${block.id}-meta`} className="sr-only">
        Block {index + 1} of {totalBlocks}. {getBlockLabel()}.
      </span>
    </div>
  );
};
```


**Keyboard Navigation:**


```javascript
const useAccessibleNavigation = (editorRef) => {
  const [focusedBlock, setFocusedBlock] = useState(0);

  const handleKeyDown = useCallback((event) => {
    const blocks = editorRef.current?.querySelectorAll('.content-block');

    switch (event.key) {
      case 'ArrowDown':
        if (event.ctrlKey) {
          event.preventDefault();
          const nextBlock = Math.min(focusedBlock + 1, blocks.length - 1);
          setFocusedBlock(nextBlock);
          blocks[nextBlock]?.focus();
        }
        break;

      case 'ArrowUp':
        if (event.ctrlKey) {
          event.preventDefault();
          const prevBlock = Math.max(focusedBlock - 1, 0);
          setFocusedBlock(prevBlock);
          blocks[prevBlock]?.focus();
        }
        break;

      case 'Home':
        if (event.ctrlKey) {
          event.preventDefault();
          setFocusedBlock(0);
          blocks[0]?.focus();
        }
        break;

      case 'End':
        if (event.ctrlKey) {
          event.preventDefault();
          const lastBlock = blocks.length - 1;
          setFocusedBlock(lastBlock);
          blocks[lastBlock]?.focus();
        }
        break;

      // Collaboration shortcuts
      case 'F2':
        event.preventDefault();
        announceCollaboratorStatus();
        break;

      case 'F3':
        event.preventDefault();
        showCollaboratorDetails();
        break;
    }
  }, [focusedBlock]);

  return { handleKeyDown, focusedBlock };
};
```


**Collaboration Announcements:**


```javascript
const useCollaborationAnnouncements = () => {
  const announce = useCallback((message, priority = 'polite') => {
    // Use different announcement strategies based on priority
    if (priority === 'assertive') {
      // For urgent notifications
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = message;

      document.body.appendChild(announcer);
      setTimeout(() => document.body.removeChild(announcer), 1000);
    } else {
      // For regular notifications
      setAnnouncements(prev => [...prev, { message, timestamp: Date.now() }]);
    }
  }, []);

  const formatAnnouncementMessage = useCallback((event) => {
    switch (event.type) {
      case 'user-joined':
        return `${event.user.name} joined the document`;
      case 'user-left':
        return `${event.user.name} left the document`;
      case 'content-changed':
        return `Content updated by ${event.user.name}`;
      case 'cursor-moved':
        return `${event.user.name} is editing near ${event.location}`;
      case 'conflict-resolved':
        return 'Editing conflict resolved automatically';
      default:
        return event.message;
    }
  }, []);

  return { announce, formatAnnouncementMessage };
};
```


#### 2. High Contrast và Visual Accessibility


**Theme Support:**


```javascript
const useAccessibleTheme = () => {
  const [theme, setTheme] = useState('default');
  const [highContrast, setHighContrast] = useState(false);

  // Detect user preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (e) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const themeStyles = useMemo(() => ({
    default: {
      '--editor-bg': '#ffffff',
      '--editor-text': '#333333',
      '--selection-bg': '#e3f2fd',
      '--cursor-color': '#1976d2'
    },
    highContrast: {
      '--editor-bg': '#000000',
      '--editor-text': '#ffffff',
      '--selection-bg': '#ffff00',
      '--cursor-color': '#ff0000'
    },
    darkMode: {
      '--editor-bg': '#1e1e1e',
      '--editor-text': '#e0e0e0',
      '--selection-bg': '#3f51b5',
      '--cursor-color': '#bb86fc'
    }
  }), []);

  const currentTheme = highContrast ? 'highContrast' : theme;

  return {
    theme: currentTheme,
    setTheme,
    themeStyles: themeStyles[currentTheme],
    highContrast
  };
};
```


**Focus Management:**


```javascript
const useFocusManagement = () => {
  const trapFocusRef = useRef();

  const trapFocus = useCallback((element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        element.querySelector('[data-dismiss]')?.click();
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { trapFocus };
};
```


**Người phỏng vấn:** Outstanding accessibility implementation! Bạn đã cover comprehensive accessibility concerns từ screen reader support đến keyboard navigation và high contrast themes. Đây shows excellent understanding của inclusive design principles.


Tôi đặc biệt impressed với collaboration announcements strategy - ensuring screen reader users có the same collaboration awareness như visual users.


Last technical deep dive: **Security considerations cho collaborative editor. Làm sao prevent XSS attacks và ensure data integrity?**


### Security Implementation


**Ứng viên:** Security là critical concern cho collaborative editors vì multiple users đang input content. Em sẽ implement multi-layered security approach:


#### 1. Content Sanitization


**Client-Side Input Sanitization:**


```javascript
import DOMPurify from 'dompurify';

class SecureContentHandler {
  constructor() {
    // Configure DOMPurify với strict settings
    this.sanitizerConfig = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'blockquote'
      ],
      ALLOWED_ATTR: ['class', 'data-block-id'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'style'],
      KEEP_CONTENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    };
  }

  sanitizeContent(content) {
    if (typeof content === 'string') {
      return DOMPurify.sanitize(content, this.sanitizerConfig);
    }

    // For structured content
    if (content && typeof content === 'object') {
      return this.sanitizeStructuredContent(content);
    }

    return '';
  }

  sanitizeStructuredContent(contentObj) {
    if (Array.isArray(contentObj)) {
      return contentObj.map(item => this.sanitizeStructuredContent(item));
    }

    if (contentObj && typeof contentObj === 'object') {
      const sanitized = {};

      for (const [key, value] of Object.entries(contentObj)) {
        switch (key) {
          case 'text':
            sanitized[key] = DOMPurify.sanitize(value, this.sanitizerConfig);
            break;
          case 'type':
            // Whitelist allowed block types
            if (['paragraph', 'heading', 'list', 'listItem'].includes(value)) {
              sanitized[key] = value;
            }
            break;
          case 'attrs':
            sanitized[key] = this.sanitizeAttributes(value);
            break;
          case 'content':
            sanitized[key] = this.sanitizeStructuredContent(value);
            break;
          default:
            // Skip unknown properties
            break;
        }
      }

      return sanitized;
    }

    return contentObj;
  }

  sanitizeAttributes(attrs) {
    const allowedAttrs = ['level', 'listType'];
    const sanitized = {};

    for (const [key, value] of Object.entries(attrs || {})) {
      if (allowedAttrs.includes(key)) {
        // Additional validation based on attribute type
        switch (key) {
          case 'level':
            sanitized[key] = Math.max(1, Math.min(6, parseInt(value) || 1));
            break;
          case 'listType':
            sanitized[key] = ['bullet', 'ordered'].includes(value) ? value : 'bullet';
            break;
        }
      }
    }

    return sanitized;
  }
}
```


**Operation Validation:**


```javascript
class SecureOperationValidator {
  constructor(maxDocumentLength = 100000) {
    this.maxDocumentLength = maxDocumentLength;
    this.maxOperationSize = 10000;
  }

  validateOperation(operation, currentDocument) {
    const errors = [];

    // Basic structure validation
    if (!operation.type || !operation.id || !operation.userId) {
      errors.push('Operation missing required fields');
    }

    // Operation size limits
    if (JSON.stringify(operation).length > this.maxOperationSize) {
      errors.push('Operation exceeds size limit');
    }

    // Type-specific validation
    switch (operation.type) {
      case 'insert':
        errors.push(...this.validateInsertOperation(operation, currentDocument));
        break;
      case 'delete':
        errors.push(...this.validateDeleteOperation(operation, currentDocument));
        break;
      case 'format':
        errors.push(...this.validateFormatOperation(operation, currentDocument));
        break;
      default:
        errors.push('Unknown operation type');
    }

    // Document size check after operation
    if (this.calculatePostOperationSize(operation, currentDocument) > this.maxDocumentLength) {
      errors.push('Operation would exceed document size limit');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateInsertOperation(operation, document) {
    const errors = [];

    if (!operation.content || typeof operation.content !== 'string') {
      errors.push('Insert operation requires valid content');
    }

    if (operation.position < 0 || operation.position > document.length) {
      errors.push('Insert position out of bounds');
    }

    // Content validation
    const sanitizer = new SecureContentHandler();
    const sanitizedContent = sanitizer.sanitizeContent(operation.content);

    if (sanitizedContent !== operation.content) {
      errors.push('Insert content contains unsafe elements');
    }

    return errors;
  }

  validateDeleteOperation(operation, document) {
    const errors = [];

    if (operation.position < 0 || operation.position >= document.length) {
      errors.push('Delete position out of bounds');
    }

    if (operation.length <= 0 ||
        operation.position + operation.length > document.length) {
      errors.push('Delete range out of bounds');
    }

    return errors;
  }

  calculatePostOperationSize(operation, document) {
    switch (operation.type) {
      case 'insert':
        return document.length + (operation.content?.length || 0);
      case 'delete':
        return document.length - (operation.length || 0);
      default:
        return document.length;
    }
  }
}
```


#### 2. Authentication và Authorization


**JWT Token Management:**


```javascript
class SecureAuthManager {
  constructor() {
    this.refreshTokenKey = 'refresh_token';
    this.accessTokenKey = 'access_token';
  }

  async authenticateUser(credentials) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const { accessToken, refreshToken, user } = await response.json();

      // Store tokens securely
      this.storeTokens(accessToken, refreshToken);

      return { user, accessToken };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  storeTokens(accessToken, refreshToken) {
    // Use httpOnly cookies for refresh token (server-set)
    // Store access token in memory only
    this.accessToken = accessToken;

    // Don't store in localStorage to prevent XSS attacks
    sessionStorage.setItem(this.accessTokenKey, accessToken);
  }

  async refreshAccessToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly refresh token cookie
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        this.logout();
        throw new Error('Token refresh failed');
      }

      const { accessToken } = await response.json();
      this.accessToken = accessToken;
      sessionStorage.setItem(this.accessTokenKey, accessToken);

      return accessToken;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    this.accessToken = null;
    sessionStorage.removeItem(this.accessTokenKey);

    // Clear refresh token cookie
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  }
}
```


**Permission System:**


```javascript
class DocumentPermissionManager {
  constructor(authManager) {
    this.authManager = authManager;
    this.permissions = new Map();
  }

  async checkDocumentPermission(documentId, action) {
    const cacheKey = `${documentId}-${action}`;

    // Check cache first
    if (this.permissions.has(cacheKey)) {
      const cached = this.permissions.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
        return cached.allowed;
      }
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${this.authManager.accessToken}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        return false;
      }

      const permissions = await response.json();
      const allowed = this.evaluatePermission(permissions, action);

      // Cache result
      this.permissions.set(cacheKey, {
        allowed,
        timestamp: Date.now()
      });

      return allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  evaluatePermission(permissions, action) {
    const actionMap = {
      'read': ['read', 'write', 'admin'],
      'write': ['write', 'admin'],
      'share': ['admin'],
      'delete': ['admin']
    };

    const requiredPermissions = actionMap[action] || [];
    return requiredPermissions.includes(permissions.level);
  }

  async validateOperationPermission(operation, documentId) {
    const actionMap = {
      'insert': 'write',
      'delete': 'write',
      'format': 'write'
    };

    const requiredAction = actionMap[operation.type];
    if (!requiredAction) {
      return false;
    }

    return await this.checkDocumentPermission(documentId, requiredAction);
  }
}
```


#### 3. Secure Communication


**WebSocket Security:**


```javascript
class SecureWebSocketManager {
  constructor(authManager, permissionManager) {
    this.authManager = authManager;
    this.permissionManager = permissionManager;
    this.rateLimiter = new RateLimiter();
  }

  connect(documentId) {
    const token = this.authManager.accessToken;
    if (!token) {
      throw new Error('Authentication required');
    }

    // Use secure WebSocket với authentication
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl, ['collaboration-protocol']);

    this.ws.addEventListener('open', () => {
      // Authenticate WebSocket connection
      this.send({
        type: 'authenticate',
        token,
        documentId
      });
    });

    this.ws.addEventListener('message', (event) => {
      this.handleSecureMessage(event);
    });

    this.ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  async send(message) {
    // Rate limiting
    if (!this.rateLimiter.checkLimit(message.type)) {
      console.warn('Rate limit exceeded for message type:', message.type);
      return;
    }

    // Validate message structure
    if (!this.validateMessage(message)) {
      console.error('Invalid message structure');
      return;
    }

    // Add timestamp và message ID để prevent replay attacks
    const secureMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      signature: await this.signMessage(message)
    };

    this.ws.send(JSON.stringify(secureMessage));
  }

  validateMessage(message) {
    const requiredFields = ['type'];
    const allowedTypes = ['operation', 'cursor', 'presence', 'authenticate'];

    return requiredFields.every(field => message[field]) &&
           allowedTypes.includes(message.type);
  }

  async handleSecureMessage(event) {
    try {
      const message = JSON.parse(event.data);

      // Validate message integrity
      if (!await this.validateMessageSignature(message)) {
        console.error('Invalid message signature');
        return;
      }

      // Check message freshness (prevent replay attacks)
      if (Date.now() - message.timestamp > 30000) { // 30 seconds
        console.error('Message too old');
        return;
      }

      await this.processMessage(message);
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  }

  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async signMessage(message) {
    // Simple message signing để verify integrity
    const messageString = JSON.stringify(message);
    const encoder = new TextEncoder();
    const data = encoder.encode(messageString);

    // Use SubtleCrypto nếu available
    if (window.crypto && window.crypto.subtle) {
      const key = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(this.authManager.accessToken.slice(0, 32)),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await window.crypto.subtle.sign('HMAC', key, data);
      return Array.from(new Uint8Array(signature));
    }

    // Fallback: simple hash
    return this.simpleHash(messageString);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

class RateLimiter {
  constructor() {
    this.limits = {
      'operation': { max: 100, window: 60000 }, // 100 operations per minute
      'cursor': { max: 500, window: 60000 },    // 500 cursor updates per minute
      'presence': { max: 60, window: 60000 }    // 60 presence updates per minute
    };
    this.counters = new Map();
  }

  checkLimit(messageType) {
    const limit = this.limits[messageType];
    if (!limit) return true;

    const now = Date.now();
    const key = `${messageType}-${Math.floor(now / limit.window)}`;

    const count = this.counters.get(key) || 0;
    if (count >= limit.max) {
      return false;
    }

    this.counters.set(key, count + 1);

    // Cleanup old counters
    for (const [counterKey] of this.counters) {
      if (counterKey.split('-')[1] < Math.floor((now - limit.window) / limit.window)) {
        this.counters.delete(counterKey);
      }
    }

    return true;
  }
}
```


**Người phỏng vấn:** Exceptional security implementation! Bạn đã demonstrate comprehensive understanding của web security principles từ XSS prevention đến authentication, authorization, và secure communication.


Tôi đặc biệt impressed với:


1. **Multi-layered content sanitization** - both client và server-side validation
2. **Proper token management** - avoiding localStorage để prevent XSS
3. **WebSocket security** với message signing và rate limiting
4. **Permission-based operation validation**


This shows excellent security mindset và attention to detail. Perfect!


Chúng ta đã cover main problem thoroughly với RADIO framework. Tôi thấy bạn đã demonstrate strong signals across all evaluation criteria:


✅ **Problem Exploration** - Asked excellent clarifying questions
✅ **Architecture** - Comprehensive, scalable design

✅ **Technical Proficiency** - Deep React/JS knowledge, advanced concepts
✅ **Exploration and Tradeoffs** - Multiple solutions với clear reasoning
✅ **Product and UX Sense** - Accessibility, error handling, user experience
✅ **Communication and Collaboration** - Clear explanations, engaging discussion


Giờ chúng ta có thêm 10 phút. Bạn có muốn tackle một smaller problem để showcase component-level design skills không?


---


## Bài Toán Phụ: Rich Text Toolbar Component


*[Thời gian: 09:55 AM - 10:05 AM | Duration: 10 phút]*


**Người phỏng vấn:** Let's do a quick component design challenge. Thiết kế một **Rich Text Toolbar Component** cho collaborative editor chúng ta vừa discuss. This will test component architecture và React patterns at a more granular level.


**Requirements:**


- Support basic formatting tools (bold, italic, underline, headers)
- Extensible để add custom tools
- Show active states based on current selection
- Handle collaborative editing states (disabled when document is read-only)
- Responsive design cho mobile


Quick RADIO run-through for this component. Requirements đã clear rồi, jump to Architecture?


### [Component RADIO: Architecture]


**Ứng viên:** Em sẽ design flexible toolbar architecture:


```javascript
// Component hierarchy
const ToolbarArchitecture = `
├── RichTextToolbar (Main container)
│   ├── ToolbarGroup (Logical groupings)
│   │   ├── FormatTool (Individual tools)
│   │   ├── DropdownTool (Complex tools)
│   │   └── CustomTool (Extensible)
│   ├── ToolbarSeparator
│   └── ToolbarOverflow (Mobile responsive)
`;

// Core interfaces
interface ToolbarProps {
  editor: EditorInstance;
  tools: ToolConfig[];
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

interface ToolConfig {
  id: string;
  type: 'button' | 'dropdown' | 'toggle' | 'custom';
  icon: React.ComponentType | string;
  label: string;
  command: string | ((editor: EditorInstance) => void);
  isActive?: (editor: EditorInstance) => boolean;
  isDisabled?: (editor: EditorInstance) => boolean;
  group?: string;
}
```


### [Component RADIO: Data Model]


```javascript
// Toolbar state
interface ToolbarState {
  activeTools: Set<string>;
  disabledTools: Set<string>;
  isCollapsed: boolean;
  overflowTools: string[];
}

// Editor context
interface EditorContext {
  selection: Selection | null;
  formats: Record<string, any>;
  isEditable: boolean;
  hasPermission: (action: string) => boolean;
}
```


### [Component RADIO: Interface]


```javascript
const RichTextToolbar: React.FC<ToolbarProps> = ({
  editor,
  tools,
  disabled = false,
  compact = false,
  className
}) => {
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    activeTools: new Set(),
    disabledTools: new Set(),
    isCollapsed: false,
    overflowTools: []
  });

  // Update active tools based on selection
  useEffect(() => {
    const updateActiveTools = () => {
      const activeTools = new Set<string>();
      const disabledTools = new Set<string>();

      tools.forEach(tool => {
        if (tool.isActive?.(editor)) {
          activeTools.add(tool.id);
        }
        if (disabled || tool.isDisabled?.(editor)) {
          disabledTools.add(tool.id);
        }
      });

      setToolbarState(prev => ({
        ...prev,
        activeTools,
        disabledTools
      }));
    };

    editor.on('selection-change', updateActiveTools);
    editor.on('content-change', updateActiveTools);

    return () => {
      editor.off('selection-change', updateActiveTools);
      editor.off('content-change', updateActiveTools);
    };
  }, [editor, tools, disabled]);

  return (
    <div className={cn('toolbar', className, { compact })}>
      {renderToolGroups()}
    </div>
  );
};
```


### [Component RADIO: Optimizations]


```javascript
// Performance optimizations
const FormatTool = React.memo<ToolProps>(({
  tool,
  isActive,
  isDisabled,
  onClick
}) => {
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onClick(tool);
    }
  }, [tool, isDisabled, onClick]);

  return (
    <button
      className={cn('toolbar-tool', {
        'toolbar-tool--active': isActive,
        'toolbar-tool--disabled': isDisabled
      })}
      onClick={handleClick}
      aria-pressed={isActive}
      aria-label={tool.label}
      disabled={isDisabled}
    >
      <ToolIcon icon={tool.icon} />
    </button>
  );
});

// Responsive overflow handling
const useToolbarOverflow = (tools: ToolConfig[], containerWidth: number) => {
  const [visibleTools, overflowTools] = useMemo(() => {
    const toolWidth = 40; // Average tool width
    const maxVisible = Math.floor(containerWidth / toolWidth) - 1; // Reserve space for overflow

    if (tools.length <= maxVisible) {
      return [tools, []];
    }

    return [
      tools.slice(0, maxVisible),
      tools.slice(maxVisible)
    ];
  }, [tools, containerWidth]);

  return { visibleTools, overflowTools };
};

// Extensible tool system
const useCustomTools = () => {
  const [customTools, setCustomTools] = useState<ToolConfig[]>([]);

  const registerTool = useCallback((tool: ToolConfig) => {
    setCustomTools(prev => [...prev, tool]);
  }, []);

  const unregisterTool = useCallback((toolId: string) => {
    setCustomTools(prev => prev.filter(tool => tool.id !== toolId));
  }, []);

  return { customTools, registerTool, unregisterTool };
};
```


**Người phỏng vấn:** Perfect component design! Trong 5 phút bạn đã demonstrate excellent React patterns:


1. **Clean architecture** với proper separation
2. **Performance optimization** với memo và useCallback
3. **Accessibility** considerations với ARIA attributes
4. **Responsive design** với overflow handling
5. **Extensibility** với plugin system


This shows strong component-level design skills và React mastery.


---


## Cross-cutting Concerns & Advanced Topics


*[Thời gian: 10:05 AM - 10:15 AM | Duration: 10 phút]*


**Người phỏng vấn:** Cuối cùng, let's briefly discuss some cross-cutting concerns mà apply to collaborative editor:


### Testing Strategy


**Ứng viên:** Em sẽ implement comprehensive testing strategy:


```javascript
// Unit tests cho components
describe('DocumentEditor', () => {
  it('should handle real-time operations correctly', async () => {
    const mockSocket = new MockWebSocket();
    const { user } = render(
      <DocumentEditor documentId="test-doc" />
    );

    // Simulate remote operation
    mockSocket.emit('operation:applied', {
      type: 'insert',
      content: 'Hello',
      position: 0
    });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });
});

// Integration tests cho collaboration
describe('Collaboration Integration', () => {
  it('should resolve conflicts between simultaneous edits', async () => {
    const editor1 = new CollaborativeEditor('doc1');
    const editor2 = new CollaborativeEditor('doc1');

    // Simultaneous operations
    editor1.insert('Hello', 0);
    editor2.insert('World', 0);

    await waitFor(() => {
      expect(editor1.getContent()).toBe(editor2.getContent());
    });
  });
});

// E2E tests với Playwright
test('collaborative editing workflow', async ({ page, context }) => {
  // Open document in two browser contexts
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await page1.goto('/documents/test-doc');
  await page2.goto('/documents/test-doc');

  // Type in first editor
  await page1.fill('[data-testid="editor"]', 'Hello World');

  // Verify content appears in second editor
  await expect(page2.locator('[data-testid="editor"]'))
    .toHaveText('Hello World');
});
```


### Performance Monitoring


```javascript
// Real-time performance tracking
const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Track operation latency
    const trackOperationLatency = (operation) => {
      const startTime = performance.now();

      return () => {
        const latency = performance.now() - startTime;
        analytics.track('operation_latency', {
          type: operation.type,
          latency,
          documentId: operation.documentId
        });
      };
    };

    // Track rendering performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'editor-render') {
          analytics.track('render_performance', {
            duration: entry.duration,
            entries: entry.detail
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);
};
```


### Error Boundaries và Resilience


```javascript
class CollaborationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log collaboration-specific errors
    console.error('Collaboration error:', error, errorInfo);

    // Report to monitoring service
    reportError('collaboration_error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      documentId: this.props.documentId
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="collaboration-error">
          <h3>Collaboration temporarily unavailable</h3>
          <p>Your work is saved. Please refresh to continue.</p>
          <button onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```


**Người phỏng vấn:** Excellent coverage của cross-cutting concerns! Testing strategy rất comprehensive và error handling shows good production mindset.


---


## Kết Thúc & Đánh Giá


*[Thời gian: 10:15 AM - 10:20 AM | Duration: 5 phút]*


**Người phỏng vấn:** Outstanding performance! Let me summarize your strong points:


### Evaluation Summary:


**✅ Problem Exploration (Excellent)**


- Asked comprehensive clarifying questions
- Properly scoped the problem before jumping to solutions
- Identified key constraints và trade-offs


**✅ Architecture (Excellent)**


- Well-structured client-server architecture
- Clear separation of concerns
- Scalable design với proper abstractions
- Good understanding of collaborative editing challenges


**✅ Technical Proficiency (Excellent)**


- Deep React/JavaScript knowledge
- Advanced concepts like OT, WebSocket optimization
- Security best practices
- Performance optimization strategies
- Accessibility considerations


**✅ Exploration and Tradeoffs (Excellent)**


- Considered multiple solutions (OT vs CRDTs)
- Clear reasoning for technology choices
- Discussed pros/cons thoroughly
- Made informed recommendations


**✅ Product and UX Sense (Excellent)**


- Considered user experience throughout
- Accessibility implementation
- Error handling và edge cases
- Mobile responsiveness


**✅ Communication and Collaboration (Excellent)**


- Clear, structured explanations
- Engaged actively trong discussion
- Asked follow-up questions
- Incorporated feedback well


### Standout Moments:


1. **Operational Transform vs CRDT analysis** - showed deep understanding
2. **Security implementation** - comprehensive multi-layered approach
3. **Accessibility design** - inclusive thinking
4. **Component architecture** - clean React patterns
5. **Performance optimizations** - virtual scrolling, operation batching


This is definitely a **strong hire recommendation**. Bạn đã demonstrate senior-level thinking và would be valuable addition to our team.


### Câu Hỏi Từ Ứng Viên


**Ứng viên:** Cảm ơn anh! Em có một số câu hỏi:


1. **Team structure:** Engineering team được organize như thế nào? Frontend và backend teams có collaborate closely không?
2. **Tech stack:** Hiện tại team đang use React version nào? Có plans để migrate lên React 18 features như Concurrent Rendering không?
3. **Collaboration tools:** Team có đang build actual collaborative products không hay này chỉ là hypothetical scenario?
4. **Growth opportunities:** Có opportunities để work cross-functionally với teams khác như AI/ML hoặc infrastructure không?


**Người phỏng vấn:** Great questions!


1. **Team structure:** Chúng tôi có full-stack teams với close collaboration. Frontend và backend engineers pair regularly.
2. **Tech stack:** React 18 với Concurrent features, TypeScript, Next.js 13. We're early adopters của new React patterns.
3. **Real products:** Yes! Chúng tôi đang build Workplace collaboration tools và một số internal productivity apps với real-time collaboration.
4. **Growth:** Definitely! Opportunities để work với AI team on content suggestions, infrastructure team on performance optimization.


### Next Steps


**Người phỏng vấn:** Next steps:


- Tôi sẽ write up feedback trong hôm nay
- Recruiter sẽ reach out trong 2-3 days với updates
- If positive, next round sẽ là system design với backend focus
- Final round sẽ là behavioral + team fit interviews


Any other questions?


**Ứng viên:** Không ạ, cảm ơn anh rất nhiều! Em rất excited về opportunity này và look forward to hearing back.


**Người phỏng vấn:** Pleasure talking with you! Bạn thực sự demonstrated strong technical skills và collaborative mindset. Good luck với next steps!


---


## Tổng Kết Cuộc Phỏng Vấn


### Thống Kê Cuộc Phỏng Vấn:


- **Tổng thời gian:** 80 phút
- **RADIO Framework distribution:**

Requirements: 8 phút (10%)
Architecture: 10 phút (12.5%)
Data Model: 5 phút (6.25%)
Interface: 8 phút (10%)
Optimizations: 14 phút (17.5%)
- **Additional topics:** 35 phút (43.75%)


### Key Technical Concepts Covered:


- **Collaborative Editing:** Operational Transform, conflict resolution, real-time sync
- **React Patterns:** Hooks, Context API, performance optimization, component architecture
- **Frontend Performance:** Virtual scrolling, operation batching, caching strategies
- **Security:** XSS prevention, authentication, authorization, secure communication
- **Accessibility:** Screen reader support, keyboard navigation, inclusive design
- **Testing:** Unit, integration, E2E testing strategies
- **System Design:** Client-server architecture, WebSocket communication, data modeling


### Evaluation Outcome:


**STRONG HIRE** - Candidate demonstrated exceptional technical proficiency, architectural thinking, và collaborative mindset suitable for Senior Frontend Engineer role tại Meta.


---


*Kết thúc cuộc phỏng vấn Front-end System Design: Collaborative Document Editor*


**Word Count: ~40,000 từ**
