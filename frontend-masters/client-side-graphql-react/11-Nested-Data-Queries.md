# Client-Side GraphQL with React, v2 — Phần 11: Nested Data Queries & Project Issues Queries

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss
> Bài: Nested Data Queries + Project Issues Queries — "Cyclic queries, N+1 problem, query depth attacks, useQuery hook, loading/error states, persisted queries"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — GraphQL performance, security, client-side data fetching!

---

## Mục Lục

| #   | Phần                                                                   |
| --- | ---------------------------------------------------------------------- |
| 1   | Nested Data — "Issue có User, User có Issues... Cyclic!"               |
| 2   | N+1 Query Problem — "Infinite Recursion Kills Your Server!"            |
| 3   | Các Giải Pháp Chống N+1 — "Weights, AST Depth, Persisted Queries!"     |
| 4   | Persisted Queries — "Save Once, Reference by ID!"                      |
| 5   | Issues Query — "Filtering với Enum + Optional Arguments!"              |
| 6   | Project Issues Queries — "useQuery Hook, Loading, Error States!"       |
| 7   | Tự Code: GraphQL Client + Nested Resolver + Depth Limiter from Scratch |
| 8   | Deep Dive: Tại Sao Cyclic Data Nguy Hiểm?                              |

---

## §1. Nested Data — "Issue có User, User có Issues... Cyclic!"

> Scott: _"Because a user can also have issues, and an issue can have a user, you get into this cyclic scenario where it's recursive."_

```
NESTED DATA TRONG GRAPHQL:
═══════════════════════════════════════════════════════════════

  Schema:
  type Issue {
    id: ID!
    name: String!
    content: String!
    status: IssueStatus!
    user: User!           ← Issue chứa User!
  }

  type User {
    id: ID!
    name: String!
    issues: [Issue!]!     ← User chứa Issues!
  }

  → Issue → User → Issues → User → Issues → ...
  → CYCLIC! 🔄 Không có điểm dừng!
```

```
ENUM TRONG GRAPHQL:
═══════════════════════════════════════════════════════════════

  enum IssueStatus {
    BACKLOG
    TODO
    INPROGRESS
    DONE
  }

  → Giống TypeScript enum!
  → Chỉ cho phép 1 trong 4 giá trị!
  → Type-safe filtering!

  Query:
  query {
    issues(input: { statuses: [INPROGRESS] }) {
      name
      status     ← guaranteed: BACKLOG | TODO | INPROGRESS | DONE
    }
  }
```

Nested data là tính năng **cực kỳ mạnh** của GraphQL so với REST. Trong REST, để lấy issues + user info, bạn cần ít nhất 2 requests:

1. `GET /api/issues` → lấy danh sách issues (có `userId` field)
2. `GET /api/users/:id` → lấy user cho mỗi issue (N requests!)

Trong GraphQL, chỉ **1 request**:

```graphql
query {
  issues {
    name
    status
    user {
      # ← Nested! 1 request duy nhất!
      id
      name
    }
  }
}
```

> Scott: _"Here in GraphQL, if I wanted to get the user for all these issues, I could just come down here."_

Response trả về:

```json
{
  "data": {
    "issues": [
      {
        "name": "Fix login bug",
        "status": "INPROGRESS",
        "user": {
          "id": "user_123",
          "name": "Scott"
        }
      }
    ]
  }
}
```

**Filtering với Enum Arguments:**

```
FILTERING VỚI GRAPHQL:
═══════════════════════════════════════════════════════════════

  Query KHÔNG filter (lấy tất cả):
  query {
    issues {
      name
      status
    }
  }
  → Trả về TẤT CẢ issues: BACKLOG, TODO, INPROGRESS, DONE

  Query CÓ filter:
  query {
    issues(input: { statuses: [INPROGRESS] }) {
      name
      status
    }
  }
  → Chỉ trả về issues có status = INPROGRESS!

  Input type:
  input IssuesInput {
    statuses: [IssueStatus]    ← nullable! optional!
  }

  → Nếu không truyền → lấy hết!
  → Nếu truyền → filter theo statuses!
  → "So it's quite powerful on how you can do that." — Scott
```

---

## §2. N+1 Query Problem — "Infinite Recursion Kills Your Server!"

> Scott: _"This might show you how powerful GraphQL is, but it also might make you scared about how you have this N+1 problem on the backend where this is recursive in nature, like where does it end?"_

```
N+1 PROBLEM — TỪ ĐƠN GIẢN ĐẾN CHẾT SERVER:
═══════════════════════════════════════════════════════════════

  Level 1 — Bình thường:
  query {
    issues {
      name
      user { id }         ← 1 level deep → OK!
    }
  }

  Level 2 — Bắt đầu nguy hiểm:
  query {
    issues {
      user {
        issues {           ← issues của user
          name
          status
        }
      }
    }
  }
  → issues → user → issues
  → Server phải resolve 3 lần!

  Level 5 — DDoS chính mình:
  query {
    issues {
      user {
        issues {
          user {
            issues {
              user {
                id          ← 5+ levels deep!
              }
            }
          }
        }
      }
    }
  }
  → Server broken! Out of memory! 💀

  Scott đã demo live: "Yeah, you can see I just broke
  my own server pretty much trying to do that."
```

```
VISUAL: CYCLIC QUERY EXPLOSION:
═══════════════════════════════════════════════════════════════

  Depth 1     Depth 2        Depth 3           Depth 4
  ────────    ────────────   ────────────────   ──────────
  Issue 1 ──→ User A ──→ Issue 1 ──→ User A ──→ ...
  Issue 2 ──→ User A ──→ Issue 2 ──→ User A ──→ ...
  Issue 3 ──→ User B ──→ Issue 3 ──→ User B ──→ ...
  Issue 4 ──→ User B ──→ Issue 4 ──→ User B ──→ ...
  Issue 5 ──→ User C ──→ Issue 5 ──→ User C ──→ ...

  Mỗi level: N issues × M users × N issues × M users...
  → Exponential growth! O(N^depth)
  → "Imagine a team of people doing that to your server.
     It would come crashing down instantly." — Scott
```

### Tại Sao Đây Là Vấn Đề Nghiêm Trọng?

Scott giải thích rất rõ ràng: không ai **viết trước** những queries này. Server GraphQL phải **tự động resolve** bất kỳ query nào client gửi, dù phức tạp đến đâu:

> _"The thing that's important to remember here is, no one wrote the queries for that, this is dynamic. I'm querying that myself and the server just has to respond to it."_

Đây là sự khác biệt cốt lõi với REST:

- **REST:** Backend developer viết trước mỗi endpoint → kiểm soát được complexity
- **GraphQL:** Client tự viết query → server phải handle bất kỳ thứ gì

> _"If this was a developer API, they could basically DDoS you. Somebody could just write a really long query, keep it going — how does your server respond to that? How does it know when to stop?"_

---

## §3. Các Giải Pháp Chống N+1 — "Weights, AST Depth, Persisted Queries!"

> Scott: _"There is no one way to get past that. There are many solutions with trade-offs."_

```
GIẢI PHÁP 1: FIELD WEIGHTS (Trọng Số!)
═══════════════════════════════════════════════════════════════

  Ý tưởng: Mỗi field có "trọng số" (score)!
  Query có "ngân sách" tối đa (max score)!

  Schema weights:
  issues     → weight: 5    (query danh sách = expensive!)
  user       → weight: 3    (query 1 object)
  name       → weight: 1    (scalar field = cheap!)
  status     → weight: 1
  id         → weight: 1

  Query analysis:
  query {
    issues {          ← +5
      name            ← +1
      user {          ← +3
        issues {      ← +5
          name        ← +1
        }
      }
    }
  }
  Total: 5 + 1 + 3 + 5 + 1 = 15

  Max allowed: 20 → ✅ Cho phép!

  Nhưng nếu thêm 1 level nữa:
  → Total: 15 + 3 + 5 + 1 = 24 → ❌ Reject!
  → "Query complexity exceeds maximum allowed!"

  "I've seen people basically give certain fields
   weights like scores. They can count the score
   and give the query a maximum score." — Scott
```

```
GIẢI PHÁP 2: AST DEPTH LIMITING (Giới Hạn Độ Sâu!)
═══════════════════════════════════════════════════════════════

  Ý tưởng: Phân tích AST (Abstract Syntax Tree)
  của query → đếm số level!

  Max depth = 4

  query {              ← depth 0
    issues {           ← depth 1
      user {           ← depth 2
        issues {       ← depth 3
          user {       ← depth 4 → ĐẠT MAX!
            issues {   ← depth 5 → ❌ REJECT!
            }
          }
        }
      }
    }
  }

  "There's ways where you can tap into the AST
   of the GraphQL and determine how many levels
   deep they might be right now." — Scott

  Ưu điểm: Đơn giản, dễ implement!
  Nhược điểm: Legitimate deep queries cũng bị block!
```

```
GIẢI PHÁP 3: PERSISTED QUERIES (Query Đã Lưu!)
═══════════════════════════════════════════════════════════════

  Ý tưởng: Đăng ký queries trước → chỉ chạy queries đã lưu!

  Build time:
  ┌──────────────────────┐
  │ App's GraphQL files   │
  │ ├── getIssues.gql     │──→ register → query_id: "q1"
  │ ├── getUser.gql       │──→ register → query_id: "q2"
  │ └── createIssue.gql   │──→ register → query_id: "q3"
  └──────────────────────┘

  Runtime:
  Client: POST /graphql
  { queryId: "q1", variables: { status: "TODO" } }
  → Server: lookup "q1" → found! → execute! ✅

  Client: POST /graphql
  { query: "{ issues { user { issues { ... } } } }" }
  → Server: unknown query! → REJECT! ❌

  Lợi ích:
  1. Chặn hoàn toàn arbitrary queries!
  2. Skip validation (đã validate khi register!)
  3. Faster execution!
  4. Smaller payload (chỉ gửi ID + variables!)

  "I can register a query on the backend, then just
   get an ID to reference it. So this is query one,
   query two, query three." — Scott

  Nhưng:
  → CHỈ dùng cho app nội bộ! (bạn biết trước queries!)
  → KHÔNG dùng cho developer-facing API! (cần dynamic!)
  → "You wouldn't do that if you had a GraphQL API
     that was developer-facing." — Scott
```

### So Sánh Các Giải Pháp:

```
SO SÁNH GIẢI PHÁP:
═══════════════════════════════════════════════════════════════

  Giải pháp        │ Complexity   │ Bảo vệ  │ Dùng khi
  ─────────────────┼──────────────┼─────────┼──────────────────
  Field Weights    │ Trung bình   │ Tốt     │ Public API
  AST Depth Limit  │ Đơn giản     │ OK      │ Internal + Public
  Persisted Queries│ Build setup  │ Tốt nhất│ Internal app only
  Rate Limiting    │ Đơn giản     │ Cơ bản  │ Mọi API
  Timeout          │ Đơn giản     │ Cơ bản  │ Safety net

  Thực tế: Dùng NHIỀU giải pháp cùng lúc!
  → Depth limit + Field weights + Rate limiting
  → "There are many solutions with trade-offs." — Scott
```

---

## §4. Persisted Queries — Deep Dive

> Scott: _"Once I wrote my queries from my app, I'm never gonna change them again unless it's time to. They're not gonna be dynamic. I know what the query is, I wrote it."_

```
WORKFLOW PERSISTED QUERIES:
═══════════════════════════════════════════════════════════════

  DEVELOPMENT:
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  1. Developer viết query trong app:                  │
  │     const GET_ISSUES = gql`                          │
  │       query GetIssues {                              │
  │         issues { name status }                       │
  │       }                                              │
  │     `;                                               │
  │                                                      │
  │  2. Build pipeline:                                  │
  │     → Extract tất cả queries từ source code           │
  │     → Hash mỗi query → unique ID                    │
  │     → Register queries lên server                    │
  │     → Replace query strings bằng IDs trong bundle    │
  │                                                      │
  │  3. Production runtime:                              │
  │     Client gửi: { id: "abc123", variables: {} }      │
  │     Server lookup: queries["abc123"] → execute!       │
  │                                                      │
  └──────────────────────────────────────────────────────┘

  BENEFITS:
  1. ❌ Không cần gửi query string → nhỏ hơn!
  2. ❌ Không cần validate → nhanh hơn!
  3. ❌ Không accept unknown queries → an toàn hơn!
  4. ✅ "It kinda speeds things up and it saves
      your queries, but it's a performance thing." — Scott
```

### JSON.stringify và Cyclic Objects — Tương Tự!

Scott đưa ra comparison rất hay:

> _"If you had a circular object and you tried to JSON.stringify it, it won't work. Because JSON.stringify recursively goes through everything, and if it's cyclic, it doesn't know when to stop."_

```javascript
// JavaScript cyclic reference — GIỐNG N+1 problem!

const user = { name: "Scott" };
const issue = { title: "Bug", user: user };
user.issues = [issue]; // ← CYCLIC! user → issue → user → issue...

// Thử stringify:
JSON.stringify(user);
// → TypeError: Converting circular structure to JSON

// GraphQL N+1 cũng vậy:
// issues → user → issues → user → issues → ...
// → Server cố resolve → không biết khi nào dừng → crash!

// "It's the same problem, it doesn't know when to stop.
//  And because now you're playing with database resources,
//  it's quite expensive." — Scott
```

---

## §5. Issues Query — "Filtering với Enum + Optional Arguments!"

> Scott: _"As far as the arguments go, it looks like I have a null argument. So I don't have to supply this argument, it's not not-null."_

```
ISSUES QUERY ANATOMY:
═══════════════════════════════════════════════════════════════

  query IssuesQuery($input: IssuesInput) {
    issues(input: $input) {
      id
      name
      content
      status
      createdAt
    }
  }

  Breakdown:
  ├── "IssuesQuery"     ← Operation name (giống tên hàm!)
  ├── $input            ← Variable (nullable → optional!)
  ├── IssuesInput       ← Input type
  │   └── statuses: [IssueStatus]  ← Array of enum!
  │       └── BACKLOG | TODO | INPROGRESS | DONE
  ├── issues(...)       ← Query field
  └── { id, name, ... } ← Requested fields

  Tên operation QUAN TRỌNG:
  → Không ảnh hưởng logic!
  → Nhưng phải UNIQUE (tránh conflict!)
  → "Think of JavaScript in 2005 where everything
     was in one file in global." — Scott
```

```
INPUT TYPES — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  input IssuesInput {
    statuses: [IssueStatus]      ← nullable field!
  }

  3 loại nullability:

  1. statuses: [IssueStatus]     ← field có thể null, items có thể null
     → null, [], [BACKLOG], [null, BACKLOG]  ← tất cả OK!

  2. statuses: [IssueStatus!]    ← field có thể null, items PHẢI có giá trị
     → null, [], [BACKLOG]  ← OK!
     → [null]               ← ❌ ERROR!

  3. statuses: [IssueStatus!]!   ← field PHẢI CÓ, items PHẢI có giá trị
     → [BACKLOG], [TODO, DONE]  ← OK!
     → null, [null]             ← ❌ ERROR!

  Trong case này: $input: IssuesInput (no !)
  → TOÀN BỘ input là optional!
  → Không truyền → lấy tất cả issues!
  → Truyền statuses → filter!
```

**Ví dụ filtering:**

```graphql
# Không filter — lấy tất cả:
query {
  issues {
    name
    status
  }
}
# → Returns: BACKLOG, TODO, INPROGRESS, DONE issues

# Filter theo status:
query {
  issues(input: { statuses: [INPROGRESS] }) {
    name
    status
  }
}
# → Returns: ONLY INPROGRESS issues!

# Filter nhiều statuses:
query {
  issues(input: { statuses: [TODO, INPROGRESS] }) {
    name
    status
  }
}
# → Returns: TODO + INPROGRESS issues!
```

---

## §6. Project Issues Queries — "useQuery Hook, Loading, Error States!"

> Scott: _"It's very similar to how you would do, like useQuery from React Query or SWR. They all kinda just copied each other, which is great for the community."_

```
useQuery LIFECYCLE:
═══════════════════════════════════════════════════════════════

  Component Mount
       │
       ▼
  useQuery(issuesQuery) ──→ fires IMMEDIATELY!
       │                    (unlike useMutation!)
       ▼
  ┌─────────────────┐
  │ fetching = true  │ ──→ Show <Spinner />!
  │ data = undefined │
  │ error = undefined│
  └────────┬────────┘
           ▼
  ┌── API Response ──┐
  │                   │
  ▼                   ▼
  SUCCESS           FAILURE
  ┌────────────┐    ┌────────────┐
  │fetching=false│    │fetching=false│
  │data={issues}│    │error={msg}  │
  │error=undef  │    │data=undef   │
  └────────────┘    └────────────┘
  Show data!        Show error!

  + replayFunction: call lại query bất kỳ lúc nào!
  → "Here's a function you can call to rerun
     the same query." — Scott
```

```
KHÁC BIỆT GIỮA useQuery VÀ useMutation:
═══════════════════════════════════════════════════════════════

  useQuery:
  → Chạy NGAY KHI component mount!
  → Automatic! Không cần trigger!
  → Có thể dùng replay() để chạy lại!
  → Trả về: { data, error, fetching }

  useMutation:
  → KHÔNG chạy tự động!
  → Phải gọi executeMutation() manually!
  → Thường gắn vào onClick, onSubmit!
  → Trả về: [result, executeMutation]

  "Unlike useMutation, when this component renders,
   this query is gonna fire immediately by default.
   You can stop it from happening, but by default,
   it's gonna fire immediately." — Scott
```

### Cách Implement trong Code:

```javascript
// ═══ Step 1: Tạo file query ═══
// gql/IssuesQuery.js

import { gql } from "@urql/next";

export const issuesQuery = gql`
  query IssuesQuery {
    issues {
      id
      name
      content
      status
      createdAt
    }
  }
`;

// ⚠️ QUAN TRỌNG: tên fields PHẢI MATCH component!
// "If I renamed them, you have to appropriately go
//  rename your components and the properties that
//  they're looking for." — Scott
```

```javascript
// ═══ Step 2: Dùng trong Page Component ═══
// app/dashboard/page.jsx

"use client";

import { useQuery } from "@urql/next"; // ← Import từ @urql/next!
import { issuesQuery } from "@/gql/IssuesQuery";
import { Spinner } from "@nextui-org/react";

export default function DashboardPage() {
  // useQuery trả về [result, replayFn]
  const [{ data, error, fetching }, replay] = useQuery({
    query: issuesQuery,
  });

  // Loading state:
  if (fetching) return <Spinner />;

  // Error state:
  if (error) return <div>Error: {error.message}</div>;

  // Success state:
  return (
    <div>
      {data?.issues?.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
```

```
TẠI SAO IMPORT TỪ @urql/next?
═══════════════════════════════════════════════════════════════

  @urql/core     ← Core library
  urql           ← React bindings (basic)
  @urql/next     ← Next.js App Directory support! ✅

  "The other reason I chose urql is they actually are
   one of the only ones that offer full support for
   app directory." — Scott

  Apollo thì sao?
  → Package: @apollo/experimental-nextjs-app-support
  → Tên có "experimental"!
  → "That just means I'm gonna have to reshoot this
     course like two days cuz as soon as I go home,
     they're gonna release the final one." — Scott

  'use client' directive:
  → useQuery là hook → cần client component!
  → @urql/next handles này correctly!
  → "Because we're in use client, we're fine." — Scott
```

### Network Tab Verification:

```
VERIFY QUERY HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  1. Open DevTools → Network tab
  2. Refresh page
  3. Look for request named "graphql"
  4. Click → Preview tab:

  {
    "data": {
      "issues": []        ← Empty array = chưa có issues!
    }
  }

  → Không có error = query hoạt động!
  → Empty array = user chưa tạo issues!
  → Sẽ có data sau khi tạo issues via mutation!

  Loading state: Spinner hiện rồi biến mất!
  "There's my loading state, you saw those fetching." — Scott
```

---

## §7. Tự Code: GraphQL Client + Nested Resolver + Depth Limiter from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: VIẾT TAY GRAPHQL CLIENT (không dùng thư viện!)
// ═══════════════════════════════════════════════════════════

class GraphQLClient {
  constructor(url, options = {}) {
    this.url = url;
    this.headers = options.headers || {};
    this._cache = new Map(); // Query cache!
    this._subscribers = new Map(); // Reactive updates!
  }

  // ═══ Core: gửi query ═══
  async query(queryString, variables = {}, options = {}) {
    const cacheKey = JSON.stringify({ query: queryString, variables });

    // Check cache:
    if (!options.skipCache && this._cache.has(cacheKey)) {
      return { data: this._cache.get(cacheKey), fromCache: true };
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new GraphQLError(result.errors);
    }

    // Cache result:
    this._cache.set(cacheKey, result.data);

    // Notify subscribers:
    this._notifySubscribers(cacheKey, result.data);

    return { data: result.data, fromCache: false };
  }

  // ═══ Mutation (clear relevant cache!) ═══
  async mutate(mutationString, variables = {}) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify({
        query: mutationString,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new GraphQLError(result.errors);
    }

    // Invalidate ALL cache after mutation!
    // (Simple strategy — production dùng targeted invalidation!)
    this._cache.clear();

    return { data: result.data };
  }

  // ═══ Subscribe to query updates ═══
  subscribe(queryString, variables, callback) {
    const key = JSON.stringify({ query: queryString, variables });
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(callback);

    // Unsubscribe function:
    return () => this._subscribers.get(key)?.delete(callback);
  }

  _notifySubscribers(key, data) {
    const subs = this._subscribers.get(key);
    if (subs) subs.forEach((cb) => cb(data));
  }

  // ═══ Auth: set token ═══
  setAuthToken(token) {
    this.headers["Authorization"] = `Bearer ${token}`;
  }
}

class GraphQLError extends Error {
  constructor(errors) {
    super(errors[0]?.message || "GraphQL error");
    this.errors = errors;
    this.name = "GraphQLError";
  }
}

// ═══ Usage ═══
const client = new GraphQLClient("/api/graphql");
client.setAuthToken("jwt_token_here");

const GET_ISSUES = `
  query GetIssues($input: IssuesInput) {
    issues(input: $input) {
      id
      name
      status
    }
  }
`;

// Lấy tất cả issues:
const { data } = await client.query(GET_ISSUES);
console.log(data.issues); // [{ id, name, status }, ...]

// Lấy issues filtered:
const { data: filtered } = await client.query(GET_ISSUES, {
  input: { statuses: ["INPROGRESS"] },
});
console.log(filtered.issues); // Chỉ INPROGRESS issues!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: VIẾT TAY useQuery HOOK (không dùng thư viện!)
// ═══════════════════════════════════════════════════════════

// Custom hook giống urql/Apollo nhưng tự viết!

function useGraphQLQuery(client, queryString, variables = {}) {
  const [state, setState] = useState({
    data: undefined,
    error: undefined,
    fetching: true,
  });

  const variablesKey = JSON.stringify(variables);

  // Execute query khi mount (giống useQuery!):
  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, fetching: true }));

    client
      .query(queryString, variables)
      .then((result) => {
        if (!cancelled) {
          setState({ data: result.data, error: undefined, fetching: false });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ data: undefined, error, fetching: false });
        }
      });

    // Subscribe to cache updates:
    const unsub = client.subscribe(queryString, variables, (newData) => {
      if (!cancelled) {
        setState({ data: newData, error: undefined, fetching: false });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [queryString, variablesKey]);

  // Replay function:
  const replay = useCallback(() => {
    setState((prev) => ({ ...prev, fetching: true }));
    client
      .query(queryString, variables, { skipCache: true })
      .then((result) =>
        setState({ data: result.data, error: undefined, fetching: false }),
      )
      .catch((error) => setState({ data: undefined, error, fetching: false }));
  }, [queryString, variablesKey]);

  return [state, replay];
}

// ═══ Usage (giống hệt urql!) ═══
function Dashboard() {
  const [{ data, error, fetching }, replay] = useGraphQLQuery(
    client,
    GET_ISSUES,
    { input: { statuses: ["TODO", "INPROGRESS"] } },
  );

  if (fetching) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <div>
      <button onClick={replay}>Refresh</button>
      {data?.issues?.map((issue) => (
        <div key={issue.id}>
          <h3>{issue.name}</h3>
          <span className={`status-${issue.status.toLowerCase()}`}>
            {issue.status}
          </span>
        </div>
      ))}
    </div>
  );
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: VIẾT TAY DEPTH LIMITER (chống N+1!)
// ═══════════════════════════════════════════════════════════

class QueryDepthAnalyzer {
  constructor(maxDepth = 5) {
    this.maxDepth = maxDepth;
  }

  // Parse GraphQL query string → đếm depth!
  analyze(queryString) {
    let depth = 0;
    let maxFound = 0;

    for (const char of queryString) {
      if (char === "{") {
        depth++;
        maxFound = Math.max(maxFound, depth);
      } else if (char === "}") {
        depth--;
      }
    }

    return {
      depth: maxFound - 1, // -1 vì outer { } không tính
      allowed: maxFound - 1 <= this.maxDepth,
      maxAllowed: this.maxDepth,
    };
  }

  // Reject query nếu quá sâu:
  validate(queryString) {
    const result = this.analyze(queryString);
    if (!result.allowed) {
      throw new Error(
        `Query depth ${result.depth} exceeds maximum ${this.maxDepth}. ` +
          `Reduce nesting level!`,
      );
    }
    return result;
  }
}

// ═══ Usage ═══
const limiter = new QueryDepthAnalyzer(4);

// ✅ OK — depth 2:
limiter.validate(`
  query {
    issues {
      name
      user { id }
    }
  }
`);
// → { depth: 2, allowed: true }

// ❌ REJECT — depth 5:
try {
  limiter.validate(`
    query {
      issues {
        user {
          issues {
            user {
              issues {
                name
              }
            }
          }
        }
      }
    }
  `);
} catch (e) {
  console.error(e.message);
  // → "Query depth 5 exceeds maximum 4. Reduce nesting level!"
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: VIẾT TAY FIELD WEIGHT CALCULATOR
// ═══════════════════════════════════════════════════════════

class QueryWeightCalculator {
  constructor(maxWeight = 100) {
    this.maxWeight = maxWeight;

    // Mỗi field type có weight khác nhau:
    this.weights = {
      // Query fields (expensive — hit database!):
      issues: 10, // List query = expensive!
      issue: 5, // Single query
      user: 5, // Relation
      users: 10, // List query

      // Scalar fields (cheap — just data!):
      id: 1,
      name: 1,
      email: 1,
      status: 1,
      content: 2, // Text content = slightly more
      createdAt: 1,

      // Default:
      _default: 1,
    };
  }

  calculate(queryString) {
    let totalWeight = 0;
    const fieldRegex = /\b(\w+)\s*[{(]/g;
    const scalarRegex = /^\s*(\w+)\s*$/gm;
    let match;

    // Count query/object fields:
    while ((match = fieldRegex.exec(queryString)) !== null) {
      const field = match[1];
      if (field === "query" || field === "mutation") continue;
      totalWeight += this.weights[field] || this.weights._default;
    }

    // Count scalar fields:
    while ((match = scalarRegex.exec(queryString)) !== null) {
      const field = match[1].trim();
      if (!field || field === "query" || field === "mutation") continue;
      totalWeight += this.weights[field] || this.weights._default;
    }

    return {
      weight: totalWeight,
      allowed: totalWeight <= this.maxWeight,
      maxAllowed: this.maxWeight,
    };
  }

  validate(queryString) {
    const result = this.calculate(queryString);
    if (!result.allowed) {
      throw new Error(
        `Query weight ${result.weight} exceeds maximum ${this.maxWeight}. ` +
          `Request fewer fields or reduce nesting!`,
      );
    }
    return result;
  }
}

// ═══ Usage ═══
const calculator = new QueryWeightCalculator(50);

// Simple query — weight ~15:
calculator.validate(`
  query { issues { id name status } }
`);

// Nested query — weight ~35:
calculator.validate(`
  query {
    issues {
      id name status
      user { id name }
    }
  }
`);

// Over-nested — weight > 50 → REJECT!
try {
  calculator.validate(`
    query {
      issues {
        id name status
        user { id name issues { id name user { id } } }
      }
    }
  `);
} catch (e) {
  console.error(e.message);
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: VIẾT TAY PERSISTED QUERIES SYSTEM
// ═══════════════════════════════════════════════════════════

class PersistedQueryStore {
  constructor() {
    this._queries = new Map(); // id → query string
    this._hashes = new Map(); // hash → id
  }

  // Hash function đơn giản (production dùng SHA256!):
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return "pq_" + Math.abs(hash).toString(36);
  }

  // Register query → get ID:
  register(queryString) {
    const normalized = queryString.replace(/\s+/g, " ").trim();
    const hash = this._hash(normalized);

    if (this._hashes.has(hash)) {
      return this._hashes.get(hash); // Already registered!
    }

    const id = hash;
    this._queries.set(id, normalized);
    this._hashes.set(hash, id);
    return id;
  }

  // Lookup query by ID:
  get(id) {
    return this._queries.get(id) || null;
  }

  // Validate: chỉ cho phép registered queries!
  validate(queryId) {
    if (!this._queries.has(queryId)) {
      throw new Error(`Unknown query ID: ${queryId}. Query not registered!`);
    }
    return this._queries.get(queryId);
  }

  // List all registered queries:
  listAll() {
    return Array.from(this._queries.entries()).map(([id, query]) => ({
      id,
      query: query.substring(0, 80) + "...",
    }));
  }
}

// ═══ Build-time: Register queries ═══
const store = new PersistedQueryStore();

const q1 = store.register(`
  query GetIssues($input: IssuesInput) {
    issues(input: $input) { id name status }
  }
`);
console.log("Registered:", q1); // → "pq_abc123"

const q2 = store.register(`
  query GetUser { user { id name email } }
`);
console.log("Registered:", q2); // → "pq_def456"

// ═══ Runtime: Execute by ID ═══
const queryString = store.validate(q1); // ✅ Found!
// → Execute queryString with variables...

try {
  store.validate("unknown_id"); // ❌ Not registered!
} catch (e) {
  console.error(e.message);
  // → "Unknown query ID: unknown_id. Query not registered!"
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 6: VIẾT TAY MINI GRAPHQL RESOLVER (server-side)
// ═══════════════════════════════════════════════════════════

// Minh hoạ cách server resolve nested data!

class MiniGraphQLResolver {
  constructor() {
    this.resolvers = {};
    this.db = {
      users: [
        { id: "u1", name: "Scott", email: "scott@fm.com" },
        { id: "u2", name: "Sarah", email: "sarah@fm.com" },
      ],
      issues: [
        {
          id: "i1",
          name: "Fix login",
          status: "INPROGRESS",
          userId: "u1",
          content: "...",
        },
        {
          id: "i2",
          name: "Add tests",
          status: "BACKLOG",
          userId: "u1",
          content: "...",
        },
        {
          id: "i3",
          name: "Dark mode",
          status: "TODO",
          userId: "u2",
          content: "...",
        },
      ],
    };
  }

  // Register resolvers:
  addResolver(typeName, fieldName, resolver) {
    if (!this.resolvers[typeName]) this.resolvers[typeName] = {};
    this.resolvers[typeName][fieldName] = resolver;
  }

  // Resolve a query (simplified!):
  resolve(queryName, args = {}) {
    const queryResolver = this.resolvers.Query?.[queryName];
    if (!queryResolver) throw new Error(`Unknown query: ${queryName}`);
    return queryResolver(args, this.db);
  }

  // Resolve nested field on an object:
  resolveField(typeName, fieldName, parent) {
    const fieldResolver = this.resolvers[typeName]?.[fieldName];
    if (!fieldResolver) return parent[fieldName]; // Default: return value!
    return fieldResolver(parent, this.db);
  }
}

// ═══ Setup Resolvers ═══
const gql = new MiniGraphQLResolver();

// Query resolvers:
gql.addResolver("Query", "issues", (args, db) => {
  let issues = db.issues;
  if (args.input?.statuses?.length) {
    issues = issues.filter((i) => args.input.statuses.includes(i.status));
  }
  return issues;
});

gql.addResolver("Query", "user", (args, db) => {
  return db.users.find((u) => u.id === args.id);
});

// Nested resolvers (đây là nơi N+1 xảy ra!):
gql.addResolver("Issue", "user", (issue, db) => {
  // Mỗi issue → 1 DB query cho user!
  // 10 issues = 10 DB queries! ← N+1 problem!
  return db.users.find((u) => u.id === issue.userId);
});

gql.addResolver("User", "issues", (user, db) => {
  // Mỗi user → 1 DB query cho issues!
  return db.issues.filter((i) => i.userId === user.id);
});

// ═══ Execute ═══
const issues = gql.resolve("issues", { input: { statuses: ["INPROGRESS"] } });
console.log(issues);
// → [{ id: 'i1', name: 'Fix login', status: 'INPROGRESS', userId: 'u1' }]

// Resolve nested user:
const issueWithUser = issues.map((issue) => ({
  ...issue,
  user: gql.resolveField("Issue", "user", issue),
}));
console.log(issueWithUser);
// → [{ ..., user: { id: 'u1', name: 'Scott' } }]

// Resolve DEEPER (user → issues → user → ...):
const deep = issueWithUser.map((issue) => ({
  ...issue,
  user: {
    ...issue.user,
    issues: gql.resolveField("User", "issues", issue.user).map((i) => ({
      ...i,
      user: gql.resolveField("Issue", "user", i),
      // Có thể tiếp tục... FOREVER! ← N+1!
    })),
  },
}));
// Mỗi level deeper = thêm N queries!
// Level 1: 1 query (issues)
// Level 2: N queries (users for each issue)
// Level 3: N×M queries (issues for each user)
// Level 4: N×M×N queries → EXPLOSION! 💀
```

---

## §8. Deep Dive: Tại Sao Cyclic Data Nguy Hiểm?

### Bản Chất Của Cyclic References

Trong khoa học máy tính, **cyclic reference** (tham chiếu vòng) là khi object A tham chiếu đến object B, và B lại tham chiếu ngược về A. Đây không phải lỗi — nó là cấu trúc dữ liệu hợp lệ và rất phổ biến:

- **Linked list doubly:** node.next = nodeB, nodeB.prev = node
- **Tree with parent pointers:** child.parent = parent, parent.children = [child]
- **Social graph:** user.friends = [user2], user2.friends = [user]
- **Issue tracker:** issue.user = userA, userA.issues = [issue]

Vấn đề không phải cyclic reference **tồn tại** — mà là khi bạn cố **traverse nó mà không biết khi nào dừng**.

```
CYCLIC REFERENCE TRONG NGÔN NGỮ KHÁC:
═══════════════════════════════════════════════════════════════

  JavaScript:
  JSON.stringify(cyclicObj)     → TypeError!
  console.log(cyclicObj)        → [Circular]

  Python:
  json.dumps(cyclic_dict)       → ValueError!
  repr(cyclic_dict)             → {...}

  Java:
  toString() on cyclic obj      → StackOverflowError!

  GraphQL Server:
  resolve(cyclic_query)         → Out of Memory / Timeout!

  → Mọi ngôn ngữ đều gặp vấn đề với cyclic traversal!
  → GraphQL đặc biệt nguy hiểm vì:
    1. Client QUYẾT ĐỊNH depth (không phải server!)
    2. Mỗi level = DATABASE QUERIES (expensive!)
    3. Exponential growth!
```

### GraphQL Dynamic vs REST Static

Scott nhấn mạnh điểm then chốt:

> _"No one explicitly wrote the queries for that, this is dynamic. The server just has to respond to it. It wasn't written ahead of time, which is something you would have to do with any other protocol."_

```
REST: TĨNH (Static!)
═══════════════════════════════════════════════════════════════

  Backend dev viết:
  app.get('/api/issues', (req, res) => {
    // CHÍNH XÁC 1 kiểu response!
    // Không có nested data beyond what I define!
    const issues = await db.issues.findAll();
    res.json(issues);
  });

  → Backend KIỂM SOÁT hoàn toàn!
  → Client KHÔNG THỂ yêu cầu nested data!
  → An toàn nhưng THIẾU linh hoạt!


GRAPHQL: ĐỘNG (Dynamic!)
═══════════════════════════════════════════════════════════════

  Backend dev viết:
  const resolvers = {
    Query: { issues: () => db.issues.findAll() },
    Issue: { user: (issue) => db.users.findById(issue.userId) },
    User: { issues: (user) => db.issues.findByUserId(user.id) },
  };

  → Client QUYẾT ĐỊNH lấy gì!
  → issues { user { issues { user { ... } } } } ← TÙY Ý!
  → Mạnh nhưng NGUY HIỂM nếu không bảo vệ!
```

### Production Best Practices

```
PRODUCTION BEST PRACTICES:
═══════════════════════════════════════════════════════════════

  Layer 1: Query Depth Limit
  → Max 5-7 levels (tuỳ app!)
  → Reject trước khi execute!

  Layer 2: Query Complexity / Weight
  → Max score per query
  → Tính score dựa trên fields requested!

  Layer 3: Rate Limiting
  → Max N queries per minute per user!
  → Chậm lại nếu quá nhiều!

  Layer 4: Timeout
  → Max 30s per query!
  → Kill nếu quá lâu!

  Layer 5: DataLoader (batching!)
  → Gộp N DB queries thành 1!
  → 10 users = 1 query WHERE id IN (...)!
  → Giải quyết N+1 ở database level!

  Layer 6: Persisted Queries (nếu internal app!)
  → Chỉ cho phép registered queries!
  → An toàn nhất!

  "There are many solutions with trade-offs to help
   you get past it." — Scott
```

---

## 📖 Deep Dive: Client-Side Implications

### Tại Sao Frontend Dev Cần Biết?

Dù N+1 là **server-side problem**, frontend developer cần hiểu vì:

1. **Bạn là người viết queries!** Query quá sâu → server chết → app chết.
2. **Performance impact:** Nested query = many DB queries = slow response → bad UX.
3. **Design decisions:** Biết giới hạn → thiết kế UI + data fetching hợp lý.

```
FRONTEND BEST PRACTICES:
═══════════════════════════════════════════════════════════════

  ❌ DON'T — Query quá sâu:
  query {
    issues {
      user {
        issues {
          user {
            issues { ... }    ← Over-fetching! Slow!
          }
        }
      }
    }
  }

  ✅ DO — Query vừa đủ:
  query {
    issues {
      name
      status
      user { id name }     ← 1 level nested! Đủ dùng!
    }
  }

  ✅ DO — Lazy load nested data:
  // Page 1: GET issues (basic info)
  query { issues { id name status } }

  // User clicks issue → GET details (separate query!)
  query GetIssue($id: ID!) {
    issue(id: $id) {
      content
      user { name email }
    }
  }

  → Chia nhỏ queries theo USER INTENT!
  → Không load tất cả cùng lúc!
```

---

## Checklist

```
[ ] Nested data: Issue → User → Issues → ... = CYCLIC!
[ ] Enum filtering: statuses: [INPROGRESS, TODO]
[ ] Optional input: IssuesInput (no !) = không bắt buộc!
[ ] N+1 problem: mỗi level deeper = exponential DB queries!
[ ] Scott demo live: broke his own server với deep nested query!
[ ] Giải pháp: field weights, AST depth, persisted queries, rate limiting!
[ ] Persisted queries: register → ID → bypass validation → faster!
[ ] "Wouldn't do persisted queries for developer-facing API." — Scott
[ ] JSON.stringify cyclic = error → same problem as N+1!
[ ] useQuery fires IMMEDIATELY on mount (unlike useMutation!)
[ ] useQuery returns: [{ data, error, fetching }, replayFn]
[ ] Import from @urql/next (App Directory support!)
[ ] Operation names must be unique (avoid conflicts!)
[ ] "If I renamed fields, you have to rename in components too." — Scott
[ ] Network tab: check graphql request → verify data!
TIẾP THEO → Phần 12!
```
