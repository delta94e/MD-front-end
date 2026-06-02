# Frontend Interview Questions at Tech Companies

## You

Liệt kê tất cả các đề bài được phỏng vấn ở các công ty big tech như MAANG, Figma, webflow, openai, claude, gemini, Shopee, AXON, NAB, Tiktok, Capcut, Discord,Uber, Airbnb, LinkedIn, Microsoft, Stripe, Spotify, Binance, Grammarly, Kahoot, Udemy, ... về coding front end React hoặc javascript về một cái gì thực tế trong công ty và khác với những câu ở trên.Tôi muốn đề bài yêu cầu chi tiết hơn, requirement và expect là gì

## You

Tôi muốn requirement và expect chi tiết hơn

## You

tiếp tục

## You

tiếp tục

## Claude


Tôi sẽ tìm kiếm thông tin về các đề bài phỏng vấn coding từ các cuộc trò chuyện trước đây để cung cấp cho bạn những ví dụ thực tế.


Dựa trên thông tin từ các cuộc trò chuyện trước và kiến thức về các đề bài phỏng vấn thực tế, tôi sẽ tổng hợp danh sách các đề bài phỏng vấn coding frontend React/JavaScript từ các công ty big tech:


# 📋 Danh Sách Đề Bài Phỏng Vấn Coding Frontend Thực Tế Tại Big Tech


## 🎯 META (Facebook/Instagram)


### 1. News Feed Component Architecture


**Requirements:**


- Thiết kế component architecture cho Facebook News Feed
- Hỗ trợ infinite scrolling với 10M+ posts
- Real-time updates khi có post mới
- Optimistic UI updates
- Image lazy loading và error handling


**Expected Output:**


- Component hierarchy design (Container/Presentational pattern)
- Virtual scrolling implementation
- State management với Redux/Zustand
- Performance optimization strategies
- Error boundary implementation


### 2. Instagram Stories Player


**Requirements:**


- Build Instagram Stories với auto-advance timer
- Touch gestures (tap to advance, hold to pause)
- Progress indicators
- Preloading next stories
- Support video và image content


**Expected Output:**


- Custom hooks for timer management
- Gesture handling với touch events
- Progressive loading strategy
- Memory management for media content


---


## 🎯 GOOGLE


### 3. Google Sheets Cell Editor


**Requirements:**


- Thiết kế spreadsheet cell editor như Google Sheets
- Formula parsing và evaluation
- Real-time collaboration (multiple cursors)
- Undo/Redo functionality
- Export/Import từ Excel


**Expected Output:**


- Complex state management với immutable updates
- Operational Transform implementation
- Custom parser cho formulas
- History management với Command pattern
- Performance với virtual rendering


### 4. Gmail Compose Window


**Requirements:**


- Build Gmail compose với rich text editor
- Auto-save drafts every 30 seconds
- Recipient suggestions với debouncing
- Attachment upload với progress tracking
- Keyboard shortcuts (Ctrl+Enter to send)


**Expected Output:**


- Custom contentEditable implementation
- Debounced API calls
- File upload với progress indicators
- Keyboard event handling
- Draft synchronization logic


---


## 🎯 AMAZON


### 5. Product Search với Filters


**Requirements:**


- Amazon-style product search với advanced filters
- Real-time search suggestions
- Filter combination logic
- Pagination với URL state sync
- Sort by price, rating, relevance


**Expected Output:**


- Search optimization với debouncing
- Complex filtering algorithm
- URL state management
- Virtualized lists cho performance
- SEO-friendly routing


### 6. Shopping Cart với Persistence


**Requirements:**


- Persistent shopping cart across sessions
- Quantity updates với stock validation
- Promotional code application
- Guest checkout flow
- Tax calculation based on location


**Expected Output:**


- Local storage synchronization
- Complex pricing calculations
- Form validation với Yup/Joi
- Error handling strategies
- State persistence patterns


---


## 🎯 UBER


### 7. Real-time Map với Driver Tracking


**Requirements:**


- Interactive map với real-time driver locations
- Route calculation và display
- ETA updates every 5 seconds
- Geolocation permissions handling
- Offline mode với cached data


**Expected Output:**


- Map SDK integration (Mapbox/Google Maps)
- WebSocket implementation cho real-time updates
- Geolocation API usage
- Offline-first architecture
- Battery optimization considerations


### 8. Ride Booking Flow


**Requirements:**


- Multi-step booking process (pickup → destination → car type → confirmation)
- Dynamic pricing display
- Payment method selection
- Booking cancellation logic
- Push notifications simulation


**Expected Output:**


- Multi-step form management
- State machine implementation
- Payment integration planning
- Notification system design
- Error recovery flows


---


## 🎯 AIRBNB


### 9. Property Listing Gallery


**Requirements:**


- Photo gallery với thumbnail navigation
- Zoom functionality với touch gestures
- Keyboard navigation (arrow keys)
- Fullscreen mode
- Image optimization cho different screen sizes


**Expected Output:**


- Custom image viewer component
- Touch gesture implementation
- Responsive image techniques
- Keyboard accessibility
- Performance optimization


### 10. Booking Calendar Component


**Requirements:**


- Interactive calendar cho date range selection
- Blocked dates display
- Price per night display
- Mobile-responsive design
- Min/max stay restrictions


**Expected Output:**


- Custom calendar implementation
- Date range logic
- Responsive design patterns
- Business logic validation
- Accessibility compliance


---


## 🎯 NETFLIX


### 11. Video Player Controls


**Requirements:**


- Custom video player với Netflix-style controls
- Auto-hide controls after inactivity
- Keyboard shortcuts (spacebar, arrow keys)
- Subtitle support
- Playback speed controls


**Expected Output:**


- Custom video controls overlay
- Inactivity detection
- Keyboard event management
- Subtitle rendering logic
- Media Session API integration


### 12. Content Recommendation Row


**Requirements:**


- Horizontal scrolling content rows
- Hover preview functionality
- Lazy loading thumbnails
- Infinite horizontal scroll
- Responsive grid layout


**Expected Output:**


- Horizontal scroll optimization
- Hover state management
- Image loading strategies
- Intersection Observer usage
- CSS Grid/Flexbox mastery


---


## 🎯 SPOTIFY


### 13. Music Player với Playlist


**Requirements:**


- Audio player với play/pause/skip controls
- Playlist management (add/remove songs)
- Shuffle và repeat modes
- Volume control với visualization
- Cross-fade between tracks


**Expected Output:**


- Audio API implementation
- Complex state management cho player
- Audio visualization techniques
- Playlist data structures
- Audio processing logic


### 14. Search với Multiple Content Types


**Requirements:**


- Universal search (songs, artists, albums, playlists)
- Real-time search results
- Search history và suggestions
- Category-based filtering
- Keyboard navigation trong results


**Expected Output:**


- Multi-type search implementation
- Search optimization techniques
- Complex result ranking
- Keyboard navigation logic
- Search analytics planning


---


## 🎯 DISCORD


### 15. Chat Application với Threading


**Requirements:**


- Real-time chat với message threading
- Emoji reactions
- Message editing/deletion
- File sharing với preview
- Voice channel integration planning


**Expected Output:**


- WebSocket real-time messaging
- Complex message data structures
- File upload implementation
- Rich message rendering
- Voice API integration planning


### 16. Server/Channel Navigation


**Requirements:**


- Nested navigation structure
- Drag-and-drop channel reordering
- Server switching với state preservation
- Notification badges
- Search across servers


**Expected Output:**


- Complex navigation state
- Drag-and-drop implementation
- State preservation strategies
- Notification system
- Search architecture


---


## 🎯 LINKEDIN


### 17. Professional Feed với Engagement


**Requirements:**


- LinkedIn-style professional feed
- Like/Comment/Share functionality
- Rich text post composer
- Connection suggestions
- Professional content filtering


**Expected Output:**


- Social feed architecture
- Rich text editor implementation
- Engagement tracking
- Recommendation algorithms planning
- Content moderation considerations


### 18. Job Search Dashboard


**Requirements:**


- Job search với advanced filters
- Application tracking
- Salary range visualization
- Company research integration
- Application deadline tracking


**Expected Output:**


- Advanced filtering logic
- Application state management
- Data visualization với D3/Chart.js
- API integration planning
- Deadline notification system


---


## 🎯 MICROSOFT


### 19. Teams Video Call Interface


**Requirements:**


- Video call grid layout
- Screen sharing functionality
- Chat sidebar during calls
- Participant management
- Recording controls


**Expected Output:**


- WebRTC implementation planning
- Grid layout algorithms
- Screen capture API usage
- Real-time chat integration
- Media recording architecture


### 20. Excel Online Cell Navigation


**Requirements:**


- Spreadsheet cell navigation với keyboard
- Formula bar implementation
- Cell formatting toolbar
- Multiple sheet management
- Collaborative editing indicators


**Expected Output:**


- Complex keyboard navigation
- Formula parsing logic
- Toolbar state management
- Multi-sheet architecture
- Collaboration visualization


---


## 🎯 STRIPE


### 21. Payment Form với Validation


**Requirements:**


- Secure payment form với real-time validation
- Credit card type detection
- Address autocomplete
- Error handling với retry logic
- PCI compliance considerations


**Expected Output:**


- Form validation strategies
- Credit card validation algorithms
- Address API integration
- Security best practices
- Error recovery patterns


### 22. Transaction Dashboard


**Requirements:**


- Transaction history với filtering
- Revenue analytics charts
- Export functionality
- Real-time transaction updates
- Fraud detection indicators


**Expected Output:**


- Data visualization implementation
- Export functionality
- Real-time updates architecture
- Chart optimization
- Security considerations


---


## 🎯 TIKTOK/CAPCUT


### 23. Short Video Player


**Requirements:**


- Vertical video feed với auto-play
- Swipe navigation (mobile-first)
- Like/Share/Comment interactions
- Video preloading strategy
- Memory management cho continuous scroll


**Expected Output:**


- Video optimization techniques
- Touch gesture implementation
- Preloading algorithms
- Memory leak prevention
- Mobile performance optimization


### 24. Video Editor Timeline


**Requirements:**


- Timeline scrubber cho video editing
- Trim/Cut functionality
- Multiple track support
- Real-time preview
- Undo/Redo cho editing actions


**Expected Output:**


- Timeline data structures
- Video manipulation logic
- Canvas/WebGL usage
- Command pattern implementation
- Performance optimization cho video


---


## 🎯 SHOPEE


### 25. Live Shopping Stream


**Requirements:**


- Live video stream với real-time chat
- Product showcase overlay
- Flash sale countdown timers
- Interactive product clicking
- Viewer engagement metrics


**Expected Output:**


- Live streaming integration
- Real-time chat implementation
- Timer implementation
- Interactive overlay design
- Analytics tracking


### 26. E-commerce Search với ML


**Requirements:**


- Visual search implementation
- Voice search integration
- Search result ranking
- Price comparison features
- Recommendation engine integration


**Expected Output:**


- Image recognition planning
- Voice API integration
- Ranking algorithm implementation
- Price tracking logic
- ML model integration planning


---


## 🎯 BINANCE


### 27. Trading Chart Interface


**Requirements:**


- Real-time candlestick charts
- Technical indicators overlay
- Order book visualization
- Trade execution interface
- Portfolio tracking


**Expected Output:**


- Chart library integration (TradingView/D3)
- WebSocket real-time data
- Financial calculations
- Order management logic
- Portfolio state management


### 28. Crypto Portfolio Dashboard


**Requirements:**


- Multi-currency portfolio view
- Price alerts system
- P&L calculations
- Transaction history
- Tax reporting preparation


**Expected Output:**


- Financial calculation accuracy
- Alert system implementation
- Data visualization
- Export functionality
- Compliance considerations


---


## 🎯 GRAMMARLY


### 29. Real-time Text Analysis


**Requirements:**


- Real-time grammar/spell checking
- Suggestion overlay positioning
- Custom text editor integration
- Performance với large documents
- Multi-language support planning


**Expected Output:**


- Text analysis algorithms
- Overlay positioning logic
- Editor integration techniques
- Performance optimization
- Internationalization planning


### 30. Writing Analytics Dashboard


**Requirements:**


- Writing metrics visualization
- Goal tracking system
- Progress charts over time
- Writing habit analysis
- Improvement suggestions UI


**Expected Output:**


- Analytics visualization
- Goal management system
- Chart implementation
- Data analysis logic
- User behavior tracking


---


## 🔧 Technical Evaluation Criteria


### Performance Requirements:


- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size optimization
- Memory usage monitoring
- Mobile performance considerations


### Scalability Requirements:


- Component reusability
- State management at scale
- API optimization
- Caching strategies
- Error handling patterns


### Code Quality Expectations:


- TypeScript usage
- Test coverage > 80%
- Accessibility compliance (WCAG 2.1)
- Security best practices
- Documentation completeness


### Advanced Topics:


- Micro-frontends architecture
- Web Workers implementation
- Service Worker caching
- PWA capabilities
- Real-time collaboration patterns


---


**💡 Lưu ý:** Mỗi đề bài đều yêu cầu candidate giải thích technical decisions, trade-offs, và scaling considerations. Interviewers thường follow-up với edge cases và optimization questions để test depth of understanding.


## Claude


# 📋 Chi Tiết Requirements & Expectations Cho Đề Bài Phỏng Vấn Frontend


## 🎯 META - Instagram Stories Player


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Story Playback System:**

Auto-advance timer: 5 seconds per image, full duration cho video
Manual navigation: tap right (next), tap left (previous)
Hold-to-pause functionality với visual feedback
Progress bar showing current story position trong series
2. **User Interactions:**

Touch gestures: tap zones (left 30%, right 70% của screen)
Long press anywhere để pause với visual dim effect
Swipe down to close stories viewer
Swipe up for "Send Message" action
3. **Media Handling:**

Support image formats: JPEG, PNG, WebP
Support video formats: MP4, WebM
Preload next 2 stories để smooth transition
Fallback images cho loading/error states
4. **Visual Elements:**

Circular progress indicators at top
User avatar, username, timestamp
Gradient overlay cho text readability
Close button (X) ở top-right corner


#### Non-Functional Requirements:


- **Performance:** Story transition < 200ms
- **Memory:** Không exceed 150MB total memory usage
- **Network:** Efficient preloading without blocking current story
- **Accessibility:** Screen reader support, keyboard navigation
- **Mobile:** Touch-friendly, responsive design


#### Technical Constraints:


- Must work on iOS Safari, Chrome Android, Desktop browsers
- No external video libraries (sử dụng native HTML5 video)
- Maximum bundle size contribution: 25KB gzipped
- Support offline viewing cho đã-loaded stories


### 🎯 Expected Implementation Details


#### 1. Component Architecture:


```typescript
// Expected component structure
interface StoriesPlayerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onComplete: () => void;
  userId: string;
}

interface Story {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration?: number; // for videos
  previewUrl?: string;
  metadata: {
    userId: string;
    username: string;
    timestamp: number;
    dimensions: { width: number; height: number };
  };
}

// Required custom hooks
const useStoriesTimer = (duration: number, isPlaying: boolean) => {
  // Implementation expected
};

const useGestureHandling = (
  onNext: () => void,
  onPrevious: () => void,
  onPause: () => void
) => {
  // Implementation expected
};

const usePreloader = (stories: Story[], currentIndex: number) => {
  // Implementation expected
};
```


#### 2. State Management Logic:


```typescript
// Expected state structure
interface StoriesState {
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  loadedIndices: Set<number>;
  progress: number; // 0-1 for current story
  error: string | null;
  isClosing: boolean;
}

// Expected actions
type StoriesAction =
  | { type: 'NEXT_STORY' }
  | { type: 'PREVIOUS_STORY' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'PRELOAD_COMPLETE'; payload: number };
```


#### 3. Performance Implementation:


```typescript
// Expected preloading strategy
const usePreloader = (stories: Story[], currentIndex: number) => {
  const [loadedStories, setLoadedStories] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Preload current + next 2 stories
    const toLoad = [currentIndex, currentIndex + 1, currentIndex + 2]
      .filter(i => i < stories.length && !loadedStories.has(i));

    toLoad.forEach(index => {
      preloadStory(stories[index]).then(() => {
        setLoadedStories(prev => new Set([...prev, index]));
      });
    });
  }, [currentIndex, stories]);

  return loadedStories;
};

// Expected memory management
const useMemoryCleanup = (currentIndex: number, loadedStories: Set<number>) => {
  useEffect(() => {
    // Cleanup stories that are > 3 positions away
    const toCleanup = Array.from(loadedStories)
      .filter(index => Math.abs(index - currentIndex) > 3);

    toCleanup.forEach(index => {
      // Revoke object URLs, clear cached data
      cleanupStory(index);
    });
  }, [currentIndex]);
};
```


### 🏆 Evaluation Criteria


#### Technical Implementation (40%):


- Proper TypeScript usage với accurate types
- Custom hooks implementation cho reusable logic
- Efficient event handling (passive listeners, debouncing)
- Memory management với cleanup patterns
- Error boundaries và error handling
- Performance optimizations (useMemo, useCallback usage)


#### User Experience (30%):


- Smooth animations và transitions
- Responsive touch handling
- Visual feedback cho user actions
- Proper loading states
- Accessibility compliance (ARIA labels, keyboard support)
- Mobile-first design considerations


#### System Design (30%):


- Scalable component architecture
- Efficient data preloading strategy
- State management best practices
- Network optimization approaches
- Caching strategy planning
- Integration considerations với larger app


---


## 🎯 UBER - Real-time Driver Tracking Map


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Map Display & Interaction:**

Interactive map với zoom levels 10-18
User's current location với blue dot indicator
Driver locations với car icons (rotate based on heading)
Route display từ pickup đến destination
ETA updates every 5 seconds
2. **Real-time Updates:**

Driver position updates via WebSocket
Driver status changes (online, busy, offline)
Multiple drivers visible within viewport
Smooth animation khi driver moves
Connection status indicator
3. **Location Features:**

Geolocation API integration với permission handling
Address geocoding và reverse geocoding
Pickup/destination markers với drag capability
Route calculation với traffic consideration
Location search với autocomplete
4. **Offline Capabilities:**

Cached map tiles cho last viewed area
Stored route data cho active trips
Graceful degradation khi offline
Sync pending data khi connection restored


#### Non-Functional Requirements:


- **Real-time Latency:** < 500ms for driver updates
- **Map Performance:** 60fps animation, smooth panning/zooming
- **Battery Optimization:** Minimal GPS usage, efficient updates
- **Data Usage:** < 1MB per 10 minutes của active tracking
- **Accuracy:** Location accuracy within 10 meters


#### Technical Constraints:


- Support Mapbox GL JS hoặc Google Maps JavaScript API
- Work across all major browsers including mobile
- Handle poor network conditions gracefully
- Comply với location privacy regulations
- Maximum initial bundle size: 150KB gzipped


### 🎯 Expected Implementation Details


#### 1. Map Integration Architecture:


```typescript
// Expected map service abstraction
interface MapService {
  initialize(container: HTMLElement, options: MapOptions): Promise<void>;
  addDriver(driver: Driver): void;
  updateDriverPosition(driverId: string, position: LatLng, heading: number): void;
  removeDriver(driverId: string): void;
  drawRoute(route: RouteData): void;
  setCenter(position: LatLng, zoom?: number): void;
  addMarker(marker: MarkerData): string;
  removeMarker(markerId: string): void;
}

interface Driver {
  id: string;
  position: LatLng;
  heading: number;
  status: 'online' | 'busy' | 'offline';
  vehicleType: 'car' | 'bike' | 'scooter';
  eta?: number;
}

interface RouteData {
  coordinates: LatLng[];
  duration: number;
  distance: number;
  traffic: 'low' | 'medium' | 'high';
}
```


#### 2. Real-time Communication:


```typescript
// Expected WebSocket implementation
interface LocationUpdate {
  driverId: string;
  position: LatLng;
  heading: number;
  speed: number;
  timestamp: number;
  accuracy: number;
}

class DriverTrackingService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string, region: string): Promise<void> {
    // Expected WebSocket connection logic
  }

  subscribeToDriverUpdates(bounds: MapBounds): void {
    // Expected subscription management
  }

  handleLocationUpdate(update: LocationUpdate): void {
    // Expected update processing với interpolation
  }

  private handleDisconnection(): void {
    // Expected reconnection logic với exponential backoff
  }
}
```


#### 3. Performance Optimizations:


```typescript
// Expected driver update optimization
class DriverAnimationManager {
  private animationFrameId: number | null = null;
  private pendingUpdates = new Map<string, LocationUpdate>();

  queueUpdate(update: LocationUpdate): void {
    this.pendingUpdates.set(update.driverId, update);

    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.processPendingUpdates();
        this.animationFrameId = null;
      });
    }
  }

  private processPendingUpdates(): void {
    // Batch process all pending updates
    this.pendingUpdates.forEach((update, driverId) => {
      this.interpolateDriverPosition(driverId, update);
    });
    this.pendingUpdates.clear();
  }

  private interpolateDriverPosition(driverId: string, targetUpdate: LocationUpdate): void {
    // Smooth animation implementation expected
  }
}

// Expected geolocation management
class LocationManager {
  private watchId: number | null = null;
  private lastKnownPosition: LatLng | null = null;
  private accuracy = 10; // meters

  async getCurrentPosition(): Promise<LatLng> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
          error => reject(this.handleLocationError(error)),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }

  startWatching(callback: (position: LatLng) => void): void {
    // Expected position watching với error handling
  }

  stopWatching(): void {
    // Expected cleanup
  }
}
```


### 🏆 Evaluation Criteria


#### Real-time Implementation (35%):


- WebSocket connection management với reconnection logic
- Efficient driver position interpolation
- Proper event handling cho real-time updates
- Connection status monitoring và user feedback
- Data synchronization strategies
- Error recovery mechanisms


#### Map Performance (35%):


- Smooth animations (60fps maintenance)
- Efficient marker management (add/remove/update)
- Memory management cho large numbers of drivers
- Proper cleanup of map resources
- Viewport-based driver filtering
- Route rendering optimization


#### User Experience (30%):


- Intuitive map interactions (pan, zoom, tap)
- Clear visual hierarchy (user, drivers, route)
- Loading states và error messages
- Offline behavior và graceful degradation
- Location permission handling
- Accessibility considerations


---


## 🎯 NETFLIX - Video Player Controls


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Core Playback Controls:**

Play/Pause toggle với spacebar support
Scrub bar với precise seeking
Volume control với mute toggle
Fullscreen toggle với ESC support
Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x)
2. **Advanced Features:**

Auto-hide controls after 3 seconds của inactivity
Subtitle/CC toggle với style options
Quality selection (360p, 720p, 1080p, 4K)
Picture-in-Picture mode support
Keyboard shortcuts (←/→ skip 10s, ↑/↓ volume)
3. **Progress & Information:**

Current time / total duration display
Progress bar với buffering indication
Chapter markers (if available)
Thumbnail previews on hover over progress bar
Loading spinner during buffering
4. **Mobile Adaptations:**

Touch-friendly control sizes
Gesture support (double-tap to skip)
Screen orientation handling
Battery optimization considerations


#### Non-Functional Requirements:


- **Performance:** Controls response time < 50ms
- **Video Quality:** No stuttering during playback
- **Accessibility:** Full screen reader support, keyboard navigation
- **Compatibility:** All major browsers, iOS Safari, Android Chrome
- **Battery:** Minimal impact on device battery life


#### Technical Constraints:


- Must work với custom video element, không dùng browser default controls
- Support HLS và DASH streaming protocols
- Handle DRM-protected content (planning level)
- Minimal impact on video performance
- Bundle size < 30KB gzipped


### 🎯 Expected Implementation Details


#### 1. Video Player Architecture:


```typescript
// Expected player component structure
interface VideoPlayerProps {
  src: string | MediaSource;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: MediaError) => void;
  subtitles?: SubtitleTrack[];
  chapters?: Chapter[];
}

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
  default?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  thumbnail?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  showControls: boolean;
  isBuffering: boolean;
  currentQuality: string;
  availableQualities: string[];
  currentSubtitle: string | null;
  error: MediaError | null;
}
```


#### 2. Custom Hooks Implementation:


```typescript
// Expected custom hooks
const useVideoPlayer = (videoRef: RefObject<HTMLVideoElement>) => {
  const [state, setState] = useState<PlayerState>(initialState);

  // Expected methods
  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  return { state, play, pause, seek, setVolume, setPlaybackRate };
};

const useControlsVisibility = (videoRef: RefObject<HTMLVideoElement>) => {
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<number>();

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Expected mouse/touch event handling
  useEffect(() => {
    const handleMouseMove = () => showControlsTemporarily();
    const handleTouchStart = () => showControlsTemporarily();

    const element = videoRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('touchstart', handleTouchStart);

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, [showControlsTemporarily]);

  return { showControls, showControlsTemporarily };
};

const useKeyboardControls = (playerActions: PlayerActions) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          playerActions.togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerActions.seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerActions.seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          playerActions.adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          playerActions.adjustVolume(-0.1);
          break;
        case 'KeyF':
          e.preventDefault();
          playerActions.toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          playerActions.toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [playerActions]);
};
```


#### 3. Progress Bar với Thumbnail Previews:


```typescript
// Expected progress bar implementation
const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  buffered,
  onSeek,
  chapters,
  getThumbnail
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [thumbnailPosition, setThumbnailPosition] = useState<{ x: number; y: number } | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const time = percentage * duration;

    setHoverTime(time);
    setThumbnailPosition({ x: e.clientX, y: e.clientY });
  }, [duration]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const seekTime = percentage * duration;

    onSeek(seekTime);
  }, [duration, onSeek]);

  // Expected buffered ranges visualization
  const renderBufferedRanges = () => {
    if (!buffered || !duration) return null;

    const ranges = [];
    for (let i = 0; i < buffered.length; i++) {
      const start = (buffered.start(i) / duration) * 100;
      const end = (buffered.end(i) / duration) * 100;
      ranges.push(
        <div
          key={i}
          className="buffered-range"
          style={{
            left: `${start}%`,
            width: `${end - start}%`
          }}
        />
      );
    }
    return ranges;
  };

  return (
    <div
      ref={progressRef}
      className="progress-bar"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTime(null)}
      onClick={handleClick}
    >
      {/* Expected UI structure */}
      <div className="progress-track">
        {renderBufferedRanges()}
        <div
          className="progress-filled"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        {chapters?.map(chapter => (
          <div
            key={chapter.id}
            className="chapter-marker"
            style={{ left: `${(chapter.startTime / duration) * 100}%` }}
          />
        ))}
      </div>

      {hoverTime !== null && thumbnailPosition && (
        <ThumbnailPreview
          time={hoverTime}
          position={thumbnailPosition}
          getThumbnail={getThumbnail}
        />
      )}
    </div>
  );
};
```


### 🏆 Evaluation Criteria


#### Video Integration (40%):


- Proper HTML5 video API usage
- Event handling cho video events (play, pause, timeupdate, etc.)
- Buffering state management
- Error handling cho video failures
- Performance optimization (no frame drops)
- Memory management cho video resources


#### User Interface (35%):


- Responsive control layout
- Smooth animations và transitions
- Proper hover states và feedback
- Accessibility compliance (ARIA, keyboard navigation)
- Touch-friendly mobile design
- Visual consistency với Netflix design system


#### Advanced Features (25%):


- Keyboard shortcuts implementation
- Fullscreen API integration
- Picture-in-Picture support
- Subtitle rendering và synchronization
- Thumbnail preview functionality
- Auto-hide controls logic


---


## 🎯 GOOGLE - Gmail Compose Rich Text Editor


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Rich Text Editing:**

Bold, italic, underline formatting
Font size và color selection
Bullet points và numbered lists
Text alignment (left, center, right)
Link insertion với URL validation
Image insertion với drag-and-drop
2. **Email Composition:**

To/CC/BCC fields với email validation
Subject line với character count
Auto-save drafts every 30 seconds
Send button với validation checks
Attachment handling với progress indicators
3. **Contact Integration:**

Email address autocomplete từ contacts
Recent recipients suggestions
Contact group expansion
Email validation và duplicate detection
4. **Advanced Features:**

Scheduled send functionality
Email templates support
Signature insertion
Importance level setting
Read receipt request option


#### Non-Functional Requirements:


- **Auto-save Performance:** Draft save < 500ms
- **Typing Latency:** No lag during fast typing
- **Contact Search:** Results in < 200ms
- **Attachment Upload:** Progress feedback, max 25MB
- **Data Persistence:** No data loss on browser crash


#### Technical Constraints:


- Support contentEditable với custom formatting
- Work with Gmail's existing keyboard shortcuts
- Handle paste từ various sources (Word, Google Docs)
- Maintain undo/redo functionality
- Security: XSS prevention trong rich content


### 🎯 Expected Implementation Details


#### 1. Rich Text Editor Core:


```typescript
// Expected editor component architecture
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selection: Selection) => void;
  placeholder?: string;
  readOnly?: boolean;
  maxLength?: number;
  allowedFormats?: FormattingOption[];
}

interface FormattingOption {
  type: 'bold' | 'italic' | 'underline' | 'link' | 'list' | 'alignment';
  enabled: boolean;
}

interface EditorState {
  content: string;
  selection: SelectionState;
  formatState: FormatState;
  undoStack: string[];
  redoStack: string[];
  isDirty: boolean;
}

interface SelectionState {
  anchorOffset: number;
  focusOffset: number;
  isCollapsed: boolean;
  selectedText: string;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
}
```


#### 2. Email Composition Logic:


```typescript
// Expected email composition component
interface EmailComposerProps {
  initialDraft?: Draft;
  onSend: (email: EmailData) => Promise<void>;
  onSaveDraft: (draft: Draft) => Promise<void>;
  onDiscard: () => void;
  contacts: Contact[];
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: Attachment[];
  importance: 'low' | 'normal' | 'high';
  scheduledSend?: Date;
  requestReadReceipt: boolean;
}

interface Draft {
  id: string;
  emailData: EmailData;
  lastSaved: Date;
  isAutoSaved: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  frequency: number; // for ranking suggestions
  lastContacted: Date;
  groups: string[];
}

// Expected auto-save implementation
const useAutoSave = (data: EmailData, onSave: (draft: Draft) => Promise<void>) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<number>();

  const saveContent = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const draft: Draft = {
        id: generateDraftId(),
        emailData: data,
        lastSaved: new Date(),
        isAutoSaved: true
      };

      await onSave(draft);
      setLastSaved(draft.lastSaved);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Expected error handling
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, isSaving]);

  useEffect(() => {
    // Debounced auto-save every 30 seconds
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(saveContent, 30000);

    return () => clearTimeout(timeoutRef.current);
  }, [data, saveContent]);

  return { lastSaved, isSaving, forceSave: saveContent };
};
```


#### 3. Contact Autocomplete System:


```typescript
// Expected contact autocomplete implementation
const useContactAutocomplete = (contacts: Contact[], query: string) => {
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchContacts = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        // Expected fuzzy search implementation
        const filtered = contacts.filter(contact => {
          const nameMatch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
          const emailMatch = contact.email.toLowerCase().includes(searchQuery.toLowerCase());
          return nameMatch || emailMatch;
        });

        // Expected ranking algorithm
        const ranked = filtered.sort((a, b) => {
          // Prioritize exact matches, then frequency, then recent contact
          const aExactMatch = a.email.toLowerCase().startsWith(searchQuery.toLowerCase());
          const bExactMatch = b.email.toLowerCase().startsWith(searchQuery.toLowerCase());

          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;

          // Then by frequency
          if (a.frequency !== b.frequency) {
            return b.frequency - a.frequency;
          }

          // Then by recency
          return b.lastContacted.getTime() - a.lastContacted.getTime();
        });

        setSuggestions(ranked.slice(0, 10)); // Top 10 suggestions
      } catch (error) {
        console.error('Contact search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200),
    [contacts]
  );

  useEffect(() => {
    searchContacts(query);
  }, [query, searchContacts]);

  return { suggestions, isLoading };
};

// Expected email validation
const validateEmailAddresses = (emails: string[]): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const results: ValidationResult = {
    valid: [],
    invalid: [],
    duplicates: []
  };

  const seen = new Set<string>();

  emails.forEach(email => {
    const normalizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      results.invalid.push(email);
    } else if (seen.has(normalizedEmail)) {
      results.duplicates.push(email);
    } else {
      results.valid.push(email);
      seen.add(normalizedEmail);
    }
  });

  return results;
};
```


#### 4. Rich Text Formatting Commands:


```typescript
// Expected formatting command system
class EditorCommandManager {
  private editor: HTMLDivElement;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxHistorySize = 50;

  constructor(editor: HTMLDivElement) {
    this.editor = editor;
  }

  executeCommand(command: EditorCommand): void {
    this.saveToHistory();

    switch (command.type) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'insertLink':
        this.insertLink(command.url);
        break;
      case 'insertImage':
        this.insertImage(command.src, command.alt);
        break;
      case 'formatBlock':
        document.execCommand('formatBlock', false, command.tag);
        break;
      default:
        console.warn('Unknown command:', command);
    }

    this.clearRedoStack();
  }

  private insertLink(url: string): void {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = selectedText;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      range.deleteContents();
      range.insertNode(link);
    }
  }

  private insertImage(src: string, alt: string): void {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      range.insertNode(img);
    }
  }

  private saveToHistory(): void {
    const currentContent = this.editor.innerHTML;
    this.undoStack.push(currentContent);

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  undo(): void {
    if (this.undoStack.length === 0) return;

    const currentContent = this.editor.innerHTML;
    this.redoStack.push(currentContent);

    const previousContent = this.undoStack.pop()!;
    this.editor.innerHTML = previousContent;
  }

  redo(): void {
    if (this.redoStack.length === 0) return;

    const currentContent = this.editor.innerHTML;
    this.undoStack.push(currentContent);

    const nextContent = this.redoStack.pop()!;
    this.editor.innerHTML = nextContent;
  }
}
```


### 🏆 Evaluation Criteria


#### Rich Text Implementation (40%):


- Proper contentEditable handling
- Command execution system
- Undo/redo functionality
- Selection management
- Paste handling từ external sources
- XSS prevention và content sanitization


#### Email Functionality (35%):


- Email validation algorithms
- Auto-save implementation với error handling
- Contact autocomplete performance
- Attachment handling với progress tracking
- Draft management và recovery
- Send validation checks


#### User Experience (25%):


- Responsive design cho mobile devices
- Keyboard shortcuts support
- Loading states và error feedback
- Accessibility compliance
- Performance optimization (no typing lag)
- Intuitive UI flow


---


## 🎯 Common Evaluation Patterns Across All Problems


### 🔍 Technical Assessment Framework


#### Code Quality (25%):


```typescript
// Expected standards
- TypeScript usage với proper typing
- Clean component architecture
- Custom hooks để reusable logic
- Error boundaries và error handling
- Memory leak prevention
- Performance optimizations (useMemo, useCallback)
- Testing considerations (component testability)
```


#### System Design Thinking (25%):


```typescript
// Expected discussions
- Scalability considerations
- State management strategy
- API design và data flow
- Caching strategies
- Performance bottlenecks identification
- Security considerations
- Browser compatibility planning
```


#### User Experience (25%):


```typescript
// Expected implementations
- Responsive design principles
- Accessibility compliance (WCAG 2.1)
- Loading states và error messages
- Smooth animations và transitions
- Mobile-first considerations
- Keyboard navigation support
- User feedback mechanisms
```


#### Advanced Topics (25%):


```typescript
// Expected knowledge areas
- Web APIs integration (Geolocation, Media, etc.)
- Service Workers cho offline functionality
- WebRTC cho real-time communication
- Canvas/WebGL cho graphics
- Web Workers cho heavy computations
- PWA capabilities
- Modern build tools và optimization
```


### 🎯 Follow-up Questions Pattern


**Edge Cases Exploration:**


- "Điều gì xảy ra khi user mất internet connection?"
- "Làm sao handle khi API response quá chậm?"
- "Security concerns nào bạn cần consider?"


**Scaling Discussions:**


- "Làm sao optimize cho 10 triệu concurrent users?"
- "Bundle size optimization strategies?"
- "Memory usage patterns với large datasets?"


**Alternative Solutions:**


- "Trade-offs của approach này so với alternatives?"
- "Khi nào bạn sẽ choose different architecture?"
- "Future extensibility considerations?"


Mỗi đề bài đều expect candidate giải thích reasoning, discuss trade-offs, và demonstrate deep understanding của underlying technologies thay vì chỉ implement basic functionality.


## Claude


# 📋 Tiếp Tục: Chi Tiết Requirements & Expectations


## 🎯 AMAZON - Product Search với Advanced Filters


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Search Functionality:**

Real-time search suggestions với typo tolerance
Search history với recent queries
Voice search integration (Web Speech API)
Barcode scanner (camera API) cho mobile
Auto-complete với product categories
2. **Advanced Filtering System:**

Price range slider với custom min/max input
Brand selection với search within brands
Customer rating filter (4 stars & up, etc.)
Availability filter (In Stock, Prime eligible)
Category hierarchy navigation
3. **Results Display:**

Grid/List view toggle
Sort options (Price, Rating, Reviews, Newest)
Infinite scroll với virtual scrolling
Quick view modal on hover
Comparison feature (select multiple products)
4. **URL State Management:**

All filters reflected trong URL
Shareable URLs với filter state
Browser back/forward navigation
Deep linking support


#### Non-Functional Requirements:


- **Search Performance:** Results in < 300ms
- **Filter Performance:** UI update < 100ms khi apply filters
- **SEO Requirements:** Server-side rendering cho search pages
- **Accessibility:** Full screen reader support, keyboard navigation
- **Mobile Performance:** Smooth scrolling, touch-friendly filters


#### Technical Constraints:


- Handle 100k+ products efficiently
- Support concurrent filter combinations
- Maintain search analytics tracking
- Work offline với cached results
- Bundle size contribution < 50KB gzipped


### 🎯 Expected Implementation Details


#### 1. Search Engine Architecture:


```typescript
// Expected search service structure
interface SearchService {
  search(query: string, filters: FilterState): Promise<SearchResults>;
  getSuggestions(query: string): Promise<SearchSuggestion[]>;
  getAutoComplete(query: string): Promise<AutoCompleteResult[]>;
  trackSearchEvent(event: SearchAnalyticsEvent): void;
}

interface SearchResults {
  products: Product[];
  totalCount: number;
  facets: SearchFacet[];
  suggestions: string[];
  searchTime: number;
  page: number;
  hasMore: boolean;
}

interface Product {
  id: string;
  title: string;
  price: {
    current: number;
    original?: number;
    currency: string;
  };
  rating: {
    average: number;
    count: number;
  };
  images: ProductImage[];
  brand: string;
  category: string[];
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  isPrime: boolean;
  freeShipping: boolean;
  discount?: {
    percentage: number;
    endDate: Date;
  };
}

interface FilterState {
  query: string;
  priceRange: { min: number; max: number };
  brands: string[];
  categories: string[];
  rating: number;
  availability: AvailabilityFilter[];
  sortBy: SortOption;
  page: number;
}

interface SearchFacet {
  type: 'brand' | 'category' | 'price' | 'rating' | 'availability';
  values: FacetValue[];
  selectedValues: string[];
}

interface FacetValue {
  value: string;
  label: string;
  count: number;
  disabled: boolean;
}
```


#### 2. Advanced Search Implementation:


```typescript
// Expected search hook với advanced features
const useProductSearch = (initialFilters: FilterState) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: FilterState) => {
      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchService.search(
          searchFilters.query,
          searchFilters
        );

        setResults(searchResults);

        // Track search analytics
        searchService.trackSearchEvent({
          query: searchFilters.query,
          filters: searchFilters,
          resultCount: searchResults.totalCount,
          timestamp: new Date()
        });

        // Update search history
        if (searchFilters.query) {
          setSearchHistory(prev => {
            const updated = [searchFilters.query, ...prev.filter(q => q !== searchFilters.query)];
            return updated.slice(0, 10); // Keep last 10 searches
          });
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Auto-suggestions với fuzzy matching
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const getSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const suggestionResults = await searchService.getSuggestions(query);
        setSuggestions(suggestionResults);
      } catch (err) {
        console.error('Failed to get suggestions:', err);
      }
    }, 150),
    []
  );

  // Filter management
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates, page: 1 }; // Reset to page 1 when filtering
      debouncedSearch(newFilters);
      return newFilters;
    });
  }, [debouncedSearch]);

  const clearFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      query: filters.query, // Keep the search query
      priceRange: { min: 0, max: 10000 },
      brands: [],
      categories: [],
      rating: 0,
      availability: [],
      sortBy: 'relevance',
      page: 1
    };
    setFilters(clearedFilters);
    debouncedSearch(clearedFilters);
  }, [filters.query, debouncedSearch]);

  // Load more for infinite scroll
  const loadMore = useCallback(async () => {
    if (!results?.hasMore || isLoading) return;

    const nextPageFilters = { ...filters, page: filters.page + 1 };
    setIsLoading(true);

    try {
      const moreResults = await searchService.search(
        nextPageFilters.query,
        nextPageFilters
      );

      setResults(prev => ({
        ...moreResults,
        products: [...(prev?.products || []), ...moreResults.products]
      }));

      setFilters(nextPageFilters);
    } catch (err) {
      setError('Failed to load more results');
    } finally {
      setIsLoading(false);
    }
  }, [filters, results, isLoading]);

  return {
    filters,
    results,
    isLoading,
    error,
    suggestions,
    searchHistory,
    updateFilters,
    clearFilters,
    loadMore,
    getSuggestions
  };
};
```


#### 3. Filter Components với Performance Optimization:


```typescript
// Expected price range filter với custom input
const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  min,
  max,
  value,
  onChange,
  bounds = { min: 0, max: 10000 }
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Debounced onChange để avoid excessive API calls
  const debouncedOnChange = useCallback(
    debounce((newValue: { min: number; max: number }) => {
      onChange(newValue);
    }, 300),
    [onChange]
  );

  const handleSliderChange = useCallback((newValue: number[]) => {
    const priceRange = { min: newValue[0], max: newValue[1] };
    setLocalValue(priceRange);

    if (!isDragging) {
      debouncedOnChange(priceRange);
    }
  }, [isDragging, debouncedOnChange]);

  const handleInputChange = useCallback((type: 'min' | 'max', inputValue: string) => {
    const numValue = parseFloat(inputValue) || 0;
    const newValue = {
      ...localValue,
      [type]: Math.max(bounds.min, Math.min(bounds.max, numValue))
    };

    setLocalValue(newValue);
    debouncedOnChange(newValue);
  }, [localValue, bounds, debouncedOnChange]);

  return (
    <div className="price-range-filter">
      <div className="price-inputs">
        <input
          type="number"
          value={localValue.min}
          onChange={(e) => handleInputChange('min', e.target.value)}
          placeholder="Min"
          min={bounds.min}
          max={bounds.max}
        />
        <span>to</span>
        <input
          type="number"
          value={localValue.max}
          onChange={(e) => handleInputChange('max', e.target.value)}
          placeholder="Max"
          min={bounds.min}
          max={bounds.max}
        />
      </div>

      <div className="price-slider">
        <Slider
          range
          min={bounds.min}
          max={bounds.max}
          value={[localValue.min, localValue.max]}
          onChange={handleSliderChange}
          onAfterChange={() => {
            setIsDragging(false);
            debouncedOnChange(localValue);
          }}
          onBeforeChange={() => setIsDragging(true)}
        />
      </div>

      <div className="price-presets">
        {PRICE_PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => {
              setLocalValue(preset.range);
              onChange(preset.range);
            }}
            className={classNames('preset-button', {
              active: localValue.min === preset.range.min && localValue.max === preset.range.max
            })}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Expected brand filter với search
const BrandFilter: React.FC<BrandFilterProps> = ({
  brands,
  selectedBrands,
  onSelectionChange,
  maxVisible = 5
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredBrands = useMemo(() => {
    return brands.filter(brand =>
      brand.label.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      // Prioritize selected brands, then by product count
      if (selectedBrands.includes(a.value) && !selectedBrands.includes(b.value)) return -1;
      if (!selectedBrands.includes(a.value) && selectedBrands.includes(b.value)) return 1;
      return b.count - a.count;
    });
  }, [brands, searchQuery, selectedBrands]);

  const visibleBrands = showAll ? filteredBrands : filteredBrands.slice(0, maxVisible);

  return (
    <div className="brand-filter">
      {brands.length > maxVisible && (
        <div className="brand-search">
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="brand-search-input"
          />
        </div>
      )}

      <div className="brand-list">
        {visibleBrands.map(brand => (
          <label key={brand.value} className="brand-option">
            <input
              type="checkbox"
              checked={selectedBrands.includes(brand.value)}
              onChange={(e) => {
                const newSelection = e.target.checked
                  ? [...selectedBrands, brand.value]
                  : selectedBrands.filter(b => b !== brand.value);
                onSelectionChange(newSelection);
              }}
            />
            <span className="brand-name">{brand.label}</span>
            <span className="brand-count">({brand.count})</span>
          </label>
        ))}
      </div>

      {!showAll && filteredBrands.length > maxVisible && (
        <button
          className="show-more-brands"
          onClick={() => setShowAll(true)}
        >
          Show {filteredBrands.length - maxVisible} more brands
        </button>
      )}
    </div>
  );
};
```


#### 4. URL State Synchronization:


```typescript
// Expected URL state management
const useUrlState = (initialFilters: FilterState) => {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.query) params.set('q', filters.query);
    if (filters.priceRange.min > 0) params.set('min_price', filters.priceRange.min.toString());
    if (filters.priceRange.max < 10000) params.set('max_price', filters.priceRange.max.toString());
    if (filters.brands.length > 0) params.set('brands', filters.brands.join(','));
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.rating > 0) params.set('rating', filters.rating.toString());
    if (filters.availability.length > 0) params.set('availability', filters.availability.join(','));
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
    if (filters.page > 1) params.set('page', filters.page.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    // Update URL without triggering navigation
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  // Parse filters from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const urlFilters: FilterState = {
      query: urlParams.get('q') || '',
      priceRange: {
        min: parseInt(urlParams.get('min_price') || '0'),
        max: parseInt(urlParams.get('max_price') || '10000')
      },
      brands: urlParams.get('brands')?.split(',').filter(Boolean) || [],
      categories: urlParams.get('categories')?.split(',').filter(Boolean) || [],
      rating: parseInt(urlParams.get('rating') || '0'),
      availability: (urlParams.get('availability')?.split(',').filter(Boolean) || []) as AvailabilityFilter[],
      sortBy: (urlParams.get('sort') || 'relevance') as SortOption,
      page: parseInt(urlParams.get('page') || '1')
    };

    setFilters(urlFilters);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      // Re-parse URL and update filters
      const urlParams = new URLSearchParams(window.location.search);
      // ... parsing logic similar to above
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { filters, setFilters };
};
```


### 🏆 Evaluation Criteria


#### Search Performance (35%):


- Debouncing implementation cho search queries
- Efficient filtering algorithms
- Virtual scrolling cho large result sets
- Caching strategies cho repeated searches
- API optimization (pagination, field selection)
- Search analytics implementation


#### Filter System (35%):


- Complex filter combination logic
- Filter state management
- URL synchronization accuracy
- Filter UI performance (no lag on selection)
- Filter persistence across sessions
- Clear filter functionality


#### User Experience (30%):


- Responsive design cho all screen sizes
- Accessibility compliance (keyboard navigation, screen readers)
- Loading states và error handling
- Smooth animations và transitions
- Mobile-optimized filter interface
- Search suggestion quality


---


## 🎯 AIRBNB - Interactive Booking Calendar


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Calendar Core Features:**

Date range selection (check-in → check-out)
Blocked dates display (unavailable, booked)
Minimum stay requirements (e.g., 3 nights minimum)
Maximum stay limitations (e.g., 28 nights max)
Price per night display on hover
2. **Interactive Features:**

Keyboard navigation (arrow keys, Enter, Escape)
Touch gestures cho mobile (swipe between months)
Month/year navigation với smooth transitions
Quick date presets (Next weekend, Next week)
Clear selection functionality
3. **Pricing Integration:**

Dynamic pricing display per date
Weekend/weekday price differences
Seasonal pricing adjustments
Special event premium pricing
Total price calculation với fees
4. **Validation & Rules:**

Past dates should be disabled
Same-day booking availability check
Checkout date must be after check-in
Gap filling between bookings
Holiday restrictions


#### Non-Functional Requirements:


- **Performance:** Calendar render < 100ms
- **Responsiveness:** Work smoothly on mobile devices
- **Accessibility:** WCAG 2.1 AA compliance
- **Internationalization:** Support multiple locales và currencies
- **Data Sync:** Real-time availability updates


#### Technical Constraints:


- Support date ranges up to 2 years in advance
- Handle timezone differences correctly
- Work offline với cached availability data
- Integrate với existing booking flow
- Bundle size < 40KB gzipped


### 🎯 Expected Implementation Details


#### 1. Calendar Data Structures:


```typescript
// Expected calendar interfaces
interface CalendarProps {
  propertyId: string;
  availability: AvailabilityData;
  pricing: PricingData;
  rules: BookingRules;
  selectedRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  onMonthChange?: (month: Date) => void;
  locale?: string;
  currency?: string;
}

interface AvailabilityData {
  [dateString: string]: DateAvailability;
}

interface DateAvailability {
  available: boolean;
  status: 'available' | 'booked' | 'blocked' | 'checkout_only' | 'checkin_only';
  minimumStay?: number;
  maximumStay?: number;
  reason?: string; // for blocked dates
}

interface PricingData {
  [dateString: string]: DayPricing;
}

interface DayPricing {
  basePrice: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxes?: number;
  discounts?: Discount[];
  isWeekend: boolean;
  isSpecialEvent: boolean;
}

interface BookingRules {
  minimumStay: number;
  maximumStay: number;
  advanceNotice: number; // hours
  preparationTime: number; // hours between bookings
  checkInTime: { start: string; end: string };
  checkOutTime: string;
  sameDayBooking: boolean;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
  nights: number;
  totalPrice: number;
}
```


#### 2. Calendar State Management:


```typescript
// Expected calendar hook
const useBookingCalendar = (props: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(props.selectedRange);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectingCheckout, setSelectingCheckout] = useState(false);

  // Generate calendar months
  const calendarMonths = useMemo(() => {
    const months = [];
    const start = startOfMonth(currentMonth);

    for (let i = 0; i < 12; i++) {
      months.push(addMonths(start, i));
    }

    return months;
  }, [currentMonth]);

  // Date selection logic
  const handleDateClick = useCallback((date: Date) => {
    if (!isDateSelectable(date, props.availability, props.rules)) {
      return;
    }

    if (!selectedRange || !selectingCheckout) {
      // Selecting check-in date
      setSelectedRange({
        startDate: date,
        endDate: date,
        nights: 0,
        totalPrice: 0
      });
      setSelectingCheckout(true);
    } else {
      // Selecting check-out date
      if (isBefore(date, selectedRange.startDate)) {
        // If clicked date is before check-in, start new selection
        setSelectedRange({
          startDate: date,
          endDate: date,
          nights: 0,
          totalPrice: 0
        });
      } else {
        // Complete date range selection
        const nights = differenceInDays(date, selectedRange.startDate);
        const totalPrice = calculateTotalPrice(selectedRange.startDate, date, props.pricing);

        const finalRange: DateRange = {
          startDate: selectedRange.startDate,
          endDate: date,
          nights,
          totalPrice
        };

        // Validate the range
        if (isValidDateRange(finalRange, props.availability, props.rules)) {
          setSelectedRange(finalRange);
          setSelectingCheckout(false);
          props.onDateRangeChange(finalRange);
        }
      }
    }
  }, [selectedRange, selectingCheckout, props]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedRange) return;

    const currentDate = selectingCheckout ? selectedRange.endDate : selectedRange.startDate;
    let newDate: Date;

    switch (e.key) {
      case 'ArrowLeft':
        newDate = subDays(currentDate, 1);
        break;
      case 'ArrowRight':
        newDate = addDays(currentDate, 1);
        break;
      case 'ArrowUp':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'ArrowDown':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'Enter':
        handleDateClick(currentDate);
        return;
      case 'Escape':
        setSelectedRange(null);
        setSelectingCheckout(false);
        props.onDateRangeChange(null);
        return;
      default:
        return;
    }

    e.preventDefault();

    if (isDateSelectable(newDate, props.availability, props.rules)) {
      if (selectingCheckout) {
        setSelectedRange(prev => prev ? { ...prev, endDate: newDate } : null);
      } else {
        setSelectedRange({ startDate: newDate, endDate: newDate, nights: 0, totalPrice: 0 });
      }
    }
  }, [selectedRange, selectingCheckout, handleDateClick, props]);

  // Price calculation
  const calculateTotalPrice = useCallback((startDate: Date, endDate: Date, pricing: PricingData): number => {
    let total = 0;
    let currentDate = startDate;

    while (isBefore(currentDate, endDate)) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      const dayPricing = pricing[dateString];

      if (dayPricing) {
        total += dayPricing.basePrice;

        // Apply discounts
        dayPricing.discounts?.forEach(discount => {
          if (discount.type === 'percentage') {
            total -= (dayPricing.basePrice * discount.value) / 100;
          } else {
            total -= discount.value;
          }
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return total;
  }, []);

  return {
    currentMonth,
    setCurrentMonth,
    selectedRange,
    setSelectedRange,
    hoverDate,
    setHoverDate,
    selectingCheckout,
    calendarMonths,
    handleDateClick,
    handleKeyDown,
    calculateTotalPrice
  };
};
```


#### 3. Date Validation Logic:


```typescript
// Expected validation functions
const isDateSelectable = (
  date: Date,
  availability: AvailabilityData,
  rules: BookingRules
): boolean => {
  const dateString = format(date, 'yyyy-MM-dd');
  const dayAvailability = availability[dateString];

  // Check if date is in the past
  if (isBefore(date, startOfDay(new Date()))) {
    return false;
  }

  // Check advance notice requirement
  const hoursFromNow = differenceInHours(date, new Date());
  if (hoursFromNow < rules.advanceNotice) {
    return false;
  }

  // Check availability
  if (!dayAvailability || !dayAvailability.available) {
    return false;
  }

  return true;
};

const isValidDateRange = (
  range: DateRange,
  availability: AvailabilityData,
  rules: BookingRules
): boolean => {
  // Check minimum stay
  if (range.nights < rules.minimumStay) {
    return false;
  }

  // Check maximum stay
  if (range.nights > rules.maximumStay) {
    return false;
  }

  // Check all dates in range are available
  let currentDate = range.startDate;
  while (isBefore(currentDate, range.endDate)) {
    if (!isDateSelectable(currentDate, availability, rules)) {
      return false;
    }
    currentDate = addDays(currentDate, 1);
  }

  // Check preparation time between bookings
  const dayBefore = subDays(range.startDate, 1);
  const dayAfter = addDays(range.endDate, 1);

  const beforeAvailability = availability[format(dayBefore, 'yyyy-MM-dd')];
  const afterAvailability = availability[format(dayAfter, 'yyyy-MM-dd')];

  if (beforeAvailability?.status === 'booked' || afterAvailability?.status === 'booked') {
    const hoursGap = differenceInHours(range.startDate, dayBefore);
    if (hoursGap < rules.preparationTime) {
      return false;
    }
  }

  return true;
};

// Expected blocked date pattern detection
const getBlockedDateRanges = (availability: AvailabilityData): DateRange[] => {
  const blockedRanges: DateRange[] = [];
  const sortedDates = Object.keys(availability)
    .filter(date => !availability[date].available)
    .sort();

  let currentRange: { start: Date; end: Date } | null = null;

  sortedDates.forEach(dateString => {
    const date = parseISO(dateString);

    if (!currentRange) {
      currentRange = { start: date, end: date };
    } else if (differenceInDays(date, currentRange.end) === 1) {
      // Consecutive blocked date
      currentRange.end = date;
    } else {
      // Gap found, finish current range and start new one
      blockedRanges.push({
        startDate: currentRange.start,
        endDate: currentRange.end,
        nights: differenceInDays(currentRange.end, currentRange.start),
        totalPrice: 0
      });
      currentRange = { start: date, end: date };
    }
  });

  if (currentRange) {
    blockedRanges.push({
      startDate: currentRange.start,
      endDate: currentRange.end,
      nights: differenceInDays(currentRange.end, currentRange.start),
      totalPrice: 0
    });
  }

  return blockedRanges;
};
```


#### 4. Calendar Rendering Optimization:


```typescript
// Expected optimized calendar day component
const CalendarDay: React.FC<CalendarDayProps> = React.memo(({
  date,
  availability,
  pricing,
  isSelected,
  isInRange,
  isHovered,
  onClick,
  onHover
}) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const dayAvailability = availability[dateString];
  const dayPricing = pricing[dateString];

  const isSelectable = isDateSelectable(date, availability, rules);
  const isToday = isSameDay(date, new Date());
  const isWeekend = isWeekend(date);

  const dayClasses = classNames('calendar-day', {
    'calendar-day--selectable': isSelectable,
    'calendar-day--blocked': !isSelectable,
    'calendar-day--selected': isSelected,
    'calendar-day--in-range': isInRange,
    'calendar-day--hovered': isHovered,
    'calendar-day--today': isToday,
    'calendar-day--weekend': isWeekend,
    'calendar-day--checkout-only': dayAvailability?.status === 'checkout_only',
    'calendar-day--checkin-only': dayAvailability?.status === 'checkin_only'
  });

  const handleClick = useCallback(() => {
    if (isSelectable) {
      onClick(date);
    }
  }, [isSelectable, onClick, date]);

  const handleMouseEnter = useCallback(() => {
    if (isSelectable) {
      onHover(date);
    }
  }, [isSelectable, onHover, date]);

  return (
    <button
      className={dayClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={!isSelectable}
      aria-label={`${format(date, 'MMMM d, yyyy')}${dayPricing ? `, $${dayPricing.basePrice}` : ''}`}
      aria-selected={isSelected}
    >
      <span className="calendar-day__date">
        {format(date, 'd')}
      </span>

      {dayPricing && isSelectable && (
        <span className="calendar-day__price">
          ${dayPricing.basePrice}
        </span>
      )}

      {dayAvailability?.status === 'booked' && (
        <span className="calendar-day__status">Booked</span>
      )}

      {dayAvailability?.minimumStay && dayAvailability.minimumStay > 1 && (
        <span className="calendar-day__min-stay">
          {dayAvailability.minimumStay}n min
        </span>
      )}
    </button>
  );
});

// Expected month virtualization for performance
const useVirtualizedCalendar = (months: Date[], containerHeight: number) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 3 });
  const monthHeight = 300; // Estimated height per month

  const handleScroll = useCallback((scrollTop: number) => {
    const start = Math.floor(scrollTop / monthHeight);
    const end = Math.min(months.length, start + Math.ceil(containerHeight / monthHeight) + 1);

    setVisibleRange({ start, end });
  }, [months.length, containerHeight]);

  const visibleMonths = useMemo(() => {
    return months.slice(visibleRange.start, visibleRange.end);
  }, [months, visibleRange]);

  return { visibleMonths, handleScroll };
};
```


### 🏆 Evaluation Criteria


#### Calendar Logic (40%):


- Accurate date range selection logic
- Proper validation implementation
- Minimum/maximum stay handling
- Blocked date pattern recognition
- Timezone handling accuracy
- Edge case management (leap years, DST)


#### User Interface (35%):


- Responsive design cho mobile/desktop
- Smooth animations và transitions
- Keyboard navigation implementation
- Touch gesture support
- Visual feedback for interactions
- Accessibility compliance (ARIA labels, focus management)


#### Performance (25%):


- Efficient rendering cho large date ranges
- Memory management cho calendar data
- Optimized re-renders (React.memo, useMemo)
- Smooth scrolling performance
- Bundle size optimization
- Cache management cho pricing/availability data


---


## 🎯 SPOTIFY - Music Player với Advanced Features


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Core Player Features:**

Play/Pause/Skip controls với smooth transitions
Progress bar với precise seeking
Volume control với smooth adjustments
Shuffle mode với true randomization
Repeat modes (off, one, all)
2. **Queue Management:**

Current playing queue display
Drag-and-drop queue reordering
Add to queue functionality
Queue history (recently played)
Smart queue suggestions
3. **Audio Features:**

Crossfade between tracks (configurable duration)
Equalizer với presets và custom settings
Gapless playback cho albums
Audio normalization options
Lyrics display synchronized với audio
4. **Integration Features:**

Keyboard media keys support
System media session integration
Picture-in-picture mode cho mini player
Offline playback capability
Social sharing của current track


#### Non-Functional Requirements:


- **Audio Quality:** No stuttering, smooth transitions
- **Response Time:** Controls response < 50ms
- **Memory Usage:** < 100MB for audio buffers
- **CPU Usage:** < 5% during normal playback
- **Network Optimization:** Adaptive streaming based on connection


#### Technical Constraints:


- Support Web Audio API cho advanced features
- Handle various audio formats (MP3, AAC, OGG)
- Work with encrypted audio streams
- Integrate với service workers cho offline
- Bundle size contribution < 60KB gzipped


### 🎯 Expected Implementation Details


#### 1. Audio Engine Architecture:


```typescript
// Expected audio engine interface
interface AudioEngine {
  load(track: Track): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(position: number): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getBufferedRanges(): TimeRanges;
  addEventListener(event: AudioEvent, callback: Function): void;
  removeEventListener(event: AudioEvent, callback: Function): void;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  audioUrl: string;
  artwork: TrackArtwork[];
  lyrics?: LyricLine[];
  metadata: TrackMetadata;
}

interface TrackArtwork {
  src: string;
  sizes: string;
  type: string;
}

interface LyricLine {
  startTime: number;
  endTime: number;
  text: string;
  words?: LyricWord[];
}

interface LyricWord {
  startTime: number;
  endTime: number;
  text: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
  queue: Track[];
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
  crossfadeDuration: number;
  equalizerSettings: EqualizerBand[];
}

interface EqualizerBand {
  frequency: number;
  gain: number;
}
```


#### 2. Advanced Audio Implementation:


```typescript
// Expected Web Audio API integration
class AdvancedAudioEngine implements AudioEngine {
  private audioContext: AudioContext;
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode;
  private gainNode: GainNode;
  private equalizerNodes: BiquadFilterNode[] = [];
  private crossfadeGainNode: GainNode;
  private analyserNode: AnalyserNode;

  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioElement = new Audio();
    this.setupAudioGraph();
  }

  private setupAudioGraph(): void {
    // Create audio graph: Source -> EQ -> Gain -> Crossfade -> Destination
    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
    this.gainNode = this.audioContext.createGain();
    this.crossfadeGainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();

    // Setup equalizer bands
    this.setupEqualizer();

    // Connect nodes
    let previousNode = this.sourceNode;

    // Connect EQ bands in series
    this.equalizerNodes.forEach(node => {
      previousNode.connect(node);
      previousNode = node;
    });

    previousNode.connect(this.gainNode);
    this.gainNode.connect(this.crossfadeGainNode);
    this.crossfadeGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  private setupEqualizer(): void {
    // Standard 10-band equalizer frequencies
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    frequencies.forEach((frequency, index) => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' :
                   index === frequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;

      this.equalizerNodes.push(filter);
    });
  }

  async load(track: Track): Promise<void> {
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.audioElement.src = track.audioUrl;

      return new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          this.audioElement.removeEventListener('canplaythrough', handleCanPlay);
          this.audioElement.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = () => {
          this.audioElement.removeEventListener('canplaythrough', handleCanPlay);
          this.audioElement.removeEventListener('error', handleError);
          reject(new Error('Failed to load audio'));
        };

        this.audioElement.addEventListener('canplaythrough', handleCanPlay);
        this.audioElement.addEventListener('error', handleError);
        this.audioElement.load();
      });
    } catch (error) {
      throw new Error(`Audio loading failed: ${error.message}`);
    }
  }

  async play(): Promise<void> {
    try {
      await this.audioElement.play();
    } catch (error) {
      throw new Error(`Playback failed: ${error.message}`);
    }
  }

  pause(): void {
    this.audioElement.pause();
  }

  seek(position: number): void {
    this.audioElement.currentTime = position;
  }

  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }

  // Crossfade implementation
  async crossfadeTo(nextTrack: Track, duration: number = 3): Promise<void> {
    const nextAudioElement = new Audio(nextTrack.audioUrl);
    const nextSourceNode = this.audioContext.createMediaElementSource(nextAudioElement);
    const nextGainNode = this.audioContext.createGain();

    // Connect next track with zero gain
    nextSourceNode.connect(nextGainNode);
    nextGainNode.connect(this.audioContext.destination);
    nextGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    // Start playing next track
    await nextAudioElement.play();

    // Crossfade: current track fade out, next track fade in
    const now = this.audioContext.currentTime;

    this.crossfadeGainNode.gain.linearRampToValueAtTime(0, now + duration);
    nextGainNode.gain.linearRampToValueAtTime(1, now + duration);

    // Switch to next track after crossfade
    setTimeout(() => {
      this.pause();
      // Update internal references to next track
    }, duration * 1000);
  }

  // Equalizer controls
  setEqualizerBand(index: number, gain: number): void {
    if (this.equalizerNodes[index]) {
      this.equalizerNodes[index].gain.setValueAtTime(
        gain,
        this.audioContext.currentTime
      );
    }
  }

  // Audio analysis for visualizations
  getFrequencyData(): Uint8Array {
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData(): Uint8Array {
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }
}
```


#### 3. Smart Queue Management:


```typescript
// Expected queue management với intelligent features
const useSmartQueue = (initialQueue: Track[]) => {
  const [queue, setQueue] = useState<Track[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffleIndices, setShuffleIndices] = useState<number[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [playHistory, setPlayHistory] = useState<Track[]>([]);

  // Fisher-Yates shuffle algorithm
  const generateShuffleIndices = useCallback((queueLength: number, currentIndex: number): number[] => {
    const indices = Array.from({ length: queueLength }, (_, i) => i);

    // Remove current track from shuffle
    indices.splice(currentIndex, 1);

    // Shuffle remaining indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Insert current track at beginning
    indices.unshift(currentIndex);

    return indices;
  }, []);

  // Smart next track selection
  const getNextTrack = useCallback((): Track | null => {
    if (queue.length === 0) return null;

    if (repeatMode === 'one') {
      return queue[currentIndex];
    }

    let nextIndex: number;

    if (isShuffled) {
      const currentShufflePos = shuffleIndices.indexOf(currentIndex);
      const nextShufflePos = currentShufflePos + 1;

      if (nextShufflePos >= shuffleIndices.length) {
        if (repeatMode === 'all') {
          // Generate new shuffle order
          const newShuffleIndices = generateShuffleIndices(queue.length, currentIndex);
          setShuffleIndices(newShuffleIndices);
          nextIndex = newShuffleIndices[1]; // Skip current track at index 0
        } else {
          return null; // End of queue
        }
      } else {
        nextIndex = shuffleIndices[nextShufflePos];
      }
    } else {
      nextIndex = currentIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return null; // End of queue
        }
      }
    }

    return queue[nextIndex];
  }, [queue, currentIndex, isShuffled, shuffleIndices, repeatMode, generateShuffleIndices]);

  // Queue manipulation
  const addToQueue = useCallback((tracks: Track[], position?: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const insertPosition = position ?? newQueue.length;
      newQueue.splice(insertPosition, 0, ...tracks);
      return newQueue;
    });
  }, []);

  const removeFromQueue = useCallback((indices: number[]) => {
    setQueue(prev => {
      const newQueue = prev.filter((_, index) => !indices.includes(index));

      // Adjust current index if necessary
      const removedBeforeCurrent = indices.filter(i => i < currentIndex).length;
      setCurrentIndex(prev => Math.max(0, prev - removedBeforeCurrent));

      return newQueue;
    });
  }, [currentIndex]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedTrack] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedTrack);

      // Update current index if the current track was moved
      if (fromIndex === currentIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        setCurrentIndex(prev => prev + 1);
      }

      return newQueue;
    });
  }, [currentIndex]);

  // Shuffle toggle
  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      if (!prev) {
        // Enabling shuffle
        const newShuffleIndices = generateShuffleIndices(queue.length, currentIndex);
        setShuffleIndices(newShuffleIndices);
      }
      return !prev;
    });
  }, [queue.length, currentIndex, generateShuffleIndices]);

  // Smart queue suggestions based on listening history
  const getQueueSuggestions = useCallback(async (): Promise<Track[]> => {
    if (playHistory.length === 0) return [];

    // Analyze listening patterns
    const genreFrequency = new Map<string, number>();
    const artistFrequency = new Map<string, number>();

    playHistory.forEach(track => {
      // Count genres
      track.metadata.genres?.forEach(genre => {
        genreFrequency.set(genre, (genreFrequency.get(genre) || 0) + 1);
      });

      // Count artists
      artistFrequency.set(track.artist, (artistFrequency.get(track.artist) || 0) + 1);
    });

    // Get recommendations based on patterns
    // This would typically call a recommendation API
    const suggestions = await getRecommendations({
      genres: Array.from(genreFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre),
      artists: Array.from(artistFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([artist]) => artist),
      excludeTrackIds: queue.map(track => track.id)
    });

    return suggestions;
  }, [playHistory, queue]);

  return {
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    playHistory,
    getNextTrack,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    toggleShuffle,
    setRepeatMode,
    getQueueSuggestions
  };
};
```


#### 4. Synchronized Lyrics Implementation:


```typescript
// Expected lyrics synchronization
const useSynchronizedLyrics = (track: Track | null, currentTime: number) => {
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

  // Find current lyric line
  useEffect(() => {
    if (!track?.lyrics || track.lyrics.length === 0) {
      setCurrentLyricIndex(-1);
      setCurrentWordIndex(-1);
      return;
    }

    // Binary search for efficiency với large lyric files
    let left = 0;
    let right = track.lyrics.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const lyric = track.lyrics[mid];

      if (currentTime >= lyric.startTime && currentTime <= lyric.endTime) {
        result = mid;
        break;
      } else if (currentTime < lyric.startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // If not found, find the closest previous line
    if (result === -1) {
      for (let i = track.lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= track.lyrics[i].startTime) {
          result = i;
          break;
        }
      }
    }

    setCurrentLyricIndex(result);

    // Find current word within the line
    if (result >= 0 && track.lyrics[result].words) {
      const words = track.lyrics[result].words!;
      let wordResult = -1;

      for (let i = 0; i < words.length; i++) {
        if (currentTime >= words[i].startTime && currentTime <= words[i].endTime) {
          wordResult = i;
          break;
        }
      }

      setCurrentWordIndex(wordResult);
    } else {
      setCurrentWordIndex(-1);
    }
  }, [track, currentTime]);

  // Get lyrics context (previous, current, next lines)
  const getLyricsContext = useCallback(() => {
    if (!track?.lyrics || currentLyricIndex === -1) {
      return { previous: null, current: null, next: null };
    }

    return {
      previous: currentLyricIndex > 0 ? track.lyrics[currentLyricIndex - 1] : null,
      current: track.lyrics[currentLyricIndex],
      next: currentLyricIndex < track.lyrics.length - 1 ? track.lyrics[currentLyricIndex + 1] : null
    };
  }, [track, currentLyricIndex]);

  // Seek to specific lyric line
  const seekToLyric = useCallback((lyricIndex: number) => {
    if (!track?.lyrics || lyricIndex < 0 || lyricIndex >= track.lyrics.length) {
      return;
    }

    const targetTime = track.lyrics[lyricIndex].startTime;
    // This would call the player's seek function
    return targetTime;
  }, [track]);

  return {
    currentLyricIndex,
    currentWordIndex,
    getLyricsContext,
    seekToLyric
  };
};

// Expected lyrics display component
const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  track,
  currentTime,
  onSeekToTime
}) => {
  const { currentLyricIndex, currentWordIndex, getLyricsContext } = useSynchronizedLyrics(track, currentTime);
  const lyricsContext = getLyricsContext();

  const scrollToCurrentLyric = useCallback(() => {
    const currentElement = document.getElementById(`lyric-${currentLyricIndex}`);
    if (currentElement) {
      currentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLyricIndex]);

  useEffect(() => {
    scrollToCurrentLyric();
  }, [currentLyricIndex, scrollToCurrentLyric]);

  if (!track?.lyrics) {
    return <div className="lyrics-display lyrics-display--no-lyrics">No lyrics available</div>;
  }

  return (
    <div className="lyrics-display">
      {track.lyrics.map((lyric, index) => (
        <div
          key={index}
          id={`lyric-${index}`}
          className={classNames('lyric-line', {
            'lyric-line--current': index === currentLyricIndex,
            'lyric-line--past': index < currentLyricIndex,
            'lyric-line--future': index > currentLyricIndex
          })}
          onClick={() => onSeekToTime(lyric.startTime)}
        >
          {lyric.words ? (
            <span className="lyric-words">
              {lyric.words.map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  className={classNames('lyric-word', {
                    'lyric-word--current': index === currentLyricIndex && wordIndex === currentWordIndex,
                    'lyric-word--highlighted': index === currentLyricIndex && wordIndex <= currentWordIndex
                  })}
                >
                  {word.text}
                </span>
              ))}
            </span>
          ) : (
            <span className="lyric-text">{lyric.text}</span>
          )}
        </div>
      ))}
    </div>
  );
};
```


### 🏆 Evaluation Criteria


#### Audio Implementation (40%):


- Web Audio API integration
- Crossfade functionality
- Equalizer implementation
- Gapless playback
- Audio analysis for visualizations
- Performance optimization (memory, CPU usage)


#### Queue Management (35%):


- Smart shuffle algorithm
- Drag-and-drop reordering
- Queue persistence
- Intelligent recommendations
- History tracking
- State synchronization across components


#### User Experience (25%):


- Responsive player controls
- Synchronized lyrics display
- Keyboard shortcuts
- Media session integration
- Accessibility support
- Smooth animations và transitions


---


## 🎯 DISCORD - Real-time Chat với Threading


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Core Messaging:**

Real-time message sending/receiving via WebSocket
Message threading với nested reply structure
Rich text formatting (bold, italic, code, links)
Emoji reactions với custom emoji support
Message editing/deletion với history tracking
2. **Advanced Chat Features:**

File upload với drag-and-drop (images, videos, documents)
Voice message recording và playback
Message search across channels với filters
Message pinning và bookmarking
Typing indicators với multiple users
3. **Channel Management:**

Real-time user presence (online, away, DND, offline)
Channel-specific permissions và roles
Voice channel integration planning
Channel categories với collapsible sections
Server-wide notifications settings
4. **Performance Features:**

Message virtualization cho large chat histories
Efficient state management cho multiple channels
Offline message queuing và sync
Image/video lazy loading và caching
Network optimization cho poor connections


#### Non-Functional Requirements:


- **Real-time Latency:** < 100ms message delivery
- **Message Load Time:** < 500ms for chat history
- **Memory Usage:** < 200MB cho 10 active channels
- **Concurrent Users:** Support 1000+ users per channel
- **Message Throughput:** Handle 100+ messages/second per channel


#### Technical Constraints:


- WebSocket connection với automatic reconnection
- End-to-end message encryption planning
- Support markdown-style formatting
- Handle very long conversations (100k+ messages)
- Bundle size < 80KB gzipped


### 🎯 Expected Implementation Details


#### 1. Real-time Communication Architecture:


```typescript
// Expected WebSocket service with robust connection management
interface ChatWebSocketService {
  connect(userId: string, serverId: string): Promise<void>;
  disconnect(): void;
  sendMessage(message: OutgoingMessage): void;
  joinChannel(channelId: string): void;
  leaveChannel(channelId: string): void;
  subscribe(event: ChatEvent, callback: (data: any) => void): void;
  unsubscribe(event: ChatEvent, callback: (data: any) => void): void;
}

interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  timestamp: Date;
  editedTimestamp?: Date;
  replyToId?: string;
  threadId?: string;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  mentions: UserMention[];
  embeds: MessageEmbed[];
  flags: MessageFlag[];
}

interface MessageReaction {
  emoji: string | CustomEmoji;
  count: number;
  userIds: string[];
  isCurrentUser: boolean;
}

interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxyUrl: string;
  width?: number;
  height?: number;
  contentType: string;
  spoiler: boolean;
}

interface ChatState {
  channels: { [channelId: string]: ChannelState };
  currentChannelId: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  typingUsers: { [channelId: string]: TypingUser[] };
  unreadCounts: { [channelId: string]: number };
  user: CurrentUser;
}

interface ChannelState {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'thread';
  messages: Message[];
  hasMoreMessages: boolean;
  isLoading: boolean;
  lastReadMessageId: string | null;
  permissions: ChannelPermissions;
}
```


#### 2. Message Threading Implementation:


```typescript
// Expected threading logic với efficient data structures
const useMessageThreading = (messages: Message[]) => {
  // Build thread tree structure
  const threadMap = useMemo(() => {
    const map = new Map<string, Message[]>();
    const rootMessages: Message[] = [];

    messages.forEach(message => {
      if (message.replyToId || message.threadId) {
        // This is a reply or thread message
        const threadKey = message.threadId || message.replyToId!;

        if (!map.has(threadKey)) {
          map.set(threadKey, []);
        }
        map.get(threadKey)!.push(message);
      } else {
        // This is a root message
        rootMessages.push(message);
      }
    });

    // Sort thread messages by timestamp
    map.forEach(threadMessages => {
      threadMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    return { threadMap: map, rootMessages };
  }, [messages]);

  // Get thread preview (last few messages)
  const getThreadPreview = useCallback((threadId: string, maxMessages: number = 3): Message[] => {
    const threadMessages = threadMap.threadMap.get(threadId) || [];
    return threadMessages.slice(-maxMessages);
  }, [threadMap]);

  // Get full thread với pagination
  const getFullThread = useCallback((threadId: string, offset: number = 0, limit: number = 50): Message[] => {
    const threadMessages = threadMap.threadMap.get(threadId) || [];
    return threadMessages.slice(offset, offset + limit);
  }, [threadMap]);

  // Check if message has replies
  const hasReplies = useCallback((messageId: string): boolean => {
    return threadMap.threadMap.has(messageId) && threadMap.threadMap.get(messageId)!.length > 0;
  }, [threadMap]);

  // Get reply count
  const getReplyCount = useCallback((messageId: string): number => {
    return threadMap.threadMap.get(messageId)?.length || 0;
  }, [threadMap]);

  return {
    rootMessages: threadMap.rootMessages,
    getThreadPreview,
    getFullThread,
    hasReplies,
    getReplyCount
  };
};

// Expected thread component với virtualization
const MessageThread: React.FC<MessageThreadProps> = ({
  parentMessage,
  isExpanded,
  onToggleExpanded,
  onReply
}) => {
  const { getThreadPreview, getFullThread, getReplyCount } = useMessageThreading([]);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const replyCount = getReplyCount(parentMessage.id);
  const previewMessages = getThreadPreview(parentMessage.id);

  const loadFullThread = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      // This would fetch full thread from API
      const fullThread = await fetchThreadMessages(parentMessage.id);
      setThreadMessages(fullThread);
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [parentMessage.id]);

  useEffect(() => {
    if (isExpanded && threadMessages.length === 0) {
      loadFullThread();
    }
  }, [isExpanded, threadMessages.length, loadFullThread]);

  if (replyCount === 0) return null;

  return (
    <div className="message-thread">
      <div className="thread-summary" onClick={onToggleExpanded}>
        <div className="thread-avatars">
          {previewMessages.slice(0, 3).map(message => (
            <img
              key={message.id}
              src={message.author.avatar}
              alt={message.author.username}
              className="thread-avatar"
            />
          ))}
        </div>

        <div className="thread-info">
          <span className="thread-count">
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
          <span className="thread-timestamp">
            Last reply {formatDistanceToNow(previewMessages[previewMessages.length - 1]?.timestamp)}
          </span>
        </div>

        <ChevronIcon className={classNames('thread-chevron', { expanded: isExpanded })} />
      </div>

      {isExpanded && (
        <div className="thread-messages">
          {isLoadingMore ? (
            <div className="thread-loading">Loading thread...</div>
          ) : (
            <VirtualizedMessageList
              messages={threadMessages}
              isThread={true}
              onReply={onReply}
            />
          )}

          <div className="thread-reply-box">
            <MessageComposer
              placeholder="Reply to thread..."
              onSend={(content) => onReply(parentMessage.id, content)}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```


#### 3. Virtualized Message List për Performance:


```typescript
// Expected message virtualization for large chat histories
const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  channelId,
  onLoadMore,
  isThread = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [virtualizedRange, setVirtualizedRange] = useState({ start: 0, end: 50 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const ITEM_HEIGHT = 80; // Average message height
  const BUFFER_SIZE = 5; // Extra items to render outside viewport

  // Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback((scrollTop: number, containerHeight: number) => {
    const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT);

    return {
      start: Math.max(0, visibleStart - BUFFER_SIZE),
      end: Math.min(messages.length, visibleEnd + BUFFER_SIZE)
    };
  }, [messages.length]);

  // Handle scroll events
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    setScrollPosition(scrollTop);

    // Check if scrolled to bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsScrolledToBottom(isAtBottom);

    if (isAtBottom) {
      setNewMessageCount(0);
    }

    // Update virtualized range
    const newRange = calculateVisibleRange(scrollTop, clientHeight);
    setVirtualizedRange(newRange);

    // Load more messages when near top
    if (scrollTop < 200 && !isLoadingMore) {
      onLoadMore?.();
    }
  }, [calculateVisibleRange, isLoadingMore, onLoadMore]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (isScrolledToBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    } else {
      setNewMessageCount(prev => prev + 1);
    }
  }, [messages.length, isScrolledToBottom]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setNewMessageCount(0);
    }
  }, []);

  // Group consecutive messages from same user
  const groupedMessages = useMemo(() => {
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      const shouldGroup = prevMessage &&
        prevMessage.authorId === message.authorId &&
        differenceInMinutes(message.timestamp, prevMessage.timestamp) < 5;

      if (shouldGroup && currentGroup) {
        currentGroup.messages.push(message);
      } else {
        currentGroup = {
          id: message.id,
          author: message.author,
          timestamp: message.timestamp,
          messages: [message]
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [messages]);

  // Render only visible messages
  const visibleGroups = groupedMessages.slice(virtualizedRange.start, virtualizedRange.end);

  return (
    <div className="virtualized-message-list">
      <div
        ref={containerRef}
        className="message-container"
        onScroll={handleScroll}
        style={{ height: '100%', overflowY: 'auto' }}
      >
        {/* Spacer for non-rendered items above */}
        <div style={{ height: virtualizedRange.start * ITEM_HEIGHT }} />

        {visibleGroups.map((group, index) => (
          <MessageGroup
            key={group.id}
            group={group}
            isThread={isThread}
            virtualIndex={virtualizedRange.start + index}
          />
        ))}

        {/* Spacer for non-rendered items below */}
        <div style={{
          height: (groupedMessages.length - virtualizedRange.end) * ITEM_HEIGHT
        }} />
      </div>

      {/* New message indicator */}
      {newMessageCount > 0 && !isScrolledToBottom && (
        <div className="new-messages-indicator" onClick={scrollToBottom}>
          {newMessageCount} new message{newMessageCount > 1 ? 's' : ''}
          <ChevronDownIcon />
        </div>
      )}
    </div>
  );
};
```


#### 4. Rich Message Composer:


```typescript
// Expected rich text message composer
const MessageComposer: React.FC<MessageComposerProps> = ({
  channelId,
  replyToMessage,
  onSend,
  onCancel,
  placeholder = "Type a message...",
  compact = false
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [mentions, setMentions] = useState<UserMention[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Markdown formatting shortcuts
  const formatText = useCallback((format: TextFormat) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = selectedText.includes('\n')
          ? `\`\`\`\n${selectedText}\n\`\`\``
          : `\`${selectedText}\``;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
    }

    range.deleteContents();
    range.insertNode(document.createTextNode(formattedText));

    // Update content state
    setContent(editorRef.current.textContent || '');
  }, []);

  // Handle file uploads
  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    setAttachments(prev => [...prev, ...fileArray]);
    setIsUploading(true);

    try {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('channelId', channelId);

        // Upload with progress tracking
        await uploadFile(formData, {
          onProgress: (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        });
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [channelId]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // User mention detection
  const detectMentions = useCallback((text: string): UserMention[] => {
    const mentionRegex = /@(\w+)/g;
    const detectedMentions: UserMention[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // This would typically query user API
      const user = findUserByUsername(match[1]);
      if (user) {
        detectedMentions.push({
          userId: user.id,
          username: user.username,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    return detectedMentions;
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    if (!content.trim() && attachments.length === 0) return;

    const messageData: OutgoingMessage = {
      channelId,
      content: content.trim(),
      replyToId: replyToMessage?.id,
      mentions: detectMentions(content),
      attachments: attachments.map(file => ({
        filename: file.name,
        size: file.size,
        contentType: file.type
      }))
    };

    try {
      await onSend(messageData);

      // Clear composer
      setContent('');
      setAttachments([]);
      setMentions([]);
      if (editorRef.current) {
        editorRef.current.textContent = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [content, attachments, channelId, replyToMessage, onSend, detectMentions]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && replyToMessage) {
      onCancel?.();
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'k':
          e.preventDefault();
          formatText('code');
          break;
      }
    }
  }, [handleSend, replyToMessage, onCancel, formatText]);

  return (
    <div
      className={classNames('message-composer', { compact })}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {replyToMessage && (
        <div className="reply-preview">
          <span className="reply-text">Replying to {replyToMessage.author.username}</span>
          <button onClick={onCancel} className="reply-cancel">×</button>
        </div>
      )}

      <div className="composer-input">
        <div
          ref={editorRef}
          contentEditable
          className="message-input"
          placeholder={placeholder}
          onInput={(e) => setContent(e.currentTarget.textContent || '')}
          onKeyDown={handleKeyDown}
        />

        <div className="composer-actions">
          <button onClick={() => fileInputRef.current?.click()}>
            <AttachmentIcon />
          </button>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <EmojiIcon />
          </button>
          <button onClick={handleSend} disabled={!content.trim() && attachments.length === 0}>
            <SendIcon />
          </button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="attachment-preview">
          {attachments.map((file, index) => (
            <div key={index} className="attachment-item">
              <span>{file.name}</span>
              {uploadProgress[file.name] && (
                <div className="upload-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress[file.name]}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
    </div>
  );
};
```


### 🏆 Evaluation Criteria


#### Real-time Implementation (40%):


- WebSocket connection management với reconnection logic
- Message ordering và deduplication
- Typing indicators implementation
- Presence updates handling
- Offline message queuing
- Network optimization cho mobile connections


#### Message Threading (35%):


- Efficient thread data structures
- Thread visualization và navigation
- Reply context management
- Thread search functionality
- Performance với deep thread nesting
- Thread notification handling


#### Performance & UX (25%):


- Message virtualization implementation
- Memory management cho large chat histories
- Smooth scrolling performance
- File upload progress tracking
- Rich text editor functionality
- Accessibility compliance


---


Đây là một phần tiếp theo của danh sách đề bài phỏng vấn frontend với requirements và expectations chi tiết. Mỗi đề bài được thiết kế để test multiple aspects của frontend engineering: technical implementation, system design thinking, performance optimization, và user experience considerations.


Bạn có muốn tôi tiếp tục với các công ty khác như Microsoft, Stripe, TikTok, hoặc tập trung vào specific aspects nào đó không?


## Claude


# 📋 Tiếp Tục: Chi Tiết Requirements & Expectations


## 🎯 MICROSOFT - Teams Video Call Interface


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Video Call Core Features:**

Multi-participant video grid layout (2x2, 3x3, 4x4)
Adaptive layout based on participant count
Camera on/off toggle với preview
Microphone mute/unmute với audio level indicators
Screen sharing với application/window selection
Picture-in-picture mode cho presenter
2. **Advanced Call Features:**

Virtual backgrounds với blur và custom images
Noise cancellation toggle
Speaker view với active speaker detection
Gallery view với pagination for 50+ participants
Hand raising và reaction emojis
Recording controls với local/cloud options
3. **Chat Integration:**

In-call chat sidebar với real-time messaging
File sharing during calls
Meeting notes collaboration
Participant list với roles (host, presenter, attendee)
Waiting room management
4. **Accessibility Features:**

Live captions với multiple languages
Screen reader compatibility
Keyboard navigation for all controls
High contrast mode support
Focus indicators cho video participants


#### Non-Functional Requirements:


- **Video Quality:** Adaptive bitrate, up to 1080p
- **Audio Quality:** Echo cancellation, noise suppression
- **Latency:** < 150ms for audio, < 300ms for video
- **CPU Usage:** < 30% for 4-person call
- **Memory Usage:** < 500MB for video call session
- **Network Optimization:** Bandwidth adaptation, packet loss recovery


#### Technical Constraints:


- WebRTC implementation với STUN/TURN servers
- Support for 50+ concurrent participants
- Cross-browser compatibility (Chrome, Edge, Firefox, Safari)
- Mobile responsive design
- Integration với Teams ecosystem
- Bundle size < 100KB gzipped


### 🎯 Expected Implementation Details


#### 1. WebRTC Architecture:


```typescript
// Expected WebRTC service architecture
interface VideoCallService {
  initializeCall(roomId: string, userId: string): Promise<void>;
  joinCall(): Promise<void>;
  leaveCall(): void;
  toggleCamera(): Promise<void>;
  toggleMicrophone(): void;
  startScreenShare(): Promise<void>;
  stopScreenShare(): void;
  setVideoQuality(quality: VideoQuality): void;
  addParticipant(participantId: string): Promise<void>;
  removeParticipant(participantId: string): void;
}

interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'presenter' | 'attendee';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel: number;
  connectionQuality: 'excellent' | 'good' | 'poor';
  joinTime: Date;
}

interface CallState {
  roomId: string;
  participants: Map<string, CallParticipant>;
  localStream: MediaStream | null;
  screenShareStream: MediaStream | null;
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  currentLayout: 'gallery' | 'speaker' | 'presentation';
  activeSpeakerId: string | null;
  chatMessages: ChatMessage[];
  isRecording: boolean;
  networkStats: NetworkStats;
}

interface NetworkStats {
  bandwidth: number;
  packetLoss: number;
  latency: number;
  videoResolution: string;
  frameRate: number;
}
```


#### 2. WebRTC Implementation với Advanced Features:


```typescript
// Expected WebRTC implementation with adaptive quality
class TeamsWebRTCService implements VideoCallService {
  private localPeerConnection: RTCPeerConnection;
  private remotePeerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenShareStream: MediaStream | null = null;
  private signalingSocket: WebSocket;
  private networkMonitor: NetworkMonitor;

  constructor() {
    this.setupPeerConnection();
    this.setupNetworkMonitoring();
  }

  private setupPeerConnection(): void {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:turnserver.microsoft.com:3478',
          username: 'username',
          credential: 'password'
        }
      ],
      iceCandidatePoolSize: 10
    };

    this.localPeerConnection = new RTCPeerConnection(configuration);
    this.setupPeerConnectionHandlers(this.localPeerConnection);
  }

  private setupPeerConnectionHandlers(pc: RTCPeerConnection): void {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      this.handleRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      this.handleConnectionStateChange(pc.connectionState);
    };

    pc.onstatsended = () => {
      this.collectNetworkStats(pc);
    };
  }

  async initializeCall(roomId: string, userId: string): Promise<void> {
    try {
      // Get user media với adaptive constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.localPeerConnection.addTrack(track, this.localStream!);
      });

      // Setup signaling
      await this.connectSignaling(roomId, userId);

    } catch (error) {
      throw new Error(`Failed to initialize call: ${error.message}`);
    }
  }

  private async connectSignaling(roomId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.signalingSocket = new WebSocket(`wss://teams-signaling.microsoft.com/rooms/${roomId}`);

      this.signalingSocket.onopen = () => {
        this.sendSignalingMessage({
          type: 'join-room',
          roomId,
          userId
        });
        resolve();
      };

      this.signalingSocket.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      this.signalingSocket.onerror = (error) => {
        reject(error);
      };
    });
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    switch (message.type) {
      case 'participant-joined':
        await this.handleParticipantJoined(message.participantId);
        break;
      case 'offer':
        await this.handleOffer(message.participantId, message.offer);
        break;
      case 'answer':
        await this.handleAnswer(message.participantId, message.answer);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(message.participantId, message.candidate);
        break;
      case 'participant-left':
        this.handleParticipantLeft(message.participantId);
        break;
    }
  }

  // Adaptive video quality based on network conditions
  private async adaptVideoQuality(): Promise<void> {
    const stats = await this.networkMonitor.getCurrentStats();
    let targetBitrate: number;
    let targetResolution: { width: number; height: number };

    if (stats.bandwidth < 500000) { // < 500kbps
      targetBitrate = 200000;
      targetResolution = { width: 320, height: 240 };
    } else if (stats.bandwidth < 1000000) { // < 1Mbps
      targetBitrate = 500000;
      targetResolution = { width: 640, height: 480 };
    } else if (stats.bandwidth < 2000000) { // < 2Mbps
      targetBitrate = 1000000;
      targetResolution = { width: 1280, height: 720 };
    } else {
      targetBitrate = 2000000;
      targetResolution = { width: 1920, height: 1080 };
    }

    // Update video constraints
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (videoTrack) {
      await videoTrack.applyConstraints({
        width: targetResolution.width,
        height: targetResolution.height,
        frameRate: stats.packetLoss > 5 ? 15 : 30
      });
    }

    // Update sender parameters
    const sender = this.localPeerConnection.getSenders().find(s =>
      s.track?.kind === 'video'
    );

    if (sender) {
      const params = sender.getParameters();
      params.encodings[0].maxBitrate = targetBitrate;
      await sender.setParameters(params);
    }
  }

  async startScreenShare(): Promise<void> {
    try {
      this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      // Replace video track với screen share
      const videoTrack = this.screenShareStream.getVideoTracks()[0];
      const sender = this.localPeerConnection.getSenders().find(s =>
        s.track?.kind === 'video'
      );

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Handle screen share ended
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

    } catch (error) {
      throw new Error(`Screen share failed: ${error.message}`);
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop());
      this.screenShareStream = null;

      // Restore camera video
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        const sender = this.localPeerConnection.getSenders().find(s =>
          s.track?.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
    }
  }

  // Network monitoring cho adaptive streaming
  private async collectNetworkStats(pc: RTCPeerConnection): Promise<void> {
    const stats = await pc.getStats();
    const networkStats: NetworkStats = {
      bandwidth: 0,
      packetLoss: 0,
      latency: 0,
      videoResolution: '1280x720',
      frameRate: 30
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        networkStats.bandwidth = report.bytesReceived || 0;
        networkStats.packetLoss = (report.packetsLost || 0) / (report.packetsReceived || 1) * 100;
        networkStats.frameRate = report.framesPerSecond || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        networkStats.latency = report.currentRoundTripTime || 0;
      }
    });

    // Trigger quality adaptation nếu cần
    if (networkStats.packetLoss > 5 || networkStats.latency > 200) {
      this.adaptVideoQuality();
    }
  }
}
```


#### 3. Video Grid Layout với Dynamic Sizing:


```typescript
// Expected video grid layout với adaptive sizing
const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  layout,
  activeSpeakerId,
  isScreenSharing,
  onLayoutChange
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [videoElements, setVideoElements] = useState<Map<string, HTMLVideoElement>>(new Map());

  // Calculate optimal grid layout
  const calculateGridLayout = useCallback((participantCount: number, containerWidth: number, containerHeight: number) => {
    if (isScreenSharing) {
      return {
        columns: participantCount <= 4 ? participantCount : 4,
        rows: Math.ceil(participantCount / 4),
        mainAreaRatio: 0.75, // 75% for screen share, 25% for participants
        participantAreaLayout: 'sidebar'
      };
    }

    // Standard grid layouts
    if (participantCount <= 1) return { columns: 1, rows: 1 };
    if (participantCount <= 4) return { columns: 2, rows: 2 };
    if (participantCount <= 9) return { columns: 3, rows: 3 };
    if (participantCount <= 16) return { columns: 4, rows: 4 };

    // For larger groups, use pagination
    return { columns: 4, rows: 4, needsPagination: true };
  }, [isScreenSharing]);

  const gridLayout = useMemo(() => {
    return calculateGridLayout(participants.length, dimensions.width, dimensions.height);
  }, [participants.length, dimensions, calculateGridLayout]);

  // Video element management
  const setupVideoElement = useCallback(async (participantId: string, stream: MediaStream) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = participantId === 'local'; // Mute local video to prevent feedback

    setVideoElements(prev => new Map(prev).set(participantId, video));

    return video;
  }, []);

  // Active speaker detection
  const detectActiveSpeaker = useCallback((audioLevels: Map<string, number>) => {
    let maxLevel = 0;
    let activeSpeaker = '';

    audioLevels.forEach((level, participantId) => {
      if (level > maxLevel && level > 0.1) { // Threshold để ignore background noise
        maxLevel = level;
        activeSpeaker = participantId;
      }
    });

    return activeSpeaker;
  }, []);

  // Resize observer cho responsive layout
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Video quality optimization based on size
  const optimizeVideoQuality = useCallback((participantCount: number) => {
    const cellWidth = dimensions.width / gridLayout.columns;
    const cellHeight = dimensions.height / gridLayout.rows;

    let targetResolution: string;

    if (cellWidth < 320 || cellHeight < 240) {
      targetResolution = '320x240';
    } else if (cellWidth < 640 || cellHeight < 480) {
      targetResolution = '640x480';
    } else {
      targetResolution = '1280x720';
    }

    // Apply to all video elements
    videoElements.forEach((video, participantId) => {
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getVideoTracks();
        tracks.forEach(track => {
          const [width, height] = targetResolution.split('x').map(Number);
          track.applyConstraints({
            width: { ideal: width },
            height: { ideal: height }
          });
        });
      }
    });
  }, [dimensions, gridLayout, videoElements]);

  useEffect(() => {
    optimizeVideoQuality(participants.length);
  }, [participants.length, optimizeVideoQuality]);

  return (
    <div ref={gridRef} className="video-grid" data-layout={layout}>
      {layout === 'speaker' && activeSpeakerId && (
        <div className="speaker-view">
          <VideoParticipant
            participant={participants.find(p => p.id === activeSpeakerId)!}
            isActiveSpeaker={true}
            size="large"
          />
          <div className="participant-thumbnails">
            {participants.filter(p => p.id !== activeSpeakerId).map(participant => (
              <VideoParticipant
                key={participant.id}
                participant={participant}
                size="thumbnail"
              />
            ))}
          </div>
        </div>
      )}

      {layout === 'gallery' && (
        <div
          className="gallery-grid"
          style={{
            gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
            gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`
          }}
        >
          {participants.map(participant => (
            <VideoParticipant
              key={participant.id}
              participant={participant}
              isActiveSpeaker={participant.id === activeSpeakerId}
              size="grid"
            />
          ))}
        </div>
      )}

      {isScreenSharing && (
        <div className="screen-share-layout">
          <div className="screen-share-main">
            <ScreenShareDisplay />
          </div>
          <div className="participants-sidebar">
            {participants.map(participant => (
              <VideoParticipant
                key={participant.id}
                participant={participant}
                size="sidebar"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Expected video participant component với controls
const VideoParticipant: React.FC<VideoParticipantProps> = ({
  participant,
  isActiveSpeaker,
  size,
  stream
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor' | 'connecting'>('connecting');

  // Setup video stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        setIsVideoLoaded(true);
        setNetworkQuality('good');
      };

      videoRef.current.onerror = () => {
        setNetworkQuality('poor');
      };
    }
  }, [stream]);

  // Audio level visualization
  const AudioLevelIndicator: React.FC<{ level: number }> = ({ level }) => (
    <div className="audio-level-indicator">
      <div
        className="audio-level-bar"
        style={{
          height: `${Math.min(100, level * 100)}%`,
          backgroundColor: level > 0.8 ? '#ff4444' : '#00ff00'
        }}
      />
    </div>
  );

  return (
    <div
      className={classNames('video-participant', {
        [`video-participant--${size}`]: true,
        'video-participant--active-speaker': isActiveSpeaker,
        'video-participant--video-disabled': !participant.isVideoEnabled,
        'video-participant--audio-disabled': !participant.isAudioEnabled
      })}
    >
      {participant.isVideoEnabled && isVideoLoaded ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.id === 'local'}
          className="participant-video"
        />
      ) : (
        <div className="participant-avatar">
          <img src={participant.avatar} alt={participant.name} />
        </div>
      )}

      <div className="participant-info">
        <span className="participant-name">{participant.name}</span>
        <div className="participant-indicators">
          {!participant.isAudioEnabled && <MicOffIcon />}
          {!participant.isVideoEnabled && <VideoOffIcon />}
          {participant.isScreenSharing && <ScreenShareIcon />}
          {participant.isHandRaised && <HandRaisedIcon />}
          <NetworkQualityIndicator quality={networkQuality} />
        </div>
      </div>

      {participant.isAudioEnabled && (
        <AudioLevelIndicator level={participant.audioLevel} />
      )}

      {isActiveSpeaker && (
        <div className="active-speaker-border" />
      )}
    </div>
  );
};
```


#### 4. In-Call Chat Integration:


```typescript
// Expected in-call chat với message persistence
const InCallChat: React.FC<InCallChatProps> = ({
  roomId,
  currentUserId,
  participants,
  isVisible,
  onToggleVisibility
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSocket = useRef<WebSocket | null>(null);

  // Connect to chat service
  useEffect(() => {
    chatSocket.current = new WebSocket(`wss://teams-chat.microsoft.com/rooms/${roomId}`);

    chatSocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'typing_start':
          setTypingUsers(prev => new Set([...prev, data.userId]));
          break;
        case 'typing_stop':
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(data.userId);
            return updated;
          });
          break;
        case 'message_history':
          setMessages(data.messages);
          break;
      }
    };

    // Request message history
    chatSocket.current.onopen = () => {
      chatSocket.current?.send(JSON.stringify({
        type: 'get_history',
        roomId,
        limit: 50
      }));
    };

    return () => {
      chatSocket.current?.close();
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator với debouncing
  const debouncedTypingStop = useCallback(
    debounce(() => {
      setIsTyping(false);
      chatSocket.current?.send(JSON.stringify({
        type: 'typing_stop',
        roomId,
        userId: currentUserId
      }));
    }, 1000),
    [roomId, currentUserId]
  );

  const handleMessageChange = useCallback((value: string) => {
    setNewMessage(value);

    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      chatSocket.current?.send(JSON.stringify({
        type: 'typing_start',
        roomId,
        userId: currentUserId
      }));
    }

    if (value.length === 0 && isTyping) {
      setIsTyping(false);
      chatSocket.current?.send(JSON.stringify({
        type: 'typing_stop',
        roomId,
        userId: currentUserId
      }));
    } else {
      debouncedTypingStop();
    }
  }, [isTyping, roomId, currentUserId, debouncedTypingStop]);

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: generateId(),
      roomId,
      senderId: currentUserId,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    chatSocket.current?.send(JSON.stringify({
      type: 'send_message',
      message
    }));

    setNewMessage('');
    setIsTyping(false);
  }, [newMessage, roomId, currentUserId]);

  // File sharing trong chat
  const handleFileShare = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);

    try {
      const uploadResponse = await uploadChatFile(formData);

      const fileMessage: ChatMessage = {
        id: generateId(),
        roomId,
        senderId: currentUserId,
        content: file.name,
        timestamp: new Date(),
        type: 'file',
        fileUrl: uploadResponse.url,
        fileSize: file.size,
        fileType: file.type
      };

      chatSocket.current?.send(JSON.stringify({
        type: 'send_message',
        message: fileMessage
      }));
    } catch (error) {
      console.error('File upload failed:', error);
    }
  }, [roomId, currentUserId]);

  return (
    <div className={classNames('in-call-chat', { 'in-call-chat--visible': isVisible })}>
      <div className="chat-header">
        <h3>Meeting Chat</h3>
        <button onClick={onToggleVisibility} className="chat-toggle">
          <ChevronRightIcon />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <ChatMessage
            key={message.id}
            message={message}
            sender={participants.find(p => p.id === message.senderId)}
            isOwnMessage={message.senderId === currentUserId}
          />
        ))}

        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            {Array.from(typingUsers).map(userId => {
              const user = participants.find(p => p.id === userId);
              return user ? `${user.name} is typing...` : '';
            }).filter(Boolean).join(', ')}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={newMessage}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          rows={2}
        />

        <div className="chat-actions">
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileShare(e.target.files[0])}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-upload-button">
            <AttachIcon />
          </label>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="send-button"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
```


### 🏆 Evaluation Criteria


#### WebRTC Implementation (45%):


- Proper peer connection setup và management
- Signaling service integration
- STUN/TURN server configuration
- Media stream handling (audio/video)
- Screen sharing implementation
- Network adaptation và quality control
- Error handling và reconnection logic


#### Video Layout & UI (35%):


- Dynamic grid layout calculation
- Active speaker detection
- Responsive design cho different screen sizes
- Video element optimization
- Audio level visualization
- Network quality indicators
- Accessibility compliance


#### Performance & Integration (20%):


- Memory management với multiple streams
- CPU optimization cho video processing
- Real-time chat integration
- File sharing functionality
- Keyboard navigation
- Mobile responsiveness


---


## 🎯 STRIPE - Payment Form với Advanced Validation


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Payment Form Core:**

Credit card input với real-time validation
Card type detection (Visa, Mastercard, Amex, etc.)
Expiry date validation với proper formatting
CVV validation based on card type
Billing address collection với international support
2. **Security Features:**

PCI DSS compliance requirements
Tokenization của sensitive card data
3D Secure authentication support
Fraud detection indicators
SSL certificate validation
3. **User Experience:**

Auto-formatting của card numbers
Real-time error feedback
Progressive enhancement
Accessibility compliance
Mobile-optimized input fields
4. **Payment Processing:**

Multiple payment methods (card, digital wallets)
Subscription và one-time payments
Multi-currency support
Tax calculation integration
Receipt generation


#### Non-Functional Requirements:


- **Security:** PCI DSS Level 1 compliance
- **Performance:** Form submission < 2s
- **Availability:** 99.9% uptime requirement
- **Validation:** Real-time với < 100ms response
- **Error Rate:** < 0.1% false declines


#### Technical Constraints:


- Integration với Stripe Elements API
- No sensitive card data stored locally
- Cross-browser compatibility (IE11+)
- Mobile-first responsive design
- Bundle size < 30KB gzipped


### 🎯 Expected Implementation Details


#### 1. Stripe Integration Architecture:


```typescript
// Expected Stripe service integration
interface StripePaymentService {
  initialize(publishableKey: string): Promise<void>;
  createPaymentIntent(amount: number, currency: string, metadata?: object): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string, paymentMethod: PaymentMethodData): Promise<PaymentResult>;
  createSetupIntent(customerId: string): Promise<SetupIntent>;
  retrievePaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;
  handleCardAction(paymentIntentId: string): Promise<PaymentResult>;
}

interface PaymentFormData {
  amount: number;
  currency: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  billingAddress: BillingAddress;
  saveCard: boolean;
  customerId?: string;
}

interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CardValidation {
  isValid: boolean;
  errors: ValidationError[];
  cardType: CardType;
  formatting: CardFormatting;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface CardType {
  name: 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'unionpay' | 'unknown';
  pattern: RegExp;
  gaps: number[];
  lengths: number[];
  cvcLength: number[];
}
```


#### 2. Advanced Card Validation Logic:


```typescript
// Expected comprehensive card validation
class CardValidator {
  private static readonly CARD_TYPES: CardType[] = [
    {
      name: 'visa',
      pattern: /^4/,
      gaps: [4, 8, 12],
      lengths: [13, 16, 19],
      cvcLength: [3]
    },
    {
      name: 'mastercard',
      pattern: /^(5[1-5]|2[2-7])/,
      gaps: [4, 8, 12],
      lengths: [16],
      cvcLength: [3]
    },
    {
      name: 'amex',
      pattern: /^3[47]/,
      gaps: [4, 10],
      lengths: [15],
      cvcLength: [3, 4]
    },
    {
      name: 'discover',
      pattern: /^(6011|644|645|646|647|648|649|65)/,
      gaps: [4, 8, 12],
      lengths: [16],
      cvcLength: [3]
    }
  ];

  static detectCardType(cardNumber: string): CardType {
    const cleanNumber = cardNumber.replace(/\D/g, '');

    for (const cardType of this.CARD_TYPES) {
      if (cardType.pattern.test(cleanNumber)) {
        return cardType;
      }
    }

    return {
      name: 'unknown',
      pattern: /./,
      gaps: [4, 8, 12],
      lengths: [16],
      cvcLength: [3]
    };
  }

  static validateCardNumber(cardNumber: string): ValidationResult {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const cardType = this.detectCardType(cleanNumber);

    // Check length
    if (!cardType.lengths.includes(cleanNumber.length)) {
      return {
        isValid: false,
        errors: [{
          field: 'cardNumber',
          message: `Card number must be ${cardType.lengths.join(' or ')} digits`,
          code: 'invalid_length'
        }]
      };
    }

    // Luhn algorithm validation
    if (!this.luhnCheck(cleanNumber)) {
      return {
        isValid: false,
        errors: [{
          field: 'cardNumber',
          message: 'Invalid card number',
          code: 'invalid_number'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    // Loop through values starting from the rightmost position
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  static validateExpiryDate(month: number, year: number): ValidationResult {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month < 1 || month > 12) {
      return {
        isValid: false,
        errors: [{
          field: 'expiryMonth',
          message: 'Invalid month',
          code: 'invalid_month'
        }]
      };
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return {
        isValid: false,
        errors: [{
          field: 'expiryDate',
          message: 'Card has expired',
          code: 'card_expired'
        }]
      };
    }

    // Check if expiry is too far in the future (more than 20 years)
    if (year > currentYear + 20) {
      return {
        isValid: false,
        errors: [{
          field: 'expiryYear',
          message: 'Invalid expiry year',
          code: 'invalid_year'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateCVC(cvc: string, cardType: CardType): ValidationResult {
    const cleanCvc = cvc.replace(/\D/g, '');

    if (!cardType.cvcLength.includes(cleanCvc.length)) {
      return {
        isValid: false,
        errors: [{
          field: 'cvc',
          message: `CVC must be ${cardType.cvcLength.join(' or ')} digits`,
          code: 'invalid_cvc_length'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  static formatCardNumber(cardNumber: string, cardType: CardType): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    let formatted = '';

    for (let i = 0; i < cleanNumber.length; i++) {
      if (cardType.gaps.includes(i) && i > 0) {
        formatted += ' ';
      }
      formatted += cleanNumber[i];
    }

    return formatted;
  }
}
```


#### 3. Secure Payment Form Implementation:


```typescript
// Expected secure payment form với Stripe Elements
const SecurePaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  customerId
}) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);

  const [formData, setFormData] = useState<PaymentFormData>({
    amount,
    currency,
    cardNumber: '',
    expiryMonth: 0,
    expiryYear: 0,
    cvv: '',
    billingAddress: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    saveCard: false,
    customerId
  });

  const [validation, setValidation] = useState<CardValidation>({
    isValid: false,
    errors: [],
    cardType: CardValidator.detectCardType(''),
    formatting: { cardNumber: '', expiryDate: '' }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [threeDSecureModal, setThreeDSecureModal] = useState<{
    isOpen: boolean;
    clientSecret?: string;
  }>({ isOpen: false });

  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);
      setStripe(stripeInstance);

      if (stripeInstance) {
        const elementsInstance = stripeInstance.elements({
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0070f3',
              colorBackground: '#ffffff',
              colorText: '#30313d',
              colorDanger: '#df1b41',
              fontFamily: 'system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px'
            }
          }
        });
        setElements(elementsInstance);

        // Create payment intent
        const intent = await createPaymentIntent(amount, currency);
        setPaymentIntent(intent);
      }
    };

    initializeStripe();
  }, [amount, currency]);

  // Real-time card validation
  const validateCardField = useCallback((field: string, value: string) => {
    let fieldValidation: ValidationResult = { isValid: true, errors: [] };

    switch (field) {
      case 'cardNumber':
        fieldValidation = CardValidator.validateCardNumber(value);
        const cardType = CardValidator.detectCardType(value);
        const formattedNumber = CardValidator.formatCardNumber(value, cardType);

        setValidation(prev => ({
          ...prev,
          cardType,
          formatting: { ...prev.formatting, cardNumber: formattedNumber }
        }));
        break;

      case 'expiryDate':
        const [month, year] = value.split('/').map(Number);
        fieldValidation = CardValidator.validateExpiryDate(month, 2000 + year);
        break;

      case 'cvc':
        fieldValidation = CardValidator.validateCVC(value, validation.cardType);
        break;
    }

    setValidation(prev => ({
      ...prev,
      isValid: fieldValidation.isValid && prev.errors.filter(e => e.field !== field).length === 0,
      errors: [
        ...prev.errors.filter(e => e.field !== field),
        ...fieldValidation.errors
      ]
    }));
  }, [validation.cardType]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (['cardNumber', 'expiryDate', 'cvc'].includes(field)) {
      validateCardField(field, value as string);
    }
  }, [validateCardField]);

  // Address validation
  const validateAddress = useCallback(async (address: BillingAddress): Promise<ValidationResult> => {
    try {
      // This would integrate với address validation service
      const response = await validateBillingAddress(address);
      return response;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'address',
          message: 'Could not validate address',
          code: 'address_validation_failed'
        }]
      };
    }
  }, []);

  // Process payment với error handling
  const handlePaymentSubmission = useCallback(async () => {
    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setIsProcessing(true);

    try {
      // Validate address
      const addressValidation = await validateAddress(formData.billingAddress);
      if (!addressValidation.isValid) {
        setValidation(prev => ({
          ...prev,
          errors: [...prev.errors, ...addressValidation.errors]
        }));
        return;
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement('card')!,
        billing_details: {
          address: {
            line1: formData.billingAddress.line1,
            line2: formData.billingAddress.line2,
            city: formData.billingAddress.city,
            state: formData.billingAddress.state,
            postal_code: formData.billingAddress.postalCode,
            country: formData.billingAddress.country
          }
        }
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Confirm payment
      const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: paymentMethod.id,
          setup_future_usage: formData.saveCard ? 'on_session' : undefined
        }
      );

      if (confirmError) {
        if (confirmError.code === 'authentication_required') {
          // Handle 3D Secure authentication
          setThreeDSecureModal({
            isOpen: true,
            clientSecret: paymentIntent.client_secret
          });
          return;
        }
        throw new Error(confirmError.message);
      }

      if (confirmedIntent.status === 'succeeded') {
        onPaymentSuccess({
          paymentIntentId: confirmedIntent.id,
          amount: confirmedIntent.amount,
          currency: confirmedIntent.currency,
          paymentMethodId: paymentMethod.id
        });
      }

    } catch (error) {
      onPaymentError(error as Error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    stripe,
    elements,
    paymentIntent,
    formData,
    validateAddress,
    onPaymentSuccess,
    onPaymentError
  ]);

  // Handle 3D Secure authentication
  const handle3DSecure = useCallback(async (clientSecret: string) => {
    if (!stripe) return;

    const { error, paymentIntent: authenticatedIntent } = await stripe.handleCardAction(clientSecret);

    if (error) {
      onPaymentError(error);
    } else if (authenticatedIntent?.status === 'succeeded') {
      onPaymentSuccess({
        paymentIntentId: authenticatedIntent.id,
        amount: authenticatedIntent.amount,
        currency: authenticatedIntent.currency
      });
    }

    setThreeDSecureModal({ isOpen: false });
  }, [stripe, onPaymentSuccess, onPaymentError]);

  return (
    <form className="secure-payment-form" onSubmit={(e) => {
      e.preventDefault();
      handlePaymentSubmission();
    }}>
      <div className="payment-amount">
        <h3>Payment Details</h3>
        <div className="amount-display">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
          }).format(amount / 100)}
        </div>
      </div>

      <div className="card-input-section">
        <label>Card Information</label>
        <div className="card-element-container">
          {elements && (
            <CardNumberElement
              options={{
                showIcon: true,
                placeholder: 'Card number',
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                }
              }}
              onChange={(event) => {
                if (event.error) {
                  setValidation(prev => ({
                    ...prev,
                    errors: [{
                      field: 'cardNumber',
                      message: event.error.message,
                      code: event.error.code
                    }]
                  }));
                }
              }}
            />
          )}
        </div>

        <div className="card-details-row">
          <div className="expiry-input">
            {elements && (
              <CardExpiryElement
                options={{
                  placeholder: 'MM/YY',
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  }
                }}
              />
            )}
          </div>

          <div className="cvc-input">
            {elements && (
              <CardCvcElement
                options={{
                  placeholder: 'CVC',
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      <BillingAddressForm
        address={formData.billingAddress}
        onChange={(address) => handleFieldChange('billingAddress', address)}
        errors={validation.errors.filter(e => e.field.startsWith('address'))}
      />

      <div className="payment-options">
        <label className="save-card-option">
          <input
            type="checkbox"
            checked={formData.saveCard}
            onChange={(e) => handleFieldChange('saveCard', e.target.checked)}
          />
          Save card for future payments
        </label>
      </div>

      <ErrorDisplay errors={validation.errors} />

      <button
        type="submit"
        disabled={!validation.isValid || isProcessing}
        className="payment-submit-button"
      >
        {isProcessing ? (
          <>
            <Spinner size="small" />
            Processing...
          </>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
          }).format(amount / 100)}`
        )}
      </button>

      <div className="security-badges">
        <img src="/badges/ssl-secure.svg" alt="SSL Secure" />
        <img src="/badges/pci-compliant.svg" alt="PCI Compliant" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      {threeDSecureModal.isOpen && (
        <ThreeDSecureModal
          clientSecret={threeDSecureModal.clientSecret!}
          onAuthenticate={handle3DSecure}
          onCancel={() => setThreeDSecureModal({ isOpen: false })}
        />
      )}
    </form>
  );
};
```


#### 4. International Address Validation:


```typescript
// Expected comprehensive address validation
const BillingAddressForm: React.FC<BillingAddressFormProps> = ({
  address,
  onChange,
  errors
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);

  // Load countries và states
  useEffect(() => {
    const loadLocationData = async () => {
      const [countriesData, statesData] = await Promise.all([
        fetchCountries(),
        fetchStates(address.country)
      ]);

      setCountries(countriesData);
      setStates(statesData);
    };

    loadLocationData();
  }, [address.country]);

  // Real-time address validation với debouncing
  const validateAddressRealTime = useCallback(
    debounce(async (addressData: BillingAddress) => {
      if (!addressData.line1 || !addressData.city || !addressData.postalCode) {
        return;
      }

      setIsValidatingAddress(true);

      try {
        const validation = await validateInternationalAddress(addressData);

        if (validation.suggestions && validation.suggestions.length > 0) {
          setAddressSuggestions(validation.suggestions);
        } else {
          setAddressSuggestions([]);
        }

        if (!validation.isValid) {
          // Trigger error callback
          console.warn('Address validation failed:', validation.errors);
        }
      } catch (error) {
        console.error('Address validation error:', error);
      } finally {
        setIsValidatingAddress(false);
      }
    }, 800),
    []
  );

  useEffect(() => {
    validateAddressRealTime(address);
  }, [address, validateAddressRealTime]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof BillingAddress, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    onChange(updatedAddress);
  }, [address, onChange]);

  // Auto-complete postal code format
  const formatPostalCode = useCallback((value: string, country: string): string => {
    const postalCodeFormats: { [key: string]: RegExp } = {
      'US': /^(\d{5})(\d{4})?$/,
      'CA': /^([A-Z]\d[A-Z])(\d[A-Z]\d)?$/,
      'GB': /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})?$/,
      'DE': /^(\d{5})$/,
      'FR': /^(\d{5})$/,
      'JP': /^(\d{3})(\d{4})?$/
    };

    const format = postalCodeFormats[country];
    if (!format) return value;

    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(format);

    if (match) {
      switch (country) {
        case 'US':
          return match[2] ? `${match[1]}-${match[2]}` : match[1];
        case 'CA':
          return match[2] ? `${match[1]} ${match[2]}` : match[1];
        default:
          return cleaned;
      }
    }

    return value;
  }, []);

  return (
    <div className="billing-address-form">
      <h4>Billing Address</h4>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            value={address.country}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            required
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field full-width">
          <label htmlFor="line1">Address Line 1</label>
          <input
            type="text"
            id="line1"
            value={address.line1}
            onChange={(e) => handleFieldChange('line1', e.target.value)}
            placeholder="Street address"
            required
            className={classNames({
              'error': errors.some(e => e.field === 'line1')
            })}
          />
          {isValidatingAddress && <AddressValidationSpinner />}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field full-width">
          <label htmlFor="line2">Address Line 2 (Optional)</label>
          <input
            type="text"
            id="line2"
            value={address.line2 || ''}
            onChange={(e) => handleFieldChange('line2', e.target.value)}
            placeholder="Apartment, suite, etc."
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            value={address.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            required
            className={classNames({
              'error': errors.some(e => e.field === 'city')
            })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="state">State/Province</label>
          {states.length > 0 ? (
            <select
              id="state"
              value={address.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              required
            >
              <option value="">Select state</option>
              {states.map(state => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="state"
              value={address.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              placeholder="State/Province"
              required
            />
          )}
        </div>

        <div className="form-field">
          <label htmlFor="postalCode">Postal Code</label>
          <input
            type="text"
            id="postalCode"
            value={address.postalCode}
            onChange={(e) => {
              const formatted = formatPostalCode(e.target.value, address.country);
              handleFieldChange('postalCode', formatted);
            }}
            required
            className={classNames({
              'error': errors.some(e => e.field === 'postalCode')
            })}
          />
        </div>
      </div>

      {addressSuggestions.length > 0 && (
        <div className="address-suggestions">
          <h5>Address Suggestions:</h5>
          {addressSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="address-suggestion"
              onClick={() => onChange(suggestion.address)}
            >
              <div className="suggestion-address">
                {suggestion.address.line1}<br />
                {suggestion.address.city}, {suggestion.address.state} {suggestion.address.postalCode}
              </div>
              <div className="suggestion-score">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```


### 🏆 Evaluation Criteria


#### Security Implementation (40%):


- PCI DSS compliance understanding
- Proper tokenization handling
- No sensitive data storage locally
- 3D Secure authentication flow
- SSL/TLS implementation
- Fraud detection integration


#### Form Validation (35%):


- Real-time card number validation
- Luhn algorithm implementation
- Card type detection accuracy
- Expiry date validation logic
- International address validation
- Error handling và user feedback


#### User Experience (25%):


- Auto-formatting functionality
- Responsive design implementation
- Accessibility compliance
- Loading states và progress indicators
- Error message clarity
- Mobile optimization


---


## 🎯 TIKTOK - Vertical Video Player với Infinite Scroll


### 📝 Detailed Requirements


#### Functional Requirements:


1. **Video Playback Core:**

Vertical video feed với auto-play
Infinite scroll với preloading
Touch gestures (swipe up/down, double-tap to like)
Video controls (play/pause, mute/unmute, seek)
Adaptive video quality based on network
2. **Social Features:**

Like/comment/share interactions
User profile navigation
Follow/unfollow functionality
Video bookmark saving
Real-time like count updates
3. **Performance Features:**

Video preloading strategy (next 2-3 videos)
Memory management cho continuous scrolling
Background video playing optimization
Network bandwidth adaptation
Battery usage optimization
4. **Content Discovery:**

Algorithm-based video recommendations
Category filtering
Search functionality
Trending videos section
Personalized feed


#### Non-Functional Requirements:


- **Video Loading Time:** < 1s for next video
- **Scroll Performance:** 60fps scrolling
- **Memory Usage:** < 300MB for 50 videos in memory
- **Battery Impact:** Minimal battery drain during scrolling
- **Network Efficiency:** Adaptive bitrate streaming


#### Technical Constraints:


- Support for various video formats (MP4, WebM)
- Cross-platform mobile optimization
- Intersection Observer API cho visibility detection
- Web Workers cho heavy computations
- Bundle size < 120KB gzipped


### 🎯 Expected Implementation Details


#### 1. Video Feed Architecture:


```typescript
// Expected video feed structure
interface VideoFeedService {
  getVideos(cursor?: string, limit?: number): Promise<VideoFeedResponse>;
  preloadVideo(videoUrl: string): Promise<void>;
  getRecommendations(userId: string, videoId: string): Promise<Video[]>;
  trackVideoView(videoId: string, watchTime: number): void;
  updateVideoInteraction(videoId: string, interaction: VideoInteraction): Promise<void>;
}

interface Video {
  id: string;
  url: string;
  thumbnail: string;
  duration: number;
  author: VideoAuthor;
  caption: string;
  hashtags: string[];
  music: MusicTrack;
  stats: VideoStats;
  createdAt: Date;
  aspectRatio: number;
  qualities: VideoQuality[];
}

interface VideoAuthor {
  id: string;
  username: string;
  avatar: string;
  displayName: string;
  isVerified: boolean;
  isFollowing: boolean;
  followerCount: number;
}

interface VideoStats {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface VideoQuality {
  resolution: string;
  bitrate: number;
  url: string;
  size: number;
}

interface VideoPlayerState {
  currentVideoIndex: number;
  videos: Video[];
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  bufferedRanges: TimeRanges;
  playbackRate: number;
  networkQuality: 'high' | 'medium' | 'low';
  preloadedIndices: Set<number>;
}
```


#### 2. Infinite Scroll với Video Preloading:


```typescript
// Expected infinite scroll implementation với advanced preloading
const useInfiniteVideoFeed = (initialVideos: Video[]) => {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [preloadManager] = useState(() => new VideoPreloadManager());

  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementsRef = useRef<Map<number, HTMLVideoElement>>(new Map());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Load more videos when approaching end
  const loadMoreVideos = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const lastVideo = videos[videos.length - 1];
      const response = await videoFeedService.getVideos(lastVideo.id, 10);

      if (response.videos.length === 0) {
        setHasMore(false);
      } else {
        setVideos(prev => [...prev, ...response.videos]);

        // Preload next videos
        response.videos.slice(0, 3).forEach((video, index) => {
          preloadManager.preloadVideo(video, videos.length + index);
        });
      }
    } catch (error) {
      console.error('Failed to load more videos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [videos, isLoading, hasMore, preloadManager]);

  // Intersection observer cho video visibility
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        const videoIndex = parseInt(entry.target.getAttribute('data-index') || '0');
        const videoElement = videoElementsRef.current.get(videoIndex);

        if (entry.isIntersecting) {
          // Video is visible
          if (videoElement && videoIndex === currentIndex) {
            videoElement.play();
          }

          // Preload adjacent videos
          preloadManager.preloadAdjacent(videoIndex, videos);

          // Load more if near end
          if (videoIndex >= videos.length - 5) {
            loadMoreVideos();
          }
        } else {
          // Video is not visible
          if (videoElement) {
            videoElement.pause();
          }
        }
      });
    };

    intersectionObserverRef.current = new IntersectionObserver(observerCallback, {
      threshold: 0.5,
      rootMargin: '100px'
    });

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [currentIndex, videos, loadMoreVideos, preloadManager]);

  // Memory cleanup cho old videos
  const cleanupOldVideos = useCallback(() => {
    const keepRange = 10; // Keep 10 videos before và after current
    const startCleanup = Math.max(0, currentIndex - keepRange);
    const endCleanup = Math.min(videos.length, currentIndex + keepRange);

    videoElementsRef.current.forEach((videoElement, index) => {
      if (index < startCleanup || index > endCleanup) {
        videoElement.src = '';
        videoElement.load();
        videoElementsRef.current.delete(index);
        preloadManager.cleanup(index);
      }
    });
  }, [currentIndex, videos.length, preloadManager]);

  // Auto cleanup every 20 videos
  useEffect(() => {
    if (currentIndex % 20 === 0 && currentIndex > 0) {
      cleanupOldVideos();
    }
  }, [currentIndex, cleanupOldVideos]);

  return {
    videos,
    currentIndex,
    setCurrentIndex,
    isLoading,
    hasMore,
    containerRef,
    videoElementsRef,
    intersectionObserverRef,
    loadMoreVideos
  };
};

// Expected video preload manager
class VideoPreloadManager {
  private preloadedVideos = new Map<number, HTMLVideoElement>();
  private preloadPromises = new Map<number, Promise<void>>();
  private networkMonitor = new NetworkMonitor();

  async preloadVideo(video: Video, index: number): Promise<void> {
    if (this.preloadedVideos.has(index) || this.preloadPromises.has(index)) {
      return this.preloadPromises.get(index);
    }

    const promise = this.doPreload(video, index);
    this.preloadPromises.set(index, promise);

    try {
      await promise;
    } catch (error) {
      console.warn(`Failed to preload video ${index}:`, error);
      this.preloadPromises.delete(index);
    }

    return promise;
  }

  private async doPreload(video: Video, index: number): Promise<void> {
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.muted = true;

    // Choose quality based on network
    const networkQuality = await this.networkMonitor.getQuality();
    const selectedQuality = this.selectVideoQuality(video.qualities, networkQuality);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Preload timeout'));
      }, 10000);

      videoElement.oncanplaythrough = () => {
        clearTimeout(timeout);
        this.preloadedVideos.set(index, videoElement);
        resolve();
      };

      videoElement.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Video load error'));
      };

      videoElement.src = selectedQuality.url;
      videoElement.load();
    });
  }

  private selectVideoQuality(qualities: VideoQuality[], networkQuality: string): VideoQuality {
    const sortedQualities = qualities.sort((a, b) => b.bitrate - a.bitrate);

    switch (networkQuality) {
      case 'high':
        return sortedQualities[0]; // Highest quality
      case 'medium':
        return sortedQualities[Math.floor(sortedQualities.length / 2)]; // Medium quality
      case 'low':
        return sortedQualities[sortedQualities.length - 1]; // Lowest quality
      default:
        return sortedQualities[Math.floor(sortedQualities.length / 2)];
    }
  }

  preloadAdjacent(currentIndex: number, videos: Video[]): void {
    // Preload next 2 videos
    for (let i = 1; i <= 2; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < videos.length) {
        this.preloadVideo(videos[nextIndex], nextIndex);
      }
    }

    // Preload previous video if not already loaded
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0 && !this.preloadedVideos.has(prevIndex)) {
      this.preloadVideo(videos[prevIndex], prevIndex);
    }
  }

  getPreloadedVideo(index: number): HTMLVideoElement | null {
    return this.preloadedVideos.get(index) || null;
  }

  cleanup(index: number): void {
    const videoElement = this.preloadedVideos.get(index);
    if (videoElement) {
      videoElement.src = '';
      videoElement.load();
      this.preloadedVideos.delete(index);
    }
    this.preloadPromises.delete(index);
  }
}
```


#### 3. Touch Gesture Implementation:


```typescript
// Expected touch gesture handling cho mobile interactions
const VideoPlayerGestures: React.FC<VideoPlayerGesturesProps> = ({
  videoRef,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onSingleTap,
  onLongPress
}) => {
  const gestureState = useRef({
    startY: 0,
    startX: 0,
    startTime: 0,
    isScrolling: false,
    tapCount: 0,
    lastTapTime: 0,
    longPressTimer: null as NodeJS.Timeout | null
  });

  const SWIPE_THRESHOLD = 50;
  const DOUBLE_TAP_DELAY = 300;
  const LONG_PRESS_DELAY = 500;
  const SCROLL_SENSITIVITY = 0.3;

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();

    gestureState.current = {
      ...gestureState.current,
      startY: touch.clientY,
      startX: touch.clientX,
      startTime: now,
      isScrolling: false
    };

    // Long press detection
    gestureState.current.longPressTimer = setTimeout(() => {
      onLongPress?.();
    }, LONG_PRESS_DELAY);

    // Double tap detection
    if (now - gestureState.current.lastTapTime < DOUBLE_TAP_DELAY) {
      gestureState.current.tapCount++;
    } else {
      gestureState.current.tapCount = 1;
    }

    gestureState.current.lastTapTime = now;
  }, [onLongPress]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const deltaY = touch.clientY - gestureState.current.startY;
    const deltaX = touch.clientX - gestureState.current.startX;

    // Clear long press timer if moved
    if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
      if (gestureState.current.longPressTimer) {
        clearTimeout(gestureState.current.longPressTimer);
        gestureState.current.longPressTimer = null;
      }
    }

    // Detect vertical scrolling intent
    if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
      gestureState.current.isScrolling = true;

      // Prevent default scrolling to enable custom handling
      e.preventDefault();
    }
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - gestureState.current.startY;
    const deltaX = touch.clientX - gestureState.current.startX;
    const duration = Date.now() - gestureState.current.startTime;

    // Clear long press timer
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer);
      gestureState.current.longPressTimer = null;
    }

    // Handle swipe gestures
    if (gestureState.current.isScrolling) {
      const velocity = Math.abs(deltaY) / duration;

      if (Math.abs(deltaY) > SWIPE_THRESHOLD && velocity > SCROLL_SENSITIVITY) {
        if (deltaY < 0) {
          // Swipe up - next video
          onSwipeUp?.();
        } else {
          // Swipe down - previous video
          onSwipeDown?.();
        }
      }
    } else if (duration < 200 && Math.abs(deltaY) < 10 && Math.abs(deltaX) < 10) {
      // Handle tap gestures
      if (gestureState.current.tapCount === 2) {
        onDoubleTap?.();
      } else {
        // Single tap với delay để check for double tap
        setTimeout(() => {
          if (gestureState.current.tapCount === 1) {
            onSingleTap?.();
          }
          gestureState.current.tapCount = 0;
        }, DOUBLE_TAP_DELAY);
      }
    }
  }, [onSwipeUp, onSwipeDown, onDoubleTap, onSingleTap]);

  // Attach event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    videoElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    videoElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      videoElement.removeEventListener('touchstart', handleTouchStart);
      videoElement.removeEventListener('touchmove', handleTouchMove);
      videoElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return null; // This component doesn't render anything
};
```


#### 4. Video Player với Social Features:


```typescript
// Expected video player với social interactions
const TikTokVideoPlayer: React.FC<TikTokVideoPlayerProps> = ({
  video,
  isActive,
  isVisible,
  onInteraction
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isLiked, setIsLiked] = useState(video.stats.isLiked);
  const [likeCount, setLikeCount] = useState(video.stats.likes);
  const [isFollowing, setIsFollowing] = useState(video.author.isFollowing);

  // Auto-play when active và visible
  useEffect(() => {
    if (videoRef.current && isActive && isVisible) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, isVisible]);

  // Video progress tracking
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);

      // Track viewing progress for analytics
      const progress = (videoElement.currentTime / videoElement.duration) * 100;
      if (progress > 0 && progress % 25 === 0) { // Track at 25%, 50%, 75%, 100%
        onInteraction?.({
          type: 'view_progress',
          videoId: video.id,
          progress
        });
      }
    };

    const handleEnded = () => {
      onInteraction?.({
        type: 'video_complete',
        videoId: video.id,
        watchTime: videoElement.duration
      });
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [video.id, onInteraction]);

  // Handle like interaction
  const handleLike = useCallback(async () => {
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;

    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount(newLikeCount);

    try {
      await onInteraction?.({
        type: 'like',
        videoId: video.id,
        liked: newLikedState
      });
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      console.error('Failed to update like:', error);
    }
  }, [isLiked, likeCount, video.id, onInteraction]);

  // Handle follow interaction
  const handleFollow = useCallback(async () => {
    const newFollowingState = !isFollowing;

    // Optimistic update
    setIsFollowing(newFollowingState);

    try {
      await onInteraction?.({
        type: 'follow',
        userId: video.author.id,
        following: newFollowingState
      });
    } catch (error) {
      // Revert on error
      setIsFollowing(isFollowing);
      console.error('Failed to update follow:', error);
    }
  }, [isFollowing, video.author.id, onInteraction]);

  // Handle share
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Video by ${video.author.username}`,
          text: video.caption,
          url: `${window.location.origin}/video/${video.id}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
        // Show toast notification
      }

      onInteraction?.({
        type: 'share',
        videoId: video.id
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [video, onInteraction]);

  return (
    <div className="tiktok-video-player">
      <video
        ref={videoRef}
        className="video-element"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        poster={video.thumbnail}
      >
        <source src={video.url} type="video/mp4" />
      </video>

      {/* Video overlay controls */}
      <div
        className={classNames('video-overlay', {
          'controls-visible': showControls
        })}
        onClick={() => setShowControls(!showControls)}
      >
        {/* Center play/pause button */}
        <button
          className="play-pause-button"
          onClick={(e) => {
            e.stopPropagation();
            if (isPlaying) {
              videoRef.current?.pause();
              setIsPlaying(false);
            } else {
              videoRef.current?.play();
              setIsPlaying(true);
            }
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Mute toggle */}
        <button
          className="mute-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
        >
          {isMuted ? <MutedIcon /> : <VolumeIcon />}
        </button>

        {/* Progress bar */}
        <div className="video-progress">
          <div
            className="progress-bar"
            style={{
              width: `${(currentTime / video.duration) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Side action buttons */}
      <div className="video-actions">
        <div className="author-avatar">
          <img src={video.author.avatar} alt={video.author.username} />
          {!isFollowing && (
            <button className="follow-button" onClick={handleFollow}>
              <PlusIcon />
            </button>
          )}
        </div>

        <button
          className={classNames('like-button', { liked: isLiked })}
          onClick={handleLike}
        >
          <HeartIcon />
          <span className="count">{formatNumber(likeCount)}</span>
        </button>

        <button className="comment-button">
          <CommentIcon />
          <span className="count">{formatNumber(video.stats.comments)}</span>
        </button>

        <button className="share-button" onClick={handleShare}>
          <ShareIcon />
          <span className="count">{formatNumber(video.stats.shares)}</span>
        </button>

        <button className="save-button">
          <BookmarkIcon />
        </button>
      </div>

      {/* Video info */}
      <div className="video-info">
        <div className="author-info">
          <span className="username">@{video.author.username}</span>
          {video.author.isVerified && <VerifiedIcon />}
        </div>

        <div className="video-caption">
          {video.caption}
          {video.hashtags.map(tag => (
            <span key={tag} className="hashtag">#{tag}</span>
          ))}
        </div>

        {video.music && (
          <div className="music-info">
            <MusicIcon />
            <span>{video.music.title} - {video.music.artist}</span>
          </div>
        )}
      </div>

      {/* Gesture handler */}
      <VideoPlayerGestures
        videoRef={videoRef}
        onDoubleTap={handleLike}
        onSingleTap={() => setShowControls(!showControls)}
        onSwipeUp={() => onInteraction?.({ type: 'swipe_next' })}
        onSwipeDown={() => onInteraction?.({ type: 'swipe_prev' })}
      />
    </div>
  );
};
```


### 🏆 Evaluation Criteria


#### Video Performance (40%):


- Efficient video preloading strategy
- Memory management với cleanup
- Smooth scrolling performance (60fps)
- Adaptive video quality based on network
- Battery optimization techniques
- Background video handling


#### Touch Interactions (35%):


- Responsive gesture recognition
- Smooth swipe animations
- Double-tap like functionality
- Long press interactions
- Scroll momentum handling
- Cross-platform touch compatibility


#### Social Features (25%):


- Real-time like/comment updates
- Optimistic UI updates
- Share functionality implementation
- Follow/unfollow logic
- Analytics tracking integration
- Error handling và recovery


---


Đây là phần tiếp theo với các đề bài phỏng vấn chi tiết cho Microsoft, Stripe, và TikTok. Bạn có muốn tôi tiếp tục với các công ty còn lại như Binance, Grammarly, hoặc focus vào một specific aspect nào đó không?
