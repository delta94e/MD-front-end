# userAgent() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/userAgent
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/server`
> **KHÔNG phải hook — là helper function!**

---

## §1. userAgent() Là Gì?

```
  userAgent() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Helper function (KHÔNG phải hook)! ★                     │
  │  → Extend Web Request API! ★                                │
  │  → Parse user agent string từ request! ★                   │
  │  → import { userAgent } from 'next/server'! ★               │
  │  → Dùng trong Middleware, Route Handlers! ★                 │
  │                                                              │
  │  CÁCH DÙNG:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  import { NextRequest, NextResponse, userAgent }       │    │
  │  │    from 'next/server'                                  │    │
  │  │                                                       │    │
  │  │  export function middleware(request: NextRequest) {     │    │
  │  │    const { device } = userAgent(request) ← parse! ★  │    │
  │  │    const viewport = device.type || 'desktop'          │    │
  │  │    // Redirect/rewrite based on device type! ★        │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 6 Properties Chi Tiết!

```
  userAgent(request) RETURNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────┬─────────────────────────────────────────────┐  │
  │  │ Property  │ Chi tiết                                     │  │
  │  ├──────────┼─────────────────────────────────────────────┤  │
  │  │ isBot     │ boolean! ★                                   │  │
  │  │           │ true = known bot (Googlebot, etc.)! ★       │  │
  │  │           │ false = real user! ★                        │  │
  │  ├──────────┼─────────────────────────────────────────────┤  │
  │  │ browser   │ { name?: string, version?: string }! ★      │  │
  │  │           │ name: 'Chrome', 'Firefox', 'Safari'...     │  │
  │  │           │ version: '120.0.0'... hoặc undefined! ★     │  │
  │  ├──────────┼─────────────────────────────────────────────┤  │
  │  │ device    │ { model?: string, type?: string,             │  │
  │  │           │   vendor?: string }! ★★★                    │  │
  │  │           │ type: 'mobile' | 'tablet' | 'console' |    │  │
  │  │           │   'smarttv' | 'wearable' | 'embedded' |    │  │
  │  │           │   undefined (= desktop!)! ★★★               │  │
  │  │           │ model: 'iPhone', 'Pixel'... ★               │  │
  │  │           │ vendor: 'Apple', 'Samsung'... ★             │  │
  │  ├──────────┼─────────────────────────────────────────────┤  │
  │  │ engine    │ { name?: string, version?: string }! ★      │  │
  │  │           │ name: 'Blink' | 'Gecko' | 'WebKit' |       │  │
  │  │           │   'Trident' | 'Presto' | 'EdgeHTML' |      │  │
  │  │           │   'Amaya' | 'Flow' | ... ★                  │  │
  │  ├──────────┼─────────────────────────────────────────────┤  │
  │  │ os        │ { name?: string, version?: string }! ★      │  │
  │  │           │ name: 'Windows', 'macOS', 'iOS',           │  │
  │  │           │   'Android', 'Linux'... ★                   │  │
  │  ├──────────┼─────────────────────────────────────────────┤  │
  │  │ cpu       │ { architecture?: string }! ★                │  │
  │  │           │ '68k' | 'amd64' | 'arm' | 'arm64' |       │  │
  │  │           │ 'armhf' | 'avr' | 'ia32' | 'ia64' |       │  │
  │  │           │ 'irix' | 'irix64' | 'mips' | 'mips64' |   │  │
  │  │           │ 'pa-risc' | 'ppc' | 'sparc' |             │  │
  │  │           │ 'sparc64' | undefined! ★                    │  │
  │  └──────────┴─────────────────────────────────────────────┘  │
  │                                                              │
  │  ⚠️ TẤT CẢ PROPERTIES CÓ THỂ undefined! ★★★                 │
  │  → Không phải mọi UA string đều parse được! ★              │
  │  → LUÔN check undefined! ★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. device.type — Chi Tiết!

```
  DEVICE TYPES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────┬──────────────────────────────────────────┐   │
  │  │ Type        │ Mô tả                                    │   │
  │  ├────────────┼──────────────────────────────────────────┤   │
  │  │ 'mobile'    │ Điện thoại! ★                           │   │
  │  │ 'tablet'    │ Máy tính bảng! ★                        │   │
  │  │ 'console'   │ Game console (PS5, Xbox...)! ★           │   │
  │  │ 'smarttv'   │ Smart TV! ★                              │   │
  │  │ 'wearable'  │ Thiết bị đeo (Apple Watch...)! ★        │   │
  │  │ 'embedded'  │ Thiết bị nhúng! ★                       │   │
  │  │ undefined   │ DESKTOP browser! ★★★                     │   │
  │  │             │ (fallback = 'desktop')                    │   │
  │  └────────────┴──────────────────────────────────────────┘   │
  │                                                              │
  │  ⚠️ Desktop = undefined! ★★★                                 │
  │  → KHÔNG có 'desktop' type! ★                               │
  │  → Dùng: device.type || 'desktop'! ★★★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Example — Device-Based Proxy!

```
  EXAMPLE: Redirect/Rewrite theo device!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // middleware.ts                                      │    │
  │  │ import { NextRequest, NextResponse, userAgent }        │    │
  │  │   from 'next/server'                                   │    │
  │  │                                                       │    │
  │  │ export function middleware(request: NextRequest) {      │    │
  │  │   const url = request.nextUrl                         │    │
  │  │   const { device } = userAgent(request)               │    │
  │  │                                                       │    │
  │  │   // device.type undefined = desktop! ★★★              │    │
  │  │   const viewport = device.type || 'desktop'           │    │
  │  │                                                       │    │
  │  │   // Add viewport to searchParams! ★                   │    │
  │  │   url.searchParams.set('viewport', viewport)          │    │
  │  │                                                       │    │
  │  │   // Rewrite to same URL with viewport param! ★       │    │
  │  │   return NextResponse.rewrite(url)                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  Mobile request → /page                                      │
  │  → userAgent parse → device.type = 'mobile'! ★              │
  │  → Rewrite → /page?viewport=mobile! ★                      │
  │  → Page component đọc viewport → render mobile UI! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — UserAgentEngine!

```javascript
var UserAgentEngine = (function () {
  // ═══════════════════════════════════
  // 1. UA STRING PARSER
  // ═══════════════════════════════════
  function parseUserAgent(uaString) {
    var result = {
      isBot: false,
      browser: { name: undefined, version: undefined },
      device: { model: undefined, type: undefined, vendor: undefined },
      engine: { name: undefined, version: undefined },
      os: { name: undefined, version: undefined },
      cpu: { architecture: undefined },
    };

    if (!uaString) return result;
    var ua = uaString.toLowerCase();

    // ── isBot ──
    var bots = [
      "googlebot",
      "bingbot",
      "slurp",
      "duckduckbot",
      "baiduspider",
      "yandexbot",
      "facebot",
      "ia_archiver",
      "crawler",
    ];
    for (var i = 0; i < bots.length; i++) {
      if (ua.indexOf(bots[i]) >= 0) {
        result.isBot = true;
        break;
      }
    }

    // ── Browser ──
    if (ua.indexOf("chrome") >= 0 && ua.indexOf("edg") < 0) {
      result.browser.name = "Chrome";
      var m = uaString.match(/Chrome\/([\d.]+)/);
      if (m) result.browser.version = m[1];
    } else if (ua.indexOf("firefox") >= 0) {
      result.browser.name = "Firefox";
      var m = uaString.match(/Firefox\/([\d.]+)/);
      if (m) result.browser.version = m[1];
    } else if (ua.indexOf("safari") >= 0 && ua.indexOf("chrome") < 0) {
      result.browser.name = "Safari";
      var m = uaString.match(/Version\/([\d.]+)/);
      if (m) result.browser.version = m[1];
    } else if (ua.indexOf("edg") >= 0) {
      result.browser.name = "Edge";
      var m = uaString.match(/Edg\/([\d.]+)/);
      if (m) result.browser.version = m[1];
    }

    // ── Device ──
    if (ua.indexOf("iphone") >= 0) {
      result.device = { model: "iPhone", type: "mobile", vendor: "Apple" };
    } else if (ua.indexOf("ipad") >= 0) {
      result.device = { model: "iPad", type: "tablet", vendor: "Apple" };
    } else if (ua.indexOf("android") >= 0 && ua.indexOf("mobile") >= 0) {
      result.device.type = "mobile";
    } else if (ua.indexOf("android") >= 0) {
      result.device.type = "tablet";
    }
    // undefined = desktop!

    // ── Engine ──
    if (ua.indexOf("webkit") >= 0) {
      result.engine.name = ua.indexOf("chrome") >= 0 ? "Blink" : "WebKit";
    } else if (ua.indexOf("gecko") >= 0) {
      result.engine.name = "Gecko";
    } else if (ua.indexOf("trident") >= 0) {
      result.engine.name = "Trident";
    }

    // ── OS ──
    if (ua.indexOf("windows") >= 0) {
      result.os.name = "Windows";
    } else if (ua.indexOf("mac os") >= 0 || ua.indexOf("macintosh") >= 0) {
      result.os.name = "macOS";
    } else if (ua.indexOf("iphone") >= 0 || ua.indexOf("ipad") >= 0) {
      result.os.name = "iOS";
    } else if (ua.indexOf("android") >= 0) {
      result.os.name = "Android";
    } else if (ua.indexOf("linux") >= 0) {
      result.os.name = "Linux";
    }

    // ── CPU ──
    if (
      ua.indexOf("x86_64") >= 0 ||
      ua.indexOf("x64") >= 0 ||
      ua.indexOf("amd64") >= 0 ||
      ua.indexOf("win64") >= 0
    ) {
      result.cpu.architecture = "amd64";
    } else if (ua.indexOf("arm64") >= 0 || ua.indexOf("aarch64") >= 0) {
      result.cpu.architecture = "arm64";
    } else if (ua.indexOf("arm") >= 0) {
      result.cpu.architecture = "arm";
    }

    return result;
  }

  // ═══════════════════════════════════
  // 2. VIEWPORT DETECTOR
  // ═══════════════════════════════════
  function getViewport(uaString) {
    var parsed = parseUserAgent(uaString);
    var viewport = parsed.device.type || "desktop";
    return {
      viewport: viewport,
      device: parsed.device,
      note: parsed.device.type
        ? "Device type: " + parsed.device.type + "! ★"
        : "No device.type → default: desktop! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. BOT DETECTOR
  // ═══════════════════════════════════
  function isBotRequest(uaString) {
    var parsed = parseUserAgent(uaString);
    return {
      isBot: parsed.isBot,
      note: parsed.isBot
        ? "BOT detected! Block/serve different content! ★★★"
        : "Real user! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UserAgent Engine ═══");

    var chromeDesktop =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var iphoneSafari =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    var googleBot = "Googlebot/2.1 (+http://www.google.com/bot.html)";

    console.log("\n── 1. Parse ──");
    console.log("Chrome Desktop:", parseUserAgent(chromeDesktop));
    console.log("iPhone Safari:", parseUserAgent(iphoneSafari));
    console.log("Googlebot:", parseUserAgent(googleBot));

    console.log("\n── 2. Viewport ──");
    console.log("Desktop:", getViewport(chromeDesktop));
    console.log("Mobile:", getViewport(iphoneSafari));

    console.log("\n── 3. Bot ──");
    console.log("Real user:", isBotRequest(chromeDesktop));
    console.log("Bot:", isBotRequest(googleBot));
  }

  return { demo: demo };
})();
// Chạy: UserAgentEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: userAgent helper trả gì?                                │
  │  → Object với 6 properties! ★                               │
  │  → isBot, browser, device, engine, os, cpu! ★              │
  │  → TẤT CẢ có thể undefined! ★★★                           │
  │                                                              │
  │  ❓ 2: device.type undefined nghĩa gì?                         │
  │  → Desktop browser! ★★★                                     │
  │  → KHÔNG có 'desktop' type! ★                               │
  │  → Dùng: device.type || 'desktop'! ★★★                    │
  │                                                              │
  │  ❓ 3: userAgent là hook hay function?                          │
  │  → FUNCTION! KHÔNG phải hook! ★★★                          │
  │  → import from 'next/server'! ★                             │
  │  → Dùng trong Middleware, Route Handlers! ★                 │
  │  → KHÔNG dùng trong Client Components! ★                   │
  │                                                              │
  │  ❓ 4: Dùng userAgent trong Middleware để làm gì?              │
  │  → Detect device → responsive redirect/rewrite! ★          │
  │  → Detect bot → block/crawl handling! ★                    │
  │  → Detect OS → platform-specific download! ★               │
  │  → Detect browser → compatibility warnings! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
