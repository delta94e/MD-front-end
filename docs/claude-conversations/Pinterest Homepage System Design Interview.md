# Pinterest Homepage System Design Interview

## You

Continue

## Claude


# Cuộc Phỏng Vấn Front-end System Design: Thiết Kế Pinterest Homepage với Masonry Layout


## Phần Mở Đầu - Giới thiệu & Thiết lập Kỳ vọng


**Người phỏng vấn:** Xin chào! Tôi là Alex Nguyen, hiện đang làm Senior Staff Engineer tại Meta, team Instagram. Tôi có 8 năm kinh nghiệp trong việc xây dựng các hệ thống frontend quy mô lớn, đặc biệt là các ứng dụng social media và visual discovery platforms như Instagram, Pinterest. Hôm nay tôi sẽ phỏng vấn bạn về Front-end System Design.


**Ứng viên:** Xin chào Alex! Rất vui được gặp anh. Tôi là Minh, hiện đang làm Senior Frontend Engineer tại Shopee với 5 năm kinh nghiệm chuyên về React và JavaScript. Trước đây tôi cũng đã làm việc với các ứng dụng có tính chất visual-heavy như e-commerce platforms và có kinh nghiệm với image optimization và responsive layouts.


**Người phỏng vấn:** Tuyệt vời! Trước khi bắt đầu, tôi muốn giải thích quy trình phỏng vấn hôm nay. Chúng ta sẽ có 90 phút để thảo luận về một bài toán Front-end System Design. Tôi sẽ sử dụng RADIO framework để structure cuộc thảo luận:


- **R**equirements exploration (15 phút) - Khám phá yêu cầu
- **A**rchitecture / High-level design (18 phút) - Kiến trúc tổng quan
- **D**ata model (9 phút) - Mô hình dữ liệu
- **I**nterface definition (13 phút) - Định nghĩa API/giao diện
- **O**ptimizations and deep dive (35 phút) - Tối ưu hóa và đi sâu


Tôi sẽ đánh giá bạn theo 6 tiêu chí chính: Problem exploration, Architecture design, Technical proficiency, Tradeoff analysis, Product/UX sense, và Communication skills. Đừng ngại hỏi clarifying questions - việc này thực sự quan trọng trong system design.


**Ứng viên:** Cảm ơn anh đã explain rõ ràng! Tôi đã familiar với RADIO framework và rất mong được thảo luận collaborative cùng anh. Tôi sẽ cố gắng think out loud và engage anh trong quá trình problem-solving.


**Người phỏng vấn:** Perfect! Trước khi dive vào bài toán chính, tôi muốn warm-up một chút. Bạn đã từng làm việc với visual-heavy applications như image galleries hay feed-based systems chưa? Có challenges nào đặc biệt không?


**Ứng viên:** Có ạ! Tại Shopee, tôi đã work on product gallery và listing pages với rất nhiều images. Main challenges mà tôi encounter bao gồm:


1. **Performance issues** với large image datasets - phải implement lazy loading và image optimization
2. **Layout shifts** khi images load với different aspect ratios
3. **Memory leaks** khi user scroll through thousands of products
4. **Mobile responsiveness** với varying screen sizes và orientations


Tôi đã solve bằng cách sử dụng React.memo, intersection observer APIs, virtual scrolling, và responsive image techniques với srcset.


**Người phỏng vấn:** Excellent! Những experiences này sẽ rất valuable cho bài toán hôm nay. Bạn có biết gì về masonry layouts không? Ví dụ như Pinterest homepage?


**Ứng viên:** Ah yes! Masonry layout là một kiểu layout grid where items có different heights nhưng same width, được arrange để minimize white space. Pinterest is the classic example - images được place in columns nhưng không follow strict rows, tạo ra organic, staggered appearance.


Main technical challenges tôi biết về masonry layouts:


- **Dynamic positioning** - không thể rely on normal CSS flow
- **Performance** với large number của items
- **Responsive behavior** khi number of columns changes
- **Accessibility** concerns với tab order


**Người phỏng vấn:** Rất tốt! Kiến thức foundation của bạn về domain này khá solid. Bây giờ chúng ta sẽ dive vào bài toán chính.


---


## Bài Toán Chính: Thiết Kế Pinterest Homepage với Masonry Layout


**Người phỏng vấn:** Hôm nay chúng ta sẽ thiết kế Pinterest homepage với focus chính là masonry layout. Đây là một bài toán rất thực tế - Pinterest là một trong những platforms lớn nhất sử dụng masonry layout, và nhiều companies khác cũng muốn implement similar visual discovery experiences.


Bài toán: "Thiết kế front-end system cho Pinterest homepage, với focus chính là masonry layout implementation. System cần support infinite scrolling, responsive design, và good performance với thousands of pins."


Hãy bắt đầu với RADIO framework nhé!


---


## [RADIO Phase: Requirements] - Khám phá Yêu Cầu (15 phút)


**Ứng viên:** Perfect! Trước khi start designing, tôi muốn clarify requirements để ensure tôi build đúng thứ bạn expect. Let me ask some questions:


**Core functionality questions:**


1. Khi bạn nói "Pinterest homepage", có phải là main feed page where users discover new pins không? Hay là personalized home page của individual users?
2. "Masonry layout" - bao nhiêu columns chúng ta target cho different screen sizes?
3. "Infinite scrolling" - chúng ta load bao nhiêu pins initially, và load thêm bao nhiêu khi user scroll?


**Người phỏng vấn:** Good questions! Đây chính xác là problem exploration signal tôi muốn thấy.


1. Đúng, đây là main discovery feed - personalized homepage where users see curated pins based on their interests
2. Responsive: 2 columns trên mobile, 3-4 columns trên tablet, 5-6 columns trên desktop wide screens
3. Load 20-25 pins initially, sau đó load 20 pins mỗi lần scroll near bottom


**Ứng viên:** Cảm ơn! Tiếp tục với requirements:


**Performance & Scale questions:**
4. Scale - chúng ta expect bao nhiêu concurrent users và pins trong system?
5. Pin content - chỉ images hay có videos, GIFs? Image sizes và formats?
6. Real-time updates - pins cần update live hay static sau khi load?


**Device & Platform questions:**
7. Target devices - primarily desktop hay mobile-first?
8. Browser support requirements?
9. Offline capabilities cần thiết không?


**Người phỏng vấn:** Excellent clarifying questions! Đây shows good systematic thinking.


1. Scale: 100M+ monthly active users, billions of pins trong hệ thống
2. Focus on images only cho interview này. Images vary từ small (200x300) đến large (1000x1500), mainly JPEG/PNG
3. Static content sau khi load - không cần real-time updates trong scope này
4. Desktop-first nhưng must work well trên mobile - responsive design critical
5. Modern browsers (Chrome, Firefox, Safari recent versions)
6. Basic offline: cache loaded pins, nhưng không priority cho interview này


**Ứng viên:** Great! Một few more questions về user experience:


**UX & Interaction questions:**
10. Pin interactions - click to view details? Save/like functionality?
11. Loading states - skeleton screens hay spinners?
12. Error handling - failed image loads, network issues?
13. Search/filtering capabilities trong scope không?


**Người phỏng vấn:** Very thorough!


1. Yes - click để open pin modal với details, basic save/like actions
2. Skeleton screens preferred - better UX than spinners
3. Graceful degradation for failed loads, retry mechanisms
4. Out of scope cho interview này - focus on core masonry feed


**Ứng viên:** Perfect! Based on clarifications, let me summarize requirements:


### Functional Requirements:


**Core Features:**


- Personalized pin discovery feed với masonry layout
- Responsive design: 2 columns (mobile) → 6 columns (desktop)
- Infinite scrolling: 20-25 pins initial, 20 pins per subsequent load
- Pin interactions: click for details modal, save/like actions
- Image optimization cho varying sizes và aspect ratios


**Good-to-Have:**


- Advanced interactions (share, comment)
- Filtering/search integration
- Enhanced offline capabilities


### Non-Functional Requirements:


**Performance:**


- Support 100M+ monthly active users
- Fast initial load time (<3 seconds LCP)
- Smooth scrolling performance (60fps)
- Efficient memory usage với large datasets


**Scalability:**


- Handle billions của pins trong backend
- Client-side pagination efficient
- Component architecture scalable


**Reliability:**


- Graceful error handling
- Network resilience
- Cross-browser compatibility


**UX Quality:**


- Responsive design across devices
- Accessibility compliance (keyboard navigation, screen readers)
- Loading states và error messages
- No layout shifts during image loading


**Người phỏng vấn:** Excellent requirements exploration! Bạn đã cover tất cả major aspects và asked thoughtful clarifying questions. Đây là strong signal của problem exploration skills - bạn didn't jump straight to solution mà took time để understand requirements thoroughly.


Particularly impressive:


- Systematic approach to questioning (core functionality → performance → UX)
- Considered scale implications early
- Thought about edge cases (error handling, failed loads)
- Balanced functional vs non-functional requirements


Một small note: trong real interviews, bạn có thể also ask về business constraints (timeline, team size) nhưng for technical interview, focus như này is perfect.


Ready để move to Architecture phase?


**Ứng viên:** Cảm ơn feedback! Yes, ready để design architecture. Tôi có foundation solid about requirements rồi.


---


## [RADIO Phase: Architecture] - Kiến trúc / Thiết kế Tổng quan (18 phút)


**[Timestamp: 15:00 - 33:00]**


**Ứng viên:** Bây giờ tôi sẽ design high-level architecture cho Pinterest homepage. Let me think through key components và their responsibilities.


### High-Level System Architecture


**Ứng viên:** Tôi sẽ approach này như một modern React SPA với several key layers:


```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   UI Layer      │  │  Application    │  │   Data Layer    │ │
│  │                 │  │   Logic         │  │                 │ │
│  │  - HomePage     │  │                 │  │  - Store        │ │
│  │  - MasonryGrid  │  │  - Controllers  │  │  - Cache        │ │
│  │  - PinCard      │  │  - Services     │  │  - State Mgmt   │ │
│  │  - Modal        │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                        ┌─────────────┐
                        │   NETWORK   │
                        └─────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                       SERVER                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   API Gateway   │  │  Business Logic │  │   Data Store    │ │
│  │                 │  │                 │  │                 │ │
│  │  - Feed API     │  │  - Recommendation│  │  - Pin DB       │ │
│  │  - Auth API     │  │  - Personalization│  │  - User DB      │ │
│  │  - Image API    │  │  - Analytics    │  │  - CDN          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```


**Người phỏng vấn:** Good start! Tôi like việc bạn separate concerns clearly. Có thể drill down vào client-side architecture không? Đặc biệt là UI Layer components?


### Client-Side Component Architecture


**Ứng viên:** Absolutely! Let me detail client-side component hierarchy:


```javascript
// Component Hierarchy
PinterestApp
├── AppProvider (Context, routing, global state)
├── Header (navigation, search, user menu)
├── HomePage
    ├── FeedContainer
    │   ├── MasonryGrid (main layout component)
    │   │   ├── MasonryColumn (individual columns)
    │   │   │   └── PinCard (individual pin items)
    │   │   └── InfiniteScrollTrigger
    │   ├── LoadingSkeletons
    │   └── ErrorBoundary
    ├── PinModal (pin details overlay)
    └── SidePanel (related pins, user info)
```


### Key Component Responsibilities:


**1. MasonryGrid Component:**


- **Primary responsibility:** Layout management và positioning logic
- Calculate column positions based on screen size
- Manage virtual scrolling for performance
- Handle responsive breakpoints
- Coordinate với infinite scroll


**2. MasonryColumn Component:**


- Represent individual columns trong grid
- Track column height for balancing
- Contain multiple PinCard components
- Handle column-specific loading states


**3. PinCard Component:**


- Display individual pin content
- Handle user interactions (click, hover, save)
- Lazy load images với intersection observer
- Manage loading và error states
- Optimize re-renders với React.memo


**4. FeedContainer:**


- Orchestrate data fetching
- Manage infinite scroll pagination
- Handle feed-level state (loading, error)
- Coordinate với global state management


**Người phỏng vấn:** Great component breakdown! Tôi particularly like việc bạn considered virtual scrolling và separated layout logic. Một question: tại sao bạn choose MasonryColumn approach instead của absolute positioning approach?


**Ứng viên:** Excellent question! Đây là important trade-off decision. Let me explain both approaches:


### Layout Strategy Trade-offs:


**Approach 1: Column-based Layout (My choice)**


```css
.masonry-grid {
  display: flex;
  gap: 16px;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```


**Pros:**


- Browser handles positioning automatically
- Easier responsive behavior
- Less complex JavaScript calculations
- Better for accessibility (natural tab order)
- Simpler to implement và debug


**Cons:**


- Less precise control over item placement
- Potential for uneven column heights
- Round-robin distribution might not be optimal


**Approach 2: Absolute Positioning**


```css
.masonry-grid {
  position: relative;
}

.pin-card {
  position: absolute;
  top: ${calculatedTop}px;
  left: ${calculatedLeft}px;
}
```


**Pros:**


- Precise control over placement
- Can implement height-balancing algorithms
- Better space utilization
- More similar to Pinterest's actual implementation


**Cons:**


- Complex JavaScript calculations
- Accessibility challenges (tab order)
- Responsive transitions more difficult
- Performance overhead từ position calculations


**My Decision:** Tôi started với column-based approach cho prototype, nhưng for production Pinterest-scale application, absolute positioning would be better. Want me to redesign với absolute positioning approach?


**Người phỏng vấn:** That's an excellent analysis of trade-offs! Đây exactly là kind của reasoning tôi want to see. For Pinterest scale với millions of pins, absolute positioning is indeed more optimal. Let's continue với column approach for now nhưng keep absolute positioning considerations.


Bây giờ, làm sao về data flow và state management strategy?


### State Management Architecture


**Ứng viên:** Good question! Với complexity của Pinterest homepage, tôi sẽ use combination of local và global state management:


```javascript
// Global State Structure (using Zustand or Redux Toolkit)
interface AppState {
  // Feed state
  feed: {
    pins: Pin[];
    loading: boolean;
    error: string | null;
    pagination: {
      currentPage: number;
      hasMore: boolean;
      cursor: string;
    };
    filters: FeedFilters;
  };

  // UI state
  ui: {
    selectedPin: Pin | null;
    modalOpen: boolean;
    layout: {
      columns: number;
      columnWidth: number;
      gaps: number;
    };
    viewport: {
      width: number;
      height: number;
    };
  };

  // User state
  user: {
    profile: UserProfile;
    preferences: UserPreferences;
    savedPins: string[];
  };
}
```


### State Management Strategy:


**Global State (Zustand):**


- Feed data và pagination
- User authentication và preferences
- Modal state for pin details
- Layout configuration


**Local State (useState/useReducer):**


- Component-specific UI states
- Form inputs
- Loading states for individual pins
- Scroll position tracking


**Server State (React Query):**


- API data fetching và caching
- Background refetching
- Optimistic updates for user actions
- Error handling và retries


**Người phỏng vấn:** Solid state management strategy! Tôi like việc bạn separated concerns between different state types. React Query cho server state is particularly good choice for Pinterest use case.


Một question về architecture decisions: Single Page App vs Multi-Page App vs Micro-frontends? And why?


**Ứng viên:** Great architectural question! Let me analyze options:


### Application Architecture Decisions:


**SPA (Single Page App) - My Recommendation:**


**Why SPA cho Pinterest:**


- **User experience:** Smooth navigation without page refreshes
- **State preservation:** Maintain scroll position, loaded pins khi navigate
- **Shared resources:** Common components, cached data across routes
- **Performance:** Faster subsequent navigation sau initial load


**Implementation with React Router:**


```javascript
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pin/:id" element={<PinDetails />} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </BrowserRouter>
  );
}
```


**Critical SPA consideration cho Pinterest:**


- **Deep linking:** Pin URLs must work (pinterest.com/pin/123456)
- **Modal handling:** Pin modal overlay nhưng URL changes
- **Back button:** Proper history management


**MPA (Multi-Page App):**


- **Pros:** Better SEO, simpler server-side routing
- **Cons:** Lost state between pages, slower navigation, more complex data synchronization


**Micro-frontends:**


- **Pros:** Team autonomy, independent deployments, technology diversity
- **Cons:** Complexity overhead, shared state challenges, bundle duplication


**For Pinterest scale, SPA is optimal** với some hybrid considerations:


- Server-side rendering for initial page load (Next.js)
- Progressive enhancement for JavaScript-disabled users
- Strategic page boundaries (authentication flows as separate MPAs)


**Người phỏng vấn:** Excellent reasoning! Your SPA choice is well-justified, và I particularly appreciate việc bạn considered deep linking và URL management - these are often overlooked trong interviews nhưng critical for Pinterest.


Let's dive into data fetching strategy. How do you handle infinite scrolling với Pinterest's massive dataset?


### Data Fetching & Infinite Scroll Architecture


**Ứng viên:** Critical question cho Pinterest scale! Here's my approach:


```javascript
// Custom hook for infinite scrolling
function useInfiniteScroll() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);

  const loadMorePins = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchPins({
        cursor,
        limit: 20,
        userId: currentUser.id
      });

      setPins(prev => [...prev, ...response.pins]);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore]);

  return { pins, loading, hasMore, loadMorePins };
}
```


**Infinite Scroll Strategies:**


**1. Intersection Observer Pattern:**


```javascript
function InfiniteScrollTrigger({ onLoadMore, hasMore }) {
  const triggerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  return <div ref={triggerRef} className="scroll-trigger" />;
}
```


**2. Preloading Strategy:**


- Load next batch when user reaches 80% of current content
- Preload images for better UX
- Background prefetching for likely next content


**3. Cursor-based Pagination:**


- More efficient than offset/limit for large datasets
- Consistent results even khi new pins are added
- Better database performance


**Người phỏng vấn:** Excellent! Your infinite scroll implementation is production-ready. The intersection observer approach với preloading strategy is exactly what Pinterest uses.


Tôi notice bạn mentioned image preloading - đây is crucial cho Pinterest. How do you approach image optimization và loading strategy cho masonry grid?


### Image Optimization Strategy


**Ứng viên:** Image optimization is absolutely critical cho Pinterest! Here's comprehensive strategy:


**1. Responsive Images với srcset:**


```javascript
function OptimizedImage({ pin, width, className }) {
  const getSrcSet = useCallback((pin) => {
    const { image } = pin;
    return [
      `${image.url_200} 200w`,
      `${image.url_400} 400w`,
      `${image.url_600} 600w`,
      `${image.url_800} 800w`
    ].join(', ');
  }, []);

  return (
    <img
      src={pin.image.url_400} // fallback
      srcSet={getSrcSet(pin)}
      sizes={`(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`}
      alt={pin.description}
      className={className}
      loading="lazy"
      onError={handleImageError}
    />
  );
}
```


**2. Progressive Loading với Blur Effect:**


```javascript
function ProgressiveImage({ pin }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Low-quality placeholder */}
      <img
        src={pin.image.placeholder} // 10x7 base64 blur
        className={`absolute inset-0 w-full h-full object-cover transition-opacity
          ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
        alt=""
      />

      {/* High-quality image */}
      <img
        src={pin.image.url}
        className={`w-full h-full object-cover transition-opacity duration-300
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        alt={pin.description}
      />

      {imageError && <ErrorPlaceholder />}
    </div>
  );
}
```


**3. Image Preloading Strategy:**


```javascript
function useImagePreloader(pins, preloadCount = 5) {
  useEffect(() => {
    // Preload next images off-screen
    pins.slice(0, preloadCount).forEach(pin => {
      if (pin.image?.url) {
        const img = new Image();
        img.src = pin.image.url;
      }
    });
  }, [pins, preloadCount]);
}
```


**Người phỏng vấn:** Outstanding image optimization strategy! The progressive loading với blur effect is exactly như Pinterest implements. Your technical proficiency về frontend performance is very strong.


Before we move to Data Model phase, any final thoughts về architecture? Are there any potential bottlenecks or scaling concerns?


**Ứng viên:** Great question! Let me identify key architectural challenges và solutions:


### Potential Bottlenecks & Solutions:


**1. Memory Leaks với Infinite Scroll:**


- **Problem:** Accumulating thousands of DOM nodes
- **Solution:** Virtual scrolling, DOM recycling
- **Implementation:** Only render visible + buffer items


**2. Layout Thrashing:**


- **Problem:** Frequent recalculations during scroll
- **Solution:** Debounced layout calculations, CSS transforms
- **Implementation:** RequestAnimationFrame batching


**3. State Management Complexity:**


- **Problem:** Deep component trees, prop drilling
- **Solution:** Context optimization, selective subscriptions
- **Implementation:** Multiple contexts by domain


**4. Bundle Size:**


- **Problem:** Large initial JavaScript bundle
- **Solution:** Code splitting by routes và features
- **Implementation:** React.lazy, dynamic imports


```javascript
// Code splitting example
const PinModal = lazy(() => import('./PinModal'));
const UserProfile = lazy(() => import('../UserProfile'));

// Feature-based splitting
const SearchFeature = lazy(() =>
  import('./SearchFeature').then(module => ({
    default: module.SearchContainer
  }))
);
```


**Người phỏng vấn:** Excellent architectural thinking! Bạn đã identified real bottlenecks và provided concrete solutions. Your approach to virtual scrolling và code splitting shows deep understanding của performance implications at scale.


Đặc biệt impressive là việc bạn considered memory management - đây often overlooked nhưng critical cho Pinterest với users scrolling through thousands of pins.


Ready để move to Data Model phase? Architecture foundation của bạn is very solid.


**Ứng viên:** Yes! Architecture discussions have been great. Ready để dive into data modeling.


---


## [RADIO Phase: Data Model] - Mô hình Dữ liệu (9 phút)


**[Timestamp: 33:00 - 42:00]**


**Ứng viên:** Bây giờ let me design data models cho Pinterest homepage. Tôi sẽ structure data theo client-server separation và identify essential entities.


### Core Data Entities


**1. Pin Entity (Server-originated):**


```javascript
interface Pin {
  // Core identifiers
  id: string;
  createdAt: string;
  updatedAt: string;

  // Content data
  title: string;
  description: string;
  altText: string;

  // Image data - critical cho masonry layout
  image: {
    url: string;
    width: number;
    height: number;
    aspectRatio: number;

    // Responsive variants
    variants: {
      small: { url: string; width: number; height: number; };
      medium: { url: string; width: number; height: number; };
      large: { url: string; width: number; height: number; };
      original: { url: string; width: number; height: number; };
    };

    // Performance optimization
    placeholder: string; // base64 blur placeholder
    dominantColor: string; // hex color for loading state
    format: 'jpeg' | 'png' | 'webp';
  };

  // User context
  author: {
    id: string;
    username: string;
    avatar: string;
    verified: boolean;
  };

  // Engagement metrics
  stats: {
    saves: number;
    clicks: number;
    shares: number;
  };

  // Pinterest-specific
  board: {
    id: string;
    name: string;
  };

  // Content classification
  tags: string[];
  category: string;

  // User interaction state
  userState?: {
    saved: boolean;
    clicked: boolean;
    viewedAt?: string;
  };
}
```


**Người phỏng vấn:** Great Pin entity! Tôi particularly like việc bạn included aspect ratio và responsive variants - those are critical cho masonry layout performance. The userState field is good thinking về personalization.


What about feed-level data structures?


**2. Feed Entity (Server-originated):**


```javascript
interface Feed {
  // Feed metadata
  id: string;
  type: 'home' | 'following' | 'category' | 'search';
  createdAt: string;

  // Content
  pins: Pin[];

  // Pagination data - critical cho infinite scroll
  pagination: {
    total: number;
    limit: number;
    offset: number;
    cursor: string | null;
    hasMore: boolean;
    nextPageUrl?: string;
  };

  // Performance tracking
  metadata: {
    loadTime: number;
    source: 'cache' | 'network';
    algorithm: string; // recommendation algorithm used
  };
}
```


**3. User Entity (Server-originated):**


```javascript
interface User {
  id: string;
  username: string;
  email: string;
  profile: {
    displayName: string;
    avatar: string;
    bio: string;
    verified: boolean;
    followersCount: number;
    followingCount: number;
  };

  // Personalization data
  preferences: {
    interests: string[];
    language: string;
    theme: 'light' | 'dark' | 'auto';

    // Layout preferences
    layout: {
      columnsPreference: number;
      imageQuality: 'low' | 'medium' | 'high';
      autoplayVideos: boolean;
    };
  };

  // Privacy settings
  privacy: {
    profilePublic: boolean;
    boardsPublic: boolean;
    showInSearch: boolean;
  };
}
```


### Client-Only Data Models


**Ứng viên:** Bây giờ cho client-specific data structures:


**1. Layout State (Client-only):**


```javascript
interface LayoutState {
  // Responsive layout
  viewport: {
    width: number;
    height: number;
    breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  };

  // Masonry configuration
  masonry: {
    columns: number;
    columnWidth: number;
    gap: number;
    containerWidth: number;

    // Column tracking cho absolute positioning
    columnHeights: number[];
    lastUpdate: number;
  };

  // Scroll state
  scroll: {
    position: number;
    direction: 'up' | 'down';
    velocity: number;
    isNearBottom: boolean;
  };

  // Virtualization
  virtualization: {
    visibleRange: { start: number; end: number; };
    bufferSize: number;
    itemHeight: number; // average
    totalHeight: number;
  };
}
```


**2. UI State (Client-only):**


```javascript
interface UIState {
  // Modal state
  modal: {
    isOpen: boolean;
    pinId: string | null;
    previousScrollPosition: number;
  };

  // Loading states
  loading: {
    initial: boolean;
    loadingMore: boolean;
    refreshing: boolean;
    error: string | null;
  };

  // User interactions
  interactions: {
    selectedPins: Set<string>;
    hoveredPin: string | null;
    focusedPin: string | null; // keyboard navigation
  };

  // Performance tracking
  performance: {
    renderTime: number;
    imagesLoaded: number;
    imagesTotal: number;
    memoryUsage?: number;
  };
}
```


**3. Cache State (Client-only):**


```javascript
interface CacheState {
  // Image cache
  images: Map<string, {
    blob: Blob;
    url: string;
    loadedAt: number;
    size: number;
  }>;

  // API cache
  apiCache: Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
    stale: boolean;
  }>;

  // Preloaded data
  preloaded: {
    pins: Pin[];
    images: string[];
    priority: 'high' | 'medium' | 'low';
  };
}
```


**Người phỏng vấn:** Excellent data modeling! Your separation of server vs client data is very clear, và you've captured essential performance-related fields. Particularly impressed with:


- **Masonry-specific fields** (columnHeights, aspectRatio)
- **Performance tracking** (render times, memory usage)
- **Virtualization state** (visible ranges, buffer management)
- **Cache management** với TTL và staleness


One question: How do you handle data consistency khi user actions affect server state? For example, saving a pin?


### Data Flow & Consistency


**Ứng viên:** Great question về data consistency! Here's my approach:


**Optimistic Updates Pattern:**


```javascript
// Optimistic update example cho pin save action
async function savePinOptimistic(pinId: string) {
  // 1. Immediate UI update
  updatePinInCache(pinId, { userState: { saved: true } });
  updateUIState({ saving: true });

  try {
    // 2. API call
    const result = await api.savePin(pinId);

    // 3. Confirm với server response
    updatePinInCache(pinId, result);
    showSuccessToast('Pin saved!');

  } catch (error) {
    // 4. Rollback on failure
    updatePinInCache(pinId, { userState: { saved: false } });
    showErrorToast('Failed to save pin');
  } finally {
    updateUIState({ saving: false });
  }
}
```


**Data Consistency Strategies:**


**1. Single Source of Truth:**


- Server data always authoritative
- Client cache as performance layer
- Periodic background sync


**2. Conflict Resolution:**


```javascript
interface DataSyncStrategy {
  onConflict: 'server-wins' | 'client-wins' | 'merge' | 'prompt-user';
  syncInterval: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number;
  };
}
```


**3. Cache Invalidation:**


```javascript
// Smart cache invalidation
function invalidateRelatedData(action: UserAction) {
  switch (action.type) {
    case 'SAVE_PIN':
      // Invalidate user's saved pins
      cache.invalidate(['user', 'saved-pins']);
      break;

    case 'FOLLOW_USER':
      // Invalidate following feed
      cache.invalidate(['feed', 'following']);
      break;

    case 'UPDATE_INTERESTS':
      // Invalidate personalized recommendations
      cache.invalidate(['feed', 'home']);
      break;
  }
}
```


**Người phỏng vấn:** Excellent consistency strategy! Your optimistic updates pattern với rollback capabilities shows good understanding của UX requirements. Cache invalidation strategy is also well thought out.


One more data modeling question: Storage requirements. Với thousands of pins trong memory, how do you prevent memory bloat?


### Memory Management Strategy


**Ứng viên:** Critical concern cho Pinterest scale! Here's memory management approach:


**1. Data Lifecycle Management:**


```javascript
interface DataLifecycle {
  // Tiered storage
  hotData: LRUCache<string, Pin>; // Recently viewed/interacted
  warmData: LRUCache<string, Pin>; // Visible on screen
  coldData: WeakMap<string, Pin>; // Background cached

  // Cleanup policies
  maxHotItems: number; // 100 pins
  maxWarmItems: number; // 500 pins
  maxColdItems: number; // 1000 pins

  // Memory pressure handling
  onMemoryPressure: () => {
    // Cleanup cold data first
    // Compress image cache
    // Release off-screen DOM nodes
  };
}
```


**2. Progressive Data Loading:**


```javascript
// Load data progressively based on visibility
interface PinDataLevel {
  minimal: Pick<Pin, 'id' | 'image' | 'title'>; // First load
  standard: Omit<Pin, 'stats' | 'userState'>; // Scroll into view
  complete: Pin; // User interaction
}
```


**3. Image Memory Management:**


```javascript
function manageImageMemory() {
  // Monitor memory usage
  if (navigator.memory?.usedJSHeapSize > MEMORY_THRESHOLD) {
    // Aggressive cleanup
    releaseOffScreenImages();
    compressImageCache();
    triggerGarbageCollection();
  }
}
```


**Người phỏng vấn:** Outstanding memory management approach! The tiered storage strategy với LRU caches is exactly what production Pinterest would need. Progressive data loading is also very smart.


Your data modeling phase shows strong technical depth. You've considered:


- ✅ **Proper entity relationships** với appropriate fields
- ✅ **Client vs server separation** với clear boundaries
- ✅ **Performance implications** (caching, memory management)
- ✅ **Consistency strategies** với conflict resolution
- ✅ **Scale considerations** (memory pressure, cleanup policies)


This demonstrates excellent **technical proficiency** and **architectural thinking**. Ready for Interface Definition phase?


**Ứng viên:** Cảm ơn! Data modeling discussions have been very insightful. Yes, ready để design APIs và component interfaces.


---


## [RADIO Phase: Interface Definition] - Định nghĩa Giao diện/API (13 phút)


**[Timestamp: 42:00 - 55:00]**


**Ứng viên:** Bây giờ tôi sẽ design both server APIs và client component interfaces cho Pinterest homepage system.


### Server-Client API Design


**1. Feed API - Core Pinterest Discovery:**


```javascript
// GET /api/v1/feed/home
interface FeedAPIRequest {
  // Pagination
  cursor?: string;
  limit?: number; // default 20, max 50

  // Personalization
  userId: string;
  interests?: string[];
  language?: string;

  // Quality filters
  imageMinWidth?: number;
  imageMinHeight?: number;
  contentType?: 'images' | 'videos' | 'all';

  // Performance optimization
  includeMetadata?: boolean;
  preloadNext?: boolean;
}

interface FeedAPIResponse {
  pins: Pin[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
  metadata: {
    algorithm: string;
    responseTime: number;
    source: 'cache' | 'fresh';
  };
  preloadHints?: {
    nextBatchUrls: string[];
    priorityImages: string[];
  };
}
```


**2. Pin Details API:**


```javascript
// GET /api/v1/pins/:pinId
interface PinDetailsAPIResponse {
  pin: Pin;
  related: Pin[]; // Related pins for sidebar
  analytics: {
    viewCount: number;
    saveCount: number;
    clickCount: number;
  };
  context: {
    board: Board;
    author: User;
    similarPins: Pin[];
  };
}

// POST /api/v1/pins/:pinId/save
interface PinSaveAPIRequest {
  boardId?: string; // Optional board to save to
  note?: string; // User's note on the pin
}

interface PinSaveAPIResponse {
  success: boolean;
  pin: Pin; // Updated với user state
  message: string;
}
```


**3. Image API với Optimization:**


```javascript
// GET /api/v1/images/:imageId
interface ImageAPIRequest {
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  format?: 'jpeg' | 'webp' | 'avif';

  // Progressive loading support
  progressive?: boolean;
  placeholder?: boolean; // Return blur placeholder
}

// Image URL pattern:
// /api/v1/images/abc123?w=400&h=600&q=medium&f=webp
```


**4. Real-time Updates API (WebSocket):**


```javascript
interface WebSocketMessage {
  type: 'pin-update' | 'feed-refresh' | 'user-action';
  data: {
    pinId?: string;
    userId?: string;
    action?: 'save' | 'unsave' | 'like' | 'share';
    timestamp: string;
  };
}

// WebSocket connection
const feedSocket = new WebSocket('/api/v1/feed/subscribe');
feedSocket.onmessage = (event) => {
  const message: WebSocketMessage = JSON.parse(event.data);
  handleRealTimeUpdate(message);
};
```


**Người phỏng vấn:** Great API design! Your image optimization parameters và real-time WebSocket integration show good understanding của Pinterest's requirements. What about error handling và rate limiting trong APIs?


**API Error Handling & Rate Limiting:**


```javascript
// Standardized error response
interface APIError {
  code: string;
  message: string;
  details?: any;
  retryAfter?: number; // For rate limiting
  traceId: string; // For debugging
}

// Rate limiting headers
interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
  'X-RateLimit-Policy': string;
}

// Example error responses
const errorResponses = {
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
    retryAfter: 60
  },

  PIN_NOT_FOUND: {
    status: 404,
    code: 'PIN_NOT_FOUND',
    message: 'Pin not found or deleted'
  },

  INVALID_CURSOR: {
    status: 400,
    code: 'INVALID_CURSOR',
    message: 'Pagination cursor is invalid or expired'
  }
};
```


### Client Component Interface Design


**Ứng viên:** Now for React component interfaces:


**1. MasonryGrid Component:**


```typescript
interface MasonryGridProps {
  // Data
  pins: Pin[];
  loading?: boolean;
  error?: string | null;

  // Layout configuration
  columns?: number | 'auto'; // Auto-calculate based on screen
  gap?: number; // Gap between items in pixels
  columnWidth?: number;

  // Infinite scroll
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingComponent?: React.ComponentType;

  // Virtualization
  virtualized?: boolean;
  overscan?: number; // Items to render outside visible area
  estimatedItemHeight?: number;

  // Event handlers
  onPinClick?: (pin: Pin, index: number) => void;
  onPinSave?: (pin: Pin) => void;
  onPinShare?: (pin: Pin) => void;

  // Customization
  renderPin?: (pin: Pin, index: number) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;

  // Performance
  memoizeItems?: boolean;
  lazyLoadImages?: boolean;

  // Accessibility
  ariaLabel?: string;
  announceLoading?: boolean;
}

// Usage example
<MasonryGrid
  pins={feedPins}
  columns="auto"
  gap={16}
  hasMore={hasMorePins}
  onLoadMore={loadMorePins}
  onPinClick={handlePinClick}
  virtualized={true}
  lazyLoadImages={true}
  ariaLabel="Pinterest feed"
/>
```


**2. PinCard Component:**


```typescript
interface PinCardProps {
  // Core data
  pin: Pin;
  index?: number; // For optimization và analytics

  // Display options
  width?: number;
  showAuthor?: boolean;
  showStats?: boolean;
  showSaveButton?: boolean;

  // Interaction handlers
  onClick?: (pin: Pin, event: React.MouseEvent) => void;
  onSave?: (pin: Pin) => void;
  onAuthorClick?: (author: User) => void;
  onImageLoad?: (pin: Pin) => void;
  onImageError?: (pin: Pin, error: Error) => void;

  // Image loading
  imageQuality?: 'low' | 'medium' | 'high';
  lazyLoad?: boolean;
  placeholder?: string | React.ComponentType;

  // State
  selected?: boolean;
  saved?: boolean;
  loading?: boolean;

  // Accessibility
  tabIndex?: number;
  ariaLabel?: string;

  // Performance
  memoized?: boolean;
  priority?: 'high' | 'normal' | 'low';

  // Customization
  className?: string;
  style?: React.CSSProperties;
  renderOverlay?: (pin: Pin) => React.ReactNode;
}

// Advanced PinCard với render props
<PinCard
  pin={pin}
  onSave={handleSave}
  lazyLoad={true}
  renderOverlay={(pin) => (
    <div className="pin-actions">
      <SaveButton pin={pin} />
      <ShareButton pin={pin} />
      <MoreOptionsButton pin={pin} />
    </div>
  )}
/>
```


**3. FeedContainer Component (Controller):**


```typescript
interface FeedContainerProps {
  // Feed configuration
  feedType?: 'home' | 'following' | 'category';
  userId?: string;
  category?: string;

  // Layout
  layout?: 'masonry' | 'grid' | 'list';
  responsive?: boolean;

  // Data fetching
  initialPins?: Pin[];
  refetchInterval?: number;
  cacheTime?: number;

  // Error handling
  onError?: (error: Error) => void;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;

  // Loading states
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;

  // Analytics
  onAnalyticsEvent?: (event: AnalyticsEvent) => void;
  trackingEnabled?: boolean;

  // Advanced features
  realTimeUpdates?: boolean;
  offlineMode?: boolean;

  children?: (props: FeedRenderProps) => React.ReactNode;
}

interface FeedRenderProps {
  pins: Pin[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  retry: () => void;
}

// Render props pattern for maximum flexibility
<FeedContainer
  feedType="home"
  userId={currentUser.id}
  realTimeUpdates={true}
>
  {({ pins, loading, error, hasMore, loadMore }) => (
    <MasonryGrid
      pins={pins}
      loading={loading}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
    />
  )}
</FeedContainer>
```


**Người phỏng vấn:** Excellent component interfaces! Your props design shows great attention to flexibility và developer experience. I particularly like:


- **Render props pattern** for maximum customization
- **Comprehensive error handling** với retry mechanisms
- **Performance props** (memoization, virtualization, lazy loading)
- **Accessibility considerations** built in


How about hooks để encapsulate complex logic?


### Custom Hooks Design


**Ứng viên:** Great question! Custom hooks sẽ encapsulate business logic và reusable behaviors:


**1. useMasonryLayout Hook:**


```typescript
interface UseMasonryLayoutOptions {
  columns?: number | 'auto';
  gap?: number;
  breakpoints?: Record<string, number>;
  strategy?: 'round-robin' | 'height-balanced';
}

interface MasonryLayout {
  // Layout calculation results
  columnCount: number;
  columnWidth: number;
  totalHeight: number;
  itemPositions: Array<{ top: number; left: number; width: number; height: number }>;

  // Layout state
  containerRef: RefObject<HTMLDivElement>;
  isCalculating: boolean;

  // Layout control
  recalculate: () => void;
  reset: () => void;

  // Event handlers
  onResize: () => void;
  onItemsChange: (items: any[]) => void;
}

function useMasonryLayout(
  items: Pin[],
  options: UseMasonryLayoutOptions = {}
): MasonryLayout {
  const [layout, setLayout] = useState({
    columnCount: 0,
    columnWidth: 0,
    totalHeight: 0,
    itemPositions: []
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateLayout = useCallback(async () => {
    if (!containerRef.current || !items.length) return;

    setIsCalculating(true);

    // Layout calculation logic
    const containerWidth = containerRef.current.offsetWidth;
    const { columns = 'auto', gap = 16, strategy = 'height-balanced' } = options;

    const columnCount = columns === 'auto'
      ? Math.floor(containerWidth / 250) // Min column width
      : columns;

    const columnWidth = (containerWidth - (columnCount - 1) * gap) / columnCount;
    const columnHeights = new Array(columnCount).fill(0);
    const itemPositions = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const aspectRatio = item.image.height / item.image.width;
      const itemHeight = columnWidth * aspectRatio;

      // Find shortest column (height-balanced strategy)
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

      itemPositions.push({
        top: columnHeights[shortestColumnIndex],
        left: shortestColumnIndex * (columnWidth + gap),
        width: columnWidth,
        height: itemHeight
      });

      columnHeights[shortestColumnIndex] += itemHeight + gap;
    }

    setLayout({
      columnCount,
      columnWidth,
      totalHeight: Math.max(...columnHeights),
      itemPositions
    });

    setIsCalculating(false);
  }, [items, options]);

  // Auto recalculate on resize
  useEffect(() => {
    const handleResize = debounce(calculateLayout, 250);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLayout]);

  // Recalculate when items change
  useEffect(() => {
    calculateLayout();
  }, [items, calculateLayout]);

  return {
    ...layout,
    containerRef,
    isCalculating,
    recalculate: calculateLayout,
    reset: () => setLayout({ columnCount: 0, columnWidth: 0, totalHeight: 0, itemPositions: [] }),
    onResize: calculateLayout,
    onItemsChange: calculateLayout
  };
}
```


**2. useInfiniteFeed Hook:**


```typescript
interface UseInfiniteFeedOptions {
  feedType: 'home' | 'category' | 'search';
  limit?: number;
  prefetchThreshold?: number;
  cacheTime?: number;
  staleTime?: number;
  retryDelay?: number;
}

interface InfiniteFeed {
  // Data state
  pins: Pin[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;

  // Feed control
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  prefetchNext: () => Promise<void>;

  // Metadata
  totalLoaded: number;
  currentPage: number;
  lastUpdated: Date | null;
}

function useInfiniteFeed(options: UseInfiniteFeedOptions): InfiniteFeed {
  const [state, setState] = useState({
    pins: [],
    loading: true,
    loadingMore: false,
    error: null,
    hasMore: true,
    currentPage: 0,
    cursor: null,
    lastUpdated: null
  });

  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, loadingMore: true, error: null }));

    try {
      const response = await fetchFeed({
        type: options.feedType,
        cursor: state.cursor,
        limit: options.limit || 20
      });

      setState(prev => ({
        ...prev,
        pins: [...prev.pins, ...response.pins],
        cursor: response.pagination.nextCursor,
        hasMore: response.pagination.hasMore,
        currentPage: prev.currentPage + 1,
        lastUpdated: new Date(),
        loadingMore: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loadingMore: false
      }));
    }
  }, [state.cursor, state.loadingMore, state.hasMore, options]);

  const refresh = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      pins: [],
      cursor: null,
      currentPage: 0,
      hasMore: true
    }));

    await loadMore();
    setState(prev => ({ ...prev, loading: false }));
  }, [loadMore]);

  // Auto-prefetch when near end
  const prefetchNext = useCallback(async () => {
    if (state.pins.length > 0 && state.hasMore && !state.loadingMore) {
      const threshold = options.prefetchThreshold || 0.8;
      // Prefetch logic
      await loadMore();
    }
  }, [state, options.prefetchThreshold, loadMore]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, [options.feedType]); // Reload when feed type changes

  return {
    pins: state.pins,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    refresh,
    retry: refresh,
    prefetchNext,
    totalLoaded: state.pins.length,
    currentPage: state.currentPage,
    lastUpdated: state.lastUpdated
  };
}
```


**3. usePinInteractions Hook:**


```typescript
interface UsePinInteractionsOptions {
  trackAnalytics?: boolean;
  optimisticUpdates?: boolean;
  errorRetry?: boolean;
}

interface PinInteractions {
  // Action handlers
  savePin: (pin: Pin, boardId?: string) => Promise<void>;
  unsavePin: (pin: Pin) => Promise<void>;
  sharePin: (pin: Pin, method: string) => Promise<void>;
  reportPin: (pin: Pin, reason: string) => Promise<void>;

  // State queries
  isPinSaved: (pinId: string) => boolean;
  getPinSaveCount: (pinId: string) => number;

  // Batch operations
  savePins: (pins: Pin[]) => Promise<void>;
  unsavePins: (pinIds: string[]) => Promise<void>;

  // Loading states
  savingPins: Set<string>;
  actionLoading: boolean;
  actionError: string | null;
}

function usePinInteractions(options: UsePinInteractionsOptions = {}): PinInteractions {
  const [savingPins, setSavingPins] = useState(new Set<string>());
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedPins, setSavedPins] = useState(new Set<string>());

  const savePin = useCallback(async (pin: Pin, boardId?: string) => {
    const pinId = pin.id;
    setSavingPins(prev => new Set([...prev, pinId]));
    setActionError(null);

    // Optimistic update
    if (options.optimisticUpdates) {
      setSavedPins(prev => new Set([...prev, pinId]));
    }

    try {
      await api.savePin(pinId, { boardId });

      // Confirm save
      setSavedPins(prev => new Set([...prev, pinId]));

      // Analytics
      if (options.trackAnalytics) {
        analytics.track('pin_saved', { pinId, boardId });
      }

    } catch (error) {
      // Rollback optimistic update
      if (options.optimisticUpdates) {
        setSavedPins(prev => {
          const newSet = new Set(prev);
          newSet.delete(pinId);
          return newSet;
        });
      }

      setActionError(error.message);

      // Retry logic
      if (options.errorRetry) {
        setTimeout(() => savePin(pin, boardId), 2000);
      }

    } finally {
      setSavingPins(prev => {
        const newSet = new Set(prev);
        newSet.delete(pinId);
        return newSet;
      });
    }
  }, [options, savedPins]);

  const isPinSaved = useCallback((pinId: string) => {
    return savedPins.has(pinId);
  }, [savedPins]);

  return {
    savePin,
    unsavePin: async (pin) => { /* Implementation */ },
    sharePin: async (pin, method) => { /* Implementation */ },
    reportPin: async (pin, reason) => { /* Implementation */ },
    isPinSaved,
    getPinSaveCount: (pinId) => 0, // From cache
    savePins: async (pins) => { /* Batch implementation */ },
    unsavePins: async (pinIds) => { /* Batch implementation */ },
    savingPins,
    actionLoading,
    actionError
  };
}
```


**Người phỏng vấn:** Outstanding hook design! Your custom hooks demonstrate excellent **technical proficiency** và **separation of concerns**. Particularly impressed with:


- **useMasonryLayout**: Comprehensive layout calculation với performance considerations
- **useInfiniteFeed**: Complete infinite scroll implementation với caching và error handling
- **usePinInteractions**: Optimistic updates với rollback capabilities


Your interface design shows great **exploration of tradeoffs** - you've considered multiple approaches (render props, hooks, component composition) và explained when to use each.


The API design is also production-ready với proper error handling, rate limiting, và real-time capabilities.


Strong work on Interface Definition phase! Ready để move to the most important phase - Optimizations và Deep Dive?


**Ứng viên:** Cảm ơn! Interface discussions have been really insightful. Yes, excited để dive deep into optimizations - đây is where Pinterest really shines or falls apart depending on implementation quality.


---


## [RADIO Phase: Optimizations] - Tối ưu hóa và Đi Sâu (35 phút)


**[Timestamp: 55:00 - 90:00]**


**Người phỏng vấn:** Perfect! Đây is the most critical phase cho Pinterest homepage. With millions of pins và complex masonry layouts, performance optimization makes or breaks the user experience. Let's dive into the technical challenges và solutions.


### Performance Optimization Strategy


**Ứng viên:** Absolutely! Pinterest homepage có unique performance challenges. Let me break down optimization strategy theo priority:


**1. Critical Rendering Path Optimization:**


```javascript
// Initial page load optimization
class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      FCP: 0, // First Contentful Paint
      LCP: 0, // Largest Contentful Paint
      CLS: 0, // Cumulative Layout Shift
      FID: 0, // First Input Delay
      TTI: 0  // Time to Interactive
    };
  }

  // Critical CSS inlining cho above-the-fold content
  inlineCriticalCSS() {
    const criticalStyles = `
      .masonry-grid { display: flex; gap: 16px; }
      .masonry-column { flex: 1; display: flex; flex-direction: column; gap: 16px; }
      .pin-card { border-radius: 16px; overflow: hidden; }
      .pin-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); }
    `;

    const styleElement = document.createElement('style');
    styleElement.innerHTML = criticalStyles;
    document.head.appendChild(styleElement);
  }

  // Resource hints for faster loading
  addResourceHints() {
    // Preconnect to image CDN
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://i.pinimg.com';
    document.head.appendChild(preconnect);

    // DNS prefetch cho analytics
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
```


## Claude


```javascript
dnsPrefetch.href = 'https://analytics.pinterest.com';
   document.head.appendChild(dnsPrefetch);
 }

 // Preload critical images for initial viewport
 preloadCriticalImages(pins) {
   const visiblePins = pins.slice(0, 6); // First screen worth

   visiblePins.forEach((pin, index) => {
     const link = document.createElement('link');
     link.rel = 'preload';
     link.as = 'image';
     link.href = pin.image.variants.medium.url;
     link.fetchPriority = index < 3 ? 'high' : 'low';
     document.head.appendChild(link);
   });
 }
}
```


**Người phỏng vấn:** Good start with critical path optimization! The resource hints và preloading strategy is solid. But với masonry layout, one of the biggest challenges is layout shifts. How do you prevent CLS (Cumulative Layout Shift)?


**2. Layout Shift Prevention (CLS Optimization):**


**Ứng viên:** Absolutely critical cho Pinterest! Layout shifts destroy UX when images load. Here's comprehensive approach:


```javascript
// Advanced image loading với aspect ratio preservation
class AspectRatioImageLoader {
  constructor() {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
      rootMargin: '50px 0px', // Start loading 50px before visible
      threshold: 0.1
    });
  }

  // Calculate exact container height trước khi image loads
  calculateImageContainer(pin, containerWidth) {
    const { image } = pin;
    const aspectRatio = image.height / image.width;
    const calculatedHeight = containerWidth * aspectRatio;

    // Enforce min/max heights để prevent extreme ratios
    const minHeight = 100;
    const maxHeight = containerWidth * 2; // Max 2:1 ratio

    return {
      width: containerWidth,
      height: Math.max(minHeight, Math.min(calculatedHeight, maxHeight)),
      aspectRatio
    };
  }

  // Create placeholder với exact dimensions
  createPlaceholder(pin, dimensions) {
    const placeholder = document.createElement('div');
    placeholder.className = 'pin-placeholder';
    placeholder.style.cssText = `
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      background-color: ${pin.image.dominantColor};
      background-image: url('data:image/svg+xml,${this.createBlurSVG(pin)}');
      background-size: cover;
      background-position: center;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    `;

    return placeholder;
  }

  // Generate blur placeholder SVG
  createBlurSVG(pin) {
    const blurData = pin.image.placeholder; // Base64 blur from server
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pin.image.width} ${pin.image.height}">
      <image href="${blurData}" x="0" y="0" width="100%" height="100%" style="filter: blur(10px)"/>
    </svg>`;
  }

  // Progressive image reveal without layout shift
  async loadImageProgressively(pin, container, dimensions) {
    const img = new Image();

    // Setup image với exact dimensions
    img.style.cssText = `
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      object-fit: cover;
      object-position: center;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      position: absolute;
      top: 0;
      left: 0;
    `;

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Fade in real image over placeholder
        img.style.opacity = '1';
        container.appendChild(img);

        // Remove placeholder after transition
        setTimeout(() => {
          const placeholder = container.querySelector('.pin-placeholder');
          if (placeholder) placeholder.remove();
        }, 300);

        resolve(img);
      };

      img.onerror = () => {
        // Keep placeholder, show error state
        const errorOverlay = this.createErrorOverlay();
        container.appendChild(errorOverlay);
        reject(new Error('Image failed to load'));
      };

      // Start loading với appropriate quality
      const quality = this.determineImageQuality();
      img.src = pin.image.variants[quality].url;
      img.srcset = this.buildSrcSet(pin.image.variants);
    });
  }

  determineImageQuality() {
    // Adaptive quality based on connection và device
    if (navigator.connection) {
      const { effectiveType, downlink, rtt } = navigator.connection;

      if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
        return 'high';
      } else if (effectiveType === '3g' || downlink < 5) {
        return 'medium';
      }
    }

    // Default quality based on device pixel ratio
    return window.devicePixelRatio > 2 ? 'high' : 'medium';
  }
}
```


**Người phỏng vấn:** Excellent CLS prevention strategy! The aspect ratio calculation và progressive loading với blur placeholders is exactly how Pinterest handles this. I particularly like your adaptive quality determination.


Now let's talk about the core masonry layout implementation. Earlier bạn mentioned both column-based và absolute positioning approaches. At Pinterest scale, which would you choose và why?


### Advanced Masonry Layout Implementation


**Ứng viên:** Great question! At Pinterest scale với millions of pins, absolute positioning is optimal. Let me implement production-ready masonry algorithm:


```javascript
// Production-grade Masonry Layout Engine
class MasonryLayoutEngine {
  constructor(options = {}) {
    this.options = {
      columnWidth: 236, // Pinterest's actual column width
      gap: 8, // Pinterest's gap
      containerPadding: 16,
      strategy: 'height-balanced', // vs 'round-robin'
      responsive: true,
      virtualScroll: true,
      ...options
    };

    this.state = {
      columns: 0,
      columnHeights: [],
      itemPositions: new Map(),
      containerHeight: 0,
      visibleRange: { start: 0, end: 50 },
      layoutCache: new Map() // Cache calculations for performance
    };

    this.breakpoints = {
      mobile: { maxWidth: 767, columns: 2 },
      tablet: { maxWidth: 1023, columns: 3 },
      desktop: { maxWidth: 1439, columns: 4 },
      wide: { maxWidth: Infinity, columns: 6 }
    };

    this.perfMonitor = new PerformanceMonitor();
  }

  // Calculate optimal layout dengan height balancing
  calculateLayout(pins, containerWidth) {
    const startTime = performance.now();

    // Check cache first
    const cacheKey = `${containerWidth}-${pins.length}`;
    if (this.state.layoutCache.has(cacheKey)) {
      return this.state.layoutCache.get(cacheKey);
    }

    // Determine responsive columns
    const columns = this.getResponsiveColumns(containerWidth);
    const { columnWidth, gap } = this.calculateDimensions(containerWidth, columns);

    // Initialize column heights tracking
    const columnHeights = new Array(columns).fill(this.options.containerPadding);
    const itemPositions = [];

    // Height-balanced placement algorithm
    pins.forEach((pin, index) => {
      const position = this.calculateItemPosition(
        pin,
        index,
        columnWidth,
        columnHeights,
        gap
      );

      itemPositions.push(position);

      // Update column height
      const columnIndex = position.column;
      columnHeights[columnIndex] = position.top + position.height + gap;
    });

    const layout = {
      columns,
      columnWidth,
      gap,
      itemPositions,
      containerHeight: Math.max(...columnHeights),
      totalItems: pins.length
    };

    // Cache calculation
    this.state.layoutCache.set(cacheKey, layout);

    // Performance monitoring
    const calcTime = performance.now() - startTime;
    this.perfMonitor.recordLayoutTime(calcTime, pins.length);

    return layout;
  }

  calculateItemPosition(pin, index, columnWidth, columnHeights, gap) {
    const { image } = pin;

    // Calculate item dimensions
    const aspectRatio = image.height / image.width;
    let itemHeight = columnWidth * aspectRatio;

    // Apply Pinterest's boundary constraints
    itemHeight = this.constrainHeight(itemHeight, columnWidth);

    // Find shortest column (height-balanced strategy)
    const shortestColumnIndex = this.findShortestColumn(columnHeights);

    // Calculate position
    const position = {
      id: pin.id,
      index,
      column: shortestColumnIndex,
      top: columnHeights[shortestColumnIndex],
      left: shortestColumnIndex * (columnWidth + gap) + this.options.containerPadding,
      width: columnWidth,
      height: itemHeight,
      aspectRatio,
      priority: this.calculateLoadPriority(index, shortestColumnIndex)
    };

    return position;
  }

  // Pinterest's height constraints to prevent extreme ratios
  constrainHeight(calculatedHeight, columnWidth) {
    const minHeight = 60; // Pinterest's minimum
    const maxHeight = columnWidth * 3.5; // Pinterest's maximum ratio

    return Math.max(minHeight, Math.min(calculatedHeight, maxHeight));
  }

  // Advanced column selection với load balancing
  findShortestColumn(columnHeights) {
    let shortestIndex = 0;
    let shortestHeight = columnHeights[0];

    for (let i = 1; i < columnHeights.length; i++) {
      // Add small randomization để prevent patterns
      const adjustedHeight = columnHeights[i] + (Math.random() - 0.5) * 2;

      if (adjustedHeight < shortestHeight) {
        shortestHeight = adjustedHeight;
        shortestIndex = i;
      }
    }

    return shortestIndex;
  }

  // Responsive column calculation
  getResponsiveColumns(containerWidth) {
    for (const [breakpoint, config] of Object.entries(this.breakpoints)) {
      if (containerWidth <= config.maxWidth) {
        return config.columns;
      }
    }
    return this.breakpoints.wide.columns;
  }

  calculateDimensions(containerWidth, columns) {
    const { gap, containerPadding } = this.options;
    const availableWidth = containerWidth - (containerPadding * 2);
    const totalGaps = (columns - 1) * gap;
    const columnWidth = Math.floor((availableWidth - totalGaps) / columns);

    return { columnWidth, gap };
  }

  // Calculate loading priority for images
  calculateLoadPriority(itemIndex, columnIndex) {
    // First screen items get high priority
    if (itemIndex < 10) return 'high';

    // Center columns get medium priority
    if (columnIndex === 1 || columnIndex === 2) return 'medium';

    return 'low';
  }
}
```


**Người phỏng vấn:** Impressive implementation! Your height balancing algorithm với constraints mirrors Pinterest's actual approach. The caching và performance monitoring show good engineering practices.


But với thousands of items, DOM performance becomes critical. How do you handle virtual scrolling trong masonry layout?


### Virtual Scrolling for Masonry Layout


**Ứng viên:** Virtual scrolling in masonry is tricky because items have variable heights! Here's advanced implementation:


```javascript
// Advanced Virtual Masonry Scroller
class VirtualMasonryScroller {
  constructor(container, layoutEngine, options = {}) {
    this.container = container;
    this.layoutEngine = layoutEngine;
    this.options = {
      overscan: 5, // Items to render outside visible area
      bufferSize: 20, // Items to keep in memory
      recycleThreshold: 100, // When to start recycling DOM nodes
      estimatedHeight: 300, // Estimated item height for calculations
      ...options
    };

    this.state = {
      scrollTop: 0,
      visibleRange: { start: 0, end: 50 },
      renderedItems: new Map(), // DOM nodes currently rendered
      itemPool: [], // Recycled DOM nodes
      viewport: { width: 0, height: 0 },
      totalHeight: 0
    };

    this.setupScrollListener();
    this.setupResizeObserver();
  }

  // Calculate which items should be visible
  calculateVisibleRange(scrollTop, viewportHeight, layout) {
    const { itemPositions } = layout;
    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + viewportHeight;

    let startIndex = 0;
    let endIndex = itemPositions.length - 1;

    // Binary search for start index
    let left = 0, right = itemPositions.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const itemTop = itemPositions[mid].top;
      const itemBottom = itemTop + itemPositions[mid].height;

      if (itemBottom >= visibleTop) {
        startIndex = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // Binary search for end index
    left = startIndex;
    right = itemPositions.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const itemTop = itemPositions[mid].top;

      if (itemTop <= visibleBottom) {
        endIndex = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // Add overscan buffer
    const overscan = this.options.overscan;
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(itemPositions.length - 1, endIndex + overscan)
    };
  }

  // Efficient DOM recycling system
  recycleOrCreateItem(pin, position) {
    let itemElement;

    // Try to recycle existing DOM node
    if (this.state.itemPool.length > 0) {
      itemElement = this.state.itemPool.pop();
      this.updateItemContent(itemElement, pin);
    } else {
      itemElement = this.createItemElement(pin);
    }

    // Update position
    this.positionItem(itemElement, position);

    return itemElement;
  }

  createItemElement(pin) {
    const element = document.createElement('div');
    element.className = 'masonry-item';
    element.setAttribute('data-pin-id', pin.id);

    // Create pin content
    const content = this.renderPinContent(pin);
    element.appendChild(content);

    return element;
  }

  updateItemContent(element, pin) {
    element.setAttribute('data-pin-id', pin.id);

    // Update image source efficiently
    const img = element.querySelector('img');
    if (img && img.src !== pin.image.variants.medium.url) {
      img.src = pin.image.variants.medium.url;
      img.alt = pin.description;
    }

    // Update text content
    const title = element.querySelector('.pin-title');
    if (title) title.textContent = pin.title;
  }

  positionItem(element, position) {
    // Use CSS transforms for better performance
    element.style.transform = `translate3d(${position.left}px, ${position.top}px, 0)`;
    element.style.width = `${position.width}px`;
    element.style.height = `${position.height}px`;
    element.style.position = 'absolute';
    element.style.willChange = 'transform'; // GPU acceleration hint
  }

  // Main render method
  render(pins, forceUpdate = false) {
    const layout = this.layoutEngine.calculateLayout(pins, this.container.offsetWidth);
    const visibleRange = this.calculateVisibleRange(
      this.state.scrollTop,
      this.container.offsetHeight,
      layout
    );

    // Skip render if range hasn't changed (unless forced)
    if (!forceUpdate && this.rangesEqual(visibleRange, this.state.visibleRange)) {
      return;
    }

    const startTime = performance.now();

    // Remove items that are no longer visible
    this.recycleInvisibleItems(visibleRange);

    // Render newly visible items
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (!this.state.renderedItems.has(i)) {
        const pin = pins[i];
        const position = layout.itemPositions[i];
        const element = this.recycleOrCreateItem(pin, position);

        this.container.appendChild(element);
        this.state.renderedItems.set(i, element);
      }
    }

    // Update container height for scrollbar
    this.container.style.height = `${layout.containerHeight}px`;

    // Update state
    this.state.visibleRange = visibleRange;
    this.state.totalHeight = layout.containerHeight;

    // Performance monitoring
    const renderTime = performance.now() - startTime;
    this.perfMonitor.recordRenderTime(renderTime, visibleRange.end - visibleRange.start);
  }

  recycleInvisibleItems(newVisibleRange) {
    for (const [index, element] of this.state.renderedItems.entries()) {
      if (index < newVisibleRange.start || index > newVisibleRange.end) {
        // Remove from DOM và add to pool for recycling
        element.remove();
        this.state.itemPool.push(element);
        this.state.renderedItems.delete(index);
      }
    }

    // Limit pool size để prevent memory leaks
    if (this.state.itemPool.length > this.options.bufferSize) {
      this.state.itemPool.length = this.options.bufferSize;
    }
  }

  setupScrollListener() {
    let rafId;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        this.state.scrollTop = this.container.scrollTop;
        this.render(this.currentPins);
        rafId = null;
      });
    };

    // Passive listener for better performance
    this.container.addEventListener('scroll', handleScroll, { passive: true });
  }

  setupResizeObserver() {
    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        const { width, height } = entries[0].contentRect;
        this.state.viewport = { width, height };
        this.render(this.currentPins, true); // Force re-render
      }, 250)
    );

    resizeObserver.observe(this.container);
  }
}
```


**Người phỏng vấn:** Outstanding virtual scrolling implementation! Your binary search for visible range calculation và DOM recycling system is production-grade. The performance considerations (RAF, passive listeners, GPU hints) show deep optimization knowledge.


Let's talk about another critical Pinterest optimization: image loading performance. With thousands of images, how do you prevent waterfall loading và optimize network utilization?


### Advanced Image Loading Optimization


**Ứng viên:** Absolutely critical! Pinterest's success depends on fast image loading. Here's comprehensive strategy:


```javascript
// Advanced Image Loading Manager
class ImageLoadingManager {
  constructor(options = {}) {
    this.options = {
      maxConcurrentLoads: 6, // Browser connection limit
      preloadDistance: 2000, // Pixels ahead to preload
      qualityTiers: ['placeholder', 'low', 'medium', 'high'],
      retryAttempts: 3,
      retryDelay: 1000,
      cacheSize: 50 * 1024 * 1024, // 50MB image cache
      ...options
    };

    this.state = {
      loadingQueue: new PriorityQueue(),
      activeLoads: new Set(),
      loadedImages: new LRUCache(100),
      failedImages: new Set(),
      networkQuality: 'unknown'
    };

    this.observers = {
      intersection: this.createIntersectionObserver(),
      network: this.setupNetworkObserver()
    };

    this.setupImageCache();
  }

  // Progressive image loading với quality tiers
  async loadImageProgressively(pin, container, priority = 'normal') {
    const imageId = pin.id;

    // Check if already loaded
    if (this.state.loadedImages.has(imageId)) {
      return this.renderCachedImage(container, this.state.loadedImages.get(imageId));
    }

    // Start với blur placeholder
    this.renderPlaceholder(container, pin);

    // Queue progressive loads
    const loadTasks = this.createProgressiveLoadTasks(pin, container, priority);

    try {
      // Load progressively based on quality tiers
      for (const task of loadTasks) {
        await this.queueImageLoad(task);
      }
    } catch (error) {
      this.handleImageError(container, pin, error);
    }
  }

  createProgressiveLoadTasks(pin, container, priority) {
    const { image } = pin;
    const networkQuality = this.getNetworkQuality();
    const deviceRatio = window.devicePixelRatio;

    const tasks = [];

    // Task 1: Low quality for immediate visual feedback
    if (networkQuality !== 'fast' || priority === 'low') {
      tasks.push({
        id: `${pin.id}-low`,
        url: image.variants.small.url,
        quality: 'low',
        container,
        pin,
        priority: this.calculatePriority(priority, 'low', container)
      });
    }

    // Task 2: Medium quality for most users
    tasks.push({
      id: `${pin.id}-medium`,
      url: image.variants.medium.url,
      quality: 'medium',
      container,
      pin,
      priority: this.calculatePriority(priority, 'medium', container)
    });

    // Task 3: High quality for retina displays với good connection
    if (deviceRatio > 1.5 && networkQuality === 'fast') {
      tasks.push({
        id: `${pin.id}-high`,
        url: image.variants.large.url,
        quality: 'high',
        container,
        pin,
        priority: this.calculatePriority(priority, 'high', container)
      });
    }

    return tasks;
  }

  // Priority-based loading queue
  async queueImageLoad(task) {
    return new Promise((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;

      // Add to priority queue
      this.state.loadingQueue.enqueue(task, task.priority);

      // Process queue if not at concurrent limit
      this.processLoadingQueue();
    });
  }

  async processLoadingQueue() {
    while (
      this.state.activeLoads.size < this.options.maxConcurrentLoads &&
      !this.state.loadingQueue.isEmpty()
    ) {
      const task = this.state.loadingQueue.dequeue();
      this.executeImageLoad(task);
    }
  }

  async executeImageLoad(task) {
    const { id, url, container, pin, quality } = task;

    this.state.activeLoads.add(id);

    try {
      // Check browser cache first
      const cachedImage = await this.checkBrowserCache(url);
      if (cachedImage) {
        await this.renderImage(container, cachedImage, quality);
        task.resolve(cachedImage);
        return;
      }

      // Load image với timeout và retry logic
      const image = await this.loadImageWithRetry(url, task.retryCount || 0);

      // Cache successful load
      this.state.loadedImages.set(pin.id, { image, quality, timestamp: Date.now() });

      // Render with smooth transition
      await this.renderImage(container, image, quality);

      task.resolve(image);

    } catch (error) {
      this.state.failedImages.add(url);
      task.reject(error);
    } finally {
      this.state.activeLoads.delete(id);
      // Continue processing queue
      this.processLoadingQueue();
    }
  }

  async loadImageWithRetry(url, retryCount = 0) {
    const maxRetries = this.options.retryAttempts;

    try {
      return await this.loadImage(url);
    } catch (error) {
      if (retryCount < maxRetries) {
        // Exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, retryCount);
        await this.sleep(delay);
        return this.loadImageWithRetry(url, retryCount + 1);
      }
      throw error;
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Optimize loading performance
      img.crossOrigin = 'anonymous';
      img.decoding = 'async'; // Background decode
      img.fetchPriority = 'auto';

      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image failed to load'));
      };

      img.src = url;
    });
  }

  async renderImage(container, image, quality) {
    const existingImg = container.querySelector('.pin-image');

    if (existingImg) {
      // Update existing image với smooth transition
      await this.transitionImage(existingImg, image, quality);
    } else {
      // Create new image element
      const imgElement = this.createImageElement(image, quality);
      container.appendChild(imgElement);
    }
  }

  async transitionImage(existingImg, newImage, quality) {
    // Create new image element
    const newImg = this.createImageElement(newImage, quality);
    newImg.style.opacity = '0';

    // Position over existing image
    existingImg.parentNode.appendChild(newImg);

    // Animate transition
    await this.animateImageTransition(existingImg, newImg);

    // Remove old image
    existingImg.remove();
  }

  animateImageTransition(oldImg, newImg) {
    return new Promise(resolve => {
      // Fade in new image
      newImg.style.transition = 'opacity 0.3s ease-in-out';
      newImg.style.opacity = '1';

      // Fade out old image
      oldImg.style.opacity = '0';

      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  // Intelligent preloading based on scroll velocity
  preloadImagesInDirection(pins, scrollDirection, scrollVelocity) {
    const preloadDistance = Math.min(
      this.options.preloadDistance,
      scrollVelocity * 2 // Dynamic preload distance
    );

    const visiblePins = this.getVisiblePins(pins);
    const preloadCandidates = this.getPreloadCandidates(
      pins,
      visiblePins,
      scrollDirection,
      preloadDistance
    );

    // Preload với low priority
    preloadCandidates.forEach(pin => {
      this.loadImageProgressively(pin, null, 'low');
    });
  }

  // Network-aware quality adjustment
  getNetworkQuality() {
    if (!navigator.connection) return 'unknown';

    const { effectiveType, downlink, rtt } = navigator.connection;

    if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
      return 'fast';
    } else if (effectiveType === '3g' || downlink < 5) {
      return 'slow';
    }

    return 'medium';
  }

  calculatePriority(basePriority, quality, container) {
    let priority = 0;

    // Base priority adjustment
    switch (basePriority) {
      case 'high': priority += 100; break;
      case 'normal': priority += 50; break;
      case 'low': priority += 10; break;
    }

    // Quality tier adjustment
    switch (quality) {
      case 'low': priority += 30; break;
      case 'medium': priority += 20; break;
      case 'high': priority += 10; break;
    }

    // Visibility adjustment
    if (container && this.isInViewport(container)) {
      priority += 50;
    }

    return priority;
  }
}

// Performance monitoring cho image loading
class ImagePerformanceMonitor {
  constructor() {
    this.metrics = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      avgLoadTime: 0,
      cacheHitRate: 0
    };
  }

  recordImageLoad(loadTime, cached = false) {
    this.metrics.totalImages++;
    this.metrics.loadedImages++;

    if (cached) {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitRate * (this.metrics.totalImages - 1) + 1) / this.metrics.totalImages;
    }

    this.metrics.avgLoadTime =
      (this.metrics.avgLoadTime * (this.metrics.loadedImages - 1) + loadTime) / this.metrics.loadedImages;
  }

  getMetrics() {
    return {
      ...this.metrics,
      loadSuccessRate: this.metrics.loadedImages / this.metrics.totalImages,
      failureRate: this.metrics.failedImages / this.metrics.totalImages
    };
  }
}
```


**Người phỏng vấn:** Absolutely outstanding image optimization! Your progressive loading với quality tiers, priority queuing, và network-aware adjustments mirrors Pinterest's production implementation. The retry logic và cache management are particularly well thought out.


I'm impressed by your **technical depth** và **systematic approach** to performance optimization. You've covered:


- ✅ Critical rendering path optimization
- ✅ Layout shift prevention
- ✅ Advanced masonry algorithm với caching
- ✅ Virtual scrolling với DOM recycling
- ✅ Progressive image loading với priority queuing


Let's discuss one final optimization area: memory management và cleanup strategies. Với users scrolling through thousands of pins, how do you prevent memory leaks và browser crashes?


### Memory Management & Cleanup Strategies


**Ứng viên:** Absolutely critical! Memory leaks can crash browsers với Pinterest's infinite scroll. Here's comprehensive memory management:


```javascript
// Advanced Memory Management System
class MemoryManager {
  constructor(options = {}) {
    this.options = {
      maxMemoryMB: 150, // Max memory budget
      cleanupThreshold: 0.8, // Trigger cleanup at 80% usage
      aggressiveCleanupThreshold: 0.9,
      maxDOMNodes: 200, // Max DOM nodes in memory
      maxImageCache: 50, // Max cached images
      gcInterval: 30000, // Garbage collection interval
      ...options
    };

    this.state = {
      domNodeCount: 0,
      imageCacheSize: 0,
      totalMemoryUsage: 0,
      cleanupHistory: [],
      performanceMetrics: new Map()
    };

    this.schedulers = {
      gc: null,
      memoryCheck: null,
      cleanup: null
    };

    this.setupMemoryMonitoring();
  }

  // Proactive memory monitoring
  setupMemoryMonitoring() {
    // Modern browsers support memory API
    if ('memory' in navigator) {
      this.schedulers.memoryCheck = setInterval(() => {
        this.checkMemoryPressure();
      }, 5000);
    }

    // Scheduled garbage collection hints
    this.schedulers.gc = setInterval(() => {
      this.suggestGarbageCollection();
    }, this.options.gcInterval);

    // Page visibility cleanup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performBackgroundCleanup();
      }
    });

    // Memory pressure events (where supported)
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
      // More aggressive cleanup on low-memory devices
      this.options.maxDOMNodes = 100;
      this.options.maxImageCache = 25;
    }
  }

  checkMemoryPressure() {
    const memoryInfo = this.getMemoryInfo();
    const usageRatio = memoryInfo.used / memoryInfo.limit;

    this.state.totalMemoryUsage = memoryInfo.used;

    if (usageRatio > this.options.aggressiveCleanupThreshold) {
      console.warn('High memory usage detected:', memoryInfo);
      this.performAggressiveCleanup();
    } else if (usageRatio > this.options.cleanupThreshold) {
      this.performRegularCleanup();
    }

    // Record memory metrics
    this.recordMemoryMetrics(memoryInfo, usageRatio);
  }

  getMemoryInfo() {
    if ('memory' in navigator) {
      return {
        used: navigator.memory.usedJSHeapSize,
        total: navigator.memory.totalJSHeapSize,
        limit: navigator.memory.jsHeapSizeLimit
      };
    }

    // Fallback estimation
    return {
      used: this.estimateMemoryUsage(),
      total: this.state.totalMemoryUsage || 50 * 1024 * 1024,
      limit: 100 * 1024 * 1024
    };
  }

  estimateMemoryUsage() {
    // Rough estimation based on DOM nodes và cache
    const domMemory = this.state.domNodeCount * 1024; // ~1KB per node
    const imageMemory = this.state.imageCacheSize;
    const jsMemory = 10 * 1024 * 1024; // Baseline JS memory

    return domMemory + imageMemory + jsMemory;
  }

  // Regular cleanup - remove non-essential items
  performRegularCleanup() {
    const startTime = performance.now();
    const initialMemory = this.getMemoryInfo().used;

    console.log('Performing regular memory cleanup...');

    // 1. Clean image cache (LRU eviction)
    this.cleanImageCache(0.3); // Remove 30% of cache

    // 2. Remove off-screen DOM nodes
    this.cleanOffScreenNodes();

    // 3. Clear expired data caches
    this.clearExpiredCaches();

    // 4. Compact event listener references
    this.compactEventListeners();

    const endTime = performance.now();
    const finalMemory = this.getMemoryInfo().used;

    this.recordCleanupMetrics('regular', {
      duration: endTime - startTime,
      memoryFreed: initialMemory - finalMemory,
      timestamp: Date.now()
    });
  }

  // Aggressive cleanup - remove all non-critical items
  performAggressiveCleanup() {
    const startTime = performance.now();
    const initialMemory = this.getMemoryInfo().used;

    console.warn('Performing aggressive memory cleanup...');

    // 1. Clear most of image cache
    this.cleanImageCache(0.7); // Remove 70% of cache

    // 2. Remove all off-screen DOM nodes
    this.cleanOffScreenNodes(true);

    // 3. Clear all non-essential caches
    this.clearAllCaches();

    // 4. Release component references
    this.releaseComponentReferences();

    // 5. Force garbage collection hint
    this.forceGarbageCollection();

    const endTime = performance.now();
    const finalMemory = this.getMemoryInfo().used;

    this.recordCleanupMetrics('aggressive', {
      duration: endTime - startTime,
      memoryFreed: initialMemory - finalMemory,
      timestamp: Date.now()
    });
  }

  cleanImageCache(evictionRatio) {
    const imageCache = window.imageLoadingManager?.state.loadedImages;
    if (!imageCache) return;

    const cacheSize = imageCache.size;
    const itemsToRemove = Math.floor(cacheSize * evictionRatio);

    // Remove least recently used items
    const entries = Array.from(imageCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (let i = 0; i < itemsToRemove; i++) {
      const [key] = entries[i];
      imageCache.delete(key);
    }

    console.log(`Cleaned ${itemsToRemove} images from cache`);
  }

  cleanOffScreenNodes(aggressive = false) {
    const virtualScroller = window.virtualMasonryScroller;
    if (!virtualScroller) return;

    const container = virtualScroller.container;
    const visibleRange = virtualScroller.state.visibleRange;
    const renderedItems = virtualScroller.state.renderedItems;

    let nodesRemoved = 0;

    for (const [index, element] of renderedItems.entries()) {
      const shouldRemove = aggressive ||
        (index < visibleRange.start - 10 || index > visibleRange.end + 10);

      if (shouldRemove) {
        element.remove();
        renderedItems.delete(index);
        nodesRemoved++;
      }
    }

    this.state.domNodeCount -= nodesRemoved;
    console.log(`Removed ${nodesRemoved} off-screen DOM nodes`);
  }

  clearExpiredCaches() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    // Clear layout cache
    const layoutEngine = window.masonryLayoutEngine;
    if (layoutEngine?.state.layoutCache) {
      const cache = layoutEngine.state.layoutCache;
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > maxAge) {
          cache.delete(key);
        }
      }
    }

    // Clear API cache
    if (window.apiCache) {
      window.apiCache.cleanup(maxAge);
    }
  }

  releaseComponentReferences() {
    // Clear React component references
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      // Clear fiber node references
      const internals = window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      if (internals.ReactFiberReconciler) {
        // Implementation specific cleanup
      }
    }

    // Clear event handler references
    this.clearWeakReferences();
  }

  clearWeakReferences() {
    // Clean up WeakMap and WeakSet references
    if (window.componentWeakMap) {
      window.componentWeakMap.clear?.();
    }

    if (window.eventHandlerWeakMap) {
      window.eventHandlerWeakMap.clear?.();
    }
  }

  // Background cleanup when page is hidden
  performBackgroundCleanup() {
    console.log('Performing background cleanup...');

    // More aggressive cleanup when tab is hidden
    this.cleanImageCache(0.5);
    this.cleanOffScreenNodes(true);
    this.clearExpiredCaches();

    // Pause non-essential timers
    this.pauseNonEssentialTimers();
  }

  pauseNonEssentialTimers() {
    // Pause image preloading
    if (window.imageLoadingManager) {
      window.imageLoadingManager.pausePreloading();
    }

    // Pause analytics timers
    if (window.analyticsManager) {
      window.analyticsManager.pauseTracking();
    }
  }

  // Garbage collection hints
  suggestGarbageCollection() {
    // Modern browsers ignore this, but doesn't hurt
    if (window.gc) {
      window.gc();
    }

    // Alternative: Force creation of large objects that get immediately GC'd
    if (this.shouldForceGC()) {
      this.forceGarbageCollection();
    }
  }

  shouldForceGC() {
    const memoryInfo = this.getMemoryInfo();
    const usageRatio = memoryInfo.used / memoryInfo.limit;

    return usageRatio > 0.6; // Force GC above 60% memory usage
  }

  forceGarbageCollection() {
    // Create large temporary objects to trigger GC
    const tempArrays = [];

    try {
      for (let i = 0; i < 10; i++) {
        tempArrays.push(new Array(1000000).fill(0));
      }
    } catch (e) {
      // Memory pressure reached, GC will trigger
    } finally {
      tempArrays.length = 0; // Clear references
    }
  }

  // Memory metrics tracking
  recordMemoryMetrics(memoryInfo, usageRatio) {
    const timestamp = Date.now();

    this.state.performanceMetrics.set(timestamp, {
      memoryUsed: memoryInfo.used,
      memoryTotal: memoryInfo.total,
      usageRatio,
      domNodeCount: this.state.domNodeCount,
      imageCacheSize: this.state.imageCacheSize
    });

    // Keep only recent metrics (last hour)
    const oneHourAgo = timestamp - 60 * 60 * 1000;
    for (const [ts] of this.state.performanceMetrics.entries()) {
      if (ts < oneHourAgo) {
        this.state.performanceMetrics.delete(ts);
      } else {
        break; // Map is ordered by insertion
      }
    }
  }

  recordCleanupMetrics(type, metrics) {
    this.state.cleanupHistory.push({
      type,
      ...metrics
    });

    // Keep only recent cleanup history
    if (this.state.cleanupHistory.length > 50) {
      this.state.cleanupHistory = this.state.cleanupHistory.slice(-25);
    }
  }

  // Public API for getting memory status
  getMemoryStatus() {
    const memoryInfo = this.getMemoryInfo();
    const recentMetrics = Array.from(this.state.performanceMetrics.values()).slice(-10);

    return {
      current: {
        memoryUsed: memoryInfo.used,
        memoryLimit: memoryInfo.limit,
        usagePercentage: (memoryInfo.used / memoryInfo.limit) * 100,
        domNodeCount: this.state.domNodeCount,
        imageCacheSize: this.state.imageCacheSize
      },
      history: recentMetrics,
      cleanupHistory: this.state.cleanupHistory.slice(-5),
      recommendations: this.getOptimizationRecommendations()
    };
  }

  getOptimizationRecommendations() {
    const memoryInfo = this.getMemoryInfo();
    const usageRatio = memoryInfo.used / memoryInfo.limit;
    const recommendations = [];

    if (usageRatio > 0.8) {
      recommendations.push('High memory usage - consider reducing image quality');
      recommendations.push('Enable more aggressive virtual scrolling');
    }

    if (this.state.domNodeCount > this.options.maxDOMNodes) {
      recommendations.push(`Too many DOM nodes (${this.state.domNodeCount}/${this.options.maxDOMNodes})`);
    }

    if (this.state.imageCacheSize > this.options.maxImageCache * 1024 * 1024) {
      recommendations.push('Image cache too large - increase cleanup frequency');
    }

    return recommendations;
  }

  // Cleanup on page unload
  cleanup() {
    clearInterval(this.schedulers.gc);
    clearInterval(this.schedulers.memoryCheck);
    clearInterval(this.schedulers.cleanup);

    this.performAggressiveCleanup();
  }
}

// Initialize memory management
window.addEventListener('beforeunload', () => {
  window.memoryManager?.cleanup();
});

// Development helper to monitor memory in real-time
if (process.env.NODE_ENV === 'development') {
  window.memoryDebugger = {
    logMemoryStatus: () => console.log(window.memoryManager?.getMemoryStatus()),
    forceCleanup: () => window.memoryManager?.performRegularCleanup(),
    forceAggressiveCleanup: () => window.memoryManager?.performAggressiveCleanup()
  };
}
```


**Người phỏng vấn:** Phenomenal memory management implementation! Your proactive monitoring, tiered cleanup strategies, và performance tracking show exceptional **technical proficiency**. The consideration for low-memory devices và background cleanup demonstrates strong **product sense**.


## Interview Wrap-up & Assessment


**Người phỏng vấn:** That concludes our Pinterest homepage system design interview. Let me provide comprehensive feedback across all assessment criteria:


### Performance Assessment


**Problem Exploration: ★★★★★ (Exceptional)**


- Asked highly relevant clarifying questions systematically
- Demonstrated deep understanding of Pinterest's domain challenges
- Properly scoped requirements và identified key constraints
- Showed great product intuition về user needs


**Architecture Design: ★★★★★ (Exceptional)**


- Designed scalable, modular component hierarchy
- Made excellent technical tradeoffs (SPA vs MPA, absolute vs column positioning)
- Demonstrated mastery của React patterns (hooks, render props, context)
- Considered responsive design và accessibility from start


**Technical Proficiency: ★★★★★ (Exceptional)**


- Implemented production-ready algorithms (height-balanced masonry, virtual scrolling)
- Showed deep understanding của browser performance (CLS prevention, image optimization)
- Advanced memory management và cleanup strategies
- Code quality was consistently high với proper error handling


**Tradeoff Analysis: ★★★★★ (Exceptional)**


- Systematically evaluated options với clear pros/cons
- Made justified decisions based on Pinterest's scale requirements
- Considered performance implications of every choice
- Balanced developer experience với runtime performance


**Product/UX Sense: ★★★★☆ (Strong)**


- Understood Pinterest's unique UX challenges (masonry layout, infinite scroll)
- Designed for accessibility và keyboard navigation
- Considered loading states, error handling, và edge cases
- Could improve with more discussion về user engagement optimization


**Communication: ★★★★★ (Exceptional)**


- Clear, structured presentation using RADIO framework
- Excellent technical explanations với concrete examples
- Engaged collaborative throughout interview
- Asked thoughtful questions và incorporated feedback


### Key Strengths


1. **Technical Depth**: Your implementation details were production-ready. The masonry algorithm, virtual scrolling, và memory management showed senior+ level expertise.
2. **Performance Focus**: Consistently considered performance implications - from critical rendering path to memory cleanup. This is exactly what Pinterest needs.
3. **Systematic Thinking**: Used frameworks effectively (RADIO), asked structured questions, designed modular architecture.
4. **Real-world Experience**: Clear evidence của having built similar systems. Your Pinterest domain knowledge was excellent.
5. **Code Quality**: Consistent naming, error handling, performance monitoring, và documentation.


### Areas for Enhancement


1. **Business Metrics**: Could discuss more about user engagement optimization, A/B testing frameworks, analytics integration.
2. **Accessibility Details**: While mentioned, could dive deeper into screen reader optimization, ARIA labels, keyboard navigation patterns.
3. **Team Collaboration**: Could discuss code review processes, testing strategies, monitoring và alerting.


### Overall Assessment: STRONG HIRE


This was an exceptional system design interview. Your technical depth, systematic approach, và Pinterest domain expertise demonstrate readiness for senior+ frontend engineering roles. You'd be a strong addition to any visual discovery platform team.


**Ứng viên:** Cảm ơn anh rất nhiều cho detailed feedback! Interview này have been incredibly insightful. Tôi learned a lot through our discussions, especially về advanced optimization techniques như memory management và progressive image loading.


I appreciated anh's collaborative approach và how you pushed me to consider deeper technical challenges. The Pinterest domain is fascinating from both UX và engineering perspectives.


Any final advice về areas I should continue developing để become an even stronger senior frontend engineer?


**Người phỏng vấn:** Excellent question! Based on today's interview, a few areas for continued growth:


1. **Product Analytics Integration**: Learn more về experimentation platforms, user behavior tracking, và how frontend architecture enables data-driven decisions.
2. **Advanced Testing Strategies**: While your code quality was great, explore visual regression testing, performance testing, và accessibility testing automation.
3. **Cross-team Collaboration**: Pinterest-scale features require close collaboration với backend, design systems, và data science teams.
4. **Emerging Technologies**: Stay current với Web APIs (Intersection Observer, Web Workers, Service Workers) và modern bundling strategies.


But honestly, your technical foundation is exceptionally strong. Keep building complex systems, mentoring other engineers, và contributing to technical architecture decisions. You're ready for senior+ IC roles.


Congratulations on an outstanding interview! Best of luck với your job search.


**Ứng viên:** Thank you so much! This has been one of the most engaging technical interviews I've had. Cảm ơn anh đã create such a collaborative learning environment. Good luck với your team building at Meta!


---


**[Interview Conclusion: 90:00]**


**Final Assessment Summary:**


- **Overall Rating:** Strong Hire (Senior+ Frontend Engineer level)
- **Technical Competency:** Exceptional mastery of frontend system design
- **Problem-Solving:** Systematic và thorough approach
- **Communication:** Clear, collaborative, professional
- **Domain Knowledge:** Strong understanding of Pinterest's challenges
- **Code Quality:** Production-ready implementations với proper architecture


This candidate demonstrated senior+ level expertise in frontend system design, performance optimization, và large-scale React applications. Highly recommended for Pinterest, Meta, Google, or any company building visual discovery platforms.
