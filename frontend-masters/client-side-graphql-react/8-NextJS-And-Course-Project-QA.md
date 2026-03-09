# Client-Side GraphQL with React, v2 — Phần 8: Next.js & Course Project Q&A — "SSR, Microservices, CORS!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: Next.js & Course Project Q&A — "Parentheses folders = no URL segment, just shared layout. SSR/server components = 100% skipped. GraphQL on server component = pointless (just use DB!). TypeScript types = optional, 'GPT does my types'. Microservices + GraphQL = one schema, many services. CORS = preflight check, OPTIONS request."
> Độ khó: ⭐️⭐️ | Q&A — clearing up Next.js confusion + architecture!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Parentheses Folders — "(auth) = No URL Segment!"       |
| 2   | SSR & Server Components — "100% Skipped!"              |
| 3   | TypeScript — "GPT Does My Types!"                      |
| 4   | Microservices + GraphQL — "One Schema, Many Services!" |
| 5   | CORS — "Preflight Check!"                              |
| 6   | Tại Sao Không GraphQL Trên Server Components?          |

---

## §1. Parentheses Folders — "(auth) = No URL Segment!"

> Scott: _"A folder in App.js is a route. If I put parentheses around it, it doesn't add a route segment. The only reason: share a layout without creating a new URL."_

```
NEXT.JS ROUTE GROUPS:
═══════════════════════════════════════════════════════════════

  Without parentheses:
  app/auth/sign-in → /auth/sign-in   (URL segment!)
  app/auth/sign-up → /auth/sign-up   (URL segment!)

  With parentheses:
  app/(auth)/sign-in → /sign-in      (no /auth in URL!)
  app/(auth)/sign-up → /sign-up      (no /auth in URL!)

  WHY?
  → sign-in and sign-up share SAME layout!
  → But don't want /auth/ in URL!
  → "I don't want /auth/sign-in which is gross" — Scott

  Rule: () = "share layout, no URL segment!"
```

---

## §2. SSR & Server Components — "100% Skipped!"

> Scott: _"We are 100% skipping that stuff on purpose. We are in client land only. I think server components completely breaks people's mental models on how you get data."_

```
SSR & SERVER COMPONENTS:
═══════════════════════════════════════════════════════════════

  This course:
  → 'use client' everywhere!
  → No server components!
  → No SSR data fetching!
  → "Full client-side React!" — Scott

  Why skip?
  1. "Server components breaks mental models" — Scott
  2. Confusing if never dealt with before
  3. SSR = "hard topic, nobody really understands
     what's actually happening" — Scott
  4. GraphQL on server component = pointless!

  Why Next.js then?
  → "React recommends Next.js. The very first
     thing React docs say is download Next.js.
     So that's what we're doing." — Scott
```

---

## §3. TypeScript — "GPT Does My Types!"

> Scott: _"When do I use types? I don't like using types. I want them done for me. My number one use case for GPT is types. You'll see me not doing types in some places."_

```
TYPESCRIPT IN THIS COURSE:
═══════════════════════════════════════════════════════════════

  Scott's approach:
  → "I don't wanna make types. Seems like waste
     of time. But man, when they're there,
     they're so nice." — Scott

  → "My #1 use case for GPT is types." — Scott 😂

  → "There's no wrong answer for types.
     They're always optional." — Scott

  Rule: Types are OPTIONAL in this course!
  → Focus on GraphQL, not TypeScript!
```

---

## §4. Microservices + GraphQL — "One Schema, Many Services!"

> Scott: _"GraphQL will orchestrate all microservices into one schema. When you're on frontend, you won't even know that user, settings, and profile come from three different microservices."_

```
MICROSERVICES + GRAPHQL:
═══════════════════════════════════════════════════════════════

  Without GraphQL:
  Frontend → Service A: /api/users (REST!)
  Frontend → Service B: /api/settings (REST!)
  Frontend → Service C: /api/profile (gRPC!)
  → 3 different protocols!
  → 3 different auth methods!
  → 3 different response formats!

  With GraphQL:
  Frontend → GraphQL Gateway → Service A
                              → Service B
                              → Service C
  → 1 query, 1 schema, 1 endpoint!

  query {
    user(id: "1") {        ← from Service A!
      name
      settings {           ← from Service B!
        theme
      }
      profile {            ← from Service C!
        avatar
      }
    }
  }
  → "You won't even know these come from
     3 different microservices!" — Scott

  "One field can come from Stripe.
   Another field from another microservice.
   Another from database directly.
   Frontend has no idea." — Scott
```

---

## §5. CORS — "Preflight Check!"

> Scott: _"CORS = preflight check. Before you make request to server, browser goes check with OPTIONS request: what do you allow? Server responds with these headers."_

```
CORS EXPLAINED:
═══════════════════════════════════════════════════════════════

  1. Client wants to make request
  2. Browser sends OPTIONS request first (preflight!)
     → "Hey server, this client wants to talk to you.
        What do you allow?" — Scott
  3. Server responds with CORS headers:
     → Access-Control-Allow-Origin: *
     → Access-Control-Allow-Methods: POST, GET
     → Access-Control-Allow-Headers: Authorization
  4. Browser checks: client's request vs server's rules
  5. If allowed → real request goes through!

  "Sometimes you'll see TWO requests for every
   ONE request. That first one says OPTIONS.
   That's what CORS is." — Scott

  Production tip:
  → "Unless you have API for developers,
     limit to just your client URL.
     Don't do * in production." — Scott
```

---

## §6. Tại Sao Không GraphQL Trên Server Components?

> Scott: _"I can't reconcile why you would ever do GraphQL on server component when you can just go straight to database. Why leave the network and come back into same network?"_

```javascript
// ═══ SERVER COMPONENT + GRAPHQL = POINTLESS? ═══

// Server Component with GraphQL (unnecessary!):
// Server → Network → GraphQL API → Database
// → "Why leave the network, come back
//    into same network just to get data
//    when you're already there?" — Scott

// Server Component without GraphQL (better!):
// Server → Database directly!
// → "You can just make a database request.
//    Skip the network requests!" — Scott

// EXCEPTION:
// → GraphQL API hosted on THIRD PARTY (different server!)
// → Then you MUST use network request!
// → "Makes sense if GraphQL API is hosted
//    somewhere else. But in our example,
//    it doesn't." — Scott

// ═══ SUMMARY ═══

// In this course:
// → 'use client' everywhere!
// → GraphQL on CLIENT makes sense!
// → Client MUST use network (can't access DB!)
// → Server CAN access DB directly → skip GraphQL!

console.log("═══ NEXT.JS Q&A ═══");
console.log("() folders = share layout, no URL segment!");
console.log("SSR + Server Components = skipped!");
console.log("TypeScript = optional, 'GPT does my types'!");
console.log("Microservices: GraphQL = one schema for many services!");
console.log("CORS = browser preflight check (OPTIONS request!)");
console.log("Server Component + same-origin GraphQL = pointless!");
```

---

## Checklist

```
[ ] () folders = route groups (shared layout, no URL!)
[ ] SSR & Server Components: 100% skipped!
[ ] 'use client' everywhere in this course!
[ ] GraphQL on server component (same origin) = pointless!
[ ] TypeScript: optional, "GPT does my types!"
[ ] Microservices + GraphQL = one schema, many services!
[ ] Frontend doesn't know which service provides data!
[ ] CORS = preflight OPTIONS check!
[ ] Production: don't use * for CORS origin!
TIẾP THEO → Phần 9: Creating a Sign Up Mutation!
```
