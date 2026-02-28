# High-Level Design: Food Delivery Application (Zomato/Swiggy/Grab/Uber Eats Scale)

## 1. Problem Statement & Requirements

### Problem Statement

Design a production-grade frontend architecture for a food delivery platform that serves millions of users across multiple cities, enabling customers to discover restaurants, place orders, track deliveries in real-time, while supporting restaurant partners and delivery personnel with dedicated interfaces.

### Functional Requirements

#### Core Features by User Role

**Customer Flow:**

- Restaurant discovery with filters (cuisine, rating, delivery time, price)
- Real-time menu browsing with images, descriptions, customizations
- Cart management with order customization
- Multiple payment methods (cards, wallets, COD)
- Real-time order tracking with live location
- Order history and re-ordering
- Reviews and ratings
- Push notifications for order updates

**Restaurant Partner Flow:**

- Order management dashboard
- Menu management (CRUD operations)
- Real-time order acceptance/rejection
- Inventory management
- Analytics dashboard

**Delivery Partner Flow:**

- Order assignment and acceptance
- Navigation and route optimization
- Earnings tracking
- Availability toggle

### Non-Functional Requirements

**Performance Metrics:**

- Initial Load Time: < 2s (3G network)
- Time to Interactive (TTI): < 3.5s
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Restaurant list render: < 16ms (60 FPS)
- Search results: < 300ms
- Cart updates: < 100ms
- Bundle size: < 200KB initial, < 500KB total

**Availability & Reliability:**

- 99.9% uptime
- Graceful degradation on network issues
- Offline cart persistence
- Auto-retry failed requests (3 attempts, exponential backoff)

**Scalability:**

- Support 10M+ concurrent users
- Handle 100K+ orders/hour during peak
- Real-time updates for 1M+ active deliveries

### Scale Estimates

```
Daily Active Users (DAU):        5M users
Peak Concurrent Users:           500K users
Orders per day:                  2M orders
Average order value:             $15
Restaurants:                     100K active
Delivery partners:               200K active
Cities covered:                  500+

Data Transfer:
- API calls/user/session:        50-100 requests
- Average response size:         5-50KB
- Images/user/session:           2-5MB
- WebSocket messages/order:      20-50 messages
- Total data transfer/day:       50-100TB
```

---

## 2. High-Level Architecture

```ascii
┌─────────────────────────────────────────────────────────────────┐
│                         CDN Layer                                │
│  (Cloudflare/Akamai - Static Assets, Images, Cache)            │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Load Balancer (Nginx/HAProxy)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐
│   Web    │   │   Web    │   │   Web    │
│  Server  │   │  Server  │   │  Server  │
│  (SPA)   │   │  (SPA)   │   │  (SPA)   │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│   API Gateway  │    │   WebSocket     │
│   (REST/GQL)   │    │   Server        │
│                │    │   (Socket.io)   │
└───────┬────────┘    └────────┬────────┘
        │                      │
   ┌────┴─────────┬───────────┴──────┬──────────┐
   │              │                  │          │
┌──▼──────┐  ┌───▼──────┐  ┌────────▼───┐  ┌──▼────────┐
│ Order   │  │Restaurant│  │  Delivery  │  │ Payment   │
│ Service │  │ Service  │  │  Service   │  │ Service   │
└─────────┘  └──────────┘  └────────────┘  └───────────┘


Frontend Application Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Routing Layer (React Router)             │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴──────────────────────────────┐  │
│  │            Feature Modules (Lazy Loaded)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │  │
│  │  │Restaurant│ │   Cart   │ │  Order   │ │ Profile │ │  │
│  │  │Discovery │ │ Management│ │ Tracking │ │         │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴──────────────────────────────┐  │
│  │         State Management Layer (Zustand)              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐  │  │
│  │  │  Cart  │ │  User  │ │ Orders │ │  Restaurants │  │  │
│  │  │  Store │ │  Store │ │  Store │ │    Store     │  │  │
│  │  └────────┘ └────────┘ └────────┘ └──────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴──────────────────────────────┐  │
│  │         Data Layer (React Query + WebSocket)          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │  │
│  │  │   HTTP   │ │WebSocket │ │  Service Workers   │   │  │
│  │  │  Client  │ │  Client  │ │  (Offline Cache)   │   │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

**1. Separation of Concerns**

- **Why**: Each layer has single responsibility, making code maintainable and testable
- **Implementation**: UI components don't know about API details, business logic separated from presentation

**2. Progressive Enhancement**

- **Why**: Ensure app works on low-end devices and poor networks
- **Implementation**: Core functionality works without JS, enhanced features load progressively

**3. Optimistic UI Updates**

- **Why**: Instant feedback improves perceived performance
- **Implementation**: Update UI immediately, rollback on failure

**4. Stateless Components**

- **Why**: Easier to test, reuse, and reason about
- **Implementation**: 80% presentational components, 20% containers

**5. API-First Design**

- **Why**: Frontend and backend can evolve independently
- **Implementation**: Mock APIs during development, contract testing

### System Invariants

```typescript
/**
 * Invariants that MUST NEVER be violated
 */

// 1. Cart Consistency
// Cart state MUST always match server state after sync
invariant(cart.synced === true || cart.syncPending === true);

// 2. Authentication State
// Protected routes MUST NOT render without valid token
invariant(isProtectedRoute() ? hasValidToken() : true);

// 3. Real-time Order Updates
// Active orders MUST have websocket connection
invariant(activeOrders.length > 0 ? websocket.connected : true);

// 4. Payment Security
// Payment data MUST NEVER be stored in client state
invariant(!state.hasOwnProperty("cardDetails"));

// 5. Image Loading
// Images MUST have placeholder while loading
invariant(image.loading ? image.placeholder !== null : true);
```

---

## 3. Component Architecture

### Component Hierarchy

```ascii
App
├── Layout
│   ├── Header
│   │   ├── LocationSelector
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Navigation
│   └── Footer
│
├── Routes
│   ├── HomePage
│   │   ├── HeroSection
│   │   ├── CategoryCarousel
│   │   └── FeaturedRestaurants
│   │
│   ├── RestaurantListPage
│   │   ├── FilterSidebar
│   │   │   ├── CuisineFilter
│   │   │   ├── PriceFilter
│   │   │   └── RatingFilter
│   │   ├── SortDropdown
│   │   └── RestaurantGrid
│   │       └── RestaurantCard (virtualized)
│   │
│   ├── RestaurantDetailPage
│   │   ├── RestaurantHeader
│   │   │   ├── RestaurantInfo
│   │   │   └── OperatingHours
│   │   ├── MenuSection
│   │   │   ├── CategoryTabs
│   │   │   └── MenuItemList
│   │   │       └── MenuItem
│   │   │           └── CustomizationModal
│   │   └── ReviewsSection
│   │
│   ├── CartPage
│   │   ├── CartItemList
│   │   │   └── CartItem
│   │   ├── BillSummary
│   │   └── CheckoutButton
│   │
│   ├── CheckoutPage
│   │   ├── DeliveryAddressForm
│   │   ├── PaymentMethodSelector
│   │   └── OrderSummary
│   │
│   └── OrderTrackingPage
│       ├── LiveMap
│       ├── OrderTimeline
│       ├── DeliveryPartnerInfo
│       └── OrderItems
│
└── GlobalComponents
    ├── Modal
    ├── Toast
    ├── LoadingSpinner
    └── ErrorBoundary
```

### Component Design Patterns

#### 1. Compound Components Pattern (RestaurantCard)

```typescript
/**
 * Compound Components Pattern for flexible, composable UI
 * Use case: Restaurant cards need different layouts across app
 */

// Container component with shared state
interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: "compact" | "detailed" | "featured";
  children: React.ReactNode;
}

const RestaurantCard = ({
  restaurant,
  variant = "compact",
  children,
}: RestaurantCardProps) => {
  const [isFavorite, setIsFavorite] = useState(restaurant.isFavorite);

  const context = {
    restaurant,
    variant,
    isFavorite,
    toggleFavorite: () => setIsFavorite(!isFavorite),
  };

  return (
    <RestaurantCardContext.Provider value={context}>
      <article className={`restaurant-card restaurant-card--${variant}`}>
        {children}
      </article>
    </RestaurantCardContext.Provider>
  );
};

// Sub-components
RestaurantCard.Image = function RestaurantCardImage() {
  const { restaurant, variant } = useRestaurantCardContext();

  return (
    <div className="restaurant-card__image">
      <OptimizedImage
        src={restaurant.image}
        alt={restaurant.name}
        width={variant === "featured" ? 400 : 200}
        height={variant === "featured" ? 300 : 150}
        loading="lazy"
      />
      <PromotionBadge offers={restaurant.offers} />
    </div>
  );
};

RestaurantCard.Info = function RestaurantCardInfo() {
  const { restaurant } = useRestaurantCardContext();

  return (
    <div className="restaurant-card__info">
      <h3>{restaurant.name}</h3>
      <p className="cuisine">{restaurant.cuisines.join(", ")}</p>
      <div className="metadata">
        <Rating value={restaurant.rating} />
        <span>•</span>
        <DeliveryTime value={restaurant.deliveryTime} />
        <span>•</span>
        <PriceRange value={restaurant.priceRange} />
      </div>
    </div>
  );
};

RestaurantCard.Actions = function RestaurantCardActions() {
  const { isFavorite, toggleFavorite } = useRestaurantCardContext();

  return (
    <div className="restaurant-card__actions">
      <IconButton
        icon={isFavorite ? "heart-filled" : "heart-outline"}
        onClick={toggleFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      />
    </div>
  );
};

// Usage - Flexible composition
<RestaurantCard restaurant={restaurant} variant="featured">
  <RestaurantCard.Image />
  <RestaurantCard.Info />
  <RestaurantCard.Actions />
</RestaurantCard>;
```

#### 2. Container vs Presentational Pattern

```typescript
/**
 * Container handles logic, Presentational handles UI
 */

// CONTAINER - Handles data fetching, state management
const RestaurantListContainer = () => {
  const location = useUserLocation();
  const filters = useRestaurantFilters();

  // Server state with React Query
  const {
    data: restaurants,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["restaurants", location, filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchRestaurants({ location, filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Infinite scroll
  const { ref: loadMoreRef } = useIntersectionObserver({
    onIntersect: () => hasNextPage && fetchNextPage(),
    threshold: 0.5,
  });

  if (error) return <ErrorState error={error} />;

  return (
    <RestaurantListPresentation
      restaurants={restaurants?.pages.flatMap((p) => p.restaurants) ?? []}
      isLoading={isLoading}
      loadMoreRef={loadMoreRef}
      hasMore={hasNextPage}
    />
  );
};

// PRESENTATIONAL - Pure UI component
interface RestaurantListPresentationProps {
  restaurants: Restaurant[];
  isLoading: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement>;
  hasMore: boolean;
}

const RestaurantListPresentation = ({
  restaurants,
  isLoading,
  loadMoreRef,
  hasMore,
}: RestaurantListPresentationProps) => {
  return (
    <div className="restaurant-list">
      {isLoading && restaurants.length === 0 ? (
        <RestaurantListSkeleton count={12} />
      ) : (
        <VirtualizedGrid
          items={restaurants}
          renderItem={(restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant}>
              <RestaurantCard.Image />
              <RestaurantCard.Info />
              <RestaurantCard.Actions />
            </RestaurantCard>
          )}
          itemHeight={280}
          gap={16}
        />
      )}

      {hasMore && (
        <div ref={loadMoreRef} className="load-more-trigger">
          {isLoading && <LoadingSpinner />}
        </div>
      )}
    </div>
  );
};
```

#### 3. Atomic Design Structure

```typescript
/**
 * Atomic Design: Atoms → Molecules → Organisms → Templates → Pages
 */

// ATOMS - Basic building blocks
const Button = ({ variant, size, children, ...props }: ButtonProps) => (
  <button className={`btn btn--${variant} btn--${size}`} {...props}>
    {children}
  </button>
);

const Input = ({ label, error, ...props }: InputProps) => (
  <div className="input-group">
    {label && <label>{label}</label>}
    <input {...props} />
    {error && <span className="error">{error}</span>}
  </div>
);

// MOLECULES - Simple combinations
const SearchBox = ({ value, onChange, onSubmit }: SearchBoxProps) => (
  <form onSubmit={onSubmit} className="search-box">
    <Input
      type="search"
      value={value}
      onChange={onChange}
      placeholder="Search for restaurants or dishes"
    />
    <Button type="submit" variant="primary">
      <SearchIcon />
    </Button>
  </form>
);

const PriceTag = ({ price, discount }: PriceTagProps) => (
  <div className="price-tag">
    <span className="price-current">₹{price}</span>
    {discount && (
      <>
        <span className="price-original">₹{discount.original}</span>
        <span className="price-discount">{discount.percentage}% OFF</span>
      </>
    )}
  </div>
);

// ORGANISMS - Complex components
const MenuItemCard = ({ item, onAddToCart }: MenuItemCardProps) => {
  const [quantity, setQuantity] = useState(0);
  const [customizations, setCustomizations] = useState<Customization[]>([]);

  return (
    <article className="menu-item">
      <div className="menu-item__content">
        <VegNonVegIndicator type={item.type} />
        <h4>{item.name}</h4>
        <p className="description">{item.description}</p>
        <PriceTag price={item.price} discount={item.discount} />
        <RatingBadge rating={item.rating} reviews={item.reviewCount} />
      </div>

      <div className="menu-item__image">
        <OptimizedImage
          src={item.image}
          alt={item.name}
          width={150}
          height={150}
        />
        {quantity === 0 ? (
          <Button onClick={() => setQuantity(1)}>ADD</Button>
        ) : (
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={0}
            max={10}
          />
        )}
      </div>

      {item.customizable && (
        <CustomizationButton onClick={() => setShowCustomization(true)} />
      )}
    </article>
  );
};

// TEMPLATES - Page layouts
const RestaurantPageTemplate = ({ children }: TemplateProps) => (
  <div className="restaurant-page">
    <Header />
    <main className="restaurant-page__content">{children}</main>
    <StickyCart />
    <Footer />
  </div>
);
```

### Component Responsibility Matrix

| Component                  | Data Fetching | State Management | Business Logic | UI Rendering |
| -------------------------- | ------------- | ---------------- | -------------- | ------------ |
| RestaurantListContainer    | ✅            | ✅               | ✅             | ❌           |
| RestaurantListPresentation | ❌            | ❌               | ❌             | ✅           |
| RestaurantCard             | ❌            | Local only       | Minimal        | ✅           |
| MenuItemCard               | ❌            | Local only       | Minimal        | ✅           |
| CartContainer              | ✅            | ✅               | ✅             | ❌           |
| CartPresentation           | ❌            | ❌               | ❌             | ✅           |
| CheckoutForm               | ❌            | Local (form)     | Validation     | ✅           |

---

## 4. State Management

### Global State Structure

```typescript
/**
 * Complete state tree using Zustand
 * Organized by domain with clear ownership
 */

interface AppState {
  // User domain
  user: {
    profile: UserProfile | null;
    addresses: Address[];
    paymentMethods: PaymentMethod[];
    preferences: UserPreferences;
    isAuthenticated: boolean;
  };

  // Cart domain
  cart: {
    items: CartItem[];
    restaurant: RestaurantSummary | null;
    appliedCoupon: Coupon | null;
    deliveryAddress: Address | null;
    instructions: string;
    subtotal: number;
    taxes: number;
    deliveryFee: number;
    discount: number;
    total: number;
    lastSynced: Date | null;
    syncPending: boolean;
  };

  // Order domain
  orders: {
    active: Order[];
    past: Order[];
    tracking: {
      [orderId: string]: {
        status: OrderStatus;
        estimatedTime: Date;
        deliveryPartner: DeliveryPartner | null;
        location: LatLng | null;
      };
    };
  };

  // UI domain
  ui: {
    location: {
      coordinates: LatLng;
      address: string;
      detected: boolean;
    };
    filters: {
      cuisines: string[];
      priceRange: [number, number];
      rating: number;
      deliveryTime: number;
      sortBy: "relevance" | "rating" | "deliveryTime" | "costForTwo";
    };
    modals: {
      customization: {
        isOpen: boolean;
        menuItem: MenuItem | null;
      };
      addressSelection: {
        isOpen: boolean;
        context: "delivery" | "billing";
      };
    };
    toast: {
      messages: ToastMessage[];
    };
  };
}
```

### State Management Implementation

```typescript
/**
 * Zustand store with middleware for persistence and dev tools
 */

import create from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Cart Store - Most critical for food delivery
const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        restaurant: null,
        appliedCoupon: null,
        deliveryAddress: null,
        instructions: "",

        // Computed values
        get subtotal() {
          return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
        },

        get total() {
          const state = get();
          return (
            state.subtotal + state.taxes + state.deliveryFee - state.discount
          );
        },

        // Actions
        addItem: (item: MenuItem, customizations: Customization[]) => {
          set((state) => {
            // Invariant: Can only add from one restaurant
            if (state.restaurant && state.restaurant.id !== item.restaurantId) {
              throw new Error("Cannot add items from different restaurant");
            }

            const existingIndex = state.items.findIndex(
              (i) =>
                i.id === item.id &&
                JSON.stringify(i.customizations) ===
                  JSON.stringify(customizations)
            );

            if (existingIndex >= 0) {
              state.items[existingIndex].quantity += 1;
            } else {
              state.items.push({
                ...item,
                customizations,
                quantity: 1,
                addedAt: new Date(),
              });
            }

            if (!state.restaurant) {
              state.restaurant = {
                id: item.restaurantId,
                name: item.restaurantName,
                image: item.restaurantImage,
              };
            }

            state.syncPending = true;
          });

          // Optimistic update, sync with server
          get().syncCart();
        },

        removeItem: (itemId: string, customizations: Customization[]) => {
          set((state) => {
            const index = state.items.findIndex(
              (i) =>
                i.id === itemId &&
                JSON.stringify(i.customizations) ===
                  JSON.stringify(customizations)
            );

            if (index >= 0) {
              if (state.items[index].quantity > 1) {
                state.items[index].quantity -= 1;
              } else {
                state.items.splice(index, 1);
              }
            }

            // Clear restaurant if cart is empty
            if (state.items.length === 0) {
              state.restaurant = null;
              state.appliedCoupon = null;
            }

            state.syncPending = true;
          });

          get().syncCart();
        },

        applyCoupon: async (couponCode: string) => {
          try {
            const coupon = await validateCoupon(couponCode, {
              restaurantId: get().restaurant?.id,
              subtotal: get().subtotal,
            });

            set((state) => {
              state.appliedCoupon = coupon;
              state.discount = calculateDiscount(state.subtotal, coupon);
            });

            return { success: true, coupon };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },

        syncCart: debounce(async () => {
          const state = get();

          try {
            await api.cart.sync({
              items: state.items,
              coupon: state.appliedCoupon,
              restaurant: state.restaurant,
            });

            set({ lastSynced: new Date(), syncPending: false });
          } catch (error) {
            console.error("Cart sync failed:", error);
            // Retry with exponential backoff
            retryWithBackoff(() => get().syncCart(), 3);
          }
        }, 1000),

        clearCart: () => {
          set({
            items: [],
            restaurant: null,
            appliedCoupon: null,
            deliveryAddress: null,
            instructions: "",
            discount: 0,
            syncPending: false,
          });
        },
      })),
      {
        name: "cart-storage",
        // Only persist necessary fields
        partialize: (state) => ({
          items: state.items,
          restaurant: state.restaurant,
          appliedCoupon: state.appliedCoupon,
          deliveryAddress: state.deliveryAddress,
          instructions: state.instructions,
        }),
      }
    )
  )
);

/**
 * Server State vs Client State Separation
 * Server state managed by React Query
 * Client state managed by Zustand
 */

// Server State - Restaurants (React Query)
export const useRestaurants = (location: LatLng, filters: Filters) => {
  return useQuery({
    queryKey: ["restaurants", location, filters],
    queryFn: () => fetchRestaurants({ location, filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes

    // Optimistic updates on filter change
    placeholderData: (previousData) => previousData,

    // Background refetch
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30 seconds for availability updates
  });
};

// Server State - Menu (React Query with prefetching)
export const useMenu = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["menu", restaurantId],
    queryFn: () => fetchMenu(restaurantId),
    staleTime: 10 * 60 * 1000,

    // Prefetch images
    onSuccess: (data) => {
      data.items.forEach((item) => {
        if (item.image) {
          const img = new Image();
          img.src = item.image;
        }
      });
    },
  });
};

// Client State - UI filters (Zustand)
export const useFilterStore = create<FilterState>((set) => ({
  cuisines: [],
  priceRange: [0, 1000],
  rating: 0,
  deliveryTime: 60,
  sortBy: "relevance",

  setCuisines: (cuisines) => set({ cuisines }),
  setPriceRange: (range) => set({ priceRange: range }),
  setRating: (rating) => set({ rating }),
  setSortBy: (sortBy) => set({ sortBy }),
  reset: () =>
    set({
      cuisines: [],
      priceRange: [0, 1000],
      rating: 0,
      deliveryTime: 60,
      sortBy: "relevance",
    }),
}));
```

### Optimistic Updates Pattern

```typescript
/**
 * Optimistic updates for instant UI feedback
 * Rollback on failure
 */

const useOptimisticCartUpdate = () => {
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: (item: CartItem) => api.cart.add(item),

    // Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);

      // Optimistically update
      queryClient.setQueryData<Cart>(["cart"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: [...old.items, newItem],
          subtotal: old.subtotal + newItem.price * newItem.quantity,
        };
      });

      // Return rollback context
      return { previousCart };
    },

    // Rollback on error
    onError: (err, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }

      toast.error("Failed to add item to cart");
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return addToCartMutation;
};
```

### State Persistence Strategy

```typescript
/**
 * Multi-layer caching strategy
 * Memory → LocalStorage → IndexedDB → Server
 */

// Layer 1: In-memory cache (React Query)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    },
  },
});

// Layer 2: LocalStorage (Zustand persist)
const persistConfig = {
  name: "app-storage",
  version: 1,

  // Migrate old versions
  migrate: (persistedState: any, version: number) => {
    if (version === 0) {
      // Migration from v0 to v1
      persistedState.cart.items = persistedState.cart.items.map(
        (item: any) => ({
          ...item,
          addedAt: new Date(),
        })
      );
    }
    return persistedState;
  },

  // Selective persistence
  partialize: (state) => ({
    cart: state.cart,
    user: {
      addresses: state.user.addresses,
      preferences: state.user.preferences,
    },
  }),
};

// Layer 3: IndexedDB for large data (offline images, menu cache)
class OfflineCache {
  private db: IDBDatabase;

  async init() {
    this.db = await openDB("food-delivery-cache", 1, {
      upgrade(db) {
        // Store for menu data
        db.createObjectStore("menus", { keyPath: "restaurantId" });

        // Store for images
        db.createObjectStore("images", { keyPath: "url" });

        // Store for orders
        db.createObjectStore("orders", { keyPath: "id" });
      },
    });
  }

  async cacheMenu(restaurantId: string, menu: Menu) {
    await this.db.put("menus", { restaurantId, menu, cachedAt: Date.now() });
  }

  async getMenu(restaurantId: string): Promise<Menu | null> {
    const cached = await this.db.get("menus", restaurantId);

    // Cache for 1 hour
    if (cached && Date.now() - cached.cachedAt < 60 * 60 * 1000) {
      return cached.menu;
    }

    return null;
  }
}
```

---

## 5. Data Flow & API Communication

### API Architecture

```typescript
/**
 * API Client with interceptors, retry logic, and error handling
 */

import axios, { AxiosInstance, AxiosError } from "axios";

class ApiClient {
  private client: AxiosInstance;
  private retryQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers["X-Request-ID"] = generateRequestId();

        // Add device info
        config.headers["X-Device-Type"] = getDeviceType();
        config.headers["X-App-Version"] = APP_VERSION;

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful requests in dev
        if (process.env.NODE_ENV === "development") {
          console.log(
            `✅ ${response.config.method?.toUpperCase()} ${
              response.config.url
            }`,
            {
              status: response.status,
              data: response.data,
            }
          );
        }

        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private async handleError(error: AxiosError) {
    const originalRequest = error.config as any;

    // Network error
    if (!error.response) {
      // Check if offline
      if (!navigator.onLine) {
        throw new NetworkError("You are offline", { retryable: true });
      }

      // Retry with exponential backoff
      if (!originalRequest._retry) {
        originalRequest._retry = 0;
      }

      if (originalRequest._retry < 3) {
        originalRequest._retry++;
        const delay = Math.min(1000 * 2 ** originalRequest._retry, 10000);

        await sleep(delay);
        return this.client(originalRequest);
      }

      throw new NetworkError("Network request failed", { retryable: false });
    }

    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Unauthorized - refresh token
        return this.handleUnauthorized(originalRequest);

      case 429:
        // Rate limited
        const retryAfter = error.response.headers["retry-after"];
        throw new RateLimitError("Too many requests", {
          retryAfter: parseInt(retryAfter) || 60,
        });

      case 503:
        // Service unavailable
        throw new ServiceUnavailableError("Service temporarily unavailable", {
          retryable: true,
        });

      default:
        throw new ApiError(error.response.data.message || "Request failed", {
          status: error.response.status,
          code: error.response.data.code,
          data: error.response.data,
        });
    }
  }

  private async handleUnauthorized(originalRequest: any) {
    // Prevent multiple refresh attempts
    const refreshKey = "token-refresh";

    if (!this.retryQueue.has(refreshKey)) {
      const refreshPromise = this.refreshToken();
      this.retryQueue.set(refreshKey, refreshPromise);

      try {
        await refreshPromise;
        this.retryQueue.delete(refreshKey);
      } catch (error) {
        this.retryQueue.delete(refreshKey);
        // Redirect to login
        window.location.href = "/login";
        throw error;
      }
    } else {
      // Wait for ongoing refresh
      await this.retryQueue.get(refreshKey);
    }

    // Retry original request with new token
    return this.client(originalRequest);
  }

  private async refreshToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post("/auth/refresh", { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    setAuthToken(accessToken);
    setRefreshToken(newRefreshToken);
  }

  // API methods
  async get<T>(url: string, config = {}) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data: any, config = {}) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data: any, config = {}) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config = {}) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Singleton instance
export const apiClient = new ApiClient();

/**
 * API Service Layer - Domain-specific API calls
 */

export const restaurantApi = {
  list: (params: RestaurantListParams) =>
    apiClient.get<RestaurantListResponse>("/restaurants", { params }),

  getById: (id: string) => apiClient.get<Restaurant>(`/restaurants/${id}`),

  getMenu: (id: string) => apiClient.get<Menu>(`/restaurants/${id}/menu`),

  search: (query: string, location: LatLng) =>
    apiClient.get<SearchResults>("/restaurants/search", {
      params: { q: query, lat: location.lat, lng: location.lng },
    }),
};

export const orderApi = {
  create: (order: CreateOrderRequest) =>
    apiClient.post<Order>("/orders", order),

  getById: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  list: (params: OrderListParams) =>
    apiClient.get<OrderListResponse>("/orders", { params }),

  cancel: (id: string, reason: string) =>
    apiClient.post(`/orders/${id}/cancel`, { reason }),

  track: (id: string) => apiClient.get<OrderTracking>(`/orders/${id}/track`),
};

export const cartApi = {
  sync: (cart: Cart) => apiClient.post("/cart/sync", cart),

  validateCoupon: (code: string, cart: Cart) =>
    apiClient.post<CouponValidation>("/cart/validate-coupon", { code, cart }),
};
```

### WebSocket for Real-time Updates

```typescript
/**
 * WebSocket client for real-time order tracking
 */

import { io, Socket } from "socket.io-client";

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    this.socket = io(process.env.REACT_APP_WS_URL!, {
      auth: {
        token: getAuthToken(),
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;

      // Resubscribe to active orders
      const activeOrders = getActiveOrders();
      activeOrders.forEach((orderId) => {
        this.subscribeToOrder(orderId);
      });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected, manually reconnect
        this.socket?.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Fallback to polling
        this.startPolling();
      }
    });

    // Order update events
    this.socket.on("order:status-update", (data: OrderStatusUpdate) => {
      this.emit("order:status-update", data);

      // Update React Query cache
      queryClient.setQueryData(["order", data.orderId], (old: Order) => ({
        ...old,
        status: data.status,
        estimatedDeliveryTime: data.estimatedDeliveryTime,
      }));
    });

    this.socket.on("order:location-update", (data: LocationUpdate) => {
      this.emit("order:location-update", data);
    });

    this.socket.on("order:delivered", (data: OrderDelivered) => {
      this.emit("order:delivered", data);

      // Show notification
      showNotification({
        title: "Order Delivered!",
        body: `Your order #${data.orderId} has been delivered`,
        icon: "/icons/delivery-success.png",
      });
    });
  }

  subscribeToOrder(orderId: string) {
    this.socket?.emit("order:subscribe", { orderId });
  }

  unsubscribeFromOrder(orderId: string) {
    this.socket?.emit("order:unsubscribe", { orderId });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  private startPolling() {
    // Fallback polling mechanism
    const pollInterval = setInterval(async () => {
      const activeOrders = getActiveOrders();

      for (const orderId of activeOrders) {
        try {
          const tracking = await orderApi.track(orderId);
          this.emit("order:status-update", tracking);
        } catch (error) {
          console.error("Polling error:", error);
        }
      }
    }, 5000); // Poll every 5 seconds

    // Store interval ID for cleanup
    this.pollingInterval = pollInterval;
  }

  disconnect() {
    this.socket?.disconnect();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}

export const wsClient = new WebSocketClient();

/**
 * React hook for order tracking
 */
export const useOrderTracking = (orderId: string) => {
  const [tracking, setTracking] = useState<OrderTracking | null>(null);

  useEffect(() => {
    // Subscribe to order updates
    wsClient.subscribeToOrder(orderId);

    const handleStatusUpdate = (data: OrderStatusUpdate) => {
      if (data.orderId === orderId) {
        setTracking((prev) => ({
          ...prev,
          status: data.status,
          estimatedDeliveryTime: data.estimatedDeliveryTime,
        }));
      }
    };

    const handleLocationUpdate = (data: LocationUpdate) => {
      if (data.orderId === orderId) {
        setTracking((prev) => ({
          ...prev,
          deliveryPartnerLocation: data.location,
        }));
      }
    };

    wsClient.on("order:status-update", handleStatusUpdate);
    wsClient.on("order:location-update", handleLocationUpdate);

    return () => {
      wsClient.off("order:status-update", handleStatusUpdate);
      wsClient.off("order:location-update", handleLocationUpdate);
      wsClient.unsubscribeFromOrder(orderId);
    };
  }, [orderId]);

  return tracking;
};
```

---

## 6. Performance Optimization

### Bundle Optimization

```typescript
/**
 * Code splitting and lazy loading strategy
 */

// Route-based code splitting
const RestaurantListPage = lazy(() => import("./pages/RestaurantList"));
const RestaurantDetailPage = lazy(() => import("./pages/RestaurantDetail"));
const CartPage = lazy(() => import("./pages/Cart"));
const CheckoutPage = lazy(() => import("./pages/Checkout"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTracking"));

// Component-based lazy loading for heavy components
const MapComponent = lazy(() => import("./components/Map"));
const PaymentGateway = lazy(() => import("./components/PaymentGateway"));

// Prefetch on hover
const prefetchRestaurantDetail = (restaurantId: string) => {
  const componentImport = import("./pages/RestaurantDetail");
  const dataFetch = queryClient.prefetchQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => restaurantApi.getById(restaurantId),
  });

  return Promise.all([componentImport, dataFetch]);
};

// Usage with prefetching
<Link
  to={`/restaurant/${restaurant.id}`}
  onMouseEnter={() => prefetchRestaurantDetail(restaurant.id)}
>
  {restaurant.name}
</Link>;

/**
 * Webpack configuration for optimization
 */

// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Vendor bundle for third-party libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },

        // React/React-DOM in separate bundle (rarely changes)
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react",
          priority: 20,
        },

        // UI components library
        ui: {
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          name: "ui",
          priority: 15,
        },

        // Common code across routes
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },

    // Runtime chunk for webpack manifest
    runtimeChunk: "single",

    // Minimize bundle
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true,
          },
        },
      }),
    ],
  },
};
```

### Rendering Optimization

```typescript
/**
 * Virtual scrolling for large lists
 */

import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualRestaurantList = ({ restaurants }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: restaurants.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated item height
    overscan: 5, // Render 5 items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const restaurant = restaurants[virtualItem.index];

          return (
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
              <RestaurantCard restaurant={restaurant} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Memoization strategies
 */

// Memoize expensive calculations
const MemoizedRestaurantCard = memo(RestaurantCard, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.restaurant.id === nextProps.restaurant.id &&
    prevProps.restaurant.isFavorite === nextProps.restaurant.isFavorite &&
    prevProps.restaurant.isOpen === nextProps.restaurant.isOpen
  );
});

// useMemo for derived data
const FilteredRestaurants = ({ restaurants, filters }: Props) => {
  const filteredList = useMemo(() => {
    return restaurants
      .filter((r) => {
        if (
          filters.cuisines.length &&
          !filters.cuisines.some((c) => r.cuisines.includes(c))
        ) {
          return false;
        }
        if (r.rating < filters.minRating) {
          return false;
        }
        if (
          r.priceRange < filters.priceRange[0] ||
          r.priceRange > filters.priceRange[1]
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "rating":
            return b.rating - a.rating;
          case "deliveryTime":
            return a.deliveryTime - b.deliveryTime;
          case "costForTwo":
            return a.costForTwo - b.costForTwo;
          default:
            return 0;
        }
      });
  }, [restaurants, filters]);

  return <RestaurantList restaurants={filteredList} />;
};

// useCallback for event handlers
const SearchBar = () => {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(
    debounce((value: string) => {
      // API call
      searchRestaurants(value);
    }, 300),
    []
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  return <input value={query} onChange={handleChange} />;
};

/**
 * React Concurrent Rendering
 */

import { useTransition, useDeferredValue } from "react";

const SearchResults = () => {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    // Mark as low priority update
    startTransition(() => {
      setQuery(value);
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />

      {isPending && <LoadingSpinner />}

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResultsList query={query} />
      </Suspense>
    </div>
  );
};

// Deferred values for expensive renders
const FilterPanel = ({ restaurants }: Props) => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);

  // UI updates immediately, heavy filtering deferred
  return (
    <>
      <FilterControls filters={filters} onChange={setFilters} />
      <RestaurantList restaurants={restaurants} filters={deferredFilters} />
    </>
  );
};
```

### Network Optimization

```typescript
/**
 * Prefetching and caching strategies
 */

// Prefetch critical resources
const prefetchCriticalData = () => {
  // Prefetch user location-based restaurants
  queryClient.prefetchQuery({
    queryKey: ["restaurants", userLocation],
    queryFn: () => restaurantApi.list({ location: userLocation }),
  });

  // Prefetch user data
  queryClient.prefetchQuery({
    queryKey: ["user"],
    queryFn: () => userApi.getProfile(),
  });
};

// Prefetch on route navigation
const useRoutePrefetch = () => {
  const location = useLocation();

  useEffect(() => {
    // Prefetch likely next routes
    if (location.pathname === "/") {
      // User likely to visit restaurant list
      import("./pages/RestaurantList");
    } else if (location.pathname.startsWith("/restaurant/")) {
      // User likely to add to cart
      import("./pages/Cart");
    } else if (location.pathname === "/cart") {
      // User likely to checkout
      import("./pages/Checkout");
    }
  }, [location]);
};

/**
 * Image optimization
 */

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  loading = "lazy",
}: ImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate responsive image URLs
    const webpUrl = generateImageUrl(src, { width, height, format: "webp" });
    const fallbackUrl = generateImageUrl(src, { width, height, format: "jpg" });

    // Try WebP first
    const img = new Image();
    img.src = webpUrl;

    img.onload = () => {
      setImageSrc(webpUrl);
      setIsLoading(false);
    };

    img.onerror = () => {
      // Fallback to JPG
      setImageSrc(fallbackUrl);
      setIsLoading(false);
    };
  }, [src, width, height]);

  return (
    <div className="optimized-image">
      {isLoading && (
        <div className="placeholder" style={{ width, height }}>
          <Skeleton />
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        style={{ display: isLoading ? "none" : "block" }}
      />
    </div>
  );
};

// Cloudinary transformation helper
const generateImageUrl = (
  src: string,
  { width, height, format = "auto" }: TransformOptions
) => {
  const cloudinaryBase = "https://res.cloudinary.com/your-cloud/image/upload";
  const transformations = [
    `w_${width}`,
    `h_${height}`,
    `f_${format}`,
    "q_auto", // Auto quality
    "c_fill", // Fill mode
    "g_auto", // Auto gravity for cropping
  ].join(",");

  return `${cloudinaryBase}/${transformations}/${src}`;
};

/**
 * Request compression and batching
 */

// GraphQL batching for multiple queries
const batchedQueries = [
  { query: GET_RESTAURANT, variables: { id: "1" } },
  { query: GET_MENU, variables: { restaurantId: "1" } },
  { query: GET_REVIEWS, variables: { restaurantId: "1" } },
];

// Single network request
const results = await graphqlClient.batchQuery(batchedQueries);

// HTTP/2 multiplexing enabled in server config
// Allows parallel requests without head-of-line blocking
```

### Core Web Vitals Optimization

```typescript
/**
 * Largest Contentful Paint (LCP) optimization
 * Target: < 2.5s
 */

// 1. Preload critical resources
<head>
  <link rel="preload" href="/fonts/roboto.woff2" as="font" crossorigin />
  <link rel="preload" href="/hero-image.webp" as="image" />
  <link rel="preconnect" href="https://api.fooddelivery.com" />
</head>;

// 2. Optimize hero image
const HeroSection = () => {
  return (
    <div className="hero">
      <img
        src="/hero-image.webp"
        alt="Food delivery"
        // Priority loading
        loading="eager"
        fetchpriority="high"
        // Prevent layout shift
        width={1200}
        height={600}
      />
    </div>
  );
};

/**
 * First Input Delay (FID) optimization
 * Target: < 100ms
 */

// 1. Defer non-critical scripts
<script src="/analytics.js" defer />;

// 2. Use Web Workers for heavy computation
const filterWorker = new Worker("/workers/filter.worker.js");

filterWorker.postMessage({
  restaurants,
  filters,
});

filterWorker.onmessage = (e) => {
  setFilteredRestaurants(e.data);
};

// 3. Break up long tasks
const processLargeList = async (items: any[]) => {
  const CHUNK_SIZE = 50;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);

    // Process chunk
    await processChunk(chunk);

    // Yield to browser
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

/**
 * Cumulative Layout Shift (CLS) optimization
 * Target: < 0.1
 */

// 1. Reserve space for images
const RestaurantCard = ({ restaurant }: Props) => {
  return (
    <article className="restaurant-card">
      {/* Fixed aspect ratio container */}
      <div className="image-container" style={{ aspectRatio: "16/9" }}>
        <img src={restaurant.image} alt={restaurant.name} />
      </div>
      <div className="content">...</div>
    </article>
  );
};

// 2. Skeleton loaders with exact dimensions
const RestaurantSkeleton = () => (
  <div className="restaurant-card" style={{ height: "280px" }}>
    <Skeleton height={180} />
    <Skeleton height={24} style={{ marginTop: "12px" }} />
    <Skeleton height={16} width="60%" />
  </div>
);

// 3. Avoid inserting content above existing content
// Use fixed headers, append new content at bottom
```

### Performance Monitoring

```typescript
/**
 * Real User Monitoring (RUM)
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB } from "web-vitals";

const reportWebVitals = (metric: Metric) => {
  // Send to analytics
  analytics.track("Web Vital", {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(metric);
  }
};

// Measure all vitals
onCLS(reportWebVitals);
onFID(reportWebVitals);
onLCP(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);

/**
 * Custom performance marks
 */

// Mark restaurant list render time
performance.mark("restaurant-list-start");

// ... render logic

performance.mark("restaurant-list-end");
performance.measure(
  "restaurant-list-render",
  "restaurant-list-start",
  "restaurant-list-end"
);

const measure = performance.getEntriesByName("restaurant-list-render")[0];
console.log(`Restaurant list rendered in ${measure.duration}ms`);

/**
 * React Profiler for component-level metrics
 */

const onRenderCallback = (
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  if (actualDuration > 16) {
    // Component took longer than 1 frame (60fps)
    console.warn(`Slow component: ${id} took ${actualDuration}ms`);

    analytics.track("Slow Component", {
      component: id,
      phase,
      duration: actualDuration,
    });
  }
};

<Profiler id="RestaurantList" onRender={onRenderCallback}>
  <RestaurantList />
</Profiler>;
```

---

## 7. Error Handling & Edge Cases

### Error Boundaries

```typescript
/**
 * Hierarchical error boundaries for graceful degradation
 */

// Root error boundary - catches all errors
class RootErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    logErrorToService(error, errorInfo);

    // Track in analytics
    analytics.track("App Crash", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Feature-level error boundary - isolates failures
const FeatureErrorBoundary = ({ children, fallback }: Props) => {
  return (
    <ErrorBoundary
      FallbackComponent={fallback}
      onError={(error, errorInfo) => {
        console.error("Feature error:", error);
      }}
      onReset={() => {
        // Reset feature state
        queryClient.resetQueries();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Usage
<FeatureErrorBoundary fallback={<RestaurantListError />}>
  <RestaurantList />
</FeatureErrorBoundary>;
```

### Offline Support

```typescript
/**
 * Service Worker for offline functionality
 */

// service-worker.js
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Network first for API calls with offline fallback
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Stale while revalidate for static assets
registerRoute(
  ({ request }) =>
    request.destination === "script" || request.destination === "style",
  new StaleWhileRevalidate({
    cacheName: "static",
  })
);

/**
 * Offline cart persistence
 */

const useOfflineCart = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);

      // Sync offline changes
      const offlineCart = await getOfflineCart();
      if (offlineCart) {
        setPendingSync(true);

        try {
          await cartApi.sync(offlineCart);
          await clearOfflineCart();
          toast.success("Cart synced successfully");
        } catch (error) {
          toast.error("Failed to sync cart");
        } finally {
          setPendingSync(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Changes will be synced when online.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, pendingSync };
};

/**
 * IndexedDB for offline storage
 */

class OfflineStorage {
  private db: IDBDatabase;

  async saveCart(cart: Cart) {
    const tx = this.db.transaction("cart", "readwrite");
    await tx.objectStore("cart").put(cart, "current");
  }

  async getCart(): Promise<Cart | null> {
    const tx = this.db.transaction("cart", "readonly");
    return await tx.objectStore("cart").get("current");
  }

  async clearCart() {
    const tx = this.db.transaction("cart", "readwrite");
    await tx.objectStore("cart").delete("current");
  }
}
```

### Network Failure Handling

```typescript
/**
 * Retry logic with exponential backoff
 */

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
};

// Usage
const fetchRestaurants = async () => {
  return retryWithBackoff(
    () => restaurantApi.list({ location: userLocation }),
    3,
    1000
  );
};

/**
 * Circuit breaker pattern
 */

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }
}

// Usage
const paymentCircuit = new CircuitBreaker(3, 30000);

const processPayment = async (paymentData: PaymentData) => {
  try {
    return await paymentCircuit.execute(() => paymentApi.process(paymentData));
  } catch (error) {
    if (error.message === "Circuit breaker is OPEN") {
      // Show user-friendly message
      toast.error("Payment service is temporarily unavailable");
      // Fallback to alternative payment method
    }
    throw error;
  }
};
```

### Form Validation

```typescript
/**
 * Form validation with React Hook Form and Zod
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const addressSchema = z.object({
  flatNumber: z.string().min(1, "Flat number is required"),
  building: z.string().optional(),
  street: z.string().min(1, "Street is required"),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required"),
  pincode: z
    .string()
    .length(6, "Pincode must be 6 digits")
    .regex(/^\d+$/, "Pincode must contain only numbers"),
  phone: z
    .string()
    .length(10, "Phone must be 10 digits")
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  type: z.enum(["home", "work", "other"]),
});

type AddressFormData = z.infer<typeof addressSchema>;

const AddressForm = ({ onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const onSubmitHandler = async (data: AddressFormData) => {
    try {
      // Verify address with geolocation API
      const verified = await verifyAddress(data);

      if (!verified.isValid) {
        setError("pincode", {
          message: "Unable to deliver to this location",
        });
        return;
      }

      await onSubmit({ ...data, coordinates: verified.coordinates });
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)}>
      <Input
        {...register("flatNumber")}
        label="Flat / House No."
        error={errors.flatNumber?.message}
      />

      <Input
        {...register("street")}
        label="Street / Area"
        error={errors.street?.message}
      />

      <Input
        {...register("pincode")}
        label="Pincode"
        error={errors.pincode?.message}
        maxLength={6}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Address"}
      </Button>
    </form>
  );
};
```

---

## 8. Testing Strategy

### Unit Testing

```typescript
/**
 * Component unit tests with React Testing Library
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("RestaurantCard", () => {
  const mockRestaurant = {
    id: "1",
    name: "Test Restaurant",
    cuisines: ["Italian", "Mexican"],
    rating: 4.5,
    deliveryTime: 30,
    priceRange: 2,
    image: "/test-image.jpg",
    isFavorite: false,
  };

  it("renders restaurant information correctly", () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);

    expect(screen.getByText("Test Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Italian, Mexican")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("30 mins")).toBeInTheDocument();
  });

  it("toggles favorite on button click", async () => {
    const { rerender } = render(<RestaurantCard restaurant={mockRestaurant} />);

    const favoriteButton = screen.getByLabelText("Add to favorites");
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Remove from favorites")
      ).toBeInTheDocument();
    });
  });

  it("displays promotion badge when offers available", () => {
    const restaurantWithOffer = {
      ...mockRestaurant,
      offers: [{ text: "50% OFF", code: "FIRST50" }],
    };

    render(<RestaurantCard restaurant={restaurantWithOffer} />);
    expect(screen.getByText("50% OFF")).toBeInTheDocument();
  });
});

/**
 * Hook testing
 */

import { renderHook, act } from "@testing-library/react";

describe("useCart", () => {
  it("adds item to cart", () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockMenuItem, []);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(mockMenuItem.id);
  });

  it("calculates subtotal correctly", () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({ ...mockMenuItem, price: 100 }, []);
      result.current.addItem({ ...mockMenuItem, id: "2", price: 200 }, []);
    });

    expect(result.current.subtotal).toBe(300);
  });

  it("prevents adding from different restaurant", () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockMenuItem, []);
    });

    expect(() => {
      act(() => {
        result.current.addItem(
          { ...mockMenuItem, restaurantId: "different" },
          []
        );
      });
    }).toThrow("Cannot add items from different restaurant");
  });
});
```

### Integration Testing

```typescript
/**
 * Integration tests for complete user flows
 */

describe("Restaurant Discovery Flow", () => {
  beforeEach(() => {
    // Setup mock server
    server.use(
      rest.get("/api/restaurants", (req, res, ctx) => {
        return res(ctx.json({ restaurants: mockRestaurants }));
      })
    );
  });

  it("allows user to filter and view restaurants", async () => {
    render(<App />);

    // Wait for restaurants to load
    await waitFor(() => {
      expect(screen.getAllByTestId("restaurant-card")).toHaveLength(10);
    });

    // Apply cuisine filter
    fireEvent.click(screen.getByText("Italian"));

    await waitFor(() => {
      const cards = screen.getAllByTestId("restaurant-card");
      expect(cards).toHaveLength(3); // Only Italian restaurants
    });

    // Click on restaurant
    fireEvent.click(screen.getByText("Italian Restaurant 1"));

    // Verify navigation to detail page
    await waitFor(() => {
      expect(screen.getByText("Menu")).toBeInTheDocument();
    });
  });
});

describe("Checkout Flow", () => {
  it("completes full checkout process", async () => {
    const user = userEvent.setup();

    render(<App />);

    // Add item to cart
    await user.click(screen.getByText("Add to Cart"));

    // Go to cart
    await user.click(screen.getByLabelText("Cart"));

    // Proceed to checkout
    await user.click(screen.getByText("Proceed to Checkout"));

    // Fill address
    await user.type(screen.getByLabelText("Flat Number"), "101");
    await user.type(screen.getByLabelText("Street"), "Main Street");
    await user.type(screen.getByLabelText("Pincode"), "123456");

    // Select payment method
    await user.click(screen.getByLabelText("Credit Card"));

    // Place order
    await user.click(screen.getByText("Place Order"));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText("Order Placed Successfully")).toBeInTheDocument();
    });
  });
});
```

### E2E Testing

```typescript
/**
 * Cypress E2E tests
 */

// cypress/e2e/order-flow.cy.ts

describe("Complete Order Flow", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.login(); // Custom command
  });

  it("places an order successfully", () => {
    // Search for restaurant
    cy.get('[data-testid="search-input"]').type("Pizza");
    cy.get('[data-testid="search-button"]').click();

    // Select restaurant
    cy.contains("Pizza Palace").click();

    // Add items to cart
    cy.contains("Margherita Pizza")
      .parent()
      .find('[data-testid="add-button"]')
      .click();
    cy.contains("Pepperoni Pizza")
      .parent()
      .find('[data-testid="add-button"]')
      .click();

    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();

    // Verify items
    cy.contains("Margherita Pizza").should("exist");
    cy.contains("Pepperoni Pizza").should("exist");

    // Proceed to checkout
    cy.contains("Checkout").click();

    // Fill delivery address
    cy.get('[name="flatNumber"]').type("101");
    cy.get('[name="street"]').type("Main Street");
    cy.get('[name="pincode"]').type("123456");
    cy.contains("Continue").click();

    // Select payment
    cy.get('[data-testid="payment-cod"]').click();

    // Place order
    cy.contains("Place Order").click();

    // Verify order placed
    cy.contains("Order Placed Successfully", { timeout: 10000 }).should(
      "exist"
    );

    // Verify order tracking page
    cy.url().should("include", "/track");
    cy.contains("Order Status").should("exist");
  });

  it("handles out of stock items", () => {
    cy.intercept("POST", "/api/cart/add", {
      statusCode: 400,
      body: { error: "Item out of stock" },
    });

    cy.visit("/restaurant/1");
    cy.contains("Add").first().click();

    cy.contains("Item out of stock").should("exist");
  });
});

/**
 * Visual regression testing with Percy
 */

describe("Visual Regression Tests", () => {
  it("matches restaurant card snapshot", () => {
    cy.visit("/restaurants");
    cy.percySnapshot("Restaurant List Page");
  });

  it("matches cart page snapshot", () => {
    cy.visit("/cart");
    cy.percySnapshot("Cart Page - Empty");

    // Add items
    cy.addToCart("item-1");
    cy.percySnapshot("Cart Page - With Items");
  });
});
```

### Performance Testing

```typescript
/**
 * Lighthouse CI configuration
 */

// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/restaurants",
        "http://localhost:3000/restaurant/1",
        "http://localhost:3000/cart",
        "http://localhost:3000/checkout",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

---

## 9. Security Considerations

### XSS Prevention

```typescript
/**
 * Input sanitization and output encoding
 */

import DOMPurify from "dompurify";

// Sanitize user input
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove all HTML tags
    KEEP_CONTENT: true,
  });
};

// Safe rendering of user content
const ReviewText = ({ text }: { text: string }) => {
  const sanitized = useMemo(() => sanitizeInput(text), [text]);

  return <p>{sanitized}</p>;
};

// For rich text (restaurant descriptions), allow specific tags only
const sanitizeRichText = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "u", "p", "br"],
    ALLOWED_ATTR: [],
  });
};

/**
 * Content Security Policy
 */

// index.html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.example.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.fooddelivery.com wss://ws.fooddelivery.com;
    font-src 'self' data:;
    frame-src 'none';
  "
/>;
```

### CSRF Protection

```typescript
/**
 * CSRF token management
 */

// Get CSRF token from cookie
const getCsrfToken = (): string => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : "";
};

// Include in API requests
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();

  if (
    csrfToken &&
    ["POST", "PUT", "DELETE"].includes(config.method?.toUpperCase() || "")
  ) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  return config;
});
```

### Secure Storage

```typescript
/**
 * Secure token storage
 */

// NEVER store sensitive data in localStorage
// Use httpOnly cookies for auth tokens (set by server)

// For client-side temporary data, use sessionStorage with encryption
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY!;

class SecureStorage {
  encrypt(data: any): string {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      ENCRYPTION_KEY
    ).toString();
  }

  decrypt(ciphertext: string): any {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  set(key: string, value: any) {
    const encrypted = this.encrypt(value);
    sessionStorage.setItem(key, encrypted);
  }

  get(key: string): any {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;

    try {
      return this.decrypt(encrypted);
    } catch {
      return null;
    }
  }
}

export const secureStorage = new SecureStorage();

// Payment data NEVER stored on client
// Always use tokenization (Stripe, Razorpay)
```

---

## 10. Interview Cross-Questions

### System Design Questions

**Q1: Why did you choose client-side rendering (SPA) over server-side rendering (SSR) for this food delivery app?**

**Answer**:
For food delivery apps, I'd actually use a **hybrid approach** (Next.js):

- **SSR/SSG for SEO-critical pages**: Restaurant listing, restaurant detail pages need good SEO for discoverability
- **CSR for dynamic features**: Cart, checkout, order tracking benefit from instant updates

Trade-offs:

- Pure SPA: Better interactivity, worse SEO, slower initial load
- SSR: Better SEO, slower navigation, higher server costs
- Hybrid: Best of both, but increased complexity

For this design I focused on SPA patterns, but in production I'd use Next.js with:

```typescript
// SSR for restaurant pages
export async function getServerSideProps({ params }) {
  const restaurant = await fetchRestaurant(params.id);
  return { props: { restaurant } };
}

// Client-side for cart/tracking
const OrderTracking = dynamic(() => import("./OrderTracking"), {
  ssr: false,
});
```

**Q2: How would you handle a scenario where 100K users are trying to order from the same restaurant during a flash sale?**

**Answer**:
Multi-layer strategy:

**Frontend**:

1. **Request queuing**: Queue checkout requests client-side

```typescript
const checkoutQueue = new PQueue({ concurrency: 1 });

const handleCheckout = async () => {
  return checkoutQueue.add(() => processCheckout());
};
```

2. **Optimistic locking**: Show estimated inventory

```typescript
const { data: availability } = useQuery({
  queryKey: ["availability", restaurantId],
  queryFn: () => fetchAvailability(restaurantId),
  refetchInterval: 1000, // Update every second
});
```

3. **Progressive disclosure**: Show waiting position

```typescript
<WaitingRoom position={queuePosition} estimatedTime={eta} />
```

**Backend considerations**:

- CDN for static content
- Rate limiting per user
- Redis for inventory tracking
- Message queue for order processing
- Database connection pooling

**Q3: How do you prevent race conditions in the cart when multiple tabs are open?**

**Answer**:
Use **Broadcast Channel API** for cross-tab communication:

```typescript
const cartChannel = new BroadcastChannel("cart-sync");

const useCartSync = () => {
  const updateCart = useCartStore((state) => state.updateCart);

  useEffect(() => {
    // Listen for updates from other tabs
    cartChannel.onmessage = (event) => {
      if (event.data.type === "CART_UPDATE") {
        updateCart(event.data.cart);
      }
    };

    return () => cartChannel.close();
  }, []);

  const syncCart = useCallback(
    (cart: Cart) => {
      // Update local state
      updateCart(cart);

      // Broadcast to other tabs
      cartChannel.postMessage({
        type: "CART_UPDATE",
        cart,
        timestamp: Date.now(),
      });
    },
    [updateCart]
  );

  return { syncCart };
};
```

Also implement **server-side locking**:

```typescript
// Server assigns version number to cart
// Client sends version with updates
// Server rejects if versions don't match

const updateCart = async (cart: Cart) => {
  const response = await api.cart.update({
    ...cart,
    version: currentVersion,
  });

  if (response.conflict) {
    // Merge changes or show conflict UI
    handleConflict(response.serverCart);
  }
};
```

### Performance Questions

**Q4: The restaurant list page is rendering slowly with 1000+ restaurants. How do you debug and fix this?**

**Answer**:
Systematic debugging approach:

**1. Identify the bottleneck**:

```typescript
// Use React Profiler
<Profiler id="RestaurantList" onRender={onRenderCallback}>
  <RestaurantList />
</Profiler>;

// Check render time
const onRenderCallback = (id, phase, actualDuration) => {
  if (actualDuration > 16) {
    console.warn(`Slow render: ${actualDuration}ms`);
  }
};
```

**2. Implement virtual scrolling**:

```typescript
// Only render visible items
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
  count: restaurants.length,
  estimateSize: () => 280,
  overscan: 5,
});

// Renders ~20 items instead of 1000
```

**3. Memoization**:

```typescript
// Prevent unnecessary re-renders
const MemoizedCard = memo(
  RestaurantCard,
  (prev, next) =>
    prev.restaurant.id === next.restaurant.id &&
    prev.restaurant.isFavorite === next.restaurant.isFavorite
);
```

**4. Lazy load images**:

```typescript
<img loading="lazy" src={restaurant.image} alt={restaurant.name} />
```

**5. Paginate or infinite scroll**:

```typescript
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ["restaurants"],
  queryFn: ({ pageParam = 1 }) => fetchRestaurants(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

**Q5: How do you optimize bundle size for a food delivery app?**

**Answer**:

**Analysis**:

```bash
# Analyze bundle
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

**Optimization strategies**:

1. **Code splitting**:

```typescript
// Route-based
const Checkout = lazy(() => import('./pages/Checkout'));

// Component-based
const Map = lazy(() => import('./components/Map'));

// Library chunking
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        priority: 20
      }
    }
  }
}
```

2. **Tree shaking**:

```typescript
// Import only what you need
import { debounce } from "lodash-es"; // ✅
// import _ from 'lodash'; // ❌
```

3. **Dynamic imports**:

```typescript
// Load heavy libraries on demand
const loadPaymentSDK = async () => {
  const { initPayment } = await import("payment-sdk");
  return initPayment();
};
```

4. **Compression**:

```javascript
// Enable Brotli/Gzip
const CompressionPlugin = require("compression-webpack-plugin");

plugins: [
  new CompressionPlugin({
    algorithm: "brotliCompress",
  }),
];
```

**Target**:

- Initial bundle: < 200KB
- Total bundle: < 500KB
- Each lazy chunk: < 100KB

### State Management Questions

**Q6: Why Zustand over Redux for this application?**

**Answer**:

**Zustand advantages**:

1. **Simpler API**: Less boilerplate

```typescript
// Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Redux - requires actions, reducers, types
```

2. **Better TypeScript support**: Automatic inference
3. **Smaller bundle**: ~1KB vs Redux ~10KB
4. **No Provider needed**: Less component nesting
5. **Flexible**: Can use with/without middleware

**When to use Redux instead**:

- Very large apps with complex state
- Need time-travel debugging
- Team familiar with Redux
- Need Redux DevTools features

**Hybrid approach** (what I'd use):

```typescript
// Zustand for UI state (simple, local)
const useUIStore = create((set) => ({
  theme: "light",
  sidebarOpen: false,
}));

// React Query for server state (with caching)
const useRestaurants = () => {
  return useQuery(["restaurants"], fetchRestaurants);
};
```

**Q7: How do you handle state synchronization between cart and server?**

**Answer**:

**Strategy**: Optimistic updates with rollback

```typescript
const useCartStore = create((set, get) => ({
  items: [],
  syncStatus: "synced", // 'synced' | 'syncing' | 'error'

  addItem: (item) => {
    // 1. Update local state immediately
    set((state) => ({
      items: [...state.items, item],
      syncStatus: "syncing",
    }));

    // 2. Sync with server in background
    syncWithServer(get().items)
      .then(() => {
        set({ syncStatus: "synced" });
      })
      .catch((error) => {
        // 3. Rollback on failure
        set((state) => ({
          items: state.items.filter((i) => i.id !== item.id),
          syncStatus: "error",
        }));

        toast.error("Failed to add item");
      });
  },
}));

// Debounce sync to avoid too many requests
const syncWithServer = debounce(async (items) => {
  await api.cart.sync({ items });
}, 1000);
```

**Conflict resolution**:

```typescript
// Server returns latest version with each response
interface CartResponse {
  items: CartItem[];
  version: number;
  serverTimestamp: Date;
}

// Client checks version before updating
if (serverVersion > clientVersion) {
  // Server has newer data - merge or replace
  mergeCartChanges(serverCart, clientCart);
}
```

### Security Questions

**Q8: How do you prevent a user from manipulating prices in the cart?**

**Answer**:

**Client-side**: Never trust the client

```typescript
// ❌ WRONG - Don't send prices from client
const checkout = async () => {
  await api.checkout({
    items: cart.items, // Contains prices
    total: cart.total,
  });
};

// ✅ CORRECT - Send only IDs and quantities
const checkout = async () => {
  await api.checkout({
    items: cart.items.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      customizations: item.customizations, // Server validates these too
    })),
  });
};
```

**Server-side validation**:

```typescript
// Server recalculates everything
const validateOrder = (orderRequest) => {
  const calculatedTotal = orderRequest.items.reduce((sum, item) => {
    // Fetch actual price from database
    const menuItem = db.menuItems.findById(item.menuItemId);

    // Calculate with customizations
    const itemTotal = calculateItemPrice(menuItem, item.customizations);

    return sum + itemTotal * item.quantity;
  }, 0);

  // Add taxes, delivery fee
  const total = calculatedTotal + taxes + deliveryFee - discount;

  return { total, items: calculatedItems };
};
```

**Additional measures**:

1. Rate limiting on checkout endpoint
2. CAPTCHA for suspicious activity
3. Audit logs for price changes
4. Server-side coupon validation

**Q9: How do you handle sensitive payment information?**

**Answer**:

**Never store payment info on client**:

```typescript
// ✅ CORRECT - Use payment gateway tokenization
const processPayment = async (amount: number) => {
  // 1. Load payment SDK
  const razorpay = await loadRazorpaySDK();

  // 2. Create order on server (gets order ID)
  const { orderId, amount } = await api.payment.createOrder({ amount });

  // 3. Open payment gateway (they handle card details)
  const result = await razorpay.open({
    key: RAZORPAY_KEY,
    amount,
    order_id: orderId,
    handler: async (response) => {
      // 4. Send payment token to server (not card details)
      await api.payment.verify({
        orderId,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });
    },
  });
};

// ❌ WRONG - Never do this
const cardDetails = {
  number: "4111111111111111",
  cvv: "123",
  expiry: "12/25",
};
await api.payment.process(cardDetails); // NEVER!
```

**PCI DSS compliance**:

- Card details never touch our frontend
- Use iframe/redirect to payment gateway
- Gateway returns tokenized payment method
- Store only payment token (if saving cards)

### Trade-off Questions

**Q10: When would you use WebSockets vs Server-Sent Events (SSE) for real-time order tracking?**

**Answer**:

**WebSockets**:

- ✅ Bi-directional communication
- ✅ Lower latency
- ✅ Better for frequent updates
- ❌ More complex to implement
- ❌ Requires sticky sessions for load balancing
- ❌ Harder to debug

**SSE**:

- ✅ Simple HTTP-based (easier load balancing)
- ✅ Auto-reconnection built-in
- ✅ Better for uni-directional (server → client)
- ❌ Higher latency than WebSocket
- ❌ Browser connection limits (6 per domain)

**My choice for order tracking: WebSocket**

Reasoning:

1. Need real-time location updates (frequent)
2. Potential for bi-directional (driver messages)
3. Lower latency critical for good UX
4. Can implement fallback to SSE/polling

```typescript
class OrderTrackingClient {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private mode: "websocket" | "sse" | "polling" = "websocket";

  connect(orderId: string) {
    try {
      this.connectWebSocket(orderId);
    } catch (error) {
      console.warn("WebSocket failed, falling back to SSE");
      this.connectSSE(orderId);
    }
  }

  private connectWebSocket(orderId: string) {
    this.ws = new WebSocket(`wss://api.example.com/track/${orderId}`);

    this.ws.onerror = () => {
      // Fallback to SSE
      this.connectSSE(orderId);
    };
  }

  private connectSSE(orderId: string) {
    this.sse = new EventSource(`/api/track/${orderId}/stream`);

    this.sse.onerror = () => {
      // Final fallback: polling
      this.startPolling(orderId);
    };
  }
}
```

**Q11: How do you decide between client-side and server-side filtering for restaurants?**

**Answer**:

**Decision factors**:

| Factor            | Client-side            | Server-side                 |
| ----------------- | ---------------------- | --------------------------- |
| Data size         | Small (<100 items)     | Large (>1000 items)         |
| Filter complexity | Simple (string match)  | Complex (geo, availability) |
| Network           | Offline support needed | Always online               |
| Performance       | Instant filter         | API latency                 |
| SEO               | Not important          | Important for discovery     |

**Hybrid approach** (recommended):

```typescript
const useRestaurantFilters = () => {
  // Server-side for initial filter + pagination
  const { data, isLoading } = useQuery({
    queryKey: ["restaurants", location, serverFilters],
    queryFn: () =>
      restaurantApi.list({
        location,
        cuisines: serverFilters.cuisines, // Server filters
        minRating: serverFilters.minRating,
        page: 1,
        limit: 50,
      }),
  });

  // Client-side for instant feedback on sort/simple filters
  const filtered = useMemo(() => {
    return data?.restaurants
      .filter((r) => {
        // Client-side filter: Veg/Non-veg toggle
        if (clientFilters.vegOnly && !r.isVeg) return false;

        // Client-side filter: Open now
        if (clientFilters.openNow && !r.isOpen) return false;

        return true;
      })
      .sort((a, b) => {
        // Client-side sort for instant response
        switch (clientFilters.sortBy) {
          case "rating":
            return b.rating - a.rating;
          case "deliveryTime":
            return a.deliveryTime - b.deliveryTime;
          default:
            return 0;
        }
      });
  }, [data, clientFilters]);

  return { restaurants: filtered, isLoading };
};
```

**Q12: Explain the trade-offs between different image optimization strategies.**

**Answer**:

**Strategies comparison**:

**1. Lazy loading**:

- ✅ Reduces initial page load
- ✅ Saves bandwidth
- ❌ Layout shift if not sized properly
- ❌ Images not loaded for SEO bots

```typescript
<img loading="lazy" src={url} width={300} height={200} />
```

**2. Progressive images (blur-up)**:

- ✅ Better UX (placeholder while loading)
- ✅ No layout shift
- ❌ Extra network request
- ❌ Slightly more complex

```typescript
const [src, setSrc] = useState(placeholderUrl);

useEffect(() => {
  const img = new Image();
  img.src = highResUrl;
  img.onload = () => setSrc(highResUrl);
}, []);

<img src={src} className={src === placeholderUrl ? "blur" : ""} />;
```

**3. Responsive images (srcset)**:

- ✅ Right size for device
- ✅ Bandwidth savings
- ❌ CDN must support it
- ❌ Complex to configure

```typescript
<img
  srcSet={`
    ${url}?w=300 300w,
    ${url}?w=600 600w,
    ${url}?w=1200 1200w
  `}
  sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
  src={url}
/>
```

**4. Format optimization (WebP/AVIF)**:

- ✅ 30-50% smaller than JPEG
- ✅ Better quality
- ❌ Need fallbacks for old browsers
- ❌ CDN must support

```typescript
<picture>
  <source srcSet={avifUrl} type="image/avif" />
  <source srcSet={webpUrl} type="image/webp" />
  <img src={jpgUrl} alt={alt} />
</picture>
```

**My recommendation**: Combine all

```typescript
const OptimizedImage = ({ src, alt, width, height }) => {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={generateSrcSet(src, "avif", [300, 600, 1200])}
        sizes="(max-width: 600px) 300px, 600px"
      />
      <source
        type="image/webp"
        srcSet={generateSrcSet(src, "webp", [300, 600, 1200])}
        sizes="(max-width: 600px) 300px, 600px"
      />
      <img
        src={`${src}?w=${width}&h=${height}&f=jpg&q=auto`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
};
```

**Q13: How do you handle memory leaks in a React application?**

**Answer**:

**Common causes and solutions**:

**1. Event listeners not cleaned up**:

```typescript
// ❌ Memory leak
useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  // Missing cleanup!
}, []);

// ✅ Correct
useEffect(() => {
  window.addEventListener("scroll", handleScroll);

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);
```

**2. Timers not cleared**:

```typescript
// ❌ Memory leak
useEffect(() => {
  const timer = setInterval(() => {
    updateData();
  }, 1000);
  // Missing cleanup!
}, []);

// ✅ Correct
useEffect(() => {
  const timer = setInterval(updateData, 1000);

  return () => clearInterval(timer);
}, []);
```

**3. Subscriptions not unsubscribed**:

```typescript
// ❌ Memory leak
useEffect(() => {
  const subscription = api.subscribe("orders", handleUpdate);
  // Missing cleanup!
}, []);

// ✅ Correct
useEffect(() => {
  const subscription = api.subscribe("orders", handleUpdate);

  return () => subscription.unsubscribe();
}, []);
```

**4. setState after unmount**:

```typescript
// ❌ Memory leak + warning
const Component = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData); // Component might unmount before this
  }, []);
};

// ✅ Correct - use abort controller
const Component = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetchData({ signal: abortController.signal })
      .then(setData)
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      });

    return () => abortController.abort();
  }, []);
};

// ✅ Alternative - mounted flag
const Component = () => {
  const [data, setData] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetchData().then((result) => {
      if (mountedRef.current) {
        setData(result);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);
};
```

**5. Large objects in closures**:

```typescript
// ❌ Memory leak - large object held in closure
const Component = () => {
  const [items, setItems] = useState([]);

  const handleClick = useCallback(() => {
    // items array is captured in closure
    console.log(items.length);
  }, []); // Empty deps - holds old items forever

  return <button onClick={handleClick}>Click</button>;
};

// ✅ Correct - use ref or update deps
const Component = () => {
  const [items, setItems] = useState([]);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleClick = useCallback(() => {
    console.log(itemsRef.current.length);
  }, []);
};
```

**Detection tools**:

```typescript
// Chrome DevTools Memory Profiler
// 1. Take heap snapshot
// 2. Perform action (navigate, add items)
// 3. Take another snapshot
// 4. Compare - detached DOM nodes indicate leaks

// React DevTools Profiler
// Check component mount/unmount counts
// Look for components that don't unmount
```

**Q14: How would you implement optimistic UI for adding items to cart?**

**Answer**:

**Complete implementation**:

```typescript
const useOptimisticCart = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (item: CartItem) => cartApi.addItem(item),

    // 1. Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // Snapshot current state
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);

      // Optimistically update UI
      queryClient.setQueryData<Cart>(["cart"], (old) => {
        if (!old) return old;

        return {
          ...old,
          items: [...old.items, { ...newItem, optimistic: true }],
          subtotal: old.subtotal + newItem.price,
        };
      });

      // Visual feedback
      toast.success(`${newItem.name} added to cart`, {
        icon: "🛒",
        duration: 2000,
      });

      // Return context for rollback
      return { previousCart, newItem };
    },

    // 2. On success - replace optimistic with real
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<Cart>(["cart"], (old) => {
        if (!old) return old;

        return {
          ...old,
          items: old.items.map((item) =>
            item.optimistic && item.id === context.newItem.id
              ? { ...data.item, optimistic: false }
              : item
          ),
        };
      });
    },

    // 3. On error - rollback
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }

      toast.error("Failed to add item to cart", {
        action: {
          label: "Retry",
          onClick: () => mutation.mutate(variables),
        },
      });
    },

    // 4. Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return mutation;
};

// Usage
const AddToCartButton = ({ item }: Props) => {
  const addToCart = useOptimisticCart();

  return (
    <Button
      onClick={() => addToCart.mutate(item)}
      disabled={addToCart.isLoading}
    >
      {addToCart.isLoading ? "Adding..." : "Add to Cart"}
    </Button>
  );
};
```

**Visual indicators for optimistic items**:

```typescript
const CartItem = ({ item }: Props) => {
  return (
    <div
      className={cn("cart-item", {
        "cart-item--optimistic": item.optimistic,
      })}
    >
      {item.optimistic && <LoadingSpinner size="small" />}
      <span>{item.name}</span>
      <span>₹{item.price}</span>
    </div>
  );
};
```

**Q15: How do you handle API rate limiting on the frontend?**

**Answer**:

**Multi-layer approach**:

**1. Request throttling/debouncing**:

```typescript
// Debounce search requests
const searchRestaurants = useMemo(
  () =>
    debounce((query: string) => {
      api.search(query);
    }, 300),
  []
);

// Throttle scroll events
const handleScroll = useMemo(
  () =>
    throttle(() => {
      // Load more
    }, 200),
  []
);
```

**2. Request queue**:

```typescript
import PQueue from "p-queue";

const requestQueue = new PQueue({
  concurrency: 3, // Max 3 concurrent requests
  interval: 1000, // Per second
  intervalCap: 10, // Max 10 requests per second
});

const apiClient = {
  async get(url: string) {
    return requestQueue.add(() => axios.get(url));
  },
};
```

**3. Handle 429 responses**:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

      // Show user-friendly message
      toast.warning(`Too many requests. Retrying in ${delay / 1000}s...`);

      // Wait and retry
      await sleep(delay);
      return apiClient(error.config);
    }

    throw error;
  }
);
```

**4. Client-side caching**:

```typescript
// Cache responses to reduce requests
const { data } = useQuery({
  queryKey: ["restaurants", location],
  queryFn: () => fetchRestaurants(location),
  staleTime: 5 * 60 * 1000, // Don't refetch for 5 min
  cacheTime: 30 * 60 * 1000, // Keep in cache for 30 min
});
```

**5. Exponential backoff**:

```typescript
const fetchWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
};
```

---

## 11. Summary & Architecture Rationale

### Key Architectural Decisions

**1. Component Architecture**

- **Decision**: Compound Components + Container/Presentational pattern
- **Rationale**: Maximizes reusability while keeping components focused
- **Trade-off**: Slight increase in initial complexity for long-term maintainability

**2. State Management**

- **Decision**: Zustand + React Query hybrid
- **Rationale**:
  - Zustand for client state (simple, lightweight)
  - React Query for server state (caching, synchronization)
  - Separation of concerns
- **Trade-off**: Learning curve for team vs better code organization

**3. Performance Strategy**

- **Decision**: Virtual scrolling + code splitting + image optimization
- **Rationale**: Must support low-end devices and poor networks
- **Trade-off**: Implementation complexity vs user experience on slow connections

**4. Real-time Updates**

- **Decision**: WebSocket with SSE/polling fallback
- **Rationale**: Best UX for order tracking, with graceful degradation
- **Trade-off**: Infrastructure complexity vs real-time experience

**5. Error Handling**

- **Decision**: Hierarchical error boundaries + offline support
- **Rationale**: Isolate failures, provide fallbacks
- **Trade-off**: More code vs resilient application

### Why This Architecture?

**For Scale**:

- Virtual scrolling handles 10K+ restaurants smoothly
- Code splitting keeps initial load under 200KB
- CDN + caching reduces server load
- Optimistic updates improve perceived performance

**For Maintainability**:

- Clear separation of concerns (UI, state, data)
- Reusable component patterns
- Type safety with TypeScript
- Comprehensive testing strategy

**For User Experience**:

- Sub-2s initial load
- Instant feedback with optimistic updates
- Graceful offline degradation
- Real-time order tracking

**For Business Requirements**:

- SEO-friendly (SSR potential)
- Analytics integration ready
- A/B testing friendly
- Multi-platform ready (web, mobile web)

### Scaling Considerations

**Current Design** (5M DAU):

- SPA with client-side routing
- REST API with WebSocket
- React Query caching
- CDN for static assets

**Next Level** (20M DAU):

- Migrate to Next.js for SSR/SSG
- Implement micro-frontends for teams
- Add GraphQL for flexible data fetching
- Implement service workers for offline
- Edge computing for personalization

**Enterprise Level** (100M DAU):

- Multiple SPA/micro-frontends
- GraphQL Federation
- Advanced caching strategies (Redis edge)
- Real-time with event-driven architecture
- AI-powered recommendations

### Future Improvements

**Technical Debt Priorities**:

1. Migrate to Nx monorepo for better code sharing
2. Implement comprehensive E2E testing
3. Add visual regression testing
4. Performance monitoring dashboard
5. Automated accessibility testing

**Feature Enhancements**:

1. Progressive Web App (PWA) with offline ordering
2. AR menu preview
3. Voice ordering integration
4. Live chat with restaurant/delivery partner
5. Social features (group ordering)

**Performance Targets**:

- Initial load: < 1.5s (currently < 2s)
- TTI: < 2.5s (currently < 3.5s)
- LCP: < 2s (currently < 2.5s)
- 95th percentile API response: < 200ms

This architecture provides a solid foundation that can scale from MVP to enterprise while maintaining code quality, performance, and developer experience.
