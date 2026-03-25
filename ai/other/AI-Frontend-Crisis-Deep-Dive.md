# Interviewer Hỏi Về AI — Khủng Hoảng Frontend Đã Đến?

> 📅 2025-09-10 · ⏱ 5 phút đọc
>
> Gần đây, phỏng vấn frontend 2025 luôn xuất hiện chuỗi câu hỏi: "Bạn có dùng AI programming không?", "Dùng ở đâu? Giải quyết vấn đề gì?", "Dùng tool nào? Model nào?"
> Nếu ấp úng hoặc nói "chưa dùng nhiều" — biểu cảm interviewer sẽ trở nên... tinh tế 😏

---

## TL;DR

```
AI & FRONTEND — TÓM TẮT:
═══════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  AI SẼ KHÔNG thay thế Frontend Engineer                │
  │  NHƯNG SẼ thay thế những engineer làm việc             │
  │  ở mức CƠ HỌC (mechanical stage)                      │
  │                                                        │
  │  AI = "INTERN RẤT GIỎI" — bạn là SENIOR chỉ đạo     │
  │                                                        │
  │  Interviewer hỏi AI để kiểm tra:                       │
  │  ① Efficiency & Learning ability                       │
  │  ② Depth of understanding (copy-paste hay review?)    │
  │  ③ Self-positioning (core value có replaceable?)       │
  │                                                        │
  │  MCP = AI kết nối EXTERNAL WORLD (data, API, tools)   │
  │  Skill = AI biết CÁCH LÀM (rules, style, workflow)   │
  │  → Hai thứ BỔ SUNG nhau, không thay thế nhau         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## Phần I — Interviewer Hỏi Về AI

### §1. Interviewer Thực Sự Đang Đánh Giá Gì?

Họ **không quan tâm** bạn dùng model nào. Họ đang kiểm tra **3 điều**:

```
3 ĐIỀU INTERVIEWER MUỐN BIẾT:
═══════════════════════════════════════════════════════════

  ① EFFICIENCY & LEARNING ABILITY
  ┌────────────────────────────────────────────────────────┐
  │  "Bạn có phải developer của NĂM 2025 không?"         │
  │                                                        │
  │  AI tools = đòn bẩy hiệu suất (efficiency lever)     │
  │  → Nếu hoàn toàn không dùng → learning ability ???   │
  │  → Willingness to embrace new tools ???                │
  └────────────────────────────────────────────────────────┘

  ② DEPTH OF UNDERSTANDING
  ┌────────────────────────────────────────────────────────┐
  │  "Bạn COPY-PASTE hay REVIEW + REFACTOR + TEST?"       │
  │                                                        │
  │  Câu hỏi thực sự: BẠN dùng tool, hay TOOL dùng BẠN? │
  │  → Code quality awareness                              │
  │  → Engineering rigor                                    │
  │  → Critical thinking about generated code              │
  └────────────────────────────────────────────────────────┘

  ③ SELF-POSITIONING
  ┌────────────────────────────────────────────────────────┐
  │  "Core value của bạn có dễ bị AI thay thế không?"     │
  │                                                        │
  │  ❌ "AI giúp tôi viết business logic"                 │
  │  → Bạn vừa nói core work đang bị AUTOMATED!           │
  │                                                        │
  │  ✅ "AI giúp tôi tiết kiệm thời gian ở repetitive    │
  │       tasks, để tôi focus vào ARCHITECTURE + DESIGN"  │
  │  → Core value nằm ở chỗ AI KHÔNG LÀM ĐƯỢC            │
  └────────────────────────────────────────────────────────┘
```

---

### §2. Cách Trả Lời Hay — AI Như Intern Giỏi

Tư duy cốt lõi: Coi AI là **intern rất capable** — bạn là **senior** chỉ đạo.

```
MẪU TRẢ LỜI:
═══════════════════════════════════════════════════════════

  Q: "Bạn dùng AI ở đâu?"

  A: "Tôi dùng NHIỀU, chủ yếu ở những quy trình
      NON-CORE giúp tăng HIỆU SUẤT ĐÁNG KỂ:"

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① BOILERPLATE CODE — Generate khung 80 điểm          │
  │  ┌────────────────────────────────────────────────────┐│
  │  │ "Viết React Hook mới? Tôi nói với Copilot:        ││
  │  │  'Write me a useClickOutside Hook in TypeScript'   ││
  │  │  → Code framework 80 điểm trong 10 giây           ││
  │  │  → Tôi chỉ cần STRENGTHEN: edge cases, cleanup    ││
  │  │  → Tiết kiệm ít nhất 10 phút so với từ đầu"      ││
  │  └────────────────────────────────────────────────────┘│
  │                                                        │
  │  ② CODE EXPLANATION — Đọc code người khác             │
  │  ┌────────────────────────────────────────────────────┐│
  │  │ "Gặp code không comment, không hiểu (garbage 🤯)  ││
  │  │  → Không Google nữa, SELECT code → hỏi AI:        ││
  │  │  'Explain what this does? Any optimization?'       ││
  │  │  → Nhanh hơn BẤT KỲ document nào"                 ││
  │  └────────────────────────────────────────────────────┘│
  │                                                        │
  │  ③ REGEX & COMPLEX PATTERNS                            │
  │  ┌────────────────────────────────────────────────────┐│
  │  │ "Viết regex phức tạp? AI sinh ra + GIẢI THÍCH     ││
  │  │  từng phần → tôi HIỂU rồi mới dùng"              ││
  │  └────────────────────────────────────────────────────┘│
  │                                                        │
  └────────────────────────────────────────────────────────┘

  Q: "Giải quyết vấn đề gì?"

  A: "Core problem: GIẢI PHÓNG năng lượng khỏi
      repetitive + memorization-based tasks
      → FOCUS vào creative + structural work"
```

### Ví dụ code — AI-generated useClickOutside

```typescript
// Copilot sinh ra framework này — 80 điểm
import { useEffect, useRef } from "react";

function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
  // ⚠️ Senior review: ref không cần trong deps (stable ref)
  // ⚠️ callback cần useCallback ở caller side hoặc dùng ref pattern

  return ref;
}
```

> **Key insight**: AI giỏi sinh code **"đúng cú pháp"** nhưng thường thiếu **edge cases**, **performance considerations**, và **architectural fit**. Đó là chỗ senior engineer tạo giá trị.

---

### §3. Khủng Hoảng Thực Sự Là Gì?

```
AI THAY THẾ AI — NHƯNG KHÔNG THAY THẾ TƯ DUY:
═══════════════════════════════════════════════════════════

  ❌ AI SẼ thay thế:
  ┌────────────────────────────────────────────────────────┐
  │  → Viết boilerplate code                               │
  │  → Tạo UI từ design mockup                            │
  │  → Implement simple logic                              │
  │  → Code mà CHỈ CẦN DOCUMENTATION là viết được        │
  │                                                        │
  │  ⚠️ Nếu daily work CHỈ LÀ 3 thứ trên → CRISIS!     │
  └────────────────────────────────────────────────────────┘

  ✅ AI KHÔNG THỂ thay thế:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① HỌP + ARGUE với PM                                 │
  │  → Biến requirement MƠ HỒ → technical solution RÕ   │
  │                                                        │
  │  ② ARCHITECTURAL DESIGN                                │
  │  → Tech stack nào? Module chia sao? Scalability?      │
  │                                                        │
  │  ③ PERFORMANCE OPTIMIZATION                            │
  │  → DevTools, flame graph, tìm BOTTLENECK gây lag     │
  │                                                        │
  │  ④ COMPLEX BUG HANDLING                                │
  │  → Bug chỉ xảy ra trên Android cụ thể do rendering  │
  │    engine differences                                  │
  │                                                        │
  │  ⑤ CODE REVIEW                                         │
  │  → Hiểu DESIGN PRINCIPLES đằng sau code đồng nghiệp │
  │  → Đưa constructive feedback                          │
  │                                                        │
  │  ⑥ INTERVIEW 🤭                                       │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  KẾT LUẬN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  AI ÉP chúng ta chuyển focus:                          │
  │                                                        │
  │    CODE IMPLEMENTATION → CODE DESIGN + THINKING       │
  │                                                        │
  │  Frontend TƯƠNG LAI = Frontend THÀNH THẠO AI          │
  │  Đừng lo bị thay thế → HÃY MASTER cheat code này    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## Phần II — Agent Skill vs MCP

### §4. Agent Skill — Là Gì?

```
AGENT SKILL — PROMPT ENGINEERING HÓA:
═══════════════════════════════════════════════════════════

  VẤN ĐỀ: Không có Skill, AI sinh code luôn là:
  ┌────────────────────────────────────────────────────────┐
  │  → Gradient xanh-tím quen thuộc                       │
  │  → Layout nghìn-lẻ-một-kiểu giống nhau               │
  │  → "AI aesthetic" rõ ràng                              │
  └────────────────────────────────────────────────────────┘

  GIẢI PHÁP: Agent Skill = CẤU HÌNH SẴN:
  ┌────────────────────────────────────────────────────────┐
  │  /frontend-ui-skill/                                   │
  │  ├── metadata.json    ← mô tả skill                   │
  │  ├── instructions.md  ← hướng dẫn chi tiết           │
  │  ├── style-guide.md   ← design system                 │
  │  └── examples/        ← ví dụ tham khảo              │
  │                                                        │
  │  Agent đọc skill → áp dụng RULES khi sinh code       │
  │  → Kết quả NHẤT QUÁN, đúng CHUẨN team                │
  └────────────────────────────────────────────────────────┘

  BẢN CHẤT: Skill = Prompt ĐÓNG GÓI thành folder
  → AI đọc THEO NHU CẦU (on-demand loading)
  → Quy trình hơn, linh hoạt hơn pure prompt
```

Skill load qua **3 tầng**:

```
SKILL LOADING — 3 TẦNG:
═══════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │  Tầng 1: METADATA        → Luôn load (nhẹ)           │
  │  Tầng 2: CORE INSTRUCTIONS → Load theo nhu cầu       │
  │  Tầng 3: SUPPORT FILES    → Load theo nhu cầu        │
  │                                                        │
  │  → Tiết kiệm context window                           │
  │  → Agent chỉ đọc CẦN GÌ đọc NẤY                    │
  └────────────────────────────────────────────────────────┘
```

---

### §5. MCP — Model Context Protocol

```
MCP — KẾT NỐI AI VỚI THẾ GIỚI BÊN NGOÀI:
═══════════════════════════════════════════════════════════

  3 thành phần cốt lõi:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① TOOLS (công cụ)                                    │
  │  → Functions mà AI có thể GỌI                        │
  │  → Ví dụ: getUsers(), searchDB(), sendEmail()        │
  │                                                        │
  │  ② RESOURCES (tài nguyên)                              │
  │  → Data sources mà AI có thể ĐỌC                     │
  │  → Ví dụ: database, file system, API responses       │
  │                                                        │
  │  ③ PROMPTS (gợi ý)                                    │
  │  → Structured prompts cho specific tasks              │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  KIẾN TRÚC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Planner / System Prompt                               │
  │  → Quyết định "LÀM GÌ"                               │
  │         │                                              │
  │         ▼                                              │
  │  Function Calling                                      │
  │  → Biểu đạt "GỌI TOOL NÀO"                           │
  │         │                                              │
  │         ▼                                              │
  │  MCP Protocol                                          │
  │  → Quy chuẩn "TOOL TỪ ĐÂU, PHÁT HIỆN SAO,          │
  │     GỌI THẾ NÀO"                                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  ⚠️ LƯU Ý:
  → MCP KHÔNG cung cấp reasoning ability
  → Chỉ giải quyết CONNECTION + COMMUNICATION standards
  → Dùng tool đúng hay sai vẫn phụ thuộc MODEL + AGENT
```

---

### §6. MCP vs Skill — So Sánh Trực Tiếp

```
MCP vs SKILL — BẢNG SO SÁNH:
═══════════════════════════════════════════════════════════

  Anthropic nói:
  "MCP connects Claude to external services and data."
  "Skills provide procedural knowledge — HOW to do tasks."

  → MCP: AI LẤY ĐƯỢC data
  → Skill: AI BIẾT CÁCH xử lý data

  ┌───────────────┬────────────────────┬──────────────────┐
  │               │ MCP                │ Skill            │
  ├───────────────┼────────────────────┼──────────────────┤
  │ Vai trò       │ INTEGRATION layer  │ KNOWLEDGE layer  │
  ├───────────────┼────────────────────┼──────────────────┤
  │ Làm gì        │ Kết nối external   │ Dạy cách làm    │
  │               │ world (API, DB,    │ (rules, style,   │
  │               │ file system)       │ workflow)        │
  ├───────────────┼────────────────────┼──────────────────┤
  │ Bản chất      │ Protocol chuẩn hóa │ Prompt đóng gói │
  │               │ tool discovery +   │ thành folder     │
  │               │ invocation         │ + on-demand load │
  ├───────────────┼────────────────────┼──────────────────┤
  │ Khi nào dùng  │ Fetch data         │ Nội quy team    │
  │               │ Gọi API            │ Code/design style│
  │               │ Thao tác system    │ Quy trình chuẩn │
  ├───────────────┼────────────────────┼──────────────────┤
  │ Ví dụ         │ getUsers()         │ "Tất cả page    │
  │               │ searchDB()         │  dùng card layout│
  │               │ readFile()         │  + neutral color"│
  └───────────────┴────────────────────┴──────────────────┘

  QUAN HỆ: BỔ SUNG, không thay thế!
```

---

### §7. Thực Chiến — Cùng 1 Yêu Cầu, 4 Cách Tiếp Cận

Yêu cầu: _"Từ API lấy user data, sinh trang user list."_

```
4 CÁCH TIẾP CẬN:
═══════════════════════════════════════════════════════════

  ① CHỈ PROMPT (one-shot):
  ┌────────────────────────────────────────────────────────┐
  │  "Từ api.xxx.com/users lấy data, dùng Vue3 sinh     │
  │   trang user list phong cách đơn giản"                │
  │                                                        │
  │  → Mỗi lần phải VIẾT LẠI                             │
  │  → Output KHÔNG ỔN ĐỊNH (style khác nhau mỗi lần)   │
  │  → Phù hợp: yêu cầu MỘT LẦN                        │
  └────────────────────────────────────────────────────────┘

  ② CHỈ SKILL:
  ┌────────────────────────────────────────────────────────┐
  │  Skill folder chứa: instructions.md + style-guide.md  │
  │  → "Mọi page dùng: light background, neutral color,  │
  │     card layout, Vue3 + Composition API"              │
  │                                                        │
  │  Bạn chỉ cần nói: "Sinh trang user list"             │
  │  → AI TỰ ĐỘNG áp dụng rules                          │
  │  → Output NHẤT QUÁN                                    │
  │  → Phù hợp: chuẩn hóa OUTPUT                         │
  └────────────────────────────────────────────────────────┘

  ③ CHỈ MCP:
  ┌────────────────────────────────────────────────────────┐
  │  MCP expose tool: getUsers()                           │
  │  Bạn nói: "Gọi getUsers"                              │
  │  → AI lấy DATA THẬT qua MCP                          │
  │  → Phù hợp: kết nối EXTERNAL DATA                    │
  └────────────────────────────────────────────────────────┘

  ④ MCP + SKILL KẾT HỢP ⭐⭐⭐:
  ┌────────────────────────────────────────────────────────┐
  │  Bạn nói: "Sinh trang user list"                       │
  │                                                        │
  │  AI tự động:                                           │
  │  ① MCP → gọi getUsers() → lấy DATA THẬT            │
  │  ② Skill → áp dụng RULES (layout, color, framework) │
  │  ③ Generate → CODE đúng chuẩn + data thật           │
  │                                                        │
  │  → LẤY data + ÁP chuẩn + SINH code                  │
  │  → Một câu lệnh xong tất cả!                         │
  └────────────────────────────────────────────────────────┘
```

---

### §8. Bản Chất Chung

```
MỤC TIÊU CHUNG CỦA MCP, PROMPT, SKILL:
═══════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Giảm MODEL HALLUCINATION                              │
  │  Tăng STABILITY + CONSISTENCY                          │
  │  Tăng EFFICIENCY                                       │
  │                                                        │
  │  NHƯNG:                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ⚠️ KHÔNG THỂ loại bỏ hoàn toàn hallucination   │  │
  │  │  ⚠️ Chỉ GIẢM xác suất sai + TĂNG nhất quán     │  │
  │  │  ⚠️ Hoàn toàn TỰ ĐỘNG mà không human review     │  │
  │  │     → VẪN KHÔNG ĐÁ TIN CẬY trong production      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ĐỊNH VỊ ĐÚNG:                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  AI tools = KHUẾCH ĐẠI năng lực engineer         │  │
  │  │           ≠ THAY THẾ engineer                     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Câu Hỏi Phỏng Vấn

### Q1: Bạn dùng AI programming ở đâu? Giải quyết vấn đề gì?

> **Trả lời mẫu:** Tôi dùng AI chủ yếu ở các **non-core processes**: sinh boilerplate code (hooks, components skeleton), giải thích code legacy không comment, viết regex/pattern phức tạp, và suggest test cases. Core problem nó giải quyết là **giải phóng năng lượng khỏi repetitive tasks** để tôi focus vào architecture, performance optimization, và code review — những thứ AI chưa làm tốt.

### Q2: Bạn handle AI-generated code thế nào? Copy-paste hay có quy trình?

> Tôi coi code AI sinh ra như code từ **intern giỏi** — framework 80 điểm nhưng thiếu edge cases, performance considerations, và architectural fit. Quy trình: **review → refactor → test**. Ví dụ, AI sinh `useClickOutside` hook nhưng đặt `ref` trong useEffect deps (không cần) và không handle `callback` stability — tôi phải fix những vấn đề này.

### Q3: Frontend có bị AI thay thế không?

> AI sẽ thay thế engineer làm việc ở **mechanical stage** — chỉ viết boilerplate, implement từ mockup, logic đơn giản. Nhưng AI **không thể**: biến requirement mơ hồ thành technical solution, design architecture scalable, debug compatibility issue trên Android cụ thể, hay conduct meaningful code review. AI ép chúng ta shift focus từ **code implementation** sang **code design + thinking**.

### Q4: MCP là gì? Khác gì Skill?

> **MCP** (Model Context Protocol) chuẩn hóa cách AI kết nối với external world — tool discovery, invocation protocol, data fetching. Gồm Tools, Resources, Prompts. **Skill** là prompt đóng gói thành folder (metadata, instructions, style guide), dạy AI **cách làm** specific tasks. Quan hệ **bổ sung**: MCP cho AI lấy data, Skill dạy AI xử lý data. Kết hợp cả hai → AI vừa lấy data thật, vừa áp chuẩn team, sinh code nhất quán.

### Q5: Skill khác gì rules/prompt thông thường?

> Bản chất vẫn là prompt, nhưng **engineering hóa** hơn: đóng gói thành folder, load **on-demand** (3 tầng: metadata → core → support), Agent tự phát hiện và áp dụng. Rules/prompt phải viết lại mỗi lần, output không ổn định. Skill giúp **sedimentation** (lắng đọng) kinh nghiệm, quy chuẩn, cách làm → **tái sử dụng** cho cả team.

### Q6: MCP có phải là reasoning ability mới không?

> **Không.** MCP không cung cấp reasoning — nó giải quyết **connection + communication standards**. Planner layer quyết định "làm gì", Function Calling biểu đạt "gọi tool nào", MCP quy chuẩn "tool từ đâu, phát hiện sao, gọi thế nào". Dùng tool đúng hay sai **vẫn phụ thuộc model capability** và agent design.

### Q7: Hoàn toàn tự động hóa bằng AI có khả thi trong production không?

> **Chưa đáng tin cậy.** MCP, Prompt, Skill đều giảm hallucination nhưng **không loại bỏ hoàn toàn**. Chúng giảm xác suất sai, tăng nhất quán, nhưng quy trình hoàn toàn tự động mà không có **human review** vẫn rủi ro trong production. Định vị đúng: AI tools = **khuếch đại năng lực** engineer, không phải thay thế engineer.
