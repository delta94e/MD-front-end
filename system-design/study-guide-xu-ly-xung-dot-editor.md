# Study Guide: Nguyên Lý Xử Lý Xung Đột Trong Cộng Tác Đa Người Trên Editor

## Mục Lục
1. [Tổng Quan Về Vấn Đề](#1-tổng-quan-về-vấn-đề)
2. [Thuật Toán OT (Operational Transformation)](#2-thuật-toán-ot-operational-transformation)
3. [CRDT (Conflict-Free Replicated Data Type)](#3-crdt-conflict-free-replicated-data-type)
4. [So Sánh OT vs CRDT](#4-so-sánh-ot-vs-crdt)
5. [Bài Tập Thực Hành](#5-bài-tập-thực-hành)

---

## 1. Tổng Quan Về Vấn Đề

### 1.1 Vấn Đề Cần Giải Quyết

Khi nhiều người cùng chỉnh sửa một tài liệu đồng thời, các xung đột có thể xảy ra:

**Ví dụ:**
- Tài liệu ban đầu: `"Hello"`
- Người A chèn `"!"` vào vị trí 5 → `"Hello!"`
- Người B chèn `" World"` vào vị trí 5 → `"Hello World"`
- **Xung đột:** Cả hai thao tác đều tác động vào cùng vị trí

### 1.2 Yêu Cầu Của Hệ Thống

1. **Tính nhất quán cuối cùng (Eventual Consistency):** Tất cả người dùng phải thấy cùng một nội dung sau khi đồng bộ
2. **Không mất dữ liệu:** Mọi thao tác chỉnh sửa đều phải được bảo toàn
3. **Hiệu suất cao:** Độ trễ thấp, không chặn người dùng
4. **Tính nhân quả (Causality):** Thứ tự logic của các thao tác phải được duy trì

---

## 2. Thuật Toán OT (Operational Transformation)

### 2.1 Khái Niệm Cơ Bản

**OT** chuyển đổi các thao tác chỉnh sửa thành các **atomic operations** (thao tác nguyên tử) và sử dụng **hàm chuyển đổi** để giải quyết xung đột.

### 2.2 Các Loại Thao Tác Nguyên Tử

```javascript
// 1. Insert (Chèn)
{
  type: 'insert',
  pos: 5,           // Vị trí chèn
  text: 'World'     // Nội dung chèn
}

// 2. Delete (Xóa)
{
  type: 'delete',
  pos: 3,           // Vị trí bắt đầu xóa
  length: 2         // Số ký tự cần xóa
}

// 3. Retain (Giữ nguyên - dùng trong một số implementation)
{
  type: 'retain',
  length: 5         // Giữ nguyên 5 ký tự
}
```

### 2.3 Hàm Chuyển Đổi (Transform Function)

Hàm `transform(op1, op2)` điều chỉnh `op1` dựa trên việc `op2` đã xảy ra trước.

#### Ví Dụ 1: Insert vs Insert

```javascript
function transform(op1, op2) {
  // Trường hợp: Cả hai đều là Insert
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.pos <= op2.pos) {
      // op1 xảy ra trước hoặc cùng vị trí → không cần điều chỉnh
      return { ...op1 };
    } else {
      // op1 xảy ra sau → dịch vị trí sang phải
      return { 
        ...op1, 
        pos: op1.pos + op2.text.length 
      };
    }
  }
  
  // Trường hợp: Insert vs Delete
  if (op1.type === 'insert' && op2.type === 'delete') {
    if (op1.pos <= op2.pos) {
      return { ...op1 };
    } else if (op1.pos >= op2.pos + op2.length) {
      // op1 ở sau vùng xóa → dịch trái
      return { 
        ...op1, 
        pos: op1.pos - op2.length 
      };
    }else {
      // op1 nằm trong vùng xóa → dịch về đầu vùng xóa
      return { 
        ...op1, 
        pos: op2.pos 
      };
    }
  }
  
  // Trường hợp: Delete vs Insert
  if (op1.type === 'delete' && op2.type === 'insert') {
    if (op2.pos <= op1.pos) {
      // Insert trước vùng xóa → dịch vùng xóa sang phải
      return { 
        ...op1, 
        pos: op1.pos + op2.text.length 
      };
    } else if (op2.pos >= op1.pos + op1.length) {
      return { ...op1 };
    } else {
      // Insert trong vùng xóa → tăng độ dài vùng xóa
      return { 
        ...op1, 
        length: op1.length + op2.text.length 
      };
    }
  }
  
  // Trường hợp: Delete vs Delete
  if (op1.type === 'delete' && op2.type === 'delete') {
    if (op1.pos >= op2.pos + op2.length) {
      // op1 ở sau vùng xóa của op2
      return { 
        ...op1, 
        pos: op1.pos - op2.length 
      };
    } else if (op1.pos + op1.length <= op2.pos) {
      return { ...op1 };
    }else {
      // Hai vùng xóa chồng lấn
      const newPos = Math.min(op1.pos, op2.pos);
      const end1 = op1.pos + op1.length;
      const end2 = op2.pos + op2.length;
      const newLength = Math.max(0, end1 - end2);
      return { 
        ...op1, 
        pos: newPos, 
        length: newLength 
      };
    }
  }
  
  return op1;
}
```

### 2.4 Ví Dụ Thực Tế

**Tình huống:**
- Tài liệu ban đầu: `"Hello"`
- User A: Insert `"!"` tại vị trí 5
- User B: Insert `" World"` tại vị trí 5

**Xử lý:**

```javascript
// Thao tác của A
const opA = { type: 'insert', pos: 5, text: '!' };

// Thao tác của B
const opB = { type: 'insert', pos: 5, text: ' World' };

// Server nhận opA trước, broadcast cho B
// B cần transform opB dựa trên opA
const opB_transformed = transform(opB, opA);
// Kết quả: { type: 'insert', pos: 6, text: ' World' }

// Kết quả cuối cùng: "Hello! World"
```

### 2.5 Ưu Điểm và Nhược Điểm

**Ưu điểm:**
- Logic rõ ràng, dễ hiểu
- Phù hợp với text editor đơn giản
- Đã được chứng minh trong Google Docs (phiên bản đầu)

**Nhược điểm:**
- Phức tạp khi mở rộng (nhiều loại thao tác)
- Cần server trung tâm để đảm bảo thứ tự
- Khó xử lý trong môi trường P2P (peer-to-peer)
- Phải xử lý nhiều trường hợp edge case

---

## 3. CRDT (Conflict-Free Replicated Data Type)

### 3.1 Khái Niệm Cơ Bản

**CRDT** là cấu trúc dữ liệu được thiết kế sao cho các thao tác **tự động có thể merge** mà không cần hàm chuyển đổi phức tạp.

**Nguyên lý:** Mỗi ký tự có một **ID duy nhất toàn cục** và **vị trí logic** (không phải index số).

### 3.2 Cấu Trúc Dữ Liệu

```javascript
// Mỗi ký tự là một object với ID và position
const doc = {
  "id1": { 
    char: 'H', 
    id: 'id1', 
    pos: 0.1,
    userId: 'user-A',
    timestamp: 1234567890
  },
  "id2": { 
    char: 'e', 
    id: 'id2', 
    pos: 0.2,
    userId: 'user-A',
    timestamp: 1234567891
  },
  "id3": { 
    char: 'l', 
    id: 'id3', 
    pos: 0.3,
    userId: 'user-A',
    timestamp: 1234567892
  },
  "id4": { 
    char: 'l', 
    id: 'id4', 
    pos: 0.4,
    userId: 'user-A',
    timestamp: 1234567893
  },
  "id5": { 
    char: 'o', 
    id: 'id5', 
    pos: 0.5,
    userId: 'user-A',
    timestamp: 1234567894
  }
};
```

### 3.3 Các Thao Tác Cơ Bản

#### Insert (Chèn)

```javascript
function insertAfter(afterId, newChar) {
  const afterNode = doc[afterId];
  
  // Tìm node tiếp theo
  const nextNode = findNextNode(afterId);
  
  // Tính position ở giữa
  const newPos = nextNode 
    ? (afterNode.pos + nextNode.pos) / 2 
    : afterNode.pos + 0.1;
  
  // Tạo ID duy nhất
  const newId = generateUniqueId(); // Ví dụ: 'user-A-timestamp-random'
  
  // Thêm vào document
  doc[newId] = {
    char: newChar,
    id: newId,
    pos: newPos,
    userId: getCurrentUserId(),
    timestamp: Date.now()
  };
  
  return newId;
}

// Ví dụ sử dụng
insertAfter('id1', '!');
// Kết quả: pos = (0.1 + 0.2) / 2 = 0.15
```

#### Delete (Xóa)

```javascript
function deleteChar(charId) {
  // Không xóa thật, chỉ đánh dấu
  if (doc[charId]) {
    doc[charId].deleted = true;
    doc[charId].deletedAt = Date.now();
  }
}

// Khi render, bỏ qua các ký tự đã xóa
function renderDocument() {
  return Object.values(doc)
    .filter(node => !node.deleted)
    .sort((a, b) => a.pos - b.pos)
    .map(node => node.char)
    .join('');
}
```

### 3.4 Ví Dụ Thực Tế

**Tình huống:**
- Tài liệu: `"Hello"` với các ID như trên
- User A: Insert `"!"` sau `"o"` (id5)
- User B: Insert `" World"` sau `"o"` (id5)

**Xử lý:**

```javascript
// User A thực hiện
const idA = insertAfter('id5', '!');
// doc[idA] = { char: '!', id: 'A-1', pos: 0.6, ... }

// User B thực hiện (đồng thời, chưa biết về A)
const idB1 = insertAfter('id5', ' ');
// doc[idB1] = { char: ' ', id: 'B-1', pos: 0.6, ... }

const idB2 = insertAfter(idB1, 'W');
// doc[idB2] = { char: 'W', id: 'B-2', pos: 0.7, ... }
// ... tiếp tục với 'o', 'r', 'l', 'd'
```

**Xung đột:**
- Cả `A-1` và `B-1` đều có `pos = 0.6`

**Giải quyết:**
```javascript
function renderDocument() {
  return Object.values(doc)
    .filter(node => !node.deleted)
    .sort((a, b) => {
      // Sắp xếp theo position
      if (a.pos !== b.pos) return a.pos - b.pos;
      
      // Nếu position giống nhau, dùng ID để đảm bảo tính xác định
      return a.id.localeCompare(b.id);
    })
    .map(node => node.char)
    .join('');
}

// Kết quả: "Hello! World" hoặc "Hello World!"
// (Tùy thuộc vào so sánh ID, nhưng NHẤT QUÁN trên mọi client)
```

### 3.5 Xử Lý Vấn Đề Position Hết Chỗ

Khi chèn nhiều lần giữa hai ký tự, position có thể hết độ chính xác (floating point).

**Giải pháp: Sử dụng chuỗi position**

```javascript
// Thay vì số, dùng mảng
const doc = {
  "id1": { char: 'H', pos: [0, 1] },
  "id2": { char: 'e', pos: [0, 2] }
};

function insertBetween(pos1, pos2) {
  // pos1 = [0, 1], pos2 = [0, 2]
  // newPos = [0, 1, 5] (thêm level mới)
  
  const newPos = [...pos1];
  newPos.push(5); // Giá trị giữa
  return newPos;
}

// So sánh position
function comparePos(pos1, pos2) {
  for (let i = 0; i < Math.max(pos1.length, pos2.length); i++) {
    const a = pos1[i] || 0;
    const b = pos2[i] || 0;
    if (a !== b) return a - b;
  }
  return 0;
}
```

### 3.6 Ưu Điểm và Nhược Điểm

**Ưu điểm:**
- Không cần server trung tâm (phù hợp P2P)
- Tự động merge, không cần transform phức tạp
- Dễ mở rộng (thêm loại thao tác mới)
- Được sử dụng trong: Figma, Notion, Yjs, Automerge

**Nhược điểm:**
- Tốn bộ nhớ (mỗi ký tự cần metadata)
- Phức tạp hơn để implement
- Cần garbage collection cho các ký tự đã xóa
- Position có thể phình to theo thời gian

---

## 4. So Sánh OT vs CRDT

| Tiêu Chí | OT | CRDT |
|----------|----|----- |
| **Kiến trúc** | Cần server trung tâm | P2P hoặc server đều được |
| **Độ phức tạp** | Transform function phức tạp | Cấu trúc dữ liệu phức tạp |
| **Bộ nhớ** | Ít (chỉ lưu text) | Nhiều (metadata cho mỗi ký tự) |
| **Hiệu suất** | Nhanh với text nhỏ | Tốt với mọi kích thước |
| **Tính nhất quán** | Phụ thuộc server | Tự động đảm bảo |
| **Ví dụ sử dụng** | Google Docs (cũ), Etherpad | Figma, Notion, VSCode Live Share |

---

## 5. Bài Tập Thực Hành

### Bài 1: Implement OT Transform Function

Hoàn thiện hàm `transform` để xử lý các trường hợp sau:

```javascript
// Test case 1: Insert vs Insert
const op1 = { type: 'insert', pos: 3, text: 'X' };
const op2 = { type: 'insert', pos: 3, text: 'Y' };
// Kết quả mong đợi: op1' = { type: 'insert', pos: 4, text: 'X' }

// Test case 2: Delete vs Insert
const op1 = { type: 'delete', pos: 2, length: 3 };
const op2 = { type: 'insert', pos: 3, text: 'Z' };
// Kết quả mong đợi: op1' = { type: 'delete', pos: 2, length: 4 }

// Test case 3: Delete vs Delete
const op1 = { type: 'delete', pos: 2, length: 3 };
const op2 = { type: 'delete', pos: 3, length: 2 };
// Kết quả mong đợi: op1' = { type: 'delete', pos: 2, length: 2 }
```

### Bài 2: Implement CRDT Insert

Viết hàm `insertAt` để chèn ký tự vào vị trí bất kỳ trong document:

```javascript
const doc = {
  "id1": { char: 'H', id: 'id1', pos: 0.1 },
  "id2": { char: 'i', id: 'id2', pos: 0.2 }
};

function insertAt(index, char) {
  // TODO: Implement
  // 1. Tìm node tại index
  // 2. Tính position mới
  // 3. Tạo node mới
  // 4. Thêm vào doc
}

// Test
insertAt(1, 'e'); // "Hei"
insertAt(2, 'l'); // "Heil" -> "Heil"
```

### Bài 3: Xử Lý Xung Đột

Cho tình huống:
- Document: `"ABC"`
- User 1: Delete ký tự 'B' (pos 1, length 1)
- User 2: Insert 'X' tại vị trí 2

Hãy:
1. Vẽ sơ đồ thứ tự thao tác
2. Tính toán kết quả với OT
3. Tính toán kết quả với CRDT
4. So sánh hai kết quả

### Bài 4: Implement Garbage Collection cho CRDT

Viết hàm dọn dẹp các ký tự đã xóa lâu hơn 30 ngày:

```javascript
function garbageCollect(doc, retentionDays = 30) {
  // TODO: Implement
  // 1. Tìm các node có deleted = true
  // 2. Kiểm tra deletedAt
  // 3. Xóa khỏi doc nếu quá hạn
}
```

### Bài 5: Mở Rộng - Rich Text

Thiết kế cấu trúc CRDT cho rich text (bold, italic, color):

```javascript
// Gợi ý cấu trúc
const doc = {
  "id1": { 
    char: 'H', 
    id: 'id1', 
    pos: 0.1,
    styles: {
      bold: true,
      italic: false,
      color: '#FF0000'
    }
  }
};

// Implement hàm apply style
function applyStyle(startId, endId, styleName, styleValue) {
  // TODO: Implement
}
```

---

## Tài Liệu Tham Khảo

1. **OT:**
   - Paper gốc: "Operational Transformation in Real-Time Group Editors" (Ellis & Gibbs, 1989)
   - Google Wave Protocol

2. **CRDT:**
   - Paper: "A comprehensive study of Convergent and Commutative Replicated Data Types" (Shapiro et al., 2011)
   - Yjs Documentation: https://docs.yjs.dev/
   - Automerge: https://automerge.org/

3. **Implementation:**
   - ShareDB (OT): https://github.com/share/sharedb
   - Yjs (CRDT): https://github.com/yjs/yjs
   - Automerge (CRDT): https://github.com/automerge/automerge

---

## Câu Hỏi Ôn Tập

1. Tại sao OT cần server trung tâm còn CRDT thì không?
2. Trong CRDT, tại sao phải dùng ID thay vì index số?
3. Làm thế nào để đảm bảo tính nhân quả (causality) trong hệ thống phân tán?
4. So sánh độ phức tạp thời gian của OT và CRDT khi xử lý N thao tác đồng thời.
5. Thiết kế một hệ thống collaborative editor cho 1000 người dùng đồng thời - bạn chọn OT hay CRDT? Tại sao?

---

**Lưu ý:** Study guide này tập trung vào nguyên lý cốt lõi. Trong thực tế, các implementation như Yjs, Automerge có nhiều tối ưu hóa phức tạp hơn (như vector clocks, lamport timestamps, delta compression, v.v.).
