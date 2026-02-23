# Next.js File Conventions — Deep Dive!

> **Chủ đề**: `default.js` · Dynamic Routes · `error.js` · `forbidden.js`
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/
> **Hình ảnh**: 3 diagrams phân tích (1 default.js + 2 error.js)

---

## Mục Lục

1. [§1. default.js — Parallel Routes Fallback!](#1)
2. [§2. Dynamic Routes — [slug] / [...slug] / [[...slug]]!](#2)
3. [§3. error.js — Error Boundary!](#3)
4. [§4. forbidden.js — 403 Authorization!](#4)
5. [§5. Sơ Đồ — Phân Tích 3 Diagrams!](#5)
6. [§6. Tự Viết — FileConventionsEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập!](#7)

---

## §1. default.js — Parallel Routes Fallback!

```
  default.js — PARALLEL ROUTES FALLBACK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Fallback UI cho Parallel Routes khi Next.js           │
  │  KHÔNG THỂ khôi phục active state của slot!                  │
  │                                                              │
  │  WHY IT EXISTS:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ SOFT NAVIGATION (client-side):                       │    │
  │  │   Next.js TRACKS active state của mỗi slot! ✅     │    │
  │  │   → Biết slot nào đang hiện subpage nào!            │    │
  │  │   → Maintain state qua navigation! ✅                │    │
  │  │                                                      │    │
  │  │ HARD NAVIGATION (full-page load/refresh):            │    │
  │  │   Next.js CANNOT recover active state! ❌           │    │
  │  │   → Không biết slot nào đang hiện gì!               │    │
  │  │   → CẦN default.js làm fallback!                   │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FOLDER STRUCTURE EXAMPLE (from diagram):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app/                                                 │    │
  │  │ ├── @team/                                           │    │
  │  │ │   └── settings/                                    │    │
  │  │ │       └── page.js                                  │    │
  │  │ ├── @analytics/                                      │    │
  │  │ │   ├── default.js  ● ← FALLBACK cho slot này!     │    │
  │  │ │   └── page.js                                      │    │
  │  │ ├── default.js      ● ← FALLBACK cho children!     │    │
  │  │ ├── layout.js                                        │    │
  │  │ └── page.js                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BEHAVIOR:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ Navigate to /settings (SOFT):                        │    │
  │  │   @team → renders settings/page.js ✅              │    │
  │  │   @analytics → MAINTAINS current active page! ✅   │    │
  │  │                                                      │    │
  │  │ REFRESH on /settings (HARD):                         │    │
  │  │   @team → renders settings/page.js ✅              │    │
  │  │   @analytics → renders default.js! ← FALLBACK!    │    │
  │  │                                                      │    │
  │  │ NO default.js exists?                                │    │
  │  │   → ERROR! Named slots require default.js!          │    │
  │  │   → @team, @analytics, etc. MUST have default.js!  │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHILDREN IS IMPLICIT SLOT:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ `children` = implicit @children slot!                │    │
  │  │ → ALSO needs default.js!                            │    │
  │  │ → Without it: 404 on hard navigation!               │    │
  │  │ → Put default.js at same level as layout.js!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PARAMS (optional):                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ params: Promise<{ artist: string }>                  │    │
  │  │ → Same as page.js — async/await or React.use()!    │    │
  │  │                                                      │    │
  │  │ app/[artist]/@sidebar/default.js                     │    │
  │  │   /zack → Promise<{ artist: 'zack' }>              │    │
  │  │                                                      │    │
  │  │ app/[artist]/[album]/@sidebar/default.js             │    │
  │  │   /zack/next → Promise<{ artist: 'zack',            │    │
  │  │                           album: 'next' }>          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WANT OLD 404 BEHAVIOR?                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { notFound } from 'next/navigation'           │    │
  │  │ export default function Default() { notFound() }    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Dynamic Routes — [slug] / [...slug] / [[...slug]]!

```
  DYNAMIC ROUTE SEGMENTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  3 TYPES OF DYNAMIC SEGMENTS:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① [slug]          → Single dynamic segment!        │    │
  │  │ ② [...slug]       → Catch-all segments!            │    │
  │  │ ③ [[...slug]]     → Optional catch-all segments!   │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Type 1: `[slug]` — Single Dynamic Segment

```
  [slug] — SINGLE DYNAMIC SEGMENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Convention: Wrap folder name in [ ]                          │
  │  Example: app/blog/[slug]/page.js                             │
  │                                                              │
  │  ┌──────────────┬──────────────┬──────────────────────┐      │
  │  │ Route        │ URL          │ params               │      │
  │  ├──────────────┼──────────────┼──────────────────────┤      │
  │  │ [slug]       │ /blog/a      │ { slug: 'a' }        │      │
  │  │ [slug]       │ /blog/b      │ { slug: 'b' }        │      │
  │  │ [slug]       │ /blog/c      │ { slug: 'c' }        │      │
  │  └──────────────┴──────────────┴──────────────────────┘      │
  │                                                              │
  │  SERVER COMPONENT:                                            │
  │  export default async function Page({                        │
  │    params                                                    │
  │  }: { params: Promise<{ slug: string }> }) {                 │
  │    const { slug } = await params  // ← await!               │
  │    return <div>My Post: {slug}</div>                         │
  │  }                                                           │
  │                                                              │
  │  CLIENT COMPONENT:                                            │
  │  'use client'                                                │
  │  import { use } from 'react'                                 │
  │  export default function Page({                              │
  │    params                                                    │
  │  }: { params: Promise<{ slug: string }> }) {                 │
  │    const { slug } = use(params)  // ← React.use()!          │
  │    return <div>{slug}</div>                                  │
  │  }                                                           │
  │  // OR: useParams() hook anywhere in tree!                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Type 2: `[...slug]` — Catch-all Segments

```
  [...slug] — CATCH-ALL SEGMENTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Convention: Ellipsis inside brackets [...folderName]         │
  │  Example: app/shop/[...slug]/page.js                          │
  │                                                              │
  │  ┌──────────────────────┬──────────────┬─────────────────┐   │
  │  │ Route                │ URL          │ params.slug     │   │
  │  ├──────────────────────┼──────────────┼─────────────────┤   │
  │  │ [...slug]            │ /shop/a      │ ['a']           │   │
  │  │ [...slug]            │ /shop/a/b    │ ['a', 'b']      │   │
  │  │ [...slug]            │ /shop/a/b/c  │ ['a', 'b', 'c'] │   │
  │  │ [...slug]            │ /shop        │ ❌ NO MATCH!   │   │
  │  └──────────────────────┴──────────────┴─────────────────┘   │
  │                                                              │
  │  ⚠️ /shop does NOT match! At least 1 segment required!      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Type 3: `[[...slug]]` — Optional Catch-all Segments

```
  [[...slug]] — OPTIONAL CATCH-ALL SEGMENTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Convention: Double brackets [[...folderName]]                │
  │  Example: app/shop/[[...slug]]/page.js                        │
  │                                                              │
  │  ┌──────────────────────┬──────────────┬─────────────────┐   │
  │  │ Route                │ URL          │ params.slug     │   │
  │  ├──────────────────────┼──────────────┼─────────────────┤   │
  │  │ [[...slug]]          │ /shop        │ undefined ✅   │   │
  │  │ [[...slug]]          │ /shop/a      │ ['a']           │   │
  │  │ [[...slug]]          │ /shop/a/b    │ ['a', 'b']      │   │
  │  │ [[...slug]]          │ /shop/a/b/c  │ ['a', 'b', 'c'] │   │
  │  └──────────────────────┴──────────────┴─────────────────┘   │
  │                                                              │
  │  KEY DIFFERENCE from [...slug]:                               │
  │  → /shop ALSO matches! (slug = undefined)                   │
  │  → Route WITHOUT parameter is ALSO matched!                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### TypeScript Typing

```
  TYPESCRIPT TYPING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Type helpers:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ PageProps<'/route'>     → for page.tsx              │    │
  │  │ LayoutProps<'/route'>   → for layout.tsx            │    │
  │  │ RouteContext<'/route'>  → for route.ts              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Type mapping:                                                │
  │  ┌──────────────────────┬──────────────────────────────┐     │
  │  │ Route                │ params type                  │     │
  │  ├──────────────────────┼──────────────────────────────┤     │
  │  │ app/blog/[slug]      │ { slug: string }             │     │
  │  │ app/shop/[...slug]   │ { slug: string[] }           │     │
  │  │ app/shop/[[...slug]] │ { slug?: string[] }          │     │
  │  │ app/[catId]/[itemId] │ { catId: string,             │     │
  │  │                      │   itemId: string }           │     │
  │  └──────────────────────┴──────────────────────────────┘     │
  │                                                              │
  │  Runtime validation (locale example):                         │
  │  function assertValidLocale(value: string):                  │
  │    asserts value is Locale {                                 │
  │    if (!isValidLocale(value)) notFound()                     │
  │  }                                                           │
  │  // locale typed as string → narrowed to Locale!            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Cache Components + generateStaticParams

```
  CACHE COMPONENTS + DYNAMIC ROUTES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WITHOUT generateStaticParams:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ALL params are RUNTIME data!                      │    │
  │  │ → MUST wrap in <Suspense> with fallback!            │    │
  │  │ → Static shell at build, content loads per request! │    │
  │  │ → Hoặc dùng loading.tsx cho page-level fallback!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WITH generateStaticParams:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Provide sample params for BUILD TIME!             │    │
  │  │ → Build validates + generates static HTML!          │    │
  │  │ → Runtime params saved to disk after first request! │    │
  │  │ → Conditional runtime branches need <Suspense>!     │    │
  │  │                                                      │    │
  │  │ export async function generateStaticParams() {       │    │
  │  │   return [{ slug: '1' }, { slug: '2' }, { slug: '3' }]│   │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Also works with Route Handlers!                              │
  │  export async function GET(request, { params }) { ... }      │
  │  → Static API responses at build time!                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. error.js — Error Boundary!

```
  error.js — ERROR BOUNDARY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Handle unexpected RUNTIME errors + display fallback!  │
  │  ⚠️ MUST be 'use client'! (Error boundaries = Client!)      │
  │                                                              │
  │  FILE STRUCTURE (from Diagram 1):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app/                                                 │    │
  │  │ ├── layout.js                                        │    │
  │  │ └── dashboard/                                       │    │
  │  │     ├── layout.js                                    │    │
  │  │     ├── error.js   ● ← catches errors in page.js!  │    │
  │  │     └── page.js                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HOW IT WORKS (from Diagram 2):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ error.js CODE:           COMPONENT HIERARCHY:        │    │
  │  │ ┌──────────────────┐    ┌──────────────────┐        │    │
  │  │ │ export default   │    │ <Layout>          │        │    │
  │  │ │ function Error({ │    │   <Header />      │        │    │
  │  │ │   error, reset   │    │   <SideNav />     │        │    │
  │  │ │ }) {              │    │   <ErrorBoundary  │        │    │
  │  │ │   return (        │    │     fallback={    │        │    │
  │  │ │     <>             │    │       <Error />  │←──┐   │    │
  │  │ │     An error...   │    │     }>            │   │   │    │
  │  │ │     <button        │    │     <Page />     │   │   │    │
  │  │ │       onClick={    │    │   </ErrorBoundary>│  │   │    │
  │  │ │       reset}>      │    │ </Layout>        │   │   │    │
  │  │ │       Retry        │    └──────────────────┘   │   │    │
  │  │ │     </button>      │                           │   │    │
  │  │ │     </>            │   When error in Page ─────┘   │    │
  │  │ │   )                │   → shows Error component!   │    │
  │  │ │ }                  │   → Layout stays intact! ✅  │    │
  │  │ └──────────────────┘                                 │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY INSIGHT:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → error.js wraps segment + nested children!         │    │
  │  │ → Layout/Header/SideNav STAYS visible! ✅           │    │
  │  │ → Only Page part shows error fallback!              │    │
  │  │ → Preserves interactivity! User can retry!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Props

```
  PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  error: Error & { digest?: string }                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ error.message:                                       │    │
  │  │   Client error → original message! ✅               │    │
  │  │   Server error → generic message! (security!)       │    │
  │  │     → Use error.digest to match server logs!        │    │
  │  │                                                      │    │
  │  │ error.digest:                                        │    │
  │  │   Auto-generated hash of the error!                  │    │
  │  │   → Match with server-side logs to debug!           │    │
  │  │                                                      │    │
  │  │ DEV vs PROD:                                         │    │
  │  │   Dev → serialized with original message! ✅        │    │
  │  │   Prod → generic message! (avoid leaking secrets!)  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  reset: () => void                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Re-render the error boundary contents!            │    │
  │  │ → If successful: error component replaced! ✅       │    │
  │  │ → If still error: shows error again!                │    │
  │  │ → For TEMPORARY errors (network, timeout!)          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BUBBLE UP ERRORS:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → throw inside error component = bubble to parent!  │    │
  │  │ → Parent error boundary catches it!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### global-error.js

```
  GLOBAL ERROR:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Error handler for ROOT layout/template!               │
  │  FILE: app/global-error.jsx                                   │
  │                                                              │
  │  ⚠️ MUST define its OWN <html> and <body> tags!             │
  │  → Replaces root layout when active!                         │
  │  → No metadata/generateMetadata! (Client Component!)         │
  │  → Use React <title> component instead!                      │
  │                                                              │
  │  'use client'                                                │
  │  export default function GlobalError({ error, reset }) {     │
  │    return (                                                  │
  │      <html>                                                  │
  │        <body>                                                │
  │          <h2>Something went wrong!</h2>                      │
  │          <button onClick={() => reset()}>Try again</button> │
  │        </body>                                               │
  │      </html>                                                 │
  │    )                                                         │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### GracefullyDegradingErrorBoundary

```
  GRACEFUL ERROR RECOVERY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Preserve last server-rendered HTML on client error!   │
  │                                                              │
  │  HOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Class component extends React.Component           │    │
  │  │ ② Uses contentRef to capture current innerHTML!     │    │
  │  │ ③ getDerivedStateFromError → set hasError=true      │    │
  │  │ ④ On error: dangerouslySetInnerHTML with captured   │    │
  │  │   HTML (no hydration! suppressHydrationWarning!)    │    │
  │  │ ⑤ Shows notification bar at bottom!                 │    │
  │  │ ⑥ User sees LAST GOOD UI + error notification!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BENEFIT: User still sees content instead of blank error!    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. forbidden.js — 403 Authorization!

```
  forbidden.js — 403 FORBIDDEN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Custom UI when forbidden() function is invoked!       │
  │  STATUS: HTTP 403 Forbidden!                                  │
  │  SINCE: Next.js v15.1.0!                                      │
  │                                                              │
  │  HOW IT WORKS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① Server Component/Route checks authorization!      │    │
  │  │ ② Calls forbidden() from 'next/navigation'!        │    │
  │  │ ③ Next.js returns 403 status code!                   │    │
  │  │ ④ Renders forbidden.js UI!                           │    │
  │  │                                                      │    │
  │  │ // app/admin/page.tsx                                │    │
  │  │ import { forbidden } from 'next/navigation'          │    │
  │  │ import { checkRole } from '@/lib/auth'               │    │
  │  │                                                      │    │
  │  │ export default async function AdminPage() {          │    │
  │  │   const isAdmin = await checkRole('admin')          │    │
  │  │   if (!isAdmin) forbidden()  // ← triggers 403!    │    │
  │  │   return <AdminDashboard />                          │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  forbidden.js FILE:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import Link from 'next/link'                         │    │
  │  │                                                      │    │
  │  │ export default function Forbidden() {                │    │
  │  │   return (                                           │    │
  │  │     <div>                                            │    │
  │  │       <h2>Forbidden</h2>                             │    │
  │  │       <p>You are not authorized to access this       │    │
  │  │          resource.</p>                                │    │
  │  │       <Link href="/">Return Home</Link>              │    │
  │  │     </div>                                           │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PROPS: NONE! (forbidden.js accepts NO props!)               │
  │                                                              │
  │  COMPARISON:                                                  │
  │  ┌──────────────┬──────────┬──────────┬──────────────┐       │
  │  │              │ not-found│ forbidden│ error        │       │
  │  ├──────────────┼──────────┼──────────┼──────────────┤       │
  │  │ Status       │ 404      │ 403      │ 500          │       │
  │  │ Trigger      │ notFound()│forbidden()│ throw Error │       │
  │  │ Props        │ none     │ none     │ error, reset │       │
  │  │ Use case     │ Not exist│ No access│ Runtime error│       │
  │  │ Client comp? │ Optional │ Optional │ REQUIRED!    │       │
  │  │ Version      │ v13.0    │ v15.1    │ v13.0        │       │
  │  └──────────────┴──────────┴──────────┴──────────────┘       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Sơ Đồ — Phân Tích 3 Diagrams!

### Diagram 1: Parallel Routes Unmatched (default.js page)

```
  PHÂN TÍCH SƠ ĐỒ 1: "Parallel Routes unmatched routes"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ hiển thị file tree structure:                          │
  │                                                              │
  │  app/                                                        │
  │  ├── @team/                    ← Parallel Route SLOT!       │
  │  │   └── settings/                                           │
  │  │       └── page.js           ← Settings page cho @team   │
  │  ├── @analytics/               ← Parallel Route SLOT!       │
  │  │   ├── default.js  ●        ← FALLBACK! (blue dot)      │
  │  │   └── page.js               ← Analytics page            │
  │  ├── default.js      ●        ← FALLBACK for children!    │
  │  ├── layout.js                  ← Shared layout            │
  │  └── page.js                    ← Main page                │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → @team CÓ settings subpage, @analytics KHÔNG có!  │    │
  │  │ → Khi navigate /settings:                           │    │
  │  │   @team: shows settings/page.js ✅                  │    │
  │  │   @analytics: keeps current page (soft nav) ✅      │    │
  │  │ → Khi REFRESH /settings:                            │    │
  │  │   @team: shows settings/page.js ✅                  │    │
  │  │   @analytics: shows default.js! (hard nav fallback) │    │
  │  │ → Blue dots (●) mark the default.js files!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Diagram 2: error.js special file (error.js page)

```
  PHÂN TÍCH SƠ ĐỒ 2: "error.js special file"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ hiển thị file tree:                                    │
  │                                                              │
  │  app/                                                        │
  │  ├── layout.js                  ← Root layout              │
  │  └── dashboard/                                              │
  │      ├── layout.js              ← Dashboard layout         │
  │      ├── error.js    ●         ← Error boundary! (blue)   │
  │      └── page.js                ← Dashboard page           │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → error.js đặt CÙNG CẤP với page.js!               │    │
  │  │ → Catches errors TRONG page.js + nested children!   │    │
  │  │ → dashboard/layout.js KHÔNG bị ảnh hưởng!          │    │
  │  │ → Root layout.js KHÔNG bị ảnh hưởng!               │    │
  │  │ → Blue dot (●) marks the error.js file!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Diagram 3: How error.js works (error.js page)

```
  PHÂN TÍCH SƠ ĐỒ 3: "How error.js works"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ gồm 3 PHẦN liên kết:                                  │
  │                                                              │
  │  PHẦN 1: error.js CODE (bên trái)                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export default function Error({ error, reset }) {    │    │
  │  │   return (                                           │    │
  │  │     <>                                               │    │
  │  │       An error occurred: {error.message}             │    │
  │  │       <button onClick={() => reset()}>Retry</button> │    │
  │  │     </>                                              │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 2: COMPONENT HIERARCHY (bên dưới)                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <Layout>                                             │    │
  │  │   <Header />                                         │    │
  │  │   <SideNav />                                        │    │
  │  │   <ErrorBoundary fallback={<Error />}>  ← wraps!   │    │
  │  │     <Page />                             ← caught!  │    │
  │  │   </ErrorBoundary>                                   │    │
  │  │ </Layout>                                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 3: RENDERED UI (bên phải)                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌────────────────────────┐                           │    │
  │  │ │ Layout (intact!)       │                           │    │
  │  │ │ ┌──────┐ ┌───────────┐│                           │    │
  │  │ │ │ Side │ │  Error... ││  ← error fallback!       │    │
  │  │ │ │ Nav  │ │  (pink)   ││                           │    │
  │  │ │ └──────┘ └───────────┘│                           │    │
  │  │ └────────────────────────┘                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY INSIGHT:                                                 │
  │  → ErrorBoundary WRAPS <Page /> only!                       │
  │  → Layout, Header, SideNav STAY rendered! ✅                 │
  │  → Only page area shows error fallback (pink box!)          │
  │  → Arrow from hierarchy → UI shows the relationship!        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — FileConventionsEngine!

```javascript
var FileConventionsEngine = (function () {
  // ═══════════════════════════════════
  // 1. DYNAMIC ROUTE RESOLVER
  // ═══════════════════════════════════
  function matchDynamicRoute(pattern, url) {
    var segments = url.split("/").filter(Boolean);
    var patternParts = pattern.split("/").filter(Boolean);
    var params = {};

    for (var i = 0; i < patternParts.length; i++) {
      var part = patternParts[i];

      // Optional catch-all [[...slug]]
      if (part.match(/^\[\[\.\.\.\w+\]\]$/)) {
        var key = part.replace(/^\[\[\.\.\./, "").replace(/\]\]$/, "");
        var remaining = segments.slice(i);
        params[key] = remaining.length > 0 ? remaining : undefined;
        return { matched: true, params: params, type: "optional-catch-all" };
      }

      // Catch-all [...slug]
      if (part.match(/^\[\.\.\.\w+\]$/)) {
        var key2 = part.replace(/^\[\.\.\./, "").replace(/\]$/, "");
        var remaining2 = segments.slice(i);
        if (remaining2.length === 0) {
          return {
            matched: false,
            reason: "Catch-all requires at least 1 segment!",
          };
        }
        params[key2] = remaining2;
        return { matched: true, params: params, type: "catch-all" };
      }

      // Single [slug]
      if (part.match(/^\[\w+\]$/)) {
        var key3 = part.replace(/^\[/, "").replace(/\]$/, "");
        if (i >= segments.length) {
          return { matched: false, reason: "Missing segment for " + part };
        }
        params[key3] = segments[i];
        continue;
      }

      // Static segment
      if (segments[i] !== part) {
        return { matched: false, reason: "Mismatch at " + part };
      }
    }

    if (segments.length > patternParts.length) {
      return { matched: false, reason: "Too many segments!" };
    }

    return { matched: true, params: params, type: "single" };
  }

  // ═══════════════════════════════════
  // 2. ERROR BOUNDARY SIMULATOR
  // ═══════════════════════════════════
  function simulateErrorBoundary(config) {
    var hasError = config.throwError || false;
    var hasErrorFile = config.hasErrorFile || false;
    var hasGlobalError = config.hasGlobalError || false;
    var isRootLayout = config.isRootLayout || false;

    if (!hasError) {
      return { rendered: "page", status: "OK", error: null };
    }

    if (isRootLayout && hasGlobalError) {
      return {
        rendered: "global-error",
        status: "ERROR",
        note: "Root layout error → global-error.jsx!",
        needsOwnHtmlBody: true,
      };
    }

    if (hasErrorFile) {
      return {
        rendered: "error.js",
        status: "ERROR",
        props: {
          error: {
            message: config.errorMessage || "Something went wrong",
            digest: "hash_" + Math.random().toString(36).substr(2, 8),
          },
          reset: "function to re-render boundary",
        },
        layoutPreserved: true,
      };
    }

    return {
      rendered: "UNHANDLED!",
      status: "ERROR",
      note: "Error bubbles up to parent boundary!",
    };
  }

  // ═══════════════════════════════════
  // 3. DEFAULT.JS RESOLVER
  // ═══════════════════════════════════
  function resolveSlotOnHardNav(slots, currentUrl) {
    var results = {};
    for (var name in slots) {
      var slot = slots[name];
      var hasMatchingPage = slot.pages.indexOf(currentUrl) !== -1;
      if (hasMatchingPage) {
        results[name] = { rendered: "page.js", url: currentUrl };
      } else if (slot.hasDefault) {
        results[name] = { rendered: "default.js", reason: "FALLBACK!" };
      } else {
        results[name] = {
          rendered: "ERROR!",
          reason: "No default.js! MUST add!",
        };
      }
    }
    return results;
  }

  // ═══════════════════════════════════
  // 4. FORBIDDEN HANDLER
  // ═══════════════════════════════════
  function checkForbidden(role, requiredRole, hasForbiddenFile) {
    if (role === requiredRole) {
      return { status: 200, rendered: "page", allowed: true };
    }
    if (hasForbiddenFile) {
      return { status: 403, rendered: "forbidden.js", allowed: false };
    }
    return {
      status: 403,
      rendered: "default 403",
      allowed: false,
      note: "No forbidden.js file! Shows generic 403!",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  FILE CONVENTIONS ENGINE DEMO         ║");
    console.log("╚══════════════════════════════════════╝");

    // Dynamic routes
    console.log("\n── Dynamic Route Matching ──");
    var routes = [
      ["blog/[slug]", "/blog/hello"],
      ["blog/[slug]", "/blog/world"],
      ["shop/[...slug]", "/shop/clothes/tops"],
      ["shop/[...slug]", "/shop"],
      ["shop/[[...slug]]", "/shop"],
      ["shop/[[...slug]]", "/shop/a/b/c"],
      ["[catId]/[itemId]", "/electronics/phone"],
    ];
    for (var i = 0; i < routes.length; i++) {
      var r = matchDynamicRoute(routes[i][0], routes[i][1]);
      console.log(
        "  " + routes[i][0] + " ← " + routes[i][1] + ":",
        r.matched ? "✅ " + JSON.stringify(r.params) : "❌ " + r.reason,
      );
    }

    // Error boundary
    console.log("\n── Error Boundary ──");
    var e1 = simulateErrorBoundary({ throwError: false });
    console.log("  No error:", e1.rendered);
    var e2 = simulateErrorBoundary({
      throwError: true,
      hasErrorFile: true,
      errorMessage: "Network timeout",
    });
    console.log(
      "  With error.js:",
      e2.rendered,
      "layout preserved:",
      e2.layoutPreserved,
      "digest:",
      e2.props.error.digest,
    );
    var e3 = simulateErrorBoundary({
      throwError: true,
      isRootLayout: true,
      hasGlobalError: true,
    });
    console.log(
      "  Root error:",
      e3.rendered,
      "needs html/body:",
      e3.needsOwnHtmlBody,
    );

    // Default.js
    console.log("\n── default.js (Hard Navigation) ──");
    var slots = {
      "@team": { pages: ["/settings"], hasDefault: false },
      "@analytics": { pages: ["/"], hasDefault: true },
      "@children": { pages: ["/"], hasDefault: true },
    };
    var resolved = resolveSlotOnHardNav(slots, "/settings");
    for (var slot in resolved) {
      console.log(
        "  " + slot + ":",
        resolved[slot].rendered,
        resolved[slot].reason || "",
      );
    }

    // Forbidden
    console.log("\n── forbidden.js ──");
    var f1 = checkForbidden("admin", "admin", true);
    console.log("  admin→admin:", f1.status, f1.rendered);
    var f2 = checkForbidden("user", "admin", true);
    console.log("  user→admin:", f2.status, f2.rendered);
    var f3 = checkForbidden("user", "admin", false);
    console.log("  No file:", f3.status, f3.note);
  }

  return { demo: demo };
})();
// Chạy: FileConventionsEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: `default.js` — tại sao cần và khi nào render?

<details><summary>Đáp án</summary>

```
WHY:
  Parallel Routes có MULTIPLE SLOTS (@team, @analytics, etc.)
  Mỗi slot có thể có DIFFERENT subpages!

  SOFT NAVIGATION (client-side Link click):
  → Next.js THEO DÕI active state mỗi slot! ✅
  → Chuyển trang → slot giữ nguyên nội dung!
  → KHÔNG cần default.js!

  HARD NAVIGATION (full refresh, direct URL):
  → Next.js KHÔNG THỂ KHÔI PHỤC active state! ❌
  → Phải biết render gì cho slot không match URL!
  → CẦN default.js làm fallback!

WHEN RENDERED:
  ① User refreshes page (F5)
  ② User enters URL directly in browser
  ③ User opens link in new tab
  → Bất cứ khi nào full-page load!

REQUIRED:
  → ALL named slots PHẢI có default.js!
  → children cũng là implicit slot → cũng cần!
  → Không có → ERROR! (hoặc 404 old behavior)

WANT 404 INSTEAD?
  import { notFound } from 'next/navigation'
  export default function Default() { notFound() }
```

</details>

---

**Câu 2**: `[slug]` vs `[...slug]` vs `[[...slug]]` — khác nhau thế nào?

<details><summary>Đáp án</summary>

```
[slug] — Single Dynamic Segment:
  → Match ĐÚNG 1 segment!
  → /blog/hello → { slug: 'hello' }
  → /blog/a/b → ❌ NOT MATCHED!
  → params type: { slug: string }

[...slug] — Catch-all:
  → Match 1 OR MORE segments!
  → /shop/a → { slug: ['a'] }
  → /shop/a/b/c → { slug: ['a', 'b', 'c'] }
  → /shop → ❌ NOT MATCHED! (minimum 1!)
  → params type: { slug: string[] }

[[...slug]] — Optional Catch-all:
  → Match 0 OR MORE segments!
  → /shop → { slug: undefined }  ✅ MATCHES!
  → /shop/a → { slug: ['a'] }
  → /shop/a/b/c → { slug: ['a', 'b', 'c'] }
  → params type: { slug?: string[] }

KEY DIFFERENCE:
  [...slug]: /shop → ❌ (phải có ít nhất 1 segment!)
  [[...slug]]: /shop → ✅ (0 segments OK!)

PARAMS ACCESS (Next.js 15+):
  Server: const { slug } = await params  (Promise!)
  Client: const { slug } = use(params) hoặc useParams()
```

</details>

---

**Câu 3**: `error.js` — tại sao BẮT BUỘC phải là Client Component?

<details><summary>Đáp án</summary>

```
WHY 'use client':
  → error.js = React Error Boundary!
  → Error Boundaries dùng class component lifecycle:
    - getDerivedStateFromError()
    - componentDidCatch()
  → Đây là CLIENT-ONLY APIs! ❌ không có trên server!
  → Server Components KHÔNG THỂ catch runtime errors!

WHAT IT MEANS:
  → 'use client' ở dòng đầu tiên!
  → Có thể dùng useState, useEffect, hooks!
  → KHÔNG thể export metadata/generateMetadata!
    (dùng React <title> component thay thế!)

error.js vs global-error.js:
  error.js:
  → Cho BẤT KỲ route segment nào!
  → Layout STAYS visible! ✅
  → Chỉ Page bị replace bởi error fallback!

  global-error.js:
  → CHỈ cho root layout errors!
  → PHẢI có <html> và <body> riêng!
  → REPLACE root layout hoàn toàn!
  → Rất HIẾM dùng!

error.message BEHAVIOR:
  Client error → original message (debug-friendly!)
  Server error → generic message (security!)
  → Dùng error.digest match server logs!
```

</details>

---

**Câu 4**: `forbidden.js` vs `not-found.js` vs `error.js` — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

```
not-found.js (404):
  → Trigger: notFound() function
  → Use case: Resource KHÔNG TỒN TẠI!
  → Example: /blog/invalid-slug → no post found!
  → Props: NONE!
  → Since: v13.0

forbidden.js (403):
  → Trigger: forbidden() function
  → Use case: User KHÔNG CÓ QUYỀN truy cập!
  → Example: /admin → user is not admin!
  → Props: NONE!
  → Since: v15.1.0

error.js (500):
  → Trigger: Runtime error (throw)!
  → Use case: UNEXPECTED errors! Network, timeout, bugs!
  → Example: API call fails, component crashes!
  → Props: { error, reset }
  → 'use client' REQUIRED!
  → Since: v13.0

HIERARCHY:
  Authorization check → forbidden() → 403
  Resource check → notFound() → 404
  Runtime crash → throw Error → error.js → 500

WHICH TO USE:
  "Exists?" → notFound()
  "Allowed?" → forbidden()
  "Broken?" → error.js
```

</details>
