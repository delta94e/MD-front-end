# Client-Side GraphQL with React, v2 — Phần 12: Wiring Queries, Refreshing & Optimistic Updates

> 📅 2026-03-09 · ⏱ 50 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Bài: Wiring Queries to the UI + Refreshing Issues + Optimistic Updates — "Create mutation, input wrapping, error handling, replay refetch, optimistic cache, 3 caching strategies"
> Độ khó: ⭐️⭐️⭐️⭐️ | Intermediate-Advanced — Mutation lifecycle, caching strategies!

---

## Mục Lục

| #   | Phần                                                               |
| --- | ------------------------------------------------------------------ |
| 1   | Create Issue Mutation — "Mutation + Modal + Reset State!"          |
| 2   | Input Wrapping — "Variable $input vs Direct Arguments!"            |
| 3   | Error Handling — "Type Safety Catches Everything!"                 |
| 4   | SDL Schema — "Schema Definition Language!"                         |
| 5   | Introspection — "Auto-Generated Documentation!"                    |
| 6   | Refreshing Queries — "replay() After Mutation!"                    |
| 7   | 3 Caching Strategies — "Refetch vs Cache Write vs Optimistic!"     |
| 8   | Optimistic Updates Deep Dive — "Show Before Confirm!"              |
| 9   | Tự Code: Mutation Manager + Cache + Optimistic System from Scratch |
| 10  | Deep Dive: Tại Sao Caching Là Bài Toán Khó Nhất?                   |

---

## §1. Create Issue Mutation — "Mutation + Modal + Reset State!"

> Scott: _"Not only do we wanna create an issue, we want it to show up on the page immediately. And there's a lot of ways you can do that."_

```
CREATE ISSUE FLOW:
═══════════════════════════════════════════════════════════════

  User clicks "New Issue" → Modal opens!
  ┌──────────────────────────┐
  │ Issue Name: [__________] │
  │ Description: [________]  │
  │ [Create Issue]           │
  └──────────────────────────┘
       │
       ▼
  createIssue mutation fires!
       │
       ├── Success? → Close modal + Reset state + Refetch!
       │
       └── Error? → Show error message!

  LIFECYCLE:
  1. User typed issue name + description (bound to state!)
  2. onClick → call createIssue(input: { name, content })
  3. If result.data → close modal, reset issueName + issueDescription
  4. If result.error → console.error(result.error)
  5. Refetch issues list → show new issue on page!
```

```
CÁCH TIẾP CẬN CỦA SCOTT:
═══════════════════════════════════════════════════════════════

  Có 2 cách update UI sau mutation:

  1. LIBRARY-SPECIFIC (Redux-like):
     → Dùng tính năng cache của urql/Apollo
     → Viết logic update cache manually
     → "Very specific to the library" — Scott
     → "Quite complicated" — normalized caching!

  2. REFETCH (React Query style):
     → Chạy lại query sau mutation
     → "Much simpler" — Scott
     → "Refresh the whole query" — thô nhưng đơn giản!

  Scott chọn approach 2:
  "I'm gonna show you how to do it outside of the library.
   Knowing the mentality is more useful than walking through
   how the framework would do it." — Scott
```

### Code Implementation:

```javascript
// ═══ Step 1: Tạo mutation file ═══
// gql/createIssueMutation.ts

import { gql } from "@urql/next";

export const CreateIssueMutation = gql`
  mutation CreateIssueMutation($input: CreateIssueInput!) {
    createIssue(input: $input) {
      id
      name
      status
    }
  }
`;

// ⚠️ Tên mutation "CreateIssueMutation" — unique!
// "Think of JavaScript in 2005 where everything
//  was in global. You don't want operations
//  to have the same name." — Scott
```

```javascript
// ═══ Step 2: Dùng trong Dashboard Page ═══
// app/dashboard/page.tsx

"use client";

import { useQuery, useMutation } from "@urql/next";
import { issuesQuery } from "@/gql/IssuesQuery";
import { CreateIssueMutation } from "@/gql/createIssueMutation";

export default function DashboardPage() {
  // Query — fires immediately!
  const [{ data, error, fetching }, replay] = useQuery({
    query: issuesQuery,
  });

  // Mutation — fires on demand!
  const [createResult, createIssue] = useMutation(CreateIssueMutation);

  // State for modal:
  const [issueName, setIssueName] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const onCreate = async () => {
    // ⚠️ PHẢI wrap trong { input: { ... } }!
    const result = await createIssue({
      input: {
        // ← Object with "input" key!
        name: issueName,
        content: issueDescription,
      },
    });

    if (result.error) {
      console.error(result.error);
      return;
    }

    if (result.data) {
      await replay(); // ← Refetch issues!
      closeModal(); // ← Close modal!
      setIssueName(""); // ← Reset state!
      setIssueDescription(""); // ← Reset state!
    }
  };

  // ... render ...
}
```

---

## §2. Input Wrapping — "Variable $input vs Direct Arguments!"

> Scott: _"I forgot to call the actual variable input. It's very strict, right? So I just put an object in here, but really what it wants, it wants input, and then it wants an object."_

```
INPUT WRAPPING — LỖI THƯỜNG GẶP!
═══════════════════════════════════════════════════════════════

  ❌ SAI — truyền trực tiếp:
  const result = await createIssue({
    name: "Bug fix",
    content: "Fix the login bug"
  });
  → Error: "Variable $input of required type
     CreateIssueInput was not provided!"

  ✅ ĐÚNG — wrap trong { input: { ... } }:
  const result = await createIssue({
    input: {                         // ← PHẢI CÓ "input"!
      name: "Bug fix",
      content: "Fix the login bug"
    }
  });

  TẠI SAO?

  Schema says:
  mutation CreateIssueMutation($input: CreateIssueInput!) {
    createIssue(input: $input) { ... }
  }          ↑
             └── argument name = "input"
                 → variables PHẢI match argument name!

  $input → maps to → createIssue(input: $input)
  → Client PHẢI gửi: { input: { name, content } }
  → Không phải: { name, content }!
```

```
GRAPHQL VARIABLE MAPPING:
═══════════════════════════════════════════════════════════════

  Mutation definition:
  mutation DoSomething($input: SomeType!) {
    doSomething(input: $input) { ... }
  }
       ↑               ↑
       │               └── Server argument name
       └── Client variable name

  Client sends:
  {
    "query": "mutation DoSomething($input: ...) { ... }",
    "variables": {
      "input": { "name": "...", "content": "..." }
    }                ↑
                     └── PHẢI MATCH $input!
  }

  Nếu mutation có nhiều arguments:
  mutation Create($name: String!, $age: Int!) {
    createUser(name: $name, age: $age) { id }
  }

  Client sends:
  { variables: { name: "Scott", age: 30 } }
  → Mỗi $variable PHẢI có trong variables object!
```

---

## §3. Error Handling — "Type Safety Catches Everything!"

> Scott: _"It's pretty damn specific about what you messed up on. You can't miss it. I didn't have to write that code, that error message, that type checking is done for free because that's what the schema says."_

```
GRAPHQL ERROR HANDLING:
═══════════════════════════════════════════════════════════════

  HTTP Status: ALWAYS 200! ← Khác REST!
  → GraphQL KHÔNG dùng HTTP status codes!
  → Error nằm trong body, KHÔNG phải status!

  Response structure:
  {
    "data": null,           ← null khi error!
    "errors": [
      {
        "message": "Variable $input of required type
                    CreateIssueInput was not provided",
        "locations": [{ "line": 1, "column": 1 }],
        "path": ["createIssue"]
      }
    ]
  }

  ⚠️ "It still gave me a 200, right?
      So you have to look at the error messages." — Scott

  Trong urql:
  const result = await createIssue({ ... });
  if (result.error) {
    console.error(result.error);
    // → CombinedError: Variable $input of required type...
  }

  "I didn't have to write that code, that error message,
   that type checking is done for free because that's
   what the schema says." — Scott
```

```
SO SÁNH ERROR HANDLING:
═══════════════════════════════════════════════════════════════

  REST:
  → HTTP 400 Bad Request
  → Body: { "error": "Name is required" }
  → Backend developer PHẢI viết validation code!
  → Mỗi endpoint validate khác nhau!

  GraphQL:
  → HTTP 200 OK
  → Body: { "errors": [{ "message": "..." }] }
  → Validation TỰ ĐỘNG từ schema!
  → Thống nhất format cho mọi query/mutation!
  → "You can't miss it, it's there." — Scott
```

---

## §4. SDL Schema — "Schema Definition Language!"

> Scott: _"I just call it the GraphQL schema, but I think it's called the SDL, Schema Definition Language."_

```
SDL SCHEMA — CÁI NHÌ TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  # Đây là SDL — Schema Definition Language!
  # "Nobody calls it that. It's just a GraphQL schema." — Scott

  type Query {
    issues(input: IssuesFilterInput): [Issue!]!
    me: User!
  }

  type Mutation {
    createIssue(input: CreateIssueInput!): Issue!
    editIssue(input: EditIssueInput!): Issue!
    deleteIssue(id: ID!): ID!
    createUser(input: AuthInput!): AuthPayload!
    signin(input: AuthInput!): AuthPayload!
  }

  type Issue {
    id: ID!
    name: String!
    content: String!
    status: IssueStatus!
    createdAt: String!
    user: User!
  }

  type User {
    id: ID!
    email: String!
    issues: [Issue!]!
  }

  enum IssueStatus {
    BACKLOG
    TODO
    INPROGRESS
    DONE
  }

  input CreateIssueInput {
    name: String!           ← required!
    content: String!        ← required!
  }

  input IssuesFilterInput {
    statuses: [IssueStatus] ← optional!
  }

  "If you go to schema.ts, the one on GraphQL,
   not the one on DB, it's here. You can see it,
   it's a GraphQL schema." — Scott
```

---

## §5. Introspection — "Auto-Generated Documentation!"

> Scott: _"If you use Apollo Studio or anything like this, it'll do introspection on the schema and pull it down. It basically creates documentation for you."_

```
INTROSPECTION FLOW:
═══════════════════════════════════════════════════════════════

  Apollo Studio                    GraphQL Server
       │                                │
       │── Introspection Query ───────→│
       │   (built-in GraphQL feature!) │
       │                                │
       │←── Full Schema ────────────────│
       │   (all types, fields, args!)  │
       │                                │
       ├── Generate documentation!      │
       ├── Create Explorer UI!          │
       ├── Autocomplete fields!         │
       └── Validate queries!            │

  "You can put any GraphQL URL here, as long as it's
   public or if you have any headers. As long as that
   API has introspection enabled, it will send down
   all of its types and objects." — Scott

  Introspection query (built-in!):
  query {
    __schema {
      types { name fields { name type { name } } }
      queryType { name }
      mutationType { name }
    }
  }

  → GraphQL server TỰ trả lời về cấu trúc schema!
  → Không cần documentation riêng!
```

```
FEDERATION — GRAPHQL APIS NÓI CHUYỆN VỚI NHAU:
═══════════════════════════════════════════════════════════════

  Service A (Users)     Service B (Issues)     Service C (Billing)
       │                      │                       │
       └──────────┬───────────┘                       │
                  ▼                                    │
           GraphQL Gateway ←──────────────────────────┘
                  │
        Federated Schema!
        (Stitch schemas together!)
                  │
                  ▼
             Client App

  "GraphQL APIs can talk to each other and understand
   each other by introspecting each other. Backend,
   there's a whole other world. Frontend is just,
   query language, that's cool. Backend, it's a graph,
   it's literally a graph. So it gets kinda crazy." — Scott
```

---

## §6. Refreshing Queries — "replay() After Mutation!"

> Scott: _"You would just say, cool, just rerun that GET request that got all the todos again. Because this time, it should be whatever it was plus the one I just created."_

```
REPLAY REFETCH:
═══════════════════════════════════════════════════════════════

  TRƯỚC replay():
  ┌──────────────────────────────┐
  │ Issues List:                 │
  │  • Fix login bug  [BACKLOG] │
  │  • Add dark mode  [TODO]    │
  │                              │   ← Vừa tạo "Clean hoodies"
  │  [New Issue]                 │      nhưng KHÔNG thấy trên page!
  └──────────────────────────────┘

  SAU replay():
  ┌──────────────────────────────┐
  │ Issues List:                 │
  │  • Fix login bug  [BACKLOG] │
  │  • Add dark mode  [TODO]    │
  │  • Clean hoodies [BACKLOG]  │   ← HIỆN RỒI! ✅
  │                              │
  │  [New Issue]                 │
  └──────────────────────────────┘

  Code:
  const [{ data, error, fetching }, replay] = useQuery({
    query: issuesQuery,
  });
                                        ↑
  const onCreate = async () => {     replay!
    const result = await createIssue({ input: { ... } });
    if (result.data) {
      await replay();     // ← Rerun issuesQuery! Network request!
      closeModal();       // ← Close modal!
    }
  };

  "This function right here, that's what it's here for.
   If you just call it, it'll rerun this whole query again." — Scott
```

```
REPLAY LIFECYCLE:
═══════════════════════════════════════════════════════════════

  User clicks "Create Issue"
       │
  ┌────▼────────────────┐
  │ createIssue mutation │ ── POST /graphql (mutation)
  └────┬────────────────┘
       │ success!
  ┌────▼────────────────┐
  │ await replay()       │ ── POST /graphql (query!)
  └────┬────────────────┘    ↑
       │                     2nd network request!
       ▼
  fetching = true → Spinner hiện!
  data = new issues array → List re-render!
  fetching = false → Spinner ẩn!

  "It goes through all the states, it goes through
   the loading again, checks for error again." — Scott
```

---

## §7. 3 Caching Strategies — "Refetch vs Cache Write vs Optimistic!"

> Scott: _"Is it the most optimal way? Probably not. The most optimal way would be using an optimistic update."_

```
3 CACHING STRATEGIES (TỐT → TỐT HƠN → TỐT NHẤT):
═══════════════════════════════════════════════════════════════

  STRATEGY 1: REFETCH (Đơn giản nhất!)
  ──────────────────────────────────────
  Create → Wait server → replay() → UI updates!

  Timeline:
  [Click] → [Server processing 200ms] → [Refetch 200ms] → [Show!]
  Total: ~400ms

  ✅ Pros: Đơn giản! Data luôn fresh!
  ❌ Cons: 2 network requests! Chậm hơn!
  ❌ Cons: Không dùng được với pagination!
     "If you have pagination, you wouldn't wanna
      refetch all the pages for one new thing." — Scott


  STRATEGY 2: CACHE WRITE (Balanced!)
  ──────────────────────────────────────
  Create → Wait server → Write result to cache → UI updates!

  Timeline:
  [Click] → [Server processing 200ms] → [Cache write 1ms] → [Show!]
  Total: ~201ms

  ✅ Pros: 1 network request! Vẫn đợi server confirm!
  ✅ Pros: Show skeleton/shimmer while loading!
  ❌ Cons: Phải viết cache update logic!
  → "Wait for the server to come back, and then write
     that result to the cache." — Scott


  STRATEGY 3: OPTIMISTIC UPDATE (Nhanh nhất!)
  ──────────────────────────────────────
  Create → Immediately show on UI → Server confirms later!

  Timeline:
  [Click] → [Show immediately!] → [Server confirms in background]
  Total: ~0ms perceived!

  ✅ Pros: Instant! Best UX!
  ❌ Cons: Nếu server error → phải rollback! Jarring!
  ❌ Cons: Phải generate fake data (missing ID!)
  ❌ Cons: Background loading có thể block interactions!
  → "Optimistic updates are like, you have the utmost
     level of confidence, and you just know that things
     are gonna work out." — Scott
```

```
VISUAL COMPARISON:
═══════════════════════════════════════════════════════════════

  REFETCH (Strategy 1):
  User sees: [Click] → [Spinner ⏳] → [New item appears!]
  Network:   ─────── mutation ──→ ←── query ──→

  CACHE WRITE (Strategy 2):
  User sees: [Click] → [Skeleton 💀] → [New item appears!]
  Network:   ─────── mutation ──→ (write to cache! no 2nd request!)

  OPTIMISTIC (Strategy 3):
  User sees: [Click] → [Item appears instantly!]
  Network:   ─────── mutation ──→ (confirm or rollback!)

  Scott's recommendation:
  "I think cache write is the next intermediate step.
   Wait for server, write to cache. The third best
   is what we did, refetch." — Scott
```

---

## §8. Optimistic Updates Deep Dive — "Show Before Confirm!"

> Scott: _"That's like you at your bank and you go initiate a transfer, and the money leaves your account, but then something happens, so it immediately reverted back. You'd be very confused."_

```
OPTIMISTIC UPDATE — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  Step 1: User clicks "Create Issue"
  ┌─────────────────────────────────────┐
  │ Immediately create FAKE issue:      │
  │ {                                   │
  │   id: "temp-123",     ← fake ID!   │
  │   name: "Clean hoodies", ← known!  │
  │   content: "...",     ← known!     │
  │   status: "BACKLOG",  ← default!   │
  │ }                                   │
  │ → Insert into cache!               │
  │ → UI updates INSTANTLY!             │
  └─────────────────────────────────────┘

  Step 2: Server responds (in background!)
  ├── SUCCESS:
  │   Server returns: { id: "real-456", name: "Clean hoodies", ... }
  │   → Diff: chỉ khác ID!
  │   → Replace temp-123 → real-456!
  │   → User thấy KHÔNG có gì thay đổi! ← Smooth!
  │
  └── ERROR:
      Server returns: { errors: [...] }
      → ROLLBACK! Remove fake issue from cache!
      → User thấy item biến mất! ← Jarring! 💀
      → "A really shitty experience to see something
         and then it immediately reverted back." — Scott
```

### Tại Sao Scott Không Khuyên Optimistic Updates?

Scott đưa ra 3 lý do:

1. **Rollback UX tệ:** Giống chuyển tiền ngân hàng — tiền đi rồi quay lại, user confused!
2. **Background loading blocking:** Dù UI hiện data, mutation vẫn loading → có thể block interactions mà user không biết!
3. **Không có loading indicator:** "How would the user know something is loading? You just threw something on screen and it's loading in the background."

> _"If used right and used well, I think they're the best, but you have to invest in them."_ — Scott

```
KHI NÀO DÙNG OPTIMISTIC UPDATES:
═══════════════════════════════════════════════════════════════

  ✅ DÙNG khi:
  → Like/Unlike button (toggle đơn giản!)
  → Star/Favorite (server gần như chắc chắn thành công!)
  → Read/Unread marking
  → Position reordering (drag & drop)
  → Các action có tỉ lệ thành công 99.9%!

  ❌ KHÔNG DÙNG khi:
  → Thanh toán / Financial transactions!
  → Delete actions (không thể undo dễ dàng!)
  → Complex create (nhiều validation!)
  → Bất kỳ thứ gì user thấy confused nếu rollback!
```

---

## §9. Tự Code: Mutation Manager + Cache + Optimistic System from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: MUTATION MANAGER VỚI 3 STRATEGIES
// ═══════════════════════════════════════════════════════════

class MutationManager {
  constructor(client) {
    this.client = client;
    this._cache = new Map(); // Normalized cache!
    this._subscribers = new Set(); // UI updaters!
  }

  // ═══ STRATEGY 1: Refetch ═══
  async mutateAndRefetch(mutation, variables, refetchQuery, refetchVars = {}) {
    // Step 1: Execute mutation
    const result = await this.client.query(mutation, variables);
    if (result.errors) throw new Error(result.errors[0].message);

    // Step 2: Refetch the query (2nd network request!)
    const freshData = await this.client.query(refetchQuery, refetchVars, {
      skipCache: true,
    });
    this._notifyUI(freshData.data);

    return result;
  }

  // ═══ STRATEGY 2: Cache Write ═══
  async mutateAndCacheWrite(mutation, variables, cacheKey, updateFn) {
    // Step 1: Execute mutation
    const result = await this.client.query(mutation, variables);
    if (result.errors) throw new Error(result.errors[0].message);

    // Step 2: Update local cache with server response!
    const currentCache = this._cache.get(cacheKey) || [];
    const newCache = updateFn(currentCache, result.data);
    this._cache.set(cacheKey, newCache);

    // Step 3: Notify UI!
    this._notifyUI({ [cacheKey]: newCache });

    return result;
  }

  // ═══ STRATEGY 3: Optimistic Update ═══
  async mutateOptimistic(
    mutation,
    variables,
    cacheKey,
    optimisticData,
    updateFn,
  ) {
    // Step 1: IMMEDIATELY update cache with fake data!
    const currentCache = this._cache.get(cacheKey) || [];
    const optimisticCache = [...currentCache, optimisticData];
    this._cache.set(cacheKey, optimisticCache);
    this._notifyUI({ [cacheKey]: optimisticCache });

    try {
      // Step 2: Execute mutation (in background!)
      const result = await this.client.query(mutation, variables);
      if (result.errors) throw new Error(result.errors[0].message);

      // Step 3: Replace fake data with real data!
      const realCache = updateFn(currentCache, result.data);
      this._cache.set(cacheKey, realCache);
      this._notifyUI({ [cacheKey]: realCache });

      return result;
    } catch (error) {
      // ROLLBACK! Put back original cache!
      this._cache.set(cacheKey, currentCache);
      this._notifyUI({ [cacheKey]: currentCache });
      throw error;
    }
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  _notifyUI(data) {
    this._subscribers.forEach((cb) => cb(data));
  }
}

// ═══ Usage ═══
const manager = new MutationManager(client);

// Strategy 1 — Refetch:
await manager.mutateAndRefetch(
  CREATE_ISSUE,
  { input: { name: "Bug", content: "Fix it" } },
  GET_ISSUES, // ← Refetch this query!
);

// Strategy 2 — Cache Write:
await manager.mutateAndCacheWrite(
  CREATE_ISSUE,
  { input: { name: "Bug", content: "Fix it" } },
  "issues",
  (cache, serverData) => [...cache, serverData.createIssue],
);

// Strategy 3 — Optimistic:
await manager.mutateOptimistic(
  CREATE_ISSUE,
  { input: { name: "Bug", content: "Fix it" } },
  "issues",
  {
    id: "temp-" + Date.now(),
    name: "Bug",
    content: "Fix it",
    status: "BACKLOG",
  },
  (cache, serverData) => [
    ...cache.filter((i) => !i.id.startsWith("temp-")), // Remove fake!
    serverData.createIssue, // Add real!
  ],
);
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: NORMALIZED CACHE (simplified version!)
// ═══════════════════════════════════════════════════════════

class NormalizedCache {
  constructor() {
    // Mỗi entity type = 1 collection!
    // Giống urql's Graphcache!
    this._entities = new Map(); // "Issue:123" → { id, name, status }
    this._queries = new Map(); // "issues" → ["Issue:1", "Issue:2"]
    this._subscribers = new Set();
  }

  // ═══ Write entity vào cache ═══
  writeEntity(typeName, entity) {
    const key = `${typeName}:${entity.id}`;
    const existing = this._entities.get(key);

    if (existing) {
      // MERGE! Real data overrides cached data!
      this._entities.set(key, { ...existing, ...entity });
    } else {
      this._entities.set(key, entity);
    }

    this._notify();
    return key;
  }

  // ═══ Write query result vào cache ═══
  writeQuery(queryName, typeName, entities) {
    const keys = entities.map((e) => this.writeEntity(typeName, e));
    this._queries.set(queryName, keys);
    this._notify();
  }

  // ═══ Read query from cache ═══
  readQuery(queryName) {
    const keys = this._queries.get(queryName);
    if (!keys) return null;
    return keys.map((k) => this._entities.get(k)).filter(Boolean);
  }

  // ═══ Read single entity ═══
  readEntity(typeName, id) {
    return this._entities.get(`${typeName}:${id}`) || null;
  }

  // ═══ Update entity (triggers UI update!) ═══
  updateEntity(typeName, id, updates) {
    const key = `${typeName}:${id}`;
    const existing = this._entities.get(key);
    if (existing) {
      this._entities.set(key, { ...existing, ...updates });
      this._notify();
    }
  }

  // ═══ Remove entity ═══
  removeEntity(typeName, id) {
    const key = `${typeName}:${id}`;
    this._entities.delete(key);

    // Remove from all query results:
    for (const [qName, keys] of this._queries) {
      this._queries.set(
        qName,
        keys.filter((k) => k !== key),
      );
    }

    this._notify();
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  _notify() {
    this._subscribers.forEach((cb) => cb());
  }

  // Debug: inspect cache contents!
  inspect() {
    console.log("Entities:", Object.fromEntries(this._entities));
    console.log("Queries:", Object.fromEntries(this._queries));
  }
}

// ═══ Usage — Minh hoạ normalized caching ═══
const cache = new NormalizedCache();

// Khi issues query trả về:
cache.writeQuery("issues", "Issue", [
  { id: "1", name: "Fix login", status: "BACKLOG" },
  { id: "2", name: "Add tests", status: "TODO" },
]);
console.log(cache.readQuery("issues"));
// → [{ id: '1', ... }, { id: '2', ... }]

// Khi editIssue mutation trả về:
cache.updateEntity("Issue", "1", { status: "INPROGRESS" });
//     ↑ AUTOMATICALLY updates in issues query!
//     Vì query chỉ reference entity keys!

console.log(cache.readQuery("issues"));
// → [{ id: '1', status: 'INPROGRESS' }, { id: '2', ... }]
//     ↑ UPDATED! Không cần refetch!

// Đây là lý do editIssue TỰ ĐỘNG update UI!
// "Same id, cool, I'm just gonna update it for you." — Scott
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: REACT HOOKS CHO CẢ 3 STRATEGIES
// ═══════════════════════════════════════════════════════════

// Custom hooks thay thế urql's useQuery/useMutation!

function useCacheSubscription(cache, queryName) {
  const [data, setData] = useState(() => cache.readQuery(queryName));

  useEffect(() => {
    const unsub = cache.subscribe(() => {
      setData(cache.readQuery(queryName));
    });
    return unsub;
  }, [cache, queryName]);

  return data;
}

function useMutationWithStrategy(
  client,
  cache,
  mutation,
  strategy = "refetch",
) {
  const [state, setState] = useState({ loading: false, error: null });

  const execute = useCallback(
    async (variables, options = {}) => {
      setState({ loading: true, error: null });

      try {
        if (strategy === "optimistic" && options.optimistic) {
          // Show immediately!
          cache.writeEntity(options.typeName, options.optimistic);
        }

        const result = await client.query(mutation, variables);

        if (result.errors) throw new Error(result.errors[0].message);

        if (strategy === "cacheWrite" && options.updateCache) {
          options.updateCache(cache, result.data);
        }

        if (strategy === "refetch" && options.replay) {
          await options.replay();
        }

        setState({ loading: false, error: null });
        return result;
      } catch (error) {
        // Rollback optimistic:
        if (strategy === "optimistic" && options.rollback) {
          options.rollback(cache);
        }
        setState({ loading: false, error });
        throw error;
      }
    },
    [client, cache, mutation, strategy],
  );

  return [state, execute];
}

// ═══ Usage in React ═══
function Dashboard({ client, cache }) {
  const issues = useCacheSubscription(cache, "issues");

  const [createState, createIssue] = useMutationWithStrategy(
    client,
    cache,
    CREATE_ISSUE,
    "cacheWrite",
  );

  const handleCreate = async (name, content) => {
    await createIssue(
      { input: { name, content } },
      {
        typeName: "Issue",
        updateCache: (c, data) => {
          // Add new issue to query results:
          const current = c.readQuery("issues") || [];
          c.writeQuery("issues", "Issue", [...current, data.createIssue]);
        },
      },
    );
  };

  return (
    <div>
      {createState.loading && <div>Creating...</div>}
      {issues?.map((issue) => (
        <div key={issue.id}>
          {issue.name} — {issue.status}
        </div>
      ))}
    </div>
  );
}
```

---

## §10. Deep Dive: Tại Sao Caching Là Bài Toán Khó Nhất?

### "It's Basically Just Like Redux"

Scott so sánh rất chính xác — GraphQL caching **giống Redux** ở cấp khái niệm:

| Khía cạnh         | Redux                               | GraphQL Cache (urql/Apollo) |
| ----------------- | ----------------------------------- | --------------------------- |
| Storage           | Redux store                         | Normalized cache            |
| Read              | `useSelector(state => state.todos)` | `useQuery(GET_TODOS)`       |
| Write             | `dispatch(addTodo(newTodo))`        | Cache update in mutation    |
| Immutability      | Spread operator / Immer             | Immutable cache operations  |
| Re-render trigger | Selector change → re-render         | Cache change → re-render    |

Nhưng GraphQL cache **khó hơn** Redux vì:

1. **Normalized:** Mỗi entity chỉ tồn tại 1 lần dù xuất hiện trong nhiều queries
2. **Graph:** Relationships giữa entities (Issue → User → Issues)
3. **Network sync:** Cache phải phản ánh server state
4. **Automatic:** Library cố gắng tự update (by ID matching)

### Tại Sao Edit Tự Động Nhưng Create Thì Không?

```
EDIT vs CREATE — TẠI SAO KHÁC NHAU?
═══════════════════════════════════════════════════════════════

  EDIT (tự động!):
  1. Issues query lấy Issue id: "123" → cache có "Issue:123"
  2. editIssue mutation trả về { id: "123", status: "DONE" }
  3. Cache thấy "Issue:123" ĐÃ TỒN TẠI → MERGE!
  4. UI tự update! Không cần refetch!

  CREATE (cần manual!):
  1. Issues query lấy [Issue:1, Issue:2] → cache biết
  2. createIssue mutation trả về { id: "3", name: "New" }
  3. Cache thấy "Issue:3" → CHƯA TỒN TẠI!
  4. Cache thêm entity "Issue:3" BUT...
  5. Cache KHÔNG BIẾT "Issue:3" thuộc query nào!
  6. Issues query result vẫn [Issue:1, Issue:2]!
  7. PHẢI manual thêm "Issue:3" vào query result!

  "The editIssue worked because there was already
   an issue in the cache. Same id, cool, merge.
   Whereas the new issue didn't exist, so it didn't
   put it there. We would have had to put that
   there manually." — Scott
```

---

## Checklist

```
[ ] Create mutation: gql file → useMutation → execute → handle result!
[ ] Input wrapping: { input: { name, content } } PHẢI match schema!
[ ] ⚠️ Lỗi thường gặp: quên wrap trong { input: ... }!
[ ] Error handling: HTTP always 200! Check result.error/result.errors!
[ ] SDL = Schema Definition Language (nobody calls it that 😂)
[ ] Introspection = auto-generated docs from schema!
[ ] Federation = stitch multiple GraphQL APIs together!
[ ] replay() = rerun query after mutation (Strategy 1)!
[ ] 3 strategies: Refetch (simple) → Cache Write (balanced) → Optimistic (fastest)!
[ ] Optimistic updates: show immediately, rollback if error!
[ ] "Bank transfer analogy — money leaves then comes back = confused!" — Scott
[ ] Pagination: refetch KHÔNG hợp lý → dùng cache write!
[ ] Scott recommends: Cache Write = best middle ground!
TIẾP THEO → Phần 13: Update Mutation + Cache + Wrapping Up!
```
