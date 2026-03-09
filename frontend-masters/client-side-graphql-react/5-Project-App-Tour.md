# Client-Side GraphQL with React, v2 — Phần 5: Project App Tour — "Parallel: Linear Clone!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: Project App Tour — "App called Parallel (Linear clone). Productivity app — create issues, change status. 5 queries/mutations needed. Main branch = complete app. Client/0 branch = empty client code. No React, no CSS, no JSX — just GraphQL!"
> Độ khó: ⭐️ | Tour — app walkthrough, branch strategy!

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | Parallel App — "Linear Clone!"                  |
| 2   | Features & CRUD Operations                      |
| 3   | Branch Strategy — "main vs client/0!"           |
| 4   | What You Build vs What's Done                   |
| 5   | Sign Out Hack — "Delete JWT from localStorage!" |
| 6   | Tự Code: App Architecture Overview              |

---

## §1. Parallel App — "Linear Clone!"

> Scott: _"It's a play on one of my favorite apps called Linear. This app is called Parallel — a productivity tool where you can keep track of all your tasks."_

```
PARALLEL APP:
═══════════════════════════════════════════════════════════════

  Inspired by: Linear (productivity tool!)
  Name: Parallel (play on Linear!)
  Type: Issue tracker / Task management

  ┌─────────────────────────────────────────┐
  │  PARALLEL — Issues                      │
  │─────────────────────────────────────────│
  │  PAR-1  Teaching a course    → Todo      │
  │  PAR-2  Hello                → In Progress│
  │  PAR-3  Fix login bug        → Done      │
  │                                         │
  │  [+ Create Issue]                       │
  └─────────────────────────────────────────┘

  "I really love Linear, so I made a very
   slimmed down version" — Scott
```

---

## §2. Features & CRUD Operations

> Scott: _"Simple CRUD operations. But within that whole flow from sign up to editing issues, there's probably 5 queries or mutations we need to make in GraphQL."_

```
FEATURES:
═══════════════════════════════════════════════════════════════

  1. Sign Up → create user account
  2. Sign In → authenticate
  3. Create Issue → add new task
  4. View Issues → list all tasks
  5. Change Status → update task status
     (Todo → In Progress → Done)

  GraphQL operations needed:
  ├── Mutation: createUser (sign up!)
  ├── Mutation: signin (sign in!)
  ├── Mutation: createIssue (new task!)
  ├── Query: getIssues (list tasks!)
  └── Mutation: updateIssue (change status!)
  → "5 queries or mutations!" — Scott

  + Setup: GraphQL client configuration!
```

---

## §3. Branch Strategy — "main vs client/0!"

> Scott: _"Main branch = fully functioning app. Client/0 branch = all client code removed. Every time I do a topic, I cut a new branch: client/0, client/1, client/2..."_

```
BRANCH STRATEGY:
═══════════════════════════════════════════════════════════════

  main        → Complete app (frontend + backend!)
                → "Great resource to see how I did it" — Scott

  client/0    → Starting point (client code removed!)
                → App runs but can't DO anything!
                → "Sign in/up won't work. No handler!" — Scott

  client/1    → After first lesson checkpoint
  client/2    → After second lesson checkpoint
  ...

  "I'll keep pushing branches up so you can
   go back and look at them on GitHub." — Scott

  ⚠️ If gqlProvider.tsx already exists:
  → "You're on the wrong branch.
     Go to client/0!" — Scott
```

---

## §4. What You Build vs What's Done

```
WHAT'S DONE (don't touch!):
═══════════════════════════════════════════════════════════════

  ✅ Backend (API server, database, schema!)
  ✅ React components (all UI!)
  ✅ CSS/Tailwind styling
  ✅ Navigation/routing
  ✅ Form handling (state, onChange, onSubmit!)

  "You're not gonna be building any UI stuff,
   no CSS stuff. It's all just GraphQL." — Scott

  "If you're worried, I'm not good with Tailwind,
   I'm about to be found out — no, that's not gonna
   happen today. Nobody's good with CSS." — Scott 😂

WHAT YOU BUILD:
═══════════════════════════════════════════════════════════════

  → GraphQL queries & mutations
  → GraphQL client setup (Urql provider!)
  → Connect frontend to backend via GraphQL
  → "Won't even be touching JSX.
     A small smidge of JSX." — Scott

  Side menu links (extra credit!):
  → "I left that there for people who want
     to expand. You won't learn anything new,
     just more reps." — Scott
```

---

## §5. Sign Out Hack — "Delete JWT from localStorage!"

> Scott: _"That button wasn't in the budget. To sign out: open DevTools → Application → Local Storage → delete the JSON Web Token."_

```
SIGN OUT (manual!):
═══════════════════════════════════════════════════════════════

  Step 1: Open DevTools (F12 or Cmd+Option+I)
  Step 2: Go to Application tab
  Step 3: Click Local Storage
  Step 4: Delete the JWT entry
  Step 5: Refresh page → back to sign in!

  "That button wasn't in the budget" — Scott 😂
```

---

## §6. Tự Code: App Architecture Overview

```javascript
// ═══ PARALLEL APP ARCHITECTURE ═══

// Frontend (what we work on!):
// Next.js + React (client-side only!)
// ├── app/
// │   ├── layout.tsx          ← root layout
// │   ├── (auth)/
// │   │   ├── sign-in/page.tsx  ← sign in form
// │   │   └── sign-up/page.tsx  ← sign up form
// │   └── (dashboard)/
// │       └── page.tsx          ← issues list
// ├── gql/                      ← GraphQL queries/mutations!
// │   ├── signupMutation.ts
// │   ├── signinMutation.ts
// │   ├── createIssueMutation.ts
// │   └── getIssuesQuery.ts
// └── lib/
//     └── utils.ts              ← getToken, getUrl, etc.

// Backend (already done!):
// ├── API: /api/graphql         ← single endpoint!
// ├── Database: Turso (SQLite!)
// ├── ORM: Drizzle
// └── Auth: JWT (JSON Web Token!)

// ═══ DATA FLOW ═══

//  User clicks "Create Issue"
//       │
//       ▼
//  React Component (form state!)
//       │
//       ▼
//  GraphQL Mutation (via Urql hook!)
//       │
//       ▼
//  POST /api/graphql (always POST, always 200!)
//       │
//       ▼
//  GraphQL Server (type check → resolve!)
//       │
//       ▼
//  Database (Turso/SQLite!)
//       │
//       ▼
//  Response: { data: { createIssue: { id, title, status } } }
//       │
//       ▼
//  React updates UI! ✅

console.log("═══ PARALLEL APP TOUR ═══");
console.log("Linear clone with issues + status!");
console.log("5 GraphQL operations: 3 mutations + 2 queries!");
console.log("main = complete, client/0 = starting point!");
console.log("No React/CSS coding — just GraphQL!");
```

---

## Checklist

```
[ ] Parallel = Linear clone (productivity/issue tracker!)
[ ] 5 GraphQL operations: signup, signin, create, list, update!
[ ] main branch = complete app!
[ ] client/0 branch = empty client (starting point!)
[ ] Backend done: API + database + auth!
[ ] No React/CSS/JSX — only GraphQL!
[ ] Sign out: delete JWT from localStorage!
[ ] Extra credit: sidebar links for more features!
TIẾP THEO → Phần 6: GraphQL Query with fetch!
```
