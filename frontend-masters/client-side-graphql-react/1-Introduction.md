# Client-Side GraphQL with React, v2 — Phần 1: Introduction — "GraphQL on the Client Side!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix, VC, startup founder)
> Bài: Introduction — "GraphQL is a way to interact with APIs. Next.js = best way to start React (recommended on React website). App: Parallel (Linear clone) — productivity app with issues, statuses, authentication. Backend done, focus on frontend GraphQL integration. TypeScript optional."
> Độ khó: ⭐️ | Intro — course overview, prerequisites, app preview!

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | Giới Thiệu Giảng Viên — "Scott Moss!"         |
| 2   | Prerequisites — "React, JS, API Experience!"  |
| 3   | Tại Sao Next.js?                              |
| 4   | App Demo: Parallel — "Linear Clone!"          |
| 5   | Course Format & Tips                          |
| 6   | GraphQL Là Gì? — Tổng Quan Nhanh              |
| 7   | So Sánh REST vs GraphQL — Bức Tranh Toàn Cảnh |
| 8   | Tự Code: Setup & First Look                   |

---

## §1. Giới Thiệu Giảng Viên — "Scott Moss!"

> Scott: _"I've been a software engineer for over 10 years. Currently running my own startup. Previous stints as VC, founder, worked at Netflix. When it comes to GraphQL, I've seen many different flavors. I was around when it first came out."_

```
SCOTT MOSS:
═══════════════════════════════════════════════════════════════

  Kinh nghiệm: 10+ năm Software Engineer
  Các vị trí:
  ├── Netflix (SWE!)
  ├── Venture Capitalist (VC!)
  ├── Startup Founder (nhiều lần!)
  └── Hiện tại: running own startup

  GraphQL experience:
  → "Was around when it first came out"
  → "Seen many different flavors"
  → "Still surprised how much value it adds
     when used correctly and in right scenario"

  Teaching style:
  → Introduce topics + riff on them
  → Live coding + examples
  → Apply to real app
```

---

## §2. Prerequisites — "React, JS, API Experience!"

> Scott: _"You do need to know React. You need to know JavaScript. TypeScript is optional. Having experience interacting with APIs from client side — Axios, Fetch — is quite useful since that's what GraphQL is."_

```
PREREQUISITES:
═══════════════════════════════════════════════════════════════

  ✅ REQUIRED:
  • React (won't write React code, but need to understand!)
  • JavaScript (ES6+)
  • API interaction experience (Fetch, Axios)
  • How HTTP works in browser

  📝 OPTIONAL (nhưng hữu ích):
  • TypeScript (all types are optional!)
  • Next.js (only client-side React features used!)

  ❌ NOT REQUIRED:
  • Next.js server components
  • Server-side rendering
  • Backend/GraphQL server knowledge

  "You won't be writing any React in this course.
   We're focusing purely on GraphQL aspects
   and how it integrates with React." — Scott
```

---

## §3. Tại Sao Next.js?

> Scott: _"Next.js is the best way to get started with React. It's actually what's recommended on their website. We're gonna opt out of all the server-side components and server-rendered things. We're just gonna use client-side React."_

```
TẠI SAO NEXT.JS?
═══════════════════════════════════════════════════════════════

  Q: "Tại sao dùng Next.js thay vì Create React App?"

  A: React.dev đề xuất Next.js là cách tốt nhất để bắt đầu!
     → "It's actually what's recommended
        on their website" — Scott

  Cách sử dụng trong khoá:
  ├── ✅ Client-side React features
  ├── ❌ Server Components (opt out!)
  ├── ❌ Server-side rendering (opt out!)
  └── ❌ Server actions (opt out!)

  "You don't need to know Next.js.
   It's gonna be totally fine." — Scott
```

---

## §4. App Demo: Parallel — "Linear Clone!"

> Scott: _"You're gonna be finishing an app I didn't finish. It's a play on one of my favorite apps, Linear. This app is called Parallel — basically a productivity app."_

```
APP: PARALLEL (Linear Clone):
═══════════════════════════════════════════════════════════════

  Parallel = Productivity app (like Asana/Linear!)

  Features:
  ├── Create new issues
  ├── View list of issues
  ├── Change issue status
  ├── Authentication (sign in / sign up)
  └── User management

  ┌─────────────────────────────────────────┐
  │  PARALLEL — Issue Tracker               │
  │─────────────────────────────────────────│
  │  [ ] Buy groceries         → Todo       │
  │  [/] Write documentation   → In Progress│
  │  [x] Fix login bug         → Done       │
  │  [ ] Deploy to production  → Todo       │
  │                                         │
  │  [+ Create New Issue]                   │
  └─────────────────────────────────────────┘

  What's done:
  ✅ Backend (API server, database!)
  ✅ React components (UI!)
  ✅ Design/styling

  What YOU do:
  → Make interactions work with GraphQL!
  → Connect frontend to backend!
  → "You won't have to write any React
     or do any design." — Scott
```

---

## §5. Course Format & Tips

> Scott: _"The code will always be on GitHub. When copying GraphQL queries from Notion, tab characters cause errors in GraphQL parser. Get code from GitHub instead."_

```
COURSE FORMAT:
═══════════════════════════════════════════════════════════════

  Structure:
  1. Introduce topic → explain concepts
  2. Live coding → show examples
  3. Apply to app → build Parallel features

  ⚠️ NOTION WARNING:
  GraphQL queries trong Notion có TAB characters!
  → Tab characters = GraphQL parser errors! 💀
  → "Notion adds tab characters sometimes
     and those get interpreted by the parser" — Scott

  ✅ SOLUTION: Copy code from GitHub!
  → Each lesson = separate branch
  → Always up to date
  → "The code will always be on GitHub
     once I'm done with that lesson" — Scott
```

---

## §6. GraphQL Là Gì? — Tổng Quan Nhanh

```
GRAPHQL OVERVIEW:
═══════════════════════════════════════════════════════════════

  GraphQL = Query Language cho APIs!
  → Được phát triển bởi Facebook (2012, open-source 2015)
  → "A way to interact with APIs" — Scott

  Đặc điểm chính:
  ├── Single endpoint (thường là /graphql)
  ├── Client quyết định data cần lấy!
  ├── Strongly typed schema
  ├── No over-fetching (chỉ lấy fields cần!)
  └── No under-fetching (lấy đủ trong 1 request!)

  3 operations:
  ├── Query     → Đọc data (GET)
  ├── Mutation   → Thay đổi data (POST/PUT/DELETE)
  └── Subscription → Real-time updates (WebSocket/SSE)

  Trong khoá này: tập trung Query + Mutation!
```

```
CLIENT-SIDE GRAPHQL:
═══════════════════════════════════════════════════════════════

  Server-side GraphQL:
  → Define schema, resolvers, data sources
  → Build API server

  Client-side GraphQL (khoá này!):
  → Write queries & mutations
  → Send requests to GraphQL API
  → Handle responses
  → Caching & state management
  → Integrate with React components

  "When you use it correctly and in the right scenario,
   it adds so much value." — Scott
```

---

## §7. So Sánh REST vs GraphQL — Bức Tranh Toàn Cảnh

```
REST vs GraphQL:
═══════════════════════════════════════════════════════════════

  REST:
  GET /api/users/1           → user data (ALL fields!)
  GET /api/users/1/posts     → user's posts (separate request!)
  GET /api/users/1/comments  → user's comments (another request!)
  → 3 requests! Over-fetching! Under-fetching!

  GraphQL:
  POST /graphql
  query {
    user(id: "1") {
      name              ← chỉ lấy fields cần!
      posts {
        title
      }
      comments {
        text
      }
    }
  }
  → 1 request! Exact data needed! ✅

  | Feature        | REST            | GraphQL         |
  |----------------|-----------------|-----------------|
  | Endpoints      | Multiple URLs   | Single /graphql |
  | Data fetching  | Server decides  | Client decides! |
  | Over-fetching  | Common 💀       | None ✅          |
  | Under-fetching | Common 💀       | None ✅          |
  | Typing         | Optional        | Built-in schema |
  | Caching        | HTTP cache      | Client library  |
  | Learning curve | Low             | Medium          |
```

---

## §8. Tự Code: Setup & First Look

```javascript
// ═══ GraphQL QUERY (cú pháp cơ bản!) ═══

// Ví dụ: lấy danh sách issues
const GET_ISSUES = `
  query GetIssues {
    issues {
      id
      title
      status
      createdAt
    }
  }
`;

// Ví dụ: tạo issue mới
const CREATE_ISSUE = `
  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      id
      title
      status
    }
  }
`;

// ═══ FETCH GraphQL (vanilla — không thư viện!) ═══

async function graphqlFetch(query, variables = {}) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authentication token nếu cần:
      // 'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  return data;
}

// Usage:
async function loadIssues() {
  const data = await graphqlFetch(GET_ISSUES);
  console.log(data.issues); // [{ id, title, status, createdAt }, ...]
}

async function createIssue(title) {
  const data = await graphqlFetch(CREATE_ISSUE, {
    input: { title, status: "TODO" },
  });
  console.log("Created:", data.createIssue);
}

// ═══ GRAPHQL LUÔN LÀ POST! ═══
// → Dù query (đọc) hay mutation (ghi)
// → Luôn gửi POST request
// → Body = JSON { query, variables }
// → Response = JSON { data, errors }

console.log("═══ CLIENT-SIDE GRAPHQL ═══");
console.log("1 endpoint: /graphql (POST!)");
console.log("Client quyết định data cần lấy!");
console.log("Query = đọc, Mutation = ghi!");
console.log("Response: { data, errors }");
console.log("App: Parallel (Linear clone!) — productivity app!");
```

---

## 📖 Deep Dive: GraphQL Trên Client — Tại Sao Lại Quan Trọng?

### Vấn Đề Với REST

Khi xây dựng ứng dụng frontend hiện đại, chúng ta thường gặp phải **ба vấn đề lớn** với REST API:

**1. Over-fetching**: Server trả về toàn bộ dữ liệu của resource, kể cả những field bạn không cần. Ví dụ, bạn chỉ cần `name` và `avatar` của user, nhưng `/api/users/1` trả về cả `email`, `address`, `phone`, `createdAt`, `updatedAt`, và 20 fields khác. Trên mobile với 3G, mỗi byte thừa đều đáng tiền.

**2. Under-fetching**: Một request không đủ data. Để hiển thị profile page, bạn cần user info + posts + comments + followers — tức 4 requests riêng biệt. Mỗi request = 1 round-trip to server. Trên mạng chậm, đây là thảm họa UX.

**3. Endpoint explosion**: Mỗi feature mới = endpoint mới. Users, Posts, Comments, Likes, Notifications, Settings... Rồi custom endpoints cho từng view: `/api/dashboard`, `/api/profile-summary`, `/api/feed-with-comments`. Backend team bận rộn tạo endpoint cho mỗi design change.

### GraphQL Giải Quyết Như Thế Nào?

GraphQL đặt **quyền quyết định data vào tay client**. Frontend developer viết chính xác data cần, gửi 1 request, nhận đúng data đó. Không thừa, không thiếu, không cần backend tạo endpoint mới.

Scott Moss nhấn mạnh: _"I'm still surprised by how much value we can add when you use it correctly and in the right scenario."_ Từ khóa ở đây là **"correctly"** và **"right scenario"** — GraphQL không phải silver bullet. Nhưng khi dùng đúng, nó biến đổi hoàn toàn developer experience.

### Client-Side Focus

Khoá này tập trung hoàn toàn vào **client-side**:

- Không cần biết cách build GraphQL server
- Backend đã có sẵn (Parallel app)
- Chỉ cần biết cách **viết queries**, **gửi requests**, **handle responses**, và **quản lý cache**

Đây chính là kỹ năng thực tế nhất cho frontend developer — bạn sẽ gặp GraphQL API ở các công ty sử dụng nó (Shopify, GitHub, Airbnb, Netflix...) và cần biết cách tương tác từ phía client.

---

## Checklist

```
[ ] Scott Moss: 10+ năm SWE, ex-Netflix, startup founder!
[ ] Prerequisites: React, JavaScript, API experience!
[ ] TypeScript: optional!
[ ] Next.js: only client-side React features!
[ ] App: Parallel (Linear clone) — productivity/issue tracker!
[ ] Backend done, focus on frontend GraphQL integration!
[ ] GraphQL: single endpoint, client decides data!
[ ] Query (đọc) + Mutation (ghi) + Subscription (real-time)!
[ ] Always POST request to /graphql!
[ ] Response: { data, errors }!
[ ] ⚠️ Notion tab characters break GraphQL parser → use GitHub!
TIẾP THEO → Phần 2!
```
