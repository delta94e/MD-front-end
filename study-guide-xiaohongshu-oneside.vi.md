# Study Guide - Xiaohongshu Interview (Vòng 1)

## 📋 Tổng quan

Tài liệu này tổng hợp các câu hỏi và kiến thức cần chuẩn bị cho vòng phỏng vấn kỹ thuật đầu tiên tại Xiaohongshu.

---

## 🎯 Phần 1: Câu hỏi về Dự án

### 1.1 Nền tảng Visual Building - Thiết kế và Triển khai Component Rubik's Cube

**Chuẩn bị:**
- Giải thích kiến trúc của hệ thống visual building
- Mô tả cách thiết kế component Rubik's Cube (drag-and-drop, layout system)
- Các thách thức kỹ thuật: state management, component composition, performance
- Cách xử lý dynamic rendering và configuration

**Ví dụ trả lời:**
```
Component Rubik's Cube là một hệ thống layout linh hoạt cho phép:
- Drag & drop các component vào grid layout
- Resize và reposition động
- Lưu trữ configuration dưới dạng JSON schema
- Render real-time preview
```

### 1.2 Tối ưu Performance - Tăng tốc độ tải Resource

**Các kỹ thuật cần đề cập:**
- Code splitting và lazy loading
- Image optimization (WebP, lazy loading, responsive images)
- Bundle size reduction (tree shaking, minification)
- Caching strategies (Service Worker, HTTP caching)
- CDN usage
- Preloading/Prefetching critical resources
- Compression (Gzip, Brotli)

**Metrics để đo lường:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Bundle size reduction percentage

### 1.3 Tại sao chọn Recoil cho State Management?

**So sánh với các giải pháp khác:**

| Feature | Recoil | Redux | Context API | Zustand |
|---------|--------|-------|-------------|---------|
| Boilerplate | Ít | Nhiều | Ít | Ít |
| Performance | Tốt (atomic) | Tốt | Kém (re-render) | Tốt |
| Learning curve | Trung bình | Cao | Thấp | Thấp |
| React integration | Xuất sắc | Tốt | Native | Tốt |

**Ưu điểm của Recoil:**
- Atomic state management - chỉ re-render component cần thiết
- Derived state với selectors
- Async data queries built-in
- Tích hợp tốt với React Concurrent Mode
- API đơn giản, gần gũi với React Hooks

**Ví dụ code:**
```javascript
// Atom definition
const userState = atom({
  key: 'userState',
  default: null,
});

// Selector với async query
const userDataSelector = selector({
  key: 'userDataSelector',
  get: async ({get}) => {
    const userId = get(userState);
    const response = await fetch(`/api/user/${userId}`);
    return response.json();
  },
});

// Sử dụng trong component
function UserProfile() {
  const [user, setUser] = useRecoilState(userState);
  const userData = useRecoilValue(userDataSelector);
  
  return <div>{userData.name}</div>;
}
```

---

## 🔧 Phần 2: Kiến thức Cơ bản

### 2.1 Sự khác biệt giữa == và === trong JavaScript

**== (Loose Equality - So sánh lỏng lẻo):**
- Thực hiện type coercion (ép kiểu) trước khi so sánh
- So sánh giá trị sau khi chuyển đổi kiểu

**=== (Strict Equality - So sánh nghiêm ngặt):**
- Không thực hiện type coercion
- So sánh cả giá trị và kiểu dữ liệu

**Ví dụ:**
```javascript
// Loose equality (==)
5 == "5"        // true (string được chuyển thành number)
0 == false      // true
null == undefined // true
[] == false     // true
"" == 0         // true

// Strict equality (===)
5 === "5"       // false (khác kiểu)
0 === false     // false
null === undefined // false
[] === false    // false
"" === 0        // false

// Best practice: Luôn dùng ===
const value = getUserInput();
if (value === 0) {  // Chỉ true khi value là số 0
  // handle zero
}
```

**Quy tắc type coercion của ==:**
1. Nếu cùng kiểu → so sánh trực tiếp
2. null == undefined → true
3. Number vs String → chuyển String thành Number
4. Boolean → chuyển thành Number (true=1, false=0)
5. Object vs Primitive → gọi valueOf() hoặc toString()

### 2.2 Vấn đề về Dependency trong useEffect

**Các vấn đề thường gặp:**

#### 1. Missing Dependencies
```javascript
// ❌ Sai: thiếu dependency
function Component({ userId }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setData);
  }, []); // userId không có trong deps → stale closure
  
  return <div>{data?.name}</div>;
}

// ✅ Đúng: thêm đầy đủ dependencies
useEffect(() => {
  fetchUser(userId).then(setData);
}, [userId]);
```

#### 2. Object/Array Dependencies
```javascript
// ❌ Sai: object mới mỗi lần render
function Component() {
  const config = { api: '/users', limit: 10 };
  
  useEffect(() => {
    fetchData(config);
  }, [config]); // config luôn khác nhau → infinite loop
}

// ✅ Đúng: dùng useMemo hoặc tách ra primitive values
function Component() {
  const config = useMemo(
    () => ({ api: '/users', limit: 10 }),
    []
  );
  
  useEffect(() => {
    fetchData(config);
  }, [config]);
}

// Hoặc
function Component() {
  useEffect(() => {
    const config = { api: '/users', limit: 10 };
    fetchData(config);
  }, []); // config được tạo bên trong effect
}
```

#### 3. Function Dependencies
```javascript
// ❌ Sai: function được tạo mới mỗi render
function Component({ onSuccess }) {
  const handleSubmit = () => {
    submitForm().then(onSuccess);
  };
  
  useEffect(() => {
    setupListener(handleSubmit);
  }, [handleSubmit]); // handleSubmit luôn mới
}

// ✅ Đúng: dùng useCallback
function Component({ onSuccess }) {
  const handleSubmit = useCallback(() => {
    submitForm().then(onSuccess);
  }, [onSuccess]);
  
  useEffect(() => {
    setupListener(handleSubmit);
  }, [handleSubmit]);
}
```

#### 4. Cleanup Function
```javascript
// ✅ Đúng: cleanup để tránh memory leak
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal)
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });
  
  return () => {
    controller.abort(); // Cleanup khi unmount hoặc deps thay đổi
  };
}, []);
```

**Best Practices:**
- Luôn khai báo đầy đủ dependencies (dùng ESLint rule)
- Dùng `useCallback` cho functions
- Dùng `useMemo` cho objects/arrays
- Tách logic phức tạp thành custom hooks
- Cleanup subscriptions, timers, requests

### 2.3 Các phương pháp tối ưu React

#### 1. Component Optimization

**React.memo**
```javascript
// Ngăn re-render khi props không đổi
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render logic */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

**useMemo**
```javascript
// Cache kết quả tính toán phức tạp
function Component({ items }) {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.value - b.value);
  }, [items]);
  
  return <List items={sortedItems} />;
}
```

**useCallback**
```javascript
// Cache function reference
function Parent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Function không đổi giữa các render
  
  return <Child onClick={handleClick} />;
}
```

#### 2. Code Splitting & Lazy Loading

```javascript
// Route-based code splitting
const Dashboard = lazy(() => import('./Dashboard'));
const Profile = lazy(() => import('./Profile'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />}/>
      </Routes>
    </Suspense>
  );
}

// Component-based lazy loading
const HeavyChart = lazy(() => import('./HeavyChart'));

function Analytics() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>
      {showChart && (
        <Suspense fallback={<Spinner />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

#### 3. Virtualization (Windowing)

```javascript
// Dùng react-window cho danh sách dài
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

#### 4. State Management Optimization

```javascript
// Tách state để giảm re-render
// ❌ Sai: toàn bộ form re-render khi 1 field thay đổi
function Form() {
  const [formData, setFormData] = useState({
    name: '', email: '', address: ''
  });
  
  return (
    <>
      <Input value={formData.name} 
             onChange={e => setFormData({...formData, name: e.target.value})} />
      <Input value={formData.email} 
             onChange={e => setFormData({...formData, email: e.target.value})} />
    </>
  );
}

// ✅ Đúng: mỗi field có state riêng
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  return (
    <>
      <Input value={name} onChange={e => setName(e.target.value)} />
      <Input value={email} onChange={e => setEmail(e.target.value)} />
    </>
  );
}
```

#### 5. Debouncing & Throttling

```javascript
// Debounce search input
function SearchBox() {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      performSearch(value);
    }, 300),
    []
  );
  
  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  return <input value={query} onChange={handleChange} />;
}
```

#### 6. Image Optimization

```javascript
// Lazy load images
function LazyImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setImageSrc(src);
        observer.disconnect();
      }
    });
    
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);
  
  return <img ref={imgRef} src={imageSrc || placeholder}alt={alt} />;
}
```

#### 7. Key Optimization

```javascript
// ✅ Dùng stable, unique key
items.map(item => (
  <Item key={item.id} data={item} />
))

// ❌ Không dùng index làm key khi list có thể thay đổi
items.map((item, index) => (
  <Item key={index} data={item}/> // Có thể gây bug
))
```

---

## 💻 Phần 3: Bài tập Coding

### 3.1 Implement hàm `promisify`

**Yêu cầu:** Chuyển đổi Node.js callback-style function thành Promise-based function.

**Giải pháp:**

```javascript
/**
 * Promisify - Chuyển callback function thành Promise
 * @param {Function} fn - Function theo pattern callback(err, result)
 * @returns {Function} - Function trả về Promise
 */
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      // Thêm callback vào cuối arguments
      fn(...args, (err, result) => {
        if (err) {
          reject(err);
        }else {
          resolve(result);
        }
      });
    });
  };
}

// Ví dụ sử dụng với fs.writeFile
const fs = require('fs');

// Cách cũ: callback style
fs.writeFile('file.txt', 'content', (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Success');
  }
});

// Cách mới: Promise style
const writeFilePromise = promisify(fs.writeFile);

writeFilePromise('file.txt', 'content')
  .then(() => console.log('Success'))
  .catch(err => console.error(err));

// Hoặc dùng async/await
async function writeData() {
  try {
    await writeFilePromise('file.txt', 'content');
    console.log('Success');
  } catch (err) {
    console.error(err);
  }
}
```

**Phiên bản nâng cao (xử lý multiple results):**

```javascript
function promisify(fn, options = {}) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, ...results) => {
        if (err) {
          reject(err);
        } else {
          // Nếu có nhiều kết quả, trả về array
          if (options.multiArgs) {
            resolve(results);
          } else {
            resolve(results[0]);
          }
        }
      });
    });
  };
}

// Ví dụ với function có nhiều kết quả
function multiResultFn(callback) {
  callback(null, 'result1', 'result2', 'result3');
}

const promisified = promisify(multiResultFn, { multiArgs: true });
promisified().then(results => {
  console.log(results); // ['result1', 'result2', 'result3']
});
```

**Test cases:**

```javascript
// Test 1: Success case
function asyncAdd(a, b, callback) {
  setTimeout(() => callback(null, a + b), 100);
}

const promisifiedAdd = promisify(asyncAdd);
promisifiedAdd(2, 3).then(result => {
  console.log(result); // 5
});

// Test 2: Error case
function asyncError(callback) {
  setTimeout(() => callback(new Error('Something went wrong')), 100);
}

const promisifiedError = promisify(asyncError);
promisifiedError().catch(err => {
  console.log(err.message); // 'Something went wrong'
});

// Test 3: Context binding
const obj = {
  value: 42,
  getValue(callback) {
    callback(null, this.value);
  }
};

const promisifiedGetValue = promisify(obj.getValue);
promisifiedGetValue.call(obj).then(result => {
  console.log(result); // 42
});
```

### 3.2 LeetCode 103 - Binary Tree Zigzag Level Order Traversal

**Đề bài:** Duyệt cây nhị phân theo từng level, nhưng đổi chiều mỗi level (zigzag).

**Ví dụ:**
```
Input:
    3
   / \
  9  20
    /  \
   15   7

Output: [[3], [20,9], [15,7]]
```

**Giải pháp 1: BFS với flag đảo chiều**

```javascript
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function zigzagLevelOrder(root) {
  if (!root) return [];
  
  const result = [];
  const queue = [root];
  let leftToRight = true;
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      
      // Thêm vào đầu hoặc cuối tùy theo chiều
      if (leftToRight) {
        currentLevel.push(node.val);
      }else {
        currentLevel.unshift(node.val);
      }
      
      // Thêm children vào queue
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(currentLevel);
    leftToRight = !leftToRight; // Đổi chiều
  }
  
  return result;
}
```

**Giải pháp 2: BFS với reverse**

```javascript
function zigzagLevelOrder(root) {
  if (!root) return [];
  
  const result = [];
  const queue = [root];
  let level = 0;
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    // Reverse nếu level lẻ
    if (level % 2 === 1) {
      currentLevel.reverse();
    }
    
    result.push(currentLevel);
    level++;
  }
  
  return result;
}
```

**Giải pháp 3: DFS (Recursive)**

```javascript
function zigzagLevelOrder(root) {
  const result = [];
  
  function dfs(node, level) {
    if (!node) return;
    
    // Tạo array cho level mới
    if (result.length === level) {
      result.push([]);
    }
    
    // Thêm vào đầu hoặc cuối tùy theo level
    if (level % 2 === 0) {
      result[level].push(node.val);
    } else {
      result[level].unshift(node.val);
    }
    
    // Duyệt children
    dfs(node.left, level + 1);
    dfs(node.right, level + 1);
  }
  
  dfs(root, 0);
  return result;
}
```

**Phân tích độ phức tạp:**

| Giải pháp | Time Complexity | Space Complexity | Ưu điểm |
|-----------|----------------|------------------|---------|
| BFS + unshift | O(n) | O(n) | Trực quan, dễ hiểu |
| BFS + reverse | O(n) | O(n) | Code đơn giản hơn |
| DFS | O(n) | O(h) | Space tốt hơn với cây cân bằng |

**Test cases:**

```javascript
// Helper: Tạo TreeNode
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Test 1: Normal case
const tree1 = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20,
    new TreeNode(15),
    new TreeNode(7)
  )
);
console.log(zigzagLevelOrder(tree1));
// Output: [[3], [20,9], [15,7]]

// Test 2: Single node
const tree2 = new TreeNode(1);
console.log(zigzagLevelOrder(tree2));
// Output: [[1]]

// Test 3: Empty tree
console.log(zigzagLevelOrder(null));
// Output: []

// Test 4: Skewed tree
const tree3 = new TreeNode(1,
  new TreeNode(2,
    new TreeNode(3,
      new TreeNode(4)
    )
  )
);
console.log(zigzagLevelOrder(tree3));
// Output: [[1], [2], [3], [4]]
```

---

## 📝 Checklist Chuẩn bị

### Kiến thức kỹ thuật
- [ ] Hiểu rõ kiến trúc dự án và các thách thức đã giải quyết
- [ ] Nắm vững Recoil và so sánh với các state management khác
- [ ] Thành thạo JavaScript fundamentals (==, ===, type coercion)
- [ ] Hiểu sâu về React Hooks (useEffect dependencies)
- [ ] Biết các kỹ thuật tối ưu React performance
- [ ] Luyện tập coding problems (promisify, tree traversal)

### Soft skills
- [ ] Chuẩn bị câu chuyện về dự án (STAR method)
- [ ] Luyện giải thích technical concepts một cách rõ ràng
- [ ] Chuẩn bị câu hỏi để hỏi interviewer

### Trước phỏng vấn
- [ ] Review lại code của các dự án chính
- [ ] Chạy thử các đoạn code example
- [ ] Chuẩn bị môi trường (nếu live coding)

---

## 💡 Tips Phỏng vấn

1. **Khi trả lời về dự án:**
   - Bắt đầu với context và problem
   - Giải thích solution và trade-offs
   - Đề cập đến kết quả/impact (metrics nếu có)

2. **Khi giải coding problem:**
   - Clarify requirements trước
   - Nói ra suy nghĩ (think aloud)
   - Bắt đầu với brute force, sau đó optimize
   - Viết test cases
   - Phân tích time/space complexity

3. **Khi không biết câu trả lời:**
   - Thành thật thừa nhận
   - Đưa ra suy luận logic
   - Hỏi hints nếu cần

Chúc bạn phỏng vấn thành công! 🚀
