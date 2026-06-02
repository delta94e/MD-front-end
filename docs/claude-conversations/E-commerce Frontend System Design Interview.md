# E-commerce Frontend System Design Interview

## You

Continue

## Claude


# Cuộc Phỏng Vấn Front-end System Design: E-commerce Marketplace


*Thời gian: 90 phút | Vị trí: Senior Frontend Engineer | Công ty: Meta*


---


## Phần 1: Mở Đầu và Giới Thiệu


### [09:00 AM] Giới Thiệu


**Người phỏng vấn:** Chào bạn! Tôi là Minh, hiện đang làm Senior Staff Engineer tại Meta, team Instagram Shopping. Tôi đã có 8 năm kinh nghiệm trong việc xây dựng các hệ thống frontend quy mô lớn, chủ yếu với React và JavaScript ecosystem. Rất vui được gặp bạn hôm nay!


**Ứng viên:** Chào anh Minh! Em là Linh, rất vui được gặp anh. Em hiện có 6 năm kinh nghiệm làm Frontend Engineer, chủ yếu với React, và đã từng lead nhiều project e-commerce tại các startup và công ty công nghệ.


**Người phỏng vấn:** Tuyệt vời! Background e-commerce của bạn sẽ rất hữu ích cho session hôm nay. Trước khi bắt đầu, tôi muốn giải thích qua về cấu trúc của cuộc phỏng vấn này.


Hôm nay chúng ta sẽ focus vào Front-end System Design, một trong những skills quan trọng nhất cho Senior level tại Meta. Chúng ta sẽ sử dụng RADIO framework - một methodology mà team chúng tôi apply cho tất cả system design problems:


- **Requirements exploration** - Khám phá và clarify requirements
- **Architecture** - Thiết kế kiến trúc tổng quan
- **Data model** - Định nghĩa data structures và flow
- **Interface definition** - Design APIs và component interfaces
- **Optimizations** - Performance, scalability, và advanced topics


**Ứng viên:** Sounds great! Em đã nghe về RADIO framework và rất excited được apply nó trong practice.


**Người phỏng vấn:** Perfect! Về tiêu chí đánh giá, tôi sẽ observe 6 areas chính:


1. **Problem Exploration** - Khả năng hiểu và clarify requirements
2. **Architecture Design** - Technical design skills và component breakdown
3. **Technical Proficiency** - Frontend fundamentals và React expertise
4. **Exploration và Tradeoffs** - So sánh alternatives và reasoning
5. **Product và UX Sense** - User experience considerations
6. **Communication** - Clarity và collaboration skills


Tôi sẽ provide feedback throughout để guide bạn và ensure chúng ta cover được tất cả aspects quan trọng.


### Warm-up Discussion


**Người phỏng vấn:** Trước khi dive vào main problem, bạn có thể share về một project e-commerce challenging nhất mà bạn đã work trên không? Specifically về frontend architecture và technical decisions?


**Ứng viên:** Chắc chắn rồi! Project challenging nhất em làm là rebuild hoàn toàn platform của một fashion e-commerce company. Họ có legacy codebase jQuery với performance rất tệ, conversion rate thấp, và không scale được.


Em lead effort migrate sang React với server-side rendering sử dụng Next.js. Biggest challenges là:


**Technical challenges:**


- Legacy data structures không consistent
- Images không optimized, loading rất chậm
- No proper state management, data flow rất messy
- Mobile experience rất tệ


**Business challenges:**


- Không thể downtime trong migration process
- Phải maintain conversion rate trong lúc rebuild
- Team chưa familiar với React ecosystem


**Solutions em implemented:**


- Micro-frontend approach với gradual migration
- Image optimization pipeline với WebP và lazy loading
- Redux Toolkit cho predictable state management
- Responsive design system với Styled Components
- A/B testing framework để validate từng feature migration


**Results:**


- Page load time giảm 60% (từ 4s xuống 1.5s)
- Conversion rate tăng 25%
- Developer productivity tăng significantly
- Mobile traffic tăng 40%


**Người phỏng vấn:** Excellent! Tôi thấy bạn đã demonstrate được several key competencies ngay từ warm-up này:


**Problem Exploration signals:**


- Identified multiple types of challenges (technical + business)
- Understood constraints như no-downtime requirement


**Technical Proficiency signals:**


- Modern React ecosystem knowledge (Next.js, Redux Toolkit)
- Performance optimization understanding (SSR, image optimization)
- Migration strategy với micro-frontends


**Tradeoff awareness:**


- Balanced business continuity với technical improvement
- Used A/B testing để validate decisions


Đây là exactly loại thinking tôi expect ở Senior level! Bây giờ chúng ta sẽ apply cùng mindset này cho một problem design mới.


---


## Phần 2: Bài Toán Chính - E-commerce Marketplace Platform


### [09:15 AM] Problem Statement


**Người phỏng vấn:** Excellent! Bây giờ chúng ta move sang main design challenge.


**Design Problem:** Chúng ta cần thiết kế một e-commerce marketplace platform tương tự như Amazon, cho phép:


- Users browse và search products từ multiple vendors
- Add products vào shopping cart
- Complete checkout process
- Vendors manage their products và orders


Đây là open-ended problem nên tôi expect bạn sẽ ask clarifying questions để scope properly. Đây cũng là first evaluation checkpoint về **Problem Exploration skills**.


Ready để start với RADIO framework không?


**Ứng viên:** Yes, absolutely! Em sẽ start với Requirements exploration phase.


---


## [RADIO Phase: Requirements] - Khám Phá Yêu Cầu


### [09:17 AM] Functional Requirements Discovery


**Ứng viên:** Trước khi jump vào technical design, em muốn hiểu rõ về business requirements và constraints. Em có thể hỏi một số clarifying questions không?


**Người phỏng vấn:** Absolutely! Đây chính xác là approach tôi muốn thấy. Please go ahead.


**Ứng viên:** Perfect! Em sẽ structure questions theo categories:


**Business Scope & Users:**


1. **Target market** - Đây là domestic marketplace hay global platform?
2. **User types** - Chúng ta có những loại users nào? (Buyers, sellers/vendors, admin?)
3. **Product categories** - Có restrictions nào về product types không? (Digital vs physical, restricted items?)
4. **Vendor onboarding** - Vendors register và manage products như thế nào?


**Core User Journeys:**
5. **Shopping experience** - Users có cần account để browse không? Guest checkout có supported không?
6. **Search và discovery** - Search phải support filters, categories, recommendations không?
7. **Payment flow** - Chúng ta handle payments directly hay integrate với third-party như Stripe?
8. **Order management** - Post-purchase experience như tracking, returns có cần support không?


**Người phỏng vấn:** Great questions! Let me provide context:


**Business Context:**


- **Target**: US-focused marketplace ban đầu, plan expand internationally
- **Users**: B2C marketplace với buyers và vendors, plus admin dashboard
- **Products**: Physical products primarily, exclude restricted items như weapons, drugs
- **Vendor model**: Self-service vendor registration với approval process


**Core Features Priority:**


- **Phase 1 (MVP)**: Product browsing, search, cart, basic checkout
- **Phase 2**: Vendor dashboard, advanced search, recommendations
- **Phase 3**: Reviews, ratings, advanced analytics


**Business Rules:**


- Guest checkout supported
- Payment via Stripe integration
- Basic order tracking required
- English language only for MVP


**Ứng viên:** Thanks! Đây là helpful context. Em có thêm một số questions về technical constraints:


**Scale & Performance:**


1. **Expected load** - Concurrent users expectations? Products catalog size?
2. **Performance requirements** - Page load time targets? Search response time?
3. **Availability** - Uptime requirements? Critical business hours?


**Technical Constraints:**
4. **Technology stack** - Có restrictions về frameworks không? Em assume React là preferred?
5. **Infrastructure** - Cloud platform preferences? CDN requirements?
6. **Mobile strategy** - Mobile-first design hay desktop-first with responsive?


**Integration Requirements:**
7. **Third-party services** - Ngoài Stripe, có services nào khác cần integrate? (Email, analytics, shipping?)
8. **Legacy systems** - Có existing systems nào cần connect không?


**Người phỏng vấn:** Excellent follow-up questions! Đây cho thấy bạn thinking holistically về both business và technical aspects.


**Scale & Performance:**


- **Traffic**: Expect 10K concurrent users, 100K products trong Phase 1
- **Performance**: <2s page load, <500ms search response time
- **Availability**: 99.9% uptime, peak traffic 8PM-11PM EST


**Technical Stack:**


- **Frontend**: React strongly preferred, team expertise với Next.js
- **Infrastructure**: AWS ecosystem, CloudFront CDN required
- **Mobile**: Mobile-first approach, 60% traffic là mobile


**Integrations:**


- **Required**: Stripe (payments), SendGrid (emails), AWS S3 (images)
- **Future**: Analytics platform, shipping APIs, inventory management
- **Legacy**: None, đây là greenfield project


### [09:25 AM] Non-Functional Requirements Analysis


**Ứng viên:** Perfect! Based trên context này, em sẽ summarize requirements theo categories:


**Functional Requirements - MVP:**


**User Authentication & Management:**


- User registration/login với email
- Guest checkout capability
- Basic user profile management


**Product Catalog & Discovery:**


- Product listing với pagination
- Basic search với text query
- Category-based browsing
- Product detail pages với images, descriptions, pricing


**Shopping Experience:**


- Add to cart functionality
- Cart management (quantity update, remove items)
- Persistent cart across sessions (for logged-in users)
- Guest cart với browser storage


**Checkout Process:**


- Shipping address collection
- Payment integration với Stripe
- Order confirmation và email notifications
- Basic order history for registered users


**Vendor Management (Phase 1 basic):**


- Vendor registration với approval workflow
- Basic product upload capability
- Order notification system


**Non-Functional Requirements:**


**Performance:**


- **Page Load Time**: <2 seconds for all pages
- **Search Response**: <500ms for search queries
- **Image Loading**: Progressive loading với lazy loading
- **Mobile Performance**: <3s on 3G networks


**Scalability:**


- **Concurrent Users**: Support 10K concurrent users
- **Database**: Handle 100K products với room để grow
- **CDN**: Global content delivery để improve performance
- **Caching**: Aggressive caching strategy cho product data


**Availability & Reliability:**


- **Uptime**: 99.9% availability target
- **Error Handling**: Graceful degradation cho service failures
- **Monitoring**: Real-time performance monitoring
- **Backup**: Regular data backups và disaster recovery


**Security:**


- **Data Protection**: HTTPS everywhere, secure payment processing
- **Authentication**: Secure session management
- **Input Validation**: XSS và injection protection
- **PCI Compliance**: Secure payment handling via Stripe


**Usability & Accessibility:**


- **Mobile-First**: Responsive design across all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO**: Search engine optimization cho product discovery
- **Internationalization**: Foundation cho future i18n support


**Người phỏng vấn:** Outstanding requirements analysis! Tôi thấy several strong signals đây:


**Problem Exploration Excellence:**


- ✅ Systematic approach với structured questions
- ✅ Balance business và technical considerations
- ✅ Thought about phases và prioritization
- ✅ Identified key constraints và assumptions
- ✅ Comprehensive coverage of functional + non-functional requirements


**Technical Proficiency Indicators:**


- ✅ Understanding of performance metrics và targets
- ✅ Security considerations appropriate cho e-commerce
- ✅ Scalability thinking với specific numbers
- ✅ Mobile-first approach recognition


**Communication Skills:**


- ✅ Clear structure và organization
- ✅ Asked for clarification when needed
- ✅ Summarized findings effectively


Đây là exactly approach tôi expect từ Senior level candidate! Bây giờ chúng ta move sang Architecture phase.


---


## [RADIO Phase: Architecture] - Thiết Kế Kiến Trúc Tổng Quan


### [09:32 AM] High-Level Architecture Design


**Người phỏng vấn:** Great job với requirements exploration! Bây giờ chúng ta move sang **Architecture phase**.


Tôi muốn bạn design high-level architecture cho e-commerce platform này. Focus vào frontend architecture nhưng cũng consider how it integrates với backend services.


Đây là checkpoint thứ 2 cho **Architecture Design skills** và **Technical Proficiency**.


**Ứng viên:** Sounds good! Em sẽ approach này systematically, starting với overall system architecture và then dive deep vào frontend components.


**System Architecture Overview:**


Em propose một **3-tier architecture** với clear separation of concerns:


```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT TIER                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Next.js Application                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │   │
│  │  │ Pages   │ │Components│ │ Hooks   │ │ Utils  │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │            State Management                 │ │   │
│  │  │         (Redux Toolkit + RTK Query)        │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS/JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY                          │
│              (AWS API Gateway + Lambda)                 │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  MICROSERVICES TIER                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   User      │ │  Product    │ │      Order          ││
│  │  Service    │ │  Service    │ │     Service         ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   Cart      │ │  Vendor     │ │    Payment          ││
│  │  Service    │ │  Service    │ │    Service          ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
```


**Người phỏng vấn:** Good start! Tôi like việc bạn separate concerns clearly. Bây giờ dive deeper vào frontend architecture. Component breakdown sẽ như thế nào?


### [09:37 AM] Frontend Component Architecture


**Ứng viên:** Perfect! Em sẽ design frontend architecture với **component-based approach** và clear hierarchy:


**Frontend Architecture Layers:**


```javascript
// Application Architecture
src/
├── app/                    // Next.js App Router (App Directory)
│   ├── (shop)/            // Route groups for shop pages
│   │   ├── page.tsx       // Home page
│   │   ├── search/        // Search results
│   │   ├── products/      // Product listing & details
│   │   └── cart/          // Shopping cart
│   ├── checkout/          // Checkout flow
│   ├── account/           // User account pages
│   └── vendor/            // Vendor dashboard
├── components/            // Reusable UI components
│   ├── ui/               // Base design system components
│   ├── forms/            // Form components
│   ├── layout/           // Layout components
│   └── business/         // Business logic components
├── lib/                  // Utilities and configurations
│   ├── redux/           // State management
│   ├── api/             // API clients
│   ├── hooks/           // Custom React hooks
│   └── utils/           // Helper functions
├── types/               // TypeScript type definitions
└── styles/              // Global styles and themes
```


**Core Component Hierarchy:**


```
App Layout
├── Header
│   ├── Navigation
│   ├── SearchBar
│   ├── UserMenu
│   └── CartIcon
├── Main Content
│   ├── ProductCatalog
│   │   ├── ProductGrid
│   │   │   └── ProductCard
│   │   ├── FilterSidebar
│   │   └── Pagination
│   ├── ProductDetails
│   │   ├── ImageGallery
│   │   ├── ProductInfo
│   │   ├── ReviewsSection
│   │   └── AddToCartButton
│   ├── ShoppingCart
│   │   ├── CartItemsList
│   │   │   └── CartItem
│   │   ├── CartSummary
│   │   └── CheckoutButton
│   └── CheckoutFlow
│       ├── ShippingForm
│       ├── PaymentForm
│       └── OrderSummary
└── Footer
```


**Người phỏng vấn:** Excellent component breakdown! Tôi thấy bạn đã think through user flows và organize components logically. Bây giờ explain state management strategy và data flow.


### [09:42 AM] State Management & Data Flow Design


**Ứng viên:** Great question! State management là critical piece cho e-commerce platform. Em sẽ use **hybrid approach** với different strategies cho different types of state:


**State Management Strategy:**


```javascript
// 1. Server State Management: RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const ecommerceApi = createApi({
  reducerPath: 'ecommerceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Product', 'Cart', 'Order', 'User'],
  endpoints: (builder) => ({
    // Product endpoints
    getProducts: builder.query<ProductsResponse, ProductsParams>({
      query: ({ page, limit, category, search }) =>
        `products?page=${page}&limit=${limit}&category=${category}&search=${search}`,
      providesTags: ['Product'],
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Cart endpoints
    getCart: builder.query<Cart, void>({
      query: () => 'cart',
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<Cart, AddToCartRequest>({
      query: (item) => ({
        url: 'cart/items',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<Cart, UpdateCartItemRequest>({
      query: ({ id, quantity }) => ({
        url: `cart/items/${id}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
})
```


```javascript
// 2. Client State Management: Redux Toolkit
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  // UI State
  ui: {
    sidebarOpen: boolean
    currentTheme: 'light' | 'dark'
    notifications: Notification[]
  }

  // Search State
  search: {
    query: string
    filters: SearchFilters
    sortBy: SortOption
    recentSearches: string[]
  }

  // User Session State
  auth: {
    user: User | null
    token: string | null
    isAuthenticated: boolean
  }

  // Guest Cart State (for non-authenticated users)
  guestCart: {
    items: CartItem[]
    lastUpdated: string
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    currentTheme: 'light' as const,
    notifications: [],
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.currentTheme = action.payload
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      )
    },
  },
})
```


```javascript
// 3. Form State Management: React Hook Form
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const checkoutSchema = z.object({
  shipping: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(5, 'Valid postal code required'),
  }),
  payment: z.object({
    cardNumber: z.string().min(16, 'Valid card number required'),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Valid expiry date required'),
    cvv: z.string().min(3, 'Valid CVV required'),
  }),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export const CheckoutForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const onSubmit: SubmitHandler<CheckoutFormData> = (data) => {
    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```


**Data Flow Architecture:**


```
User Interaction
       │
       ▼
React Component
       │
       ├─── Local State (useState/useReducer)
       │    └─── UI interactions, form inputs
       │
       ├─── Global State (Redux)
       │    └─── App-wide state, auth, preferences
       │
       └─── Server State (RTK Query)
            └─── API data, caching, synchronization
                     │
                     ▼
                API Gateway
                     │
                     ▼
              Backend Services
                     │
                     ▼
                Database
```


**Người phỏng vấn:** Excellent state management design! Tôi particularly appreciate:


**Architecture Strengths:**


- ✅ **Separation of concerns**: Clear distinction giữa server state, client state, và form state
- ✅ **Modern patterns**: RTK Query cho server state, Redux Toolkit cho client state
- ✅ **Type safety**: Comprehensive TypeScript integration
- ✅ **Performance**: Built-in caching và optimistic updates với RTK Query


**Technical Proficiency Signals:**


- ✅ **React ecosystem knowledge**: Next.js App Router, React Hook Form, Zod validation
- ✅ **State management expertise**: Understanding of different state types và appropriate tools
- ✅ **Code organization**: Well-structured folder hierarchy


Bây giờ let's discuss component communication patterns và rendering strategies.


### [09:48 AM] Component Communication & Rendering Strategy


**Ứng viên:** Thanks! Em sẽ dive vào component communication patterns và rendering optimizations:


**Component Communication Patterns:**


```javascript
// 1. Props Down, Events Up Pattern
interface ProductCardProps {
  product: Product
  onAddToCart: (productId: string, quantity: number) => void
  onWishlist: (productId: string) => void
  variant?: 'grid' | 'list'
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onWishlist,
  variant = 'grid'
}) => {
  const handleAddToCart = () => {
    onAddToCart(product.id, 1)
  }

  return (
    <div className={`product-card product-card--${variant}`}>
      <ProductImage src={product.image} alt={product.name} />
      <ProductInfo product={product} />
      <Button onClick={handleAddToCart}>
        Add to Cart
      </Button>
    </div>
  )
}
```


```javascript
// 2. Context API for Component Tree Communication
const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: cart, isLoading } = useGetCartQuery()
  const [addToCart] = useAddToCartMutation()
  const [updateCartItem] = useUpdateCartItemMutation()

  const cartCount = useMemo(() =>
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0,
    [cart]
  )

  const contextValue: CartContextValue = {
    cart,
    cartCount,
    isLoading,
    addToCart: async (productId: string, quantity: number) => {
      try {
        await addToCart({ productId, quantity }).unwrap()
        // Optimistic update handled by RTK Query
      } catch (error) {
        // Error handling
      }
    },
    updateQuantity: async (itemId: string, quantity: number) => {
      await updateCartItem({ id: itemId, quantity }).unwrap()
    },
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
```


```javascript
// 3. Custom Hooks for Business Logic
export const useProductFilters = () => {
  const [filters, setFilters] = useState<ProductFilters>({
    category: '',
    priceRange: [0, 1000],
    rating: 0,
    inStock: false,
  })

  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  const applyFilter = useCallback((filterKey: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      category: '',
      priceRange: [0, 1000],
      rating: 0,
      inStock: false,
    })
  }, [])

  return {
    filters,
    sortBy,
    applyFilter,
    setSortBy,
    clearFilters,
  }
}
```


**Rendering Strategy với Next.js:**


```javascript
// 1. Server-Side Rendering cho SEO-critical pages
// app/products/[id]/page.tsx
export async function generateStaticParams() {
  // Generate static params for popular products
  const popularProducts = await getPopularProducts()
  return popularProducts.map((product) => ({
    id: product.id,
  }))
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Server-side data fetching
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <div>
      <ProductHero product={product} />
      <ProductDetails product={product} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={product.id} />
      </Suspense>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  return {
    title: `${product.name} - E-commerce Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  }
}
```


```javascript
// 2. Client-Side Rendering cho Interactive Components
'use client'

export const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const {
    data: products,
    isLoading,
    error
  } = useGetProductsQuery({
    search: query,
    page: 1,
    limit: 20,
  })

  if (isLoading) return <ProductGridSkeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="search-results">
      <SearchFilters />
      <ProductGrid products={products?.data || []} />
      <Pagination
        currentPage={products?.pagination.page || 1}
        totalPages={products?.pagination.totalPages || 1}
      />
    </div>
  )
}
```


```javascript
// 3. Hybrid Rendering với Streaming
// app/page.tsx (Home page)
export default function HomePage() {
  return (
    <div>
      {/* Static content - rendered on server */}
      <HeroBanner />
      <CategoryGrid />

      {/* Dynamic content - streamed */}
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <Suspense fallback={<ReviewsSkeleton />}>
        <LatestReviews />
      </Suspense>

      {/* Client-only content */}
      <RecentlyViewed />
    </div>
  )
}

// Server Component với data fetching
async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  return (
    <section className="featured-products">
      <h2>Featured Products</h2>
      <ProductGrid products={products} />
    </section>
  )
}
```


**Người phỏng vấn:** Outstanding architecture design! Bạn đã demonstrate được:


**Architecture Excellence:**


- ✅ **Clear component communication**: Props down/events up, Context API, custom hooks
- ✅ **Rendering strategy**: Smart mix của SSR, CSR, và streaming
- ✅ **Performance considerations**: Suspense boundaries, skeleton loading
- ✅ **SEO optimization**: Static generation, metadata generation


**Technical Proficiency:**


- ✅ **Next.js 13+ expertise**: App Router, Server Components, streaming
- ✅ **React patterns**: Custom hooks, Context API, proper TypeScript integration
- ✅ **Performance optimization**: Code splitting, lazy loading, caching


Đây là exactly level của architectural thinking tôi expect ở Senior level!


Bây giờ chúng ta move sang Data Model phase.


---


## [RADIO Phase: Data Model] - Mô Hình Dữ Liệu


### [09:55 AM] Entity Relationship Design


**Người phỏng vấn:** Excellent architecture work! Bây giờ chúng ta dive vào **Data Model phase**.


Tôi muốn bạn design comprehensive data model cho e-commerce platform, bao gồm entities, relationships, và data flow between frontend và backend.


**Ứng viên:** Absolutely! Em sẽ design data model với focus vào frontend data structures nhưng cũng consider backend relationships để ensure proper integration.


**Core Entities & Relationships:**


```typescript
// User & Authentication Entities
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'customer' | 'vendor' | 'admin'
  addresses: Address[]
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

interface Address {
  id: string
  userId: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  country: string
  postalCode: string
  phone?: string
  isDefault: boolean
}

interface UserPreferences {
  theme: 'light' | 'dark'
  currency: string
  language: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}
```


```typescript
// Product Catalog Entities
interface Product {
  id: string
  vendorId: string
  sku: string
  name: string
  description: string
  shortDescription?: string
  category: Category
  subcategory?: Category
  price: Price
  images: ProductImage[]
  variants?: ProductVariant[]
  attributes: ProductAttribute[]
  inventory: InventoryInfo
  seo: SEOMetadata
  status: 'active' | 'inactive' | 'draft'
  featuredUntil?: string
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  children?: Category[]
  productCount: number
}

interface Price {
  amount: number
  currency: string
  compareAtPrice?: number // For sale pricing
  costPrice?: number // Vendor cost
}

interface ProductImage {
  id: string
  url: string
  alt: string
  order: number
  variant?: string // Color variant this image represents
}

interface ProductVariant {
  id: string
  name: string // e.g., "Color", "Size"
  options: VariantOption[]
}

interface VariantOption {
  id: string
  value: string // e.g., "Red", "Large"
  price?: Price // Price difference from base price
  sku?: string
  inventory?: number
}

interface ProductAttribute {
  name: string
  value: string
  type: 'text' | 'number' | 'boolean' | 'select'
}

interface InventoryInfo {
  quantity: number
  trackQuantity: boolean
  allowBackorder: boolean
  lowStockThreshold: number
}

interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  slug: string
}
```


```typescript
// Shopping Cart & Order Entities
interface Cart {
  id: string
  userId?: string // null for guest carts
  sessionId?: string // for guest carts
  items: CartItem[]
  totals: CartTotals
  appliedCoupons: AppliedCoupon[]
  shippingAddress?: Address
  billingAddress?: Address
  createdAt: string
  updatedAt: string
  expiresAt: string
}

interface CartItem {
  id: string
  cartId: string
  product: Product
  variantId?: string
  quantity: number
  unitPrice: Price
  totalPrice: Price
  addedAt: string
}

interface CartTotals {
  subtotal: Price
  tax: Price
  shipping: Price
  discount: Price
  total: Price
}

interface AppliedCoupon {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  savings: Price
}
```


```typescript
// Order Management Entities
interface Order {
  id: string
  orderNumber: string
  userId?: string
  guestEmail?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  items: OrderItem[]
  totals: OrderTotals
  shippingAddress: Address
  billingAddress: Address
  payment: PaymentInfo
  shipping: ShippingInfo
  timeline: OrderEvent[]
  notes?: string
  createdAt: string
  updatedAt: string
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled'

interface OrderItem {
  id: string
  orderId: string
  product: Product
  variantId?: string
  quantity: number
  unitPrice: Price
  totalPrice: Price
  vendorId: string
}

interface OrderTotals {
  subtotal: Price
  tax: Price
  shipping: Price
  discount: Price
  total: Price
}

interface PaymentInfo {
  method: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
  processor: 'stripe' | 'paypal'
  transactionId: string
  last4?: string
  brand?: string
}

interface ShippingInfo {
  carrier: string
  method: string
  trackingNumber?: string
  estimatedDelivery?: string
  cost: Price
}

interface OrderEvent {
  type: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}
```


**Người phỏng vấn:** Excellent entity design! Tôi thấy bạn đã consider comprehensive relationships và business logic. Bây giờ explain data flow và state classification.


### [10:02 AM] Data Classification & State Management


**Ứng viên:** Thanks! Em sẽ classify data theo different persistence levels và ownership:


**Data Classification Matrix:**


```typescript
// 1. SERVER-ORIGINATED DATA (Persistent, authoritative source từ backend)
interface ServerState {
  // Product Catalog Data
  products: {
    entities: Record<string, Product>
    categories: Record<string, Category>
    searchResults: ProductSearchResult[]
    filters: ProductFilter[]
  }

  // User Data
  user: {
    profile: User | null
    addresses: Address[]
    orderHistory: Order[]
    preferences: UserPreferences
  }

  // Shopping Cart (for authenticated users)
  cart: Cart | null

  // Order Data
  orders: {
    current: Order | null
    history: Order[]
  }

  // Vendor Data (for vendor dashboard)
  vendor: {
    profile: VendorProfile
    products: Product[]
    orders: Order[]
    analytics: VendorAnalytics
  }
}
```


```typescript
// 2. CLIENT-ONLY DATA (UI state, preferences, temporary data)
interface ClientState {
  // UI State
  ui: {
    theme: 'light' | 'dark'
    sidebarOpen: boolean
    mobileMenuOpen: boolean
    notifications: Notification[]
    modals: {
      authModal: boolean
      cartSidebar: boolean
      quickView: string | null
    }
    loading: {
      page: boolean
      components: Record<string, boolean>
    }
  }

  // Search & Filtering State
  search: {
    query: string
    activeFilters: ProductFilter[]
    sortBy: SortOption
    viewMode: 'grid' | 'list'
    recentSearches: string[]
    suggestions: SearchSuggestion[]
  }

  // Form State (temporary during user input)
  forms: {
    checkout: CheckoutFormData
    productReview: ReviewFormData
    vendorRegistration: VendorRegistrationData
  }

  // Session Data
  session: {
    visitedProducts: string[]
    recentlyViewed: Product[]
    compareList: Product[]
    wishlist: string[] // Product IDs
    guestCart: CartItem[] // For non-authenticated users
  }

  // Navigation State
  navigation: {
    breadcrumbs: BreadcrumbItem[]
    currentPage: string
    previousPage: string
    canGoBack: boolean
  }
}
```


```typescript
// 3. HYBRID DATA (Combination of server + client state)
interface HybridState {
  // Product with client-side computed properties
  enhancedProducts: {
    [productId: string]: Product & {
      // Client-side computed
      isInWishlist: boolean
      isInCart: boolean
      cartQuantity: number
      isInCompare: boolean
      viewedAt?: string
      personalizedScore?: number
    }
  }

  // Cart with client-side optimizations
  enhancedCart: Cart & {
    // Client-side computed
    isValid: boolean
    hasOutOfStockItems: boolean
    hasChangedPrices: boolean
    estimatedTax: Price
    availableShippingMethods: ShippingMethod[]
  }

  // Search results with client-side enhancements
  enhancedSearchResults: ProductSearchResult & {
    // Client-side filters applied
    filteredResults: Product[]
    facets: SearchFacet[]
    suggestions: SearchSuggestion[]
    totalFiltered: number
  }
}
```


**Data Flow Patterns:**


```typescript
// RTK Query Endpoints với caching strategy
export const ecommerceApi = createApi({
  reducerPath: 'ecommerceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/',
  }),
  tagTypes: ['Product', 'Cart', 'Order', 'User', 'Category'],
  endpoints: (builder) => ({
    // Product endpoints với aggressive caching
    getProducts: builder.query<ProductsResponse, ProductsParams>({
      query: (params) => ({
        url: 'products',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Cart với optimistic updates
    addToCart: builder.mutation<Cart, AddToCartRequest>({
      query: (item) => ({
        url: 'cart/items',
        method: 'POST',
        body: item,
      }),
      // Optimistic update
      async onQueryStarted(item, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ecommerceApi.util.updateQueryData('getCart', undefined, (draft) => {
            // Optimistically add item to cart
            const existingItem = draft.items.find(
              cartItem => cartItem.product.id === item.productId
            )

            if (existingItem) {
              existingItem.quantity += item.quantity
            } else {
              // Add new item (simplified - would need product data)
              draft.items.push({
                id: `temp-${Date.now()}`,
                cartId: draft.id,
                product: {} as Product, // Would be populated
                quantity: item.quantity,
                unitPrice: {} as Price,
                totalPrice: {} as Price,
                addedAt: new Date().toISOString(),
              })
            }

            // Recalculate totals
            draft.totals = calculateCartTotals(draft.items)
          })
        )

        try {
          await queryFulfilled
        } catch {
          // Revert optimistic update on error
          patchResult.undo()
        }
      },
      invalidatesTags: ['Cart'],
    }),
  }),
})
```


```typescript
// Client State Selectors với memoization
export const selectEnhancedProducts = createSelector(
  [
    (state: RootState) => state.ecommerceApi.queries,
    (state: RootState) => state.session.wishlist,
    (state: RootState) => state.session.guestCart,
  ],
  (queries, wishlist, guestCart) => {
    const products = Object.values(queries)
      .filter(query => query?.data && query.endpointName === 'getProducts')
      .flatMap(query => (query.data as ProductsResponse).data)

    return products.map(product => ({
      ...product,
      isInWishlist: wishlist.includes(product.id),
      isInCart: guestCart.some(item => item.product.id === product.id),
      cartQuantity: guestCart
        .filter(item => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0),
    }))
  }
)
```


**Người phỏng vấn:** Outstanding data modeling! Bạn đã demonstrate:


**Technical Proficiency:**


- ✅ **Comprehensive entity design**: Well-thought relationships và business logic
- ✅ **State classification**: Clear separation của server vs client vs hybrid state
- ✅ **Performance optimization**: RTK Query caching, optimistic updates, memoized selectors
- ✅ **TypeScript expertise**: Strong typing cho complex data structures


**Architecture Excellence:**


- ✅ **Data flow design**: Proper separation of concerns
- ✅ **Scalability considerations**: Normalization, caching strategies
- ✅ **Business logic encapsulation**: Proper entity relationships


Bây giờ move sang Interface Definition phase để see how these data models translate thành APIs và component interfaces.


---


## [RADIO Phase: Interface Definition] - Định Nghĩa Giao Diện


### [10:08 AM] API Interface Design


**Người phỏng vấn:** Excellent data modeling! Bây giờ chúng ta design **API interfaces** và **component interfaces** để connect data models với actual implementation.


Focus vào both external APIs (client-server) và internal APIs (component interfaces, hooks).


**Ứng viên:** Perfect! Em sẽ design comprehensive interface definitions, starting với HTTP APIs và then move to React component interfaces.


**HTTP API Specifications:**


```typescript
// 1. Product Catalog APIs
interface ProductAPI {
  // GET /api/v1/products
  getProducts(params: {
    page?: number
    limit?: number
    category?: string
    subcategory?: string
    search?: string
    filters?: ProductFilters
    sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating' | 'newest'
    currency?: string
  }): Promise<{
    data: Product[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    filters: AvailableFilters
    facets: SearchFacet[]
  }>

  // GET /api/v1/products/:id
  getProduct(id: string, params?: {
    currency?: string
    include?: ('variants' | 'reviews' | 'related')[]
  }): Promise<{
    data: Product
    related?: Product[]
    reviews?: Review[]
    analytics?: {
      views: number
      purchases: number
      rating: number
    }
  }>

  // GET /api/v1/categories
  getCategories(params?: {
    parent?: string
    level?: number
    includeProducts?: boolean
  }): Promise<{
    data: Category[]
    tree?: CategoryTree
  }>

  // GET /api/v1/search/suggestions
  getSearchSuggestions(query: string): Promise<{
    suggestions: string[]
    products: Product[]
    categories: Category[]
  }>
}

interface ProductFilters {
  priceRange?: [number, number]
  brands?: string[]
  rating?: number
  availability?: 'in_stock' | 'out_of_stock' | 'all'
  attributes?: Record<string, string[]>
}

interface AvailableFilters {
  priceRange: {
    min: number
    max: number
  }
  brands: Array<{
    id: string
    name: string
    count: number
  }>
  attributes: Array<{
    name: string
    type: 'select' | 'range' | 'checkbox'
    options: Array<{
      value: string
      label: string
      count: number
    }>
  }>
}
```


```typescript
// 2. Shopping Cart APIs
interface CartAPI {
  // GET /api/v1/cart
  getCart(): Promise<{
    data: Cart
  }>

  // POST /api/v1/cart/items
  addToCart(item: {
    productId: string
    variantId?: string
    quantity: number
    customizations?: Record<string, any>
  }): Promise<{
    data: Cart
    analytics?: {
      event: 'add_to_cart'
      product: Product
      value: number
    }
  }>

  // PUT /api/v1/cart/items/:itemId
  updateCartItem(itemId: string, updates: {
    quantity: number
  }): Promise<{
    data: Cart
  }>

  // DELETE /api/v1/cart/items/:itemId
  removeFromCart(itemId: string): Promise<{
    data: Cart
  }>

  // POST /api/v1/cart/coupons
  applyCoupon(code: string): Promise<{
    data: Cart
    coupon: AppliedCoupon
  }>

  // DELETE /api/v1/cart/coupons/:code
  removeCoupon(code: string): Promise<{
    data: Cart
  }>

  // POST /api/v1/cart/shipping
  updateShipping(address: Address): Promise<{
    data: Cart
    shippingMethods: ShippingMethod[]
  }>
}
```


```typescript
// 3. Order Management APIs
interface OrderAPI {
  // POST /api/v1/orders
  createOrder(order: {
    cartId: string
    shippingAddress: Address
    billingAddress: Address
    shippingMethod: string
    paymentMethod: PaymentMethodRequest
    notes?: string
  }): Promise<{
    data: Order
    paymentIntent?: {
      clientSecret: string
      publicKey: string
    }
  }>

  // GET /api/v1/orders/:id
  getOrder(id: string): Promise<{
    data: Order
    shipping?: {
      trackingUrl: string
      estimatedDelivery: string
      updates: ShippingUpdate[]
    }
  }>

  // GET /api/v1/orders
  getOrders(params?: {
    page?: number
    limit?: number
    status?: OrderStatus[]
    startDate?: string
    endDate?: string
  }): Promise<{
    data: Order[]
    pagination: PaginationInfo
    summary: {
      total: number
      totalValue: Price
      byStatus: Record<OrderStatus, number>
    }
  }>

  // PUT /api/v1/orders/:id/cancel
  cancelOrder(id: string, reason?: string): Promise<{
    data: Order
  }>
}
```


**Người phỏng vấn:** Excellent API design! Tôi thấy bạn đã consider comprehensive responses với metadata, analytics data, và proper error handling. Bây giờ let's see React component interfaces.


### [10:15 AM] React Component Interface Design


**Ứng viên:** Thanks! Em sẽ design React component interfaces với focus vào reusability, type safety, và developer experience:


**Core Component Interfaces:**


```typescript
// 1. Product Components
interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list' | 'featured' | 'compact'
  showQuickActions?: boolean
  showCompare?: boolean
  showWishlist?: boolean
  onProductClick?: (product: Product) => void
  onAddToCart?: (productId: string, quantity: number) => void
  onAddToWishlist?: (productId: string) => void
  onAddToCompare?: (productId: string) => void
  className?: string
  lazy?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  showQuickActions = true,
  showCompare = false,
  showWishlist = true,
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  onAddToCompare,
  className,
  lazy = true,
}) => {
  // Component implementation
}

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  error?: string | null
  variant?: 'grid' | 'list'
  columns?: 2 | 3 | 4 | 5
  showFilters?: boolean
  showSorting?: boolean
  showPagination?: boolean
  onProductSelect?: (product: Product) => void
  onLoadMore?: () => void
  hasMore?: boolean
  className?: string
}

interface ProductDetailsProps {
  product: Product
  variant?: ProductVariant[]
  selectedVariant?: string
  quantity?: number
  onVariantChange?: (variantId: string) => void
  onQuantityChange?: (quantity: number) => void
  onAddToCart?: (productId: string, variantId: string | undefined, quantity: number) => void
  showReviews?: boolean
  showRelated?: boolean
  showDescription?: boolean
  className?: string
}
```


```typescript
// 2. Shopping Cart Components
interface CartItemProps {
  item: CartItem
  editable?: boolean
  showImage?: boolean
  showProductLink?: boolean
  onQuantityChange?: (itemId: string, quantity: number) => void
  onRemove?: (itemId: string) => void
  onMoveToWishlist?: (itemId: string) => void
  className?: string
}

interface CartSummaryProps {
  cart: Cart
  showCoupons?: boolean
  showShipping?: boolean
  showTax?: boolean
  editable?: boolean
  onCouponApply?: (code: string) => void
  onCouponRemove?: (code: string) => void
  onShippingChange?: (method: string) => void
  className?: string
}

interface MiniCartProps {
  isOpen: boolean
  onClose: () => void
  showCheckoutButton?: boolean
  maxItems?: number
  position?: 'right' | 'left'
  onCheckout?: () => void
  className?: string
}
```


```typescript
// 3. Form Components với Compound Pattern
interface FormFieldProps {
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helperText?: string
  className?: string
  children?: React.ReactNode
}

interface CheckoutFormProps {
  initialData?: Partial<CheckoutFormData>
  onSubmit: (data: CheckoutFormData) => Promise<void>
  onStepChange?: (step: CheckoutStep) => void
  showSteps?: boolean
  allowGuestCheckout?: boolean
  className?: string
}

// Compound Component Pattern
export const CheckoutForm: React.FC<CheckoutFormProps> & {
  Step: React.FC<CheckoutStepProps>
  ShippingForm: React.FC<ShippingFormProps>
  PaymentForm: React.FC<PaymentFormProps>
  ReviewStep: React.FC<ReviewStepProps>
} = ({ onSubmit, ...props }) => {
  // Main form logic
}

CheckoutForm.Step = ({ children, ...props }) => {
  // Step wrapper component
}

CheckoutForm.ShippingForm = ({ onSubmit, ...props }) => {
  // Shipping form implementation
}

CheckoutForm.PaymentForm = ({ onSubmit, ...props }) => {
  // Payment form implementation
}

CheckoutForm.ReviewStep = ({ data, onConfirm, ...props }) => {
  // Review step implementation
}
```


**Custom Hooks Interfaces:**


```typescript
// 1. Data Fetching Hooks
interface UseProductsOptions {
  initialParams?: ProductsParams
  enabled?: boolean
  staleTime?: number
  keepPreviousData?: boolean
}

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  totalCount: number
  filters: AvailableFilters
  refetch: () => void
}

export const useProducts = (options?: UseProductsOptions): UseProductsReturn => {
  // Implementation using RTK Query
}

interface UseCartReturn {
  cart: Cart | null
  itemCount: number
  totalPrice: Price
  isLoading: boolean
  addToCart: (productId: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: (code: string) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCart = (): UseCartReturn => {
  // Implementation
}
```


```typescript
// 2. Business Logic Hooks
interface UseProductFiltersReturn {
  filters: ProductFilters
  activeFilters: Array<{ key: string; value: string; label: string }>
  setFilter: (key: keyof ProductFilters, value: any) => void
  removeFilter: (key: keyof ProductFilters) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

export const useProductFilters = (
  initialFilters?: ProductFilters
): UseProductFiltersReturn => {
  // Implementation
}

interface UseCheckoutReturn {
  currentStep: CheckoutStep
  canProceed: boolean
  isProcessing: boolean
  errors: Record<string, string>
  goToStep: (step: CheckoutStep) => void
  goToNextStep: () => void
  goToPrevStep: () => void
  submitStep: (data: any) => Promise<void>
  submitOrder: () => Promise<Order>
}

export const useCheckout = (
  cart: Cart,
  options?: CheckoutOptions
): UseCheckoutReturn => {
  // Implementation
}
```


**Event Handler Interfaces:**


```typescript
// Event System for Analytics và Tracking
interface ProductEvents {
  'product:view': {
    product: Product
    source: 'search' | 'category' | 'recommendation' | 'direct'
  }
  'product:add_to_cart': {
    product: Product
    quantity: number
    variantId?: string
  }
  'product:add_to_wishlist': {
    product: Product
  }
  'cart:update': {
    cart: Cart
    action: 'add' | 'update' | 'remove'
    item?: CartItem
  }
  'checkout:step_complete': {
    step: CheckoutStep
    data: any
  }
  'order:complete': {
    order: Order
  }
}

interface EventEmitter {
  emit<K extends keyof ProductEvents>(
    event: K,
    data: ProductEvents[K]
  ): void

  on<K extends keyof ProductEvents>(
    event: K,
    handler: (data: ProductEvents[K]) => void
  ): () => void
}

// Usage trong components
export const useAnalytics = () => {
  const emit = useCallback(<K extends keyof ProductEvents>(
    event: K,
    data: ProductEvents[K]
  ) => {
    // Send to analytics service
    analytics.track(event, data)
  }, [])

  return { emit }
}
```


**Người phỏng vấn:** Exceptional interface design! Bạn đã demonstrate:


**Technical Proficiency:**


- ✅ **TypeScript mastery**: Complex generic types, conditional types, compound components
- ✅ **React patterns**: Compound components, custom hooks, proper prop design
- ✅ **API design**: RESTful principles, comprehensive response structures
- ✅ **Event architecture**: Type-safe event system


**Architecture Excellence:**


- ✅ **Component composition**: Flexible, reusable component interfaces
- ✅ **Separation of concerns**: Clear boundaries between data, UI, và business logic
- ✅ **Developer experience**: Well-documented interfaces với good defaults


**Exploration và Tradeoffs:**


- ✅ **Multiple patterns**: Showed different approaches (compound components, render props concepts)
- ✅ **Flexibility**: Components có configurable behavior
- ✅ **Performance considerations**: Lazy loading, memoization opportunities


Đây là exactly level của interface design tôi expect từ Senior level!


Bây giờ chúng ta move to final RADIO phase - **Optimizations and Deep Dive**.


---


## [RADIO Phase: Optimizations] - Tối Ưu Hóa và Đi Sâu


### [10:22 AM] Performance Optimization Strategies


**Người phỏng vấn:** Outstanding interface work! Bây giờ chúng ta dive vào **Optimizations phase** - đây là phase quan trọng nhất (40% thời gian) nơi chúng ta explore performance, scalability, user experience, và advanced topics.


Let's start với performance optimization strategies cho e-commerce platform.


**Ứng viên:** Absolutely! Performance là critical cho e-commerce success. Em sẽ break down optimizations theo different aspects:


**1. Rendering Performance Optimizations:**


```typescript
// Component Optimization với React.memo và useMemo
export const ProductCard = React.memo<ProductCardProps>(({
  product,
  onAddToCart,
  variant = 'grid'
}) => {
  // Memoize expensive calculations
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.price.currency,
    }).format(product.price.amount)
  }, [product.price.amount, product.price.currency])

  // Memoize event handlers để prevent unnecessary re-renders
  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product.id, 1)
  }, [onAddToCart, product.id])

  // Optimized image loading với placeholder
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`product-card product-card--${variant}`}>
      <div className="product-image">
        <Image
          src={product.images[0]?.url}
          alt={product.name}
          width={300}
          height={300}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">{formattedPrice}</p>
        <button onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison để optimize re-renders
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price.amount === nextProps.product.price.amount &&
    prevProps.variant === nextProps.variant
  )
})
```


```typescript
// Virtual Scrolling cho Large Product Lists
import { FixedSizeGrid as Grid } from 'react-window'

interface VirtualizedProductGridProps {
  products: Product[]
  columns: number
  onProductClick: (product: Product) => void
}

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  columns,
  onProductClick
}) => {
  const ITEM_HEIGHT = 400
  const ITEM_WIDTH = 300

  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const productIndex = rowIndex * columns + columnIndex
    const product = products[productIndex]

    if (!product) return null

    return (
      <div style={style}>
        <ProductCard
          product={product}
          onProductClick={() => onProductClick(product)}
        />
      </div>
    )
  }, [products, columns, onProductClick])

  const containerHeight = Math.min(
    800, // Max height
    Math.ceil(products.length / columns) * ITEM_HEIGHT
  )

  return (
    <Grid
      columnCount={columns}
      columnWidth={ITEM_WIDTH}
      height={containerHeight}
      rowCount={Math.ceil(products.length / columns)}
      rowHeight={ITEM_HEIGHT}
      width="100%"
      overscanRowCount={2}
      overscanColumnCount={1}
    >
      {Cell}
    </Grid>
  )
}
```


**2. Bundle Optimization và Code Splitting:**


```typescript
// Route-based Code Splitting với Next.js
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const ProductDetails = lazy(() =>
  import('./ProductDetails').then(module => ({
    default: module.ProductDetails
  }))
)

const CheckoutFlow = lazy(() =>
  import('./CheckoutFlow').then(module => ({
    default: module.CheckoutFlow
  }))
)

const VendorDashboard = lazy(() =>
  import('./VendorDashboard').then(module => ({
    default: module.VendorDashboard
  }))
)

// Smart loading với preloading
export const ProductPage = ({ productId }: { productId: string }) => {
  // Preload checkout flow khi user adds to cart
  const [preloadCheckout, setPreloadCheckout] = useState(false)

  const handleAddToCart = useCallback(() => {
    if (!preloadCheckout) {
      import('./CheckoutFlow')
      setPreloadCheckout(true)
    }
    // Add to cart logic
  }, [preloadCheckout])

  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetails
        productId={productId}
        onAddToCart={handleAddToCart}
      />
    </Suspense>
  )
}
```


```typescript
// Bundle Analysis và Optimization
// next.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer chỉ trong development
    if (dev && !isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }

    // Tree shaking optimization
    config.optimization.usedExports = true

    // Split chunks strategy
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    }

    return config
  },

  // Image optimization
  images: {
    domains: ['images.example.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Compression
  compress: true,

  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}
```


**Người phỏng vấn:** Excellent performance optimization strategies! Tôi thấy bạn covered rendering performance, bundle optimization, và infrastructure considerations. Let's dive deeper vào data loading strategies.


### [10:29 AM] Data Loading & Caching Strategies


**Ứng viên:** Absolutely! Data loading strategy là crucial cho e-commerce performance. Em sẽ design comprehensive approach:


**3. Advanced Data Loading Patterns:**


```typescript
// Intelligent Prefetching Strategy
export const useProductPrefetch = () => {
  const [prefetchProduct] = useLazyGetProductQuery()
  const [prefetchRelated] = useLazyGetRelatedProductsQuery()

  // Prefetch on hover với debouncing
  const prefetchOnHover = useMemo(() =>
    debounce((productId: string) => {
      prefetchProduct(productId)
      // Prefetch related products for upselling
      prefetchRelated({ productId, limit: 4 })
    }, 200),
    [prefetchProduct, prefetchRelated]
  )

  // Prefetch next page của search results
  const prefetchNextPage = useCallback((currentPage: number, hasNext: boolean) => {
    if (hasNext) {
      const nextPageParams = { page: currentPage + 1 }
      prefetchProduct(nextPageParams)
    }
  }, [prefetchProduct])

  // Prefetch based trên user behavior
  const prefetchBasedOnIntent = useCallback((products: Product[]) => {
    // Prefetch most popular products
    const popularProducts = products
      .sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0))
      .slice(0, 3)

    popularProducts.forEach(product => {
      prefetchProduct(product.id)
    })
  }, [prefetchProduct])

  return {
    prefetchOnHover,
    prefetchNextPage,
    prefetchBasedOnIntent,
  }
}
```


```typescript
// Multi-tier Caching Strategy
class CacheManager {
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = {
    products: 5 * 60 * 1000, // 5 minutes
    categories: 30 * 60 * 1000, // 30 minutes
    cart: 1 * 60 * 1000, // 1 minute
    user: 10 * 60 * 1000, // 10 minutes
  }

  set<T>(key: string, data: T, type: keyof typeof this.CACHE_TTL): void {
    const ttl = this.CACHE_TTL[type]
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    // Also store trong localStorage cho persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl,
        }))
      } catch (error) {
        console.warn('Failed to cache to localStorage:', error)
      }
    }
  }

  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && Date.now() - memoryItem.timestamp < memoryItem.ttl) {
      return memoryItem.data
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Date.now() - parsed.timestamp < parsed.ttl) {
            // Restore to memory cache
            this.memoryCache.set(key, parsed)
            return parsed.data
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage cache:', error)
      }
    }

    return null
  }

  invalidate(pattern: string): void {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // Invalidate localStorage cache
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('cache_') && key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      }
    }
  }
}

export const cacheManager = new CacheManager()
```


```typescript
// Background Sync và Offline Support
export const useOfflineCart = () => {
  const [pendingActions, setPendingActions] = useState<CartAction[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync pending actions khi back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions()
    }
  }, [isOnline, pendingActions])

  const addToCartOffline = useCallback((productId: string, quantity: number) => {
    const action: CartAction = {
      type: 'ADD_TO_CART',
      payload: { productId, quantity },
      timestamp: Date.now(),
    }

    // Add to pending actions
    setPendingActions(prev => [...prev, action])

    // Update local state optimistically
    // This would integrate với local cart state
  }, [])

  const syncPendingActions = useCallback(async () => {
    const actionsToSync = [...pendingActions]
    setPendingActions([])

    for (const action of actionsToSync) {
      try {
        switch (action.type) {
          case 'ADD_TO_CART':
            await addToCartMutation(action.payload).unwrap()
            break
          case 'UPDATE_QUANTITY':
            await updateCartItemMutation(action.payload).unwrap()
            break
          case 'REMOVE_ITEM':
            await removeFromCartMutation(action.payload).unwrap()
            break
        }
      } catch (error) {
        // Re-add failed actions to pending
        setPendingActions(prev => [...prev, action])
        console.error('Failed to sync action:', action, error)
      }
    }
  }, [pendingActions])

  return {
    isOnline,
    pendingActions: pendingActions.length,
    addToCartOffline,
  }
}
```


**4. Search Performance Optimization:**


```typescript
// Debounced Search với Smart Caching
export const useOptimizedSearch = () => {
  const [searchCache] = useState(() => new Map<string, ProductSearchResult>())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  // Debounced search để avoid excessive API calls
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (query.length < 2) return

      // Check cache first
      const cached = searchCache.get(query)
      if (cached) {
        return cached
      }

      try {
        const results = await searchProducts({ query }).unwrap()
        searchCache.set(query, results)
        return results
      } catch (error) {
        console.error('Search failed:', error)
      }
    }, 300),
    [searchCache]
  )

  // Predictive search suggestions
  const updateSuggestions = useMemo(
    () => debounce(async (query: string) => {
      if (query.length >= 1) {
        try {
          const suggestions = await getSearchSuggestions(query).unwrap()
          setSearchSuggestions(suggestions.suggestions)
        } catch (error) {
          console.error('Suggestions failed:', error)
        }
      } else {
        setSearchSuggestions([])
      }
    }, 150),
    []
  )

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
    updateSuggestions(query)
  }, [debouncedSearch, updateSuggestions])

  return {
    searchQuery,
    searchSuggestions,
    handleSearchChange,
  }
}
```


**Người phỏng vấn:** Outstanding data loading optimizations! Bạn đã show deep understanding of caching layers, offline support, và search optimization. Đây là exactly level của technical depth tôi expect.


Bây giờ let's explore user experience optimizations và accessibility considerations.


### [10:36 AM] User Experience & Accessibility Optimizations


**Ứng viên:** Perfect! UX và accessibility là absolutely critical cho e-commerce success. Em sẽ focus vào creating inclusive, performant user experiences:


**5. Loading States & Skeleton Optimization:**


```typescript
// Smart Skeleton Loading Components
export const ProductCardSkeleton: React.FC<{ variant?: 'grid' | 'list' }> = ({
  variant = 'grid'
}) => {
  return (
    <div
      className={`product-card-skeleton product-card-skeleton--${variant}`}
      role="status"
      aria-label="Loading product information"
    >
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-price" />
        <div className="skeleton-button" />
      </div>

      <style jsx>{`
        .skeleton-image {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

// Progressive Loading với Intersection Observer
export const ProgressiveProductGrid: React.FC<{
  products: Product[]
  loading: boolean
}> = ({ products, loading }) => {
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([])
  const [loadedCount, setLoadedCount] = useState(12) // Initial batch

  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleProducts(products.slice(0, loadedCount))
  }, [products, loadedCount])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && loadedCount < products.length) {
          setLoadedCount(prev => Math.min(prev + 6, products.length))
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [loading, loadedCount, products.length])

  return (
    <div className="product-grid">
      {visibleProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}

      {loading && Array.from({ length: 6 }).map((_, index) => (
        <ProductCardSkeleton key={`skeleton-${index}`} />
      ))}

      {loadedCount < products.length && (
        <div ref={loadMoreRef} className="load-more-trigger" />
      )}
    </div>
  )
}
```


**6. Comprehensive Accessibility Implementation:**


```typescript
// Accessible Product Search với Screen Reader Support
export const AccessibleSearchBox: React.FC = () => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  const suggestionId = useMemo(() =>
    activeSuggestion >= 0 ? `suggestion-${activeSuggestion}` : undefined,
    [activeSuggestion]
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestion(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break

      case 'Enter':
        if (activeSuggestion >= 0) {
          e.preventDefault()
          setQuery(suggestions[activeSuggestion])
          setShowSuggestions(false)
          // Perform search
        }
        break

      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestion(-1)
        break
    }
  }, [suggestions, activeSuggestion])

  return (
    <div className="search-container" role="search">
      <label htmlFor="product-search" className="sr-only">
        Search for products
      </label>

      <input
        ref={searchInputRef}
        id="product-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-describedby="search-description"
        aria-activedescendant={suggestionId}
        placeholder="Search products..."
        className="search-input"
      />

      <div id="search-description" className="sr-only">
        Use arrow keys to navigate suggestions. Press Enter to select.
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="suggestions-list"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === activeSuggestion}
              className={`suggestion-item ${
                index === activeSuggestion ? 'active' : ''
              }`}
              onClick={() => {
                setQuery(suggestion)
                setShowSuggestions(false)
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```


```typescript
// Accessible Shopping Cart với Live Regions
export const AccessibleShoppingCart: React.FC = () => {
  const { cart, updateQuantity, removeItem } = useCart()
  const [announcements, setAnnouncements] = useState<string[]>([])

  // Announce cart changes to screen readers
  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message])
    // Clear announcement after delay
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 1000)
  }, [])

  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    const item = cart?.items.find(item => item.id === itemId)
    if (item) {
      updateQuantity(itemId, newQuantity)
      announce(`${item.product.name} quantity updated to ${newQuantity}`)
    }
  }, [cart, updateQuantity, announce])

  const handleRemoveItem = useCallback((itemId: string) => {
    const item = cart?.items.find(item => item.id === itemId)
    if (item) {
      removeItem(itemId)
      announce(`${item.product.name} removed from cart`)
    }
  }, [cart, removeItem, announce])

  return (
    <section aria-labelledby="cart-heading" className="shopping-cart">
      <h2 id="cart-heading">Shopping Cart</h2>

      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>

      {cart?.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul className="cart-items" role="list">
            {cart?.items.map((item) => (
              <li key={item.id} className="cart-item" role="listitem">
                <img
                  src={item.product.images[0]?.url}
                  alt={item.product.name}
                  width={80}
                  height={80}
                />

                <div className="item-details">
                  <h3>{item.product.name}</h3>
                  <p className="price">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>

                <div className="quantity-controls">
                  <label htmlFor={`quantity-${item.id}`} className="sr-only">
                    Quantity for {item.product.name}
                  </label>

                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${item.product.name}`}
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>

                  <input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                    }
                    aria-describedby={`quantity-help-${item.id}`}
                  />

                  <div id={`quantity-help-${item.id}`} className="sr-only">
                    Current quantity: {item.quantity}
                  </div>

                  <button
                    type="button"
                    aria-label={`Increase quantity of ${item.product.name}`}
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${item.product.name} from cart`}
                  onClick={() => handleRemoveItem(item.id)}
                  className="remove-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-summary" aria-labelledby="summary-heading">
            <h3 id="summary-heading">Order Summary</h3>
            <dl className="summary-details">
              <dt>Subtotal:</dt>
              <dd>{formatPrice(cart.totals.subtotal)}</dd>
              <dt>Tax:</dt>
              <dd>{formatPrice(cart.totals.tax)}</dd>
              <dt>Total:</dt>
              <dd><strong>{formatPrice(cart.totals.total)}</strong></dd>
            </dl>
          </div>
        </>
      )}
    </section>
  )
}
```


**7. Mobile Performance & Touch Optimization:**


```typescript
// Touch-optimized Component với Gesture Support
export const TouchOptimizedProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isPressed, setIsPressed] = useState(false)

  // Touch handlers với proper feedback
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setIsPressed(true)

    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Swipe gestures
    if (distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swipe right - add to wishlist
          // onAddToWishlist?.(product.id)
        } else {
          // Swipe left - quick add to cart
          onAddToCart?.(product.id, 1)
        }
      }
    }

    setTouchStart(null)
    setIsPressed(false)
  }, [touchStart, product.id, onAddToCart])

  return (
    <div
      className={`product-card ${isPressed ? 'pressed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`${product.name}, ${formatPrice(product.price)}`}
    >
      <div className="product-image">
        <Image
          src={product.images[0]?.url}
          alt={product.name}
          width={300}
          height={300}
          priority={false}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Touch target guidelines: minimum 44px */}
        <button
          className="quick-view-button"
          onClick={() => onQuickView?.(product)}
          aria-label={`Quick view ${product.name}`}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          👁
        </button>
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">{formatPrice(product.price)}</p>

        {/* Large touch targets cho mobile */}
        <button
          className="add-to-cart-button"
          onClick={() => onAddToCart?.(product.id, 1)}
          style={{ minHeight: 48, fontSize: 16 }}
        >
          Add to Cart
        </button>
      </div>

      {/* Visual feedback cho touch interactions */}
      <style jsx>{`
        .product-card.pressed {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }

        .add-to-cart-button {
          /* Ensure button is easily tappable on mobile */
          min-height: 48px;
          min-width: 120px;
          font-size: 16px; /* Prevent zoom on iOS */
        }

        @media (max-width: 768px) {
          .product-card {
            /* Larger touch targets on mobile */
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
```


**Người phỏng vấn:** Exceptional UX và accessibility work! Bạn đã demonstrate:


**Product & UX Sense Excellence:**


- ✅ **Progressive loading**: Smart skeleton loading và intersection observer
- ✅ **Accessibility compliance**: Comprehensive ARIA implementation, screen reader support
- ✅ **Mobile optimization**: Touch gestures, proper target sizes, haptic feedback
- ✅ **User feedback**: Live regions, announcements, visual feedback


**Technical Proficiency Signals:**


- ✅ **Web standards**: Proper semantic HTML, ARIA attributes, WCAG compliance
- ✅ **Performance**: Intersection Observer, progressive loading, optimized images
- ✅ **Mobile development**: Touch event handling, responsive design, iOS considerations


Đây là exactly level của user experience focus tôi expect từ Senior level!


Bây giờ let's explore security và scalability considerations.


### [10:43 AM] Security & Scalability Deep Dive


**Ứng viên:** Thanks! Em sẽ dive vào security và scalability - critical aspects cho e-commerce platform success:


**8. Frontend Security Implementation:**


```typescript
// XSS Protection và Content Security Policy
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://images.example.com https://*.stripe.com",
              "connect-src 'self' https://api.example.com https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}
```


```typescript
// Input Sanitization và Validation
import DOMPurify from 'dompurify'
import { z } from 'zod'

// Secure Product Review Component
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  content: z.string().min(10).max(1000),
  email: z.string().email(),
})

export const ProductReviewForm: React.FC<{ productId: string }> = ({ productId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  })

  const onSubmit = useCallback(async (data: ReviewFormData) => {
    try {
      setIsSubmitting(true)

      // Client-side sanitization
      const sanitizedData = {
        ...data,
        title: DOMPurify.sanitize(data.title, { ALLOWED_TAGS: [] }),
        content: DOMPurify.sanitize(data.content, {
          ALLOWED_TAGS: ['p', 'br'],
          ALLOWED_ATTR: []
        }),
      }

      // Rate limiting check
      const lastSubmission = localStorage.getItem('lastReviewSubmission')
      if (lastSubmission && Date.now() - parseInt(lastSubmission) < 60000) {
        throw new Error('Please wait before submitting another review')
      }

      await submitReview({
        productId,
        ...sanitizedData,
      }).unwrap()

      localStorage.setItem('lastReviewSubmission', Date.now().toString())

    } catch (error) {
      console.error('Review submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [productId])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-group">
        <label htmlFor="rating">Rating</label>
        <select
          {...register('rating', { valueAsNumber: true })}
          id="rating"
          aria-describedby={errors.rating ? 'rating-error' : undefined}
        >
          <option value="">Select rating</option>
          {[1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num} star{num !== 1 ? 's' : ''}</option>
          ))}
        </select>
        {errors.rating && (
          <div id="rating-error" className="error-message" role="alert">
            {errors.rating.message}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="title">Review Title</label>
        <input
          {...register('title')}
          type="text"
          id="title"
          maxLength={100}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <div id="title-error" className="error-message" role="alert">
            {errors.title.message}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="content">Review Content</label>
        <textarea
          {...register('content')}
          id="content"
          maxLength={1000}
          rows={4}
          aria-describedby={errors.content ? 'content-error' : undefined}
        />
        {errors.content && (
          <div id="content-error" className="error-message" role="alert">
            {errors.content.message}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-describedby="submit-help"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>

      <div id="submit-help" className="sr-only">
        Your review will be moderated before publication
      </div>
    </form>
  )
}
```


```typescript
// Secure Payment Integration với Stripe
export const SecureCheckoutForm: React.FC = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handlePayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setPaymentError(null)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          // Don't store sensitive data in state
          name: 'Customer Name', // From secure form
        },
      })

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message)
      }

      // Confirm payment với backend
      const { error: confirmError } = await stripe.confirmCardPayment(
        clientSecret, // From secure backend endpoint
        {
          payment_method: paymentMethod.id,
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // Payment successful - redirect to success page
      window.location.href = '/order/success'

    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }, [stripe, elements, clientSecret])

  return (
    <form onSubmit={handlePayment} className="payment-form">
      <div className="secure-notice">
        <Icon name="lock" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
          },
          hidePostalCode: false,
        }}
      />

      {paymentError && (
        <div className="error-message" role="alert">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="payment-button"
      >
        {isProcessing ? 'Processing...' : 'Complete Payment'}
      </button>

      <div className="security-badges">
        <img src="/badges/ssl-secured.png" alt="SSL Secured" />
        <img src="/badges/pci-compliant.png" alt="PCI Compliant" />
      </div>
    </form>
  )
}
```


**9. Scalability Architecture:**


```typescript
// Micro-frontend Architecture với Module Federation
// webpack.config.js
const ModuleFederationPlugin = require('@module-federation/webpack')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        productCatalog: 'productCatalog@http://localhost:3001/remoteEntry.js',
        shoppingCart: 'shoppingCart@http://localhost:3002/remoteEntry.js',
        checkout: 'checkout@http://localhost:3003/remoteEntry.js',
        userAccount: 'userAccount@http://localhost:3004/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@reduxjs/toolkit': { singleton: true },
      },
    }),
  ],
}

// Shell Application
const ProductCatalog = lazy(() => import('productCatalog/ProductCatalog'))
const ShoppingCart = lazy(() => import('shoppingCart/ShoppingCart'))
const Checkout = lazy(() => import('checkout/CheckoutFlow'))

export const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/products/*"
            element={
              <Suspense fallback={<ProductCatalogSkeleton />}>
                <ProductCatalog />
              </Suspense>
            }
          />
          <Route
            path="/cart"
            element={
              <Suspense fallback={<CartSkeleton />}>
                <ShoppingCart />
              </Suspense>
            }
          />
          <Route
            path="/checkout/*"
            element={
              <Suspense fallback={<CheckoutSkeleton />}>
                <Checkout />
              </Suspense>
            }
          />
        </Routes>
      </Layout>
    </Router>
  )
}
```


```typescript
// Edge Computing với Vercel Edge Functions
// pages/api/edge/personalized-recommendations.ts
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const category = searchParams.get('category')

  // Get user location từ Vercel Edge
  const country = req.geo?.country || 'US'
  const city = req.geo?.city || 'New York'

  try {
    // Fast recommendations based trên location và user data
    const recommendations = await fetch(`${process.env.ML_API_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        category,
        location: { country, city },
        timestamp: Date.now(),
      }),
    })

    const data = await recommendations.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch recommendations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```


**10. Monitoring & Analytics Integration:**


```typescript
// Performance Monitoring với Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export const initPerformanceMonitoring = () => {
  // Core Web Vitals tracking
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)

  // Business metrics tracking
  trackBusinessMetrics()
}

const sendToAnalytics = (metric: any) => {
  // Send to multiple analytics services
  if (typeof window !== 'undefined') {
    // Google Analytics 4
    gtag('event', metric.name, {
      custom_parameter_name: metric.value,
      page_title: document.title,
      page_location: window.location.href,
    })

    // DataDog RUM
    if (window.DD_RUM) {
      window.DD_RUM.addTiming(metric.name, metric.value)
    }

    // Custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error)
  }
}

// E-commerce specific tracking
const trackBusinessMetrics = () => {
  // Conversion funnel tracking
  trackEvent('page_view', {
    page_type: 'product_listing',
    category: getCurrentCategory(),
  })

  // Product interaction tracking
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    if (target.closest('.product-card')) {
      trackEvent('product_click', {
        product_id: target.dataset.productId,
        position: target.dataset.position,
        list_name: 'product_grid',
      })
    }

    if (target.closest('.add-to-cart-button')) {
      trackEvent('add_to_cart', {
        product_id: target.dataset.productId,
        quantity: 1,
        value: target.dataset.price,
      })
    }
  })

  // Search tracking
  const searchInput = document.querySelector('#product-search')
  if (searchInput) {
    let searchTimeout: NodeJS.Timeout
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        const query = (e.target as HTMLInputElement).value
        if (query.length >= 3) {
          trackEvent('search', {
            search_term: query,
            results_count: getSearchResultsCount(),
          })
        }
      }, 1000)
    })
  }
}
```


**Người phỏng vấn:** Absolutely exceptional work! Bạn đã demonstrate comprehensive understanding của:


**Technical Proficiency Excellence:**


- ✅ **Security implementation**: CSP, XSS protection, input sanitization, secure payment processing
- ✅ **Scalability architecture**: Micro-frontends, edge computing, performance monitoring
- ✅ **Modern tooling**: Module Federation, Edge Functions, Web Vitals, analytics integration


**Architecture Excellence:**


- ✅ **Security-first design**: Multiple layers of protection
- ✅ **Scalable patterns**: Modular architecture, distributed systems thinking
- ✅ **Observability**: Comprehensive monitoring và business metrics


**Product & UX Sense:**


- ✅ **Business impact focus**: Conversion tracking, performance correlation với business metrics
- ✅ **User trust**: Security badges, transparent processing, error handling


Đây chính xác là level của senior architectural thinking và implementation tôi expect!


---


## Phần 3: Cross-cutting Concerns & Advanced Topics


### [10:50 AM] Testing Strategy & Quality Assurance


**Người phỏng vấn:** Excellent work với core system design! Bây giờ chúng ta explore **cross-cutting concerns**. Let's start với testing strategy cho e-commerce platform này.


**Ứng viên:** Absolutely! Testing strategy là critical cho e-commerce reliability. Em sẽ design comprehensive testing approach:


**Testing Pyramid cho E-commerce:**


```typescript
// 1. Unit Testing với React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { ProductCard } from '../ProductCard'
import { store } from '../../store'

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  price: { amount: 99.99, currency: 'USD' },
  images: [{ id: '1', url: '/test-image.jpg', alt: 'Test product' }],
  // ... other fields
}

describe('ProductCard', () => {
  const defaultProps = {
    product: mockProduct,
    onAddToCart: jest.fn(),
    onAddToWishlist: jest.fn(),
  }

  const renderProductCard = (props = {}) => {
    return render(
      <Provider store={store}>
        <ProductCard {...defaultProps} {...props} />
      </Provider>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    renderProductCard()

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByAltText('Test product')).toBeInTheDocument()
  })

  it('calls onAddToCart when add to cart button is clicked', async () => {
    const mockAddToCart = jest.fn()
    renderProductCard({ onAddToCart: mockAddToCart })

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addToCartButton)

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('1', 1)
    })
  })

  it('handles loading state correctly', () => {
    renderProductCard({ loading: true })

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument()
  })

  it('shows wishlist button when enabled', () => {
    renderProductCard({ showWishlist: true })

    expect(screen.getByRole('button', { name: /add to wishlist/i })).toBeInTheDocument()
  })

  it('hides wishlist button when disabled', () => {
    renderProductCard({ showWishlist: false })

    expect(screen.queryByRole('button', { name: /add to wishlist/i })).not.toBeInTheDocument()
  })
})
```


```typescript
// 2. Integration Testing với MSW (Mock Service Worker)
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductCatalog } from '../ProductCatalog'

const server = setupServer(
  rest.get('/api/v1/products', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const search = req.url.searchParams.get('search') || ''

    const mockProducts = [
      { id: '1', name: 'Product 1', price: { amount: 10, currency: 'USD' } },
      { id: '2', name: 'Product 2', price: { amount: 20, currency: 'USD' } },
    ]

    const filteredProducts = search
      ? mockProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : mockProducts

    return res(
      ctx.json({
        data: filteredProducts,
        pagination: {
          page: parseInt(page),
          limit: 10,
          total: filteredProducts.length,
          totalPages: 1,
        }
      })
    )
  }),

  rest.post('/api/v1/cart/items', (req, res, ctx) => {
    return res(
      ctx.json({
        data: {
          id: 'cart-1',
          items: [
            {
              id: 'item-1',
              product: { id: '1', name: 'Product 1' },
              quantity: 1,
            }
          ],
          totals: { total: { amount: 10, currency: 'USD' } }
        }
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ProductCatalog Integration', () => {
  const renderProductCatalog = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <ProductCatalog />
      </QueryClientProvider>
    )
  }

  it('displays products after loading', async () => {
    renderProductCatalog()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })
  })

  it('filters products based on search', async () => {
    renderProductCatalog()

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('textbox', { name: /search/i })
    fireEvent.change(searchInput, { target: { value: 'Product 1' } })

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.queryByText('Product 2')).not.toBeInTheDocument()
    })
  })

  it('adds product to cart successfully', async () => {
    renderProductCatalog()

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
    })

    const addToCartButton = screen.getAllByRole('button', { name: /add to cart/i })[0]
    fireEvent.click(addToCartButton)

    await waitFor(() => {
      expect(screen.getByText(/added to cart/i)).toBeInTheDocument()
    })
  })
})
```


```typescript
// 3. E2E Testing với Playwright
import { test, expect } from '@playwright/test'

test.describe('E-commerce Shopping Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete shopping flow - guest user', async ({ page }) => {
    // 1. Browse products
    await expect(page.locator('h1')).toContainText('Products')
    await expect(page.locator('.product-card')).toHaveCount(12, { timeout: 10000 })

    // 2. Search for specific product
    await page.fill('[data-testid="search-input"]', 'smartphone')
    await page.press('[data-testid="search-input"]', 'Enter')

    await expect(page.locator('.product-card')).toHaveCountGreaterThan(0)
    await expect(page.locator('.search-results-count')).toContainText('results for "smartphone"')

    // 3. View product details
    await page.click('.product-card:first-child')
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible()

    // 4. Add to cart
    await page.click('[data-testid="add-to-cart-button"]')
    await expect(page.locator('[data-testid="cart-notification"]')).toContainText('Added to cart')

    // Verify cart count updated
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

    // 5. View cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible()

    // 6. Proceed to checkout
    await page.click('[data-testid="checkout-button"]')
    await expect(page).toHaveURL('/checkout')

    // 7. Fill shipping information
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.fill('[data-testid="email"]', 'john.doe@example.com')
    await page.fill('[data-testid="address"]', '123 Main St')
    await page.fill('[data-testid="city"]', 'New York')
    await page.selectOption('[data-testid="state"]', 'NY')
    await page.fill('[data-testid="postal-code"]', '10001')

    await page.click('[data-testid="continue-to-payment"]')

    // 8. Payment information (mock Stripe)
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]')
    await stripeFrame.fill('[name="cardnumber"]', '4242424242424242')
    await stripeFrame.fill('[name="exp-date"]', '12/25')
    await stripeFrame.fill('[name="cvc"]', '123')

    // 9. Complete order
    await page.click('[data-testid="place-order-button"]')
    await expect(page).toHaveURL
```


## Claude


```typescript
// 9. Complete order
    await page.click('[data-testid="place-order-button"]')
    await expect(page).toHaveURL(/\/order\/success/)

    // 10. Verify order confirmation
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible()
    await expect(page.locator('[data-testid="delivery-estimate"]')).toBeVisible()

    // 11. Verify cart is cleared
    await page.goto('/')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('0')
  })

  test('responsive design - mobile flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Test mobile product grid
    await expect(page.locator('.product-grid')).toHaveClass(/mobile/)
    await expect(page.locator('.product-card')).toHaveCountGreaterThan(0)

    // Test mobile search
    await page.click('[data-testid="mobile-search-button"]')
    await expect(page.locator('[data-testid="mobile-search-overlay"]')).toBeVisible()
  })

  test('accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Focus on first element
    await page.keyboard.press('Tab') // Focus on search
    await page.keyboard.press('Tab') // Focus on first product

    // Verify focus is visible
    await expect(page.locator(':focus')).toBeVisible()

    // Test screen reader compatibility
    await expect(page.locator('[role="main"]')).toBeVisible()
    await expect(page.locator('[role="navigation"]')).toBeVisible()
    await expect(page.locator('[aria-label]')).toHaveCountGreaterThan(0)

    // Test contrast ratios (would need additional tools)
    // await expect(page).toPassAxeTest() // Using @axe-core/playwright
  })

  test('performance benchmarks', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')

    // Measure First Contentful Paint
    const fcpMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcp) resolve(fcp.startTime)
        }).observe({ entryTypes: ['paint'] })
      })
    })

    expect(fcpMetric).toBeLessThan(2000) // Less than 2 seconds

    // Measure Largest Contentful Paint
    const lcpMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lcp = entries[entries.length - 1]
          resolve(lcp.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })

        // Resolve after timeout if no LCP detected
        setTimeout(() => resolve(null), 5000)
      })
    })

    if (lcpMetric) {
      expect(lcpMetric).toBeLessThan(2500) // Less than 2.5 seconds
    }
  })
})
```


```typescript
// 4. Visual Regression Testing với Percy
import percySnapshot from '@percy/playwright'

test('visual regression tests', async ({ page }) => {
  // Homepage
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await percySnapshot(page, 'Homepage')

  // Product listing page
  await page.goto('/products?category=electronics')
  await page.waitForLoadState('networkidle')
  await percySnapshot(page, 'Product Listing - Electronics')

  // Product details page
  await page.goto('/products/smartphone-123')
  await page.waitForLoadState('networkidle')
  await percySnapshot(page, 'Product Details - Smartphone')

  // Shopping cart
  await page.goto('/cart')
  await percySnapshot(page, 'Shopping Cart - Empty')

  // Mobile views
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await percySnapshot(page, 'Homepage - Mobile')
})
```


**5. Load Testing Strategy:**


```typescript
// Load testing với Artillery.js
// artillery-config.yml
config:
  target: 'https://ecommerce-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Normal load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
    - duration: 30
      arrivalRate: 200
      name: "Stress test"
  processor: "./load-test-processor.js"

scenarios:
  - name: "Browse and purchase flow"
    weight: 70
    flow:
      - get:
          url: "/"
          capture:
            - json: "$.featuredProducts[0].id"
              as: "productId"
      - get:
          url: "/api/v1/products"
      - get:
          url: "/api/v1/products/{{ productId }}"
      - post:
          url: "/api/v1/cart/items"
          json:
            productId: "{{ productId }}"
            quantity: 1
      - get:
          url: "/api/v1/cart"

  - name: "Search flow"
    weight: 20
    flow:
      - get:
          url: "/api/v1/search/suggestions?q=phone"
      - get:
          url: "/api/v1/products?search=smartphone"

  - name: "User account flow"
    weight: 10
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "testpassword"
      - get:
          url: "/api/v1/orders"
```


**Người phỏng vấn:** Excellent comprehensive testing strategy! Bạn đã cover full testing pyramid từ unit tests đến load testing. Bây giờ let's discuss error handling và monitoring strategies.


### [10:57 AM] Error Handling & Monitoring


**Ứng viên:** Absolutely! Error handling và monitoring là crucial cho production e-commerce reliability. Em sẽ design robust error management system:


**Error Handling Strategy:**


```typescript
// 1. Global Error Boundary với Detailed Logging
import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to multiple services
    console.error('Error caught by boundary:', error, errorInfo)

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: true,
        page: window.location.pathname,
      },
    })

    // Send to custom analytics
    this.logError(error, errorInfo)

    // Custom error handler
    this.props.onError?.(error, errorInfo)
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    }

    // Send to logging service
    fetch('/api/v1/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(console.error)
  }

  private getCurrentUserId = (): string | null => {
    // Get from Redux store or auth context
    return localStorage.getItem('userId')
  }

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  private resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          reset={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

// Custom Error Fallback Component
const DefaultErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({
  error,
  reset
}) => {
  const isPaymentError = error.message.includes('payment')
  const isNetworkError = error.message.includes('fetch')

  return (
    <div className="error-fallback" role="alert">
      <div className="error-content">
        <h2>Something went wrong</h2>

        {isPaymentError ? (
          <div className="error-payment">
            <p>We encountered an issue processing your payment.</p>
            <p>Your order has not been charged. Please try again.</p>
            <button onClick={() => window.location.href = '/cart'}>
              Return to Cart
            </button>
          </div>
        ) : isNetworkError ? (
          <div className="error-network">
            <p>We're having trouble connecting to our servers.</p>
            <p>Please check your internet connection and try again.</p>
            <button onClick={reset}>Try Again</button>
          </div>
        ) : (
          <div className="error-generic">
            <p>An unexpected error occurred. We've been notified and are working to fix it.</p>
            <button onClick={reset}>Try Again</button>
            <button onClick={() => window.location.href = '/'}>
              Go to Homepage
            </button>
          </div>
        )}

        <details className="error-details">
          <summary>Technical Details</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    </div>
  )
}
```


```typescript
// 2. API Error Handling với Retry Logic
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const createAPIClient = () => {
  const baseQuery = fetchBaseQuery({
    baseUrl: '/api/v1/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      headers.set('x-session-id', getSessionId())
      return headers
    },
  })

  const baseQueryWithRetry = retry(
    async (args, api, extraOptions) => {
      const result = await baseQuery(args, api, extraOptions)

      if (result.error) {
        const { status, data } = result.error as any

        // Don't retry client errors (4xx)
        if (status >= 400 && status < 500) {
          throw new APIError(
            data?.message || 'Client error',
            status,
            data?.code || 'CLIENT_ERROR',
            { args, status }
          )
        }

        // Retry server errors (5xx)
        if (status >= 500) {
          throw new APIError(
            data?.message || 'Server error',
            status,
            data?.code || 'SERVER_ERROR',
            { args, status }
          )
        }
      }

      return result
    },
    {
      maxRetries: 3,
      retryCondition: (error) => {
        return error instanceof APIError && error.status >= 500
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  )

  return createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithRetry,
    endpoints: () => ({}),
  })
}
```


```typescript
// 3. Frontend Monitoring với Custom Hooks
export const useErrorTracking = () => {
  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    // Enhanced error reporting
    const errorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
      breadcrumbs: getBreadcrumbs(),
      performance: getPerformanceMetrics(),
    }

    // Multiple reporting channels
    Promise.allSettled([
      // Sentry
      Sentry.captureException(error, { extra: context }),

      // Custom logging service
      fetch('/api/v1/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      }),

      // Local storage for offline scenarios
      storeErrorLocally(errorReport),
    ])
  }, [])

  const reportBusinessEvent = useCallback((event: string, data: Record<string, any>) => {
    const eventData = {
      event,
      data,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getCurrentUserId(),
    }

    // Business events tracking
    Promise.allSettled([
      // Analytics
      gtag('event', event, data),

      // Custom business intelligence
      fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }),
    ])
  }, [])

  return { reportError, reportBusinessEvent }
}

const getBreadcrumbs = (): string[] => {
  // Track user navigation for debugging
  return JSON.parse(sessionStorage.getItem('breadcrumbs') || '[]')
}

const getPerformanceMetrics = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    }
  }
  return null
}
```


**4. Real-time Monitoring Dashboard:**


```typescript
// Monitoring hooks for business metrics
export const useBusinessMetrics = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    conversionRate: 0,
    averageOrderValue: 0,
    cartAbandonmentRate: 0,
    errorRate: 0,
    pageLoadTime: 0,
  })

  useEffect(() => {
    // Real-time metrics subscription
    const eventSource = new EventSource('/api/v1/metrics/stream')

    eventSource.onmessage = (event) => {
      const newMetrics = JSON.parse(event.data)
      setMetrics(newMetrics)
    }

    eventSource.onerror = (error) => {
      console.error('Metrics stream error:', error)
      // Fallback to polling
      startMetricsPolling()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const startMetricsPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/v1/metrics')
        const newMetrics = await response.json()
        setMetrics(newMetrics)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }

  return metrics
}

// Error rate monitoring
export const useErrorRateMonitoring = () => {
  const [errorRate, setErrorRate] = useState(0)
  const [isAlerting, setIsAlerting] = useState(false)

  useEffect(() => {
    const threshold = 0.05 // 5% error rate threshold

    if (errorRate > threshold && !isAlerting) {
      setIsAlerting(true)

      // Send alert
      fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'high_error_rate',
          value: errorRate,
          threshold,
          timestamp: Date.now(),
        }),
      })

      // Show user-facing graceful degradation
      showGracefulDegradationMode()
    }
  }, [errorRate, isAlerting])

  return { errorRate, isAlerting }
}

const showGracefulDegradationMode = () => {
  // Reduce functionality to core features
  document.body.classList.add('degraded-mode')

  // Disable non-essential features
  const nonEssentialElements = document.querySelectorAll('[data-non-essential]')
  nonEssentialElements.forEach(el => {
    (el as HTMLElement).style.display = 'none'
  })

  // Show degradation notice
  const notice = document.createElement('div')
  notice.className = 'degradation-notice'
  notice.innerHTML = `
    <div class="notice-content">
      <p>We're experiencing high traffic. Some features may be limited.</p>
      <p>Core shopping functionality remains available.</p>
    </div>
  `
  document.body.prepend(notice)
}
```


**Người phỏng vấn:** Outstanding error handling và monitoring strategy! Bạn đã show comprehensive approach với multiple layers of error detection, reporting, và graceful degradation.


Final topic - let's discuss deployment strategy và DevOps considerations cho production.


### [11:04 AM] Deployment & DevOps Strategy


**Ứng viên:** Perfect! Em sẽ design comprehensive deployment pipeline focused vào reliability, performance, và scalability cho e-commerce:


**CI/CD Pipeline Strategy:**


```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18.x'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  quality-gates:
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

      - name: Type checking
        run: npm run type-check

      - name: Linting
        run: npm run lint

      - name: Unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Bundle analysis
        run: npm run analyze

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          STRIPE_PUBLIC_KEY: ${{ secrets.STRIPE_PUBLIC_KEY }}

  integration-tests:
    runs-on: ubuntu-latest
    needs: quality-gates
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: ecommerce_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/ecommerce_test

      - name: E2E tests with Playwright
        run: |
          npx playwright install --with-deps
          npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

  security-scan:
    runs-on: ubuntu-latest
    needs: quality-gates
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: OWASP ZAP security scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'

  performance-audit:
    runs-on: ubuntu-latest
    needs: quality-gates
    steps:
      - uses: actions/checkout@v3

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  preview-deployment:
    runs-on: ubuntu-latest
    needs: [quality-gates, integration-tests, security-scan]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Comment preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployment ready at: ${{ steps.deploy.outputs.preview-url }}'
            })

  production-deployment:
    runs-on: ubuntu-latest
    needs: [quality-gates, integration-tests, security-scan, performance-audit]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Warm up CDN
        run: |
          curl -X POST "${{ secrets.CDN_PURGE_URL }}" \
            -H "Authorization: Bearer ${{ secrets.CDN_TOKEN }}"

      - name: Notify deployment
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d '{
              "text": "🚀 Production deployment successful!",
              "attachments": [{
                "color": "good",
                "fields": [{
                  "title": "Commit",
                  "value": "${{ github.sha }}",
                  "short": true
                }, {
                  "title": "Author",
                  "value": "${{ github.actor }}",
                  "short": true
                }]
              }]
            }'

  post-deployment-tests:
    runs-on: ubuntu-latest
    needs: production-deployment
    steps:
      - uses: actions/checkout@v3

      - name: Health checks
        run: |
          # API health check
          curl -f "${{ secrets.PRODUCTION_URL }}/api/health" || exit 1

          # Critical user journeys
          npm run test:smoke-production
        env:
          PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}

      - name: Performance regression test
        run: |
          npx lighthouse ${{ secrets.PRODUCTION_URL }} \
            --chrome-flags="--headless" \
            --output=json \
            --output-path=lighthouse-results.json

          # Check if performance scores meet thresholds
          node scripts/check-lighthouse-thresholds.js
```


**Infrastructure as Code với Terraform:**


```hcl
# infrastructure/main.tf
terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Vercel Project Configuration
resource "vercel_project" "ecommerce" {
  name      = "ecommerce-marketplace"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "company/ecommerce-marketplace"
  }

  environment = [
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production", "preview"]
    },
    {
      key    = "STRIPE_SECRET_KEY"
      value  = var.stripe_secret_key
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_STRIPE_PUBLIC_KEY"
      value  = var.stripe_public_key
      target = ["production", "preview"]
    }
  ]

  # Performance optimizations
  build_command = "npm run build"
  output_directory = ".next"
  install_command = "npm ci"

  # Custom headers for security
  headers = [
    {
      source = "/(.*)"
      headers = [
        {
          key   = "X-Content-Type-Options"
          value = "nosniff"
        },
        {
          key   = "X-Frame-Options"
          value = "DENY"
        },
        {
          key   = "X-XSS-Protection"
          value = "1; mode=block"
        }
      ]
    }
  ]
}

# AWS CloudFront for global CDN
resource "aws_cloudfront_distribution" "ecommerce_cdn" {
  origin {
    domain_name = vercel_project.ecommerce.domains[0]
    origin_id   = "vercel-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Cache behaviors for different content types
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "vercel-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Forwarded-Proto"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Static assets caching
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "vercel-origin"
    compress         = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000  # 1 year
    default_ttl = 31536000
    max_ttl     = 31536000
    viewer_protocol_policy = "redirect-to-https"
  }

  # API routes - no caching
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "vercel-origin"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.ecommerce_cert.arn
    ssl_support_method  = "sni-only"
  }

  tags = {
    Environment = "production"
    Project     = "ecommerce-marketplace"
  }
}
```


**Feature Flags & Gradual Rollouts:**


```typescript
// Feature flag management với LaunchDarkly integration
import { LDClient, LDUser } from 'launchdarkly-js-client-sdk'

class FeatureFlagService {
  private client: LDClient | null = null
  private user: LDUser | null = null

  async initialize(userId?: string) {
    const user: LDUser = {
      key: userId || 'anonymous',
      anonymous: !userId,
      custom: {
        platform: 'web',
        version: process.env.NEXT_PUBLIC_APP_VERSION,
      }
    }

    this.user = user
    this.client = LDClient.initialize(
      process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID!,
      user
    )

    await this.client.waitForInitialization()
  }

  getFlag(flagKey: string, defaultValue: boolean = false): boolean {
    if (!this.client) return defaultValue
    return this.client.variation(flagKey, defaultValue)
  }

  getFlagWithCallback(
    flagKey: string,
    callback: (value: boolean) => void,
    defaultValue: boolean = false
  ) {
    if (!this.client) {
      callback(defaultValue)
      return
    }

    // Get current value
    const currentValue = this.client.variation(flagKey, defaultValue)
    callback(currentValue)

    // Listen for changes
    this.client.on(`change:${flagKey}`, callback)
  }

  track(eventName: string, data?: any) {
    if (!this.client) return
    this.client.track(eventName, data)
  }
}

export const featureFlags = new FeatureFlagService()

// React hook for feature flags
export const useFeatureFlag = (flagKey: string, defaultValue: boolean = false) => {
  const [flagValue, setFlagValue] = useState(defaultValue)

  useEffect(() => {
    featureFlags.getFlagWithCallback(flagKey, setFlagValue, defaultValue)

    return () => {
      // Cleanup listener
      if (featureFlags.client) {
        featureFlags.client.off(`change:${flagKey}`, setFlagValue)
      }
    }
  }, [flagKey, defaultValue])

  return flagValue
}

// Usage in components
export const ProductRecommendations: React.FC = () => {
  const useMLRecommendations = useFeatureFlag('ml-recommendations', false)
  const showPersonalizedBanner = useFeatureFlag('personalized-banner', false)

  useEffect(() => {
    if (useMLRecommendations) {
      // Track flag exposure for analysis
      featureFlags.track('ml-recommendations-exposed')
    }
  }, [useMLRecommendations])

  if (useMLRecommendations) {
    return <MLPoweredRecommendations />
  }

  return <StandardRecommendations />
}
```


**Disaster Recovery & Business Continuity:**


```typescript
// Disaster recovery implementation
export class DisasterRecoveryService {
  private isFailoverMode = false
  private backupEndpoints = [
    'https://api-backup-1.example.com',
    'https://api-backup-2.example.com',
  ]
  private currentBackupIndex = 0

  async checkPrimaryHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  async enableFailoverMode() {
    this.isFailoverMode = true

    // Update API base URL
    store.dispatch(updateAPIBaseURL(this.getCurrentBackupEndpoint()))

    // Show user notification
    store.dispatch(addNotification({
      type: 'warning',
      message: 'We are currently experiencing issues. Some features may be limited.',
      persistent: true,
    }))

    // Disable non-essential features
    this.disableNonEssentialFeatures()

    // Enable degraded mode styles
    document.body.classList.add('failover-mode')
  }

  private getCurrentBackupEndpoint(): string {
    return this.backupEndpoints[this.currentBackupIndex]
  }

  private disableNonEssentialFeatures() {
    // Disable resource-intensive features
    const nonEssentialElements = document.querySelectorAll('[data-non-essential]')
    nonEssentialElements.forEach(el => {
      (el as HTMLElement).style.display = 'none'
    })

    // Disable animations
    document.body.classList.add('no-animations')

    // Reduce image quality
    const images = document.querySelectorAll('img[data-high-res]')
    images.forEach(img => {
      const lowResUrl = (img as HTMLImageElement).dataset.lowRes
      if (lowResUrl) {
        (img as HTMLImageElement).src = lowResUrl
      }
    })
  }

  async attemptRecovery() {
    // Try primary endpoint
    const primaryHealthy = await this.checkPrimaryHealth()

    if (primaryHealthy) {
      await this.exitFailoverMode()
      return true
    }

    // Try next backup endpoint
    this.currentBackupIndex = (this.currentBackupIndex + 1) % this.backupEndpoints.length
    store.dispatch(updateAPIBaseURL(this.getCurrentBackupEndpoint()))

    return false
  }

  private async exitFailoverMode() {
    this.isFailoverMode = false

    // Restore primary API
    store.dispatch(updateAPIBaseURL(process.env.NEXT_PUBLIC_API_URL!))

    // Remove failover notifications
    store.dispatch(removeNotificationsByType('warning'))

    // Re-enable features
    document.body.classList.remove('failover-mode', 'no-animations')

    // Show recovery notification
    store.dispatch(addNotification({
      type: 'success',
      message: 'All systems are back to normal!',
      duration: 5000,
    }))
  }
}

// Initialize disaster recovery monitoring
export const initializeDisasterRecovery = () => {
  const dr = new DisasterRecoveryService()

  // Health check interval
  setInterval(async () => {
    const isHealthy = await dr.checkPrimaryHealth()

    if (!isHealthy && !dr.isFailoverMode) {
      await dr.enableFailoverMode()
    } else if (isHealthy && dr.isFailoverMode) {
      await dr.exitFailoverMode()
    }
  }, 30000) // Check every 30 seconds

  // Recovery attempt interval during failover
  setInterval(async () => {
    if (dr.isFailoverMode) {
      await dr.attemptRecovery()
    }
  }, 60000) // Attempt recovery every minute
}
```


**Người phỏng vấn:** Absolutely outstanding deployment và DevOps strategy! Bạn đã demonstrate comprehensive understanding của production-grade infrastructure:


**Technical Excellence:**


- ✅ **CI/CD sophistication**: Multi-stage pipeline với quality gates, security scanning, performance auditing
- ✅ **Infrastructure as Code**: Terraform integration với Vercel và AWS
- ✅ **Feature management**: LaunchDarkly integration với gradual rollouts
- ✅ **Disaster recovery**: Multi-tier failover strategy với graceful degradation


**Business Impact Understanding:**


- ✅ **Zero-downtime deployments**: Preview environments và blue-green strategies
- ✅ **Business continuity**: Comprehensive failover và recovery procedures
- ✅ **Risk mitigation**: Feature flags để control blast radius


Đây là exactly level của production engineering expertise tôi expect từ Senior level candidates!


---


## Phần 4: Tổng Kết và Đánh Giá


### [11:11 AM] Solution Summary & Next Steps


**Người phỏng vấn:** Tuyệt vời! Chúng ta đã hoàn thành comprehensive system design session. Bây giờ tôi muốn bạn summarize solution của mình và discuss potential next steps hay improvements.


**Ứng viên:** Thank you! Em sẽ tổng kết solution và highlight key decisions:


**Architecture Summary:**


**1. Frontend Architecture:**


- **Next.js 13+ với App Router**: Server-side rendering cho SEO, streaming för performance
- **State Management**: Redux Toolkit + RTK Query cho server state, React hooks cho client state
- **Component Design**: Reusable component library với TypeScript, compound patterns
- **Performance**: Code splitting, image optimization, virtual scrolling, caching strategies


**2. Key Technical Decisions:**


- **Rendering Strategy**: Hybrid SSR/CSR với selective hydration
- **Data Flow**: Server state separation, optimistic updates, offline support
- **Security**: CSP headers, input sanitization, secure payment integration
- **Scalability**: Micro-frontend ready, edge computing, CDN optimization


**3. Business Impact Focus:**


- **Conversion Optimization**: <2s page loads, mobile-first design, accessibility compliance
- **Reliability**: 99.9% uptime target, graceful degradation, disaster recovery
- **Developer Experience**: Type safety, testing strategy, CI/CD automation
- **Operational Excellence**: Comprehensive monitoring, feature flags, gradual deployments


**Next Steps & Improvements:**


**Phase 1 (0-3 months):** MVP Completion


- Complete core shopping flow implementation
- Basic vendor dashboard
- Payment integration với Stripe
- Essential monitoring và alerting


**Phase 2 (3-6 months):** Enhanced Features


- ML-powered recommendations
- Advanced search với Elasticsearch
- Mobile app với React Native
- A/B testing framework


**Phase 3 (6-12 months):** Scale & Optimization


- Micro-frontend architecture
- International expansion (i18n)
- Advanced analytics dashboard
- Voice commerce integration


**Potential Improvements:**


**Technical:**


- **GraphQL integration** để reduce over-fetching
- **Web Workers** for heavy computations
- **Service Workers** cho offline-first experience
- **WebAssembly** for performance-critical features


**Business:**


- **Personalization engine** với machine learning
- **Social commerce** features
- **Subscription** và recurring orders
- **B2B marketplace** capabilities


**People phỏng vấn:** Excellent summary! Clear roadmap và thoughtful next steps.


### Final Assessment & Feedback


Tôi want để provide comprehensive feedback trên performance của bạn today:


**Outstanding Strengths (Exceeds Expectations):**


**Technical Proficiency (9/10):**


- ✅ **React ecosystem mastery**: Next.js 13+, Redux Toolkit, modern patterns
- ✅ **TypeScript expertise**: Complex types, generic patterns, proper typing
- ✅ **Performance optimization**: Comprehensive strategies từ rendering to network
- ✅ **Architecture thinking**: Scalable patterns, separation of concerns


**Problem Exploration (10/10):**


- ✅ **Systematic approach**: RADIO framework application
- ✅ **Clarifying questions**: Business và technical considerations
- ✅ **Scope management**: Proper prioritization và phasing


**Architecture Design (9/10):**


- ✅ **Component composition**: Reusable, flexible interfaces
- ✅ **State management**: Appropriate tool selection
- ✅ **Security consciousness**: Multiple protection layers
- ✅ **Scalability planning**: Future-proof architecture


**Product & UX Sense (9/10):**


- ✅ **User experience focus**: Accessibility, mobile optimization
- ✅ **Business impact**: Conversion rate optimization
- ✅ **Performance correlation**: Understanding business metrics


**Communication (10/10):**


- ✅ **Clear explanations**: Technical concepts well articulated
- ✅ **Structured thinking**: Logical flow và organization
- ✅ **Collaboration**: Asked questions, incorporated feedback


**Areas for Minor Improvement:**


**More Advanced Topics Discussion:**


- Could have explored more về real-time features (WebSockets, Server-Sent Events)
- Deeper dive vào machine learning integration opportunities
- More discussion về data privacy và GDPR compliance


**Even More Business Context:**


- Could have asked more về competitive landscape
- Discussion về market differentiation strategies


**Overall Assessment: STRONG HIRE**


**Competency Level: Senior/Staff Engineer (L5/L6)**


Bạn demonstrate exactly kiểu technical leadership và architectural thinking chúng tôi expect ở Senior level. Comprehensive understanding của modern frontend ecosystem, business impact focus, và production engineering excellence.


**Next Steps:**


1. **Team matching discussion** - Tôi sẽ recommend bạn cho 2-3 teams phù hợp
2. **System design deep dive** với specific team architectures
3. **Cultural fit conversation** với hiring manager
4. **Reference checks** và final decision


Any questions về feedback hay next steps?


**Ứng viên:** Wow, thank you so much for the comprehensive feedback! Em rất appreciate detailed assessment và constructive suggestions.


Em có một few questions:


1. Về team matching - có thể share more về teams nào có similar technical challenges?
2. Timeline für next steps?
3. Opportunities để continue growing vào Staff level tại Meta?


**Người phỏng vấn:** Great questions!


**Team Matching:**


- **Instagram Shopping**: Direct relevance với e-commerce experience
- **Facebook Marketplace**: Similar domain, large scale challenges
- **Meta Pay**: Payment systems, financial technology focus


**Timeline:**


- Team matching discussions: Next 2-3 days
- Technical deep dive: Within 1 week
- Final decision: 1-2 weeks total


**Growth Opportunities:**


- Meta has strong internal mobility program
- Clear Staff Engineer path với technical leadership expectations
- Cross-team collaboration opportunities
- Mentorship programs


Em absolutely có potential để grow into Staff level với continued focus trên system architecture và cross-team impact.


Thank you for excellent session today! Tôi rất impressed với depth of knowledge và systematic approach. Looking forward to seeing you join our team!


---


**Kết thúc phỏng vấn: 11:18 AM**
**Tổng thời gian: 90 phút**


**Kết quả: STRONG HIRE - Recommended for Senior Frontend Engineer (L5) position**
