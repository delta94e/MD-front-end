# Edge Runtime — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/edge
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. Edge Runtime Là Gì?

```
  Edge Runtime — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Next.js có 2 server runtimes! ★★★                      │
  │  → Node.js Runtime (default): full Node.js APIs! ★        │
  │  → Edge Runtime: limited APIs, dùng cho Proxy! ★★★       │
  │                                                              │
  │  2 RUNTIMES:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ┌───────────────┬──────────────────────────────┐     │    │
  │  │  │ Feature       │ Node.js       │ Edge         │     │    │
  │  │  ├───────────────┼──────────────┼───────────────┤     │    │
  │  │  │ Default       │ ✅ YES        │ ❌ NO         │     │    │
  │  │  │ Node.js APIs  │ ✅ ALL        │ ❌ LIMITED    │     │    │
  │  │  │ fs / path     │ ✅ YES        │ ❌ NO         │     │    │
  │  │  │ fetch         │ ✅ YES        │ ✅ YES        │     │    │
  │  │  │ Streams       │ ✅ YES        │ ✅ YES        │     │    │
  │  │  │ Crypto        │ ✅ YES        │ ✅ Web Crypto │     │    │
  │  │  │ ISR           │ ✅ YES        │ ❌ NO ★★★    │     │    │
  │  │  │ eval()        │ ✅ YES        │ ❌ NO ★★★    │     │    │
  │  │  │ require()     │ ✅ YES        │ ❌ NO (ESM!)  │     │    │
  │  │  │ Startup       │ 🐌 Slower     │ ⚡ Faster ★★★│     │    │
  │  │  │ Location      │ 🏢 Region     │ 🌍 Edge ★★★ │     │    │
  │  │  └───────────────┴──────────────┴───────────────┘     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CAVEATS:                                                     │
  │  → KHÔNG support tất cả Node.js APIs! ★★★                │
  │  → KHÔNG support ISR! ★★★                                 │
  │  → Một số packages KHÔNG hoạt động! ★                     │
  │  → Cả 2 runtime đều support streaming! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Supported APIs!

```
  SUPPORTED APIs:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NETWORK APIs:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  fetch, Request, Response, Headers ★★★                │    │
  │  │  Blob, File, FormData ★                                │    │
  │  │  URLSearchParams, WebSocket ★                          │    │
  │  │  FetchEvent ★                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ENCODING APIs:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  atob, btoa ★                                          │    │
  │  │  TextEncoder, TextDecoder ★★★                          │    │
  │  │  TextEncoderStream, TextDecoderStream ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  STREAM APIs:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ReadableStream ★★★                                    │    │
  │  │  WritableStream ★                                      │    │
  │  │  TransformStream ★                                     │    │
  │  │  ReadableStreamDefaultReader ★                         │    │
  │  │  ReadableStreamBYOBReader ★                            │    │
  │  │  WritableStreamDefaultWriter ★                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CRYPTO APIs:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  crypto (Web Crypto API) ★★★                           │    │
  │  │  CryptoKey ★                                           │    │
  │  │  SubtleCrypto ★                                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WEB STANDARD APIs:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  AbortController, URL, URLPattern, URLSearchParams ★  │    │
  │  │  setTimeout, setInterval, queueMicrotask ★            │    │
  │  │  structuredClone ★                                     │    │
  │  │  Promise, Proxy, Reflect, Symbol ★                    │    │
  │  │  Map, Set, WeakMap, WeakSet ★                         │    │
  │  │  JSON, Math, Date, RegExp, console ★                  │    │
  │  │  Array, ArrayBuffer, TypedArrays ★                    │    │
  │  │  WebAssembly (object only, no compile!) ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NEXT.JS POLYFILLS:                                           │
  │  → AsyncLocalStorage (from Node.js) ★★★                  │
  │                                                              │
  │  ENV VARS:                                                    │
  │  → process.env works! (dev + build) ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Unsupported + unstable_allowDynamic!

```
  UNSUPPORTED:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❌ KHÔNG HỖ TRỢ:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Native Node.js APIs (fs, path, child_process)      │    │
  │  │  → require() → phải dùng ES Modules! ★★★             │    │
  │  │  → eval() ★★★                                         │    │
  │  │  → new Function(evalString) ★★★                       │    │
  │  │  → WebAssembly.compile ★                               │    │
  │  │  → WebAssembly.instantiate ★                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  node_modules:                                                │
  │  → CÓ THỂ dùng nếu implement ES Modules! ★★★            │
  │  → KHÔNG dùng native Node.js APIs! ★★★                   │
  │                                                              │
  │  unstable_allowDynamic:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Cho phép dynamic code evaluation cho files cụ thể  │    │
  │  │  export const config = {                               │    │
  │  │    unstable_allowDynamic: [                             │    │
  │  │      '/lib/utilities.js',  ★★★                        │    │
  │  │      '**/node_modules/function-bind/**' ★ (glob!)     │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  ⚠️ WARN: nếu thực sự chạy eval() →                    │    │
  │  │     RUNTIME ERROR! ★★★                                │    │
  │  │  → Chỉ dùng khi code KHÔNG thực sự execute! ★        │    │
  │  │  → Tree shaking cannot remove it! ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — EdgeRuntimeEngine!

```javascript
var EdgeRuntimeEngine = (function () {
  // ═══════════════════════════════════
  // 1. SUPPORTED APIS REGISTRY
  // ═══════════════════════════════════
  var SUPPORTED = {
    network: [
      "fetch",
      "Request",
      "Response",
      "Headers",
      "Blob",
      "File",
      "FormData",
      "URLSearchParams",
      "WebSocket",
      "FetchEvent",
    ],
    encoding: [
      "atob",
      "btoa",
      "TextEncoder",
      "TextDecoder",
      "TextEncoderStream",
      "TextDecoderStream",
    ],
    stream: [
      "ReadableStream",
      "WritableStream",
      "TransformStream",
      "ReadableStreamDefaultReader",
      "WritableStreamDefaultWriter",
    ],
    crypto: ["crypto", "CryptoKey", "SubtleCrypto"],
    polyfills: ["AsyncLocalStorage"],
  };

  var UNSUPPORTED = [
    "eval",
    "new Function()",
    "require",
    "fs",
    "path",
    "child_process",
    "WebAssembly.compile",
    "WebAssembly.instantiate",
  ];

  // ═══════════════════════════════════
  // 2. API CHECKER
  // ═══════════════════════════════════
  function checkAPI(apiName) {
    for (var category in SUPPORTED) {
      if (SUPPORTED[category].indexOf(apiName) >= 0) {
        return {
          api: apiName,
          supported: true,
          category: category,
          note: "✅ Available in Edge Runtime ★★★",
        };
      }
    }
    if (UNSUPPORTED.indexOf(apiName) >= 0) {
      return {
        api: apiName,
        supported: false,
        note: "❌ NOT available in Edge Runtime! ★★★",
      };
    }
    return {
      api: apiName,
      supported: null,
      note: "⚠️ Check Web Standard APIs ★",
    };
  }

  // ═══════════════════════════════════
  // 3. RUNTIME SELECTOR
  // ═══════════════════════════════════
  function selectRuntime(requirements) {
    var needsNodeAPIs = false;
    var needsISR = false;

    for (var i = 0; i < requirements.length; i++) {
      var req = requirements[i];
      if (UNSUPPORTED.indexOf(req) >= 0) needsNodeAPIs = true;
      if (req === "ISR") needsISR = true;
    }

    if (needsNodeAPIs || needsISR) {
      return {
        runtime: "nodejs",
        reason: needsISR
          ? "ISR requires Node.js Runtime ★★★"
          : "Native Node.js APIs required ★★★",
      };
    }

    return {
      runtime: "edge",
      reason: "All APIs supported! Faster startup! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. ALLOW DYNAMIC CHECKER
  // ═══════════════════════════════════
  function checkAllowDynamic(filePath, allowList) {
    for (var i = 0; i < allowList.length; i++) {
      var pattern = allowList[i];
      if (filePath === pattern)
        return { allowed: true, note: "✅ Exact match ★" };
      if (pattern.indexOf("**") >= 0) {
        var suffix = pattern.replace(/\*\*/g, "");
        if (filePath.indexOf(suffix.replace(/\*/g, "")) >= 0) {
          return { allowed: true, note: "✅ Glob match ★" };
        }
      }
    }
    return { allowed: false, note: "❌ Dynamic code NOT allowed! ★★★" };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ EdgeRuntime Engine ═══");

    console.log("\n── 1. Check APIs ──");
    console.log(checkAPI("fetch"));
    console.log(checkAPI("fs"));
    console.log(checkAPI("crypto"));
    console.log(checkAPI("eval"));

    console.log("\n── 2. Select Runtime ──");
    console.log(selectRuntime(["fetch", "Response", "crypto"]));
    console.log(selectRuntime(["fetch", "fs"]));
    console.log(selectRuntime(["fetch", "ISR"]));

    console.log("\n── 3. Allow Dynamic ──");
    var allowList = ["/lib/utilities.js", "**/node_modules/function-bind/**"];
    console.log(checkAllowDynamic("/lib/utilities.js", allowList));
    console.log(
      checkAllowDynamic("/node_modules/function-bind/index.js", allowList),
    );
    console.log(checkAllowDynamic("/src/evil.js", allowList));
  }

  return { demo: demo };
})();
// Chạy: EdgeRuntimeEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Node.js Runtime vs Edge Runtime?                        │
  │  → Node.js: full APIs, ISR, eval, require! ★              │
  │  → Edge: limited Web APIs, nhanh hơn, global! ★★★        │
  │  → Edge KHÔNG hỗ trợ: fs, path, ISR, eval! ★★★          │
  │                                                              │
  │  ❓ 2: Edge Runtime dùng khi nào?                              │
  │  → Proxy (middleware-like)! ★★★                           │
  │  → Cần low latency, global deploy! ★★★                   │
  │  → Chỉ dùng Web Standard APIs! ★                         │
  │                                                              │
  │  ❓ 3: unstable_allowDynamic?                                  │
  │  → Cho phép files có dynamic code (eval) ★★★              │
  │  → Glob patterns! ★                                       │
  │  → ⚠️ Nếu thực sự execute → Runtime Error! ★★★            │
  │  → Chỉ dùng khi tree shaking không remove được! ★       │
  │                                                              │
  │  ❓ 4: node_modules trên Edge?                                 │
  │  → CÓ THỂ dùng nếu implement ES Modules! ★★★            │
  │  → KHÔNG dùng native Node.js APIs! ★                     │
  │  → require() → ❌! import → ✅! ★★★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
