# UI Components Deep Dive — Phần 6: GPT Chat Interface & Infinite Canvas

> 📅 2026-03-09 · ⏱ 50 phút đọc
>
> Chủ đề: Tự viết từ đầu — GPT Chat Interface & Infinite Figma-like Canvas
> Version: Vanilla JavaScript + React + Web Component
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component       | Vanilla JS | React | Advanced | Web Component |
| --- | --------------- | ---------- | ----- | -------- | ------------- |
| 19  | GPT Chat        | §19.1      | §19.2 | §19.3    | §19.4         |
| 20  | Infinite Canvas | §20.1      | §20.2 | §20.3    | §20.4         |

---

# 💬 Component 19: GPT Chat Interface

## Kiến Trúc GPT Chat

```
GPT CHAT INTERFACE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────┐
  │ 🤖 AI Assistant                      [New] │
  ├─────────────────────────────────────────────┤
  │                                             │
  │  ┌────────────────────────────────┐         │
  │  │ 👤 Explain recursion to me     │         │  ← User message
  │  └────────────────────────────────┘         │
  │                                             │
  │         ┌────────────────────────────────┐  │
  │         │ 🤖 Recursion is when a        │  │  ← AI message
  │         │ function calls itself...▌      │  │  ← Typing indicator
  │         └────────────────────────────────┘  │
  │                                             │
  ├─────────────────────────────────────────────┤
  │  ┌──────────────────────────────┐  [Send]  │
  │  │ Type a message...            │          │  ← Input
  │  └──────────────────────────────┘          │
  └─────────────────────────────────────────────┘

  Key Concepts:
  • Streaming response (character-by-character!)
  • Message history management
  • Auto-scroll to bottom
  • Markdown rendering in messages
  • Loading/typing indicator
  • Conversation persistence (localStorage)
```

---

## §19.1 GPT Chat — Vanilla JavaScript

```css
.chat {
  max-width: 700px;
  font-family: system-ui;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;
}
.chat-header {
  padding: 16px;
  background: #1a1a2e;
  color: #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f7fafc;
}
.chat-msg {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.5;
  font-size: 14px;
  word-wrap: break-word;
}
.chat-msg.user {
  align-self: flex-end;
  background: #3182ce;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.chat-msg.ai {
  align-self: flex-start;
  background: #fff;
  color: #2d3748;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
}
.chat-msg.ai code {
  background: #f7fafc;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}
.chat-msg.ai pre {
  background: #1a1a2e;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}
.chat-msg.ai pre code {
  background: none;
  color: inherit;
}
.chat-typing {
  display: flex;
  gap: 4px;
  padding: 12px;
}
.chat-typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a0aec0;
  animation: bounce 1.4s infinite;
}
.chat-typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.chat-typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}
.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}
.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
}
.chat-input:focus {
  border-color: #3182ce;
}
.chat-send {
  padding: 12px 24px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
}
.chat-send:hover {
  background: #2b6cb0;
}
.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

````javascript
// ═══ Vanilla JS GPT Chat ═══

class ChatInterface {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.apiUrl = options.apiUrl || "/api/chat";
    this.systemPrompt = options.systemPrompt || "You are a helpful assistant.";
    this.storageKey = options.storageKey || "chat-history";
    this.messages = [];
    this._isStreaming = false;
    this._render();
    this._loadHistory();
  }

  _render() {
    this.container.className = "chat";
    this.container.innerHTML = `
      <div class="chat-header">
        <span>🤖 AI Assistant</span>
        <button style="background:none;border:1px solid #4a5568;color:#e2e8f0;
          padding:6px 12px;border-radius:8px;cursor:pointer">New Chat</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-area">
        <input class="chat-input" placeholder="Nhập tin nhắn..." />
        <button class="chat-send">Gửi</button>
      </div>
    `;

    this.messagesEl = this.container.querySelector(".chat-messages");
    this.input = this.container.querySelector(".chat-input");
    this.sendBtn = this.container.querySelector(".chat-send");

    this.sendBtn.addEventListener("click", () => this._send());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._send();
      }
    });
    this.container
      .querySelector(".chat-header button")
      .addEventListener("click", () => this._newChat());
  }

  async _send() {
    const text = this.input.value.trim();
    if (!text || this._isStreaming) return;

    this.input.value = "";
    this._addMessage("user", text);
    this._isStreaming = true;
    this.sendBtn.disabled = true;

    // Show typing indicator:
    const typingEl = this._showTyping();

    try {
      const response = await this._fetchStream(text);
      typingEl.remove();
      await this._streamResponse(response);
    } catch (err) {
      typingEl.remove();
      this._addMessage("ai", "❌ Lỗi: không thể kết nối AI. " + err.message);
    }

    this._isStreaming = false;
    this.sendBtn.disabled = false;
    this._saveHistory();
  }

  _addMessage(role, content) {
    this.messages.push({ role, content, timestamp: Date.now() });
    const el = document.createElement("div");
    el.className = `chat-msg ${role}`;
    el.innerHTML =
      role === "ai" ? this._renderMarkdown(content) : this._escapeHtml(content);
    this.messagesEl.appendChild(el);
    this._scrollToBottom();
    return el;
  }

  _showTyping() {
    const el = document.createElement("div");
    el.className = "chat-msg ai chat-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    this.messagesEl.appendChild(el);
    this._scrollToBottom();
    return el;
  }

  async _fetchStream(userMessage) {
    // Simulated streaming response cho demo:
    // Production: dùng fetch + ReadableStream
    const responses = [
      "Đây là câu trả lời mẫu từ AI Assistant. ",
      "Trong production, bạn sẽ kết nối tới **OpenAI API** ",
      "hoặc backend của bạn với `streaming: true`. ",
      "\n\nCách implement streaming:\n",
      "```javascript\nconst response = await fetch('/api/chat', {\n",
      "  method: 'POST',\n",
      "  headers: { 'Content-Type': 'application/json' },\n",
      "  body: JSON.stringify({ messages: this.messages })\n",
      "});\n\n",
      "const reader = response.body.getReader();\n",
      "const decoder = new TextDecoder();\n",
      "while (true) {\n",
      "  const { done, value } = await reader.read();\n",
      "  if (done) break;\n",
      "  const chunk = decoder.decode(value);\n",
      "  // Append chunk to message!\n",
      "}\n```\n",
    ];
    return responses;
  }

  async _streamResponse(chunks) {
    const el = this._addMessage("ai", "");
    let fullText = "";

    for (const chunk of chunks) {
      for (const char of chunk) {
        fullText += char;
        el.innerHTML =
          this._renderMarkdown(fullText) + '<span class="cursor">▌</span>';
        this._scrollToBottom();
        await this._sleep(20 + Math.random() * 30); // random delay = tự nhiên hơn!
      }
    }

    // Remove cursor:
    el.innerHTML = this._renderMarkdown(fullText);
    this.messages[this.messages.length - 1].content = fullText;
  }

  _renderMarkdown(text) {
    let html = this._escapeHtml(text);
    html = html.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      "<pre><code>$2</code></pre>",
    );
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  _escapeHtml(text) {
    const el = document.createElement("div");
    el.textContent = text;
    return el.innerHTML;
  }

  _scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  _newChat() {
    this.messages = [];
    this.messagesEl.innerHTML = "";
    localStorage.removeItem(this.storageKey);
  }

  _saveHistory() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
  }

  _loadHistory() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const msgs = JSON.parse(saved);
    msgs.forEach((m) => this._addMessage(m.role, m.content));
  }
}

// Usage:
const chat = new ChatInterface("#chat", {
  apiUrl: "/api/chat",
  systemPrompt: "Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.",
});
````

### 📖 RADIO Walkthrough — GPT Chat

> **R — Requirements:** Chat UI with user/AI messages, streaming response (character-by-character), typing indicator, markdown trong messages, auto-scroll, persistence.

> **A — Architecture:** `ChatInterface` class: messages array + DOM rendering. Streaming dùng char-by-char loop với `sleep()`. History lưu localStorage.

> **I — Implementation:**

**Streaming — character-by-character effect:**

```javascript
for (const char of chunk) {
  fullText += char;
  el.innerHTML = renderMarkdown(fullText) + "▌"; // cursor!
  await sleep(20 + Math.random() * 30);
}
```

`Math.random() * 30` = delay ngẫu nhiên 20-50ms → hiệu ứng gõ **TỰ NHIÊN** hơn! Nếu đều → cảm giác máy. Production: dùng `ReadableStream` + `TextDecoder` từ fetch response.

**Auto-scroll — `scrollTop = scrollHeight`:** Mỗi khi thêm content → cuộn xuống cuối. `scrollHeight` = chiều cao thật của content (kể cả overflow). Set `scrollTop` = `scrollHeight` → cuộn hết!

**Typing indicator — CSS `@keyframes bounce`:** 3 dots nhảy lên xuống lệch pha (delay 0s, 0.2s, 0.4s) → hiệu ứng wave!

---

## §19.2 GPT Chat — React

````javascript
import { useState, useCallback, useRef, useEffect } from "react";

function useChat(storageKey = "chat-history") {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;
      const userMsg = { role: "user", content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText("");

      // Simulate streaming:
      const response =
        "Đây là câu trả lời mẫu từ AI. Trong **production** bạn sẽ dùng `fetch` với streaming.";
      let accumulated = "";
      for (const char of response) {
        accumulated += char;
        setStreamingText(accumulated);
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: response, timestamp: Date.now() },
      ]);
      setStreamingText("");
      setIsStreaming(false);
    },
    [isStreaming],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { messages, isStreaming, streamingText, sendMessage, clearChat };
}

function renderMd(text) {
  let h = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>");
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*(.+?)\*/g, "<em>$1</em>");
  h = h.replace(/\n/g, "<br>");
  return h;
}

function ChatApp() {
  const { messages, isStreaming, streamingText, sendMessage, clearChat } =
    useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = () => {
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <span>🤖 AI Assistant</span>
        <button onClick={clearChat}>New Chat</button>
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-msg ${m.role}`}
            dangerouslySetInnerHTML={{
              __html: m.role === "ai" ? renderMd(m.content) : m.content,
            }}
          />
        ))}
        {isStreaming && streamingText && (
          <div
            className="chat-msg ai"
            dangerouslySetInnerHTML={{ __html: renderMd(streamingText) + "▌" }}
          />
        )}
        {isStreaming && !streamingText && (
          <div className="chat-msg ai chat-typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Nhập tin nhắn..."
        />
        <button
          className="chat-send"
          onClick={handleSend}
          disabled={isStreaming}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
````

### §19.3 Advanced Patterns — GPT Chat

```javascript
// ═══ PATTERN 1: Real streaming với fetch + ReadableStream ═══
async function streamChat(messages, onChunk) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, stream: true }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    // Parse SSE format: "data: {...}\n\n"
    text
      .split("\n")
      .filter((l) => l.startsWith("data: "))
      .forEach((line) => {
        const data = JSON.parse(line.slice(6));
        if (data.choices?.[0]?.delta?.content) {
          onChunk(data.choices[0].delta.content);
        }
      });
  }
}

// ═══ PATTERN 2: Conversation branching ═══
function useBranching() {
  const [branches, setBranches] = useState([{ id: "main", messages: [] }]);
  const [activeBranch, setActiveBranch] = useState("main");

  const branch = useCallback(
    (fromIndex) => {
      const current = branches.find((b) => b.id === activeBranch);
      const newBranch = {
        id: Date.now().toString(),
        messages: current.messages.slice(0, fromIndex + 1),
      };
      setBranches((prev) => [...prev, newBranch]);
      setActiveBranch(newBranch.id);
    },
    [branches, activeBranch],
  );

  return { branches, activeBranch, branch, setActiveBranch };
}
```

---

## §19.4 GPT Chat — Web Component

```javascript
class MyChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._msgs = [];
    this._streaming = false;
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 700px; font-family: system-ui; }
        .chat { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;
                display: flex; flex-direction: column; height: 600px; }
        .hd { padding: 16px; background: #1a1a2e; color: #e2e8f0; }
        .msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex;
                flex-direction: column; gap: 12px; background: #f7fafc; }
        .msg { max-width: 80%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
        .msg.user { align-self: flex-end; background: #3182ce; color: #fff; }
        .msg.ai { align-self: flex-start; background: #fff; border: 1px solid #e2e8f0; }
        .input-area { display: flex; gap: 8px; padding: 16px; border-top: 1px solid #e2e8f0; }
        input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 24px; outline: none; }
        button { padding: 12px 24px; background: #3182ce; color: #fff; border: none;
                 border-radius: 24px; cursor: pointer; }
      </style>
      <div class="chat">
        <div class="hd">🤖 AI Chat</div>
        <div class="msgs"></div>
        <div class="input-area">
          <input placeholder="Nhập tin nhắn..." />
          <button>Gửi</button>
        </div>
      </div>
    `;
    const msgs = this.shadowRoot.querySelector(".msgs");
    const input = this.shadowRoot.querySelector("input");
    const btn = this.shadowRoot.querySelector("button");

    const send = async () => {
      const text = input.value.trim();
      if (!text || this._streaming) return;
      input.value = "";
      this._addMsg(msgs, "user", text);
      this._streaming = true;

      // Simulate stream:
      const el = this._addMsg(msgs, "ai", "");
      const response =
        "Đây là câu trả lời mẫu. Dùng **streaming** trong production!";
      let acc = "";
      for (const c of response) {
        acc += c;
        el.textContent = acc + "▌";
        msgs.scrollTop = msgs.scrollHeight;
        await new Promise((r) => setTimeout(r, 25));
      }
      el.textContent = acc;
      this._streaming = false;
    };

    btn.addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });
  }

  _addMsg(container, role, text) {
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }
}
customElements.define("my-chat", MyChat);
```

---

# 🎨 Component 20: Infinite Canvas (Figma-like)

## Kiến Trúc Infinite Canvas

```
INFINITE CANVAS:
═══════════════════════════════════════════════════════════════

  Viewport (user nhìn thấy):
  ┌─────────────────────────────────────────┐
  │                                         │
  │    ┌────────┐     ┌────────────┐        │
  │    │ Shape 1 │     │   Text     │        │
  │    │ (rect)  │     │   Block    │        │
  │    └────────┘     └────────────┘        │
  │                                         │
  │         ┌──────────────┐                │
  │         │   Image      │                │
  │         └──────────────┘                │
  │                                         │
  └─────────────────────────────────────────┘
                    ↕ Pan (drag background)
                    🔍 Zoom (scroll wheel)

  Coordinate System:
  Screen coords → Canvas coords (với offset + zoom!)
  canvasX = (screenX - offsetX) / zoom
  canvasY = (screenY - offsetY) / zoom

  Key Concepts:
  • Pan: drag background để di chuyển!
  • Zoom: scroll wheel scale lên/xuống!
  • Object selection: click to select, drag to move!
  • Coordinate transformation (screen ↔ canvas)!
  • Canvas/SVG rendering!
```

---

## §20.1 Infinite Canvas — Vanilla JavaScript

```css
.infinite-canvas {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
  cursor: grab;
  background: #f0f0f0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.infinite-canvas:active {
  cursor: grabbing;
}
.canvas-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  gap: 4px;
  background: #fff;
  padding: 6px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.canvas-toolbar button {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
.canvas-toolbar button.active {
  background: #3182ce;
  color: #fff;
}
.canvas-zoom {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

```javascript
// ═══ Vanilla JS Infinite Canvas ═══

class InfiniteCanvas {
  constructor(container) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    // Transform state:
    this.offsetX = 0; // pan X
    this.offsetY = 0; // pan Y
    this.zoom = 1; // zoom level

    // Objects on canvas:
    this.objects = [];
    this.selectedId = null;
    this.tool = "select"; // select | rect | circle | text

    // Drag state:
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._dragTarget = null; // null = panning, object = moving

    this._render();
    this._setupEvents();
  }

  _render() {
    this.container.className = "infinite-canvas";
    this.container.innerHTML = `
      <div class="canvas-toolbar">
        <button data-tool="select" class="active" title="Select">↖</button>
        <button data-tool="rect" title="Rectangle">▭</button>
        <button data-tool="circle" title="Circle">○</button>
        <button data-tool="text" title="Text">T</button>
      </div>
      <canvas></canvas>
      <div class="canvas-zoom">100%</div>
    `;

    this.canvas = this.container.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.zoomDisplay = this.container.querySelector(".canvas-zoom");

    // Size canvas to container:
    const resize = () => {
      this.canvas.width = this.container.clientWidth;
      this.canvas.height = this.container.clientHeight;
      this._draw();
    };
    resize();
    window.addEventListener("resize", resize);

    // Toolbar:
    this.container
      .querySelector(".canvas-toolbar")
      .addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        this.tool = btn.dataset.tool;
        this.container
          .querySelectorAll(".canvas-toolbar button")
          .forEach((b) => b.classList.toggle("active", b === btn));
      });
  }

  _setupEvents() {
    // Mouse down:
    this.canvas.addEventListener("mousedown", (e) => {
      this._isDragging = true;
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;

      const [cx, cy] = this._screenToCanvas(e.clientX, e.clientY);

      if (this.tool === "select") {
        // Check if clicking on an object:
        this._dragTarget = this._hitTest(cx, cy);
        this.selectedId = this._dragTarget?.id || null;
        if (this._dragTarget) {
          this._dragTarget._startX = this._dragTarget.x;
          this._dragTarget._startY = this._dragTarget.y;
        }
      } else if (this.tool !== "select") {
        // Create new object:
        const obj = this._createObject(this.tool, cx, cy);
        this.objects.push(obj);
        this.selectedId = obj.id;
        this._dragTarget = obj;
        this._dragTarget._startX = obj.x;
        this._dragTarget._startY = obj.y;
      }

      this._draw();
    });

    // Mouse move:
    this.canvas.addEventListener("mousemove", (e) => {
      if (!this._isDragging) return;
      const dx = e.clientX - this._dragStartX;
      const dy = e.clientY - this._dragStartY;

      if (this._dragTarget) {
        // Move object:
        this._dragTarget.x = this._dragTarget._startX + dx / this.zoom;
        this._dragTarget.y = this._dragTarget._startY + dy / this.zoom;
      } else {
        // Pan canvas:
        this.offsetX += dx;
        this.offsetY += dy;
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;
      }
      this._draw();
    });

    // Mouse up:
    this.canvas.addEventListener("mouseup", () => {
      this._isDragging = false;
      this._dragTarget = null;
    });

    // Zoom (wheel):
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const [cx, cy] = this._screenToCanvas(e.clientX, e.clientY);
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, this.zoom * factor));

      // Zoom towards mouse position:
      this.offsetX = e.clientX - cx * newZoom;
      this.offsetY = e.clientY - cy * newZoom;
      this.zoom = newZoom;

      this.zoomDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
      this._draw();
    });

    // Delete selected:
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && this.selectedId) {
        this.objects = this.objects.filter((o) => o.id !== this.selectedId);
        this.selectedId = null;
        this._draw();
      }
    });
  }

  // ═══ COORDINATE TRANSFORMATION ═══
  _screenToCanvas(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    return [
      (sx - rect.left - this.offsetX) / this.zoom,
      (sy - rect.top - this.offsetY) / this.zoom,
    ];
  }

  _hitTest(cx, cy) {
    // Reverse order: topmost object first!
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (
        cx >= obj.x &&
        cx <= obj.x + obj.w &&
        cy >= obj.y &&
        cy <= obj.y + obj.h
      ) {
        return obj;
      }
    }
    return null;
  }

  _createObject(type, x, y) {
    const base = { id: Date.now() + Math.random(), x, y, w: 120, h: 80 };
    switch (type) {
      case "rect":
        return { ...base, type: "rect", fill: "#3182ce" };
      case "circle":
        return { ...base, type: "circle", fill: "#e53e3e", w: 80, h: 80 };
      case "text":
        return {
          ...base,
          type: "text",
          text: "Text",
          fill: "#2d3748",
          w: 100,
          h: 30,
        };
      default:
        return base;
    }
  }

  // ═══ RENDERING ═══
  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid pattern:
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);
    this._drawGrid();

    // Objects:
    this.objects.forEach((obj) => {
      ctx.save();
      if (obj.type === "rect") {
        ctx.fillStyle = obj.fill;
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
      } else if (obj.type === "circle") {
        ctx.fillStyle = obj.fill;
        ctx.beginPath();
        ctx.ellipse(
          obj.x + obj.w / 2,
          obj.y + obj.h / 2,
          obj.w / 2,
          obj.h / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (obj.type === "text") {
        ctx.fillStyle = obj.fill;
        ctx.font = "16px system-ui";
        ctx.fillText(obj.text, obj.x, obj.y + 20);
      }

      // Selection border:
      if (obj.id === this.selectedId) {
        ctx.strokeStyle = "#3182ce";
        ctx.lineWidth = 2 / this.zoom; // constant thickness regardless of zoom!
        ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
        ctx.strokeRect(obj.x - 4, obj.y - 4, obj.w + 8, obj.h + 8);
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    ctx.restore();
  }

  _drawGrid() {
    const ctx = this.ctx;
    const gridSize = 50;
    const startX =
      Math.floor(-this.offsetX / this.zoom / gridSize) * gridSize - gridSize;
    const startY =
      Math.floor(-this.offsetY / this.zoom / gridSize) * gridSize - gridSize;
    const endX = startX + this.canvas.width / this.zoom + gridSize * 2;
    const endY = startY + this.canvas.height / this.zoom + gridSize * 2;

    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.5 / this.zoom;
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }
}

// Usage:
const canvas = new InfiniteCanvas("#canvas");
```

### 📖 RADIO Walkthrough — Infinite Canvas

> **R — Requirements:** Canvas vô hạn, pan (drag), zoom (wheel), vẽ shapes, select/move objects, delete.

> **A — Architecture:** `InfiniteCanvas` class quản lý: transform state (offset + zoom), objects array, render loop. Canvas 2D context cho vẽ.

> **I — Implementation:**

**Coordinate transformation — `_screenToCanvas()`:**

```
canvasX = (screenX - containerLeft - offsetX) / zoom
canvasY = (screenY - containerTop - offsetY) / zoom
```

Reverse: `screenX = canvasX * zoom + offsetX + containerLeft`. Tại sao chia zoom? Vì khi zoom 2x, mỗi pixel màn hình = 0.5 pixel canvas!

**Zoom towards mouse — tại sao phải tính lại offset?**

```javascript
// Point dưới con trỏ giữ nguyên vị trí!
const [cx, cy] = screenToCanvas(mouseX, mouseY);
newZoom = zoom * factor;
offsetX = mouseX - cx * newZoom; // giữ cx cố định trên screen!
offsetY = mouseY - cy * newZoom;
```

Nếu chỉ thay `zoom` mà không đổi offset → zoom vào góc trái (0,0) thay vì vào con trỏ!

**Selection border — `lineWidth / zoom`:** Khi zoom 4x, đường viền bình thường dày 4x! `lineWidth = 2 / zoom` → luôn dày 2px BẤT KỂ zoom level!

**Grid chỉ vẽ visible area:** Tính `startX`, `endX` dựa trên offset + viewport size → chỉ vẽ grid ô trong vùng nhìn, không vẽ tất cả → performance!

---

## §20.2 Infinite Canvas — React

```javascript
import { useState, useCallback, useRef, useEffect } from "react";

function useCanvas() {
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select");

  const screenToCanvas = useCallback(
    (sx, sy, rect) => {
      return [
        (sx - rect.left - transform.x) / transform.zoom,
        (sy - rect.top - transform.y) / transform.zoom,
      ];
    },
    [transform],
  );

  const addObject = useCallback((type, x, y) => {
    const obj = {
      id: Date.now(),
      type,
      x,
      y,
      w: type === "circle" ? 80 : 120,
      h: type === "text" ? 30 : 80,
      fill:
        type === "rect" ? "#3182ce" : type === "circle" ? "#e53e3e" : "#2d3748",
      text: type === "text" ? "Text" : undefined,
    };
    setObjects((prev) => [...prev, obj]);
    setSelectedId(obj.id);
    return obj;
  }, []);

  const moveObject = useCallback((id, dx, dy) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, x: o.x + dx, y: o.y + dy } : o)),
    );
  }, []);

  const deleteSelected = useCallback(() => {
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  return {
    transform,
    setTransform,
    objects,
    selectedId,
    setSelectedId,
    tool,
    setTool,
    screenToCanvas,
    addObject,
    moveObject,
    deleteSelected,
  };
}

function InfiniteCanvasApp() {
  const canvas = useCanvas();
  const canvasRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, target: null });

  // Draw effect:
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const el = canvasRef.current;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.save();
    ctx.translate(canvas.transform.x, canvas.transform.y);
    ctx.scale(canvas.transform.zoom, canvas.transform.zoom);

    canvas.objects.forEach((obj) => {
      ctx.fillStyle = obj.fill;
      if (obj.type === "rect") ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
      else if (obj.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          obj.x + obj.w / 2,
          obj.y + obj.h / 2,
          obj.w / 2,
          obj.h / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (obj.type === "text") {
        ctx.font = "16px system-ui";
        ctx.fillText(obj.text, obj.x, obj.y + 20);
      }
      if (obj.id === canvas.selectedId) {
        ctx.strokeStyle = "#3182ce";
        ctx.lineWidth = 2 / canvas.transform.zoom;
        ctx.strokeRect(obj.x - 4, obj.y - 4, obj.w + 8, obj.h + 8);
      }
    });
    ctx.restore();
  }, [canvas.objects, canvas.transform, canvas.selectedId]);

  return (
    <div className="infinite-canvas">
      <div className="canvas-toolbar">
        {["select", "rect", "circle", "text"].map((t) => (
          <button
            key={t}
            className={canvas.tool === t ? "active" : ""}
            onClick={() => canvas.setTool(t)}
          >
            {t === "select"
              ? "↖"
              : t === "rect"
                ? "▭"
                : t === "circle"
                  ? "○"
                  : "T"}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={(e) => {
          /* pan/select/create logic */
        }}
        onMouseMove={(e) => {
          /* move/pan logic */
        }}
        onMouseUp={() => {
          dragRef.current.active = false;
        }}
        onWheel={(e) => {
          /* zoom logic */
        }}
      />
      <div className="canvas-zoom">
        {Math.round(canvas.transform.zoom * 100)}%
      </div>
    </div>
  );
}
```

### §20.3 Advanced Patterns — Infinite Canvas

```javascript
// ═══ PATTERN 1: Undo/Redo cho canvas edits ═══
function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const push = useCallback(
    (state) => {
      setHistory((prev) => [...prev.slice(0, index + 1), state]);
      setIndex((i) => i + 1);
    },
    [index],
  );

  const undo = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) setIndex((i) => i + 1);
  }, [index, history.length]);

  return {
    current: history[index],
    push,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
}

// ═══ PATTERN 2: Snap to grid ═══
function snapToGrid(value, gridSize = 10) {
  return Math.round(value / gridSize) * gridSize;
}
```

---

## §20.4 Infinite Canvas — Web Component

```javascript
class MyCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._ox = 0;
    this._oy = 0;
    this._zoom = 1;
    this._objects = [];
    this._sel = null;
    this._drag = false;
    this._target = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .wrap { position: relative; width: 100%; height: 600px; overflow: hidden;
                cursor: grab; background: #f0f0f0; border-radius: 12px; }
        .wrap:active { cursor: grabbing; }
        canvas { display: block; }
        .tb { position: absolute; top: 12px; left: 12px; display: flex; gap: 4px;
              background: #fff; padding: 6px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .tb button { padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;
                     background: #fff; cursor: pointer; }
        .tb button.on { background: #3182ce; color: #fff; }
        .zm { position: absolute; bottom: 12px; right: 12px; background: #fff;
              padding: 4px 10px; border-radius: 6px; font-size: 13px; }
      </style>
      <div class="wrap">
        <div class="tb">
          <button class="on" data-t="select">↖</button>
          <button data-t="rect">▭</button>
          <button data-t="circle">○</button>
        </div>
        <canvas></canvas>
        <div class="zm">100%</div>
      </div>
    `;

    const wrap = this.shadowRoot.querySelector(".wrap");
    this._cvs = this.shadowRoot.querySelector("canvas");
    this._ctx = this._cvs.getContext("2d");
    this._tool = "select";

    this._cvs.width = wrap.clientWidth;
    this._cvs.height = wrap.clientHeight;

    this.shadowRoot.querySelector(".tb").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      this._tool = b.dataset.t;
      this.shadowRoot
        .querySelectorAll(".tb button")
        .forEach((x) => x.classList.toggle("on", x === b));
    });

    this._cvs.addEventListener("mousedown", (e) => {
      this._drag = true;
      this._sx = e.clientX;
      this._sy = e.clientY;
      const [cx, cy] = this._s2c(e);
      if (this._tool !== "select") {
        const obj = {
          id: Date.now(),
          type: this._tool,
          x: cx,
          y: cy,
          w: 100,
          h: this._tool === "circle" ? 100 : 80,
          fill: this._tool === "rect" ? "#3182ce" : "#e53e3e",
        };
        this._objects.push(obj);
        this._sel = obj.id;
      } else {
        this._target = this._objects
          .slice()
          .reverse()
          .find(
            (o) => cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h,
          );
        this._sel = this._target?.id || null;
        if (this._target) {
          this._target._sx = this._target.x;
          this._target._sy = this._target.y;
        }
      }
      this._draw();
    });

    this._cvs.addEventListener("mousemove", (e) => {
      if (!this._drag) return;
      const dx = e.clientX - this._sx,
        dy = e.clientY - this._sy;
      if (this._target) {
        this._target.x = this._target._sx + dx / this._zoom;
        this._target.y = this._target._sy + dy / this._zoom;
      } else if (this._tool === "select") {
        this._ox += dx;
        this._oy += dy;
        this._sx = e.clientX;
        this._sy = e.clientY;
      }
      this._draw();
    });

    this._cvs.addEventListener("mouseup", () => {
      this._drag = false;
      this._target = null;
    });
    this._cvs.addEventListener("wheel", (e) => {
      e.preventDefault();
      const [cx, cy] = this._s2c(e);
      this._zoom *= e.deltaY > 0 ? 0.9 : 1.1;
      this._zoom = Math.max(0.1, Math.min(5, this._zoom));
      this._ox = e.clientX - cx * this._zoom;
      this._oy = e.clientY - cy * this._zoom;
      this.shadowRoot.querySelector(".zm").textContent =
        Math.round(this._zoom * 100) + "%";
      this._draw();
    });

    this._draw();
  }

  _s2c(e) {
    const r = this._cvs.getBoundingClientRect();
    return [
      (e.clientX - r.left - this._ox) / this._zoom,
      (e.clientY - r.top - this._oy) / this._zoom,
    ];
  }

  _draw() {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._cvs.width, this._cvs.height);
    ctx.save();
    ctx.translate(this._ox, this._oy);
    ctx.scale(this._zoom, this._zoom);
    this._objects.forEach((o) => {
      ctx.fillStyle = o.fill;
      if (o.type === "rect") ctx.fillRect(o.x, o.y, o.w, o.h);
      else {
        ctx.beginPath();
        ctx.ellipse(
          o.x + o.w / 2,
          o.y + o.h / 2,
          o.w / 2,
          o.h / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (o.id === this._sel) {
        ctx.strokeStyle = "#3182ce";
        ctx.lineWidth = 2 / this._zoom;
        ctx.strokeRect(o.x - 4, o.y - 4, o.w + 8, o.h + 8);
      }
    });
    ctx.restore();
  }
}
customElements.define("my-canvas", MyCanvas);
```

```html
<my-canvas></my-canvas>
```
