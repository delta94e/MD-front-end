# Client-Side GraphQL with React, v2 — Phần 9: Creating a Sign Up Mutation — "Variables = Function Arguments!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: Creating a Sign Up Mutation — "Mutation = write. Query = read. Use Apollo Studio at /api/graphql to explore and test. ! = non-null (required!). $input = argument name (like function argument!). Type must match schema. export from gql/ folder. gql template tag = string → GraphQL document."
> Độ khó: ⭐️⭐️⭐️ | Core — first mutation, variables, GraphQL Studio workflow!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | Query vs Mutation — "Read vs Write!"                 |
| 2   | Apollo Studio tại /api/graphql — "Explore Your API!" |
| 3   | Create User Mutation — "Step by Step!"               |
| 4   | Variables Deep Dive — "Function Arguments!"          |
| 5   | gql Template Tag — "String → Document!"              |
| 6   | File Organization — "gql/ Folder!"                   |
| 7   | Tự Code: Mutation Patterns from Scratch              |

---

## §1. Query vs Mutation — "Read vs Write!"

> Scott: _"A mutation is like a query. If a query is a read, a mutation is a write. You're mutating some state somewhere."_

```
QUERY vs MUTATION:
═══════════════════════════════════════════════════════════════

  Query = READ (đọc data!)
  → Lấy danh sách issues
  → Lấy user profile
  → Lấy comments
  → Tự động chạy khi component render!

  Mutation = WRITE (ghi data!)
  → Tạo user mới (sign up!)
  → Đăng nhập (sign in!)
  → Tạo issue mới
  → Cập nhật issue status
  → PHẢI trigger bằng function! ✅

  3rd type: Subscription = REAL-TIME!
  → WebSocket-based
  → "We won't talk about those too much" — Scott
```

---

## §2. Apollo Studio tại /api/graphql — "Explore Your API!"

> Scott: _"If you go to 3000/api/graphql in browser, you get an app. This is where I experiment and write queries. Then I copy them to frontend."_

```
WORKFLOW:
═══════════════════════════════════════════════════════════════

  1. Start dev server: npm run dev
  2. Open: http://localhost:3000/api/graphql
  3. Explore available queries + mutations!
  4. Write & test mutation in Studio!
  5. Copy mutation to gql/ folder!
  6. Import in React component!

  "It's like Postman but for GraphQL.
   Fully functional, connected to YOUR database.
   You can actually create users, sign in,
   create issues — everything works!" — Scott

  Root Types available:
  ├── query      → things you can GET!
  ├── mutation   → things you can WRITE!
  └── subscription → WebSocket stuff!
```

---

## §3. Create User Mutation — "Step by Step!"

> Scott: _"Which mutation for signing in? Probably createUser. It has a non-null argument (exclamation mark!). I must pass input of type AuthInput which has email and password."_

```graphql
# Mutation built in Apollo Studio:
mutation CreateUser($input: AuthInput!) {
  createUser(input: $input) {
    token
    id
  }
}

# Variables:
{
  "input": {
    "email": "admin@admin.com",
    "password": "password"
  }
}
```

```
MUTATION ANATOMY:
═══════════════════════════════════════════════════════════════

  mutation CreateUser($input: AuthInput!) {
  │        │           │       │        │
  │        │           │       │        └── ! = required!
  │        │           │       └── Type: AuthInput
  │        │           └── Variable: $input
  │        └── Name: CreateUser (like function name!)
  └── Operation: mutation (not query!)

  createUser(input: $input) {
  │          │      │
  │          │      └── Pass variable as argument!
  │          └── Argument name (MUST match schema!)
  └── Mutation name (defined by schema!)

  AuthInput type (from schema):
  {
    email: String!     ← required!
    password: String!  ← required!
  }

  ! = NON-NULL = REQUIRED!
  → "I know it's non-null because there's
     an exclamation mark. You HAVE to include this." — Scott
```

---

## §4. Variables Deep Dive — "Function Arguments!"

> Scott: _"It wasn't until I thought about it as just a regular function argument that it started making sense. This is creating a function. This is calling a function."_

```
VARIABLES = FUNCTION ARGUMENTS:
═══════════════════════════════════════════════════════════════

  JavaScript function analogy:

  // CREATING a function (define arguments!):
  function createUser(input) {    ← declare argument!
    return db.create(input);      ← use argument!
  }

  // CALLING a function (pass values!):
  createUser({ email: "...", password: "..." });

  GraphQL equivalent:

  // CREATING (declare variables!) — line 1:
  mutation CreateUser($input: AuthInput!) {
  //                   ↑ declare argument!
  //                   Can call it ANYTHING!

  // CALLING (pass variables!) — line 2:
    createUser(input: $input) {
    //         ↑ MUST match schema!
    //                ↑ use declared argument!

  2 rules:
  1. $variable name must match variables JSON!
     $input → { "input": ... }
  2. Argument name must match schema!
     input: $input → schema says "input"!

  "These dollar variables can be whatever you want,
   as long as they're the same as your variables
   JSON." — Scott
```

```
VARIABLE NAMING FREEDOM:
═══════════════════════════════════════════════════════════════

  These ALL work:

  mutation A($input: AuthInput!) {
    createUser(input: $input) { ... }
  }
  Variables: { "input": { email, password } }

  mutation B($a: AuthInput!) {
    createUser(input: $a) { ... }
  }
  Variables: { "a": { email, password } }

  mutation C($myData: AuthInput!) {
    createUser(input: $myData) { ... }
  }
  Variables: { "myData": { email, password } }

  → $name can be anything!
  → But MUST match variables JSON key!
  → Argument "input" MUST match schema! ✅
```

---

## §5. gql Template Tag — "String → Document!"

> Scott: _"gql allows us to do a template tag. It converts your string into a GraphQL document — some objects we can pass to the query. You don't have to use this, a regular string works just fine."_

```javascript
// Without gql (plain string — works!):
const SIGNUP = `
  mutation CreateUser($input: AuthInput!) {
    createUser(input: $input) {
      token
      id
    }
  }
`;

// With gql template tag (better!):
import { gql } from "@urql/core";

const SIGNUP = gql`
  mutation CreateUser($input: AuthInput!) {
    createUser(input: $input) {
      token
      id
    }
  }
`;

// What gql does:
// → Parses string into GraphQL Document (AST!)
// → Enables syntax highlighting!
// → Enables IDE autocomplete!
// → Enables transformations/plugins!
// → "It's another level of abstraction.
//    People do this for code highlight,
//    it's just a lot better." — Scott
```

---

## §6. File Organization — "gql/ Folder!"

> Scott: _"For every single query or mutation, we're gonna put it in its own file. Keep them separate."_

```
FILE STRUCTURE:
═══════════════════════════════════════════════════════════════

  gql/
  ├── signupMutation.ts     ← export const SignupMutation
  ├── signinMutation.ts     ← export const SigninMutation
  ├── createIssueMutation.ts
  ├── updateIssueMutation.ts
  └── getIssuesQuery.ts

  Each file:
  import { gql } from '@urql/core';

  export const SignupMutation = gql`
    mutation CreateUser($input: AuthInput!) {
      createUser(input: $input) {
        token
      }
    }
  `;

  "Named export so I don't have name conflicts
   when I import it." — Scott

  ⚠️ "At minimum, you need token.
   If you don't have token, there's gonna be problems.
   We need to save it in localStorage." — Scott
```

---

## §7. Tự Code: Mutation Patterns from Scratch

```javascript
// ═══ MUTATION PATTERNS (vanilla — không Urql!) ═══

// 1. Basic mutation:
const CREATE_USER = `
  mutation CreateUser($input: AuthInput!) {
    createUser(input: $input) {
      token
      id
    }
  }
`;

// 2. Sending mutation with fetch:
async function executeMutation(mutation, variables) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify({
      query: mutation, // "query" field even for mutations!
      variables,
    }),
  });

  const result = await response.json();

  // Always 200! Check payload!
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// 3. Sign up flow:
async function handleSignUp(email, password) {
  const data = await executeMutation(CREATE_USER, {
    input: { email, password },
  });

  if (data.createUser) {
    // Save token in localStorage!
    localStorage.setItem("token", data.createUser.token);
    // Redirect to home!
    window.location.href = "/";
  }
}

// ═══ MULTIPLE MUTATIONS IN ONE REQUEST ═══

// You can batch mutations!
const BATCH = `
  mutation BatchOps($input1: AuthInput!, $input2: AuthInput!) {
    first: createUser(input: $input1) {
      token
    }
    second: createUser(input: $input2) {
      token
    }
  }
`;
// → "You can do more than one mutation
//    in one mutation. It gets crazy!" — Scott
// → Useful for batching, but not for sign up!

// ═══ SIGN IN MUTATION ═══

const SIGN_IN = `
  mutation SignIn($input: AuthInput!) {
    signin(input: $input) {
      token
    }
  }
`;
// → Same AuthInput (email + password!)
// → "Whatever you sign up with, you also
//    sign in with." — Scott

// ═══ MUTATION vs QUERY BEHAVIOR ═══

// Query: executes immediately on component render!
// Mutation: must be triggered by a function!
// "Queries happen as soon as component renders.
//  Mutations have to be triggered by some function." — Scott

console.log("═══ CREATING SIGN UP MUTATION ═══");
console.log("Mutation = WRITE (create, update, delete!)");
console.log("! = non-null = REQUIRED!");
console.log("$variables = function arguments (call anything!)");
console.log("Argument names MUST match schema!");
console.log("gql tag: string → GraphQL document (AST!)");
console.log("gql/ folder: 1 file per query/mutation!");
console.log("Must get token back → save in localStorage!");
```

---

## 📖 Deep Dive: Apollo Studio Workflow

Scott's workflow là pattern thực tế mà nhiều senior developers sử dụng:

1. **Explore** schema trong Apollo Studio (tại `/api/graphql`)
2. **Build** query/mutation bằng Explorer UI hoặc autocomplete
3. **Test** trực tiếp trong Studio (connect real database!)
4. **Copy** query đã test thành công vào `gql/` folder
5. **Import** và sử dụng trong React component

Đây là ưu điểm lớn của GraphQL so với REST: **introspection** cho phép tooling tự động biết API có gì, giúp developer explore và test nhanh hơn nhiều so với đọc docs hoặc dùng Postman thủ công.

---

## Checklist

```
[ ] Mutation = WRITE, Query = READ!
[ ] Apollo Studio tại /api/graphql → explore + test!
[ ] ! (exclamation mark) = non-null = required!
[ ] $variables = function arguments (name anything!)
[ ] Argument names MUST match schema definition!
[ ] gql template tag: string → GraphQL document!
[ ] gql/ folder: 1 file per query/mutation!
[ ] Named exports to avoid conflicts!
[ ] Token MUST be in response (save to localStorage!)
[ ] Sign in: same AuthInput as sign up!
[ ] Can batch multiple mutations in one request!
TIẾP THEO → Phần 10: Using Mutations in React!
```
