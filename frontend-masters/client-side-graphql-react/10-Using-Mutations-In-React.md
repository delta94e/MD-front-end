# Client-Side GraphQL with React, v2 — Phần 10: Using Mutations in React — "useMutation, Field Renaming, Batching!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: Using Mutations in React — "useMutation from Urql (NOT Apollo!). Returns [result, executeFn]. Mutations don't run on render, must be triggered. Check result.data.createUser (response path = mutation name in query). setToken → router.push('/'). Sign in = same pattern, different mutation name. Field renaming: 'jwt: token' → renames output. Batching: multiple mutations in one operation. Try to get GraphQL to do transforms for you — don't map/transform in code!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — useMutation hook, sign up/in flow, field renaming, batching!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | useMutation Hook — "[result, executeFn]!"         |
| 2   | Sign Up Flow — "Complete Implementation!"         |
| 3   | Sign In — "Same Pattern, Different Name!"         |
| 4   | Field Renaming — "jwt: token!"                    |
| 5   | Batching — "Multiple Mutations in One!"           |
| 6   | Response Path — "data.createUser vs data.signin!" |
| 7   | ⚠️ Import Gotcha — "Urql, NOT Apollo!"            |
| 8   | Tự Code: useMutation from Scratch                 |

---

## §1. useMutation Hook — "[result, executeFn]!"

> Scott: _"useMutation is not going to make a mutation immediately when component renders because you need variables. Mutations have to be triggered by some function."_

```
useMutation:
═══════════════════════════════════════════════════════════════

  const [signUpResult, signUp] = useMutation(SignupMutation);
  //     ↑ result          ↑ execute function
  //     (probably won't    (call this to trigger!)
  //      use directly)

  signUpResult = {
    data: null | object,    // response data
    error: null | object,   // error if any
    fetching: boolean,      // loading state
    stale: boolean          // cache stale?
  }

  signUp = async (variables) => {
    // Send mutation to GraphQL server!
  }

  vs useQuery:
  → useQuery: runs IMMEDIATELY on render!
  → useMutation: waits for YOU to call! ✅

  "Queries happen as soon as the component renders.
   Mutations have to be triggered." — Scott
```

---

## §2. Sign Up Flow — "Complete Implementation!"

```javascript
// ═══ SIGN UP PAGE IMPLEMENTATION ═══

// ⚠️ Import from @urql/next or urql — NOT Apollo!
// "Do not import from Apollo. It will break.
//  I got stuck on that for an hour." — Scott

// Imports:
// import { useMutation } from 'urql';
// import { SignupMutation } from '@/gql/signupMutation';
// import { setToken } from '@/lib/utils';

// In component:
function SignUpPage() {
  const [state, setState] = "..."; // form state (already done!)
  const router = "..."; // useRouter()

  // Step 1: Setup mutation hook!
  const [signUpResult, signUp] = useMutation(SignupMutation);

  // Step 2: Handle submit!
  async function handleSignUp(e) {
    e.preventDefault();

    // Step 3: Execute mutation with variables!
    const result = await signUp({
      input: state, // state = { email, password }!
    });
    // input must match $input in mutation!
    // state = { email, password } = AuthInput shape!

    // Step 4: Check response!
    if (result.data?.createUser) {
      // Step 5: Save token!
      setToken(result.data.createUser.token);
      // Step 6: Redirect!
      router.push("/");
    }
  }

  // result.data.createUser because mutation is:
  // mutation { createUser(input: $input) { token } }
  // → response path = mutation function name!
}

// "Everything else should be set up.
//  handleSignUp is already on form.submit." — Scott
```

```
RESPONSE PATH:
═══════════════════════════════════════════════════════════════

  Mutation:
  mutation { createUser(input: $input) { token, id } }

  Response:
  result.data.createUser.token  ← path follows mutation name!
  result.data.createUser.id

  If mutation was called "thing":
  mutation { thing(input: $input) { token } }
  → result.data.thing.token

  "I know it's .createUser because if I go look
   at SignupMutation, that's what it's called." — Scott
```

---

## §3. Sign In — "Same Pattern, Different Name!"

> Scott: _"Sign in should be pretty much the same thing. Same AuthInput — whatever you sign up with you also sign in with."_

```javascript
// ═══ SIGN IN (same pattern!) ═══

// Mutation:
const SigninMutation = `
  mutation SignIn($input: AuthInput!) {
    signin(input: $input) {
      token
    }
  }
`;

// In component:
function SignInPage() {
  const [signinResult, signin] = useMutation(SigninMutation);

  async function handleSignIn(e) {
    e.preventDefault();

    const result = await signin({
      input: state, // { email, password }
    });

    // result.data.SIGNIN (not createUser!)
    if (result.data?.signin) {
      setToken(result.data.signin.token);
      router.push("/");
    }
  }
}

// "Same AuthInput, just different mutation name.
//  Whatever you sign up with, you also sign in with.
//  I made them exactly the same." — Scott
```

```
TESTING IN STUDIO:
═══════════════════════════════════════════════════════════════

  1. Go to localhost:3000/api/graphql
  2. Test signin mutation:

  mutation SignIn($input: AuthInput!) {
    signin(input: $input) {
      token
      id
      email
    }
  }

  Variables:
  { "input": { "email": "admin2@gmail.com",
                "password": "password" } }

  → Run → get token, id, email!
  → "This is a great place to test things out
     just to make sure things work." — Scott
```

---

## §4. Field Renaming — "jwt: token!"

> Scott: _"If I didn't want this to be called 'token', I can rename it with a colon. Now in output it's 'jwt' not 'token'."_

```graphql
# Without renaming:
mutation { signin(input: $input) {
  token        → response: { token: "eyJ..." }
}}

# With renaming:
mutation { signin(input: $input) {
  jwt: token   → response: { jwt: "eyJ..." }
}}
```

```
FIELD RENAMING:
═══════════════════════════════════════════════════════════════

  Syntax: newName: originalField

  Examples:
  jwt: token          → token renamed to jwt!
  userName: name      → name renamed to userName!
  avatar: profilePic  → profilePic renamed to avatar!

  WHY RENAME?
  → Frontend wants different name than backend!
  → "This saves you from writing transformation code.
     If GraphQL can do it, do it in GraphQL.
     Don't map/transform in your code!" — Scott

  GOLDEN RULE:
  "Try to find a way to do transformations
   in GraphQL. When you get output, put it
   right on the screen. No manipulating." — Scott

  "If you're getting result from GraphQL
   just to map over it and pick properties
   and change names — you're not using
   GraphQL right!" — Scott
```

---

## §5. Batching — "Multiple Mutations in One!"

> Scott: _"You can do more than one mutation in one operation. It gets crazy — you can do a lot of stuff. It's like batching."_

```graphql
# Multiple mutations in one request:
mutation BatchOperations($input1: AuthInput!, $input2: AuthInput!) {
  first: signin(input: $input1) {
    token
  }
  second: signin(input: $input2) {
    token
  }
}

# Response:
# { data: { first: { token: "..." }, second: { token: "..." } } }
```

```
BATCHING:
═══════════════════════════════════════════════════════════════

  Use aliases (first:, second:) to avoid name conflicts!
  → "first" and "second" are custom aliases!
  → Both call signin but with different inputs!

  Better use case (queries!):
  query Dashboard($userId: ID!, $teamId: ID!) {
    user: getUser(id: $userId) {
      name
      email
    }
    team: getTeam(id: $teamId) {
      name
      members { name }
    }
  }
  → 1 request = user data + team data!
  → Instead of 2 separate fetches!

  "Not a good use case for signing in two people,
   but for queries it might make sense." — Scott
```

---

## §6. Response Path — "data.createUser vs data.signin!"

```
RESPONSE PATH RULES:
═══════════════════════════════════════════════════════════════

  Path follows MUTATION/QUERY name in operation!

  mutation { createUser(...) { token } }
  → result.data.createUser.token ✅

  mutation { signin(...) { token } }
  → result.data.signin.token ✅

  mutation { updateIssue(...) { id } }
  → result.data.updateIssue.id ✅

  With aliases:
  mutation { myAlias: signin(...) { token } }
  → result.data.myAlias.token ✅

  "data.data is pretty redundant" — Scott 😂
  (result.data from useMutation →
   then .data from GraphQL response)
```

---

## §7. ⚠️ Import Gotcha — "Urql, NOT Apollo!"

> Scott: _"Be sure you're importing from Urql. Apollo has a useMutation hook too. Do not import the one from Apollo, it does not work the same. I got stuck on that for an hour."_

```
⚠️ IMPORT WARNING:
═══════════════════════════════════════════════════════════════

  ✅ CORRECT:
  import { useMutation } from 'urql';

  ❌ WRONG:
  import { useMutation } from '@apollo/client';

  "It will break! They don't work the same!
   I got stuck on that for an hour!" — Scott 💀

  Same name, different library!
  → Urql: returns [result, executeFn]
  → Apollo: returns [executeFn, result]
  → Order is REVERSED! And APIs differ!
```

---

## §8. Tự Code: useMutation from Scratch

```javascript
// ═══ useMutation — TỰ VIẾT (không Urql!) ═══

// Hiểu cách useMutation hoạt động bên trong:

function useMutation(mutation) {
  const [result, setResult] = useState({
    data: null,
    error: null,
    fetching: false,
  });

  // Execute function (triggered manually!):
  const executeMutation = useCallback(
    async (variables) => {
      setResult((prev) => ({ ...prev, fetching: true }));

      try {
        const response = await fetch("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: JSON.stringify({
            query: mutation, // mutation string!
            variables, // passed from component!
          }),
        });

        const json = await response.json();
        // Always 200! Check payload!

        const newResult = {
          data: json.data || null,
          error: json.errors?.[0] || null,
          fetching: false,
        };

        setResult(newResult);
        return newResult; // Return for await!
      } catch (error) {
        const errorResult = {
          data: null,
          error: { message: error.message },
          fetching: false,
        };
        setResult(errorResult);
        return errorResult;
      }
    },
    [mutation],
  );

  return [result, executeMutation];
  // [result, executeFn] — Urql order!
}

// ═══ USAGE (same as Urql!) ═══

function SignUpPage() {
  const [state, setState] = useState({ email: "", password: "" });

  const [signUpResult, signUp] = useMutation(`
    mutation CreateUser($input: AuthInput!) {
      createUser(input: $input) {
        token
        id
      }
    }
  `);

  async function handleSignUp(e) {
    e.preventDefault();

    const result = await signUp({ input: state });

    if (result.data?.createUser) {
      localStorage.setItem("token", result.data.createUser.token);
      window.location.href = "/";
    }
  }

  return `
    <form onSubmit={handleSignUp}>
      <input value={state.email}
             onChange={e => setState({...state, email: e.target.value})} />
      <input type="password" value={state.password}
             onChange={e => setState({...state, password: e.target.value})} />
      <button disabled={signUpResult.fetching}>
        {signUpResult.fetching ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  `;
}

// ═══ FIELD RENAMING UTILITY ═══

// Instead of transforming in code:
// BAD:
const processedData = {
  jwt: data.token, // renaming in code!
  userName: data.name, // renaming in code!
};

// GOOD: Do it in GraphQL!
const QUERY_WITH_RENAMES = `
  query {
    user {
      jwt: token           // renamed in query!
      userName: name       // renamed in query!
    }
  }
`;
// → "Try to get GraphQL to do the thing you want
//    so you can put it on the screen." — Scott

// ═══ SERVER LOG REALITY ═══

// Terminal output:
// POST /api/graphql 200  ← success!
// POST /api/graphql 200  ← also success... or error!
// POST /api/graphql 200  ← who knows! 😂

// "Logs aren't useful. They all say 200.
//  You can forget about streaming logs
//  to a log provider." — Scott

console.log("═══ USING MUTATIONS IN REACT ═══");
console.log("useMutation: [result, executeFn]!");
console.log("Don't run on render — triggered manually!");
console.log("Response path = mutation name (data.createUser)!");
console.log("Field renaming: jwt: token → { jwt: 'eyJ...' }!");
console.log("Batching: multiple mutations in one request!");
console.log("⚠️ Import from urql, NOT apollo!");
console.log("'Do transforms in GraphQL, not code!' — Scott");
```

---

## 📖 Deep Dive: GraphQL Transforms vs Code Transforms

Scott đưa ra một best practice quan trọng: **Hãy để GraphQL làm transformations, không phải code frontend.**

### Anti-Pattern — Transform Trong Code

```javascript
// ❌ BAD: Transform sau khi nhận data
const data = await query(`{ user { name, profile_pic, auth_token } }`);
const processed = {
  userName: data.user.name, // rename!
  avatar: data.user.profile_pic, // rename!
  jwt: data.user.auth_token, // rename!
};
```

### Best Practice — Transform Trong GraphQL

```graphql
# ✅ GOOD: Transform ngay trong query!
query {
  user {
    userName: name
    avatar: profile_pic
    jwt: auth_token
  }
}
# → Data nhận được = PUT STRAIGHT ON SCREEN!
```

Tương tự như database queries: _"You wouldn't sort in code — you'd ask the database to sort."_ GraphQL cũng vậy — hãy sử dụng hết khả năng query language trước khi viết transformation code ở frontend.

---

## Checklist

```
[ ] useMutation: [result, executeFn] — Urql order!
[ ] Mutations don't run on render — must trigger!
[ ] Variables: { input: state } → matches $input!
[ ] Response path: result.data.MUTATION_NAME.field!
[ ] Sign up → save token → redirect!
[ ] Sign in → same pattern, different mutation name!
[ ] Field renaming: newName: originalField!
[ ] "Do transforms in GraphQL, not code!" — Scott
[ ] Batching: multiple mutations with aliases!
[ ] ⚠️ Import useMutation from urql, NOT apollo!
[ ] Server logs: all 200 — use payload to debug!
TIẾP THEO → Phần 11!
```
