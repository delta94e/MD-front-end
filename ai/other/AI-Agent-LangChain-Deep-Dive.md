# AI Agent & LangChain (Frontend Perspective) — Deep Dive

> 📅 2026-02-12 · ⏱ 15 phút đọc
>
> 5 chủ đề: AI Agent components (LLM + Memory + Planning + Tools),
> LangChain unified API (TypeScript), 4 scenarios (Pure Prompt,
> Agent + Function Call, RAG, Fine-tuning), LLM limitations &
> solutions, Visualization platforms vs Code.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: AI / Frontend

---

## Mục Lục

0. [AI Agent vs Traditional App](#0-ai-agent-vs-traditional-app)
1. [AI Agent — 4 Components](#1-ai-agent-components)
2. [LangChain — Unified AI Framework](#2-langchain)
3. [LLM Limitations & Solutions](#3-llm-limitations)
4. [4 Scenarios — AI Agent Development](#4-bốn-scenarios)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt)

---

## 0. AI Agent vs Traditional App

```
TRADITIONAL APP vs AI AGENT:
═══════════════════════════════════════════════════════════════

  TRADITIONAL CHATBOT:
  ┌─────────────────────────────────────────────────────────┐
  │ Core = Backend logic + Database + API                   │
  │ → Rules-based, if/else, keyword matching               │
  │ → Developer viết TẤT CẢ logic xử lý                   │
  │ → Scale khó: mỗi scenario mới = code mới              │
  └─────────────────────────────────────────────────────────┘

  AI AGENT CHATBOT:
  ┌─────────────────────────────────────────────────────────┐
  │ Core = LLM (Large Language Model) drives the program   │
  │ → LLM hiểu intent, reasoning, decision-making         │
  │ → Developer thiết kế prompts, tools, memory            │
  │ → LLM tự quyết định gọi tool nào, trả lời gì         │
  └─────────────────────────────────────────────────────────┘

  → AI đã THAY ĐỔI mô hình phát triển ứng dụng truyền thống!
    LLM trở thành "động cơ" của chương trình.
```

---

## 1. AI Agent Components

### Công thức kinh điển

```
AI AGENT = LLM (🧠 Bộ não)
         + Memory (📝 Bộ nhớ)
         + Planning (📋 Quy hoạch)
         + Tools (🔧 Công cụ)
```

### 4 Components chi tiết

```
4 COMPONENTS:
═══════════════════════════════════════════════════════════════

  🧠 LLM (Large Language Model) — "Bộ não"
  ┌─────────────────────────────────────────────────────────┐
  │ → Engine chính của Agent                                │
  │ → Hiểu intent, reasoning, analysis, decision-making    │
  │ → Mọi logic phức tạp và ngôn ngữ tự nhiên đều do LLM  │
  │ → VD: GPT-4, Claude, Gemini, DeepSeek, Llama          │
  └─────────────────────────────────────────────────────────┘

  📋 Planning — "Khung tư duy"
  ┌─────────────────────────────────────────────────────────┐
  │ → Phân tách task phức tạp thành các bước thực hiện     │
  │ → VD: "Lên kế hoạch du lịch"                          │
  │   1. Check thời tiết                                   │
  │   2. Tìm khách sạn                                    │
  │   3. Tìm điểm tham quan                               │
  │   4. Lên lịch trình                                   │
  │ → Đây là KEY cho tính tự chủ (autonomy) của Agent     │
  └─────────────────────────────────────────────────────────┘

  📝 Memory — "Sổ ghi chú"
  ┌─────────────────────────────────────────────────────────┐
  │ → Nhớ lịch sử tương tác trước đó                      │
  │ → Lưu kết quả trung gian của task                     │
  │ → Nhớ thành công/thất bại trong quá khứ               │
  │ → Giữ coherence trong multi-turn dialog                │
  │ → KHÔNG "bộ nhớ cá vàng 7 giây"!                      │
  │                                                         │
  │ Types:                                                  │
  │   Short-term: conversation context (window)            │
  │   Long-term: vector DB, persistent storage             │
  └─────────────────────────────────────────────────────────┘

  🔧 Tools — "Đôi tay"
  ┌─────────────────────────────────────────────────────────┐
  │ → Cầu nối Agent ↔ thế giới thực                       │
  │ → API calls (weather, stock, booking)                  │
  │ → Database queries                                      │
  │ → Web search                                            │
  │ → MCP Server (Model Context Protocol)                  │
  │ → File read/write                                       │
  │ → Code execution                                        │
  └─────────────────────────────────────────────────────────┘
```

### Agent Decision Loop

```
AGENT DECISION LOOP:
═══════════════════════════════════════════════════════════════

  User: "Thời tiết ngày mai ở Hà Nội?"

  ┌──────────────────────────┐
  │ 🧠 LLM Phân tích        │
  │ "User cần thông tin      │
  │  thời tiết real-time"    │
  └───────────┬──────────────┘
              ↓
  ┌──────────────────────────┐
  │ 📋 Planning              │
  │ 1. Gọi Weather API      │
  │ 2. Format kết quả       │
  │ 3. Trả lời user         │
  └───────────┬──────────────┘
              ↓
  ┌──────────────────────────┐
  │ 🔧 Tool: Weather API    │
  │ → getWeather("Hanoi")   │
  │ → Return: "Nắng, 25°C" │
  └───────────┬──────────────┘
              ↓
  ┌──────────────────────────┐
  │ 🧠 LLM Tổng hợp        │
  │ "Ngày mai Hà Nội nắng,  │
  │  nhiệt độ khoảng 25°C"  │
  └──────────────────────────┘
```

---

## 2. LangChain

### LangChain = Lang + Chain

```
LANGCHAIN — TÊN GỌI:
  Lang  = Language Model (LLM)
  Chain = Kết nối như chuỗi (chained calls)

  → Kết nối khả năng LLM vào ứng dụng thực tế
    qua kiến trúc chuỗi (chain architecture)
```

### Tại sao cần LangChain?

```
KHÔNG CÓ LANGCHAIN — Gọi từng model riêng biệt:
═══════════════════════════════════════════════════════════════

  ❌ Mỗi model = SDK riêng, API riêng, format riêng
```

```javascript
// ❌ OpenAI SDK riêng
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: "your-key" });
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ],
  temperature: 0.7,
});

// ❌ Claude SDK riêng, API KHÁC
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: "your-key" });
// Format hoàn toàn khác OpenAI...
```

```
CÓ LANGCHAIN — Unified API:
═══════════════════════════════════════════════════════════════

  ✅ Mọi model = CÙNG interface, CÙNG cách gọi
```

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import "dotenv/config";

// ✅ CÙNG interface!
const openai_llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY,
});

const claude_llm = new ChatAnthropic({
  modelName: "claude-3-opus-20240229",
  temperature: 0.7,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ✅ GỌI HOÀN TOÀN GIỐNG NHAU!
const response1 = await openai_llm.invoke("Xin chào");
const response2 = await claude_llm.invoke("Hello");

console.log("GPT-4:", response1.content);
console.log("Claude:", response2.content);
```

### LangChain gọi DeepSeek

```javascript
// LangChain + DeepSeek (qua OpenAI-compatible API)
// Packages: @langchain/core, @langchain/openai

import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  model: "deepseek-chat",
  temperature: 0,
  apiKey: "sk-xx",
  configuration: {
    baseURL: "https://api.deepseek.com", // Custom endpoint
  },
});

const response = await llm.invoke([
  { role: "user", content: "I love programming." },
]);
console.log("response:", response);
```

### LangChain — Frontend-Friendly

```
FRONTEND DEVELOPER — TIN VUI:
═══════════════════════════════════════════════════════════════

  ✅ LangChain natively supports TypeScript!
  ✅ Dùng JS/TS quen thuộc để build AI applications
  ✅ NPM packages: @langchain/core, @langchain/openai, etc.
  ✅ Ecosystem: LangGraph, LangSmith, LangServe

  Tương đương framework trong các ngôn ngữ khác:
  ┌────────────┬────────────────────────────────┐
  │ Java       │ Spring                         │
  │ Go         │ Gin                            │
  │ Python     │ Django / Flask                 │
  │ AI (JS/TS) │ LangChain ← ĐÂY!             │
  │ AI (Python)│ LangChain (Python version)     │
  └────────────┴────────────────────────────────┘
```

---

## 3. LLM Limitations

### 4 hạn chế của LLM

```
LLM LIMITATIONS:
═══════════════════════════════════════════════════════════════

  ① THÔNG TIN LỖI THỜI
     User: "Thời tiết Hà Nội hôm nay?"
     LLM:  "Tôi không biết vì training data
            kết thúc tại ngày X"
     → LLM không có real-time data!

  ② KHÔNG KẾT NỐI INTERNET
     User: "Giá cổ phiếu Tesla hiện tại?"
     LLM:  Không thể truy cập internet real-time
     → Cần tool bổ sung!

  ③ KHÔNG BIẾT PRIVATE KNOWLEDGE
     User: "Chính sách giá sản phẩm công ty chúng ta?"
     LLM:  Chưa bao giờ đọc tài liệu nội bộ của bạn
     → Cần RAG hoặc fine-tuning!

  ④ KHÔNG GỌI ĐƯỢC EXTERNAL SERVICES
     User: "Đặt vé máy bay đi Đà Nẵng ngày mai"
     LLM:  Không có khả năng đặt vé
     → Cần Function Call / Tool integration!
```

### LangChain giải quyết thế nào?

```
SOLUTION MATRIX:
  ┌──────────────────┬──────────────────┬──────────────────┐
  │ Hạn chế LLM      │ LangChain giải   │ Ứng dụng thực   │
  │                  │ quyết            │ tế               │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Thông tin lỗi    │ Real-time data   │ Tin tức, cổ      │
  │ thời             │ retrieval tools  │ phiếu, thời tiết │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Không internet   │ Internet search  │ Tin mới nhất,    │
  │                  │ tools            │ data real-time   │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Không biết       │ Document loading │ Knowledge base   │
  │ private data     │ + Vector search  │ nội bộ, Q&A     │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Không gọi API    │ Tool call        │ Đặt vé, thanh   │
  │                  │ integration      │ toán, tra cứu    │
  └──────────────────┴──────────────────┴──────────────────┘

  SUPPORTED MODELS:
  ✅ OpenAI GPT series
  ✅ Anthropic Claude series
  ✅ Google Gemini
  ✅ Open source: Llama, Qwen, DeepSeek, Mistral...
  → Cách gọi THỐNG NHẤT, dễ dàng switch / dùng nhiều models!
```

---

## 4. Bốn Scenarios

### Scenario 1: Pure Prompt

```
PURE PROMPT — Đơn giản nhất:
═══════════════════════════════════════════════════════════════

  User ──[Prompt]──→ LLM ──[Response]──→ User

  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐
  │ 👤 User  │───→│ 🧠 LLM          │───→│ 📄 Response  │
  │ "Viết bài│    │ GPT-4/Claude/... │    │ AI trả lời   │
  │  thơ..."  │    │                  │    │ trực tiếp    │
  └──────────┘    └──────────────────┘    └──────────────┘

  Đặc điểm:
  → Không tools, không memory, không planning
  → Input → Output trực tiếp
  → Giống dùng ChatGPT thường
```

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

// Direct call — pure prompt
const response = await llm.invoke("Viết một bài thơ về mùa xuân");
console.log(response.content);
```

### Scenario 2: Agent + Function Call

```
AGENT + FUNCTION CALL:
═══════════════════════════════════════════════════════════════

  User: "Thời tiết ngày mai ở TP.HCM?"

  ┌──────────────────────────────────────────────────────┐
  │              INTELLIGENT DECISION LOOP               │
  │                                                      │
  │  ┌────────────────────┐                              │
  │  │ 🧠 Agent phân tích │                              │
  │  │ "User cần weather  │                              │
  │  │  real-time data"   │                              │
  │  └─────────┬──────────┘                              │
  │            ↓                                          │
  │  ┌────────────────────┐                              │
  │  │ 📋 Lên kế hoạch   │                              │
  │  │ 1. Gọi Weather API│                              │
  │  │ 2. Format kết quả │                              │
  │  └─────────┬──────────┘                              │
  │            ↓                                          │
  │  ┌────────────────────┐    ┌─────────────────┐      │
  │  │ 🔧 Function Call   │───→│ 🌤 Weather API  │      │
  │  │ getWeather("HCMC") │←───│ Return: 32°C ☀️ │      │
  │  └─────────┬──────────┘    └─────────────────┘      │
  │            ↓                                          │
  │  ┌────────────────────┐                              │
  │  │ 📝 Tổng hợp & trả │                              │
  │  │ lời user           │                              │
  │  └────────────────────┘                              │
  └──────────────────────────────────────────────────────┘

  KEY POINT:
  → AI KHÔNG biết thời tiết
  → AI GỌI function do developer viết sẵn
  → AI nhận kết quả → format → trả lời user
  → LLM QUYẾT ĐỊNH gọi tool nào (không phải developer)
```

### Scenario 3: RAG (Retrieval-Augmented Generation)

```
RAG FLOW:
═══════════════════════════════════════════════════════════════

  PHASE 1 — CHUẨN BỊ (Offline, 1 lần):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  📄 Company Documents                                  │
  │     ↓                                                  │
  │  ✂️ Document Splitting (chunk 500-1000 tokens)         │
  │     ↓                                                  │
  │  🔢 Embedding (text → vector numbers)                  │
  │     ↓                                                  │
  │  💾 Vector Database (Pinecone, Chroma, Weaviate...)    │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  PHASE 2 — QUERY (Online, mỗi lần user hỏi):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  👤 User: "Chính sách nghỉ phép công ty?"             │
  │     ↓                                                  │
  │  🔍 Vector Search (similarity search)                  │
  │     → Tìm documents liên quan                         │
  │     → "nghỉ-phép.docx", "sổ-tay-NV.pdf"             │
  │     ↓                                                  │
  │  ✨ AUGMENTED PROMPT:                                   │
  │     Original question + Retrieved documents            │
  │     "Dựa vào tài liệu sau: [nghỉ phép 12 ngày/năm]  │
  │      hãy trả lời: chính sách nghỉ phép công ty?"     │
  │     ↓                                                  │
  │  🧠 LLM trả lời DỰA TRÊN documents                   │
  │     → Chính xác, có nguồn, không hallucinate          │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  KEY CONCEPTS:
  ┌──────────────┬─────────────────────────────────────┐
  │ Embedding    │ Chuyển text thành vector số         │
  │              │ (mảng số thực, VD: [0.1, 0.8, ...])│
  │              │ → Texts giống nhau → vectors gần    │
  ├──────────────┼─────────────────────────────────────┤
  │ Vector DB    │ Lưu trữ vectors, tìm kiếm theo     │
  │              │ similarity (cosine distance)        │
  ├──────────────┼─────────────────────────────────────┤
  │ Retrieval    │ Tìm documents LIÊN QUAN đến query  │
  ├──────────────┼─────────────────────────────────────┤
  │ Augmentation │ GẮN documents vào prompt            │
  ├──────────────┼─────────────────────────────────────┤
  │ Generation   │ LLM sinh câu trả lời dựa trên     │
  │              │ documents + question                │
  └──────────────┴─────────────────────────────────────┘
```

### Scenario 4: Fine-tuning

```
FINE-TUNING vs RAG:
═══════════════════════════════════════════════════════════════

  RAG:
  ┌────────────────────────────────────────────────────────┐
  │ → MỖI LẦN hỏi → tìm tài liệu → gắn vào prompt     │
  │ → LLM GỐC không thay đổi                             │
  │ → Giống "mang sách tham khảo vào phòng thi"          │
  └────────────────────────────────────────────────────────┘

  FINE-TUNING:
  ┌────────────────────────────────────────────────────────┐
  │ → Lấy data → TRAIN thẳng vào LLM                     │
  │ → LLM HỌC và NHỚ domain knowledge                    │
  │ → Giống "ôn thi kỹ, kiến thức đã vào đầu"           │
  │ → Không cần search mỗi lần hỏi nữa!                  │
  └────────────────────────────────────────────────────────┘

  FINE-TUNING FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  📊 Domain Data (company docs, FAQ, etc.)              │
  │     ↓                                                  │
  │  📝 Format Processing (JSONL, Q&A pairs)               │
  │     ↓                                                  │
  │  📦 Training Dataset                                   │
  │     ↓                                                  │
  │  🏋️ Fine-tune Training                                │
  │     Base model (GPT-4/Llama) + LoRA adapter           │
  │     ↓                                                  │
  │  📊 Evaluation & Validation                            │
  │     ↓                                                  │
  │  🎯 Specialized Model (domain-specific knowledge)      │
  │     → Trả lời chuyên gia KHÔNG cần RAG!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### So sánh 4 Scenarios

```
4 SCENARIOS — COMPARISON:
  ┌──────────────┬────────┬──────────┬────────┬──────────┐
  │              │ Pure   │ Agent +  │ RAG    │ Fine-    │
  │              │ Prompt │ Func Call│        │ tuning   │
  ├──────────────┼────────┼──────────┼────────┼──────────┤
  │ Complexity   │ ⭐      │ ⭐⭐⭐     │ ⭐⭐⭐    │ ⭐⭐⭐⭐⭐  │
  ├──────────────┼────────┼──────────┼────────┼──────────┤
  │ Real-time    │ ❌      │ ✅       │ ❌     │ ❌       │
  │ data         │        │          │        │          │
  ├──────────────┼────────┼──────────┼────────┼──────────┤
  │ Private      │ ❌      │ ❌       │ ✅     │ ✅       │
  │ knowledge    │        │          │        │          │
  ├──────────────┼────────┼──────────┼────────┼──────────┤
  │ External     │ ❌      │ ✅       │ ❌     │ ❌       │
  │ services     │        │          │        │          │
  ├──────────────┼────────┼──────────┼────────┼──────────┤
  │ Cost         │ Thấp   │ Trung    │ Trung  │ Cao      │
  │              │        │ bình     │ bình   │          │
  ├──────────────┼────────┼──────────┼────────┼──────────┤
  │ Use case     │ Q&A    │ Weather, │ KBase, │ Domain   │
  │              │ đơn    │ booking, │ docs   │ expert   │
  │              │ giản   │ search   │ Q&A    │ model    │
  └──────────────┴────────┴──────────┴────────┴──────────┘
```

### Visualization Platforms vs Code

```
COZE/DIFY vs LANGCHAIN:
═══════════════════════════════════════════════════════════════

  COZE / DIFY (Drag-and-drop):
  ┌──────────────────────────────────────────────────────┐
  │ ✅ Nhanh, không cần code                             │
  │ ✅ Prototype nhanh                                   │
  │ ✅ Phù hợp scenario đơn giản                        │
  │                                                      │
  │ ❌ Giới hạn customization                            │
  │ ❌ Logic phức tạp khó implement                     │
  │ ❌ Khó integrate vào hệ thống có sẵn               │
  │ ❌ Performance & scalability hạn chế                │
  └──────────────────────────────────────────────────────┘

  LANGCHAIN (Code):
  ┌──────────────────────────────────────────────────────┐
  │ ✅ Full customization                                │
  │ ✅ Complex logic, multi-step chains                  │
  │ ✅ Integrate vào hệ thống production                │
  │ ✅ Performance control, scalable                     │
  │ ✅ TypeScript native — frontend-friendly!            │
  │                                                      │
  │ ❌ Learning curve                                    │
  │ ❌ Cần coding skills                                │
  └──────────────────────────────────────────────────────┘

  → Giống low-code vs code trong frontend:
    Simple project → low-code OK
    Complex production app → cần framework (LangChain)!
```

---

## 5. Tóm Tắt

### Quick Reference

```
AI AGENT & LANGCHAIN — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  AI AGENT:
    Formula       → LLM + Memory + Planning + Tools
    LLM           → Brain (GPT-4, Claude, Gemini...)
    Planning      → Task decomposition, step-by-step
    Memory        → Short-term (context) + Long-term (vector DB)
    Tools         → API calls, search, DB, MCP Server

  LANGCHAIN:
    Lang + Chain  → Language Model + Chained Calls
    Core value    → Unified API cho mọi LLM
    TypeScript    → Native support, frontend-friendly
    Packages      → @langchain/core, @langchain/openai, etc.

  4 SCENARIOS:
    Pure Prompt   → Input → LLM → Output (đơn giản nhất)
    Function Call → LLM quyết định gọi tool nào
    RAG           → Retrieve docs → Augment prompt → Generate
    Fine-tuning   → Train domain data vào LLM

  LLM LIMITATIONS:
    Outdated      → Real-time tools
    No internet   → Search tools
    No private    → RAG / Fine-tuning
    No API call   → Function Call / Tool integration
```

### Câu Hỏi Phỏng Vấn

**1. AI Agent là gì? Gồm những thành phần nào?**

> AI Agent là thực thể thông minh có khả năng **tự quy hoạch, ra quyết định và thực thi**. Công thức kinh điển: **LLM (bộ não)** hiểu intent và reasoning + **Planning (quy hoạch)** phân tách task phức tạp + **Memory (bộ nhớ)** giữ context multi-turn + **Tools (công cụ)** gọi API, search, truy xuất DB. LLM là "động cơ" drive toàn bộ chương trình, thay đổi mô hình phát triển truyền thống.

**2. LangChain là gì? Tại sao Frontend Developer nên biết?**

> LangChain = **Lang**(uage Model) + **Chain**(ed calls). Framework **thống nhất API** cho mọi LLM (GPT, Claude, Gemini, DeepSeek...) — gọi model nào cũng cùng interface `.invoke()`. LangChain **natively support TypeScript** → frontend dev dùng JS/TS quen thuộc để build AI apps. Giống Spring cho Java, Gin cho Go — LangChain là framework chuẩn cho AI development.

**3. RAG là gì? Khác Fine-tuning thế nào?**

> **RAG** (Retrieval-Augmented Generation): mỗi lần user hỏi → **vector search** tìm docs liên quan → **gắn vào prompt** → LLM trả lời dựa trên docs. LLM gốc KHÔNG thay đổi. Giống "mang sách vào phòng thi". **Fine-tuning**: lấy domain data **train thẳng** vào LLM → model HỌC và NHỚ → không cần search nữa. Giống "đã ôn kỹ, kiến thức vào đầu". RAG: cost thấp, data cập nhật dễ. Fine-tuning: cost cao, performance tốt hơn cho domain cụ thể.

**4. Function Call / Tool Use hoạt động thế nào?**

> LLM **không tự gọi API** — developer định nghĩa sẵn tools (weather, booking, search...). Khi user hỏi, LLM **phân tích intent** → **quyết định gọi tool nào** → return function name + params → backend execute function → return result → LLM **format và trả lời** user. KEY: LLM chỉ "ra lệnh", developer code tool thực thi.

**5. Visualization platforms (Coze/Dify) vs LangChain?**

> Visualization: **nhanh, no-code** nhưng **giới hạn customization**, complex logic khó, integrate production khó. LangChain: **full control**, complex chains, production-grade, TypeScript native nhưng cần coding. Giống low-code vs code trong frontend: simple → visualization OK; complex production → cần LangChain.

**6. Embedding và Vector Database là gì?**

> **Embedding**: chuyển text thành **mảng số thực** (vector, VD: [0.1, 0.8, ...]). Texts có nghĩa **giống nhau** → vectors **gần nhau** trong không gian. **Vector DB** (Pinecone, Chroma, Weaviate): lưu vectors, tìm kiếm theo **cosine similarity** → tìm documents liên quan đến query. Đây là core tech của RAG.

---

## Checklist Học Tập

- [ ] AI Agent = LLM + Memory + Planning + Tools
- [ ] LLM = "bộ não", Planning = "khung tư duy"
- [ ] Memory: short-term (context) + long-term (vector DB)
- [ ] Tools: API calls, search, DB, MCP Server
- [ ] LangChain = Lang(uage Model) + Chain(ed calls)
- [ ] LangChain unified API: .invoke() cho mọi model
- [ ] LangChain natively supports TypeScript
- [ ] LLM limitation: outdated, no internet, no private data, no API
- [ ] Pure Prompt: simplest, input → LLM → output
- [ ] Agent + Function Call: LLM quyết định gọi tool nào
- [ ] RAG: Retrieve → Augment prompt → Generate answer
- [ ] Embedding: text → vector numbers (similarity search)
- [ ] Vector DB: Pinecone, Chroma, Weaviate (cosine similarity)
- [ ] Fine-tuning: train domain data vào LLM (không cần RAG)
- [ ] RAG vs Fine-tuning: "mang sách vào thi" vs "đã ôn kỹ"
- [ ] Visualization (Coze/Dify) vs Code (LangChain)

---

_Cập nhật lần cuối: Tháng 2, 2026_
