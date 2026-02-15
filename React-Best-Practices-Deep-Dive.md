# React Best Practices — Vercel Performance Optimization Guide

> 📅 2026-01-30 · ⏱ 20 phút đọc
>
> Tổng hợp 45+ rules từ Vercel Engineering, phân loại theo 8 category từ **CRITICAL** đến **LOW**.
> Mỗi rule đều có ❌ Sai / ✅ Đúng kèm code example thực tế.
> Độ khó: ⭐️⭐️⭐️⭐️ | Nguồn: [react-best-practices](https://github.com/vercel-labs/react-best-practices)

---

## Mục Lục

1. [Tại Sao Performance Lại Quan Trọng?](#1-tại-sao-performance-lại-quan-trọng)
2. [Priority Order — Tối Ưu Theo Thứ Tự Ưu Tiên](#2-priority-order--tối-ưu-theo-thứ-tự-ưu-tiên)
3. [Eliminating Waterfalls — CRITICAL](#3-eliminating-waterfalls--critical)
4. [Bundle Size Optimization — CRITICAL](#4-bundle-size-optimization--critical)
5. [Server-Side Performance — HIGH](#5-server-side-performance--high)
6. [Client-Side Data Fetching — MEDIUM-HIGH](#6-client-side-data-fetching--medium-high)
7. [Re-render Optimization — MEDIUM](#7-re-render-optimization--medium)
8. [Rendering Performance — MEDIUM](#8-rendering-performance--medium)
9. [JavaScript Performance — LOW-MEDIUM](#9-javascript-performance--low-medium)
10. [Advanced Patterns — LOW](#10-advanced-patterns--low)
11. [Tổng Kết & Bảng Rules Quick Reference](#11-tổng-kết--bảng-rules-quick-reference)
12. [Câu Hỏi Phỏng Vấn](#12-câu-hỏi-phỏng-vấn)

---

## 1. Tại Sao Performance Lại Quan Trọng?

```
VẤN ĐỀ THỰC TẾ TRONG PRODUCTION:
═══════════════════════════════════════════════════════════════

  Sau hơn 10 năm tối ưu React & Next.js, Vercel luôn thấy
  CÙNG NHỮNG LỖI LẶP LẠI:

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Async task vô tình chạy TUẦN TỰ thay vì song song   │
  │  ② Client bundle PHÌNH TO dần theo thời gian             │
  │  ③ Component RE-RENDER KHÔNG CẦN THIẾT                  │
  │                                                          │
  │  → Đây KHÔNG phải "micro-optimization"                   │
  │  → Chúng TRỰC TIẾP → user wait time, page lag           │
  │  → Chi phí tích lũy qua MỖI LẦN user visit             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  THỰC TẾ TỐI ƯU THƯỜNG LÀ "REACTIVE":
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Release → "app chậm" → team "chữa cháy"               │
  │  → Sai priority → "tốn effort mà hiệu quả ít"         │
  │                                                          │
  │  Vercel muốn CHUYỂN SANG "PROACTIVE":                   │
  │  → Framework 45+ rules                                   │
  │  → Sắp xếp theo impact: CRITICAL → LOW                  │
  │  → Phát hiện SỚM, sửa NHANH                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 2. Priority Order — Tối Ưu Theo Thứ Tự Ưu Tiên

```
NGUYÊN TẮC CỐT LÕI — BẮT ĐẦU TỪ TRÊN XUỐNG:
═══════════════════════════════════════════════════════════════

  "Nếu waterfall thêm 600ms wait, thì mọi useMemo đều VÔ ÍCH.
   Nếu bundle thừa 300KB JS, tiết kiệm µs trong loop là VÔ NGHĨA."

  ┌─────┬────────────────────────────┬──────────────┬─────────┐
  │ #   │ Category                   │ Impact       │ Prefix  │
  ├─────┼────────────────────────────┼──────────────┼─────────┤
  │  1  │ Eliminating Waterfalls     │ 🔴 CRITICAL  │ async-  │
  │  2  │ Bundle Size Optimization   │ 🔴 CRITICAL  │ bundle- │
  │  3  │ Server-Side Performance    │ 🟠 HIGH      │ server- │
  │  4  │ Client-Side Data Fetching  │ 🟡 MED-HIGH  │ client- │
  │  5  │ Re-render Optimization     │ 🟢 MEDIUM    │ rerender│
  │  6  │ Rendering Performance      │ 🟢 MEDIUM    │ render- │
  │  7  │ JavaScript Performance     │ 🔵 LOW-MED   │ js-     │
  │  8  │ Advanced Patterns          │ ⚪ LOW        │ advance │
  └─────┴────────────────────────────┴──────────────┴─────────┘

  → Bắt đầu từ TOP (waterfall + bundle)
  → Hai cái này ĐÃ giải quyết PHẦN LỚN vấn đề
  → Rồi mới xuống render/re-render/JS

═══════════════════════════════════════════════════════════════
```

---

## 3. Eliminating Waterfalls — CRITICAL

> Waterfall là **#1 performance killer**. Mỗi `await` tuần tự = thêm FULL network latency.

### 3.1 Defer Await Until Needed

```
RULE: Dời `await` vào branch THỰC SỰ dùng:
═══════════════════════════════════════════════════════════════

  ❌ SAI — blocks cả 2 branch:

  async function handleRequest(userId, skipProcessing) {
    const userData = await fetchUserData(userId)   // ← CHẶN!

    if (skipProcessing) {
      return { skipped: true }  // Đã chờ userData VÔ ÍCH!
    }

    return processUserData(userData)
  }

  ✅ ĐÚNG — chỉ block khi cần:

  async function handleRequest(userId, skipProcessing) {
    if (skipProcessing) {
      return { skipped: true }  // Return NGAY, không chờ!
    }

    const userData = await fetchUserData(userId)
    return processUserData(userData)
  }

  → Đặc biệt hiệu quả khi branch "skip" thường xuyên hit
  → Hoặc khi deferred operation RẤT TỐN thời gian

═══════════════════════════════════════════════════════════════
```

### 3.2 Promise.all() — Parallel Execution

```
RULE: Dùng Promise.all() cho operations KHÔNG PHỤ THUỘC nhau:
═══════════════════════════════════════════════════════════════

  ❌ SAI — tuần tự, 3 round trips:

  const user     = await fetchUser()
  const posts    = await fetchPosts()
  const comments = await fetchComments()

  → Tổng: T(user) + T(posts) + T(comments)

  ✅ ĐÚNG — song song, 1 round trip:

  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ])

  → Tổng: max(T(user), T(posts), T(comments))
  → Impact: 2-10× improvement!

═══════════════════════════════════════════════════════════════
```

### 3.3 Start Promise Early, Await Late (API Routes)

```
RULE: Khởi tạo Promise NGAY, await SAU:
═══════════════════════════════════════════════════════════════

  ❌ SAI — config chờ auth, data chờ cả hai:

  export async function GET(request) {
    const session = await auth()           // 200ms
    const config  = await fetchConfig()    // 150ms (chờ auth xong!)
    const data    = await fetchData(session.user.id) // 300ms
    return Response.json({ data, config }) // Tổng: 650ms
  }

  ✅ ĐÚNG — auth và config chạy ĐỒNG THỜI:

  export async function GET(request) {
    const sessionPromise = auth()          // Start NGAY!
    const configPromise  = fetchConfig()   // Start NGAY!

    const session = await sessionPromise   // Chờ khi CẦN
    const [config, data] = await Promise.all([
      configPromise,
      fetchData(session.user.id)           // Cần session.user.id
    ])
    return Response.json({ data, config }) // Tổng: ~max(200, 300) = 300ms!
  }

  → 650ms → 300ms = -54%! Chỉ cần sắp xếp lại thứ tự!

═══════════════════════════════════════════════════════════════
```

### 3.4 Strategic Suspense Boundaries

```
RULE: Dùng Suspense để stream content, KHÔNG block toàn page:
═══════════════════════════════════════════════════════════════

  ❌ SAI — TOÀN BỘ page chờ data:

  async function Page() {
    const data = await fetchData()   // BLOCK toàn page!
    return (
      <div>
        <Sidebar />
        <Header />
        <DataDisplay data={data} />
        <Footer />
      </div>
    )
  }

  ✅ ĐÚNG — Layout render NGAY, data stream vào sau:

  function Page() {
    return (
      <div>
        <Sidebar />    {/* Render NGAY */}
        <Header />     {/* Render NGAY */}
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />  {/* CHỈ component này chờ */}
        </Suspense>
        <Footer />     {/* Render NGAY */}
      </div>
    )
  }

  async function DataDisplay() {
    const data = await fetchData()
    return <div>{data.content}</div>
  }

  → Faster initial paint
  → Trade-off: có thể gây layout shift

═══════════════════════════════════════════════════════════════
```

---

## 4. Bundle Size Optimization — CRITICAL

> Giảm initial bundle size → cải thiện **TTI** (Time to Interactive) và **LCP** (Largest Contentful Paint).

### 4.1 Tránh Barrel File Imports

```
RULE: Import TRỰC TIẾP, tránh barrel files:
═══════════════════════════════════════════════════════════════

  Barrel file = index.js re-export mọi thứ:
  export * from './module1'
  export * from './module2'
  ...

  ❌ SAI — load TOÀN BỘ library:

  import { Check, X, Menu } from 'lucide-react'
  // Load 1,583 modules → ~2.8s dev, 200-800ms cold start!

  import { Button, TextField } from '@mui/material'
  // Load 2,225 modules → ~4.2s dev!

  ✅ ĐÚNG — import trực tiếp:

  import Check from 'lucide-react/dist/esm/icons/check'
  import X     from 'lucide-react/dist/esm/icons/x'
  import Menu  from 'lucide-react/dist/esm/icons/menu'
  // 3 modules (~2KB vs ~1MB)

  import Button    from '@mui/material/Button'
  import TextField from '@mui/material/TextField'

  ✅ ALTERNATIVE (Next.js 13.5+):

  // next.config.js
  module.exports = {
    experimental: {
      optimizePackageImports: ['lucide-react', '@mui/material']
    }
  }
  // → Tự động transform barrel → direct imports at build time!

  HIỆU QUẢ:
  → 15-70% faster dev boot
  → 28% faster builds
  → 40% faster cold starts

  LIBRARIES BỊ ẢNH HƯỞNG:
  lucide-react, @mui/material, @mui/icons-material,
  @tabler/icons-react, react-icons, @headlessui/react,
  @radix-ui/react-*, lodash, date-fns, rxjs

═══════════════════════════════════════════════════════════════
```

### 4.2 Dynamic Import — Lazy Load Heavy Components

```
RULE: Dùng next/dynamic cho component NẶNG:
═══════════════════════════════════════════════════════════════

  ❌ SAI — MonacoEditor (~300KB) bundle vào main chunk:

  import { MonacoEditor } from './monaco-editor'

  function CodePanel({ code }) {
    return <MonacoEditor value={code} />
  }

  ✅ ĐÚNG — load ON DEMAND:

  import dynamic from 'next/dynamic'

  const MonacoEditor = dynamic(
    () => import('./monaco-editor').then(m => m.MonacoEditor),
    { ssr: false }
  )

  function CodePanel({ code }) {
    return <MonacoEditor value={code} />
  }

  → Trực tiếp giảm TTI và LCP!

═══════════════════════════════════════════════════════════════
```

### 4.3 Defer Third-Party & Preload on Intent

```
2 KỸ THUẬT BỔ SUNG:
═══════════════════════════════════════════════════════════════

  ① DEFER NON-CRITICAL LIBRARIES:

  // Analytics, logging, error tracking → load SAU hydration
  const Analytics = dynamic(
    () => import('@vercel/analytics/react').then(m => m.Analytics),
    { ssr: false }
  )

  ② PRELOAD ON HOVER/FOCUS:

  function EditorButton({ onClick }) {
    const preload = () => {
      void import('./monaco-editor')  // Preload!
    }

    return (
      <button
        onMouseEnter={preload}  // Hover → start loading
        onFocus={preload}       // Tab → start loading
        onClick={onClick}
      >
        Open Editor
      </button>
    )
  }

  → User hover 200-500ms trước khi click
  → Đủ thời gian để start download!

═══════════════════════════════════════════════════════════════
```

---

## 5. Server-Side Performance — HIGH

### 5.1 React.cache() — Per-Request Deduplication

```
RULE: Dùng React.cache() cho server-side dedup:
═══════════════════════════════════════════════════════════════

  import { cache } from 'react'

  export const getCurrentUser = cache(async () => {
    const session = await auth()
    if (!session?.user?.id) return null
    return await db.user.findUnique({
      where: { id: session.user.id }
    })
  })

  // Trong 1 request:
  // Component A gọi getCurrentUser() → DB query, cached
  // Component B gọi getCurrentUser() → Cache hit, NO query!

  ⚠️ CHÚ Ý — Object.is() shallow equality:

  ❌ cache(async (params: { uid: 1 }) => ...)
  getUser({ uid: 1 })  // Query
  getUser({ uid: 1 })  // Cache MISS! (new object reference)

  ✅ const p = { uid: 1 }
  getUser(p)  // Query
  getUser(p)  // Cache HIT! (same reference)

  → Next.js fetch() đã có auto-dedup rồi
  → React.cache() cần cho: DB queries, auth, heavy compute

═══════════════════════════════════════════════════════════════
```

### 5.2 Minimize RSC Serialization & Parallel Fetching

```
2 RULES SERVER QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ① MINIMIZE SERIALIZATION — chỉ truyền field CẦN:

  ❌ async function Page() {
    const user = await fetchUser()      // 50 fields!
    return <Profile user={user} />      // Serialize ALL
  }

  ✅ async function Page() {
    const user = await fetchUser()
    return <Profile name={user.name} /> // Serialize 1 field!
  }

  ② PARALLEL FETCHING — restructure components:

  ❌ Page await → rồi mới render Sidebar (waterfall):

  export default async function Page() {
    const header = await fetchHeader()    // Block!
    return (
      <div>
        <div>{header}</div>
        <Sidebar />                       // Chờ header xong
      </div>
    )
  }

  ✅ Tách riêng → cả 2 fetch ĐỒNG THỜI:

  async function Header() {
    const data = await fetchHeader()
    return <div>{data}</div>
  }

  async function Sidebar() {
    const items = await fetchSidebarItems()
    return <nav>{items.map(renderItem)}</nav>
  }

  export default function Page() {
    return (
      <div>
        <Header />     {/* Fetch song song! */}
        <Sidebar />    {/* Fetch song song! */}
      </div>
    )
  }

═══════════════════════════════════════════════════════════════
```

### 5.3 LRU Cache & after()

```
2 PATTERNS NỐI TIẾP:
═══════════════════════════════════════════════════════════════

  ① LRU CACHE — cross-request caching:

  import { LRUCache } from 'lru-cache'

  const cache = new LRUCache<string, any>({
    max: 1000,
    ttl: 5 * 60 * 1000  // 5 phút
  })

  export async function getUser(id) {
    const cached = cache.get(id)
    if (cached) return cached

    const user = await db.user.findUnique({ where: { id } })
    cache.set(id, user)
    return user
  }

  // Request 1: DB query, cached
  // Request 2: cache hit → NO DB query!

  → React.cache() chỉ trong 1 request
  → LRU Cache hoạt động XUYÊN requests

  ② after() — non-blocking post-response:

  import { after } from 'next/server'

  export async function POST(request) {
    await updateDatabase(request)

    // Logging chạy SAU khi response đã gửi
    after(async () => {
      await logUserAction(request)
    })

    return Response.json({ success: true })
    // Response gửi TRƯỚC khi log xong!
  }

═══════════════════════════════════════════════════════════════
```

---

## 6. Client-Side Data Fetching — MEDIUM-HIGH

```
3 RULES CLIENT:
═══════════════════════════════════════════════════════════════

  ① SWR — automatic request deduplication:

  import useSWR from 'swr'

  // Component A dùng useSWR('/api/user', fetcher)
  // Component B dùng useSWR('/api/user', fetcher)
  // → CHỈ 1 request! SWR tự dedup!

  ② DEDUPLICATE EVENT LISTENERS:

  ❌ Mỗi component tự add listener:
  useEffect(() => {
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  })

  ✅ Share qua custom hook (singleton pattern):
  function useWindowResize(callback) {
    // Dùng global reference, add/remove chỉ 1 lần
  }

  ③ PASSIVE EVENT LISTENERS cho scroll:

  // Passive = browser biết handler KHÔNG gọi preventDefault
  // → Scroll MƯỢT hơn nhiều!
  element.addEventListener('scroll', handler, { passive: true })

═══════════════════════════════════════════════════════════════
```

---

## 7. Re-render Optimization — MEDIUM

### 7.1 Lazy State Initialization

```
RULE: Dùng FUNCTION cho useState expensive values:
═══════════════════════════════════════════════════════════════

  ❌ SAI — JSON.parse chạy MỌI LẦN render:

  function UserProfile() {
    const [settings, setSettings] = useState(
      JSON.parse(localStorage.getItem('settings') || '{}')
    )
    //      ↑ Chạy MỌI render! Dù giá trị chỉ dùng 1 LẦN!
  }

  ✅ ĐÚNG — chỉ chạy 1 lần:

  function UserProfile() {
    const [settings, setSettings] = useState(() => {
      const stored = localStorage.getItem('settings')
      return stored ? JSON.parse(stored) : {}
    })
    //   ↑ Arrow function → React CHỈ gọi lần đầu!
  }

  CẦN dùng lazy init khi:
  → localStorage/sessionStorage read
  → Build data structures (indexes, maps)
  → Heavy transformations
  KHÔNG CẦN khi: useState(0), useState(props.value), useState({})

═══════════════════════════════════════════════════════════════
```

### 7.2 Các Rules Re-render Khác

```
6 RULES BỔ SUNG — TRÁNH RE-RENDER KHÔNG CẦN THIẾT:
═══════════════════════════════════════════════════════════════

  ① DEFER STATE READS — không subscribe state chỉ dùng trong callback:

  ❌ const count = useStore(s => s.count) // Re-render khi count thay đổi
  onClick={() => alert(count)}

  ✅ const countRef = useRef()
  // Truy cập trong callback mà KHÔNG trigger re-render

  ② EXTRACT EXPENSIVE WORK → memoized components:

  ❌ <Parent>
       {/* expensive computation */}
       <ExpensiveChart data={processData(rawData)} />
     </Parent>

  ✅ const MemoChart = React.memo(ExpensiveChart)
  <MemoChart data={data} />

  ③ NARROW EFFECT DEPENDENCIES — dùng primitive:

  ❌ useEffect(() => {...}, [config])
  // config = object → mỗi render tạo reference mới!

  ✅ useEffect(() => {...}, [config.theme, config.lang])
  // Primitive values → stable comparison!

  ④ SUBSCRIBE TO DERIVED STATE — derived booleans:

  ❌ const items = useStore(s => s.items)
  const hasItems = items.length > 0  // Re-render khi items thay đổi

  ✅ const hasItems = useStore(s => s.items.length > 0)
  // Chỉ re-render khi KẾT QUẢ boolean thay đổi!

  ⑤ FUNCTIONAL setState:

  ❌ setCount(count + 1) // Phụ thuộc closure → cần count trong deps

  ✅ setCount(prev => prev + 1) // Stable callback, không cần dep!

  ⑥ startTransition — non-urgent updates:

  import { startTransition } from 'react'

  startTransition(() => {
    setSearchResults(filtered)  // Đánh dấu LOW priority
  })
  // UI input vẫn responsive, search results update sau!

═══════════════════════════════════════════════════════════════
```

---

## 8. Rendering Performance — MEDIUM

```
7 RULES RENDERING:
═══════════════════════════════════════════════════════════════

  ① HOIST STATIC JSX — tách static elements RA NGOÀI component:

  ❌ function Card({ title }) {
    const icon = <Icon name="star" />  // Tạo MỖI render!
    return <div>{icon} {title}</div>
  }

  ✅ const icon = <Icon name="star" /> // Tạo 1 LẦN!
  function Card({ title }) {
    return <div>{icon} {title}</div>
  }

  ② CSS content-visibility cho LONG LISTS:

  .list-item {
    content-visibility: auto;
    contain-intrinsic-size: 0 100px;
  }
  // Browser SKIP rendering off-screen items!

  ③ ANIMATE SVG WRAPPER, not SVG element:

  ❌ <motion.svg animate={{...}} />    // Re-render SVG = TỐN!
  ✅ <motion.div><svg /></motion.div>  // Chỉ animate wrapper

  ④ REDUCE SVG PRECISION:

  ❌ d="M12.345678 9.876543"
  ✅ d="M12.3 9.9"
  // Giảm kích thước file, không ảnh hưởng visual!

  ⑤ PREVENT HYDRATION MISMATCH (no flicker):

  // Dùng inline script thay vì useEffect cho client-only data:
  <script dangerouslySetInnerHTML={{
    __html: `document.documentElement.dataset.theme =
      localStorage.getItem('theme') ?? 'light'`
  }} />
  // Chạy TRƯỚC React hydrate → NO FLICKER!

  ⑥ ACTIVITY COMPONENT (React 19+) — show/hide:

  <Activity mode={isVisible ? 'visible' : 'hidden'}>
    <HeavyComponent />
  </Activity>
  // 'hidden' = unmount BUT preserve state!

  ⑦ EXPLICIT CONDITIONAL RENDERING:

  ❌ {count && <Component />}     // count=0 → render "0" text!
  ✅ {count > 0 ? <Component /> : null}  // Explicit boolean!

═══════════════════════════════════════════════════════════════
```

---

## 9. JavaScript Performance — LOW-MEDIUM

```
12 RULES JS THUẦN — MICRO-OPTIMIZATION NHƯNG TÍCH LŨY:
═══════════════════════════════════════════════════════════════

  ① BATCH DOM CSS CHANGES:

  ❌ el.style.width = '100px'   // Trigger reflow!
  el.style.height = '50px'     // Trigger reflow AGAIN!

  ✅ el.classList.add('sized')  // 1 reflow!
  // Hoặc: el.style.cssText = 'width:100px;height:50px'

  ② BUILD INDEX MAPS for repeated lookups:

  ❌ users.find(u => u.id === targetId)  // O(n) MỖI LẦN

  ✅ const userMap = new Map(users.map(u => [u.id, u]))
  userMap.get(targetId)                   // O(1)!

  ③ CACHE PROPERTY ACCESS in loops:

  ❌ for (let i = 0; i < arr.length; i++) { arr[i].x.y.z }

  ✅ const len = arr.length
  for (let i = 0; i < len; i++) {
    const item = arr[i]; item.x.y.z
  }

  ④ CACHE FUNCTION RESULTS — module-level Map:

  const memo = new Map()
  function expensiveCalc(key) {
    if (memo.has(key)) return memo.get(key)
    const result = /* heavy work */
    memo.set(key, result)
    return result
  }

  ⑤ CACHE STORAGE API CALLS:

  ❌ localStorage.getItem('theme')  // MỖI LẦN truy cập disk!

  ✅ let cachedTheme = null
  function getTheme() {
    if (!cachedTheme) cachedTheme = localStorage.getItem('theme')
    return cachedTheme
  }

  ⑥ COMBINE MULTIPLE ITERATIONS:

  ❌ const active = items.filter(i => i.active)
  const names  = active.map(i => i.name)
  const sorted = names.sort()
  // 3 lần iterate!

  ✅ const result = []
  for (const item of items) {
    if (item.active) result.push(item.name)
  }
  result.sort()
  // 1 lần iterate!

  ⑦ EARLY LENGTH CHECK:

  ❌ arraysEqual(a, b)  // Compare mọi element

  ✅ if (a.length !== b.length) return false
  // Check length TRƯỚC → early exit!

  ⑧ EARLY RETURN:

  function process(data) {
    if (!data) return null         // Exit SỚM!
    if (data.cached) return data.cached
    // ... heavy logic chỉ khi thật sự cần
  }

  ⑨ HOIST REGEXP outside loops:

  ❌ for (const s of strings) { s.match(/complex-regex/g) }
  // Compile regex MỖI iteration!

  ✅ const re = /complex-regex/g
  for (const s of strings) { s.match(re) }

  ⑩ USE LOOP for min/max (không sort):

  ❌ arr.sort((a,b) => a-b)[0]         // O(n log n)!
  ✅ Math.min(...arr)                   // O(n)
  // Hoặc loop nếu arr rất lớn (tránh spread stack overflow)

  ⑪ USE Set/Map for O(1) lookups:

  ❌ const exists = arr.includes(target)  // O(n)
  ✅ const set = new Set(arr)
  set.has(target)                          // O(1)

  ⑫ toSorted() thay sort() cho immutability:

  ❌ const sorted = arr.sort()  // MUTATE arr gốc!
  ✅ const sorted = arr.toSorted()  // Trả array MỚI!

═══════════════════════════════════════════════════════════════
```

---

## 10. Advanced Patterns — LOW

```
2 PATTERNS NÂNG CAO:
═══════════════════════════════════════════════════════════════

  ① STORE EVENT HANDLERS IN REFS:

  // Tránh re-render children khi handler thay đổi
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener = (e) => handlerRef.current(e)
    window.addEventListener('resize', listener)
    return () => window.removeEventListener('resize', listener)
  }, [])  // Empty deps → NEVER re-attach!

  ② useLatest — stable callback refs:

  function useLatest<T>(value: T) {
    const ref = useRef(value)
    ref.current = value
    return ref
  }

  // Dùng:
  const latestCallback = useLatest(onUpdate)
  useEffect(() => {
    element.addEventListener('change', (e) => {
      latestCallback.current(e)  // Luôn dùng callback MỚI NHẤT
    })
  }, [])  // Không cần dependency!

═══════════════════════════════════════════════════════════════
```

---

## 11. Tổng Kết & Bảng Rules Quick Reference

```
45+ RULES — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  🔴 CRITICAL (làm đầu tiên):
  ┌──────────────────────────────────────────────────────────┐
  │ async-defer-await     │ Dời await vào branch cần dùng   │
  │ async-parallel        │ Promise.all() cho independent ops│
  │ async-api-routes      │ Start promise early, await late  │
  │ async-suspense        │ Suspense boundaries stream UI   │
  │ bundle-barrel-imports │ Import trực tiếp, tránh barrel  │
  │ bundle-dynamic        │ next/dynamic cho heavy component │
  │ bundle-defer-3rd      │ Analytics load sau hydration    │
  │ server-parallel       │ Restructure RSC để parallel fetch│
  └──────────────────────────────────────────────────────────┘

  🟠 HIGH:
  ┌──────────────────────────────────────────────────────────┐
  │ server-cache-react    │ React.cache() per-request dedup  │
  │ server-cache-lru      │ LRU cache cross-request          │
  │ server-serialization  │ Chỉ truyền field client cần     │
  │ server-after          │ after() cho non-blocking ops     │
  │ bundle-conditional    │ Load module khi feature active   │
  └──────────────────────────────────────────────────────────┘

  🟡 MEDIUM-HIGH:
  ┌──────────────────────────────────────────────────────────┐
  │ client-swr-dedup      │ SWR auto-dedup requests          │
  │ client-event-listeners│ Singleton global listeners       │
  │ client-passive        │ Passive scroll listeners         │
  └──────────────────────────────────────────────────────────┘

  🟢 MEDIUM:
  ┌──────────────────────────────────────────────────────────┐
  │ rerender-lazy-init    │ useState(() => expensive())     │
  │ rerender-defer-reads  │ Không subscribe unused state     │
  │ rerender-memo         │ React.memo cho expensive         │
  │ rerender-dependencies │ Primitive effect deps            │
  │ rerender-derived      │ Subscribe derived booleans       │
  │ rerender-functional   │ Functional setState              │
  │ rerender-transitions  │ startTransition non-urgent       │
  │ rendering-hoist-jsx   │ Static JSX ngoài component      │
  │ rendering-content-vis │ content-visibility long lists    │
  │ rendering-conditional │ Ternary thay && cho conditional  │
  └──────────────────────────────────────────────────────────┘

  🔵 LOW-MEDIUM + ⚪ LOW:
  ┌──────────────────────────────────────────────────────────┐
  │ js-batch-dom          │ Batch CSS changes                │
  │ js-index-maps         │ Map cho repeated lookups         │
  │ js-combine-iterations │ 1 loop thay n filter/map        │
  │ js-set-map-lookups    │ Set/Map cho O(1)                 │
  │ js-early-exit         │ Return early                     │
  │ js-tosorted           │ toSorted() immutable             │
  │ advanced-handler-refs │ Handler trong refs               │
  │ advanced-use-latest   │ useLatest stable callback        │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Real-World Case Studies (Vercel)

```
CASE STUDIES TỪ PRODUCTION:
═══════════════════════════════════════════════════════════════

  ① MERGE LOOP ITERATIONS:

  Chat window scan messages list 8 LẦN riêng biệt
  → Combine thành 1 LẦN scan
  → Thousands messages = significant improvement!

  ② PARALLELIZE AWAIT:

  API chờ DB call A xong → mới bắt đầu DB call B
  (dù KHÔNG CÓ dependency giữa A và B)
  → Promise.all([A, B]) → total wait giảm 50%!

  ③ LAZY STATE INIT:

  Component parse JSON config localStorage MỖI LẦN render
  (dù chỉ cần 1 lần cho state init)
  → useState(() => JSON.parse(...))
  → Eliminate unnecessary work!

═══════════════════════════════════════════════════════════════
```

---

## 12. Câu Hỏi Phỏng Vấn

### Q1: Vercel xếp hạng performance optimization thế nào? Bắt đầu từ đâu?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  8 categories theo impact:                                   │
│                                                              │
│  🔴 CRITICAL: Waterfall elimination + Bundle size            │
│  🟠 HIGH: Server-side performance                            │
│  🟡 MED-HIGH: Client data fetching                           │
│  🟢 MEDIUM: Re-render + Rendering                            │
│  🔵 LOW: JS perf + Advanced patterns                         │
│                                                              │
│  BẮT ĐẦU TỪ TRÊN XUỐNG:                                     │
│  → Nếu waterfall thêm 600ms thì useMemo vô ích             │
│  → Nếu bundle thừa 300KB thì loop optimization vô nghĩa    │
│  → Fix CRITICAL trước → giải quyết 80% vấn đề              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: Waterfall là gì? Tại sao là #1 killer?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Waterfall = async operations chạy TUẦN TỰ thay vì song song│
│                                                              │
│  const a = await fetchA()  // 200ms                          │
│  const b = await fetchB()  // 200ms  ← CHỜ a xong!         │
│  const c = await fetchC()  // 200ms  ← CHỜ b xong!        │
│  // Tổng: 600ms                                              │
│                                                              │
│  → Promise.all([fetchA(), fetchB(), fetchC()])               │
│  // Tổng: 200ms (max thay vì sum!)                           │
│                                                              │
│  Là #1 killer vì:                                            │
│  → Mỗi await thêm FULL network latency                      │
│  → Lỗi tích lũy: 3 calls tuần tự → gấp 3 latency          │
│  → Rất dễ vô tình viết (async/await syntax encourage nó)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Barrel file imports có vấn đề gì? Cách fix?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Barrel file = index.js re-export everything:                │
│  export * from './a'; export * from './b'; ...               │
│                                                              │
│  Khi import { Check } from 'lucide-react':                   │
│  → Load 1,583 modules! (dù chỉ dùng 1)                      │
│  → 200-800ms cold start cost                                 │
│  → Tree-shaking KHÔNG giúp khi lib là external               │
│                                                              │
│  Fix:                                                        │
│  ① Import trực tiếp:                                         │
│     import Check from 'lucide-react/dist/esm/icons/check'   │
│  ② Next.js optimizePackageImports:                           │
│     experimental: { optimizePackageImports: ['lucide-react'] │
│     → Auto-transform tại build time                          │
│                                                              │
│  Kết quả: 15-70% faster dev, 28% faster builds,             │
│  40% faster cold starts                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: React.cache() vs LRU Cache — khác nhau thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────┬────────────────┬───────────────────┐  │
│  │                  │ React.cache()  │ LRU Cache          │  │
│  ├──────────────────┼────────────────┼───────────────────┤  │
│  │ Scope            │ 1 request      │ Cross-request      │  │
│  │ Lifetime         │ Request ends   │ TTL (e.g., 5 min)  │  │
│  │                  │ → cache gone   │ + max entries       │  │
│  │ Equality         │ Object.is()    │ Key string         │  │
│  │ Use case         │ DB query dedup │ User data reuse    │  │
│  │                  │ Auth check     │ Config cache       │  │
│  │ Next.js fetch    │ Auto-dedup!    │ Không auto         │  │
│  └──────────────────┴────────────────┴───────────────────┘  │
│                                                              │
│  React.cache(): Component A & B trong cùng 1 request gọi   │
│  getCurrentUser() → chỉ 1 DB query!                         │
│                                                              │
│  LRU Cache: Request A query user → cached.                   │
│  Request B (5 giây sau) → cache HIT, no DB query!           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: useState lazy init là gì? Khi nào cần?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Truyền FUNCTION thay vì VALUE cho useState:                 │
│                                                              │
│  ❌ useState(JSON.parse(localStorage.getItem('x')))          │
│  → JSON.parse chạy MỌI RENDER! (dù kết quả bị bỏ qua)     │
│                                                              │
│  ✅ useState(() => JSON.parse(localStorage.getItem('x')))    │
│  → React CHỈ gọi function lần ĐẦU TIÊN!                    │
│                                                              │
│  CẦN dùng khi:                                               │
│  → localStorage / sessionStorage read                        │
│  → Build data structures (Map, index)                        │
│  → Heavy computation / transformation                        │
│                                                              │
│  KHÔNG CẦN khi:                                               │
│  → Primitive: useState(0), useState('')                      │
│  → Props ref: useState(props.value)                          │
│  → Simple literal: useState([])                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: Suspense boundary khi nào nên dùng? Khi nào không?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  NÊN DÙNG:                                                   │
│  → Data fetching KHÔNG block layout (sidebar, footer...)    │
│  → Heavy component có thể stream vào sau                     │
│  → Faster initial paint quan trọng hơn content jump         │
│                                                              │
│  KHÔNG NÊN DÙNG:                                             │
│  → SEO-critical content above the fold                       │
│  → Data cần cho layout decisions (affect positioning)        │
│  → Small, fast queries (Suspense overhead > benefit)         │
│  → Muốn tránh layout shift (loading → content jump)         │
│                                                              │
│  Trade-off: Faster initial paint ↔ Layout shift potential   │
│  → Chọn dựa trên UX priorities của ứng dụng                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q7: content-visibility CSS property hoạt động thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  .list-item {                                                │
│    content-visibility: auto;                                 │
│    contain-intrinsic-size: 0 100px;                          │
│  }                                                           │
│                                                              │
│  → Browser SKIP rendering elements NGOÀI viewport           │
│  → contain-intrinsic-size cho browser "ước lượng" chiều cao │
│    (để scrollbar đúng)                                       │
│  → Khi scroll tới → browser render element                   │
│  → Giống "virtual list" nhưng NATIVE CSS, không cần JS!    │
│                                                              │
│  Lưu ý:                                                      │
│  → Chỉ tốt cho LONG LISTS (>100 items)                      │
│  → Không thay thế hoàn toàn virtual list cho millions items │
│  → Browser support: Chrome 85+, Edge 85+, Firefox 125+      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q8: Tại sao {count && <C />} nguy hiểm?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ❌ {count && <Component />}                                  │
│                                                              │
│  Khi count = 0:                                              │
│  → 0 && <Component /> → React render "0" TEXT trên UI!      │
│  → Vì 0 là falsy NHƯNG là valid React node (number)         │
│                                                              │
│  Tương tự: "" (empty string), NaN                            │
│                                                              │
│  ✅ {count > 0 ? <Component /> : null}                       │
│  ✅ {Boolean(count) && <Component />}                        │
│  ✅ {!!count && <Component />}                               │
│                                                              │
│  → Luôn dùng EXPLICIT boolean check                          │
│  → Tránh render giá trị falsy không mong muốn               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
