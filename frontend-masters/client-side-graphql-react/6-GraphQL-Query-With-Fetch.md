# Client-Side GraphQL with React, v2 — Phần 6: GraphQL Query with fetch — "Always POST, Always 200!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: GraphQL Query with fetch — "Everything is a POST. Query is literally a string. Stringify on body as field 'query'. You don't need anything special! But we won't use this — we'll use tooling. Everything is also 200 status code, even errors! Check data vs errors in payload, not status code. Chrome won't show red errors — debugging gotcha!"
> Độ khó: ⭐️⭐️⭐️ | Core — fetch, POST, 200 status, error handling!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | GraphQL with fetch — "Nothing Special!"            |
| 2   | Always POST — "No GET, No PUT, No DELETE!"         |
| 3   | Always 200 — "Even Errors!"                        |
| 4   | Error Handling — "Check Payload, Not Status Code!" |
| 5   | The Debugging Gotcha — "200 But Actually Error!"   |
| 6   | Tự Code: GraphQL Fetch Client from Scratch         |

---

## §1. GraphQL with fetch — "Nothing Special!"

> Scott: _"I'm using fetch to do a GraphQL query. My query is literally just a string. I'm just doing a POST request, stringifying that query on the body as the field called query. That's it. You don't need anything special."_

```javascript
// GraphQL with plain fetch — that's it!
const data = await fetch("http://localhost:3000/api/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: `{
      user {
        id
        email
        name
      }
    }`,
  }),
}).then((res) => res.json());

// "That's a GraphQL request. You don't need
//  anything special!" — Scott
```

```
ANATOMY OF GRAPHQL FETCH:
═══════════════════════════════════════════════════════════════

  fetch(URL, {
    method: 'POST',              ← Always POST!
    headers: {
      'Content-Type':            ← application/json!
        'application/json'
    },
    body: JSON.stringify({
      query: '...',              ← GraphQL query string!
      variables: {}              ← Optional variables!
    })
  })

  → URL: your GraphQL endpoint (/api/graphql)
  → Method: POST (always!)
  → Body: JSON with "query" field
  → "It's really not that special." — Scott
```

---

## §2. Always POST — "No GET, No PUT, No DELETE!"

```
ALWAYS POST:
═══════════════════════════════════════════════════════════════

  REST:
  GET    /api/users     → read
  POST   /api/users     → create
  PUT    /api/users/1   → update
  DELETE /api/users/1   → delete
  → Different HTTP verbs for different operations!

  GraphQL:
  POST   /api/graphql   → queries (read!)
  POST   /api/graphql   → mutations (write!)
  POST   /api/graphql   → subscriptions (real-time!)
  → "Everything's a POST. It always has been." — Scott

  Kể cả lấy data (query) cũng là POST!
  Kể cả xoá data (mutation) cũng là POST!
  LUÔN LUÔN POST! 🔒
```

---

## §3. Always 200 — "Even Errors!"

> Scott: _"Everything is also a 200 status code, even errors. GraphQL doesn't care about status codes."_

```
ALWAYS 200:
═══════════════════════════════════════════════════════════════

  REST errors:
  200 → OK ✅
  400 → Bad Request ❌
  401 → Unauthorized ❌
  404 → Not Found ❌
  500 → Server Error ❌

  GraphQL:
  200 → OK ✅
  200 → Error ❌ (nhưng vẫn 200!)
  200 → Not Found ❌ (nhưng vẫn 200!)
  200 → Unauthorized ❌ (nhưng vẫn 200!)
  → "Even if you threw an error, even if some
     error happened. Always 200." — Scott

  Tại sao?
  "Status codes are really for machines.
   If a browser sees a status code it shows
   a specific error. But if you're passing an error,
   you're probably gonna send some specific message
   with a code anyway." — Scott

  GraphQL takes this to another level:
  → Errors go in result.errors array!
  → Data goes in result.data object!
  → Both in same 200 response!
```

---

## §4. Error Handling — "Check Payload, Not Status Code!"

> Scott: _"All the logic you've ever written checking status codes over 300 is pointless now. You're gonna be checking the payload of the data."_

```
RESPONSE FORMAT:
═══════════════════════════════════════════════════════════════

  Success response (200!):
  {
    "data": {
      "user": {
        "id": "123",
        "name": "Scott"
      }
    }
  }

  Error response (also 200!):
  {
    "errors": [
      {
        "message": "User not found",
        "locations": [{ "line": 2, "column": 3 }],
        "path": ["user"]
      }
    ],
    "data": null
  }

  How to check:
  ├── result.data    → có data? SUCCESS! ✅
  ├── result.errors  → có errors? FAILED! ❌
  └── "You almost never get both" — Scott

  OLD WAY (REST):
  if (response.status >= 400) → error!

  NEW WAY (GraphQL):
  if (result.errors) → error!
  if (result.data)   → success!

  "All logic checking status codes over 300
   is pointless now." — Scott
```

---

## §5. The Debugging Gotcha — "200 But Actually Error!"

> Scott: _"You're debugging, it got a 200, everything looks good. Well, actually go look at the payload — it's a 200 but actually says errors inside."_

```
THE GOTCHA:
═══════════════════════════════════════════════════════════════

  Chrome DevTools Network tab:
  ┌──────────────────────────────────────────┐
  │  Name          Status  Type              │
  │  graphql       200     fetch   ← GREEN!  │
  │  graphql       200     fetch   ← GREEN!  │
  │  graphql       200     fetch   ← GREEN!  │
  └──────────────────────────────────────────┘
  → All green! Everything looks fine!
  → But one of them has errors[] inside! 💀

  "You're no longer gonna get a red error message
   in Chrome. When you actually get an error,
   it'll be like POST 200 everything's good." — Scott

  "I don't know why this isn't showing up on screen.
   It got a 200, everything looks good.
   Well, GO LOOK AT THE PAYLOAD —
   it says errors inside!" — Scott

  Server logs:
  POST /api/graphql 200
  POST /api/graphql 200
  POST /api/graphql 200
  → "Logs aren't useful for GraphQL because
     they're all gonna say 200." — Scott

  Solution:
  1. Use GraphQL-specific client (Urql, Apollo!)
     → They know to check errors in payload!
  2. Always check result.errors manually!
  3. Don't rely on Network tab colors!
```

---

## §6. Tự Code: GraphQL Fetch Client from Scratch

```javascript
// ═══ GRAPHQL FETCH — RAW (không thư viện!) ═══

// 1. Basic GraphQL fetch function:
async function graphqlFetch(url, query, variables = {}) {
  const response = await fetch(url, {
    method: "POST", // ALWAYS POST!
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query, // GraphQL query string!
      variables, // Optional variables!
    }),
  });

  // ⚠️ DON'T check response.ok!
  // GraphQL ALWAYS returns 200!
  // Even errors are 200!

  const result = await response.json();

  // Check payload, not status code!
  if (result.errors) {
    console.error("GraphQL Errors:", result.errors);
    throw new GraphQLError(result.errors);
  }

  return result.data;
}

// 2. Custom error class for GraphQL:
class GraphQLError extends Error {
  constructor(errors) {
    super(errors[0]?.message || "GraphQL Error");
    this.name = "GraphQLError";
    this.errors = errors;
    this.messages = errors.map((e) => e.message);
  }
}

// 3. Full client with auth support:
class SimpleGraphQLClient {
  #url;
  #token;

  constructor(url) {
    this.#url = url;
    this.#token = null;
  }

  setToken(token) {
    this.#token = token;
  }

  async request(query, variables = {}) {
    const headers = {
      "Content-Type": "application/json",
    };

    // Add auth token if exists:
    if (this.#token) {
      headers["Authorization"] = `Bearer ${this.#token}`;
    }

    const response = await fetch(this.#url, {
      method: "POST", // Always POST!
      headers,
      body: JSON.stringify({ query, variables }),
    });

    // Response is ALWAYS 200!
    const result = await response.json();

    // ⚠️ THE GOTCHA:
    // response.ok === true (it's 200!)
    // BUT result.errors might exist!
    // ALWAYS check result.errors!
    if (result.errors) {
      throw new GraphQLError(result.errors);
    }

    return result.data;
  }
}

// ═══ USAGE EXAMPLES ═══

const client = new SimpleGraphQLClient("http://localhost:3000/api/graphql");

// Query (read):
const users = await client.request(`
  query {
    users {
      id
      name
      email
    }
  }
`);
console.log(users); // { users: [{ id, name, email }] }

// Mutation (write):
const newUser = await client.request(
  `
  mutation CreateUser($input: AuthInput!) {
    createUser(input: $input) {
      token
      id
    }
  }
`,
  { input: { email: "test@test.com", password: "pass123" } },
);

// Set token for authenticated requests:
client.setToken(newUser.createUser.token);

// Now all requests include Authorization header!
const issues = await client.request(`
  query {
    issues {
      id
      title
      status
    }
  }
`);

// ═══ ERROR HANDLING PATTERNS ═══

// Pattern 1: try/catch
try {
  const data = await client.request(`{ invalidQuery { id } }`);
} catch (error) {
  if (error instanceof GraphQLError) {
    // GraphQL validation error (query doesn't match schema!)
    console.log("GraphQL error:", error.messages);
  } else {
    // Network error (server down, CORS, etc.)
    console.log("Network error:", error.message);
  }
}

// Pattern 2: Check result directly
async function safeRequest(query, vars) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: vars }),
  });
  const result = await response.json();

  return {
    data: result.data || null,
    errors: result.errors || null,
    hasError: !!result.errors,
  };
}

const result = await safeRequest(`{ users { name } }`);
if (result.hasError) {
  console.log("Errors:", result.errors);
} else {
  console.log("Data:", result.data);
}

console.log("═══ GRAPHQL WITH FETCH ═══");
console.log("Always POST, always 200!");
console.log("Query = string in body.query!");
console.log("Check result.data (success) vs result.errors (fail)!");
console.log("Don't trust Network tab colors — all 200 green!");
console.log("Don't trust server logs — all say 200!");
```

---

## 📖 Deep Dive: Tại Sao GraphQL Luôn Trả Về 200?

Đây là một trong những **paradigm shifts** lớn nhất khi chuyển từ REST sang GraphQL, và nó gây confused cho rất nhiều developers.

### HTTP Status Codes Là Cho "Transport Layer"

Trong REST, HTTP status codes (200, 404, 500...) được sử dụng cho **cả transport layer lẫn application layer**. Nghĩa là 404 vừa có nghĩa "URL không tồn tại" (transport) vừa có nghĩa "resource không tìm thấy" (application).

GraphQL tách biệt hai layer này:

- **Transport**: HTTP status code (luôn 200 — giao tiếp thành công!)
- **Application**: `errors` array trong response body (logic errors!)

### Hệ Quả Thực Tế

1. **Logging tools** (Datadog, Sentry) cần plugin GraphQL riêng — log HTTP sẽ toàn 200
2. **Chrome DevTools** không highlight lỗi bằng màu đỏ — phải check payload
3. **Load balancers** cần cấu hình đặc biệt — health check dựa trên response body
4. **Retry logic** thay đổi — không retry dựa trên status code nữa

Scott nói rất thực tế: _"You can forget about streaming logs to a log provider because it's gonna say 200."_ Đây là lý do tại sao **GraphQL-specific clients** (Urql, Apollo) quan trọng — chúng biết cách parse response và phân biệt success/error.

---

## Checklist

```
[ ] GraphQL with fetch: just POST + JSON.stringify({ query })!
[ ] No special library needed for basic requests!
[ ] ALWAYS POST — queries AND mutations!
[ ] ALWAYS 200 — even errors return 200!
[ ] Check result.data for success!
[ ] Check result.errors for errors!
[ ] ⚠️ Chrome Network tab: all green even with errors!
[ ] ⚠️ Server logs: all say "POST 200"!
[ ] Don't check response.ok — meaningless for GraphQL!
[ ] GraphQL clients (Urql, Apollo) handle this for you!
TIẾP THEO → Phần 7: Setup Urql Provider & Caching!
```
