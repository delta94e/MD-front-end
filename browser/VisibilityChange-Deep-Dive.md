# Page Visibility API — Deep Dive!

> **Sử dụng visibilitychange để xử lý sự kiện trang ẩn/hiện!**
> Tự viết từ đầu, giải thích chi tiết, bao gồm sơ đồ!

---

## §1. Khái Niệm — visibilitychange Là Gì?

```
  PAGE VISIBILITY API:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ visibilitychange = sự kiện khi TAB ẨN hoặc HIỆN!       │
  │                                                              │
  │  KHI NÀO TRIGGER?                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Chuyển sang TAB KHÁC!                              │    │
  │  │ ✅ ĐÓNG tab!                                           │    │
  │  │ ✅ Mở tab MỚI!                                        │    │
  │  │ ✅ MINIMIZE browser!                                    │    │
  │  │ ✅ ĐÓNG browser!                                       │    │
  │  │ ✅ Mobile: chuyển sang APP KHÁC!                       │    │
  │  │ ✅ Navigate sang trang KHÁC!                            │    │
  │  │                                                      │    │
  │  │ ❌ WeChat built-in browser (không có tabs!)           │    │
  │  │ ❌ Mobile bấm Home (không phải tất cả device!)      │    │
  │  │ ❌ PC mất focus (nhưng KHÔNG minimize!)               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 GIÁ TRỊ CHÍNH:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ document.hidden:                                       │    │
  │  │ → true  = trang bị ẨN! (tab background!) ★           │    │
  │  │ → false = trang ĐANG HIỆN! (tab foreground!) ★       │    │
  │  │                                                      │    │
  │  │ document.visibilityState:                               │    │
  │  │ → "visible"   = trang đang hiện! ★                   │    │
  │  │ → "hidden"    = trang bị ẩn! ★                       │    │
  │  │ → "prerender" = trang đang prerender (hiếm!)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ HOẠT ĐỘNG:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Tab Active          Tab Hidden          Tab Active    │    │
  │  │  (visible)           (hidden)            (visible)    │    │
  │  │  ┌─────────┐        ┌─────────┐        ┌─────────┐    │    │
  │  │  │ Page    │──────→│ Page    │──────→│ Page    │    │    │
  │  │  │ Running │  user  │ Paused  │  user  │ Running │    │    │
  │  │  │         │  left  │         │  back  │         │    │    │
  │  │  └─────────┘        └─────────┘        └─────────┘    │    │
  │  │       │          ↑        │          ↑       │          │    │
  │  │       └──────────┘        └──────────┘       │          │    │
  │  │     visibilitychange!   visibilitychange!               │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách Sử Dụng Cơ Bản!

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: Cơ bản nhất!
// ═══════════════════════════════════════════════════════════

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    // ★ Trang bị ẨN! (user rời tab!)
    console.log("Trang bị ẩn!");
  } else {
    // ★ Trang HIỆN lại! (user quay lại!)
    console.log("Trang hiện lại!");
  }
});

// ═══════════════════════════════════════════════════════════
// CÁCH 2: Dùng visibilityState (chi tiết hơn!)
// ═══════════════════════════════════════════════════════════

document.addEventListener("visibilitychange", function () {
  switch (document.visibilityState) {
    case "visible":
      console.log("Tab đang active!");
      break;
    case "hidden":
      console.log("Tab bị ẩn!");
      break;
    case "prerender":
      console.log("Tab đang prerender!");
      break;
  }
});

// ═══════════════════════════════════════════════════════════
// ★ QUAN TRỌNG: Phải listen trên DOCUMENT!
// ★ Safari < 14 KHÔNG hỗ trợ listen trên window!
// ═══════════════════════════════════════════════════════════
// ❌ window.addEventListener('visibilitychange', ...) // Safari lỗi!
// ✅ document.addEventListener('visibilitychange', ...) // Đúng! ★
```

---

## §3. Ứng Dụng Thực Tế!

```javascript
// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 1: Dừng/tiếp tục Video khi chuyển tab!
// ═══════════════════════════════════════════════════════════

function setupVideoAutoPlayPause(videoElement) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      videoElement.pause(); // ★ Rời tab → DỪNG video!
    } else {
      videoElement.play(); // ★ Quay lại → CHẠY tiếp!
    }
  });
}

// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 2: Kiểm tra version — tự viết KHÔNG dùng thư viện!
// ★ Tắt timer khi rời tab → tiết kiệm tài nguyên!
// ═══════════════════════════════════════════════════════════

function createVersionChecker() {
  const CHECK_INTERVAL = 30000; // 30 giây!
  const DEBOUNCE_DELAY = 10000; // Chống switch quá nhanh!
  let intervalId = null;
  let debounceTimer = null;
  let popupShown = false;

  function checkVersion() {
    // Fetch version từ server → so sánh!
    fetch("/version.json?t=" + Date.now())
      .then((res) => res.json())
      .then((data) => {
        const currentVersion = document.querySelector(
          'meta[name="app-version"]',
        )?.content;
        if (data.version !== currentVersion && !popupShown) {
          popupShown = true;
          // Hiện thông báo "Có bản mới, vui lòng refresh!"
          if (confirm("Có phiên bản mới! Refresh trang?")) {
            window.location.reload();
          }
        }
      })
      .catch(() => {}); // Bỏ qua lỗi mạng!
  }

  function startInterval() {
    if (intervalId) return; // Đã có timer rồi!
    intervalId = setInterval(checkVersion, CHECK_INTERVAL);
  }

  function stopInterval() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // ★ TỰ VIẾT DEBOUNCE — không dùng lodash!
  function debouncedStart() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      startInterval();
      checkVersion(); // Check ngay lập tức khi quay lại!
    }, DEBOUNCE_DELAY);
  }

  function handleVisibilityChange() {
    if (popupShown) return;

    if (document.hidden) {
      // ★ RỜI TAB: Dừng timer → tiết kiệm CPU/network!
      stopInterval();
      clearTimeout(debounceTimer);
    } else {
      // ★ QUAY LẠI: Debounce 10s → tránh switch nhanh!
      debouncedStart();
    }
  }

  // Khởi động!
  document.addEventListener("visibilitychange", handleVisibilityChange);
  startInterval(); // Bắt đầu check ngay!

  // Cleanup function!
  return function cleanup() {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    stopInterval();
    clearTimeout(debounceTimer);
  };
}

// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 3: Online Exam — chống gian lận! ★
// ═══════════════════════════════════════════════════════════

function createExamMonitor() {
  let leaveCount = 0;
  const MAX_LEAVES = 3;
  const leaveLog = [];

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      leaveCount++;
      leaveLog.push({
        action: "left",
        time: new Date().toISOString(),
        count: leaveCount,
      });

      // ★ Ghi log lên server!
      fetch("/api/exam/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "tab_leave",
          count: leaveCount,
          timestamp: Date.now(),
        }),
      });

      if (leaveCount >= MAX_LEAVES) {
        alert("Bạn đã rời trang quá nhiều lần! Bài thi sẽ bị nộp!");
        // Auto submit exam!
      } else {
        alert(`Cảnh báo! Bạn đã rời trang ${leaveCount}/${MAX_LEAVES} lần!`);
      }
    } else {
      leaveLog.push({
        action: "returned",
        time: new Date().toISOString(),
      });
    }
  });

  return { getLog: () => leaveLog, getCount: () => leaveCount };
}

// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 4: Analytics — đo thời gian user ở trang!
// ═══════════════════════════════════════════════════════════

function createTimeTracker() {
  let startTime = Date.now();
  let totalVisibleTime = 0;
  let isVisible = !document.hidden;

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      // ★ Rời tab: cộng thời gian đã ở!
      if (isVisible) {
        totalVisibleTime += Date.now() - startTime;
      }
      isVisible = false;
    } else {
      // ★ Quay lại: reset startTime!
      startTime = Date.now();
      isVisible = true;
    }
  });

  // Gửi data khi đóng trang!
  window.addEventListener("beforeunload", function () {
    if (isVisible) {
      totalVisibleTime += Date.now() - startTime;
    }
    // sendBeacon vẫn gửi được khi page unload! ★
    navigator.sendBeacon(
      "/api/analytics",
      JSON.stringify({ visibleTime: totalVisibleTime }),
    );
  });

  return {
    getVisibleTime: () => {
      let current = totalVisibleTime;
      if (isVisible) current += Date.now() - startTime;
      return current;
    },
  };
}

// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 5: Game — pause khi rời tab!
// ═══════════════════════════════════════════════════════════

function createGamePauseHandler(game) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      game.pause();
      game.muteAudio(); // ★ Tắt âm khi rời!
    } else {
      game.resume();
      game.unmuteAudio(); // ★ Bật âm khi quay lại!
    }
  });
}
```

---

## §4. Tự Viết usePageVisibility Hook (React!)

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: usePageVisibility — React Hook!
// ★ Không dùng thư viện! Viết từ đầu!
// ═══════════════════════════════════════════════════════════

function usePageVisibility() {
  // ★ Tự implement useState-like (đơn giản!)
  // Trong React thực tế dùng useState/useEffect!

  const [isVisible, setIsVisible] = React.useState(
    !document.hidden, // Khởi tạo từ trạng thái hiện tại!
  );

  React.useEffect(function () {
    function handleVisibilityChange() {
      setIsVisible(!document.hidden);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ★ CLEANUP! Quan trọng! Tránh memory leak!
    return function () {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // [] = chỉ mount/unmount!

  return isVisible;
}

// SỬ DỤNG:
// function MyComponent() {
//   const isVisible = usePageVisibility();
//   useEffect(() => {
//     if (isVisible) { startPolling(); }
//     else { stopPolling(); }
//   }, [isVisible]);
// }

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: usePageVisibility NÂNG CAO — với callback!
// ═══════════════════════════════════════════════════════════

function usePageVisibilityCallback(onVisible, onHidden) {
  React.useEffect(
    function () {
      function handler() {
        if (document.hidden) {
          if (typeof onHidden === "function") onHidden();
        } else {
          if (typeof onVisible === "function") onVisible();
        }
      }

      document.addEventListener("visibilitychange", handler);
      return function () {
        document.removeEventListener("visibilitychange", handler);
      };
    },
    [onVisible, onHidden],
  );
}

// SỬ DỤNG:
// usePageVisibilityCallback(
//   () => console.log('Tab active!'),
//   () => console.log('Tab hidden!')
// );

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: useInterval tự dừng khi tab hidden!
// ═══════════════════════════════════════════════════════════

function useSmartInterval(callback, delay) {
  const savedCallback = React.useRef(callback);
  const intervalRef = React.useRef(null);

  // Luôn giữ callback mới nhất!
  React.useEffect(function () {
    savedCallback.current = callback;
  });

  React.useEffect(
    function () {
      function startInterval() {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(function () {
          savedCallback.current();
        }, delay);
      }

      function stopInterval() {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      function handleVisibility() {
        if (document.hidden) {
          stopInterval(); // ★ Tab ẩn → DỪNG timer!
        } else {
          startInterval(); // ★ Tab hiện → CHẠY lại!
        }
      }

      // Khởi động!
      if (!document.hidden) startInterval();

      document.addEventListener("visibilitychange", handleVisibility);

      return function () {
        stopInterval();
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    },
    [delay],
  );
}

// SỬ DỤNG:
// useSmartInterval(() => checkNewMessages(), 5000);
// → Tự dừng khi user rời tab! Tiết kiệm tài nguyên! ★
```

---

## §5. Compatibility & Lưu Ý!

```
  COMPATIBILITY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  BROWSER SUPPORT:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Chrome 33+  → visibilitychange (không prefix!) ★     │    │
  │  │ Chrome < 33 → webkitvisibilitychange (có prefix!)    │    │
  │  │ Firefox 18+ → ✅                                      │    │
  │  │ Safari 14+  → ✅ (trên document!)                     │    │
  │  │ Safari < 14 → ❌ trên window! ✅ trên document!      │    │
  │  │ Edge        → ✅                                      │    │
  │  │ IE 10+      → msvisibilitychange (ms prefix!)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LƯU Ý QUAN TRỌNG:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ WeChat built-in browser: KHÔNG trigger!            │    │
  │  │    → Lý do: Không có tabs! ★                          │    │
  │  │                                                      │    │
  │  │ ❌ Mobile bấm Home: KHÔNG phải lúc nào cũng trigger! │    │
  │  │    → Phụ thuộc OS và browser!                        │    │
  │  │                                                      │    │
  │  │ ❌ PC mất focus (alt+tab APP khác):                   │    │
  │  │    → KHÔNG trigger nếu browser vẫn HIỆN!             │    │
  │  │    → CHỈ trigger khi MINIMIZE hoặc chuyển TAB! ★     │    │
  │  │                                                      │    │
  │  │ ★ LUÔN listen trên DOCUMENT, không phải window!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Cross-browser compatibility handler!
// ═══════════════════════════════════════════════════════════

function addVisibilityChangeListener(callback) {
  let hiddenProp, eventName;

  if (typeof document.hidden !== "undefined") {
    // ★ Standard! (Chrome 33+, Firefox, Safari 14+!)
    hiddenProp = "hidden";
    eventName = "visibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    // ★ Chrome < 33! (webkit prefix!)
    hiddenProp = "webkitHidden";
    eventName = "webkitvisibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    // ★ IE 10+! (ms prefix!)
    hiddenProp = "msHidden";
    eventName = "msvisibilitychange";
  } else if (typeof document.mozHidden !== "undefined") {
    // ★ Old Firefox! (moz prefix!)
    hiddenProp = "mozHidden";
    eventName = "mozvisibilitychange";
  }

  if (!eventName) {
    console.warn("Page Visibility API không được hỗ trợ!");
    return function () {}; // Cleanup rỗng!
  }

  function handler() {
    callback({
      isHidden: document[hiddenProp],
      visibilityState:
        document.visibilityState ||
        (document[hiddenProp] ? "hidden" : "visible"),
    });
  }

  document.addEventListener(eventName, handler, false);

  // ★ Trả về cleanup function!
  return function cleanup() {
    document.removeEventListener(eventName, handler, false);
  };
}

// SỬ DỤNG:
// const cleanup = addVisibilityChangeListener(({ isHidden }) => {
//   if (isHidden) { stopPolling(); }
//   else { startPolling(); }
// });
// → Khi không cần: cleanup();
```

---

## §6. So Sánh Các Event Liên Quan!

```
  SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬─────────┬─────────┬─────────────┐    │
  │  │ EVENT            │ Tab     │ Close   │ Mất focus   │    │
  │  │                  │ switch  │ tab     │ (alt+tab)   │    │
  │  ├──────────────────┼─────────┼─────────┼─────────────┤    │
  │  │ visibilitychange │ ✅ ★    │ ✅      │ ❌          │    │
  │  │ blur             │ ✅      │ ✅      │ ✅ ★        │    │
  │  │ focus            │ ✅      │ ❌      │ ✅ ★        │    │
  │  │ beforeunload     │ ❌      │ ✅ ★    │ ❌          │    │
  │  │ unload           │ ❌      │ ✅      │ ❌          │    │
  │  │ pagehide         │ ❌      │ ✅ ★    │ ❌          │    │
  │  └──────────────────┴─────────┴─────────┴─────────────┘    │
  │                                                              │
  │  ★ visibilitychange: tốt nhất cho TAB SWITCH! ★             │
  │  ★ blur/focus: tốt nhất cho FOCUS detection!                 │
  │  ★ beforeunload/pagehide: tốt nhất cho CLOSE/NAVIGATE!     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: visibilitychange dùng để làm gì?                          │
  │  → Phát hiện khi user rời/quay lại tab!                     │
  │  → Dừng timer/video/audio khi rời → tiết kiệm tài nguyên!│
  │  → Chống gian lận thi online, tracking thời gian!            │
  │                                                              │
  │  ❓ 2: document.hidden vs document.visibilityState?               │
  │  → hidden: boolean (true/false)!                              │
  │  → visibilityState: string (visible/hidden/prerender)!       │
  │  → visibilityState chi tiết hơn!                              │
  │                                                              │
  │  ❓ 3: Tại sao listen trên document, không phải window?          │
  │  → Safari < 14 KHÔNG hỗ trợ trên window! ★                  │
  │  → document là cách CHUẨN và tương thích nhất!              │
  │                                                              │
  │  ❓ 4: visibilitychange vs blur/focus?                            │
  │  → visibilitychange: TAB switch, minimize!                    │
  │  → blur/focus: MẤT/LẤY focus (alt+tab app khác!)           │
  │  → visibilitychange KHÔNG trigger khi mất focus! ★           │
  │                                                              │
  │  ❓ 5: Trường hợp nào KHÔNG trigger?                             │
  │  → WeChat built-in browser (không có tabs!)                  │
  │  → Mobile bấm Home (phụ thuộc device!)                      │
  │  → PC alt+tab sang app khác (chỉ mất focus!)               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
