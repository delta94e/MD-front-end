# 🚀 Roadmap: AI Solution Engineer — Từ Zero đến Job-Ready

> Dựa trên JD: AI Solution Engineer | 65M–135M Gross | HCM/HN Hybrid

---

## 📋 Phân tích yêu cầu JD

| Yêu cầu | Mức độ | Thời gian ước tính |
|---|---|---|
| Python / Golang (5+ năm) | **Bắt buộc** | 6–12 tháng (intensive) |
| LLM, Prompt Engineering, RAG | **Core** | 2–3 tháng |
| LangChain / LlamaIndex / AI Agent frameworks | **Core** | 2–3 tháng |
| Tích hợp AI/ML vào production | **Senior** | 3–6 tháng (qua projects) |
| Tiếng Anh giao tiếp | **Bắt buộc** | Song song |

> [!IMPORTANT]
> JD yêu cầu **2+ năm AI Engineer**. Nếu bắt đầu từ zero, cần **12–18 tháng học chuyên sâu + làm projects** để có portfolio đủ mạnh. Roadmap dưới đây tối ưu cho tốc độ nhanh nhất.

---

## Phase 1: Nền tảng Python (2–3 tháng)

> 🎯 Mục tiêu: Viết Python thành thạo, hiểu OOP, async, và ecosystem

### 1.1 Python Core (Tháng 1)

```
Tuần 1-2: Python cơ bản
  □ Syntax, data types, control flow
  □ Functions, *args/**kwargs, decorators
  □ List comprehension, generators
  □ File I/O, exception handling
  📚 Tài liệu: "Python Crash Course" hoặc CS50P (Harvard, free)

Tuần 3-4: Python nâng cao
  □ OOP: classes, inheritance, dunder methods
  □ Modules, packages, virtual environments (venv, poetry)
  □ Type hints (quan trọng cho AI code!)
  □ Async/await basics (cần cho API calls)
  📚 Tài liệu: "Fluent Python" chương chọn lọc
```

### 1.2 Python cho Data & API (Tháng 2)

```
Tuần 5-6: Thư viện quan trọng
  □ requests / httpx — gọi API
  □ FastAPI — xây REST API (QUAN TRỌNG cho production!)
  □ pydantic — data validation (dùng NHIỀU trong LangChain)
  □ dotenv — quản lý secrets/API keys

Tuần 7-8: Data basics
  □ JSON, YAML handling
  □ SQLite / PostgreSQL basics
  □ pandas cơ bản (đọc/xử lý data)
  □ Docker basics (deploy AI services)
  📚 Project: Xây 1 REST API bằng FastAPI + database
```

### 1.3 Golang cơ bản (Tháng 3 — tùy chọn)

```
⚠️ JD ghi "Python / Golang" — tức HOẶC, không bắt buộc cả 2
→ Ưu tiên Python TRƯỚC! Golang học SAU nếu cần.

Nếu muốn học:
  □ Go Tour (tour.golang.org) — 1 tuần
  □ Goroutines, channels — concurrency
  □ Go cho microservices
  📚 "Learning Go" by Jon Bodner
```

---

## Phase 2: AI/ML Foundations (1–2 tháng)

> 🎯 Mục tiêu: Hiểu AI/ML đủ sâu để DÙNG (không cần train model từ đầu)

### 2.1 AI/ML Concepts (2 tuần)

```
⚠️ AI Solution Engineer ≠ ML Researcher!
→ Bạn KHÔNG cần biết toán deep learning sâu
→ Bạn CẦN hiểu: AI hoạt động thế nào, dùng thế nào, tích hợp thế nào

Tuần 1: Machine Learning overview
  □ Supervised vs Unsupervised vs Reinforcement Learning
  □ Classification, Regression — khái niệm
  □ Training, Inference — phân biệt
  □ Model, Parameters, Hyperparameters
  📚 Video: 3Blue1Brown "Neural Networks" (YouTube, free)
  📚 Course: Andrew Ng "AI For Everyone" (Coursera, free)

Tuần 2: Deep Learning & NLP overview
  □ Neural Networks — ý tưởng cơ bản
  □ Transformers architecture — QUAN TRỌNG! (nền tảng của LLM)
  □ Attention mechanism — "Attention is All You Need"
  □ Tokenization — cách text → numbers
  □ Embeddings — cách biểu diễn text bằng vectors
  📚 Video: "Illustrated Transformer" by Jay Alammar
  📚 Video: Andrej Karpathy "Let's build GPT" (YouTube)
```

### 2.2 Hiểu LLM (Large Language Model) (2 tuần)

```
Tuần 3: LLM là gì?
  □ GPT, Claude, Llama, Gemini — các model phổ biến
  □ Parameters (7B, 13B, 70B) — model size nghĩa là gì
  □ Context window — giới hạn input
  □ Temperature, top-p — thế nào là "sáng tạo" vs "chính xác"
  □ Tokens & pricing — tính chi phí API calls
  □ OpenAI API — gọi thử GPT-4 bằng Python
  📚 Docs: platform.openai.com

Tuần 4: Limitations & Solutions
  □ Hallucination — LLM bịa thông tin!
  □ Knowledge cutoff — không biết data mới
  □ Context window limit — không xử lý được doc dài
  → RAG giải quyết problems này! (Phase 3)
```

---

## Phase 3: Core Skills — RAG & Prompt Engineering (2–3 tháng)

> 🎯 Đây là PHẦN QUAN TRỌNG NHẤT — chiếm 70% công việc hàng ngày!

### 3.1 Prompt Engineering (2 tuần)

```
Tuần 1: Kỹ thuật Prompt cơ bản
  □ Zero-shot vs Few-shot prompting
  □ Chain of Thought (CoT) — "hãy suy nghĩ từng bước"
  □ Role prompting — "Bạn là expert về..."
  □ Output formatting — JSON mode, structured output
  □ System prompt vs User prompt
  📚 Course: "ChatGPT Prompt Engineering" (DeepLearning.AI, free)

Tuần 2: Prompt Engineering nâng cao
  □ Prompt templates — tái sử dụng prompts
  □ Prompt chaining — output bước 1 → input bước 2
  □ Self-consistency — đa số vote
  □ ReAct pattern — Reasoning + Acting
  □ Evaluation — đo chất lượng prompt
  📚 Tài liệu: promptingguide.ai
```

### 3.2 RAG — Retrieval-Augmented Generation (1 tháng) ⭐

```
⚠️ RAG = KỸ NĂNG QUAN TRỌNG NHẤT trong JD này!

  RAG giải quyết: "LLM không biết DATA CỦA CÔNG TY bạn"
  Ý tưởng: TÌM KIẾM tài liệu liên quan → ĐƯA VÀO prompt → LLM trả lời!

Tuần 1-2: RAG Pipeline
  □ Embeddings — biến text thành vector (OpenAI, Cohere, HuggingFace)
  □ Vector Database — lưu & tìm kiếm vectors
      → Chroma (dễ nhất, học trước)
      → Pinecone (cloud, production)
      → Weaviate, Qdrant, Milvus
  □ Chunking strategies — chia document thành đoạn nhỏ
      → Fixed size, sentence-based, semantic chunking
  □ Retrieval — similarity search, hybrid search (BM25 + vector)
  □ Generation — đưa context + query vào LLM

  📐 RAG Pipeline:
  ┌────────┐    ┌──────────┐    ┌────────────┐    ┌─────┐
  │ Docs   │ →  │ Chunk &  │ →  │ Vector DB  │ →  │ LLM │
  │ (PDF,  │    │ Embed    │    │ (search)   │    │     │
  │  web)  │    │          │    │            │    │     │
  └────────┘    └──────────┘    └────────────┘    └─────┘

Tuần 3-4: RAG nâng cao
  □ Multi-query retrieval — tạo nhiều câu hỏi để tìm tốt hơn
  □ Re-ranking — sắp xếp lại kết quả (Cohere, cross-encoder)
  □ Hybrid Search — kết hợp keyword + semantic
  □ Evaluation — đo chất lượng RAG (Ragas, TruLens)
  □ Parent-child chunking, metadata filtering
  📚 Project: Xây chatbot hỏi đáp trên tài liệu PDF công ty
```

### 3.3 LangChain & LlamaIndex (1 tháng) ⭐

```
⚠️ Đây là 2 framework CHÍNH trong JD!

Tuần 1-2: LangChain
  □ LangChain core: Chain, Prompt, LLM, Output Parser
  □ LCEL (LangChain Expression Language) — cách viết mới!
  □ Retrieval chains — RAG bằng LangChain
  □ Agent — LLM tự quyết định dùng tool nào
  □ Tools — search, calculator, code execution
  □ Memory — conversation history
  □ LangSmith — debug & monitor
  📚 Docs: python.langchain.com
  📚 Course: "LangChain for LLM Application Development" (DeepLearning.AI)

Tuần 3-4: LlamaIndex
  □ LlamaIndex core: Document, Node, Index
  □ Ingestion pipeline — load, parse, chunk, embed
  □ Query engine — retrieval + synthesis
  □ So sánh LangChain vs LlamaIndex:
      LangChain: framework TỔNG QUÁT (agents, chains, tools)
      LlamaIndex: CHUYÊN về DATA (RAG, knowledge base)
      → Production thường dùng CẢ HAI!
  📚 Docs: docs.llamaindex.ai
```

---

## Phase 4: AI Agents (1–2 tháng)

> 🎯 Mục tiêu: Xây AI Agent tự hành — xu hướng HOT nhất 2024-2025!

### 4.1 Agent Fundamentals (2 tuần)

```
Tuần 1: Agent là gì?
  □ Agent vs Chain — agent TỰ QUYẾT ĐỊNH, chain CỐ ĐỊNH
  □ ReAct pattern: Think → Act → Observe → repeat
  □ Tool calling / Function calling
  □ Planning — agent lên kế hoạch
  □ Multi-step reasoning

Tuần 2: Xây Agent
  □ LangChain Agents (OpenAI Functions Agent, ReAct Agent)
  □ LangGraph — agent phức tạp với state machine
  □ CrewAI — multi-agent collaboration
  □ AutoGen — Microsoft's multi-agent framework
  📚 Course: "Functions, Tools and Agents with LangChain" (DeepLearning.AI)
```

### 4.2 Advanced Agent Patterns (2 tuần)

```
  □ Multi-agent systems — nhiều agent phối hợp
  □ Human-in-the-loop — agent hỏi người khi không chắc
  □ Agent memory — long-term & short-term
  □ Guardrails — kiểm soát output agent
  □ Error handling & retry logic
  📚 Project: Customer support agent tự trả lời + escalate
```

---

## Phase 5: Production Integration (2–3 tháng)

> 🎯 Mục tiêu: Đưa AI từ notebook → production system

### 5.1 API & Deployment (1 tháng)

```
  □ FastAPI — serve AI models qua REST API
  □ Streaming responses — Server-Sent Events (SSE)
  □ Docker — containerize AI services
  □ Docker Compose — multi-service (API + Vector DB + Redis)
  □ Rate limiting, caching, error handling
  □ API key management, authentication
  📚 Project: Deploy RAG chatbot lên server thật
```

### 5.2 Monitoring & Observability (2 tuần)

```
  □ LangSmith / LangFuse — trace LLM calls
  □ Cost tracking — theo dõi chi phí API
  □ Latency monitoring — đo tốc độ response
  □ Quality metrics — đo chất lượng output
  □ Logging best practices cho AI systems
```

### 5.3 Advanced Production Patterns (2 tuần)

```
  □ Caching — tránh gọi LLM lặp lại (Redis)
  □ Fallback chains — model A fail → dùng model B
  □ Load balancing — nhiều LLM providers
  □ Fine-tuning basics — customize model cho use case cụ thể
  □ Evaluation pipeline — CI/CD cho AI (tự test chất lượng)
```

---

## 📅 Timeline tổng hợp

```
  Tháng 1-3:   Phase 1 — Python vững                    ████████░░░░
  Tháng 3-4:   Phase 2 — AI/ML concepts                 ░░░░████░░░░
  Tháng 4-7:   Phase 3 — RAG + LangChain ⭐              ░░░░░░████████
  Tháng 7-8:   Phase 4 — AI Agents                      ░░░░░░░░░░████
  Tháng 8-10:  Phase 5 — Production                     ░░░░░░░░░░░░████
  Tháng 10-12: Projects & Portfolio                      ░░░░░░░░░░░░░░████

  → 10-12 tháng full-time | 15-18 tháng part-time
```

---

## 🛠️ Portfolio Projects (song song với học)

> [!TIP]
> Có **3 projects chất lượng** > 10 projects sơ sài. Mỗi project nên có README, architecture diagram, và demo video.

### Project 1: RAG Chatbot (sau Phase 3)
```
Mô tả: Chatbot hỏi đáp trên tài liệu PDF/web
Stack:  Python + LangChain + ChromaDB + FastAPI
Demo:   Streamlit UI
Tại sao: Đây là USE CASE #1 của mọi công ty AI!
```

### Project 2: AI Agent (sau Phase 4)
```
Mô tả: Agent tự động research + viết báo cáo
Stack:  LangGraph + Tools (web search, code exec)
Demo:   CLI hoặc web UI
Tại sao: Thể hiện khả năng xây multi-step agent
```

### Project 3: Production-Ready AI API (sau Phase 5)
```
Mô tả: API service xử lý tài liệu doanh nghiệp
Stack:  FastAPI + Docker + Redis + Pinecone + monitoring
Demo:   Deployed trên cloud (AWS/GCP)
Tại sao: Thể hiện khả năng "tích hợp AI vào production"
```

---

## 📚 Tài nguyên học tập (nhiều cái FREE)

### Courses (Ưu tiên)
```
  🆓 DeepLearning.AI — "LangChain for LLM App Dev" (Andrew Ng + Harrison)
  🆓 DeepLearning.AI — "ChatGPT Prompt Engineering"
  🆓 DeepLearning.AI — "Building Systems with ChatGPT API"
  🆓 CS50P — Harvard's Python course
  💰 Udemy — "LangChain: Develop AI Apps with Generative AI"
```

### Docs (Đọc hàng ngày)
```
  📖 python.langchain.com — LangChain docs
  📖 docs.llamaindex.ai — LlamaIndex docs
  📖 platform.openai.com/docs — OpenAI API
  📖 promptingguide.ai — Prompt Engineering guide
```

### YouTube (Xem khi rảnh)
```
  🎥 Andrej Karpathy — "Let's Build GPT", "Intro to LLMs"
  🎥 3Blue1Brown — "Neural Networks" series
  🎥 FreeCodeCamp — "LangChain Crash Course"
  🎥 James Briggs — RAG tutorials
```

### Communities
```
  💬 Discord: LangChain, LlamaIndex, Hugging Face
  💬 Reddit: r/LocalLLaMA, r/MachineLearning
  💬 Twitter/X: follow AI builders
```

---

## ⚠️ Lưu ý thực tế

> [!CAUTION]
> JD yêu cầu **5+ năm Python** và **2+ năm AI Engineer**. Nếu bạn start from zero:
>
> **Chiến lược 1 — Dài hạn (khuyên):** Học 12-18 tháng, apply vị trí **Junior AI Engineer** trước (50-80M), rồi lên Senior.
>
> **Chiến lược 2 — Tắt:** Nếu bạn đã có kinh nghiệm lập trình backend (Java, JS...), chuyển sang Python nhanh (1-2 tháng), focus Phase 3-5. Apply trong 6-8 tháng.
>
> **Field đang hot:** AI Engineer đang thiếu người NGHIÊM TRỌNG. Nhiều công ty chấp nhận candidate ít năm hơn nếu portfolio mạnh!
