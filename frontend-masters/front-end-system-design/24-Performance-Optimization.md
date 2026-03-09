# Front-End System Design — Phần 24: Performance Optimization — "LCP, INP, CLS + HTTP/2 Migration!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Performance Optimization — "3 metrics: LCP (<2.5s), INP (<200ms), CLS (<0.1). HTTP/1 limit 5 TCP connections (why webpack was created!). HTTP/2 multiplexing 200 streams in 1 socket. Domain sharding = legacy anti-pattern. HTTP/2 backward compatible, cheaper to maintain."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — Web Vitals, network performance!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Core Web Vitals — "LCP, INP, CLS!"             |
| 2   | HTTP/1 Problems — "5 Connection Limit!"        |
| 3   | Why Webpack Was Created                        |
| 4   | HTTP/2 Multiplexing — "200 Streams, 1 Socket!" |
| 5   | Domain Sharding — "Legacy Anti-Pattern!"       |
| 6   | Migration Cost — "HTTP/2 Is Cheaper!"          |

---

## §1. Core Web Vitals — "LCP, INP, CLS!"

> Evgenii: _"Three main metrics to track. LCP measures loading performance. INP measures interaction responsiveness. CLS measures visual stability."_

```
CORE WEB VITALS:
═══════════════════════════════════════════════════════════════

  LCP (Largest Contentful Paint):
  → Loading performance!
  → Ideal: < 2.5 seconds (or under 2s!)
  → "Impacts business results. Less LCP = better!" — Evgenii

  INP (Interaction to Next Paint):
  → Interaction responsiveness!
  → Ideal: < 200 milliseconds
  → "When you update data, reflow should be < 200ms"

  CLS (Cumulative Layout Shift):
  → Visual stability!
  → Ideal: < 0.1
  → "Small animations change element sizes,
     other elements adjust = layout shift!"

  Measure with: Chrome Lighthouse!
```

---

## §2. HTTP/1 Problems — "5 Connection Limit!"

> Evgenii: _"HTTP/1 initially: only 1 request in parallel! Browsers found workaround: 5 TCP connections. But hundreds of resources = everything queued, website loads slowly."_

```
HTTP/1.1 LIMITATIONS:
═══════════════════════════════════════════════════════════════

  Original HTTP/1: 1 request at a time!
  Client ── req1 ──→ wait... ← res1
  Client ── req2 ──→ wait... ← res2
  Client ── req3 ──→ wait... ← res3
  Sequential! SLOW! 💀

  Browser workaround: 5 TCP connections per domain!
  Socket 1 ── HTML ──→
  Socket 2 ── CSS  ──→
  Socket 3 ── JS   ──→
  Socket 4 ── img1 ──→
  Socket 5 ── img2 ──→
  ... img3, img4, img5 QUEUED! 💀

  100+ resources = LONG QUEUE!
  Headers: 5KB uncompressed per request!
  5 sockets × handshake = energy drain on mobile!
```

---

## §3. Why Webpack Was Created

> Evgenii: _"This is actually the reason webpack was created! Initially webpack was just merging all assets in single bundle so it can be loaded in a single loop. But now it's anti-pattern — now we want to SPLIT because of HTTP/2."_

```
WEBPACK HISTORY:
═══════════════════════════════════════════════════════════════

  HTTP/1 era: 5 connection limit!
  Solution: Bundle EVERYTHING into 1 file!
  → Webpack merges all JS → bundle.js (600KB!)
  → 1 request = 1 file = no queue! ✅ (for HTTP/1)

  HTTP/2 era: 200 parallel streams!
  Now bundling everything = ANTI-PATTERN!
  → Split code into many small files!
  → Load in parallel! ✅
  → "Now we actually want to split things
     because of HTTP/2." — Evgenii
```

---

## §4. HTTP/2 Multiplexing — "200 Streams, 1 Socket!"

> Evgenii: _"HTTP/2 is binary protocol. Split channel into multiple streams. Within 1 connection, load 200 resources in parallel. Any website: 200 resources is pretty good number."_

```
HTTP/1 vs HTTP/2:
═══════════════════════════════════════════════════════════════

  HTTP/1 (5 connections, 5 handshakes!):
  TCP Socket 1 ── 3-way handshake ── resource 1
  TCP Socket 2 ── 3-way handshake ── resource 2
  TCP Socket 3 ── 3-way handshake ── resource 3
  TCP Socket 4 ── 3-way handshake ── resource 4
  TCP Socket 5 ── 3-way handshake ── resource 5
  → 5 handshakes! Energy drain! Headers × 5!

  HTTP/2 (1 connection, 200 streams!):
  TCP Socket 1 ── 3-way handshake (once!)
       ├── stream 1: resource 1
       ├── stream 2: resource 2
       ├── stream 3: resource 3
       ├── ...
       └── stream 200: resource 200
  → 1 handshake! Energy efficient! Binary data! ✅

  "I don't expect any website to reach the limit." — Evgenii
```

---

## §5. Domain Sharding — "Legacy Anti-Pattern!"

> Evgenii: _"Before HTTP/2: 5 connections PER DOMAIN. To load 20 resources in parallel, create multiple domains! Called domain sharding. Very expensive infrastructure."_

```
DOMAIN SHARDING (HTTP/1 era):
═══════════════════════════════════════════════════════════════

  Limit: 5 connections per domain!
  Solution: create multiple domains!

  images.example.com   → 5 connections (images!)
  js.example.com       → 5 connections (JavaScript!)
  css.example.com      → 5 connections (CSS!)
  fonts.example.com    → 5 connections (fonts!)
  → 20 parallel connections! But 4 domains to maintain! 💀

  "Very expensive in terms of infrastructure." — Evgenii

  HTTP/2: NO NEED for domain sharding!
  → 1 domain, 200 streams! ✅
  → "Don't need overhead server infrastructure
     to maintain multiple domains." — Evgenii
```

---

## §6. Migration Cost — "HTTP/2 Is Cheaper!"

> Evgenii: _"HTTP/2 backward compatible with HTTP/1. Maintaining HTTP/1 server costs MORE in long run — need domain sharding infrastructure."_

```
MIGRATION:
═══════════════════════════════════════════════════════════════

  HTTP/1 → HTTP/2: backward compatible!
  → Easy migration! ✅
  → No breaking changes!

  Long-term cost:
  HTTP/1: need domain sharding, 5KB headers, etc.
  HTTP/2: 1 connection, compressed headers, multiplexing!
  → "Maintaining HTTP/1 costs more in long run." — Evgenii

  HTTP/1 headers: 5,000 bytes average!
  HTTP/2 headers: 12 bytes! (98% more efficient!)
  "First and easiest way to optimize: change server!" — Evgenii
```

---

## Checklist

```
[ ] LCP < 2.5s, INP < 200ms, CLS < 0.1!
[ ] HTTP/1: 5 connections per domain limit!
[ ] Webpack created for HTTP/1 (bundle all = 1 request)!
[ ] HTTP/2: anti-pattern to bundle! SPLIT instead!
[ ] HTTP/2: multiplexing 200 streams in 1 TCP socket!
[ ] HTTP/2: binary protocol, compressed headers (12 bytes!)!
[ ] Domain sharding = legacy anti-pattern!
[ ] HTTP/2 backward compatible, cheaper long-term!
[ ] "Easiest optimization: migrate to HTTP/2!" — Evgenii
TIẾP THEO → Phần 25: JavaScript Bundling & Loading!
```
