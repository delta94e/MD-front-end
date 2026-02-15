# Import On Visibility — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 20 phút đọc
>
> Import On Visibility, IntersectionObserver API,
> Tự viết react-loadable-visibility từ đầu,
> Lazy Loading Components, Code Splitting theo Viewport,
> Performance Optimization cho Large Pages
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance Pattern
>
> _Dựa trên patterns.dev — Addy Osmani & Lydia Hallie_

---

## Mục Lục

| #   | Phần                                 |
| --- | ------------------------------------ |
| 1   | Vấn đề — Component ngoài viewport    |
| 2   | IntersectionObserver API — Nền tảng  |
| 3   | Tự viết useIntersectionObserver hook |
| 4   | Tự viết LoadableVisibility component |
| 5   | Tích hợp dynamic import + visibility |
| 6   | Luồng hoạt động chi tiết             |
| 7   | So sánh các chiến lược Import        |
| 8   | Ứng dụng thực tế                     |
| 9   | Sai lầm thường gặp                   |
| 10  | Tóm tắt phỏng vấn                    |

---

## §1. Vấn đề — Component ngoài viewport

```
VẤN ĐỀ: TẢI COMPONENT CHƯA CẦN HIỂN THỊ!
═══════════════════════════════════════════════════════════════

  Trang web dài — nhiều component NGOÀI viewport:
  ┌──────────────────────────────────────────────────┐
  │              VIEWPORT (user thấy)                │
  │  ┌────────────┐  ┌────────────┐                  │
  │  │  Header    │  │  HeroBanner│                  │
  │  │  ✅ CẦN    │  │  ✅ CẦN     │                  │
  │  └────────────┘  └────────────┘                  │
  │  ┌──────────────────────────────┐                │
  │  │  ChatList (messages)         │                │
  │  │  ✅ CẦN NGAY                 │                │
  │  └──────────────────────────────┘                │
  ├──────────────── ĐƯỜNG GẤP ───────────────────────┤
  │              (user CHƯA THẤY!)                   │
  │  ┌──────────────────────────────┐                │
  │  │  EmojiPicker                 │                │
  │  │  ❌ CHƯA CẦN! User chưa scroll tới!          │
  │  └──────────────────────────────┘                │
  │  ┌──────────────────────────────┐                │
  │  │  HeavyChart (D3.js 200KB)   │                │
  │  │  ❌ CHƯA CẦN!                │                │
  │  └──────────────────────────────┘                │
  │  ┌──────────────────────────────┐                │
  │  │  Comments (reaction plugin) │                │
  │  │  ❌ CHƯA CẦN!                │                │
  │  └──────────────────────────────┘                │
  └──────────────────────────────────────────────────┘

  ❌ STATIC IMPORT → TẢI TẤT CẢ NGAY:
  → EmojiPicker + HeavyChart + Comments = 300KB thừa!
  → Initial bundle PHÌNH TO!
  → FCP / TTI / FID đều BỊ CHẬM!

  ✅ IMPORT ON VISIBILITY → TẢI KHI THẤY:
  → Chỉ tải component khi nó XUẤT HIỆN trong viewport!
  → IntersectionObserver theo dõi visibility!
  → Component vào viewport → import() → render!
  → Initial bundle NHỎ HƠN NHIỀU!
```

```
SO SÁNH 3 CHIẾN LƯỢC IMPORT:
═══════════════════════════════════════════════════════════════

  ① Import On Load (static):
     Page load → TẢI TẤT CẢ ngay! → ❌ Lãng phí!

  ② Import On Interaction:
     User click/hover → TẢI! → ✅ Tốt cho modal, picker!

  ③ Import On Visibility: ← BÀI NÀY!
     Component VÀO viewport → TẢI! → ✅ Tốt cho BTF content!

  TIMELINE:
  ─────────────────────────────────────────────────────

  ① Static:
  Page load ═══▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓═══ TẢI HẾT!
               │ TẤT CẢ component    │
               │ (kể cả chưa cần!)   │

  ② On Interaction:
  Page load ═══▓▓▓▓▓═══ click ═══▓▓▓═══ hiện!
               │ core │           │lazy│

  ③ On Visibility:
  Page load ═══▓▓▓▓▓═══ scroll ═══▓▓▓═══ hiện!
               │ core │           │lazy│
               │      │    IO detect!  │
```

---

## §2. IntersectionObserver API — Nền tảng

```
INTERSECTIONOBSERVER — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  IntersectionObserver = API theo dõi khi 1 element
  GIAO NHAU (intersect) với viewport hoặc parent!

  ┌─────────────────── VIEWPORT ──────────────────────┐
  │                                                    │
  │  ┌──────────────────────────────┐                  │
  │  │  Element A (đang hiển thị)  │                  │
  │  │  → isIntersecting = TRUE!   │                  │
  │  └──────────────────────────────┘                  │
  │                                                    │
  ├──────────────────── BIÊN ──────────────────────────┤
  │         ↑ rootMargin: "200px"                      │
  │         │ (mở rộng vùng detect!)                   │
  ├──────────────────────────────────────────────────── │
                                                    │
     ┌──────────────────────────────┐               │
     │  Element B (ngoài viewport) │               │
     │  → isIntersecting = FALSE!  │               │
     └──────────────────────────────┘

  CÁC THAM SỐ QUAN TRỌNG:
  ┌────────────────────────────────────────────────────┐
  │ root:       null = viewport (mặc định)             │
  │             hoặc 1 parent element cụ thể           │
  │                                                    │
  │ rootMargin: "0px" = chính xác biên viewport        │
  │             "200px" = mở rộng thêm 200px           │
  │             → Detect SỚM hơn khi scroll gần!      │
  │                                                    │
  │ threshold:  0 = gọi ngay khi 1px xuất hiện        │
  │             0.5 = gọi khi 50% element hiện         │
  │             1 = gọi khi 100% element hiện          │
  │             [0, 0.5, 1] = gọi ở nhiều mức!        │
  └────────────────────────────────────────────────────┘
```

```javascript
// ═══ INTERSECTIONOBSERVER — CƠ BẢN ═══

// ① Tạo observer
const observer = new IntersectionObserver(
  // Callback — gọi khi element giao với viewport
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Element VÀO viewport!
        console.log("Element hiển thị!", entry.target);

        // Làm gì đó (tải module, tải ảnh, v.v.)

        // Ngưng theo dõi (chỉ cần detect 1 lần!)
        observer.unobserve(entry.target);
      }
    });
  },
  // Options
  {
    root: null, // viewport
    rootMargin: "0px", // không mở rộng
    threshold: 0, // 1px xuất hiện = trigger
  },
);

// ② Bắt đầu theo dõi element
const element = document.querySelector("#my-component");
observer.observe(element);

// ③ Dọn dẹp khi không cần
observer.disconnect();
```

```
LUỒNG INTERSECTIONOBSERVER:
═══════════════════════════════════════════════════════════════

  ① observer.observe(element)
     │
     ▼
  Browser đăng ký element vào observation list
     │
     ▼
  ② User scroll trang
     │
     ▼
  Browser kiểm tra: element CÓ giao với viewport?
     │
     ├── KHÔNG → tiếp tục chờ...
     │
     └── CÓ (isIntersecting = true)!
          │
          ▼
     ③ Gọi callback(entries)
          │
          ▼
     ④ entry.isIntersecting === true
          │
          ▼
     ⑤ Thực hiện hành động (import module!)
          │
          ▼
     ⑥ observer.unobserve(element)
        (ngưng theo dõi — chỉ cần 1 lần!)

  ĐẶC ĐIỂM QUAN TRỌNG:
  → IntersectionObserver chạy NGOÀI main thread!
  → KHÔNG gây jank / layout thrashing!
  → Hiệu quả hơn RẤT NHIỀU so với scroll event listener!
```

---

## §3. Tự viết useIntersectionObserver hook

```
BƯỚC 1: CUSTOM HOOK — useIntersectionObserver
═══════════════════════════════════════════════════════════════

  MỤC ĐÍCH:
  → Theo dõi 1 element có TRONG viewport hay không!
  → Trả về { ref, isVisible }
  → Khi isVisible = true lần đầu → GIỮ NGUYÊN true!
  → (Vì ta chỉ cần TẢI 1 LẦN, không cần ẩn lại!)
```

```jsx
// ═══ useIntersectionObserver.js ═══

import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Custom hook theo dõi element có trong viewport không.
 *
 * @param {Object} options
 * @param {string} options.rootMargin - Mở rộng vùng detect
 *   VD: "200px" → detect SỚM 200px trước khi vào viewport!
 * @param {number|number[]} options.threshold - Tỉ lệ hiển thị
 *   VD: 0 → trigger ngay khi 1px hiện!
 * @param {boolean} options.triggerOnce - Chỉ detect 1 lần?
 *   VD: true → sau khi visible → NGƯNG observe!
 *
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
function useIntersectionObserver(options = {}) {
  const {
    rootMargin = "0px",
    threshold = 0,
    triggerOnce = true, // Mặc định: chỉ cần detect 1 lần!
  } = options;

  // ① Ref gắn vào DOM element cần theo dõi
  const ref = useRef(null);

  // ② State: element có đang visible không?
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    // Guard: không có element → không làm gì
    if (!element) return;

    // Guard: đã visible + triggerOnce → không cần observe nữa
    if (isVisible && triggerOnce) return;

    // ③ Tạo IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        // entry.isIntersecting = true khi element VÀO viewport
        if (entry.isIntersecting) {
          setIsVisible(true);

          // ④ Nếu triggerOnce → unobserve ngay!
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          // Nếu KHÔNG triggerOnce → cập nhật false khi rời viewport
          setIsVisible(false);
        }
      },
      {
        root: null, // viewport
        rootMargin, // mở rộng vùng detect
        threshold, // tỉ lệ hiển thị trigger
      },
    );

    // ⑤ Bắt đầu observe
    observer.observe(element);

    // ⑥ Cleanup: disconnect khi unmount!
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, isVisible]);

  return { ref, isVisible };
}

export default useIntersectionObserver;
```

```
GIẢI THÍCH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ① ref = useRef(null)
  → Tạo ref để GẮN vào DOM element!
  → VD: <div ref={ref}>...</div>
  → observer.observe(ref.current) → theo dõi div này!

  ② isVisible = useState(false)
  → Ban đầu = false (chưa thấy!)
  → Khi element vào viewport → setIsVisible(true)!
  → triggerOnce = true → GIỮ NGUYÊN true mãi mãi!
  → (Vì component đã TẢI rồi, không cần ẩn!)

  ③ new IntersectionObserver(callback, options)
  → callback nhận MẢNG entries (thường chỉ 1)
  → Destructure: ([entry]) → lấy entry đầu tiên!
  → entry.isIntersecting = boolean!

  ④ triggerOnce → unobserve
  → Import On Visibility: chỉ cần DETECT 1 LẦN!
  → Sau khi thấy → import module → NGƯNG observe!
  → Tiết kiệm tài nguyên!

  ⑤ observer.observe(element)
  → Bắt đầu theo dõi!
  → Browser sẽ GỌI callback khi element giao viewport!

  ⑥ Cleanup: observer.disconnect()
  → Component unmount → NGƯNG observer!
  → Tránh memory leak!
  → useEffect cleanup return!
```

---

## §4. Tự viết LoadableVisibility component

```
BƯỚC 2: LoadableVisibility — COMPONENT CHÍNH
═══════════════════════════════════════════════════════════════

  ĐÂY LÀ TRÁI TIM CỦA PATTERN!
  → Kết hợp:
     ✅ IntersectionObserver (detect visibility!)
     ✅ Dynamic import (tải module khi cần!)
     ✅ Suspense/fallback (hiện loading UI!)
     ✅ Error handling (xử lý lỗi tải!)

  LUỒNG:
  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐
  │ Render      │ →  │ Placeholder  │ →  │ Observe        │
  │ component   │    │ (sentinel)   │    │ placeholder    │
  └─────────────┘    └──────────────┘    └───────┬────────┘
                                                  │
                                    User scroll tới...
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │ isVisible=true │
                                         └───────┬────────┘
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │ import()       │
                                         │ tải module!    │
                                         └───────┬────────┘
                                                  │
                                         ┌────────┴────────┐
                                         │                  │
                                         ▼                  ▼
                                   ┌──────────┐     ┌───────────┐
                                   │ Thành    │     │ Thất bại  │
                                   │ công!    │     │ → Error   │
                                   │ Render   │     │   UI!     │
                                   │ component│     └───────────┘
                                   └──────────┘
```

```jsx
// ═══ LoadableVisibility.js — TỰ VIẾT TỪ ĐẦU ═══

import React, {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
} from "react";

/**
 * Tự viết LoadableVisibility — thay thế react-loadable-visibility!
 *
 * @param {Object} config
 * @param {() => Promise} config.loader - Hàm dynamic import
 *   VD: () => import('./EmojiPicker')
 * @param {React.ReactNode} config.loading - Fallback UI khi đang tải
 *   VD: <p>Loading...</p>
 * @param {string} config.rootMargin - Mở rộng vùng detect
 *   VD: "200px" → bắt đầu tải TRƯỚC 200px!
 * @param {number} config.threshold - Tỉ lệ hiển thị trigger
 * @param {React.ReactNode} config.error - UI khi tải lỗi
 *
 * @returns {React.ComponentType} - Component wrapper
 */
function createLoadableVisibility(config) {
  const {
    loader,
    loading: LoadingComponent = null,
    rootMargin = "0px",
    threshold = 0,
    error: ErrorComponent = null,
  } = config;

  // ① Tạo lazy component từ loader
  // lazy() chỉ gọi loader() KHI component được RENDER!
  const LazyComponent = lazy(loader);

  // ② Wrapper component
  function LoadableVisibilityWrapper(props) {
    // Ref cho sentinel element (phần tử "canh gác")
    const sentinelRef = useRef(null);

    // State: đã vào viewport chưa?
    const [isVisible, setIsVisible] = useState(false);

    // State: có lỗi tải không?
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel || isVisible) return;

      // ③ Tạo IntersectionObserver
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // ④ Element vào viewport → isVisible = true!
            setIsVisible(true);
            // Ngưng observe — chỉ cần 1 lần!
            observer.unobserve(sentinel);
          }
        },
        { root: null, rootMargin, threshold },
      );

      observer.observe(sentinel);

      return () => observer.disconnect();
    }, [isVisible]);

    // ⑤ CHƯA visible → render sentinel (placeholder)
    if (!isVisible) {
      return (
        <div
          ref={sentinelRef}
          style={{ minHeight: "1px" }} // Phải có kích thước để IO detect!
          aria-hidden="true"
        >
          {LoadingComponent}
        </div>
      );
    }

    // ⑥ Có lỗi → render error UI
    if (loadError) {
      return ErrorComponent || <p>Failed to load component.</p>;
    }

    // ⑦ ĐÃ visible → render lazy component trong Suspense!
    return (
      <Suspense fallback={LoadingComponent}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  // Đặt displayName cho DevTools
  LoadableVisibilityWrapper.displayName = "LoadableVisibility";

  return LoadableVisibilityWrapper;
}

export default createLoadableVisibility;
```

```
GIẢI THÍCH CỰC KỲ CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ① LazyComponent = lazy(loader)
  ┌────────────────────────────────────────────────────┐
  │ → lazy() KHÔNG gọi loader ngay!                    │
  │ → Chỉ gọi loader() khi LazyComponent ĐƯỢC RENDER! │
  │ → loader = () => import('./EmojiPicker')           │
  │ → import() trả về Promise<Module>                  │
  │ → lazy() bọc Promise này thành React component!    │
  │                                                    │
  │ QUAN TRỌNG: lazy() chỉ gọi loader() 1 LẦN DUY NHẤT│
  │ → Lần sau render lại → dùng MODULE ĐÃ TẢI!        │
  └────────────────────────────────────────────────────┘

  ② sentinelRef — "Phần tử canh gác"
  ┌────────────────────────────────────────────────────┐
  │ → sentinel = 1 <div> nhỏ, gần như KHÔNG THẤY!     │
  │ → minHeight: "1px" → PHẢI có kích thước!           │
  │ → Nếu height = 0 → IO KHÔNG DETECT ĐƯỢC!          │
  │ → aria-hidden="true" → screen reader bỏ qua!      │
  │                                                    │
  │ → IO observe sentinel này!                         │
  │ → Khi sentinel VÀO viewport → biết component cần! │
  │ → → Thay sentinel bằng COMPONENT THẬT!             │
  └────────────────────────────────────────────────────┘

  ③ IntersectionObserver trong useEffect
  ┌────────────────────────────────────────────────────┐
  │ → Chỉ tạo observer KHI có sentinel ref!           │
  │ → Chỉ tạo observer KHI chưa visible!               │
  │ → Nếu đã visible → skip (guard clause!)            │
  │ → Cleanup: disconnect() khi unmount!               │
  └────────────────────────────────────────────────────┘

  ④ isIntersecting → setIsVisible(true)
  ┌────────────────────────────────────────────────────┐
  │ → entry.isIntersecting = true khi sentinel vào VP! │
  │ → setIsVisible(true) → trigger RE-RENDER!          │
  │ → Re-render lần này → vào nhánh ⑦!                │
  │ → unobserve → NGƯNG theo dõi sentinel!             │
  └────────────────────────────────────────────────────┘

  ⑤ Chưa visible → render sentinel
  ┌────────────────────────────────────────────────────┐
  │ Render ban đầu:                                    │
  │ ┌─────────────────────────────────┐                │
  │ │ <div ref={sentinelRef}>         │ ← IO observe! │
  │ │   <p>Loading...</p>             │ ← Fallback!   │
  │ │ </div>                          │                │
  │ └─────────────────────────────────┘                │
  │ → User thấy "Loading..." (hoặc skeleton!)         │
  │ → IO đang CHỜØ sentinel vào viewport...            │
  └────────────────────────────────────────────────────┘

  ⑦ Đã visible → Suspense + LazyComponent
  ┌────────────────────────────────────────────────────┐
  │ Sau khi isVisible = true:                          │
  │ ┌─────────────────────────────────┐                │
  │ │ <Suspense fallback={Loading}>   │                │
  │ │   <LazyComponent {...props} />  │ ← TẢI MODULE! │
  │ │ </Suspense>                     │                │
  │ └─────────────────────────────────┘                │
  │                                                    │
  │ → Suspense phát hiện LazyComponent đang tải        │
  │ → Hiện fallback (Loading...) trong khi chờ!        │
  │ → Module tải xong → React THAY bằng component thật│
  └────────────────────────────────────────────────────┘
```

---

## §5. Tích hợp — Sử dụng LoadableVisibility

```jsx
// ═══ SỬ DỤNG LoadableVisibility ═══

import React from "react";
import Send from "./icons/Send";
import Emoji from "./icons/Emoji";
import createLoadableVisibility from "./LoadableVisibility";

// ① Tạo lazy-on-visibility component
const EmojiPicker = createLoadableVisibility({
  loader: () => import("./EmojiPicker"),
  loading: <p id="loading">Loading...</p>,
  rootMargin: "200px", // Bắt đầu tải SỚM 200px!
});

const ChatInput = () => {
  const [pickerOpen, togglePicker] = React.useReducer((state) => !state, false);

  return (
    <div className="chat-input-container">
      <input type="text" placeholder="Type a message..." />
      <Emoji onClick={togglePicker} />
      {/* ② Chỉ render khi pickerOpen = true */}
      {/* → Sentinel xuất hiện → IO detect → import()! */}
      {pickerOpen && <EmojiPicker />}
      <Send />
    </div>
  );
};

export default ChatInput;
```

```
SỬ DỤNG CHO PAGE DÀI (BTF Components):
═══════════════════════════════════════════════════════════════

  // Nhiều components nặng DƯỚI FOLD:
  const HeavyChart = createLoadableVisibility({
    loader: () => import("./HeavyChart"),  // 200KB!
    loading: <ChartSkeleton />,
    rootMargin: "300px",  // Tải trước 300px!
  });

  const Comments = createLoadableVisibility({
    loader: () => import("./Comments"),  // 150KB!
    loading: <CommentsSkeleton />,
  });

  const RelatedPosts = createLoadableVisibility({
    loader: () => import("./RelatedPosts"),
    loading: <PostsSkeleton />,
  });

  // Sử dụng BÌNH THƯỜNG — không cần conditional rendering:
  function BlogPage() {
    return (
      <div>
        <Header />           {/* Static import — ATF! */}
        <HeroImage />        {/* Static import — ATF! */}
        <ArticleContent />   {/* Static import — ATF! */}

        {/* BTF — auto lazy load khi scroll tới! */}
        <HeavyChart />       {/* Tải khi user scroll gần */}
        <Comments />         {/* Tải khi user scroll gần */}
        <RelatedPosts />     {/* Tải khi user scroll gần */}
        <Footer />           {/* Tải khi user scroll gần */}
      </div>
    );
  }

  → Khác với EmojiPicker (cần toggle)!
  → BTF components LUÔN render!
  → Sentinel LUÔN CÓ trong DOM!
  → IO detect khi user SCROLL TỚI!
  → → Tải module ĐÚNG LÚC CẦN!
```

---

## §6. Luồng hoạt động chi tiết

```
LUỒNG KHI USER SCROLL TỚI COMPONENT:
═══════════════════════════════════════════════════════════════

  Thời gian →

  ① Page load — render xong ATF:
  ┌──────────────────────────────────────────────┐
  │ VIEWPORT                                      │
  │  Header ✅  HeroBanner ✅  ChatList ✅        │
  ├──────────────────────────────────────────────┤
  │ NGOÀI VIEWPORT (chưa render LazyComponent!)  │
  │  ┌──────────────────────────────────────┐     │
  │  │ <div ref={sentinel} minHeight=1px>   │     │
  │  │   <p>Loading...</p>                  │     │
  │  │ </div>                               │     │
  │  │ → IO đang OBSERVE sentinel này!      │     │
  │  └──────────────────────────────────────┘     │
  └──────────────────────────────────────────────┘

  ② User scroll xuống — sentinel GẦN viewport:
  ┌──────────────────────────────────────────────┐
  │ VIEWPORT                                      │
  │  ChatList ✅                                  │
  │                                               │
  │  ┌──────────────────────────────────────┐     │
  │  │ rootMargin: "200px"                  │     │
  │  │ → Sentinel CÒN 200px → ĐÃ DETECT!  │     │
  │  │ → isIntersecting = TRUE!             │← IO!│
  │  └──────────────────────────────────────┘     │
  └──────────────────────────────────────────────┘

  ③ IO callback → setIsVisible(true) → RE-RENDER:
  ┌──────────────────────────────────────────────┐
  │ Re-render:                                    │
  │ → isVisible = true → vào nhánh Suspense!     │
  │ → <Suspense fallback={Loading}>              │
  │ →   <LazyComponent />                        │
  │ → </Suspense>                                │
  │                                               │
  │ → lazy() GỌI loader() → import('./EmojiPicker')│
  │ → → Network: GET emoji-picker.chunk.js       │
  │ → → Suspense hiện "Loading..." trong khi chờ! │
  └──────────────────────────────────────────────┘

  ④ Module tải xong → render component thật:
  ┌──────────────────────────────────────────────┐
  │ VIEWPORT                                      │
  │                                               │
  │  ┌──────────────────────────────────────┐     │
  │  │ <EmojiPicker />  ← COMPONENT THẬT! 🎉│     │
  │  │ Đầy đủ chức năng, tương tác được!    │     │
  │  └──────────────────────────────────────┘     │
  └──────────────────────────────────────────────┘

  ⑤ Observer đã UNOBSERVE — không có overhead nữa!
```

```
SƠ ĐỒ STATE MACHINE:
═══════════════════════════════════════════════════════════════

  ┌──────────┐  IO detect!  ┌──────────┐  Module   ┌──────────┐
  │ SENTINEL │ ───────────→ │ LOADING  │ ────────→ │ LOADED   │
  │ (chờ)    │              │ (tải)    │  tải      │ (hiện!)  │
  │          │              │          │  xong!    │          │
  │ isVisible│              │ isVisible│           │ isVisible│
  │ = false  │              │ = true   │           │ = true   │
  │          │              │ Suspense │           │ Lazy     │
  │ Render:  │              │ fallback │           │ Component│
  │ sentinel │              │ hiện     │           │ render!  │
  │ + loading│              │          │           │          │
  └──────────┘              └──────────┘           └──────────┘
       │                                                │
       │              Module lỗi!                       │
       │              ┌──────────┐                      │
       │              │  ERROR   │                      │
       └─────────────→│ (lỗi)   │                      │
         IO detect    │ Render   │                      │
         + lỗi tải    │ error UI │                      │
                      └──────────┘
```

---

## §7. Phiên bản nâng cao — Error Boundary + Retry

```jsx
// ═══ PHIÊN BẢN NÂNG CAO — CÓ ERROR HANDLING + RETRY ═══

import React, { useState, useEffect, useRef, lazy, Suspense } from "react";

function createLoadableVisibility(config) {
  const {
    loader,
    loading: LoadingComponent = null,
    rootMargin = "0px",
    threshold = 0,
    delay = 0, // Delay trước khi hiện loading (tránh flash!)
    timeout = 10000, // Timeout — tối đa 10s!
    retry: maxRetries = 2, // Retry tối đa 2 lần!
  } = config;

  // ① Retry wrapper — tự động retry khi import() fail!
  function retryLoader(attemptsLeft = maxRetries) {
    return new Promise((resolve, reject) => {
      loader()
        .then(resolve)
        .catch((error) => {
          if (attemptsLeft <= 0) {
            reject(error); // Hết retry → reject!
            return;
          }
          // Chờ 1s rồi retry
          setTimeout(() => {
            retryLoader(attemptsLeft - 1)
              .then(resolve)
              .catch(reject);
          }, 1000);
        });
    });
  }

  const LazyComponent = lazy(retryLoader);

  function Wrapper(props) {
    const sentinelRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const el = sentinelRef.current;
      if (!el || isVisible) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // ② Delay support: chờ trước khi trigger
            if (delay > 0) {
              setTimeout(() => setIsVisible(true), delay);
            } else {
              setIsVisible(true);
            }
            observer.unobserve(el);
          }
        },
        { root: null, rootMargin, threshold },
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [isVisible]);

    if (!isVisible) {
      return (
        <div ref={sentinelRef} style={{ minHeight: "1px" }} aria-hidden="true">
          {LoadingComponent}
        </div>
      );
    }

    // ③ Error Boundary bọc Suspense!
    return (
      <ErrorBoundary fallback={<p>Failed to load. Please reload.</p>}>
        <Suspense fallback={LoadingComponent}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  Wrapper.displayName = "LoadableVisibility";
  return Wrapper;
}

// ═══ ERROR BOUNDARY — BẮT LỖI LAZY IMPORT ═══
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("LoadableVisibility error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default createLoadableVisibility;
```

---

## §8. So sánh các thư viện

```
SO SÁNH THƯ VIỆN IMPORT ON VISIBILITY:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────┬────────────┬────────────┐
  │                  │ react-     │ react-     │ Tự viết    │
  │                  │ loadable-  │ lazyload   │ (bài này!) │
  │                  │ visibility │            │            │
  ├──────────────────┼────────────┼────────────┼────────────┤
  │ IO support       │ ✅          │ ✅          │ ✅          │
  │ SSR              │ ✅          │ ✅          │ ❌ (cần thêm│
  │                  │            │            │  logic)    │
  │ Fallback         │ ✅          │ ✅          │ ✅          │
  │ Retry            │ ❌          │ ❌          │ ✅          │
  │ Error Boundary   │ ❌          │ ❌          │ ✅          │
  │ rootMargin       │ ❌          │ ✅          │ ✅          │
  │ Bundle size      │ ~3KB       │ ~4KB       │ ~1KB       │
  │ Dependencies     │ 1+         │ 0          │ 0          │
  │ Hiểu sâu logic  │ ❌ black box│ ❌ black box│ ✅ 100%!   │
  └──────────────────┴────────────┴────────────┴────────────┘
```

---

## §9. Sai lầm thường gặp

```
SAI LẦM & CÁCH KHẮC PHỤC:
═══════════════════════════════════════════════════════════════

  ❌ SAI 1: Sentinel có height = 0
  ┌────────────────────────────────────────────────────┐
  │ → IO KHÔNG DETECT được element có height = 0!      │
  │ → Component KHÔNG BAO GIỜ TẢI!                    │
  │                                                    │
  │ ✅ FIX: minHeight: "1px" cho sentinel!              │
  └────────────────────────────────────────────────────┘

  ❌ SAI 2: Không cleanup observer
  ┌────────────────────────────────────────────────────┐
  │ → Component unmount → observer VẪN CHẠY!           │
  │ → Memory leak!                                     │
  │                                                    │
  │ ✅ FIX: return () => observer.disconnect() !        │
  └────────────────────────────────────────────────────┘

  ❌ SAI 3: rootMargin quá nhỏ → user thấy "flash"
  ┌────────────────────────────────────────────────────┐
  │ → rootMargin = "0px" → detect ĐÚNG lúc vào VP!   │
  │ → Module chưa tải xong → flash loading!            │
  │                                                    │
  │ ✅ FIX: rootMargin = "200px" hoặc "300px"          │
  │ → Bắt đầu tải TRƯỚC 200-300px!                    │
  │ → Khi scroll tới → module ĐÃ SẴN SÀNG! 🚀        │
  └────────────────────────────────────────────────────┘

  ❌ SAI 4: Import on Visibility cho ATF component
  ┌────────────────────────────────────────────────────┐
  │ → ATF component CẦN HIỆN NGAY!                    │
  │ → Lazy visibility → CHẬM FCP/LCP!                 │
  │                                                    │
  │ ✅ FIX: Chỉ dùng cho BTF component!                │
  └────────────────────────────────────────────────────┘
```

---

## §10. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Import On Visibility là gì?"
  A: Pattern chỉ tải module khi component VÀO VIEWPORT!
  Dùng IntersectionObserver detect visibility!
  Component ngoài viewport → sentinel placeholder!
  Scroll tới → IO detect → import() → render!

  Q: "Tại sao IO tốt hơn scroll event?"
  A: → IO chạy NGOÀI main thread → không gây jank!
  → scroll event → mỗi pixel scroll = 1 event → LAG!
  → IO chỉ gọi callback khi threshold THAY ĐỔI!
  → IO tự xử lý debounce/throttle!

  Q: "rootMargin dùng để làm gì?"
  A: Mở rộng vùng detect TRƯỚC khi vào viewport!
  → rootMargin: "200px" → detect sớm 200px!
  → Module bắt đầu tải TRƯỚC khi user thấy!
  → → User scroll tới → component ĐÃ SẴN SÀNG!

  Q: "Sentinel element là gì?"
  A: Phần tử "canh gác" — 1 div nhỏ (minHeight: 1px)!
  → IO observe sentinel thay vì component thật!
  → Sentinel vào viewport → biết cần tải component!
  → Sau khi tải → thay sentinel bằng component thật!

  Q: "Khi nào dùng On Visibility vs On Interaction?"
  A: On Visibility: BTF content, infinite scroll, long pages!
  On Interaction: modal, dropdown, picker, dialog!
  Khác biệt: Visibility = TỰ ĐỘNG (scroll)!
              Interaction = user CHỦ ĐỘNG (click)!
```

---

### Checklist

- [ ] **IO API**: `new IntersectionObserver(callback, {root, rootMargin, threshold})`
- [ ] **Sentinel**: div nhỏ `minHeight: 1px` — IO observe element này!
- [ ] **triggerOnce**: `unobserve()` sau khi detect — chỉ tải 1 lần!
- [ ] **Cleanup**: `observer.disconnect()` trong useEffect cleanup!
- [ ] **rootMargin**: `"200px"` — detect SỚM 200px trước viewport!
- [ ] **Suspense**: Bọc LazyComponent — hiện fallback khi đang tải!
- [ ] **Error Boundary**: Bắt lỗi import fail — hiện error UI!
- [ ] **Retry**: Tự động retry 2 lần khi import() thất bại!
- [ ] **Chỉ BTF**: KHÔNG dùng cho ATF component — sẽ chậm FCP/LCP!
- [ ] **Không dùng scroll event**: IO chạy ngoài main thread, hiệu quả hơn!

---

_Nguồn: patterns.dev — Addy Osmani & Lydia Hallie — "Import on Visibility"_
_Cập nhật lần cuối: Tháng 2, 2026_
