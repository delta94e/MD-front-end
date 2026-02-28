# Error Handling & Try/Catch — Deep Dive!

> **Xử lý lỗi thực chiến: Business vs System Exception!**
> try/catch giới hạn, fetch pitfall, safeParse, error reporting!

---

## §1. try/catch Bắt Được Gì?

```
  try/catch — GIỚI HẠN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ✅ BẮT ĐƯỢC: Lỗi trong CODE ĐỒNG BỘ!                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ try {                                                  │    │
  │  │   JSON.parse('{ invalid }'); // SyntaxError! ★        │    │
  │  │   null.prop;                 // TypeError! ★           │    │
  │  │   undeclaredVar;             // ReferenceError! ★      │    │
  │  │   throw new Error('manual'); // Custom Error! ★        │    │
  │  │ } catch (e) {                                          │    │
  │  │   // ★ TẤT CẢ đều bắt được! ✅                       │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❌ KHÔNG BẮT ĐƯỢC: Lỗi trong ASYNC CALLBACK!                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ try {                                                  │    │
  │  │   setTimeout(() => {                                   │    │
  │  │     throw new Error('async!'); // ❌ KHÔNG BẮT ĐƯỢC! │    │
  │  │   }, 0);                                               │    │
  │  │ } catch (e) {                                          │    │
  │  │   // ❌ KHÔNG BAO GIỜ chạy đến đây!                  │    │
  │  │ }                                                      │    │
  │  │                                                      │    │
  │  │ TẠI SAO?                                                │    │
  │  │ → setTimeout callback chạy ở EVENT LOOP SAU! ★        │    │
  │  │ → Lúc đó try/catch ĐÃ KẾT THÚC rồi! ❌             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ✅ BẮT ĐƯỢC ASYNC: Dùng async/await!                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ try {                                                  │    │
  │  │   var data = await fetch('/api'); // ★ await!          │    │
  │  │   var json = await data.json();   // ★ await!          │    │
  │  │ } catch (e) {                                          │    │
  │  │   // ★ BẮT ĐƯỢC! (vì await unwrap Promise!) ✅       │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TỔNG KẾT:                                                      │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Loại lỗi        │ try/catch bắt được?             │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Synchronous       │ ✅ CÓ!                          │    │
  │  │ await Promise     │ ✅ CÓ! ★                        │    │
  │  │ setTimeout/setInt │ ❌ KHÔNG! (event loop khác!)    │    │
  │  │ Promise (no await)│ ❌ KHÔNG! (dùng .catch()!)      │    │
  │  │ Event listener    │ ❌ KHÔNG! (wrap riêng!)          │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. fetch — Bẫy Lớn Nhất!

```
  FETCH PITFALL:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★★★ HTTP 4xx/5xx KHÔNG phải exception! ★★★                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  fetch('/api/users')                                   │    │
  │  │       │                                                │    │
  │  │  ┌────┴──────────────────────────────────┐             │    │
  │  │  │ Response status:                       │             │    │
  │  │  │                                       │             │    │
  │  │  │ 200 OK       → res.ok = true ✅       │             │    │
  │  │  │ 404 Not Found → res.ok = false ⚠️     │             │    │
  │  │  │ 500 Server   → res.ok = false ⚠️     │             │    │
  │  │  │                                       │             │    │
  │  │  │ ★ TẤT CẢ đều RESOLVE! Không throw! ★│             │    │
  │  │  │ ★ catch KHÔNG bắt được 404/500! ❌    │             │    │
  │  │  └───────────────────────────────────────┘             │    │
  │  │                                                      │    │
  │  │  fetch CHỈ throw khi:                                   │    │
  │  │  → Network failure (mất mạng!) ★                      │    │
  │  │  → CORS blocked! ★                                     │    │
  │  │  → DNS resolve failed!                                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// ❌ SAI: Không check res.ok!
// ═══════════════════════════════════════════════════════════

// try {
//   var res = await fetch('/api/users');
//   var data = await res.json(); // ★ 404 vẫn chạy đến đây!
//   return data; // ★ data có thể là error HTML! ❌
// } catch (e) {
//   // ★ CHỈ bắt network error! 404/500 KHÔNG vào đây! ❌
// }

// ═══════════════════════════════════════════════════════════
// ✅ ĐÚNG: Check res.ok + phân loại lỗi! ★
// ═══════════════════════════════════════════════════════════

function fetchWithErrorHandling(url, options) {
  return fetch(url, options)
    .then(function (res) {
      if (!res.ok) {
        // ★ HTTP error (4xx/5xx) → throw thủ công! ★
        var error = new Error("HTTP " + res.status + ": " + res.statusText);
        error.status = res.status;
        error.response = res;
        throw error;
      }
      return res;
    })
    .catch(function (e) {
      // ★ Phân loại lỗi!
      if (e.name === "TypeError") {
        // ★ Network error / CORS!
        console.error("Lỗi mạng! Kiểm tra kết nối.");
      } else if (e.status >= 400 && e.status < 500) {
        // ★ Client error (4xx)!
        console.error("Lỗi request:", e.message);
      } else if (e.status >= 500) {
        // ★ Server error (5xx)!
        console.error("Lỗi server:", e.message);
      }
      throw e; // ★ Re-throw để caller biết!
    });
}
```

---

## §3. JSON Parse — safeParse!

```javascript
// ═══════════════════════════════════════════════════════════
// VẤN ĐỀ: JSON.parse THROW nếu format sai!
// ═══════════════════════════════════════════════════════════

// JSON.parse('not json');      // → SyntaxError! ❌ CRASH!
// JSON.parse(undefined);       // → SyntaxError! ❌ CRASH!
// JSON.parse('');               // → SyntaxError! ❌ CRASH!
// JSON.parse('"just string"'); // → "just string" ✅ OK!
// JSON.parse('null');           // → null ✅ OK!

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: safeParse — KHÔNG BAO GIỜ crash!
// ═══════════════════════════════════════════════════════════

function safeParse(str, fallback) {
  if (fallback === undefined) fallback = null;

  // ★ Không phải string → return fallback!
  if (typeof str !== "string") {
    console.warn("[safeParse] Input không phải string:", typeof str);
    return fallback;
  }

  // ★ String rỗng → return fallback!
  if (str.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(str);
  } catch (e) {
    // ★ Log để debug nhưng KHÔNG crash! ★
    console.warn(
      "[safeParse] Parse thất bại:",
      e.message,
      "| Input (50 chars):",
      str.slice(0, 50),
    );
    return fallback; // ★ Return fallback thay vì crash!
  }
}

// SỬ DỤNG:
// safeParse('{"a":1}')         → { a: 1 } ✅
// safeParse('invalid json')    → null ✅ (không crash!)
// safeParse('', [])            → [] ✅
// safeParse(undefined, {})     → {} ✅

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: safeStringify — xử lý circular reference!
// ═══════════════════════════════════════════════════════════

function safeStringify(obj, fallback) {
  if (fallback === undefined) fallback = "{}";

  try {
    return JSON.stringify(obj);
  } catch (e) {
    // ★ Circular reference → TypeError!
    console.warn("[safeStringify] Stringify thất bại:", e.message);
    return fallback;
  }
}
```

---

## §4. Business vs System Exception!

```
  PHÂN LOẠI LỖI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌───────────────────┬───────────────────────────────────┐  │
  │  │                   │ Business Exception ★              │  │
  │  │ Loại             │ (Lỗi nghiệp vụ — DỰ KIẾN!)      │  │
  │  ├───────────────────┼───────────────────────────────────┤  │
  │  │ Ví dụ            │ Số dư không đủ!                  │  │
  │  │                   │ Chưa đăng nhập!                  │  │
  │  │                   │ Tham số không hợp lệ!            │  │
  │  │                   │ Không có quyền!                   │  │
  │  │ Backend trả     │ HTTP 200 + code: "BALANCE_LOW"    │  │
  │  │ Hiển thị        │ Message CỤ THỂ cho user! ★        │  │
  │  │ Xử lý          │ Redirect, retry, show form! ★      │  │
  │  └───────────────────┴───────────────────────────────────┘  │
  │                                                              │
  │  ┌───────────────────┬───────────────────────────────────┐  │
  │  │                   │ System Exception ❌               │  │
  │  │ Loại             │ (Lỗi hệ thống — BẤT NGỜ!)       │  │
  │  ├───────────────────┼───────────────────────────────────┤  │
  │  │ Ví dụ            │ Mất mạng!                         │  │
  │  │                   │ Server 500!                       │  │
  │  │                   │ JSON parse fail!                   │  │
  │  │                   │ Runtime error (bug!)               │  │
  │  │ Hiển thị        │ "Lỗi hệ thống, thử lại sau!" ★  │  │
  │  │ Xử lý          │ Report + log + generic message! ★ │  │
  │  │ KHÔNG             │ hiển thị chi tiết lỗi cho user! │  │
  │  └───────────────────┴───────────────────────────────────┘  │
  │                                                              │
  │  FLOW:                                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  API Response                                          │    │
  │  │       │                                                │    │
  │  │  res.ok? ──NO──→ res.status?                          │    │
  │  │   │              ├─ 401 → "Vui lòng đăng nhập!" ★   │    │
  │  │   │              ├─ 403 → "Không có quyền!"          │    │
  │  │   │              ├─ 404 → "Không tìm thấy!"          │    │
  │  │   │              └─ 500 → "Lỗi server!" (report!) ★ │    │
  │  │   │                                                  │    │
  │  │   YES → parse body → check business code!             │    │
  │  │              ├─ code: SUCCESS → return data! ✅        │    │
  │  │              ├─ code: BALANCE_LOW → "Nạp thêm!" ★   │    │
  │  │              └─ code: UNKNOWN → "Lỗi hệ thống!"    │    │
  │  │                                                      │    │
  │  │  catch (network error!) → "Kiểm tra mạng!" ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: API Caller với phân loại lỗi đầy đủ!
// ═══════════════════════════════════════════════════════════

function apiCall(url, options) {
  return fetch(url, options)
    .then(function (res) {
      return res.text().then(function (text) {
        var data = safeParse(text, null);

        // ★ HTTP error!
        if (!res.ok) {
          return handleHttpError(res.status, data);
        }

        // ★ Business error! (HTTP 200 nhưng code !== SUCCESS!)
        if (data && data.code && data.code !== "SUCCESS") {
          return handleBusinessError(data);
        }

        // ★ Success!
        return { success: true, data: data };
      });
    })
    .catch(function (e) {
      // ★ System error! (network, parse, etc!)
      return handleSystemError(e);
    });
}

function handleHttpError(status, data) {
  if (status === 401) {
    return { success: false, type: "auth", message: "Vui lòng đăng nhập!" };
  }
  if (status === 403) {
    return { success: false, type: "auth", message: "Bạn không có quyền!" };
  }
  if (status === 404) {
    return { success: false, type: "business", message: "Không tìm thấy!" };
  }
  // 5xx!
  reportError({ type: "http", status: status, data: data });
  return {
    success: false,
    type: "system",
    message: "Lỗi server, thử lại sau!",
  };
}

function handleBusinessError(data) {
  // ★ Business error → message CỤ THỂ!
  var messages = {
    BALANCE_INSUFFICIENT: "Số dư không đủ, vui lòng nạp thêm!",
    UNAUTHORIZED: "Vui lòng đăng nhập!",
    INVALID_PARAMS: "Thông tin không hợp lệ!",
    RATE_LIMITED: "Thao tác quá nhanh, thử lại sau!",
  };

  return {
    success: false,
    type: "business",
    code: data.code,
    message: messages[data.code] || data.message || "Có lỗi xảy ra!",
  };
}

function handleSystemError(e) {
  reportError(e); // ★ Gửi lên monitoring! ★

  if (e.name === "TypeError") {
    return {
      success: false,
      type: "system",
      message: "Lỗi mạng, kiểm tra kết nối!",
    };
  }
  return {
    success: false,
    type: "system",
    message: "Lỗi hệ thống, thử lại sau!",
  };
}

// ★ Error reporter (gửi lên Sentry/custom endpoint!)
function reportError(error) {
  var payload = {
    message: error.message || String(error),
    stack: error.stack || "",
    url: typeof location !== "undefined" ? location.href : "",
    timestamp: Date.now(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  // ★ sendBeacon → gửi được khi page close!
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/error/report", JSON.stringify(payload));
  }
}
```

---

## §5. Global Error Handler!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Global Error Handlers — bắt lỗi TOÀN CỤC!
// ★ Lưới an toàn cuối cùng!
// ═══════════════════════════════════════════════════════════

// ① window.onerror — bắt runtime error!
window.onerror = function (message, source, line, col, error) {
  reportError({
    type: "runtime",
    message: message,
    source: source,
    line: line,
    col: col,
    stack: error ? error.stack : "",
  });
  // ★ return true → KHÔNG hiện error trong console!
  // ★ return false → VẪN hiện error trong console!
  return false;
};

// ② unhandledrejection — bắt Promise KHÔNG có .catch()! ★
window.addEventListener("unhandledrejection", function (event) {
  reportError({
    type: "unhandled_promise",
    message: event.reason
      ? event.reason.message || String(event.reason)
      : "Unknown",
    stack: event.reason ? event.reason.stack || "" : "",
  });
  event.preventDefault(); // ★ Ngăn log mặc định!
});

// ③ Resource load error (img, script, css fail!)
window.addEventListener(
  "error",
  function (event) {
    if (event.target && event.target !== window) {
      // ★ Resource error (không phải JS error!)
      reportError({
        type: "resource",
        tag: event.target.tagName,
        src: event.target.src || event.target.href || "",
      });
    }
  },
  true,
); // ★ true = capture phase! (quan trọng!) ★
```

---

## §6. Checklist — Dùng Ở Đâu!

```
  CHECKLIST:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ✅ NÊN DÙNG try/catch:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ JSON.parse / res.json() → safeParse!               │    │
  │  │ ★ Third-party lib có thể throw (date parse, calc!)  │    │
  │  │ ★ Parameter validation + data conversion!             │    │
  │  │ ★ await fetch / await async function!                 │    │
  │  │ ★ File operations (FileReader, etc!)                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❌ KHÔNG NÊN KỲ VỌNG try/catch:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ setTimeout/setInterval callback! ★                 │    │
  │  │ ❌ Event listener callback (wrap RIÊNG!)              │    │
  │  │ ❌ Promise không await (dùng .catch()!)               │    │
  │  │ ❌ Global error (dùng window.onerror!) ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TỔNG KẾT:                                                      │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Loại lỗi        │ Cách xử lý                     │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Ajax (network)    │ try/catch + res.ok! ★            │    │
  │  │ JSON parse        │ safeParse (wrap try/catch!) ★    │    │
  │  │ Business error    │ Check code → message cụ thể! ★ │    │
  │  │ System error      │ catch → report + generic msg! ★ │    │
  │  │ Async (no await)  │ Promise .catch()!                │    │
  │  │ Global fallback   │ window.onerror +                 │    │
  │  │                  │ unhandledrejection! ★             │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: try/catch bắt được lỗi trong setTimeout không?           │
  │  → KHÔNG! ❌ Callback chạy ở event loop SAU! ★              │
  │  → try/catch đã kết thúc khi callback chạy!                 │
  │  → Giải pháp: wrap try/catch BÊN TRONG callback! ★         │
  │                                                              │
  │  ❓ 2: fetch trả 404 có vào catch không?                         │
  │  → KHÔNG! ❌ fetch chỉ reject khi NETWORK FAIL! ★           │
  │  → 404/500 vẫn resolve bình thường!                          │
  │  → Phải check res.ok hoặc res.status! ★                     │
  │                                                              │
  │  ❓ 3: Business error vs System error?                           │
  │  → Business: DỰ KIẾN! (balance low, unauthorized!) ★        │
  │  → → Hiển thị message CỤ THỂ cho user!                     │
  │  → System: BẤT NGỜ! (network, 500, parse fail!) ★          │
  │  → → Report + hiển thị generic message!                      │
  │                                                              │
  │  ❓ 4: unhandledrejection là gì?                                 │
  │  → Promise bị reject mà KHÔNG có .catch()! ★                │
  │  → Dùng window.addEventListener để bắt!                      │
  │  → Lưới an toàn cuối cùng cho Promise errors! ★            │
  │                                                              │
  │  ❓ 5: Tại sao cần safeParse?                                    │
  │  → JSON.parse throw SyntaxError nếu format sai! ★           │
  │  → Backend có thể trả string thay vì JSON!                  │
  │  → safeParse trả fallback thay vì CRASH! ★                  │
  │  → Một nơi parse, một nơi log → dễ debug!                 │
  │                                                              │
  │  ❓ 6: window.onerror vs addEventListener('error')?              │
  │  → onerror: BẮT JS runtime errors! ★                        │
  │  → addEventListener('error', ..., true): BẮT resource        │
  │    load errors (img/script/css fail!)                         │
  │  → true = CAPTURE PHASE → bắt được resource error! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
