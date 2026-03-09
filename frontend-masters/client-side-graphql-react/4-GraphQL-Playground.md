# Client-Side GraphQL with React, v2 — Phần 4: GraphQL Playground — "Apollo Studio & Star Wars API!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: GraphQL Playground in Apollo Studio — "Star Wars API demo. Apollo Studio = Postman for GraphQL. Type-checked autocomplete! Inference → discover all types. Named queries (like function names). Arguments with $ variables. Delete fields → response changes. Schema ≠ database (hide password, rename fields, talk to any source)."
> Độ khó: ⭐️⭐️ | Hands-on — first GraphQL queries!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Apollo Studio — "Postman for GraphQL!"             |
| 2   | Star Wars API — "Read-Only GraphQL!"               |
| 3   | allFilms Query — "Autocomplete + Type Safety!"     |
| 4   | Named Queries — "Like Function Names!"             |
| 5   | Arguments & Variables — "$filmId"                  |
| 6   | Dynamic Response — "Delete Fields = Change Shape!" |
| 7   | Q&A: Schema vs Database                            |
| 8   | Tự Code: GraphQL Operations Hands-On               |

---

## §1. Apollo Studio — "Postman for GraphQL!"

> Scott: _"This is basically Postman but for GraphQL. It's an HTTP client GUI for your GraphQL server. The community can build tools like this because your GraphQL API is type-checked."_

```
APOLLO STUDIO:
═══════════════════════════════════════════════════════════════

  Used to be called:
  → GraphiQL → GraphQL Playground → Apollo Studio
  → "They've remade this thing so many times.
     I can't keep up." — Scott

  What it does:
  → Runs inference on your GraphQL server
  → Discovers ALL possible types
  → Discovers ALL possible queries
  → Builds tooling around it (autocomplete!)
  → "Like Postman or Insomnia but for GraphQL!"

  WHY this is possible:
  → GraphQL API is type-checked!
  → Can introspect entire schema!
  → Build autocomplete, docs, explorer!
  → REST can't do this natively! ❌
```

```
2 WAYS TO INTERACT:
═══════════════════════════════════════════════════════════════

  1. Write queries from scratch:
     → Start typing → autocomplete! ✅
     → "Type safety all the way down.
        That's the sweet thing about GraphQL." — Scott

  2. Use Explorer panel:
     → Browse types visually
     → Click + button to add queries
     → Select fields by clicking
     → "If you don't know what this API is doing,
        explore it here." — Scott
```

---

## §2. Star Wars API — "Read-Only GraphQL!"

```
STAR WARS GRAPHQL API:
═══════════════════════════════════════════════════════════════

  URL: https://swapi-graphql.netlify.app/
  → Classic go-to GraphQL example!
  → All Star Wars movies + references
  → Read-only (can't write!)
  → Somebody maintains it

  Available queries (root type):
  ├── allFilms        → all Star Wars films
  ├── allPeople       → all characters
  ├── allPlanets      → all planets
  ├── film(id: ID)    → specific film
  ├── person(id: ID)  → specific person
  └── planet(id: ID)  → specific planet
```

---

## §3. allFilms Query — "Autocomplete + Type Safety!"

> Scott: _"Click + button on allFilms, it adds the code. Select fields: created, director, id, title, producers. Run it — get all 6 Star Wars films."_

```graphql
# Query built via Explorer:
query AllFilms {
  allFilms {
    films {
      id
      title
      director
      producers
      created
    }
  }
}
```

```
RESPONSE:
═══════════════════════════════════════════════════════════════

  {
    "data": {
      "allFilms": {
        "films": [
          {
            "id": "ZmlsbXM6MQ==",
            "title": "A New Hope",
            "director": "George Lucas",
            "producers": [
              "Gary Kurtz",
              "Rick McCallum"
            ],
            "created": "2014-12-10T14:23:31.880Z"
          },
          // ... 5 more films (6 total!)
        ]
      }
    }
  }

  producers: [String] ← array of strings!
  "I know it's a list because you can see
   it says array of string types." — Scott
```

---

## §4. Named Queries — "Like Function Names!"

> Scott: _"This part is naming your query. Like creating a function — you can give it whatever name, doesn't change how it works. The difference between anonymous function or named function."_

```graphql
# Named query:
query AllFilms {        ← "AllFilms" = just a name! Like function name!
  allFilms {            ← THIS is the actual query that runs!
    films { ... }
  }
}

# Anonymous query (also works!):
{
  allFilms {
    films { ... }
  }
}
```

```
NAMED vs ANONYMOUS:
═══════════════════════════════════════════════════════════════

  Named:
  query MyAwesomeQuery {  ← name (optional, for debugging!)
    allFilms { ... }      ← actual query
  }

  Anonymous:
  {
    allFilms { ... }      ← actual query
  }

  Both work the same!
  Name is for:
  → Debugging (easier to find in logs!)
  → Apollo DevTools (identifies queries!)
  → Code organization
  → "It has a different purpose but doesn't
     change the behavior." — Scott
```

---

## §5. Arguments & Variables — "$filmId"

> Scott: _"I'm creating an argument for a function. Calling it $filmId. Then passing that argument into the function called film, whose value is id."_

```graphql
# Query with variable:
query GetFilm($filmId: ID) {     ← declare variable!
  film(id: $filmId) {            ← pass variable to argument!
    id
    title
    director
    producers
  }
}

# Variables (JSON):
{
  "filmId": "ZmlsbXM6MQ=="       ← value for $filmId!
}
```

```
VARIABLE SYNTAX BREAKDOWN:
═══════════════════════════════════════════════════════════════

  query GetFilm($filmId: ID) {
  │     │        │       │
  │     │        │       └── Type: ID (from schema!)
  │     │        └── Variable name: $filmId
  │     └── Query name: GetFilm
  └── Operation type: query

  film(id: $filmId) {
  │    │   │
  │    │   └── Variable value: $filmId
  │    └── Argument name: id (defined by schema!)
  └── Query name: film (defined by schema!)

  Think of it as:
  function GetFilm(filmId) {
    return film({ id: filmId });
  }

  "The best way I can describe it:
   I'm creating an argument for a function." — Scott
```

```
$ SIGN = VARIABLE:
═══════════════════════════════════════════════════════════════

  $ = "this is a variable!"

  Declaration (top):    $filmId: ID
  Usage (inside query): $filmId

  Variable JSON must match name:
  { "filmId": "ZmlsbXM6MQ==" }
       ↑ same name (without $!)

  "filmId here is the same name as
   the variable up here, filmId." — Scott
```

---

## §6. Dynamic Response — "Delete Fields = Change Shape!"

> Scott: _"If I delete those two fields and run it, you can see it also deletes those fields. You only get what you ask for."_

```
DYNAMIC RESPONSE:
═══════════════════════════════════════════════════════════════

  Query 1 (4 fields):
  film(id: $id) { id, title, director, producers }
  → Response: { id, title, director, producers } ✅

  Query 2 (remove director + producers):
  film(id: $id) { id, title }
  → Response: { id, title } ✅
  → director and producers GONE!

  Client controls response shape!
  No over-fetching! ✅
  No under-fetching! ✅
```

---

## §7. Q&A: Schema vs Database

> Student: _"Is your data's type system same as database type system?"_
> Scott: _"That's up to you. For the most part, GraphQL schema heavily follows database schema, but you will have differences."_

```
SCHEMA vs DATABASE:
═══════════════════════════════════════════════════════════════

  Database table "users":
  ├── id: INTEGER          → ✅ expose
  ├── name: VARCHAR        → ✅ expose
  ├── email: VARCHAR       → ✅ expose
  ├── password_hash: TEXT  → ❌ HIDE! (don't expose!)
  ├── internal_notes: TEXT → ❌ HIDE!
  └── created_at: DATETIME → ✅ expose (as createdAt!)

  GraphQL schema:
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: DateTime!    ← renamed from snake_case!
  }
  → password_hash: hidden! ✅
  → internal_notes: hidden! ✅
  → created_at → createdAt: renamed! ✅

  "I might have password in schema, but that doesn't
   mean I want client to query for a password." — Scott

  GRAPHQL CAN TALK TO ANYTHING:
  → Database (most common!)
  → Another GraphQL server!
  → Stripe API!
  → Any REST API!
  → Third-party services!
  → "It's not always a database. So it's not
     always gonna be one for one." — Scott
```

---

## §8. Tự Code: GraphQL Operations Hands-On

```javascript
// ═══ GRAPHQL QUERY PATTERNS ═══

// 1. Simple query (no arguments):
const ALL_FILMS = `
  query AllFilms {
    allFilms {
      films {
        id
        title
        director
      }
    }
  }
`;

// 2. Query with variable:
const GET_FILM = `
  query GetFilm($filmId: ID!) {
    film(id: $filmId) {
      title
      director
      producers
      releaseDate
    }
  }
`;

// 3. Multiple queries in one request:
const FULL_DATA = `
  query FullData($filmId: ID!, $personId: ID!) {
    film(id: $filmId) {
      title
      director
    }
    person(id: $personId) {
      name
      birthYear
      homeworld {
        name
        climate
      }
    }
  }
`;
// → 1 request returns BOTH film AND person! ✅

// ═══ VANILLA GRAPHQL CLIENT ═══

class GraphQLClient {
  #url;
  #headers;

  constructor(url, headers = {}) {
    this.#url = url;
    this.#headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  async query(queryString, variables = {}) {
    const response = await fetch(this.#url, {
      method: "POST",
      headers: this.#headers,
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      // Type safety: query didn't match schema!
      const messages = result.errors.map((e) => e.message);
      throw new Error(`GraphQL Error: ${messages.join(", ")}`);
    }

    return result.data;
  }

  // Add auth token:
  setToken(token) {
    this.#headers["Authorization"] = `Bearer ${token}`;
  }
}

// Usage:
const client = new GraphQLClient("https://swapi-graphql.netlify.app/graphql");

// Get all films:
const filmsData = await client.query(ALL_FILMS);
console.log(filmsData.allFilms.films);

// Get specific film:
const filmData = await client.query(GET_FILM, {
  filmId: "ZmlsbXM6MQ==",
});
console.log(filmData.film.title); // "A New Hope"

// Get film + person in ONE request:
const fullData = await client.query(FULL_DATA, {
  filmId: "ZmlsbXM6MQ==",
  personId: "cGVvcGxlOjE=",
});
console.log(fullData.film.title); // "A New Hope"
console.log(fullData.person.name); // "Luke Skywalker"
// 1 request! Not 2! ✅

// ═══ EXPLORER PATTERN (like Apollo Studio!) ═══

// Introspection query — discover schema!
const INTROSPECT = `
  query IntrospectionQuery {
    __schema {
      queryType {
        fields {
          name
          description
          args {
            name
            type { name }
          }
        }
      }
    }
  }
`;
// → This is HOW Apollo Studio discovers your API!
// → Type safety enables tooling! ✅

console.log("═══ GRAPHQL PLAYGROUND ═══");
console.log("Apollo Studio = Postman for GraphQL!");
console.log("Autocomplete because API is type-checked!");
console.log("Named queries = like function names (for debugging)!");
console.log("$variables = function arguments!");
console.log("Delete fields → response shape changes!");
console.log("Schema can hide/rename/transform DB fields!");
console.log("GraphQL talks to anything: DB, APIs, Stripe!");
```

---

## 📖 Deep Dive: Introspection — Tại Sao GraphQL Tooling Mạnh Đến Vậy?

Một trong những điều magical nhất về GraphQL là **introspection** — khả năng tự mô tả. Bất kỳ GraphQL server nào cũng có thể trả lời câu hỏi: _"Bạn có những types nào? Queries nào? Mutations nào?"_

Đây là lý do Apollo Studio, GraphiQL, và tất cả GraphQL tools hoạt động ngay lập tức với bất kỳ GraphQL API nào:

1. **Tool kết nối đến server**
2. **Gửi introspection query** (`__schema`)
3. **Nhận toàn bộ schema** (types, fields, arguments)
4. **Build autocomplete, docs, validation** từ schema đó

REST không có tính năng tương tự natively. Swagger/OpenAPI cần developer viết spec riêng. GraphQL? Schema **IS** the spec. Always up to date, always accurate.

Scott nói: _"The community can create tools like this because your GraphQL API is type-checked. This tool can run an inference on your server to figure out all the possible types."_

---

## Checklist

```
[ ] Apollo Studio = Postman for GraphQL!
[ ] Autocomplete works because GraphQL is type-checked!
[ ] Introspection: discover ALL types/queries from any server!
[ ] Named queries: like function names (debugging!)!
[ ] $variables: like function arguments ($filmId: ID!)!
[ ] Variables JSON: same name without $ sign!
[ ] Delete fields → response removes those fields!
[ ] Schema ≠ database (hide password, rename fields!)!
[ ] GraphQL can talk to anything (DB, APIs, Stripe, etc.)!
[ ] Star Wars API: classic GraphQL demo! swapi-graphql!
TIẾP THEO → Phần 5!
```
