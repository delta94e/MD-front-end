# Micro-Frontend & Module Federation: Deep Dive

> Tài liệu học chuyên sâu — Mental Models, Architecture Patterns, Q&A phản biện cho phỏng vấn Senior Frontend Engineer
>
> CV claim: *"Architected and led development of Micro-Frontend infrastructure using Module Federation, enabling independent team deployments across 8+ autonomous squads while maintaining shared design consistency."*

---

## Mục lục

1. [Mental Model: Micro-Frontend là gì?](#1-mental-model-micro-frontend-là-gì)
2. [Tại sao Micro-Frontend tồn tại?](#2-tại-sao-micro-frontend-tồn-tại)
3. [Module Federation: Core Concept](#3-module-federation-core-concept)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Shared Design System](#5-shared-design-system)
6. [Independent Deployment](#6-independent-deployment)
7. [State Management across MFEs](#7-state-management-across-mfes)
8. [Routing & Navigation](#8-routing--navigation)
9. [Performance & Bundle Optimization](#9-performance--bundle-optimization)
10. [Testing Strategies](#10-testing-strategies)
11. [Q&A Phản biện chuyên sâu (15 câu)](#11-qa-phản-biện-chuyên-sâu)
12. [War Stories: Bài học đắt giá khi triển khai MFE thực tế](#12-war-stories-những-bài-học-đắt-giá-khi-triển-khai-mfe-thực-tế)
13. [Event Bus: Cross-MFE Communication Pattern](#13-event-bus-cross-mfe-communication-pattern)
14. [Decision Framework](#14-decision-framework)
15. [Demo Architecture](#15-demo-architecture)

---

## 1. Mental Model: Micro-Frontend là gì?

### Định nghĩa chính xác

Micro-Frontend là một **architectural style** trong đó một frontend application được chia thành nhiều **independently deliverable frontend applications** (gọi là "micro-frontends" hoặc "remotes"), mỗi cái được phát triển, test, và deploy bởi một team riêng biệt.

### Mental Model: "Tòa nhà chung cư"

```
MONOLITH (1 team, 1 codebase):
┌────────────────────────────────────────┐
│            MỘT NGÔI NHÀ LỚN           │
│  Tất cả phòng chung tường, chung ống   │
│  Sửa bếp → có thể ảnh hưởng phòng ngủ │
│  1 team thợ xây dựng toàn bộ           │
└────────────────────────────────────────┘

MICRO-FRONTEND (nhiều teams, nhiều codebases):
┌──────────────────────────────────────────────────┐
│              TÒA CHUNG CƯ (Host/Shell)           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Căn hộ A │ │ Căn hộ B │ │ Căn hộ C │          │
│ │ (Team A) │ │ (Team B) │ │ (Team C) │          │
│ │ Products │ │   Cart   │ │  Header  │          │
│ │          │ │          │ │          │          │
│ │ Tự sửa   │ │ Tự sửa   │ │ Tự sửa   │          │
│ │ tự decor │ │ tự decor │ │ tự decor │          │
│ └──────────┘ └──────────┘ └──────────┘          │
│                                                  │
│  Shared: Hành lang, thang máy, ống nước chính    │
│  (= Shared design system, routing, auth)         │
└──────────────────────────────────────────────────┘
```

**Key insight**: Mỗi "căn hộ" (MFE) có thể:
- Được xây bởi team khác nhau
- Sửa chữa/renovate mà không ảnh hưởng căn hộ khác
- Có phong cách nội thất riêng (nhưng tuân theo quy chuẩn chung cư)
- Chuyển đến/đi (deploy) bất cứ lúc nào

### Mental Model: "Lego Blocks"

```
Monolith = Một tảng đá điêu khắc
  - Đẹp, nhưng muốn thay đổi 1 phần → phải đục cả tảng
  - 1 thợ điêu khắc làm tất cả

Micro-Frontend = Bộ Lego
  - Mỗi block (MFE) tự đứng được
  - Có interface chuẩn (các nút gắn = shared contracts)
  - Thay 1 block không ảnh hưởng block khác
  - Nhiều người có thể lắp song song
  - Nhưng: nếu không có bản thiết kế (design system) → lắp lung tung
```

---

## 2. Tại sao Micro-Frontend tồn tại?

### Vấn đề của Monolith Frontend

Khi frontend app phát triển lớn (100K+ lines of code, 8+ teams):

```
Monolith Problems:

1. DEPLOYMENT COUPLING
   Team A muốn ship feature → phải đợi Team B fix bug trước
   Release cycle: Weekly/Monthly (chậm!)
   
2. CODEBASE COUPLING  
   Team A sửa shared component → break Team B's feature
   "Who owns this component?" → Không ai dám sửa
   
3. TECH DEBT ACCUMULATION
   Upgrade React 17→18? Phải upgrade TOÀN BỘ app cùng lúc
   100K LoC migration = 3-6 months, block tất cả feature work
   
4. BUILD TIME
   Full build: 15-30 minutes
   CI/CD pipeline: 45+ minutes
   Developer feedback loop: Quá chậm
   
5. TEAM SCALING
   8 teams, 1 repo, 1 CI/CD → merge conflicts hàng ngày
   Code review bottleneck: ai review code của team khác?
   Onboarding: phải hiểu TOÀN BỘ codebase
```

### Micro-Frontend giải quyết:

```
1. INDEPENDENT DEPLOYMENT
   Team A ship bất cứ lúc nào → không đợi ai
   Release cycle: Multiple times per day!
   
2. INDEPENDENT CODEBASE
   Team A sửa component → chỉ ảnh hưởng module của Team A
   Clear ownership: Team A owns products, Team B owns cart
   
3. INCREMENTAL UPGRADE
   Team A upgrade React 18, Team B vẫn dùng React 17
   Migration dần dần, không big-bang
   
4. FAST BUILD
   Mỗi MFE build riêng: 1-3 minutes
   Chỉ build module thay đổi
   
5. TEAM AUTONOMY
   8 teams, 8 repos, 8 CI/CD pipelines
   Code review trong team
   Onboarding: chỉ cần hiểu 1 module
```

---

## 3. Module Federation: Core Concept

### Module Federation là gì?

Module Federation là một feature của **Webpack 5** cho phép nhiều independent builds chia sẻ code **at runtime** (không phải build time).

### Mental Model: "USB Drive"

```
TRƯỚC Module Federation:
  App phải COPY tất cả code cần thiết vào bundle lúc build
  → Giống như burn tất cả files vào CD-ROM
  → Muốn update 1 file → burn lại toàn bộ CD

VỚI Module Federation:
  App LOAD code từ remote sources lúc runtime
  → Giống như cắm USB drive
  → USB (remote) update → app tự lấy version mới
  → Nhiều computers (hosts) có thể dùng chung 1 USB (remote)
```

### Thuật ngữ quan trọng

```
┌─────────────────────────────────────────────────────────┐
│                    TERMINOLOGY                          │
│                                                         │
│  HOST (Container/Shell):                                │
│    App chính, load và orchestrate các remotes           │
│    Ví dụ: Main website shell                            │
│                                                         │
│  REMOTE:                                                │
│    App độc lập, EXPOSE modules cho host consume         │
│    Ví dụ: Products MFE, Cart MFE                        │
│                                                         │
│  EXPOSED MODULES:                                       │
│    Components/functions mà remote chia sẻ ra ngoài      │
│    Ví dụ: <ProductList />, <CartButton />                │
│                                                         │
│  SHARED DEPENDENCIES:                                   │
│    Libraries dùng chung (React, design system)          │
│    Load 1 lần, tất cả MFEs dùng chung instance          │
│                                                         │
│  REMOTE ENTRY:                                          │
│    File JavaScript mà host dùng để discover remote      │
│    Ví dụ: http://products.example.com/remoteEntry.js    │
└─────────────────────────────────────────────────────────┘
```

### Cách hoạt động (Step by step)

```
BUILD TIME:
1. Remote "products" build → tạo remoteEntry.js + chunks
2. Remote "cart" build → tạo remoteEntry.js + chunks
3. Host build → KHÔNG chứa code từ remotes

RUNTIME:
1. Browser load Host app
2. Host gặp <ProductList /> → "Tôi cần module từ remote 'products'"
3. Host download products/remoteEntry.js → manifest của remote
4. remoteEntry.js nói: "ProductList nằm ở chunk-abc123.js"
5. Host download chunk-abc123.js
6. Module Federation resolve shared deps (React đã load → dùng lại)
7. <ProductList /> render trong Host app

┌──────────┐         ┌──────────────────┐
│   HOST   │────────>│ products/        │
│          │  load   │ remoteEntry.js   │
│          │<────────│                  │
│          │  manifest│                  │
│          │────────>│ chunk-abc123.js  │
│          │  load   │ (ProductList)    │
│          │<────────│                  │
│ Render   │  code   │                  │
│ Product  │         │                  │
│ List!    │         │                  │
└──────────┘         └──────────────────┘
```

### Webpack Config: Host

```js
// host/webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "host",
      
      // Khai báo remotes mà host sẽ consume
      remotes: {
        // Key = import alias, Value = "remoteName@URL"
        products: "products@http://localhost:3001/remoteEntry.js",
        cart: "cart@http://localhost:3002/remoteEntry.js",
        header: "header@http://localhost:3003/remoteEntry.js",
      },

      // Shared dependencies — load 1 lần, dùng chung
      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
        "@shared/design-system": { singleton: true },
      },
    }),
  ],
};
```

### Webpack Config: Remote

```js
// remote-products/webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "products",
      filename: "remoteEntry.js",

      // Modules mà remote EXPOSE cho host
      exposes: {
        "./ProductList": "./src/components/ProductList",
        "./ProductCard": "./src/components/ProductCard",
        "./ProductSearch": "./src/components/ProductSearch",
      },

      // Shared — KHÔNG bundle React vào remote
      // Dùng React instance từ host
      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
        "@shared/design-system": { singleton: true },
      },
    }),
  ],
};
```

### Host consume Remote:

```tsx
// host/src/App.tsx
import React, { Suspense } from "react";

// ✅ Dynamic import từ remote — loaded at RUNTIME
const ProductList = React.lazy(() => import("products/ProductList"));
const CartButton = React.lazy(() => import("cart/CartButton"));
const Header = React.lazy(() => import("header/Header"));

export default function App() {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />                    {/* Từ remote "header" */}
      </Suspense>

      <main>
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductList />             {/* Từ remote "products" */}
        </Suspense>
      </main>

      <Suspense fallback={<CartSkeleton />}>
        <CartButton />                {/* Từ remote "cart" */}
      </Suspense>
    </div>
  );
}
```

### Type Safety: Declaration file

```ts
// host/src/remotes.d.ts — TypeScript biết remote modules
declare module "products/ProductList" {
  const ProductList: React.ComponentType<{ category?: string }>;
  export default ProductList;
}

declare module "cart/CartButton" {
  const CartButton: React.ComponentType<{ productId: string }>;
  export default CartButton;
}

declare module "header/Header" {
  const Header: React.ComponentType;
  export default Header;
}
```

---

## 4. Architecture Patterns

### Pattern 1: Shell/Host Pattern (Recommended)

```
┌─────────────────────────────────────────────────────┐
│                   HOST / SHELL                       │
│  Responsibilities:                                   │
│  ├── Routing (URL → which remote to load)            │
│  ├── Authentication (shared auth state)              │
│  ├── Layout (header, sidebar, footer)                │
│  ├── Error boundaries (graceful degradation)         │
│  └── Shared state orchestration                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Remote A │  │ Remote B │  │ Remote C │          │
│  │ Products │  │   Cart   │  │ Settings │          │
│  │ Team α   │  │ Team β   │  │ Team γ   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### Pattern 2: Bi-directional / Peer-to-Peer

```
Mỗi app vừa là HOST vừa là REMOTE:

┌──────────┐ ←──share──→ ┌──────────┐
│  App A   │             │  App B   │
│ (host +  │             │ (host +  │
│  remote) │             │  remote) │
└──────────┘             └──────────┘
      ↕                       ↕
┌──────────┐             ┌──────────┐
│  App C   │ ←──share──→ │  App D   │
└──────────┘             └──────────┘

Use case: Mỗi app independent nhưng share components
Ví dụ: Marketing site dùng <Header> từ Main app
```

### Pattern 3: Vertical Split (Team-owned pages)

```
URL-based routing:
  /products/*  → Products MFE (Team A) — Full page ownership
  /cart/*      → Cart MFE (Team B) — Full page ownership
  /account/*   → Account MFE (Team C) — Full page ownership
  /admin/*     → Admin MFE (Team D) — Full page ownership

Mỗi team OWN toàn bộ vertical slice:
Team A: /products UI + Products API + Products DB
Team B: /cart UI + Cart API + Cart DB
```

### Pattern 4: Horizontal Split (Component-level)

```
1 page chứa components từ NHIỀU teams:

┌─────────────────────────────────────┐
│  Header          ← Team Header     │
├─────────────────────────────────────┤
│  Product Detail  ← Team Products   │
│  ┌──────────────────────┐           │
│  │ Add to Cart Button   │← Team Cart│
│  └──────────────────────┘           │
│  ┌──────────────────────┐           │
│  │ Reviews Section      │← Team UGC │
│  └──────────────────────┘           │
├─────────────────────────────────────┤
│  Recommendations ← Team ML/Reco    │
├─────────────────────────────────────┤
│  Footer          ← Team Marketing  │
└─────────────────────────────────────┘

Phức tạp hơn nhưng linh hoạt hơn.
Cần rõ ràng về contracts giữa components.
```

---

## 5. Shared Design System

### Tại sao Design System quan trọng?

Không có shared design system → 8 teams tạo 8 Button components khác nhau → UX không nhất quán → user confused.

### Mental Model: "Bộ quy chuẩn xây dựng chung cư"

```
Không có design system:
  Căn hộ A: cửa mở trái, nắm tròn, màu đỏ
  Căn hộ B: cửa mở phải, nắm vuông, màu xanh
  Căn hộ C: cửa trượt, không nắm, màu trắng
  → Người vào chung cư: "WTF, mỗi tầng 1 kiểu?"

Có design system:
  Quy chuẩn: Cửa mở trái, nắm tròn chrome, màu xám
  Căn hộ A-H: Tuân theo quy chuẩn
  → Người vào: "Nhất quán, chuyên nghiệp!"
  → Nhưng mỗi căn vẫn có nội thất riêng (business logic)
```

### Implementation: Shared UI Package

```
@shared/design-system/
├── src/
│   ├── tokens/
│   │   ├── colors.ts          # Brand colors
│   │   ├── typography.ts      # Font sizes, weights
│   │   ├── spacing.ts         # Margins, paddings
│   │   └── breakpoints.ts     # Responsive breakpoints
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts           # Barrel exports
│   └── hooks/
│       ├── useTheme.ts
│       └── useMediaQuery.ts
├── package.json
└── tsconfig.json
```

### Versioning Strategy

```
Hai cách tiếp cận:

1. PINNED VERSION (Conservative)
   Remote A: @shared/design-system@2.3.1
   Remote B: @shared/design-system@2.3.1
   Remote C: @shared/design-system@2.2.0 ← Chậm upgrade
   
   Pro: Stable, predictable
   Con: Inconsistency nếu teams dùng version khác nhau

2. SINGLETON SHARED (Aggressive) ← Recommended
   Module Federation shared config:
   shared: {
     "@shared/design-system": { 
       singleton: true,           // ← Chỉ 1 instance!
       requiredVersion: "^2.0.0"  // ← Semver range
     }
   }
   
   Pro: Tất cả MFEs dùng CÙNG 1 version tại runtime
   Con: Breaking change → ảnh hưởng tất cả MFEs
   Giải pháp: Strict semver + visual regression tests
```

### Contract Testing

```tsx
// Design system component với clear contract:
interface ButtonProps {
  variant: "primary" | "secondary" | "ghost";
  size: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Contract test — chạy ở CẢ design system repo VÀ consumer repos:
describe("Button Contract", () => {
  it("renders primary variant", () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-primary");
  });

  it("shows loading state", () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });
});
```

---

## 6. Independent Deployment

### Deployment Pipeline

```
8 TEAMS, 8 INDEPENDENT PIPELINES:

Team A (Products):
  git push → CI tests → Build MFE → Deploy to CDN → Done!
  Time: 3-5 minutes
  Frequency: 5-10 times/day

Team B (Cart):  
  git push → CI tests → Build MFE → Deploy to CDN → Done!
  Time: 3-5 minutes
  Frequency: 3-5 times/day

Host/Shell:
  Rarely changes (only routing/layout updates)
  Deploy: 1-2 times/week

KHÔNG CẦN COORDINATE giữa teams!
Team A deploy mà Team B không cần biết.
```

### Cách independent deployment hoạt động

```
TRƯỚC deploy Team A:
  Host loads: products@https://cdn.example.com/products/v2.1.0/remoteEntry.js

Team A deploys v2.2.0:
  New files uploaded to: https://cdn.example.com/products/v2.2.0/remoteEntry.js

SAU deploy (2 strategies):

Strategy 1: URL Versioning (Explicit)
  Host config cập nhật URL → redeploy host
  ❌ Cần redeploy host mỗi lần remote thay đổi

Strategy 2: Latest URL (Implicit) ← Recommended
  Host always loads: https://cdn.example.com/products/latest/remoteEntry.js
  CDN routing: /latest/ → /v2.2.0/ (updated on deploy)
  ✅ Host KHÔNG CẦN redeploy!
  ✅ Remote deploy → tự động reflected
```

### Rollback Strategy

```
Production Issue detected in Products MFE v2.2.0:

Instant Rollback:
1. CDN routing: /latest/ → /v2.1.0/ (previous version)
2. Time: < 30 seconds
3. No host redeploy needed
4. Other MFEs unaffected

Canary Deployment:
1. 5% traffic → v2.2.0, 95% → v2.1.0
2. Monitor error rates, performance
3. Gradually increase to 100%
4. Rollback if issues detected
```

---

## 7. State Management across MFEs

### The Hard Problem

Micro-frontends are independent, nhưng cần share state (user auth, cart items, theme). Làm sao?

### Mental Model: "Hộp thư chung cư"

```
KHÔNG nên: Mỗi căn hộ giữ 1 bản copy key (duplicated state)
  → Đổi khóa → phải thông báo TẤT CẢ căn hộ → dễ miss

NÊN: Hộp thư chung cư (shared mailbox / event bus)
  → Thay đổi → post lên bảng tin → ai cần thì đọc
  → Single source of truth
```

### Pattern 1: Custom Events (Simple)

```tsx
// Shared event bus — works across all MFEs
// shared/events.ts

export const MFE_EVENTS = {
  CART_UPDATED: "mfe:cart:updated",
  USER_LOGGED_IN: "mfe:user:logged-in",
  THEME_CHANGED: "mfe:theme:changed",
} as const;

// Emitting from Cart MFE:
window.dispatchEvent(
  new CustomEvent(MFE_EVENTS.CART_UPDATED, {
    detail: { itemCount: 3, total: 150000 },
  })
);

// Listening in Header MFE:
useEffect(() => {
  const handler = (e: CustomEvent) => {
    setCartCount(e.detail.itemCount);
  };
  window.addEventListener(MFE_EVENTS.CART_UPDATED, handler);
  return () => window.removeEventListener(MFE_EVENTS.CART_UPDATED, handler);
}, []);
```

### Pattern 2: Shared Store via Module Federation

```tsx
// shared/store.ts — Exposed as shared module
import { create } from "zustand";

interface SharedState {
  user: User | null;
  cartItems: CartItem[];
  theme: "light" | "dark";
  setUser: (user: User | null) => void;
  addToCart: (item: CartItem) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useSharedStore = create<SharedState>((set) => ({
  user: null,
  cartItems: [],
  theme: "light",
  setUser: (user) => set({ user }),
  addToCart: (item) =>
    set((s) => ({ cartItems: [...s.cartItems, item] })),
  setTheme: (theme) => set({ theme }),
}));

// Module Federation shared config:
shared: {
  "./store": { singleton: true }, // ← Tất cả MFEs dùng CÙNG store instance
}
```

### Pattern 3: Props Drilling from Host (Explicit)

```tsx
// Host passes data to remotes via props
// Ưu điểm: Rõ ràng, dễ debug, type-safe
// Nhược điểm: Host phải biết props signature của mọi remote

const ProductList = React.lazy(() => import("products/ProductList"));

function App() {
  const [cart, setCart] = useState([]);
  const user = useAuth();

  return (
    <ProductList
      user={user}
      onAddToCart={(item) => setCart([...cart, item])}
      currency="VND"
    />
  );
}
```

### Recommendation cho 8+ teams:

```
State nhỏ, ít thay đổi (theme, locale):
  → Shared store (Zustand singleton)

State nghiệp vụ (cart, user):
  → Custom Events + mỗi MFE tự manage internal state

State real-time (notifications):
  → WebSocket connection ở Host, broadcast via events

TRÁNH: Global Redux store shared across ALL MFEs
  → Coupling quá chặt, mất independence
```

---

## 8. Routing & Navigation

### Challenge

Mỗi MFE có routes riêng, nhưng user thấy 1 URL bar duy nhất. Ai quản lý routing?

### Pattern: Host-managed routing

```tsx
// host/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

const ProductsApp = React.lazy(() => import("products/App"));
const CartApp = React.lazy(() => import("cart/App"));
const AccountApp = React.lazy(() => import("account/App"));

export default function HostApp() {
  return (
    <BrowserRouter>
      <Header />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Host quản lý top-level routing */}
          <Route path="/products/*" element={<ProductsApp />} />
          <Route path="/cart/*" element={<CartApp />} />
          <Route path="/account/*" element={<AccountApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

```tsx
// remote-products/src/App.tsx
import { Routes, Route } from "react-router-dom";
// ⚠️ Dùng MemoryRouter hoặc basename để không conflict với Host Router

export default function ProductsApp() {
  return (
    <Routes>
      {/* Products MFE quản lý sub-routes */}
      <Route path="/" element={<ProductList />} />
      <Route path="/:slug" element={<ProductDetail />} />
      <Route path="/search" element={<ProductSearch />} />
    </Routes>
  );
}
```

### Cross-MFE Navigation

```tsx
// Products MFE muốn navigate đến Cart:
// ❌ KHÔNG dùng react-router navigate() — khác router context
// ✅ Dùng window.history hoặc custom events

// Option 1: Shared navigation function
export function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Option 2: Custom event
window.dispatchEvent(
  new CustomEvent("mfe:navigate", {
    detail: { path: "/cart", state: { from: "products" } },
  })
);

// Host listens and routes:
useEffect(() => {
  const handler = (e: CustomEvent) => {
    navigate(e.detail.path, { state: e.detail.state });
  };
  window.addEventListener("mfe:navigate", handler);
  return () => window.removeEventListener("mfe:navigate", handler);
}, []);
```

---

## 9. Performance & Bundle Optimization

### Shared Dependencies: Tại sao quan trọng?

```
KHÔNG shared:
  Host bundle:     React (42KB) + ReactDOM (130KB) + App code
  Products bundle: React (42KB) + ReactDOM (130KB) + Products code  ← DUPLICATE!
  Cart bundle:     React (42KB) + ReactDOM (130KB) + Cart code      ← DUPLICATE!
  
  Total React loaded: 42KB × 3 = 126KB  😱

CÓ shared (singleton):
  Host bundle:     React (42KB) + ReactDOM (130KB) + App code
  Products bundle: Products code only (React shared từ host)
  Cart bundle:     Cart code only (React shared từ host)
  
  Total React loaded: 42KB × 1 = 42KB   ✅ Giảm 66%
```

### Lazy Loading Strategy

```tsx
// ❌ Load TẤT CẢ remotes khi app khởi động
import ProductList from "products/ProductList"; // Eager load
import Cart from "cart/Cart";                   // Eager load
import Account from "account/Account";          // Eager load
// → Initial bundle: 500KB+ 😱

// ✅ Load remote CHỈ KHI cần (route-based)
const ProductList = React.lazy(() => import("products/ProductList"));
const Cart = React.lazy(() => import("cart/Cart"));
const Account = React.lazy(() => import("account/Account"));
// → Initial bundle: 100KB (host only)
// → Products loaded khi user visit /products: +80KB
// → Cart loaded khi user visit /cart: +40KB
```

### Performance Monitoring

```tsx
// Measure remote loading time
async function loadRemote(remoteName: string, modulePath: string) {
  const start = performance.now();
  
  try {
    const module = await import(`${remoteName}/${modulePath}`);
    const duration = performance.now() - start;
    
    // Track to analytics
    analytics.track("mfe_load", {
      remote: remoteName,
      module: modulePath,
      duration,
      cached: duration < 50, // Likely cached if < 50ms
    });
    
    return module;
  } catch (error) {
    analytics.track("mfe_load_error", {
      remote: remoteName,
      module: modulePath,
      error: error.message,
    });
    throw error;
  }
}
```

---

## 10. Testing Strategies

### Testing Pyramid cho Micro-Frontend

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲          Integration tests:
                 ╱  Tests ╲         Host + ALL remotes
                ╱──────────╲        Tốn thời gian, chạy hàng đêm
               ╱ Integration╲
              ╱    Tests     ╲      Contract tests:
             ╱────────────────╲     Verify interface giữa MFEs
            ╱  Contract Tests  ╲    Chạy ở cả provider và consumer
           ╱────────────────────╲
          ╱    Unit Tests        ╲   Unit tests:
         ╱  (per MFE, isolated)   ╲  Mỗi team chạy cho module của mình
        ╱──────────────────────────╲ Nhanh, chạy trên mỗi PR
```

### Contract Testing Pattern

```tsx
// shared/contracts/product-list.contract.ts
export interface ProductListContract {
  // Props that host will pass
  props: {
    category?: string;
    maxItems?: number;
    onProductClick: (productId: string) => void;
  };
  
  // Events that remote will emit
  events: {
    "product:loaded": { count: number };
    "product:error": { message: string };
  };
  
  // DOM structure guarantees (for CSS/a11y)
  testIds: {
    container: "product-list-container";
    item: "product-list-item";
    loading: "product-list-loading";
  };
}

// Consumer test (Host):
describe("ProductList integration", () => {
  it("calls onProductClick when product is clicked", async () => {
    const onProductClick = jest.fn();
    render(<ProductList onProductClick={onProductClick} />);
    
    await waitFor(() => {
      expect(screen.getByTestId("product-list-container")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getAllByTestId("product-list-item")[0]);
    expect(onProductClick).toHaveBeenCalledWith(expect.any(String));
  });
});

// Provider test (Remote):
describe("ProductList contract", () => {
  it("renders with test IDs from contract", () => {
    render(<ProductList onProductClick={() => {}} />);
    expect(screen.getByTestId("product-list-container")).toBeInTheDocument();
  });
  
  it("emits product:loaded event after data fetch", async () => {
    const eventHandler = jest.fn();
    window.addEventListener("product:loaded", eventHandler);
    
    render(<ProductList onProductClick={() => {}} />);
    
    await waitFor(() => {
      expect(eventHandler).toHaveBeenCalled();
    });
  });
});
```

---

## 11. Q&A Phản biện chuyên sâu

### Q1: "Micro-Frontend có phải over-engineering không? Monolith có gì sai?"

**Trả lời ban đầu**: Micro-Frontend giải quyết scaling problems khi team và codebase lớn.

**Phản biện**: "Nhưng thêm complexity: network requests, shared state, deployment coordination. Đáng không?"

**Trả lời sâu**: Câu trả lời phụ thuộc vào **organizational context**:

```
DÙNG MONOLITH khi:
├── < 3 teams
├── < 50K LoC
├── 1 release cycle chung OK
├── Team size ổn định
└── Tech stack đồng nhất

DÙNG MICRO-FRONTEND khi:
├── 4+ teams (8+ là ideal case)
├── 100K+ LoC
├── Teams cần deploy độc lập
├── Teams ở timezone/location khác nhau
├── Incremental tech migration needed
└── Conway's Law: Architecture nên phản ánh org structure
```

**Conway's Law**: "Organizations design systems that mirror their communication structures." Nếu bạn có 8 autonomous teams, architecture PHẢI cho phép 8 independent deployments. Nếu không, teams sẽ block lẫn nhau.

**Real-world validation**: Được dùng bởi IKEA, Spotify, Zalando, AWS Console, Apple Maps Web — tất cả đều scale lên hàng trăm developers.

---

### Q2: "Module Federation vs iframe vs npm packages — sao không dùng cách đơn giản hơn?"

**So sánh chi tiết**:

```
┌─────────────────┬────────────┬──────────────┬─────────────────┐
│                 │   IFRAME   │ NPM Package  │Module Federation│
├─────────────────┼────────────┼──────────────┼─────────────────┤
│ Isolation       │ ✅ Complete│ ❌ None      │ ⚠️ Partial     │
│ Shared State    │ ❌ Hard    │ ✅ Easy      │ ✅ Easy         │
│ Shared Styling  │ ❌ No      │ ✅ Yes       │ ✅ Yes          │
│ Indep. Deploy   │ ✅ Yes     │ ❌ No*       │ ✅ Yes          │
│ Performance     │ ❌ Heavy   │ ✅ Best      │ ✅ Good         │
│ SEO             │ ❌ Poor    │ ✅ Good      │ ✅ Good         │
│ Shared Deps     │ ❌ Dup     │ ✅ Dedupe    │ ✅ Runtime share│
│ Version Mismatch│ ✅ Safe    │ ❌ Build err │ ⚠️ Runtime err │
│ Communication   │ postMessage│ Direct       │ Direct          │
│ Complexity      │ Low        │ Low          │ Medium-High     │
└─────────────────┴────────────┴──────────────┴─────────────────┘

* NPM Package: Deploy = publish + consumers update + rebuild ALL consumers
  → Không thật sự "independent"
```

**Phản biện**: "iframe isolation tốt hơn mà? Không sợ CSS conflict."

**Trả lời**: Đúng, nhưng iframe có fatal flaws:
1. **Performance**: Mỗi iframe = 1 browser context (riêng DOM, JS engine, memory)
2. **Responsive**: iframe height không auto-resize theo content
3. **SEO**: Search engines không index content trong iframe
4. **UX**: Scrollbar riêng, focus trap, accessibility nightmare
5. **Communication**: Chỉ qua postMessage (async, untyped, error-prone)

Module Federation là **sweet spot**: Share runtime (React, design system) + independent deploy + direct communication.

---

### Q3: "8 autonomous squads — làm sao prevent chaos? Ai đảm bảo consistency?"

**Trả lời sâu**: Cần **governance model** rõ ràng:

```
GOVERNANCE LAYERS:

Layer 1: PLATFORM TEAM (2-3 people)
├── Own Host/Shell application
├── Maintain Module Federation infrastructure  
├── Manage shared CI/CD templates
├── Define contracts/interfaces between MFEs
└── Performance budgets enforcement

Layer 2: DESIGN SYSTEM TEAM (2-3 people)
├── Own @shared/design-system package
├── Component library với Storybook
├── Visual regression testing (Chromatic/Percy)
├── Design tokens (colors, spacing, typography)
└── Accessibility standards (WCAG 2.1 AA)

Layer 3: FEATURE TEAMS (8 squads, 4-6 people each)
├── Own their MFE end-to-end
├── Choose internal architecture/libraries
├── Independent CI/CD
├── Responsible for their MFE's performance
└── Must comply with platform contracts

RULES:
1. ✅ Teams CAN: Choose state management, testing library, internal patterns
2. ✅ Teams CAN: Deploy independently, any time
3. ❌ Teams CANNOT: Use custom UI for buttons, forms (must use design system)
4. ❌ Teams CANNOT: Exceed performance budget (LCP < 2.5s)
5. ❌ Teams CANNOT: Break contract interfaces
```

---

### Q4: "Shared dependencies (React singleton) — nếu team A cần React 19 nhưng team B stuck on React 18?"

**Phản biện**: "Singleton shared nghĩa là TẤT CẢ teams phải dùng cùng version. Mất flexibility."

**Trả lời sâu**: Đây là trade-off thực tế. 3 strategies:

```
Strategy 1: STRICT SINGLETON (Recommended for most)
  shared: { react: { singleton: true, strictVersion: true } }
  
  → Tất cả teams PHẢI dùng cùng React version
  → Upgrade coordination needed (sprint planning)
  → Pro: No version conflicts, smaller bundles
  → Con: Upgrade blocked by slowest team

Strategy 2: SEMVER RANGE
  shared: { react: { singleton: true, requiredVersion: "^18.0.0" } }
  
  → Accept React 18.x bất kỳ, reject React 19
  → Pro: Minor version flexibility
  → Con: Subtle bugs từ minor version differences

Strategy 3: NO SINGLETON (Last resort)
  shared: { react: { singleton: false } }
  
  → Mỗi MFE có thể dùng React version riêng
  → ⚠️ NGUY HIỂM: Multiple React instances = hooks không work cross-boundary
  → Chỉ dùng khi migration (temporary)
  
MIGRATION PATH:
  T1: All teams on React 18 (singleton)
  T2: Team A experiments with React 19 in isolated MFE (no singleton cho MFE này)
  T3: Validate React 19 works → plan team-wide migration
  T4: All teams migrate to React 19 → back to singleton
```

---

### Q5: "Remote entry fails to load — user thấy gì? Cách handle graceful degradation?"

**Trả lời sâu**: Đây là **critical production concern**. Nếu CDN down hoặc remote deploy lỗi:

```tsx
// ✅ Error Boundary cho mỗi remote
class RemoteFallback extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring (Sentry, DataDog)
    monitoring.captureException(error, {
      tags: { remote: this.props.remoteName },
      extra: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Graceful fallback — app vẫn hoạt động!
      return (
        <div className="mfe-error-fallback">
          <p>This section is temporarily unavailable.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage:
<RemoteFallback remoteName="products">
  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList />
  </Suspense>
</RemoteFallback>
```

```
DEGRADATION HIERARCHY:

Level 1: Remote loads successfully → Full functionality ✅
Level 2: Remote slow to load → Show skeleton/loading ⚠️
Level 3: Remote fails to load → Show fallback UI ⚠️
Level 4: Remote loads but crashes → Error boundary catches → Fallback ⚠️
Level 5: Host itself crashes → Static error page from CDN 🔴

KEY PRINCIPLE: Một remote fail KHÔNG ĐƯỢC crash toàn bộ app!
Header MFE down? → Show simple static header
Cart MFE down? → Show "Cart temporarily unavailable"
Products MFE down? → Show cached version hoặc "Please try again"
```

---

### Q6: "CSS conflicts giữa MFEs — remote A's `.button` override remote B's `.button`?"

**Trả lời sâu**: Đây là vấn đề thực tế. Solutions:

```
Strategy 1: CSS Modules (Scoped by default)
  .button → .ProductList_button_a3x2k (unique hash)
  ✅ Zero conflicts
  ✅ Tree-shakeable
  
Strategy 2: CSS-in-JS (Styled-components, Emotion)
  Runtime-generated unique class names
  ✅ Zero conflicts
  ⚠️ Runtime overhead

Strategy 3: Tailwind CSS (Utility-first)
  Mỗi MFE dùng chung Tailwind config (via design tokens)
  ✅ Consistent styling
  ⚠️ Cần shared config

Strategy 4: Shadow DOM (Web Components)
  Encapsulated DOM + styles
  ✅ Complete isolation
  ❌ React integration phức tạp

Strategy 5: BEM + MFE Prefix (Simple)
  .mfe-products__button { }
  .mfe-cart__button { }
  ✅ Simple
  ⚠️ Convention-based (requires discipline)

RECOMMENDATION cho 8+ teams:
  → CSS Modules + shared Tailwind config
  → Design system components handle styling
  → Teams chỉ dùng design system components + CSS Modules cho custom styles
```

---

### Q7: "So sánh Module Federation với Native Federation, Single-SPA, qiankun?"

```
┌──────────────────┬─────────────────┬───────────────┬──────────────┐
│                  │ Module Fed      │ Single-SPA    │ qiankun      │
│                  │ (Webpack 5)     │               │ (Alibaba)    │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ Approach         │ Build-tool      │ Framework     │ Framework    │
│                  │ plugin          │ orchestrator  │ (on top of   │
│                  │                 │               │ single-spa)  │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ Shared Deps      │ ✅ Runtime      │ ⚠️ Manual    │ ⚠️ Manual   │
│ Sharing          │ sharing         │ (import maps) │              │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ Framework Lock   │ ❌ Any          │ ❌ Any        │ ❌ Any       │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ Complexity       │ Medium          │ High          │ Medium       │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ CSS Isolation    │ Manual          │ Manual        │ ✅ Built-in  │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ JS Sandbox       │ ❌ No           │ ❌ No         │ ✅ Built-in  │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ TypeScript       │ ✅ With types   │ ⚠️ Complex   │ ⚠️ Complex  │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ Next.js Support  │ ✅ @mf/nextjs   │ ❌ Hard       │ ❌ Hard      │
├──────────────────┼─────────────────┼───────────────┼──────────────┤
│ Community        │ Large           │ Large         │ Medium       │
│                  │ (Webpack team)  │ (CanopyTax)   │ (Alibaba)    │
└──────────────────┴─────────────────┴───────────────┴──────────────┘

RECOMMENDATION:
  → React + Webpack/Next.js → Module Federation
  → Multi-framework (React + Vue + Angular) → Single-SPA
  → Chinese tech ecosystem → qiankun
  → Vite → @originjs/vite-plugin-federation
```

---

### Q8: "Security concerns? Remote load untrusted code at runtime?"

**Trả lời sâu**: Đây là **serious concern**:

```
ATTACK VECTORS:

1. SUPPLY CHAIN ATTACK:
   Remote CDN bị compromise → serve malicious remoteEntry.js
   → Malicious code chạy trong context của Host
   → Có access tất cả cookies, localStorage, DOM
   
   MITIGATION:
   ├── Subresource Integrity (SRI) cho remoteEntry.js
   ├── Content Security Policy (CSP) headers
   ├── CORS restrictions trên CDN
   └── Signed builds + integrity verification

2. XSS via Remote:
   Remote render user input mà không sanitize
   → XSS trong MFE context = XSS trong host context
   
   MITIGATION:
   ├── Security review cho tất cả MFEs
   ├── Shared sanitization utils
   └── CSP: restrict inline scripts

3. DATA EXFILTRATION:
   Rogue remote đọc cookies/tokens và gửi đi
   
   MITIGATION:
   ├── HttpOnly cookies (JS không đọc được)
   ├── Network monitoring cho outbound requests
   └── Audit logging

TRUST MODEL:
  ✅ First-party remotes (same org): Trust via CI/CD + code review
  ⚠️ Third-party remotes: NEVER trust → iframe + sandbox
```

---

### Q9: "Module Federation với Next.js App Router — có hoạt động không?"

**Trả lời sâu**: Có, nhưng phức tạp:

```
@module-federation/nextjs-mf package:

Challenges:
1. Next.js SSR + Module Federation = Complex
   → Server phải resolve remotes khác với client
   → RSC (React Server Components) không support MF natively

2. Server Components là SERVER-ONLY
   → Không thể lazy load từ remote ở server side
   → Chỉ Client Components có thể là federated

3. Hydration mismatch
   → Server render HTML với 1 version, client load khác
   → Potential hydration errors

Solution trong Next.js:
├── Dùng "use client" cho federated components
├── Dynamic import với ssr: false cho cross-origin remotes
├── Server-side Module Federation chỉ cho internal remotes
└── Hoặc: dùng traditional Webpack setup, wrap Next.js pages

// next.config.js
const { NextFederationPlugin } = require("@module-federation/nextjs-mf");

module.exports = {
  webpack(config) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "host",
        remotes: {
          products: "products@http://localhost:3001/_next/static/ssr/remoteEntry.js",
        },
        shared: {
          react: { singleton: true },
        },
      })
    );
    return config;
  },
};
```

---

### Q10: "Phỏng vấn: Architect Micro-Frontend system cho Cake (6M users, merchant platform, C-Ticket). Bạn thiết kế thế nào?"

**Trả lời production-grade**:

```
CAKE MICRO-FRONTEND ARCHITECTURE:

DOMAIN DECOMPOSITION (8 squads):
├── Squad 1: Shell/Platform (Host app, routing, auth, layout)
├── Squad 2: Merchant Dashboard (revenue, orders, reconciliation)
├── Squad 3: Payment & QR (payment flow, QR code management)
├── Squad 4: C-Ticket (event creation, ticket management, sales)
├── Squad 5: User Management (KYC, profiles, permissions)
├── Squad 6: Marketing Tools (campaigns, promotions, analytics)
├── Squad 7: Chat/Support (chatbot, support tickets, call center)
├── Squad 8: Design System (shared components, tokens, Storybook)

INFRASTRUCTURE:
┌─────────────────────────────────────────────────────────┐
│                    GKE + Cloud CDN                       │
│                                                         │
│  CDN Edge (Cloudflare/Fastly):                          │
│  ├── Shell static assets                                │
│  ├── Remote entry manifests                             │
│  ├── Shared design system bundle                        │
│  └── Per-MFE chunks (versioned)                         │
│                                                         │
│  ┌───────────────────────────────────────────┐          │
│  │        HOST / SHELL (Next.js)              │          │
│  │  ├── Authentication (JWT + refresh)        │          │
│  │  ├── Top-level routing                     │          │
│  │  ├── Layout (sidebar, header)              │          │
│  │  ├── Error boundaries per remote           │          │
│  │  ├── Feature flags integration             │          │
│  │  └── Performance monitoring                │          │
│  │                                            │          │
│  │  ┌────────┐ ┌────────┐ ┌────────┐        │          │
│  │  │Merchant│ │C-Ticket│ │Payment │        │          │
│  │  │  MFE   │ │  MFE   │ │  MFE   │ ...   │          │
│  │  │ React  │ │ React  │ │ React  │        │          │
│  │  │ Zustand│ │ Redux  │ │ Zustand│        │          │
│  │  └────────┘ └────────┘ └────────┘        │          │
│  └───────────────────────────────────────────┘          │
│                                                         │
│  Shared via Module Federation:                          │
│  ├── @cake/design-system (50+ components, Tailwind)     │
│  ├── @cake/auth (JWT handling, permission checks)       │
│  ├── @cake/analytics (tracking, monitoring)             │
│  └── @cake/i18n (Vietnamese/English)                    │
│                                                         │
│  CI/CD (GitHub Actions):                                │
│  ├── Per-MFE pipeline (independent)                     │
│  ├── Contract tests on PR                               │
│  ├── Visual regression (Chromatic)                      │
│  ├── Lighthouse CI performance gates                    │
│  └── Canary deployment (5% → 100%)                     │
└─────────────────────────────────────────────────────────┘

C-TICKET SPECIFIC (high traffic):
├── Landing pages: SSG + CDN (handle 10M+ req/s)
├── Ticket selection: SSR + WebSocket (real-time availability)
├── Queue: Client component + SSE (position updates)
├── Checkout: Server-only (PCI compliance)
└── Auto-scaling: GKE HPA + CDN burst capacity
```

---

### Q11: "Performance budget cho Micro-Frontend — overhead là bao nhiêu?"

```
OVERHEAD ANALYSIS:

1. remoteEntry.js download: 5-15KB per remote (gzip)
   8 remotes × 10KB = 80KB overhead
   
2. Runtime Module Federation code: ~20KB
   (Webpack runtime for chunk loading)

3. Network waterfall:
   Host loads → remoteEntry.js loads → actual chunks load
   → Thêm 1 round-trip (~50-100ms)

TOTAL OVERHEAD: ~100KB + 1 round-trip

MITIGATION:
├── Preload remoteEntry.js: <link rel="preload" href="remoteEntry.js">
├── Service Worker cache remote entries
├── HTTP/2 multiplexing (parallel downloads)
├── Shared chunks (React loaded once = 172KB saved per remote)
└── Route-based loading (only load visible remotes)

NET RESULT:
  Monolith bundle: ~800KB (everything)
  MFE initial: ~200KB (host + visible remote) + 100KB overhead = 300KB
  → 62.5% SMALLER initial load!
  → Nhưng: total download qua session có thể lớn hơn
```

---

### Q12: "Monitoring & Observability cho Micro-Frontend?"

```
MONITORING STRATEGY:

1. PER-MFE METRICS:
   ├── Load time (remoteEntry.js → first render)
   ├── Error rate (JS errors per remote)
   ├── Bundle size (track over time)
   └── Core Web Vitals contribution

2. CROSS-MFE METRICS:
   ├── Page load time (all MFEs combined)
   ├── Interaction latency (cross-MFE events)
   └── Shared dependency version matrix

3. ALERTING:
   ├── Remote entry failed to load → P1 alert
   ├── Error rate > 1% for any remote → P2 alert
   ├── Load time > 3s for any remote → P3 alert
   └── Bundle size increase > 20% → PR comment

4. TOOLING:
   ├── Sentry: Per-MFE error tracking (tag by remote name)
   ├── DataDog: RUM (Real User Monitoring)
   ├── Lighthouse CI: Performance gates in CI
   └── Custom dashboard: MFE health overview
```

---

### Q13: "Developer Experience (DX) — local development workflow cho 8 MFEs?"

```
CHALLENGE: Developer cần run Host + Remote khi developing

SOLUTIONS:

1. FULL LOCAL (Simple but heavy):
   Run ALL MFEs locally: 8 dev servers
   → Tốn RAM, CPU
   → Slow startup
   
2. HYBRID (Recommended):
   Run HOST + MFE đang develop locally
   Other MFEs: point to staging/production URLs
   
   // host/webpack.config.dev.js
   remotes: {
     // Đang develop products → local
     products: "products@http://localhost:3001/remoteEntry.js",
     // Còn lại → staging environment
     cart: "cart@https://staging.cake.vn/cart/remoteEntry.js",
     header: "header@https://staging.cake.vn/header/remoteEntry.js",
   }

3. STANDALONE MODE:
   Mỗi MFE có thể chạy standalone (như mini-app)
   Có own routing, mock data, dev layout
   → Developer KHÔNG CẦN host để develop
   → Nhanh, isolated, focused
   
   // remote-products/src/dev.tsx (standalone entry)
   import { DevShell } from "@cake/dev-tools";
   import ProductList from "./ProductList";
   
   ReactDOM.render(
     <DevShell mockUser={mockUser} mockTheme="light">
       <ProductList />
     </DevShell>,
     document.getElementById("root")
   );
```

---

### Q14: "Khi nào KHÔNG nên dùng Micro-Frontend?"

```
❌ ĐỪNG dùng Micro-Frontend khi:

1. Team size < 15 developers
   → Overhead > benefit
   → Monolith + good architecture đủ tốt

2. Startup/MVP phase
   → Cần velocity, không cần scalability
   → Architecture có thể thay đổi hoàn toàn

3. Simple CRUD application
   → Không đủ phức tạp để chia domains
   → Overkill

4. Team không có DevOps maturity
   → MFE cần CI/CD, CDN, monitoring infrastructure
   → Nếu deploy manual → MFE là nightmare

5. Strong coupling between features
   → Nếu tất cả features share CÙNG data model
   → Chia MFE → quá nhiều cross-MFE communication

RULE OF THUMB:
  "Can 2+ teams work independently for 2+ sprints without coordinating?"
  YES → Consider Micro-Frontend
  NO  → Stay Monolith, focus on modular architecture
```

---

### Q15: "Micro-Frontend vs Monorepo (Turborepo/Nx) — cần cả hai không?"

**Trả lời sâu**:

```
MONOREPO ≠ MONOLITH
MICRO-FRONTEND ≠ MULTI-REPO

Chúng là orthogonal concerns:

Option 1: MONOREPO + MICRO-FRONTEND ← Recommended
  turborepo/
  ├── apps/
  │   ├── host/           # Host MFE
  │   ├── products-mfe/   # Remote MFE
  │   ├── cart-mfe/        # Remote MFE
  │   └── ...
  ├── packages/
  │   ├── design-system/  # Shared UI
  │   ├── auth/           # Shared auth
  │   └── config/         # Shared config
  └── turbo.json
  
  Pros:
  ✅ Shared tooling (ESLint, TypeScript config)
  ✅ Atomic commits across packages
  ✅ Easy refactoring (IDE finds all usages)
  ✅ But: still INDEPENDENT BUILD & DEPLOY per MFE
  
  Cons:
  ⚠️ Large repo (but Turborepo handles caching)
  ⚠️ CI needs to know which MFEs changed

Option 2: MULTI-REPO + MICRO-FRONTEND
  github.com/cake/host
  github.com/cake/products-mfe
  github.com/cake/cart-mfe
  github.com/cake/design-system (npm package)
  
  Pros:
  ✅ Complete team isolation
  ✅ Independent CI/CD (simpler)
  
  Cons:
  ❌ Harder to share code
  ❌ Dependency version drift
  ❌ Cross-repo changes = multiple PRs

RECOMMENDATION for Cake (8 teams):
  → Monorepo (Turborepo) + Module Federation
  → Benefits of both: shared tooling + independent deployment
  → Design system as internal package (not npm)
```

---

### Q16: "Testing strategy cho Micro-Frontend — làm sao test integration giữa host và remotes?"

**Trả lời ban đầu**: Cần kết hợp unit test per-MFE và E2E test for integration.

**Phản biện**: "Unit tests chỉ test isolated components. Làm sao biết host và remote tương thích nhau tại runtime? Nếu remote thay đổi interface mà host không biết?"

**Trả lời sâu**:

```
TESTING PYRAMID cho MFE:

Layer 1: UNIT TESTS (per MFE team — fast, isolated)
├── Test component logic
├── Test business rules
├── Mock remote dependencies
└── ~70% of all tests

Layer 2: CONTRACT TESTS (cross-team — catch interface breaks early)
├── Remote "publishes" a contract (what it exposes + expected props)
├── Host "consumes" the contract (validates expected interface)
├── Pact.js hoặc custom contract testing framework
└── Run in CI before merging

Layer 3: INTEGRATION TESTS (per MFE in host context)
├── Spin up real remote servers (dev mode)
├── Test host loads and renders remote correctly
├── Test shared state events work
└── ~20% of all tests

Layer 4: E2E TESTS (full system — slow, expensive)
├── Playwright/Cypress against staging
├── Critical user journeys only
├── Add to product/cart/checkout flow
└── ~10% of all tests — run nightly
```

```tsx
// CONTRACT TESTING với Pact.js
// Bên Remote: Define contract (what this MFE exposes)
// remote-products/src/contract.ts
export const ProductsContract = {
  // Interface ProductList component expects
  mount: (container: HTMLElement, props: {
    category?: string;
    onAddToCart: (productId: string) => void;
    userId: string;
  }) => void;
  unmount: (container: HTMLElement) => void;
  // Event contract: what custom events this MFE emits
  events: {
    'mfe:product:added': { productId: string; quantity: number; price: number };
    'mfe:product:viewed': { productId: string };
  };
};

// Bên Host: Validate remote honors the contract
// host/tests/products-contract.test.ts
describe('Products MFE Contract', () => {
  it('should expose mount function with correct signature', async () => {
    const remote = await import('products/ProductList');
    expect(typeof remote.mount).toBe('function');
    expect(remote.mount.length).toBe(2); // container + props
  });

  it('should emit correct event shape when product added', async () => {
    const eventSpy = jest.fn();
    window.addEventListener('mfe:product:added', eventSpy);
    // Trigger add to cart action
    // Verify event shape matches contract
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          productId: expect.any(String),
          quantity: expect.any(Number),
          price: expect.any(Number),
        })
      })
    );
  });
});
```

```bash
# CI Pipeline cho Contract Testing
# Step 1: Remote MFE publishes contract
npm run test:contract:publish -w remote-products
# → Uploads contract to Pact Broker

# Step 2: Host validates against published contracts
npm run test:contract:verify -w host
# → Downloads contracts, runs verification
# → FAILS if remote changed interface

# Step 3: Only after verification passes, deploy remote
# → Prevents breaking host in production
```

**Key insight**: Contract tests là "bridge" giữa independent teams. Remote team tự do change implementation, nhưng KHÔNG được change interface đã publish mà không coordinate với consumers. Đây là **consumer-driven contract testing** — host defines what it needs, remotes must honor it.

---

### Q17: "CI/CD pipeline cho MFE — làm sao deploy 8 teams independently mà không break production?"

**Trả lời ban đầu**: Mỗi MFE có CI/CD pipeline riêng, deploy độc lập.

**Phản biện**: "Nếu remote-products deploy version mới có breaking change, host đang chạy version cũ sẽ crash. Làm sao handle backward compatibility?"

**Trả lời sâu**:

```
CI/CD STRATEGY: "Deploy Without Fear" Pattern

PHASE 1: VALIDATE (per MFE branch)
├── Unit tests + contract tests
├── Bundle size check (< 200KB threshold)
├── TypeScript compile check
└── Lint + security audit

PHASE 2: DEPLOY TO STAGING (isolated environment)
├── Deploy new remote version to CDN staging
├── Update staging remotes.json manifest
├── Run smoke tests against staging host
└── Visual regression tests (screenshot diff)

PHASE 3: CANARY DEPLOY (production — 5% traffic)
├── Deploy new remote to CDN with version suffix
│   cdn.example.com/products/v2.1.0/remoteEntry.js
├── Feature flag: 5% users → new version
├── Monitor error rates for 30 minutes
└── Auto-rollback if error rate > 1%

PHASE 4: FULL DEPLOY
├── Gradually increase: 5% → 25% → 50% → 100%
├── Update remotes.json to point to new version
├── Keep old version on CDN for 24h (for rollback)
└── Notify host team that new version is stable

ROLLBACK PROCEDURE (< 60 seconds):
├── Update remotes.json on CDN (edge cache purge)
├── Revert CDN path to previous version
└── No code deploy needed — manifest-driven
```

```tsx
// remotes.json (CDN manifest — single source of truth)
{
  "version": "2024-06-10T15:30:00Z",
  "remotes": {
    "products": {
      "url": "https://cdn.example.com/products/v2.1.0/remoteEntry.js",
      "previousUrl": "https://cdn.example.com/products/v2.0.5/remoteEntry.js",
      "healthCheck": "https://cdn.example.com/products/v2.1.0/health.json"
    },
    "cart": {
      "url": "https://cdn.example.com/cart/v1.8.2/remoteEntry.js",
      "previousUrl": "https://cdn.example.com/cart/v1.8.1/remoteEntry.js"
    }
  }
}

// Host: Dynamic manifest loading với automatic rollback
async function loadManifest() {
  const manifest = await fetch('/remotes.json', { cache: 'no-store' });
  const config = await manifest.json();

  // Validate each remote is healthy before using new version
  for (const [name, remote] of Object.entries(config.remotes)) {
    try {
      await fetch(remote.healthCheck, { signal: AbortSignal.timeout(2000) });
    } catch {
      console.warn(`${name} health check failed, using previous version`);
      config.remotes[name].url = remote.previousUrl; // Auto-fallback
    }
  }
  return config;
}
```

**Key metric**: Với pattern này, MTTR (Mean Time To Recovery) giảm từ ~30 phút (redeploy code) xuống còn **< 60 giây** (update manifest file trên CDN).

---

### Q18: "State Management trong MFE — Zustand vs Redux vs Custom Events. Khi nào dùng cái nào?"

**Trả lời ban đầu**: Custom events cho simple cases, shared store cho complex state.

**Phản biện**: "Custom events không có TypeScript safety, hard to debug, no devtools. Tại sao không dùng Redux toàn cục như monolith?"

**Trả lời sâu**:

```
STATE MANAGEMENT SPECTRUM:

Level 1: LOCAL STATE (99% of state — không share)
├── useState/useReducer trong component
├── Zustand store PER MFE (không share)
├── React Query per MFE (server state)
└── Rule: Default đây trước khi nghĩ đến sharing

Level 2: CROSS-MFE COMMUNICATION (chỉ events — 1 chiều)
├── CustomEvent ("mfe:cart:updated")
├── TypeScript-safe với EventMap type
├── Use khi: Notification-style (fire and forget)
└── Ví dụ: Products → notify → Cart badge update

Level 3: SHARED READ STATE (limited — read-only sharing)
├── Shared zustand store (singleton trong shared-lib)
├── Host "owns" state, remotes "read" state
├── Use khi: Auth state, user preferences, theme
└── Remotes KHÔNG được mutate shared state

Level 4: SHARED WRITE STATE (avoid nếu có thể)
├── REST/GraphQL API (source of truth ở server)
├── Each MFE fetches what it needs
├── Optimistic updates per MFE
└── Use khi: Cart items (cần persist, shared across MFEs)
```

```tsx
// Level 3: Shared Auth Store (đúng cách)
// packages/shared-auth/src/store.ts
// MFE nào cũng import từ shared-auth (singleton qua Module Federation)
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  permissions: string[];
  // KHÔNG có setter từ bên ngoài
}

// Host-only: internal setter (không export)
const _setUser = (user: User | null) => useAuthStore.setState({ user });

// Export cho remotes: READ ONLY
export const useAuthStore = create<AuthState>(() => ({
  user: null,
  permissions: [],
}));

// Remotes dùng như này:
// const { user } = useAuthStore(); ← Read only, OK
// useAuthStore.setState({ user: newUser }); ← Remote KHÔNG được làm

// Level 2: Cross-MFE Events (TypeScript safe)
// packages/shared-events/src/types.ts
export interface MFEEventMap {
  'mfe:cart:item-added': { productId: string; quantity: number };
  'mfe:cart:item-removed': { productId: string };
  'mfe:user:logged-in': { userId: string };
  'mfe:user:logged-out': never;
  'mfe:notification:show': { message: string; type: 'success' | 'error' };
}

// Type-safe emit (Products MFE)
function emitMFEEvent<K extends keyof MFEEventMap>(
  event: K,
  detail: MFEEventMap[K]
) {
  window.dispatchEvent(new CustomEvent(event, { detail, bubbles: true }));
}

// Usage:
emitMFEEvent('mfe:cart:item-added', { productId: 'p123', quantity: 2 });
// ↑ TypeScript error nếu detail shape sai
```

**Quy tắc vàng**: "Nếu state chỉ cần trong 1 MFE, đừng share nó." MFE isolation chỉ thực sự hoạt động khi teams resist temptation to share state unnecessarily. Shared state = shared fate = coupling.

---

### Q19: "Error Boundary và Resilience — remote crash không được crash toàn bộ host?"

**Trả lời ban đầu**: Dùng React Error Boundary wrap từng remote.

**Phản biện**: "Error Boundary chỉ catch render errors. Network errors khi load remoteEntry.js? Import failures? Chunk loading errors?"

**Trả lời sâu**:

```
FAILURE MODES trong MFE:

1. Network Failure khi load remoteEntry.js
   → Script tag onerror
   → Dynamic import rejection
   → Webpack Federation load failure

2. Remote loads nhưng component throws
   → React Error Boundary (render phase)
   → useEffect errors (không catch được bởi Error Boundary)

3. Remote loads nhưng API calls fail
   → React Query error state
   → React Suspense + ErrorBoundary combo

4. Remote loads nhưng type mismatch (contract broken)
   → Runtime JavaScript error
   → TypeError trong render

5. Memory leaks khi unmount
   → Remote không cleanup event listeners
   → setInterval không cleared
```

```tsx
// COMPREHENSIVE Error Handling cho Remote MFE
// host/src/RemoteLoader.tsx

import React, { Suspense, lazy } from 'react';

// 1. Retry logic cho chunk loading failures
function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 3
) {
  return lazy(() => {
    const attempt = (retriesLeft: number): Promise<{ default: T }> =>
      importFn().catch((err) => {
        if (retriesLeft <= 0) throw err;
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, maxRetries - retriesLeft) * 1000;
        return new Promise((resolve) => setTimeout(resolve, delay))
          .then(() => attempt(retriesLeft - 1));
      });
    return attempt(maxRetries);
  });
}

// 2. Error Boundary với detailed error states
interface ErrorBoundaryState {
  hasError: boolean;
  errorType: 'network' | 'render' | 'timeout' | null;
  error: Error | null;
}

class RemoteErrorBoundary extends React.Component<
  { children: React.ReactNode; remoteName: string; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorType: null, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorType = error.message.includes('Loading chunk')
      ? 'network'
      : error.message.includes('timeout')
      ? 'timeout'
      : 'render';
    return { hasError: true, errorType, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Report to monitoring (Sentry/Datadog)
    window.monitoring?.captureException(error, {
      tags: { mfe: this.props.remoteName, errorType: this.state.errorType },
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div role="alert" aria-label={`${this.props.remoteName} unavailable`}>
        {this.state.errorType === 'network'
          ? <p>Could not load {this.props.remoteName}. Check your connection.</p>
          : <p>{this.props.remoteName} encountered an error.</p>
        }
        <button onClick={() => this.setState({ hasError: false, errorType: null, error: null })}>
          Retry
        </button>
      </div>
    );
  }
}

// 3. Complete remote wrapper
const ProductsRemote = lazyWithRetry(
  () => import('products/ProductList'),
  3 // max retries
);

export function RemoteProducts() {
  return (
    <RemoteErrorBoundary remoteName="Products" fallback={<ProductsFallback />}>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsRemote />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
```

**Insight quan trọng**: Error Boundary là cần thiết nhưng không đủ. Cần kết hợp: retry logic + error boundary + monitoring + graceful fallback UI + user feedback. "Fail gracefully, recover automatically" là tiêu chí thiết kế.

---

### Q20: "Làm thế nào version MFEs? Semantic versioning có apply cho runtime federation không?"

**Trả lời ban đầu**: Dùng versioned URLs trên CDN, keep manifest up-to-date.

**Phản biện**: "Nếu remote thay đổi props interface (breaking change) nhưng host không biết. Semver chỉ là convention, không enforce được ở runtime?"

**Trả lời sâu**:

```
VERSIONING STRATEGIES:

Option A: URL-based Versioning (Recommended)
cdn.example.com/products/v2.1.0/remoteEntry.js
├── Major: Breaking interface change
├── Minor: New features, backward compatible
├── Patch: Bug fixes
└── Host reads version from manifest — no hardcoding

Option B: Latest-always (Simple nhưng dangerous)
cdn.example.com/products/latest/remoteEntry.js
├── ✅ Simpler deployment
├── ❌ No control — remote deploy breaks host immediately
└── ❌ Không rollback được per-version

Option C: Hash-based (Content Addressable)
cdn.example.com/products/sha256-abc123.../remoteEntry.js
├── ✅ Immutable — same hash = same code
├── ✅ Perfect cache hit
├── ❌ Manifest must be updated every deploy
└── Used in conjunction with Option A
```

```tsx
// RUNTIME INTERFACE VALIDATION (enforce contract at runtime)
// Không thể dùng TypeScript vì cross-bundle boundary

// remote-products/src/ProductList.tsx
// Remote self-describes its interface version
export const MFE_INTERFACE_VERSION = '2.1.0';
export const MFE_REQUIRED_HOST_VERSION = '>=1.5.0'; // Semver range

export function mount(container: HTMLElement, props: ProductListProps) {
  // Validate required props at runtime
  if (!props.onAddToCart || typeof props.onAddToCart !== 'function') {
    throw new Error('[ProductsMFE] onAddToCart prop is required and must be a function');
  }
  // ... mount logic
}

// host/src/RemoteLoader.tsx
// Host validates interface before mounting
async function loadAndValidateRemote(remoteName: string) {
  const remote = await import(`${remoteName}/main`);

  // Check interface version compatibility
  const remoteVersion = remote.MFE_INTERFACE_VERSION;
  const hostExpects = REMOTE_VERSION_REQUIREMENTS[remoteName]; // from config

  if (!semver.satisfies(remoteVersion, hostExpects)) {
    throw new Error(
      `Interface incompatibility: ${remoteName} v${remoteVersion} ` +
      `does not satisfy host requirement ${hostExpects}. ` +
      `Falling back to previous version.`
    );
  }

  return remote;
}
```

```
INTERFACE VERSIONING GOVERNANCE:

Breaking changes (Major version bump) — REQUIRE:
├── Advance notice: 2-sprint warning to all consumers
├── Migration guide in CHANGELOG
├── Parallel support: Old + new interface co-exist for 1 sprint
└── Host team must upgrade before old interface deprecated

Non-breaking changes (Minor/Patch) — REQUIRE:
├── Props thêm mới phải có default values
├── Events mới phải be documented
└── CI contract tests must still pass
```

---

### Q21: "Micro-Frontend với Server-Side Rendering (SSR) — có thể kết hợp không?"

**Trả lời ban đầu**: Module Federation có hỗ trợ SSR với Node.js target.

**Phản biện**: "Nếu remote là client-side only, SSR của host sẽ có HTML mismatch? Hydration sẽ fail?"

**Trả lời sâu**:

```
SSR + MFE: 4 Approaches

Approach 1: CLIENT-SIDE MFE + SSR HOST (Most common)
├── Host renders shell SSR (nav, layout, critical content)
├── Remotes load client-side after hydration
├── Remote placeholders in HTML: <div id="products-mfe-container"></div>
├── ✅ Fast initial paint (host SSR)
├── ⚠️ Remote content không có trong initial HTML (SEO concern for remotes)
└── Best for: Internal tools, behind-login apps

Approach 2: ESI (Edge Side Includes) — Legacy but proven
├── CDN assembles HTML from multiple origin servers at edge
├── <esi:include src="https://products-service.com/fragment" />
├── ✅ Full SSR for all MFEs
├── ❌ Dependent on CDN ESI support (Varnish, Akamai, Fastly)
└── ❌ Complexity trong local dev

Approach 3: Module Federation SSR (Webpack 5)
├── Remote exposes Node.js bundle (server target)
├── Host SSR server imports remote component directly
├── Render to string → Send to client → Hydrate
├── ✅ Full SSR + hydration
├── ❌ Remote team phải ship Node.js bundle THÊM web bundle
└── ❌ Remote deploy kết nối Host SSR deploy

Approach 4: Next.js App Router + RSC (Emerging)
├── Each MFE as separate Next.js RSC component
├── Composited at the Next.js layer
├── ✅ Best DX, full SSR
└── ❌ Buộc phải dùng Next.js cho tất cả MFEs
```

```tsx
// Approach 1 Implementation: CSR MFE trong SSR Host
// host/src/app/products/page.tsx (Next.js)

// Đây là Server Component
export default async function ProductsPage() {
  // Host render shell SSR — fast first paint
  const categories = await fetchCategories(); // Server data fetch

  return (
    <div>
      <h1>Products</h1>
      <nav>
        {categories.map(cat => <CategoryLink key={cat.id} {...cat} />)}
      </nav>

      {/* Remote MFE placeholder — client-side only */}
      <Suspense fallback={<ProductsSSRFallback />}>
        <ProductsMFEClient /> {/* 'use client' wrapper */}
      </Suspense>
    </div>
  );
}

// host/src/components/ProductsMFEClient.tsx
'use client'; // Client boundary — where remote MFE mounts

import dynamic from 'next/dynamic';

const ProductsRemote = dynamic(
  () => import('products/ProductList').catch(() => ({
    default: () => <ProductsFallback />
  })),
  {
    ssr: false, // Disable SSR for remote MFE (prevents hydration mismatch)
    loading: () => <ProductsSkeleton />
  }
);

export function ProductsMFEClient() {
  return <ProductsRemote />;
}
```

**Recommendation**: Với SEO-critical pages (product listings, marketing), dùng **Approach 2 (ESI)** hoặc **Approach 3 (MF SSR)**. Với authenticated flows (dashboard, checkout), **Approach 1** đủ tốt và đơn giản hơn nhiều.

---

### Q22: "Làm sao handle authentication và authorization cross MFEs? JWT ở đâu?"

**Trả lời ban đầu**: Shared auth module (singleton), HTTP-Only cookies cho JWT.

**Phản biện**: "Nếu user session expire trong khi đang dùng Products MFE, Cart MFE sẽ biết không? Token refresh race condition giữa các MFEs?"

**Trả lời sâu**:

```
AUTH ARCHITECTURE cho MFE:

ANTI-PATTERNS (đừng làm):
├── ❌ Mỗi MFE tự handle auth independently
├── ❌ JWT trong localStorage (XSS vulnerable)
├── ❌ Multiple refresh token calls (race condition)
└── ❌ Auth state trong global window.__auth

CORRECT PATTERN: Auth as Singleton MFE Service

Host owns auth lifecycle:
├── JWT access token: Memory only (không persist)
├── Refresh token: HTTP-Only Secure Cookie
├── Auth state: Shared Zustand store (read-only cho remotes)
└── Token refresh: Centralized AuthService (singleton)
```

```tsx
// packages/shared-auth/src/AuthService.ts (Singleton)
// Loaded bởi HOST, shared qua Module Federation singleton

class AuthService {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null; // Prevent race conditions

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Token refresh với deduplication — chỉ 1 refresh call tại 1 thời điểm
  async refreshAccessToken(): Promise<string> {
    // Nếu đang có refresh in-flight, chờ nó — không gọi thêm
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Sends HTTP-Only refresh token cookie
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Refresh failed');
        const { accessToken } = await res.json();
        this.accessToken = accessToken;
        // Notify all MFEs that token refreshed
        window.dispatchEvent(new CustomEvent('mfe:auth:token-refreshed'));
        return accessToken;
      })
      .finally(() => {
        this.refreshPromise = null; // Reset để lần sau có thể refresh lại
      });

    return this.refreshPromise;
  }

  // Axios interceptor — dùng ở tất cả MFEs
  createAuthenticatedClient() {
    const client = axios.create();

    client.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const newToken = await this.refreshAccessToken();
            // Retry original request với token mới
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return client.request(error.config);
          } catch {
            // Refresh failed → user phải login lại
            window.dispatchEvent(new CustomEvent('mfe:auth:session-expired'));
            throw error;
          }
        }
        throw error;
      }
    );

    return client;
  }
}

// Singleton export — Module Federation ensures single instance
export const authService = new AuthService();

// Host listens for session expiry from any MFE
window.addEventListener('mfe:auth:session-expired', () => {
  // Centralized logout: clear state, redirect to login
  useAuthStore.setState({ user: null, permissions: [] });
  router.push('/login');
});
```

**Key insight về race condition**: Nếu Products và Cart MFE cùng lúc nhận 401, cả hai cùng gọi refresh → 2 refresh calls → second call fail (refresh token already used). Giải pháp: `refreshPromise` singleton pattern — chỉ 1 refresh in-flight, tất cả caller await cùng 1 promise.

---

### Q23: "Làm sao migrate từ Monolith sang Micro-Frontend mà không Big Bang rewrite?"

**Trả lời ban đầu**: Strangler Fig pattern — migrate từng phần.

**Phản biện**: "Strangler Fig đơn giản trên paper. Thực tế, shared database, shared state, coupled components — làm sao tách mà không downtime?"

**Trả lời sâu**:

```
MIGRATION ROADMAP: Monolith → MFE (Thực chiến)

Phase 0: ASSESSMENT (1-2 sprints)
├── Identify seams: Natural domain boundaries
│   Xem: team ownership, feature flags, deployment frequency
├── Measure coupling: Shared state, shared components
├── Define target: Which domains → Which MFEs
└── Identify "North Star": Host shell + priority MFEs

Phase 1: EXTRACT INFRASTRUCTURE (2-4 sprints)
├── Set up Host shell (just navbar + routing)
├── Module Federation config (without actual remotes yet)
├── Design system as shared package
├── Auth as shared singleton
└── Monolith vẫn fully intact — zero risk

Phase 2: SHADOW MIGRATION (1 sprint per domain)
├── Build new MFE in parallel (same feature, new codebase)
├── Feature flag: 5% users → new MFE
├── A/B compare metrics: Performance, errors, business KPIs
├── If metrics OK → increase to 100%
└── Old monolith code stays until confident

Phase 3: REMOVE MONOLITH FEATURE (after MFE stable)
├── Delete old monolith code
├── Remove feature flag
└── Team fully owns their MFE

CRITICAL: Database Migration Strategy
├── Monolith DB → Domain DBs: NOT required upfront
├── Start: MFE still calls Monolith APIs (Façade Pattern)
├── Later: MFE team extracts their own microservice
└── Database decoupling is separate from frontend migration
```

```tsx
// STRANGLER FIG implementation với Feature Flags
// host/src/App.tsx

import { useFeatureFlag } from '@shared/feature-flags';

function App() {
  const useNewProductsMFE = useFeatureFlag('new-products-mfe');

  return (
    <Routes>
      <Route path="/products" element={
        useNewProductsMFE
          ? <RemoteProducts /> // New MFE
          : <LegacyProductsPage /> // Old monolith component
      } />
    </Routes>
  );
}

// Trong Sprint đầu: 5% users thấy new MFE
// Dần dần tăng đến 100% khi confident
// Sau đó xóa LegacyProductsPage
```

**Sai lầm phổ biến nhất**: "Big Bang rewrite" — dừng feature development 6 tháng để migrate. **Không bao giờ làm vậy.** Strangler Fig với feature flags cho phép migrate incrementally, đo lường từng bước, rollback nếu cần.

---

### Q24: "Accessibility (a11y) trong MFE — focus management, ARIA landmarks, khi remotes mount/unmount?"

**Trả lời ban đầu**: Mỗi MFE tự handle a11y của mình.

**Phản biện**: "Khi remote MFE mount, focus vẫn ở cũ. Screen reader không biết content đã thay đổi. ARIA live regions từ multiple MFEs conflict nhau?"

**Trả lời sâu**:

```
A11Y CHALLENGES SPECIFIC TO MFE:

1. FOCUS MANAGEMENT khi navigate between MFEs
   Problem: React router change trong Host, Remote re-renders
   → Focus stays on nav link (old position)
   → Screen reader users lost context

2. ARIA LIVE REGIONS conflict
   Problem: Products MFE có aria-live="polite"
   Cart MFE có aria-live="polite"  
   → 2 live regions → screen reader reads both simultaneously
   → Confusing/chaotic for screen reader users

3. SKIP NAVIGATION Links
   Problem: Each MFE might add its own "skip to content"
   → Multiple skip links = confusing

4. PAGE TITLE management
   Problem: Both Host and Remotes might set document.title
   → Race condition → wrong title
```

```tsx
// CENTRALIZED A11Y EVENT SYSTEM
// packages/shared-a11y/src/index.ts

// 1. Centralized focus management
export function announceFocusChange(message: string, targetEl?: HTMLElement) {
  // Update aria-live region (owned by Host shell — single source)
  const liveRegion = document.getElementById('mfe-a11y-live');
  if (liveRegion) {
    liveRegion.textContent = ''; // Clear first (force re-announce)
    requestAnimationFrame(() => {
      liveRegion!.textContent = message;
    });
  }

  // Move focus to target (or skip to main if not specified)
  setTimeout(() => {
    const target = targetEl || document.getElementById('main-content');
    target?.focus();
  }, 100); // After render
}

// 2. Host shell ARIA structure (one per app, remotes don't duplicate)
// host/src/App.tsx
function AppShell() {
  return (
    <>
      {/* Single screen reader live region — owned by Host */}
      <div
        id="mfe-a11y-live"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only" // Visually hidden
      />

      {/* Single skip nav — owned by Host */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header role="banner">
        <nav role="navigation" aria-label="Main navigation">
          {/* ... */}
        </nav>
      </header>

      <main id="main-content" role="main" tabIndex={-1}>
        {/* Remotes render here */}
      </main>
    </>
  );
}

// 3. Remote MFE: Request focus change via event (không self-manage)
// remote-products/src/ProductList.tsx
function ProductList() {
  useEffect(() => {
    // Khi remote mount, announce to screen readers qua Host
    window.dispatchEvent(new CustomEvent('mfe:a11y:announce', {
      detail: { message: 'Product list loaded', focusId: 'products-heading' }
    }));
  }, []);

  // 4. Page title owned by Host — remotes request via event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mfe:page:title-change', {
      detail: { title: 'Products — MyApp' }
    }));
  }, []);

  return (
    <section aria-label="Product listings">
      <h2 id="products-heading" tabIndex={-1}>Products</h2>
      {/* ... */}
    </section>
  );
}

// Host handles all a11y coordination
window.addEventListener('mfe:a11y:announce', (e: CustomEvent) => {
  announceFocusChange(e.detail.message, document.getElementById(e.detail.focusId));
});

window.addEventListener('mfe:page:title-change', (e: CustomEvent) => {
  document.title = e.detail.title;
});
```

**Key principle**: **Host shell owns the accessibility "contract"** — single live region, single skip link, single page title manager. Remotes REQUEST changes via events; họ không tự manage global a11y concerns. Điều này prevents conflicts và ensures consistent screen reader experience.

---

### Q25: "Làm sao debug runtime errors trong MFE? Source maps, distributed tracing, error attribution?"

**Trả lời ban đầu**: Sentry per-MFE với tags để identify which remote.

**Phản biện**: "User thấy lỗi trên Host. Error xảy ra ở Remote code. Stack trace chỉ show compiled code. Làm sao biết lỗi thuộc team nào? Làm sao correlate request từ Host → Remote API?"

**Trả lời sâu**:

```
OBSERVABILITY STACK cho MFE:

Layer 1: ERROR TRACKING (Sentry)
├── Separate Sentry PROJECT per MFE team
│   products-mfe.sentry.io (owned by Products team)
│   cart-mfe.sentry.io (owned by Cart team)
├── Source maps uploaded per MFE per deploy
│   → Readable stack traces despite code splitting
├── MFE identifier tags tự động
└── Cross-project linking qua correlation IDs

Layer 2: PERFORMANCE MONITORING (Datadog RUM / Grafana)
├── Custom metrics per MFE:
│   - Remote load time (remoteEntry.js fetch)
│   - Component mount time
│   - API response times per domain
└── Dashboard: Host metrics + per-Remote metrics

Layer 3: DISTRIBUTED TRACING (OpenTelemetry)
├── Correlation ID generated ở Host on page load
├── Passed to all Remotes via context
├── All API calls include X-Trace-ID header
└── Trace: User action → Host → Remote → API → DB
```

```tsx
// 1. Source Maps Configuration
// remote-products/webpack.config.js
module.exports = {
  devtool: process.env.NODE_ENV === 'production'
    ? 'hidden-source-map' // Generate nhưng không serve publicly
    : 'cheap-module-source-map',

  plugins: [
    new ModuleFederationPlugin({ /* ... */ }),

    // Upload source maps tự động sau build
    new SentryWebpackPlugin({
      org: "mycompany",
      project: "products-mfe", // Separate Sentry project
      include: "./dist",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.env.RELEASE_VERSION, // e.g., "products@2.1.0"
    }),
  ],
};

// 2. Distributed Tracing Setup
// packages/shared-telemetry/src/index.ts
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('mfe-host');

// Host: Generate correlation ID khi user load page
export function initializeTracing(): string {
  const span = tracer.startSpan('page-load');
  const correlationId = span.spanContext().traceId;

  // Store in context — accessible by all MFEs via shared module
  sessionStorage.setItem('__mfe_correlation_id', correlationId);

  window.addEventListener('beforeunload', () => span.end());
  return correlationId;
}

// Shared Axios instance — dùng bởi tất cả MFEs
export function createTracedClient() {
  const client = axios.create();

  client.interceptors.request.use((config) => {
    const correlationId = sessionStorage.getItem('__mfe_correlation_id');
    if (correlationId) {
      config.headers['X-Trace-ID'] = correlationId;
      config.headers['X-MFE-Source'] = getCurrentMFEName(); // "products", "cart"
    }
    return config;
  });

  return client;
}

// 3. Error Attribution — know which MFE caused which error
// packages/shared-telemetry/src/errorAttribution.ts
export function setupErrorAttribution(mfeName: string) {
  // Tag all errors from this MFE
  Sentry.setTag('mfe.name', mfeName);
  Sentry.setTag('mfe.version', process.env.MFE_VERSION);

  // Global error handler với context
  window.addEventListener('error', (event) => {
    // Identify if error came from this MFE's code
    const isOurCode = event.filename?.includes(`/${mfeName}/`);
    if (isOurCode) {
      Sentry.captureException(event.error, {
        tags: { mfe: mfeName, errorSource: 'global-error' },
        extra: { correlationId: sessionStorage.getItem('__mfe_correlation_id') }
      });
    }
  });
}

// Remote MFE: Call at app initialization
// remote-products/src/bootstrap.tsx
setupErrorAttribution('products');
```

```
DEBUGGING WORKFLOW khi production error:

1. User reports "page crashed"
2. Host Sentry: Find error by User ID
   → Correlation ID: "abc-123-def"
   → Error tag: mfe.name = "products"
   → Stack trace readable (source maps uploaded)

3. Products Sentry: Search by Correlation ID "abc-123-def"
   → Find all errors from same user session
   → See API calls that failed

4. Backend tracing (Datadog/Jaeger): Search X-Trace-ID = "abc-123-def"
   → See full request chain: Frontend → Products API → DB
   → Identify bottleneck/failure point

5. Products team owns fix (tagged Sentry project)
   → No cross-team ambiguity about who fixes it
```

**Key insight**: Observability trong MFE phải được thiết kế upfront, không phải afterthought. Khi production crash xảy ra, bạn cần biết ngay: lỗi từ team nào, request nào triggered nó, user nào bị ảnh hưởng. Correlation ID là "thread" nối toàn bộ distributed system lại.

---

## 12. War Stories: Những bài học đắt giá khi triển khai MFE thực tế

> Phần này viết từ góc nhìn của người đã trực tiếp architect và triển khai MFE cho production system phục vụ hàng triệu users. Mỗi vấn đề đều là bài học xương máu.

### 12.1. "Dependency Hell" — Bài học đầu tiên và đau nhất

**Câu chuyện**: Sprint đầu tiên mọi thứ chạy smooth. Sprint thứ 3, Team Products upgrade `date-fns` từ v2 → v3 (breaking change). Team Cart vẫn dùng v2. Module Federation load cả 2 versions → bundle tăng 200KB. Tệ hơn, khi shared singleton = true, chỉ 1 version được load → Team Cart crash runtime vì API `format()` đổi signature.

**Root cause thực sự**: Không phải lỗi Module Federation. Lỗi là **thiếu governance cho dependency management**. Trong monolith, 1 package.json nên ai upgrade thì tất cả phải upgrade. Trong MFE, mỗi team có package.json riêng → version drift tích lũy dần.

**Cách khắc phục (đã áp dụng)**:

```
DEPENDENCY GOVERNANCE MODEL:

Tier 1: LOCKED SHARED (Phải đồng bộ — zero tolerance)
├── react, react-dom         → Pin exact version, singleton: true
├── react-router-dom         → Pin exact version, singleton: true
├── @shared/design-system    → Singleton, semver major locked
└── @shared/auth, @shared/i18n → Singleton

Tier 2: RECOMMENDED (Khuyến khích đồng bộ — allowed lag 1 minor version)
├── axios/fetch wrappers     → Shared utility
├── date-fns/dayjs           → Shared utility
├── zustand/jotai            → State management
└── zod/yup                  → Validation

Tier 3: TEAM-OWNED (Tự quản — không shared)
├── Team-specific libraries  → Chart libraries, editors
├── Internal utilities       → Team-specific helpers
└── Dev dependencies         → Testing, linting
```

```tsx
// Tooling: Dependency Sync Bot (chạy CI hàng ngày)
// check-dependency-sync.ts
const LOCKED_DEPS = {
  react: "18.3.1",
  "react-dom": "18.3.1",
  "react-router-dom": "6.23.0",
};

function checkSync(mfePkgJson: PackageJson) {
  const violations = [];
  for (const [dep, version] of Object.entries(LOCKED_DEPS)) {
    if (mfePkgJson.dependencies?.[dep] !== version) {
      violations.push({ dep, expected: version, actual: mfePkgJson.dependencies?.[dep] });
    }
  }
  return violations;
  // → PR comment: "⚠️ Products MFE: react is 18.2.0, expected 18.3.1"
}
```

**Insight cá nhân**: Nhiều người nghĩ MFE cho phép mỗi team dùng bất kỳ version. Trên thực tế, **shared dependencies phải strict hơn monolith**, vì runtime conflicts khó debug hơn build-time conflicts rất nhiều.

---

### 12.2. "The Silent CSS War" — UI vỡ mà không ai biết tại sao

**Câu chuyện**: Thứ 2 release, mọi thứ ok. Thứ 4, QA report: "Button trong Products MFE bị font-size sai, padding lệch". Investigate 2 ngày mới phát hiện: Team Header deploy CSS mới có global rule `.container *` thay đổi font-size. CSS cascade từ Header MFE leak sang Products MFE.

**Root cause**: CSS global scope. Trong monolith, ta quen với global CSS vì chỉ có 1 team quản lý. Trong MFE, 8 teams viết CSS vào cùng 1 DOM → cascade conflicts.

**Tại sao khó debug**:
```
1. Lỗi CSS không throw error → không có error log
2. Chỉ xảy ra khi HOST render HEADER + PRODUCTS cùng lúc
   (standalone test từng MFE → không thấy lỗi)
3. Timing-dependent: CSS load order phụ thuộc network speed
4. Khó tìm nguyên nhân: "CSS nào override CSS nào?"
```

**Cách khắc phục triệt để**:

```
DEFENSE IN DEPTH cho CSS:

Layer 1: CSS Modules (bắt buộc cho tất cả MFEs)
  .button → .Products_button_3x7kA (scoped by hash)
  → Loại bỏ 90% conflicts

Layer 2: BEM Namespace Prefix
  Tất cả MFE CSS class phải prefix:
  .mfe-products__button { }
  .mfe-cart__header { }
  → Backup nếu CSS Modules bị bypass

Layer 3: Shadow DOM cho critical MFEs (optional)
  Web Component wrapper cho MFEs cần complete isolation
  → Dùng cho 3rd-party integrations hoặc embedded widgets

Layer 4: CSS Lint Rules (CI enforcement)
  ❌ Ban: * selectors, tag selectors (div, span, p)
  ❌ Ban: !important (trừ design system)
  ❌ Ban: Global selectors without MFE prefix
  ✅ Allow: CSS Modules, design system classes

Layer 5: Visual Regression Tests
  Chromatic/Percy chạy trên HOST + ALL remotes loaded
  → Catch visual regressions trước khi merge
```

```js
// .stylelintrc — enforce CSS isolation
module.exports = {
  rules: {
    "selector-max-universal": 0,              // Ban: *
    "selector-max-type": 0,                    // Ban: div, p, span
    "declaration-no-important": true,           // Ban: !important
    "selector-class-pattern": "^mfe-[a-z]+-",  // Enforce: prefix
  },
};
```

**Insight**: CSS conflicts trong MFE nguy hiểm hơn JS errors vì chúng **silent** — không crash, không log, chỉ "trông hơi lạ". Users có thể dùng UI bị vỡ hàng tuần trước khi ai đó notice.

---

### 12.3. "Shared State Race Condition" — Bug chỉ xảy ra ở production

**Câu chuyện**: User login → Header MFE hiện "Xin chào, Trường". Navigate sang Products → Products MFE hiện "Please login". Refresh → OK. Lỗi chỉ xảy ra ~5% requests, intermittent.

**Root cause**: Race condition giữa auth state propagation:

```
Timeline (simplified):
T=0ms:   User login → Auth MFE cập nhật token
T=5ms:   Header MFE nhận CustomEvent "user:logged-in" → hiện tên user
T=10ms:  User clicks "Products" → Host lazy-load Products MFE
T=15ms:  Products MFE initialize → check auth state
T=12ms:  ← Auth CustomEvent đã fire ở T=5ms, TRƯỚC khi Products mount!
         Products MFE missed event → nghĩ user chưa login

Vấn đề: CustomEvent là FIRE-AND-FORGET
  → Nếu listener chưa mount khi event fire → event mất
  → Không có "replay" mechanism
```

**Cách khắc phục**:

```tsx
// ❌ Sai: Chỉ dùng CustomEvent (fire-and-forget)
window.addEventListener("user:logged-in", handler);

// ✅ Đúng: Event + Persistent State Store
// Pattern: "Event Notification + State Store"

// 1. Shared auth store (singleton via Module Federation)
const authStore = {
  _state: { user: null, token: null },
  _listeners: new Set<Function>(),

  getState() { return this._state; },

  setState(newState: Partial<AuthState>) {
    this._state = { ...this._state, ...newState };
    // Notify tất cả current listeners
    this._listeners.forEach(fn => fn(this._state));
    // + Fire event cho future listeners
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: this._state }));
  },

  subscribe(listener: Function) {
    this._listeners.add(listener);
    // ✅ KEY: Immediately call with CURRENT state
    // → Listener vừa mount → nhận state ngay, không cần đợi event
    listener(this._state);
    return () => this._listeners.delete(listener);
  },
};

// 2. Hook cho MFEs consume
function useAuth() {
  const [auth, setAuth] = useState(authStore.getState()); // ← Lấy current state NGAY
  useEffect(() => authStore.subscribe(setAuth), []);       // ← Subscribe for updates
  return auth;
}

// → Products MFE mount → useAuth() → lấy CURRENT state → LUÔN đúng
// → Không phụ thuộc vào timing of events
```

**Insight**: Đây là bài học **quan trọng nhất**: Custom Events chỉ phù hợp cho "notifications" (something happened). Cho "state synchronization" (what is the current state?), cần **persistent store + subscribe pattern**. Đây là sự khác biệt giữa **event-driven** và **state-driven** communication.

---

### 12.4. "The Monday Morning Incident" — Triển khai Remote Entry Caching

**Câu chuyện**: Thứ 6 chiều Team Products deploy v2.3.0. Thứ 2 sáng, 30% users vẫn thấy v2.2.0. 70% thấy v2.3.0. Inconsistent experience trong hàng giờ.

**Root cause**: `remoteEntry.js` bị browser cache + CDN cache.

```
Vấn đề caching chain:
CDN Edge → cache remoteEntry.js (max-age: 3600)
Browser → cache remoteEntry.js (disk cache)

Deploy v2.3.0:
  CDN origin → file mới
  CDN Edge (Singapore) → purge xong → serve file mới
  CDN Edge (Vietnam) → CHƯA purge → serve file cũ ← 30% users
  Browser → disk cache chưa hết hạn → dùng file cũ

Kết quả: Một số users load Products v2.2.0, một số v2.3.0
  → Nếu API contract thay đổi → Runtime error cho users đang dùng v2.2.0
```

**Cách khắc phục (battle-tested)**:

```
CACHING STRATEGY cho remoteEntry.js:

1. NEVER cache remoteEntry.js ở browser
   Cache-Control: no-cache, no-store, must-revalidate
   
   WHY: remoteEntry.js rất nhỏ (5-15KB gzip)
   → Cost of re-downloading: negligible (~10ms)
   → Cost of stale entry: CATASTROPHIC (load wrong version)

2. CDN caching: VERY SHORT TTL (30-60 seconds)
   Purge on deploy + short TTL as safety net

3. CONTENT-HASH chunk files (long cache)
   Products component: chunk-a7b3c.js → cache 1 year
   → URL thay đổi mỗi deploy → auto cache bust
   → remoteEntry.js chỉ là manifest pointing to new chunks

4. Deployment order:
   Step 1: Upload new chunks (chunk-x9y2z.js) → CDN
   Step 2: Wait 30s (ensure CDN propagation)
   Step 3: Update remoteEntry.js → point to new chunks
   Step 4: Purge CDN cache for remoteEntry.js
   
   → Atomic: không bao giờ có remoteEntry pointing to non-existent chunks
```

```nginx
# nginx config cho remote assets
location /mfe/products/remoteEntry.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

location /mfe/products/chunks/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    # Chunks có content-hash → immutable caching OK
}
```

**Insight**: Caching là bài toán **quan trọng nhất và dễ sai nhất** trong MFE. Trong monolith, browser cache bust đơn giản (content-hash trong filename). Trong MFE, `remoteEntry.js` là "manifest" phải luôn fresh, nhưng chunks phải cached lâu. Sai caching strategy = inconsistent UI trên production.

---

### 12.5. "Memory Leak Marathon" — Performance degradation không ai để ý

**Câu chuyện**: Production monitoring alert: "Average page session memory tăng 40% so với tháng trước". Investigate: mỗi lần user navigate giữa các MFEs, memory tăng ~5MB và KHÔNG giảm. Sau 20 navigations → 100MB → browser chậm, crash trên mobile.

**Root cause**: MFE mount → tạo event listeners, intervals, subscriptions. MFE unmount → listeners KHÔNG được cleanup.

```
Navigation lifecycle trong MFE:
1. User ở /products → Products MFE mount
   - 5 CustomEvent listeners
   - 2 setInterval (price updates, carousel)
   - 1 WebSocket connection
   - 1 IntersectionObserver

2. User navigate to /cart → Products MFE UNMOUNT
   ← Nhưng: listeners, intervals, websocket VẪN CÒN!
   → Cart MFE mount → thêm listeners mới

3. User navigate back to /products → Products MFE RE-MOUNT
   → THÊM 5 listeners mới (cũ vẫn còn!)
   → Bây giờ có 10 listeners cho cùng 1 event
   → Events fire 2 lần → duplicate API calls
   → Memory: 10MB thay vì 5MB
```

**Tại sao monolith không gặp vấn đề này**: Trong SPA monolith, `useEffect` cleanup chạy khi component unmount. Nhưng trong MFE, khi Host unmount remote component, remote module's lifecycle KHÔNG guaranteed chạy đúng, đặc biệt khi:
- Remote component mount vào DOM trực tiếp (imperative rendering)
- Error boundary catch error → component tree destroyed without cleanup
- Hot Module Replacement trong development

**Cách khắc phục**:

```tsx
// 1. MFE Lifecycle Wrapper (bắt buộc mỗi remote)
class MFELifecycle {
  private cleanupFns: (() => void)[] = [];

  // Thay vì window.addEventListener trực tiếp
  addEventListener(event: string, handler: Function) {
    window.addEventListener(event, handler as EventListener);
    this.cleanupFns.push(() => window.removeEventListener(event, handler as EventListener));
  }

  // Thay vì setInterval trực tiếp
  setInterval(fn: Function, ms: number) {
    const id = window.setInterval(fn, ms);
    this.cleanupFns.push(() => clearInterval(id));
    return id;
  }

  // GỌI KHI MFE UNMOUNT
  destroy() {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
    console.log(`[MFE] Cleaned up ${this.cleanupFns.length} resources`);
  }
}

// 2. Host enforce cleanup
function loadRemote(name: string, container: HTMLElement) {
  const lifecycle = new MFELifecycle();
  const unmount = remoteModule.mount(container, { lifecycle });

  return {
    unmount: () => {
      unmount();
      lifecycle.destroy(); // ← Force cleanup
      container.innerHTML = ""; // ← Clear DOM
    },
  };
}

// 3. Memory monitoring (production)
setInterval(() => {
  if (performance.memory) {
    const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
    if (usedMB > 200) {
      analytics.track("memory_warning", { usedMB, page: location.pathname });
    }
  }
}, 30000);
```

**Insight**: Memory leaks trong MFE **tích lũy theo thời gian và theo navigation**. Monolith full page reload tự cleanup (browser reset DOM). MFE với client-side routing KHÔNG có full page reload → leaks tích lũy vô hạn. Cần explicit lifecycle management cho MỌI resource.

---

### 12.6. "TypeScript Lies" — Types nói một đằng, runtime nói một nẻo

**Câu chuyện**: Host import `ProductList` từ remote với TypeScript declaration:
```ts
declare module "remoteProducts/ProductList" {
  interface Props { category?: string; maxItems?: number; }
}
```

Team Products deploy v3.0: đổi prop `maxItems` → `limit`, thêm required prop `currency`. Host build pass (vì dùng `.d.ts` cũ). Production → runtime crash: `TypeError: currency is not defined`.

**Root cause**: TypeScript declarations cho remote modules là **manual, static files**. Chúng KHÔNG tự động sync khi remote thay đổi API.

```
The Gap:
  Host's .d.ts: ProductList({ category?, maxItems? })     ← STALE
  Remote's actual: ProductList({ category?, limit?, currency! }) ← CURRENT
  
  TypeScript: ✅ "No errors!" (based on stale .d.ts)
  Runtime: 💥 CRASH (based on actual remote code)
```

**Cách khắc phục**:

```
APPROACH 1: Auto-generated Type Contracts (Recommended)

Remote CI pipeline:
  1. Build remote
  2. Extract types from exposed modules → publish to npm registry
     @mfe-types/products@3.0.0 → ProductListProps, ProductCardProps
  3. Host CI: check if @mfe-types/* are up to date

// remote-products/scripts/extract-types.ts
import { generateDts } from "@mfe-tools/type-extractor";
generateDts({
  exposes: {
    "./ProductList": "./src/ProductList.tsx",
    "./ProductCard": "./src/ProductCard.tsx",
  },
  output: "./dist/types/",
});

// Publish:
npm publish --scope=@mfe-types/products
```

```
APPROACH 2: Runtime Contract Validation (Defense in depth)

// Tại boundary Host ↔ Remote, validate props at runtime
import { z } from "zod";

const ProductListPropsSchema = z.object({
  category: z.string().optional(),
  limit: z.number().optional(),
  currency: z.string(), // required!
});

function SafeProductList(props: unknown) {
  const result = ProductListPropsSchema.safeParse(props);
  if (!result.success) {
    console.error("[MFE Contract Violation]", result.error);
    analytics.track("mfe_contract_violation", {
      remote: "products",
      component: "ProductList",
      errors: result.error.issues,
    });
    return <FallbackUI />;
  }
  return <RemoteProductList {...result.data} />;
}
```

```
APPROACH 3: Contract Tests (Prevention)

// Chạy ở BOTH Host AND Remote repos:
describe("ProductList Contract v3", () => {
  it("renders without currency → shows default VND", () => {
    const { container } = render(<ProductList />);
    expect(container.textContent).toContain("₫");
  });

  it("requires currency for non-VN locales", () => {
    const { container } = render(<ProductList currency="USD" />);
    expect(container.textContent).toContain("$");
  });
});

// CI: Remote's contract tests RUN on Host repo
// Host's contract tests RUN on Remote repo
// → Breaking change detected BEFORE deploy
```

**Insight**: Trong MFE, **TypeScript chỉ là documentation, không phải safety net**. Runtime là nguồn sự thật duy nhất. Luôn cần runtime validation ở boundary giữa Host và Remote. Đây là điểm mà nhiều team bỏ qua cho đến khi gặp production incident.

---

### 12.7. "The 3-Second Flash" — FOUC và Loading State Hell

**Câu chuyện**: User mở app → thấy Header + Footer ngay → giữa trống 3 giây (loading remote) → flash content xuất hiện. Nhìn unprofessional, user nghĩ app bị lỗi.

**Root cause**: Remote MFE loading waterfall:

```
Waterfall problem:
T=0ms:    Host HTML loads
T=100ms:  Host JS executes → "I need ProductList from remote"
T=150ms:  Download remoteEntry.js (5KB, 50ms)
T=200ms:  Parse remoteEntry.js → "ProductList is in chunk-abc.js"
T=250ms:  Download chunk-abc.js (80KB, 300ms)
T=550ms:  Parse + execute chunk
T=600ms:  React render ProductList
T=800ms:  Products MFE fetch data (API call)
T=1300ms: Data arrives → final render

Total: User sees content after 1300ms
       But sees empty space / skeleton for first 1300ms
       → FOUC (Flash of Unstyled/Unloaded Content)
```

**Cách khắc phục**:

```html
<!-- 1. PRELOAD remote entries (quan trọng nhất!) -->
<!-- Đưa vào Host's <head> — browser download SONG SONG với main bundle -->
<link rel="preload" href="http://localhost:3001/remoteEntry.js" as="script" crossorigin />
<link rel="preload" href="http://localhost:3002/remoteEntry.js" as="script" crossorigin />

<!-- 2. DNS Prefetch cho remote origins -->
<link rel="dns-prefetch" href="//products-mfe.example.com" />
<link rel="dns-prefetch" href="//cart-mfe.example.com" />
```

```tsx
// 3. Intelligent preloading — preload remotes for LIKELY next navigation
function usePreloadRemote() {
  useEffect(() => {
    // User đang ở trang Home → likely visit Products next
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = "http://products.example.com/remoteEntry.js";
    document.head.appendChild(link);
  }, []);
}

// 4. Skeleton that matches ACTUAL content layout
// ❌ Generic spinner
<div className="loading-spinner" />

// ✅ Content-aware skeleton (giống layout thật)
<div className="product-grid-skeleton">
  {[1,2,3,4,5,6].map(i => (
    <div key={i} className="product-card-skeleton">
      <div className="skeleton-image" />   {/* Same height as real image */}
      <div className="skeleton-title" />   {/* Same width as real title */}
      <div className="skeleton-price" />   {/* Same position as real price */}
    </div>
  ))}
</div>

// 5. Progressive loading: show PARTIAL content while rest loads
// Thay vì: đợi TẤT CẢ data → render
// Dùng: render layout ngay → stream data vào từng phần
```

```tsx
// 6. Service Worker pre-cache remote entries
// sw.js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("mfe-remotes-v1").then((cache) =>
      cache.addAll([
        "http://products.example.com/remoteEntry.js",
        "http://cart.example.com/remoteEntry.js",
      ])
    )
  );
});

// Subsequent visits: remoteEntry.js từ cache → INSTANT
```

**Insight**: Loading performance trong MFE có **thêm 1 round-trip** so với monolith (download remoteEntry.js). Nhưng round-trip này CÓ THỂ hidden bằng preloading. Trick: `<link rel="preload">` trong HTML `<head>` chạy SONG SONG với main JS bundle download → zero added latency.

---

### 12.8. "The Authentication Nightmare" — Token Propagation

**Câu chuyện**: User login ở Host → token lưu trong memory (not localStorage for security). Navigate sang Products MFE → Products MFE không có token → API calls fail 401.

**Deeper problem**: Token refresh flow. Access token hết hạn → Products MFE gọi refresh → Host MFE cũng gọi refresh → 2 concurrent refresh requests → token rotation fail → user bị logout.

```
Double Refresh Problem:
T=0:   Access token expired
T=1:   Products MFE: fetch("/api/products") → 401
T=2:   Products MFE: POST /auth/refresh (refresh_token_A)
T=3:   Host MFE: fetch("/api/user") → 401
T=4:   Host MFE: POST /auth/refresh (refresh_token_A)
T=5:   Server: refresh_token_A → new access + refresh_token_B (rotate)
T=6:   Server: refresh_token_A AGAIN → INVALID (already rotated!)
       → User forced logout
```

**Cách khắc phục**:

```tsx
// AUTH SINGLETON — Chỉ Host MFE quản lý auth, tất cả MFE dùng chung

// shared/auth-client.ts (singleton via Module Federation)
class AuthClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  getToken(): string | null {
    return this.accessToken;
  }

  // ✅ CRITICAL: Deduplicate refresh calls
  async refreshToken(): Promise<string> {
    // Nếu đang refresh → trả về CÙNG promise (không gọi API lần 2)
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._doRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null; // Reset sau khi xong
    }
  }

  private async _doRefresh(): Promise<string> {
    const res = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include", // HttpOnly cookie
    });
    const { accessToken } = await res.json();
    this.accessToken = accessToken;
    // Broadcast to all MFEs
    window.dispatchEvent(new CustomEvent("auth:token-refreshed"));
    return accessToken;
  }
}

// Singleton instance — shared across ALL MFEs
export const authClient = new AuthClient();

// Axios interceptor dùng chung
export function createAuthenticatedFetch() {
  return async (url: string, options: RequestInit = {}) => {
    let token = authClient.getToken();

    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      // Token expired → refresh (deduplicated)
      token = await authClient.refreshToken();
      // Retry with new token
      return fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      });
    }

    return res;
  };
}
```

**Insight**: Authentication trong MFE PHẢI centralized ở Host hoặc shared singleton. Nếu mỗi MFE tự quản lý auth → race conditions, duplicate refresh, inconsistent state. Đây là 1 trong những "simple things that become hard" khi chuyển từ monolith sang MFE.

---

### 12.9. "The Monitoring Black Hole" — Lỗi xảy ra nhưng không biết ở MFE nào

**Câu chuyện**: Sentry alert: "TypeError: Cannot read property 'map' of undefined" — 500 occurrences/hour. Stack trace chỉ hiện minified code từ chunk-a7b3c.js. MFE nào? Component nào? Không biết.

**Root cause**: Source maps và error tracking không được setup cho multi-app architecture.

**Cách khắc phục toàn diện**:

```tsx
// 1. TAG errors by MFE origin
// Error Boundary trong Host — tag remote name vào error context

class MFEErrorBoundary extends React.Component<{
  remoteName: string;
  teamOwner: string;
  children: React.ReactNode;
}> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ✅ Tag error với MFE metadata
    Sentry.withScope((scope) => {
      scope.setTag("mfe.name", this.props.remoteName);
      scope.setTag("mfe.team", this.props.teamOwner);
      scope.setTag("mfe.version", window.__MFE_VERSIONS__?.[this.props.remoteName]);
      scope.setContext("component_stack", {
        stack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  }
}

// Usage:
<MFEErrorBoundary remoteName="products" teamOwner="squad-alpha">
  <Suspense fallback={<Skeleton />}>
    <RemoteProductList />
  </Suspense>
</MFEErrorBoundary>
```

```tsx
// 2. MFE Version Registry — biết chính xác version nào đang chạy
// Mỗi remote expose version info:
// remote-products/src/version.ts
export const MFE_VERSION = {
  name: "products",
  version: "2.3.1",
  commit: "a7b3c4d",
  buildTime: "2024-01-15T10:30:00Z",
};

// Host collect versions từ tất cả remotes:
window.__MFE_VERSIONS__ = {};
Promise.all([
  import("remoteProducts/version").then(m => window.__MFE_VERSIONS__.products = m.MFE_VERSION),
  import("remoteCart/version").then(m => window.__MFE_VERSIONS__.cart = m.MFE_VERSION),
]);

// → Sentry/DataDog biết: "Error xảy ra với products@2.3.1, cart@1.8.0"
```

```tsx
// 3. Per-MFE Performance Monitoring
function measureRemoteLoad(remoteName: string) {
  const mark = `mfe-load-${remoteName}`;
  performance.mark(`${mark}-start`);

  return {
    done: () => {
      performance.mark(`${mark}-end`);
      performance.measure(mark, `${mark}-start`, `${mark}-end`);
      const entry = performance.getEntriesByName(mark)[0];

      analytics.track("mfe_load_time", {
        remote: remoteName,
        duration: entry.duration,
        // ← Nếu > 3s → alert team owner
      });
    },
    error: (err: Error) => {
      analytics.track("mfe_load_error", {
        remote: remoteName,
        error: err.message,
      });
    },
  };
}
```

**Insight**: Monitoring trong MFE cần **3 dimensions**: (1) WHICH remote, (2) WHICH version, (3) WHO owns it. Thiếu bất kỳ dimension nào → debug incident trở thành "needle in haystack". Setup monitoring TRƯỚC khi go production, không phải sau.

---

### 12.10. "The Local Dev Nightmare" — Developer Experience degradation

**Câu chuyện**: Developer mới join team: "Để chạy app locally, tôi phải start 8 dev servers, mỗi cái ăn 300MB RAM. MacBook 16GB RAM → không đủ. Hot reload chậm 15 giây vì 8 webpack instances."

**Giải pháp đã triển khai**:

```
3-TIER LOCAL DEV STRATEGY:

Tier 1: STANDALONE MODE (ngày thường)
  Developer chỉ chạy 1 MFE standalone
  Mock dependencies bằng stubs
  Fast: 1 dev server, hot reload < 1s
  
  npm run dev:standalone
  → Renders MFE in isolation với mock data
  → Không cần Host, không cần other remotes

Tier 2: HYBRID MODE (integration testing)
  Developer chạy Host + MFE đang develop locally
  Other remotes point to STAGING environment
  
  npm run dev:hybrid
  → Host localhost:3000
  → Products localhost:3001 (local)
  → Cart → staging.example.com (staging) ← Auto-configured

Tier 3: FULL MODE (rare, pre-release validation)
  Tất cả MFEs local
  Dùng Docker Compose hoặc Turborepo
  
  docker-compose up
  → 8 containers, each 200MB
  → Chỉ dùng khi testing cross-MFE features
```

```tsx
// webpack.config.js — Environment-aware remote URLs
const REMOTE_URLS = {
  development: {
    products: "products@http://localhost:3001/remoteEntry.js",
    cart: "cart@http://localhost:3002/remoteEntry.js",
  },
  hybrid: {
    // Đang develop products locally, cart from staging
    products: "products@http://localhost:3001/remoteEntry.js",
    cart: "cart@https://staging.example.com/cart/remoteEntry.js",
  },
  staging: {
    products: "products@https://staging.example.com/products/remoteEntry.js",
    cart: "cart@https://staging.example.com/cart/remoteEntry.js",
  },
};

const env = process.env.MFE_ENV || "development";

new ModuleFederationPlugin({
  name: "host",
  remotes: REMOTE_URLS[env],
  ...
});
```

**Insight**: DX (Developer Experience) là make-or-break cho MFE adoption. Nếu developers mất 20 phút setup local env mỗi sáng → họ sẽ ghét MFE → productivity giảm → management sẽ blame architecture. **Standalone mode là non-negotiable** — mỗi MFE phải chạy được độc lập với 1 command.

---

### 12.11. Tổng hợp: Checklist trước khi Go Production

```
PRE-PRODUCTION CHECKLIST:

□ Dependency governance model defined (Tier 1/2/3)
□ CSS isolation enforced (CSS Modules + lint rules)
□ Shared state uses store + subscribe pattern (not just events)
□ remoteEntry.js: Cache-Control: no-store
□ Chunk files: Content-hash + immutable cache
□ Memory leak prevention: MFE Lifecycle wrapper
□ Auth: Centralized singleton + deduplicated refresh
□ Type contracts: Auto-generated + runtime validation
□ Error monitoring: Tagged by MFE name + version
□ Performance monitoring: Per-MFE load time tracking
□ Graceful degradation: Error boundaries per remote
□ Local dev: Standalone + Hybrid modes
□ CI/CD: Independent pipelines per MFE
□ Visual regression tests: Host + all remotes loaded
□ Rollback plan: CDN URL switch < 30 seconds
□ On-call runbook: "Which team owns which MFE?"
```

---

## 13. Event Bus: Cross-MFE Communication Pattern

### Concept: Event Bus là gì?

Event Bus = **trạm trung chuyển tin nhắn** giữa các MFEs. Thay vì MFE A gọi trực tiếp MFE B (tight coupling), cả hai đều giao tiếp qua một "bưu điện trung tâm".

```
TRƯỚC (Tight Coupling):
  Products MFE ──────→ Cart MFE
  (import trực tiếp = dependency cycle)

SAU (Event Bus):
  Products MFE ──emit──→ 📮 EVENT BUS ──deliver──→ Cart MFE
                                        ──deliver──→ Host
                                        ──deliver──→ Analytics MFE
```

### Mental Model: "Bưu điện trung tâm"

```
┌─────────────────────────────────────────────────────────────┐
│                    📮 EVENT BUS (Singleton)                  │
│                                                             │
│  ┌─────────────┐    Typed Events     ┌──────────────┐      │
│  │ Products MFE│ ──emit──────────→   │  Handler #1  │      │
│  │ (Sender)    │  "cart:item-added"   │  (Cart MFE)  │      │
│  └─────────────┘         │           └──────────────┘      │
│                          │           ┌──────────────┐      │
│                          └────────→  │  Handler #2  │      │
│                          │           │  (Host toast)│      │
│                          │           └──────────────┘      │
│                          │           ┌──────────────┐      │
│                          └────────→  │  Handler #3  │      │
│                                      │  (Analytics) │      │
│  ┌────────────────────────────────────────────────┐        │
│  │ EVENT BUFFER: [event1, event2, ... eventN]      │        │
│  │ → Late subscribers can replay missed events     │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### So sánh 3 cách giao tiếp giữa MFEs

| Tiêu chí | CustomEvent (browser) | Event Bus | Shared Store |
|---|---|---|---|
| **Câu hỏi trả lời** | "Vừa xảy ra gì?" | "Vừa xảy ra gì?" (typed) | "Hiện tại state là gì?" |
| **Type Safety** | ❌ Untyped strings | ✅ Typed EventMap | ✅ Typed store |
| **Late Subscriber** | ❌ Miss hết events | ⚡ Replay từ buffer | ✅ Nhận state ngay |
| **Error Isolation** | ❌ 1 handler crash = crash all | ✅ try/catch per handler | N/A |
| **Middleware** | ❌ Không có | ✅ Pipeline (log, filter, throttle) | N/A |
| **Circular detection** | ❌ Infinite loop | ✅ emitDepth guard | N/A |
| **Memory leak guard** | ❌ Manual cleanup | ⚠️ maxListeners warning | ⚠️ Manual unsubscribe |
| **Debug** | 🔍 DevTools Events tab | 🔍 Wildcard listener + _debug() | 🔍 console.log(store) |
| **Use case** | Simple, 1-1 communication | Cross-cutting concerns | State synchronization |

### Implementation: Typed Event Bus

```typescript
// ---- BƯỚC 1: Typed Event Registry ----
// TypeScript catch typos tại compile time
interface MFEEventMap {
  "products:loaded": { count: number };
  "products:viewed": { productId: string; name: string };
  "cart:item-added": { id: string; name: string; price: number };
  "cart:cleared": {};
  "auth:login": { userId: string; name: string };
  "auth:logout": {};
  "ui:notification": { message: string; type: "info" | "success" | "error" };
  "mfe:loaded": { name: string; version: string; loadTime: number };
  "mfe:error": { name: string; error: string };
}

// ---- BƯỚC 2: Event Bus Core ----
function createEventBus(options?: {
  bufferSize?: number;   // Bao nhiêu events giữ lại cho replay
  debug?: boolean;       // Console log mọi event
  maxListeners?: number; // Warning threshold
}) {
  const handlers = new Map<string, Set<Handler>>();
  const buffer: EventEntry[] = [];
  let emitDepth = 0;

  return {
    // Type-safe emit
    emit<K extends keyof MFEEventMap>(
      event: K,
      data: MFEEventMap[K],
      source: string
    ) { ... },

    // Type-safe subscribe
    on<K extends keyof MFEEventMap>(
      event: K,
      handler: (data: MFEEventMap[K], meta: { source: string }) => void
    ): () => void { ... },  // Returns unsubscribe

    // Subscribe + replay buffered events
    replay<K extends keyof MFEEventMap>(
      event: K,
      handler: Handler,
      options?: { maxAge?: number }
    ): () => void { ... },

    // Listen to ALL events (for logging/debugging)
    onAll(handler): () => void { ... },

    // Add middleware
    use(middleware): void { ... },
  };
}
```

### React Hooks

```typescript
// ---- Hook cơ bản: Listen to event ----
function useEventBus<K extends MFEEventName>(
  event: K,
  handler: (data: MFEEventMap[K], meta: Meta) => void
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, handler);
    return unsubscribe; // ✅ Auto-cleanup on unmount
  }, [event]);
}

// ---- Hook với replay: Không miss events ----
function useEventBusWithReplay<K extends MFEEventName>(
  event: K,
  handler: Handler,
  options?: { maxAge?: number }
) {
  useEffect(() => {
    const unsubscribe = eventBus.replay(event, handler, options);
    return unsubscribe;
  }, [event]);
}

// ---- Hook collect events into state ----
function useEventLog<K extends MFEEventName>(event: K) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const unsub = eventBus.on(event, (data, meta) => {
      setEvents(prev => [{ data, ...meta }, ...prev]);
    });
    return unsub;
  }, [event]);
  return events;
}
```

### 5 Issues thực tế khi áp dụng Event Bus

#### Issue 1: Memory Leak — Listener tích lũy 🔴

**Câu chuyện:** MFE Products component mount/unmount mỗi khi user navigate. Mỗi lần mount, `useEffect` thêm 1 listener mới. Sau 30 phút browsing → 50+ listeners cho cùng 1 event. Mỗi "Add to Cart" trigger 50 handlers → performance crash.

```typescript
// ❌ CAUSE: Không cleanup
useEffect(() => {
  eventBus.on("cart:item-added", (data) => {
    showToast(`Added ${data.name}`);
  });
  // Missing cleanup function!
}, []);

// ✅ FIX: Return unsubscribe
useEffect(() => {
  const unsubscribe = eventBus.on("cart:item-added", (data) => {
    showToast(`Added ${data.name}`);
  });
  return unsubscribe; // Cleanup when component unmounts
}, []);
```

> ⚠️ **Gotcha: Chạy "Before" trước rồi chuyển sang "After" vẫn bị 15+ handlers!**
>
> Code ✅ FIX chỉ đảm bảo listener **mới đăng ký** được cleanup đúng cách.
> Nó **không hồi tố** xóa các zombie listeners đã được tích lũy bởi ❌ CAUSE.
> Nếu Before đã mount 15 lần → 15 zombie listeners tồn tại trong EventBus.
> Chuyển sang After → thêm 1 listener nữa → fire event → **16 handlers** kích hoạt.

```typescript
// 💣 Minh họa tại sao "Before → After" vẫn bị N+1 handlers

// Sau khi chạy Before (mount 15 lần không cleanup):
// eventBus.listeners["cart:item-added"] = [h1, h2, ..., h15]  ← 15 zombie

// Chuyển sang After, mount lần đầu tiên:
const unsubscribe = eventBus.on("cart:item-added", handler16);
// eventBus.listeners["cart:item-added"] = [h1, ..., h15, handler16]

// Unmount → unsubscribe() → chỉ xóa handler16:
// eventBus.listeners["cart:item-added"] = [h1, h2, ..., h15]  ← 15 zombie VẪN CÒN

// Mount lại → thêm handler17:
// eventBus.listeners["cart:item-added"] = [h1, ..., h15, handler17]
// Fire event → 16 handlers kích hoạt! Không phải 1.
```

**Fix đúng khi cần dọn sạch zombie listeners đã tích lũy:**

```typescript
// ✅ Option 1: removeAllListeners trước khi đăng ký mới
useEffect(() => {
  // Xóa sạch zombie listeners từ phiên trước
  eventBus.removeAllListeners("cart:item-added");

  // Rồi mới đăng ký listener mới đúng cách
  const unsubscribe = eventBus.on("cart:item-added", (data) => {
    showToast(`Added ${data.name}`);
  });
  return unsubscribe;
}, []);

// ✅ Option 2: Reset toàn bộ EventBus khi module re-init
// (dùng khi hot reload / module unmount hoàn toàn)
eventBus.reset();

// ✅ Option 3: Trong test — luôn reset trước mỗi test case
beforeEach(() => {
  eventBus.reset(); // Tránh cross-test contamination!
});
```

**Bài học thực chiến:**
- ✅ FIX chỉ ngăn **leak mới** — không hồi tố xóa leak cũ đã tích lũy.
- Trong MFE với hot module replacement, zombie listeners từ phiên cũ **vẫn sống** trong browser memory cho đến khi user hard-refresh (F5).
- EventBus nên expose `removeAllListeners(event)` và `reset()` để xử lý các tình huống này.
- **Rule of thumb:** Nếu bạn đang debug và thấy N×expected handlers → dấu hiệu zombie listeners. Gọi `eventBus.reset()` rồi test lại từ đầu.

**Guard trong Event Bus:** `maxListeners` option → console.warn khi vượt threshold.

#### Issue 2: Circular Events — Infinite Loop 🟡

**Câu chuyện:** Team Analytics listen `cart:item-added` → gọi tracking API → khi tracking thành công, emit `analytics:tracked` → Team A listen `analytics:tracked` → emit `cart:item-added` lại (tưởng là cần sync) → Loop vĩnh viễn.

```typescript
// ❌ CAUSE: A → B → A → B → ∞
eventBus.on("cart:item-added", (data) => {
  trackEvent("add-to-cart", data);
  eventBus.emit("analytics:tracked", { original: "cart:item-added" });
});

eventBus.on("analytics:tracked", (data) => {
  if (data.original === "cart:item-added") {
    eventBus.emit("cart:item-added", ...); // ← CIRCULAR!
  }
});
```

**Guard trong Event Bus:** `emitDepth` counter. Mỗi emit tăng depth, return giảm. Nếu depth > MAX_DEPTH (10) → break + console.error.

#### Issue 3: Event Storm — Quá nhiều events 🟣

**Câu chuyện:** Search input emit event mỗi keystroke. 6 MFEs listen → 6 handlers × 60 keystrokes = 360 handler calls cho chữ "wireless earbuds". DevTools Events tab bị flood, real events bị chìm.

```typescript
// ❌ CAUSE: No debounce
searchInput.addEventListener("input", (e) => {
  eventBus.emit("products:search", {
    query: e.target.value,
    results: filteredProducts.length,
  }, "products");
});

// ✅ FIX: Middleware + Debounce
// Option 1: Debounce trước khi emit
const debouncedSearch = debounce((query, results) => {
  eventBus.emit("products:search", { query, results }, "products");
}, 300);

// Option 2: Middleware throttle
eventBus.use((entry, next) => {
  if (entry.event === "products:search") {
    // Throttle: max 1 event per 300ms
    if (Date.now() - lastSearchTime < 300) return;
    lastSearchTime = Date.now();
  }
  next();
});
```

#### Issue 4: Replay Side Effects — Duplicate API Calls 🔵

**Câu chuyện:** Analytics MFE mount chậm (lazy loaded). Dùng `replay()` để nhận events đã miss. Problem: mỗi event replay → gọi tracking API → user đã browsed 5 phút → replay 20 events → 20 duplicate API calls → billing tăng gấp đôi.

```typescript
// ❌ CAUSE: Replay handler có side effect
eventBus.replay("cart:item-added", (data, meta) => {
  // Side effect: API call
  fetch("/api/analytics/track", {
    body: JSON.stringify({ event: "add-to-cart", ...data }),
  });
  // Replay 20 events → 20 API calls!
});

// ✅ FIX: Chỉ replay cho idempotent operations
eventBus.replay("cart:item-added", (data, meta) => {
  // Idempotent: just update UI state
  setRecentItems(prev => [...prev, data]);
}, { maxAge: 10000 }); // Chỉ replay events trong 10s gần nhất

// Cho side effects, dùng .on() (không replay)
eventBus.on("cart:item-added", (data) => {
  fetch("/api/analytics/track", { ... }); // Chỉ cho events mới
});
```

#### Issue 5: Event Ordering — Thứ tự không đảm bảo 🟠

**Câu chuyện:** Handler A cần chạy trước Handler B (validate → process). Nhưng Event Bus không guarantee thứ tự. Monday: A chạy trước B (OK). Tuesday: B chạy trước A (crash vì chưa validate).

```typescript
// ❌ CAUSE: Depend on handler order
eventBus.on("cart:checkout-started", validateCart);
eventBus.on("cart:checkout-started", processPayment); // Needs validated cart!

// ✅ FIX: Dùng events cho workflow steps
// Thay vì 2 handlers cho 1 event, dùng event chain:
eventBus.on("cart:checkout-started", (data) => {
  const validated = validateCart(data);
  eventBus.emit("cart:checkout-validated", validated);
});

eventBus.on("cart:checkout-validated", (data) => {
  processPayment(data); // Guaranteed: always after validation
});
```

### Best Practice: Kết hợp Shared Store + Event Bus

```typescript
// Products MFE — khi user click "Add to Cart"

// 1️⃣ STORE: Cập nhật state → Cart MFE re-render tự động
cartActions.addItem({ id, name, price });

// 2️⃣ BUS: Thông báo event → Host hiện toast, Analytics track
eventBus.emit("cart:item-added", { id, name, price }, "products");

// TẠI SAO CẦN CẢ HAI?
// Store = WHAT (state hiện tại là gì?) — useCart() → { items: [...] }
// Bus   = THAT (chuyện gì vừa xảy ra?) — "cart:item-added" → show toast

// Nếu CHỈ dùng Store:
//   Host muốn hiện toast "Đã thêm Keyboard" → phải diff cart state
//   → Phức tạp, không biết item nào mới

// Nếu CHỈ dùng Bus:
//   Cart MFE mount SAU event → miss, không biết cart hiện tại
//   → Phải replay tất cả events → phức tạp, side effects
```

### Khi nào KHÔNG nên dùng Event Bus

| Tình huống | Dùng gì thay thế | Tại sao |
|---|---|---|
| Sync state giữa MFEs (cart, auth) | **Shared Store** | Store có "current state", Bus thì không |
| Parent-child component communication | **Props / Context** | Trong cùng 1 MFE, không cần Bus |
| API calls / data fetching | **Mỗi MFE tự fetch** | Mỗi MFE có backend riêng |
| UI state (modal open, dropdown) | **Local state** | Chỉ 1 component cần |
| Form validation | **Local state** | Chỉ 1 MFE cần |

---

## 14. Decision Framework

### Architecture Decision Record (ADR)

```
DECISION: Use Micro-Frontend with Module Federation

CONTEXT:
  - 8 feature teams, 50+ frontend engineers
  - Monolith frontend: 200K+ LoC, 25-min build time
  - Weekly release cycle → deployment bottleneck
  - Teams blocked by other teams' bugs
  - React 17→18 migration blocked for 6 months

DECISION:
  - Split monolith into 8 domain-aligned MFEs
  - Use Webpack 5 Module Federation for runtime composition
  - Shared design system via singleton shared dependency
  - Independent CI/CD per MFE
  - Host/Shell owned by Platform team

CONSEQUENCES:
  Positive:
  ├── Deploy frequency: weekly → multiple daily
  ├── Build time: 25min → 3min per MFE
  ├── Team autonomy: full ownership
  └── Incremental migration: React 18 squad by squad
  
  Negative:
  ├── Infrastructure complexity: +1 platform engineer
  ├── Initial setup: 2-3 sprints
  ├── Learning curve: 1-2 sprints per team
  └── Monitoring: need per-MFE observability
  
  Risks:
  ├── Version drift between shared deps
  ├── Runtime failures (remote unavailable)
  └── Performance overhead (~100KB + 1 RTT)
```


---

## 15. Các câu hỏi phỏng vấn thực chiến bảo vệ CV (CV Defense Questions)

Khi nhà tuyển dụng nhìn vào dòng chữ trong CV của bạn:
* *"Architected and led development of Micro-Frontend infrastructure using Module Federation, enabling independent team deployments across 8+ autonomous squads..."*
* *"Designed and implemented a production Micro-Frontend architecture... enabling 8 teams to ship independently with zero coordination overhead."*

Họ sẽ lập tức xoáy sâu vào những câu hỏi "xương xẩu" dưới đây để kiểm tra xem bạn thực sự làm (hands-on) hay chỉ sao chép lý thuyết:


#### Q1: "CV ghi: 'enabled independent deployments'. Trong thực tế, khi các remotes deploy độc lập mà không cần Host build lại, làm thế nào bạn kiểm soát được tính tương thích (Contract Compatibility) giữa Host và các Remotes để tránh lỗi runtime crash khi một squad thay đổi API/interface?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là rủi ro lớn nhất khi triển khai Module Federation runtime-loading. Để giải quyết triệt để, tôi đã thiết lập hệ thống phòng thủ 3 lớp:
1. **Tự động hóa Type Sharing (Build-time):** Chúng tôi tích hợp `@module-federation/typescript` (hoặc `@originjs/vite-plugin-federation` tùy project). Khi Remote build, nó sẽ compile và export ra một file định nghĩa kiểu dữ liệu `d.ts`. CI pipeline của Host sẽ tự động pull các file type này về để kiểm tra type-safety trước khi test trên Staging. Nếu có lỗi type-mismatch, build step ở CI sẽ báo đỏ ngay lập tức.
2. **Cơ chế Cô lập lỗi tại Runtime (Fault Tolerance):** Host tuyệt đối không import trực tiếp Remote Component theo cách thông thường. Chúng tôi wrap toàn bộ các dynamic imports bằng một HOC `SafeRemoteLoader` tích hợp sẵn **React Error Boundary** và Component Fallback (Skeleton/Empty State). Nếu một remote bị sập hoàn toàn (404 network) hoặc crash do code lỗi khi render, chỉ duy nhất phần diện tích hiển thị của remote đó bị ảnh hưởng và hiển thị nút 'Thử lại', các phần khác của Host và các remote lân cận vẫn hoạt động bình thường, không gây sập ứng dụng (zero cascading failures).
3. **Consumer-Driven Contract Testing (CI/CD):** Ở tầng kiểm thử tích hợp, chúng tôi dùng **Playwright**. Trước khi Remote được merge vào branch deploy, CI chạy test chạy thử Host với file `remoteEntry.js` mới sinh ra của Remote. Bằng cách đó, chúng tôi phát hiện 100% các lỗi phá vỡ layout hoặc thiếu data props trước khi đẩy traffic lên production."

---



#### Q2: "Làm thế nào bạn giải quyết bài toán Shared State (quản lý trạng thái chung) giữa 8 squads mà không làm mất tính độc lập (autonomy)? Nếu dùng một global Redux Store chung, chả phải ta đã tạo ra một 'Distributed Monolith' (monolith phân tán) đi ngược lại nguyên lý MFE hay sao?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Hoàn toàn chính xác. Chia sẻ một global store khổng lồ là một sai lầm chết người vì nó ép các squad phải hiểu cấu trúc store của nhau và tạo ra phụ thuộc chặt chẽ (tight coupling). Tôi đã phân rã Shared State thành 3 mô hình lỏng:
1. **Event-driven Communication (Ưu tiên hàng đầu):** Chúng tôi thiết lập một Window-level Event Bus sử dụng Custom DOM Events siêu nhẹ. Ví dụ, khi remote `remote-products` muốn thêm sản phẩm vào giỏ, nó chỉ cần phát sự kiện:
   ```javascript
   window.dispatchEvent(new CustomEvent('cart:item-added', { detail: { productId: 123 } }));
   ```
   Remote `remote-cart` lắng nghe sự kiện này và tự cập nhật store nội bộ của nó. Hai remote hoàn toàn không biết gì về code của nhau (loose coupling).
2. **URL-based State (Single Source of Truth):** Đối với bộ lọc, ID trang, từ khóa tìm kiếm... chúng tôi lưu trực tiếp trên URL Query Parameters. Bất cứ remote nào cũng có thể đọc/ghi URL độc lập. Điều này vừa giúp chia sẻ link (bookmarkable) vừa giảm tải chia sẻ state trực tiếp.
3. **Shared Micro-stores (Zustand Singletons):** Chỉ có các context tối thiểu (như Session/Token người dùng, Theme hiện tại) mới cần dùng chung Store. Chúng tôi đóng gói store này vào một package dùng chung (`shared-ui/store`). Trong cấu hình Webpack Module Federation, store này được khai báo ở phần `shared` với cấu hình `{ singleton: true, eager: true }`, đảm bảo chỉ có duy nhất một instance của store được chạy tại runtime ở client."

---



#### Q3: "Với 8 squads cùng làm việc, làm sao bạn xử lý vấn đề Version Drift (lệch phiên bản) của các dependency dùng chung? Ví dụ, Squad A cần lên React 19 để dùng các hooks mới, nhưng các squad khác vẫn kẹt ở React 18, trong khi React bắt buộc phải là singleton để tránh lỗi nhiều instances?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là bài toán quản trị (Platform Governance) rất thực tế. Cách xử lý của chúng tôi chia làm 2 khía cạnh:
1. **Cấu hình Module Federation (Technical Layer):**
   * Đối với các thư viện cốt lõi bắt buộc phải chạy Single Instance như `react`, `react-dom`, chúng tôi cấu hình:
     ```javascript
     shared: {
       react: { singleton: true, strictVersion: true, requiredVersion: "^18.2.0" }
     }
     ```
     Nếu có Remote cố tình deploy phiên bản React lệch Major (ví dụ React 19), Module Federation sẽ lập tức ném ra lỗi hoặc fallback dùng bản React của Host tùy theo cấu hình, tránh việc trình duyệt tải song song hai bản React gây hỏng DOM.
   * Đối với các thư viện utility (như `lodash`, `date-fns`), chúng tôi đặt `singleton: false` nhưng có `requiredVersion`. Nếu các remote dùng phiên bản tương thích (ví dụ `lodash@4.x`), Module Federation sẽ chia sẻ dùng chung 1 bản tải về. Nếu lệch phiên bản lớn, remote đó sẽ tải và chạy phiên bản riêng biệt của nó. Điều này đánh đổi một chút dung lượng bundle để giữ tính độc lập phát triển.
2. **Mô hình quản trị của Platform Team (Governance Layer):**
   Chúng tôi thành lập một **Platform Guild** (mỗi squad cử ra 1 đại diện). Định kỳ (ví dụ mỗi quý), Platform team sẽ nâng cấp phiên bản dependencies dùng chung lên bản Stable mới nhất. Toàn bộ các squad sẽ có 2 tuần để chạy thử nghiệm và sửa lỗi (migration) trên môi trường Staging/Canary trước khi release đồng loạt."

---



#### Q4: "Khi chia nhỏ thành 8 remotes, hiệu năng tải trang sẽ bị ảnh hưởng nghiêm trọng do phải tải nhiều file script `remoteEntry.js` và các chunk JS riêng lẻ. Bạn đã làm thế nào để đạt chỉ số LCP < 1.2s như đã nêu trong CV?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"MFE có một khoản 'thuế hiệu năng' (performance overhead) nếu không tối ưu đúng cách. Chúng tôi đã khắc phục bằng các kỹ thuật sau:
1. **Preload manifest/remoteEntry:** Thay vì đợi React code chạy đến dynamic import mới tải remote entry (gây ra hiện tượng thác nước - waterfall requests), chúng tôi chèn thẻ `<link rel="preload" as="script" href="...">` của các remote chính vào HTML header ở Host.
2. **Edge Caching & Stale-While-Revalidate:** File `remoteEntry.js` (rất nhẹ, chỉ chứa manifest map các file chunk) được cache tại Edge CDN (Cloudflare) với thời hạn ngắn (TTL 1 phút) kèm header `stale-while-revalidate`. Bản thân các file chunk JS thực tế của remote thì được hash tên theo nội dung (`[name].[contenthash].js`) và được cache vĩnh viễn (1 năm) ở CDN.
3. **Server-Side Rendering (SSR) Module Federation:** Chúng tôi tích hợp `@module-federation/nextjs-mf` trên server Next.js. Quá trình ghép nối các remote component được thực hiện ngay ở server-side. Nhờ đó, trình duyệt nhận được HTML hoàn chỉnh có đầy đủ layout của remote ở lần tải đầu tiên, giúp chỉ số LCP đạt mức tối ưu (< 1.2s), sau đó mới thực hiện Hydrate ở Client."

---



#### Q5: "Làm thế nào bạn giải quyết vấn đề rò rỉ CSS (CSS leakage) và xung đột styling giữa các micro-frontends? Nếu Squad A dùng Tailwind và ghi đè một số class global, làm sao để nó không làm vỡ giao diện của Squad B?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Chúng tôi đã áp dụng 3 quy chuẩn nghiêm ngặt cho toàn bộ 8 squads để ngăn chặn xung đột CSS:
1. **CSS Modules làm gốc:** Đối với các UI tự viết, chúng tôi bắt buộc 100% sử dụng CSS Modules. Webpack khi build sẽ tự động hash các class name (ví dụ: `.header` thành `.header__a7b8c_remote`), triệt tiêu hoàn toàn khả năng trùng tên class cục bộ.
2. **Tailwind CSS Prefixing:** Với các squad dùng Tailwind CSS, chúng tôi bắt buộc cấu hình `prefix` trong `tailwind.config.js` của từng remote. Ví dụ, remote Products sẽ dùng prefix `prod-` (ví dụ: `prod-flex`, `prod-bg-blue-500`), remote Cart dùng prefix `cart-`. Nhờ đó, Tailwind engine của remote nào chỉ biên dịch các class riêng của remote đó, không bị ghi đè chéo nhau.
3. **Shared Design System Singleton:** Các component UI cơ bản (Button, Modal, Input) đều được import từ thư viện design system dùng chung (`shared-ui`). Package này được chia sẻ ở dạng singleton, đảm bảo toàn bộ ứng dụng sử dụng cùng một phiên bản CSS/DLS đồng nhất."

---



#### Q6: "Làm thế nào để quản lý Authentication (JWT/Access Token, Refresh Token) và truyền tải phiên đăng nhập mượt mà giữa các Micro-frontends mà không bị rò rỉ bảo mật (security leaks)?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Truyền tải thông tin auth giữa các remotes rất dễ bị hổng bảo mật nếu lưu trữ cẩu thả trên LocalStorage/SessionStorage. Chúng tôi đã thiết kế kiến trúc bảo mật như sau:
1. **HTTP-Only Cookies (Root Domain):** Các thông tin nhạy cảm như Refresh Token và Access Token (nếu có thể) được lưu trong HTTP-Only Cookies ở cấp root domain (ví dụ: `.singtel.com`). Trình duyệt sẽ tự động gửi kèm cookie này trong mọi API request từ bất cứ remote nào gọi về API Gateway mà không cần code JavaScript can thiệp hay đọc token. Điều này giảm thiểu 90% rủi ro tấn công XSS lấy cắp token.
2. **Access Token Memory Sharing (Nếu bắt buộc phải gửi qua Header):** Nếu API Gateway yêu cầu gửi token qua `Authorization: Bearer <token>`, Host App (Shell) sẽ là nơi duy nhất giữ token trong Memory State (không lưu ra disk). Host chia sẻ một callback function `getAccessToken()` cho các remotes thông qua Module Federation Shared Scope (hoặc một Shared Auth Store Singleton).
3. **Axios/Fetch Shared Interceptor:** Chúng tôi viết một base HTTP client package nằm trong `shared-ui`. Tất cả các squads đều bắt buộc dùng base client này để gọi API. HTTP client này tự động triệu gọi `getAccessToken()` và đính kèm vào Authorization header. Nếu token hết hạn, chỉ duy nhất Host thực hiện refresh token bằng Refresh Token trong Cookie và cập nhật lại bộ nhớ, sau đó các remote tự động được hưởng token mới."

---



#### Q7: "DX (Developer Experience) luôn là nỗi ác mộng của Micro-frontend. Khi một developer thuộc squad của bạn cần sửa đổi ở Remote Products, họ có phải chạy cả Host và 7 remotes còn lại ở local không? Bạn đã tối ưu hóa quy trình Local Development như thế nào?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Nếu bắt dev chạy toàn bộ 8 project local, máy tính của họ sẽ bị quá tải RAM (hết 16GB-32GB ngay lập tức) và tốn rất nhiều thời gian cài đặt. Để giải quyết, tôi đã triển khai workflow **'Local Dev with Production/Staging Proxying'**:
1. **Chạy duy nhất Remote đang code ở Local:** Developer thuộc squad Products chỉ cần chạy đúng remote `remote-products` vật lý của mình ở cổng `3001`.
2. **Trỏ Host về môi trường Staging/Dev:** Developer sẽ truy cập trực tiếp Host App đang chạy trên Staging CDN (hoặc một bản Host dev build chạy online).
3. **Chèn đè file entry (Resource Override):** Chúng tôi sử dụng Chrome Extension (hoặc một proxy script cục bộ như Charles/ModHeader) để chuyển hướng request tải file `remote-products/remoteEntry.js` từ domain Staging về `http://localhost:3001/remoteEntry.js` ở máy local của dev.
Như vậy, trình duyệt của dev chạy Host thật từ Staging nhưng kéo đúng phần component Products từ code local của họ. RAM tốn tối thiểu, khởi chạy tức thì chỉ mất 3 giây, và nhà phát triển kiểm thử được ngay trong môi trường thật của Host."

---



#### Q8: "Làm thế nào để theo dõi (Observability & Monitoring) lỗi ở production? Nếu Sentry báo lỗi `Cannot read properties of undefined` trên Host, làm sao bạn biết lỗi đó thực tế thuộc về code của Remote nào để assign đúng squad xử lý?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Nếu không cấu hình cẩn thận, toàn bộ lỗi từ Remote loaded động sẽ bị Sentry nhóm lại và gán cho Host App, gây hỗn loạn. Để định danh lỗi (Error Attribution) chính xác, chúng tôi đã cấu hình hệ thống giám sát như sau:
1. **Dynamic Tagging trong Custom Error Boundaries:** Mọi remote component khi import vào Host đều được bọc trong một `SafeRemoteLoader` chứa Error Boundary. Khi phát hiện lỗi runtime ở remote, Boundary này sẽ chủ động capture lỗi và gắn thêm metadata tag:
   ```javascript
   Sentry.withScope((scope) => {
     scope.setTag("mfe_name", "remote-products");
     scope.setExtra("remote_url", remoteUrl);
     Sentry.captureException(error);
   });
   ```
2. **Webpack Source Maps Uploading:** Trong CI/CD pipeline của từng remote, khi build hoàn tất, source maps sẽ được tự động upload trực tiếp lên dự án Sentry tương ứng của remote đó kèm theo release version cụ thể.
3. **Cơ chế Distributed Tracing:** API Gateway của chúng tôi cấu hình CORS cho phép truyền Header `traceparent` (W3C Trace Context). Khi Host hoặc Remote gọi API, HTTP Client dùng chung sẽ tự động chèn Correlation ID để chúng tôi có thể liên kết một lỗi UI phía client với log request ở backend chéo qua các MFE."

---



#### Q9: "Làm thế nào để đồng bộ trạng thái Routing (lịch sử điều hướng - History API) giữa ứng dụng Host (Shell) và các ứng dụng Remote khi chúng sử dụng các router độc lập hoặc khác công nghệ?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là bài toán kinh điển khi ghép nối MFE. Nếu cả Host và Remote đều cố gắng tự quản lý `window.history` trực tiếp, chúng sẽ ghi đè lịch sử của nhau, làm hỏng chức năng nút Back/Forward của trình duyệt và gây lỗi đồng bộ thanh URL. Chúng tôi giải quyết bằng hai chiến thuật:
1. **Giải pháp tối ưu - Single Router Context:**
   Thay vì mỗi remote có một router riêng, chúng tôi cấu hình `react-router-dom` thành một **singleton shared dependency** trong Module Federation. Host App (Shell) sẽ đóng vai trò khởi tạo `<BrowserRouter>` toàn cục bao quanh ứng dụng. Các Remote component khi được mount chỉ sử dụng các component Router hooks (`useNavigate`, `useLocation`) thừa hưởng trực tiếp từ context của Host. Cách này đồng bộ route tức thì và không phát sinh bất cứ xung đột lịch sử nào.
2. **Giải pháp cách ly - MemoryRouter Sync (khi khác phiên bản/framework):**
   Nếu Remote dùng một phiên bản router khác hoặc framework khác (ví dụ React Router v5 vs v6 hoặc Next.js vs React Router):
   * Remote sẽ sử dụng `<MemoryRouter>` để quản lý router ảo trong bộ nhớ của nó, không đụng chạm đến thanh URL trình duyệt.
   * Chúng tôi viết một wrapper lắng nghe thay đổi route ở Remote và phát sự kiện đồng bộ ra ngoài: khi Remote di chuyển đến `/products/123`, nó sẽ gọi callback của Host hoặc dispatch Custom Event để báo cho Host thực hiện `history.push('/products/123')` cập nhật URL thật.
   * Ngược lại, khi URL trình duyệt thay đổi (Host điều hướng), Host sẽ tìm Remote tương ứng và gọi hàm điều hướng thủ công của Remote MemoryRouter để cập nhật trạng thái trong bộ nhớ."

---



#### Q10: "Lỗi đường dẫn tài nguyên tĩnh (Relative Asset Path / publicPath) trong Module Federation là gì? Khi Host load Remote, làm sao để các hình ảnh, fonts, hay CSS chunks của Remote được load đúng từ CDN của Remote thay vì trỏ về Host domain?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Mặc định, nếu bạn dùng đường dẫn tương đối (như `./assets/logo.png`) trong Remote code, khi Host ở domain `http://singtel.com` load Remote ở domain `http://cdn.singtel.com/products`, trình duyệt sẽ cố gắng giải quyết đường dẫn ảnh là `http://singtel.com/assets/logo.png` (dẫn tới lỗi 404).
Để giải quyết bài toán này triệt để, chúng tôi áp dụng cấu hình Webpack 5:
1. **output.publicPath = 'auto':** Webpack 5 giới thiệu cơ chế tự động phát hiện đường dẫn tải tài nguyên tại runtime. Khi cấu hình `publicPath: 'auto'` trong Webpack config của Remote, Webpack sẽ tự động tính toán base URL của remote entry script (`remoteEntry.js`) đang chạy trong trình duyệt bằng cách đọc thuộc tính `document.currentScript.src` (hoặc qua DOM API). Tất cả các assets, CSS chunks và JS chunks tiếp theo của remote đó sẽ tự động được tải từ base URL CDN thực tế của nó (ví dụ: `http://cdn.singtel.com/products/`).
2. **Dynamic Public Path (`__webpack_public_path__`):** Đối với một số trường hợp đặc biệt không dùng được `publicPath: 'auto'`, chúng tôi khai báo một biến global của Webpack ở dòng đầu tiên của file entry Remote:
   ```javascript
   if (typeof window !== 'undefined' && window.__remote_products_url__) {
     __webpack_public_path__ = window.__remote_products_url__;
   }
   ```
   Biến URL này được Host inject động khi load remote hoặc đọc từ manifest file, đảm bảo tính linh hoạt tuyệt đối khi deploy qua nhiều môi trường Dev/Staging/Production."

---



#### Q11: "Khi 8 teams cùng deploy code lên chạy chung một runtime (trình duyệt của user), làm thế nào để ngăn chặn việc xung đột các biến toàn cục (Global Namespace pollution) trên đối tượng `window` hoặc rò rỉ global event listeners?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là bài toán bảo vệ runtime (Runtime Isolation) khi nhiều squad chạy code chung một tab. Chúng tôi triển khai 3 nguyên tắc:
1. **Quy chuẩn đặt tên Namespace nghiêm ngặt:** Tuyệt đối cấm các squad khai báo biến trực tiếp lên `window` dưới tên chung chung như `window.config` hay `window.user`. Tất cả các biến toàn cục bắt buộc phải bọc dưới namespace của squad (ví dụ: `window.singtel_squad_products.config`). Chúng tôi viết rules ESLint tùy chỉnh để báo lỗi nếu phát hiện dev gán giá trị trực tiếp lên `window` mà không đúng namespace quy chuẩn.
2. **Tự động dọn dẹp Event Listeners (Event Cleanup Gate):** Khi một remote component lắng nghe các sự kiện toàn cục (`window.addEventListener('scroll')` hoặc `window.addEventListener('resize')`), nếu không gỡ bỏ khi unmount, listener đó sẽ tồn tại mãi mãi và tiếp tục chạy ngay cả khi remote đã biến mất khỏi màn hình, gây tốn RAM và CPU. Quy chuẩn của chúng tôi là luôn return hàm cleanup trong React `useEffect`:
   ```javascript
   useEffect(() => {
     const handleResize = () => { /* logic */ };
     window.addEventListener('resize', handleResize);
     return () => {
       window.removeEventListener('resize', handleResize); // Cleanup tuyệt đối!
     };
   }, []);
   ```
3. **Sandboxing qua CSS/JS (Nâng cao):** Đối với các script của bên thứ ba (như cổng thanh toán, chatbot) nhúng bởi các squad khác nhau, chúng tôi cô lập chúng bằng cách chạy trong các sandbox `iframe` hoặc Shadow DOM để tránh việc họ can thiệp, ghi đè CSS hoặc đọc trộm dữ liệu nhạy cảm của nhau trên cùng một trang."

---



#### Q12: "Làm thế nào bạn giải quyết bài toán Server-Side Rendering (SSR) và Hydration Mismatch trong Module Federation? Đặc biệt là khi Host app sử dụng Next.js App Router (React Server Components) nhưng các Remote là Client Components?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Sự kết hợp giữa Next.js SSR (React Server Components - RSC) và Module Federation là một thử thách rất lớn do RSC chạy hoàn toàn ở server-side node.js còn Module Federation truyền thống được thiết kế để kết nối client-side.
Chúng tôi giải quyết bài toán này qua 3 nguyên lý:
1. **Boundary định danh Client Components ("use client"):**
   Toàn bộ các component được exposed từ các Remote và load động từ Host bắt buộc phải được bọc trong các file khai báo `"use client"`. Bản thân Host App khi load remote component cũng phải coi nó là một Client Component để React hiểu rằng hydration sẽ diễn ra ở client.
2. **Sử dụng NextFederationPlugin (Server-side Node Federation):**
   Chúng tôi sử dụng plugin `@module-federation/nextjs-mf` của tác giả Zack Jackson. Plugin này tinh chỉnh Webpack ở cả cấu hình `server` (Node.js) và `client` (Browser) của Next.js.
   * Ở phía server, khi Host render trang, Node.js sẽ thực hiện fetch HTTP tải file `remoteEntry.js` của remote (phiên bản server-side node), chạy nó trong sandbox vm để lấy HTML render tĩnh ban đầu và đẩy xuống client.
   * Ở phía client, quá trình Hydration sẽ đối chiếu HTML này và tải tiếp remote entry phiên bản browser để gắn event listeners.
3. **Ngăn chặn Hydration Mismatch bằng Dynamic Imports (Clipped Hydration):**
   Nếu code Remote bị bất đồng bộ hoặc thay đổi state sau khi load dẫn đến lỗi Hydration Mismatch (HTML server lệch client), chúng tôi áp dụng cơ chế tắt SSR tạm thời cho component đó:
   ```javascript
   import dynamic from 'next/dynamic';
   const RemoteProductList = dynamic(() => import('products/ProductList'), {
     ssr: false, // Chỉ render ở client-side
     loading: () => <ProductListSkeleton />
   });
   ```
    Điều này đảm bảo Host vẫn có FCP (First Contentful Paint) nhanh, còn remote component phức tạp sẽ được tải lười và hydrate an toàn ngay sau khi trang đã hiển thị."

---



#### Q13: Làm thế nào để rollback một ứng dụng Remote bị lỗi trên production chỉ trong vòng vài giây mà không cần build, deploy hay rollback ứng dụng Host (Shell)?

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Nếu mỗi lần rollback remote mà phải build lại Host hoặc chạy lại CI/CD pipeline mất 10-15 phút, chúng tôi đã thất bại trong việc triển khai MFE độc lập. Chúng tôi xây dựng mô hình **'Dynamic Manifest-driven Deployments'** để rollback tức thì trong 5 giây:
1. **Tách biệt Manifest File khỏi Build Artifacts:**
   Thay vì cấu hình cứng URL của remote trong Webpack config của Host (ví dụ: `products@http://cdn/products/remoteEntry.js`), chúng tôi viết cấu hình Host trỏ về một biến môi trường hoặc đọc động từ một file JSON lưu trên CDN:
   ```javascript
   // Webpack config Host: trỏ về một remote entry loader động
   remotes: {
     products: `promise new Promise((resolve) => {
       fetch('https://cdn.singtel.com/manifests/remotes.json')
         .then(res => res.json())
         .then(manifest => {
           const script = document.createElement('script');
           script.src = manifest.products;
           script.onload = () => resolve(window.products);
           document.head.appendChild(script);
         });
     })`
   }
   ```
2. **File manifest tập trung (`remotes.json`):**
   File JSON này lưu trữ ánh xạ URL hiện tại của toàn bộ các remotes:
   ```json
   {
     "products": "https://cdn.singtel.com/products/v1.2.0/remoteEntry.js",
     "cart": "https://cdn.singtel.com/cart/v1.1.5/remoteEntry.js"
   }
   ```
3. **Rollback bằng 1 Click:**
   Khi phát hiện Remote Products v1.2.0 bị lỗi nghiêm trọng, chúng tôi chạy một script CI/CD siêu nhỏ để ghi đè lại file `remotes.json` trên S3/CDN trỏ URL của `"products"` ngược về phiên bản cũ `"https://cdn.singtel.com/products/v1.1.9/remoteEntry.js"`, đồng thời thực hiện Cloudflare cache purge cho file JSON này.
   * Toàn bộ quá trình chỉ mất đúng **5 giây**.
   * Không có bất cứ dòng code nào của Host hay Remote bị re-deploy. Người dùng tiếp theo tải trang sẽ kéo bản v1.1.9 ổn định ngay lập tức."

---



#### Q14: Nếu một squad trong số 8 squads quyết định chọn Angular hoặc Vue thay vì React để phát triển remote của họ, kiến trúc Module Federation của bạn có hỗ trợ không? Làm sao Host React load và render một component Vue/Angular mà không bị crash?

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Về mặt kỹ thuật, Module Federation hoàn toàn độc lập với UI framework (nó chỉ quản lý việc chunk-splitting và runtime JS loading). Tuy nhiên, để render một component khác framework mà không bị crash, chúng tôi phải giải quyết vấn đề bằng mô hình **'Framework Agnostic Wrapper API'**:
1. **Quy chuẩn hóa cách expose Component (Standardized Mounting contract):**
   Thay vì Remote Vue/Angular expose trực tiếp React component (không thể chạy được), chúng tôi quy định tất cả các remote exposed modules phải cung cấp một wrapper API chuẩn JavaScript thuần có dạng:
   ```javascript
   // Ở Remote Vue/Angular, export ra một JS mounting function:
   export const mount = (el, props) => {
     const app = createApp(VueComponent, props);
     app.mount(el);
     return () => app.unmount(); // Trả về hàm cleanup
   };
   ```
2. **React Wrapper ở Host (Shell):**
   Ở Host React, chúng tôi viết một Generic Component `VueAngularWrapper` chịu trách nhiệm tạo ra một thẻ `div` tham chiếu (`useRef`) làm container, tải remote entry, gọi hàm `mount(containerRef.current, props)`, và thực hiện gọi hàm cleanup trả về ở `useEffect` return khi unmount:
   ```javascript
   export default function VueAngularWrapper({ remoteName, componentName, props }) {
     const containerRef = useRef(null);
     
     useEffect(() => {
       let destroy = null;
       import(`${remoteName}/${componentName}`).then((module) => {
         if (containerRef.current) {
           destroy = module.mount(containerRef.current, props);
         }
       });
       return () => {
         if (destroy) destroy();
       };
     }, [remoteName, componentName, props]);
     
     return <div ref={containerRef} />;
   }
   ```
3. **Kiểm soát CSS Leakage giữa các framework:**
   Chúng tôi bọc vùng hiển thị của remote component trong một shadow DOM hoặc áp dụng prefix CSS nghiêm ngặt để đảm bảo các class của Angular/Vue không làm ảnh hưởng phần còn lại của ứng dụng."

---



#### Q15: Khi chia sẻ Design System giữa các Micro-Frontend, bạn lựa chọn giải pháp phân phối nào (Federated Design System vs NPM DLS Package)? Sự đánh đổi lớn nhất ở đây là gì và làm thế nào để đảm bảo an toàn vận hành?

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là bài toán tranh luận nảy lửa của mọi MFE Architect. Có hai trường phái chính và chúng tôi đã phân tích sự đánh đổi kỹ lưỡng trước khi đưa ra quyết định:
1. **Giải pháp 1 - Federated Design System (Runtime Share):**
   * *Cách làm:* Host/Remote load thư viện UI (`shared-ui`) động từ xa thông qua Module Federation (như một remote component).
   * *Ưu điểm:* Cập nhật tức thời. Khi bộ phận Design thay đổi một UI token (như màu nút bấm, font size), chúng tôi chỉ cần deploy duy nhất remote `shared-ui` là toàn bộ 8 squads sẽ được cập nhật giao diện ngay lập tức mà không cần build lại bất cứ thứ gì.
   * *Nhược điểm:* Rủi ro cực cao. Nếu thay đổi của Design System có breaking change (ví dụ thay đổi prop signature), toàn bộ các remote đang chạy sẽ crash runtime đồng loạt trên production mà không có cảnh báo compile-time.
2. **Giải pháp 2 - Build-time NPM Package (Chúng tôi lựa chọn):**
   * *Cách làm:* Đóng gói Design System thành một private npm package (hoặc dùng pnpm/Turborepo monorepo workspace) và các remote cài đặt phiên bản cụ thể vào `package.json` (ví dụ: `@singtel/design-system": "1.2.4"`).
   * *Ưu điểm:* An toàn tuyệt đối. Mỗi squad có quyền tự nâng cấp phiên bản Design System khi họ sẵn sàng test. Nếu squad A bận làm feature khác, họ vẫn có thể dùng bản `1.2.3` mà không sợ bị ảnh hưởng bởi thay đổi của squad B.
   * *Nhược điểm:* Để đổi màu 1 cái nút trên toàn trang, toàn bộ 8 squads sẽ phải nâng cấp version, build và deploy lại.
   
**Kết luận & Tối ưu hóa của chúng tôi:**
Chúng tôi kết hợp cả hai. Đối với các **UI Token (màu sắc, khoảng cách, fonts, css variables)**, chúng tôi đẩy qua Module Federation tại runtime dưới dạng CSS variables global (thay đổi đổi ngay tức thì). Đối với các **Logic Components phức tạp (Table, DatePicker, Modal)**, chúng tôi đóng gói thành package NPM tại build-time để kiểm soát chặt chẽ an toàn code."

---



#### Q16: "Tại sao người dùng thỉnh thoảng gặp lỗi 'Failed to fetch dynamic import' khi load Remote Component (ví dụ do mạng chập chờn)? Bạn đã triển khai cơ chế Tự động tải lại (Automatic Retry) như thế nào để khắc phục?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Lỗi `Failed to fetch dynamic import` (hoặc `Script error`) xảy ra do trình duyệt mất kết nối internet tạm thời lúc người dùng click chuyển trang, hoặc do CDN bị nghẽn ngắn hạn khiến chunk file JS của Remote bị trả về lỗi mạng. Theo mặc định, nếu `import()` thất bại, trình duyệt sẽ cache lại trạng thái lỗi đó và từ chối tải lại kể cả khi mạng đã có lại, buộc user phải F5 tải lại toàn bộ trang.
Để khắc phục rủi ro này và cải thiện trải nghiệm người dùng, tôi đã triển khai giải pháp **'Federated Resource Retry Wrapper'**:
1. **Hàm Dynamic Import có khả năng Retry (Custom Import Interceptor):**
   Thay vì gọi trực tiếp `React.lazy(() => import('remote/Component'))`, chúng tôi viết một tiện ích `lazyWithRetry` bọc quanh dynamic import:
   ```javascript
   export const lazyWithRetry = (importFn, retriesLeft = 3, interval = 1500) => {
     return React.lazy(() => 
       importFn().catch((error) => {
         if (retriesLeft <= 1) {
           return Promise.reject(error);
         }
         return new Promise((resolve) => {
           setTimeout(() => {
             resolve(lazyWithRetry(importFn, retriesLeft - 1, interval));
           }, interval);
         });
       })
     );
   };
   ```
2. **Cơ chế xóa cache script lỗi của trình duyệt:**
   Nếu file JS lỗi là do file manifest cũ, chúng tôi chèn thêm cache-buster timestamp động vào URL tải script tại runtime bằng cách can thiệp vào Webpack custom load script (`__webpack_require__.l`):
   ```javascript
   // Webpack config remote loader custom retry
   __webpack_require__.l = (url, cb, chunkId) => {
     // Thêm timestamp ngẫu nhiên khi retry để bypass cache lỗi của browser
     const retryUrl = url + '?t=' + Date.now();
     originalWebpackLoadScript(retryUrl, cb, chunkId);
   };
   ```
Nhờ cơ chế này, tỷ lệ lỗi không load được component do mạng chập chờn đã giảm xuống gần như bằng 0, tăng độ tin cậy của ứng dụng MFE trên mobile."

---



#### Q17: "Làm thế nào bạn thiết lập chiến lược kiểm thử tự động (Testing Strategy) cho hệ thống 8 squads này? Làm thế nào để tự động hóa kiểm thử mà không tạo ra điểm nghẽn (bottleneck) ở pipeline chung của Host?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Khi 8 squads deploy độc lập hàng ngày, nếu chúng ta bắt toàn bộ các thay đổi phải chạy một pipeline kiểm thử tích hợp (E2E) khổng lồ kéo dài 30 phút trên Host App, chúng ta sẽ tạo ra một điểm nghẽn cổ chai nghiêm trọng cho tốc độ bàn giao (delivery velocity).
Chúng tôi đã giải bài toán này bằng chiến lược **'Phân rã kiểm thử đa tầng (Distributed Test Pyramid)'**:
1. **Tầng 1 - Unit & Component Isolation Tests (Trách nhiệm của từng Remote - 70%):**
   * Mỗi squad tự viết và chạy Unit tests (Jest/Vitest) và Component tests (React Testing Library/Playwright CT) trong môi trường cô lập hoàn toàn của remote đó.
   * Kết quả test của remote nào tự chạy ở pipeline của remote đó, chạy song song và hoàn thành dưới 3 phút.
2. **Tầng 2 - Contract Testing (Đảm bảo tương thích Interfaces - 20%):**
   * Chúng tôi sử dụng **Pact** hoặc viết schema validation đơn giản bằng **Zod**.
   * Remote cam kết cấu hình các props đầu vào/đầu ra của exposed components. Host định nghĩa kỳ vọng (expectations) đối với các props đó.
   * CI pipeline tự động kiểm tra sự tương khớp giữa file manifest schema của remote và định nghĩa type ở Host mà không cần khởi động trình duyệt, phát hiện 95% các lỗi phá vỡ contract chỉ trong vài giây.
3. **Tầng 3 - Isolated E2E Integration (Chạy E2E thông minh - 10%):**
   * Ở pipeline của Host, chúng tôi không chạy toàn bộ E2E của tất cả tính năng. Chúng tôi chỉ chạy các test case cốt lõi (Critical Paths) như: Đăng nhập, thanh toán, vẽ khung sườn (Header/Sidebar).
   * Khi một Remote (ví dụ `remote-products`) deploy, pipeline của remote đó sẽ tự khởi động một phiên bản Host mock (hoặc trỏ tới Host Staging) để chạy E2E cho riêng các tương tác của sản phẩm đó.
Nhờ chia cắt trách nhiệm kiểm thử, các squad có thể tự tin deploy nhiều lần trong ngày với thời gian CI pipeline trung bình chỉ mất **3 phút** mỗi remote."

---



#### Q18: "Làm thế nào để quản lý Cấu hình môi trường (Environment Configs như API URLs, client keys) và Feature Flags động cho 8 Remotes tại runtime mà không cần phải build/recompile lại remote cho từng môi trường (Dev/Staging/Prod)?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Nếu chúng ta compile cứng các biến cấu hình (như `process.env.API_URL`) vào build bundle của remote, chúng ta sẽ phải build lại remote đó 3 lần cho 3 môi trường Dev, Staging và Production. Điều này vi phạm nguyên tắc Build Once, Deploy Everywhere của CI/CD chuyên nghiệp.
Chúng tôi giải quyết bài toán cấu hình động tại runtime bằng cách **'Centralized Configuration Injection'**:
1. **Host App Configuration Registry:**
   Khi Host App khởi tạo trên trình duyệt, việc đầu tiên nó làm trước khi render UI là tải một file cấu hình môi trường tĩnh (`/config.json`) từ server. File này được API Gateway/Nginx trả về động dựa trên môi trường deploy thực tế.
2. **Window Namespace Configuration:**
   Sau khi fetch thành công `/config.json`, Host App sẽ gán cấu hình này lên một đối tượng global duy nhất:
   ```javascript
   window.__SINGTEL_GLOBAL_CONFIG__ = {
     apiGatewayUrl: "https://api.singtel.com",
     featureFlags: { enableNewCheckout: true, discountV2: false },
     env: "production"
   };
   ```
3. **Remotes Consumption (Không dùng process.env):**
   Trong mã nguồn của các Remote, chúng tôi thay thế toàn bộ các tham chiếu `process.env.API_URL` bằng một helper function:
   ```javascript
   import { getRuntimeConfig } from 'shared-ui/utils';
   const apiUrl = getRuntimeConfig('apiGatewayUrl'); // Đọc trực tiếp từ window namespace an toàn
   ```
4. **Feature Flag Integration:**
   Với các Feature Flags phức tạp (tắt/bật tính năng động từ LaunchDarkly hoặc ConfigCat), Host App đóng vai trò là client khởi tạo SDK. Host lắng nghe các thay đổi flag và đồng bộ vào Shared State Store. Các Remote chỉ cần lắng nghe sự thay đổi của Shared Store này để render ẩn/hiện tính năng tại runtime mà không cần tự khởi tạo thêm kết nối SDK riêng biệt."

---



#### Q19: "Khi 8 teams cùng triển khai các sự kiện đo lường (Analytics / Tracking như Google Analytics, Mixpanel, GTM), làm sao để tránh việc tracking bị trùng lặp dữ liệu (Double Tracking) hoặc xung đột cấu hình? Bạn thiết kế kiến trúc Tracking như thế nào?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Nếu để mỗi squad tự nhúng script Google Tag Manager (GTM) hoặc Mixpanel vào remote của mình, trình duyệt sẽ tải SDK 8 lần, làm chậm tốc độ tải trang trầm trọng, đồng thời gây ra lỗi Double Tracking (ghi nhận trùng lặp sự kiện click/pageview).
Để quản lý tập trung và an toàn, tôi đã thiết kế **'Centralized Analytics Broker'**:
1. **Host chịu trách nhiệm khởi tạo SDK (Single Instance):**
   Chỉ duy nhất Host App (Shell) được phép khởi tạo các script GTM, Google Analytics và Mixpanel lên trình duyệt của người dùng.
2. **Analytics Event Bus Pattern (Custom Event Dispatcher):**
   Các Remote tuyệt đối không được gọi trực tiếp `gtag()`, `mixpanel.track()` hay `fbq()`. Thay vào đó, chúng tôi đóng gói một analytics utility nằm trong `shared-ui` package:
   ```javascript
   // Ở Remote component:
   import { analytics } from 'shared-ui/analytics';
   
   const handlePaymentSuccess = (order) => {
     analytics.track('purchase_completed', {
       orderId: order.id,
       value: order.amount,
       squad: 'squad-payment' // Gắn thẻ squad chịu trách nhiệm sự kiện
     });
   };
   ```
3. **Event forwarding ở Host:**
   Hàm `analytics.track` thực chất sẽ dispatch một Custom Event có tên `'analytics:event-triggered'` lên `window`. Host App ở tầng root lắng nghe sự kiện này, đọc payload và thực hiện chuyển tiếp (forward) dữ liệu đến GTM hoặc Mixpanel thông qua GTM Data Layer (`window.dataLayer.push`).
4. **Phân tách Event Namespaces:**
   Để tránh việc 2 squad cùng đặt tên trùng một event (ví dụ cả squad checkout và squad products cùng đặt tên event là `click_button`), chúng tôi quy định Event Name phải tuân theo cấu trúc: `[squad_prefix]_[action]_[element]` (ví dụ: `checkout_submit_payment`).
Cách tiếp cận này giúp giữ dữ liệu đo lường sạch 100%, dễ debug ở một nơi duy nhất (Host logs) và đảm bảo các bên thứ ba không làm chậm hiệu năng của các Remote."

---



#### Q20: Khi hệ thống MFE phình to lên tới hàng chục remotes, thời gian tải trang ban đầu (Initial Load Performance) bị kéo chậm do trình duyệt phải tải và parse quá nhiều file JS. Bạn đã tối ưu hóa JS Bundle và chiến lược Tree-shaking trong dự án như thế nào?

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là bài toán tối ưu hóa tài nguyên cốt lõi trong MFE. Khi số lượng micro-frontends tăng lên, nếu không kiểm soát tốt, người dùng sẽ phải tải hàng loạt bundle JS trùng lặp hoặc dư thừa. Chúng tôi đã xử lý triệt để qua 4 chiến thuật:
1. **Bảo đảm Tree-shaking hoạt động trên Shared Design System (Build-time):**
   * Chúng tôi cấu hình thư viện design system (`shared-ui`) xuất bản dưới dạng **ES Modules (ESM)**.
   * Đặt thuộc tính `"sideEffects": false` trong file `package.json` của `shared-ui` để báo cho Webpack biết nó có thể loại bỏ an toàn (tree-shake) các component không được import ở Remote/Host.
   * Cấu hình Babel/SWC loader thực hiện chuyển đổi import tự động (ví dụ: đổi `import { Button } from 'shared-ui'` thành `import Button from 'shared-ui/dist/esm/Button'`) thông qua plugin `babel-plugin-import` hoặc cấu hình Webpack Alias.
2. **Dynamic Code-Splitting bên trong từng Remote (Nested Lazy Loading):**
   * Không phải vì remote được tải động qua Module Federation mà chúng ta dừng việc Code Splitting trong bản thân remote đó.
   * Ví dụ: Remote Products (`remote-products`) có 3 sub-routes: Danh sách sản phẩm, Chi tiết sản phẩm, và Cài đặt sản phẩm.
   * Chúng tôi vẫn sử dụng `React.lazy` và Dynamic Import (`import()`) cho 3 trang này bên trong Remote. Nhờ vậy, khi Host tải `remoteEntry.js` của Products, trình duyệt chỉ tải chunk JS của trang Danh sách sản phẩm (nếu đang ở trang đó), các chunk của trang Chi tiết và Cài đặt chỉ được tải tiếp khi người dùng chuyển route nội bộ.
3. **Sử dụng Async Webpack Chunks (Thực thi bất tuần tự):**
   * Chúng tôi bật tính năng `asyncBoundary` trong Module Federation. Khi Host chạy, Webpack sẽ tạo ra một ranh giới bất đồng bộ (async boundary). Việc tải các dependency dùng chung (như React, React-Dom) được thực hiện bất đồng bộ thay vì chặn luồng chính lúc tải trang, giúp cải thiện chỉ số FCP (First Contentful Paint) và TBT (Total Blocking Time).
4. **Phân tích dung lượng thông qua Webpack Bundle Analyzer CI Gate:**
   * Chúng tôi tích hợp `webpack-bundle-analyzer` vào quy trình CI. Mỗi khi một squad mở Pull Request, CI pipeline tự động phân tích dung lượng bundle của remote đó. Nếu dung lượng bundle tăng đột ngột quá 50KB so với base branch, pipeline sẽ chặn và gửi cảnh báo lên Slack yêu cầu đội ngũ dev rà soát các thư viện import thừa (ví dụ import nhầm thư viện chưa được tree-shake)."

---



#### Q21: Làm thế nào để thiết kế cơ chế Dự phòng CDN (Multi-CDN / Failover) cho Module Federation? Ví dụ nếu CDN chính của Remote Products bị sập, làm sao Host tự động chuyển sang CDN phụ để tải script mà không làm gián đoạn trải nghiệm người dùng?

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Việc phụ thuộc vào một CDN duy nhất cho file `remoteEntry.js` là một rủi ro lớn đối với các ứng dụng doanh nghiệp (Single Point of Failure). Chúng tôi thiết kế cơ chế dự phòng CDN thông qua giải pháp **'Promise-based Failover Remote Loader'** trong Webpack:
1. **Cấu hình CDN chính và CDN dự phòng (Primary & Fallback CDNs):**
   Chúng tôi khai báo danh sách URL của remote trên hai hệ thống CDN khác nhau (ví dụ: CDN 1 chạy AWS CloudFront, CDN 2 chạy Google Cloud CDN làm dự phòng).
2. **Dynamic loading logic với Promise-based entry (Webpack config):**
   Thay vì trỏ trực tiếp URL, cấu hình Host trỏ về một đoạn mã Promise tự động xử lý lỗi mạng tại runtime:
   ```javascript
   remotes: {
     products: 'promise new Promise((resolve, reject) => {
       const primaryUrl = "https://cdn-primary.singtel.com/products/remoteEntry.js";
       const fallbackUrl = "https://cdn-fallback.singtel.com/products/remoteEntry.js";
       const loadScript = (url) => {
         return new Promise((resolveScript, rejectScript) => {
           const script = document.createElement("script");
           script.src = url;
           script.onload = resolveScript;
           script.onerror = rejectScript;
           document.head.appendChild(script);
         });
       };
       // Thử tải từ CDN chính
       loadScript(primaryUrl)
         .then(() => resolve(window.products))
         .catch(() => {
           console.warn("Primary CDN failed. Retrying with Fallback CDN...");
           // CDN chính lỗi, thử tải tiếp từ CDN phụ
           loadScript(fallbackUrl)
             .then(() => resolve(window.products))
             .catch((err) => reject(new Error("All CDNs failed: " + err.message)));
         });
     })'
   }
   ```
   Giải pháp này đảm bảo tính sẵn sàng cao (High Availability) cho hệ thống, giúp Host tự động khắc phục sự cố mạng mà không làm crash ứng dụng phía người dùng."

---



#### Q22: Vấn đề bảo mật XSS và Runtime Code Injection trong Module Federation: Vì Host tải mã JavaScript từ xa chạy trực tiếp trong cùng một thread, một kẻ tấn công chiếm quyền CDN của một remote có thể inject mã độc và đọc trộm JWT/Cookies trên Host. Bạn phòng chống rủi ro này như thế nào?

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là mối lo ngại bảo mật chính đáng đối với Module Federation (thường được gọi là 'Man-in-the-Middle' hoặc 'CDN compromise' vulnerability). Do remote JS chạy trực tiếp trên global window scope của Host, nó có quyền truy cập toàn bộ tài nguyên (DOM, cookies, storage).
Tôi đã thiết kế các biện pháp bảo mật đa tầng để giảm thiểu rủi ro này:
1. **Content Security Policy (CSP) nghiêm ngặt:**
   Chúng tôi định cấu hình header CSP ở cấp độ máy chủ Nginx/Host chỉ cho phép tải script từ các domain CDN chính thức và được kiểm soát chặt chẽ:
   ```http
   Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn-primary.singtel.com https://cdn-fallback.singtel.com;
   ```
   Điều này ngăn chặn kẻ tấn công thực hiện kỹ thuật chèn script từ các domain lạ bên ngoài.
2. **Không lưu trữ dữ liệu nhạy cảm ở Global Memory hoặc LocalStorage:**
   * Refresh Token và thông tin User Session bắt buộc phải được lưu trữ trong **HTTP-Only, Secure, SameSite=Strict Cookies** ở root domain. Mã JavaScript của Remote (kể cả mã độc) hoàn toàn không có cách nào đọc được giá trị của các cookie này (do cờ HTTP-Only chặn truy cập từ API `document.cookie`).
   * API Requests tự động đính kèm Cookie này, nên kẻ tấn công không thể 'đánh cắp' token đem đi nơi khác sử dụng.
3. **Subresource Integrity (SRI) trong MFE (Giải pháp nâng cao):**
   * Đối với các file remote entry tĩnh, chúng tôi chèn thẻ hash SHA-256 (`integrity="sha256-..."`) để trình duyệt tự động kiểm tra nội dung file tải về.
   * Với Module Federation thay đổi liên tục, chúng tôi viết một custom plugin tải file manifest json chứa danh sách hash của tất cả các file remote chunk. Host tải manifest này về trước, so khớp mã hash SHA-256 của script tải về với giá trị trong manifest đã ký số (Signed Manifest) trước khi append script tag vào DOM. Nếu phát hiện file bị sửa đổi nội dung, trình duyệt lập tức từ chối thực thi script."

---

#### Q23: "CV của bạn ghi 'reduced Time-to-First-Byte by 65%'. Con số 65% đó được đo lường bằng cách nào? Công cụ gì? Baseline là gì? Tại sao có thể tin được con số đó?"

**Trả lời phản biện chuyên sâu (Senior/Staff Level):**

"Đây là câu hỏi tôi rất mừng khi được hỏi, vì nó phân biệt giữa người thực sự làm và người chỉ copy số liệu. Con số 65% không phải ước đoán — nó đến từ một quy trình đo lường có hệ thống:

**1. Thiết lập Baseline trước khi tối ưu:**

Trước khi bắt đầu bất kỳ thay đổi nào, chúng tôi đo TTFB của kiến trúc cũ (monolith, không có SSR Module Federation) bằng 3 nguồn dữ liệu độc lập:

```bash
# Nguồn 1: WebPageTest (lab environment — kiểm soát điều kiện mạng)
# Chạy 9 lần để loại bỏ nhiễu thống kê, lấy median P75
# Location: Singapore (gần production server nhất)
# Connection: 4G throttled (đại diện cho 60% user base)
# Kết quả baseline: TTFB = 1,240ms (median P75)

# Nguồn 2: Chrome DevTools > Network tab
# Cột "Waiting (TTFB)" = khoảng thời gian từ khi gửi request
# đến khi nhận byte đầu tiên của response
# Kết quả: TTFB trung bình 1,180ms–1,320ms

# Nguồn 3: Real User Monitoring — Datadog RUM (production data)
# Web Performance API:
# performance.getEntriesByType('navigation')[0].responseStart
# Lấy P75 của 10,000 sessions thực trong 2 tuần trước khi deploy
# Kết quả baseline RUM: P75 TTFB = 1,210ms
```

**2. Đo lại sau khi triển khai SSR Module Federation:**

```bash
# WebPageTest (cùng điều kiện, cùng location): 430ms (median P75)
# Chrome DevTools staging: 390ms–460ms
# Datadog RUM P75 sau 2 tuần: 423ms

# Tính toán:
# Improvement = (1,240 - 430) / 1,240 × 100 = 65.3% → làm tròn 65%
```

**3. Tại sao tin được con số này?**

- **Consistency across sources:** Cả 3 công cụ đo độc lập đều cho kết quả tương đồng (~430ms), loại trừ bias từ một công cụ duy nhất.
- **Statistical significance:** WebPageTest chạy 9 lần, RUM lấy sample 10,000 sessions — không phải 1 lần đo may mắn.
- **Same conditions:** Baseline và after đều đo cùng URL, cùng network profile, cùng server region.
- **Root cause rõ ràng:** SSR trả về HTML có sẵn nội dung remote component thay vì HTML skeleton rỗng → browser nhận byte đầu tiên có meaningful content sớm hơn. Cơ chế hoàn toàn giải thích được con số.

**4. Những gì KHÔNG làm khi đo:**

```
❌ Không đo 1 lần rồi claim con số đó là đại diện
❌ Không so sánh staging (after) với production (before) — môi trường khác nhau
❌ Không lấy best case (min) của before so với average của after
❌ Không bỏ qua cache warming — luôn đo cold start (incognito + cache cleared)
❌ Không dùng localhost để đo TTFB — không có network latency thực tế
```

**Nếu interviewer hỏi tiếp 'Tại sao TTFB ảnh hưởng đến trải nghiệm?':**

Với MFE CSR truyền thống, byte đầu tiên chỉ là `<div id='root'></div>` — browser phải tải thêm JS, run React, fetch remote entry, rồi mới render nội dung. Với SSR MFE, byte đầu tiên đã chứa HTML đầy đủ → browser parse và paint sớm hơn → LCP giảm theo → Cumulative Layout Shift cũng giảm vì không còn hiện tượng 'content pop-in' sau khi JS load."

---

### Cheat Sheet cho phỏng vấn

| Interviewer hỏi | Trả lời key points |
|---|---|
| "MFE là gì?" | Chung cư model + independent deploy + team autonomy |
| "Module Federation?" | USB drive model + host/remote/shared + runtime loading |
| "Shared state?" | Custom events (simple) vs Shared store (complex) |
| "CSS conflicts?" | CSS Modules + design system singleton |
| "Performance?" | Lazy loading + shared deps + preload + 100KB overhead |
| "Testing?" | Contract tests + per-MFE unit + E2E integration |
| "8 teams governance?" | Platform team + Design system team + feature teams |
| "vs iframe?" | Runtime sharing + SEO + performance vs complete isolation |
| "vs npm packages?" | Independent deploy + no consumer rebuild |
| "Khi nào KHÔNG dùng?" | < 15 devs, MVP, simple CRUD, no DevOps maturity |
| "65% TTFB — đo thế nào?" | WebPageTest P75 × 9 runs + Datadog RUM 10k sessions, same conditions |

---

## 16. Demo Architecture

### Project Structure

```
demos/micro-frontend-federation/
├── packages/
│   ├── host/                    # Port 3000 — Shell app
│   │   ├── src/App.tsx          # Load remotes via Suspense
│   │   ├── webpack.config.js    # ModuleFederationPlugin (consumer)
│   │   └── package.json
│   ├── remote-products/         # Port 3001 — Products team
│   │   ├── src/ProductList.tsx  # Exposed component
│   │   ├── webpack.config.js    # ModuleFederationPlugin (provider)
│   │   └── package.json
│   ├── remote-cart/             # Port 3002 — Cart team
│   │   ├── src/CartButton.tsx   # Exposed component
│   │   ├── webpack.config.js    # ModuleFederationPlugin (provider)
│   │   └── package.json
│   └── shared-ui/              # Shared design system
│       ├── src/Button.tsx
│       ├── src/Card.tsx
│       └── package.json
├── docs/
│   └── micro-frontend-deep-dive.md  (this file)
└── package.json                 # Monorepo root
```

### Running the Demo

```bash
# Install all dependencies
npm install

# Start all apps (host + remotes)
npm run dev

# Or individually:
cd packages/host && npm start          # http://localhost:3000
cd packages/remote-products && npm start # http://localhost:3001
cd packages/remote-cart && npm start     # http://localhost:3002
```

### What to observe

1. **Host app** loads and shows shell UI
2. **Products** component loaded from remote (check Network tab: `remoteEntry.js`)
3. **Cart button** loaded from different remote
4. **Kill remote-products** server → Host shows fallback (graceful degradation)
5. **Restart remote-products** → Click retry → Products appear again
6. **View source**: Host HTML contains placeholder, remotes loaded at runtime

---

## Code Modernization — TypeScript Migration, Test Coverage & Refactoring

> **Context:** Pattern áp dụng thực tế trong các dự án legacy modernization — từ JavaScript không có type sang TypeScript strict, từ code monolithic sang business logic được segmented, từ không có test sang high coverage. Demo: [`CodeModernizationDemo.tsx`](../packages/host/src/CodeModernizationDemo.tsx)

### Vấn đề của Legacy Codebase

```javascript
// ❌ LEGACY: Không type, mutate input, untestable, không docs

function processOrder(order) {          // What is order? Any shape!
  if (order.items.length > 0) {
    var total = 0;                      // var = hoisting bugs
    for (var i = 0; i < order.items.length; i++) {
      total += order.items[i].price * order.items[i].qty;
      // "price" hay "priceInCents"? "qty" hay "quantity"?
      // Nobody knows without reading ALL usage sites!
    }
    if (order.discount)                 // discount là gì? Rate? Amount?
      total = total - (total * order.discount); // ← business rule buried here
    order.total = total;                // ← MUTATION! input object changed!
    order.processed = true;
  }
  return order;
  // Return value = mutated input? Or new object? ¯\_(ツ)_/¯
}

// To "test" this:
//   1. Understand what shape "order" should be (no types)
//   2. Handle mutation in test (order is changed after call)
//   3. Can't test discount logic separately (buried in loop)
//   4. Can't verify "total" is correct without running the whole function
```

---

### Bước 1: TypeScript Interfaces — Documented by Type

```typescript
// ✅ AFTER: Types ARE the documentation

/**
 * Represents a single line item in an order.
 * Price in cents to avoid floating-point rounding issues.
 */
export interface OrderItem {
  id: string;
  name: string;
  /** Unit price in cents (e.g. 999 = $9.99) */
  priceInCents: number;
  quantity: number;
}

/**
 * Discount: percentage (0.0–1.0) OR flat amount in cents.
 * TypeScript discriminated union — exhaustive type checking!
 */
export type Discount =
  | { type: "percentage"; rate: number }      // 0.1 = 10% off
  | { type: "flat"; amountInCents: number };  // 500 = $5.00 off

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  discount?: Discount;
  // readonly = computed, never passed in — explicit contract!
  readonly totalInCents?: number;
  readonly isProcessed?: boolean;
}

// TypeScript enforces: ProcessedOrder has totalInCents (required!)
export interface ProcessedOrder extends Order {
  totalInCents: number;     // required (not optional)
  isProcessed: true;        // literal type — must be true!
  processedAt: Date;
}
```

---

### Bước 2: Business Logic Segmentation — Mỗi hàm 1 Trách nhiệm

```typescript
// ❌ BEFORE: All logic in 1 function = impossible to test in isolation

// ✅ AFTER: Segmented into pure functions, each independently testable

/**
 * LAYER 1: Pure math — no business rules
 * Test: assert(calculateLineTotal({priceInCents: 999, quantity: 3}) === 2997)
 */
export function calculateLineTotal(item: OrderItem): number {
  return item.priceInCents * item.quantity;
}

/**
 * LAYER 2: Aggregation — depends only on Layer 1
 * Test: sum of array, easy to mock items
 */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

/**
 * LAYER 3: Business rules — explicit, documented, independently testable
 * Rule: percentage 0.0–1.0; flat can't make total negative
 */
export function applyDiscount(subtotal: number, discount: Discount): number {
  if (discount.type === "percentage") {
    if (discount.rate < 0 || discount.rate > 1)
      throw new Error(`Rate must be 0.0–1.0, got ${discount.rate}`);
    return Math.round(subtotal * (1 - discount.rate));
  }
  return Math.max(0, subtotal - discount.amountInCents);  // never negative!
}

/**
 * LAYER 4: Orchestrator — coordinates layers 1-3
 * Pure: NEVER mutates input, returns new object (spread pattern)
 */
export function processOrder(order: Order): ProcessedOrder {
  if (order.items.length === 0)
    throw new Error(`Cannot process empty order ${order.id}`);

  const subtotal = calculateSubtotal(order.items);
  const totalInCents = order.discount
    ? applyDiscount(subtotal, order.discount)
    : subtotal;

  return {
    ...order,          // Spread — immutable!
    totalInCents,
    isProcessed: true,
    processedAt: new Date(),
  };
}
```

```
Segmentation diagram:

┌───────────────────────────────────────────────────────┐
│ UI (React Component)                                  │
│   → consumes useCart() hook only                     │
│   → knows nothing about "how" cart works             │
├───────────────────────────────────────────────────────┤
│ useCart() Hook — Layer 5                              │
│   → exposes clean API to UI                          │
│   → calls cartReducer for state transitions          │
│   → calls processOrder for checkout                  │
├───────────────────────────────────────────────────────┤
│ cartReducer() — Layer 4b                              │
│   → manages CartState transitions                    │
│   → pure: (state, action) => newState                │
├───────────────────────────────────────────────────────┤
│ processOrder() — Layer 4a                             │
│   → orchestrates subtotal + discount + metadata      │
├───────────────────────────────────────────────────────┤
│ applyDiscount() — Layer 3                             │
│   → business rules for discount application          │
├───────────────────────────────────────────────────────┤
│ calculateSubtotal() — Layer 2                         │
│   → aggregates line totals                           │
├───────────────────────────────────────────────────────┤
│ calculateLineTotal() — Layer 1                        │
│   → price × quantity for 1 item                      │
└───────────────────────────────────────────────────────┘

Each layer depends only on layers below it.
Each layer is testable without layers above it!
```

---

### Bước 3: Test Coverage — Pure Functions = Free Testability

```typescript
// BEFORE (legacy): Testing requires complex setup, mocking, side effects
//   Order object was mutated → tests had hidden dependencies
//   Business rules buried in loops → can't test rule independently

// AFTER: Every function testable in 1-2 lines!

describe('calculateLineTotal', () => {
  it('multiplies price by quantity', () => {
    expect(calculateLineTotal({
      id: '1', name: 'X', priceInCents: 999, quantity: 3
    })).toBe(2997);
  });
  it('handles zero quantity', () => {
    expect(calculateLineTotal({
      id: '1', name: 'X', priceInCents: 999, quantity: 0
    })).toBe(0);
  });
});

describe('applyDiscount', () => {
  it('applies percentage discount', () => {
    expect(applyDiscount(10000, { type: 'percentage', rate: 0.1 })).toBe(9000);
  });
  it('flat discount cannot make total negative', () => {
    expect(applyDiscount(100, { type: 'flat', amountInCents: 500 })).toBe(0);
  });
  it('throws on invalid percentage rate', () => {
    expect(() => applyDiscount(100, { type: 'percentage', rate: 1.5 }))
      .toThrow();
  });
});

describe('processOrder', () => {
  it('does NOT mutate the input order', () => {
    const order: Order = { id: 'O1', customerId: 'C1', items: [...] };
    const processed = processOrder(order);
    // Key assertion: original unchanged!
    expect(order.totalInCents).toBeUndefined();
    expect(order.isProcessed).toBeUndefined();
    // New object has computed fields:
    expect(processed.totalInCents).toBeDefined();
    expect(processed.isProcessed).toBe(true);
  });
  it('throws on empty items', () => {
    expect(() => processOrder({ id: 'O1', customerId: 'C1', items: [] }))
      .toThrow('Cannot process empty order');
  });
});

describe('cartReducer', () => {
  it('ADD_ITEM increments quantity if duplicate', () => {
    const state1 = cartReducer(initialState, { type: 'ADD_ITEM', payload: {...} });
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', payload: {...} });
    expect(state2.items[0].quantity).toBe(2);
    expect(state2.items.length).toBe(1); // not duplicated!
  });
  it('UPDATE_QUANTITY 0 removes item', () => {
    const state = cartReducer(stateWithItem, {
      type: 'UPDATE_QUANTITY',
      payload: { id: '1', quantity: 0 }
    });
    expect(state.items.length).toBe(0);
  });
});

// Hook testing (React Testing Library):
describe('useCart', () => {
  it('calculates total with discount', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem({ id: '1', priceInCents: 1000, quantity: 2 }));
    act(() => result.current.applyPercentageDiscount(0.1));
    expect(result.current.total).toBe(1800); // 2000 - 10%
  });
});
```

---

### Bước 4: useReducer — Replacing Scattered useState

```typescript
// ❌ BEFORE: Multiple useState = scattered, hard to trace state transitions
function LegacyCart() {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(null);
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [error, setError] = useState(null);
  // State can be inconsistent:
  //   isProcessing=true AND isProcessed=true (impossible state!)
  //   error present but isProcessed=true (contradictory)
}

// ✅ AFTER: useReducer = impossible states become impossible types

type CartStatus = 'idle' | 'processing' | 'processed' | 'error';
// TypeScript: CartStatus can ONLY be one of these 4 values
// 'processing' and 'processed' cannot both be true simultaneously!

interface CartState {
  items: CartItem[];
  discount?: Discount;
  status: CartStatus;  // ← Single source of truth for "what phase are we in"
  errorMessage?: string;
  processedOrder?: ProcessedOrder;
}

// All transitions go through cartReducer — single place to trace all state changes
// No scattered setters across component — explicit action names document intent
// TypeScript: dispatch({ type: 'TYPO' }) → compile error!
```

---

### Bước 5: Documenting Application Behavior

```typescript
// Self-documenting code = code that explains WHY, not just WHAT

// BAD docs (obvious, adds no value):
// "Applies discount to price"
function applyDiscount(price: number, rate: number): number {
  return price * (1 - rate);
}

// GOOD docs (explains business rules, edge cases, units):
/**
 * Applies a discount to a subtotal.
 *
 * @param subtotalInCents - Pre-discount amount IN CENTS (avoid float issues)
 * @param discount - Discriminated union: percentage rate OR flat amount
 * @returns Discounted amount in cents, NEVER negative
 *
 * Business rules documented here:
 * - Percentage rate must be 0.0–1.0 (0%–100%), throws if invalid
 * - Flat discount: capped at subtotal (order cannot go negative)
 * - Result rounded to avoid floating-point cents (0.5 → 1)
 *
 * @example
 *   applyDiscount(10000, { type: 'percentage', rate: 0.1 })
 *   // → 9000 ($90.00 from $100.00)
 *
 *   applyDiscount(2000, { type: 'flat', amountInCents: 500 })
 *   // → 1500 ($15.00 from $20.00)
 *
 *   applyDiscount(100, { type: 'flat', amountInCents: 500 })
 *   // → 0 (not -400! flat discount capped at subtotal)
 */
export function applyDiscount(subtotalInCents: number, discount: Discount): number {
  // ...
}
```

```
Documentation strategy:
  CODE level:
    - TypeScript types ARE documentation (no ambiguity about shape)
    - JSDoc on public functions: @param units, @returns, business rules
    - Comments explain WHY not WHAT ("// never negative!" not "// return max 0")
    
  TEST level:
    - Test names describe behavior: "throws on empty items"
    - Tests serve as executable documentation
    
  ARCHITECTURAL level:
    - Inline block comments above components/hooks: what problem does this solve?
    - Layer diagram (as above) in markdown docs
    
  README/Docs:
    - "What to observe" section in demos (like this file!)
    - Known edge cases documented
    - Setup instructions with real commands
```

---

### Summary — Modernization Checklist

```
PHASE 1: TypeScript Migration
  ☑ Enable strict mode (tsconfig: "strict": true)
  ☑ Type all function parameters and return values
  ☑ Use discriminated unions for variant types (Discount, Status)
  ☑ Replace any with proper types
  ☑ Add readonly to immutable fields

PHASE 2: Business Logic Segmentation
  ☑ Extract pure functions from components/classes
  ☑ Layer by responsibility (math → aggregation → rules → orchestration)
  ☑ Move business logic OUT of React components (into hooks/services)
  ☑ Replace mutable code with immutable patterns (spread, map, filter)

PHASE 3: Test Coverage
  ☑ Unit test each pure function (no mocking needed!)
  ☑ Test reducer with direct function calls
  ☑ Test hooks with renderHook()
  ☑ Test edge cases documented in JSDoc
  ☑ Coverage targets: >80% lines, >90% branches for business logic

PHASE 4: Documentation
  ☑ JSDoc on all exported functions
  ☑ Document units in type definitions (priceInCents, not price)
  ☑ Document business rules as comments in code
  ☑ Keep README with architecture diagram + setup instructions
  ☑ Test names as executable documentation

Impact:
  Legacy codebase: 0% type coverage, 0% test coverage, high bug rate
  After modernization:
    TypeScript strict: Catches ~15% of bugs at compile time
    Test coverage 80%+: Regressions caught before production
    Pure functions: 3x easier to refactor safely
    Self-documenting: Onboarding time reduced significantly
```


---

## Interview Q&A — Code Modernization, TypeScript & Test Coverage

> Câu hỏi phỏng vấn Senior/Staff level về việc modernize legacy codebase. Phản ánh thực tế từ dự án.

---

#### Q: Bạn tiếp cận một legacy JavaScript codebase lớn để modernize với TypeScript như thế nào? Bắt đầu từ đâu?

**Trả lời (Senior Level):**

Không bắt đầu bằng "chuyển đổi toàn bộ" — đó là cách thất bại.

Tôi áp dụng **Strangler Fig Pattern** — thay thế từng phần legacy, giữ hệ thống chạy được suốt quá trình:

```
Phase 1: Foundation (Không viết code mới)
  1. Bật TypeScript với "allowJs: true, strict: false"
     → Toàn bộ JS files compile ngay lập tức (0 errors ban đầu)
  2. Chạy "tsc --noEmit --allowJs" → note tất cả ANY types
  3. Enable "strict: true" từng option một:
     strictNullChecks → noImplicitAny → strictFunctionTypes...
  4. Dùng ESLint @typescript-eslint để mark "technical debt"

Phase 2: Business Logic First (Highest ROI)
  Ưu tiên: Functions xử lý money/data/business rules
  Lý do: Bugs ở đây = revenue impact trực tiếp
  
  Legacy:
    function processOrder(order) { ... }
  
  Step 1: Add types to params/returns
    function processOrder(order: Order): ProcessedOrder { ... }
  
  Step 2: Identify mutations → refactor to immutable
    order.total = total; → return { ...order, totalInCents }
  
  Step 3: Extract sub-functions (pure functions)
    calculateSubtotal(), applyDiscount()
  
  Step 4: Write tests for each pure function (now possible!)

Phase 3: UI Layer Last
  React components: Use React.FC<Props> với explicit PropTypes
  State: useState<T>(initialValue) → type inferred
  Events: React.ChangeEvent<HTMLInputElement> etc.

Metric để track progress:
  Tuần 1: 0% typed → 20% (core domain types)
  Tuần 2: 20% → 50% (services/hooks)
  Tuần 3: 50% → 80% (UI components)
  Tuần 4: 80% → 95%+ (remaining files + strict mode)
```

---

#### Q: "Segmenting existing business logic" trong bối cảnh React app có nghĩa là gì? Và tại sao quan trọng?

**Trả lời:**

Segmentation = tách business logic ra khỏi UI và side effects theo **layers**:

```typescript
// ❌ UNSEGMENTED: Business logic trong React component
function CartPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  
  const addItem = (product) => {
    const newItems = [...items, product];
    // Business rule buried in component!
    const newTotal = newItems.reduce((sum, item) => {
      let lineTotal = item.price * item.quantity;
      if (item.category === 'book') lineTotal *= 0.9; // 10% book discount
      return sum + lineTotal;
    }, 0);
    setItems(newItems);
    setTotal(newTotal);
  };
  
  // UI, state, AND business rules all in one place
  // Cannot test book discount rule without rendering the component!
}

// ✅ SEGMENTED: Each layer has clear responsibility

// Layer 1: Pure business rule (testable in isolation!)
function calculateLineTotal(item: OrderItem, category: Category): number {
  const base = item.priceInCents * item.quantity;
  // Book discount rule: documented, testable, reusable
  return category === 'book' ? Math.round(base * 0.9) : base;
}

// Layer 2: Aggregation (depends on Layer 1)
function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) =>
    sum + calculateLineTotal(item, item.category), 0);
}

// Layer 3: State management (depends on Layer 2)
function cartReducer(state: CartState, action: CartAction): CartState { ... }

// Layer 4: Hook (UI bridge — no business logic!)
function useCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  // Just wiring — no business rules here
  const addItem = (item: OrderItem) => dispatch({ type: 'ADD_ITEM', payload: item });
  return { items: state.items, subtotal: calculateSubtotal(state.items), addItem };
}

// Layer 5: UI Component (displays data only)
function CartPage() {
  const { items, subtotal, addItem } = useCart(); // consume hook
  return <div>{/* pure UI */}</div>;
}
```

```
Benefits của segmentation:
  Testing: Test Layer 1 without rendering any component
  Reuse:   calculateLineTotal() reusable in email service, PDF invoice
  Debug:   Bug in total? → Is it Layer 1? 2? 3? Instantly localizable
  Change:  Book discount changes to 15%? Touch 1 function, 1 test
  Onboard: New dev reads Layer 1 first → understands business rules
```

---

#### Q: Làm thế nào để improve test coverage khi codebase legacy không có test nào và code chưa được thiết kế để testable?

**Trả lời — 4 bước thực tế:**

```
Bước 1: Không viết test cho code hiện tại → refactor trước!
  Legacy code không testable VÌ nó mutate, depends on global state, tightly coupled.
  Writing tests for untestable code = wasting time.
  
  Refactor làm code testable:
    Mutation → Pure functions (extract và return new object)
    Global state → Dependency injection / hook parameters
    Tight coupling → Interface-based design

Bước 2: Test Pyramid — bắt đầu từ đáy
  Unit tests (nhiều nhất): Pure functions, reducers
    → Fastest to write, fastest to run, highest ROI
  Integration tests (vừa): Hooks (renderHook), combined flows
  E2E tests (ít nhất): Critical user journeys only
  
  Common mistake: "Cần E2E tests" → E2E = slow, flaky, expensive
  Better: 80% unit + 15% integration + 5% E2E

Bước 3: Coverage-Driven Refactoring
  1. Run coverage report → identify 0% covered files
  2. For each 0% file: Can I unit test it directly?
     YES → write tests
     NO → it's probably not a pure function → extract pure functions first
  3. Target: >80% lines, >90% branches for business logic
  
  Coverage thresholds in CI (vitest.config.ts):
  thresholds: { lines: 80, functions: 90, branches: 80 }
  → Build FAILS if coverage drops below threshold
  → Prevents coverage regression as codebase grows

Bước 4: "Test as Documentation" mindset
  Test names describe BEHAVIOR, not implementation:
  
  BAD: "test processOrder function"
  GOOD: "processOrder — does NOT mutate the input order"
  GOOD: "processOrder — throws on empty items array"
  GOOD: "applyDiscount — flat discount caps at 0 (never negative)"
  
  → Test names become living specification
  → New team members read tests to understand business rules
```

```
Our test file: CodeModernization.test.ts
  45 test cases covering:
  
  calculateLineTotal: 6 tests
  calculateSubtotal:  4 tests  
  applyDiscount:      10 tests (5 percentage + 5 flat)
  processOrder:       7 tests (immutability, edge cases)
  formatCents:        4 tests
  cartReducer:        14 tests (all state transitions)
  Integration:        2 tests (full order flow)
  
  Business rules explicitly tested:
    "flat discount never makes total negative"
    "quantity 0 removes item from cart"
    "duplicate items increment quantity (no duplication)"
    "processedAt is approximately now"
```

---

#### Q: Làm sao bạn document application behavior mà không phải viết docs riêng biệt (mà mọi người đều không đọc)?

**Trả lời — 4 loại "living documentation":**

```typescript
// 1. TYPES AS DOCUMENTATION
// Types document what data looks like — always up to date!

// BAD: undefined type
function applyDiscount(subtotal, discount) { ... }
// Good luck figuring out what "discount" is without reading the code!

// GOOD: Type IS the doc
function applyDiscount(
  subtotalInCents: number,  // "InCents" suffix documents the unit!
  discount: Discount        // TypeScript shows: { type: 'percentage', rate } | { type: 'flat', amountInCents }
): number { ... }

type Discount =
  | { type: "percentage"; rate: number }      // 0.0–1.0
  | { type: "flat"; amountInCents: number };  // e.g. 500 = $5.00
// The discriminated union IS the documentation of valid discount formats!

// 2. JSDoc FOR BUSINESS RULES (not obvious stuff)
/**
 * Business Rule: percentage rate must be 0.0–1.0 (not 0–100!)
 * Business Rule: flat discount cannot make total negative (capped at 0)
 * Unit: subtotalInCents is in cents (not dollars) to avoid floating-point
 * @example applyDiscount(10000, { type: 'percentage', rate: 0.1 }) → 9000 ($90)
 */

// 3. TESTS AS SPECIFICATION
// Test names describe behavior: WHAT should happen, not HOW
it("flat discount cannot make total negative", () => { ... });
it("processOrder does NOT mutate the input order", () => { ... });
it("duplicate ADD_ITEM increments quantity, not duplicates item", () => { ... });
// New developer reads test names → understands business rules!

// 4. INLINE COMMENTS FOR NON-OBVIOUS DECISIONS
// Math.round() — explains WHY, not just WHAT
discounted = subtotalInCents * (1 - discount.rate);
return Math.round(discounted);
//     ↑ Why round? → Floating point: 0.1 * 999 = 89.9... → need integer cents!
```

```
Documentation Hierarchy (most to least effective):
  1. TypeScript types + naming (priceInCents not price)
  2. Test names (read test suite = read spec)
  3. JSDoc on public functions (business rules, units, examples)
  4. Inline comments (explain WHY unusual choices were made)
  5. README (setup + architecture overview)
  6. ❌ Separate Word/Confluence docs (gets outdated, nobody reads)
```

---

#### Q: Bạn đã gặp resistance nào khi đề xuất refactoring legacy code? Xử lý như thế nào?

**Trả lời:**

```
Resistance phổ biến và cách xử lý:

"If it ain't broke, don't fix it"
  → Show: Legacy code IS broken, just silently
  → Demo: "What happens if discount > 1?" → NaN, negative totals, no error
  → Show real bug from prod caused by no types/no tests
  
"We don't have time"
  → Counter: "We spend X hours/week debugging → refactor saves time"
  → Frame as: "This is bug prevention, not gold-plating"
  → Start small: Modernize 1 critical module first, show results

"Rewriting is risky"
  → Agree! But we're NOT rewriting — we're REFACTORING
  → Key: Keep tests green at every step (never break existing behavior)
  → Use coverage to prove behavior preserved
  → Strangler Fig: Old code stays until new code is proven

"TypeScript adds too much overhead"
  → "TypeScript saved us from 3 production bugs last sprint"
  → TypeScript catches ~15% of bugs at compile time (Microsoft research)
  → IDE autocomplete: 30% faster development after initial setup

Metrics that helped justify the work:
  Before: 4 bug reports/week related to cart calculation
  After:  0 bug reports in 3 months (pure functions, typed, tested)
  
  Before: 2 hours to add new discount type (fear of breaking things)
  After:  20 minutes (add type + test + implement = clear path)
```


---

## End-to-End Encryption (E2EE) — Advanced Security cho Message Exchange

> **Context:** Security research cho secure messaging features trong enterprise applications. Demo: [`E2EEncryptionDemo.tsx`](../packages/host/src/E2EEncryptionDemo.tsx)
>
> **Stack:** Web Crypto API (SubtleCrypto) — native browser APIs, zero external dependencies.
> - **ECDH P-256**: Key exchange (Elliptic Curve Diffie-Hellman)
> - **AES-GCM 256**: Symmetric encryption + integrity
> - **ECDSA P-256**: Digital signatures + authentication

### Tại sao E2EE? — Threat Model

```
Standard encryption (HTTPS only):
  Client → [TLS] → Server (decrypts, reads plaintext) → [TLS] → Client

  Attacker scenarios:
    ✅ TLS protects: Network eavesdropping (sniffing)
    ❌ TLS does NOT protect: Compromised server, insider threat,
                              government subpoena, server breach

E2E Encryption:
  Client → [E2EE shared key] → Client only
  Server receives:  { iv: "abc123...", ciphertext: "XKm9p..." } ← opaque bytes!
  
  Attacker scenarios:
    ✅ Protects against: Server breach, insider threat, subpoena
    ✅ Only the two clients can decrypt — mathematically proven
    
Real world: Signal, WhatsApp, iMessage all use E2EE
```

---

### Core Algorithm: ECDH Key Exchange

```
The magic: Two parties derive SAME secret WITHOUT transmitting it!

Mathematical foundation (P-256 elliptic curve):
  G = generator point (public, everyone knows it)
  
  Alice: private_A = random 256-bit number (KEEP SECRET)
         public_A  = private_A × G (share with Bob)
  
  Bob:   private_B = random 256-bit number (KEEP SECRET)
         public_B  = private_B × G (share with Alice)
  
  Alice derives: shared = private_A × public_B
                        = private_A × (private_B × G)
                        = private_A × private_B × G
  
  Bob   derives: shared = private_B × public_A
                        = private_B × (private_A × G)
                        = private_B × private_A × G
                        = private_A × private_B × G  ← SAME!
  
  Network traffic:  public_A and public_B only (safe to expose!)
  Attacker has:     public_A, public_B
  Attacker needs:   private_A × private_B
  = Solving ECDLP (Elliptic Curve Discrete Logarithm Problem)
  = ~2^128 operations for P-256 = computationally infeasible!
```

---

### Web Crypto API — Implementation

```typescript
// ── Step 1: Generate key pairs ────────────────────────────────────

// ECDH: For key exchange (derive shared secret)
const ecdhPair = await crypto.subtle.generateKey(
  { name: "ECDH", namedCurve: "P-256" },
  true,           // exportable (public key only!)
  ["deriveKey"]   // usage: derive AES key
);

// ECDSA: For signing (prove identity, prevent MitM)
const ecdsaPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);

// Export public key as JWK (JSON Web Key) — safe to transmit!
// Private key stays in browser memory ONLY — never exported!
const myPublicEcdhJwk = await crypto.subtle.exportKey("jwk", ecdhPair.publicKey);


// ── Step 2: Derive shared AES key ────────────────────────────────

// Alice: uses her private key + Bob's public key
// Bob:   uses his private key + Alice's public key
// → Both get IDENTICAL AES-256-GCM key!

const sharedAesKey = await crypto.subtle.deriveKey(
  {
    name: "ECDH",
    public: theirPublicEcdhKey,  // Import their JWK first!
  },
  myEcdhPair.privateKey,
  { name: "AES-GCM", length: 256 },
  false,                          // NOT exportable — stays in memory
  ["encrypt", "decrypt"]
);


// ── Step 3: Encrypt with AES-GCM ─────────────────────────────────

// CRITICAL: New random IV for EVERY message (never reuse!)
const iv = crypto.getRandomValues(new Uint8Array(12));

const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },       // iv included in params, NOT secret
  sharedAesKey,
  new TextEncoder().encode(plaintext)
);
// Transmit: { iv: base64(iv), ciphertext: base64(ciphertext) }
// Server sees opaque bytes — cannot decrypt!


// ── Step 4: Sign with ECDSA ───────────────────────────────────────

const signature = await crypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  myEcdsaPair.privateKey,          // sign with PRIVATE key
  new TextEncoder().encode(plaintext)
);
// Transmit: { ..., signature: base64(signature), senderPublicEcdsaJwk }


// ── Step 5: Decrypt + Verify ──────────────────────────────────────

// Decrypt
const plaintextBuf = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv: base64ToArrayBuffer(message.iv) },
  sharedAesKey,
  base64ToArrayBuffer(message.ciphertext)
);
// Throws DOMException if: wrong key OR tampered ciphertext!

// Verify signature (proves sender identity)
const isValid = await crypto.subtle.verify(
  { name: "ECDSA", hash: "SHA-256" },
  senderPublicKey,                   // sender's public ECDSA key
  base64ToArrayBuffer(message.signature),
  new TextEncoder().encode(decryptedText)
);
// isValid = false → possible MitM attack!
```

---

### Security Properties Achieved

```
┌────────────────────────────────────────────────────────────────┐
│ Property         │ Mechanism             │ Guarantee            │
├────────────────────────────────────────────────────────────────┤
│ Confidentiality  │ AES-GCM 256           │ Only shared-key      │
│                  │                       │ holders can decrypt  │
├────────────────────────────────────────────────────────────────┤
│ Integrity        │ AES-GCM auth tag      │ Any tampering =      │
│                  │                       │ decryption failure   │
├────────────────────────────────────────────────────────────────┤
│ Authentication   │ ECDSA signature       │ Proves WHO sent      │
│                  │                       │ the message          │
├────────────────────────────────────────────────────────────────┤
│ Forward Secrecy  │ Ephemeral ECDH keys   │ Past sessions safe   │
│                  │ (new per session)     │ if keys compromised  │
├────────────────────────────────────────────────────────────────┤
│ Zero Knowledge   │ Server never sees     │ Server breach =      │
│ Server           │ plaintext or keys     │ attacker gets nothing│
└────────────────────────────────────────────────────────────────┘
```

---

### Critical Security Pitfalls (Anti-patterns)

```typescript
// ❌ NEVER: Reuse IV with same AES key!
const iv = new Uint8Array(12); // all zeros!
// → AES-GCM with repeated IV = authentication broken!
// → Two ciphertexts XOR'd = plaintext recovery!

// ✅ ALWAYS: Cryptographically random IV per message
const iv = crypto.getRandomValues(new Uint8Array(12));


// ❌ NEVER: Export/store private keys
const exported = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
localStorage.setItem("privateKey", JSON.stringify(exported));
// → localStorage accessible to any XSS attack!
// → Private key = game over for all past and future messages

// ✅ Private key stays in memory only
// For persistence: Use IndexedDB with non-extractable keys:
const keyPair = await crypto.subtle.generateKey(
  { name: "ECDH", namedCurve: "P-256" },
  false,      // ← NOT extractable! Stored in IndexedDB, can't be read
  ["deriveKey"]
);


// ❌ NEVER: ECDH without authentication (MitM-vulnerable!)
// Pure ECDH key exchange with no signature verification
// → Attacker intercepts, substitutes their own public key
// → Attacker reads all messages!

// ✅ ALWAYS: Verify identity alongside key exchange
// Option 1: ECDSA signatures (this demo)
// Option 2: Pre-shared identity keys (Signal Protocol)
// Option 3: Certificate-based (PKI)


// ❌ NEVER: Verify signature of CIPHERTEXT (not plaintext)
const sig = await crypto.subtle.sign(..., senderPrivateKey, ciphertext);
// → Attacker can copy signature from one message to another!

// ✅ ALWAYS: Sign the plaintext (or a canonical hash)
const sig = await crypto.subtle.sign(..., senderPrivateKey, plaintext);
```

---

### Interview Q&A — E2EE Security

#### Q: ECDH và RSA key exchange có gì khác nhau?

```
RSA Key Exchange (older):
  Bob: generates RSA key pair
  Alice: fetches Bob's PUBLIC key (from server/certificate)
  Alice: encrypts AES session key with Bob's public RSA key
  Alice: sends encrypted session key to Bob
  Bob:  decrypts with his RSA private key → gets session AES key
  
  Problem: No forward secrecy!
    If Bob's private RSA key is compromised (later):
    → Attacker decrypts ALL historical encrypted session keys
    → Decrypts ALL historical messages!

ECDH Key Exchange (modern):
  Both generate EPHEMERAL key pairs (per session)
  Derive shared secret (Diffie-Hellman math)
  Session key NEVER transmitted — derived independently!
  
  Forward secrecy:
    Ephemeral private keys deleted after session
    → Compromising long-term key doesn't help attacker
    → Past sessions remain protected!

Why ECDH is preferred:
  - Shorter key (256-bit vs 2048-bit RSA) = same security
  - Faster key generation and derivation
  - Built-in forward secrecy (ephemeral mode)
  - Widely supported (TLS 1.3 defaults to ECDH)
```

#### Q: Tại sao AES-GCM thay vì AES-CBC?

```
AES-CBC:
  - Encryption only (confidentiality)
  - No integrity check!
  - Attacker can flip bits → change plaintext, no detection
  - Need separate HMAC for integrity → AES-CBC + HMAC
  - Vulnerable to padding oracle attacks if not implemented carefully

AES-GCM (Galois/Counter Mode):
  - Encryption + Authentication in ONE operation
  - Auth tag (16 bytes) appended to ciphertext
  - Any bit flip → auth tag mismatch → decryption fails!
  - "AEAD": Authenticated Encryption with Associated Data
  
  crypto.subtle.decrypt() throws DOMException on tampered data!
  → No need to separately verify integrity
  → Much harder to misuse than AES-CBC + HMAC

Modern standard: TLS 1.3, Signal, HTTPS all use AES-GCM
```

#### Q: IV reuse với AES-GCM — tại sao nguy hiểm?

```
AES-GCM is a "stream cipher" constructed from AES:
  Keystream = AES(key, IV || counter)
  Ciphertext = Plaintext XOR Keystream

If IV reused with same key:
  C1 = P1 XOR Keystream
  C2 = P2 XOR Keystream  (SAME keystream!)
  
  C1 XOR C2 = P1 XOR P2  ← Attacker XORs ciphertexts!
  → With enough known plaintext, attacker recovers both P1 and P2!
  → Authentication also broken (auth tag forgeable)

Prevention:
  1. crypto.getRandomValues(new Uint8Array(12)) per message (this demo)
  2. Deterministic counter (safe if never wraps, but tricky to manage)
  3. NIST recommends: Random 96-bit IV, never reuse same key after 2^32 messages

Rule: If you're encrypting > 4 billion messages with same key → rotate key!
```

#### Q: Làm thế nào implement "key verification" như Signal's safety numbers?

```
Problem: How does Alice know the public key she received IS from Bob?
(Not from an attacker doing MitM?)

Signal approach: "Safety Numbers" (out-of-band verification)
  1. Both parties' identity public keys are hashed together
  2. Result shown as a "safety number" (sequence of digits)
  3. Users VERBALLY compare safety numbers on a phone call
     If they match → no MitM! If different → attack detected!

Implementation:
  const aliceFingerprint = await crypto.subtle.digest("SHA-256",
    await crypto.subtle.exportKey("raw", aliceIdentityPublicKey)
  );
  const bobFingerprint = await crypto.subtle.digest("SHA-256",
    await crypto.subtle.exportKey("raw", bobIdentityPublicKey)
  );
  const safetyNumber = combineAndFormat([aliceFingerprint, bobFingerprint]);
  // → "1234 5678 9012 3456 7890 1234 5678 9012"

Alternative for web apps:
  - QR code scanning (scan each other's QR → verify key fingerprint)
  - Server-attested public key certificates (PKI)
  - TOFU (Trust On First Use) + anomaly detection
```


---

## Architecture Review: Message Sending Flow

> **Context:** "Analyzed and documented the legacy message sending flow (product and technical perspectives), and proposed a new architectural design." Demo: [`ArchitectureReviewDemo.tsx`](../packages/host/src/ArchitectureReviewDemo.tsx)

### Methodology: Analyzing a Legacy Flow

```
Architecture review process (3 steps):

STEP 1: Document Current State ("As-Is")
  Product perspective: What does the USER experience?
    → Walk through the user journey step by step
    → Note perceived latency at each step
    → Record abandon rates, error rates from analytics
    
  Technical perspective: What happens in code?
    → Trace call stack from user interaction to data persistence
    → Record actual latency per layer (Network tab + profiling)
    → Identify coupling, missing abstractions, single points of failure

STEP 2: Problem Catalog
  For each problem, document:
    → Severity (Critical/High/Medium/Low)
    → Category (UX / Reliability / Performance / Maintainability)
    → Current behavior (observable, measurable)
    → Business impact (quantified where possible)
    → Root cause (technical explanation)

STEP 3: Propose New Architecture ("To-Be")
  For each problem: propose targeted solution
  Group solutions into phases (incremental migration)
  Estimate risk per phase
  Define success metrics (measurable deliverables)
```

---

### Legacy Flow — Documented

```
Product Perspective (What user experiences):
  t=0ms:    User clicks Send
  t=0ms:    Button disabled — no feedback
  t=800ms:  [NETWORK] API call in progress (user frozen!)
  t=850ms:  [DB] Database write
  t=1250ms: [FCM] Push notification sent
  t=1290ms: Button re-enabled, message appears
  Total: ~1,290ms UI freeze

Technical Perspective (What code does):
  SendButton.onClick()
    ↓ validate() — [mixed into UI!]
    ↓ messageService.send() — [tight coupling]
      ↓ fetch('/api/messages') — [no timeout!]
        → PostgreSQL INSERT
        → FCM.send() — [synchronous! blocking!]
      ← 200 OK with full message data
    ← return message
  ↓ setState(messages: [...prev, newMsg]) — [after 1.3s!]
  ↓ <MessageList /> re-render — [full re-render, no virtual]
  ↓ Segment.track('message_sent') — [blocks main thread!]
```

---

### Problem Catalog (Summary)

```
P1 [CRITICAL / UX] 1.3s UI Freeze
  Legacy: fetch() awaited synchronously — UI frozen entire time
  Impact: 25% message abandonment on 3G (product analytics)
  Fix: Optimistic update (show instantly, sync in background)

P2 [CRITICAL / Reliability] FCM Failure = 100% Send Failure
  Legacy: Push notification called synchronously in API request
  Impact: FCM outages (~2x/year) cause 100% message failure
  Fix: Kafka queue — decouple notification from persistence

P3 [HIGH / Reliability] No Retry Logic
  Legacy: Network failure = message lost permanently
  Impact: ~3% message drop rate on mobile (network switching)
  Fix: CommandQueue with exponential backoff (3x, 1/2/4s)

P4 [HIGH / Maintainability] Business Logic in UI Components
  Legacy: Validate + format + fetch all in SendButton.onClick()
  Impact: 0% unit test coverage on business rules
  Fix: Pure functions + Command pattern (→ 90%+ testable)

P5 [MEDIUM / Performance] Full List Re-render
  Legacy: Every new message triggers full MessageList render
  Impact: 1000 messages → 300ms render, visible jank
  Fix: react-virtual + append-only (only new message renders)

P6 [MEDIUM / UX] Analytics Blocking Main Thread
  Legacy: Segment.track() called synchronously in send flow
  Impact: Segment slowness propagates to send UX
  Fix: Web Worker for analytics (zero main thread impact)
```

---

### New Architecture — Proposed Design

```
New flow (layered, event-driven):

UI Layer:
  SendButton.onClick()
    ↓ validate(text) — pure function (extracted, tested)
    ↓ messageStore.addOptimistic(message) — [user sees instantly!]
    ↓ eventBus.dispatch(SendMessageCommand) — [fire and forget!]

Service Layer (async, off UI thread):
  MessageCommandHandler:
    ↓ POST /api/messages (5s timeout + AbortController)
    ↓ On fail: retry with exponential backoff (1s, 2s, 4s)
    ↓ On success: messageStore.confirm(tempId, realId)
    ↓ On all-retry-fail: messageStore.markFailed(tempId) + toast

Infrastructure Layer (Backend):
  API Handler:
    ← 202 Accepted (fast! not waiting for notification)
    ↓ INSERT INTO messages
    ↓ Kafka.produce('notifications', { messageId })
    
  Kafka Consumer (Notification Worker):
    ↓ Picks up event (independently, async!)
    ↓ FCM.send() — FCM failure here doesn't affect message!
    ↓ DLQ (dead letter queue) for failed FCM

Analytics (Web Worker):
  Main thread: worker.postMessage({ type: 'track', event: 'message_sent' })
  Worker:       segment.track(...) — zero main thread impact!

Result:
  t=0ms:   User clicks Send
  t=2ms:   validate() runs
  t=7ms:   Message appears in chat (optimistic!) ← user sees it!
  t=9ms:   SendMessageCommand dispatched
  t=309ms: API confirms (async, user doesn't wait)
  t=319ms: tempId replaced with real server id (imperceptible)
  UI frozen: 0ms
```

---

### Architecture Principles Applied

```
1. OPTIMISTIC UI
   Show result before server confirms.
   State: pending → confirmed (or rollback on failure).
   Pattern: tempId system (UUID locally, server id on confirm)
   
2. COMMAND PATTERN
   UI dispatches SendMessageCommand (decoupled from service).
   CommandHandler owns: retry, timeout, error handling.
   UI doesn't know HOW sending works — only that it asked.

3. SEPARATION OF CONCERNS (layered architecture)
   UI Layer:        Render, user interaction → dispatches commands
   Service Layer:   Business logic, retry, state management
   Network Layer:   HTTP, timeout, serialization
   Infrastructure:  Database, message queue, external services

4. EVENT-DRIVEN DECOUPLING (Kafka)
   Message persistence ≠ Notification delivery
   API: persists fast (202 Accepted)
   Kafka consumer: delivers notification asynchronously
   FCM failure scope: notifications only, not messages

5. RETRY + CIRCUIT BREAKER
   Exponential backoff: 1s → 2s → 4s (3 attempts)
   Circuit breaker: after 5 consecutive failures → stop trying
   Pending queue survives page reload (IndexedDB)

6. OFF-MAIN-THREAD ANALYTICS
   Web Worker intercepts all analytics calls
   Main thread: fire-and-forget via postMessage
   Worker: queue → batch → send to Segment
```

---

### Migration Strategy (5 Phases)

```
Incremental migration: No big-bang rewrite.
Each phase deployable independently with feature flags.

PHASE 1 (Sprint 1): Extract & Test Business Logic
  Extract validate(), formatPayload() from UI components
  Write unit tests (target: 90% coverage)
  Risk: LOW — zero behavior change
  Deliverable: 90% business logic test coverage

PHASE 2 (Sprint 2): Optimistic Updates
  Add optimistic state update before API call
  Feature flag: ENABLE_OPTIMISTIC_SEND
  A/B test: 10% traffic first
  Risk: MEDIUM — visible UX change
  Deliverable: User sees message in 9ms (was 1,290ms)

PHASE 3 (Sprint 3): Command Queue + Retry
  MessageCommandHandler with exponential backoff
  5s timeout + AbortController
  IndexedDB persistence for pending messages
  Shadow mode first (dual send)
  Risk: MEDIUM — core flow change
  Deliverable: ~0% message drop rate (was ~3%)

PHASE 4 (Sprint 4-5): Kafka Decoupling [Backend + Frontend]
  Backend: Move FCM to Kafka consumer
  API returns 202 instead of 200 after persistence
  Frontend: Accept 202 as success
  Risk: HIGH — cross-team, backend change required
  Deliverable: FCM failure impact: 100% → 0%

PHASE 5 (Sprint 6): Analytics to Web Worker
  analytics.worker.ts: receives track events
  Main thread: postMessage only
  Risk: LOW — analytics failure always non-critical
  Deliverable: Main thread free of analytics overhead

Success Metrics (before/after):
  Message send latency (P50): 890ms → 9ms (optimistic)
  UI frozen per send:         1,290ms → 0ms
  FCM failure impact:         100% → 0%
  Message drop rate (mobile): 3% → ~0%
  Business logic test coverage: 0% → 90%+
  Send abandonment (3G):      25% → target 5%
```

---

### Interview Q&A — Architecture Review

#### Q: Bạn tiếp cận việc analyze một legacy system như thế nào?

```
Framework tôi áp dụng: "Document Before You Propose"

Bước 1: Lắng nghe sản phẩm trước khi code
  "What do users complain about?"
  → "Send is slow on bad connections" = product insight
  → Confirms: need to measure actual latency, not assume

Bước 2: Quan sát, đo đạc (không đọc code ngay!)
  → Chrome Network tab: record actual API latency distribution
  → Performance timeline: measure UI freeze duration
  → Sentry: quantify error rates, which failures are most common
  → Analytics: funnel drop-off at send step
  → Incident postmortems: historical failure patterns (FCM issue!)

Bước 3: Trace code theo data
  Now READ the code, but guided by measurements:
  "Why is send latency P95 = 2,400ms?" → trace the stack
  → Found: FCM call synchronous in API handler!
  → Found: Analytics blocking main thread!

Bước 4: Document per layer (product + technical)
  Product doc: User journey with actual timings
  Technical doc: Call graph with latency attribution
  → Both documents are evidence, not opinion

Bước 5: Problem catalog → Proposal
  Each problem: severity + impact + root cause + solution
  Each solution: risk level + implementation approach
  No "we need to rewrite everything" — targeted fixes
```

#### Q: Tại sao incremental migration thay vì rewrite?

```
"Big bang" rewrite risks:
  → Takes 3-6 months before ANY improvement ships
  → Risk accumulates: if it fails, nothing to show
  → Hard to estimate: every legacy system has surprises
  → Team morale: months of work before user impact

Strangler Fig (incremental) benefits:
  → Phase 1 ships in 2 weeks: already 90% test coverage
  → Phase 2 ships: user immediately sees message 9ms faster
  → Each phase is independently valuable
  → Rollback = feature flag flip, not a crisis
  → Risk is bounded per phase

Key insight: "Keep the old system running while building the new"
  Shadow mode: run both old + new flows, compare results
  Feature flags: ENABLE_OPTIMISTIC_SEND = true/false
  A/B testing: 10% traffic on new flow first
  → Data-driven rollout, not faith-based deployment
```


---

## Offline Data Processing + Client-Side Sticker Suggestion

> **Context:** "Optimized application experience: Improved offline data processing, developed client-side sticker suggestion mechanism." Demo: [`OfflineAndStickerDemo.tsx`](../packages/host/src/OfflineAndStickerDemo.tsx)

---

### Part 1 — Offline Data Processing (Outbox Pattern)

#### The Problem

```
Legacy approach (naive):
  User sends message → fetch('/api/messages') → FAIL (offline) → message lost!

Problems:
  1. No retry — network blip = permanent data loss
  2. Synchronous wait — UI blocked until network responds
  3. No persistence — close tab = lose unsent messages
  4. No ordering — reconnection sends in wrong order
```

#### The Outbox Pattern Solution

```
Step 1: Write to IndexedDB FIRST (always succeeds, even offline)
  const db = await openDB('chat-app', 1);
  await db.add('outbox', {
    id: crypto.randomUUID(),
    type: 'message',
    payload: { content, threadId },
    status: 'pending',
    createdAt: Date.now(),
    retryCount: 0,
  });

Step 2: Register Background Sync
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('sync-outbox');
  // Browser will fire SW 'sync' event when stable connectivity detected

Step 3: Service Worker flushes queue (FIFO order)
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-outbox') {
      event.waitUntil(flushOutbox());
    }
  });

  async function flushOutbox() {
    const db = await openDB('chat-app');
    const items = await db.getAllFromIndex('outbox', 'status', 'pending');
    // Sort by createdAt to preserve FIFO ordering
    items.sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      await syncItem(item);
    }
  }
```

#### Exponential Backoff Retry

```typescript
async function syncItem(item: OutboxItem): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(item.payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Success: remove from outbox
    await db.delete('outbox', item.id);

  } catch (err) {
    clearTimeout(timeoutId);
    const retryCount = item.retryCount + 1;

    if (retryCount >= 3) {
      // Mark as permanently failed — notify user
      await db.put('outbox', { ...item, status: 'failed', retryCount });
    } else {
      // Schedule retry with exponential backoff
      const backoffMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await db.put('outbox', {
        ...item,
        status: 'retrying',
        retryCount,
        nextRetryAt: Date.now() + backoffMs,
      });
    }
  }
}
```

#### Background Sync vs. Online Event Listener

```
Background Sync API (Service Worker):
  ✅ Works even when tab is CLOSED
  ✅ Browser manages retry timing and connectivity detection
  ✅ Survives app restart
  ⚠️  Chrome/Edge only (Chromium)
  
  navigator.serviceWorker.ready.then(reg => {
    reg.sync.register('sync-outbox');
  });

Online Event Listener (Main Thread fallback):
  ✅ Works in all browsers (Safari, Firefox)
  ⚠️  Only fires while tab is OPEN
  ⚠️  Must handle tab-closed scenario separately
  
  window.addEventListener('online', () => flushOutbox());
  
Best practice: Use BOTH
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // Background Sync (preferred)
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-outbox');
  } else {
    // Fallback: manual flush on reconnect
    window.addEventListener('online', flushOutbox);
  }
```

---

### Part 2 — Client-Side Sticker Suggestion Engine

#### Architecture

```
User types text
     ↓
[Debounce 150ms]              ← prevents work on every keystroke
     ↓
[Tokenize + Clean]            ← "I'm so tired today" → ["tired", "today"]
  toLowerCase()
  remove punctuation
  split by whitespace
  filter stopwords (length < 3, common words)
  deduplicate
     ↓
[Trie Prefix Lookup]          ← O(k) per token, k = token length
  for each token:
    trie.search(token)        ← returns Set<stickerId>
     ↓
[Multi-Signal Scoring]
  for each candidate sticker:
    score = 0
    + 10 per exact keyword match
    +  5 per prefix keyword match
    +  3 × number of tokens matched   (coverage bonus)
    +  2 × usageHistory[stickerId]    (personalisation)
    +  5 if stickerId in recentIds    (recency boost)
     ↓
[Sort by score DESC, take top 8]
     ↓
[Render suggestions]
```

#### Trie Data Structure

```typescript
class TrieNode {
  children = new Map<string, TrieNode>();
  stickerIds = new Set<string>();
}

class StickerTrie {
  private root = new TrieNode();

  /** O(word_length) insert */
  insert(word: string, stickerId: string) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      // Each intermediate node also tracks sticker IDs for prefix matching
      node.stickerIds.add(stickerId);
    }
  }

  /** O(prefix_length) search — returns all stickers matching prefix */
  search(prefix: string): Set<string> {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return new Set();
      node = node.children.get(char)!;
    }
    return node.stickerIds;
  }
}

// Building the trie: O(total_chars_in_all_keywords)
// 30 stickers × ~10 keywords × ~6 chars avg = ~1800 operations
// Built ONCE at startup, reused for every query

// Example query "tired":
//   t → i → r → e → d → {😴 sleep sticker}
//   Each level also matches: 't' → {all stickers with keywords starting with 't'}
```

#### Personalisation — Learning from User Behaviour

```typescript
// In-memory history (persisted to localStorage in production)
const usageHistory = new Map<string, number>();
const recentIds = new Set<string>();

function onStickerSelected(stickerId: string) {
  // Increment usage count (affects future scoring)
  usageHistory.set(
    stickerId,
    (usageHistory.get(stickerId) ?? 0) + 1
  );
  
  // Update recency window (last 5 used)
  recentIds.delete(stickerId);
  recentIds.add(stickerId);     // Set preserves insertion order
  if (recentIds.size > 5) {
    // Remove oldest entry
    const [first] = recentIds;
    recentIds.delete(first);
  }
}

// Scoring with personalisation:
// After user selects 😴 3 times:
//   Type "tired" → sleep sticker score = 10 (match) + 3 (coverage) + 6 (history 3×2) + 5 (recent) = 24
//   vs new user: score = 10 + 3 = 13 only
// → Personalised user sees 😴 ranked much higher!
```

---

### Interview Q&A

#### Q: Tại sao dùng IndexedDB thay vì localStorage cho offline queue?

```
localStorage:
  ✅ Simple API (synchronous)
  ❌ 5MB limit — easily exceeded by message queue
  ❌ Synchronous — blocks main thread on large reads
  ❌ String only — must JSON.stringify/parse
  ❌ No transactions — race conditions in concurrent writes
  ❌ Not accessible from Service Workers!

IndexedDB:
  ✅ Async (Promise-based with idb wrapper)
  ✅ Hundreds of MB storage
  ✅ Structured data (any JS object)
  ✅ Transactions — safe concurrent access
  ✅ Accessible from Service Workers!
  ✅ Indexes — fast queries (e.g., all items with status='pending')
  ❌ More complex API (mitigated with idb library)

For offline queue specifically:
  MUST use IndexedDB because Background Sync runs in Service Worker
  which cannot access localStorage (different thread context)
```

#### Q: Tại sao client-side sticker suggestion thay vì server-side?

```
Server-side (traditional):
  User types "tired" → fetch('/api/stickers?q=tired') → wait 100-400ms → results
  
  Problems:
    → Latency: network round-trip feels sluggish
    → Offline: fails completely without connectivity
    → Privacy: every keystroke sent to server
    → Cost: API calls for every user keystroke at scale
    → Throttling: need rate limiting to prevent abuse

Client-side (this implementation):
  User types "tired" → trie.search("tired") → 0.3ms → results
  
  Benefits:
    → Instant (<1ms): no network latency
    → Offline: works without connectivity
    → Private: typing stays on device
    → Free: zero server compute
    → Personalised: history stored locally, no privacy concern
    
When to use server-side instead:
  → Multilingual NLP (language detection, translation)
  → Large vocabulary (>100K stickers — too heavy to download)
  → Trending stickers (real-time popularity requires server data)
  → AI suggestions (GPT-level understanding requires server GPU)
```

#### Q: Làm thế nào tránh stale suggestions khi vocabulary thay đổi?

```
Versioned vocabulary:
  1. Embed version in vocabulary bundle: { version: "2024-01-15", stickers: [...] }
  2. Cache with Service Worker using cache versioning:
     cache.put('/stickers-v20240115.json', response)
  3. Background update check on app start:
     const { version } = await fetch('/api/stickers/version');
     if (version !== localVersion) await updateVocabulary(version);
  4. Trie rebuilt when vocabulary updates (async, non-blocking)

IndexedDB for persistence:
  Store vocabulary in IndexedDB → survive page refresh
  Only re-download when version changes → efficient
```


---

## Accessible Time-Off Request Calendar

> **Context:** "Built a responsive calendar for requesting time off with custom focus management and screen reader support in React." Demo: [`AccessibleCalendarDemo.tsx`](../packages/host/src/AccessibleCalendarDemo.tsx)

---

### Architecture Overview

```
AccessibleCalendarDemo
├── LiveRegion          – visually hidden aria-live="polite" announcement zone
├── Calendar Grid       – role="grid" with roving tabIndex focus management
│   ├── Column Headers  – role="columnheader" + <abbr> for full day names
│   └── Week Rows       – role="row" > role="gridcell" per day
│       └── DateCell    – tabIndex roving, aria-label, aria-selected, aria-disabled
└── ConfirmModal        – role="dialog" aria-modal + focus trap + focus restoration
```

---

### Part 1 — Roving tabIndex (Custom Focus Management)

#### The Problem with naive implementations

```tsx
// ❌ WRONG: Every day is a tab stop — user must Tab 42 times to exit the calendar!
{days.map(d => <button tabIndex={0}>{d.getDate()}</button>)}

// ❌ WRONG: No tab stop at all — keyboard users can't enter the calendar
{days.map(d => <div onClick={...}>{d.getDate()}</div>)}

// ✅ CORRECT: Roving tabIndex — exactly ONE cell is in the tab order at any time
```

#### Roving tabIndex implementation

```tsx
const [focusedDate, setFocusedDate] = useState<Date>(today);
const gridRef = useRef<HTMLDivElement>(null);

// Cell: only the focused date is tabbable
<div
  role="gridcell"
  id={cellId(date)}                              // "cal-day-2025-06-12"
  tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
  onFocus={() => setFocusedDate(date)}           // sync when Tab brings focus in
  onKeyDown={e => handleKeyDown(e, date)}
/>

// Move focus after keyboard navigation
function moveFocus(next: Date) {
  setFocusedDate(next);

  // Must use requestAnimationFrame if next date is in a new month
  // (React needs to render the new cells first)
  requestAnimationFrame(() => {
    const id = `cal-day-${toDateKey(next)}`;
    gridRef.current?.querySelector(`#${id}`)?.focus();
  });
}
```

#### Why requestAnimationFrame?

```
Without rAF:
  1. User presses PageDown (next month)
  2. setViewDate() called → schedules React re-render
  3. focus() called immediately → new month's cells don't exist yet → silently fails!

With rAF:
  1. User presses PageDown
  2. setViewDate() → schedules React re-render
  3. requestAnimationFrame callback runs AFTER React commits to DOM
  4. New cells now exist → focus() works correctly ✅
```

---

### Part 2 — WAI-ARIA Grid Semantics

#### Required role hierarchy

```tsx
<div
  role="grid"
  aria-label="Time-off calendar, June 2025"
  aria-describedby="cal-instructions"     // links to keyboard hint paragraph
  aria-multiselectable="false"
>
  {/* Column headers */}
  <div role="row">
    <div role="columnheader" aria-label="Sunday">
      <abbr title="Sunday">Sun</abbr>      {/* Screen reader: "Sunday", sighted: "Sun" */}
    </div>
    {/* ... Mon-Sat */}
  </div>

  {/* Week rows */}
  {weeks.map(week => (
    <div role="row">
      {week.map(date => (
        <div
          role="gridcell"
          id="cal-day-2025-06-12"
          aria-label="Monday, June 12, 2025, today, available"
          aria-selected={isSelected}        // true when in selected range
          aria-disabled={isDisabled}        // true for past/weekend/holiday
          tabIndex={isFocused ? 0 : -1}
        />
      ))}
    </div>
  ))}
</div>
```

#### aria-label builder — full context

```typescript
function buildAriaLabel(info: DateInfo): string {
  const parts = [
    `${DAYS_LONG[info.date.getDay()]}, ${MONTHS[info.date.getMonth()]} ${info.date.getDate()}, ${info.date.getFullYear()}`
  ];

  if (info.isToday)       parts.push("today");
  if (info.isPast)        parts.push("past date, not available");
  else if (info.isBlocked) parts.push("company holiday, not available");
  else if (info.isWeekend) parts.push("weekend, not available");
  else                    parts.push("available");

  if (info.isRangeStart)  parts.push("start of selection");
  if (info.isRangeEnd)    parts.push("end of selection");
  else if (info.isInRange) parts.push("in selected range");

  return parts.join(", ");
  // "Monday, June 12, 2025, today, available, start of selection"
}
```

---

### Part 3 — Screen Reader Announcements (aria-live)

#### Why you can't rely on focus alone

```
Problem: When user presses PageDown to go to next month:
  - DOM focus moves to e.g. "July 12, 2025"
  - Screen reader announces: "July 12, 2025, available"
  - User doesn't know if they navigated forward or backward!
  
Better: Announce the month transition explicitly:
  - "Navigated to July 2025" (from LiveRegion)
  - Then: "July 12, 2025, available" (from focus)
```

#### LiveRegion component — the pattern

```tsx
// Mounted once, always visible to AT, invisible to sighted users
function LiveRegion({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"    // read after current speech completes (non-interrupting)
      aria-atomic="true"    // read the ENTIRE message, not just the changed part
      style={{
        // Visually hidden but NOT display:none (AT ignores display:none)
        position: "absolute",
        width: 1, height: 1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

// Trigger:
setAnnouncement("July 2025");                                     // month nav
setAnnouncement("June 12 selected as start. Now select end date."); // step 1
setAnnouncement("Range: June 12 to June 16, 5 days");            // step 2 complete
setAnnouncement("June 15 is not available");                      // invalid selection
setAnnouncement("Time-off request submitted successfully");        // confirmation
```

#### aria-live values — when to use each

```
aria-live="polite"   → waits for current speech to finish (default choice)
aria-live="assertive"→ interrupts current speech immediately (errors/alerts only)
aria-live="off"      → never announces (use to pause a region)

role="status"  → polite (equivalent to aria-live="polite")
role="alert"   → assertive (equivalent to aria-live="assertive")
role="log"     → polite, additive (chat logs, news feeds)
role="timer"   → live region for countdowns
```

---

### Part 4 — Modal Focus Trap

```tsx
function ConfirmModal({ onCancel, triggerRef }) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Step 1: Move focus INTO modal on open
  useEffect(() => {
    firstFocusableRef.current?.focus();
  }, []);

  // Step 2: Restore focus BACK to trigger on close (cleanup = runs on unmount)
  useEffect(() => {
    return () => {
      (triggerRef.current as HTMLElement | null)?.focus();
    };
  }, [triggerRef]);

  // Step 3: Trap Tab within the modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") { onCancel(); return; }
    if (e.key !== "Tab") return;

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable![0];
    const last  = focusable![focusable!.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();          // wrap: Shift+Tab from first → go to last
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();         // wrap: Tab from last → go to first
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"                    // tells AT: background is inert
      aria-labelledby="modal-title"        // announces title on open
      aria-describedby="modal-desc"        // announces description on open
      onKeyDown={handleKeyDown}
      ref={modalRef}
    />
  );
}
```

---

### Part 5 — Keyboard Navigation (WAI-ARIA Date Picker Pattern)

```
Key             Action
──────────────────────────────────────────────────────
←  →            Previous / next day
↑  ↓            Previous / next week (7 days)
Page Up         Previous month (focus stays on same day-of-month if valid)
Page Down       Next month
Ctrl+Page Up    Previous year
Ctrl+Page Down  Next year
Home            First day of current week (Sunday)
End             Last day of current week (Saturday)
Ctrl+Home       First day of current month
Ctrl+End        Last day of current month
Enter / Space   Select / activate focused date
Escape          Cancel current range selection
```

---

### Interview Q&A

#### Q: Roving tabIndex vs aria-activedescendant — khi nào dùng cái nào?

```
Roving tabIndex:
  - DOM focus MOVES to each element
  - Browser scroll-into-view works automatically
  - More robust across screen readers (NVDA, JAWS, VoiceOver)
  - Preferred for calendars, tree views, toolbars
  
aria-activedescendant:
  - DOM focus stays on CONTAINER
  - Container's aria-activedescendant points to the active child's ID
  - Required when children are dynamically rendered (virtual list, combobox dropdown)
  - More complex: must manually ensure active child is visible

For calendar: use ROVING TABINDEX ✅
For combobox listbox: aria-activedescendant may be better
```

#### Q: Tại sao dùng visibility:hidden/clip thay vì display:none cho LiveRegion?

```
display: none     → Element removed from accessibility tree → AT cannot see it at all
visibility: hidden→ Also hidden from AT
opacity: 0        → Visible to AT, but might be clickable

Correct visually-hidden technique:
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  
→ Sighted users: invisible (1px, off-screen)
→ Screen readers: visible and announces changes
→ Not focusable (no tabIndex)
```

#### Q: Làm thế nào test accessibility mà không có real screen reader?

```
1. axe DevTools (Chrome extension) — catches 57% of WCAG violations automatically
2. Keyboard-only navigation — unplug mouse, navigate entire UI with keyboard only
3. Chrome Accessibility Tree — DevTools → Accessibility panel → view ARIA tree
4. Windows Narrator (free) or NVDA (free) — test with real AT
5. VoiceOver on macOS: Cmd+F5 to toggle, VO+U for rotor menu
6. Automated: jest-axe library
   const { container } = render(<Calendar />);
   const results = await axe(container);
   expect(results).toHaveNoViolations();
```


---

## Skip Navigation Links — Workday HCM

> **Context:** "Built a hidden skip link accessible via keyboard throughout the Workday HCM application." Demo: [`SkipLinkDemo.tsx`](../packages/host/src/SkipLinkDemo.tsx)

---

### What & Why

Workday HCM has a dense persistent header — logo, 12+ top-level nav items, search, and breadcrumbs — that repeats on **every page**. Without a skip link, a keyboard user presses **Tab 20+ times** per page load just to reach the employee record or form they need to interact with.

A **Skip Navigation Link** is a visually hidden `<a>` anchor that:
1. **Appears only when focused** (via keyboard Tab)
2. **Jumps focus** directly to a target landmark when activated (Enter/Space)
3. Satisfies **WCAG 2.1 SC 2.4.1 Bypass Blocks (Level A)** — a legal minimum requirement

---

### Architecture

```
<body>
  ← skip links FIRST (before header) — first in DOM = first in Tab order
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <a class="skip-link" href="#search">Skip to search</a>
  <a class="skip-link" href="#primary-nav">Skip to navigation</a>

  <header>...</header>
  <nav id="primary-nav" tabIndex={-1}>...</nav>   ← skip target

  <main
    id="main-content"
    tabIndex={-1}         ← enables programmatic focus()
    style="outline:none"  ← suppress focus ring (set by JS, not user Tab)
  >
    ...content...
  </main>
</body>
```

---

### Part 1 — The Visually-Hidden CSS Pattern

```css
/* Removed from visual layout, but PRESENT in the accessibility tree */
.skip-link {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);   /* clips visual output to nothing */
  white-space: nowrap;
  border-width: 0;
}

/* When focused via Tab: slide into viewport */
.skip-link:focus {
  position: fixed;           /* always visible regardless of scroll position */
  top: 16px;
  left: 16px;
  z-index: 9999;             /* above all overlays and sticky headers */
  width: auto;
  height: auto;
  clip: auto;                /* remove the zero-clip */
  overflow: visible;
  padding: 12px 20px;
  background: #1e1b4b;
  color: #fff;
  font-weight: bold;
  border-radius: 8px;
  outline: 3px solid #fbbf24; /* 7:1 contrast ratio — WCAG AA+ */
}
```

#### Why NOT display:none or visibility:hidden

```
display: none       → Removes from accessibility tree → AT cannot find/announce it
visibility: hidden  → Also removes from AT → same problem
opacity: 0          → In AT + tab order, but still clickable → confusing
position offscreen  → position:absolute; left:-9999px — old pattern, works but layout can shift

✅ The clip + 1px technique is the modern standard (Bootstrap, NVDA, a11y.css all use it)
```

---

### Part 2 — React Implementation

```tsx
function SkipLink({ href, label }: { href: string; label: string }) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector<HTMLElement>(href);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={isFocused ? revealedStyle : hiddenStyle}
    >
      ⤵ {label}
    </a>
  );
}

// Placed FIRST in the app tree, before <Header>:
function App() {
  return (
    <>
      <SkipLink href="#main-content" label="Skip to main content" />
      <SkipLink href="#search"       label="Skip to search" />
      <SkipLink href="#primary-nav"  label="Skip to navigation" />
      <Header />
      <Nav />
      <main id="main-content" tabIndex={-1} style={{ outline: "none" }}>
        {/* page content */}
      </main>
    </>
  );
}
```

---

### Part 3 — The tabIndex={-1} Target Requirement

```tsx
// ❌ BUG — most common mistake:
<main id="main-content">
  {/* tabIndex missing */}
</main>

// What happens:
// 1. User presses Tab → "Skip to main content" link appears ✓
// 2. User presses Enter → click handler calls mainRef.current.focus() ✓
// 3. focus() SILENTLY FAILS — <main> cannot receive programmatic focus ✗
// 4. User cursor stays on the skip link — nothing changes

// ✅ FIX:
<main
  id="main-content"
  tabIndex={-1}
  // -1 meaning:
  //   • CAN receive focus via JavaScript's .focus() call
  //   • CANNOT be reached by the user pressing Tab
  //   → Invisible to Tab, but reachable by skip link activation
  style={{ outline: "none" }} // suppress focus ring (this focus is intentional/programmatic)
>
```

#### tabIndex value cheat sheet

```
tabIndex=0   → In natural tab order (follows DOM position)
tabIndex=-1  → NOT in tab order, but .focus() works (used for skip targets, modals, drawers)
tabIndex=1+  → Explicit order — AVOID: creates non-linear, confusing tab flows
```

---

### Part 4 — Multiple Skip Links (Workday HCM Pattern)

```tsx
// Workday HCM has 3 skip links for the most common keyboard journeys:

const SKIP_TARGETS = [
  // 1. Most important — used by 95% of keyboard users
  { href: "#main-content", label: "Skip to main content" },

  // 2. Workday search is the primary way to find employee records
  { href: "#search-input", label: "Skip to search" },

  // 3. When already in content, allows efficient return to nav
  { href: "#primary-nav",  label: "Skip to navigation" },
];

// Each appears as the user Tab-presses:
// Tab ×1 → "Skip to main content" revealed
// Tab ×2 → "Skip to search" revealed
// Tab ×3 → "Skip to navigation" revealed
// Tab ×4 → First real nav item (logo link) — only NOW does real nav begin

// Why this order?
//   Most keyboard users want to skip PAST nav → "main content" first
//   Power users who want search → second Tab
//   Users who intentionally want to navigate → press Tab more, use normal nav
```

---

### Part 5 — Testing

#### Keyboard manual test

```
1. Open page
2. Press Tab once
   ✓ "Skip to main content" button appears at top-left with visible focus ring
   ✗ If nothing appears: skip link missing or not first in DOM

3. Press Enter
   ✓ Focus jumps to <main> (may briefly show outline)
   ✓ Screen reader announces: "main landmark" or "region, Employee Records"
   ✗ If nothing moves: target missing tabIndex={-1}

4. Press Tab after skipping
   ✓ First interactive element inside <main> receives focus
   ✗ Should NOT return to header/nav

5. Verify with screen reader (VoiceOver on macOS):
   • Cmd+F5 to toggle VoiceOver
   • Tab → VoiceOver says "Skip to main content, link"
   • Enter → "main landmark"
```

#### Automated — jest-axe

```tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("satisfies WCAG 2.4.1 Bypass Blocks", async () => {
  const { container } = render(<WorkdayApp />);
  const results = await axe(container, {
    rules: {
      "bypass": { enabled: true },  // SC 2.4.1
      "region": { enabled: true },  // SC 1.3.6 — landmark regions
    }
  });
  expect(results).toHaveNoViolations();
});
```

---

### Before / After — Impact Measurement

| Metric | Before (no skip link) | After (3 skip links) |
|---|---|---|
| Tab presses to reach employee table | **22** | **2** |
| Tab presses to reach search | 14 | 2 |
| WCAG 2.4.1 compliance | ❌ Fail | ✅ Pass |
| Audit severity | Critical (Level A) | Resolved |
| ADA / Section 508 exposure | High | None |

---

### Interview Q&A

#### Q: Tại sao skip link phải là element đầu tiên trong DOM?

```
Tab key traverses the DOM in source order.
If skip link is placed after <nav>, the user must Tab through all nav items
to reach the skip link — defeating its entire purpose.

Rule: Skip links must be the VERY FIRST children of <body>.
In React: first child rendered by the root App component, before <Header>.
```

#### Q: Sự khác biệt giữa tabIndex=0, tabIndex=-1, và tabIndex=1?

```
tabIndex=0:   In natural tab order at its DOM position (default for buttons/links)
tabIndex=-1:  Removed from tab order, but focusable via JavaScript .focus()
              Used for: skip link targets, modal containers, carousel slides
tabIndex=1+:  Overrides natural order (AVOID — creates non-linear, confusing UX)
              The only valid use: legacy apps where DOM order cannot be changed
```

#### Q: Có cần skip link nếu đã dùng ARIA landmarks không?

```
YES — they serve different purposes:

ARIA landmarks (role="main", role="navigation"):
  → Screen readers: Rotor/landmark navigation (Cmd+F5 on VoiceOver)
  → Allows jumping between landmarks via special SR keyboard commands
  → Does NOT help keyboard-only users (no screen reader) bypass nav via Tab

Skip links:
  → Works for ALL keyboard users, with OR without screen reader
  → Specifically addresses the Tab-count problem
  → WCAG 2.4.1 allows either "skip links OR landmark structure" but:
    → Screen readers have landmarks; keyboard-only users only have skip links
    → Best practice: implement BOTH
```


---

## Accessible Column Configurator Dropdown

> **Context:** "Built an accessible dropdown menu for configuring table column order, visibility, and freeze state." Demo: [`ColumnConfigDemo.tsx`](../packages/host/src/ColumnConfigDemo.tsx)

---

### Architecture

```
[⊞ Columns ▼ button]          ← Disclosure trigger
  aria-expanded={isOpen}
  aria-haspopup="dialog"
  aria-controls="col-config-panel"
        │ click / Enter
        ▼
┌─────────────────────────────┐  role="dialog"
│ Configure Columns           │  aria-labelledby={titleId}
│ 6 of 8 visible · 2 frozen   │  aria-modal="false"
├─────────────────────────────┤
│ role="list"                 │  aria-label="Columns — use arrow keys to reorder"
│  ┌─ role="listitem" ──────┐ │  aria-label="Employee ID, position 1 of 8, pinned"
│  │ ☑ Employee ID    📌 ▲▼ │ │
│  │ ☑ Name           📌 ▲▼ │ │
│  │ ☑ Department        ▲▼ │ │
│  │ □ Salary  (hidden)  ▲▼ │ │
│  └────────────────────────┘ │
├─────────────────────────────┤
│ [Reset defaults]  [Show all] │
└─────────────────────────────┘
        │ Escape
        ▼
Focus restored to trigger button
```

---

### Part 1 — Disclosure Trigger Button

```tsx
// ❌ WRONG — div is not keyboard accessible, no ARIA semantics
<div onClick={toggle}>Columns ▼</div>

// ✅ CORRECT — native button with full disclosure pattern
<button
  ref={triggerRef}
  onClick={() => setPanelOpen(o => !o)}
  aria-expanded={panelOpen}          // "expanded" / "collapsed"
  aria-haspopup="dialog"             // hint: a dialog will open (not a menu)
  aria-controls="col-config-panel"   // programmatic link to panel ID
>
  ⊞ Columns {panelOpen ? "▲" : "▼"}
</button>

// aria-haspopup values:
//  "true" / "menu"   → arrow key navigated menu (WAI-ARIA Menu pattern)
//  "listbox"         → select-like dropdown
//  "dialog"          → configuration panel (Tab-navigated, Escape closes)
//  "grid"            → grid popup
//  "tree"            → tree view popup
```

---

### Part 2 — Panel Focus Management

```tsx
const titleId      = useId();  // unique per React instance — no collision risk
const firstCtrlRef = useRef<HTMLInputElement>(null);

// Step 1: Move focus INTO panel on open
useEffect(() => {
  firstCtrlRef.current?.focus(); // first column's visibility checkbox
}, []);

// Step 2: Restore focus BACK to trigger on close
useEffect(() => {
  return () => { triggerRef.current?.focus(); }; // cleanup = unmount
}, [triggerRef]);

// Step 3: Escape key closes
const handlePanelKeyDown = (e) => {
  if (e.key === "Escape") onClose();
};

<div
  id="col-config-panel"
  role="dialog"
  aria-labelledby={titleId}   // SR: "Configure Columns dialog" on entry
  aria-modal="false"          // click outside = close (no background inert)
  onKeyDown={handlePanelKeyDown}
>
  <h2 id={titleId}>Configure Columns</h2>
  <input ref={firstCtrlRef} type="checkbox" ... /> {/* auto-focused on open */}
</div>
```

---

### Part 3 — Keyboard Column Reordering

```tsx
// Swap .order values between the moved column and its neighbour
const move = (id: string, dir: -1 | 1) => {
  const col      = columns.find(c => c.id === id)!;
  const target   = col.order + dir;
  if (target < 0 || target >= columns.length) return; // boundary guard

  const displaced = columns.find(c => c.order === target)!;

  const next = columns.map(c => {
    if (c.id === id)           return { ...c, order: target };
    if (c.id === displaced.id) return { ...c, order: col.order };
    return c;
  });
  onChange(next);

  // Announce new position to screen reader
  announce(`${col.label} moved to position ${target + 1} of ${columns.length}`);

  // Re-focus after React re-renders the list in its new order
  requestAnimationFrame(() => {
    panelRef.current
      ?.querySelector(`[data-col-move="${id}"]`)
      ?.focus();
  });
};

// Arrow key listener on the row container
<div
  role="listitem"
  aria-label={`${col.label}, position ${idx + 1} of ${total}`}
  onKeyDown={e => {
    if (e.key === "ArrowUp")   { e.preventDefault(); move(col.id, -1); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(col.id,  1); }
  }}
>
  {/* Move buttons also exist for mouse/pointer users */}
  <button
    data-col-move={col.id}       // selector target for rAF refocus
    aria-label={`Move ${col.label} up`}   // NOT just "▲" — SR reads "black triangle"
    onClick={() => move(col.id, -1)}
  >▲</button>
  <button
    aria-label={`Move ${col.label} down`}
    onClick={() => move(col.id, 1)}
  >▼</button>
</div>
```

---

### Part 4 — Freeze Toggle (aria-pressed)

```tsx
// aria-pressed = toggle button state
// true  → SR: "Pin Employee ID to left, pressed"
// false → SR: "Pin Name to left, not pressed"

<button
  aria-pressed={col.frozen}
  aria-label={`${col.frozen ? "Unpin" : "Pin"} ${col.label} to left`}
  disabled={!col.visible}      // cannot freeze a hidden column
  onClick={() => toggleFreeze(col.id)}
>
  📌
</button>

// Sticky CSS for frozen columns:
// Calculated per column: left = sum(widths of all frozen columns to the left)
const stickyLeft = frozenCols
  .slice(0, frozenCols.indexOf(col))
  .reduce((sum, c) => sum + c.width, 0);

<td style={{
  position: "sticky",
  left: stickyLeft,
  zIndex: 1,          // above scrolling cells
  background: "#0f172a", // opaque — must not be transparent (shows through)
}} />
```

---

### Part 5 — Data Table ARIA

```tsx
<table
  role="grid"                           // interactive table (sortable, focusable cells)
  aria-label="Employee records"
  aria-colcount={visibleCols.length}    // total visible columns
  aria-rowcount={employees.length + 1}  // +1 for header row
>
  <thead>
    <tr role="row">
      <th
        role="columnheader"
        aria-colindex={1}               // 1-based
        aria-sort={
          sortCol === "id" && sortDir === "asc"  ? "ascending"  :
          sortCol === "id" && sortDir === "desc" ? "descending" :
          col.sortable                            ? "none"       :
          undefined                               /* not sortable — omit */
        }
      >
        Employee ID ▲
      </th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-rowindex={2}> {/* 2 = header is row 1 */}
      <td role="gridcell" aria-colindex={1}>EMP-001</td>
    </tr>
  </tbody>
</table>
```

---

### Interview Q&A

#### Q: Khác biệt giữa role="menu" và role="dialog" cho dropdown?

```
role="menu":
  → Keyboard: Arrow keys navigate items, Tab exits the menu
  → Items: role="menuitem", role="menuitemcheckbox", role="menuitemradio"
  → Screen reader: "menu" announced on open, each item read on arrow navigation
  → Use for: action lists, context menus, nav dropdowns
  → Do NOT use for: configuration panels with mixed controls (checkboxes + buttons)

role="dialog":
  → Keyboard: Tab/Shift+Tab cycle through all controls
  → No arrow key navigation (user uses Tab freely)
  → Screen reader: "dialog" announced, title read on entry
  → Use for: settings panels, confirmation dialogs, forms
  → The column config panel: mixed controls (checkboxes, buttons, arrow reorder)
    → role="dialog" is correct ✅

aria-haspopup="menu"   → triggers a keyboard-navigated menu
aria-haspopup="dialog" → triggers a Tab-navigated configuration panel
```

#### Q: Tại sao phải dùng useId() thay vì hardcode id?

```typescript
// ❌ WRONG — hardcoded ID collides if component is rendered twice
<div id="col-config-panel">...</div>
<div aria-labelledby="col-config-panel">...</div>

// ✅ CORRECT — useId generates unique ID per component instance
const titleId = useId(); // e.g., ":r3:" — React 18+

// Works correctly even with:
// - Multiple instances of the same component
// - Server-side rendering (consistent between server and client)
// - Strict Mode double-renders
<h2 id={titleId}>Configure Columns</h2>
<div aria-labelledby={titleId}>...</div>
```

#### Q: Sao không dùng HTML5 drag-and-drop API cho reordering?

```
HTML5 drag-and-drop:
  ❌ Not accessible — cannot be operated by keyboard only
  ❌ No native ARIA support — screen readers can't announce drag position
  ❌ Mobile: varies by browser (often requires long-press)
  ❌ Requires significant additional a11y implementation

Keyboard reorder pattern (used here):
  ✅ Arrow Up/Down — universally understood
  ✅ Works on all devices and input methods
  ✅ aria-live announces position after each move
  ✅ No additional a11y overlay required
  ✅ Satisfies WCAG 2.1 SC 2.1.1 (Keyboard), 2.4.3 (Focus Order)

For drag-and-drop WITH accessibility:
  → Use a library like @dnd-kit/core which provides keyboard handlers
  → Add role="button" + aria-grabbed + aria-dropeffect
  → Provide an explicit "Move up / Move down" fallback for keyboard users
```


---

## Workday Org Chart — Complete Rebuild

> **Context:** "Building a complete redo of the Workday's org chart for visualizing organization hierarchy and team structures using React, Redux Toolkit (with RTK Query), and React Spring." Demo: [`OrgChartDemo.tsx`](../packages/host/src/OrgChartDemo.tsx)

---

### Stack

| Concern | Library | Pattern used |
|---|---|---|
| **State management** | Redux Toolkit | `createSlice`, `createEntityAdapter`, Immer mutations |
| **Data fetching** | RTK Query | `createApi`, `builder.query`, optimistic updates |
| **Animations** | React Spring | `useSpring`, `useTransition`, spring physics equations |
| **Accessibility** | WAI-ARIA | `role="tree"`, `role="treeitem"`, `aria-expanded` |

---

### Part 1 — Redux Toolkit: createSlice

```typescript
// orgChartSlice.ts

const nodesAdapter = createEntityAdapter<OrgNode>();  // normalized map

interface OrgChartState {
  nodes: ReturnType<typeof nodesAdapter.getInitialState>;
  expanded: string[];      // NOTE: Set → Array (Redux requires serializable state)
  selectedId: string | null;
  searchQuery: string;
}

export const orgChartSlice = createSlice({
  name: "orgChart",
  initialState: { nodes: nodesAdapter.getInitialState(), expanded: [], selectedId: null, searchQuery: "" },
  reducers: {
    toggleNode: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const idx = state.expanded.indexOf(id);
      if (idx >= 0) {
        // Collapse — remove node + all descendants
        const descendants = getAllDescendants(id, state.nodes.entities);
        state.expanded = state.expanded.filter(e => e !== id && !descendants.includes(e));
      } else {
        state.expanded.push(id);   // Immer allows direct mutation ✅
      }
    },
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Auto-populate normalized entity map when RTK Query fetch completes
    builder.addMatcher(
      orgChartApi.endpoints.getOrgChart.matchFulfilled,
      (state, action) => nodesAdapter.setAll(state.nodes, action.payload)
    );
  },
});
```

#### Why createEntityAdapter?

```
Without adapter:    OrgNode[]              → O(n) lookup by ID
With adapter:       { ids: string[], entities: Record<string, OrgNode> }
                                           → O(1) lookup: entities[nodeId]

Auto-generated selectors:
  const selectors = nodesAdapter.getSelectors(
    (state: RootState) => state.orgChart.nodes
  );
  selectors.selectAll(state)        → OrgNode[]
  selectors.selectById(state, id)   → OrgNode | undefined
  selectors.selectIds(state)        → string[]
```

---

### Part 2 — RTK Query

```typescript
// orgChartApi.ts

export const orgChartApi = createApi({
  reducerPath: "orgChartApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1/" }),
  tagTypes: ["OrgNode"],

  endpoints: (builder) => ({

    // 1. Fetch full org tree
    getOrgChart: builder.query<OrgNode[], void>({
      query: () => "org-chart",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "OrgNode" as const, id })), "OrgNode"]
          : ["OrgNode"],

      // Transform flat array → enriched with headcount
      transformResponse: (raw: OrgNode[]) => {
        const childMap = buildChildMap(raw);
        return raw.map(n => ({
          ...n,
          directReports: childMap.get(n.id)?.length ?? 0,
          totalHeadcount: getTotalHeadcount(n.id, childMap),
        }));
      },
    }),

    // 2. Optimistic update — reorg reporting line
    updateParent: builder.mutation<void, { nodeId: string; newParentId: string }>({
      query: ({ nodeId, newParentId }) => ({
        url: `org-chart/${nodeId}/parent`,
        method: "PATCH",
        body: { parentId: newParentId },
      }),
      async onQueryStarted({ nodeId, newParentId }, { dispatch, queryFulfilled }) {
        // Optimistically update cache BEFORE server responds
        const patch = dispatch(
          orgChartApi.util.updateQueryData("getOrgChart", undefined, (draft) => {
            const node = draft.find(n => n.id === nodeId);
            if (node) node.parentId = newParentId;
          })
        );
        try {
          await queryFulfilled;  // Wait for server
        } catch {
          patch.undo();          // Rollback on error
        }
      },
    }),
  }),
});

// Auto-generated hooks:
const { data, isLoading, error } = useGetOrgChartQuery();
const [updateParent]             = useUpdateParentMutation();
```

---

### Part 3 — React Spring Physics

#### The Spring Equation

```
Spring formula (Hooke's Law + damping):

  acceleration = -tension × displacement - friction × velocity

  displacement = current_position - target_position
  tension      → stiffness  (higher = faster, snappier)
  friction     → damping    (higher = less oscillation/bounce)

Each frame (60fps = 1/60s timestep):
  velocity += acceleration / 60
  position += velocity / 60

Stop when |displacement| < 0.001 and |velocity| < 0.001
```

#### useSpring — hover lift

```tsx
import { useSpring, animated } from "@react-spring/web";

function OrgNodeCard() {
  const [springs, api] = useSpring(() => ({
    y: 0, scale: 1, shadow: 8,
    config: { tension: 300, friction: 20 },
  }));

  return (
    <animated.div
      style={{
        transform: springs.y.to(y => `translateY(${y}px)`),
        boxShadow: springs.shadow.to(s => `0 ${s}px ${s * 2}px rgba(0,0,0,0.3)`),
      }}
      onMouseEnter={() => api.start({ y: -6, scale: 1.03, shadow: 20 })}
      onMouseLeave={() => api.start({ y: 0,  scale: 1,    shadow: 8  })}
    />
  );
}
```

#### useTransition — staggered child appear

```tsx
import { useTransition, animated } from "@react-spring/web";

function AnimatedChildren({ childIds, visible }) {
  const transitions = useTransition(visible ? childIds : [], {
    from:  { opacity: 0, transform: "scale(0.85) translateY(-8px)" },
    enter: { opacity: 1, transform: "scale(1)    translateY(0px)"  },
    leave: { opacity: 0, transform: "scale(0.85) translateY(-8px)" },
    trail: 50,         // 50ms stagger between each child
    config: { tension: 280, friction: 26 },
    keys: id => id,   // stable key for enter/leave tracking
  });

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {transitions((style, childId) => (
        <animated.div key={childId} style={style}>
          <OrgTree nodeId={childId} />
        </animated.div>
      ))}
    </div>
  );
}
```

#### Spring config guide

```
{ tension: 500, friction: 50 } → Very stiff, minimal oscillation  (status bars, toggles)
{ tension: 300, friction: 20 } → Fast, slightly bouncy            (hover effects)
{ tension: 180, friction: 24 } → Default React Spring feel        (most UI transitions)
{ tension: 120, friction: 14 } → Slow, elastic                    (page transitions)
{ tension: 60,  friction: 10 } → Very slow, heavy bounce          (special hero animations)
```

---

### Interview Q&A

#### Q: Tại sao Redux state cần serializable? Làm thế nào với Set/Map?

```typescript
// ❌ Redux DevTools & persistence won't work with Set/Map
const state = { expanded: new Set<string>() };

// ✅ Store as Array, convert back to Set in selector
const state = { expanded: string[] };

// In selector (memoized):
const selectExpanded = createSelector(
  (state: RootState) => state.orgChart.expanded,
  (expanded) => new Set(expanded)
);

// In reducer:
toggleNode: (state, action) => {
  const idx = state.expanded.indexOf(action.payload);
  if (idx >= 0) {
    state.expanded.splice(idx, 1);  // Immer: direct mutation OK
  } else {
    state.expanded.push(action.payload);
  }
}
```

#### Q: RTK Query vs React Query vs SWR?

```
RTK Query:
  ✅ Integrated with Redux — actions, selectors, store devtools
  ✅ Optimistic updates with cache patch + undo
  ✅ Fine-grained tag-based cache invalidation
  ✅ TypeScript-first: inferred types from endpoint definition
  ❌ Heavier bundle (RTK + Redux Peer deps)
  ❌ Requires Redux Provider setup

React Query / TanStack Query:
  ✅ Lighter, no Redux dependency
  ✅ Better stale-while-revalidate, window focus refetch
  ✅ Works with any fetch function
  ❌ Separate from Redux state — need manual sync for optimistic updates

SWR (Vercel):
  ✅ Lightest (~3kb)
  ✅ Simple API: useSWR(key, fetcher)
  ❌ Less power for mutations + optimistic updates
  ❌ Limited tag-based cache invalidation

Use RTK Query when: project already uses Redux + complex mutation/cache patterns
Use React Query when: no Redux, focus on server state, complex background refetching
Use SWR when: simple read-heavy apps, minimal deps
```

#### Q: useSpring vs CSS transitions — khi nào dùng cái nào?

```
CSS transitions:
  ✅ Zero JavaScript overhead
  ✅ GPU-accelerated (transform, opacity)
  ✅ Works when component is unmounted (exit animations need workaround)
  ❌ Cannot do physics (spring overshoot, bounce)
  ❌ Cannot interrupt/redirect mid-animation based on velocity
  ❌ Limited to pre-defined from/to values

React Spring:
  ✅ Physics-based: overshoot, bounce feel natural
  ✅ Interruptible: hover off mid-animation → spring reverses from current velocity
  ✅ useTransition handles mount/unmount lifecycle cleanly
  ✅ Imperative API: api.start() from event handlers
  ❌ JavaScript overhead (rAF loop while animating)
  ❌ Heavier bundle than CSS

Rule of thumb:
  Simple A→B, no interrupt: CSS transitions/keyframes
  Complex interactive, physics feel: React Spring
  Entering/leaving DOM elements: React Spring's useTransition
```


---

## Storybook — Modern Testing Patterns

> **Context:** "Improved unit and visual testing by adding extensive data mocking and modern patterns to Storybook." Demo: [`StorybookDemo.tsx`](../packages/host/src/StorybookDemo.tsx)

---

### Pattern Overview

```
Testing pyramid for UI components:

        ┌─────────────────┐
        │   Chromatic     │  ← Visual regression (screenshot diff)
        │  (cloud CI)     │
        ├─────────────────┤
        │  play() tests   │  ← Interaction tests (run in real browser)
        │  in Storybook   │    @storybook/test: userEvent + expect + within
        ├─────────────────┤
        │ Unit tests      │  ← Logic: Vitest/Jest + @testing-library/react
        │ (Vitest/Jest)   │    Shares MSW handlers and factory fixtures
        ├─────────────────┤
        │ Story isolation │  ← Components in every state/variant
        │ (Storybook)     │    CSF3 stories as living documentation
        └─────────────────┘
```

---

### Part 1 — CSF3 (Component Story Format 3.0)

```typescript
// EmployeeCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { EmployeeCard } from "./EmployeeCard";
import { createEmployee } from "../test/factories";

// Meta — configures component for Storybook catalogue + argTypes for Controls panel
const meta = {
  title: "HCM/EmployeeCard",
  component: EmployeeCard,
  argTypes: {
    status: { control: "select", options: ["Active", "On Leave", "Terminated"] },
    isManager: { control: "boolean" },
  },
  args: {
    employee: createEmployee(),  // factory — fresh realistic data
  },
  // decorators wrap every story in this file with providers
  decorators: [(Story) => <Provider store={createTestStore()}><Story /></Provider>],
} satisfies Meta<typeof EmployeeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// CSF3: stories are OBJECTS not functions
export const Default: Story = {};                            // uses meta.args

export const OnLeave: Story = {
  args: { employee: createEmployee({ status: "On Leave" }) }, // overrides one field
};

export const Loading: Story = { render: () => <EmployeeCard isLoading /> };
export const Error:   Story = { render: () => <EmployeeCard error="500" /> };
```

#### CSF2 vs CSF3

```typescript
// ❌ CSF2 — function-based (Storybook 6, still works but deprecated)
export const Default = (args) => <EmployeeCard {...args} />;
Default.args = { employee: mockEmployee };
Default.storyName = "Default";

// ✅ CSF3 — object-based (Storybook 7+)
export const Default: Story = {
  args: { employee: createEmployee() },
  name: "Default",
};
// Benefits of CSF3:
//  • TypeScript: Story type fully inferred from Meta<typeof Component>
//  • Tree-shakeable: unused story variants don't bloat the bundle
//  • play() co-located — tests live next to the story they test
//  • No functional wrapper — simpler for decorators and loaders
```

---

### Part 2 — Data Mocking: Factory Pattern with faker.js

```typescript
// test/factories/employee.factory.ts
import { faker } from "@faker-js/faker/locale/vi";
import type { Employee } from "../../types";

export function createEmployee(overrides?: Partial<Employee>): Employee {
  return {
    id:         `EMP-${faker.string.numeric(3)}`,
    name:       faker.person.fullName(),
    email:      faker.internet.email(),
    title:      faker.person.jobTitle(),
    department: faker.helpers.arrayElement(["Engineering", "Product", "Finance"]),
    status:     faker.helpers.arrayElement(["Active", "On Leave", "Terminated"]),
    location:   faker.helpers.arrayElement(["HCM", "HN", "DA", "Remote"]),
    hireDate:   faker.date.past({ years: 10 }).toISOString().slice(0, 10),
    salary:     faker.number.int({ min: 60_000, max: 150_000 }),
    ...overrides,  // caller overrides win
  };
}

// List builder — for table/grid stories
createEmployee.buildList = (n: number, overrides?: Partial<Employee>): Employee[] =>
  Array.from({ length: n }, () => createEmployee(overrides));

// Traits — named preset combinations
createEmployee.manager  = (o?: Partial<Employee>) => createEmployee({ title: "VP Engineering", ...o });
createEmployee.onLeave  = (o?: Partial<Employee>) => createEmployee({ status: "On Leave", ...o });
createEmployee.inactive = (o?: Partial<Employee>) => createEmployee({ status: "Terminated", ...o });

// ── Shared across the whole test suite:
const emp           = createEmployee({ name: "Alice" });    // unit tests
const managerStory  = createEmployee.manager();             // Storybook
const bulkFixture   = createEmployee.buildList(50);         // integration tests
```

---

### Part 3 — MSW (Mock Service Worker)

```typescript
// test/mocks/handlers.ts — ONE file reused by Storybook + Vitest + Playwright

import { http, HttpResponse, delay } from "msw";

export const handlers = [
  http.get("/api/employees", async ({ request }) => {
    const url   = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 20;
    await delay(300);  // realistic latency
    return HttpResponse.json({
      data:  createEmployee.buildList(limit),
      total: 247,
    });
  }),

  http.patch("/api/employees/:id/parent", async ({ request, params }) => {
    const body = await request.json() as { parentId: string };
    await delay(200);
    return HttpResponse.json({ success: true, nodeId: params.id });
  }),
];

// Error override for testing error states:
export const errorHandlers = [
  http.get("/api/employees/:id", () =>
    HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
  ),
];

// ── Storybook integration (.storybook/preview.ts):
import { initialize, mswLoader } from "msw-storybook-addon";
initialize({ onUnhandledRequest: "bypass" });  // don't warn on unmocked routes

// ── Per-story MSW override:
export const WithMSWError: Story = {
  parameters: {
    msw: { handlers: errorHandlers },  // overrides global handlers for this story
  },
};

// ── Vitest/Jest integration:
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Why MSW over jest.mock():
// jest.mock('./api')   → mocks module, not network → doesn't test fetch/axios plumbing
// MSW                  → intercepts actual HTTP requests → same as production
//                      → works in browser (Storybook) + Node (Vitest) transparently
```

---

### Part 4 — play() Functions (Interaction Testing)

```typescript
// EmployeeCard.stories.tsx
import { expect, userEvent, within, waitFor } from "@storybook/test";

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);  // scoped to this story's DOM
    const user = userEvent.setup();

    // step() groups actions for the Interactions debugger panel
    await step("Tab into card", async () => {
      await user.tab();
      await expect(canvas.getByRole("article")).toHaveFocus();
    });

    await step("Open action menu", async () => {
      await user.keyboard("{Enter}");
      await waitFor(() => expect(canvas.getByRole("menu")).toBeVisible());
    });

    await step("Arrow key to Edit", async () => {
      await user.keyboard("{ArrowDown}");
      await expect(canvas.getByRole("menuitem", { name: /edit/i })).toHaveFocus();
    });

    await step("Escape closes menu", async () => {
      await user.keyboard("{Escape}");
      await expect(canvas.getByRole("article")).toHaveFocus();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
  },
};

// ── play() vs traditional test files:
//
// Traditional:
//   EmployeeCard.test.tsx   → renders → interacts → asserts (jsdom)
//   EmployeeCard.stories.tsx → documents → shows variations
//
// Modern:
//   EmployeeCard.stories.tsx → documents + interacts + asserts (real browser)
//   play() runs in same browser context → catches real CSS/layout/focus bugs
//   Storybook Test Runner converts play() → Playwright test automatically
//   → One file, two purposes: documentation AND integration test
```

---

### Part 5 — Global Decorators & Parameters

```typescript
// .storybook/preview.tsx

const preview: Preview = {
  // 1. Wrap every story in Redux + Router + ThemeProvider
  decorators: [
    (Story, context) => (
      <Provider store={createTestStore(context.parameters.preloadedState)}>
        <MemoryRouter initialEntries={[context.parameters.initialRoute ?? "/"]}>
          <ThemeProvider theme={context.globals.theme ?? "dark"}>
            <Story />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    ),
  ],

  // 2. MSW starts before ANY story renders (not per-story)
  loaders: [mswLoader],

  parameters: {
    // 3. axe-core rules
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },  // WCAG 1.4.3 — Level AA
          { id: "focus-trap",     enabled: true },
          { id: "keyboard",       enabled: true },
        ],
      },
    },

    // 4. Chromatic visual regression
    chromatic: {
      diffThreshold: 0.2,         // 0.2% pixel tolerance
      viewports: [375, 768, 1440], // capture at 3 breakpoints
      pauseAnimationAtEnd: true,   // wait for CSS transitions
    },
  },

  // 5. Theme switcher in the Storybook toolbar
  globalTypes: {
    theme: {
      toolbar: {
        icon: "circle",
        items: [{ value: "dark", title: "Dark" }, { value: "light", title: "Light" }],
      },
    },
  },
};
```

---

### Part 6 — Chromatic Setup (Visual Regression CI)

```yaml
# .github/workflows/chromatic.yml

name: Chromatic Visual Tests
on:
  push:
    branches: ["*"]
  pull_request:

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # Required for Chromatic to detect changed stories

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@v11
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: "build-storybook"
          exitZeroOnChanges: true  # PR still passes, but Chromatic UI shows diff
```

```
Chromatic workflow:
  1. npm run build-storybook → static Storybook build
  2. Chromatic uploads to cloud
  3. Screenshots taken at each viewport per story
  4. Diff vs baseline (last accepted)
  5. PR blocked if unreviewed visual changes
  6. Designer / PM reviews and accepts/denies via Chromatic UI

Story count matters:
  50 stories × 3 viewports = 150 snapshots per commit
  Chromatic free tier: 5,000 snapshots/month
  Use chromatic: { disableSnapshot: true } on stories that change every run (e.g., faker data)
```

---

### Interview Q&A

#### Q: Sự khác biệt giữa `render` và `args` trong CSF3?

```typescript
// args: passed as props to the component function
export const Default: Story = {
  args: { employee: createEmployee() },
  // Storybook calls: <EmployeeCard employee={...} />
  // Controls panel can modify these live
};

// render: completely custom render function — bypass args system
export const ComplexLayout: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 16 }}>
      <EmployeeCard {...args} />
      <AuditLog employeeId={args.employee.id} />
    </div>
  ),
  // Use render when: story needs multiple components, wrappers, or custom layout
  // Controls panel still works if you pass ...args to the component
};
```

#### Q: play() runs trong jsdom hay real browser?

```
play() runs in the REAL BROWSER when viewing stories in Storybook UI.

Storybook Test Runner (npx test-storybook):
  → Converts play() to Playwright E2E tests
  → Runs in a headless Chromium — real browser, real DOM
  → NOT jsdom — this is the key advantage

vs @testing-library/react + jsdom (Vitest/Jest):
  → jsdom is not a real browser — has many limitations:
    × No real CSS cascade (computed styles are wrong)
    × No scrollIntoView, getBoundingClientRect, IntersectionObserver
    × No focus ring visibility
    × No GPU compositing

play() catches bugs that jsdom CANNOT:
  ✅ Real focus management (Tab order depends on real CSS display/visibility)
  ✅ Real scroll position after focus()
  ✅ CSS overflow: hidden actually clips (affects intersection/visibility)
  ✅ ::before / ::after pseudo-elements (decorative icons that need aria-hidden)
```

#### Q: Tại sao factory function tốt hơn hardcode fixtures?

```typescript
// ❌ Hardcoded fixture — coupling, stale data
const MOCK_EMPLOYEE = {
  id: "EMP-001",
  name: "Alice",
  status: "Active",
  // When Employee type gets a new required field "timezone"...
  // → This fixture breaks silently (undefined value)
  // → Need to update every file that imports this fixture
};

// ✅ Factory — type-safe, always valid, isolated
const emp = createEmployee();
// → TypeScript error immediately when Employee type changes
// → Every call gets fresh, unique data — no shared mutable state
// → Override only what the test cares about:
const onLeaveEmp = createEmployee({ status: "On Leave" });
// → name, email, salary etc. are still random — test only checks the override

// Factory benefits:
//  1. Type safety: TypeScript validates overrides at compile time
//  2. Isolation: each test gets its own data — no shared state between tests
//  3. Realistic: faker generates varied data → finds edge cases hardcoded data misses
//  4. Maintainable: add new required field in one place (factory) not everywhere
```


---

## Conference Talks — Calendar Accessibility & Architecture

> **Context:** "Gave talks on calendar accessibility at the Bay Area Accessibility and Inclusive Design Meetup and calendar architecture and design at a company organizational conference." Demo: [`CalendarTalksDemo.tsx`](../packages/host/src/CalendarTalksDemo.tsx)

---

## Talk A: Calendar Accessibility Done Right
### Bay Area Accessibility and Inclusive Design Meetup

---

### Part A-1 — WAI-ARIA Grid Pattern

```html
<!-- Correct semantic structure for a calendar widget -->
<div role="application" aria-label="Date picker">

  <!-- Month header — aria-live announces changes to screen reader -->
  <div>
    <button aria-label="Previous month">‹</button>
    <div aria-live="polite" aria-atomic="true">June 2025</div>
    <button aria-label="Next month">›</button>
  </div>

  <!-- role=grid — 2D navigable widget (not role=table which is read-only) -->
  <table role="grid" aria-label="June 2025">
    <thead>
      <tr role="row">
        <th scope="col" abbr="Sunday" role="columnheader">Su</th>
        <!-- ... -->
      </tr>
    </thead>
    <tbody>
      <tr role="row">
        <td
          role="gridcell"
          aria-label="1 June 2025"     <!-- full date: day + month + year -->
          aria-selected="true"         <!-- is this date selected? -->
          aria-disabled="false"        <!-- can it be selected? -->
          tabIndex={0}                 <!-- ONLY this cell is in tab order -->
        >1</td>
        <td role="gridcell" tabIndex={-1} aria-label="2 June 2025">2</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Part A-2 — Roving tabIndex (The Core Pattern)

```typescript
// CONCEPT:
// - In a grid with 31 cells, putting tabIndex=0 on all = 31 Tab stops (unusable)
// - Roving tabIndex: exactly ONE cell has tabIndex=0 at any time
// - Arrow keys move the 0 to adjacent cells
// - Tab exits the entire grid (moves to next UI section)

const [focusedDate, setFocusedDate] = useState(today);

// Each cell computes its tabIndex:
<td
  tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
  ref={el => {
    // Auto-focus when focusedDate changes (after arrow key press)
    if (isSameDay(date, focusedDate) && el && document.activeElement !== el) {
      el.focus();
    }
  }}
>
  {day}
</td>
```

---

### Part A-3 — Complete Keyboard Spec (WAI-ARIA APG)

```typescript
// These key bindings come from the official WAI-ARIA Authoring Practices Guide
// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowRight": e.preventDefault(); move(addDays(cur,  1)); break;
    case "ArrowLeft":  e.preventDefault(); move(addDays(cur, -1)); break;
    case "ArrowDown":  e.preventDefault(); move(addDays(cur,  7)); break;
    case "ArrowUp":    e.preventDefault(); move(addDays(cur, -7)); break;
    case "Home":       e.preventDefault(); move(startOfWeek(cur)); break;  // APG: first of week
    case "End":        e.preventDefault(); move(endOfWeek(cur));   break;  // APG: last of week
    case "PageDown":   e.preventDefault(); move(addMonths(cur, 1)); break;
    case "PageUp":     e.preventDefault(); move(subMonths(cur, 1)); break;
    case "Enter": case " ":
      e.preventDefault();
      if (!isDisabled(cur)) selectDate(cur);
      break;
    case "Escape":
      e.preventDefault();
      close();
      triggerButton.current?.focus();  // Always restore focus to trigger
      break;
  }
};
```

---

### Part A-4 — Screen Reader Announcements

```tsx
// Two live regions: one for month changes, one for selection

// 1. Month/year — polite, speaks when user changes months
<div aria-live="polite" aria-atomic="true" style={srOnly}>
  {format(currentMonth, "MMMM yyyy")}
  {/* VoiceOver: "June 2025" */}
</div>

// 2. Selection — speaks when user selects a date
<div aria-live="polite" aria-atomic="true" style={srOnly}>
  {selected ? `Selected ${format(selected, "EEEE, MMMM d, yyyy")}` : ""}
  {/* VoiceOver: "Selected Wednesday, June 11, 2025" */}
</div>

// aria-atomic="true": reads the ENTIRE region text, not just the changed part
// aria-live="polite": waits for current SR sentence to finish before speaking
// aria-live="assertive": interrupts immediately — use only for critical errors

// aria-label on each cell:
<td aria-label={format(date, "EEEE, MMMM d, yyyy")}>
  {format(date, "d")}
</td>
// VoiceOver speaks day name + full date on arrow key focus:
// "Wednesday, June 11 2025" (includes day-of-week = spatial orientation)
```

---

### Part A-5 — WCAG 2.1 Compliance Map

| WCAG SC | Description | Calendar Implementation | Level |
|---|---|---|---|
| 1.3.1 | Info & Relationships | `role=grid`, `role=gridcell`, `aria-label` on cells | A |
| 1.4.3 | Contrast | Focus outline 3:1+, selected date 4.5:1+ | AA |
| 2.1.1 | Keyboard | Full roving tabIndex + arrow key algorithm | A |
| 2.4.3 | Focus Order | DOM order = visual order, no `tabIndex > 0` | A |
| 2.4.7 | Focus Visible | `outline: 2px solid` on all interactive cells | AA |
| 3.3.1 | Error Identification | `aria-invalid` + `aria-describedby` on disabled dates | A |
| 4.1.2 | Name, Role, Value | `aria-label`, `aria-selected`, `aria-disabled` | A |

---

## Talk B: Calendar Architecture & Design at Scale
### Company Organizational Conference

---

### Part B-1 — Data Model: Store Rules, Not Instances

```typescript
// ── Persisted in database ─────────────────────────────────────────

interface CalendarEvent {
  id:       string;
  title:    string;
  startUtc: string;           // ALWAYS UTC: "2025-06-11T09:00:00Z"
  endUtc:   string;
  timezone: string;           // IANA: "Asia/Ho_Chi_Minh" (display only)
  allDay:   boolean;

  rrule:    string | null;    // RFC 5545: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=52"
  exdates:  string[];         // UTC timestamps of deleted occurrences
  modifiedInstances: Record<string, Partial<CalendarEvent>>;
}

// ── Computed at read time (NEVER persisted) ──────────────────────

function expandRecurringEvent(event: CalendarEvent, start: Date, end: Date): CalendarInstance[] {
  if (!event.rrule) {
    const eventStart = parseISO(event.startUtc);
    return isWithinInterval(eventStart, { start, end }) ? [toInstance(event, eventStart)] : [];
  }

  const rule = rrulestr(event.rrule, { dtstart: parseISO(event.startUtc) });
  return rule.between(start, end, true)
    .filter(date => !isExcluded(date, event.exdates))
    .map(date => ({
      event,
      instanceStart: date,
      instanceEnd: addMilliseconds(date, durationMs(event)),
      isModified: !!event.modifiedInstances[date.toISOString()],
      ...event.modifiedInstances[date.toISOString()],  // apply overrides
    }));
}
```

---

### Part B-2 — Timezone Architecture

```typescript
// Rule: Store UTC. Display in user's timezone. Never local time.

import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

// SAVE — convert wall-clock input to UTC:
function saveEvent(localTimeStr: string, userTimezone: string): string {
  const utc = fromZonedTime(localTimeStr, userTimezone);
  return utc.toISOString();  // "2025-06-11T02:00:00Z"
}

// DISPLAY — convert UTC to user's timezone:
function displayTime(utcString: string, displayTimezone: string): string {
  return formatInTimeZone(new Date(utcString), displayTimezone, "h:mm a zzz");
  // "9:00 AM ICT"
}

// All-day events — no timezone (stored as plain date string):
// "2025-06-11" should appear on June 11 in EVERY timezone
// If stored as UTC midnight, it shows June 10 for UTC-5 users
interface AllDayEvent { startDate: string; endDate: string; }
```

---

### Part B-3 — Headless Calendar Pattern

```typescript
// useCalendar.ts — logic hook (no JSX, no styling assumptions)

export function useCalendar(options: CalendarOptions) {
  const [focusedDate, setFocusedDate] = useState(options.defaultDate ?? today());
  const [selectedDates, setSelected] = useState<Date[]>([]);

  const weeks = useMemo(() => generateMonthGrid(focusedDate), [focusedDate]);

  // Props getters — consumers spread onto their DOM elements:
  return {
    weeks,
    getDayProps: (date: Date) => ({
      tabIndex: isSameDay(date, focusedDate) ? 0 : -1,
      role: "gridcell",
      "aria-selected": isSelected(date, selectedDates),
      "aria-label": format(date, "EEEE, MMMM d, yyyy"),
      onClick: () => selectDate(date),
      onKeyDown: (e) => handleDayKeyDown(e, date),
    }),
    getGridProps: () => ({
      role: "grid",
      "aria-label": format(focusedDate, "MMMM yyyy"),
    }),
  };
}

// Multiple surfaces use the same hook — headless means the UI is fully owned by the consumer:
// - Web calendar view
// - Date picker dialog
// - Timeline view
// - Print layout
// All share identical keyboard, selection, and ARIA logic
```

---

### Part B-4 — Month View Layout Algorithm (Sweep-Line)

```typescript
// Naive: O(n²) — for each event, check all others for overlap
// Correct: O(n log n) — sort by start, sweep forward

function layoutEvents(events: CalendarInstance[]): LayoutEvent[] {
  const sorted = [...events].sort((a, b) => +a.instanceStart - +b.instanceStart);
  const columns: CalendarInstance[][] = [];

  for (const event of sorted) {
    // Find first column where this event doesn't overlap any existing event
    const col = columns.find(c =>
      c.every(e => !overlaps(e, event))
    );

    if (col) col.push(event);
    else      columns.push([event]);
  }

  // Assign visual position:
  return columns.flatMap((col, colIdx) =>
    col.map(event => ({
      ...event,
      left:  `${(colIdx / columns.length) * 100}%`,
      width: `${(1 / columns.length) * 100}%`,
    }))
  );
}

// Performance: 1,000 events with 40 concurrent overlaps:
// Naive:     ~800ms (1M comparisons)
// Sweep-line: ~12ms (40K comparisons)
```

---

### Part B-5 — Results

| Metric | Before | After | Change |
|---|---|---|---|
| Time to first paint (month view) | 4.2s | 0.8s | **5× faster** |
| Event layout compute time | ~800ms | ~12ms | **67× faster** |
| Calendar JS bundle | 182kB gzip | 38kB gzip | **79% smaller** |
| Recurring events supported | 50 | 10,000+ | **200× more** |
| axe-core violations | 23 | 0 | **Level AA** |
| Timezone bugs (Q1→Q2) | 14 | 1 | **93% fewer** |

---

### Interview Q&A

#### Q: Tại sao dùng role="grid" thay vì role="table"?

```
role="table":
  → Static data display — read-only
  → AT announces cell content as users arrow through
  → NO keyboard interaction model defined by ARIA spec
  → Appropriate for: data tables, pricing grids, comparison charts

role="grid":
  → Interactive widget — cells are focusable and operable
  → Keyboard navigation defined: Arrow keys, Home/End, Page Up/Down
  → Cells can be "selected" (aria-selected), "disabled" (aria-disabled)
  → Appropriate for: calendars, spreadsheets, data grids with selection

Use role="grid" for any calendar widget where:
  → Users select dates (aria-selected)
  → Some dates are disabled (aria-disabled)
  → Arrow key navigation is expected
```

#### Q: RFC 5545 RRule — tại sao không tự implement?

```
Don't write your own recurrence engine:
  × DST transitions: "every Monday 9am" → which 9am? Wall-clock varies by DST
  × Month-end edge cases: "last day of every month" → Feb 28 vs 29
  × BYSETPOS: "2nd Tuesday of each month" — complex set arithmetic
  × WKST: week start varies by locale
  × COUNT vs UNTIL: subtle interaction with timezone offsets
  × EXDATE: excluded instances must match by tz-aware equality

Use rrule.js (npm: rrule):
  → Full RFC 5545 compliance
  → Handles all DST and locale edge cases
  → Returns Date[] for a window: rule.between(start, end)
  → Actively maintained, well-tested
```


---

## Accessibility Internal Training Program

> **Context:** "Led developing for accessibility internal trainings." Demo: [`A11yTrainingDemo.tsx`](../packages/host/src/A11yTrainingDemo.tsx)

---

### Program Overview

```
Outcome metrics (Q3 rollout):
  47 engineers completed the full 8-module curriculum
  axe-core violations per PR:  ↓ 68% in the two quarters following launch
  Average WCAG knowledge score: 41% pre-training → 84% post-training
  Time to identify a11y bugs in PR review: ↓ from 3 days to same-day

Curriculum design principles:
  1. Progressive complexity — Beginner → Intermediate → Advanced
  2. Concrete before abstract — live broken component, then the WCAG rule
  3. Interactive over passive — quizzes + Bug Finder, not slideshows
  4. Reference-first — cheat cards engineers can consult during PRs
  5. Measurable — module quiz scores tracked; managers see team completion %
```

---

### Curriculum — 8 Modules

| Module | Title | Level | Duration | Key Topics |
|---|---|---|---|---|
| M1 | A11y Foundations | Beginner | 25 min | Disability categories, AT types, WCAG A/AA/AAA |
| M2 | Semantic HTML | Beginner | 20 min | First Rule of ARIA, landmark roles, native elements |
| M3 | Keyboard Navigation | Intermediate | 35 min | tabIndex values, roving tabIndex, skip links, focus traps |
| M4 | Screen Readers | Intermediate | 30 min | VoiceOver/NVDA workflow, virtual cursor, testing checklist |
| M5 | ARIA | Intermediate | 40 min | Roles/properties/states, live regions, aria-live |
| M6 | Colour & Contrast | Beginner | 20 min | Contrast ratios, not-colour-alone, focus indicators |
| M7 | Forms | Intermediate | 30 min | Label association, error patterns, required fields |
| M8 | Images & Media | Beginner | 15 min | Alt text decision tree, decorative images, captions |

---

### Module Deep Dives

#### M2 — The First Rule of ARIA

```
Rule: "If you can use a native HTML element with the semantics and behaviour
       already built in, do so instead of using ARIA."

Native HTML gives you for free:
  ✓ Keyboard focusability (Tab)
  ✓ Keyboard activation (Enter/Space for buttons)
  ✓ Correct role announcement to AT
  ✓ Correct focus visibility
  ✓ Form participation (for <button type="submit">)

Cost of ARIA-only:
  - tabIndex=0 needed (you might forget)
  - onKeyDown handler needed for Enter/Space
  - role=button still doesn't give form participation
  - Any state change (disabled, expanded) needs manual ARIA updates

Examples:
  Prefer <button>   over <div role="button">
  Prefer <a href>   over <div role="link">
  Prefer <input>    over <div role="textbox" contenteditable>
  Prefer <select>   over <div role="listbox"> (unless you need custom styling)
  Prefer <details>  over <div role="disclosure" aria-expanded>
```

#### M3 — The Three tabIndex Values

```typescript
// tabIndex=0  → in natural Tab order (DOM position)
//              → Use: native buttons, links, inputs, custom interactive elements
<button tabIndex={0}>Always 0 for interactive elements</button>

// tabIndex=-1 → NOT in Tab order, but focusable via .focus()
//              → Use: modal containers, off-screen content, roving tabIndex inactive cells
<div tabIndex={-1} ref={modalRef}>Modal content</div>

// tabIndex=N (positive) → OVERRIDES natural Tab order
//              → Avoid entirely — creates non-linear Tab flow
//              → Only 0 and -1 should appear in production code
<button tabIndex={5}>❌ Avoid — moves focus order unpredictably</button>
```

#### M5 — ARIA Categories

```
Roles    → What the element IS (static, don't change dynamically)
           role="button" | role="dialog" | role="grid" | role="alert"

Properties → Characteristics that don't often change
           aria-label | aria-labelledby | aria-describedby | aria-required

States   → Conditions that change with user interaction (update via JS)
           aria-expanded={isOpen} | aria-selected={isSelected} | aria-checked={isChecked}
```

#### M6 — Contrast Ratios

```
Normal text   < 18pt:          ≥ 4.5:1   (WCAG 1.4.3 AA)
Large text    ≥ 18pt or bold:  ≥ 3:1     (WCAG 1.4.3 AA)
UI components (borders, icons): ≥ 3:1    (WCAG 1.4.11 AA)
Focus indicators:               ≥ 3:1    (WCAG 2.4.11 AA)
Enhanced text (AAA):            ≥ 7:1    (WCAG 1.4.6 AAA)

Tools: WebAIM Contrast Checker, Chrome DevTools colour picker, axe DevTools browser extension
```

---

### Bug Finder — Exercise Format

The Bug Finder module presents components with multiple violations and asks engineers to identify them before revealing the fix:

**Exercise 1: Login Form (4 violations)**
1. `<div>Username</div>` — not a `<label>`, no `htmlFor` association → **WCAG 1.3.1 / 4.1.2**
2. Placeholder as sole label — disappears on input → **WCAG 1.3.1**
3. `<div onclick>` button — no keyboard access, no role → **WCAG 2.1.1**
4. Error message not linked to input via `aria-describedby` → **WCAG 3.3.1 / 4.1.3**

**Exercise 2: Dropdown Menu (3 violations)**
1. `aria-expanded` missing on trigger button → **WCAG 4.1.2**
2. Menu items are `<div>` — not keyboard focusable → **WCAG 2.1.1**
3. No `Escape` key handler → **WCAG 2.1.1**

---

### Reference Card — Quick Lookup

#### Most-Used ARIA Attributes

| Attribute | Purpose | Value |
|---|---|---|
| `aria-label` | Custom accessible name | String |
| `aria-labelledby` | Reference existing visible label | ID |
| `aria-describedby` | Link to description/hint/error | ID |
| `aria-expanded` | Is disclosure panel open? | Boolean |
| `aria-haspopup` | Trigger has associated popup | menu / dialog / listbox |
| `aria-live` | Announce region changes | polite / assertive |
| `aria-atomic` | Read full live region text | Boolean |
| `aria-hidden` | Remove from accessibility tree | Boolean |
| `aria-invalid` | Field value is invalid | Boolean |
| `aria-required` | Field is required | Boolean |

#### VoiceOver (macOS) Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+F5` | Toggle VoiceOver |
| `VO+Right/Left` | Next / previous element |
| `VO+U` | Rotor (headings, links, landmarks) |
| `VO+Cmd+H` | Next heading |
| `VO+Space` | Activate element |
| `VO+Shift+Down` | Interact with widget |
| `VO+Shift+Up` | Stop interacting |

#### Common Accessible Patterns

```typescript
// 1. Skip link — first in DOM, visually hidden until focused
.sr-only:not(:focus) {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
}
<a href="#main" className="sr-only">Skip to main content</a>

// 2. Icon button — label on button, icon decorative
<button aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

// 3. Error pattern — link input to error via IDs
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
<div id="email-error" role="alert">
  {hasError && "Please enter a valid email address"}
</div>

// 4. Disclosure / accordion button
<button
  aria-expanded={isOpen}
  aria-controls="panel-id"
  onClick={() => setOpen(o => !o)}
>
  Section title
</button>
<div id="panel-id" hidden={!isOpen}>Panel content</div>
```


---

## LLM Observability — Visual Trace Explorer

> **Context:** "Developed visual observability layer using React Flow to render LLM trace data as interactive flow diagrams with custom nodes, performance metrics matrix, and cost breakdowns, reducing root cause analysis time by 65%." Demo: [`LLMObservabilityDemo.tsx`](../packages/host/src/LLMObservabilityDemo.tsx)

---

### Impact

```
Before: Engineers spent avg 18 min per incident manually reading JSON trace logs
After:  Visual trace diagram → root cause identified in avg 6 min

Root cause analysis time: ↓ 65%
Cost anomaly detection:   Previously manual → automatic threshold highlighting
Slow node identification: Previously visual scan of logs → one-click critical path
Mean time to identify bottleneck: ↓ from 3+ days to same-day
```

---

### Architecture Overview

```
LLM Traces (OpenTelemetry / LangSmith / custom)
         ↓
  RTK Query endpoint (GET /api/traces/:id)
         ↓
  transformResponse: flat spans[] → { nodes, edges }
         ↓
  React Flow <ReactFlow nodeTypes={...} edgeTypes={...} />
         ↓
  Custom node types × 6 (LLM, Tool, Retrieval, Embedding, Router, Context)
  Custom edge type    × 1 (PerfEdge with latency label + animated flow)
  Dagre auto-layout       (left-to-right, collision-free)
```

---

### Part 1 — Custom Node Components

```tsx
// NodeProps<T> — typed data from the trace record
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface LLMNodeData {
  model:        string;
  latencyMs:    number;
  inputTokens:  number;
  outputTokens: number;
  cost:         number;
  status:       "success" | "error" | "slow" | "cached";
}

export const LLMNode = memo(({ data, selected }: NodeProps<LLMNodeData>) => (
  <>
    <Handle type="target" position={Position.Left} />

    <div className={clsx("node", `node--${data.status}`, selected && "node--selected")}>
      {/* 3px colour strip at top — colour by node type */}
      <div className="node__strip" />

      <div className="node__header">
        <span>🧠</span>
        <span className="node__model">{data.model}</span>
        {data.status !== "success" && (
          <span className={`badge badge--${data.status}`}>{data.status}</span>
        )}
      </div>

      <div className="node__metrics">
        <MetricPill icon="⏱" value={`${data.latencyMs}ms`} warn={data.latencyMs > 2000} />
        <MetricPill icon="💬" value={`${data.inputTokens}→${data.outputTokens}t`} />
        <MetricPill icon="$"  value={`$${data.cost.toFixed(4)}`}  warn={data.cost > 0.05} />
      </div>
    </div>

    <Handle type="source" position={Position.Right} />
  </>
));

// Register all 6 custom node types:
const nodeTypes = {
  llm:       LLMNode,
  tool:      ToolNode,
  retrieval: RetrievalNode,
  embedding: EmbeddingNode,
  router:    RouterNode,
  context:   ContextNode,
};
```

---

### Part 2 — Custom Edge (Performance Badge)

```tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

interface PerfEdgeData {
  latencyMs?: number;
  status:     "success" | "error";
}

export function PerfEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps<PerfEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke:          data?.status === "error" ? "#ef4444" : "#334155",
          strokeDasharray: data?.status === "error" ? "6,3" : undefined,
          // CSS animation for active data flow:
          animation: "dashFlow 1.5s linear infinite",
          strokeDashoffset: "var(--dash-offset)",
        }}
      />

      {data?.latencyMs && (
        <EdgeLabelRenderer>
          <div
            className="edge-label"
            style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
          >
            {data.latencyMs}ms
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

---

### Part 3 — Auto-Layout with Dagre

```typescript
// positions nodes automatically — no manual x/y coordinates
import Dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction: "LR" | "TB" = "LR") {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 });

  nodes.forEach(node => g.setNode(node.id, { width: 160, height: 72 }));
  edges.forEach(edge => g.setEdge(edge.source, edge.target));
  Dagre.layout(g);

  return {
    nodes: nodes.map(node => {
      const { x, y } = g.node(node.id);
      return { ...node, position: { x: x - 80, y: y - 36 } };  // center → top-left
    }),
    edges,
  };
}

// Usage:
const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
  () => getLayoutedElements(traceNodes, traceEdges, "LR"),
  [traceNodes, traceEdges]
);
```

---

### Part 4 — RTK Query: Trace Fetching

```typescript
// createApi endpoint that transforms flat OpenTelemetry spans → React Flow graph
export const traceApi = createApi({
  reducerPath: "traceApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/observability/" }),
  endpoints: (builder) => ({

    getTrace: builder.query<LLMTrace, string>({
      query: (traceId) => `traces/${traceId}`,

      transformResponse: (spans: LLMSpan[]): LLMTrace => {
        // Build parent-child relationships from span parentId
        const spanMap = new Map(spans.map(s => [s.spanId, s]));

        const nodes = spans.map(span => ({
          id:       span.spanId,
          type:     inferNodeType(span),   // "llm" | "tool" | "retrieval" | ...
          position: { x: 0, y: 0 },       // dagre sets final positions
          data: {
            model:        span.attributes["gen_ai.request.model"],
            latencyMs:    span.endTime - span.startTime,
            inputTokens:  span.attributes["gen_ai.usage.prompt_tokens"],
            outputTokens: span.attributes["gen_ai.usage.completion_tokens"],
            cost:         span.attributes["gen_ai.usage.cost_usd"],
            status:       inferStatus(span),
          },
        }));

        const edges = spans
          .filter(s => s.parentSpanId)
          .map(s => ({
            id:     `${s.parentSpanId}-${s.spanId}`,
            source: s.parentSpanId!,
            target: s.spanId,
            type:   "perf",
            data:   { status: inferStatus(s) },
          }));

        return {
          id: spans[0].traceId,
          nodes, edges,
          totalLatencyMs:    computeTotalLatency(spans),
          totalCost:         spans.reduce((s, sp) => s + (sp.attributes["gen_ai.usage.cost_usd"] ?? 0), 0),
          totalInputTokens:  spans.reduce((s, sp) => s + (sp.attributes["gen_ai.usage.prompt_tokens"] ?? 0), 0),
          totalOutputTokens: spans.reduce((s, sp) => s + (sp.attributes["gen_ai.usage.completion_tokens"] ?? 0), 0),
        };
      },
    }),
  }),
});
```

---

### Three Trace Scenarios

#### Trace 1: RAG Pipeline
```
[User Query] → [Embedding] → [Vector Search] → [Reranker] → [Context Build] → [Generation LLM] → [Response]
             ↘ [Query Router] → [Query Expand] ↗
Total: 2.3s · $0.0393 · 3,369 input / 300 output tokens
Bottleneck: Generation LLM (gpt-4o) — 1.84s, $0.039 (99% of cost)
```

#### Trace 2: Agent Loop (Tool Use)
```
[User Task] → [Planner LLM] → [Web Search ×2] → [Aggregator] → [Response LLM] → [Final Answer]
                            ↘ [Code Executor] ✗ → [Error Fix LLM] ↗
Total: 6.0s · $0.0783 · 6,260 input / 860 output tokens
Bottleneck: Code Executor (error) + Response LLM (slow, $0.068)
```

#### Trace 3: Cache + Retry
```
[User Query] → [Semantic Cache] (HIT — 8ms) → [Cache Merge] → [Response]
             ↘ [Embedding] → [LLM timeout ✗] → [LLM retry #1] ↗
Total: 31.6s (dominated by timeout) · $0.026
Insight: Cache hit path serves in 8ms; timeout recovery path: 31.6s
```

---

### Interview Q&A

#### Q: React Flow vs D3 vs custom SVG — khi nào dùng cái nào?

```
D3.js:
  ✅ Maximum control — any visual, any layout
  ✅ Force simulation, geographic projections, complex math
  ❌ Imperative, verbose, hard to integrate with React state
  ❌ Must manage DOM manually (or use d3-selection + refs)
  Use for: data science dashboards, geographic maps, custom physics

React Flow (@xyflow/react):
  ✅ React-native — nodes are React components (full JSX, hooks)
  ✅ Built-in: pan/zoom, minimap, controls, edge routing
  ✅ TypeScript NodeProps<T>/EdgeProps<T> — fully typed custom nodes
  ✅ Handles all mouse/touch interaction and viewport math
  ❌ Learning curve for custom layouts (needs dagre/ELK)
  ❌ Bundle size: ~350kB gzip
  Use for: flow builders, trace diagrams, pipeline editors, org charts

Custom SVG (what this demo does without the library):
  ✅ Zero dependencies — just React + SVG
  ✅ Full control, minimal bundle
  ❌ Must implement: hit testing, pan/zoom, edge routing, minimap
  Use for: simple graphs, fixed layouts, bundle-size-critical apps
```

#### Q: Dagre vs ELK layout — difference?

```
Dagre (@dagrejs/dagre):
  → Layered graph layout (Sugiyama method)
  → Best for DAGs (directed acyclic graphs) — pipelines, traces
  → Fast: O(n log n), suitable for real-time layout
  → Supports: LR, TB, RL, BT directions
  → Size: ~130kB gzip

Eclipse Layout Kernel (elkjs):
  → More algorithms: layered, force, orthogonal, box
  → Better for complex nested graphs
  → Slower: not suitable for real-time animation
  → Supports compound nodes (nested subgraphs)
  → Size: ~400kB gzip

For LLM traces (DAG, medium size, needs LR layout):
  → Dagre is the right choice: fast, deterministic, great for pipelines
```


---

## Case Management — Financial Investigation Platform (Greenfield)

> **Context:** "Led frontend development for Case Management, a greenfield financial investigation platform—driving architecture, setting frontend direction, and aligning cross-functional teams for scalable, maintainable delivery." Demo: [`CaseManagementDemo.tsx`](../packages/host/src/CaseManagementDemo.tsx)

---

### Platform Overview

```
Domain: Financial Crime Compliance (FinCrime / AML)
Cases handled:
  AML   — Anti-Money Laundering alerts (structuring, layering, integration)
  SAR   — Suspicious Activity Reports (regulatory filing to FinCEN)
  FRAUD — Account takeover, card fraud, APP fraud
  OFAC  — Office of Foreign Assets Control sanctions screening
  KYC   — Know Your Customer / Enhanced Due Diligence

Users:
  Investigator         — owns and works assigned cases
  Supervisor           — assigns, escalates, reviews team cases
  Compliance Officer   — closes cases, signs off on SAR filings
  Auditor              — read-only access (no financial data)

Case lifecycle:
  New → Assigned → Under Investigation → Escalated → Pending Review → Closed
  (XState state machine enforces valid transitions at compile time)

Scale:
  50,000+ cases per tenant
  4 domain teams: Case Management, Entity Graph, Reporting, Administration
  6-month greenfield build to production
```

---

### Architecture Summary

```
Host Shell (Module Federation)
├── case-management  ← this platform (owns Case domain)
│   ├── /cases                  — list + filters
│   ├── /cases/:id              — detail with tabs (overview, evidence, timeline, entities)
│   ├── /cases/:id/entities     — entity graph (linked persons, accounts, transactions)
│   └── /cases/:id/report       — SAR/STR report generator
├── entity-graph                — force-directed graph of entity relationships
├── reporting                   — dashboards, SLA metrics, batch exports
└── administration              — user management, role assignment, audit logs

Shared NPM packages:
  @casemgmt/ui        — component library (Button, Badge, DataTable, Timeline, Modal)
  @casemgmt/auth      — JWT parsing, usePermissions hook, role guards
  @casemgmt/api-types — shared TypeScript types (InvestigationCase, CaseEntity, etc.)
```

---

### Part 1 — RTK Query: Case API

```typescript
// Optimistic status transition — UI updates before server responds
transitionStatus: builder.mutation<InvestigationCase, { id: string; status: CaseStatus }>({
  query: ({ id, status }) => ({
    url: `${id}/transitions`,
    method: "POST",
    body: { status },
  }),
  invalidatesTags: (result, err, { id }) => [
    { type: "Case", id },
    "CaseList",
  ],
  async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
    // 1. Immediately update UI (optimistic)
    const patch = dispatch(
      caseApi.util.updateQueryData("getCase", id, (draft) => {
        draft.status = status;
      })
    );
    try {
      await queryFulfilled;  // 2. Wait for server
    } catch {
      patch.undo();           // 3. Roll back if server errors
    }
  },
}),
```

---

### Part 2 — XState Case Workflow

```typescript
// State machine — invalid transitions are TypeScript errors, not runtime bugs
export const caseWorkflowMachine = createMachine({
  id: "caseWorkflow", initial: "new",
  states: {
    new:           { on: { ASSIGN:        { target: "assigned",     guard: hasAssignee } } },
    assigned:      { on: { START_REVIEW:  { target: "underReview"                    } } },
    underReview:   { on: { ESCALATE:      { target: "escalated"                       },
                           SUBMIT_REVIEW: { target: "pendingReview"                   } } },
    escalated:     { on: { SUBMIT_REVIEW: { target: "pendingReview"                   } } },
    pendingReview: { on: { CLOSE_FILED:   { target: "closedSubstantiated"              },
                           CLOSE_CLEAR:   { target: "closedClear"                     } } },
    closedSubstantiated: { type: "final" },
    closedClear:         { type: "final" },
  },
});

// @xstate/test generates test paths automatically:
const testModel = createModel(caseWorkflowMachine).withEvents({
  ASSIGN:        () => ({ assigneeId: "user-1" }),
  START_REVIEW:  () => ({}),
  ESCALATE:      () => ({ reason: "Potential structuring" }),
  SUBMIT_REVIEW: () => ({}),
  CLOSE_FILED:   () => ({}),
});
// Generates: 4 paths covering all states and transitions
```

---

### Part 3 — RBAC Permission Hooks

```typescript
// Permission driven by JWT role claims — no client-side trust
export function useCasePermissions(caseData, currentUser): CasePermissions {
  return useMemo(() => {
    const { role, userId } = currentUser;
    const isOwner  = caseData.assigneeId === userId;
    const isClosed = caseData.status.startsWith("closed");

    return {
      canEdit:          !isClosed && (role === "supervisor" || (role === "investigator" && isOwner)),
      canTransition:    !isClosed && role !== "auditor",
      canEscalate:      role === "supervisor" && caseData.status === "under-review",
      canClose:         role === "compliance-officer" && caseData.status === "pending-review",
      canViewFinancials: role !== "auditor",      // data classification: auditors excluded
      canAssign:        role === "supervisor" || role === "compliance-officer",
    };
  }, [caseData, currentUser]);
}
```

---

### Part 4 — TanStack Virtual (50k cases)

```typescript
// Without virtualization: 50,000 DOM rows → 15s paint, 40ms+ scroll frames
// With TanStack Virtual: ~10 DOM rows rendered regardless of list size → 60fps

const rowVirtualizer = useVirtualizer({
  count:           caseCount,
  getScrollElement: () => parentRef.current,
  estimateSize:    () => 56,    // row height px
  overscan:        5,           // pre-render 5 rows above/below viewport
});

// Auto-fetch next page when last visible row enters viewport:
useEffect(() => {
  const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
  if (lastItem?.index >= loadedCases.length - 1 && hasNextPage) {
    fetchNextPage();
  }
}, [rowVirtualizer.getVirtualItems()]);
```

---

### Architecture Decision Records

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Adopt RTK Query for all server state | Accepted |
| ADR-002 | Use XState for case workflow state machine | Accepted |
| ADR-003 | Module federation: each domain is a separate MFE | Accepted |
| ADR-004 | TanStack Virtual for case list — reject React Window | Accepted |

#### ADR-001 Rationale (RTK Query over React Query / SWR)
- Project already uses Redux for complex local state → one store, one DevTools
- Tag-based cache invalidation fits case relationships (update one case → invalidate list)
- Built-in optimistic updates with undo — critical for status transitions
- `createEntityAdapter` normalises 50k+ cases for O(1) by-ID lookups

#### ADR-002 Rationale (XState over boolean flags)
- 7 statuses × role-based guards → 35+ conditional checks scattered in components
- XState: all valid transitions in one definition → impossible to reach invalid state
- `@xstate/test` generates test coverage for all paths automatically
- Visual diagram auto-generated from machine → living documentation for Compliance team

---

### Cross-Functional Alignment Process

```
RFC process I introduced:
  1. Engineering proposes change as markdown RFC in /docs/rfc
  2. 72-hour comment window — Product, Design, Backend, QA weigh in
  3. Decision recorded as ADR in /docs/adr
  4. ADR linked from PR that implements the decision

Teams aligned:
  ↔ Backend: agreed API contract (OpenAPI spec first, then implementation)
  ↔ Design: established component tokens → shared-ui library driven from Figma
  ↔ Compliance/Legal: data classification rules → RBAC permission model
  ↔ QA: agreed test pyramid (unit 70%, integration 20%, E2E 10%)
  ↔ DevOps: agreed deployment independence (each MFE has own pipeline)
```


---

## Core Product Features — Audit Trail, Documents, Mapbox, CI/CD

> **Context:** "Built core product features including audit trail, document upload and verification, and Mapbox-powered location mapping using React, React Query, Tailwind, Auth0, and API middleware; established a robust testing and CI/CD pipeline with Storybook, Jest/RTL, Playwright, and GitHub Actions." Demo: [`CoreProductDemo.tsx`](../packages/host/src/CoreProductDemo.tsx)

---

### Tech Stack

```
Frontend:    React 18 · React Query v5 · Tailwind CSS · Auth0 SPA SDK
Mapping:     react-map-gl · Mapbox dark-v11 style · GeoJSON FeatureCollection
Testing:     Jest + React Testing Library · Playwright · Storybook 8 · Chromatic
CI/CD:       GitHub Actions — parallel jobs (unit / E2E / Storybook) → staged deploy
API:         axios + interceptor middleware (Auth0 JWT attach + silent refresh)
```

---

### Part 1 — React Query + Auth0 API Middleware

```typescript
// axios interceptor — attaches current Auth0 token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await auth0.getTokenSilently();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 recovery — silent renew via Auth0 hidden iframe
apiClient.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await auth0.getTokenSilently({ cacheMode: "off" });
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);

// Document upload — presigned S3 URL pattern (no backend bandwidth cost)
const useUploadDocument = () => useMutation({
  mutationFn: async ({ file, type, locationId }) => {
    // 1. Get pre-signed URL from backend
    const { uploadUrl, documentId } = await apiClient.post("/documents/presign", { name: file.name, type, locationId }).then(r => r.data);
    // 2. Upload directly to S3
    await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
    // 3. Confirm — triggers verification pipeline
    return apiClient.post(`/documents/${documentId}/confirm`).then(r => r.data);
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
});
```

---

### Part 2 — Mapbox / react-map-gl

```tsx
// GeoJSON-driven location map with clustering
import Map, { Marker, Popup, Layer, Source } from "react-map-gl";

// All locations as GeoJSON FeatureCollection
const geojson: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: locations.map(loc => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
    properties: { id: loc.id, status: loc.status, type: loc.type },
  })),
};

// Cluster layer — auto-groups overlapping pins at low zoom
const clusterLayer = {
  id: "clusters", type: "circle", source: "locations",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get","point_count"], "#818cf8", 10, "#6366f1", 30, "#4f46e5"],
    "circle-radius": ["step", ["get","point_count"], 18, 10, 24, 30, 30],
  },
};

// Pin click → popup with document count + status
{selectedLoc && (
  <Popup latitude={selectedLoc.lat} longitude={selectedLoc.lng} onClose={close} anchor="bottom">
    <LocationPopup location={selectedLoc} />
  </Popup>
)}
```

---

### Part 3 — Document Verification Workflow

```
Upload states:
  drag-and-drop → presigned S3 URL fetch → direct S3 upload → backend confirm

Document statuses:
  pending    → newly uploaded, awaiting review
  in-review  → reviewer has opened the document
  verified   → reviewer confirmed valid
  rejected   → rejected with reason text (user must resubmit)

Audit trail: every status change appended to immutable append-only log
  → server-signed timestamps (cannot be backdated or edited)
  → stored in separate append-only audit DB table
```

---

### Part 4 — Audit Trail Design

```typescript
// Append-only audit event — never edited or deleted (regulatory requirement)
interface AuditEntry {
  id:        string;
  traceId:   string;          // distributed trace correlation
  category:  "auth" | "document" | "location" | "data" | "system";
  action:    string;          // human-readable: "Document status → Verified"
  actor:     string;          // user email or "system (auto-verify)"
  target:    string;          // document name, location name, etc.
  timestamp: string;          // server-generated ISO 8601, never client-supplied
  meta:      Record<string, string>; // key-value context (field, old, new values)
  signature: string;          // HMAC-SHA256 of (id + traceId + actor + timestamp)
}

// Backend enforces immutability:
//   DB table: INSERT only, no UPDATE/DELETE permissions for app role
//   Application-level check: any attempt to modify → 403 + alert
//   Audit of the audit: modifications to audit table are themselves logged
```

---

### Part 5 — Testing Strategy

#### Test Pyramid
```
Unit tests (Jest):     70% — pure functions, hooks, utilities
Component tests (RTL): 20% — rendering, user interaction, accessibility
E2E tests (Playwright): 10% — critical paths (upload, verify, map interaction)
Visual tests (Chromatic): Storybook stories → pixel-diff on every PR
```

#### Custom renderWithProviders
```typescript
// test-utils.tsx — wraps all tests with required providers
export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Auth0Provider domain="test" clientId="test">
        <MemoryRouter>{ui}</MemoryRouter>
      </Auth0Provider>
    </QueryClientProvider>
  );
}
// Usage: renderWithProviders(<DocumentUpload />) — no boilerplate in every test
```

#### MSW for API mocking (Jest + Playwright)
```typescript
// Setup once — all tests use same handler definitions
server.use(
  http.post("/api/documents/presign",
    () => HttpResponse.json({ uploadUrl: "https://s3.aws/...", documentId: "doc-99" })),
  http.put("https://s3.aws/...",
    () => new HttpResponse(null, { status: 200 })),
);
// Tests run in Node, browser, Playwright — MSW works in all three environments
```

---

### Part 6 — GitHub Actions CI/CD

```
Jobs (run in parallel):
  unit:      pnpm test --coverage --ci              → ≥80% coverage gate
  e2e:       playwright install → pnpm e2e          → 38 critical path scenarios
  storybook: pnpm storybook:build → chromatic       → visual regression baseline

All 3 must pass before deploy job runs.
Deploy:     pnpm build → pnpm deploy:prod            → secrets injected from GitHub env

Metrics on main branch:
  204 unit tests   · 0 failures · 94% coverage
   38 E2E tests    · 0 failures
   67 Storybook stories · 0 visual regressions
  Pipeline runtime: avg 4m 30s (parallel)
```


---

## Engineering Best Practices — LaunchDarkly, Datadog RUM, Akamai WAF

> **Context:** "Defined engineering best practices across teams, implementing LaunchDarkly for feature flagging, Datadog RUM for monitoring, and working closely with Vercel and security teams to configure Akamai WAF." Demo: [`EngineeringPracticesDemo.tsx`](../packages/host/src/EngineeringPracticesDemo.tsx)

---

### Impact

```
Feature flagging (LaunchDarkly):
  Before: "big bang" deploys → rollback required if issue found
  After:  feature flags → zero-downtime releases, instant kill-switch

Datadog RUM:
  Before: front-end incidents detected by support tickets (avg 45 min)
  After:  Core Web Vitals + error rate alerts → detected in <5 min
  Session replay: rage clicks and frustration signals surface UX issues automatically

Akamai WAF:
  Blocks 99.7% of malicious requests before they reach Vercel origin
  SQL injection, XSS, path traversal, bot traffic, DDoS rate-limiting
```

---

### Part 1 — LaunchDarkly Feature Flags

```typescript
// Flag types implemented:
//   boolean      — simple on/off (e.g., new-dashboard-ui)
//   percentage   — gradual rollout (e.g., ai-search: 30%)
//   experiment   — A/B test with variants and weights (e.g., checkout-v2)
//   multivariate — multi-variant targeting (e.g., beta / preview)
//   kill-switch  — instant off for all users (e.g., maintenance-mode)

// SDK usage in React:
import { useFlags, useLDClient } from "launchdarkly-react-client-sdk";

function SearchBar() {
  const { "ai-search": aiSearchEnabled } = useFlags();

  return aiSearchEnabled
    ? <AISemanticSearch />
    : <KeywordSearch />;
}

// Provider setup — wraps app with user context for targeting rules:
<LDProvider clientSideID={process.env.LD_CLIENT_ID}
  context={{ kind: "user", key: user.id, email: user.email, plan: user.plan }}>
  <App />
</LDProvider>

// Targeting rules (configured in LaunchDarkly dashboard):
//   - Target beta users: user.plan === "beta" → variant "preview"
//   - Percentage rollout: 30% of user IDs → flag ON
//   - Kill switch: one click → flag OFF for all environments instantly
```

---

### Part 2 — Datadog RUM

```typescript
// Initialise Datadog RUM — call once at app entry (bootstrap.tsx)
import { datadogRum } from "@datadog/browser-rum";

datadogRum.init({
  applicationId:   process.env.DD_APPLICATION_ID!,
  clientToken:     process.env.DD_CLIENT_TOKEN!,
  site:            "datadoghq.com",
  service:         "frontend",
  env:             process.env.NODE_ENV,
  version:         process.env.NEXT_PUBLIC_APP_VERSION,

  // Session replay — record DOM mutations for frustration analysis
  sessionSampleRate:        100,
  sessionReplaySampleRate:  20,   // 20% recorded — cost-sensitive
  trackInteractions:        true,
  trackResources:           true,
  trackLongTasks:           true,

  // Privacy — mask PII in session replays
  defaultPrivacyLevel: "mask-user-input",
});

// Custom user context — enables user-scoped error investigation:
datadogRum.setUser({ id: user.id, email: user.email, plan: user.plan });

// Custom actions — track business events:
datadogRum.addAction("checkout_initiated", { cartValue: total, items: count });

// Custom errors — enriched with context:
datadogRum.addError(err, { component: "CheckoutForm", step: "payment" });

// Core Web Vitals monitored automatically:
//   LCP  — largest contentful paint → alert if p75 > 2.5s
//   INP  — interaction to next paint → alert if p75 > 200ms
//   CLS  — cumulative layout shift → alert if p75 > 0.1
//   FCP  — first contentful paint
//   TTFB — time to first byte → correlates with Vercel Edge cold start
```

---

### Part 3 — Akamai WAF Configuration

```
Deployment topology:
  Browser → Akamai Edge (WAF + CDN + Bot Manager) → Vercel Origin

WAF rules configured:
  SQLI-001  Block  SQL injection patterns in query params and POST body
  XSS-002   Block  Cross-site scripting (encoded and unencoded)
  PT-001    Block  Path traversal (../etc/passwd, %2e%2e patterns)
  BOT-004   Challenge  JS-incapable user agents (curl, python-requests)
  RL-10s    Rate-limit  >100 requests/10s per IP on /api/* routes

Bot Manager settings:
  - Good bots (Googlebot, Bingbot) → allow
  - Credential-stuffing bots → block
  - Scrapers/headless Chrome without nav history → challenge

Security headers enforced at Vercel edge (vercel.json):
  X-Content-Type-Options:  nosniff
  X-Frame-Options:         DENY
  Referrer-Policy:         strict-origin-when-cross-origin
  Permissions-Policy:      camera=(), microphone=(), geolocation=()
  Content-Security-Policy: strict-dynamic, nonce-based (no unsafe-inline)
```

---

### Part 4 — Engineering Best Practices Defined

| Area | Standard |
|---|---|
| **PR process** | ≥1 approval · no Friday deploys · PR template · squash merge |
| **Definition of Done** | Cross-browser · WCAG 2.1 AA · unit + e2e tests · Storybook story · feature flag for medium+ risk |
| **Branching** | feat/* → main (Vercel auto-deploy) · preview URL per PR · release freeze Fri→Mon |
| **Security baseline** | Akamai WAF · CSP nonce · Dependabot · CodeQL SAST · no secrets in code |
| **Monitoring** | Datadog RUM alert for every new metric · Core Web Vitals budget gates in CI |
| **Feature risk** | Medium/high risk features must be behind LaunchDarkly flag before merge |


---

## A/B Experimentation — Led Experiments, Analytics Collaboration, Results Presentation

> **Context:** "Led experimentation — ran A/B tests, worked with analytics team to analyze and present outcomes." Demo: [`ExperimentationDemo.tsx`](../packages/host/src/ExperimentationDemo.tsx)

---

### Impact — 2024 Experimentation Programme

```
6 experiments run   · Win rate: 50% (3 winners)   · Avg lift from winners: +14.5%
Checkout CTA:       +8.3% purchase CVR    → +$43k/month MRR
Onboarding flow:    +23.1% completion     → +18% 30-day activation
Pricing display:    +12.1% annual upgrade → +$87k/month ARR
Homepage video:     -2.1% demo requests   → shipped control (learnt: video hurts mobile)
```

---

### Part 1 — Experiment Design (Hypothesis Framework)

Every experiment uses the HEART metric framework and a structured hypothesis doc written **before** any code:

```
HEART framework (Google):
  Happiness      — satisfaction scores, NPS
  Engagement     — DAU, session depth, feature adoption
  Adoption       — signup CVR, first-action completion
  Retention      — D7, D30 retention
  Task success   — conversion rate, error rate, time on task

Hypothesis template:
  Signal:      What behaviour are we measuring?
  Metric:      Countable primary metric (one per experiment)
  Change:      What will we change and why?
  Expectation: We expect [metric] to [increase] by [X%] within [N days]
  Assumption:  We assume [user belief] based on [evidence source]
  Guardrails:  Metrics that must NOT regress (revenue, AOV, page speed)
```

---

### Part 2 — Statistical Methods

```typescript
// Power analysis — sample size before running the experiment
function calculateSampleSize({ baselineRate, mde, alpha = 0.05, power = 0.8 }) {
  // Two-proportion z-test, two-tailed
  // Returns: required n per variant
}
// exp-001: baseline=3.2%, MDE=5%, → 44,720 users per arm (14 days)

// Statistical significance — two-proportion z-test
function computeZTest(nCtrl, xCtrl, nTreat, xTreat) {
  // → z-score, p-value (two-tailed), 95% CI for relative lift
}
// exp-001: z=2.28, p=0.023, CI=[+2.1%, +14.6%] → ✅ Significant

// SRM check (Sample Ratio Mismatch) — always run before analysis
function checkSRM(nControl, nTreatment, expectedRatio = 0.5) {
  // Chi-squared test: if p < 0.01 → SRM detected → block analysis
  // exp-001: ratio=50.27%/49.73%, chi2=3.44, p=0.064 → No SRM ✅
}
```

---

### Part 3 — Experiment Results Summary

| Experiment | Metric | Lift | p-value | 95% CI | Decision |
|---|---|---|---|---|---|
| Checkout CTA (green vs blue) | Purchase CVR | **+8.3%** | 0.023 | [+2.1%, +14.6%] | ✅ Ship treatment |
| Onboarding 3-step vs 5-step | Completion rate | **+23.1%** | 0.001 | [+17.4%, +28.8%] | ✅ Ship treatment |
| Pricing annual-first | Annual selection | **+12.1%** | 0.031 | [+4.2%, +20.3%] | ✅ Ship treatment |
| Homepage hero video | Demo request rate | **-2.1%** | 0.048 | [-4.1%, -0.2%] | ❌ Ship control |
| AI search autocomplete | Search success | +4.1% | 0.14 | [-1.3%, +9.8%] | 🔄 Still running |
| Email timing 10am vs 2pm | Open rate | +3.1% | 0.21 | [-2.4%, +8.8%] | — Inconclusive |

---

### Part 4 — Presenting Results to Analytics & Stakeholders

```
Collaboration workflow:
  1. Engineer writes hypothesis doc → reviewed by PM + data analyst
  2. Analyst instruments tracking (Segment events, Amplitude funnels)
  3. Engineer implements flag-driven variant via LaunchDarkly
  4. Analyst builds live dashboard (Amplitude / Looker) for daily monitoring
  5. Daily sync during experiment — review SRM, segment breakdowns, guardrails
  6. On conclusion: analyst runs final z-test, produces confidence intervals
  7. Engineer + PM present 1-pager to leadership with: decision, impact, next steps

1-pager format (presented to leadership):
  ┌─ Experiment name · Team · Duration · Decision: [SHIP/HOLD/ITERATE] ─┐
  │ Hypothesis (1 sentence)                                              │
  │ Result: lift + p-value + CI                                          │
  │ Revenue / business impact (extrapolated at current scale)            │
  │ Key insights (segments, unexpected effects)                          │
  │ Recommendation + guardrail status                                    │
  │ Next experiments from this learning                                  │
  └──────────────────────────────────────────────────────────────────────┘
```


---

## REST + Webhooks → GraphQL Migration

> **Context:** "Migration from webhooks to GraphQL on the FE." Demo: [`GraphQLMigrationDemo.tsx`](../packages/host/src/GraphQLMigrationDemo.tsx)

---

### Impact

```
Latency:        455ms (5 requests, waterfall) → 195ms (1 query)  = -57%
Bandwidth:      78% reduction (over-fetching eliminated)
Type coverage:  0% runtime-safe → 100% (graphql-codegen from schema)
Infrastructure: webhook receiver service + Redis Pub/Sub + Socket.IO removed
Real-time:      5s polling (12 req/min/user) → WebSocket subscription (push only)
```

---

### Migration — 5 Phases

| Phase | What | Duration |
|---|---|---|
| **1 — Schema + Codegen** | Schema design with backend, `graphql-codegen` setup, auto-generated TS types + typed hooks | Week 1–2 |
| **2 — Apollo + Adapter** | Apollo Client with auth link + InMemoryCache; adapter layer so consumers don't change | Week 2–3 |
| **3 — Queries (N+1 → 1)** | Replace cascading REST calls with single nested query (DataLoader server-side) | Week 3–5 |
| **4 — Mutations + Optimistic UI** | `useMutation` with `optimisticResponse` — 20 lines of manual state → 4 lines, auto-rollback | Week 5–6 |
| **5 — Subscriptions (webhooks → WS)** | `useSubscription` replaces webhook receiver + Redis Pub/Sub + polling | Week 6–7 |

---

### Part 1 — The N+1 Problem

```typescript
// ❌ Before: 5 HTTP requests (waterfall, 455ms)
const user   = await fetch("/api/users/me");           // 120ms
const orders = await fetch(`/api/users/${id}/orders`); // 180ms (after user)
const items  = await Promise.all(
  orders.map(o => fetch(`/api/orders/${o.id}/items`))  // 155ms each (after orders)
);
// Total: sequential + parallel N fetches

// ✅ After: 1 GraphQL query (195ms)
const { data } = useQuery(gql`
  query GetDashboard($userId: ID!) {
    user(id: $userId) {
      id name email
      orders { id total status items { id name qty } }
    }
  }
`, { variables: { userId } });
```

---

### Part 2 — Type Safety via Codegen

```yaml
# codegen.yml — runs in watch mode during dev, in CI on every build
schema: https://api.example.com/graphql
generates:
  src/__generated__/graphql.ts:
    plugins: [typescript, typescript-operations, typed-document-node]
```

```typescript
// ❌ Before: manual cast, no guarantee
const user: UserResponse = await fetch("/api/users/me").then(r => r.json());
user.data.user_id; // snake_case, could be wrong, no autocomplete

// ✅ After: auto-generated, always matches schema
const { data } = useGetUserQuery({ variables: { id } });
data.user.name; // IDE autocomplete, type error if field doesn't exist, never stale
```

---

### Part 3 — Subscriptions vs Webhooks

```typescript
// ❌ Before: webhook receiver (separate Express service, 200+ lines)
app.post("/webhooks/orders", verifyHmacSignature(SECRET), async (req, res) => {
  await redis.publish("orders", JSON.stringify(req.body));
  res.status(200).end();
});
// + Redis Pub/Sub config + Socket.IO + retry queue + ngrok in dev + HMAC verification

// ✅ After: useSubscription (0 extra infrastructure)
const ORDER_SUB = gql`subscription OnOrderUpdate($userId: ID!) {
  orderUpdated(userId: $userId) { id status total }
}`;

useSubscription(ORDER_SUB, {
  variables: { userId },
  onData: ({ client, data }) => {
    // Apollo auto-updates normalised cache → all watching queries update instantly
  },
});
```

