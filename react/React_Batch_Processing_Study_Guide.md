# Study Guide: Batch Processing trong React

## Mục lục
1. [Batch Processing là gì?](#batch-processing-là-gì)
2. [Batch Processing trong React < 18](#batch-processing-trong-react--18)
3. [Automatic Batch Processing trong React 18+](#automatic-batch-processing-trong-react-18)
4. [So sánh React 17 vs React 18](#so-sánh-react-17-vs-react-18)
5. [Cơ chế hoạt động bên trong](#cơ-chế-hoạt-động-bên-trong)
6. [Bài tập thực hành](#bài-tập-thực-hành)

---

## Batch Processing là gì?

**Batch Processing** (xử lý theo lô) là cơ chế React gom nhiều lần cập nhật state lại và chỉ render lại component **một lần duy nhất** thay vì render nhiều lần.

### Tại sao cần Batch Processing?

```javascript
// Không có batch processing
setCount(1);    // → Render lần 1
setName('An');  // → Render lần 2
setAge(25);     // → Render lần 3
// Tổng: 3 lần render → Hiệu suất kém

// Có batch processing
setCount(1);
setName('An');
setAge(25);
// → Chỉ render 1 lần → Hiệu suất tốt
```

**Lợi ích:**
- ✅ Giảm số lần render không cần thiết
- ✅ Cải thiện hiệu suất ứng dụng
- ✅ Tránh trạng thái "nửa vời" (partial state)

---

## Batch Processing trong React < 18

### Hoạt động như thế nào?

Trong React 17 và các phiên bản trước, batch processing **chỉ hoạt động** trong các **React event handlers** (sự kiện tổng hợp).

### ✅ Các trường hợp được batch

```javascript
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    console.log('Trước khi update');
    
    setCount(c => c + 1);  // Không render ngay
    setFlag(f => !f);      // Không render ngay
    
    console.log('Sau khi update');
    // React gom 2 update này lại và chỉ render 1 lần
  };

  console.log('Render!');
  return <button onClick={handleClick}>Click me</button>;
}
```

**Kết quả khi click:**
```
Trước khi update
Sau khi update
Render!  ← Chỉ render 1 lần
```

### ❌ Các trường hợp KHÔNG được batch

#### 1. Trong setTimeout

```javascript
const handleClick = () => {
  setTimeout(() => {
    setCount(c => c + 1); // → Render lần 1
    setFlag(f => !f);     // → Render lần 2
  }, 0);
};
```

**Kết quả:**
```
Render!  ← Lần 1 (do setCount)
Render!  ← Lần 2 (do setFlag)
```

#### 2. Trong Promise

```javascript
const handleClick = () => {
  fetch('/api/data')
    .then(() => {
      setCount(c => c + 1); // → Render lần 1
      setFlag(f => !f);     // → Render lần 2
    });
};
```

#### 3. Trong Native Event (sự kiện DOM gốc)

```javascript
useEffect(() => {
  document.addEventListener('click', () => {
    setCount(c => c + 1); // → Render lần 1
    setFlag(f => !f);     // → Render lần 2
  });
}, []);
```

### Cơ chế Transaction (Giao dịch)

React 17 sử dụng **transaction mechanism** để quản lý batch:

```javascript
// Giả lập cơ chế transaction
function batchedUpdates(callback) {
  isBatchingUpdates = true;  // Bật chế độ batch
  try {
    callback();              // Thực thi các setState
  }finally {
    isBatchingUpdates = false; // Tắt chế độ batch
    flushUpdates();           // Xử lý tất cả updates
  }
}

// React tự động wrap event handlers
<button onClick={batchedUpdates(handleClick)} />
```

**Vấn đề:** React không thể wrap các callback bất đồng bộ (setTimeout, Promise) → Không batch được!

---

## Automatic Batch Processing trong React 18+

### Thay đổi lớn nhất

React 18 giới thiệu **Automatic Batching** - batch processing hoạt động ở **MỌI NƠI**:
- ✅ Event handlers
- ✅ setTimeout / setInterval
- ✅ Promise / async-await
- ✅ Native events
- ✅ useEffect / useLayoutEffect

### Ví dụ minh họa

```javascript
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // ✅ Batch trong event handler
  const handleClick = () => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // → Chỉ render 1 lần
  };

  // ✅ Batch trong setTimeout
  const handleTimeout = () => {
    setTimeout(() => {
      setCount(c => c + 1);
      setFlag(f => !f);
      // → Chỉ render 1 lần (khác với React 17!)
    }, 1000);
  };

  // ✅ Batch trong Promise
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    setCount(data.count);
    setFlag(data.flag);
    // → Chỉ render 1 lần
  };

  // ✅ Batch trong native event
  useEffect(() => {
    const handler = () => {
      setCount(c => c + 1);
      setFlag(f => !f);
      // → Chỉ render 1 lần
    };
    
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Flag: {flag.toString()}</p>
      <button onClick={handleClick}>Click</button>
      <button onClick={handleTimeout}>Timeout</button>
      <button onClick={fetchData}>Fetch</button>
    </div>
  );
}
```

### Tắt Automatic Batching (nếu cần)

Trong trường hợp hiếm hoi cần render ngay lập tức:

```javascript
import { flushSync }from 'react-dom';

const handleClick = () => {
  flushSync(() => {
    setCount(c => c + 1);
  });
  // DOM đã được cập nhật ở đây
  
  flushSync(() => {
    setFlag(f => !f);
  });
  // DOM lại được cập nhật
};
```

---

## So sánh React 17 vs React 18

| Tình huống | React 17 | React 18 |
|-----------|----------|----------|
| Event handlers (`onClick`, `onChange`) | ✅ Batch | ✅ Batch |
| `setTimeout` / `setInterval` | ❌ Không batch | ✅ Batch |
| `Promise` / `async-await` | ❌ Không batch | ✅ Batch |
| Native events (`addEventListener`) | ❌ Không batch | ✅ Batch |
| `fetch` callbacks | ❌ Không batch | ✅ Batch |

### Demo so sánh

```javascript
// React 17
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setTimeout(() => {
      setCount(c => c + 1); // Render lần 1
      setCount(c => c + 1); // Render lần 2
      setCount(c => c + 1); // Render lần 3
    }, 0);
  };
  
  console.log('Render'); // In ra 3 lần
  return <button onClick={handleClick}>+3</button>;
}

// React 18
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setTimeout(() => {
      setCount(c => c + 1);
      setCount(c => c + 1);
      setCount(c => c + 1);
      // Chỉ render 1 lần!
    }, 0);
  };
  
  console.log('Render'); // Chỉ in ra 1 lần
  return <button onClick={handleClick}>+3</button>;
}
```

---

## Cơ chế hoạt động bên trong

### 1. Update Queue (Hàng đợi cập nhật)

Mỗi khi gọi `setState`, React tạo một **update object** và đưa vào queue:

```javascript
function dispatchSetState(fiber, queue, action) {
  // Tạo update object
  const update = {
    lane: requestUpdateLane(fiber), // Gán độ ưu tiên
    action: action,                 // Hàm hoặc giá trị mới
    next: null                      // Con trỏ đến update tiếp theo
  };
  
  // Thêm vào hàng đợi
  enqueueUpdate(fiber, queue, update);
  
  // Lên lịch xử lý
  scheduleUpdateOnFiber(fiber);
}
```

**Ví dụ:**
```javascript
setCount(1);  // → Update 1 vào queue
setName('A'); // → Update 2 vào queue
setAge(25);   // → Update 3 vào queue

// Queue: [Update1] → [Update2] → [Update3]
```

### 2. Lane Model (Mô hình làn đường)

React 18 sử dụng **Lane Model** để quản lý độ ưu tiên:

```javascript
// Các mức độ ưu tiên (đơn giản hóa)
export const SyncLane              = 0b0000000000000000000000000000001; // Đồng bộ
export const InputContinuousLane   = 0b0000000000000000000000000000100; // Input liên tục
export const DefaultLane           = 0b0000000000000000000000000010000; // Mặc định
export const TransitionLane        = 0b0000000000000000000001000000000; // Transition
export const IdleLane              = 0b0100000000000000000000000000000; // Idle
```

**Ví dụ phân loại:**
```javascript
// Click button → SyncLane (ưu tiên cao nhất)
<button onClick={() => setCount(1)}>Click</button>

// Typing input → InputContinuousLane
<input onChange={(e) => setText(e.target.value)} />

// startTransition → TransitionLane (ưu tiên thấp)
startTransition(() => {
  setSearchResults(data);
});
```

### 3. Scheduling Merge (Lên lịch và gộp)

```javascript
function scheduleUpdateOnFiber(root, fiber, lane) {
  // Đánh dấu root cần cập nhật
  markRootUpdated(root, lane);
  
  // Đảm bảo root được lên lịch
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  // Lấy tất cả lanes đang chờ
  const nextLanes = getNextLanes(root);
  
  // Gộp tất cả updates cùng priority
  if (nextLanes === SyncLane) {
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
  }
}
```

### 4. Render Phase (Giai đoạn render)

```javascript
function performConcurrentWorkOnRoot(root) {
  // Xử lý tất cả updates trong queue
  const lanes = getNextLanes(root);
  
  // Tính toán state mới
  renderRootConcurrent(root, lanes);
  
  // Commit thay đổi vào DOM
  commitRoot(root);
}
```

### Sơ đồ luồng hoạt động

```
User Action (Click, Type, etc.)
        ↓
   setState() được gọi
        ↓
   Tạo Update Object
        ↓
   Gán Lane (Priority)
        ↓
   Thêm vào Update Queue
        ↓
   Schedule Update
        ↓
   Gộp tất cả Updates cùng priority
        ↓
   Tính toán State mới
        ↓
   Render Virtual DOM
        ↓
   Commit vào Real DOM
        ↓
   Browser Paint
```

---

## Bài tập thực hành

### Bài 1: Phân tích số lần render

```javascript
function Exercise1() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  
  console.log('Render');
  
  const handleClick = () => {
    setCount(c => c + 1);
    setText('Updated');
    setCount(c => c + 1);
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

**Câu hỏi:**
- React 17: Render mấy lần khi click?
- React 18: Render mấy lần khi click?
- `count` sẽ tăng lên bao nhiêu?

<details>
<summary>Đáp án</summary>

- React 17: **1 lần** (batch trong event handler)
- React 18: **1 lần** (automatic batch)
- `count` tăng lên **2** (từ 0 → 2)
</details>

---

### Bài 2: Async batch

```javascript
function Exercise2() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  console.log('Render');
  
  const handleClick = async () => {
    await fetch('/api');
    setCount(c => c + 1);
    setFlag(f => !f);
  };
  
  return <button onClick={handleClick}>Fetch</button>;
}
```

**Câu hỏi:**
- React 17: Render mấy lần sau khi fetch xong?
- React 18: Render mấy lần sau khi fetch xong?

<details>
<summary>Đáp án</summary>

- React 17: **2 lần** (không batch trong Promise)
- React 18: **1 lần** (automatic batch)
</details>

---

### Bài 3: FlushSync

```javascript
import { flushSync } from 'react-dom';

function Exercise3() {
  const [count, setCount] = useState(0);
  
  console.log('Render');
  
  const handleClick = () => {
    flushSync(() => {
      setCount(1);
    });
    console.log('After first update');
    
    flushSync(() => {
      setCount(2);
    });
    console.log('After second update');
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

**Câu hỏi:** Console sẽ in ra gì khi click?

<details>
<summary>Đáp án</summary>

```
Render (count = 1)
After first update
Render (count = 2)
After second update
```

`flushSync` buộc React render ngay lập tức, không batch.
</details>

---

### Bài 4: Mixed scenarios

```javascript
function Exercise4() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
  console.log('Render');
  
  const handleClick = () => {
    setA(1);
    
    setTimeout(() => {
      setB(2);
      
      Promise.resolve().then(() => {
        setC(3);
      });
    }, 0);
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

**Câu hỏi (React 18):** Render mấy lần và theo thứ tự nào?

<details>
<summary>Đáp án</summary>

**3 lần render:**
1. `setA(1)` → Render (a=1, b=0, c=0)
2. `setB(2)` → Render (a=1, b=2, c=0)
3. `setC(3)` → Render (a=1, b=2, c=3)

Mặc dù React 18 có automatic batch, nhưng các updates ở **các microtasks/macrotasks khác nhau** vẫn render riêng.
</details>

---

## Tổng kết

### Key Takeaways

1. **React < 18:**
   - Chỉ batch trong React event handlers
   - Không batch trong setTimeout, Promise, native events

2. **React 18+:**
   - Automatic batch ở mọi nơi
   - Sử dụng Lane Model để quản lý priority
   - Có thể tắt batch bằng `flushSync()`

3. **Lợi ích:**
   - Giảm số lần render
   - Cải thiện hiệu suất
   - Code đơn giản hơn, không cần `unstable_batchedUpdates`

### Best Practices

✅ **Nên:**
- Để React tự động batch (mặc định)
- Sử dụng functional updates khi state phụ thuộc giá trị cũ
- Nhóm các updates liên quan gần nhau

❌ **Không nên:**
- Lạm dụng `flushSync()` (chỉ dùng khi thực sự cần)
- Tách các updates liên quan ra nhiều event handlers
- Lo lắng quá về batch trong React 18+

---

## Tài liệu tham khảo

- [React 18 Automatic Batching](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- [Lane Model RFC](https://github.com/facebook/react/pull/18796)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

---

**Chúc bạn học tốt! 🚀**
