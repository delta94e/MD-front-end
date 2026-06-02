# Front-end System Design Interview

## You

Continue

## Claude


# Cuộc Phỏng Vấn Front-end System Design: Thiết Kế Ứng Dụng Chat (Messenger-style)


## Phần 1: Mở Đầu và Thiết Lập Bối Cảnh


*[Thời gian: 9:00 AM - Phòng họp Meta Engineering, Menlo Park]*


---


**Người phỏng vấn:** Chào bạn! Tôi là Minh, Senior Staff Engineer tại Meta, làm việc với Messenger team được 8 năm rồi. Hôm nay tôi sẽ conduct cuộc phỏng vấn Front-end System Design với bạn. Trước tiên, bạn có thể tự giới thiệu ngắn gọn về background và experience của mình không?


**Ứng viên:** Chào anh Minh! Tôi là Hương, hiện đang làm Senior Frontend Engineer tại một startup tech ở Singapore. Tôi có 6 năm experience làm việc với React và JavaScript ecosystem, trong đó 3 năm gần đây focus chủ yếu vào building complex web applications với real-time features. Trước đây tôi từng lead việc rebuild toàn bộ frontend của một messaging platform cho internal company communication.


**Người phỏng vấn:** Tuyệt vời! Experience với messaging systems sẽ rất hữu ích cho buổi interview hôm nay. Để tôi explain format của cuộc phỏng vấn này nhé.


Chúng ta sẽ có 90 phút để discuss một bài toán system design. Tôi sẽ đánh giá bạn dựa trên 6 criteria chính:


1. **Problem Exploration** - Khả năng hiểu và khám phá requirements
2. **Architecture** - Thiết kế kiến trúc tổng thể
3. **Technical Proficiency** - Kiến thức kỹ thuật frontend
4. **Tradeoffs Analysis** - Phân tích và đưa ra các lựa chọn
5. **Product & UX Sense** - Cảm nhận về sản phẩm và trải nghiệm người dùng
6. **Communication** - Khả năng giao tiếp và collaboration


Chúng ta sẽ follow **RADIO framework** - đây là methodology standard tại Meta cho system design interviews:


- **R**equirements exploration
- **A**rchitecture / High-level design
- **D**ata model
- **I**nterface definition
- **O**ptimizations and deep dive


Bạn có câu hỏi nào về format này không?


**Ứng viên:** Không anh, tôi understand. RADIO framework nghe familiar, tôi đã research về nó trước khi interview. Tôi ready để start!


**Người phỏng vấn:** Perfect! Trước khi dive into bài toán chính, tôi muốn warm up một chút. Bạn có thể share về một challenging frontend problem mà bạn đã solve recently, đặc biệt related đến real-time features hoặc performance optimization không?


**Ứng viên:** Chắc chắn rồi! Gần đây nhất, tôi đã handle một performance issue khá tricky trong messaging app của team. Chúng tôi có conversation list với thousands of conversations, và khi user scroll thì app lag rất nhiều.


Root cause là chúng tôi render tất cả conversation items cùng lúc, mỗi item lại subscribe riêng biệt đến WebSocket updates. Điều này tạo ra memory leak và performance bottleneck.


Solution tôi implement gồm:


1. **Virtual scrolling** với `react-window` để chỉ render visible items
2. **Singleton WebSocket connection** với centralized state management qua Redux
3. **Message normalization** để avoid duplicate data
4. **Batch updates** để reduce re-renders khi có multiple messages arrive


Kết quả là reduce memory usage xuống 70% và scroll performance smooth hơn rất nhiều.


**Người phỏng vấn:** Excellent! Đây chính xác là loại thinking tôi muốn thấy. Bạn đã demonstrate được:


- **Problem exploration**: Identify root cause thay vì treat symptoms
- **Technical proficiency**: Knowledge về virtual scrolling, WebSocket optimization
- **Architecture thinking**: Centralized state management approach


Những experience này sẽ rất valuable cho bài toán hôm nay. Ready để dive in?


**Ứng viên:** Yes, tôi ready!


---


## Phần 2: Bài Toán Chính - Thiết Kế Ứng Dụng Chat


**Người phỏng vấn:** Alright! Bài toán hôm nay là: **"Thiết kế một ứng dụng chat real-time như Facebook Messenger hoặc WhatsApp Web"**.


Đây là một trong những bài toán phổ biến nhất trong frontend system design interviews tại big tech companies. Complexity vừa phải nhưng touches on nhiều advanced topics như real-time communication, offline support, performance optimization.


Tôi muốn bạn approach problem này một cách structured, và chúng ta sẽ spend approximately:


- 15% time on Requirements exploration
- 20% on Architecture design
- 10% on Data modeling
- 15% on Interface definitions
- 40% on Optimizations và deep dive


Bạn có questions nào trước khi start không?


**Ứng viên:** Tôi có một clarifying question: Khi bạn nói "như Messenger hoặc WhatsApp Web", tôi có nên focus vào specific platform nào, hay design một generic solution?


**Người phỏng vấn:** Great question! Đây là signal tốt của **problem exploration mindset**. Hãy design generic solution nhưng bạn có thể reference specific examples từ existing platforms để illustrate points. Focus chủ yếu vào **web platform** với React, không cần worry về mobile apps.


---


## [RADIO Phase: Requirements Exploration]


*[Thời gian: 9:15 AM - Phân bổ: 2,700 từ / 15% total time]*


**Ứng viên:** Được rồi! Để start Requirements exploration, tôi muốn understand scope và constraints của problem này.


**Core functionality tôi assume:**


1. **One-on-one messaging** - Users có thể send/receive messages với nhau
2. **Real-time delivery** - Messages appear instantly without refresh
3. **Message history** - Users có thể view previous conversations
4. **Online/offline status** - Show user availability


Nhưng tôi có một số clarifying questions:


**Về User Base và Scale:**


- Chúng ta target bao nhiêu concurrent users? Thousands, millions?
- Geographic distribution như thế nào? Global hay specific regions?
- Demographic nào - consumer, enterprise, hay mixed?


**Người phỏng vấn:** Excellent questions! Let's say:


- **10 million daily active users globally**
- **Consumer-focused** như Facebook Messenger
- **Global distribution** with users primarily in North America, Europe, và Asia
- Peak concurrent users around **2 million**


**Ứng viên:** Thanks! Tiếp theo về **Message Types và Features:**


- **Text messages** - Tôi assume đây là core, có hỗ trợ emoji không?
- **Rich media** - Images, videos, files? Hay chỉ text for MVP?
- **Group chats** hay chỉ 1:1 messaging?
- **Message reactions** - likes, hearts, etc.?
- **Message editing/deletion** - Users có thể modify sent messages?
- **Message search** - Search trong conversation history?


**Người phỏng vấn:** Good comprehensive thinking! Let's scope it down cho manageable interview:


- **Text messages with emoji support** - Core feature
- **Images sharing** - Nice to have, discuss nếu có time
- **1:1 messaging only** - No group chats for simplicity
- **No reactions, editing, search** - Focus on core messaging first


**Ứng viên:** Perfect! Về **Real-time Requirements:**


- **Message delivery latency** - Acceptable delay là bao nhiêu? Under 100ms, 1 second?
- **Delivery confirmations** - Sent, delivered, read receipts?
- **Typing indicators** - Show khi someone is typing?
- **Presence status** - Online, offline, last seen?


**Người phỏng vấn:** Great questions showing understanding of messaging complexity:


- **Sub-second delivery** preferred, under 2 seconds acceptable
- **Basic delivery status** - sent và delivered (không cần read receipts)
- **No typing indicators** - Keep it simple
- **Basic online/offline status**


**Ứng viên:** Understood! Bây giờ về **Technical Requirements:**


**Performance:**


- **Load time** - App phải load trong bao lâu? Under 3 seconds?
- **Message rendering** - Handle conversations với thousands of messages?
- **Memory usage** - Constraints cho long-running sessions?


**Compatibility:**


- **Browser support** - Modern browsers only hay legacy support?
- **Device types** - Desktop, tablet, mobile web?
- **Screen sizes** - Responsive design requirements?


**Người phỏng vấn:** Exactly the right technical questions:


- **Initial load under 3 seconds** on average connection
- **Support conversations up to 10,000 messages** efficiently
- **Memory usage stay reasonable** for 8+ hour sessions
- **Modern browsers** (Chrome, Firefox, Safari, Edge) - no IE
- **Responsive design** cho desktop và mobile web
- **Primary focus desktop**, mobile-friendly


**Ứng viên:** Excellent! Cuối cùng về **Business Requirements:**


**Offline Support:**


- **Offline message viewing** - Cached conversations accessible?
- **Offline message sending** - Queue messages khi no connection?
- **Sync behavior** - Conflict resolution khi back online?


**Data & Privacy:**


- **Message encryption** - End-to-end hay server-side?
- **Data retention** - Messages stored how long?
- **GDPR compliance** - User data deletion rights?


**Scalability:**


- **Horizontal scaling** - Architecture phải support growth?
- **Multiple devices** - Same user on different browsers/devices?
- **Cross-platform** - Integration với mobile apps later?


**Người phỏng vấn:** Wonderful comprehensive exploration! These questions show excellent **problem exploration skills**. Let me clarify:


**Offline Support:**


- **Yes to offline viewing** of recent conversations
- **Yes to message queuing** - send when back online
- **Simple sync** - no complex conflict resolution needed


**Data & Privacy:**


- **Server-side encryption** - no E2E for MVP
- **Standard data retention** - not main concern for frontend
- **Basic privacy** - focus on technical implementation


**Scalability:**


- **Yes, design for horizontal scaling**
- **Multi-device support** essential
- **Future mobile integration** - keep in mind


Đây là exactly loại requirements exploration tôi expect từ senior candidate. Bạn đã:
✅ **Asked clarifying questions** before jumping to solutions
✅ **Considered multiple dimensions** - technical, business, user experience

✅ **Thought about edge cases** - offline, scaling, multi-device
✅ **Prioritized scope appropriately**


Ready để move to Architecture phase?


**Ứng viên:** Yes! Based on requirements vừa clarify, tôi có clear picture về what chúng ta cần build. Let me summarize key requirements trước khi design:


**Functional Requirements:**


- 1:1 text messaging với emoji
- Real-time message delivery (sub-2 second)
- Message history và offline viewing
- Basic online/offline status
- Multi-device sync
- Image sharing (nice-to-have)


**Non-Functional Requirements:**


- 10M DAU, 2M peak concurrent
- Global distribution
- <3s initial load time
- Support conversations với 10K+ messages
- Responsive design
- Modern browser support
- Offline message queuing


**Technical Constraints:**


- Web platform với React
- Horizontal scalability
- Memory efficiency for long sessions


**Người phỏng vấn:** Perfect summary! Đây là exactly cách tôi muốn thấy candidate synthesize requirements. Clear priorities và constraints sẽ guide architecture decisions. Let's move to architecture design!


---


## [RADIO Phase: Architecture / High-level Design]


*[Thời gian: 9:30 AM - Phân bổ: 3,600 từ / 20% total time]*


**Ứng viên:** Alright! Để design architecture, tôi sẽ start từ high-level system overview, sau đó drill down vào frontend components.


**Overall System Architecture:**


```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   API Gateway   │    │   Backend       │
│   (React SPA)   │◄──►│   (REST/WS)     │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                           ┌─────────────────┐
│   Local Storage │                           │    Database     │
│   (IndexedDB)   │                           │   (Messages)    │
└─────────────────┘                           └─────────────────┘
```


**Tôi sẽ focus vào Client Architecture** vì đây là frontend interview:


**Người phỏng vấn:** Good start! Tôi like việc bạn clearly separate concerns và focus vào frontend. Có thể elaborate về Client App architecture không?


**Ứng viên:** Absolutely! **Frontend Architecture Design:**


```
┌─────────────────────────────────────────────────────────┐
│                    React Application                    │
├─────────────────────────────────────────────────────────┤
│                     UI Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Chat UI   │  │ Sidebar UI  │  │  Header UI  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                  State Management                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Messages  │  │Conversations│  │   Users     │     │
│  │    Store    │  │    Store    │  │   Store     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                   Service Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Message   │  │  WebSocket  │  │    Sync     │     │
│  │   Service   │  │  Manager    │  │  Service    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                  Storage Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  IndexedDB  │  │Local Cache  │  │   Queue     │     │
│  │   Store     │  │   Manager   │  │  Manager    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```


**Key Architectural Principles:**


1. **Layered Architecture** - Clear separation of concerns
2. **Offline-First Design** - Local storage as source of truth
3. **Real-time Sync** - WebSocket cho live updates
4. **Optimistic Updates** - UI updates immediately, sync later


**Người phỏng vấn:** Excellent architectural thinking! Tôi particularly appreciate việc bạn mentioned **offline-first design** - đây là crucial cho messaging apps. Có thể deep dive vào mỗi layer không?


**Ứng viên:** Sure! Let me break down từng layer:


### 1. UI Layer - React Components


```typescript
// Component hierarchy
AppContainer
├── HeaderBar (user status, settings)
├── Sidebar
│   ├── ConversationList
│   │   └── ConversationItem[]
│   └── UserProfile
└── MainChat
    ├── ChatHeader (contact info, status)
    ├── MessageList
    │   ├── VirtualScrollContainer
    │   └── MessageItem[]
    └── MessageInput
        ├── TextEditor
        ├── EmojiPicker
        └── SendButton
```


**Key Component Responsibilities:**


- **ConversationList**: Display all conversations, handle selection
- **MessageList**: Virtual scrolling, message rendering, loading states
- **MessageInput**: Text editing, emoji, send logic
- **VirtualScrollContainer**: Performance optimization cho large message lists


**Người phỏng vấn:** Good component breakdown! Việc bạn include VirtualScrollContainer shows performance awareness. How về state management approach?


### 2. State Management Layer


**Ứng viên:** Với complexity của real-time messaging, tôi recommend **Redux Toolkit** với structured approach:


```typescript
// Store structure
interface AppState {
  conversations: ConversationsState;
  messages: MessagesState;
  users: UsersState;
  ui: UIState;
  sync: SyncState;
}

// Normalized state structure
interface MessagesState {
  byId: Record<string, Message>;
  byConversationId: Record<string, string[]>; // message IDs
  loadingStates: Record<string, LoadingState>;
}

interface ConversationsState {
  byId: Record<string, Conversation>;
  allIds: string[];
  selectedId: string | null;
}
```


**State Management Rationale:**


- **Normalization** prevents data duplication
- **Separate loading states** for better UX
- **Predictable updates** với Redux patterns
- **Time-travel debugging** hữu ích cho messaging bugs


**Alternative Consideration:**


- **Zustand** for lighter weight
- **React Query** cho server state
- **Jotai** for atomic state management


Nhưng với complexity của real-time messaging và offline support, Redux provides best developer experience.


**Người phỏng vấn:** Solid reasoning! Việc bạn consider alternatives và explain trade-offs là exactly what tôi want to see. Điều gì về service layer?


### 3. Service Layer - Business Logic


**Ứng viên:** Service layer handle business logic và external communications:


```typescript
// Message Service - Core messaging logic
class MessageService {
  async sendMessage(conversationId: string, content: string): Promise<void>
  async loadMessages(conversationId: string, offset: number): Promise<Message[]>
  async markAsRead(messageId: string): Promise<void>
  subscribeToUpdates(conversationId: string, callback: MessageCallback): void
}

// WebSocket Manager - Real-time connection
class WebSocketManager {
  connect(): Promise<void>
  disconnect(): void
  send(event: SocketEvent): void
  subscribe(eventType: string, handler: EventHandler): void
  getConnectionStatus(): ConnectionStatus
}

// Sync Service - Offline/online coordination
class SyncService {
  syncPendingMessages(): Promise<void>
  syncConversations(): Promise<void>
  handleConflictResolution(conflicts: SyncConflict[]): Promise<void>
  schedulePeriodicSync(): void
}
```


**Service Layer Benefits:**


- **Testable business logic** separated from UI
- **Consistent API** across components
- **Easy to mock** for testing
- **Reusable logic** between different UI parts


**Người phỏng vấn:** Great abstraction! Services clearly separate UI concerns from business logic. How về storage layer approach?


### 4. Storage Layer - Data Persistence


**Ứng viên:** Storage layer critical cho offline-first design:


```typescript
// IndexedDB Store - Persistent offline storage
class IndexedDBStore {
  async saveMessage(message: Message): Promise<void>
  async getMessages(conversationId: string, limit: number): Promise<Message[]>
  async saveConversation(conversation: Conversation): Promise<void>
  async clearOldMessages(olderThanDays: number): Promise<void>
}

// Cache Manager - In-memory optimization
class CacheManager {
  private messageCache = new Map<string, Message>();
  private conversationCache = new Map<string, Conversation>();

  get(key: string): any
  set(key: string, value: any, ttl?: number): void
  invalidate(pattern: string): void
}

// Queue Manager - Offline message handling
class QueueManager {
  async enqueueMessage(message: PendingMessage): Promise<void>
  async processQueue(): Promise<void>
  async retryFailedMessages(): Promise<void>
  getQueueStatus(): QueueStatus
}
```


**Storage Strategy:**


- **IndexedDB** for persistent offline data
- **Memory cache** for frequently accessed items
- **Queue system** for offline message sending
- **Cleanup policies** để manage storage limits


**Người phỏng vấn:** Excellent! Comprehensive storage strategy. Tôi see bạn đã thought through offline scenarios thoroughly.


Bây giờ let's talk về **data flow** - how các layers interact với nhau?


**Ứng viên:** Great question! **Data Flow Architecture:**


### Optimistic Update Flow


```
User types message → UI updates immediately → Queue for sending → WebSocket send
                                         ↓
                    IndexedDB save ← Service layer ← Success response
```


### Real-time Message Receive Flow


```
WebSocket receives → Service validates → Store update → UI re-renders
                                   ↓
                    IndexedDB save ← Background sync
```


### Offline-to-Online Sync Flow


```
Connection restored → Queue manager activates → Batch send pending
                                            ↓
                     Conflict resolution ← Server response → UI updates
```


**Key Data Flow Principles:**


1. **UI never directly calls storage** - Always through services
2. **Optimistic updates** for immediate feedback
3. **Background sync** doesn't block UI
4. **Error boundaries** handle failed operations gracefully


**Người phỏng vấn:** Outstanding! Data flow design shows deep understanding của messaging complexity. Một concern tôi có: **how you handle race conditions**?


Example: User sends message, loses connection, regains connection, nhưng trong lúc đó same user trên different device đã sent other messages?


**Ứng viên:** Excellent edge case! **Race Condition Handling:**


```typescript
// Message ordering strategy
interface Message {
  id: string;
  clientId: string; // Unique per client instance
  timestamp: number; // Client timestamp
  serverTimestamp?: number; // Server confirms order
  sequenceNumber: number; // Per-conversation sequence
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

// Conflict resolution
class ConflictResolver {
  async resolveMessageOrder(
    localMessages: Message[],
    serverMessages: Message[]
  ): Promise<Message[]> {
    // 1. Server timestamp wins for ordering
    // 2. Merge missing messages from both sides
    // 3. Mark duplicates based on clientId + timestamp
    // 4. Update local storage với resolved order
  }
}
```


**Conflict Resolution Strategy:**


1. **Server timestamp authority** - Server determines final order
2. **Client-side deduplication** - Use clientId để identify duplicates
3. **Graceful merge** - Insert server messages vào correct positions
4. **User notification** cho failed/reordered messages if needed


**Người phỏng vấn:** Perfect! Conflict resolution strategy is solid. You've demonstrated excellent **architectural thinking** với:


✅ **Clear component separation** và responsibilities
✅ **Offline-first design** với proper sync strategies

✅ **Performance considerations** (virtual scrolling, caching)
✅ **Edge case handling** (race conditions, conflicts)
✅ **Scalable patterns** (normalization, services)


Ready để dive vào data modeling?


**Ứng viên:** Definitely! Architecture foundation sẽ guide data model decisions.


---


## [RADIO Phase: Data Model]


*[Thời gian: 9:50 AM - Phân bổ: 1,800 từ / 10% total time]*


**Ứng viên:** Based on architecture chúng ta vừa design, let me define comprehensive data models. Tôi sẽ categorize data into **Server-synced** vs **Client-only** data:


### Core Domain Entities (Server-synced)


```typescript
// User entity
interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation entity
interface Conversation {
  id: string;
  participants: string[]; // User IDs (2 for 1:1 chat)
  type: 'direct'; // Room for future group chat support
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  // UI-specific fields
  isArchived?: boolean;
  isPinned?: boolean;
}

// Message entity (most complex)
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: MessageContent;
  type: 'text' | 'image' | 'file';
  status: MessageStatus;
  timestamp: Date;
  serverTimestamp?: Date;
  editedAt?: Date;
  // Client-specific fields
  clientId: string; // For deduplication
  sequenceNumber: number; // Ordering within conversation
  retryCount?: number; // For failed sends
}

type MessageStatus =
  | 'pending'    // Just sent, waiting for server
  | 'sent'       // Confirmed received by server
  | 'delivered'  // Delivered to recipient's device
  | 'failed'     // Send failed
  | 'read';      // Read by recipient (future feature)

interface MessageContent {
  text?: string;
  emoji?: string[];
  image?: {
    url: string;
    width: number;
    height: number;
    size: number;
  };
}
```


**Người phỏng vấn:** Good comprehensive entities! Tôi like việc bạn include both server và client-specific fields. Có thể explain rationale behind Message model complexity?


**Ứng viên:** Absolutely! **Message Model Rationale:**


**Status Complexity:** Messages trong chat apps có complex lifecycle. Users cần visual feedback về message delivery progress - pending spinner, checkmarks for sent/delivered, etc.


**Dual Timestamps:** `timestamp` for client-side ordering trong UI, `serverTimestamp` for authoritative ordering khi resolve conflicts.


**ClientId + SequenceNumber:** Deduplication strategy. Same message sent từ different devices có same clientId. SequenceNumber ensures proper ordering within conversation.


**Content Union Type:** Extensible design. Start with text, easy để add images, files later without breaking existing code.


### Client-Only Data Models


**Ứng viên:** Now for client-specific data structures:


```typescript
// UI State - Not synced to server
interface UIState {
  selectedConversationId: string | null;
  sidebarOpen: boolean;
  emojiPickerOpen: boolean;
  theme: 'light' | 'dark';
  notifications: NotificationSettings;
}

// Draft Messages - Local storage only
interface DraftMessage {
  conversationId: string;
  content: string;
  timestamp: Date;
  // Auto-save user's partially typed messages
}

// Message Input State - Ephemeral
interface MessageInputState {
  [conversationId: string]: {
    text: string;
    isTyping: boolean;
    lastTypingTime: Date;
  };
}

// Cache Metadata - Performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in ms
  accessCount: number;
}

// Sync Queue - Offline support
interface QueuedMessage {
  id: string;
  message: Message;
  operation: 'send' | 'edit' | 'delete';
  priority: number;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

interface SyncState {
  isOnline: boolean;
  lastSyncTime: Date;
  pendingOperations: QueuedMessage[];
  conflictedItems: ConflictItem[];
}
```


**Người phỏng vấn:** Great separation! Việc bạn distinguish client-only data shows good understanding của distributed system concerns. How về data relationships và indexing strategy?


### Data Relationships & Indexing


**Ứng viên:** **Entity Relationships:**


```typescript
// Normalized Redux State Structure
interface AppState {
  // Entities - normalized by ID
  entities: {
    users: Record<string, User>;
    conversations: Record<string, Conversation>;
    messages: Record<string, Message>;
  };

  // Indexes - for efficient lookups
  indexes: {
    messagesByConversation: Record<string, string[]>; // conversationId -> messageIds[]
    conversationsByUser: Record<string, string[]>; // userId -> conversationIds[]
    usersByStatus: Record<UserStatus, string[]>; // status -> userIds[]
  };

  // Cached queries - for performance
  cache: {
    conversationListSorted: string[]; // Pre-sorted conversation IDs
    recentMessages: Record<string, string[]>; // conversationId -> recent messageIds
    searchResults: Record<string, SearchResult>;
  };
}
```


**Indexing Strategy Rationale:**


1. **messagesByConversation** - Critical cho fast message loading
2. **conversationsByUser** - Efficient conversation filtering
3. **usersByStatus** - Quick online/offline user lookup
4. **Cached sorted lists** - Avoid re-sorting trên mỗi render


**Người phỏng vấn:** Excellent normalization! Việc bạn pre-compute indexes shows performance consciousness. What về **data lifecycle management**?


### Data Lifecycle & Storage Strategy


**Ứng viên:** **Data Lifecycle Strategy:**


```typescript
// Storage tiers based on access patterns
interface StorageStrategy {
  // Hot data - Memory cache (immediate access)
  hot: {
    activeConversation: Message[]; // Current conversation messages
    recentConversations: Conversation[]; // Last 10 conversations
    currentUser: User;
  };

  // Warm data - IndexedDB (fast access)
  warm: {
    allConversations: Conversation[];
    last1000Messages: Message[]; // Per conversation
    userProfiles: User[];
  };

  // Cold data - Server fetch (lazy load)
  cold: {
    oldMessages: Message[]; // Older than 1000 per conversation
    archivedConversations: Conversation[];
    deletedItems: any[];
  };
}

// Cleanup policies
interface DataRetentionPolicy {
  maxMessagesPerConversation: number; // 1000 in memory
  maxConversationsInCache: number; // 50 recent
  cacheEvictionStrategy: 'LRU'; // Least Recently Used
  offlineDataRetention: number; // 7 days
}
```


**Data Lifecycle Benefits:**


- **Predictable memory usage** với defined limits
- **Fast access** cho frequently used data
- **Automatic cleanup** prevents storage bloat
- **Graceful degradation** khi storage limits reached


**Người phỏng vấn:** Solid data management strategy! Tôi appreciate việc bạn think about real-world constraints như memory limits.


One follow-up: **How handle data migrations** khi you need to change message format in future updates?


**Ứng viên:** Great question về production concerns! **Data Migration Strategy:**


```typescript
// Versioned data models
interface VersionedMessage {
  version: number; // Current: 1
  data: Message;
  migrationNeeded?: boolean;
}

// Migration handler
class DataMigrationService {
  private migrations = {
    1: this.migrateToV1,
    2: this.migrateToV2, // Future: add reactions
    3: this.migrateToV3, // Future: add threads
  };

  async migrateData(currentVersion: number, targetVersion: number) {
    // Progressive migration strategy
    for (let v = currentVersion + 1; v <= targetVersion; v++) {
      await this.migrations[v]();
    }
  }

  private async migrateToV2() {
    // Example: Add reactions field to existing messages
    const messages = await this.storage.getAllMessages();
    const updated = messages.map(msg => ({
      ...msg,
      reactions: [], // New field with default value
      version: 2
    }));
    await this.storage.bulkUpdateMessages(updated);
  }
}
```


**Migration Principles:**


- **Progressive migrations** - Step-by-step updates
- **Backward compatibility** - Old clients can still work
- **Graceful degradation** - Missing fields get defaults
- **Batch processing** - Efficient large-scale updates


**Người phỏng vấn:** Excellent future-thinking! Data migration strategy shows production experience. You've demonstrated strong **data modeling skills** với:


✅ **Comprehensive entity design** với proper relationships
✅ **Performance optimization** through normalization and indexing
✅ **Lifecycle management** với tiered storage strategy

✅ **Production concerns** như migrations và constraints
✅ **Clear separation** of server vs client data


Ready to move to Interface definitions?


**Ứng viên:** Yes! Data models provide foundation để design clean APIs.


---


## [RADIO Phase: Interface Definition (API)]


*[Thời gian: 10:05 AM - Phân bổ: 2,700 từ / 15% total time]*


**Ứng viên:** Interface definitions sẽ cover both **external APIs** (client-server) và **internal APIs** (React component interfaces). Let me start với external APIs:


### External APIs - Client-Server Communication


```typescript
// REST API endpoints for CRUD operations
interface ChatAPI {
  // Authentication
  auth: {
    login(credentials: LoginRequest): Promise<AuthResponse>;
    logout(): Promise<void>;
    refreshToken(): Promise<TokenResponse>;
  };

  // User management
  users: {
    getProfile(userId: string): Promise<User>;
    updateProfile(updates: Partial<User>): Promise<User>;
    searchUsers(query: string): Promise<User[]>;
    setStatus(status: UserStatus): Promise<void>;
  };

  // Conversations
  conversations: {
    list(limit?: number, offset?: number): Promise<Conversation[]>;
    create(participantId: string): Promise<Conversation>;
    get(conversationId: string): Promise<Conversation>;
    markAsRead(conversationId: string): Promise<void>;
  };

  // Messages
  messages: {
    list(conversationId: string, limit?: number, cursor?: string): Promise<MessagePage>;
    send(conversationId: string, content: MessageContent): Promise<Message>;
    edit(messageId: string, content: MessageContent): Promise<Message>;
    delete(messageId: string): Promise<void>;
  };
}

// Paginated response type
interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}
```


**REST API Design Principles:**


- **Resource-based URLs** - `/api/v1/conversations/{id}/messages`
- **Standard HTTP methods** - GET, POST, PUT, DELETE
- **Pagination support** - Cursor-based cho consistent results
- **Predictable responses** - Consistent error handling


### WebSocket API - Real-time Events


```typescript
// WebSocket event types
type SocketEvent =
  | MessageSentEvent
  | MessageDeliveredEvent
  | UserStatusEvent
  | TypingEvent
  | ConversationUpdatedEvent;

interface MessageSentEvent {
  type: 'message_sent';
  payload: {
    message: Message;
    conversationId: string;
  };
}

interface MessageDeliveredEvent {
  type: 'message_delivered';
  payload: {
    messageId: string;
    deliveredAt: Date;
  };
}

interface UserStatusEvent {
  type: 'user_status_changed';
  payload: {
    userId: string;
    status: UserStatus;
    lastSeen?: Date;
  };
}

// WebSocket client interface
interface WebSocketClient {
  connect(): Promise<void>;
  disconnect(): void;

  // Send events to server
  emit(event: SocketEvent): void;

  // Subscribe to incoming events
  on<T extends SocketEvent>(
    eventType: T['type'],
    handler: (payload: T['payload']) => void
  ): () => void; // Returns unsubscribe function

  // Connection status
  isConnected(): boolean;
  getReadyState(): WebSocket['readyState'];
}
```


**Người phỏng vấn:** Good comprehensive API design! Tôi like việc bạn separate REST cho CRUD và WebSocket cho real-time. How về error handling strategy?


**Ứng viên:** Excellent question! **Error Handling Strategy:**


```typescript
// Standardized error response format
interface APIError {
  code: string; // Machine-readable error code
  message: string; // Human-readable message
  details?: Record<string, any>; // Additional context
  timestamp: Date;
  requestId: string; // For debugging
}

// Error categories với specific codes
enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'auth/unauthorized',
  TOKEN_EXPIRED = 'auth/token_expired',

  // Validation errors
  INVALID_INPUT = 'validation/invalid_input',
  MESSAGE_TOO_LONG = 'validation/message_too_long',

  // Rate limiting
  RATE_LIMITED = 'rate_limit/exceeded',

  // Server errors
  INTERNAL_ERROR = 'server/internal_error',
  SERVICE_UNAVAILABLE = 'server/unavailable',

  // WebSocket errors
  CONNECTION_LOST = 'websocket/connection_lost',
  RECONNECT_FAILED = 'websocket/reconnect_failed',
}

// Client-side error handling
interface ErrorHandler {
  handleAPIError(error: APIError): void;
  handleNetworkError(error: NetworkError): void;
  handleValidationError(errors: ValidationError[]): void;
  showUserFriendlyMessage(errorCode: ErrorCode): void;
}
```


**Error Handling Benefits:**


- **Consistent format** across all APIs
- **Machine-readable codes** for programmatic handling
- **User-friendly messages** based on error types
- **Debugging support** với request IDs và timestamps


### Internal APIs - React Component Interfaces


**Ứng viên:** Bây giờ for React component interfaces:


```typescript
// Core Chat UI Components
interface ChatContainerProps {
  userId: string;
  initialConversationId?: string;
  theme?: 'light' | 'dark';
  onError?: (error: Error) => void;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  loading?: boolean;
  error?: string;
}

interface MessageListProps {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  onLoadMore: () => void;
  onRetryMessage: (messageId: string) => void;
  hasMore: boolean;
  loading: boolean;
}

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

// Individual message component
interface MessageItemProps {
  message: Message;
  isOwn: boolean; // Message from current user
  showTimestamp?: boolean;
  showStatus?: boolean;
  onRetry?: () => void;
  onEdit?: (newContent: string) => void;
}
```


**Component Interface Principles:**


- **Single responsibility** - Each component has clear purpose
- **Predictable props** - Consistent naming và typing
- **Event callbacks** - Parent controls behavior
- **Loading states** - Support cho async operations
- **Error boundaries** - Graceful error handling


### Custom Hooks - Reusable Logic


```typescript
// Message management hook
interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadMore: () => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  hasMore: boolean;
}

function useMessages(conversationId: string): UseMessagesResult;

// Real-time connection hook
interface UseWebSocketResult {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
  lastError: Error | null;
}

function useWebSocket(): UseWebSocketResult;

// Offline status hook
interface UseOfflineResult {
  isOnline: boolean;
  pendingOperations: number;
  syncProgress: number; // 0-100%
  forcSync: () => Promise<void>;
}

function useOffline(): UseOfflineResult;

// Conversation management hook
interface UseConversationsResult {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  selectConversation: (id: string) => void;
  createConversation: (participantId: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

function useConversations(): UseConversationsResult;
```


**Custom Hooks Benefits:**


- **Reusable logic** across components
- **Consistent state management**
- **Easy testing** - Hooks có thể test independently
- **Clean components** - Logic separated from UI


**Người phỏng vấn:** Excellent hook design! Custom hooks là great way để encapsulate complex logic. How về **data fetching patterns**?


### Data Fetching & Caching Strategy


**Ứng viên:** **Data Fetching with React Query Integration:**


```typescript
// React Query integration for server state
interface MessageQueryKey {
  type: 'messages';
  conversationId: string;
  cursor?: string;
}

interface ConversationQueryKey {
  type: 'conversations';
  userId: string;
}

// Custom query hooks
function useMessagesQuery(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId] as const,
    queryFn: ({ pageParam }) =>
      chatAPI.messages.list(conversationId, 50, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

function useConversationsQuery() {
  return useQuery({
    queryKey: ['conversations'] as const,
    queryFn: () => chatAPI.conversations.list(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

// Mutation hooks for updates
function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: SendMessageParams) =>
      chatAPI.messages.send(conversationId, content),
    onSuccess: (newMessage) => {
      // Optimistic update
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        (old: any) => ({
          ...old,
          pages: old.pages.map((page: any, index: number) =>
            index === 0
              ? { ...page, messages: [newMessage, ...page.messages] }
              : page
          )
        })
      );
    },
  });
}
```


**Data Fetching Strategy:**


- **React Query** cho server state management
- **Infinite queries** cho message pagination
- **Optimistic updates** cho immediate feedback
- **Smart caching** với appropriate stale times
- **Background refetching** để keep data fresh


**Người phỏng vấn:** Great integration với React Query! Shows understanding của modern React ecosystem. What về **type safety across APIs**?


### Type Safety & Validation


**Ứng viên:** **End-to-End Type Safety:**


```typescript
// Shared types between client and server
interface APISchema {
  endpoints: {
    'POST /api/messages': {
      request: SendMessageRequest;
      response: Message;
    };
    'GET /api/conversations': {
      request: never;
      response: Conversation[];
    };
  };
  events: {
    message_sent: MessageSentEvent;
    user_status_changed: UserStatusEvent;
  };
}

// Runtime validation với Zod
import { z } from 'zod';

const MessageContentSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  emoji: z.array(z.string()).optional(),
  image: z.object({
    url: z.string().url(),
    width: z.number().positive(),
    height: z.number().positive(),
    size: z.number().positive(),
  }).optional(),
}).refine(
  data => data.text || data.emoji || data.image,
  { message: "Message must have text, emoji, or image content" }
);

const SendMessageRequestSchema = z.object({
  conversationId: z.string().uuid(),
  content: MessageContentSchema,
});

// Type-safe API client
class TypedChatAPI {
  async sendMessage(request: z.infer<typeof SendMessageRequestSchema>) {
    // Runtime validation
    const validated = SendMessageRequestSchema.parse(request);

    // Type-safe API call
    return this.httpClient.post<Message>('/api/messages', validated);
  }
}
```


**Type Safety Benefits:**


- **Compile-time checks** prevent API misuse
- **Runtime validation** catches invalid data
- **Auto-completion** improves developer experience
- **API contract enforcement** between frontend và backend
- **Refactoring safety** - Changes propagate through type system


**Người phỏng vấn:** Outstanding type safety approach! Việc bạn combine TypeScript với runtime validation shows production-ready thinking.


You've demonstrated excellent **interface design skills** với:


✅ **Comprehensive API coverage** - REST, WebSocket, React components
✅ **Consistent patterns** - Predictable naming và structure
✅ **Error handling strategy** - Standardized error responses
✅ **Modern React patterns** - Custom hooks, React Query integration
✅ **Type safety** - End-to-end type checking với runtime validation
✅ **Performance considerations** - Caching strategies và optimization


Ready để dive into optimizations và deep dive - the most substantial part?


**Ứng viên:** Absolutely! Interface definitions provide solid foundation. Excited để explore optimizations và tackle real-world challenges!


---


## [RADIO Phase: Optimizations and Deep Dive]


*[Thời gian: 10:20 AM - Phán bổ: 7,200 từ / 40% total time]*


**Người phỏng vấn:** This is where we really test senior-level thinking! Optimizations phase covers performance, scalability, user experience, và advanced technical challenges. Let's start với **performance optimization** - arguably most critical cho messaging apps.


### Performance Optimization


**Ứng viên:** Performance critical cho messaging apps! Users expect instant responsiveness. Let me break down optimization strategies:


#### 1. Rendering Performance - Virtual Scrolling


```typescript
// Virtual scrolling implementation for large message lists
import { VariableSizeList as List } from 'react-window';
import { memo, useMemo, useCallback } from 'react';

interface VirtualMessageListProps {
  messages: Message[];
  conversationId: string;
  currentUserId: string;
}

const VirtualMessageList = memo<VirtualMessageListProps>(({
  messages,
  conversationId,
  currentUserId
}) => {
  // Memoized item data để avoid unnecessary re-renders
  const itemData = useMemo(() => ({
    messages,
    currentUserId,
    onRetryMessage: (messageId: string) => {
      // Retry logic
    }
  }), [messages, currentUserId]);

  // Dynamic height calculation based on message content
  const getItemSize = useCallback((index: number) => {
    const message = messages[index];
    if (!message) return 60; // Default height

    // Calculate height based on content
    const baseHeight = 60;
    const textLines = Math.ceil(message.content.text?.length || 0 / 50);
    const imageHeight = message.content.image ? 200 : 0;

    return baseHeight + (textLines * 20) + imageHeight;
  }, [messages]);

  return (
    <List
      height={600} // Container height
      itemCount={messages.length}
      itemSize={getItemSize}
      itemData={itemData}
      overscanCount={5} // Render extra items for smooth scrolling
    >
      {MessageRow}
    </List>
  );
});

// Memoized message row component
const MessageRow = memo<any>(({ index, style, data }) => {
  const { messages, currentUserId, onRetryMessage } = data;
  const message = messages[index];

  return (
    <div style={style}>
      <MessageItem
        message={message}
        isOwn={message.senderId === currentUserId}
        onRetry={() => onRetryMessage(message.id)}
      />
    </div>
  );
});
```


**Virtual Scrolling Benefits:**


- **Constant memory usage** regardless of message count
- **Smooth scrolling** cho conversations với 10K+ messages
- **Dynamic sizing** adapts to different message types
- **Lazy rendering** - Only visible items rendered


#### 2. Bundle Optimization & Code Splitting


```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const ChatContainer = lazy(() => import('./ChatContainer'));
const SettingsPage = lazy(() => import('./SettingsPage'));
const ProfilePage = lazy(() => import('./ProfilePage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/chat" element={<ChatContainer />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Suspense>
  );
}

// Feature-based code splitting for heavy components
const EmojiPicker = lazy(() =>
  import('./EmojiPicker').then(module => ({
    default: module.EmojiPicker
  }))
);

// Dynamic import for optional features
const ImageEditor = lazy(() =>
  import(/* webpackChunkName: "image-editor" */ './ImageEditor')
);

// Bundle analysis setup
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        }
      }
    }
  }
};
```


**Bundle Optimization Strategy:**


- **Route-based splitting** - Load pages on demand
- **Feature-based splitting** - Heavy components (emoji picker, image editor)
- **Vendor chunking** - Separate third-party libraries
- **Common chunks** - Shared code extraction


#### 3. Memory Management & Garbage Collection


```typescript
// Memory-efficient message management
class MessageMemoryManager {
  private messageCache = new Map<string, Message>();
  private maxCacheSize = 1000; // Maximum cached messages
  private accessOrder = new Set<string>(); // LRU tracking

  addMessage(message: Message) {
    // Remove oldest if cache full
    if (this.messageCache.size >= this.maxCacheSize) {
      this.evictOldestMessage();
    }

    this.messageCache.set(message.id, message);
    this.updateAccessOrder(message.id);
  }

  getMessage(messageId: string): Message | undefined {
    const message = this.messageCache.get(messageId);
    if (message) {
      this.updateAccessOrder(messageId);
    }
    return message;
  }

  private evictOldestMessage() {
    const oldestId = this.accessOrder.values().next().value;
    if (oldestId) {
      this.messageCache.delete(oldestId);
      this.accessOrder.delete(oldestId);
    }
  }

  private updateAccessOrder(messageId: string) {
    this.accessOrder.delete(messageId);
    this.accessOrder.add(messageId);
  }

  // Cleanup for memory leaks
  cleanup() {
    this.messageCache.clear();
    this.accessOrder.clear();
  }
}

// React component cleanup patterns
function useCleanupEffect(cleanup: () => void, deps: any[]) {
  useEffect(() => {
    return cleanup;
  }, deps);
}

// Memory leak prevention in components
const MessageList = () => {
  const memoryManagerRef = useRef(new MessageMemoryManager());

  useCleanupEffect(() => {
    return () => memoryManagerRef.current.cleanup();
  }, []);

  // Component implementation...
};
```


**Memory Management Benefits:**


- **LRU cache** prevents memory bloat
- **Explicit cleanup** prevents memory leaks
- **Efficient garbage collection** với proper cleanup
- **Bounded memory usage** regardless of session length


**Người phỏng vấn:** Excellent performance optimizations! Particularly impressed với virtual scrolling implementation và memory management. How về **network optimization**?


#### 4. Network Optimization & Caching


**Ứng viên:** Network optimization crucial cho global messaging app:


```typescript
// Request batching for multiple operations
class BatchedRequestManager {
  private pendingRequests = new Map<string, any[]>();
  private batchTimeout = 50; // ms
  private maxBatchSize = 10;

  async batchRequest<T>(
    key: string,
    request: any,
    processor: (batch: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add to pending batch
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
        this.scheduleBatchProcess(key, processor);
      }

      const batch = this.pendingRequests.get(key)!;
      batch.push({ request, resolve, reject });

      // Process immediately if batch full
      if (batch.length >= this.maxBatchSize) {
        this.processBatch(key, processor);
      }
    });
  }

  private scheduleBatchProcess<T>(
    key: string,
    processor: (batch: any[]) => Promise<T[]>
  ) {
    setTimeout(() => {
      this.processBatch(key, processor);
    }, this.batchTimeout);
  }

  private async processBatch<T>(
    key: string,
    processor: (batch: any[]) => Promise<T[]>
  ) {
    const batch = this.pendingRequests.get(key);
    if (!batch || batch.length === 0) return;

    this.pendingRequests.delete(key);

    try {
      const requests = batch.map(item => item.request);
      const results = await processor(requests);

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}

// HTTP caching strategy
const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache',
  }
});

// Request interceptor for caching
httpClient.interceptors.request.use((config) => {
  // Add cache headers based on endpoint
  if (config.url?.includes('/messages')) {
    config.headers['Cache-Control'] = 'max-age=300'; // 5 minutes
  } else if (config.url?.includes('/users')) {
    config.headers['Cache-Control'] = 'max-age=600'; // 10 minutes
  }
  return config;
});

// Service Worker for offline caching
// sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache-v1').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Return cached response và fetch fresh in background
            fetch(event.request).then(fetchResponse => {
              cache.put(event.request, fetchResponse.clone());
            });
            return response;
          }

          // Fetch và cache new response
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```


**Network Optimization Benefits:**


- **Request batching** reduces network overhead
- **Smart caching** prevents duplicate requests
- **Background updates** keep data fresh
- **Service Worker** enables offline functionality


### Real-time Communication Optimization


**Ứng viên:** Real-time features require sophisticated optimization:


```typescript
// WebSocket connection management với reconnection logic
class RobustWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: any[] = [];

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.getWebSocketURL());

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = (event) => {
          this.stopHeartbeat();
          if (!event.wasClean) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }
}

// Message deduplication và ordering
class MessageOrderingManager {
  private messageBuffer = new Map<string, Message[]>();
  private expectedSequence = new Map<string, number>();

  addMessage(message: Message): Message[] {
    const conversationId = message.conversationId;

    // Initialize sequence tracking
    if (!this.expectedSequence.has(conversationId)) {
      this.expectedSequence.set(conversationId, 1);
    }

    if (!this.messageBuffer.has(conversationId)) {
      this.messageBuffer.set(conversationId, []);
    }

    const buffer = this.messageBuffer.get(conversationId)!;
    const expectedSeq = this.expectedSequence.get(conversationId)!;

    // Check if message is in correct sequence
    if (message.sequenceNumber === expectedSeq) {
      // Process this message và any buffered ones
      const processedMessages = [message];
      this.expectedSequence.set(conversationId, expectedSeq + 1);

      // Check buffer for next sequential messages
      processedMessages.push(...this.processBufferedMessages(conversationId));

      return processedMessages;
    } else {
      // Buffer out-of-order message
      buffer.push(message);
      buffer.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      return [];
    }
  }

  private processBufferedMessages(conversationId: string): Message[] {
    const buffer = this.messageBuffer.get(conversationId)!;
    const processed: Message[] = [];
    let expectedSeq = this.expectedSequence.get(conversationId)!;

    let index = 0;
    while (index < buffer.length) {
      const message = buffer[index];
      if (message.sequenceNumber === expectedSeq) {
        processed.push(message);
        buffer.splice(index, 1);
        expectedSeq++;
      } else {
        break; // Wait for missing sequence
      }
    }

    this.expectedSequence.set(conversationId, expectedSeq);
    return processed;
  }
}
```


**Real-time Optimization Benefits:**


- **Robust reconnection** với exponential backoff
- **Message queuing** prevents data loss during disconnections
- **Heartbeat mechanism** detects connection issues early
- **Message ordering** ensures correct conversation flow
- **Deduplication** prevents duplicate messages


**Người phỏng vấn:** Impressive real-time optimization! The message ordering manager particularly shows deep understanding của distributed system challenges. Now let's discuss **user experience optimizations**.


### User Experience Optimization


**Ứng viên:** UX optimization crucial cho user retention trong messaging apps:


#### 1. Loading States & Skeleton Screens


```typescript
// Skeleton loading components for better perceived performance
const MessageSkeleton = () => (
  <div className="message-skeleton">
    <div className="avatar-skeleton animate-pulse bg-gray-300 w-8 h-8 rounded-full" />
    <div className="content-skeleton">
      <div className="text-skeleton animate-pulse bg-gray-300 h-4 w-3/4 mb-2 rounded" />
      <div className="text-skeleton animate-pulse bg-gray-300 h-4 w-1/2 rounded" />
    </div>
  </div>
);

const ConversationSkeleton = () => (
  <div className="conversation-skeleton space-y-3">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3">
        <div className="avatar-skeleton animate-pulse bg-gray-300 w-12 h-12 rounded-full" />
        <div className="flex-1">
          <div className="name-skeleton animate-pulse bg-gray-300 h-4 w-32 mb-2 rounded" />
          <div className="message-skeleton animate-pulse bg-gray-300 h-3 w-48 rounded" />
        </div>
        <div className="time-skeleton animate-pulse bg-gray-300 h-3 w-12 rounded" />
      </div>
    ))}
  </div>
);

// Loading state management
interface LoadingStates {
  conversations: boolean;
  messages: Record<string, boolean>;
  sendingMessage: Record<string, boolean>;
  imageUpload: Record<string, boolean>;
}

const useLoadingStates = () => {
  const [loading, setLoading] = useState<LoadingStates>({
    conversations: false,
    messages: {},
    sendingMessage: {},
    imageUpload: {},
  });

  const setConversationsLoading = (isLoading: boolean) => {
    setLoading(prev => ({ ...prev, conversations: isLoading }));
  };

  const setMessagesLoading = (conversationId: string, isLoading: boolean) => {
    setLoading(prev => ({
      ...prev,
      messages: { ...prev.messages, [conversationId]: isLoading }
    }));
  };

  return {
    loading,
    setConversationsLoading,
    setMessagesLoading,
    // ... other loading setters
  };
};
```


#### 2. Optimistic Updates với Rollback


```typescript
// Optimistic update manager
class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, any>();
  private rollbackData = new Map<string, any>();

  async optimisticUpdate<T>(
    updateId: string,
    optimisticData: T,
    actualUpdate: () => Promise<T>,
    rollbackUpdate: (data: T) => void,
    confirmUpdate: (data: T) => void
  ): Promise<T> {
    // Store rollback data
    this.rollbackData.set(updateId, optimisticData);
    this.pendingUpdates.set(updateId, true);

    // Apply optimistic update immediately
    confirmUpdate(optimisticData);

    try {
      // Perform actual update
      const result = await actualUpdate();

      // Confirm successful update
      this.pendingUpdates.delete(updateId);
      this.rollbackData.delete(updateId);
      confirmUpdate(result);

      return result;
    } catch (error) {
      // Rollback on failure
      const rollbackData = this.rollbackData.get(updateId);
      if (rollbackData) {
        rollbackUpdate(rollbackData);
      }

      this.pendingUpdates.delete(updateId);
      this.rollbackData.delete(updateId);

      throw error;
    }
  }

  isPending(updateId: string): boolean {
    return this.pendingUpdates.has(updateId);
  }
}

// Usage in message sending
const useSendMessage = () => {
  const optimisticManager = useRef(new OptimisticUpdateManager());
  const { mutateAsync: sendMessageAPI } = useSendMessageMutation();

  const sendMessage = async (conversationId: string, content: string) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      content: { text: content },
      status: 'pending',
      timestamp: new Date(),
      clientId: generateClientId(),
      sequenceNumber: getNextSequenceNumber(conversationId),
    };

    return optimisticManager.current.optimisticUpdate(
      tempMessage.id,
      tempMessage,
      () => sendMessageAPI({ conversationId, content }),
      (rollbackMsg) => {
        // Remove failed message from UI
        dispatch(removeMessage(rollbackMsg.id));
        dispatch(showError('Failed to send message'));
      },
      (confirmedMsg) => {
        // Update UI với confirmed message
        dispatch(updateMessage(confirmedMsg));
      }
    );
  };

  return { sendMessage };
};
```


#### 3. Progressive Enhancement & Graceful Degradation


```typescript
// Feature detection và graceful degradation
class FeatureDetector {
  static supportsWebSocket(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  static supportsIndexedDB(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  static supportsServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  static supportsNotifications(): boolean {
    return 'Notification' in window;
  }

  static getConnectionType(): string {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }
}

// Adaptive loading based on connection
const useAdaptiveLoading = () => {
  const [connectionType, setConnectionType] = useState(
    FeatureDetector.getConnectionType()
  );

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const handleChange = () => {
        setConnectionType(connection.effectiveType);
      };
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  // Adjust loading strategies based on connection
  const getLoadingStrategy = () => {
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return {
          messagePageSize: 10,
          imageQuality: 'low',
          preloadDistance: 5,
        };
      case '3g':
        return {
          messagePageSize: 25,
          imageQuality: 'medium',
          preloadDistance: 10,
        };
      default:
        return {
          messagePageSize: 50,
          imageQuality: 'high',
          preloadDistance: 20,
        };
    }
  };

  return { connectionType, loadingStrategy: getLoadingStrategy() };
};

// Progressive enhancement for features
const ChatContainer = () => {
  const [features, setFeatures] = useState({
    realTime: false,
    offlineStorage: false,
    notifications: false,
  });

  useEffect(() => {
    setFeatures({
      realTime: FeatureDetector.supportsWebSocket(),
      offlineStorage: FeatureDetector.supportsIndexedDB(),
      notifications: FeatureDetector.supportsNotifications(),
    });
  }, []);

  if (!features.realTime) {
    // Fallback to polling
    return <PollingChatContainer />;
  }

  return <WebSocketChatContainer />;
};
```


**UX Optimization Benefits:**


- **Skeleton screens** provide instant visual feedback
- **Optimistic updates** create responsive feel
- **Progressive enhancement** works on all devices
- **Adaptive loading** adjusts to network conditions
- **Graceful degradation** maintains functionality


**Người phỏng vấn:** Excellent UX considerations! The adaptive loading strategy shows thoughtful consideration cho diverse user conditions. Let's dive into **scalability challenges**.


### Scalability & Advanced Technical Challenges


**Ứng viên:** Scalability crucial khi messaging app grows từ thousands to millions of users:


#### 1. State Management at Scale


```typescript
// Sharded Redux store for better performance
interface ShardedState {
  conversations: {
    [shardKey: string]: Record<string, Conversation>;
  };
  messages: {
    [shardKey: string]: Record<string, Message>;
  };
}

class StateShardManager {
  private static readonly SHARD_SIZE = 1000;

  static getShardKey(id: string): string {
    // Hash-based sharding
    const hash = this.simpleHash(id);
    return `shard_${hash % 10}`; // 10 shards
  }

  static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  static createShardedReducer<T>(
    itemReducer: (state: T | undefined, action: any) => T
  ) {
    return (state: Record<string, Record<string, T>> = {}, action: any) => {
      if (action.meta?.shardKey) {
        const shardKey = action.meta.shardKey;
        const shardState = state[shardKey] || {};

        return {
          ...state,
          [shardKey]: {
            ...shardState,
            [action.meta.itemId]: itemReducer(
              shardState[action.meta.itemId],
              action
            )
          }
        };
      }
      return state;
    };
  }
}

// Selector optimization với memoization
const createShardedSelector = <T>(
  shardKey: string,
  itemId: string,
  selector: (item: T) => any
) => {
  return createSelector(
    [(state: ShardedState) => state.messages[shardKey]?.[itemId]],
    selector
  );
};

// Lazy loading của shards
const useShardedData = <T>(
  shardKey: string,
  loader: () => Promise<Record<string, T>>
) => {
  const [data, setData] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(data).length === 0 && !loading) {
      setLoading(true);
      loader().then(shardData => {
        setData(shardData);
        setLoading(false);
      });
    }
  }, [shardKey, data, loading, loader]);

  return { data, loading };
};
```


#### 2. Memory Management at Scale


```typescript
// Advanced memory management với priority-based eviction
class PriorityMemoryManager {
  private cache = new Map<string, CacheEntry>();
  private priorityQueue = new Map<Priority, Set<string>>();
  private maxMemoryMB: number;
  private currentMemoryMB = 0;

  constructor(maxMemoryMB: number = 100) {
    this.maxMemoryMB = maxMemoryMB;
    this.setupMemoryMonitoring();
  }

  set<T>(
    key: string,
    value: T,
    priority: Priority = 'normal',
    sizeMB?: number
  ) {
    const size = sizeMB || this.estimateSize(value);

    // Evict if necessary
    while (this.currentMemoryMB + size > this.maxMemoryMB) {
      this.evictLowestPriority();
    }

    // Remove old entry if exists
    this.delete(key);

    // Add new entry
    const entry: CacheEntry = {
      value,
      priority,
      size,
      accessTime: Date.now(),
      accessCount: 0,
    };

    this.cache.set(key, entry);
    this.addToPriorityQueue(key, priority);
    this.currentMemoryMB += size;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessTime = Date.now();
      entry.accessCount++;
      return entry.value as T;
    }
    return undefined;
  }

  private evictLowestPriority() {
    // Find lowest priority với items
    for (const priority of ['low', 'normal', 'high'] as Priority[]) {
      const items = this.priorityQueue.get(priority);
      if (items && items.size > 0) {
        // Evict least recently used in this priority
        const oldestKey = this.findOldestInPriority(items);
        if (oldestKey) {
          this.delete(oldestKey);
          return;
        }
      }
    }
  }

  private findOldestInPriority(items: Set<string>): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const key of items) {
      const entry = this.cache.get(key);
      if (entry && entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private setupMemoryMonitoring() {
    // Monitor memory usage và trigger cleanup
    setInterval(() => {
      if (this.currentMemoryMB > this.maxMemoryMB * 0.8) {
        this.performMaintenance();
      }
    }, 30000); // Check every 30 seconds
  }

  private performMaintenance() {
    // Remove items not accessed in last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.accessTime < oneHourAgo && entry.priority === 'low') {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }
}

type Priority = 'low' | 'normal' | 'high';

interface CacheEntry {
  value: any;
  priority: Priority;
  size: number;
  accessTime: number;
  accessCount: number;
}
```


#### 3. Database Optimization Strategies


```typescript
// IndexedDB optimization for large datasets
class OptimizedIndexedDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ChatAppDB';
  private readonly version = 3;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase) {
    // Messages store với composite indexes
    if (!db.objectStoreNames.contains('messages')) {
      const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
      messageStore.createIndex('conversationId', 'conversationId', { unique: false });
      messageStore.createIndex('timestamp', 'timestamp', { unique: false });
      messageStore.createIndex('conversation_timestamp',
        ['conversationId', 'timestamp'], { unique: false });
      messageStore.createIndex('status', 'status', { unique: false });
    }

    // Conversations store
    if (!db.objectStoreNames.contains('conversations')) {
      const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
      convStore.createIndex('lastActivity', 'lastActivity', { unique: false });
      convStore.createIndex('participants', 'participants', { unique: false, multiEntry: true });
    }

    // Users store
    if (!db.objectStoreNames.contains('users')) {
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('username', 'username', { unique: true });
      userStore.createIndex('status', 'status', { unique: false });
    }
  }

  // Efficient message querying với pagination
  async getMessagesPaginated(
    conversationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<{ messages: Message[], nextCursor?: string }> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('conversation_timestamp');

      // Create key range for conversation
      const keyRange = cursor
        ? IDBKeyRange.bound([conversationId, cursor], [conversationId, new Date()])
        : IDBKeyRange.bound([conversationId], [conversationId, {}]);

      const request = index.openCursor(keyRange, 'prev'); // Latest first
      const messages: Message[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && messages.length < limit) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          const nextCursor = cursor?.value.timestamp;
          resolve({ messages, nextCursor });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Bulk operations for better performance
  async bulkInsertMessages(messages: Message[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');

      let completed = 0;
      const total = messages.length;

      messages.forEach(message => {
        const request = store.put(message);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Database maintenance và cleanup
  async performMaintenance(): Promise<void> {
    // Delete messages older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (!this.db) return;

    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const index = store.index('timestamp');

    const range = IDBKeyRange.upperBound(thirtyDaysAgo);
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
}
```


**Scalability Benefits:**


- **Sharded state** prevents single large objects
- **Priority-based caching** optimizes memory usage
- **Efficient database queries** scale to large datasets
- **Bulk operations** reduce transaction overhead
- **Automatic maintenance** keeps database clean


**Người phỏng vấn:** Outstanding scalability planning! The sharded state approach và priority-based memory management show senior-level architectural thinking.


Let's discuss **security considerations** - critical cho messaging apps.


### Security & Privacy Optimization


**Ứng viên:** Security essential cho user trust trong messaging apps:


```typescript
// Input sanitization và XSS prevention
class SecurityManager {
  private static readonly ALLOWED_TAGS = ['b', 'i', 'u', 'br'];
  private static readonly ALLOWED_ATTRIBUTES: Record<string, string[]> = {};

  static sanitizeMessageContent(content: string): string {
    // Use DOMPurify for robust HTML sanitization
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: this.ALLOWED_TAGS,
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
    });
  }

  static validateImageUpload(file: File): ValidationResult {
    const errors: string[] = [];

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type');
    }

    // File size validation (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push('File too large');
    }

    // File name validation
    const safeNamePattern = /^[a-zA-Z0-9._-]+$/;
    if (!safeNamePattern.test(file.name)) {
      errors.push('Invalid file name');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Rate limiting implementation
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing requests for this identifier
      const userRequests = requests.get(identifier) || [];

      // Remove old requests outside the window
      const recentRequests = userRequests.filter(time => time > windowStart);

      // Check if rate limit exceeded
      if (recentRequests.length >= maxRequests) {
        return false;
      }

      // Add current request
      recentRequests.push(now);
      requests.set(identifier, recentRequests);

      return true;
    };
  }
}

// Content Security Policy enforcement
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' wss: https:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`;

// Secure token management
class TokenManager {
  private static readonly TOKEN_KEY = 'chat_auth_token';
  private static readonly REFRESH_KEY = 'chat_refresh_token';

  static setTokens(accessToken: string, refreshToken: string) {
    // Use secure, httpOnly cookies in production
    sessionStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  static clearTokens() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  static async refreshTokenIfNeeded(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return null;
    }

    if (this.isTokenExpired(accessToken)) {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
          const { accessToken: newToken, refreshToken: newRefresh } = await response.json();
          this.setTokens(newToken, newRefresh);
          return newToken;
        } else {
          this.clearTokens();
          return null;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.clearTokens();
        return null;
      }
    }

    return accessToken;
  }
}
```


**Security Benefits:**


- **Input sanitization** prevents XSS attacks
- **File validation** prevents malicious uploads
- **Rate limiting** prevents abuse
- **Secure token handling** protects authentication
- **CSP headers** prevent code injection


**Người phỏng vấn:** Excellent security considerations! The comprehensive input validation và token management show production-ready security thinking.


We're running short on time, nhưng I'd like to touch on one more critical aspect: **accessibility và internationalization**. How would you ensure the chat app is accessible và usable globally?


### Accessibility & Internationalization


**Ứng viên:** Accessibility và i18n crucial cho inclusive messaging app:


```typescript
// Screen reader optimization for chat interface
const MessageItem = ({ message, isOwn, onRetry }: MessageItemProps) => {
  const timeAgo = useTimeAgo(message.timestamp);

  return (
    <div
      role="article"
      aria-label={`Message from ${isOwn ? 'you' : message.sender.name} at ${timeAgo}`}
      className={`message ${isOwn ? 'own' : 'other'}`}
    >
      <div
        aria-live={message.status === 'pending' ? 'polite' : 'off'}
        aria-label={`Message status: ${message.status}`}
      >
        {message.content.text && (
          <p role="text" tabIndex={0}>
            {message.content.text}
          </p>
        )}

        {message.status === 'failed' && (
          <button
            onClick={onRetry}
            aria-label="Retry sending message"
            className="retry-button"
          >
            <RetryIcon aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

// Keyboard navigation support
const ConversationList = ({ conversations, onSelect }: Props) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<HTMLDivElement[]>([]);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(Math.min(focusedIndex + 1, conversations.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(Math.max(focusedIndex - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(conversations[focusedIndex].id);
        break;
    }
  };

  useEffect(() => {
    itemRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  return (
    <div
      role="listbox"
      aria-label="Conversations"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {conversations.map((conv, index) => (
        <div
          key={conv.id}
          ref={el => itemRefs.current[index] = el!}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={-1}
          onClick={() => onSelect(conv.id)}
        >
          {conv.participants[0].name}
        </div>
      ))}
    </div>
  );
};

// Internationalization setup
interface I18nMessages {
  'chat.send.button': string;
  'chat.typing.indicator': string;
  'chat.message.failed': string;
  'chat.connection.lost': string;
  'chat.image.upload.error': string;
}

const useTranslation = () => {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState<I18nMessages>({} as I18nMessages);

  useEffect(() => {
    loadMessages(locale).then(setMessages);
  }, [locale]);

  const t = (key: keyof I18nMessages, params?: Record<string, string>) => {
    let message = messages[key] || key;

    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        message = message.replace(`{${param}}`, value);
      });
    }

    return message;
  };

  return { t, locale, setLocale };
};

// RTL (Right-to-Left) language support
const ChatContainer = () => {
  const { locale } = useTranslation();
  const isRTL = ['ar', 'he', 'fa'].includes(locale);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`chat-container ${isRTL ? 'rtl' : 'ltr'}`}
    >
      <style>{`
        .chat-container.rtl .message.own {
          margin-left: 0;
          margin-right: auto;
          text-align: right;
        }
        .chat-container.rtl .timestamp {
          left: auto;
          right: 0;
        }
      `}</style>
      {/* Chat components */}
    </div>
  );
};
```


**Accessibility & I18n Benefits:**


- **Screen reader support** với proper ARIA labels
- **Keyboard navigation** for non-mouse users
- **High contrast mode** compatibility
- **RTL language support** cho Arabic, Hebrew
- **Localized messages** với parameter substitution
- **Focus management** for complex UI interactions


**Người phỏng vấn:** Perfect conclusion! You've covered accessibility và internationalization comprehensively.


Let me summarize your performance trong optimization phase. You've demonstrated **exceptional technical depth** với:


✅ **Performance optimization** - Virtual scrolling, bundle splitting, memory management
✅ **Real-time optimization** - Robust WebSocket handling, message ordering
✅ **UX optimization** - Loading states, optimistic updates, progressive enhancement

✅ **Scalability planning** - Sharded state, priority caching, database optimization
✅ **Security considerations** - Input sanitization, rate limiting, secure tokens
✅ **Accessibility/i18n** - Screen reader support, keyboard navigation, RTL languages


This level of comprehensive thinking là exactly what chúng tôi expect từ senior candidates tại Meta.


---


## Phần 3: Bài Toán Phụ - Real-time Component Library


*[Thời gian: 11:00 AM - Phân bổ: 8,000 từ]*


**Người phỏng vấn:** We still have 45 minutes, so I'd like to explore another domain để test your adaptability. Let's switch gears completely:


**"Design a real-time collaborative component library for building interactive dashboards - think like a collaborative version of React components where multiple users can edit properties simultaneously."**


This tests your ability để apply RADIO framework to a completely different problem domain. Ready?


**Ứng viên:** Interesting challenge! Very different từ messaging app - moving từ user communication to developer collaboration. Let me apply RADIO framework to this new domain.


### [RADIO Phase: Requirements Exploration]


*[1,200 từ / 15%]*


**Ứng viên:** Let me start bằng understanding scope của collaborative component library:


**Core Functionality Questions:**


- **Component types**: Chart components, form elements, layout containers? Hay generic component library?
- **Collaboration scope**: Multiple developers editing same component properties? Hay entire dashboard layouts?
- **Real-time granularity**: Property-level changes, style updates, data binding changes?
- **Target users**: Frontend developers, designers, product managers, hay mixed teams?


**Technical Requirements:**


- **Development environment**: Integration với existing React projects? Standalone editor?
- **Component architecture**: Custom components hay wrapped existing libraries (Chart.js, Recharts)?
- **Version control**: Git-like versioning cho component changes? Conflict resolution?
- **Export format**: Pure React code generation? JSON configurations?


**Người phỏng vấn:** Great systematic approach! Let me clarify:


**Scope:**


- **Dashboard components** - Charts, tables, forms, layout containers
- **Designer + Developer collaboration** - Designers adjust properties, developers handle data logic
- **Property-level real-time editing** - Color changes, dimensions, data sources
- **React ecosystem integration** - Generate clean React code


**Technical Constraints:**


- **Web-based editor** với live preview
- **Component library exports** to npm packages
- **Real-time collaboration** như Figma but for React components
- **Version history** with rollback capabilities


**Ứng viên:** Perfect! Additional clarifying questions:


**Performance Requirements:**


- **Concurrent users**: How many people editing simultaneously? 5-10 hay hundreds?
- **Component complexity**: Simple props editing hay complex nested component trees?
- **Latency expectations**: Sub-second property sync hay more relaxed?


**Integration Requirements:**


- **Design tools**: Import từ Figma/Sketch designs?
- **Code generation**: TypeScript support? Styled-components vs CSS modules?
- **Data integration**: Mock data for preview? Live API connections?


**Business Logic:**


- **Access control**: Private/public component libraries? Team permissions?
- **Component marketplace**: Sharing components across organizations?


**Người phỏng vấn:** Excellent questions!


- **5-20 concurrent editors** max per component library
- **Medium complexity** - Nested components with 10-50 configurable properties
- **Sub-second sync** for smooth collaboration
- **TypeScript + Styled-components** output
- **Team-based access** with role permissions
- **Private libraries** for now, marketplace later


### [RADIO Phase: Architecture Design]


*[1,600 từ / 20%]*


**Ứng viên:** Based on requirements, đây là architecture design:


```
┌─────────────────────────────────────────────────────────┐
│                  Collaborative Editor                   │
├─────────────────────────────────────────────────────────┤
│                    Presentation Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Component  │  │ Properties  │  │  Live       │     │
│  │   Canvas    │  │   Panel     │  │  Preview    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                  Collaboration Layer                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Change    │  │  Conflict   │  │  User       │     │
│  │  Tracking   │  │ Resolution  │  │ Presence    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                   Component Engine                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Component   │  │   Props     │  │    Code     │     │
│  │  Registry   │  │ Validator   │  │ Generator   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                     Data Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Component  │  │  Version    │  │    User     │     │
│  │   Store     │  │  History    │  │   Store     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```


**Key Architectural Decisions:**


#### 1. Component-as-Code Architecture


```typescript
// Component definition structure
interface ComponentDefinition {
  id: string;
  name: string;
  category: 'chart' | 'form' | 'layout' | 'custom';
  schema: ComponentSchema;
  code: ComponentCode;
  metadata: ComponentMetadata;
  version: string;
  dependencies: string[];
}

interface ComponentSchema {
  props: Record<string, PropDefinition>;
  children?: ComponentSchema[];
  styling: StyleDefinition;
  data?: DataBinding;
}

interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'object';
  default: any;
  validation?: ValidationRule[];
  editor: EditorConfig;
  dependencies?: string[]; // Other props this depends on
}

// Real-time collaboration state
interface CollaborationState {
  activeUsers: UserPresence[];
  activeEdits: ActiveEdit[];
  conflictedProperties: ConflictedProperty[];
  versionHistory: VersionSnapshot[];
}

interface ActiveEdit {
  userId: string;
  propertyPath: string;
  timestamp: number;
  currentValue: any;
  lockDuration: number;
}
```


#### 2. Operational Transform Architecture


```typescript
// Operational Transform for conflict-free collaboration
class OperationalTransform {
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Transform operations to maintain consistency
    if (op1.path === op2.path) {
      // Same property - resolve conflict
      return this.resolveConflict(op1, op2);
    } else if (this.pathsConflict(op1.path, op2.path)) {
      // Related properties - check dependencies
      return this.resolveDependentPaths(op1, op2);
    } else {
      // Independent operations - no transformation needed
      return [op1, op2];
    }
  }

  private static resolveConflict(op1: Operation, op2: Operation): [Operation, Operation] {
    // Timestamp-based conflict resolution
    if (op1.timestamp > op2.timestamp) {
      return [op1, { ...op2, type: 'noop' }];
    } else {
      return [{ ...op1, type: 'noop' }, op2];
    }
  }

  private static pathsConflict(path1: string, path2: string): boolean {
    // Check if property paths affect each other
    const deps = PropertyDependencies[path1] || [];
    return deps.includes(path2) || path1.startsWith(path2) || path2.startsWith(path1);
  }
}

// Operation types for different changes
type Operation =
  | PropertyChangeOperation
  | StyleChangeOperation
  | StructureChangeOperation
  | DataBindingOperation;

interface PropertyChangeOperation {
  type: 'property_change';
  componentId: string;
  path: string;
  oldValue: any;
  newValue: any;
  userId: string;
  timestamp: number;
}
```


#### 3. Component Registry & Code Generation


```typescript
// Dynamic component registry
class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();
  private generators = new Map<string, CodeGenerator>();

  registerComponent(definition: ComponentDefinition) {
    this.components.set(definition.id, definition);
    this.generators.set(definition.id, new CodeGenerator(definition));
  }

  generateCode(componentId: string, props: Record<string, any>): GeneratedCode {
    const generator = this.generators.get(componentId);
    if (!generator) throw new Error(`Component ${componentId} not found`);

    return generator.generate(props);
  }

  validateProps(componentId: string, props: Record<string, any>): ValidationResult {
    const definition = this.components.get(componentId);
    if (!definition) return { valid: false, errors: ['Component not found'] };

    return PropValidator.validate(definition.schema.props, props);
  }
}

// Code generation for React components
class CodeGenerator {
  constructor(private definition: ComponentDefinition) {}

  generate(props: Record<string, any>): GeneratedCode {
    const imports = this.generateImports();
    const component = this.generateComponent(props);
    const styles = this.generateStyles(props);
    const types = this.generateTypeDefinitions();

    return {
      tsx: `${imports}\n\n${types}\n\n${component}`,
      css: styles,
      dependencies: this.definition.dependencies
    };
  }

  private generateComponent(props: Record<string, any>): string {
    const componentName = this.definition.name;
    const propsInterface = `${componentName}Props`;

    return `
export const ${componentName}: React.FC<${propsInterface}> = (props) => {
  const { ${Object.keys(props).join(', ')} } = props;

  return (
    <StyledContainer>
      ${this.generateJSX(props)}
    </StyledContainer>
  );
};`;
  }

  private generateJSX(props: Record<string, any>): string {
    // Generate JSX based on component type và properties
    switch (this.definition.category) {
      case 'chart':
        return this.generateChartJSX(props);
      case 'form':
        return this.generateFormJSX(props);
      default:
        return this.generateGenericJSX(props);
    }
  }
}
```


**Architecture Benefits:**


- **Component-as-code** enables version control và reusability
- **Operational Transform** ensures conflict-free collaboration
- **Dynamic registry** allows extensible component types
- **Code generation** produces clean, maintainable React code


**Người phỏng vấn:** Solid architecture! The operational transform approach shows understanding của collaborative editing complexity. How về data modeling?


### [RADIO Phase: Data Model]


*[800 từ / 10%]*


**Ứng viên:** Data model cần support both component definitions và collaboration state:


```typescript
// Core Domain Entities
interface ComponentLibrary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  teamId: string;
  components: ComponentDefinition[];
  visibility: 'private' | 'team' | 'public';
  createdAt: Date;
  updatedAt: Date;
}

interface ComponentDefinition {
  id: string;
  libraryId: string;
  name: string;
  description: string;
  category: ComponentCategory;

  // Technical specification
  schema: ComponentSchema;
  defaultProps: Record<string, any>;
  styleSheet: StyleDefinition;

  // Code generation
  template: ComponentTemplate;
  dependencies: PackageDependency[];

  // Metadata
  tags: string[];
  version: string;
  changelog: ChangelogEntry[];

  // Collaboration
  lastEditedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ComponentInstance {
  id: string;
  componentDefinitionId: string;
  props: Record<string, any>;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  parentId?: string; // For nested components
  children: string[]; // Child component IDs
}

// Collaboration-specific data
interface EditSession {
  id: string;
  componentLibraryId: string;
  participants: SessionParticipant[];
  activeComponents: string[]; // Components being edited
  startedAt: Date;
  lastActivity: Date;
}

interface SessionParticipant {
  userId: string;
  joinedAt: Date;
  cursor: CursorPosition;
  selection: ComponentSelection;
  permissions: EditPermission[];
}

interface CursorPosition {
  componentId: string | null;
  propertyPath: string | null;
  coordinates: { x: number; y: number };
}

// Version control data
interface VersionSnapshot {
  id: string;
  componentLibraryId: string;
  version: string;
  changes: ChangeRecord[];
  authorId: string;
  message: string;
  createdAt: Date;

  // Snapshot data
  components: ComponentDefinition[];
  metadata: SnapshotMetadata;
}

interface ChangeRecord {
  type: 'component_added' | 'component_modified' | 'component_removed' | 'property_changed';
  componentId: string;
  propertyPath?: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  timestamp: Date;
}
```


**Data Relationships:**


- **One Library → Many Components** (1:N)
- **One Component → Many Instances** (1:N)
- **One Session → Many Participants** (1:N)
- **One Library → Many Versions** (1:N)
- **Components reference each other** (M:N) for composition


### [RADIO Phase: Interface Definition]


*[1,200 từ / 15%]*


**Ứng viên:** Interfaces cover both REST APIs và real-time collaboration:


```typescript
// Component Library API
interface ComponentLibraryAPI {
  // Library management
  createLibrary(library: CreateLibraryRequest): Promise<ComponentLibrary>;
  getLibrary(id: string): Promise<ComponentLibrary>;
  updateLibrary(id: string, updates: Partial<ComponentLibrary>): Promise<ComponentLibrary>;
  deleteLibrary(id: string): Promise<void>;

  // Component CRUD
  createComponent(libraryId: string, component: CreateComponentRequest): Promise<ComponentDefinition>;
  updateComponent(componentId: string, updates: ComponentUpdate): Promise<ComponentDefinition>;
  deleteComponent(componentId: string): Promise<void>;
  duplicateComponent(componentId: string): Promise<ComponentDefinition>;

  // Code generation
  generateComponent(componentId: string, props: Record<string, any>): Promise<GeneratedCode>;
  previewComponent(componentId: string, props: Record<string, any>): Promise<PreviewResult>;

  // Version control
  createSnapshot(libraryId: string, message: string): Promise<VersionSnapshot>;
  getVersionHistory(libraryId: string): Promise<VersionSnapshot[]>;
  revertToVersion(libraryId: string, versionId: string): Promise<void>;
}

// Real-time Collaboration API
interface CollaborationAPI {
  // Session management
  joinSession(libraryId: string): Promise<EditSession>;
  leaveSession(sessionId: string): Promise<void>;

  // Real-time operations
  sendOperation(sessionId: string, operation: Operation): Promise<void>;
  sendCursorUpdate(sessionId: string, cursor: CursorPosition): Promise<void>;

  // Conflict resolution
  requestLock(sessionId: string, componentId: string, propertyPath: string): Promise<LockResult>;
  releaseLock(sessionId: string, lockId: string): Promise<void>;
}

// WebSocket Events for real-time collaboration
type CollaborationEvent =
  | UserJoinedEvent
  | UserLeftEvent
  | OperationEvent
  | CursorUpdateEvent
  | LockAcquiredEvent
  | LockReleasedEvent
  | ConflictEvent;

interface OperationEvent {
  type: 'operation';
  sessionId: string;
  operation: Operation;
  userId: string;
  timestamp: Date;
}

interface CursorUpdateEvent {
  type: 'cursor_update';
  sessionId: string;
  userId: string;
  cursor: CursorPosition;
}

// React Component Interfaces
interface ComponentEditorProps {
  libraryId: string;
  onComponentSelect: (componentId: string) => void;
  onPropertyChange: (componentId: string, path: string, value: any) => void;
}

interface PropertyPanelProps {
  component: ComponentDefinition;
  values: Record<string, any>;
  onChange: (path: string, value: any) => void;
  readOnly?: boolean;
  conflicts?: ConflictedProperty[];
}

interface LivePreviewProps {
  component: ComponentDefinition;
  props: Record<string, any>;
  width?: number;
  height?: number;
}

// Custom Hooks
interface UseCollaborationResult {
  session: EditSession | null;
  participants: SessionParticipant[];
  sendOperation: (operation: Operation) => void;
  updateCursor: (position: CursorPosition) => void;
  conflicts: ConflictedProperty[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

function useCollaboration(libraryId: string): UseCollaborationResult;

interface UseComponentEditorResult {
  components: ComponentDefinition[];
  selectedComponent: ComponentDefinition | null;
  selectComponent: (id: string) => void;
  updateComponent: (id: string, updates: ComponentUpdate) => Promise<void>;
  generateCode: (componentId: string) => Promise<GeneratedCode>;
}

function useComponentEditor(libraryId: string): UseComponentEditorResult;
```


### [RADIO Phase: Optimizations & Deep Dive]


*[3,200 từ / 40%]*


**Ứng viên:** Optimizations critical cho smooth collaborative editing experience:


#### 1. Real-time Collaboration Performance


```typescript
// Debounced operation batching
class OperationBatcher {
  private pendingOps: Operation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchDelay = 16; // ~60fps

  addOperation(operation: Operation) {
    this.pendingOps.push(operation);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
    }, this.batchDelay);
  }

  private flushBatch() {
    if (this.pendingOps.length === 0) return;

    // Merge operations on same property
    const mergedOps = this.mergeOperations(this.pendingOps);

    // Send batched operations
    this.sendOperations(mergedOps);

    this.pendingOps = [];
    this.batchTimeout = null;
  }

  private mergeOperations(operations: Operation[]): Operation[] {
    const merged = new Map<string, Operation>();

    operations.forEach(op => {
      const key = `${op.componentId}:${op.path}`;

      if (merged.has(key)) {
        // Merge with existing operation
        const existing = merged.get(key)!;
        merged.set(key, {
          ...op,
          oldValue: existing.oldValue, // Keep original old value
        });
      } else {
        merged.set(key, op);
      }
    });

    return Array.from(merged.values());
  }
}

// Optimistic updates với rollback
class OptimisticCollaborationManager {
  private optimisticOps = new Map<string, Operation>();
  private rollbackCallbacks = new Map<string, () => void>();

  async applyOptimistic(
    operation: Operation,
    applyFn: () => void,
    rollbackFn: () => void
  ): Promise<void> {
    const opId = this.generateOpId(operation);

    // Apply optimistically
    applyFn();
    this.optimisticOps.set(opId, operation);
    this.rollbackCallbacks.set(opId, rollbackFn);

    try {
      // Send to server
      await this.sendOperation(operation);

      // Success - remove from optimistic tracking
      this.optimisticOps.delete(opId);
      this.rollbackCallbacks.delete(opId);

    } catch (error) {
      // Failure - rollback optimistic change
      rollbackFn();
      this.optimisticOps.delete(opId);
      this.rollbackCallbacks.delete(opId);

      throw error;
    }
  }

  rollbackConflictedOperations(conflictedOpIds: string[]) {
    conflictedOpIds.forEach(opId => {
      const rollbackFn = this.rollbackCallbacks.get(opId);
      if (rollbackFn) {
        rollbackFn();
        this.optimisticOps.delete(opId);
        this.rollbackCallbacks.delete(opId);
      }
    });
  }
}
```


#### 2. Component Rendering Performance


```typescript
// Virtualized component rendering
const VirtualizedComponentCanvas = memo<Props>(({ components, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportComponents, setViewportComponents] = useState<ComponentInstance[]>([]);

  // Calculate visible components based on viewport
  const updateVisibleComponents = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollLeft, clientWidth, clientHeight } = containerRef.current;

    const visible = components.filter(component => {
      const { position, dimensions } = component;

      return (
        position.x < scrollLeft + clientWidth &&
        position.x + dimensions.width > scrollLeft &&
        position.y < scrollTop + clientHeight &&
        position.y + dimensions.height > scrollTop
      );
    });

    setViewportComponents(visible);
  }, [components]);

  // Throttled scroll handler
  const handleScroll = useThrottledCallback(updateVisibleComponents, 16);

  useEffect(() => {
    updateVisibleComponents();
  }, [components, updateVisibleComponents]);

  return (
    <div
      ref={containerRef}
      className="component-canvas"
      onScroll={handleScroll}
      style={{ overflow: 'auto', width: '100%', height: '100%' }}
    >
      {viewportComponents.map(component => (
        <ComponentRenderer
          key={component.id}
          component={component}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
});

// Efficient component diff algorithm
class ComponentDiffer {
  static calculateChanges(
    oldComponents: ComponentInstance[],
    newComponents: ComponentInstance[]
  ): ComponentChanges {
    const changes: ComponentChanges = {
      added: [],
      removed: [],
      modified: [],
    };

    const oldMap = new Map(oldComponents.map(c => [c.id, c]));
    const newMap = new Map(newComponents.map(c => [c.id, c]));

    // Find added và modified
    newComponents.forEach(component => {
      const oldComponent = oldMap.get(component.id);

      if (!oldComponent) {
        changes.added.push(component);
      } else if (!this.componentsEqual(oldComponent, component)) {
        changes.modified.push({
          old: oldComponent,
          new: component,
          changedProperties: this.getChangedProperties(oldComponent, component)
        });
      }
    });

    // Find removed
    oldComponents.forEach(component => {
      if (!newMap.has(component.id)) {
        changes.removed.push(component);
      }
    });

    return changes;
  }

  private static componentsEqual(a: ComponentInstance, b: ComponentInstance): boolean {
    return JSON.stringify(a) === JSON.stringify(b); // Simple but effective
  }

  private static getChangedProperties(
    oldComp: ComponentInstance,
    newComp: ComponentInstance
  ): string[] {
    const changed: string[] = [];

    // Compare props
    Object.keys(newComp.props).forEach(key => {
      if (oldComp.props[key] !== newComp.props[key]) {
        changed.push(`props.${key}`);
      }
    });

    // Compare position và dimensions
    if (oldComp.position.x !== newComp.position.x || oldComp.position.y !== newComp.position.y) {
      changed.push('position');
    }

    if (oldComp.dimensions.width !== newComp.dimensions.width || oldComp.dimensions.height !== newComp.dimensions.height) {
      changed.push('dimensions');
    }

    return changed;
  }
}
```


#### 3. Code Generation Optimization


```typescript
// Cached code generation với smart invalidation
class CachedCodeGenerator {
  private cache = new Map<string, Generate
```


## Claude


```typescript
// Cached code generation với smart invalidation
class CachedCodeGenerator {
  private cache = new Map<string, GeneratedCodeCache>();
  private dependencyGraph = new Map<string, Set<string>>();

  async generateCode(
    componentId: string,
    props: Record<string, any>
  ): Promise<GeneratedCode> {
    const cacheKey = this.getCacheKey(componentId, props);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isInvalidated(cached)) {
      return cached.code;
    }

    // Generate fresh code
    const code = await this.doGenerate(componentId, props);

    // Cache với dependency tracking
    this.cache.set(cacheKey, {
      code,
      timestamp: Date.now(),
      dependencies: this.extractDependencies(componentId),
      componentVersion: await this.getComponentVersion(componentId)
    });

    return code;
  }

  invalidateComponent(componentId: string) {
    // Invalidate direct caches
    const toInvalidate = Array.from(this.cache.keys())
      .filter(key => key.startsWith(componentId));

    toInvalidate.forEach(key => this.cache.delete(key));

    // Invalidate dependent components
    const dependents = this.dependencyGraph.get(componentId) || new Set();
    dependents.forEach(depId => this.invalidateComponent(depId));
  }

  private extractDependencies(componentId: string): string[] {
    // Analyze component definition to find dependencies
    const component = this.componentRegistry.get(componentId);
    return component?.dependencies || [];
  }
}

// Template-based code generation
class TemplateCodeGenerator {
  private templates = new Map<string, CodeTemplate>();

  generateFromTemplate(
    templateId: string,
    context: TemplateContext
  ): GeneratedCode {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    const tsx = this.renderTemplate(template.tsx, context);
    const css = this.renderTemplate(template.css, context);
    const types = this.generateTypes(context);

    return { tsx, css, types, dependencies: template.dependencies };
  }

  private renderTemplate(template: string, context: TemplateContext): string {
    let result = template;

    // Replace variables: {{variableName}}
    result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
      return context.variables[varName] || '';
    });

    // Handle conditionals: {{#if condition}}...{{/if}}
    result = result.replace(
      /\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs,
      (_, condition, content) => {
        return context.variables[condition] ? content : '';
      }
    );

    // Handle loops: {{#each items}}...{{/each}}
    result = result.replace(
      /\{\{#each (\w+)\}\}(.*?)\{\{\/each\}\}/gs,
      (_, arrayName, itemTemplate) => {
        const array = context.variables[arrayName] || [];
        return array.map((item: any, index: number) =>
          this.renderTemplate(itemTemplate, {
            ...context,
            variables: { ...context.variables, item, index }
          })
        ).join('\n');
      }
    );

    return result;
  }
}
```


#### 4. Advanced Conflict Resolution


```typescript
// Intelligent conflict resolution system
class ConflictResolver {
  private conflictStrategies = new Map<string, ConflictStrategy>();

  constructor() {
    this.registerDefaultStrategies();
  }

  resolveConflict(conflict: PropertyConflict): ResolutionResult {
    const strategy = this.conflictStrategies.get(conflict.propertyType)
      || this.conflictStrategies.get('default')!;

    return strategy.resolve(conflict);
  }

  private registerDefaultStrategies() {
    // Color conflicts - blend colors
    this.conflictStrategies.set('color', {
      resolve: (conflict) => {
        const color1 = conflict.value1 as string;
        const color2 = conflict.value2 as string;
        return {
          resolvedValue: this.blendColors(color1, color2),
          strategy: 'blend',
          confidence: 0.8
        };
      }
    });

    // Numeric conflicts - average values
    this.conflictStrategies.set('number', {
      resolve: (conflict) => {
        const num1 = conflict.value1 as number;
        const num2 = conflict.value2 as number;
        return {
          resolvedValue: Math.round((num1 + num2) / 2),
          strategy: 'average',
          confidence: 0.9
        };
      }
    });

    // String conflicts - user choice required
    this.conflictStrategies.set('string', {
      resolve: (conflict) => ({
        resolvedValue: null,
        strategy: 'user_choice',
        confidence: 0.0,
        requiresUserInput: true
      })
    });

    // Default strategy - latest wins
    this.conflictStrategies.set('default', {
      resolve: (conflict) => ({
        resolvedValue: conflict.timestamp1 > conflict.timestamp2
          ? conflict.value1 : conflict.value2,
        strategy: 'latest_wins',
        confidence: 0.6
      })
    });
  }

  private blendColors(color1: string, color2: string): string {
    // Simple color blending - convert to RGB, average, convert back
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return color1; // Fallback

    const blended = {
      r: Math.round((rgb1.r + rgb2.r) / 2),
      g: Math.round((rgb1.g + rgb2.g) / 2),
      b: Math.round((rgb1.b + rgb2.b) / 2)
    };

    return this.rgbToHex(blended);
  }
}

// Smart property dependency resolution
class PropertyDependencyManager {
  private dependencies = new Map<string, PropertyDependency[]>();

  addDependency(
    componentType: string,
    dependentProp: string,
    dependsOn: string[],
    resolver: DependencyResolver
  ) {
    const key = `${componentType}.${dependentProp}`;
    const existing = this.dependencies.get(key) || [];

    existing.push({
      dependentProperty: dependentProp,
      dependencies: dependsOn,
      resolver
    });

    this.dependencies.set(key, existing);
  }

  resolveDependencies(
    componentType: string,
    changedProperty: string,
    newValue: any,
    currentProps: Record<string, any>
  ): Record<string, any> {
    const affectedProps: Record<string, any> = {};

    // Find properties that depend on the changed property
    for (const [key, deps] of this.dependencies) {
      if (!key.startsWith(componentType)) continue;

      for (const dep of deps) {
        if (dep.dependencies.includes(changedProperty)) {
          const resolvedValue = dep.resolver({
            changedProperty,
            newValue,
            currentProps: { ...currentProps, [changedProperty]: newValue }
          });

          if (resolvedValue !== undefined) {
            affectedProps[dep.dependentProperty] = resolvedValue;
          }
        }
      }
    }

    return affectedProps;
  }
}

// Example usage - Chart component dependencies
const chartDependencies = new PropertyDependencyManager();

// Width affects height in certain aspect ratios
chartDependencies.addDependency(
  'Chart',
  'height',
  ['width', 'aspectRatio'],
  ({ currentProps }) => {
    if (currentProps.maintainAspectRatio) {
      return currentProps.width / currentProps.aspectRatio;
    }
    return undefined; // No change needed
  }
);

// Color theme affects multiple color properties
chartDependencies.addDependency(
  'Chart',
  'backgroundColor',
  ['colorTheme'],
  ({ newValue: theme }) => {
    const themes = {
      'light': '#ffffff',
      'dark': '#1a1a1a',
      'blue': '#e3f2fd'
    };
    return themes[theme] || '#ffffff';
  }
);
```


#### 5. Performance Monitoring & Analytics


```typescript
// Real-time performance monitoring
class CollaborationMetrics {
  private metrics = {
    operationLatency: new RunningAverage(100),
    conflictRate: new RunningAverage(50),
    userSatisfactionScore: new RunningAverage(20),
    systemLoad: new RunningAverage(30)
  };

  recordOperationLatency(startTime: number, endTime: number) {
    const latency = endTime - startTime;
    this.metrics.operationLatency.add(latency);

    // Alert if latency too high
    if (latency > 2000) { // 2 seconds
      this.alertHighLatency(latency);
    }
  }

  recordConflict(userId1: string, userId2: string, propertyPath: string) {
    this.metrics.conflictRate.add(1);

    // Log for analysis
    analytics.track('collaboration_conflict', {
      users: [userId1, userId2],
      property: propertyPath,
      timestamp: Date.now()
    });
  }

  getHealthStatus(): SystemHealth {
    const avgLatency = this.metrics.operationLatency.getAverage();
    const conflictRate = this.metrics.conflictRate.getAverage();

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (avgLatency > 1000 || conflictRate > 0.3) {
      status = 'degraded';
    }
    if (avgLatency > 3000 || conflictRate > 0.5) {
      status = 'critical';
    }

    return {
      status,
      metrics: {
        averageLatency: avgLatency,
        conflictRate: conflictRate,
        activeUsers: this.getActiveUserCount()
      }
    };
  }

  private alertHighLatency(latency: number) {
    console.warn(`High collaboration latency detected: ${latency}ms`);
    // In production: send to monitoring service
  }
}

// User experience analytics
class UXAnalytics {
  trackComponentCreation(componentType: string, timeToCreate: number) {
    analytics.track('component_created', {
      type: componentType,
      duration: timeToCreate,
      timestamp: Date.now()
    });
  }

  trackPropertyEdit(propertyType: string, editDuration: number, conflicts: number) {
    analytics.track('property_edited', {
      type: propertyType,
      duration: editDuration,
      conflicts: conflicts,
      timestamp: Date.now()
    });
  }

  trackCodeGeneration(componentId: string, generationTime: number, codeQuality: number) {
    analytics.track('code_generated', {
      componentId,
      generationTime,
      qualityScore: codeQuality,
      timestamp: Date.now()
    });
  }

  generateUsabilityReport(): UsabilityReport {
    // Analyze collected data to identify pain points
    return {
      mostEditedProperties: this.getMostEditedProperties(),
      averageSessionDuration: this.getAverageSessionDuration(),
      conflictHotspots: this.getConflictHotspots(),
      userSatisfactionTrends: this.getSatisfactionTrends()
    };
  }
}
```


**Người phỏng vấn:** Outstanding work! You've demonstrated exceptional technical depth với collaborative component library design.


Let me summarize your performance across both problems:


## Overall Assessment


### Technical Excellence ⭐⭐⭐⭐⭐


- **System Design Skills**: Comprehensive RADIO framework application
- **Architecture Thinking**: Well-structured, scalable designs
- **Technical Depth**: Advanced optimizations và real-world considerations
- **Code Quality**: Clean, maintainable TypeScript implementations


### Problem-Solving Approach ⭐⭐⭐⭐⭐


- **Requirements Analysis**: Thorough exploration với clarifying questions
- **Solution Methodology**: Systematic, structured approach
- **Edge Case Handling**: Excellent consideration của complex scenarios
- **Trade-off Analysis**: Clear reasoning for technical decisions


### Frontend Expertise ⭐⭐⭐⭐⭐


- **React Ecosystem**: Deep knowledge của modern patterns
- **Performance Optimization**: Virtual scrolling, caching, memory management
- **Real-time Systems**: WebSocket optimization, conflict resolution
- **User Experience**: Loading states, accessibility, internationalization


### Collaboration & Communication ⭐⭐⭐⭐⭐


- **Clear Communication**: Well-structured explanations
- **Interactive Discussion**: Great back-and-forth dialogue
- **Adaptability**: Smoothly handled domain switch
- **Professional Approach**: Senior-level technical leadership


## Specific Strengths


**Chat Application Design:**


- Offline-first architecture với proper sync strategies
- Sophisticated real-time optimization
- Comprehensive security considerations
- Production-ready scalability planning


**Component Library Design:**


- Innovative operational transform approach
- Smart conflict resolution strategies
- Efficient code generation system
- Advanced performance monitoring


## Areas of Excellence


1. **Operational Transform Understanding** - Rare expertise for collaborative systems
2. **Performance Engineering** - Virtual scrolling, memory management, caching
3. **Security Mindset** - Input sanitization, rate limiting, secure tokens
4. **Production Thinking** - Monitoring, analytics, error handling
5. **Accessibility Awareness** - Screen readers, keyboard navigation, i18n


## Recommendation: STRONG HIRE


You've demonstrated exactly the type of **senior frontend engineering excellence** chúng tôi cần tại Meta. Your combination của:


- Deep technical knowledge
- Systematic problem-solving
- Production experience
- Architecture leadership


...makes you an ideal candidate cho our team.


**Next Steps:**


- **Hiring Committee Review** - I'll present your case với strong recommendation
- **Team Matching** - Multiple teams would benefit từ your expertise
- **Offer Discussion** - Talent team will reach out về compensation và logistics


Congratulations on an outstanding interview! Any questions về the process hay the role?


**Ứng viên:** Thank you so much! That feedback is incredibly encouraging. I really enjoyed the depth của technical discussion và the opportunity để showcase system design thinking.


I have a few questions:


1. **Team Placement**: Are there specific teams at Meta that focus heavily on real-time collaborative features? The component library problem really excited me.
2. **Technology Stack**: How much flexibility is there trong choosing modern technologies? I noticed we discussed cutting-edge approaches like operational transforms.
3. **Timeline**: What's the typical timeline for the hiring committee review và team matching process?


**Người phỏng vấn:** Great questions!


1. **Teams**: Absolutely! Several teams would be perfect fit:

Workplace (collaborative editing platform)
Instagram Creator Tools (collaborative content creation)
Reality Labs (collaborative VR/AR interfaces)
Internal Tools (developer productivity platforms)
2. **Technology Freedom**: Meta encourages innovation. Teams regularly adopt cutting-edge tech như:

Modern React patterns (Concurrent features, Suspense)
Advanced state management (Recoil, Zustand experiments)
Real-time collaboration tech
Performance optimization tools
3. **Timeline**:

This week: Hiring committee review
Next week: Team matching calls
Following week: Offer discussion
Total: ~2-3 weeks typical turnaround


The hiring committee meets twice weekly, và based on your performance, I expect very positive feedback. Multiple teams will likely want to chat với you!


**Final Note**: Your expertise trong real-time systems và performance optimization is exactly what Meta needs cho next-generation collaborative tools. Very excited to see you join the team!


**Ứng viên:** Perfect! The teams you mentioned sound fascinating, especially Reality Labs collaborative VR interfaces - that's such a cutting-edge space.


Thank you for such an engaging và thorough interview process. I'm excited about the potential to contribute to Meta's mission với advanced frontend engineering.


Looking forward to the next steps!


**Người phỏng vấn:** Excellent! You'll hear from our talent team soon. Welcome to the Meta family - looking forward to working together! 🚀


---


## Kết Luận Buổi Phỏng Vấn


**Thời gian kết thúc**: 11:45 AM

**Tổng thời gian**: 2 giờ 45 phút

**Kết quả**: STRONG HIRE recommendation


**Điểm nổi bật của ứng viên:**


- ✅ Excellent RADIO framework application
- ✅ Advanced technical depth (Operational Transform, Virtual Scrolling)
- ✅ Production-ready thinking (Security, Performance, Monitoring)
- ✅ Strong communication và collaboration skills
- ✅ Adaptability across different problem domains


Đây là một example của **senior-level frontend system design interview** thành công tại big tech company như Meta/Facebook.
