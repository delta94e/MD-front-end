# What Happens After You Enter a URL — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> The #1 browser interview question — complete lifecycle from keystroke to pixels
> 6 stages: URL Parse → DNS → TCP → TLS → HTTP → Render
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know interview classic (31K reads)

---

## Mục Lục

| #   | Section                            |
| --- | ---------------------------------- |
| 0   | Overview — 6 Stages                |
| 1   | Stage 1: URL Parsing               |
| 2   | Stage 2: DNS Resolution            |
| 3   | Stage 3: TCP 3-Way Handshake       |
| 4   | Stage 4: TLS/SSL Handshake (HTTPS) |
| 5   | Stage 5: HTTP Request & Response   |
| 6   | Stage 6: TCP 4-Way Close           |
| 7   | Browser Rendering Pipeline         |
| 8   | Summary & Interview Checklist      |

---

## §0. Overview — 6 Stages

```
WHAT HAPPENS WHEN YOU ENTER A URL:
═══════════════════════════════════════════════════════════════

  User types: https://www.google.com → presses Enter

  ┌──────────────────────────────────────────────────────────┐
  │ Stage 1: URL PARSING                                     │
  │ → Determine: is it a search query or a URL?             │
  │ → Parse: protocol, domain, port, path                   │
  ├──────────────────────────────────────────────────────────┤
  │ Stage 2: DNS RESOLUTION                                  │
  │ → Convert domain name → IP address                      │
  │ → Cache chain: Browser → OS → Router → ISP → Root DNS  │
  ├──────────────────────────────────────────────────────────┤
  │ Stage 3: TCP 3-WAY HANDSHAKE                             │
  │ → Establish reliable connection                         │
  │ → SYN → SYN+ACK → ACK                                  │
  ├──────────────────────────────────────────────────────────┤
  │ Stage 4: TLS/SSL HANDSHAKE (if HTTPS)                    │
  │ → Negotiate encryption                                  │
  │ → Certificate verification, key exchange                │
  ├──────────────────────────────────────────────────────────┤
  │ Stage 5: HTTP REQUEST & RESPONSE                         │
  │ → Send request (method, headers, body)                  │
  │ → Server processes, checks cache → returns response     │
  ├──────────────────────────────────────────────────────────┤
  │ Stage 6: TCP 4-WAY CLOSE (eventually)                    │
  │ → FIN → ACK → FIN → ACK                                │
  │ → Both sides gracefully close connection                │
  ├──────────────────────────────────────────────────────────┤
  │ Stage 7: BROWSER RENDERING                               │
  │ → Parse HTML → DOM tree                                 │
  │ → Parse CSS → CSSOM                                     │
  │ → Layout → Layer → Paint → Composite → Display!        │
  └──────────────────────────────────────────────────────────┘
```

---

## §1. Stage 1: URL Parsing

```
URL PARSING — FIRST THING THE BROWSER DOES:
═══════════════════════════════════════════════════════════════

  User input: "google.com"

  Browser decides:
  ① Is it a SEARCH QUERY or a URL?
     → Contains spaces or no dot? → Send to default search engine
     → Looks like URL? → Proceed to DNS

  ② Parse URL components:
     https://www.google.com:443/search?q=hello#top
     ───┬──   ──────┬──────  ┬  ──┬── ───┬──  ─┬─
     protocol    domain    port  path  query  fragment

  ③ Compose full URL:
     → Add "https://" if missing
     → Encode special characters (spaces → %20)

  ④ Check HSTS list:
     → Is this domain on the HSTS preload list?
     → YES → Force HTTPS even if user typed HTTP!
     → Google, Facebook, Twitter are all on HSTS list
```

---

## §2. Stage 2: DNS Resolution

```
DNS — DOMAIN NAME SYSTEM:
═══════════════════════════════════════════════════════════════

  Problem: Humans remember "google.com"
           Computers need 142.250.190.78

  Solution: DNS = "phone book" of the internet!

  DNS TREE STRUCTURE:
  ┌──────────────┐
  │   Root DNS   │  (13 root server clusters worldwide)
  │      .       │
  └──────┬───────┘
    ┌────┴────┬──────────┐
  ┌─┴──┐  ┌──┴──┐   ┌───┴──┐
  │.com│  │.cn  │   │.net  │   ← Top-Level Domain (TLD)
  └──┬─┘  └──┬──┘   └──┬───┘
  ┌──┴───┐ ┌──┴───┐ ┌──┴───┐
  │google│ │baidu │ │csdn  │   ← Authoritative DNS
  │ .com │ │ .cn  │ │ .net │
  └──────┘ └──────┘ └──────┘

  3 TYPES OF DNS SERVERS:
  ① Root DNS → returns IP of TLD server
  ② TLD DNS → returns IP of Authoritative server
  ③ Authoritative DNS → returns actual IP of host!
```

```
DNS LOOKUP — RECURSIVE + ITERATIVE:
═══════════════════════════════════════════════════════════════

  STEP 1 — RECURSIVE LOOKUP (client → local DNS):
  Browser searches through a CACHE CHAIN:

  ① Browser DNS cache         (chrome://net-internals/#dns)
     ↓ miss
  ② OS DNS cache              (/etc/hosts file)
     ↓ miss
  ③ Local DNS resolver cache  (OS-level cache)
     ↓ miss
  ④ Local DNS server          (ISP's DNS, e.g. 8.8.8.8)

  → If ANY level hits → return IP immediately! Done!
  → This is RECURSIVE: client asks once, local DNS does all work

  STEP 2 — ITERATIVE LOOKUP (local DNS → root → TLD → auth):
  If local DNS doesn't have it cached:

  Local DNS         Root DNS        TLD DNS       Auth DNS
  ─────────         ────────        ───────       ────────
      │                │               │              │
      │── "google.com"→│               │              │
      │←─ "ask .com"───│               │              │
      │                                │              │
      │── "google.com" ──────────────→│              │
      │←── "ask google's DNS" ────────│              │
      │                                               │
      │── "google.com" ─────────────────────────────→│
      │←── "142.250.190.78" ────────────────────────│
      │                                               │
      │── Returns IP to client!

  → This is ITERATIVE: local DNS asks each server one by one
  → Each server says "I don't know, but ask this server"
```

```
DNS OPTIMIZATIONS:
═══════════════════════════════════════════════════════════════

  ① MULTI-LEVEL CACHING (closest → farthest):
  Browser cache → OS cache → Router cache → ISP cache
  → Root cache → TLD cache → Authoritative cache

  ② DNS-BASED LOAD BALANCING:
  → One domain can map to MULTIPLE IPs!
  → DNS returns different IPs based on:
    - Geographic location (CDN!)
    - Server load
    - ISP proximity
  → Example: google.com → different IPs in US vs Asia

  ③ DNS PREFETCHING (browser optimization):
  <link rel="dns-prefetch" href="//api.example.com">
  → Browser resolves DNS in background before user clicks!
  → Saves 20-120ms per domain!

  ④ TTL (Time To Live):
  → Each DNS record has TTL (e.g., 300 = 5 minutes)
  → Cache expires after TTL → must re-query
  → Short TTL = fresher, more queries
  → Long TTL = stale, fewer queries
```

---

## §3. Stage 3: TCP 3-Way Handshake

```
TCP 3-WAY HANDSHAKE — ESTABLISHING CONNECTION:
═══════════════════════════════════════════════════════════════

  WHY 3-WAY?
  → Both sides must confirm they can SEND and RECEIVE!
  → Like a phone call: "Hello?" → "Hello! Can you hear me?" → "Yes!"

  Client                                Server
  ──────                                ──────
  CLOSED                                LISTEN
     │                                     │
     │  ① SYN: seq=x                      │
     │─────────────────────────────────→  │
     │  "I want to connect!"              │
  SYN_SENT                                │
     │                                     │
     │  ② SYN+ACK: seq=y, ack=x+1        │
     │  ←─────────────────────────────────│
     │  "OK! I confirm. I also want to!"  │
     │                                  SYN_RECV
     │                                     │
     │  ③ ACK: ack=y+1                    │
     │─────────────────────────────────→  │
     │  "Great! Connection established!"   │
  ESTABLISHED                          ESTABLISHED
     │                                     │
     │  ← Data can flow both ways now! →  │

  WHAT EACH HANDSHAKE PROVES:
  ┌─────────┬──────────────────┬──────────────────┐
  │ Step    │ Client confirms  │ Server confirms  │
  ├─────────┼──────────────────┼──────────────────┤
  │ ① SYN   │ —                │ Client can SEND  │
  │ ② S+ACK │ Server can S+R   │ —                │
  │ ③ ACK   │ —                │ Client can RECV  │
  └─────────┴──────────────────┴──────────────────┘
  After 3 steps: both know they can SEND and RECEIVE! ✅
```

```
TCP FLAGS — WHAT ARE SYN, ACK, FIN?
═══════════════════════════════════════════════════════════════

  TCP header has 6 flag bits:
  ┌─────┬──────────────────────────────────────────────┐
  │ SYN │ SYNchronize — initiate connection            │
  │     │ SYN=1, ACK=0 → connection REQUEST           │
  │     │ SYN=1, ACK=1 → connection ACCEPTED          │
  ├─────┼──────────────────────────────────────────────┤
  │ ACK │ ACKnowledgment — confirm receipt             │
  │     │ ACK=1 → ack number field is valid            │
  │     │ ALL packets after connection have ACK=1!     │
  ├─────┼──────────────────────────────────────────────┤
  │ FIN │ FINish — terminate connection                │
  │     │ FIN=1 → "I'm done sending data"             │
  ├─────┼──────────────────────────────────────────────┤
  │ RST │ ReSeT — force abort                          │
  │ PSH │ PuSH — deliver to app immediately            │
  │ URG │ URGent — has urgent data                     │
  └─────┴──────────────────────────────────────────────┘

  Sequence Number (seq):
  → Each byte has a sequence number
  → Ensures data arrives in ORDER and detects loss

  Acknowledgment Number (ack):
  → "I've received everything up to this number"
  → ack=x+1 means "I got x, send me x+1 next"
```

---

## §4. Stage 4: TLS/SSL Handshake (HTTPS)

```
HTTPS = HTTP + TLS (Transport Layer Security):
═══════════════════════════════════════════════════════════════

  HTTP:  Data in PLAINTEXT → anyone on network can read! 💀
  HTTPS: Data ENCRYPTED → only sender/receiver can read! ✅

  TLS adds ~1-2 round trips AFTER TCP handshake

  4-PHASE TLS HANDSHAKE:
  ═══════════════════════════════════════════════════════════

  Client                                    Server
  ──────                                    ──────
     │                                         │
     │ Phase 1: CLIENT HELLO                   │
     │ → TLS version, cipher suites,           │
     │   client random number                  │
     │─────────────────────────────────────→  │
     │                                         │
     │ Phase 2: SERVER HELLO                   │
     │ ← Chosen cipher, server random,        │
     │   SSL CERTIFICATE (with public key),   │
     │   "Server Hello Done"                   │
     │←─────────────────────────────────────  │
     │                                         │
     │ Phase 3: CLIENT KEY EXCHANGE            │
     │ → Verify certificate (trust chain!)     │
     │ → Generate PRE-MASTER SECRET            │
     │ → Encrypt with server's public key      │
     │ → Send encrypted pre-master secret      │
     │─────────────────────────────────────→  │
     │                                         │
     │ Phase 4: CHANGE CIPHER SPEC             │
     │ Both derive same SESSION KEY from:      │
     │ client random + server random +         │
     │ pre-master secret                       │
     │                                         │
     │←──── Encrypted communication! ────────→│

  KEY INSIGHT:
  → Asymmetric crypto (RSA/ECDH) only used for KEY EXCHANGE
  → Actual data uses faster SYMMETRIC crypto (AES)!
  → Session key = shared secret for symmetric encryption

  WHY BOTH ASYMMETRIC + SYMMETRIC?
  → Asymmetric: SECURE but SLOW (1000x slower!)
  → Symmetric: FAST but needs a shared secret
  → Solution: use asymmetric to share the secret,
    then switch to symmetric for all actual data! ✅
```

---

## §5. Stage 5: HTTP Request & Response

```
HTTP REQUEST:
═══════════════════════════════════════════════════════════════

  GET /search?q=hello HTTP/1.1
  Host: www.google.com
  User-Agent: Chrome/120
  Accept: text/html
  Accept-Language: en-US
  Cookie: session=abc123
  If-None-Match: "etag-xyz"         ← Cache validation!
  If-Modified-Since: Mon, 10 Feb...  ← Cache validation!

  REQUEST LINE:    Method + Path + HTTP Version
  HEADERS:         Key: Value pairs
  BODY:            (for POST/PUT — empty for GET)
```

```
SERVER PROCESSES REQUEST:
═══════════════════════════════════════════════════════════════

  Server receives request → checks CACHE HEADERS:

  ┌─────────────────────────────────────────────────────────┐
  │ Has If-None-Match or If-Modified-Since?                 │
  │                                                         │
  │ YES → Compare with current resource                    │
  │   ├─ MATCH → 304 Not Modified (no body! use cache!) ✅│
  │   └─ NO MATCH → 200 OK + full resource body           │
  │                                                         │
  │ NO → 200 OK + full resource body                       │
  └─────────────────────────────────────────────────────────┘

  CACHE DECISION TREE (server side):
  ┌────────────────────────────────────────────────────┐
  │ Reusable response?                                 │
  │ ├─ NO → Cache-Control: no-store                   │
  │ └─ YES → Revalidate each time?                    │
  │      ├─ YES → Cache-Control: no-cache             │
  │      └─ NO → Cacheable by proxies?                │
  │           ├─ NO → Cache-Control: private           │
  │           └─ YES → Cache-Control: public           │
  │                └─ max-age=N → Add ETag header     │
  └────────────────────────────────────────────────────┘
```

```
HTTP RESPONSE:
═══════════════════════════════════════════════════════════════

  HTTP/1.1 200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: 12345
  Cache-Control: max-age=3600
  ETag: "abc123"
  Last-Modified: Mon, 10 Feb 2026 10:00:00 GMT
  Set-Cookie: session=xyz; HttpOnly; Secure
  Content-Encoding: gzip

  <!DOCTYPE html>
  <html>...response body...</html>

  COMMON STATUS CODES:
  ┌──────┬──────────────────────────────────────────────┐
  │ 200  │ OK — resource returned successfully          │
  │ 301  │ Moved Permanently — URL changed (cached!)    │
  │ 302  │ Found — temporary redirect (not cached)      │
  │ 304  │ Not Modified — use cached version! ⭐        │
  │ 400  │ Bad Request — malformed request              │
  │ 403  │ Forbidden — no permission                    │
  │ 404  │ Not Found — resource doesn't exist           │
  │ 500  │ Internal Server Error — server crashed       │
  │ 502  │ Bad Gateway — upstream server down           │
  │ 503  │ Service Unavailable — server overloaded      │
  └──────┴──────────────────────────────────────────────┘
```

---

## §6. Stage 6: TCP 4-Way Close

```
TCP 4-WAY HANDSHAKE — CLOSING CONNECTION:
═══════════════════════════════════════════════════════════════

  WHY 4-WAY? (not 3 like opening?)
  → Connection is FULL DUPLEX (both sides send independently)
  → Each side must close SEPARATELY!
  → Side A closes → Side B may still have data to send!

  Host 1 (initiator)                    Host 2
  ─────────────────                     ──────
  ESTABLISHED                           ESTABLISHED
     │                                     │
     │  ① FIN: seq=u                       │
     │─────────────────────────────────→  │
     │  "I'm done sending!"               │
  FIN_WAIT_1                               │
     │                                     │
     │  ② ACK: ack=u+1                    │
     │  ←─────────────────────────────────│
     │  "Got it! (I may still send data)" │
  FIN_WAIT_2                            CLOSE_WAIT
     │                                     │
     │          (Host 2 sends remaining data...)
     │                                     │
     │  ③ FIN: seq=v                       │
     │  ←─────────────────────────────────│
     │  "OK, I'm also done now!"           │
     │                                  LAST_ACK
     │                                     │
     │  ④ ACK: ack=v+1                    │
     │─────────────────────────────────→  │
     │  "Confirmed! Goodbye!"             │
  TIME_WAIT                             CLOSED
     │                                     │
     │  (wait 2MSL = ~60 seconds)         │
     │                                     │
  CLOSED

  WHY TIME_WAIT (2MSL)?
  → MSL = Maximum Segment Lifetime (~30s)
  → If ④ ACK gets lost → Host 2 resends ③ FIN
  → Host 1 must be alive to re-ACK!
  → After 2MSL with no retry → safe to close!

  WHY NOT 3-WAY CLOSE?
  → Step ② ACK is separate from step ③ FIN
  → Because Host 2 may need time to finish sending data!
  → In opening: SYN+ACK combined (server has nothing else to do)
  → In closing: ACK now + FIN later (still has data to flush)
```

---

## §7. Browser Rendering Pipeline

```
RENDERING PIPELINE — 8 STAGES:
═══════════════════════════════════════════════════════════════

  HTML Bytes → Characters → Tokens → Nodes → DOM Tree
  CSS  Bytes → Characters → Tokens → Nodes → CSSOM
                                         ↓
                                   Render Tree
                                         ↓
                                      Layout
                                         ↓
                                      Layer
                                         ↓
                                      Paint
                                         ↓
                                    Composite
                                         ↓
                                     Display!
```

### 7a. Building the DOM Tree

```
BYTES → DOM TREE (4 steps):
═══════════════════════════════════════════════════════════════

  ① ENCODING — Bytes → Characters
  → Raw bytes arrive from network
  → Decoded using charset (UTF-8, etc.)
  → Result: HTML string

  ② TOKENIZATION — Characters → Tokens
  → HTML string parsed into tokens
  → Each token: start tag, end tag, text, comment
  → State machine: character by character!

  ③ BUILDING NODES — Tokens → Nodes
  → Each token creates a Node object
  → Nodes have: attributes, parent/child pointers, treeScope

  ④ BUILD DOM TREE — Nodes → Tree
  → Establish parent-child-sibling relationships
  → Tree structure mirrors HTML nesting!

  EXAMPLE:
  <html>
    <body>
      <p>Hello</p>      →    html
      <div>World</div>        ├── body
    </body>                    │   ├── p
  </html>                      │   │   └── "Hello"
                               │   └── div
                               │       └── "World"
```

### 7b. Style Calculation (CSSOM)

```
CSSOM CONSTRUCTION + STYLE CALCULATION:
═══════════════════════════════════════════════════════════════

  3 CSS SOURCES:
  ① <link rel="stylesheet"> — external CSS file
  ② <style> tag — embedded CSS
  ③ style="" attribute — inline CSS

  STYLE CALCULATION PROCESS:
  ① Parse CSS → CSSOM (CSS Object Model tree)
  ② STANDARDIZE values:
     → 2em → 32px (relative → absolute)
     → red → rgb(255, 0, 0)
     → bold → font-weight: 700
  ③ INHERITANCE:
     → Some properties inherit: font-size, color, line-height
     → Others don't: margin, padding, border, width
  ④ CASCADE (priority):
     → !important > inline > #id > .class > tag
     → Later rules override earlier (same specificity)

  RESULT: each DOM node now has a "computed style"
  (visible in DevTools → Elements → Computed tab)
```

### 7c. Layout

```
LAYOUT — CALCULATING GEOMETRY:
═══════════════════════════════════════════════════════════════

  RENDER TREE = DOM Tree + CSSOM (only VISIBLE nodes!)
  → Excludes: <script>, <meta>, <link>
  → Excludes: display: none elements
  → Includes: visibility: hidden (occupies space!)

  LAYOUT TREE:
  → Calculates POSITION and SIZE of each visible element
  → Width, height, x, y coordinates
  → Box model: content + padding + border + margin

  ⚠️ REFLOW (Layout Recalculation):
  → Triggered when geometry changes!
  → Changes to: width, height, margin, padding, font-size,
    position, display, adding/removing DOM nodes
  → EXPENSIVE! Recalculates entire subtree!

  ⚠️ REPAINT:
  → Triggered when appearance changes WITHOUT geometry!
  → Changes to: color, background, visibility, box-shadow
  → Less expensive than reflow, but still costly!

  REFLOW always triggers REPAINT!
  REPAINT does NOT trigger REFLOW!
```

### 7d. Layer Tree, Paint, Composite

```
LAYER → PAINT → COMPOSITE → DISPLAY:
═══════════════════════════════════════════════════════════════

  ① LAYER TREE (Photoshop concept!):
  → Not every node gets its own layer
  → New layer created when:
    - position: fixed/sticky
    - will-change: transform
    - transform: translateZ(0) (GPU hack!)
    - opacity < 1
    - z-index with positioned element
    - <video>, <canvas>, <iframe>
  → Layers enable independent compositing!

  ② PAINT (Draw List):
  → For each layer: generate a DRAW LIST
  → List of drawing instructions:
    "draw rect at (0,0) 100x100 #FF0000"
    "draw text 'Hello' at (10,10) font 16px"
  → Submitted to COMPOSITOR THREAD!

  ③ RASTERIZATION (Tiles → Bitmaps):
  → Compositor thread divides layers into TILES
  → Tiles near VIEWPORT are rasterized FIRST! (priority!)
  → Rasterization = converting tiles to BITMAPS (pixels!)
  → Uses GPU for acceleration!

  ④ COMPOSITE & DISPLAY:
  → Compositor thread sends "draw tile" commands
  → Browser process generates final page image
  → Image displayed on screen at 60fps!

  WHY TILES?
  → Page may be very tall (scroll!)
  → Only viewport is visible to user
  → Rasterizing entire page = wasteful!
  → Only rasterize tiles near viewport = efficient! ✅

  COMPOSITING IS THE SECRET TO 60fps!
  → Changes that only need compositing (no reflow/repaint):
    - transform: translate, scale, rotate
    - opacity changes
  → These SKIP layout and paint → directly composite!
  → That's why CSS transforms are SO smooth!
```

```
KEY INSIGHT — CSS PERFORMANCE:
═══════════════════════════════════════════════════════════════

  BEST (composite only — GPU!):
  → transform, opacity
  → 60fps guaranteed! 🚀

  OK (repaint only):
  → color, background, box-shadow, visibility

  WORST (reflow + repaint):
  → width, height, margin, padding, font-size, display
  → top, left, right, bottom (use transform instead!)

  PRO TIP:
  → Use transform: translateX(100px) INSTEAD of left: 100px
  → Same visual result, 100x better performance!
```

---

## §8. Summary & Interview Checklist

```
COMPLETE FLOW — ONE PICTURE:
═══════════════════════════════════════════════════════════════

  Enter URL
     ↓
  ① URL Parsing (protocol, domain, path, HSTS check)
     ↓
  ② DNS Resolution
     Browser cache → OS cache → Router → ISP → Root → TLD → Auth
     (recursive from client, iterative from local DNS)
     ↓
  ③ TCP 3-Way Handshake
     SYN(x) → SYN+ACK(y, x+1) → ACK(y+1)
     ↓
  ④ TLS Handshake (if HTTPS)
     ClientHello → ServerHello+Cert → KeyExchange → ChangeCipher
     Asymmetric (slow) → exchange key → Symmetric (fast)
     ↓
  ⑤ HTTP Request/Response
     GET /path → Server checks cache headers
     → 304 (use cache) or 200 (fresh response)
     ↓
  ⑥ Browser Rendering
     HTML→DOM, CSS→CSSOM → Render Tree → Layout → Layer
     → Paint → Rasterize (tiles!) → Composite → Display!
     ↓
  ⑦ TCP 4-Way Close (eventually)
     FIN → ACK → FIN → ACK (+2MSL wait)
```

### Checklist

- [ ] **URL parse**: determine search vs URL, compose full URL, check HSTS preload list
- [ ] **DNS tree**: Root → TLD (.com) → Authoritative (google.com) → IP
- [ ] **DNS lookup**: recursive (client→local DNS), iterative (local DNS→root→TLD→auth)
- [ ] **DNS cache chain**: browser → OS hosts → resolver → local DNS → root → TLD → auth
- [ ] **DNS optimization**: multi-level caching, load balancing, `dns-prefetch`, TTL
- [ ] **TCP 3-way**: SYN(x) → SYN+ACK(y, x+1) → ACK(y+1) → ESTABLISHED
- [ ] **Why 3-way**: both sides confirm SEND and RECEIVE capability
- [ ] **SYN/ACK/FIN flags**: SYN=connect, ACK=confirm, FIN=close
- [ ] **TLS 4 phases**: ClientHello → ServerHello+Cert → KeyExchange → ChangeCipher
- [ ] **TLS key insight**: asymmetric (RSA) for KEY EXCHANGE, symmetric (AES) for DATA
- [ ] **HTTP cache check**: If-None-Match / If-Modified-Since → 304 or 200
- [ ] **Cache decision**: no-store → no-cache → public/private → max-age → ETag
- [ ] **TCP 4-way close**: FIN → ACK → FIN → ACK (separate because full-duplex!)
- [ ] **TIME_WAIT**: 2MSL (~60s) to catch retransmitted FIN
- [ ] **Why 4-way not 3**: receiver may still have data → ACK and FIN are separate!
- [ ] **DOM build**: bytes → characters → tokens → nodes → DOM tree
- [ ] **CSSOM**: parse CSS, standardize values (2em→32px), inheritance, cascade
- [ ] **Layout**: render tree (visible only!), calculate position + size
- [ ] **Reflow vs repaint**: reflow = geometry change (expensive!), repaint = appearance only
- [ ] **Layer + composite**: tiles near viewport first, GPU rasterization, 60fps compositing
- [ ] **CSS perf**: transform/opacity = composite only (fast!) vs width/height = reflow (slow!)

---

_Nguồn: "What Happens After You Enter a URL" (31K reads)_
_Cập nhật lần cuối: Tháng 2, 2026_
