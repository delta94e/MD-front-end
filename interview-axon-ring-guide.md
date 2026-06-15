# 🎯 Interview Guide — Axon · Ring Partnership & AI Hackathon

> **Đây là những bullet points mạnh nhất trong CV.** Chúng kết hợp: quy mô lớn (public partnership), domain phức tạp (law enforcement, chain-of-custody, privacy), leadership thực sự (tech lead 5 người), và innovation nổi bật (CEO-selected AI prototype). Cần kể những câu chuyện này với sự tự tin và độ sâu kỹ thuật rõ ràng.

---

## 🔑 Nắm vững bối cảnh domain trước — đây là "chìa khóa"

Interviewer ở các công ty tech sẽ ấn tượng với bạn không chỉ vì bạn biết React — mà vì bạn **hiểu tại sao** sản phẩm này khó.

```
PUBLIC SAFETY DOMAIN — những khái niệm bạn phải nói được tự nhiên:

Chain-of-custody:
  Hồ sơ pháp lý, có thể audit được, ghi lại TẤT CẢ các bước từ khi video được
  thu thập đến khi được dùng trong toà án. Nếu thiếu một bước → bằng chứng
  không được chấp nhận (inadmissible). Đây không phải audit log bình thường —
  nó phải immutable, timestamped, và legally defensible.

Axon Evidence:
  Cloud platform của Axon để quản lý bằng chứng cho cơ quan thực thi pháp luật
  (police departments, sheriff offices, DA offices). Giống như "S3 nhưng cho
  bằng chứng hình sự" — với encryption, access control, chain-of-custody tích hợp.

Ring Neighbors-Verified:
  Chương trình của Ring (Amazon) cho phép cơ quan thực thi pháp luật được xác
  minh (verified agencies) giao tiếp với chủ nhà (Ring camera owners) trong cộng đồng.

Privacy-preserving:
  Cơ quan thực thi pháp luật CHỈ thấy metadata (camera location radius, thời gian)
  cho đến khi chủ camera ĐỒNG Ý chia sẻ. Không có "force access" — informed,
  voluntary consent là bắt buộc và là core design principle.

Auditable evidence pipeline:
  Mỗi action (request sent, consent given/declined, video uploaded, video accessed,
  video exported) đều được ghi log với: ai, khi nào, từ đâu, làm gì. Immutable.
  Signed. Verifiable in court.

IACP:
  International Association of Chiefs of Police — hội nghị lớn nhất về law enforcement.
  Hàng nghìn chief of police, sheriff, law enforcement leaders. Được chọn vào
  top-3 ở đây = validation từ end users (the actual cops using the product).
```

---

## 1️⃣ Axon Community Request with Ring — Tech Lead, 5-Engineer Team

### Mức độ ấn tượng cần truyền đạt

Đây là một **publicly announced, live product** ở [axon.com/products/community-request/ring](https://axon.com/products/community-request/ring). Không phải prototype, không phải internal tool — là sản phẩm thực, người dùng thực, bằng chứng hình sự thực. Interviewer có thể Google nó ngay trong interview.

### STAR Script

```
SITUATION:
  Axon and Ring (Amazon) announced a partnership to allow verified public
  safety agencies to request video evidence from Ring camera owners near a
  crime scene — entirely voluntary, consent-based, and with full chain-of-
  custody into Axon Evidence.

  The product needed to satisfy three different stakeholders with conflicting
  incentives:
  - Law enforcement: needs evidence fast, in a court-admissible format
  - Ring camera owners (civilians): need clear consent flows, no coercion, privacy
  - Legal and compliance: must satisfy state privacy laws, CJIS requirements,
    and be defensible in court

  This was also a cross-company project — we were integrating with Ring's
  engineering and security teams, working within their API and data policies.

TASK:
  I was the technical lead of a 5-engineer frontend team, responsible for:
  - System design of the entire FE evidence pipeline
  - Sprint planning, execution, and code review
  - Cross-functional coordination: product, legal, partner engineering (Ring),
    and partner security
  - Shipping a production-quality, privacy-preserving, auditable product

  I was NOT just an IC (Individual Contributor) — I owned the technical
  direction while also contributing significantly as an engineer.

ACTION:
  The work broke down into five major technical challenges:

  1. CONSENT-FIRST UX ARCHITECTURE:
     I designed the entire information flow so privacy was not bolted on —
     it was the structural foundation. Agencies could ONLY see:
       - Approximate camera count in a geographic radius
       - NO addresses, NO camera owner identity, NO footage
     ...until a Ring owner EXPLICITLY consented. After consent, footage
     flowed directly into Axon Evidence with no human in the middle —
     reducing the risk of unauthorized access or data leakage.

  2. CHAIN-OF-CUSTODY PIPELINE:
     Every event in the evidence lifecycle was captured as an immutable
     audit record: request sent, notification delivered, consent given,
     upload initiated, upload completed, evidence accessed, evidence exported.
     I worked with the backend team to define the event schema and ensured
     the FE emitted the right events at the right moments — including failure
     states (upload started but interrupted — is that evidence tampered with?).

  3. CROSS-COMPANY API INTEGRATION:
     Ring had their own security model, token lifecycle, and data residency
     requirements. I led the FE integration design across both teams,
     defining the contract between our systems: what data Ring would surface,
     how we would authenticate, and how errors would be surfaced gracefully
     to law enforcement users without leaking internal system details.

  4. PARTNER SECURITY REVIEW:
     Amazon/Ring's security team ran a review of our integration.
     I was the FE representative in those sessions — explaining our data
     flow, token handling, and consent enforcement. Having the tech lead
     in those meetings (not a PM proxy) accelerated resolution significantly.

  5. VERIFIED AGENCY ROLLOUT:
     We rolled out incrementally — starting with Ring Neighbors-Verified
     agencies (agencies already in the Ring network), collecting feedback,
     and expanding. I designed the rollout dashboard so product could see
     adoption in real time.

RESULT:
  - Publicly announced Axon-Ring partnership — a company-level milestone.
  - Shipped to Ring Neighbors-Verified agencies across the United States.
  - Zero privacy incidents post-launch.
  - Passed Amazon/Ring security review with no critical findings.
  - Chain-of-custody records have been used in real criminal proceedings.
  - Product page: axon.com/products/community-request/ring
```

### Follow-up Q&A

**"What was the hardest technical decision you made on this project?"**
> "The hardest decision was how to handle the moment between consent given and upload completed. If a Ring owner consents but their upload fails mid-way — is that partial evidence? Is the chain-of-custody broken? I worked with legal, the backend team, and our partner team at Ring to define exactly three states: pending consent, upload in progress, and evidence received. Any failure in the middle resulted in the request being marked as 'incomplete' and the agency was notified to follow up through traditional channels. We could not allow an ambiguous state because ambiguity in a chain-of-custody is grounds for evidence dismissal in court."

**"How did you manage being both tech lead and an individual contributor?"**
> "I was deliberate about context-switching. Mornings were for leadership work: unblocking engineers, code review, cross-functional syncs with product, legal, and Ring. Afternoons were for deep implementation work — I owned specific components and features myself. I also made a point of never being the only person who understood any part of the system. Every feature I built, I paired with another engineer. If I got hit by a bus, the team should not stop. That is actually a security principle that applies to teams as well as systems."

**"How did you handle working with Ring's engineering team?"**
> "It required understanding that they had their own constraints, priorities, and review processes that I could not control. I learned early that asking 'can you do X?' is less effective than 'here are three ways we could achieve Y — which works best with your system?' Giving them options rather than requirements respects their architecture. I also established a regular sync specifically for technical questions — not a status meeting, but a forum for resolving integration blockers fast. That cadence was critical because time zones and different release cycles would have made async-only communication too slow."

**"What is chain-of-custody and why does it matter for your system?"**
> "Chain-of-custody is the documented, unbroken record of who collected evidence, when, from where, how it was handled, and who had access to it. In criminal law, if this chain has any gaps or ambiguities, a defense attorney can argue the evidence was tampered with and get it excluded. So for us, it meant every single user action — sending a request, the Ring owner receiving it, consenting, uploading, an officer accessing the footage — had to be logged with timestamps, user identity, and system state. Immutably. Even our error states were logged, because 'upload failed at 2:34 AM' is also a legitimate part of the record. This is not your typical application audit log — the legal stakes are fundamentally different."

**"How did you resurrect a previously paused project?"**
> "First thing I did was treat it like an archaeological dig, not a rescue mission. I spent the first week just reading: the existing code, the PRDs that existed, any Slack threads I could find about why it was paused. I wrote a document titled 'Current state of the world' — what exists, what works, what does not, what decisions were made and why, what is missing. I shared it with the team and with product. This had two effects: it forced me to deeply understand the landscape, and it surfaced disagreements — some decisions the previous team made were no longer valid given changed requirements. With that map, I could make a clear recommendation: here is what we keep, here is what we rebuild, here is the new timeline. Bringing clarity to chaos is more than half the battle."

**"How did you handle the privacy requirements?"**
> "Privacy was not a feature I added — it was an architectural constraint I designed around from day one. I used a principle I call 'minimum viable visibility': at every step of the flow, the system should surface the minimum information necessary to accomplish the task. An officer sending a request does not need to see camera owner names — they need to know approximately how many cameras are in the area. After consent, they need the footage — not the owner's account history. Every screen, every API call, every data field went through a 'do we actually need this?' review. It is much harder to remove data access later than to never grant it in the first place."

### Key phrases để dùng
- "Privacy-preserving by design, not by policy"
- "Chain-of-custody is the difference between evidence and noise"
- "Minimum viable visibility at every step"
- "Cross-company trust is built through technical clarity, not just relationships"
- "Ambiguity in legal evidence is not a bug — it is a legal liability"

---

## 2️⃣ Resurrected & Shipped a Previously Paused Greenfield Project

*(Covered extensively in the Q&A above — this section adds the leadership framing)*

### Câu hỏi "Tell me about a time you took over a struggling project"

```
SITUATION:
  The Community Request project had been started by a previous team and then
  paused — likely due to reprioritisation and resourcing. When I inherited it,
  there was partial code, outdated PRDs, and no clear owner.

TASK:
  Not just complete it — but understand whether what existed was worth
  building on, align the team on a direction, and ship it.

THE ASSESSMENT PHASE (often skipped — this is what makes the difference):
  Before writing a single line of code, I ran a structured assessment:

  1. CODE AUDIT — what percentage of existing code is production-ready?
     What is dead code, what is experimental, what is solid?

  2. REQUIREMENT ARCHAEOLOGY — pulled every PRD, design doc, Slack decision,
     and legal review I could find. Reconstructed the "why" behind each decision.
     Some "why"s no longer applied. Those decisions needed revisiting.

  3. STAKEHOLDER ALIGNMENT — brought product, legal, and engineering together
     for a "re-kickoff." Not a formal ceremony, but a session to explicitly
     validate: "Here is what we think we are building. Is that still right?"
     Three requirements changed in that session. Better to find out there
     than after building.

  4. CLEAR RECOMMENDATION DOCUMENT — "Here is what I recommend: keep X,
     rebuild Y, defer Z. Here is the revised timeline. Here are the risks
     I cannot fully resolve yet." Explicit uncertainty is a strength, not
     a weakness, in technical leadership.

RESULT:
  Shipped to production. Live in the US. Used by real agencies.
  The fact that it went from "paused / unclear" to "publicly announced
  partnership" is the result.
```

### Câu follow-up

**"What would you do differently if you had to resurrect a project again?"**
> "I would insist on the assessment phase being formal and time-boxed — I gave myself one week and I wish I had been more explicit with stakeholders that this week was not waste, it was investment. The instinct, especially in a paused project, is to start coding immediately to show progress. But the wrong momentum is worse than no momentum. I would also start the legal and security review earlier — those were on the critical path and they cannot be parallelised with development as much as you would hope."

---

## 3️⃣ System Design · Sprint Execution · Cross-Functional Leadership

### Câu hỏi "Tell me about how you led a team end-to-end"

```
SYSTEM DESIGN OWNERSHIP:
  I ran the system design process in 3 phases:

  Phase 1 — Discovery (1 week):
    Worked with product and legal to map every user journey (agency side AND
    Ring owner side) and identify every decision point that had legal,
    privacy, or security implications. This became our "sensitive surface map."

  Phase 2 — Architecture RFC (1 week):
    Wrote a technical RFC covering: component architecture, data flow,
    event schema for chain-of-custody, API contracts with Ring, state
    management approach, and error handling strategy.
    Circulated for 1 week async review with: 5 engineers, product, legal, Ring team.
    36 comments. Resolved every one before a line was written.

  Phase 3 — Living Design (ongoing):
    The RFC became a living document — updated when we made deviations,
    with the rationale documented inline. New engineers onboarding in week 3
    could read this and understand the full system in a day.

SPRINT EXECUTION:
  I ran 2-week sprints with one non-negotiable: no sprint started without
  a clear definition of "done" for every ticket, agreed by the engineer
  who would build it.

  My sprint structure:
    - Sprint planning: 1 hour. I pre-refined tickets so we spent planning
      on scope agreement, not ticket discovery.
    - Daily standup: async-first (Slack thread). Sync standup only when blocked.
    - Mid-sprint check-in: Wednesday, 30 min. "Are we on track? What needs to move?"
    - Sprint review: demo to product and legal, not just the team.
    - Retro: 30 min, 3 questions: What worked? What blocked us? What do we change?

CODE REVIEW OWNERSHIP:
  I reviewed every PR for the first 3 sprints — not because I did not trust the team,
  but because I needed to establish the quality bar and catch architectural drift
  early. After sprint 3, I rotated review ownership: each engineer became the
  "primary reviewer" for a feature area they owned.

  My code review principle: if I am leaving more than 3 substantive comments
  on a PR, that is a design problem that should have been caught in the RFC
  or in a quick design discussion — not discovered in code review.

CROSS-FUNCTIONAL INTERFACE:
  I was the single technical point of contact for:
  - Product: translated business requirements into technical constraints
    and vice versa. When product asked for something privacy-risky, I did
    not just say no — I explained the risk and proposed alternatives.
  - Legal: reviewed every data field, every consent copy, every audit log
    with our legal team. Made their job easier by proactively documenting
    what data flows where.
  - Ring Engineering: defined the API contract, owned the integration spec,
    resolved blockers in our weekly technical sync.
  - Ring Security: participated in their security review, answered technical
    questions directly (not through a PM proxy).
```

### Follow-up Q&A

**"How do you handle technical disagreements with legal or security teams?"**
> "I treat legal and security reviewers as technical stakeholders, not gatekeepers. When they raise a concern, I try to understand the underlying risk they are protecting against — not just the specific requirement they are citing. Often you can satisfy the underlying risk in a way that is more elegant than their initial ask. For example, our legal team initially wanted every video access logged with the officer's badge number. I learned the underlying concern was auditability and accountability. We satisfied that with their user identity in Axon Evidence, which is already tied to their credentials and is more tamper-resistant than a badge number field we would manage. Same risk, better solution."

**"What did you do when the Ring security review found something?"**
> "We had one finding during the security review — a token refresh edge case where, in theory, a session could persist slightly longer than intended. I triaged it immediately: what is the actual exploit scenario? How likely? What is the blast radius? It was medium severity, not critical. I gave the Ring security team a written response within 24 hours: the root cause, the fix we were implementing, and the timeline. I did not minimise it or defend the code — I focused on resolution speed and transparency. They appreciated that we treated their finding as information, not an attack. The review closed with no blockers."

---

## 4️⃣ AI-Powered Crash Diagramming — Hackathon → CEO Roundtable → IACP Top-3

### Bối cảnh domain cần hiểu

```
CRASH DIAGRAM:
  Một phần bắt buộc trong báo cáo tai nạn của cảnh sát. Sĩ quan phải vẽ
  sơ đồ hiện trường: vị trí các xe, hướng di chuyển, điểm va chạm, đèn giao
  thông, làn đường, nhân chứng... Thường vẽ tay hoặc dùng phần mềm cồng kềnh.
  Mất 20-40 phút mỗi sơ đồ.

AI OPPORTUNITY:
  Officer mô tả tai nạn bằng lời: "Xe A đang đi về hướng Bắc trên Main St,
  xe B rẽ trái từ Oak Ave không nhường đường, va chạm ở giao lộ."
  → AI generates a standardized, structured crash diagram.
  Saves 20-40 minutes per report. For agencies handling hundreds of crashes per month,
  this is significant operational efficiency.

IACP:
  International Association of Chiefs of Police — hội nghị thường niên lớn nhất
  của law enforcement. Hàng nghìn Chief of Police, Sheriff, và leadership từ
  khắp nước Mỹ. Được voted top-3 ở đây = real end-users (the actual decision makers
  who buy software) loved it.
```

### STAR Script

```
SITUATION:
  Axon ran a company-wide Gen-AI hackathon. Every team could propose and build
  any AI-powered feature. The constraint: 48 hours, working prototype.

  My team of [N] engineers chose a problem we had heard about repeatedly in
  customer conversations: crash diagrams. Officers were spending 20-40 minutes
  per crash report manually drawing diagrams that were then scanned and attached
  as image files — completely unsearchable, unstandardised, and time-consuming.

TASK:
  Build a working prototype that demonstrates the core value: officer describes
  a crash in plain English → system generates a structured, standardised
  crash diagram. In 48 hours.

ACTION:
  I led the team's technical direction and also coded:

  1. SCOPE CONTROL (Day 1, 2 hours):
     The biggest hackathon failure mode is trying to build everything.
     I ran a 30-min prioritisation session: "What is the ONE thing that, if
     we demo it well, makes someone say 'I need this'?" Answer: the moment
     an officer types a description and sees a diagram appear. Everything else
     was cut.

  2. ARCHITECTURE DECISION (Day 1, 1 hour):
     We chose a hybrid approach:
     - GPT-4 for natural language parsing → structured JSON (vehicle count,
       positions, directions, road type, collision point)
     - A deterministic SVG rendering engine we built in-house for the diagram
       (not generative image AI — too unpredictable, too hard to edit)
     
     This was the key insight: AI for understanding, deterministic for rendering.
     Law enforcement cannot use a diagram where a car might appear in the wrong
     lane because the model hallucinated. The diagram must be reliable.

  3. RAPID ITERATION (Day 1-2):
     We built in 3-hour loops: prototype → test with a real crash description →
     identify biggest failure mode → fix. By hour 30, the prototype handled
     the 10 most common crash scenarios accurately.

  4. DEMO DESIGN (Day 2, final 4 hours):
     I spent significant time on the demo flow. "A good idea demoed badly loses.
     A mediocre idea demoed well wins." We chose 3 real crash scenarios from
     public NHTSA data. The demo started with the officer typing — live,
     in front of the audience — and the diagram appearing in 3 seconds.
     Audience visceral reaction = validation.

RESULT:
  - Selected by Axon's CEO roundtable (the prototypes reviewed at the
    executive level to identify what to invest in further).
  - Voted top-3 favourite by customers at IACP — the largest law enforcement
    conference in the US, attended by the actual decision-makers who buy software.
  - The prototype demonstrated that GenAI could solve a real, daily pain point
    for officers — not just a novelty feature.
```

### Follow-up Q&A

**"What was the key technical insight that made it work?"**
> "The insight was to separate the intelligence from the rendering. Other teams built generative image models — they looked cool but the output was unreliable. A car door might be on the wrong side. A lane might be missing. For law enforcement, that is not acceptable — a crash diagram is a legal document. We used the LLM only for what LLMs are great at: understanding messy natural language and converting it to structured data. The diagram itself was rendered by a deterministic engine we wrote, which takes structured JSON and produces a precise, reproducible SVG. If an officer says 'vehicle facing north,' the vehicle is always, exactly, facing north. Reliability over impressiveness."

**"How did you lead a team under hackathon pressure?"**
> "The biggest leadership failure in hackathons is letting the team spend the first 6 hours debating the perfect solution. I imposed a forcing function: we had to have a testable prototype by hour 8 — even if it was wrong. The prototype was wrong. But being wrong with a working thing is infinitely more useful than being right in theory. We could see what was broken and fix it. By hour 24, we had something we were genuinely proud of. I also explicitly protected people from the temptation to add features. Every 'what if we also...' suggestion went into a parking lot. Focus is the most valuable resource in a hackathon."

**"What did the CEO roundtable selection mean technically?"**
> "It meant the prototype was clear enough that non-technical executives understood the value immediately — and credible enough that they believed it was buildable. Getting executive selection is partly a product decision and partly a communication decision. I coached the team on how to present: lead with the problem, not the technology. 'Officers spend 20-40 minutes per crash diagram. Multiply that by hundreds of crashes per month. That is thousands of officer-hours per year going to documentation instead of policing.' Then show the demo. Technology is the last thing you talk about."

**"Why did customers vote it top-3 at IACP?"**
> "Because it solved a real problem they live with every day. At IACP, the attendees are Chiefs of Police and sheriffs — they manage officers, they care about efficiency, they understand the operational cost of documentation. When they saw an officer type a crash description and a diagram appear in 3 seconds, the reaction was not 'that is a cool AI demo.' It was 'that is 30 minutes back for every officer, every crash, every day.' That is the difference between a feature and a solution. We had built a solution."

**"What would a production version of this look like?"**
> "Several things would change from prototype to production. First, the LLM output would need structured validation — we cannot have hallucinated facts in a legal document, so every parsed field would need a confidence score and a human-review flag for low-confidence outputs. Second, the diagram editor: officers need to be able to correct the diagram (the AI might misinterpret ambiguous descriptions). So the generated diagram would be a starting point, not a final output. Third, integration with existing report management systems — the diagram needs to attach to the report automatically, with chain-of-custody, not be a separate export. Fourth, fine-tuning on crash report data to improve accuracy for law enforcement-specific terminology."

---

## 🔗 Kết nối 4 bullets thành một narrative

Khi interviewer hỏi **"Tell me about the most impactful work you have done"**:

> "The work I am most proud of is the Axon Community Request with Ring — a publicly announced partnership product that I led technically with a 5-person team. Let me tell you what made it genuinely hard.
>
> The product sits at the intersection of three parties with different and sometimes conflicting needs: law enforcement agencies who need evidence fast, civilian Ring camera owners who need privacy and informed consent, and legal and compliance requirements that need every action to be court-admissible.
>
> That is not a typical product problem. Most products optimise for one user. This one had to serve three simultaneously without compromising any of them.
>
> The way I approached it was to make privacy the architectural foundation — not a feature added at the end. At every step of the flow, the system surfaces the minimum information necessary. An officer sending a request does not see camera owner addresses. They see a count. After consent, they get the footage. Nothing more.
>
> And every action in that flow — request sent, consent given, upload completed, evidence accessed — is logged as an immutable chain-of-custody record. Because in a criminal case, this evidence might be scrutinised by a defence attorney. Ambiguity there is not a UX problem. It is a legal liability.
>
> We shipped it. It is live. It has been used in real criminal proceedings.
>
> And separately, during Axon's Gen-AI hackathon, my team built an AI crash diagramming prototype that was selected by the CEO roundtable and voted top-3 by customers at IACP. Which showed me that the same mindset — understand the real problem deeply before touching technology — applies whether you have 6 months or 48 hours."

---

## ⚠️ Lỗi thường gặp khi kể những câu chuyện này

| Sai | Đúng |
|---|---|
| "We built a feature that lets police get video from Ring cameras" | Start with the PROBLEM and STAKES: "Evidence used in criminal cases requires..." |
| Không đề cập đến privacy | Privacy-first là điểm ĐÁNG TỰ HÀO nhất — nhấn mạnh nhiều lần |
| Kể hackathon như "chúng tôi thắng" | Kể TẠI SAO AI cho law enforcement yêu cầu reliability, không phải impressiveness |
| Không giải thích chain-of-custody | Đây là điểm khác biệt hoàn toàn với product bình thường — phải giải thích |
| "Tôi lead team" mà không nói cụ thể | Liệt kê: system design, RFC, sprint execution, code review, cross-functional |
| Nói về tech stack quá sớm | PROBLEM → STAKES → APPROACH → TECH → RESULT |
| Không mention IACP hoặc CEO roundtable | Đây là external validation — quan trọng nhất của hackathon story |

---

## 📊 Số liệu và facts nhanh cần nhớ

```
AXON COMMUNITY REQUEST:
  - Team size: 5 engineers (you as tech lead)
  - Live product: axon.com/products/community-request/ring
  - Rollout: Ring Neighbors-Verified agencies across the United States
  - Privacy incidents post-launch: 0
  - Critical security findings in Amazon/Ring review: 0
  - Nature: publicly announced, company-level partnership milestone

AI CRASH DIAGRAMMING:
  - Context: Axon company-wide Gen-AI hackathon
  - Timeline: 48 hours
  - Outcome 1: Selected by CEO roundtable
  - Outcome 2: Top-3 customer favourite at IACP
  - IACP context: largest law enforcement conference in the US
  - Key insight: AI for parsing + deterministic rendering (not generative image)
  - Business value: 20-40 minutes saved per crash diagram
  - Multiplied: hundreds of crashes/month per agency

DOMAIN VOCABULARY TO USE NATURALLY:
  chain-of-custody, Axon Evidence, Ring Neighbors-Verified, IACP,
  privacy-preserving, immutable audit trail, informed consent,
  courtroom-admissible, CJIS compliance, inadmissible evidence,
  law enforcement agency, verified agency, evidence pipeline
```

---

## 💬 Câu hỏi nên hỏi interviewer sau khi kể những stories này

1. "How does your team handle compliance or regulatory requirements in the product development process — is that embedded in engineering or handled separately?"
2. "Have you worked with cross-company API partnerships before? What was the biggest challenge in those relationships?"
3. "What is the most domain-specific problem your engineering team has had to develop expertise in?"
4. "How does your team evaluate Gen-AI features for production readiness — what bar do you hold them to?"

---

*Document last updated: June 2026 · Axon / Ring Partnership interview preparation*
