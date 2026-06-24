# 💬 Interview Guide — Slack Staff Engineer, Core Collaboration
## 35M DAU · Messaging · Real-time · Accessibility · Technical Leadership

---

## 🔑 Context: What This Role Signals to Interviewers

```
"35 million daily active users"
  → You operate at a scale where every engineering decision has aggregate impact.
  → 1ms improvement × 35M users = 97 hours of aggregate time saved per day.
  → Error rate 0.001% = 350 users hitting a bug. Every bug is a P1 at this scale.

"Core collaboration team"
  → You own the heart of the product: messages, channels, threads, reactions, presence.
  → Not a feature team. A PLATFORM team. Your work enables other teams.
  → Reliability: the thing everyone depends on cannot go down.

"Staff engineer"
  → You write code AND shape direction. Both, not one or the other.
  → RFC process: you write the design documents that align 6 teams.
  → Technical leadership: mentoring, design reviews, setting the bar.
  → Prototyping: you de-risk new features before teams commit to building them.

"High-quality accessible features using React"
  → Accessibility: Slack is famous for keyboard-first navigation. Users navigate
    entirely without a mouse. This is a FEATURE, not a checkbox.
  → "High-quality": zero regressions. Observability before shipping. Rollback plan.
  → React: virtualised lists, memoisation, Concurrent Features, code splitting.
```

---

## 1️⃣ "35 Million Daily Active Users" — What It Actually Means

### The Scale Math (Memorise These)

```
PERFORMANCE:
  1ms render improvement × 35M users × 10 renders/session = 350,000,000ms = 97 hours saved/day
  1KB bundle reduction × 35M page loads = 35MB less data transferred every page load
  50ms LCP improvement × 35M = 486 hours of "perceived wait" eliminated per day

ERROR RATES:
  0.001% error rate = 350 users seeing a bug RIGHT NOW
  0.01%  error rate = 3,500 users
  0.1%   error rate = 35,000 users (escalation threshold)
  "At this scale, there's no such thing as a minor bug. There are just bugs you haven't found yet."

A/B TESTING:
  1% rollout = 350,000 users. Statistically significant data in HOURS, not weeks.
  Effect size of 0.5% in session length = statistically detectable with n=350K.
  At startup (100K users): 1% rollout = 1,000 users. Need weeks for signal.
  Slack: ships to 1% on Day 1. Full data by Day 3. Iterate.

OPERATIONAL:
  99.9% uptime SLA = 8.7 hours downtime/year.
  At 35M DAU: 8.7 hours × average 1,500 concurrent users/minute = 784,000 user-hours lost.
  "We don't have outages. We have incidents. And we do root cause analysis for every single one."
```

### What This Changes About Engineering

```
AT STARTUP SCALE (50K users):
  - Slow component? 5 users notice. Easy fix.
  - Missing memo()? Barely noticeable.
  - No A/B tests: too slow to get signal.
  - Rollback: manual, slow.

AT SLACK SCALE (35M users):
  - Every slow render: felt by millions simultaneously.
  - A missed React.memo() on the message bubble: billions of wasted renders/day.
  - Feature flags: mandatory. Every feature ships behind a flag.
  - Gradual rollout: 1% → 10% → 25% → 50% → 100% with automated metric gates.
  - Rollback: one command. Tested before every deploy.
  - Observability: metrics, traces, logs — before, during, and after every deploy.

"The thing that changes most is your relationship with monitoring.
At a startup: you find out about bugs from support tickets.
At Slack: Datadog alerts you before users email support."
```

---

## 2️⃣ Core Collaboration Features — Technical Depth

### Messaging System

```
WHAT IT IS:
  The core message composer, message list, send/receive flow.
  Powers every channel (#general, DMs, group DMs, threads).
  Every message send: goes through the same infrastructure.

THE HARD PROBLEMS:

1. OPTIMISTIC UPDATES
   Problem: at 35M DAU, even a 200ms network delay is felt.
   The message should appear THE INSTANT you press Enter.
   
   Pattern: temporary client-side ID → display immediately → server ack replaces ID.
   
   // Send path:
   const tempId = crypto.randomUUID();
   dispatch({ type: "INSERT_OPTIMISTIC", payload: { id: tempId, text, time: Date.now(), optimistic: true } });
   
   const { messageId, ts } = await api.sendMessage({ text });
   dispatch({ type: "CONFIRM_MESSAGE", payload: { tempId, messageId, ts } });
   
   // On server rejection:
   // Rate limit → mark with error state + Retry button
   // Network error → add to offline queue, flush on reconnect
   
   "The message appears instantly. If the server fails: the user sees a Retry button.
   They never see nothing. They never wonder if it sent."

2. MESSAGE LIST VIRTUALISATION
   Problem: Slack channels can have 100,000+ messages.
   Rendering 100K DOM nodes: browser freezes.
   
   Solution: virtual list — render ONLY visible items + buffer.
   
   // Simple concept:
   const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3); // overscan
   const endIndex   = Math.min(messages.length - 1, Math.ceil(...) + 3);
   const visible    = messages.slice(startIndex, endIndex + 1);
   
   Memory: 100K messages × 3KB DOM = 300MB WITHOUT virtualisation.
   With virtualisation: ~20 visible × 3KB = 60KB. 5,000× reduction.
   
   SLACK-SPECIFIC CHALLENGE: variable row heights.
   Messages: 1 line (20px) or 5 lines + reactions + thread preview (120px).
   Solution: measure after mount, cache height per message ID.
   On first render: estimate. After mount: measure + update.
   "The tricky part: updating the virtual list's total height estimate
   as messages load and are measured. Get this wrong: scroll jump."

3. MEMOISATION AT SCALE
   // The message bubble: renders billions of times per day.
   const MessageBubble = React.memo(MessageBubbleInner, (prev, next) => {
     return (
       prev.message.id === next.message.id &&
       prev.message.text === next.message.text &&
       prev.message.reactions === next.message.reactions && // referential equality
       prev.isHovered === next.isHovered
     );
   });
   
   WHY custom comparison: the default (shallow equality of all props)
   fails when parent passes onReact={useCallback(...)} incorrectly.
   Custom: explicitly list what makes a message "visually different."
   
   "At 35M scale: every unnecessary re-render is billions of wasted CPU cycles per day.
   React.memo is not a micro-optimisation. It's operational hygiene."
```

### Real-Time Architecture

```
WEBSOCKET MULTIPLEXING:
  Why ONE socket (not one per channel):
  Average user: 8 channels + 10 DMs = 18 subscriptions.
  One socket per subscription: 35M × 18 = 630M concurrent connections.
  One socket per user: 35M connections. 18× more efficient.
  All events (messages, typing, presence, reactions): multiplexed on one connection.
  
  RTM (Real Time Messaging) protocol:
  Events identified by "type" field. Client routes to the right handler.
  
RECONNECTION — EXPONENTIAL BACKOFF:
  Why backoff: on a network blip, millions of users reconnect simultaneously.
  Thundering herd: all clients retry at once → server overwhelmed → cascade failure.
  Exponential backoff + jitter: clients spread their reconnect attempts.
  
  // Delays: 500ms → 1s → 2s → 4s → 8s → 16s → 32s (cap).
  // Jitter: add Math.random() * 200ms to desynchronise clients.
  reconnectDelay = Math.min(baseDelay * Math.pow(2, attempt), 32000) + Math.random() * 200;
  
  OFFLINE QUEUE:
  Message typed during disconnect → stored in memory.
  On reconnect → flush in order → server receives with original timestamps.
  "The user can type and send while offline. Messages are queued.
  On reconnect: delivered silently. User: unaware they were offline."

PRESENCE SYSTEM:
  States: active (green dot), idle (yellow dot), away, DND (do not disturb).
  
  How "idle" is detected:
  - No mousemove, keydown, or scroll for 30 seconds.
  - Tab hidden (Page Visibility API).
  
  How "offline" is detected:
  - Heartbeat: client sends ping every 30s.
  - Server: if no ping for 90s → mark "away". For 5 min → mark "offline".
  
  Why NOT rely on WebSocket close event:
  "If the user closes their laptop: the TCP connection doesn't close immediately.
  It hangs for up to 7 minutes (TCP timeout). Without a heartbeat:
  the server thinks you're still online for 7 minutes. 
  With a 30s heartbeat: detected in 90s."
  
  Presence state machine (important for interviews):
  active → idle → away → offline
  Any user activity (mousemove/keydown): transition to active.
  DND: set explicitly by user. Activity events don't override it.
  "DND is a contract with your team. The user decided not to be interrupted.
  A mouse movement shouldn't break that contract."
```

### Threads and Reactions

```
THREADS:
  Architecture: parent message has threadCount, threadTs (timestamp).
  Thread: a separate message list, filtered by threadTs.
  Thread panel: an overlay on the right side, showing thread messages.
  
  Key UX challenge: notification for thread replies.
  "Following" a thread: user explicitly opts in to be notified of replies.
  Default: only notified if you participated in the thread.
  Preference setting: per-channel, per-thread.

REACTIONS:
  Data model: message.reactions = [{ emoji: "🎉", count: 5, users: [userId1, ...] }]
  Optimistic update: increment count immediately, send to server.
  Deduplication: if two users react simultaneously, server resolves.
  
  Emoji picker: virtual list (there are 3,000+ emoji).
  Search: filter by name. "fire" → 🔥.
  Skin tones: modifier per emoji category.
  "The emoji picker is a surprisingly complex UI component.
  Virtual list for performance. Search with tokenisation.
  Skin tone persistence per emoji. Recent emoji history."
```

---

## 3️⃣ Accessibility — Keyboard-First Design

```
SLACK'S PHILOSOPHY:
  "Power users navigate Slack entirely with keyboard. Never touching the mouse.
  This is not an accessibility feature. It's a power user feature.
  And for users who rely on keyboard or screen readers: it's essential."

KEY KEYBOARD SHORTCUTS (know these):
  K           → Quick switcher (jump to any channel/DM)
  ⌘ /         → Search
  ⌥ ↑/↓       → Navigate between channels and DMs
  j / k        → Navigate messages in the current channel
  e            → Add emoji reaction to focused message
  t            → Reply in thread to focused message
  Tab          → Move to next interactive element
  Shift+Tab    → Move to previous element
  Escape       → Close modal / return to previous focus zone
  Enter        → Open or activate focused item
  Space        → Scroll down (when not in composer)

ARIA LIVE REGIONS — THE MOST IMPORTANT ACCESSIBILITY PATTERN FOR SLACK:
  
  Problem: Slack is real-time. Messages appear while you're reading or typing.
  Without ARIA live regions: screen reader users miss new messages.
  "The screen reader reads what you're focused on. It doesn't just announce
  every DOM change. You have to tell it what to announce."
  
  Pattern: a visually hidden announcer element, updated with the latest message.
  
  <div
    role="log"
    aria-live="polite"         // "polite": wait until user is idle to announce
    aria-atomic="false"        // "false": announce each new item, not the whole list
    aria-relevant="additions"  // only announce new items (not removals)
    aria-label="Messages in #general"
    style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}
  >
    {/* Only the LATEST message: prevents overwhelming the screen reader */}
    {latestMessage && <p>{latestMessage.author} said: {latestMessage.text}</p>}
  </div>
  
  WHY separate from the visual list:
  "If we use role='log' on the visible message list: every message ever loaded
  would be announced. Overwhelming. The hidden announcer: only new messages.
  The user hears: 'Sarah Chen said: Lunch at 12?'. Clean and useful."
  
  FOR DMs AND @MENTIONS: use role="alert" aria-live="assertive".
  "Assertive interrupts the current announcement. For a DM:
  the user should hear it immediately, even if a screen reader is in the middle
  of reading something else. For a @mention: same. Assertive."

FOCUS MANAGEMENT — THE MOST MISSED PATTERN:
  
  1. FOCUS TRAP IN MODALS:
     When a modal opens: Tab cycles only within the modal.
     Tab on last element: wraps to first.
     Shift+Tab on first: wraps to last.
     Without this: Tab key escapes the modal → user is lost in the page behind.
  
  2. RETURN FOCUS ON CLOSE — THE MOST COMMONLY MISSED:
     When the modal closes: focus returns to the element that opened it.
     
     const openModal = (triggerElement: HTMLElement) => {
       modalTriggerRef.current = triggerElement; // remember who opened it
       setModalOpen(true);
     };
     
     const closeModal = () => {
       setModalOpen(false);
       requestAnimationFrame(() => {          // after DOM update
         modalTriggerRef.current?.focus();    // return focus
       });
     };
     
     "Without this: modal closes → focus is gone.
     Screen reader user: now at the top of the document.
     They have to Tab back to where they were.
     With it: seamless. User doesn't even notice the modal closed."
  
  3. j/k MESSAGE NAVIGATION:
     Using aria-activedescendant on the message list container:
     The container has focus (tabIndex=0). Individual messages: tabIndex=-1.
     j/k: update aria-activedescendant. Screen reader: announces the focused message.
     Why: 100K messages. Can't give all of them tabIndex=0.
     "One focusable container, one active descendant. The ARIA pattern for lists."

WCAG 2.1 AA — WHAT IT MEANS IN PRACTICE:
  1.4.3  Contrast ratio: 4.5:1 for text.
  2.1.1  Keyboard: every function operable with keyboard.
  2.4.3  Focus order: logical Tab sequence.
  2.4.7  Focus visible: every interactive element has visible focus ring.
  4.1.2  Name, Role, Value: every UI component has a proper ARIA role.
  "We run axe-core in CI on every PR. Zero a11y violations: required to merge."
```

---

## 4️⃣ Technical Leadership — Staff Engineering at Slack

### RFC Process

```
WHAT AN RFC IS:
  RFC = Request for Comments. A design document for significant changes.
  Authored by: whoever is proposing the change (often a staff engineer).
  Reviewed by: engineers, designers, PMs, accessibility specialists, security.
  
  WHY:
  "Writing forces clarity. If you can't explain the tradeoffs in writing:
  you don't fully understand the problem.
  The RFC is the shared artifact. Everyone reads the same document.
  Decision: made asynchronously, not in a 45-minute meeting."

RFC LIFECYCLE (mine, RFC-047: Message Composer Rich Text Architecture):
  DRAFT → Circulated to 6 reviewers across Frontend, Mobile, Backend, Design.
  REVIEW → Two rounds of comments. Address each in the doc. Track decisions.
  APPROVED → Unanimously. Two staff engineers + PM sign off.
  IMPLEMENTED → I mentored two engineers through the implementation.
               Weekly design reviews to verify alignment with the RFC.
               Shipped to 100% of users (35M DAU). Zero regressions.

WHAT GOES IN AN RFC:
  - Problem statement (the "why")
  - Constraints (what is non-negotiable)
  - Options considered (not just the chosen approach)
  - Tradeoffs for each option
  - Recommended approach + rationale
  - Implementation plan (milestones, owners)
  - Success metrics (how do we know it worked?)
  - Rollback plan (what if it doesn't work?)
  - Open questions (unresolved)

"The section on alternatives considered is the most valuable part.
It shows the team what was rejected and why.
Without it: 6 months later someone asks 'why didn't we just do X?'
The RFC says: 'We considered X. Here's why we didn't.'"
```

### Prototyping Strategy

```
WHY PROTOTYPE BEFORE BUILDING:
  At 35M DAU: a bad feature that ships is expensive to roll back.
  Users: adapt. Product: can't just remove features without backlash.
  A prototype: proves viability BEFORE full commitment.
  "Prototyping is cheap. Shipping and unshipping is expensive."

THE 6-STEP PROCESS:

STEP 1: LOCAL PROTOTYPE (Day 1–3)
  Build in isolation. Mock data. No backend.
  Goal: does the interaction feel right? Does performance hold up?
  Tools: React DevTools Profiler, Lighthouse in dev mode.
  Output: demo video + timing measurements.

STEP 2: INTERNAL DOGFOOD (Week 1–2)
  Feature flag: Slack employees only (~5,000 users).
  Real data, real usage. Employees: give detailed technical feedback.
  "Our employees are our most demanding users. If it's broken: we hear
  about it in Slack itself. In #product-feedback within minutes."

STEP 3: 1% BETA (Week 2–4)
  350,000 users. Statistical power for most metrics within 2–3 days.
  STOP condition: error rate > 0.1% above baseline → auto-disable.
  Metric tracking: error rate, session length, message send rate, NPS.

STEP 4: 10% ROLLOUT (Week 4–6)
  Edge cases emerge. Performance: profiled in production on real devices.
  A/B test: 10% new vs 90% old. Key metric: messages sent per session.

STEP 5: GRADUAL 100% (Week 6–8)
  10% → 25% → 50% → 100% over days.
  Human checkpoint required to advance each step.
  "Automated gates check metrics. Humans check: does this feel right?"

STEP 6: FLAG CLEANUP (Week 8+)
  Remove the feature flag and old code path.
  Technical debt: accumulated during rollout. Clear it immediately.
  "A feature flag that outlives its purpose becomes config.
  Config becomes load-bearing. Load-bearing config breaks when touched.
  Clean up flags in the same sprint as shipping to 100%."

Implementation:
  function useFeatureFlag(flag: string) {
    const user = useCurrentUser();
    // Flags in bootstrap payload: no waterfall.
    // The flag state is known before first render.
    return user.featureFlags.includes(flag);
  }
  
  // Rollout percentage:
  // userId % 100 < 1 → in the 1% beta group.
  // Deterministic: same user always in the same group.
  // No flicker: user doesn't see old UI one day, new the next.
```

### Technical Leadership in Practice

```
WHAT STAFF ENGINEERING MEANS DAY-TO-DAY:
  - 50% IC work (coding, design, code review)
  - 30% technical leadership (RFCs, design reviews, mentoring)
  - 20% cross-team coordination (alignment, unblocking, escalation)
  
  "Staff engineer: not a senior engineer who writes more code.
  A staff engineer: multiplies the output of the team.
  One well-written RFC: aligns 6 teams. Saves 6 × 3 weeks of rework.
  That's the leverage."

MENTORING PATTERN:
  Weekly 1:1s with mentees (not status updates — growth conversations).
  "What's your biggest blocker this week? What did you learn?"
  
  Code reviews: not just "looks good" or "change this".
  "Explain why: so they understand the principle, not just the fix."
  
  Pairing: 2-hour focused sessions on hard problems.
  "Pairing is not babysitting. It's knowledge transfer in real-time."
  
  Design reviews: mentees present their designs. I ask questions.
  "What would break this? What did you consider and reject? Why?"
  Goal: teach the thinking process, not the answers.

INFLUENCING WITHOUT AUTHORITY:
  Staff engineer at Slack: no direct reports. Influence via:
  1. Writing great RFCs. People read and adopt them.
  2. Doing the work first. "Here's a proof-of-concept."
  3. Sharing data. "I measured it. Here are the numbers."
  4. Building trust. "When they said it would work, it did."
  
  "Never 'we should do X'. Always 'here's why X, here's how, here's the risk,
  here's the metric we'll use to know it worked.'"

PERFORMANCE BUDGETS:
  Message list render: p50 < 16ms, p99 < 50ms.
  Composer keystroke latency: < 16ms.
  Channel switch TTI: < 300ms.
  
  Enforced in CI:
  - Performance benchmarks: run on every PR.
  - Regression detector: if p50 increases > 2ms → PR blocked.
  - "We don't fix performance after the fact. We prevent regressions."
```

---

## STAR Scripts

### "Tell me about a time you led a technically complex initiative"

```
SITUATION:
The message composer had accumulated 3 years of technical debt.
It couldn't support rich text formatting (bold, italic, code blocks)
because the architecture was based on a plain textarea.
This was blocking a highly requested feature.

TASK:
Lead the architectural redesign without regressing any existing functionality.
35M users relied on the composer. Zero downtime. Zero regressions.

ACTION:
Wrote RFC-047 (Message Composer Rich Text Architecture).
Options evaluated: ProseMirror vs Slate vs custom contenteditable solution.
Chose ProseMirror: most battle-tested, best accessibility, richest plugin ecosystem.
Tradeoff documented: ProseMirror is complex (steep learning curve).
Mitigated by: pair programming sessions, detailed API documentation added to RFC.

Implementation: feature-flagged. Old composer: on by default.
New composer: 1% dogfood → 10% beta → 35M users.
Mentored 2 engineers through the implementation with weekly design reviews.

RESULT:
Shipped to 100% of users (35M DAU). Zero regressions.
Rich text formatting: shipped 6 weeks after the new composer.
The RFC: referenced by 3 other teams as the pattern to follow.
Became part of our "how we design at Slack" onboarding docs.
```

### "Tell me about a time you improved performance"

```
SITUATION:
The message list was degrading for users in large channels (5,000+ messages loaded).
Complaint: "Scrolling feels sluggish." Lighthouse: janky scroll, missed frames.

TASK:
Diagnose root cause. Fix without regressions.

ACTION:
Profiled with Chrome DevTools: "Long Animation Frame" (LoAF) entries during scroll.
Cause: non-virtualised list + synchronous message text processing.
Every scroll position change: React re-rendering all loaded messages.

Fix 1: Virtual list. Only visible messages + buffer rendered at any time.
Fix 2: Deferred text parsing (channel mentions, emoji, markup).
Before: parsed synchronously in the render. For 5K messages: 5K parses.
After: parsed lazily. Only when the message is in the viewport.

Feature flag: enabled for 1% of users first. Measured frame rate.
Result: 60fps scroll restored. No jank.

RESULT:
Frame rate: degraded (25fps for 5K+ messages) → stable 60fps.
Memory usage: reduced 70% for large channels (virtualisation).
Shipped to 100%. Zero user complaints after.
"The virtual list PR: now required reading for new engineers on the team."
```

### "Tell me about your approach to accessibility"

```
SITUATION:
A user research study revealed: 12% of Slack's users relied on keyboard navigation.
Not just screen reader users. Power users. Users with motor disabilities.
Keyboard nav was incomplete: some panels were mouse-only.

TASK:
Audit and fix keyboard navigation across the core collaboration surfaces.

ACTION:
RFC-055: Universal Keyboard Navigation Framework.
Systematic audit: every panel, every modal, every custom widget.
Used aXe CLI to find ARIA violations. Used screen reader (VoiceOver + NVDA) manually.

Found: modal dialogs missing focus traps. Thread panel: no keyboard entry.
@mention picker: Tab key escaped instead of cycling through suggestions.

For each: implemented the WAI-ARIA Authoring Practices pattern.
Modal: focus trap + return focus on close.
Thread panel: focusable on T key, Escape exits and returns focus to message.
@mention picker: ArrowUp/Down navigates, Enter selects, Escape cancels.

Added: ARIA live region for new messages.
Before: screen reader users unaware of new messages.
After: "Sarah Chen said: Lunch at 12?" announced on receive.

RESULT:
aXe violations: 47 (before) → 0 (after).
Keyboard test pass rate: 61% → 100%.
VoiceOver walkthrough: a11y specialist review: "This is how it should work."
Shipped to 35M users. Zero regressions on sighted users.
The framework: now a required checklist for all new UI components.
```

---

## Follow-up Q&A

**"How do you handle a performance regression caught in production?"**
> "First: is it impacting users now? If yes: rollback. Rollback first, investigate second. We have automated rollback in our deploy pipeline. One command. Under 2 minutes. Then: reproduce the regression with a performance profile. Is it a specific browser? A specific channel size? A specific user flow? Once reproduced: the fix is usually clear from the profile. Ship the fix behind the same feature flag. Monitor for 24 hours before 100% again."

**"Why did you choose React for a real-time application like Slack?"**
> "React wasn't chosen for real-time specifically — it was chosen for the component model and the ecosystem. The real-time pieces sit below React: the WebSocket connection, the event bus, the message store. React consumes that state. The key insight is that React's rendering model is actually well-suited for this: batched state updates, Concurrent Features (startTransition for deprioritising non-critical updates), and React 18's tearing prevention for real-time data. The challenge is performance: at 35M DAU and 30+ messages per session, you need memo(), virtualisation, and stable references to keep re-renders to zero for unchanged messages."

**"What does 'technical leadership' mean to you as a staff engineer?"**
> "Multiplication. A good staff engineer multiplies the team's output — they don't just add to it. Concretely: a well-written RFC aligns 6 teams before anyone writes a line of code. A 2-hour design review can prevent 3 weeks of rework. Teaching a mid-level engineer a debugging technique: they use it for the rest of their career. Code: I write it. But my bigger leverage is enabling others to write better code faster. The test: if I take a week off, does the team slow down? If yes: I haven't multiplied enough yet."

**"How do you handle disagreements on technical direction?"**
> "Data over opinions. I write the options down with their tradeoffs — not to 'win' but to make the disagreement productive. Usually disagreements are about different assumptions, not different values. Once the assumptions are explicit: the disagreement resolves. If it genuinely comes down to a value judgment (e.g., simplicity vs flexibility): I escalate with a clear framing. 'We've evaluated both options. Here's what we know. Here's what we're uncertain about. We need a decision by this date.' I never let disagreements block shipping."

**"How do you balance prototyping with shipping timelines?"**
> "The prototype IS the timeline proof. If I can't build a convincing demo in 3 days: the feature is too risky to commit to. The prototype surfaces the unknowns. Once I know the unknowns: I can estimate. Without a prototype: any estimate is fiction. At Slack: every significant new feature starts with a local prototype. The prototype goes to dogfood. Dogfood goes to 1% beta. Each stage: answers specific questions. 'Does the interaction feel right?' → prototype. 'Does it perform in production?' → dogfood. 'Do users engage with it?' → 1% beta. Data at each stage."

---

## ⚠️ Common Mistakes to Avoid

| Weak | Strong |
|---|---|
| "I built features for Slack" | "I owned core collaboration features serving **35M DAU** — messaging, real-time presence, threads — building with React, ARIA, WebSocket. Staff-level: I authored 4 RFCs, led design reviews for the team, and mentored 6 engineers." |
| "I made it accessible" | "I **audited** the keyboard nav surface (47 aXe violations found), wrote RFC-055 (Universal Keyboard Nav Framework), implemented **focus traps, return-focus-on-close, and ARIA live regions** for real-time message announcement. Result: 0 violations, 100% keyboard test coverage." |
| "I improved performance" | "**Virtualised** the message list: 70% memory reduction in large channels. **Memoised** the message bubble with custom comparison function (React.memo default was causing full re-renders on parent updates). Net: 60fps scroll restored for 5K+ message channels." |
| "I used WebSockets" | "**Single multiplexed WebSocket** per user (not per channel — 18× more efficient at 35M DAU). Implemented **exponential backoff reconnection** (500ms→32s with jitter to prevent thundering herd). **Offline queue** for messages during disconnects. **Application-level heartbeat** (30s ping) to detect stale connections within 90s vs TCP timeout of 7 minutes." |
| "I led the team" | "**Staff engineer, no direct reports.** Influence via: RFC authorship (4 RFCs, 2 implemented at 35M), design reviews (23 quarterly), mentoring (6 engineers, weekly 1:1s + code review + pairing). The RFC-047 pattern: adopted by 3 other teams as their design template." |

---

## 📊 Quick Facts

```
SCALE:
  35M daily active users
  Core collaboration team (messaging, channels, threads, reactions, presence)
  React + TypeScript. WebSocket (RTM). Custom virtual list. Zero-tolerance a11y.

PERFORMANCE:
  Message list render: p50 < 16ms, p99 < 50ms (budget)
  Compositor keystroke latency: < 16ms
  Channel switch TTI: < 300ms
  Virtual list: 5,000× DOM reduction for large channels

REAL-TIME:
  Single multiplexed WebSocket per user (all channels + DMs + presence)
  Reconnection: exponential backoff (500ms → 32s, jitter to prevent thundering herd)
  Offline queue: messages sent during disconnect, delivered on reconnect
  Presence heartbeat: 30s ping. 90s no ping → "away". 5min → "offline".

ACCESSIBILITY:
  Keyboard-first navigation: j/k for messages, K for quick-switcher, T for threads
  ARIA live regions: role="log" aria-live="polite" for new messages
  Focus traps: all modals. Return focus on close: all dismissals.
  WAI-ARIA Authoring Practices: tabs, alerts, dialogs, listboxes, comboboxes.
  aXe-core: runs in CI. Zero violations required to merge.

TECHNICAL LEADERSHIP:
  4 RFCs authored (High/Critical impact)
  23 design reviews led (quarterly)
  6 engineers mentored (1:1, code review, pairing, design reviews)
  Prototyping process: local (3 days) → dogfood (2 weeks) → 1% → 10% → 100%
  Rollout gates: automated metric checks at each step
  Performance budgets: enforced in CI (regression > 2ms blocks PR)
```

---

*Document last updated: June 2026 · Slack Staff Engineer — Core Collaboration · 35M DAU*
