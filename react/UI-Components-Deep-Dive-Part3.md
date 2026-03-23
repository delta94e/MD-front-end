# UI Components Deep Dive — Phần 3: Reddit Thread, Gallery, Nested Checkboxes, Toast

> 📅 2026-03-09 · ⏱ 50 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Reddit Thread, Gallery, Nested Checkboxes, Toast
> Version: Vanilla JavaScript + React + Web Component
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component         | Vanilla JS | React | Advanced Patterns | Web Component |
| --- | ----------------- | ---------- | ----- | ----------------- | ------------- |
| 7   | Reddit Thread     | §7.1       | §7.2  | §7.3              | §7.4          |
| 8   | Gallery           | §8.1       | §8.2  | §8.3              | §8.4          |
| 9   | Nested Checkboxes | §9.1       | §9.2  | §9.3              | §9.4          |
| 10  | Toast             | §10.1      | §10.2 | §10.3             | §10.4         |

---

# 💬 Component 7: Reddit Thread

## Kiến Trúc Reddit Thread

```
REDDIT THREAD (Nested Comments):
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │ 👤 user1 · 2 giờ trước                         │
  │ Đây là comment gốc (depth 0)                   │
  │ ▲ 42 ▼ · 💬 Reply · 📎 Share                    │
  │                                                 │
  │   ┌──────────────────────────────────────────┐  │
  │   │ 👤 user2 · 1 giờ trước                   │  │
  │   │ Reply level 1 (depth 1)                  │  │
  │   │ ▲ 15 ▼ · 💬 Reply                         │  │
  │   │                                           │  │
  │   │   ┌───────────────────────────────────┐   │  │
  │   │   │ 👤 user3 · 30 phút trước          │   │  │
  │   │   │ Reply level 2 (depth 2)           │   │  │
  │   │   │ ▲ 7 ▼ · 💬 Reply                   │   │  │
  │   │   └───────────────────────────────────┘   │  │
  │   └──────────────────────────────────────────┘  │
  │                                                 │
  │   ┌──────────────────────────────────────────┐  │
  │   │ 👤 user4 · 45 phút trước                 │  │
  │   │ Một reply khác ở level 1                 │  │
  │   │ ▲ 3 ▼ · 💬 Reply                          │  │
  │   └──────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────┘

  DATA STRUCTURE — ĐỆ QUY (Recursive!):
  comment = {
    id, author, text, votes, timestamp,
    children: [          ← MẢNG comments con!
      { id, author, text, votes, children: [...] },
      { id, author, text, votes, children: [] },
    ]
  }

  Key Concepts:
  • Recursive rendering (component gọi lại chính nó!)
  • Collapse/expand threads!
  • Vote up/down (optimistic update!)
  • Reply form (toggle inline!)
  • Depth limit (Reddit giới hạn ~10 levels!)
  • Indentation bằng margin-left!
```

---

## §7.1 Reddit Thread — Vanilla JavaScript

```css
/* ═══ CSS ═══ */
.thread {
  font-family: system-ui, sans-serif;
  max-width: 700px;
}

.comment {
  padding: 12px 0;
  border-left: 2px solid #e2e8f0;
  margin-left: 0;
  padding-left: 16px;
}
.comment.depth-0 {
  border-left: none;
  padding-left: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #718096;
}
.comment-author {
  font-weight: 600;
  color: #2d3748;
}
.comment-body {
  margin: 8px 0;
  line-height: 1.6;
  color: #4a5568;
}

.comment-actions {
  display: flex;
  gap: 16px;
  font-size: 13px;
}
.comment-actions button {
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  font-size: 13px;
  padding: 2px 4px;
  border-radius: 4px;
}
.comment-actions button:hover {
  background: #f7fafc;
  color: #2d3748;
}

.vote-btn {
  font-weight: 600;
}
.vote-btn.active-up {
  color: #e53e3e !important;
}
.vote-btn.active-down {
  color: #3182ce !important;
}
.vote-count {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.reply-form {
  margin: 12px 0;
}
.reply-form textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}
.reply-form button {
  margin-top: 8px;
  padding: 8px 16px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  font-size: 14px;
  padding: 0 4px;
}
.collapsed .comment-body,
.collapsed .comment-actions,
.collapsed .comment-children {
  display: none;
}
```

```javascript
// ═══ Vanilla JS Reddit Thread ═══

class RedditThread {
  constructor(container, comments = []) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.comments = comments;
    // comments = đệ quy! Mỗi comment có children: [...]
    this.maxDepth = 10; // giới hạn depth như Reddit!
    this._render();
  }

  _render() {
    this.container.innerHTML = "";
    this.container.className = "thread";

    // Render MỖI comment gốc (depth 0):
    this.comments.forEach((comment) => {
      this.container.appendChild(
        this._renderComment(comment, 0),
        //                          ↑ depth bắt đầu = 0!
      );
    });
  }

  // ĐỆ QUY! Function này GỌI LẠI CHÍNH NÓ!
  _renderComment(comment, depth) {
    const el = document.createElement("div");
    el.className = `comment depth-${Math.min(depth, this.maxDepth)}`;
    el.style.marginLeft = depth > 0 ? "20px" : "0";
    // Mỗi level indent thêm 20px!
    el.dataset.id = comment.id;

    el.innerHTML = `
      <div class="comment-header">
        <button class="collapse-btn" title="Thu gọn">[–]</button>
        <span class="comment-author">👤 ${comment.author}</span>
        <span>· ${this._timeAgo(comment.timestamp)}</span>
      </div>
      <div class="comment-body">${comment.text}</div>
      <div class="comment-actions">
        <button class="vote-btn vote-up" title="Upvote">▲</button>
        <span class="vote-count">${comment.votes}</span>
        <button class="vote-btn vote-down" title="Downvote">▼</button>
        <button class="reply-btn">💬 Reply</button>
      </div>
      <div class="reply-form-container"></div>
      <div class="comment-children"></div>
    `;

    // EVENTS:
    // 1. Collapse/Expand:
    el.querySelector(".collapse-btn").addEventListener("click", () => {
      el.classList.toggle("collapsed");
      const btn = el.querySelector(".collapse-btn");
      btn.textContent = el.classList.contains("collapsed") ? "[+]" : "[–]";
    });

    // 2. Vote:
    const voteCount = el.querySelector(".vote-count");
    el.querySelector(".vote-up").addEventListener("click", () => {
      comment.votes++;
      voteCount.textContent = comment.votes;
    });
    el.querySelector(".vote-down").addEventListener("click", () => {
      comment.votes--;
      voteCount.textContent = comment.votes;
    });

    // 3. Reply:
    el.querySelector(".reply-btn").addEventListener("click", () => {
      const formContainer = el.querySelector(".reply-form-container");
      if (formContainer.children.length) {
        formContainer.innerHTML = ""; // toggle off!
        return;
      }
      if (depth >= this.maxDepth) {
        alert("Đã đạt giới hạn reply depth!");
        return;
      }
      formContainer.innerHTML = `
        <div class="reply-form">
          <textarea placeholder="Viết reply..."></textarea>
          <button class="submit-reply">Gửi Reply</button>
        </div>
      `;
      formContainer
        .querySelector(".submit-reply")
        .addEventListener("click", () => {
          const text = formContainer.querySelector("textarea").value.trim();
          if (!text) return;

          const newComment = {
            id: Date.now(),
            author: "you",
            text,
            votes: 1,
            timestamp: Date.now(),
            children: [],
          };
          comment.children.push(newComment);
          // Render comment mới VÀO children container:
          el.querySelector(".comment-children").appendChild(
            this._renderComment(newComment, depth + 1),
            //                               ↑ depth + 1!
          );
          formContainer.innerHTML = ""; // xoá form!
        });
    });

    // 4. Render CHILDREN — ĐỆ QUY!
    const childrenContainer = el.querySelector(".comment-children");
    if (comment.children && comment.children.length > 0) {
      comment.children.forEach((child) => {
        childrenContainer.appendChild(
          this._renderComment(child, depth + 1),
          // ↑ GỌI LẠI CHÍNH NÓ! depth tăng 1!
          // Cứ gọi cho đến khi children = [] (base case!)
        );
      });
    }

    return el;
  }

  _timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  }
}

// Usage:
const thread = new RedditThread("#thread", [
  {
    id: 1,
    author: "alice",
    text: "Post gốc!",
    votes: 42,
    timestamp: Date.now() - 7200000,
    children: [
      {
        id: 2,
        author: "bob",
        text: "Đồng ý!",
        votes: 15,
        timestamp: Date.now() - 3600000,
        children: [
          {
            id: 3,
            author: "charlie",
            text: "Tôi cũng thế!",
            votes: 7,
            timestamp: Date.now() - 1800000,
            children: [],
          },
        ],
      },
      {
        id: 4,
        author: "dave",
        text: "Ý kiến khác",
        votes: 3,
        timestamp: Date.now() - 2700000,
        children: [],
      },
    ],
  },
]);
```

### 📖 RADIO Walkthrough — Reddit Thread (Vanilla JS)

> **R — Requirements (Yêu cầu):**
>
> - Hiển thị comments dạng cây (tree) với nesting vô hạn (giới hạn ~10 levels)
> - Collapse/expand từng thread
> - Vote up/down realtime
> - Reply inline (form hiện ngay dưới comment)
> - Hiển thị thời gian tương đối ("5 phút trước")

> **A — Architecture (Kiến trúc):**
> Dùng 1 class `RedditThread` quản lý toàn bộ. Data là **tree đệ quy** — mỗi comment có mảng `children` chứa các comment con. Render bằng method `_renderComment()` — method này **gọi lại chính nó** cho mỗi child.

> **D — Data Model (Cấu trúc dữ liệu):**
>
> ```
> comment = { id, author, text, votes, timestamp, children: [...] }
> ```
>
> Đây là **N-ary tree** — mỗi node có N children. Không cần parent reference vì ta duyệt từ gốc xuống.

> **I — Implementation (Chi tiết triển khai):**

**Tại sao dùng `class RedditThread`?**

Class giúp gom logic + state vào 1 chỗ. `this.comments` lưu data, `this.maxDepth` giới hạn nesting, `this.container` là DOM element gốc. Tất cả methods (`_render`, `_renderComment`, `_timeAgo`) đều truy cập được `this` — không cần truyền tham số liên tục.

**Constructor nhận gì?**

```javascript
constructor(container, (comments = []));
```

- `container`: string selector (`'#thread'`) hoặc DOM element trực tiếp — constructor tự detect bằng `typeof`
- `comments`: mảng tree data — mặc định `[]` (rỗng)
- `= []` là **default parameter** — nếu không truyền thì dùng mảng rỗng, tránh lỗi `undefined.forEach()`

**`_renderComment(comment, depth)` — trái tim của component!**

Method này nhận 1 comment + depth hiện tại. Nó:

1. Tạo `<div class="comment depth-0">` với `marginLeft` tăng dần theo depth
2. Render header (author, time), body (text), actions (vote, reply)
3. Gắn event listeners (click, keydown)
4. **Gọi lại chính nó** cho mỗi `comment.children[i]` với `depth + 1`

Tại sao dùng `depth`?

- Để indent (thụt vào) comment con → `marginLeft: depth * 20px`
- Để giới hạn reply depth → `if (depth >= this.maxDepth) return`
- Để CSS class khác nhau → `.depth-0` không có border-left

**Vote — tại sao mutation trực tiếp?**

```javascript
comment.votes++;
voteCount.textContent = comment.votes;
```

Trong Vanilla JS, ta **trực tiếp thay đổi data** (mutation) rồi cập nhật DOM. Đây là cách đơn giản nhất — không cần immutable pattern vì không có Virtual DOM. React khác: mutation = React không biết → không re-render!

**Reply — toggle pattern:**

```javascript
if (formContainer.children.length) {
  formContainer.innerHTML = ""; // toggle OFF!
  return;
}
```

Nếu form đã mở → xoá form (đóng). Nếu chưa mở → tạo form mới. Đây là **toggle pattern** — click lần 1 mở, click lần 2 đóng. Dùng `children.length` để check vì nếu form đã render → có children, nếu đã xoá → `children.length === 0`.

**`_timeAgo()` — relative time:**

Tính `Date.now() - timestamp` ra milliseconds, chia cho 60000 ra phút, chia nữa ra giờ. Dùng chuỗi if-else đơn giản. Production app dùng thư viện (`date-fns`, `dayjs`) nhưng ở đây ta tự viết để hiểu logic.

> **O — Optimization (Tối ưu):**
>
> - Chỉ render comments visible (xem §7.3 Virtualization)
> - Event delegation thay vì gắn listener cho từng comment
> - Lazy load replies (chỉ render khi expand)

### 📖 Giải thích: Đệ Quy (Recursion) trong Reddit Thread

```
ĐỆ QUY = function gọi lại chính nó!

_renderComment(comment, depth)
  │
  ├── Render comment hiện tại
  │
  └── Với MỖI child trong comment.children:
      │
      └── _renderComment(child, depth + 1)  ← GỌI LẠI!
          │
          ├── Render child comment
          │
          └── Với MỖI child.children:
              │
              └── _renderComment(grandchild, depth + 2)  ← LẠI NỮA!
                  │
                  └── ... (cho đến khi children = [])
                      ↑ BASE CASE: dừng đệ quy!

Ví dụ cụ thể:
═══════════════
_renderComment(alice, depth=0)
  ├── render "Post gốc!"
  ├── _renderComment(bob, depth=1)     ← child 1
  │   ├── render "Đồng ý!"
  │   └── _renderComment(charlie, depth=2)  ← child of child!
  │       ├── render "Tôi cũng thế!"
  │       └── children=[] → DỪNG! ✅
  └── _renderComment(dave, depth=1)    ← child 2
      ├── render "Ý kiến khác"
      └── children=[] → DỪNG! ✅
```

---

## §7.2 Reddit Thread — React

```javascript
// ═══ React Reddit Thread ═══
import { useState, useCallback } from "react";

// Custom hook: quản lý thread state!
function useThread(initialComments) {
  const [comments, setComments] = useState(initialComments);

  // ĐỆ QUY update: tìm comment theo id rồi update!
  const updateComment = useCallback((id, updater) => {
    const update = (list) =>
      list.map((c) => {
        if (c.id === id) return updater(c);
        // Không tìm thấy → tìm trong children!
        return { ...c, children: update(c.children) };
        //                       ↑ ĐỆ QUY vào sâu!
      });
    setComments((prev) => update(prev));
  }, []);

  const vote = useCallback(
    (id, delta) => {
      updateComment(id, (c) => ({ ...c, votes: c.votes + delta }));
    },
    [updateComment],
  );

  const addReply = useCallback(
    (parentId, text) => {
      updateComment(parentId, (c) => ({
        ...c,
        children: [
          ...c.children,
          {
            id: Date.now(),
            author: "you",
            text,
            votes: 1,
            timestamp: Date.now(),
            children: [],
          },
        ],
      }));
    },
    [updateComment],
  );

  return { comments, vote, addReply };
}

// Component Comment — GỌI LẠI CHÍNH NÓ!
function Comment({ comment, depth, maxDepth, onVote, onReply }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText("");
    setShowReplyForm(false);
  };

  return (
    <div
      className={`comment depth-${depth}`}
      style={{ marginLeft: depth > 0 ? 20 : 0 }}
    >
      <div className="comment-header">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "[+]" : "[–]"}
        </button>
        <span className="comment-author">👤 {comment.author}</span>
        <span>· {timeAgo(comment.timestamp)}</span>
      </div>

      {!collapsed && (
        <>
          <div className="comment-body">{comment.text}</div>
          <div className="comment-actions">
            <button onClick={() => onVote(comment.id, 1)}>▲</button>
            <span className="vote-count">{comment.votes}</span>
            <button onClick={() => onVote(comment.id, -1)}>▼</button>
            {depth < maxDepth && (
              <button onClick={() => setShowReplyForm(!showReplyForm)}>
                💬 Reply
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="reply-form">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết reply..."
              />
              <button onClick={handleReply}>Gửi Reply</button>
            </div>
          )}

          {/* ĐỆ QUY! Render children comments! */}
          {comment.children.map((child) => (
            <Comment
              key={child.id}
              comment={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              onVote={onVote}
              onReply={onReply}
            />
          ))}
        </>
      )}
    </div>
  );
}

// Main Thread component:
function RedditThread({ initialComments, maxDepth = 10 }) {
  const { comments, vote, addReply } = useThread(initialComments);

  return (
    <div className="thread">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          depth={0}
          maxDepth={maxDepth}
          onVote={vote}
          onReply={addReply}
        />
      ))}
    </div>
  );
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}
```

### 📖 Giải thích: Immutable Update trong Nested State

```
VẤN ĐỀ: Cập nhật 1 comment SÂU trong tree!

comments = [
  { id:1, votes:42, children: [
    { id:2, votes:15, children: [
      { id:3, votes:7, children: [] }  ← muốn vote id:3!
    ]}
  ]}
]

SAI ❌: comment.votes++ (mutation!)
→ React không biết state thay đổi! Không re-render!

ĐÚNG ✅: tạo OBJECT MỚI từ gốc → đến comment cần update!

updateComment(3, c => ({ ...c, votes: c.votes + 1 }))

Quá trình (từ gốc xuống):
1. id:1 → id !== 3 → tạo object mới, ĐỆ QUY children!
   { ...c, children: update(c.children) }

2. id:2 → id !== 3 → tạo object mới, ĐỆ QUY children!
   { ...c, children: update(c.children) }

3. id:3 → id === 3 → TÌM THẤY! Apply updater!
   { ...c, votes: 8 }  (7 + 1)

React so sánh: oldComments !== newComments → RE-RENDER!
```

---

### §7.3 Advanced React Patterns — Reddit Thread

```javascript
// ═══ PATTERN 1: Virtualized Thread (1000+ comments!) ═══
// Chỉ render comments VISIBLE trong viewport!

function useVisibleComments(flatComments, containerRef) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const itemHeight = 100; // estimate!
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        start + Math.ceil(height / itemHeight) + 5,
        flatComments.length,
      );
      setVisibleRange({ start, end });
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [flatComments.length, containerRef]);

  return flatComments.slice(visibleRange.start, visibleRange.end);
}

// ═══ PATTERN 2: Optimistic Vote + API Sync ═══
// Vote NGAY trên UI, sau đó sync với server!

function useOptimisticVote(updateComment) {
  return useCallback(
    async (id, delta) => {
      // 1. Update UI NGAY (optimistic!):
      updateComment(id, (c) => ({ ...c, votes: c.votes + delta }));

      try {
        // 2. Gửi lên server:
        await fetch(`/api/comments/${id}/vote`, {
          method: "POST",
          body: JSON.stringify({ delta }),
        });
      } catch (err) {
        // 3. Server lỗi? ROLLBACK!
        updateComment(id, (c) => ({ ...c, votes: c.votes - delta }));
      }
    },
    [updateComment],
  );
}

// ═══ PATTERN 3: Collapse với localStorage ═══
// Nhớ trạng thái collapse khi reload page!

function usePersistedCollapse(threadId) {
  const key = `collapsed-${threadId}`;
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggle = useCallback(
    (commentId) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(commentId)) next.delete(commentId);
        else next.add(commentId);
        localStorage.setItem(key, JSON.stringify([...next]));
        return next;
      });
    },
    [key],
  );

  return { isCollapsed: (id) => collapsed.has(id), toggle };
}
```

---

## §7.4 Reddit Thread — Web Component

```javascript
// ═══ Web Component Reddit Thread ═══

class MyRedditThread extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._comments = [];
  }

  set comments(val) {
    this._comments = val;
    this._render();
  }

  connectedCallback() {
    const dataAttr = this.getAttribute("data");
    if (dataAttr) this._comments = JSON.parse(dataAttr);
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, sans-serif; max-width: 700px; }
        .comment { padding: 12px 0; border-left: 2px solid #e2e8f0; padding-left: 16px; }
        .comment.depth-0 { border-left: none; padding-left: 0; }
        .header { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #718096; }
        .author { font-weight: 600; color: #2d3748; }
        .body { margin: 8px 0; line-height: 1.6; color: #4a5568; }
        .actions { display: flex; gap: 12px; font-size: 13px; }
        .actions button {
          background: none; border: none; cursor: pointer;
          color: #718096; font-size: 13px; padding: 2px 4px;
        }
        .actions button:hover { background: #f7fafc; color: #2d3748; }
        .collapsed .body, .collapsed .actions, .collapsed .children { display: none; }
        .vote-count { font-weight: 600; }
      </style>
      <div class="thread"></div>
    `;

    const container = this.shadowRoot.querySelector(".thread");
    this._comments.forEach((c) => {
      container.appendChild(this._renderComment(c, 0));
    });
  }

  _renderComment(comment, depth) {
    const el = document.createElement("div");
    el.className = `comment depth-${depth}`;
    el.style.marginLeft = depth > 0 ? "20px" : "0";

    el.innerHTML = `
      <div class="header">
        <button class="collapse-btn">[–]</button>
        <span class="author">👤 ${comment.author}</span>
      </div>
      <div class="body">${comment.text}</div>
      <div class="actions">
        <button class="up">▲</button>
        <span class="vote-count">${comment.votes}</span>
        <button class="down">▼</button>
        <button class="reply-btn">💬 Reply</button>
      </div>
      <div class="children"></div>
    `;

    // Collapse:
    el.querySelector(".collapse-btn").addEventListener("click", () => {
      el.classList.toggle("collapsed");
    });

    // Vote:
    const vc = el.querySelector(".vote-count");
    el.querySelector(".up").addEventListener("click", () => {
      comment.votes++;
      vc.textContent = comment.votes;
    });
    el.querySelector(".down").addEventListener("click", () => {
      comment.votes--;
      vc.textContent = comment.votes;
    });

    // Children — ĐỆ QUY!
    const childrenEl = el.querySelector(".children");
    (comment.children || []).forEach((child) => {
      childrenEl.appendChild(this._renderComment(child, depth + 1));
    });

    return el;
  }
}

customElements.define("my-reddit-thread", MyRedditThread);
```

```html
<!-- Usage -->
<my-reddit-thread id="thread"></my-reddit-thread>
<script>
  document.querySelector("#thread").comments = [
    {
      id: 1,
      author: "alice",
      text: "Hello!",
      votes: 42,
      children: [
        { id: 2, author: "bob", text: "Reply!", votes: 15, children: [] },
      ],
    },
  ];
</script>
```

---

# 🖼️ Component 8: Gallery (Carousel + Lightbox)

## Kiến Trúc Gallery

```
GALLERY:
═══════════════════════════════════════════════════════════════

  Thumbnails Grid:
  ┌──────┬──────┬──────┬──────┐
  │ img1 │ img2 │ img3 │ img4 │  ← click → open lightbox!
  └──────┴──────┴──────┴──────┘
  ┌──────┬──────┬──────┐
  │ img5 │ img6 │ img7 │
  └──────┴──────┴──────┘

  Lightbox (overlay khi click thumbnail):
  ┌─────────────────────────────────────────┐
  │  ┌──────────────────────────────────┐   │
  │  │                                  │   │
  │  │        ← [◀]  IMAGE  [▶] →      │   │
  │  │                                  │   │
  │  └──────────────────────────────────┘   │
  │              3 / 7                [×]   │
  └─────────────────────────────────────────┘

  Carousel (inline):
  ◀ │ ████████████████████████ │ ▶
      ○ ○ ● ○ ○  (dots)

  Features:
  • Click thumbnail → lightbox overlay!
  • ←/→ arrow keys navigate!
  • Swipe trên touch device!
  • Dots indicator (current position)!
  • Escape đóng lightbox!
  • Preload ảnh kế tiếp!
```

---

## §8.1 Gallery — Vanilla JavaScript

```css
/* ═══ CSS ═══ */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  font-family: system-ui, sans-serif;
}
.gallery-grid img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s;
}
.gallery-grid img:hover {
  transform: scale(1.03);
  opacity: 0.9;
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.lightbox-overlay.hidden {
  display: none;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}
.lightbox-content img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
}
.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 24px;
  padding: 16px 12px;
  cursor: pointer;
  border-radius: 4px;
}
.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.4);
}
.lightbox-prev {
  left: -60px;
}
.lightbox-next {
  right: -60px;
}

.lightbox-counter {
  text-align: center;
  color: #a0aec0;
  margin-top: 12px;
  font-size: 14px;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}
.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e0;
  border: none;
  cursor: pointer;
}
.carousel-dot.active {
  background: #3182ce;
}
```

```javascript
// ═══ Vanilla JS Gallery ═══

class Gallery {
  constructor(container, images) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.images = images; // [{src, alt, thumb?}]
    this.currentIndex = 0;
    this._render();
    this._setupKeyboard();
  }

  _render() {
    // Grid thumbnails:
    const grid = document.createElement("div");
    grid.className = "gallery-grid";

    this.images.forEach((img, i) => {
      const el = document.createElement("img");
      el.src = img.thumb || img.src;
      el.alt = img.alt || "";
      el.addEventListener("click", () => this.openLightbox(i));
      grid.appendChild(el);
    });

    // Lightbox overlay:
    this.overlay = document.createElement("div");
    this.overlay.className = "lightbox-overlay hidden";
    this.overlay.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Đóng">×</button>
        <button class="lightbox-nav lightbox-prev" aria-label="Trước">◀</button>
        <button class="lightbox-nav lightbox-next" aria-label="Sau">▶</button>
        <img src="" alt="" />
        <div class="lightbox-counter"></div>
      </div>
    `;

    // Events:
    this.overlay
      .querySelector(".lightbox-close")
      .addEventListener("click", () => this.closeLightbox());
    this.overlay
      .querySelector(".lightbox-prev")
      .addEventListener("click", () => this.prev());
    this.overlay
      .querySelector(".lightbox-next")
      .addEventListener("click", () => this.next());
    // Click overlay (ngoài ảnh) → đóng:
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.closeLightbox();
    });

    // Touch swipe:
    let touchStartX = 0;
    this.overlay.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    });
    this.overlay.addEventListener("touchend", (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 50) {
        // Swipe > 50px!
        diff > 0 ? this.prev() : this.next();
      }
    });

    this.container.appendChild(grid);
    document.body.appendChild(this.overlay);
  }

  openLightbox(index) {
    this.currentIndex = index;
    this.overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // scroll lock!
    this._updateLightbox();
    this._preloadAdjacent(); // preload ảnh kế!
  }

  closeLightbox() {
    this.overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  prev() {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    this._updateLightbox();
    this._preloadAdjacent();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this._updateLightbox();
    this._preloadAdjacent();
  }

  _updateLightbox() {
    const img = this.overlay.querySelector("img");
    const counter = this.overlay.querySelector(".lightbox-counter");
    img.src = this.images[this.currentIndex].src;
    img.alt = this.images[this.currentIndex].alt || "";
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }

  _preloadAdjacent() {
    // Preload ảnh trước và sau để chuyển ảnh nhanh hơn!
    const preload = (index) => {
      const i = (index + this.images.length) % this.images.length;
      const img = new Image();
      img.src = this.images[i].src;
    };
    preload(this.currentIndex + 1);
    preload(this.currentIndex - 1);
  }

  _setupKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (this.overlay.classList.contains("hidden")) return;
      if (e.key === "Escape") this.closeLightbox();
      if (e.key === "ArrowLeft") this.prev();
      if (e.key === "ArrowRight") this.next();
    });
  }
}

// Usage:
const gallery = new Gallery("#gallery", [
  { src: "/img/photo1.jpg", alt: "Sunset", thumb: "/img/photo1-thumb.jpg" },
  { src: "/img/photo2.jpg", alt: "Mountain" },
  { src: "/img/photo3.jpg", alt: "Ocean" },
]);
```

### 📖 RADIO Walkthrough — Gallery (Vanilla JS)

> **R — Requirements:**
>
> - Hiển thị grid ảnh thumbnail, click mở lightbox toàn màn hình
> - Navigation: ←/→ arrows, dots indicator, touch swipe
> - Keyboard: Escape đóng, ArrowLeft/Right chuyển ảnh
> - Preload ảnh kế (chuyển ảnh tức thì, không chờ load!)
> - Scroll lock khi lightbox mở

> **A — Architecture:**
> Class `Gallery` quản lý 2 phần: grid (thumbnails) + overlay (lightbox). Grid nằm trong container, overlay append trực tiếp vào `document.body` (tương tự Portal trong React) để đảm bảo nổi trên tất cả content.

> **I — Implementation:**

**`openLightbox(index)` — tại sao scroll lock?**

```javascript
document.body.style.overflow = "hidden";
```

Khi lightbox mở, ta **khoá scroll trang**. Nếu không: user scroll chuột → page phía dưới cuộn → trải nghiệm kỳ lạ! `overflow: hidden` trên body ngăn scroll bar hiển thị và scroll behavior.

**`_preloadAdjacent()` — tại sao preload?**

```javascript
const img = new Image();
img.src = this.images[i].src;
```

`new Image()` tạo 1 element `<img>` **trong memory** (không thêm vào DOM!). Khi set `.src`, browser BẮT ĐẦU DOWNLOAD ảnh và cache lại. Khi user chuyển sang ảnh đó → ảnh đã có trong cache → hiển thị **TỨC THÌ**! Đây là kỹ thuật **image preloading**.

**Touch swipe — cách phát hiện hướng vuốt:**

```javascript
// touchstart: ghi nhớ vị trí X ban đầu
touchStartX = e.touches[0].clientX;
// touchend: so sánh vị trí X cuối cùng
const diff = e.changedTouches[0].clientX - touchStartX;
// diff > 50 (vuốt phải) → prev    diff < -50 (vuốt trái) → next
```

Loại bỏ vuốt < 50px (threshold) để tránh chuyển ảnh khi user chỉ chạm nhẹ.

**Modulo navigation — `%` operator:**

```javascript
(this.currentIndex + 1) % this.images.length;
// index = 6, length = 7 → (6+1) % 7 = 0 → quay lại ảnh đầu!
// index = 0, length = 7 → (0-1+7) % 7 = 6 → nhảy về ảnh cuối!
```

> **O — Optimization:**
>
> - Thumbnail dùng ảnh nhỏ (`thumb`) thay vì full-size → load nhanh
> - Preload chỉ 2 ảnh kế (trước + sau), không preload tất cả
> - Keyboard listener chỉ active khi lightbox mở

---

## §8.2 Gallery — React

```javascript
// ═══ React Gallery ═══
import { useState, useCallback, useEffect, useRef } from "react";

function useGallery(images) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard:
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxOpen, close, prev, next]);

  // Preload ảnh kế tiếp:
  useEffect(() => {
    if (!lightboxOpen) return;
    const preload = (offset) => {
      const i = (currentIndex + offset + images.length) % images.length;
      const img = new Image();
      img.src = images[i].src;
    };
    preload(1);
    preload(-1);
  }, [currentIndex, images, lightboxOpen]);

  return {
    lightboxOpen,
    currentIndex,
    current: images[currentIndex],
    open,
    close,
    prev,
    next,
    total: images.length,
  };
}

function Gallery({ images }) {
  const gallery = useGallery(images);
  const touchRef = useRef(0);

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="gallery-grid">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.thumb || img.src}
            alt={img.alt || ""}
            onClick={() => gallery.open(i)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {gallery.lightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) gallery.close();
          }}
          onTouchStart={(e) => {
            touchRef.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].clientX - touchRef.current;
            if (diff > 50) gallery.prev();
            else if (diff < -50) gallery.next();
          }}
        >
          <div className="lightbox-content">
            <button className="lightbox-close" onClick={gallery.close}>
              ×
            </button>
            <button
              className="lightbox-nav lightbox-prev"
              onClick={gallery.prev}
            >
              ◀
            </button>
            <button
              className="lightbox-nav lightbox-next"
              onClick={gallery.next}
            >
              ▶
            </button>
            <img src={gallery.current.src} alt={gallery.current.alt || ""} />
            <div className="lightbox-counter">
              {gallery.currentIndex + 1} / {gallery.total}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### §8.3 Advanced React Patterns — Gallery

```javascript
// ═══ PATTERN 1: Lazy Load Images ═══
// Chỉ load ảnh khi scroll đến!

function LazyImage({ src, alt, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }, // load trước 100px!
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={loaded ? src : undefined}
      alt={alt}
      style={{ background: "#f0f0f0", minHeight: 150 }}
      {...props}
    />
  );
}

// ═══ PATTERN 2: Zoom on Hover ═══
function ZoomableImage({ src, alt }) {
  const [zoom, setZoom] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      style={{ overflow: "hidden", cursor: "zoom-in" }}
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        style={{
          transform: zoom ? "scale(2)" : "scale(1)",
          transformOrigin: `${position.x}% ${position.y}%`,
          transition: zoom ? "none" : "transform 0.3s",
        }}
      />
    </div>
  );
}

// ═══ PATTERN 3: Infinite Carousel (auto-play!) ═══
function useAutoPlay(next, interval = 3000, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, interval, enabled]);
}
```

---

## §8.4 Gallery — Web Component

```javascript
// ═══ Web Component Gallery ═══

class MyGallery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._images = [];
    this._currentIndex = 0;
    this._lightboxOpen = false;
  }

  set images(val) {
    this._images = val;
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
        }
        .grid img {
          width: 100%; height: 150px; object-fit: cover;
          border-radius: 8px; cursor: pointer;
          transition: transform 0.2s;
        }
        .grid img:hover { transform: scale(1.03); }

        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.9);
          display: none; align-items: center; justify-content: center;
          z-index: 9999;
        }
        .overlay.open { display: flex; }
        .content { position: relative; }
        .content img { max-width: 90vw; max-height: 85vh; border-radius: 8px; }
        .close-btn {
          position: absolute; top: -40px; right: 0;
          background: none; border: none; color: #fff;
          font-size: 28px; cursor: pointer;
        }
        .nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.2); color: #fff;
          border: none; font-size: 24px; padding: 16px; cursor: pointer;
        }
        .prev { left: -60px; }
        .next { right: -60px; }
        .counter { text-align: center; color: #a0aec0; margin-top: 12px; }
      </style>

      <div class="grid">
        ${this._images
          .map(
            (img, i) =>
              `<img src="${img.thumb || img.src}" alt="${img.alt || ""}"
                data-i="${i}" />`,
          )
          .join("")}
      </div>

      <div class="overlay">
        <div class="content">
          <button class="close-btn">×</button>
          <button class="nav prev">◀</button>
          <button class="nav next">▶</button>
          <img src="" alt="" class="main-img" />
          <div class="counter"></div>
        </div>
      </div>
    `;

    // Grid click:
    this.shadowRoot.querySelectorAll(".grid img").forEach((img) => {
      img.addEventListener("click", () => {
        this._open(parseInt(img.dataset.i));
      });
    });

    const overlay = this.shadowRoot.querySelector(".overlay");
    overlay
      .querySelector(".close-btn")
      .addEventListener("click", () => this._close());
    overlay
      .querySelector(".prev")
      .addEventListener("click", () => this._nav(-1));
    overlay
      .querySelector(".next")
      .addEventListener("click", () => this._nav(1));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this._close();
    });
  }

  _open(index) {
    this._currentIndex = index;
    this._lightboxOpen = true;
    this.shadowRoot.querySelector(".overlay").classList.add("open");
    this._update();
  }

  _close() {
    this._lightboxOpen = false;
    this.shadowRoot.querySelector(".overlay").classList.remove("open");
  }

  _nav(dir) {
    this._currentIndex =
      (this._currentIndex + dir + this._images.length) % this._images.length;
    this._update();
  }

  _update() {
    const img = this.shadowRoot.querySelector(".main-img");
    const counter = this.shadowRoot.querySelector(".counter");
    img.src = this._images[this._currentIndex].src;
    counter.textContent = `${this._currentIndex + 1} / ${this._images.length}`;
  }
}

customElements.define("my-gallery", MyGallery);
```

```html
<!-- Usage -->
<my-gallery id="gal"></my-gallery>
<script>
  document.querySelector("#gal").images = [
    { src: "/img/1.jpg", thumb: "/img/1-sm.jpg", alt: "Photo 1" },
    { src: "/img/2.jpg", alt: "Photo 2" },
    { src: "/img/3.jpg", alt: "Photo 3" },
  ];
</script>
```

---

# ☑️ Component 9: Nested Checkboxes

## Kiến Trúc Nested Checkboxes

```
NESTED CHECKBOXES (Tree với tri-state!):
═══════════════════════════════════════════════════════════════

  ☑ Tất cả Files              ← checked (tất cả con checked!)
  ├── ☑ Documents
  │   ├── ☑ resume.pdf
  │   └── ☑ cover-letter.docx
  ├── ▣ Images                 ← INDETERMINATE (1 số con checked!)
  │   ├── ☑ photo1.jpg
  │   └── ☐ photo2.jpg         ← unchecked!
  └── ☐ Videos                 ← unchecked
      ├── ☐ video1.mp4
      └── ☐ video2.mov

  TRI-STATE:
  ☐ = unchecked (không con nào checked)
  ☑ = checked (TẤT CẢ con checked)
  ▣ = indeterminate (MỘT SỐ con checked!)

  Rules:
  1. Check parent → check TẤT CẢ children!
  2. Uncheck parent → uncheck TẤT CẢ children!
  3. Check/uncheck child → parent tự tính lại!
  4. ĐỆ QUY cascade lên ancestor!
```

---

## §9.1 Nested Checkboxes — Vanilla JavaScript

```css
.checkbox-tree {
  font-family: system-ui, sans-serif;
}
.checkbox-tree ul {
  list-style: none;
  padding-left: 24px;
  margin: 4px 0;
}
.checkbox-tree > ul {
  padding-left: 0;
}
.checkbox-tree label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  font-size: 15px;
}
.checkbox-tree input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3182ce;
}
.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  width: 20px;
  color: #718096;
}
```

```javascript
// ═══ Vanilla JS Nested Checkboxes ═══

class NestedCheckboxes {
  constructor(container, data) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.data = data; // [{id, label, children?, checked?}]
    this._render();
  }

  _render() {
    this.container.innerHTML = "";
    this.container.className = "checkbox-tree";
    this.container.appendChild(this._renderLevel(this.data));
  }

  _renderLevel(items) {
    const ul = document.createElement("ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      const hasChildren = item.children?.length > 0;
      const label = document.createElement("label");

      // Toggle button (expand/collapse):
      if (hasChildren) {
        const btn = document.createElement("button");
        btn.className = "toggle-btn";
        btn.textContent = "▼";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const childUl = li.querySelector(":scope > ul");
          if (childUl) {
            const hidden = childUl.style.display === "none";
            childUl.style.display = hidden ? "" : "none";
            btn.textContent = hidden ? "▼" : "▶";
          }
        });
        label.appendChild(btn);
      }

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = item.checked || false;

      cb.addEventListener("change", () => {
        item.checked = cb.checked;
        // Cascade XUỐNG:
        if (hasChildren) {
          this._setAll(item.children, cb.checked);
          li.querySelectorAll("input").forEach((c) => {
            if (c !== cb) {
              c.checked = cb.checked;
              c.indeterminate = false;
            }
          });
        }
        // Cascade LÊN:
        this._recalculate(this.container);
      });

      label.appendChild(cb);
      label.appendChild(document.createTextNode(item.label));
      li.appendChild(label);

      if (hasChildren) li.appendChild(this._renderLevel(item.children));
      ul.appendChild(li);
    });
    return ul;
  }

  _setAll(children, checked) {
    children.forEach((c) => {
      c.checked = checked;
      if (c.children) this._setAll(c.children, checked);
    });
  }

  // Duyệt từ LÁ lên GỐC, tính lại parent state:
  _recalculate(root) {
    const uls = root.querySelectorAll("ul");
    for (let i = uls.length - 1; i >= 0; i--) {
      const parentCb = uls[i].parentElement?.querySelector(
        ":scope > label > input",
      );
      if (!parentCb) continue;
      const children = uls[i].querySelectorAll(":scope > li > label > input");
      let checked = 0;
      children.forEach((c) => {
        if (c.checked) checked++;
      });
      parentCb.checked = checked === children.length;
      parentCb.indeterminate = checked > 0 && checked < children.length;
    }
  }

  getChecked() {
    const result = [];
    const collect = (items) => {
      items.forEach((item) => {
        if (item.checked && !item.children?.length) result.push(item);
        if (item.children) collect(item.children);
      });
    };
    collect(this.data);
    return result;
  }
}

// Usage:
const tree = new NestedCheckboxes("#tree", [
  {
    id: "root",
    label: "All Files",
    children: [
      {
        id: "docs",
        label: "Documents",
        children: [
          { id: "f1", label: "resume.pdf", checked: true },
          { id: "f2", label: "cover.docx", checked: true },
        ],
      },
      {
        id: "imgs",
        label: "Images",
        children: [
          { id: "p1", label: "photo1.jpg", checked: true },
          { id: "p2", label: "photo2.jpg", checked: false },
        ],
      },
    ],
  },
]);
```

### 📖 RADIO Walkthrough — Nested Checkboxes (Vanilla JS)

> **R — Requirements:**
>
> - Hiển thị tree checkboxes với nesting vô hạn
> - Tri-state: checked ☑, unchecked ☐, indeterminate ▣
> - Check parent → check ALL children (cascade xuống)
> - Toggle child → recalculate parent state (cascade lên)
> - Expand/collapse nhánh cây
> - API: `getChecked()` lấy danh sách leaf đã check

> **A — Architecture:**
> Class `NestedCheckboxes` dùng **2 chiều cascade**: xuống (parent → children) và lên (child → ancestors). Render đệ quy bằng `_renderLevel()`. State update dùng DOM queries thay vì data binding.

> **I — Implementation:**

**`:scope > ul` — selector quan trọng!**

```javascript
const childUl = li.querySelector(":scope > ul");
```

`:scope` = **chính element đang gọi** (tức `li`). `:scope > ul` = "tìm `<ul>` là **con trực tiếp** của `li` này". Nếu chỉ viết `li.querySelector('ul')` → sẽ tìm **BẤT KỲ** `<ul>` bên trong, kể cả cháu chắt → **SAI!** Ta chỉ muốn `<ul>` con trực tiếp!

**`_recalculate()` — bottom-up traversal:**

```javascript
for (let i = uls.length - 1; i >= 0; i--) { ... }
```

Tại sao duyệt **NGƯỢC** (từ cuối lên đầu)? Vì `querySelectorAll('ul')` trả về theo thứ tự DFS (sâu trước). Element cuối cùng = sâu nhất (lá). Ta phải tính state lá trước, rồi mới tính cha, rồi ông... Nếu duyệt xuôi: cha tính trước lá → state cha sẽ **SAI** vì lá chưa được tính!

```
Ví dụ:

All Files (uls[0])      ← tính SAU!
├── Documents (uls[1])  ← tính SAU!
│   ├── resume.pdf
│   └── cover.docx
└── Images (uls[2])     ← tính TRƯỚC!
    ├── photo1.jpg
    └── photo2.jpg

Duyệt: uls[2] → uls[1] → uls[0] (từ lá lên gốc!)
```

**Cascade xuống — `_setAll()`:**

Khi user check parent → ta phải set TẤT CẢ descendants = checked. `_setAll()` đệ quy: set `c.checked = true` rồi gọi tiếp cho `c.children`. Đồng thời update DOM: `li.querySelectorAll('input')` chọn tất cả checkbox bên trong rồi set checked + clear indeterminate.

**`getChecked()` — chỉ lấy LEAF nodes:**

Tại sao chỉ lấy lá? Vì node cha chỉ là **folder/category** — không phải item thật. Ví dụ: user chọn "Documents" folder → ta cần biết file nào: `resume.pdf`, `cover.docx` — chứ không phải tên folder!

### 📖 Giải thích: Indeterminate State

```
INDETERMINATE = trạng thái THỨ 3 của checkbox!

☐ checked=false    ☑ checked=true    ▣ indeterminate=true

QUAN TRỌNG:
• indeterminate CHỈ là VISUAL! Không có HTML attribute!
• Chỉ set được bằng JavaScript: checkbox.indeterminate = true;
• <input indeterminate> ← KHÔNG HỢP LỆ trong HTML!

Cascade logic:
  Check parent    → ALL children = checked
  Uncheck parent  → ALL children = unchecked
  Check child     → recalculate parent:
                     all?  → ☑    some? → ▣    none? → ☐
  → Cascade LÊN đến gốc!
```

---

## §9.2 Nested Checkboxes — React

```javascript
// ═══ React Nested Checkboxes ═══
import { useState, useCallback, useMemo } from "react";

function setCheckedDeep(node, checked) {
  return {
    ...node,
    checked,
    children: node.children?.map((c) => setCheckedDeep(c, checked)),
  };
}

function getParentState(children) {
  const allChecked = children.every((c) => c.checked && !c.indeterminate);
  const someChecked = children.some((c) => c.checked || c.indeterminate);
  return {
    checked: allChecked,
    indeterminate: !allChecked && someChecked,
  };
}

function updateNode(tree, targetId, checked) {
  return tree.map((node) => {
    if (node.id === targetId) return setCheckedDeep(node, checked);
    if (node.children) {
      const updated = updateNode(node.children, targetId, checked);
      return { ...node, children: updated, ...getParentState(updated) };
    }
    return node;
  });
}

function CheckboxNode({ node, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <li>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hasChildren && (
          <button
            className="toggle-btn"
            onClick={(e) => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "▼" : "▶"}
          </button>
        )}
        <input
          type="checkbox"
          checked={node.checked || false}
          ref={(el) => {
            // ref callback: set indeterminate (no JSX prop!)
            if (el) el.indeterminate = node.indeterminate || false;
          }}
          onChange={(e) => onChange(node.id, e.target.checked)}
        />
        {node.label}
      </label>
      {hasChildren && expanded && (
        <ul style={{ listStyle: "none", paddingLeft: 24 }}>
          {node.children.map((child) => (
            <CheckboxNode key={child.id} node={child} onChange={onChange} />
          ))}
        </ul>
      )}
    </li>
  );
}

function NestedCheckboxes({ initialData }) {
  const [data, setData] = useState(initialData);
  const handleChange = useCallback((id, checked) => {
    setData((prev) => updateNode(prev, id, checked));
  }, []);

  return (
    <div className="checkbox-tree">
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data.map((node) => (
          <CheckboxNode key={node.id} node={node} onChange={handleChange} />
        ))}
      </ul>
    </div>
  );
}
```

---

### §9.3 Advanced React Patterns — Nested Checkboxes

```javascript
// ═══ PATTERN 1: Search/Filter Tree ═══
function useTreeSearch(data) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return data;
    const filter = (node) => {
      if (node.label.toLowerCase().includes(search.toLowerCase())) return node;
      if (node.children) {
        const fc = node.children.map(filter).filter(Boolean);
        if (fc.length) return { ...node, children: fc };
      }
      return null;
    };
    return data.map(filter).filter(Boolean);
  }, [data, search]);
  return { search, setSearch, filtered };
}

// ═══ PATTERN 2: Flat Set cho performance ═══
function useFlatCheckbox(data) {
  const [checkedIds, setCheckedIds] = useState(new Set());
  const toggle = useCallback((id, descendants = []) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      const isChecked = next.has(id);
      [id, ...descendants].forEach((d) => {
        if (isChecked) next.delete(d);
        else next.add(d);
      });
      return next;
    });
  }, []);
  return { checkedIds, toggle };
}
```

---

## §9.4 Nested Checkboxes — Web Component

```javascript
// ═══ Web Component Nested Checkboxes ═══

class MyCheckboxTree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = [];
  }

  set data(val) {
    this._data = val;
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, sans-serif; }
        ul { list-style: none; padding-left: 24px; margin: 4px 0; }
        label { display: flex; align-items: center; gap: 8px;
                cursor: pointer; padding: 4px 0; font-size: 15px; }
        input { width: 18px; height: 18px; accent-color: #3182ce; }
        .toggle { background: none; border: none; cursor: pointer; font-size: 12px; }
      </style>
    `;
    this.shadowRoot.appendChild(this._renderLevel(this._data));
  }

  _renderLevel(items) {
    const ul = document.createElement("ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      const hasChildren = item.children?.length > 0;
      const label = document.createElement("label");

      if (hasChildren) {
        const toggle = document.createElement("button");
        toggle.className = "toggle";
        toggle.textContent = "▼";
        toggle.addEventListener("click", (e) => {
          e.preventDefault();
          const childUl = li.querySelector(":scope > ul");
          if (childUl) {
            const h = childUl.style.display === "none";
            childUl.style.display = h ? "" : "none";
            toggle.textContent = h ? "▼" : "▶";
          }
        });
        label.appendChild(toggle);
      }

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = item.checked || false;
      cb.addEventListener("change", () => {
        item.checked = cb.checked;
        if (hasChildren) {
          this._setAll(item.children, cb.checked);
          li.querySelectorAll("input").forEach((c) => {
            if (c !== cb) {
              c.checked = cb.checked;
              c.indeterminate = false;
            }
          });
        }
        this._recalculate(this.shadowRoot);
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: { id: item.id, checked: cb.checked },
            bubbles: true,
          }),
        );
      });

      label.appendChild(cb);
      label.appendChild(document.createTextNode(item.label));
      li.appendChild(label);
      if (hasChildren) li.appendChild(this._renderLevel(item.children));
      ul.appendChild(li);
    });
    return ul;
  }

  _setAll(children, checked) {
    children.forEach((c) => {
      c.checked = checked;
      if (c.children) this._setAll(c.children, checked);
    });
  }

  _recalculate(root) {
    const uls = root.querySelectorAll("ul");
    for (let i = uls.length - 1; i >= 0; i--) {
      const pcb = uls[i].parentElement?.querySelector(":scope > label > input");
      if (!pcb) continue;
      const cbs = uls[i].querySelectorAll(":scope > li > label > input");
      let n = 0;
      cbs.forEach((c) => {
        if (c.checked) n++;
      });
      pcb.checked = n === cbs.length;
      pcb.indeterminate = n > 0 && n < cbs.length;
    }
  }
}

customElements.define("my-checkbox-tree", MyCheckboxTree);
```

```html
<!-- Usage -->
<my-checkbox-tree id="tree"></my-checkbox-tree>
<script>
  document.querySelector("#tree").data = [
    {
      id: "root",
      label: "All Files",
      children: [
        {
          id: "docs",
          label: "Documents",
          children: [
            { id: "f1", label: "resume.pdf", checked: true },
            { id: "f2", label: "cover.docx", checked: false },
          ],
        },
      ],
    },
  ];
</script>
```

---

# 🔔 Component 10: Toast (Notification)

## Kiến Trúc Toast

```
TOAST NOTIFICATION:
═══════════════════════════════════════════════════════════════

  ┌─── Page Content ──────────────────────────────┐
  │                                                │
  │                              Toast Container   │
  │                              (fixed, top-right) │
  │                              ┌──────────────┐  │
  │                              │ ✅ Lưu xong!  │  │
  │                              │         [×]   │  │
  │                              └──────────────┘  │
  │                              ┌──────────────┐  │
  │                              │ ⚠️ Cảnh báo   │  │
  │                              │         [×]   │  │
  │                              └──────────────┘  │
  │                              ┌──────────────┐  │
  │                              │ ❌ Lỗi xảy ra │  │
  │                              │         [×]   │  │
  │                              └──────────────┘  │
  └────────────────────────────────────────────────┘

  Types: success ✅ | error ❌ | warning ⚠️ | info ℹ️
  Features:
  • Auto-dismiss (3-5 giây!)
  • Stack nhiều toasts!
  • Close button (×)
  • Slide-in / slide-out animation!
  • Pause auto-dismiss khi hover!
  • Position: top-right, bottom-right, etc.
```

---

## §10.1 Toast — Vanilla JavaScript

```css
/* ═══ CSS ═══ */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 99999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 10px;
  color: #fff;
  font-family: system-ui, sans-serif;
  font-size: 14px;
  min-width: 300px;
  max-width: 420px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  animation: slideIn 0.3s ease;
}
.toast.removing {
  animation: slideOut 0.3s ease forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast-success {
  background: #38a169;
}
.toast-error {
  background: #e53e3e;
}
.toast-warning {
  background: #dd6b20;
}
.toast-info {
  background: #3182ce;
}

.toast-icon {
  font-size: 20px;
}
.toast-message {
  flex: 1;
  line-height: 1.4;
}
.toast-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
}
.toast-close:hover {
  color: #fff;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 10px 10px;
}
.toast-progress-bar {
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 0 0 10px 10px;
  transition: width linear;
}
```

```javascript
// ═══ Vanilla JS Toast — Singleton Pattern ═══

class ToastManager {
  // Singleton: chỉ có 1 instance duy nhất!
  static instance = null;
  static getInstance() {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  constructor() {
    if (ToastManager.instance) return ToastManager.instance;
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
    this.toasts = [];
  }

  // Public API:
  success(message, duration = 4000) {
    return this._show({ type: "success", icon: "✅", message, duration });
  }
  error(message, duration = 6000) {
    return this._show({ type: "error", icon: "❌", message, duration });
  }
  warning(message, duration = 5000) {
    return this._show({ type: "warning", icon: "⚠️", message, duration });
  }
  info(message, duration = 4000) {
    return this._show({ type: "info", icon: "ℹ️", message, duration });
  }

  _show({ type, icon, message, duration }) {
    const id = Date.now() + Math.random();
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.style.position = "relative";

    el.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Đóng">×</button>
      <div class="toast-progress">
        <div class="toast-progress-bar" style="width: 100%"></div>
      </div>
    `;

    // Close button:
    el.querySelector(".toast-close").addEventListener("click", () =>
      this._dismiss(id),
    );

    // Auto-dismiss timer:
    const progressBar = el.querySelector(".toast-progress-bar");
    let remaining = duration;
    let startTime = Date.now();

    const startTimer = () => {
      startTime = Date.now();
      progressBar.style.transition = `width ${remaining}ms linear`;
      progressBar.style.width = "0%";
      timer = setTimeout(() => this._dismiss(id), remaining);
    };

    let timer;

    // Pause on hover!
    el.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      remaining -= Date.now() - startTime;
      progressBar.style.transition = "none";
      const current = (remaining / duration) * 100;
      progressBar.style.width = `${current}%`;
    });

    el.addEventListener("mouseleave", () => {
      startTimer();
    });

    this.container.appendChild(el);
    this.toasts.push({ id, el, timer });

    startTimer();
    return id;
  }

  _dismiss(id) {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index === -1) return;

    const { el, timer } = this.toasts[index];
    clearTimeout(timer);
    el.classList.add("removing");

    // Xoá sau animation:
    el.addEventListener("animationend", () => {
      el.remove();
      this.toasts.splice(index, 1);
    });
  }
}

// Usage — Singleton pattern!
const toast = ToastManager.getInstance();
toast.success("Lưu thành công!");
toast.error("Có lỗi xảy ra!");
toast.warning("Cảnh báo: dữ liệu sắp hết!");
toast.info("Đã cập nhật phiên bản mới!");
```

### 📖 RADIO Walkthrough — Toast (Vanilla JS)

> **R — Requirements:**
>
> - Hiển thị notification ở góc màn hình (fixed position)
> - 4 loại: success ✅, error ❌, warning ⚠️, info ℹ️
> - Auto-dismiss sau N giây (có progress bar!)
> - Pause auto-dismiss khi hover (resume khi rời!)
> - Stack nhiều toasts (cái mới ở dưới cùng)
> - Slide-in/out animation (CSS @keyframes)

> **A — Architecture:**
> Dùng **Singleton pattern** — toàn app chỉ có 1 `ToastManager`. Container fixed ở `top-right`, mỗi toast là 1 div thêm vào. Timer auto-dismiss quản lý bằng `setTimeout`, pause bằng tính toán `remaining` time.

> **I — Implementation:**

**Progress bar — CSS transition trick:**

```javascript
progressBar.style.transition = `width ${remaining}ms linear`;
progressBar.style.width = "0%";
```

Progress bar bắt đầu ở `width: 100%` (đầy). Ta set CSS transition với duration bằng `remaining` ms, rồi set width = 0%. Browser tự animate từ `100% → 0%` trong đúng `remaining` ms = progress bar thu nhỏ đều đặn!

**Pause on hover — tính toán `remaining`:**

```javascript
// mouseenter: tạm dừng!
clearTimeout(timer); // huỷ timer đang chạy!
remaining -= Date.now() - startTime; // tính thời gian CÒN LẠI!
progressBar.style.transition = "none"; // dừng animation!
progressBar.style.width = `${(remaining / duration) * 100}%`; // freeze!

// mouseleave: tiếp tục!
startTimer(); // tạo timer MỚI với remaining time!
```

`remaining` = thời gian ban đầu - thời gian đã trôi. Ví dụ: toast 4000ms, hover sau 1500ms → remaining = 2500ms. Khi rời hover → set timer 2500ms (không phải 4000ms!).

**`pointer-events: none` trên container:**

```css
.toast-container {
  pointer-events: none;
}
.toast {
  pointer-events: auto;
}
```

Container phủ kín góc màn hình nhưng user KHÔNG THỂ click qua nó (vì fixed + z-index cao). `pointer-events: none` = container **trong suốt** với mouse! Nhưng mỗi toast con set `pointer-events: auto` = toast **NHẬN ĐƯỢC** click/hover. Kỹ thuật này cho phép click xuyên qua khoảng trống giữa các toasts!

**`animationend` event — xoá sau animation:**

```javascript
el.classList.add("removing"); // trigger slideOut animation!
el.addEventListener("animationend", () => {
  el.remove(); // xoá khỏi DOM SAU KHI animation xong!
});
```

Nếu xoá ngay → toast biến mất đột ngột! Thêm class `removing` trigger CSS `@keyframes slideOut`, chờ animation kết thúc rồi mới `el.remove()`.

> **O — Optimization:**
>
> - Giới hạn max toasts (ví dụ 5) — remove cái cũ nhất khi quá
> - Unique toast (không duplicate cùng message)
> - `requestAnimationFrame` thay `setTimeout` cho progress bar mượt hơn

### 📖 Giải thích: Singleton Pattern

```
SINGLETON = chỉ có DUY NHẤT 1 instance!

Tại sao Toast cần Singleton?
→ Toàn bộ app chỉ cần 1 toast container!
→ Nếu tạo nhiều → nhiều container chồng lên nhau → lỗi!

static instance = null;
static getInstance() {
  if (!ToastManager.instance) {
    // Lần đầu: tạo mới!
    ToastManager.instance = new ToastManager();
  }
  // Lần sau: trả về instance ĐÃ CÓ!
  return ToastManager.instance;
}

const a = ToastManager.getInstance();
const b = ToastManager.getInstance();
console.log(a === b); // true! CÙNG 1 instance!
```

---

## §10.2 Toast — React

```javascript
// ═══ React Toast — Context + Portal ═══
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

function ToastProvider({ children, position = "top-right" }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const addToast = useCallback(
    ({ type = "info", message, duration = 4000 }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      // Auto-dismiss:
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, {
        timer,
        remaining: duration,
        start: Date.now(),
      });

      return id;
    },
    [],
  );

  const dismiss = useCallback((id) => {
    const entry = timersRef.current.get(id);
    if (entry) clearTimeout(entry.timer);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pauseTimer = useCallback((id) => {
    const entry = timersRef.current.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    entry.remaining -= Date.now() - entry.start;
  }, []);

  const resumeTimer = useCallback(
    (id) => {
      const entry = timersRef.current.get(id);
      if (!entry) return;
      entry.start = Date.now();
      entry.timer = setTimeout(() => dismiss(id), entry.remaining);
    },
    [dismiss],
  );

  // Shorthand API:
  const toast = useCallback(
    {
      success: (msg, dur) =>
        addToast({ type: "success", message: msg, duration: dur }),
      error: (msg, dur) =>
        addToast({ type: "error", message: msg, duration: dur || 6000 }),
      warning: (msg, dur) =>
        addToast({ type: "warning", message: msg, duration: dur }),
      info: (msg, dur) =>
        addToast({ type: "info", message: msg, duration: dur }),
    },
    [addToast],
  );

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="toast-container" data-position={position}>
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast-${t.type}`}
              onClick={() => dismiss(t.id)}
              onMouseEnter={() => pauseTimer(t.id)}
              onMouseLeave={() => resumeTimer(t.id)}
            >
              <span className="toast-icon">{icons[t.type]}</span>
              <span className="toast-message">{t.message}</span>
              <button className="toast-close" onClick={() => dismiss(t.id)}>
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// Custom hook — sử dụng ở bất kỳ component nào!
function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider!");
  return ctx;
}

// Usage:
// <ToastProvider><App /></ToastProvider>
//
// function SaveButton() {
//   const toast = useToast();
//   return (
//     <button onClick={() => toast.success('Đã lưu!')}>
//       Lưu
//     </button>
//   );
// }
```

### 📖 Giải thích: React Portal

```
PORTAL = render component Ở NƠI KHÁC trong DOM!

Bình thường React render VÀO parent:
<App>
  <Page>
    <Button /> ← render bên trong Page
  </Page>
</App>

Với Portal:
createPortal(<Toast />, document.body)
→ Toast render TRỰC TIẾP vào <body>!
→ Không bị giới hạn bởi parent CSS (overflow, z-index...)!

Tại sao Toast cần Portal?
→ Toast phải NỔI TRÊN tất cả content!
→ Nếu parent có overflow: hidden → Toast bị cắt!
→ Portal đưa Toast ra ngoài parent → luôn visible!
```

---

### §10.3 Advanced React Patterns — Toast

```javascript
// ═══ PATTERN 1: useReducer cho phức tạp ═══
function toastReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast];
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    case "REMOVE_ALL":
      return [];
    case "UPDATE":
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.updates } : t,
      );
    default:
      return state;
  }
}

// ═══ PATTERN 2: Promise-based Toast ═══
// toast.promise(asyncFn, { loading, success, error })
function usePromiseToast() {
  const toast = useToast();

  return useCallback(
    async (promise, messages) => {
      const id = toast.info(messages.loading || "Đang xử lý...");

      try {
        const result = await promise;
        toast.success(messages.success || "Thành công!");
        return result;
      } catch (err) {
        toast.error(messages.error || err.message);
        throw err;
      }
    },
    [toast],
  );
}

// Usage:
// const promiseToast = usePromiseToast();
// promiseToast(
//   fetch('/api/save'),
//   { loading: 'Đang lưu...', success: 'Đã lưu!', error: 'Lỗi!' }
// );

// ═══ PATTERN 3: Unique Toast (không duplicate!) ═══
function useUniqueToast() {
  const toast = useToast();
  const activeIds = useRef(new Map());

  return useCallback(
    (key, type, message) => {
      if (activeIds.current.has(key)) return; // đã có → skip!
      const id = toast[type](message);
      activeIds.current.set(key, id);
      setTimeout(() => activeIds.current.delete(key), 5000);
    },
    [toast],
  );
}
```

---

## §10.4 Toast — Web Component

```javascript
// ═══ Web Component Toast ═══

class MyToastContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._toasts = [];
  }

  connectedCallback() {
    const position = this.getAttribute("position") || "top-right";
    const [vPos, hPos] = position.split("-");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          ${vPos === "bottom" ? "bottom" : "top"}: 20px;
          ${hPos === "left" ? "left" : "right"}: 20px;
          display: flex; flex-direction: column; gap: 10px;
          z-index: 99999; pointer-events: none;
        }
        .toast {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: 10px;
          color: #fff; font-family: system-ui, sans-serif;
          font-size: 14px; min-width: 300px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          pointer-events: auto; animation: slideIn 0.3s ease;
        }
        .toast.removing { animation: slideOut 0.3s ease forwards; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } }
        @keyframes slideOut { to { transform: translateX(100%); opacity: 0; } }
        .success { background: #38a169; }
        .error { background: #e53e3e; }
        .warning { background: #dd6b20; }
        .info { background: #3182ce; }
        .msg { flex: 1; }
        .close {
          background: none; border: none; color: rgba(255,255,255,0.7);
          font-size: 18px; cursor: pointer;
        }
        .close:hover { color: #fff; }
      </style>
      <div class="stack"></div>
    `;

    this._stack = this.shadowRoot.querySelector(".stack");
  }

  // Public API:
  success(msg, dur = 4000) {
    return this._add("success", "✅", msg, dur);
  }
  error(msg, dur = 6000) {
    return this._add("error", "❌", msg, dur);
  }
  warning(msg, dur = 5000) {
    return this._add("warning", "⚠️", msg, dur);
  }
  info(msg, dur = 4000) {
    return this._add("info", "ℹ️", msg, dur);
  }

  _add(type, icon, message, duration) {
    const id = Date.now() + Math.random();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span>${icon}</span>
      <span class="msg">${message}</span>
      <button class="close">×</button>
    `;

    el.querySelector(".close").addEventListener("click", () =>
      this._remove(el),
    );

    let timer = setTimeout(() => this._remove(el), duration);
    el.addEventListener("mouseenter", () => clearTimeout(timer));
    el.addEventListener("mouseleave", () => {
      timer = setTimeout(() => this._remove(el), 2000);
    });

    this._stack.appendChild(el);
    return id;
  }

  _remove(el) {
    el.classList.add("removing");
    el.addEventListener("animationend", () => el.remove());
  }
}

customElements.define("my-toast", MyToastContainer);
```

```html
<!-- Usage -->
<my-toast id="toaster" position="top-right"></my-toast>

<button onclick="document.querySelector('#toaster').success('Lưu thành công!')">
  ✅ Success
</button>
<button onclick="document.querySelector('#toaster').error('Có lỗi!')">
  ❌ Error
</button>
<button onclick="document.querySelector('#toaster').warning('Cảnh báo!')">
  ⚠️ Warning
</button>
<button onclick="document.querySelector('#toaster').info('Thông tin mới!')">
  ℹ️ Info
</button>
```
