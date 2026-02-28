# OpenAI Tech Screen — Deep Dive

> 📅 2026-02-14 · ⏱ 22 phút đọc
>
> ChatGPT Playground System Design (RADIO Format),
> Model Selection, DB Schema, API Design,
> Real-time Updates, Concurrent Updates,
> Streaming Chat Interface, Typewriter Effect,
> Multiple Concurrent Requests
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | OpenAI Frontend Tech Screen

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Tổng quan quy trình phỏng vấn           |
| 2   | RADIO Format — System Design Framework  |
| 3   | ChatGPT Playground — High Level Design  |
| 4   | Tech Stack & DB Schema                  |
| 5   | API Design                              |
| 6   | Real-time Update Implementations        |
| 7   | Component Tree & Text Editor UI         |
| 8   | Concurrent Updates                      |
| 9   | Coding: Streaming Chat Interface        |
| 10  | Follow-up: Multiple Concurrent Requests |
| 11  | Follow-up: Typewriter Effect            |
| 12  | CSS: Match Exact Layout                 |
| 13  | Tóm tắt phỏng vấn                       |

---

## §1. Tổng quan quy trình phỏng vấn

```
OPENAI TECH SCREEN — FORMAT:
═══════════════════════════════════════════════════════════════

  Loop: FRONTEND (có thể chọn FE hoặc Full-Stack!)

  ① SYSTEM DESIGN:
  → "Design a ChatGPT Playground"
  → Internal tool cho team!
  → Chọn model, edit parameters, chat, save/share/load presets!
  → Format: RADIO (Requirements, Architecture, Data, Interface, Optimizations!)
  → Topics: high-level design, tech stack, DB schemas, API design,
    real-time updates, component tree, text editor, concurrent updates!

  ② CODING:
  → Build ChatGPT interface: submit prompt → display response!
  → Được cho SẴN function stream response (chunks!)
  → Follow-ups:
    • Style chính xác theo video! (CSS!)
    • Handle MULTIPLE requests while another is in-progress!
    • Typewriter effect (hiện từng ký tự!)
```

---

## §2. RADIO Format — System Design Framework

```
RADIO — FRAMEWORK CHO FE SYSTEM DESIGN:
═══════════════════════════════════════════════════════════════

  R — REQUIREMENTS:
  → Functional: user CAN DO gì?
  → Non-functional: performance, scalability, security!
  → Constraints: internal tool? Public? Scale?

  A — ARCHITECTURE:
  → High-level components diagram!
  → Client-server separation!
  → Key modules & data flow!

  D — DATA MODEL:
  → DB schemas!
  → State management (client-side!)
  → API contracts!

  I — INTERFACE (API + UI):
  → API endpoints!
  → Component tree!
  → UI interactions!

  O — OPTIMIZATIONS:
  → Performance!
  → Scalability!
  → Edge cases!
  → Tradeoffs!
```

---

## §3. ChatGPT Playground — High Level Design

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  FUNCTIONAL:
  ┌────────────────────────────────────────────────────────┐
  │ ① SELECT MODEL: GPT-4, GPT-4-turbo, GPT-3.5, etc.    │
  │ ② EDIT PARAMETERS:                                    │
  │   → temperature (0-2), max_tokens, top_p              │
  │   → stop sequences, frequency_penalty, presence_penalty│
  │   → system prompt!                                     │
  │ ③ CHAT: send messages, receive streaming responses!    │
  │ ④ SAVE PRESET: lưu config (model + params + system!)  │
  │ ⑤ LOAD PRESET: load config đã lưu!                    │
  │ ⑥ SHARE PRESET: chia sẻ link cho teammates!           │
  └────────────────────────────────────────────────────────┘

  NON-FUNCTIONAL:
  → Internal tool (KHÔNG public!) → auth = internal SSO!
  → Low latency: streaming response!
  → Collaboration: share presets giữa team members!
  → Persistence: conversations & presets lưu lâu dài!
```

```
HIGH-LEVEL ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────┐      ┌──────────────┐      ┌────────────┐
  │   React     │ ←──→ │   Backend    │ ←──→ │  Database  │
  │   Frontend  │ SSE  │   (Node.js)  │      │ (Postgres) │
  └─────┬───────┘      └──────┬───────┘      └────────────┘
        │                      │
        │                      ▼
        │               ┌──────────────┐
        │               │  OpenAI API  │
        │               │  (GPT-4...)  │
        │               └──────────────┘
        │
        ▼
  ┌─────────────┐
  │  Auth (SSO) │   Internal tool → corporate SSO!
  └─────────────┘

  DATA FLOW:
  1. User chọn model + params + gõ message!
  2. Frontend → POST /api/chat (với preset config!)
  3. Backend → call OpenAI API (stream: true!)
  4. OpenAI streams chunks → Backend → SSE → Frontend!
  5. Frontend hiển thị từng chunk real-time!
```

---

## §4. Tech Stack & DB Schema

```
TECH STACK:
═══════════════════════════════════════════════════════════════

  FRONTEND:
  → React + TypeScript!
  → State: Zustand hoặc React Context (internal tool = đơn giản!)
  → Styling: CSS Modules hoặc Tailwind!
  → Markdown rendering: react-markdown + remark-gfm!
  → Code highlighting: Prism.js hoặc highlight.js!
  → Text editor: CodeMirror hoặc Monaco (cho system prompt!)

  BACKEND:
  → Node.js + Express (hoặc Next.js API routes!)
  → OpenAI SDK (openai npm package!)
  → SSE cho streaming!
  → Auth: internal SSO middleware!

  DATABASE:
  → PostgreSQL (relational → presets, conversations, messages!)
  → Redis: session cache, rate limiting!
```

```sql
-- ═══ DB SCHEMA ═══

-- Users (từ SSO!):
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Presets (model + parameters!):
CREATE TABLE presets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    model           VARCHAR(50) NOT NULL,       -- 'gpt-4', 'gpt-3.5-turbo'
    temperature     DECIMAL(3,2) DEFAULT 0.7,
    max_tokens      INTEGER DEFAULT 2048,
    top_p           DECIMAL(3,2) DEFAULT 1.0,
    frequency_penalty DECIMAL(3,2) DEFAULT 0,
    presence_penalty  DECIMAL(3,2) DEFAULT 0,
    system_prompt   TEXT,
    stop_sequences  TEXT[],                     -- Array of strings!
    is_shared       BOOLEAN DEFAULT FALSE,
    share_token     VARCHAR(64) UNIQUE,         -- URL token for sharing!
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Conversations:
CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    preset_id   UUID REFERENCES presets(id),
    title       VARCHAR(255),                   -- Auto-generated from first message!
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Messages:
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,        -- 'user' | 'assistant' | 'system'
    content         TEXT NOT NULL,
    token_count     INTEGER,                     -- Track usage!
    model_used      VARCHAR(50),                 -- Which model responded
    latency_ms      INTEGER,                     -- Response time!
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes:
CREATE INDEX idx_presets_user ON presets(user_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_presets_share_token ON presets(share_token);
```

---

## §5. API Design

```
API ENDPOINTS:
═══════════════════════════════════════════════════════════════

  ── CHAT ──
  POST   /api/chat
  → Body: { conversationId, message, presetId }
  → Response: SSE stream! (text/event-stream!)

  ── CONVERSATIONS ──
  GET    /api/conversations              (list all!)
  GET    /api/conversations/:id          (get with messages!)
  POST   /api/conversations              (create new!)
  DELETE /api/conversations/:id          (delete!)

  ── PRESETS ──
  GET    /api/presets                     (list user's presets!)
  GET    /api/presets/:id                 (get one!)
  POST   /api/presets                     (create!)
  PUT    /api/presets/:id                 (update!)
  DELETE /api/presets/:id                 (delete!)
  POST   /api/presets/:id/share           (generate share link!)
  GET    /api/shared/:token              (load shared preset!)

  ── MODELS ──
  GET    /api/models                      (list available models!)
```

```typescript
// ═══ API TYPES ═══

interface ChatRequest {
  conversationId: string;
  message: string;
  preset: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    systemPrompt?: string;
    stopSequences?: string[];
  };
}

// SSE response format:
// data: {"type":"chunk","content":"Hello"}
// data: {"type":"chunk","content":" world"}
// data: {"type":"done","tokenCount":15,"latencyMs":234}
// data: [DONE]

interface Preset {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
  stopSequences?: string[];
  isShared: boolean;
  shareUrl?: string;
}
```

```typescript
// ═══ BACKEND — SSE STREAMING ENDPOINT ═══

app.post("/api/chat", async (req, res) => {
  const { conversationId, message, preset } = req.body;

  // SSE headers:
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Save user message:
    await db.messages.create({
      conversationId,
      role: "user",
      content: message,
    });

    // Call OpenAI API:
    const stream = await openai.chat.completions.create({
      model: preset.model,
      messages: [
        ...(preset.systemPrompt
          ? [{ role: "system", content: preset.systemPrompt }]
          : []),
        // Previous messages...
        { role: "user", content: message },
      ],
      temperature: preset.temperature,
      max_tokens: preset.maxTokens,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ type: "chunk", content })}\n\n`);
      }
    }

    // Save assistant message:
    await db.messages.create({
      conversationId,
      role: "assistant",
      content: fullResponse,
      modelUsed: preset.model,
    });

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`,
    );
    res.end();
  }
});
```

---

## §6. Real-time Update Implementations

```
REAL-TIME UPDATES — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────┬──────────────┬────────────┐
  │              │ SSE          │ WebSocket    │ Long Poll  │
  ├──────────────┼──────────────┼──────────────┼────────────┤
  │ Direction    │ Server → FE  │ Bidirectional│ Server → FE│
  │ Protocol     │ HTTP/1.1     │ ws://        │ HTTP       │
  │ Connection   │ Persistent   │ Persistent   │ Repeated   │
  │ Reconnect    │ Auto!        │ Manual!      │ N/A        │
  │ Binary data  │ ❌           │ ✅           │ ❌         │
  │ Complexity   │ Thấp!        │ Trung bình!  │ Thấp!     │
  │ Scalability  │ Tốt!        │ Tốn memory!  │ Tốn conn!  │
  │ Use case     │ STREAMING!   │ Real-time    │ Fallback!  │
  │              │ ChatGPT!     │ chat, games! │            │
  └──────────────┴──────────────┴──────────────┴────────────┘

  CHO CHATGPT PLAYGROUND:
  ┌────────────────────────────────────────────────────────┐
  │ → SSE là BEST CHOICE! Tại sao?                        │
  │                                                        │
  │ ① Unidirectional: chỉ cần server → client!            │
  │   (User gửi message qua POST, không cần WS!)          │
  │                                                        │
  │ ② Auto-reconnect: EventSource tự reconnect!           │
  │                                                        │
  │ ③ HTTP-based: dễ deploy, CDN-friendly!                │
  │                                                        │
  │ ④ OpenAI API cũng dùng SSE!                           │
  │   → Backend proxy SSE từ OpenAI → Frontend!            │
  │                                                        │
  │ WHEN to use WebSocket instead:                         │
  │ → Real-time collaboration: 2+ users edit CÙNG LÚC!    │
  │ → Typing indicators, cursor positions!                 │
  │ → High-frequency bidirectional updates!                │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Component Tree & Text Editor UI

```
COMPONENT TREE:
═══════════════════════════════════════════════════════════════

  <App>
  ├── <AuthProvider>
  │   ├── <Sidebar>
  │   │   ├── <ConversationList>
  │   │   │   └── <ConversationItem>  ← click to load!
  │   │   ├── <NewChatButton>
  │   │   └── <PresetSelector>
  │   │       ├── <PresetDropdown>
  │   │       └── <PresetActions>  (save/share/load!)
  │   │
  │   └── <MainPanel>
  │       ├── <HeaderBar>
  │       │   ├── <ModelSelector>     ← dropdown GPT-4/3.5!
  │       │   └── <ParameterPanel>
  │       │       ├── <SliderControl>  (temperature!)
  │       │       ├── <NumberInput>    (max_tokens!)
  │       │       └── <TextArea>       (stop sequences!)
  │       │
  │       ├── <ChatArea>
  │       │   ├── <SystemPromptEditor>  ← CodeMirror/Monaco!
  │       │   ├── <MessageList>
  │       │   │   ├── <UserMessage>
  │       │   │   └── <AssistantMessage>
  │       │   │       ├── <MarkdownRenderer>
  │       │   │       ├── <CodeBlock>
  │       │   │       └── <StreamingCursor>  ← blinking cursor!
  │       │   └── <ScrollToBottom>
  │       │
  │       └── <InputArea>
  │           ├── <PromptTextarea>   ← auto-resize!
  │           ├── <SendButton>
  │           └── <StopButton>       ← abort streaming!
  │
  └── <ToastProvider>
```

```
TEXT EDITOR UI (SYSTEM PROMPT):
═══════════════════════════════════════════════════════════════

  ① CodeMirror 6:
  → Lightweight, modular, extensible!
  → Syntax highlighting cho prompt templates!
  → Line numbers, search/replace!
  → ✅ RECOMMENDED cho Playground!

  ② Monaco Editor:
  → VS Code engine! Full-featured!
  → Autocomplete, intellisense!
  → ❌ Heavy (2MB+)! Overkill cho system prompt!

  ③ Plain <textarea>:
  → Đơn giản nhất!
  → Auto-resize: adjust height to content!
  → ❌ Không syntax highlighting!
  → ✅ OK cho internal tool MVP!
```

---

## §8. Concurrent Updates

```
CONCURRENT UPDATES — VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Scenario: 2 users EDIT cùng 1 preset!
  → User A: thay đổi temperature = 0.9!
  → User B: thay đổi model = "gpt-4"!
  → Cả hai SAVE cùng lúc → AI OVERWRITES AI?

  GIẢI PHÁP:
  ┌────────────────────────────────────────────────────────┐
  │ ① LAST WRITE WINS (đơn giản nhất!):                   │
  │ → Ai save SAU = GHI ĐÈ!                              │
  │ → ✅ OK cho internal tool (ít conflict!)               │
  │ → ❌ Mất thay đổi của người khác!                     │
  ├────────────────────────────────────────────────────────┤
  │ ② OPTIMISTIC LOCKING (versioning!):                   │
  │ → Mỗi preset có "version" number!                     │
  │ → UPDATE ... WHERE version = X                         │
  │ → Nếu version KHÔNG KHỚP → CONFLICT! Thông báo user! │
  │ → ✅ RECOMMENDED cho Playground!                       │
  ├────────────────────────────────────────────────────────┤
  │ ③ CRDT / OT (collaborative editing!):                 │
  │ → Conflict-free Replicated Data Types!                 │
  │ → Operational Transform (Google Docs!)                 │
  │ → ❌ Quá phức tạp cho Playground!                     │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══ OPTIMISTIC LOCKING ═══

// DB: presets table có column "version"!

async function updatePreset(
  id: string,
  updates: Partial<Preset>,
  version: number,
) {
  const result = await db.query(
    `
        UPDATE presets 
        SET model = $1, temperature = $2, ..., version = version + 1, updated_at = NOW()
        WHERE id = $3 AND version = $4
        RETURNING *
    `,
    [updates.model, updates.temperature, id, version],
  );

  if (result.rowCount === 0) {
    // VERSION MISMATCH! Ai đó đã edit!
    throw new ConflictError(
      "Preset was modified by another user. Please reload.",
    );
  }

  return result.rows[0];
}

// Frontend:
try {
  await savePreset(preset.id, changes, preset.version);
} catch (err) {
  if (err.status === 409) {
    // Show dialog: "Preset changed! Reload or overwrite?"
    showConflictDialog({
      onReload: () => refetchPreset(),
      onOverwrite: () => forceSavePreset(),
    });
  }
}
```

---

## §9. Coding: Streaming Chat Interface

```jsx
// ═══ CODING ROUND — STREAMING CHAT INTERFACE ═══
// "Build a ChatGPT interface: submit prompt, display streaming response!"
// "They give you a function that streams response back in chunks!"

import { useState, useRef } from "react";

// Hàm được cho SẴN (simulates OpenAI streaming!):
// function streamResponse(prompt: string, onChunk: (text: string) => void): Promise<void>

function ChatInterface() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    const userMessage = { role: "user", content: prompt };
    const assistantMessage = { role: "assistant", content: "" };

    // Thêm cả user + assistant (empty) message:
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setPrompt("");
    setIsStreaming(true);

    try {
      await streamResponse(prompt, (chunk) => {
        // Cập nhật message CUỐI CÙNG (assistant!):
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content + chunk,
          };
          return updated;
        });
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Error: " + error.message,
          isError: true,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="avatar">{msg.role === "user" ? "👤" : "🤖"}</div>
            <div className="content">
              {msg.content}
              {msg.role === "assistant" &&
                isStreaming &&
                i === messages.length - 1 && <span className="cursor">▌</span>}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-area">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Send a message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !prompt.trim()}>
          {isStreaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

---

## §10. Follow-up: Multiple Concurrent Requests

```
VẤN ĐỀ: MULTIPLE REQUESTS WHILE STREAMING:
═══════════════════════════════════════════════════════════════

  User gửi message 1 → streaming response...
  User gửi message 2 TRONG KHI message 1 đang stream!
  → PHẢI handle CẢ HAI! Không block!

  CÁCH TIẾP CẬN:
  → Mỗi message pair có RIÊNG streaming state!
  → Dùng MESSAGE ID để track!
  → KHÔNG dùng single isStreaming boolean!
```

```jsx
// ═══ MULTIPLE CONCURRENT REQUESTS ═══

import { useState, useRef, useCallback } from "react";

function ChatConcurrent() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const activeStreams = useRef(new Set()); // Track active streams!

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!prompt.trim()) return;

      const userMsg = { id: Date.now(), role: "user", content: prompt };
      const assistantId = Date.now() + 1;
      const assistantMsg = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setPrompt("");

      // Track stream:
      activeStreams.current.add(assistantId);

      try {
        await streamResponse(prompt, (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + chunk }
                : msg,
            ),
          );
        });
      } catch (error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: "Error: " + error.message, isError: true }
              : msg,
          ),
        );
      } finally {
        // Mark done:
        activeStreams.current.delete(assistantId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      }
    },
    [prompt],
  );

  const isAnyStreaming = messages.some((m) => m.isStreaming);

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="content">
              {msg.content}
              {msg.isStreaming && <span className="cursor">▌</span>}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Send a message..."
          // ⚠️ KHÔNG disable! Cho phép gửi khi đang stream!
        />
        <button type="submit" disabled={!prompt.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

// KEY DIFFERENCES:
// ① Mỗi message có RIÊNG id + isStreaming!
// ② Dùng msg.id để update ĐÚNG message!
// ③ Input KHÔNG bị disable khi streaming!
// ④ activeStreams ref track tất cả streams!
// ⑤ Nhiều streams chạy SONG SONG!
```

---

## §11. Follow-up: Typewriter Effect

```
TYPEWRITER EFFECT:
═══════════════════════════════════════════════════════════════

  Streaming trả về CHUNKS (VD: "Hello " + "world" + "!")
  Nhưng muốn hiện TỪNG KÝ TỰ một → smoother!

  CÁCH LÀM:
  → Nhận chunk → đẩy vào QUEUE!
  → setInterval: lấy 1 ký tự từ queue → hiển thị!
  → Tốc độ: 20-50ms / character!
```

```jsx
// ═══ TYPEWRITER EFFECT — IMPLEMENTATION ═══

import { useState, useRef, useEffect, useCallback } from "react";

function useTypewriter(speed = 30) {
  const [displayText, setDisplayText] = useState("");
  const queueRef = useRef(""); // Buffer chứa text CHƯA HIỂN THỊ!
  const intervalRef = useRef(null);
  const isTypingRef = useRef(false);

  // Thêm text vào queue:
  const enqueue = useCallback(
    (text) => {
      queueRef.current += text;

      // Bắt đầu typing nếu chưa chạy:
      if (!isTypingRef.current) {
        isTypingRef.current = true;

        intervalRef.current = setInterval(() => {
          if (queueRef.current.length === 0) {
            // Hết queue → dừng!
            clearInterval(intervalRef.current);
            isTypingRef.current = false;
            return;
          }

          // Lấy 1 ký tự từ queue:
          const char = queueRef.current[0];
          queueRef.current = queueRef.current.slice(1);
          setDisplayText((prev) => prev + char);
        }, speed);
      }
    },
    [speed],
  );

  // Reset:
  const reset = useCallback(() => {
    queueRef.current = "";
    setDisplayText("");
    if (intervalRef.current) clearInterval(intervalRef.current);
    isTypingRef.current = false;
  }, []);

  // Cleanup:
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { displayText, enqueue, reset, isTyping: isTypingRef.current };
}

// ═══ SỬ DỤNG TRONG CHAT ═══

function ChatWithTypewriter() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [streamingId, setStreamingId] = useState(null);
  const typewriter = useTypewriter(30); // 30ms/char

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMsg = { id: Date.now(), role: "user", content: prompt };
    const assistantId = Date.now() + 1;
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setStreamingId(assistantId);
    typewriter.reset();

    try {
      await streamResponse(prompt, (chunk) => {
        // Đẩy chunk vào typewriter queue:
        typewriter.enqueue(chunk);
      });
    } catch (error) {
      typewriter.enqueue("\n\nError: " + error.message);
    } finally {
      // Đợi typewriter hiển thị hết:
      const waitForTypewriter = () => {
        return new Promise((resolve) => {
          const check = setInterval(() => {
            if (typewriter.queueRef?.current?.length === 0) {
              clearInterval(check);
              resolve();
            }
          }, 100);
        });
      };

      // Lưu message hoàn chỉnh:
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: typewriter.displayText,
        },
      ]);
      setStreamingId(null);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {/* Currently typing message: */}
        {streamingId && (
          <div className="message assistant">
            {typewriter.displayText}
            <span className="cursor blink">▌</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Send a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

```
TYPEWRITER — ADVANCED OPTIONS:
═══════════════════════════════════════════════════════════════

  ① SPEED VARIATION (tự nhiên hơn!):
  → Mỗi ký tự: speed + random(0, speed/2)!
  → Sau dấu chấm: delay thêm 200ms!
  → → Giống người thật typing!

  ② requestAnimationFrame (SMOOTH!):
  → Thay vì setInterval → rAF!
  → Sync với browser paint cycle!
  → 60fps smooth!

  ③ BATCH CHARACTERS:
  → Thay vì 1 char/tick → 2-3 chars/tick!
  → Nhanh hơn, ít state updates hơn!
  → VD: nếu queue > 100 chars → batch 3 chars!
```

---

## §12. CSS: Match Exact Layout

```css
/* ═══ CSS — CHATGPT STYLE LAYOUT ═══ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Söhne", "Segoe UI", system-ui, sans-serif;
  background: #343541;
  color: #ececf1;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 768px;
  margin: 0 auto; /* CENTER! */
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.message {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  max-width: 768px;
  margin: 0 auto;
  line-height: 1.6;
}

.message.user {
  background: transparent;
}

.message.assistant {
  background: #444654;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.message.user .avatar {
  background: #5436da;
}
.message.assistant .avatar {
  background: #19c37d;
}

.content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

/* INPUT AREA — BOTTOM! */
.input-area {
  padding: 16px 24px 24px;
  max-width: 768px;
  width: 100%;
  margin: 0 auto;
}

.input-area form {
  position: relative;
  display: flex;
  align-items: flex-end;
  background: #40414f;
  border: 1px solid #565869;
  border-radius: 12px;
  padding: 8px 12px;
}

.input-area textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ececf1;
  font-size: 16px;
  resize: none;
  max-height: 200px;
  line-height: 1.5;
  font-family: inherit;
}

.input-area button {
  background: #19c37d;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  color: white;
  cursor: pointer;
  margin-left: 8px;
  flex-shrink: 0;
}

.input-area button:disabled {
  background: #565869;
  cursor: not-allowed;
}

/* BLINKING CURSOR */
.cursor {
  display: inline;
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* SCROLLBAR */
.messages::-webkit-scrollbar {
  width: 8px;
}
.messages::-webkit-scrollbar-thumb {
  background: #565869;
  border-radius: 4px;
}
```

---

## §13. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Design ChatGPT Playground?"
  A: RADIO format! React + Node + Postgres.
  SSE streaming (unidirectional, auto-reconnect!).
  Presets = model + params + system prompt, shareable via token.
  Optimistic locking cho concurrent edits!

  Q: "DB Schema?"
  A: users, presets (model, temp, max_tokens, share_token),
  conversations, messages (role, content, token_count).
  Indexes on user_id, conversation_id, share_token!

  Q: "Real-time updates?"
  A: SSE cho streaming (OpenAI cũng dùng!).
  WebSocket nếu cần bidirectional (collaboration).
  Tradeoff: SSE = simple + auto-reconnect, WS = complex + features!

  Q: "Streaming chat code?"
  A: streamResponse(prompt, onChunk callback).
  onChunk: append chunk vào LAST message (functional setState!).
  Blinking cursor khi streaming!

  Q: "Multiple concurrent requests?"
  A: Mỗi message có RIÊNG id + isStreaming.
  Dùng id để update ĐÚNG message.
  Input KHÔNG disable khi streaming! Set() track active streams!

  Q: "Typewriter effect?"
  A: onChunk → đẩy vào QUEUE.
  setInterval: lấy 1 char từ queue → display.
  Speed variation + batch chars khi queue dài!
```

---

### Checklist

- [ ] **RADIO format**: R(requirements) A(architecture) D(data) I(interface) O(optimizations)!
- [ ] **Architecture**: React + Node + Postgres + SSE; OpenAI API proxy qua backend!
- [ ] **DB Schema**: users, presets (share_token!), conversations, messages (role + content + tokens)!
- [ ] **API**: POST /chat (SSE stream!), CRUD presets, CRUD conversations, GET /shared/:token!
- [ ] **Real-time**: SSE = best cho streaming (unidirectional, auto-reconnect!); WS cho collaboration!
- [ ] **Component Tree**: Sidebar (conversations + presets) + MainPanel (model + params + chat + input)!
- [ ] **Text Editor**: CodeMirror 6 (lightweight) > Monaco (heavy) > textarea (simple)!
- [ ] **Concurrent Updates**: Optimistic locking (version column + WHERE version = X)!
- [ ] **Streaming Code**: streamResponse callback → append chunk to last message; blinking cursor!
- [ ] **Multiple Requests**: Mỗi message riêng id + isStreaming; update bằng id; input không disable!
- [ ] **Typewriter**: Queue buffer + setInterval 30ms/char; speed variation; batch khi queue dài!
- [ ] **CSS**: max-width 768px center, dark theme #343541, flex column, auto-resize textarea!

---

_Nguồn: Reddit — OpenAI Frontend tech screen experience_
_Cập nhật lần cuối: Tháng 2, 2026_
