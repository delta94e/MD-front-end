# JavaScript WeakRef - Deep Dive

## 1. WeakRef là gì?

`WeakRef` là một tính năng trong JavaScript cho phép bạn tạo một tham chiếu "yếu" tới một đối tượng, nghĩa là đối tượng đó vẫn có thể bị thu gom rác (garbage collected) nếu không còn tham chiếu "mạnh" nào khác.

- Được giới thiệu trong ECMAScript 2021 (ES12).
- Dùng chủ yếu trong các trường hợp cần quản lý cache hoặc các object lớn mà không muốn ngăn engine thu gom rác.

---

## 2. Khi nào nên dùng WeakRef?
- Khi bạn muốn giữ dữ liệu trong cache nhưng không muốn việc này cản trở garbage collector.
- Khi cần quản lý lifecycle của object phức tạp mà không gây memory leak.

---

## 3. Cú pháp sử dụng

```js
const ref = new WeakRef(obj);
const value = ref.deref(); // Lấy lại object nếu nó chưa bị GC
```

- `new WeakRef(obj)`: Tạo WeakRef tới object `obj`.
- `ref.deref()`: Nếu object vẫn tồn tại, trả về chính object; nếu đã bị thu gom rác thì trả về `undefined`.

---

## 4. Ví dụ thực tế

### Simple Usage
```js
let obj = { data: 'important' };
const ref = new WeakRef(obj);

console.log(ref.deref()); // { data: 'important' }

obj = null; // Đối tượng này giờ chỉ còn WeakRef.

// Sau GC, ref.deref() có thể trả về undefined
```

### Dùng WeakRef trong cache
```js
const cache = new Map();

function getCachedResource(key, createFn) {
  let ref = cache.get(key);
  let value = ref && ref.deref();
  if (!value) {
    value = createFn();
    cache.set(key, new WeakRef(value));
  }
  return value;
}
```

---

## 5. Lưu ý & Rủi ro
- Không nên phụ thuộc vào WeakRef để làm logic business quan trọng — dữ liệu có thể biến mất bất cứ lúc nào!
- Chỉ dùng cho các use case đặc biệt như cache, memoization, hoặc quản lý resource tạm thời.
- Nên dùng kết hợp với `FinalizationRegistry` để xử lý cleanup khi object bị GC.

---

## 6. Kết hợp với FinalizationRegistry

```js
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object ${heldValue} đã bị thu gom.`);
});

let obj = { foo: 'bar' };
const ref = new WeakRef(obj);
registry.register(obj, 'myObj');

obj = null; // Khi bị GC sẽ log message
```

---

## 7. Kết luận
- WeakRef giúp bạn kiểm soát tốt hơn bộ nhớ trong các trường hợp đặc biệt.
- Phù hợp nhất cho cache không quan trọng, tránh memory leak.
- Hạn chế lạm dụng trong application logic cốt lõi.

**Tham khảo:**
- MDN Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
- ECMAScript Spec: https://tc39.es/ecma262/#sec-weak-ref-objects
