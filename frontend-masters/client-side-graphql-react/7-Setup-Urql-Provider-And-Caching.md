# Client-Side GraphQL with React, v2 — Phần 7: Setup Urql Provider & Caching — "Normalized Cache = Automatic Redux!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: Setup Urql Provider & Caching — "Apollo = Angular of GraphQL (complex, intimidating docs). Urql = lightweight, same features, simpler API. GraphQL client = wrapper around fetch with hooks + normalized caching. Cache exchange = automatic Redux! Provider shares cache across all components like React Context. 'use client' everywhere — SSR + server components irrelevant for this course. Provider priority: third-party outside, yours inside!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — GraphQL client setup, caching, provider pattern!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | Tại Sao Cần GraphQL Client?                              |
| 2   | Apollo vs Urql — "Angular of GraphQL!"                   |
| 3   | Normalized Caching — "Automatic Redux!"                  |
| 4   | Provider Pattern — "Share Cache via Context!"            |
| 5   | SSR vs Server Components — "use client!"                 |
| 6   | Provider Priority — "Third-Party Outside, Yours Inside!" |
| 7   | Tự Code: Build GQL Provider from Scratch                 |

---

## §1. Tại Sao Cần GraphQL Client?

> Scott: _"What is a GraphQL client? It's a wrapper around fetch, but it does a bunch of stuff. It gives us hooks for React. If you've used React Query or SWR, it's like that but for GraphQL."_

```
GRAPHQL CLIENT:
═══════════════════════════════════════════════════════════════

  Plain fetch:
  → You write: fetch + POST + JSON.stringify
  → You handle: caching, auth, errors, re-fetching
  → No React hooks
  → No cache sharing between components

  GraphQL Client (Urql/Apollo):
  → Wrapper around fetch!
  → React hooks: useQuery, useMutation!
  → Normalized caching (like Redux!)
  → Auth token injection
  → Error handling
  → Optimistic updates
  → Cache sharing across all components!

  "It's basically React Query or SWR but for GraphQL.
   The biggest difference is normalized caching." — Scott
```

---

## §2. Apollo vs Urql — "Angular of GraphQL!"

> Scott: _"Apollo is useful and good, but the terms they use are off-putting. It's the Angular of GraphQL. Urql is more lightweight, same features, simpler API, docs not as intimidating."_

```
APOLLO vs URQL:
═══════════════════════════════════════════════════════════════

  Apollo:
  ├── "Probably the best one you can use" — Scott
  ├── But complex! "Angular of GraphQL!" — Scott
  ├── Confusing terms for beginners
  ├── "Docs like Google's SDK docs —
  │    most terrifying thing." — Scott
  ├── Huge company (billion dollar!)
  └── "Not the best to use when starting to learn"

  Urql (pronounced "Er-kull"!):
  ├── Lightweight client
  ├── Same features as Apollo!
  ├── Simpler API to digest
  ├── Docs not intimidating
  ├── "That's too clever for it not to be
  │    pronounced that way" — Scott 😂
  └── Perfect for learning!

  Terminology mapping:
  | Apollo      | Urql        | What it is      |
  |-------------|-------------|-----------------|
  | Link        | Exchange    | Plugin! 🔌      |
  | InMemoryCache | cacheExchange | Cache! 📦   |
  | ApolloProvider | Provider | Context wrapper!|
```

---

## §3. Normalized Caching — "Automatic Redux!"

> Scott: _"Cache exchange is basically Redux. It's automatic Redux for all your entities from GraphQL queries. It'll figure out where they need to go and store them in a Redux way and do updates."_

```
NORMALIZED CACHING:
═══════════════════════════════════════════════════════════════

  WITHOUT normalized cache (React Query/SWR):
  Request-based caching!
  Cache key: "GET /api/todos" → full response!
  → Change 1 todo? Rewrite ENTIRE cache for that request!
  → "You have to rewrite the cache on a request basis.
     For this whole request, rewrite this cache." — Scott

  WITH normalized cache (Urql/Apollo):
  Entity-based caching!
  Cache stores each entity by type + ID!
  Todo:1 → { id: 1, title: "Buy milk", done: false }
  Todo:2 → { id: 2, title: "Code", done: true }
  → Change 1 todo? Only update THAT entity!
  → "Maybe I don't wanna rewrite the whole request.
     I just wanna change THIS ONE todo." — Scott

  ┌─── Request-based Cache ───┐
  │ "getIssues" → [           │
  │   { id:1, title:"A" },    │  ← Replace ALL
  │   { id:2, title:"B" },    │     to update one!
  │   { id:3, title:"C" }     │
  │ ]                          │
  └────────────────────────────┘

  ┌─── Normalized Cache ──────┐
  │ Issue:1 → { title:"A" }   │  ← Update just
  │ Issue:2 → { title:"B" }   │     Issue:2! ✅
  │ Issue:3 → { title:"C" }   │
  └────────────────────────────┘

  "Most people don't really need it.
   But we get it for free." — Scott
```

---

## §4. Provider Pattern — "Share Cache via Context!"

> Scott: _"Why do we need a provider? For caching. If we make a new client every time, then we get a new Redux every time. We want the whole app to share the same cache."_

```
WHY PROVIDER:
═══════════════════════════════════════════════════════════════

  Without Provider:
  Component A → creates client → own cache
  Component B → creates client → own cache
  Component C → creates client → own cache
  → 3 separate caches! No sharing! 💀

  With Provider:
  <GQLProvider> → creates 1 client → 1 cache!
    <Component A /> → uses shared cache ✅
    <Component B /> → uses shared cache ✅
    <Component C /> → uses shared cache ✅
  </GQLProvider>

  "Like useReducer. It's local Redux for a component.
   To work across app, put in context.
   Otherwise, how would they share?" — Scott

  React Context = props that don't need to be passed down!
  Any component can access the cache! ✅
```

---

## §5. SSR vs Server Components — "'use client'!"

> Scott: _"There's a difference between server components and SSR. By doing 'use client', I opt out of server components, but this component still does SSR."_

```
SSR vs SERVER COMPONENTS:
═══════════════════════════════════════════════════════════════

  'use client' directive:
  → ❌ Opts out of Server Components
  → ✅ Still does SSR (server-side rendering!)
  → "If I throw 'window' in here, it WILL break.
     It gets rendered on server." — Scott

  Why 'use client' everywhere:
  1. Focus on client-side GraphQL!
  2. Avoid Next.js-specific complexity!
  3. "I don't think it makes sense to do
     GraphQL on server component on same API.
     You can just talk to database directly,
     skip network requests!" — Scott
  4. Can apply to ANY React app! ✅

  SSR cache transfer:
  → ssrExchange ensures cache transfers
     from server render → client hydration!
  → "If I didn't have this, cache would be lost
     on hydration." — explained by Scott

  Server-side: new client per request!
  → "Otherwise all users share same cache
     = security risk!" — Scott
  → Client-side: one client for whole app! ✅
```

---

## §6. Provider Priority — "Third-Party Outside, Yours Inside!"

> Scott: _"I put my GQLProvider inside the component library's provider. If I wrapped it outside, it could conflict. Always get as close to children as possible. Nobody talks about this, but it's real."_

```
PROVIDER PRIORITY:
═══════════════════════════════════════════════════════════════

  ✅ CORRECT:
  <ThirdPartyProvider>     ← outside (unknown!)
    <GQLProvider>          ← inside (yours!)
      {children}           ← your app!
    </GQLProvider>
  </ThirdPartyProvider>

  ❌ WRONG:
  <GQLProvider>            ← outside (yours!)
    <ThirdPartyProvider>   ← inside (unknown!)
      {children}
    </ThirdPartyProvider>
  </GQLProvider>

  Why?
  → Third-party might use Urql internally!
  → Your context could conflict!
  → "Those are the hardest bugs to track down.
     It won't break. It just won't behave
     the way you thought." — Scott 💀

  Rule: "Always try to get as close to children
   as possible with my providers. Keep third-party
   outside mine." — Scott
```

---

## §7. Tự Code: Build GQL Provider from Scratch

```javascript
// ═══ GQL PROVIDER — CÁCH URQL HOẠT ĐỘNG ═══

// "Cache exchange = Redux.
//  Exchanges = plugins.
//  useMemo = same client for whole app.
//  Provider = share cache via Context." — Scott

// ═══ STEP 1: Tự viết GraphQL Client (không Urql!) ═══

class GraphQLClientWithCache {
  #url;
  #cache;
  #tokenGetter;

  constructor(url, tokenGetter) {
    this.#url = url;
    this.#cache = new Map(); // normalized cache!
    this.#tokenGetter = tokenGetter;
  }

  // Normalized cache: store by type + id!
  #updateCache(data, queryName) {
    if (!data) return;

    const result = data[queryName];
    if (Array.isArray(result)) {
      result.forEach((entity) => {
        if (entity.id) {
          // Store each entity separately! Like Redux!
          const cacheKey = `${queryName}:${entity.id}`;
          this.#cache.set(cacheKey, entity);
        }
      });
    } else if (result?.id) {
      const cacheKey = `${queryName}:${result.id}`;
      this.#cache.set(cacheKey, result);
    }

    // Also cache full query result:
    this.#cache.set(`query:${queryName}`, data);
  }

  #getFromCache(queryName) {
    return this.#cache.get(`query:${queryName}`) || null;
  }

  async request(query, variables = {}, options = {}) {
    const queryName = this.#extractQueryName(query);

    // Check cache first (for queries, not mutations!):
    if (!options.skipCache && queryName) {
      const cached = this.#getFromCache(queryName);
      if (cached) return cached;
    }

    const headers = {
      "Content-Type": "application/json",
    };

    // Auto-inject auth token!
    const token = this.#tokenGetter();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(this.#url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    // Always 200! Check payload!

    if (result.errors) {
      return { data: null, error: result.errors };
    }

    // Update normalized cache:
    if (queryName) {
      this.#updateCache(result.data, queryName);
    }

    return { data: result.data, error: null };
  }

  #extractQueryName(query) {
    const match = query.match(/(?:query|mutation)\s+(\w+)/);
    return match ? match[1] : null;
  }

  getEntity(type, id) {
    return this.#cache.get(`${type}:${id}`);
  }

  invalidate(queryName) {
    this.#cache.delete(`query:${queryName}`);
  }

  clearCache() {
    this.#cache.clear();
  }
}

// ═══ STEP 2: React Context Provider ═══

// Vanilla React Context (no Urql!):
// (Ý tưởng giống hệt Urql Provider!)

/*
  // React code (for reference):
  import { createContext, useContext, useMemo } from 'react';

  const GQLContext = createContext(null);

  function GQLProvider({ children }) {
    // useMemo: same client for whole app!
    // "If we make new client every time,
    //  new Redux every time." — Scott
    const client = useMemo(() => {
      return new GraphQLClientWithCache(
        getUrl(),           // localhost:3000/api/graphql
        getToken            // from localStorage!
      );
    }, []); // Empty deps = create once!

    return (
      <GQLContext.Provider value={client}>
        {children}
      </GQLContext.Provider>
    );
  }

  // Custom hooks (like Urql's useQuery/useMutation!):
  function useGQLClient() {
    return useContext(GQLContext);
  }
*/

// ═══ STEP 3: Urql Exchanges Explained ═══

// Exchanges = plugins (not a weird name for nothing!)
// Apollo calls them "links" — same concept!

// cacheExchange → normalized cache (Redux!)
// → Stores each entity by __typename + id
// → Updates across all queries automatically!
// → "Why do they call it exchange? I don't know.
//    It's just a plugin." — Scott

// ssrExchange → cache transfer (server → client!)
// → Ensures cache survives hydration
// → "Makes sure this doesn't break on server" — Scott

// fetchExchange → use window.fetch!
// → "If you didn't want fetch, use Axios
//    or custom HTTP library, make an exchange." — Scott

// ═══ STEP 4: fetchOptions (auth token!) ═══

// fetchOptions = options passed to every fetch call!
// → Auto-inject auth token!
// → "We wanna send JWT on every single request" — Scott

function buildFetchOptions(getToken) {
  return () => {
    const token = getToken();
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return {};
  };
}

// "If you use cookies, you won't have to do this." — Scott
// "In production, store JWT in secure
//  HTTP-only cookie." — Scott

console.log("═══ URQL PROVIDER SETUP ═══");
console.log("Urql = lightweight Apollo alternative!");
console.log("cacheExchange = normalized cache = 'automatic Redux'!");
console.log("ssrExchange = cache transfer server → client!");
console.log("fetchExchange = use window.fetch!");
console.log("useMemo = same client for whole app!");
console.log("Provider = share cache via React Context!");
console.log("Provider priority: third-party outside, yours inside!");
```

---

## 📖 Deep Dive: Normalized Cache vs Document Cache

### Document Cache (React Query, SWR)

Request-based: mỗi query URL/key → toàn bộ response. Đơn giản nhưng khi update 1 entity, bạn phải invalidate toàn bộ query chứa entity đó.

### Normalized Cache (Urql, Apollo)

Entity-based: mỗi entity (có `__typename` + `id`) được lưu riêng. Update 1 entity → tất cả queries chứa entity đó tự động cập nhật. Đây là "automatic Redux" mà Scott nói.

Scott thừa nhận: _"Most people don't even really need it."_ Nhưng khi app phức tạp (nhiều views cùng hiển thị data giống nhau), normalized cache giúp **consistency** — update issue ở 1 chỗ, tất cả chỗ khác tự cập nhật.

---

## Checklist

```
[ ] GraphQL Client = fetch wrapper + hooks + cache!
[ ] Urql (Er-kull!): lightweight Apollo alternative!
[ ] Apollo = "Angular of GraphQL" — great but complex!
[ ] cacheExchange = normalized cache = "automatic Redux!"
[ ] ssrExchange = cache transfer server → client!
[ ] fetchExchange = use window.fetch!
[ ] useMemo: same client for whole app (create once!)!
[ ] Provider: share cache via React Context!
[ ] 'use client': opt out server components, keep SSR!
[ ] Provider priority: third-party outside, yours inside!
[ ] fetchOptions: auto-inject JWT on every request!
[ ] Production: JWT in HTTP-only cookie, not localStorage!
TIẾP THEO → Phần 8: Next.js & Q&A!
```
