# React File Explorer Interview Deep Dive

> Hướng dẫn xây dựng File Explorer Component với Hierarchical Tree Rendering & Expand/Collapse
> Giải thích theo cách Senior Engineer trình bày trong buổi phỏng vấn Big Tech

---

## PHẦN A: HƯỚNG DẪN IMPLEMENTATION CHI TIẾT

> 💡 **Mindset**: Đây là bài toán về **recursive tree rendering** với **expand/collapse state management**. Interviewer muốn thấy bạn handle tree traversal, sorting logic, và component composition.

### Tổng Quan Bài Toán

**Yêu cầu:**

- Hiển thị hierarchical file/directory structure (tree)
- Directories có thể expand/collapse khi click
- Directories hiển thị trước files (sorted alphabetically trong mỗi nhóm)
- Files là leaf nodes — không expandable
- Indent nội dung directory về bên phải
- Hỗ trợ arbitrary depth (nested directories)

#### 🔍 "Arbitrary depth" là gì?

**"Arbitrary"** = bất kỳ, không giới hạn. **"Arbitrary depth"** = **độ sâu bất kỳ** — tree có thể lồng (nest) sâu bao nhiêu cấp cũng được.

```
DEPTH = 1:
├── src/                    ← level 1

DEPTH = 2:
├── src/
│   ├── components/         ← level 2

DEPTH = 5:
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── buttons/
│   │   │   │   ├── primary/   ← level 5
│   │   │   │   │   └── PrimaryButton.tsx

CÂU HỎI: Component có handle được depth = 100 không?
TRẢ LỜI: CÓ — vì ta dùng RECURSION (component tự gọi lại chính nó).
Mỗi cấp là một lần gọi lại component, không cần biết trước có bao nhiêu cấp.
```

**So sánh:** Nếu dùng vòng lặp `for` → phải biết trước depth. Nếu dùng recursion → tự động handle bất kỳ depth.

---

**💬 Cách mở đầu với interviewer:**

> "Đây là bài toán về recursive tree rendering với local expand/collapse state. Khác với nested checkboxes, state ở đây là **local per-node** (mỗi directory tự quản lý expanded state), không cần bidirectional propagation. Tôi sẽ dùng recursive component pattern và sorting strategy directories-first."

#### 🔍 Giải thích từng khái niệm trong câu mở đầu

**1. "Local per-node" — mỗi directory tự quản lý expanded state**

"Per-node" = **mỗi node** (mỗi phần tử trong tree). "Local" = state **nằm ngay bên trong** component đó, KHÔNG chia sẻ với ai.

```tsx
// MỖI FileObject tự quản lý expanded CỦA CHÍNH NÓ:
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);
  // ↑ state NÀY chỉ thuộc về FileObject NÀY
  // → "src" folder có expanded riêng
  // → "components" folder có expanded riêng
  // → Chúng KHÔNG ảnh hưởng lẫn nhau

  // Click "src" → chỉ "src" mở/đóng
  // "components" (bên trong "src") vẫn giữ nguyên trạng thái
}
```

**Trực quan:**

```
Mỗi directory có "công tắc" riêng (expanded = true/false):

📁 src        [expanded: TRUE  ← công tắc CỦA src]
  📁 components [expanded: FALSE ← công tắc CỦA components]
  📄 index.ts
📁 public      [expanded: FALSE ← công tắc CỦA public]

Click vào "src" → chỉ đổi công tắc CỦA "src"
→ "components" và "public" KHÔNG BỊ ẢNH HƯỞNG

Giống như: mỗi phòng trong nhà có công tắc đèn riêng.
Bật đèn phòng khách ≠ bật đèn phòng ngủ.
```

**2. "Không cần bidirectional propagation" — so sánh với Nested Checkboxes**

**Bidirectional propagation** (truyền 2 chiều) = state chảy CẢ LÊN và XUỐNG trong tree:

```
NESTED CHECKBOXES (CẦN bidirectional):
☑ src/                 ← Check "src" → tất cả con PHẢI checked (XUỐNG ↓)
  ☑ components/
    ☑ Button.tsx
    ☑ Input.tsx
  ☑ index.ts

☐ src/                 ← Uncheck "Button.tsx" → "components" và "src"
  ☐ components/           phải tính lại trạng thái (LÊN ↑)
    ☐ Button.tsx        ← Thay đổi ở đây
    ☑ Input.tsx
  ☑ index.ts

→ State chảy XUỐNG (parent → children) + LÊN (child → parent)
→ PHỨC TẠP: phải propagate state 2 chiều
→ Cần biết trạng thái CỦA TẤT CẢ nodes để tính toán

───────────────────────────────────────────

FILE EXPLORER (KHÔNG cần bidirectional):
📂 src/        [click → toggle expanded]
  📂 components/ [click → toggle expanded riêng]
    📄 Button.tsx
  📄 index.ts

→ Mở "src" KHÔNG ảnh hưởng "components"
→ Mở "components" KHÔNG ảnh hưởng "src"
→ State chỉ LOCAL, KHÔNG TRUYỀN lên hay xuống
→ ĐƠN GIẢN hơn rất nhiều!
```

**3. "Recursive component pattern" — Component tự gọi lại chính nó**

**"Recursion"** = một hàm gọi lại chính nó. **"Recursive component"** = component render chính nó bên trong mình.

```
CẤU TRÚC GỌI:
FileExplorer
└── FileList (level=1)              ← FileList lần 1
    ├── FileObject ("src")
    │   └── FileList (level=2)      ← FileList lần 2 (GỌI LẠI CHÍNH NÓ)
    │       ├── FileObject ("App.tsx")
    │       └── FileObject ("components")
    │           └── FileList (level=3) ← FileList lần 3 (GỌI LẠI LẦN NỮA)
    │               └── FileObject ("Button.tsx")
    └── FileObject ("package.json")
```

```tsx
// FileList render FileObject → FileObject render FileList → ...
// Đây là RECURSIVE PATTERN:

function FileList({ fileList, level }: Props) {
  return (
    <ul>
      {fileList.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}

function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <button onClick={() => setExpanded(!expanded)}>{file.name}</button>
      {/* NẾU là directory VÀ đang expanded → render FileList BÊN TRONG */}
      {expanded && file.children && (
        <FileList fileList={file.children} level={level + 1} />
        //       ↑ FileList GỌI LẠI CHÍNH NÓ!
        //       Mỗi lần gọi, level tăng 1 → biết đang ở depth nào
      )}
    </li>
  );
}

// RECURSION DỪNG KHI NÀO?
// → Khi file.children không tồn tại (đây là FILE, không phải directory)
// → Hoặc khi expanded = false (directory đóng, không render children)
// → Đây gọi là "base case" — điều kiện dừng recursion
```

**4. "Sorting strategy directories-first" — Directories hiển thị trước files**

```
DỮ LIỆU GỐC (chưa sort):
├── index.ts       (file)
├── components/    (directory)
├── README.md      (file)
├── utils/         (directory)
├── app.css        (file)

SAU KHI SORT "directories-first":
├── components/    (directory) ← Directories TRƯỚC
├── utils/         (directory) ← Directories TRƯỚC, sorted A→Z
├── app.css        (file)     ← Files SAU
├── index.ts       (file)     ← Files SAU, sorted A→Z
├── README.md      (file)

LOGIC SORT:
1. CHIA thành 2 nhóm: directories vs files
2. SORT mỗi nhóm theo alphabet (a→z)
3. NỐI: directories trước + files sau
```

```tsx
// Code sort:
const sorted = [...fileList].sort((a, b) => {
  const aIsDir = Boolean(a.children); // CÓ children = directory
  const bIsDir = Boolean(b.children);

  // Bước 1: Directory luôn đứng trước File
  if (aIsDir && !bIsDir) return -1; // a là dir, b là file → a trước
  if (!aIsDir && bIsDir) return 1; // a là file, b là dir → b trước

  // Bước 2: Cùng loại → sort theo tên A→Z
  return a.name.localeCompare(b.name);
});
```

---

**🤔 Câu hỏi interviewer có thể hỏi ngay từ đầu:**

| Câu hỏi                       | Cách trả lời                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| "Tree depth có limit không?"  | "Không, component phải handle arbitrary depth. Recursive rendering." |
| "Performance với large tree?" | "Với 1000+ nodes, cần virtualization. MVP render all visible."       |
| "State management ở đâu?"     | "Expand/collapse state LOCAL per directory. Không cần lift state."   |
| "Sort order?"                 | "Directories first, then files. Both groups sorted alphabetically."  |
| "Empty directory?"            | "Render directory name nhưng không có children khi expand."          |
| "Persist expanded state?"     | "Clarify: nếu cần, dùng Set<id> ở parent hoặc localStorage."         |

#### 🔍 Giải thích chi tiết từng câu trả lời

**1. "Recursive rendering" xử lý arbitrary depth**

Interviewer hỏi: "Nếu tree có 50 cấp lồng nhau thì sao?"

```
TRẢ LỜI: Component dùng recursion — nó TỰ gọi lại chính nó.
Không cần biết trước có bao nhiêu cấp.

GIỐNG NHƯ: Gương soi gương — mỗi tầng lồng tạo ra hình ảnh mới,
vô hạn (trên lý thuyết).

THỰC TẾ: JavaScript có call stack limit (~10,000-15,000 frames).
Nhưng file tree thực tế hiếm khi sâu quá 20-30 cấp.
Nếu đến 1000 cấp → có thể là BUG (circular reference).
```

**2. "MVP render all visible" — Render tất cả nodes đang nhìn thấy**

**MVP** = **Minimum Viable Product** — phiên bản đơn giản nhất hoạt động được.

```
2 CÁCH RENDER TREE:

CÁCH 1: MVP — Render ALL visible (dùng cho bài phỏng vấn ✅)
├── Mỗi node đang expanded → render tất cả children
├── Node đang collapsed → KHÔNG render children (children bị unmount)
├── Đơn giản, dễ hiểu, hoạt động tốt với < 1000 nodes
├── Không cần thư viện bên ngoài

CÁCH 2: Virtualization — CHỈ render viewport (dùng cho production 🏭)
├── Tree có 10,000 nodes nhưng viewport chỉ thấy 30 nodes
├── CHỈ render 30 nodes đó, scroll → render nodes mới
├── Cần thư viện: react-window, react-virtuoso, tanstack-virtual
├── Phức tạp hơn nhiều

TRONG PHỎNG VẤN: Nói "MVP render all visible" =
"Tôi sẽ bắt đầu với cách đơn giản (render tất cả nodes visible),
và NẾU CẦN performance, tôi sẽ thêm virtualization sau."
```

**3. "Không cần lift state" — State ở local, không cần đưa lên parent**

**"Lift state"** (nâng state lên) = di chuyển state từ component con LÊN component cha để nhiều components cùng chia sẻ.

```
KHI NÀO CẦN LIFT STATE:
Khi 2+ components cần CÙNG BIẾT một state.

Ví dụ: "Expand All" button ở trên cần biết TẤT CẢ directories
→ State expanded phải ở PARENT (FileExplorer) thay vì ở mỗi FileObject
→ Đó là "lift state up"

KHI NÀO KHÔNG CẦN (File Explorer MVP):
Mỗi directory chỉ cần biết CHÍNH NÓ đang mở hay đóng.
→ Không ai khác cần biết → state ở LOCAL (trong mỗi FileObject)
→ Không cần lift state

SO SÁNH:
┌──────────────────┬───────────────────────┬────────────────────┐
│                  │ LOCAL state           │ LIFTED state       │
├──────────────────┼───────────────────────┼────────────────────┤
│ State ở đâu      │ Trong mỗi FileObject │ Trong FileExplorer │
│ Ai quản lý       │ Mỗi node tự quản     │ Parent quản lý tất │
│ Khi nào dùng     │ MVP, expand/collapse  │ Expand All, search │
│ Phức tạp          │ ⭐ (đơn giản)         │ ⭐⭐⭐ (phức tạp)    │
│ Re-render         │ Chỉ node thay đổi    │ Toàn bộ tree       │
└──────────────────┴───────────────────────┴────────────────────┘
```

```tsx
// LOCAL STATE (File Explorer MVP):
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);
  // ↑ Mỗi FileObject CÓ expanded RIÊNG
  // Click "src" → chỉ re-render "src"
  // Không ảnh hưởng bất kỳ node nào khác
}

// LIFTED STATE (nếu cần "Expand All"):
function FileExplorer({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // ↑ MỘT Set chứa TẤT CẢ IDs đang expanded
  // Click "src" → update Set → FileExplorer re-render → CẢ tree re-render

  return <FileList fileList={data} expandedIds={expandedIds} />;
}
```

**4. "Directories first, then files. Both groups sorted alphabetically."**

Trả lời ngắn gọn cho interviewer. Ý nghĩa chi tiết:

```
INPUT (chưa sort):
├── zebra.txt        (file)
├── alpha/           (directory)
├── beta.css         (file)
├── src/             (directory)
├── main.ts          (file)

OUTPUT (sau sort):
├── alpha/           (directory) ← GROUP 1: Directories, sorted A→Z
├── src/             (directory)
├── beta.css         (file)     ← GROUP 2: Files, sorted A→Z
├── main.ts          (file)
├── zebra.txt        (file)

RULE:
1. BẤT KỲ directory nào đều đứng TRƯỚC BẤT KỲ file nào
2. Trong nhóm directories: A→Z (alpha trước src)
3. Trong nhóm files: A→Z (beta trước main trước zebra)
```

**5. "Render directory name nhưng không có children khi expand" — Empty Directory**

```
EMPTY DIRECTORY = thư mục rỗng, CÓ children nhưng children = []

DATA:
{ id: 5, name: "empty-folder", children: [] }

KHI COLLAPSED (chưa click):
📁 empty-folder        ← Hiển thị tên + icon thư mục

KHI EXPANDED (click mở):
📂 empty-folder        ← Icon đổi thành "đang mở"
   (trống)              ← KHÔNG CÓ gì bên trong, vì children = []

CODE:
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = Boolean(file.children);

  return (
    <li>
      <button onClick={() => isDirectory && setExpanded(!expanded)}>
        {isDirectory ? (expanded ? '📂' : '📁') : '📄'} {file.name}
      </button>
      {expanded && file.children && (
        file.children.length > 0
          ? <FileList fileList={file.children} level={level + 1} />
          : <span className="empty-dir">(empty directory)</span>
      )}
    </li>
  );
}
```

**6. "Persist expanded state — dùng Set ở parent hoặc localStorage"**

**"Persist"** = **lưu lại** để khi user refresh page, trạng thái expanded KHÔNG BỊ MẤT.

```
VẤN ĐỀ: Mặc định, useState bị RESET khi refresh page.
User mở 10 folders → Refresh → Tất cả đóng lại → Khó chịu!

GIẢI PHÁP 1: Set<id> ở parent
- Parent (FileExplorer) giữ một Set chứa TẤT CẢ IDs đang expanded
- Set = cấu trúc dữ liệu chứa các giá trị duy nhất (không trùng)
- Ví dụ: expandedIds = Set {1, 5, 8} = 3 directories đang mở

GIẢI PHÁP 2: localStorage
- Lưu expandedIds vào localStorage (bộ nhớ trình duyệt)
- Khi load lại page → đọc từ localStorage → khôi phục trạng thái
```

```tsx
// Set<id> ở parent:
function FileExplorer({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // Set {1, 5, 8} = directory id=1, id=5, id=8 đang mở

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id))
        next.delete(id); // Nếu đang mở → đóng
      else next.add(id); // Nếu đang đóng → mở
      return next;
    });
  };
}

// localStorage (persist qua refresh):
function FileExplorer({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    // Khi component MOUNT → đọc từ localStorage
    const saved = localStorage.getItem("expandedIds");
    if (saved) return new Set(JSON.parse(saved)); // Khôi phục!
    return new Set(); // Lần đầu → rỗng
  });

  useEffect(() => {
    // Mỗi khi expandedIds thay đổi → LƯU vào localStorage
    localStorage.setItem("expandedIds", JSON.stringify([...expandedIds]));
  }, [expandedIds]);

  // → User refresh page → state được khôi phục từ localStorage!
}

// "Clarify" = khi interviewer hỏi "Persist expanded state?",
// bạn nên HỎI LẠI: "Bạn muốn persist across page refresh?
// Nếu có, tôi sẽ dùng localStorage. Nếu không, local state là đủ."
// → Thể hiện bạn biết clarify requirements trước khi code!
```

**🏗️ Kiến trúc tổng quan:**

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT ARCHITECTURE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FileExplorer.tsx (Root - Entry Point)                          │
│  ├── Props: data (readonly array of FileData)                   │
│  └── Uses: <FileList fileList={data} level={1} />               │
│                                                                 │
│  FileList.tsx (Recursive Renderer + Sorter)                     │
│  ├── Sorts: directories first, then files (alphabetically)      │
│  ├── Renders: <ul> with <FileObject> for each item              │
│  └── Passes: level prop for indentation depth                   │
│                                                                 │
│  FileObject.tsx (Individual Item — File or Directory)            │
│  ├── State: expanded (boolean, local useState)                  │
│  ├── Determines: isDirectory via Boolean(children)              │
│  ├── Handles: click to toggle expand/collapse                   │
│  └── Renders: <FileList> recursively for children              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📊 So sánh với Nested Checkboxes:**

| Aspect            | Nested Checkboxes                     | File Explorer                        |
| ----------------- | ------------------------------------- | ------------------------------------ |
| State scope       | Global (lifted to root)               | Local (per directory)                |
| State propagation | Bidirectional (up + down)             | None (local toggle)                  |
| Node states       | 3 (checked, unchecked, indeterminate) | 2 (expanded, collapsed)              |
| Sorting           | No sorting requirement                | Directories first, then alphabetical |
| User interaction  | Toggle checkbox                       | Toggle expand/collapse               |
| Complexity        | High (state propagation)              | Medium (sorting + rendering)         |
| Key challenge     | State consistency                     | Sorting + recursive render           |

---

### Step 1: Định Nghĩa Data Types

> 🎯 "Tôi bắt đầu với types — foundation cho mọi thứ."

```typescript
// types.ts
export type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
}>;
```

**💬 Giải thích cho interviewer:**

> "FileData là recursive type — children là array của chính FileData. Tôi dùng `Readonly` và `ReadonlyArray` vì data này là immutable — component không nên mutate props. Children optional — nếu không có thì đây là file (leaf node)."

**🤔 Tại sao design thế này?**

| Decision                         | Lý do                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `Readonly<>`                     | Prevent accidental mutation. Signal intent: "data flows down, never mutated" |
| `ReadonlyArray<>`                | Prevent `.push()`, `.sort()` trên original array                             |
| `children?: ...`                 | Optional = file. Present = directory. Simple discriminator                   |
| `id: number`                     | Unique key cho React reconciliation                                          |
| Không có `type: 'file' \| 'dir'` | Infer từ `children` — less data, same information                            |

---

#### 🔍 Giải thích chi tiết từng Design Decision

**1. `Readonly<>` — "Prevent accidental mutation. Signal intent"**

Trong React, data chảy **MỘT CHIỀU** (one-way data flow): parent → child qua props. Component con **KHÔNG BAO GIỜ** được thay đổi (mutate) data từ parent — nó chỉ được **đọc** (read) và **hiển thị** (render).

`Readonly<>` là TypeScript utility type, biến tất cả property thành **read-only** tại compile time:

```typescript
// KHÔNG có Readonly — TypeScript cho phép mutation
type FileData = {
  id: number;
  name: string;
  children?: FileData[];
};

const file: FileData = { id: 1, name: "hello.txt" };
file.name = "changed.txt"; // ✅ TypeScript cho phép — NGUY HIỂM!
// → Parent truyền data xuống, child tự thay đổi name
// → Parent không biết data đã bị đổi → UI inconsistent

// CÓ Readonly — TypeScript CHẶN mutation
type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
}>;

const file: FileData = { id: 1, name: "hello.txt" };
file.name = "changed.txt"; // ❌ ERROR: Cannot assign to 'name'
//                            because it is a read-only property
```

**"Signal intent"** nghĩa là: Khi developer khác đọc code, thấy `Readonly<>` → NGAY LẬP TỨC hiểu rằng:

- Data này là **bất biến** (immutable)
- Không ai được modify nó trực tiếp
- Muốn thay đổi → phải tạo **bản copy mới** (`{ ...file, name: "new" }`)

**Ví dụ thực tế — nếu KHÔNG dùng Readonly:**

```typescript
// BUG kinh điển: sort() MUTATE original array!
function FileList({ fileList }: { fileList: FileData[] }) {
  // ❌ BUG: .sort() thay đổi CHÍNH mảng gốc từ parent
  const sorted = fileList.sort((a, b) => a.name.localeCompare(b.name));
  // → Parent component sẽ bị ảnh hưởng!
  // → Gây ra bug khó debug vì parent không biết data đã thay đổi
  return <ul>{sorted.map(f => <li key={f.id}>{f.name}</li>)}</ul>;
}

// ✅ FIX: Readonly chặn lỗi này ở compile time
function FileList({ fileList }: { fileList: ReadonlyArray<FileData> }) {
  fileList.sort(...); // ❌ ERROR: Property 'sort' does not exist
  //                     on type 'ReadonlyArray<FileData>'

  // Buộc phải copy trước khi sort:
  const sorted = [...fileList].sort((a, b) => a.name.localeCompare(b.name));
  // ✅ Tạo mảng MỚI, original array không bị ảnh hưởng
}
```

> **💡 Tóm lại:** `Readonly<>` = một lớp bảo vệ TypeScript, đảm bảo data chảy 1 chiều (parent → child), child không thể vô tình sửa data của parent.

---

**2. `ReadonlyArray<>` — "Prevent `.push()`, `.sort()` trên original array"**

`ReadonlyArray<T>` là phiên bản **read-only** của `Array<T>`. Nó LOẠI BỎ tất cả method có thể thay đổi mảng gốc:

```typescript
// Array bình thường — có tất cả mutating methods
const arr: FileData[] = [file1, file2];
arr.push(file3);     // ✅ Cho phép — thêm vào mảng GỐC
arr.sort(...);       // ✅ Cho phép — sắp xếp mảng GỐC tại chỗ
arr.splice(0, 1);    // ✅ Cho phép — xóa phần tử khỏi mảng GỐC
arr.reverse();       // ✅ Cho phép — đảo ngược mảng GỐC
arr[0] = newFile;    // ✅ Cho phép — thay thế phần tử

// ReadonlyArray — chặn tất cả mutating methods
const arr: ReadonlyArray<FileData> = [file1, file2];
arr.push(file3);     // ❌ ERROR: Property 'push' does not exist
arr.sort(...);       // ❌ ERROR: Property 'sort' does not exist
arr.splice(0, 1);    // ❌ ERROR: Property 'splice' does not exist
arr.reverse();       // ❌ ERROR: Property 'reverse' does not exist
arr[0] = newFile;    // ❌ ERROR: Index signature only permits reading

// CÁC METHOD ĐỌC VẪN CÒN — chỉ chặn methods thay đổi mảng:
arr.map(...)         // ✅ Trả về array MỚI, không đổi gốc
arr.filter(...)      // ✅ Trả về array MỚI
arr.find(...)        // ✅ Tìm phần tử, không đổi gốc
arr.length           // ✅ Đọc length
arr[0]               // ✅ Đọc phần tử (chỉ không thể gán lại)
arr.forEach(...)     // ✅ Lặp qua, không đổi gốc
```

**Tại sao quan trọng với File Explorer?**

```typescript
// Khi parent truyền children array:
<FileList fileList={directoryData.children} level={2} />

// Nếu FileList gọi fileList.sort() → thay đổi children array của parent
// → Parent re-render với data đã bị sort → KHÔNG KIỂM SOÁT ĐƯỢC
// → ReadonlyArray ngăn chặn bug này ngay từ compile time
```

---

**3. `children?: ...` — "Optional = file. Present = directory. Simple discriminator"**

"Discriminator" (bộ phân biệt) là cách phân biệt **loại** của một object. Ở đây, ta dùng sự **có mặt hay vắng mặt** của property `children` để phân biệt file và directory:

```typescript
type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>; // DẤU ? = Optional
}>;

// ❓ Dấu ? nghĩa là gì?
// → Property "children" có thể CÓ hoặc KHÔNG CÓ
// → Nếu KHÔNG có children → đây là FILE (leaf node - nút lá)
// → Nếu CÓ children → đây là DIRECTORY (nút cha)

// FILE — không có children
const textFile: FileData = {
  id: 1,
  name: "readme.txt",
  // không có children → TypeScript hiểu đây là file
};

// DIRECTORY — có children (kể cả array rỗng = thư mục trống)
const srcFolder: FileData = {
  id: 2,
  name: "src",
  children: [
    // CÓ children → đây là directory
    { id: 3, name: "index.ts" },
    { id: 4, name: "utils.ts" },
  ],
};

// DIRECTORY RỖNG — vẫn có children nhưng là []
const emptyFolder: FileData = {
  id: 5,
  name: "empty-folder",
  children: [], // CÓ children (dù rỗng) → vẫn là directory
};
```

**"Simple discriminator"** = cách phân biệt file/directory đơn giản nhất:

```typescript
// Chỉ cần check children có tồn tại không:
const isDirectory = Boolean(file.children);
// hoặc:
const isDirectory = file.children !== undefined;
// hoặc:
const isDirectory = "children" in file;

// Không cần thêm field type riêng — children property TỰ NÓ
// đã cho biết đây là file hay directory rồi
```

---

**4. `id: number` — "Unique key cho React reconciliation"**

**React Reconciliation** là quá trình React so sánh Virtual DOM cũ và mới để quyết định **cần cập nhật gì trên DOM thật**.

Khi render một danh sách (list), React cần **phân biệt** từng phần tử — giống như cách mỗi người có CMND/CCCD riêng:

```tsx
// React cần key để track từng item:
{
  fileList.map((file) => (
    <FileObject key={file.id} file={file} />
    //            ^^^^^^^^^ React dùng key này để "nhận diện" mỗi item
  ));
}
```

**Reconciliation hoạt động thế nào?**

```
TRƯỚC KHI EXPAND (render lần 1):
├── FileObject key=1  "src"        (directory)
├── FileObject key=2  "package.json" (file)
└── FileObject key=3  "README.md"    (file)

SAU KHI EXPAND "src" (render lần 2):
├── FileObject key=1  "src"          (directory — EXPANDED)
│   ├── FileObject key=4  "App.tsx"  (NEW — chưa có trước đó)
│   └── FileObject key=5  "index.ts" (NEW — chưa có trước đó)
├── FileObject key=2  "package.json" (file — KHÔNG ĐỔI)
└── FileObject key=3  "README.md"    (file — KHÔNG ĐỔI)

REACT SO SÁNH:
- key=1: tồn tại cả 2 lần → UPDATE (thêm children)
- key=2: tồn tại cả 2 lần, props giống → SKIP (không làm gì!)
- key=3: tồn tại cả 2 lần, props giống → SKIP
- key=4: chỉ có lần 2 → MOUNT MỚI (tạo DOM element)
- key=5: chỉ có lần 2 → MOUNT MỚI

→ React CHỈ thay đổi DOM cho key=1, key=4, key=5
→ key=2 và key=3 KHÔNG bị re-render → HIỆU QUẢ CAO
```

**Nếu KHÔNG có unique key (hoặc dùng index):**

```tsx
// ❌ Dùng index làm key — BUG KHI SORT:
{
  fileList.map((file, index) => <FileObject key={index} file={file} />);
}

// TRƯỚC sort: key=0 → "apple.txt", key=1 → "banana.txt"
// SAU sort:   key=0 → "banana.txt", key=1 → "apple.txt"
// React thấy: key=0 vẫn tồn tại → CẬP NHẬT props (thay vì swap)
// → Có thể gây bug: nếu FileObject có internal state (expanded),
//   state của "apple" sẽ bị gán cho "banana"!

// ✅ Dùng unique id:
{
  fileList.map((file) => <FileObject key={file.id} file={file} />);
}
// React track ĐÚNG từng item bất kể vị trí thay đổi
```

> **💡 Tóm lại:** `id` = "CMND" của mỗi file/directory, giúp React biết phần tử nào là phần tử nào khi danh sách thay đổi (sort, add, delete).

---

**5. Không có `type: 'file' | 'dir'` — "Infer từ children, no redundancy"**

**"Explicit type field"** là khi ta THÊM một field riêng để nói rõ loại:

```typescript
// CÁCH 1: Explicit type field (KHÔNG DÙNG)
type FileData = {
  id: number;
  name: string;
  type: "file" | "directory"; // ← explicit type
  children?: FileData[];
};

// CÁCH 2: Infer từ children (DÙNG CÁCH NÀY ✅)
type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>; // ← children tự nói lên loại
}>;
```

**"No redundancy"** (không dư thừa) nghĩa là: nếu đã có `children` thì KHÔNG CẦN field `type` nữa, vì 2 thông tin này NÓI CÙNG MỘT ĐIỀU:

```typescript
// ❌ REDUNDANT — dư thừa, có thể bị mâu thuẫn:
const file = {
  id: 1,
  name: "test.txt",
  type: "directory", // NÓI: đây là directory
  children: undefined, // NÓI: đây là file (không có children)
  // → MÂU THUẪN! type nói directory, nhưng không có children
  // → Bug nào đúng? Ai sai? Không biết!
};

// ✅ NO REDUNDANCY — một nguồn sự thật duy nhất:
const file = {
  id: 1,
  name: "test.txt",
  // Không có children → CHẮC CHẮN là file, không mâu thuẫn
};
```

**"Sufficient discriminator"** (bộ phân biệt đủ) nghĩa là: CHỈ CẦN check `children` là ĐỦ để biết file hay directory, KHÔNG CẦN thêm thông tin nào khác:

```typescript
// "children presence" (sự hiện diện của children) là SUFFICIENT:
function renderIcon(file: FileData) {
  if (file.children) {
    // CÓ children → directory → show 📁
    return "📁";
  }
  // KHÔNG có children → file → show 📄
  return "📄";
}

// Đủ thông tin, không cần thêm field "type"
```

---

**6. TypeScript narrowing: `if (file.children) { ... }`**

**"Narrowing"** (thu hẹp kiểu) là khi TypeScript TỰ ĐỘNG hiểu kiểu dữ liệu chính xác hơn sau khi ta check điều kiện:

```typescript
type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
  // TypeScript biết: children có thể là ReadonlyArray<FileData> HOẶC undefined
}>;

function FileObject({ file }: { file: FileData }) {
  // Ở ĐÂY: file.children có kiểu: ReadonlyArray<FileData> | undefined
  //         TypeScript chưa biết children có hay không

  if (file.children) {
    // ← TypeScript narrowing xảy ra tại đây!
    // TRONG BLOCK NÀY: file.children có kiểu: ReadonlyArray<FileData>
    // TypeScript TỰ HIỂU: nếu vào được đây → children CHẮC CHẮN tồn tại
    // → Không cần cast type, không cần hỏi lại

    file.children.map(child => <FileObject file={child} />);
    // ✅ TypeScript cho phép .map() vì biết chắc children là Array

    console.log(file.children.length);
    // ✅ Cho phép .length vì biết chắc không phải undefined
  }

  // Ở NGOÀI if: file.children vẫn là ReadonlyArray | undefined
  // file.children.map(...) // ❌ ERROR: Object is possibly 'undefined'
}
```

**So sánh: NẾU dùng explicit type field:**

```typescript
// Với explicit type → KHÔNG được narrowing tự động
type FileData = {
  type: 'file' | 'directory';
  children?: FileData[];
};

if (file.type === 'directory') {
  file.children.map(...); // ❌ ERROR! TypeScript vẫn thấy children có thể undefined
  // → Phải thêm kiểm tra: file.children && file.children.map(...)
  // → Hoặc dùng non-null assertion: file.children!.map(...)
}

// Với children optional → narrowing TỰ NHIÊN:
if (file.children) {
  file.children.map(...); // ✅ TypeScript ĐÃ BIẾT children tồn tại
  // → Không cần kiểm tra thêm, code sạch hơn
}
```

> **💡 Tóm lại:** TypeScript narrowing = compiler tự suy luận kiểu chính xác hơn dựa trên if/else, giúp code an toàn hơn mà KHÔNG cần cast type thủ công.

---

**7. "Giống file system thực — directory = has entries"**

Trong hệ thống file thật (Windows Explorer, macOS Finder, Linux), **directory (thư mục) KHÔNG phải là một "loại" khác biệt về bản chất** — nó đơn giản là một **container chứa entries** (các mục con):

```
HỆ THỐNG FILE THỰC:
/home/user/
├── Documents/          ← Directory = CÓ entries bên trong
│   ├── report.pdf      ← File = KHÔNG có entries
│   └── images/         ← Directory = CÓ entries (có thể rỗng)
├── .gitignore          ← File = KHÔNG có entries
└── Downloads/          ← Directory rỗng = VẪN CÓ entries, chỉ là []

CÁCH KERNEL PHÂN BIỆT:
- File = inode trỏ tới data blocks
- Directory = inode trỏ tới DANH SÁCH entries (các inode con)
- Sự khác biệt = CÓ danh sách con hay KHÔNG
```

Data model của ta **copy y nguyên logic này**:

```typescript
// FILE = không có danh sách con
{ id: 1, name: ".gitignore" }
// → Giống: inode trỏ tới data, không chứa entries khác

// DIRECTORY = CÓ danh sách con (kể cả khi rỗng)
{ id: 2, name: "Documents", children: [...] }
// → Giống: inode chứa danh sách entries con

// DIRECTORY RỖNG = vẫn có children nhưng là []
{ id: 3, name: "empty-folder", children: [] }
// → Giống: thư mục trống — VẪN là directory, chỉ chưa có file nào
```

**Tại sao mô phỏng file system thật?**

- **Trực giác:** Developer quen thuộc với file system → đọc code HIỂU NGAY
- **Nhất quán:** Không có trường hợp "directory nhưng không có children" hay "file nhưng có children"
- **Tự nhiên:** Data shape tự mô tả chính nó — không cần đọc docs

**⚡ Key insight: File vs Directory discrimination**

```typescript
// Cách xác định file hay directory:
const isDirectory = Boolean(file.children);

// Tại sao không dùng explicit type field?
// 1. Ít data hơn — no redundancy (đã giải thích ở trên)
// 2. children presence là sufficient discriminator (đã giải thích)
// 3. TypeScript narrowing works: if (file.children) { ... } (đã giải thích)
// 4. Giống file system thực — directory = "has entries" (đã giải thích)
```

---

### Step 2: FileExplorer Component (Root)

> 🎯 "Root component — clean entry point, delegates rendering to FileList."

```tsx
// FileExplorer.tsx
import FileList from "./FileList";

export type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
}>;

export default function FileExplorer({
  data,
}: Readonly<{ data: ReadonlyArray<FileData> }>) {
  return (
    <div>
      <FileList fileList={data} level={1} />
    </div>
  );
}
```

**💬 Giải thích cho interviewer:**

> "FileExplorer là thin wrapper — nó chỉ pass data xuống FileList. Level=1 bắt đầu từ root level. Tôi tách riêng vì: (1) FileExplorer có thể add header, search bar, toolbar sau này, (2) FileList tái sử dụng cho recursive rendering."

**🤔 Tại sao Root component đơn giản vậy?**

```
Q: "Tại sao không put logic ở root?"

A: "Single Responsibility Principle:
   - FileExplorer: Entry point, future container cho search/toolbar
   - FileList: Sorting + rendering list of items
   - FileObject: Individual item behavior (expand/collapse)

   Mỗi component có 1 job duy nhất.
   Khi thêm feature (search, context menu),
   chỉ modify component liên quan."
```

---

### Step 3: FileObject Component (File/Directory Item)

> 🎯 "Core component — handle cả file và directory behavior."

```tsx
// FileObject component (inside FileExplorer.tsx or separate file)
import { useState } from "react";
import FileList from "./FileList";

export function FileObject({
  file,
  level,
}: Readonly<{ file: FileData; level: number }>) {
  const [expanded, setExpanded] = useState(false);
  const { children: fileChildren, name: fileName } = file;
  // If the children field is present, the item is a directory
  const isDirectory = Boolean(fileChildren);

  return (
    <li className="file-item">
      <button
        className={[
          "file-item-button",
          isDirectory && "file-item-button--directory",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => {
          if (!isDirectory) {
            return;
          }
          setExpanded(!expanded);
        }}
      >
        <span>{fileName}</span> {isDirectory && <>[{expanded ? "-" : "+"}]</>}
      </button>
      {fileChildren && fileChildren.length > 0 && expanded && (
        <FileList fileList={fileChildren} level={level + 1} />
      )}
    </li>
  );
}
```

**💬 Giải thích cho interviewer:**

> "FileObject handles cả 2 loại: file và directory. Key decisions:
>
> 1. `useState(false)` — directories start collapsed
> 2. `isDirectory` — inferred từ children presence
> 3. Click handler: no-op cho files, toggle cho directories
> 4. Conditional render: chỉ render children khi expanded AND có children
> 5. `level + 1` — pass xuống cho recursive indentation"

**🔍 Phân tích từng phần:**

**a. Local state per directory:**

```tsx
const [expanded, setExpanded] = useState(false);

// Tại sao LOCAL state, không LIFT lên root?
// 1. Expand/collapse là UI-only state — không affect siblings
// 2. Mỗi directory independent — không cần coordination
// 3. Simpler: no prop drilling, no callback chains
// 4. Performance: chỉ re-render subtree khi toggle
//
// Khi nào LIFT state?
// - Cần "expand all / collapse all" feature
// - Cần persist expanded state across navigation
// - Cần programmatic control từ parent
```

**b. Click handler logic:**

```tsx
onClick={() => {
  if (!isDirectory) return; // Files: no interaction
  setExpanded(!expanded);   // Directories: toggle
}}

// Tại sao dùng early return pattern?
// 1. Clear intent: files explicitly do nothing
// 2. Flat code: no nesting
// 3. Extensible: easy to add file click behavior later
//    (e.g., onClick cho preview, download, etc.)
```

**c. Conditional rendering:**

```tsx
{
  fileChildren && fileChildren.length > 0 && expanded && (
    <FileList fileList={fileChildren} level={level + 1} />
  );
}

// 3 conditions MUST all be true:
// 1. fileChildren exists (is directory)
// 2. fileChildren.length > 0 (not empty directory)
// 3. expanded is true (user has expanded)
//
// Order matters for short-circuit evaluation:
// - If no children → skip (no unnecessary checks)
// - If empty → skip (no unnecessary render)
// - If collapsed → skip (no unnecessary render)
```

**d. CSS class composition:**

```tsx
className={[
  'file-item-button',
  isDirectory && 'file-item-button--directory',
]
  .filter(Boolean)
  .join(' ')}

// Pattern: Conditional CSS classes without library
// Result: "file-item-button" (file) or
//         "file-item-button file-item-button--directory" (dir)
//
// Alternative: template literal
// className={`file-item-button ${isDirectory ? 'file-item-button--directory' : ''}`}
// Problem: trailing space when not directory
//
// Production: clsx or classnames library
// className={clsx('file-item-button', { 'file-item-button--directory': isDirectory })}
```

---

### Step 4: FileList Component (Recursive Renderer + Sorter)

> 🎯 "FileList handles sorting logic và recursive rendering."

```tsx
// FileList.tsx
import { FileObject, FileData } from "./FileExplorer";

export default function FileList({
  fileList,
  level,
}: Readonly<{
  fileList: ReadonlyArray<FileData>;
  level: number;
}>) {
  const directories = fileList.filter((fileItem) => fileItem.children);
  directories.sort((a, b) => a.name.localeCompare(b.name));

  const nonDirectories = fileList.filter((fileItem) => !fileItem.children);
  nonDirectories.sort((a, b) => a.name.localeCompare(b.name));

  const items = [...directories, ...nonDirectories];

  return (
    <ul className="file-list">
      {items.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}
```

**💬 Giải thích cho interviewer:**

> "FileList có 2 responsibilities: (1) Sort — directories first, then files, both groups alphabetically, (2) Recursive render — mỗi FileObject có thể render FileList cho children của nó. Sorting strategy: separate, sort individually, concatenate."

**🔍 Phân tích Sorting Strategy:**

```tsx
// Strategy: Partition → Sort → Merge

// Step 1: PARTITION into two groups
const directories = fileList.filter((item) => item.children); // has children
const nonDirectories = fileList.filter((item) => !item.children); // no children

// Step 2: SORT each group independently
directories.sort((a, b) => a.name.localeCompare(b.name));
nonDirectories.sort((a, b) => a.name.localeCompare(b.name));

// Step 3: MERGE — directories first
const items = [...directories, ...nonDirectories];
```

**⚠️ Quan trọng — `.filter()` tạo new array:**

```tsx
// fileList.filter() returns NEW array
// Nên .sort() SAFE — không mutate original ReadonlyArray
// Nếu dùng fileList.sort() trực tiếp → TypeScript error (ReadonlyArray)
// Và sẽ mutate props → BAD

// Alternative: single sort with custom comparator
const items = [...fileList].sort((a, b) => {
  const aIsDir = Boolean(a.children);
  const bIsDir = Boolean(b.children);

  // Directories first
  if (aIsDir && !bIsDir) return -1;
  if (!aIsDir && bIsDir) return 1;

  // Same type: alphabetical
  return a.name.localeCompare(b.name);
});

// Trade-off:
// Partition approach: O(n) filter × 2 + O(d log d) + O(f log f) + O(n) merge
// Single sort approach: O(n log n) with constant factor
// Partition clearer to read. Single sort more efficient for large n.
```

**🌍 `localeCompare` vs simple comparison:**

```tsx
// ❌ Simple comparison
directories.sort((a, b) => (a.name > b.name ? 1 : -1));
// Problem: doesn't handle Unicode, locale-specific ordering
// "résumé" vs "resume" — wrong order

// ✅ localeCompare
directories.sort((a, b) => a.name.localeCompare(b.name));
// Correct: handles Unicode, accents, case sensitivity
// Can customize: localeCompare(b.name, 'en', { sensitivity: 'base' })
```

---

### Step 5: Styling

> 🎯 "CSS minimal nhưng functional — proper indentation và visual cues."

```css
/* styles.css */
body {
  font-family: sans-serif;
}

.file-list {
  list-style: none;
  margin: 0;
  padding-left: 16px; /* KEY: creates indentation per level */
}

.file-item {
  padding: 0;
}

.file-item-button {
  background-color: transparent;
  border: none;
  line-height: 1.5;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
}

.file-item-button--directory {
  display: flex;
  gap: 4px;
  font-weight: bold; /* Visual distinction: directory = bold */
}
```

**💬 Giải thích cho interviewer:**

> "CSS strategy: `padding-left: 16px` trên `.file-list` tạo indentation tự nhiên. Vì FileList recursive (nested `<ul>`), mỗi level tự động indent thêm 16px. Directories bold cho visual distinction. Button thay vì div cho keyboard accessibility."

**🔍 Indentation mechanism:**

```
Level 1: <ul padding-left: 16px>
Level 2:   <ul padding-left: 16px>  → total 32px from left
Level 3:     <ul padding-left: 16px> → total 48px from left

Result:
README.md
Documents/
  Word.doc
  Powerpoint.ppt
Downloads/
  unnamed.txt
  Misc/
    foo.txt
    bar.txt
```

---

### Step 6: Data Flow Visualization

> 🎯 "Trace through example data."

```
INPUT DATA:
[
  { id: 1, name: 'README.md' },
  { id: 2, name: 'Documents', children: [
      { id: 3, name: 'Word.doc' },
      { id: 4, name: 'Powerpoint.ppt' }
  ]},
  { id: 5, name: 'Downloads', children: [
      { id: 6, name: 'unnamed.txt' },
      { id: 7, name: 'Misc', children: [
          { id: 8, name: 'foo.txt' },
          { id: 9, name: 'bar.txt' }
      ]}
  ]}
]

AFTER SORTING (Level 1):
Directories: Documents, Downloads (alphabetical)
Files: README.md
Result: [Documents, Downloads, README.md]

RENDER TREE (all expanded):
Documents/          [directory, bold, clickable]
  Powerpoint.ppt    [file, normal, 16px indent]
  Word.doc          [file, normal, 16px indent]
Downloads/          [directory, bold, clickable]
  Misc/             [directory, bold, 32px indent]
    bar.txt         [file, normal, 48px indent]
    foo.txt         [file, normal, 48px indent]
  unnamed.txt       [file, normal, 32px indent]
README.md           [file, normal, 0px indent]
```

**Component Tree:**

```
<FileExplorer data={data}>
  └── <FileList fileList={data} level={1}>
        ├── <FileObject file={Documents} level={1}>
        │     └── <FileList fileList={[Word, PPT]} level={2}>
        │           ├── <FileObject file={PPT} level={2} />
        │           └── <FileObject file={Word} level={2} />
        ├── <FileObject file={Downloads} level={1}>
        │     └── <FileList fileList={[unnamed, Misc]} level={2}>
        │           ├── <FileObject file={Misc} level={2}>
        │           │     └── <FileList fileList={[foo, bar]} level={3}>
        │           │           ├── <FileObject file={bar} level={3} />
        │           │           └── <FileObject file={foo} level={3} />
        │           └── <FileObject file={unnamed} level={2} />
        └── <FileObject file={README} level={1} />
```

---

### Step 7: App.tsx — Tích hợp và Example Data

> 🎯 "Entry point của app — define test data và render FileExplorer."

```tsx
// App.tsx
import FileExplorer from "./FileExplorer";

export default function App() {
  const data = [
    { id: 1, name: "README.md" },
    {
      id: 2,
      name: "Documents",
      children: [
        { id: 3, name: "Word.doc" },
        { id: 4, name: "Powerpoint.ppt" },
      ],
    },
    {
      id: 5,
      name: "Downloads",
      children: [
        { id: 6, name: "unnamed.txt" },
        {
          id: 7,
          name: "Misc",
          children: [
            { id: 8, name: "foo.txt" },
            { id: 9, name: "bar.txt" },
          ],
        },
      ],
    },
  ];

  return <FileExplorer data={data} />;
}
```

**💬 Giải thích cho interviewer:**

> "App.tsx defines sample data với 3 levels: root → directories → nested files. Data structure covers tất cả edge cases: files at root, nested directories, và mixed content (files + dirs in same level). Tôi intentionally include data UNSORTED để verify sorting logic."

**🔍 Phân tích Test Data Design:**

```
Data covers these scenarios:
├── File at root level (README.md)
├── Directory with only files (Documents/)
│   ├── Word.doc
│   └── Powerpoint.ppt
└── Directory with mixed content (Downloads/)
    ├── File in directory (unnamed.txt)
    └── Nested directory (Misc/)
        ├── foo.txt
        └── bar.txt

Missing scenarios (edges to mention):
├── Empty directory (children: [])
├── Very deep nesting (5+ levels)
├── Single item at any level
├── Unicode/special chars in names
└── Large number of items (100+)
```

**⚡ Key Observation — Data Order vs Display Order:**

```
DATA ORDER:               DISPLAY ORDER (after sort):
1. README.md              1. Documents/        (dir first)
2. Documents/             2. Downloads/        (dir first)
3. Downloads/             3. README.md         (file last)

Inside Downloads:         Inside Downloads (sorted):
1. unnamed.txt            1. Misc/             (dir first)
2. Misc/                  2. unnamed.txt       (file last)

→ Sorting happens at EVERY level, not just root!
→ This is why sort logic lives in FileList (recursive)
```

---

### Step 8: Thinking Process — Cách Tiếp Cận Từng Bước

> 🧠 "Đây là cách tôi approach bài toán trong interview — từ requirement → design → implement."

**Phase 1: Requirement Analysis (2 min)**

```
READ requirements carefully:
□ Display hierarchical file/directory structure     → Tree rendering
□ Directories can expand/collapse                  → Toggle state
□ Directories before files, alphabetically         → Sorting logic
□ Files not expandable                             → Different behavior per type
□ Indent contents to right                         → Visual hierarchy
□ Directories can be empty                         → Edge case

KEY QUESTIONS to ask:
1. "Maximum depth?" → No limit → recursive solution
2. "IDs unique globally or within directory?" → Within directory
3. "Should collapsed state persist across re-renders?" → No (MVP)
4. "Any file interaction needed?" → No, files are static
```

**Phase 2: Data Structure Analysis (2 min)**

```
Given interface:
interface FileObject {
  id: number;
  name: string;
  children?: FileObject[];
}

Observations:
1. RECURSIVE type → children is same type → TREE structure
2. children OPTIONAL → presence = directory, absence = file
3. No explicit "type" field → infer from children
4. id for keying → React reconciliation

Mental model:
ROOT (array)
├── FileObject (leaf = file)
├── FileObject (node = directory)
│   ├── FileObject (leaf)
│   └── FileObject (node)
│       └── FileObject (leaf)
└── FileObject (leaf)
```

**Phase 3: Component Design (3 min)**

```
OPTION A: Single component (rejected)
  FileExplorer renders everything
  ❌ Too much responsibility
  ❌ Hard to manage recursion + sorting + state

OPTION B: Two components (considered)
  FileExplorer + FileItem
  🟡 Possible but FileItem does too much (sort + render + state)

OPTION C: Three components (chosen) ✅
  FileExplorer → entry point
  FileList     → sort + render list
  FileObject   → individual item + expand state
  ✅ Clear separation of concerns
  ✅ FileList handles sorting (reusable at every level)
  ✅ FileObject handles per-item state

WHY 3 COMPONENTS?
"Sorting needs to happen at each level. If I put sorting in FileObject,
 each FileObject would need to sort its children — mixing concerns.
 FileList is the natural place: it receives a list, sorts it, renders it.
 FileObject is the natural place for expand/collapse state."
```

**Phase 4: State Design (2 min)**

```
WHAT state do we need?
1. expanded: boolean — per directory, is it open?
   → That's it! Very simple state model.

WHERE should state live?
Option A: Global (root) — Set<id> of expanded directories
Option B: Local (per FileObject) — useState(false)

DECISION: LOCAL because:
- No state coordination needed between directories
- Simpler implementation
- Better performance (isolated re-renders)
- If "expand all" needed later → can pivot to global

INITIAL VALUE: false (collapsed)
- User explicitly opens directories they want
- Standard UX pattern (VS Code, Finder, etc.)
```

**Phase 5: Implementation Order (planned in head)**

```
1. Types first         → foundation
2. FileExplorer        → entry point (2 min)
3. FileObject          → core logic (8 min)
4. FileList            → sorting + rendering (8 min)
5. CSS                 → indentation + styling (3 min)

WHY this order?
- Types: everything depends on them
- FileExplorer first: simplest, establishes structure
- FileObject before FileList: core behavior first
- FileList last: needs FileObject to exist
- CSS last: functionality before styling
```

---

### Step 9: Alternative Implementation Approaches

> 🔀 "Biết nhiều approaches cho thấy depth of understanding."

**Approach 1: Single Recursive Component (Minimal)**

```tsx
function FileItem({ item, depth = 0 }: { item: FileData; depth?: number }) {
  const [open, setOpen] = useState(false);
  const isDir = Boolean(item.children);

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div onClick={() => isDir && setOpen(!open)}>
        {isDir ? (open ? "📂" : "📁") : "📄"} {item.name}
      </div>
      {open &&
        item.children?.map((child) => (
          <FileItem key={child.id} item={child} depth={depth + 1} />
        ))}
    </div>
  );
}

function FileExplorer({ data }: { data: FileData[] }) {
  return (
    <>
      {data.map((item) => (
        <FileItem key={item.id} item={item} />
      ))}
    </>
  );
}
```

**Trade-offs:**

```
✅ Fewer files, less code
✅ Easy to understand
❌ No sorting (dirs before files)
❌ Inline styles (not reusable)
❌ <div onClick> — not accessible
❌ No semantic HTML (<ul>/<li>)
❌ Sorting logic mixed with rendering
```

---

**Approach 2: Flattened Tree + Map (Advanced)**

```tsx
interface FlatNode {
  id: number;
  name: string;
  depth: number;
  isDirectory: boolean;
  hasChildren: boolean;
  parentId: number | null;
}

function flattenTree(
  items: FileData[],
  depth = 0,
  parentId: number | null = null,
): FlatNode[] {
  const result: FlatNode[] = [];

  // Sort: directories first, then alphabetical
  const dirs = items
    .filter((i) => i.children)
    .sort((a, b) => a.name.localeCompare(b.name));
  const files = items
    .filter((i) => !i.children)
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const item of [...dirs, ...files]) {
    result.push({
      id: item.id,
      name: item.name,
      depth,
      isDirectory: Boolean(item.children),
      hasChildren: (item.children?.length ?? 0) > 0,
      parentId,
    });
    if (item.children) {
      result.push(...flattenTree(item.children, depth + 1, item.id));
    }
  }
  return result;
}

function FlatFileExplorer({ data }: { data: FileData[] }) {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());

  const allNodes = useMemo(() => flattenTree(data), [data]);

  // Filter visible nodes based on expanded state
  const visibleNodes = useMemo(() => {
    const visible: FlatNode[] = [];
    const collapsedParents = new Set<number>();

    for (const node of allNodes) {
      // Skip if any ancestor is collapsed
      if (node.parentId !== null && collapsedParents.has(node.parentId)) {
        if (node.isDirectory) collapsedParents.add(node.id);
        continue;
      }

      visible.push(node);

      if (node.isDirectory && !expandedIds.has(node.id)) {
        collapsedParents.add(node.id);
      }
    }
    return visible;
  }, [allNodes, expandedIds]);

  return (
    <div>
      {visibleNodes.map((node) => (
        <div key={node.id} style={{ paddingLeft: node.depth * 16 }}>
          <button
            onClick={() => {
              if (!node.isDirectory) return;
              setExpandedIds((prev) => {
                const next = new Set(prev);
                next.has(node.id) ? next.delete(node.id) : next.add(node.id);
                return next;
              });
            }}
          >
            {node.isDirectory && (expandedIds.has(node.id) ? "▼ " : "▶ ")}
            {node.name}
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Trade-offs:**

```
✅ Flat list — easy to virtualize (react-window)
✅ Central expanded state — easy to expand all/collapse all
✅ Single render pass — no recursive components
✅ Easy to add search/filter (just filter flat array)
❌ More complex initial setup
❌ Need to maintain parent-child relationships manually
❌ Pre-computed sorting (can't sort dynamically per level)
❌ More memory (stores flattened + original)
```

---

**Approach 3: useReducer + Context (Scalable)**

```tsx
type TreeAction =
  | { type: "TOGGLE"; id: number }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" }
  | { type: "EXPAND_TO"; id: number };

interface TreeState {
  expandedIds: Set<number>;
}

function treeReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case "TOGGLE": {
      const next = new Set(state.expandedIds);
      next.has(action.id) ? next.delete(action.id) : next.add(action.id);
      return { expandedIds: next };
    }
    case "EXPAND_ALL":
      return { expandedIds: new Set(getAllDirectoryIds()) };
    case "COLLAPSE_ALL":
      return { expandedIds: new Set() };
    default:
      return state;
  }
}

const TreeContext = createContext<{
  expandedIds: Set<number>;
  dispatch: React.Dispatch<TreeAction>;
} | null>(null);

function useTree() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error("useTree must be used within TreeProvider");
  return ctx;
}

function TreeProvider({
  children,
  data,
}: {
  children: React.ReactNode;
  data: FileData[];
}) {
  const [state, dispatch] = useReducer(treeReducer, { expandedIds: new Set() });
  return (
    <TreeContext.Provider value={{ expandedIds: state.expandedIds, dispatch }}>
      {children}
    </TreeContext.Provider>
  );
}
```

**Trade-offs:**

```
✅ Scalable — easy to add new actions (expand to path, etc.)
✅ Testable — reducer is pure function
✅ Central state — serialize, persist, URL sync
✅ No prop drilling — Context provides state
❌ Over-engineering for basic requirements
❌ All tree re-renders on any toggle (need React.memo)
❌ More code, more abstractions
```

**💬 When to use which:**

```
┌─────────────────────────────────────────────────────────────┐
│ APPROACH SELECTION GUIDE                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Interview (basic requirements):                               │
│ → Recursive 3-component approach (chosen solution)            │
│   Simple, clear, demonstrates recursive thinking              │
│                                                               │
│ + "Add expand all":                                           │
│ → Lift to Set<id> in root OR Context approach                 │
│                                                               │
│ + "10K+ files":                                               │
│ → Flattened tree + react-window virtualization                │
│                                                               │
│ + "Full feature set" (search, drag, lazy load):               │
│ → useReducer + Context + flat data model                      │
│                                                               │
│ Always start simple. Evolve when requirements demand it.      │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 10: Edge Case Handling Deep Dive

> ⚠️ "Production code cần handle tất cả edge cases. Biết edge cases trước = score cao."

**Edge Case 1: Empty Directory**

```tsx
// Data
{ id: 1, name: 'EmptyFolder', children: [] }

// Behavior:
// ✅ Show as directory (bold, expand icon)
// ✅ Clickable to expand/collapse
// ✅ When expanded: show nothing (or "Empty" message)
// ❌ NOT treated as file!

// Our code handles this:
const isDirectory = Boolean(file.children); // children: [] → true ✅
// Empty array is truthy!

// Rendering guard:
{fileChildren && fileChildren.length > 0 && expanded && (
  <FileList ... />
)}
// children.length = 0 → doesn't render FileList ✅
```

**Edge Case 2: Directory với Name Giống File**

```tsx
// Data
[
  { id: 1, name: "config", children: [{ id: 2, name: "app.json" }] },
  { id: 3, name: "config" }, // File with same name as directory!
];

// Behavior:
// IDs unique → React keys work ✅
// Directory "config" appears BEFORE file "config" (dirs first sort)
// Both rendered correctly with different behavior
// Visual distinction: dir is bold + has [+], file is normal
```

**Edge Case 3: Unicode / Special Characters in Names**

```tsx
// Data
[
  { id: 1, name: "日本語ファイル.txt" },
  { id: 2, name: "résumé.pdf" },
  { id: 3, name: "naïve.doc" },
  { id: 4, name: "🎉 party-notes.md" },
  { id: 5, name: ".gitignore" }, // dot file
  { id: 6, name: "..." }, // unusual name
];

// localeCompare handles all these correctly ✅
// Simple > comparison would FAIL for accented chars
```

**Edge Case 4: Single-child Directory Chain**

```tsx
// Data — deeply nested with single child at each level
{
  id: 1, name: 'src', children: [{
    id: 2, name: 'components', children: [{
      id: 3, name: 'ui', children: [{
        id: 4, name: 'Button.tsx'
      }]
    }]
  }]
}

// Result:
// src/
//   components/
//     ui/
//       Button.tsx

// Each level needs expand click → tedious UX
// Production improvement: "Compact folders"
// Display as: src/components/ui/
//               Button.tsx
// (Like VS Code's compact folder display)
```

**Edge Case 5: Very Large Flat Directory**

```tsx
// 1000 files in single directory
{
  id: 1,
  name: 'node_modules',
  children: Array.from({ length: 1000 }, (_, i) => ({
    id: i + 100,
    name: `package-${i}`,
    children: [],
  })),
}

// Problems:
// 1. Sort 1000 items every render → useMemo needed
// 2. Render 1000 <li> elements → virtualization needed
// 3. DOM size → browser performance hit

// Solution priority:
// 1. useMemo for sort (easy)
// 2. Pagination or "Show more" button (medium)
// 3. react-window virtualization (full solution)
```

**Edge Case 6: Rapidly Clicking Expand/Collapse**

```tsx
// User clicks directory rapidly: expand → collapse → expand → ...

// React batches state updates in event handlers (React 18+)
// Each click: setExpanded(!expanded)
// Rapid clicks: each click sees LATEST state
// No race condition because:
// 1. useState updates are synchronous in event handlers
// 2. React batches renders but not state reads
// 3. !expanded always references current value

// However, with functional update pattern:
setExpanded((prev) => !prev);
// Even safer — guaranteed to use latest state
// Recommended for rapid interactions
```

**Edge Case 7: Props Change (New Data)**

```tsx
// Parent passes new data array
// Component behavior:
// 1. FileList receives new fileList → re-sorts ✅
// 2. FileObject keeps local expanded state (useState persists)
// 3. BUT: if directory id changes → new component instance → state reset
// 4. key={file.id} ensures correct component tracking

// Example:
// Before: [{ id: 1, name: 'Docs', children: [...] }]
// After:  [{ id: 1, name: 'Documents', children: [...] }]
// → Same key → same component → expanded state PRESERVED ✅

// After:  [{ id: 99, name: 'Docs', children: [...] }]
// → Different key → new component → expanded state RESET ✅
```

---

### Step 11: Complete File/Module Map

> 📁 "Full project structure — interviewer sees organized thinking."

```
file-explorer/
├── App.tsx                    # Entry point + example data
├── FileExplorer.tsx           # Root component + FileData type export
│   ├── export type FileData   # Recursive type definition
│   ├── export default FileExplorer  # Thin wrapper component
│   └── export FileObject      # Individual item component
├── FileList.tsx               # Recursive list renderer + sorter
│   └── export default FileList  # Sorts + renders file items
└── styles.css                 # Minimal functional styling
    ├── .file-list             # Nested <ul> with padding-left
    ├── .file-item             # <li> container
    ├── .file-item-button      # Base button style
    └── .file-item-button--dir # Directory-specific style
```

**Module Dependency Graph:**

```
App.tsx
  └── imports FileExplorer (default)
        ├── imports FileList (default)
        │     └── imports { FileObject, FileData } from FileExplorer
        └── imports FileList (for recursive rendering)

Dependencies:
App → FileExplorer → FileList → FileObject (from FileExplorer)
                                    ↓
                                FileList (recursive!)

Circular? FileList imports FileObject from FileExplorer,
          FileObject renders FileList
          → NOT circular import! FileList file doesn't import itself.
          → FileExplorer.tsx exports FileObject which uses FileList.
```

**🤔 Interview discussion: File Organization Alternatives**

```
Option A (Current): FileObject inside FileExplorer.tsx
✅ Fewer files
❌ File gets large with complex logic

Option B: Separate FileObject.tsx
✅ Single responsibility per file
✅ Easier to test independently
❌ Circular dependency risk (FileObject uses FileList, FileList uses FileObject)
   → Solve with: types in separate file, or barrel re-export

Option C: Single file (everything in FileExplorer.tsx)
✅ Simplest — good for interview
❌ Hard to maintain in production

Recommendation for interview: Option A or C (minimize files, focus on logic)
Recommendation for production: Option B (clean separation)
```

---

### Step 12: Production-Ready Enhancements

> 🚀 "What I'd add beyond the MVP — shows senior thinking."

**Enhancement 1: useMemo for Sort Optimization**

```tsx
// FileList.tsx — production version
function FileList({ fileList, level }: Props) {
  const sortedItems = useMemo(() => {
    const dirs = fileList.filter((item) => item.children);
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    const files = fileList.filter((item) => !item.children);
    files.sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }, [fileList]);

  return (
    <ul className="file-list">
      {sortedItems.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}

// When does this matter?
// Parent re-renders (e.g., sibling state change) → FileList re-renders
// WITHOUT useMemo: re-filter + re-sort (unnecessary)
// WITH useMemo: skip if fileList reference hasn't changed
```

**Enhancement 2: React.memo for FileObject**

```tsx
const FileObject = React.memo(function FileObject({ file, level }: Props) {
  // ... same implementation
});

// When does this matter?
// FileList re-renders → all FileObject children re-render
// WITH React.memo: skip re-render if props unchanged
// Benefit: expanding dir A doesn't re-render sibling dir B
//
// Note: Already optimized by local state (siblings don't share state)
// React.memo adds value when PARENT re-renders unnecessarily
```

**Enhancement 3: File Icons by Extension**

```tsx
function getFileIcon(
  name: string,
  isDirectory: boolean,
  expanded: boolean,
): string {
  if (isDirectory) return expanded ? "📂" : "📁";

  const ext = name.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    ts: "🟦",
    tsx: "⚛️",
    js: "🟨",
    jsx: "⚛️",
    css: "🎨",
    html: "🌐",
    json: "📋",
    md: "📝",
    txt: "📄",
    pdf: "📕",
    png: "🖼️",
    jpg: "🖼️",
    doc: "📘",
    ppt: "📙",
    xls: "📗",
    gitignore: "🙈",
    env: "🔒",
  };

  return iconMap[ext ?? ""] ?? "📄";
}

// Usage in FileObject:
<button>
  {getFileIcon(fileName, isDirectory, expanded)} {fileName}
</button>;
```

**Enhancement 4: Error Boundary**

```tsx
class FileTreeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <p>Failed to render file tree</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage:
<FileTreeErrorBoundary>
  <FileExplorer data={data} />
</FileTreeErrorBoundary>;
```

**Enhancement 5: Accessibility Complete**

```tsx
// FileExplorer.tsx — accessible version
function FileExplorer({ data }: Props) {
  return (
    <nav aria-label="File explorer">
      <FileList fileList={data} level={1} isRoot />
    </nav>
  );
}

// FileList.tsx — accessible version
function FileList({ fileList, level, isRoot }: Props) {
  return (
    <ul role={isRoot ? "tree" : "group"} className="file-list">
      {sortedItems.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}

// FileObject.tsx — accessible version
function FileObject({ file, level }: Props) {
  const isDirectory = Boolean(file.children);

  return (
    <li
      role="treeitem"
      aria-expanded={isDirectory ? expanded : undefined}
      aria-level={level}
      aria-setsize={/* total siblings */}
      aria-posinset={/* position in siblings */}
    >
      <button
        tabIndex={0}
        aria-label={
          isDirectory
            ? `${fileName}, folder, ${expanded ? "expanded" : "collapsed"}`
            : `${fileName}, file`
        }
        onClick={handleClick}
      >
        {fileName}
      </button>
    </li>
  );
}
```

**Enhancement 6: Keyboard Navigation**

```tsx
function useFileTreeKeyboard(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const treeItems = Array.from(
        container!.querySelectorAll('[role="treeitem"] > button'),
      ) as HTMLElement[];

      const currentIndex = treeItems.indexOf(target);
      if (currentIndex === -1) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          treeItems[Math.min(currentIndex + 1, treeItems.length - 1)]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          treeItems[Math.max(currentIndex - 1, 0)]?.focus();
          break;
        case "Home":
          e.preventDefault();
          treeItems[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          treeItems[treeItems.length - 1]?.focus();
          break;
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef]);
}
```

**💬 Interview talking point — Enhancement priority:**

```
┌──────────────────────────────────────────────────────────────┐
│ ENHANCEMENT PRIORITY FOR INTERVIEW                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ MENTION (but don't implement unless asked):                   │
│                                                               │
│ Priority 1 — Always mention:                                  │
│  ✦ useMemo for sort optimization                              │
│  ✦ Accessibility (ARIA tree pattern)                          │
│  ✦ Error boundary                                             │
│                                                               │
│ Priority 2 — If time permits:                                 │
│  ✦ React.memo for file objects                                │
│  ✦ File type icons                                            │
│  ✦ Keyboard navigation                                        │
│                                                               │
│ Priority 3 — Only if asked:                                   │
│  ✦ Virtualization                                             │
│  ✦ Drag-and-drop                                              │
│  ✦ Context menu                                               │
│  ✦ Lazy loading                                               │
│                                                               │
│ "I'd implement these enhancements in production,              │
│  but for interview scope, the MVP demonstrates                │
│  the core recursive + sorting pattern correctly."             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### Step 13: Tổng Kết Implementation — Complete Code Summary

> 📋 "Quick reference — complete working solution."

**File 1: FileExplorer.tsx (Root + FileObject + Types)**

```tsx
import { useState } from "react";
import FileList from "./FileList";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
export type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>; // Recursive type
}>;
// → children present = directory
// → children absent = file
// → Readonly prevents mutation

// ═══════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════
export default function FileExplorer({
  data,
}: Readonly<{ data: ReadonlyArray<FileData> }>) {
  return (
    <div>
      <FileList fileList={data} level={1} />
    </div>
  );
}
// → Thin wrapper, delegates to FileList
// → level=1 starts depth tracking

// ═══════════════════════════════════════════
// ITEM COMPONENT (File or Directory)
// ═══════════════════════════════════════════
export function FileObject({
  file,
  level,
}: Readonly<{ file: FileData; level: number }>) {
  const [expanded, setExpanded] = useState(false);
  // → LOCAL state per directory
  // → Files don't use this state (no-op click)

  const { children: fileChildren, name: fileName } = file;
  const isDirectory = Boolean(fileChildren);
  // → Infer type from children presence
  // → children: [] = empty dir (truthy!)
  // → children: undefined = file

  return (
    <li className="file-item">
      <button
        className={[
          "file-item-button",
          isDirectory && "file-item-button--directory",
        ]
          .filter(Boolean)
          .join(" ")}
        // → Conditional CSS without library
        onClick={() => {
          if (!isDirectory) return;
          // → Early return: files do nothing
          setExpanded(!expanded);
          // → Toggle expand/collapse
        }}
      >
        <span>{fileName}</span> {isDirectory && <>[{expanded ? "-" : "+"}]</>}
        {/* → Visual indicator for directories */}
      </button>
      {fileChildren && fileChildren.length > 0 && expanded && (
        <FileList fileList={fileChildren} level={level + 1} />
      )}
      {/* → 3 conditions: has children + not empty + expanded */}
      {/* → Recursive: FileObject renders FileList */}
    </li>
  );
}
```

**File 2: FileList.tsx (Sorter + Recursive Renderer)**

```tsx
import { FileObject, FileData } from "./FileExplorer";

export default function FileList({
  fileList,
  level,
}: Readonly<{
  fileList: ReadonlyArray<FileData>;
  level: number;
}>) {
  // ═══════════════════════════════════════
  // PARTITION: split into dirs and files
  // ═══════════════════════════════════════
  const directories = fileList.filter((fileItem) => fileItem.children);
  // → .filter() creates NEW array (safe to sort)

  directories.sort((a, b) => a.name.localeCompare(b.name));
  // → Alphabetical within directories

  const nonDirectories = fileList.filter((fileItem) => !fileItem.children);
  nonDirectories.sort((a, b) => a.name.localeCompare(b.name));
  // → Alphabetical within files

  // ═══════════════════════════════════════
  // MERGE: directories first, then files
  // ═══════════════════════════════════════
  const items = [...directories, ...nonDirectories];

  return (
    <ul className="file-list">
      {items.map((file) => (
        <FileObject
          key={file.id}
          // → Unique key for React reconciliation
          file={file}
          level={level}
          // → Depth tracking passed through
        />
      ))}
    </ul>
  );
}
// → This component is called RECURSIVELY
// → Each directory level creates new FileList
// → Sorting happens independently at each level
```

**File 3: styles.css**

```css
/* Reset + base */
body {
  font-family: sans-serif;
}

/* List container — INDENTATION ENGINE */
.file-list {
  list-style: none; /* Remove bullets */
  margin: 0;
  padding-left: 16px; /* Each nested <ul> adds 16px indent */
}
/* Level 1: 16px | Level 2: 32px | Level 3: 48px ... */

/* List item */
.file-item {
  padding: 0;
}

/* Interactive button — base style */
.file-item-button {
  background-color: transparent; /* No background */
  border: none; /* No border */
  line-height: 1.5; /* Comfortable spacing */
  cursor: pointer; /* Click affordance */
  font-size: 16px;
  padding: 0;
}

/* Directory-specific style */
.file-item-button--directory {
  display: flex; /* Align name + indicator */
  gap: 4px; /* Space between name and [+/-] */
  font-weight: bold; /* Visual distinction from files */
}
```

**Memory Aid — Key Relationships:**

```
┌────────────────────────────────────────────────────────────┐
│                    RELATIONSHIP MAP                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  FileData type ──defines──→ Tree node structure             │
│       ↓                                                     │
│  FileExplorer ──passes data──→ FileList (level 1)          │
│       ↓                                                     │
│  FileList ──sorts──→ [dirs first, files second]             │
│       ↓                                                     │
│  FileList ──renders──→ FileObject (for each item)           │
│       ↓                                                     │
│  FileObject ──manages──→ expanded state (local)             │
│       ↓                                                     │
│  FileObject ──if expanded──→ FileList (level + 1)           │
│       ↓                                                     │
│  FileList ──sorts again──→ [dirs first, files second]       │
│       ↓                                                     │
│  ... recursive until leaf nodes (files)                     │
│                                                             │
│  CSS .file-list padding-left ──creates──→ indentation       │
│  Each nested <ul> ──adds──→ 16px more indent                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

### Step 14: React Reconciliation — Cách React Handle Tree Structure

> 🔄 "Hiểu cách React reconcile recursive components — critical cho interview."

**Virtual DOM Tree cho File Explorer:**

```
Khi user expand "Downloads" directory:

BEFORE (collapsed):
<div>                                    ← FileExplorer
  <ul>                                   ← FileList (level 1)
    <li key="2">                         ← FileObject (Documents)
      <button>Documents [+]</button>
    </li>
    <li key="5">                         ← FileObject (Downloads)
      <button>Downloads [+]</button>
    </li>
    <li key="1">                         ← FileObject (README.md)
      <button>README.md</button>
    </li>
  </ul>
</div>

AFTER (Downloads expanded):
<div>                                    ← FileExplorer (NO re-render!)
  <ul>                                   ← FileList (level 1, NO re-render!)
    <li key="2">                         ← FileObject (Documents, NO re-render!)
      <button>Documents [+]</button>
    </li>
    <li key="5">                         ← FileObject (Downloads, RE-RENDER ✅)
      <button>Downloads [-]</button>     ← text changed
      <ul>                               ← FileList (level 2, NEW mount)
        <li key="7">                     ← FileObject (Misc, NEW mount)
          <button>Misc [+]</button>
        </li>
        <li key="6">                     ← FileObject (unnamed.txt, NEW mount)
          <button>unnamed.txt</button>
        </li>
      </ul>
    </li>
    <li key="1">                         ← FileObject (README.md, NO re-render!)
      <button>README.md</button>
    </li>
  </ul>
</div>
```

**Reconciliation Analysis:**

```
WHAT RE-RENDERS?
┌────────────────────────────────────────────────┐
│ Component            │ Re-renders? │ Why?       │
├─────────────────────┼────────────┼────────────┤
│ FileExplorer         │ NO          │ No state   │
│ FileList (level 1)   │ NO          │ No prop Δ  │
│ FileObject(Documents)│ NO          │ No state Δ │
│ FileObject(Downloads)│ YES ✅      │ State Δ    │
│ FileList (level 2)   │ NEW MOUNT   │ Conditional│
│ FileObject(Misc)     │ NEW MOUNT   │ First time │
│ FileObject(unnamed)  │ NEW MOUNT   │ First time │
│ FileObject(README)   │ NO          │ No state Δ │
└────────────────────────────────────────────────┘

WHY IS THIS EFFICIENT?
1. LOCAL state → only subtree of clicked directory re-renders
2. Siblings are NOT affected (different component instances)
3. Parent FileList doesn't re-render (no prop changes)
4. New children are MOUNTED, not re-rendered (first time)
5. Compare with GLOBAL state approach:
   Root state changes → ENTIRE tree re-renders
   → Need React.memo to prevent wasted renders
```

**Key Insight — Mount vs Re-render vs Unmount:**

```tsx
// EXPAND directory:
// Children FileList → MOUNT (new component instance created)
// All children FileObjects → MOUNT (each gets fresh useState(false))

// COLLAPSE directory:
// Children FileList → UNMOUNT (removed from DOM)
// All children FileObjects → UNMOUNT (state destroyed!)
// → If user re-expands: all children start COLLAPSED again
// → This is EXPECTED behavior (fresh state on mount)

// To PRESERVE expanded state across collapse/expand:
// Option 1: CSS display:none instead of conditional render
{
  fileChildren && (
    <div style={{ display: expanded ? "block" : "none" }}>
      <FileList fileList={fileChildren} level={level + 1} />
    </div>
  );
}
// ✅ State preserved — children stay mounted
// ❌ More DOM nodes (hidden elements still in DOM)
// ❌ Initial render slower (mounts ALL children)

// Option 2: Lift state to global Set<id>
// ✅ State centralized — never lost
// ❌ More complex code
```

**React Key đặc biệt quan trọng trong Tree:**

```tsx
// ✅ CORRECT: Unique ID as key
<FileObject key={file.id} file={file} level={level} />;

// ❌ WRONG: Index as key
{
  items.map((file, index) => (
    <FileObject key={index} file={file} level={level} />
  ));
}

// WHY wrong?
// After sorting: items order changes!
// Index 0 was "Downloads", now it's "Documents"
// React thinks SAME component, just props changed
// → Expanded state of "Downloads" transfers to "Documents"!
// → CRITICAL BUG in tree UIs

// Example:
// Before sort: [Downloads(expanded), README]  → key=0: Downloads
// After  sort: [Documents, Downloads, README]  → key=0: Documents
// React: key=0 is same component → keeps expanded state
// Result: Documents appears expanded (wrong!)
```

---

### Step 15: State Transitions & Lifecycle Visualization

> 📊 "Từng bước state change — mental model cho debugging."

**State Machine cho FileObject:**

```
┌─────────────────────────────────────────────────────────────┐
│                 FILEOBJECT STATE MACHINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FOR FILES (isDirectory = false):                             │
│                                                               │
│    ┌──────────────────┐                                       │
│    │    Rendered       │  (only state — static, no transitions)│
│    │    expanded=false │  (never used, but initialized)        │
│    └──────────────────┘                                       │
│                                                               │
│  FOR DIRECTORIES (isDirectory = true):                        │
│                                                               │
│    ┌──────────────────┐     click      ┌─────────────────┐   │
│    │    COLLAPSED      │ ──────────────→│    EXPANDED      │   │
│    │    expanded=false │                │    expanded=true │   │
│    │    children hidden│ ←──────────────│    children shown│   │
│    └──────────────────┘     click      └─────────────────┘   │
│                                                               │
│    Mount → COLLAPSED                                          │
│    Unmount → state destroyed                                  │
│    Re-mount → COLLAPSED (fresh useState(false))               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Complete Lifecycle Trace:**

```
USER ACTION: Click "Downloads" to expand

Timeline:
──────────────────────────────────────────────────────────
T0: onClick handler fires
    → isDirectory = true (not returned early)
    → setExpanded(!false) → setExpanded(true)

T1: React schedules re-render for FileObject(Downloads)
    → React batches this with any other state updates

T2: React calls FileObject(Downloads) function again
    → useState(false) returns [true, setExpanded]
    → expanded = true now
    → isDirectory = true (same as before)

T3: JSX evaluation
    → button text: "Downloads [-]" (was "[+]")
    → Conditional: fileChildren && length > 0 && true
    → <FileList fileList={children} level={2} /> included

T4: React processes FileList(level 2) — MOUNT
    → Runs sort: dirs=[Misc], files=[unnamed.txt]
    → items = [Misc, unnamed.txt]
    → Renders <ul> with 2 <FileObject> children

T5: React processes FileObject(Misc) — MOUNT
    → useState(false) → expanded = false
    → isDirectory = true
    → Renders: "Misc [+]" (collapsed)

T6: React processes FileObject(unnamed.txt) — MOUNT
    → useState(false) → expanded = false
    → isDirectory = false
    → Renders: "unnamed.txt" (no expand icon)

T7: React commits DOM changes
    → Downloads button text: "[+]" → "[-]"
    → New <ul> inserted after Downloads button
    → 2 new <li> elements inserted

T8: Browser paints
    → User sees Downloads expanded with children
──────────────────────────────────────────────────────────

Total: ~2-5ms for small trees
```

**Multiple Expand Scenario:**

```
Step 1: User expands "Downloads"
  State: { Downloads: expanded=true }
  Mounted: Misc(collapsed), unnamed.txt

Step 2: User expands "Misc" (inside Downloads)
  State: { Downloads: expanded=true, Misc: expanded=true }
  New mounts: bar.txt, foo.txt

Step 3: User collapses "Downloads"
  State: { Downloads: expanded=false }
  UNMOUNTED: Misc, unnamed.txt, bar.txt, foo.txt
  → Misc's expanded=true state is LOST!

Step 4: User re-expands "Downloads"
  State: { Downloads: expanded=true }
  New mounts: Misc(collapsed!), unnamed.txt
  → Misc starts collapsed again (fresh useState)
  → Deep children (bar.txt, foo.txt) NOT visible

IMPLICATION:
"Collapsing a parent resets ALL descendant states."
This is natural UX (VS Code does same thing).
If need to preserve: use CSS display:none or global state.
```

---

### Step 16: TypeScript Patterns Deep Dive

> 🔷 "Chứng minh TypeScript proficiency — Senior-level type safety."

**Pattern 1: Discriminated Unions vs Optional Fields**

```typescript
// APPROACH A: Optional field (current choice)
type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
}>;

// Usage:
function isDirectory(item: FileData): boolean {
  return Boolean(item.children);
}

// TypeScript narrowing:
if (item.children) {
  // TypeScript knows: item.children is ReadonlyArray<FileData>
  item.children.map(child => /* ... */);
}

// APPROACH B: Discriminated Union (stricter)
type FileNode =
  | { kind: 'file'; id: number; name: string }
  | { kind: 'directory'; id: number; name: string; children: ReadonlyArray<FileNode> };

// Usage:
function render(node: FileNode) {
  switch (node.kind) {
    case 'file':
      return <span>{node.name}</span>;
    case 'directory':
      return (
        <>
          <span>{node.name}</span>
          {node.children.map(child => render(child))}
          {/* TypeScript knows: children exists here! */}
        </>
      );
  }
}

// TRADE-OFFS:
// Optional: simpler, less code, matches API data shape
// Union:    stricter, exhaustive checking, more verbose
// Interview recommendation: Optional (simpler, faster to implement)
```

**Pattern 2: Generic File Tree**

```typescript
// GENERIC version — accepts any node with id + name + children
type TreeNode<T extends { id: number | string; name: string }> = T & {
  children?: ReadonlyArray<TreeNode<T>>;
};

// Usage:
interface FileMetadata {
  id: number;
  name: string;
  size: number;
  modifiedAt: Date;
  permissions: string;
}

type FileTreeNode = TreeNode<FileMetadata>;

// Now FileTreeNode has: id, name, size, modifiedAt, permissions, children?
// → Reusable for any tree structure!

// Even more generic:
type GenericTree<T> = T & {
  children?: ReadonlyArray<GenericTree<T>>;
};

// Organization chart:
type OrgNode = GenericTree<{
  id: string;
  name: string;
  title: string;
  level: string;
}>;

// Menu system:
type MenuItem = GenericTree<{
  id: string;
  name: string;
  href: string;
  icon: string;
}>;
```

**Pattern 3: Utility Types cho File Explorer**

```typescript
// Extract all IDs from tree (for "expand all" feature)
function getAllIds(items: ReadonlyArray<FileData>): Set<number> {
  const ids = new Set<number>();

  function traverse(nodes: ReadonlyArray<FileData>) {
    for (const node of nodes) {
      ids.add(node.id);
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(items);
  return ids;
}

// Get directory IDs only (for expand all directories)
function getDirectoryIds(items: ReadonlyArray<FileData>): Set<number> {
  const ids = new Set<number>();

  function traverse(nodes: ReadonlyArray<FileData>) {
    for (const node of nodes) {
      if (node.children) {
        ids.add(node.id);
        traverse(node.children);
      }
    }
  }

  traverse(items);
  return ids;
}

// Find path to a node (for "reveal in tree" feature)
function findPath(
  items: ReadonlyArray<FileData>,
  targetId: number,
): number[] | null {
  for (const item of items) {
    if (item.id === targetId) return [item.id];

    if (item.children) {
      const childPath = findPath(item.children, targetId);
      if (childPath) return [item.id, ...childPath];
    }
  }
  return null;
}

// Usage: "Reveal config.json in file tree"
const path = findPath(data, configJsonId);
// path = [rootDirId, subDirId, configJsonId]
// → Expand all directories in path
```

**Pattern 4: Props Type Patterns**

```typescript
// PATTERN A: Inline type (quick, interview-friendly)
function FileObject({ file, level }: { file: FileData; level: number }) {}

// PATTERN B: Readonly wrapper (type-safe)
function FileObject({
  file,
  level,
}: Readonly<{ file: FileData; level: number }>) {}

// PATTERN C: Dedicated Props type (production)
interface FileObjectProps {
  readonly file: FileData;
  readonly level: number;
}
function FileObject({ file, level }: FileObjectProps) {}

// PATTERN D: ComponentProps extraction (advanced)
type FileObjectProps = React.ComponentProps<typeof FileObject>;
// → Useful for testing: const props: FileObjectProps = { ... }

// PATTERN E: PropsWithChildren (when wrapping)
interface FileListProps {
  fileList: ReadonlyArray<FileData>;
  level: number;
}
// React.PropsWithChildren<FileListProps> → adds children?: ReactNode

// INTERVIEW TIP:
// Start with Pattern A (fastest)
// Mention Pattern B/C as production preference
// Never use `any` for props!
```

**Pattern 5: Strict Event Handler Typing**

```typescript
// ❌ Loose typing
const handleClick = (e: any) => { ... };

// ✅ Strict typing
const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
  // e is React.MouseEvent<HTMLButtonElement>
  // e.currentTarget is HTMLButtonElement
  if (!isDirectory) return;
  setExpanded(prev => !prev);
};

// Or inline:
<button onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
  if (!isDirectory) return;
  setExpanded(prev => !prev);
}}>

// For keyboard events:
const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    setExpanded(prev => !prev);
  }
};
```

---

### Step 17: Debugging Recursive Components

> 🐛 "Khi recursive rendering đi sai — cách identify và fix."

**Problem 1: Infinite Recursion**

```tsx
// SYMPTOM: "Maximum update depth exceeded" or browser hangs

// CAUSE 1: Missing base case
function FileList({ fileList }: Props) {
  return (
    <ul>
      {fileList.map(file => (
        <FileObject key={file.id} file={file} />
      ))}
    </ul>
  );
}
// FileObject ALWAYS renders FileList, even for files
// → FileList for files with no children → empty but still mounted
// → Not truly infinite, but wasteful

// FIX: Guard rendering
{fileChildren && fileChildren.length > 0 && expanded && (
  <FileList ... />
)}

// CAUSE 2: Circular data reference
const dir = { id: 1, name: 'dir', children: [] };
dir.children.push(dir); // Circular! dir contains itself!
// → FileObject renders FileList → FileObject renders FileList → ∞

// FIX: Depth limit
function FileObject({ file, level }: Props) {
  if (level > 50) {
    console.warn('Max depth exceeded:', file.name);
    return <li>⚠️ Max depth exceeded</li>;
  }
  // ... normal rendering
}
```

**Problem 2: State Not Updating**

```tsx
// SYMPTOM: Click directory, nothing happens

// CAUSE 1: isDirectory check wrong
const isDirectory = file.children; // ❌ returns array, not boolean
// Empty array [] is truthy BUT...
// If used in onClick: if (!file.children) return;
// Empty array is truthy → correct... but fragile

// FIX: Explicit boolean conversion
const isDirectory = Boolean(file.children);

// CAUSE 2: Forgot to call setExpanded
onClick={() => {
  if (!isDirectory) return;
  expanded = !expanded; // ❌ Mutating variable, not state!
}}

// FIX: Use setter function
onClick={() => {
  if (!isDirectory) return;
  setExpanded(!expanded); // ✅ Trigger re-render
}}

// CAUSE 3: Event handler bound to wrong element
<li onClick={handleClick}> {/* ❌ click fires on any child */}
  <button>{fileName}</button>
  <FileList ... /> {/* Click here also triggers toggle! */}
</li>

// FIX: Handle on button only
<li>
  <button onClick={handleClick}>{fileName}</button>
  <FileList ... />
</li>
```

**Problem 3: Sort Not Working**

```tsx
// SYMPTOM: Items appear in original order, not sorted

// CAUSE 1: Mutating ReadonlyArray
fileList.sort(...); // ❌ TypeScript error (ReadonlyArray)
                     // But if type is loose: mutates props! Bad!

// FIX: Create new array first
const dirs = fileList.filter(item => item.children);
dirs.sort(...); // ✅ filter() returns new array

// CAUSE 2: localeCompare returns wrong type
directories.sort((a, b) => a.name > b.name);
// ❌ Returns boolean, sort expects number!
// > returns true/false, not -1/0/1

// FIX: Use localeCompare or ternary
directories.sort((a, b) => a.name.localeCompare(b.name)); // ✅
directories.sort((a, b) => a.name > b.name ? 1 : -1);     // 🟡 OK but no locale
```

**Problem 4: Wrong Indentation**

```tsx
// SYMPTOM: All items at same indentation level

// CAUSE 1: CSS not applied to nested <ul>
.file-list {
  padding-left: 0; // No indentation!
}

// FIX:
.file-list {
  padding-left: 16px;
}

// CAUSE 2: Using margin instead of padding
.file-list {
  margin-left: 16px; // ⚠️ Works visually but...
  // margin doesn't create containing block
  // Background, borders won't cover indented area
}

// FIX: Use padding-left (includes content within box)

// CAUSE 3: level prop not passed correctly
<FileList fileList={fileChildren} level={1} /> // ❌ Always 1!
// FIX:
<FileList fileList={fileChildren} level={level + 1} /> // ✅ Increment
```

**Debugging Tools for Tree Components:**

```tsx
// 1. React DevTools — Component tab
// Shows component tree hierarchy
// Can see props and state for each FileObject
// Can manually change expanded state

// 2. Console.log with depth indicator
function FileObject({ file, level }: Props) {
  console.log("  ".repeat(level) + `Render: ${file.name} (level ${level})`);
  // Output:
  //   Render: Documents (level 1)
  //     Render: Powerpoint.ppt (level 2)
  //     Render: Word.doc (level 2)
  //   Render: Downloads (level 1)
  //     Render: Misc (level 2)
  //       Render: bar.txt (level 3)
  //       Render: foo.txt (level 3)
  //     Render: unnamed.txt (level 2)
  //   Render: README.md (level 1)

  // ...
}

// 3. React Profiler (performance debugging)
import { Profiler } from "react";

function onRender(id: string, phase: string, actualDuration: number) {
  console.log(`${id} ${phase}: ${actualDuration.toFixed(2)}ms`);
}

<Profiler id="FileTree" onRender={onRender}>
  <FileExplorer data={data} />
</Profiler>;

// 4. Why Did You Render (npm package)
// Detects unnecessary re-renders
// Shows which props/state changed
```

---

### Step 18: CSS Deep Dive — Indentation Strategies

> 🎨 "Multiple cách tạo indentation — tradeoffs cho mỗi cách."

**Strategy 1: Nested `<ul>` padding (Current — Recommended)**

```css
.file-list {
  padding-left: 16px;
}

/* HOW IT WORKS:
<ul style="padding-left: 16px">           ← Level 1 (16px)
  <li>Documents</li>
  <li>
    <ul style="padding-left: 16px">       ← Level 2 (32px total)
      <li>Word.doc</li>
      <li>
        <ul style="padding-left: 16px">   ← Level 3 (48px total)
          <li>deep.txt</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>

CSS padding STACKS on nested elements → natural indentation!
No JavaScript needed for indent calculation.
*/

/* PROS:
✅ Pure CSS — no inline styles
✅ Automatic — each nested <ul> adds indent
✅ Semantic — proper list nesting
✅ Customizable — just change padding value
✅ Responsive — easy to adjust with media queries
*/

/* CONS:
❌ Can't have different indent per level
❌ Hard to draw tree lines (├──)
*/
```

**Strategy 2: Inline `style` with `level` prop**

```tsx
function FileObject({ file, level }: Props) {
  return <div style={{ paddingLeft: level * 20 }}>{file.name}</div>;
}

/* PROS:
✅ Precise control per level
✅ Easy to adjust multiplier
✅ Can have different indent per level
*/

/* CONS:
❌ Inline styles (can't cache CSS)
❌ Need level prop just for styling
❌ Not semantic (<div> instead of <ul>/<li>)
❌ Harder to override with CSS
*/
```

**Strategy 3: CSS Custom Property (Modern)**

```css
.file-item {
  padding-left: calc(var(--depth, 0) * 16px);
}
```

```tsx
function FileObject({ file, level }: Props) {
  return (
    <li
      className="file-item"
      style={{ "--depth": level } as React.CSSProperties}
    >
      <button>{file.name}</button>
    </li>
  );
}

/* PROS:
✅ CSS handles calculation
✅ Can override in CSS (media queries, themes)
✅ Semantic with <li>
✅ Level as CSS variable — usable in animations
*/

/* CONS:
❌ CSS custom properties less familiar
❌ TypeScript needs cast (as React.CSSProperties)
❌ Slightly more complex setup
*/
```

**Strategy 4: Tree Lines (Production UI)**

```css
.tree-item {
  position: relative;
  padding-left: 20px;
}

/* Vertical line */
.tree-item::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #ddd;
}

/* Horizontal branch */
.tree-item::after {
  content: "";
  position: absolute;
  left: 8px;
  top: 12px;
  width: 12px;
  height: 1px;
  background-color: #ddd;
}

/* Last item — shorter vertical line */
.tree-item:last-child::before {
  height: 12px;
}

/* RESULT:
├── Documents/
│   ├── Word.doc
│   └── Powerpoint.ppt
├── Downloads/
│   ├── Misc/
│   │   ├── bar.txt
│   │   └── foo.txt
│   └── unnamed.txt
└── README.md
*/
```

**Strategy Comparison:**

```
┌──────────────────────────────────────────────────────────────┐
│           INDENTATION STRATEGY COMPARISON                     │
├────────────────┬──────────┬──────────┬──────────┬────────────┤
│                │ Nested   │ Inline   │ CSS Var  │ Tree Lines │
│                │ padding  │ style    │ calc()   │ ::before   │
├────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Semantic HTML  │ ✅        │ ❌        │ ✅        │ ✅          │
│ No JS needed   │ ✅        │ ❌        │ ❌        │ ✅          │
│ Per-level ctrl │ ❌        │ ✅        │ ✅        │ ✅          │
│ Tree lines     │ ❌        │ ❌        │ ❌        │ ✅          │
│ Responsive     │ ✅        │ ❌        │ ✅        │ 🟡          │
│ Complexity     │ ⭐        │ ⭐        │ ⭐⭐      │ ⭐⭐⭐       │
│ Interview      │ ✅        │ 🟡        │ 🟡        │ ❌          │
├────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Best for       │Interview │Quick MVP │Modern app│Production  │
└──────────────────────────────────────────────────────────────┘
```

---

### Step 19: Interview Follow-up Questions Deep Dive

> 🎯 "30 câu hỏi interviewer hay hỏi + câu trả lời mẫu."

**Category 1: Design & Architecture (10 questions)**

```
Q1: "Tại sao 3 components thay vì 1 hoặc 2?"
A: "Separation of concerns:
    - FileExplorer: entry point, future toolbar/search
    - FileList: sorting logic, reusable at every level
    - FileObject: per-item state management
    Sorting PHẢI ở FileList vì mỗi level sort independently.
    State PHẢI ở FileObject vì expand/collapse là per-directory."

Q2: "Nếu thêm 'select file' feature thì sao?"
A: "2 approaches:
    Option A: Local — mỗi FileObject thêm selected state
    Option B: Global — FileExplorer giữ selectedId + callback
    Tôi choose Global vì:
    - Selection ảnh hưởng display ở nhiều nơi (header, breadcrumb)
    - Selected file info cần ở parent
    - Only 1 file selected tại 1 thời điểm
    Implementation: Pass onSelect callback + selectedId prop."

Q3: "Nếu data RẤT LỚN (100K+ items)?"
A: "Hierarchy of solutions:
    1. useMemo sort — avoid re-sorting on re-render
    2. React.memo — avoid re-rendering unchanged nodes
    3. Lazy children — don't sort/render until expanded
    4. Virtualization — only render visible items
    5. Flatten tree + react-window — render scrollable list
    Production: VS Code uses flat list + virtualization."

Q4: "Tại sao không dùng Context cho state?"
A: "YAGNI. Context useful khi:
    - Multiple components cần shared state
    - Deep prop drilling is painful
    Expand/collapse state là truly local:
    - Mỗi directory independent
    - Không cần sibling coordination
    - No external consumers
    Context adds: Provider, Consumer, re-render concerns."

Q5: "Nếu cần 'expand all / collapse all' button?"
A: "3 approaches escalating in complexity:
    1. Imperative refs: useRef per FileObject, call expand()
       → Fragile, not React-idiomatic
    2. Lift state: Set<id> in FileExplorer, pass as prop
       → Clean, but prop drilling
    3. Context + useReducer: dispatch({ type: 'EXPAND_ALL' })
       → Most scalable, cleanest API
    Tôi recommend #2 for interview scope, mention #3."

Q6: "Tại sao dùng <ul>/<li> thay vì <div>?"
A: "Semantic HTML:
    - Screen readers announce 'list, 5 items'
    - <div> announces nothing — 'group'
    - <ul> nesting naturally represents hierarchy
    - Better for SEO crawlers
    - Free keyboard navigation in some browsers
    Also: list-style:none removes bullets cleanly."

Q7: "Nếu data từ API, loading state ở đâu?"
A: "2 levels of loading:
    Root level: FileExplorer handles loading/error/data
    Per-directory: Lazy loading children from API

    Root:
    const { data, loading, error } = useQuery(FILE_TREE);
    if (loading) return <Skeleton />;
    if (error) return <ErrorState />;
    return <FileList fileList={data} level={1} />;

    Per-directory:
    FileObject fetches children on expand
    Shows spinner inside directory while loading."

Q8: "Tại sao Sort ở render time, không ở data layer?"
A: "Sort ở render vì:
    1. Data layer doesn't know UI requirements
    2. Sort criteria có thể thay đổi (name, size, date)
    3. User có thể toggle sort order
    4. Backend API không nên sort cho UI
    5. Component tự quyết display order
    Trade-off: Tốn compute mỗi render → useMemo solve."

Q9: "Naming convention: FileObject hay FileItem hay TreeNode?"
A: "FileObject match đề bài nên tôi giữ.
    Nếu tự đặt:
    - TreeNode: generic, reusable
    - FileItem: specific, clear
    - FileEntry: mimic file system API
    Production: dùng TreeNode cho generic tree,
    FileItem cho file-specific logic."

Q10: "Tại sao không recursive sort ở root?"
A: "Deep sort ở root = transform TOÀN BỘ data upfront:
    function deepSort(items) {
      return items.map(item => ({
        ...item,
        children: item.children ? deepSort(sort(item.children)) : undefined
      }));
    }

    Problems:
    1. O(n) copy entire tree — expensive
    2. Sort children người dùng chưa thấy — wasteful
    3. Data transformation thay vì display concern
    4. Harder to change sort dynamically

    FileList sort: only sort VISIBLE level, on demand."
```

**Category 2: Performance (5 questions)**

```
Q11: "Khi nào cần useMemo cho sort?"
A: "Khi parent re-renders mà fileList KHÔNG đổi:
    - Parent state change → FileList re-renders
    - fileList reference same → sort is wasted work
    - useMemo skips sort if dependency unchanged

    Rule of thumb: 100+ items = always useMemo
    < 20 items = không cần (sort rất nhanh)
    20-100 = depends on re-render frequency."

Q12: "React.memo có cần không?"
A: "Cho File Explorer VỚI LOCAL STATE → ít cần:
    - Sibling FileObjects don't re-render when 1 expands
    - FileList doesn't re-render when child expands
    - Only subtree re-renders

    Cần React.memo KHI:
    - Sort lại ở FileList → all children re-render
    - Parent has other state causing re-renders
    - Very large lists (1000+ siblings)"

Q13: "Virtual scrolling cho tree structure hoạt động sao?"
A: "Flatten tree first:
    Tree:         Flat list:
    A/            [A, B, C, D]  ← chỉ expanded nodes
      B
      C/          [A, B, C, D, E, F]  ← khi C expanded
        D

    react-window renders visible items only:
    - Viewport shows items 3-15 (of 1000)
    - Only 13 DOM elements exist
    - Scroll → update visible range
    - Indent via paddingLeft: depth * 16px

    Key: Must re-flatten when expand/collapse changes."

Q14: "Performance với deep nesting (100 levels)?"
A: "Problems at 100 levels:
    1. Stack overflow risk (recursive rendering)
       → Solution: trampoline pattern or iterative render
    2. CSS indent: 100 * 16px = 1600px padding
       → Solution: max indent cap or horizontal scroll
    3. Component instances: 100 nested FileLists
       → Each with own sort computation

    Practical answer: Real file systems rarely >20 deep.
    Add MAX_DEPTH = 50 guard with '...' truncation."

Q15: "Memory footprint của tree components?"
A: "Per FileObject:
    - Component fiber: ~1KB
    - useState hook: ~20 bytes (boolean)
    - Closure refs: ~100 bytes
    - DOM nodes: button + li + span ≈ 3 nodes

    1000 files:
    - ~1MB fiber memory
    - ~1000 booleans (trivial)
    - ~3000 DOM nodes (browser handles fine)
    - Sort arrays: temporary, GC'd after render

    10K+: need virtualization (only ~50 DOM nodes)."
```

**Category 3: Edge Cases & Bugs (5 questions)**

```
Q16: "Nếu children: null thay vì children: undefined?"
A: "Boolean(null) = false → treated as file. ✅ Correct!
    Nhưng TypeScript type nói children?: ReadonlyArray
    → undefined, not null
    Nếu API returns null:
    const isDirectory = children !== undefined && children !== null;
    Hoặc: children != null (loose equality covers both)"

Q17: "2 directories cùng name nhưng khác level?"
A: "Hoạt động bình thường:
    /root/
      config/        ← id: 1
        app.json
      src/
        config/      ← id: 5 (different ID!)
          api.ts

    React keys use id (unique) not name
    → Components correctly tracked
    → Expand one doesn't affect other"

Q18: "Nếu id bị duplicate trong data?"
A: "React warning: 'encountered two children with the same key'
    Bugs:
    1. State confusion between components with same key
    2. Incorrect reconciliation (wrong component gets updated)

    Detection:
    const allIds = getAllIds(data);
    if (allIds.size !== totalNodes) console.error('Duplicate IDs!')

    Prevention: Backend validates uniqueness."

Q19: "Nếu name rỗng ('')?"
A: "Renders empty space for name. Button still clickable.
    Fix:
    <span>{fileName || '(unnamed)'}</span>

    Better: Validate at data layer
    if (!fileName.trim()) throw new Error('Empty name')"

Q20: "Symlinks / circular references trong real file system?"
A: "Real file system has symlinks → can create cycles:
    /a/ → /b/
    /b/ → /a/
    → Infinite recursion!

    Solutions:
    1. Track visited path: Set<string> of path ancestors
    2. Max depth limit
    3. Backend resolves symlinks / marks them
    4. Show symlink icon, don't recurse into them"
```

**Category 4: Feature Extensions (5 questions)**

```
Q21: "Thêm breadcrumb navigation?"
A: "Need path tracking:
    FileExplorer passes currentPath: FileData[]
    Click directory: push to path
    Click breadcrumb: slice path

    Or: Derive from expanded state + tree structure
    const breadcrumb = findExpandedPath(data, expandedIds);"

Q22: "Thêm rename file inline?"
A: "ContentEditable or input:
    1. Double-click file name → switch to <input>
    2. User types new name
    3. Enter → save, Escape → cancel
    State: { editingId: number | null, editValue: string }
    Lift to FileExplorer or Context."

Q23: "Multi-select files?"
A: "selectedIds: Set<number> in FileExplorer
    Click: toggle single
    Shift+Click: range select
    Ctrl/Cmd+Click: add to selection
    Need: flat ordered list to calculate range."

Q24: "Search/filter files?"
A: "2 approaches:
    A: Filter tree → show only matching + ancestors
    B: Show flat list of matches

    Approach A (tree preserved):
    function filterTree(items, query) {
      return items.filter(item =>
        item.name.includes(query) ||
        (item.children && filterTree(item.children, query).length > 0)
      ).map(item => ({
        ...item,
        children: item.children ? filterTree(item.children, query) : undefined
      }));
    }"

Q25: "Drag and drop reorder?"
A: "Need:
    1. react-dnd or HTML5 Drag API
    2. Drop targets: directories + between items
    3. State: full tree data in root (can't be local anymore!)
    4. Actions: MOVE_NODE(nodeId, newParentId, position)

    This is where architecture MUST evolve:
    Local state → Global state + reducer"
```

**Category 5: Code Quality (5 questions)**

```
Q26: "Test strategy cho recursive component?"
A: "3 levels:
    Unit: Sort utility (pure function, easy to test)
    Component: FileObject renders correctly for file/dir
    Integration: Full tree renders in correct order

    Key test: 'directories appear before files at each level'
    const { getAllByRole } = render(<FileExplorer data={data} />);
    const items = getAllByRole('button');
    expect(items[0]).toHaveTextContent('Documents');  // dir first"

Q27: "Error handling strategy?"
A: "3 layers:
    1. Data validation: Zod schema validates tree structure
    2. Component guard: if (!fileList?.length) return null
    3. Error Boundary: catches rendering errors, shows fallback

    Never let corrupt data crash entire app."

Q28: "Làm sao ensure Sort stability?"
A: "Array.sort() không guaranteed stable (pre-ES2019).
    ES2019+: stable in all modern browsers.

    Ensure stability:
    dirs.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      if (cmp !== 0) return cmp;
      return a.id - b.id;  // Tiebreaker by id
    });

    Partition approach inherently stable:
    split → sort each → merge = stable result"

Q29: "Code review — điều gì bạn sẽ comment?"
A: "1. Missing useMemo cho sort
    2. Missing aria-label trên buttons
    3. Missing error boundary
    4. sort() call trong render body (not memoized)
    5. No loading/error states
    6. Magic number 16 (padding) should be CSS variable"

Q30: "Nếu có 30 phút thay vì 45, bạn cắt gì?"
A: "Priority order:
    1. Types + data model (2 min)         — KEEP
    2. FileExplorer root (2 min)          — KEEP
    3. FileObject with state (8 min)      — KEEP
    4. FileList with sort (8 min)         — KEEP
    5. CSS indentation (3 min)            — SIMPLIFY
    6. Test with data (2 min)             — KEEP
    7. Edge cases discussion (5 min)      — CUT some

    30 min: build working solution (25) + discuss (5)
    45 min: build (25) + edge cases (10) + enhancements (10)"
```

---

### Step 20: Real-world Tree UIs — Pattern Comparison

> 🌍 "So sánh với các tree UI nổi tiếng — show breadth of knowledge."

**VS Code File Explorer:**

```
ARCHITECTURE:
├── Uses flat list (not recursive) + virtualization
├── Indent via padding-left: depth * indentSize
├── State: global set of expanded folders
├── Data: lazy loaded per directory
└── Rendering: only visible rows in viewport

KEY FEATURES BEYOND OUR IMPLEMENTATION:
1. Compact folders: src/components/ui → single row
2. File decorations: git status (M, U, D) colors
3. Custom icons per file type
4. Drag-and-drop reorder
5. Multi-select with Shift/Ctrl
6. Right-click context menu
7. Inline rename (F2)
8. Search filter with highlighting
9. File watching (auto-refresh on FS change)

PERFORMANCE TRICKS:
- VariableSizeList for different row heights
- Debounced file watching
- Web Workers for file search
- Lazy icon loading
```

**macOS Finder (List View):**

```
ARCHITECTURE:
├── NSOutlineView (native tree table)
├── Data source pattern (lazy data provider)
├── State: System tracks expand/collapse
└── Rendering: Only visible + buffer rows

SIMILARITIES TO OUR COMPONENT:
✅ Directories before files
✅ Alphabetical sort within groups
✅ Indent per level
✅ Expand/collapse per directory

DIFFERENCES:
- Columns (name, date, size, kind)
- Sort by any column
- Drag to rearrange columns
- Quick Look preview (spacebar)
- Color tags / labels
```

**Chrome DevTools Elements Panel:**

```
ARCHITECTURE:
├── DOM tree is LIVE (changes in real-time)
├── Each node shows: tag, attributes, text
├── Expand to see children
├── Highlight on hover
└── Search by CSS selector

COMPARISON:
Our File Explorer           Chrome Elements
Static data                 Live DOM (MutationObserver)
Sort dirs first             No sorting (DOM order)
Simple expand/collapse      Expand + reveal + highlight
Text-only display           Rich formatting per type
No selection highlight      Selected + highlighted states
```

**GitHub Repository File Tree:**

```
ARCHITECTURE:
├── Server-side rendered initial view
├── Client-side lazy loading for directories
├── Flat list presentation (no nesting in initial view)
├── Sidebar tree (recent addition) — lazy loaded
└── API: GET /repos/:owner/:repo/contents/:path

KEY PATTERNS WE CAN LEARN:
1. LAZY LOADING:
   - Don't load all files upfront
   - Fetch directory contents on expand
   - Show skeleton while loading

2. BREADCRUMB NAVIGATION:
   - Show path: src / components / ui / Button.tsx
   - Click any segment to navigate

3. FILE SIZE DISPLAY:
   - Show file size next to name
   - Different units (B, KB, MB)

4. LAST COMMIT MESSAGE:
   - Per-file last commit info
   - Hover for full message
```

**Design Pattern Analysis:**

```
┌────────────────────────────────────────────────────────────────────┐
│         TREE UI — UNIVERSAL PATTERNS                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PATTERN 1: Recursive vs Flat                                        │
│ ├── Small trees (< 1000 nodes): Recursive components work fine      │
│ ├── Large trees (1K-10K): Consider useMemo + React.memo             │
│ └── Huge trees (10K+): Flatten + virtualize (mandatory)             │
│                                                                     │
│ PATTERN 2: State Location                                           │
│ ├── Basic: Local useState per node                                  │
│ ├── + Expand All: Global Set<id> or Context                         │
│ ├── + Persist: URL params or localStorage                           │
│ └── + Collab: Server state (real-time sync)                         │
│                                                                     │
│ PATTERN 3: Data Loading                                             │
│ ├── Static: All data upfront (our approach)                         │
│ ├── Lazy: Fetch children on expand                                  │
│ ├── Hybrid: First 2 levels upfront, rest lazy                       │
│ └── Streaming: WebSocket for live updates                           │
│                                                                     │
│ PATTERN 4: Sorting                                                  │
│ ├── Static: Sort at render time (our approach)                      │
│ ├── Dynamic: User can change sort column/direction                  │
│ ├── Server: API returns sorted data                                 │
│ └── Custom: Per-folder sort preferences                             │
│                                                                     │
│ PATTERN 5: Selection                                                │
│ ├── None: Display only (our approach)                               │
│ ├── Single: selectedId state                                        │
│ ├── Multi: selectedIds Set + Shift/Ctrl logic                       │
│ └── Range: Flat list ordering needed for Shift-click                │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**💬 Final Interview Summary — Architecture Evolution:**

```
EVOLUTION PATH FOR FILE EXPLORER:

MVP (Interview)
└── 3 components, local state, sort at render, CSS indent
    ↓
Production v1
└── + useMemo, React.memo, error boundary, a11y
    ↓
Production v2
└── + Global state (expand all), keyboard nav, file icons
    ↓
Production v3
└── + Lazy loading, search/filter, context menu
    ↓
Enterprise
└── + Virtualization, drag-drop, multi-select, real-time sync

"Start simple. Each feature addition is justified by a real requirement.
 Don't build enterprise solution for interview.
 But KNOW the evolution path — that's what shows seniority."
```

---

### Step 21: Custom Hooks Extraction

> 🪝 "Tách logic ra hooks — clean code, reusable, testable."

**Hook 1: useToggle — Generic Toggle State**

```tsx
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((prev) => !prev), []);
  return [value, toggle];
}

// Usage in FileObject:
function FileObject({ file, level }: Props) {
  const [expanded, toggleExpanded] = useToggle(false);

  return (
    <li>
      <button
        onClick={() => {
          if (isDirectory) toggleExpanded();
        }}
      >
        {file.name}
      </button>
    </li>
  );
}

// WHY extract?
// 1. toggleExpanded is STABLE (useCallback) → safe as dependency
// 2. Reusable: dropdowns, modals, sidebars all need toggle
// 3. Testable: test hook logic independently
// 4. useCallback prevents child re-renders khi pass as prop
```

**Hook 2: useFileTree — Complete Tree State Management**

```tsx
interface UseFileTreeReturn {
  expandedIds: Set<number>;
  toggle: (id: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandTo: (targetId: number) => void;
  isExpanded: (id: number) => boolean;
}

function useFileTree(data: ReadonlyArray<FileData>): UseFileTreeReturn {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(getDirectoryIds(data));
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const expandTo = useCallback(
    (targetId: number) => {
      const path = findPath(data, targetId);
      if (path) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          // Expand all ancestors (not the target itself if it's a file)
          path.slice(0, -1).forEach((id) => next.add(id));
          return next;
        });
      }
    },
    [data],
  );

  const isExpanded = useCallback(
    (id: number) => expandedIds.has(id),
    [expandedIds],
  );

  return { expandedIds, toggle, expandAll, collapseAll, expandTo, isExpanded };
}

// Usage:
function FileExplorer({ data }: Props) {
  const tree = useFileTree(data);

  return (
    <div>
      <div className="toolbar">
        <button onClick={tree.expandAll}>Expand All</button>
        <button onClick={tree.collapseAll}>Collapse All</button>
      </div>
      <TreeContext.Provider value={tree}>
        <FileList fileList={data} level={1} />
      </TreeContext.Provider>
    </div>
  );
}
```

**Hook 3: useSortedFileList — Memoized Sorting**

```tsx
function useSortedFileList(
  fileList: ReadonlyArray<FileData>,
  sortBy: "name" | "size" | "date" = "name",
  sortOrder: "asc" | "desc" = "asc",
): ReadonlyArray<FileData> {
  return useMemo(() => {
    const directories = fileList.filter((item) => item.children);
    const files = fileList.filter((item) => !item.children);

    const comparator = (a: FileData, b: FileData) => {
      const result = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? result : -result;
    };

    directories.sort(comparator);
    files.sort(comparator);

    return [...directories, ...files];
  }, [fileList, sortBy, sortOrder]);
}

// Usage in FileList:
function FileList({ fileList, level }: Props) {
  const sortedItems = useSortedFileList(fileList);

  return (
    <ul className="file-list">
      {sortedItems.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}

// WHY custom hook instead of inline useMemo?
// 1. Sort logic reusable across different views (list, grid, table)
// 2. Easy to add sort options (by name, size, date)
// 3. Sort logic testable independently
// 4. Clear API: useSortedFileList(items, 'name', 'asc')
```

**Hook 4: useFileTypeInfo — File Metadata**

```tsx
interface FileTypeInfo {
  icon: string;
  color: string;
  category: "document" | "image" | "code" | "data" | "other";
}

function useFileTypeInfo(fileName: string, isDirectory: boolean): FileTypeInfo {
  return useMemo(() => {
    if (isDirectory) {
      return { icon: "📁", color: "#dcb67a", category: "other" as const };
    }

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

    const typeMap: Record<string, FileTypeInfo> = {
      ts: { icon: "🟦", color: "#3178c6", category: "code" },
      tsx: { icon: "⚛️", color: "#61dafb", category: "code" },
      js: { icon: "🟨", color: "#f7df1e", category: "code" },
      jsx: { icon: "⚛️", color: "#61dafb", category: "code" },
      css: { icon: "🎨", color: "#1572b6", category: "code" },
      html: { icon: "🌐", color: "#e34c26", category: "code" },
      json: { icon: "📋", color: "#5b5b5b", category: "data" },
      md: { icon: "📝", color: "#000000", category: "document" },
      png: { icon: "🖼️", color: "#a4c639", category: "image" },
      jpg: { icon: "🖼️", color: "#a4c639", category: "image" },
      pdf: { icon: "📕", color: "#ff0000", category: "document" },
    };

    return typeMap[ext] ?? { icon: "📄", color: "#999", category: "other" };
  }, [fileName, isDirectory]);
}

// Usage:
function FileObject({ file, level }: Props) {
  const isDirectory = Boolean(file.children);
  const { icon, color } = useFileTypeInfo(file.name, isDirectory);

  return (
    <li>
      <button>
        <span style={{ color }}>{icon}</span> {file.name}
      </button>
    </li>
  );
}
```

**💬 Interview talking point — Hook extraction criteria:**

```
WHEN TO EXTRACT A HOOK:
┌────────────────────────────────────────────────────────┐
│ Signal                    │ Action                      │
├───────────────────────────┼─────────────────────────────┤
│ Logic used in 2+ places   │ Extract immediately         │
│ Complex state logic       │ Extract for readability     │
│ Side effects + state      │ Extract for testability     │
│ 3+ useState in 1 component│ Consider extraction         │
│ Business logic in UI      │ Separate into custom hook   │
├───────────────────────────┼─────────────────────────────┤
│ Simple useState toggle    │ Maybe (depends on reuse)    │
│ Single effect + state     │ Only if reused              │
│ Component-specific logic  │ Keep inline                 │
└────────────────────────────────────────────────────────┘

FOR FILE EXPLORER:
- useToggle: EXTRACT (used in every directory)
- useSortedFileList: EXTRACT (sorting is core logic)
- useFileTree: EXTRACT only if global state needed
- useFileTypeInfo: EXTRACT if icons are complex

INTERVIEW: Keep inline for MVP. Mention extraction as production step.
```

---

### Step 22: Expand/Collapse Animations

> ✨ "Smooth transitions — production polish differentiator."

**Approach 1: CSS Transition (Simplest)**

```css
/* Slide-down animation for expanding */
.file-children-enter {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 200ms ease-out,
    opacity 200ms ease-out;
}

.file-children-enter-active {
  max-height: 1000px; /* Large enough for content */
  opacity: 1;
}

/* Rotate chevron */
.expand-icon {
  display: inline-block;
  transition: transform 200ms ease;
}

.expand-icon--expanded {
  transform: rotate(90deg);
}
```

```tsx
// Usage:
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <button onClick={() => isDirectory && setExpanded(!expanded)}>
        {isDirectory && (
          <span
            className={`expand-icon ${expanded ? "expand-icon--expanded" : ""}`}
          >
            ▶
          </span>
        )}
        {file.name}
      </button>
      {/* Always render for animation, control with CSS */}
      {isDirectory && fileChildren && fileChildren.length > 0 && (
        <div
          className={`file-children ${expanded ? "file-children--open" : ""}`}
        >
          <FileList fileList={fileChildren} level={level + 1} />
        </div>
      )}
    </li>
  );
}
```

**Approach 2: CSS Grid Animation (Modern, Height-aware)**

```css
.file-children-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease;
}

.file-children-wrapper--open {
  grid-template-rows: 1fr;
}

.file-children-wrapper > div {
  overflow: hidden;
}
```

```tsx
<div
  className={`file-children-wrapper ${expanded ? "file-children-wrapper--open" : ""}`}
>
  <div>
    <FileList fileList={fileChildren} level={level + 1} />
  </div>
</div>

// ADVANTAGES over max-height:
// ✅ No arbitrary max-height value needed
// ✅ Animates to exact content height
// ✅ Works with dynamic content
// ✅ Pure CSS — no JavaScript measurement
```

**Approach 3: useRef + requestAnimationFrame (Precise)**

```tsx
function useExpandAnimation(expanded: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;

    if (expanded) {
      // Measure natural height
      const naturalHeight = contentRef.current.scrollHeight;
      setHeight(naturalHeight);
    } else {
      setHeight(0);
    }
  }, [expanded]);

  return {
    contentRef,
    style: {
      height: expanded ? height : 0,
      overflow: "hidden",
      transition: "height 200ms ease",
    },
  };
}

// Usage:
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { contentRef, style } = useExpandAnimation(expanded);

  return (
    <li>
      <button onClick={toggleExpand}>{file.name}</button>
      <div ref={contentRef} style={style}>
        {fileChildren && fileChildren.length > 0 && (
          <FileList fileList={fileChildren} level={level + 1} />
        )}
      </div>
    </li>
  );
}

// TRADE-OFFS:
// ✅ Pixel-perfect height animation
// ✅ No content clipping
// ❌ JavaScript measurement on every toggle
// ❌ Height doesn't update if children change while expanded
// ❌ More complex code
```

**Animation Strategy Comparison:**

```
┌───────────────────────────────────────────────────────────┐
│            ANIMATION APPROACH COMPARISON                    │
├──────────────┬──────────┬──────────────┬──────────────────┤
│              │ max-h CSS│ CSS Grid     │ useRef + JS      │
├──────────────┼──────────┼──────────────┼──────────────────┤
│ Complexity   │ ⭐        │ ⭐⭐          │ ⭐⭐⭐             │
│ Height-aware │ ❌        │ ✅            │ ✅                │
│ Performance  │ ✅ (GPU)  │ ✅ (GPU)      │ 🟡 (JS + GPU)    │
│ Dynamic cont │ ⚠️ fragile│ ✅            │ ⚠️ needs update  │
│ Browser supp │ ✅ all    │ 🟡 modern    │ ✅ all            │
│ Interview    │ ✅ mention│ ✅ mention    │ ❌ don't impl     │
└───────────────────────────────────────────────────────────┘

RECOMMENDATION:
Interview: NO animation (focus on functionality)
Mention: "I'd add CSS Grid animation for smooth expand/collapse"
Production: CSS Grid approach (modern, clean, performant)
```

**⚠️ Animation + Conditional Rendering Conflict:**

```tsx
// PROBLEM: Our current code conditionally renders children
{expanded && <FileList ... />}
// → Component unmounts when collapsed → no exit animation possible!

// SOLUTION 1: Always mount, hide with CSS
{fileChildren && (
  <div style={{ display: expanded ? 'block' : 'none' }}>
    <FileList ... />
  </div>
)}
// ✅ Allows exit animation
// ❌ All children mounted (even collapsed) → more memory

// SOLUTION 2: react-transition-group
import { CSSTransition } from 'react-transition-group';

<CSSTransition
  in={expanded}
  timeout={200}
  classNames="file-children"
  unmountOnExit  // Unmounts AFTER exit animation completes
>
  <FileList ... />
</CSSTransition>
// ✅ Proper enter/exit animations
// ✅ Unmounts after animation
// ❌ Extra dependency

// INTERVIEW TIP:
// "I trade animation for simplicity in MVP.
//  For production, I'd use CSS Grid + always-mounted pattern,
//  or react-transition-group for unmount-after-animation."
```

---

### Step 23: API Data Transformation Patterns

> 🔄 "Real-world data ≠ component data. Transform at boundary."

**Pattern 1: Flat API → Tree Structure**

```typescript
// API returns flat list with parentId
interface ApiFile {
  id: number;
  name: string;
  parentId: number | null; // null = root level
  isDirectory: boolean;
}

// Transform to tree
function buildTree(flatFiles: ApiFile[]): FileData[] {
  const nodeMap = new Map<number, FileData & { children: FileData[] }>();
  const roots: FileData[] = [];

  // Step 1: Create nodes
  for (const file of flatFiles) {
    nodeMap.set(file.id, {
      id: file.id,
      name: file.name,
      children: file.isDirectory ? [] : undefined!,
    } as any);
  }

  // Step 2: Build relationships
  for (const file of flatFiles) {
    const node = nodeMap.get(file.id)!;
    if (file.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(file.parentId);
      if (parent?.children) {
        parent.children.push(node);
      }
    }
  }

  return roots;
}

// Usage:
function FileExplorerContainer() {
  const { data: apiFiles, loading } = useQuery<ApiFile[]>('/api/files');

  const treeData = useMemo(
    () => apiFiles ? buildTree(apiFiles) : [],
    [apiFiles]
  );

  if (loading) return <Skeleton />;
  return <FileExplorer data={treeData} />;
}

// COMPLEXITY: O(n) — two passes over flat array
// WHY at boundary?
// 1. Component doesn't know API format
// 2. Transform once, render many times (useMemo)
// 3. Testable: buildTree is pure function
```

**Pattern 2: Nested API with Extra Fields**

```typescript
// API returns nested but with extra fields
interface ApiFileNode {
  file_id: number;
  file_name: string;
  file_type: "file" | "directory";
  file_size: number;
  modified_at: string;
  created_by: string;
  sub_items?: ApiFileNode[];
}

// Transform to our lean FileData
function transformApiData(apiNodes: ApiFileNode[]): FileData[] {
  return apiNodes.map((node) => ({
    id: node.file_id,
    name: node.file_name,
    children: node.sub_items ? transformApiData(node.sub_items) : undefined,
  }));
}

// WHY transform instead of using API format directly?
// 1. Component doesn't depend on API contract
// 2. API changes don't break components
// 3. Removes unnecessary data (size, dates) from render tree
// 4. Renames fields to component convention (file_name → name)
// 5. Type safety: our FileData type is strict
```

**Pattern 3: Incremental/Lazy Loading**

```typescript
// API: fetch directory contents on demand
async function fetchDirectoryContents(dirId: number): Promise<FileData[]> {
  const response = await fetch(`/api/files/${dirId}/contents`);
  const apiFiles: ApiFileNode[] = await response.json();
  return transformApiData(apiFiles);
}

// Hook for lazy loading
function useLazyDirectory(dirId: number, isExpanded: boolean) {
  const [children, setChildren] = useState<FileData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isExpanded || children !== null) return;

    let cancelled = false;
    setLoading(true);

    fetchDirectoryContents(dirId)
      .then(data => {
        if (!cancelled) {
          setChildren(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [dirId, isExpanded, children]);

  return { children, loading, error };
}

// Usage in FileObject:
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = Boolean(file.children);

  // Lazy load children for directories
  const { children: lazyChildren, loading } = useLazyDirectory(
    file.id,
    expanded && isDirectory
  );

  const displayChildren = lazyChildren ?? file.children;

  return (
    <li>
      <button onClick={() => isDirectory && setExpanded(!expanded)}>
        {file.name} {loading && '⏳'}
      </button>
      {expanded && displayChildren && displayChildren.length > 0 && (
        <FileList fileList={displayChildren} level={level + 1} />
      )}
    </li>
  );
}
```

**Pattern 4: Zod Validation at API Boundary**

```typescript
import { z } from "zod";

// Define schema matching FileData
const FileDataSchema: z.ZodType<FileData> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string().min(1),
    children: z.array(FileDataSchema).optional(),
  }),
);

const FileTreeSchema = z.array(FileDataSchema);

// Usage:
async function fetchFileTree(): Promise<FileData[]> {
  const response = await fetch("/api/files");
  const rawData = await response.json();

  // Validate + parse
  const result = FileTreeSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Invalid file tree data:", result.error);
    throw new Error("Malformed file tree response");
  }

  return result.data;
}

// WHY Zod at boundary?
// 1. Runtime validation (TypeScript only compile-time)
// 2. Catches: missing ids, wrong types, extra fields
// 3. API contract enforcement
// 4. Descriptive error messages for debugging
// 5. Recursive validation (checks ALL nested levels)
```

---

### Step 24: Sort Algorithm Deep Dive

> 📐 "Understand sort complexity — impress with algorithmic knowledge."

**Our Sorting: Partition → Sort → Merge**

```
INPUT: [README.md, Documents/, Downloads/, setup.sh, Config/]

STEP 1: PARTITION (filter) — O(n) × 2
  directories = [Documents/, Downloads/, Config/]
  files       = [README.md, setup.sh]

STEP 2: SORT each group — O(d·log(d)) + O(f·log(f))
  directories = [Config/, Documents/, Downloads/]  (alphabetical)
  files       = [README.md, setup.sh]               (alphabetical)

STEP 3: MERGE (spread) — O(n)
  result = [Config/, Documents/, Downloads/, README.md, setup.sh]

TOTAL COMPLEXITY:
  O(2n + d·log(d) + f·log(f) + n) = O(n + d·log(d) + f·log(f))

  Where: n = total items, d = directories, f = files
  Worst case (all dirs or all files): O(n·log(n))
  Best case: O(n) — already sorted (sort is O(n) on sorted input)
```

**Alternative: Single Sort with Custom Comparator**

```tsx
const sorted = [...fileList].sort((a, b) => {
  const aIsDir = Boolean(a.children);
  const bIsDir = Boolean(b.children);

  // Rule 1: Directories before files
  if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;

  // Rule 2: Alphabetical within same type
  return a.name.localeCompare(b.name);
});

// COMPLEXITY: O(n·log(n)) always
// But: fewer array allocations (no filter, no spread)
```

**Comparison — Which is faster?**

```
For n items, d directories, f files (d + f = n):

PARTITION APPROACH:
  Memory: 3 arrays (dirs, files, merged) = O(n) extra
  Ops:    2 filters + 2 sorts + 1 spread
  Time:   ~3n + d·log(d) + f·log(f)

SINGLE SORT:
  Memory: 1 array (spread copy) = O(n) extra
  Ops:    1 spread + 1 sort (with branching comparator)
  Time:   ~n + n·log(n) (each comparison has extra Boolean check)

WHEN d ≈ f (balanced):
  Partition: ~3n + 2 × (n/2)·log(n/2) = ~3n + n·log(n/2)
  Single:    ~n + n·log(n)
  → SINGLE sort slightly faster (fewer array ops)

WHEN d << n (mostly files):
  Partition: ~3n + d·log(d) + n·log(n) ≈ 3n + n·log(n)
  Single:    ~n + n·log(n)
  → SINGLE sort faster (avoids extra filter passes)

PRACTICAL: Difference is negligible for < 10K items.
           Choose based on READABILITY, not performance.
```

**sort() Stability Guarantee:**

```typescript
// QUESTION: Does sort order preserve original order for equal elements?

// Pre-ES2019 (ES5-ES2018):
// Array.sort() NOT guaranteed stable
// Chrome V8 used TimSort (stable) since 2018
// But spec didn't require it

// ES2019+:
// Array.sort() MUST be stable per spec
// All modern browsers comply

// WHAT DOES STABILITY MEAN FOR US?
// If two items have same name:
// Stable:   [a.txt (id:1), a.txt (id:5)] → preserves original order
// Unstable: [a.txt (id:5), a.txt (id:1)] → might swap!

// OUR CODE: Stability matters when names collide
// Fix: Add tiebreaker
directories.sort((a, b) => {
  const cmp = a.name.localeCompare(b.name);
  return cmp !== 0 ? cmp : a.id - b.id; // Stable tiebreaker
});
```

**localeCompare Deep Dive:**

```typescript
// BASIC:
"a".localeCompare("b"); // -1 (a before b)
"b".localeCompare("a"); // 1  (b after a)
"a".localeCompare("a"); // 0  (equal)

// WITH OPTIONS:
"a".localeCompare("A", "en", { sensitivity: "base" }); // 0 (case-insensitive)
"a".localeCompare("A", "en", { sensitivity: "case" }); // -1 (case matters)
"a".localeCompare("á", "en", { sensitivity: "base" }); // 0 (accent-insensitive)
"a".localeCompare("á", "en", { sensitivity: "accent" }); // -1 (accent matters)

// NATURAL SORT (file-like):
// Default: 'file10' < 'file2' (lexicographic: '1' < '2')
// Natural: 'file2' < 'file10' (numeric comparison)
"file2".localeCompare("file10", "en", { numeric: true }); // -1 ✅

// FOR FILE EXPLORER — recommended options:
const fileCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, {
    numeric: true, // file2 before file10
    sensitivity: "base", // case-insensitive
  });

// RESULT:
// Without numeric: [file1, file10, file11, file2, file3]
// With numeric:    [file1, file2, file3, file10, file11] ✅

// PERFORMANCE:
// localeCompare is ~10x slower than simple > comparison
// For 1000 items: ~2ms vs ~0.2ms → still negligible
// For 100K items: consider Intl.Collator for performance
const collator = new Intl.Collator("en", { numeric: true });
bigArray.sort(collator.compare); // Much faster for repeated comparisons
```

---

### Step 25: Testing Recursive Components Deep Dive

> 🧪 "Testing strategy cho tree structure — unit + integration."

**Test Setup:**

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileExplorer, { FileData } from "./FileExplorer";

// Helper: Create test data
function createTestData(): FileData[] {
  return [
    { id: 1, name: "README.md" },
    {
      id: 2,
      name: "Documents",
      children: [
        { id: 3, name: "Word.doc" },
        { id: 4, name: "Powerpoint.ppt" },
      ],
    },
    {
      id: 5,
      name: "Downloads",
      children: [
        { id: 6, name: "unnamed.txt" },
        {
          id: 7,
          name: "Misc",
          children: [
            { id: 8, name: "foo.txt" },
            { id: 9, name: "bar.txt" },
          ],
        },
      ],
    },
  ];
}
```

**Test Group 1: Rendering Verification**

```tsx
describe("FileExplorer - Rendering", () => {
  test("renders root level items sorted: dirs first, then files", () => {
    render(<FileExplorer data={createTestData()} />);

    const buttons = screen.getAllByRole("button");
    // Dirs first (alphabetical): Documents, Downloads
    // Then files: README.md
    expect(buttons[0]).toHaveTextContent("Documents");
    expect(buttons[1]).toHaveTextContent("Downloads");
    expect(buttons[2]).toHaveTextContent("README.md");
  });

  test("directories show expand indicator, files do not", () => {
    render(<FileExplorer data={createTestData()} />);

    expect(screen.getByText("Documents").closest("button")).toHaveTextContent(
      "[+]",
    );
    expect(
      screen.getByText("README.md").closest("button"),
    ).not.toHaveTextContent("[+]");
  });

  test("renders empty data without errors", () => {
    render(<FileExplorer data={[]} />);
    const list = document.querySelector(".file-list");
    expect(list).toBeInTheDocument();
    expect(list?.children).toHaveLength(0);
  });

  test("renders single file correctly", () => {
    render(<FileExplorer data={[{ id: 1, name: "solo.txt" }]} />);
    expect(screen.getByText("solo.txt")).toBeInTheDocument();
  });
});
```

**Test Group 2: Expand/Collapse Behavior**

```tsx
describe("FileExplorer - Expand/Collapse", () => {
  test("clicking directory expands to show children", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    // Children not visible initially
    expect(screen.queryByText("Word.doc")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText("Documents"));

    // Children now visible
    expect(screen.getByText("Word.doc")).toBeInTheDocument();
    expect(screen.getByText("Powerpoint.ppt")).toBeInTheDocument();
  });

  test("clicking expanded directory collapses children", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    // Expand
    await user.click(screen.getByText("Documents"));
    expect(screen.getByText("Word.doc")).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByText("Documents"));
    expect(screen.queryByText("Word.doc")).not.toBeInTheDocument();
  });

  test("clicking file does nothing (no expand)", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    const readme = screen.getByText("README.md");
    await user.click(readme);

    // Should still show same elements (no change)
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  test("expand indicator changes on toggle", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    const docsButton = screen.getByText("Documents").closest("button")!;

    expect(docsButton).toHaveTextContent("[+]");
    await user.click(docsButton);
    expect(docsButton).toHaveTextContent("[-]");
    await user.click(docsButton);
    expect(docsButton).toHaveTextContent("[+]");
  });

  test("expanding one directory does not affect siblings", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    // Expand Documents
    await user.click(screen.getByText("Documents"));

    // Documents expanded - children visible
    expect(screen.getByText("Word.doc")).toBeInTheDocument();

    // Downloads still collapsed - children not visible
    expect(screen.queryByText("unnamed.txt")).not.toBeInTheDocument();
  });
});
```

**Test Group 3: Nested/Recursive Behavior**

```tsx
describe("FileExplorer - Nested Directories", () => {
  test("expanding nested directory shows deeper children", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    // Level 1: Expand Downloads
    await user.click(screen.getByText("Downloads"));
    expect(screen.getByText("Misc")).toBeInTheDocument();
    expect(screen.getByText("unnamed.txt")).toBeInTheDocument();

    // Level 2: Expand Misc
    await user.click(screen.getByText("Misc"));
    expect(screen.getByText("foo.txt")).toBeInTheDocument();
    expect(screen.getByText("bar.txt")).toBeInTheDocument();
  });

  test("collapsing parent hides all descendant levels", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    // Expand Downloads → Misc
    await user.click(screen.getByText("Downloads"));
    await user.click(screen.getByText("Misc"));
    expect(screen.getByText("foo.txt")).toBeInTheDocument();

    // Collapse Downloads → hides Misc AND foo.txt
    await user.click(screen.getByText("Downloads"));
    expect(screen.queryByText("Misc")).not.toBeInTheDocument();
    expect(screen.queryByText("foo.txt")).not.toBeInTheDocument();
  });

  test("nested directory sorting: dirs before files at each level", async () => {
    const user = userEvent.setup();
    render(<FileExplorer data={createTestData()} />);

    // Expand Downloads
    await user.click(screen.getByText("Downloads"));

    // Get buttons within Downloads section
    const downloadsList = screen
      .getByText("Downloads")
      .closest("li")!
      .querySelector(".file-list")!;
    const downloadChildren = within(downloadsList as HTMLElement).getAllByRole(
      "button",
    );

    // Misc (directory) should be before unnamed.txt (file)
    expect(downloadChildren[0]).toHaveTextContent("Misc");
    expect(downloadChildren[1]).toHaveTextContent("unnamed.txt");
  });
});
```

**Test Group 4: Edge Cases**

```tsx
describe("FileExplorer - Edge Cases", () => {
  test("empty directory renders but shows no children when expanded", async () => {
    const user = userEvent.setup();
    const data: FileData[] = [{ id: 1, name: "EmptyDir", children: [] }];

    render(<FileExplorer data={data} />);

    // Shows as directory
    expect(screen.getByText("EmptyDir").closest("button")).toHaveTextContent(
      "[+]",
    );

    // Click to expand — no children appear, no crash
    await user.click(screen.getByText("EmptyDir"));

    // Should not render any child file-list
    const emptyDirLi = screen.getByText("EmptyDir").closest("li")!;
    expect(emptyDirLi.querySelector(".file-list")).not.toBeInTheDocument();
  });

  test("deeply nested structure renders correctly", async () => {
    const user = userEvent.setup();
    const deepData: FileData[] = [
      {
        id: 1,
        name: "L1",
        children: [
          {
            id: 2,
            name: "L2",
            children: [
              {
                id: 3,
                name: "L3",
                children: [
                  {
                    id: 4,
                    name: "L4",
                    children: [
                      {
                        id: 5,
                        name: "deep-file.txt",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    render(<FileExplorer data={deepData} />);

    // Expand each level
    await user.click(screen.getByText("L1"));
    await user.click(screen.getByText("L2"));
    await user.click(screen.getByText("L3"));
    await user.click(screen.getByText("L4"));

    // Deep file visible
    expect(screen.getByText("deep-file.txt")).toBeInTheDocument();
  });

  test("special characters in file names render correctly", () => {
    const data: FileData[] = [
      { id: 1, name: "résumé.pdf" },
      { id: 2, name: "日本語.txt" },
      { id: 3, name: ".gitignore" },
    ];

    render(<FileExplorer data={data} />);

    expect(screen.getByText(".gitignore")).toBeInTheDocument();
    expect(screen.getByText("résumé.pdf")).toBeInTheDocument();
    expect(screen.getByText("日本語.txt")).toBeInTheDocument();
  });
});
```

**Testing Utility: Sort Function (Pure Unit Test)**

```tsx
describe("sortFileList (unit)", () => {
  function sortFileList(items: FileData[]): FileData[] {
    const dirs = items.filter((i) => i.children);
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    const files = items.filter((i) => !i.children);
    files.sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }

  test("directories before files", () => {
    const input = [
      { id: 1, name: "b.txt" },
      { id: 2, name: "a-dir", children: [] },
    ];
    const result = sortFileList(input);
    expect(result[0].name).toBe("a-dir");
    expect(result[1].name).toBe("b.txt");
  });

  test("alphabetical within same type", () => {
    const input = [
      { id: 1, name: "c.txt" },
      { id: 2, name: "a.txt" },
      { id: 3, name: "b.txt" },
    ];
    const result = sortFileList(input);
    expect(result.map((f) => f.name)).toEqual(["a.txt", "b.txt", "c.txt"]);
  });

  test("empty array returns empty", () => {
    expect(sortFileList([])).toEqual([]);
  });

  test("single item returns itself", () => {
    const input = [{ id: 1, name: "only.txt" }];
    expect(sortFileList(input)).toEqual(input);
  });

  test("does not mutate original array", () => {
    const input = [
      { id: 1, name: "b.txt" },
      { id: 2, name: "a.txt" },
    ];
    const original = [...input];
    sortFileList(input);
    expect(input).toEqual(original);
  });
});
```

---

### Step 26: Other Recursive UI Patterns — Cross-reference

> 🔗 "File Explorer không đơn lẻ — nó thuộc family of recursive UI patterns."

**Pattern Family: Recursive UIs**

```
┌─────────────────────────────────────────────────────────────────┐
│              RECURSIVE UI PATTERN FAMILY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. FILE EXPLORER ← (this document)                               │
│     Data: { id, name, children? }                                 │
│     State: expanded boolean (local)                               │
│     Interaction: expand/collapse directories                      │
│     Sorting: dirs first, alphabetical                             │
│                                                                   │
│  2. NESTED CHECKBOXES                                             │
│     Data: { id, label, children? }                                │
│     State: checked / unchecked / indeterminate (GLOBAL)           │
│     Interaction: check propagates up AND down                     │
│     Complexity: bidirectional state propagation                   │
│                                                                   │
│  3. COMMENT THREADS (Reddit/HN style)                             │
│     Data: { id, author, text, replies? }                          │
│     State: collapsed, voted, reported                             │
│     Interaction: reply, upvote, collapse                          │
│     Sorting: by votes, by date, by controversial                  │
│                                                                   │
│  4. NAVIGATION MENU (multi-level)                                 │
│     Data: { id, label, href?, subItems? }                         │
│     State: open (hover or click)                                  │
│     Interaction: hover → show submenu                             │
│     Challenge: position flyout menus                              │
│                                                                   │
│  5. ORGANIZATION CHART                                            │
│     Data: { id, name, title, reports? }                           │
│     State: expanded per node                                      │
│     Layout: horizontal or vertical tree                           │
│     Challenge: layout algorithm (not just list!)                  │
│                                                                   │
│  6. TABLE OF CONTENTS                                             │
│     Data: { id, title, level, subsections? }                      │
│     State: none (static display) or active section tracking       │
│     Interaction: scroll-to-section on click                       │
│     Challenge: intersection observer for active tracking          │
│                                                                   │
│  7. CATEGORY PICKER (e-commerce)                                  │
│     Data: { id, name, subcategories? }                            │
│     State: selected path, expanded nodes                          │
│     Interaction: drill down to select leaf category               │
│     Challenge: breadcrumb trail + selection state                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Cross-pattern Analysis — What Transfers:**

```
FROM Nested Checkboxes → File Explorer:
  ✅ Recursive component structure
  ✅ Conditional rendering pattern
  ✅ Key prop for list items
  ❌ State propagation (not needed)
  ❌ Indeterminate state (not applicable)

FROM File Explorer → Comment Threads:
  ✅ Expand/collapse pattern
  ✅ Indentation via CSS padding
  ✅ Local state per item
  + Add: reply form, vote buttons
  + Add: load more replies (pagination)

FROM File Explorer → Navigation Menu:
  ✅ Recursive data structure
  ✅ Expand/collapse (click instead of hover)
  - Replace: list → positioned flyout
  - Add: active route highlighting
  - Add: external link handling

SHARED PATTERN: Tree Traversal Utilities
- findPath(tree, targetId)     → works for ANY tree
- flattenTree(tree)            → works for ANY tree
- getAllIds(tree)               → works for ANY tree
- filterTree(tree, predicate)  → works for ANY tree

→ Extract into @/utils/tree.ts — reusable across all recursive UIs!
```

**Comment Thread Component (Built from File Explorer knowledge):**

```tsx
// Almost identical structure to File Explorer!
interface Comment {
  id: number;
  author: string;
  text: string;
  votes: number;
  timestamp: Date;
  replies?: Comment[];
}

function CommentThread({ comment, depth = 0 }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="comment" style={{ marginLeft: depth * 24 }}>
      {/* Header — like FileObject button */}
      <div className="comment-header">
        <button onClick={() => setCollapsed(!collapsed)}>
          {hasReplies && (collapsed ? "[+]" : "[-]")}
        </button>
        <span className="author">{comment.author}</span>
        <span className="votes">{comment.votes} points</span>
      </div>

      {/* Body — always visible (unlike file children) */}
      {!collapsed && (
        <>
          <p>{comment.text}</p>
          <button onClick={() => setShowReplyForm(true)}>Reply</button>

          {/* Replies — like FileList recursive */}
          {hasReplies &&
            comment.replies!.map((reply) => (
              <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
            ))}
        </>
      )}
    </div>
  );
}

// KEY DIFFERENCE FROM FILE EXPLORER:
// 1. No sorting (comments ordered by time/votes)
// 2. Reply form (interaction beyond expand/collapse)
// 3. Votes (additional local state)
// 4. Content always visible (only replies collapse)
// 5. Load more pattern (pagination at each level)
```

---

### Step 27: React 18+ Features & Modern Patterns

> ⚡ "Leverage React 18+ cho better UX — show you're current."

**Feature 1: useTransition for Non-urgent Expand**

```tsx
import { useTransition } from "react";

function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!isDirectory) return;

    // Mark expand as non-urgent update
    startTransition(() => {
      setExpanded(!expanded);
    });
  };

  return (
    <li style={{ opacity: isPending ? 0.7 : 1 }}>
      <button onClick={handleClick}>
        {file.name} {isPending && "⏳"}
      </button>
      {expanded && fileChildren && fileChildren.length > 0 && (
        <FileList fileList={fileChildren} level={level + 1} />
      )}
    </li>
  );
}

// WHEN IS THIS USEFUL?
// - Large directories with 1000+ items
// - Expanding causes heavy re-render (deep tree)
// - Without transition: UI freezes while rendering children
// - With transition: button click responds immediately,
//   children render in background (interruptible)
//
// NOT USEFUL FOR:
// - Small trees (< 100 items)
// - Already fast renders
// - Simple expand/collapse
```

**Feature 2: Suspense for Lazy-loaded Directories**

```tsx
import { Suspense, lazy, use } from "react";

// Lazy-loaded directory contents (React 19 use() hook)
function LazyFileList({ dirId, level }: { dirId: number; level: number }) {
  // use() unwraps promise and suspends component
  const children = use(fetchDirectoryContents(dirId));

  return (
    <ul className="file-list">
      {sortItems(children).map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}

// Usage with Suspense boundary
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <button onClick={() => isDirectory && setExpanded(!expanded)}>
        {file.name}
      </button>
      {expanded && isDirectory && (
        <Suspense fallback={<div className="skeleton">Loading...</div>}>
          <LazyFileList dirId={file.id} level={level + 1} />
        </Suspense>
      )}
    </li>
  );
}

// BENEFITS:
// ✅ Declarative loading states (no manual loading/error state)
// ✅ Suspense boundary can wrap multiple lazy components
// ✅ Streaming SSR compatible
// ✅ Error boundaries catch fetch errors
```

**Feature 3: useDeferredValue for Search**

```tsx
import { useDeferredValue, useMemo } from "react";

function FileExplorer({ data }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  // Filter tree with deferred value (non-blocking)
  const filteredData = useMemo(
    () => (deferredQuery ? filterTree(data, deferredQuery) : data),
    [data, deferredQuery],
  );

  const isStale = searchQuery !== deferredQuery;

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search files..."
      />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <FileList fileList={filteredData} level={1} />
      </div>
    </div>
  );
}

// HOW IT WORKS:
// 1. User types → searchQuery updates IMMEDIATELY (input responsive)
// 2. deferredQuery updates LATER (when React has idle time)
// 3. Tree re-filter and re-render happens with deferred value
// 4. isStale shows visual feedback during computation
// 5. If user types again → previous deferred render is INTERRUPTED
```

**Feature 4: React.memo with Custom Comparison**

```tsx
const FileObject = React.memo(
  function FileObject({ file, level }: Props) {
    // ... implementation
  },
  (prevProps, nextProps) => {
    // Custom equality check
    // Return true if props are "equal" (skip re-render)
    return (
      prevProps.file.id === nextProps.file.id &&
      prevProps.file.name === nextProps.file.name &&
      prevProps.level === nextProps.level &&
      // Deep compare children reference (not deep equality)
      prevProps.file.children === nextProps.file.children
    );
  },
);

// WHY custom comparison?
// Default React.memo uses Object.is (shallow)
// If parent recreates file object: { id:1, name:'Docs', children:[...] }
// Object.is fails (new reference) → unnecessary re-render
// Custom check: same id + name + children ref → skip render
//
// CAUTION: Only use if you KNOW what props matter
// Wrong custom comparison → stale renders (bugs!)
```

**Feature 5: useId for Accessible Labels**

```tsx
import { useId } from "react";

function FileObject({ file, level }: Props) {
  const labelId = useId();
  const contentId = useId();
  const isDirectory = Boolean(file.children);

  return (
    <li role="treeitem" aria-labelledby={labelId}>
      <button
        id={labelId}
        aria-expanded={isDirectory ? expanded : undefined}
        aria-controls={isDirectory && expanded ? contentId : undefined}
      >
        {file.name}
      </button>
      {expanded && isDirectory && fileChildren && (
        <ul id={contentId} role="group" aria-labelledby={labelId}>
          {/* children */}
        </ul>
      )}
    </li>
  );
}

// WHY useId?
// ✅ Generates unique IDs across server + client (SSR safe)
// ✅ No collision between FileObject instances
// ✅ Proper aria-controls / aria-labelledby linkage
// ❌ Can't be used as React key (different purpose)
```

**Feature 6: ErrorBoundary with Recovery**

```tsx
// React 19 pattern: use() with error-reset
import { ErrorBoundary } from "react-error-boundary";

function FileExplorer({ data }: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-state">
          <p>❌ Failed to render file tree</p>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>🔄 Try Again</button>
        </div>
      )}
      onReset={() => {
        // Reset any state that caused the error
        // e.g., clear cached data, refetch
      }}
    >
      <FileList fileList={data} level={1} />
    </ErrorBoundary>
  );
}

// ERROR SCENARIOS IN FILE EXPLORER:
// 1. Corrupt data → missing id → key error
// 2. Circular reference → stack overflow
// 3. Lazy load fails → network error
// 4. Invalid children type → render error
//
// ErrorBoundary catches ALL of these gracefully
```

**Modern React Patterns Summary:**

```
┌───────────────────────────────────────────────────────────────┐
│           REACT 18+ FEATURES FOR FILE EXPLORER                  │
├──────────────────┬──────────────────────────────────────────────┤
│ Feature          │ Use Case                                     │
├──────────────────┼──────────────────────────────────────────────┤
│ useTransition    │ Non-blocking expand for large directories    │
│ Suspense + use() │ Declarative lazy loading of dir contents     │
│ useDeferredValue │ Non-blocking search/filter                   │
│ React.memo       │ Skip re-render for unchanged tree nodes      │
│ useId            │ SSR-safe unique IDs for ARIA                 │
│ ErrorBoundary    │ Graceful failure handling                    │
├──────────────────┼──────────────────────────────────────────────┤
│ Interview:       │ MENTION these, don't implement unless asked  │
│ Production:      │ useTransition + Suspense = high-value adds   │
│ Priority:        │ ErrorBoundary > Suspense > useTransition     │
└───────────────────────────────────────────────────────────────┘
```

---

### Step 28: WAI-ARIA Tree Pattern — Complete Accessible Implementation

> ♿ "Accessibility không phải optional — ARIA Tree pattern là standard."

**WAI-ARIA Tree Roles Overview:**

```
ARIA TREE ROLE HIERARCHY:
┌─────────────────────────────────────────────────────────┐
│ role="tree"         ← Root container (FileExplorer)     │
│ ├── role="treeitem" ← Each item (FileObject)            │
│ │   ├── aria-expanded="true|false"  (directories only)  │
│ │   ├── aria-selected="true|false"  (if selectable)     │
│ │   ├── aria-level="1|2|3..."       (depth indicator)   │
│ │   ├── aria-setsize="N"            (siblings count)    │
│ │   └── aria-posinset="M"           (position in set)   │
│ ├── role="group"    ← Children container (expanded dir) │
│ │   ├── role="treeitem"                                 │
│ │   └── role="treeitem"                                 │
│ └── role="treeitem"                                     │
└─────────────────────────────────────────────────────────┘

SCREEN READER ANNOUNCEMENTS:
"Documents, expanded, tree item, 1 of 3, level 1"
"Word.doc, tree item, 1 of 2, level 2"
```

**Complete Accessible Implementation:**

```tsx
// FileExplorer.tsx — Root with tree role
function FileExplorer({ data }: Props) {
  return (
    <div>
      <h2 id="tree-label">File Explorer</h2>
      <ul role="tree" aria-labelledby="tree-label">
        {sortItems(data).map((file, index) => (
          <FileObject
            key={file.id}
            file={file}
            level={1}
            setSize={data.length}
            posInSet={index + 1}
          />
        ))}
      </ul>
    </div>
  );
}

// FileObject.tsx — Treeitem with full ARIA
function FileObject({ file, level, setSize, posInSet }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = Boolean(file.children);
  const labelId = useId();

  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={isDirectory ? expanded : undefined}
      aria-labelledby={labelId}
      tabIndex={-1} // Programmatic focus (roving tabindex)
    >
      <span id={labelId}>
        <button
          tabIndex={-1} // Focus managed by tree, not tab order
          onClick={() => isDirectory && setExpanded(!expanded)}
          aria-label={
            isDirectory
              ? `${file.name}, ${expanded ? "collapse" : "expand"} directory`
              : file.name
          }
        >
          {isDirectory && (
            <span aria-hidden="true">{expanded ? "▼" : "▶"}</span>
          )}
          {file.name}
        </button>
      </span>
      {expanded && isDirectory && file.children && file.children.length > 0 && (
        <ul role="group">
          {sortItems(file.children).map((child, index) => (
            <FileObject
              key={child.id}
              file={child}
              level={level + 1}
              setSize={file.children!.length}
              posInSet={index + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

**ARIA Attributes Cheat Sheet:**

```
┌────────────────────┬──────────────────────────────────────────┐
│ Attribute          │ Purpose                                  │
├────────────────────┼──────────────────────────────────────────┤
│ role="tree"        │ Root: tells SR this is a tree widget     │
│ role="treeitem"    │ Each node in the tree                    │
│ role="group"       │ Container for child treeitems            │
│ aria-expanded      │ true/false for dirs (omit for files!)    │
│ aria-level         │ Depth: 1 for root, 2 for children, ...  │
│ aria-setsize       │ Total siblings at this level             │
│ aria-posinset      │ This item's position (1-indexed)         │
│ aria-selected      │ If tree supports selection               │
│ aria-labelledby    │ Points to visible label element          │
│ aria-label         │ Alternative: inline label text           │
│ aria-owns          │ If children are NOT DOM children of node │
│ tabIndex={0}       │ Currently focused item (1 item only)     │
│ tabIndex={-1}      │ Focusable via JS, not via Tab            │
└────────────────────┴──────────────────────────────────────────┘

COMMON MISTAKES:
❌ aria-expanded on FILES (should be undefined, not false)
❌ Missing role="group" on children container
❌ Using role="tree" on every <ul> (only root!)
❌ All items tabIndex={0} (should be roving: only 1 active)
❌ Forgetting aria-level (SR can't announce depth)
```

**Roving TabIndex Pattern:**

```tsx
// CONCEPT: Only 1 item in the tree is tabbable at a time
// Tab → enters tree at last focused item
// Arrow keys → move between items
// Tab again → leaves tree

function useRovingTabIndex(treeRef: RefObject<HTMLElement>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;

    // Set first item as default active
    const firstItem = tree.querySelector('[role="treeitem"]') as HTMLElement;
    if (firstItem && !activeId) {
      firstItem.tabIndex = 0;
      setActiveId(firstItem.id);
    }
  }, []);

  const moveFocus = useCallback((targetId: string) => {
    const tree = treeRef.current;
    if (!tree) return;

    // Remove tabindex from current
    const current = tree.querySelector('[tabindex="0"]') as HTMLElement;
    if (current) current.tabIndex = -1;

    // Set tabindex on target
    const target = tree.querySelector(`#${targetId}`) as HTMLElement;
    if (target) {
      target.tabIndex = 0;
      target.focus();
      setActiveId(targetId);
    }
  }, []);

  return { activeId, moveFocus };
}

// RESULT:
// Tab → focuses currently active tree item
// Arrow Down → moveFocus to next visible item
// Arrow Up → moveFocus to previous visible item
// Arrow Right → expand directory or move to first child
// Arrow Left → collapse directory or move to parent
// Home → moveFocus to first item
// End → moveFocus to last visible item
// Tab → moves focus OUT of tree
```

---

### Step 29: Virtualization — Rendering 100K+ Items

> 🚀 "Khi tree có 100K nodes — chỉ render visible items."

**Concept: Flatten Tree → Virtual List**

```
PROBLEM:
Tree with 100,000 nodes → 100,000 DOM elements → browser dies

SOLUTION: Flatten + Virtualize
1. Flatten tree into array (only VISIBLE nodes)
2. Use react-window to render only ~30 visible items
3. Calculate indent from depth info

FLAT REPRESENTATION:
Original tree:              Flat array (expanded):
Documents/                  [{ node: Documents, depth: 0 }]
├── Word.doc                [{ node: Word.doc,   depth: 1 }]
├── Powerpoint.ppt          [{ node: PPT,        depth: 1 }]
Downloads/                  [{ node: Downloads,  depth: 0 }]
├── Misc/                   [{ node: Misc,       depth: 1 }]
│   ├── bar.txt             [{ node: bar.txt,    depth: 2 }]
│   └── foo.txt             [{ node: foo.txt,    depth: 2 }]
└── unnamed.txt             [{ node: unnamed,    depth: 1 }]
README.md                   [{ node: README,     depth: 0 }]
```

**Implementation:**

```tsx
import { FixedSizeList as List } from "react-window";

// Step 1: Flatten tree to visible nodes
interface FlatNode {
  item: FileData;
  depth: number;
  isDirectory: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
}

function flattenTree(
  items: ReadonlyArray<FileData>,
  expandedIds: Set<number>,
  depth = 0,
): FlatNode[] {
  const result: FlatNode[] = [];

  // Sort at each level
  const sorted = sortItems(items);

  for (const item of sorted) {
    const isDirectory = Boolean(item.children);
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = isDirectory && (item.children?.length ?? 0) > 0;

    result.push({ item, depth, isDirectory, isExpanded, hasChildren });

    // Only include children if expanded
    if (isExpanded && item.children && item.children.length > 0) {
      result.push(...flattenTree(item.children, expandedIds, depth + 1));
    }
  }

  return result;
}

// Step 2: Row renderer
function TreeRow({ index, style, data }: ListChildComponentProps) {
  const { flatNodes, onToggle } = data;
  const node = flatNodes[index];
  const { item, depth, isDirectory, isExpanded } = node;

  return (
    <div
      style={{
        ...style,
        paddingLeft: depth * 20 + 8,
        display: "flex",
        alignItems: "center",
        cursor: isDirectory ? "pointer" : "default",
      }}
      onClick={() => isDirectory && onToggle(item.id)}
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={isDirectory ? isExpanded : undefined}
    >
      {isDirectory && (
        <span style={{ marginRight: 4 }}>{isExpanded ? "▼" : "▶"}</span>
      )}
      <span style={{ fontWeight: isDirectory ? "bold" : "normal" }}>
        {item.name}
      </span>
    </div>
  );
}

// Step 3: Virtual tree component
function VirtualFileExplorer({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const flatNodes = useMemo(
    () => flattenTree(data, expandedIds),
    [data, expandedIds],
  );

  const onToggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <List
      height={600} // Viewport height
      width={400} // Viewport width
      itemCount={flatNodes.length}
      itemSize={28} // Fixed row height
      itemData={{ flatNodes, onToggle }}
      role="tree"
    >
      {TreeRow}
    </List>
  );
}
```

**Performance Comparison:**

```
┌──────────────────────────────────────────────────────────────┐
│           RECURSIVE vs VIRTUAL — PERFORMANCE                   │
├──────────────┬─────────────────────┬─────────────────────────┤
│ Metric       │ Recursive (current) │ Virtual (react-window)  │
├──────────────┼─────────────────────┼─────────────────────────┤
│ 100 nodes    │ 2ms render          │ 3ms render (overhead)   │
│ 1,000 nodes  │ 15ms render         │ 3ms render              │
│ 10,000 nodes │ 200ms render 😰     │ 3ms render              │
│ 100,000 nodes│ 5s+ render 💀       │ 4ms render              │
│ DOM nodes    │ 3 per item          │ ~30 total (viewport)    │
│ Memory       │ Proportional to N   │ Constant ~30 items      │
│ Scroll perf  │ Good (< 1K)         │ Excellent (any size)    │
│ Complexity   │ ⭐ Simple            │ ⭐⭐⭐ Complex            │
│ Animations   │ ✅ Easy              │ ❌ Hard                  │
│ Accessibility│ ✅ Natural           │ ⚠️ Needs extra work     │
└──────────────────────────────────────────────────────────────┘

DECISION GUIDE:
< 500 items:    Use recursive (simpler, animations work)
500 - 5,000:    Use recursive + React.memo + useMemo
5,000 - 50,000: Use virtual list (react-window)
50,000+:        Use virtual + lazy loading + web worker sort
```

**VariableSizeList for Mixed Heights:**

```tsx
import { VariableSizeList as List } from "react-window";

// When items have different heights (e.g., multi-line names)
function VirtualTree({ data }: Props) {
  const listRef = useRef<List>(null);

  const getItemSize = (index: number) => {
    const node = flatNodes[index];
    // Directories slightly taller (bold font)
    return node.isDirectory ? 32 : 28;
  };

  // IMPORTANT: Reset size cache when tree structure changes
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [flatNodes.length]);

  return (
    <List
      ref={listRef}
      height={600}
      width={400}
      itemCount={flatNodes.length}
      itemSize={getItemSize}
      itemData={{ flatNodes, onToggle }}
    >
      {TreeRow}
    </List>
  );
}
```

---

### Step 30: Drag and Drop — Move Files Between Directories

> 🖱️ "DnD là advanced feature — show system design thinking."

**Architecture Decision:**

```
DRAG AND DROP REQUIREMENTS:
1. Drag files/directories → drop into another directory
2. Visual feedback: highlight valid drop targets
3. Prevent: drop into self (circular), drop into descendant
4. Update tree data structure after drop

STATE MANAGEMENT EVOLUTION:
MVP (local state)  →  DnD requires GLOBAL state
                       (need to modify tree structure)

useReducer + Context recommended for DnD
```

**Implementation with React DnD:**

```tsx
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ITEM_TYPE = "FILE_NODE";

interface DragItem {
  id: number;
  name: string;
  parentId: number | null;
}

// Draggable FileObject
function DraggableFileObject({ file, level, parentId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = Boolean(file.children);
  const ref = useRef<HTMLLIElement>(null);

  // DRAG source
  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: { id: file.id, name: file.name, parentId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // DROP target (directories only)
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    canDrop: (dragItem: DragItem) => {
      // Can't drop into self
      if (dragItem.id === file.id) return false;
      // Can't drop into non-directory
      if (!isDirectory) return false;
      // Can't drop into own descendant (circular)
      if (isDescendant(file, dragItem.id)) return false;
      // Can't drop into current parent (no-op)
      if (dragItem.parentId === file.id) return false;
      return true;
    },
    drop: (dragItem: DragItem) => {
      // Dispatch move action
      dispatch({
        type: "MOVE_NODE",
        payload: {
          nodeId: dragItem.id,
          fromParentId: dragItem.parentId,
          toParentId: file.id,
        },
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine refs
  dragRef(dropRef(ref));

  return (
    <li
      ref={ref}
      style={{
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: isOver && canDrop ? "#e3f2fd" : "transparent",
        border:
          isOver && canDrop ? "2px dashed #1976d2" : "2px solid transparent",
      }}
    >
      <button onClick={() => isDirectory && setExpanded(!expanded)}>
        {file.name}
      </button>
      {/* children... */}
    </li>
  );
}

// Circular drop prevention
function isDescendant(parent: FileData, targetId: number): boolean {
  if (!parent.children) return false;
  for (const child of parent.children) {
    if (child.id === targetId) return true;
    if (isDescendant(child, targetId)) return true;
  }
  return false;
}
```

**Tree Reducer for DnD State:**

```tsx
type TreeAction =
  | {
      type: "MOVE_NODE";
      payload: {
        nodeId: number;
        fromParentId: number | null;
        toParentId: number;
      };
    }
  | { type: "TOGGLE_EXPAND"; payload: { id: number } }
  | { type: "RENAME_NODE"; payload: { id: number; newName: string } }
  | { type: "DELETE_NODE"; payload: { id: number } };

function treeReducer(state: FileData[], action: TreeAction): FileData[] {
  switch (action.type) {
    case "MOVE_NODE": {
      const { nodeId, toParentId } = action.payload;

      // Step 1: Find and remove node from current position
      let movedNode: FileData | null = null;
      const withoutNode = removeNode(state, nodeId, (node) => {
        movedNode = node;
      });

      if (!movedNode) return state;

      // Step 2: Insert node into target directory
      return insertNode(withoutNode, toParentId, movedNode);
    }
    // ... other actions
  }
}

// Helper: Remove node from tree (returns new tree)
function removeNode(
  tree: FileData[],
  targetId: number,
  onFound: (node: FileData) => void,
): FileData[] {
  return tree.reduce<FileData[]>((acc, node) => {
    if (node.id === targetId) {
      onFound(node);
      return acc; // Skip this node (removed)
    }
    if (node.children) {
      return [
        ...acc,
        {
          ...node,
          children: removeNode(node.children as FileData[], targetId, onFound),
        },
      ];
    }
    return [...acc, node];
  }, []);
}

// Helper: Insert node into target directory
function insertNode(
  tree: FileData[],
  targetParentId: number,
  newNode: FileData,
): FileData[] {
  return tree.map((node) => {
    if (node.id === targetParentId && node.children) {
      return {
        ...node,
        children: [...node.children, newNode],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: insertNode(
          node.children as FileData[],
          targetParentId,
          newNode,
        ),
      };
    }
    return node;
  });
}
```

---

### Step 31: Context Menu — Right-click Actions

> 📋 "Context menu transforms File Explorer from display-only → interactive tool."

**Implementation:**

```tsx
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetFile: FileData | null;
}

function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetFile: null,
  });

  const showMenu = useCallback((e: React.MouseEvent, file: FileData) => {
    e.preventDefault(); // Prevent browser default context menu
    setMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetFile: file,
    });
  }, []);

  const hideMenu = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!menu.visible) return;

    const handleClick = () => hideMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideMenu();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu.visible, hideMenu]);

  return { menu, showMenu, hideMenu };
}

// Context Menu Component
function FileContextMenu({ menu, onAction }: Props) {
  if (!menu.visible || !menu.targetFile) return null;

  const isDir = Boolean(menu.targetFile.children);

  // Ensure menu stays within viewport
  const style = {
    position: "fixed" as const,
    left: Math.min(menu.x, window.innerWidth - 200),
    top: Math.min(menu.y, window.innerHeight - 300),
    zIndex: 1000,
  };

  return (
    <div className="context-menu" style={style} role="menu">
      <button
        role="menuitem"
        onClick={() => onAction("rename", menu.targetFile!)}
      >
        ✏️ Rename
      </button>
      <button
        role="menuitem"
        onClick={() => onAction("copy", menu.targetFile!)}
      >
        📋 Copy
      </button>
      <button role="menuitem" onClick={() => onAction("cut", menu.targetFile!)}>
        ✂️ Cut
      </button>
      {isDir && (
        <button
          role="menuitem"
          onClick={() => onAction("newFile", menu.targetFile!)}
        >
          📄 New File
        </button>
      )}
      {isDir && (
        <button
          role="menuitem"
          onClick={() => onAction("newFolder", menu.targetFile!)}
        >
          📁 New Folder
        </button>
      )}
      <hr />
      <button
        role="menuitem"
        onClick={() => onAction("delete", menu.targetFile!)}
        className="context-menu-danger"
      >
        🗑️ Delete
      </button>
    </div>
  );
}

// Usage in FileObject:
function FileObject({ file, level }: Props) {
  const { menu, showMenu } = useContextMenu();

  return (
    <li onContextMenu={(e) => showMenu(e, file)}>
      <button>{file.name}</button>
      <FileContextMenu menu={menu} onAction={handleAction} />
    </li>
  );
}
```

**Context Menu CSS:**

```css
.context-menu {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 180px;
}

.context-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.context-menu button:hover {
  background-color: #f0f0f0;
}

.context-menu-danger {
  color: #d32f2f;
}

.context-menu-danger:hover {
  background-color: #ffebee !important;
}

.context-menu hr {
  margin: 4px 0;
  border: none;
  border-top: 1px solid #eee;
}
```

---

### Step 32: Complete Keyboard Navigation

> ⌨️ "Full keyboard support — professional-grade interaction."

**Keyboard Spec (WAI-ARIA Treeview Pattern):**

```
┌──────────────────┬─────────────────────────────────────────────┐
│ Key              │ Action                                      │
├──────────────────┼─────────────────────────────────────────────┤
│ ↓ Arrow Down     │ Move to next VISIBLE item                   │
│ ↑ Arrow Up       │ Move to previous VISIBLE item               │
│ → Arrow Right    │ If collapsed dir: EXPAND                    │
│                  │ If expanded dir: move to first child         │
│                  │ If file: no action                           │
│ ← Arrow Left    │ If expanded dir: COLLAPSE                    │
│                  │ If collapsed dir or file: move to parent     │
│ Home             │ Move to first item in tree                   │
│ End              │ Move to last VISIBLE item in tree            │
│ Enter            │ Toggle expand/collapse (or activate file)    │
│ Space            │ Toggle selection (if selectable)             │
│ * (asterisk)     │ Expand ALL siblings at current level         │
│ Type character   │ Move to next item starting with that char    │
└──────────────────┴─────────────────────────────────────────────┘
```

**Implementation:**

```tsx
function useTreeKeyboardNavigation(
  treeRef: RefObject<HTMLElement>,
  flatNodes: FlatNode[],
  onToggle: (id: number) => void,
) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Get all visible treeitem elements
  const getVisibleItems = useCallback((): HTMLElement[] => {
    if (!treeRef.current) return [];
    return Array.from(treeRef.current.querySelectorAll('[role="treeitem"]'));
  }, []);

  const focusItem = useCallback(
    (index: number) => {
      const items = getVisibleItems();
      if (index < 0 || index >= items.length) return;

      // Roving tabindex
      items.forEach((item) => {
        item.tabIndex = -1;
      });
      items[index].tabIndex = 0;
      items[index].focus();
      setFocusedIndex(index);
    },
    [getVisibleItems],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = getVisibleItems();
      const currentIndex = focusedIndex;
      const currentNode = flatNodes[currentIndex];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusItem(Math.min(currentIndex + 1, items.length - 1));
          break;

        case "ArrowUp":
          e.preventDefault();
          focusItem(Math.max(currentIndex - 1, 0));
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentNode?.isDirectory) {
            if (!currentNode.isExpanded) {
              // Expand
              onToggle(currentNode.item.id);
            } else if (currentNode.hasChildren) {
              // Move to first child
              focusItem(currentIndex + 1);
            }
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (currentNode?.isDirectory && currentNode.isExpanded) {
            // Collapse
            onToggle(currentNode.item.id);
          } else {
            // Move to parent
            const parentIndex = findParentIndex(flatNodes, currentIndex);
            if (parentIndex >= 0) focusItem(parentIndex);
          }
          break;

        case "Home":
          e.preventDefault();
          focusItem(0);
          break;

        case "End":
          e.preventDefault();
          focusItem(items.length - 1);
          break;

        case "Enter":
          e.preventDefault();
          if (currentNode?.isDirectory) {
            onToggle(currentNode.item.id);
          }
          break;

        case "*":
          e.preventDefault();
          // Expand all siblings at same level
          const currentLevel = currentNode?.depth ?? 0;
          flatNodes
            .filter(
              (n) => n.depth === currentLevel && n.isDirectory && !n.isExpanded,
            )
            .forEach((n) => onToggle(n.item.id));
          break;

        default:
          // Type-ahead: focus next item starting with pressed character
          if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
            const char = e.key.toLowerCase();
            const startIndex = (currentIndex + 1) % flatNodes.length;

            for (let i = 0; i < flatNodes.length; i++) {
              const idx = (startIndex + i) % flatNodes.length;
              if (flatNodes[idx].item.name.toLowerCase().startsWith(char)) {
                focusItem(idx);
                break;
              }
            }
          }
      }
    },
    [focusedIndex, flatNodes, onToggle, focusItem, getVisibleItems],
  );

  return { handleKeyDown, focusedIndex };
}

// Find parent of current node in flat list
function findParentIndex(flatNodes: FlatNode[], currentIndex: number): number {
  const currentDepth = flatNodes[currentIndex]?.depth ?? 0;
  if (currentDepth === 0) return -1; // Already at root

  // Walk backwards to find first item with depth - 1
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (flatNodes[i].depth === currentDepth - 1) {
      return i;
    }
  }
  return -1;
}
```

**Type-ahead Search Enhancement:**

```tsx
// Multi-character type-ahead (like Windows Explorer)
function useTypeAhead(flatNodes: FlatNode[], onFocus: (index: number) => void) {
  const [searchBuffer, setSearchBuffer] = useState("");
  const timerRef = useRef<NodeJS.Timeout>();

  const handleChar = useCallback(
    (char: string) => {
      // Append character to search buffer
      setSearchBuffer((prev) => {
        const newBuffer = prev + char.toLowerCase();

        // Find matching item
        const matchIndex = flatNodes.findIndex((node) =>
          node.item.name.toLowerCase().startsWith(newBuffer),
        );

        if (matchIndex >= 0) {
          onFocus(matchIndex);
        }

        return newBuffer;
      });

      // Clear buffer after 500ms of no typing
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSearchBuffer("");
      }, 500);
    },
    [flatNodes, onFocus],
  );

  return { handleChar, searchBuffer };
}

// BEHAVIOR:
// User types "d" → focuses "Documents"
// User types "do" quickly → focuses "Documents" (multi-char match)
// User waits 500ms → buffer clears
// User types "d" again → focuses "Downloads"
// (cycles through "d" matches on repeated press)
```

---

### Step 33: Performance Benchmarking & Profiling

> 📊 "Measure, don't guess — data-driven optimization decisions."

**Benchmark: Measuring Render Time**

```tsx
import { Profiler, ProfilerOnRenderCallback } from "react";

const onRenderCallback: ProfilerOnRenderCallback = (
  id, // "FileTree"
  phase, // "mount" | "update"
  actualDuration, // Time spent rendering
  baseDuration, // Estimated time without memoization
  startTime, // When React began rendering
  commitTime, // When React committed changes
) => {
  // Log to performance monitoring
  console.table({
    id,
    phase,
    actualDuration: `${actualDuration.toFixed(2)}ms`,
    baseDuration: `${baseDuration.toFixed(2)}ms`,
    savings: `${((1 - actualDuration / baseDuration) * 100).toFixed(1)}%`,
  });

  // Alert on slow renders
  if (actualDuration > 16) {
    console.warn(`⚠️ Slow render: ${id} took ${actualDuration.toFixed(2)}ms`);
    // 16ms = 1 frame at 60fps → anything longer causes jank
  }
};

// Usage:
<Profiler id="FileTree" onRender={onRenderCallback}>
  <FileExplorer data={largeData} />
</Profiler>;
```

**Benchmark: Compare Approaches**

```tsx
// Test harness for measuring sort performance
function benchmarkSort(itemCount: number) {
  // Generate test data
  const items: FileData[] = Array.from({ length: itemCount }, (_, i) => ({
    id: i,
    name: `item_${Math.random().toString(36).substr(2, 8)}`,
    children: i % 3 === 0 ? [] : undefined, // 33% directories
  }));

  // Approach 1: Partition + Sort
  const t1Start = performance.now();
  for (let run = 0; run < 100; run++) {
    const dirs = items.filter((i) => i.children);
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    const files = items.filter((i) => !i.children);
    files.sort((a, b) => a.name.localeCompare(b.name));
    const result = [...dirs, ...files];
  }
  const t1End = performance.now();

  // Approach 2: Single Sort
  const t2Start = performance.now();
  for (let run = 0; run < 100; run++) {
    const sorted = [...items].sort((a, b) => {
      const aDir = Boolean(a.children);
      const bDir = Boolean(b.children);
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
  const t2End = performance.now();

  console.table({
    "Item Count": itemCount,
    "Partition (100 runs)": `${(t1End - t1Start).toFixed(2)}ms`,
    "Single Sort (100 runs)": `${(t2End - t2Start).toFixed(2)}ms`,
    "Partition avg": `${((t1End - t1Start) / 100).toFixed(3)}ms`,
    "Single avg": `${((t2End - t2Start) / 100).toFixed(3)}ms`,
  });
}

// TYPICAL RESULTS:
// 100 items:   Partition 0.05ms  |  Single 0.04ms  → negligible
// 1,000 items: Partition 0.8ms   |  Single 0.6ms   → negligible
// 10,000 items: Partition 12ms   |  Single 9ms     → noticeable
// 100,000 items: Partition 180ms |  Single 140ms   → optimize!
```

**Memory Profiling:**

```tsx
// Measure component memory footprint
function measureTreeMemory(nodeCount: number) {
  // Before
  const baseMemory = (performance as any).memory?.usedJSHeapSize;

  // Create tree
  const data = generateLargeTree(nodeCount);
  const container = document.createElement("div");
  const root = createRoot(container);
  root.render(<FileExplorer data={data} />);

  // After
  const afterMemory = (performance as any).memory?.usedJSHeapSize;

  console.log({
    nodeCount,
    memoryUsed: `${((afterMemory - baseMemory) / 1024 / 1024).toFixed(2)} MB`,
    perNode: `${((afterMemory - baseMemory) / nodeCount).toFixed(0)} bytes`,
  });

  // Cleanup
  root.unmount();
}

// TYPICAL RESULTS:
// 100 nodes:   0.1 MB  (1,000 bytes/node)
// 1,000 nodes: 0.8 MB  (800 bytes/node)
// 10,000 nodes: 7 MB   (700 bytes/node)
// → Each node ≈ 700-1000 bytes (fiber + DOM + closures)
```

**Optimization Decision Framework:**

```
┌─────────────────────────────────────────────────────────────────┐
│              OPTIMIZATION DECISION TREE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Is render > 16ms?                                                │
│  ├── NO → Don't optimize! Ship it.                                │
│  └── YES → Profile: where is time spent?                          │
│      ├── Sorting?                                                 │
│      │   └── useMemo(sort, [fileList])                            │
│      ├── Re-rendering unchanged nodes?                            │
│      │   └── React.memo(FileObject)                               │
│      ├── Too many DOM nodes?                                      │
│      │   └── Virtualization (react-window)                        │
│      ├── Deep tree mounting all at once?                           │
│      │   └── Lazy render (only mount expanded)                    │
│      └── Sort on every keystroke (search)?                        │
│          └── useDeferredValue(searchQuery)                        │
│                                                                   │
│  GOLDEN RULE:                                                     │
│  "Measure first. Optimize the measured bottleneck.                │
│   Don't guess. Don't prematurely optimize."                       │
│                                                                   │
│  INTERVIEW:                                                       │
│  "I'd profile with React DevTools Profiler,                       │
│   identify the bottleneck, then apply the appropriate              │
│   optimization. I wouldn't add useMemo everywhere —                │
│   that's premature optimization."                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**React DevTools Profiler Guide:**

```
HOW TO USE REACT DEVTOOLS PROFILER:

1. Open React DevTools → Profiler tab
2. Click "Record" (⏺️)
3. Interact with file tree (expand, collapse, scroll)
4. Click "Stop" (⏹️)

READING THE FLAMEGRAPH:
┌────────────────────────────────────────┐
│ FileExplorer     0.1ms                 │ → Almost no time (thin wrapper)
│ ├── FileList      2.3ms                │ → Sort took time!
│ │   ├── FileObject 0.5ms (Documents)   │
│ │   ├── FileObject 0.3ms (Downloads)   │
│ │   │   └── FileList 1.8ms             │ → Nested sort + render
│ │   │       ├── FileObject 0.1ms       │
│ │   │       └── FileObject 0.1ms       │
│ │   └── FileObject 0.1ms (README)      │
│ └── (total: 5.2ms)                     │
└────────────────────────────────────────┘

COLOR CODING:
🟢 Green: Fast render (< 1ms)
🟡 Yellow: Moderate (1-16ms)
🔴 Red: Slow (> 16ms) — optimize!
⬜ Grey: Did not render (memoized) ← GOOD

WHAT TO LOOK FOR:
1. Components rendering when they shouldn't
2. Sort taking significant time
3. Deep trees taking long on initial mount
4. Components without "Did not render" (missing memo)
```

---

### Step 34: File Explorer as Design System Component

> 🧩 "Packaging File Explorer cho reuse — API design matters."

**Component API Design:**

```tsx
// PUBLIC API — What consumers see

interface FileExplorerProps {
  /** Tree data to display */
  data: ReadonlyArray<FileData>;

  /** Called when a file (not directory) is clicked */
  onFileSelect?: (file: FileData, path: FileData[]) => void;

  /** Called when a directory is expanded/collapsed */
  onDirectoryToggle?: (dir: FileData, isExpanded: boolean) => void;

  /** Currently selected file ID (controlled mode) */
  selectedId?: number;

  /** IDs of initially expanded directories */
  defaultExpandedIds?: number[];

  /** Custom sort comparator */
  sortComparator?: (a: FileData, b: FileData) => number;

  /** Enable multi-select mode */
  multiSelect?: boolean;

  /** Custom icon renderer */
  renderIcon?: (file: FileData, isDirectory: boolean) => React.ReactNode;

  /** Custom label renderer */
  renderLabel?: (file: FileData, isDirectory: boolean) => React.ReactNode;

  /** Disable interaction */
  disabled?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Max depth to render (prevents infinite recursion) */
  maxDepth?: number;

  /** Enable keyboard navigation */
  enableKeyboardNav?: boolean;

  /** Show file extensions */
  showExtensions?: boolean;
}

// USAGE EXAMPLES:

// Basic
<FileExplorer data={files} />

// With selection
<FileExplorer
  data={files}
  onFileSelect={(file, path) => openFile(file)}
  selectedId={activeFileId}
/>

// Custom icons
<FileExplorer
  data={files}
  renderIcon={(file, isDir) => (
    isDir ? <FolderIcon /> : <FileIcon ext={getExtension(file.name)} />
  )}
/>

// Custom sorting
<FileExplorer
  data={files}
  sortComparator={(a, b) => {
    // Size-based sorting
    return (a.size ?? 0) - (b.size ?? 0);
  }}
/>
```

**Compound Component Pattern:**

```tsx
// Advanced: Compound components for maximum flexibility

const FileExplorer = {
  Root: FileExplorerRoot,
  Item: FileExplorerItem,
  Directory: FileExplorerDirectory,
  File: FileExplorerFile,
  Toolbar: FileExplorerToolbar,
  Search: FileExplorerSearch,
};

// Usage:
<FileExplorer.Root data={files}>
  <FileExplorer.Toolbar>
    <FileExplorer.Search placeholder="Search files..." />
    <button onClick={expandAll}>Expand All</button>
  </FileExplorer.Toolbar>
  <FileExplorer.Item
    renderDirectory={(dir) => (
      <FileExplorer.Directory>
        <FolderIcon /> {dir.name}
      </FileExplorer.Directory>
    )}
  />
</FileExplorer.Root>;

// WHY Compound?
// 1. Maximum composition flexibility
// 2. Users choose what to include
// 3. Easy to add custom UI between sections
// 4. Follows Radix, Headless UI, Material UI patterns
```

**Headless / Renderless Pattern:**

```tsx
// Pure logic hook — zero UI opinions

interface UseFileExplorerReturn {
  flatNodes: FlatNode[];
  toggle: (id: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (id: number) => void;
  selectedIds: Set<number>;
  expandedIds: Set<number>;
  focusedId: number | null;
  getItemProps: (index: number) => {
    role: string;
    "aria-expanded"?: boolean;
    "aria-level": number;
    "aria-selected"?: boolean;
    tabIndex: number;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
  getRootProps: () => {
    role: string;
    "aria-label": string;
  };
}

function useFileExplorer(data: FileData[]): UseFileExplorerReturn {
  // All logic, no rendering
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const flatNodes = useMemo(
    () => flattenTree(data, expandedIds),
    [data, expandedIds],
  );

  const getItemProps = (index: number) => ({
    role: "treeitem" as const,
    "aria-expanded": flatNodes[index]?.isDirectory
      ? flatNodes[index].isExpanded
      : undefined,
    "aria-level": flatNodes[index].depth + 1,
    "aria-selected": selectedIds.has(flatNodes[index].item.id),
    tabIndex: index === 0 ? 0 : -1,
    onClick: () => {
      /* ... */
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      /* ... */
    },
  });

  const getRootProps = () => ({
    role: "tree" as const,
    "aria-label": "File explorer",
  });

  return {
    flatNodes,
    toggle,
    expandAll,
    collapseAll,
    select,
    selectedIds,
    expandedIds,
    focusedId: null,
    getItemProps,
    getRootProps,
  };
}

// Usage: Consumer provides ALL rendering
function MyCustomFileTree({ data }: Props) {
  const { flatNodes, getItemProps, getRootProps } = useFileExplorer(data);

  return (
    <div {...getRootProps()}>
      {flatNodes.map((node, index) => (
        <div
          key={node.item.id}
          {...getItemProps(index)}
          style={{ paddingLeft: node.depth * 16 }}
          className={`my-tree-item ${node.isDirectory ? "directory" : "file"}`}
        >
          {node.item.name}
        </div>
      ))}
    </div>
  );
}

// WHY Headless?
// 1. Zero CSS opinion — works with any design system
// 2. Full control over markup — consumer decides
// 3. Logic reusable — hook works with Tailwind, Material, custom CSS
// 4. Follows Downshift, React Table, React Aria patterns
```

**Component Documentation Template:**

```markdown
## FileExplorer

A tree view component for displaying hierarchical file structures.

### Installation

npm install @mylib/file-explorer

### Quick Start

import { FileExplorer } from '@mylib/file-explorer';

<FileExplorer data={files} onFileSelect={handleSelect} />

### Props

| Prop               | Type                 | Default  | Description          |
| ------------------ | -------------------- | -------- | -------------------- |
| data               | FileData[]           | required | Tree data            |
| onFileSelect       | (file, path) => void | -        | File click handler   |
| selectedId         | number               | -        | Controlled selection |
| defaultExpandedIds | number[]             | []       | Initial expansion    |
| maxDepth           | number               | 50       | Max render depth     |

### Accessibility

- Implements WAI-ARIA Treeview pattern
- Full keyboard navigation (Arrow, Home, End, Enter)
- Screen reader announcements for expand/collapse
- Roving tabindex for focus management

### Performance

- Handles 10K+ items with virtualization mode
- useMemo for sort computations
- React.memo for unchanged subtrees
```

**Design System Integration Levels:**

```
┌─────────────────────────────────────────────────────────────────┐
│          FILE EXPLORER — INTEGRATION LEVELS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Level 1: Standalone Component (interview / tutorial)             │
│  ├── Self-contained                                               │
│  ├── No external deps                                             │
│  ├── CSS-in-component                                             │
│  └── Works: <FileExplorer data={...} />                          │
│                                                                   │
│  Level 2: Library Component (npm package)                         │
│  ├── Props API (controlled/uncontrolled)                          │
│  ├── Theme support via CSS variables                              │
│  ├── TypeScript types exported                                    │
│  └── Storybook documentation                                     │
│                                                                   │
│  Level 3: Headless Component (design system agnostic)             │
│  ├── useFileExplorer hook (zero UI)                               │
│  ├── Consumer renders their own markup                            │
│  ├── getItemProps/getRootProps pattern                             │
│  └── Works with any CSS framework                                 │
│                                                                   │
│  Level 4: Compound Component (maximum flexibility)                │
│  ├── FileExplorer.Root + .Item + .Toolbar + .Search               │
│  ├── Consumer composes desired features                           │
│  ├── Context-based communication                                  │
│  └── Follows Radix UI / Headless UI patterns                     │
│                                                                   │
│  INTERVIEW: Build Level 1, discuss Levels 2-4                     │
│  PRODUCTION: Level 2 or 3 depending on needs                      │
│  ENTERPRISE: Level 4 for maximum adaptability                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHẦN B: TẠI SAO LÀM NHƯ VẬY? (Deep Dive)

> 🧠 Phần này giải thích **lý do đằng sau mỗi quyết định**, giúp bạn trả lời câu hỏi "Tại sao?" từ interviewer.

### 1. Tại sao dùng `Boolean(children)` thay vì explicit `type` field?

**❌ Alternative: Explicit type discriminator**

```typescript
interface FileObject {
  id: number;
  name: string;
  type: "file" | "directory"; // Explicit
  children?: FileObject[];
}
```

**✅ Chosen: Infer from children presence**

```typescript
const isDirectory = Boolean(file.children);
```

**Lý do:**

| Factor                   | Explicit `type`                            | Infer from `children`      |
| ------------------------ | ------------------------------------------ | -------------------------- |
| Data redundancy          | Yes — type + children both say "directory" | No redundancy              |
| Data inconsistency risk  | Yes — `type: 'file'` with children?        | Impossible                 |
| API simplicity           | More fields to specify                     | Minimal fields             |
| TypeScript narrowing     | Need type guard                            | `if (file.children)` works |
| Real file system analogy | Files don't have "type" label              | Directory = "has entries"  |

**💬 Interview talking point:**

> "Tôi prefer inferring type từ data shape thay vì explicit discriminator. Giống principle trong file system thực — directory là thứ chứa entries, không cần label riêng. Nếu data từ API có explicit type, tôi vẫn dùng children presence cho rendering logic để avoid inconsistency."

---

### 2. Tại sao Expand/Collapse state LOCAL thay vì GLOBAL?

**❌ Alternative: Global expanded state**

```tsx
// Root owns expanded state
function FileExplorer({ data }) {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Pass down to every component...
}
```

**✅ Chosen: Local state per directory**

```tsx
function FileObject({ file }) {
  const [expanded, setExpanded] = useState(false);
  // Each directory manages its own state
}
```

**So sánh chi tiết:**

| Factor          | Global Set\<id\>                  | Local useState               |
| --------------- | --------------------------------- | ---------------------------- |
| Complexity      | Higher — prop drilling            | Lower — self-contained       |
| Re-renders      | Every toggle re-renders from root | Only affected subtree        |
| "Expand All"    | Easy — `setExpandedIds(allIds)`   | Need ref/context             |
| Persist state   | Easy — serialize Set              | Hard — no central access     |
| URL sync        | Easy — `?expanded=1,2,3`          | Hard — distributed state     |
| Performance     | O(1) lookup in Set                | O(1) — just check local bool |
| Code simplicity | More boilerplate                  | Minimal code                 |

**💬 Interview talking point:**

> "Cho bài interview basic, local state là correct choice vì:
>
> 1. Simpler — less code, less bugs
> 2. Better performance — isolated re-renders
> 3. YAGNI — 'expand all' chưa required
>
> Nếu interviewer hỏi 'expand all', tôi sẽ pivot sang global Set approach hoặc Context."

---

### 3. Tại sao dùng `<button>` thay vì `<div onClick>`?

**❌ Anti-pattern:**

```tsx
<div onClick={toggle} className="file-name">
  {fileName}
</div>
```

**✅ Correct: Semantic button**

```tsx
<button onClick={toggle} className="file-item-button">
  <span>{fileName}</span>
</button>
```

**Lý do:**

| Factor              | `<div onClick>`                   | `<button>`                |
| ------------------- | --------------------------------- | ------------------------- |
| Keyboard accessible | ❌ No (need tabIndex + onKeyDown) | ✅ Yes (Enter/Space auto) |
| Screen reader       | ❌ "text"                         | ✅ "button, Documents"    |
| Focus visible       | ❌ No focus ring                  | ✅ Browser default focus  |
| Semantic HTML       | ❌ Generic container              | ✅ Interactive element    |
| WCAG compliance     | ❌ Fails                          | ✅ Passes                 |

**💬 Interview talking point:**

> "Accessibility là non-negotiable. `<button>` gives us keyboard support, screen reader announcements, và focus management for free. `<div onClick>` requires manual reimplementation of all these."

---

### 4. Tại sao Sorting Logic ở FileList, không ở FileExplorer?

**❌ Sort ở root:**

```tsx
function FileExplorer({ data }) {
  const sortedData = deepSort(data); // Sort entire tree at root
  return <FileList fileList={sortedData} />;
}
```

**✅ Sort ở FileList:**

```tsx
function FileList({ fileList }) {
  const directories = fileList.filter((item) => item.children);
  directories.sort((a, b) => a.name.localeCompare(b.name));
  // ... sort each level independently
}
```

**Lý do:**

```
1. Locality: Sort logic close to where it's used
2. Each level sorted independently — correct behavior
3. No deep transformation of entire tree upfront
4. FileList responsible for HOW items are displayed
5. If sort changes (e.g., modified date), only FileList changes
```

**💬 Interview talking point:**

> "Sort ở FileList vì mỗi directory level cần sort independently. Root sort sẽ cần deep recursive sort function — over-engineering. FileList đã recursive, nên mỗi level tự sort children của nó."

---

### 5. Tại sao `.filter()` rồi `.sort()` thay vì single `.sort()`?

**Approach 1: Partition + Sort (Chosen)**

```tsx
const directories = fileList.filter((item) => item.children);
directories.sort((a, b) => a.name.localeCompare(b.name));

const nonDirectories = fileList.filter((item) => !item.children);
nonDirectories.sort((a, b) => a.name.localeCompare(b.name));

const items = [...directories, ...nonDirectories];
```

**Approach 2: Single custom sort**

```tsx
const items = [...fileList].sort((a, b) => {
  const aIsDir = Boolean(a.children);
  const bIsDir = Boolean(b.children);
  if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
  return a.name.localeCompare(b.name);
});
```

**So sánh:**

| Factor        | Partition + Sort            | Single Sort                     |
| ------------- | --------------------------- | ------------------------------- |
| Readability   | ⭐⭐⭐ Clear intent         | ⭐⭐ Need understand comparator |
| Lines of code | More                        | Less                            |
| Performance   | O(2n + d·log(d) + f·log(f)) | O(n·log(n))                     |
| Stability     | Guaranteed                  | Depends on sort impl            |
| Extensibility | Easy to add 3rd category    | Comparator gets complex         |

**💬 Interview talking point:**

> "Both approaches correct. Partition approach được chọn vì readability — ý đồ rõ ràng: 'directories first, then files, each sorted alphabetically'. Single sort compact hơn nhưng comparator logic less obvious. Trong interview, clarity > brevity."

---

### 6. Tại sao `ReadonlyArray` và `Readonly` trong Props?

```typescript
export type FileData = Readonly<{
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
}>;
```

**Lý do:**

```
1. Signal intent: "Component receives data, never modifies it"
2. Prevent bugs: .sort() on ReadonlyArray → TypeScript error
   → Forces creating new array before sorting ✅
3. One-way data flow: Data flows down, events flow up
4. React principle: Props are read-only
5. TypeScript enforcement: Compiler catches violations
```

**Practical benefit:**

```tsx
// Without Readonly:
fileList.sort(...)  // ⚠️ Silently mutates props! Bug!

// With ReadonlyArray:
fileList.sort(...)  // ❌ TypeScript Error!
                    // Property 'sort' does not exist on ReadonlyArray

// Forces correct pattern:
const copy = fileList.filter(...);  // New array ✅
copy.sort(...);                      // Safe to sort ✅
```

---

### 7. Tại sao dùng `level` prop?

```tsx
<FileList fileList={data} level={1} />
// Inside FileObject:
<FileList fileList={fileChildren} level={level + 1} />
```

**Current usage:** Level prop passed but not directly used for styling (CSS `padding-left` handles indentation).

**Future uses:**

```tsx
// Limit expand depth
if (level > MAX_DEPTH) return <span>...</span>;

// Different icons per level
const icon = level === 1 ? '📁' : level === 2 ? '📂' : '📄';

// Accessibility
<ul role="group" aria-level={level}>

// Analytics
trackEvent('expand', { level, directoryName: file.name });
```

**💬 Interview talking point:**

> "Level tracking là forward-thinking design. Hiện tại CSS handles indentation qua nested `<ul>` padding, nhưng level prop cho phép: depth limiting, level-specific rendering, accessibility attributes, và analytics."

---

### 8. Tại sao `<button>` cho Files cũng (dù click no-op)?

```tsx
<button
  onClick={() => {
    if (!isDirectory) return; // No-op for files
    setExpanded(!expanded);
  }}
>
  <span>{fileName}</span>
</button>
```

**Q: "Tại sao không dùng `<span>` cho files và `<button>` chỉ cho directories?"**

```tsx
// Alternative: Different elements
{
  isDirectory ? (
    <button onClick={() => setExpanded(!expanded)}>
      {fileName} [{expanded ? "-" : "+"}]
    </button>
  ) : (
    <span className="file-name">{fileName}</span>
  );
}
```

**Trade-offs:**

| Factor               | Same element                        | Different elements       |
| -------------------- | ----------------------------------- | ------------------------ |
| Code simplicity      | ✅ 1 element, conditional behavior  | More JSX                 |
| Visual consistency   | ✅ Same styling base                | Need align styles        |
| Future extensibility | ✅ Easy to add file click (preview) | Already separated        |
| Semantic correctness | 🟡 Button for non-interactive file  | ✅ Span for display-only |
| Keyboard navigation  | 🟡 Focus on non-interactive items   | ✅ Only focusable dirs   |

**💬 Interview talking point:**

> "Trong interview, unified button approach giữ code simple. Production, tôi sẽ separate: `<button>` cho directories, `<span>` cho files — better semantics và keyboard navigation, vì users không cần tab to files."

---

### 9. Tại sao Expand/Collapse Indicator `[+]/[-]` thay vì Icons?

```tsx
{
  isDirectory && <>[{expanded ? "-" : "+"}]</>;
}
```

**Lý do cho interview context:**

```
1. No external dependencies (no icon library)
2. Universal understanding: + = expand, - = collapse
3. Text-based: works in any environment (CodeSandbox, whiteboard)
4. Focus on logic, not styling (interview priority)
```

**Production alternatives:**

```tsx
// Unicode arrows
{
  expanded ? "▼" : "▶";
}

// SVG icons
{
  expanded ? <ChevronDown /> : <ChevronRight />;
}

// CSS-only rotation
<span className={`arrow ${expanded ? "arrow--expanded" : ""}`}>▶</span>;
// .arrow--expanded { transform: rotate(90deg); transition: 0.2s; }

// File type icons
{
  isDirectory ? (expanded ? "📂" : "📁") : "📄";
}
```

---

### 10. Tại sao Empty Directories Expandable nhưng Show Nothing?

```tsx
{
  fileChildren &&
    fileChildren.length > 0 && // ← Empty check
    expanded && <FileList fileList={fileChildren} level={level + 1} />;
}
```

**Behavior:**

```
📁 EmptyFolder [+]     ← Click to expand
📁 EmptyFolder [-]     ← Expanded, nothing inside
                       ← No children rendered (length = 0)
```

**Q: "Nên show 'Empty' message không?"**

```tsx
// Option 1: Just empty (current)
{
  fileChildren &&
    expanded &&
    (fileChildren.length > 0 ? (
      <FileList fileList={fileChildren} level={level + 1} />
    ) : null); // Nothing
}

// Option 2: Show empty message (better UX)
{
  fileChildren &&
    expanded &&
    (fileChildren.length > 0 ? (
      <FileList fileList={fileChildren} level={level + 1} />
    ) : (
      <p className="empty-dir">Empty directory</p>
    ));
}
```

**💬 Interview talking point:**

> "Requirement says 'Directories can be empty', nên expanding shows nothing —acceptable cho MVP. Production, tôi sẽ add empty state message hoặc prevent expanding empty directories."

---

### 11. Re-render Behavior Analysis

> ⚡ "Khi user toggle một directory, components nào re-render?"

```
Scenario: Click "Documents" to expand

BEFORE click:
Documents/  [+]   ← collapsed
Downloads/  [+]
README.md

AFTER click:
Documents/  [-]   ← expanded
  Powerpoint.ppt   ← NEW renders
  Word.doc         ← NEW renders
Downloads/  [+]    ← NOT re-rendered
README.md          ← NOT re-rendered
```

**Analysis:**

```
1. setExpanded(true) called on Documents FileObject
2. Documents FileObject re-renders (state changed)
3. FileList inside Documents renders (new mount)
4. Powerpoint and Word FileObject render (new mount)
5. Downloads FileObject: NOT re-rendered (different component instance)
6. README FileObject: NOT re-rendered (different component instance)

Key insight: Local state means ISOLATED re-renders!
Only the toggled directory and its NEW children render.
Siblings are completely unaffected.
```

**So sánh với global state approach:**

```
If expanded state was GLOBAL (lifted to root):
1. setExpandedIds called → Root re-renders
2. ENTIRE tree re-renders (props changed from root)
3. Need React.memo to prevent unnecessary renders
4. More code, more complexity, same visual result
```

---

### 12. Recursive Rendering — Depth Analysis

> 🌳 "Hiểu recursion depth và khi nào nó kết thúc."

**Call stack visualization:**

```
FileExplorer({ data })
  └── FileList({ fileList: data, level: 1 })
        ├── FileObject({ file: Documents, level: 1 })
        │     └── FileList({ fileList: [Word, PPT], level: 2 })
        │           ├── FileObject({ file: PPT, level: 2 })
        │           │     → No children → STOP recursion
        │           └── FileObject({ file: Word, level: 2 })
        │                 → No children → STOP recursion
        ├── FileObject({ file: Downloads, level: 1 })
        │     └── FileList({ fileList: [unnamed, Misc], level: 2 })
        │           ├── FileObject({ file: Misc, level: 2 })
        │           │     └── FileList({ fileList: [foo, bar], level: 3 })
        │           │           ├── FileObject({ file: bar, level: 3 })
        │           │           │     → STOP
        │           │           └── FileObject({ file: foo, level: 3 })
        │           │                 → STOP
        │           └── FileObject({ file: unnamed, level: 2 })
        │                 → STOP
        └── FileObject({ file: README, level: 1 })
              → STOP
```

**Recursion terminates when:**

```
1. FileObject has no children → doesn't render FileList
2. FileObject has children but collapsed → doesn't render FileList
3. FileObject has empty children → condition blocks render

Base case: Leaf node (file) — no children, no recursive call
This is IMPLICIT base case — no explicit if/else needed.
```

**Stack depth:**

```
Maximum call stack depth = tree depth × 2
(FileList + FileObject at each level)

For tree depth 100:
→ 200 nested component renders
→ React can handle this (no stack overflow)
→ But 100-level deep file tree is unusual

For depth > 1000:
→ Consider iterative approach with explicit stack
→ Or virtualized tree with flattened data
```

---

### 13. Performance Characteristics

> ⚡ Complexity analysis.

**Initial render (all collapsed):**

```
- Only top-level items render
- N = number of top-level items
- Sort: O(N log N)
- Render: O(N)
- Total: O(N log N)
```

**Expand one directory:**

```
- Only children of that directory render
- K = number of children in that directory
- Sort: O(K log K)
- Render: O(K)
- Total: O(K log K)
- Siblings: 0 work (local state!)
```

**Expand all (worst case):**

```
- Every node renders
- N = total nodes in tree
- Sort at each level: O(Σ Kᵢ log Kᵢ) per level
- Total sort: O(N log M) where M = max children per node
- Total render: O(N)
```

**Re-render on sort (every render):**

```
⚠️ Issue: FileList sorts on EVERY render
→ filter() + sort() called each time parent re-renders
→ For large lists: unnecessary computation

Fix: useMemo
const items = useMemo(() => {
  const dirs = fileList.filter(item => item.children);
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  const files = fileList.filter(item => !item.children);
  files.sort((a, b) => a.name.localeCompare(b.name));
  return [...dirs, ...files];
}, [fileList]);
```

---

### 14. Component Communication Pattern

> 🔗 "Data flows DOWN, Events flow UP (nhưng ở đây events stay LOCAL)."

```
┌─────────────────────────────────────────┐
│ FileExplorer                            │
│ ┌─────────────────────────────────────┐ │
│ │ FileList (level 1)                 │ │
│ │ ┌──────────────────┐               │ │
│ │ │ FileObject       │ data ↓        │ │
│ │ │ [expanded] STATE │ events: LOCAL  │ │
│ │ │ ┌──────────────┐ │               │ │
│ │ │ │ FileList (2) │ │               │ │
│ │ │ │ ┌──────────┐ │ │               │ │
│ │ │ │ │FileObject│ │ │               │ │
│ │ │ │ │[expanded]│ │ │               │ │
│ │ │ │ └──────────┘ │ │               │ │
│ │ │ └──────────────┘ │               │ │
│ │ └──────────────────┘               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Key difference from Nested Checkboxes:
- Checkboxes: Click child → update ancestors (events flow UP)
- File Explorer: Click directory → toggle LOCAL state (events stay LOCAL)
- No state coordination between components needed!
```

---

### 15. Tại sao Conditional Rendering `{expanded && ...}` thay vì CSS `display: none`?

```tsx
// CÁCH CHỌN:
{
  expanded && <FileList fileList={children} />;
}

// THAY VÌ:
<div style={{ display: expanded ? "block" : "none" }}>
  <FileList fileList={children} />
</div>;
```

**Lý do chọn Conditional Rendering:**

```
┌─────────────────────────┬─────────────────────┬─────────────────────────┐
│ Tiêu chí                │ {expanded && ...}    │ display: none           │
├─────────────────────────┼─────────────────────┼─────────────────────────┤
│ DOM nodes khi collapsed │ 0 (unmounted)        │ Full tree (hidden)      │
│ Memory                  │ Proportional to vis  │ All nodes in memory     │
│ Mount/Unmount cost      │ Re-mount mỗi expand  │ Mount 1 lần duy nhất   │
│ State preservation      │ ❌ Reset khi collapse │ ✅ Preserved            │
│ Exit animation          │ ❌ Không thể          │ ✅ Có thể               │
│ Performance (large tree)│ ✅ Tốt hơn           │ ❌ Chậm (hidden DOM)    │
│ React DevTools          │ Sạch (ít components) │ Nhiều hidden components │
└─────────────────────────┴─────────────────────┴─────────────────────────┘
```

**Phân tích sâu — Tại sao trade-off này hợp lý:**

```
1. MEMORY: File Explorer có thể có 10K+ nodes
   - display:none → 10K DOM elements luôn tồn tại
   - conditional → chỉ expanded paths có DOM elements
   - Tiết kiệm: 80-90% DOM nodes cho tree điển hình

2. STATE RESET: Collapse → children unmount → state mất
   - File Explorer: Expand state mỗi directory là LOCAL
   - Collapse parent → children state mất → re-expand sẽ collapsed
   - Đây là CORRECT behavior! (giống VS Code, macOS Finder)

3. RE-MOUNT COST: Mỗi expand → mount children fresh
   - Chỉ children trực tiếp (không phải toàn bộ subtree)
   - React mount rất nhanh cho small lists
   - Trade-off: mount ~10 items vs keep ~100 hidden nodes

4. ANIMATION: Không thể animate exit nếu unmount
   - MVP không cần animation
   - Production: Dùng CSS Grid 0fr→1fr (không cần mount)
   - Hoặc react-transition-group unmountOnExit

INTERVIEW ANSWER:
"I use conditional rendering to minimize DOM footprint.
 For a tree with thousands of nodes, keeping collapsed
 subtrees in DOM wastes memory. The trade-off is losing
 nested expand state on collapse, but that matches user
 expectations from VS Code and macOS Finder."
```

---

### 16. Tại sao `key={file.id}` thay vì `key={index}` hoặc `key={file.name}`?

**So sánh 3 key strategies:**

```tsx
// ✅ ĐÚNG: Unique ID
{
  sortedItems.map((file) => <FileObject key={file.id} file={file} />);
}

// ❌ SAI: Index
{
  sortedItems.map((file, index) => <FileObject key={index} file={file} />);
}

// ⚠️ CÓ VẤN ĐỀ: Name
{
  sortedItems.map((file) => <FileObject key={file.name} file={file} />);
}
```

**Phân tích chi tiết:**

```
SCENARIO: User có 3 files [A.txt, B.txt, C.txt]
Rename B.txt → Z.txt, list re-sorts → [A.txt, C.txt, Z.txt]

KEY = INDEX:
  Before: index 0 → A.txt, index 1 → B.txt, index 2 → C.txt
  After:  index 0 → A.txt, index 1 → C.txt, index 2 → Z.txt
  React thinks: index 1 changed from B to C, index 2 changed from C to Z
  → React RE-RENDERS items 1 AND 2 (wrong!)
  → Nếu có local state (expanded), bị gán SAI node!

KEY = NAME:
  Before: "A.txt" → A, "B.txt" → B, "C.txt" → C
  After:  "A.txt" → A, "C.txt" → C, "Z.txt" → new
  React thinks: "B.txt" removed, "Z.txt" added
  → Correct behavior IF names are unique
  → BUG: Multiple files named "untitled.txt" → key collision!

KEY = ID:
  Before: id:1 → A, id:2 → B, id:3 → C
  After:  id:1 → A, id:3 → C, id:2 → Z (renamed)
  React thinks: id:1 same, id:3 moved, id:2 updated name
  → CORRECT! Only re-renders changed node
  → No duplicate key possible (IDs are unique)

WHY THIS MATTERS FOR DIRECTORIES:
- Directory has local expand state
- key=index → Collapse dir at index 2, add file at index 0
  → Index 2 now points to DIFFERENT dir → wrong expand state!
- key=id → Same dir keeps same component instance → state preserved
```

**Edge case — Duplicate names trong cùng folder:**

```
folder/
├── config.json    (id: 5)
├── config.json    (id: 12)  ← duplicate name!
└── README.md      (id: 7)

key={file.name}:
  → TWO items with key="config.json"
  → React warns: "Encountered two children with the same key"
  → Một trong hai bị skip hoặc render sai
  → BUG!

key={file.id}:
  → key=5, key=12, key=7
  → All unique → correct behavior
  → Cả hai config.json đều render đúng
```

---

### 17. Tại sao Architecture 3 Components thay vì 1 hoặc 2?

```
OPTION A: 1 Component (Everything-in-one)
┌──────────────────────────────────┐
│ FileExplorer                      │
│ - Render root                     │
│ - Render each item               │
│ - Handle expand/collapse         │
│ - Sort logic                     │
│ - Recursive rendering            │
│ └── TOO MANY RESPONSIBILITIES!   │
└──────────────────────────────────┘
Problem: Violates SRP, hard to test, hard to maintain

OPTION B: 2 Components
┌──────────────────┐    ┌──────────────────┐
│ FileExplorer      │    │ FileItem          │
│ - Root wrapper    │ →  │ - Render item     │
│ - Sort + recurse  │    │ - Expand/Collapse │
│ - Both list AND   │    │ - Display name    │
│   container logic │    │                    │
└──────────────────┘    └──────────────────┘
Problem: FileExplorer does sorting AND recursion
         → Tightly coupled, sort logic not reusable

OPTION C: 3 Components (Our choice) ✅
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ FileExplorer      │  │ FileList          │  │ FileObject        │
│ - Root container  │→ │ - Sort items      │→ │ - Single item     │
│ - Pass data down  │  │ - Map to objects  │  │ - Expand/Collapse │
│                    │  │ - Recursive call  │  │ - Display name    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
Each component: 1 responsibility, testable independently
```

**Tại sao 3 là optimal:**

```
SINGLE RESPONSIBILITY:
FileExplorer → Container/Provider (data boundary)
FileList     → List rendering + sorting (presentation logic)
FileObject   → Individual item behavior (interaction logic)

TESTABILITY:
FileExplorer → Test: "Does it render FileList with correct data?"
FileList     → Test: "Does it sort dirs-first, alphabetical?"
FileObject   → Test: "Does it toggle expand on click?"
(Mỗi test focused, không test logic của component khác)

REUSABILITY:
FileList có thể reuse cho:
- Bookmark tree
- Category picker
- Navigation menu
(Sort logic + recursive rendering là generic)

WHEN WOULD 2 BE ENOUGH?
- Nếu không có sorting logic → merge FileList vào FileExplorer
- Nếu items rất simple → merge FileObject vào FileList

WHEN WOULD 4+ BE NEEDED?
- Custom header/toolbar → FileExplorerHeader
- Search/filter → FileExplorerSearch
- Context menu → FileContextMenu
- Production thường có 5-7 components
```

---

### 18. Tại sao KHÔNG dùng `useCallback`/`useMemo` trong MVP?

```tsx
// MVP — Không có useCallback:
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Re-created every render — IS THIS A PROBLEM?
  const handleClick = () => {
    if (isDirectory) setExpanded(!expanded);
  };

  return <button onClick={handleClick}>{file.name}</button>;
}
```

**Phân tích deep:**

```
QUESTION: "handleClick re-created every render, tại sao không wrap useCallback?"

ANSWER:
1. handleClick KHÔNG ĐƯỢC PASS xuống child component
   → Chỉ gán vào <button> native element
   → React không re-render <button> dựa trên callback reference
   → Tạo mới function = allocate ~100 bytes → negligible

2. Khi nào CẦN useCallback?
   → Khi pass callback as prop to MEMOIZED child:

   // Child dùng React.memo
   const MemoChild = React.memo(({ onClick }) => ...);

   // Parent PHẢI useCallback, nếu không MemoChild re-render mỗi lần
   const handleClick = useCallback(() => { ... }, [deps]);
   <MemoChild onClick={handleClick} />

3. Khi nào CẦN useMemo cho sort?
   → Khi sort input KHÔNG thay đổi nhưng component re-renders:

   // Parent re-renders (e.g., sibling state change)
   // → FileList re-renders → sort runs again
   // Sort time for 100 items: ~0.1ms → negligible
   // Sort time for 10K items: ~10ms → COUND useMemo

   const sorted = useMemo(() => sortItems(list), [list]);

4. PREMATURE OPTIMIZATION COST:
   useCallback → thêm dependency array quản lý
   useMemo    → thêm memory cho cached value
   Wrong deps → STALE BUGS (harder to debug than perf issue)

RULE OF THUMB:
├── < 100 items + no memoized children → SKIP
├── 100-1000 items → useMemo for sort only
├── 1000+ items → useMemo + React.memo + useCallback
└── > 10K items → Virtualization (don't optimize render)

INTERVIEW:
"I intentionally skip memoization in MVP.
 The cost of stale closure bugs outweighs the perf gain
 for small trees. I'd add useMemo for sorting when
 profiling shows it's a bottleneck."
```

---

### 19. Tại sao CSS Architecture: Flat Classes thay vì CSS Modules / Styled Components?

```css
/* Our approach: Simple flat classes */
.file-list {
  list-style: none;
  padding-left: 16px;
}
.file-button {
  /* styles */
}
.file-button--directory {
  font-weight: bold;
}
```

**So sánh 5 CSS approaches cho File Explorer:**

```
┌──────────────────┬────────┬────────────┬────────────┬─────────────┐
│ Criteria         │ Flat   │ CSS Modules│ Styled-comp│ Tailwind    │
├──────────────────┼────────┼────────────┼────────────┼─────────────┤
│ Setup complexity │ ⭐      │ ⭐⭐        │ ⭐⭐⭐       │ ⭐⭐          │
│ Scoping          │ ❌ Global│ ✅ Local   │ ✅ Local   │ ✅ Utility   │
│ Runtime cost     │ Zero   │ Zero       │ Runtime JS │ Zero        │
│ TypeScript       │ N/A    │ .d.ts gen  │ ✅ Native  │ N/A         │
│ Dynamic styles   │ ❌ Hard │ ❌ Hard    │ ✅ Easy    │ ❌ Hard     │
│ Interview speed  │ ✅ Fast │ 🟡 Medium │ ❌ Slow    │ ✅ Fast     │
│ Readability      │ ✅ Good │ ✅ Good    │ 🟡 Noisy  │ ❌ Cryptic  │
│ Dep required     │ None   │ Bundler    │ npm pkg    │ npm + conf  │
└──────────────────┴────────┴────────────┴────────────┴─────────────┘

WHY FLAT CLASSES FOR INTERVIEW:
1. Zero setup → code faster
2. Interviewer can read CSS easily
3. Focus on React logic, not CSS tooling
4. Works in any environment (CodeSandbox, StackBlitz)

WHY CSS MODULES FOR PRODUCTION:
1. Scoped → no naming conflicts
2. Zero runtime cost
3. Matches component boundaries
4. .module.css convention is standard

NAMING CONVENTION (BEM-lite):
.file-list        → Block
.file-button      → Block
.file-button--dir → Modifier
.file-children    → Block (container for nested list)
```

---

### 20. Tại sao Error Boundary ở Root, không ở mỗi Node?

```tsx
// OPTION A: Error Boundary per node
function FileObject({ file }: Props) {
  return (
    <ErrorBoundary fallback={<span>⚠️ {file.name}</span>}>
      <FileObjectInner file={file} />
    </ErrorBoundary>
  );
}
// → 1000 nodes = 1000 ErrorBoundary instances!

// OPTION B: Error Boundary at root ✅
function FileExplorer({ data }: Props) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <FileList fileList={data} level={1} />
    </ErrorBoundary>
  );
}
```

**Phân tích:**

```
PER-NODE ERROR BOUNDARY:
Pros:
✅ Granular → chỉ 1 node lỗi, rest vẫn render
✅ User thấy exactly node nào bị lỗi

Cons:
❌ 1000 ErrorBoundary instances → memory overhead
❌ ErrorBoundary = class component → không thể dùng hooks
❌ Try-catch per node → performance impact
❌ Error in sort (FileList) → ErrorBoundary per node KHÔNG bắt được!

ROOT ERROR BOUNDARY:
Pros:
✅ 1 instance duy nhất → minimal overhead
✅ Catches ALL errors (render, lifecycle, sort, etc.)
✅ Clean recovery → re-mount entire tree
✅ Simple implementation

Cons:
❌ One corrupt node → entire tree fails
❌ Less granular error info

RECOMMENDATION:
├── MVP/Interview → Root only (đơn giản, đủ dùng)
├── Production → Root + per-CRITICAL-section
│   └── ErrorBoundary cho toolbar, search, tree content riêng
└── Enterprise → Root + per-subtree (lazy-loaded sections)

WHY ROOT IS USUALLY ENOUGH:
"In practice, file tree errors are:
 1. Data errors (bad API) → entire tree is suspect
 2. Render errors (null access) → fix code, not handle per-node
 3. Sort errors → affects entire list

 Per-node boundaries add complexity without
 solving the actual error categories."
```

---

### 21. Tại sao Data phải Immutable?

```tsx
// ❌ MUTATION (Bug-prone):
function toggleExpand(node: FileData) {
  node.isExpanded = !node.isExpanded; // MUTATE original data!
  setData(data); // React: "same reference, skip re-render!"
}

// ✅ IMMUTABLE (Correct):
function toggleExpand(id: number) {
  setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next; // NEW object → React re-renders
  });
}
```

**5 lý do Immutability quan trọng cho File Explorer:**

```
1. REACT CHANGE DETECTION:
   React dùng Object.is() (===) để so sánh state
   Mutate object → same reference → React SKIP re-render!

   setState(sameObject); // React: "nothing changed, skip"
   setState({...newObject}); // React: "new ref, re-render!"

2. React.memo DEPENDS ON IMMUTABILITY:
   React.memo compares props with Object.is()
   If parent mutates data object:
   prevProps.file === nextProps.file → TRUE (same ref!)
   → Skip re-render even though data changed!
   → STALE DISPLAY (bug)

3. TIME-TRAVEL DEBUGGING:
   Redux DevTools, React DevTools → snapshot state
   If mutated → snapshots all point to SAME object
   → Impossible to compare before/after

4. CONCURRENT RENDERING (React 18+):
   React may interrupt and restart renders
   If state is mutated mid-render:
   → Render 1 sees partial mutation
   → Render 2 sees full mutation
   → INCONSISTENT UI (race condition!)

5. UNDO/REDO:
   Immutable → just store previous state references
   Mutable → need deep clone before each change

   // Immutable undo:
   const [history, setHistory] = useState([initialState]);
   const undo = () => setHistory(prev => prev.slice(0, -1));
   // Free! Each state is a separate object
```

---

### 22. Tại sao KHÔNG dùng Context API trong MVP?

```tsx
// MVP: Props drilling (FileExplorer → FileList → FileObject)
<FileExplorer data={data}>
  <FileList fileList={data} level={1}>
    <FileObject file={file} level={1} />
  </FileList>
</FileExplorer>;

// Alternative: Context
const TreeContext = createContext<TreeState>(null!);
// FileObject accesses state via useContext(TreeContext)
```

**Phân tích trade-offs:**

```
PROPS DRILLING:
Depth: FileExplorer → FileList → FileObject (chỉ 3 levels!)
Props passed: file, level (chỉ 2 props!)

CONTEXT OVERHEAD:
1. Create context + Provider + custom hook
2. Any context change → ALL consumers re-render
3. Value stabilization needed (useMemo on provider value)
4. Harder to test (need context wrapper in tests)
5. More code for same result

WHEN CONTEXT IS JUSTIFIED:
├── Prop drilling > 3-4 levels deep
├── Many components need same data
├── Data changes INFREQUENTLY (theme, auth)
├── Avoiding "props forwarding" (middle components don't use data)
└── Global actions (expandAll, collapseAll, search)

FILE EXPLORER SPECIFICS:
├── Expand state: LOCAL per node → no sharing needed
├── Sort logic: In FileList → no prop drilling
├── Data: Passes down naturally via recursion
└── Actions: Each node handles its own toggle
→ Context adds complexity with ZERO benefit for MVP!

WHEN TO ADD CONTEXT (production):
├── Global expand/collapse all → needs shared expandedIds
├── Selection highlighting → needs shared selectedId
├── Search/filter → needs shared searchQuery
├── Drag & Drop → needs shared tree state
└── Undo/Redo → needs centralized state history

INTERVIEW:
"I keep it simple with direct props for MVP.
 The tree naturally passes data via recursion,
 and expand state is local. I'd add Context
 when we need global features like search or
 expand-all."
```

---

### 23. Tại sao infer `isDirectory` từ `children` thay vì maintain riêng?

```tsx
// OUR APPROACH: Computed (derived state)
const isDirectory = Boolean(file.children);

// ALTERNATIVE: Store separately
interface FileData {
  id: number;
  name: string;
  type: "file" | "directory"; // ← explicit field
  children?: FileData[];
}
const isDirectory = file.type === "directory";
```

**Tại sao derived state tốt hơn:**

```
SINGLE SOURCE OF TRUTH:
├── children exists → it IS a directory
├── children undefined → it IS a file
└── Impossible to have conflicting state:
    { type: 'file', children: [...] } ← BUG with explicit type!

DRY PRINCIPLE:
├── type field = REDUNDANT information
├── children already tells us the type
├── Less data to maintain = fewer bugs

DATA CONSISTENCY:
├── With explicit type:
│   Developer must ensure type='directory' ↔ children exists
│   API must return consistent data
│   Transform must map correctly
│   3 places where bugs can happen!
│
├── With inferred type:
│   Only children field matters
│   1 source of truth
│   0 consistency bugs possible

WHEN TO USE EXPLICIT TYPE:
├── API returns type but NOT children upfront (lazy load)
│   → Need type to show folder icon BEFORE loading children
├── Files with children (e.g., multi-part upload)
│   → Need to distinguish "file with parts" from "directory"
├── Special types beyond file/directory
│   → Symlinks, shortcuts, archives, packages

TRADE-OFF:
├── Inferred: Simpler, less data, works for 95% of cases
└── Explicit: More flexible, handles edge cases, more verbose

INTERVIEW:
"I infer the type from children — single source of truth.
 This eliminates a whole class of bugs where type and
 children could be inconsistent. The only case where I'd
 add an explicit type is for lazy-loaded directories where
 we know it's a folder before fetching contents."
```

---

### 24. Tại sao Sort là Array.sort() thay vì Tree Sort?

```
QUESTION: "Tại sao sort từng level riêng thay vì sort toàn bộ tree?"

OUR APPROACH: Sort per level (in FileList)
Tree Level 1: [Documents/, Downloads/, README.md] → sorted
Tree Level 2: [Word.doc, PPT.ppt] inside Documents → sorted
Tree Level 2: [Misc/, unnamed.txt] inside Downloads → sorted
Tree Level 3: [bar.txt, foo.txt] inside Misc → sorted

ALTERNATIVE: Flatten → Sort → Rebuild tree
1. Flatten entire tree to array
2. Sort by full path: /Documents/Word.doc, /Downloads/Misc/bar.txt...
3. Rebuild tree from sorted array
```

**Phân tích:**

```
PER-LEVEL SORT:
✅ Natural: Each FileList sorts its own children
✅ Simple: Sort is just Array.sort() on siblings
✅ Efficient: Only sort visible level (not entire tree)
✅ Correct: Directories group at each level independently
✅ Lazy: Collapsed directories → children NOT sorted until expanded

FULL TREE SORT:
❌ Complex: Need flatten + rebuild logic
❌ Expensive: Sort ALL nodes even if most are collapsed
❌ Unnatural: Full-path sort may give weird UI ordering
❌ Overkill: User expects per-directory sorting

EXAMPLE — WHY PER-LEVEL IS CORRECT:
Directory structure:
/B-project/a-file.txt
/A-project/z-file.txt

Per-level sort (correct):
A-project/          ← sorted alphabetically
└── z-file.txt
B-project/
└── a-file.txt

Full-path sort (weird):
Would sort by "/A-project/z-file.txt" vs "/B-project/a-file.txt"
→ Same result for directories, but WRONG if we sort files across dirs!

SORT COMPLEXITY:
Per-level: Sum of O(k_i × log(k_i)) for each directory i
           where k_i = children count of directory i
           Total: ≈ O(n × log(k_avg))

Full tree: O(n × log(n)) for flattening + sorting
           Plus O(n) for rebuilding

For balanced tree: Per-level is MORE efficient
For flat structure: Full tree is slightly better (but tree is trivial)
```

---

### 25. Tại sao Render trước rồi Mount, không Mount tất cả rồi Display?

```
QUESTION: Tại sao component pattern là:
"Click expand → render children → mount to DOM"
thay vì:
"Mount all children upfront → show/hide with CSS"
```

**Phân tích React Lifecycle:**

```
APPROACH 1: Render-on-demand (our choice)
T0: Tree mounts → chỉ root items trong DOM
T1: Click expand → setState(true)
T2: React renders FileList children (new components)
T3: Children mount to DOM (new elements appear)
T4: Click collapse → setState(false)
T5: Children unmount from DOM (elements removed)

DOM at T0: 3 elements (root items)
DOM at T3: 3 + 2 elements (root + expanded children)
DOM at T5: 3 elements (back to root only)

APPROACH 2: Mount-all-upfront
T0: Tree mounts → ALL items in DOM (hidden)
T1: Click expand → CSS display:block
T2: Children become visible (already in DOM)
T3: Click collapse → CSS display:none
T4: Children hidden (still in DOM)

DOM always: ALL elements (could be thousands!)

WHY APPROACH 1:
1. INITIAL LOAD: Only root items render → fast first paint
2. MEMORY: DOM size proportional to what user sees
3. REACT PHILOSOPHY: Declarative → render what you need
4. LAZY EVALUATION: Don't compute sort for hidden items
5. COMPONENT LIFECYCLE: useEffect in children only runs when needed

WHY APPROACH 2 IS SOMETIMES BETTER:
1. ANIMATIONS: Can animate exit (CSS transition)
2. PRESERVE STATE: Children state survives collapse
3. INSTANT REVEAL: No mount latency on expand

REAL-WORLD CHOICE:
VS Code: Approach 1 (DOM elements = visible items only)
Chrome DevTools: Approach 1 (virtual rendering)
macOS Finder: Approach 2 (pre-rendered, hidden)
GitHub: Approach 1 (lazy load on expand)
```

---

### 26. Tại sao Controlled vs Uncontrolled cho Expand State?

```tsx
// UNCONTROLLED (our MVP choice):
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false); // Internal state
  // Component owns its own state. Parent cannot control it.
}

// CONTROLLED:
function FileObject({ file, expanded, onToggle }: Props) {
  // State managed by parent. Component is "dumb".
  return (
    <button onClick={() => onToggle(file.id)}>
      {expanded ? "[-]" : "[+]"} {file.name}
    </button>
  );
}
```

**Trade-off Analysis:**

```
UNCONTROLLED (Internal useState):
✅ Simple: Each node manages itself
✅ Encapsulated: Parent doesn't need to know expand state
✅ Fast: No prop drilling for expand state
✅ Independent: Nodes don't affect each other
❌ No global control: Can't "expand all" from parent
❌ No persistence: Refresh → all collapsed
❌ No deep linking: Can't expand to specific file from URL

CONTROLLED (Parent manages):
✅ Global control: expandAll(), collapseAll()
✅ Persistence: Save expandedIds to localStorage
✅ Deep linking: URL → expand path to specific file
✅ Undo/Redo: Parent tracks state history
❌ More complex: Parent needs Set<id> state
❌ Prop drilling: Need to pass toggle + state down
❌ Re-render scope: Any toggle → parent re-renders

HYBRID (Best of both):
function FileObject({ file, defaultExpanded = false, onToggle }: Props) {
  const [internalExpanded, setInternal] = useState(defaultExpanded);

  // If parent provides controlled state, use it
  // Otherwise, use internal state
  const isControlled = onToggle !== undefined;
  const expanded = isControlled ? /* parent value */ : internalExpanded;

  const handleToggle = () => {
    if (isControlled) {
      onToggle(file.id);
    } else {
      setInternal(!internalExpanded);
    }
  };
}

WHEN TO USE WHICH:
├── Interview MVP → Uncontrolled (simple, fast to implement)
├── + expandAll/collapseAll → Controlled via Context
├── + URL deep linking → Controlled
├── + Persist state → Controlled + localStorage
├── Library/Design System → Hybrid (support both modes)

REACT CONVENTION:
<input value="x" onChange={fn} />  → Controlled
<input defaultValue="x" />         → Uncontrolled
Our FileObject follows same pattern.
```

---

### 27. Tại sao TypeScript Strict Types thay vì `any` hoặc Loose Types?

```tsx
// ❌ LOOSE:
interface FileData {
  id: any;
  name: any;
  children: any;
}

// ❌ TOO BROAD:
interface FileData {
  id: string | number;
  name: string;
  children: FileData[] | null | undefined;
}

// ✅ OUR APPROACH — Strict + Readonly:
interface FileData {
  readonly id: number;
  readonly name: string;
  readonly children?: ReadonlyArray<FileData>;
}
```

**Phân tích từng quyết định:**

```
1. `readonly id: number` thay vì `id: any`:
   → any: TypeScript compiler KHÔNG check gì cả
   → number: compiler bắt lỗi nếu pass string id
   → readonly: ngăn mutation (file.id = 999 → compile error)

2. `readonly name: string` thay vì `name: any`:
   → Autocompletion works: file.name.toUpperCase() ✅
   → Error caught: file.name.filter() → TS error ✅
   → string method typings available

3. `children?: ReadonlyArray<FileData>` thay vì `children: any`:
   → Optional (?) → children có thể NOT PRESENT (file)
   → ReadonlyArray → không thể push(), pop(), sort()
   → FileData → recursive type (children cùng shape)
   → Compiler PREVENTS: file.children.sort() (mutation!)

TYPE NARROWING BENEFIT:
const isDirectory = Boolean(file.children);
if (file.children) {
  // TypeScript KNOWS: file.children is ReadonlyArray<FileData>
  // Not undefined anymore! → safe to map, filter, etc.
  file.children.map(child => ...)  // ✅ No error
}

// Without types:
file.children.map(...)  // Runtime error: Cannot read property 'map' of undefined

WHY NOT UNION: `children: FileData[] | null | undefined`?
├── null vs undefined = 2 different "empty" states
├── Need to check BOTH: if (children !== null && children !== undefined)
├── Optional (?) = ONE check: if (children)
├── Rule: Use ONE "absence" representation

INTERVIEW:
"I use strict readonly types to make illegal states
 unrepresentable. The compiler catches bugs that
 would otherwise fail silently at runtime."
```

---

### 28. Tại sao Recursive Component thay vì Iterative (Stack-based)?

```tsx
// OUR APPROACH: Recursive
function FileList({ fileList, level }: Props) {
  return (
    <ul>
      {sortItems(fileList).map((file) => (
        <FileObject key={file.id} file={file} level={level} />
        // FileObject renders FileList again → RECURSION
      ))}
    </ul>
  );
}

// ALTERNATIVE: Iterative with explicit stack
function FileTreeIterative({ data }: Props) {
  const flatNodes = useMemo(() => {
    const result: FlatNode[] = [];
    const stack: Array<{ node: FileData; depth: number }> = [];

    // Push root items in reverse (stack is LIFO)
    for (let i = data.length - 1; i >= 0; i--) {
      stack.push({ node: data[i], depth: 0 });
    }

    while (stack.length > 0) {
      const { node, depth } = stack.pop()!;
      result.push({ node, depth });

      if (expandedIds.has(node.id) && node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({ node: node.children[i], depth: depth + 1 });
        }
      }
    }
    return result;
  }, [data, expandedIds]);

  // Render flat list with CSS indentation
  return flatNodes.map(({ node, depth }) => (
    <div style={{ paddingLeft: depth * 20 }}>{node.name}</div>
  ));
}
```

**So sánh:**

```
┌────────────────────┬───────────────────────────┬───────────────────────────┐
│ Criteria           │ Recursive Components      │ Iterative (stack-based)   │
├────────────────────┼───────────────────────────┼───────────────────────────┤
│ Code readability   │ ✅ Đọc tự nhiên           │ ❌ Stack logic phức tạp   │
│ React patterns     │ ✅ Idiomatic React         │ ❌ Phá vỡ component model│
│ Component state    │ ✅ Mỗi node có state riêng│ ❌ Global state required  │
│ Testability        │ ✅ Test per component      │ ❌ Test whole tree logic  │
│ Stack overflow     │ ⚠️ Depth > 500 (rare)     │ ✅ No call stack limit   │
│ Performance        │ 🟡 N components mounted   │ ✅ 1 component, N divs   │
│ Virtualization     │ ❌ Hard to add             │ ✅ Natural (flat list)   │
│ Animation          │ ✅ Per-component lifecycle  │ ❌ Hard (no mount/unmount)│
│ DevTools inspect   │ ✅ Component tree visible  │ ❌ Flat div soup         │
└────────────────────┴───────────────────────────┴───────────────────────────┘

WHY RECURSIVE WINS FOR INTERVIEW:
1. "Recursive component" IS the concept being tested
2. Shows understanding of React's declarative model
3. Each component encapsulates its own behavior
4. Natural for tree structures (tree = recursive data structure)
5. React's reconciler handles the recursion efficiently

WHEN ITERATIVE WINS:
1. Need virtualization (react-window needs flat list)
2. Tree depth > 500 levels (stack overflow risk)
3. Performance-critical: 100K+ nodes
4. Need global operations: "expand all matching search"

STACK OVERFLOW REALITY:
├── JavaScript call stack ≈ 10,000 - 25,000 frames
├── React adds ~3-5 frames per component
├── Practical limit: ~3,000-5,000 depth levels
├── Real file systems: rarely > 20 levels deep
└── Stack overflow in File Explorer = theoretical, not practical

INTERVIEW ANSWER:
"I use recursive components because it's the natural React
 pattern for tree data. Each node manages its own state
 independently. For production with 100K+ items, I'd switch
 to a flattened virtual list approach."
```

---

### 29. Tại sao `<ul>/<li>` thay vì `<div>` cho Tree Structure?

```tsx
// ✅ OUR APPROACH: Semantic HTML
<ul role="tree">
  <li role="treeitem">Documents/
    <ul role="group">
      <li role="treeitem">Word.doc</li>
    </ul>
  </li>
</ul>

// ❌ DIV SOUP:
<div class="tree">
  <div class="item">Documents/
    <div class="children">
      <div class="item">Word.doc</div>
    </div>
  </div>
</div>
```

**5 lý do chọn Semantic HTML:**

```
1. ACCESSIBILITY (WCAG 2.1):
   Screen readers understand <ul>/<li> as LIST
   → "List, 3 items" announced automatically
   → <div> needs manual aria-role to achieve same
   → Less ARIA = less bug surface

2. BROWSER DEFAULT BEHAVIORS:
   <ul> provides:
   • Default indentation (browser stylesheet)
   • List-style bullets (we remove with CSS, but useful for print)
   • Keyboard navigation baseline
   <div> provides: nothing

3. SEO & CRAWLERS:
   Search engines understand lists
   → File/directory structure indexable
   → <div> gives no structural meaning to crawlers

4. CSS ADVANTAGE:
   ul > li selector → target direct children
   li + li → target siblings with gap
   li:first-child, li:last-child → natural selectors
   div.item + div.item → works but less semantic

5. DEVELOPER COMMUNICATION:
   <ul>/<li> = "this is a list" → self-documenting
   <div class="list"><div class="item"> = ambiguous
   New team member reads code → immediately understands structure

COUNTER-ARGUMENT:
"But <ul> has default padding and bullets!"
→ CSS reset: ul { list-style: none; padding: 0; margin: 0; }
→ 1 line of CSS to fix, vs losing all semantic benefits

WHEN <div> IS ACCEPTABLE:
├── Virtual list (react-window renders divs, not list items)
├── Grid layout (CSS Grid doesn't work well with ul/li)
├── When ARIA roles are manually added anyway
└── Custom layout not suited for list semantics
```

---

### 30. Tại sao Default Collapsed thay vì Default Expanded?

```tsx
// OUR CHOICE: Start collapsed
const [expanded, setExpanded] = useState(false);

// ALTERNATIVE: Start expanded
const [expanded, setExpanded] = useState(true);
```

**Phân tích UX + Performance:**

```
DEFAULT COLLAPSED — Tại sao?

1. PERFORMANCE:
   Tree với 10K nodes:
   ├── Default collapsed → mount ~20 root items → 2ms
   └── Default expanded → mount ALL 10K items → 500ms+
   First paint: collapsed wins by 100x

2. USER EXPERIENCE:
   ├── User mở File Explorer → thấy overview (top-level)
   ├── User decide: "tôi cần folder nào?" → expand chỉ folder đó
   ├── Progressive disclosure → không overwhelm user
   └── Matches EVERY file manager: VS Code, Finder, Explorer

3. INFORMATION ARCHITECTURE:
   ├── Root level = most important categories
   ├── Details inside = on-demand
   ├── Like a newspaper: headline first, details on click
   └── Collapsed = user controls what to see

4. NETWORK PERFORMANCE:
   ├── Lazy loading possible: fetch children on expand
   ├── Default expanded → need ALL data upfront
   ├── Default collapsed → only need root data initially
   └── Faster initial load

WHEN DEFAULT EXPANDED MAKES SENSE:
├── Shallow tree (< 2 levels) → expand all is fine
├── Breadcrumb navigation → expand to current file
├── Search results → show matching paths expanded
├── Settings/Config tree → usually all expanded

HYBRID — "Remember Last State":
const [expanded, setExpanded] = useState(() => {
  const saved = localStorage.getItem(`expand-${file.id}`);
  return saved === 'true';
});
// User's previous state restored on page load
```

---

### 31. Tại sao Sort ở Render Time (FileList) thay vì Data Layer?

```tsx
// OUR APPROACH: Sort in FileList component (render time)
function FileList({ fileList }: Props) {
  const sorted = sortItems(fileList); // Sort during render
  return <ul>{sorted.map(...)}</ul>;
}

// ALTERNATIVE: Sort at data layer (before passing to component)
const sortedData = deepSortTree(rawData); // Sort entire tree upfront
<FileExplorer data={sortedData} />
```

**Trade-off Analysis:**

```
SORT AT RENDER (Component Level):
✅ Component controls its own presentation
✅ Sort criteria can be component state (name, size, date)
✅ Only sorts VISIBLE items (collapsed dirs not sorted)
✅ Easy to change sort order without touching data
✅ Raw data remains unsorted (single source of truth)
❌ Sort runs every render (mitigated with useMemo)
❌ Sort logic in UI layer (some consider this wrong)

SORT AT DATA LAYER:
✅ Data always sorted → consistent everywhere
✅ Sort once → reuse everywhere
✅ Separation: data concerns in data layer
❌ Must deep-sort entire tree (even collapsed parts)
❌ Changing sort order → re-sort entire tree
❌ Multiple views with different sorts → multiple copies
❌ Tight coupling: data structure must match UI needs

WHY RENDER TIME IS BETTER FOR FILE EXPLORER:

1. SORT IS PRESENTATION LOGIC:
   "Directories first, alphabetical" = how data is DISPLAYED
   Not how data IS structured
   → Belongs in presentation layer (component)

2. MULTIPLE SORT OPTIONS:
   User wants: "Sort by name" / "Sort by size" / "Sort by date"
   Sort at data: re-sort entire tree on every change
   Sort at render: change sort function, React re-renders only visible

3. PERFORMANCE:
   100 root items, 10K total:
   Sort at data: sort ALL 10K items → 10ms
   Sort at render: sort 100 root items → 0.1ms
   (Collapsed children never sorted!)

4. USEMEMO ELIMINATES THE COST:
   const sorted = useMemo(() => sortItems(fileList), [fileList]);
   → Sort only when data changes, not on every render
   → Best of both: render-time flexibility + data-layer performance

INTERVIEW:
"Sorting is presentation logic — it defines how data
 is displayed, not what the data is. By sorting at the
 component level with useMemo, I get lazy sorting
 (only visible items) and easy sort-order switching."
```

---

### 32. Tại sao KHÔNG dùng Redux/Zustand trong MVP?

```tsx
// MVP: Local state only
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false); // LOCAL
}

// Alternative: Global state
// Redux
const FileObject = ({ file }) => {
  const expanded = useSelector((state) => state.tree.expandedIds.has(file.id));
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(toggleExpand(file.id))} />;
};

// Zustand
const useTreeStore = create((set) => ({
  expandedIds: new Set(),
  toggle: (id) =>
    set((state) => {
      /* ... */
    }),
}));
```

**Phân tích:**

```
STATE COMPLEXITY SPECTRUM:
┌────────────────────────────────────────────────────────────────┐
│ useState   →   useReducer   →   Context   →   Zustand/Redux  │
│ Simple         Medium            Moderate       Complex        │
│                                                                │
│ File Explorer MVP: ←── HERE (useState is sufficient)          │
│ File Explorer + DnD + Search: ────────── HERE ──→             │
│ Full IDE (VS Code): ──────────────────────────── HERE ──→     │
└────────────────────────────────────────────────────────────────┘

WHY useState IS ENOUGH:
1. Expand state is LOCAL (each node manages itself)
2. No cross-component communication needed
3. No server sync needed
4. No state persistence needed
5. No undo/redo needed

WHEN TO UPGRADE:
├── + Search → Context (share searchQuery)
├── + Select file → Context (share selectedId)
├── + DnD → useReducer + Context (complex state transitions)
├── + Multi-tab tree → Zustand (shared state across UI views)
├── + Undo/Redo → Redux (action history middleware)
└── + Server sync → TanStack Query (async state)

OVERHEAD OF PRE-MATURE GLOBAL STATE:
Redux setup:
  1. Store configuration
  2. Slice definition (actions, reducers)
  3. Selectors
  4. Provider wrapping
  5. dispatch in components
  → 5 files, ~200 lines BEFORE writing any feature code!

useState:
  const [expanded, setExpanded] = useState(false);
  → 1 line. Done.

COST/BENEFIT:
├── Redux for File Explorer MVP: 200 lines setup, 0 unique benefit
├── useState for File Explorer MVP: 1 line, works perfectly
└── Ratio: 200:1 code for 0:0 additional capability

INTERVIEW:
"I start with the simplest state solution that works.
 useState handles expand/collapse perfectly because
 each node's state is independent. I'd introduce
 Context or Zustand only when I need cross-component
 coordination like search or drag-and-drop."
```

---

### 33. Tại sao `children?:` (Optional) thay vì `children: | undefined`?

```tsx
// OUR APPROACH: Optional property
interface FileData {
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>; // Property may NOT EXIST
}

// ALTERNATIVE: Explicit undefined
interface FileData {
  id: number;
  name: string;
  children: ReadonlyArray<FileData> | undefined; // Property EXISTS but undefined
}
```

**Sự khác biệt tinh tế nhưng quan trọng:**

```
OPTIONAL (children?):
const file: FileData = { id: 1, name: "readme.txt" };
// ✅ Valid! children property does not exist
// "children" in file → false
// file.children → undefined
// Object.keys(file) → ["id", "name"]

EXPLICIT UNDEFINED (children: ... | undefined):
const file: FileData = { id: 1, name: "readme.txt" };
// ❌ TypeScript ERROR! children must be provided
const file: FileData = { id: 1, name: "readme.txt", children: undefined };
// ✅ Valid, but must explicitly set undefined
// "children" in file → true
// file.children → undefined
// Object.keys(file) → ["id", "name", "children"]

WHY OPTIONAL IS BETTER FOR FILE EXPLORER:

1. API DATA:
   // API typically omits field rather than sending null/undefined
   { "id": 1, "name": "readme.txt" }           // File: no children key
   { "id": 2, "name": "docs", "children": [] }  // Dir: has children key
   → Optional matches API reality

2. OBJECT CREATION:
   // Creating file: don't need to think about children
   const newFile: FileData = { id: 3, name: "test.txt" };
   // vs having to write:
   const newFile: FileData = { id: 3, name: "test.txt", children: undefined };
   → Less boilerplate

3. SERIALIZATION:
   JSON.stringify({ id: 1, name: "a.txt" })
   → '{"id":1,"name":"a.txt"}'  // Clean JSON, no "children":null

   JSON.stringify({ id: 1, name: "a.txt", children: undefined })
   → '{"id":1,"name":"a.txt"}'  // undefined is stripped anyway!
   → But explicit undefined in interface misleads developers

4. TYPE NARROWING — Both work the same:
   if (file.children) {
     // TypeScript: file.children is ReadonlyArray<FileData>
     // Works for BOTH optional and explicit undefined
   }

EDGE CASE — exactOptionalPropertyTypes (TS 4.4+):
// With this strict flag enabled:
// children?: ReadonlyArray<FileData>
// → children can be MISSING or ReadonlyArray
// → children CANNOT be explicitly set to undefined!
// This is the SAFEST behavior
```

---

### 34. Tại sao File Explorer là "Pure" Component Pattern?

```tsx
// "PURE" — Output depends ONLY on props
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = Boolean(file.children);

  // Given same file + level + expanded state:
  // → ALWAYS renders same output
  // → No side effects (no API calls, no DOM manipulation)
  // → No external state dependency (no global, no context)
}
```

**Tại sao "Pure" quan trọng:**

```
DEFINITION:
Pure Component = Output depends only on (props + internal state)
No side effects during render.

FILE EXPLORER COMPONENTS — PURITY ANALYSIS:
┌─────────────────┬────────┬─────────────────────────────────────┐
│ Component       │ Pure?  │ Why?                                │
├─────────────────┼────────┼─────────────────────────────────────┤
│ FileExplorer    │ ✅ Yes │ Renders FileList from props         │
│ FileList        │ ✅ Yes │ Sorts + maps from props             │
│ FileObject      │ ✅ Yes │ Renders from props + local state    │
│ sortItems()     │ ✅ Yes │ Pure function: input → new array    │
└─────────────────┴────────┴─────────────────────────────────────┘

BENEFITS OF PURITY:
1. PREDICTABLE: Same input → same output → easy to reason about
2. TESTABLE: No mocks needed for external dependencies
3. CONCURRENT-SAFE: React 18 can interrupt/restart render safely
4. MEMOIZABLE: React.memo works because referential equality is meaningful
5. DEBUGGABLE: Reproduce any bug by providing same props

WHAT BREAKS PURITY (Anti-patterns):
❌ Reading from global: window.innerWidth in render
❌ Side effects in render: fetch() during render
❌ Random values: Math.random() in render
❌ Date-dependent: new Date() in render
❌ Mutating props: props.data.sort() (mutates input!)

OUR SORT IS PURE:
function sortItems(items: ReadonlyArray<FileData>): FileData[] {
  // ReadonlyArray → can't mutate input
  const dirs = items.filter(...);  // NEW array
  const files = items.filter(...); // NEW array
  dirs.sort(...);  // Sort the NEW array (ok!)
  return [...dirs, ...files];  // NEW array returned
}
// Input unchanged, output is new array → PURE ✅

INTERVIEW:
"All three components are pure — their output depends
 only on props and local state, with no side effects
 during render. This makes them predictable, testable,
 and compatible with React 18's concurrent rendering."
```

---

### 35. Tại sao Separation: Data Shape vs UI Concerns?

```tsx
// DATA SHAPE (types.ts):
interface FileData {
  id: number;
  name: string;
  children?: ReadonlyArray<FileData>;
}
// → ONLY what the data IS
// → No UI concerns: no isExpanded, no icon, no color

// UI CONCERNS (components):
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false); // UI state
  const isDirectory = Boolean(file.children); // Derived
  const icon = isDirectory ? "📁" : "📄"; // UI mapping
  const fontWeight = isDirectory ? "bold" : "normal"; // UI styling
}
```

**Tại sao không mix data + UI:**

```
❌ ANTI-PATTERN: UI state in data
interface FileData {
  id: number;
  name: string;
  children?: FileData[];
  isExpanded: boolean;    // ← UI state in DATA!
  icon: string;           // ← UI concern in DATA!
  className: string;      // ← CSS in DATA!
}

PROBLEMS:
1. MULTIPLE VIEWS:
   Same data, different views:
   - List view: no expand/collapse
   - Tree view: has expand/collapse
   - Grid view: no expand/icon
   → isExpanded chỉ relevant cho tree view!
   → Mỗi view phải set isExpanded = false → waste

2. SERVER SYNC:
   Send data to API:
   → { id: 1, name: "file", isExpanded: true } sent to server!
   → Server doesn't care about UI state
   → Extra bandwidth, potential data corruption

3. STATE MANAGEMENT:
   Toggle expand → need to update data object
   → Deep clone + update nested object
   → vs. Set.add(id) / Set.delete(id) → O(1)

4. SINGLE RESPONSIBILITY:
   FileData describes WHAT the data IS
   Component decides HOW to display it
   Mixing = coupling data to specific UI implementation

CORRECT PATTERN:
┌──────────────────┐     ┌──────────────────┐
│ DATA LAYER        │     │ UI LAYER          │
│                    │     │                    │
│ FileData {         │     │ Component State:   │
│   id               │     │   expanded: bool   │
│   name             │     │   selected: bool   │
│   children?        │     │   focused: bool    │
│ }                  │     │                    │
│                    │     │ Derived:           │
│ (What IS it?)      │     │   isDir, icon,     │
│                    │     │   indent, color    │
│                    │     │                    │
│                    │     │ (How to SHOW it?)  │
└──────────────────┘     └──────────────────┘

Rule: Data shape should survive UI redesign.
If you change from tree to grid view,
FileData should NOT need to change.
```

---

### 36. Tại sao Testing Strategy: Integration over Unit?

```tsx
// UNIT TEST approach:
test("sortItems sorts directories first", () => {
  const input = [file, dir];
  expect(sortItems(input)).toEqual([dir, file]);
});

// INTEGRATION TEST approach:
test("expanded directory shows sorted children", async () => {
  render(<FileExplorer data={mockData} />);
  await userEvent.click(screen.getByText("Documents"));
  const items = screen.getAllByRole("treeitem");
  expect(items[1]).toHaveTextContent("Subfolder"); // dir first
  expect(items[2]).toHaveTextContent("file.txt"); // file second
});
```

**Testing philosophy cho File Explorer:**

```
TESTING PYRAMID FOR FILE EXPLORER:
                    ┌────────┐
                    │  E2E   │  → Browser tests (Playwright)
                   ┌┴────────┴┐   "User opens tree, navigates"
                   │Integration│  → RTL tests
                  ┌┴──────────┴┐   "Expand dir, verify children order"
                  │    Unit     │  → Jest tests
                  └────────────┘   "Sort function, type checks"

DISTRIBUTION:
├── Unit tests: 30% (sort function, type helpers)
├── Integration tests: 60% (component rendering + interaction)
└── E2E tests: 10% (full user flows)

WHY INTEGRATION > UNIT FOR COMPONENTS:

1. UNIT TESTS MISS INTEGRATION BUGS:
   sortItems() works ✅
   FileList renders ✅
   BUT: FileList doesn't pass sorted data to FileObject → BUG!
   Integration test catches this. Unit tests don't.

2. REFACTORING CONFIDENCE:
   Refactor FileList + FileObject into single component:
   → ALL unit tests break (testing internal structure)
   → Integration tests STILL PASS (testing behavior)
   → Integration tests = refactoring-proof

3. USER PERSPECTIVE:
   User doesn't care about sortItems() function
   User cares: "When I click Documents, do I see files sorted?"
   Integration tests mirror user behavior

4. TESTING LIBRARY PHILOSOPHY:
   "The more your tests resemble the way your software is used,
    the more confidence they can give you." — Kent C. Dodds

   Integration = tests resemble user interaction
   Unit = tests resemble implementation detail

WHAT TO UNIT TEST (still important):
├── Pure functions: sortItems, isDirectory, getFileExtension
├── Complex algorithms: flattenTree, searchTree, filterTree
├── Edge cases: empty arrays, null, circular refs
└── Utility hooks: useToggle, useTypeAhead

WHAT TO INTEGRATION TEST:
├── "Click folder → children appear"
├── "Directories appear before files"
├── "Nested folders expand independently"
├── "Empty folder shows expandable but no children"
└── "Collapse → children disappear"
```

---

### 37. Tại sao Component Composition thay vì Inheritance?

```tsx
// ❌ INHERITANCE (OOP pattern):
class BaseTreeItem extends React.Component { ... }
class DirectoryItem extends BaseTreeItem { ... }
class FileItem extends BaseTreeItem { ... }

// ✅ COMPOSITION (React pattern):
function FileObject({ file, level }: Props) {
  const isDirectory = Boolean(file.children);

  return (
    <li>
      <button>
        {isDirectory && <ExpandIcon expanded={expanded} />}
        <FileIcon isDirectory={isDirectory} name={file.name} />
        <span>{file.name}</span>
      </button>
      {expanded && file.children && (
        <FileList fileList={file.children} level={level + 1} />
      )}
    </li>
  );
}
```

**Tại sao React ưu tiên Composition:**

```
INHERITANCE PROBLEMS:
1. DIAMOND PROBLEM:
   TreeItem extends Expandable, Selectable, Draggable
   → Multiple inheritance not supported in JS
   → Must chain: Draggable extends Selectable extends Expandable
   → Tight coupling, brittle hierarchy

2. GORILLA-BANANA PROBLEM:
   "You wanted a banana but you got a gorilla
    holding the banana and the entire jungle."
   → Inherit BaseTreeItem → get ALL its methods + state
   → Even ones you don't want for FileItem

3. MODIFICATION DIFFICULTY:
   Change BaseTreeItem → affects ALL subclasses
   → "Shotgun surgery" anti-pattern

COMPOSITION BENEFITS:
1. PICK AND CHOOSE:
   <FileObject>
     <ExpandIcon />     // Only for directories
     <FileIcon />       // Always
     <DragHandle />     // Only if DnD enabled
     <ContextTrigger /> // Only if context menu enabled
   </FileObject>
   → Each piece is independent, optional

2. HOOKS = COMPOSITION FOR LOGIC:
   function FileObject({ file }: Props) {
     const { expanded, toggle } = useToggle(false);     // Expand logic
     const { isDragging } = useDrag(file);               // Drag logic
     const { menu, showMenu } = useContextMenu();        // Menu logic
     const { isSelected, select } = useSelection(file);  // Select logic

     // Compose behavior without inheritance!
   }

3. REACT OFFICIAL RECOMMENDATION:
   "At Facebook, we use React in thousands of components,
    and we haven't found any use cases where we would
    recommend creating component inheritance hierarchies."
   — React Docs

COMPOSITION PATTERNS IN FILE EXPLORER:
├── Component Composition: FileObject renders FileList + children
├── Hook Composition: useToggle + useDrag + useContextMenu
├── Render Props: renderIcon={(file) => <CustomIcon />}
├── Children Props: <FileExplorer>{customHeader}</FileExplorer>
└── Higher-Order: withSelection(FileObject) (less common now)
```

---

### 38. Tại sao File Explorer Maps to Real Design Patterns?

```
FILE EXPLORER → DESIGN PATTERNS MAPPING:
┌──────────────────────┬────────────────────────────────────────┐
│ Design Pattern        │ Where in File Explorer?                │
├──────────────────────┼────────────────────────────────────────┤
│ Composite             │ FileData type (tree = nodes + leaves) │
│ Observer              │ useState + React re-render system     │
│ Strategy              │ sortItems function (swappable sort)   │
│ Iterator              │ .map() over children array            │
│ Facade                │ FileExplorer wraps complex tree logic │
│ Decorator             │ React.memo wraps component            │
│ Command               │ dispatch({ type: 'TOGGLE' })          │
│ State                 │ expanded state → different render      │
│ Template Method       │ renderIcon/renderLabel props           │
│ Mediator              │ Context API for cross-component comm   │
│ Flyweight             │ Shared sort function across all nodes  │
│ Visitor               │ Tree traversal (search, filter)        │
└──────────────────────┴────────────────────────────────────────┘
```

**Deep dive — Top 4 patterns:**

```
1. COMPOSITE PATTERN (Core Architecture):
   interface FileData {
     children?: ReadonlyArray<FileData>;  // ← Self-referencing!
   }

   Tree = Composite of nodes
   Each node can be:
   ├── Leaf (file): no children
   └── Composite (directory): has children (which are also nodes)

   WHY IT MATTERS:
   "Same interface for single item AND group of items"
   → FileObject renders BOTH files and directories
   → Recursive rendering is natural: child is same type as parent

2. STRATEGY PATTERN (Sort Algorithm):
   // Default strategy
   const defaultSort = (a, b) => a.name.localeCompare(b.name);

   // Alternative strategies
   const sizeSort = (a, b) => a.size - b.size;
   const dateSort = (a, b) => a.modified - b.modified;

   // Strategy is SWAPPABLE without changing component
   <FileExplorer data={data} sortComparator={sizeSort} />

   WHY IT MATTERS:
   "Define a family of algorithms, encapsulate each one,
    and make them interchangeable."

3. OBSERVER PATTERN (React's Re-render System):
   const [expanded, setExpanded] = useState(false);
   // setExpanded(true) → React "observes" state change
   // → Re-renders component → UI updates
   // → This IS the Observer pattern!

   Subject: State (expanded)
   Observer: Component (FileObject)
   Notify: setExpanded → React triggers re-render

4. STATE PATTERN (Conditional Rendering):
   // Component behaves DIFFERENTLY based on state
   if (expanded) {
     return <WithChildren />;   // State: Expanded
   } else {
     return <CollapsedView />;  // State: Collapsed
   }

   // Same component, different behavior based on state value
   // Classic State Pattern: object changes behavior when state changes

INTERVIEW VALUE:
"Knowing these patterns shows you think in abstractions,
 not just syntax. When interviewer asks 'how would you
 add sort by date?', you say: 'The sort function follows
 the Strategy pattern — I'd create a new comparator
 and pass it via props.' This shows DESIGN THINKING."
```

---

## PHẦN C: COMMON MISTAKES & HOW TO FIX

> ⚠️ Các lỗi phổ biến khi implement File Explorer và cách khắc phục.

### Mistake 1: Mutating Props khi Sort

**❌ SAI — Sort trực tiếp trên props:**

```tsx
function FileList({ fileList }) {
  fileList.sort((a, b) => a.name.localeCompare(b.name)); // ❌ Mutates props!
  return (
    <ul>
      {fileList.map((file) => (
        <FileObject key={file.id} file={file} />
      ))}
    </ul>
  );
}
```

**Tại sao sai:**

```
1. ReadonlyArray → TypeScript sẽ báo lỗi
2. Mutate parent's data → unpredictable behavior
3. React expects props immutable → subtle bugs
4. Sort in-place → side effect in render → violates React rules
5. Different render calls may see data in different orders
```

**✅ ĐÚNG — Tạo array mới trước khi sort:**

```tsx
function FileList({ fileList }) {
  // .filter() tạo new array → safe to .sort()
  const directories = fileList.filter((item) => item.children);
  directories.sort((a, b) => a.name.localeCompare(b.name));

  const files = fileList.filter((item) => !item.children);
  files.sort((a, b) => a.name.localeCompare(b.name));

  const items = [...directories, ...files];
  // ...
}
```

**💬 Interviewer question: "Sort mutates?"**

> "Đúng, `.sort()` mutates in-place. Nhưng `.filter()` returns new array, nên sort trên filtered array là safe. Alternative: `[...fileList].sort()` hoặc `fileList.toSorted()` (ES2023)."

---

### Mistake 2: Quên Handle Empty Directories

**❌ SAI — Crash khi directory rỗng:**

```tsx
{
  expanded && <FileList fileList={fileChildren} level={level + 1} />;
}
// Nếu fileChildren = undefined hoặc [] → có thể render empty <ul>
```

**✅ ĐÚNG — Guard với length check:**

```tsx
{
  fileChildren && fileChildren.length > 0 && expanded && (
    <FileList fileList={fileChildren} level={level + 1} />
  );
}
```

**Hoặc show empty state:**

```tsx
{
  fileChildren &&
    expanded &&
    (fileChildren.length > 0 ? (
      <FileList fileList={fileChildren} level={level + 1} />
    ) : (
      <p className="empty-message">Directory is empty</p>
    ));
}
```

---

### Mistake 3: Không xác định đúng File vs Directory

**❌ SAI — Check bằng children.length:**

```tsx
const isDirectory = file.children && file.children.length > 0;
// Empty directory (children: []) → treated as FILE! ❌
```

**✅ ĐÚNG — Check bằng children existence:**

```tsx
const isDirectory = Boolean(file.children);
// children: [] → true (IS directory, just empty)
// children: undefined → false (IS file)
```

**Tại sao quan trọng:**

```
Empty directory = vẫn là directory!
- Vẫn cần show folder icon
- Vẫn cần expandable (click to show "empty")
- Vẫn cần bold styling
- Chỉ khác: expand shows nothing
```

---

### Mistake 4: Sai Sort Order — Files trước Directories

**❌ SAI — Sort tất cả chung:**

```tsx
const items = [...fileList].sort((a, b) => a.name.localeCompare(b.name));
// Result: bar.txt, Documents/, Downloads/, foo.txt, README.md
// ❌ Files mixed with directories!
```

**✅ ĐÚNG — Directories first, then files:**

```tsx
const directories = fileList.filter((item) => item.children);
directories.sort((a, b) => a.name.localeCompare(b.name));

const files = fileList.filter((item) => !item.children);
files.sort((a, b) => a.name.localeCompare(b.name));

const items = [...directories, ...files];
// Result: Documents/, Downloads/, bar.txt, foo.txt, README.md ✅
```

**💬 Interview talking point:**

> "Real file explorers (VS Code, Finder, Windows Explorer) all show directories first. Users expect this convention. Nếu không sort, UX sẽ confusing."

---

### Mistake 5: Missing `key` Prop hoặc Dùng Index làm Key

**❌ SAI — Dùng index:**

```tsx
{
  items.map((file, index) => (
    <FileObject key={index} file={file} level={level} />
  ));
}
// After sort order changes → wrong component gets wrong data
```

**✅ ĐÚNG — Dùng unique id:**

```tsx
{
  items.map((file) => <FileObject key={file.id} file={file} level={level} />);
}
```

**Tại sao index key gây bug:**

```
Before sort: [README (0), Documents (1)]
After sort:  [Documents (0), README (1)]

With index key:
- React thinks key=0 is same component → keeps Documents' state for README
- Expanded state of Documents transfers to README! 💥

With id key:
- React tracks by id → correct component keeps correct state
```

---

### Mistake 6: Re-sort mỗi render không cần thiết

**❌ Performance issue:**

```tsx
function FileList({ fileList }) {
  // Runs on EVERY render — even if fileList hasn't changed
  const directories = fileList.filter((item) => item.children);
  directories.sort((a, b) => a.name.localeCompare(b.name));
  // ...
}
```

**✅ ĐÚNG — useMemo:**

```tsx
function FileList({ fileList }) {
  const items = useMemo(() => {
    const dirs = fileList.filter((item) => item.children);
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    const files = fileList.filter((item) => !item.children);
    files.sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }, [fileList]);

  return (
    <ul className="file-list">
      {items.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}
```

**💬 Interview talking point:**

> "Cho interview với small data, sort mỗi render acceptable. Production với 1000+ files, useMemo prevents unnecessary computation. Measure first — premature optimization is code complexity."

---

### Mistake 7: `<div>` thay vì `<button>` cho Interactive Elements

**❌ SAI — Div with onClick:**

```tsx
<div onClick={() => setExpanded(!expanded)}>📁 {fileName}</div>
```

**✅ ĐÚNG — Semantic button:**

```tsx
<button onClick={() => setExpanded(!expanded)}>
  📁 {fileName} [{expanded ? "-" : "+"}]
</button>
```

**Impact:**

```
<div onClick>:
- ❌ Not keyboard accessible (no Tab focus)
- ❌ Screen reader: "text" (not interactive)
- ❌ No Enter/Space key support
- ❌ WCAG Failure: 2.1.1 Keyboard

<button>:
- ✅ Tab focusable by default
- ✅ Screen reader: "button, Documents"
- ✅ Enter/Space triggers onClick automatically
- ✅ WCAG Compliant
```

---

### Mistake 8: Circular File References (Production Bug)

**❌ Data integrity issue:**

```typescript
// If API returns circular reference:
const folder: FileData = { id: 1, name: "Parent", children: [] };
folder.children!.push(folder); // Circular! 💥

// Recursive rendering → infinite loop → stack overflow
```

**✅ Guard with depth limit:**

```tsx
const MAX_DEPTH = 20;

function FileObject({ file, level }: Props) {
  if (level > MAX_DEPTH) {
    return <li className="file-item">⚠️ Max depth reached</li>;
  }
  // ... normal rendering
}
```

**✅ Guard with visited set:**

```tsx
function FileList({ fileList, level, visited = new Set<number>() }) {
  return (
    <ul>
      {items.map((file) => {
        if (visited.has(file.id)) return null; // Skip circular
        const newVisited = new Set(visited);
        newVisited.add(file.id);
        return (
          <FileObject
            key={file.id}
            file={file}
            level={level}
            visited={newVisited}
          />
        );
      })}
    </ul>
  );
}
```

---

### Mistake 9: Không Tách Sorting Logic ra Utility Function

**❌ SAI — Logic scattered:**

```tsx
function FileList({ fileList, level }) {
  const directories = fileList.filter((item) => item.children);
  directories.sort((a, b) => a.name.localeCompare(b.name));
  const files = fileList.filter((item) => !item.children);
  files.sort((a, b) => a.name.localeCompare(b.name));
  const items = [...directories, ...files];
  // ... render
}
```

**✅ ĐÚNG — Extract utility:**

```tsx
// utils.ts
export function sortFileItems(items: ReadonlyArray<FileData>): FileData[] {
  const directories = items.filter((item) => item.children);
  directories.sort((a, b) => a.name.localeCompare(b.name));

  const files = items.filter((item) => !item.children);
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...directories, ...files];
}

// FileList.tsx
function FileList({ fileList, level }) {
  const items = useMemo(() => sortFileItems(fileList), [fileList]);
  // ... render
}

// Benefits:
// 1. Testable independently: sortFileItems.test.ts
// 2. Reusable: other components can sort same way
// 3. FileList focused on rendering
```

---

### Mistake 10: CSS Indentation Không Scale

**❌ SAI — Fixed indentation per level:**

```tsx
<div style={{ paddingLeft: `${level * 16}px` }}>{fileName}</div>
// Problem: inline styles, not responsive, magic number
```

**✅ ĐÚNG — CSS nested `<ul>` indentation:**

```css
.file-list {
  padding-left: 16px; /* Each nested <ul> adds 16px */
}
```

```
Why CSS approach is better:
1. Automatic: each nested <FileList> inherits 16px padding
2. No calculation needed in component
3. CSS custom property for theming: padding-left: var(--indent, 16px)
4. Responsive: easy to change via media query
5. No inline styles: separation of concerns
```

---

### Mistake 11: Không Handle ARIA Accessibility cho Tree

**❌ SAI — No ARIA attributes:**

```tsx
<ul>
  <li>
    <button onClick={toggle}>{name}</button>
    {expanded && <ul>{children}</ul>}
  </li>
</ul>
```

**✅ ĐÚNG — Full ARIA tree pattern:**

```tsx
<ul role="tree" aria-label="File Explorer">
  <li role="treeitem" aria-expanded={isDirectory ? expanded : undefined}>
    <button
      aria-label={
        isDirectory
          ? `${expanded ? "Collapse" : "Expand"} ${fileName}`
          : fileName
      }
      onClick={toggle}
    >
      {fileName}
    </button>
    {expanded && fileChildren && <ul role="group">{/* children */}</ul>}
  </li>
</ul>
```

**ARIA attributes cho file explorer:**

| Attribute         | Where              | Purpose                     |
| ----------------- | ------------------ | --------------------------- |
| `role="tree"`     | Root `<ul>`        | Identifies tree widget      |
| `role="treeitem"` | Each `<li>`        | Identifies tree node        |
| `role="group"`    | Nested `<ul>`      | Groups children of treeitem |
| `aria-expanded`   | Directory `<li>`   | Expanded/collapsed state    |
| `aria-label`      | Interactive button | Screen reader text          |

---

### Mistake 12: `useState(false)` Default Với URL State

**❌ Problem — Expanded state lost on navigation:**

```tsx
// User expands several directories, navigates away, comes back
// All directories collapsed again! Poor UX.
```

**✅ Fix — URL-synced expanded state (if needed):**

```tsx
function FileExplorer({ data }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const expandedIds = useMemo(() => {
    const param = searchParams.get("expanded");
    return param ? new Set(param.split(",").map(Number)) : new Set<number>();
  }, [searchParams]);

  const toggleExpand = (id: number) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSearchParams({ expanded: Array.from(next).join(",") });
  };

  // Pass expandedIds + toggleExpand down via context or props
}
```

**💬 Interview talking point:**

> "Default useState(false) là fine cho interview. Production: cần decide nếu expanded state persists across navigation. URL state = shareable + back button works. localStorage = persists across sessions."

---

### Mistake 13: Stale Closure trong Event Handlers

**❌ SAI — Stale state reference:**

```tsx
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);

  // ❌ useCallback with empty deps → stale `expanded`
  const handleClick = useCallback(() => {
    console.log("Current:", expanded); // ALWAYS false!
    setExpanded(!expanded); // Toggle based on STALE value!
  }, []); // ← Empty deps! expanded captured at mount time

  return <button onClick={handleClick}>{file.name}</button>;
}
```

**Hậu quả:**

```
Click 1: expanded = false → setExpanded(!false) = true → Works ✅
Click 2: expanded STILL false (stale!) → setExpanded(!false) = true
Click 3: expanded STILL false → setExpanded(true)
→ Component chỉ expand ĐƯỢC, không bao giờ collapse!
→ Bug rất khó debug vì không có error, chỉ wrong behavior
```

**✅ ĐÚNG — 3 cách fix:**

```tsx
// FIX 1: Functional update (BEST for toggle)
const handleClick = useCallback(() => {
  setExpanded((prev) => !prev); // Always uses latest value
}, []); // Empty deps OK because we don't read `expanded`

// FIX 2: Include in deps (nếu cần read state)
const handleClick = useCallback(() => {
  console.log("Current:", expanded); // Now correct
  setExpanded(!expanded);
}, [expanded]); // ← Re-create when expanded changes

// FIX 3: Don't use useCallback at all (MVP)
const handleClick = () => {
  setExpanded(!expanded); // Always fresh closure
};
// Re-created every render, but that's fine for native elements
```

**Quy tắc:**

```
STALE CLOSURE CHECKLIST:
├── useCallback with [] → any state read inside is FROZEN
├── useEffect with [] → any state read inside is from MOUNT
├── setTimeout/setInterval → captures state at creation time
├── Promise .then() → captures state when Promise created
└── Event listener (addEventListener) → captures state at bind time

FIX STRATEGY:
├── Toggle pattern → functional update: setState(prev => !prev)
├── Need latest value → include in deps: [value]
├── Complex logic → useRef to hold latest value
└── MVP → skip useCallback entirely (no stale risk)
```

**💬 Interview talking point:**

> "Stale closures are the #1 hooks bug. For toggles, I always use functional updates `setState(prev => !prev)` — this eliminates the need to track the current value in the dependency array."

---

### Mistake 14: Memory Leak với Event Listeners

**❌ SAI — Không cleanup event listener:**

```tsx
function FileExplorer({ data }: Props) {
  useEffect(() => {
    // Add keyboard handler for navigation
    document.addEventListener("keydown", handleKeyDown);

    // ❌ No cleanup! Listener stays after unmount!
  }, []);

  // ❌ Also: window.addEventListener without cleanup
  useEffect(() => {
    window.addEventListener("resize", handleResize);
  }, []);
}
```

**Hậu quả:**

```
Mount FileExplorer    → 1 keydown listener added
Navigate away         → Component unmounts, listener STAYS
Navigate back         → Mount again → 2nd listener added
Repeat 10 times       → 10 listeners firing on every keydown!

SYMPTOMS:
├── Performance degradation over time
├── Multiple handlers fire for single event
├── State updates on unmounted component → React warning
├── Memory consumption grows linearly with navigation
└── Eventually: browser becomes sluggish
```

**✅ ĐÚNG — Always return cleanup:**

```tsx
function FileExplorer({ data }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ... handle keyboard navigation
    };

    document.addEventListener("keydown", handleKeyDown);

    // ✅ CLEANUP: Remove listener on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ✅ Resize listener with cleanup
  useEffect(() => {
    const handleResize = () => {
      /* ... */
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
}
```

**Full checklist — nguồn memory leak phổ biến:**

```
CLEANUP REQUIRED FOR:
├── addEventListener → removeEventListener
├── setInterval → clearInterval
├── setTimeout → clearTimeout
├── WebSocket.open → WebSocket.close
├── IntersectionObserver → observer.disconnect()
├── MutationObserver → observer.disconnect()
├── ResizeObserver → observer.disconnect()
├── Subscription (RxJS) → subscription.unsubscribe()
└── AbortController → controller.abort()

PATTERN:
useEffect(() => {
  // Setup
  const resource = createResource();

  // Cleanup (ALWAYS return this!)
  return () => {
    resource.destroy();
  };
}, [deps]);
```

---

### Mistake 15: Inline Object/Array Creation trong JSX

**❌ SAI — New object reference every render:**

```tsx
function FileObject({ file }: Props) {
  return (
    <div
      // ❌ New object EVERY render!
      style={{ paddingLeft: level * 20, cursor: "pointer" }}
      // ❌ New array EVERY render passed to child!
      data-path={[file.name]}
    >
      <FileIcon
        // ❌ New object as prop → child re-renders even with React.memo!
        config={{ size: 16, color: "#666" }}
      />
      {file.name}
    </div>
  );
}
```

**Tại sao đây là vấn đề:**

```
EVERY RENDER:
{ paddingLeft: 40, cursor: 'pointer' } ← NEW object (new reference)

Object.is(prevStyle, nextStyle) → false (different references!)
Even though VALUES are identical!

IMPACT:
├── Native elements (div, span): Minimal (React checks attributes)
├── Memoized children: BREAKS React.memo! (reference changed)
├── Context value: ALL consumers re-render! (huge impact)
└── useEffect deps: Effect runs every render! (infinite loop risk)
```

**✅ ĐÚNG — Cách fix tùy scenario:**

```tsx
// FIX 1: Extract constant (static objects)
const ICON_CONFIG = { size: 16, color: "#666" } as const;
const POINTER_STYLE = { cursor: "pointer" } as const;

function FileObject({ file, level }: Props) {
  // FIX 2: useMemo for dynamic objects
  const style = useMemo(
    () => ({ paddingLeft: level * 20, cursor: "pointer" }),
    [level], // Only re-create when level changes
  );

  return (
    <div style={style}>
      <FileIcon config={ICON_CONFIG} /> {/* Static → no re-create */}
      {file.name}
    </div>
  );
}

// FIX 3: CSS classes instead of inline styles (BEST)
// .file-item { cursor: pointer; }
// .file-item[data-level="1"] { padding-left: 20px; }
// → ZERO runtime cost, no reference issues
```

**Decision matrix:**

```
┌───────────────────────┬───────────────────────────────────────┐
│ Scenario              │ Fix                                   │
├───────────────────────┼───────────────────────────────────────┤
│ Static config         │ Module-level const                    │
│ Dynamic, few deps     │ useMemo([dep1, dep2])                 │
│ Passed to memo child  │ useMemo (REQUIRED)                    │
│ Style object          │ CSS class (preferred) or useMemo      │
│ Event handler object  │ useCallback                           │
│ Context value         │ useMemo (CRITICAL)                    │
│ Native element only   │ Inline OK (React handles efficiently) │
└───────────────────────┴───────────────────────────────────────┘
```

---

### Mistake 16: Over-Abstracting Prematurely

**❌ SAI — Abstraction quá sớm:**

```tsx
// Chỉ có 1 chỗ dùng FileExplorer, nhưng tạo:
// hooks/useFileTree.ts
// hooks/useFileSort.ts
// hooks/useFileToggle.ts
// hooks/useFileSearch.ts
// hooks/useFileSelection.ts
// providers/FileTreeProvider.tsx
// contexts/FileTreeContext.ts
// utils/treeHelpers.ts
// utils/sortStrategies.ts
// types/fileTree.types.ts
// constants/fileTree.constants.ts
// → 11 files trước khi viết xong 1 feature!

// Result:
// - Import chain: Component → Hook → Context → Provider → Utils
// - Mỗi change: touch 5+ files
// - Debugging: jump between 11 files
// - New developer: "Where does this data come from??" 😵
```

**✅ ĐÚNG — Start simple, extract when needed:**

```tsx
// START: Everything in 3 files
// FileExplorer.tsx (30 lines)
// FileList.tsx (25 lines)
// FileObject.tsx (35 lines)
// Total: ~90 lines, 3 files, DONE!

// EXTRACT when you have EVIDENCE:
// 1. Same sort logic needed in 2+ places → extract sortItems()
// 2. Same toggle logic used elsewhere → extract useToggle()
// 3. 3+ components need same state → extract Context
// 4. Types used across modules → extract types.ts
```

**Rule of Three:**

```
ABSTRACTION TIMING:
1st use: Write inline (don't abstract)
2nd use: Copy-paste (still don't abstract!)
3rd use: NOW abstract into shared module

WHY?
- 1st use: You don't know what the abstraction should look like
- 2nd use: 2 examples → not enough to see the pattern
- 3rd use: 3 examples → pattern is clear, abstraction is INFORMED

"Duplication is far cheaper than the wrong abstraction."
— Sandi Metz

FILE EXPLORER EXAMPLE:
├── MVP: 3 components, all code inline → 90 lines
├── Add search: Extract sortItems() because used in 2 places
├── Add DnD: Extract TreeContext because 3+ components need state
├── Add virtualization: Extract useFlattenTree() hook
└── Each extraction MOTIVATED by real need, not speculation
```

**💬 Interview talking point:**

> "I prefer to start with simple, collocated code and extract abstractions only when I see a clear pattern repeated at least 3 times. Premature abstraction creates coupling that's harder to undo than duplication."

---

### Mistake 17: Ignoring React.StrictMode Double Render

**❌ SAI — Side effects trong render:**

```tsx
function FileExplorer({ data }: Props) {
  // ❌ Side effect in render body!
  console.log("Rendering tree with", data.length, "items");

  // ❌ Mutating external variable during render!
  let renderCount = 0;
  renderCount++; // This will double in StrictMode!

  // ❌ API call triggered by render!
  if (!loaded) {
    fetch("/api/files").then(setData);
  }

  return <FileList fileList={data} level={1} />;
}
```

**Hậu quả trong StrictMode:**

```
React.StrictMode (Development only):
1. Renders component TWICE to detect side effects
2. Runs effects, cleans up, runs again
3. Purpose: Find impure renders

With side effects in render:
├── console.log fires TWICE → confusing debug output
├── renderCount = 2 instead of 1 → wrong count
├── fetch() called TWICE → duplicate API calls!
├── External mutation → corrupted state

GOTCHA: StrictMode only runs in development!
→ Bug appears in dev, disappears in prod
→ "It works on my machine" (but not in dev mode)
→ Developer disables StrictMode → hides real bugs!
```

**✅ ĐÚNG — Separation of concerns:**

```tsx
function FileExplorer({ data }: Props) {
  // ✅ Side effects in useEffect (not render)
  useEffect(() => {
    console.log("Mounted with", data.length, "items");
  }, [data.length]);

  // ✅ Ref for tracking across renders
  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current++;
  });

  // ✅ Data fetching in useEffect with cleanup
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/files", { signal: controller.signal })
      .then((res) => res.json())
      .then(setData);
    return () => controller.abort(); // Cleanup!
  }, []);

  // ✅ Render is PURE — no side effects
  return <FileList fileList={data} level={1} />;
}
```

**Rule:**

```
IN RENDER BODY (allowed):
✅ Read props and state
✅ Compute derived values (isDirectory, sorted list)
✅ Return JSX
✅ Throw errors (for Error Boundaries)

IN RENDER BODY (NOT allowed):
❌ console.log (use useEffect for debugging)
❌ fetch / API calls
❌ DOM manipulation
❌ Mutate variables outside component
❌ Write to localStorage / sessionStorage
❌ Subscribe to external stores (use useSyncExternalStore)
```

---

### Mistake 18: Prop Type Mismatch — File vs FileData[]

**❌ SAI — Confusing prop types:**

```tsx
// Component expects FileData[] but receives single FileData
interface FileListProps {
  fileList: FileData[]; // Array of files
}

function FileObject({ file }: { file: FileData }) {
  const isDirectory = Boolean(file.children);

  return (
    <>
      <button>{file.name}</button>
      {expanded && file.children && (
        // ❌ WRONG: Passing single FileData instead of FileData[]!
        <FileList fileList={file} />
        // TypeScript catches this! But vanilla JS doesn't.
      )}
    </>
  );
}
```

**Các variations của lỗi này:**

```
MISTAKE A: Pass single object instead of array
<FileList fileList={file} />           // ❌ FileData, not FileData[]
<FileList fileList={file.children} />  // ✅ FileData[] (or undefined)

MISTAKE B: Pass parent instead of children
<FileList fileList={data} />           // ❌ Root data, not children
<FileList fileList={file.children!} /> // ✅ Children array

MISTAKE C: Forget to check children exists
<FileList fileList={file.children} />  // ❌ Could be undefined!
// TypeScript: Type 'FileData[] | undefined' is not assignable
//             to type 'FileData[]'

FIX:
{expanded && file.children && (      // Guard: children exists
  <FileList
    fileList={file.children}          // ✅ Now guaranteed FileData[]
    level={level + 1}
  />
)}

MISTAKE D: Spreading children instead of passing array
<FileList fileList={...file.children} />  // ❌ Syntax error
<FileList {...file.children} />            // ❌ Spreads as props
<FileList fileList={file.children} />     // ✅ Pass as prop
```

**Tại sao TypeScript ngăn được mistake này:**

```
TypeScript sẽ báo lỗi:
"Type 'FileData' is not assignable to type 'ReadonlyArray<FileData>'"

→ Compiler-enforced contract
→ Bug caught at BUILD time, not RUNTIME
→ Zero-cost: error disappears in production bundle
→ This alone justifies using TypeScript for tree structures
```

---

### Mistake 19: Uncontrolled Re-renders từ Parent

**❌ SAI — Parent re-render cascade:**

```tsx
function App() {
  const [count, setCount] = useState(0);
  const [fileData, setFileData] = useState(initialData);

  return (
    <div>
      {/* This button causes App to re-render */}
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>

      {/* ❌ FileExplorer re-renders even though fileData didn't change! */}
      <FileExplorer data={fileData} />
    </div>
  );
}
```

**Tại sao xảy ra:**

```
React re-render rules:
1. Component state changes → component re-renders
2. Parent re-renders → ALL children re-render (by default!)
3. Context value changes → ALL consumers re-render

setCount(1) → App re-renders
           → <button> re-renders (OK, count changed)
           → <FileExplorer> re-renders (UNNECESSARY! data unchanged)
           → FileList re-renders
           → ALL FileObjects re-render
           → 1000-node tree re-renders because of unrelated button!

PERFORMANCE IMPACT:
├── 10 nodes: ~0.1ms → unnoticeable
├── 100 nodes: ~5ms → small jank
├── 1000 nodes: ~100ms → visible lag
├── 10000 nodes: ~2s → app feels frozen
```

**✅ ĐÚNG — 4 cách fix:**

```tsx
// FIX 1: React.memo (simplest)
const FileExplorer = React.memo(function FileExplorer({ data }: Props) {
  return <FileList fileList={data} level={1} />;
});
// Only re-renders if `data` reference changes

// FIX 2: Move state closer to where it's used
function App() {
  const [fileData] = useState(initialData);
  return (
    <div>
      <Counter /> {/* Counter has its own state, doesn't affect App */}
      <FileExplorer data={fileData} />
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0); // Local to Counter!
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

// FIX 3: Children pattern (state above, content below)
function App() {
  return (
    <CounterWrapper>
      <FileExplorer data={fileData} /> {/* Stable children prop */}
    </CounterWrapper>
  );
}

function CounterWrapper({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {children} {/* children reference doesn't change! */}
    </div>
  );
}

// FIX 4: useMemo for derived data
function App() {
  const [count, setCount] = useState(0);

  // Data object recreated with useMemo only when source changes
  const stableData = useMemo(() => processData(rawData), [rawData]);

  return <FileExplorer data={stableData} />;
}
```

**Decision tree:**

```
DOES THE TREE RE-RENDER UNNECESSARILY?
├── YES: Is the data prop reference stable?
│   ├── NO → useMemo on data transformation
│   └── YES → React.memo on FileExplorer
│       ├── Still re-rendering? → Check callback props (useCallback)
│       └── Still re-rendering? → Move unrelated state out of parent
└── NO → Don't optimize (premature optimization)
```

---

### Mistake 20: Direct DOM Manipulation

**❌ SAI — Bypass React, manipulate DOM directly:**

```tsx
function FileObject({ file }: Props) {
  const handleClick = () => {
    // ❌ Direct DOM manipulation!
    const el = document.getElementById(`file-${file.id}`);
    el!.style.backgroundColor = "blue";
    el!.classList.add("selected");

    // ❌ Direct innerHTML mutation!
    const nameEl = document.querySelector(".file-name");
    nameEl!.innerHTML = file.name.toUpperCase();
  };

  return <div id={`file-${file.id}`}>{file.name}</div>;
}
```

**Tại sao đây là anti-pattern trong React:**

```
PROBLEM 1: React's virtual DOM vs Real DOM
├── React renders based on STATE
├── Direct DOM change → React doesn't know about it
├── Next re-render → React OVERWRITES your changes!
├── Result: Flickering, lost styles, inconsistent UI

PROBLEM 2: Server-Side Rendering (SSR)
├── document.getElementById doesn't exist on server
├── Component CRASHES during SSR
├── Hydration mismatch errors

PROBLEM 3: Testing
├── RTL tests render in virtual DOM
├── document.getElementById may not find elements
├── Tests become flaky and environment-dependent
```

**✅ ĐÚNG — Let React manage the DOM:**

```tsx
function FileObject({ file }: Props) {
  const [isSelected, setSelected] = useState(false);

  return (
    <div
      // ✅ React manages styles via state
      style={{ backgroundColor: isSelected ? "blue" : "transparent" }}
      className={isSelected ? "selected" : ""}
    >
      {/* ✅ React manages content via JSX */}
      {file.name}
    </div>
  );
}

// WHEN refs ARE acceptable:
function FileObject({ file }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // ✅ Focus management via ref (legitimate DOM access)
    if (isFocused) {
      buttonRef.current?.focus();
    }
  }, [isFocused]);

  return <button ref={buttonRef}>{file.name}</button>;
}
```

**Khi nào DOM access qua ref là OK:**

```
ACCEPTABLE useRef usage:
✅ Focus management: ref.current.focus()
✅ Scroll into view: ref.current.scrollIntoView()
✅ Measuring dimensions: ref.current.getBoundingClientRect()
✅ Animation libraries (GSAP, Framer Motion)
✅ Canvas/WebGL rendering
✅ Third-party library integration

NEVER acceptable:
❌ Changing styles: ref.current.style.x = y
❌ Changing content: ref.current.innerHTML = x
❌ Adding/removing classes: ref.current.classList.add(x)
❌ Appending children: ref.current.appendChild(x)
❌ Using document.getElementById/querySelector
```

---

### Mistake 21: Missing Loading/Error States

**❌ SAI — Chỉ handle happy path:**

```tsx
function FileExplorer() {
  const [data, setData] = useState<FileData[]>([]);

  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then(setData);
    // ❌ No loading state → blank screen while fetching
    // ❌ No error handling → silent failure if API down
    // ❌ No empty state → blank if API returns []
  }, []);

  return <FileList fileList={data} level={1} />;
}
```

**✅ ĐÚNG — Handle all states:**

```tsx
type Status = "idle" | "loading" | "error" | "success";

function FileExplorer() {
  const [data, setData] = useState<FileData[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    fetch("/api/files", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setData(data);
        setStatus("success");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  // Handle ALL states explicitly
  if (status === "loading") return <LoadingSkeleton />;
  if (status === "error")
    return <ErrorMessage error={error} onRetry={refetch} />;
  if (data.length === 0) return <EmptyState message="No files found" />;

  return <FileList fileList={data} level={1} />;
}
```

**State machine cho data fetching:**

```
                ┌──────┐
                │ IDLE │
                └──┬───┘
                   │ fetch()
                   ▼
              ┌─────────┐
              │ LOADING  │
              └──┬────┬──┘
          success│    │error
                 ▼    ▼
          ┌────────┐ ┌───────┐
          │SUCCESS │ │ ERROR │
          └────────┘ └───┬───┘
                         │ retry
                         ▼
                    ┌─────────┐
                    │ LOADING │ (loop back)
                    └─────────┘

EVERY UI STATE NEEDS A VISUAL:
├── Idle → nothing or placeholder
├── Loading → skeleton, spinner, or progress
├── Error → message + retry button
├── Success (empty) → "No files" illustration
├── Success (data) → actual file tree
└── Each state = distinct UI = good UX
```

---

### Mistake 22: Hardcoded Strings (No i18n Preparation)

**❌ SAI — Hardcoded user-facing text:**

```tsx
function FileExplorer({ data }: Props) {
  if (data.length === 0) {
    return <p>No files found</p>; // ❌ Hardcoded English
  }
  return (
    <div>
      <h2>File Explorer</h2> {/* ❌ Hardcoded title */}
      <span>3 items</span> {/* ❌ Hardcoded, not pluralized */}
      <button>Expand All</button> {/* ❌ Hardcoded action */}
    </div>
  );
}
```

**✅ ĐÚNG — Extract strings for i18n readiness:**

```tsx
// strings.ts — Centralized strings
export const STRINGS = {
  title: "File Explorer",
  emptyState: "No files found",
  expandAll: "Expand All",
  collapseAll: "Collapse All",
  itemCount: (count: number) => (count === 1 ? "1 item" : `${count} items`),
  deleteConfirm: (name: string) => `Are you sure you want to delete "${name}"?`,
} as const;

// Usage:
function FileExplorer({ data }: Props) {
  if (data.length === 0) {
    return <p>{STRINGS.emptyState}</p>;
  }
  return (
    <div>
      <h2>{STRINGS.title}</h2>
      <span>{STRINGS.itemCount(data.length)}</span>
    </div>
  );
}

// UPGRADE PATH to real i18n:
// 1. Replace STRINGS with useTranslation() hook
// 2. Keys map to translation files (en.json, vi.json)
// 3. Zero component changes needed!
```

**Tại sao quan trọng cho interview:**

```
INTERVIEWER: "How would you internationalize this?"

WITHOUT preparation:
"I'd... go through ALL components and find strings..."
→ Shows: Didn't think about it. Refactor nightmare.

WITH preparation:
"I centralized all strings in a constants file.
 To add i18n, I'd swap the constants module with
 a translation hook. Component code doesn't change."
→ Shows: Forward-thinking, production-ready mindset.

BONUS — MVP shortcut:
// Don't need full i18n library for interview
// Just extract strings → shows awareness
```

---

### Mistake 23: Inconsistent Naming Conventions

**❌ SAI — Mixed naming styles:**

```tsx
// File: FileExplorer.tsx (PascalCase — correct for component)
// File: file_list.tsx (snake_case — inconsistent!)
// File: fileObject.tsx (camelCase — inconsistent!)

interface file_data { ... }        // ❌ snake_case for types
interface FileListProperties { ... } // ❌ "Properties" not "Props"

function FileList({ file_list }: Props) {  // ❌ snake_case prop
  const is_directory = Boolean(file.children); // ❌ snake_case variable
  const HandleClick = () => { ... };  // ❌ PascalCase function

  return (
    <div className="FileList">  {/* ❌ PascalCase CSS class */}
      <div class-name="file_item">  {/* ❌ kebab-case wrong attr */}
    </div>
  );
}
```

**✅ ĐÚNG — Consistent React conventions:**

```
NAMING CONVENTION CHEAT SHEET:
┌─────────────────────┬────────────────┬─────────────────────┐
│ What                │ Convention      │ Example              │
├─────────────────────┼────────────────┼─────────────────────┤
│ Component file      │ PascalCase     │ FileExplorer.tsx     │
│ Component name      │ PascalCase     │ FileExplorer         │
│ Hook file           │ camelCase      │ useToggle.ts         │
│ Hook function       │ camelCase(use) │ useToggle            │
│ Util file           │ camelCase      │ sortItems.ts         │
│ Type/Interface      │ PascalCase     │ FileData             │
│ Props interface     │ PascalCase     │ FileListProps        │
│ Variable            │ camelCase      │ isDirectory          │
│ Function            │ camelCase      │ handleClick          │
│ Constant            │ UPPER_SNAKE    │ MAX_DEPTH            │
│ CSS class           │ kebab-case     │ file-explorer        │
│ CSS module          │ camelCase      │ styles.fileExplorer  │
│ Event handler prop  │ camelCase(on)  │ onToggle             │
│ Boolean prop        │ camelCase(is)  │ isExpanded           │
│ Enum                │ PascalCase     │ SortOrder.Ascending  │
│ Generic type param  │ Single letter  │ T, K, V              │
└─────────────────────┴────────────────┴─────────────────────┘

WHY CONSISTENCY MATTERS:
1. Scannability: Know what a name IS by how it LOOKS
   FileExplorer → "This is a component"
   useToggle → "This is a hook"
   handleClick → "This is an event handler"

2. Auto-import: IDEs match PascalCase → component files
3. Code review: Inconsistency = red flag for reviewers
4. Team velocity: No debates about naming style
```

---

### Mistake 24: Không Handle Large File Names / Deep Paths

**❌ SAI — Assume short names:**

```tsx
function FileObject({ file }: Props) {
  return (
    <button className="file-button">
      {/* ❌ Long name overflows container! */}
      {file.name}
    </button>
  );
}
```

**Ví dụ tên file thực tế gây overflow:**

```
Short (normal): README.md
Medium: user-authentication-middleware.config.ts
Long: this-is-a-very-long-file-name-that-someone-created-for-testing-purposes.txt
Unicode: 日本語のファイル名_テスト_ドキュメント.pdf
With spaces: My Important Document (Final) (Copy 2).docx
Deep path: src/modules/auth/providers/oauth/google/callbacks/success.handler.ts
```

**✅ ĐÚNG — Handle all name lengths:**

```css
/* CSS solutions for text overflow */
.file-button {
  /* FIX 1: Truncate with ellipsis */
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-button--multiline {
  /* FIX 2: Word wrap (for detailed view) */
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* FIX 3: Tooltip for full name on hover */
.file-button[title] {
  position: relative;
}
```

```tsx
// Component solution:
function FileObject({ file, level }: Props) {
  const displayName = file.name;

  return (
    <button
      className="file-button"
      title={file.name} // ✅ Full name on hover tooltip
      style={{
        paddingLeft: level * 20,
        maxWidth: `calc(100% - ${level * 20}px)`, // ✅ Respect nesting
      }}
    >
      <span className="file-name">{displayName}</span>
    </button>
  );
}
```

**Deep nesting visual problem:**

```
Level 1:  📁 Documents
Level 2:    📁 Projects
Level 3:      📁 React
Level 4:        📁 Components
Level 5:          📁 FileExplorer
Level 6:            📁 __tests__
Level 7:              📄 FileExplorer.test.tsx  ← barely visible!
Level 8:                📄 ...  ← overflow!

FIX: Cap indentation after certain depth
const indent = Math.min(level, MAX_INDENT_LEVEL) * INDENT_PX;
// After level 6, stop indenting → content stays visible

ALTERNATIVE: Indentation with connecting lines
├── Documents
│   ├── Projects
│   │   └── React
│   │       └── Components
→ Visual connection without excessive indentation
```

---

### Mistake 25: Wrong useEffect Dependencies

**❌ SAI — Missing hoặc Sai Dependency Array:**

```tsx
function FileExplorer({ data, onSelect }: Props) {
  const [filtered, setFiltered] = useState(data);
  const [search, setSearch] = useState("");

  // ❌ MISTAKE A: Missing dependency — data changes won't trigger effect
  useEffect(() => {
    const result = data.filter((f) => f.name.includes(search));
    setFiltered(result);
  }, [search]); // ← Missing `data`! Won't update if data changes

  // ❌ MISTAKE B: Object/Function in deps — infinite loop!
  useEffect(() => {
    onSelect(filtered[0]);
  }, [filtered, onSelect]);
  // filtered = new array every filter → effect runs every render!
  // onSelect = new function if parent doesn't useCallback → infinite loop!

  // ❌ MISTAKE C: No deps at all — runs EVERY render
  useEffect(() => {
    console.log("Tree updated");
  }); // ← No deps array = runs after EVERY render
}
```

**Hậu quả của mỗi lỗi:**

```
MISTAKE A (Missing dep):
├── data changes from API → useEffect KHÔNG run
├── UI shows stale filtered data
├── User sees old results → confusion
├── ESLint exhaustive-deps rule catches this!

MISTAKE B (Object/Function dep):
├── filtered is new array reference every filter
├── useEffect sees "new" filtered → runs again
├── Runs again → updates state → triggers re-render
├── Re-render → new filtered → useEffect runs again...
├── INFINITE LOOP! Browser freezes ❄️

MISTAKE C (No deps):
├── Runs after every single render
├── console.log fires 100x per second during typing
├── If has setState inside → infinite re-render loop
├── Performance: O(n) effects per render
```

**✅ ĐÚNG — Correct dependency patterns:**

```tsx
function FileExplorer({ data, onSelect }: Props) {
  const [search, setSearch] = useState("");

  // ✅ FIX A: Derived state = DON'T use useEffect!
  const filtered = useMemo(
    () => data.filter((f) => f.name.includes(search)),
    [data, search], // Both deps listed
  );

  // ✅ FIX B: Stabilize callback ref
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect; // Always latest, no re-trigger

  useEffect(() => {
    if (filtered.length > 0) {
      onSelectRef.current(filtered[0]); // Ref = stable, no dep needed
    }
  }, [filtered]); // onSelectRef is a ref → stable → not in deps

  // ✅ FIX C: Always specify deps
  useEffect(() => {
    console.log("Data changed:", data.length);
  }, [data]); // Only when data actually changes
}
```

**Dependency Array Cheat Sheet:**

```
┌────────────────────────┬────────────────────────────────────┐
│ Code                    │ Runs when?                         │
├────────────────────────┼────────────────────────────────────┤
│ useEffect(fn)           │ After EVERY render (avoid!)        │
│ useEffect(fn, [])       │ Only on MOUNT (once)               │
│ useEffect(fn, [a])      │ On mount + when `a` changes        │
│ useEffect(fn, [a, b])   │ On mount + when `a` OR `b` changes│
└────────────────────────┴────────────────────────────────────┘

RULES:
1. List EVERYTHING the effect reads from component scope
2. Primitives (string, number, boolean) → safe in deps
3. Objects/Arrays → compare by REFERENCE (use useMemo)
4. Functions → compare by REFERENCE (use useCallback)
5. Refs → NEVER put in deps (refs are stable)
6. setState → NEVER put in deps (guaranteed stable)
```

---

### Mistake 26: Không Debounce Search Input

**❌ SAI — Filter chạy mỗi keystroke:**

```tsx
function FileSearch({ data, onFilter }: Props) {
  const [query, setQuery] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // ❌ Expensive tree filter runs on EVERY keystroke!
    const filtered = filterTree(data, value); // O(n) traversal
    onFilter(filtered);
  };

  return <input value={query} onChange={handleChange} />;
}
```

**Vấn đề:**

```
Typing "react" (5 chars) at ~100ms per keystroke:
├── Keystroke "r" → filterTree(10K nodes) → 15ms
├── Keystroke "e" → filterTree(10K nodes) → 15ms
├── Keystroke "a" → filterTree(10K nodes) → 15ms
├── Keystroke "c" → filterTree(10K nodes) → 15ms
├── Keystroke "t" → filterTree(10K nodes) → 15ms
├── Total: 5 filter passes = 75ms of computation
├── Intermediate results: "r", "re", "rea", "reac" → USELESS
└── Only "react" matters → 4 out of 5 filters WASTED

With 100K nodes:
├── Each filter: ~150ms
├── 5 keystrokes: 750ms
├── UI feels laggy, input stutters, user frustrated
```

**✅ ĐÚNG — Debounce the expensive operation:**

```tsx
// APPROACH 1: Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // Cancel on value change
  }, [value, delay]);

  return debouncedValue;
}

function FileSearch({ data, onFilter }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300); // Wait 300ms

  // Only filter when user STOPS typing
  useEffect(() => {
    const filtered = filterTree(data, debouncedQuery);
    onFilter(filtered);
  }, [data, debouncedQuery, onFilter]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

// APPROACH 2: React 18 useTransition (concurrent)
function FileSearch({ data, onFilter }: Props) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); // High priority: update input immediately

    startTransition(() => {
      // Low priority: filter can be interrupted
      const filtered = filterTree(data, e.target.value);
      onFilter(filtered);
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Filtering...</span>}
    </>
  );
}

// APPROACH 3: useDeferredValue (React 18)
function FileSearch({ data }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // deferredQuery lags behind query
  // React renders with old value first (fast),
  // then re-renders with new value (can interrupt)
  const filtered = useMemo(
    () => filterTree(data, deferredQuery),
    [data, deferredQuery],
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <FileList fileList={filtered} level={1} />
    </>
  );
}
```

**So sánh 3 approaches:**

```
┌──────────────────┬──────────────┬─────────────────┬────────────────┐
│ Approach         │ Debounce     │ useTransition    │ useDeferredVal │
├──────────────────┼──────────────┼─────────────────┼────────────────┤
│ React version    │ Any          │ 18+              │ 18+            │
│ Input responsive │ ✅ Instant   │ ✅ Instant       │ ✅ Instant     │
│ Filter timing    │ After delay  │ When idle         │ When idle      │
│ Cancelable       │ ✅ Yes       │ ✅ Auto          │ ✅ Auto        │
│ Loading state    │ Manual       │ ✅ isPending     │ Manual         │
│ Complexity       │ Simple       │ Medium            │ Simple         │
│ Best for         │ API calls    │ CPU-heavy renders│ Derived state  │
└──────────────────┴──────────────┴─────────────────┴────────────────┘
```

---

### Mistake 27: Quên `forwardRef` cho Reusable Components

**❌ SAI — Component không forward ref:**

```tsx
// ❌ Parent can't access the inner button/div
function FileObject({ file }: Props) {
  return <button className="file-button">{file.name}</button>;
}

// Parent tries:
function Parent() {
  const ref = useRef<HTMLButtonElement>(null);
  return <FileObject ref={ref} file={file} />;
  // ❌ Warning: Function components cannot be given refs!
  // ref.current is always null!
}
```

**Tại sao cần forwardRef:**

```
USE CASES THAT REQUIRE REF ACCESS:
├── Focus management: ref.current.focus()
├── Scroll into view: ref.current.scrollIntoView()
├── Measure dimensions: ref.current.getBoundingClientRect()
├── Animation libraries: GSAP needs DOM element
├── Tooltip positioning: need element position
├── Intersection Observer: monitor visibility
└── Keyboard navigation: manage focus across tree

WITHOUT forwardRef:
Parent CANNOT reach the inner DOM element
→ Cannot focus a specific file item
→ Cannot scroll to a search result
→ Cannot animate expand/collapse
```

**✅ ĐÚNG — Forward ref properly:**

```tsx
// React < 19: forwardRef wrapper
const FileObject = forwardRef<HTMLButtonElement, FileObjectProps>(
  function FileObject({ file, level }, ref) {
    const [expanded, setExpanded] = useState(false);
    const isDirectory = Boolean(file.children);

    return (
      <li role="treeitem">
        <button
          ref={ref} // ✅ Forwarded to the actual DOM element
          className="file-button"
          onClick={() => isDirectory && setExpanded(!expanded)}
        >
          {file.name}
        </button>
        {expanded && file.children && (
          <FileList fileList={file.children} level={level + 1} />
        )}
      </li>
    );
  },
);

// React 19+: ref is just a regular prop!
function FileObject({
  file,
  level,
  ref,
}: Props & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <button ref={ref} className="file-button">
      {file.name}
    </button>
  );
}

// Parent usage (both versions):
function FileExplorer() {
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstItemRef.current?.focus(); // ✅ Focus first item on mount
  }, []);

  return <FileObject ref={firstItemRef} file={files[0]} level={1} />;
}
```

**Khi nào KHÔNG cần forwardRef:**

```
SKIP forwardRef if:
├── Component is page-level (not reusable)
├── No parent needs DOM access
├── All DOM interaction is internal to component
├── MVP/Interview (add later if asked)

USE forwardRef if:
├── Building design system / UI library
├── Component used in focus management system
├── Component needs scroll-into-view from parent
├── Component used with tooltip/popover positioning
```

---

### Mistake 28: Mixed Async Patterns (Callbacks + Promises + Async/Await)

**❌ SAI — Inconsistent async style:**

```tsx
function FileExplorer() {
  // ❌ Mixing 3 different async patterns in one component!

  // Pattern 1: Callbacks
  const loadFiles = (callback: (data: FileData[]) => void) => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => callback(data));
  };

  // Pattern 2: Promise chains
  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => setError(err.message));
  }, []);

  // Pattern 3: Async/await (but wrong!)
  useEffect(async () => {
    // ❌ useEffect callback cannot be async!
    const res = await fetch("/api/files");
    const data = await res.json();
    setFiles(data);
  }, []);
}
```

**✅ ĐÚNG — Consistent async/await pattern:**

```tsx
function FileExplorer() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    // ✅ Async function INSIDE useEffect (not the callback itself)
    async function fetchFiles() {
      try {
        setLoading(true);
        const res = await fetch("/api/files", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data = await res.json();
        setFiles(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();

    return () => controller.abort(); // ✅ Cleanup
  }, []);
}
```

**Tại sao useEffect callback KHÔNG thể async:**

```
useEffect(() => {
  return cleanupFunction; // Must return function or undefined
});

useEffect(async () => {
  return cleanupFunction; // ❌ async returns Promise<function>!
  // React expects function, gets Promise
  // Cleanup NEVER runs → memory leaks!
});

FIX: Define async function inside, then call it
useEffect(() => {
  async function init() { await ... }
  init();
  return () => { /* cleanup */ };
}, []);
```

---

### Mistake 29: Wrong `event.target` vs `event.currentTarget`

**❌ SAI — Using event.target for clicked element:**

```tsx
function FileObject({ file }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // ❌ event.target = the INNERMOST element clicked
    const name = e.target.textContent; // Could be icon, not button!
    console.log("Clicked:", name);

    // ❌ event.target may NOT be the button!
    (e.target as HTMLElement).classList.add("active");
  };

  return (
    <button onClick={handleClick}>
      <span className="icon">📁</span> {/* ← If user clicks HERE */}
      <span className="name">{file.name}</span>
    </button>
  );
}
```

**Sự khác biệt:**

```
<button onClick={handleClick}>         ← event.currentTarget (ALWAYS)
  <span class="icon">📁</span>         ← event.target (if clicked here)
  <span class="name">Documents</span>  ← event.target (if clicked here)
</button>

event.target      = Element user ACTUALLY clicked (could be child)
event.currentTarget = Element the HANDLER is attached to (always button)

CLICK ON ICON:
  e.target         → <span class="icon">📁</span>
  e.currentTarget  → <button>...</button>

  e.target.textContent     → "📁" (wrong!)
  e.currentTarget.dataset → button's data attributes (correct!)
```

**✅ ĐÚNG — Use currentTarget or data attributes:**

```tsx
function FileObject({ file }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // ✅ currentTarget = always the button
    console.log("Button clicked");

    // ✅ Or better: don't use DOM at all, use the prop
    console.log("File:", file.name); // Already in scope via closure
  };

  return (
    <button
      onClick={handleClick}
      data-file-id={file.id} // For delegation pattern
    >
      <span className="icon">📁</span>
      <span className="name">{file.name}</span>
    </button>
  );
}

// EVENT DELEGATION pattern (for large lists):
function FileList({ fileList }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLUListElement>) => {
    // Find closest button (event delegation)
    const button = (e.target as HTMLElement).closest("button[data-file-id]");
    if (!button) return;

    const fileId = button.getAttribute("data-file-id");
    // ✅ ONE handler on parent, works for all children
  };

  return (
    <ul onClick={handleClick}>
      {fileList.map((file) => (
        <li key={file.id}>
          <button data-file-id={file.id}>{file.name}</button>
        </li>
      ))}
    </ul>
  );
}
```

---

### Mistake 30: Không Memoize Context Provider Value

**❌ SAI — New value object every render:**

```tsx
function FileTreeProvider({ children }: { children: ReactNode }) {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <TreeContext.Provider
      // ❌ New object EVERY render → ALL consumers re-render!
      value={{
        expandedIds,
        selectedId,
        toggle: (id: number) => {
          setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          });
        },
        select: (id: number) => setSelectedId(id),
      }}
    >
      {children}
    </TreeContext.Provider>
  );
}
```

**Hậu quả:**

```
EVERY re-render of FileTreeProvider:
├── New value object (value={{ ... }}) created
├── Object.is(prevValue, nextValue) → false (different references!)
├── React: "Context value changed! Re-render ALL consumers!"
├── ALL FileObject components re-render
├── Even if expandedIds and selectedId are unchanged!

With 1000 nodes: 1000 unnecessary re-renders per Provider render
```

**✅ ĐÚNG — Memoize the value:**

```tsx
function FileTreeProvider({ children }: { children: ReactNode }) {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ✅ Memoize callbacks (stable references)
  const toggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const select = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  // ✅ Memoize provider value
  const value = useMemo(
    () => ({
      expandedIds,
      selectedId,
      toggle,
      select,
    }),
    [expandedIds, selectedId, toggle, select],
  );

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
}

// ADVANCED: Split into 2 contexts (state vs actions)
const TreeStateContext = createContext<TreeState>(null!);
const TreeActionsContext = createContext<TreeActions>(null!);

// Actions context NEVER changes → consumers don't re-render
// State context changes → only state-reading consumers re-render
```

**Pattern summary:**

```
CONTEXT VALUE OPTIMIZATION:
1. useMemo on the value object → stable reference
2. useCallback on all functions in value → stable callbacks
3. Split state + actions into separate contexts → minimal re-renders
4. Consider zustand/jotai for fine-grained subscriptions
```

---

### Mistake 31: Ignoring TypeScript Discriminated Unions cho Tree Nodes

**❌ SAI — Single interface for different node types:**

```tsx
// ❌ One type tries to cover everything
interface TreeNode {
  id: number;
  name: string;
  type: string; // ← too broad
  children?: TreeNode[];
  size?: number; // Only files have size
  extension?: string; // Only files have extension
  itemCount?: number; // Only directories have itemCount
  isLoading?: boolean; // Only lazy dirs have loading
}

// Result: Every property is optional → TypeScript can't help
// node.size exists even for directories → runtime bug possible
// node.itemCount exists even for files → misleading
```

**✅ ĐÚNG — Discriminated Union:**

```tsx
// Base shared properties
interface BaseNode {
  id: number;
  name: string;
}

// File-specific properties
interface FileNode extends BaseNode {
  type: "file";
  size: number; // Required for files!
  extension: string; // Required for files!
  // No children property
}

// Directory-specific properties
interface DirectoryNode extends BaseNode {
  type: "directory";
  children: TreeNode[]; // Required for directories!
  itemCount: number; // Required for directories!
}

// Lazy directory (hasn't loaded children yet)
interface LazyDirectoryNode extends BaseNode {
  type: "lazy-directory";
  isLoading: boolean;
  children?: TreeNode[]; // May not have loaded yet
}

// Discriminated union
type TreeNode = FileNode | DirectoryNode | LazyDirectoryNode;
```

**Type narrowing benefit:**

```tsx
function renderNode(node: TreeNode) {
  switch (node.type) {
    case 'file':
      // TypeScript KNOWS: node is FileNode
      console.log(node.size);       // ✅ number (not optional!)
      console.log(node.extension);  // ✅ string
      console.log(node.children);   // ❌ Property doesn't exist!
      break;

    case 'directory':
      // TypeScript KNOWS: node is DirectoryNode
      console.log(node.children);   // ✅ TreeNode[]
      console.log(node.itemCount);  // ✅ number
      console.log(node.size);       // ❌ Property doesn't exist!
      break;

    case 'lazy-directory':
      // TypeScript KNOWS: node is LazyDirectoryNode
      if (node.isLoading) return <Spinner />;
      if (node.children) return <FileList files={node.children} />;
      return <LoadButton />;
  }
  // TypeScript: exhaustive check — no case missed!
}

WHY DISCRIMINATED UNIONS ARE POWERFUL:
1. Compiler PREVENTS accessing wrong properties
2. switch/case gets exhaustiveness checking
3. Each branch has EXACT type (no optional guessing)
4. Adding new node type → compiler shows ALL places to update
5. Self-documenting: type definition IS the documentation
```

---

### Mistake 32: Dùng useEffect cho Derived State

**❌ SAI — useEffect để sync state từ props:**

```tsx
function FileList({ fileList }: Props) {
  const [sorted, setSorted] = useState<FileData[]>([]);

  // ❌ useEffect to "sync" sorted data from fileList prop
  useEffect(() => {
    const dirs = fileList.filter(f => Boolean(f.children));
    const files = fileList.filter(f => !Boolean(f.children));
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    setSorted([...dirs, ...files]);
  }, [fileList]);

  return <ul>{sorted.map(...)}</ul>;
}
```

**Tại sao đây là anti-pattern:**

```
TIMELINE:
1. fileList prop changes
2. Component re-renders with NEW fileList
3. sorted state is STILL OLD (stale!)
4. Component renders with OLD sorted data → FLASH of wrong data!
5. useEffect runs AFTER render
6. setSorted triggers ANOTHER re-render
7. Component renders AGAIN with correct sorted data

Result: TWO renders instead of ONE
User sees: flicker of unsorted → sorted data

PERFORMANCE:
├── Extra re-render (unnecessary)
├── Extra state (sorted stored in memory)
├── Extra effect (scheduler overhead)
├── React warns: "You might not need useEffect"
```

**✅ ĐÚNG — Compute during render:**

```tsx
// FIX 1: Direct computation (simplest)
function FileList({ fileList }: Props) {
  const sorted = sortItems(fileList); // Compute directly
  return <ul>{sorted.map(...)}</ul>;
}

// FIX 2: useMemo (if computation is expensive)
function FileList({ fileList }: Props) {
  const sorted = useMemo(() => sortItems(fileList), [fileList]);
  return <ul>{sorted.map(...)}</ul>;
}

// RULE: If a value can be COMPUTED from existing props/state,
//       DON'T put it in state. Compute it during render.
```

**"You Might Not Need an Effect" decision tree:**

```
CAN THE VALUE BE COMPUTED FROM PROPS/STATE?
├── YES → Compute during render (or useMemo)
│   Examples: sorted list, filtered list, isDirectory,
│   formatted date, derived counts
├── NO, it's from an external system → useEffect
│   Examples: API data, localStorage, DOM measurements,
│   WebSocket messages, browser APIs
└── NO, it responds to user events → event handler
    Examples: form submission, button clicks,
    keyboard shortcuts

ANTI-PATTERN CHEAT SHEET:
❌ useEffect → setState (to "sync" from props)
✅ useMemo / direct computation (derived state)

❌ useEffect → fetch on mount
✅ React Query / SWR / loader (data fetching)

❌ useEffect → subscribe to store
✅ useSyncExternalStore (external subscriptions)

❌ useEffect → update state on prop change
✅ Key prop to reset component (controlled reset)
```

---

### Mistake 33: Không Handle Concurrent State Updates

**❌ SAI — Racing state updates:**

```tsx
function FileExplorer() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    // ❌ Race condition with rapid clicks!
    const newSet = new Set(expandedIds); // Read current
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet); // Set based on current
  };

  // SCENARIO: User double-clicks rapidly
  // Click 1: reads expandedIds = {} → adds id:5 → sets {5}
  // Click 2: reads expandedIds = {} (STALE! batched render)
  //          → adds id:5 → sets {5}
  // Expected: Click twice = expand then collapse = {}
  // Actual: Both clicks expand → stays expanded → BUG!
}
```

**✅ ĐÚNG — Functional updates for concurrent safety:**

```tsx
function FileExplorer() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((id: number) => {
    // ✅ Functional update → always reads LATEST state
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []); // No deps needed! prev is always current

  // Multi-select with Ctrl+Click
  const toggleSelect = useCallback((id: number, multi: boolean) => {
    setSelectedIds((prev) => {
      if (multi) {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }
      return new Set([id]); // Single select: replace
    });
  }, []);
}
```

**Khi nào cần functional update:**

```
ALWAYS USE FUNCTIONAL UPDATE WHEN:
├── Toggling: setState(prev => !prev)
├── Incrementing: setState(prev => prev + 1)
├── Adding to Set: setState(prev => new Set([...prev, item]))
├── Append to Array: setState(prev => [...prev, item])
├── Any case where new state depends on previous state

SAFE WITHOUT FUNCTIONAL UPDATE:
├── Replacing entirely: setState(newValue)
├── Setting constant: setState(false)
├── Setting from event: setState(e.target.value)
├── Any case where new state is INDEPENDENT of previous
```

---

### Mistake 34: Prop Spreading Không Filter

**❌ SAI — Spread all props to DOM element:**

```tsx
interface FileObjectProps {
  file: FileData;
  level: number;
  onSelect?: (file: FileData) => void;
  isVirtual?: boolean;
  customRenderer?: (file: FileData) => ReactNode;
}

function FileObject(props: FileObjectProps) {
  return (
    // ❌ Spreading ALL props to div → React DOM warnings!
    <div {...props}>{props.file.name}</div>
  );
  // Warning: React does not recognize the `onSelect` prop on a DOM element.
  // Warning: React does not recognize the `isVirtual` prop on a DOM element.
  // Warning: React does not recognize the `customRenderer` prop on a DOM element.
}
```

**Vấn đề:**

```
HTML DOM elements only accept:
├── Standard HTML attributes (id, className, style, title...)
├── Data attributes (data-*)
├── ARIA attributes (aria-*)
├── Event handlers (onClick, onChange...)

Custom props (onSelect, isVirtual, customRenderer):
├── Not valid HTML attributes
├── React shows console warnings
├── Attributes appear in DOM: <div isvirtual="true">
├── Potential security: leaking internal data to DOM
├── Performance: unnecessary DOM attributes
```

**✅ ĐÚNG — Destructure and separate:**

```tsx
function FileObject({
  file,
  level,
  onSelect,
  isVirtual,
  customRenderer,
  ...restProps // ✅ Only standard HTML attributes remain
}: FileObjectProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...restProps}>
      {" "}
      {/* ✅ Only valid HTML props spread */}
      {customRenderer ? customRenderer(file) : file.name}
    </div>
  );
}

// ALTERNATIVE: Explicit whitelist
function FileObject(props: FileObjectProps) {
  const { file, level, onSelect, isVirtual, customRenderer } = props;

  return (
    <div
      className="file-object"
      data-level={level}
      data-virtual={isVirtual || undefined} // ✅ Only add if true
    >
      {file.name}
    </div>
  );
}
```

---

### Mistake 35: Wrong Comparison Operators cho Edge Cases

**❌ SAI — Loose comparison và edge cases:**

```tsx
function FileList({ fileList }: Props) {
  // ❌ Loose equality: "" == false → true!
  if (fileList == null) return null;
  // This also catches undefined, but developers may not realize

  // ❌ Length check without null check
  if (fileList.length == 0) return <Empty />;
  // If fileList is null → TypeError: Cannot read property 'length'

  // ❌ Falsy check for empty string names
  const validFiles = fileList.filter((f) => f.name);
  // Filters out files named "0" because 0 is falsy!
  // Filters out files named "" (might be intentional?)
}
```

**Edge cases cần nhận biết:**

```
FALSY VALUES IN JAVASCRIPT:
false, 0, -0, 0n, "", null, undefined, NaN

PROBLEM SCENARIOS:
├── File named "0" → Boolean("0") = true ✅ (string)
├── File with 0 children → Boolean(0) = false ❌ (number)
├── File id = 0 → if (file.id) = false ❌ (valid id!)
├── Empty array → Boolean([]) = true ✅ (arrays are truthy!)
├── Empty object → Boolean({}) = true ✅ (objects are truthy!)
├── NaN → Boolean(NaN) = false (edge case)

COMPARISON TRAPS:
null == undefined  → true  (loose)
null === undefined → false (strict)
"" == false        → true  (loose)
"" === false       → false (strict)
0 == false         → true  (loose)
[] == false        → true  (loose!)
```

**✅ ĐÚNG — Strict comparisons:**

```tsx
function FileList({ fileList }: Props) {
  // ✅ Strict null check
  if (fileList === null || fileList === undefined) return null;
  // Or: if (fileList == null) — intentional loose (null OR undefined)

  // ✅ Explicit length check
  if (fileList.length === 0) return <EmptyState />;

  // ✅ Explicit type checks for filtering
  const validFiles = fileList.filter(
    (f) => typeof f.name === "string" && f.name.length > 0,
  );

  // ✅ Safe ID comparison (handles id=0)
  const isSelected = selectedId !== null && file.id === selectedId;
  // NOT: if (selectedId && file.id === selectedId) ← fails for id=0!

  // ✅ Array check
  const isDirectory = Array.isArray(file.children) && file.children.length > 0;
}
```

---

### Mistake 36: Không Consider SSR / Hydration Mismatch

**❌ SAI — Client-only code trong shared component:**

```tsx
function FileExplorer({ data }: Props) {
  // ❌ window doesn't exist during SSR!
  const isMobile = window.innerWidth < 768;

  // ❌ localStorage doesn't exist during SSR!
  const savedExpanded = JSON.parse(localStorage.getItem("expandedIds") || "[]");

  // ❌ Date-dependent: server and client render different times
  const lastUpdated = new Date().toLocaleString();

  // ❌ Math.random: different on server vs client!
  const id = Math.random().toString(36);

  return (
    <div>
      <span>{lastUpdated}</span> {/* HYDRATION MISMATCH! */}
      <p>Id: {id}</p> {/* HYDRATION MISMATCH! */}
    </div>
  );
}
```

**Tại sao hydration mismatch nghiêm trọng:**

```
SSR FLOW:
1. Server renders HTML: "<div>Jan 1, 10:00:00</div>"
2. HTML sent to browser
3. React hydrates: tries to match server HTML with client render
4. Client renders: "<div>Jan 1, 10:00:01</div>" (1 second later!)
5. React: "MISMATCH! Server said 10:00:00, client says 10:00:01"
6. Warning in console, potential visual glitch
7. React may discard server-rendered DOM → lose SSR benefits

CONSEQUENCES:
├── Console warnings (Error: Hydration mismatch)
├── Visual flash (server content → client content)
├── Performance loss (React discards pre-rendered HTML)
├── SEO impact (crawlers see different content)
└── In worst case: broken interactivity
```

**✅ ĐÚNG — Handle SSR safely:**

```tsx
function FileExplorer({ data }: Props) {
  // ✅ Check for browser environment
  const [isMobile, setIsMobile] = useState(false); // Safe default

  useEffect(() => {
    // ✅ Only runs on client (after hydration)
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Lazy init from localStorage (client only)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set(); // SSR safe
    const saved = localStorage.getItem("expandedIds");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // ✅ Stable IDs with useId() (React 18+)
  const id = useId(); // Same on server and client!

  return <div id={id}>...</div>;
}

// PATTERN: useIsClient hook
function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

function FileExplorer({ data }: Props) {
  const isClient = useIsClient();

  // Render placeholder during SSR, full component on client
  if (!isClient) return <FileExplorerSkeleton />;
  return <FileExplorerClient data={data} />;
}
```

**SSR Safety Checklist:**

```
SAFE DURING SSR (can use in render):
✅ Props and state
✅ Pure computations
✅ useId() (React 18+)
✅ Deterministic values

NOT SAFE DURING SSR (use in useEffect):
❌ window / document / navigator
❌ localStorage / sessionStorage
❌ Date (non-deterministic)
❌ Math.random()
❌ Browser APIs (IntersectionObserver, etc.)
❌ Third-party scripts (analytics, etc.)
```

---

### Mistake 37: Không Dùng Error Boundaries cho Async Errors

**❌ SAI — Error Boundary chỉ catch sync errors:**

```tsx
class TreeErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}

function FileExplorer() {
  useEffect(() => {
    // ❌ Error boundary CANNOT catch this!
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        if (!data) throw new Error("No data!"); // Async error!
      });
    // Error thrown inside Promise → not caught by ErrorBoundary
    // Goes to window.onerror → unhandled rejection
  }, []);

  return <FileList />;
}
```

**Error Boundary limitations:**

```
ERROR BOUNDARIES CATCH:
✅ Errors during rendering (render method / function body)
✅ Errors in lifecycle methods (componentDidMount, etc.)
✅ Errors in constructors of child components
✅ Errors thrown in static getDerivedStateFromError

ERROR BOUNDARIES DO NOT CATCH:
❌ Event handlers (onClick, onChange, etc.)
❌ Async code (setTimeout, requestAnimationFrame, fetch)
❌ Server-side rendering (SSR)
❌ Errors thrown in the error boundary itself
❌ Errors in useEffect callbacks (async)
```

**✅ ĐÚNG — Handle both sync and async errors:**

```tsx
function FileExplorer() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFiles() {
      try {
        const res = await fetch("/api/files", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data) throw new Error("Empty response");
        setFiles(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err); // ✅ Capture async error in state
        }
      }
    }

    loadFiles();
    return () => controller.abort();
  }, []);

  // ✅ Re-throw to be caught by ErrorBoundary
  if (error) throw error; // Now ErrorBoundary CAN catch it!

  return <FileList files={files} />;
}

// ALTERNATIVE: Custom hook for error bridging
function useAsyncErrorBridge() {
  const [error, setError] = useState<Error | null>(null);

  if (error) throw error; // Bridge async → sync

  const captureError = useCallback((err: Error) => {
    setError(err);
  }, []);

  return captureError;
}

// Usage:
function FileExplorer() {
  const captureError = useAsyncErrorBridge();

  const handleClick = async () => {
    try {
      await deleteFile(fileId);
    } catch (err) {
      captureError(err as Error); // ErrorBoundary catches it!
    }
  };
}
```

**Event handler errors pattern:**

```tsx
function FileObject({ file }: Props) {
  // Event handler errors: try/catch + user feedback
  const handleDelete = async () => {
    try {
      await deleteFile(file.id);
      showToast("File deleted");
    } catch (err) {
      // ✅ Show error to user (not ErrorBoundary)
      showToast(`Failed to delete: ${err.message}`, "error");

      // ✅ Report to monitoring
      Sentry.captureException(err);
    }
  };
}
```

---

### Mistake 38: Unnecessary useState cho Constants

**❌ SAI — State cho values mà không bao giờ thay đổi:**

```tsx
function FileExplorer({ data }: Props) {
  // ❌ These NEVER change! Why are they in state?
  const [iconSize] = useState(16);
  const [indentPx] = useState(20);
  const [maxDepth] = useState(10);
  const [sortOrder] = useState<"asc" | "desc">("asc");

  // ❌ Computed once, never changes
  const [totalFiles] = useState(() => countFiles(data));
  // But data might change! This won't update!

  return <FileList fileList={data} indentPx={indentPx} />;
}
```

**Vấn đề:**

```
useState cho constants:
├── Wastes memory (React tracks state internally)
├── Confusing: Reader thinks "this might change somewhere"
├── No setter used → misleading API
├── initializer function runs once → stale if deps change
├── Extra overhead: React compares on every render
```

**✅ ĐÚNG — Use appropriate construct:**

```tsx
// CONSTANTS: Module-level const
const ICON_SIZE = 16;
const INDENT_PX = 20;
const MAX_DEPTH = 10;

// CONFIG OBJECT: Outside component
const FILE_EXPLORER_CONFIG = {
  iconSize: 16,
  indentPx: 20,
  maxDepth: 10,
  sortOrder: "asc" as const,
} as const;

function FileExplorer({ data }: Props) {
  // DERIVED VALUE: useMemo (changes with deps)
  const totalFiles = useMemo(() => countFiles(data), [data]);

  // REF: For mutable value that doesn't trigger re-render
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <FileList
      fileList={data}
      indentPx={INDENT_PX} // ✅ Constant reference
    />
  );
}
```

**Decision guide:**

```
WHAT CONSTRUCT TO USE:
┌──────────────────────────┬──────────────────────────┐
│ Scenario                  │ Use                      │
├──────────────────────────┼──────────────────────────┤
│ Never changes             │ const (module-level)     │
│ From props, never changes │ Prop directly            │
│ Computed from props/state │ useMemo                  │
│ Changes, triggers render  │ useState                 │
│ Changes, NO re-render     │ useRef                   │
│ From context              │ useContext               │
│ Complex state logic       │ useReducer               │
└──────────────────────────┴──────────────────────────┘
```

---

### Mistake 39: Wrong setState trong Loops

**❌ SAI — Multiple setState calls trong loop:**

```tsx
function FileExplorer() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const expandAll = (nodes: FileData[]) => {
    // ❌ setState called N times in a loop!
    nodes.forEach((node) => {
      if (node.children) {
        setExpandedIds((prev) => new Set([...prev, node.id]));
        // Each call: read → copy → add → set
        // N nodes = N setState calls = N potential re-renders!

        expandAll(node.children); // Recursive!
      }
    });
  };
}
```

**Hậu quả:**

```
Tree with 100 directories:
├── 100 setState calls
├── React 18: Batched automatically → 1 re-render ✅
├── React 17: NOT batched in async/event handlers → 100 re-renders! ❌
├── Even in React 18: 100 Set copies → O(n²) memory allocation
├── Each new Set([...prev, id]): copies entire set!

PERFORMANCE:
├── 100 dirs: 100 Set copies × growing size = ~5,050 total copies
├── 1000 dirs: ~500,500 total copies → VERY SLOW
```

**✅ ĐÚNG — Collect all changes, then setState once:**

```tsx
function FileExplorer() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const expandAll = (nodes: FileData[]) => {
    // ✅ Collect ALL ids first
    const allDirIds = collectDirectoryIds(nodes);

    // ✅ Single setState call
    setExpandedIds((prev) => new Set([...prev, ...allDirIds]));
  };

  const collapseAll = () => {
    // ✅ Single setState to empty
    setExpandedIds(new Set());
  };
}

// Helper: collect all directory IDs (pure function)
function collectDirectoryIds(nodes: FileData[]): number[] {
  const ids: number[] = [];

  function traverse(items: FileData[]) {
    for (const item of items) {
      if (item.children) {
        ids.push(item.id);
        traverse(item.children);
      }
    }
  }

  traverse(nodes);
  return ids;
}

// ALTERNATIVE: useReducer for complex state operations
function fileTreeReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case "EXPAND_ALL": {
      const allIds = collectDirectoryIds(action.payload.nodes);
      return {
        ...state,
        expandedIds: new Set([...state.expandedIds, ...allIds]),
      };
    }
    case "COLLAPSE_ALL":
      return { ...state, expandedIds: new Set() };
    case "TOGGLE":
    // ... single toggle logic
  }
}
```

**Rule:**

```
setState IN LOOP: AVOID!
├── Collect all changes → single setState
├── Use reducer for complex multi-step updates
├── Use functional update if must be incremental

React 18 batching:
├── Event handlers: ✅ Batched automatically
├── setTimeout/setInterval: ✅ Batched automatically
├── Promises (.then): ✅ Batched automatically
├── Native events (addEventListener): ✅ Batched
→ BUT: still creates N intermediate states (memory waste)
→ STILL better to collect + single setState
```

---

### Mistake 40: Ignoring Keyboard Navigation

**❌ SAI — Mouse-only interaction:**

```tsx
function FileObject({ file }: Props) {
  return (
    // ❌ div with onClick = not keyboard accessible!
    <div onClick={() => toggleExpand(file.id)}>{file.name}</div>
    // Tab navigation: SKIPPED (div is not focusable)
    // Enter/Space: NOTHING happens
    // Arrow keys: No tree navigation
    // Screen reader: "Documents" (no role, no state info)
  );
}
```

**✅ ĐÚNG — Full keyboard support:**

```tsx
function FileObject({ file, level }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = Boolean(file.children);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
        if (isDirectory && !expanded) {
          setExpanded(true); // Expand directory
        }
        // If already expanded: move focus to first child
        break;

      case "ArrowLeft":
        if (isDirectory && expanded) {
          setExpanded(false); // Collapse directory
        }
        // If collapsed or file: move focus to parent
        break;

      case "ArrowDown":
        e.preventDefault();
        // Move focus to next visible node
        focusNextNode(buttonRef.current);
        break;

      case "ArrowUp":
        e.preventDefault();
        // Move focus to previous visible node
        focusPrevNode(buttonRef.current);
        break;

      case "Home":
        e.preventDefault();
        // Focus first node in tree
        focusFirstNode();
        break;

      case "End":
        e.preventDefault();
        // Focus last visible node in tree
        focusLastNode();
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (isDirectory) setExpanded(!expanded);
        break;
    }
  };

  return (
    <li
      role="treeitem"
      aria-expanded={isDirectory ? expanded : undefined}
      aria-level={level}
      aria-setsize={/* siblings count */}
      aria-posinset={/* position in siblings */}
    >
      <button
        ref={buttonRef}
        onClick={() => isDirectory && setExpanded(!expanded)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {isDirectory ? (expanded ? "📂" : "📁") : "📄"}
        {file.name}
      </button>
      {expanded && file.children && (
        <ul role="group">
          <FileList fileList={file.children} level={level + 1} />
        </ul>
      )}
    </li>
  );
}
```

**Keyboard navigation cheat sheet (WAI-ARIA TreeView):**

```
┌──────────────┬────────────────────────────────────────────┐
│ Key          │ Action                                      │
├──────────────┼────────────────────────────────────────────┤
│ ↓ ArrowDown  │ Move focus to next visible node             │
│ ↑ ArrowUp    │ Move focus to previous visible node         │
│ → ArrowRight │ Expand closed dir / focus first child       │
│ ← ArrowLeft  │ Collapse open dir / focus parent            │
│ Home         │ Focus first node in tree                    │
│ End          │ Focus last visible node in tree             │
│ Enter        │ Activate node (toggle expand / open file)   │
│ Space        │ Toggle selection (multi-select mode)        │
│ * (asterisk) │ Expand all siblings at current level        │
│ Type char    │ Focus next node starting with that char     │
└──────────────┴────────────────────────────────────────────┘

REQUIRED ARIA ATTRIBUTES:
├── Tree container: role="tree"
├── Each node: role="treeitem"
├── Directory: aria-expanded="true/false"
├── Nested list: role="group"
├── Level: aria-level="1/2/3..."
├── Position: aria-setsize + aria-posinset
└── Selected: aria-selected="true/false"
```

---

### Mistake 41: Dùng Index làm Key trong Dynamic Lists

**❌ SAI — Index key với danh sách thay đổi:**

```tsx
function FileList({ fileList }: Props) {
  const sorted = sortItems(fileList);

  return (
    <ul>
      {sorted.map((file, index) => (
        // ❌ Index as key!
        <FileObject key={index} file={file} />
      ))}
    </ul>
  );
}
```

**Tại sao index key gây bug CỤ THỂ với File Explorer:**

```
SCENARIO: User sorts, then expands a directory

BEFORE SORT (by name, A-Z):
key=0: 📁 Api (expanded ✅)
key=1: 📁 Components
key=2: 📄 README.md

AFTER SORT (by type, dirs first, then files differently):
key=0: 📁 Components  ← React thinks: "key=0 = same component!"
key=1: 📁 Api          ← React thinks: "key=1 = same component!"
key=2: 📄 README.md

RESULT:
├── Components has Api's expanded state! (WRONG!)
├── Api lost its expanded state! (BUG!)
├── Internal state (expanded, selected) follows KEY, not data
├── User sees wrong directory expanded → confused

WITH UNIQUE IDs:
key="api": 📁 Api (expanded ✅) → still expanded after sort ✅
key="comp": 📁 Components → still collapsed ✅
key="readme": 📄 README.md → unchanged ✅
```

**✅ ĐÚNG — Always use unique, stable IDs:**

```tsx
function FileList({ fileList }: Props) {
  const sorted = sortItems(fileList);

  return (
    <ul>
      {sorted.map((file) => (
        // ✅ Unique ID that follows the data, not position
        <FileObject key={file.id} file={file} />
      ))}
    </ul>
  );
}

// If data doesn't have IDs, generate them on load:
function addIds(files: FileData[], parentPath = ""): FileData[] {
  return files.map((file) => {
    const path = `${parentPath}/${file.name}`;
    return {
      ...file,
      id: generateStableId(path), // hash of path = stable
      children: file.children ? addIds(file.children, path) : undefined,
    };
  });
}
```

**Key strategy comparison:**

```
┌──────────────────┬───────────┬────────────┬────────────────┐
│ Key Type         │ Reorder   │ Insert/Del │ Duplicate Name │
├──────────────────┼───────────┼────────────┼────────────────┤
│ key={index}      │ ❌ Bug    │ ❌ Bug     │ ✅ OK          │
│ key={file.name}  │ ✅ OK     │ ✅ OK      │ ❌ Bug         │
│ key={file.id}    │ ✅ OK     │ ✅ OK      │ ✅ OK          │
│ key={file.path}  │ ✅ OK     │ ✅ OK      │ ✅ OK (unique) │
└──────────────────┴───────────┴────────────┴────────────────┘
```

---

### Mistake 42: Không Cleanup Timers/Subscriptions trong Callbacks

**❌ SAI — Timer leak trong event handler:**

```tsx
function FileObject({ file }: Props) {
  const [showActions, setShowActions] = useState(false);

  const handleMouseEnter = () => {
    // ❌ Timer created every hover, never cleared!
    setTimeout(() => {
      setShowActions(true);
    }, 500); // Delay before showing actions
  };

  const handleMouseLeave = () => {
    setShowActions(false);
  };

  // PROBLEM: User hovers in/out rapidly
  // Enter (500ms timer starts) → Leave (500ms) → Enter → Leave
  // Timer fires → setShowActions(true) AFTER mouse already left!
  // Actions appear when mouse is not hovering → broken UX
}
```

**✅ ĐÚNG — Track and cleanup timers:**

```tsx
function FileObject({ file }: Props) {
  const [showActions, setShowActions] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    // ✅ Clear any existing timer before creating new one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setShowActions(true);
      timerRef.current = null;
    }, 500);
  };

  const handleMouseLeave = () => {
    // ✅ Clear timer on leave
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowActions(false);
  };

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {file.name}
      {showActions && <FileActions file={file} />}
    </div>
  );
}
```

**Common timer/subscription leaks:**

```
TIMERS IN CALLBACKS:
├── setTimeout without clearTimeout → fires after unmount
├── setInterval without clearInterval → runs forever
├── requestAnimationFrame without cancel → animation loop leak
├── debounce without cancel → delayed action on unmounted

SUBSCRIPTIONS IN CALLBACKS:
├── WebSocket opened in click handler → stays open
├── EventSource opened → stays open
├── Observer started in handler → keeps observing

FIX PATTERN:
1. Store reference in useRef
2. Clear previous before creating new
3. Clear on unmount via useEffect cleanup
4. Clear on relevant state changes
```

---

### Mistake 43: Missing TypeScript Generics cho Reusable Hooks

**❌ SAI — Hook chỉ hoạt động với 1 type:**

```tsx
// ❌ Only works with number keys
function useToggleSet() {
  const [set, setSet] = useState<Set<number>>(new Set());

  const toggle = (item: number) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  const has = (item: number) => set.has(item);

  return { toggle, has, set };
}

// ❌ Can't use for strings, objects, etc!
// useToggleSet<string>() → Error!
```

**✅ ĐÚNG — Generic hook:**

```tsx
// ✅ Works with ANY type
function useToggleSet<T>(initialValues?: Iterable<T>) {
  const [set, setSet] = useState<Set<T>>(() => new Set(initialValues));

  const toggle = useCallback((item: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }, []);

  const add = useCallback((item: T) => {
    setSet((prev) => new Set([...prev, item]));
  }, []);

  const remove = useCallback((item: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }, []);

  const has = useCallback((item: T) => set.has(item), [set]);

  const clear = useCallback(() => setSet(new Set()), []);

  return { toggle, add, remove, has, clear, set, size: set.size };
}

// Usage:
const expandedIds = useToggleSet<number>(); // For file IDs
const selectedTags = useToggleSet<string>(); // For tags
const selections = useToggleSet<FileData>(); // For objects

// TypeScript infers T from usage:
expandedIds.toggle(42); // ✅ number
expandedIds.toggle("hello"); // ❌ Error: string not number
selectedTags.toggle("react"); // ✅ string
```

**More generic hook examples:**

```tsx
// Generic useLocalStorage
function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // ...
}

// Generic useAsync
function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList,
): { data: T | null; loading: boolean; error: Error | null } {
  // ...
}

// Generic useSorted
function useSorted<T>(items: T[], compareFn: (a: T, b: T) => number): T[] {
  return useMemo(() => [...items].sort(compareFn), [items, compareFn]);
}
```

---

### Mistake 44: Overusing Ternary Operators

**❌ SAI — Nested ternaries unreadable:**

```tsx
function FileObject({ file, level, isSelected, isEditing }: Props) {
  return (
    <div
      className={
        // ❌ Deeply nested ternary — UNREADABLE!
        isEditing
          ? "file-editing"
          : isSelected
            ? level > 3
              ? "file-selected-deep"
              : "file-selected"
            : Boolean(file.children)
              ? "file-directory"
              : "file-item"
      }
    >
      {/* ❌ More nested ternaries for content */}
      {isEditing ? (
        <input defaultValue={file.name} />
      ) : isSelected ? (
        <strong>{file.name}</strong>
      ) : (
        file.name
      )}
    </div>
  );
}
```

**✅ ĐÚNG — Extract to clear logic:**

```tsx
// FIX 1: Helper function for className
function getFileClassName(
  file: FileData,
  level: number,
  isSelected: boolean,
  isEditing: boolean,
): string {
  if (isEditing) return "file-editing";
  if (isSelected) return level > 3 ? "file-selected-deep" : "file-selected";
  if (file.children) return "file-directory";
  return "file-item";
}

// FIX 2: Early return pattern for content
function FileContent({ file, isSelected, isEditing }: ContentProps) {
  if (isEditing) return <input defaultValue={file.name} />;
  if (isSelected) return <strong>{file.name}</strong>;
  return <>{file.name}</>;
}

// FIX 3: Clean component
function FileObject({ file, level, isSelected, isEditing }: Props) {
  const className = getFileClassName(file, level, isSelected, isEditing);

  return (
    <div className={className}>
      <FileContent file={file} isSelected={isSelected} isEditing={isEditing} />
    </div>
  );
}
```

**Ternary usage guide:**

```
TERNARY IS OK FOR:
✅ Simple A or B: {isDir ? '📁' : '📄'}
✅ Show or hide: {expanded ? <Children /> : null}
✅ Two values: style={{ color: active ? 'blue' : 'gray' }}

TERNARY IS BAD FOR:
❌ More than 2 branches → use if/else or switch
❌ Nested ternaries → extract to function
❌ Complex conditions → extract to variable
❌ Side effects → NEVER in ternary

RULE: If ternary is longer than ONE line, extract it.
```

---

### Mistake 45: Không Batch Related State Updates (Pre-React 18 Pattern)

**❌ SAI — Multiple related states updated separately:**

```tsx
function FileExplorer() {
  // ❌ 4 separate states that always change together!
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchFiles = async () => {
    setLoading(true); // Re-render 1
    setError(null); // Re-render 2 (React 17: separate!)

    try {
      const data = await fetch("/api/files").then((r) => r.json());
      setFiles(data); // Re-render 3
      setLastFetched(new Date()); // Re-render 4
    } catch (err) {
      setError(err.message); // Re-render 5
    }

    setLoading(false); // Re-render 6
    // React 17: 4-6 re-renders!
    // React 18: Batched → 2 re-renders (but still messy code)
  };
}
```

**✅ ĐÚNG — useReducer cho related state:**

```tsx
type FetchState = {
  files: FileData[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
};

type FetchAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: FileData[] }
  | { type: "FETCH_ERROR"; payload: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        files: action.payload,
        loading: false,
        lastFetched: new Date(),
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
  }
}

function FileExplorer() {
  const [state, dispatch] = useReducer(fetchReducer, {
    files: [],
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchFiles = async () => {
    dispatch({ type: "FETCH_START" }); // ✅ ONE dispatch = ALL related state

    try {
      const data = await fetch("/api/files").then((r) => r.json());
      dispatch({ type: "FETCH_SUCCESS", payload: data }); // ✅ ONE dispatch
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: err.message }); // ✅ ONE dispatch
    }
  };
}
```

**Khi nào dùng useState vs useReducer:**

```
useState:
├── 1-2 independent states
├── Simple updates (set value, toggle boolean)
├── States don't change together

useReducer:
├── 3+ related states that change together
├── Complex update logic (conditions, validations)
├── State transitions matter (loading → success/error)
├── Want to keep state logic testable (pure reducer)
├── Next state depends on multiple prev values
```

---

### Mistake 46: Wrong Children Type Checking

**❌ SAI — Sai cách check children type:**

```tsx
function FileList({ children }: { children: ReactNode }) {
  // ❌ typeof check on React elements!
  if (typeof children === "object") {
    // This is true for BOTH arrays and single elements!
  }

  // ❌ instanceof for React elements doesn't work
  if (children instanceof FileObject) {
    // React elements are NOT instances of components!
  }

  // ❌ Checking children.type directly
  React.Children.map(children, (child) => {
    if (child.type === FileObject) {
      // Works for direct usage, but breaks with HOCs, memo, forwardRef!
    }
  });
}
```

**✅ ĐÚNG — Proper children handling:**

```tsx
// APPROACH 1: Don't check children type — use props instead
interface FileListProps {
  fileList: FileData[]; // ✅ Explicit typed data, not children
  level: number;
}

function FileList({ fileList, level }: FileListProps) {
  return (
    <ul role="group">
      {fileList.map((file) => (
        <FileObject key={file.id} file={file} level={level} />
      ))}
    </ul>
  );
}

// APPROACH 2: Compound component with Context
const FileTreeContext = createContext<FileTreeContextType>(null!);

function FileTree({ children }: { children: ReactNode }) {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());

  return (
    <FileTreeContext.Provider value={{ expandedIds, setExpandedIds }}>
      <ul role="tree">{children}</ul>
    </FileTreeContext.Provider>
  );
}

function FileItem({ file }: { file: FileData }) {
  const { expandedIds } = useContext(FileTreeContext);
  // ✅ No type checking needed — context provides the contract
}

// Usage:
<FileTree>
  <FileItem file={file1} />
  <FileItem file={file2} />
</FileTree>;
```

**Rule:**

```
CHILDREN TYPE CHECKING:
❌ Don't check children's component type → fragile, breaks with HOCs
❌ Don't use instanceof → React elements are plain objects
❌ Don't check child.type → breaks with memo, forwardRef, lazy

✅ Use typed props instead of children for structured data
✅ Use Context for parent-child communication
✅ Use Compound Components pattern for flexible composition
✅ Use React.Children.count/map for simple iteration only
```

---

### Mistake 47: Ignoring Performance Profiler trước khi Optimize

**❌ SAI — Optimize dựa trên guess, không measure:**

```tsx
// "I think this is slow, let me add React.memo everywhere!"
const FileExplorer = React.memo(FileExplorer);
const FileList = React.memo(FileList);
const FileObject = React.memo(FileObject);
const FileIcon = React.memo(FileIcon);
const FileName = React.memo(FileName);
// + wrap every callback in useCallback
// + wrap every derived value in useMemo
// + 50 lines of optimization code added

// RESULT:
// ├── Component file doubled in size
// ├── Every prop needs useCallback/useMemo to not break memo
// ├── Dependency arrays everywhere → stale closure bugs
// ├── Actual performance gain: ~2ms (unnoticeable!)
// └── Dev time wasted: 2 hours optimizing nothing
```

**✅ ĐÚNG — Measure first, optimize second:**

```tsx
// STEP 1: Use React DevTools Profiler
// Record → interact → review flamegraph
// ONLY optimize components that:
// - Render > 16ms (blocks frame)
// - Re-render > 5 times unnecessarily
// - Appear in top of "ranked" render list

// STEP 2: Add React.Profiler to suspect components
function FileExplorer({ data }: Props) {
  return (
    <Profiler id="FileTree" onRender={onRenderCallback}>
      <FileList fileList={data} level={1} />
    </Profiler>
  );
}

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number, // ← TIME SPENT rendering
  baseDuration: number, // ← time without memoization
  startTime: number,
  commitTime: number,
) {
  if (actualDuration > 16) {
    console.warn(`[PERF] ${id} took ${actualDuration.toFixed(1)}ms (${phase})`);
  }
}

// STEP 3: Use why-did-you-render (dev dependency)
// npm install @welldone-software/why-did-you-render --save-dev
// Shows EXACTLY why each component re-rendered

// STEP 4: Use Chrome Performance tab
// Record → interact → analyze
// Look for long tasks (> 50ms yellow bars)
```

**Performance optimization checklist:**

```
BEFORE OPTIMIZING, ASK:
1. Is there ACTUALLY a perf problem? (measure!)
2. Can the user NOTICE it? (< 16ms = no)
3. What is the ROOT CAUSE? (don't guess!)
4. What is the SIMPLEST fix?

OPTIMIZATION ORDER (cheapest first):
1. Fix the bug → maybe you're rendering 1000x by mistake
2. Reduce work → filter/paginate data before rendering
3. Move state down → avoid re-rendering unrelated subtrees
4. Lazy rendering → only render visible nodes
5. React.memo → skip re-renders of unchanged subtrees
6. useMemo/useCallback → stabilize references
7. Virtualization → only render viewport items (react-window)
8. Web Workers → offload heavy computation
```

---

### Mistake 48: Không Test Edge Cases cho Tree Structures

**❌ SAI — Chỉ test happy path:**

```tsx
test("renders file tree", () => {
  render(<FileExplorer data={sampleData} />);
  expect(screen.getByText("Documents")).toBeInTheDocument();
  // ✅ But only tests ONE scenario!
});
```

**✅ ĐÚNG — Comprehensive edge case testing:**

```tsx
// EDGE CASE 1: Empty tree
test("renders empty state for empty array", () => {
  render(<FileExplorer data={[]} />);
  expect(screen.getByText(/no files/i)).toBeInTheDocument();
});

// EDGE CASE 2: Single file (no directories)
test("renders single file without expand button", () => {
  render(<FileExplorer data={[{ id: 1, name: "README.md" }]} />);
  expect(screen.getByText("README.md")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toHaveAttribute("aria-expanded");
});

// EDGE CASE 3: Empty directory
test("handles directory with empty children array", () => {
  const data = [{ id: 1, name: "Empty", children: [] }];
  render(<FileExplorer data={data} />);
  const button = screen.getByText("Empty");
  fireEvent.click(button);
  // Should expand but show nothing (or "empty folder" message)
});

// EDGE CASE 4: Deeply nested (5+ levels)
test("renders deeply nested structures", () => {
  const deepData = createDeepTree(10); // 10 levels deep
  render(<FileExplorer data={deepData} />);
  // Expand all levels and verify last node is reachable
});

// EDGE CASE 5: Duplicate names
test("handles duplicate file names at same level", () => {
  const data = [
    { id: 1, name: "config.ts" },
    { id: 2, name: "config.ts" }, // Same name, different id
  ];
  render(<FileExplorer data={data} />);
  const items = screen.getAllByText("config.ts");
  expect(items).toHaveLength(2);
});

// EDGE CASE 6: Special characters in names
test("renders files with special characters", () => {
  const data = [
    { id: 1, name: "file (copy).txt" },
    { id: 2, name: "日本語ファイル.pdf" },
    { id: 3, name: "file<script>alert(1)</script>.js" },
  ];
  render(<FileExplorer data={data} />);
  // Should render without XSS or broken HTML
  expect(screen.getByText("file (copy).txt")).toBeInTheDocument();
});

// EDGE CASE 7: Rapid toggle
test("handles rapid expand/collapse clicks", async () => {
  const user = userEvent.setup();
  render(<FileExplorer data={dirData} />);
  const folder = screen.getByText("Documents");

  // Click 10 times rapidly
  for (let i = 0; i < 10; i++) {
    await user.click(folder);
  }

  // Even number of clicks → should be collapsed
  expect(folder).toHaveAttribute("aria-expanded", "false");
});

// EDGE CASE 8: Very long file names
test("truncates very long file names", () => {
  const data = [{ id: 1, name: "a".repeat(500) + ".txt" }];
  render(<FileExplorer data={data} />);
  const item = screen.getByRole("treeitem");
  // Should not overflow container
  expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth + 1);
});
```

**Edge case checklist cho Tree:**

```
DATA EDGE CASES:
├── Empty array []
├── Single item [file]
├── Single directory with children
├── Empty directory (children: [])
├── Deep nesting (10+ levels)
├── Wide tree (1000+ siblings)
├── Duplicate names at same level
├── Special characters (unicode, HTML, spaces)
├── Very long file names (500+ chars)
├── null/undefined in children array
└── Circular references (if possible)

INTERACTION EDGE CASES:
├── Rapid clicking (debounce/race conditions)
├── Click during animation
├── Expand while loading (lazy)
├── Keyboard navigation at boundaries (first/last)
├── Tab order after expand/collapse
├── Select during rename
└── Delete expanded directory

RENDER EDGE CASES:
├── Initial render performance (1000+ nodes)
├── Re-render after sort change
├── Re-render after search filter
├── Window resize (responsive)
├── Theme change (dark/light)
└── Mount/unmount cycle (memory leaks)
```

---

## PHẦN D: INTERVIEW TIPS & TALKING POINTS

> 🎯 Những điểm quan trọng cần nhấn mạnh khi trình bày.

### 1. Cách Mở Đầu (First 2 Minutes)

**Làm:**

```
"Đây là bài toán recursive tree rendering với expand/collapse.
Key considerations:
1. Recursive component pattern — FileObject renders FileList
2. Local state per directory — no global state needed
3. Sorting: directories first, then files, alphabetically
4. Proper semantic HTML cho accessibility

Tôi sẽ dùng 3 components:
- FileExplorer: entry point
- FileList: sorting + rendering
- FileObject: individual item behavior"
```

**Đừng:**

```
"OK let me start coding..."
→ Không show thinking process, no architecture discussion
```

---

### 2. Key Talking Points

| Khi             | Nói                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Define types    | "Recursive type — FileData references itself. children optional để distinguish file vs directory"    |
| FileObject      | "Local useState cho expand/collapse — no state coordination needed, unlike checkboxes"               |
| FileList        | "Partition-sort-merge: directories filtered, sorted, then files filtered, sorted, then concatenated" |
| Sorting         | "localeCompare cho proper Unicode handling versus simple string comparison"                          |
| CSS indentation | "Nested `<ul>` padding creates automatic indentation — each level adds 16px"                         |
| State decision  | "Local because expand/collapse is isolated per directory — no bidirectional propagation"             |

---

### 3. Handle Follow-up Questions

| Câu hỏi                      | Trả lời                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| "Expand all / Collapse all?" | "Lift state to Set\<id\>. Context API hoặc prop drilling."                          |
| "Search/filter files?"       | "Recursive filter tree — show node if name matches OR has descendant that matches." |
| "10,000 files?"              | "Virtualization — flatten visible nodes to array, render only viewport."            |
| "Drag & drop reorder?"       | "dnd-kit. Update tree data when drop. Recalculate sort order."                      |
| "Context menu?"              | "Right-click handler → show dropdown with actions (rename, delete, create)."        |
| "File icons?"                | "Map file extension → icon component. Or use file-type-icons library."              |
| "Lazy load subdirectories?"  | "children: null initially. Expand triggers fetch. Loading state per directory."     |
| "Keyboard navigation?"       | "Arrow keys navigate, Enter expands/collapses, Home/End jump to first/last."        |

---

### 4. Time Management (45 min)

```
┌──────────────────────────────────────────────────────────────┐
│  INTERVIEW TIMELINE                                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  0-3 min: Clarify requirements                                │
│  ├── Tree depth? Sort order? Empty directories?               │
│  └── "Should files be clickable?"                            │
│                                                               │
│  3-7 min: High-level design                                   │
│  ├── Component structure (3 components)                       │
│  ├── State strategy (local expand/collapse)                   │
│  └── Sorting strategy (partition + sort)                      │
│                                                               │
│  7-30 min: Implementation                                     │
│  ├── Types (2 min)                                            │
│  ├── FileExplorer root (2 min)                                │
│  ├── FileObject with expand/collapse (8 min)                  │
│  ├── FileList with sorting (8 min)                            │
│  └── CSS (3 min)                                              │
│                                                               │
│  30-38 min: Testing & edge cases                              │
│  ├── Walk through with example data                           │
│  └── Empty directories, deep nesting                          │
│                                                               │
│  38-45 min: Improvements & Q&A                                │
│  ├── Performance, a11y, features                              │
│  └── Answer follow-up questions                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 5. Demonstrating Seniority

> 💡 Signals interviewers look for at each level.

**Junior (L3-L4):**

```
- Code works, renders tree ✅
- Basic expand/collapse ✅
- May miss sorting requirement
- No accessibility mentions
```

**Mid (L4-L5):**

```
- Correct sorting (dirs first) ✅
- Clean TypeScript ✅
- Mentions performance
- Mentions edge cases
```

**Senior (L5-L6):**

```
- Discusses WHY local state (vs global alternatives)
- Proactive about trade-offs: "Partition sort readable, single sort performant"
- Mentions a11y: ARIA tree pattern, keyboard nav
- Production concerns: error boundaries, loading states
- "This component fits into larger pattern — file browsers, tree views,
   navigation menus all share same recursive structure"
```

**Staff+ (L6+):**

```
- Architectural framing: "Same pattern as VS Code file tree,
   Finder sidebar, IDE project panel"
- Component library design: "Expose headless hook useFileTree + styled preset"
- Cross-cutting: "Integrate with drag-and-drop, context menus,
   keyboard shortcuts, search"
- Impact: "Good tree navigation reduces file discovery time —
   measurable in IDE/dashboard contexts"
```

---

### 6. Comparison with Nested Checkboxes

> 🔀 Interviewer may ask "How is this different from nested checkboxes?"

```
"Great question. Key differences:

1. STATE SCOPE:
   Checkboxes → Global (root owns all state)
   File Explorer → Local (each directory owns its expand state)

2. STATE PROPAGATION:
   Checkboxes → Bidirectional (click child → update ancestors)
   File Explorer → None (toggle is isolated)

3. COMPLEXITY:
   Checkboxes → High (3 states × propagation × consistency)
   File Explorer → Medium (sorting + recursive render)

4. KEY CHALLENGE:
   Checkboxes → State consistency (indeterminate logic)
   File Explorer → Sorting strategy (dirs first + alphabetical)

5. SHARED PATTERN:
   Both → Recursive component rendering
   Both → Tree data structure
   Both → TypeScript recursive types
   Both → Conditional child rendering

The recursive rendering is identical.
The state management is fundamentally different."
```

---

### 7. Architecture Discussion

**Q: "Design this as a library component"**

```tsx
// Level 1: Simple usage
<FileTree data={files} />

// Level 2: Controlled
<FileTree
  data={files}
  expandedIds={expanded}
  onToggle={(id) => setExpanded(prev => ...)}
  onFileClick={(file) => openFile(file)}
/>

// Level 3: Full customization
<FileTree
  data={files}
  renderItem={({ item, isDirectory, expanded, depth, toggle }) => (
    <div style={{ paddingLeft: depth * 20 }}>
      {isDirectory && <button onClick={toggle}>{expanded ? '▼' : '▶'}</button>}
      <FileIcon extension={item.name.split('.').pop()} />
      <span>{item.name}</span>
    </div>
  )}
/>

// Level 4: Headless
const tree = useFileTree({
  data: files,
  defaultExpanded: [1, 5],
});
// tree.visibleItems, tree.toggle(id), tree.expandAll(), etc.
```

---

### 8. Performance Discussion

```
"Scaling considerations:

Small (< 100 files): Current approach perfect
- Local state, sort per render, recursive render

Medium (100-1K files): useMemo for sort
- Memoize sorted list
- React.memo for FileObject
- Still render all visible

Large (1K-10K files): Virtualization
- Flatten visible tree to array
- react-window renders only viewport
- Keep expand/collapse tracking centralized

Massive (> 10K files): Server-side
- Lazy load directory contents
- Server sorts + paginates
- Client renders current view only"
```

---

### 9. Live Coding Recovery

**If stuck on sort:**

```
"Let me think about the sort step by step:
1. I need directories before files
2. Both groups sorted alphabetically
3. Approach: filter into two arrays, sort each, concatenate
Let me write that..."
```

**If stuck on recursion:**

```
"The recursion terminates when:
- FileObject has no children (is a file)
- FileObject is collapsed (doesn't render FileList)
So base case is: leaf node or collapsed directory."
```

---

### 10. Complete Cheat Sheet

```
╔══════════════════════════════════════════════════════════════╗
║              FILE EXPLORER — CHEAT SHEET                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  DATA TYPE:                                                  ║
║  type FileData = Readonly<{                                  ║
║    id: number;                                               ║
║    name: string;                                             ║
║    children?: ReadonlyArray<FileData>;                       ║
║  }>;                                                         ║
║                                                              ║
║  3 COMPONENTS:                                               ║
║  1. FileExplorer → entry point, passes data to FileList      ║
║  2. FileList     → sort (dirs first) + recursive render      ║
║  3. FileObject   → expand/collapse with local useState       ║
║                                                              ║
║  SORTING STRATEGY:                                           ║
║  1. Filter directories (has children)                        ║
║  2. Filter files (no children)                               ║
║  3. Sort each group: localeCompare                           ║
║  4. Merge: [...directories, ...files]                        ║
║                                                              ║
║  FILE vs DIRECTORY:                                          ║
║  const isDirectory = Boolean(file.children);                 ║
║  // children: [] → directory (empty)                         ║
║  // children: undefined → file                               ║
║                                                              ║
║  STATE:                                                      ║
║  - LOCAL per directory: useState(false)                      ║
║  - No state propagation needed                               ║
║  - Toggle: setExpanded(!expanded)                            ║
║                                                              ║
║  INDENTATION:                                                ║
║  - CSS: .file-list { padding-left: 16px }                    ║
║  - Nested <ul> auto-indents each level                       ║
║                                                              ║
║  KEY DIFFERENCES FROM CHECKBOXES:                            ║
║  - Local state (not global)                                  ║
║  - No propagation (not bidirectional)                        ║
║  - Sorting logic (not state logic)                           ║
║  - 2 states (not 3)                                          ║
║                                                              ║
║  FOLLOW-UPS:                                                 ║
║  - Expand all? → Set<id> + Context                           ║
║  - Search?     → Recursive filter, keep ancestors            ║
║  - 10K files?  → Virtualization + flatten                    ║
║  - Lazy load?  → children: null, fetch on expand             ║
║  - Keyboard?   → Arrow keys, ARIA tree pattern               ║
║                                                              ║
║  REMEMBER:                                                   ║
║  ★ Sort: directories first, then files                       ║
║  ★ isDirectory = Boolean(children), not length > 0           ║
║  ★ Local state = simpler than global                         ║
║  ★ <button> not <div> for accessibility                      ║
║  ★ .filter() creates new array → safe to .sort()             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 11. Cách Giải Thích Trade-offs (The "It Depends" Framework)

**Interviewer thường hỏi:** "Tại sao chọn approach này thay vì approach khác?"

**❌ SAI — Trả lời một chiều:**

```
"Tôi dùng useState vì nó simple."
→ Thiếu depth, không show critical thinking
```

**✅ ĐÚNG — Trade-off Analysis Framework:**

```
TEMPLATE: "I chose [A] over [B] because [reason].
           However, if [condition], I'd switch to [B]."

EXAMPLE 1 — State Management:
"I'm using local useState for expand/collapse because each node's
state is independent — no node needs to know about another.

If the requirements included 'Expand All' or 'Collapse All',
I'd lift state to the parent with a Set<number> for expandedIds.

If we added search with auto-expand matching paths, I'd use
Context or useReducer for coordinated state updates."

EXAMPLE 2 — Rendering Strategy:
"I'm rendering recursively because it mirrors the data structure
and is the most readable approach for tree UIs.

If we hit 10,000+ nodes, I'd switch to iterative with
flattened array + react-window for virtualization.

The trade-off: iterative is harder to read but O(viewport)
instead of O(total nodes) for render cost."

EXAMPLE 3 — CSS Strategy:
"Plain CSS classes for interview speed. In production, I'd use
CSS Modules — same performance, zero naming conflicts,
automatic tree-shaking of unused styles."
```

**Trade-off Matrix cho File Explorer:**

```
┌────────────────────┬──────────────────────┬──────────────────────┐
│ Decision           │ MVP Choice            │ Scale Choice          │
├────────────────────┼──────────────────────┼──────────────────────┤
│ State              │ Local useState        │ Context / Zustand     │
│ Rendering          │ Recursive components  │ Iterative + virtual   │
│ Sorting            │ Inline .sort()        │ useMemo + Web Worker  │
│ CSS                │ Flat classes          │ CSS Modules           │
│ Types              │ Inferred children?    │ Discriminated union   │
│ Testing            │ RTL integration       │ + Unit + Visual       │
│ Error handling     │ try/catch             │ ErrorBoundary + toast │
│ Accessibility      │ Semantic HTML         │ Full WAI-ARIA tree    │
│ Data fetching      │ useEffect + fetch     │ React Query / SWR     │
│ Key generation     │ API-provided id       │ Stable hash of path   │
└────────────────────┴──────────────────────┴──────────────────────┘
```

---

### 12. System Design Extension Discussion

**Khi interviewer hỏi:** "How would you scale this?"

**Prepared answers cho từng concern:**

```
📊 PERFORMANCE SCALING:
Q: "What if the tree has 100K nodes?"
A: "Three-layer approach:
    1. Virtualization (react-window) → only render viewport
    2. Lazy loading → fetch children on expand
    3. Web Worker → offload sorting/filtering to background thread

    With virtualization alone, we go from rendering 100K DOM nodes
    to ~50 viewport items. That's a 2000x reduction."

🔄 FEATURE SCALING:
Q: "How would you add drag-and-drop?"
A: "I'd use react-dnd or dnd-kit library, not roll my own.
    Key changes:
    1. Add DndProvider wrapper at root
    2. Each FileObject becomes both drag source AND drop target
    3. On drop: update data structure (move node in tree)
    4. Validate: can't drop parent INTO its own child (cycle!)
    5. Visual: show drop indicator line between items"

🔍 SEARCH:
Q: "How would you add search?"
A: "Two modes:
    1. Filter mode: Hide non-matching nodes, auto-expand parents
       → Recursive filter that preserves path to matching nodes
    2. Highlight mode: Show all, highlight matches
       → Simpler: just add CSS class on matching name

    Debounce input (300ms), useMemo for filtered result.
    With 100K nodes: move filter to Web Worker."

📝 EDIT/RENAME:
Q: "How would you add inline editing?"
A: "Double-click → replace file name with <input>
    1. Local state: isEditing per FileObject
    2. On blur or Enter: commit rename
    3. On Escape: cancel rename
    4. Validation: no empty names, no duplicates at same level
    5. Optimistic update → revert on API error"

💾 PERSISTENCE:
Q: "How to remember expanded state across page reloads?"
A: "Three options in order of complexity:
    1. URL params: ?expanded=1,3,7 (shareable!)
    2. localStorage: JSON.stringify(expandedIds)
    3. Server-side: save to user preferences API

    I'd go with URL params first — it makes the tree state
    shareable and works with browser back/forward."
```

---

### 13. Debugging Live Under Pressure

**Situation:** Code doesn't render correctly during interview.

**Framework: CALM Method**

```
C — CONFIRM the problem
    "Let me check what's actually happening..."
    → Read the error message out loud
    → Check console for warnings/errors
    → console.log the data to verify structure

A — ANALYZE root cause
    "The issue seems to be..."
    → Is it a data problem? (wrong shape, missing field)
    → Is it a render problem? (wrong condition, missing key)
    → Is it a state problem? (stale closure, wrong update)

L — LOCATE the fix
    "I think the fix is in..."
    → Narrow down to specific component
    → Check props being passed
    → Verify state transitions

M — MAKE the fix (and explain)
    "I'm going to change... because..."
    → Make ONE change at a time
    → Explain why this should fix it
    → Verify it works
```

**Common interview bugs and instant fixes:**

```
BUG → FIX (say it out loud while fixing)

1. "Nothing renders"
   → Check: data passed correctly? (console.log props)
   → Check: conditional rendering blocking? (if/return null)
   → Check: key prop typo? (key vs keys)

2. "List renders but toggle doesn't work"
   → Check: onClick on right element?
   → Check: state update correct? (prev => !prev)
   → Check: reading expanded in render?

3. "Children render but not nested"
   → Check: passing file.children (not file)?
   → Check: level+1 for indentation?
   → Check: FileList renders recursively?

4. "Sort doesn't work"
   → Check: mutating original array? (need [...arr].sort())
   → Check: localeCompare correct? (a.name.localeCompare(b.name))
   → Check: sorting inside useMemo/render?

5. "Expand one = expands all"
   → Check: useState is INSIDE FileObject (not shared)?
   → Check: key prop is unique per item?
   → Fix: Each FileObject manages own `expanded` state
```

**💬 What to say when stuck:**

```
GOOD:
"Let me think about this for a moment..."
"I know the issue is related to [area], let me trace through..."
"I've seen this pattern before — it's usually caused by [X]"
"Let me add a console.log to verify my hypothesis..."

BAD:
(Silent panic)
"I don't know..."
"This should work, I don't understand..."
Random changes without explaining
```

---

### 14. Answering "Why Not X?" Questions

**Template for every "Why didn't you use X?" question:**

```
STEP 1: Acknowledge X is valid
"Great question — [X] is definitely a valid approach."

STEP 2: Explain your reasoning
"I chose [Y] because [specific reason for this context]."

STEP 3: Describe when X is better
"I'd switch to [X] if [condition]."
```

**Prepared answers:**

```
Q: "Why not Redux/Zustand?"
A: "Redux is great for app-wide state that multiple unrelated
   components need. Here, expand/collapse is purely local —
   no other component cares if a directory is expanded.

   I'd add Zustand if we needed: cross-component selection,
   undo/redo, or middleware for logging/persistence."

Q: "Why not CSS-in-JS (Styled Components)?"
A: "Styled Components add runtime overhead — each render
   processes template literals. For a tree with 1000 nodes,
   that adds up. Static CSS classes have zero runtime cost.

   I'd use CSS-in-JS if we needed: theme-dependent styles
   that change dynamically, or a component library with
   variant prop patterns."

Q: "Why not useReducer instead of useState?"
A: "useState is simpler for single boolean toggle (expanded).
   The state update is just `prev => !prev` — no complex logic.

   I'd upgrade to useReducer if we added: multi-select,
   drag-and-drop reordering, or expand-all/collapse-all where
   multiple state values change together atomically."

Q: "Why not server components?"
A: "File Explorer is highly interactive — expand/collapse,
   keyboard navigation, possibly drag-and-drop. These require
   client-side state and event handlers.

   I'd use Server Components for the data fetching layer —
   fetch the file tree on the server, pass as props to the
   client-side interactive tree component."

Q: "Why not virtualization from the start?"
A: "For trees under 1000 visible nodes, DOM updates are under
   16ms — no perceptible lag. Virtualization adds complexity:
   dynamic row heights, keyboard navigation changes,
   accessibility impacts.

   I'd add react-window if profiling shows render time > 16ms
   or if the spec requires 10K+ nodes."

Q: "Why not TypeScript enums?"
A: "TypeScript enums have quirks: they generate runtime code,
   reverse mapping can leak, and string enums aren't narrowable
   with `in` operator. I prefer `as const` objects or
   union literal types — zero runtime cost, better narrowing."
```

---

### 15. Demonstrating Growth Mindset

**Interviewer đánh giá cao khi bạn:**

```
1. ACKNOWLEDGE LIMITATIONS
   "This MVP has [limitation]. In production, I'd address it by..."
   "I'm aware this approach has O(n²) for expand-all.
    Here's how I'd optimize if profiling confirms it's a bottleneck..."

2. SHOW LEARNING TRAJECTORY
   "I recently learned about [technique] and considered it here.
    I decided not to use it because [reason], but it'd be
    appropriate for [different scenario]."

   Example: "I've been exploring React Server Components —
   for this tree, the data fetch could be a Server Component
   while the interactive parts stay client-side."

3. ASK CLARIFYING QUESTIONS (shows you don't assume)
   "Before I start coding, can I clarify:
    - Should the tree support multi-select?
    - Is the data loaded all at once or lazy-loaded per directory?
    - What's the expected scale? Hundreds or thousands of nodes?
    - Do we need drag-and-drop?"

4. PROACTIVE IMPROVEMENT SUGGESTIONS
   "While implementing, I noticed we could improve UX by:
    - Adding keyboard shortcuts (already using <button> so free!)
    - Showing file count badge on directories
    - Adding smooth expand/collapse animation
    - Remembering expanded state across sessions"

5. REFERENCE REAL EXPERIENCE
   "In my previous project, we had a similar tree component.
    We started simple like this and later added [X] when
    requirements grew. That experience informed my decision
    to keep the initial implementation flexible."
```

---

### 16. Code Review Simulation

**Interviewer sometimes asks:** "How would you review this code?"

**Structured review approach:**

```
LAYER 1: CORRECTNESS (Does it work?)
├── Does it handle all data shapes? (empty, single, nested)
├── Are there edge cases missing? (null children, duplicate names)
├── Is state managed correctly? (no stale closures)
├── Do keys prevent render bugs? (unique, stable)
└── Are there race conditions? (rapid clicks, concurrent updates)

LAYER 2: READABILITY (Can others understand it?)
├── Clear naming? (isDirectory vs d, handleClick vs fn)
├── Consistent conventions? (PascalCase components, camelCase vars)
├── Right abstractions? (not too many files, not god components)
├── Comments where necessary? (WHY, not WHAT)
└── Reasonable function length? (< 30 lines ideal)

LAYER 3: PERFORMANCE (Is it efficient?)
├── Unnecessary re-renders? (stable references, memo where needed)
├── Expensive computations memoized? (sort/filter with useMemo)
├── Memory leaks? (cleanup in useEffect)
├── Bundle size impact? (no massive library for small feature)
└── Render complexity? (O(visible) not O(total))

LAYER 4: ACCESSIBILITY + UX
├── Semantic HTML? (button, ul/li, role="tree")
├── Keyboard navigable? (Tab, Enter, Arrow keys)
├── Screen reader friendly? (aria-expanded, aria-level)
├── Error states? (loading, error, empty)
└── Responsive? (works on mobile)

LAYER 5: MAINTAINABILITY
├── Easy to add features? (search, DnD, lazy loading)
├── Easy to test? (pure components, injectable deps)
├── TypeScript strict? (no `any`, proper generics)
├── Consistent with codebase patterns?
└── Documentation where needed?
```

**💬 Example code review comment format:**

```
// During interview, verbalize like:

"Looking at FileList, I'd flag one thing in code review:
the sort is happening on every render without useMemo.
For small lists it's fine, but I'd add useMemo with [fileList]
deps to memoize the sorted result."

"I like that FileObject uses <button> for accessibility —
that's something I'd specifically praise in a review."

"One concern: the onClick inline arrow function creates a
new reference each render. For this MVP it's fine since
we're not using React.memo, but I'd note it for future."
```

---

### 17. Accessibility Talking Points

**Interviewer signals:** "Tell me about accessibility" hoặc "How would you make this accessible?"

**Structured response (3 levels):**

```
LEVEL 1: FREE (Already doing it right)
├── Using <button> instead of <div> → focusable, Enter/Space works
├── Using <ul>/<li> → semantic list structure
├── Proper heading hierarchy → screen reader navigation
├── Color contrast → readable text (4.5:1 ratio minimum)
├── Focus visible → outline:auto on focus (don't remove!)

LEVEL 2: MODERATE EFFORT
├── role="tree" on container
├── role="treeitem" on each node
├── aria-expanded="true/false" on directories
├── aria-level for depth indication
├── aria-setsize + aria-posinset for position info
├── Arrow key navigation (↑↓←→)
├── Type-ahead: press letter to jump to matching node

LEVEL 3: FULL WAI-ARIA TreeView
├── Roving tabindex (only 1 item focusable at a time)
├── Home/End keys → first/last node
├── Asterisk (*) → expand all siblings
├── Focus management after expand/collapse
├── aria-grabbed + aria-dropeffect for DnD
├── Live region announcements for state changes
├── High contrast mode support
├── Reduced motion preference (@media query)
```

**Key ARIA attributes explained:**

```tsx
<ul role="tree" aria-label="File Explorer">     {/* Container */}
  <li role="treeitem"                            {/* Each node */}
      aria-expanded={isDir ? expanded : undefined}  {/* Dir state */}
      aria-level={level}                         {/* Depth */}
      aria-setsize={siblings.length}             {/* Total siblings */}
      aria-posinset={index + 1}                  {/* Position */}
      aria-selected={isSelected}                 {/* Selection */}
  >
    <button tabIndex={isFocused ? 0 : -1}>       {/* Roving tabindex */}
      {file.name}
    </button>
    {expanded && (
      <ul role="group">                          {/* Nested group */}
        {children}
      </ul>
    )}
  </li>
</ul>

// Screen reader announces:
// "Documents, folder, expanded, 1 of 5, level 1, tree"
// → User knows: name, type, state, position, depth, context
```

---

### 18. State Management Escalation Narrative

**Khi interviewer hỏi:** "Walk me through how state management evolves."

**The Escalation Story (tell like a journey):**

```
CHAPTER 1: Simple File Explorer (MVP)
"Each directory manages its own expanded state with useState.
 This works because expand/collapse is purely local — no node
 cares about another node's state."

  FileObject → useState(false) → expanded/collapsed
  Zero coordination needed. Zero props drilling.

CHAPTER 2: Adding "Expand All / Collapse All"
"Now we need coordination. One button affects ALL directories.
 I lift expandedIds to the parent as Set<number>.
 Pass toggle function down via props."

  FileExplorer → useState(Set<number>)
  Pass down: toggle(id) and expandedIds.has(id)
  Props drilling: 2 levels deep → still manageable.

CHAPTER 3: Adding Search with Auto-Expand
"Search matches need to auto-expand parent paths. Now I need:
 - Search state
 - Expanded state (affected by search)
 - Filtered results (derived state)

 Multiple states interact → useReducer."

  FileExplorer → useReducer(treeReducer, initialState)
  Actions: TOGGLE, EXPAND_ALL, SEARCH, CLEAR_SEARCH
  Derived: filteredTree = useMemo(filter(data, query))

CHAPTER 4: Adding Multi-Select + Context Menu
"Multiple components need selection state:
 - FileObject: needs isSelected for styling
 - Toolbar: needs selectedCount for enable/disable
 - ContextMenu: needs selectedFiles for actions

 Props drilling gets painful → Context API."

  TreeProvider → Context(expandedIds, selectedIds, dispatch)
  All descendants consume via useContext(TreeContext)
  Split: TreeStateContext + TreeActionsContext (perf)

CHAPTER 5: Adding Undo/Redo + Persistence
"Now we need state history and side effects:
 - State snapshots for undo/redo
 - Middleware for localStorage persistence
 - Middleware for API sync

 This is where Zustand/Redux earns its complexity cost."

  const useTreeStore = create(
    persist(
      immer((set) => ({
        expandedIds: new Set(),
        selectedIds: new Set(),
        toggle: (id) => set(state => { ... }),
        undo: () => set(state => { ... }),
      })),
      { name: 'file-tree' }
    )
  )

LESSON:
"Start with the simplest solution that works.
 Upgrade when the CURRENT solution causes pain.
 Never add complexity for FUTURE requirements."
```

---

### 19. Testing Strategy Narrative

**Khi interviewer hỏi:** "How would you test this?"

**The Testing Pyramid for File Explorer:**

```
         ╱╲        E2E Tests (Cypress/Playwright)
        ╱  ╲       - Full tree interaction flow
       ╱    ╲      - Keyboard navigation end-to-end
      ╱──────╲     - 10% of test effort
     ╱        ╲
    ╱ Integra- ╲   Integration Tests (RTL)
   ╱   tion     ╲  - Component renders with data
  ╱               ╲ - Click expand/collapse
 ╱                 ╲ - Sort behavior
╱───────────────────╲ - 60% of test effort

╱                     ╲  Unit Tests (Vitest/Jest)
╱   Pure Functions     ╲ - sortItems()
╱                       ╲ - collectDirectoryIds()
╱─────────────────────────╲ - 30% of test effort
```

**What to test at each level:**

```
UNIT TESTS (fast, isolated, pure functions):
├── sortItems([...]) returns directories first, then files
├── sortItems([]) returns empty array (edge case)
├── sortItems handles duplicate names correctly
├── collectDirectoryIds returns all nested dir IDs
├── filterTree preserves path to matching nodes
├── isDirectory(file) returns correct boolean

INTEGRATION TESTS (component behavior):
├── FileExplorer renders all top-level items
├── Clicking directory toggles children visibility
├── Nested directories render at correct depth
├── Sort: directories appear before files
├── Empty directory shows empty state
├── Empty array shows "no files" message
├── Keys are unique (no console warnings)

E2E TESTS (user journeys):
├── User expands directory → sees children → collapses
├── User navigates tree with arrow keys
├── User searches and sees filtered results
├── User drags file to new directory (if DnD feature)
```

**💬 How to say it:**

```
"I prioritize integration tests because they test what the user
experiences. I'll use React Testing Library with user-event.

For the sort utility, I'll add unit tests since it's pure logic
that's easy to test in isolation.

I wouldn't write E2E tests for interview, but in production
I'd add Playwright tests for the full interaction flow."
```

---

### 20. Real-World War Stories Format

**Interviewer loves hearing:** "Tell me about a similar problem you've solved."

**STAR Format adapted for technical stories:**

```
S (Situation): "In my previous project, we had a [similar component]."
T (Task):      "We needed to [specific requirement]."
A (Action):    "I implemented [solution], choosing [approach] because..."
R (Result):    "The result was [measurable outcome]."

EXAMPLE STORIES:

STORY 1 — Performance:
S: "We had a tree component with ~5K nodes for a file manager."
T: "Initial render was 800ms — users complained about lag."
A: "I profiled with React DevTools, found we were rendering all
    nodes on mount. I added conditional rendering (only render
    children when expanded) and virtualization for directories
    with 500+ children."
R: "Initial render dropped to 50ms. Memory usage cut 80%.
    User satisfaction survey improved from 3.2 to 4.5/5."

STORY 2 — Architecture Decision:
S: "Our team debated Redux vs Context for a dashboard tree."
T: "We needed expand state, selection, and drag-and-drop."
A: "I proposed starting with Context + useReducer for V1,
    with the option to migrate to Zustand if needed.
    Three months in, Context handled everything."
R: "Saved ~2 weeks of Redux boilerplate. The team learned
    that simpler tools often suffice."

STORY 3 — Bug Fix:
S: "Users reported tree 'randomly' losing expanded state."
T: "Debug and fix the intermittent state reset."
A: "Traced to index-based keys. When parent directory was
    re-sorted after adding a file, React remounted components,
    losing internal state. Switched to path-based keys."
R: "Zero state loss reports after the fix. Added it to our
    team's code review checklist."
```

---

### 21. Whiteboard-to-Code Translation

**When interviewer says:** "Can you whiteboard the component structure first?"

**Quick diagram format:**

```
STEP 1: Data Shape (30 seconds)
┌─────────────────────────────────┐
│ FileData {                      │
│   id: number                    │
│   name: string                  │
│   children?: FileData[]  ← recursive! │
│ }                               │
└─────────────────────────────────┘

STEP 2: Component Tree (30 seconds)
FileExplorer (entry point)
  └── FileList (renders list)
        └── FileObject (renders item) ← recursive!
              ├── <button> (click to expand)
              └── FileList (children) ← calls parent!

STEP 3: State Flow (30 seconds)
┌────────────┐    data     ┌──────────┐  file[]  ┌────────────┐
│FileExplorer│ ──────────→ │ FileList  │ ──map──→ │ FileObject │
│            │             │ (sort)    │          │ (expand)   │
│ props.data │             │ level     │          │ useState   │
└────────────┘             └──────────┘          └────────────┘
                                                       │
                                              expanded? │
                                                       ▼
                                                  ┌──────────┐
                                                  │ FileList  │
                                                  │ (recurse) │
                                                  └──────────┘

STEP 4: Key decisions (annotate on whiteboard)
★ Sort: directories first → .filter() then .sort()
★ Expand: local useState per FileObject
★ Key: file.id (not index!)
★ Semantic: <ul>/<li>, <button> not <div>

"Let me now translate this into code..."
→ Start coding with confidence, structure is clear
```

---

### 22. Final Impression — Closing Strategy

**Sau khi code xong, đừng dừng — summarize:**

**30-Second Closing Statement:**

```
"Let me quickly summarize what I built and the decisions I made:

ARCHITECTURE:
Three components — FileExplorer as entry, FileList for sorting
and rendering lists, FileObject for individual items with
local expand/collapse state.

KEY DECISIONS:
1. Recursive rendering — mirrors the tree data structure
2. Local state — each directory manages its own expand
3. Derived type check — Boolean(children) instead of explicit type
4. Directories first sort — matches OS file explorer UX
5. Semantic HTML with <button> and <ul>/<li> for accessibility

IF I HAD MORE TIME, I'd add:
1. Keyboard navigation (arrow keys, Enter)  — 10 min
2. Search/filter with debounce              — 15 min
3. Loading skeleton for async data          — 5 min
4. React.memo + useMemo for performance     — 5 min
5. Comprehensive test suite with RTL        — 15 min

WHAT I'M PROUD OF:
The code is clean, readable, and ready to iterate on.
Adding search or drag-and-drop wouldn't require restructuring."
```

**Power phrases cho senior interviews:**

```
SHOWING DEPTH:
"The trade-off here is..."
"In production, I'd additionally..."
"I've seen this pattern break when..."
"The reason React handles it this way is..."

SHOWING COLLABORATION:
"I'd want to discuss with the team whether..."
"A code reviewer might flag this, and they'd be right..."
"From a design perspective, I'd suggest..."

SHOWING PRAGMATISM:
"For an MVP, this is sufficient. For scale..."
"I'm intentionally keeping this simple because..."
"The 80/20 here is..."

SHOWING OWNERSHIP:
"If I were maintaining this, I'd want..."
"One thing I'd check before deploying..."
"The monitoring I'd add..."
```

**What NOT to say at the end:**

```
❌ "That's it, I guess..." (uncertain)
❌ "Sorry about [mistake]..." (apologetic)
❌ "I could have done better..." (self-deprecating)
❌ Nothing — just stop coding (no closure)

✅ Confident summary + acknowledging trade-offs + next steps
```

---

### 23. Behavioral Interview Integration (Technical + Soft Skills)

**Senior interviews blend technical coding with behavioral signals.**

**TECHNICAL → BEHAVIORAL bridges:**

```
WHILE CODING, naturally demonstrate:

1. COMMUNICATION
   "Let me think out loud... I'm choosing recursion here because
    the data structure is inherently recursive."
   → Shows: clear thinking, collaboration readiness

2. PRIORITIZATION
   "I'll focus on the core expand/collapse first. Accessibility
    and performance are important but I'll tackle them after
    the basic flow works."
   → Shows: pragmatic, shipping-oriented

3. DECISION-MAKING
   "I have two options: lift state or keep local. Let me evaluate...
    Since there's no cross-node coordination yet, local wins."
   → Shows: deliberate choices, not random coding

4. HANDLING AMBIGUITY
   "The spec says 'file tree' but doesn't mention sorting.
    I'll assume directories-first like VS Code, but flag it
    as a clarifying question."
   → Shows: initiative + awareness of assumptions

5. RECEIVING FEEDBACK
   Interviewer: "What about using a Map instead of Set?"
   You: "That's interesting — Map gives us O(1) lookup AND
   we could store expand depth or timestamp. Good suggestion,
   let me refactor..."
   → Shows: coachable, ego-free
```

**Common behavioral questions mapped to File Explorer:**

```
Q: "Tell me about a time you disagreed with a technical decision."
A: Use Story 2 from War Stories — Redux vs Context debate.
   Key: "I disagreed respectfully, proposed an experiment,
   and the data supported my approach."

Q: "How do you handle tight deadlines?"
A: "I'd build the core expand/collapse first (15 min),
   then prioritize: what yields the most user value?
   Sorting > Keyboard > Search > DnD.
   I always ship something working over something perfect."

Q: "How do you onboard new team members to complex code?"
A: "I write self-documenting code — clear naming, TypeScript,
   component boundaries that match mental models.
   For this tree: anyone reading FileObject immediately
   understands 'one item in the tree' without context."
```

---

### 24. Complexity Analysis Talking Points

**Khi interviewer hỏi:** "What's the time/space complexity?"

**File Explorer complexity analysis:**

```
OPERATION          │ TIME          │ SPACE        │ NOTE
───────────────────┼───────────────┼──────────────┼────────────
Initial render     │ O(visible)    │ O(visible)   │ Only expanded
Expand directory   │ O(children)   │ O(children)  │ Sort + render
Collapse directory │ O(1)          │ O(−freed)    │ Unmount children
Sort (per level)   │ O(n log n)    │ O(n)         │ Copy + sort
Search/filter      │ O(total)      │ O(matches)   │ Walk full tree
Expand all         │ O(total)      │ O(total)     │ All nodes visible
Toggle one node    │ O(1)          │ O(1)         │ Boolean flip
Find by path       │ O(depth)      │ O(1)         │ Walk path segments
```

**💬 How to say it naturally:**

```
"Rendering is O(visible nodes), not O(total nodes), because
we only render children when a directory is expanded.
This is a key optimization — collapsed subtrees have zero
render cost."

"Sort is O(n log n) per level, but n is the SIBLING COUNT,
not total tree size. A level with 10 items costs almost nothing."

"The worst case is 'Expand All' — suddenly we render ALL nodes.
For 10K+ nodes, that's where virtualization becomes essential.
We'd flatten the visible tree and render only the viewport slice."

"Space-wise, each FileObject holds one boolean state (expanded).
With 1000 directories, that's 1000 booleans ≈ 8KB.
The DOM nodes are the real memory cost — each node is ~1-2KB
of DOM, so 1000 visible nodes ≈ 1-2MB of memory."
```

**Complexity comparison table for interviewers:**

```
┌──────────────────────┬──────────────┬──────────────┐
│ Approach             │ Render Cost  │ Memory       │
├──────────────────────┼──────────────┼──────────────┤
│ Render all nodes     │ O(total)     │ O(total)     │
│ Conditional render   │ O(visible)   │ O(visible)   │
│ Virtual + flat array │ O(viewport)  │ O(total data)│
│ Lazy load + virtual  │ O(viewport)  │ O(loaded)    │
└──────────────────────┴──────────────┴──────────────┘

Our MVP uses "conditional render" — O(visible) time and space.
The best practical trade-off for trees under 5K nodes.
```

---

### 25. React Internals Knowledge (Impress Points)

**Khi nào mention React internals:** Chỉ khi interviewer đi sâu, KHÔNG volunteer.

**Fiber Architecture (nếu được hỏi):**

```
"React's Fiber architecture is relevant to our tree because:

1. RECONCILIATION: When I toggle expand, React creates a new
   Fiber tree for the changed subtree only. Unchanged siblings
   are reused — this is why unique keys matter.

2. WORK LOOP: Fiber can pause work between nodes. If our tree
   has 10K nodes to render (expand all), React can yield to
   the browser for input handling mid-render. This is why
   the UI stays responsive.

3. DOUBLE BUFFERING: React builds the new Fiber tree in memory
   ('work-in-progress') while the current tree stays on screen.
   When done, it swaps — no partial renders visible to users."
```

**Reconciliation deep dive (for senior+):**

```
WHEN WE TOGGLE EXPAND:
1. setState({expanded: true}) called
2. React schedules re-render (adds to update queue)
3. Render phase: React walks Fiber tree
   ├── FileExplorer → no change → reuse
   ├── FileList → keychanges → diff children
   │   ├── FileObject(id=1) → same key → update
   │   │   ├── expanded: false → true → changed!
   │   │   └── Children: null → <FileList> → mount new
   │   ├── FileObject(id=2) → same key → reuse (no change)
   │   └── FileObject(id=3) → same key → reuse
   └── End
4. Commit phase: apply DOM changes
   ├── Update aria-expanded on button
   └── Append <ul> with children to DOM

KEY INSIGHT: Only id=1's subtree was touched.
Other siblings were SKIPPED — O(1) comparison per unchanged sibling.
This is why keys + stable identity = performance.
```

**Virtual DOM vs Direct DOM (common question):**

```
"The Virtual DOM isn't faster than direct DOM manipulation.
It's faster than NAIVE DOM manipulation.

Manual: document.getElementById('node-1').style.display = 'block'
→ Faster for 1 change

React: setState → diff → batch → commit
→ Faster for 100 coordinated changes
→ Prevents layout thrashing (multiple reads/writes)
→ Developer-friendly API

For our File Explorer: toggling 1 node would be faster with
direct DOM. But sorting + expand + animate + update aria =
multiple coordinated changes where React shines."
```

---

### 26. Component API Design Principles

**Khi interviewer hỏi:** "How would you design the component API?"

**Good component API characteristics:**

```
1. MINIMAL SURFACE AREA
   // ❌ Too many props = hard to use
   <FileExplorer
     data={data}
     expanded={expanded}
     onExpand={handleExpand}
     onCollapse={handleCollapse}
     sortOrder={sortOrder}
     onSort={handleSort}
     // ... 20 more props
   />

   // ✅ Essential props only
   <FileExplorer data={data} />
   // Everything else has sensible defaults
   // Advanced: <FileExplorer data={data} onSelect={fn} />

2. PROGRESSIVE DISCLOSURE
   // Level 1: Zero config (works immediately)
   <FileExplorer data={data} />

   // Level 2: Common customization
   <FileExplorer
     data={data}
     onSelect={handleSelect}
     defaultExpanded={[1, 3, 5]}
   />

   // Level 3: Full control (escape hatch)
   <FileExplorer
     data={data}
     expandedIds={expandedIds}
     onToggle={handleToggle}
     renderItem={(file, props) => <CustomItem {...props} />}
   />

3. CONTROLLED vs UNCONTROLLED
   // Uncontrolled (component manages own state)
   <FileExplorer
     data={data}
     defaultExpanded={[1, 3]}
   />

   // Controlled (parent manages state)
   <FileExplorer
     data={data}
     expandedIds={expandedIds}        // controlled value
     onExpandChange={setExpandedIds}  // change handler
   />
```

**Naming conventions for API:**

```
PROP NAMING PATTERNS:
├── data/items/value      → primary data prop
├── on[Event]             → callbacks (onSelect, onExpand)
├── default[State]        → initial uncontrolled state
├── is[Condition]         → boolean flags (isDisabled, isLoading)
├── render[Slot]          → render prop customization
├── [slot]ClassName       → CSS class override
├── [slot]Style           → inline style override
└── as                    → polymorphic element type

EXAMPLES IN FILE EXPLORER:
<FileExplorer
  data={FileData[]}          // primary data
  onSelect={(file) => void}  // selection callback
  onExpand={(id) => void}    // expansion callback
  defaultExpanded={number[]} // initial expanded IDs
  isMultiSelect={boolean}    // enable multi-select
  renderIcon={(file) => JSX} // custom icon renderer
  className={string}         // root class override
/>
```

---

### 27. Error Handling Philosophy

**Khi interviewer hỏi:** "How do you handle errors in production?"

**Error taxonomy for UI components:**

```
ERROR TYPE        │ HANDLING                    │ UX
──────────────────┼─────────────────────────────┼──────────────
Data shape error  │ TypeScript + runtime check  │ Fallback UI
Network error     │ try/catch + retry           │ Error banner
Render error      │ ErrorBoundary               │ Fallback tree
User input error  │ Validation                  │ Inline error
State corruption  │ Reset to initial            │ Recovery button
Permission error  │ Check before action         │ Disabled state
```

**Layered error strategy:**

```tsx
// LAYER 1: Prevent with TypeScript (compile time)
interface FileData {
  id: number; // Required — can't be undefined
  name: string; // Required — can't be null
  children?: FileData[]; // Optional — explicitly typed
}

// LAYER 2: Validate at boundaries (runtime)
function FileExplorer({ data }: Props) {
  // Validate data shape at entry point
  if (!Array.isArray(data)) {
    console.error("FileExplorer: data must be an array");
    return <EmptyState message="Invalid data format" />;
  }
  return <FileList fileList={data} level={1} />;
}

// LAYER 3: ErrorBoundary for unexpected crashes
<TreeErrorBoundary fallback={<ErrorFallback onReset={resetTree} />}>
  <FileExplorer data={data} />
</TreeErrorBoundary>;

// LAYER 4: Graceful degradation
function FileObject({ file }: Props) {
  // If file.name is somehow undefined, don't crash
  const displayName = file.name || "(unnamed)";

  // If children is corrupted, render as file
  const isDirectory = Array.isArray(file.children);

  return (
    <button>
      {isDirectory ? "📁" : "📄"} {displayName}
    </button>
  );
}
```

**💬 How to talk about it:**

```
"I think of error handling in layers:

1. TypeScript prevents most errors at compile time —
   wrong prop types, missing required fields.

2. Runtime validation at component boundaries catches
   bad API responses or malformed data.

3. ErrorBoundary catches unexpected render crashes
   with a fallback UI and reset option.

4. Graceful degradation means even if one file's data
   is corrupted, the rest of the tree still renders.

The goal: never show a blank screen. Always show SOMETHING
useful, even if it's an error message with a retry button."
```

---

### 28. Refactoring Live Demonstration

**Khi interviewer nói:** "This works. Can you refactor it?"

**Refactoring playbook (order matters):**

```
STEP 1: Extract pure functions (safest, no behavior change)
├── Sort logic → sortFileItems(items): FileData[]
├── Type check → isDirectory(file): boolean
├── Display → getFileIcon(file): string
└── Test these independently!

STEP 2: Extract custom hooks (behavior stays, code cleaner)
├── useToggle(initial) → [state, toggle]
├── useFileTree(data) → { sortedItems, toggleExpand, ... }
└── Keeps components focused on rendering

STEP 3: Extract sub-components (only if clear boundary)
├── FileIcon ({ file }) → just the icon logic
├── FileName ({ name }) → truncation, tooltip
└── FileActions ({ file, onDelete, onRename })

STEP 4: Add memoization (only if measured need)
├── useMemo for sorted items
├── React.memo for FileObject (if parent re-renders often)
└── useCallback for handlers passed to memoized children
```

**Live refactoring narration:**

```
"Let me refactor this in a specific order to minimize risk:

First, I'll extract the sort logic into a pure function.
This is the safest refactor — it doesn't change any behavior,
just moves code. And now I can write unit tests for it.

[Extract sortFileItems]

Next, I'll pull the toggle logic into a custom hook.
This makes the component's render function cleaner
and the toggle logic reusable.

[Extract useToggle]

Now FileObject is clean: it receives data via props,
manages expansion via useToggle, and renders the UI.
Each concern is separated.

I'll stop here — further extraction (like FileIcon)
would be premature for this scope."
```

---

### 29. Cross-Browser & Device Considerations

**Khi interviewer hỏi:** "Does this work on mobile? Other browsers?"

**Prepared awareness points:**

```
RESPONSIVE BEHAVIOR:
├── Tree on desktop: full sidebar, indentation, hover actions
├── Tree on tablet: smaller indentation, touch targets ≥ 44px
├── Tree on mobile: consider drawer/modal pattern instead
│   (vertical list with drill-down, not nested indent)
└── Use media queries or container queries for adaptation

TOUCH TARGETS:
├── Min tap target: 44×44px (Apple HIG), 48×48dp (Material)
├── Our <button> needs: padding + min-height
├── Spacing between items: prevent accidental taps
└── Touch: no hover state → show actions inline or long-press

CSS CONSIDERATIONS:
├── text-overflow: ellipsis → works everywhere
├── position: sticky → works in most browsers
├── CSS Grid for layout → IE11 needs fallback (if supported)
├── CSS custom properties → not IE11 (use fallback values)
├── @container queries → progressive enhancement
└── prefers-reduced-motion → respect OS animation settings

BROWSER-SPECIFIC:
├── Safari: no scrollbar by default (CSS: ::-webkit-scrollbar)
├── Firefox: scrollbar-width/scrollbar-color for styling
├── Safari iOS: 100vh includes address bar (use dvh)
├── All: :focus-visible instead of :focus for keyboard-only
```

**💬 How to say it:**

```
"The core logic is browser-agnostic — it's all React state and
semantic HTML. Where I'd pay attention:

1. Touch targets: ensure each row is at least 44px tall
2. Indentation: on mobile, deep nesting gets cramped —
   I'd cap visual depth or switch to breadcrumb navigation
3. Scrolling: the tree needs smooth scroll within a container
   with proper overflow handling
4. Accessibility: test with VoiceOver (Safari), NVDA (Firefox),
   JAWS (Chrome) — they all announce ARIA differently"
```

---

### 30. Security-Aware Thinking

**Khi interviewer hỏi:** "Any security concerns?"

**File Explorer security considerations:**

```
1. XSS VIA FILE NAMES
   ❌ Dangerous: <div dangerouslySetInnerHTML={file.name} />
   ✅ Safe: React auto-escapes: <span>{file.name}</span>

   Even with React's escaping, be careful with:
   ├── href attributes: <a href={file.url}> → validate protocol
   ├── onClick with eval: onClick={() => eval(file.action)} → NEVER
   └── CSS injection: style={{ background: file.color }} → validate

2. PATH TRAVERSAL
   If displaying file paths:
   ❌ Don't trust client-side paths for server operations
   ❌ Don't display absolute server paths to users
   ✅ Validate: no "../" in paths sent to API
   ✅ Allowlist: only permit paths within user's directory

3. DATA VALIDATION
   ├── Validate API response shape before rendering
   ├── Limit tree depth (prevent stack overflow with deep recursion)
   ├── Limit children count (prevent memory exhaustion)
   └── Sanitize file extensions for icon mapping

4. PERMISSION-AWARE UI
   ├── Check permissions before showing rename/delete actions
   ├── Don't just hide buttons — validate on server too
   ├── Show read-only state for files without write access
   └── Disable drag-and-drop for restricted directories
```

**💬 How to say it:**

```
"React handles XSS by default through auto-escaping JSX.
The main risks for a file tree component are:

1. Malicious file names — React escapes them, but I'd still
   validate if we display them in title attributes or URLs.

2. Path traversal — if the tree connects to a real filesystem,
   the API must validate paths server-side. Client-side
   validation is a UX convenience, not a security measure.

3. Permission boundaries — the UI should reflect permissions
   but never enforce them. All authorization happens server-side."
```

---

### 31. CI/CD & Deployment Awareness

**Khi interviewer hỏi:** "How would you ship this to production?"

**Production readiness checklist:**

```
PRE-MERGE:
├── Unit tests pass (sortItems, isDirectory, helpers)
├── Integration tests pass (RTL: render, expand, sort)
├── TypeScript strict mode — zero errors
├── ESLint — zero warnings
├── Bundle size check — no unexpected increase
└── Visual regression — screenshot comparison (optional)

DEPLOYMENT:
├── Feature flag wrapper (if risky / gradual rollout)
│   if (featureFlags.newFileExplorer) return <NewTree />;
│   return <OldTree />;
├── Canary deployment — 5% traffic first
├── Monitor: error rate, render time, memory usage
└── Rollback plan: revert flag, not code

POST-DEPLOYMENT:
├── Real User Monitoring (RUM) — actual render times
├── Error tracking (Sentry) — ErrorBoundary reports
├── User analytics — expand/collapse click patterns
├── A/B test results (if applicable)
└── Performance budget alerts
```

**💬 How to say it:**

```
"For shipping a new tree component, I'd:

1. Wrap it in a feature flag for gradual rollout
2. Deploy to 5% of users first (canary)
3. Monitor error rates and render performance
4. If stable after 24h, roll to 100%

This limits blast radius. If the tree has a render bug
in production that tests didn't catch, only 5% of users
see it, and we can revert by toggling the flag."
```

---

### 32. Mentoring & Knowledge Sharing Signals

**Senior+ interviews assess leadership. Show it naturally:**

```
DURING CODE:
"Let me name this clearly — a junior dev should understand
this function's purpose from its name alone."
→ Signal: you think about team readability

"I'd add a JSDoc comment here explaining WHY we sort
directories first, not just WHAT the sort does."
→ Signal: documentation awareness

"This pattern (collect → transform → render) is something
I'd share in a team lunch-and-learn."
→ Signal: knowledge sharing instinct

DURING DISCUSSION:
"When I've mentored developers on tree components,
the most common confusion is the recursive data model.
I start by drawing the data shape before any code."
→ Signal: teaching experience

"I'd set up a Storybook story for this component so
the team can see all states: expanded, collapsed, empty,
loading, error — without running the full app."
→ Signal: developer experience awareness

"In code review, I'd focus on three things for junior PRs:
1. Are the keys correct? (most common tree bug)
2. Is accessibility considered? (most commonly skipped)
3. Is state truly local? (most common over-engineering)"
→ Signal: focused, productive code review style
```

**Anti-patterns to avoid:**

```
❌ "This is obvious..." → dismissive to junior knowledge
❌ "Everyone knows..." → gatekeeping
❌ "I'd just tell them to..." → not collaborative
✅ "I've found that explaining it this way helps..."
✅ "A pattern I've seen work well for onboarding..."
✅ "I'd pair-program the first implementation, then..."
```

---

### 33. Design Pattern Recognition

**Khi interviewer hỏi:** "What design patterns do you see here?"

**Patterns in File Explorer (name-drop correctly):**

```
1. COMPOSITE PATTERN (Gang of Four)
   "The tree data structure IS the Composite pattern —
    FileData can be a leaf (file) or composite (directory).
    Both share the same interface."

   Component: FileData { id, name }
   Leaf: FileData without children (file)
   Composite: FileData with children[] (directory)

2. RECURSIVE COMPONENT PATTERN (React)
   "FileList → FileObject → FileList — the component calls
    itself through its children. This is React's version
    of recursive data processing."

3. OBSERVER PATTERN (via React State)
   "When expanded state changes, React automatically
    notifies the component to re-render. useState is React's
    implementation of the Observer pattern."

4. STRATEGY PATTERN (Sorting)
   "The sort comparator is a strategy — we can swap
    sort-by-name for sort-by-date or sort-by-size without
    changing the sorting mechanism."

   const sortByName = (a, b) => a.name.localeCompare(b.name);
   const sortBySize = (a, b) => a.size - b.size;
   const sorted = [...items].sort(currentStrategy);

5. COMPOUND COMPONENT PATTERN (Advanced)
   "FileTree + FileItem communicate through shared Context,
    like <select> + <option>. The parent provides state,
    children consume it."

6. RENDER PROP / CHILDREN AS FUNCTION (Customization)
   "For customizable trees: pass a renderItem function
    that controls how each node looks, while the tree
    handles expansion and keyboard navigation."

   <FileTree
     data={data}
     renderItem={(file, { expanded, onToggle }) => (
       <CustomFileRow file={file} expanded={expanded} />
     )}
   />
```

**💬 When to use pattern names:**

```
✅ GOOD: "I'm using the Composite pattern here — the data
   structure naturally represents part-whole hierarchies."
→ Shows: CS fundamentals knowledge

❌ BAD: "I'm implementing a Factory Abstract Proxy Decorator
   Bridge Adapter here."
→ Shows: pattern-obsessed, over-engineering

RULE: Name patterns only when they add clarity to communication.
If saying "recursive component" is clearer than "Composite
pattern applied to React functional components using the
Recursive Component anti-pattern", use the simpler term.
```

---

### 34. Leveling Framework Self-Assessment

**Understand what interviewers look for at each level:**

```
JUNIOR (L3/E3):
├── Can implement from clear spec
├── Handles happy path
├── Basic HTML/CSS/JS competence
├── Knows React basics (props, state, events)
└── SCORE: Implements FileExplorer that renders and expands

MID (L4/E4):
├── Handles edge cases without prompting
├── Good component decomposition
├── Proper TypeScript usage
├── Knows performance basics
├── Testing awareness
└── SCORE: Clean recursive components + sort + edge cases

SENIOR (L5/E5):
├── Discusses trade-offs proactively
├── Accessibility-first thinking
├── Performance-aware (but doesn't over-optimize)
├── Error handling strategy
├── Architectural foresight (easy to extend)
├── Clear communication of decisions
└── SCORE: Well-architected solution + trade-off discussion

STAFF (L6/E6):
├── Identifies system-level concerns
├── Discusses impact on other teams/components
├── Proposes extension architecture (plugin points)
├── Mentoring awareness in code design
├── Cross-functional thinking (UX, PM, Backend)
└── SCORE: Solution + how it fits into larger system

PRINCIPAL (L7/E7):
├── Defines technical vision
├── Industry-wide pattern awareness
├── Influences engineering culture
├── Makes complex trade-off decisions with data
└── SCORE: Rarely assessed via coding — more system design
```

**What to demonstrate at Senior (L5) level:**

```
✅ SAY THIS (during coding):
"I'm keeping expand state local because YAGNI.
If we need global coordination later, the refactor
from useState to Context is straightforward."
→ Shows: deliberate decision + future awareness

✅ SAY THIS (after coding):
"Let me walk through my testing strategy:
unit tests for the sort utility, integration tests
for the expand/collapse behavior, and I'd add
visual regression tests in CI."
→ Shows: quality awareness beyond "it works"

✅ SAY THIS (in discussion):
"This component's API follows the uncontrolled pattern —
similar to native <details>. If consumers need control,
I'd add expandedIds + onToggle props for the controlled
variant, like how React handles <input>."
→ Shows: deep React philosophy understanding

❌ AVOID:
"I've been doing this for X years..." → not a signal
"That's easy..." → dismissive
"I memorized all 50 hooks..." → not impressive
```

**Self-check scoreboard (rate yourself 1-5):**

```
┌─────────────────────────────┬───┬───┬───┬───┬───┐
│ Skill Area                  │ 1 │ 2 │ 3 │ 4 │ 5 │
├─────────────────────────────┼───┼───┼───┼───┼───┤
│ Component architecture      │   │   │   │   │   │
│ State management trade-offs │   │   │   │   │   │
│ TypeScript proficiency      │   │   │   │   │   │
│ Performance awareness       │   │   │   │   │   │
│ Accessibility knowledge     │   │   │   │   │   │
│ Error handling strategy     │   │   │   │   │   │
│ Testing approach            │   │   │   │   │   │
│ Communication clarity       │   │   │   │   │   │
│ Trade-off articulation      │   │   │   │   │   │
│ Code review ability         │   │   │   │   │   │
│ Mentoring signals           │   │   │   │   │   │
│ System design thinking      │   │   │   │   │   │
└─────────────────────────────┴───┴───┴───┴───┴───┘

TARGET: L5/Senior should be 4+ in top 8 categories.
```

---

## PHẦN E: TEST CASES

> 🧪 Các test cases để verify implementation.

### Basic Rendering

```typescript
describe('FileExplorer', () => {
  const testData: FileData[] = [
    { id: 1, name: 'README.md' },
    {
      id: 2, name: 'Documents', children: [
        { id: 3, name: 'Word.doc' },
        { id: 4, name: 'Powerpoint.ppt' },
      ],
    },
    {
      id: 5, name: 'Downloads', children: [
        { id: 6, name: 'unnamed.txt' },
        { id: 7, name: 'Misc', children: [
          { id: 8, name: 'foo.txt' },
          { id: 9, name: 'bar.txt' },
        ]},
      ],
    },
  ];

  it('renders top-level items sorted: directories first, then files', () => {
    render(<FileExplorer data={testData} />);
    const items = screen.getAllByRole('button');
    expect(items[0]).toHaveTextContent('Documents');
    expect(items[1]).toHaveTextContent('Downloads');
    expect(items[2]).toHaveTextContent('README.md');
  });

  it('directories show expand indicator', () => {
    render(<FileExplorer data={testData} />);
    expect(screen.getByText(/Documents/)).toHaveTextContent('[+]');
    expect(screen.getByText(/README/)).not.toHaveTextContent('[+]');
  });

  it('directories start collapsed', () => {
    render(<FileExplorer data={testData} />);
    expect(screen.queryByText('Word.doc')).not.toBeInTheDocument();
  });
});
```

### Expand/Collapse

```typescript
describe('FileExplorer - Expand/Collapse', () => {
  it('clicking directory expands it', () => {
    render(<FileExplorer data={testData} />);
    fireEvent.click(screen.getByText(/Documents/));
    expect(screen.getByText('Powerpoint.ppt')).toBeInTheDocument();
    expect(screen.getByText('Word.doc')).toBeInTheDocument();
  });

  it('clicking expanded directory collapses it', () => {
    render(<FileExplorer data={testData} />);
    fireEvent.click(screen.getByText(/Documents/)); // expand
    fireEvent.click(screen.getByText(/Documents/)); // collapse
    expect(screen.queryByText('Word.doc')).not.toBeInTheDocument();
  });

  it('expanding directory shows children sorted', () => {
    render(<FileExplorer data={testData} />);
    fireEvent.click(screen.getByText(/Downloads/));
    const buttons = screen.getAllByRole('button');
    // Downloads children: Misc (dir) before unnamed.txt (file)
    const dlChildIndex = buttons.findIndex(b => b.textContent?.includes('Misc'));
    const fileIndex = buttons.findIndex(b => b.textContent?.includes('unnamed.txt'));
    expect(dlChildIndex).toBeLessThan(fileIndex);
  });

  it('expanding nested directory shows grandchildren', () => {
    render(<FileExplorer data={testData} />);
    fireEvent.click(screen.getByText(/Downloads/)); // expand Downloads
    fireEvent.click(screen.getByText(/Misc/));       // expand Misc
    expect(screen.getByText('bar.txt')).toBeInTheDocument();
    expect(screen.getByText('foo.txt')).toBeInTheDocument();
  });

  it('collapsing parent hides all descendants', () => {
    render(<FileExplorer data={testData} />);
    fireEvent.click(screen.getByText(/Downloads/));
    fireEvent.click(screen.getByText(/Misc/));
    fireEvent.click(screen.getByText(/Downloads/)); // collapse
    expect(screen.queryByText('Misc')).not.toBeInTheDocument();
    expect(screen.queryByText('foo.txt')).not.toBeInTheDocument();
  });

  it('clicking file does nothing', () => {
    render(<FileExplorer data={testData} />);
    fireEvent.click(screen.getByText('README.md'));
    // No error, no change — file is not expandable
  });
});
```

### Edge Cases

```typescript
describe('FileExplorer - Edge Cases', () => {
  it('renders empty data', () => {
    render(<FileExplorer data={[]} />);
    expect(document.querySelector('.file-list')).toBeInTheDocument();
    expect(document.querySelector('.file-item')).not.toBeInTheDocument();
  });

  it('handles empty directory', () => {
    const data = [{ id: 1, name: 'EmptyFolder', children: [] }];
    render(<FileExplorer data={data} />);
    expect(screen.getByText(/EmptyFolder/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/EmptyFolder/));
    // Expanded but no children visible
  });

  it('handles single file', () => {
    const data = [{ id: 1, name: 'solo.txt' }];
    render(<FileExplorer data={data} />);
    expect(screen.getByText('solo.txt')).toBeInTheDocument();
  });

  it('handles deeply nested structure', () => {
    const data = [{
      id: 1, name: 'L1', children: [{
        id: 2, name: 'L2', children: [{
          id: 3, name: 'L3', children: [{
            id: 4, name: 'deep.txt'
          }]
        }]
      }]
    }];
    render(<FileExplorer data={data} />);
    fireEvent.click(screen.getByText(/L1/));
    fireEvent.click(screen.getByText(/L2/));
    fireEvent.click(screen.getByText(/L3/));
    expect(screen.getByText('deep.txt')).toBeInTheDocument();
  });
});
```

### Sorting Tests

```typescript
describe('FileList - Sorting', () => {
  it('sorts directories alphabetically', () => {
    const data = [
      { id: 1, name: 'Zebra', children: [] },
      { id: 2, name: 'Alpha', children: [] },
      { id: 3, name: 'Middle', children: [] },
    ];
    render(<FileExplorer data={data} />);
    const items = screen.getAllByRole('button');
    expect(items[0]).toHaveTextContent('Alpha');
    expect(items[1]).toHaveTextContent('Middle');
    expect(items[2]).toHaveTextContent('Zebra');
  });

  it('sorts files alphabetically', () => {
    const data = [
      { id: 1, name: 'z.txt' },
      { id: 2, name: 'a.txt' },
      { id: 3, name: 'm.txt' },
    ];
    render(<FileExplorer data={data} />);
    const items = screen.getAllByRole('button');
    expect(items[0]).toHaveTextContent('a.txt');
    expect(items[1]).toHaveTextContent('m.txt');
    expect(items[2]).toHaveTextContent('z.txt');
  });

  it('directories always appear before files', () => {
    const data = [
      { id: 1, name: 'a-file.txt' },
      { id: 2, name: 'z-dir', children: [] },
    ];
    render(<FileExplorer data={data} />);
    const items = screen.getAllByRole('button');
    expect(items[0]).toHaveTextContent('z-dir');  // dir first despite "z"
    expect(items[1]).toHaveTextContent('a-file.txt');
  });
});
```

---

## PHẦN F: ADVANCED PATTERNS & OPTIMIZATIONS

> 🚀 Patterns nâng cao cho production-ready File Explorer.

### 1. Virtualized File Tree (10K+ files)

```tsx
import { FixedSizeList } from "react-window";

function VirtualizedFileTree({ data }: { data: FileData[] }) {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());

  // Flatten visible tree to array
  const visibleItems = useMemo(() => {
    const result: Array<{ item: FileData; depth: number }> = [];

    function traverse(items: ReadonlyArray<FileData>, depth: number) {
      const sorted = sortFileItems(items);
      for (const item of sorted) {
        result.push({ item, depth });
        if (item.children && expandedIds.has(item.id)) {
          traverse(item.children, depth + 1);
        }
      }
    }

    traverse(data, 0);
    return result;
  }, [data, expandedIds]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <FixedSizeList
      height={600}
      width={400}
      itemCount={visibleItems.length}
      itemSize={28}
    >
      {({ index, style }) => {
        const { item, depth } = visibleItems[index];
        const isDir = Boolean(item.children);
        return (
          <div style={{ ...style, paddingLeft: depth * 16 }}>
            <button onClick={() => isDir && toggleExpand(item.id)}>
              {isDir && (expandedIds.has(item.id) ? "▼ " : "▶ ")}
              {item.name}
            </button>
          </div>
        );
      }}
    </FixedSizeList>
  );
}
```

---

### 2. Keyboard Navigation (ARIA Tree Pattern)

```tsx
function useTreeKeyboard(visibleItems: TreeItem[]) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            Math.min(prev + 1, visibleItems.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "ArrowRight":
          // If directory and collapsed → expand
          // If directory and expanded → move to first child
          // If file → no-op
          break;
        case "ArrowLeft":
          // If directory and expanded → collapse
          // If collapsed or file → move to parent
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          // Toggle expand/collapse for directories
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(visibleItems.length - 1);
          break;
      }
    },
    [visibleItems],
  );

  return { focusedIndex, handleKeyDown };
}
```

---

### 3. Context Menu (Right-click Actions)

```tsx
function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FileData;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: FileData) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, item });
    },
    [],
  );

  const closeMenu = useCallback(() => setContextMenu(null), []);

  return { contextMenu, handleContextMenu, closeMenu };
}

// Usage
<button onContextMenu={(e) => handleContextMenu(e, file)}>{file.name}</button>;

{
  contextMenu && (
    <ContextMenu x={contextMenu.x} y={contextMenu.y}>
      <MenuItem onClick={() => rename(contextMenu.item)}>Rename</MenuItem>
      <MenuItem onClick={() => deleteItem(contextMenu.item)}>Delete</MenuItem>
      {Boolean(contextMenu.item.children) && (
        <MenuItem onClick={() => newFile(contextMenu.item)}>New File</MenuItem>
      )}
    </ContextMenu>
  );
}
```

---

### 4. Search/Filter with Ancestor Preservation

```tsx
function filterTree(items: ReadonlyArray<FileData>, query: string): FileData[] {
  if (!query) return [...items];

  return items
    .map((item) => {
      const nameMatches = item.name.toLowerCase().includes(query.toLowerCase());

      if (item.children) {
        const filteredChildren = filterTree(item.children, query);

        // Show directory if: name matches OR has matching descendants
        if (nameMatches || filteredChildren.length > 0) {
          return {
            ...item,
            children: nameMatches ? item.children : filteredChildren,
          };
        }
      } else if (nameMatches) {
        return item;
      }

      return null;
    })
    .filter(Boolean) as FileData[];
}

// Key: If directory name matches, show ALL its children
// If only a child matches, show path from root to that child
```

---

### 5. Lazy Loading Directory Contents

```tsx
function useLazyDirectory(dirId: number) {
  const [state, setState] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [children, setChildren] = useState<FileData[] | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(`/api/directories/${dirId}/contents`);
      const data = await response.json();
      setChildren(data);
      setState("loaded");
    } catch {
      setState("error");
    }
  }, [dirId]);

  return { state, children, load };
}

// FileObject with lazy loading
function FileObject({ file, level }) {
  const [expanded, setExpanded] = useState(false);
  const { state, children, load } = useLazyDirectory(file.id);
  const isDirectory = Boolean(file.children) || file.hasChildren;

  const handleToggle = () => {
    if (!isDirectory) return;
    if (!expanded && state === "idle") {
      load(); // Fetch on first expand
    }
    setExpanded(!expanded);
  };

  return (
    <li>
      <button onClick={handleToggle}>
        {file.name}
        {isDirectory && <>{expanded ? " [-]" : " [+]"}</>}
      </button>
      {expanded && state === "loading" && <Spinner />}
      {expanded && state === "error" && <ErrorMessage retry={load} />}
      {expanded && children && children.length > 0 && (
        <FileList fileList={children} level={level + 1} />
      )}
    </li>
  );
}
```

---

### 6. Drag and Drop File Organization

```tsx
import { useDrag, useDrop } from "react-dnd";

function DraggableFileObject({ file, level, onMove }) {
  const [{ isDragging }, drag] = useDrag({
    type: "FILE_ITEM",
    item: { id: file.id, name: file.name },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "FILE_ITEM",
    canDrop: () => Boolean(file.children), // Only directories accept drops
    drop: (draggedItem: { id: number }) => {
      onMove(draggedItem.id, file.id); // Move dragged item into this directory
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <li
      ref={(node) => drag(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver ? "#e3f2fd" : "transparent",
      }}
    >
      <button>{file.name}</button>
    </li>
  );
}
```

---

### 7. Undo/Redo với Command Pattern

**Concept:** Mỗi action là một "command" object, lưu stack để undo/redo.

```tsx
// Command interface
interface TreeCommand {
  type: string;
  execute: () => void;
  undo: () => void;
  description: string; // For UI: "Renamed file.txt to doc.txt"
}

// Command history manager
function useCommandHistory(maxHistory = 50) {
  const [past, setPast] = useState<TreeCommand[]>([]);
  const [future, setFuture] = useState<TreeCommand[]>([]);

  const execute = useCallback(
    (command: TreeCommand) => {
      command.execute();
      setPast((prev) => [...prev.slice(-maxHistory + 1), command]);
      setFuture([]); // Clear redo stack on new action
    },
    [maxHistory],
  );

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const command = prev[prev.length - 1];
      command.undo();
      setFuture((f) => [...f, command]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const command = prev[prev.length - 1];
      command.execute();
      setPast((p) => [...p, command]);
      return prev.slice(0, -1);
    });
  }, []);

  return {
    execute,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    lastAction: past[past.length - 1]?.description,
  };
}

// Example commands for File Explorer
function createRenameCommand(
  setFiles: Dispatch<SetStateAction<FileData[]>>,
  fileId: number,
  oldName: string,
  newName: string,
): TreeCommand {
  const updateName = (name: string) => {
    setFiles((prev) => updateFileInTree(prev, fileId, { name }));
  };

  return {
    type: "RENAME",
    execute: () => updateName(newName),
    undo: () => updateName(oldName),
    description: `Renamed "${oldName}" → "${newName}"`,
  };
}

function createMoveCommand(
  setFiles: Dispatch<SetStateAction<FileData[]>>,
  fileId: number,
  fromParentId: number,
  toParentId: number,
): TreeCommand {
  return {
    type: "MOVE",
    execute: () => setFiles((prev) => moveInTree(prev, fileId, toParentId)),
    undo: () => setFiles((prev) => moveInTree(prev, fileId, fromParentId)),
    description: `Moved file to new directory`,
  };
}

// Usage in component
function FileExplorer({ data }: Props) {
  const [files, setFiles] = useState(data);
  const history = useCommandHistory();

  const handleRename = (fileId: number, newName: string) => {
    const file = findInTree(files, fileId);
    if (!file) return;

    const command = createRenameCommand(setFiles, fileId, file.name, newName);
    history.execute(command); // Execute + track
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history]);

  return (
    <div>
      <div className="toolbar">
        <button onClick={history.undo} disabled={!history.canUndo}>
          ↩️ Undo {history.lastAction && `(${history.lastAction})`}
        </button>
        <button onClick={history.redo} disabled={!history.canRedo}>
          ↪️ Redo
        </button>
      </div>
      <FileList fileList={files} level={1} />
    </div>
  );
}
```

**Khi nào dùng Command Pattern:**

```
✅ DÙNG KHI:
├── User có thể undo/redo (rename, move, delete)
├── Cần audit log (ai đổi gì, khi nào)
├── Cần replay actions (collaborative editing)
├── Actions phức tạp cần rollback (multi-step operations)

❌ KHÔNG CẦN KHI:
├── Chỉ expand/collapse (no mutation)
├── Read-only tree (view only)
├── Single-step operations without undo need
```

---

### 8. Web Worker cho Heavy Computation

**Concept:** Offload sort/filter/search tới background thread.

```tsx
// fileTreeWorker.ts
self.onmessage = function (e: MessageEvent) {
  const { type, payload } = e.data;

  switch (type) {
    case "SORT": {
      const sorted = deepSort(payload.files, payload.compareFn);
      self.postMessage({ type: "SORT_RESULT", payload: sorted });
      break;
    }
    case "FILTER": {
      const filtered = filterTree(payload.files, payload.query);
      self.postMessage({ type: "FILTER_RESULT", payload: filtered });
      break;
    }
    case "FLATTEN": {
      const flat = flattenTree(payload.files, payload.expandedIds);
      self.postMessage({ type: "FLATTEN_RESULT", payload: flat });
      break;
    }
  }
};

function deepSort(files: FileData[], compareFn: string): FileData[] {
  return files
    .map((file) => ({
      ...file,
      children: file.children ? deepSort(file.children, compareFn) : undefined,
    }))
    .sort((a, b) => {
      const aIsDir = Boolean(a.children);
      const bIsDir = Boolean(b.children);
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

function filterTree(files: FileData[], query: string): FileData[] {
  return files.reduce<FileData[]>((acc, file) => {
    const matchesQuery = file.name.toLowerCase().includes(query.toLowerCase());
    const filteredChildren = file.children
      ? filterTree(file.children, query)
      : undefined;

    if (matchesQuery || (filteredChildren && filteredChildren.length > 0)) {
      acc.push({
        ...file,
        children: filteredChildren,
      });
    }
    return acc;
  }, []);
}
```

```tsx
// useFileTreeWorker.ts — Custom hook
function useFileTreeWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./fileTreeWorker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      switch (type) {
        case "SORT_RESULT":
        case "FILTER_RESULT":
        case "FLATTEN_RESULT":
          setResult(payload);
          setIsProcessing(false);
          break;
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const sortFiles = useCallback((files: FileData[]) => {
    setIsProcessing(true);
    workerRef.current?.postMessage({
      type: "SORT",
      payload: { files, compareFn: "name" },
    });
  }, []);

  const filterFiles = useCallback((files: FileData[], query: string) => {
    setIsProcessing(true);
    workerRef.current?.postMessage({
      type: "FILTER",
      payload: { files, query },
    });
  }, []);

  return { result, isProcessing, sortFiles, filterFiles };
}

// Usage
function FileExplorer({ data }: Props) {
  const { result, isProcessing, sortFiles, filterFiles } = useFileTreeWorker();

  useEffect(() => {
    sortFiles(data); // Sort in background!
  }, [data, sortFiles]);

  if (isProcessing) return <TreeSkeleton />;
  return <FileList fileList={result} level={1} />;
}
```

**Performance thresholds:**

```
WHEN TO USE WEB WORKER:
├── < 1,000 nodes:  ❌ No need (< 5ms on main thread)
├── 1K - 10K nodes: ⚠️  Consider (10-50ms, may block input)
├── 10K+ nodes:     ✅ Use worker (50ms+, blocks animation frames)

WORKER LIMITATIONS:
├── No DOM access (can't manipulate React tree)
├── Data must be serializable (no functions, no circular refs)
├── Startup cost (~50ms to create worker)
├── Communication overhead (structured clone algorithm)
└── Use transferable objects for large ArrayBuffers
```

---

### 9. Optimistic Updates Pattern

**Concept:** Update UI immediately, sync with server in background, rollback on error.

```tsx
function useOptimisticTree(initialData: FileData[]) {
  const [files, setFiles] = useState(initialData);
  const [pendingOps, setPendingOps] = useState<Map<string, PendingOp>>(
    new Map(),
  );

  const optimisticRename = async (fileId: number, newName: string) => {
    const opId = `rename-${fileId}-${Date.now()}`;
    const oldFile = findInTree(files, fileId);
    if (!oldFile) return;

    // 1. Optimistic update (instant UI feedback)
    setFiles((prev) => updateFileInTree(prev, fileId, { name: newName }));
    setPendingOps((prev) =>
      new Map(prev).set(opId, {
        type: "rename",
        status: "pending",
      }),
    );

    try {
      // 2. Server sync (background)
      await api.renameFile(fileId, newName);

      // 3. Success: remove pending marker
      setPendingOps((prev) => {
        const next = new Map(prev);
        next.delete(opId);
        return next;
      });
    } catch (error) {
      // 4. Failure: rollback + notify user
      setFiles((prev) =>
        updateFileInTree(prev, fileId, { name: oldFile.name }),
      );
      setPendingOps((prev) => {
        const next = new Map(prev);
        next.delete(opId);
        return next;
      });

      showToast(`Failed to rename: ${error.message}`, "error");
    }
  };

  const optimisticDelete = async (fileId: number) => {
    const snapshot = structuredClone(files); // Full snapshot for rollback

    setFiles((prev) => removeFromTree(prev, fileId));

    try {
      await api.deleteFile(fileId);
    } catch (error) {
      setFiles(snapshot); // Rollback to snapshot
      showToast("Failed to delete file", "error");
    }
  };

  return {
    files,
    optimisticRename,
    optimisticDelete,
    hasPendingOps: pendingOps.size > 0,
  };
}
```

**Visual feedback for pending operations:**

```tsx
function FileObject({ file, isPending }: Props) {
  return (
    <li className={isPending ? 'file-pending' : ''}>
      <button>
        {isPending && <Spinner size="small" />}
        {file.name}
        {isPending && <span className="pending-badge">Saving...</span>}
      </button>
    </li>
  );
}

// CSS
.file-pending {
  opacity: 0.7;
  pointer-events: none; /* Prevent double actions */
}

.pending-badge {
  font-size: 0.75em;
  color: var(--color-warning);
  margin-left: 8px;
}
```

---

### 10. Multi-Select với Shift/Ctrl Keys

**Concept:** Selection logic giống OS file manager.

```tsx
function useMultiSelect<T extends { id: number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastClickedRef = useRef<number | null>(null);

  const handleSelect = useCallback(
    (itemId: number, event: React.MouseEvent) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (event.metaKey || event.ctrlKey) {
          // CMD/CTRL + Click: Toggle individual item
          if (next.has(itemId)) {
            next.delete(itemId);
          } else {
            next.add(itemId);
          }
        } else if (event.shiftKey && lastClickedRef.current !== null) {
          // SHIFT + Click: Select range
          const flatIds = flattenVisibleIds(items);
          const startIdx = flatIds.indexOf(lastClickedRef.current);
          const endIdx = flatIds.indexOf(itemId);

          if (startIdx !== -1 && endIdx !== -1) {
            const [from, to] = [
              Math.min(startIdx, endIdx),
              Math.max(startIdx, endIdx),
            ];
            for (let i = from; i <= to; i++) {
              next.add(flatIds[i]);
            }
          }
        } else {
          // Normal click: Select only this item
          next.clear();
          next.add(itemId);
        }

        return next;
      });

      lastClickedRef.current = itemId;
    },
    [items],
  );

  const selectAll = useCallback(() => {
    const allIds = flattenVisibleIds(items);
    setSelectedIds(new Set(allIds));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedRef.current = null;
  }, []);

  return {
    selectedIds,
    handleSelect,
    selectAll,
    clearSelection,
    selectedCount: selectedIds.size,
    isSelected: (id: number) => selectedIds.has(id),
  };
}

// Keyboard shortcut integration
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === "a") {
      e.preventDefault();
      selectAll();
    }
    if (e.key === "Escape") {
      clearSelection();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedIds.size > 0) {
        handleBulkDelete(selectedIds);
      }
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [selectAll, clearSelection, selectedIds]);
```

**Selection UX patterns:**

```
CLICK BEHAVIORS:
├── Click:            Select only this, deselect others
├── Cmd/Ctrl + Click: Toggle this item (keep others)
├── Shift + Click:    Select range from last clicked
├── Cmd + A:          Select all visible items
├── Escape:           Deselect all
├── Right click:      Show context menu for selection

VISUAL FEEDBACK:
├── Selected:         Background highlight (blue)
├── Last selected:    Darker highlight (focus indicator)
├── Selection count:  Toolbar badge "3 items selected"
├── Drag hint:        "Drag to move 3 items"
```

---

### 11. Inline Rename với Validation

**Concept:** Double-click to rename, with validation and keyboard controls.

```tsx
function useInlineRename() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = useCallback((file: FileData) => {
    setEditingId(file.id);
    setEditValue(file.name);
    setError(null);
    // Focus input on next tick (after render)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Select name without extension
        const dotIndex = file.name.lastIndexOf(".");
        if (dotIndex > 0 && !file.children) {
          inputRef.current.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current.select();
        }
      }
    });
  }, []);

  const validateName = useCallback(
    (name: string, siblings: FileData[], currentId: number): string | null => {
      const trimmed = name.trim();
      if (!trimmed) return "Name cannot be empty";
      if (trimmed.length > 255) return "Name too long (max 255)";
      if (/[<>:"/\\|?*]/.test(trimmed)) return "Invalid characters";
      if (trimmed.startsWith(".") && trimmed.length === 1)
        return "Invalid name";

      // Check duplicate at same level
      const duplicate = siblings.find(
        (s) =>
          s.id !== currentId && s.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) return `"${trimmed}" already exists`;

      return null; // Valid!
    },
    [],
  );

  const commitRename = useCallback(
    (siblings: FileData[], onRename: (id: number, name: string) => void) => {
      if (editingId === null) return;

      const validationError = validateName(editValue, siblings, editingId);
      if (validationError) {
        setError(validationError);
        inputRef.current?.focus();
        return;
      }

      onRename(editingId, editValue.trim());
      setEditingId(null);
      setError(null);
    },
    [editingId, editValue, validateName],
  );

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditValue("");
    setError(null);
  }, []);

  return {
    editingId,
    editValue,
    error,
    inputRef,
    startRename,
    setEditValue,
    commitRename,
    cancelRename,
    isEditing: (id: number) => editingId === id,
  };
}

// Usage in FileObject
function FileObject({ file, siblings, onRename }: Props) {
  const rename = useInlineRename();

  if (rename.isEditing(file.id)) {
    return (
      <li>
        <div className="rename-container">
          <input
            ref={rename.inputRef}
            value={rename.editValue}
            onChange={(e) => rename.setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rename.commitRename(siblings, onRename);
              if (e.key === "Escape") rename.cancelRename();
            }}
            onBlur={() => rename.commitRename(siblings, onRename)}
            className={rename.error ? "rename-error" : ""}
            aria-invalid={!!rename.error}
            aria-describedby={rename.error ? "rename-error-msg" : undefined}
          />
          {rename.error && (
            <div id="rename-error-msg" className="error-tooltip" role="alert">
              {rename.error}
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <li>
      <button onDoubleClick={() => rename.startRename(file)}>
        {file.name}
      </button>
    </li>
  );
}
```

---

### 12. File Tree State Persistence

**Concept:** Remember expanded/selected state across page reloads.

```tsx
// Strategy 1: URL Search Params (shareable!)
function useTreeStateURL() {
  const [searchParams, setSearchParams] = useSearchParams();

  const expandedIds = useMemo(() => {
    const param = searchParams.get("expanded");
    if (!param) return new Set<number>();
    return new Set(param.split(",").map(Number).filter(Boolean));
  }, [searchParams]);

  const setExpandedIds = useCallback(
    (ids: Set<number>) => {
      setSearchParams(
        (prev) => {
          if (ids.size === 0) {
            prev.delete("expanded");
          } else {
            prev.set("expanded", Array.from(ids).join(","));
          }
          return prev;
        },
        { replace: true },
      ); // replace, don't push
    },
    [setSearchParams],
  );

  return { expandedIds, setExpandedIds };
}

// Strategy 2: localStorage (persistent, not shareable)
function useTreeStateLocal(storageKey: string) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return new Set(JSON.parse(stored));
    } catch {} // Ignore parse errors
    return new Set();
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(expandedIds)));
    }, 300); // Debounce writes

    return () => clearTimeout(timer);
  }, [expandedIds, storageKey]);

  return { expandedIds, setExpandedIds };
}

// Strategy 3: Combined (URL for sharing + localStorage for default)
function useTreeStateCombined(storageKey: string) {
  const [searchParams] = useSearchParams();
  const hasURLState = searchParams.has("expanded");

  // If URL has state, use it (shared link scenario)
  // Otherwise, fall back to localStorage
  if (hasURLState) {
    return useTreeStateURL();
  }
  return useTreeStateLocal(storageKey);
}
```

**Comparison:**

```
┌──────────────────┬─────────────┬────────────┬─────────────┐
│ Strategy         │ Persistent  │ Shareable  │ Complexity  │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ useState only    │ ❌ No       │ ❌ No      │ ⭐           │
│ URL params       │ ❌ No       │ ✅ Yes     │ ⭐⭐         │
│ localStorage     │ ✅ Yes      │ ❌ No      │ ⭐⭐         │
│ URL + local      │ ✅ Yes      │ ✅ Yes     │ ⭐⭐⭐       │
│ Server API       │ ✅ Cross-dev│ ✅ Yes     │ ⭐⭐⭐⭐     │
└──────────────────┴─────────────┴────────────┴─────────────┘
```

---

### 13. Immutable Tree Updates với Immer

**Concept:** Deep tree updates readable và safe với Immer's `produce`.

```tsx
import { produce } from "immer";

// WITHOUT Immer — deeply nested nightmare
function updateFileInTree(
  files: FileData[],
  fileId: number,
  updates: Partial<FileData>,
): FileData[] {
  return files.map((file) => {
    if (file.id === fileId) {
      return { ...file, ...updates };
    }
    if (file.children) {
      return {
        ...file,
        children: updateFileInTree(file.children, fileId, updates),
      };
    }
    return file;
  });
}

// WITH Immer — much cleaner
function updateFileImmer(
  files: FileData[],
  fileId: number,
  updates: Partial<FileData>,
): FileData[] {
  return produce(files, (draft) => {
    const file = findInDraft(draft, fileId);
    if (file) Object.assign(file, updates);
  });
}

function findInDraft(files: FileData[], id: number): FileData | undefined {
  for (const file of files) {
    if (file.id === id) return file;
    if (file.children) {
      const found = findInDraft(file.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

// Complex operations become trivial with Immer
function useFileTreeImmer(initialData: FileData[]) {
  const [files, setFiles] = useState(initialData);

  const renameFile = useCallback((fileId: number, newName: string) => {
    setFiles(
      produce((draft) => {
        const file = findInDraft(draft, fileId);
        if (file) file.name = newName; // Direct mutation! Immer handles immutability
      }),
    );
  }, []);

  const addFile = useCallback((parentId: number, newFile: FileData) => {
    setFiles(
      produce((draft) => {
        const parent = findInDraft(draft, parentId);
        if (parent?.children) {
          parent.children.push(newFile); // Direct push!
        }
      }),
    );
  }, []);

  const deleteFile = useCallback((fileId: number) => {
    setFiles(
      produce((draft) => {
        deleteFromDraft(draft, fileId);
      }),
    );
  }, []);

  const moveFile = useCallback((fileId: number, newParentId: number) => {
    setFiles(
      produce((draft) => {
        // 1. Find and remove from current location
        const file = findInDraft(draft, fileId);
        if (!file) return;

        const fileCopy = structuredClone(file); // Clone before removing
        deleteFromDraft(draft, fileId);

        // 2. Add to new parent
        const newParent = findInDraft(draft, newParentId);
        if (newParent?.children) {
          newParent.children.push(fileCopy);
        }
      }),
    );
  }, []);

  const sortChildren = useCallback((parentId: number) => {
    setFiles(
      produce((draft) => {
        const parent = findInDraft(draft, parentId);
        if (parent?.children) {
          parent.children.sort((a, b) => {
            const aDir = Boolean(a.children);
            const bDir = Boolean(b.children);
            if (aDir !== bDir) return aDir ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        }
      }),
    );
  }, []);

  return { files, renameFile, addFile, deleteFile, moveFile, sortChildren };
}

// Helper: delete from draft (mutative, for Immer only!)
function deleteFromDraft(files: FileData[], id: number): boolean {
  for (let i = 0; i < files.length; i++) {
    if (files[i].id === id) {
      files.splice(i, 1); // Direct splice! Immer handles it
      return true;
    }
    if (files[i].children && deleteFromDraft(files[i].children!, id)) {
      return true;
    }
  }
  return false;
}
```

**Immer vs Manual comparison:**

```
┌─────────────────────┬────────────────┬────────────────┐
│ Operation           │ Manual (spread)│ Immer (produce)│
├─────────────────────┼────────────────┼────────────────┤
│ Rename (depth=1)    │ 3 lines        │ 2 lines        │
│ Rename (depth=5)    │ 15+ lines      │ 2 lines        │
│ Add child           │ 8 lines        │ 3 lines        │
│ Delete              │ 12 lines       │ 5 lines        │
│ Move between dirs   │ 25+ lines      │ 8 lines        │
│ Sort children       │ 10 lines       │ 5 lines        │
├─────────────────────┼────────────────┼────────────────┤
│ Bundle size         │ 0 KB           │ ~6 KB (gzip)   │
│ Performance (small) │ Same           │ Same           │
│ Performance (large) │ Same           │ Slightly slower│
│ Readability         │ Complex        │ Simple         │
│ Bug risk            │ High           │ Low            │
└─────────────────────┴────────────────┴────────────────┘

VERDICT: Use Immer when tree depth > 3 or operations are complex.
Skip Immer for simple flat state.
```

---

### 14. Animation & Transitions

**Concept:** Smooth expand/collapse, appear/disappear animations.

```tsx
// Approach 1: CSS-only (simplest, best performance)
// CSS
.file-children {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease-out, opacity 0.2s ease;
}

.file-children.expanded {
  max-height: 2000px; /* Large enough for content */
  opacity: 1;
}

// TSX
function FileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <button onClick={() => setExpanded(!expanded)}>
        <span className={`chevron ${expanded ? 'rotated' : ''}`}>▶</span>
        {file.name}
      </button>
      {file.children && (
        <ul className={`file-children ${expanded ? 'expanded' : ''}`}>
          {file.children.map(child => (
            <FileObject key={child.id} file={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Chevron rotation
.chevron {
  display: inline-block;
  transition: transform 0.2s ease;
}
.chevron.rotated {
  transform: rotate(90deg);
}
```

```tsx
// Approach 2: Auto-height animation (smooth, accurate)
function useCollapseAnimation(isExpanded: boolean) {
  const contentRef = useRef<HTMLUListElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isExpanded) {
      // Expand: measure real height, animate to it, then auto
      const realHeight = el.scrollHeight;
      setHeight(realHeight);

      const timer = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timer);
    } else {
      // Collapse: set current height first (from auto), then 0
      const realHeight = el.scrollHeight;
      setHeight(realHeight);

      // Force reflow, then animate to 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [isExpanded]);

  return {
    contentRef,
    style: {
      height: typeof height === "number" ? `${height}px` : "auto",
      overflow: "hidden",
      transition: "height 0.3s ease-out",
    },
  };
}

// Usage
function AnimatedFileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { contentRef, style } = useCollapseAnimation(expanded);

  return (
    <li>
      <button onClick={() => setExpanded(!expanded)}>{file.name}</button>
      {file.children && (
        <ul ref={contentRef} style={style}>
          {file.children.map((child) => (
            <AnimatedFileObject key={child.id} file={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
```

```tsx
// Approach 3: Framer Motion (most polished, larger bundle)
import { motion, AnimatePresence } from "framer-motion";

function MotionFileObject({ file }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <button onClick={() => setExpanded(!expanded)}>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▶
        </motion.span>
        {file.name}
      </button>

      <AnimatePresence>
        {expanded && file.children && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {file.children.map((child) => (
              <MotionFileObject key={child.id} file={child} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
```

**Animation comparison:**

```
┌─────────────────┬──────────┬──────────┬───────────────┐
│ Approach        │ Bundle   │ Smoothness│ Effort       │
├─────────────────┼──────────┼──────────┼───────────────┤
│ CSS max-height  │ 0 KB     │ ⭐⭐⭐     │ ⭐ (easiest)  │
│ JS auto-height  │ 0 KB     │ ⭐⭐⭐⭐   │ ⭐⭐⭐          │
│ Framer Motion   │ ~30 KB   │ ⭐⭐⭐⭐⭐ │ ⭐⭐           │
│ React Spring    │ ~20 KB   │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐          │
│ CSS display:none│ 0 KB     │ ❌ (none) │ ⭐            │
└─────────────────┴──────────┴──────────┴───────────────┘

PRODUCTION RECOMMENDATION:
├── MVP / Performance-critical: CSS max-height
├── Polished product: JS auto-height (zero deps)
├── Design-heavy product: Framer Motion
└── Always: respect prefers-reduced-motion
```

---

### 15. Breadcrumb Navigation

**Concept:** Show current path in tree, allow quick navigation to ancestors.

```tsx
// Build breadcrumb path from tree structure
function buildBreadcrumbs(
  files: FileData[],
  targetId: number
): FileData[] | null {
  for (const file of files) {
    if (file.id === targetId) {
      return [file];
    }
    if (file.children) {
      const childPath = buildBreadcrumbs(file.children, targetId);
      if (childPath) {
        return [file, ...childPath];
      }
    }
  }
  return null;
}

// Breadcrumb component
function TreeBreadcrumb({
  files,
  activeId,
  onNavigate
}: {
  files: FileData[];
  activeId: number | null;
  onNavigate: (id: number) => void;
}) {
  const breadcrumbs = useMemo(() => {
    if (!activeId) return [];
    return buildBreadcrumbs(files, activeId) || [];
  }, [files, activeId]);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="File path" className="breadcrumb-bar">
      <ol className="breadcrumb-list">
        <li>
          <button
            onClick={() => onNavigate(-1)}
            className="breadcrumb-root"
          >
            🏠 Root
          </button>
        </li>
        {breadcrumbs.map((file, index) => (
          <li key={file.id} className="breadcrumb-item">
            <span className="breadcrumb-separator">/</span>
            {index === breadcrumbs.length - 1 ? (
              // Current item — not clickable
              <span className="breadcrumb-current" aria-current="location">
                {file.children ? '📁' : '📄'} {file.name}
              </span>
            ) : (
              // Ancestor — clickable
              <button
                onClick={() => onNavigate(file.id)}
                className="breadcrumb-link"
              >
                📁 {file.name}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// CSS
.breadcrumb-bar {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.85em;
  overflow-x: auto;
  white-space: nowrap;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 2px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-separator {
  color: var(--text-tertiary);
  margin: 0 4px;
}

.breadcrumb-link {
  color: var(--text-link);
  cursor: pointer;
}
.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 600;
}
```

---

### 16. File Upload với Directory Structure

**Concept:** Upload files via drag-drop maintaining folder hierarchy.

```tsx
function useDirectoryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processEntry = async (
    entry: FileSystemEntry,
    path = "",
  ): Promise<FileData[]> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });

      return [
        {
          id: generateId(),
          name: entry.name,
          meta: { size: file.size, type: file.type, path: path + entry.name },
        },
      ];
    }

    if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>(
        (resolve, reject) => {
          reader.readEntries(resolve, reject);
        },
      );

      const children: FileData[] = [];
      for (const childEntry of entries) {
        const childFiles = await processEntry(
          childEntry,
          path + entry.name + "/",
        );
        children.push(...childFiles);
      }

      return [
        {
          id: generateId(),
          name: entry.name,
          children: children,
        },
      ];
    }

    return [];
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setUploading(true);
    setProgress(0);

    const items = Array.from(e.dataTransfer.items);
    const entries = items
      .map((item) => item.webkitGetAsEntry())
      .filter(Boolean) as FileSystemEntry[];

    try {
      const newFiles: FileData[] = [];
      for (let i = 0; i < entries.length; i++) {
        const result = await processEntry(entries[i]);
        newFiles.push(...result);
        setProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      return newFiles; // Caller merges into tree
    } finally {
      setUploading(false);
    }
  };

  return { handleDrop, uploading, progress };
}

// Drop zone component
function FileTreeDropZone({
  onFilesAdded,
  children,
}: {
  onFilesAdded: (files: FileData[]) => void;
  children: React.ReactNode;
}) {
  const { handleDrop, uploading, progress } = useDirectoryUpload();
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={async (e) => {
        setIsDragOver(false);
        const files = await handleDrop(e);
        onFilesAdded(files);
      }}
      className={`tree-drop-zone ${isDragOver ? "drag-over" : ""}`}
    >
      {children}

      {isDragOver && (
        <div className="drop-overlay">
          <span>📂 Drop files or folders here</span>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span>Processing... {progress}%</span>
        </div>
      )}
    </div>
  );
}
```

---

### 17. Performance Monitoring Hook

**Concept:** Đo render time, interaction latency, memory — tự động trong dev.

```tsx
function useTreePerformance(treeName = "FileTree") {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const mountTime = useRef(Date.now());

  // Count renders
  useEffect(() => {
    renderCount.current++;
  });

  // Measure render duration
  useEffect(() => {
    const start = performance.now();
    return () => {
      lastRenderTime.current = performance.now() - start;
    };
  });

  // Interaction timing - wrap handlers
  const measureInteraction = useCallback(
    <T extends (...args: any[]) => any>(name: string, handler: T): T => {
      return ((...args: any[]) => {
        const start = performance.now();
        const result = handler(...args);
        const duration = performance.now() - start;

        if (duration > 16) {
          // Longer than 1 frame (60fps)
          console.warn(
            `⚠️ [${treeName}] Slow interaction "${name}": ${duration.toFixed(1)}ms`,
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.debug(
            `📊 [${treeName}] "${name}": ${duration.toFixed(1)}ms | ` +
              `Renders: ${renderCount.current} | ` +
              `Uptime: ${((Date.now() - mountTime.current) / 1000).toFixed(0)}s`,
          );
        }

        return result;
      }) as T;
    },
    [treeName],
  );

  // Memory snapshot (Chrome only)
  const logMemory = useCallback(() => {
    if ("memory" in performance) {
      const mem = (performance as any).memory;
      console.table({
        "Heap Used": `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
        "Heap Total": `${(mem.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
        "Heap Limit": `${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB`,
      });
    }
  }, []);

  // Render budget warning
  useEffect(() => {
    if (renderCount.current > 100) {
      console.warn(
        `⚠️ [${treeName}] ${renderCount.current} renders since mount. ` +
          `Possible excessive re-rendering.`,
      );
    }
  });

  return { measureInteraction, logMemory, renderCount: renderCount.current };
}

// Usage
function FileExplorer({ data }: Props) {
  const perf = useTreePerformance("FileExplorer");

  const handleExpand = perf.measureInteraction("expand", (id: number) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  });

  const handleSort = perf.measureInteraction("sort", () => {
    setFiles((prev) => sortFileTree(prev));
  });

  return <FileList fileList={data} onExpand={handleExpand} />;
}
```

**Performance budget table:**

```
┌──────────────────────┬──────────┬───────────┬───────────┐
│ Metric               │ Good     │ Warning   │ Critical  │
├──────────────────────┼──────────┼───────────┼───────────┤
│ Render time          │ < 5ms    │ 5-16ms    │ > 16ms    │
│ Expand interaction   │ < 10ms   │ 10-50ms   │ > 50ms    │
│ Sort (100 items)     │ < 2ms    │ 2-10ms    │ > 10ms    │
│ Search (1K nodes)    │ < 20ms   │ 20-100ms  │ > 100ms   │
│ Re-renders per expand│ 1-2      │ 3-5       │ > 5       │
│ Memory (1K nodes)    │ < 5MB    │ 5-20MB    │ > 20MB    │
│ Bundle size impact   │ < 5KB    │ 5-20KB    │ > 20KB    │
└──────────────────────┴──────────┴───────────┴───────────┘
```

---

### 18. Collaborative Real-Time Tree (CRDT Concepts)

**Concept:** Multiple users editing the same tree simultaneously.

```tsx
// Simplified CRDT-inspired tree operations
// Each operation has a unique ID and timestamp for conflict resolution

interface TreeOperation {
  id: string; // Unique operation ID
  userId: string; // Who made the change
  timestamp: number; // Server timestamp (ordering)
  type: "ADD" | "DELETE" | "RENAME" | "MOVE";
  payload: {
    fileId: number;
    parentId?: number;
    name?: string;
    newParentId?: number;
    file?: FileData;
  };
}

// Operation-based sync manager
function useCollaborativeTree(
  initialData: FileData[],
  wsUrl: string,
  userId: string,
) {
  const [files, setFiles] = useState(initialData);
  const [collaborators, setCollaborators] = useState<Map<string, UserPresence>>(
    new Map(),
  );
  const wsRef = useRef<WebSocket | null>(null);
  const pendingOps = useRef<TreeOperation[]>([]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "OPERATION":
          applyRemoteOperation(message.operation);
          break;
        case "SYNC":
          setFiles(message.fullTree);
          break;
        case "PRESENCE":
          setCollaborators((prev) => {
            const next = new Map(prev);
            next.set(message.userId, message.presence);
            return next;
          });
          break;
        case "USER_LEFT":
          setCollaborators((prev) => {
            const next = new Map(prev);
            next.delete(message.userId);
            return next;
          });
          break;
      }
    };

    ws.onopen = () => {
      // Request full sync on connect
      ws.send(JSON.stringify({ type: "REQUEST_SYNC" }));
      // Send pending operations
      pendingOps.current.forEach((op) => {
        ws.send(JSON.stringify({ type: "OPERATION", operation: op }));
      });
      pendingOps.current = [];
    };

    return () => ws.close();
  }, [wsUrl]);

  // Apply remote operation (from other users)
  const applyRemoteOperation = useCallback(
    (op: TreeOperation) => {
      if (op.userId === userId) return; // Skip own echoed operations

      setFiles((prev) => {
        switch (op.type) {
          case "ADD":
            return addToTree(prev, op.payload.parentId!, op.payload.file!);
          case "DELETE":
            return removeFromTree(prev, op.payload.fileId);
          case "RENAME":
            return updateFileInTree(prev, op.payload.fileId, {
              name: op.payload.name!,
            });
          case "MOVE":
            return moveInTree(prev, op.payload.fileId, op.payload.newParentId!);
          default:
            return prev;
        }
      });
    },
    [userId],
  );

  // Send local operation (broadcast to others)
  const sendOperation = useCallback(
    (op: Omit<TreeOperation, "id" | "userId" | "timestamp">) => {
      const fullOp: TreeOperation = {
        ...op,
        id: crypto.randomUUID(),
        userId,
        timestamp: Date.now(),
      };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "OPERATION",
            operation: fullOp,
          }),
        );
      } else {
        pendingOps.current.push(fullOp); // Queue if disconnected
      }
    },
    [userId],
  );

  // Broadcast cursor/selection presence
  const updatePresence = useCallback(
    (activeFileId: number | null) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "PRESENCE",
            userId,
            presence: { activeFileId, lastActive: Date.now() },
          }),
        );
      }
    },
    [userId],
  );

  return {
    files,
    collaborators,
    sendOperation,
    updatePresence,
    // Exposed actions
    renameFile: (fileId: number, newName: string) => {
      setFiles((prev) => updateFileInTree(prev, fileId, { name: newName }));
      sendOperation({ type: "RENAME", payload: { fileId, name: newName } });
    },
  };
}

// Presence UI — show who's viewing what
function CollaboratorCursors({
  collaborators,
  fileId,
}: {
  collaborators: Map<string, UserPresence>;
  fileId: number;
}) {
  const viewingUsers = Array.from(collaborators.entries()).filter(
    ([_, presence]) => presence.activeFileId === fileId,
  );

  if (viewingUsers.length === 0) return null;

  return (
    <div className="collaborator-indicators">
      {viewingUsers.map(([userId, presence]) => (
        <span
          key={userId}
          className="collaborator-avatar"
          title={`${userId} is viewing this file`}
          style={{
            backgroundColor: stringToColor(userId),
            border: `2px solid ${stringToColor(userId)}`,
          }}
        >
          {userId.charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
```

**Architecture overview:**

```
┌──────────────┐     WebSocket      ┌──────────────┐
│  Client A    │◄──────────────────►│              │
│  (Browser)   │                    │   Server     │
└──────┬───────┘                    │  (Node.js)   │
       │ Local state                │              │
       │ + Operations               │  ┌────────┐  │
       ▼                            │  │ Op Log │  │
┌──────────────┐                    │  └────────┘  │
│  React Tree  │                    │              │
│  Component   │     WebSocket      │              │
└──────────────┘◄──────────────────►│              │
                                    │              │
┌──────────────┐     WebSocket      │              │
│  Client B    │◄──────────────────►│              │
│  (Browser)   │                    └──────────────┘
└──────────────┘

CONFLICT RESOLUTION STRATEGY:
├── Last-write-wins (LWW): Simple, may lose data
├── Operation Transform (OT): Google Docs approach
├── CRDT: Yjs/Automerge, mathematically convergent
└── Our example: LWW with server timestamp (simplest)
```
