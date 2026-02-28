# Next.js Server & Client Components — Deep Dive!

> **Chủ đề**: Server và Client Components trong Next.js App Router
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/getting-started/server-and-client-components

---

## Mục Lục

1. [§1. Tổng Quan](#1)
2. [§2. Khi Nào Dùng Server vs Client Components?](#2)
3. [§3. Cách Hoạt Động — Server, First Load, Subsequent](#3)
4. [§4. "use client" Directive](#4)
5. [§5. Giảm JS Bundle Size](#5)
6. [§6. Truyền Data: Server → Client](#6)
7. [§7. Interleaving — Xen Kẽ Server & Client](#7)
8. [§8. Context Providers](#8)
9. [§9. Chia Sẻ Data — React.cache + Context](#9)
10. [§10. Third-party Components](#10)
11. [§11. Preventing Environment Poisoning](#11)
12. [§12. Tự Viết — RSC Renderer Engine](#12)
13. [§13. Tự Viết — Component Tree Resolver](#13)
14. [§14. Tổng Kết & Câu Hỏi Luyện Tập](#14)

---

## §1. Tổng Quan!

```
  SERVER & CLIENT COMPONENTS — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  MẶC ĐỊNH: Layouts & Pages = SERVER Components!       │
  │                                                        │
  │  SERVER COMPONENTS:                                    │
  │  → Fetch data, render UI TRÊN SERVER                  │
  │  → Cache kết quả, stream tới client                  │
  │  → KHÔNG gửi JS xuống browser!                       │
  │                                                        │
  │  CLIENT COMPONENTS:                                    │
  │  → Cần interactivity (onClick, useState)              │
  │  → Cần browser APIs (localStorage, window)            │
  │  → Đánh dấu bằng 'use client'                        │
  │                                                        │
  │  KẾT HỢP CẢ HAI:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Server Component (Page)                         │  │
  │  │  ├── Server Component (Header)                   │  │
  │  │  ├── Client Component (SearchBar) ← 'use client' │  │
  │  │  ├── Server Component (Content)                  │  │
  │  │  └── Client Component (LikeButton) ← 'use client'│  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Khi Nào Dùng Server vs Client Components?

```
  KHI NÀO DÙNG?
  ┌─────────────────────────┬──────────────────────────┐
  │   CLIENT Components     │   SERVER Components      │
  │   ('use client')        │   (mặc định)             │
  ├─────────────────────────┼──────────────────────────┤
  │ State (useState)        │ Fetch data từ DB/API     │
  │ Event handlers          │ Giữ secrets (API keys)   │
  │ (onClick, onChange)     │ Giảm JS gửi browser     │
  │ Lifecycle (useEffect)   │ Cải thiện FCP            │
  │ Browser APIs            │ Stream content           │
  │ (localStorage, window)  │ progressively            │
  │ Custom hooks            │                          │
  └─────────────────────────┴──────────────────────────┘

  VÍ DỤ THỰC TẾ — KẾT HỢP:
  ┌──────────────────────────────────────────────────┐
  │  <Page> — SERVER Component                       │
  │  │ → async function, fetch data từ DB           │
  │  │ → KHÔNG gửi JS xuống client                 │
  │  │                                               │
  │  │  ┌─── <LikeButton> — CLIENT Component ───┐   │
  │  │  │  'use client'                          │   │
  │  │  │  → useState cho count                  │   │
  │  │  │  → onClick handler                     │   │
  │  │  │  → Nhận likes qua props                │   │
  │  │  └────────────────────────────────────────┘   │
  │  │                                               │
  │  │  Data flow: Server fetch → props → Client    │
  └──────────────────────────────────────────────────┘
```

**Code ví dụ**:

```typescript
// app/blog/[id]/page.tsx — SERVER Component (mặc định)
import LikeButton from '@/app/ui/like-button'
import { getPost } from '@/lib/data'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPost(id) // Fetch trên SERVER!
  return (
    <div>
      <h1>{post.title}</h1>
      <LikeButton likes={post.likes} /> {/* Truyền data qua props */}
    </div>
  )
}
```

```typescript
// app/ui/like-button.tsx — CLIENT Component
'use client'
import { useState } from 'react'

export default function LikeButton({ likes }: { likes: number }) {
  const [count, setCount] = useState(likes)
  return <button onClick={() => setCount(count + 1)}>{count} likes</button>
}
```

---

## §3. Cách Hoạt Động — Server, First Load, Subsequent!

```
  3 GIAI ĐOẠN RENDERING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① ON THE SERVER:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Rendering chia theo route segments              │  │
  │  │                                                  │  │
  │  │  Server Components → RSC Payload                │  │
  │  │  (compact binary representation)                │  │
  │  │                                                  │  │
  │  │  RSC Payload + Client Components → HTML         │  │
  │  │  (pre-render cho fast preview)                   │  │
  │  │                                                  │  │
  │  │  RSC Payload CHỨA:                               │  │
  │  │  → Rendered result của Server Components        │  │
  │  │  → Placeholders cho Client Components           │  │
  │  │  → References tới JS files của Client           │  │
  │  │  → Props truyền Server → Client                 │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② ON THE CLIENT (FIRST LOAD):                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Bước 1: HTML → hiện NGAY (non-interactive)     │  │
  │  │  Bước 2: RSC Payload → reconcile component tree │  │
  │  │  Bước 3: JS → HYDRATE Client Components        │  │
  │  │          → gắn event handlers → INTERACTIVE!    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ SUBSEQUENT NAVIGATIONS:                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → RSC Payload prefetched + cached              │  │
  │  │  → Client Components render ON CLIENT           │  │
  │  │  → KHÔNG CẦN server-rendered HTML              │  │
  │  │  → Navigate INSTANT!                            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SƠ ĐỒ FLOW:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ SERVER                      CLIENT               │  │
  │  │ ──────                      ──────               │  │
  │  │ Server Components           ┌─ First Load ────┐  │  │
  │  │   ↓ render                  │ HTML → preview   │  │  │
  │  │ RSC Payload ──────────────→ │ RSC → reconcile  │  │  │
  │  │   ↓                         │ JS  → hydrate    │  │  │
  │  │ HTML ─────────────────────→ │     → interactive │  │  │
  │  │                              └──────────────────┘  │  │
  │  │                              ┌─ Navigate ──────┐  │  │
  │  │ RSC Payload ──────────────→ │ From cache       │  │  │
  │  │ (prefetched)                │ Client render    │  │  │
  │  │                              │ No HTML needed   │  │  │
  │  │                              └──────────────────┘  │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────┘
```

**Hydration là gì?**

- React gắn **event handlers** vào DOM đã có sẵn (từ HTML)
- Biến HTML tĩnh → interactive app!
- Chỉ Client Components cần hydrate

---

## §4. "use client" Directive!

```
  "use client" — RANH GIỚI SERVER/CLIENT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  'use client' đặt ở ĐẦU FILE, trên imports!          │
  │                                                        │
  │  CÁCH HOẠT ĐỘNG:                                       │
  │  → Khai báo BOUNDARY giữa Server & Client            │
  │  → File + TẤT CẢ imports của nó = CLIENT bundle      │
  │  → KHÔNG cần thêm 'use client' cho mỗi child!       │
  │                                                        │
  │  SƠ ĐỒ — MODULE GRAPH:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  page.tsx (Server)                               │  │
  │  │  ├── header.tsx (Server)                         │  │
  │  │  ├── logo.tsx (Server)                           │  │
  │  │  └── search.tsx ← 'use client' ← BOUNDARY!     │  │
  │  │      ├── input.tsx (Client — tự động!)          │  │
  │  │      └── dropdown.tsx (Client — tự động!)       │  │
  │  │                                                  │  │
  │  │  Khi search.tsx có 'use client':                 │  │
  │  │  → input.tsx & dropdown.tsx TỰ ĐỘNG = Client    │  │
  │  │  → KHÔNG cần thêm directive!                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
'use client'  // ← Boundary! Mọi thứ dưới đây = Client
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>{count} likes</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

---

## §5. Giảm JS Bundle Size!

```
  GIẢM BUNDLE — CHỈ 'use client' CHO INTERACTIVE PARTS:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  ❌ SAI — Toàn bộ layout = Client:              │
  │  'use client' // toàn bộ → gửi TẤT CẢ JS!    │
  │  export default function Layout() { ... }       │
  │                                                  │
  │  ✅ ĐÚNG — Chỉ Search = Client:                │
  │  Layout (Server) → Logo (Server) + Search (CC) │
  │  → Chỉ Search gửi JS → bundle NHỎ hơn!       │
  └──────────────────────────────────────────────────┘
```

```typescript
// Layout = Server Component (mặc định!)
import Search from './search'  // Client
import Logo from './logo'      // Server — KHÔNG gửi JS!

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Logo />     {/* Server — 0 bytes JS! */}
        <Search />   {/* Client — chỉ phần này gửi JS */}
      </nav>
      <main>{children}</main>
    </>
  )
}
```

---

## §6. Truyền Data: Server → Client!

```
  TRUYỀN DATA QUA PROPS:
  ┌──────────────────────────────────────────────────┐
  │  Server Component → fetch data                   │
  │  → truyền qua PROPS → Client Component          │
  │                                                  │
  │  ⚠️ Props PHẢI serializable!                    │
  │  → ✅ string, number, boolean, array, object    │
  │  → ❌ functions, Date, Map, Set, class          │
  │                                                  │
  │  ALTERNATIVE: Stream với use() API              │
  │  → Truyền Promise qua props                    │
  │  → Client dùng use() để resolve                 │
  └──────────────────────────────────────────────────┘
```

---

## §7. Interleaving — Xen Kẽ Server & Client!

```
  INTERLEAVING — PATTERN QUAN TRỌNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÓ THỂ truyền Server Component làm prop/children    │
  │  cho Client Component!                                │
  │                                                        │
  │  VÍ DỤ — Modal (Client) chứa Cart (Server):           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <Page> — Server                                 │  │
  │  │  └── <Modal> — Client ('use client')             │  │
  │  │      └── <Cart> — Server! (passed as children)  │  │
  │  │          → Fetch data trên server               │  │
  │  │          → Render trước khi gửi client          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  BEHIND THE SCENES:                                    │
  │  → Server render <Cart> TRƯỚC                         │
  │  → RSC Payload chứa kết quả rendered                  │
  │  → Client nhận rendered output, đặt vào <Modal>      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// modal.tsx — Client Component
'use client'
export default function Modal({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// page.tsx — Server Component
import Modal from './ui/modal'
import Cart from './ui/cart'  // Server Component!

export default function Page() {
  return (
    <Modal>
      <Cart />  {/* Server Component làm children của Client! */}
    </Modal>
  )
}
```

---

## §8. Context Providers!

```
  CONTEXT — KHÔNG HỖ TRỢ TRONG SERVER COMPONENTS:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  React Context KHÔNG dùng được trong Server!    │
  │                                                  │
  │  GIẢI PHÁP — Wrapper pattern:                   │
  │  ① Tạo Client Component provider               │
  │  ② Import vào Server layout                    │
  │  ③ Truyền children (Server Components!)        │
  │                                                  │
  │  <RootLayout> — Server                          │
  │  └── <ThemeProvider> — Client ('use client')    │
  │      └── {children} — Server Components!       │
  │                                                  │
  │  💡 TIP: Đặt provider CÀ SÂU càng tốt!       │
  │  → Wrap {children} thay vì <html> toàn bộ     │
  │  → Next.js tối ưu static parts tốt hơn!       │
  └──────────────────────────────────────────────────┘
```

```typescript
// theme-provider.tsx — Client Component
'use client'
import { createContext } from 'react'
export const ThemeContext = createContext({})

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}

// layout.tsx — Server Component
import ThemeProvider from './theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html><body>
      <ThemeProvider>{children}</ThemeProvider>  {/* Wrap sâu! */}
    </body></html>
  )
}
```

---

## §9. Chia Sẻ Data — React.cache + Context!

```
  SHARING DATA GIỮA SERVER & CLIENT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PATTERN: React.cache + Context Provider              │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Tạo cached function:                         │  │
  │  │     const getUser = cache(async () => fetch...)  │  │
  │  │                                                  │  │
  │  │  ② Tạo Context Provider (Client):               │  │
  │  │     <UserContext value={userPromise}>            │  │
  │  │     → Truyền Promise, KHÔNG await!              │  │
  │  │                                                  │  │
  │  │  ③ Layout truyền promise vào provider:           │  │
  │  │     const userPromise = getUser() // no await   │  │
  │  │     <UserProvider userPromise={userPromise}>     │  │
  │  │                                                  │  │
  │  │  ④ Client dùng use() để resolve:                │  │
  │  │     const user = use(userPromise)               │  │
  │  │                                                  │  │
  │  │  ⑤ Server gọi trực tiếp:                       │  │
  │  │     const user = await getUser() // cached!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  💡 React.cache: memoize TRONG 1 request!             │
  │  → Nhiều calls = 1 fetch duy nhất                    │
  │  → Scope: TỪNG request riêng biệt                   │
  └────────────────────────────────────────────────────────┘
```

```typescript
// lib/user.ts
import { cache } from 'react'
export const getUser = cache(async () => {
  const res = await fetch('https://api.example.com/user')
  return res.json()
})

// user-provider.tsx — Client
'use client'
import { createContext } from 'react'
type User = { id: string; name: string }
export const UserContext = createContext<Promise<User> | null>(null)

export default function UserProvider({
  children, userPromise,
}: { children: React.ReactNode; userPromise: Promise<User> }) {
  return <UserContext value={userPromise}>{children}</UserContext>
}

// layout.tsx — Server (KHÔNG await!)
import UserProvider from './user-provider'
import { getUser } from './lib/user'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userPromise = getUser()  // Don't await!
  return (
    <html><body>
      <UserProvider userPromise={userPromise}>{children}</UserProvider>
    </body></html>
  )
}

// profile.tsx — Client (dùng use() để resolve)
'use client'
import { use, useContext } from 'react'
import { UserContext } from '../user-provider'

export function Profile() {
  const userPromise = useContext(UserContext)
  if (!userPromise) throw new Error('Must be within UserProvider')
  const user = use(userPromise)  // Resolve promise!
  return <p>Welcome, {user.name}</p>
}
```

---

## §10. Third-party Components!

```
  THIRD-PARTY COMPONENTS — WRAP PATTERN:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  VẤN ĐỀ: Thư viện dùng useState nhưng         │
  │  THIẾU 'use client' directive!                  │
  │  → Import vào Server Component = ERROR!         │
  │                                                  │
  │  GIẢI PHÁP 1: Dùng trong Client Component      │
  │  'use client'                                   │
  │  import { Carousel } from 'acme-carousel'       │
  │  // Works! Vì đã ở trong Client boundary       │
  │                                                  │
  │  GIẢI PHÁP 2: Re-export wrapper                 │
  │  // carousel.tsx                                │
  │  'use client'                                   │
  │  import { Carousel } from 'acme-carousel'       │
  │  export default Carousel  // ← chỉ 2 dòng!    │
  │                                                  │
  │  → Giờ import carousel.tsx vào Server OK!      │
  │                                                  │
  │  💡 Library Authors:                            │
  │  → Thêm 'use client' vào entry points!        │
  │  → Bundler có thể strip directive!             │
  └──────────────────────────────────────────────────┘
```

---

## §11. Preventing Environment Poisoning!

```
  ENVIRONMENT POISONING — BẢO VỆ SECRETS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VẤN ĐỀ: JS modules shared giữa Server & Client     │
  │  → Có thể VÔ TÌNH import server code vào client!    │
  │  → API_KEY bị lộ ra browser!                         │
  │                                                        │
  │  NEXT.JS PROTECTION:                                   │
  │  → Chỉ NEXT_PUBLIC_ env vars → client bundle        │
  │  → Không prefix → thay bằng empty string             │
  │  → getData() chạy trên client = THẤT BẠI!           │
  │                                                        │
  │  GIẢI PHÁP — server-only package:                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  import 'server-only'  // ← dòng này!          │  │
  │  │                                                  │  │
  │  │  export async function getData() {               │  │
  │  │    // Nếu import vào Client Component            │  │
  │  │    // → BUILD-TIME ERROR!                       │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TƯƠNG TỰ: client-only package                        │
  │  → Đánh dấu code CHỈ chạy trên client               │
  │  → VD: code truy cập window object                   │
  │                                                        │
  │  💡 Next.js handle internally — optional install     │
  └────────────────────────────────────────────────────────┘
```

---

## §12. Tự Viết — RSC Renderer Engine!

> **Mục tiêu**: Mô phỏng cách Next.js render Server & Client Components — KHÔNG dùng thư viện!

```javascript
var RSCRenderer = (function () {
  // 1. COMPONENT REGISTRY
  var components = {
    Page: {
      type: "server",
      code: function (p) {
        return {
          tag: "div",
          children: [
            { tag: "h1", text: p.title },
            { ref: "LikeButton", props: { likes: p.likes } },
          ],
        };
      },
    },
    LikeButton: {
      type: "client",
      code: function (p) {
        return { tag: "button", text: p.likes + " likes", interactive: true };
      },
    },
    Header: {
      type: "server",
      code: function () {
        return { tag: "header", text: "Nav Bar" };
      },
    },
    Search: {
      type: "client",
      code: function () {
        return { tag: "input", placeholder: "Search...", interactive: true };
      },
    },
    Logo: {
      type: "server",
      code: function () {
        return { tag: "img", text: "[Logo]" };
      },
    },
    Layout: {
      type: "server",
      code: function (p) {
        return {
          tag: "main",
          children: [{ ref: "Header" }, { ref: "Search" }, p.children],
        };
      },
    },
  };

  // 2. SERVER RENDER → RSC Payload
  function renderOnServer(name, props) {
    var comp = components[name];
    if (!comp) return { error: "404: " + name };

    console.log("🖥️  Server rendering: <" + name + "> (" + comp.type + ")");

    if (comp.type === "client") {
      // Client Component → placeholder + JS reference
      return { __client: true, name: name, props: props, jsFile: name + ".js" };
    }
    var result = comp.code(props || {});
    // Recursively render children refs
    if (result.children) {
      for (var i = 0; i < result.children.length; i++) {
        var child = result.children[i];
        if (child && child.ref) {
          result.children[i] = renderOnServer(child.ref, child.props);
        }
      }
    }
    if (result.ref) return renderOnServer(result.ref, result.props);
    return result;
  }

  // 3. GENERATE HTML (pre-render)
  function generateHTML(node, indent) {
    indent = indent || "";
    if (!node) return "";
    if (node.__client)
      return (
        indent +
        "<!-- Client: " +
        node.name +
        " --><" +
        'div data-client="' +
        node.name +
        '"></' +
        "div>"
      );
    var html = indent + "<" + node.tag;
    if (node.placeholder) html += ' placeholder="' + node.placeholder + '"';
    html += ">";
    if (node.text) html += node.text;
    if (node.children) {
      html += "\n";
      for (var i = 0; i < node.children.length; i++) {
        html += generateHTML(node.children[i], indent + "  ") + "\n";
      }
      html += indent;
    }
    html += "</" + node.tag + ">";
    return html;
  }

  // 4. CLIENT HYDRATION
  function hydrateOnClient(rscPayload) {
    console.log("\n💧 HYDRATING Client Components...");
    hydrateNode(rscPayload);
    console.log("✅ Hydration complete — app is INTERACTIVE!");
  }

  function hydrateNode(node) {
    if (!node) return;
    if (node.__client) {
      var comp = components[node.name];
      if (comp) {
        var rendered = comp.code(node.props);
        console.log("  💧 Hydrate <" + node.name + "> → attach event handlers");
        if (rendered.interactive) console.log("     → interactive: true");
      }
      return;
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        hydrateNode(node.children[i]);
      }
    }
  }

  // 5. FULL DEMO
  function demo() {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║  RSC RENDERER ENGINE — DEMO              ║");
    console.log("╚══════════════════════════════════════════╝");

    console.log("\n━━━ PHASE 1: SERVER RENDERING ━━━");
    var rscPayload = renderOnServer("Page", {
      title: "Hello World",
      likes: 42,
    });
    console.log("\nRSC Payload:");
    console.log(JSON.stringify(rscPayload, null, 2));

    console.log("\n━━━ PHASE 2: HTML PRE-RENDER ━━━");
    var html = generateHTML(rscPayload);
    console.log(html);

    console.log("\n━━━ PHASE 3: CLIENT HYDRATION ━━━");
    hydrateOnClient(rscPayload);
  }

  return {
    renderOnServer: renderOnServer,
    generateHTML: generateHTML,
    hydrateOnClient: hydrateOnClient,
    demo: demo,
  };
})();
// Chạy thử: RSCRenderer.demo();
```

---

## §13. Tự Viết — Component Tree Resolver!

> **Mục tiêu**: Mô phỏng module graph, "use client" boundary, và interleaving — KHÔNG dùng thư viện!

```javascript
var ComponentTreeResolver = (function () {
  var modules = {
    "page.tsx": {
      directive: null,
      imports: ["header.tsx", "search.tsx", "content.tsx"],
    },
    "header.tsx": { directive: null, imports: ["logo.tsx", "nav-links.tsx"] },
    "logo.tsx": { directive: null, imports: [] },
    "nav-links.tsx": { directive: null, imports: [] },
    "search.tsx": {
      directive: "use client",
      imports: ["input.tsx", "dropdown.tsx"],
    },
    "input.tsx": { directive: null, imports: [] },
    "dropdown.tsx": { directive: null, imports: [] },
    "content.tsx": { directive: null, imports: ["like-button.tsx"] },
    "like-button.tsx": { directive: "use client", imports: [] },
    "modal.tsx": { directive: "use client", imports: [] },
    "cart.tsx": { directive: null, imports: [] },
    "theme-provider.tsx": { directive: "use client", imports: [] },
  };

  function resolve(file, parentBoundary) {
    var mod = modules[file];
    if (!mod) return { file: file, type: "unknown" };
    var isClient =
      mod.directive === "use client" || parentBoundary === "client";
    var type = isClient ? "CLIENT" : "SERVER";
    var result = {
      file: file,
      type: type,
      boundary: mod.directive === "use client",
      children: [],
    };
    for (var i = 0; i < mod.imports.length; i++) {
      result.children.push(resolve(mod.imports[i], isClient ? "client" : null));
    }
    return result;
  }

  function printTree(node, indent) {
    indent = indent || "";
    var marker = node.type === "CLIENT" ? "🟡" : "🟢";
    var boundary = node.boundary ? ' ← "use client" BOUNDARY' : "";
    console.log(
      indent + marker + " " + node.file + " [" + node.type + "]" + boundary,
    );
    for (var i = 0; i < node.children.length; i++) {
      printTree(node.children[i], indent + "   ");
    }
  }

  function analyzeBundle(node, bundle) {
    bundle = bundle || { server: [], client: [] };
    if (node.type === "CLIENT") bundle.client.push(node.file);
    else bundle.server.push(node.file);
    for (var i = 0; i < node.children.length; i++) {
      analyzeBundle(node.children[i], bundle);
    }
    return bundle;
  }

  function demo() {
    console.log("╔═══ COMPONENT TREE RESOLVER ═══╗\n");
    var tree = resolve("page.tsx");
    printTree(tree);
    var b = analyzeBundle(tree);
    console.log(
      "\n📦 Server bundle (" + b.server.length + "): " + b.server.join(", "),
    );
    console.log(
      "📦 Client bundle (" + b.client.length + "): " + b.client.join(", "),
    );
    console.log(
      "📊 JS sent to browser: " +
        b.client.length +
        "/" +
        (b.server.length + b.client.length) +
        " files",
    );
  }

  return {
    resolve: resolve,
    printTree: printTree,
    analyzeBundle: analyzeBundle,
    demo: demo,
  };
})();
// Chạy thử: ComponentTreeResolver.demo();
```

---

## §14. Tổng Kết & Câu Hỏi Luyện Tập!

```
  TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │  ① Mặc định = Server Components (0 JS gửi client!)   │
  │  ② 'use client' = boundary, imports cũng = Client    │
  │  ③ RSC Payload = binary representation của SC tree    │
  │  ④ First load: HTML → RSC reconcile → hydrate        │
  │  ⑤ Subsequent: RSC Payload from cache, no HTML       │
  │  ⑥ Props Server→Client PHẢI serializable             │
  │  ⑦ Interleaving: SC as children of CC = OK!          │
  │  ⑧ Context: wrap trong CC provider, đặt CÀ SÂC      │
  │  ⑨ React.cache: memoize per-request                  │
  │  ⑩ server-only / client-only: chặn import sai        │
  └────────────────────────────────────────────────────────┘
```

### Câu Hỏi Luyện Tập

**Câu 1**: Server Component mặc định, tại sao? Lợi ích?

<details><summary>Đáp án</summary>

- **0 JS** gửi tới browser → bundle nhỏ hơn
- Fetch data **trực tiếp** từ DB/API (gần source)
- Giữ **secrets** (API keys) an toàn
- Cải thiện **FCP** — user thấy content sớm hơn
- Server có thể **cache** + **stream** progressively

</details>

---

**Câu 2**: "use client" ảnh hưởng thế nào đến module graph?

<details><summary>Đáp án</summary>

- Tạo **boundary** giữa Server & Client modules
- File có 'use client' + **TẤT CẢ imports** = Client bundle
- KHÔNG cần thêm directive cho child modules
- Chỉ cần đánh dấu ở **component trên cùng** cần interactivity

</details>

---

**Câu 3**: RSC Payload chứa gì? 3 bước first load?

<details><summary>Đáp án</summary>

**RSC Payload chứa**: rendered SC result, placeholders cho CC, JS file references, props Server→Client

**3 bước first load**: ① HTML → fast preview (non-interactive) → ② RSC reconcile trees → ③ JS hydrate CC → interactive!

</details>

---

**Câu 4**: Tại sao KHÔNG thể dùng Context trong Server Components?

<details><summary>Đáp án</summary>

- Context dùng **state** (createContext, useContext)
- Server Components **KHÔNG CÓ state** — stateless!
- **Giải pháp**: Tạo Client Component provider, import vào Server layout, truyền children
- **Tip**: Đặt provider càng **sâu** càng tốt → Next.js tối ưu static parts tốt hơn

</details>

---

**Câu 5**: Interleaving pattern — tại sao Server Component có thể là children của Client Component?

<details><summary>Đáp án</summary>

- SC được render **TRƯỚC** trên server
- RSC Payload chứa **rendered output** (không phải component function)
- Client nhận output đã render → đặt vào slot `{children}` trong CC
- CC KHÔNG cần biết children là SC hay CC — chỉ là React nodes!

</details>

---

**Câu 6**: Third-party component thiếu 'use client' — cách giải quyết?

<details><summary>Đáp án</summary>

**Cách 1**: Dùng **trong** Client Component (import trong file có 'use client')

**Cách 2**: Re-export wrapper (2 dòng):

```typescript
"use client";
import { Carousel } from "acme-carousel";
export default Carousel;
```

→ Giờ dùng trong Server Component OK!

</details>

---

**Câu 7**: `server-only` package dùng khi nào? Khác gì với NEXT*PUBLIC* prefix?

<details><summary>Đáp án</summary>

|             | `server-only`                          | `NEXT_PUBLIC_`                    |
| ----------- | -------------------------------------- | --------------------------------- |
| Mục đích    | **Chặn import** server code vào client | **Expose** env var cho client     |
| Khi nào lỗi | **Build-time** error                   | Biến = empty string (silent fail) |
| Dùng cho    | Functions, DB queries                  | Env variables                     |

`server-only` = **protection tường minh** — build-time error rõ ràng hơn silent empty string!

</details>

---

**Câu 8**: React.cache hoạt động thế nào? Scope?

<details><summary>Đáp án</summary>

- `cache()` wrap async function → **memoize** kết quả
- Nhiều calls trong **cùng 1 request** → **1 fetch duy nhất**
- SC gọi `await getUser()` + CC resolve qua `use(userPromise)` = **cùng data**
- **Scope**: MỖI REQUEST riêng → không share giữa requests
- Khác với Next.js fetch cache (cross-request)!

</details>
