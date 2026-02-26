# compress — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/compress
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. compress Là Gì?

```
  compress — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Next.js dùng GZIP nén response! ★★★                     │
  │  → Cho cả rendered content + static files! ★                │
  │  → Khi dùng `next start` hoặc custom server! ★             │
  │  → Mặc định: BẬT (true)! ★                                 │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Browser request:                                      │    │
  │  │  Accept-Encoding: gzip, deflate, br ← browser hỗ trợ │    │
  │  │         ↓                                              │    │
  │  │  Next.js server:                                       │    │
  │  │  ┌─── compress: true? ───┐                             │    │
  │  │  │ YES                │ NO │                             │    │
  │  │  ↓                    ↓     │                             │    │
  │  │  GZIP response!     Raw response!                      │    │
  │  │  Content-Encoding:   (no encoding)                     │    │
  │  │  gzip ★★★                                              │    │
  │  │                                                       │    │
  │  │  SIZE:                                                 │    │
  │  │  100KB HTML → ~25KB gzipped! ★★★                      │    │
  │  │  = 75% bandwidth saved! ★★★                           │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HEADERS LIÊN QUAN:                                           │
  │  ┌──────────────────┬───────────────────────────────────┐    │
  │  │ Header             │ Mô tả                             │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ Accept-Encoding    │ Browser hỗ trợ gì? ★              │    │
  │  │                   │ (gzip, deflate, br)                │    │
  │  │ Content-Encoding   │ Server dùng gì? ★                 │    │
  │  │                   │ (gzip nếu compress: true)          │    │
  │  └──────────────────┴───────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tắt Compression!

```
  DISABLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.js                                    │    │
  │  │  module.exports = {                                   │    │
  │  │    compress: false  ← TẮT gzip! ★                    │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ KHÔNG NÊN TẮT — trừ khi:                                  │
  │  → Reverse proxy (nginx) XỬ LÝ compression! ★★★           │
  │  → Muốn dùng Brotli (br) thay vì gzip! ★                  │
  │  → CDN đã compress rồi! ★                                  │
  │                                                              │
  │  KIẾN TRÚC PHỔ BIẾN:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Browser ←→ Nginx (brotli) ←→ Next.js (compress:false)│    │
  │  │  ★★★                                                  │    │
  │  │                                                       │    │
  │  │  → Nginx dùng Brotli (nén tốt hơn gzip ~15-20%)! ★  │    │
  │  │  → Next.js tắt gzip (tránh nén 2 lần)! ★★★          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Gzip vs Brotli!

```
  SO SÁNH COMPRESSION ALGORITHMS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────┬────────────────┬────────────────────────┐   │
  │  │ Feature       │ Gzip            │ Brotli (br)            │   │
  │  ├─────────────┼────────────────┼────────────────────────┤   │
  │  │ Next.js mặc  │ ✅ CÓ! ★★★      │ ❌ KHÔNG! ★              │   │
  │  │ định          │                │                        │   │
  │  │ Tỉ lệ nén   │ ~70-80%        │ ~75-85% (tốt hơn)! ★  │   │
  │  │ Tốc độ nén  │ Nhanh hơn! ★  │ Chậm hơn! ★            │   │
  │  │ Tốc độ giải │ Nhanh! ★       │ Nhanh! ★                │   │
  │  │ Browser hỗ  │ Tất cả! ★★★   │ Hầu hết (>95%)! ★      │   │
  │  │ trợ          │                │                        │   │
  │  │ Dùng qua     │ Trực tiếp      │ Nginx/CDN! ★            │   │
  │  └─────────────┴────────────────┴────────────────────────┘   │
  │                                                              │
  │  KHI NÀO DÙNG GÌ:                                             │
  │  → Gzip: mặc định, đủ tốt cho hầu hết cases! ★           │
  │  → Brotli: production cao cấp, cần max performance! ★     │
  │  → Brotli cần proxy server (nginx, Cloudflare)! ★★★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — CompressEngine!

```javascript
var CompressEngine = (function () {
  // ═══════════════════════════════════
  // 1. GZIP SIMULATOR (simplified)
  // ═══════════════════════════════════
  function gzipCompress(input) {
    // Real gzip uses DEFLATE algorithm (LZ77 + Huffman)
    // This is a simplified frequency-based simulation
    var freq = {};
    for (var i = 0; i < input.length; i++) {
      var ch = input[i];
      freq[ch] = (freq[ch] || 0) + 1;
    }

    // Estimate compression based on character frequency
    var uniqueChars = Object.keys(freq).length;
    var totalChars = input.length;
    var entropy = 0;
    for (var key in freq) {
      var p = freq[key] / totalChars;
      entropy -= p * Math.log2(p);
    }

    // Estimated compressed size (bits / 8 = bytes)
    var compressedBits = totalChars * entropy;
    var compressedBytes = Math.ceil(compressedBits / 8);
    // Add gzip header overhead (~20 bytes)
    compressedBytes += 20;

    var ratio = Math.round((1 - compressedBytes / totalChars) * 100);

    return {
      originalSize: totalChars + " bytes",
      compressedSize: compressedBytes + " bytes",
      ratio: ratio + "% smaller! ★",
      algorithm: "gzip",
    };
  }

  // ═══════════════════════════════════
  // 2. RESPONSE SIMULATOR
  // ═══════════════════════════════════
  function simulateResponse(content, config) {
    var compress = config.compress !== false; // default true

    var requestHeaders = {
      "Accept-Encoding": "gzip, deflate, br",
    };

    var responseHeaders = {};
    var body;

    if (compress) {
      var result = gzipCompress(content);
      responseHeaders["Content-Encoding"] = "gzip";
      responseHeaders["Content-Length"] = result.compressedSize;
      body = "[gzipped content]";
      return {
        compressed: true,
        requestHeaders: requestHeaders,
        responseHeaders: responseHeaders,
        stats: result,
        note: "Next.js GZIP enabled! ★★★",
      };
    }

    responseHeaders["Content-Length"] = content.length + " bytes";
    body = content;
    return {
      compressed: false,
      requestHeaders: requestHeaders,
      responseHeaders: responseHeaders,
      bodySize: content.length + " bytes",
      note: "compress: false! Raw response! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. ARCHITECTURE DETECTOR
  // ═══════════════════════════════════
  function recommendSetup(hasProxy, proxyType) {
    if (!hasProxy) {
      return {
        compress: true,
        reason: "No proxy! Let Next.js handle gzip! ★★★",
        config: "compress: true (default)",
      };
    }

    return {
      compress: false,
      reason: proxyType + " handles compression! Disable Next.js gzip! ★★★",
      config: "compress: false",
      proxyConfig:
        proxyType === "nginx"
          ? "gzip on; gzip_types text/html application/json; # or brotli"
          : proxyType + " compression config",
      benefit: "Brotli = ~15-20% better than gzip! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Compress Engine ═══");

    var html =
      "<html><head><title>Test</title></head><body>" +
      "<h1>Hello World</h1><p>This is a test page with some content " +
      "that repeats words like test and content and page.</p>" +
      "</body></html>";

    console.log("\n── 1. With compression ──");
    console.log(simulateResponse(html, { compress: true }));

    console.log("\n── 2. Without compression ──");
    console.log(simulateResponse(html, { compress: false }));

    console.log("\n── 3. Architecture recommendation ──");
    console.log("No proxy:", recommendSetup(false, null));
    console.log("Nginx:", recommendSetup(true, "nginx"));
    console.log("Cloudflare:", recommendSetup(true, "Cloudflare"));
  }

  return { demo: demo };
})();
// Chạy: CompressEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: compress mặc định là gì?                                │
  │  → TRUE! Gzip enabled! ★★★                                 │
  │  → Nén rendered content + static files! ★                  │
  │  → Dùng với next start hoặc custom server! ★               │
  │                                                              │
  │  ❓ 2: Khi nào tắt compress?                                   │
  │  → Reverse proxy (nginx) đã xử lý compression! ★★★       │
  │  → Muốn dùng Brotli thay gzip! ★                          │
  │  → CDN đã compress! ★                                      │
  │  → ĐỪNG tắt nếu không có lý do! ★★★                      │
  │                                                              │
  │  ❓ 3: Kiểm tra compression bằng cách nào?                     │
  │  → Accept-Encoding header (request)! ★                     │
  │  → Content-Encoding header (response)! ★                   │
  │  → DevTools → Network → Headers! ★                        │
  │                                                              │
  │  ❓ 4: Gzip vs Brotli?                                         │
  │  → Gzip: mặc định Next.js, ~70-80% nén! ★                 │
  │  → Brotli: tốt hơn ~15-20%, cần nginx/CDN! ★★★           │
  │  → Tắt Next.js compress + bật Brotli ở nginx! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
