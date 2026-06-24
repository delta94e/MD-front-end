# ⚔️ Interview Guide — Lead Developer, Riot Games Esports
## Next.js Operator Tools · Global Power Rankings · Graph Tournament Editor · 0 Major Incidents

> **Role summary:** Lead developer on Next.js app for Riot Esport operators (game day automation, disaster recovery, data mapping). Lead developer on Global Power Rankings (lolesports.com/gpr). Reduced major incidents to 0 in 2024 (~50% down from 2023). Built graph-based tournament editor. Migrated critical path tooling to React, TypeScript, React Testing Library.

---

## 🧭 The Three Threads (everything connects to these)

| Thread | One-liner |
|---|---|
| **Automation with safety** | *"We make it hard to do the wrong thing and easy to do the right thing"* |
| **Lead at scale = systems thinking** | *"I don't just build features. I build systems that reduce error surface."* |
| **0 incidents is a design outcome** | *"Zero incidents in 2024 wasn't luck. It was the result of specific engineering decisions in 2023."* |

---

## 🎮 Part 1 — Game Day Operator Tooling (Next.js)

### What "game day" means

A League of Legends esports broadcast day:
- 4–10 matches live on stream
- Millions of viewers watching
- Operators must: create lobbies → load teams → start game → record result → advance bracket
- Each step: previously **manual**. Human error = broadcast incident.

### The automation architecture

**Match state machine:**
```
SCHEDULED → IN_LOBBY → CHAMPION_SELECT → IN_GAME → COMPLETED → BRACKET_ADVANCED
```

Each transition: triggered by operator approval OR auto-triggered from Riot's game client signals.

**Why Next.js Server Actions for operator tooling?**

> *"We need server-side validation on every state transition. We need the UI to update when match state changes. We need a simple stack that a small team can maintain. Next.js Server Actions: form submissions that call server-side logic directly — no separate API layer, no client-server serialization layer. For an internal tool used by 50 operators: this simplicity is a feature."*

```typescript
// Operator clicks "Advance Team" → Server Action validates before executing
"use server"
async function advanceMatchStatus(matchId: string, to: MatchStatus) {
  // 1. Validate: is this transition legal?
  const current = await getMatch(matchId);
  if (!VALID_TRANSITIONS[current.status].includes(to)) {
    throw new Error(`Invalid: ${current.status} → ${to}`);
  }
  // 2. Pre-flight checks (teams enrolled? scores verified?)
  // 3. Execute (call Riot internal game API)
  // 4. Write immutable audit record
  // 5. revalidatePath("/ops/game-day")
}
```

### Disaster Recovery

**The failure scenario (what happened in 2023):**
> *"Score Sync went down. Operator had no fallback. Match result couldn't be recorded. Broadcast stalled. That was a major incident."*

**DR architecture (3 modes):**

| Mode | When | Operator experience |
|---|---|---|
| `FULL_AUTO` | All systems healthy | Automation handles everything |
| `DEGRADED_AUTO` | Non-critical system down | Automation continues with limitations. Banner shows degraded system. |
| `MANUAL` | Critical system down | All automation paused. All actions require explicit confirmation. Manual entry form always available. |

**The key insight:**
> *"The DR runbook is built into the UI. Not in Confluence. Not in Slack. In the UI that the operator has open right now. During a live incident: nobody opens Confluence. The runbook must be one click away."*

**Health monitoring:**
```typescript
const { data: health } = useSWR('/api/health', fetcher, { refreshInterval: 5000 });
// Every 5 seconds: check all critical systems.
// Degraded status shown 2 minutes before it affects operator workflow.
// "Operators should never be surprised by an outage."
```

### Data Mapping Automation

**The problem:**
- LCK sends team IDs like `T1_MAIN`
- LPL sends team IDs like `T1-LPL-PRIMARY`  
- Both mean T1. Canonical ID: `RIOT_TEAM_T1`
- Before automation: operators manually mapped data 2–3 hours per week

**The pipeline:**
```
Raw data → Zod schema validation → Canonical mapping → Conflict detection → Operator review (ambiguous only) → Published
```

**Result:**
> *"500+ known team aliases pre-mapped automatically. Unknown IDs surfaced to operator for one-time resolution. New mapping saved permanently. Operators went from 2-3 hours/week of data mapping to reviewing 5-10 ambiguous cases per week. Zero 'unknown team ID' incidents in 2024."*

---

## 🏆 Part 2 — Global Power Rankings (lolesports.com/gpr)

### What GPR is

A ranking system for all professional LoL teams globally. 12 regional leagues, ~120 teams. Updated after each international event. Surfaced to fans at lolesports.com/gpr.

> *"The algorithm itself is owned by the data science team — tournament result score × tournament weight × recency decay. My responsibility: receive the computed rankings via API and surface them beautifully, performantly, and accurately to millions of fans."*

### Why ISR (not SSR, not CSR)

| Strategy | Why rejected |
|---|---|
| CSR | No SEO. Fans search "LoL power rankings" — must be indexable. No social OG tags. |
| SSR | Re-runs the page for every visitor. For millions of fans: wasteful and slow. Rankings only change after matches. |
| **ISR** ✅ | Static → sub-10ms CDN delivery. On-demand revalidation after matches. Stale-while-revalidate: fans never see a loading state. |

```typescript
// On-demand revalidation triggered by webhook from results service:
export default async function handler(req, res) {
  const secret = req.headers['x-riot-webhook-secret'];
  if (secret !== process.env.REVALIDATION_SECRET) return res.status(401).end();
  await res.revalidate('/gpr');            // re-run at root
  await res.revalidate('/gpr/[teamId]'); // each team's detail page
  return res.json({ revalidated: true });
}
// "Within 60 seconds of a match result being recorded:
//  The GPR page automatically regenerates. No engineer triggers a deploy."
```

### Technical challenges

- **Rank change indicators:** ↑2 / ↓1 / NEW — must be computed from previous snapshot
- **Region color coding:** consistent with all Riot esports branding
- **Mobile:** full table must work on small screens — collapsed non-essential columns (hide "Games Played" on mobile, keep rank/team/region/points)
- **i18n:** team names in Korean on ko-KR locale, Japanese on ja-JP
- **Dynamic OG images:** `/api/og/gpr?leader=T1` generates a social preview card showing the current #1 team — important for viral social sharing during tournaments

---

## 🌐 Part 3 — Graph-Based Tournament Editor

### Why "graph" and not just a bracket editor

> *"Simple single-elimination: 8 teams → 4 QFs → 2 SFs → 1 Final. A tree. Trivial to render. But Riot runs complex formats: group stage feeds into playoff stage, 3rd-place teams from groups get a second chance via a play-in bracket. These are NOT trees. They're directed acyclic graphs — nodes have multiple inputs from different source stages."*

**Concrete example — 2024 Worlds:**
```
Play-In (8 teams, Swiss)
  → 4 advance to: Group Stage
  
Group Stage (16 teams, 4 groups, double round-robin)
  → 1st & 2nd → Knockout Bracket
  → 3rd → Play-In Bracket (second chance, 2 more spots to Knockout)
  
Knockout (8 teams, single elimination)
  → QF → SF → Grand Final
```
The 3rd-place teams loop back. A tree cannot express this. A graph can.

### Data model

```typescript
interface TournamentGraph {
  nodes: TournamentNode[];
  edges: TournamentEdge[];
}

interface TournamentNode {
  id:     string;          // stable UUID
  type:   "group" | "match" | "final";
  config: {
    format:    "single_elim" | "double_elim" | "swiss" | "round_robin";
    teamCount: number;     // total teams
    advance:   number;     // how many advance to next stage
  };
  position: { x: number; y: number }; // for visual layout
}

interface TournamentEdge {
  source:       string;    // node ID
  sourceHandle: "1st" | "2nd" | "3rd" | string;  // which placement exits
  target:       string;
  targetSlot:   number;    // which input slot on target
}
```

### Frontend implementation: React Flow

> *"React Flow is the library for node-edge graph UIs in React. It handles node rendering, drag-and-drop, edge drawing (bezier curves), zoom/pan, selection. We built custom node types on top: GroupStageNode shows format + advancement count. MatchNode shows 'Best of 5' + slot indicators. FinalNode has the gold styling and Champions label."*

### Graph validation (critical)

```typescript
function validateTournamentGraph(graph: TournamentGraph): ValidationResult {
  const errors: string[] = [];

  // 1. Cycle detection (A → B → A → infinite tournament)
  if (hasCycle(graph)) errors.push("Cycle detected: tournament would loop forever");

  // 2. Orphan nodes (disconnected stages)
  const orphans = findOrphans(graph);
  if (orphans.length) errors.push(`Disconnected stages: ${orphans.join(", ")}`);

  // 3. Slot overflow (more teams feeding in than a stage can hold)
  for (const node of graph.nodes) {
    const incomingTeams = countIncomingTeams(graph, node.id);
    if (incomingTeams > node.config.teamCount) {
      errors.push(`${node.label}: receives ${incomingTeams} teams but configured for ${node.config.teamCount}`);
    }
  }

  // 4. Exactly one final node
  const finals = graph.nodes.filter(n => n.type === "final");
  if (finals.length !== 1) errors.push("Must have exactly one Grand Final");

  return { valid: errors.length === 0, errors };
}
```

**Impact:**
> *"Before this editor: tournament structures were defined in config files by engineers. Every new format change required an engineer, 2+ days. After the editor: Riot esports operators define complex custom formats themselves in 30 minutes. The graph validation prevents invalid configurations from saving."*

---

## 📊 Part 4 — 0 Major Incidents 2024

### Root cause analysis of 2023 incidents

| Incident type | Root cause | # in 2023 |
|---|---|---|
| Wrong bracket advance | No confirmation with diff preview. Under pressure, operator clicked wrong team. | 3 |
| Score sync outage | No fallback for manual entry. No DR runbook in UI. | 2 |
| Data mapping failure | Regional provider changed team ID format. No unknown-ID alert. | 4 |
| Double lobby creation | No idempotency on lobby creation. Operator double-clicked. | 2 |

**Total: ~11 major incidents in 2023.**

### The fixes (what actually reduced incidents)

**Fix 1: Confirmation dialog with full diff**
```
"You are advancing T1 (1st place, Group A) to Quarterfinal 1 Slot A.
 BLG will be placed in Quarterfinal 1 Slot B.
 This action cannot be undone. [CONFIRM] [CANCEL]"
```
TypeScript: match state is a discriminated union. Cannot access `score` on a `SCHEDULED` match → compile error.

**Fix 2: Manual entry fallback always accessible**
Match result can be entered manually even if all automated systems are down. The manual path is never hidden. DR runbook is in the UI sidebar — not in Confluence.

**Fix 3: Zod validation + unknown ID alert at ingestion time**
Unknown team IDs surface immediately when data is received — not when the match page fails to load during the broadcast.

**Fix 4: Idempotency keys on all mutation requests**
```typescript
// Lobby creation is typed to require an idempotency key:
async function createLobby(matchId: MatchId, idempotencyKey: IdempotencyKey) { … }
// Cannot call without one → TypeScript compile error.
// Button disabled + loading state after first click.
```

**The meta-lesson:**
> *"We didn't reduce incidents by adding more monitoring. We reduced incidents by making it HARD to do the wrong thing and EASY to do the right thing. The UI prevents most invalid actions before they happen. TypeScript catches the rest at compile time. RTL ensures our validation flows work correctly. Monitoring catches the rare remainder. Incidents at 0 because the first line of defence is the UI — not the monitoring system."*

---

## 🔄 Part 5 — Legacy → React / TypeScript / React Testing Library

### What "critical path" means

> *"Not all tools are equal. Critical path tools are used live, during broadcasts, with millions of viewers watching. A bug there is an immediate broadcast incident. These tools were the first to migrate."*

### Migration priority (by incident risk)

1. Match Status Dashboard (caused 3 incidents in 2023)
2. Bracket Advancement (caused 3 incidents)
3. Data Mapping UI (caused 4 incidents)
4. DR Panel (new — built in React/TS from day 1)

### Why React Testing Library specifically

> *"RTL tests what the user does, not what the code does. Our 'user' is an esports operator running a live match. Our test: render the operator dashboard. Click 'Advance Team'. Expect the confirmation dialog to appear with the correct team names. Click CONFIRM. Expect the API to be called with the correct match ID.*
>
> *This test still passes even if we refactor the entire state management layer. An implementation-detail test — testing internal state, not UI — would break on every refactor. We had zero tests. RTL gave us stable, meaningful tests without fighting the testing framework."*

### TypeScript findings during migration

> *"TypeScript caught 3 bugs during migration that would have been production incidents. All three: accessing properties on potentially undefined match data. The old JavaScript: assumed data was always present. TypeScript: forced us to handle the undefined case. At least one would have caused a live broadcast incident."*

**TypeScript discipline:**
- Strict mode from day 1
- No `any` — enforced by ESLint rule, CI fails on `any`
- Match state: discriminated union (compiler prevents accessing wrong state's fields)
- All API responses: Zod validated, then typed

---

## ❓ 25 Interview Q&As

#### Q1: What is the Next.js operator app for?
> *"It's the internal tool Riot Esports operators use on game day to run live matches. Create lobbies, record scores, advance brackets, handle data mapping. Before it: all manual. After: operator approves, system executes."*

#### Q2: Why Next.js for an internal operator tool?
> *"Server Actions for server-side state transition validation — no separate API layer to maintain. ISR for the read-heavy parts. RSC to reduce client bundle. And our team was already strong in Next.js. For a 50-user internal tool: the simplicity dividend is real."*

#### Q3: What is disaster recovery in an esports context?
> *"If Score Sync goes down during a live match: the operator needs a path to record the result manually. DR mode: all automation paused, manual entry forms enabled, runbook appears in the UI sidebar. The match result must always be recordable, regardless of system state."*

#### Q4: How does data mapping automation work?
> *"500+ known team aliases pre-mapped. Incoming data validated by Zod. Known IDs mapped automatically. Unknown IDs: surfaced to operator immediately at ingestion — not at match time. New mappings saved permanently. Eliminated 2-3 hours of weekly manual work."*

#### Q5: What is the Global Power Rankings?
> *"A global ranking of all professional LoL teams based on tournament performance. 12 regional leagues, ~120 teams. Updated after international events. Fan-facing at lolesports.com/gpr."*

#### Q6: Why ISR for GPR?
> *"Rankings change rarely — only after major matches. SSR: re-runs the page for every visitor; wasteful for millions of fans. CSR: no SEO, no social OG tags. ISR: static page delivered from CDN in sub-10ms. Automatically regenerates within 60 seconds of a match result via on-demand revalidation webhook."*

#### Q7: What was technically hard about the GPR frontend?
> *"Multi-region data aggregation (12 leagues, different formats, different team ID systems), i18n (Korean team names on ko-KR locale), dynamic OG image generation for social sharing, mobile-responsive table with progressive column collapse, and rank change computation from previous snapshot."*

#### Q8: Why a graph-based tournament editor specifically?
> *"Simple brackets are trees. Complex Riot formats — where 3rd-place teams from one stage feed back into a different stage — are directed acyclic graphs. Trees can't express multiple input sources into a single node. React Flow + custom node types gave us the flexibility to represent any tournament format."*

#### Q9: What's the data model for the tournament graph?
> *(Nodes with type/config/position, Edges with sourceHandle for placement labels, TournamentGraph wrapping both.)*

#### Q10: How do you validate a tournament graph?
> *(Cycle detection, orphan node detection, slot overflow check, exactly-one-final validation. Run before save. Show errors inline.)*

#### Q11: What's the most complex tournament format you needed to support?
> *"2024 Worlds: Play-In (Swiss) feeds into Group Stage. 3rd-place teams from groups feed back into a Play-In Bracket for second-chance spots into Knockout. That's three stages with cross-references. A tree editor would need to be completely replaced. The graph editor: just add edges."*

#### Q12: How did you get to 0 major incidents in 2024?
> *"Specific fixes for each incident type. Confirmation dialogs with full diff previews for bracket advancement. Manual entry fallback always accessible. DR runbook in the UI sidebar. Zod validation + unknown-ID alerts at data ingestion. Idempotency keys on all mutation requests."*

#### Q13: What caused the 2023 incidents?
> *(Root cause per type: wrong bracket advance = no preview; score sync = no fallback; data mapping = no unknown-ID alert; double lobby = no idempotency.)*

#### Q14: What's your meta-lesson from reducing incidents to 0?
> *"We didn't do it with more monitoring. We did it by making invalid actions hard to perform. The UI prevents most errors before they happen. TypeScript catches the rest at compile time. RTL verifies the validation flows work. Monitoring is the last line — not the first."*

#### Q15: Why React Testing Library over Jest component testing?
> *"RTL tests operator behavior, not implementation details. If we refactor state management: RTL tests still pass. Implementation tests: break on refactor. For critical path tools: stable, meaningful tests matter more than easy tests."*

#### Q16: What did TypeScript catch during the migration?
> *"Three bugs: all accessing properties on potentially undefined match data. The old JavaScript assumed data was always present. TypeScript forced us to handle the undefined case. At least one would have been a live incident."*

#### Q17: How did you prioritise the migration?
> *"By incident risk. Match Status Dashboard (3 incidents in 2023): migrated first. Bracket Advancement (3 incidents): second. Data Mapping UI (4 incidents): third. New features: built in React/TS from day 1, never existed in legacy."*

#### Q18: What's a Server Action and why use it here?
> *"Server Actions: async functions that run on the server, called directly from client components. No manual API route needed. For operator tools: we get server-side validation without maintaining a separate Express/Fastify layer. The mutation and its validation are co-located."*

#### Q19: How does the match state machine work?
> *"Discriminated union type: each state has different allowed fields and different valid transitions. TypeScript's compiler enforces that you can't access `score` on a `SCHEDULED` match. Valid transitions: declared as a constant object. Invalid transition: throws before any API call is made."*

#### Q20: How do you handle idempotency for lobby creation?
> *"Every lobby creation request carries an idempotency key generated client-side. If the operator double-clicks: second request carries same key, server returns the same response, no second lobby created. TypeScript: the function signature requires an `IdempotencyKey` branded type — can't call it without one."*

#### Q21: What is your Next.js rendering strategy overall?
> *"ISR for fan-facing GPR pages. SSR for operator dashboards where real-time data is critical. Server Components for the data-heavy read parts. Client Components only where interactivity is required. Bundle size discipline: critical for fan-facing pages."*

#### Q22: How do you think about being a lead developer?
> *"As a lead: I own the system, not just the feature. When I see an incident pattern: I trace it to a design failure and fix the design. The 2023 incidents weren't bad luck. They were predictable failures of the system design. My job: make the design prevent the failure."*

#### Q23: What was the biggest technical challenge in the role?
> *"The graph-based tournament editor. Every other feature: clear requirements, clear patterns. The graph editor: completely novel. No off-the-shelf solution for 'build a DAG that represents a customisable esports tournament format with validation'. Required building new abstractions, choosing a library (React Flow), and defining the data model from scratch."*

#### Q24: How do you approach legacy migration?
> *"Prioritise by risk, not by difficulty. Migrate the things most likely to cause incidents first. Feature-flag each migrated piece. Delete old code immediately after 100% rollout. Never run two implementations simultaneously for the same user."*

#### Q25: What are you most proud of in this role?
> *"The 0 incidents number. But specifically: that it came from design decisions, not from heroic operational effort. Engineers at Riot used to scramble to fix incidents during live broadcasts. Now they don't. That's what good engineering looks like — systems that prevent problems before they happen."*

---

## 🎤 Opening Statement (60 seconds)

> *"I was a lead developer at Riot Games on the esports team, building two main things: the internal operator tooling that runs live League of Legends esports broadcasts, and the fan-facing Global Power Rankings at lolesports.com.*
>
> *On the operator side: I built a Next.js application that automates game day operations — lobby creation, match advancement, score recording — and handles disaster recovery when systems degrade during live broadcasts. The measure I'm most proud of: we reduced major incidents from about 11 in 2023 to 0 in 2024. That came from specific engineering decisions — validation, DR fallbacks, idempotency, TypeScript, and React Testing Library — not from luck.*
>
> *I also built a graph-based tournament editor that let esports operators create complex tournament formats without engineering involvement. Tournaments aren't trees — they're directed acyclic graphs with multiple input sources. I built that from first principles using React Flow.*
>
> *And on the fan side: the Global Power Rankings — a Next.js ISR application that updates within 60 seconds of a match result and delivers sub-10ms page loads to millions of fans worldwide."*

---

## 📎 Demo Tab in App

Live at: **⚔️ Riot Esports** tab in the demo app.

- **🎮 Game Day Ops** — Live match queue (advance/record), DR health monitor + runbook activation, data mapping pipeline stepper, real-time audit log
- **🏆 Power Rankings** — Team cards with rank changes, region filtering, ISR revalidation button
- **🌐 Tournament Editor** — Add group/match/final nodes, draw edges between nodes, SVG bezier rendering, delete operations
- **📊 Reliability** — 2023 vs 2024 incident bar chart, per-feature migration progress, root-cause code explanations
