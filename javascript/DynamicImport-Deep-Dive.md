# Dynamic Import — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 15 phút đọc
>
> Dynamic Import, Code Splitting, React.lazy, Suspense,
> Loadable Components, Webpack Chunk Names,
> Bundle Size Optimization, SSR compatibility
> Độ khó: ⭐️⭐️⭐️⭐️ | Performance Pattern
>
> _Dựa trên patterns.dev — Addy Osmani & Lydia Hallie_

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | Vấn đề — Tại sao cần Dynamic Import?       |
| 2   | Dynamic Import là gì?                      |
| 3   | React.lazy + Suspense                      |
| 4   | Loadable Components (SSR)                  |
| 5   | Webpack — Bundle Analysis                  |
| 6   | Các chiến lược Dynamic Import              |
| 7   | Import on Visibility / Interaction / Route |
| 8   | Prefetching & Preloading Chunks            |
| 9   | Sai lầm thường gặp                         |
| 10  | Tóm tắt phỏng vấn                          |

---

## §1. Vấn đề — Tại sao cần Dynamic Import?

```
VẤN ĐỀ: BUNDLE QUÁ LỚN!
═══════════════════════════════════════════════════════════════

  Ứng dụng Chat có 4 components:
  ┌──────────────────────────────────────────────────────┐
  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
  │  │  UserInfo   │  │  ChatList  │  │  ChatInput   │   │
  │  │  ✅ CẦN NGAY│  │  ✅ CẦN NGAY│  │  ✅ CẦN NGAY │   │
  │  └────────────┘  └────────────┘  └──────────────┘   │
  │                                                      │
  │  ┌──────────────────────────────────────────────┐    │
  │  │              EmojiPicker                      │    │
  │  │  ❌ KHÔNG CẦN NGAY! Chỉ hiện khi user click! │    │
  │  │  ❌ Có thể KHÔNG BAO GIỜ hiện!                │    │
  │  └──────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────┘

  STATIC IMPORT (❌ TẤT CẢ vào 1 bundle):
  ┌──────────────────────────────────────────────────────┐
  │ main.bundle.js ────────────────────── 1.5 MiB        │
  │ ┌──────────┬──────────┬──────────┬──────────────┐    │
  │ │ UserInfo │ ChatList │ChatInput │ EmojiPicker  │    │
  │ │          │          │          │ (LÃNG PHÍ!)  │    │
  │ └──────────┴──────────┴──────────┴──────────────┘    │
  │ → User phải TẢI 1.5MB trước khi THẤY bất cứ gì!    │
  └──────────────────────────────────────────────────────┘

  DYNAMIC IMPORT (✅ TÁCH bundle):
  ┌──────────────────────────────────────────────────────┐
  │ main.bundle.js ────────────────────── 1.33 MiB ✅    │
  │ ┌──────────┬──────────┬──────────┐                   │
  │ │ UserInfo │ ChatList │ChatInput │  ← Tải NGAY       │
  │ └──────────┴──────────┴──────────┘                   │
  │                                                      │
  │ emoji-picker.bundle.js ──────────── 1.48 KiB         │
  │ vendors~emoji-picker.bundle.js ──── 171 KiB          │
  │ → Chỉ tải KHI USER CLICK vào emoji icon!            │
  │                                                      │
  │ → GIẢM 170KB từ initial bundle! (1.5MB → 1.33MB)    │
  └──────────────────────────────────────────────────────┘
```

---

## §2. Dynamic Import là gì?

```
DYNAMIC IMPORT — CƠ CHẾ HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  STATIC IMPORT (truyền thống):
  ┌────────────────────────────────────────────────────┐
  │ import EmojiPicker from './EmojiPicker';           │
  │                                                    │
  │ → Bundler (Webpack) đưa VÀO main bundle!           │
  │ → Tải NGAY LẬP TỨC dù chưa cần!                  │
  │ → KHÔNG THỂ tách ra được!                          │
  └────────────────────────────────────────────────────┘

  DYNAMIC IMPORT (ES2020):
  ┌────────────────────────────────────────────────────┐
  │ const module = await import('./EmojiPicker');       │
  │                                                    │
  │ → import() trả về PROMISE!                         │
  │ → Bundler tạo CHUNK RIÊNG cho module!              │
  │ → Chỉ tải khi DÒNG CODE NÀY CHẠY!                │
  │ → → "Lazy loading" / "Code splitting"!             │
  └────────────────────────────────────────────────────┘

  SƠ ĐỒ SO SÁNH:
  ────────────────────────────────────────────────────

  STATIC:                      DYNAMIC:
  ┌─────────┐                  ┌─────────┐
  │ Build   │                  │ Build   │
  └────┬────┘                  └────┬────┘
       │                            │
       ▼                            ▼
  ┌─────────┐               ┌─────────┐  ┌──────────┐
  │ 1 GIANT │               │ main.js │  │chunk-1.js│
  │ bundle  │               │ (nhỏ!)  │  │(lazy!)   │
  │ 1.5MB   │               │ 1.33MB  │  │ 172KB    │
  └─────────┘               └────┬────┘  └─────┬────┘
       │                         │              │
       ▼                         ▼              ▼
  User chờ                  Tải NGAY!      Tải KHI CẦN!
  1.5MB...😴                → FCP nhanh!   → User click!
```

---

## §3. React.lazy + Suspense

```
REACT.LAZY + SUSPENSE — CÁCH 1 (CSR):
═══════════════════════════════════════════════════════════════

  ┌─────────────────── TRƯỚC ──────────────────────────┐
  │ import EmojiPicker from './EmojiPicker'; // ❌      │
  │ → EmojiPicker LUÔN nằm trong main bundle!          │
  └────────────────────────────────────────────────────┘

  ┌─────────────────── SAU ────────────────────────────┐
  │ const Picker = lazy(() =>                          │
  │   import(/* webpackChunkName: "emoji-picker" */    │
  │     './EmojiPicker')                               │
  │ );                                                 │
  │                                                    │
  │ // lazy() bọc dynamic import()                     │
  │ // → Webpack tạo chunk riêng "emoji-picker"!       │
  │ // → Chỉ tải khi <Picker /> RENDER lần đầu!       │
  └────────────────────────────────────────────────────┘

  LUỒNG HOẠT ĐỘNG:
  ─────────────────────────────────────────────────────

  User click Emoji
       │
       ▼
  pickerOpen = true
       │
       ▼
  {pickerOpen && <Picker />}  ← Render lần đầu!
       │
       ▼
  React thấy lazy component → CHƯA TẢI!
       │
       ▼
  ┌───────────────────────────────────────┐
  │ <Suspense fallback={<Loading.../>}>  │ ← Hiện fallback!
  └────────────────┬──────────────────────┘
                   │
                   ▼
  Network: GET emoji-picker.bundle.js ──→ 172KB
                   │
                   ▼
  Module tải xong → React THAY fallback bằng <Picker/>!
                   │
                   ▼
  🎉 EmojiPicker hiển thị!
```

```jsx
// ═══ CODE MẪU — REACT.LAZY + SUSPENSE ═══

import React, { Suspense, lazy, useReducer } from "react";

// ① Lazy import với webpackChunkName
const Send = lazy(
  () => import(/* webpackChunkName: "send-icon" */ "./icons/Send"),
);
const Emoji = lazy(
  () => import(/* webpackChunkName: "emoji-icon" */ "./icons/Emoji"),
);
const Picker = lazy(
  () => import(/* webpackChunkName: "emoji-picker" */ "./EmojiPicker"),
);

const ChatInput = () => {
  // ② Toggle state
  const [pickerOpen, togglePicker] = useReducer((state) => !state, false);

  return (
    // ③ Suspense bọc lazy components
    <Suspense fallback={<p id="loading">Loading...</p>}>
      <div className="chat-input-container">
        <input type="text" placeholder="Type a message..." />
        <Emoji onClick={togglePicker} />
        {/* ④ Chỉ render (= chỉ TẢI) khi pickerOpen */}
        {pickerOpen && <Picker />}
        <Send />
      </div>
    </Suspense>
  );
};
```

```
SUSPENSE — FALLBACK MECHANISM:
═══════════════════════════════════════════════════════════════

  Thời gian →

  ┌──────────┐  ┌────────────────┐  ┌──────────────────┐
  │ User     │→ │  "Loading..."  │→ │  EmojiPicker     │
  │ click 😀 │  │  (fallback!)   │  │  hiển thị! 🎉    │
  └──────────┘  └────────────────┘  └──────────────────┘
                │← chunk loading →│
                   ~100-500ms

  TẠI SAO CẦN FALLBACK?
  → Cho user biết app KHÔNG BỊ ĐỨNG!
  → Chỉ cần CHỜ module tải + parse + execute!
  → UX tốt hơn nhiều so với blank screen!
```

---

## §4. Loadable Components (SSR)

```
VẤN ĐỀ VỚI SSR:
═══════════════════════════════════════════════════════════════

  React.Suspense + lazy() → KHÔNG hỗ trợ SSR! ❌
  → Server KHÔNG THỂ render lazy component!
  → → Cần thư viện thay thế!

  GIẢI PHÁP: @loadable/component ✅
  → Hỗ trợ cả SSR lẫn CSR!
  → API tương tự React.lazy!
  → Có thêm SSR utilities (ChunkExtractor, etc.)!
```

```jsx
// ═══ LOADABLE COMPONENTS — SSR COMPATIBLE ═══

import React from "react";
import loadable from "@loadable/component";
import Send from "./icons/Send";
import Emoji from "./icons/Emoji";

// ① loadable() thay cho lazy()
const EmojiPicker = loadable(() => import("./EmojiPicker"), {
  fallback: <div id="loading">Loading...</div>,
});

const ChatInput = () => {
  const [pickerOpen, togglePicker] = React.useReducer((state) => !state, false);

  return (
    <div className="chat-input-container">
      <input type="text" placeholder="Type a message..." />
      <Emoji onClick={togglePicker} />
      {/* ② Tương tự React.lazy — chỉ tải khi render */}
      {pickerOpen && <EmojiPicker />}
      <Send />
    </div>
  );
};
```

```
SO SÁNH: React.lazy vs @loadable/component
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬────────────────────┐
  │ Tiêu chí         │ React.lazy   │ @loadable/component│
  ├──────────────────┼──────────────┼────────────────────┤
  │ CSR              │ ✅            │ ✅                  │
  │ SSR              │ ❌            │ ✅                  │
  │ Suspense cần?    │ ✅ BẮT BUỘC  │ ❌ Tùy chọn        │
  │ Fallback         │ Qua Suspense │ Qua options {}     │
  │ Library splitting│ ❌            │ ✅                  │
  │ Full dynamic     │ ❌            │ ✅                  │
  │ import           │              │ loadable.lib()     │
  │ Babel plugin     │ Không cần    │ Cần cho SSR        │
  │ Bundle size      │ 0 (built-in) │ ~2KB               │
  └──────────────────┴──────────────┴────────────────────┘

  KHI NÀO DÙNG GÌ?
  → CSR only (Vite, CRA): React.lazy + Suspense ✅
  → SSR (Next.js pages): @loadable/component ✅
  → Next.js 13+ (App Router): next/dynamic ✅
```

---

## §5. Webpack — Bundle Analysis

```
WEBPACK CHUNK OUTPUT — TRƯỚC vs SAU:
═══════════════════════════════════════════════════════════════

  ❌ TRƯỚC (static import):
  ┌─────────────────────────────────────────────────────┐
  │ Asset               Size      Chunk     Chunk Names │
  │ main.bundle.js      1.5 MiB   main      main       │
  │                                                     │
  │ → MỌI THỨ trong 1 file duy nhất!                   │
  └─────────────────────────────────────────────────────┘

  ✅ SAU (dynamic import):
  ┌─────────────────────────────────────────────────────┐
  │ Asset                          Size     Chunk Names │
  │ main.bundle.js                 1.33 MiB main       │
  │ emoji-picker.bundle.js        1.48 KiB emoji-picker│
  │ vendors~emoji-picker.bundle.js 171 KiB  vendors~.. │
  │                                                     │
  │ → main GIẢM 170KB!                                 │
  │ → emoji-picker tách thành 2 chunks riêng!          │
  │ → vendors~ = thư viện 3P dùng bởi emoji-picker!   │
  └─────────────────────────────────────────────────────┘

  webpackChunkName — ĐẶT TÊN CHUNK:
  ┌────────────────────────────────────────────────────┐
  │ // Magic comment → Webpack đặt tên chunk!          │
  │ import(/* webpackChunkName: "emoji-picker" */      │
  │   './EmojiPicker'                                  │
  │ );                                                 │
  │                                                    │
  │ → Không có magic comment: 0.bundle.js, 1.bundle.js│
  │ → Có magic comment: emoji-picker.bundle.js         │
  │ → → DỄ DEBUG + DỄ PHÂN TÍCH BUNDLE!               │
  └────────────────────────────────────────────────────┘
```

---

## §6. Các chiến lược Dynamic Import

```
3 CHIẾN LƯỢC DYNAMIC IMPORT:
═══════════════════════════════════════════════════════════════

  ① IMPORT ON INTERACTION:
  ┌────────────────────────────────────────────────────┐
  │ → Tải module khi user TƯƠNG TÁC (click, hover)!   │
  │ → VD: EmojiPicker tải khi click emoji icon!       │
  │ → VD: Modal tải khi click "Open Dialog"!          │
  │ → VD: Dropdown tải khi click caret!               │
  │                                                    │
  │ User click → import() → render component!          │
  └────────────────────────────────────────────────────┘

  ② IMPORT ON VISIBILITY:
  ┌────────────────────────────────────────────────────┐
  │ → Tải module khi component VÀO VIEWPORT!           │
  │ → Dùng IntersectionObserver!                       │
  │ → VD: Component cuối trang → tải khi scroll tới!  │
  │ → VD: Infinite scroll → tải batch tiếp theo!      │
  │                                                    │
  │ Scroll → IntersectionObserver → import() → render! │
  └────────────────────────────────────────────────────┘

  ③ IMPORT ON ROUTE:
  ┌────────────────────────────────────────────────────┐
  │ → Tải module khi CHUYỂN ROUTE!                     │
  │ → Mỗi page = 1 lazy chunk!                        │
  │ → VD: /dashboard → dashboard.chunk.js              │
  │ → VD: /settings → settings.chunk.js               │
  │                                                    │
  │ Navigate → React Router → import() → render page! │
  └────────────────────────────────────────────────────┘
```

```jsx
// ═══ IMPORT ON ROUTE — REACT ROUTER ═══

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Mỗi page = 1 lazy chunk
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
// → User chỉ tải JS cho page HIỆN TẠI!
// → Chuyển route → tải chunk page MỚI!
```

---

## §7. Prefetching & Preloading Chunks

```
PREFETCH vs PRELOAD — TỐI ƯU THÊM:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Dynamic import = user PHẢI CHỜ khi click!
  → Có cách nào tải TRƯỚC mà vẫn tách chunk?

  ① PREFETCH (ưu tiên THẤP — khi browser NHÀN RỖI):
  ┌────────────────────────────────────────────────────┐
  │ import(/* webpackPrefetch: true */ './EmojiPicker')│
  │                                                    │
  │ → Webpack thêm: <link rel="prefetch" href="...">  │
  │ → Browser tải khi NHÀN RỖI (idle time)!           │
  │ → → Khi user click → module ĐÃ CÓ SẴN! 🚀       │
  └────────────────────────────────────────────────────┘

  ② PRELOAD (ưu tiên CAO — tải SONG SONG):
  ┌────────────────────────────────────────────────────┐
  │ import(/* webpackPreload: true */ './HeavyLib')    │
  │                                                    │
  │ → Webpack thêm: <link rel="preload" href="...">   │
  │ → Tải SONG SONG với parent chunk!                 │
  │ → Dùng cho module CHẮC CHẮN cần ngay!             │
  └────────────────────────────────────────────────────┘

  TIMELINE SO SÁNH:
  ─────────────────────────────────────────────────────
  Thời gian →

  Không prefetch:
  Page load ─────── User click ──▓▓▓▓▓── Picker hiện
                                 │ wait │

  Có prefetch:
  Page load ──░░░── User click ── Picker hiện NGAY! 🚀
              │idle│
              prefetch
```

---

## §8. Next.js — next/dynamic

```jsx
// ═══ NEXT.JS — next/dynamic ═══

import dynamic from "next/dynamic";

// ① Dynamic import với loading fallback
const EmojiPicker = dynamic(() => import("../components/EmojiPicker"), {
  loading: () => <p>Loading...</p>,
  // ② Tắt SSR cho component này (nếu cần)
  ssr: false,
});

// ③ Sử dụng bình thường
export default function ChatPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>😀</button>
      {open && <EmojiPicker />}
    </div>
  );
}
```

```
NEXT/DYNAMIC vs REACT.LAZY:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬───────────────┬─────────────────────┐
  │              │ React.lazy    │ next/dynamic         │
  ├──────────────┼───────────────┼─────────────────────┤
  │ SSR          │ ❌             │ ✅ (mặc định)        │
  │ Tắt SSR     │ N/A           │ ssr: false ✅        │
  │ Loading UI   │ Suspense      │ loading: () => ...  │
  │ Named export │ ❌ default only│ ✅ resolveComponent  │
  │ Framework    │ React core    │ Next.js only        │
  └──────────────┴───────────────┴─────────────────────┘
```

---

## §9. Sai lầm thường gặp

```
SAI LẦM THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  ❌ SAI 1: Dynamic import MỌI component
  ┌────────────────────────────────────────────────────┐
  │ → Quá nhiều chunks nhỏ → HTTP overhead!            │
  │ → Component nhỏ (< 5KB) → KHÔNG CẦN dynamic!      │
  │ → WATERFALL: parent tải → child tải → grandchild!  │
  │                                                    │
  │ ✅ FIX: Chỉ dynamic import component LỚN hoặc      │
  │   KHÔNG CẦN NGAY (modal, picker, chart, editor)!  │
  └────────────────────────────────────────────────────┘

  ❌ SAI 2: Quên Suspense boundary
  ┌────────────────────────────────────────────────────┐
  │ const Picker = lazy(() => import('./EmojiPicker'));│
  │ // ❌ Không có Suspense → React CRASH!             │
  │ return <Picker />;                                 │
  │                                                    │
  │ ✅ FIX: LUÔN bọc trong Suspense!                   │
  │ return (                                           │
  │   <Suspense fallback={<Loading/>}>                 │
  │     <Picker />                                     │
  │   </Suspense>                                      │
  │ );                                                 │
  └────────────────────────────────────────────────────┘

  ❌ SAI 3: Lazy load component TRÊN FOLD
  ┌────────────────────────────────────────────────────┐
  │ → Component hiển thị NGAY → KHÔNG lazy load!       │
  │ → Lazy load ATF component → FCP/LCP bị chậm!     │
  │                                                    │
  │ ✅ FIX: Chỉ lazy load component BTF hoặc hidden!   │
  └────────────────────────────────────────────────────┘

  ❌ SAI 4: Không đặt webpackChunkName
  ┌────────────────────────────────────────────────────┐
  │ → Chunk names: 0.js, 1.js, 2.js → khó debug!     │
  │                                                    │
  │ ✅ FIX: Magic comment cho chunk name rõ ràng!      │
  │ import(/* webpackChunkName: "emoji" */ './Emoji')  │
  └────────────────────────────────────────────────────┘
```

---

## §10. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Dynamic import là gì?"
  A: import() trả về Promise, Webpack tạo chunk RIÊNG.
  Chỉ tải khi code THỰC SỰ CHẠY → giảm initial bundle!

  Q: "React.lazy vs @loadable/component?"
  A: React.lazy = built-in, CSR only, cần Suspense.
  @loadable = library, SSR compatible, fallback trong options.
  Next.js → dùng next/dynamic (wrapper trên cả hai)!

  Q: "Khi nào KHÔNG nên dynamic import?"
  A: → Component NHỎ (< 5KB)!
  → Component hiển thị NGAY (ATF, header, nav)!
  → Quá nhiều chunks → HTTP overhead + waterfall!

  Q: "Prefetch vs preload chunk?"
  A: Prefetch = tải khi browser nhàn rỗi (idle), ưu tiên thấp.
  Preload = tải song song, ưu tiên cao, dùng cho module
  CHẮC CHẮN cần trên route hiện tại!

  Q: "Dynamic import giúp metric nào?"
  A: → FCP + LCP: initial bundle nhỏ → parse nhanh!
  → TTI: ít JS cần execute → interactive sớm!
  → FID: main thread ít bận → response nhanh!
```

```
SƠ ĐỒ TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │              DYNAMIC IMPORT STRATEGY                 │
  │                                                     │
  │  ┌───────────┐  ┌────────────┐  ┌───────────────┐  │
  │  │ On Route  │  │On Interact │  │ On Visibility │  │
  │  │ (pages)   │  │ (click/    │  │ (scroll/IO)   │  │
  │  │           │  │  hover)    │  │               │  │
  │  └─────┬─────┘  └─────┬──────┘  └──────┬────────┘  │
  │        │              │                │            │
  │        ▼              ▼                ▼            │
  │  ┌─────────────────────────────────────────────┐    │
  │  │         import() → Promise<Module>          │    │
  │  └──────────────────┬──────────────────────────┘    │
  │                     │                               │
  │        ┌────────────┼────────────┐                  │
  │        ▼            ▼            ▼                  │
  │  React.lazy    @loadable     next/dynamic           │
  │  + Suspense    /component    (Next.js)              │
  │  (CSR only)    (SSR + CSR)   (SSR + CSR)            │
  │                                                     │
  │  TỐI ƯU THÊM:                                      │
  │  ┌──────────────┐  ┌───────────────┐                │
  │  │ webpackPre-  │  │ webpackPre-   │                │
  │  │ fetch (idle) │  │ load (eager)  │                │
  │  └──────────────┘  └───────────────┘                │
  └─────────────────────────────────────────────────────┘
```

---

### Checklist

- [ ] **Hiểu vấn đề**: Static import → bundle QUÁ LỚN → FCP/TTI chậm!
- [ ] **import()**: Trả về Promise, Webpack tạo chunk riêng, tải khi code chạy!
- [ ] **React.lazy + Suspense**: CSR, cần Suspense wrapper, fallback prop!
- [ ] **@loadable/component**: SSR compatible, fallback trong options!
- [ ] **next/dynamic**: Next.js wrapper, ssr: false option, loading prop!
- [ ] **webpackChunkName**: Magic comment đặt tên chunk → dễ debug!
- [ ] **3 chiến lược**: On Route / On Interaction / On Visibility!
- [ ] **Prefetch**: Browser idle → tải trước → click = hiện NGAY!
- [ ] **Không lazy ATF**: Component hiển thị ngay → static import!
- [ ] **Không over-split**: Component < 5KB → không cần dynamic!

---

_Nguồn: patterns.dev — Addy Osmani & Lydia Hallie — "Dynamic Import Pattern"_
_Cập nhật lần cuối: Tháng 2, 2026_
