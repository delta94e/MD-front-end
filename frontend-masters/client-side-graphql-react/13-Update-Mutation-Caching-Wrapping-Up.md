# Client-Side GraphQL with React, v2 — Phần 13: Update Mutation, Normalized Caching & Wrapping Up

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Bài: Update Issue Mutation + Urql Q&A + Wrapping Up — "Edit mutation auto-updates vì normalized cache, cache exchange, subscriptions vs polling, fragments, directives, GraphQL chỉ là query language — caching là việc của library!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — Normalized caching internals, production patterns!

---

## Mục Lục

| #   | Phần                                                                |
| --- | ------------------------------------------------------------------- |
| 1   | Edit Issue Mutation — "Same Fields as Query!"                       |
| 2   | Tại Sao Edit Tự Động Update UI? — "Normalized Caching Magic!"       |
| 3   | Cache Exchange Deep Dive — "Query Local Cache with GraphQL!"        |
| 4   | Sorting Mismatch — "Server Sort vs Client Sort!"                    |
| 5   | Subscriptions vs Polling — "Real-time Sync!"                        |
| 6   | GraphQL Fragments — "Reusable Query Pieces!"                        |
| 7   | Unions & Directives — "Advanced Schema Power!"                      |
| 8   | urql vs Apollo — "Chọn Library Nào?"                                |
| 9   | Tự Code: Normalized Cache Engine + Subscription System from Scratch |
| 10  | Course Recap & Next Steps                                           |

---

## §1. Edit Issue Mutation — "Same Fields as Query!"

> Scott: _"I wanna get back the same fields that I got back from the issues query. Because if I edit this issue and when it comes back, I want it to fit exactly what the other issues in the list, without it having any missing field."_

```
EDIT ISSUE — MUTATION DESIGN:
═══════════════════════════════════════════════════════════════

  Issues Query trả về:         Edit Mutation PHẢI trả về:
  ┌──────────────────┐          ┌──────────────────┐
  │ id               │          │ id               │  ← SAME!
  │ name             │    ═══   │ name             │  ← SAME!
  │ content          │          │ content          │  ← SAME!
  │ status           │          │ status           │  ← SAME!
  └──────────────────┘          └──────────────────┘

  TẠI SAO phải match?
  → Nếu mutation trả về ít field hơn query
  → Cache sẽ có entity THIẾU FIELD
  → UI render → undefined fields → BUG!

  "If I edit this issue and it comes back,
   I want it to fit exactly what the others
   without any missing field." — Scott
```

```
EDIT MUTATION ANATOMY:
═══════════════════════════════════════════════════════════════

  mutation EditIssueMutation($input: EditIssueInput!) {
    editIssue(input: $input) {
      id            ← cần cho cache matching!
      name          ← match issues query!
      content       ← match issues query!
      status        ← field đang thay đổi!
    }
  }

  Input type:
  input EditIssueInput {
    id: ID!              ← required! Biết edit issue NÀO!
    name: String         ← optional! Chỉ thay đổi nếu truyền!
    content: String      ← optional!
    status: IssueStatus  ← optional!
  }

  → id REQUIRED (không biết edit cái gì thì edit đâu?)
  → Các field khác OPTIONAL (chỉ update field cần thay đổi!)
```

### Code Implementation:

```javascript
// ═══ Step 1: Tạo mutation file ═══
// gql/editIssueMutation.ts

import { gql } from "@urql/next";

export const EditIssueMutation = gql`
  mutation EditIssueMutation($input: EditIssueInput!) {
    editIssue(input: $input) {
      id
      name
      content
      status
    }
  }
`;
```

```javascript
// ═══ Step 2: Dùng trong Status Component ═══
// components/Status.tsx

"use client";

import { useMutation } from "@urql/next";
import { EditIssueMutation } from "@/gql/editIssueMutation";

function StatusDropdown({ issueId, currentStatus, onAction }) {
  const [{ data, error, fetching }, editMutation] =
    useMutation(EditIssueMutation);

  const handleStatusChange = async (newStatus) => {
    const result = await editMutation({
      input: {
        id: issueId, // ← Từ props!
        status: newStatus, // ← Status mới từ dropdown!
      },
    });

    if (result.error) {
      console.error(result.error);
    }

    // ⚠️ KHÔNG CẦN replay()! UI tự update!
    // Tại sao? → Normalized caching! (Xem §2!)
  };

  // ... render dropdown with BACKLOG, TODO, INPROGRESS, DONE options
}
```

---

## §2. Tại Sao Edit Tự Động Update UI? — "Normalized Caching Magic!"

> Scott: _"The editIssue worked because there was already an issue in the cache. Same id, cool, I'm just gonna update it for you."_

```
NORMALIZED CACHING — CÁCH NÓ HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: Issues Query chạy lần đầu:
  Server trả về:
  { issues: [
    { id: "1", name: "Fix login", status: "BACKLOG" },
    { id: "2", name: "Add tests", status: "TODO" },
  ]}

  urql's cache nội bộ:
  ┌─────────────────────────────────────────┐
  │ ENTITIES:                               │
  │   "Issue:1" → { id, name, status }      │
  │   "Issue:2" → { id, name, status }      │
  │                                         │
  │ QUERIES:                                │
  │   "issues" → ["Issue:1", "Issue:2"]     │  ← references!
  └─────────────────────────────────────────┘

  BƯỚC 2: Edit Mutation chạy:
  editIssue({ id: "1", status: "INPROGRESS" })
  Server trả về:
  { editIssue: { id: "1", name: "Fix login", status: "INPROGRESS" } }

  urql: "ID '1' đã tồn tại trong cache! → MERGE!"
  ┌─────────────────────────────────────────┐
  │ ENTITIES:                               │
  │   "Issue:1" → { status: "INPROGRESS" }  │  ← UPDATED!
  │   "Issue:2" → { status: "TODO" }        │
  │                                         │
  │ QUERIES:                                │
  │   "issues" → ["Issue:1", "Issue:2"]     │  ← unchanged!
  └─────────────────────────────────────────┘

  → UI đang render issues query → vẫn reference "Issue:1"
  → "Issue:1" data đã thay đổi → RE-RENDER! ✅
  → KHÔNG CẦN refetch! KHÔNG CẦN replay()!

  BƯỚC 3: Create NEW issue (KHÁC!):
  createIssue({ name: "New", content: "..." })
  Server trả về:
  { createIssue: { id: "3", name: "New", status: "BACKLOG" } }

  urql: "ID '3' chưa tồn tại! → Thêm entity!"
  ┌─────────────────────────────────────────┐
  │ ENTITIES:                               │
  │   "Issue:1" → { ... }                   │
  │   "Issue:2" → { ... }                   │
  │   "Issue:3" → { id: "3", name: "New" }  │  ← THÊM MỚI!
  │                                         │
  │ QUERIES:                                │
  │   "issues" → ["Issue:1", "Issue:2"]     │  ← KHÔNG ĐỔI!
  └─────────────────────────────────────────┘
                                    ↑
  → "Issue:3" CÓ trong entities nhưng KHÔNG trong query!
  → UI render issues query → KHÔNG THẤY "Issue:3"! ❌
  → PHẢI refetch hoặc manually update query result!
```

### Key Insight — ID là Chìa Khóa:

```
ID-BASED MATCHING:
═══════════════════════════════════════════════════════════════

  urql cache matching rules:
  1. Mỗi entity được key bằng __typename + id
  2. Khi mutation trả về entity với SAME ID → MERGE!
  3. Khi mutation trả về entity với NEW ID → chỉ thêm entity
     (KHÔNG tự thêm vào query nào!)

  "IDs are keys by default in urql. You can change
   the keys if you want and it just merged it." — Scott

  Đây là lý do mutation response PHẢI CÓ id field!
  Không có id → cache không biết match entity nào!
```

---

## §3. Cache Exchange Deep Dive — "Query Local Cache with GraphQL!"

> Scott: _"They're querying the local cache with GraphQL. This is where it gets crazy. So they're not querying the API with this query here. This query is for the local cache, because the cache itself is a graph."_

```
CACHE EXCHANGE — URQL'S CACHING SYSTEM:
═══════════════════════════════════════════════════════════════

  urql Provider setup:
  const client = createClient({
    url: '/api/graphql',
    exchanges: [
      cacheExchange({
        updates: {
          Mutation: {
            // Handler cho mỗi mutation!
            createIssue(result, args, cache, info) {
              // ───────────────────────────────────
              // QUERY THE LOCAL CACHE WITH GRAPHQL!
              // (không phải network request!)
              // ───────────────────────────────────
              cache.updateQuery(
                { query: GET_ISSUES },  // ← query the cache!
                (data) => {
                  // data = current cached result!
                  return {
                    ...data,
                    issues: [
                      ...data.issues,
                      result.createIssue,  // ← thêm mới!
                    ]
                  };
                }
              );
            }
          }
        }
      }),
      fetchExchange,
    ]
  });

  "They created a query to get all todos by their ID.
   That'll give them a todo list, and then they can
   update the query for the todo list." — Scott

  "It's very similar to Redux. It's immutable operations.
   They're doing an immutable operation here." — Scott
```

```
CACHE UPDATE MENTAL MODEL:
═══════════════════════════════════════════════════════════════

  Redux:                         urql cache:
  ──────────                     ──────────
  dispatch(addTodo(newTodo))     cache.updateQuery(query, updater)
       │                              │
       ▼                              ▼
  reducer:                       updater function:
  (state, action) => {           (cachedData) => {
    return {                       return {
      ...state,                      ...cachedData,
      todos: [                       issues: [
        ...state.todos,                ...cachedData.issues,
        action.payload               result.createIssue
      ]                              ]
    };                              };
  }                              }
       │                              │
       ▼                              ▼
  Store updated!                 Cache updated!
  Connected components            Query subscribers
  re-render!                     re-render!

  KEY DIFFERENCE:
  urql cache = graph queryable by GraphQL!
  Redux store = plain JavaScript object!
```

### Tại Sao Scott Không Dạy Cache Updates?

```
SCOTT'S REASONING:
═══════════════════════════════════════════════════════════════

  1. "Very specific to the library" — mỗi lib khác!
  2. "They're never gonna be this small, they're
      gonna be massive." — production code lớn!
  3. "It's quite complicated. Caching strategies
      is quite complicated." — advanced topic!
  4. "Advanced performance level things you don't
      need to get started." — getting started course!
  5. "Every client has a version of this and
      they're all different." — không portable!
```

---

## §4. Sorting Mismatch — "Server Sort vs Client Sort!"

> Scott: _"I'm ordering here by these enums. But that only happens on the server side. The frontend doesn't know this."_

```
SORTING MISMATCH PROBLEM:
═══════════════════════════════════════════════════════════════

  SERVER (database query):
  SELECT * FROM issues
  ORDER BY
    CASE status
      WHEN 'INPROGRESS' THEN 1
      WHEN 'TODO' THEN 2
      WHEN 'BACKLOG' THEN 3
      WHEN 'DONE' THEN 4
    END

  → Issues sorted: INPROGRESS → TODO → BACKLOG → DONE

  CLIENT sau edit status:
  Issue "Fix login" status: BACKLOG → INPROGRESS

  ┌─────────────────────────────────────┐
  │ Fix login    [INPROGRESS] ← đổi!   │
  │ Add tests    [TODO]                 │
  │ Dark mode    [BACKLOG]              │
  └─────────────────────────────────────┘
  → Vẫn ở vị trí cũ! "Fix login" đáng lẽ phải lên đầu!

  SAU REFRESH:
  ┌─────────────────────────────────────┐
  │ Fix login    [INPROGRESS] ← đúng!  │
  │ Add tests    [TODO]                 │
  │ Dark mode    [BACKLOG]              │
  └─────────────────────────────────────┘
  → Server re-sort → đúng thứ tự!

  "The frontend doesn't know this, this part.
   It's not doing sorting." — Scott
```

### Giải Pháp: Client-Side Sorting hoặc Schema Extension:

```
GIẢI PHÁP 1: CLIENT-SIDE SORTING:
═══════════════════════════════════════════════════════════════

  const ORDER = { INPROGRESS: 1, TODO: 2, BACKLOG: 3, DONE: 4 };

  const sortedIssues = [...issues].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status]
  );

  → Frontend sort giống server sort!
  → Update status → re-sort → đúng thứ tự! ✅


GIẢI PHÁP 2: SCHEMA EXTENSION (orderBy argument):
═══════════════════════════════════════════════════════════════

  Schema cũ:
  type Query {
    issues(input: IssuesFilterInput): [Issue!]!
  }

  Schema mới:
  input IssuesFilterInput {
    statuses: [IssueStatus]
    orderBy: String          ← THÊM MỚI!
  }

  Query:
  query {
    issues(input: { orderBy: "status" }) {
      name status
    }
  }

  "There's nothing stopping you from adding orderBy.
   Whatever part of your ordering that you want to
   be dynamic, make that an input variable." — Scott
```

---

## §5. Subscriptions vs Polling — "Real-time Sync!"

> Scott: _"Subscription would be like a web socket. If you wanted your local application to be in sync with some data on the backend, you would have to set up a subscription."_

```
3 CHIẾN LƯỢC REAL-TIME SYNC:
═══════════════════════════════════════════════════════════════

  STRATEGY 1: POLLING (Simple!)
  ──────────────────────────────
  Client     Server
    │          │
    │─ query ─→│  (every 30s!)
    │←─ data ──│
    │          │
    │  ... 30s ...
    │          │
    │─ query ─→│  (again!)
    │←─ data ──│

  + Đơn giản! urql hỗ trợ sẵn!
  - Không real-time (gap = polling interval!)
  - Wasteful nếu data không đổi!

  Ví dụ Twitter:
  "While you're on your feed, they're going to
   their server every 30 seconds: anything new
   since this timestamp? If there is, they show
   that bubble." — Scott


  STRATEGY 2: SUBSCRIPTIONS (Real-time!)
  ──────────────────────────────────────
  Client      Server
    │           │
    │─ subscribe →│  (WebSocket connection!)
    │           │
    │←─ update ──│  (server push khi có thay đổi!)
    │←─ update ──│  (instant!)
    │←─ update ──│
    │           │

  + Real-time! Instant updates!
  - Cần WebSocket server!
  - Next.js serverless = KHÔNG HỖ TRỢ WebSockets!
    "Doing web sockets on Next.js, you can't really
     do it because it's serverless." — Scott
  - Cần third party service (tốn tiền!)


  STRATEGY 3: MANUAL REFETCH (Ad-hoc!)
  ──────────────────────────────────────
  → replay() sau mutation!
  → User-triggered refresh button!
  → Đã học ở phần trước!
```

```
URQL POLLING SETUP:
═══════════════════════════════════════════════════════════════

  const [result] = useQuery({
    query: GET_ISSUES,
    pollInterval: 30000,   // ← Poll mỗi 30 giây!
  });

  hoặc custom interval:
  useEffect(() => {
    const interval = setInterval(() => {
      replay();            // ← Rerun query!
    }, 30000);
    return () => clearInterval(interval);
  }, [replay]);
```

---

## §6. GraphQL Fragments — "Reusable Query Pieces!"

> Scott: _"Fragments are like little pieces of a query that you can share with other queries, so you don't have to rewrite them every time."_

```
FRAGMENTS — REUSABLE QUERY PARTS:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG CÓ fragment — lặp lại fields!

  query GetIssues {
    issues {
      id name content status createdAt    ← lặp!
    }
  }

  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      id name content status createdAt    ← lặp!
    }
  }

  mutation EditIssue($input: EditIssueInput!) {
    editIssue(input: $input) {
      id name content status createdAt    ← lặp!
    }
  }


  ✅ VỚI fragment — viết 1 lần, dùng mọi nơi!

  fragment IssueFields on Issue {
    id
    name
    content
    status
    createdAt
  }

  query GetIssues {
    issues { ...IssueFields }           ← spread!
  }

  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) { ...IssueFields }
  }

  mutation EditIssue($input: EditIssueInput!) {
    editIssue(input: $input) { ...IssueFields }
  }

  → Thay đổi 1 nơi = update TOÀN BỘ! DRY! ✅

  "I don't actually use fragments. You can also just
   share a string around, too." — Scott 😂
```

---

## §7. Unions & Directives — "Advanced Schema Power!"

> Scott: _"Directives are really cool, also pretty advanced. You can add directives, which are custom functions that run on the AST of the schema."_

```
UNIONS — MULTIPLE TYPES TRONG 1 FIELD:
═══════════════════════════════════════════════════════════════

  union SearchResult = Issue | User | Project

  query {
    search(term: "bug") {
      ... on Issue {
        name status
      }
      ... on User {
        name email
      }
      ... on Project {
        name description
      }
    }
  }

  → 1 query trả về NHIỀU types!
  → Frontend dùng ... on TypeName để phân biệt!
  → "Requires a lot of server-side stuff." — Scott


DIRECTIVES — CUSTOM FUNCTIONS TRONG QUERY:
═══════════════════════════════════════════════════════════════

  Built-in directives:
  query {
    issues {
      name
      content @include(if: $showContent)  ← conditional!
      status @skip(if: $hideStatus)       ← conditional!
    }
  }

  Custom directives (server-defined!):
  query {
    issues {
      name @uppercase        ← custom! Transform!
      content @truncate(length: 100)  ← custom!
      createdAt @formatDate(format: "dd/MM/yyyy")
    }
  }

  "People make lodash directives, so you can do all
   different types of mapping in a GraphQL schema.
   It gets pretty cool." — Scott

  → Custom directives = server-side code!
  → Client chỉ dùng syntax, logic ở server!
```

---

## §8. urql vs Apollo — "Chọn Library Nào?"

> Scott: _"urql is gonna be just as good as Apollo. It's just that Apollo has a bigger ecosystem."_

```
URQL VS APOLLO — SO SÁNH:
═══════════════════════════════════════════════════════════════

  Tiêu chí          │ urql                 │ Apollo
  ──────────────────┼──────────────────────┼─────────────────
  Size              │ Nhỏ, lightweight     │ Lớn, full-featured
  Learning curve    │ Easy                 │ Medium
  Next.js App Dir   │ ✅ Full support!     │ ⚠️ Experimental!
  Ecosystem         │ Smaller              │ MASSIVE
  Cache             │ Graphcache (opt-in)  │ InMemoryCache
  Documentation     │ Tốt, đơn giản       │ Tốt, rộng hơn
  Plugins           │ Ít hơn               │ "Apollo has plugin"
  Use case          │ Simple → Medium      │ Medium → Complex

  Scott's decision factors:
  1. Documentation — clear, simple?
  2. Recent updates — actively maintained?
  3. Feature support — App Directory?
  4. Track record — reliable releases?

  "I'm always looking at something useful, that a lot
   of people use, but is being updated and staying
   up to date. Documentation is simple, easy to use." — Scott

  "The other reason I chose urql — they had full support
   for App Directory. Apollo had experimental.
   I'm like, App Directory been out for a year plus.
   Move a little faster." — Scott
```

```
KHI NÀO DÙNG GÌ:
═══════════════════════════════════════════════════════════════

  urql:
  → Project nhỏ-trung bình!
  → Next.js App Directory!
  → Muốn đơn giản, ít boilerplate!
  → "Shooting a fly with a shotgun — you didn't
     need all that." — Scott (nói về Apollo cho nhỏ)

  Apollo:
  → Project lớn, enterprise!
  → Cần ecosystem rộng (plugins, DevTools!)
  → Team đã quen Apollo!
  → Federation / multi-service GraphQL!

  Relay (Facebook):
  → React-specific!
  → "Opinionated" — bạn PHẢI theo cách của Relay!
  → Best performance nhưng hardest to learn!

  Đừng quên: bạn luôn có thể dùng plain fetch()!
  → Zero library! Simplest!
  → Tự quản lý cache thủ công!
```

---

## §9. Tự Code: Normalized Cache Engine + Subscription System from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: NORMALIZED CACHE VỚI AUTO-UPDATE
// ═══════════════════════════════════════════════════════════

class GraphCache {
  constructor() {
    // Entity store: "Issue:1" → { id, name, status, ... }
    this._entities = new Map();
    // Query store: queryKey → [entityKey1, entityKey2, ...]
    this._queries = new Map();
    // Mutation handlers: mutationName → updateFn
    this._mutationHandlers = new Map();
    // Subscribers:
    this._subs = new Set();
  }

  // ═══ Entity key generation ═══
  _entityKey(typename, id) {
    return `${typename}:${id}`;
  }

  // ═══ Write entities from query response ═══
  writeQuery(operationKey, typename, entities) {
    const keys = entities.map((e) => {
      const key = this._entityKey(typename, e.id);
      const existing = this._entities.get(key);
      // MERGE! Giữ fields cũ, update fields mới!
      this._entities.set(key, existing ? { ...existing, ...e } : e);
      return key;
    });
    this._queries.set(operationKey, { typename, keys });
    this._notify();
  }

  // ═══ Read query results ═══
  readQuery(operationKey) {
    const entry = this._queries.get(operationKey);
    if (!entry) return null;
    return entry.keys.map((k) => this._entities.get(k)).filter(Boolean);
  }

  // ═══ Write single entity (from mutation response!) ═══
  writeEntity(typename, entity) {
    const key = this._entityKey(typename, entity.id);
    const existing = this._entities.get(key);

    if (existing) {
      // ID EXISTS → MERGE! (giống urql edit behavior!)
      this._entities.set(key, { ...existing, ...entity });
      this._notify();
      return "merged";
    } else {
      // ID NEW → chỉ thêm entity, KHÔNG thêm vào query!
      this._entities.set(key, entity);
      this._notify();
      return "created";
    }
  }

  // ═══ Register mutation handler (giống cache exchange!) ═══
  onMutation(mutationName, handler) {
    this._mutationHandlers.set(mutationName, handler);
  }

  // ═══ Process mutation result ═══
  processMutation(mutationName, result) {
    const handler = this._mutationHandlers.get(mutationName);
    if (handler) {
      handler(result, this);
    }
  }

  // ═══ Add entity to query results ═══
  addToQuery(operationKey, typename, entity) {
    const key = this._entityKey(typename, entity.id);
    this._entities.set(key, entity);
    const entry = this._queries.get(operationKey);
    if (entry && !entry.keys.includes(key)) {
      entry.keys.push(key);
    }
    this._notify();
  }

  // ═══ Remove entity ═══
  removeFromQuery(operationKey, typename, id) {
    const key = this._entityKey(typename, id);
    this._entities.delete(key);
    const entry = this._queries.get(operationKey);
    if (entry) {
      entry.keys = entry.keys.filter((k) => k !== key);
    }
    this._notify();
  }

  // ═══ Invalidate query (force refetch!) ═══
  invalidateQuery(operationKey) {
    this._queries.delete(operationKey);
    this._notify();
  }

  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  _notify() {
    this._subs.forEach((fn) => fn());
  }

  // Debug:
  inspect() {
    const entities = {};
    this._entities.forEach((v, k) => (entities[k] = v));
    const queries = {};
    this._queries.forEach((v, k) => (queries[k] = v));
    return { entities, queries };
  }
}

// ═══ Setup giống urql cache exchange! ═══
const cache = new GraphCache();

// Register mutation handlers (giống cache exchange config!):
cache.onMutation("createIssue", (result, cache) => {
  // Thêm issue mới vào issues query!
  cache.addToQuery("getIssues", "Issue", result.createIssue);
});

cache.onMutation("deleteIssue", (result, cache) => {
  // Xoá issue khỏi issues query!
  cache.removeFromQuery("getIssues", "Issue", result.deleteIssue.id);
});

cache.onMutation("editIssue", (result, cache) => {
  // KHÔNG CẦN handler! writeEntity auto-merge by ID!
  // Nhưng có thể thêm sorting logic:
  cache.writeEntity("Issue", result.editIssue);
});

// ═══ Demo flow ═══

// 1. Issues query returns:
cache.writeQuery("getIssues", "Issue", [
  { id: "1", name: "Fix login", status: "BACKLOG" },
  { id: "2", name: "Add tests", status: "TODO" },
]);

console.log(cache.readQuery("getIssues"));
// → [{ id: '1', status: 'BACKLOG' }, { id: '2', status: 'TODO' }]

// 2. Edit mutation (auto-merge!):
cache.writeEntity("Issue", { id: "1", status: "INPROGRESS" });
console.log(cache.readQuery("getIssues"));
// → [{ id: '1', status: 'INPROGRESS' }, { id: '2', status: 'TODO' }]
//     ↑ UPDATED automatically!

// 3. Create mutation (needs handler!):
cache.processMutation("createIssue", {
  createIssue: { id: "3", name: "Dark mode", status: "BACKLOG" },
});
console.log(cache.readQuery("getIssues"));
// → [Issue:1, Issue:2, Issue:3] ← 3 items now!

// 4. Delete mutation:
cache.processMutation("deleteIssue", {
  deleteIssue: { id: "2" },
});
console.log(cache.readQuery("getIssues"));
// → [Issue:1, Issue:3] ← Issue:2 removed!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: POLLING SYSTEM (giống urql polling!)
// ═══════════════════════════════════════════════════════════

class PollingManager {
  constructor(client) {
    this.client = client;
    this._intervals = new Map(); // queryKey → intervalId
  }

  // Start polling a query:
  startPolling(queryKey, queryString, variables, intervalMs = 30000) {
    // Stop existing polling for this query:
    this.stopPolling(queryKey);

    const poll = async () => {
      try {
        const result = await this.client.query(queryString, variables);
        if (result.data) {
          console.log(`[Poll ${queryKey}] New data received`);
          // Update cache, notify UI...
        }
      } catch (err) {
        console.error(`[Poll ${queryKey}] Error:`, err.message);
      }
    };

    // Run immediately + set interval:
    poll();
    const intervalId = setInterval(poll, intervalMs);
    this._intervals.set(queryKey, intervalId);

    return () => this.stopPolling(queryKey);
  }

  stopPolling(queryKey) {
    const id = this._intervals.get(queryKey);
    if (id) {
      clearInterval(id);
      this._intervals.delete(queryKey);
    }
  }

  stopAll() {
    this._intervals.forEach((id) => clearInterval(id));
    this._intervals.clear();
  }
}

// Usage:
const poller = new PollingManager(client);

// Poll issues every 30 seconds:
const stopPolling = poller.startPolling("issues", GET_ISSUES, {}, 30000);

// Stop when component unmounts:
// stopPolling();
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: FRAGMENT SYSTEM (tái sử dụng query parts!)
// ═══════════════════════════════════════════════════════════

class FragmentRegistry {
  constructor() {
    this._fragments = new Map();
  }

  // Register a fragment:
  register(name, fields) {
    this._fragments.set(name, fields);
  }

  // Get fragment fields as string:
  get(name) {
    const fields = this._fragments.get(name);
    if (!fields) throw new Error(`Fragment "${name}" not registered!`);
    return fields;
  }

  // Build query with fragments:
  buildQuery(baseQuery) {
    let result = baseQuery;
    // Replace ...FragmentName with actual fields:
    result = result.replace(/\.\.\.(\w+)/g, (_, name) => {
      return this.get(name);
    });
    return result;
  }
}

// ═══ Usage ═══
const fragments = new FragmentRegistry();

// Register reusable fragments:
fragments.register(
  "IssueFields",
  `
  id
  name
  content
  status
  createdAt
`,
);

fragments.register(
  "UserFields",
  `
  id
  name
  email
`,
);

// Build queries with fragments:
const GET_ISSUES = fragments.buildQuery(`
  query GetIssues {
    issues {
      ...IssueFields
      user {
        ...UserFields
      }
    }
  }
`);

console.log(GET_ISSUES);
// → query GetIssues { issues { id name content status createdAt user { id name email } } }

const CREATE_ISSUE = fragments.buildQuery(`
  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      ...IssueFields
    }
  }
`);
// → Same fields! DRY! ✅
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: REACT HOOKS — COMPLETE CLIENT SYSTEM
// ═══════════════════════════════════════════════════════════

// Custom useQuery with polling + cache:
function useGraphQuery(cache, client, queryKey, queryString, options = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    fetching: true,
  });

  useEffect(() => {
    let cancelled = false;

    // Check cache first:
    const cached = cache.readQuery(queryKey);
    if (cached) {
      setState({ data: { [queryKey]: cached }, error: null, fetching: false });
    }

    // Fetch from network:
    const fetchData = async () => {
      try {
        const result = await client.query(queryString, options.variables || {});
        if (!cancelled && result.data) {
          // Write to normalized cache:
          const typename = options.typename || "Entity";
          const entities = result.data[queryKey];
          if (Array.isArray(entities)) {
            cache.writeQuery(queryKey, typename, entities);
          }
          setState({ data: result.data, error: null, fetching: false });
        }
      } catch (err) {
        if (!cancelled) setState({ data: null, error: err, fetching: false });
      }
    };
    fetchData();

    // Polling:
    let intervalId = null;
    if (options.pollInterval) {
      intervalId = setInterval(fetchData, options.pollInterval);
    }

    // Subscribe to cache updates:
    const unsub = cache.subscribe(() => {
      const fresh = cache.readQuery(queryKey);
      if (fresh && !cancelled) {
        setState((prev) => ({ ...prev, data: { [queryKey]: fresh } }));
      }
    });

    return () => {
      cancelled = true;
      unsub();
      if (intervalId) clearInterval(intervalId);
    };
  }, [queryKey, queryString]);

  // Replay function:
  const replay = useCallback(async () => {
    setState((prev) => ({ ...prev, fetching: true }));
    cache.invalidateQuery(queryKey);
    const result = await client.query(queryString, options.variables || {}, {
      skipCache: true,
    });
    if (result.data) {
      const entities = result.data[queryKey];
      if (Array.isArray(entities)) {
        cache.writeQuery(queryKey, options.typename || "Entity", entities);
      }
      setState({ data: result.data, error: null, fetching: false });
    }
  }, [queryKey, queryString]);

  return [state, replay];
}
```

---

## §10. Course Recap & Next Steps

> Scott: _"Frontend is just, query language, that's cool. Backend, it's a graph, it's literally a graph. So it gets kinda crazy."_

```
COURSE RECAP — WHAT WE LEARNED:
═══════════════════════════════════════════════════════════════

  ✅ GraphQL = "TypeScript for your API!" (query language + runtime!)
  ✅ Apollo Studio = explore schema, test queries!
  ✅ gql tag + query files = organized queries!
  ✅ useQuery = auto-fetch on mount + loading/error states!
  ✅ useMutation = manual trigger, handle results!
  ✅ Input wrapping = { input: { ... } } for mutations!
  ✅ Error handling = always 200, check result.error!
  ✅ Nested queries = powerful but dangerous (N+1!)
  ✅ Filtering = enum arguments, optional inputs!
  ✅ replay() = refetch query after mutation!
  ✅ Normalized caching = auto-update by ID matching!
  ✅ 3 strategies: refetch → cache write → optimistic!
  ✅ urql chosen for simplicity + Next.js App Dir support!
```

```
WHAT TO DO NEXT:
═══════════════════════════════════════════════════════════════

  1. deleteIssue mutation (exercise!):
     → "The query's already done, mutation's already done.
        You just gotta write the UI." — Scott
     → Thêm delete button, call mutation, update cache!

  2. Khám phá Open GraphQL APIs:
     → Star Wars API (swapi-graphql)
     → GitHub GraphQL API
     → SpaceX GraphQL API
     → "Just Google Open GraphQL APIs, tons of them.
        Go find one, connect to it." — Scott

  3. Đọc urql docs — Cache Updates:
     → "100% be doing this in production." — Scott

  4. Server-side course:
     → "Covers 90% of GraphQL." — Scott
     → "The frontend stuff is quite simple. It's the
        backend stuff that's really hard." — Scott

  5. Thử fragments, unions, directives:
     → "I almost never use any of those in production,
        but a lot of people swear by them." — Scott
```

### GraphQL's True Nature:

```
GRAPHQL ≠ CACHING!
═══════════════════════════════════════════════════════════════

  Common misconception:
  "GraphQL auto-syncs client with server!"  ← SAI!

  Reality:
  GraphQL = QUERY LANGUAGE + RESOLVING!
  → "GraphQL exists purely for the network layer." — Scott
  → Nó CHỈ biết:
    1. Syntax cho queries/mutations
    2. Tools để resolve queries
  → Nó KHÔNG biết:
    1. Caching (urql/Apollo làm việc này!)
    2. Real-time sync (Subscriptions/WebSocket!)
    3. Database (resolvers connect to anything!)
    4. UI updates (React re-render system!)

  "GraphQL doesn't have anything to do with updating
   cache. It doesn't even do a cache. It knows nothing
   about it." — Scott

  "It does provide the metadata in which urql can then
   use to figure out what to update." — Scott
```

---

## Checklist

```
[ ] Edit mutation: same fields as query → match for cache merge!
[ ] Edit auto-updates: normalized cache finds matching ID → merge!
[ ] Create DOESN'T auto-update: new ID not in any query result!
[ ] Cache exchange: query local cache with GraphQL!
[ ] Mutation handlers: updates.Mutation config in cacheExchange!
[ ] Sorting mismatch: server sorts by DB, client doesn't know!
[ ] Fix: client-side sorting OR schema orderBy argument!
[ ] Subscriptions: WebSocket-based real-time → can't on serverless!
[ ] Polling: setInterval refetch → simple but not real-time!
[ ] Fragments: reusable query parts → ...FragmentName syntax!
[ ] Unions: one field returns multiple types → ... on TypeName!
[ ] Directives: custom functions on AST → @uppercase, @include!
[ ] urql vs Apollo: urql = simple + App Dir, Apollo = ecosystem!
[ ] GraphQL ≠ caching! GraphQL = query language ONLY!
[ ] "The frontend stuff is quite simple. Backend is hard." — Scott
[ ] Exercise: implement deleteIssue mutation UI!
[ ] Explore: Open GraphQL APIs (Star Wars, GitHub, SpaceX!)
FIN — Client-Side GraphQL with React, v2! 🎓
```
