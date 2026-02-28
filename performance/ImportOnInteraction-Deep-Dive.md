# Import On Interaction — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 25 phút đọc
>
> Import On Interaction, Facade Pattern, Lazy-load on Click/Hover,
> Tự viết Script Loader & Facade từ đầu,
> Video Player Embed, Authentication, Chat Widget,
> Progressive Loading (Google Hotels/Flights/Photos),
> JSAction Event Replay, Prefetch vs Preload vs Lazy
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance Pattern
>
> _Dựa trên patterns.dev & web.dev — Addy Osmani_

---

## Mục Lục

| #   | Phần                                     |
| --- | ---------------------------------------- |
| 1   | Tổng quan — Import On Interaction là gì? |
| 2   | Các chiến lược tải tài nguyên            |
| 3   | Facade Pattern — "Giả lập" UI đắt đỏ     |
| 4   | Tự viết Facade cho YouTube Player        |
| 5   | Tự viết Facade cho Chat Widget           |
| 6   | Tự viết Script Loader (Promise-based)    |
| 7   | Import On Interaction trong React        |
| 8   | Progressive Loading — Google Hotels      |
| 9   | JSAction — Bắt click sớm & Event Replay  |
| 10  | Trade-offs & Khi nào dùng?               |
| 11  | Tóm tắt phỏng vấn                        |

---

## §1. Tổng quan — Import On Interaction là gì?

```
IMPORT ON INTERACTION — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  TL;DR: Lazy-load tài nguyên KHÔNG CRITICAL khi user
         TƯƠNG TÁC với UI cần nó!

  VẤN ĐỀ:
  ┌────────────────────────────────────────────────────────┐
  │ Trang có nhiều tính năng KHÔNG CẦN NGAY:              │
  │ → Video player (user chưa bấm play!)                  │
  │ → Chat widget (user chưa cần hỗ trợ!)                │
  │ → Nút Login (user chưa muốn đăng nhập!)              │
  │ → Share dialog (user chưa muốn chia sẻ!)             │
  │ → Emoji picker (user chưa click icon!)                │
  │                                                        │
  │ NẾU TẢI TẤT CẢ NGAY:                                 │
  │ → Chặn main thread! → FID / TBT / TTI tệ!            │
  │ → User phải CHỜ code KHÔNG BAO GIỜ DÙNG!             │
  │                                                        │
  │ VD THỰC TẾ:                                            │
  │ → Google Docs: nút Share = 500KB JS!                  │
  │   → Chỉ tải khi user CLICK Share!                     │
  │ → YouTube embed: ~800KB!                               │
  │   → Chỉ tải khi user CLICK Play!                      │
  │ → Intercom chat: 314KB!                                │
  │   → Chỉ tải khi user CLICK chat icon!                 │
  └────────────────────────────────────────────────────────┘

  GIẢI PHÁP — IMPORT ON INTERACTION:
  ┌────────────────────────────────────────────────────────┐
  │ ① Hiển thị "FACADE" — placeholder giả lập!            │
  │    → Trông GIỐNG component thật!                       │
  │    → Nhưng KHÔNG tải JS nặng!                          │
  │    → Chỉ HTML + CSS nhẹ!                               │
  │                                                        │
  │ ② User CLICK vào facade                                │
  │    → import() tải code THẬT!                           │
  │    → Thay facade bằng component THẬT!                  │
  │                                                        │
  │ ③ User KHÔNG click                                     │
  │    → KHÔNG tải gì → tiết kiệm 100%!                   │
  └────────────────────────────────────────────────────────┘
```

```
VÍ DỤ THỰC TẾ — CON SỐ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────┬──────────────────────┐
  │ Tính năng        │ JS Size   │ Khi tải?             │
  ├──────────────────┼───────────┼──────────────────────┤
  │ Google Docs      │ 500KB     │ Click "Share"        │
  │   Share Dialog   │           │                      │
  ├──────────────────┼───────────┼──────────────────────┤
  │ YouTube Embed    │ ~800KB    │ Click "Play"         │
  │   Video Player   │           │                      │
  ├──────────────────┼───────────┼──────────────────────┤
  │ Intercom Chat    │ 314KB     │ Click chat button    │
  │   Widget         │           │ TTI: 7.7s → 3.7s!   │
  ├──────────────────┼───────────┼──────────────────────┤
  │ emoji-mart       │ 98KB gz   │ Click emoji icon     │
  │   Emoji Picker   │           │                      │
  ├──────────────────┼───────────┼──────────────────────┤
  │ react-scroll     │ 7KB       │ Click "Back to Top"  │
  └──────────────────┴───────────┴──────────────────────┘
```

---

## §2. Các chiến lược tải tài nguyên

```
6 CHIẾN LƯỢC TẢI TÀI NGUYÊN:
═══════════════════════════════════════════════════════════════

  Thời gian →
  Page Load ──────────────────────────────── User Idle
       │                                        │
  ① EAGER (tải ngay):
  ═══▓▓▓▓▓▓▓▓▓▓══════════════════════════════════
      │ TẤT CẢ │
      │  code   │
      → Script thông thường, chặn main thread!

  ② PRELOAD (tải sớm, ưu tiên CAO):
  ═══▓▓▓▓▓▓▓▓══════════════════════════════════════
      │ priority │
      │  HIGH    │
      → <link rel="preload"> — tải SONG SONG!

  ③ PREFETCH (tải sớm, ưu tiên THẤP):
  ═══════════▓▓▓▓▓▓════════════════════════════════
              │ idle │
              │ time │
              → <link rel="prefetch"> — tải khi NHÀN!

  ④ LAZY — ROUTE-BASED:
  ═══════════════════ navigate ═══▓▓▓▓▓════════════
                                  │route│
                                  │chunk│
                      → Tải khi chuyển route!

  ⑤ LAZY — ON INTERACTION: ← BÀI NÀY!
  ═════════════════════ click ═════▓▓▓▓════════════
                                   │ code│
                       → Tải khi user CLICK/HOVER!

  ⑥ LAZY — IN VIEWPORT:
  ═══════════════════ scroll ══════▓▓▓▓════════════
                                   │ code│
                       → Tải khi scroll VÀO viewport!

  QUY TẮC CHỌN:
  ┌────────────────────────────────────────────────────┐
  │ 1P code + có thể prefetch → PREFETCH!              │
  │ 1P code + KHÔNG thể prefetch → ON INTERACTION!     │
  │ 3P code (non-critical) → ON INTERACTION! (ưu tiên!)│
  │ BTF content → IN VIEWPORT!                         │
  │ Critical resources → EAGER hoặc PRELOAD!           │
  └────────────────────────────────────────────────────┘
```

---

## §3. Facade Pattern — "Giả lập" UI đắt đỏ

```
FACADE PATTERN:
═══════════════════════════════════════════════════════════════

  FACADE = "MẶT TIỀN" — preview/placeholder
  → TRÔNG GIỐNG component thật!
  → Nhưng CHỈ LÀ HTML + CSS (nhẹ!)
  → KHÔNG tải JS nặng của component!

  ┌──────────────── TRƯỚC (Eager) ──────────────────┐
  │                                                  │
  │  Page Load → TẢI 800KB YouTube JS → Render      │
  │  → User CHƯA xem video nhưng ĐÃ TẢI 800KB!    │
  │  → Main thread bị CHẶN!                         │
  │                                                  │
  └──────────────────────────────────────────────────┘

  ┌──────────────── SAU (Facade) ───────────────────┐
  │                                                  │
  │  Page Load → Render FACADE (thumbnail + ▶ button)│
  │  → Chỉ 3KB! (1 ảnh + CSS!)                      │
  │                                                  │
  │  User click ▶ → import() → TẢI 800KB YouTube JS │
  │  → Thay facade bằng player THẬT!                 │
  │                                                  │
  │  User KHÔNG click → KHÔNG TẢI GÌ! → 0KB!        │
  │                                                  │
  └──────────────────────────────────────────────────┘

  SƠ ĐỒ:
  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
  │  FACADE     │ click  │  LOADING    │ done   │  REAL       │
  │  (HTML+CSS) │───────→│  import()   │───────→│  COMPONENT  │
  │  3KB        │        │  ...800KB   │        │  Full feat! │
  │  ┌───────┐  │        │  ┌───────┐  │        │  ┌───────┐  │
  │  │ thumb │  │        │  │ spin  │  │        │  │ video │  │
  │  │  ▶    │  │        │  │  ...  │  │        │  │  ▶❚❚  │  │
  │  └───────┘  │        │  └───────┘  │        │  └───────┘  │
  └─────────────┘        └─────────────┘        └─────────────┘

  BONUS — PRECONNECT ON HOVER:
  → User HOVER facade → preconnect tới 3P domain!
  → Thiết lập DNS + TCP + TLS TRƯỚC!
  → Khi CLICK → tải nhanh hơn vì connection đã SẴN!
```

---

## §4. Tự viết Facade cho YouTube Player

```jsx
// ═══ YouTubeFacade.jsx — TỰ VIẾT TỪ ĐẦU ═══

import React, { useState, useCallback, useEffect } from "react";

/**
 * Facade cho YouTube Player — chỉ tải 3KB ban đầu!
 * Khi click → tải full YouTube iframe embed!
 *
 * Tương tự lite-youtube-embed của Paul Irish,
 * nhưng TỰ VIẾT BẰNG TAY không dùng thư viện!
 *
 * @param {string} videoId - YouTube Video ID
 * @param {string} title - Video title (accessibility)
 * @param {string} thumbnailQuality - maxresdefault/hqdefault/mqdefault
 */
function YouTubeFacade({
  videoId,
  title = "Video",
  thumbnailQuality = "hqdefault",
}) {
  // State: đã click chưa?
  const [isActivated, setIsActivated] = useState(false);

  // State: đã preconnect chưa? (hover optimization)
  const [hasPreconnected, setHasPreconnected] = useState(false);

  // ① PRECONNECT khi hover — thiết lập connection SỚM!
  const handleMouseOver = useCallback(() => {
    if (hasPreconnected) return;

    // Tạo <link rel="preconnect"> ĐỘNG!
    const origins = [
      "https://www.youtube.com",
      "https://www.google.com",
      "https://i.ytimg.com", // thumbnail CDN
    ];

    origins.forEach((origin) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    });

    setHasPreconnected(true);
  }, [hasPreconnected]);

  // ② CLICK → kích hoạt YouTube iframe thật!
  const handleClick = useCallback(() => {
    setIsActivated(true);
  }, []);

  // Thumbnail URL từ YouTube CDN
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/${thumbnailQuality}.jpg`;

  // ③ ĐÃ CLICK → render iframe THẬT (full YouTube player!)
  if (isActivated) {
    return (
      <div style={styles.wrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write;
                 encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={styles.iframe}
          loading="lazy"
        />
      </div>
    );
  }

  // ④ CHƯA CLICK → render FACADE (chỉ thumbnail + nút play)!
  return (
    <div
      style={{
        ...styles.wrapper,
        backgroundImage: `url(${thumbnailUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: "pointer",
      }}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onFocus={handleMouseOver}
      role="button"
      tabIndex={0}
      aria-label={`Play video: ${title}`}
    >
      {/* Nút Play giả lập bằng CSS! */}
      <div style={styles.playButton}>
        <svg viewBox="0 0 68 48" width="68" height="48">
          <path
            d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19
               C55.79.13 34 0 34 0S12.21.13 6.9 1.55
               C3.97 2.33 2.27 4.81 1.48 7.74
               .06 13.05 0 24 0 24s.06 10.95 1.48 16.26
               c.78 2.93 2.49 5.41 5.42 6.19
               C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55
               c2.93-.78 4.64-3.26 5.42-6.19
               C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            fill="red"
          />
          <path d="M45 24 27 14v20" fill="white" />
        </svg>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    width: "100%",
    paddingBottom: "56.25%", // 16:9 aspect ratio
    overflow: "hidden",
    borderRadius: "8px",
  },
  iframe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: "none",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0.8,
    transition: "opacity 0.2s",
  },
};

export default YouTubeFacade;
```

```
GIẢI THÍCH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ① PRECONNECT ON HOVER:
  ┌────────────────────────────────────────────────────┐
  │ User HOVER lên facade                              │
  │ → Tạo 3 thẻ <link rel="preconnect">              │
  │ → youtube.com: API + iframe                        │
  │ → google.com: authentication                       │
  │ → i.ytimg.com: thumbnail CDN                       │
  │                                                    │
  │ → Browser thiết lập DNS + TCP + TLS TRƯỚC!        │
  │ → Khi user CLICK → iframe tải NHANH hơn!          │
  │                                                    │
  │ Hover ──→ preconnect ──→ Click ──→ iframe tải!    │
  │ (DNS+TCP+TLS          (đã có      (SỬ DỤNG       │
  │  đang thiết lập!)      connection!) connection!)   │
  └────────────────────────────────────────────────────┘

  ② CLICK → isActivated = true → render iframe:
  ┌────────────────────────────────────────────────────┐
  │ → autoplay=1: video TỰ CHẠY ngay khi iframe tải! │
  │ → User cảm giác LIỀN MẠCH!                        │
  │ → Không cần click PLAY lần nữa!                   │
  └────────────────────────────────────────────────────┘

  ④ FACADE — chỉ là thumbnail + CSS:
  ┌────────────────────────────────────────────────────┐
  │ → Background image = thumbnail từ YouTube CDN!    │
  │ → Nút play = SVG inline (0KB JS!)                 │
  │ → paddingBottom: 56.25% = 16:9 aspect ratio!     │
  │ → role="button" + tabIndex={0} = Accessible!       │
  │ → → TỔNG: ~3KB (1 ảnh + CSS + SVG)!               │
  │ → → So với YouTube embed: ~800KB JS!               │
  └────────────────────────────────────────────────────┘
```

---

## §5. Tự viết Facade cho Chat Widget

```jsx
// ═══ ChatWidgetFacade.jsx — TỰ VIẾT TỪ ĐẦU ═══

import React, { useState, useCallback, useRef, useEffect } from "react";

/**
 * Facade cho Chat Widget (thay thế Intercom, Drift, etc.)
 * Ban đầu CHỈ render nút chat bằng HTML + CSS!
 * Click → tải script chat THẬT!
 *
 * Tương tự cách Calibre app tối ưu Intercom (giảm 30%!)
 * và Postmark (TTI: 7.7s → 3.7s!)
 */
function ChatWidgetFacade({
  scriptUrl, // URL của chat widget SDK
  onLoad, // Callback khi SDK tải xong
  position = "bottom-right",
  brandColor = "#0066FF",
  greeting = "Xin chào! Cần hỗ trợ gì?",
}) {
  const [state, setState] = useState("idle");
  // idle → loading → loaded → error

  const scriptLoadedRef = useRef(false);

  // ① Promise-based script loader — TỰ VIẾT!
  const loadScript = useCallback((url) => {
    return new Promise((resolve, reject) => {
      // Guard: đã tải rồi → skip!
      if (scriptLoadedRef.current) {
        resolve();
        return;
      }

      // Tạo <script> tag ĐỘNG!
      const script = document.createElement("script");
      script.src = url;
      script.async = true; // KHÔNG chặn parser!

      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };

      script.onerror = (error) => {
        // Xóa script lỗi khỏi DOM!
        document.body.removeChild(script);
        reject(new Error(`Failed to load: ${url}`));
      };

      document.body.appendChild(script);
    });
  }, []);

  // ② Click handler — tải chat SDK!
  const handleClick = useCallback(async () => {
    if (state === "loaded" || state === "loading") return;

    setState("loading");

    try {
      await loadScript(scriptUrl);
      setState("loaded");
      onLoad?.(); // Gọi callback (VD: mở chat window!)
    } catch (error) {
      console.error("Chat widget load failed:", error);
      setState("error");
    }
  }, [scriptUrl, loadScript, onLoad, state]);

  // ③ Retry sau lỗi
  const handleRetry = useCallback(() => {
    setState("idle");
    handleClick();
  }, [handleClick]);

  // ④ Preconnect on hover
  const handleMouseOver = useCallback(() => {
    try {
      const url = new URL(scriptUrl);
      const existing = document.querySelector(
        `link[rel="preconnect"][href="${url.origin}"]`,
      );
      if (existing) return;

      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = url.origin;
      document.head.appendChild(link);
    } catch {}
  }, [scriptUrl]);

  const positionStyle =
    position === "bottom-right"
      ? { bottom: "20px", right: "20px" }
      : { bottom: "20px", left: "20px" };

  // ⑤ Render theo state
  return (
    <div
      style={{
        position: "fixed",
        ...positionStyle,
        zIndex: 9999,
      }}
    >
      {state === "error" && (
        <div style={chatStyles.errorBubble}>
          <p>
            Không tải được. <button onClick={handleRetry}>Thử lại</button>
          </p>
        </div>
      )}

      {/* NÚT CHAT — FACADE! Chỉ CSS + SVG! */}
      <button
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onFocus={handleMouseOver}
        disabled={state === "loading"}
        style={{
          ...chatStyles.button,
          backgroundColor: brandColor,
        }}
        aria-label="Mở chat hỗ trợ"
      >
        {state === "loading" ? (
          // Spinner CSS (không cần JS/library!)
          <div style={chatStyles.spinner} />
        ) : (
          // Chat icon SVG
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0
                     2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

const chatStyles = {
  button: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBubble: {
    background: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    fontSize: "13px",
  },
};

export default ChatWidgetFacade;
```

```
LUỒNG HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  ① Page load → render NÚT CHAT (HTML + CSS + SVG)
     → 0KB JavaScript cho chat! Chỉ ~1KB HTML!
     │
  ② User HOVER nút chat
     → Preconnect tới chat SDK domain!
     → DNS + TCP + TLS thiết lập TRƯỚC!
     │
  ③ User CLICK nút chat
     → setState("loading") → hiện spinner!
     → loadScript(scriptUrl) → tạo <script> tag!
     → Browser tải chat SDK (VD: 314KB Intercom!)
     │
     ├── Thành công:
     │   → setState("loaded")
     │   → onLoad() → mở chat window!
     │   → Chat widget THẬT hiển thị!
     │
     └── Thất bại:
         → setState("error")
         → Hiện "Thử lại" button!
         → User click retry → tải lại!

  KẾT QUẢ:
  ┌────────────────────────────────────────────────────┐
  │ TRƯỚC (Eager):        SAU (Facade):               │
  │ TTI = 7.7s            TTI = 3.7s                   │
  │ JS loaded = 314KB     JS loaded = 0KB              │
  │ (luôn tải!)           (chỉ khi click!)             │
  │                                                    │
  │ → GIẢM 52% TTI! (Postmark case study)              │
  └────────────────────────────────────────────────────┘
```

---

## §6. Tự viết Script Loader (Promise-based)

```jsx
// ═══ ScriptLoader.js — Promise-based Script Loader ═══

/**
 * Tự viết Script Loader — tải script 3P THEO YÊU CẦU!
 * Không dùng thư viện!
 *
 * Hỗ trợ:
 * → Tải 1 hoặc NHIỀU scripts!
 * → Xử lý lỗi + retry!
 * → Cache scripts đã tải (không tải lại!)
 * → Preconnect trước khi tải!
 */
class ScriptLoader {
  constructor() {
    // Cache: URL → Promise (tránh tải trùng!)
    this._cache = new Map();
  }

  /**
   * Tải 1 script.
   * @param {string} url - URL script cần tải
   * @param {Object} options
   * @param {boolean} options.async - async attribute (mặc định true)
   * @param {boolean} options.defer - defer attribute
   * @param {Object} options.attrs - custom attributes
   * @returns {Promise<HTMLScriptElement>}
   */
  loadOne(url, options = {}) {
    // ① Đã tải rồi → trả về cached Promise!
    if (this._cache.has(url)) {
      return this._cache.get(url);
    }

    // ② Tạo Promise
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = options.async !== false; // mặc định true

      if (options.defer) script.defer = true;

      // Custom attributes (VD: data-id, crossorigin)
      if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
          script.setAttribute(key, value);
        });
      }

      script.onload = () => resolve(script);
      script.onerror = () => {
        // Xóa khỏi cache để có thể retry!
        this._cache.delete(url);
        document.head.removeChild(script);
        reject(new Error(`Script load failed: ${url}`));
      };

      document.head.appendChild(script);
    });

    // ③ Cache Promise (tránh tải trùng!)
    this._cache.set(url, promise);
    return promise;
  }

  /**
   * Tải NHIỀU scripts TUẦN TỰ.
   * @param {string[]} urls
   * @returns {Promise<HTMLScriptElement[]>}
   */
  async loadAll(urls) {
    const results = [];
    for (const url of urls) {
      const script = await this.loadOne(url);
      results.push(script);
    }
    return results;
  }

  /**
   * Preconnect tới domain TRƯỚC khi tải!
   * @param {string} url
   */
  preconnect(url) {
    try {
      const origin = new URL(url).origin;
      const exists = document.querySelector(
        `link[rel="preconnect"][href="${origin}"]`,
      );
      if (exists) return;

      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    } catch {}
  }
}

// ═══ SỬ DỤNG ═══

// Ví dụ: Nút Login với Google
const loader = new ScriptLoader();

const loginBtn = document.querySelector("#login");

// Preconnect khi HOVER!
loginBtn.addEventListener("mouseenter", () => {
  loader.preconnect("https://apis.google.com/js/client:platform.js");
});

// Tải SDK khi CLICK!
loginBtn.addEventListener("click", async () => {
  try {
    await loader.loadOne("https://apis.google.com/js/client:platform.js");
    // SDK đã tải → hiện login screen!
    showLoginScreen();
  } catch (err) {
    console.error("Login SDK failed:", err);
  }
});
```

```
GIẢI THÍCH SCRIPT LOADER:
═══════════════════════════════════════════════════════════════

  TẠI SAO CẦN CACHE?
  ┌────────────────────────────────────────────────────┐
  │ → User click Login → tải SDK → thành công!        │
  │ → User click Login LẦN 2 → ĐÃ CÓ CACHE!         │
  │ → → Trả về CÙNG Promise → KHÔNG tải lại!         │
  │ → → Tránh duplicate <script> tags!                 │
  └────────────────────────────────────────────────────┘

  TẠI SAO XÓA CACHE KHI LỖI?
  ┌────────────────────────────────────────────────────┐
  │ → Script tải lỗi (mạng chậm, CDN down!)          │
  │ → Xóa khỏi cache → lần sau TẢI LẠI!             │
  │ → Nếu KHÔNG xóa → cached Promise = rejected!      │
  │ → → User KHÔNG BAO GIỜ tải lại được!              │
  └────────────────────────────────────────────────────┘

  TẠI SAO TẢI TUẦN TỰ (loadAll)?
  ┌────────────────────────────────────────────────────┐
  │ → Một số SDK cần tải THEO THỨ TỰ!                 │
  │ → VD: jQuery phải tải TRƯỚC jQuery plugins!       │
  │ → loadAll: tuần tự → đảm bảo thứ tự!             │
  │ → Nếu cần song song → dùng Promise.all!           │
  └────────────────────────────────────────────────────┘
```

---

## §7. Import On Interaction trong React

```jsx
// ═══ CÁCH 1: React.lazy + onClick ═══

import React, { useState, lazy, Suspense } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

// lazy() — KHÔNG gọi import() ngay!
const EmojiPicker = lazy(
  () => import(/* webpackChunkName: "emoji-picker" */ "./EmojiPicker"),
);

const Channel = () => {
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div>
      <MessageList />
      <MessageInput onEmojiClick={() => setEmojiOpen(true)} />
      {emojiOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <EmojiPicker /> {/* Chỉ import() KHI emojiOpen! */}
        </Suspense>
      )}
    </div>
  );
};
```

```jsx
// ═══ CÁCH 2: Manual import() + createElement ═══
// → Kiểm soát HOÀN TOÀN thời điểm import!
// → KHÔNG cần React.lazy!

import React, { useState, createElement } from "react";
import ErrorBoundary from "./ErrorBoundary";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const Channel = () => {
  const [emojiPickerEl, setEmojiPickerEl] = useState(null);

  // ① Click → import() → createElement → setState!
  const openEmojiPicker = () => {
    import(/* webpackChunkName: "emoji-picker" */ "./EmojiPicker")
      .then((module) => module.default) // Lấy default export!
      .then((EmojiPicker) => {
        // ② Tạo React element từ component đã tải!
        setEmojiPickerEl(createElement(EmojiPicker));
      })
      .catch((err) => {
        console.error("Failed to load EmojiPicker:", err);
      });
  };

  return (
    <ErrorBoundary>
      <div>
        <MessageList />
        <MessageInput onClick={openEmojiPicker} />
        {emojiPickerEl} {/* Render element trực tiếp! */}
      </div>
    </ErrorBoundary>
  );
};
```

```
SO SÁNH 2 CÁCH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────────┬──────────────────┐
  │                  │ React.lazy        │ Manual import()  │
  ├──────────────────┼───────────────────┼──────────────────┤
  │ Đơn giản?        │ ✅ Rất đơn giản    │ ❌ Phức tạp hơn  │
  │ Suspense cần?    │ ✅ Bắt buộc        │ ❌ Không cần     │
  │ Kiểm soát?       │ ❌ Ít              │ ✅ Hoàn toàn     │
  │ Loading state?   │ Qua Suspense      │ Tự quản lý      │
  │ Error handling   │ Error Boundary    │ .catch() trực tiếp│
  │ Khi nào import?  │ Khi render lần đầu│ Khi gọi hàm     │
  │ Re-render?       │ Tự động           │ createElement    │
  └──────────────────┴───────────────────┴──────────────────┘

  CÁCH 2 HỮU ÍCH KHI:
  → Cần import MODULE (không phải component!) VD: lodash
  → Cần import TRƯỚC khi render (prefetch logic!)
  → Cần import từ EVENT HANDLER (vanilla JS!)
```

```javascript
// ═══ VANILLA JS — Import On Interaction ═══

// VD: Nút "Back to Top" — tải react-scroll khi click!
function handleScrollToTop() {
  import("react-scroll")
    .then((scroll) => {
      scroll.animateScroll.scrollToTop({});
    })
    .catch((err) => {
      console.error(err);
      // Fallback: scroll bằng native API!
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// → TIẾT KIỆM 7KB cho mỗi page load!
// → Chỉ tải khi user THỰC SỰ click!
```

---

## §8. Progressive Loading — Google Hotels

```
PROGRESSIVE LOADING — GOOGLE HOTELS:
═══════════════════════════════════════════════════════════════

  VÍ DỤ: User tìm khách sạn ở Mumbai, India

  ┌─────────────────── NAIVE CSR ──────────────────────┐
  │                                                     │
  │  Page Load → Tải TẤT CẢ HTML/JS/CSS                │
  │  → Fetch data → RENDER                             │
  │  → User CHỜØ rất lâu với BLANK screen!             │
  │  → Map code tải DÙ chưa chọn destination!          │
  │                                                     │
  │  Timeline:                                          │
  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ Render!          │
  │  │  Tải TOÀN BỘ JS + CSS + Data │                  │
  │  │  (DÙ user chưa cần!)         │                  │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────── SSR ────────────────────────────┐
  │                                                     │
  │  Server render HTML → User THẤY trang sớm!         │
  │  NHƯNG: chưa tương tác được! (chưa hydrate!)       │
  │  → "Uncanny Valley" — trang TRÔNG sẵn sàng         │
  │    nhưng click KHÔNG HOẠT ĐỘNG!                     │
  │  → → "Rage clicks"! User click liên tục!           │
  └─────────────────────────────────────────────────────┘

  ┌──────── PROGRESSIVE LOADING (Google) ──────────────┐
  │                                                     │
  │  ❶ Tải MINIMAL code → trang hiển thị NHANH!        │
  │  ❷ User TƯƠNG TÁC → tải code cho tính năng đó!    │
  │  ❸ Code KHÔNG DÙNG → KHÔNG BAO GIỜ TẢI!           │
  │                                                     │
  │  VD: "More Filters" button                          │
  │  ┌─────────────────────────────────┐                │
  │  │ User click "More Filters"       │                │
  │  │ → Tải 30KB JS + data cho filter │                │
  │  │ → Render filter UI!             │                │
  │  │ → User KHÔNG click → 0KB!       │                │
  │  └─────────────────────────────────┘                │
  │                                                     │
  │  TIMELINE:                                          │
  │  ▓▓▓▓ │ Hiển thị! → click ▓▓ Filters!              │
  │  │min │              │30KB│                         │
  │  │code│              │ load│                        │
  └─────────────────────────────────────────────────────┘

  CODE-SPLIT THEO COMPONENT (không theo route!):
  ┌────────────────────────────────────────────────────┐
  │ Build time → tạo DEPENDENCY GRAPH:                 │
  │                                                    │
  │  Component A                                       │
  │  ├── code: a.chunk.js (15KB)                       │
  │  ├── data: /api/a-data                             │
  │  └── css: a.css (2KB)                              │
  │                                                    │
  │  Component B                                       │
  │  ├── code: b.chunk.js (30KB)                       │
  │  ├── data: /api/b-data                             │
  │  └── css: b.css (5KB)                              │
  │                                                    │
  │ → App BIẾT mỗi component cần GÌ!                  │
  │ → Click component → tải ĐÚNG resources!            │
  │ → Code + data + CSS = 1 request away!              │
  └────────────────────────────────────────────────────┘
```

---

## §9. JSAction — Bắt click sớm & Event Replay

```
VẤN ĐỀ: MẤT CLICK SỚM!
═══════════════════════════════════════════════════════════════

  User click TRƯỚC KHI JS tải xong → click BỊ MẤT!

  Timeline:
  Page render ──── User click! ──── JS tải xong
                   │                  │
                   │  CLICK BỊ MẤT!  │
                   │  (JS chưa có!)   │

  GIẢI PHÁP: JSAction (Google's tiny event library):
  ┌────────────────────────────────────────────────────┐
  │ ① Inline TINY script (~1KB) trong HTML ban đầu!   │
  │ ② Script này BẮT TẤT CẢ clicks!                  │
  │ ③ Lưu clicks vào HÀNG ĐỢI (queue)!               │
  │ ④ Khi framework bootstrap xong → REPLAY clicks!  │
  │                                                    │
  │ 2 CHỨC NĂNG:                                       │
  │ → Trigger DOWNLOAD code dựa trên interaction!      │
  │ → REPLAY interactions khi framework sẵn sàng!     │
  └────────────────────────────────────────────────────┘
```

```javascript
// ═══ TỰ VIẾT MINI JSAction — EVENT QUEUE ═══

/**
 * Tiny Event Queue — bắt & replay click sớm!
 * Inline trong HTML ban đầu (~500 bytes!)
 */
const EventQueue = (() => {
  const queue = [];
  let isReplaying = false;
  let isBootstrapped = false;

  // ① Bắt TẤT CẢ clicks trên document!
  document.addEventListener(
    "click",
    (event) => {
      if (isBootstrapped) return; // Framework đã sẵn → bỏ qua!

      // Lưu event info vào queue!
      queue.push({
        type: event.type,
        target: event.target,
        timestamp: Date.now(),
        // Lưu data attributes để biết handler nào!
        action: event.target.closest("[data-action]")?.dataset.action,
      });
    },
    true, // capture phase — bắt TRƯỚC bubbling!
  );

  return {
    // ② Framework gọi khi bootstrap xong!
    bootstrap(handlers) {
      isBootstrapped = true;
      isReplaying = true;

      // REPLAY tất cả clicks đã bắt!
      while (queue.length > 0) {
        const event = queue.shift();
        if (event.action && handlers[event.action]) {
          handlers[event.action](event);
        }
      }

      isReplaying = false;
    },

    // ③ Kiểm tra có events chưa replay không
    hasPendingEvents() {
      return queue.length > 0;
    },
  };
})();

// ═══ TRONG HTML ═══
// <button data-action="open-filters">More Filters</button>
// <button data-action="open-chat">Chat</button>

// ═══ KHI FRAMEWORK BOOTSTRAP ═══
// EventQueue.bootstrap({
//   "open-filters": (e) => loadFiltersComponent(),
//   "open-chat": (e) => loadChatWidget(),
// });
```

```
SƠ ĐỒ EVENT REPLAY:
═══════════════════════════════════════════════════════════════

  Thời gian →

  ① HTML render (có EventQueue ~500 bytes inline!)
  ──────────────────────────────────────────────────

  ② User click "More Filters" (JS chưa tải!)
  → EventQueue BẮT click → lưu vào queue!
  → VÀ trigger download code cho filters!
  ──────── click bắt! ─────────────────────────────

  ③ User click "Chat" (JS vẫn chưa tải!)
  → EventQueue BẮT click → lưu vào queue!
  → VÀ trigger download code cho chat!
  ──────── click bắt! ─────────────────────────────

  ④ Framework bootstrap xong!
  → EventQueue.bootstrap(handlers)
  → REPLAY: click "More Filters" → handler chạy!
  → REPLAY: click "Chat" → handler chạy!
  → → User KHÔNG MẤT click nào! 🎉
  ──────── replay! ────────────────────────────────
```

---

## §10. Trade-offs & Khi nào dùng?

```
TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  ⚠️ TRADE-OFF 1: User CHỜ sau khi click!
  ┌────────────────────────────────────────────────────┐
  │ → Click → tải module → CHỜ → hiển thị!           │
  │ → Mạng chậm → chờ LÂU!                            │
  │                                                    │
  │ GIẢM THIỂU:                                        │
  │ → Chunks NHỎ (Google: ~30KB mỗi interaction!)    │
  │ → PREFETCH sau khi critical content tải xong!      │
  │ → PRECONNECT on hover (DNS+TCP+TLS trước!)        │
  └────────────────────────────────────────────────────┘

  ⚠️ TRADE-OFF 2: Không có chức năng trước interaction!
  ┌────────────────────────────────────────────────────┐
  │ → Video embed dùng facade → KHÔNG autoplay được!  │
  │ → Chat widget dùng facade → KHÔNG nhận tin nhắn!  │
  │                                                    │
  │ GIẢM THIỂU:                                        │
  │ → Nếu CẦN autoplay → dùng lazy-on-viewport!      │
  │ → Nếu feature CRITICAL → KHÔNG dùng facade!       │
  └────────────────────────────────────────────────────┘

  KHI NÀO DÙNG?
  ┌──────────────────┬────────────┬────────────────────┐
  │ Tình huống       │ Dùng?      │ Lý do              │
  ├──────────────────┼────────────┼────────────────────┤
  │ 3P widgets       │ ✅ CÓ!      │ Non-critical, nặng │
  │ (chat, social)   │            │                    │
  │ Video embeds     │ ✅ CÓ!      │ 800KB+ JS!         │
  │ Auth SDKs        │ ✅ CÓ!      │ Chỉ cần khi login  │
  │ Share dialogs    │ ✅ CÓ!      │ 500KB (Google Docs!)│
  │ Emoji pickers    │ ✅ CÓ!      │ 98KB, ít dùng      │
  │ ATF content      │ ❌ KHÔNG!   │ Cần hiện NGAY!     │
  │ Navigation       │ ❌ KHÔNG!   │ Critical!          │
  │ Autoplay video   │ ❌ KHÔNG!   │ Cần chạy ngay!     │
  └──────────────────┴────────────┴────────────────────┘
```

---

## §11. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Import On Interaction là gì?"
  A: Lazy-load tài nguyên KHÔNG CRITICAL khi user TƯƠNG TÁC!
  Click/hover → import() → tải code → render!
  Dùng Facade (placeholder HTML+CSS) thay component thật!

  Q: "Facade pattern là gì?"
  A: Placeholder TRÔNG GIỐNG component thật nhưng CHỈ HTML+CSS!
  VD: YouTube thumbnail + nút play = 3KB!
  Click → tải YouTube iframe thật = 800KB!
  User không click → tiết kiệm 800KB!

  Q: "Preconnect on hover giúp gì?"
  A: Hover facade → <link rel="preconnect"> → DNS+TCP+TLS!
  Click sau đó → connection ĐÃ SẴN → tải nhanh hơn!
  → Giảm perceived latency cho user!

  Q: "JSAction / Event Replay là gì?"
  A: Tiny script (~1KB) inline trong HTML!
  → BẮT tất cả clicks TRƯỚC KHI framework tải!
  → Lưu vào queue → framework bootstrap → REPLAY!
  → User KHÔNG MẤT click sớm!

  Q: "Progressive Loading khác Code Splitting thế nào?"
  A: Code splitting: tách theo ROUTE (page-level)!
  Progressive loading: tách theo COMPONENT (feature-level)!
  → Dependency graph: biết mỗi component cần code+data gì!
  → Click component → tải ĐÚNG resources cho nó!

  Q: "Khi nào KHÔNG dùng Import On Interaction?"
  A: → ATF content (cần hiện NGAY!)
  → Autoplay media (cần chạy ngay!)
  → Navigation (critical path!)
  → 1P code CÓ THỂ prefetch → dùng prefetch thay!
```

---

### Checklist

- [ ] **Facade pattern**: HTML+CSS placeholder → trông giống thật → click mới tải!
- [ ] **Preconnect on hover**: `<link rel="preconnect">` khi hover → DNS+TCP+TLS trước!
- [ ] **Script Loader**: Promise-based, cache URL, xóa cache khi lỗi → retry được!
- [ ] **React.lazy**: Cách đơn giản — lazy() + Suspense + conditional render!
- [ ] **Manual import()**: Kiểm soát hoàn toàn — import().then(createElement)!
- [ ] **YouTube Facade**: Thumbnail + SVG play button → click mới tải iframe!
- [ ] **Chat Widget Facade**: CSS button → click mới tải chat SDK (314KB)!
- [ ] **Event Queue (JSAction)**: Bắt click sớm → replay khi framework ready!
- [ ] **Progressive Loading**: Split theo component (không route!) + dependency graph!
- [ ] **Trade-offs**: User chờ sau click → giảm bằng prefetch + preconnect + small chunks!
- [ ] **Không dùng cho**: ATF content, autoplay, navigation, 1P có thể prefetch!

---

_Nguồn: patterns.dev & web.dev — Addy Osmani — "Import On Interaction"_
_Google Hotels/Flights Progressive Loading — Shubhie Panicker_
_Cập nhật lần cuối: Tháng 2, 2026_
