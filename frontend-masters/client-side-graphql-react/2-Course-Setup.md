# Client-Side GraphQL with React, v2 — Phần 2: Course Setup — "Turso DB, .env, db:push!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — Scott Moss (10+ năm SWE, ex-Netflix)
> Bài: Course Setup — "Git fork + clone → Node v20 → npm install → Turso DB (SQLite for production!) → CLI or Dashboard → .env (TURSO_AUTH_TOKEN + URL) → npm run db:push (Drizzle ORM). Never touch database again!"
> Độ khó: ⭐️ | Setup — environment configuration!

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Prerequisites — "Git, Node v20, NPM!"   |
| 2   | Turso DB — "SQLite for Production!"     |
| 3   | Setup Steps — CLI or Dashboard          |
| 4   | Environment Variables — ".env File!"    |
| 5   | Database Migration — "npm run db:push!" |
| 6   | Deep Dive: Turso & SQLite               |

---

## §1. Prerequisites — "Git, Node v20, NPM!"

> Scott: _"I promise it's not crazy, you probably already have all of this. Node v20 at least. I'm using NPM — there's a package lock in there."_

```
PREREQUISITES:
═══════════════════════════════════════════════════════════════

  1. Git
     → Fork repo → clone locally
     → "I highly recommend forking it
        and then pulling it down" — Scott

  2. Node.js v20+
     → "Might work with v18, haven't tested"
     → "Works on my machine! [LAUGH]" — Scott

  3. NPM (not Yarn, not Bun!)
     → npm install (uses package-lock.json!)
     → "If you use other package managers,
        you might not get same versions" — Scott

  4. Turso DB (new thing!)
     → Free account
     → CLI or Dashboard
```

---

## §2. Turso DB — "SQLite for Production!"

> Scott: _"Turso is SQLite for production. It's a fork of SQLite called libSQL. It's hosted, you don't have to download anything other than a CLI. You can make an account for free."_

```
TURSO DB:
═══════════════════════════════════════════════════════════════

  What: SQLite for production!
  How:  Hosted database (cloud!)
  Base: libSQL (fork of SQLite)
  Cost: FREE tier!

  SQLite = "SQL but light" [LAUGH] — Scott
  → File-based, portable, works on edge!
  → "Genius being able to use SQLite
     in production" — Scott

  Turso = hosted SQLite
  → No download needed!
  → Works as long as connected to Internet!
  → Optional: run locally with local SQLite

  ┌──── Your Machine ────────────────────┐
  │  Next.js App → Drizzle ORM → Turso  │
  │                                       │
  │  .env:                                │
  │  TURSO_AUTH_TOKEN=eyJhbG...           │
  │  TURSO_CONNECTION_URL=libsql://...    │
  └───────────────────────────────────────┘
           │
           ▼ (Internet)
  ┌──── Turso Cloud ─────────────────────┐
  │  Database: "parallel"                │
  │  SQLite (libSQL) engine              │
  │  Always available! ✅                │
  └───────────────────────────────────────┘
```

---

## §3. Setup Steps — CLI or Dashboard

> Scott: _"Some people had trouble installing CLI. No worries — you can get everything from the Dashboard instead."_

```
METHOD 1: TURSO CLI:
═══════════════════════════════════════════════════════════════

  Step 1: Install CLI
  → Mac:    brew install tursodatabase/tap/turso
  → Linux:  curl -sSfL https://get.tur.so/install.sh | bash
  → Windows: check Turso docs

  Step 2: Login
  → turso auth login
  → Opens browser → login to Turso account

  Step 3: Create token
  → turso db tokens create parallel
  → Returns JWT token (don't clear console!)

  Step 4: Get database URL
  → turso db list
  → URL format: libsql://parallel-username.turso.io

METHOD 2: TURSO DASHBOARD (no CLI needed!):
═══════════════════════════════════════════════════════════════

  Step 1: Go to Turso Dashboard
  Step 2: Click on your database
  Step 3: Copy URL (shown on page!)
  Step 4: Click "Generate Token" button
  Step 5: Copy token

  "You don't need the CLI. You can grab them
   from the dashboard and put in .env file." — Scott
```

---

## §4. Environment Variables — ".env File!"

```
.ENV FILE:
═══════════════════════════════════════════════════════════════

  Create .env file in project root:

  TURSO_AUTH_TOKEN=eyJhbGciOiJFZER... (JWT from Turso!)
  TURSO_CONNECTION_URL=libsql://parallel-yourname.turso.io

  ⚠️ IMPORTANT:
  → Set BEFORE running db:push!
  → db:push relies on these variables!
  → npm install BEFORE db:push!
```

---

## §5. Database Migration — "npm run db:push!"

> Scott: _"There's a command in package.json called db:push. It pushes the schema I created to your database. Once you do that, you're good to go. Never gotta touch database for rest of course."_

```
DATABASE SETUP:
═══════════════════════════════════════════════════════════════

  Prerequisites:
  ✅ npm install (done!)
  ✅ .env file with TURSO_AUTH_TOKEN + URL (done!)

  Run:
  npm run db:push

  What it does:
  → Uses Drizzle ORM (not Turso CLI!)
  → Pushes schema to your Turso database
  → Creates all tables needed for Parallel app
  → "Never gotta touch database again!" — Scott

  COMPLETE SETUP FLOW:
  1. git fork + clone repo
  2. npm install
  3. Create Turso account + database
  4. Get token + URL (CLI or Dashboard)
  5. Create .env file with credentials
  6. npm run db:push
  7. Done! Never touch DB again! ✅
```

---

## §6. Deep Dive: Turso & SQLite

### Tại Sao SQLite Cho Production?

Truyền thống, SQLite được coi là "database cho development" hoặc "embedded database" — chạy local, file-based, không cần server. Nhưng Turso đã thay đổi game:

**SQLite + Cloud = Turso**: Bằng cách fork SQLite thành **libSQL**, Turso mang SQLite lên cloud với các tính năng production-grade:

- **Replication**: data được replicate globally (edge!)
- **Always available**: không cần tự manage database server
- **Portable**: cùng SQLite API quen thuộc
- **Free tier**: hoàn hảo cho learning và side projects

### Drizzle ORM

Scott chọn Drizzle làm ORM (Object-Relational Mapping) cho khoá này. `npm run db:push` sử dụng Drizzle để đẩy schema lên Turso — **không liên quan gì đến Turso CLI**. Đây là TypeScript-first ORM, tương tự Prisma nhưng nhẹ hơn.

### Local Alternative

Scott có đề cập option chạy local SQLite nhưng opt out:

> _"There is an option to do local SQLite, but I opted out. It was just an extra step."_

Nếu bạn muốn chạy offline, bạn có thể cấu hình Drizzle với SQLite file local thay vì Turso URL.

---

## Checklist

```
[ ] Git: fork + clone repo!
[ ] Node.js v20+ (v18 might work but untested)!
[ ] npm install (NPM, not Yarn/Bun!)!
[ ] Turso: create free account + database!
[ ] Get token: CLI (turso db tokens create) or Dashboard!
[ ] Get URL: libsql://dbname-username.turso.io!
[ ] .env: TURSO_AUTH_TOKEN + TURSO_CONNECTION_URL!
[ ] npm run db:push (Drizzle pushes schema!)!
[ ] Done! Never touch database again!
TIẾP THEO → Phần 3: What is GraphQL!
```
