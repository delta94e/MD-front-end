# High-Level Design: Ticket Booking System (BookMyShow Clone)

## 1. Problem Statement & Requirements

### Problem Statement

Design a scalable frontend architecture for a ticket booking platform similar to BookMyShow that allows users to discover movies/events, view showtimes, select seats, and complete bookings in real-time. The system must handle high concurrent traffic during peak hours (new movie releases, flash sales), maintain seat inventory consistency, and provide a responsive user experience across devices.

**Key Challenges:**

- Race conditions during concurrent seat selection
- Real-time seat availability updates
- High traffic spikes (10-100x normal load during releases)
- Complex state management across booking flow
- Payment gateway integration with failure recovery
- Geographic distribution of users with varying network conditions

### Functional Requirements

**Core Features:**

1. **Movie/Event Discovery**

   - Browse movies by category, language, genre
   - Search with autocomplete
   - Filter and sort capabilities
   - Movie details (cast, reviews, ratings, trailers)
   - Venue/theater information

2. **Showtime Selection**

   - Date and time slot selection
   - Theater location-based filtering
   - Price tier visibility
   - Real-time seat availability indicators

3. **Seat Selection**

   - Interactive seat map (2D layout)
   - Real-time seat locking mechanism
   - Multiple seat selection
   - Seat type differentiation (Regular, Premium, Recliner)
   - Hold timer (10-15 minutes)

4. **Booking Flow**

   - Multi-step checkout process
   - User authentication
   - Apply promo codes/offers
   - Food & beverage selection
   - Payment processing
   - Booking confirmation & ticket generation

5. **User Management**
   - Login/Registration
   - Booking history
   - Saved payment methods
   - Preferences (location, languages)

**User Roles:**

- **Guest Users**: Browse, search (limited functionality)
- **Registered Users**: Full booking capabilities
- **Admins**: Theater management, show scheduling (not in scope for frontend HLD)

### Non-Functional Requirements

**Performance Metrics:**

| Metric                         | Target  | Critical Threshold |
| ------------------------------ | ------- | ------------------ |
| Initial Page Load (FCP)        | < 1.5s  | < 2.5s             |
| Time to Interactive (TTI)      | < 3.5s  | < 5s               |
| Largest Contentful Paint (LCP) | < 2.5s  | < 4s               |
| First Input Delay (FID)        | < 100ms | < 300ms            |
| Cumulative Layout Shift (CLS)  | < 0.1   | < 0.25             |
| Seat Map Render                | < 500ms | < 1s               |
| Search Response                | < 200ms | < 500ms            |
| Route Transition               | < 300ms | < 500ms            |

**Bundle Size Targets:**

- Initial Bundle: < 150KB gzipped
- Route Chunks: < 50KB each
- Vendor Bundle: < 200KB
- Total JS: < 500KB (including async chunks)

**Runtime Performance:**

- Maintain 60 FPS during animations
- Memory usage < 100MB on mobile devices
- Time to seat lock acknowledgment < 500ms
- Payment processing feedback < 1s

**Availability & Reliability:**

- 99.9% uptime
- Graceful degradation on network failures
- Offline capability for viewing booked tickets
- Support for slow 3G networks (> 400kbps)

### Scale Estimates

**User Metrics:**

- Total Users: 50M+
- Daily Active Users (DAU): 5M
- Peak Concurrent Users: 500K (during major releases)
- Average Session Duration: 8-12 minutes
- Booking Conversion Rate: ~15%

**Traffic Patterns:**

- Normal Load: ~10K requests/second
- Peak Load: ~100K requests/second
- Geographic Distribution: 80% from top 10 cities
- Device Split: 70% mobile, 25% desktop, 5% tablet

**Data Volume:**

- Movies/Events: ~2000 active at any time
- Theaters: ~5000 venues
- Shows per day: ~50K
- Seat maps: Avg 200-300 seats per show
- Bookings per day: 500K-1M
- Data Transfer: ~500GB/day (images, videos, API)

**Real-time Constraints:**

- Seat status updates: < 2s latency
- Concurrent seat selections per show: 100-500 users
- WebSocket connections: 50K-100K concurrent
- Polling fallback: Every 3-5 seconds

---

## 2. High-Level Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │  Mobile Web  │  │  PWA/Native  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│         ┌──────────────────▼────────────────────┐               │
│         │      Service Worker (Offline)         │               │
│         └──────────────────┬────────────────────┘               │
│                            │                                      │
├────────────────────────────┼──────────────────────────────────────┤
│                  APPLICATION LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│                            │                                      │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │              React Application Shell                │         │
│  │  ┌──────────────────────────────────────────────┐  │         │
│  │  │         Routing (React Router)               │  │         │
│  │  └─────────────────┬────────────────────────────┘  │         │
│  │                    │                                 │         │
│  │  ┌─────────────────▼────────────────────────────┐  │         │
│  │  │   Feature Modules (Lazy Loaded)              │  │         │
│  │  │  • Discovery  • Showtime  • Booking          │  │         │
│  │  │  • Payment    • Profile   • History          │  │         │
│  │  └─────────────────┬────────────────────────────┘  │         │
│  │                    │                                 │         │
│  └────────────────────┼─────────────────────────────────┘         │
│                       │                                           │
│  ┌────────────────────▼─────────────────────────────┐           │
│  │          STATE MANAGEMENT LAYER                   │           │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │           │
│  │  │   Zustand   │  │ React Query  │  │ Context │ │           │
│  │  │ (UI State)  │  │(Server State)│  │  (Auth) │ │           │
│  │  └─────────────┘  └──────────────┘  └─────────┘ │           │
│  └──────────────────────────────────────────────────┘           │
│                       │                                           │
├───────────────────────┼───────────────────────────────────────────┤
│                DATA & API LAYER                                   │
├──────────────────────────────────────────────────────────────────┤
│                       │                                           │
│  ┌────────────────────▼─────────────────────────────┐           │
│  │              API Client Layer                     │           │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │           │
│  │  │   REST   │  │ WebSocket│  │  GraphQL (opt) │ │           │
│  │  │  Client  │  │  Client  │  │     Client     │ │           │
│  │  └────┬─────┘  └────┬─────┘  └────────┬───────┘ │           │
│  │       │             │                  │          │           │
│  │  ┌────▼─────────────▼──────────────────▼───────┐ │           │
│  │  │      Request/Response Interceptors           │ │           │
│  │  │  • Auth  • Retry  • Logging  • Error        │ │           │
│  │  └──────────────────────────────────────────────┘ │           │
│  └──────────────────────────────────────────────────┘           │
│                       │                                           │
│  ┌────────────────────▼─────────────────────────────┐           │
│  │          Client-Side Storage                      │           │
│  │  • IndexedDB  • LocalStorage  • SessionStorage   │           │
│  └──────────────────────────────────────────────────┘           │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │      CDN (Static Assets)    │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │     Backend APIs (BFF)      │
         │  • Movie API                │
         │  • Booking API              │
         │  • Payment API              │
         │  • Notification API         │
         └─────────────────────────────┘
```

### Component Hierarchy

```
App
│
├── AppShell
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar (with Autocomplete)
│   │   ├── LocationSelector
│   │   ├── Navigation
│   │   └── UserMenu
│   │
│   ├── Main
│   │   └── Routes
│   │       ├── HomePage
│   │       │   ├── HeroCarousel
│   │       │   ├── MovieGrid
│   │       │   └── EventsSection
│   │       │
│   │       ├── MovieDetailsPage
│   │       │   ├── MovieHero
│   │       │   ├── MovieInfo
│   │       │   ├── CastCrew
│   │       │   └── ReviewsSection
│   │       │
│   │       ├── ShowtimePage
│   │       │   ├── DateSelector
│   │       │   ├── TheaterList
│   │       │   │   └── TheaterCard
│   │       │   │       └── ShowtimeSlot[]
│   │       │   └── Filters
│   │       │
│   │       ├── SeatSelectionPage
│   │       │   ├── BookingSummary
│   │       │   ├── SeatMap
│   │       │   │   ├── Screen
│   │       │   │   ├── SeatGrid
│   │       │   │   │   └── Seat[]
│   │       │   │   └── Legend
│   │       │   └── Timer
│   │       │
│   │       ├── CheckoutPage
│   │       │   ├── OrderSummary
│   │       │   ├── FoodBeverageSelector
│   │       │   ├── PromoCodeInput
│   │       │   └── PaymentSection
│   │       │
│   │       └── ConfirmationPage
│   │           ├── BookingDetails
│   │           ├── QRCode
│   │           └── Actions
│   │
│   └── Footer
│
└── GlobalProviders
    ├── AuthProvider
    ├── ThemeProvider
    ├── ToastProvider
    └── QueryClientProvider
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTIONS                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COMPONENT LAYER                                 │
│  User Events → Component Handlers → Dispatch Actions            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STATE MANAGEMENT LAYER                              │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  UI State Store  │◄────────┤  Server Cache    │             │
│  │   (Zustand)      │         │ (React Query)    │             │
│  │                  │         │                  │             │
│  │ • selectedSeats  │         │ • movies         │             │
│  │ • filters        │         │ • showtimes      │             │
│  │ • modals         │         │ • seatMap        │             │
│  │ • cart           │         │ • bookingStatus  │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                         │
│           └────────────┬───────────────┘                         │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER                                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Query/Mutation Router                      │   │
│  └─────┬────────────────────────────────────────────┬──────┘   │
│        │                                             │           │
│   ┌────▼─────┐                                 ┌────▼─────┐    │
│   │   REST   │                                 │WebSocket │    │
│   │  Client  │                                 │  Client  │    │
│   └────┬─────┘                                 └────┬─────┘    │
└────────┼──────────────────────────────────────────────┼─────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────────┐                    ┌─────────────────────┐
│   HTTP APIs         │                    │  Real-time Events   │
│  • GET /movies      │                    │  • seat.locked      │
│  • POST /bookings   │                    │  • seat.released    │
│  • GET /seats       │                    │  • booking.updated  │
└─────────────────────┘                    └─────────────────────┘
```

### Architecture Principles

**1. Separation of Concerns**

- **Why**: Maintainability at scale. Each layer has a single responsibility.
- **How**: Clear boundaries between UI, state, and data layers.
- Components don't know about API details; API layer doesn't know about UI state.

**2. Performance-First Design**

- **Why**: User experience directly impacts conversion rates. Every 100ms delay = 1% revenue loss.
- **How**:
  - Code splitting at route level
  - Lazy loading for non-critical features
  - Aggressive caching with React Query
  - Prefetching on hover/focus for likely next actions

**3. Resilience & Fault Tolerance**

- **Why**: Network failures shouldn't break the app. Users on flaky connections are paying customers too.
- **How**:
  - Optimistic UI updates with rollback
  - Retry logic with exponential backoff
  - Graceful degradation (WebSocket → Polling → Error state)
  - Offline support for critical flows (view tickets)

**4. Real-time with Eventual Consistency**

- **Why**: Seat locking requires near-instant feedback, but perfect consistency is impossible at scale.
- **How**:
  - WebSocket for seat updates (soft real-time)
  - Server-side validation as source of truth
  - Client-side optimistic locking with 10-minute expiry
  - Conflict resolution on server response

**5. Progressive Enhancement**

- **Why**: Users on older devices/browsers still convert.
- **How**:
  - SSR/SSG for critical pages (SEO, FCP)
  - Hydration strategy for interactivity
  - Fallbacks for modern APIs (IntersectionObserver, WebSocket)

**6. Composability Over Inheritance**

- **Why**: React's composition model scales better than class hierarchies.
- **How**:
  - Compound components for complex UI (SeatMap)
  - Custom hooks for shared logic
  - Higher-order components only for cross-cutting concerns (auth, logging)

### System Invariants

**Critical Rules (Never Violate):**

1. **Seat Locking Invariant**

   - A seat can only be in one of: AVAILABLE, LOCKED (by user), LOCKED (by others), BOOKED
   - Client must never show a seat as selectable if server says otherwise
   - Timer must be synchronized with server-side expiry

2. **Payment Idempotency**

   - Every payment attempt must have a unique idempotency key
   - Retry/refresh must not create duplicate charges
   - Backend validates idempotency, frontend ensures key generation

3. **State Consistency**

   - UI state must reflect server state after reconciliation
   - Optimistic updates must be rolled back on server rejection
   - No orphaned state (selected seats without locked status)

4. **Security Invariant**

   - No sensitive data (tokens, payment info) in localStorage
   - All API calls include CSRF tokens
   - XSS prevention: sanitize all user inputs

5. **Accessibility Invariant**
   - Keyboard navigation works for entire booking flow
   - Screen reader announcements for seat selection
   - WCAG 2.1 AA compliance minimum

---

## 3. Component Architecture

### Component Breakdown

#### Level 1: Application Shell Components

```
┌─────────────────────────────────────────────────────────────┐
│                         AppShell                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      Header                            │ │
│  │  [Logo] [Search] [Location] [Nav] [User]              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     Main Content                       │ │
│  │                  (Route-based lazy loaded)             │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      Footer                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Smart Component: AppShell
- Manages global layout state
- Handles authentication checks
- Controls scroll restoration
```

**AppShell Component (Smart Container)**

```typescript
// AppShell.tsx
import { Suspense, lazy } from "react";
import { useAuthStore } from "@/stores/auth";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

// Lazy load heavy components
const Header = lazy(() => import("./Header"));
const Footer = lazy(() => import("./Footer"));

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  useScrollRestoration();

  return (
    <div className="app-shell">
      <Suspense fallback={<HeaderSkeleton />}>
        <Header user={user} isAuthenticated={isAuthenticated} />
      </Suspense>

      <main className="main-content" role="main">
        {children}
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      {/* Global components */}
      <ToastContainer />
      <ModalPortal />
    </div>
  );
};
```

#### Level 2: Feature Module Components

**Seat Selection Module Architecture**

```
SeatSelectionPage (Smart Container)
│
├── BookingSummary (Presentational)
│   ├── MovieInfo (Presentational)
│   ├── ShowtimeInfo (Presentational)
│   └── PriceBreakdown (Presentational)
│
├── SeatMapContainer (Smart)
│   ├── SeatMapProvider (Context)
│   ├── Screen (Presentational)
│   ├── SeatGrid (Smart)
│   │   └── Seat[] (Presentational with memo)
│   ├── Legend (Presentational)
│   └── ZoomControls (Presentational)
│
├── SelectionSummary (Presentational)
│   ├── SelectedSeatsChips (Presentational)
│   └── TotalPrice (Presentational)
│
└── ActionBar (Smart)
    ├── Timer (Smart - WebSocket connected)
    └── ProceedButton (Presentational)
```

**SeatMapContainer - Compound Component Pattern**

```typescript
// SeatMapContainer.tsx
import { createContext, useContext, useCallback, useMemo } from "react";
import { useSeatSelection } from "@/hooks/useSeatSelection";
import { useWebSocket } from "@/hooks/useWebSocket";

// Context for seat map state
interface SeatMapContextValue {
  selectedSeats: Set<string>;
  lockedSeats: Map<string, { userId: string; expiresAt: number }>;
  toggleSeat: (seatId: string) => void;
  isSeatSelectable: (seatId: string) => boolean;
}

const SeatMapContext = createContext<SeatMapContextValue | null>(null);

export const useSeatMapContext = () => {
  const context = useContext(SeatMapContext);
  if (!context)
    throw new Error("useSeatMapContext must be used within SeatMapProvider");
  return context;
};

// Main container component
export const SeatMapContainer: React.FC<{
  showId: string;
  layout: SeatLayout;
}> = ({ showId, layout }) => {
  const { selectedSeats, lockedSeats, toggleSeat, isSeatSelectable } =
    useSeatSelection(showId);

  // WebSocket for real-time updates
  useWebSocket(`/shows/${showId}/seats`, {
    onMessage: (event) => {
      // Handle seat lock/unlock events
      handleSeatUpdate(event.data);
    },
  });

  const contextValue = useMemo(
    () => ({
      selectedSeats,
      lockedSeats,
      toggleSeat,
      isSeatSelectable,
    }),
    [selectedSeats, lockedSeats, toggleSeat, isSeatSelectable]
  );

  return (
    <SeatMapContext.Provider value={contextValue}>
      <div className="seat-map-container">
        <Screen />
        <SeatGrid layout={layout} />
        <Legend />
      </div>
    </SeatMapContext.Provider>
  );
};

// Compound component: SeatGrid
const SeatGrid: React.FC<{ layout: SeatLayout }> = ({ layout }) => {
  const { selectedSeats, isSeatSelectable, toggleSeat } = useSeatMapContext();

  return (
    <div className="seat-grid" role="grid" aria-label="Seat selection">
      {layout.rows.map((row) => (
        <div key={row.id} className="seat-row" role="row">
          <span className="row-label">{row.label}</span>
          {row.seats.map((seat) => (
            <Seat
              key={seat.id}
              seat={seat}
              isSelected={selectedSeats.has(seat.id)}
              isSelectable={isSeatSelectable(seat.id)}
              onToggle={() => toggleSeat(seat.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Presentational component: Seat
interface SeatProps {
  seat: SeatData;
  isSelected: boolean;
  isSelectable: boolean;
  onToggle: () => void;
}

const Seat = React.memo<SeatProps>(
  ({ seat, isSelected, isSelectable, onToggle }) => {
    const className = classNames("seat", {
      "seat--selected": isSelected,
      "seat--available": isSelectable,
      "seat--locked": !isSelectable && seat.status === "LOCKED",
      "seat--booked": seat.status === "BOOKED",
      "seat--premium": seat.type === "PREMIUM",
    });

    return (
      <button
        className={className}
        onClick={onToggle}
        disabled={!isSelectable}
        aria-label={`Seat ${seat.label}, ${seat.type}, ${seat.status}`}
        aria-pressed={isSelected}
        role="gridcell"
      >
        {seat.label}
      </button>
    );
  },
  (prev, next) =>
    // Custom comparison for memoization
    prev.isSelected === next.isSelected &&
    prev.isSelectable === next.isSelectable &&
    prev.seat.status === next.seat.status
);
```

### Smart vs Dumb Components

**Smart (Container) Components:**

- Connect to stores/context
- Handle business logic
- Manage side effects
- Orchestrate data fetching
- Examples: `SeatSelectionPage`, `SeatMapContainer`, `TheaterListContainer`

```typescript
// Smart Component Example
const MovieDetailsPage: React.FC = () => {
  const { movieId } = useParams();
  const { data: movie, isLoading } = useMovieQuery(movieId);
  const { addToWatchlist } = useWatchlistMutations();

  // Business logic
  const handleWatchlistToggle = useCallback(() => {
    addToWatchlist(movieId);
    trackEvent("watchlist_add", { movieId });
  }, [movieId, addToWatchlist]);

  if (isLoading) return <MovieDetailsSkeleton />;

  return (
    <MovieDetailsView movie={movie} onWatchlistToggle={handleWatchlistToggle} />
  );
};
```

**Dumb (Presentational) Components:**

- Pure functions of props
- No side effects
- No external dependencies
- Highly reusable
- Examples: `Seat`, `MovieCard`, `Button`, `Legend`

```typescript
// Dumb Component Example
interface MovieCardProps {
  title: string;
  poster: string;
  rating: number;
  languages: string[];
  onClick: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  title,
  poster,
  rating,
  languages,
  onClick,
}) => (
  <article className="movie-card" onClick={onClick}>
    <img src={poster} alt={title} loading="lazy" />
    <div className="movie-card__info">
      <h3>{title}</h3>
      <div className="movie-card__meta">
        <Rating value={rating} />
        <Languages items={languages} />
      </div>
    </div>
  </article>
);
```

### Container vs Presentational Pattern

**When to use Container Pattern:**

- Complex data fetching logic
- Multiple data sources
- Business rule orchestration
- Form handling with validation

**When to avoid:**

- Simple components with minimal logic
- Purely visual components
- Over-abstraction hurts readability

### Atomic Design Application

```
Atoms:
├── Button
├── Input
├── Icon
├── Badge
├── Spinner
└── Typography

Molecules:
├── SearchBar (Input + Icon + Suggestions)
├── RatingDisplay (Icon + Typography)
├── PriceTag (Typography + Badge)
├── SeatLegendItem (Icon + Typography)
└── DateChip (Icon + Typography)

Organisms:
├── Header (Logo + SearchBar + Navigation + UserMenu)
├── MovieCard (Image + Typography + RatingDisplay + Button)
├── TheaterCard (Typography + ShowtimeSlot[] + Button)
├── SeatMap (Screen + SeatGrid + Legend)
└── CheckoutForm (Input[] + Button + PriceTag)

Templates:
├── MovieListTemplate
├── BookingFlowTemplate
└── ProfileTemplate

Pages:
├── HomePage
├── MovieDetailsPage
├── SeatSelectionPage
└── CheckoutPage
```

### Component API Design

**Principles:**

1. **Minimal Surface Area**: Expose only what's necessary
2. **Type Safety**: Comprehensive TypeScript interfaces
3. **Composability**: Support render props/children patterns
4. **Accessibility**: ARIA attributes by default

```typescript
// Example: Well-designed Component API

// 1. Props Interface with comprehensive types
interface DateSelectorProps {
  /** Available dates for selection */
  dates: Date[];
  /** Currently selected date */
  selectedDate: Date | null;
  /** Callback when date changes */
  onDateChange: (date: Date) => void;
  /** Minimum selectable date (default: today) */
  minDate?: Date;
  /** Maximum selectable date (default: 30 days from today) */
  maxDate?: Date;
  /** Custom date formatter */
  formatDate?: (date: Date) => string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
}

// 2. Component with sensible defaults
export const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onDateChange,
  minDate = new Date(),
  maxDate = addDays(new Date(), 30),
  formatDate = defaultFormatter,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Select date',
}) => {
  // Implementation with full type safety
  const handleSelect = (date: Date) => {
    if (!disabled && isDateInRange(date, minDate, maxDate)) {
      onDateChange(date);
    }
  };

  return (
    <div
      className={classNames('date-selector', className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {dates.map((date) => (
        <DateOption
          key={date.toISOString()}
          date={date}
          isSelected={isSameDay(date, selectedDate)}
          onSelect={handleSelect}
          formatter={formatDate}
          disabled={disabled || !isDateInRange(date, minDate, maxDate)}
        />
      ))}
    </div>
  );
};

// 3. Compound Component Pattern for advanced use
DateSelector.Option = DateOption;
DateSelector.Group = DateGroup;

// Usage:
// Simple:
<DateSelector dates={dates} selectedDate={date} onDateChange={setDate} />

// Advanced:
<DateSelector.Group>
  <DateSelector.Option date={date1} />
  <DateSelector.Option date={date2} />
</DateSelector.Group>
```

---

## 4. State Management

### Global State Structure

```typescript
// Complete state tree structure

// 1. UI State (Zustand) - Client-only ephemeral state
interface UIState {
  // Modal management
  modals: {
    loginModal: { isOpen: boolean; redirectUrl?: string };
    promoModal: { isOpen: boolean; data?: PromoData };
  };

  // Filters & Search
  filters: {
    location: { city: string; latitude: number; longitude: number };
    language: string[];
    genre: string[];
    format: ("2D" | "3D" | "IMAX")[];
    priceRange: [number, number];
  };

  // Booking flow state
  booking: {
    step: "movie" | "showtime" | "seats" | "checkout" | "confirmation";
    selectedMovieId: string | null;
    selectedShowId: string | null;
    selectedSeats: string[]; // seat IDs
    foodItems: { itemId: string; quantity: number }[];
    appliedPromo: string | null;
  };

  // UI preferences
  preferences: {
    theme: "light" | "dark" | "auto";
    seatMapZoom: number;
    defaultLanguage: string;
  };

  // Toast notifications
  toasts: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration: number;
  }>;
}

// 2. Server State (React Query) - Cached from API
interface ServerState {
  // Movies
  movies: {
    // Query key: ['movies', filters]
    list: Movie[];
    // Query key: ['movie', movieId]
    details: Map<string, MovieDetails>;
    // Query key: ['movies', 'trending']
    trending: Movie[];
  };

  // Showtimes
  showtimes: {
    // Query key: ['showtimes', movieId, date, location]
    byMovie: Map<string, Theater[]>;
    // Query key: ['showtime', showId]
    details: Map<string, ShowtimeDetails>;
  };

  // Seats
  seats: {
    // Query key: ['seats', showId]
    layout: Map<string, SeatLayout>;
    // Query key: ['seats', showId, 'status']
    status: Map<string, SeatStatus[]>;
  };

  // Bookings
  bookings: {
    // Query key: ['bookings', userId]
    history: Booking[];
    // Query key: ['booking', bookingId]
    details: Map<string, BookingDetails>;
    // Current booking in progress
    current: BookingInProgress | null;
  };

  // User
  user: {
    // Query key: ['user', 'profile']
    profile: UserProfile;
    // Query key: ['user', 'preferences']
    preferences: UserPreferences;
  };
}

// 3. Auth State (Context) - Session management
interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null;
}
```

### State Management Patterns

**Zustand Store Implementation**

```typescript
// stores/useBookingStore.ts
import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface BookingState {
  // State
  step: BookingStep;
  selectedMovieId: string | null;
  selectedShowId: string | null;
  selectedSeats: string[];
  foodItems: FoodItem[];
  appliedPromo: PromoCode | null;

  // Actions
  setStep: (step: BookingStep) => void;
  selectMovie: (movieId: string) => void;
  selectShow: (showId: string) => void;
  toggleSeat: (seatId: string) => void;
  addFoodItem: (item: FoodItem) => void;
  removeFoodItem: (itemId: string) => void;
  applyPromo: (code: string) => Promise<void>;
  resetBooking: () => void;

  // Computed
  totalPrice: () => number;
  canProceed: () => boolean;
}

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        step: "movie",
        selectedMovieId: null,
        selectedShowId: null,
        selectedSeats: [],
        foodItems: [],
        appliedPromo: null,

        // Actions with Immer for immutability
        setStep: (step) => set({ step }),

        selectMovie: (movieId) =>
          set((state) => {
            state.selectedMovieId = movieId;
            state.step = "showtime";
          }),

        selectShow: (showId) =>
          set((state) => {
            state.selectedShowId = showId;
            state.step = "seats";
          }),

        toggleSeat: (seatId) =>
          set((state) => {
            const index = state.selectedSeats.indexOf(seatId);
            if (index > -1) {
              state.selectedSeats.splice(index, 1);
            } else {
              // Business rule: max 10 seats
              if (state.selectedSeats.length < 10) {
                state.selectedSeats.push(seatId);
              }
            }
          }),

        addFoodItem: (item) =>
          set((state) => {
            const existing = state.foodItems.find((f) => f.id === item.id);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              state.foodItems.push(item);
            }
          }),

        removeFoodItem: (itemId) =>
          set((state) => {
            const index = state.foodItems.findIndex((f) => f.id === itemId);
            if (index > -1) {
              state.foodItems.splice(index, 1);
            }
          }),

        applyPromo: async (code) => {
          try {
            const promo = await validatePromoCode(code);
            set({ appliedPromo: promo });
          } catch (error) {
            throw new Error("Invalid promo code");
          }
        },

        resetBooking: () =>
          set({
            step: "movie",
            selectedMovieId: null,
            selectedShowId: null,
            selectedSeats: [],
            foodItems: [],
            appliedPromo: null,
          }),

        // Computed values
        totalPrice: () => {
          const state = get();
          const seatPrice = state.selectedSeats.length * 200; // Mock price
          const foodPrice = state.foodItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          const discount = state.appliedPromo?.discount || 0;
          return seatPrice + foodPrice - discount;
        },

        canProceed: () => {
          const state = get();
          switch (state.step) {
            case "movie":
              return !!state.selectedMovieId;
            case "showtime":
              return !!state.selectedShowId;
            case "seats":
              return state.selectedSeats.length > 0;
            case "checkout":
              return true;
            default:
              return false;
          }
        },
      })),
      {
        name: "booking-storage",
        // Persist only necessary fields
        partialize: (state) => ({
          selectedMovieId: state.selectedMovieId,
          selectedShowId: state.selectedShowId,
          selectedSeats: state.selectedSeats,
        }),
      }
    )
  )
);

// Selectors for performance
export const useSelectedSeats = () =>
  useBookingStore((state) => state.selectedSeats);

export const useTotalPrice = () =>
  useBookingStore((state) => state.totalPrice());
```

**React Query Configuration**

```typescript
// lib/react-query.ts
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes for most data

      // Cache time: How long unused data stays in cache
      cacheTime: 10 * 60 * 1000, // 10 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry 4xx errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },

    mutations: {
      retry: 1,
      onError: (error) => {
        toast.error(error.message || "Something went wrong");
      },
    },
  },

  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handling
      console.error("Query error:", error, query.queryKey);

      if (error.response?.status === 401) {
        // Handle unauthorized
        window.location.href = "/login";
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error("Mutation error:", error, mutation.options.mutationKey);
    },
  }),
});

// Custom query hooks with specific configurations

// Movies: Cache for longer (30 min) as they change infrequently
export const useMovieQuery = (movieId: string) => {
  return useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => api.getMovie(movieId),
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
};

// Seats: Very short stale time (10s) due to real-time nature
export const useSeatsQuery = (showId: string) => {
  return useQuery({
    queryKey: ["seats", showId],
    queryFn: () => api.getSeats(showId),
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 5 * 60 * 1000,
    // Refetch every 5 seconds if focused
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
};
```

### Server State vs Client State Separation

```typescript
// Clear separation of concerns

// ❌ BAD: Mixing server and client state
const BadComponent = () => {
  const [movies, setMovies] = useState([]); // Server state
  const [selectedMovie, setSelectedMovie] = useState(null); // Client state
  const [loading, setLoading] = useState(false); // Derived from server state

  useEffect(() => {
    setLoading(true);
    fetchMovies().then((data) => {
      setMovies(data);
      setLoading(false);
    });
  }, []);

  // Problem: Manual loading state, no caching, no refetch logic
};

// ✅ GOOD: Separated concerns
const GoodComponent = () => {
  // Server state: Managed by React Query
  const { data: movies, isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
  });

  // Client state: Managed by Zustand or local state
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  const selectedMovie = useMemo(
    () => movies?.find((m) => m.id === selectedMovieId),
    [movies, selectedMovieId]
  );

  // Clean separation, automatic caching, loading states
};
```

**Decision Matrix:**

| State Type                 | Storage                  | Example                         |
| -------------------------- | ------------------------ | ------------------------------- |
| Server Data (cacheable)    | React Query              | Movies, showtimes, user profile |
| UI State (ephemeral)       | Zustand / Local State    | Selected filters, modal state   |
| Form State (temporary)     | React Hook Form          | Checkout form, login form       |
| Session State (persistent) | Context + SessionStorage | Auth tokens, user session       |
| Preferences (persistent)   | LocalStorage             | Theme, language, location       |

### Caching Strategy

```typescript
// Advanced caching patterns with React Query

// 1. Prefetching on hover
const MovieCard = ({ movie }) => {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch movie details when user hovers
    queryClient.prefetchQuery({
      queryKey: ["movie", movie.id],
      queryFn: () => api.getMovie(movie.id),
    });
  };

  return <div onMouseEnter={handleMouseEnter}>{/* Card content */}</div>;
};

// 2. Optimistic updates for seat selection
const useSeatSelection = (showId: string) => {
  const queryClient = useQueryClient();

  const selectSeatMutation = useMutation({
    mutationFn: (seatId: string) => api.lockSeat(showId, seatId),

    // Optimistic update
    onMutate: async (seatId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["seats", showId]);

      // Snapshot previous value
      const previousSeats = queryClient.getQueryData(["seats", showId]);

      // Optimistically update
      queryClient.setQueryData(["seats", showId], (old: SeatData[]) =>
        old.map((seat) =>
          seat.id === seatId
            ? { ...seat, status: "LOCKED", lockedBy: "me" }
            : seat
        )
      );

      return { previousSeats };
    },

    // Rollback on error
    onError: (err, seatId, context) => {
      queryClient.setQueryData(["seats", showId], context.previousSeats);
      toast.error("Failed to select seat. Please try again.");
    },

    // Refetch on success or error
    onSettled: () => {
      queryClient.invalidateQueries(["seats", showId]);
    },
  });

  return selectSeatMutation;
};

// 3. Infinite scroll with pagination
const useMoviesInfinite = (filters: MovieFilters) => {
  return useInfiniteQuery({
    queryKey: ["movies", "infinite", filters],
    queryFn: ({ pageParam = 1 }) =>
      api.getMovies({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
};

// 4. Dependent queries
const BookingDetails = ({ bookingId }) => {
  // First, fetch booking
  const { data: booking } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  // Then, fetch movie details (dependent on booking data)
  const { data: movie } = useQuery({
    queryKey: ["movie", booking?.movieId],
    queryFn: () => api.getMovie(booking.movieId),
    enabled: !!booking?.movieId, // Only run when we have movieId
  });

  return <div>{/* Render booking and movie */}</div>;
};
```

### Optimistic Updates Implementation

```typescript
// Complete optimistic update pattern for booking flow

interface BookingMutationContext {
  previousSeats?: SeatData[];
  previousBooking?: BookingState;
  rollbackTimer?: NodeJS.Timeout;
}

const useOptimisticBooking = () => {
  const queryClient = useQueryClient();
  const bookingStore = useBookingStore();

  const createBookingMutation = useMutation;
  BookingResponse,
    Error,
    BookingRequest,
    BookingMutationContext >
      {
        mutationFn: api.createBooking,

        onMutate: async (bookingRequest) => {
          // 1. Cancel outgoing queries
          await queryClient.cancelQueries(["seats", bookingRequest.showId]);
          await queryClient.cancelQueries(["bookings"]);

          // 2. Snapshot previous state
          const previousSeats = queryClient.getQueryData<SeatData[]>([
            "seats",
            bookingRequest.showId,
          ]);
          const previousBooking = bookingStore.getState();

          // 3. Optimistically update seats
          queryClient.setQueryData<SeatData[]>(
            ["seats", bookingRequest.showId],
            (old = []) =>
              old.map((seat) =>
                bookingRequest.seatIds.includes(seat.id)
                  ? { ...seat, status: "BOOKED", bookedBy: "me" }
                  : seat
              )
          );

          // 4. Optimistically add booking to history
          queryClient.setQueryData<Booking[]>(["bookings"], (old = []) => [
            {
              id: "temp-" + Date.now(),
              ...bookingRequest,
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
            ...old,
          ]);

          // 5. Update UI state
          bookingStore.setState({ step: "confirmation" });

          // 6. Set rollback timer (safety net)
          const rollbackTimer = setTimeout(() => {
            // If mutation hasn't completed in 30s, rollback
            queryClient.setQueryData(
              ["seats", bookingRequest.showId],
              previousSeats
            );
            bookingStore.setState(previousBooking);
          }, 30000);

          return { previousSeats, previousBooking, rollbackTimer };
        },

        onSuccess: (response, variables, context) => {
          // Clear rollback timer
          if (context?.rollbackTimer) {
            clearTimeout(context.rollbackTimer);
          }

          // Update with real booking ID
          queryClient.setQueryData<Booking[]>(["bookings"], (old = []) =>
            old.map((booking) =>
              booking.id.startsWith("temp-")
                ? { ...booking, id: response.bookingId, status: "CONFIRMED" }
                : booking
            )
          );

          toast.success("Booking confirmed!");
        },

        onError: (error, variables, context) => {
          // Clear rollback timer
          if (context?.rollbackTimer) {
            clearTimeout(context.rollbackTimer);
          }

          // Rollback optimistic updates
          if (context?.previousSeats) {
            queryClient.setQueryData(
              ["seats", variables.showId],
              context.previousSeats
            );
          }

          if (context?.previousBooking) {
            bookingStore.setState(context.previousBooking);
          }

          // Remove optimistic booking
          queryClient.setQueryData<Booking[]>(["bookings"], (old = []) =>
            old.filter((b) => !b.id.startsWith("temp-"))
          );

          toast.error(error.message || "Booking failed. Please try again.");
        },

        onSettled: (data, error, variables) => {
          // Always refetch to ensure consistency
          queryClient.invalidateQueries(["seats", variables.showId]);
          queryClient.invalidateQueries(["bookings"]);
        },
      };

  return createBookingMutation;
};
```

### State Persistence Strategy

```typescript
// Selective state persistence with versioning

// 1. Zustand persist middleware configuration
const persistConfig = {
  name: "bookmyshow-storage",
  version: 2, // Increment on breaking changes

  // Migrate function for version upgrades
  migrate: (persistedState: any, version: number) => {
    if (version === 1) {
      // Migrate from v1 to v2
      return {
        ...persistedState,
        filters: {
          ...persistedState.filters,
          format: [], // New field in v2
        },
      };
    }
    return persistedState;
  },

  // Selective persistence
  partialize: (state: UIState) => ({
    filters: state.filters,
    preferences: state.preferences,
    // Don't persist modals, toasts, or booking state
  }),

  // Custom storage (IndexedDB for large data)
  storage: createJSONStorage(() => ({
    getItem: async (name) => {
      const value = await idb.get(name);
      return value || null;
    },
    setItem: async (name, value) => {
      await idb.set(name, value);
    },
    removeItem: async (name) => {
      await idb.del(name);
    },
  })),
};

// 2. React Query persistence
const queryClientPersister = createSyncStoragePersister({
  storage: window.sessionStorage, // Use sessionStorage for query cache
  key: "REACT_QUERY_OFFLINE_CACHE",
  throttleTime: 1000,
});

// Only persist specific queries
const persistOptions = {
  persister: queryClientPersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  buster: "v1", // Bust cache on changes
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist movie and user data
      const queryKey = query.queryKey[0];
      return queryKey === "movies" || queryKey === "user";
    },
  },
};

// 3. Booking state - sessionStorage with TTL
const BOOKING_EXPIRY = 30 * 60 * 1000; // 30 minutes

const persistBookingState = (state: BookingState) => {
  const item = {
    value: state,
    expiresAt: Date.now() + BOOKING_EXPIRY,
  };
  sessionStorage.setItem("booking-state", JSON.stringify(item));
};

const restoreBookingState = (): BookingState | null => {
  const item = sessionStorage.getItem("booking-state");
  if (!item) return null;

  const { value, expiresAt } = JSON.parse(item);

  if (Date.now() > expiresAt) {
    sessionStorage.removeItem("booking-state");
    return null;
  }

  return value;
};

// 4. Secure token storage (memory + httpOnly cookie hybrid)
class TokenStorage {
  private accessToken: string | null = null;

  // Store access token in memory (secure from XSS)
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Refresh token stored in httpOnly cookie (backend sets it)
  // No JavaScript access - more secure

  clear() {
    this.accessToken = null;
    // Call API to clear httpOnly cookie
    api.logout();
  }
}

export const tokenStorage = new TokenStorage();
```

---

## 5. Data Flow & API Communication

### REST API Design

```typescript
// API Layer Architecture

// Base API client with interceptors
class ApiClient {
  private baseURL: string;
  private axios: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axios = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          config.headers["X-CSRF-Token"] = csrfToken;
        }

        // Add request ID for tracing
        config.headers["X-Request-ID"] = generateRequestId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.axios(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        // Handle 429 - Rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers["retry-after"];
          await sleep(retryAfter * 1000 || 5000);
          return this.axios(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    // Refresh token stored in httpOnly cookie
    const response = await this.axios.post("/auth/refresh");
    tokenStorage.setAccessToken(response.data.accessToken);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  // Similar for put, patch, delete
}

const apiClient = new ApiClient(process.env.REACT_APP_API_URL);

// API endpoints organized by domain
export const api = {
  // Movies
  movies: {
    list: (params: MovieListParams) =>
      apiClient.get<MovieListResponse>("/movies", { params }),

    get: (id: string) => apiClient.get<MovieDetails>(`/movies/${id}`),

    search: (query: string) =>
      apiClient.get<Movie[]>("/movies/search", { params: { q: query } }),

    trending: () => apiClient.get<Movie[]>("/movies/trending"),
  },

  // Showtimes
  showtimes: {
    getByMovie: (movieId: string, params: ShowtimeParams) =>
      apiClient.get<Theater[]>(`/movies/${movieId}/showtimes`, { params }),

    getDetails: (showId: string) =>
      apiClient.get<ShowtimeDetails>(`/showtimes/${showId}`),
  },

  // Seats
  seats: {
    getLayout: (showId: string) =>
      apiClient.get<SeatLayout>(`/showtimes/${showId}/seats/layout`),

    getStatus: (showId: string) =>
      apiClient.get<SeatStatus[]>(`/showtimes/${showId}/seats/status`),

    lock: (showId: string, seatIds: string[]) =>
      apiClient.post<LockResponse>(`/showtimes/${showId}/seats/lock`, {
        seatIds,
      }),

    unlock: (showId: string, seatIds: string[]) =>
      apiClient.post<void>(`/showtimes/${showId}/seats/unlock`, { seatIds }),
  },

  // Bookings
  bookings: {
    create: (data: CreateBookingRequest) =>
      apiClient.post<BookingResponse>("/bookings", data),

    get: (id: string) => apiClient.get<BookingDetails>(`/bookings/${id}`),

    list: (userId: string) =>
      apiClient.get<Booking[]>("/bookings", { params: { userId } }),

    cancel: (id: string) => apiClient.post<void>(`/bookings/${id}/cancel`),
  },

  // Payments
  payments: {
    initiate: (data: PaymentRequest) =>
      apiClient.post<PaymentInitResponse>("/payments/initiate", data),

    verify: (transactionId: string) =>
      apiClient.post<PaymentVerification>("/payments/verify", {
        transactionId,
      }),
  },

  // User
  user: {
    getProfile: () => apiClient.get<UserProfile>("/user/profile"),

    updateProfile: (data: Partial<UserProfile>) =>
      apiClient.patch<UserProfile>("/user/profile", data),

    getPreferences: () => apiClient.get<UserPreferences>("/user/preferences"),
  },
};
```

### Real-time Communication (WebSocket)

```typescript
// WebSocket client for real-time seat updates

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();

  connect(url: string, token: string) {
    try {
      this.ws = new WebSocket(`${url}?token=${token}`);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.stopHeartbeat();
        this.attemptReconnect(url, token);
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      this.attemptReconnect(url, token);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const { event, data } = message;
    const handlers = this.listeners.get(event);

    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private attemptReconnect(url: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`
      );

      setTimeout(() => {
        this.connect(url, token);
      }, delay);
    } else {
      console.error("Max reconnect attempts reached. Falling back to polling.");
      // Trigger polling fallback
      this.triggerPollingFallback();
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: "ping" });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(event: string, handler: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  private triggerPollingFallback() {
    // Emit event for components to switch to polling
    window.dispatchEvent(new CustomEvent("websocket-fallback"));
  }
}

const wsClient = new WebSocketClient();

// React hook for WebSocket
export const useWebSocket = (showId: string) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL}/shows/${showId}`;
    wsClient.connect(wsUrl, token);

    // Subscribe to seat updates
    const unsubscribeLock = wsClient.subscribe("seat.locked", (data) => {
      // Update React Query cache
      queryClient.setQueryData<SeatStatus[]>(
        ["seats", showId, "status"],
        (old = []) =>
          old.map((seat) =>
            seat.id === data.seatId
              ? { ...seat, status: "LOCKED", lockedBy: data.userId }
              : seat
          )
      );
    });

    const unsubscribeUnlock = wsClient.subscribe("seat.unlocked", (data) => {
      queryClient.setQueryData<SeatStatus[]>(
        ["seats", showId, "status"],
        (old = []) =>
          old.map((seat) =>
            seat.id === data.seatId ? { ...seat, status: "AVAILABLE" } : seat
          )
      );
    });

    const unsubscribeBooked = wsClient.subscribe("seat.booked", (data) => {
      queryClient.setQueryData<SeatStatus[]>(
        ["seats", showId, "status"],
        (old = []) =>
          old.map((seat) =>
            data.seatIds.includes(seat.id)
              ? { ...seat, status: "BOOKED" }
              : seat
          )
      );
    });

    // Fallback to polling if WebSocket fails
    const handleFallback = () => {
      console.log("Switching to polling mode");
      setIsConnected(false);
      // Start polling interval
    };

    window.addEventListener("websocket-fallback", handleFallback);

    return () => {
      unsubscribeLock();
      unsubscribeUnlock();
      unsubscribeBooked();
      wsClient.disconnect();
      window.removeEventListener("websocket-fallback", handleFallback);
    };
  }, [showId, queryClient]);

  return { isConnected };
};
```

### API Layer Abstraction

```typescript
// Repository pattern for clean API abstraction

interface Repository<T> {
  find(id: string): Promise<T>;
  findAll(params?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Movie repository
class MovieRepository implements Repository<Movie> {
  async find(id: string): Promise<Movie> {
    try {
      return await api.movies.get(id);
    } catch (error) {
      throw new RepositoryError("Failed to fetch movie", error);
    }
  }

  async findAll(params?: MovieListParams): Promise<Movie[]> {
    const response = await api.movies.list(params || {});
    return response.data;
  }

  async search(query: string): Promise<Movie[]> {
    if (query.length < 2) return [];

    // Debounced search with cache
    return await api.movies.search(query);
  }

  // Not applicable for movies
  create(): Promise<Movie> {
    throw new Error("Not implemented");
  }

  update(): Promise<Movie> {
    throw new Error("Not implemented");
  }

  delete(): Promise<void> {
    throw new Error("Not implemented");
  }
}

export const movieRepository = new MovieRepository();

// Usage in custom hooks
export const useMovies = (filters: MovieFilters) => {
  return useQuery({
    queryKey: ["movies", filters],
    queryFn: () => movieRepository.findAll(filters),
  });
};
```

### Error Handling Patterns

```typescript
// Comprehensive error handling

// Custom error classes
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class NetworkError extends Error {
  constructor(message: string, public originalError: any) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handler utility
class ErrorHandler {
  handle(error: unknown): { message: string; action?: string } {
    // Network errors
    if (error instanceof NetworkError || (error as any).code === 'ECONNABORTED') {
      return {
        message: 'Network connection lost. Please check your internet.',
        action: 'retry',
      };
    }

    // API errors
    if (error instanceof ApiError) {
      switch (error.statusCode) {
        case 400:
          return {
            message: error.message || 'Invalid request. Please check your input.',
          };
        case 401:
          return {
            message: 'Session expired. Please login again.',
            action: 'login',
          };
        case 403:
          return {
            message: 'You don\'t have permission to perform this action.',
          };
        case 404:
          return {
            message: 'The requested resource was not found.',
          };
        case 409:
          // Seat already locked/booked
          return {
            message: 'These seats are no longer available. Please select different seats.',
            action: 'refresh',
          };
        case 429:
          return {
            message: 'Too many requests. Please try again in a moment.',
            action: 'retry',
          };
        case 500:
        case 502:
        case 503:
          return {
            message: 'Our servers are experiencing issues. Please try again later.',
            action: 'retry',
          };
        default:
          return {
            message: error.message || 'Something went wrong.',
            action: 'retry',
          };
      }
    }

    // Validation errors
    if (error instanceof ValidationError) {
      const firstField = Object.keys(error.fields)[0];
      const firstError = error.fields[firstField]?.[0];
      return {
        message: firstError || 'Please fix the errors in the form.',
      };
    }

    // Unknown errors
    console.error('Unhandled error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
      action: 'retry',
    };
  }

  // Format error for display
  format(error: unknown): UserFacingError {
    const { message, action } = this.handle(error);

    return {
      title: this.getErrorTitle(error),
      message,
      action,
      timestamp: Date.now(),
    };
  }

  private getErrorTitle(error: unknown): string {
    if (error instanceof NetworkError) return 'Connection Error';
    if (error instanceof ValidationError) return 'Validation Error';
    if (error instanceof ApiError && error.statusCode >= 500) return 'Server Error';
    return 'Error';
  }
}

export const errorHandler = new ErrorHandler();

// Error boundary component
export class ErrorBoundary extends React.Component
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error boundary caught:', error, errorInfo);

    // Track in analytics
    trackError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
// Retry utility with exponential backoff

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  shouldRetry: (error, attempt) => {
    // Don't retry client errors (4xx)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    return attempt < 3;
  },
};

async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...defaultRetryConfig, ...config };
  let attempt = 0;
  let delay = cfg.initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      // Check if we should retry
      if (attempt >= cfg.maxAttempts || !cfg.shouldRetry?.(error, attempt)) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * cfg.backoffFactor, cfg.maxDelay);

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      // Notify retry attempt
      cfg.onRetry?.(error, attempt, totalDelay);

      console.log(`Retry attempt ${attempt} after ${totalDelay}ms`);

      // Wait before retrying
      await sleep(totalDelay);
    }
  }
}

// Usage in API client
class ResilientApiClient extends ApiClient {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return withRetry(() => super.get<T>(url, config), {
      onRetry: (error, attempt, delay) => {
        toast.info(`Retrying... (${attempt}/3)`);
      },
    });
  }

  // Critical operations with more aggressive retry
  async createBooking(data: BookingRequest): Promise<BookingResponse> {
    return withRetry(() => super.post<BookingResponse>("/bookings", data), {
      maxAttempts: 5,
      initialDelay: 2000,
      shouldRetry: (error, attempt) => {
        // Retry on network errors and 5xx errors
        if (!error.response) return true;
        if (error.response.status >= 500) return true;
        return false;
      },
    });
  }
}
```

---

## 6. Performance Optimization

### Bundle Optimization

```typescript
// 1. Code Splitting Strategy

// Route-based splitting (automatic with React.lazy)
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("./pages/HomePage"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const SeatSelection = lazy(() => import("./pages/SeatSelection"));
const Checkout = lazy(() => import("./pages/Checkout"));

// Component with loading fallback
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/movie/:id" element={<MovieDetails />} />
    <Route path="/seats/:showId" element={<SeatSelection />} />
    <Route path="/checkout" element={<Checkout />} />
  </Routes>
</Suspense>;

// 2. Dynamic imports for heavy components
const HeavyChart = lazy(
  () => import(/* webpackChunkName: "chart" */ "./components/Chart")
);

// 3. Named exports splitting
const BookingModule = lazy(() =>
  import("./features/booking").then((module) => ({
    default: module.BookingContainer,
  }))
);

// 4. Vendor bundle optimization (webpack config)
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // React vendors
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: "vendor-react",
          priority: 20,
        },
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|framer-motion)[\\/]/,
          name: "vendor-ui",
          priority: 15,
        },
        // Common vendor code
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor-common",
          priority: 10,
        },
        // Shared application code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: "single", // Extract webpack runtime
  },
};

// 5. Tree shaking - import only what you need
// ❌ Bad
import _ from "lodash";
_.debounce(fn, 300);

// ✅ Good
import debounce from "lodash/debounce";
debounce(fn, 300);

// 6. Dynamic import for locale data
const loadLocale = async (locale: string) => {
  const localeData = await import(
    /* webpackChunkName: "locale-[request]" */
    `./locales/${locale}.json`
  );
  return localeData.default;
};
```

**Bundle Size Targets:**

```
Entry Point: app.js
├── app.js (main bundle)              ~150KB gzipped ✓
├── vendor-react.js                   ~80KB gzipped  ✓
├── vendor-ui.js                      ~60KB gzipped  ✓
├── vendor-common.js                  ~50KB gzipped  ✓
└── routes/
    ├── home.[hash].js                ~30KB gzipped  ✓
    ├── movie-details.[hash].js       ~40KB gzipped  ✓
    ├── seat-selection.[hash].js      ~50KB gzipped  ✓
    └── checkout.[hash].js            ~35KB gzipped  ✓

Total Initial Load: ~280KB gzipped
Total JS (all routes): ~495KB gzipped
```

### Rendering Optimization

```typescript
// 1. React.memo for expensive components

interface MovieCardProps {
  movie: Movie;
  onClick: (id: string) => void;
}

// Prevent re-renders unless props change
export const MovieCard = React.memo<MovieCardProps>(
  ({ movie, onClick }) => {
    const handleClick = () => onClick(movie.id);

    return (
      <article onClick={handleClick}>
        <img src={movie.poster} alt={movie.title} loading="lazy" />
        <h3>{movie.title}</h3>
        <Rating value={movie.rating} />
      </article>
    );
  },
  // Custom comparison function
  (prevProps, nextProps) =>
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.movie.rating === nextProps.movie.rating
);

// 2. useMemo for expensive computations
const MovieList = ({ movies, filters }) => {
  // Memoize filtered results
  const filteredMovies = useMemo(() => {
    return movies
      .filter((m) => filters.language.includes(m.language))
      .filter((m) => filters.genre.includes(m.genre))
      .sort((a, b) => b.rating - a.rating);
  }, [movies, filters]); // Only recompute when dependencies change

  return <Grid items={filteredMovies} />;
};

// 3. useCallback for stable function references
const SeatMap = ({ showId }) => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Prevent child re-renders by memoizing callback
  const toggleSeat = useCallback(
    (seatId: string) => {
      setSelectedSeats((prev) =>
        prev.includes(seatId)
          ? prev.filter((id) => id !== seatId)
          : [...prev, seatId]
      );
    },
    [] // No dependencies - stable reference
  );

  return (
    <div>
      {seats.map((seat) => (
        <Seat key={seat.id} seat={seat} onToggle={toggleSeat} />
      ))}
    </div>
  );
};

// 4. Virtualization for long lists
import { useVirtualizer } from "@tanstack/react-virtual";

const TheaterList = ({ theaters }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: theaters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TheaterCard theater={theaters[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. Concurrent rendering with transitions
import { useTransition, useDeferredValue } from "react";

const SearchResults = () => {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Urgent: Update input immediately
    setQuery(value);

    // Non-urgent: Defer expensive search
    startTransition(() => {
      performSearch(value);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleSearch} />
      {isPending && <Spinner />}
      <Results />
    </div>
  );
};

// 6. Debounced search
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Only search when debounced value changes
  const { data } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => api.search(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
};
```

### Network Optimization

```typescript
// 1. Prefetching strategies

// Prefetch on hover
const MovieCard = ({ movie }) => {
  const queryClient = useQueryClient();

  const prefetchDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ["movie", movie.id],
      queryFn: () => api.movies.get(movie.id),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <article onMouseEnter={prefetchDetails} onFocus={prefetchDetails}>
      {/* Card content */}
    </article>
  );
};

// Prefetch next route
const useRouterPrefetch = () => {
  const navigate = useNavigate();

  const prefetchRoute = useCallback((path: string) => {
    // Prefetch route chunk
    const route = routes.find((r) => r.path === path);
    if (route?.component) {
      route.component.preload?.();
    }
  }, []);

  return { navigate, prefetchRoute };
};

// 2. Request deduplication (React Query handles this automatically)
// Multiple components can call same query - only 1 network request
const Component1 = () => {
  const { data } = useQuery(["movie", "123"], fetchMovie);
};
const Component2 = () => {
  const { data } = useQuery(["movie", "123"], fetchMovie); // Deduplicated!
};

// 3. Compression - gzip/brotli (server config)
// nginx.conf
/*
gzip on;
gzip_vary on;
gzip_types text/plain text/css text/xml application/json application/javascript;
gzip_min_length 1000;

# Brotli (better compression)
brotli on;
brotli_types text/plain text/css text/xml application/json application/javascript;
*/

// 4. HTTP/2 Server Push (server config)
// Automatically push critical resources

// 5. Resource hints in HTML
/*
<head>
  <!-- Preconnect to API -->
  <link rel="preconnect" href="https://api.bookmyshow.com" />
  <link rel="dns-prefetch" href="https://api.bookmyshow.com" />
  
  <!-- Preload critical fonts -->
  <link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  
  <!-- Prefetch likely next routes -->
  <link rel="prefetch" href="/movie-details.chunk.js" />
</head>
*/

// 6. Service Worker caching
// service-worker.js
const CACHE_NAME = "bookmyshow-v1";
const urlsToCache = ["/", "/app.js", "/vendor.js", "/styles.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/static/")) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }

  // Network-first for API calls
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```

### Image Optimization

```typescript
// 1. Lazy loading with Intersection Observer
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" } // Start loading 50px before visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      className={isLoaded ? "loaded" : "loading"}
      onLoad={() => setIsLoaded(true)}
      loading="lazy" // Native lazy loading fallback
      {...props}
    />
  );
};

// 2. Responsive images with srcset
const MoviePoster = ({ movie }) => (
  <img
    src={movie.poster.medium}
    srcSet={`
      ${movie.poster.small} 300w,
      ${movie.poster.medium} 600w,
      ${movie.poster.large} 1200w
    `}
    sizes="(max-width: 640px) 300px, (max-width: 1024px) 600px, 1200px"
    alt={movie.title}
    loading="lazy"
  />
);

// 3. Progressive image loading (blur-up)
const ProgressiveImage = ({ placeholder, src, alt }) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setCurrentSrc(src);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        filter: currentSrc === placeholder ? "blur(10px)" : "none",
        transition: "filter 0.3s",
      }}
    />
  );
};

// 4. WebP with fallback
const OptimizedImage = ({ src, alt }) => (
  <picture>
    <source src={`${src}.webp`} type="image/webp" />
    <source src={`${src}.jpg`} type="image/jpeg" />
    <img src={`${src}.jpg`} alt={alt} loading="lazy" />
  </picture>
);

// 5. CDN URL transformation
const getOptimizedImageUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png";
  }
) => {
  const params = new URLSearchParams();

  if (options.width) params.set("w", options.width.toString());
  if (options.height) params.set("h", options.height.toString());
  if (options.quality) params.set("q", options.quality.toString());
  if (options.format) params.set("f", options.format);

  return `${url}?${params.toString()}`;
};

// Usage
<img
  src={getOptimizedImageUrl(movie.poster, {
    width: 600,
    quality: 80,
    format: "webp",
  })}
  alt={movie.title}
/>;
```

### Core Web Vitals Optimization

```typescript
// 1. LCP (Largest Contentful Paint) Optimization

// Preload critical images
/*
<head>
  <link rel="preload" as="image" href="/hero-image.jpg" />
</head>
*/

// Optimize hero image
const HeroSection = () => (
  <section>
    <img
      src="/hero-image.jpg"
      alt="Hero"
      fetchpriority="high" // Priority hint
      decoding="async"
      style={{ contentVisibility: 'auto' }} // CSS containment
    />
  </section>
);

// Font loading optimization
/*
<head>
  <link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  <style>
    @font-face {
      font-family: 'Inter';
      font-display: swap; /* Prevent FOIT */
      src: url('/fonts/inter.woff2') format('woff2');
    }
  </style>
</head>
*/

// 2. FID (First Input Delay) Optimization

// Break up long tasks
const processLargeDataset = async (data: any[]) => {
  const chunks = chunkArray(data, 100);

  for (const chunk of chunks) {
    await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
    processChunk(chunk);
  }
};

// Use Web Workers for heavy computation
const worker = new Worker('/workers/seat-calculation.js');

worker.postMessage({ seats: allSeats, filters });

worker.onmessage = (e) => {
  const filteredSeats = e.data;
  updateUI(filteredSeats);
};

// 3. CLS (Cumulative Layout Shift) Prevention

// Reserve space for images
const MovieCard = ({ movie }) => (
  <article>
    <div
      style={{
        aspectRatio: '2/3',
        backgroundColor: '#f0f0f0',
      }}
    >
      <img
        src={movie.poster}
        alt={movie.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  </article>
);

// Reserve space for dynamic content
const BookingSummary = () => {
  const { data, isLoading } = useBookingQuery();

  return (
    <div style={{ minHeight: '200px' }}> {/* Prevent layout shift */}
      {isLoading ? <Skeleton height={200} /> : <Summary data={data} />}
    </div>
  );
};

// Avoid inserting content above existing content
// Use portal for modals/toasts instead of inline rendering

// 4. Performance monitoring
const reportWebVitals = (metric: Metric) => {
  // Send to analytics
  analytics.track('web-vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });

  // Log warnings for poor metrics
  if (metric.rating === 'poor') {
    console.warn(`Poor ${metric.name}: ${metric.value}`);
  }
};

// Use web-vitals library
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

### Memory Leak Prevention

```typescript
// 1. Cleanup event listeners
const Component = () => {
  useEffect(() => {
    const handleResize = () => {
      // Handle resize
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize); // Cleanup
    };
  }, []);
};

// 2. Clear timers and intervals
const Timer = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      // Update timer
    }, 1000);

    return () => clearInterval(interval); // Cleanup
  }, []);
};

// 3. Cancel pending requests on unmount
const DataFetcher = () => {
  useEffect(() => {
    const abortController = new AbortController();

    fetch("/api/data", { signal: abortController.signal })
      .then((response) => response.json())
      .then((data) => {
        // Handle data
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          console.log("Request cancelled");
        }
      });

    return () => abortController.abort(); // Cancel on unmount
  }, []);
};

// 4. Properly close WebSocket connections
useEffect(() => {
  const ws = new WebSocket("ws://...");

  return () => {
    ws.close(); // Close connection
  };
}, []);

// 5. Avoid closure memory leaks
// ❌ Bad - closures capture large objects
const Bad = () => {
  const largeObject = {
    /* huge data */
  };

  useEffect(() => {
    const handler = () => {
      console.log(largeObject); // Captures entire object
    };

    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [largeObject]); // largeObject in dependency array
};

// ✅ Good - extract only what you need
const Good = () => {
  const largeObject = {
    /* huge data */
  };
  const neededValue = largeObject.someProperty;

  useEffect(() => {
    const handler = () => {
      console.log(neededValue); // Only captures primitive
    };

    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [neededValue]);
};

// 6. Use WeakMap for component references
const componentCache = new WeakMap(); // Automatically garbage collected

// Instead of:
const cache = new Map(); // Prevents garbage collection
```

### Performance Monitoring Setup

```typescript
// 1. Performance observer
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);

    // Send to analytics
    analytics.track("performance", {
      name: entry.name,
      duration: entry.duration,
      entryType: entry.entryType,
    });
  }
});

observer.observe({ entryTypes: ["measure", "navigation", "resource"] });

// 2. Custom performance marks
const measureComponentRender = (componentName: string) => {
  performance.mark(`${componentName}-start`);

  return () => {
    performance.mark(`${componentName}-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-start`,
      `${componentName}-end`
    );
  };
};

// Usage
const ExpensiveComponent = () => {
  const endMeasure = measureComponentRender("ExpensiveComponent");

  useEffect(() => {
    endMeasure();
  }, []);

  return <div>Content</div>;
};

// 3. React Profiler
import { Profiler } from "react";

const onRenderCallback = (
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
  });

  // Track slow renders
  if (actualDuration > 16) {
    analytics.track("slow-render", { id, actualDuration });
  }
};

<Profiler id="SeatMap" onRender={onRenderCallback}>
  <SeatMap />
</Profiler>;

// 4. Bundle analyzer
// webpack.config.js
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      openAnalyzer: false,
      reportFilename: "bundle-report.html",
    }),
  ],
};

// 5. Lighthouse CI
// .github/workflows/lighthouse.yml
/*
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install && npm run build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.bookmyshow.com
            https://staging.bookmyshow.com/movie/123
          budgetPath: ./budget.json
          uploadArtifacts: true
*/
```

---

## 7. Error Handling & Edge Cases

### Error Boundary Implementation

```typescript
// Comprehensive error boundary with recovery

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // Prevent error propagation to parent
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, isolate } = this.props;
    const { errorCount } = this.state;

    // Update error count
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Log error
    console.error('Error Boundary caught:', error, errorInfo);

    // Call custom error handler
    onError?.(error, errorInfo);

    // Send to error tracking service
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorCount: errorCount + 1,
    });

    // Prevent error propagation if isolated
    if (!isolate && errorCount >= 3) {
      // Too many errors, propagate to parent
      throw error;
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Custom fallback UI
      if (fallback) {
        return fallback(error, this.reset);
      }

      // Default fallback
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{error.toString()}</pre>
          </details>
          <button onClick={this.reset}>Try Again</button>
        </div>
      );
    }

    return children;
  }
}

// Usage with custom fallback
<ErrorBoundary
  fallback={(error, reset) => (
    <SeatMapErrorFallback error={error} onRetry={reset} />
  )}
  onError={(error, info) => {
    analytics.track('seat-map-error', { error: error.message });
  }}
  isolate
>
  <SeatMap />
</ErrorBoundary>
```

### Graceful Degradation Strategies

```typescript
// 1. Feature detection and fallbacks

const useSeatMapFeatures = () => {
  const [features, setFeatures] = useState({
    webSocket: false,
    intersectionObserver: false,
    webWorker: false,
  });

  useEffect(() => {
    setFeatures({
      webSocket: "WebSocket" in window,
      intersectionObserver: "IntersectionObserver" in window,
      webWorker: "Worker" in window,
    });
  }, []);

  return features;
};

// Component with degradation
const SeatMap = ({ showId }) => {
  const features = useSeatMapFeatures();

  // WebSocket → Polling → Static
  const seatUpdates = features.webSocket
    ? useWebSocketSeats(showId)
    : usePollingSeats(showId);

  // Virtualization → Regular rendering
  const SeatGrid = features.intersectionObserver
    ? VirtualizedSeatGrid
    : StandardSeatGrid;

  return <SeatGrid seats={seatUpdates} />;
};

// 2. Progressive enhancement for payments

const PaymentSection = () => {
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "fallback">(
    "razorpay"
  );

  const handlePayment = async () => {
    try {
      // Try modern payment gateway
      await razorpay.open({
        // config
      });
    } catch (error) {
      // Fallback to traditional form
      setPaymentMethod("fallback");
      toast.info("Using alternative payment method");
    }
  };

  return (
    <div>
      {paymentMethod === "razorpay" ? (
        <RazorpayButton onClick={handlePayment} />
      ) : (
        <TraditionalPaymentForm />
      )}
    </div>
  );
};

// 3. Reduced motion support

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
};

// Usage
const AnimatedComponent = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      Content
    </motion.div>
  );
};
```

### Offline Support

```typescript
// 1. Service Worker for offline functionality

// service-worker.js
const CACHE_NAME = "bookmyshow-offline-v1";
const OFFLINE_URL = "/offline.html";

// Install event - cache offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        "/app.js",
        "/vendor.js",
        "/styles.css",
        "/offline-ticket-icon.svg",
      ]);
    })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// 2. IndexedDB for offline ticket storage

import { openDB, DBSchema } from "idb";

interface TicketDB extends DBSchema {
  tickets: {
    key: string;
    value: {
      id: string;
      movieName: string;
      showtime: string;
      seats: string[];
      qrCode: string;
      bookingDate: string;
    };
    indexes: { "by-date": string };
  };
}

const db = await openDB<TicketDB>("bookmyshow-tickets", 1, {
  upgrade(db) {
    const store = db.createObjectStore("tickets", { keyPath: "id" });
    store.createIndex("by-date", "bookingDate");
  },
});

// Store ticket offline
export const storeTicketOffline = async (ticket: Ticket) => {
  await db.put("tickets", {
    id: ticket.id,
    movieName: ticket.movieName,
    showtime: ticket.showtime,
    seats: ticket.seats,
    qrCode: ticket.qrCode,
    bookingDate: ticket.bookingDate,
  });
};

// Retrieve offline tickets
export const getOfflineTickets = async () => {
  return await db.getAll("tickets");
};

// 3. Online/Offline detection

const useOnlineStatus = () => {
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

  return isOnline;
};

// Component with offline state
const BookingPage = () => {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <OfflineMode>
        <p>You're currently offline</p>
        <OfflineTicketsList />
      </OfflineMode>
    );
  }

  return <OnlineBookingFlow />;
};

// 4. Background sync for failed requests

// service-worker.js
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-bookings") {
    event.waitUntil(syncPendingBookings());
  }
});

async function syncPendingBookings() {
  const pendingBookings = await getPendingBookings();

  for (const booking of pendingBookings) {
    try {
      await fetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(booking),
      });
      await removePendingBooking(booking.id);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}

// Register sync from client
if ("serviceWorker" in navigator && "SyncManager" in window) {
  navigator.serviceWorker.ready.then((registration) => {
    return registration.sync.register("sync-bookings");
  });
}
```

### Network Failure Handling

```typescript
// 1. Timeout handling

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new NetworkError("Request timeout", error);
    }
    throw error;
  }
};

// 2. Network quality detection

const useNetworkQuality = () => {
  const [quality, setQuality] = useState<"fast" | "slow" | "offline">("fast");

  useEffect(() => {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      const updateQuality = () => {
        const effectiveType = connection.effectiveType;

        if (!navigator.onLine) {
          setQuality("offline");
        } else if (effectiveType === "4g") {
          setQuality("fast");
        } else {
          setQuality("slow");
        }
      };

      updateQuality();
      connection.addEventListener("change", updateQuality);

      return () => connection.removeEventListener("change", updateQuality);
    }
  }, []);

  return quality;
};

// Adjust behavior based on network quality
const MovieList = () => {
  const networkQuality = useNetworkQuality();

  // Load lower quality images on slow network
  const imageQuality = networkQuality === "slow" ? 50 : 80;

  // Reduce prefetching on slow network
  const prefetchCount = networkQuality === "fast" ? 10 : 3;

  return <Grid imageQuality={imageQuality} prefetchCount={prefetchCount} />;
};

// 3. Request queue for offline scenarios

class RequestQueue {
  private queue: Array<{
    id: string;
    request: () => Promise<any>;
    timestamp: number;
  }> = [];

  add(id: string, request: () => Promise<any>) {
    this.queue.push({ id, request, timestamp: Date.now() });
    this.saveToStorage();
  }

  async process() {
    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await item.request();
        this.queue.shift();
        this.saveToStorage();
      } catch (error) {
        console.error("Failed to process queued request:", error);
        break; // Stop processing on error
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem("request-queue", JSON.stringify(this.queue));
  }

  restore() {
    const saved = localStorage.getItem("request-queue");
    if (saved) {
      this.queue = JSON.parse(saved);
    }
  }
}

const requestQueue = new RequestQueue();

// Usage
window.addEventListener("online", () => {
  requestQueue.process();
});
```

### Race Condition Prevention

```typescript
// 1. Request deduplication with abort controller

const useDeduplicatedQuery = <T>(key: string, queryFn: () => Promise<T>) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      // Abort previous request
      abortControllerRef.current?.abort();

      // Create new abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        return await queryFn();
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request aborted");
        }
        throw error;
      }
    },
  });
};

// 2. Seat selection race condition handling

const useSeatSelection = (showId: string) => {
  const queryClient = useQueryClient();
  const [pendingSeats, setPendingSeats] = useState<Set<string>>(new Set());

  const selectSeat = useMutation({
    mutationFn: async (seatId: string) => {
      // Check if already pending
      if (pendingSeats.has(seatId)) {
        throw new Error("Selection already in progress");
      }

      // Mark as pending
      setPendingSeats((prev) => new Set(prev).add(seatId));

      try {
        return await api.seats.lock(showId, [seatId]);
      } finally {
        // Remove from pending
        setPendingSeats((prev) => {
          const next = new Set(prev);
          next.delete(seatId);
          return next;
        });
      }
    },

    onSuccess: (data, seatId) => {
      // Update only if our request succeeded
      queryClient.setQueryData<SeatStatus[]>(["seats", showId], (old) =>
        old?.map((seat) =>
          seat.id === seatId && data.lockedBy === "me"
            ? { ...seat, status: "LOCKED" }
            : seat
        )
      );
    },

    onError: (error, seatId) => {
      // Seat was locked by someone else
      if (error.code === "SEAT_ALREADY_LOCKED") {
        // Refetch to get latest state
        queryClient.invalidateQueries(["seats", showId]);
      }
    },
  });

  return selectSeat;
};

// 3. Optimistic update version checking

interface VersionedState<T> {
  data: T;
  version: number;
}

const useVersionedState = <T>(initialData: T) => {
  const [state, setState] = useState<VersionedState<T>>({
    data: initialData,
    version: 0,
  });

  const updateState = useCallback(
    (updater: (prev: T) => T, expectedVersion?: number) => {
      setState((prev) => {
        // Version check
        if (expectedVersion !== undefined && prev.version !== expectedVersion) {
          console.warn("Version mismatch, update rejected");
          return prev;
        }

        return {
          data: updater(prev.data),
          version: prev.version + 1,
        };
      });
    },
    []
  );

  return [state, updateState] as const;
};
```

### Form Validation Patterns

```typescript
// 1. Comprehensive form validation with react-hook-form + zod

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Schema definition
const checkoutSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),

  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[0-9]{10}$/, "Must be 10 digits"),

  promoCode: z
    .string()
    .optional()
    .refine(
      async (code) => {
        if (!code) return true;
        const isValid = await api.validatePromo(code);
        return isValid;
      },
      { message: "Invalid promo code" }
    ),

  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept terms and conditions",
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Form component
const CheckoutForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    watch,
    setError,
    clearErrors,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur", // Validate on blur
    defaultValues: {
      email: "",
      phone: "",
      promoCode: "",
      termsAccepted: false,
    },
  });

  // Watch for changes
  const promoCode = watch("promoCode");

  // Debounced promo validation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (promoCode && promoCode.length > 3) {
        try {
          const isValid = await api.validatePromo(promoCode);
          if (!isValid) {
            setError("promoCode", {
              type: "manual",
              message: "Invalid promo code",
            });
          } else {
            clearErrors("promoCode");
          }
        } catch (error) {
          // Ignore validation errors during typing
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [promoCode, setError, clearErrors]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      await api.createBooking(data);
      toast.success("Booking confirmed!");
    } catch (error) {
      if (error.code === "SEATS_NO_LONGER_AVAILABLE") {
        setError("root", {
          type: "manual",
          message: "Selected seats are no longer available",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register("email")}
          type="email"
          placeholder="Email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <input
          {...register("phone")}
          type="tel"
          placeholder="Phone"
          aria-invalid={!!errors.phone}
        />
        {errors.phone && <span role="alert">{errors.phone.message}</span>}
      </div>

      <div>
        <input {...register("promoCode")} placeholder="Promo code (optional)" />
        {errors.promoCode && (
          <span role="alert">{errors.promoCode.message}</span>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register("termsAccepted")} />I accept terms
          and conditions
        </label>
        {errors.termsAccepted && (
          <span role="alert">{errors.termsAccepted.message}</span>
        )}
      </div>

      {errors.root && <div role="alert">{errors.root.message}</div>}

      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Processing..." : "Complete Booking"}
      </button>
    </form>
  );
};

// 2. Custom validation hook

const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = async (data: T): Promise<boolean> => {
    try {
      await schema.parseAsync(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.reduce((acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>);

        setErrors(fieldErrors);
      }
      return false;
    }
  };

  return { errors, validate };
};
```

---

## 8. Testing Strategy

### Unit Testing

```typescript
// 1. Component unit tests with React Testing Library

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MovieCard } from "./MovieCard";

describe("MovieCard", () => {
  const mockMovie = {
    id: "123",
    title: "Inception",
    poster: "/poster.jpg",
    rating: 8.8,
    languages: ["English", "Hindi"],
  };

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("renders movie information correctly", () => {
    render(<MovieCard movie={mockMovie} onClick={jest.fn()} />);

    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("8.8")).toBeInTheDocument();
    expect(screen.getByAltText("Inception")).toHaveAttribute(
      "src",
      "/poster.jpg"
    );
  });

  it("calls onClick with movie id when clicked", async () => {
    const handleClick = jest.fn();
    render(<MovieCard movie={mockMovie} onClick={handleClick} />);

    const card = screen.getByRole("article");
    await userEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith("123");
  });

  it("prefetches movie details on hover", async () => {
    const { container } = render(
      <MovieCard movie={mockMovie} onClick={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(card);

    // Verify prefetch was triggered
    await waitFor(() => {
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    });
  });
});

// 2. Hook testing

import { renderHook, waitFor } from "@testing-library/react";
import { useBookingStore } from "./useBookingStore";

describe("useBookingStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useBookingStore.getState().resetBooking();
  });

  it("toggles seat selection", () => {
    const { result } = renderHook(() => useBookingStore());

    expect(result.current.selectedSeats).toEqual([]);

    // Select seat
    result.current.toggleSeat("A1");
    expect(result.current.selectedSeats).toEqual(["A1"]);

    // Deselect seat
    result.current.toggleSeat("A1");
    expect(result.current.selectedSeats).toEqual([]);
  });

  it("enforces max 10 seats limit", () => {
    const { result } = renderHook(() => useBookingStore());

    // Try to select 11 seats
    for (let i = 1; i <= 11; i++) {
      result.current.toggleSeat(`A${i}`);
    }

    expect(result.current.selectedSeats).toHaveLength(10);
  });

  it("calculates total price correctly", () => {
    const { result } = renderHook(() => useBookingStore());

    result.current.toggleSeat("A1"); // Assume ₹200
    result.current.toggleSeat("A2"); // Assume ₹200
    result.current.addFoodItem({ id: "F1", price: 150, quantity: 2 });

    expect(result.current.totalPrice()).toBe(200 * 2 + 150 * 2); // 700
  });
});

// 3. Utility function testing

import { formatCurrency, formatDate, calculateDiscount } from "./utils";

describe("Utility functions", () => {
  describe("formatCurrency", () => {
    it("formats INR correctly", () => {
      expect(formatCurrency(1000)).toBe("₹1,000");
      expect(formatCurrency(1234.56)).toBe("₹1,234.56");
    });
  });

  describe("formatDate", () => {
    it("formats date correctly", () => {
      const date = new Date("2024-03-15");
      expect(formatDate(date)).toBe("Mar 15, 2024");
    });
  });

  describe("calculateDiscount", () => {
    it("calculates percentage discount", () => {
      expect(calculateDiscount(1000, 10)).toBe(100);
      expect(calculateDiscount(1000, 25)).toBe(250);
    });

    it("handles edge cases", () => {
      expect(calculateDiscount(0, 10)).toBe(0);
      expect(calculateDiscount(1000, 0)).toBe(0);
    });
  });
});
```

### Integration Testing

```typescript
// Integration tests for booking flow

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { App } from "./App";

// Mock API server
const server = setupServer(
  rest.get("/api/movies/:id", (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        title: "Inception",
        showtimes: ["10:00 AM", "2:00 PM", "6:00 PM"],
      })
    );
  }),

  rest.get("/api/seats/:showId", (req, res, ctx) => {
    return res(
      ctx.json({
        layout: mockSeatLayout,
        status: mockSeatStatus,
      })
    );
  }),

  rest.post("/api/seats/:showId/lock", (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        expiresAt: Date.now() + 600000, // 10 minutes
      })
    );
  }),

  rest.post("/api/bookings", (req, res, ctx) => {
    return res(
      ctx.json({
        bookingId: "B123",
        status: "CONFIRMED",
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Booking Flow Integration", () => {
  it("completes full booking flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Select movie
    await waitFor(() => {
      expect(screen.getByText("Inception")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Inception"));

    // 2. Select showtime
    await waitFor(() => {
      expect(screen.getByText("2:00 PM")).toBeInTheDocument();
    });

    await user.click(screen.getByText("2:00 PM"));

    // 3. Select seats
    await waitFor(() => {
      expect(screen.getByLabelText(/Seat A1/)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/Seat A1/));
    await user.click(screen.getByLabelText(/Seat A2/));

    // Verify seats selected
    expect(screen.getByText("2 seats selected")).toBeInTheDocument();

    // 4. Proceed to checkout
    await user.click(screen.getByText("Proceed"));

    // 5. Fill checkout form
    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Phone"), "9876543210");
    await user.click(screen.getByLabelText(/I accept terms/));

    // 6. Complete booking
    await user.click(screen.getByText("Complete Booking"));

    // 7. Verify confirmation
    await waitFor(() => {
      expect(screen.getByText(/Booking Confirmed/)).toBeInTheDocument();
      expect(screen.getByText("B123")).toBeInTheDocument();
    });
  });

  it("handles seat unavailability during booking", async () => {
    const user = userEvent.setup();

    // Override seat lock to fail
    server.use(
      rest.post("/api/seats/:showId/lock", (req, res, ctx) => {
        return res(
          ctx.status(409),
          ctx.json({
            error: "SEAT_ALREADY_LOCKED",
            message: "Seats no longer available",
          })
        );
      })
    );

    render(<App />);

    // Navigate to seat selection
    await user.click(screen.getByText("Inception"));
    await user.click(screen.getByText("2:00 PM"));

    // Try to select seat
    await user.click(screen.getByLabelText(/Seat A1/));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Seats no longer available/)).toBeInTheDocument();
    });
  });
});
```

### E2E Testing

```typescript
// Playwright E2E tests

import { test, expect } from "@playwright/test";

test.describe("Booking Flow E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("complete booking flow", async ({ page }) => {
    // 1. Search for movie
    await page.fill('[placeholder="Search movies"]', "Inception");
    await page.keyboard.press("Enter");

    // 2. Select movie
    await page.click("text=Inception");

    // 3. Select date
    await page.click('[data-testid="date-tomorrow"]');

    // 4. Select theater and showtime
    await page.click("text=PVR Cinemas");
    await page.click("text=2:00 PM");

    // 5. Select seats
    await page.click('[data-seat-id="A1"]');
    await page.click('[data-seat-id="A2"]');

    // Verify seat selection
    await expect(page.locator("text=2 seats selected")).toBeVisible();

    // 6. Proceed to payment
    await page.click("text=Proceed");

    // 7. Fill contact details
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="phone"]', "9876543210");
    await page.check('[name="termsAccepted"]');

    // 8. Mock payment (intercept payment gateway)
    await page.route("**/api/payments/**", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, transactionId: "TXN123" }),
      });
    });

    await page.click("text=Pay ₹400");

    // 9. Verify confirmation
    await expect(page.locator("text=Booking Confirmed")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });

  test("seat timer expires and releases seats", async ({ page }) => {
    // Select seats
    await page.click("text=Inception");
    await page.click("text=2:00 PM");
    await page.click('[data-seat-id="A1"]');

    // Verify timer started
    await expect(page.locator('[data-testid="timer"]')).toContainText("9:");

    // Wait for timer to expire (mock fast-forward)
    await page.evaluate(() => {
      window.localStorage.setItem(
        "seat-lock-expires",
        String(Date.now() - 1000)
      );
    });

    await page.reload();

    // Verify seats released
    await expect(page.locator('[data-seat-id="A1"]')).not.toHaveClass(
      /selected/
    );
  });

  test("handles network errors gracefully", async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    await page.click("text=Inception");

    // Verify offline message
    await expect(page.locator("text=No internet connection")).toBeVisible();

    // Go online
    await context.setOffline(false);

    // Verify content loads
    await expect(page.locator("text=Inception")).toBeVisible();
  });
});

// Visual regression test
test("visual regression - seat map", async ({ page }) => {
  await page.goto("http://localhost:3000/seats/show123");

  await page.waitForSelector('[data-testid="seat-map"]');

  await expect(page).toHaveScreenshot("seat-map.png", {
    fullPage: false,
  });
});

// Performance test
test("performance - homepage loads in < 3s", async ({ page }) => {
  const startTime = Date.now();

  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");

  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000);
});
```

### Performance Testing

```typescript
// Lighthouse CI configuration

// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/movie/123',
        'http://localhost:3000/seats/show123',
      ],
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Bundle size
        'total-byte-weight': ['error', { maxNumericValue: 500000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

// Bundle size monitoring
// package.json
{
  "scripts": {
    "analyze": "source-map-explorer 'build/static/js/*.js'",
    "bundle-watch": "bundlewatch"
  },
  "bundlewatch": {
    "files": [
      {
        "path": "build/static/js/main.*.js",
        "maxSize": "150kb"
      },
      {
        "path": "build/static/js/vendor-*.js",
        "maxSize": "200kb"
      }
    ]
  }
}
```

### Accessibility Testing

```typescript
// 1. Automated a11y testing with jest-axe

import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { SeatMap } from "./SeatMap";

expect.extend(toHaveNoViolations);

describe("SeatMap Accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<SeatMap showId="123" />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("has proper ARIA labels", () => {
    const { getByRole } = render(<SeatMap showId="123" />);

    expect(getByRole("grid", { name: "Seat selection" })).toBeInTheDocument();
  });

  it("supports keyboard navigation", async () => {
    const { getByLabelText } = render(<SeatMap showId="123" />);
    const seat = getByLabelText(/Seat A1/);

    // Tab to seat
    seat.focus();
    expect(document.activeElement).toBe(seat);

    // Press space to select
    fireEvent.keyDown(seat, { key: " " });
    expect(seat).toHaveAttribute("aria-pressed", "true");
  });
});

// 2. Playwright accessibility testing

test("seat map is accessible", async ({ page }) => {
  await page.goto("http://localhost:3000/seats/show123");

  // Run accessibility scan
  const accessibilityScanResults = await page.accessibility.snapshot();

  // Verify keyboard navigation
  await page.keyboard.press("Tab");
  const focusedElement = await page.evaluate(
    () => document.activeElement?.tagName
  );
  expect(focusedElement).toBe("BUTTON");

  // Verify screen reader text
  const ariaLabel = await page.getAttribute(
    '[data-seat-id="A1"]',
    "aria-label"
  );
  expect(ariaLabel).toContain("Seat A1");
});
```

---

## 9. Security Considerations

### XSS Prevention

```typescript
// 1. Input sanitization

import DOMPurify from "dompurify";

// Sanitize user-generated content
const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
    ALLOWED_ATTR: ["href"],
  });
};

// Usage in component
const ReviewDisplay = ({ review }) => (
  <div
    dangerouslySetInnerHTML={{
      __html: sanitizeHTML(review.content),
    }}
  />
);

// 2. Escape user input in URLs

const buildMovieUrl = (movieName: string) => {
  // ❌ Vulnerable
  // return `/movie/${movieName}`;

  // ✅ Safe
  return `/movie/${encodeURIComponent(movieName)}`;
};

// 3. Content Security Policy (CSP)

// public/index.html
/*
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' https://cdn.bookmyshow.com data:;
    connect-src 'self' https://api.bookmyshow.com wss://ws.bookmyshow.com;
    font-src 'self' data:;
    frame-src https://payments.razorpay.com;
  "
/>
*/

// 4. Validate and sanitize all inputs

const validatePromoCode = (code: string): boolean => {
  // Only allow alphanumeric
  const regex = /^[A-Z0-9]{4,10}$/;
  return regex.test(code);
};

const PromoCodeInput = () => {
  const [code, setCode] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();

    // Strip non-alphanumeric
    const sanitized = value.replace(/[^A-Z0-9]/g, "");

    setCode(sanitized);
  };

  return <input value={code} onChange={handleChange} maxLength={10} />;
};
```

### CSRF Protection

```typescript
// 1. CSRF token management

let csrfToken: string | null = null;

export const getCsrfToken = (): string => {
  if (!csrfToken) {
    // Get token from meta tag (set by server)
    const meta = document.querySelector('meta[name="csrf-token"]');
    csrfToken = meta?.getAttribute("content") || "";
  }
  return csrfToken;
};

export const refreshCsrfToken = async (): Promise<void> => {
  const response = await fetch("/api/csrf-token");
  const { token } = await response.json();
  csrfToken = token;

  // Update meta tag
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) {
    meta.setAttribute("content", token);
  }
};

// 2. Include CSRF token in all mutations

const createBookingMutation = useMutation({
  mutationFn: async (data: BookingRequest) => {
    return await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken(),
      },
      body: JSON.stringify(data),
      credentials: "include", // Send cookies
    });
  },
});

// 3. SameSite cookie configuration (server-side)

/*
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
Set-Cookie: csrf=xyz789; SameSite=Strict; Secure
*/
```

### Secure Storage

```typescript
// 1. Token storage strategy

class SecureTokenStorage {
  // Access token in memory (XSS safe)
  private accessToken: string | null = null;

  // Refresh token in httpOnly cookie (set by server)

  setAccessToken(token: string) {
    this.accessToken = token;

    // Optional: Encrypt before storing in sessionStorage for tab recovery
    const encrypted = this.encrypt(token);
    sessionStorage.setItem("_at", encrypted);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      // Try to recover from sessionStorage
      const encrypted = sessionStorage.getItem("_at");
      if (encrypted) {
        this.accessToken = this.decrypt(encrypted);
      }
    }
    return this.accessToken;
  }

  clear() {
    this.accessToken = null;
    sessionStorage.removeItem("_at");
  }

  private encrypt(data: string): string {
    // Simple XOR with random key (stored in memory)
    // In production, use Web Crypto API
    return btoa(data);
  }

  private decrypt(encrypted: string): string {
    return atob(encrypted);
  }
}

export const tokenStorage = new SecureTokenStorage();

// 2. Never store sensitive data in localStorage

// ❌ DON'T
localStorage.setItem("creditCard", cardNumber);
localStorage.setItem("password", password);

// ✅ DO
// - Use memory for access tokens
// - Use httpOnly cookies for refresh tokens
// - Use encrypted sessionStorage as fallback
// - Never store payment info client-side

// 3. Clear sensitive data on logout

const handleLogout = () => {
  // Clear tokens
  tokenStorage.clear();

  // Clear sensitive state
  useBookingStore.getState().resetBooking();
  queryClient.clear();

  // Clear sessionStorage
  sessionStorage.clear();

  // Redirect
  window.location.href = "/login";
};
```

### Input Sanitization

```typescript
// 1. Comprehensive input validation

const sanitizeInput = {
  // Email
  email: (input: string): string => {
    return input.trim().toLowerCase().slice(0, 254);
  },

  // Phone
  phone: (input: string): string => {
    return input.replace(/[^0-9]/g, "").slice(0, 10);
  },

  // Name
  name: (input: string): string => {
    return input
      .trim()
      .replace(/[^a-zA-Z\s]/g, "")
      .slice(0, 100);
  },

  // Promo code
  promoCode: (input: string): string => {
    return input
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
  },

  // Review/comment
  comment: (input: string): string => {
    return DOMPurify.sanitize(input.trim().slice(0, 500));
  },
};

// 2. Type-safe form data

interface ContactFormData {
  email: string;
  phone: string;
  name: string;
}

const sanitizeFormData = (data: ContactFormData): ContactFormData => {
  return {
    email: sanitizeInput.email(data.email),
    phone: sanitizeInput.phone(data.phone),
    name: sanitizeInput.name(data.name),
  };
};

// 3. SQL injection prevention (server-side)

// ❌ Vulnerable
// const query = `SELECT * FROM bookings WHERE userId = '${userId}'`;

// ✅ Safe - use parameterized queries
// const query = 'SELECT * FROM bookings WHERE userId = ?';
// db.execute(query, [userId]);

// Frontend: Validate all IDs
const isValidId = (id: string): boolean => {
  return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 36;
};

const fetchBooking = async (bookingId: string) => {
  if (!isValidId(bookingId)) {
    throw new Error("Invalid booking ID");
  }

  return await api.get(`/bookings/${bookingId}`);
};
```

---

## 10. Interview Cross-Questions

### System Design Questions

**Q1: How would you handle 100K concurrent users trying to book seats for the same show?**

**Answer:**

````
1. **Architecture:**
   - WebSocket for real-time updates (50K connections per instance)
   - Load balancer distributing across multiple WS servers
   - Redis pub/sub for cross-server seat updates
   - Rate limiting: 10 seat locks per minute per user

2. **Seat Locking Strategy:**
   - Optimistic locking on client (instant feedback)
   - Server-side validation (source of truth)
   - Lock expiry: 10 minutes with countdown timer
   - Background job to release expired locks

3. **Caching:**
   - Seat layout cached (rarely changes)
   - Seat status: Short TTL (5s) + WebSocket updates
   - CDN for static assets

4. **Database:**
   - Sharding by showId (distribute load)
   - Read replicas for seat status queries
   - Write to master for seat locks (serializable isolation)

5. **Fallback:**
   - WebSocket → Long polling → Regular polling
   - Queue system for peak load (virtual waiting room)

Code example:
```typescript
// Rate limiting middleware
const seatLockLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 locks per minute
  keyGenerator: (req) => req.user.id,
});

// Seat locking with distributed lock
const lockSeats = async (showId, seatIds, userId) => {
  const lockKey = `show:${showId}:lock`;

  // Distributed lock (Redis)
  const lock = await redlock.lock(lockKey, 1000);

  try {
    // Check availability
    const seats = await db.query(
      'SELECT * FROM seats WHERE showId = ? AND id IN (?) FOR UPDATE',
      [showId, seatIds]
    );

    const unavailable = seats.filter(s => s.status !== 'AVAILABLE');
    if (unavailable.length > 0) {
      throw new Error('Seats no longer available');
    }

    // Lock seats
    await db.query(
      'UPDATE seats SET status = ?, lockedBy = ?, expiresAt = ? WHERE id IN (?)',
      ['LOCKED', userId, Date.now() + 600000, seatIds]
    );

    // Publish update via Redis
    await redis.publish('seat-updates', {
      showId,
      seatIds,
      status: 'LOCKED',
      userId,
    });

    return { success: true };
  } finally {
    await lock.unlock();
  }
};
````

---

**Q2: How do you prevent race conditions when multiple users select the same seat?**

**Answer:**
Layered approach:

1. **Frontend Optimistic Locking:**

```typescript
const selectSeat = async (seatId: string) => {
  // Immediately mark as "pending"
  updateUI(seatId, "PENDING");

  try {
    const response = await api.lockSeat(seatId);

    if (response.success) {
      updateUI(seatId, "LOCKED");
    } else {
      // Already locked by someone else
      updateUI(seatId, "UNAVAILABLE");
      toast.error("Seat already taken");
    }
  } catch (error) {
    // Rollback
    updateUI(seatId, "AVAILABLE");
  }
};
```

2. **Backend Pessimistic Locking:**

```sql
BEGIN TRANSACTION;

-- Lock row for update (prevents concurrent modifications)
SELECT * FROM seats
WHERE id = 'A1' AND showId = 'show123'
FOR UPDATE;

-- Check availability
IF status = 'AVAILABLE' THEN
  UPDATE seats SET status = 'LOCKED', lockedBy = 'user123'
  WHERE id = 'A1';
  COMMIT;
ELSE
  ROLLBACK;
  RETURN error 'Seat unavailable';
END IF;
```

3. **Idempotency:**

```typescript
// Generate idempotency key
const idempotencyKey = `${userId}-${showId}-${seatId}-${timestamp}`;

// Server checks for duplicate requests
const existing = await redis.get(`lock:${idempotencyKey}`);
if (existing) {
  return existing; // Return cached response
}

// Process and cache
const result = await lockSeat(seatId);
await redis.setex(`lock:${idempotencyKey}`, 300, result);
```

---

**Q3: How would you optimize the initial load time of the homepage to < 2 seconds?**

**Answer:**

**Measurement First:**

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getLCP } from "web-vitals";

getCLS(({ value }) => {
  if (value > 0.1) {
    analytics.track("cls-warning", { value });
  }
});
```

**Optimization Strategy:**

1. **Critical Path Optimization:**

```
<head>
  <!-- Preconnect to API -->
  <link rel="preconnect" href="https://api.bookmyshow.com" />

  <!-- Preload hero image -->
  <link rel="preload" as="image" href="/hero.jpg" />

  <!-- Preload critical font -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin />

  <!-- Inline critical CSS -->
  <style>
    /* Above-the-fold styles */
  </style>
</head>
```

2. **Code Splitting:**

```typescript
// Route-based
const HomePage = lazy(() => import("./pages/HomePage"));

// Component-based
const HeavyCarousel = lazy(
  () => import(/* webpackChunkName: "carousel" */ "./Carousel")
);
```

3. **Image Optimization:**

```typescript
// Use next-gen formats
<picture>
  <source srcSet="/hero.webp" type="image/webp" />
  <img src="/hero.jpg" loading="lazy" />
</picture>

// Lazy load below-the-fold images
<img
  src="data:image/svg+xml,..." // Placeholder
  data-src="/movie-poster.jpg"
  loading="lazy"
/>
```

4. **API Optimization:**

```typescript
// Parallel data fetching
const HomePage = () => {
  const [trendingMovies, upcomingMovies, eventsData] = useQueries([
    { queryKey: ["trending"], queryFn: fetchTrending },
    { queryKey: ["upcoming"], queryFn: fetchUpcoming },
    { queryKey: ["events"], queryFn: fetchEvents },
  ]);

  // Show skeleton until critical data loads
  if (!trendingMovies.data) return <Skeleton />;

  // Lazy render non-critical sections
  return (
    <>
      <TrendingSection data={trendingMovies.data} />
      <Suspense fallback={null}>
        <UpcomingSection data={upcomingMovies.data} />
      </Suspense>
    </>
  );
};
```

5. **Bundle Optimization:**

```javascript
// webpack.config.js
optimization: {
  splitChunks: {
    chunks: 'all',
    maxSize: 200000, // 200KB max chunk
  },
  usedExports: true, // Tree shaking
}
```

**Target Budget:**

- FCP: < 1.5s
- LCP: < 2.5s
- TTI: < 3.5s
- Total JS: < 300KB gzipped

---

### Performance Questions

**Q4: How do you handle memory leaks in a React application?**

**Answer:**

**Common Causes:**

1. Event listeners not cleaned up
2. Timers/intervals not cleared
3. Subscriptions not unsubscribed
4. Large closures in useEffect

**Detection:**

```typescript
// Chrome DevTools Memory Profiler
// 1. Take heap snapshot
// 2. Perform actions
// 3. Take another snapshot
// 4. Compare - look for "Detached DOM tree"

// React DevTools Profiler
<Profiler id="SeatMap" onRender={onRenderCallback}>
  <SeatMap />
</Profiler>
```

**Prevention:**

```typescript
// 1. Cleanup event listeners
useEffect(() => {
  const handleResize = () => {
    /* ... */
  };
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

// 2. Clear timers
useEffect(() => {
  const timer = setInterval(() => {
    /* ... */
  }, 1000);
  return () => clearInterval(timer);
}, []);

// 3. Cancel API requests
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal }).then(/* ... */);

  return () => controller.abort();
}, []);

// 4. Unsubscribe from observables
useEffect(() => {
  const subscription = observable.subscribe(/* ... */);
  return () => subscription.unsubscribe();
}, []);

// 5. Proper WebSocket cleanup
useEffect(() => {
  const ws = new WebSocket("ws://...");

  ws.onmessage = (event) => {
    // Handle message
  };

  return () => {
    ws.close();
    ws.onmessage = null; // Clear handler
  };
}, []);

// 6. Weak references for caches
const cache = new WeakMap(); // Auto GC'd
// vs
const cache = new Map(); // Prevents GC

// 7. Avoid large closures
// ❌ Bad
useEffect(() => {
  const largeData = fetchLargeData();
  const handler = () => console.log(largeData); // Captures all
}, []);

// ✅ Good
useEffect(() => {
  const largeData = fetchLargeData();
  const needed = largeData.id; // Extract only what's needed
  const handler = () => console.log(needed);
}, []);
```

**Monitoring:**

```typescript
// Performance observer for memory
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === "memory") {
      const memoryMB = entry.usedJSHeapSize / 1048576;

      if (memoryMB > 100) {
        console.warn("High memory usage:", memoryMB, "MB");
        analytics.track("memory-warning", { memoryMB });
      }
    }
  }
});
```

---

**Q5: Explain your caching strategy for movies vs seat availability.**

**Answer:**

**Different Data = Different Strategies:**

**Movies (Relatively Static):**

```typescript
// Long cache time (30 minutes)
const useMovies = () => {
  return useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
    staleTime: 30 * 60 * 1000, // 30 min
    cacheTime: 60 * 60 * 1000, // 1 hour

    // Only refetch on window focus if stale
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });
};

// Cache hierarchy:
// 1. React Query cache (memory) - 30 min fresh
// 2. Service Worker cache - 24 hours
// 3. CDN cache - 1 hour
```

**Seat Availability (Highly Dynamic):**

```typescript
// Short cache time (5 seconds)
const useSeats = (showId: string) => {
  return useQuery({
    queryKey: ["seats", showId],
    queryFn: () => fetchSeats(showId),
    staleTime: 5 * 1000, // 5 seconds
    cacheTime: 5 * 60 * 1000, // 5 min

    // Aggressive refetching
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Poll every 5s when focused
    refetchIntervalInBackground: false,
  });
};

// WebSocket for real-time updates
useEffect(() => {
  const ws = new WebSocket(`/seats/${showId}`);

  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);

    // Optimistically update cache
    queryClient.setQueryData(["seats", showId], (old) =>
      updateSeats(old, update)
    );
  };
}, [showId]);
```

**Hybrid: Movie Details (Semi-Static):**

```typescript
// Medium cache time
const useMovieDetails = (movieId: string) => {
  return useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => fetchMovie(movieId),
    staleTime: 10 * 60 * 1000, // 10 min

    // Prefetch on hover
    enabled: !!movieId,
  });
};

// Prefetching
const MovieCard = ({ movie }) => {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ["movie", movie.id],
      queryFn: () => fetchMovie(movie.id),
    });
  };

  return <div onMouseEnter={prefetch}>...</div>;
};
```

**Cache Invalidation:**

```typescript
// Invalidate on mutations
const bookingMutation = useMutation({
  mutationFn: createBooking,
  onSuccess: (data, variables) => {
    // Invalidate seat cache
    queryClient.invalidateQueries(["seats", variables.showId]);

    // Invalidate booking history
    queryClient.invalidateQueries(["bookings"]);
  },
});
```

---

### State Management Questions

**Q6: When would you use Zustand vs React Query vs Context?**

**Answer:**

**Decision Matrix:**

| Use Case                    | Tool                   | Why                                          |
| --------------------------- | ---------------------- | -------------------------------------------- |
| Server data (movies, seats) | React Query            | Automatic caching, refetching, deduplication |
| UI state (modals, filters)  | Zustand                | Simple, performant, no boilerplate           |
| Auth state                  | Context                | Needs to wrap entire app, infrequent updates |
| Form state                  | React Hook Form        | Optimized for forms, built-in validation     |
| Global preferences          | Zustand + localStorage | Needs persistence                            |

**Examples:**

```typescript
// 1. React Query - Server State
const { data: movies } = useQuery({
  queryKey: ["movies"],
  queryFn: fetchMovies,
});

// WHY:
// - Automatic caching
// - Background refetching
// - Request deduplication
// - Loading/error states
// - Optimistic updates

// 2. Zustand - UI State
const useUIStore = create((set) => ({
  modals: { login: false },
  openModal: (name) =>
    set((state) => ({
      modals: { ...state.modals, [name]: true },
    })),
}));

// WHY:
// - Simple API
// - No provider needed
// - Selective subscriptions (no re-renders)
// - DevTools support
// - Middleware (persist, immer)

// 3. Context - Auth State
const AuthContext = createContext<AuthState | null>(null);

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(initialAuth);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// WHY:
// - Needs to wrap app
// - Infrequent updates (login/logout)
// - Standard React pattern
// - No external dependency

// 4. React Hook Form - Form State
const { register, handleSubmit } = useForm();

// WHY:
// - Optimized rendering
// - Built-in validation
// - Less boilerplate than controlled components
```

**Anti-Patterns to Avoid:**

```typescript
// ❌ Don't use Context for frequently updating state
// (Causes unnecessary re-renders)
const BadContext = createContext();

// ❌ Don't use Zustand for server data
// (Missing caching, refetching features)
const useBadStore = create((set) => ({
  movies: [],
  fetchMovies: async () => {
    const data = await fetch("/api/movies");
    set({ movies: data });
  },
}));

// ❌ Don't use React Query for pure UI state
// (Overkill, not designed for it)
const { data: modalOpen } = useQuery({
  queryKey: ["modal-open"],
  queryFn: () => false,
});
```

---

**Q7: How do you handle optimistic updates that fail?**

**Answer:**

**Complete Strategy:**

```typescript
const useOptimisticBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,

    // 1. BEFORE mutation
    onMutate: async (newBooking) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(["bookings"]);

      // Snapshot previous value
      const previous = queryClient.getQueryData(["bookings"]);

      // Optimistically update
      queryClient.setQueryData(["bookings"], (old) => [
        { ...newBooking, id: "temp-" + Date.now(), status: "PENDING" },
        ...old,
      ]);

      // Update UI immediately
      toast.info("Creating booking...");

      // Return context for rollback
      return { previous };
    },

    // 2. ON ERROR
    onError: (error, newBooking, context) => {
      // Rollback to previous state
      queryClient.setQueryData(["bookings"], context.previous);

      // User feedback
      toast.error(`Booking failed: ${error.message}`);

      // Retry logic
      if (error.code === "NETWORK_ERROR") {
        toast.action({
          label: "Retry",
          onClick: () => mutate(newBooking),
        });
      }

      // Analytics
      analytics.track("booking-failed", {
        error: error.code,
        attempt: context.attempt || 1,
      });
    },

    // 3. ON SUCCESS
    onSuccess: (data, variables, context) => {
      // Replace temp booking with real one
      queryClient.setQueryData(["bookings"], (old) =>
        old.map((booking) =>
          booking.id.startsWith("temp-")
            ? { ...booking, id: data.bookingId, status: "CONFIRMED" }
            : booking
        )
      );

      toast.success("Booking confirmed!");
    },

    // 4. ALWAYS RUN (regardless of success/error)
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(["bookings"]);
      queryClient.invalidateQueries(["seats"]);
    },

    // 5. Retry configuration
    retry: (failureCount, error) => {
      // Don't retry 4xx errors
      if (error.status >= 400 && error.status < 500) {
        return false;
      }

      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },

    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 10000);
    },
  });
};
```

**UI Indicators:**

```typescript
const BookingButton = () => {
  const booking = useOptimisticBooking();

  return (
    <button
      onClick={() => booking.mutate(bookingData)}
      disabled={booking.isLoading}
    >
      {booking.isLoading && <Spinner />}
      {booking.isLoading ? "Booking..." : "Book Now"}

      {booking.isError && (
        <Tooltip>
          Error: {booking.error.message}
          <button onClick={() => booking.reset()}>Try Again</button>
        </Tooltip>
      )}
    </button>
  );
};
```

---

### Security Questions

**Q8: How do you prevent XSS attacks in a React app?**

**Answer:**

**Multi-Layered Defense:**

**1. React's Built-in Protection:**

```typescript
// ✅ React escapes by default
const Component = ({ userName }) => (
  <div>{userName}</div> // Safe - auto-escaped
);

// ⚠️ Dangerous - only when necessary
const RichText = ({ html }) => (
  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }} />
);
```

**2. Input Sanitization:**

```typescript
import DOMPurify from "dompurify";

const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p"],
    ALLOWED_ATTR: ["href", "title"],
    ALLOWED_URI_REGEXP: /^https?:\/\/bookmyshow\.com/,
  });
};

// Usage
const Review = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
);
```

**3. Content Security Policy:**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' https://trusted-cdn.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' https://cdn.bookmyshow.com data: https:;
    connect-src 'self' https://api.bookmyshow.com;
    frame-src https://payments.razorpay.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  "
/>
```

**4. URL Sanitization:**

```typescript
// ❌ Vulnerable to javascript: URLs
<a href={userInput}>Click</a>;

// ✅ Safe
const sanitizeUrl = (url: string): string => {
  const allowedProtocols = ["http:", "https:", "mailto:"];

  try {
    const parsed = new URL(url, window.location.origin);

    if (!allowedProtocols.includes(parsed.protocol)) {
      return "#";
    }

    return parsed.href;
  } catch {
    return "#";
  }
};

<a href={sanitizeUrl(userInput)}>Click</a>;
```

**5. Attribute Sanitization:**

```typescript
// ❌ Dangerous
<div style={userInput} />;

// ✅ Safe
const allowedStyles = {
  color: /^#[0-9a-f]{6}$/i,
  fontSize: /^\d+px$/,
};

const sanitizeStyle = (styles: Record<string, string>) => {
  return Object.entries(styles).reduce((acc, [key, value]) => {
    if (allowedStyles[key]?.test(value)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
```

**6. Server-Side Validation:**

```typescript
// Client validation is NOT enough
// Server MUST validate all inputs

// API endpoint
app.post("/api/reviews", (req, res) => {
  const { content } = req.body;

  // Sanitize on server
  const clean = sanitize(content);

  // Save to DB
  await db.insertReview(clean);
});
```

---

**Q9: How do you implement secure authentication flow?**

**Answer:**

**Modern Secure Auth Flow:**

```typescript
// 1. Token Storage Strategy
class AuthService {
  // Access token in memory (XSS-safe)
  private accessToken: string | null = null;

  // Refresh token in httpOnly cookie (set by server)

  async login(email: string, password: string) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Send/receive cookies
      body: JSON.stringify({ email, password }),
    });

    const { accessToken } = await response.json();

    // Store access token in memory
    this.accessToken = accessToken;

    // Refresh token automatically set in httpOnly cookie by server

    // Optional: Encrypted backup in sessionStorage
    this.backupToken(accessToken);
  }

  async refreshAccessToken() {
    // Refresh token sent automatically in cookie
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    const { accessToken } = await response.json();
    this.accessToken = accessToken;
    this.backupToken(accessToken);
  }

  private backupToken(token: string) {
    // Encrypt before storing
    const encrypted = this.encrypt(token);
    sessionStorage.setItem("_at", encrypted);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      // Try to recover from sessionStorage
      const encrypted = sessionStorage.getItem("_at");
      if (encrypted) {
        this.accessToken = this.decrypt(encrypted);
      }
    }
    return this.accessToken;
  }

  logout() {
    this.accessToken = null;
    sessionStorage.removeItem("_at");

    // Clear httpOnly cookie (server-side)
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  }

  private encrypt(data: string): string {
    // Use Web Crypto API in production
    return btoa(data);
  }

  private decrypt(encrypted: string): string {
    return atob(encrypted);
  }
}

export const authService = new AuthService();

// 2. Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    // Redirect to login, save attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// 3. Automatic Token Refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        await authService.refreshAccessToken();

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${authService.getAccessToken()}`;

        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        authService.logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 4. CSRF Protection
const getCsrfToken = () => {
  return (
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") || ""
  );
};

axios.interceptors.request.use((config) => {
  if (config.method !== "get") {
    config.headers["X-CSRF-Token"] = getCsrfToken();
  }
  return config;
});

// 5. Server-Side Configuration
/*
// Set httpOnly cookie (server)
res.cookie('refreshToken', token, {
  httpOnly: true,      // Prevents JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Access token (short-lived)
res.json({
  accessToken: token, // 15 minutes expiry
});
*/
```

---

### Trade-offs Questions

**Q10: Why did you choose Zustand over Redux?**

**Answer:**

**Comparison:**

| Aspect         | Zustand                             | Redux                            |
| -------------- | ----------------------------------- | -------------------------------- |
| Boilerplate    | Minimal                             | Heavy (actions, reducers, types) |
| Bundle Size    | ~1KB                                | ~3KB (core) + ~8KB (toolkit)     |
| Learning Curve | Easy                                | Moderate                         |
| DevTools       | Yes                                 | Yes                              |
| Middleware     | Built-in                            | Extensive ecosystem              |
| TypeScript     | Excellent                           | Excellent                        |
| Performance    | Excellent (selective subscriptions) | Good (requires optimization)     |

**Code Comparison:**

```typescript
// ZUSTAND (Minimal boilerplate)
const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Usage
const { count, increment } = useStore();

// REDUX (More boilerplate)
// 1. Actions
const increment = () => ({ type: "INCREMENT" });

// 2. Reducer
const reducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
};

// 3. Store
const store = createStore(reducer);

// 4. Provider
<Provider store={store}>
  <App />
</Provider>;

// 5. Usage
const count = useSelector((state) => state.count);
const dispatch = useDispatch();
dispatch(increment());
```

**When to Use Redux:**

- Large team (enforced patterns)
- Complex state logic (many async actions)
- Need for middleware (saga, thunk)
- Time-travel debugging essential

**When to Use Zustand:**

- Small-medium team
- Simple-moderate state
- Want less boilerplate
- Performance is critical

**BookMyShow Choice: Zustand**

- UI state is simple (modals, filters, booking)
- Server state handled by React Query
- Team prefers minimal boilerplate
- Performance matters for seat selection

---

**Q11: When would you use Server-Side Rendering (SSR) vs Client-Side Rendering (CSR)?**

**Answer:**

**Decision Matrix:**

| Page Type       | Rendering | Why                                          |
| --------------- | --------- | -------------------------------------------- |
| Homepage        | SSR/SSG   | SEO, fast FCP, content mostly static         |
| Movie Details   | SSR       | SEO, shareable links, dynamic data           |
| Seat Selection  | CSR       | Highly interactive, real-time, authenticated |
| Checkout        | CSR       | Authenticated, secure, no SEO needed         |
| Booking History | CSR       | Authenticated, no SEO needed                 |

**Implementation:**

```typescript
// Next.js approach

// 1. Static Generation (SSG) - Homepage
export async function getStaticProps() {
  const movies = await fetchTrendingMovies();

  return {
    props: { movies },
    revalidate: 60, // Revalidate every 60 seconds (ISR)
  };
}

const HomePage = ({ movies }) => {
  return <MovieGrid movies={movies} />;
};

// 2. Server-Side Rendering - Movie Details
export async function getServerSideProps({ params }) {
  const movie = await fetchMovie(params.id);

  // 404 if not found
  if (!movie) {
    return { notFound: true };
  }

  return {
    props: { movie },
  };
}

const MovieDetailsPage = ({ movie }) => {
  return <MovieDetails movie={movie} />;
};

// 3. Client-Side Rendering - Seat Selection
const SeatSelectionPage = () => {
  const { showId } = useParams();
  const { data: seats, isLoading } = useQuery(["seats", showId], () =>
    fetchSeats(showId)
  );

  if (isLoading) return <Skeleton />;

  return <SeatMap seats={seats} />;
};
```

**Trade-offs:**

**SSR Pros:**

- Better SEO
- Faster FCP (First Contentful Paint)
- Works without JavaScript
- Better for slow devices

**SSR Cons:**

- Server costs (compute for each request)
- Slower TTFB (Time to First Byte)
- More complex deployment
- Hydration overhead

**CSR Pros:**

- Cheap hosting (static files)
- Better for authenticated pages
- Rich interactivity
- No server-side logic

**CSR Cons:**

- Slower FCP
- Poor SEO (unless using dynamic rendering)
- Blank page without JavaScript
- Requires client-side data fetching

**BookMyShow Strategy:**

- Marketing pages (homepage, movie details): **SSR/SSG**
- Booking flow (seats, checkout): **CSR**
- User dashboard: **CSR**
- Hybrid approach with Next.js for flexibility

---

**Q12: How do you handle SEO for a React SPA?**

**Answer:**

**Approach:**

1. **Dynamic Rendering (Recommended):**

```typescript
//Server detects bot user-agent and serves pre-rendered HTML

// Middleware
app.use((req, res, next) => {
  const userAgent = req.get("User-Agent");
  const isBot = /googlebot|bingbot|slurp|duckduckbot/i.test(userAgent);

  if (isBot) {
    // Serve pre-rendered HTML (from Rendertron, Puppeteer, etc.)
    const html = await renderPage(req.url);
    res.send(html);
  } else {
    // Serve regular SPA
    next();
  }
});
```

2. **React Helmet for Meta Tags:**

```typescript
import { Helmet } from "react-helmet-async";

const MovieDetailsPage = ({ movie }) => {
  return (
    <>
      <Helmet>
        <title>{movie.title} - Book Tickets | BookMyShow</title>
        <meta name="description" content={movie.synopsis} />

        {/* Open Graph */}
        <meta property="og:title" content={movie.title} />
        <meta property="og:description" content={movie.synopsis} />
        <meta property="og:image" content={movie.poster} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={movie.title} />
        <meta name="twitter:description" content={movie.synopsis} />
        <meta name="twitter:image" content={movie.poster} />

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Movie",
            name: movie.title,
            description: movie.synopsis,
            image: movie.poster,
            datePublished: movie.releaseDate,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: movie.rating,
              reviewCount: movie.reviewCount,
            },
          })}
        </script>
      </Helmet>

      <MovieDetails movie={movie} />
    </>
  );
};
```

3. **Structured Data:**

```typescript
const EventSchema = ({ event }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.date,
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue.address,
        addressLocality: event.venue.city,
        postalCode: event.venue.zip,
      },
    },
    offers: {
      "@type": "Offer",
      price: event.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: event.bookingUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
```

4. **Sitemap Generation:**

```typescript
// scripts/generate-sitemap.js
const generateSitemap = async () => {
  const movies = await fetchAllMovies();
  const events = await fetchAllEvents();

  const urls = [
    { loc: "https://bookmyshow.com", priority: 1.0 },
    ...movies.map((m) => ({
      loc: `https://bookmyshow.com/movie/${m.slug}`,
      lastmod: m.updatedAt,
      priority: 0.8,
    })),
    ...events.map((e) => ({
      loc: `https://bookmyshow.com/event/${e.slug}`,
      lastmod: e.updatedAt,
      priority: 0.7,
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls
        .map(
          (url) => `
        <url>
          <loc>${url.loc}</loc>
          ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
          <priority>${url.priority}</priority>
        </url>
      `
        )
        .join("")}
    </urlset>
  `;

  fs.writeFileSync("public/sitemap.xml", sitemap);
};
```

5. **Prerendering Service:**

```bash
# Prerender.io, Rendertron, or custom Puppeteer
# Caches pre-rendered pages for bots
```

---

## 11. Summary & Architecture Rationale

### Key Decisions

**1. State Management**

- **React Query** for server state (movies, seats, bookings)
  - _Why_: Automatic caching, background refetching, optimistic updates
  - _Trade-off_: Learning curve, but worth it for complex async state
- **Zustand** for UI state (modals, filters, booking flow)
  - _Why_: Minimal boilerplate, excellent TypeScript support, performance
  - _Trade-off_: Less ecosystem than Redux, but sufficient for our needs
- **Context** for auth state
  - _Why_: Needs to wrap entire app, infrequent updates
  - _Trade-off_: Can cause re-renders, but mitigated with selective consumption

**2. Real-time Communication**

- **WebSocket** primary, **Polling** fallback
  - _Why_: WebSocket for real-time seat updates, polling for degraded network
  - _Trade-off_: WebSocket complexity vs user experience

**3. Rendering Strategy**

- **CSR** for interactive pages (seat selection, checkout)

  - _Why_: Highly dynamic, authenticated, no SEO needed
  - _Trade-off_: Slower initial load, but better for interactivity

- **SSR/SSG** for marketing pages (homepage, movie details)
  - _Why_: SEO, fast FCP, shareable links
  - _Trade-off_: Server costs, but necessary for discovery

**4. Performance**

- Route-based code splitting
- Virtualization for long lists
- Aggressive image optimization
- Service Worker for offline support

### Trade-off Analysis

**Performance vs Complexity:**

- Chose React Query over manual fetch (more complex, but better UX)
- Virtualization adds complexity but necessary for seat maps with 300+ seats
- Optimistic updates add error handling complexity but feel instant

**SEO vs Development Speed:**

- SSR for key pages (homepage, movie details)
- CSR for authenticated flows (faster development, no SEO needed)

**Real-time vs Scalability:**

- WebSocket for real-time (better UX)
- But needs more infrastructure (scaling, fallbacks)
- Polling as fallback maintains UX on degraded networks

### Why This Architecture

**For Interviews:**
"This architecture balances user experience with scalability and maintainability. Key principles:

1. **Separation of Concerns**: Clear boundaries between UI, state, and data layers
2. **Performance First**: Code splitting, caching, optimizations baked in
3. **Resilience**: Graceful degradation, offline support, error handling
4. **Developer Experience**: Type safety, minimal boilerplate, good tooling

The combination of React Query + Zustand + Context provides a scalable state management solution. React Query handles the complex server state (caching, refetching, optimistic updates), while Zustand keeps UI state simple and performant.

For real-time seat updates, WebSocket provides instant feedback while polling ensures the app works on flaky networks. This hybrid approach maintains UX across all network conditions.

The frontend is designed to handle 100K+ concurrent users through aggressive caching, optimistic updates, and efficient re-rendering strategies."

### Scaling Considerations

**Current Architecture (0-500K DAU):**

- Single CDN for static assets
- React Query caching reduces API calls by 60%
- WebSocket for real-time updates

**Scaling to 1M-5M DAU:**

- Add edge caching (Cloudflare Workers)
- WebSocket server scaling (horizontal + Redis pub/sub)
- Implement request coalescing
- Add rate limiting on client

**Scaling to 10M+ DAU:**

- Micro-frontends for independent deployment
- Edge rendering for first-party data
- Advanced prefetching strategies
- Implement virtual waiting rooms for peak traffic

### Future Improvements

1. **Performance:**

   - React Server Components (when stable)
   - Streaming SSR with Suspense
   - Progressive Web App (PWA) with offline booking view

2. **Features:**

   - Live seat heatmap (popular vs available)
   - ML-powered seat recommendations
   - AR preview of theater views

3. **Developer Experience:**

   - Micro-frontend architecture for team independence
   - Visual regression testing in CI/CD
   - Automated bundle size monitoring

4. **Observability:**
   - Real User Monitoring (RUM)
   - Error tracking with Sentry
   - Performance budgets in CI/CD

---

**Total Length: ~2400 lines | ~95KB**

This HLD document provides a comprehensive, production-ready architecture for a ticket booking system. It covers all major aspects from component design to performance optimization, with concrete code examples and trade-off analysis suitable for senior-level engineering interviews.
