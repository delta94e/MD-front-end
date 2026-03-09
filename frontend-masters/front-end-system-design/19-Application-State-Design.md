# Front-End System Design — Phần 19: Application State Design — "Normalize, Index, Shard!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Application State Design — "Data classes (config, UI state, server data) + data properties (access level, read/write frequency, size). Data normalization (1NF, 2NF, 3NF). Inverted index table for search. Composite key for prefix search. Shard data to IndexedDB. localStorage/sessionStorage = sync = block UI!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core — state architecture, database concepts on frontend!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Data Classes — "Config, UI State, Server Data!"       |
| 2   | Data Properties — "Access, Frequency, Size!"          |
| 3   | General Principles — "Access Cost → Search → Memory!" |
| 4   | Messenger App Example — "The Problem!"                |
| 5   | Data Normalization — "1NF, 2NF, 3NF!"                 |
| 6   | Normalizing Messenger State                           |
| 7   | Inverted Index Table — "Search Optimization!"         |
| 8   | Composite Key — "Prefix Search!"                      |
| 9   | Data Sharding — "Offload to Hard Drive!"              |
| 10  | Storage API Comparison                                |
| 11  | Tự Code: State Design Patterns                        |

---

## §1. Data Classes — "Config, UI State, Server Data!"

> Evgenii: _"Data on the UI has two things: data class (type of data) and data properties."_

```
DATA CLASSES:
═══════════════════════════════════════════════════════════════

  1. App Configuration:
     → User theme (dark/light)
     → Locale (en, vi, ja)
     → Font size
     → Accessibility settings

  2. UI Elements State:
     → Google Docs: selected formatting (bold, italic)
     → Form inputs, toggles, modals
     → Component-specific state

  3. Server Data:
     → Data fetched from API
     → Used to render UI elements
     → Contacts, messages, products, etc.
```

---

## §2. Data Properties — "Access, Frequency, Size!"

> Evgenii: _"High frequency read/write → can't use synchronous storages. Larger data → high chance to block UI thread."_

```
DATA PROPERTIES:
═══════════════════════════════════════════════════════════════

  1. Access Level:
     → Global (entire app) or Local (single component)

  2. Read/Write Frequency:
     → High frequency → MUST use async storage or runtime memory!
     → Synchronous storage = BLOCK UI thread! 💀

  3. Size:
     → Large data (500MB file) → lots of CPU to parse!
     → Small data → OK for localStorage

  ┌─────────────────────────────────────────────────┐
  │  High frequency + Large size = Runtime memory!  │
  │  Low frequency + Small size = localStorage OK!  │
  │  Large + Infrequent = IndexedDB (async)!       │
  └─────────────────────────────────────────────────┘
```

---

## §3. General Principles — "Access Cost → Search → Memory!"

> Evgenii: _"Three principles: minimize access cost (constant time), optimize search, optimize memory usage."_

```
3 PRINCIPLES:
═══════════════════════════════════════════════════════════════

  Priority 1: MINIMIZE ACCESS COST
  → Data accessible in O(1) constant time!
  → Use Map/Object with ID as key!

  Priority 2: OPTIMIZE SEARCH
  → Build indexes for search operations!
  → Inverted index, composite keys!

  Priority 3: OPTIMIZE MEMORY
  → Don't bloat RAM with unnecessary objects!
  → Offload inactive data to storage!
  → "The more things we store, the more likely
     we bloat our RAM." — Evgenii
```

---

## §4. Messenger App Example — "The Problem!"

> Evgenii: _"Messenger app: contact list, each contact has conversation with thousands of messages. How would you optimize?"_

```
THE PROBLEM:
═══════════════════════════════════════════════════════════════

  ❌ Naive approach (put everything in global state):

  state = {
    contacts: [
      {
        id: 'jane',
        name: 'Jane Smith',
        conversation: {
          id: 'conv1',
          messages: [
            { id: 1, text: 'Hey' },
            { id: 2, text: 'How are you?' },
            ... // THOUSANDS of messages!
          ]
        }
      },
      ... // More contacts
    ]
  }

  To find message id=5 from Jane:
  1. Filter contacts array → find Jane → O(n)
  2. Filter messages array → find id=5 → O(n)

  TWO LOOPS for a single message! 💀
  Thousands of messages = traverse entire array!
  "Not the way we want to design our app." — Evgenii
```

---

## §5. Data Normalization — "1NF, 2NF, 3NF!"

> Evgenii: _"Data normalization: concept used in databases for 20-30 years. Goals: optimized access performance, optimized structure, unified storage = readability + maintenance."_

### 5a. First Normal Form (1NF): Atomic Fields

> Evgenii: _"Every field should be atomic. Reduce nesting. Flatten nested objects."_

```javascript
// ❌ Non-normalized (nested objects):
const user = {
  id: "u1",
  name: "John",
  job: { id: "j1", title: "UIE" }, // Nested!
  location: { code: "US", name: "USA" }, // Nested!
};

// ✅ 1NF (flattened, atomic fields):
const user = {
  id: "u1", // Primary key!
  name: "John",
  job_id: "j1", // Atomic!
  job_title: "UIE", // Atomic!
  country_code: "US",
  country_name: "USA",
};
```

```
1NF RULES:
═══════════════════════════════════════════════════════════════

  ✅ Every field is atomic (no nested objects!)
  ✅ Has a primary key (id)
  ✅ Flat structure

  { job: { id, title } }  →  { job_id, job_title }
  Nested object!         →  Flat fields!
```

### 5b. Second Normal Form (2NF): Fields Depend on Entity

> Evgenii: _"All fields should depend on the entity. job_title depends on job_id, not on user. Decouple to separate table."_

```javascript
// ✅ 2NF (separate tables/objects):

// Users table
const users = {
  u1: { id: "u1", name: "John", job_id: "j1" },
};

// Jobs table (decoupled!)
const jobs = {
  j1: { id: "j1", title: "UIE" },
};

// Countries table (decoupled!)
const countries = {
  US: { code: "US", name: "USA" },
};

// User-Jobs relation
const userJobs = {
  u1: "j1", // User → Job mapping
};
```

```
2NF RULES:
═══════════════════════════════════════════════════════════════

  ✅ All fields depend on their entity's primary key
  ✅ No transitive dependencies
  ✅ Separate tables for separate entities

  Before: user.job_title depends on job_id, not user.id!
  After:  job_title lives in jobs table, depends on job.id! ✅
```

### 5c. Third Normal Form (3NF): Only Primary Key Dependency

> Evgenii: _"Non-primary keys should depend ONLY on primary key. Department might not directly relate to title. Sometimes excessive for UI — usually 2NF is enough."_

```javascript
// ✅ 3NF (strict primary key dependency):

const jobs = {
  j1: { id: "j1", title: "UIE" }, // No department here!
};

// Department separated further!
const departments = {
  j1: { job_id: "j1", department: "Engineering" },
};

// "3NF sometimes excessive. Usually on UI, we use 2NF." — Evgenii
```

```
NORMAL FORMS SUMMARY:
═══════════════════════════════════════════════════════════════

  Unnormalized → 1NF → 2NF → 3NF → ... → 7NF

  1NF: Flatten nested objects, add primary key
  2NF: Separate entities into own tables
  3NF: Strict primary-key-only dependencies

  UI apps: usually 2NF is sufficient!
  "The farther you go, the more normalized." — Evgenii
```

---

## §6. Normalizing Messenger State

> Evgenii: _"Remove conversation and messages nesting. Store conversation_id instead of object. Create separate tables."_

```javascript
// ❌ Before (non-normalized):
state = {
  contacts: [
    {
      id: 'jane', name: 'Jane Smith',
      conversation: {
        id: 'conv1', title: 'Chat with Jane',
        messages: [{ id: 1, text: 'Hey' }, ...]
      }
    }
  ]
};

// ✅ After (2NF — normalized!):
state = {
  contacts: {
    'jane': { id: 'jane', name: 'Jane Smith', conversation_id: 'conv1' }
  },
  conversations: {
    'conv1': { id: 'conv1', title: 'Chat with Jane' }
  },
  messages: {
    1: { id: 1, text: 'Hey', conversation_id: 'conv1' },
    2: { id: 2, text: 'How are you?', conversation_id: 'conv1' },
    5: { id: 5, text: 'See you!', conversation_id: 'conv1' }
  }
};

// Access message id=5:
state.messages[5]  // O(1)! ✅ (was O(n) × O(n)!)

// Access contact:
state.contacts['jane']  // O(1)! ✅
```

```
BEFORE vs AFTER:
═══════════════════════════════════════════════════════════════

  Before: Find message 5 from Jane
  1. contacts.filter(c => c.id === 'jane')  → O(n)
  2. jane.conversation.messages.filter(m => m.id === 5) → O(n)
  Total: O(n²) 💀

  After: Find message 5
  state.messages[5]  → O(1)! ✅

  "To access message with certain id,
   we just provide an id." — Evgenii
```

---

## §7. Inverted Index Table — "Search Optimization!"

> Evgenii: _"Build inverted index table. Called 'inverted' because content of entity becomes the key. Extract words from message content, store message id and timestamp."_

```javascript
// Messages:
// id:1 → "Hey Jane, how are you?"
// id:2 → "Jane is amazing"

// Inverted Index Table:
const invertedIndex = {
  hey: [{ messageId: 1, timestamp: 1001 }],
  jane: [
    { messageId: 1, timestamp: 1001 },
    { messageId: 2, timestamp: 1002 },
  ],
  how: [{ messageId: 1, timestamp: 1001 }],
  are: [{ messageId: 1, timestamp: 1001 }],
  you: [{ messageId: 1, timestamp: 1001 }],
  is: [{ messageId: 2, timestamp: 1002 }],
  amazing: [{ messageId: 2, timestamp: 1002 }],
};

// Search "jane" → returns message 1 AND 2! O(1)! ✅
invertedIndex["jane"];
// → [{ messageId: 1, ... }, { messageId: 2, ... }]
```

```
INVERTED INDEX:
═══════════════════════════════════════════════════════════════

  Normal index:    messageId → content
  Inverted index:  word → [messageIds]

  "Called inverted because content of entity
   becomes the key." — Evgenii

  Build asynchronously:
  → Web Worker (background thread!)
  → Idle callback (requestIdleCallback)
  → Store in IndexedDB
```

---

## §8. Composite Key — "Prefix Search!"

> Evgenii: _"What if you want to search by prefix? Use composite key — store all possible prefixes and keep message id + timestamp."_

```javascript
// Composite key inverted index (prefix search!):
const prefixIndex = {
  j: [
    { messageId: 1, ts: 1001 },
    { messageId: 2, ts: 1002 },
  ],
  ja: [
    { messageId: 1, ts: 1001 },
    { messageId: 2, ts: 1002 },
  ],
  jan: [
    { messageId: 1, ts: 1001 },
    { messageId: 2, ts: 1002 },
  ],
  jane: [
    { messageId: 1, ts: 1001 },
    { messageId: 2, ts: 1002 },
  ],
  h: [{ messageId: 1, ts: 1001 }],
  he: [{ messageId: 1, ts: 1001 }],
  hey: [{ messageId: 1, ts: 1001 }],
  a: [{ messageId: 2, ts: 1002 }],
  am: [{ messageId: 2, ts: 1002 }],
  ama: [{ messageId: 2, ts: 1002 }],
  amaz: [{ messageId: 2, ts: 1002 }],
  amazi: [{ messageId: 2, ts: 1002 }],
  amazin: [{ messageId: 2, ts: 1002 }],
  amazing: [{ messageId: 2, ts: 1002 }],
};

// User types "ja" in search bar:
prefixIndex["ja"];
// → messages 1 and 2! Instant prefix search! ✅
```

```
PREFIX SEARCH:
═══════════════════════════════════════════════════════════════

  Word "jane" generates prefixes:
  "j" → "ja" → "jan" → "jane"

  Each prefix maps to messageIds!

  ⚠️ Trade-off: table may become LARGE!
  → 1000 messages × many words × all prefixes = lots of keys!
  → Solution: Data Sharding (§9)!

  "Key should always be a string.
   Store string as array." — Evgenii
```

---

## §9. Data Sharding — "Offload to Hard Drive!"

> Evgenii: _"Inverted index table may become large. We can select inactive conversations and move to separate storage — basically sharded data. Database concept in the browser!"_

```
DATA SHARDING:
═══════════════════════════════════════════════════════════════

  Active conversation: John (in runtime memory!)
  Inactive: Jane, Bob (offload to IndexedDB!)

  ┌─── Runtime Memory (Global State) ──────────┐
  │  contacts: { john: {...} }                   │
  │  messages: { 1: {...}, 2: {...} } ← John's  │
  │  invertedIndex: { 'hey': [...] } ← John's   │
  └──────────────────────────────────────────────┘
                    ↕ swap back and forth!
  ┌─── IndexedDB (Hard Drive) ─────────────────┐
  │  Jane's messages + index                     │
  │  Bob's messages + index                      │
  │  (garbage collected from RAM!) ✅            │
  └──────────────────────────────────────────────┘

  "When we move to hard drive, we let JS engine
   garbage collect and free up space." — Evgenii

  Switch conversation from John → Jane:
  1. Move John's data → IndexedDB
  2. Load Jane's data ← IndexedDB → runtime memory
  3. RAM stays small! ✅
```

---

## §10. Storage API Comparison

> Evgenii: _"localStorage/sessionStorage: string only, synchronous = block UI. IndexedDB: almost unlimited (3GB), supports indexing, async = non-blocking!"_

```
STORAGE COMPARISON:
═══════════════════════════════════════════════════════════════

  | Feature           | sessionStorage | localStorage | IndexedDB |
  |-------------------|---------------|--------------|-----------|
  | Persistence       | Session only  | Persistent   | Persistent|
  | Size limit        | ~5MB          | ~5-10MB      | ~3GB!     |
  | Data type         | String only   | String only  | Multiple! |
  | Blocking?         | Sync (blocks!)| Sync (blocks!)| Async! ✅ |
  | Indexing?         | ❌            | ❌           | ✅ Built-in|
  | Use case          | Temp session  | Preferences  | Large data|

  ⚠️ localStorage + sessionStorage = SYNCHRONOUS!
  → High frequency read/write = BLOCK UI thread! 💀

  ✅ IndexedDB = ASYNCHRONOUS!
  → Won't block UI! Perfect for large datasets!
  → Supports composite index for prefix search!
```

---

## §11. Tự Code: State Design Patterns

```javascript
// ═══ NORMALIZED STATE MANAGER ═══

class NormalizedState {
  #tables = new Map();

  createTable(name) {
    this.#tables.set(name, new Map());
    return this;
  }

  insert(table, id, data) {
    this.#tables.get(table).set(id, { id, ...data });
  }

  get(table, id) {
    return this.#tables.get(table).get(id); // O(1)!
  }

  getAll(table) {
    return [...this.#tables.get(table).values()];
  }
}

// ═══ INVERTED INDEX BUILDER ═══

class InvertedIndex {
  #index = new Map();

  addDocument(id, content, timestamp = Date.now()) {
    const words = content.toLowerCase().split(/\s+/);

    for (const word of words) {
      // Full word index
      this.#addEntry(word, id, timestamp);

      // Prefix index (composite key!)
      for (let i = 1; i <= word.length; i++) {
        this.#addEntry(word.slice(0, i), id, timestamp);
      }
    }
  }

  #addEntry(key, id, timestamp) {
    if (!this.#index.has(key)) {
      this.#index.set(key, []);
    }
    const entries = this.#index.get(key);
    // Avoid duplicates
    if (!entries.find((e) => e.id === id)) {
      entries.push({ id, timestamp });
    }
  }

  search(prefix) {
    const key = prefix.toLowerCase();
    return this.#index.get(key) || [];
  }
}

// ═══ DATA SHARDER (Runtime ↔ IndexedDB) ═══

class DataSharder {
  #dbName;
  #db;

  constructor(dbName = "app-shard") {
    this.#dbName = dbName;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("shards")) {
          db.createObjectStore("shards", { keyPath: "id" });
        }
      };
      request.onsuccess = (e) => {
        this.#db = e.target.result;
        resolve(this);
      };
      request.onerror = reject;
    });
  }

  async offload(key, data) {
    // Move from runtime memory → IndexedDB
    const tx = this.#db.transaction("shards", "readwrite");
    tx.objectStore("shards").put({ id: key, data });
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    // After offload: delete from runtime state!
    // Let garbage collector free memory! ✅
  }

  async load(key) {
    // Load from IndexedDB → runtime memory
    const tx = this.#db.transaction("shards", "readonly");
    const request = tx.objectStore("shards").get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = reject;
    });
  }
}

// ═══ USAGE ═══
const state = new NormalizedState();
state
  .createTable("contacts")
  .createTable("conversations")
  .createTable("messages");

state.insert("contacts", "jane", { name: "Jane", conversation_id: "c1" });
state.insert("messages", 1, { text: "Hey", conversation_id: "c1" });

state.get("messages", 1); // O(1)! ✅

const index = new InvertedIndex();
index.addDocument(1, "Hey Jane how are you");
index.search("ja"); // → [{ id: 1, timestamp: ... }] O(1)! ✅

console.log("═══ STATE DESIGN ═══");
console.log("1. Normalize: 1NF → 2NF → flat entities, O(1) access!");
console.log("2. Index: inverted index + composite key for search!");
console.log("3. Shard: offload inactive data to IndexedDB!");
console.log("4. Storage: IndexedDB = async, localStorage = sync (blocks!)");
```

---

## Checklist

```
[ ] Data classes: config, UI state, server data!
[ ] Data properties: access level, frequency, size!
[ ] Principle 1: minimize access cost → O(1)!
[ ] Principle 2: optimize search → inverted index!
[ ] Principle 3: optimize memory → shard to storage!
[ ] 1NF: flatten nested objects, add primary key!
[ ] 2NF: separate entities into own tables!
[ ] 3NF: strict primary-key-only dependency (usually excessive)!
[ ] Normalized state: Map with ID as key → O(1) access!
[ ] Inverted index: word → [messageIds] for search!
[ ] Composite key: all prefixes for autocomplete search!
[ ] Data sharding: active → RAM, inactive → IndexedDB!
[ ] sessionStorage: session only, string, sync!
[ ] localStorage: persistent, string, sync (blocks UI!)!
[ ] IndexedDB: 3GB, multiple types, async (non-blocking!) ✅!
TIẾP THEO → Phần 20!
```
