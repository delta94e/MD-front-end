# Facebook News Feed Design

## You

thiết kế News Feed (e.g. Facebook)

## You

Continue

## Claude


# Cuộc Phỏng Vấn Front-end System Design: Thiết Kế News Feed (Facebook-style)


## Phần 1: Mở Đầu Cuộc Phỏng Vấn


---


**[14:00 - Phòng phỏng vấn Meta, Menlo Park]**


**Người phỏng vấn:** Xin chào! Tôi là Minh, Senior Staff Engineer tại Meta, đã làm việc 8 năm trong team Infrastructure và Frontend Platform. Hôm nay tôi sẽ phỏng vấn bạn về Front-end System Design. Bạn có thể tự giới thiệu được không?


**Ứng viên:** Chào anh Minh! Em là Nam, hiện đang làm Senior Frontend Engineer tại một startup fintech. Em có 5 năm kinh nghiệm phát triển ứng dụng web với React và JavaScript. Trước đây em đã làm việc với các hệ thống có millions users và đã trải qua việc scale từ monolithic sang micro-frontend architecture. Em rất hào hứng được thảo luận về system design hôm nay.


**Người phỏng vấn:** Tuyệt vời! Để em hiểu rõ format của cuộc phỏng vấn nhé. Hôm nay chúng ta sẽ focus vào Front-end System Design trong 60 phút. Tôi sẽ đưa ra một bài toán thực tế, và chúng ta sẽ cùng nhau thiết kế solution từ đầu.


Tôi sẽ đánh giá bạn dựa trên 6 tiêu chí chính:


1. **Problem Exploration** - Khả năng hiểu vấn đề và khám phá requirements
2. **Architecture Design** - Thiết kế kiến trúc tổng thể và component breakdown
3. **Technical Proficiency** - Kiến thức sâu về frontend fundamentals và React
4. **Exploration and Tradeoffs** - Đưa ra nhiều solutions và analyze pros/cons
5. **Product and UX Sense** - Cân nhắc user experience và practical considerations
6. **Communication** - Giao tiếp rõ ràng và collaboration tốt


Chúng ta sẽ sử dụng **RADIO framework** để structure cuộc thảo luận:


- **R**equirements exploration
- **A**rchitecture / High-level design
- **D**ata model
- **I**nterface definition
- **O**ptimizations and deep dive


**Ứng viên:** Em hiểu rồi ạ. RADIO framework nghe có vẻ rất structured. Em đã từng apply approach tương tự khi design systems tại công ty hiện tại.


**Người phỏng vấn:** Perfect! Trước khi bắt đầu bài toán chính, tôi muốn hiểu thêm về background của bạn. Bạn có kinh nghiệm gì với việc xây dựng systems có large datasets và complex UI interactions không?


**Ứng viên:** Có ạ. Tại công ty hiện tại, em đã build một dashboard analytics hiển thị real-time financial data cho hàng nghìn users đồng thời. Challenge lớn nhất là optimize rendering performance khi có thousands of data points update liên tục, plus việc manage complex state synchronization giữa multiple widgets.


Em đã sử dụng React với Context API cho global state, implement virtual scrolling cho large lists, và sử dụng WebSocket cho real-time updates. Một lesson quan trọng em học được là importance của data normalization và selective re-rendering.


**Người phỏng vấn:** Excellent! Kinh nghiệm đó sẽ rất hữu ích cho bài toán hôm nay. Tôi thấy bạn đã mention virtual scrolling và state management - đây chính là những concerns quan trọng khi làm việc với large-scale frontend systems.


Một điều nữa trước khi start: trong industry, chúng ta thường phải balance giữa perfectionism và pragmatism. Hôm nay tôi muốn thấy bạn có thể make informed decisions về khi nào nên đi deep technical, khi nào nên focus vào business impact.


**Ứng viên:** Em hiểu ạ. Thực tế trong team em, chúng em luôn phải consider ROI của mỗi technical decision. Sometimes việc implement simple solution trước, rồi iterate based on actual user behavior lại effective hơn là over-engineer từ đầu.


**Người phỏng vấn:** Mindset rất đúng! Okay, bây giờ chúng ta sẽ dive vào bài toán chính.


---


## Phần 2: Bài Toán Chính - Thiết Kế News Feed


**[14:08 - Bắt đầu bài toán chính]**


**Người phỏng vấn:** Bài toán hôm nay là: **"Thiết kế một News Feed application giống như Facebook, nơi users có thể xem posts từ friends, interact với posts, và tạo posts mới."**


Đây là một classic system design question, nhưng tôi muốn focus specifically vào frontend aspects. Bạn có thể start bằng cách explore requirements được không?


**Ứng viên:** Được ạ! Đây là một domain em khá familiar. Để tôi bắt đầu với việc hiểu rõ scope và requirements.


---


### [RADIO Phase: Requirements Exploration - 15%]


**[14:09 - Requirements Exploration bắt đầu]**


**Ứng viên:** Trước tiên, em muốn clarify một số điểm về functional requirements:


**Core features mà chúng ta cần support:**


1. Browsing news feed - users có thể scroll và xem posts từ friends
2. Post interactions - like, react, comment, share
3. Creating new posts - text, images, có thể cả video
4. Social features - friend connections, notifications


Anh có thể confirm đây có phải là core scope không ạ?


**Người phỏng vấn:** Great start! Tôi thích cách bạn immediately identify core features thay vì jump vào implementation details. Đúng rồi, đây chính là core scope. Bạn có thể dig deeper vào requirements không?


**Ứng viên:** Vâng ạ. Em muốn hỏi thêm về:


**Loại content nào chúng ta cần support?**


- Primarily text và image posts?
- Video content có phải priority không?
- Rich media như links preview, GIFs?


**Pagination approach:**


- Infinite scrolling như Facebook?
- Hay traditional pagination?


**Device support:**


- Mobile-first design?
- Desktop experience có quan trọng không?


**Performance requirements:**


- Expected số lượng concurrent users?
- Response time expectations?
- Offline capabilities có cần không?


**Người phỏng vấn:** Excellent questions! Đây chính xác là loại exploration tôi muốn thấy. Let me provide context:


- **Content types**: Primarily text và images. Video có thể discuss later as advanced feature
- **Pagination**: Infinite scrolling - users expect seamless browsing experience
- **Devices**: Mobile experience quan trọng, nhưng desktop vẫn cần good UX
- **Scale**: Assume millions of users, hundreds of posts in typical user's feed
- **Performance**: Sub-2-second initial load, smooth scrolling
- **Offline**: Nice to have, nhưng không phải requirement chính


**Ứng viên:** Cảm ơn anh! Based on context này, em muốn clarify thêm một số non-functional requirements:


**Real-time features:**


- Live updates khi có new posts?
- Real-time reactions/comments?
- Hay users refresh manually?


**Personalization:**


- Feed algorithm có phức tạp không?
- Hay simple chronological ordering?


**Security & Privacy:**


- Authentication requirements?
- Privacy controls cho posts?


**Người phỏng vấn:** Good follow-up questions! Những concerns này show bạn thinking holistically về system:


- **Real-time**: Basic live updates cho reactions/comments. New posts có thể poll hoặc manual refresh
- **Algorithm**: Simple chronological với basic relevance scoring. Không cần ML complexity
- **Security**: Standard authentication, basic privacy controls


Bây giờ bạn có sufficient requirements để move sang architecture không?


**Ứng viên:** Vâng, em think so. Để em summarize requirements trước khi move forward:


**Functional Requirements:**


- Browse news feed với infinite scrolling
- Like/react to posts với real-time updates
- Comment on posts với basic real-time
- Create text/image posts
- Basic friend connections


**Non-functional Requirements:**


- Sub-2s initial load time
- Smooth scrolling performance
- Millions of users scale
- Responsive design (mobile + desktop)
- Basic real-time updates for interactions


**Out of scope for now:**


- Video content
- Complex recommendation algorithms
- Advanced privacy controls
- Offline functionality


**Người phỏng vấn:** Perfect summary! Tôi thật sự impressed với systematic approach của bạn trong requirements exploration. Bạn đã demonstrate clear problem-solving methodology và không make assumptions.


Signal tích cực ở đây là bạn:


- Ask clarifying questions thay vì immediately jump to solutions
- Think về both functional và non-functional requirements
- Consider scale và performance implications
- Identify what's in/out of scope


Bây giờ chúng ta move sang architecture design!


---


### [RADIO Phase: Architecture / High-level Design - 20%]


**[14:16 - Architecture Design bắt đầu]**


**Người phỏng vấn:** Okay, bây giờ hãy design high-level architecture. Bạn có thể start bằng cách identify main components của system không?


**Ứng viên:** Được ạ! Dựa trên requirements, em sẽ break down system thành các layers chính:


**1. Server Layer:**


- HTTP APIs cho feed data, post operations, user management
- WebSocket connections cho real-time features
- Authentication service


**2. Controller Layer (Frontend):**


- Data fetching và caching logic
- State management và synchronization
- Business logic coordination


**3. Client Store:**


- Centralized state management
- Cache cho feed data và user information
- Real-time state synchronization


**4. UI Layer:**


- Feed UI component - container cho post list
- Post components - individual post rendering
- Post composer - create new posts
- Interaction components - like/comment UI


**Người phỏng vấn:** Good component identification! Tôi thích cách bạn separate concerns clearly. Bạn có thể elaborate về data flow giữa các components này không?


**Ứng viên:** Chắc chắn! Để em describe data flow:


**Feed Loading Flow:**


```
User scrolls → Feed UI → Controller → Server API → Parse response → Update Client Store → Re-render Feed UI with new posts
```


**Post Interaction Flow:**


```
User clicks like → Post Component → Controller → Optimistic update Store → Server API → Confirm/revert based on response
```


**New Post Creation:**


```
User submits → Post Composer → Controller → Server API → Success: prepend to feed in Store → Re-render Feed UI
```


**Real-time Updates:**


```
WebSocket receives update → Controller → Update relevant post in Store → Selective re-render affected components
```


**Người phỏng vấn:** Excellent data flow description! Tôi đặc biệt appreciate việc bạn mention optimistic updates - đây là important pattern cho good UX.


Bạn có consider rendering approach không? Server-side vs client-side rendering?


**Ứng viên:** Đây là trade-off quan trọng! Em think News Feed application nằm ở sweet spot giữa static và interactive content:


**Hybrid Approach sẽ optimal:**


**Server-Side Rendering (SSR) cho:**


- Initial page load với skeleton posts
- SEO optimization cho public content
- Fast first paint cho better perceived performance


**Client-Side Rendering (CSR) cho:**


- Subsequent posts khi user scroll
- Interactive features (like, comment, real-time updates)
- Dynamic content based on user actions


**Implementation với React:**


- Next.js hoặc similar framework cho SSR support
- React 18 với Suspense cho progressive loading
- Hydration cho attach event listeners sau SSR


**Người phỏng vấn:** Great analysis! Bạn đã correctly identify rằng News Feed có characteristics của both static và dynamic content. Hybrid approach là exactly what Facebook thực tế sử dụng.


Bây giờ talk về component hierarchy. Làm sao bạn structure React components?


**Ứng viên:** Good question! Em sẽ design component hierarchy theo separation of concerns:


```jsx
// Top level
<App>
  <Header> // Navigation, notifications
  <NewsFeedPage>
    <PostComposer />
    <FeedContainer>
      <InfiniteScrollContainer>
        <PostList>
          <PostItem key={post.id}>
            <PostHeader />
            <PostContent />
            <PostActions /> // Like, comment, share
            <CommentsSection />
          </PostItem>
        </PostList>
        <LoadingSpinner />
      </InfiniteScrollContainer>
    </FeedContainer>
  </NewsFeedPage>
</App>
```


**Component Responsibilities:**


**Container Components (Smart):**


- `NewsFeedPage`: Data fetching, overall state management
- `FeedContainer`: Feed-specific logic, infinite scroll handling
- `PostItem`: Individual post state và interactions


**Presentational Components (Dumb):**


- `PostHeader`: Display author info, timestamp
- `PostContent`: Render text, images based on post type
- `PostActions`: UI cho like/comment buttons
- `CommentsSection`: Display comments list


**Người phỏng vấn:** Solid component design! Tôi like the clear separation giữa container và presentational components. Đây là established React pattern.


Question về state management: với complexity của News Feed, bạn sẽ choose strategy nào?


**Ứng viên:** Great question! News Feed có complex state requirements, so em sẽ analyze options:


**State Categories:**


1. **Server state**: Posts data, user info, comments
2. **UI state**: Loading states, modal visibility, scroll position
3. **User input state**: Compose form, comment drafts
4. **Cache state**: Previously loaded posts, user profiles


**Recommended Strategy:**


**React Query (TanStack Query) cho Server State:**


- Built-in caching và background refetching
- Optimistic updates support
- Loading/error state management
- Perfect cho feed data fetching


**Zustand cho Global UI State:**


- Lightweight alternative to Redux
- Good TypeScript support
- Easy integration với React Query


**Local useState cho Component State:**


- Form inputs, temporary UI state
- Component-specific logic


```jsx
// Example integration
const useFeedData = () => {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => fetchFeedPosts(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

const useGlobalUI = () => {
  return useStore(state => ({
    isComposerOpen: state.isComposerOpen,
    toggleComposer: state.toggleComposer,
  }));
};
```


**Người phỏng vấn:** Excellent technology choices! React Query là indeed a great fit cho server state management trong News Feed context. Và combination với Zustand cho UI state shows good understanding của modern React ecosystem.


Tôi đặc biệt appreciate rằng bạn categorize state types trước khi choose solutions. Đây là senior-level thinking.


One more architecture question: Làm sao handle code organization khi application grows?


**Ứng viên:** Em sẽ structure code theo feature-based organization với shared utilities:


```
src/
├── components/          # Shared UI components
│   ├── ui/             # Basic UI elements (Button, Modal, etc.)
│   └── common/         # Reusable business components
├── features/           # Feature-based modules
│   ├── feed/
│   │   ├── components/ # Feed-specific components
│   │   ├── hooks/      # Custom hooks cho feed logic
│   │   ├── services/   # API calls, data processing
│   │   └── types/      # TypeScript definitions
│   ├── posts/
│   │   ├── components/ # Post creation, editing
│   │   ├── hooks/
│   │   └── services/
│   └── auth/
├── hooks/              # Shared custom hooks
├── services/           # Global API services
├── store/              # Global state management
├── utils/              # Utility functions
└── types/              # Shared TypeScript types
```


**Benefits:**


- **Scalability**: Easy to add new features
- **Maintainability**: Clear boundaries giữa concerns
- **Team collaboration**: Multiple developers có thể work on different features
- **Code reuse**: Shared components và utilities


**Người phỏng vấn:** Fantastic architecture overview! Bạn đã demonstrate strong architectural thinking với:


1. **Clear component hierarchy** với proper separation of concerns
2. **Smart state management strategy** using modern tools
3. **Scalable code organization** cho long-term maintainability
4. **Thoughtful technology choices** with justifications


Tôi thấy bạn có solid understanding của React ecosystem và best practices. Signal rất positive cho architectural design capabilities.


Ready để move sang data modeling?


---


### [RADIO Phase: Data Model - 10%]


**[14:25 - Data Model bắt đầu]**


**Người phỏng vấn:** Bây giờ hãy define data models cho News Feed. Bạn có thể start với identifying entities chính không?


**Ứng viên:** Được ạ! Based on requirements, em identify các entities chính:


**Server-originated Entities:**


**1. Feed Entity:**


```typescript
interface Feed {
  posts: Post[];
  pagination: {
    cursor: string;
    hasNextPage: boolean;
    totalCount: number;
  };
  lastFetchedAt: timestamp;
}
```


**2. Post Entity:**


```typescript
interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  mediaUrls?: string[];
  createdAt: timestamp;
  updatedAt: timestamp;
  reactions: {
    likes: number;
    loves: number;
    total: number;
  };
  commentsCount: number;
  sharesCount: number;
  privacy: 'public' | 'friends' | 'private';
}
```


**3. User Entity:**


```typescript
interface User {
  id: string;
  name: string;
  profilePictureUrl?: string;
  username: string;
  isVerified: boolean;
}
```


**4. Comment Entity:**


```typescript
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: timestamp;
  reactions: {
    likes: number;
  };
  replies?: Comment[];
  isEdited: boolean;
}
```


**Người phỏng vấn:** Good entity modeling! Tôi like việc bạn include pagination metadata và separate User entity để avoid duplication.


Bạn có consider client-side data không?


**Ứng viên:** Có ạ! Client-side sẽ có additional state:


**Client-only Entities:**


**1. UI State:**


```typescript
interface UIState {
  isComposerOpen: boolean;
  activeModal: 'share' | 'reactions' | null;
  scrollPosition: number;
  viewportPosts: string[]; // Post IDs currently visible
}
```


**2. Form State:**


```typescript
interface PostDraft {
  content: string;
  attachments: File[];
  privacy: 'public' | 'friends' | 'private';
  isSubmitting: boolean;
  errors: Record<string, string>;
}

interface CommentDraft {
  postId: string;
  content: string;
  parentCommentId?: string;
}
```


**3. Cache Metadata:**


```typescript
interface CacheState {
  posts: Record<string, Post>;
  users: Record<string, User>;
  comments: Record<string, Comment[]>; // Keyed by postId
  feed: {
    postIds: string[];
    cursor: string;
    hasNextPage: boolean;
  };
}
```


**Người phỏng vấn:** Excellent! Bạn đã correctly separate server data từ client-specific state. Question về data normalization: có benefits gì khi normalize posts và users separately?


**Ứng viên:** Great question! Normalization mang lại several benefits:


**1. Single Source of Truth:**


```typescript
// Normalized approach
const state = {
  entities: {
    posts: { '1': { id: '1', authorId: 'user_1', content: '...' } },
    users: { 'user_1': { id: 'user_1', name: 'John', avatar: '...' } }
  },
  feed: {
    postIds: ['1', '2', '3']
  }
};

// Vs. denormalized (có duplication)
const state = {
  feed: [
    { id: '1', content: '...', author: { id: 'user_1', name: 'John' } },
    { id: '2', content: '...', author: { id: 'user_1', name: 'John' } } // Duplicate!
  ]
};
```


**2. Efficient Updates:**


- Khi user update profile picture, chỉ cần update một place
- All posts by that user automatically reflect changes
- Reduce re-renders since components subscribe to specific slices


**3. Memory Efficiency:**


- No duplicate user objects
- Important khi có users with many posts


**Implementation với React Query:**


```typescript
const useNormalizedFeed = () => {
  const feedQuery = useQuery(['feed'], fetchFeed, {
    select: (data) => {
      // Normalize on the way in
      const entities = { posts: {}, users: {} };
      const postIds = [];

      data.posts.forEach(post => {
        entities.posts[post.id] = post;
        entities.users[post.author.id] = post.author;
        postIds.push(post.id);
      });

      return { entities, postIds };
    }
  });
};
```


**Người phỏng vấn:** Outstanding analysis! Normalization là advanced concept và bạn explain rất clearly với concrete examples.


Tuy nhiên, trong context của interview, có cases nào normalization might be overkill không?


**Ứng viên:** Absolutely! Normalization có trade-offs:


**Khi Normalization Overkill:**


1. **Simple applications** với limited data relationships
2. **Prototype phase** khi development speed quan trọng hơn optimization
3. **Read-heavy applications** với ít updates


**For News Feed specifically:**


- Có many duplicate users across posts
- Real-time updates cần efficient state changes
- Large datasets benefit from normalization


**Practical Decision:**


```typescript
// Start simple với React Query's built-in caching
const useFeed = () => useQuery(['feed'], fetchFeed);

// Migrate to normalization khi:
// - User experience degradation from duplicate data
// - Memory issues on mobile devices
// - Complex update patterns emerge
```


**Framework như Redux Toolkit có RTK Query giúp handle normalization automatically, so the complexity cost is reduced.**


**Người phỏng vấn:** Perfect answer! Bạn show pragmatic thinking - recognize khi nào apply advanced patterns và khi nào keep things simple. Đây là exactly the kind của judgment senior engineers cần.


Tôi cũng appreciate mention của RTK Query - shows awareness của evolving ecosystem.


Quick question về data validation: làm sao ensure data integrity từ server?


**Ứng viên:** Good point! Data validation rất crucial:


**TypeScript cho Compile-time Safety:**


```typescript
// Strict typing helps catch issues early
interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO timestamp
  reactions: PostReactions;
}
```


**Runtime Validation với Zod:**


```typescript
import { z } from 'zod';

const PostSchema = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  content: z.string(),
  createdAt: z.string().datetime(),
  reactions: z.object({
    likes: z.number().min(0),
    total: z.number().min(0),
  }),
});

const validatePost = (data: unknown): Post => {
  return PostSchema.parse(data); // Throws if invalid
};
```


**API Layer Validation:**


```typescript
const fetchFeed = async (): Promise<Feed> => {
  const response = await fetch('/api/feed');
  const data = await response.json();

  // Validate each post
  const validatedPosts = data.posts.map(validatePost);

  return {
    posts: validatedPosts,
    pagination: PaginationSchema.parse(data.pagination),
  };
};
```


**Benefits:**


- Catch API changes early
- Better error messages for debugging
- Type safety throughout application


**Người phỏng vấn:** Excellent! Runtime validation với Zod là modern best practice. Shows bạn thinking về production reliability, không chỉ happy path.


Data modeling section shows strong foundation in:


- Entity relationship design
- Client vs server state separation
- Normalization trade-offs analysis
- Data validation strategies


Ready cho Interface definition?


---


### [RADIO Phase: Interface Definition (API) - 15%]


**[14:30 - Interface Definition bắt đầu]**


**Người phỏng vấn:** Bây giờ hãy define interfaces - cả server APIs và React component interfaces. Bạn có thể start với HTTP APIs không?


**Ứng viên:** Được ạ! Em sẽ design RESTful APIs cho News Feed:


**1. Feed Fetching API:**


```typescript
// GET /api/feed
interface FeedRequest {
  cursor?: string;
  limit?: number; // Default 10, max 50
  userId?: string; // For specific user's feed
}

interface FeedResponse {
  data: {
    posts: Post[];
    pagination: {
      nextCursor: string | null;
      hasNextPage: boolean;
      totalCount: number;
    };
  };
  meta: {
    timestamp: string;
    version: string;
  };
}
```


**2. Post Creation API:**


```typescript
// POST /api/posts
interface CreatePostRequest {
  content: string;
  attachments?: {
    type: 'image' | 'video';
    url: string;
    alt?: string;
  }[];
  privacy: 'public' | 'friends' | 'private';
}

interface CreatePostResponse {
  data: Post;
  meta: {
    created: boolean;
    timestamp: string;
  };
}
```


**3. Post Interactions API:**


```typescript
// POST /api/posts/:postId/reactions
interface ReactionRequest {
  type: 'like' | 'love' | 'laugh' | 'angry';
  action: 'add' | 'remove';
}

interface ReactionResponse {
  data: {
    postId: string;
    reactions: PostReactions;
    userReaction?: string; // Current user's reaction
  };
}
```


**Người phỏng vấn:** Good API design! Tôi like việc bạn include pagination metadata và consistent response structure.


Về pagination approach: tại sao choose cursor-based thay vì offset-based?


**Ứng viên:** Excellent question! Cursor-based pagination tốt hơn cho News Feed:


**Cursor vs Offset Trade-offs:**


**Offset-based Issues:**


```typescript
// GET /api/feed?page=2&limit=10
// Problem: Nếu có new posts added, page 2 có thể show duplicate content
```


**Timeline Example:**


```
Initial state: [A, B, C, D, E, F, G, H, I, J]
User fetches page 1: [A, B, C, D, E]

New posts added: [K, L, M, A, B, C, D, E, F, G, H, I, J]
User fetches page 2: [A, B, C, D, E] // Duplicates!
```


**Cursor-based Solution:**


```typescript
// GET /api/feed?cursor=post_E_timestamp&limit=10
// Cursor points to specific position, không bị affect bởi new posts

interface CursorPagination {
  cursor: string; // Base64 encoded timestamp + post_id
  limit: number;
}

// Implementation
const encodeCursor = (post: Post) => {
  return btoa(`${post.createdAt}_${post.id}`);
};

const decodeCursor = (cursor: string) => {
  const [timestamp, postId] = atob(cursor).split('_');
  return { timestamp, postId };
};
```


**Benefits cho News Feed:**


- Consistent experience với real-time updates
- Better performance với large datasets
- No duplicate posts khi scrolling


**Người phỏng vấn:** Perfect explanation! Cursor pagination là exactly what Facebook uses. Bạn đã clearly articulate tại sao nó superior cho dynamic content.


Bây giờ talk về real-time APIs. Làm sao handle live updates?


**Ứng viên:** Good question! Em sẽ design hybrid approach cho real-time:


**WebSocket cho Real-time Updates:**


```typescript
interface WebSocketMessage {
  type: 'POST_REACTION' | 'NEW_COMMENT' | 'POST_UPDATE';
  data: any;
  timestamp: string;
  userId: string; // For user-specific updates
}

// Reaction update
interface ReactionUpdate {
  type: 'POST_REACTION';
  data: {
    postId: string;
    reactions: PostReactions;
    userReaction?: string;
  };
}

// New comment
interface CommentUpdate {
  type: 'NEW_COMMENT';
  data: {
    postId: string;
    comment: Comment;
    commentsCount: number;
  };
}
```


**Client WebSocket Handler:**


```typescript
const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/feed/live');

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'POST_REACTION':
          // Update specific post in cache
          queryClient.setQueryData(['post', message.data.postId], (old) => ({
            ...old,
            reactions: message.data.reactions,
          }));
          break;

        case 'NEW_COMMENT':
          // Invalidate comments query để refetch
          queryClient.invalidateQueries(['comments', message.data.postId]);
          break;
      }
    };

    return () => ws.close();
  }, [queryClient]);
};
```


**Fallback Strategy:**


```typescript
// Polling backup cho khi WebSocket fails
const usePollingFallback = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll visible posts để reduce server load
      const visiblePosts = getVisiblePostIds();
      visiblePosts.forEach(postId => {
        queryClient.invalidateQueries(['post', postId]);
      });
    }, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, []);
};
```


**Người phỏng vấn:** Great real-time design! Tôi especially like polling fallback và optimization để chỉ update visible posts. Shows production awareness.


Bây giờ về React component interfaces. How do you design component APIs?


**Ứng viên:** Component interface design rất crucial cho maintainability:


**1. PostItem Component:**


```typescript
interface PostItemProps {
  post: Post;
  onReaction: (postId: string, type: ReactionType) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  isOptimistic?: boolean; // For optimistic updates
  className?: string;

  // Render props cho flexibility
  renderActions?: (post: Post) => React.ReactNode;
  renderComments?: (comments: Comment[]) => React.ReactNode;
}

// Usage
<PostItem
  post={post}
  onReaction={handleReaction}
  onComment={handleComment}
  onShare={handleShare}
  renderActions={(post) => <CustomActions post={post} />}
/>
```


**2. Feed Container Component:**


```typescript
interface FeedContainerProps {
  userId?: string; // For user-specific feeds
  filters?: {
    type?: 'all' | 'friends' | 'pages';
    timeRange?: 'day' | 'week' | 'month';
  };
  onPostCreate?: (post: Post) => void;

  // Infinite scroll config
  loadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;

  // Customization
  itemsPerPage?: number;
  enableRealtime?: boolean;
}
```


**3. Post Composer Component:**


```typescript
interface PostComposerProps {
  onSubmit: (draft: PostDraft) => Promise<void>;
  onCancel?: () => void;
  initialDraft?: Partial<PostDraft>;

  // Feature flags
  enableMediaUpload?: boolean;
  enablePrivacySettings?: boolean;
  maxContentLength?: number;

  // UI customization
  placeholder?: string;
  submitButtonText?: string;
  className?: string;
}
```


**Custom Hooks APIs:**


```typescript
// Data fetching hook
interface UseFeedOptions {
  userId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

const useFeed = (options: UseFeedOptions) => {
  return useInfiniteQuery({
    queryKey: ['feed', options.userId],
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam, ...options }),
    enabled: options.enabled,
    refetchInterval: options.refetchInterval,
  });
};

// Post interactions hook
const usePostInteractions = (postId: string) => {
  const react = useMutation({
    mutationFn: (reaction: ReactionType) => reactToPost(postId, reaction),
    onMutate: async (reaction) => {
      // Optimistic update
      const previousData = queryClient.getQueryData(['post', postId]);
      queryClient.setQueryData(['post', postId], (old) => ({
        ...old,
        reactions: updateReactions(old.reactions, reaction),
      }));
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update
      queryClient.setQueryData(['post', postId], context.previousData);
    },
  });

  return { react: react.mutate, isReacting: react.isLoading };
};
```


**Người phỏng vấn:** Excellent component API design! Những điều tôi thật sự appreciate:


1. **Flexible props với render props** cho customization
2. **Clear separation giữa data và UI concerns**
3. **Built-in optimistic updates** trong hooks
4. **Feature flags** cho progressive enhancement
5. **Comprehensive error handling**


Đây là senior-level component design thinking.


Quick question về error boundaries: làm sao handle errors trong feed context?


**Ứng viên:** Great point! Error handling trong News Feed rất critical:


**Error Boundary Strategy:**


```typescript
interface FeedErrorBoundaryState {
  hasError: boolean;
  errorType: 'NETWORK' | 'PARSING' | 'COMPONENT' | 'UNKNOWN';
  errorDetails?: Error;
}

class FeedErrorBoundary extends Component<Props, FeedErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): FeedErrorBoundaryState {
    // Categorize error type
    if (error.message.includes('fetch')) {
      return { hasError: true, errorType: 'NETWORK', errorDetails: error };
    }
    if (error.message.includes('JSON')) {
      return { hasError: true, errorType: 'PARSING', errorDetails: error };
    }
    return { hasError: true, errorType: 'COMPONENT', errorDetails: error };
  }

  render() {
    if (this.state.hasError) {
      return <FeedErrorFallback
        errorType={this.state.errorType}
        onRetry={() => this.setState({ hasError: false })}
      />;
    }
    return this.props.children;
  }
}

// Granular error boundaries
<FeedErrorBoundary>
  <FeedContainer>
    <PostErrorBoundary> // Individual post errors
      <PostItem post={post} />
    </PostErrorBoundary>
  </FeedContainer>
</FeedErrorBoundary>
```


**Error UI Components:**


```typescript
const FeedErrorFallback = ({ errorType, onRetry }) => {
  const getErrorMessage = () => {
    switch (errorType) {
      case 'NETWORK':
        return 'Không thể tải feed. Kiểm tra kết nối mạng.';
      case 'PARSING':
        return 'Dữ liệu không hợp lệ. Chúng tôi đang khắc phục.';
      default:
        return 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
  };

  return (
    <div className="feed-error">
      <AlertIcon />
      <h3>{getErrorMessage()}</h3>
      <Button onClick={onRetry}>Thử lại</Button>
    </div>
  );
};
```


**Người phỏng vấn:** Perfect error handling strategy! Granular error boundaries với meaningful fallbacks. Shows production mindset.


Interface definition section demonstrates:


- Strong API design skills với cursor pagination
- Real-time architecture understanding
- Component API best practices
- Comprehensive error handling


Excellent work! Ready cho optimization deep dive?


---


### [RADIO Phase: Optimizations and Deep Dive - 40%]


**[14:40 - Optimizations bắt đầu]**


**Người phỏng vấn:** Bây giờ phần quan trọng nhất - optimizations! Đây là nơi chúng ta really dive deep. News Feed performance rất critical cho user experience. Bạn có thể identify performance bottlenecks và solutions không?


**Ứng viên:** Absolutely! News Feed có nhiều performance challenges unique. Em sẽ categorize thành major areas:


#### A. Rendering Performance Optimizations


**1. Virtual Scrolling Implementation:**


News Feed có thể có thousands of posts, render tất cả sẽ làm chậm browser:


```typescript
interface VirtualScrollProps {
  items: Post[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: Post, index: number) => React.ReactNode;
}

const VirtualScrollFeed: React.FC<VirtualScrollProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
};
```


**2. Optimized Post Component:**


```typescript
const PostItem = React.memo<PostItemProps>(({ post, onReaction, onComment }) => {
  // Expensive image processing
  const processedImages = useMemo(() => {
    return post.mediaUrls?.map(url => ({
      src: url,
      thumbnail: generateThumbnail(url),
      lazyLoad: true
    }));
  }, [post.mediaUrls]);

  // Debounced reaction handler
  const debouncedReaction = useMemo(
    () => debounce((type: ReactionType) => onReaction(post.id, type), 300),
    [post.id, onReaction]
  );

  return (
    <article role="article" aria-labelledby={`post-${post.id}`}>
      <PostHeader author={post.author} timestamp={post.createdAt} />
      <PostContent content={post.content} images={processedImages} />
      <PostActions
        reactions={post.reactions}
        onReaction={debouncedReaction}
      />
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để avoid unnecessary re-renders
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.reactions.total === nextProps.post.reactions.total &&
    prevProps.post.commentsCount === nextProps.post.commentsCount
  );
});
```


**Người phỏng vấn:** Excellent virtual scrolling implementation! Tôi like việc bạn handle edge cases và use proper memoization. Quick question: có alternative approaches không nếu post heights are dynamic?


**Ứng viên:** Great point! Dynamic heights phức tạp hơn nhiều:


**Dynamic Height Virtual Scrolling:**


```typescript
interface VariableHeightVirtualScrollProps {
  items: Post[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: Post, index: number) => React.ReactNode;
}

const VariableHeightVirtualScroll: React.FC<VariableHeightVirtualScrollProps> = ({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem
}) => {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver để track actual heights
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const updates = new Map(itemHeights);

      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-index') || '0');
        const height = entry.contentRect.height;
        updates.set(index, height);
      });

      setItemHeights(updates);
    });

    itemRefs.current.forEach((element, index) => {
      resizeObserver.observe(element);
    });

    return () => resizeObserver.disconnect();
  }, [items]);

  // Calculate positions based on actual heights
  const getItemTop = (index: number) => {
    let top = 0;
    for (let i = 0; i < index; i++) {
      top += itemHeights.get(i) || estimatedItemHeight;
    }
    return top;
  };

  // Find visible range với binary search
  const findVisibleRange = () => {
    let start = 0;
    let end = items.length - 1;

    // Binary search cho start index
    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      const midTop = getItemTop(mid);

      if (midTop < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIndex = Math.max(0, start - 1);

    // Find end index
    let endIndex = startIndex;
    let currentTop = getItemTop(startIndex);

    while (endIndex < items.length && currentTop < scrollTop + containerHeight) {
      const height = itemHeights.get(endIndex) || estimatedItemHeight;
      currentTop += height;
      endIndex++;
    }

    return { startIndex, endIndex: Math.min(endIndex + 1, items.length) };
  };

  const { startIndex, endIndex } = findVisibleRange();
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      {visibleItems.map((item, index) => {
        const actualIndex = startIndex + index;
        const top = getItemTop(actualIndex);

        return (
          <div
            key={item.id}
            data-index={actualIndex}
            ref={(el) => {
              if (el) itemRefs.current.set(actualIndex, el);
            }}
            style={{
              position: 'absolute',
              top,
              width: '100%'
            }}
          >
            {renderItem(item, actualIndex)}
          </div>
        );
      })}
    </div>
  );
};
```


**Alternative: Library Solutions:**


```typescript
// react-virtuoso cho production readiness
import { Virtuoso } from 'react-virtuoso';

const FeedVirtualizer = () => {
  const { data: feedData } = useFeed();

  return (
    <Virtuoso
      data={feedData.posts}
      itemContent={(index, post) => <PostItem key={post.id} post={post} />}
      endReached={() => fetchNextPage()}
      overscan={5} // Render 5 extra items each direction
      increaseViewportBy={200} // Preload content 200px ahead
    />
  );
};
```


**Người phỏng vấn:** Impressive! Dynamic height virtual scrolling là definitely advanced topic. Tôi appreciate tanto implementation detail và mention của production libraries like Virtuoso.


Tiếp theo performance area nào?


#### B. Image và Media Optimization


**Ứng viên:** Images usually là biggest performance bottleneck trong News Feed:


**1. Progressive Image Loading:**


```typescript
interface ProgressiveImageProps {
  src: string;
  alt: string;
  thumbnail?: string;
  className?: string;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  thumbnail,
  className
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(thumbnail || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer cho lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Start loading full image
          const img = new Image();
          img.onload = () => {
            setLoadedSrc(src);
            setIsLoaded(true);
          };
          img.onerror = () => {
            setIsError(true);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  if (isError) {
    return (
      <div className={`image-error ${className}`}>
        <ImageErrorIcon />
        <span>Unable to load image</span>
      </div>
    );
  }

  return (
    <div className={`progressive-image ${className}`}>
      <img
        ref={imgRef}
        src={loadedSrc || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}
        alt={alt}
        className={`progressive-image__img ${isLoaded ? 'loaded' : 'loading'}`}
        style={{
          filter: !isLoaded && loadedSrc ? 'blur(5px)' : 'none',
          transition: 'filter 0.3s ease'
        }}
      />
      {!isLoaded && (
        <div className="progressive-image__placeholder">
          <ImagePlaceholder />
        </div>
      )}
    </div>
  );
};
```


**2. Image Optimization Service Integration:**


```typescript
interface ImageOptimizerConfig {
  baseUrl: string;
  quality: number;
  format: 'webp' | 'avif' | 'auto';
}

class ImageOptimizer {
  private config: ImageOptimizerConfig;

  constructor(config: ImageOptimizerConfig) {
    this.config = config;
  }

  generateSrcSet(originalUrl: string, sizes: number[]): string {
    return sizes
      .map(size => {
        const optimizedUrl = this.getOptimizedUrl(originalUrl, {
          width: size,
          quality: this.config.quality,
          format: this.config.format
        });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }

  getOptimizedUrl(originalUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): string {
    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    return `${this.config.baseUrl}?url=${encodeURIComponent(originalUrl)}&${params}`;
  }

  getThumbnail(originalUrl: string): string {
    return this.getOptimizedUrl(originalUrl, {
      width: 50,
      height: 50,
      quality: 60,
      format: 'webp'
    });
  }
}

// Usage trong component
const OptimizedPostImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const imageOptimizer = useMemo(() => new ImageOptimizer({
    baseUrl: 'https://imagecdn.example.com/optimize',
    quality: 85,
    format: 'auto'
  }), []);

  const srcSet = imageOptimizer.generateSrcSet(src, [320, 640, 960, 1280]);
  const thumbnail = imageOptimizer.getThumbnail(src);

  return (
    <ProgressiveImage
      src={imageOptimizer.getOptimizedUrl(src, { width: 640, quality: 85 })}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      alt={alt}
      thumbnail={thumbnail}
    />
  );
};
```


**3. CDN và Caching Strategy:**


```typescript
// Service Worker cho image caching
class ImageCacheManager {
  private cacheName = 'feed-images-v1';
  private maxCacheSize = 100; // MB

  async cacheImage(url: string): Promise<boolean> {
    try {
      const cache = await caches.open(this.cacheName);
      const response = await fetch(url);

      if (response.ok) {
        await cache.put(url, response.clone());
        await this.cleanupCache();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return false;
    }
  }

  async getCachedImage(url: string): Promise<Response | null> {
    try {
      const cache = await caches.open(this.cacheName);
      return await cache.match(url);
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }

  private async cleanupCache(): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const requests = await cache.keys();

    if (requests.length > this.maxCacheSize) {
      const oldestRequests = requests.slice(0, requests.length - this.maxCacheSize);
      await Promise.all(oldestRequests.map(request => cache.delete(request)));
    }
  }
}

// React hook cho image caching
const useImageCache = () => {
  const cacheManager = useMemo(() => new ImageCacheManager(), []);

  const preloadImage = useCallback(async (url: string) => {
    const cached = await cacheManager.getCachedImage(url);
    if (!cached) {
      await cacheManager.cacheImage(url);
    }
  }, [cacheManager]);

  const preloadVisibleImages = useCallback(async (posts: Post[]) => {
    const imageUrls = posts
      .flatMap(post => post.mediaUrls || [])
      .slice(0, 10); // Limit preloading

    await Promise.all(imageUrls.map(preloadImage));
  }, [preloadImage]);

  return { preloadImage, preloadVisibleImages };
};
```


**Người phỏng vấn:** Outstanding image optimization strategy! Progressive loading, responsive images, caching - đây chính là production-level thinking.


Quick question: làm sao measure và monitor image performance?


**Ứng viên:** Measurement rất crucial cho optimization:


**Performance Monitoring:**


```typescript
// Image performance metrics
interface ImageMetrics {
  url: string;
  loadTime: number;
  renderTime: number;
  size: number;
  wasFromCache: boolean;
  viewport: { width: number; height: number };
}

class ImagePerformanceTracker {
  private metrics: ImageMetrics[] = [];

  trackImageLoad(url: string, startTime: number, wasFromCache: boolean): void {
    const loadTime = performance.now() - startTime;

    // Get image size
    const img = new Image();
    img.onload = () => {
      const metrics: ImageMetrics = {
        url,
        loadTime,
        renderTime: 0, // Will be set later
        size: this.estimateImageSize(img),
        wasFromCache,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      this.metrics.push(metrics);
      this.reportMetrics(metrics);
    };
    img.src = url;
  }

  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimation based on dimensions và quality
    return img.naturalWidth * img.naturalHeight * 3; // RGB bytes
  }

  private reportMetrics(metrics: ImageMetrics): void {
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'image_load_performance', {
        load_time: metrics.loadTime,
        image_size: metrics.size,
        from_cache: metrics.wasFromCache,
        viewport_width: metrics.viewport.width
      });
    }
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
    return total / this.metrics.length;
  }

  getCacheHitRatio(): number {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(m => m.wasFromCache).length;
    return cacheHits / this.metrics.length;
  }
}

// React integration
const useImagePerformanceTracking = () => {
  const tracker = useMemo(() => new ImagePerformanceTracker(), []);

  const trackImageRef = useCallback((url: string) => {
    return (element: HTMLImageElement | null) => {
      if (element) {
        const startTime = performance.now();
        const wasFromCache = element.complete;

        if (element.complete) {
          tracker.trackImageLoad(url, startTime, true);
        } else {
          element.addEventListener('load', () => {
            tracker.trackImageLoad(url, startTime, false);
          }, { once: true });
        }
      }
    };
  }, [tracker]);

  return { trackImageRef, tracker };
};
```


**Core Web Vitals Integration:**


```typescript
// Largest Contentful Paint tracking
const trackLCP = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    if (lastEntry.element?.tagName === 'IMG') {
      console.log('LCP Image:', {
        url: (lastEntry.element as HTMLImageElement).src,
        loadTime: lastEntry.loadTime,
        renderTime: lastEntry.renderTime
      });
    }
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });
};

// Cumulative Layout Shift tracking
const trackCLS = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        console.log('Layout shift:', {
          value: entry.value,
          sources: entry.sources?.map(source => ({
            element: source.node,
            previousRect: source.previousRect,
            currentRect: source.currentRect
          }))
        });
      }
    });
  });

  observer.observe({ entryTypes: ['layout-shift'] });
};
```


**Người phỏng vấn:** Excellent monitoring approach! Core Web Vitals tracking shows understanding của modern performance standards.


Tiếp theo optimization area?


#### C. Data Loading và Caching Optimizations


**Ứng viên:** Data loading strategy crucial cho News Feed performance:


**1. Intelligent Prefetching:**


```typescript
// Prefetch strategy based on user behavior
interface PrefetchConfig {
  triggerDistance: number; // Pixels before end của viewport
  batchSize: number;
  maxPrefetchItems: number;
}

class FeedPrefetchManager {
  private config: PrefetchConfig;
  private prefetchQueue: Set<string> = new Set();
  private lastScrollTime = 0;
  private scrollVelocity = 0;

  constructor(config: PrefetchConfig) {
    this.config = config;
  }

  calculateScrollVelocity(currentScrollTop: number): number {
    const now = performance.now();
    const timeDelta = now - this.lastScrollTime;
    const scrollDelta = currentScrollTop - (this.lastScrollY || 0);

    this.scrollVelocity = timeDelta > 0 ? scrollDelta / timeDelta : 0;
    this.lastScrollTime = now;
    this.lastScrollY = currentScrollTop;

    return this.scrollVelocity;
  }

  shouldPrefetch(scrollTop: number, containerHeight: number, contentHeight: number): boolean {
    const distanceToEnd = contentHeight - (scrollTop + containerHeight);
    const velocityMultiplier = Math.max(1, this.scrollVelocity * 0.1);
    const adjustedTriggerDistance = this.config.triggerDistance * velocityMultiplier;

    return distanceToEnd <= adjustedTriggerDistance;
  }

  async prefetchNextBatch(cursor: string | null): Promise<void> {
    if (!cursor || this.prefetchQueue.has(cursor)) return;

    this.prefetchQueue.add(cursor);

    try {
      // Prefetch với lower priority
      const prefetchData = await fetch(`/api/feed?cursor=${cursor}&limit=${this.config.batchSize}`, {
        priority: 'low'
      } as any);

      // Store in cache cho immediate access
      const response = await prefetchData.json();

      // Cache background cho React Query
      const queryClient = getQueryClient();
      queryClient.setQueryData(['feed', cursor], response);

    } catch (error) {
      console.warn('Prefetch failed:', error);
    } finally {
      this.prefetchQueue.delete(cursor);
    }
  }
}

// React hook implementation
const useFeedPrefetch = () => {
  const prefetchManager = useMemo(() => new FeedPrefetchManager({
    triggerDistance: 1000,
    batchSize: 5,
    maxPrefetchItems: 3
  }), []);

  const [scrollMetrics, setScrollMetrics] = useState({
    scrollTop: 0,
    containerHeight: 0,
    contentHeight: 0
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const metrics = {
      scrollTop: target.scrollTop,
      containerHeight: target.clientHeight,
      contentHeight: target.scrollHeight
    };

    setScrollMetrics(metrics);

    const velocity = prefetchManager.calculateScrollVelocity(metrics.scrollTop);

    if (prefetchManager.shouldPrefetch(
      metrics.scrollTop,
      metrics.containerHeight,
      metrics.contentHeight
    )) {
      // Get next cursor from current feed data
      const queryClient = getQueryClient();
      const feedData = queryClient.getQueryData(['feed']);
      const nextCursor = feedData?.pages?.at(-1)?.nextCursor;

      if (nextCursor) {
        prefetchManager.prefetchNextBatch(nextCursor);
      }
    }
  }, [prefetchManager]);

  return { handleScroll, scrollMetrics };
};
```


**2. Smart Caching Strategy:**


```typescript
// Multi-layer caching
interface CacheConfig {
  memoryLimit: number; // MB
  diskLimit: number; // MB
  ttl: number; // milliseconds
}

class FeedCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.setupPeriodicCleanup();
  }

  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      memoryEntry.lastAccessed = Date.now();
      return memoryEntry.data;
    }

    // Check IndexedDB cache
    const diskEntry = await this.getDiskCache(key);
    if (diskEntry && !this.isExpired(diskEntry)) {
      // Promote to memory cache
      this.memoryCache.set(key, diskEntry);
      return diskEntry.data;
    }

    return null;
  }

  async set(key: string, data: any, customTTL?: number): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ttl: customTTL || this.config.ttl,
      size: this.estimateSize(data)
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in IndexedDB cho persistence
    await this.setDiskCache(key, entry);

    // Cleanup if needed
    await this.cleanup();
  }

  private async getDiskCache(key: string): Promise<CacheEntry | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const result = await store.get(key);
      return result || null;
    } catch (error) {
      console.warn('Disk cache read failed:', error);
      return null;
    }
  }

  private async setDiskCache(key: string, entry: CacheEntry): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put({ key, ...entry });
    } catch (error) {
      console.warn('Disk cache write failed:', error);
    }
  }

  private async cleanup(): Promise<void> {
    // Memory cleanup
    const memorySize = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + entry.size, 0);

    if (memorySize > this.config.memoryLimit * 1024 * 1024) {
      await this.evictLeastRecentlyUsed('memory');
    }

    // Disk cleanup
    await this.evictLeastRecentlyUsed('disk');
  }

  private async evictLeastRecentlyUsed(cacheType: 'memory' | 'disk'): Promise<void> {
    if (cacheType === 'memory') {
      const entries = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);

      const toEvict = entries.slice(0, Math.floor(entries.length * 0.3));
      toEvict.forEach(([key]) => this.memoryCache.delete(key));
    } else {
      // Implement disk LRU eviction
      const db = await this.openDB();
      // Implementation details...
    }
  }

  private estimateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }
}

// React Query integration
const createFeedQueryClient = () => {
  const cacheManager = new FeedCacheManager({
    memoryLimit: 50, // 50MB
    diskLimit: 100, // 100MB
    ttl: 10 * 60 * 1000 // 10 minutes
  });

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error.status === 404) return false;
          return failureCount < 3;
        }
      }
    }
  });
};
```


**Người phỏng vấn:** Impressive caching architecture! Multi-layer caching với intelligent prefetching shows deep understanding của performance optimization.


Tôi đặc biệt thích scroll velocity-based prefetching - đây là advanced technique ít người think about.


Về network optimization thì sao?


#### D. Network Optimization


**Ứng viên:** Network là often biggest bottleneck. Em có several strategies:


**1. Request Batching và Deduplication:**


```typescript
// Request batcher để reduce network calls
class RequestBatcher {
  private batchQueue = new Map<string, BatchRequest>();
  private batchTimeout = 50; // ms

  interface BatchRequest {
    url: string;
    params: any[];
    resolvers: Array<(data: any) => void>;
    rejecters: Array<(error: Error) => void>;
    timeoutId: number;
  }

  async batchRequest<T>(
    url: string,
    param: any,
    keyExtractor: (param: any) => string
  ): Promise<T> {
    const key = keyExtractor(param);
    const batchKey = `${url}:${key}`;

    return new Promise<T>((resolve, reject) => {
      let batch = this.batchQueue.get(batchKey);

      if (!batch) {
        batch = {
          url,
          params: [],
          resolvers: [],
          rejecters: [],
          timeoutId: window.setTimeout(() => {
            this.executeBatch(batchKey);
          }, this.batchTimeout)
        };
        this.batchQueue.set(batchKey, batch);
      }

      batch.params.push(param);
      batch.resolvers.push(resolve);
      batch.rejecters.push(reject);
    });
  }

  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch) return;

    this.batchQueue.delete(batchKey);
    clearTimeout(batch.timeoutId);

    try {
      // Send batched request
      const response = await fetch(batch.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: batch.params })
      });

      const results = await response.json();

      // Resolve individual promises
      batch.resolvers.forEach((resolve, index) => {
        resolve(results.data[index]);
      });
    } catch (error) {
      // Reject all promises
      batch.rejecters.forEach(reject => reject(error));
    }
  }
}

// Usage cho user profile fetching
const userBatcher = new RequestBatcher();

const useBatchedUserProfiles = () => {
  const fetchUserProfile = useCallback(async (userId: string) => {
    return userBatcher.batchRequest(
      '/api/users/batch',
      { userId },
      (param) => 'users' // Batch all user requests together
    );
  }, []);

  return { fetchUserProfile };
};

// Component usage
const PostAuthor: React.FC<{ authorId: string }> = ({ authorId }) => {
  const { fetchUserProfile } = useBatchedUserProfiles();

  const { data: author } = useQuery(
    ['user', authorId],
    () => fetchUserProfile(authorId),
    {
      staleTime: 5 * 60 * 1000, // User profiles don't change often
      cacheTime: 30 * 60 * 1000
    }
  );

  return (
    <div className="post-author">
      <img src={author?.profilePictureUrl} alt={author?.name} />
      <span>{author?.name}</span>
    </div>
  );
};
```


**2. Optimistic Updates với Rollback:**


```typescript
// Optimistic update manager
class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, PendingUpdate>();
  private rollbackTimeouts = new Map<string, number>();

  interface PendingUpdate {
    key: string;
    optimisticData: any;
    originalData: any;
    onSuccess: (data: any) => void;
    onError: (error: Error) => void;
  }

  async executeOptimistic<T>(
    key: string,
    optimisticData: T,
    serverRequest: () => Promise<T>,
    options: {
      timeout?: number;
      rollbackDelay?: number;
    } = {}
  ): Promise<T> {
    const { timeout = 5000, rollbackDelay = 3000 } = options;

    // Store original data
    const queryClient = getQueryClient();
    const originalData = queryClient.getQueryData([key]);

    // Apply optimistic update immediately
    queryClient.setQueryData([key], optimisticData);

    const updateId = `${key}_${Date.now()}`;

    try {
      // Set rollback timeout
      const rollbackTimeout = window.setTimeout(() => {
        this.rollback(key, originalData);
        console.warn(`Optimistic update rolled back due to timeout: ${key}`);
      }, rollbackDelay);

      this.rollbackTimeouts.set(updateId, rollbackTimeout);

      // Execute server request với timeout
      const serverData = await Promise.race([
        serverRequest(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        })
      ]);

      // Success: clear rollback và update with server data
      clearTimeout(rollbackTimeout);
      this.rollbackTimeouts.delete(updateId);
      queryClient.setQueryData([key], serverData);

      return serverData;
    } catch (error) {
      // Error: rollback to original data
      clearTimeout(this.rollbackTimeouts.get(updateId)!);
      this.rollbackTimeouts.delete(updateId);
      this.rollback(key, originalData);
      throw error;
    }
  }

  private rollback(key: string, originalData: any): void {
    const queryClient = getQueryClient();
    queryClient.setQueryData([key], originalData);
  }

  cancelPendingUpdates(key: string): void {
    const timeout = Array.from(this.rollbackTimeouts.entries())
      .find(([id]) => id.startsWith(key))?.[1];

    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

// React hook
const useOptimisticMutation = <T,>(
  key: string,
  mutationFn: () => Promise<T>,
  optimisticDataFn: (currentData: T | undefined) => T
) => {
  const optimisticManager = useMemo(() => new OptimisticUpdateManager(), []);

  return useMutation({
    mutationFn: async () => {
      const queryClient = getQueryClient();
      const currentData = queryClient.getQueryData<T>([key]);
      const optimisticData = optimisticDataFn(currentData);

      return optimisticManager.executeOptimistic(
        key,
        optimisticData,
        mutationFn,
        { timeout: 5000, rollbackDelay: 3000 }
      );
    },
    onError: () => {
      // Additional error handling
      toast.error('Action failed, changes reverted');
    }
  });
};

// Usage example
const usePostReaction = (postId: string) => {
  const addReaction = useOptimisticMutation(
    `post_${postId}`,
    () => fetch(`/api/posts/${postId}/reactions`, { method: 'POST' }),
    (currentPost) => ({
      ...currentPost,
      reactions: {
        ...currentPost.reactions,
        likes: currentPost.reactions.likes + 1,
        total: currentPost.reactions.total + 1
      }
    })
  );

  return { addReaction: addReaction.mutate };
};
```


**3. HTTP/2 Push và Resource Hints:**


```typescript
// Resource hint manager
class ResourceHintManager {
  private hintedResources = new Set<string>();

  preloadCriticalResources(feedData: Post[]): void {
    // Preload critical images
    const criticalImages = feedData
      .slice(0, 3) // First 3 posts
      .flatMap(post => post.mediaUrls || [])
      .slice(0, 5); // Max 5 images

    criticalImages.forEach(url => this.preloadImage(url));

    // Preload next page of data
    const nextCursor = feedData[feedData.length - 1]?.id;
    if (nextCursor) {
      this.preloadData(`/api/feed?cursor=${nextCursor}`);
    }
  }

  private preloadImage(url: string): void {
    if (this.hintedResources.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);
    this.hintedResources.add(url);
  }

  private preloadData(url: string): void {
    if (this.hintedResources.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);
    this.hintedResources.add(url);
  }

  prefetchNextPage(cursor: string): void {
    const url = `/api/feed?cursor=${cursor}`;

    if (this.hintedResources.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;

    document.head.appendChild(link);
    this.hintedResources.add(url);
  }

  // DNS prefetch cho external domains
  dnsPrefetch(domains: string[]): void {
    domains.forEach(domain => {
      if (this.hintedResources.has(`dns:${domain}`)) return;

      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;

      document.head.appendChild(link);
      this.hintedResources.add(`dns:${domain}`);
    });
  }
}

// Usage trong Feed component
const FeedContainer: React.FC = () => {
  const { data: feedData } = useFeed();
  const resourceHintManager = useMemo(() => new ResourceHintManager(), []);

  useEffect(() => {
    if (feedData?.posts) {
      resourceHintManager.preloadCriticalResources(feedData.posts);

      // DNS prefetch cho CDN domains
      resourceHintManager.dnsPrefetch([
        'images.example.com',
        'cdn.example.com',
        'api.example.com'
      ]);
    }
  }, [feedData, resourceHintManager]);

  return (
    <div className="feed-container">
      {feedData?.posts.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
};
```


**Người phỏng vấn:** Outstanding network optimization strategy! Request batching, sophisticated optimistic updates, và resource hints - đây là advanced techniques.


Tôi đặc biệt impressed với rollback mechanism trong optimistic updates. Đây chính là production-level thinking.


Last optimization area - real-time updates. Làm sao scale WebSocket connections?


#### E. Real-time Optimization và Scaling


**Ứng viên:** Real-time scaling rất challenging. Em sẽ design multi-tier approach:


**1. WebSocket Connection Management:**


```typescript
// WebSocket manager với reconnection và heartbeat
interface WebSocketConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

class FeedWebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private messageQueue: any[] = [];
  private subscribers = new Map<string, Set<(data: any) => void>>();

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      const wsUrl = await this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private async getWebSocketUrl(): Promise<string> {
    // Get WebSocket URL with authentication token
    const token = await this.getAuthToken();
    return `wss://api.example.com/feed/live?token=${token}`;
  }

  private handleMessage(message: any): void {
    const { type, data, channel } = message;

    // Distribute message to subscribers
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }

    // Handle heartbeat response
    if (type === 'heartbeat') {
      this.handleHeartbeat();
    }
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());

      // Subscribe to channel on server
      this.send({
        type: 'subscribe',
        channel: channel
      });
    }

    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelSubs = this.subscribers.get(channel);
      if (channelSubs) {
        channelSubs.delete(callback);

        if (channelSubs.size === 0) {
          this.subscribers.delete(channel);

          // Unsubscribe from channel on server
          this.send({
            type: 'unsubscribe',
            channel: channel
          });
        }
      }
    };
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: 'heartbeat', timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```


**2. Efficient Update Distribution:**


```typescript
// Smart update manager để reduce unnecessary re-renders
class FeedUpdateManager {
  private updateQueue = new Map<string, QueuedUpdate>();
  private batchTimer: number | null = null;
  private readonly BATCH_DELAY = 100; // ms

  interface QueuedUpdate {
    postId: string;
    updates: any[];
    timestamp: number;
  }

  queueUpdate(postId: string, update: any): void {
    let queuedUpdate = this.updateQueue.get(postId);

    if (!queuedUpdate) {
      queuedUpdate = {
        postId,
        updates: [],
        timestamp: Date.now()
      };
      this.updateQueue.set(postId, queuedUpdate);
    }

    queuedUpdate.updates.push(update);

    // Schedule batch processing
    if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    }
  }

  private processBatch(): void {
    const updates = Array.from(this.updateQueue.values());
    this.updateQueue.clear();
    this.batchTimer = null;

    // Group by update type để optimize queries
    const groupedUpdates = updates.reduce((acc, update) => {
      update.updates.forEach(u => {
        if (!acc[u.type]) acc[u.type] = [];
        acc[u.type].push({ postId: update.postId, data: u.data });
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Apply updates in batches
    Object.entries(groupedUpdates).forEach(([type, updateList]) => {
      this.applyBatchUpdate(type, updateList);
    });
  }

  private applyBatchUpdate(type: string, updates: any[]): void {
    const queryClient = getQueryClient();

    switch (type) {
      case 'POST_REACTION':
        // Batch update multiple posts' reactions
        updates.forEach(({ postId, data }) => {
          queryClient.setQueryData(['post', postId], (old: any) => ({
            ...old,
            reactions: data.reactions
          }));
        });
        break;

      case 'COMMENT_COUNT':
        // Batch update comment counts
        updates.forEach(({ postId, data }) => {
          queryClient.setQueryData(['post', postId], (old: any) => ({
            ...old,
            commentsCount: data.count
          }));
        });
        break;

      case 'NEW_COMMENT':
        // Invalidate comments queries cho affected posts
        const postIds = updates.map(u => u.postId);
        postIds.forEach(postId => {
          queryClient.invalidateQueries(['comments', postId]);
        });
        break;
    }
  }
}

// React integration
const useRealtimeFeedUpdates = () => {
  const wsManager = useMemo(() => new FeedWebSocketManager({
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000
  }), []);

  const updateManager = useMemo(() => new FeedUpdateManager(), []);

  useEffect(() => {
    // Subscribe to feed updates
    const unsubscribe = wsManager.subscribe('feed_updates', (data) => {
      updateManager.queueUpdate(data.postId, data);
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [wsManager, updateManager]);

  // Subscribe to specific post updates
  const subscribeToPost = useCallback((postId: string) => {
    return wsManager.subscribe(`post_${postId}`, (data) => {
      updateManager.queueUpdate(postId, data);
    });
  }, [wsManager, updateManager]);

  return { subscribeToPost };
};
```


**3. Visibility-based Subscription Management:**


```typescript
// Only subscribe to updates cho visible posts
const useVisibilityBasedSubscriptions = () => {
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  const { subscribeToPost } = useRealtimeFeedUpdates();
  const activeSubscriptions = useRef<Map<string, () => void>>(new Map());

  // Intersection Observer để track visible posts
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePosts(prev => {
          const updated = new Set(prev);

          entries.forEach(entry => {
            const postId = entry.target.getAttribute('data-post-id');
            if (!postId) return;

            if (entry.isIntersecting) {
              updated.add(postId);
            } else {
              updated.delete(postId);
            }
          });

          return updated;
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px' // Small buffer
      }
    );

    // Observe all post elements
    document.querySelectorAll('[data-post-id]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Manage subscriptions based on visibility
  useEffect(() => {
    // Subscribe to newly visible posts
    visiblePosts.forEach(postId => {
      if (!activeSubscriptions.current.has(postId)) {
        const unsubscribe = subscribeToPost(postId);
        activeSubscriptions.current.set(postId, unsubscribe);
      }
    });

    // Unsubscribe from no longer visible posts
    activeSubscriptions.current.forEach((unsubscribe, postId) => {
      if (!visiblePosts.has(postId)) {
        unsubscribe();
        activeSubscriptions.current.delete(postId);
      }
    });
  }, [visiblePosts, subscribeToPost]);

  return { visiblePosts: Array.from(visiblePosts) };
};

// Component integration
const PostItem: React.FC<{ post: Post }> = ({ post }) => {
  const postRef = useRef<HTMLElement>(null);

  return (
    <article
      ref={postRef}
      data-post-id={post.id}
      className="post-item"
    >
      <PostHeader author={post.author} timestamp={post.createdAt} />
      <PostContent content={post.content} />
      <PostActions reactions={post.reactions} />
    </article>
  );
};
```


**Người phỏng vấn:** Exceptional real-time architecture! Visibility-based subscriptions là brilliant optimization - chỉ có experienced engineers mới think về việc reduce server load như vậy.


Connection management với exponential backoff và message queuing shows production-ready thinking.


---


**[14:55 - Kết thúc phần Optimizations]**


**Người phỏng vấn:** Optimization section đã rất comprehensive! Bạn đã cover:


- **Rendering optimization** với virtual scrolling và smart memoization
- **Image optimization** với progressive loading và responsive images
- **Data caching** với multi-layer strategy
- **Network optimization** với request batching và optimistic updates
- **Real-time scaling** với intelligent WebSocket management


Đây chính xác là level của optimization thinking mà chúng tôi expect từ senior engineers.


Ready để move sang cross-cutting concerns?


---


## Phần 3: Cross-cutting Concerns & Advanced Topics


**[14:56 - Cross-cutting Concerns bắt đầu]**


**Người phỏng vấn:** Bây giờ chúng ta discuss một số advanced topics không specific cho News Feed nhưng rất important cho production applications. Bắt đầu với security và authentication.


### A. Security & Authentication (1,500 từ)


**Ứng viên:** Security rất critical cho News Feed vì handle sensitive user data và social interactions:


**1. Frontend Authentication Strategy:**


```typescript
// Authentication context với token management
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

class AuthTokenManager {
  private readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    // Use httpOnly cookies thay vì localStorage cho security
    this.accessToken = this.getCookie(this.ACCESS_TOKEN_KEY);
    this.refreshToken = this.getCookie(this.REFRESH_TOKEN_KEY);

    if (this.accessToken) {
      this.tokenExpiry = this.parseTokenExpiry(this.accessToken);
    }
  }

  async getValidToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    // Check if token needs refresh
    if (this.isTokenExpiringSoon()) {
      return this.refreshAccessToken();
    }

    return this.accessToken;
  }

  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiry) return false;
    return Date.now() + this.TOKEN_EXPIRY_BUFFER > this.tokenExpiry;
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      this.accessToken = data.accessToken;
      this.tokenExpiry = this.parseTokenExpiry(data.accessToken);

      // Store new tokens (server sets httpOnly cookies)
      return this.accessToken;
    } catch (error) {
      // Refresh failed, redirect to login
      this.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  private parseTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return 0;
    }
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    // Clear cookies on server side
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  }
}

// React context
const AuthContext = createContext<{
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
} | null>(null);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null
  });

  const tokenManager = useMemo(() => new AuthTokenManager(), []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      setAuthState({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    tokenManager.clearTokens();
    setAuthState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null
    });
  }, [tokenManager]);

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```


**2. XSS Protection và Content Sanitization:**


```typescript
// Content sanitization cho user-generated content
import DOMPurify from 'dompurify';

interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  maxLength: number;
}

class ContentSanitizer {
  private config: SanitizationConfig;

  constructor(config: SanitizationConfig) {
    this.config = config;
  }

  sanitizePostContent(content: string): string {
    // Basic validation
    if (content.length > this.config.maxLength) {
      throw new Error(`Content exceeds maximum length of ${this.config.maxLength}`);
    }

    // Configure DOMPurify
    const cleanContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: Object.keys(this.config.allowedAttributes),
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false
    });

    // Additional custom sanitization
    return this.sanitizeLinks(this.sanitizeMentions(cleanContent));
  }

  private sanitizeMentions(content: string): string {
    // Sanitize @mentions để prevent injection
    return content.replace(
      /@(\w+)/g,
      (match, username) => {
        // Validate username format
        if (!/^[a-zA-Z0-9_]{1,20}$/.test(username)) {
          return match; // Invalid format, don't convert
        }
        return `<span class="mention" data-username="${username}">@${username}</span>`;
      }
    );
  }

  private sanitizeLinks(content: string): string {
    // Convert URLs but ensure they're safe
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, (url) => {
      try {
        const parsed = new URL(url);

        // Block dangerous protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return url; // Don't linkify
        }

        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      } catch {
        return url; // Invalid URL, don't linkify
      }
    });
  }

  sanitizeImageUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Only allow images from trusted domains
      const trustedDomains = ['images.example.com', 'cdn.example.com'];
      if (!trustedDomains.includes(parsed.hostname)) {
        throw new Error('Untrusted image domain');
      }

      // Ensure HTTPS
      if (parsed.protocol !== 'https:') {
        throw new Error('Image must use HTTPS');
      }

      return url;
    } catch (error) {
      console.warn('Invalid image URL:', error);
      return '/images/placeholder.jpg'; // Fallback image
    }
  }
}

// React hook
const useContentSanitization = () => {
  const sanitizer = useMemo(() => new ContentSanitizer({
    allowedTags: ['p', 'br', 'strong', 'em', 'a', 'span'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'span': ['class', 'data-username']
    },
    maxLength: 5000
  }), []);

  const sanitizeContent = useCallback((content: string) => {
    return sanitizer.sanitizePostContent(content);
  }, [sanitizer]);

  const sanitizeImageUrl = useCallback((url: string) => {
    return sanitizer.sanitizeImageUrl(url);
  }, [sanitizer]);

  return { sanitizeContent, sanitizeImageUrl };
};
```


**3. CSRF Protection và Request Security:**


```typescript
// CSRF token management
class CSRFTokenManager {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  async getCSRFToken(): Promise<string> {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Fetch new CSRF token
    const response = await fetch('/api/csrf-token', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    this.token = data.token;
    this.tokenExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes

    return this.token;
  }
}

// Secure fetch wrapper
class SecureApiClient {
  private csrfManager = new CSRFTokenManager();
  private authManager: AuthTokenManager;

  constructor(authManager: AuthTokenManager) {
    this.authManager = authManager;
  }

  async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);

    // Add authentication token
    const token = await this.authManager.getValidToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
      const csrfToken = await this.csrfManager.getCSRFToken();
      headers.set('X-CSRF-Token', csrfToken);
    }

    // Security headers
    headers.set('Content-Type', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      // Security: prevent redirect following
      redirect: 'error'
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Token expired, attempt refresh
      try {
        await this.authManager.refreshAccessToken();
        // Retry request với new token
        return this.secureRequest(url, options);
      } catch {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    return response;
  }
}

// React Query integration với security
const useSecureQuery = <T,>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) => {
  const secureClient = useMemo(() =>
    new SecureApiClient(new AuthTokenManager()), []
  );

  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    ...options,
    // Automatic retry on auth errors
    retry: (failureCount, error) => {
      if (error.message === 'Authentication failed') {
        return false; // Don't retry auth failures
      }
      return failureCount < 3;
    }
  });
};
```


**Người phỏng vấn:** Excellent security implementation! HTTP-only cookies, CSRF protection, content sanitization - đây là comprehensive security strategy.


Tôi đặc biệt appreciate DOMPurify integration và automatic token refresh mechanism.


### B. Testing & Quality Assurance (1,500 từ)


**Người phỏng vấn:** Testing strategy cho News Feed sẽ như thế nào? Đây là complex application với nhiều user interactions.


**Ứng viên:** Testing News Feed cần comprehensive strategy covering multiple layers:


**1. Component Testing Strategy:**


```typescript
// Test utilities cho News Feed components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';

// Test wrapper với necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const mockAuthState = {
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    isLoading: false,
    error: null
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialState={mockAuthState}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Mock data factories
const createMockPost = (overrides?: Partial<Post>): Post => ({
  id: '1',
  authorId: 'user_1',
  author: {
    id: 'user_1',
    name: 'John Doe',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    username: 'johndoe',
    isVerified: false
  },
  content: 'This is a test post content',
  mediaUrls: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  reactions: {
    likes: 5,
    loves: 2,
    total: 7
  },
  commentsCount: 3,
  sharesCount: 1,
  privacy: 'public',
  ...overrides
});

// PostItem component tests
describe('PostItem Component', () => {
  const mockPost = createMockPost();
  const mockHandlers = {
    onReaction: jest.fn(),
    onComment: jest.fn(),
    onShare: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders post content correctly', () => {
    render(
      <TestWrapper>
        <PostItem post={mockPost} {...mockHandlers} />
      </TestWrapper>
    );

    expect(screen.getByText(mockPost.content)).toBeInTheDocument();
    expect(screen.getByText(mockPost.author.name)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Likes count
  });

  it('handles like interaction correctly', async () => {
    render(
      <TestWrapper>
        <PostItem post={mockPost} {...mockHandlers} />
      </TestWrapper>
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockHandlers.onReaction).toHaveBeenCalledWith(mockPost.id, 'like');
    });
  });

  it('shows optimistic update during reaction', async () => {
    const { rerender } = render(
      <TestWrapper>
        <PostItem post={mockPost} {...mockHandlers} isOptimistic={true} />
      </TestWrapper>
    );

    // Should show loading state
    expect(screen.getByTestId('reaction-loading')).toBeInTheDocument();

    // Update với new reactions
    const updatedPost = createMockPost({
      reactions: { likes: 6, loves: 2, total: 8 }
    });

    rerender(
      <TestWrapper>
        <PostItem post={updatedPost} {...mockHandlers} isOptimistic={false} />
      </TestWrapper>
    );

    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.queryByTestId('reaction-loading')).not.toBeInTheDocument();
  });

  it('handles long content truncation', () => {
    const longPost = createMockPost({
      content: 'A'.repeat(1000) // Very long content
    });

    render(
      <TestWrapper>
        <PostItem post={longPost} {...mockHandlers} />
      </TestWrapper>
    );

    expect(screen.getByText(/see more/i)).toBeInTheDocument();

    // Click "See more"
    fireEvent.click(screen.getByText(/see more/i));
    expect(screen.getByText(/see less/i)).toBeInTheDocument();
  });

  it('handles image loading states', async () => {
    const postWithImage = createMockPost({
      mediaUrls: ['https://example.com/image.jpg']
    });

    render(
      <TestWrapper>
        <PostItem post={postWithImage} {...mockHandlers} />
      </TestWrapper>
    );

    // Should show placeholder initially
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();

    // Simulate image load
    const image = screen.getByRole('img');
    fireEvent.load(image);

    await waitFor(() => {
      expect(screen.queryByTestId('image-placeholder')).not.toBeInTheDocument();
    });
  });
});
```


**2. Integration Testing với MSW:**


```typescript
// Mock Service Worker setup cho integration tests
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// API mocks
const server = setupServer(
  // Feed API
  rest.get('/api/feed', (req, res, ctx) => {
    const cursor = req.url.searchParams.get('cursor');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');

    const posts = Array.from({ length: limit }, (_, i) =>
      createMockPost({
        id: `post_${cursor || 0}_${i}`,
        content: `Mock post content ${i}`
      })
    );

    return res(
      ctx.json({
        data: {
          posts,
          pagination: {
            nextCursor: `cursor_${Date.now()}`,
            hasNextPage: true,
            totalCount: 100
          }
        }
      })
    );
  }),

  // Reaction API
  rest.post('/api/posts/:postId/reactions', (req, res, ctx) => {
    const { postId } = req.params;

    return res(
      ctx.json({
        data: {
          postId,
          reactions: { likes: 6, loves: 2, total: 8 },
          userReaction: 'like'
        }
      })
    );
  }),

  // Error scenarios
  rest.get('/api/feed-error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  })
);

// Test setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Integration tests
describe('Feed Integration Tests', () => {
  it('loads feed data and handles infinite scroll', async () => {
    render(
      <TestWrapper>
        <FeedContainer />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Mock post content 0')).toBeInTheDocument();
    });

    // Scroll to bottom để trigger load more
    const scrollContainer = screen.getByTestId('feed-scroll-container');
    fireEvent.scroll(scrollContainer, {
      target: { scrollTop: 1000, scrollHeight: 1200, clientHeight: 200 }
    });

    // Should load more posts
    await waitFor(() => {
      expect(screen.getByText(/loading more/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText(/loading more/i)).not.toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    server.use(
      rest.get('/api/feed', (req, res, ctx) => {
        return res.networkError('Network connection failed');
      })
    );

    render(
      <TestWrapper>
        <FeedContainer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('optimistic updates work correctly', async () => {
    render(
      <TestWrapper>
        <FeedContainer />
      </TestWrapper>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Mock post content 0')).toBeInTheDocument();
    });

    // Get initial like count
    const likeCount = screen.getByTestId('like-count-post_0_0');
    expect(likeCount).toHaveTextContent('5');

    // Click like button
    const likeButton = screen.getByTestId('like-button-post_0_0');
    fireEvent.click(likeButton);

    // Should immediately update (optimistic)
    await waitFor(() => {
      expect(likeCount).toHaveTextContent('6');
    });

    // Should stay updated after server confirms
    await waitFor(() => {
      expect(likeCount).toHaveTextContent('6');
    }, { timeout: 2000 });
  });
});
```


**3. Performance Testing:**


```typescript
// Performance testing utilities
import { act, renderHook } from '@testing-library/react';

describe('Performance Tests', () => {
  it('virtual scrolling handles large datasets efficiently', async () => {
    const largePosts = Array.from({ length: 10000 }, (_, i) =>
      createMockPost({ id: `post_${i}`, content: `Post ${i}` })
    );

    const { result } = renderHook(() =>
      useVirtualScrolling({ items: largePosts, itemHeight: 200 })
    );

    // Measure initial render time
    const startTime = performance.now();

    act(() => {
      result.current.setScrollTop(0);
    });

    const renderTime = performance.now() - startTime;

    // Should render quickly even với large dataset
    expect(renderTime).toBeLessThan(50); // 50ms threshold

    // Should only render visible items
    expect(result.current.visibleItems.length).toBeLessThan(20);
  });

  it('image loading does not block UI', async () => {
    const postsWithImages = Array.from({ length: 50 }, (_, i) =>
      createMockPost({
        id: `post_${i}`,
        mediaUrls: [`https://example.com/image_${i}.jpg`]
      })
    );

    const startTime = performance.now();

    render(
      <TestWrapper>
        <FeedContainer initialPosts={postsWithImages} />
      </TestWrapper>
    );

    const renderTime = performance.now() - startTime;

    // Initial render should be fast despite many images
    expect(renderTime).toBeLessThan(100);

    // Images should load progressively
    const placeholders = screen.getAllByTestId('image-placeholder');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('state updates are batched efficiently', async () => {
    const { result } = renderHook(() => useFeedState());

    const updateCount = jest.fn();

    // Mock React's render cycle
    const originalUseEffect = React.useEffect;
    React.useEffect = jest.fn().mockImplementation((fn, deps) => {
      updateCount();
      return originalUseEffect(fn, deps);
    });

    // Perform multiple rapid updates
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.updatePost(`post_${i}`, { likes: i });
      }
    });

    // Should batch updates để reduce renders
    expect(updateCount).toHaveBeenCalledTimes(1);

    React.useEffect = originalUseEffect;
  });
});
```


**4. End-to-End Testing với Playwright:**


```typescript
// E2E tests với Playwright
import { test, expect } from '@playwright/test';

test.describe('News Feed E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to feed
    await page.waitForURL('/feed');
  });

  test('user can create and view new post', async ({ page }) => {
    // Open post composer
    await page.click('[data-testid="compose-button"]');

    // Fill post content
    const postContent = 'This is my test post content';
    await page.fill('[data-testid="post-content"]', postContent);

    // Submit post
    await page.click('[data-testid="submit-post"]');

    // Wait for post to appear in feed
    await expect(page.locator(`text=${postContent}`)).toBeVisible();

    // Verify post appears at top của feed
    const firstPost = page.locator('[data-testid^="post-"]').first();
    await expect(firstPost).toContainText(postContent);
  });

  test('infinite scroll loads more posts', async ({ page }) => {
    // Count initial posts
    const initialPosts = await page.locator('[data-testid^="post-"]').
```


## Claude


```typescript
// E2E tests với Playwright (continued)
test.describe('News Feed E2E', () => {
  test('infinite scroll loads more posts', async ({ page }) => {
    // Count initial posts
    const initialPosts = await page.locator('[data-testid^="post-"]').count();
    expect(initialPosts).toBeGreaterThan(0);

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for loading indicator
    await expect(page.locator('[data-testid="loading-more"]')).toBeVisible();

    // Wait for new posts to load
    await page.waitForFunction(
      (initialCount) => {
        const currentCount = document.querySelectorAll('[data-testid^="post-"]').length;
        return currentCount > initialCount;
      },
      initialPosts,
      { timeout: 5000 }
    );

    const finalPosts = await page.locator('[data-testid^="post-"]').count();
    expect(finalPosts).toBeGreaterThan(initialPosts);
  });

  test('real-time reactions work correctly', async ({ page, context }) => {
    // Open second tab để simulate another user
    const secondPage = await context.newPage();
    await secondPage.goto('/feed');

    // Get first post on both pages
    const postId = await page.locator('[data-testid^="post-"]').first().getAttribute('data-testid');
    const likeButton1 = page.locator(`[data-testid="${postId}"] [data-testid="like-button"]`);
    const likeCount1 = page.locator(`[data-testid="${postId}"] [data-testid="like-count"]`);
    const likeCount2 = secondPage.locator(`[data-testid="${postId}"] [data-testid="like-count"]`);

    // Get initial count
    const initialCount = await likeCount1.textContent();

    // User 1 likes the post
    await likeButton1.click();

    // Verify optimistic update on page 1
    await expect(likeCount1).not.toHaveText(initialCount);

    // Verify real-time update on page 2
    await expect(likeCount2).not.toHaveText(initialCount, { timeout: 3000 });

    await secondPage.close();
  });

  test('error handling displays user-friendly messages', async ({ page }) => {
    // Intercept API để simulate error
    await page.route('/api/feed*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.reload();

    // Should show error message
    await expect(page.locator('[data-testid="feed-error"]')).toBeVisible();
    await expect(page.locator('text=Something went wrong')).toBeVisible();

    // Should show retry button
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();

    // Remove route intercept
    await page.unroute('/api/feed*');

    // Click retry
    await retryButton.click();

    // Should load successfully
    await expect(page.locator('[data-testid^="post-"]').first()).toBeVisible();
  });

  test('accessibility features work correctly', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test screen reader content
    const firstPost = page.locator('[data-testid^="post-"]').first();
    await expect(firstPost).toHaveAttribute('role', 'article');

    // Test image alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }

    // Test focus management trong modals
    await page.click('[data-testid="share-button"]');
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Focus should be trapped trong modal
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
```


**Người phỏng vấn:** Excellent testing strategy! Comprehensive coverage từ unit tests đến E2E tests. Tôi đặc biệt thích MSW setup cho integration testing và performance testing concerns.


### C. Deployment & DevOps (1,000 từ)


**Người phỏng vấn:** Production deployment cho News Feed application sẽ như thế nào? Cần consider những gì về scalability và reliability?


**Ứng viên:** Production deployment cần robust strategy để handle millions của users:


**1. Build & Deployment Pipeline:**


```yaml
# GitHub Actions CI/CD pipeline
name: News Feed Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}

      - name: Start test server
        run: npm run start:test &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - name: Upload E2E results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'

    steps:
      - uses: actions/checkout@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/staging'
    environment: staging

    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Kubernetes deployment commands
          kubectl set image deployment/news-feed-app \
            app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:staging-${{ github.sha }} \
            --namespace=staging
          kubectl rollout status deployment/news-feed-app --namespace=staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Blue-green deployment
          kubectl set image deployment/news-feed-app-green \
            app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:main-${{ github.sha }} \
            --namespace=production

          # Wait for green deployment
          kubectl rollout status deployment/news-feed-app-green --namespace=production

          # Switch traffic to green
          kubectl patch service news-feed-service \
            -p '{"spec":{"selector":{"version":"green"}}}' \
            --namespace=production

          # Scale down blue deployment
          kubectl scale deployment news-feed-app-blue --replicas=0 --namespace=production
```


**2. Docker Configuration:**


```dockerfile
# Multi-stage Dockerfile để optimize image size
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build application với environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_CDN_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user cho security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```


**3. Kubernetes Deployment:**


```yaml
# Kubernetes deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: news-feed-app
  namespace: production
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  selector:
    matchLabels:
      app: news-feed
  template:
    metadata:
      labels:
        app: news-feed
        version: blue
    spec:
      containers:
      - name: app
        image: ghcr.io/company/news-feed:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-url
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

---
apiVersion: v1
kind: Service
metadata:
  name: news-feed-service
  namespace: production
spec:
  selector:
    app: news-feed
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: news-feed-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - newsfeed.example.com
    secretName: news-feed-tls
  rules:
  - host: newsfeed.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: news-feed-service
            port:
              number: 80

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: news-feed-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: news-feed-app
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```


**4. CDN và Edge Optimization:**


```typescript
// CDN configuration với Cloudflare
interface CDNConfig {
  zones: {
    static: string; // Static assets
    images: string; // User-generated images
    api: string;    // API responses
  };
  caching: {
    static: number;   // Cache TTL for static assets
    dynamic: number;  // Cache TTL for dynamic content
    images: number;   // Cache TTL for images
  };
}

const cdnConfig: CDNConfig = {
  zones: {
    static: 'static.newsfeed.com',
    images: 'images.newsfeed.com',
    api: 'api.newsfeed.com'
  },
  caching: {
    static: 31536000,  // 1 year
    dynamic: 300,      // 5 minutes
    images: 2592000    // 30 days
  }
};

// Edge function cho dynamic content caching
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Cache static assets aggressively
    if (url.pathname.startsWith('/static/')) {
      const response = await fetch(request);

      if (response.ok) {
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'Cache-Control': `public, max-age=${cdnConfig.caching.static}`,
            'CDN-Cache-Control': `public, max-age=${cdnConfig.caching.static}`
          }
        });

        return newResponse;
      }
    }

    // Smart caching cho API responses
    if (url.pathname.startsWith('/api/feed')) {
      const cacheKey = `feed:${url.search}:${request.headers.get('Authorization')}`;
      const cached = await env.CACHE.get(cacheKey);

      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        });
      }

      const response = await fetch(request);

      if (response.ok) {
        const data = await response.text();

        // Cache với shorter TTL cho feed data
        await env.CACHE.put(cacheKey, data, {
          expirationTtl: cdnConfig.caching.dynamic
        });

        return new Response(data, {
          headers: {
            ...response.headers,
            'X-Cache': 'MISS'
          }
        });
      }
    }

    return fetch(request);
  }
};
```


**Người phỏng vấn:** Impressive deployment strategy! Blue-green deployment, auto-scaling, edge optimization - đây là production-ready approach.


### D. Monitoring & Observability (1,000 từ)


**Người phỏng vấn:** Làm sao monitor performance và detect issues trong production News Feed?


**Ứng viên:** Comprehensive monitoring strategy với multiple layers:


**1. Application Performance Monitoring:**


```typescript
// Performance monitoring setup
import { captureException, captureMessage, addBreadcrumb } from '@sentry/nextjs';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

class FeedPerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observer: PerformanceObserver;

  constructor() {
    this.setupPerformanceObserver();
    this.trackCoreWebVitals();
    this.trackCustomMetrics();
  }

  private setupPerformanceObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.processPerformanceEntry(entry);
      });
    });

    // Observe different types of performance entries
    this.observer.observe({
      entryTypes: ['navigation', 'paint', 'measure', 'resource']
    });
  }

  private trackCoreWebVitals(): void {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.recordMetric('lcp', lastEntry.startTime);
      this.reportToAnalytics('core_web_vitals', {
        metric: 'lcp',
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime);
        this.reportToAnalytics('core_web_vitals', {
          metric: 'fid',
          value: entry.processingStart - entry.startTime,
          eventType: entry.name
        });
      });
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('cls', clsValue);
        }
      });
    }).observe({ type: 'layout-shift', buffered: true });
  }

  private trackCustomMetrics(): void {
    // Feed load time
    this.measureAsync('feed_load_time', async () => {
      const startTime = performance.now();

      // Wait for feed to load
      await new Promise((resolve) => {
        const checkFeed = () => {
          if (document.querySelector('[data-testid^="post-"]')) {
            resolve(true);
          } else {
            setTimeout(checkFeed, 100);
          }
        };
        checkFeed();
      });

      return performance.now() - startTime;
    });

    // Image load performance
    this.trackImageLoadTimes();

    // Scroll performance
    this.trackScrollPerformance();
  }

  private async measureAsync(name: string, fn: () => Promise<number>): Promise<void> {
    try {
      const value = await fn();
      this.recordMetric(name, value);

      performance.mark(`${name}_start`);
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
    } catch (error) {
      captureException(error);
    }
  }

  private trackImageLoadTimes(): void {
    const images = document.querySelectorAll('img[data-post-id]');

    images.forEach((img) => {
      const startTime = performance.now();

      img.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        this.recordMetric('image_load_time', loadTime);

        this.reportToAnalytics('image_performance', {
          loadTime,
          imageSize: this.estimateImageSize(img as HTMLImageElement),
          isLazy: img.hasAttribute('loading')
        });
      });

      img.addEventListener('error', () => {
        this.reportToAnalytics('image_error', {
          src: (img as HTMLImageElement).src,
          alt: (img as HTMLImageElement).alt
        });
      });
    });
  }

  private trackScrollPerformance(): void {
    let isScrolling = false;
    let scrollStartTime: number;

    const scrollHandler = () => {
      if (!isScrolling) {
        isScrolling = true;
        scrollStartTime = performance.now();

        // Use RAF để measure scroll performance
        requestAnimationFrame(() => {
          const scrollTime = performance.now() - scrollStartTime;
          this.recordMetric('scroll_response_time', scrollTime);
          isScrolling = false;
        });
      }
    };

    document.addEventListener('scroll', scrollHandler, { passive: true });
  }

  private recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);

    // Send to monitoring service
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        page_path: window.location.pathname
      });
    }
  }

  private reportToAnalytics(event: string, data: any): void {
    // Send to multiple analytics services
    if (window.gtag) {
      window.gtag('event', event, data);
    }

    // Send to custom analytics
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        data,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        userId: this.getUserId()
      })
    }).catch(console.error);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```


**2. Error Tracking & Logging:**


```typescript
// Error tracking và logging system
interface ErrorContext {
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  timestamp: number;
  stackTrace?: string;
  additionalData?: any;
}

class FeedErrorTracker {
  private errorQueue: ErrorContext[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    this.setupGlobalErrorHandling();
    this.setupUnhandledRejectionHandling();
    this.setupResourceErrorHandling();
    this.startBatchFlush();
  }

  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
  }

  private setupUnhandledRejectionHandling(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: 'Unhandled Promise Rejection',
        error: event.reason
      });
    });
  }

  private setupResourceErrorHandling(): void {
    // Track failed resource loads
    document.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;

      if (target.tagName === 'IMG') {
        this.captureError({
          message: 'Image load failed',
          resource: (target as HTMLImageElement).src,
          type: 'resource_error'
        });
      } else if (target.tagName === 'SCRIPT') {
        this.captureError({
          message: 'Script load failed',
          resource: (target as HTMLScriptElement).src,
          type: 'resource_error'
        });
      }
    }, true);
  }

  captureError(errorData: any): void {
    const context: ErrorContext = {
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      stackTrace: errorData.error?.stack,
      additionalData: errorData
    };

    this.errorQueue.push(context);

    // Immediate flush for critical errors
    if (this.isCriticalError(errorData)) {
      this.flushErrors();
    }

    // Send to Sentry for immediate alerting
    captureException(errorData.error || new Error(errorData.message), {
      contexts: { custom: context },
      tags: {
        component: 'news_feed',
        severity: this.getErrorSeverity(errorData)
      }
    });
  }

  private isCriticalError(errorData: any): boolean {
    const criticalPatterns = [
      /authentication/i,
      /network/i,
      /database/i,
      /payment/i
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(errorData.message || '')
    );
  }

  private getErrorSeverity(errorData: any): 'low' | 'medium' | 'high' | 'critical' {
    if (this.isCriticalError(errorData)) return 'critical';
    if (errorData.type === 'resource_error') return 'medium';
    if (errorData.message?.includes('React')) return 'high';
    return 'low';
  }

  private startBatchFlush(): void {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flushErrors();
      }
    }, this.flushInterval);
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = this.errorQueue.splice(0, this.batchSize);

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      });
    } catch (error) {
      // Failed to send errors, put them back
      this.errorQueue.unshift(...errors);
      console.error('Failed to send error logs:', error);
    }
  }
}
```


**3. Business Metrics Tracking:**


```typescript
// Business metrics và user behavior tracking
interface UserAction {
  action: string;
  postId?: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class FeedAnalytics {
  private actionQueue: UserAction[] = [];
  private sessionData: Record<string, any> = {};

  constructor() {
    this.initializeSession();
    this.trackPageViews();
    this.trackUserEngagement();
    this.startSessionTracking();
  }

  trackPostInteraction(action: 'view' | 'like' | 'share' | 'comment', postId: string, metadata?: any): void {
    this.queueAction({
      action: `post_${action}`,
      postId,
      userId: this.getUserId(),
      timestamp: Date.now(),
      metadata
    });

    // Update session engagement metrics
    this.sessionData.interactions = (this.sessionData.interactions || 0) + 1;
    this.sessionData.lastInteraction = Date.now();
  }

  trackFeedScroll(scrollDepth: number, postsViewed: number): void {
    this.queueAction({
      action: 'feed_scroll',
      userId: this.getUserId(),
      timestamp: Date.now(),
      metadata: {
        scrollDepth,
        postsViewed,
        scrollVelocity: this.calculateScrollVelocity()
      }
    });
  }

  trackPostCreation(postId: string, contentType: 'text' | 'image' | 'video'): void {
    this.queueAction({
      action: 'post_create',
      postId,
      userId: this.getUserId(),
      timestamp: Date.now(),
      metadata: {
        contentType,
        contentLength: this.getContentLength(postId)
      }
    });
  }

  trackPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.queueAction({
      action: 'performance_snapshot',
      userId: this.getUserId(),
      timestamp: Date.now(),
      metadata: metrics
    });
  }

  trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionData.startTime;

    this.queueAction({
      action: 'session_end',
      userId: this.getUserId(),
      timestamp: Date.now(),
      metadata: {
        duration: sessionDuration,
        interactions: this.sessionData.interactions || 0,
        postsViewed: this.sessionData.postsViewed || 0,
        scrollDepth: this.sessionData.maxScrollDepth || 0
      }
    });

    this.flushQueue();
  }

  private initializeSession(): void {
    this.sessionData = {
      startTime: Date.now(),
      interactions: 0,
      postsViewed: 0,
      maxScrollDepth: 0
    };
  }

  private trackUserEngagement(): void {
    // Track time spent on posts
    const postObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const postId = entry.target.getAttribute('data-post-id');
        if (!postId) return;

        if (entry.isIntersecting) {
          this.sessionData[`post_${postId}_start`] = Date.now();
        } else {
          const startTime = this.sessionData[`post_${postId}_start`];
          if (startTime) {
            const viewTime = Date.now() - startTime;

            if (viewTime > 1000) { // Minimum 1 second view
              this.trackPostInteraction('view', postId, { viewTime });
              this.sessionData.postsViewed++;
            }

            delete this.sessionData[`post_${postId}_start`];
          }
        }
      });
    }, { threshold: 0.5 });

    // Observe all posts
    document.querySelectorAll('[data-post-id]').forEach(post => {
      postObserver.observe(post);
    });
  }

  private queueAction(action: UserAction): void {
    this.actionQueue.push(action);

    // Flush when queue is full
    if (this.actionQueue.length >= 50) {
      this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.actionQueue.length === 0) return;

    const actions = this.actionQueue.splice(0);

    try {
      await fetch('/api/analytics/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}

// Initialize monitoring systems
const performanceMonitor = new FeedPerformanceMonitor();
const errorTracker = new FeedErrorTracker();
const analytics = new FeedAnalytics();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  analytics.trackSessionEnd();
});
```


**Người phỏng vấn:** Outstanding monitoring strategy! Real-time performance tracking, comprehensive error handling, và business metrics collection. Shows production mindset với focus on both technical và business KPIs.


---


## Phần 4: Kết Thúc Cuộc Phỏng Vấn


**[15:50 - Wrap-up bắt đầu]**


**Người phỏng vấn:** Excellent work! Chúng ta đã có một cuộc thảo luận rất comprehensive về News Feed system design. Trước khi kết thúc, tôi muốn hỏi một số câu hỏi follow-up:


### Questions & Follow-ups


**1. Trade-offs và Scalability:**


**Người phỏng vấn:** Nếu News Feed cần scale từ 1 million users lên 100 million users, những thay đổi architecture nào bạn sẽ prioritize?


**Ứng viên:** Great question! Scaling 100x sẽ require fundamental architectural changes:


**High Priority Changes:**


1. **Micro-frontend Architecture:**

Split News Feed thành independent micro-frontends
Post creation, feed browsing, interactions có thể deploy independently
Module federation với Webpack 5
2. **Edge Computing:**

Move nhiều logic lên CDN edge locations
Cloudflare Workers cho personalized content serving
Geographic distribution của static assets
3. **Advanced Caching:**

Multi-tier caching với Redis clusters
Personalized cache layers
Cache warming strategies
4. **Database Optimization:**

Read replicas across multiple regions
Database sharding strategy
Consider NoSQL cho certain data types


**Medium Priority:**


1. **WebSocket Scaling:**

WebSocket clusters với sticky sessions
Message queue systems (Redis Streams, Kafka)
Connection pooling strategies
2. **Client-side Optimization:**

Advanced bundling strategies
Progressive loading của features
Background prefetching intelligence


**Người phỏng vấn:** Good prioritization! Bạn có consider những limitations nào của current approach?


**Ứng viên:** Absolutely! Current approach có several limitations:


**Technical Limitations:**


1. **Virtual Scrolling Complexity:**

Dynamic heights make implementation complex
Memory usage still grows với very long sessions
Difficulty với variable content sizes
2. **State Management Complexity:**

Normalization adds development overhead
Real-time synchronization can cause race conditions
Cache invalidation becomes complex
3. **Bundle Size:**

Rich functionality increases initial bundle size
Feature flags help but add complexity
Tree-shaking limitations với certain libraries


**Business Limitations:**


1. **SEO Challenges:**

Client-side rendering impacts organic discovery
Dynamic content harder để index
Social media preview generation complexity
2. **Offline Experience:**

Current design requires constant connectivity
No offline post creation/queuing
Limited graceful degradation


**Mitigation Strategies:**


- Progressive enhancement approach
- Hybrid SSR/CSR rendering
- Service worker implementation cho offline support


**2. Alternative Approaches:**


**Người phỏng vấn:** Có alternative architectural approaches nào bạn would consider cho News Feed? Pros and cons?


**Ứng viên:** Several interesting alternatives:


**1. Server-Side Rendering Heavy (Next.js App Router):**


**Pros:**


- Better SEO và initial load performance
- Simpler client-side logic
- Better caching strategies


**Cons:**


- Less interactive experiences
- Server scaling complexity
- Real-time features harder để implement


**2. Native Mobile Apps with Web Fallback:**


**Pros:**


- Better performance on mobile
- Push notifications easier
- Platform-specific optimizations


**Cons:**


- Development complexity (multiple platforms)
- App store approval processes
- Version fragmentation


**3. GraphQL-Heavy Architecture:**


**Pros:**


- Precise data fetching
- Better caching with normalized cache
- Type safety end-to-end


**Cons:**


- Learning curve cho team
- Query complexity can impact performance
- Caching strategy complexity


**4. Web Components Based:**


**Pros:**


- Framework agnostic
- Better reusability
- Future-proof technology


**Cons:**


- Limited ecosystem
- Browser compatibility concerns
- State management challenges


**Current React approach strikes good balance giữa development velocity và performance.**


**3. Security Deep Dive:**


**Người phỏng vấn:** Nếu bạn discover XSS vulnerability trong post content, làm sao handle incident response?


**Ứng viên:** Critical security incident cần immediate action:


**Immediate Response (0-2 hours):**


1. **Assess Scope:**

Identify affected posts/users
Check if vulnerability is being exploited
Determine attack vector
2. **Contain Threat:**

Deploy emergency sanitization fix
Add additional CSP headers
Rate limit suspicious activities
3. **Communicate:**

Alert security team và management
Prepare user communication
Coordinate với legal team nếu cần


**Short-term (2-24 hours):**


1. **Patch and Deploy:**

Implement comprehensive fix
Deploy via emergency pipeline
Test fix thoroughly
2. **Clean Existing Data:**

Identify và sanitize compromised content
Review audit logs
Check for data exfiltration


**Long-term (1-7 days):**


1. **Security Review:**

Comprehensive security audit
Review similar vulnerabilities
Update security guidelines
2. **Process Improvement:**

Enhance security testing
Update incident response procedures
Security training cho team


**Prevention:**


- Automated security scanning in CI/CD
- Regular penetration testing
- Security-focused code reviews


**Người phỏng vấn:** Perfect incident response plan! Shows understanding của both technical và business implications.


---


### Final Assessment & Feedback


**[15:58 - Final Assessment]**


**Người phỏng vấn:** Excellent performance overall! Let me share my assessment:


**Strengths:**


1. **Systematic Approach:** RADIO framework execution was outstanding. Bạn thoroughly explored requirements trước khi jumping to solutions.
2. **Technical Depth:** Implementation details show senior-level understanding - virtual scrolling, normalization, optimistic updates, real-time architecture.
3. **Production Awareness:** Security considerations, monitoring, deployment strategy, error handling - tất cả show production experience.
4. **Trade-off Analysis:** Consistently analyzed pros/cons của different approaches thay vì just picking one solution.
5. **Scalability Thinking:** Considered performance implications và optimization strategies throughout.


**Areas for Growth:**


1. **Mobile Considerations:** Could dive deeper vào mobile-specific optimizations và PWA features.
2. **Accessibility:** Mentioned briefly nhưng could elaborate more on comprehensive accessibility strategy.
3. **Internationalization:** Không mention multi-language support and localization challenges.


**Overall Assessment: STRONG HIRE**


Bạn demonstrate clear senior-level frontend system design capabilities. Technical implementation shows deep React ecosystem knowledge, architecture decisions are well-reasoned, và production considerations are comprehensive.


**Ứng viên:** Thank you so much cho detailed feedback! This was a really engaging discussion. Về mobile và accessibility - em agree những areas đó deserve deeper exploration. Em đã focus primarily on web experience nhưng recognize rằng modern News Feed cần mobile-first approach.


Về internationalization, đó là excellent point em missed. Text direction (RTL), font loading for different scripts, và cultural content considerations would be critical cho global scale.


Em really enjoyed diving deep vào technical implementation details while keeping business impact in mind. Thank you for the thoughtful questions và guidance throughout!


**Người phỏng vấn:** You're very welcome! Your self-awareness về areas for improvement shows great growth mindset. The technical depth combined với practical considerations made this one của the stronger system design interviews I've conducted.


We'll follow up về next steps trong the process. Do you have any questions about the role hoặc the team?


**Ứng viên:** Yes! Em would love để learn more about:


1. **Team Structure:** How does Frontend Platform team collaborate với product teams?
2. **Technology Evolution:** What's the roadmap cho adopting new technologies like React Server Components?
3. **Scale Challenges:** What are current biggest technical challenges the team is facing?


**Người phỏng vấn:** Great questions! Briefly:


1. **Team Structure:** We work embedded với product teams while maintaining platform consistency. Mix của consultative support và direct contribution.
2. **Technology:** Actively exploring RSC for better performance. Gradual migration approach với backward compatibility.
3. **Scale:** Current focus on edge computing và micro-frontend architecture để handle growth.


More details trong next round với engineering manager!


**Ứng viên:** Perfect! Looking forward to continue the conversation. Thank you again cho excellent interview experience!


**Người phỏng vấn:** Thank you và good luck! I'm confident you'll do well trong remaining rounds.


---


**[16:00 - Cuộc phỏng vấn kết thúc]**


## Tổng Kết


Cuộc phỏng vấn Front-end System Design này demonstrate comprehensive approach to building large-scale applications. Key takeaways:


**Technical Excellence:**


- Systematic requirements exploration
- Thoughtful architecture design
- Deep implementation knowledge
- Production-ready optimizations


**Senior-Level Thinking:**


- Trade-off analysis
- Scalability considerations
- Security awareness
- Monitoring strategy


**Communication Skills:**


- Clear problem articulation
- Collaborative approach
- Self-awareness và growth mindset
- Business impact consideration


The interview successfully assessed candidate's ability to design, implement, và scale complex frontend systems while maintaining focus on user experience và business value.
