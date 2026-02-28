High-Level Design: Chat Application like Zalo (Frontend Architecture)

1. Problem Statement & Requirements
   Problem Statement
   Design a production-grade, scalable chat application similar to Zalo that supports real-time messaging, multimedia sharing, group conversations, and presence management for millions of concurrent users. The frontend must handle high-frequency real-time updates, maintain consistent state across tabs, optimize for low-end devices, and provide offline-first capabilities.
   Functional Requirements
   Core Features:
   1-on-1 Messaging: Text, emoji, stickers, voice messages
   Group Chat: Up to 500 members, admin controls, mentions
   Multimedia Sharing: Images, videos, files (max 100MB), voice/video calls
   Message Features: Edit, delete, reply, forward, reactions
   Presence System: Online/offline/typing indicators, last seen
   Search: Message history, contacts, global search
   Notifications: Push notifications, in-app alerts, badge counts
   Message Status: Sent, delivered, read receipts
   Chat Management: Pin conversations, mute, archive, delete
   User Roles:
   Regular User (send/receive messages, create groups)
   Group Admin (manage members, settings, permissions)
   Super Admin (moderation, content management)
   Non-Functional Requirements
   Performance Metrics:
   Initial Load Time: < 2s (3G network)
   Time to Interactive (TTI): < 3.5s
   First Contentful Paint (FCP): < 1.5s
   Largest Contentful Paint (LCP): < 2.5s
   First Input Delay (FID): < 100ms
   Cumulative Layout Shift (CLS): < 0.1
   Message Delivery Latency: < 200ms (p95)
   Typing Indicator Delay: < 100ms
   Scroll Performance: 60 FPS with 10,000+ messages
   Bundle Size:
   Initial: < 200KB (gzipped)
   Total: < 1MB (fully loaded)
   Memory Usage: < 150MB for 50 active conversations
   WebSocket Reconnection: < 1s on network recovery
   Availability & Reliability:
   99.9% uptime
   Graceful degradation on slow networks
   Offline message queue (up to 100 messages)
   Cross-tab synchronization
   Scale Estimates
   User Metrics:
   Total Users: 50M
   Daily Active Users (DAU): 20M
   Peak Concurrent Users: 5M
   Average Messages/User/Day: 50
   Total Messages/Day: 1B
   Technical Scale:
   Concurrent WebSocket Connections: 5M
   Messages/Second (peak): 15,000
   API Requests/Second: 50,000
   Data Transfer/Day: 500TB
   Average Conversation/User: 20
   Average Group Size: 15 members
   Message Retention: 1 year
   Network Considerations:
   60% mobile users (3G/4G)
   30% WiFi
   10% slow connections (2G)

2. High-Level Architecture
   Architecture Overview
   ┌─────────────────────────────────────────────────────────────────┐
   │ Browser/Mobile Web │
   ├─────────────────────────────────────────────────────────────────┤
   │ │
   │ ┌────────────────┐ ┌──────────────┐ ┌──────────────────┐ │
   │ │ Service Worker│ │ IndexedDB │ │ Web Workers │ │
   │ │ (Offline) │ │ (Cache/Queue)│ │ (Heavy Compute) │ │
   │ └────────────────┘ └──────────────┘ └──────────────────┘ │
   │ │
   ├─────────────────────────────────────────────────────────────────┤
   │ Application Layer │
   ├─────────────────────────────────────────────────────────────────┤
   │ │
   │ ┌──────────────────────────────────────────────────────────┐ │
   │ │ App Shell (React) │ │
   │ │ ┌─────────────┐ ┌──────────────┐ ┌────────────────┐ │ │
   │ │ │ Routing │ │ Auth Guard │ │ Error Boundary│ │ │
   │ │ │ (Lazy) │ │ (Protected) │ │ (Suspense) │ │ │
   │ │ └─────────────┘ └──────────────┘ └────────────────┘ │ │
   │ └──────────────────────────────────────────────────────────┘ │
   │ │
   │ ┌──────────────────────────────────────────────────────────┐ │
   │ │ Presentation Layer (Components) │ │
   │ │ │ │
   │ │ Conversations │ Chat Window │ Media │ Settings │ │
   │ │ List │ (Messages) │ Viewer │ Panel │ │
   │ └──────────────────────────────────────────────────────────┘ │
   │ │
   ├─────────────────────────────────────────────────────────────────┤
   │ State Management │
   ├─────────────────────────────────────────────────────────────────┤
   │ │
   │ ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐ │
   │ │ Zustand │ │ React │ │ WebSocket│ │ Cache │ │
   │ │ (Global) │ │ Query │ │ Manager │ │ (SWR) │ │
   │ │ │ │ (Server) │ │ │ │ │ │
   │ └────────────┘ └───────────┘ └──────────┘ └────────────┘ │
   │ │
   ├─────────────────────────────────────────────────────────────────┤
   │ Data Access Layer │
   ├─────────────────────────────────────────────────────────────────┤
   │ │
   │ ┌──────────────────────────────────────────────────────────┐ │
   │ │ API Abstraction │ │
   │ │ ┌─────────────┐ ┌──────────────┐ ┌────────────────┐ │ │
   │ │ │ REST API │ │ WebSocket │ │ GraphQL │ │ │
   │ │ │ Client │ │ Client │ │ (Future) │ │ │
   │ │ └─────────────┘ └──────────────┘ └────────────────┘ │ │
   │ └──────────────────────────────────────────────────────────┘ │
   │ │
   └─────────────────────────────────────────────────────────────────┘
   │
   │ HTTP/WS
   ▼
   ┌─────────────────────────────────────┐
   │ Backend Services │
   │ (Load Balancer → API Gateway → │
   │ Auth/Chat/Media/Presence Services) │
   └─────────────────────────────────────┘

Component Hierarchy
App
├── ErrorBoundary
│ └── Suspense (fallback: <LoadingScreen />)
│ └── Router
│ ├── AuthGuard
│ │ ├── MainLayout
│ │ │ ├── Sidebar
│ │ │ │ ├── UserProfile
│ │ │ │ ├── ConversationList (Virtual)
│ │ │ │ │ └── ConversationItem (x N)
│ │ │ │ ├── SearchBar
│ │ │ │ └── NewChatButton
│ │ │ │
│ │ │ ├── ChatArea
│ │ │ │ ├── ChatHeader
│ │ │ │ │ ├── ParticipantInfo
│ │ │ │ │ └── ChatActions
│ │ │ │ │
│ │ │ │ ├── MessageList (Virtual Scroll)
│ │ │ │ │ ├── DateSeparator
│ │ │ │ │ ├── MessageGroup
│ │ │ │ │ │ └── Message (Compound)
│ │ │ │ │ │ ├── Avatar
│ │ │ │ │ │ ├── MessageBubble
│ │ │ │ │ │ │ ├── TextContent
│ │ │ │ │ │ │ ├── MediaContent
│ │ │ │ │ │ │ └── Reactions
│ │ │ │ │ │ └── MessageStatus
│ │ │ │ │ │
│ │ │ │ │ └── TypingIndicator
│ │ │ │ │
│ │ │ │ ├── MessageInput
│ │ │ │ │ ├── TextEditor
│ │ │ │ │ ├── AttachmentButton
│ │ │ │ │ ├── EmojiPicker
│ │ │ │ │ └── SendButton
│ │ │ │ │
│ │ │ │ └── ReplyPreview
│ │ │ │
│ │ │ └── RightPanel (Conditional)
│ │ │ ├── ConversationInfo
│ │ │ ├── MediaGallery
│ │ │ └── MemberList
│ │ │
│ │ └── Modals
│ │ ├── MediaViewer
│ │ ├── SettingsModal
│ │ └── CreateGroupModal
│ │
│ └── LoginPage
│
└── Providers
├── WebSocketProvider
├── AuthProvider
├── ThemeProvider
└── NotificationProvider

Data Flow Diagram
┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ User │ │ Component │ │ Zustand │
│ Action │─────────>│ (Smart) │─────────>│ Store │
└─────────────┘ └──────────────┘ └─────────────┘
│ │
│ │
▼ ▼
┌──────────────┐ ┌─────────────┐
│ API Layer │ │ Server │
│ (REST/WS) │<────────│ State │
└──────────────┘ │ (React Query)│
│ └─────────────┘
│ │
▼ │
┌──────────────────────┐ │
│ WebSocket │ │
│ Event Handler │ │
└──────────────────────┘ │
│ │
▼ │
┌──────────────┐ │
│ Optimistic │ │
│ Update │ │
└──────────────┘ │
│ │
▼ ▼
┌──────────────────────────────────┐
│ Update UI │
│ (Re-render only affected) │
└──────────────────────────────────┘

Architecture Principles

1. Separation of Concerns
   WHY: Maintainability and testability. Each layer has a single responsibility.
   HOW: Clear boundaries between presentation, business logic, and data access.
2. Unidirectional Data Flow
   WHY: Predictable state changes, easier debugging.
   HOW: Actions → Store → Components (no direct state mutation).
3. Optimistic UI Updates
   WHY: Better UX, perceived performance.
   HOW: Update UI immediately, rollback on failure.
4. Lazy Loading & Code Splitting
   WHY: Fast initial load, on-demand resource loading.
   HOW: Route-based splitting, dynamic imports for heavy components.
5. Progressive Enhancement
   WHY: Works on all devices/networks.
   HOW: Core features work without JS, enhanced with it.
6. Offline-First Architecture
   WHY: Unreliable mobile networks, better UX.
   HOW: Service Workers, IndexedDB, request queuing.
   System Invariants
   RULES THAT MUST NEVER BE VIOLATED:
   Message Ordering: Messages MUST always be displayed in chronological order by timestamp.
   Idempotency: Sending the same message twice MUST NOT create duplicates (use client-generated UUIDs).
   State Consistency: A message can only have ONE status at a time (sent → delivered → read).
   Data Immutability: Never mutate state directly; always create new references.
   WebSocket Reconnection: MUST attempt reconnection with exponential backoff (max 30s).
   Token Refresh: MUST refresh auth token before expiry (5min buffer).
   Memory Bounds: Virtual scroll MUST be used for lists > 100 items.
   Error Boundaries: Every route MUST be wrapped in an error boundary.
   Accessibility: All interactive elements MUST be keyboard accessible.
   XSS Prevention: All user-generated content MUST be sanitized before render.

7. Component Architecture
   Component Breakdown
   ┌─────────────────────────────────────────────────────────────┐
   │ Component Layers │
   ├─────────────────────────────────────────────────────────────┤
   │ │
   │ Layer 1: Pages (Smart Components - Container Pattern) │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ ChatPage.tsx │ │
   │ │ - Manages conversation state │ │
   │ │ - Handles WebSocket events │ │
   │ │ - Orchestrates child components │ │
   │ │ - Implements useConversation() hook │ │
   │ └─────────────────────────────────────────────────────┘ │
   │ │
   │ Layer 2: Features (Smart - Business Logic) │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ ConversationList.tsx │ │
   │ │ ChatWindow.tsx │ │
   │ │ MessageInput.tsx │ │
   │ │ - Feature-specific logic │ │
   │ │ - Data fetching │ │
   │ │ - Event handling │ │
   │ └─────────────────────────────────────────────────────┘ │
   │ │
   │ Layer 3: Components (Presentational - Dumb) │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ Message.tsx, Avatar.tsx, Button.tsx │ │
   │ │ - Pure presentation │ │
   │ │ - Receive props only │ │
   │ │ - No business logic │ │
   │ │ - Highly reusable │ │
   │ └─────────────────────────────────────────────────────┘ │
   │ │
   │ Layer 4: UI Primitives (Atomic Design) │
   │ ┌─────────────────────────────────────────────────────┐ │
   │ │ Icon, Text, Box, Flex, Grid │ │
   │ │ - Base design system components │ │
   │ │ - No domain logic │ │
   │ └─────────────────────────────────────────────────────┘ │
   │ │
   └─────────────────────────────────────────────────────────────┘

Smart vs Dumb Components
Smart Components (Container):
// ChatWindowContainer.tsx
interface ChatWindowContainerProps {
conversationId: string;
}

export const ChatWindowContainer: React.FC<ChatWindowContainerProps> = ({
conversationId
}) => {
// State management - connected to stores
const messages = useConversationMessages(conversationId);
const { sendMessage, deleteMessage } = useMessageActions();
const { user } = useAuth();
const { isTyping, participants } = usePresence(conversationId);

// Business logic
const handleSend = useCallback(async (content: string) => {
const optimisticMessage = createOptimisticMessage(content, user);
await sendMessage(conversationId, optimisticMessage);
}, [conversationId, user, sendMessage]);

// Error handling
const handleError = useErrorHandler();

// Performance optimization
const virtualizerOptions = useMemo(() => ({
count: messages.length,
getScrollElement: () => scrollRef.current,
estimateSize: () => 100,
overscan: 5,
}), [messages.length]);

// Render presentational component
return (
<ChatWindowPresentation
      messages={messages}
      onSendMessage={handleSend}
      onDeleteMessage={deleteMessage}
      isTyping={isTyping}
      participants={participants}
      virtualizerOptions={virtualizerOptions}
      onError={handleError}
    />
);
};

Dumb Components (Presentational):
// ChatWindowPresentation.tsx
interface ChatWindowPresentationProps {
messages: Message[];
onSendMessage: (content: string) => void;
onDeleteMessage: (messageId: string) => void;
isTyping: boolean;
participants: Participant[];
virtualizerOptions: VirtualizerOptions;
onError: (error: Error) => void;
}

export const ChatWindowPresentation: React.FC<ChatWindowPresentationProps> = ({
messages,
onSendMessage,
onDeleteMessage,
isTyping,
participants,
virtualizerOptions,
}) => {
// Only UI logic, no business logic
const scrollRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer(virtualizerOptions);

return (

<div className="chat-window">
<ChatHeader participants={participants} />

      <MessageList
        ref={scrollRef}
        virtualizer={virtualizer}
        messages={messages}
        onDeleteMessage={onDeleteMessage}
      />

      {isTyping && <TypingIndicator />}

      <MessageInput onSend={onSendMessage} />
    </div>

);
};

Compound Components Pattern
// Message.tsx - Compound Component
interface MessageComposition {
Avatar: React.FC<AvatarProps>;
Bubble: React.FC<BubbleProps>;
Reactions: React.FC<ReactionsProps>;
Status: React.FC<StatusProps>;
Actions: React.FC<ActionsProps>;
}

export const Message: React.FC<MessageProps> & MessageComposition = ({
children,
message,
isMine,
}) => {
// Shared context for all sub-components
const context = useMemo(() => ({
message,
isMine,
onReact: () => {},
onDelete: () => {},
}), [message, isMine]);

return (
<MessageContext.Provider value={context}>

<div className={cn('message', { 'message--mine': isMine })}>
{children}
</div>
</MessageContext.Provider>
);
};

// Sub-components
Message.Avatar = ({ size = 'md' }) => {
const { message, isMine } = useMessageContext();
if (isMine) return null;
return <Avatar src={message.sender.avatar} size={size} />;
};

Message.Bubble = ({ children }) => {
const { message, isMine } = useMessageContext();
return (

<div className={cn('message-bubble', { 'bubble--mine': isMine })}>
{children || message.content}
</div>
);
};

Message.Reactions = () => {
const { message, onReact } = useMessageContext();
return <ReactionBar reactions={message.reactions} onReact={onReact} />;
};

Message.Status = () => {
const { message, isMine } = useMessageContext();
if (!isMine) return null;
return <StatusIndicator status={message.status} />;
};

// Usage
<Message message={msg} isMine={msg.senderId === currentUserId}>
<Message.Avatar />
<Message.Bubble />
<Message.Reactions />
<Message.Status />
</Message>

Component API Design
// Well-designed component props interface
interface MessageListProps {
// Required props
conversationId: string;
messages: Message[];

// Optional callbacks
onMessageClick?: (message: Message) => void;
onMessageLongPress?: (message: Message) => void;
onReachTop?: () => void; // Infinite scroll
onReachBottom?: () => void;

// Configuration
virtualized?: boolean;
groupByDate?: boolean;
showAvatar?: boolean | 'auto'; // auto = show only in groups

// Customization
renderMessage?: (message: Message) => React.ReactNode;
renderDateSeparator?: (date: Date) => React.ReactNode;
messageClassName?: string | ((message: Message) => string);

// Performance
overscan?: number;
estimatedMessageHeight?: number;

// Accessibility
ariaLabel?: string;

// Error handling
onError?: (error: Error) => void;
fallback?: React.ReactNode;
}

// Example with defaults
const MessageList: React.FC<MessageListProps> = ({
conversationId,
messages,
onMessageClick,
onMessageLongPress,
onReachTop,
onReachBottom,
virtualized = true,
groupByDate = true,
showAvatar = 'auto',
renderMessage,
renderDateSeparator,
messageClassName,
overscan = 5,
estimatedMessageHeight = 80,
ariaLabel = 'Message list',
onError,
fallback = <MessageListSkeleton />,
}) => {
// Implementation
};

Atomic Design Implementation
Atoms (Basic building blocks)
├── Button
├── Input
├── Icon
├── Avatar
├── Badge
└── Spinner

Molecules (Simple combinations)
├── SearchBar (Input + Icon)
├── UserCard (Avatar + Text)
├── MessageBubble (Text + Timestamp)
└── ReactionButton (Icon + Badge)

Organisms (Complex components)
├── MessageGroup (Avatar + MessageBubble[] + Reactions)
├── ConversationItem (Avatar + UserCard + Badge + Timestamp)
├── MessageInput (TextArea + AttachmentButton + EmojiPicker + SendButton)
└── ChatHeader (Avatar + UserCard + Actions)

Templates (Page layouts)
├── ChatLayout (Sidebar + ChatArea + RightPanel)
└── AuthLayout (Logo + Form + Footer)

Pages (Specific instances)
├── ChatPage
├── LoginPage
└── SettingsPage

4. State Management
   Global State Structure
   // Complete state shape
   interface AppState {
   // Authentication
   auth: {
   user: User | null;
   token: string | null;
   refreshToken: string | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   };

// Conversations
conversations: {
byId: Record<string, Conversation>;
allIds: string[];
activeConversationId: string | null;
unreadCounts: Record<string, number>;
lastFetched: number | null;
};

// Messages
messages: {
byConversationId: Record<string, {
byId: Record<string, Message>;
allIds: string[];
hasMore: boolean;
isLoading: boolean;
oldestMessageTimestamp: number | null;
}>;
optimisticMessages: Record<string, Message>; // Pending messages
failedMessages: Record<string, Message>; // Failed to send
};

// Presence
presence: {
onlineUsers: Set<string>;
typingUsers: Record<string, Set<string>>; // conversationId -> Set<userId>
lastSeen: Record<string, number>; // userId -> timestamp
};

// UI State
ui: {
sidebarCollapsed: boolean;
rightPanelVisible: boolean;
activeModal: string | null;
theme: 'light' | 'dark' | 'auto';
notifications: Notification[];
};

// Network
network: {
isOnline: boolean;
isConnected: boolean; // WebSocket
reconnectAttempts: number;
lastDisconnect: number | null;
};

// Offline Queue
offlineQueue: {
pendingMessages: QueuedMessage[];
pendingActions: QueuedAction[];
};

// Draft Messages
drafts: Record<string, string>; // conversationId -> draft text

// Media
media: {
uploading: Record<string, UploadProgress>;
cache: Record<string, Blob>; // mediaId -> Blob
};
}

State Management with Zustand
// store/chatStore.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ChatState {
conversations: Map<string, Conversation>;
activeConversationId: string | null;

// Actions
setActiveConversation: (id: string) => void;
addConversation: (conversation: Conversation) => void;
updateConversation: (id: string, updates: Partial<Conversation>) => void;
removeConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>()(
devtools(
persist(
immer((set, get) => ({
conversations: new Map(),
activeConversationId: null,

        setActiveConversation: (id) => set((state) => {
          state.activeConversationId = id;
        }),

        addConversation: (conversation) => set((state) => {
          state.conversations.set(conversation.id, conversation);
        }),

        updateConversation: (id, updates) => set((state) => {
          const conversation = state.conversations.get(id);
          if (conversation) {
            state.conversations.set(id, { ...conversation, ...updates });
          }
        }),

        removeConversation: (id) => set((state) => {
          state.conversations.delete(id);
          if (state.activeConversationId === id) {
            state.activeConversationId = null;
          }
        }),
      })),
      {
        name: 'chat-storage',
        partialize: (state) => ({
          // Only persist necessary data
          activeConversationId: state.activeConversationId,
        }),
      }
    ),
    { name: 'ChatStore' }

)
);

// Selectors with memoization
export const selectConversation = (id: string) => (state: ChatState) =>
state.conversations.get(id);

export const selectUnreadCount = (state: ChatState) =>
Array.from(state.conversations.values())
.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

Server State vs Client State
// Server State - Managed by React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetching messages (server state)
export const useMessages = (conversationId: string) => {
return useQuery({
queryKey: ['messages', conversationId],
queryFn: () => fetchMessages(conversationId),
staleTime: 30 _ 1000, // Consider fresh for 30s
cacheTime: 5 _ 60 \* 1000, // Keep in cache for 5min
refetchOnWindowFocus: true,
refetchOnReconnect: true,
// Optimistic updates
placeholderData: (previousData) => previousData,
});
};

// Sending message (mutation)
export const useSendMessage = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: (message: NewMessage) => sendMessage(message),

    // Optimistic update
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['messages', newMessage.conversationId]);

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', newMessage.conversationId]);

      // Optimistically update
      queryClient.setQueryData(['messages', newMessage.conversationId], (old: any) => ({
        ...old,
        messages: [...old.messages, { ...newMessage, status: 'sending' }],
      }));

      return { previousMessages };
    },

    // Rollback on error
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        context?.previousMessages
      );
    },

    // Refetch on success
    onSuccess: (data, newMessage) => {
      queryClient.invalidateQueries(['messages', newMessage.conversationId]);
    },

});
};

// Client State - Managed by Zustand
// UI state, temporary data, drafts
export const useUIStore = create<UIState>((set) => ({
sidebarOpen: true,
activeModal: null,
toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
openModal: (modal) => set({ activeModal: modal }),
closeModal: () => set({ activeModal: null }),
}));

Caching Strategy
// Advanced caching with SWR-like behavior
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
defaultOptions: {
queries: {
// Global defaults
staleTime: 1000 _ 60, // 1 minute
cacheTime: 1000 _ 60 _ 5, // 5 minutes
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 _ 2 \*\* attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst', // Try cache first

      // Refetch strategies
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false, // No polling by default
    },
    mutations: {
      retry: 1,
    },

},
});

// Conversation-specific caching
export const useConversationMessages = (conversationId: string) => {
return useQuery({
queryKey: ['messages', conversationId],
queryFn: async () => {
// Try IndexedDB first
const cached = await getCachedMessages(conversationId);
if (cached && Date.now() - cached.timestamp < 30000) {
// Return cached if < 30s old
return cached.data;
}

      // Fetch from server
      const fresh = await fetchMessages(conversationId);

      // Update cache
      await cacheMessages(conversationId, fresh);

      return fresh;
    },
    // Infinite scroll pagination
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor,

});
};

// Prefetching strategy
export const usePrefetchConversations = () => {
const queryClient = useQueryClient();

useEffect(() => {
// Prefetch likely conversations
const recentConversationIds = getRecentConversationIds(5);

    recentConversationIds.forEach((id) => {
      queryClient.prefetchQuery({
        queryKey: ['messages', id],
        queryFn: () => fetchMessages(id),
      });
    });

}, []);
};

Optimistic Updates Implementation
// Complete optimistic update flow
export const useOptimisticMessage = () => {
const queryClient = useQueryClient();
const { user } = useAuth();

const sendMessage = useMutation({
mutationFn: async (params: SendMessageParams) => {
const { conversationId, content, attachments } = params;

      // Upload attachments first if any
      const uploadedAttachments = attachments
        ? await uploadAttachments(attachments)
        : [];

      // Send message
      return api.sendMessage({
        conversationId,
        content,
        attachments: uploadedAttachments,
      });
    },

    onMutate: async (params) => {
      const { conversationId, content, attachments } = params;

      // Generate optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: user.id,
        content,
        attachments: attachments?.map(a => ({
          id: `temp-${a.name}`,
          name: a.name,
          type: a.type,
          url: URL.createObjectURL(a),
          uploading: true,
        })) || [],
        timestamp: Date.now(),
        status: 'sending',
        reactions: [],
      };

      // Cancel queries
      await queryClient.cancelQueries(['messages', conversationId]);

      // Get current data
      const previousData = queryClient.getQueryData<MessagesResponse>([
        'messages',
        conversationId,
      ]);

      // Optimistically update
      queryClient.setQueryData<MessagesResponse>(
        ['messages', conversationId],
        (old) => {
          if (!old) return { messages: [optimisticMessage] };
          return {
            ...old,
            messages: [...old.messages, optimisticMessage],
          };
        }
      );

      // Update conversation list (last message)
      queryClient.setQueryData<Conversation>(
        ['conversation', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            lastMessage: optimisticMessage,
            lastMessageAt: Date.now(),
          };
        }
      );

      return { previousData, optimisticMessage };
    },

    onError: (error, params, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['messages', params.conversationId],
          context.previousData
        );
      }

      // Mark message as failed
      queryClient.setQueryData<MessagesResponse>(
        ['messages', params.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === context?.optimisticMessage.id
                ? { ...msg, status: 'failed', error: error.message }
                : msg
            ),
          };
        }
      );

      toast.error('Failed to send message');
    },

    onSuccess: (response, params, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<MessagesResponse>(
        ['messages', params.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === context?.optimisticMessage.id
                ? response.message
                : msg
            ),
          };
        }
      );
    },

    onSettled: (data, error, params) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries(['messages', params.conversationId]);
      queryClient.invalidateQueries(['conversations']);
    },

});

return sendMessage;
};

State Persistence
// Selective persistence with IndexedDB
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatDB extends DBSchema {
messages: {
key: string;
value: Message;
indexes: { 'by-conversation': string; 'by-timestamp': number };
};
conversations: {
key: string;
value: Conversation;
};
drafts: {
key: string;
value: { content: string; timestamp: number };
};
offlineQueue: {
key: number;
value: QueuedAction;
indexes: { 'by-timestamp': number };
};
}

class ChatStorage {
private db: IDBPDatabase<ChatDB> | null = null;

async init() {
this.db = await openDB<ChatDB>('chat-db', 1, {
upgrade(db) {
// Messages store
const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
messageStore.createIndex('by-conversation', 'conversationId');
messageStore.createIndex('by-timestamp', 'timestamp');

        // Conversations store
        db.createObjectStore('conversations', { keyPath: 'id' });

        // Drafts store
        db.createObjectStore('drafts', { keyPath: 'conversationId' });

        // Offline queue
        const queueStore = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('by-timestamp', 'timestamp');
      },
    });

}

async saveMessages(conversationId: string, messages: Message[]) {
if (!this.db) await this.init();
const tx = this.db!.transaction('messages', 'readwrite');
await Promise.all(messages.map((msg) => tx.store.put(msg)));
await tx.done;
}

async getMessages(conversationId: string): Promise<Message[]> {
if (!this.db) await this.init();
return this.db!.getAllFromIndex(
'messages',
'by-conversation',
conversationId
);
}

async saveDraft(conversationId: string, content: string) {
if (!this.db) await this.init();
await this.db!.put('drafts', {
conversationId,
content,
timestamp: Date.now(),
});
}

async getDraft(conversationId: string): Promise<string | null> {
if (!this.db) await this.init();
const draft = await this.db!.get('drafts', conversationId);
return draft?.content || null;
}

async addToOfflineQueue(action: QueuedAction) {
if (!this.db) await this.init();
await this.db!.add('offlineQueue', { ...action, timestamp: Date.now() });
}

async getOfflineQueue(): Promise<QueuedAction[]> {
if (!this.db) await this.init();
return this.db!.getAllFromIndex('offlineQueue', 'by-timestamp');
}

async clearOfflineQueue(ids: number[]) {
if (!this.db) await this.init();
const tx = this.db!.transaction('offlineQueue', 'readwrite');
await Promise.all(ids.map((id) => tx.store.delete(id)));
await tx.done;
}
}

export const chatStorage = new ChatStorage();

5. Data Flow & API Communication
   REST API Design
   // api/client.ts
   import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
private client: AxiosInstance;
private refreshTokenPromise: Promise<string> | null = null;

constructor(baseURL: string) {
this.client = axios.create({
baseURL,
timeout: 10000,
headers: {
'Content-Type': 'application/json',
},
});

    this.setupInterceptors();

}

private setupInterceptors() {
// Request interceptor
this.client.interceptors.request.use(
async (config) => {
const token = await this.getValidToken();
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
},
(error) => Promise.reject(error)
);

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors
        if (!error.response) {
          this.handleNetworkError(error);
        }

        return Promise.reject(this.normalizeError(error));
      }
    );

}

private async getValidToken(): Promise<string | null> {
const token = localStorage.getItem('accessToken');
const expiresAt = localStorage.getItem('tokenExpiresAt');

    if (!token || !expiresAt) return null;

    // Refresh if token expires in < 5 minutes
    if (Date.now() + 5 * 60 * 1000 > parseInt(expiresAt)) {
      return this.refreshToken();
    }

    return token;

}

private async refreshToken(): Promise<string> {
// Prevent multiple simultaneous refresh requests
if (this.refreshTokenPromise) {
return this.refreshTokenPromise;
}

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${this.client.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, expiresIn } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('tokenExpiresAt', String(Date.now() + expiresIn * 1000));

        return accessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;

}

private handleAuthFailure() {
localStorage.clear();
window.location.href = '/login';
}

private handleNetworkError(error: any) {
// Queue request for retry when back online
if (navigator.onLine === false) {
eventBus.emit('network:offline', error.config);
}
}

private normalizeError(error: any): APIError {
if (error.response) {
return {
code: error.response.data?.code || 'UNKNOWN_ERROR',
message: error.response.data?.message || 'An error occurred',
status: error.response.status,
details: error.response.data?.details,
};
}

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error',
      status: 0,
    };

}

// API methods
async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
const response = await this.client.get<T>(url, config);
return response.data;
}

async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
const response = await this.client.post<T>(url, data, config);
return response.data;
}

async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
const response = await this.client.put<T>(url, data, config);
return response.data;
}

async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
const response = await this.client.delete<T>(url, config);
return response.data;
}

async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
const response = await this.client.patch<T>(url, data, config);
return response.data;
}
}

export const apiClient = new APIClient(process.env.REACT_APP_API_URL!);

WebSocket Communication
// websocket/WebSocketManager.ts
type EventHandler = (data: any) => void;

class WebSocketManager {
private ws: WebSocket | null = null;
private reconnectAttempts = 0;
private maxReconnectAttempts = 10;
private reconnectInterval = 1000;
private heartbeatInterval: NodeJS.Timeout | null = null;
private messageQueue: Array<{ event: string; data: any }> = [];
private eventHandlers: Map<string, Set<EventHandler>> = new Map();

connect(url: string, token: string) {
this.ws = new WebSocket(`${url}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
      this.emit('connection:open');
    };

    this.ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        this.handleMessage(type, data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('connection:error', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.stopHeartbeat();
      this.emit('connection:close');
      this.attemptReconnect(url, token);
    };

}

private handleMessage(type: string, data: any) {
// Built-in event handlers
switch (type) {
case 'pong':
// Heartbeat response
break;
case 'message:new':
this.emit('message:new', data);
break;
case 'message:update':
this.emit('message:update', data);
break;
case 'message:delete':
this.emit('message:delete', data);
break;
case 'typing:start':
this.emit('typing:start', data);
break;
case 'typing:stop':
this.emit('typing:stop', data);
break;
case 'presence:update':
this.emit('presence:update', data);
break;
default:
this.emit(type, data);
}
}

private attemptReconnect(url: string, token: string) {
if (this.reconnectAttempts >= this.maxReconnectAttempts) {
console.error('Max reconnect attempts reached');
this.emit('connection:failed');
return;
}

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30s
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(url, token);
    }, delay);

}

private startHeartbeat() {
this.heartbeatInterval = setInterval(() => {
this.send('ping', {});
}, 30000); // Every 30s
}

private stopHeartbeat() {
if (this.heartbeatInterval) {
clearInterval(this.heartbeatInterval);
this.heartbeatInterval = null;
}
}

send(event: string, data: any) {
if (this.ws?.readyState === WebSocket.OPEN) {
this.ws.send(JSON.stringify({ event, data }));
} else {
// Queue message if not connected
this.messageQueue.push({ event, data });
}
}

private flushMessageQueue() {
while (this.messageQueue.length > 0) {
const message = this.messageQueue.shift();
if (message) {
this.send(message.event, message.data);
}
}
}

on(event: string, handler: EventHandler) {
if (!this.eventHandlers.has(event)) {
this.eventHandlers.set(event, new Set());
}
this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };

}

private emit(event: string, data?: any) {
this.eventHandlers.get(event)?.forEach((handler) => {
try {
handler(data);
} catch (error) {
console.error(`Error in event handler for ${event}:`, error);
}
});
}

disconnect() {
this.stopHeartbeat();
this.ws?.close();
this.ws = null;
}

isConnected(): boolean {
return this.ws?.readyState === WebSocket.OPEN;
}
}

export const wsManager = new WebSocketManager();

// React hook for WebSocket
export const useWebSocket = () => {
const { token } = useAuth();

useEffect(() => {
if (token) {
wsManager.connect(WS_URL, token);
}

    return () => {
      wsManager.disconnect();
    };

}, [token]);

return wsManager;
};

// Hook for specific events
export const useWebSocketEvent = <T = any>(
event: string,
handler: (data: T) => void
) => {
useEffect(() => {
const unsubscribe = wsManager.on(event, handler);
return unsubscribe;
}, [event, handler]);
};

Retry Logic with Exponential Backoff
// utils/retry.ts
interface RetryOptions {
maxAttempts?: number;
initialDelay?: number;
maxDelay?: number;
backoffMultiplier?: number;
shouldRetry?: (error: any) => boolean;
onRetry?: (attempt: number, error: any) => void;
}

export async function retryWithBackoff<T>(
fn: () => Promise<T>,
options: RetryOptions = {}
): Promise<T> {
const {
maxAttempts = 3,
initialDelay = 1000,
maxDelay = 30000,
backoffMultiplier = 2,
shouldRetry = (error) => {
// Default: retry on network errors and 5xx
return (
!error.response ||
(error.response.status >= 500 && error.response.status < 600)
);
},
onRetry,
} = options;

let lastError: any;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
try {
return await fn();
} catch (error) {
lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      onRetry?.(attempt, error);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

}

throw lastError;
}

// Usage example
export const sendMessageWithRetry = async (message: Message) => {
return retryWithBackoff(
() => apiClient.post('/messages', message),
{
maxAttempts: 3,
shouldRetry: (error) => {
// Retry on network errors, not on validation errors
return error.code === 'NETWORK_ERROR' || error.status >= 500;
},
onRetry: (attempt, error) => {
console.log(`Retry attempt ${attempt} after error:`, error.message);
toast.info(`Retrying... (${attempt}/3)`);
},
}
);
};

6.  Performance Optimization
    Bundle Optimization
    // webpack.config.js / vite.config.ts
    export default {
    build: {
    rollupOptions: {
    output: {
    manualChunks: {
    // Vendor chunks
    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
    'vendor-state': ['zustand', '@tanstack/react-query'],
    'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    // Feature-based chunks
    'feature-chat': [
    './src/features/chat',
    './src/components/MessageList',
    './src/components/MessageInput',
    ],
    'feature-media': [
    './src/features/media',
    './src/components/MediaViewer',
    ],
    },
    },
    },

        // Code splitting threshold
        chunkSizeWarningLimit: 500,

        // Minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },

    },

// Tree shaking
optimizeDeps: {
include: ['react', 'react-dom'],
},
};

// Route-based lazy loading
import { lazy, Suspense } from 'react';

const ChatPage = lazy(() => import('./pages/ChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MediaViewer = lazy(() => import('./components/MediaViewer'));

function App() {
return (
<Suspense fallback={<LoadingScreen />}>
<Routes>
<Route path="/chat" element={<ChatPage />} />
<Route path="/settings" element={<SettingsPage />} />
</Routes>
</Suspense>
);
}

// Component-level lazy loading
const EmojiPicker = lazy(() => import('./components/EmojiPicker'));

function MessageInput() {
const [showEmojiPicker, setShowEmojiPicker] = useState(false);

return (

<div>
<button onClick={() => setShowEmojiPicker(true)}>😀</button>
{showEmojiPicker && (
<Suspense fallback={<div>Loading...</div>}>
<EmojiPicker />
</Suspense>
)}
</div>
);
}

Rendering Optimization
// Virtual scrolling for message list
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }: { messages: Message[] }) {
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
count: messages.length,
getScrollElement: () => parentRef.current,
estimateSize: () => 80, // Estimated message height
overscan: 5, // Render 5 extra items above/below viewport

    // Dynamic size measurement
    measureElement: (el) => el?.getBoundingClientRect().height,

});

// Scroll to bottom on new message
useEffect(() => {
if (messages.length > 0) {
virtualizer.scrollToIndex(messages.length - 1, {
align: 'end',
behavior: 'smooth',
});
}
}, [messages.length]);

return (

<div ref={parentRef} className="message-list" style={{ height: '100%', overflow: 'auto' }}>
<div
style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }} >
{virtualizer.getVirtualItems().map((virtualRow) => {
const message = messages[virtualRow.index];
return (
<div
key={virtualRow.key}
data-index={virtualRow.index}
ref={virtualizer.measureElement}
style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }} >
<Message message={message} />
</div>
);
})}
</div>
</div>
);
}

// Memoization strategies
import { memo, useMemo, useCallback } from 'react';

// Memo component with custom comparison
const Message = memo(
({ message, onDelete, onReact }: MessageProps) => {
// Component implementation
},
(prevProps, nextProps) => {
// Custom comparison logic
return (
prevProps.message.id === nextProps.message.id &&
prevProps.message.content === nextProps.message.content &&
prevProps.message.status === nextProps.message.status &&
prevProps.message.reactions.length === nextProps.message.reactions.length
);
}
);

// useMemo for expensive computations
function ConversationList({ conversations }: { conversations: Conversation[] }) {
const sortedConversations = useMemo(() => {
return conversations
.filter((c) => !c.archived)
.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}, [conversations]);

return <div>{/_ Render sorted conversations _/}</div>;
}

// useCallback for stable function references
function ChatWindow({ conversationId }: { conversationId: string }) {
const handleSendMessage = useCallback(
(content: string) => {
sendMessage(conversationId, content);
},
[conversationId] // Only recreate if conversationId changes
);

return <MessageInput onSend={handleSendMessage} />;
}

// React.memo with props comparison
const ConversationItem = memo(
({ conversation, isActive, onClick }: ConversationItemProps) => {
return (

<div
className={cn('conversation-item', { active: isActive })}
onClick={() => onClick(conversation.id)} >
{/_ ... _/}
</div>
);
},
// Only re-render if these specific props change
(prev, next) =>
prev.conversation.id === next.conversation.id &&
prev.conversation.lastMessageAt === next.conversation.lastMessageAt &&
prev.conversation.unreadCount === next.conversation.unreadCount &&
prev.isActive === next.isActive
);

Network Optimization
// Prefetching and caching
import { useQuery, useQueryClient } from '@tanstack/react-query';

function ConversationList({ conversations }: { conversations: Conversation[] }) {
const queryClient = useQueryClient();

// Prefetch messages on hover
const handleConversationHover = useCallback((conversationId: string) => {
queryClient.prefetchQuery({
queryKey: ['messages', conversationId],
queryFn: () => fetchMessages(conversationId),
staleTime: 30000, // Consider fresh for 30s
});
}, []);

return (

<div>
{conversations.map((conv) => (
<div
key={conv.id}
onMouseEnter={() => handleConversationHover(conv.id)} >
{conv.name}
</div>
))}
</div>
);
}

// Request deduplication
import { useMemo } from 'react';

const requestCache = new Map<string, Promise<any>>();

async function fetchWithDeduplication<T>(
key: string,
fetcher: () => Promise<T>
): Promise<T> {
// Return existing promise if request is in flight
if (requestCache.has(key)) {
return requestCache.get(key)!;
}

const promise = fetcher().finally(() => {
// Clean up after request completes
requestCache.delete(key);
});

requestCache.set(key, promise);
return promise;
}

// Compression
import pako from 'pako';

async function sendCompressedMessage(message: LargeMessage) {
const json = JSON.stringify(message);
const compressed = pako.deflate(json);

return apiClient.post('/messages', compressed, {
headers: {
'Content-Type': 'application/octet-stream',
'Content-Encoding': 'gzip',
},
});
}

Image Optimization
// Progressive image loading
import { useState, useEffect } from 'react';

function ProgressiveImage({ src, placeholder }: ImageProps) {
const [imgSrc, setImgSrc] = useState(placeholder);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
const img = new Image();
img.src = src;
img.onload = () => {
setImgSrc(src);
setIsLoading(false);
};
}, [src]);

return (

<div className="progressive-image">
<img
src={imgSrc}
alt=""
className={cn({ loading: isLoading, loaded: !isLoading })}
style={{
          filter: isLoading ? 'blur(10px)' : 'none',
          transition: 'filter 0.3s',
        }}
/>
</div>
);
}

// Lazy image loading with Intersection Observer
function LazyImage({ src, alt }: ImageProps) {
const imgRef = useRef<HTMLImageElement>(null);
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
const observer = new IntersectionObserver(
([entry]) => {
if (entry.isIntersecting) {
setIsVisible(true);
observer.disconnect();
}
},
{ rootMargin: '50px' } // Load 50px before entering viewport
);

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();

}, []);

return (
<img
ref={imgRef}
src={isVisible ? src : undefined}
alt={alt}
loading="lazy"
/>
);
}

// Image optimization with responsive sizes
function ResponsiveImage({ src, alt }: ImageProps) {
const srcSet = useMemo(() => {
const sizes = [320, 640, 960, 1280, 1920];
return sizes
.map((size) => `${src}?w=${size} ${size}w`)
.join(', ');
}, [src]);

return (
<img
      src={src}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
      alt={alt}
      loading="lazy"
      decoding="async"
    />
);
}

Core Web Vitals Optimization
// Measure and optimize LCP
import { useEffect } from 'react';

function useLCPMonitoring() {
useEffect(() => {
const observer = new PerformanceObserver((list) => {
const entries = list.getEntries();
const lastEntry = entries[entries.length - 1];

      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);

      // Send to analytics
      if (lastEntry.renderTime > 2500) {
        reportWebVitals('LCP', lastEntry.renderTime, 'warning');
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    return () => observer.disconnect();

}, []);
}

// Optimize FID with code splitting
function App() {
// Load heavy components only when needed
const [showHeavyFeature, setShowHeavyFeature] = useState(false);

return (

<div>
<button onClick={() => setShowHeavyFeature(true)}>
Load Feature
</button>

      {showHeavyFeature && (
        <Suspense fallback={<Spinner />}>
          <HeavyFeature />
        </Suspense>
      )}
    </div>

);
}

// Prevent CLS with skeleton screens
function MessageListSkeleton() {
return (

<div className="message-list-skeleton">
{Array.from({ length: 10 }).map((\_, i) => (
<div key={i} className="skeleton-message">
<div className="skeleton-avatar" />
<div className="skeleton-content">
<div className="skeleton-text" style={{ width: '60%' }} />
<div className="skeleton-text" style={{ width: '80%' }} />
</div>
</div>
))}
</div>
);
}

// Reserve space for dynamic content
function MessageBubble({ message }: { message: Message }) {
return (

<div
      className="message-bubble"
      style={{
        minHeight: message.attachments.length > 0 ? '200px' : 'auto',
}} >
{message.content}
{message.attachments.map((attachment) => (
<img
key={attachment.id}
src={attachment.url}
alt=""
width={attachment.width}
height={attachment.height} // Prevent CLS
/>
))}
</div>
);
}

Memory Leak Prevention
// Cleanup subscriptions
function useChatSubscription(conversationId: string) {
useEffect(() => {
const unsubscribe = wsManager.on('message:new', (message) => {
if (message.conversationId === conversationId) {
handleNewMessage(message);
}
});

    // IMPORTANT: Always cleanup
    return () => {
      unsubscribe();
    };

}, [conversationId]);
}

// Abort pending requests on unmount
function useMessages(conversationId: string) {
useEffect(() => {
const controller = new AbortController();

    fetchMessages(conversationId, { signal: controller.signal })
      .then((messages) => {
        // Handle messages
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      });

    return () => {
      controller.abort(); // Cancel request on unmount
    };

}, [conversationId]);
}

// Revoke object URLs
function useFilePreview(file: File) {
const [preview, setPreview] = useState<string>();

useEffect(() => {
const objectUrl = URL.createObjectURL(file);
setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl); // Prevent memory leak
    };

}, [file]);

return preview;
}

// Clear timers and intervals
function useTypingIndicator(conversationId: string) {
const timeoutRef = useRef<NodeJS.Timeout>();

const sendTypingIndicator = useCallback(() => {
wsManager.send('typing:start', { conversationId });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop typing after 3s of inactivity
    timeoutRef.current = setTimeout(() => {
      wsManager.send('typing:stop', { conversationId });
    }, 3000);

}, [conversationId]);

useEffect(() => {
return () => {
if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
};
}, []);

return sendTypingIndicator;
}

7. Error Handling & Edge Cases
   Error Boundary Implementation
   // ErrorBoundary.tsx
   import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
children: ReactNode;
fallback?: ReactNode;
onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
hasError: boolean;
error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
constructor(props: Props) {
super(props);
this.state = { hasError: false, error: null };
}

static getDerivedStateFromError(error: Error): State {
return { hasError: true, error };
}

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
console.error('ErrorBoundary caught:', error, errorInfo);

    // Log to error tracking service
    logErrorToService(error, {
      componentStack: errorInfo.componentStack,
      ...getErrorContext(),
    });

    this.props.onError?.(error, errorInfo);

}

render() {
if (this.state.hasError) {
return (
this.props.fallback || (

<div className="error-screen">
<h1>Something went wrong</h1>
<p>{this.state.error?.message}</p>
<button onClick={() => window.location.reload()}>
Reload Page
</button>
</div>
)
);
}

    return this.props.children;

}
}

// Usage with granular error boundaries
function App() {
return (
<ErrorBoundary fallback={<AppCrashScreen />}>
<Router>
<ErrorBoundary fallback={<ChatErrorScreen />}>
<ChatPage />
</ErrorBoundary>

        <ErrorBoundary fallback={<SettingsErrorScreen />}>
          <SettingsPage />
        </ErrorBoundary>
      </Router>
    </ErrorBoundary>

);
}

Graceful Degradation
// Feature detection and fallbacks
function MessageList({ messages }: MessageListProps) {
const supportsIntersectionObserver = 'IntersectionObserver' in window;
const supportsWebSocket = 'WebSocket' in window;

if (!supportsWebSocket) {
// Fallback to polling
return <MessageListWithPolling messages={messages} />;
}

if (!supportsIntersectionObserver) {
// Fallback to simple scrolling
return <SimpleMessageList messages={messages} />;
}

return <VirtualizedMessageList messages={messages} />;
}

// Progressive enhancement
function MediaUpload() {
const [dragSupported, setDragSupported] = useState(true);

useEffect(() => {
setDragSupported('draggable' in document.createElement('div'));
}, []);

return (

<div>
{dragSupported ? (
<DragDropUpload />
) : (
<FileInputUpload />
)}
</div>
);
}

// Network quality adaptation
function useAdaptiveQuality() {
const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

useEffect(() => {
if ('connection' in navigator) {
const connection = (navigator as any).connection;

      const updateQuality = () => {
        if (connection.effectiveType === '4g') {
          setQuality('high');
        } else if (connection.effectiveType === '3g') {
          setQuality('medium');
        } else {
          setQuality('low');
        }
      };

      updateQuality();
      connection.addEventListener('change', updateQuality);

      return () => {
        connection.removeEventListener('change', updateQuality);
      };
    }

}, []);

return quality;
}

Offline Support
// Service Worker registration
// sw.js
const CACHE_NAME = 'chat-app-v1';
const urlsToCache = [
'/',
'/static/js/main.js',
'/static/css/main.css',
'/offline.html',
];

self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
);
});

self.addEventListener('fetch', (event) => {
event.respondWith(
caches.match(event.request).then((response) => {
// Return cached version or fetch from network
return response || fetch(event.request).catch(() => {
// Return offline page for navigation requests
if (event.request.mode === 'navigate') {
return caches.match('/offline.html');
}
});
})
);
});

// Offline queue management
interface QueuedMessage {
id: string;
conversationId: string;
content: string;
timestamp: number;
retries: number;
}

class OfflineQueue {
private queue: QueuedMessage[] = [];
private processing = false;

async enqueue(message: Omit<QueuedMessage, 'id' | 'retries'>) {
const queuedMessage: QueuedMessage = {
...message,
id: crypto.randomUUID(),
retries: 0,
};

    this.queue.push(queuedMessage);
    await this.saveToStorage();

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

}

async processQueue() {
if (this.processing || !navigator.onLine) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue[0];

      try {
        await sendMessage(message);
        this.queue.shift(); // Remove on success
        await this.saveToStorage();
      } catch (error) {
        message.retries++;

        if (message.retries >= 3) {
          // Move to failed messages
          this.queue.shift();
          await this.saveFailedMessage(message);
        } else {
          // Retry later
          break;
        }
      }
    }

    this.processing = false;

}

private async saveToStorage() {
await chatStorage.saveOfflineQueue(this.queue);
}

private async saveFailedMessage(message: QueuedMessage) {
// Save to failed messages for user to retry manually
await chatStorage.saveFailedMessage(message);
}

async loadFromStorage() {
this.queue = await chatStorage.getOfflineQueue();
}
}

export const offlineQueue = new OfflineQueue();

// React hook for offline support
function useOfflineSupport() {
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
const handleOnline = () => {
setIsOnline(true);
offlineQueue.processQueue();
};

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };

}, []);

return { isOnline };
}

Race Condition Prevention
// Prevent race conditions with request cancellation
function useConversationMessages(conversationId: string) {
const [messages, setMessages] = useState<Message[]>([]);
const abortControllerRef = useRef<AbortController>();

useEffect(() => {
// Cancel previous request
abortControllerRef.current?.abort();

    // Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchMessages(conversationId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setMessages(data);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      });

    return () => {
      controller.abort();
    };

}, [conversationId]);

return messages;
}

// Debounce user input
import { useCallback, useRef } from 'react';

function useDebounce<T extends (...args: any[]) => any>(
callback: T,
delay: number
): T {
const timeoutRef = useRef<NodeJS.Timeout>();

return useCallback(
((...args) => {
if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]

);
}

// Usage: Search with debounce
function SearchBar() {
const debouncedSearch = useDebounce((query: string) => {
performSearch(query);
}, 300);

return (
<input
type="text"
onChange={(e) => debouncedSearch(e.target.value)}
placeholder="Search..."
/>
);
}

// Optimistic locking for concurrent updates
async function updateMessage(messageId: string, content: string, version: number) {
try {
const response = await apiClient.patch(`/messages/${messageId}`, {
content,
version, // Include version for optimistic locking
});

    return response.data;

} catch (error) {
if (error.code === 'VERSION_CONFLICT') {
// Handle conflict: fetch latest version and retry
const latestMessage = await fetchMessage(messageId);
toast.warning('Message was updated by another device. Please try again.');
return latestMessage;
}

    throw error;

}
}

8. Testing Strategy
   // Unit Testing with React Testing Library
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
it('sends message on submit', async () => {
const onSend = jest.fn();
render(<MessageInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Hello');
    });

});

it('disables send button when input is empty', () => {
render(<MessageInput onSend={jest.fn()} />);
const sendButton = screen.getByRole('button', { name: /send/i });
expect(sendButton).toBeDisabled();
});
});

// Integration Testing
import { renderWithProviders } from './test-utils';

describe('ChatWindow Integration', () => {
it('displays messages and allows sending new ones', async () => {
const { store } = renderWithProviders(<ChatWindow conversationId="123" />);

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    // Send new message
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Verify optimistic update
    expect(screen.getByText('New message')).toBeInTheDocument();

});
});

// E2E Testing with Playwright
import { test, expect } from '@playwright/test';

test('complete chat flow', async ({ page }) => {
await page.goto('http://localhost:3000/chat');

// Login
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'password');
await page.click('button[type="submit"]');

// Select conversation
await page.click('text=John Doe');

// Send message
await page.fill('textarea[placeholder="Type a message..."]', 'Hello John!');
await page.click('button:has-text("Send")');

// Verify message appears
await expect(page.locator('text=Hello John!')).toBeVisible();
});

// Performance Testing
import { measurePerformance } from './test-utils';

test('message list renders 1000 messages within performance budget', async () => {
const messages = generateMessages(1000);

const metrics = await measurePerformance(() => {
render(<MessageList messages={messages} />);
});

expect(metrics.renderTime).toBeLessThan(500); // < 500ms
expect(metrics.fps).toBeGreaterThan(55); // > 55 FPS
});

// Accessibility Testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('ChatWindow has no accessibility violations', async () => {
const { container } = render(<ChatWindow conversationId="123" />);
const results = await axe(container);
expect(results).toHaveNoViolations();
});

9. Security Considerations
   // XSS Prevention
   import DOMPurify from 'dompurify';

function SafeMessageContent({ content }: { content: string }) {
const sanitized = useMemo(() => {
return DOMPurify.sanitize(content, {
ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
ALLOWED_ATTR: ['href'],
});
}, [content]);

return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// CSRF Protection
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

apiClient.defaults.headers.common['X-CSRF-Token'] = csrfToken;

// Content Security Policy
// In HTML head:
// <meta http-equiv="Content-Security-Policy"
// content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">

// Secure Token Storage
class SecureStorage {
private static encrypt(data: string): string {
// Use Web Crypto API for encryption
// This is simplified; use proper encryption in production
return btoa(data);
}

private static decrypt(data: string): string {
return atob(data);
}

static setToken(key: string, value: string) {
const encrypted = this.encrypt(value);
sessionStorage.setItem(key, encrypted);
}

static getToken(key: string): string | null {
const encrypted = sessionStorage.getItem(key);
return encrypted ? this.decrypt(encrypted) : null;
}
}

// Input Sanitization
function sanitizeInput(input: string): string {
return input
.replace(/[<>]/g, '') // Remove < and >
.trim()
.slice(0, 5000); // Max length
}

10. Interview Cross-Questions
    Q1: How would you handle real-time message synchronization across multiple tabs?
    Answer: Use BroadcastChannel API for cross-tab communication:
    const channel = new BroadcastChannel('chat-sync');

// Tab 1: Send message
channel.postMessage({ type: 'NEW_MESSAGE', message });

// Tab 2: Receive message
channel.onmessage = (event) => {
if (event.data.type === 'NEW_MESSAGE') {
updateMessageList(event.data.message);
}
};

// Fallback: localStorage events for older browsers
window.addEventListener('storage', (e) => {
if (e.key === 'new-message') {
const message = JSON.parse(e.newValue);
updateMessageList(message);
}
});

Q2: How do you prevent memory leaks in a long-running chat application?
Answer: Multiple strategies:
Cleanup subscriptions: Always unsubscribe in useEffect cleanup
Virtual scrolling: Render only visible messages
Revoke object URLs: URL.revokeObjectURL() for file previews
Abort pending requests: Use AbortController
Limit cache size: Implement LRU cache with max size
WeakMap for component data: Auto garbage collection
Q3: Explain your strategy for optimistic UI updates and rollback on failure.
Answer: See implementation in State Management section. Key points:
Create temporary ID for optimistic message
Update UI immediately
Keep snapshot of previous state
On error: restore snapshot, mark message as failed
On success: replace temp ID with server ID
Always invalidate queries to ensure consistency
Q4: How would you implement infinite scroll with message pagination?
Answer:
function useInfiniteMessages(conversationId: string) {
return useInfiniteQuery({
queryKey: ['messages', conversationId],
queryFn: ({ pageParam = null }) =>
fetchMessages(conversationId, { cursor: pageParam }),
getNextPageParam: (lastPage) => lastPage.nextCursor,
getPreviousPageParam: (firstPage) => firstPage.prevCursor,
});
}

// Trigger load more when scrolling to top
const observerTarget = useRef<HTMLDivElement>(null);

useEffect(() => {
const observer = new IntersectionObserver(
([entry]) => {
if (entry.isIntersecting && hasPreviousPage) {
fetchPreviousPage();
}
},
{ threshold: 1.0 }
);

if (observerTarget.current) {
observer.observe(observerTarget.current);
}

return () => observer.disconnect();
}, [hasPreviousPage, fetchPreviousPage]);

Q5: How do you handle WebSocket reconnection with exponential backoff?
Answer: See WebSocketManager implementation in Data Flow section. Key: Math.min(interval \* 2^attempts, maxDelay)
Q6: Explain your bundle optimization strategy for a chat app.
Answer:
Route-based code splitting: Lazy load pages
Component-level splitting: Lazy load heavy components (emoji picker, media viewer)
Vendor chunking: Separate vendor code
Tree shaking: Remove unused exports
Dynamic imports: Load on-demand
Target budget: Initial bundle < 200KB gzipped
Q7: How would you implement typing indicators with debouncing?
Answer:
function useTypingIndicator(conversationId: string) {
const timeoutRef = useRef<NodeJS.Timeout>();
const isTypingRef = useRef(false);

const sendTyping = useCallback(() => {
if (!isTypingRef.current) {
wsManager.send('typing:start', { conversationId });
isTypingRef.current = true;
}

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      wsManager.send('typing:stop', { conversationId });
      isTypingRef.current = false;
    }, 3000);

}, [conversationId]);

return { sendTyping };
}

Q8: What's your approach to handling offline message queuing?
Answer: See Offline Support section. Use IndexedDB to persist queue, process on reconnection, retry with backoff, mark failed after 3 attempts.
Q9: How do you optimize rendering for 10,000+ messages?
Answer:
Virtual scrolling: Only render visible + overscan
Windowing: @tanstack/react-virtual
Memoization: React.memo with custom comparison
Message grouping: Group consecutive messages from same sender
Lazy image loading: Intersection Observer
Dynamic height: Measure actual heights for accuracy
Q10: Explain your state management architecture choice.
Answer:
Zustand: Global client state (UI, drafts) - lightweight, no boilerplate
React Query: Server state (messages, users) - caching, refetching
Context: Shared component state (theme, auth)
Why not Redux: Overhead for chat app, Zustand provides similar benefits with less code
Q11: How would you implement message search across all conversations?
Answer:
function useGlobalSearch(query: string) {
return useQuery({
queryKey: ['search', query],
queryFn: async () => {
// Search locally first (IndexedDB)
const localResults = await searchLocalMessages(query);

      // Then search server
      const serverResults = await apiClient.get('/search', {
        params: { q: query, limit: 50 }
      });

      // Merge and deduplicate
      return mergeResults(localResults, serverResults);
    },
    enabled: query.length >= 3, // Only search with 3+ chars
    staleTime: 30000,

});
}

Q12: How do you handle race conditions when switching conversations quickly?
Answer: Use AbortController to cancel previous requests, request IDs to ignore outdated responses, and React Query's automatic cancellation.
Q13: Explain your error handling strategy for failed message sends.
Answer:
Optimistic update: Show immediately as "sending"
Retry: 3 attempts with exponential backoff
Mark failed: Show error indicator, allow manual retry
Persist: Save to IndexedDB for retry after reload
User action: Show "Retry" button next to failed message
Q14: How would you implement read receipts efficiently?
Answer:
// Batch read receipts to reduce requests
const readReceiptBatcher = {
batch: new Set<string>(),
timeout: null as NodeJS.Timeout | null,

add(messageId: string) {
this.batch.add(messageId);

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, 1000); // Send every 1s
    }

},

flush() {
if (this.batch.size > 0) {
wsManager.send('messages:read', {
messageIds: Array.from(this.batch)
});
this.batch.clear();
}
this.timeout = null;
}
};

// Mark as read when visible
useEffect(() => {
const observer = new IntersectionObserver(
(entries) => {
entries.forEach((entry) => {
if (entry.isIntersecting) {
const messageId = entry.target.getAttribute('data-message-id');
if (messageId) {
readReceiptBatcher.add(messageId);
}
}
});
},
{ threshold: 0.5 }
);

messageElements.forEach(el => observer.observe(el));
return () => observer.disconnect();
}, [messages]);

Q15: How do you ensure accessibility in the chat interface?
Answer:
Keyboard navigation: Tab order, arrow keys for messages
Screen reader support: ARIA labels, live regions for new messages
Focus management: Return focus after modal close
**Color contrast
**: WCAG AA compliance
Skip links: Jump to message input
Semantic HTML: Proper heading hierarchy
Q16: What's your strategy for handling large file uploads?
Answer:
async function uploadLargeFile(file: File, conversationId: string) {
const CHUNK*SIZE = 5 * 1024 \_ 1024; // 5MB chunks
const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
const uploadId = crypto.randomUUID();

for (let i = 0; i < totalChunks; i++) {
const start = i \* CHUNK_SIZE;
const end = Math.min(start + CHUNK_SIZE, file.size);
const chunk = file.slice(start, end);

    await apiClient.post('/upload/chunk', {
      uploadId,
      chunkIndex: i,
      totalChunks,
      chunk: await chunk.arrayBuffer(),
    }, {
      onUploadProgress: (progress) => {
        const totalProgress = (i + progress.loaded / chunk.size) / totalChunks;
        updateUploadProgress(uploadId, totalProgress);
      }
    });

}

// Finalize upload
return apiClient.post('/upload/complete', {
uploadId,
conversationId,
filename: file.name,
});
}

Q17: How do you implement message reactions with optimistic updates?
Answer:
function useMessageReaction() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: ({ messageId, emoji }: ReactionParams) =>
apiClient.post(`/messages/${messageId}/reactions`, { emoji }),

    onMutate: async ({ messageId, emoji, conversationId }) => {
      await queryClient.cancelQueries(['messages', conversationId]);

      const previousData = queryClient.getQueryData(['messages', conversationId]);

      queryClient.setQueryData(['messages', conversationId], (old: any) => ({
        ...old,
        messages: old.messages.map((msg: Message) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: [
                  ...msg.reactions,
                  { emoji, userId: currentUserId, count: 1 }
                ]
              }
            : msg
        ),
      }));

      return { previousData };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['messages', variables.conversationId],
        context?.previousData
      );
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['messages', variables.conversationId]);
    },

});
}

Q18: Explain how you would implement message encryption on the frontend.
Answer:
// Use Web Crypto API for end-to-end encryption
async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
const encoder = new TextEncoder();
const data = encoder.encode(message);

const encrypted = await crypto.subtle.encrypt(
{
name: 'RSA-OAEP',
},
publicKey,
data
);

return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
const encrypted = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));

const decrypted = await crypto.subtle.decrypt(
{
name: 'RSA-OAEP',
},
privateKey,
encrypted
);

const decoder = new TextDecoder();
return decoder.decode(decrypted);
}

// Key management
async function generateKeyPair() {
return crypto.subtle.generateKey(
{
name: 'RSA-OAEP',
modulusLength: 2048,
publicExponent: new Uint8Array([1, 0, 1]),
hash: 'SHA-256',
},
true,
['encrypt', 'decrypt']
);
}

Q19: How would you implement a "jump to message" feature?
Answer:
function useJumpToMessage() {
const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>();

const jumpToMessage = useCallback(async (messageId: string, conversationId: string) => {
// 1. Check if message is already loaded
const messages = queryClient.getQueryData(['messages', conversationId]);
const messageIndex = messages?.findIndex(m => m.id === messageId);

    if (messageIndex !== -1) {
      // Message already loaded, scroll to it
      virtualizerRef.current?.scrollToIndex(messageIndex, {
        align: 'center',
        behavior: 'smooth',
      });

      // Highlight message
      highlightMessage(messageId);
    } else {
      // 2. Fetch messages around target
      const response = await apiClient.get(`/messages/${messageId}/context`, {
        params: { before: 20, after: 20 }
      });

      // 3. Update cache with context messages
      queryClient.setQueryData(['messages', conversationId], response.messages);

      // 4. Scroll to message
      const newIndex = response.messages.findIndex(m => m.id === messageId);
      virtualizerRef.current?.scrollToIndex(newIndex, {
        align: 'center',
        behavior: 'smooth',
      });

      highlightMessage(messageId);
    }

}, []);

return { jumpToMessage, virtualizerRef };
}

Q20: What's your approach to monitoring and debugging production issues?
Answer:
Error tracking: Sentry/Datadog for error reporting
Performance monitoring: Web Vitals, custom metrics
User session replay: LogRocket/FullStory
Feature flags: LaunchDarkly for gradual rollouts
Logging: Structured logging with context (userId, conversationId)
Debugging: Redux DevTools, React DevTools Profiler
A/B testing: Track feature adoption and performance impact

11. Summary & Architecture Rationale
    Key Architecture Decisions
1. Layered Architecture
   Why: Clear separation of concerns, easier testing, maintainability
   Trade-off: More boilerplate vs. organized codebase
   When to use: Medium to large applications with complex business logic
1. Zustand + React Query for State Management
   Why: Zustand for lightweight global state, React Query for server state with built-in caching
   Trade-off: Learning curve vs. powerful features (optimistic updates, automatic refetching)
   Alternative considered: Redux (too much boilerplate), MobX (less predictable)
1. Virtual Scrolling
   Why: Handle 10,000+ messages without performance degradation
   Trade-off: Complexity vs. performance for large lists
   When not to use: Small lists (< 100 items)
1. WebSocket with Fallback
   Why: Real-time updates are critical for chat
   Trade-off: Connection management complexity vs. real-time UX
   Fallback: Long polling for browsers without WebSocket support
1. Optimistic Updates
   Why: Better perceived performance, instant feedback
   Trade-off: Rollback complexity vs. UX improvement
   When not to use: Critical operations where accuracy > speed
1. Offline-First Architecture
   Why: Mobile users often have unstable connections
   Trade-off: Sync complexity vs. reliability
   Implementation: Service Workers + IndexedDB + request queue
   Scaling Considerations
   Frontend Scaling (Users):
   1K - 10K users: Current architecture works well
   10K - 100K users: Add CDN for static assets, optimize bundle size
   100K - 1M users: Implement micro-frontends, edge caching
   1M+ users: Regional deployments, advanced caching strategies
   Performance Scaling (Messages):
   < 1K messages: No optimization needed
   1K - 10K messages: Virtual scrolling required
   10K - 100K messages: Pagination + virtual scrolling
   100K+ messages: Server-side search, advanced indexing
   Network Scaling:
   Monitor: WebSocket connection pool size
   Optimize: Message batching, compression
   Fallback: Graceful degradation to polling
   Future Improvements
   Voice/Video Calling: WebRTC integration
   Message Threading: Nested conversation support
   Rich Text Editor: Better formatting options
   AI Features: Smart replies, message summarization
   Analytics: User behavior tracking, feature usage
   Internationalization: Multi-language support
   Themes: Custom color schemes
   Plugins: Extensibility for custom features
   Interview-Grade Explanation
   When asked "Why this architecture?", answer:
   "I chose a layered architecture with clear separation between presentation, business logic, and data access to ensure maintainability and testability. For state management, I used Zustand for client state due to its simplicity and React Query for server state because it handles caching, refetching, and optimistic updates out of the box.
   The chat application is real-time heavy, so WebSocket is essential, but I also built in reconnection logic with exponential backoff and offline support using Service Workers and IndexedDB to handle unreliable mobile networks.
   Performance was a key concern with potentially thousands of messages, so I implemented virtual scrolling to only render visible messages, keeping the DOM small and maintaining 60 FPS even with 10,000+ messages.
   All critical user actions use optimistic updates to provide instant feedback, with proper rollback mechanisms if the server request fails. This creates a responsive UX even on slow networks.
   The architecture is designed to scale both horizontally (more users) and vertically (more features) with clear boundaries between modules, making it easy to add new capabilities or optimize specific parts without affecting the whole system."

Total Lines: ~2,400 lines
Completeness: All 11 sections covered with detailed implementations, diagrams, code examples, and interview questions.
