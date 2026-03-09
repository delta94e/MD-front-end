# Client-Side GraphQL with React, v2 — Phần 3: What is GraphQL — "TypeScript for Your API!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: What is GraphQL — "It's basically TypeScript for your API. Query language that looks like JSON. Backend does type matching, resolves each field. You can query relational data in any format. One URL, always POST. Type safety: if no error, you got what you asked for. Created by Facebook, used by Netflix, huge ecosystem. Great for mobile (data/network constrained)."
> Độ khó: ⭐️⭐️⭐️ | Core — GraphQL fundamentals, query language, type safety!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | GraphQL Definition — "TypeScript for Your API!"            |
| 2   | How GraphQL Works — "Query → Type Match → Resolve!"        |
| 3   | REST vs GraphQL — "Multiple URLs vs One URL!"              |
| 4   | Type Safety — "Free Input Validation!"                     |
| 5   | Code Generation — "Types All the Way Down!"                |
| 6   | Query Language Fundamentals — "Fields, Nested, Arguments!" |
| 7   | Query Example — "Author with Posts!"                       |
| 8   | The Contract — "If No Error, You Got What You Asked For!"  |
| 9   | GraphQL Ecosystem                                          |
| 10  | Tự Code: GraphQL Queries from Scratch                      |

---

## §1. GraphQL Definition — "TypeScript for Your API!"

> Scott: _"What I think GraphQL is — it's basically TypeScript for your API. That's basically it."_

```
GRAPHQL = "TypeScript for your API!" — Scott

  Official definition:
  "A powerful query language for APIs and a runtime
   for executing those queries with your data's
   type system." (ChatGPT helped write that 😂)

  Scott's definition:
  "It's a way for you to describe the data that
   you want and get it back exactly the way
   that you asked for it, and guarantee type safety.
   That's it." — Scott
```

```
GRAPHQL = 2 PARTS:
═══════════════════════════════════════════════════════════════

  1. Query Language (client-side):
     → Looks very similar to JSON!
     → Describe shape of data you want!

  2. Runtime/Server (backend):
     → Takes query language
     → Does type matching (input validation!)
     → Resolves each field you asked for
     → Returns exact shape you requested!

  "It does the craziest input validation you can
   think of, down to a property level." — Scott
```

---

## §2. How GraphQL Works — "Query → Type Match → Resolve!"

```
GRAPHQL FLOW:
═══════════════════════════════════════════════════════════════

  Client                         GraphQL Server
    │                               │
    │── POST /graphql ────────────→│
    │   {                           │
    │     query: "{ user { name }}" │
    │   }                           │
    │                               │
    │                     Step 1: Type Check!
    │                     → Does "user" query exist?
    │                     → Does "user" have "name" field?
    │                     → Are types correct?
    │                     → If fail → ERROR! ❌
    │                               │
    │                     Step 2: Resolve!
    │                     → Call resolver for "user"
    │                     → Call resolver for "name"
    │                     → Fetch from DB/API/anywhere!
    │                               │
    │←── Response ────────────────│
    │   {                           │
    │     data: {                   │
    │       user: { name: "Scott" } │
    │     }                         │
    │   }                           │
    │                               │

  "You can query highly relational data in any
   format that you want." — Scott
```

```
REST vs GraphQL (Mental Model):
═══════════════════════════════════════════════════════════════

  REST:
  Backend developer defines:
  → Routes (URLs)
  → Query string parameters
  → Response shapes
  → "Here are the rules you have to follow"

  You MUST follow their predefined format! 🔒

  GraphQL:
  Backend developer defines:
  → Schema (types + relationships)
  → That's it!

  You query whatever you want within schema! 🔓
  → "With GraphQL it's infinite.
     You can do whatever you want." — Scott
```

---

## §3. REST vs GraphQL — "Multiple URLs vs One URL!"

> Scott: _"REST is a combination of URL and verb. For every resource, 5-6 routes. With GraphQL, it's just one URL the entire time, always a POST."_

```
REST ENDPOINTS:
═══════════════════════════════════════════════════════════════

  User resource:
  GET    /api/users         → list users
  GET    /api/users/:id     → get user
  POST   /api/users         → create user
  PUT    /api/users/:id     → update user
  DELETE /api/users/:id     → delete user
  → 5 routes per resource!

  Post resource:
  GET    /api/posts          → 5 more routes!
  ...

  Comment resource:
  GET    /api/comments       → 5 more routes!
  ...

  10 resources × 5 routes = 50 routes to manage! 💀

GRAPHQL ENDPOINT:
═══════════════════════════════════════════════════════════════

  POST /graphql              → EVERYTHING! ✅
  → 1 URL!
  → Always POST!
  → No HTTP verbs to think about!

  "That right there just makes it simpler.
   You're only managing one URL." — Scott
```

---

## §4. Type Safety — "Free Input Validation!"

> Scott: _"Type safety = when client sends a query, GraphQL checks inputs for you for free. You don't have to write validation code yourself."_

```
TYPE SAFETY EXAMPLE:
═══════════════════════════════════════════════════════════════

  Creating a user requires: email + password

  WITHOUT GraphQL (manual validation!):
  app.post('/api/users', (req, res) => {
    // YOU write all this validation:
    if (!req.body.email) return res.status(400)...
    if (!req.body.password) return res.status(400)...
    if (req.body.password.length < 8) return res.status(400)...
    if (!isValidEmail(req.body.email)) return res.status(400)...
    // THEN your actual logic:
    const user = await db.createUser(req.body);
  });

  WITH GraphQL (automatic validation!):
  → Schema says: email: String!, password: String!
  → Send query without email? → ERROR automatically!
  → Send wrong type? → ERROR automatically!
  → "That type of validation is executed
     by the GraphQL server WITHOUT you having
     to write the code for it." — Scott

  → "It'll break if the query doesn't satisfy
     the type constraints of your GraphQL server.
     It's just done for you for free." — Scott
```

---

## §5. Code Generation — "Types All the Way Down!"

> Scott: _"You can generate TypeScript from your GraphQL and have type safety all the way down to your frontend code. And then it gets even crazier."_

```
CODE GENERATION:
═══════════════════════════════════════════════════════════════

  GraphQL Schema (server):
  type User {
    id: ID!
    name: String!
    email: String!
  }
       │
       ▼ (code generation tool!)
  TypeScript Types (client):
  interface User {
    id: string;
    name: string;
    email: string;
  }
       │
       ▼ (import in React component!)
  const user: User = data.user; // Full type safety! ✅

  "TypeScript is great but falls apart at network requests.
   How would TypeScript know this API returns this type?
   With GraphQL + codegen, you can bring type safety
   all the way down to the component level." — Scott

  Alternatives:
  → GraphQL + codegen: generates types from schema
  → tRPC: uses TypeScript directly (same repo)
  → "Different ways but yeah, there's codegen."

  ⚠️ Not covered in this course:
  "Too TypeScript-specific. You have to know TypeScript
   to really understand it. But it's actually
   quite easy to do." — Scott
```

---

## §6. Query Language Fundamentals — "Fields, Nested, Arguments!"

> Scott: _"If you've written JSON or JavaScript objects, you'll feel pretty familiar. Fields, nested objects, and arguments — these are the basic building blocks."_

```
BUILDING BLOCKS:
═══════════════════════════════════════════════════════════════

  1. FIELDS — "like fields on an object!"
  query {
    user {
      name        ← field!
      email       ← field!
    }
  }
  → Chỉ nhận fields bạn yêu cầu, nothing else!

  2. NESTED OBJECTS — "relational data!"
  query {
    author {
      name
      posts {         ← nested object!
        title
        content
      }
    }
  }
  → Access relational data from client-side!
  → "Beneficial for frontend, not the other way
     around where backend predefines queries." — Scott

  3. ARGUMENTS — "filter, find by ID!"
  query {
    author(id: "123") {   ← argument!
      name
      posts(limit: 5) {   ← argument!
        title
      }
    }
  }
  → "Give me this author by this ID"
  → "Give me this user by this email"
```

```
REST: BACKEND CREATES THEIR OWN QUERY LANGUAGE!
═══════════════════════════════════════════════════════════════

  Without GraphQL:
  GET /api/authors/123?include=posts&limit=5&sort=date
  → Backend creates custom query string format!
  → "At that point, they're creating their own
     query language. GraphQL is trying to solve that." — Scott

  With GraphQL:
  query {
    author(id: "123") {
      posts(limit: 5, sort: DATE) {
        title
      }
    }
  }
  → Standard query language! ✅
```

---

## §7. Query Example — "Author with Posts!"

```graphql
# GraphQL Query (looks like JSON!):
{
  author(id: "abc123") {
    name
    email
    posts {
      title
      content
      publishDate
    }
  }
}
```

```
WHAT YOU GET BACK:
═══════════════════════════════════════════════════════════════

  {
    "data": {
      "author": {
        "name": "Scott Moss",
        "email": "scott@example.com",
        "posts": [
          {
            "title": "GraphQL is awesome",
            "content": "Here's why...",
            "publishDate": "2026-01-15"
          },
          {
            "title": "React + GraphQL",
            "content": "Best combo...",
            "publishDate": "2026-02-20"
          }
        ]
      }
    }
  }

  → Exact same shape as query!
  → name, email, posts array!
  → Each post: title, content, publishDate!
  → "Nothing more, nothing less." — Scott
  → "Now you can write UI in a predictable way." — Scott
```

---

## §8. The Contract — "If No Error, You Got What You Asked For!"

> Scott: _"GraphQL would break BEFORE it didn't come back this way. If you didn't get back an error, you got back what you asked for. That's the guarantee, that's the contract, that's the type safety."_

```
THE GRAPHQL CONTRACT:
═══════════════════════════════════════════════════════════════

  Send query →
  ├── Query matches schema?
  │   ├── YES → Resolve → Return exact shape! ✅
  │   └── NO  → Return ERROR! ❌
  │
  └── "There's no way it will respond with a
       successful request without it being
       this shape, because you can only send
       a query that matches the schema." — Scott

  2 outcomes only:
  1. ERROR → query didn't match schema
  2. SUCCESS → data is EXACTLY what you asked for! ✅

  "If you send something that wasn't possible,
   you'll get back an error. If you didn't get
   back an error, you got what you asked for.
   That's the guarantee." — Scott
```

---

## §9. GraphQL Ecosystem

> Scott: _"Created by Facebook. Netflix uses it. Billion dollar products are tools just for GraphQL. Huge ecosystem — plugins, applications, tooling. Mobile + GraphQL works very well."_

```
GRAPHQL ECOSYSTEM:
═══════════════════════════════════════════════════════════════

  Created by: Facebook (2012, open-source 2015)

  Used by:
  → Netflix, Shopify, GitHub, Airbnb,
     Twitter, PayPal, The New York Times...

  Products built for GraphQL:
  → Apollo (billion dollar company!)
  → Hasura, Hygraph, Stellate...
  → "Startups with billion dollar products
     that are tools just for GraphQL." — Scott

  Tooling:
  → Apollo Client, urql, Relay (clients)
  → Apollo Studio, GraphiQL (explorers)
  → GraphQL Code Generator (types)
  → "Tons of open source, plugins, tooling!"

  MOBILE USE CASE:
  → "Mobile and GraphQL works very well.
     Mobile is data constrained, network constrained.
     You only wanna get information you need.
     Anything more is expensive." — Scott
```

---

## §10. Tự Code: GraphQL Queries from Scratch

```javascript
// ═══ GRAPHQL QUERY ANATOMY ═══

// 1. Simple query (lấy danh sách users):
const GET_USERS = `
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;
// Response: { data: { users: [{ id, name, email }, ...] } }

// 2. Query with arguments (lấy user theo ID):
const GET_USER = `
  query GetUser($userId: ID!) {
    user(id: $userId) {
      name
      email
      role
    }
  }
`;
// Variables: { userId: "abc123" }

// 3. Nested query (user + posts + comments):
const GET_USER_WITH_POSTS = `
  query GetUserWithPosts($userId: ID!) {
    user(id: $userId) {
      name
      posts {
        title
        content
        comments {
          text
          author {
            name
          }
        }
      }
    }
  }
`;
// 1 request = user + all posts + all comments + comment authors!
// REST would need 3-4 separate requests! 💀

// ═══ SENDING GRAPHQL REQUEST (vanilla fetch!) ═══

async function gqlFetch(query, variables = {}) {
  const response = await fetch("/api/graphql", {
    method: "POST", // Always POST!
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  // GraphQL always returns { data, errors }
  if (result.errors) {
    // Type safety! Query didn't match schema!
    console.error("GraphQL errors:", result.errors);
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// Usage:
const users = await gqlFetch(GET_USERS);
// users = { users: [{ id: "1", name: "Scott", email: "..." }] }

const user = await gqlFetch(GET_USER, { userId: "abc123" });
// user = { user: { name: "Scott", email: "...", role: "admin" } }

const userWithPosts = await gqlFetch(GET_USER_WITH_POSTS, {
  userId: "abc123",
});
// userWithPosts = {
//   user: {
//     name: "Scott",
//     posts: [{
//       title: "...",
//       content: "...",
//       comments: [{ text: "...", author: { name: "..." } }]
//     }]
//   }
// }

// ═══ SO SÁNH REST vs GRAPHQL ═══

// REST: 4 requests cho cùng data!
async function getDataREST() {
  const user = await fetch("/api/users/123").then((r) => r.json());
  const posts = await fetch("/api/users/123/posts").then((r) => r.json());
  const comments = await Promise.all(
    posts.map((p) =>
      fetch(`/api/posts/${p.id}/comments`).then((r) => r.json()),
    ),
  );
  // Combine manually... over-fetching... under-fetching... 💀
}

// GraphQL: 1 request!
async function getDataGraphQL() {
  const data = await gqlFetch(GET_USER_WITH_POSTS, { userId: "123" });
  // Done! Exact shape! No combining! ✅
}

console.log("═══ WHAT IS GRAPHQL ═══");
console.log("1. Query language (looks like JSON!)");
console.log("2. Backend runtime (type matching + resolvers!)");
console.log("3. One URL, always POST!");
console.log("4. Type safety for free!");
console.log("5. 'TypeScript for your API!' — Scott");
```

---

## 📖 Deep Dive: Tại Sao REST Tạo Ra "Query Language" Riêng?

Scott đưa ra một insight rất sâu sắc: khi REST không đủ linh hoạt, backend developers **tự phát minh ra query language** của riêng họ thông qua query strings:

```
GET /api/authors?include=posts,comments&fields=name,email
    &posts.limit=10&posts.sort=createdAt:desc
    &comments.fields=text,author
```

Đây thực chất là **một query language tự chế** — không standard, không documented, không type-safe. Mỗi API có format riêng. GraphQL giải quyết vấn đề này bằng cách cung cấp **một standard query language** mà toàn bộ ecosystem đều hiểu.

### Schema ≠ Database Schema

Một câu hỏi quan trọng từ học viên: _"Is GraphQL type system same as database?"_

Scott's answer: **Không nhất thiết!** GraphQL schema:

- **Heavily inspired** by database schema
- Nhưng có thể **hide fields** (password!)
- Có thể **rename fields** (snake_case → camelCase)
- Có thể **combine/transform** fields
- Có thể **talk to any source** — không chỉ database mà còn Stripe, other APIs, other GraphQL servers!

> _"GraphQL doesn't only have to talk to your database. It can talk to another GraphQL server, Stripe, another API hosted anywhere."_ — Scott

---

## Checklist

```
[ ] GraphQL = "TypeScript for your API!" — Scott
[ ] 2 parts: query language (client) + runtime (server)!
[ ] Query looks like JSON!
[ ] Backend: type matching → resolve each field!
[ ] REST: multiple URLs + verbs → many routes!
[ ] GraphQL: 1 URL (/graphql), always POST!
[ ] Type safety: free input validation on server!
[ ] "If no error, you got what you asked for!" — contract!
[ ] Code generation: TypeScript types from GraphQL schema!
[ ] 3 building blocks: fields, nested objects, arguments!
[ ] Mobile + GraphQL: perfect match (data constrained!)!
[ ] Created by Facebook, used by Netflix, huge ecosystem!
TIẾP THEO → Phần 4: GraphQL Playground!
```
