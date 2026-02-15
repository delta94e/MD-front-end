# REMOVING EFFECT DEPENDENCIES — DEEP DIVE

> 📚 Tài liệu học chuyên sâu dành cho Senior Frontend Developer
> Phong cách: Giải thích chi tiết bằng tiếng Việt + code examples + interview preparation

---

## PHẦN A: CORE CONCEPTS — HIỂU SÂU TỪ GỐC

> 💡 **Mindset**: Effect dependencies KHÔNG phải thứ bạn "chọn" — chúng được XÁC ĐỊNH bởi code bên trong Effect. Hiểu nguyên tắc này = giải quyết được 90% vấn đề.

### Tổng Quan Bài Toán

**Vấn đề cốt lõi:**

- Effect đọc reactive values (props, state, biến trong component body)
- Linter BẮT BUỘC bạn khai báo chúng trong dependency array
- Dependencies KHÔNG CẦN THIẾT → Effect chạy quá nhiều lần hoặc INFINITE LOOP
- Bạn cần biết cách **loại bỏ dependencies** MÀ KHÔNG suppress linter

**Bạn sẽ học:**

1. Cách fix infinite Effect dependency loops
2. Khi nào nên loại bỏ một dependency (và cách "chứng minh" nó không cần thiết)
3. Cách đọc giá trị trong Effect WITHOUT "reacting" to it
4. Tại sao object/function dependencies gây rắc rối — và cách tránh
5. Tại sao suppress linter là NGUY HIỂM — và làm gì thay thế

---

### Step 1: Dependencies PHẢI Match Code

> 🎯 "Dependencies không phải thứ bạn chọn — chúng MÔ TẢ code của bạn."

```tsx
const serverUrl = "https://localhost:1234";

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ roomId là reactive value → PHẢI khai báo
}
```

#### 🔍 Giải thích chi tiết

**"Reactive value" là gì?**

**Reactive value** = bất kỳ giá trị nào có thể THAY ĐỔI giữa các lần render. Bao gồm:

```tsx
function ChatRoom({ roomId }) {
  // ← roomId là PROP → reactive ✅
  const [message, setMessage] = useState(""); // ← message là STATE → reactive ✅
  const serverUrl = roomId + ".example.com"; // ← computed từ prop → reactive ✅

  // KHÔNG reactive (nằm NGOÀI component):
  // const serverUrl = 'https://localhost:1234'; ← CONSTANT → không reactive ❌
}
```

**Quy tắc vàng:**

```
MỌI reactive value mà Effect ĐỌC → PHẢI có trong dependency array.

Effect đọc roomId → [roomId] ✅
Effect đọc roomId + message → [roomId, message] ✅
Effect KHÔNG đọc reactive value nào → [] ✅
```

**Tại sao phải khai báo?**

```
KHI roomId THAY ĐỔI (user chọn room khác):
1. Component re-render với roomId MỚI
2. React thấy roomId trong dependency array
3. React SO SÁNH: roomId cũ !== roomId mới
4. React chạy CLEANUP (disconnect room cũ)
5. React chạy EFFECT MỚI (connect room mới)

NẾU KHÔNG khai báo roomId:
1. Component re-render với roomId MỚI
2. React thấy dependency = [] (rỗng)
3. React KHÔNG BIẾT roomId thay đổi → KHÔNG chạy lại Effect
4. User đổi room nhưng vẫn connect room CŨ → BUG!
```

**Ví dụ trực quan:**

```
DEPENDENCY ARRAY = "Danh sách những thứ Effect QUAN TÂM"

useEffect(() => {
  connect(roomId);      // ← Đọc roomId
  log(serverUrl);       // ← Đọc serverUrl (constant, ngoài component)
}, [roomId]);            // ← CHỈ CẦN roomId (serverUrl là constant, không thay đổi)

Giống như: "Hãy gọi lại tôi KHI NÀO roomId thay đổi"
→ serverUrl KHÔNG BAO GIỜ thay đổi → không cần "gọi lại"
```

---

### Step 2: "Chứng Minh" Một Dependency Không Cần Thiết

> 🎯 "Muốn loại bỏ dependency → phải CHỨNG MINH nó không phải reactive value."

**Nguyên tắc:** Bạn KHÔNG THỂ xóa dependency khỏi array mà vẫn giữ code đọc nó. Thay vào đó, bạn phải THAY ĐỔI CODE để giá trị đó không còn là reactive.

```tsx
// ❌ TRƯỚC: roomId là prop → reactive → PHẢI trong dependency
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Bắt buộc phải có roomId
}

// ✅ SAU: roomId là CONSTANT ngoài component → KHÔNG reactive
const roomId = "music"; // ← Di chuyển ra ngoài component

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ Không cần dependency nào — roomId là constant
}
```

#### 🔍 Giải thích chi tiết: "Chứng minh" nghĩa là gì?

**"Chứng minh"** = thay đổi code sao cho LINTER TỰ HIỂU giá trị đó không thay đổi:

```
CÁCH "CHỨNG MINH" MỘT GIÁ TRỊ KHÔNG REACTIVE:

1. Di chuyển ra NGOÀI component → constant, không bao giờ thay đổi
2. Di chuyển VÀO TRONG Effect → tạo mới mỗi lần Effect chạy, không phải dependency
3. Destructure object → lấy primitive values thay vì object reference

KHÔNG PHẢI "CHỨNG MINH":
❌ Suppress linter (eslint-disable) → "NÓI DỐI" React
❌ Xóa khỏi array mà vẫn đọc trong Effect → BUG
```

**Workflow đúng khi muốn thay đổi dependencies:**

```
BƯỚC 1: Thay đổi CODE của Effect hoặc cách khai báo reactive values
BƯỚC 2: Dependencies TỰ ĐỘNG thay đổi theo code mới
BƯỚC 3: Nếu chưa ưng → quay lại BƯỚC 1 (thay đổi code thêm)

⚠️ KHÔNG BAO GIỜ: Thay đổi dependency array TRƯỚC rồi mới sửa code
→ Dependency array MÔ TẢ code, KHÔNG PHẢI ngược lại
→ Giống như: danh sách nguyên liệu MÔ TẢ công thức, không phải bạn viết
   danh sách trước rồi nấu theo
```

---

### Step 3: Tại Sao KHÔNG BAO GIỜ Suppress Linter

> 🎯 "Suppress linter = NÓI DỐI React. Nói dối React = bugs khó debug nhất."

```tsx
// ❌ NGUY HIỂM: Suppress linter
function Timer() {
  const [count, setCount] = useState(0);
  const [increment, setIncrement] = useState(1);

  function onTick() {
    setCount(count + increment); // Đọc count VÀ increment
  }

  useEffect(() => {
    const id = setInterval(onTick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← NÓI DỐI: "Effect không phụ thuộc gì cả"
  // THỰC TẾ: Effect ĐỌC count và increment qua onTick!
}
```

#### 🔍 Tại sao code trên bị BUG?

```
RENDER LẦN 1: count = 0, increment = 1
→ onTick CLOSURE bắt: count = 0, increment = 1
→ setInterval(onTick, 1000) → mỗi giây gọi onTick

USER THAY ĐỔI increment = 5:
→ Component re-render → onTick MỚI: count = ?, increment = 5
→ NHƯNG setInterval VẪN GIỮ onTick CŨ (từ render lần 1)
→ onTick CŨ vẫn thấy: count = 0, increment = 1
→ Mãi mãi gọi setCount(0 + 1) = 1

KẾT QUẢ: Counter luôn hiện 1, bất kể user thay đổi increment!
```

**Closure Trap — giải thích bằng hình ảnh:**

```
RENDER 1:  onTick_v1 = () => setCount(0 + 1)  ← BỊ "ĐÓNG BĂNG"
           ↑ setInterval giữ reference này MÃIIIIII

RENDER 2:  onTick_v2 = () => setCount(1 + 1)  ← KHÔNG ĐƯỢC DÙNG
RENDER 3:  onTick_v3 = () => setCount(2 + 5)  ← KHÔNG ĐƯỢC DÙNG

→ setInterval vẫn gọi onTick_v1 mãi mãi
→ Vì dependency = [] → Effect KHÔNG BAO GIỜ chạy lại
→ setInterval KHÔNG BAO GIỜ được tạo lại với onTick mới
```

**✅ Cách fix đúng — dùng updater function:**

```tsx
function Timer() {
  const [count, setCount] = useState(0);
  const [increment, setIncrement] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      // ✅ Dùng updater function → KHÔNG CẦN đọc count
      setCount((c) => c + increment);
    }, 1000);
    return () => clearInterval(id);
  }, [increment]); // ✅ Chỉ cần increment — count không còn là dependency
}
```

```
TẠI SAO UPDATER FUNCTION GIẢI QUYẾT VẤN ĐỀ:

setCount(count + increment)     ← ĐỌC count từ closure → stale!
setCount(c => c + increment)    ← React TRUYỀN count hiện tại vào c
                                   → Luôn có giá trị MỚI NHẤT
                                   → count không cần trong dependency
```

---

### Step 4: Code Nên Ở Event Handler Hay Effect?

> 🎯 "Effect = đồng bộ hóa (sync). Event Handler = phản ứng interaction cụ thể."

**Quy tắc phân biệt:**

```
HỎI: "Code này chạy VÌ user làm gì đó cụ thể?"
├── CÓ → Event Handler (onClick, onSubmit, onChange...)
└── KHÔNG → Effect (sync data, subscribe, connect...)

HỎI: "Code này cần chạy MỖI KHI component hiển thị/data thay đổi?"
├── CÓ → Effect
└── KHÔNG → Event Handler
```

**❌ Sai: Đặt logic submit trong Effect**

```tsx
function Form() {
  const [submitted, setSubmitted] = useState(false);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    if (submitted) {
      // ❌ Logic submit TRONG Effect
      post("/api/register");
      showNotification("Successfully registered!", theme);
    }
  }, [submitted, theme]); // theme thay đổi → notification hiện LẠI!

  function handleSubmit() {
    setSubmitted(true);
  }
}
```

**BUG:** User submit form → notification hiện. User đổi theme (Dark → Light) → `theme` thay đổi → Effect chạy lại → notification hiện LẠI lần nữa!

```
TIMELINE BUG:
1. User click Submit → submitted = true → Effect chạy → ✅ Notification
2. User đổi theme → theme thay đổi → submitted VẪN true
   → Effect chạy LẠI → ❌ Notification hiện LẦN NỮA!
3. User đổi theme lần nữa → ❌ Notification hiện LẦN NỮA!
```

**✅ Đúng: Logic submit trong Event Handler**

```tsx
function Form() {
  const theme = useContext(ThemeContext);

  function handleSubmit() {
    // ✅ Logic specific to user action → Event Handler
    post("/api/register");
    showNotification("Successfully registered!", theme);
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

```
TẠI SAO FIX ĐƯỢC:
- handleSubmit CHỈ chạy khi user CLICK submit
- theme thay đổi → KHÔNG ảnh hưởng (không có Effect)
- Không cần state submitted → code đơn giản hơn
```

---

### Step 5: Tách Effect Làm Nhiều Việc Không Liên Quan

> 🎯 "Mỗi Effect nên đồng bộ MỘT thứ. Hai thứ không liên quan = hai Effect."

**❌ Sai: Một Effect fetch cả cities VÀ areas**

```tsx
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    let ignore = false;
    // Fetch cities theo country
    fetch(`/api/cities?country=${country}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) setCities(json);
      });

    // ❌ Fetch areas theo city — TRONG CÙNG EFFECT
    if (city) {
      fetch(`/api/areas?city=${city}`)
        .then((res) => res.json())
        .then((json) => {
          if (!ignore) setAreas(json);
        });
    }
    return () => {
      ignore = true;
    };
  }, [country, city]); // ← city thay đổi → fetch CITIES lại (DƯ THỪA!)
}
```

**BUG:** User chọn city khác → `city` thay đổi → Effect chạy lại → fetch cities LẠI (dù country không đổi) → lãng phí network request!

```
TIMELINE BUG:
1. country = "VN" → fetch cities ✅ → cities = [HCM, HN, DN]
2. city = "HCM" → Effect chạy lại vì [country, city] thay đổi
   → fetch cities LẠI cho "VN" ❌ (DƯ THỪA — country không đổi!)
   → fetch areas cho "HCM" ✅
3. city = "DN" → fetch cities LẠI cho "VN" ❌ (DƯ THỪA LẦN NỮA!)
   → fetch areas cho "DN" ✅
```

**✅ Đúng: Tách thành 2 Effect riêng biệt**

```tsx
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);

  // Effect 1: Fetch cities KHI country thay đổi
  useEffect(() => {
    let ignore = false;
    fetch(`/api/cities?country=${country}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) setCities(json);
      });
    return () => {
      ignore = true;
    };
  }, [country]); // ✅ CHỈ phụ thuộc country

  // Effect 2: Fetch areas KHI city thay đổi
  useEffect(() => {
    if (city) {
      let ignore = false;
      fetch(`/api/areas?city=${city}`)
        .then((res) => res.json())
        .then((json) => {
          if (!ignore) setAreas(json);
        });
      return () => {
        ignore = true;
      };
    }
  }, [city]); // ✅ CHỈ phụ thuộc city
}
```

```
SAU KHI FIX:
1. country = "VN" → Effect 1 chạy → fetch cities ✅
2. city = "HCM" → CHỈ Effect 2 chạy → fetch areas ✅
   → Effect 1 KHÔNG chạy lại (country không đổi) ✅
3. city = "DN" → CHỈ Effect 2 chạy → fetch areas ✅
   → Effect 1 VẪN KHÔNG chạy ✅

NGUYÊN TẮC: Mỗi Effect = MỘT mục đích đồng bộ hóa
├── Effect 1: cities ↔ country
└── Effect 2: areas ↔ city
Xóa Effect 1 KHÔNG ảnh hưởng Effect 2 (và ngược lại)
```

---

### Step 6: Updater Function — Loại Bỏ State Dependency

> 🎯 "Nếu bạn đọc state CHỈ ĐỂ tính state tiếp theo → dùng updater function."

**❌ Sai: Đọc messages trong Effect → dependency → infinite reconnect**

```tsx
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on("message", (receivedMessage) => {
      setMessages([...messages, receivedMessage]);
      //          ^^^^^^^^^^^ ĐỌC messages → phải khai báo dependency
    });
    return () => connection.disconnect();
  }, [roomId, messages]); // ← messages thay đổi → reconnect chat!
}
```

**BUG CHAIN:**

```
1. Nhận message → setMessages([...messages, newMsg])
2. messages THAY ĐỔI → dependency thay đổi
3. Effect chạy lại → disconnect + reconnect
4. Nhận message tiếp → messages thay đổi lại
5. Effect chạy lại → disconnect + reconnect LẠI
→ VÒNG LẶP: mỗi message nhận được → chat reconnect!
```

**✅ Đúng: Dùng updater function**

```tsx
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on("message", (receivedMessage) => {
      setMessages((msgs) => [...msgs, receivedMessage]);
      //          ^^^^ React TỰ truyền messages hiện tại vào msgs
      //          → KHÔNG CẦN đọc messages từ closure
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ CHỈ CÒN roomId — messages không còn dependency
}
```

#### 🔍 Updater function hoạt động thế nào?

```
setMessages([...messages, newMsg])    ← ĐỌC messages từ closure
→ messages là reactive value → PHẢI trong dependency array
→ messages thay đổi → Effect chạy lại → reconnect

setMessages(msgs => [...msgs, newMsg]) ← React TRUYỀN giá trị hiện tại
→ KHÔNG ĐỌC messages từ closure
→ messages KHÔNG PHẢI dependency
→ messages thay đổi → Effect KHÔNG chạy lại ✅

TRỰC QUAN:
┌───────────────────────────┬──────────────────────────────┐
│ Cách cũ (đọc trực tiếp)  │ Cách mới (updater)           │
├───────────────────────────┼──────────────────────────────┤
│ "Tôi CẦN BIẾT messages   │ "React ơi, cho tôi messages  │
│  hiện tại để thêm vào"   │  hiện tại, tôi sẽ thêm vào" │
│ → Effect PHẢI BIẾT state  │ → Effect KHÔNG CẦN BIẾT     │
│ → Khai báo dependency    │ → Không cần dependency       │
└───────────────────────────┴──────────────────────────────┘
```

---

### Step 7: useEffectEvent — Đọc Giá Trị Mà Không "React" To It

> 🎯 "Khi bạn muốn ĐỌC một giá trị trong Effect nhưng KHÔNG muốn Effect chạy lại khi giá trị đó thay đổi."

**❌ Sai: isMuted là dependency → chat reconnect khi toggle mute**

```tsx
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on("message", (receivedMessage) => {
      setMessages((msgs) => [...msgs, receivedMessage]);
      if (!isMuted) {
        playSound(); // Đọc isMuted → phải khai báo dependency
      }
    });
    return () => connection.disconnect();
  }, [roomId, isMuted]); // ← isMuted thay đổi → reconnect!
}
```

**Vấn đề:** User bật/tắt Mute → `isMuted` thay đổi → Effect chạy lại → chat DISCONNECT rồi RECONNECT. User chỉ muốn tắt tiếng, không muốn mất kết nối!

**✅ Đúng: Dùng useEffectEvent**

```tsx
import { useState, useEffect, useEffectEvent } from "react";

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Effect Event: đọc isMuted nhưng KHÔNG phải dependency
  const onMessage = useEffectEvent((receivedMessage) => {
    setMessages((msgs) => [...msgs, receivedMessage]);
    if (!isMuted) {
      // Luôn đọc giá trị MỚI NHẤT của isMuted
      playSound();
    }
  });

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on("message", (receivedMessage) => {
      onMessage(receivedMessage); // Gọi Effect Event
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ CHỈ CÒN roomId — isMuted không dependency
}
```

#### 🔍 useEffectEvent là gì?

```
useEffectEvent = "tạo một hàm luôn đọc giá trị MỚI NHẤT
                  nhưng KHÔNG được coi là dependency"

PHÂN BIỆT:
┌─────────────────────┬──────────────────────┬─────────────────────┐
│                     │ Effect Code          │ Effect Event        │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ React to changes?   │ CÓ — chạy lại khi   │ KHÔNG — chỉ đọc    │
│                     │ dependency thay đổi  │ giá trị mới nhất   │
│ Là dependency?      │ Phải khai báo        │ KHÔNG PHẢI          │
│ Khi nào dùng        │ Logic PHẢI sync      │ Logic KHÔNG PHẢI    │
│                     │ với reactive values  │ reactive nhưng cần  │
│                     │                      │ giá trị hiện tại   │
│ Ví dụ               │ connect(roomId)      │ if (!isMuted) play()│
└─────────────────────┴──────────────────────┴─────────────────────┘

TRỰC QUAN:
Effect = "KHI roomId thay đổi, hãy reconnect"        ← REACTIVE
Effect Event = "Khi nhận message, check isMuted HIỆN TẠI"  ← NON-REACTIVE
```

---

### Step 8: Object/Function Dependencies — Bẫy Phổ Biến Nhất

> 🎯 "Object/function tạo mới MỖI RENDER → luôn 'khác' → Effect chạy mãi."

**❌ Sai: options object tạo mới mỗi render**

```tsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState("");

  const options = {
    serverUrl: serverUrl,
    roomId: roomId,
  }; // ← Object MỚI mỗi render!

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // ← options LUÔN KHÁC → Effect LUÔN chạy lại!
}
```

#### 🔍 Tại sao object LUÔN "khác"?

```javascript
// JavaScript so sánh object bằng REFERENCE, không phải CONTENT:
const obj1 = { serverUrl: "localhost", roomId: "music" };
const obj2 = { serverUrl: "localhost", roomId: "music" };

console.log(obj1 === obj2); // false ← KHÁC nhau!
console.log(Object.is(obj1, obj2)); // false ← KHÁC nhau!
// Dù CONTENT y hệt, nhưng là 2 object KHÁC NHAU trong memory

// So sánh với primitive:
const str1 = "music";
const str2 = "music";
console.log(str1 === str2); // true ← GIỐNG nhau!
```

```
TRỰC QUAN — TẠI SAO OBJECT GÂY RECONNECT:

Render 1: options_v1 = { roomId: 'music' }   ← address: 0x001
Render 2: options_v2 = { roomId: 'music' }   ← address: 0x002
           user chỉ gõ message, roomId KHÔNG ĐỔI!

React so sánh: Object.is(0x001, 0x002) → false → "KHÁC!"
→ Effect chạy lại → disconnect + reconnect
→ User gõ 1 chữ → chat bị đứt kết nối → gõ thêm → đứt tiếp

Render 3: options_v3 = { roomId: 'music' }   ← address: 0x003
→ KHÁC NỮA → reconnect NỮA → vô hạn!
```

**3 cách fix:**

**Fix 1: Di chuyển ra NGOÀI component (nếu KHÔNG phụ thuộc props/state)**

```tsx
// ✅ options là CONSTANT — không bao giờ thay đổi
const options = {
  serverUrl: "https://localhost:1234",
  roomId: "music",
};

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ Không dependency — options là constant
}
```

**Fix 2: Di chuyển VÀO TRONG Effect (nếu phụ thuộc reactive value)**

```tsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // ✅ Tạo options BÊN TRONG Effect
    const options = {
      serverUrl: serverUrl,
      roomId: roomId, // roomId từ closure — KHÔNG phải object dependency
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ Dependency là roomId (primitive), KHÔNG PHẢI options (object)
}
```

```
TẠI SAO FIX 2 HOẠT ĐỘNG:
- options KHÔNG CÒN là dependency
- Dependency chỉ là roomId (string primitive)
- String so sánh bằng CONTENT: 'music' === 'music' → true
- User gõ message → roomId không đổi → 'music' === 'music' → Effect KHÔNG chạy lại ✅
```

**Fix 3: Destructure object → lấy primitive values**

```tsx
function ChatRoom({ options }) {
  const [message, setMessage] = useState("");

  // Destructure NGOÀI Effect → lấy primitive values
  const { roomId, serverUrl } = options;

  useEffect(() => {
    const connection = createConnection({ roomId, serverUrl });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // ✅ Primitives — so sánh bằng content
}
```

```
TẠI SAO DESTRUCTURE FIX ĐƯỢC:
- options (object) → LUÔN khác mỗi render (reference comparison)
- roomId (string) → chỉ khác khi GIÁ TRỊ thực sự thay đổi
- serverUrl (string) → chỉ khác khi GIÁ TRỊ thực sự thay đổi

Parent re-render → tạo options MỚI → nhưng roomId VÀ serverUrl
có thể vẫn GIỐNG → Effect KHÔNG chạy lại ✅
```

---

### Step 9: Function Dependencies — Cùng Vấn Đề, Cùng Giải Pháp

> 🎯 "Function cũng tạo mới mỗi render → cùng bẫy như Object."

**❌ Sai: Function prop tạo mới mỗi render**

```tsx
// Parent tạo function MỚI mỗi render:
<ChatRoom
  roomId={roomId}
  onReceiveMessage={(receivedMessage) => {
    // Function MỚI mỗi render!
  }}
/>;

// Child nhận function → phải khai báo dependency:
function ChatRoom({ roomId, onReceiveMessage }) {
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on("message", (receivedMessage) => {
      onReceiveMessage(receivedMessage);
    });
    return () => connection.disconnect();
  }, [roomId, onReceiveMessage]); // ← onReceiveMessage LUÔN khác → reconnect!
}
```

**✅ Fix: Wrap trong useEffectEvent**

```tsx
function ChatRoom({ roomId, onReceiveMessage }) {
  // Wrap function prop trong Effect Event
  const onMessage = useEffectEvent((receivedMessage) => {
    onReceiveMessage(receivedMessage);
  });

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on("message", (receivedMessage) => {
      onMessage(receivedMessage);
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ CHỈ roomId — onReceiveMessage không dependency
}
```

**✅ Fix thay thế: Gọi function NGOÀI Effect, lấy primitive**

```tsx
// Nếu function trả về config object:
<ChatRoom
  roomId={roomId}
  getOptions={() => ({
    serverUrl: serverUrl,
    roomId: roomId,
  })}
/>;

function ChatRoom({ getOptions }) {
  // Gọi function NGOÀI Effect → lấy primitive values
  const { roomId, serverUrl } = getOptions();

  useEffect(() => {
    const connection = createConnection({ roomId, serverUrl });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // ✅ Primitives — CHỈ chạy lại khi giá trị thật sự đổi
}
// ⚠️ CHỈ hoạt động với PURE functions (không side effects)
```

---

### Step 10: Separating Reactive vs Non-Reactive Code

> 🎯 "Tách code reactive (CẦN sync) ra khỏi code non-reactive (chỉ cần giá trị hiện tại)."

```tsx
function Chat({ roomId, notificationCount }) {
  // Non-reactive: đọc notificationCount nhưng KHÔNG muốn
  // Effect chạy lại khi nó thay đổi
  const onVisit = useEffectEvent((visitedRoomId) => {
    logVisit(visitedRoomId, notificationCount);
    // notificationCount luôn đọc giá trị MỚI NHẤT
    // nhưng thay đổi nó KHÔNG trigger Effect
  });

  useEffect(() => {
    onVisit(roomId); // Reactive: chạy lại khi roomId thay đổi
  }, [roomId]); // ✅ CHỈ roomId
}
```

#### 🔍 Khi nào tách Reactive vs Non-Reactive?

```
HỎI VỀ TỪNG GIÁ TRỊ TRONG EFFECT:
"Nếu giá trị này thay đổi, Effect CÓ CẦN chạy lại không?"

├── CÓ → Reactive → Giữ trong Effect code + dependency array
│   Ví dụ: roomId thay đổi → CẦN reconnect → reactive ✅
│
└── KHÔNG → Non-Reactive → Đưa vào useEffectEvent
    Ví dụ: isMuted thay đổi → KHÔNG CẦN reconnect → non-reactive
    Ví dụ: notificationCount thay đổi → KHÔNG CẦN re-log → non-reactive
    Ví dụ: onReceiveMessage thay đổi → KHÔNG CẦN reconnect → non-reactive
```

---

### Step 11: Tổng Kết — Decision Tree Loại Bỏ Dependencies

```
MUỐN LOẠI BỎ DEPENDENCY X TỪ EFFECT:
│
├── X là STATE mà bạn đọc chỉ để tính state tiếp theo?
│   └── ✅ Dùng UPDATER FUNCTION: setX(prev => ...)
│
├── X là OBJECT/FUNCTION tạo trong component body?
│   ├── X KHÔNG phụ thuộc props/state?
│   │   └── ✅ Di chuyển ra NGOÀI component
│   ├── X phụ thuộc props/state?
│   │   ├── ✅ Di chuyển VÀO TRONG Effect
│   │   └── ✅ Destructure → lấy primitive values
│   └── X là function prop từ parent?
│       └── ✅ Wrap trong useEffectEvent
│
├── X là giá trị bạn cần ĐỌC nhưng KHÔNG muốn react to?
│   └── ✅ Dùng useEffectEvent
│
├── Code đọc X nên ở EVENT HANDLER thay vì Effect?
│   └── ✅ Di chuyển code ra Event Handler
│
├── Effect đang làm NHIỀU VIỆC không liên quan?
│   └── ✅ TÁCH thành nhiều Effects riêng biệt
│
└── KHÔNG gì ở trên áp dụng?
    └── 🤔 Xem lại: có thể code LOGIC sai, không phải dependency sai
```

---

### Step 12: useRef — "Invisible Variable" Không Phải Dependency

> 🎯 "useRef tạo container MÀ React KHÔNG THEO DÕI — thay đổi ref KHÔNG trigger re-render, KHÔNG phải dependency."

```tsx
function ChatRoom({ roomId }) {
  const latestMessage = useRef(null); // ← React KHÔNG theo dõi ref

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    connection.on("message", (msg) => {
      latestMessage.current = msg; // Cập nhật ref — KHÔNG re-render
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ latestMessage KHÔNG cần trong dependency
}
```

#### 🔍 Tại sao useRef KHÔNG phải dependency?

```
REACTIVE VALUES (React THEO DÕI):
- props      → thay đổi = re-render → CÓ THỂ ảnh hưởng Effect
- state      → thay đổi = re-render → CÓ THỂ ảnh hưởng Effect
- biến local → tạo mới mỗi render → CÓ THỂ ảnh hưởng Effect

useRef (React KHÔNG THEO DÕI):
- ref.current thay đổi → KHÔNG re-render → KHÔNG tạo closure mới
- ref object CÓ CÙNG reference qua TẤT CẢ renders
- Giống "hộp" chứa giá trị — hộp không đổi, chỉ NỘI DUNG đổi
```

```
TRỰC QUAN:

useState:   [value] ←→ [setValue] ←→ React biết → re-render → Effect check
useRef:     { current: value } ← THAY ĐỔI → React KHÔNG BIẾT → im lặng

GIỐNG NHƯ:
- useState = gọi điện nói "tôi đổi địa chỉ" → mọi người CẬP NHẬT
- useRef = viết ghi chú riêng → KHÔNG AI BIẾT trừ khi tự đọc
```

**Khi nào dùng useRef thay vì state để tránh dependency?**

```tsx
// ❌ State → dependency → Effect chạy lại:
function Logger({ roomId }) {
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((c) => c + 1); // ← state update mỗi render
  }); // Chạy EVERY render → set state → re-render → LOOP!

  useEffect(() => {
    console.log(`Room ${roomId}, rendered ${renderCount} times`);
  }, [roomId, renderCount]); // renderCount thay đổi liên tục!
}

// ✅ Ref → KHÔNG dependency → Effect ổn định:
function Logger({ roomId }) {
  const renderCount = useRef(0);
  renderCount.current += 1; // Cập nhật MỖI render, KHÔNG trigger re-render

  useEffect(() => {
    console.log(`Room ${roomId}, rendered ${renderCount.current} times`);
  }, [roomId]); // ✅ CHỈ roomId — renderCount.current không cần dependency
}
```

**⚠️ Chú ý quan trọng:**

```
useRef KHÔNG phải dependency NHƯNG:
- Nếu bạn CẦN UI re-render khi giá trị thay đổi → dùng useState
- useRef chỉ phù hợp khi giá trị "behind the scenes" — không hiển thị trên UI
- Ví dụ tốt: timer IDs, DOM refs, latest callback, mutable flags
- Ví dụ xấu: user input, displayed counter, visible data
```

---

### Step 13: Effect Cleanup Lifecycle — Hiểu Rõ Thứ Tự Chạy

> 🎯 "Cleanup chạy TRƯỚC Effect mới — hiểu thứ tự này = debug Effect dễ hơn rất nhiều."

```tsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    console.log(`1. SETUP: Connect to ${roomId}`);
    const connection = createConnection(roomId);
    connection.connect();

    return () => {
      console.log(`2. CLEANUP: Disconnect from ${roomId}`);
      connection.disconnect();
    };
  }, [roomId]);
}
```

#### 🔍 Lifecycle chi tiết

```
MOUNT (lần đầu render, roomId = "general"):
→ Chạy SETUP: "Connect to general"

DEPENDENCY THAY ĐỔI (roomId: "general" → "travel"):
→ Chạy CLEANUP CŨ: "Disconnect from general"  ← TRƯỚC
→ Chạy SETUP MỚI: "Connect to travel"          ← SAU

DEPENDENCY THAY ĐỔI LẦN NỮA (roomId: "travel" → "music"):
→ Chạy CLEANUP CŨ: "Disconnect from travel"
→ Chạy SETUP MỚI: "Connect to music"

UNMOUNT (component bị gỡ khỏi DOM):
→ Chạy CLEANUP CUỐI: "Disconnect from music"
```

```
TIMELINE TRỰC QUAN:
                    MOUNT      roomId="travel"   roomId="music"    UNMOUNT
                      │             │                 │               │
Setup "general"  ─────┤             │                 │               │
                      │             │                 │               │
Cleanup "general" ────────────────┤                 │               │
Setup "travel"   ─────────────────┤                 │               │
                                   │                 │               │
Cleanup "travel" ────────────────────────────────┤               │
Setup "music"    ────────────────────────────────┤               │
                                                  │               │
Cleanup "music"  ─────────────────────────────────────────────┤

→ LUÔN LUÔN: Cleanup CŨ trước → Setup MỚI sau
→ Đảm bảo: KHÔNG BAO GIỜ có 2 connections cùng lúc
```

**Tại sao cleanup quan trọng cho dependency management?**

```tsx
// ❌ KHÔNG có cleanup → MEMORY LEAK + STALE CALLBACKS:
useEffect(() => {
  const ws = new WebSocket(`ws://server/${roomId}`);
  ws.onmessage = handleMessage;
  // Quên cleanup! Khi roomId đổi:
  // → WebSocket CŨ vẫn sống → nhận messages từ room CŨ
  // → WebSocket MỚI tạo → nhận messages từ room MỚI
  // → 2 WebSockets! Rồi 3, 4... mỗi lần đổi room
}, [roomId]);

// ✅ CÓ cleanup → sạch sẽ:
useEffect(() => {
  const ws = new WebSocket(`ws://server/${roomId}`);
  ws.onmessage = handleMessage;
  return () => ws.close(); // ← Đóng WebSocket CŨ trước khi tạo MỚI
}, [roomId]);
```

**Pattern: ignore flag cho async operations**

```tsx
useEffect(() => {
  let ignore = false; // ← Flag để cancel response CŨ

  async function fetchData() {
    const response = await fetch(`/api/room/${roomId}`);
    const data = await response.json();
    if (!ignore) {
      // ← CHỈ set state nếu Effect CHƯA bị cleanup
      setRoomData(data);
    }
  }
  fetchData();

  return () => {
    ignore = true; // ← Cleanup: đánh dấu "response này đã outdated"
  };
}, [roomId]);
```

```
TẠI SAO CẦN IGNORE FLAG:

1. roomId = "general" → fetch bắt đầu (takes 3 seconds)
2. roomId = "travel" (user đổi nhanh) → CLEANUP: ignore = true
   → fetch MỚI bắt đầu cho "travel"
3. Response CŨ ("general") trở về sau 3s
   → if (!ignore) → ignore = TRUE → SKIP! Không set stale data ✅
4. Response MỚI ("travel") trở về
   → if (!ignore) → ignore = false → set data ✅
```

---

### Step 14: React.StrictMode — Tại Sao Effect Chạy 2 Lần?

> 🎯 "StrictMode mount → cleanup → re-mount Effect trong DEV để lộ bugs sớm."

```
PRODUCTION MODE:
Component mount → Effect SETUP 1 lần

DEVELOPMENT MODE (StrictMode):
Component mount → Effect SETUP → CLEANUP → Effect SETUP lần 2
                  ↑ React cố tình chạy 2 lần để kiểm tra!
```

#### 🔍 Tại sao React làm vậy?

```
React KIỂM TRA: "Effect của bạn có cleanup đúng không?"

NẾU CLEANUP ĐÚNG:
Setup 1 → tạo connection → Cleanup → disconnect → Setup 2 → tạo connection
→ Kết quả: 1 connection (giống production) ✅

NẾU CLEANUP SAI (hoặc QUÊN cleanup):
Setup 1 → tạo connection → Cleanup → ???  → Setup 2 → tạo connection THÊM
→ Kết quả: 2 connections! (LEAK!) ❌
→ Bug LỘ RA ngay trong dev → fix sớm trước khi deploy
```

**Ảnh hưởng đến dependencies:**

```tsx
// ❌ Effect chạy 2 lần → fetch 2 lần → console thấy 2 requests:
useEffect(() => {
  fetch(`/api/data/${id}`).then((res) => setData(res));
}, [id]);
// Trong dev: fetch LẦN 1 → cleanup (nothing) → fetch LẦN 2
// → 2 requests! Nhưng CHỈ trong dev, production chỉ 1

// ✅ Fix: thêm cleanup với ignore flag:
useEffect(() => {
  let ignore = false;
  fetch(`/api/data/${id}`).then((res) => {
    if (!ignore) setData(res);
  });
  return () => {
    ignore = true;
  }; // ← Cleanup request cũ
}, [id]);
// Dev: fetch 1 → cleanup (ignore=true) → fetch 2 → response 1 bị SKIP
// → Chỉ response 2 được dùng ✅
```

```
QUAN TRỌNG:
- StrictMode KHÔNG thay đổi behavior dependencies
- Nó CHỈ chạy Effect 2 lần để LỘ bugs
- Nếu code CÓ cleanup đúng → chạy 2 lần = giống chạy 1 lần
- Nếu chạy 2 lần GÂY VẤN ĐỀ → Effect THIẾU cleanup → FIX cleanup!
- KHÔNG suppress StrictMode — nó GIÚP bạn
```

---

### Step 15: Custom Hooks — Gom Logic Effect Để Giảm Dependency Phức Tạp

> 🎯 "Custom Hook = extract Effect logic → giấu dependency management → component sạch hơn."

```tsx
// ❌ Component phức tạp VỚI dependency management:
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const onMessage = useEffectEvent((msg) => {
    setMessages((msgs) => [...msgs, msg]);
    if (!isMuted) playSound();
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    conn.on("message", onMessage);
    return () => conn.disconnect();
  }, [roomId]);

  // ... UI logic ... cả 2 concerns trộn lẫn
}

// ✅ Custom Hook GOM dependency logic:
function useChatConnection(roomId: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const onMessage = useEffectEvent((msg: string) => {
    setMessages((msgs) => [...msgs, msg]);
    if (!isMuted) playSound();
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    conn.on("message", onMessage);
    return () => conn.disconnect();
  }, [roomId]); // Dependencies QUẢN LÝ bên trong hook

  return { messages, isMuted, setIsMuted };
}

// Component giờ CỰC ĐƠN GIẢN:
function ChatRoom({ roomId }) {
  const { messages, isMuted, setIsMuted } = useChatConnection(roomId);

  return (
    <div>
      {messages.map((m) => (
        <p key={m}>{m}</p>
      ))}
      <button onClick={() => setIsMuted(!isMuted)}>
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
```

#### 🔍 Tại sao Custom Hooks giúp dependency management?

```
TRƯỚC (tất cả trong component):
Component
├── useState (messages)
├── useState (isMuted)
├── useEffectEvent (onMessage)    ← Dependency logic
├── useEffect ([roomId])          ← Dependency logic
├── JSX render                    ← UI logic
└── Event handlers                ← UI logic
→ Dependency logic + UI logic TRỘN LẪN → khó maintain

SAU (tách Custom Hook):
useChatConnection (hook)
├── useState (messages)
├── useState (isMuted)
├── useEffectEvent (onMessage)
└── useEffect ([roomId])
→ TẤT CẢ dependency logic GỌN GÀNG trong hook

ChatRoom (component)
├── useChatConnection(roomId)     ← 1 dòng
├── JSX render
└── Event handlers
→ CHỈ CÒN UI logic → dễ đọc, dễ test
```

**Ví dụ: useWindowSize — hide dependency complexity**

```tsx
// Custom Hook quản lý resize listener + cleanup:
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // ✅ Không dependency — window event, không reactive value

  return size;
}

// Component dùng — KHÔNG CẦN BIẾT dependency bên trong:
function ResponsiveLayout() {
  const { width } = useWindowSize();
  return width > 768 ? <DesktopView /> : <MobileView />;
}
```

---

### Step 16: useCallback vs useEffectEvent — Dùng Cái Nào?

> 🎯 "useCallback ổn định reference NHƯNG VẪN LÀ dependency. useEffectEvent KHÔNG PHẢI dependency."

```
┌──────────────────────┬──────────────────────────────┬───────────────────────────────┐
│                      │ useCallback                  │ useEffectEvent                │
├──────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ Reference ổn định?   │ CÓ (nếu deps không đổi)     │ LUÔN ổn định                  │
│ Là dependency?       │ CÓ — phải khai báo           │ KHÔNG — bỏ qua được           │
│ Đọc giá trị mới nhất │ CHỈ khi deps thay đổi        │ LUÔN LUÔN                     │
│ Dùng trong Effect?   │ CÓ — nhưng là dependency     │ CÓ — nhưng KHÔNG dependency   │
│ Dùng ngoài Effect?   │ CÓ — truyền cho child        │ KHÔNG — chỉ dùng trong Effect │
│ Trạng thái           │ Stable trong React            │ Experimental (React canary)   │
└──────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

```tsx
// useCallback: ổn định reference NHƯNG VẪN LÀ DEPENDENCY
const handleMessage = useCallback(
  (msg) => {
    setMessages((msgs) => [...msgs, msg]);
    if (!isMuted) playSound();
  },
  [isMuted],
); // ← isMuted thay đổi → handleMessage MỚI

useEffect(() => {
  conn.on("message", handleMessage);
  return () => conn.off("message", handleMessage);
}, [roomId, handleMessage]); // ← handleMessage VẪN LÀ dependency!
// isMuted đổi → handleMessage đổi → Effect chạy lại → reconnect!

// useEffectEvent: KHÔNG BAO GIỜ là dependency
const onMessage = useEffectEvent((msg) => {
  setMessages((msgs) => [...msgs, msg]);
  if (!isMuted) playSound(); // ← Luôn đọc isMuted MỚI NHẤT
});

useEffect(() => {
  conn.on("message", (msg) => onMessage(msg));
  return () => conn.disconnect();
}, [roomId]); // ✅ onMessage KHÔNG phải dependency — isMuted đổi KHÔNG reconnect
```

#### 🔍 Khi nào dùng cái nào?

```
DÙNG useCallback KHI:
- Cần truyền function ổn định cho CHILD component (tránh re-render)
- Function KHÔNG dùng trong Effect dependency
- Cần function ổn định cho useMemo, React.memo

DÙNG useEffectEvent KHI:
- Function dùng TRONG Effect
- KHÔNG muốn function là dependency của Effect
- Cần đọc reactive values MỚI NHẤT mà không trigger Effect

DÙNG CẢ HAI KHI:
- useCallback cho child props + useEffectEvent cho Effect logic
  → Hai mục đích khác nhau, hai hooks khác nhau
```

---

### Step 17: Dependency Array So Sánh Bằng Gì? — Object.is Deep Dive

> 🎯 "React dùng Object.is() để so sánh TỪNG phần tử trong dependency array."

```tsx
useEffect(() => {
  // ... Effect code
}, [dep1, dep2, dep3]);
// React so sánh:
// Object.is(dep1_prev, dep1_curr) &&
// Object.is(dep2_prev, dep2_curr) &&
// Object.is(dep3_prev, dep3_curr)
// NẾU TẤT CẢ true → SKIP Effect (không chạy lại)
// NẾU BẤT KỲ false → CHẠY cleanup + re-run Effect
```

#### 🔍 Object.is() hoạt động thế nào?

```javascript
// PRIMITIVES — so sánh bằng VALUE:
Object.is("hello", "hello"); // true ✅ → Effect KHÔNG chạy lại
Object.is(42, 42); // true ✅
Object.is(true, true); // true ✅
Object.is(null, null); // true ✅
Object.is(undefined, undefined); // true ✅

// OBJECTS/ARRAYS/FUNCTIONS — so sánh bằng REFERENCE:
Object.is({ a: 1 }, { a: 1 }); // false ❌ → Effect CHẠY LẠI! (dù content giống)
Object.is([1, 2], [1, 2]); // false ❌ → Effect CHẠY LẠI!
Object.is(
  () => {},
  () => {},
); // false ❌ → Effect CHẠY LẠI!

// CÙNG reference:
const obj = { a: 1 };
Object.is(obj, obj); // true  ✅ → Effect KHÔNG chạy lại

// EDGE CASES:
Object.is(NaN, NaN); // true  ✅ (khác với NaN === NaN // false!)
Object.is(0, -0); // false ❌ (khác với 0 === -0 // true!)
Object.is(0, 0); // true  ✅
```

```
TẠI SAO QUAN TRỌNG:

Biết Object.is() = HIỂU TẠI SAO:
1. Primitive dependency ổn định → Effect ít chạy lại
2. Object/function dependency không ổn định → Effect chạy lại liên tục
3. useState trả về CÙNG reference nếu setState CÙNG GIÁ TRỊ
4. useMemo/useCallback giữ CÙNG reference nếu deps chưa đổi
5. NaN === NaN là false NHƯNG Object.is(NaN, NaN) là true
   → React KHÔNG bị bug khi dependency là NaN
```

**Bảng full comparison:**

```
┌─────────────────────┬───────────────┬───────────────┬──────────────────────┐
│ Thể loại            │ ===           │ Object.is()   │ Effect chạy lại?     │
├─────────────────────┼───────────────┼───────────────┼──────────────────────┤
│ 'abc' vs 'abc'      │ true          │ true          │ KHÔNG ✅             │
│ 42 vs 42            │ true          │ true          │ KHÔNG ✅             │
│ true vs true        │ true          │ true          │ KHÔNG ✅             │
│ null vs null        │ true          │ true          │ KHÔNG ✅             │
│ NaN vs NaN          │ false ⚠️      │ true ✅       │ KHÔNG (React đúng!)  │
│ 0 vs -0             │ true ⚠️       │ false ❌      │ CÓ (React phân biệt) │
│ {a:1} vs {a:1}      │ false         │ false         │ CÓ ❌ (khác ref!)    │
│ obj vs obj (same)   │ true          │ true          │ KHÔNG ✅             │
│ [] vs []            │ false         │ false         │ CÓ ❌                │
│ fn vs fn (new)      │ false         │ false         │ CÓ ❌                │
└─────────────────────┴───────────────┴───────────────┴──────────────────────┘
```

---

### Step 18: Conditional Effects — Chạy Effect Có Điều Kiện

> 🎯 "KHÔNG BAO GIỜ đặt useEffect trong if. Dùng if BÊN TRONG useEffect."

```tsx
// ❌ SAI: Conditional Hook — VI PHẠM Rules of Hooks
function Chat({ isOnline, roomId }) {
  if (isOnline) {
    useEffect(() => {
      // ❌ Hook trong if → Rules of Hooks VIOLATION
      connect(roomId);
      return () => disconnect(roomId);
    }, [roomId]);
  }
}

// ✅ ĐÚNG: If bên trong Effect
function Chat({ isOnline, roomId }) {
  useEffect(() => {
    if (!isOnline) return; // ← Early return — Effect SKIP logic

    const conn = createConnection(roomId);
    conn.connect();
    return () => conn.disconnect();
  }, [isOnline, roomId]); // ✅ Cả hai là dependencies
}
```

#### 🔍 Giải thích chi tiết

```
TẠI SAO hooks KHÔNG ĐƯỢC đặt trong if/for/return sớm?

React THEO DÕI hooks bằng THỨ TỰ GỌI:
Render 1: useState(1) → useEffect(2) → useRef(3) → 3 hooks, thứ tự 1-2-3
Render 2: useState(1) → (if false → SKIP useEffect) → useRef(2)
          ↑ React NGHĨ hook #2 là useEffect → nhưng THỰC TẾ là useRef
          → HOÀN TOÀN SAI → App crash hoặc silent bug

GIỐNG NHƯ:
Danh sách điểm danh: An, Bình, Cường
Nếu Bình vắng → React nghĩ: An(1), Cường-nhưng-tưởng-Bình(2)
→ Gán điểm SAI NGƯỜI → CHAOS!
```

```tsx
// PATTERNS CHO CONDITIONAL EFFECTS:

// Pattern 1: Early return
useEffect(() => {
  if (!shouldConnect) return; // Không cleanup cần thiết
  const conn = connect(roomId);
  return () => conn.disconnect();
}, [shouldConnect, roomId]);

// Pattern 2: Conditional logic bên trong
useEffect(() => {
  const conn = createConnection(roomId);
  if (autoConnect) {
    conn.connect();
  }
  return () => conn.disconnect(); // LUÔN cleanup
}, [roomId, autoConnect]);

// Pattern 3: Tách thành component riêng
function Chat({ isOnline, roomId }) {
  return isOnline ? <ChatConnection roomId={roomId} /> : <OfflineMessage />;
}

function ChatConnection({ roomId }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]); // ✅ Luôn chạy khi component mount
  return <div>Connected to {roomId}</div>;
}
```

---

### Step 19: Async Trong Effect — KHÔNG ĐƯỢC Dùng async Effect Trực Tiếp

> 🎯 "useEffect callback KHÔNG THỂ là async function. Tạo async function BÊN TRONG."

```tsx
// ❌ SAI: async Effect callback
useEffect(async () => {
  //       ^^^^^ Effect callback KHÔNG THỂ là async!
  // async function LUÔN return Promise
  // React mong đợi return là CLEANUP function hoặc undefined
  // Promise KHÔNG phải cleanup function → BUG!
  const data = await fetchData(id);
  setData(data);
}, [id]);

// ✅ ĐÚNG: async function BÊN TRONG Effect
useEffect(() => {
  let ignore = false;

  async function loadData() {
    const data = await fetchData(id);
    if (!ignore) {
      setData(data);
    }
  }

  loadData();

  return () => {
    ignore = true;
  };
}, [id]);
```

#### 🔍 Tại sao async Effect bị cấm?

```
useEffect MONG ĐỢI return:
- undefined (không cleanup)
- function  (cleanup function)

async function LUÔN return Promise:
useEffect(async () => { ... }) → return Promise<void>
→ React nhận Promise → React KHÔNG BIẾT xử lý Promise làm cleanup
→ Cleanup KHÔNG CHẠY → memory leak, stale state, race conditions

GIẢI PHÁP: Tạo async function TRONG Effect callback (sync):
useEffect(() => {          // ← callback THƯỜNG (sync)
  async function doWork() { // ← async function BÊN TRONG
    const data = await fetch(url);
    setData(data);
  }
  doWork();
  return () => { ... };    // ← cleanup function BÌNH THƯỜNG ✅
}, [url]);
```

**Race condition với async + dependencies:**

```
TIMELINE RACE CONDITION:
1. id = 1 → fetch start (takes 3 seconds)
2. id = 2 → cleanup(1) → fetch start (takes 1 second)
3. Response for id=2 arrives FIRST → setData(data2) ✅
4. Response for id=1 arrives LATER → setData(data1) ❌ STALE!
→ User thấy data của id=1 dù đang ở id=2 → BUG!

FIX VỚI IGNORE FLAG:
1. id = 1 → ignore=false → fetch start
2. id = 2 → cleanup: ignore=true → fetch start (ignore=false cho effect mới)
3. Response for id=2 → if(!ignore) → false → setData(data2) ✅
4. Response for id=1 → nhưng Effect cũ đã cleanup → ignore=true → SKIP ✅
```

**Pattern: AbortController cho real cancellation**

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    try {
      const response = await fetch(`/api/data/${id}`, {
        signal: controller.signal, // ← Truyền signal cho fetch
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch cancelled for id:", id);
      } else {
        setError(error);
      }
    }
  }

  loadData();

  return () => {
    controller.abort(); // ← THỰC SỰ cancel HTTP request!
  };
}, [id]);
```

```
IGNORE FLAG vs ABORT CONTROLLER:
┌──────────────────────┬──────────────────────────────┬──────────────────────────────┐
│                      │ ignore flag                  │ AbortController              │
├──────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Request tiếp tục?    │ CÓ — response bị bỏ qua      │ KHÔNG — request bị HỦY       │
│ Tiết kiệm bandwidth │ KHÔNG — data vẫn download    │ CÓ — dừng download ngay      │
│ Phức tạp             │ ⭐ Đơn giản                   │ ⭐⭐ Cần try-catch AbortError │
│ Khi nào dùng         │ Small requests, MVP          │ Large data, production       │
└──────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

### Step 20: Real-World Complex Scenario — Tổng Hợp Tất Cả Techniques

> 🎯 "Bài tập tổng hợp: component thực tế áp dụng NHIỀU techniques cùng lúc."

```tsx
// ❌ TRƯỚC — Component với NHIỀU dependency issues:
function LiveDashboard({ userId, config }) {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState("dark");

  // Issue 1: config là object → tạo mới mỗi render
  // Issue 2: fetchData đọc config trực tiếp
  // Issue 3: theme không nên trigger WebSocket reconnect
  // Issue 4: notifications update gây reconnect
  // Issue 5: 2 unrelated processes trong 1 Effect

  useEffect(() => {
    // Fetch data
    fetch(`/api/dashboard/${userId}`, {
      headers: config.headers, // Đọc config (object dependency!)
    })
      .then((res) => res.json())
      .then(setData);

    // WebSocket connection — KHÔNG LIÊN QUAN đến fetch!
    const ws = new WebSocket(`ws://server/${userId}`);
    ws.onmessage = (event) => {
      setNotifications([...notifications, event.data]); // Đọc notifications!
      if (theme === "dark") {
        showDarkNotification(event.data); // Đọc theme!
      }
    };

    return () => ws.close();
  }, [userId, config, notifications, theme]);
  // ↑ 4 dependencies — TẤT CẢ đều có problems!
}
```

```tsx
// ✅ SAU — Áp dụng TẤT CẢ techniques:
function LiveDashboard({ userId, config }) {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('dark');

  // Technique 1: DESTRUCTURE object → primitive dependencies
  const { apiKey, baseUrl } = config;

  // Technique 2: useEffectEvent cho non-reactive logic
  const onNotification = useEffectEvent((message: string) => {
    if (theme === 'dark') {
      showDarkNotification(message);
    } else {
      showLightNotification(message);
    }
  });

  // Technique 3: TÁCH thành 2 Effects riêng biệt

  // Effect 1: Fetch data (sync data với server)
  useEffect(() => {
    let ignore = false;  // Technique 4: ignore flag cho async

    async function loadData() {
      const response = await fetch(`${baseUrl}/dashboard/${userId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const json = await response.json();
      if (!ignore) setData(json);
    }

    loadData();
    return () => { ignore = true; };
  }, [userId, apiKey, baseUrl]); // ✅ Primitives only!

  // Effect 2: WebSocket connection (real-time notifications)
  useEffect(() => {
    const ws = new WebSocket(`ws://server/${userId}`);
    ws.onmessage = (event) => {
      // Technique 5: Updater function → loại bỏ notifications dependency
      setNotifications(prev => [...prev, event.data]);
      // Technique 6: Effect Event → đọc theme mà không reconnect
      onNotification(event.data);
    };
    return () => ws.close();
  }, [userId]); // ✅ CHỈ 1 dependency!

  return (/* ... JSX ... */);
}
```

```
TECHNIQUES ĐƯỢC ÁP DỤNG:

❌ TRƯỚC: [userId, config, notifications, theme] — 4 deps, tất cả có issue
✅ SAU:
  Effect 1: [userId, apiKey, baseUrl]  — 3 primitive deps, chạy đúng lúc
  Effect 2: [userId]                   — 1 dep, WebSocket ổn định

┌──────────────────────┬──────────────────┬─────────────────────┐
│ Issue                │ Technique        │ Dependency bị loại  │
├──────────────────────┼──────────────────┼─────────────────────┤
│ config (object)      │ Destructure      │ config → apiKey,    │
│                      │                  │ baseUrl (primitives)│
│ notifications (read  │ Updater fn       │ notifications       │
│ to calculate next)   │ prev => [...]    │                     │
│ theme (read but no   │ useEffectEvent   │ theme               │
│ re-sync needed)      │                  │                     │
│ 2 unrelated things   │ Split Effects    │ Cross-dependencies  │
│ Async race condition │ Ignore flag      │ N/A (correctness)   │
└──────────────────────┴──────────────────┴─────────────────────┘
```

---

### Step 21: "Tôi Không Cần Effect" — Anti-Pattern Phổ Biến Nhất

> 🎯 "Nhiều Effect KHÔNG NÊN TỒN TẠI. Computed values, transformations, và event responses KHÔNG cần Effect."

**Anti-Pattern 1: Effect để tính computed value**

```tsx
// ❌ SAI: Dùng Effect để tính fullName
function Profile({ firstName, lastName }) {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(firstName + " " + lastName);
  }, [firstName, lastName]); // Effect chạy → setState → RE-RENDER thừa!

  return <p>{fullName}</p>;
}

// ✅ ĐÚNG: Tính TRỰC TIẾP trong render
function Profile({ firstName, lastName }) {
  const fullName = firstName + " " + lastName; // ← Tính ngay, KHÔNG cần Effect

  return <p>{fullName}</p>;
}
```

```
TẠI SAO EFFECT SAI CHO COMPUTED VALUES:

CÁCH SAI (2 renders):
Render 1: firstName="John", lastName="Doe" → fullName="" (stale!)
→ Effect chạy → setFullName("John Doe") → trigger re-render
Render 2: fullName="John Doe" → hiển thị đúng
→ 2 renders cho 1 thay đổi → LÃNG PHÍ + UI nhấp nháy

CÁCH ĐÚNG (1 render):
Render 1: fullName = "John" + " " + "Doe" = "John Doe" → hiển thị ngay
→ 1 render → nhanh + không nhấp nháy
```

**Anti-Pattern 2: Effect để transform data**

```tsx
// ❌ SAI: Filter trong Effect
function TodoList({ todos, filter }) {
  const [filteredTodos, setFilteredTodos] = useState([]);

  useEffect(() => {
    setFilteredTodos(todos.filter((t) => t.status === filter));
  }, [todos, filter]); // Thừa 1 render!

  return (
    <ul>
      {filteredTodos.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  );
}

// ✅ ĐÚNG: Tính trong render (hoặc useMemo nếu expensive)
function TodoList({ todos, filter }) {
  // Tính trực tiếp — KHÔNG cần state, KHÔNG cần Effect:
  const filteredTodos = todos.filter((t) => t.status === filter);

  return (
    <ul>
      {filteredTodos.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  );
}

// ✅ Nếu filter RẤT NẶNG (10000+ items) → useMemo:
function TodoList({ todos, filter }) {
  const filteredTodos = useMemo(
    () => todos.filter((t) => t.status === filter),
    [todos, filter], // Cache kết quả, chỉ tính lại khi deps thay đổi
  );
  return (
    <ul>
      {filteredTodos.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  );
}
```

**Anti-Pattern 3: Effect để reset state khi prop thay đổi**

```tsx
// ❌ SAI: Effect reset state
function Chat({ userId }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(""); // Reset message khi userId thay đổi
  }, [userId]); // Thừa 1 render!

  return <input value={message} onChange={(e) => setMessage(e.target.value)} />;
}

// ✅ ĐÚNG: Dùng key để force remount
function ChatPage({ userId }) {
  // key thay đổi → React DESTROY + CREATE component mới
  // → state auto reset về initial value
  return <Chat key={userId} userId={userId} />;
}

function Chat({ userId }) {
  const [message, setMessage] = useState(""); // ← Auto reset khi key đổi
  return <input value={message} onChange={(e) => setMessage(e.target.value)} />;
}
```

```
TẠI SAO key PATTERN TỐT HƠN:

Effect reset:
1. userId thay đổi → render VỚI message CŨ (stale!) → hiển thị message cũ
2. Effect chạy → setMessage('') → re-render → hiển thị ''
→ 2 renders, user thấy flash của message cũ → UX xấu

key reset:
1. userId thay đổi → key thay đổi → React UNMOUNT Chat cũ + MOUNT Chat mới
2. Chat mới có message = '' (initial state) → hiển thị '' ngay
→ 1 render, clean transition → UX tốt
```

#### 🔍 Quy tắc: Khi nào CẦN Effect, khi nào KHÔNG?

```
KHÔNG CẦN EFFECT:
├── Tính giá trị từ props/state → tính trong render body
├── Transform/filter data → tính trong render hoặc useMemo
├── Reset state khi prop đổi → dùng key
├── Handle user events → Event Handler
├── Set state dựa trên state khác → tính cùng lúc trong event handler
└── Initialize state from props → dùng initializer function: useState(() => compute(prop))

CẦN EFFECT:
├── Subscribe/unsubscribe external system (WebSocket, event listener)
├── Fetch data từ server (nhưng xem xét React Query/SWR trước)
├── Sync với browser APIs (document.title, Intersection Observer)
├── Analytics/logging khi component mount
└── Connect/disconnect to chat servers, databases
```

---

### Step 22: useReducer — Gom Complex State, Giảm Dependencies

> 🎯 "Khi nhiều state liên quan đến nhau và Effect đọc nhiều state → useReducer gom thành 1 dependency."

```tsx
// ❌ SAI: Nhiều state → nhiều dependencies
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on("connected", () => {
      setIsConnected(true);
      setError(null);
      setRetryCount(0); // Đọc retryCount → dependency!
    });
    conn.on("error", (err) => {
      setIsConnected(false);
      setError(err);
      setRetryCount(retryCount + 1); // Đọc retryCount → dependency!
    });
    conn.on("message", (msg) => {
      setMessages([...messages, msg]); // Đọc messages → dependency!
    });
    conn.connect();
    return () => conn.disconnect();
  }, [roomId, retryCount, messages]); // ← 3 dependencies gây reconnect liên tục!
}
```

```tsx
// ✅ ĐÚNG: useReducer gom state + dispatch KHÔNG phải dependency
type ChatAction =
  | { type: 'connected' }
  | { type: 'error'; error: Error }
  | { type: 'message'; msg: string }
  | { type: 'disconnected' };

interface ChatState {
  messages: string[];
  isConnected: boolean;
  error: Error | null;
  retryCount: number;
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'connected':
      return { ...state, isConnected: true, error: null, retryCount: 0 };
    case 'error':
      return { ...state, isConnected: false, error: action.error, retryCount: state.retryCount + 1 };
    case 'message':
      return { ...state, messages: [...state.messages, action.msg] };
    case 'disconnected':
      return { ...state, isConnected: false };
  }
}

function ChatRoom({ roomId }) {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [], isConnected: false, error: null, retryCount: 0
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', () => dispatch({ type: 'connected' }));
    conn.on('error', (err) => dispatch({ type: 'error', error: err }));
    conn.on('message', (msg) => dispatch({ type: 'message', msg }));
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]); // ✅ CHỈ roomId! dispatch KHÔNG BAO GIỜ thay đổi reference!

  return (/* UI dùng state.messages, state.isConnected, etc. */);
}
```

#### 🔍 Tại sao dispatch KHÔNG phải dependency?

```
React ĐẢM BẢO: dispatch function có CÙNG reference qua TẤT CẢ renders.
Giống như setState từ useState — React tạo 1 lần và giữ ổn định.

TRƯỚC (useState):
- setMessages([...messages, msg])    ← ĐỌC messages → dependency
- setRetryCount(retryCount + 1)      ← ĐỌC retryCount → dependency

SAU (useReducer):
- dispatch({ type: 'message', msg }) ← KHÔNG ĐỌC state nào
  → Reducer tự đọc state hiện tại bên NGOÀI Effect
  → Effect chỉ gửi "command", không cần biết state

GIỐNG NHƯ:
- useState = "Tôi cần XEM số dư TÀI KHOẢN để tính số dư mới" → phải có dependency
- useReducer = "Tôi gửi LỆNH 'nạp 100k', ngân hàng tự tính" → không cần dependency
```

**Khi nào dùng useReducer vs useState + updater?**

```
DÙNG useState + updater KHI:
- 1-2 state liên quan đơn giản
- Logic update đơn giản (append, increment)
- Ví dụ: setMessages(msgs => [...msgs, newMsg])

DÙNG useReducer KHI:
- 3+ state liên quan chặt chẽ
- Logic update phức tạp (nhiều state thay đổi cùng lúc)
- Cần "describe WHAT happened" thay vì "HOW to update"
- Effect đang đọc nhiều state → nhiều dependencies
```

---

### Step 23: useMemo — Tránh Object/Array Dependency Thay Đổi Không Cần Thiết

> 🎯 "useMemo giữ reference ỔN ĐỊNH cho computed objects/arrays → Effect không chạy thừa."

```tsx
// ❌ SAI: headers object tạo mới mỗi render
function DataFetcher({ token, language }) {
  const [data, setData] = useState(null);

  // headers tạo MỚI mỗi render dù token và language KHÔNG đổi
  const headers = {
    Authorization: `Bearer ${token}`,
    "Accept-Language": language,
  };

  useEffect(() => {
    fetch("/api/data", { headers })
      .then((r) => r.json())
      .then(setData);
  }, [headers]); // ← headers LUÔN khác → fetch EVERY render!
}
```

```tsx
// ✅ FIX 1 (ưu tiên): Di chuyển vào Effect
function DataFetcher({ token, language }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    };
    fetch("/api/data", { headers })
      .then((r) => r.json())
      .then(setData);
  }, [token, language]); // ✅ Primitives
}

// ✅ FIX 2: useMemo khi KHÔNG THỂ di chuyển vào Effect
// (ví dụ: object dùng ở NHIỀU NƠI, không chỉ Effect)
function DataFetcher({ token, language }) {
  const [data, setData] = useState(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    }),
    [token, language],
  ); // ← CHỈ tạo object MỚI khi token hoặc language ĐỔI

  useEffect(() => {
    fetch("/api/data", { headers })
      .then((r) => r.json())
      .then(setData);
  }, [headers]); // ✅ headers chỉ thay đổi khi token/language thay đổi

  // headers CŨNG dùng ở đây:
  return <HeaderDisplay headers={headers} />;
}
```

```
KHI NÀO DÙNG useMemo CHO DEPENDENCIES:

✅ DÙNG useMemo KHI:
- Object/array dùng ở NHIỀU NƠI (không chỉ trong Effect)
- Không thể di chuyển creation vào trong Effect
- Computation tốn kém (sort 10000 items, complex transform)

❌ KHÔNG CẦN useMemo KHI:
- Object chỉ dùng trong Effect → di chuyển VÀO Effect (đơn giản hơn)
- Có thể destructure thành primitives
- Value là primitive (string, number) → đã ổn định sẵn
```

---

### Step 24: Dependency Array — Three Flavors Deep Comparison

> 🎯 "Hiểu rõ sự khác biệt giữa KHÔNG có array, array RỖNG [], và array CÓ PHẦN TỬ [deps]."

```tsx
// FLAVOR 1: KHÔNG CÓ dependency array → chạy SAU MỖI render
useEffect(() => {
  console.log("Runs after EVERY render");
});
// Component mount → chạy
// state thay đổi → re-render → chạy
// props thay đổi → re-render → chạy
// parent re-render → chạy
// → HẦU NHƯ KHÔNG BAO GIỜ muốn dùng cách này

// FLAVOR 2: Array RỖNG [] → chạy 1 lần khi MOUNT
useEffect(() => {
  console.log("Runs ONCE on mount");
  return () => console.log("Cleanup on UNMOUNT");
}, []);
// Component mount → chạy
// state/props thay đổi → KHÔNG chạy
// Component unmount → cleanup chạy

// FLAVOR 3: Array CÓ PHẦN TỬ → chạy khi deps thay đổi
useEffect(() => {
  console.log("Runs when roomId changes");
  return () => console.log("Cleanup old roomId");
}, [roomId]);
// Mount → chạy (lần đầu)
// roomId thay đổi → cleanup + chạy lại
// roomId KHÔNG đổi (re-render khác) → KHÔNG chạy
```

#### 🔍 Bảng so sánh chi tiết

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                  │ Không có array   │ []               │ [roomId]         │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Khi nào chạy     │ SAU MỖI render   │ 1 lần khi mount  │ Khi roomId đổi   │
│ Cleanup khi nào  │ TRƯỚC mỗi re-run │ Khi unmount      │ Khi roomId đổi   │
│                  │ + khi unmount    │                  │ + khi unmount    │
│ Phổ biến?        │ Hiếm khi đúng   │ Khá phổ biến     │ Rất phổ biến     │
│ Ví dụ            │ Debug logging    │ Init SDK,        │ Fetch data,      │
│                  │ (dev only)       │ analytics setup  │ WebSocket, sub   │
│ Nguy hiểm?       │ CÓ — performance│ CÓ THỂ — stale   │ AN TOÀN nhất     │
│                  │ issue            │ closures nếu đọc │ nếu deps đầy đủ  │
│                  │                  │ reactive values  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

⚠️ COMMON MISTAKE:
"Tôi muốn Effect chạy 1 lần" → dùng []
NHƯNG Effect ĐỌC props/state → stale closures!

ĐÚNG: Dependency array PHẢI phản ánh code.
Nếu cần chạy 1 lần → đảm bảo Effect KHÔNG đọc reactive values.
```

---

### Step 25: useLayoutEffect — Khi Timing Ảnh Hưởng Dependencies

> 🎯 "useLayoutEffect chạy ĐỒNG BỘ sau DOM update, TRƯỚC paint — dùng khi cần đọc/ghi DOM."

```tsx
// useEffect vs useLayoutEffect:
// Cả hai có CÙNG dependency rules!
// Khác biệt CHỈ ở TIMING:

useEffect(() => {
  // Chạy SAU paint → user có thể thấy flash
  // Async (non-blocking) → không block UI
}, [deps]);

useLayoutEffect(() => {
  // Chạy TRƯỚC paint → user KHÔNG thấy flash
  // Sync (blocking) → CÓ THỂ block UI nếu chậm
}, [deps]);
```

```
TIMELINE:
Component render → DOM update → useLayoutEffect → Browser PAINT → useEffect
                                ↑ TRƯỚC paint                      ↑ SAU paint

KHI NÀO DÙNG useLayoutEffect:
├── Đo kích thước DOM element (getBoundingClientRect)
├── Đặt position/scroll TRƯỚC khi user thấy
├── Tooltip positioning
├── Animation setup cần chính xác
└── Prevent visual flash (UI nhấp nháy)
```

```tsx
// Ví dụ: Tooltip position cần đo DOM
function Tooltip({ targetRef, text }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  // ❌ useEffect → user thấy tooltip ở vị trí SAI rồi nhảy sang đúng
  // ✅ useLayoutEffect → tooltip hiện ở vị trí ĐÚNG ngay từ đầu
  useLayoutEffect(() => {
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition({
      top: targetRect.bottom + 8,
      left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
    });
  }, [targetRef]); // ← CÙNG dependency rules như useEffect!

  return (
    <div ref={tooltipRef} style={{ position: "fixed", ...position }}>
      {text}
    </div>
  );
}
```

```
QUAN TRỌNG VỀ DEPENDENCIES:
- useLayoutEffect có CÙNG dependency rules như useEffect
- Linter kiểm tra dependencies GIỐNG NHAU
- Tất cả techniques (updater fn, useEffectEvent, etc.) ÁP DỤNG giống nhau
- CHỈ KHÁC: TIMING chạy (trước vs sau paint)
- Mặc định dùng useEffect. CHỈ đổi sang useLayoutEffect khi CẦN đọc DOM layout
```

---

### Step 26: useSyncExternalStore — Subscribe External System Không Cần Effect

> 🎯 "Thay vì Effect + state để subscribe external store → dùng useSyncExternalStore."

```tsx
// ❌ SAI: Effect + state để theo dõi window size (manual subscription)
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Manual subscription trong Effect

  return width;
}

// ✅ ĐÚNG: useSyncExternalStore (React 18+)
import { useSyncExternalStore } from "react";

function useWindowWidth() {
  return useSyncExternalStore(
    // subscribe: function nhận callback, trả về unsubscribe
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    // getSnapshot: trả về giá trị hiện tại
    () => window.innerWidth,
  );
  // KHÔNG CẦN useEffect, KHÔNG CẦN useState, KHÔNG CẦN dependency array!
}
```

#### 🔍 Tại sao useSyncExternalStore tốt hơn Effect?

```
EFFECT-BASED:
1. Component mount → useEffect chạy → subscribe
2. Giá trị thay đổi → callback → setState → re-render
PROBLEMS:
- Có khoảng "gap" giữa mount và subscribe → có thể miss events
- StrictMode chạy 2 lần → subscribe 2 lần rồi unsubscribe 1
- Server rendering: window undefined → cần check
- Tearing: concurrent mode có thể render với stale value

useSyncExternalStore:
1. Component render → useSyncExternalStore tự quản lý subscribe
2. Giá trị thay đổi → React tự biết → re-render
BENEFITS:
- KHÔNG có gap → không miss events
- Concurrent-safe → không tearing
- Hỗ trợ server snapshot: useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
- KHÔNG CẦN dependency array → không dependency bugs!
```

```tsx
// Ví dụ khác: theo dõi online/offline status
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine, // Client snapshot
    () => true, // Server snapshot (assume online)
  );
}

// Component dùng — CỰC đơn giản:
function StatusBar() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? "🟢 Online" : "🔴 Offline"}</span>;
}
```

```
KHI NÀO DÙNG useSyncExternalStore vs useEffect:

useSyncExternalStore:
├── Theo dõi browser API (resize, online, media query)
├── Theo dõi external store (Redux, Zustand, custom stores)
├── Bất kỳ subscription nào có pattern subscribe + getSnapshot
└── Concurrent mode safety cần thiết

useEffect:
├── Side effects (fetch data, log analytics)
├── Connect to server (WebSocket, chat)
├── DOM mutations
├── Timer-based effects (setInterval, setTimeout)
└── Bất kỳ gì KHÔNG FIT pattern subscribe + getSnapshot
```

---

### Step 27: Third-Party Libraries — React Query/SWR Thay Thế Effect Fetching

> 🎯 "Effect-based fetching có NHIỀU vấn đề. Libraries chuyên dụng giải quyết tốt hơn."

```tsx
// ❌ Effect-based fetching: CẦN xử lý RẤT NHIỀU edge cases
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId]);
  // CÒN THIẾU: caching, deduplication, background refetch,
  // pagination, retry logic, prefetching, SSR support...
}

// ✅ React Query: xử lý TẤT CẢ tự động
import { useQuery } from "@tanstack/react-query";

function UserProfile({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user", userId], // ← "dependency array" tương tự
    queryFn: () => fetch(`/api/users/${userId}`).then((r) => r.json()),
  });
  // Tự động: caching, deduplication, background refetch,
  // retry, race condition handling, garbage collection...
}
```

```
EFFECT FETCHING vs REACT QUERY/SWR:
┌───────────────────────┬────────────────────┬────────────────────┐
│ Feature               │ Effect + useState  │ React Query / SWR  │
├───────────────────────┼────────────────────┼────────────────────┤
│ Race conditions       │ Manual (ignore)    │ Automatic ✅       │
│ Caching               │ Manual (phức tạp)  │ Built-in ✅        │
│ Deduplication         │ Không có           │ Automatic ✅       │
│ Background refetch    │ Manual             │ Built-in ✅        │
│ Retry on error        │ Manual             │ Configurable ✅    │
│ Loading/error states  │ Manual (3 states)  │ Built-in ✅        │
│ SSR/hydration         │ Phức tạp           │ Built-in ✅        │
│ DevTools              │ Không có           │ Có ✅              │
│ Dependency management │ Manual (linter)    │ queryKey (tự quản) │
│ Stale while revalidate│ Không              │ Default behavior ✅│
└───────────────────────┴────────────────────┴────────────────────┘

KẾT LUẬN:
- Prototype/learning → Effect + useState (hiểu cơ chế)
- Production app → React Query hoặc SWR (DX + UX tốt hơn)
- React docs KHUYẾN CÁO dùng framework/library cho data fetching
```

---

### Step 28: Event Delegation Pattern — Giảm Số Lượng Effect Listeners

> 🎯 "Thay vì mỗi element 1 Effect listener → 1 listener ở parent xử lý tất cả."

```tsx
// ❌ SAI: Mỗi item 1 Effect với event listener riêng
function ItemList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <ItemWithHover key={item.id} item={item} />
      ))}
    </ul>
  );
}

function ItemWithHover({ item }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const handleMouseEnter = () => showTooltip(item.name);
    const handleMouseLeave = () => hideTooltip();
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [item.name]); // 100 items → 200 event listeners!

  return <li ref={ref}>{item.name}</li>;
}

// ✅ ĐÚNG: 1 listener ở parent — KHÔNG CẦN Effect
function ItemList({ items }) {
  const handleMouseEnter = (e) => {
    const name = e.target.dataset.name;
    if (name) showTooltip(name);
  };
  const handleMouseLeave = () => hideTooltip();

  return (
    <ul onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {items.map((item) => (
        <li key={item.id} data-name={item.name}>
          {item.name}
        </li>
      ))}
    </ul>
  );
  // 100 items → 2 event listeners (on parent <ul>)
  // KHÔNG CẦN Effect, KHÔNG CẦN dependencies, KHÔNG CẦN cleanup!
}
```

```
TẠI SAO EVENT DELEGATION GIẢM DEPENDENCIES:

TRƯỚC: 100 items × 1 Effect × 2 listeners = 200 subscriptions + 200 cleanups
→ Mỗi item thay đổi → Effect cleanup + re-subscribe
→ Dependency array mỗi item phải theo dõi props → phức tạp

SAU: 1 parent × 2 listeners = 2 subscriptions, KHÔNG CẦN Effect
→ React JSX events (onMouseEnter) tự manage → KHÔNG dependency array
→ Thêm/xóa items → KHÔNG ảnh hưởng listener
→ Performance tốt hơn + code đơn giản hơn

REACT TỰ LÀM EVENT DELEGATION:
Thực tế, React đã dùng event delegation bên dưới!
onClick trên <button> → React gắn listener ở ROOT, không phải <button>
→ Bạn chỉ cần dùng JSX events → React tự quản lý
→ KHÔNG CẦN Effect cho DOM events trong hầu hết trường hợp
```

---

### Step 29: Cheat Sheet — Tổng Hợp Tất Cả Knowledge Phần A

> 🎯 "Bảng tham khảo nhanh cho TẤT CẢ concepts trong Phần A."

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         EFFECT DEPENDENCIES — COMPLETE CHEAT SHEET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 NGUYÊN TẮC SỐ 1:
   Dependencies MÔ TẢ code → KHÔNG BAO GIỜ suppress linter

📌 REACTIVE VALUES:
   Props ✓  State ✓  Local vars ✓  Refs ✗  Constants ngoài component ✗

📌 SO SÁNH: React dùng Object.is()
   Primitives → so sánh VALUE → ổn định ✅
   Objects/Functions → so sánh REFERENCE → thường KHÔNG ổn ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     LOẠI BỎ DEPENDENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 State để tính state tiếp:
   setX(x + 1) → setX(prev => prev + 1)

🔧 Object/fn trong component body:
   → Di chuyển VÀO Effect (ưu tiên)
   → Di chuyển RA NGOÀI component
   → Destructure thành primitives
   → useMemo (khi cần dùng nhiều nơi)

🔧 Đọc nhưng không react:
   → useEffectEvent (experimental)
   → useRef (cho mutable values)

🔧 Event-specific logic:
   → Di chuyển vào Event Handler

🔧 Unrelated logic:
   → Tách thành nhiều Effects

🔧 Complex state:
   → useReducer (dispatch không phải dependency)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     KHÔNG CẦN EFFECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Computed value → tính trong render body
❌ Transform data → render body hoặc useMemo
❌ Reset state on prop change → key prop
❌ User event response → Event Handler
❌ External store subscription → useSyncExternalStore

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     CẦN EFFECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Subscribe external system (WebSocket, chat)
✅ Fetch data (nhưng xét React Query trước)
✅ Sync browser API (document.title)
✅ Analytics/logging on mount
✅ Connect/disconnect servers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     CLEANUP PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧹 Subscriptions: removeEventListener / ws.close()
🧹 Timers: clearInterval / clearTimeout
🧹 Async fetch: ignore flag hoặc AbortController
🧹 Connections: connection.disconnect()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     HOOKS COMPARISON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useEffect         → async, after paint, phổ biến nhất
useLayoutEffect   → sync, before paint, đo DOM
useEffectEvent    → stable fn, không dependency, experimental
useCallback       → stable fn, CÓ dependency, truyền cho child
useMemo           → stable value, CÓ dependency, expensive compute
useRef            → mutable box, không trigger render, không dependency
useReducer        → dispatch stable, complex state, giảm dependencies
useSyncExternalStore → subscribe external, không cần Effect

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 30: Closures Deep Dive — Tại Sao Effect "Nhớ" Giá Trị Cũ?

> 🎯 "Mỗi render tạo 1 closure MỚI. Effect 'nhìn thấy' giá trị TẠI THỜI ĐIỂM nó được tạo."

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Effect này "capture" count TẠI THỜI ĐIỂM render
    const id = setInterval(() => {
      console.log("Count is:", count); // ← count LUÔN là giá trị lúc Effect chạy!
    }, 1000);
    return () => clearInterval(id);
  }, []); // [] → chỉ chạy 1 lần → capture count = 0 FOREVER
  // Click button 5 lần → console vẫn log "Count is: 0" ← STALE!
}
```

#### 🔍 Closure hoạt động thế nào trong React?

```
RENDER 1 (count = 0):
┌──────────────────────────────────────┐
│ Closure #1 (count = 0)              │
│                                      │
│ useEffect(() => {                    │
│   setInterval(() => {                │
│     console.log(count); // → 0       │
│   }, 1000);                          │
│ }, []);                              │
│                                      │
│ React: deps [] → chạy Effect lần 1  │
└──────────────────────────────────────┘

RENDER 2 (count = 1):
┌──────────────────────────────────────┐
│ Closure #2 (count = 1)              │
│                                      │
│ useEffect(() => {                    │
│   // Effect MỚI được TẠO nhưng...   │
│   // deps [] → Object.is([], [])    │
│   // → KHÔNG chạy lại!              │
│ }, []);                              │
│                                      │
│ React: deps chưa đổi → SKIP Effect  │
│ → setInterval VẪN dùng Closure #1   │
│ → count VẪN LÀ 0!                   │
└──────────────────────────────────────┘

RENDER 3, 4, 5... → CÙNG vấn đề → count luôn = 0
```

```
GIỐNG NHƯ:
Bạn chụp ảnh bạn bè lúc 8h sáng (count = 0).
Đến trưa bạn bè thay đồ (count = 1, 2, 3...).
Nhưng bạn vẫn nhìn BỨC ẢNH lúc sáng → thấy đồ cũ!

Muốn thấy đồ mới → phải CHỤP LẠI (tạo closure mới = chạy Effect lại)
```

**Ba cách fix stale closure:**

```tsx
// Fix 1: Thêm dependency → tạo closure mới khi count đổi
useEffect(() => {
  const id = setInterval(() => {
    console.log("Count is:", count); // ← count LÚC NÀY là mới nhất
  }, 1000);
  return () => clearInterval(id); // ← cleanup interval cũ
}, [count]); // ← mỗi lần count đổi → closure MỚI → count mới

// Fix 2: Updater function → không cần đọc count
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1); // ← KHÔNG đọc count, đọc "c" từ React
  }, 1000);
  return () => clearInterval(id);
}, []); // ← [] OK vì KHÔNG đọc count trong callback

// Fix 3: useRef → luôn đọc giá trị mới nhất
const countRef = useRef(count);
countRef.current = count; // Cập nhật mỗi render

useEffect(() => {
  const id = setInterval(() => {
    console.log("Count is:", countRef.current); // ← LUÔN mới nhất
  }, 1000);
  return () => clearInterval(id);
}, []); // ← [] OK vì ref.current luôn cập nhật
```

```
TỔNG KẾT CLOSURE + DEPENDENCY:

Dependency array QUYẾT ĐỊNH khi nào tạo closure MỚI:
- []      → 1 closure DUY NHẤT, giá trị bị "đóng băng" tại mount
- [count] → closure MỚI mỗi khi count đổi
- Không có → closure MỚI mỗi render (thường quá nhiều)

Stale closure = closure CŨ đọc giá trị CŨ
→ Nguyên nhân: dependency array THIẾU biến mà Effect đọc
→ Fix: thêm dependency, dùng updater, hoặc dùng ref
```

---

### Step 31: Debugging Stale Closures — Phát Hiện Và Fix

> 🎯 "Stale closure là bug THẦM LẶNG — app chạy nhưng dùng DATA CŨ. Học cách phát hiện nhanh."

**Dấu hiệu nhận biết stale closure:**

```
🚩 RED FLAGS:
1. console.log trong Effect/callback luôn hiện CÙNG GIÁ TRỊ
2. Linter cảnh báo "React Hook useEffect has a missing dependency"
3. UI không phản hồi đúng khi state thay đổi
4. setInterval/setTimeout callback dùng giá trị cũ
5. Event listener trong Effect không "thấy" state mới
```

```tsx
// 🐛 BUG: Event listener stale closure
function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Keyboard shortcut: Ctrl+Enter → search
    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === "Enter") {
        // BUG: query LUÔN LÀ '' (giá trị lúc mount)
        // vì Effect chỉ chạy 1 lần, closure capture query = ''
        fetch(`/api/search?q=${query}`)
          .then((r) => r.json())
          .then(setResults);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // ← THIẾU query! Linter sẽ cảnh báo

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {/* User gõ "react hooks" → nhấn Ctrl+Enter → search với "" ← BUG */}
    </div>
  );
}
```

```tsx
// ✅ Fix 1: Thêm query vào dependencies
useEffect(() => {
  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === "Enter") {
      fetch(`/api/search?q=${query}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [query]); // ← Mỗi keystroke → remove + add listener → OK nhưng nhiều

// ✅ Fix 2 (tốt hơn): useEffectEvent
const onSearch = useEffectEvent(() => {
  fetch(`/api/search?q=${query}`)
    .then((r) => r.json())
    .then(setResults);
});

useEffect(() => {
  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === "Enter") {
      onSearch(); // ← Luôn đọc query MỚI NHẤT
    }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []); // ← Chỉ subscribe 1 lần, query luôn fresh

// ✅ Fix 3: useRef
const queryRef = useRef(query);
queryRef.current = query;

useEffect(() => {
  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === "Enter") {
      fetch(`/api/search?q=${queryRef.current}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []); // ← OK vì dùng ref
```

#### 🔍 Debugging checklist

```
KHI GẶP BUG NGHI LÀ STALE CLOSURE:

1. ✅ Check linter warnings — có "missing dependency" không?
2. ✅ console.log giá trị TRONG Effect/callback — có bị cũ không?
3. ✅ So sánh dependency array với reactive values THỰC SỰ được đọc
4. ✅ Check setInterval/setTimeout — callback có đọc state/props không?
5. ✅ Check event listeners — có subscribe trong Effect rồi đọc state không?

FIX PRIORITY:
1. Thêm dependency (nếu Effect CẦN chạy lại khi value đổi)
2. useEffectEvent (nếu Effect KHÔNG CẦN chạy lại, chỉ cần đọc mới nhất)
3. Updater function (nếu đọc state chỉ để tính state tiếp theo)
4. useRef (nếu useEffectEvent chưa available / không phù hợp)
```

---

### Step 32: Multiple Effects — Thứ Tự Chạy Trong Cùng Component

> 🎯 "Nhiều Effects trong cùng component chạy theo THỨ TỰ khai báo — hiểu để tránh bug timing."

```tsx
function ChatRoom({ roomId }) {
  // Effect 1: khai báo TRƯỚC
  useEffect(() => {
    console.log("Effect 1: Connect");
    const conn = createConnection(roomId);
    conn.connect();
    return () => {
      console.log("Cleanup 1: Disconnect");
      conn.disconnect();
    };
  }, [roomId]);

  // Effect 2: khai báo SAU
  useEffect(() => {
    console.log("Effect 2: Log visit");
    logVisit(roomId);
    return () => {
      console.log("Cleanup 2: Clear log");
    };
  }, [roomId]);
}
```

```
THỨ TỰ CHẠY KHI MOUNT:
1. Component render → DOM update
2. Effect 1 SETUP: "Connect"
3. Effect 2 SETUP: "Log visit"
→ Effects chạy theo THỨ TỰ KHAI BÁO (top → bottom)

THỨ TỰ KHI roomId THAY ĐỔI:
1. Cleanup 1: "Disconnect"     ← Cleanup TRƯỚC, theo thứ tự
2. Cleanup 2: "Clear log"      ← Cleanup TRƯỚC, theo thứ tự
3. Effect 1 SETUP: "Connect"   ← Setup SAU, theo thứ tự
4. Effect 2 SETUP: "Log visit" ← Setup SAU, theo thứ tự

THỨ TỰ KHI UNMOUNT:
1. Cleanup 1: "Disconnect"
2. Cleanup 2: "Clear log"
→ TẤT CẢ cleanups chạy theo thứ tự khai báo
```

```
⚠️ QUAN TRỌNG:
- Effects KHÔNG nên phụ thuộc vào THỨ TỰ của nhau
- Mỗi Effect nên ĐỘC LẬP — không cần biết Effect khác tồn tại
- Nếu Effect 2 CẦN kết quả Effect 1 → có lẽ nên GỘP thành 1 Effect
- Thứ tự chạy là CHI TIẾT implementation — không nên dựa vào

NẾU CẦN PHỐI HỢP:
- Dùng state/ref để truyền data giữa Effects
- Hoặc gộp thành 1 Effect nếu logic liên quan
```

---

### Step 33: Debounce & Throttle Trong Effect

> 🎯 "Debounce/throttle trong Effect cần CLEANUP đúng — nếu không sẽ gây memory leak hoặc stale data."

```tsx
// ❌ SAI: Debounce KHÔNG CÓ cleanup
function SearchBox() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Tạo timeout MỖI LẦN query thay đổi
    // NHƯNG không cancel timeout CŨ!
    setTimeout(() => {
      fetch(`/api/search?q=${query}`).then(/*...*/);
    }, 300);
    // Nếu user gõ nhanh: "r", "re", "rea", "reac", "react"
    // → 5 timeouts → 5 fetches! Không debounce gì cả!
  }, [query]);
}

// ✅ ĐÚNG: Debounce VỚI cleanup
function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Nếu query rỗng, không search
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(`/api/search?q=${query}`)
        .then((r) => r.json())
        .then(setResults);
    }, 300); // Chờ 300ms sau keystroke CUỐI CÙNG

    return () => {
      clearTimeout(timeoutId); // ← CANCEL timeout CŨ!
    };
    // User gõ "r" → timeout 300ms → "re" → CANCEL → timeout mới 300ms
    // → "rea" → CANCEL → timeout mới → ... → "react" → đợi 300ms → FETCH!
    // → CHỈ 1 fetch cho "react" ✅
  }, [query]);
}
```

#### 🔍 Debounce vs Throttle trong Effect

```
DEBOUNCE: Chờ user DỪNG thao tác → rồi mới chạy
├── Ví dụ: Search = chờ dừng gõ 300ms → fetch
├── Implementation: setTimeout + clearTimeout trong cleanup
└── Dependency: [query] → mỗi keystroke cancel timeout cũ → tạo timeout mới

THROTTLE: Chạy TỐI ĐA 1 LẦN trong khoảng thời gian
├── Ví dụ: Scroll handler = tối đa 1 lần/100ms
├── Implementation: phức tạp hơn trong Effect
└── Thường dùng useMemo + custom hook
```

```tsx
// Custom Hook: useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer); // ← Cleanup!
  }, [value, delay]);

  return debouncedValue;
}

// SỬ DỤNG — cực đơn giản:
function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) return;
    // CHỈ fetch khi debouncedQuery thay đổi (sau 300ms)
    fetch(`/api/search?q=${debouncedQuery}`)
      .then((r) => r.json())
      .then(setResults);
  }, [debouncedQuery]); // ← dependency là DEBOUNCED value, không phải raw query

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

```tsx
// Custom Hook: useThrottle
function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= interval) {
      // Đã đủ thời gian → update ngay
      lastRun.current = now;
      setThrottledValue(value);
    } else {
      // Chưa đủ thời gian → schedule update
      const timer = setTimeout(() => {
        lastRun.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastRun);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// SỬ DỤNG:
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Chỉ chạy MAX 1 lần/100ms dù scroll liên tục
    logScrollPosition(throttledScrollY);
  }, [throttledScrollY]);
}
```

---

### Step 34: Infinite Loop Debugging — Phân Tích Và Thoát Dependency Cycles

> 🎯 "Infinite loop trong Effect = app freeze. Học cách phát hiện VÀ fix nhanh."

**Loại 1: setState TRỰC TIẾP trong Effect không có deps**

```tsx
// ❌ INFINITE LOOP cơ bản:
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // setState → re-render → Effect chạy → setState → ...
  }); // ← KHÔNG có dependency array → chạy MỖI render!

  // TIMELINE: render(0) → Effect → setCount(1) → render(1) → Effect → setCount(2) → ...
  // → INFINITE LOOP → app freeze!
}
```

**Loại 2: Object/array tạo trong render body**

```tsx
// ❌ INFINITE LOOP qua object dependency:
function DataFetcher({ userId }) {
  const [data, setData] = useState(null);

  // options tạo MỚI mỗi render (new reference)
  const options = { userId, format: "json" };

  useEffect(() => {
    fetch("/api/data", options)
      .then((r) => r.json())
      .then(setData);
  }, [options]);
  // render → options MỚI → Effect chạy → setData → re-render
  // → options MỚI LẠI → Effect chạy → setData → ... INFINITE!
}
```

**Loại 3: Circular dependency giữa 2 states**

```tsx
// ❌ INFINITE LOOP qua circular updates:
function Converter() {
  const [celsius, setCelsius] = useState(0);
  const [fahrenheit, setFahrenheit] = useState(32);

  useEffect(() => {
    setFahrenheit((celsius * 9) / 5 + 32); // celsius đổi → set fahrenheit
  }, [celsius]);

  useEffect(() => {
    setCelsius(((fahrenheit - 32) * 5) / 9); // fahrenheit đổi → set celsius
  }, [fahrenheit]);

  // celsius đổi → setFahrenheit → fahrenheit đổi → setCelsius → celsius đổi → ...
  // CIRCULAR LOOP!
}

// ✅ FIX: Single source of truth + computed value
function Converter() {
  const [celsius, setCelsius] = useState(0);
  const fahrenheit = (celsius * 9) / 5 + 32; // ← COMPUTED, không phải state

  return (
    <div>
      <input
        value={celsius}
        onChange={(e) => setCelsius(Number(e.target.value))}
      />
      <p>Fahrenheit: {fahrenheit}</p> {/* ← Tự cập nhật khi celsius đổi */}
    </div>
  );
}
```

#### 🔍 Debugging checklist cho infinite loops

```
PHÁT HIỆN:
- Browser tab freeze / "Maximum update depth exceeded" error
- console.log trong Effect chạy liên tục
- React DevTools Profiler: renders liên tục không dừng

NGUYÊN NHÂN PHỔBIẾN:
1. Thiếu dependency array → Effect chạy MỖI render + setState → loop
2. Object/array dep tạo mới mỗi render → Effect luôn "thấy" khác
3. setState trong Effect KHÔNG có condition → luôn trigger re-render
4. Circular: Effect A set state → trigger Effect B → set state → trigger A

FIX THEO THỨ TỰ:
1. Thêm dependency array (dù rỗng [])
2. Object dep → destructure / move inside / useMemo
3. Thêm condition: if (data !== newData) setData(newData)
4. Circular → dùng computed value thay 1 trong 2 states
5. Dùng useRef cho "mutable but non-reactive" values
```

---

### Step 35: Context Là Dependency — Khi Context Thay Đổi Effect Chạy Lại

> 🎯 "useContext trả về reactive value → PHẢI khai báo trong dependencies nếu Effect sử dụng."

```tsx
const ThemeContext = createContext("light");

function ChatRoom({ roomId }) {
  const theme = useContext(ThemeContext); // ← Reactive value!

  // ❌ SAI: theme là reactive nhưng KHÔNG trong deps
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    logConnection(roomId, theme); // Đọc theme!
    return () => conn.disconnect();
  }, [roomId]); // ← THIẾU theme! Linter cảnh báo

  // ✅ ĐÚNG (nếu cần reconnect khi theme đổi):
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    logConnection(roomId, theme);
    return () => conn.disconnect();
  }, [roomId, theme]); // ← theme thay đổi → disconnect + reconnect

  // ✅ TỐT HƠN (nếu KHÔNG cần reconnect khi theme đổi):
  const onConnected = useEffectEvent(() => {
    logConnection(roomId, theme); // Đọc theme MỚI NHẤT mà không reconnect
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    onConnected();
    return () => conn.disconnect();
  }, [roomId]); // ← theme đổi KHÔNG gây reconnect
}
```

#### 🔍 Context và performance

```
CONTEXT THAY ĐỔI → TẤT CẢ consumers re-render → Effects CÓ THỂ chạy lại

VẤN ĐỀ:
ThemeContext thay đổi → 50 components dùng useContext(ThemeContext)
→ 50 re-renders → mỗi component có Effect dùng theme
→ 50 Effects chạy lại (nếu theme trong deps)
→ PERFORMANCE ISSUE!

GIẢI PHÁP:
1. useEffectEvent: đọc theme mà không trigger Effect → KHÔNG reconnect
2. Split Context: tách theme thành ThemeColorContext + ThemeFontContext
   → Chỉ components cần color re-render khi color đổi
3. useMemo: memoize context value ở Provider
```

```tsx
// ⚠️ Provider tạo object MỚI mỗi render → TẤT CẢ consumers re-render
function App() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);

  // ❌ value tạo MỚI mỗi render → tất cả consumers re-render
  return (
    <AppContext.Provider value={{ theme, user, setTheme, setUser }}>
      <Main />
    </AppContext.Provider>
  );
}

// ✅ useMemo → value ổn định khi deps không đổi
function App() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);

  const contextValue = useMemo(
    () => ({ theme, user, setTheme, setUser }),
    [theme, user], // ← setTheme, setUser là stable → không cần
  );

  return (
    <AppContext.Provider value={contextValue}>
      <Main />
    </AppContext.Provider>
  );
}
```

---

### Step 36: Custom Deep Compare — Khi Object.is Không Đủ

> 🎯 "Đôi khi bạn CẦN so sánh deep content thay vì reference. React KHÔNG hỗ trợ — phải tự implement."

```tsx
// VẤN ĐỀ: API trả về object MỚI mỗi lần nhưng CONTENT giống
function UserDashboard({ userId }) {
  const [config, setConfig] = useState(null);

  // Effect 1: Fetch config mỗi 5 giây
  useEffect(() => {
    const id = setInterval(async () => {
      const newConfig = await fetchConfig(userId);
      setConfig(newConfig); // ← Object MỚI mỗi lần, dù data giống
    }, 5000);
    return () => clearInterval(id);
  }, [userId]);

  // Effect 2: Apply config
  useEffect(() => {
    if (!config) return;
    applyConfig(config); // ← Chạy MỖI 5 giây dù config KHÔNG ĐỔI!
  }, [config]); // ← config = new object mỗi lần → Object.is FALSE
}
```

```tsx
// ✅ Fix 1: Custom hook useDeepCompareEffect
import { useRef } from "react";

function useDeepCompareEffect(callback, deps) {
  const previousDepsRef = useRef(deps);

  // So sánh deep content
  if (!deepEqual(previousDepsRef.current, deps)) {
    previousDepsRef.current = deps; // Cập nhật chỉ khi THỰC SỰ khác
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, previousDepsRef.current);
  // ↑ Suppress linter ở đây CÓ LÝ DO — ta tự quản lý deps
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => deepEqual(a[key], b[key]));
}

// Sử dụng:
useDeepCompareEffect(() => {
  applyConfig(config);
}, [config]); // ← Chỉ chạy khi config CONTENT thay đổi
```

```tsx
// ✅ Fix 2 (đơn giản hơn): JSON.stringify
useEffect(() => {
  if (!config) return;
  applyConfig(config);
}, [JSON.stringify(config)]); // ← So sánh string = so sánh content
// ⚠️ Chú ý: JSON.stringify CHẬM với object lớn + không handle circular refs

// ✅ Fix 3 (tốt nhất): Không tạo object mới nếu content giống
useEffect(() => {
  const id = setInterval(async () => {
    const newConfig = await fetchConfig(userId);
    setConfig((prev) => {
      // CHỈ update state nếu content THỰC SỰ khác
      if (JSON.stringify(prev) === JSON.stringify(newConfig)) {
        return prev; // ← CÙNG reference → Effect 2 KHÔNG chạy!
      }
      return newConfig;
    });
  }, 5000);
  return () => clearInterval(id);
}, [userId]);
```

```
KHI NÀO CẦN DEEP COMPARE:
├── API trả về object mới mỗi lần poll (content giống)
├── Redux selector trả về computed object
├── Parent truyền object prop tạo inline
└── WebSocket nhận data dạng object

ƯU TIÊN FIX:
1. Không tạo object mới → so sánh trước khi setState
2. Destructure thành primitives → dependency primitives
3. JSON.stringify (đơn giản, đủ tốt cho object nhỏ)
4. useDeepCompareEffect (library: use-deep-compare-effect)
```

---

### Step 37: Testing Effects — Viết Test Cho Components Có Effect

> 🎯 "Effect là side effect — testing cần MOCK external systems và VERIFY đúng behavior."

```tsx
// Component cần test:
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetchUser(userId).then((data) => {
      if (!ignore) {
        setUser(data);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

```tsx
// TEST với React Testing Library:
import { render, screen, waitFor, act } from "@testing-library/react";

// Mock external system
jest.mock("./api", () => ({
  fetchUser: jest.fn(),
}));

describe("UserProfile", () => {
  // Test 1: Render loading state ban đầu
  test("shows loading initially", () => {
    fetchUser.mockResolvedValue({ name: "John" });
    render(<UserProfile userId="1" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Test 2: Render data sau khi fetch xong
  test("shows user data after fetch", async () => {
    fetchUser.mockResolvedValue({ name: "John" });
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
    });
    expect(fetchUser).toHaveBeenCalledWith("1");
  });

  // Test 3: Cleanup khi userId thay đổi (race condition)
  test("ignores stale response when userId changes", async () => {
    // First fetch: slow (resolve sau 100ms)
    fetchUser.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ name: "Old User" }), 100),
        ),
    );
    // Second fetch: fast (resolve ngay)
    fetchUser.mockImplementationOnce(() =>
      Promise.resolve({ name: "New User" }),
    );

    const { rerender } = render(<UserProfile userId="1" />);

    // Thay đổi userId TRƯỚC KHI fetch 1 hoàn thành
    rerender(<UserProfile userId="2" />);

    await waitFor(() => {
      // Phải hiện "New User", KHÔNG PHẢI "Old User"
      expect(screen.getByText("New User")).toBeInTheDocument();
    });
    // "Old User" không bao giờ hiện lên
    expect(screen.queryByText("Old User")).not.toBeInTheDocument();
  });

  // Test 4: Cleanup khi unmount
  test("cleans up on unmount", () => {
    fetchUser.mockResolvedValue({ name: "John" });
    const { unmount } = render(<UserProfile userId="1" />);
    unmount(); // Unmount → cleanup chạy → ignore = true
    // Không có lỗi "Can't perform a React state update on an unmounted component"
  });
});
```

#### 🔍 Testing best practices cho Effects

```
NGUYÊN TẮC TESTING EFFECT:
1. Test BEHAVIOR, không test implementation
   ✅ "User thấy data sau khi load"
   ❌ "useEffect được gọi với deps [userId]"

2. MOCK external systems (fetch, WebSocket, timers)
   → jest.mock(), jest.useFakeTimers()

3. Test CLEANUP behavior
   → Unmount → verify no stale updates
   → Props change → verify no race conditions

4. Dùng waitFor cho async Effects
   → Effect chạy ASYNC → cần đợi DOM update

5. KHÔNG test dependency array trực tiếp
   → Là implementation detail, không phải behavior
   → Linter đã kiểm tra giúp bạn
```

---

### Step 38: flushSync Và Effect — Khi Cần State Update Đồng Bộ

> 🎯 "React batch state updates → Effect chạy SAU batch. flushSync buộc update NGAY → ảnh hưởng timing Effect."

```tsx
import { flushSync } from "react-dom";

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on("message", (msg) => {
      // ❌ Bình thường: setState batched → DOM chưa update
      // → scrollIntoView scroll tới VỊ TRÍ CŨ
      setMessages((msgs) => [...msgs, msg]);
      // Lúc này DOM CHƯA CẬP NHẬT! Message mới chưa render!
      listRef.current.lastChild?.scrollIntoView(); // ← Scroll tới message CŨ!

      // ✅ flushSync: buộc React render NGAY LẬP TỨC
      flushSync(() => {
        setMessages((msgs) => [...msgs, msg]);
      });
      // Lúc này DOM ĐÃ CẬP NHẬT! Message mới đã render!
      listRef.current.lastChild?.scrollIntoView(); // ← Scroll tới message MỚI ✅
    });
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);

  return (
    <ul ref={listRef}>
      {messages.map((m) => (
        <li key={m.id}>{m.text}</li>
      ))}
    </ul>
  );
}
```

#### 🔍 flushSync ảnh hưởng Effect thế nào?

```
BÌNH THƯỜNG (batched):
setState(1) + setState(2) + setState(3)
→ React BATCH → 1 render → DOM update → Effects chạy
→ Effect thấy state = 3 (giá trị cuối cùng)

VỚI flushSync:
flushSync(() => setState(1)); // → render NGAY → DOM update NGAY
flushSync(() => setState(2)); // → render NGAY → DOM update NGAY
setState(3);                   // → batched bình thường
→ 3 renders thay vì 1 → CHẬM HƠN!

KHI NÀO DÙNG flushSync:
├── Cần đọc DOM layout NGAY sau setState (scroll, measure)
├── Third-party library cần DOM đã update
└── Integration tests cần synchronized DOM

KHI NÀO KHÔNG DÙNG:
├── Hầu hết mọi trường hợp → batching TỐT HƠN cho performance
├── Nếu chỉ cần "sau render" → useLayoutEffect
└── Nếu chỉ cần "ổn" → để React batch bình thường
```

```
QUAN TRỌNG VỚI DEPENDENCIES:
- flushSync KHÔNG thay đổi dependency rules
- Effect code VẪN chạy sau render (không bị ảnh hưởng bởi flushSync TRONG Effect)
- flushSync chủ yếu dùng TRONG Effect callbacks (event handlers trong subscriptions)
- Dependencies VẪN phải khai báo đầy đủ
```

---

## PHẦN B: TẠI SAO LÀM NHƯ VẬY? (Deep Dive)

> 💡 Phần này giải thích CƠ CHẾ BÊN DƯỚI — tại sao React thiết kế dependency system như vậy.

### 1. Mental Model — Effect là "Synchronization Machine"

```
EFFECT KHÔNG PHẢI "lifecycle method" (componentDidMount).
EFFECT LÀ "máy đồng bộ hóa" — giữ cho component ĐỒNG BỘ với external system.

ANALOGY:
- Google Sheets cell = "=A1 + B1"
  → Khi A1 hoặc B1 thay đổi, cell TỰ ĐỘNG cập nhật
  → Dependencies = [A1, B1]

- useEffect(() => connect(roomId), [roomId])
  → Khi roomId thay đổi, Effect TỰ ĐỘNG re-sync
  → Dependencies = [roomId]

NẾU BẠN BỎ dependency:
- Google Sheets: "=A1 + B1" nhưng khai báo chỉ phụ thuộc A1
  → B1 thay đổi → cell KHÔNG cập nhật → SAI!

- useEffect: đọc roomId nhưng dependency = []
  → roomId thay đổi → Effect KHÔNG chạy lại → STALE CONNECTION!
```

### 2. Tại Sao React Không Tự So Sánh Object Content?

```
HỎI: "Sao React không deep compare objects thay vì reference compare?"
TRẢ LỜI: HIỆU NĂNG.

Deep comparison:
- Object có 100 properties → so sánh 100 lần
- Object chứa nested objects → recursive comparison
- Object chứa functions → KHÔNG THỂ deep compare (function là closure)
- Chi phí: O(n) với n = tổng số properties (có thể GBs)

Reference comparison:
- Chỉ so sánh 1 con trỏ: addr1 === addr2
- Chi phí: O(1) — LUÔN nhanh
- React chọn O(1) vì Effect dependencies được check MỖI RENDER

REACT'S PHILOSOPHY:
"Thà chạy Effect thừa (do reference khác) còn hơn
 bỏ lỡ Effect cần chạy (do deep compare sai)"
→ Trách nhiệm dev = đảm bảo reference chỉ khác khi CẦN
```

### 3. Closure — Gốc Rễ Của Mọi Dependency

```
// Closure = function "nhớ" biến từ scope tạo ra nó

function ChatRoom({ roomId }) {
  useEffect(() => {
    // CLOSURE: hàm này "nhớ" roomId tại thời điểm render
    connect(roomId);
  }, [roomId]);
}

RENDER 1 (roomId = "music"):
└── Effect closure nhớ: roomId = "music"
    → connect("music") ✅

RENDER 2 (roomId = "travel"):
└── Effect closure MỚI nhớ: roomId = "travel"
    → React thấy [roomId] thay đổi: "music" → "travel"
    → Cleanup: disconnect("music")
    → Chạy Effect mới: connect("travel") ✅

NẾU dependency = []:
RENDER 2: React KHÔNG biết roomId đổi
    → KHÔNG cleanup, KHÔNG chạy lại
    → Vẫn connect "music" dù user đang ở "travel" → BUG!
```

### 4. Tại Sao Updater Function "Xóa" Dependency?

```
// React quản lý state NGOÀI component (trong Fiber tree):
// state THỰC = { messages: [...] } ← Fiber lưu giữ

// Cách 1: Đọc từ closure
setMessages([...messages, newMsg]);
// ↑ messages LÀ BIẾN TRONG CLOSURE → Effect "nhớ" nó
// → Chỉ đến SAU khi đọc, vì là biến trong scope
// → React bắt buộc khai báo dependency

// Cách 2: Updater function
setMessages(msgs => [...msgs, newMsg]);
// ↑ msgs KHÔNG phải biến trong closure
// → React TỰ TRUYỀN giá trị hiện tại VÀO khi xử lý queue
// → Effect KHÔNG ĐỌC messages → KHÔNG CẦN dependency

BÊN DƯỚI (React internals):
1. setMessages(updaterFn) → đưa updaterFn vào QUEUE
2. Khi React xử lý queue: msgs = currentState (từ Fiber)
3. newState = updaterFn(msgs) = [...msgs, newMsg]
4. Update Fiber → re-render
→ Toàn bộ quá trình KHÔNG liên quan đến closure của Effect
```

### 5. useEffectEvent — Cơ Chế "Escape Hatch"

```
// useEffectEvent tạo một "stable reference" luôn trỏ đến hàm MỚI NHẤT
// nhưng reference KHÔNG ĐỔI giữa các render

RENDER 1: onMessage = useEffectEvent(() => { ... isMuted=false ... })
    → stable_ref trỏ đến hàm v1

RENDER 2: onMessage = useEffectEvent(() => { ... isMuted=true ... })
    → stable_ref VẪN GIỐNG → nhưng khi GỌI, chạy hàm v2 (mới nhất)

GIỐNG NHƯ:
- Số điện thoại (stable_ref) KHÔNG ĐỔI
- Nhưng người nghe (hàm bên trong) CÓ THỂ ĐỔI
- Gọi cùng số → luôn nói chuyện với NGƯỜI MỚI NHẤT

REACT BÊN DƯỚI (simplified):
function useEffectEvent(fn) {
  const ref = useRef(fn);
  ref.current = fn;  // ← Cập nhật MỖI render
  return useCallback((...args) => {
    return ref.current(...args);  // ← Luôn gọi hàm MỚI NHẤT
  }, []); // ← Reference KHÔNG BAO GIỜ thay đổi
}
```

### 6. Tại Sao "Prove It's Not a Dependency" Chứ Không "Remove It"?

```
NGUYÊN TẮC THIẾT KẾ REACT:
"Dependency array PHẢN ÁNH code, KHÔNG PHẢI ngược lại"

SAI (Top-Down):
1. "Tôi muốn dependency = []"
2. "Xóa roomId khỏi array"
3. "Suppress linter warning"
→ CODE vẫn đọc roomId → BUG!

ĐÚNG (Bottom-Up):
1. "Tại sao roomId là dependency?"          → Vì Effect ĐỌC nó
2. "Làm sao để Effect KHÔNG đọc roomId?"    → Di chuyển ra ngoài component
3. "roomId giờ là constant → linter tự bỏ" → Dependencies = [] tự nhiên

GIỐNG NHƯ MÔN TOÁN:
Bạn không thể "xóa" x khỏi phương trình y = 2x + 3
Bạn phải THAY ĐỔI phương trình: y = 5 (constant) → không còn x
```

### 7. Khi Nào Split Effects vs Khi Nào Giữ Chung?

```
SPLIT KHI:
- 2 process KHÔNG liên quan đến nhau
- Xóa 1 effect → effect kia VẪN đúng
- Dependencies KHÁC NHAU cho mỗi process

GIỐNG NHƯ:
"Đi chợ mua rau" và "Đón con đi học" = 2 việc KHÔNG liên quan
→ Schedule riêng, thời gian khác nhau

GIỮ CHUNG KHI:
- 2 process LIÊN QUAN chặt chẽ
- Cleanup của process A phải xảy ra CÙNG LÚC với process B
- Dependencies GIỐNG NHAU

GIỐNG NHƯ:
"Mở cửa sổ" và "Bật quạt" khi trời nóng = liên quan
→ Khi trời mát, ĐÓNG cửa sổ VÀ TẮT quạt cùng lúc
```

### 8. Bảng Tổng Hợp Techniques

```
┌──────────────────────┬──────────────────────────────┬─────────────────────┐
│ Vấn đề               │ Kỹ thuật                     │ Dependency bị loại  │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ State chỉ để tính    │ Updater function             │ state variable      │
│ state tiếp theo      │ setX(prev => ...)            │                     │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ Object/fn tạo mới    │ Di chuyển VÀO Effect         │ object/function     │
│ mỗi render           │ hoặc RA NGOÀI component      │                     │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ Object prop từ       │ Destructure → primitives     │ object reference    │
│ parent               │ const { a, b } = objProp     │                     │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ Đọc nhưng không      │ useEffectEvent              │ reactive value      │
│ muốn react to        │                              │ đọc bên trong event │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ Function prop từ     │ Wrap useEffectEvent hoặc     │ function reference  │
│ parent               │ gọi ngoài Effect + lấy       │                     │
│                      │ primitive                    │                     │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ Event-specific logic │ Di chuyển vào Event Handler  │ toàn bộ Effect      │
├──────────────────────┼──────────────────────────────┼─────────────────────┤
│ Unrelated logic      │ Tách thành nhiều Effects     │ cross-dependencies  │
│ trong 1 Effect       │                              │                     │
└──────────────────────┴──────────────────────────────┴─────────────────────┘
```

### 9. React Fiber — Effect Được Lưu Trữ Ở Đâu?

```
REACT FIBER = cấu trúc dữ liệu NỘI BỘ quản lý mỗi component

Fiber Node (Component instance):
┌──────────────────────────────────────────────┐
│ Fiber for <ChatRoom roomId="music" />        │
│                                              │
│ ├── memoizedState: { messages: [...] }       │  ← State hooks (linked list)
│ ├── updateQueue: [...]                       │  ← Pending state updates
│ ├── pendingProps: { roomId: "music" }        │  ← Props mới
│ ├── memoizedProps: { roomId: "music" }       │  ← Props đã render
│ ├── flags: PassiveEffect | ...               │  ← Cờ đánh dấu CÓ Effect
│ └── updateQueue.lastEffect ──┐               │
│     ┌────────────────────────┘               │
│     ▼                                        │
│   Effect #1 (circular linked list)           │
│   ├── tag: HookPassive (useEffect)           │  ← Loại Effect
│   ├── create: () => { connect(...) }         │  ← Setup function
│   ├── destroy: () => { disconnect(...) }     │  ← Cleanup function (từ lần trước)
│   ├── deps: ["music"]                        │  ← Dependency array
│   └── next → Effect #2 → ... → Effect #1    │  ← Circular list
└──────────────────────────────────────────────┘

QUAN TRỌNG:
- deps được LƯU TRÊN Fiber → React SO SÁNH deps cũ vs mới MỖI render
- create function LÀ CLOSURE của render hiện tại → "nhớ" values lúc render
- destroy function LÀ CLOSURE của render TRƯỚC → cleanup đúng context cũ
```

#### 🔍 Quá trình React check dependencies

```
MỖI RENDER, React thực hiện:

1. Component function chạy → TẠO Effect object MỚI:
   newEffect = { create: () => {...}, deps: [newValue] }

2. React so sánh deps CŨ (trên Fiber) vs deps MỚI:
   for (i = 0; i < deps.length; i++) {
     if (!Object.is(prevDeps[i], nextDeps[i])) {
       // CÓ dependency thay đổi → ĐÁNH DẤU cần chạy
       effect.tag |= HookHasEffect;
       break;
     }
   }

3. NẾU có HookHasEffect flag:
   → Gọi destroy (cleanup) từ Effect CŨ
   → Gọi create (setup) từ Effect MỚI
   → Lưu return value của create vào destroy cho lần sau

4. NẾU KHÔNG có HookHasEffect:
   → SKIP → không chạy gì → giữ nguyên Effect cũ

PSEUDOCODE REACT SOURCE (simplified):
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return false; // Lần đầu → luôn chạy
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) continue;
    return false; // Khác → cần chạy Effect
  }
  return true; // Giống hết → skip
}
```

---

### 10. Render Phase vs Commit Phase — Effect Timing Chính Xác

> 🎯 "Effect KHÔNG chạy trong render phase. Effect chạy SAU commit phase — hiểu timing để tránh bug."

```
REACT WORKFLOW (chi tiết):

━━━━ RENDER PHASE (Pure, có thể bị hủy) ━━━━
│
│ 1. React gọi component function: ChatRoom({ roomId })
│ 2. Component trả về JSX → React tạo Virtual DOM mới
│ 3. React DIFF Virtual DOM cũ vs mới → tìm changes
│ 4. Effect objects được TẠO và LƯU (nhưng CHƯA CHẠY)
│ 5. Dependencies được SO SÁNH → đánh dấu Effects cần chạy
│
│ ⚠️ QUAN TRỌNG: Render phase CÓ THỂ bị hủy (concurrent mode)
│ → Không có side effects ở đây!
│ → Đó là lý do component phải PURE
│
━━━━ COMMIT PHASE (Không thể hủy, synchronous) ━━━━
│
│ 6. React ÁP DỤNG DOM changes (thêm/sửa/xóa DOM nodes)
│ 7. React cập nhật refs (ref.current = DOM element)
│ 8. useLayoutEffect CLEANUP chạy (Effects có deps thay đổi)
│ 9. useLayoutEffect SETUP chạy
│ 10. Browser PAINTS → user nhìn thấy UI mới
│ 11. useEffect CLEANUP chạy (asynchronous, scheduled)
│ 12. useEffect SETUP chạy (asynchronous, scheduled)
│
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timeline:
Render → DOM Update → Refs → useLayoutEffect → PAINT → useEffect
                                                  ↑
                                           User thấy UI ở đây
```

```
TẠI SAO EFFECT CHẠY SAU PAINT?

1. KHÔNG BLOCK UI: Effect chạy async → user thấy UI update ngay
   → fetch data trong Effect → UI render loading state TRƯỚC
   → data về → re-render với data

2. DOM ĐÃ SẴN SÀNG: Effect có thể đọc DOM dimensions
   → getBoundingClientRect() hoạt động đúng

3. BROWSER OPTIMIZED: Cho browser paint trước → cảm giác nhanh hơn
   → User thấy response ngay → perceived performance tốt

4. BATCHING FRIENDLY: Nhiều Effects chạy sau paint → React batch cleanup
   → Tất cả cleanups chạy trước → tất cả setups chạy sau
   → Tránh trạng thái intermediate
```

---

### 11. Batching — Tại Sao Nhiều setState Chỉ Gây 1 Re-render?

> 🎯 "React 18+ batch TẤT CẢ state updates → 1 render → Effects chạy 1 lần với state CUỐI CÙNG."

```tsx
function Form() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);

  useEffect(() => {
    console.log("Effect:", name, age);
  }, [name, age]);

  function handleSubmit() {
    setName("John"); // ← KHÔNG render ngay
    setAge(25); // ← KHÔNG render ngay
    // → React BATCH → 1 render → name="John", age=25
    // → Effect chạy 1 lần: "Effect: John 25"
  }
}
```

```
TRƯỚC React 18 (Legacy):
- Batch CHỈ trong React event handlers (onClick, onChange)
- setTimeout, fetch.then, await SAU → KHÔNG batch → nhiều renders

SAU React 18 (Automatic Batching):
- Batch EVERYWHERE: event handlers, setTimeout, promises, native events
- TẤT CẢ setState đều gom lại → 1 render

Effect + Batching:
┌──────────────────────────────────────────────┐
│ setName('John')  → thêm update vào QUEUE     │
│ setAge(25)       → thêm update vào QUEUE     │
│ setCity('HCM')   → thêm update vào QUEUE     │
│                                              │
│ → End of event handler                       │
│ → React xử lý QUEUE: name=John, age=25,     │
│   city=HCM                                   │
│ → 1 render → DOM update → 1 Effect run       │
│ → Effect thấy: name=John, age=25, city=HCM  │
└──────────────────────────────────────────────┘

TẠI SAO QUAN TRỌNG CHO DEPENDENCIES:
- Nếu deps là [name, age] → Effect chạy 1 lần (không phải 2)
- Bạn KHÔNG CẦN lo setState nhiều lần → Effect chạy nhiều lần
- React ĐẢM BẢO Effect thấy state NHẤT QUÁN (consistent state)
```

---

### 12. Concurrent Mode — Effect Trong Thế Giới Concurrent

> 🎯 "Concurrent mode cho phép React DỪNG render giữa chừng — hiểu để biết tại sao purity quan trọng."

```
BLOCKING (React 17):
Render bắt đầu ────────────────────────► Render xong → Commit → Effect
                 KHÔNG THỂ dừng giữa chừng

CONCURRENT (React 18+):
Render bắt đầu ──── DỪNG ────── TIẾP TỤC ──── DỪNG ──── Commit → Effect
                      ↑              ↑
              User interaction   Higher priority
              (ưu tiên hơn)      work intervenes

┌─────────────────────────────────────────────────────┐
│ CONSEQUENCES CHO EFFECTS:                           │
│                                                     │
│ 1. Render CÓ THỂ bị HỦY → side effects KHÔNG OK    │
│    → Đó là lý do KHÔNG fetch trong render body      │
│    → Side effects PHẢI ở Effect (sau commit)         │
│                                                     │
│ 2. strict Mode CHẠY 2 LẦN → test idempotency        │
│    → Effect setup → cleanup → setup lại              │
│    → Nếu cleanup đúng → kết quả như chạy 1 lần      │
│                                                     │
│ 3. useSyncExternalStore KHÔNG bị tearing             │
│    → Effect-based subscription CÓ THỂ bị tearing     │
│    → vì render có thể đọc stale value giữa chừng    │
└─────────────────────────────────────────────────────┘
```

```
TEARING là gì?

Component A render → đọc store.value = 1
→ React DỪNG (concurrent) → user update store → store.value = 2
→ Component B render → đọc store.value = 2
→ Commit: A shows 1, B shows 2 → INCONSISTENT! = TEARING

useSyncExternalStore GIẢI QUYẾT:
→ React kiểm tra snapshot TRƯỚC commit
→ Nếu snapshot thay đổi → re-render lại tất cả
→ Đảm bảo consistency → KHÔNG tearing
```

---

### 13. Tại Sao useRef KHÔNG Phải Dependency?

> 🎯 "useRef trả về object CÓ reference STABLE — React đảm bảo CÙNG object qua tất cả renders."

```
BÊN DƯỚI REACT (simplified):

function useRef(initialValue) {
  // Lần đầu: tạo object { current: initialValue }
  // Lần sau: TRẢ VỀ CÙNG OBJECT đã tạo
  const hook = mountOrUpdateHook();
  if (isFirstRender) {
    hook.memoizedState = { current: initialValue };
  }
  return hook.memoizedState; // ← CÙNG reference EVERY render
}

RENDER 1: ref = { current: 0 }     ← Tạo mới
RENDER 2: ref = { current: 5 }     ← CÙNG object, .current thay đổi
RENDER 3: ref = { current: 10 }    ← CÙNG object, .current thay đổi

Object.is(ref_render1, ref_render2) → TRUE (cùng reference)
→ Nếu ref trong dependency → KHÔNG BAO GIỜ trigger Effect
→ Nên React và linter CẢ HAI đều nói: "ref không cần khai báo"
```

```
TẠI SAO .current THAY ĐỔI KHÔNG TRIGGER RE-RENDER:

useState: React BIẾT khi state thay đổi → schedule re-render
  setCount(5) → React: "Có update!" → re-render

useRef: React KHÔNG BIẾT khi .current thay đổi
  ref.current = 5 → React: "???" → KHÔNG re-render
  → Mutation TRỰC TIẾP → không đi qua React scheduler
  → Không re-render → không check deps → Effect KHÔNG chạy

ĐÂY LÀ FEATURE, KHÔNG PHẢI BUG:
→ Ref dùng cho mutable values KHÔNG ảnh hưởng UI
→ Ví dụ: timer IDs, DOM refs, latest callback ref
→ Thay đổi ref.current = "THẦM LẶNG" — React không biết
```

---

### 14. Tại Sao setState và dispatch Không Cần Khai Báo Dependency?

> 🎯 "React ĐẢM BẢO identity stability — các functions này KHÔNG BAO GIỜ thay đổi reference."

```
REACT SOURCE (simplified):

// useState
function mountState(initialState) {
  const dispatch = dispatchSetState.bind(null, fiber, queue);
  // dispatch ĐƯỢC TẠO 1 LẦN, bind vào fiber
  // → CÙNG reference qua TẤT CẢ renders
  return [state, dispatch];
}

function updateState() {
  // Các render sau → TRẢ VỀ CÙNG dispatch đã tạo
  return [newState, existingDispatch]; // ← KHÔNG tạo mới!
}

// useReducer
function mountReducer(reducer, initialState) {
  const dispatch = dispatchReducerAction.bind(null, fiber, queue);
  return [state, dispatch];
}

function updateReducer() {
  return [newState, existingDispatch]; // ← CÙNG reference
}
```

```
DANH SÁCH "STABLE IDENTITIES" (không cần khai báo dependency):

✅ setState từ useState    → stable (bind to fiber)
✅ dispatch từ useReducer  → stable (bind to fiber)
✅ ref từ useRef           → stable (memoized on hook)
✅ stable context values   → nếu Provider KHÔNG tạo mới

❌ KHÔNG stable:
❌ Object/array tạo trong render body
❌ Function tạo trong render body
❌ Props từ parent (trừ khi parent memo/useCallback)
❌ Context value (nếu Provider tạo object mới mỗi render)
❌ useCallback return (dù stable khi deps không đổi, VẪN CẦN khai báo)

LINTER BIẾT stable identities:
→ Nếu bạn khai báo [setState] → linter nói "unnecessary dependency"
→ Vì linter BIẾT setState KHÔNG BAO GIỜ thay đổi
→ An toàn để bỏ ra khỏi deps
```

---

### 15. Capture Semantics — Mỗi Render Là "Snapshot" Riêng

> 🎯 "React render KHÔNG phải 'cập nhật' — mỗi render là một bức ảnh ĐỘC LẬP với props/state riêng."

```tsx
function Chat({ roomId }) {
  const [message, setMessage] = useState("");

  function handleSend() {
    // handleSend "capture" message TẠI RENDER NÀY
    setTimeout(() => {
      alert("You said: " + message); // ← message lúc BẤM nút, không phải lúc alert
    }, 3000);
  }

  return (
    <>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </>
  );
}
```

```
RENDER 1: message = "hello"
├── handleSend captures message = "hello"
├── User clicks Send → setTimeout registered with "hello"
├── User types "world" → setState → triggers RENDER 2

RENDER 2: message = "world"
├── handleSend captures message = "world" (CLOSURE MỚI)
├── setTimeout từ RENDER 1 vẫn dùng "hello"

3 giây sau: alert("You said: hello") ← ĐÚNG! Capture semantics!
                                        User BẤM lúc message = "hello"
                                        Dù bây giờ message = "world"

EFFECT CŨNG CAPTURE:
useEffect(() => {
  console.log(message); // ← message TẠI RENDER NÀY
}, [message]);

Render 1: Effect captures message = "hello" → log "hello"
Render 2: Effect captures message = "world" → log "world"
→ Mỗi Effect "thấy" state/props CỦA render tạo ra nó
→ Dependency array PHẢN ÁNH: "render nào tạo Effect khác thì cần re-run"
```

```
TẠI SAO CAPTURE SEMANTICS QUAN TRỌNG CHO DEPENDENCIES:

1. Mỗi render = 1 closure = 1 set of values
2. Effect lúc nào cũng "thấy" values CỦA render tạo ra nó
3. Dependency array = "giá trị nào trong closure CẦN THEO DÕI"
4. Nếu thiếu dependency → Effect dùng closure CŨ → stale value
5. Nếu thừa dependency → Effect re-run không cần thiết → nhưng không sai

→ Thiếu = BUG (stale values)
→ Thừa = PERFORMANCE issue (nhưng không sai về mặt logic)
→ Đúng = OPTIMAL (chạy đúng khi cần)
```

---

### 16. Subscription vs Synchronization — Hai Mô Hình Effect

> 🎯 "Hiểu rõ 2 patterns chính của Effect → biết cách quản lý dependencies cho từng loại."

```
PATTERN 1: SYNCHRONIZATION (đồng bộ hóa)
"Giữ cho X luôn đồng bộ với Y"

useEffect(() => {
  document.title = `${count} messages`;
}, [count]);

Đặc điểm:
├── Effect = "đặt" giá trị (set, update, write)
├── Thường KHÔNG cần cleanup (overwrite giá trị mới)
├── Dependencies = "đồng bộ VỚI CÁI GÌ?" → [count]
├── Idempotent: chạy lại → kết quả giống nhau
└── Ví dụ: document.title, className, setAttribute

PATTERN 2: SUBSCRIPTION (đăng ký/hủy đăng ký)
"Lắng nghe sự kiện từ nguồn ngoài"

useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]);

Đặc điểm:
├── Effect = "connect" (setup) + "disconnect" (cleanup)
├── LUÔN CẦN cleanup (tránh leak)
├── Dependencies = "subscribe ĐẾN CÁI GÌ?" → [roomId]
├── Cleanup PHẢI mirror setup (disconnect what was connected)
└── Ví dụ: WebSocket, EventListener, Intersection Observer
```

```
DEPENDENCIES KHÁC NHAU CHO MỖI PATTERN:

SYNCHRONIZATION:
─ deps thay đổi → RE-SYNC (set giá trị mới)
─ KHÔNG cần cleanup → overwrite tự động
─ Ví dụ: [count] → document.title = `${count} messages`
─ Thiếu dep → title NOT synced → stale UI

SUBSCRIPTION:
─ deps thay đổi → UNSUBSCRIBE cũ → SUBSCRIBE mới
─ BẮT BUỘC cleanup → tránh duplicate connections
─ Ví dụ: [roomId] → disconnect old room → connect new room
─ Thiếu dep → connected to WRONG room → critical bug
─ Thiếu cleanup → MULTIPLE connections → memory leak

=> Subscription BUG nghiêm trọng hơn Synchronization BUG
→ Luôn viết cleanup cho subscriptions!
```

---

### 17. Tại Sao Không Có Dependencies = Chạy Mỗi Render?

> 🎯 "Không có dependency array ≠ 'không dependencies'. Nó nghĩa là 'depend on EVERYTHING'."

```
// Ba cách viết Effect và MEANING:

useEffect(() => { ... });           // Không có array
// MEANING: "Effect này PHẢN ỨNG VỚI MỌI THỨ"
// = "Chạy lại khi BẤT KỲ reactive value nào thay đổi"
// = "Chạy sau MỖI render"
// REACT'S LOGIC: Nếu không biết deps → assume MỌI THỨ có thể ảnh hưởng
// → An toàn nhất = chạy lại mỗi lần

useEffect(() => { ... }, []);       // Array rỗng
// MEANING: "Effect này KHÔNG PHẢN ỨNG với gì"
// = "Chỉ cần chạy 1 lần khi mount"
// REACT'S LOGIC: Deps = [] → Object.is compare mỗi render → always equal
// → Không bao giờ trigger re-run

useEffect(() => { ... }, [roomId]); // Array có phần tử
// MEANING: "Effect này PHẢN ỨNG với roomId"
// = "Chạy lại khi roomId thay đổi"
// REACT'S LOGIC: So sánh roomId cũ vs mới → chạy nếu khác
```

```
TẠI SAO REACT THIẾT KẾ NHƯ VẬY:

SAFETY FIRST:
- Nếu React default là [] → DEV quên khai báo dep → stale bugs ẢN
- Nếu React default là "mỗi render" → DEV thấy Effect chạy nhiều → FIX
→ React CHỌN "chạy nhiều" (dễ phát hiện) hơn "chạy thiếu" (ẩn bug)

PROGRESSIVE DISCLOSURE:
1. Newbie: useEffect(() => fetch(...)); ← Chạy mỗi render → thấy vấn đề
2. Newbie đọc docs → thêm [userId] → chạy đúng
3. Advanced: tối ưu deps bằng techniques (updater, useEffectEvent, etc.)

→ Từ "đúng nhưng chậm" đến "đúng VÀ nhanh"
→ KHÔNG BAO GIỜ từ "sai" (suppress linter)
```

---

### 18. Strict Equality — Tại Sao Object.is Thay Vì === ?

> 🎯 "React dùng Object.is thay vì === vì xử lý edge cases ĐÚNG HƠN."

```
Object.is vs === — KHÁC BIỆT CHỈ Ở 2 EDGE CASES:

CASE 1: NaN
NaN === NaN  → false  (IEEE 754 standard, historically)
Object.is(NaN, NaN) → true ✅

VỚI EFFECT:
const [value, setValue] = useState(NaN);
// Nếu React dùng ===:
// NaN !== NaN → React NGHĨ value đổi → Effect chạy MỖI render! → BUG
// Vì Object.is:
// Object.is(NaN, NaN) → true → React BIẾT value KHÔNG đổi → skip ✅

CASE 2: +0 và -0
+0 === -0    → true   (=== coi như giống nhau)
Object.is(+0, -0) → false ✅

VỚI EFFECT:
// Hiếm khi gặp, nhưng trong math/graphics:
setValue(-0); // ← Object.is phát hiện khác +0 → Effect chạy ✅

MỌI THỨ KHÁC: Object.is GIỐNG ===
Object.is(1, 1)         → true  (giống ===)
Object.is('a', 'a')     → true  (giống ===)
Object.is({}, {})       → false (giống ===, so sánh reference)
Object.is(null, null)   → true  (giống ===)
```

```
TẠI SAO OBJECT.IS THAY VÌ TẠO CUSTOM COMPARISON?

1. PREDICTABLE: Dev BIẾT chính xác khi nào deps "thay đổi"
   → Primitives: value equality
   → Objects/Functions: reference equality

2. FAST: O(1) cho MỖI dependency element
   → Không recursive → không deep compare → luôn nhanh

3. CONSISTENT: Cùng algorithm cho TẤT CẢ comparisons trong React
   → useState bailout dùng Object.is
   → useMemo deps dùng Object.is
   → useEffect deps dùng Object.is
   → useCallback deps dùng Object.is
   → Tất cả GIỐNG NHAU → dễ hiểu, dễ debug

4. SAFE DEFAULT: Object.is KHÔNG BAO GIỜ cho false positive
   → Có thể cho false negative (object mới cùng content → "khác")
   → Nhưng KHÔNG BAO GIỜ false positive (object cũ → "giống")
   → false negative = chạy thừa (safe)
   → false positive = bỏ lỡ (dangerous)
```

---

### 19. Component Purity — Tại Sao Effect Là Nơi Duy Nhất Cho Side Effects?

> 🎯 "Component PHẢI pure. Side effects PHẢI ở Effect. Đây là CONTRACT cơ bản của React."

```
PURE FUNCTION = cùng input → cùng output, KHÔNG side effects

// ✅ PURE component:
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
  // Cùng name → cùng output → PURE
}

// ❌ IMPURE component:
function Greeting({ name }) {
  document.title = name; // ← SIDE EFFECT trong render!
  fetch('/api/log');      // ← SIDE EFFECT trong render!
  return <h1>Hello, {name}</h1>;
}
```

```
TẠI SAO REACT CẦN PURITY:

1. CONCURRENT RENDERING:
   React có thể DỪNG render giữa chừng → render lại
   Nếu render có side effect → side effect chạy 2 lần → BUG!

   // fetch('/api/log') trong render body:
   // Render bắt đầu → fetch → React dừng → render lại → fetch AGAIN!
   // → 2 requests thay vì 1 → data corruption?

2. STRICT MODE TESTING:
   React gọi component 2 lần → phát hiện impurity
   // document.title = name; → set 2 lần → OK (idempotent)
   // counter++; → 2 lần → WRONG (not idempotent)

3. MEMOIZATION:
   React.memo, useMemo → skip render nếu input không đổi
   Nếu component impure → skip render → miss side effects → BUG

4. SERVER RENDERING:
   Component chạy trên SERVER → document.title KHÔNG tồn tại
   → Error! Side effects phải ở Effect (client-only)

KẾT LUẬN:
Side effects ĐẶT TRONG Effect → React BIẾT và KIỂM SOÁT:
- KHI NÀO chạy (sau commit)
- BAO NHIÊU LẦN chạy (dựa vào deps)
- KHI NÀO cleanup (trước re-run hoặc unmount)
- CÓ CHẠY TRÊN SERVER KHÔNG (useEffect = client only)
```

---

### 20. Tổng Hợp — Mental Model Hoàn Chỉnh

> 🎯 "Gom tất cả kiến thức Part B thành 1 bức tranh TOÀN CẢNH."

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              EFFECT DEPENDENCIES — WHY IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    ┌─────────────┐
                    │  Component  │
                    │   (PURE)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌─────────┐  ┌─────────┐
         │ Props  │  │  State  │  │ Context │
         └────┬───┘  └────┬────┘  └────┬────┘
              │           │            │
              └─────┬─────┘────────────┘
                    │
              REACTIVE VALUES
              (có thể thay đổi qua renders)
                    │
                    ▼
         ┌──────────────────┐
         │  Dependency      │
         │  Array           │  ← Object.is comparison
         │  [a, b, c]       │
         └────────┬─────────┘
                  │
         ┌────────┴─────────┐
         │                  │
    deps CHANGED       deps SAME
         │                  │
         ▼                  ▼
    ┌─────────┐       ┌─────────┐
    │ CLEANUP │       │  SKIP   │
    │ (old)   │       │ Effect  │
    └────┬────┘       └─────────┘
         │
         ▼
    ┌─────────┐
    │ SETUP   │
    │ (new)   │
    └─────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
CÁC NGUYÊN TẮC CỐT LÕI:

1. PURITY:    Component = pure function, side effects → Effect
2. CLOSURES:  Mỗi render = 1 closure = 1 snapshot of values
3. CAPTURE:   Effect "nhìn thấy" values TẠI render tạo ra nó
4. DEPS:      Dependency array = "khi nào tạo closure MỚI?"
5. COMPARE:   Object.is = O(1), predictable, consistent
6. FIBER:     Effect objects lưu trên Fiber, so sánh mỗi render
7. TIMING:    Render → Commit → Layout Effects → Paint → Effects
8. BATCHING:  Nhiều setState = 1 render = 1 Effect run
9. STABLE:    setState, dispatch, ref = không cần deps
10. SAFETY:   React prefer "chạy thừa" hơn "bỏ lỡ"

CÁC KỸ THUẬT GIẢM DEPENDENCIES:
- Updater fn:     setX(prev => ...) → không đọc state
- useEffectEvent: đọc nhưng không phản ứng
- Destructure:    object → primitives
- Move inside:    tạo object/fn TRONG Effect
- Move outside:   tạo object/fn NGOÀI component
- useReducer:     dispatch stable, reducer tự đọc state
- useMemo:        giữ reference ổn định
- Split Effects:  tách logic không liên quan
- key prop:       thay Effect reset bằng remount

CÁC THAY THẾ EFFECT:
- Computed values → tính trong render body
- Data transform → render body hoặc useMemo
- User events → Event Handler
- External store → useSyncExternalStore
- Data fetching → React Query / SWR
```

---

### 21. Paradigm Shift — Từ Lifecycle Methods Sang Effects

> 🎯 "Class components nghĩ theo THỜI GIAN (mount/update/unmount). Effects nghĩ theo ĐỒNG BỘ HÓA."

```
CLASS COMPONENTS (cũ):
"Component mount → làm việc A"
"Component update → làm việc B"
"Component unmount → dọn dẹp"

componentDidMount() {
  // Kết nối lần đầu
  this.connection = createConnection(this.props.roomId);
  this.connection.connect();
}

componentDidUpdate(prevProps) {
  // Nếu roomId đổi → ngắt kết nối cũ, kết nối mới
  if (prevProps.roomId !== this.props.roomId) {
    this.connection.disconnect();
    this.connection = createConnection(this.props.roomId);
    this.connection.connect();
  }
}

componentDidUnmount() {
  // Dọn dẹp
  this.connection.disconnect();
}
// → 3 lifecycle methods cho 1 CONCERN
// → Logic phân tán → dễ miss edge cases
// → Phải so sánh prevProps MANUALLY
```

```
EFFECTS (mới):
"Đồng bộ roomId → kết nối"
"roomId thay đổi → đồng bộ lại"

useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]);
// → 1 Effect cho 1 CONCERN
// → Logic TẬP TRUNG → dễ đọc, dễ maintain
// → React SO SÁNH deps TỰ ĐỘNG
// → Cleanup TỰ ĐỘNG chạy trước re-sync
```

```
SO SÁNH TƯ DUY:

LIFECYCLE (What HAPPENED?):
├── "Component vừa MOUNT" → componentDidMount
├── "Component vừa UPDATE" → componentDidUpdate
├── "Component sắp UNMOUNT" → componentWillUnmount
└── TƯ DUY: "Khi NÀO?" → time-based

EFFECT (What to SYNCHRONIZE?):
├── "Đồng bộ với roomId" → useEffect(..., [roomId])
├── roomId đổi → cleanup cũ + sync mới (TỰ ĐỘNG)
├── Unmount → cleanup (TỰ ĐỘNG)
└── TƯ DUY: "Đồng bộ VỚI GÌ?" → data-based

TẠI SAO EFFECT TỐT HƠN:
1. COLOCATION: setup + cleanup ở CÙNG CHỖ
2. AUTOMATIC: React tự so sánh deps, tự cleanup
3. COMPOSABLE: nhiều Effects ĐỘC LẬP, không chia sẻ lifecycle
4. CONCURRENT-SAFE: không dựa vào timing, chỉ dựa vào data
```

---

### 22. Dependency Linter — Hoạt Động Thế Nào Bên Dưới?

> 🎯 "eslint-plugin-react-hooks phân tích AST để tìm reactive values mà Effect đọc."

```
LINTER KHÔNG "CHẠY" CODE — nó PHÂN TÍCH CẤU TRÚC CODE (Static Analysis)

BƯỚC 1: Parse code thành AST (Abstract Syntax Tree)
useEffect(() => {
  fetch(`/api/${userId}`);
}, []);

AST:
CallExpression (useEffect)
├── ArrowFunction (callback)
│   └── CallExpression (fetch)
│       └── TemplateLiteral
│           └── Identifier: userId  ← PHÁT HIỆN đọc biến "userId"
└── ArrayExpression (deps)
    └── (empty)                      ← KHÔNG CÓ userId trong deps

BƯỚC 2: Xác định userId là REACTIVE hay STATIC
├── userId là parameter của component → REACTIVE (prop)
├── userId khai báo bên ngoài component → STATIC (ok bỏ qua)
├── userId là useState state → REACTIVE
├── userId là useRef return → STABLE (ok bỏ qua)
├── userId là setState function → STABLE (ok bỏ qua)

BƯỚC 3: So sánh reactive values ĐỌC vs deps KHAI BÁO
├── Đọc: [userId]
├── Khai báo: []
├── THIẾU: userId → WARNING! ⚠️
```

```
LINTER BIẾT "STABLE" NHƯ THẾ NÀO?

React hooks mà linter BIẾT là stable:
├── useState:      [value, setValue] → setValue là STABLE
├── useReducer:    [state, dispatch] → dispatch là STABLE
├── useRef:        ref → STABLE (cùng object)
├── useCallback:   fn → KHÔNG stable (phụ thuộc deps của nó)
├── useMemo:       value → KHÔNG stable (phụ thuộc deps)
├── useContext:    value → KHÔNG stable (context có thể đổi)

LINTER CÓ THỂ SAI KHÔNG?

CÓ — trong một số edge cases:
1. Custom hook trả về stable value nhưng linter không biết
   → Linter cảnh báo thừa → suppress CÓ LÝ DO

2. Function defined OUTSIDE component nhưng imported
   → Linter có thể không biết là stable

3. Conditional reads:
   if (condition) { read(value); }
   → Linter thấy "đọc value" → thêm vào deps
   → Dù condition luôn false → vẫn đúng (safe)

NGUYÊN TẮC: Linter sai → thừa (safe). KHÔNG BAO GIỜ sai → thiếu.
```

---

### 23. useCallback KHÔNG Giải Quyết Vấn Đề Gốc

> 🎯 "useCallback ổn định reference nhưng VẪN là dependency — nó DỊCH CHUYỂN vấn đề, không loại bỏ."

```tsx
// VẤN ĐỀ BAN ĐẦU: function tạo mới mỗi render
function ChatRoom({ roomId, theme }) {
  const connect = () => {
    createConnection(roomId, theme); // Đọc roomId + theme
  };

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect]); // ← connect mới mỗi render → Effect chạy mỗi render
}

// "FIX" VỚI useCallback:
function ChatRoom({ roomId, theme }) {
  const connect = useCallback(() => {
    createConnection(roomId, theme);
  }, [roomId, theme]); // ← useCallback deps = roomId, theme

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect]); // ← connect thay đổi khi roomId/theme đổi
  // → Effect VẪN chạy khi roomId hoặc theme đổi!
  // → useCallback chỉ DỊCH CHUYỂN deps từ Effect → useCallback
}
```

```
PHÂN TÍCH:

KHÔNG CÓ useCallback:
Effect deps: [connect] → connect mới MỖI render → Effect chạy MỖI render ❌

VỚI useCallback:
useCallback deps: [roomId, theme]
Effect deps: [connect] → connect mới khi roomId/theme đổi
→ Effect chạy khi roomId/theme đổi
→ GIỐNG NHƯ viết: deps = [roomId, theme] trực tiếp!

useCallback KHÔNG GIẢM dependencies:
useCallback([roomId, theme]) + Effect([connect])
= Effect([roomId, theme]) ← CÙNG kết quả!

useCallback CHỈ HỮU ÍCH KHI:
1. Truyền function cho CHILD component có React.memo
   → Tránh child re-render không cần thiết
2. Function dùng ở NHIỀU NƠI (nhiều Effects, nhiều event handlers)
   → Chia sẻ reference ổn định

useCallback KHÔNG HỮU ÍCH KHI:
1. Function CHỈ dùng trong 1 Effect → di chuyển VÀO Effect
2. Muốn "giảm deps" → deps chỉ DỊCH CHUYỂN, không mất
```

```
FIX ĐÚNG — di chuyển VÀO Effect:

function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    // connect logic TRONG Effect → không cần dependency function
    const conn = createConnection(roomId, theme);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId, theme]); // ← Dependencies rõ ràng, không wrapper
}

// HOẶC nếu theme không cần re-sync:
function ChatRoom({ roomId, theme }) {
  const onConnect = useEffectEvent(() => {
    logTheme(theme); // Đọc theme mới nhất mà không re-sync
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    onConnect();
    return () => conn.disconnect();
  }, [roomId]); // ← CHỈ roomId
}
```

---

### 24. React Compiler (React Forget) — Tương Lai Của Dependencies

> 🎯 "React Compiler tự động memoize → object/function references ổn định → giảm dependency issues."

```
HIỆN TẠI (2024-2025):
Developer PHẢI tự quản lý:
- useMemo cho expensive computations
- useCallback cho stable function references
- Destructure objects thành primitives
- Di chuyển objects vào/ra Effect

REACT COMPILER (đang phát triển):
Compiler TỰ ĐỘNG:
- Memoize component output (như React.memo)
- Memoize values (như useMemo)
- Memoize callbacks (như useCallback)
- TẤT CẢ tự động → dev KHÔNG CẦN viết useMemo/useCallback
```

```tsx
// TRƯỚC (manual memoization):
function UserProfile({ userId }) {
  const options = useMemo(
    () => ({
      userId,
      format: "json",
    }),
    [userId],
  ); // Dev phải nhớ useMemo

  const fetchData = useCallback(() => {
    return fetch("/api", { body: JSON.stringify(options) });
  }, [options]); // Dev phải nhớ useCallback

  useEffect(() => {
    fetchData().then(/* ... */);
  }, [fetchData]); // Chain of memoization
}

// SAU (React Compiler tự động):
function UserProfile({ userId }) {
  // Compiler TỰ PHÂN TÍCH code:
  // → options chỉ phụ thuộc userId → auto-memoize
  // → fetchData chỉ phụ thuộc options → auto-memoize
  // → Effect chỉ re-run khi userId thật sự đổi

  const options = { userId, format: "json" }; // ← Viết bình thường

  const fetchData = () => {
    return fetch("/api", { body: JSON.stringify(options) });
  }; // ← Viết bình thường

  useEffect(() => {
    fetchData().then(/* ... */);
  }, [fetchData]); // ← Compiler đảm bảo fetchData stable khi userId không đổi
}
```

```
REACT COMPILER THAY ĐỔI GÌ CHO DEPENDENCIES?

TRƯỚC Compiler:
├── Object trong render body → reference MỚI → Effect chạy thừa
├── Function trong render body → reference MỚI → Effect chạy thừa
├── Dev PHẢI dùng useMemo/useCallback → boilerplate nhiều
└── Quên memo → bug performance

SAU Compiler:
├── Object tự auto-memo → reference STABLE
├── Function tự auto-memo → reference STABLE
├── KHÔNG CẦN useMemo/useCallback manual
└── Dependency array VẪN CẦN → Compiler KHÔNG xóa deps

⚠️ QUAN TRỌNG:
- React Compiler KHÔNG thay đổi dependency RULES
- Dependency array VẪN phải đầy đủ
- Compiler chỉ ĐẢM BẢO references stable → deps KHÔNG trigger thừa
- Tư duy về dependencies VẪN GIỐNG NHAU → kiến thức VẪN CÓ GIÁ TRỊ
```

---

### 25. Server Components — Tại Sao Effect Không Chạy Trên Server?

> 🎯 "Server Components KHÔNG có Effects. Chỉ Client Components mới có — hiểu boundary này quan trọng."

```
REACT SERVER COMPONENTS (RSC):

┌──────────────────────────────────────────┐
│              SERVER                       │
│                                          │
│  Server Component:                       │
│  - Chạy trên server (Node.js)            │
│  - KHÔNG CÓ state (useState ❌)          │
│  - KHÔNG CÓ effects (useEffect ❌)       │
│  - KHÔNG CÓ event handlers              │
│  - CÓ THỂ async (fetch trực tiếp)       │
│  - CÓ THỂ import server-only code       │
│                                          │
│  async function UserPage({ userId }) {   │
│    const user = await db.query(userId);  │
│    return <UserProfile user={user} />;   │
│  }                                       │
│  // KHÔNG CẦN Effect cho data fetching!  │
│  // KHÔNG CẦN loading state!             │
│  // KHÔNG CẦN dependency array!          │
└──────────────────┬───────────────────────┘
                   │ Serialized JSX
                   ▼
┌──────────────────────────────────────────┐
│              CLIENT                       │
│                                          │
│  Client Component ('use client'):        │
│  - Chạy trên browser                    │
│  - CÓ state ✅                           │
│  - CÓ effects ✅                         │
│  - CÓ event handlers ✅                  │
│  - Dependencies RULES áp dụng ĐẦY ĐỦ   │
│                                          │
│  'use client'                            │
│  function LiveChat({ roomId }) {         │
│    useEffect(() => {                     │
│      // WebSocket = client-only          │
│      const conn = connect(roomId);       │
│      return () => conn.close();          │
│    }, [roomId]); // ← Deps vẫn cần!     │
│  }                                       │
└──────────────────────────────────────────┘
```

```
TẠI SAO EFFECT KHÔNG CÓ TRÊN SERVER:

1. Effect = SIDE EFFECT sau render → Server KHÔNG "render" liên tục
   Server render 1 lần → gửi HTML → xong
   → Không có re-render → không cần synchronization

2. Effect thường dùng BROWSER APIs:
   → window, document, WebSocket, localStorage
   → Server KHÔNG CÓ các APIs này

3. Effect = SUBSCRIPTION + CLEANUP lifecycle
   → Server không có mount/unmount
   → Không có lifecycle → không có Effect

BÀI HỌC CHO DEPENDENCIES:
- Server Components LOẠI BỎ nhiều Effects (data fetching → server)
- Client Components GIỮ Effects cho browser-specific tasks
- Dependency knowledge VẪN QUAN TRỌNG cho Client Components
- Tương lai: ÍT Effects hơn → nhưng Effects còn lại PHỨC TẠP hơn
```

---

### 26. Signals vs Effects — Cách Các Framework Khác Giải Quyết

> 🎯 "React dùng dependency arrays. Vue/Svelte/Solid dùng signals. Hiểu sự khác biệt."

```
REACT (Pull-based, Explicit):
const [count, setCount] = useState(0);

useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]); // ← Developer PHẢI khai báo dependency

→ "Tôi TỰ NÓI cho React: theo dõi count"
→ Explicit = dev control = có thể sai (thiếu deps)
→ Linter giúp nhưng KHÔNG thể bắt 100%

VUE (Auto-tracking, Reactive):
const count = ref(0);

watchEffect(() => {
  document.title = `Count: ${count.value}`;
  // Vue TỰ ĐỘNG biết đọc count.value → track dependency
});

→ "Vue TỰ BIẾT: tôi đọc count.value"
→ Automatic = framework control = KHÔNG THỂ sai
→ Nhưng: magic → khó debug khi tracking không như mong đợi

SOLID (Fine-grained reactivity):
const [count, setCount] = createSignal(0);

createEffect(() => {
  document.title = `Count: ${count()}`;
  // Solid TỰ ĐỘNG track count() call
});

→ Giống Vue: automatic tracking
→ Fine-grained: CHỈ update elements cần thiết, không re-render component

SVELTE (Compiler-based):
let count = 0;

$: document.title = `Count: ${count}`;
// Svelte compiler TỰ PHÂN TÍCH code → biết dependency

→ Compile-time → zero runtime overhead
→ Nhưng: limited to top-level reactive statements
```

```
SO SÁNH:
┌──────────────┬──────────────┬────────────┬────────────┐
│              │ React        │ Vue/Solid  │ Svelte     │
├──────────────┼──────────────┼────────────┼────────────┤
│ Tracking     │ MANUAL       │ AUTO       │ COMPILER   │
│              │ (dep array)  │ (runtime)  │ (build)    │
├──────────────┼──────────────┼────────────┼────────────┤
│ Có thể sai?  │ CÓ (thiếu   │ Hiếm khi   │ Hiếm khi   │
│              │ deps)        │            │            │
├──────────────┼──────────────┼────────────┼────────────┤
│ Lỗi phổ biến│ Stale        │ Unexpected │ Reactive   │
│              │ closures     │ re-runs    │ statement  │
│              │              │            │ order      │
├──────────────┼──────────────┼────────────┼────────────┤
│ Debug        │ DỄ (explicit)│ KHÓ HƠN   │ KHÓ HƠN   │
│              │              │ (magic)    │ (compiled) │
├──────────────┼──────────────┼────────────┼────────────┤
│ Learning     │ CAO (manual) │ THẤP       │ THẤP       │
│ curve        │              │ (auto)     │ (auto)     │
├──────────────┼──────────────┼────────────┼────────────┤
│ React        │ React        │ Compiler   │ Compiler   │
│ Compiler     │ Forget       │ sẽ tự memo │ đã compile │
│ tương lai    │ (auto memo)  │            │            │
└──────────────┴──────────────┴────────────┴────────────┘

TẠI SAO REACT CHỌN EXPLICIT:
1. TRANSPARENCY: dev BIẾT chính xác khi nào Effect chạy
2. PREDICTABILITY: không có "magic" → dễ reason about
3. COMPOSABILITY: dependency array = data, dễ transform
4. COMPATIBILITY: React Compiler sẽ giải quyết boilerplate
→ React đánh đổi "convenience" lấy "predictability"
```

---

### 27. "Pit of Success" — Triết Lý Thiết Kế Dependency System

> 🎯 "React thiết kế để dev RƠI VÀO 'hố thành công' — làm đúng DỄ hơn làm sai."

```
"PIT OF SUCCESS" (Brad Abrams, Microsoft):
"API tốt = dev tự nhiên RƠI VÀO cách đúng, phải CỐ GẮNG mới làm sai"

REACT ÁP DỤNG:
1. LINTER MẶC ĐỊNH BẬT:
   → Dev viết useEffect → linter TỰ ĐỘNG kiểm tra deps
   → Làm đúng = tự nhiên, không cần cố gắng
   → Làm sai = phải suppress linter = CỐ Ý bỏ qua cảnh báo

2. DEPENDENCY ARRAY BẮT BUỘC:
   → Không khai báo deps → chạy mỗi render (safe nhưng chậm)
   → Khai báo thiếu → linter cảnh báo
   → Khai báo đủ → hoạt động đúng
   → Suppress → phải viết comment giải thích → friction CỐ Ý

3. STRICT MODE:
   → Effect chạy 2 lần → phát hiện cleanup thiếu
   → Dev không cần nhớ test cleanup → StrictMode test tự động
   → Cleanup đúng → app hoạt động → "tự nhiên đúng"

4. CAPTURE SEMANTICS:
   → Closures capture values → stale values rõ ràng
   → Dev thấy stale → fix deps → correct behavior
   → Nếu React dùng mutable refs mặc định → bugs ẩn
```

```
SO SÁNH VỚI "PIT OF DESPAIR":

PIT OF DESPAIR (làm sai DỄ, làm đúng KHÓ):
"Tôi suppress linter → code chạy → nhưng stale bugs ẩn"
"Tôi đọc state trong setInterval → hoạt động lúc đầu → bug sau"
"Tôi skip cleanup → OK trên dev → memory leak trên prod"

PIT OF SUCCESS (React muốn bạn ở đây):
"Tôi khai báo deps đầy đủ → linter vui → code đúng"
"Tôi dùng updater fn → không đọc state → không stale"
"Tôi viết cleanup → StrictMode verify → production safe"

FRICTION DESIGN:
React CỐ Ý tạo ma sát (friction) cho hành vi SAI:
├── Suppress linter = extra comment + eslint-disable
├── Skip deps = linter warning mỗi lần save
├── No cleanup = StrictMode double-run exposed bugs
└── Impure render = concurrent mode double-render caught bugs

React CỐ Ý GIẢM ma sát cho hành vi ĐÚNG:
├── Full deps = linter happy, no warnings
├── Updater fn = natural API, shorter code
├── Cleanup = return function, collocated with setup
└── Pure render = just return JSX, simplest code
```

---

### 28. Performance Implications — Dependencies Sai Ảnh Hưởng Thế Nào?

> 🎯 "Dependencies sai → Effects chạy thừa → cascading performance issues."

```
CASCADING EFFECT CỦA DEPENDENCY SAI:

1. Object dep tạo mỗi render → Effect chạy MỖI RENDER:
   const config = { theme: 'dark' }; // ← Mới mỗi render
   useEffect(() => {
     applyTheme(config);
   }, [config]); // ← Effect chạy MỖI RENDER

2. Effect setState → RE-RENDER → Effect chạy lại → setState → ...
   Render 1 → Effect → setState → Render 2 → Effect → setState → Render 3
   → Mỗi render = ~16ms → 3 renders = 48ms → jank visible!

3. Effect fetch → re-render → Effect fetch → re-render:
   → Network requests MULTIPLIED
   → Server load increased
   → Data inconsistency possible
```

```
PERFORMANCE IMPACT MEASUREMENT:

ĐÚNG (deps = [roomId]):
├── roomId thay đổi 1 lần → 1 Effect chạy → 1 fetch → 1 re-render
├── Total time: ~50ms
└── User experience: smooth

SAI (deps thiếu → object mới mỗi render):
├── User types 10 chars → 10 re-renders → 10 Effects → 10 fetches
├── Total time: ~500ms (10 × 50ms)
├── Network: 10 requests (9 wasted)
└── User experience: laggy, loading flicker

SAI HƠN (infinite loop):
├── Effect → setState → re-render → Effect → setState → ...
├── Total time: browser freeze
├── Console: "Maximum update depth exceeded"
└── User experience: app crash

CÁCH ĐO:
1. React DevTools Profiler → xem số renders
2. Network tab → xem số requests
3. console.log trong Effect → đếm số lần chạy
4. Performance tab → xem flame chart
5. React.Profiler component → measure render time
```

```
PERFORMANCE OPTIMIZATION PRIORITY:

1. FIX infinite loops TRƯỚC (app crash)
2. FIX unnecessary Effect re-runs (performance drain)
3. FIX stale closures (correctness bugs)
4. OPTIMIZE heavy computations (useMemo)
5. OPTIMIZE child re-renders (useCallback + memo)

80/20 RULE:
80% performance issues = dependency array sai
→ Fix deps TRƯỚC khi dùng useMemo/useCallback/memo
→ Premature optimization = thêm useMemo everywhere → WRONG
→ Fix root cause (deps) → performance tự cải thiện
```

---

### 29. Effect "Thuộc Về" Render — Không Phải Component

> 🎯 "Mỗi render tạo Effect RIÊNG. Effect của render 1 và render 2 là HAI Effect KHÁC NHAU."

```tsx
function Chat({ roomId }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);
}
```

```
RENDER 1 (roomId = "music"):
Effect_1 = {
  setup: () => { connect("music"); return () => disconnect("music") },
  deps: ["music"],
  cleanup: null (chưa có)
}
→ React chạy setup → connect("music")
→ Lưu cleanup = disconnect("music")

RENDER 2 (roomId = "travel"):
Effect_2 = {
  setup: () => { connect("travel"); return () => disconnect("travel") },
  deps: ["travel"],
  cleanup: null
}
→ React: deps ["music"] → ["travel"] = KHÁC
→ Chạy cleanup CỦA Effect_1: disconnect("music")
→ Chạy setup CỦA Effect_2: connect("travel")
→ Lưu cleanup = disconnect("travel")

QUAN TRỌNG:
- Effect_1 và Effect_2 là HAI OBJECTS KHÁC NHAU
- cleanup CỦA Effect_1 chạy trong CONTEXT của render 1 (roomId = "music")
- setup CỦA Effect_2 chạy trong CONTEXT của render 2 (roomId = "travel")
- Mỗi Effect "sống" trong closure CỦA RENDER tạo ra nó
```

```
GIỐNG NHƯ:
Mỗi render = 1 BỨC ẢNH (snapshot)
Mỗi Effect = 1 HÀNH ĐỘNG dựa trên bức ảnh đó

Render 1 (ảnh "Music Room"):
→ Effect 1: "Vào Music Room" + cleanup "Ra khỏi Music Room"

Render 2 (ảnh "Travel Room"):
→ Effect 2: "Vào Travel Room" + cleanup "Ra khỏi Travel Room"

Khi chuyển từ render 1 → 2:
1. Cleanup Effect 1: "Ra khỏi Music Room" (dựa trên ẢNH 1)
2. Setup Effect 2: "Vào Travel Room" (dựa trên ẢNH 2)

→ Cleanup LUÔN dùng giá trị CŨ (của render tạo ra nó)
→ Setup LUÔN dùng giá trị MỚI (của render hiện tại)
→ ĐÂY LÀ LÝ DO cleanup hoạt động ĐÚNG!
```

---

### 30. FAQ — Câu Hỏi Thường Gặp Về Dependency System

> 🎯 "Tổng hợp câu hỏi phổ biến nhất mà developers đặt ra."

```
Q1: "Tại sao tôi không thể viết useEffect(async () => {...})?"
A: useEffect PHẢI return undefined HOẶC cleanup function.
   async function LUÔN return Promise.
   Promise KHÔNG PHẢI cleanup function → React không biết cách dọn dẹp.
   FIX: Tạo async function BÊN TRONG Effect rồi gọi nó.

Q2: "Tại sao linter cảnh báo mặc dù tôi BIẾT code chạy đúng?"
A: Linter cảnh báo vì code CÓ THỂ sai trong TƯƠNG LAI.
   Bây giờ OK → refactor code → quên update deps → STALE BUG ẩn.
   Linter bảo vệ bạn khỏi BỰG TƯƠNG LAI, không chỉ hiện tại.

Q3: "Tại sao useEffect chạy 2 lần trong development?"
A: React.StrictMode cố tình mount → cleanup → mount để TEST cleanup.
   Nếu cleanup ĐÚNG → kết quả GIỐNG chạy 1 lần.
   Nếu BUG HIỆN LÊN → cleanup CỦA BẠN SAI → fix trước khi lên prod.

Q4: "useMemo và useCallback có GIỐNG dependency rules không?"
A: CÓ. useMemo, useCallback, useEffect CÙNG dùng Object.is.
   Cùng linter. Cùng reactive value rules. Cùng closure mechanics.
   Khác nhau: TIMING (memo/callback = trong render, effect = sau paint).

Q5: "Khi nào THẬT SỰ nên suppress linter?"
A: GẦN NHƯ KHÔNG BAO GIỜ.
   Duy nhất: custom hooks tự quản lý deps (useDeepCompareEffect).
   Nếu suppress → PHẢI có comment giải thích TẠI SAO.
   Rule: Nếu không giải thích được → ĐỪNG suppress.

Q6: "Số dependencies TỐI ĐA bao nhiêu?"
A: Không có giới hạn kỹ thuật.
   Nhưng nếu > 3-4 deps → dấu hiệu Effect LÀM QUÁ NHIỀU VIỆC.
   Fix: Tách thành nhiều Effects nhỏ hơn, mỗi cái 1-2 deps.

Q7: "Dependencies có ảnh hưởng bundle size không?"
A: KHÔNG. Dependency array là runtime data, không liên quan bundling.
   useMemo/useCallback THÊM code → tăng bundle size NHẸ.
   React Compiler sẽ auto-optimize → dev không cần lo.

Q8: "Tại sao React không dùng Proxy như Vue?"
A: React triết lý IMMUTABLE + EXPLICIT.
   Proxy = mutable + implicit tracking → khó debug trong codebase lớn.
   React đánh đổi: boilerplate nhiều hơn → predictability tốt hơn.
   React Compiler sẽ giảm boilerplate → giữ predictability.

Q9: "Event handler CÓ dependency rules không?"
A: KHÔNG. Event handlers chạy khi user TƯƠNG TÁC, không liên quan render.
   Closures VẪN capture values → nhưng KHÔNG có dep array để quản lý.
   Event handlers LUÔN "thấy" values của render TẠO RA nó.

Q10: "useInsertionEffect có dependency rules không?"
A: CÓ. useInsertionEffect CÙNG dep rules như useEffect.
    Khác: chạy TRƯỚC useLayoutEffect → dùng cho CSS-in-JS libraries.
    Dev HIẾM KHI dùng trực tiếp → chủ yếu cho library authors.
```

---

## PHẦN C: COMMON MISTAKES & HOW TO FIX

> ⚠️ Những sai lầm PHỔ BIẾN NHẤT khi làm việc với Effect dependencies.

### Mistake 1: Suppress Linter Vì "Chỉ Muốn Chạy Một Lần"

```tsx
// ❌ SAI: "Tôi muốn Effect chạy 1 lần khi mount"
useEffect(() => {
  fetchData(); // fetchData đọc userId (state)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ← NÓI DỐI React: "Không phụ thuộc gì"
```

**Tại sao sai:**

```
fetchData() đọc userId từ closure → userId = giá trị lúc mount
Nếu userId thay đổi (user login khác) → fetchData VẪN dùng userId CŨ
→ Fetch data CỦA USER SAI!
```

**✅ Fix:**

```tsx
useEffect(() => {
  fetchData(userId);
}, [userId]); // ✅ Chạy lại khi userId thay đổi — ĐÚNG behavior!
// Nếu userId KHÔNG BAO GIỜ thay đổi → Effect cũng chỉ chạy 1 lần
```

### Mistake 2: Object Dependency Gây Infinite Loop

```tsx
// ❌ SAI: options tạo mới mỗi render → Effect chạy mãi
function ChatRoom({ roomId }) {
  const options = { serverUrl, roomId };

  useEffect(() => {
    const conn = createConnection(options);
    conn.connect();
    return () => conn.disconnect();
  }, [options]); // ← options LUÔN khác → Effect LUÔN chạy!
}
```

**✅ Fix:** Di chuyển vào trong Effect:

```tsx
useEffect(() => {
  const options = { serverUrl, roomId }; // Tạo BÊN TRONG
  const conn = createConnection(options);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]); // ✅ Primitive dependency
```

### Mistake 3: State Update Trong Effect Gây Infinite Loop

```tsx
// ❌ SAI: Effect set state → trigger re-render → Effect chạy lại → LOOP!
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // Đọc count + set count
  }, [count]); // count thay đổi → Effect chạy lại → set count → LOOP!
}
```

**✅ Fix:** Hỏi: "Effect này CÓ THỰC SỰ CẦN không?"

```tsx
// Nếu cần đếm render → dùng ref:
function Component() {
  const renderCount = useRef(0);
  renderCount.current += 1; // Không trigger re-render
}
```

### Mistake 4: Fetch Trong Effect Với Object/Array State

```tsx
// ❌ SAI: filters là object → tạo mới mỗi render
function ProductList() {
  const [filters, setFilters] = useState({ category: "all", sort: "name" });

  useEffect(() => {
    fetchProducts(filters);
  }, [filters]); // KHÔNG gây infinite loop nhưng fetch DƯ THỪA
  // Vì useState giữ reference ỔN ĐỊNH chỉ khi bạn tạo object MỚI
  // Nhưng nếu parent re-render và filters truyền từ props → DƯ THỪA
}
```

**✅ Fix:** Destructure primitives:

```tsx
useEffect(() => {
  fetchProducts({ category, sort });
}, [category, sort]); // ✅ Primitives
```

### Mistake 5: Event Handler Logic Trong Effect

```tsx
// ❌ SAI: Logic chỉ cần chạy khi user click
function Form() {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (data) {
      // ❌ Gửi data khi state thay đổi → EFFECT
      sendToServer(data);
      showSuccess();
    }
  }, [data]);

  const handleSubmit = () => setData(formData);
}
```

**✅ Fix:** Logic vào Event Handler:

```tsx
function Form() {
  const handleSubmit = () => {
    // ✅ Gửi data khi user CLICK → EVENT HANDLER
    sendToServer(formData);
    showSuccess();
  };
}
```

### Mistake 6: Không Cleanup → Memory Leak + Stale Callbacks

```tsx
// ❌ SAI: Subscription không cleanup
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (msg) => setMessages((m) => [...m, msg]);
  // ← Quên return cleanup!
}, [url]); // url thay đổi → WebSocket CŨ vẫn sống → memory leak!
```

**✅ Fix:**

```tsx
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (msg) => setMessages((m) => [...m, msg]);
  return () => ws.close(); // ✅ Cleanup khi url thay đổi hoặc unmount
}, [url]);
```

### Mistake 7: useMemo/useCallback Wrapper Thay Vì Fix Gốc

```tsx
// ❌ SAI: Dùng useMemo để "fix" dependency — che giấu vấn đề thực sự
function ChatRoom({ roomId }) {
  const options = useMemo(
    () => ({
      serverUrl,
      roomId,
    }),
    [roomId],
  );

  useEffect(() => {
    const conn = createConnection(options);
    conn.connect();
    return () => conn.disconnect();
  }, [options]); // "Hoạt động" nhưng KHÔNG cần thiết
}
```

**✅ Fix tốt hơn: Di chuyển vào Effect (đơn giản hơn)**

```tsx
useEffect(() => {
  const options = { serverUrl, roomId };
  const conn = createConnection(options);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]); // ✅ Đơn giản, rõ ràng, KHÔNG CẦN useMemo
```

### Mistake 8: Race Condition Khi Fetch Data

```tsx
// ❌ SAI: Không handle race condition
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data)); // ← Có thể set data CŨ sau data MỚI!
  }, [userId]);
}
```

**Tại sao sai:**

```
User click userId=1 → fetch bắt đầu (chậm 3s)
User click userId=2 → fetch bắt đầu (nhanh 1s)

Timeline:
t=0: fetch(userId=1) started
t=0: fetch(userId=2) started
t=1: fetch(userId=2) completed → setUser(user2) ✅
t=3: fetch(userId=1) completed → setUser(user1) ❌ STALE DATA!

Kết quả: Hiển thị user1 dù đang xem userId=2 → BUG NGHIÊM TRỌNG!
```

**✅ Fix 1: Cleanup flag (ignore stale response)**

```tsx
useEffect(() => {
  let ignore = false; // ← Cờ để biết Effect đã bị cleanup chưa

  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!ignore) {
        // ← CHỈ set khi Effect CHƯA bị cleanup
        setUser(data);
      }
    });

  return () => {
    ignore = true; // ← userId thay đổi → đánh dấu response cũ là STALE
  };
}, [userId]);
```

**✅ Fix 2: AbortController (cancel request)**

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => setUser(data))
    .catch((err) => {
      if (err.name !== "AbortError") throw err; // ← Ignore abort errors
    });

  return () => controller.abort(); // ← HỦY request khi userId đổi
}, [userId]);
```

```
SO SÁNH HAI CÁCH:

ignore flag:
├── Request VẪN CHẠY trên server (tốn bandwidth)
├── Response về → bị ignore → KHÔNG set state
├── Đơn giản, hoạt động với mọi async operation
└── Dùng khi: cancel không quan trọng, response nhẹ

AbortController:
├── Request BỊ HỦY trên browser (tiết kiệm bandwidth)
├── Server có thể biết → dừng xử lý (nếu hỗ trợ)
├── Phải handle AbortError → code phức tạp hơn
└── Dùng khi: request nặng, server hỗ trợ cancel
```

---

### Mistake 9: Stale Closure Trong setInterval/setTimeout

```tsx
// ❌ SAI: count luôn = 0 trong interval callback
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // ← LUÔN log 0!
      setCount(count + 1); // ← LUÔN set 0 + 1 = 1!
    }, 1000);
    return () => clearInterval(id);
  }, []); // ← deps = [] → closure "đóng băng" count = 0
}
```

**Tại sao sai:**

```
RENDER 1 (count = 0):
Effect chạy → tạo interval → callback closure nhớ count = 0
deps = [] → Effect KHÔNG BAO GIỜ chạy lại
→ Interval callback LUÔN thấy count = 0 (closure cũ)

MỖI GIÂY:
- console.log(count) → 0, 0, 0, 0, ... (stale!)
- setCount(0 + 1) = 1 → state = 1 → re-render
- Nhưng interval callback VẪN thấy count = 0 → set 1 lại → stuck!
```

**✅ Fix 1: Updater function**

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1); // ← c = giá trị HIỆN TẠI từ React
    // KHÔNG đọc count từ closure → không cần dep
  }, 1000);
  return () => clearInterval(id);
}, []); // ✅ deps = [] là đúng!
```

**✅ Fix 2: useRef cho latest value**

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count; // ← Cập nhật ref MỖI render

  useEffect(() => {
    const id = setInterval(() => {
      console.log(countRef.current); // ← Luôn đọc giá trị MỚI NHẤT
      setCount(countRef.current + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // ✅ ref.current luôn fresh
}
```

**✅ Fix 3: Khai báo dependency (re-create interval)**

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // ← count đúng vì Effect re-run
  }, 1000);
  return () => clearInterval(id);
}, [count]); // ← Mỗi count thay đổi → clear + create interval mới
// ⚠️ CẢNH BÁO: Interval bị reset mỗi lần → timing sai!
// Fix 1 (updater) LUÔN tốt hơn cho trường hợp này
```

---

### Mistake 10: Dùng Effect Cho Derived/Computed State

```tsx
// ❌ SAI: Effect để tính giá trị có thể tính TRỰC TIẾP
function ProductList({ products, searchQuery }) {
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    setFilteredProducts(products.filter((p) => p.name.includes(searchQuery)));
  }, [products, searchQuery]);

  return filteredProducts.map((p) => <Product key={p.id} product={p} />);
}
```

**Tại sao sai:**

```
TIMELINE CỦA CODE SAI:
1. searchQuery thay đổi → re-render
2. Render với filteredProducts CŨ (stale!) → user nhìn thấy data sai tạm thời
3. Effect chạy → setFilteredProducts → RE-RENDER LẦN 2
4. Render với filteredProducts MỚI → user nhìn thấy đúng

→ MỖI LẦN search = 2 renders thay vì 1!
→ User có thể thấy "flash" data cũ → BAD UX
→ Unnecessary state + unnecessary Effect
```

**✅ Fix: Tính trực tiếp trong render body**

```tsx
function ProductList({ products, searchQuery }) {
  // Tính TRỰC TIẾP — không cần state, không cần Effect
  const filteredProducts = products.filter((p) => p.name.includes(searchQuery));

  return filteredProducts.map((p) => <Product key={p.id} product={p} />);
}

// Nếu filter TỐN hiệu năng → useMemo:
function ProductList({ products, searchQuery }) {
  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.includes(searchQuery)),
    [products, searchQuery],
  );
  // ← KHÔNG CẦN Effect! Tính trong render = LUÔN đúng
}
```

```
RULE: Nếu bạn có thể tính output từ props/state HIỆN TẠI
→ KHÔNG CẦN Effect
→ KHÔNG CẦN extra state
→ Tính TRỰC TIẾP trong render body

CHECKLIST "KHÔNG CẦN EFFECT":
├── Biến đổi data để render? → Tính trong render body / useMemo
├── setState dựa trên props? → Tính trực tiếp
├── Cache expensive computation? → useMemo
├── Reset state khi prop đổi? → key prop
└── Tất cả trên = anti-pattern nếu dùng Effect
```

---

### Mistake 11: Effect Làm Nhiều Việc Không Liên Quan

```tsx
// ❌ SAI: 1 Effect xử lý 3 concerns khác nhau
useEffect(() => {
  // Concern 1: Connect to chat
  const conn = createConnection(roomId);
  conn.connect();

  // Concern 2: Log analytics
  logVisit(roomId, userId);

  // Concern 3: Update document title
  document.title = `Chat: ${roomId}`;

  return () => conn.disconnect();
}, [roomId, userId]);
// ← userId thay đổi → RECONNECT chat??? Sai!
// userId chỉ liên quan analytics, không liên quan chat connection
```

**✅ Fix: Tách thành multiple Effects**

```tsx
// Effect 1: Chat connection (phụ thuộc roomId)
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]); // ✅ Chỉ reconnect khi room đổi

// Effect 2: Analytics (phụ thuộc roomId + userId)
useEffect(() => {
  logVisit(roomId, userId);
}, [roomId, userId]); // ✅ Log khi room HOẶC user đổi

// Effect 3: Document title (phụ thuộc roomId)
useEffect(() => {
  document.title = `Chat: ${roomId}`;
}, [roomId]); // ✅ Chỉ update title khi room đổi
```

```
CÁCH NHẬN BIẾT EFFECT CẦN TÁCH:

1. Dependencies KHÁC NHAU cho mỗi concern
   → roomId cho chat, [roomId, userId] cho analytics
   → Gom chung = dependency thừa cho 1 concern

2. Cleanup CHỈ liên quan 1 concern
   → disconnect chỉ cho chat, không cho analytics
   → Gom chung = cleanup chạy khi không cần

3. Xóa 1 concern → concern kia VẪN đúng
   → Xóa analytics → chat vẫn OK → tách!
   → Nếu xóa A làm hỏng B → giữ chung

MENTAL CHECK: "Nếu tôi xóa concern X, dependencies có thay đổi không?"
→ CÓ → TÁCH!
→ KHÔNG → có thể giữ chung
```

---

### Mistake 12: Copy Props Vào State (Unnecessary Mirror)

```tsx
// ❌ SAI: Copy prop vào state → 2 nguồn sự thật → desync
function UserGreeting({ user }) {
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user); // ← "Sync" prop với state mỗi lần prop đổi
  }, [user]);

  return <h1>Hello, {currentUser.name}</h1>;
}
```

**Tại sao sai:**

```
FLOW:
1. user prop = { name: "Alice" }
2. State currentUser = { name: "Alice" } (copy)
3. user prop thay đổi = { name: "Bob" }
4. Render 1: currentUser VẪN = "Alice" (state chưa update!)
5. Effect chạy → setCurrentUser(user) → Render 2
6. Render 2: currentUser = "Bob"

→ 2 renders thay vì 1
→ User thấy "Alice" flash trước khi thấy "Bob"
→ KHÔNG CẦN state — prop LÀ state!
```

**✅ Fix: Dùng prop trực tiếp**

```tsx
function UserGreeting({ user }) {
  return <h1>Hello, {user.name}</h1>;
  // ← Dùng prop TRỰC TIẾP — không cần copy, không cần Effect
}

// Nếu CẦN transform prop → tính trong render:
function UserGreeting({ user }) {
  const displayName = user.name.toUpperCase(); // ← Transform trực tiếp
  return <h1>Hello, {displayName}</h1>;
}

// Nếu CẦN editable state initialized from prop → useState(prop):
function EditableUser({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  // ← "initial" làm rõ: state khởi tạo từ prop, nhưng SAU ĐÓ độc lập
  // KHÔNG cần Effect để sync — state và prop là TÁCH BIỆT
}
```

---

### Mistake 13: Đọc ref.current Trong Dependency Array

```tsx
// ❌ SAI: ref.current trong deps không hoạt động
function Component() {
  const divRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (divRef.current) {
      setHeight(divRef.current.getBoundingClientRect().height);
    }
  }, [divRef.current]); // ← KHÔNG hoạt động!
}
```

**Tại sao sai:**

```
1. ref.current THAY ĐỔI không trigger re-render
2. React CHỈ check deps khi RE-RENDER
3. Không re-render → không check deps → Effect KHÔNG chạy khi ref gắn vào DOM
4. Linter CŨNG cảnh báo: "mutable value" trong deps

FLOW:
- Render 1: divRef.current = null
  → Effect: divRef.current = null → if false → SKIP
- React mount DOM → divRef.current = <div> (mutation, KHÔNG re-render)
  → Effect KHÔNG được re-check → height vẫn = 0
```

**✅ Fix 1: Callback ref**

```tsx
function Component() {
  const [height, setHeight] = useState(0);

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []); // ← React GỌI callback khi DOM node thay đổi

  return <div ref={measuredRef}>Content</div>;
}
```

**✅ Fix 2: ResizeObserver trong Effect**

```tsx
function Component() {
  const divRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!divRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(divRef.current);

    return () => observer.disconnect();
  }, []); // ✅ Effect mount 1 lần, observer tự track DOM changes
}
```

---

### Mistake 14: Context Gây Re-render Toàn Bộ Consumer Tree

```tsx
// ❌ SAI: Context value object mới mỗi render → ALL consumers re-run Effects
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState(16);

  // ← Object MỚI mỗi render dù chỉ theme HOẶC fontSize đổi
  const value = { theme, fontSize, setTheme, setFontSize };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Consumer: Effect chạy lại MỖI KHI provider re-render
function Button() {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    applyButtonTheme(theme);
  }, [theme]); // ← theme vẫn "dark" nhưng OBJECT reference mới → re-render
  // → useContext return RẤT khó predict
}
```

**✅ Fix 1: useMemo context value**

```tsx
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState(16);

  const value = useMemo(
    () => ({ theme, fontSize, setTheme, setFontSize }),
    [theme, fontSize], // ← Object chỉ mới khi theme/fontSize THẬT SỰ đổi
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
```

**✅ Fix 2: Split Context (pattern tối ưu)**

```tsx
// Tách state và dispatch thành 2 contexts:
const ThemeStateContext = createContext();
const ThemeDispatchContext = createContext();

function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  return (
    <ThemeDispatchContext.Provider value={dispatch}>
      {" "}
      {/* dispatch STABLE */}
      <ThemeStateContext.Provider value={state}>
        {children}
      </ThemeStateContext.Provider>
    </ThemeDispatchContext.Provider>
  );
}

// Component chỉ CẦN dispatch → KHÔNG re-render khi state đổi
function ResetButton() {
  const dispatch = useContext(ThemeDispatchContext); // ← STABLE
  return <button onClick={() => dispatch({ type: "reset" })}>Reset</button>;
}
```

---

### Mistake 15: Async Cleanup — Return Promise Thay Vì Function

```tsx
// ❌ SAI: async cleanup function
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();

  return async () => {
    await conn.gracefulDisconnect(); // ← ASYNC cleanup!
    await logDisconnection(roomId);
  };
}, [roomId]);
```

**Tại sao sai:**

```
React GỌI cleanup ĐỒNG BỘ:
1. cleanup() → trả về Promise (không chờ!)
2. Ngay lập tức chạy setup MỚI → connect mới

Timeline:
cleanup bắt đầu → return Promise → React TIẾP TỤC ngay
→ setup mới chạy → connect mới BẮT ĐẦU
→ cleanup Promise resolve → disconnect cũ XẢY RA SAU connect mới!
→ Thứ tự SAI: connect mới → XONG → disconnect cũ → HỦY connection mới!
```

**✅ Fix: Synchronous cleanup + fire-and-forget async**

```tsx
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();

  return () => {
    conn.disconnect(); // ← Synchronous disconnect NGAY
    // Fire-and-forget: log không cần chờ
    logDisconnection(roomId).catch(console.error);
  };
}, [roomId]);

// HOẶC nếu CẦN graceful disconnect:
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();

  return () => {
    // Bắt đầu graceful disconnect nhưng KHÔNG chờ
    conn.gracefulDisconnect().catch(console.error);
    // React sẽ tiếp tục setup mới → 2 connections tồn tại TẠM THỜI
    // → Server xử lý duplicate connections
  };
}, [roomId]);
```

---

### Mistake 16: Fetch Không Có Loading/Error State

```tsx
// ❌ SAI: Chỉ handle success, không handle loading/error
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [userId]);

  return <div>{user.name}</div>; // ← CRASH khi user = null (loading)!
}
```

**✅ Fix: Full loading/error/data pattern**

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <div>{user.name}</div>;
}
```

```
TẠI SAO NÊN DÙNG LIBRARY (React Query/SWR):

Effect fetch thủ công PHẢI handle:
├── Loading state
├── Error state
├── Race conditions (ignore flag / AbortController)
├── Caching (tránh fetch lại data đã có)
├── Retry logic (retry khi network error)
├── Stale-while-revalidate (show cache + fetch fresh)
├── Deduplication (2 components fetch cùng data)
└── Pagination / infinite scroll

→ TẤT CẢ tự viết = 50-100 dòng + dễ bug
→ React Query/SWR = 5 dòng + battle-tested

const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
// ← 3 dòng thay thế 30+ dòng Effect code!
```

---

### Mistake 17: Chain Effects — Effect A setState → Trigger Effect B

```tsx
// ❌ SAI: Effect chain — Effect kích hoạt Effect khác qua state
function ShippingForm({ country }) {
  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);

  // Effect 1: Lấy cities khi country đổi
  useEffect(() => {
    fetchCities(country).then((cities) => {
      setCity(cities[0]); // ← setState → trigger Effect 2!
    });
  }, [country]);

  // Effect 2: Lấy areas khi city đổi
  useEffect(() => {
    if (city) {
      fetchAreas(city).then(setAreas); // ← Fetch areas
    }
  }, [city]);
  // FLOW: country đổi → fetch cities → setCity → fetch areas
  // → 3 renders, 2 network waterfalls, 2 loading states
}
```

**Tại sao sai:**

```
RENDER CHAIN:
Render 1: country = "VN" → Effect 1 fires → loading cities...
Render 2: cities loaded → setCity("HCM") → Effect 2 fires → loading areas...
Render 3: areas loaded → setAreas([...]) → final render

→ 3 renders thay vì 1
→ Network waterfall: fetch cities XONG → MỚI fetch areas
→ User thấy: loading → cities → loading → areas (janky!)
```

**✅ Fix 1: Gom vào 1 Effect**

```tsx
useEffect(() => {
  let ignore = false;

  // Fetch song song nếu có thể, hoặc tuần tự trong 1 Effect
  fetchCities(country)
    .then((cities) => {
      if (ignore) return;
      const firstCity = cities[0];
      setCity(firstCity);

      return fetchAreas(firstCity);
    })
    .then((areas) => {
      if (!ignore) setAreas(areas);
    });

  return () => {
    ignore = true;
  };
}, [country]); // ← 1 Effect, 1 dep, 1 render chain
```

**✅ Fix 2: Dùng Event Handler (nếu user-initiated)**

```tsx
async function handleCountryChange(country) {
  const cities = await fetchCities(country);
  setCity(cities[0]);
  const areas = await fetchAreas(cities[0]);
  setAreas(areas);
  // ← TẤT CẢ trong 1 event handler → automatic batching → 1 render
}
```

---

### Mistake 18: Set State Dựa Trên Props Trong Render Body (Không Dùng Effect)

```tsx
// ❌ SAI (khác biệt tinh tế): Set state TRONG render → infinite loop
function List({ items }) {
  const [sorted, setSorted] = useState([]);

  // ❌ Gọi setState TRONG render body!
  setSorted([...items].sort()); // → setState → re-render → setState → LOOP!

  return sorted.map((item) => <li key={item}>{item}</li>);
}
```

**✅ Fix: useMemo hoặc tính trực tiếp**

```tsx
function List({ items }) {
  const sorted = useMemo(() => [...items].sort(), [items]); // ✅ Tính trong render body — stable khi items không đổi

  return sorted.map((item) => <li key={item}>{item}</li>);
}
```

```
RULE:
- KHÔNG BAO GIỜ gọi setState trong render body
  → SẼ gây infinite loop (setState → re-render → setState → ...)
- Duy nhất NGOẠI LỆ: setState trong điều kiện kiểm tra giá trị hiện tại
  → if (prevValue !== newValue) setState(newValue)
  → React cho phép 1 lần → không gây loop (nhưng VẪN anti-pattern)
- LUÔN ưu tiên: useMemo hoặc tính trực tiếp
```

---

### Mistake 19: Form Validation Trong Effect

```tsx
// ❌ SAI: Validate form bằng Effect → unnecessary complexity + timing issues
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const newErrors = {};
    if (!email.includes("@")) newErrors.email = "Invalid email";
    if (password.length < 8) newErrors.password = "Too short";
    setErrors(newErrors);
  }, [email, password]);
  // → MỖI keystroke = re-render + Effect → setErrors → RE-RENDER LẦN 2!
}
```

**✅ Fix: Tính errors trực tiếp trong render**

```tsx
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Tính errors TRỰC TIẾP — không cần state, không cần Effect
  const errors = {};
  if (!email.includes("@")) errors.email = "Invalid email";
  if (password.length < 8) errors.password = "Too short";

  // HOẶC validate on submit (Event Handler):
  function handleSubmit() {
    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      // Show errors
    } else {
      // Submit form
    }
  }
}
```

```
VALIDATION RULES:
├── Realtime validation (mỗi keystroke) → tính trong render body
├── Submit validation (khi bấm nút) → Event Handler
├── Async validation (check email exists) → Effect hoặc Event Handler
└── KHÔNG BAO GIỜ dùng Effect cho sync validation → unnecessary renders
```

---

### Mistake 20: Tổng Hợp — Checklist Phát Hiện Mistakes

```
┌──────────────────────────────────────────────────────────────────┐
│                  MISTAKES DETECTION CHECKLIST                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔍 SEARCH FOR IN YOUR CODEBASE:                                 │
│                                                                  │
│ 1. eslint-disable react-hooks/exhaustive-deps                    │
│    → 99% cần fix, KHÔNG suppress                                 │
│                                                                  │
│ 2. useEffect + setState nhưng KHÔNGcó external system            │
│    → Có thể tính trực tiếp / useMemo / Event Handler             │
│                                                                  │
│ 3. useEffect(() => {}, [object/function])                        │
│    → Object/fn tạo mỗi render? → DiNote chuyển vào Effect          │
│                                                                  │
│ 4. useEffect KHÔNG có return (cleanup)                           │
│    → Nếu có subscription → CẦN cleanup                          │
│    → Nếu chỉ sync value → OK không cần                          │
│                                                                  │
│ 5. fetch() trong Effect KHÔNG có ignore flag                     │
│    → Race condition potential!                                   │
│                                                                  │
│ 6. setInterval/setTimeout + deps = []                            │
│    → Closure đóng băng → stale values                            │
│    → Fix: updater fn hoặc useRef                                 │
│                                                                  │
│ 7. useState(prop) + useEffect sync prop → state                  │
│    → Mirror anti-pattern → dùng prop trực tiếp                   │
│                                                                  │
│ 8. Effect 1 → setState → Effect 2                                │
│    → Chain effect → gom lại hoặc dùng Event Handler              │
│                                                                  │
│ 9. ref.current trong dependency array                            │
│    → KHÔNG hoạt động → dùng callback ref                         │
│                                                                  │
│ 10. async cleanup function                                       │
│     → React không await cleanup → dùng sync cleanup              │
│                                                                  │
│ 11. useEffect cho form validation                                │
│     → Tính trực tiếp trong render body                           │
│                                                                  │
│ 12. Context value object mới mỗi render                          │
│     → useMemo context value hoặc split contexts                  │
│                                                                  │
│ 13. fetch KHÔNG có loading/error handling                        │
│     → Full pattern: loading + error + data + cleanup             │
│                                                                  │
│ SEVERITY LEVELS:                                                 │
│ 🔴 CRITICAL: 1 (suppress), 5 (race), 8 (chain), 10 (async)     │
│ 🟡 HIGH:     2 (object), 3 (loop), 6 (stale), 9 (ref)          │
│ 🟠 MEDIUM:   4 (derived), 7 (mirror), 11 (validate), 12 (ctx)  │
│ 🟢 LOW:      13 (loading/error) — more about UX than bugs        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Mistake 21: Effect Cho Global Singleton (Chỉ Init 1 Lần Toàn App)

```tsx
// ❌ SAI: Init third-party library trong mỗi component render
function App() {
  useEffect(() => {
    // Analytics init NÊN chạy 1 lần cho TOÀN APP
    analytics.init("API_KEY");
    // StrictMode → init 2 LẦN → duplicate events!
  }, []);
}
```

**Tại sao sai:**

```
PROBLEM 1: StrictMode
React.StrictMode mount → cleanup → mount lại
→ analytics.init chạy 2 lần → duplicate tracking
→ Cleanup không thể "un-init" analytics

PROBLEM 2: Component re-mount
Nếu <App /> unmount rồi mount lại (route change, error boundary)
→ analytics.init chạy THÊM LẦN NỮA → potential crash

PROBLEM 3: Multiple instances
Nếu <App /> render ở nhiều nơi (testing, micro-frontends)
→ Nhiều init → conflict
```

**✅ Fix 1: Module-level initialization (ngoài component)**

```tsx
// analytics.ts — chạy 1 lần khi module được import
let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  analytics.init("API_KEY");
  initialized = true;
}

// App.tsx
import { initAnalytics } from "./analytics";
initAnalytics(); // ← Chạy NGOÀI component, 1 lần duy nhất

function App() {
  // Không cần Effect cho initialization!
  return <Router />;
}
```

**✅ Fix 2: Guard check trong Effect**

```tsx
let didInit = false; // Module-level flag

function App() {
  useEffect(() => {
    if (didInit) return; // ← Skip nếu đã init (StrictMode safe)
    didInit = true;
    analytics.init("API_KEY");
  }, []);
}
```

---

### Mistake 22: useState Initializer Là Function Call Thay Vì Function

```tsx
// ❌ SAI: Gọi function MỖI render thay vì chỉ lần đầu
function Editor() {
  // loadDraft() chạy MỖI RENDER dù result chỉ dùng lần đầu!
  const [content, setContent] = useState(loadDraft());
  // loadDraft() có thể đọc localStorage → CHẬM
  // Kết quả bị BỎ QUA sau render đầu → lãng phí!

  useEffect(() => {
    saveDraft(content); // ← Effect phụ thuộc content
  }, [content]);
}
```

**✅ Fix: Lazy initializer (truyền function, KHÔNG gọi)**

```tsx
function Editor() {
  // Truyền FUNCTION → React chỉ gọi 1 lần khi mount
  const [content, setContent] = useState(() => loadDraft());
  // HOẶC:
  const [content, setContent] = useState(loadDraft); // ← Không có ()

  useEffect(() => {
    saveDraft(content);
  }, [content]);
}
```

```
LIÊN QUAN ĐẾN DEPENDENCIES:
- loadDraft() mỗi render → có thể return object MỚI
- Nếu object này dùng trong Effect deps → Effect chạy thừa!
- useState(() => fn) → chỉ gọi 1 lần → reference ổn định

SAME PATTERN CHO useReducer:
// ❌ useReducer(reducer, computeInitialState())  → gọi mỗi render
// ✅ useReducer(reducer, arg, computeInitialState) → gọi 1 lần
```

---

### Mistake 23: Callback Prop Từ Parent Không Stable

```tsx
// Parent:
function Parent() {
  return (
    <Child
      onSave={(data) => saveToApi(data)} // ← Function MỚI mỗi render!
    />
  );
}

// Child:
function Child({ onSave }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (data) {
      onSave(data); // ← Effect đọc onSave
    }
  }, [data, onSave]); // ← onSave mới mỗi render → Effect chạy thừa!
}
```

**Tại sao sai:**

```
FLOW:
1. Parent re-render (BẤT KỲ lý do gì)
2. onSave = new arrow function (reference mới)
3. Child receives new onSave
4. Effect: onSave thay đổi → chạy lại
5. Nhưng data KHÔNG đổi → gọi onSave với CÙNG data → THỪA!
```

**✅ Fix 1: useCallback ở Parent**

```tsx
function Parent() {
  const handleSave = useCallback((data) => {
    saveToApi(data);
  }, []); // ← Stable reference

  return <Child onSave={handleSave} />;
}
```

**✅ Fix 2: useEffectEvent ở Child (tốt hơn)**

```tsx
function Child({ onSave }) {
  const [data, setData] = useState(null);

  const handleSave = useEffectEvent((d) => {
    onSave(d); // ← Luôn gọi onSave MỚI NHẤT mà không re-run Effect
  });

  useEffect(() => {
    if (data) {
      handleSave(data);
    }
  }, [data]); // ← CHỈ phụ thuộc data, KHÔNG phụ thuộc onSave
}
```

**✅ Fix 3: Di chuyển vào Event Handler (nếu user-initiated)**

```tsx
function Child({ onSave }) {
  const [data, setData] = useState(null);

  function handleSubmit() {
    onSave(data); // ← Event Handler → KHÔNG cần deps
  }

  return <button onClick={handleSubmit}>Save</button>;
  // ← Hỏi: "onSave CẦN chạy khi data đổi hay khi user click?"
  // Nếu user click → Event Handler, KHÔNG Effect!
}
```

---

### Mistake 24: Mixing Synchronous Và Asynchronous Logic Trong Effect

```tsx
// ❌ SAI: Mix sync DOM manipulation + async fetch
useEffect(() => {
  // Sync: update title ngay
  document.title = `User: ${userId}`;

  // Async: fetch data
  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((data) => setUser(data));

  return () => {
    document.title = "App"; // Cleanup title
    // Nhưng fetch VẪN đang chạy! Cần handle race condition!
  };
}, [userId]);
```

**✅ Fix: Tách sync và async**

```tsx
// Effect 1: Sync DOM (simple, no cleanup needed for overwrite)
useEffect(() => {
  document.title = `User: ${userId}`;
}, [userId]);

// Effect 2: Async fetch (với proper cleanup)
useEffect(() => {
  let ignore = false;

  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!ignore) setUser(data);
    });

  return () => {
    ignore = true;
  };
}, [userId]);
```

```
TẠI SAO TÁCH:

1. Cleanup KHÁC NHAU:
   → Sync (title): overwrite tự cleanup → không cần return
   → Async (fetch): cần ignore flag → cần return

2. Error handling KHÁC NHAU:
   → Sync: không throw
   → Async: có thể fail → cần .catch()

3. Timing KHÁC NHAU:
   → Sync: chạy ngay
   → Async: chạy sau (Promise resolution)

4. Testing DỄ HƠN:
   → Test sync Effect riêng (đơn giản)
   → Test async Effect riêng (mock fetch)
```

---

### Mistake 25: Redundant State Từ Cùng Source

```tsx
// ❌ SAI: Nhiều state từ cùng 1 fetch
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setName(data.name); // ← Redundant! Đã có trong user
        setEmail(data.email); // ← Redundant!
        setAvatar(data.avatar); // ← Redundant!
      });
  }, [userId]);
  // → 4 setState = potential 4 re-renders (trước React 18)
  // → 3 state variables THỪA → khó maintain
}
```

**✅ Fix: Single source of truth**

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!ignore) setUser(data); // ← 1 setState duy nhất
      });
    return () => { ignore = true; };
  }, [userId]);

  // Derive từ user — KHÔNG cần extra state
  const name = user?.name ?? '';
  const email = user?.email ?? '';
  const avatar = user?.avatar ?? '';

  return (/* ... */);
}
```

```
PRINCIPLE: "Single Source of Truth"
├── 1 fetch → 1 state (user object)
├── Derived values tính từ 1 state → LUÔN consistent
├── KHÔNG CẦN sync multiple states → KHÔNG CẦN nhiều deps
├── Reducer: nếu cần transform data → useReducer
└── React 18 batch: multiple setState OK nhưng VẪN không cần redundant state
```

---

### Mistake 26: Effect Cho Navigation / Redirect

```tsx
// ❌ SAI: Effect cho redirect logic
function ProtectedPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login"); // ← Redirect trong Effect
    }
  }, [user, isLoading, navigate]);
  // PROBLEMS:
  // 1. User thấy protected content FLASH trước khi redirect
  // 2. navigate có thể unstable → Effect chạy thừa
  // 3. Effect chạy SAU paint → delay visible
}
```

**✅ Fix 1: Render-time redirect (immediate)**

```tsx
function ProtectedPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />; // ← Render-time redirect

  return <ProtectedContent />;
  // ← KHÔNG cần Effect!
  // ← Navigate component triggers redirect TRONG render
  // ← User KHÔNG BAO GIỜ thấy protected content flash
}
```

**✅ Fix 2: Route-level guard (best practice)**

```tsx
// Layout/Route level — check TRƯỚC khi render page
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// Router config:
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
</Route>;
```

---

### Mistake 27: Debounce Trong Effect Không Cleanup

```tsx
// ❌ SAI: setTimeout trong Effect nhưng KHÔNG clear
function Search({ query }) {
  useEffect(() => {
    setTimeout(() => {
      fetchResults(query); // ← Chạy sau 300ms
    }, 300);
    // ← QUÊN cleanup! Nếu query đổi nhanh → nhiều fetches!
  }, [query]);
}
```

**Tại sao sai:**

```
TIMELINE (user types "react"):
t=0ms: query="r"    → setTimeout(fetchResults("r"), 300)
t=50ms: query="re"  → setTimeout(fetchResults("re"), 300)
t=100ms: query="rea" → setTimeout(fetchResults("rea"), 300)
t=200ms: query="reac" → setTimeout(fetchResults("reac"), 300)
t=250ms: query="react" → setTimeout(fetchResults("react"), 300)

t=300ms: fetchResults("r") fires!     ← STALE!
t=350ms: fetchResults("re") fires!    ← STALE!
t=400ms: fetchResults("rea") fires!   ← STALE!
t=500ms: fetchResults("reac") fires!  ← STALE!
t=550ms: fetchResults("react") fires! ← Đúng, nhưng 4 requests thừa!

→ 5 fetches thay vì 1! → Server load × 5
```

**✅ Fix: clearTimeout trong cleanup**

```tsx
function Search({ query }) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchResults(query);
    }, 300);

    return () => clearTimeout(timeoutId); // ← Clear timer CŨ khi query đổi
  }, [query]);
}
```

```
TIMELINE SAU FIX:
t=0ms: query="r"     → setTimeout("r", 300)
t=50ms: query="re"   → clearTimeout("r") → setTimeout("re", 300)
t=100ms: query="rea"  → clearTimeout("re") → setTimeout("rea", 300)
t=200ms: query="reac" → clearTimeout("rea") → setTimeout("reac", 300)
t=250ms: query="react" → clearTimeout("reac") → setTimeout("react", 300)

t=550ms: fetchResults("react") fires! ← CHỈ 1 fetch! ✅

→ Cleanup TỰ ĐỘNG cancel previous timeout
→ Chỉ timeout CUỐI CÙNG sống sót
→ Debounce hoạt động ĐÚNG!
```

---

### Mistake 28: Ignore StrictMode Warnings

```tsx
// ❌ SAI: Effect "hoạt động" nhưng fail khi StrictMode double-mount
function ChatRoom({ roomId }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    // KHÔNG có cleanup!
  }, [roomId]);
  // Development: mount → cleanup (nothing) → mount
  // → 2 connections! Memory leak!
  // Production: 1 connection → "works" → nhưng KHÔNG safe
}
```

**Tại sao sai:**

```
STRICTMODE FLOW:
1. Mount → Effect chạy → connect("music") → Connection #1
2. Cleanup → (nothing) → Connection #1 VẪN sống
3. Mount lại → Effect chạy → connect("music") → Connection #2
4. Bây giờ có 2 connections! Connection #1 = LEAKED

PHÁT HIỆN:
- Console: 2 "Connected to music" logs
- Network tab: 2 WebSocket connections
- Nếu "thấy bình thường" → cleanup ĐÚNG (mỗi connection tồn tại 1 lần)
- Nếu THẤY DOUBLE → cleanup THIẾU hoặc SAI

QUAN TRỌNG:
StrictMode CHỈ chạy ở development → prod KHÔNG double-mount
NHƯNG: bug VẪN TỒN TẠI:
- roomId thay đổi → Effect chạy lại → connection CŨ leak (không strict mode)
- Component unmount → connection leak
- StrictMode chỉ LÀM RÕ bug sớm hơn
```

**✅ Fix: Viết cleanup cho MỌI subscription**

```tsx
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect(); // ← LUÔN cleanup subscriptions

  // CHECKLIST cleanup:
  // WebSocket → .close()
  // EventListener → removeEventListener()
  // setInterval → clearInterval()
  // setTimeout → clearTimeout()
  // IntersectionObserver → .disconnect()
  // ResizeObserver → .disconnect()
  // MutationObserver → .disconnect()
  // Fetch → AbortController.abort()
}, [roomId]);
```

---

### Mistake 29: Conditional Dependency — Đọc Biến Trong if Nhưng Không Khai Báo

```tsx
// ❌ SAI: Đọc theme TRONG condition nhưng không khai báo dep
function ChatRoom({ roomId, theme, isAdmin }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();

    if (isAdmin) {
      logWithTheme(theme); // ← ĐỌC theme nhưng chỉ khi isAdmin
    }

    return () => conn.disconnect();
  }, [roomId, isAdmin]); // ← THIẾU theme!
}
```

**Tại sao sai:**

```
SCENARIO:
1. isAdmin = true, theme = "dark" → logWithTheme("dark") ✅
2. theme đổi thành "light" → Effect KHÔNG chạy lại (deps thiếu theme)
3. isAdmin vẫn true → nhưng effect dùng theme CŨ "dark" → STALE!

Linter ĐÚNG: theme ĐƯỢC ĐỌC trong Effect → PHẢI khai báo
Dù đọc trong if → VẪN đọc → VẪN cần dep
```

**✅ Fix 1: Thêm theme vào deps**

```tsx
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();

  if (isAdmin) {
    logWithTheme(theme);
  }

  return () => conn.disconnect();
}, [roomId, isAdmin, theme]); // ✅ Khai báo ĐẦY ĐỦ
// ⚠️ Nhưng: theme đổi → reconnect chat → THỪA!
```

**✅ Fix 2: Tách Effects (tốt hơn)**

```tsx
// Effect 1: Chat connection
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]); // ← CHỈ roomId

// Effect 2: Admin logging
useEffect(() => {
  if (isAdmin) {
    logWithTheme(theme);
  }
}, [isAdmin, theme]); // ← Riêng biệt, không ảnh hưởng chat
```

**✅ Fix 3: useEffectEvent (nếu không muốn re-sync)**

```tsx
const onAdminLog = useEffectEvent(() => {
  if (isAdmin) {
    logWithTheme(theme); // ← Đọc theme MỚI NHẤT mà không trigger re-sync
  }
});

useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  onAdminLog(); // ← Gọi sau connect
  return () => conn.disconnect();
}, [roomId]); // ← CHỈ roomId
```

---

### Mistake 30: Comprehensive Code Review Guide — Dependencies

```
┌──────────────────────────────────────────────────────────────────┐
│              DEPENDENCY CODE REVIEW GUIDE                        │
│              (Dành cho Senior Dev / Tech Lead)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔍 LEVEL 1: QUICK SCAN (grep/search)                            │
│                                                                  │
│ Search: eslint-disable.*exhaustive-deps                          │
│ → Hỏi: "Tại sao suppress? Có technique tốt hơn không?"         │
│                                                                  │
│ Search: useEffect.*\[\]                                          │
│ → Hỏi: "Effect đọc props/state không? Nếu có → deps thiếu"     │
│                                                                  │
│ Search: useEffect without return                                 │
│ → Hỏi: "Có subscription/listener? Nếu có → cần cleanup"        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔍 LEVEL 2: PATTERN REVIEW                                      │
│                                                                  │
│ Pattern: useEffect + setState (không fetch)                      │
│ → "Derived state? Tính trực tiếp trong render body"             │
│                                                                  │
│ Pattern: useEffect + fetch (không ignore/abort)                  │
│ → "Race condition! Cần ignore flag hoặc AbortController"         │
│                                                                  │
│ Pattern: Object/function trong deps                              │
│ → "Tạo mỗi render? Di chuyển vào Effect hoặc useMemo"          │
│                                                                  │
│ Pattern: useEffect → setState → useEffect (chain)                │
│ → "Effect chain! Gom lại hoặc dùng Event Handler"               │
│                                                                  │
│ Pattern: useState(prop) + useEffect(setX(prop))                  │
│ → "Props mirror! Dùng prop trực tiếp"                           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔍 LEVEL 3: DEEP REVIEW                                         │
│                                                                  │
│ Check: Cleanup mirror setup?                                     │
│ → connect ↔ disconnect, subscribe ↔ unsubscribe                  │
│                                                                  │
│ Check: Multiple concerns trong 1 Effect?                         │
│ → Xóa 1 concern → deps thay đổi? → TÁCH                        │
│                                                                  │
│ Check: Context value stable?                                     │
│ → Provider tạo object mới? → useMemo hoặc split context          │
│                                                                  │
│ Check: Custom hooks return stable references?                    │
│ → Hook trả về object/function → có memo không?                   │
│                                                                  │
│ Check: Async cleanup?                                            │
│ → return async () → SAI! React không await cleanup               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📊 REVIEW TEMPLATE (Copy vào PR comment):                        │
│                                                                  │
│ ## Effect Dependencies Review                                    │
│ - [ ] Tất cả reactive values khai báo trong deps                │
│ - [ ] Không suppress linter mà không giải thích                  │
│ - [ ] Cleanup function cho mọi subscription                      │
│ - [ ] Race condition handled (fetch có ignore/abort)             │
│ - [ ] Không dùng Effect cho derived state                        │
│ - [ ] Object/function deps stable (useMemo/useCallback/inline)   │
│ - [ ] Effects tách theo concern (1 Effect = 1 concern)           │
│ - [ ] StrictMode friendly (cleanup idempotent)                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Mistake 31: Custom Hook Trả Về Object/Function Không Stable

```tsx
// ❌ SAI: Custom hook trả về object MỚI mỗi lần gọi
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial size
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ← Trả về CÙNG object reference (useState giữ stable)
  // NHƯNG nếu hook phức tạp hơn:
  return {
    ...size,
    isDesktop: size.width >= 1024, // ← Object MỚI mỗi render!
    isMobile: size.width < 768,
  };
}

// Consumer bị ảnh hưởng:
function Component() {
  const windowSize = useWindowSize(); // ← Object mới mỗi render

  useEffect(() => {
    adjustLayout(windowSize); // ← Effect chạy MỌI render!
  }, [windowSize]); // ← windowSize = new object reference mỗi lần
}
```

**✅ Fix 1: useMemo trong custom hook**

```tsx
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return useMemo(
    () => ({
      ...size,
      isDesktop: size.width >= 1024,
      isMobile: size.width < 768,
    }),
    [size.width, size.height],
  ); // ← Chỉ tạo mới khi size THẬT SỰ đổi
}
```

**✅ Fix 2: Consumer destructure primitives**

```tsx
function Component() {
  const { width, height, isDesktop } = useWindowSize();

  useEffect(() => {
    adjustLayout(width, height, isDesktop);
  }, [width, height, isDesktop]); // ✅ Primitives = stable comparison
}
```

```
CUSTOM HOOK RULES CHO DEPENDENCIES:
1. Hook trả về object → useMemo bên trong hook
2. Hook trả về function → useCallback bên trong hook
3. Consumer destructure → primitives bên ngoài hook
4. Document: "Hook này trả về stable/unstable reference"

CHECKLIST KHI TẠO CUSTOM HOOK:
├── Return primitives? → ✅ Luôn stable
├── Return object? → Wrap useMemo, document stability
├── Return function? → Wrap useCallback, document stability
├── Return multiple values? → Cân nhắc trả về tuple [a, b] thay vì { a, b }
└── Consumer sẽ dùng trong deps? → ĐẢM BẢO stable reference
```

---

### Mistake 32: useLayoutEffect vs useEffect — Dùng Sai Timing

```tsx
// ❌ SAI: useEffect cho DOM measurement → flash/flicker
function Tooltip({ text, targetRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({ top: rect.top - 30, left: rect.left });
    }
  }, [text]); // ← useEffect chạy SAU paint → user thấy tooltip ở vị trí SAI rồi mới nhảy!
}
```

**Tại sao sai:**

```
TIMELINE useEffect:
1. React render → DOM update → PAINT (user thấy)
2. useEffect chạy → đo DOM → setPosition → re-render
3. PAINT lần 2 → user thấy tooltip ở vị trí đúng
→ User thấy 2 frames: sai → đúng = FLASH/FLICKER!

TIMELINE useLayoutEffect:
1. React render → DOM update → (chưa paint!)
2. useLayoutEffect chạy → đo DOM → setPosition → re-render
3. PAINT (CHỈ 1 LẦN) → user thấy tooltip ở vị trí đúng
→ User thấy 1 frame: đúng = SMOOTH!
```

**✅ Fix: useLayoutEffect cho DOM-dependent operations**

```tsx
function Tooltip({ text, targetRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({ top: rect.top - 30, left: rect.left });
    }
  }, [text]); // ✅ Chạy TRƯỚC paint → không flicker
}
```

```
KHI NÀO DÙNG useLayoutEffect:
├── Đo DOM (getBoundingClientRect, offsetHeight) → dùng kết quả render
├── Scroll position manipulation (scrollTo, scrollIntoView)
├── Focus management (element.focus())
├── CSS animation setup (đọc current → set target)
└── Tooltip/Popover positioning

KHI NÀO DÙNG useEffect (default):
├── Data fetching (async, không cản paint)
├── Subscription setup (WebSocket, EventSource)
├── Analytics/Logging
├── setTimeout/setInterval
└── Bất kỳ gì KHÔNG cần chạy trước paint

⚠️ useLayoutEffect BLOCK paint → nếu chạy chậm → user thấy blank!
→ Chỉ dùng cho operations NHANH (< 16ms = 1 frame)
```

---

### Mistake 33: localStorage Sync Với Effect — Thiếu Cross-Tab

```tsx
// ❌ SAI: Sync localStorage NHƯNG không listen cross-tab changes
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]); // ← Chỉ GHI, không NGHE thay đổi từ tab khác

  return [value, setValue];
}
// Tab 1 thay đổi → localStorage cập nhật
// Tab 2: VẪN thấy giá trị CŨ → STALE!
```

**✅ Fix: Listen storage event cho cross-tab sync**

```tsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  // Effect 1: GHI vào localStorage khi value đổi
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  // Effect 2: NGHE thay đổi từ tab khác
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === key && e.newValue !== null) {
        setValue(JSON.parse(e.newValue));
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]); // ← Listen cross-tab changes

  return [value, setValue];
}
```

```
QUAN TRỌNG VỀ storage EVENT:
├── storage event CHỈ fire ở TAB KHÁC (không fire ở tab hiện tại)
├── Cần key check: e.key === key (vì nghe MỌI key changes)
├── e.newValue = null khi key bị xóa (removeItem)
├── SSR: window không tồn tại → cần check typeof window !== 'undefined'
└── JSON.parse có thể throw → cần try-catch
```

---

### Mistake 34: Window/Document Event Listener — Missing Dependencies + Cleanup

```tsx
// ❌ SAI: Multiple issues
function ScrollTracker({ threshold, onThresholdReached }) {
  useEffect(() => {
    window.addEventListener("scroll", () => {
      // ← Anonymous function → KHÔNG THỂ remove!
      if (window.scrollY > threshold) {
        onThresholdReached(); // ← Đọc nhưng không khai báo dep
      }
    });
    // ← Không cleanup!
  }, []); // ← Thiếu deps: threshold, onThresholdReached
}
```

**Tại sao sai:**

```
3 BUGS CÙNG LÚC:

BUG 1: Anonymous function
→ addEventListener(fn) → removeEventListener(fn) PHẢI cùng reference
→ Arrow function anonymous → KHÔNG THỂ remove → MEMORY LEAK

BUG 2: Missing cleanup
→ Component unmount → listener VẪN sống → potential crash
→ "Cannot perform a React state update on unmounted component"

BUG 3: Stale closure
→ threshold có thể đổi → listener dùng threshold CŨ
→ onThresholdReached có thể đổi → gọi FUNCTION CŨ
```

**✅ Fix: Named function + cleanup + correct deps**

```tsx
function ScrollTracker({ threshold, onThresholdReached }) {
  // useEffectEvent cho callback không nên trigger re-subscribe
  const handleThreshold = useEffectEvent(() => {
    onThresholdReached();
  });

  useEffect(() => {
    function handleScroll() {
      // ← Named function
      if (window.scrollY > threshold) {
        handleThreshold();
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]); // ✅ Re-subscribe khi threshold đổi
}
```

```
EVENT LISTENER CHECKLIST:
├── Named function (không anonymous) → có thể removeEventListener
├── Cleanup: removeEventListener trong return
├── passive: true cho scroll/touch → better performance
├── Dependencies: MỌI reactive value đọc trong handler
├── useEffectEvent: cho callbacks không nên trigger re-subscribe
└── Throttle/debounce: cho scroll/resize (performance)
```

---

### Mistake 35: requestAnimationFrame Không Cleanup

```tsx
// ❌ SAI: Animation loop không cancel
function AnimatedComponent({ targetX }) {
  const [x, setX] = useState(0);

  useEffect(() => {
    function animate() {
      setX((prev) => {
        const next = prev + (targetX - prev) * 0.1;
        if (Math.abs(next - targetX) > 0.1) {
          requestAnimationFrame(animate); // ← Recursive RAF
        }
        return next;
      });
    }
    requestAnimationFrame(animate);
    // ← QUÊN cancel! targetX đổi → 2 animation loops chạy song song!
  }, [targetX]);
}
```

**✅ Fix: Cancel với cleanup**

```tsx
useEffect(() => {
  let rafId;
  let currentX = 0; // Track locally

  function animate() {
    currentX += (targetX - currentX) * 0.1;
    setX(currentX);

    if (Math.abs(currentX - targetX) > 0.1) {
      rafId = requestAnimationFrame(animate);
    }
  }

  rafId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(rafId); // ✅ Cancel khi targetX đổi
}, [targetX]);
```

```
ANIMATION EFFECT PATTERN:
1. requestAnimationFrame → cancelAnimationFrame (cleanup)
2. setInterval animation → clearInterval (cleanup)
3. CSS animation trigger → cleanup remove class
4. Web Animation API → animation.cancel() (cleanup)

RULE: MỌI frame-based loop PHẢI có cancel trong cleanup
→ Không cancel = multiple loops = janky animation + memory leak
```

---

### Mistake 36: Retry Logic Trong Effect — Infinite Retry

```tsx
// ❌ SAI: Retry không giới hạn + không handle unmount
function DataLoader({ url }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWithRetry() {
      while (true) {
        // ← INFINITE RETRY!
        try {
          const res = await fetch(url);
          if (res.ok) {
            setData(await res.json());
            return;
          }
        } catch (e) {
          await new Promise((r) => setTimeout(r, 1000)); // Wait 1s
          // ← Nếu component unmount → VẪN retry → memory leak!
        }
      }
    }
    fetchWithRetry();
  }, [url]);
}
```

**✅ Fix: Max retries + AbortController + exponential backoff**

```tsx
useEffect(() => {
  const controller = new AbortController();
  let retryCount = 0;
  const MAX_RETRIES = 3;

  async function fetchWithRetry() {
    while (retryCount < MAX_RETRIES) {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setError(null);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (e) {
        if (e.name === "AbortError") return; // ← Unmount → stop
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          setError(`Failed after ${MAX_RETRIES} retries: ${e.message}`);
          return;
        }
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount - 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  fetchWithRetry();
  return () => controller.abort(); // ✅ Cancel khi url đổi hoặc unmount
}, [url]);
```

```
RETRY CHECKLIST:
├── Max retries (KHÔNG infinite loop!)
├── AbortController cho fetch (cancel trên unmount)
├── Exponential backoff (1s → 2s → 4s → ...)
├── Error state sau max retries
├── Ignore AbortError (unmount, not real error)
└── Reset state trước retry (loading = true)
```

---

### Mistake 37: Pagination — Reset Page Khi Filter Đổi

```tsx
// ❌ SAI: Đổi filter nhưng KHÔNG reset page → hiển thị page 5 Cua filter mới
function ProductList() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts(filter, page).then(setProducts);
  }, [filter, page]);

  // User đang ở page 5 → đổi filter → fetch(newFilter, page=5)
  // Filter mới chỉ có 2 pages → page 5 = EMPTY hoặc ERROR!
}
```

**✅ Fix 1: Reset page khi filter đổi (Effect chain — acceptable here)**

```tsx
// Option A: Reset trong handler
function handleFilterChange(newFilter) {
  setFilter(newFilter);
  setPage(1); // ← Reset page CÙNG LÚC filter đổi (batched in React 18)
}

useEffect(() => {
  fetchProducts(filter, page).then(setProducts);
}, [filter, page]); // ✅ Fetch với filter MỚI + page=1
```

**✅ Fix 2: useReducer cho coordinated state**

```tsx
const [state, dispatch] = useReducer(paginationReducer, {
  filter: "all",
  page: 1,
  products: [],
});

function paginationReducer(state, action) {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, filter: action.filter, page: 1 }; // ← Auto reset!
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "SET_PRODUCTS":
      return { ...state, products: action.products };
  }
}

useEffect(() => {
  let ignore = false;
  fetchProducts(state.filter, state.page).then((products) => {
    if (!ignore) dispatch({ type: "SET_PRODUCTS", products });
  });
  return () => {
    ignore = true;
  };
}, [state.filter, state.page]);
```

```
COORDINATED STATE RULES:
├── 2+ state values PHẢI thay đổi CÙNG LÚC?
│   → useReducer (1 dispatch = 1 transition = consistent)
├── State A thay đổi → State B PHẢI reset?
│   → Đặt logic reset TRONG reducer (không phải Effect)
├── Derived state từ multiple sources?
│   → useReducer + tính derived trong render body
└── AVOID: Effect 1 set stateA → Effect 2 reset stateB → race condition!
```

---

### Mistake 38: WebSocket — Reconnect Logic Phức Tạp Trong Effect

```tsx
// ❌ SAI: Reconnect logic quá phức tạp trong 1 Effect
function Chat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let reconnectAttempts = 0;

    function connect() {
      ws = new WebSocket(`wss://chat.example.com/${roomId}`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0;
      };

      ws.onmessage = (e) => {
        setMessages((prev) => [...prev, JSON.parse(e.data)]);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectAttempts < 5) {
          reconnectAttempts++;
          const delay = Math.pow(2, reconnectAttempts) * 1000;
          reconnectTimer = setTimeout(connect, delay);
          // ← reconnectTimer có thể bị orphaned nếu cleanup chạy giữa chừng!
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer); // ← Chỉ clear timer CUỐI CÙNG
      ws.close(); // ← Nhưng nếu ws bị overwrite bởi reconnect???
      // BUG: ws reference là connection MỚI NHẤT, connections CŨ vẫn sống!
    };
  }, [roomId]);
}
```

**✅ Fix: Proper cleanup tracking**

```tsx
useEffect(() => {
  let isCleanedUp = false;
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;

  function connect() {
    if (isCleanedUp) return; // ← Guard: không connect sau cleanup

    ws = new WebSocket(`wss://chat.example.com/${roomId}`);

    ws.onopen = () => {
      if (isCleanedUp) {
        ws.close();
        return;
      }
      setIsConnected(true);
      reconnectAttempts = 0;
    };

    ws.onmessage = (e) => {
      if (isCleanedUp) return;
      setMessages((prev) => [...prev, JSON.parse(e.data)]);
    };

    ws.onclose = () => {
      if (isCleanedUp) return; // ← Không reconnect nếu đã cleanup
      setIsConnected(false);
      if (reconnectAttempts < 5) {
        reconnectAttempts++;
        const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
        reconnectTimer = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => ws.close();
  }

  connect();

  return () => {
    isCleanedUp = true; // ← Flag TRƯỚC khi close
    clearTimeout(reconnectTimer);
    if (ws) {
      ws.onclose = null; // ← Ngăn reconnect trigger
      ws.close();
    }
  };
}, [roomId]);
```

```
WEBSOCKET CLEANUP GOTCHAS:
├── isCleanedUp flag: PHẢI check trước MỌI state update
├── ws.onclose = null: Ngăn reconnect khi cleanup gọi ws.close()
├── clearTimeout: Cancel pending reconnect
├── Guard trong connect(): Không tạo WS mới sau cleanup
├── Max reconnect delay: cap ở 30s (không để exponential quá lớn)
└── Cân nhắc: Dùng library (socket.io, reconnecting-websocket)
```

---

### Mistake 39: Effect Không Testable — Tight Coupling

```tsx
// ❌ SAI: Effect phụ thuộc global/browser APIs → khó test
function UserTracker({ userId }) {
  useEffect(() => {
    // Tight coupling với browser API
    const startTime = performance.now();

    // Tight coupling với global analytics
    window.analytics.track("page_view", { userId });

    // Tight coupling với DOM
    document.title = `User ${userId}`;

    return () => {
      const duration = performance.now() - startTime;
      window.analytics.track("page_leave", { userId, duration });
    };
  }, [userId]);
  // TEST: Phải mock window.analytics, performance, document
  // → Brittle tests, hard to maintain
}
```

**✅ Fix: Inject dependencies → testable**

```tsx
// Hook nhận dependencies qua params
function useUserTracking(userId, { analytics, getTime, setTitle }) {
  useEffect(() => {
    const startTime = getTime();
    analytics.track("page_view", { userId });
    setTitle(`User ${userId}`);

    return () => {
      const duration = getTime() - startTime;
      analytics.track("page_leave", { userId, duration });
    };
  }, [userId, analytics, getTime, setTitle]);
}

// Production:
function UserTracker({ userId }) {
  useUserTracking(userId, {
    analytics: window.analytics,
    getTime: () => performance.now(),
    setTitle: (t) => {
      document.title = t;
    },
  });
}

// Test:
test("tracks page view", () => {
  const mockAnalytics = { track: jest.fn() };
  const mockGetTime = jest.fn().mockReturnValue(1000);
  const mockSetTitle = jest.fn();

  renderHook(() =>
    useUserTracking("user-1", {
      analytics: mockAnalytics,
      getTime: mockGetTime,
      setTitle: mockSetTitle,
    }),
  );

  expect(mockAnalytics.track).toHaveBeenCalledWith("page_view", {
    userId: "user-1",
  });
  expect(mockSetTitle).toHaveBeenCalledWith("User user-1");
});
```

```
TESTING EFFECT PATTERNS:
├── Inject dependencies → mock trong test
├── Extract logic ra pure function → test function riêng
├── Custom hook → renderHook() từ @testing-library/react-hooks
├── Timers → jest.useFakeTimers()
├── Fetch → MSW (Mock Service Worker) hoặc jest.mock
├── Cleanup → verify trong afterEach
└── Act warnings → wrap state updates trong act()
```

---

### Mistake 40: Master Decision Flowchart — Tổng Hợp 40 Mistakes

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MASTER DECISION FLOWCHART                             │
│            Khi bạn viết useEffect — HỎI theo thứ tự sau:                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ❓ "CÓ THẬT SỰ CẦN Effect KHÔNG?"                                      │
│ ├── Derived state? → Tính trong render body (#10)                        │
│ ├── Event-specific? → Event Handler (#5)                                 │
│ ├── Form validation? → Render body (#19)                                 │
│ ├── Navigation? → <Navigate /> component (#26)                           │
│ └── Props mirror? → Dùng prop trực tiếp (#12)                           │
│                                                                          │
│ ❓ "DEPENDENCIES ĐÚNG CHƯA?"                                            │
│ ├── Linter warning? → ĐỪNG suppress (#1)                                │
│ ├── Object/fn trong deps? → Di chuyển vào Effect (#2)                   │
│ ├── ref.current trong deps? → Callback ref (#13)                         │
│ ├── Conditional read? → Vẫn phải khai báo (#29)                         │
│ └── Callback prop? → useEffectEvent (#23)                                │
│                                                                          │
│ ❓ "CLEANUP ĐÚNG CHƯA?"                                                 │
│ ├── Subscription? → return unsubscribe (#6)                              │
│ ├── Timer? → clearTimeout/clearInterval (#27)                            │
│ ├── Fetch? → ignore flag / AbortController (#8)                          │
│ ├── RAF? → cancelAnimationFrame (#35)                                    │
│ ├── WebSocket? → ws.close + guard flag (#38)                             │
│ └── Async cleanup? → KHÔNG! Sync only (#15)                              │
│                                                                          │
│ ❓ "STRUCTURE ĐÚNG CHƯA?"                                               │
│ ├── Multiple concerns? → Split Effects (#11)                             │
│ ├── Effect chain? → Gom lại / Event Handler (#17)                        │
│ ├── Mix sync+async? → Tách riêng (#24)                                   │
│ ├── Redundant state? → Single source of truth (#25)                      │
│ └── Coordinated state? → useReducer (#37)                                │
│                                                                          │
│ ❓ "EDGE CASES?"                                                         │
│ ├── StrictMode safe? → Cleanup idempotent (#28)                          │
│ ├── Race condition? → ignore / abort (#8)                                │
│ ├── Stale closure? → Updater fn / ref (#9)                               │
│ ├── Infinite loop? → Check deps + setState (#3)                          │
│ ├── Global singleton? → Module-level init (#21)                          │
│ └── Cross-tab sync? → storage event (#33)                                │
│                                                                          │
│ ❓ "QUALITY?" (#30 Code Review + #39 Testing)                            │
│ ├── Testable? → Inject dependencies                                      │
│ ├── Custom hook stable? → useMemo/useCallback return (#31)               │
│ ├── Correct timing? → useLayoutEffect cho DOM (#32)                      │
│ ├── Retry safe? → Max retries + abort (#36)                              │
│ └── Code review done? → USE CHECKLIST (#30)                              │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 📊 MISTAKES BY CATEGORY:                                                 │
│                                                                          │
│ 🏗️ ARCHITECTURE (nên dùng gì thay Effect):                              │
│    #5 Event Handler, #10 Derived, #12 Mirror, #19 Validation,           │
│    #26 Navigation, #18 setState in render                                │
│                                                                          │
│ 📋 DEPENDENCIES (khai báo sai):                                          │
│    #1 Suppress, #2 Object, #4 Fetch+Object, #7 useMemo wrapper,        │
│    #13 ref.current, #23 Callback prop, #29 Conditional                   │
│                                                                          │
│ 🧹 CLEANUP (thiếu hoặc sai):                                            │
│    #6 Subscription, #8 Race condition, #15 Async, #27 Debounce,         │
│    #28 StrictMode, #34 Event listener, #35 RAF, #38 WebSocket           │
│                                                                          │
│ 🔄 LOOPS & PERFORMANCE:                                                  │
│    #3 State loop, #9 Stale closure, #14 Context, #17 Chain,             │
│    #25 Redundant state, #36 Retry, #37 Pagination                       │
│                                                                          │
│ 🛠️ PATTERNS & QUALITY:                                                   │
│    #21 Singleton, #22 Initializer, #24 Sync+Async, #31 Custom hook,    │
│    #32 Layout timing, #33 localStorage, #39 Testing, #30 Review         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Mistake 41: IntersectionObserver — Không Disconnect + Stale Callback

```tsx
// ❌ SAI: Observer không cleanup + callback stale
function LazyImage({ src, onVisible }) {
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onVisible(src); // ← Đọc onVisible nhưng không khai báo dep
        observer.unobserve(entries[0].target); // ← Chỉ unobserve 1 element
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    // ← THIẾU cleanup! Observer VẪN tồn tại sau unmount
  }, []); // ← Thiếu deps: src, onVisible

  return <img ref={imgRef} data-src={src} />;
}
```

**✅ Fix: Full cleanup + stable callbacks**

```tsx
function LazyImage({ src, onVisible }) {
  const imgRef = useRef(null);

  const handleVisible = useEffectEvent(() => {
    onVisible(src); // ← Luôn đọc giá trị MỚI NHẤT
  });

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleVisible();
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }, // ← Configure sensitivity
    );

    observer.observe(el);

    return () => {
      observer.disconnect(); // ✅ Disconnect TOÀN BỘ observer
    };
  }, []); // ✅ Effect chỉ setup observer 1 lần

  return <img ref={imgRef} data-src={src} />;
}
```

```
OBSERVER CLEANUP PATTERN:
├── IntersectionObserver → .disconnect() (cleanup toàn bộ)
├── MutationObserver → .disconnect()
├── ResizeObserver → .disconnect()
├── PerformanceObserver → .disconnect()
├── ReportingObserver → .disconnect()

QUAN TRỌNG:
- .unobserve(element) = chỉ dừng observe 1 element
- .disconnect() = dừng observe TẤT CẢ elements + cleanup internal resources
- LUÔN dùng .disconnect() trong cleanup function
- Lưu reference đến element TRƯỚC khi dùng trong cleanup:
  const el = ref.current; // ← Copy trước! ref.current có thể null trong cleanup
```

---

### Mistake 42: Multiple API Calls — Waterfall Thay Vì Parallel

```tsx
// ❌ SAI: Sequential fetches (waterfall) — CHẬM!
function Dashboard({ userId }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function loadData() {
      const p = await fetch(`/api/profile/${userId}`); // 500ms
      setProfile(await p.json());

      const o = await fetch(`/api/orders/${userId}`); // 300ms
      setOrders(await o.json());

      const n = await fetch(`/api/notifications/${userId}`); // 200ms
      setNotifications(await n.json());
    }
    loadData();
    // TỔNG: 500 + 300 + 200 = 1000ms (sequential)
    // ← Mỗi request PHẢI đợi request trước hoàn thành!
  }, [userId]);
}
```

**✅ Fix: Promise.all cho parallel requests**

```tsx
useEffect(() => {
  let ignore = false;

  async function loadData() {
    try {
      // 3 requests ĐỒNG THỜI — tổng = max(500, 300, 200) = 500ms!
      const [profileRes, ordersRes, notifRes] = await Promise.all([
        fetch(`/api/profile/${userId}`),
        fetch(`/api/orders/${userId}`),
        fetch(`/api/notifications/${userId}`),
      ]);

      if (ignore) return;

      const [profile, orders, notifications] = await Promise.all([
        profileRes.json(),
        ordersRes.json(),
        notifRes.json(),
      ]);

      if (ignore) return;

      setProfile(profile);
      setOrders(orders);
      setNotifications(notifications);
      // React 18: batched → 1 re-render!
    } catch (err) {
      if (!ignore) setError(err.message);
    }
  }

  loadData();
  return () => {
    ignore = true;
  };
}, [userId]);
```

```
PARALLEL VS SEQUENTIAL:

Sequential (await lần lượt):
├── Request A: ─────────────── (500ms)
├── Request B:                 ──────────── (300ms)
├── Request C:                              ─────── (200ms)
└── TỔNG: 1000ms

Parallel (Promise.all):
├── Request A: ─────────────── (500ms)
├── Request B: ──────────── (300ms)
├── Request C: ─────── (200ms)
└── TỔNG: 500ms (= max) → NHANH GẤP 2!

KHI NÀO DÙNG:
├── Promise.all: Requests KHÔNG phụ thuộc nhau → parallel
├── Sequential: Request B CẦN result A → phải đợi
├── Promise.allSettled: Muốn TẤT CẢ kết quả dù có lỗi
└── Promise.race: Chỉ cần response ĐẦU TIÊN
```

---

### Mistake 43: URL Search Params Sync — Two-Way Binding Loop

```tsx
// ❌ SAI: Effect sync state ↔ URL → potential loop
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Effect 1: URL → State
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]); // ← searchParams đổi → setQuery → re-render

  // Effect 2: State → URL
  useEffect(() => {
    setSearchParams({ q: query });
  }, [query, setSearchParams]); // ← query đổi → setSearchParams → searchParams đổi
  // → LOOP: Effect 1 → setQuery → Effect 2 → setSearchParams → Effect 1 → ...
}
```

**✅ Fix: Single source of truth = URL**

```tsx
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || ""; // ← URL LÀ source of truth

  function handleSearch(newQuery) {
    setSearchParams({ q: newQuery }); // ← Event Handler cập nhật URL
    // URL đổi → re-render → query tự cập nhật (derived từ URL)
  }

  useEffect(() => {
    // CHỈ dùng Effect cho side effect thực sự
    if (query) {
      fetchResults(query).then(setResults);
    }
  }, [query]); // ✅ query derived từ URL → stable → không loop

  return <input value={query} onChange={(e) => handleSearch(e.target.value)} />;
}
```

```
URL SYNC RULES:
├── URL = Single Source of Truth (KHÔNG copy vào state)
├── Derive state TỪ URL: const x = searchParams.get('x')
├── Update URL qua Event Handler (KHÔNG qua Effect)
├── Effect CHỈ cho side effects (fetch) dựa trên URL values
├── Two-way sync (state ↔ URL) = GUARANTEED LOOP → TRÁNH!
└── Library (react-router, nuqs) xử lý URL state tốt hơn tự viết
```

---

### Mistake 44: Media Query Listener — Không Dùng matchMedia Event

```tsx
// ❌ SAI: Check media query trong resize event → tốn hiệu năng
function ResponsiveComponent() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      // ← Chạy MỖI pixel resize → hàng trăm lần/giây!
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
}
```

**✅ Fix: matchMedia API — chỉ fire khi threshold cross**

```tsx
function ResponsiveComponent() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");

    function handleChange(e) {
      setIsMobile(e.matches);
      // ← CHỈ chạy khi VƯỢT QUA threshold 767px → hiệu quả hơn!
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

```
SO SÁNH:

resize event:
├── Fire hàng trăm lần khi kéo resize
├── setIsMobile có thể gọi 200 lần (dù giá trị KHÔNG ĐỔI)
├── React batch → OK nhưng VẪN check mỗi lần → lãng phí CPU
└── Cần throttle/debounce thủ công

matchMedia:
├── CHỈ fire khi cross threshold (768px)
├── setIsMobile chạy TỐI ĐA 2 lần (mobile → desktop → mobile)
├── Zero JS execution khi resize trong cùng breakpoint
└── Browser native optimization → TỐT HƠN throttle
```

---

### Mistake 45: Third-Party Library — Init/Destroy Trong Effect

```tsx
// ❌ SAI: Chart library init nhưng không destroy
function Chart({ data, options }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const chart = new ChartJS(canvasRef.current, {
      data,
      ...options,
    });
    // ← THIẾU cleanup! Chart cũ VẪN tồn tại khi data/options đổi
    // → Memory leak + canvas bị vẽ đè → visual glitches
  }, [data, options]); // ← options là object → có thể new mỗi render!
}
```

**✅ Fix: Proper init/destroy lifecycle**

```tsx
function Chart({ data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null); // ← Keep reference to chart instance

  // Destructure primitives từ options
  const { type, responsive, animation } = options;

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy chart CŨ trước khi tạo mới
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new ChartJS(canvasRef.current, {
      type,
      data,
      options: { responsive, animation },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy(); // ✅ Cleanup chart instance
        chartRef.current = null;
      }
    };
  }, [data, type, responsive, animation]); // ✅ Primitive deps

  return <canvas ref={canvasRef} />;
}
```

```
THIRD-PARTY LIBRARY PATTERN:
├── Init: Create instance trong Effect setup
├── Ref: Lưu instance vào useRef (persist across renders)
├── Update: Destroy cũ → create mới (hoặc dùng library update API)
├── Cleanup: Destroy trong return function
├── Deps: Destructure options → primitive deps

COMMON LIBRARIES CẦN CLEANUP:
├── Chart.js → chart.destroy()
├── Leaflet/Mapbox → map.remove()
├── D3.js → manual DOM cleanup
├── Swiper → swiper.destroy()
├── CodeMirror → editor.destroy()
├── TinyMCE → editor.destroy()
├── Socket.io → socket.disconnect()
├── Three.js → renderer.dispose()
└── Monaco Editor → editor.dispose()
```

---

### Mistake 46: Key Prop Reset vs Effect Reset — Chọn Sai Pattern

```tsx
// ❌ SAI: Dùng Effect để reset state khi prop đổi
function ProfileEditor({ userId }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  // Reset TẤT CẢ state khi userId đổi
  useEffect(() => {
    setName("");
    setEmail("");
    setBio("");
    // Nếu thêm field mới → PHẢI nhớ thêm reset ở đây → dễ quên!
  }, [userId]);
  // → 2 renders: render cũ (stale) → Effect reset → render mới (blank)
}
```

**✅ Fix: key prop — React tự reset MỌI state**

```tsx
// Parent:
function ProfilePage({ userId }) {
  return <ProfileEditor key={userId} userId={userId} />;
  //                     ^^^^^^^^^ key đổi → React UNMOUNT cũ → MOUNT mới
  //                     → TẤT CẢ state tự reset → KHÔNG cần Effect!
}

// Child (clean, không Effect):
function ProfileEditor({ userId }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  // ← KHÔNG cần Effect reset! key prop + React = tự động!
  // ← Thêm field mới? Tự reset! Không sót!
}
```

```
KEY PROP VS EFFECT RESET:

Effect reset:
├── Phải liệt kê TỪNG state cần reset
├── Thêm state mới → phải nhớ thêm reset → dễ quên
├── 2 renders (stale → reset)
├── Cleanup effects KHÔNG tự chạy
└── Complex, error-prone

Key prop reset:
├── TẤT CẢ state auto-reset (bao gồm state trong children!)
├── Thêm state mới → tự reset → KHÔNG cần sửa gì
├── 1 render (unmount cũ + mount mới = clean)
├── Cleanup effects TỰ ĐỘNG chạy khi unmount
└── Simple, correct, React-native pattern

KHI NÀO DÙNG KEY:
├── userId/entityId đổi → reset form → KEY ✅
├── Tab switch → reset content → KEY ✅
├── Chat room đổi → reset messages → KEY ✅
├── Chỉ reset 1-2 fields → Effect OK (ít hơn key overhead)
└── Performance concern (child component nặng) → Effect (tránh unmount)
```

---

### Mistake 47: Portal Event Bubbling — Effect Listener Trên Wrong Target

```tsx
// ❌ SAI: Click outside detection bị Portal phá vỡ
function Dropdown({ isOpen, onClose, children }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose(); // ← Portal content cũng trigger "outside"!
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef}>
      <button>Toggle</button>
      {isOpen &&
        createPortal(
          <div className="dropdown-menu">{children}</div>,
          document.body, // ← Portal render NGOÀI dropdownRef!
        )}
    </div>
  );
  // Click menu item → DOM: ngoài dropdownRef → onClose() → BUG!
  // React event: bubble đúng, nhưng DOM contains() check SAI
}
```

**✅ Fix: Track cả portal container**

```tsx
function Dropdown({ isOpen, onClose, children }) {
  const dropdownRef = useRef(null);
  const portalRef = useRef(null);

  const handleClose = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      const clickedInsideDropdown = dropdownRef.current?.contains(e.target);
      const clickedInsidePortal = portalRef.current?.contains(e.target);

      if (!clickedInsideDropdown && !clickedInsidePortal) {
        handleClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef}>
      <button>Toggle</button>
      {isOpen &&
        createPortal(
          <div ref={portalRef} className="dropdown-menu">
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
```

```
PORTAL + EFFECT GOTCHAS:
├── DOM tree ≠ React tree khi dùng Portal
├── .contains() check DOM tree → Portal element = OUTSIDE
├── React event bubbling follows React tree (Portal → parent)
├── DOM event bubbling follows DOM tree (Portal → body)
├── Fix: Track BOTH refs (trigger + portal content)
├── Alternative: Dùng React onBlur/onFocusCapture thay vì document listener
└── Library: Radix/Headless UI handle Portal click-outside correctly
```

---

### Mistake 48: SSR Hydration Mismatch — Effect Che Giấu Bug

```tsx
// ❌ SAI: Render khác nhau giữa server và client
function Greeting() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ← "Fix" hydration mismatch bằng 2-pass render
  }, []);

  if (!mounted) return null; // ← Server: null, Client pass 1: null
  return <div>Hello, {new Date().toLocaleString()}</div>;
  // ← Client pass 2: content
  // "Works" nhưng CHE GIẤU vấn đề thực: content flicker + no SEO
}
```

**Tại sao sai:**

```
SSR FLOW:
1. Server: mounted=false → render null → HTML = empty
2. Client hydrate: mounted=false → render null → match ✅ (nhưng user thấy NOTHING!)
3. Effect: setMounted(true) → re-render → content hiện ra
4. User thấy: blank → flash → content = BAD UX
5. SEO: search engine thấy empty HTML → BAD SEO

ĐÚNG RA:
- Server NÊN render content (cho SEO + initial paint)
- Client NÊN match server content
- Dynamic values (Date, Math.random) → không nên render server-side
```

**✅ Fix 1: Render static content on server, enhance on client**

```tsx
function Greeting() {
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const id = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      Hello!{" "}
      {currentTime ? (
        <span>Current time: {currentTime}</span>
      ) : (
        <span>Loading time...</span> // ← CÙNG trên server + client pass 1
      )}
    </div>
  );
}
```

**✅ Fix 2: suppressHydrationWarning cho dynamic values**

```tsx
function Greeting() {
  return (
    <div>
      Hello! <time suppressHydrationWarning>{new Date().toLocaleString()}</time>
      {/* ← Server time ≠ client time → mismatch OK cho <time> */}
    </div>
  );
}
```

```
SSR + EFFECT RULES:
├── Effect KHÔNG chạy trên server → client-only side effects
├── Server render NÊN có content (SEO + first paint)
├── mounted state pattern = anti-pattern (che giấu real issue)
├── Dynamic values → suppressHydrationWarning hoặc client-only render
├── useId() cho unique IDs (server + client consistent)
└── Next.js: 'use client' directive cho client components
```

---

### Mistake 49: Effect Ordering — Giả Định Thứ Tự Effects

```tsx
// ❌ SAI: Giả định Effect 1 chạy XONG trước Effect 2
function Dashboard() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);

  // Effect 1: Fetch user
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  // Effect 2: Fetch settings (GIẢ ĐỊNH user đã có)
  useEffect(() => {
    if (user) {
      fetchSettings(user.id).then(setSettings);
    }
  }, [user]); // ← "Hoạt động" nhưng vì TIMING, không vì ordering

  // Effect 3: Setup analytics (GIẢ ĐỊNH user + settings đã có)
  useEffect(() => {
    if (user && settings) {
      analytics.init(user.id, settings.trackingId);
    }
  }, [user, settings]); // ← Chain of Effects!
}
```

**Tại sao sai:**

```
REACT EFFECT ORDER GUARANTEE:
- Effects TRONG CÙNG 1 COMPONENT: chạy THEO THỨ TỰ khai báo
- NHƯNG: async operations bên trong KHÔNG guaranteed order!
- Effect 1 FIRE trước Effect 2
- NHƯNG fetchUser() resolve BẤT KỲ LÚC NÀO
- → user có thể null khi Effect 2 check → OK (guarded by if)
- → NHƯNG tạo Effect chain → khó reason about

THỰC TẾ FLOW:
Render 1: Effect 1 fires (fetch user) + Effect 2 fires (user=null → skip) + Effect 3 fires (skip)
...async...
Render 2: user loaded → Effect 2 fires (fetch settings) + Effect 3 fires (settings=null → skip)
...async...
Render 3: settings loaded → Effect 3 fires (init analytics)
→ 3+ renders, multiple Effect runs, hard to debug timing!
```

**✅ Fix: Gom related async vào 1 Effect**

```tsx
function Dashboard() {
  const [state, setState] = useState({
    user: null,
    settings: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const user = await fetchUser();
        if (ignore) return;

        const settings = await fetchSettings(user.id);
        if (ignore) return;

        analytics.init(user.id, settings.trackingId);

        setState({ user, settings, loading: false, error: null });
      } catch (err) {
        if (!ignore) {
          setState((s) => ({ ...s, loading: false, error: err.message }));
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);
  // ✅ 1 Effect, clear flow, 1 final setState, no chain
}
```

```
EFFECT ORDERING RULES:
├── Effects chạy theo thứ tự khai báo (synchronous ordering)
├── Async operations bên trong KHÔNG guaranteed order
├── KHÔNG GIẢ ĐỊNH Effect N xong trước Effect N+1 (async)
├── Related async → GOM vào 1 Effect (sequential await)
├── Independent async → TÁCH Effects (parallel, không phụ thuộc)
├── Effect chain (A setState → B runs → C setState → D runs...)
│   → Refactor: gom hoặc dùng useReducer
└── Debug: React DevTools "Profiler" → see Effect execution order
```

---

### Mistake 50: Real-World Debugging Case Study — Tổng Hợp

```
┌──────────────────────────────────────────────────────────────────────────┐
│           CASE STUDY: BUG THỰC TẾ TỪ PRODUCTION                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ BUG REPORT: "Chat messages hiển thị ở room sai sau khi switch rooms"    │
│                                                                          │
│ CODE GỐC (6 mistakes cùng lúc!):                                        │
│                                                                          │
│  function ChatRoom({ roomId, user }) {                                   │
│    const [messages, setMessages] = useState([]);                         │
│    const [isTyping, setIsTyping] = useState(false);                      │
│                                                                          │
│    const options = { roomId, userId: user.id }; // ← #2 object dept      │
│                                                                          │
│    useEffect(() => {                                                     │
│      // eslint-disable-next-line react-hooks/exhaustive-deps             │
│      const ws = new WebSocket(WS_URL);  // ← #1 suppress + #6 cleanup   │
│                                                                          │
│      ws.onopen = () => {                                                 │
│        ws.send(JSON.stringify(options)); // ← #2 stale closure           │
│      };                                                                  │
│                                                                          │
│      ws.onmessage = (e) => {                                             │
│        const msg = JSON.parse(e.data);                                   │
│        setMessages([...messages, msg]); // ← #9 stale closure            │
│      };                                                                  │
│                                                                          │
│      if (user.role === 'admin') { // ← #29 conditional dep              │
│        logAdminJoin(roomId);                                             │
│      }                                                                   │
│    }, []);  // ← #1 deps = [] nhưng đọc options, messages, user          │
│  }                                                                       │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ DEBUGGING PROCESS:                                                       │
│                                                                          │
│ Step 1: Reproduce                                                        │
│ → Join room "music" → see messages                                       │
│ → Switch to "travel" → see "music" messages!                             │
│                                                                          │
│ Step 2: Check deps                                                       │
│ → deps = [] → Effect chạy 1 lần → WS connect "music" MÃI MÃI           │
│ → roomId đổi → Effect KHÔNG chạy lại → WS VẪN connect "music"           │
│                                                                          │
│ Step 3: Check closure                                                    │
│ → messages trong onmessage = [] (closure từ mount)                       │
│ → Mỗi message mới: [...[], msg] = [msg] → CHỈ giữ 1 message!           │
│                                                                          │
│ Step 4: Check cleanup                                                    │
│ → Không có return → WS KHÔNG close → memory leak                         │
│ → Nếu có roomId dep → WS cũ VẪN sống → dual connections!                │
│                                                                          │
│ Step 5: Check suppress                                                   │
│ → eslint-disable → linter ĐÃ CẢNH BÁO nhưng bị ignore                  │
│ → Remove suppress → linter yêu cầu: [options, messages, user]           │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ FIX (áp dụng 6 techniques):                                             │
│                                                                          │
│  function ChatRoom({ roomId, user }) {                                   │
│    const [messages, setMessages] = useState([]);                         │
│                                                                          │
│    const onAdminJoin = useEffectEvent(() => { // ← Fix #29              │
│      if (user.role === 'admin') logAdminJoin(roomId);                    │
│    });                                                                   │
│                                                                          │
│    useEffect(() => {                                                     │
│      const ws = new WebSocket(`${WS_URL}?room=${roomId}`);               │
│      //                                     ^^^^^^^^ Fix #2: inline      │
│                                                                          │
│      ws.onopen = () => {                                                 │
│        ws.send(JSON.stringify({ roomId, userId: user.id }));             │
│        onAdminJoin(); // Fix #29: useEffectEvent                         │
│      };                                                                  │
│                                                                          │
│      ws.onmessage = (e) => {                                             │
│        const msg = JSON.parse(e.data);                                   │
│        setMessages(prev => [...prev, msg]); // Fix #9: updater fn       │
│      };                                                                  │
│                                                                          │
│      return () => {                                                      │
│        ws.onclose = null; // Fix #38: prevent reconnect                  │
│        ws.close();        // Fix #6: cleanup                             │
│      };                                                                  │
│    }, [roomId, user.id]); // Fix #1: correct deps (no suppress!)        │
│  }                                                                       │
│                                                                          │
│ TECHNIQUES APPLIED:                                                      │
│ #1  Remove suppress → khai báo deps đúng                                │
│ #2  Inline options → primitives thay vì object                           │
│ #6  Return cleanup → ws.close()                                          │
│ #9  Updater function → prev => [...prev, msg]                            │
│ #29 useEffectEvent → conditional read không trigger re-sync              │
│ #38 ws.onclose = null → prevent reconnect on cleanup                     │
│                                                                          │
│ RESULT: Room switch = clean disconnect + reconnect + fresh messages ✅   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN D: INTERVIEW TIPS & TALKING POINTS

> 🎯 Cách nói về Effect Dependencies trong phỏng vấn Senior Frontend — từ câu hỏi cơ bản đến system design.

### 1. Câu Hỏi Phỏng Vấn Phổ Biến — Phân Level

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    INTERVIEW QUESTIONS BY LEVEL                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 🟢 JUNIOR (L3-L4): Kiến thức cơ bản                                     │
│ Q1: "useEffect dependencies là gì?"                                      │
│ Q2: "[] khác [value] khác không có array?"                               │
│ Q3: "Tại sao Effect chạy lại khi thay đổi dependency?"                  │
│ Q4: "Cleanup function dùng để làm gì?"                                   │
│ Q5: "Khi nào nên dùng useEffect?"                                        │
│                                                                          │
│ 🟡 MID (L4-L5): Hiểu cơ chế bên dưới                                   │
│ Q6: "Tại sao object trong deps gây infinite loop?"                       │
│ Q7: "Stale closure là gì? Cách fix?"                                     │
│ Q8: "Race condition trong Effect? Cách handle?"                          │
│ Q9: "useEffect vs useLayoutEffect?"                                      │
│ Q10: "Khi nào Effect KHÔNG nên dùng?"                                    │
│                                                                          │
│ 🔴 SENIOR (L5-L6): Kiến trúc và philosophy                              │
│ Q11: "Mental model đúng của Effect là gì?"                               │
│ Q12: "Giải thích useEffectEvent — tại sao cần?"                          │
│ Q13: "React Compiler/Forget ảnh hưởng gì đến deps?"                     │
│ Q14: "Signals vs Dependencies — trade-offs?"                             │
│ Q15: "Thiết kế custom hook với stable API — approach?"                   │
│                                                                          │
│ 🟣 STAFF+ (L6+): System thinking                                        │
│ Q16: "Tại sao React chọn comparison model này?"                          │
│ Q17: "Effect system và React Fiber — mối quan hệ?"                      │
│ Q18: "Concurrent mode ảnh hưởng Effects thế nào?"                        │
│ Q19: "Migrate class components → hooks — chiến lược?"                    │
│ Q20: "Code review strategy cho Effect-heavy codebase?"                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2. Câu Trả Lời Mẫu — Junior Level

```
Q1: "useEffect dependencies là gì?"

❌ TRẢ LỜI THƯỜNG:
"Dependencies là danh sách biến mà useEffect theo dõi,
 khi biến thay đổi thì Effect sẽ chạy lại."

✅ TRẢ LỜI TỐT:
"Dependencies là danh sách reactive values mà Effect ĐỌC bên trong.
 React dùng list này để quyết định KHI NÀO cần re-synchronize
 Effect với external system.

 Quan trọng: dependencies MÔ TẢ code, không phải ngược lại.
 Nếu Effect đọc roomId, thì roomId PHẢI có trong deps.
 Đây là invariant — giống như = trong toán học."

💡 SIGNAL ĐỂ INTERVIEWER ĐỂ Ý:
- "reactive values" thay vì "biến" → hiểu concept
- "re-synchronize" thay vì "chạy lại" → hiểu mental model
- "MÔ TẢ code" → hiểu philosophy
```

```
Q4: "Cleanup function dùng để làm gì?"

❌ THƯỜNG: "Để cleanup khi component unmount"

✅ TỐT: "Cleanup function chạy trong 2 trường hợp:
 1. TRƯỚC khi Effect chạy lại (với deps mới)
 2. Khi component unmount

 Mục đích: 'undo' side effect cũ trước khi setup mới.
 Ví dụ: disconnect WebSocket cũ → connect mới khi roomId đổi.
 Trong StrictMode, React mount-unmount-mount để verify
 cleanup hoạt động đúng."

💡 SIGNALS:
- Biết cleanup chạy TRƯỚC re-run (không chỉ unmount)
- Biết StrictMode purpose
```

### 3. Câu Trả Lời Mẫu — Mid Level

```
Q6: "Tại sao object trong deps gây infinite loop?"

❌ THƯỜNG: "Vì object thay đổi mỗi render"

✅ TỐT: "Mỗi render, JavaScript tạo object LITERAL mới.
 React so sánh deps bằng Object.is (reference equality).
 Object mới = reference khác = deps 'thay đổi' = Effect chạy.

 Nếu Effect có setState → re-render → object mới → Effect chạy lại → LOOP.

 4 cách fix, ranked:
 1. Di chuyển object creation VÀO Effect (tốt nhất)
 2. Destructure primitives trước Effect
 3. useMemo wrap object (nếu cần pass to child)
 4. Custom comparison (last resort, có trade-offs)

 Root cause: JavaScript không có structural equality (===),
 và React chọn O(1) reference check thay vì O(n) deep compare
 vì deps được check MỌI render."

💡 SIGNALS: Biết Object.is, biết ranked solutions, biết WHY
```

```
Q8: "Race condition trong Effect? Cách handle?"

✅ TRẢ LỜI CHUẨN:
"Race condition xảy ra khi user thay đổi input nhanh →
 multiple fetches → response về KHÔNG ĐÚNG THỨ TỰ.

 Ví dụ: search 'abc' → search 'abcd'
 - Fetch 'abcd' response về trước → hiển thị
 - Fetch 'abc' response về SAU → OVERWRITE results!

 2 cách fix:

 Cách 1: ignore flag (simple)
 useEffect(() => {
   let ignore = false;
   fetch(url).then(data => { if (!ignore) setData(data); });
   return () => { ignore = true; };
 }, [url]);

 Cách 2: AbortController (preferred — cancel network request)
 useEffect(() => {
   const controller = new AbortController();
   fetch(url, { signal: controller.signal }).then(...)
   return () => controller.abort();
 }, [url]);

 Cách 2 tốt hơn vì thực sự CANCEL request → save bandwidth."
```

### 4. Câu Trả Lời Mẫu — Senior Level

```
Q11: "Mental model đúng của Effect là gì?"

✅ TRẢ LỜI SENIOR:
"Effect KHÔNG PHẢI lifecycle method (componentDidMount/Update).
 Effect LÀ synchronization machine — giữ component đồng bộ
 với external system (server, DOM, browser API).

 Analogy: Excel formula =A1+B1
 - Khi A1 hoặc B1 thay đổi → cell tự cập nhật
 - Dependencies = [A1, B1]
 - Effect = formula
 - External system = cell value

 Hệ quả:
 1. Không nên dùng Effect cho derived state (tính trong render)
 2. Không nên dùng Effect cho event handling (dùng handler)
 3. Effect chỉ cho: data fetching, subscriptions, DOM sync, analytics

 React muốn dev rơi vào 'Pit of Success':
 - Easy to do right, hard to do wrong
 - Linter = guardrail, không phải gợi ý"

💡 SENIOR SIGNALS:
- Phân biệt sync machine vs lifecycle
- Analogy rõ ràng
- Biết "Pit of Success" philosophy
- Biết khi nào KHÔNG dùng Effect
```

```
Q12: "Giải thích useEffectEvent — tại sao cần?"

✅ TRẢ LỜI SENIOR:
"useEffectEvent giải quyết bài toán: đọc reactive value
 NHƯNG không trigger re-synchronization.

 Ví dụ kinh điển: Chat room
 - Effect connect(roomId) → deps: [roomId]
 - Khi connected, gọi showNotification(theme)
 - theme là reactive → linter bắt thêm vào deps
 - Nhưng theme đổi → reconnect WebSocket = WRONG!

 useEffectEvent tạo stable function reference:
 - Luôn đọc giá trị MỚI NHẤT (theme)
 - Reference KHÔNG ĐỔI → không phải dependency
 - Giống 'event handler cho Effect'

 API dự kiến (experimental):
 const onConnected = useEffectEvent(() => {
   showNotification(theme); // luôn mới
 });

 Nếu không có useEffectEvent:
 - useRef manual tracking (verbose, error-prone)
 - eslint-disable (che giấu bug)
 - Restructure code (đôi khi không thể)

 React Compiler (Forget) có thể giảm nhu cầu này
 bằng cách tự động memoize, nhưng useEffectEvent
 vẫn cần cho semantic clarity: 'đây là event, không phải sync'."
```

### 5. Câu Trả Lời Mẫu — Staff+ Level

```
Q16: "Tại sao React chọn comparison model này?"

✅ TRẢ LỜI STAFF:
"React chọn reference equality (Object.is) cho deps vì:

 1. PERFORMANCE: O(1) vs O(n) deep compare
    - Deps checked MỌI render → phải nhanh
    - Deep compare: recursive, unbounded cost
    - Objects có thể chứa functions → KHÔNG deep comparable

 2. CORRECTNESS: Thà false positive còn hơn false negative
    - False positive: Effect chạy thừa → lãng phí nhưng ĐÚNG
    - False negative: Effect KHÔNG chạy khi cần → BUG
    - Reference equality → luôn false positive → safe

 3. CONSISTENCY: Một model cho mọi type
    - Primitives: Object.is(1, 1) = true (structural = reference)
    - Objects: Object.is({a:1}, {a:1}) = false (new reference)
    - Dev BIẾT rule → predictable behavior

 4. COMPOSABILITY: Dev kiểm soát reference
    - useState, useRef → stable reference
    - useMemo, useCallback → stable khi deps same
    - Inline → new reference mỗi render
    - Dev CHỌN khi nào reference đổi = semantic control

 Trade-off:
 - Boilerplate nhiều hơn (useMemo, useCallback)
 - Learning curve cao hơn
 - React Compiler đang giải quyết boilerplate"
```

```
Q18: "Concurrent mode ảnh hưởng Effects thế nào?"

✅ TRẢ LỜI STAFF:
"Trong Concurrent Mode, React có thể:
 1. Pause rendering giữa chừng
 2. Có multiple 'in-progress' renders
 3. Discard incomplete renders

 Ảnh hưởng đến Effects:
 - Effect chỉ fire SAU khi render COMMIT (không khi paint)
 - Render bị discard → Effect KHÔNG fire → no cleanup needed
 - useSyncExternalStore cần cho external state → avoid tearing
 - Tearing: khi 2 components đọc external store ở 2 thời điểm khác
   → inconsistent UI

 Best practice:
 - KHÔNG dùng external mutable variables trong Effect
 - DÙNG useSyncExternalStore cho external state
 - DÙNG React state/context → React quản lý consistency
 - Effect cleanup PHẢI idempotent (StrictMode verify)

 Concurrent Mode KHÔNG thay đổi Effect semantics:
 - Vẫn fire top-down, cleanup trước re-fire
 - Chỉ THÊM khả năng bị delay/batch"
```

### 6. System Design Talking Points

```
KHI ĐƯỢC HỎI VỀ SYSTEM DESIGN VỚI REACT:

📦 DATA FETCHING ARCHITECTURE:
"Tôi không dùng useEffect cho data fetching trực tiếp nữa.

 Evolution:
 1. Raw useEffect + useState → race conditions, loading states manual
 2. Custom hook (useAsync, useFetch) → better abstraction
 3. React Query / SWR → caching, deduplication, background refresh
 4. Suspense + use() → future (declarative data fetching)

 Tôi vẫn hiểu useEffect fetching ĐỂ:
 - Debug issues trong legacy code
 - Hiểu CƠ CHẾ underneath libraries
 - Handle cases mà libraries không cover
 - Interview: demonstrate understanding"

📡 REAL-TIME SYSTEMS:
"Cho WebSocket/SSE trong React:

 Architecture choices:
 1. Effect per component → simple nhưng multiple connections
 2. Shared connection + Context → efficient nhưng complex
 3. External state manager (Zustand + WS middleware)
 4. Dedicated library (socket.io-client, Ably, Pusher)

 Effect role:
 - Setup/teardown connection lifecycle
 - Dependencies = connection params (roomId, token)
 - Cleanup CRITICAL: disconnect, cancel reconnect, null handlers
 - useEffectEvent cho message handlers (avoid re-subscribe)"

🏗️ STATE MANAGEMENT:
"Effect dependencies reveal state architecture issues:

 Nếu 1 Effect có 10+ deps → state quá fragmented
 Fix: useReducer (co-locate related state)

 Nếu multiple Effects read same state → state nên lift up
 Fix: Context hoặc state manager

 Nếu Effect chỉ compute derived values → KHÔNG CẦN Effect
 Fix: useMemo hoặc compute trong render"
```

### 7. Behavioral Interview — Effect Dependencies Context

```
Q: "Tell me about a time you debugged a complex frontend issue"

✅ ANSWER FRAMEWORK (STAR):

SITUATION: "Production chat app had intermittent bug:
users saw messages from PREVIOUS room after switching."

TASK: "Identify root cause and fix without breaking existing features."

ACTION:
"1. React DevTools Profiler → Effect firing pattern
 2. Found: deps = [] on WebSocket Effect → stale roomId closure
 3. Analyzed: 3 coupled issues:
    - Stale closure (reading roomId from mount-time closure)
    - Missing cleanup (WebSocket never disconnected)
    - Object dependency (options = {roomId} created new each render)
 4. Applied systematic fix:
    - Added roomId to deps → re-sync on room change
    - Added cleanup → disconnect old WS before new one
    - Moved object creation inside Effect → primitive deps
    - Used updater fn for setMessages → removed messages dep
 5. Verified: StrictMode double-mount confirmed cleanup works"

RESULT:
"Bug resolved. Added ESLint error for suppress comments.
 Created team guidelines for Effect dependencies.
 Reduced related bugs by ~80% in following quarter."

💡 SIGNALS:
- Systematic debugging (not trial-and-error)
- Deep understanding of WHY bug occurred
- Prevention measures (linter, guidelines)
- Measurable impact
```

### 8. Live Coding Strategy — Effect Questions

```
┌──────────────────────────────────────────────────────────────────────────┐
│              LIVE CODING: XỬ LÝ BÀI EFFECT DEPENDENCY                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ BƯỚC 1: PHÂN TÍCH (2 phút) — NÓI TO                                    │
│ "Tôi sẽ đọc code và xác định:"                                          │
│ • Effect này ĐỒNG BỘ cái gì? (external system)                          │
│ • Có bao nhiêu reactive values bên trong?                                │
│ • Deps array có match với reactive values không?                         │
│ • Có cleanup không? Có cần không?                                        │
│                                                                          │
│ BƯỚC 2: IDENTIFY BUGS (2 phút)                                          │
│ "Tôi thấy N issues:"                                                    │
│ • [List từng issue: stale closure, missing dep, v.v.]                    │
│ • [Giải thích IMPACT của mỗi issue]                                      │
│ • [Prioritize: critical → minor]                                         │
│                                                                          │
│ BƯỚC 3: PROPOSE FIX (1 phút)                                            │
│ "Approach tôi chọn là X vì:"                                            │
│ • [So sánh alternatives]                                                 │
│ • [Giải thích trade-offs]                                                │
│ • [Mention edge cases]                                                   │
│                                                                          │
│ BƯỚC 4: IMPLEMENT (5-10 phút)                                           │
│ • Code fix, narrate while coding                                         │
│ • Explain each change                                                    │
│ • Handle edge cases                                                      │
│                                                                          │
│ BƯỚC 5: VERIFY (2 phút)                                                 │
│ "Để verify, tôi sẽ check:"                                              │
│ • Deps array matches reactive values? ✅                                 │
│ • Cleanup handles all side effects? ✅                                   │
│ • StrictMode safe? ✅                                                    │
│ • Race conditions handled? ✅                                            │
│ • No infinite loops? ✅                                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 9. Framework Comparison Knowledge — Gây Ấn Tượng

```
KHI INTERVIEWER HỎI: "Bạn biết cách framework khác handle reactivity?"

✅ TRẢ LỜI SO SÁNH:

REACT (Pull-based, explicit deps):
  useEffect(() => {
    console.log(count); // ← ĐỌC count
  }, [count]);           // ← PHẢI khai báo đã đọc count
  // Dev khai báo deps → React check khi re-render

VUE (Automatic tracking):
  watchEffect(() => {
    console.log(count.value); // ← Vue TỰ BIẾT đọc count
  });
  // Proxy-based: Vue intercept property access → auto-track

SOLID (Fine-grained signals):
  createEffect(() => {
    console.log(count()); // ← Solid TỰ BIẾT + TỰ UPDATE
  });
  // Signal-based: no re-render, chỉ update effect

SVELTE (Compile-time):
  $: console.log(count);
  // Compiler transform → reactive at build time

ANGULAR (Zone.js / Signals):
  effect(() => {
    console.log(this.count());
  });
  // Angular 16+: Signals (similar to Solid)

TRADE-OFFS:
┌──────────────┬────────────────┬────────────────┬──────────────┐
│              │ React          │ Vue/Solid      │ Svelte       │
├──────────────┼────────────────┼────────────────┼──────────────┤
│ Deps         │ Manual/Explicit│ Automatic      │ Compile-time │
│ Bugs         │ Missing deps   │ Over-tracking  │ Compiler err │
│ Perf         │ Re-render all  │ Fine-grained   │ Fine-grained │
│ Debugging    │ Clear flow     │ Magic tracking │ Build output │
│ Learning     │ Concepts heavy │ API simpler    │ Syntax sugar │
│ Flexibility  │ Maximum        │ Constrained    │ Constrained  │
└──────────────┴────────────────┴────────────────┴──────────────┘

"React chọn explicit deps vì TRANSPARENCY:
 Dev LUÔN thấy chính xác Effect phụ thuộc gì.
 Trade-off là boilerplate, nhưng React Compiler đang giải quyết."
```

### 10. Anti-Patterns Trong Trả Lời Phỏng Vấn

```
🚫 TRÁNH NÓI:

❌ "useEffect giống componentDidMount"
   → Sai: Effect là synchronization, không phải lifecycle

❌ "Tôi dùng // eslint-disable khi cần"
   → Red flag: không hiểu WHY dependency cần thiết

❌ "Tôi luôn dùng useCallback cho mọi function"
   → Premature optimization, không hiểu root cause

❌ "Dependencies là thứ Effect watch"
   → Passive: Effect ĐỒNG BỘ dựa trên deps, không "watch"

❌ "[] = componentDidMount, return = componentWillUnmount"
   → Mapping sai: Effect CÓ THỂ re-run (class lifecycle KHÔNG)

❌ "Object dependency → dùng JSON.stringify so sánh"
   → Brittle, O(n), lossy (functions, undefined, circular refs)
```

```
✅ NÊN NÓI:

✅ "Effect là máy đồng bộ hóa"
   → Đúng mental model

✅ "Dependencies MÔ TẢ code, không phải ngược lại"
   → Hiểu invariant

✅ "Tôi thay đổi CODE để thay đổi dependencies"
   → Đúng approach

✅ "Cleanup chạy trước mỗi re-run VÀ khi unmount"
   → Hiểu lifecycle chính xác

✅ "React chọn reference equality vì O(1) và safety"
   → Hiểu design decision

✅ "Tôi cân nhắc dùng thư viện (React Query, SWR)
    cho data fetching thay vì raw Effect"
   → Pragmatic, production-ready thinking
```

### 11. Câu Hỏi Follow-Up Hay Gặp

```
KỊCH BẢN: Bạn vừa trả lời câu Effect cơ bản, interviewer dig deeper:

FOLLOW-UP 1: "Sao React không tự detect dependencies?"
→ "React KHÔNG đọc function body runtime. Nó nhận deps array
   tại call site. Lý do: JS không có compile-time analysis
   (Svelte có vì nó có compiler). React linter PHÂN TÍCH AST
   tại build time, nhưng runtime React chỉ nhận [dep1, dep2]."

FOLLOW-UP 2: "useRef có phải dependency không?"
→ "useRef() container (ref object) = STABLE reference (React guarantee).
   Nên ref KHÔNG cần trong deps. NHƯNG ref.current có thể thay đổi
   BẤT KỲ LÚC NÀO (mutation) → React KHÔNG BIẾT khi nào đổi.
   Linter KHÔNG yêu cầu ref, NHƯNG nếu Effect đọc ref.current
   và muốn re-run khi đổi → cần callback ref pattern."

FOLLOW-UP 3: "useState setter có phải dependency không?"
→ "KHÔNG. React GUARANTEE setState function có stable identity
   (cùng reference mọi render). Dispatch từ useReducer cũng vậy.
   Linter biết điều này → không yêu cầu trong deps.
   NHƯNG function TRẢ VỀ từ custom hook → KHÔNG guaranteed stable
   → cần xem implementation."

FOLLOW-UP 4: "Có thể dùng useMemo thay useEffect không?"
→ "Khác nhau về timing và purpose:
   - useMemo: chạy TRONG render, return VALUE, cho derived data
   - useEffect: chạy SAU render, cho SIDE EFFECTS (fetch, subscribe)
   Nếu chỉ cần computed value → useMemo (hoặc tính trực tiếp).
   Nếu cần interact external system → useEffect."
```

### 12. Mock Interview Script — Complete Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MOCK INTERVIEW: 45 PHÚT                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 📌 PHASE 1: CONCEPT (10 phút)                                           │
│                                                                          │
│ Interviewer: "Giải thích useEffect dependency array"                     │
│ → Trả lời: Mental model (sync machine), reactive values,                │
│   deps phản ánh code, Object.is comparison                               │
│                                                                          │
│ Interviewer: "Khi nào KHÔNG nên dùng Effect?"                            │
│ → Trả lời: Derived state, event handling, form validation,              │
│   props-to-state mirror. Cho ví dụ cụ thể mỗi case.                     │
│                                                                          │
│ 📌 PHASE 2: DEBUGGING (15 phút)                                         │
│                                                                          │
│ Interviewer: [Đưa code có 3 bugs]                                        │
│ → Approach:                                                              │
│   1. Đọc & narrate: "Tôi thấy Effect đọc X, Y, Z..."                    │
│   2. Identify: "3 issues: stale closure, missing cleanup, object dep"    │
│   3. Prioritize: "Critical: stale closure → wrong data"                  │
│   4. Fix: Code từng issue, giải thích mỗi change                        │
│   5. Verify: "Deps match, cleanup present, StrictMode OK"               │
│                                                                          │
│ 📌 PHASE 3: DESIGN (15 phút)                                            │
│                                                                          │
│ Interviewer: "Thiết kế real-time notification system"                    │
│ → Approach:                                                              │
│   1. Architecture: WS connection + React state                           │
│   2. Effect: connect/disconnect lifecycle                                │
│   3. State: useReducer cho notification queue                            │
│   4. Hooks: useNotifications() với stable API                            │
│   5. Edge cases: reconnect, offline, tab visibility                     │
│   6. Production: library recommendation (Socket.io, Ably)               │
│                                                                          │
│ 📌 PHASE 4: Q&A (5 phút)                                                │
│                                                                          │
│ Interviewer: "Questions for us?"                                         │
│ → "Team dùng React Query hay custom hooks cho data fetching?"            │
│ → "Có codebase guidelines cho Effect patterns không?"                    │
│ → "React version nào? Có plan migrate lên React 19?"                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 13. Scoring Rubric — Tự Đánh Giá

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SELF-ASSESSMENT RUBRIC                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ CATEGORY 1: CONCEPTUAL UNDERSTANDING (25%)                               │
│ ├── 1-2: Chỉ biết syntax, []  = mount                                   │
│ ├── 3-4: Hiểu deps là "watching variables"                               │
│ ├── 5-6: Biết reactive values, closure, Object.is                        │
│ ├── 7-8: Mental model "sync machine", Pit of Success                     │
│ └── 9-10: Fiber internals, concurrent mode effects                       │
│                                                                          │
│ CATEGORY 2: DEBUGGING ABILITY (25%)                                      │
│ ├── 1-2: Không identify được bug pattern                                 │
│ ├── 3-4: Identify 1 bug, fix bằng suppress                              │
│ ├── 5-6: Identify multiple bugs, fix correctly                           │
│ ├── 7-8: Systematic approach, explain root cause                         │
│ └── 9-10: Prevent future bugs, team education                            │
│                                                                          │
│ CATEGORY 3: CODE QUALITY (25%)                                           │
│ ├── 1-2: Code works nhưng có latent bugs                                 │
│ ├── 3-4: Correct nhưng verbose/naive                                     │
│ ├── 5-6: Clean, proper cleanup, stable deps                              │
│ ├── 7-8: Well-structured custom hooks, documented stability              │
│ └── 9-10: Production-ready patterns, performance-aware                   │
│                                                                          │
│ CATEGORY 4: COMMUNICATION (25%)                                          │
│ ├── 1-2: Không giải thích được reasoning                                 │
│ ├── 3-4: Mô tả WHAT nhưng không WHY                                     │
│ ├── 5-6: Clear reasoning, good vocabulary                                │
│ ├── 7-8: Teaches concepts, uses analogies                                │
│ └── 9-10: Systemic thinking, industry context                            │
│                                                                          │
│ TOTAL SCORE INTERPRETATION:                                              │
│ ├── 10-15: Junior level                                                  │
│ ├── 16-25: Mid level                                                     │
│ ├── 26-32: Senior level                                                  │
│ ├── 33-37: Staff level                                                   │
│ └── 38-40: Principal/Expert level                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 14. Cheat Sheet Cho Ngày Phỏng Vấn

```
┌──────────────────────────────────────────────────────────────────────────┐
│              CHEAT SHEET — ĐỌC 15 PHÚT TRƯỚC PHỎNG VẤN                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 🧠 MENTAL MODEL:                                                         │
│ "Effect = Sync Machine, KHÔNG PHẢI lifecycle method"                     │
│ "Dependencies MÔ TẢ code, KHÔNG PHẢI control flow"                      │
│                                                                          │
│ 📋 5 TECHNIQUES:                                                         │
│ 1. Updater fn → xóa state dep: setCount(c => c+1)                       │
│ 2. Move inside → xóa object dep: const opts = {...} TRONG Effect        │
│ 3. Destructure → primitive deps: {id, name} = obj                       │
│ 4. useEffectEvent → đọc nhưng không react                               │
│ 5. Split Effects → 1 concern = 1 Effect                                  │
│                                                                          │
│ 🚫 5 ANTI-PATTERNS:                                                      │
│ 1. eslint-disable → NÓI DỐI React                                       │
│ 2. Object trong deps → infinite loop                                     │
│ 3. Missing cleanup → memory leak                                         │
│ 4. Derived state trong Effect → unnecessary render                       │
│ 5. Event logic trong Effect → coupling sai                               │
│                                                                          │
│ 🔑 KEY PHRASES:                                                          │
│ "reactive values" "synchronization" "Object.is"                          │
│ "stable identity" "stale closure" "re-synchronize"                       │
│ "cleanup idempotent" "Pit of Success" "single source of truth"           │
│                                                                          │
│ ⚡ QUICK COMPARISONS:                                                     │
│ useEffect vs useLayoutEffect → after paint vs before paint               │
│ useMemo vs useEffect → sync in render vs async after render              │
│ Event Handler vs Effect → specific event vs synchronization              │
│ useState setter vs dispatch → stable identity (no dep needed)            │
│ ref vs ref.current → stable container vs mutable value                   │
│                                                                          │
│ 💡 DECISION TREE (khi fix dependency issue):                             │
│ "Giá trị này thay đổi → Effect CẦN chạy lại?"                           │
│ ├── CẦN → giữ trong deps ✅                                              │
│ ├── KHÔNG CẦN → tại sao Effect đọc nó?                                  │
│ │   ├── Chỉ cần prev state → updater fn                                 │
│ │   ├── Event-specific → useEffectEvent                                  │
│ │   ├── Computed value → tính trong render                               │
│ │   └── Object/fn → restructure                                         │
│ └── KHÔNG BIẾT → Effect có thể đang làm quá nhiều → split               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 15. Câu Hỏi BẠN Nên Hỏi Interviewer

```
KHI INTERVIEWER GẶP: "Bạn có câu hỏi gì không?"

✅ CÂU HỎI THỂ HIỆN DEPTH:

1. "Team dùng React Query/SWR hay custom hooks cho data fetching?
    Tôi muốn hiểu chiến lược caching và deduplication."

2. "Code review có guidelines riêng cho Effect dependencies không?
    Ví dụ: có rule ESLint nào enforce ngoài exhaustive-deps?"

3. "Codebase đang ở React version nào? Có plan cho React 19 /
    React Compiler? Vì nó sẽ thay đổi cách viết deps đáng kể."

4. "Khi debug production issues liên quan đến Effects,
    team dùng tooling gì? React DevTools, Sentry, custom logging?"

5. "Tỷ lệ class components vs hooks trong codebase?
    Có migration strategy không?"

6. "Team approach thế nào với StrictMode double-mount?
    Có disable cho production build không?"

❌ CÂU HỎI NÊN TRÁNH:
- "Dùng framework nào?" (quá basic, nên research trước)
- "Có dùng TypeScript không?" (cũng nên biết trước)
- Generic questions không liên quan đến tech
```

### 16. Xử Lý Câu Hỏi Trap

```
INTERVIEWER CỐ TÌNH ĐƯA CÂU TRAP:

TRAP 1: "Viết custom hook useDeepCompareEffect"
→ "Tôi có thể implement deep compare bằng lodash.isEqual.
   NHƯNG tôi sẽ CẢNH BÁO: deep compare có O(n) cost,
   không handle functions/circular refs, và che giấu
   root cause (object tạo mới mỗi render).

   Preferred solution: fix tại SOURCE — useMemo, destructure,
   hoặc di chuyển vào Effect. Deep compare là LAST RESORT."

TRAP 2: "Dùng JSON.stringify để compare deps?"
→ "KHÔNG NÊN. 3 vấn đề:
   1. O(n) serialization mỗi render
   2. Lossy: functions, undefined, Symbol bị mất
   3. Key ordering: {a:1, b:2} ≠ {b:2, a:1} (dù logically same)

   Nếu THẬT SỰ cần compare: useMemo + custom comparator."

TRAP 3: "useEffect với async function inside có OK?"
→ "Có, NHƯNG syntactically:
   ❌ useEffect(async () => {...})  // Returns Promise, not cleanup
   ✅ useEffect(() => { async function run() {...} run(); })

   Effect callback PHẢI return void hoặc cleanup function.
   async function return Promise → React không biết handle."

TRAP 4: "Tại sao useEffect chạy SAU paint chứ không trước?"
→ "Design choice: Effect KHÔNG nên block paint.
   User cần thấy UI ngay → paint trước → cleanup/setup sau.
   Nếu CẦN chạy trước paint → useLayoutEffect (block paint).
   99% cases: useEffect đúng (không flicker)."
```

### 17. Cách Nói Về Production Experience

```
KỊCH BẢN: Interviewer muốn nghe KINH NGHIỆM THỰC TẾ

TEMPLATE 1: "Tôi đã tối ưu performance Effects"
"Trong project [X], dashboard component có 12 useEffects.
 Profiler cho thấy 8 re-renders khi switch tab.

 Root cause: 3 Effects có object dependencies tạo mới mỗi render.

 Fix:
 1. Gom 4 related Effects → 2 Effects (split by concern)
 2. Di chuyển 3 objects vào trong Effects
 3. Thêm useEffectEvent cho 2 analytics callbacks

 Result: 8 re-renders → 2 re-renders. Tab switch: 200ms → 60ms."

TEMPLATE 2: "Tôi đã tạo team guidelines"
"Sau debug session kéo dài 3 ngày cho 1 stale closure bug,
 tôi tạo team guidelines:

 1. ESLint rule: error (not warn) cho exhaustive-deps
 2. Banned pattern list: objects in deps, eslint-disable
 3. PR checklist: cleanup present, stable deps, no chains
 4. Shared custom hooks: useAsync, useEventListener, useLocalStorage

 Metric: Effect-related bugs giảm 70% trong 6 tháng."

TEMPLATE 3: "Tôi đã migrate legacy code"
"Migrate React 16 class components → hooks:

 Challenge: componentDidUpdate có complex logic
 mixing multiple concerns trong 1 method.

 Approach:
 1. Identify individual 'synchronization needs' trong CDU
 2. Map mỗi concern → 1 useEffect
 3. Identify derived state → di chuyển ra khỏi Effect
 4. Test: StrictMode catch cleanup issues sớm

 Result: 40+ class components → hooks.
 Bundle size -15%. Developer velocity +30%."
```

### 18. Phỏng Vấn Bằng Tiếng Anh — Key Vocabulary

```
ENGLISH VOCABULARY CHO EFFECT DEPENDENCIES:

CONCEPTS:
- "Synchronization machine" (NOT "lifecycle hook")
- "Reactive values" (NOT "variables")
- "Re-synchronize" (NOT "re-run" or "trigger")
- "Reference equality" / "Object.is comparison"
- "Stale closure" / "Captured value"
- "Stable identity" (for setState, dispatch)
- "Cleanup function" / "Teardown"
- "Idempotent cleanup" (safe to run multiple times)

PHRASES TO USE:
"Dependencies DESCRIBE the code, not the other way around."
"I change the CODE to change the dependencies."
"Effects synchronize with external systems."
"The linter enforces an INVARIANT, not a suggestion."
"React chose O(1) comparison for predictability."
"I'd use an updater function to remove this state dependency."
"This is a case for useEffectEvent — read but not react."

WHEN EXPLAINING FIX:
"The root cause is [X], not just the symptom."
"There are [N] approaches, ranked by preference:"
"The trade-off here is [A] vs [B], and I'd choose [A] because..."
"This pattern is commonly known as [name] in the React community."
"According to the React docs, the recommended approach is..."
```

### 19. Cuộc Phỏng Vấn Big Tech — Pattern Matching

```
┌──────────────────────────────────────────────────────────────────────────┐
│              BIG TECH INTERVIEW PATTERNS                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 🏢 GOOGLE (L5 Frontend):                                                │
│ Focus: System design + code quality                                      │
│ Expect: "Design a real-time collaborative editor"                        │
│ → Mention: Effect cho WebSocket lifecycle, CRDT state sync,             │
│   useEffectEvent cho cursor tracking, cleanup cho connection pool        │
│                                                                          │
│ 🏢 META (E5 Frontend):                                                  │
│ Focus: React internals (since they built it!)                            │
│ Expect: "How does React decide to re-run an Effect?"                     │
│ → Mention: Fiber updateQueue, Object.is comparison,                     │
│   commit phase execution, batched updates in React 18                    │
│                                                                          │
│ 🏢 AMAZON (SDE2 Frontend):                                              │
│ Focus: Scalability + error handling                                      │
│ Expect: "Build a product listing with infinite scroll"                   │
│ → Mention: IntersectionObserver Effect, pagination state,               │
│   AbortController cleanup, error boundaries, retry logic                 │
│                                                                          │
│ 🏢 APPLE (ICT4 Frontend):                                               │
│ Focus: Performance + UX polish                                           │
│ Expect: "Optimize a dashboard with 20+ widgets"                          │
│ → Mention: Split Effects per widget, useLayoutEffect cho DOM,            │
│   useSyncExternalStore cho shared state, requestIdleCallback             │
│                                                                          │
│ 🏢 MICROSOFT (L63 SWE):                                                 │
│ Focus: Architecture + maintainability                                    │
│ Expect: "Refactor a legacy app with 500+ useEffects"                     │
│ → Mention: Custom hook extraction, ESLint migration,                     │
│   dependency audit strategy, React Query migration plan                  │
│                                                                          │
│ 🏢 STARTUP (Senior Frontend):                                           │
│ Focus: Pragmatism + velocity                                             │
│ Expect: "Build feature X from scratch, fast"                             │
│ → Mention: React Query instead of raw Effects,                           │
│   keep it simple, iterate, custom hooks for reuse,                       │
│   tradeoff: library vs custom (time vs control)                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 20. Final Tips — Mindset Đi Phỏng Vấn

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MINDSET CHECK TRƯỚC PHỎNG VẤN                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ✅ "Tôi HIỂU tại sao React thiết kế như vậy"                            │
│    → Không chỉ biết syntax, biết PHILOSOPHY                              │
│                                                                          │
│ ✅ "Tôi biết khi nào KHÔNG dùng Effect"                                  │
│    → 60% Effect usage có thể thay bằng derived state/event handler      │
│                                                                          │
│ ✅ "Tôi có systematic approach để debug"                                 │
│    → Không trial-and-error, có checklist                                 │
│                                                                          │
│ ✅ "Tôi biết trade-offs của mỗi technique"                              │
│    → Không có silver bullet, mỗi approach có pros/cons                   │
│                                                                          │
│ ✅ "Tôi có production experience để chia sẻ"                             │
│    → STAR format, measurable impact, prevention                          │
│                                                                          │
│ ✅ "Tôi biết ecosystem context"                                          │
│    → React Query, Compiler, Server Components, Signals                   │
│                                                                          │
│ ✅ "Tôi có thể dạy người khác"                                           │
│    → Analogies (Excel, sync machine), teaching mindset                   │
│                                                                          │
│ "The best interview answer is one where the interviewer                  │
│  LEARNS something new from YOUR explanation."                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 21. React 19 & Server Components — Kiến Thức Cập Nhật

```
KHI INTERVIEWER HỎI: "Bạn biết gì về React 19 liên quan đến Effects?"

✅ TRẢ LỜI CẬP NHẬT:

REACT 19 CHANGES:

1. use() hook — Data fetching mới:
   "use() cho phép đọc Promise/Context TRONG render.
    Khác useEffect: use() là synchronous read, không phải side effect.
    Kết hợp Suspense → declarative data fetching.

    // Trước (useEffect):
    useEffect(() => { fetch(url).then(setData) }, [url]);

    // Sau (use + Suspense):
    const data = use(fetchData(url)); // React handles loading state"

2. React Compiler (React Forget):
   "Compiler tự động memoize components, objects, functions.
    Hệ quả: useMemo/useCallback sẽ ít cần hơn.

    NHƯNG useEffect deps VẪN CẦN khai báo:
    - Compiler memoize REFERENCES, không thay đổi SEMANTICS
    - Dependencies vẫn là invariant
    - Chỉ giảm FALSE POSITIVES (object tạo mới mỗi render)"

3. Server Components:
   "Server Components KHÔNG CÓ Effects — chạy trên server.
    Chỉ Client Components (use client) có useEffect.

    Hệ quả architecture:
    - Data fetching → Server Components (async/await)
    - Subscriptions, DOM API → Client Components (useEffect)
    - Giảm role của useEffect trong app mới"

4. Actions & useActionState:
   "Form handling → Actions thay vì useEffect.
    useActionState quản lý pending/error states.

    // Trước: useEffect + useState cho form submit
    // Sau: <form action={submitAction}>

    Giảm 80% form-related Effects."

5. useOptimistic:
   "Optimistic UI updates KHÔNG CẦN Effect.
    useOptimistic → show predicted result immediately.

    // Trước: useEffect để rollback on error
    // Sau: useOptimistic tự handle"

INTERVIEW SIGNAL: Biết React 19 = hiểu TƯƠNG LAI, không chỉ hiện tại.
```

### 22. Custom Hook Design — Interview Deep Dive

```
KHI INTERVIEWER HỎI: "Thiết kế custom hook cho [scenario X]"

✅ FRAMEWORK THIẾT KẾ CUSTOM HOOK:

BƯỚC 1: DEFINE API SURFACE
"Tôi bắt đầu từ CÁCH SỬ DỤNG, không phải implementation:

 // Dream API cho useTimer:
 const { time, isRunning, start, stop, reset } = useTimer({
   initialTime: 60,
   interval: 1000,
   onComplete: () => alert('Done!'),
 });"

BƯỚC 2: STABLE RETURNS — CRITICAL
"Return object PHẢI stable để consumer không bị re-render:

 ❌ SAI: return { time, isRunning, start, stop };
   // Object literal mới mỗi render → consumer re-render

 ✅ ĐÚNG — Cách 1: useMemo
 return useMemo(() => ({ time, isRunning, start, stop }),
   [time, isRunning, start, stop]);

 ✅ ĐÚNG — Cách 2: Return array (like useState)
 return [time, { isRunning, start, stop }];

 ✅ ĐÚNG — Cách 3: Stable functions with useCallback
 const start = useCallback(() => {...}, []);
 const stop = useCallback(() => {...}, []);"

BƯỚC 3: DEPENDENCY DESIGN
"Consumer KHÔNG nên cần biết implementation details:

 // Consumer code:
 useEffect(() => {
   if (isLoggedIn) start(); // start PHẢI stable
 }, [isLoggedIn, start]);   // start không nên gây re-fire

 // Nếu start không stable → consumer bị surprise re-fire
 // → BROKEN contract"

BƯỚC 4: CLEANUP ENCAPSULATION
"Hook PHẢI tự cleanup — consumer KHÔNG cần biết:

 function useTimer(config) {
   useEffect(() => {
     if (!isRunning) return;
     const id = setInterval(tick, config.interval);
     return () => clearInterval(id); // Hook tự cleanup ✅
   }, [isRunning, config.interval]);
 }"

BƯỚC 5: COMPOSABILITY
"Hook nên compose được với hooks khác:

 function useAutoSave(content, documentId) {
   const debouncedContent = useDebounce(content, 1000);
   const { mutate, isPending } = useMutation(saveDocument);

   useEffect(() => {
     mutate({ documentId, content: debouncedContent });
   }, [debouncedContent, documentId, mutate]);

   return { isSaving: isPending };
 }"
```

```
VÍ DỤ ĐẦY ĐỦ — useLocalStorage:

function useLocalStorage(key, initialValue) {
  // 1. Lazy initialization (đọc 1 lần)
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // 2. Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  }, [key, value]);

  // 3. Cross-tab sync
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        try { setValue(JSON.parse(e.newValue)); }
        catch { /* ignore parse errors */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  // 4. Stable setter (useCallback)
  const setStoredValue = useCallback((newValue) => {
    setValue(prev =>
      typeof newValue === 'function' ? newValue(prev) : newValue
    );
  }, []);

  // 5. Stable return
  return [value, setStoredValue];
}

CHECKLIST KHI REVIEW CUSTOM HOOK:
✅ Returns stable references?
✅ Cleanup encapsulated?
✅ Error handling present?
✅ Edge cases covered? (SSR, quota exceeded)
✅ Composable with other hooks?
✅ Dependencies minimal and correct?
✅ TypeScript types exported?
```

### 23. Performance Profiling — Cách Nói Trong Interview

```
KHI INTERVIEWER HỎI: "Làm sao bạn profile Effect performance?"

✅ APPROACH CÓ HỆ THỐNG:

TOOL 1: React DevTools Profiler
"Tôi dùng Profiler tab để:
 1. Record interaction (ví dụ: switch tab)
 2. Xem component nào re-render
 3. Xem Effect nào fire (commit phase)
 4. Identify: Effect fire 10 lần trong 1 interaction = BUG

 Profiler cho thấy 'why did this render?':
 - Props changed
 - State changed
 - Hooks changed ← Effect dependency!"

TOOL 2: console.log trong Effect (development)
"Quick debugging:

 useEffect(() => {
   console.log('Effect fired:', { roomId, options });
   // ... logic
   return () => console.log('Cleanup:', { roomId });
 }, [roomId, options]);

 Nếu thấy fire liên tục → dependency unstable.
 Nếu thấy cleanup-setup-cleanup-setup → StrictMode (OK)."

TOOL 3: Performance API
"Cho production monitoring:

 useEffect(() => {
   const start = performance.now();
   // ... expensive operation
   const duration = performance.now() - start;
   if (duration > 16) { // longer than 1 frame
     reportSlowEffect({ component, duration, deps });
   }
 }, [deps]);"

TOOL 4: why-did-you-render library
"npm install @welldone-software/why-did-you-render
 Tự động log KHI NÀO component re-render VÀ TẠI SAO.
 Đặc biệt useful cho deep equal objects."

METRIC ĐỂ TRACK:
┌─────────────────────┬──────────────┬──────────────┐
│ Metric              │ Good         │ Bad          │
├─────────────────────┼──────────────┼──────────────┤
│ Effect fires/action │ 1-2          │ 5+           │
│ Effect duration     │ < 16ms       │ > 50ms       │
│ Cleanup frequency   │ = fire freq  │ Mismatch     │
│ Re-renders/action   │ 1-3          │ 10+          │
│ Deps array length   │ 1-3          │ 7+           │
└─────────────────────┴──────────────┴──────────────┘
```

### 24. Whiteboard Architecture — Effect trong System Design

```
KHI INTERVIEWER YÊU CẦU VẼ ARCHITECTURE:

SCENARIO 1: "Design a real-time dashboard"

┌────────────────────────────────────────────────────────────────┐
│                     DASHBOARD ARCHITECTURE                      │
│                                                                │
│ ┌──────────────────┐    ┌──────────────────┐                   │
│ │  Data Source      │    │  WebSocket       │                   │
│ │  (REST API)       │    │  (Real-time)     │                   │
│ └───────┬──────────┘    └───────┬──────────┘                   │
│         │                       │                               │
│         ▼                       ▼                               │
│ ┌──────────────────────────────────────────┐                   │
│ │        Custom Hooks Layer                 │                   │
│ │                                           │                   │
│ │  useDashboardData()                       │                   │
│ │  ├── useQuery(metrics)    // React Query  │                   │
│ │  ├── useWebSocket(room)   // Effect       │                   │
│ │  └── usePollFallback()    // Effect       │                   │
│ │                                           │                   │
│ │  useWidgetConfig()                        │                   │
│ │  ├── useState(layout)                     │                   │
│ │  └── useLocalStorage(prefs) // Effect     │                   │
│ └───────────────────────┬──────────────────┘                   │
│                         │                                       │
│                         ▼                                       │
│ ┌──────────────────────────────────────────┐                   │
│ │        Component Layer                    │                   │
│ │                                           │                   │
│ │  <Dashboard>                              │                   │
│ │  ├── <MetricCard>      // No Effect       │                   │
│ │  ├── <ChartWidget>     // useLayoutEffect │                   │
│ │  ├── <AlertPanel>      // Event handlers  │                   │
│ │  └── <ActivityFeed>    // No Effect       │                   │
│ └──────────────────────────────────────────┘                   │
│                                                                │
│ KEY DECISIONS:                                                  │
│ 1. Effects ONLY trong hooks layer (separation of concerns)     │
│ 2. Components = pure rendering (no direct Effects)             │
│ 3. React Query cho REST → dedup, cache, retry                  │
│ 4. Custom hook cho WS → lifecycle management                   │
│ 5. useLayoutEffect cho chart rendering (avoid flicker)         │
│ 6. Event handlers cho user interactions (not Effects)          │
└────────────────────────────────────────────────────────────────┘

SCENARIO 2: "Design auth flow with token refresh"

┌────────────────────────────────────────────────────────────────┐
│                     AUTH TOKEN FLOW                              │
│                                                                │
│  Login → Store token → Start refresh timer                     │
│                                                                │
│  useAuth() hook:                                               │
│  ┌─────────────────────────────────────────┐                   │
│  │ Effect 1: Token refresh scheduler       │                   │
│  │ deps: [token.expiresAt]                 │                   │
│  │ cleanup: clear timeout                  │                   │
│  │ logic: setTimeout(refresh, expiresIn)   │                   │
│  │                                         │                   │
│  │ Effect 2: Token validity check          │                   │
│  │ deps: [token]                           │                   │
│  │ logic: if expired → logout              │                   │
│  │                                         │                   │
│  │ Effect 3: Tab visibility (optional)     │                   │
│  │ deps: []                                │                   │
│  │ cleanup: remove visibilitychange        │                   │
│  │ logic: check token when tab re-focused  │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                │
│  WHY 3 SEPARATE EFFECTS:                                       │
│  - Effect 1: re-run khi token changes (new expiry)             │
│  - Effect 2: re-run khi token itself changes                   │
│  - Effect 3: never re-run (static listener)                    │
│  Gom lại = re-schedule timer khi không cần = waste             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 25. Code Review Simulation — Trả Lời Dạng "Review Code Này"

```
KHI INTERVIEWER ĐƯA CODE ĐỂ REVIEW:

"Đây là code của đồng nghiệp. Bạn sẽ comment gì trong PR?"

CODE ĐỂ REVIEW:
function UserDashboard({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setIsLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetch(`/api/users/${userId}/posts`)
      .then(r => r.json())
      .then(setPosts);
  }, [userId]);

  useEffect(() => {
    const ws = new WebSocket(`ws://api/notifications/${userId}`);
    ws.onmessage = (e) => {
      setNotifications(prev => [...prev, JSON.parse(e.data)]);
    };
  }, []);

  // ... render
}

✅ REVIEW COMMENTS (7 issues):

1. 🔴 CRITICAL — Race condition trên cả 2 fetch Effects:
   "Cần ignore flag hoặc AbortController.
    User navigate nhanh → response cũ overwrite data mới."

2. 🔴 CRITICAL — WebSocket thiếu cleanup:
   "Effect 3 không return cleanup → WS never closed.
    Memory leak + messages nhận sau unmount."

3. 🔴 CRITICAL — WebSocket deps sai:
   "userId trong WS URL nhưng deps = [].
    userId thay đổi → vẫn connect room CŨ. Stale closure."

4. 🟡 MEDIUM — Loading state incomplete:
   "isLoading chỉ cover user fetch, không cover posts.
    Khi posts chưa load xong → UI hiển thị incomplete data."

5. 🟡 MEDIUM — Error handling missing:
   "Không có .catch → network error = silent failure.
    Cần error state + error UI cho mỗi fetch."

6. 🟢 SUGGESTION — Merge 2 fetch Effects:
   "Effect 1 và 2 cùng deps [userId] và cùng concern (user data).
    Có thể gom: Promise.all([fetchUser, fetchPosts]).
    Hoặc tốt hơn: dùng React Query."

7. 🟢 SUGGESTION — Production recommendation:
   "Với 3 data sources, nên dùng React Query cho REST
    và custom useWebSocket hook cho real-time.
    Giảm boilerplate 60%, tự handle race conditions."

✅ CÁCH TRÌNH BÀY:
"Tôi review từ CRITICAL → SUGGESTION.
 Mỗi comment có: severity, issue, impact, fix suggestion.
 Tôi KHÔNG chỉ nói 'sai', tôi nói 'fix thế này'."
```

### 26. Edge Cases Mastery — Nâng Level Trả Lời

```
KHI INTERVIEWER HỎI: "Edge cases nào bạn nghĩ đến?"

✅ 10 EDGE CASES THƯỜNG BỊ BỎ QUA:

1. UNMOUNT DURING ASYNC:
   "Component unmount khi fetch đang chạy →
    setState on unmounted component.
    Fix: ignore flag hoặc AbortController."

2. DOUBLE MOUNT (StrictMode):
   "React 18 StrictMode mount → unmount → mount.
    Effect fire 2 lần. Nếu không idempotent → BUG.
    Ví dụ: Analytics track 2 lần, WebSocket connect 2 lần."

3. RAPID STATE CHANGES:
   "User type nhanh → dependency thay đổi 10 lần/giây.
    Effect fire 10 lần → 10 fetch requests.
    Fix: debounce hoặc throttle dependency."

4. EMPTY/NULL INITIAL STATE:
   "Effect đọc user.id nhưng user = null lúc đầu.
    TypeError: Cannot read property 'id' of null.
    Fix: guard clause hoặc optional chaining."

5. TAB VISIBILITY:
   "User switch tab → timer/animation vẫn chạy.
    Waste resources. Fix: document.visibilitychange."

6. NETWORK RECONNECT:
   "User mất mạng → reconnect → Effect không re-fire
    (deps chưa đổi). Fix: listen online event, force refetch."

7. HOT MODULE REPLACEMENT:
   "Dev mode HMR → component re-mount nhưng state giữ.
    Effect cleanup chạy → setup lại.
    Nếu setup có side effects (API call) → duplicate."

8. MEMORY PRESSURE:
   "Effect tạo large data structures mỗi re-run.
    Nếu cleanup không clear → memory leak dần dần.
    Fix: cleanup phải symmetrical với setup."

9. CONCURRENT FEATURES:
   "useTransition → render bị interrupt.
    Effect chỉ fire cho COMMITTED render.
    Interrupted render → Effect KHÔNG fire."

10. SSR HYDRATION:
    "Server render → client hydrate.
     useEffect KHÔNG chạy trên server.
     Content differ = hydration warning.
     Fix: mounted check hoặc suppressHydrationWarning."

CÁCH NÓI:
"Khi viết Effect, tôi LUÔN hỏi:
 - Component unmount giữa chừng thì sao?
 - Dependency thay đổi nhanh liên tục thì sao?
 - StrictMode double-mount có OK không?
 Đây là 3 câu PHẢI trả lời được cho MỌI Effect."
```

### 27. TypeScript + Effect Dependencies

```
KHI INTERVIEWER HỎI VỀ TYPESCRIPT VỚI EFFECTS:

✅ TYPE SAFETY CHO DEPENDENCIES:

1. Generic custom hooks:
function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    asyncFn()
      .then(data => { if (!cancelled) setState({
        status: 'success', data, error: null
      })})
      .catch(error => { if (!cancelled) setState({
        status: 'error', data: null, error
      })});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  // ☝️ EXCEPTION: Generic hooks PHẢI dùng passed deps
  // Đây là 1 trong ÍT cases eslint-disable OK

  return state;
}

2. Type-safe event callback:
type EffectEventFn<Args extends unknown[], R> = (...args: Args) => R;

// useEffectEvent workaround (until official API):
function useEffectEvent<Args extends unknown[], R>(
  fn: EffectEventFn<Args, R>
): EffectEventFn<Args, R> {
  const ref = useRef(fn);
  useLayoutEffect(() => { ref.current = fn; });
  return useCallback((...args: Args) => ref.current(...args), []);
}

3. Discriminated union cho async state:
type AsyncState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };

// Consumer gets type narrowing:
const { status, data, error } = useAsync(fetchUser, [userId]);
if (status === 'success') {
  data.name; // ✅ TypeScript BIẾT data là T, không phải null
}

INTERVIEW SIGNAL:
"TypeScript discriminated unions cho async state
 giúp COMPILE-TIME safety — không thể access data
 khi status !== 'success'. Giảm runtime errors 90%."
```

### 28. Testing Effects — Interview Knowledge

```
KHI INTERVIEWER HỎI: "Cách test component có useEffect?"

✅ TESTING STRATEGIES:

STRATEGY 1: Integration test (Preferred)
"Test BEHAVIOR, không test implementation:

 import { render, screen, waitFor } from '@testing-library/react';

 test('fetches user on mount', async () => {
   // Arrange: mock API
   server.use(
     rest.get('/api/users/1', (req, res, ctx) =>
       res(ctx.json({ name: 'Alice' }))
     )
   );

   // Act
   render(<UserProfile userId='1' />);

   // Assert: behavior, not Effect
   await waitFor(() => {
     expect(screen.getByText('Alice')).toBeInTheDocument();
   });
 });"

STRATEGY 2: Test cleanup
"Verify Effect cleans up correctly:

 test('unsubscribes on unmount', () => {
   const unsubscribe = jest.fn();
   jest.spyOn(eventBus, 'subscribe').mockReturnValue(unsubscribe);

   const { unmount } = render(<Listener />);
   unmount();

   expect(unsubscribe).toHaveBeenCalledTimes(1);
 });"

STRATEGY 3: Test dependency changes
"Verify Effect re-runs when deps change:

 test('re-fetches when userId changes', async () => {
   const { rerender } = render(<UserProfile userId='1' />);
   await waitFor(() => expect(screen.getByText('Alice')));

   rerender(<UserProfile userId='2' />);
   await waitFor(() => expect(screen.getByText('Bob')));
 });"

STRATEGY 4: Test race conditions
"Verify stale responses are ignored:

 test('ignores stale response after re-render', async () => {
   let resolveFirst;
   const firstPromise = new Promise(r => { resolveFirst = r; });

   // Slow response for first render
   server.use(
     rest.get('/api/users/1', async (req, res, ctx) => {
       await firstPromise;
       return res(ctx.json({ name: 'Alice' }));
     })
   );

   const { rerender } = render(<UserProfile userId='1' />);

   // Quick second render
   server.use(
     rest.get('/api/users/2', (req, res, ctx) =>
       res(ctx.json({ name: 'Bob' }))
     )
   );
   rerender(<UserProfile userId='2' />);
   await waitFor(() => expect(screen.getByText('Bob')));

   // Resolve first (stale) response
   resolveFirst();

   // Should STILL show Bob, not Alice
   expect(screen.getByText('Bob')).toBeInTheDocument();
   expect(screen.queryByText('Alice')).not.toBeInTheDocument();
 });"

KEY PRINCIPLE:
"Test WHAT the Effect does (behavior),
 NOT THAT the Effect runs (implementation detail).
 useEffect là implementation detail — có thể thay thế
 bằng React Query, Suspense, v.v. mà tests vẫn pass."
```

### 29. Migration Strategy — Class → Hooks

```
KHI INTERVIEWER HỎI: "Migrate class component lifecycle → hooks?"

✅ SYSTEMATIC MIGRATION:

LIFECYCLE MAPPING (KHÔNG phải 1:1):

componentDidMount:
  ❌ KHÔNG PHẢI useEffect(fn, [])
  ✅ useEffect(fn, []) CHỈ tương đương NẾU:
     - Không đọc props/state bên trong
     - Không cần re-run khi props đổi

componentDidUpdate:
  ❌ KHÔNG có hook tương đương trực tiếp
  ✅ Phân tích TỪNG CONCERN trong componentDidUpdate
     → Mỗi concern = 1 useEffect

componentWillUnmount:
  ❌ KHÔNG PHẢI useEffect return cleanup
  ✅ Cleanup chạy TRƯỚC MỖI re-run + unmount
     → Phải idempotent

MIGRATION EXAMPLE:

// CLASS COMPONENT (TRƯỚC):
class Chat extends React.Component {
  componentDidMount() {
    this.connect(this.props.roomId);       // Concern 1: Connection
    this.startTimer();                      // Concern 2: Timer
    trackPageView(this.props.roomId);       // Concern 3: Analytics
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId !== this.props.roomId) {
      this.disconnect(prevProps.roomId);     // Concern 1
      this.connect(this.props.roomId);       // Concern 1
      trackPageView(this.props.roomId);      // Concern 3
    }
    if (prevProps.theme !== this.props.theme) {
      this.updateTheme(this.props.theme);    // Concern 4: Theme
    }
  }

  componentWillUnmount() {
    this.disconnect(this.props.roomId);      // Concern 1
    this.clearTimer();                       // Concern 2
  }
}

// HOOKS (SAU):
function Chat({ roomId, theme }) {
  // Concern 1: Connection
  useEffect(() => {
    const conn = connect(roomId);
    return () => conn.disconnect();
  }, [roomId]);

  // Concern 2: Timer
  useEffect(() => {
    const id = startTimer();
    return () => clearTimer(id);
  }, []); // No deps needed

  // Concern 3: Analytics
  useEffect(() => {
    trackPageView(roomId);
  }, [roomId]);

  // Concern 4: Theme — NOT an Effect!
  // Apply during render or useLayoutEffect
}

MIGRATION CHECKLIST:
┌─────┬────────────────────────────────┬──────────────────────┐
│ #   │ Check                          │ Status               │
├─────┼────────────────────────────────┼──────────────────────┤
│ 1   │ List all concerns in CDM/CDU   │ [ ]                  │
│ 2   │ Each concern → 1 useEffect     │ [ ]                  │
│ 3   │ Derived state → useMemo/render │ [ ]                  │
│ 4   │ Event logic → handlers         │ [ ]                  │
│ 5   │ All cleanups return functions   │ [ ]                  │
│ 6   │ StrictMode test passes         │ [ ]                  │
│ 7   │ No eslint-disable added        │ [ ]                  │
│ 8   │ Existing tests still pass      │ [ ]                  │
└─────┴────────────────────────────────┴──────────────────────┘
```

### 30. Debugging Toolkit — Practical Interview Demo

```
KHI INTERVIEWER HỎI: "Demo debugging workflow cho Effect issue"

✅ STEP-BY-STEP DEBUGGING:

STEP 1: REPRODUCE — Identify the symptom
"Effect chạy infinite? Stale data? Missing update?
 Reproduce consistently trước khi debug."

STEP 2: ADD INSTRUMENTATION
useEffect(() => {
  console.group('Effect [ChatRoom]');
  console.log('Dependencies:', { roomId, options });
  console.log('Render count:', renderCountRef.current++);
  console.trace('Stack trace');
  console.groupEnd();

  // ... actual logic

  return () => {
    console.log('Cleanup [ChatRoom]:', { roomId });
  };
}, [roomId, options]);

STEP 3: CHECK DEPS WITH useRef
// Debug helper:
function useWhyDidYouUpdate(name, props) {
  const prev = useRef(props);
  useEffect(() => {
    const changes = {};
    Object.keys({...prev.current, ...props}).forEach(key => {
      if (!Object.is(prev.current[key], props[key])) {
        changes[key] = {
          from: prev.current[key],
          to: props[key]
        };
      }
    });
    if (Object.keys(changes).length > 0) {
      console.log('[WHY UPDATE]', name, changes);
    }
    prev.current = props;
  });
}

// Usage:
useWhyDidYouUpdate('ChatRoom', { roomId, options, theme });
// Console: [WHY UPDATE] ChatRoom { options: { from: {...}, to: {...} } }
// ← Object reference changed! Root cause found.

STEP 4: VERIFY FIX
"Sau fix, tôi verify 3 điều:
 1. Symptom không còn (obvious)
 2. StrictMode double-mount OK (cleanup works)
 3. Rapid change scenario OK (race condition handled)"

DEBUGGING DECISION TREE:
"Effect chạy quá nhiều"
│
├── Check console: dependency nào thay đổi?
│   ├── Object/function → reference instability
│   │   └── Fix: move inside, destructure, useMemo
│   ├── State → possibly derived from same source
│   │   └── Fix: remove derived state, use reducer
│   └── Context → context value unstable
│       └── Fix: memoize context value, split contexts
│
├── "Effect không chạy / stale data"
│   ├── Check: dependency missing?
│   │   └── Fix: add to array
│   ├── Check: eslint-disable present?
│   │   └── Fix: remove, add proper deps
│   └── Check: closure captured old value?
│       └── Fix: updater fn, useEffectEvent
│
└── "Memory leak / cleanup issue"
    ├── Check: cleanup function returned?
    │   └── Fix: add return () => ...
    ├── Check: async operation in cleanup?
    │   └── Fix: sync cleanup + cancelled flag
    └── Check: event listener still attached?
        └── Fix: removeEventListener in cleanup
```

### 31. Interview Red Flags — Điều Interviewer Đánh Giá Cao/Thấp

```
┌──────────────────────────────────────────────────────────────────────────┐
│              INTERVIEWER EVALUATION SIGNALS                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 🟢 STRONG SIGNALS (Interviewer ghi điểm cao):                           │
│                                                                          │
│ 1. "Let me think about WHY this is a bug, not just WHAT"                │
│    → Shows depth of understanding                                        │
│                                                                          │
│ 2. "There are 3 approaches, let me compare trade-offs"                   │
│    → Shows judgement, not just knowledge                                  │
│                                                                          │
│ 3. "In production, I'd actually use React Query for this"               │
│    → Shows pragmatism beyond textbook answers                            │
│                                                                          │
│ 4. "This cleanup must be idempotent because StrictMode..."              │
│    → Shows understanding of React internals                              │
│                                                                          │
│ 5. "Let me verify: deps match, cleanup present, race handled"           │
│    → Shows systematic verification                                       │
│                                                                          │
│ 6. "This is similar to the Observer pattern in [framework X]"           │
│    → Shows breadth beyond React                                          │
│                                                                          │
│ 7. Tự phát hiện issues interviewer CHƯA HỎI                            │
│    → Shows proactive problem-solving                                     │
│                                                                          │
│ 🔴 WEAK SIGNALS (Interviewer ghi điểm thấp):                            │
│                                                                          │
│ 1. "Tôi dùng eslint-disable khi linter sai"                             │
│    → Linter KHÔNG sai, bạn không hiểu                                   │
│                                                                          │
│ 2. "useEffect giống componentDidMount"                                   │
│    → Class mentality, chưa hiểu hooks philosophy                        │
│                                                                          │
│ 3. Không đề cập cleanup khi viết Effect                                  │
│    → Missing critical habit                                              │
│                                                                          │
│ 4. "Tôi không biết Object.is"                                            │
│    → Missing core mechanism knowledge                                    │
│                                                                          │
│ 5. Fix bằng cách thử-sai (random useCallback, useMemo)                  │
│    → No systematic approach                                              │
│                                                                          │
│ 6. Không biết khi nào KHÔNG dùng Effect                                  │
│    → Overuse Effect = not understanding React model                      │
│                                                                          │
│ 7. Không hỏi clarifying questions                                        │
│    → Just code without understanding requirements                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 32. Advanced Composability Patterns

```
KHI INTERVIEWER HỎI: "Thiết kế hook composable?"

✅ PATTERN 1: HOOK PIPELINE

// Mỗi hook làm 1 việc, combine qua composition:
function useSearchWithDebounce(query) {
  const debouncedQuery = useDebounce(query, 300);    // Hook 1
  const results = useSearch(debouncedQuery);          // Hook 2
  const sorted = useSortedResults(results);           // Hook 3
  return sorted;
}

// Mỗi hook có Effect riêng:
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useSearch(query) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (!query) { setResults([]); return; }
    const controller = new AbortController();
    searchAPI(query, { signal: controller.signal })
      .then(setResults)
      .catch(() => {});
    return () => controller.abort();
  }, [query]);
  return results;
}

✅ PATTERN 2: HOOK WITH OPTIONS OBJECT

function useWebSocket(url, options = {}) {
  const {
    reconnect = true,
    reconnectInterval = 3000,
    maxRetries = 5,
    onMessage,     // ← callback prop → CẦN stable!
    onError,
  } = options;

  // Stabilize callbacks via useEffectEvent pattern:
  const handleMessage = useEffectEvent((event) => {
    onMessage?.(JSON.parse(event.data));
  });

  const handleError = useEffectEvent((error) => {
    onError?.(error);
  });

  useEffect(() => {
    let ws;
    let retryCount = 0;

    function connect() {
      ws = new WebSocket(url);
      ws.onmessage = handleMessage;
      ws.onerror = handleError;
      ws.onclose = () => {
        if (reconnect && retryCount < maxRetries) {
          retryCount++;
          setTimeout(connect, reconnectInterval);
        }
      };
    }

    connect();
    return () => { ws?.close(); };
  }, [url, reconnect, reconnectInterval, maxRetries]);
  //    ↑ chỉ primitives/stable values
  //    handleMessage/handleError = stable (useEffectEvent)
}

✅ PATTERN 3: HOOK THAT RETURNS HOOKS

// Factory pattern — advanced:
function createResourceHook(resourceUrl) {
  return function useResource(id) {
    const [data, setData] = useState(null);
    useEffect(() => {
      const controller = new AbortController();
      fetch(`${resourceUrl}/${id}`, { signal: controller.signal })
        .then(r => r.json())
        .then(setData);
      return () => controller.abort();
    }, [id]);
    return data;
  };
}

const useUser = createResourceHook('/api/users');
const usePost = createResourceHook('/api/posts');
// Usage: const user = useUser(userId);

INTERVIEW SIGNAL:
"Composable hooks = UNIX philosophy: mỗi hook làm 1 việc tốt,
 combine bằng composition. Dependencies tự nhiên chảy qua pipeline."
```

### 33. Career Leveling — Effect Knowledge By Level

```
┌──────────────────────────────────────────────────────────────────────────┐
│              EFFECT KNOWLEDGE = CAREER LEVEL SIGNAL                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 📊 JUNIOR (0-2 năm):                                                    │
│ ✅ BIẾT:                                                                 │
│ • Syntax: useEffect(fn, deps)                                            │
│ • 3 dạng: no deps, [], [dep1, dep2]                                      │
│ • Cleanup function cơ bản                                                │
│ • Fetch data trong Effect                                                │
│ ❌ THƯỜNG THIẾU:                                                         │
│ • Race conditions                                                        │
│ • Stale closures                                                         │
│ • Object.is comparison                                                   │
│ • Khi nào KHÔNG dùng Effect                                              │
│                                                                          │
│ 📊 MID (2-4 năm):                                                       │
│ ✅ BIẾT:                                                                 │
│ • Tất cả Junior + ...                                                    │
│ • Race condition handling (ignore flag)                                   │
│ • Stale closure + updater function                                       │
│ • Object dependency → useMemo/destructure                                │
│ • Custom hooks cơ bản                                                    │
│ ❌ THƯỜNG THIẾU:                                                         │
│ • WHY React chọn thiết kế này                                            │
│ • useEffectEvent concept                                                 │
│ • Testing strategies                                                     │
│ • Architecture-level thinking                                            │
│                                                                          │
│ 📊 SENIOR (4-7 năm):                                                    │
│ ✅ BIẾT:                                                                 │
│ • Tất cả Mid + ...                                                       │
│ • Mental model: sync machine                                             │
│ • Framework comparison (Vue, Solid)                                      │
│ • Performance profiling                                                  │
│ • Custom hook design (stable API)                                        │
│ • Testing Effects properly                                               │
│ • Khi nào dùng library vs raw Effect                                     │
│ ❌ THƯỜNG THIẾU:                                                         │
│ • React Fiber internals                                                  │
│ • Concurrent mode implications                                           │
│ • Large-scale migration strategy                                         │
│                                                                          │
│ 📊 STAFF+ (7+ năm):                                                     │
│ ✅ BIẾT:                                                                 │
│ • Tất cả Senior + ...                                                    │
│ • React Fiber architecture                                               │
│ • Concurrent mode + tearing                                              │
│ • Team education strategy                                                │
│ • Code review guidelines creation                                        │
│ • Migration planning (class → hooks)                                     │
│ • Ecosystem evolution prediction                                         │
│ • React Compiler impact analysis                                         │
│                                                                          │
│ 💡 KEY INSIGHT:                                                           │
│ "Không phải CÓ BIẾT bao nhiêu, mà BIẾT SÂU bao nhiêu.                  │
│  Junior biết 10 điều shallow.                                            │
│  Senior biết 5 điều deep + trade-offs + WHY."                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 34. Interview Preparation Timeline — 4 Tuần

```
┌──────────────────────────────────────────────────────────────────────────┐
│              4-WEEK PREPARATION PLAN                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 📅 TUẦN 1: FOUNDATIONS (2-3 giờ/ngày)                                   │
│ ├── Ngày 1-2: Đọc Phần A (Core Concepts)                                │
│ │   • Reactive values, Object.is, dependency rules                       │
│ │   • Viết tay: vẽ render cycle + Effect timing                         │
│ ├── Ngày 3-4: Đọc Phần B (Deep Dive)                                    │
│ │   • WHY questions cho mỗi design decision                             │
│ │   • So sánh với Vue/Solid approach                                     │
│ ├── Ngày 5-6: Practice Scenarios (Phần E)                                │
│ │   • Giải tất cả scenarios, tự fix trước khi xem đáp án                │
│ └── Ngày 7: Review + tự test kiến thức                                   │
│     • Giải thích mỗi concept cho người khác (rubber duck)                │
│                                                                          │
│ 📅 TUẦN 2: MISTAKES & DEBUGGING (2-3 giờ/ngày)                          │
│ ├── Ngày 1-3: Đọc Phần C (50 Mistakes)                                  │
│ │   • Focus: Mistakes 1-20 (most common in interviews)                   │
│ │   • Viết lại mỗi fix từ memory                                        │
│ ├── Ngày 4-5: Mistakes 21-40 (advanced)                                  │
│ │   • Focus: custom hooks, performance, testing                          │
│ ├── Ngày 6: Mistakes 41-50 (expert)                                      │
│ │   • Case study: practice debugging process                             │
│ └── Ngày 7: Mock debugging session                                       │
│     • Tìm code có bug trên internet, practice fix                        │
│                                                                          │
│ 📅 TUẦN 3: INTERVIEW PRACTICE (3-4 giờ/ngày)                            │
│ ├── Ngày 1-2: Phần D sections 1-11                                      │
│ │   • Practice trả lời MỖI câu hỏi từng level                           │
│ │   • Record bản thân, nghe lại tìm improvement                          │
│ ├── Ngày 3-4: Phần D sections 12-20                                     │
│ │   • Mock interview với bạn/AI                                          │
│ │   • Practice live coding strategy                                      │
│ ├── Ngày 5-6: System design practice                                     │
│ │   • Whiteboard 2-3 architectures                                       │
│ │   • Practice STAR behavioral answers                                   │
│ └── Ngày 7: Full mock interview (45 phút)                                │
│     • Concept → Debugging → Design → Q&A                                │
│                                                                          │
│ 📅 TUẦN 4: POLISH & CONFIDENCE (2 giờ/ngày)                             │
│ ├── Ngày 1-2: Review weak areas                                          │
│ │   • Xem lại sections điểm thấp trong rubric                            │
│ ├── Ngày 3-4: English vocabulary practice                                │
│ │   • Practice explaining in English (nếu interview English)             │
│ ├── Ngày 5: Cheat sheet review (Section 14)                              │
│ │   • Đọc và recite key phrases                                          │
│ ├── Ngày 6: Rest + light review                                          │
│ │   • Mindset check (Section 20)                                         │
│ └── Ngày 7: INTERVIEW DAY                                                │
│     • 15 phút đọc Cheat Sheet                                            │
│     • Deep breaths. You've got this. 🚀                                  │
│                                                                          │
│ 📊 EXPECTED OUTCOME:                                                     │
│ Tuần 1: Score 15-20 (Junior-Mid)                                         │
│ Tuần 2: Score 22-28 (Mid-Senior)                                         │
│ Tuần 3: Score 28-35 (Senior-Staff)                                       │
│ Tuần 4: Score 32-38 (Staff+)                                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 35. React Fiber & Effect Internals — Câu Hỏi Chuyên Sâu

```
KHI INTERVIEWER HỎI: "Effect hoạt động bên dưới thế nào?"

✅ FIBER ARCHITECTURE & EFFECTS:

FIBER NODE STRUCTURE:
"Mỗi component = 1 Fiber node trong linked list.
 Fiber node chứa:
 - memoizedState: linked list các hooks
 - updateQueue: pending updates
 - flags: side effects cần xử lý
 - tag: component type (Function, Class, Host)

 useEffect tạo Effect object:
 {
   tag: HookPassive,       // passive = sau paint
   create: setup function,
   destroy: cleanup function,
   deps: dependency array,
   next: next Effect (linked list)
 }"

COMMIT PHASE — KHI EFFECT THỰC SỰ CHẠY:
"React có 3 phases:
 1. RENDER PHASE: Gọi component function, tạo Virtual DOM
    → useEffect KHÔNG chạy ở đây
    → Chỉ ĐĂNG KÝ effect vào Fiber

 2. COMMIT PHASE: Apply changes to real DOM
    → Flush passive effects (cleanup cũ)
    → Schedule new passive effects

 3. PASSIVE EFFECT PHASE: Chạy sau paint
    → useEffect setup chạy ở đây
    → Asynchronous, không block paint

 Timeline:
 render → commit → paint → useEffect (passive)
                          ↑ useLayoutEffect chạy TRƯỚC paint"

DEPENDENCY COMPARISON — BÊN TRONG:
"React kiểm tra deps trong areHookInputsEqual():

 function areHookInputsEqual(nextDeps, prevDeps) {
   if (prevDeps === null) return false; // first render
   for (let i = 0; i < prevDeps.length; i++) {
     if (!Object.is(nextDeps[i], prevDeps[i])) {
       return false; // ← Found difference → re-run Effect
     }
   }
   return true; // All same → skip Effect
 }

 Key insights:
 1. Linear scan O(n) where n = deps length
 2. Short-circuit: returns false on FIRST difference
 3. Object.is cho TỪNG element (not deep compare)
 4. null prevDeps = always re-run (first mount)"

EFFECT LIFECYCLE TRONG FIBER:
"Mount:
 1. Component renders → Fiber created
 2. Effect objects created, stored in Fiber.updateQueue
 3. Commit phase → Effect flagged as HookHasEffect
 4. After paint → Effect.create() called
 5. Return value stored as Effect.destroy (cleanup)

 Update:
 1. Component re-renders → new Fiber created
 2. New deps compared with old deps
 3. If different → flag HookHasEffect
 4. After paint:
    a. Call Effect.destroy() (cleanup from LAST run)
    b. Call Effect.create() (new setup)
    c. Store new destroy

 Unmount:
 1. Fiber flagged for deletion
 2. All Effects' destroy() called
 3. Fiber removed from tree"

INTERVIEW SIGNAL:
"Tôi biết Effect là Fiber metadata, không phải magic.
 Mỗi hook = 1 node trong memoizedState linked list.
 Dependencies checked bằng areHookInputsEqual.
 React chọn passive (sau paint) vì UX > consistency."
```

### 36. useSyncExternalStore — Khi Effect Không Đủ

```
KHI INTERVIEWER HỎI: "Khi nào cần useSyncExternalStore thay vì useEffect?"

✅ GIẢI THÍCH:

VẤN ĐỀ: TEARING
"Concurrent Mode cho phép React pause rendering giữa chừng.
 Nếu external store thay đổi GIỮA render:
 - Component A đọc value = 1 (trước pause)
 - Component B đọc value = 2 (sau store update)
 - Cùng 1 render nhưng 2 giá trị khác → TORN UI

 useEffect KHÔNG giải quyết được vì:
 - Effect chạy SAU render → data đã torn
 - Re-render để fix → flicker visible"

useSyncExternalStore GIẢI QUYẾT:
"React đọc store SYNCHRONOUSLY trong render phase.
 Nếu store thay đổi → React restart render với giá trị mới.

 // Thay vì:
 function useWindowWidth() {
   const [width, setWidth] = useState(window.innerWidth);
   useEffect(() => {
     const handler = () => setWidth(window.innerWidth);
     window.addEventListener('resize', handler);
     return () => window.removeEventListener('resize', handler);
   }, []);
   return width;
   // ❌ Tearing risk trong Concurrent Mode
 }

 // Dùng:
 function useWindowWidth() {
   return useSyncExternalStore(
     (callback) => {
       window.addEventListener('resize', callback);
       return () => window.removeEventListener('resize', callback);
     },
     () => window.innerWidth,        // client snapshot
     () => 1024                      // server snapshot (SSR)
   );
   // ✅ No tearing, SSR compatible
 }"

KHI NÀO DÙNG CÁI NÀO:
┌────────────────────────┬──────────────────┬─────────────────────┐
│ Scenario               │ useEffect        │ useSyncExternalStore│
├────────────────────────┼──────────────────┼─────────────────────┤
│ React state/context    │ ✅ (React quản lý)│ ❌ Không cần        │
│ Browser API (simple)   │ ✅ OK             │ ✅ Better           │
│ Redux/Zustand store    │ ❌ Tearing risk   │ ✅ Required         │
│ WebSocket messages     │ ✅ OK (event-based)│ ⚠️ Depends         │
│ localStorage           │ ✅ OK             │ ✅ Better           │
│ Network status         │ ✅ OK             │ ✅ Better           │
│ Data fetching          │ ✅ OK (use Query)  │ ❌ Wrong tool       │
│ DOM mutations          │ ✅ useLayoutEffect │ ❌ Wrong tool       │
└────────────────────────┴──────────────────┴─────────────────────┘

INTERVIEW SIGNAL:
"useSyncExternalStore cho external state mà React KHÔNG quản lý.
 useEffect cho side effects (fetch, subscribe, DOM).
 Khác nhau về TIMING: sync trong render vs async sau paint."
```

### 37. Effect vs Server Actions — Modern React Patterns

```
KHI INTERVIEWER HỎI: "React Server Components thay đổi gì về Effects?"

✅ PARADIGM SHIFT:

TRƯỚC (Client-only):
"Mọi thứ trong useEffect:
 - Data fetching: useEffect + fetch
 - Form submission: useEffect + state
 - Mutations: useEffect + API call

 Vấn đề:
 - Waterfall: render → Effect → fetch → render
 - Loading states manual
 - Race conditions manual
 - Bundle size: fetch logic in client bundle"

SAU (Server Components + Actions):
"Phân chia rõ ràng:

 SERVER COMPONENTS (no Effects):
 - Data fetching: async/await trực tiếp
 - No loading state needed (streamed with Suspense)
 - No race conditions (server-side)
 - Zero client bundle impact

 CLIENT COMPONENTS (Effects for subscriptions):
 - WebSocket connections
 - Browser API subscriptions
 - DOM measurements
 - Third-party library integration

 SERVER ACTIONS (no Effects):
 - Form mutations: <form action={serverAction}>
 - Data mutations: 'use server' functions
 - Revalidation: revalidatePath/revalidateTag"

CODE COMPARISON:

// ❌ TRƯỚC: Effect-heavy
'use client';
function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => { if (!ignore) setProduct(data); })
      .catch(e => { if (!ignore) setError(e); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <ProductView product={product} />;
}
// 15 lines of boilerplate cho 1 fetch!

// ✅ SAU: Server Component
async function ProductPage({ id }) {
  const product = await db.products.findById(id);
  return <ProductView product={product} />;
}
// 3 lines. No Effects. No loading state. No race conditions.
// Suspense handles loading boundary automatically.

REMAINING EFFECT USE CASES IN MODERN REACT:
1. Browser API subscriptions (resize, online/offline)
2. WebSocket/SSE connections
3. Third-party library init (Chart.js, Map)
4. DOM measurement (useLayoutEffect)
5. Analytics/tracking
6. Intersection Observer
7. Keyboard shortcuts
8. Focus management

"useEffect không biến mất — nó trở về đúng vai trò:
 SYNCHRONIZATION với external systems.
 Không còn bị lạm dụng cho data fetching."
```

### 38. Animation & Effect Lifecycle

```
KHI INTERVIEWER HỎI VỀ ANIMATIONS TRONG REACT:

✅ ANIMATION PATTERNS VỚI EFFECTS:

PATTERN 1: CSS Transition trigger
"KHÔNG cần useEffect — dùng state class toggle:

 function FadeIn({ show, children }) {
   return (
     <div className={`fade ${show ? 'visible' : 'hidden'}`}>
       {children}
     </div>
   );
 }
 // CSS handles transition. No Effect needed. ✅"

PATTERN 2: Web Animations API
"CẦN useEffect cho imperative animations:

 function SlideIn({ trigger }) {
   const ref = useRef(null);

   useEffect(() => {
     if (!trigger) return;

     const animation = ref.current.animate(
       [
         { transform: 'translateX(-100%)' opacity: 0 },
         { transform: 'translateX(0)', opacity: 1 },
       ],
       { duration: 300, easing: 'ease-out', fill: 'forwards' }
     );

     return () => animation.cancel(); // ✅ Cleanup cancel animation
   }, [trigger]);

   return <div ref={ref}>{children}</div>;
 }"

PATTERN 3: requestAnimationFrame loop
"Cho continuous animations (game loop, particle, canvas):

 function ParticleCanvas({ particleCount }) {
   const canvasRef = useRef(null);

   useEffect(() => {
     const canvas = canvasRef.current;
     const ctx = canvas.getContext('2d');
     let animationId;
     let particles = createParticles(particleCount);

     function animate() {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       particles.forEach(p => {
         p.update();
         p.draw(ctx);
       });
       animationId = requestAnimationFrame(animate);
     }

     animate();

     return () => {
       cancelAnimationFrame(animationId); // ✅ Stop loop
       particles = null;                  // ✅ Free memory
     };
   }, [particleCount]);
   // ← particleCount đổi → restart với particle count mới

   return <canvas ref={canvasRef} />;
 }"

PATTERN 4: Intersection Observer animations
"Animate on scroll — trigger khi element visible:

 function AnimateOnScroll({ children }) {
   const ref = useRef(null);
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
     const el = ref.current;
     if (!el) return;

     const observer = new IntersectionObserver(
       ([entry]) => {
         if (entry.isIntersecting) {
           setIsVisible(true);
           observer.unobserve(el); // Once only
         }
       },
       { threshold: 0.1 }
     );

     observer.observe(el);
     return () => observer.disconnect(); // ✅ Cleanup
   }, []); // Static observer — no deps needed

   return (
     <div ref={ref} className={isVisible ? 'animate-in' : 'pre-animate'}>
       {children}
     </div>
   );
 }"

KEY RULES FOR ANIMATION EFFECTS:
1. CSS transitions → NO Effect (declarative)
2. Imperative animations → useEffect + cleanup (cancel)
3. rAF loops → useEffect + cancelAnimationFrame
4. Scroll-triggered → IntersectionObserver + cleanup
5. Layout-dependent → useLayoutEffect (measure → animate)
```

### 39. Multi-Step Form Wizard — Effect Pattern

```
KHI INTERVIEWER HỎI: "Thiết kế multi-step form với auto-save?"

✅ ARCHITECTURE:

STATE DESIGN:
"useReducer cho complex form state:

 const initialState = {
   step: 1,
   data: {
     step1: { name: '', email: '' },
     step2: { address: '', city: '' },
     step3: { plan: 'basic', payment: '' },
   },
   isDirty: false,
   lastSaved: null,
 };

 function formReducer(state, action) {
   switch (action.type) {
     case 'UPDATE_FIELD':
       return {
         ...state,
         isDirty: true,
         data: {
           ...state.data,
           [action.step]: {
             ...state.data[action.step],
             [action.field]: action.value,
           },
         },
       };
     case 'NEXT_STEP':
       return { ...state, step: state.step + 1 };
     case 'PREV_STEP':
       return { ...state, step: state.step - 1 };
     case 'MARK_SAVED':
       return { ...state, isDirty: false, lastSaved: Date.now() };
   }
 }"

EFFECTS (3 separate — each 1 concern):

// Effect 1: Auto-save (debounced)
useEffect(() => {
  if (!state.isDirty) return;

  const timer = setTimeout(async () => {
    try {
      await saveDraft(state.data);
      dispatch({ type: 'MARK_SAVED' });
    } catch (e) {
      // Retry on next change, don't block user
      console.error('Auto-save failed:', e);
    }
  }, 2000);

  return () => clearTimeout(timer);
}, [state.data, state.isDirty]);
// ← Debounce: chỉ save sau 2s không thay đổi
// ← isDirty tránh save khi vừa load

// Effect 2: Restore draft on mount
useEffect(() => {
  let ignore = false;

  loadDraft().then(draft => {
    if (!ignore && draft) {
      dispatch({ type: 'RESTORE_DRAFT', draft });
    }
  });

  return () => { ignore = true; };
}, []); // ← Mount only

// Effect 3: Warn on unsaved changes (beforeunload)
useEffect(() => {
  if (!state.isDirty) return;

  const handler = (e) => {
    e.preventDefault();
    e.returnValue = ''; // Browser shows native dialog
  };

  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [state.isDirty]);
// ← Chỉ warn khi có unsaved changes
// ← Cleanup removes warning khi saved

WHY 3 EFFECTS (không gom):
"Effect 1 (auto-save): re-run khi data changes (debounced)
 Effect 2 (restore): run once on mount
 Effect 3 (warn): toggle khi isDirty changes

 Gom lại = auto-save re-run khi isDirty toggles = waste request.
 Mỗi Effect có lifecycle khác nhau → TÁCH."
```

### 40. Optimistic UI — Effect-Free Pattern

```
KHI INTERVIEWER HỎI: "Implement optimistic UI cho like button?"

✅ OPTIMISTIC UI — KHÔNG CẦN EFFECT:

TRƯỚC (Effect-based — BAD):
function LikeButton({ postId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pending) return;

    fetch(`/api/posts/${postId}/like`, {
      method: liked ? 'POST' : 'DELETE',
    })
      .then(r => { if (!r.ok) setLiked(!liked); }) // rollback
      .finally(() => setPending(false));
  }, [pending, liked, postId]);
  // ❌ 3 deps, complex timing, race condition possible

  return <button onClick={() => {
    setLiked(!liked);
    setPending(true);
  }}>♥ {liked ? 'Liked' : 'Like'}</button>;
}

SAU (Event handler — GOOD):
function LikeButton({ postId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked);

  async function handleClick() {
    const newLiked = !liked;
    setLiked(newLiked); // Optimistic update

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      });
    } catch {
      setLiked(!newLiked); // Rollback on error
    }
  }

  return <button onClick={handleClick}>
    ♥ {liked ? 'Liked' : 'Like'}
  </button>;
}
// ✅ No Effect! Event handler handles everything.

REACT 19 (useOptimistic — BEST):
function LikeButton({ postId, liked: serverLiked, toggleLike }) {
  const [optimisticLiked, addOptimistic] = useOptimistic(
    serverLiked,
    (current, newLiked) => newLiked
  );

  async function handleClick() {
    const newLiked = !optimisticLiked;
    addOptimistic(newLiked);     // Show immediately
    await toggleLike(postId);    // Server action
    // React auto-reverts if action fails
  }

  return <button onClick={handleClick}>
    ♥ {optimisticLiked ? 'Liked' : 'Like'}
  </button>;
}
// ✅ useOptimistic: auto rollback, no manual error handling

INTERVIEW INSIGHT:
"Optimistic UI là PERFECT example của 'Effect không cần.'
 User click = EVENT → Event handler xử lý.
 Effect chỉ cần nếu có SUBSCRIPTION (ví dụ: real-time sync).

 Rule: Nếu action BẮT ĐẦU từ user interaction → EVENT HANDLER.
       Nếu action BẮT ĐẦU từ dependency change → EFFECT."
```

### 41. Error Boundary + Effect Integration

```
KHI INTERVIEWER HỎI: "Error handling strategy cho Effects?"

✅ 3-LAYER ERROR STRATEGY:

LAYER 1: Effect-level try/catch
"Mỗi Effect tự handle errors nó có thể recover:

 useEffect(() => {
   const controller = new AbortController();

   fetch(url, { signal: controller.signal })
     .then(r => {
       if (!r.ok) throw new Error(`HTTP ${r.status}`);
       return r.json();
     })
     .then(data => setState({ status: 'success', data }))
     .catch(error => {
       if (error.name === 'AbortError') return; // Cleanup cancelled
       setState({ status: 'error', error });    // Recoverable error
     });

   return () => controller.abort();
 }, [url]);

 // Component shows error UI + retry button"

LAYER 2: Error Boundary cho unrecoverable errors
"Khi Effect code THROW (not Promise rejection):

 class EffectErrorBoundary extends React.Component {
   state = { hasError: false, error: null };

   static getDerivedStateFromError(error) {
     return { hasError: true, error };
   }

   componentDidCatch(error, info) {
     logErrorToService(error, info.componentStack);
   }

   render() {
     if (this.state.hasError) {
       return <ErrorFallback
         error={this.state.error}
         reset={() => this.setState({ hasError: false })}
       />;
     }
     return this.props.children;
   }
 }

 // Usage:
 <EffectErrorBoundary>
   <ChatRoom roomId={roomId} />
 </EffectErrorBoundary>"

LAYER 3: Global error handler (last resort)
"Cho errors mà component KHÔNG catch:

 useEffect(() => {
   const handler = (event) => {
     // Unhandled Promise rejections (async Effect errors)
     logToSentry(event.reason);
   };

   window.addEventListener('unhandledrejection', handler);
   return () => window.removeEventListener('unhandledrejection', handler);
 }, []);"

CRITICAL GOTCHA:
"Error Boundary KHÔNG catch:
 1. Event handler errors → try/catch in handler
 2. Async code (Promise rejections) → .catch() in Effect
 3. SSR errors → Server error boundary
 4. Error boundary itself → Next boundary up

 Effect errors cần .catch() vì async!
 Error Boundary chỉ catch SYNC throws."

ERROR RECOVERY PATTERNS:
1. Retry button → reset state, re-trigger Effect
2. Exponential backoff → Effect nội bộ
3. Fallback data → cache/localStorage
4. Graceful degradation → show partial UI
5. Circuit breaker → stop retrying after N failures
```

### 42. React 18 Automatic Batching & Effects

```
KHI INTERVIEWER HỎI: "React 18 batching ảnh hưởng Effects thế nào?"

✅ AUTOMATIC BATCHING:

TRƯỚC REACT 18:
"Batching CHỈ trong React event handlers:

 // ✅ Batched (React event):
 function handleClick() {
   setCount(c => c + 1);
   setFlag(f => !f);
   // → 1 re-render (batched)
 }

 // ❌ NOT batched (setTimeout, Promise, native event):
 setTimeout(() => {
   setCount(c => c + 1); // → re-render #1
   setFlag(f => !f);     // → re-render #2
 });"

SAU REACT 18:
"Batching EVERYWHERE — bao gồm trong Effects:

 useEffect(() => {
   // Tất cả setState trong cùng 1 Effect đều BATCHED:
   setLoading(false);     // ╮
   setData(fetchedData);  // ├── 1 re-render (batched!)
   setError(null);        // ╯

   // Kể cả trong Promise:
   fetch(url)
     .then(data => {
       setLoading(false);   // ╮
       setData(data);       // ├── 1 re-render (batched!)
       setError(null);      // ╯
     });
 }, [url]);"

ẢNH HƯỞNG ĐẾN DEPENDENCY DESIGN:
"Batching = fewer re-renders = fewer Effect re-runs.

 Trước React 18:
 setState A → re-render → Effect check deps
 setState B → re-render → Effect check deps
 = 2 dependency checks, possibly 2 Effect runs

 Sau React 18:
 setState A + B → 1 re-render → 1 dependency check
 = 1 check, max 1 Effect run

 Hệ quả: Một số bugs 'tự fix' khi upgrade React 18
 vì Effect chạy ít lần hơn (batched state updates)."

OPT-OUT (hiếm khi cần):
"Nếu CẦN force render giữa 2 setState:

 import { flushSync } from 'react-dom';

 flushSync(() => setCount(c => c + 1)); // → render NOW
 flushSync(() => setFlag(f => !f));     // → render NOW

 ⚠️ HIẾM KHI CẦN. Chỉ cho DOM measurement giữa 2 updates."

INTERVIEW SIGNAL:
"React 18 batching giảm Effect runs vì ít re-renders.
 Đây là optimization MIỄN PHÍ khi upgrade.
 Code pattern KHÔNG đổi — chỉ behavior tốt hơn."
```

### 43. Accessibility (a11y) & Effects

```
KHI INTERVIEWER HỎI: "Accessibility concerns với Effects?"

✅ A11Y PATTERNS VỚI EFFECTS:

PATTERN 1: Focus management
"Sau navigation/modal open → focus đúng element:

 function Modal({ isOpen, onClose, children }) {
   const firstFocusableRef = useRef(null);
   const previousFocusRef = useRef(null);

   useEffect(() => {
     if (!isOpen) return;

     // Save current focus
     previousFocusRef.current = document.activeElement;

     // Focus first focusable element
     firstFocusableRef.current?.focus();

     return () => {
       // Restore focus on close
       previousFocusRef.current?.focus();
     };
   }, [isOpen]);

   // Focus trap (Tab cycling within modal)
   useEffect(() => {
     if (!isOpen) return;

     const handleKeyDown = (e) => {
       if (e.key === 'Escape') onClose();
       if (e.key === 'Tab') {
         // Trap focus within modal
         trapFocus(e, modalRef.current);
       }
     };

     document.addEventListener('keydown', handleKeyDown);
     return () => document.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);
 }"

PATTERN 2: Live region announcements
"Screen reader cần biết khi content cập nhật:

 function SearchResults({ query, results, loading }) {
   const [announcement, setAnnouncement] = useState('');

   useEffect(() => {
     if (loading) {
       setAnnouncement(`Đang tìm kiếm ${query}`);
     } else {
       setAnnouncement(
         `Tìm thấy ${results.length} kết quả cho ${query}`
       );
     }
   }, [query, results.length, loading]);

   return (
     <>
       <div role='status' aria-live='polite' className='sr-only'>
         {announcement}
       </div>
       {/* ... results UI */}
     </>
   );
 }"

PATTERN 3: Reduced motion preference
"Respect user's motion preference:

 function useReducedMotion() {
   const [prefersReduced, setPrefersReduced] = useState(false);

   useEffect(() => {
     const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
     setPrefersReduced(mql.matches);

     const handler = (e) => setPrefersReduced(e.matches);
     mql.addEventListener('change', handler);
     return () => mql.removeEventListener('change', handler);
   }, []);

   return prefersReduced;
 }

 // Usage:
 function AnimatedComponent() {
   const prefersReduced = useReducedMotion();

   useEffect(() => {
     if (prefersReduced) return; // Skip animations
     const animation = startAnimation();
     return () => animation.cancel();
   }, [prefersReduced]);
 }"

PATTERN 4: Skip link & scroll management
"Sau route change → announce to screen reader:

 function RouteAnnouncer() {
   const pathname = usePathname();

   useEffect(() => {
     // Announce page change
     const title = document.title;
     const announcer = document.getElementById('route-announcer');
     if (announcer) announcer.textContent = `Navigated to ${title}`;

     // Scroll to top
     window.scrollTo(0, 0);

     // Focus main content (skip nav)
     document.getElementById('main-content')?.focus();
   }, [pathname]);

   return <div id='route-announcer' role='status' aria-live='assertive'
               className='sr-only' />;
 }"

A11Y EFFECTS CHECKLIST:
✅ Focus management (modal, route change, dynamic content)
✅ Live region updates (search results, form validation)
✅ Keyboard navigation (focus trap, shortcuts)
✅ Reduced motion (prefers-reduced-motion)
✅ Screen reader announcements (route changes, async updates)
```

### 44. Internationalization (i18n) & Dynamic Loading

```
KHI INTERVIEWER HỎI: "i18n loading pattern với Effects?"

✅ DYNAMIC LOCALE LOADING:

PATTERN: Load translation files on demand
function useTranslations(locale) {
  const [messages, setMessages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    // Dynamic import → code splitting per locale
    import(`../locales/${locale}.json`)
      .then(module => {
        if (!ignore) {
          setMessages(module.default);
          setIsLoading(false);
        }
      })
      .catch(error => {
        if (!ignore) {
          console.error(`Failed to load locale: ${locale}`, error);
          // Fallback to default locale
          import('../locales/en.json').then(m => {
            if (!ignore) {
              setMessages(m.default);
              setIsLoading(false);
            }
          });
        }
      });

    return () => { ignore = true; };
  }, [locale]);
  // ← locale thay đổi → load translation mới
  // ← ignore flag prevents stale locale

  return { messages, isLoading };
}

DOCUMENT DIRECTION (RTL support):
useEffect(() => {
  const dir = ['ar', 'he', 'fa'].includes(locale) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;

  return () => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  };
}, [locale]);
// ← Sync DOM attributes với locale state

DEPENDENCY INSIGHT:
"locale là primitive (string) → stable dependency.
 Dynamic import trả về Promise → cần ignore flag.
 Fallback chain (vi → en) nằm TRONG Effect → clean."
```

### 45. Micro-Frontend & Module Federation Effects

```
KHI INTERVIEWER HỎI: "Effects trong micro-frontend architecture?"

✅ CHALLENGES:

1. SHARED STATE ACROSS MICRO-FRONTENDS:
"Mỗi micro-frontend = isolated React app.
 Communication qua Custom Events:

 // App A: Publish event
 function publishCartUpdate(items) {
   window.dispatchEvent(
     new CustomEvent('cart:updated', { detail: { items } })
   );
 }

 // App B: Subscribe via Effect
 function useCartFromHost() {
   const [cart, setCart] = useState([]);

   useEffect(() => {
     const handler = (e) => setCart(e.detail.items);
     window.addEventListener('cart:updated', handler);
     return () => window.removeEventListener('cart:updated', handler);
   }, []);
   // ← Empty deps: listener is static
   // ← Cleanup critical: App B có thể unmount/remount

   return cart;
 }"

2. MODULE FEDERATION — LAZY LOADED EFFECTS:
"Remote module load lần đầu → Effect trong remote component:

 // Host app:
 const RemoteComponent = React.lazy(
   () => import('remoteApp/Widget')
 );

 // Remote Widget có Effect riêng:
 function Widget() {
   useEffect(() => {
     // Widget-specific subscription
     const unsubscribe = widgetService.subscribe(handleUpdate);
     return () => unsubscribe();
   }, []);
   // ⚠️ PITFALL: Host unmount Widget → cleanup PHẢI chạy
   // Nếu remote module unload → cleanup CÓ THỂ thất bại
 }"

3. ISOLATION PATTERN:
"Mỗi micro-frontend cleanup TOÀN BỘ khi unmount:

 function MicroFrontendContainer({ name, config }) {
   const containerRef = useRef(null);

   useEffect(() => {
     // Mount micro-frontend
     const app = loadMicroFrontend(name, {
       container: containerRef.current,
       ...config,
     });

     return () => {
       // CRITICAL: cleanup mọi thứ
       app.unmount();
       app.removeEventListeners();
       app.clearTimers();
       app.closeConnections();
       // Container trống → không leak
     };
   }, [name, config.version]);
   // ← Re-mount khi version changes

   return <div ref={containerRef} />;
 }"

INTERVIEW SIGNAL:
"Micro-frontends amplify Effect cleanup importance.
 Mỗi app boundary = potential leak point.
 Custom Events cho cross-app communication.
 Cleanup PHẢI comprehensive — không chỉ 1 unsubscribe."
```

### 46. Effect Dependency Visualization — Mental Model

```
KHI INTERVIEWER HỎI: "Giải thích dependency flow bằng diagram?"

✅ VISUALIZATION MODELS:

MODEL 1: DATA FLOW DIAGRAM
"Dependency array = INPUTS, Effect = PROCESSOR, Side Effect = OUTPUT:

 ┌─────────────────────────────────────────────────────┐
 │                    COMPONENT                         │
 │                                                     │
 │  props.roomId ──┐                                   │
 │                 │    ┌──────────────┐                │
 │  state.theme ───┤───►│   EFFECT     │──► WebSocket  │
 │                 │    │  (processor) │    connection  │
 │  context.user ──┘    └──────┬───────┘                │
 │                             │                        │
 │                      ┌──────▼───────┐                │
 │                      │   CLEANUP    │──► disconnect  │
 │                      └──────────────┘                │
 │                                                     │
 │  deps = [roomId]     ← chỉ roomId trigger re-sync  │
 │  theme → useEffectEvent (đọc nhưng không trigger)   │
 │  user → stable (context identity không đổi nếu memo)│
 │                                                     │
 └─────────────────────────────────────────────────────┘"

MODEL 2: TIMELINE DIAGRAM
"Visualize WHEN Effect runs:

 Render 1: roomId='general'  theme='dark'
 ──────────────────────────────────────────────
 │ render │ commit │ paint │ Effect: connect('general')
 ──────────────────────────────────────────────

 Render 2: roomId='general'  theme='light'
 ──────────────────────────────────────────────
 │ render │ commit │ paint │ (no Effect — roomId same)
 ──────────────────────────────────────────────

 Render 3: roomId='random'  theme='light'
 ──────────────────────────────────────────────
 │ render │ commit │ paint │ cleanup('general')
 │        │        │       │ Effect: connect('random')
 ──────────────────────────────────────────────

 Unmount:
 ──────────────────────────────────────────────
 │ cleanup('random') │ (component removed)
 ──────────────────────────────────────────────"

MODEL 3: DECISION MATRIX
"Cho mỗi reactive value, ask 2 questions:

 ┌──────────────┬──────────────────┬──────────────────┐
 │ Value        │ Effect READS it? │ Should trigger   │
 │              │                  │ re-sync?         │
 ├──────────────┼──────────────────┼──────────────────┤
 │ roomId       │ ✅ Yes           │ ✅ Yes → deps    │
 │ theme        │ ✅ Yes           │ ❌ No → event    │
 │ setState     │ ❌ No (stable)   │ N/A → skip       │
 │ ref          │ ❌ No (stable)   │ N/A → skip       │
 │ options obj  │ ✅ Yes           │ ⚠️ Unstable!     │
 │ → fix        │ Move inside      │ → primitive deps │
 └──────────────┴──────────────────┴──────────────────┘"

INTERVIEW TIP:
"Khi interviewer đưa code phức tạp, tôi TỰ VẼ diagram:
 1. List tất cả reactive values Effect đọc
 2. Check: value thay đổi → Effect CẦN re-run?
 3. YES → keep in deps. NO → extract via technique.
 Diagram làm visible vấn đề TRƯỚC khi code."
```

### 47. Interview War Stories — Lessons Learned

```
COLLECTION CÁC BÀI HỌC TỪ PRODUCTION:

WAR STORY 1: "The Notification That Wouldn't Stop"
"App notification system: mỗi message nhận được → play sound.
 Bug: sound play 5-6 lần cho 1 message.

 Root cause: Effect deps = [messages] (array reference).
 Mỗi message mới → new array → Effect re-run.
 Effect play sound cho TẤT CẢ messages, không chỉ message mới.

 Fix: Track lastProcessedIndex:
 const processedRef = useRef(0);
 useEffect(() => {
   const newMessages = messages.slice(processedRef.current);
   newMessages.forEach(m => playNotificationSound());
   processedRef.current = messages.length;
 }, [messages]);

 Lesson: array dependency → Effect CHẠY LẠI,
 nhưng logic phải handle INCREMENTAL changes."

WAR STORY 2: "The Memory Leak That Took Down Production"
"Dashboard với 20 widgets, mỗi widget có WebSocket subscription.
 After 2 hours → browser tab crash. Memory: 2GB → 8GB.

 Root cause: Widget component re-render khi parent state changes.
 Mỗi re-render → new WS connection (object dep không stable).
 OLD connection không cleanup vì cleanup function stale.

 Fix:
 1. useMemo cho connection options
 2. Proper cleanup: ws.close() in Effect return
 3. Shared connection via Context (1 WS cho 20 widgets)

 Lesson: N components × unstable deps = N² connections.
 Shared resources nên centralize."

WAR STORY 3: "The SEO Disaster"
"E-commerce product page: product data fetch trong useEffect.
 Google crawled empty page → SEO rankings dropped 60%.

 Root cause: useEffect chạy SAU render → SSR render empty HTML.
 Googlebot không execute JS trong mọi trường hợp.

 Fix: Migrate to Server Component (Next.js):
 - Data fetch trên server
 - HTML rendered with data
 - SEO: full content visible to crawlers

 Lesson: useEffect = client-only. SEO-critical data
 PHẢI có trước paint → Server Component hoặc getServerSideProps."

WAR STORY 4: "The Race Condition Nobody Noticed"
"Search page: user type fast → results flicker.
 QA said 'it works' vì trên fast connection, responses in order.
 Production: slow 3G users → responses out of order constantly.

 Root cause: No race condition handling. Multiple fetches in flight.
 Fast response arrives, then slow response OVERWRITES.

 Fix: AbortController:
 useEffect(() => {
   const controller = new AbortController();
   fetch(`/search?q=${query}`, { signal: controller.signal })
     .then(...)
     .catch(e => { if (e.name !== 'AbortError') handleError(e); });
   return () => controller.abort();
 }, [query]);

 Lesson: ALWAYS test with Network Throttling in DevTools.
 Fast connections MASK race conditions."

WAR STORY 5: "The StrictMode Panic"
"Team upgrade React 17 → 18. Enable StrictMode.
 Mọi Effect chạy 2 lần → API calls doubled.

 Panic: 'React is broken! Our API costs doubled!'

 Reality: Effects THIẾU cleanup = thiếu idempotency.
 StrictMode EXPOSE existing bugs, không CREATE bugs.

 Fix: Add cleanup to ALL Effects:
 - fetch: AbortController
 - timers: clearTimeout/clearInterval
 - subscriptions: unsubscribe
 - DOM: remove event listeners

 Lesson: StrictMode double-mount is a FEATURE, not a bug.
 Nếu code break = code CÓ bug từ trước."
```

### 48. Master Reference Card — Tổng Hợp Toàn Bộ Part D

```
┌──────────────────────────────────────────────────────────────────────────┐
│        MASTER REFERENCE CARD — EFFECT DEPENDENCIES INTERVIEW            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 🧠 CORE MENTAL MODEL:                                                   │
│ "Effect = synchronization machine, NOT lifecycle method"                │
│ "Dependencies DESCRIBE code, NOT control flow"                          │
│ "Change CODE to change dependencies"                                    │
│                                                                          │
│ 📐 COMPARISON TABLE:                                                    │
│ Object.is  → Reference equality, O(1)                                   │
│ Primitives → Same value = same reference (safe dep)                     │
│ Objects    → New literal = new reference (unsafe dep)                   │
│ Functions  → New closure = new reference (unsafe dep)                   │
│ setState   → Stable identity (safe, skip dep)                           │
│ useRef     → Stable container (safe, skip dep)                          │
│ dispatch   → Stable identity (safe, skip dep)                           │
│                                                                          │
│ 🔧 FIX TOOLKIT (ranked):                                                │
│ 1. Remove: Is this really an Effect? (derived state? event?)            │
│ 2. Move inside: Object/function dep → create in Effect                  │
│ 3. Destructure: { a, b } = obj → primitive deps                        │
│ 4. Updater fn: setCount(c => c+1) → remove state dep                   │
│ 5. useEffectEvent: Read but don't react                                 │
│ 6. useReducer: Co-locate related state                                  │
│ 7. useMemo/useCallback: Stabilize reference (last resort)              │
│                                                                          │
│ 🏗️ ARCHITECTURE RULES:                                                   │
│ • 1 Effect = 1 synchronization concern                                   │
│ • Cleanup = symmetrical undo of setup                                    │
│ • Effects in hooks layer, NOT component layer                            │
│ • Custom hooks return STABLE references                                  │
│ • React Query for data fetching > raw Effect                            │
│ • Server Components for SSR data > useEffect                            │
│                                                                          │
│ ⚡ MODERN REACT (19+):                                                    │
│ • use() replaces useEffect for data fetching                            │
│ • Server Actions replace useEffect for mutations                        │
│ • React Compiler auto-memoizes (less useMemo/useCallback)              │
│ • useOptimistic for optimistic UI (no Effect needed)                    │
│ • useActionState for form handling (no Effect needed)                   │
│                                                                          │
│ 🧪 TESTING RULES:                                                        │
│ • Test BEHAVIOR, not implementation                                      │
│ • Test cleanup (unmount verification)                                    │
│ • Test dependency changes (rerender with new props)                     │
│ • Test race conditions (delayed responses)                               │
│ • Test StrictMode compatibility                                          │
│                                                                          │
│ 🚩 RED FLAGS IN CODE REVIEW:                                             │
│ • eslint-disable exhaustive-deps                                         │
│ • Object/function in deps array                                          │
│ • useEffect with [] reading props/state                                  │
│ • Missing cleanup function                                               │
│ • 5+ dependencies in single Effect                                       │
│ • useEffect for derived state computation                                │
│ • Multiple setState calls without batching awareness                    │
│                                                                          │
│ 🎯 INTERVIEW SCORING:                                                    │
│ Junior: Syntax + basic usage (15-20/40)                                  │
│ Mid: Debugging + patterns (22-28/40)                                     │
│ Senior: Architecture + WHY (28-35/40)                                    │
│ Staff+: System design + team impact (32-38/40)                           │
│                                                                          │
│ 💡 THE GOLDEN RULE:                                                       │
│ "If you're fighting the dependency array,                                │
│  you're probably using the wrong tool."                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 49. State Machine + Effects — Structured Side Effects

```
KHI INTERVIEWER HỎI: "Quản lý complex Effect logic?"

✅ STATE MACHINE PATTERN:

VẤN ĐỀ VỚI BOOLEAN FLAGS:
"Multiple booleans = exponential states:
 isLoading, isError, isRetrying, isConnected
 → 2⁴ = 16 possible combinations
 → Nhiều combinations VÔ NGHĨA (loading + error + connected?)
 → Bug: impossible states trở thành possible"

GIẢI PHÁP: FINITE STATE MACHINE

// State machine cho WebSocket connection:
type ConnectionState =
  | { status: 'disconnected' }
  | { status: 'connecting'; attempt: number }
  | { status: 'connected'; socket: WebSocket }
  | { status: 'reconnecting'; attempt: number; lastError: Error }
  | { status: 'failed'; error: Error };

type ConnectionAction =
  | { type: 'CONNECT' }
  | { type: 'CONNECTED'; socket: WebSocket }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR'; error: Error }
  | { type: 'RETRY' };

function connectionReducer(
  state: ConnectionState,
  action: ConnectionAction
): ConnectionState {
  switch (state.status) {
    case 'disconnected':
      if (action.type === 'CONNECT')
        return { status: 'connecting', attempt: 1 };
      return state;

    case 'connecting':
      if (action.type === 'CONNECTED')
        return { status: 'connected', socket: action.socket };
      if (action.type === 'ERROR')
        return state.attempt < 3
          ? { status: 'reconnecting', attempt: state.attempt, lastError: action.error }
          : { status: 'failed', error: action.error };
      return state;

    case 'connected':
      if (action.type === 'DISCONNECTED')
        return { status: 'disconnected' };
      if (action.type === 'ERROR')
        return { status: 'reconnecting', attempt: 1, lastError: action.error };
      return state;

    case 'reconnecting':
      if (action.type === 'RETRY')
        return { status: 'connecting', attempt: state.attempt + 1 };
      return state;

    case 'failed':
      if (action.type === 'CONNECT')
        return { status: 'connecting', attempt: 1 };
      return state;
  }
}

EFFECT DRIVEN BY STATE MACHINE:
function useConnection(url) {
  const [state, dispatch] = useReducer(connectionReducer,
    { status: 'disconnected' });

  // Effect 1: Handle connection based on state
  useEffect(() => {
    if (state.status !== 'connecting') return;

    const ws = new WebSocket(url);
    ws.onopen = () => dispatch({ type: 'CONNECTED', socket: ws });
    ws.onerror = (e) => dispatch({ type: 'ERROR', error: e });
    ws.onclose = () => dispatch({ type: 'DISCONNECTED' });

    return () => ws.close();
  }, [state.status, url]);
  // ← Effect chỉ chạy khi status = 'connecting'

  // Effect 2: Auto-retry with backoff
  useEffect(() => {
    if (state.status !== 'reconnecting') return;

    const delay = Math.min(1000 * 2 ** state.attempt, 30000);
    const timer = setTimeout(
      () => dispatch({ type: 'RETRY' }),
      delay
    );

    return () => clearTimeout(timer);
  }, [state.status, state.attempt]);
  // ← Exponential backoff: 2s, 4s, 8s, 16s, 30s max

  return { state, connect: () => dispatch({ type: 'CONNECT' }) };
}

INTERVIEW SIGNAL:
"State machine + useReducer = IMPOSSIBLE STATES IMPOSSIBLE.
 Effects respond to state TRANSITIONS, not raw booleans.
 Reducer handles WHAT happens, Effect handles HOW (side effects)."
```

### 50. WebSocket Reconnection — Production Pattern

```
KHI INTERVIEWER HỎI: "Design production-ready WebSocket hook?"

✅ FULL IMPLEMENTATION:

function useWebSocketConnection(url, options = {}) {
  const {
    protocols,
    reconnect = true,
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    heartbeatInterval = 30000,
    onMessage,
    onStatusChange,
  } = options;

  const [status, setStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const heartbeatRef = useRef(null);

  // Stabilize callbacks
  const handleMessage = useEffectEvent((event) => {
    onMessage?.(JSON.parse(event.data));
  });

  const handleStatusChange = useEffectEvent((newStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  });

  // Main connection Effect
  useEffect(() => {
    let ws;
    let reconnectTimer;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      handleStatusChange('connecting');

      ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        retryCountRef.current = 0;
        handleStatusChange('connected');
        startHeartbeat();
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        if (!mounted) return;
        stopHeartbeat();
        handleStatusChange('disconnected');

        // Auto-reconnect (not for intentional close)
        if (reconnect && event.code !== 1000) {
          const retry = retryCountRef.current;
          if (retry < maxRetries) {
            const delay = Math.min(
              baseDelay * Math.pow(2, retry) + Math.random() * 1000,
              maxDelay
            );
            handleStatusChange('reconnecting');
            reconnectTimer = setTimeout(() => {
              retryCountRef.current++;
              connect();
            }, delay);
          } else {
            handleStatusChange('failed');
          }
        }
      };
    }

    function startHeartbeat() {
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, heartbeatInterval);
    }

    function stopHeartbeat() {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      stopHeartbeat();
      if (ws) {
        ws.onclose = null; // Prevent reconnect on cleanup
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [url, protocols, reconnect, maxRetries, baseDelay,
      maxDelay, heartbeatInterval]);
  // ← Tất cả primitive/stable deps

  // Stable send function
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        typeof data === 'string' ? data : JSON.stringify(data)
      );
    }
  }, []);

  return { status, send };
}

PRODUCTION FEATURES:
✅ Exponential backoff with jitter (prevent thundering herd)
✅ Max retries limit
✅ Heartbeat/ping to detect dead connections
✅ Clean intentional close (code 1000) vs error close
✅ Prevent reconnect on unmount
✅ Stable send function (useCallback)
✅ Callbacks via useEffectEvent (no extra deps)
```

### 51. React Query vs Raw Effects — When To Use What

```
KHI INTERVIEWER HỎI: "Tại sao dùng React Query thay vì useEffect?"

✅ SO SÁNH TOÀN DIỆN:

RAW useEffect (DIY approach):
function useUserData(userId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { if (!ignore) setData(data); })
      .catch(err => { if (!ignore) setError(err); })
      .finally(() => { if (!ignore) setIsLoading(false); });

    return () => { ignore = true; };
  }, [userId]);

  return { data, error, isLoading };
}
// 20 lines. Missing: cache, retry, dedup, refetch, optimistic.

REACT QUERY (TanStack Query):
function useUserData(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 3,
  });
}
// 7 lines. Includes: cache, retry, dedup, refetch, suspense.

FEATURE COMPARISON:
┌──────────────────────────┬──────────────┬──────────────┐
│ Feature                  │ Raw Effect   │ React Query  │
├──────────────────────────┼──────────────┼──────────────┤
│ Basic fetch              │ ✅ Manual     │ ✅ Built-in   │
│ Loading/error states     │ ✅ Manual     │ ✅ Built-in   │
│ Race condition handling  │ ⚠️ Manual    │ ✅ Automatic  │
│ Request deduplication    │ ❌ None       │ ✅ Automatic  │
│ Caching                  │ ❌ None       │ ✅ Built-in   │
│ Background refetching    │ ❌ None       │ ✅ Built-in   │
│ Stale-while-revalidate   │ ❌ None       │ ✅ Built-in   │
│ Retry with backoff       │ ⚠️ Manual    │ ✅ Built-in   │
│ Optimistic updates       │ ⚠️ Complex   │ ✅ Built-in   │
│ Pagination               │ ⚠️ Complex   │ ✅ Built-in   │
│ Infinite scroll          │ ⚠️ Complex   │ ✅ Built-in   │
│ Prefetching              │ ❌ None       │ ✅ Built-in   │
│ Window focus refetch     │ ❌ None       │ ✅ Automatic  │
│ Network reconnect refetch│ ❌ None       │ ✅ Automatic  │
│ SSR support              │ ⚠️ Complex   │ ✅ Built-in   │
│ DevTools                 │ ❌ None       │ ✅ Dedicated   │
│ Bundle size              │ ✅ 0 KB       │ ⚠️ ~12 KB    │
│ Learning curve           │ ✅ Low        │ ⚠️ Medium    │
│ Control/customization    │ ✅ Full       │ ⚠️ API-bound │
└──────────────────────────┴──────────────┴──────────────┘

KHI NÀO DÙNG RAW EFFECT:
1. Non-fetch side effects (DOM, subscriptions, timers)
2. One-off operations (analytics, logging)
3. Third-party library initialization
4. WebSocket connections (not request-response)
5. Tiny apps where bundle size matters
6. Learning/understanding React fundamentals

KHI NÀO DÙNG REACT QUERY:
1. ANY server data fetching
2. CRUD operations
3. Apps with multiple data sources
4. Apps needing caching strategy
5. Production apps with real users
6. Team projects (consistent patterns)

INTERVIEW SIGNAL:
"Tôi biết KHI NÀO raw Effect đủ tốt và KHI NÀO cần library.
 Raw Effect cho side effects. React Query cho server state.
 Đây là PRAGMATISM, không phải laziness."
```

### 52. Performance Budget & Effect Monitoring

```
KHI INTERVIEWER HỎI: "Monitor Effect performance trong production?"

✅ PRODUCTION MONITORING PATTERNS:

PATTERN 1: Effect Performance Observer
function useEffectWithMetrics(name, effect, deps) {
  useEffect(() => {
    const startTime = performance.now();

    const cleanup = effect();

    const duration = performance.now() - startTime;

    // Report to monitoring service
    if (duration > 16) { // Longer than 1 frame (60fps)
      reportMetric({
        type: 'slow_effect',
        name,
        duration,
        deps: deps.map(d => typeof d),
        timestamp: Date.now(),
      });
    }

    // Track cleanup performance too
    return () => {
      const cleanupStart = performance.now();
      cleanup?.();
      const cleanupDuration = performance.now() - cleanupStart;

      if (cleanupDuration > 10) {
        reportMetric({
          type: 'slow_cleanup',
          name,
          duration: cleanupDuration,
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Usage:
useEffectWithMetrics('ChatRoom.connect', () => {
  const conn = connect(roomId);
  return () => conn.disconnect();
}, [roomId]);

PATTERN 2: Effect Count Monitor (Development)
const effectCountRef = useRef(0);
const renderCountRef = useRef(0);

useEffect(() => {
  effectCountRef.current++;
  const ratio = effectCountRef.current / renderCountRef.current;

  if (ratio > 0.8) {
    console.warn(
      `[PERF] ${componentName}: Effect/Render ratio = ${ratio.toFixed(2)}`,
      'Effect runs too often relative to renders.'
    );
  }
});

// In render:
renderCountRef.current++;

PERFORMANCE BUDGETS:
┌────────────────────────┬──────────┬──────────┬──────────┐
│ Metric                 │ Budget   │ Warning  │ Critical │
├────────────────────────┼──────────┼──────────┼──────────┤
│ Effect setup time      │ < 5ms    │ 5-16ms   │ > 16ms   │
│ Effect cleanup time    │ < 3ms    │ 3-10ms   │ > 10ms   │
│ Effects per render     │ 1-2      │ 3-4      │ 5+       │
│ Effect fires per sec   │ < 5      │ 5-10     │ 10+      │
│ Deps array length      │ 1-3      │ 4-5      │ 6+       │
│ Effect/render ratio    │ < 0.3    │ 0.3-0.8  │ > 0.8    │
│ Cleanup success rate   │ 100%     │ 95-99%   │ < 95%    │
└────────────────────────┴──────────┴──────────┴──────────┘

INTERVIEW SIGNAL:
"Tôi monitor Effects như monitor API: budget, thresholds, alerts.
 Effect > 16ms = dropped frame. Effect ratio > 0.8 = dependency bug.
 Production needs OBSERVABILITY, not just correctness."
```

### 53. Dependency Injection Pattern Trong Hooks

```
KHI INTERVIEWER HỎI: "Dependency Injection với custom hooks?"

✅ DI PATTERNS:

PATTERN 1: Service injection qua props
// Hook nhận service qua parameter:
function useNotifications(notificationService) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(
      (notification) => setNotifications(prev => [...prev, notification])
    );
    return () => unsubscribe();
  }, [notificationService]);
  // ← notificationService là dependency
  // ← PHẢI stable (singleton hoặc memoized)

  return notifications;
}

// Production: real service
const realService = new NotificationService(apiClient);
const notifications = useNotifications(realService);

// Test: mock service
const mockService = { subscribe: jest.fn(() => jest.fn()) };
const notifications = useNotifications(mockService);

PATTERN 2: Context-based DI
// Provider:
const ServiceContext = createContext(null);

function ServiceProvider({ children, services }) {
  // Memoize to prevent re-renders
  const value = useMemo(() => services, [services]);
  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

// Hook sử dụng injected service:
function useUserProfile(userId) {
  const { userService } = useContext(ServiceContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let ignore = false;
    userService.getProfile(userId).then(data => {
      if (!ignore) setProfile(data);
    });
    return () => { ignore = true; };
  }, [userId, userService]);
  // ← userService từ context → stable nếu memoized

  return profile;
}

// App: inject real services
<ServiceProvider services={{ userService: new UserAPI() }}>
  <App />
</ServiceProvider>

// Test: inject mocks
<ServiceProvider services={{ userService: mockUserAPI }}>
  <UserProfile userId="1" />
</ServiceProvider>

PATTERN 3: Factory function DI
// Factory tạo hook với injected dependencies:
function createUseAuth(authService, analyticsService) {
  return function useAuth() {
    const [user, setUser] = useState(null);

    useEffect(() => {
      const unsubscribe = authService.onAuthChange((user) => {
        setUser(user);
        analyticsService.identify(user?.id);
      });
      return () => unsubscribe();
    }, []); // Services captured in closure — stable

    return {
      user,
      login: authService.login,
      logout: authService.logout,
    };
  };
}

// Production:
const useAuth = createUseAuth(firebaseAuth, mixpanel);
// Test:
const useAuth = createUseAuth(mockAuth, mockAnalytics);

DEPENDENCY INSIGHT:
"DI giúp:
 1. Testing: inject mocks → test Effect behavior
 2. Env flexibility: different services per environment
 3. Decoupling: hook không biết implementation details
 4. Dependency stability: services thường singleton = stable dep"
```

### 54. Effect Ordering & Execution Guarantees

```
KHI INTERVIEWER HỎI: "Effects chạy theo thứ tự nào?"

✅ ORDERING RULES:

RULE 1: EFFECTS CHẠY THEO THỨ TỰ KHAI BÁO
"Trong cùng 1 component, Effects chạy top → bottom:

 function Component() {
   useEffect(() => console.log('Effect A'), []);  // Chạy 1st
   useEffect(() => console.log('Effect B'), []);  // Chạy 2nd
   useEffect(() => console.log('Effect C'), []);  // Chạy 3rd
 }
 // Output: Effect A → Effect B → Effect C"

RULE 2: CLEANUP CHẠY TRƯỚC SETUP (cùng Effect)
"Khi deps thay đổi:
 1. Cleanup CŨ chạy trước (destroy previous)
 2. Setup MỚI chạy sau (create new)

 // Render 1: roomId = 'general'
 Effect A setup: connect('general')

 // Render 2: roomId = 'random'
 Effect A cleanup: disconnect('general')  ← TRƯỚC
 Effect A setup: connect('random')         ← SAU"

RULE 3: PARENT EFFECTS CHẠY SAU CHILDREN
"React commits bottom-up:

 function Parent() {
   useEffect(() => console.log('Parent'));  // Chạy SAU
   return <Child />;
 }

 function Child() {
   useEffect(() => console.log('Child'));   // Chạy TRƯỚC
 }
 // Output: Child → Parent
 // Reason: Children commit first in Fiber tree"

RULE 4: useLayoutEffect CHẠY TRƯỚC useEffect
"Timeline:
 render → commit →
   useLayoutEffect (sync, trước paint) →
   paint (browser renders pixels) →
   useEffect (async, sau paint)

 function Component() {
   useLayoutEffect(() => console.log('Layout')); // Chạy 1st
   useEffect(() => console.log('Passive'));       // Chạy 2nd
 }
 // Output: Layout → [paint] → Passive"

RULE 5: CLEANUP ORDER = REVERSE SETUP ORDER
"Unmount cleanup chạy reverse:

 function Component() {
   useEffect(() => {
     console.log('Setup A');
     return () => console.log('Cleanup A');
   }, []);
   useEffect(() => {
     console.log('Setup B');
     return () => console.log('Cleanup B');
   }, []);
 }
 // Mount: Setup A → Setup B
 // Unmount: Cleanup A → Cleanup B
 // (Actually same order in React, not reverse like stack)
 // ⚠️ NOTE: React cleans up ALL effects, then runs ALL setups"

PRACTICAL IMPLICATION:
"KHÔNG depend on Effect ordering cho logic!

 ❌ SAI:
 useEffect(() => { globalData = fetchedData; }, [fetchedData]);
 useEffect(() => { process(globalData); }, [fetchedData]);
 // Fragile: depends on A running before B

 ✅ ĐÚNG:
 useEffect(() => {
   const data = fetchedData;
   process(data);  // Same Effect, guaranteed order
 }, [fetchedData]);

 Hoặc dùng state để coordinate:
 useEffect(() => { setProcessedData(process(fetchedData)); },
   [fetchedData]);"
```

### 55. AbortController Deep Dive

```
KHI INTERVIEWER HỎI: "Explain AbortController trong React Effects?"

✅ TOÀN DIỆN VỀ AbortController:

BASIC USAGE:
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(r => r.json())
    .then(data => setData(data))
    .catch(error => {
      if (error.name === 'AbortError') {
        // Expected: Effect cleanup cancelled this request
        return;
      }
      setError(error); // Real error
    });

  return () => controller.abort();
}, [url]);

TẠI SAO AbortController > ignore FLAG:
"ignore flag:
 ✅ Prevents setState on unmounted component
 ❌ Network request STILL completes (waste bandwidth)
 ❌ Server still processes request (waste server resources)

 AbortController:
 ✅ Prevents setState
 ✅ CANCELS network request (saves bandwidth)
 ✅ Server receives cancellation signal
 ✅ Native browser API, no custom logic"

ADVANCED: Multiple requests
useEffect(() => {
  const controller = new AbortController();
  const { signal } = controller;

  // Parallel fetches — ALL cancelled by 1 abort:
  Promise.all([
    fetch(`/api/user/${id}`, { signal }),
    fetch(`/api/user/${id}/posts`, { signal }),
    fetch(`/api/user/${id}/followers`, { signal }),
  ])
    .then(([userRes, postsRes, followersRes]) =>
      Promise.all([userRes.json(), postsRes.json(), followersRes.json()])
    )
    .then(([user, posts, followers]) => {
      setData({ user, posts, followers });
    })
    .catch(error => {
      if (error.name !== 'AbortError') setError(error);
    });

  return () => controller.abort();
}, [id]);
// ← 1 abort cancels ALL 3 requests. Clean!

ADVANCED: Abort with reason
useEffect(() => {
  const controller = new AbortController();

  fetchData(url, { signal: controller.signal })
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('Cancelled:', controller.signal.reason);
        // 'Dependency changed' or 'Component unmounted'
      }
    });

  return () => controller.abort('Dependency changed');
}, [url]);

ABORT + TIMEOUT COMBO:
useEffect(() => {
  const controller = new AbortController();

  // Auto-timeout after 10s:
  const timeoutId = setTimeout(
    () => controller.abort('Timeout'),
    10000
  );

  fetch(url, { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(error => {
      if (error.name === 'AbortError') {
        if (controller.signal.reason === 'Timeout') {
          setError(new Error('Request timed out'));
        }
        // else: normal cleanup abort, ignore
      } else {
        setError(error);
      }
    })
    .finally(() => clearTimeout(timeoutId));

  return () => {
    clearTimeout(timeoutId);
    controller.abort('Cleanup');
  };
}, [url]);

BROWSER SUPPORT & POLYFILL:
"AbortController: supported all modern browsers.
 IE11: cần polyfill (abortcontroller-polyfill).
 Node.js: built-in từ v15+."
```

### 56. useLayoutEffect vs useEffect — Timing Deep Dive

```
KHI INTERVIEWER HỎI: "Khi nào dùng useLayoutEffect?"

✅ TIMING COMPARISON:

TIMELINE CHI TIẾT:
┌──────────────────────────────────────────────────────────────┐
│ 1. React renders (calls component function)                  │
│ 2. React commits (updates real DOM)                          │
│ 3. ┌── useLayoutEffect runs (SYNCHRONOUS) ──┐               │
│    │   - DOM updated but NOT painted          │               │
│    │   - Can read layout, modify DOM          │               │
│    │   - BLOCKS paint until complete          │               │
│    └──────────────────────────────────────────┘               │
│ 4. Browser paints (user sees pixels)                         │
│ 5. ┌── useEffect runs (ASYNCHRONOUS) ────────┐              │
│    │   - After paint, user sees initial render│              │
│    │   - Non-blocking, doesn't delay paint    │              │
│    │   - Good for side effects                │              │
│    └──────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────┘

KHI NÀO DÙNG useLayoutEffect:

1. DOM Measurement → Position update:
function Tooltip({ targetRef, children }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    setPosition({
      top: targetRect.bottom + 8,
      left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
    });
  }, [targetRef]);
  // useLayoutEffect vì: đo DOM → set position TRƯỚC paint
  // useEffect sẽ flash: hiện ở vị trí sai → nhảy đến đúng

  return (
    <div ref={tooltipRef} style={{ position: 'fixed', ...position }}>
      {children}
    </div>
  );
}

2. Scroll position restoration:
function ChatMessages({ messages }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // Scroll to bottom BEFORE user sees
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  // useEffect: user sees old scroll → jumps to bottom (flash)
  // useLayoutEffect: scrolled BEFORE paint → no flash

  return <div ref={containerRef}>...</div>;
}

3. Prevent flash of unstyled content:
function DarkModeWrapper({ isDark, children }) {
  useLayoutEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);
  // useEffect: light → paint → dark (flash!)
  // useLayoutEffect: light → dark → paint (no flash)

  return children;
}

KHI NÀO KHÔNG DÙNG useLayoutEffect:
❌ Data fetching (long async operation blocks paint!)
❌ Subscriptions (no DOM measurement needed)
❌ Analytics/logging (no visual impact)
❌ Timer setup (no DOM dependency)

SSR WARNING:
"useLayoutEffect KHÔNG chạy trên server.
 React warning: 'useLayoutEffect does nothing on the server.'

 Fix: useIsomorphicLayoutEffect pattern:
 const useIsomorphicLayoutEffect =
   typeof window !== 'undefined' ? useLayoutEffect : useEffect;"
```

### 57. Effects trong SSR / SSG / ISR

```
KHI INTERVIEWER HỎI: "Effects hoạt động thế nào với SSR?"

✅ RENDERING MODES & EFFECTS:

SSR (Server-Side Rendering):
"Server render HTML → Client hydrate → Effects chạy.

 Timeline:
 1. Server: render component → HTML string
    → useEffect KHÔNG CHẠY trên server
    → HTML chứa initial state (thường null/empty)

 2. Client: receive HTML → display immediately
    → User thấy content TRƯỚC khi JS load

 3. Client: hydrate (React attach event listeners)
    → useEffect CHẠY lần đầu
    → Data fetch bắt đầu
    → Loading state hiện lên (but layout already visible)

 Vấn đề: HYDRATION MISMATCH
 Server render: <div></div> (no data)
 Client render: <div>Loading...</div> (after Effect sets loading)
 → React warning: Text content mismatch

 Fix:
 function useIsClient() {
   const [isClient, setIsClient] = useState(false);
   useEffect(() => setIsClient(true), []);
   return isClient;
 }

 function Component() {
   const isClient = useIsClient();
   if (!isClient) return <Skeleton />; // Match server
   return <ClientOnlyContent />;
 }"

SSG (Static Site Generation):
"Pages generated at BUILD TIME. No server per request.

 Effects chạy như SSR:
 - Build: render HTML → no Effects
 - Client: hydrate → Effects chạy

 Best for: content that doesn't change often
 Effects role: real-time updates AFTER static page loads"

ISR (Incremental Static Regeneration):
"SSG + background regeneration.

 Effect KHÔNG ảnh hưởng ISR process.
 ISR re-renders PAGE on server → no Effects.
 Client Effects chạy bình thường sau hydrate."

STREAMING SSR (React 18+):
"Server streams HTML progressively.
 Suspense boundaries stream independently.

 Effects trong streamed components:
 - Chạy SAU component hydrate
 - Không block streaming
 - Earlier components' Effects chạy trước

 <Suspense fallback={<Spinner />}>
   <SlowComponent /> {/* Streams later, Effect chạy later */}
 </Suspense>"

PATTERN: Server-safe Effect
function useServerSafeEffect(effect, deps) {
  // Only run on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    return effect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

KEY RULES:
1. useEffect = client-only. NEVER runs on server.
2. useLayoutEffect = client-only. Warning on server.
3. SEO-critical data → Server Component/getServerSideProps
4. Interactive features → Client Component + useEffect
5. Hydration mismatch → useIsClient pattern
```

### 58. Monorepo Shared Hook Patterns

```
KHI INTERVIEWER HỎI: "Shared hooks trong monorepo?"

✅ ARCHITECTURE:

PACKAGE STRUCTURE:
packages/
├── hooks/                    # Shared hooks package
│   ├── src/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useWindowSize.ts
│   │   └── index.ts          # Barrel export
│   ├── tests/
│   │   ├── useDebounce.test.ts
│   │   └── ...
│   └── package.json          # { "name": "@org/hooks" }
├── app-a/                    # Consumer app
│   └── uses @org/hooks
└── app-b/                    # Another consumer
    └── uses @org/hooks

SHARED HOOK DESIGN RULES:

1. ZERO DEPENDENCIES ON CONSUMER:
"Hook KHÔNG import từ consumer app:

 ❌ SAI:
 import { apiClient } from '../../../app-a/src/api';

 ✅ ĐÚNG: Inject via parameter or context
 function useFetch(url, fetchFn = globalThis.fetch) {
   useEffect(() => {
     fetchFn(url).then(...)
   }, [url, fetchFn]);
 }"

2. PEER DEPENDENCIES CHO REACT:
"package.json:
 {
   'peerDependencies': {
     'react': '>=18.0.0'
   },
   'devDependencies': {
     'react': '^18.2.0'  // For testing
   }
 }
 // Peer dep = consumer provides React
 // Avoids multiple React instances (hook errors)"

3. GENERIC TYPE PARAMETERS:
"function useAsync<T>(
   asyncFn: () => Promise<T>,
   deps: DependencyList
 ): { data: T | null; error: Error | null; loading: boolean }

 // Consumer:
 const { data } = useAsync(() => fetchUser(id), [id]);
 // data is typed as User | null ← inferred from fetchUser"

4. DOCUMENTATION VỚI EXAMPLES:
"Mỗi shared hook PHẢI có:
 - JSDoc with parameter descriptions
 - Usage example trong comment
 - Dependency requirements noted
 - Cleanup behavior documented

 /**
  * Debounce a value with the given delay.
  *
  * @param value - The value to debounce
  * @param delay - Delay in milliseconds
  * @returns Debounced value
  *
  * @example
  * const debouncedSearch = useDebounce(searchTerm, 300);
  * useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
  *
  * @cleanup Clears pending timeout on unmount
  */
 function useDebounce<T>(value: T, delay: number): T { ... }"

VERSIONING STRATEGY:
"Shared hooks = LIBRARY. Version carefully:
 - Patch: bugfix, internal refactor
 - Minor: new hooks, new optional parameters
 - Major: changed return type, removed hooks, changed deps behavior

 Breaking change = consumer Effects may behave differently
 → MUST be major version bump"
```

### 59. React DevTools — Effect Debugging Walkthrough

```
KHI INTERVIEWER HỎI: "Demo debugging Effect với DevTools?"

✅ STEP-BY-STEP DEVTOOLS DEBUGGING:

TOOL 1: Components Tab → Hooks Panel
"1. Open React DevTools → Components tab
 2. Select component with suspected Effect issue
 3. Look at hooks list:

    ▶ State: 'loading'
    ▶ State: null
    ▶ Effect ← Click to expand
      deps: ['general', {serverUrl: 'https://...'}]
    ▶ Ref: {current: WebSocket}

 KEY OBSERVATIONS:
 - deps shows CURRENT values
 - Object deps → check if reference stable
 - Compare with previous render's deps"

TOOL 2: Profiler Tab → Effect Tracking
"1. Start recording in Profiler
 2. Perform action that triggers Effect
 3. Stop recording
 4. Click on commit where Effect fired
 5. Look at 'What caused this render?':

    Why did Component render?
    - Props changed: {options}  ← Object prop changed!

 This tells you WHY Effect fired:
 - Component re-rendered
 - New deps values created
 - Effect decided to re-run"

TOOL 3: Highlight Updates
"Settings → Highlight updates when components render

 If component FLASHES constantly:
 - Something changing every render
 - Likely: unstable object/function creating new reference
 - Effect fires on every render = INFINITE LOOP candidate"

TOOL 4: Component Renders Counter
"In Profiler, check render count:

 Component rendered 47 times in 3 seconds
 → Obviously too many
 → Each render potentially fires Effects
 → Core issue: parent re-rendering too often"

TOOL 5: Timeline Tab (Chrome DevTools)
"Performance tab → Record:
 1. See WHEN Effects run relative to paint
 2. Long task after paint? → Heavy Effect
 3. Effect during paint? → Should be useLayoutEffect

 Look for:
 - Yellow blocks = JS execution (Effects)
 - Green blocks = paint
 - Effects should be AFTER green blocks"

DEBUGGER BREAKPOINTS:
"Trong source code, đặt breakpoint TRONG Effect:

 useEffect(() => {
   debugger;  // ← Breakpoint here
   // Inspect closure: what values does Effect see?
   console.log('roomId:', roomId);  // Current or stale?
   console.log('options:', options); // Same reference?
 }, [roomId, options]);

 Call stack shows:
 - commitHookEffectListMount (React internal)
 - Your Effect function
 - Which render triggered this"
```

### 60. Rapid-Fire Interview Q&A — 30 Questions

```
30 CÂU HỎI NHANH — TRẢ LỜI TRONG 30 GIÂY:

Q1: "useEffect chạy khi nào?"
A: "Sau commit phase, sau browser paint. Asynchronous."

Q2: "Tại sao cần dependency array?"
A: "Cho React biết KHI NÀO re-sync. Không có = mọi render."

Q3: "Object.is(NaN, NaN) = ?"
A: "true. Khác === (NaN !== NaN). React dùng Object.is."

Q4: "Object.is({}, {}) = ?"
A: "false. Khác object reference. Đây là TẠI SAO object deps nguy hiểm."

Q5: "useEffect vs useLayoutEffect?"
A: "useEffect: sau paint (async). useLayoutEffect: trước paint (sync)."

Q6: "Cleanup chạy khi nào?"
A: "Trước mỗi re-run VÀ khi unmount. Không chỉ unmount."

Q7: "StrictMode làm gì với Effects?"
A: "Double mount: mount → unmount → mount. Test cleanup works."

Q8: "[] vs không có dependency array?"
A: "[] = mount only. Không có = EVERY render. Rất khác nhau."

Q9: "Tại sao setState stable?"
A: "React guarantee: setter identity không đổi across renders."

Q10: "useRef có cần trong deps không?"
A: "Không. useRef trả về CÙNG object. Nhưng ref.current thay đổi."

Q11: "Fetch data trong useEffect có race condition?"
A: "Có. User navigate nhanh → stale response overwrite. Cần AbortController."

Q12: "eslint-disable exhaustive-deps OK khi nào?"
A: "Gần như KHÔNG BAO GIỜ. Exception: generic hook nhận deps parameter."

Q13: "Tại sao không deep compare deps?"
A: "Performance (recursive) + ambiguity (khi nào 2 objects 'equal'?)."

Q14: "useCallback có giúp Effect không?"
A: "Có: stabilize function reference → Effect không re-run. Nhưng là last resort."

Q15: "useMemo vs useCallback?"
A: "useMemo: memoize VALUE. useCallback: memoize FUNCTION.
    useCallback(fn, deps) = useMemo(() => fn, deps)."

Q16: "Effect cleanup CÓ THỂ async không?"
A: "Return function PHẢI sync. Nhưng BÊN TRONG có thể trigger async (với flag)."

Q17: "useEffect trên server?"
A: "KHÔNG chạy. Server chỉ render. Effect = client-only."

Q18: "Infinite loop phổ biến nhất?"
A: "Object/array literal trong deps. Mỗi render = new reference = re-run."

Q19: "useReducer giúp gì cho deps?"
A: "dispatch stable + state transitions co-located → ít deps hơn."

Q20: "Context value change → Effect chạy lại?"
A: "Nếu context value trong deps và reference thay đổi → CÓ."

Q21: "Khi nào KHÔNG dùng Effect?"
A: "Derived state, event handlers, data transformation trong render."

Q22: "Effect cleanup order khi unmount?"
A: "Tất cả cleanups chạy, theo thứ tự khai báo."

Q23: "Tại sao React chọn Object.is thay vì ===?"
A: "Handle edge cases: NaN === NaN (false), +0 === -0 (true).
    Object.is fix cả hai."

Q24: "useEffect với async function?"
A: "KHÔNG truyền async trực tiếp. Tạo async IIFE bên trong."

Q25: "Batching ảnh hưởng Effects?"
A: "React 18 batch mọi setState → ít re-renders → ít Effect checks."

Q26: "useSyncExternalStore vs useEffect cho external state?"
A: "useSyncExternalStore: sync trong render (no tearing).
    useEffect: async sau paint (tearing possible)."

Q27: "Effect trong Concurrent Mode?"
A: "Effect chỉ chạy cho COMMITTED renders.
    Interrupted renders → KHÔNG fire Effect."

Q28: "Server Components có useEffect?"
A: "KHÔNG. Server Components chạy trên server.
    Chỉ Client Components ('use client') có Effects."

Q29: "React Compiler thay đổi gì về deps?"
A: "Auto-memoize → ít unstable references → ít false re-runs.
    Nhưng deps vẫn cần khai báo đúng."

Q30: "Golden rule của Effect dependencies?"
A: "Dependencies DESCRIBE code, don't CONTROL it.
    Change code to change dependencies."
```

### 61. Effect Patterns Cho Specific APIs

```
CÁC BROWSER API PHỔ BIẾN VÀ EFFECT PATTERN:

1. ResizeObserver:
function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // ref.current accessed via ref — stable
  // ← ResizeObserver = perfect Effect use case

  return size;
}

2. MutationObserver:
function useDOMChanges(ref, callback, options) {
  const handleChange = useEffectEvent(callback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new MutationObserver(handleChange);
    observer.observe(el, options ?? {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, []); // handleChange stable via useEffectEvent
}

3. Geolocation:
function useGeolocation(options) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => setError(err),
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options?.enableHighAccuracy, options?.timeout]);
  // ← Destructure to primitives from options object

  return { position, error };
}

4. matchMedia (responsive):
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]); // query = string = primitive = safe dep

  return matches;
}

5. Clipboard API:
function useClipboard() {
  const [copiedText, setCopiedText] = useState(null);
  const [error, setError] = useState(null);

  // Event handler — NOT Effect (user-initiated):
  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      setError(err);
    }
  }, []);

  // Note: NO useEffect needed! Copy is user-initiated.
  return { copy, copiedText, error };
}

6. Page Visibility API:
function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(
    !document.hidden
  );

  useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []); // Static listener — no deps

  return isVisible;
}

7. Network Status:
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Static listeners

  return isOnline;
}
```

### 62. Comprehensive Glossary — Effect Dependencies

```
┌──────────────────────────────────────────────────────────────────────────┐
│              GLOSSARY — THUẬT NGỮ EFFECT DEPENDENCIES                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 📖 CORE TERMS:                                                           │
│                                                                          │
│ Reactive Value:                                                          │
│   Giá trị có thể thay đổi giữa các renders.                             │
│   Bao gồm: props, state, context values,                                │
│   và mọi thứ computed từ chúng trong component body.                     │
│                                                                          │
│ Dependency Array:                                                        │
│   Array thứ 2 của useEffect. Chứa reactive values mà Effect đọc.       │
│   React so sánh với render trước để quyết định re-run.                  │
│                                                                          │
│ Effect (Side Effect):                                                    │
│   Code chạy SAU render để sync với external system.                     │
│   Ví dụ: fetch data, subscribe, manipulate DOM.                         │
│                                                                          │
│ Cleanup Function:                                                        │
│   Function trả về từ useEffect. Chạy TRƯỚC re-run và khi unmount.      │
│   Dùng để undo setup: unsubscribe, clear timer, close connection.       │
│                                                                          │
│ Synchronization:                                                         │
│   Quá trình giữ component STATE đồng bộ với EXTERNAL SYSTEM.            │
│   Effect = synchronization mechanism. Dependencies = sync trigger.       │
│                                                                          │
│ Stale Closure:                                                           │
│   Function captured giá trị cũ từ render trước.                         │
│   Xảy ra khi dependency bị thiếu trong array.                           │
│                                                                          │
│ Race Condition:                                                          │
│   Multiple async operations compete → wrong result wins.                │
│   Phổ biến khi dependency thay đổi nhanh hơn response.                  │
│                                                                          │
│ 📖 COMPARISON TERMS:                                                     │
│                                                                          │
│ Object.is:                                                               │
│   Algorithm React dùng so sánh deps. Shallow, reference equality.       │
│   Object.is(a, b) = same reference? Y → skip. N → re-run.              │
│                                                                          │
│ Reference Equality:                                                      │
│   2 values = same object trong memory. Primitives: by value.            │
│   Objects/arrays/functions: by reference (memory address).              │
│                                                                          │
│ Reference Stability:                                                     │
│   Khi value giữ nguyên reference across renders.                        │
│   setState, useRef, dispatch = stable. Object literal = unstable.       │
│                                                                          │
│ 📖 HOOK TERMS:                                                           │
│                                                                          │
│ useEffect:                                                               │
│   Passive effect. Chạy SAU paint. Non-blocking. Async scheduling.       │
│                                                                          │
│ useLayoutEffect:                                                         │
│   Layout effect. Chạy TRƯỚC paint. Blocking. Sync execution.            │
│   Dùng cho DOM measurement → position update.                           │
│                                                                          │
│ useEffectEvent (Experimental):                                           │
│   Extract non-reactive logic từ Effect. Read giá trị mới nhất           │
│   mà không trigger re-sync. Chưa stable API.                            │
│                                                                          │
│ useSyncExternalStore:                                                    │
│   Subscribe to external store SYNCHRONOUSLY trong render.               │
│   Prevents tearing trong Concurrent Mode.                                │
│                                                                          │
│ 📖 REACT INTERNAL TERMS:                                                 │
│                                                                          │
│ Fiber:                                                                   │
│   React's internal data structure cho component.                         │
│   Each component = 1 Fiber node trong tree.                              │
│   Chứa memoizedState (hooks), updateQueue, flags.                       │
│                                                                          │
│ Render Phase:                                                            │
│   Gọi component functions, tạo virtual DOM.                              │
│   PURE — no side effects. Có thể bị interrupted.                        │
│                                                                          │
│ Commit Phase:                                                            │
│   Apply virtual DOM changes → real DOM.                                  │
│   SYNC — không thể interrupted. Effect cleanup chạy ở đây.              │
│                                                                          │
│ Passive Effect Phase:                                                    │
│   Post-paint. useEffect setup chạy ở đây.                               │
│   Scheduled via MessageChannel (not setTimeout).                         │
│                                                                          │
│ Batching:                                                                │
│   Multiple setState → 1 re-render. React 18: automatic everywhere.     │
│   Giảm Effect re-runs vì ít re-renders.                                 │
│                                                                          │
│ Tearing:                                                                 │
│   Inconsistent UI do external store change DURING render.               │
│   Fix: useSyncExternalStore.                                             │
│                                                                          │
│ Concurrent Mode:                                                         │
│   React có thể pause/resume rendering.                                   │
│   Effect chỉ fire cho COMMITTED renders.                                 │
│   Interrupted renders → KHÔNG fire Effect.                               │
│                                                                          │
│ 📖 PATTERN TERMS:                                                        │
│                                                                          │
│ Updater Function:                                                        │
│   setCount(prev => prev + 1). Removes state from dependencies.          │
│                                                                          │
│ Destructuring:                                                           │
│   Extract primitives from object. { a, b } = obj.                       │
│   Primitives = stable deps (value comparison).                           │
│                                                                          │
│ Move Inside Effect:                                                      │
│   Create object/function INSIDE Effect body.                             │
│   Không phải dependency → không trigger re-run.                          │
│                                                                          │
│ Split Effects:                                                           │
│   1 Effect per synchronization concern.                                  │
│   Tránh unrelated logic cùng lifecycle.                                  │
│                                                                          │
│ Idempotent:                                                              │
│   Chạy nhiều lần → same result. Required cho StrictMode.                │
│   Effect + cleanup phải idempotent as pair.                              │
│                                                                          │
│ 📖 ECOSYSTEM TERMS:                                                      │
│                                                                          │
│ React Query (TanStack Query):                                            │
│   Server state management library. Replaces useEffect cho data          │
│   fetching. Adds: cache, retry, dedup, background refetch.              │
│                                                                          │
│ Server Components:                                                       │
│   Components chạy trên server. KHÔNG CÓ Effects.                        │
│   Data fetch via async/await. Zero client bundle.                        │
│                                                                          │
│ Server Actions:                                                          │
│   Functions marked 'use server'. Handle mutations.                      │
│   Replace useEffect cho form submission.                                 │
│                                                                          │
│ React Compiler (Forget):                                                 │
│   Auto-memoize components, objects, functions.                           │
│   Reduces need for useMemo/useCallback.                                  │
│   Dependencies still required (semantic invariant).                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN E: PRACTICE SCENARIOS

> 🏋️ Bài tập thực hành — đọc code, tìm bug, fix.

### Scenario 1: Chat Room With Theme

```tsx
// TÌM BUG VÀ FIX:
function ChatRoom({ roomId }) {
  const theme = useContext(ThemeContext);

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    conn.on("connected", () => {
      showNotification("Connected!", theme);
    });
    return () => conn.disconnect();
  }, [roomId, theme]); // ← BUG: Theme thay đổi → reconnect!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function ChatRoom({ roomId }) {
  const theme = useContext(ThemeContext);

  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", theme); // Đọc theme mới nhất
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    conn.on("connected", () => onConnected());
    return () => conn.disconnect();
  }, [roomId]); // ✅ CHỈ roomId — theme không gây reconnect
}
```

**Giải thích:** `theme` cần giá trị mới nhất nhưng KHÔNG nên trigger reconnect → useEffectEvent.

</details>

### Scenario 2: Search With Filters

```tsx
// TÌM BUG VÀ FIX:
function SearchPage({ query }) {
  const [results, setResults] = useState([]);
  const [sortOrder, setSortOrder] = useState("relevance");

  const searchOptions = {
    query: query,
    sort: sortOrder,
  };

  useEffect(() => {
    let ignore = false;
    fetchResults(searchOptions).then((data) => {
      if (!ignore) setResults(data);
    });
    return () => {
      ignore = true;
    };
  }, [searchOptions]); // ← BUG: searchOptions tạo mới mỗi render!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function SearchPage({ query }) {
  const [results, setResults] = useState([]);
  const [sortOrder, setSortOrder] = useState("relevance");

  useEffect(() => {
    let ignore = false;
    const searchOptions = { query, sort: sortOrder }; // Tạo TRONG Effect
    fetchResults(searchOptions).then((data) => {
      if (!ignore) setResults(data);
    });
    return () => {
      ignore = true;
    };
  }, [query, sortOrder]); // ✅ Primitives
}
```

**Giải thích:** Di chuyển object creation vào trong Effect. Dependencies giờ là primitives (string).

</details>

### Scenario 3: Real-time Counter

```tsx
// TÌM BUG VÀ FIX:
function LiveCounter({ tickInterval }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, tickInterval);
    return () => clearInterval(id);
  }, [tickInterval]); // ← BUG: count bị stale!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function LiveCounter({ tickInterval }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1); // ✅ Updater function — không đọc count
    }, tickInterval);
    return () => clearInterval(id);
  }, [tickInterval]); // ✅ count không cần trong dependency
}
```

**Giải thích:** `setCount(count + 1)` đọc `count` từ closure (stale). `setCount(c => c + 1)` nhận giá trị hiện tại từ React.

</details>

### Scenario 4: Track Page Visit

```tsx
// TÌM BUG VÀ FIX:
function Page({ url, analyticsData }) {
  useEffect(() => {
    trackPageView(url, analyticsData);
  }, [url, analyticsData]); // ← BUG: analyticsData object → track dư thừa!
}
```

<details>
<summary>💡 Đáp án — Cách 1: useEffectEvent</summary>

```tsx
function Page({ url, analyticsData }) {
  const onVisit = useEffectEvent((visitedUrl) => {
    trackPageView(visitedUrl, analyticsData); // Đọc mới nhất
  });

  useEffect(() => {
    onVisit(url);
  }, [url]); // ✅ CHỈ track khi URL thay đổi
}
```

</details>

<details>
<summary>💡 Đáp án — Cách 2: Destructure primitives</summary>

```tsx
function Page({ url, analyticsData }) {
  const { userId, sessionId, source } = analyticsData;

  useEffect(() => {
    trackPageView(url, { userId, sessionId, source });
  }, [url, userId, sessionId, source]); // ✅ Primitives
}
```

</details>

### Scenario 5: Form Auto-Save With Debounce

```tsx
// TÌM BUG VÀ FIX:
function Editor({ documentId }) {
  const [content, setContent] = useState("");

  const saveToServer = () => {
    fetch(`/api/docs/${documentId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  };

  useEffect(() => {
    const timer = setTimeout(saveToServer, 2000);
    return () => clearTimeout(timer);
  }, [content, saveToServer]); // ← BUG: saveToServer tạo mới mỗi render!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function Editor({ documentId }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      // ✅ Logic TRONG Effect — không cần function dependency
      fetch(`/api/docs/${documentId}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, documentId]); // ✅ Primitives
}
```

**Giải thích:** Di chuyển save logic vào trong Effect. Dependencies giờ là `content` (string) và `documentId` (string/number).

</details>

### Scenario 6: WebSocket With Connection Status

```tsx
// TÌM BUG VÀ FIX:
function LiveChat({ roomId, userId }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const ws = new WebSocket(`wss://chat.app/${roomId}`);

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages([...messages, msg]); // ← BUG #1
    };

    ws.onerror = () => setStatus("error");

    // ← BUG #2: Missing cleanup!
  }, [roomId, userId, messages]); // ← BUG #3: messages dependency!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function LiveChat({ roomId, userId }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const ws = new WebSocket(`wss://chat.app/${roomId}`);

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]); // ✅ FIX #1: Updater function
    };
    ws.onerror = () => setStatus("error");

    return () => {
      ws.close(); // ✅ FIX #2: Cleanup WebSocket
    };
  }, [roomId]); // ✅ FIX #3: Chỉ roomId — userId không cần, messages dùng updater
}
```

**3 bugs:**

1. `[...messages, msg]` đọc `messages` từ stale closure → dùng updater `prev => [...prev, msg]`
2. Thiếu cleanup → WebSocket leak khi roomId thay đổi hoặc unmount
3. `messages` trong deps → mỗi message mới → re-create WebSocket → infinite loop!

</details>

### Scenario 7: Infinite Scroll Pagination

```tsx
// TÌM BUG VÀ FIX:
function InfiniteList({ category }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetch(`/api/items?cat=${category}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setItems([...items, ...data.items]); // ← BUG #1
        setHasMore(data.hasMore);
      });
  }, [page]); // ← BUG #2: category thiếu!

  // Khi category đổi, page vẫn = cũ
  // ← BUG #3: Không reset state khi category thay đổi
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function InfiniteList({ category }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset khi category thay đổi
  useEffect(() => {
    setItems([]); // ✅ FIX #3: Reset items
    setPage(1); // ✅ FIX #3: Reset page
    setHasMore(true);
  }, [category]);

  useEffect(() => {
    let ignore = false;

    fetch(`/api/items?cat=${category}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) {
          setItems(
            (prev) =>
              page === 1
                ? data.items // First page: replace
                : [...prev, ...data.items], // ✅ FIX #1: Updater
          );
          setHasMore(data.hasMore);
        }
      });

    return () => {
      ignore = true;
    }; // Race condition protection
  }, [category, page]); // ✅ FIX #2: Cả category VÀ page

  return { items, hasMore, loadMore: () => setPage((p) => p + 1) };
}
```

**3 bugs:**

1. `[...items, ...]` stale closure → updater function
2. `category` thiếu trong deps → category đổi nhưng Effect không re-run
3. Không reset state khi category thay đổi → items cũ lẫn với items mới

</details>

### Scenario 8: Drag and Drop Position

```tsx
// TÌM BUG VÀ FIX:
function DraggableWidget({ id }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      savePosition(id, position); // ← BUG #1: stale position
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);
  // ← BUG #2: position và id thiếu
  // ← BUG #3: Listeners add/remove mỗi khi isDragging toggle
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function DraggableWidget({ id }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(position); // ✅ Ref cho latest position

  // Sync ref with state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const onDragEnd = useEffectEvent(() => {
    savePosition(id, positionRef.current); // ✅ FIX #1: Luôn đọc latest
  });

  useEffect(() => {
    // ✅ FIX #3: Chỉ add listeners khi dragging
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]); // ✅ FIX #2: isDragging là đủ, onDragEnd stable

  return (
    <div
      style={{ left: position.x, top: position.y }}
      onMouseDown={() => setIsDragging(true)}
    />
  );
}
```

**3 bugs:**

1. `position` trong `handleMouseUp` là stale closure → useRef + useEffectEvent
2. `id` và `position` thiếu nhưng thực tế phân tích lại thấy cần approach khác
3. Listeners cho mọi drag state → early return khi `!isDragging` tối ưu hơn

</details>

### Scenario 9: Multi-Tab Sync via localStorage

```tsx
// TÌM BUG VÀ FIX:
function useMultiTabState(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key) {
        setValue(JSON.parse(e.newValue)); // ← BUG #1: e.newValue có thể null
      }
    };

    window.addEventListener("storage", handler);
    // ← BUG #2: Thiếu cleanup!
  }, []); // ← BUG #3: key thiếu trong deps

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]); // ← BUG #4: key thiếu trong deps

  return [value, setValue];
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useMultiTabState(key, initialValue) {
  const [value, setValue] = useState(() => {
    // ✅ BONUS: Initialize from localStorage
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : initialValue;
  });

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key) {
        // ✅ FIX #1: Handle null (key removed)
        if (e.newValue !== null) {
          setValue(JSON.parse(e.newValue));
        } else {
          setValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
    // ✅ FIX #2: Cleanup listener
  }, [key, initialValue]); // ✅ FIX #3: key trong deps

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]); // ✅ FIX #4: key trong deps

  return [value, setValue];
}
```

**4 bugs:**

1. `e.newValue` = `null` khi key bị xóa → cần check
2. Thiếu cleanup → listener leak
3. `key` thay đổi → listener cần re-attach cho key mới
4. `key` thay đổi → save vào key mới

</details>

### Scenario 10: Auth Token Refresh

```tsx
// TÌM BUG VÀ FIX:
function useAuthToken() {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  // Auto-refresh before expiry
  useEffect(() => {
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 min before

    const timer = setTimeout(async () => {
      const newToken = await refreshToken(token); // ← BUG #1: stale token
      setToken(newToken.accessToken);
      setExpiresAt(newToken.expiresAt);
    }, msUntilExpiry - refreshBuffer);

    return () => clearTimeout(timer);
  }, [expiresAt]); // ← BUG #2: token thiếu (nhưng thêm vào sẽ loop!)

  // Initial fetch
  useEffect(() => {
    login().then((result) => {
      setToken(result.accessToken);
      setExpiresAt(result.expiresAt);
    });
  }, []);

  return token;
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useAuthToken() {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const tokenRef = useRef(token); // ✅ Ref cho latest token

  // Sync ref
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Auto-refresh before expiry
  useEffect(() => {
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();
    const refreshBuffer = 5 * 60 * 1000;

    if (msUntilExpiry <= refreshBuffer) {
      // Already within buffer — refresh immediately
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const newToken = await refreshToken(tokenRef.current);
        // ✅ FIX #1: Đọc token từ ref (latest)
        setToken(newToken.accessToken);
        setExpiresAt(newToken.expiresAt);
      } catch {
        // Token refresh failed — logout
        setToken(null);
        setExpiresAt(null);
      }
    }, msUntilExpiry - refreshBuffer);

    return () => clearTimeout(timer);
  }, [expiresAt]); // ✅ FIX #2: CHỈ expiresAt — token qua ref

  // Initial fetch
  useEffect(() => {
    let ignore = false;
    login().then((result) => {
      if (!ignore) {
        setToken(result.accessToken);
        setExpiresAt(result.expiresAt);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  return token;
}
```

**2 bugs + improvement:**

1. `token` stale trong setTimeout closure → useRef cho latest value
2. Thêm `token` vào deps → mỗi refresh set token mới → timer restart → nhưng expiresAt cũng đổi nên deps = `[expiresAt]` là đúng, token qua ref
3. **Bonus:** Error handling + race condition protection cho initial login

</details>

### Scenario 11: Real-time Notifications With Sound

```tsx
// TÌM BUG VÀ FIX:
function NotificationCenter({ userId, soundEnabled }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse/${userId}`);

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications([...notifications, notification]); // ← BUG #1

      if (soundEnabled) {
        // ← BUG #2: stale soundEnabled
        playNotificationSound();
      }
    };

    return () => eventSource.close();
  }, [userId, soundEnabled, notifications]);
  // ← BUG #3: notifications + soundEnabled cause SSE reconnect!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function NotificationCenter({ userId, soundEnabled }) {
  const [notifications, setNotifications] = useState([]);

  const onNotification = useEffectEvent((notification) => {
    setNotifications((prev) => [...prev, notification]); // ✅ FIX #1
    if (soundEnabled) {
      // ✅ FIX #2: latest soundEnabled
      playNotificationSound();
    }
  });

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse/${userId}`);

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      onNotification(notification);
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => eventSource.close();
  }, [userId]); // ✅ FIX #3: CHỈ userId — không reconnect khi toggle sound

  return notifications;
}
```

**3 bugs:**

1. `[...notifications, ...]` stale closure → updater function
2. `soundEnabled` captured khi Effect tạo → stale → useEffectEvent
3. `notifications` và `soundEnabled` trong deps → SSE reconnect mỗi message!

</details>

### Scenario 12: Async Form Validation

```tsx
// TÌM BUG VÀ FIX:
function UsernameField() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (username.length < 3) {
      setError("Too short");
      return;
    }

    setChecking(true);
    checkUsernameAvailability(username).then((available) => {
      setChecking(false);
      if (!available) {
        setError("Username taken");
      } else {
        setError(null);
      }
    });
    // ← BUG #1: No race condition protection
    // ← BUG #2: No debouncing — API call on every keystroke
  }, [username]);
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function UsernameField() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (username.length < 3) {
      setError(username.length > 0 ? "Too short" : null);
      setChecking(false);
      return;
    }

    let ignore = false; // ✅ FIX #1: Race condition protection
    setChecking(true);

    // ✅ FIX #2: Debounce — wait 500ms after last keystroke
    const timer = setTimeout(() => {
      checkUsernameAvailability(username)
        .then((available) => {
          if (!ignore) {
            setChecking(false);
            setError(available ? null : "Username taken");
          }
        })
        .catch((err) => {
          if (!ignore) {
            setChecking(false);
            setError("Check failed. Try again.");
          }
        });
    }, 500);

    return () => {
      ignore = true; // Cancel stale response
      clearTimeout(timer); // Cancel pending check
    };
  }, [username]);

  return (
    <div>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      {checking && <span>Checking...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

**2 bugs + improvement:**

1. Không có `ignore` flag → fast typing = stale "taken" overwrites correct result
2. Mỗi keystroke = 1 API call → 10 keystrokes = 10 calls. Debounce 500ms = 1 call
3. **Bonus:** Error handling cho API failure

</details>

### Scenario 13: System Dark Mode Sync

```tsx
// TÌM BUG VÀ FIX:
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    mediaQuery.addListener((e) => {
      // ← BUG #1: Deprecated API
      setIsDark(e.matches);
    });

    // ← BUG #2: No cleanup — listener never removed
  }, []);

  useEffect(() => {
    document.body.className = isDark ? "dark" : "light";
    // ← BUG #3: Nên dùng useLayoutEffect (flash!)
  }, [isDark]);

  return [isDark, setIsDark];
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // Check saved preference first, then system
    const saved = localStorage.getItem("dark-mode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Listen for system changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler); // ✅ FIX #1: Modern API
    return () => mediaQuery.removeEventListener("change", handler);
    // ✅ FIX #2: Cleanup listener
  }, []);

  // Apply class — before paint to prevent flash
  useLayoutEffect(() => {
    // ✅ FIX #3: useLayoutEffect
    document.body.className = isDark ? "dark" : "light";
  }, [isDark]);

  // Persist preference
  useEffect(() => {
    localStorage.setItem("dark-mode", JSON.stringify(isDark));
  }, [isDark]);

  return [isDark, setIsDark];
}
```

**3 bugs:**

1. `addListener` deprecated → `addEventListener('change', handler)`
2. Thiếu cleanup → listener accumulates on re-mount
3. `useEffect` cho class toggle → user sees flash. `useLayoutEffect` apply TRƯỚC paint

</details>

### Scenario 14: Intersection Observer Lazy Load

```tsx
// TÌM BUG VÀ FIX:
function LazyImage({ src, alt, placeholder }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    });

    observer.observe(imgRef.current); // ← BUG #1: ref.current có thể null

    return () => observer.disconnect();
  }, [src]); // ← BUG #2: Tại sao deps = [src]?

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    // ← BUG #3: Cleanup? Nếu unmount trước khi load xong?
  }, [isInView, src]);

  return <img ref={imgRef} src={isLoaded ? src : placeholder} alt={alt} />;
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function LazyImage({ src, alt, placeholder }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return; // ✅ FIX #1: Null check

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el); // Observe once
        }
      },
      { rootMargin: "200px" }, // Start loading before in view
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // ✅ FIX #2: Empty deps — observer is static, ref doesn't re-create

  useEffect(() => {
    if (!isInView) return;

    setIsLoaded(false); // Reset for new src
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);

    return () => {
      img.onload = null; // ✅ FIX #3: Prevent setState on unmounted
      img.src = ""; // Cancel download
    };
  }, [isInView, src]);

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : placeholder}
      alt={alt}
      style={{ opacity: isLoaded ? 1 : 0.5, transition: "opacity 0.3s" }}
    />
  );
}
```

**3 bugs:**

1. `imgRef.current` có thể `null` khi Effect chạy → null check
2. `src` trong observer Effect deps → observer re-create mỗi khi src đổi (không cần)
3. Image load hoàn thành sau unmount → setState on unmounted → cleanup `img.onload = null`

</details>

### Scenario 15: Keyboard Shortcuts Manager

```tsx
// TÌM BUG VÀ FIX:
function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (event) => {
      const combo = `${event.ctrlKey ? "Ctrl+" : ""}${event.key}`;
      const action = shortcuts[combo]; // ← BUG #1: shortcuts object = unstable dep
      if (action) {
        event.preventDefault();
        action();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [shortcuts]); // ← BUG #2: shortcuts = new object every render → listener re-attach
}

// Usage in component:
function Editor() {
  const [content, setContent] = useState("");

  useKeyboardShortcuts({
    // ← BUG #3: New object literal every render!
    "Ctrl+s": () => save(content),
    "Ctrl+z": () => undo(),
  });
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useKeyboardShortcuts(shortcuts) {
  // ✅ FIX #1 & #2: Store latest shortcuts in ref
  const shortcutsRef = useRef(shortcuts);
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handler = (event) => {
      const combo = `${event.ctrlKey ? "Ctrl+" : ""}${event.key}`;
      const action = shortcutsRef.current[combo]; // ✅ Latest from ref
      if (action) {
        event.preventDefault();
        action();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []); // ✅ Static listener — shortcuts via ref
}

// Usage stays clean:
function Editor() {
  const [content, setContent] = useState("");

  useKeyboardShortcuts({
    // ✅ FIX #3: OK now — ref always has latest
    "Ctrl+s": () => save(content),
    "Ctrl+z": () => undo(),
  });
}
```

**Giải thích:**

- Object literal mỗi render = new reference → Effect re-run → listener flapping
- Ref pattern: listener STATIC (mount only), callbacks luôn LATEST qua ref
- Alternative: `useEffectEvent` cho handler nếu API stable

</details>

### Scenario 16: Data Polling With Page Visibility

```tsx
// TÌM BUG VÀ FIX:
function usePollData(url, interval = 5000) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      fetch(url)
        .then((r) => r.json())
        .then(setData);
    };

    fetchData(); // Initial fetch
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [url, interval]);
  // ← BUG #1: Polling continues when tab is hidden (waste!)
  // ← BUG #2: No error handling
  // ← BUG #3: No race condition protection
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function usePollData(url, interval = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false; // ✅ FIX #3: Race condition protection
    let timer;

    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!ignore) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err); // ✅ FIX #2: Error handling
      }
    };

    const startPolling = () => {
      fetchData();
      timer = setInterval(fetchData, interval);
    };

    const stopPolling = () => {
      clearInterval(timer);
    };

    // ✅ FIX #1: Pause when tab hidden
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling(); // Resume + immediate fetch
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      ignore = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [url, interval]);

  return { data, error };
}
```

**3 bugs:**

1. Polling khi tab hidden = waste bandwidth + server load → pause on `visibilitychange`
2. Network error = unhandled → try/catch
3. URL/interval change mid-fetch → stale data → `ignore` flag

</details>

### Scenario 17: Undo/Redo History

```tsx
// TÌM BUG VÀ FIX:
function useUndoRedo(initialValue) {
  const [history, setHistory] = useState([initialValue]);
  const [index, setIndex] = useState(0);

  const value = history[index];

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("undo-history", JSON.stringify(history));
  }, [history]);

  const push = (newValue) => {
    const newHistory = [...history.slice(0, index + 1), newValue];
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
    // ← BUG #1: 2 separate setState → 2 renders
    // Intermediate state: index points to OLD position in NEW history
  };

  const undo = () => {
    if (index > 0) setIndex(index - 1);
    // ← BUG #2: index stale nếu undo liên tục nhanh
  };

  const redo = () => {
    if (index < history.length - 1) setIndex(index + 1);
    // ← BUG #3: Tương tự — index stale
  };

  return {
    value,
    push,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function undoRedoReducer(state, action) {
  switch (action.type) {
    case "PUSH": {
      const newHistory = [
        ...state.history.slice(0, state.index + 1),
        action.value,
      ];
      return { history: newHistory, index: newHistory.length - 1 };
      // ✅ FIX #1: Atomic update — history + index together
    }
    case "UNDO":
      return state.index > 0 ? { ...state, index: state.index - 1 } : state;
    // ✅ FIX #2: Reads from state directly, not closure
    case "REDO":
      return state.index < state.history.length - 1
        ? { ...state, index: state.index + 1 }
        : state;
    // ✅ FIX #3: Same — no stale closure
    default:
      return state;
  }
}

function useUndoRedo(initialValue) {
  const [state, dispatch] = useReducer(undoRedoReducer, {
    history: [initialValue],
    index: 0,
  });

  const value = state.history[state.index];

  // Auto-save (debounced to avoid excessive writes)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("undo-history", JSON.stringify(state.history));
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.history]);

  return {
    value,
    push: (v) => dispatch({ type: "PUSH", value: v }),
    undo: () => dispatch({ type: "UNDO" }),
    redo: () => dispatch({ type: "REDO" }),
    canUndo: state.index > 0,
    canRedo: state.index < state.history.length - 1,
  };
}
```

**3 bugs → 1 solution: useReducer**

1. `useState` + 2 separate sets = intermediate bad state → `useReducer` atomic
2. `undo` reads `index` from closure → stale if called rapidly → reducer reads from state
3. Same for `redo` → reducer handles co-dependent state correctly

</details>

### Scenario 18: Dashboard Widget Lifecycle

```tsx
// TÌM BUG VÀ FIX:
function Dashboard({ widgets, refreshInterval }) {
  const [widgetData, setWidgetData] = useState({});

  useEffect(() => {
    // Fetch all widget data
    widgets.forEach((widget) => {
      // ← BUG #1
      fetch(`/api/widget/${widget.id}`)
        .then((r) => r.json())
        .then((data) => {
          setWidgetData((prev) => ({
            ...prev,
            [widget.id]: data,
          }));
        });
    });

    // Auto-refresh
    const timer = setInterval(() => {
      widgets.forEach((widget) => {
        // ← BUG #2: stale widgets
        fetch(`/api/widget/${widget.id}`)
          .then((r) => r.json())
          .then((data) => {
            setWidgetData((prev) => ({ ...prev, [widget.id]: data }));
          });
      });
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [widgets, refreshInterval]);
  // ← BUG #3: widgets = array prop = new reference every render!
  // ← BUG #4: No abort on cleanup
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function Dashboard({ widgets, refreshInterval }) {
  const [widgetData, setWidgetData] = useState({});

  // ✅ Stabilize widget IDs
  const widgetIds = widgets.map((w) => w.id).join(",");

  const fetchAllWidgets = useEffectEvent(async (signal) => {
    // ✅ FIX #2: Always reads latest widgets
    const promises = widgets.map(
      (widget) =>
        fetch(`/api/widget/${widget.id}`, { signal })
          .then((r) => r.json())
          .then((data) => ({ id: widget.id, data }))
          .catch(() => null), // Individual widget failure doesn't block others
    );

    const results = await Promise.all(promises);
    const newData = {};
    results.forEach((r) => {
      if (r) newData[r.id] = r.data;
    });
    setWidgetData((prev) => ({ ...prev, ...newData }));
    // ✅ FIX #1: Batch all widget data in one setState
  });

  useEffect(() => {
    const controller = new AbortController(); // ✅ FIX #4

    fetchAllWidgets(controller.signal);

    const timer = setInterval(
      () => fetchAllWidgets(controller.signal),
      refreshInterval,
    );

    return () => {
      controller.abort(); // Cancel inflight requests
      clearInterval(timer);
    };
  }, [widgetIds, refreshInterval]); // ✅ FIX #3: widgetIds = string (stable)

  return widgetData;
}
```

**4 bugs:**

1. `forEach` + individual `setWidgetData` = N setState calls → batch with `Promise.all`
2. `widgets` stale trong `setInterval` closure → `useEffectEvent`
3. `widgets` array = new ref each render → derive `widgetIds` string for stable dep
4. No `AbortController` → cleanup leaves zombie requests

</details>

### Scenario 19: Window Resize Debounce

```tsx
// TÌM BUG VÀ FIX:
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth, // ← BUG #1: SSR crash!
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // ← BUG #2: No debounce — resize fires 100s of times
  // ← BUG #3: Initial size might be wrong after hydration
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useWindowSize(debounceMs = 150) {
  const [size, setSize] = useState(() => ({
    // ✅ FIX #1: Lazy init + SSR safe
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    // ✅ FIX #3: Sync initial size after hydration
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    let timeoutId;

    const handleResize = () => {
      // ✅ FIX #2: Debounce
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return size;
}
```

**3 bugs:**

1. `window.innerWidth` directly in `useState` → crash on server (SSR). Lazy init + check.
2. Resize event fires rapidly → 100s of setState → debounce with setTimeout
3. After SSR hydration, size might differ → sync in Effect on mount

</details>

### Scenario 20: Comprehensive Code Review Challenge

```tsx
// 🏆 FINAL CHALLENGE: Tìm TẤT CẢ bugs (có ÍT NHẤT 7):
function UserProfilePage({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const theme = useContext(ThemeContext);

  // Bug-ridden Effect #1: Fetch user data
  useEffect(async () => {
    // ← BUG #1
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    setUser(data);
    setIsFollowing(data.isFollowedByMe);
    document.title = `${data.name}'s Profile`;
  }, []); // ← BUG #2

  // Bug-ridden Effect #2: Fetch posts
  useEffect(() => {
    fetch(`/api/users/${userId}/posts`)
      .then((r) => r.json())
      .then((data) => setPosts(data));
  }, []); // ← BUG #3 (same as #2)

  // Bug-ridden Effect #3: Follow button analytics
  useEffect(() => {
    if (isFollowing) {
      trackEvent("follow", { userId, theme });
    }
  }, [isFollowing]); // ← BUG #4

  // Bug-ridden Effect #4: Document title sync
  useEffect(() => {
    return () => {
      document.title = "My App"; // ← OK nhưng xung đột với #1
    };
  }, []);

  // Bug-ridden Effect #5: Online presence
  useEffect(() => {
    const ws = new WebSocket(`wss://presence/${userId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "status") {
        setUser({ ...user, isOnline: data.isOnline }); // ← BUG #5
      }
    };
  }, [userId, user]); // ← BUG #6 + BUG #7
}
```

<details>
<summary>💡 Đáp án chi tiết</summary>

**BUG #1: async Effect function**

```tsx
// ❌ useEffect(async () => { ... })
// → Effect returns Promise, React expects void or cleanup function
// ✅ Tạo async function bên trong:
useEffect(() => {
  async function fetchUser() { ... }
  fetchUser();
}, [...]);
```

**BUG #2: userId thiếu trong deps**

```tsx
// ❌ deps = [] nhưng đọc userId
// → userId thay đổi → user data cũ hiện
// ✅ deps = [userId]
```

**BUG #3: Tương tự — userId thiếu cho posts fetch**

```tsx
// ✅ deps = [userId]
```

**BUG #4: userId và theme thiếu trong deps**

```tsx
// eslint sẽ warn: 'userId' và 'theme' used but not in deps
// ✅ deps = [isFollowing, userId, theme]
// HOẶC tốt hơn: Đây KHÔNG NÊN là Effect — nên là event handler!
// trackEvent nên gọi trong handleFollow click handler
```

**BUG #5: Stale `user` trong WebSocket handler**

```tsx
// ❌ setUser({ ...user, isOnline: ... }) — user stale from closure
// ✅ setUser(prev => ({ ...prev, isOnline: data.isOnline }))
```

**BUG #6: `user` trong deps → infinite loop**

```tsx
// user change → Effect re-run → new WebSocket → user change → ...
// ✅ Remove user from deps, dùng updater function
```

**BUG #7: WebSocket thiếu cleanup**

```tsx
// ✅ return () => ws.close();
```

**FIXED VERSION:**

```tsx
function UserProfilePage({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const theme = useContext(ThemeContext);

  // ✅ FIX: Fetch user + set title
  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      if (!ignore) {
        setUser(data);
        setIsFollowing(data.isFollowedByMe);
        document.title = `${data.name}'s Profile`;
      }
    }
    fetchUser();
    return () => {
      ignore = true;
      document.title = "My App"; // Reset on cleanup
    };
  }, [userId]);

  // ✅ FIX: Fetch posts
  useEffect(() => {
    let ignore = false;
    fetch(`/api/users/${userId}/posts`)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setPosts(data);
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  // ✅ FIX: Follow analytics → move to event handler
  const handleFollowToggle = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    if (newFollowing) {
      trackEvent("follow", { userId, theme }); // Event handler, not Effect!
    }
  };

  // ✅ FIX: Online presence
  useEffect(() => {
    const ws = new WebSocket(`wss://presence/${userId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "status") {
        setUser((prev) => (prev ? { ...prev, isOnline: data.isOnline } : prev));
      }
    };
    return () => ws.close();
  }, [userId]);
}
```

**Scoring:**

- Tìm được 5+/7 bugs = Senior level
- Tìm được 7/7 bugs = Staff level
- Tìm được 7/7 + fix tối ưu + giải thích WHY = Staff+ level

</details>

### Scenario 21: Animation With requestAnimationFrame

```tsx
// TÌM BUG VÀ FIX:
function AnimatedCounter({ targetValue, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue; // ← BUG #1: stale displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startValue + (targetValue - startValue) * progress;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
        // ← BUG #2: No way to cancel animation on cleanup
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration, displayValue]);
  // ← BUG #3: displayValue in deps → infinite animation restart!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function AnimatedCounter({ targetValue, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0); // Track previous target

  useEffect(() => {
    const startValue = prevValueRef.current; // ✅ FIX #1: Ref, not state
    const startTime = performance.now();
    let rafId;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = startValue + (targetValue - startValue) * eased;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate); // Store ID
      } else {
        prevValueRef.current = targetValue; // Save final value
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId); // ✅ FIX #2: Cancel on cleanup
      prevValueRef.current = displayValue; // Save interrupted value
    };
  }, [targetValue, duration]); // ✅ FIX #3: NO displayValue

  return <span>{displayValue}</span>;
}
```

**3 bugs:**

1. `displayValue` từ state = stale → dùng ref để track previous value
2. `requestAnimationFrame` không cancel → memory leak + zombie animations
3. `displayValue` trong deps → mỗi frame setState → Effect restart → stuttering

</details>

### Scenario 22: Clipboard History Manager

```tsx
// TÌM BUG VÀ FIX:
function useClipboardHistory(maxItems = 10) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleCopy = () => {
      navigator.clipboard.readText().then((text) => {
        if (text && text !== history[0]) {
          // ← BUG #1: stale history
          setHistory([text, ...history].slice(0, maxItems)); // ← BUG #2
        }
      });
      // ← BUG #3: clipboard.readText() needs permission, no error handling
    };

    document.addEventListener("copy", handleCopy);
    // ← BUG #4: missing cleanup
  }, []); // ← BUG #5: maxItems thiếu

  return history;
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useClipboardHistory(maxItems = 10) {
  const [history, setHistory] = useState(() => {
    // Restore from localStorage
    const saved = localStorage.getItem("clipboard-history");
    return saved ? JSON.parse(saved) : [];
  });

  const onCopyEvent = useEffectEvent(async () => {
    try {
      const text = await navigator.clipboard.readText();
      // ✅ FIX #3: Error handling for permission

      if (text) {
        setHistory((prev) => {
          // ✅ FIX #1: Read latest via updater
          if (prev[0] === text) return prev; // Duplicate check
          const newHistory = [text, ...prev].slice(0, maxItems);
          // ✅ FIX #2: Updater + maxItems from closure (stable via useEffectEvent)
          localStorage.setItem("clipboard-history", JSON.stringify(newHistory));
          return newHistory;
        });
      }
    } catch (err) {
      // Permission denied or clipboard API unavailable
      console.warn("Clipboard access denied:", err);
    }
  });

  useEffect(() => {
    const handleCopy = () => onCopyEvent();

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
    // ✅ FIX #4: Cleanup
  }, []); // ✅ FIX #5: maxItems handled via useEffectEvent

  return history;
}
```

**5 bugs:**

1. `history[0]` stale closure → updater function
2. `[text, ...history]` stale → updater `prev`
3. `readText()` cần permission → try/catch
4. Thiếu `removeEventListener` → cleanup
5. `maxItems` thay đổi nhưng listener không update → `useEffectEvent`

</details>

### Scenario 23: Geolocation Tracker With Map

```tsx
// TÌM BUG VÀ FIX:
function LocationTracker({ onLocationChange, enableHighAccuracy }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(coords);
        onLocationChange(coords); // ← BUG #1: onLocationChange may be unstable
      },
      (err) => setError(err.message),
      { enableHighAccuracy }, // ← BUG #2: object literal in options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy, onLocationChange]);
  // ← BUG #3: onLocationChange = new function ref → watch restarts!
}

// Usage:
function App() {
  return (
    <LocationTracker
      enableHighAccuracy={true}
      onLocationChange={(coords) => {
        // ← BUG source: new fn each render
        console.log("Moved to:", coords);
        updateMap(coords);
      }}
    />
  );
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function LocationTracker({ onLocationChange, enableHighAccuracy }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  // ✅ FIX #1 & #3: Stabilize callback
  const handleLocationChange = useEffectEvent((coords) => {
    onLocationChange(coords); // Always latest onLocationChange
  });

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setPosition(coords);
        handleLocationChange(coords);
      },
      (err) => setError(err.message),
      { enableHighAccuracy }, // ✅ FIX #2: OK — recreating watch khi accuracy changes IS correct
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy]); // ✅ Only primitive dep — onLocationChange via useEffectEvent

  return { position, error };
}

// Usage stays clean — no useCallback needed in parent:
function App() {
  return (
    <LocationTracker
      enableHighAccuracy={true}
      onLocationChange={(coords) => {
        console.log("Moved to:", coords);
        updateMap(coords);
      }}
    />
  );
}
```

**3 bugs:**

1. `onLocationChange` callback unstable → `useEffectEvent` wraps it
2. Object literal `{ enableHighAccuracy }` — actually fine here since we WANT to restart watch when accuracy changes
3. `onLocationChange` in deps → geolocation watch restarts every render → remove via useEffectEvent

</details>

### Scenario 24: Custom Event Bus Subscription

```tsx
// TÌM BUG VÀ FIX:
const eventBus = new EventTarget();

function useEventBus(eventName, handler) {
  useEffect(() => {
    const listener = (e) => handler(e.detail); // ← BUG #1: handler stale

    eventBus.addEventListener(eventName, listener);
    return () => eventBus.removeEventListener(eventName, listener);
  }, [eventName]); // ← BUG #2: handler thiếu (nhưng thêm vào = listener flap)
}

function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEventBus("new-message", (data) => {
    setCount(count + 1); // ← BUG #3: stale count
    showToast(data.message);
  });

  return <span className="badge">{count}</span>;
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
const eventBus = new EventTarget();

function useEventBus(eventName, handler) {
  // ✅ FIX #1 & #2: Ref pattern cho handler
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (e) => handlerRef.current(e.detail); // Latest handler

    eventBus.addEventListener(eventName, listener);
    return () => eventBus.removeEventListener(eventName, listener);
  }, [eventName]); // Only re-subscribe when event name changes
}

function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEventBus("new-message", (data) => {
    setCount((prev) => prev + 1); // ✅ FIX #3: updater function
    showToast(data.message);
  });

  return <span className="badge">{count}</span>;
}
```

**3 bugs:**

1. `handler` captured lúc subscribe → stale khi handler chứa state/props mới → ref pattern
2. Thêm `handler` vào deps → listener add/remove mỗi render → ref giải quyết
3. `count + 1` stale closure → updater `prev => prev + 1`

</details>

### Scenario 25: ResizeObserver Responsive Layout

```tsx
// TÌM BUG VÀ FIX:
function ResponsiveGrid({ children, breakpoints }) {
  const containerRef = useRef(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;

      // Determine columns based on breakpoints
      if (width >= breakpoints.lg)
        setColumns(4); // ← BUG #1: breakpoints object
      else if (width >= breakpoints.md) setColumns(3);
      else if (width >= breakpoints.sm) setColumns(2);
      else setColumns(1);
    });

    observer.observe(containerRef.current); // ← BUG #2: null check
    return () => observer.disconnect();
  }, [breakpoints]);
  // ← BUG #3: breakpoints = new object → observer reconnect every render!
}

// Usage:
function App() {
  return (
    <ResponsiveGrid breakpoints={{ sm: 640, md: 768, lg: 1024 }}>
      {items.map((item) => (
        <Card key={item.id} {...item} />
      ))}
    </ResponsiveGrid>
  );
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function ResponsiveGrid({ children, breakpoints }) {
  const containerRef = useRef(null);
  const [columns, setColumns] = useState(1);

  // ✅ FIX #3: Destructure to primitives
  const { sm = 640, md = 768, lg = 1024 } = breakpoints;

  // ✅ FIX #1: Use primitives, not object
  const calculateColumns = useEffectEvent((width) => {
    if (width >= lg) return 4;
    if (width >= md) return 3;
    if (width >= sm) return 2;
    return 1;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return; // ✅ FIX #2: null check

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumns(calculateColumns(width));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // ✅ Static observer — breakpoints via useEffectEvent

  return (
    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "16px",
      }}
    >
      {children}
    </div>
  );
}
```

**3 bugs:**

1. `breakpoints.lg/md/sm` là object access — khi breakpoints object thay đổi reference, Effect re-run
2. `containerRef.current` có thể null → guard check
3. `breakpoints` = object literal từ parent → new reference mỗi render → observer disconnect/reconnect

</details>

### Scenario 26: Focus Trap in Modal

```tsx
// TÌM BUG VÀ FIX:
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose(); // ← BUG #1: onClose unstable

      if (e.key === "Tab") {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // ← BUG #2: Should focus first element on open
    // ← BUG #3: Should restore focus on close
  }, [isOpen, onClose]); // ← BUG #4: onClose makes listener re-attach + missing cleanup
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null); // ✅ FIX #3: Track previous focus

  const handleClose = useEffectEvent(() => {
    onClose(); // ✅ FIX #1: Latest onClose without dep
  });

  useEffect(() => {
    if (!isOpen) return;

    // ✅ FIX #3: Save currently focused element
    previousFocusRef.current = document.activeElement;

    // ✅ FIX #2: Focus first focusable element
    const timer = requestAnimationFrame(() => {
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.[0]?.focus();
    });

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown); // ✅ FIX #4
      cancelAnimationFrame(timer);
      previousFocusRef.current?.focus(); // ✅ FIX #3: Restore focus on close
    };
  }, [isOpen]); // ✅ Only isOpen — onClose via useEffectEvent

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

**4 bugs:**

1. `onClose` unstable → `useEffectEvent`
2. Modal opens nhưng không auto-focus first element → `requestAnimationFrame` + focus
3. Khi modal close, focus không quay lại element trước đó → save/restore focus
4. Missing `removeEventListener` + `onClose` in deps gây listener re-attach

</details>

### Scenario 27: Retry With Exponential Backoff

```tsx
// TÌM BUG VÀ FIX:
function useFetchWithRetry(url, maxRetries = 3) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => {
        if (retryCount < maxRetries) {
          setTimeout(
            () => {
              setRetryCount(retryCount + 1); // ← BUG #1: stale retryCount
            },
            1000 * Math.pow(2, retryCount),
          ); // ← BUG #2: stale retryCount in delay
        } else {
          setError(err);
        }
      });
  }, [url, retryCount]); // ← BUG #3: retryCount deps → old response overwrites retry
  // ← BUG #4: No abort on cleanup → race condition
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useFetchWithRetry(url, maxRetries = 3) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController(); // ✅ FIX #4
    let retryCount = 0; // ✅ FIX #1 & #2: Local variable, not state
    let retryTimer;

    async function fetchWithRetry() {
      setIsLoading(true);
      setError(null);

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();

          if (!controller.signal.aborted) {
            setData(result);
            setIsLoading(false);
          }
          return; // Success — exit loop
        } catch (err) {
          if (err.name === "AbortError") return;

          if (retryCount < maxRetries) {
            // Wait with exponential backoff + jitter
            const delay = 1000 * Math.pow(2, retryCount) + Math.random() * 500;
            await new Promise((resolve) => {
              retryTimer = setTimeout(resolve, delay);
            });
            retryCount++;
          } else {
            if (!controller.signal.aborted) {
              setError(err);
              setIsLoading(false);
            }
            return;
          }
        }
      }
    }

    fetchWithRetry();

    return () => {
      controller.abort(); // ✅ FIX #4
      clearTimeout(retryTimer);
    };
  }, [url, maxRetries]); // ✅ FIX #3: No retryCount — it's local

  return { data, error, isLoading };
}
```

**4 bugs → Core insight: retry count should be LOCAL, not STATE:**

1. `retryCount` stale trong closure → local variable thay vì state
2. Delay calculation dùng stale count → same fix
3. `retryCount` state → mỗi retry = re-render + Effect re-run → parallel fetches!
4. Không abort → previous fetch completes while retry runs → race condition

</details>

### Scenario 28: Optimistic UI With Rollback

```tsx
// TÌM BUG VÀ FIX:
function TodoList() {
  const [todos, setTodos] = useState([]);

  const toggleTodo = (id) => {
    // Optimistic update
    const previousTodos = todos; // ← BUG #1: reference, not copy
    setTodos(
      todos.map(
        (
          t, // ← BUG #2: stale todos
        ) => (t.id === id ? { ...t, completed: !t.completed } : t),
      ),
    );

    // Sync with server
    fetch(`/api/todos/${id}/toggle`, { method: "POST" }).catch(() => {
      setTodos(previousTodos); // ← BUG #3: stale previousTodos
      showError("Failed to update");
    });
  };

  useEffect(() => {
    fetch("/api/todos")
      .then((r) => r.json())
      .then(setTodos);
  }, []);

  return todos.map((t) => (
    <label key={t.id}>
      <input
        type="checkbox"
        checked={t.completed}
        onChange={() => toggleTodo(t.id)}
      />
      {t.text}
    </label>
  ));
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function TodoList() {
  const [todos, setTodos] = useState([]);

  const toggleTodo = async (id) => {
    // ✅ FIX #1, #2, #3: Use updater + capture snapshot
    let snapshot;

    setTodos((prev) => {
      snapshot = prev; // ✅ Capture CURRENT state as snapshot
      return prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ); // ✅ Updater reads latest todos
    });

    try {
      const response = await fetch(`/api/todos/${id}/toggle`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed");
    } catch {
      setTodos(snapshot); // ✅ Rollback to actual snapshot
      showError("Failed to update. Reverted.");
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/todos")
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setTodos(data);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return todos.map((t) => (
    <label key={t.id}>
      <input
        type="checkbox"
        checked={t.completed}
        onChange={() => toggleTodo(t.id)}
      />
      {t.text}
    </label>
  ));
}
```

**3 bugs — all about stale closure in event handler:**

1. `previousTodos = todos` captures REFERENCE (same array if no other update happened) → capture inside updater
2. `todos.map(...)` reads stale `todos` from closure → updater `prev.map(...)`
3. Rollback dùng `previousTodos` nhưng nó đã stale → capture snapshot inside updater

</details>

### Scenario 29: Multi-Step Form Wizard

```tsx
// TÌM BUG VÀ FIX:
function FormWizard({ steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/drafts", {
        method: "PUT",
        body: JSON.stringify({ step: currentStep, data: formData }),
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [formData]); // ← BUG #1: currentStep thiếu
  // ← BUG #2: formData = object → Effect runs every render nếu parent re-renders

  // Warn before leaving
  useEffect(() => {
    const handler = (e) => {
      if (Object.keys(formData).length > 0) {
        // ← BUG #3: stale formData
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []); // ← BUG #4: formData thiếu (nhưng thêm = listener flap)

  // Navigate steps
  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1); // ← BUG #5: stale if clicked rapidly
    } else {
      onComplete(formData); // ← BUG #6: onComplete may be unstable
    }
  };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function FormWizard({ steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const formDataRef = useRef(formData); // Track latest for beforeunload

  // Sync ref
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Stabilize callbacks
  const handleComplete = useEffectEvent(() => {
    onComplete(formDataRef.current); // ✅ FIX #6: Latest formData & onComplete
  });

  // Auto-save draft — debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep, data: formData }),
      }).catch(console.error);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentStep, formData]); // ✅ FIX #1: currentStep added
  // ✅ FIX #2: formData comes from useState → only changes when setFormData called

  // Warn before leaving — ref pattern
  useEffect(() => {
    const handler = (e) => {
      if (Object.keys(formDataRef.current).length > 0) {
        // ✅ FIX #3 & #4: Ref always has latest
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []); // Static listener — formData via ref

  // Navigate steps — updater functions
  const goNext = () => {
    setCurrentStep((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1; // ✅ FIX #5: Updater
      }
      handleComplete();
      return prev;
    });
  };

  const goBack = () => setCurrentStep((prev) => Math.max(0, prev - 1));
}
```

**6 bugs:**

1. `currentStep` thiếu trong auto-save deps → draft sai step
2. `formData` là object nhưng từ `useState` → chỉ thay đổi khi `setFormData` gọi (ok)
3. `formData` stale trong `beforeunload` handler → ref pattern
4. Thêm `formData` vào deps = listener flap → ref giải quyết
5. `currentStep + 1` stale nếu click nhanh → updater function
6. `onComplete` unstable → `useEffectEvent`

</details>

### Scenario 30: Canvas Drawing With Mouse Events

```tsx
// TÌM BUG VÀ FIX:
function DrawingCanvas({ color, lineWidth, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const handleMouseDown = (e) => {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const handleMouseMove = (e) => {
      if (!isDrawing) return; // ← BUG #1: stale isDrawing
      ctx.strokeStyle = color; // ← BUG #2: stale color
      ctx.lineWidth = lineWidth; // ← BUG #3: stale lineWidth
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      onSave(canvas.toDataURL()); // ← BUG #4: stale/unstable onSave
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  // ← BUG #5: color, lineWidth, isDrawing, onSave ALL missing
  // Nhưng thêm hết vào → listeners re-attach liên tục, drawing bị reset!
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function DrawingCanvas({ color, lineWidth, onSave }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false); // ✅ FIX #1: Ref instead of state
  const colorRef = useRef(color); // ✅ FIX #2
  const lineWidthRef = useRef(lineWidth); // ✅ FIX #3

  // Sync refs with props
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    lineWidthRef.current = lineWidth;
  }, [lineWidth]);

  const handleSave = useEffectEvent(() => {
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL()); // ✅ FIX #4: Latest onSave
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const handleMouseDown = (e) => {
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return; // Latest from ref
      ctx.strokeStyle = colorRef.current; // Latest from ref
      ctx.lineWidth = lineWidthRef.current; // Latest from ref
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const handleMouseUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        handleSave();
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseup", handleMouseUp); // Handle drag outside canvas

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []); // ✅ FIX #5: Static listeners — all values via refs

  return <canvas ref={canvasRef} style={{ width: "100%", height: "400px" }} />;
}
```

**5 bugs → Key insight: Canvas drawing needs REFS, not state/deps:**
1-3. `isDrawing`, `color`, `lineWidth` stale → all via refs 4. `onSave` unstable → `useEffectEvent` 5. Adding deps = listeners re-attach = canvas listeners reset = drawing broken → refs for everything

**Pattern:** High-frequency event handlers (mouse draw = 60fps) should NEVER cause Effect re-runs. Refs = escape hatch for reading latest values without re-syncing.

</details>

### Scenario 31: Service Worker Registration

```tsx
// TÌM BUG VÀ FIX:
function useServiceWorker(swUrl) {
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        setRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => console.error("SW registration failed:", err));

    // ← BUG #1: No cleanup — SW listener leaks
    // ← BUG #2: No way to handle update (skipWaiting)
  }, []); // ← BUG #3: swUrl thiếu trong deps

  // ← BUG #4: Missing: Listen for controller change (page reload after update)

  return { registration, updateAvailable };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useServiceWorker(swUrl) {
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reg;

    async function registerSW() {
      try {
        reg = await navigator.serviceWorker.register(swUrl);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });

        // ✅ FIX #2: Force update check
        if (reg.waiting) {
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.error("SW registration failed:", err);
      }
    }

    registerSW();

    // ✅ FIX #4: Listen for controller change
    const handleControllerChange = () => {
      window.location.reload(); // New SW took over
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    return () => {
      // ✅ FIX #1: Cleanup
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
      // Note: Don't unregister SW on cleanup — that would break it!
    };
  }, [swUrl]); // ✅ FIX #3: swUrl in deps

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      // ✅ FIX #2: Tell waiting SW to activate
    }
  }, [registration]);

  return { registration, updateAvailable, applyUpdate };
}
```

**4 bugs:**

1. `controllerchange` listener never removed → cleanup
2. No mechanism to apply update → `postMessage({ type: 'SKIP_WAITING' })`
3. `swUrl` change should re-register → add to deps
4. Missing `controllerchange` listener → page stale after SW update

</details>

### Scenario 32: Throttled Scroll Animation

```tsx
// TÌM BUG VÀ FIX:
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (scrollTop / docHeight) * 100;
      setProgress(scrolled); // ← BUG #1: Fires 100s of times per second!
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
}

function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "3px",
        backgroundColor: "blue",
        transition: "width 0.1s", // ← BUG #2: Transition + frequent updates = jank
      }}
    />
  );
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        // ✅ FIX #1: Throttle with rAF — max 60fps
        rafId = requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            setProgress((scrollTop / docHeight) * 100);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // ✅ BONUS: passive: true for better scroll performance

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
}

function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "3px",
        backgroundColor: "blue",
        // ✅ FIX #2: Use transform instead of width for GPU acceleration
        transform: `scaleX(${progress / 100})`,
        transformOrigin: "left",
        width: "100%",
        willChange: "transform",
      }}
    />
  );
}
```

**2 bugs + optimizations:**

1. Every scroll event = setState → 100s calls/sec → throttle with `requestAnimationFrame`
2. Animating `width` triggers layout recalculation → use `transform: scaleX()` for GPU-accelerated composited animation
3. **Bonus:** `passive: true` listener → browser can optimize scroll without waiting for `preventDefault`

</details>

### Scenario 33: Media Recorder Lifecycle

```tsx
// TÌM BUG VÀ FIX:
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
      chunks.current = [];
      // ← BUG #1: Stream tracks not stopped → mic stays active!
    };

    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  // ← BUG #2: No cleanup on unmount → mic leak!
  // ← BUG #3: Old audioUrl blob not revoked → memory leak

  return { isRecording, audioUrl, startRecording, stopRecording };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null); // ✅ Track stream for cleanup
  const chunksRef = useRef([]);

  // ✅ FIX #2: Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // ✅ FIX #1: Stop ALL stream tracks (release mic)
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // ✅ FIX #3: Revoke old blob URL when new one created
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      // Revoke previous URL
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Save reference

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        chunksRef.current = [];

        // ✅ FIX #1: Stop stream tracks after recording
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, audioUrl, startRecording, stopRecording };
}
```

**3 bugs — all about resource cleanup:**

1. `stream.getTracks().forEach(t => t.stop())` — mic indicator stays ON without this
2. Component unmount while recording → mic leak forever → cleanup Effect
3. `URL.createObjectURL` creates blob URL → revoke old ones to prevent memory leak

</details>

### Scenario 34: Dynamic Document Head Manager

```tsx
// TÌM BUG VÀ FIX:
function useDocumentHead({ title, description, favicon }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    return () => {
      document.title = prevTitle; // ← BUG #1: prevTitle stale if nested
    };
  }, [title]);

  useEffect(() => {
    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "description";
      document.head.appendChild(metaTag);
    }
    metaTag.content = description;
    // ← BUG #2: Created meta tag never cleaned up!
  }, [description]);

  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    if (link) {
      link.href = favicon;
    }
    // ← BUG #3: No restoration of original favicon
    // ← BUG #4: What if no existing link[rel="icon"]?
  }, [favicon]);
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useDocumentHead({ title, description, favicon }) {
  // Title management
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    return () => {
      document.title = prevTitle;
    };
    // ✅ FIX #1: prevTitle captured at SETUP time — correct for this Effect
    // Works if: each page component has its own useDocumentHead
    // If nested: last one's cleanup restores its own prevTitle (LIFO order)
  }, [title]);

  // Description management
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="description"]');
    const wasCreated = !metaTag;

    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "description";
      document.head.appendChild(metaTag);
    }

    const prevContent = metaTag.content;
    metaTag.content = description;

    return () => {
      if (wasCreated) {
        metaTag.remove(); // ✅ FIX #2: Remove if we created it
      } else {
        metaTag.content = prevContent; // Restore original
      }
    };
  }, [description]);

  // Favicon management
  useEffect(() => {
    let link = document.querySelector('link[rel="icon"]');
    const wasCreated = !link;

    if (!link) {
      // ✅ FIX #4: Create if doesn't exist
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    const prevHref = link.href;
    link.href = favicon;

    return () => {
      // ✅ FIX #3: Restore original
      if (wasCreated) {
        link.remove();
      } else {
        link.href = prevHref;
      }
    };
  }, [favicon]);
}
```

**4 bugs — DOM cleanup pattern:**

1. `prevTitle` actually works correctly here (captured at setup) but nested usage needs understanding of cleanup order (LIFO)
2. `meta[description]` created but never removed → remove on cleanup if we created it
3. Original favicon not restored → save `prevHref`, restore in cleanup
4. No `link[rel="icon"]` exists → create one, and track `wasCreated` for cleanup

</details>

### Scenario 35: 🏆 Architecture Design Challenge

```
🏆 ARCHITECTURE CHALLENGE:
Design a useCollaboration hook cho real-time collaborative editing.

YÊU CẦU:
- Kết nối WebSocket tới collaboration server
- Nhận cursor positions từ other users (real-time)
- Gửi local cursor position (throttled per 100ms)
- Handle presence (user join/leave)
- Auto-reconnect với exponential backoff
- Cleanup TOÀN BỘ resources on unmount
- Handle offline/online transitions
- TypeScript friendly

VẼ RA KIẾN TRÚC + VIẾT CODE HOÀN CHỈNH:
```

<details>
<summary>💡 Đáp án hoàn chỉnh</summary>

```tsx
// Types
interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

interface PresenceEvent {
  type: "join" | "leave";
  userId: string;
  userName: string;
}

interface CollaborationState {
  status: "connecting" | "connected" | "disconnected" | "reconnecting";
  cursors: Map<string, CursorPosition>;
  activeUsers: Set<string>;
  error: Error | null;
}

// ── Architecture ──
//
// useCollaboration (main hook)
// ├── useEffect #1: WebSocket connection + reconnection
// ├── useEffect #2: Online/offline listener
// ├── useEffect #3: Cursor throttle sender
// └── useEffectEvent: Message handler (no deps)
//
// Ref Pattern:
// - wsRef: WebSocket instance
// - retryRef: retry count
// - cursorRef: local cursor (latest, for throttle send)
// - mountedRef: prevent setState after unmount

function useCollaboration(documentId: string, userId: string) {
  const [state, dispatch] = useReducer(collaborationReducer, {
    status: "disconnected",
    cursors: new Map(),
    activeUsers: new Set(),
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mountedRef = useRef(true);

  // ── Stable message handler ──
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "cursor":
          dispatch({ type: "UPDATE_CURSOR", payload: message });
          break;
        case "join":
          dispatch({ type: "USER_JOINED", payload: message });
          break;
        case "leave":
          dispatch({ type: "USER_LEFT", payload: message.userId });
          break;
        case "sync":
          dispatch({ type: "SYNC_STATE", payload: message });
          break;
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  // ── Effect #1: WebSocket Connection ──
  useEffect(() => {
    mountedRef.current = true;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (!mountedRef.current) return;
      dispatch({ type: "SET_STATUS", payload: "connecting" });

      const ws = new WebSocket(
        `wss://collab.app/docs/${documentId}?userId=${userId}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        retryCountRef.current = 0;
        dispatch({ type: "SET_STATUS", payload: "connected" });
        dispatch({ type: "CLEAR_ERROR" });
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        // onclose will fire after this
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        // Intentional close — don't reconnect
        if (event.code === 1000) {
          dispatch({ type: "SET_STATUS", payload: "disconnected" });
          return;
        }

        // Auto-reconnect with exponential backoff
        const maxRetries = 10;
        if (retryCountRef.current < maxRetries) {
          dispatch({ type: "SET_STATUS", payload: "reconnecting" });
          const delay = Math.min(
            1000 * Math.pow(2, retryCountRef.current) + Math.random() * 500,
            30000,
          );
          retryCountRef.current++;
          reconnectTimer = setTimeout(connect, delay);
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: new Error("Max reconnection attempts reached"),
          });
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on cleanup
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [documentId, userId]);

  // ── Effect #2: Online/Offline ──
  useEffect(() => {
    const handleOnline = () => {
      // Force reconnect
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        retryCountRef.current = 0; // Reset retry count
        wsRef.current?.close(); // Trigger reconnection
      }
    };

    const handleOffline = () => {
      dispatch({ type: "SET_STATUS", payload: "disconnected" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Effect #3: Throttled Cursor Sender ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "cursor",
            ...cursorRef.current,
            timestamp: Date.now(),
          }),
        );
      }
    }, 100); // Throttle: max 10 sends/sec

    return () => clearInterval(interval);
  }, []); // Static — cursor position via ref

  // ── Public API ──
  const updateCursor = useCallback((x: number, y: number) => {
    cursorRef.current = { x, y }; // Just update ref — sent by Effect #3
  }, []);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  return {
    ...state,
    updateCursor,
    sendMessage,
    isConnected: state.status === "connected",
  };
}

// ── Reducer ──
function collaborationReducer(state, action) {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "UPDATE_CURSOR":
      const newCursors = new Map(state.cursors);
      newCursors.set(action.payload.userId, action.payload);
      return { ...state, cursors: newCursors };
    case "USER_JOINED":
      const newUsers = new Set(state.activeUsers);
      newUsers.add(action.payload.userId);
      return { ...state, activeUsers: newUsers };
    case "USER_LEFT":
      const remainingUsers = new Set(state.activeUsers);
      remainingUsers.delete(action.payload);
      const remainingCursors = new Map(state.cursors);
      remainingCursors.delete(action.payload);
      return {
        ...state,
        activeUsers: remainingUsers,
        cursors: remainingCursors,
      };
    case "SYNC_STATE":
      return {
        ...state,
        activeUsers: new Set(action.payload.users),
        cursors: new Map(action.payload.cursors),
      };
    case "SET_ERROR":
      return { ...state, status: "disconnected", error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// ── Usage ──
function CollaborativeEditor({ docId }) {
  const { cursors, activeUsers, isConnected, updateCursor } = useCollaboration(
    docId,
    currentUser.id,
  );

  // Track mouse for cursor sharing
  useEffect(() => {
    const handleMouseMove = (e) => {
      updateCursor(e.clientX, e.clientY);
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [updateCursor]);

  return (
    <div>
      <div>Status: {isConnected ? "🟢" : "🔴"}</div>
      <div>Active users: {activeUsers.size}</div>
      {/* Render remote cursors */}
      {[...cursors.entries()].map(([userId, pos]) => (
        <RemoteCursor key={userId} position={pos} />
      ))}
    </div>
  );
}
```

**ARCHITECTURE SCORING:**

- ✅ Separation of concerns (3 Effects, each with ONE purpose)
- ✅ State machine via useReducer (impossible states impossible)
- ✅ Refs for high-frequency data (cursor, retry count)
- ✅ useEffectEvent for callbacks (no dependency contamination)
- ✅ Proper cleanup chain (WS close, timers, listeners)
- ✅ Exponential backoff + jitter (production-ready reconnection)
- ✅ Online/offline awareness
- ✅ Throttled outbound messages (100ms interval)

**Interview Level:** Staff+ Engineer

</details>

### Scenario 36: Permission-Gated Camera Access

```tsx
// TÌM BUG VÀ FIX:
function CameraPreview({ facingMode, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permission, setPermission] = useState("prompt");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode },
      })
      .then((mediaStream) => {
        setStream(mediaStream);
        videoRef.current.srcObject = mediaStream; // ← BUG #1: ref could be null
        setPermission("granted");
      })
      .catch(() => setPermission("denied"));

    // ← BUG #2: No cleanup — camera stays on!
  }, [facingMode]);
  // ← BUG #3: Switching facingMode doesn't stop previous stream

  const capture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    onCapture(canvas.toDataURL()); // ← BUG #4: onCapture unstable
  };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function CameraPreview({ facingMode, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permission, setPermission] = useState("prompt");

  const handleCapture = useEffectEvent((dataUrl) => {
    onCapture(dataUrl); // ✅ FIX #4: Latest onCapture
  });

  useEffect(() => {
    let currentStream = null;
    let cancelled = false;

    async function startCamera() {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        if (cancelled) {
          // Component unmounted or facingMode changed during await
          currentStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(currentStream);
        if (videoRef.current) {
          // ✅ FIX #1: Null check
          videoRef.current.srcObject = currentStream;
        }
        setPermission("granted");
      } catch {
        if (!cancelled) setPermission("denied");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      // ✅ FIX #2 & #3: Stop ALL tracks on cleanup
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    handleCapture(canvas.toDataURL());
  };

  return (
    <div>
      {permission === "denied" && <p>Camera access denied</p>}
      <video ref={videoRef} autoPlay playsInline muted />
      <button onClick={capture} disabled={!stream}>
        Capture
      </button>
    </div>
  );
}
```

**4 bugs:**

1. `videoRef.current` null khi Effect chạy trước DOM paint → null check
2. Thiếu cleanup → camera LED stays ON after unmount
3. facingMode thay đổi → stream cũ phải `.stop()` trước khi tạo stream mới
4. `onCapture` prop từ parent = new reference → `useEffectEvent`

</details>

### Scenario 37: Web Worker Communication

```tsx
// TÌM BUG VÀ FIX:
function useWorker(workerUrl) {
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const worker = new Worker(workerUrl); // ← BUG #1: New worker EVERY render!

  useEffect(() => {
    worker.onmessage = (e) => {
      setResult(e.data);
      setIsProcessing(false);
    };

    worker.onerror = (e) => {
      console.error("Worker error:", e);
      setIsProcessing(false);
    };

    // ← BUG #2: worker not terminated on cleanup
  }, []); // ← BUG #3: worker created outside Effect = stale reference

  const postMessage = (data) => {
    setIsProcessing(true);
    worker.postMessage(data); // Posts to wrong worker instance
  };

  return { result, isProcessing, postMessage };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useWorker(workerUrl) {
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef(null); // ✅ Stable reference

  useEffect(() => {
    // ✅ FIX #1 & #3: Create worker INSIDE Effect
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      setResult(e.data);
      setIsProcessing(false);
    };

    worker.onerror = (e) => {
      console.error("Worker error:", e);
      setIsProcessing(false);
    };

    return () => {
      worker.terminate(); // ✅ FIX #2: Cleanup
      workerRef.current = null;
    };
  }, [workerUrl]);

  const postMessage = useCallback((data) => {
    if (workerRef.current) {
      setIsProcessing(true);
      workerRef.current.postMessage(data); // ✅ Always correct instance
    }
  }, []);

  return { result, isProcessing, postMessage };
}
```

**3 bugs:**

1. `new Worker()` in component body = new instance every render → create in Effect
2. Worker not terminated → runs forever in background → cleanup `worker.terminate()`
3. Worker var from component body ≠ worker in Effect closure → refs solve this

</details>

### Scenario 38: BroadcastChannel Cross-Tab State

```tsx
// TÌM BUG VÀ FIX:
function useCrossTabState(channelName, key, initialValue) {
  const [value, setValue] = useState(initialValue);

  const channel = new BroadcastChannel(channelName);
  // ← BUG #1: New channel every render!

  useEffect(() => {
    channel.onmessage = (e) => {
      if (e.data.key === key) {
        setValue(e.data.value);
      }
    };
    // ← BUG #2: Missing cleanup — channel not closed
  }, []); // ← BUG #3: key thiếu trong deps

  const updateValue = (newValue) => {
    setValue(newValue);
    channel.postMessage({ key, value: newValue });
    // ← BUG #4: Posts to current-render channel, not the one in Effect
  };

  return [value, updateValue];
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useCrossTabState(channelName, key, initialValue) {
  const [value, setValue] = useState(() => {
    // Restore from sessionStorage
    const saved = sessionStorage.getItem(`${channelName}:${key}`);
    return saved !== null ? JSON.parse(saved) : initialValue;
  });
  const channelRef = useRef(null);

  useEffect(() => {
    // ✅ FIX #1: Create channel INSIDE Effect
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (e) => {
      if (e.data.key === key) {
        setValue(e.data.value);
        sessionStorage.setItem(
          `${channelName}:${key}`,
          JSON.stringify(e.data.value),
        );
      }
    };

    return () => {
      channel.close(); // ✅ FIX #2: Cleanup
      channelRef.current = null;
    };
  }, [channelName, key]); // ✅ FIX #3: key trong deps

  const updateValue = useCallback(
    (newValue) => {
      setValue(newValue);
      sessionStorage.setItem(`${channelName}:${key}`, JSON.stringify(newValue));
      channelRef.current?.postMessage({ key, value: newValue });
      // ✅ FIX #4: Use ref — always correct channel instance
    },
    [channelName, key],
  );

  return [value, updateValue];
}
```

**4 bugs:**

1. `new BroadcastChannel()` mỗi render = resource leak → create in Effect
2. Channel not closed → resource leak + messages still received after unmount
3. `key` thay đổi → listener cần lắng nghe key mới
4. `channel` var from render body ≠ channel in Effect → ref pattern

</details>

### Scenario 39: Portal With Escape Handler

```tsx
// TÌM BUG VÀ FIX:
function Dropdown({ isOpen, onClose, triggerRef, children }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Position relative to trigger
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left });
    // ← BUG #1: Nên dùng useLayoutEffect (flash!)
  }, [isOpen]); // ← BUG #2: triggerRef thiếu (nhưng ref KHÔNG nên là dep)

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (
        !dropdownRef.current.contains(e.target) &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose(); // ← BUG #3: onClose unstable
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]); // ← BUG #4: onClose gây listener re-attach

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose(); // ← BUG #5: same onClose issue
    };
    document.addEventListener("keydown", handleEsc);
    // ← BUG #6: Missing cleanup!
  }, [isOpen]);
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function Dropdown({ isOpen, onClose, triggerRef, children }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  const handleClose = useEffectEvent(() => {
    onClose(); // ✅ FIX #3 & #5: Latest onClose
  });

  // ✅ FIX #1: useLayoutEffect for position (before paint)
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left });
    // ✅ FIX #2: triggerRef.current IS the dep, but refs don't trigger re-render
    // So we depend on isOpen which controls WHEN we need to recalculate
  }, [isOpen]);

  // Click outside + Escape — combined into one Effect
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        handleClose();
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };

    // Delay to avoid immediate close from the click that opened dropdown
    const timer = requestAnimationFrame(() => {
      document.addEventListener("mousedown", handleClick);
    });
    document.addEventListener("keydown", handleEsc);

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
      // ✅ FIX #4 & #6: Proper cleanup for both listeners
    };
  }, [isOpen]); // ✅ Only isOpen — onClose via useEffectEvent

  if (!isOpen) return null;

  return createPortal(
    <div ref={dropdownRef} style={{ position: "fixed", ...position }}>
      {children}
    </div>,
    document.body,
  );
}
```

**6 bugs:**

1. `useEffect` cho positioning → dropdown flickers → `useLayoutEffect`
2. `triggerRef` là ref object (stable) → không nên là dep, `isOpen` đủ
3. `onClose` unstable → `useEffectEvent`
4. `onClose` in deps → listener re-attach mỗi khi parent re-render
5. Same `onClose` issue in escape handler
6. Escape listener thiếu `removeEventListener` → leak

</details>

### Scenario 40: Animation Orchestrator

```tsx
// TÌM BUG VÀ FIX:
function useStaggeredAnimation(items, delayBetween = 100) {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const timers = [];

    items.forEach((item, index) => {
      const timer = setTimeout(() => {
        setVisibleItems((prev) => [...prev, item.id]);
      }, index * delayBetween);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [items, delayBetween]);
  // ← BUG #1: items = array prop = new reference every render
  // ← BUG #2: Khi items thay đổi, visibleItems không reset
  // ← BUG #3: item.id có thể duplicate nếu items thay đổi nhanh
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useStaggeredAnimation(items, delayBetween = 100) {
  const [visibleItems, setVisibleItems] = useState(new Set());

  // Stabilize items reference
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const itemIdsKey = itemIds.join(",");

  useEffect(() => {
    // ✅ FIX #2: Reset on items change
    setVisibleItems(new Set());

    const timers = itemIds.map((id, index) =>
      setTimeout(() => {
        setVisibleItems((prev) => {
          const next = new Set(prev);
          next.add(id); // ✅ FIX #3: Set prevents duplicates
          return next;
        });
      }, index * delayBetween),
    );

    return () => timers.forEach(clearTimeout);
  }, [itemIdsKey, delayBetween]); // ✅ FIX #1: String key instead of array ref

  return {
    isVisible: (id) => visibleItems.has(id),
    allVisible: visibleItems.size === itemIds.length,
  };
}
```

**3 bugs:**

1. `items` array = new ref each render → derive string key for stable dep
2. Items thay đổi nhưng `visibleItems` keeps old IDs → reset to empty Set
3. Rapid item changes → old + new IDs mixed → `Set` prevents duplicates

</details>

### Scenario 41: Data Prefetching Hook

```tsx
// TÌM BUG VÀ FIX:
function usePrefetch(urls) {
  const [cache, setCache] = useState({});
  const [prefetching, setPrefetching] = useState(new Set());

  useEffect(() => {
    urls.forEach((url) => {
      if (cache[url]) return; // ← BUG #1: cache stale
      if (prefetching.has(url)) return; // ← BUG #2: prefetching stale

      setPrefetching((prev) => new Set([...prev, url]));

      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          setCache((prev) => ({ ...prev, [url]: data }));
          setPrefetching((prev) => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        });
    });
    // ← BUG #3: No abort on cleanup
  }, [urls, cache, prefetching]);
  // ← BUG #4: cache + prefetching in deps → infinite loop on each fetch completion!

  return { cache, isPrefetching: prefetching.size > 0 };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function usePrefetch(urls) {
  const [cache, setCache] = useState({});
  const [prefetching, setPrefetching] = useState(new Set());
  const cacheRef = useRef(cache);
  const prefetchingRef = useRef(prefetching);

  // Sync refs
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);
  useEffect(() => {
    prefetchingRef.current = prefetching;
  }, [prefetching]);

  // Stabilize urls
  const urlsKey = useMemo(() => [...urls].sort().join(","), [urls]);

  useEffect(() => {
    const controller = new AbortController(); // ✅ FIX #3

    urls.forEach((url) => {
      // ✅ FIX #1 & #2: Read from refs (latest)
      if (cacheRef.current[url]) return;
      if (prefetchingRef.current.has(url)) return;

      setPrefetching((prev) => new Set([...prev, url]));

      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          setCache((prev) => ({ ...prev, [url]: data }));
          setPrefetching((prev) => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setPrefetching((prev) => {
              const next = new Set(prev);
              next.delete(url);
              return next;
            });
          }
        });
    });

    return () => controller.abort();
  }, [urlsKey]); // ✅ FIX #4: Only re-run when urls actually change

  return { cache, isPrefetching: prefetching.size > 0 };
}
```

**4 bugs:**

1. `cache[url]` stale closure → ref
2. `prefetching.has(url)` stale → ref
3. No abort → cleanup leaves zombie fetches
4. `cache` + `prefetching` as deps → every fetch completion triggers re-fetch → infinite loop!

</details>

### Scenario 42: Error Boundary Recovery Effect

```tsx
// TÌM BUG VÀ FIX:
function useErrorRecovery(error, resetErrorBoundary) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Auto-retry on certain errors
  useEffect(() => {
    if (!error) return;

    if (error.status === 401) {
      // Token expired — refresh and retry
      refreshAuthToken().then(() => {
        resetErrorBoundary(); // ← BUG #1: unstable
      });
    } else if (error.status >= 500 && retryCount < maxRetries) {
      const timer = setTimeout(
        () => {
          setRetryCount(retryCount + 1); // ← BUG #2: stale retryCount
          resetErrorBoundary();
        },
        2000 * Math.pow(2, retryCount),
      ); // ← BUG #3: stale retryCount in delay
      return () => clearTimeout(timer);
    }
  }, [error]); // ← BUG #4: retryCount, resetErrorBoundary missing
  // Nhưng thêm retryCount → mỗi retry trigger lại Effect!

  // Log error to monitoring
  useEffect(() => {
    if (error) {
      reportToSentry(error, { retryCount });
    }
  }, [error]); // ← BUG #5: retryCount thiếu — Sentry always sees retryCount = 0
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useErrorRecovery(error, resetErrorBoundary) {
  const retryCountRef = useRef(0); // ✅ Local to effect lifecycle
  const maxRetries = 3;

  const handleReset = useEffectEvent(() => {
    resetErrorBoundary(); // ✅ FIX #1: Latest resetErrorBoundary
  });

  // Auto-retry on certain errors
  useEffect(() => {
    if (!error) {
      retryCountRef.current = 0; // Reset on success
      return;
    }

    if (error.status === 401) {
      refreshAuthToken()
        .then(() => handleReset())
        .catch(() => {
          // Auth refresh failed — redirect to login
          window.location.href = "/login";
        });
      return;
    }

    if (error.status >= 500 && retryCountRef.current < maxRetries) {
      const currentRetry = retryCountRef.current;
      // ✅ FIX #2 & #3: Read from ref
      const timer = setTimeout(
        () => {
          retryCountRef.current++;
          handleReset();
        },
        2000 * Math.pow(2, currentRetry),
      );

      return () => clearTimeout(timer);
    }
  }, [error]); // ✅ FIX #4: Only error — retryCount via ref, reset via useEffectEvent

  // Log error to monitoring
  useEffect(() => {
    if (error) {
      reportToSentry(error, { retryCount: retryCountRef.current });
      // ✅ FIX #5: Ref has current retry count
    }
  }, [error]);

  return {
    retryCount: retryCountRef.current,
    canRetry: retryCountRef.current < maxRetries,
    manualRetry: () => {
      retryCountRef.current++;
      handleReset();
    },
  };
}
```

**5 bugs → Core pattern: retry count as REF, not STATE:**

1. `resetErrorBoundary` unstable → `useEffectEvent`
2. `retryCount + 1` stale → ref
3. Delay uses stale `retryCount` → ref
4. Adding `retryCount` to deps = each retry triggers Effect = double retry chain
5. Sentry report reads initial retryCount → ref always current

</details>

### Scenario 43: Virtual List With Dynamic Row Heights

```tsx
// TÌM BUG VÀ FIX:
function useVirtualList({ containerRef, items, estimateHeight = 40 }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [measurements, setMeasurements] = useState({});

  // Measure visible items
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const index = entry.target.dataset.index;
        setMeasurements((prev) => ({
          ...prev,
          [index]: entry.contentRect.height,
        })); // ← BUG #1: setState in ResizeObserver callback — batching issues
      });
    });

    // Observe all visible items
    const visibleElements = container.querySelectorAll("[data-index]");
    visibleElements.forEach((el) => observer.observe(el));
    // ← BUG #2: Elements queried once — not updated when scroll changes

    return () => observer.disconnect();
  }, []); // ← BUG #3: items thay đổi → observer cần re-setup

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      let accHeight = 0;
      let start = 0;
      for (let i = 0; i < items.length; i++) {
        const h = measurements[i] || estimateHeight;
        if (accHeight + h >= scrollTop) {
          start = i;
          break;
        }
        accHeight += h;
      }

      let end = start;
      let visHeight = 0;
      for (let i = start; i < items.length; i++) {
        const h = measurements[i] || estimateHeight;
        visHeight += h;
        end = i;
        if (visHeight >= containerHeight + 200) break; // overscan
      }

      setVisibleRange({ start, end: end + 1 });
    };

    container.addEventListener("scroll", handleScroll);
    // ← BUG #4: Missing { passive: true } for scroll performance
    return () => container.removeEventListener("scroll", handleScroll);
  }, [items, measurements, estimateHeight]);
  // ← BUG #5: measurements changes every resize → listener re-attached endlessly
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useVirtualList({ containerRef, items, estimateHeight = 40 }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const measurementsRef = useRef({});
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Measure visible items — single stable observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      let changed = false;
      entries.forEach((entry) => {
        const index = entry.target.dataset.index;
        const newHeight = entry.contentRect.height;
        if (measurementsRef.current[index] !== newHeight) {
          measurementsRef.current[index] = newHeight;
          changed = true;
        }
      });
      // ✅ FIX #1: Batch via ref + single forceUpdate
      if (changed) forceUpdate();
    });

    // ✅ FIX #2: MutationObserver to track DOM changes
    const mutationObserver = new MutationObserver(() => {
      const visibleElements = container.querySelectorAll("[data-index]");
      // Re-observe new elements
      observer.disconnect();
      visibleElements.forEach((el) => observer.observe(el));
    });

    mutationObserver.observe(container, { childList: true, subtree: true });

    // Initial observe
    container
      .querySelectorAll("[data-index]")
      .forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [items.length]); // ✅ FIX #3: Re-setup when item count changes

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const measurements = measurementsRef.current; // ✅ FIX #5: Read from ref

      let accHeight = 0;
      let start = 0;
      for (let i = 0; i < items.length; i++) {
        const h = measurements[i] || estimateHeight;
        if (accHeight + h >= scrollTop) {
          start = i;
          break;
        }
        accHeight += h;
      }

      let end = start;
      let visHeight = 0;
      for (let i = start; i < items.length; i++) {
        const h = measurements[i] || estimateHeight;
        visHeight += h;
        end = i;
        if (visHeight >= containerHeight + 200) break;
      }

      setVisibleRange({ start, end: end + 1 });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // ✅ FIX #4: passive: true
    handleScroll(); // Initial calculation

    return () => container.removeEventListener("scroll", handleScroll);
  }, [items.length, estimateHeight]); // ✅ FIX #5: Stable deps only

  return { visibleRange, measurements: measurementsRef.current };
}
```

**5 bugs:**

1. `setState` per ResizeObserver entry = N re-renders → ref + single `forceUpdate`
2. DOM elements only queried once → MutationObserver tracks changes
3. `items` thay đổi → observer cần re-setup (missing dep)
4. Scroll handler without `passive: true` → jank warning
5. `measurements` object (state) in deps → changes on every resize → ref pattern

</details>

### Scenario 44: Speech Recognition Hook

```tsx
// TÌM BUG VÀ FIX:
function useSpeechRecognition({
  lang = "en-US",
  continuous = false,
  onResult,
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (!isListening) return;

    const recognition = new webkitSpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous; // ← BUG #1: continuous trong deps
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(result);
      if (event.results[0].isFinal) {
        onResult(result); // ← BUG #2: onResult unstable
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // ← BUG #3: Auto-restart logic missing for continuous mode
      setIsListening(false); // Always stops — should restart if continuous
    };

    recognition.start();
    // ← BUG #4: No cleanup — recognition continues after unmount
  }, [isListening, lang, continuous, onResult]);
  // ← BUG #5: onResult + continuous gây restart mỗi khi parent re-render

  return {
    isListening,
    transcript,
    start: () => setIsListening(true),
    stop: () => setIsListening(false),
  };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useSpeechRecognition({
  lang = "en-US",
  continuous = false,
  onResult,
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const handleResult = useEffectEvent((finalTranscript) => {
    onResult(finalTranscript); // ✅ FIX #2: Latest onResult
  });

  // ✅ FIX #5: continuous as ref, not dep
  const continuousRef = useRef(continuous);
  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  useEffect(() => {
    if (!isListening) return;
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window))
      return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = lang;
    recognition.continuous = continuousRef.current;
    recognition.interimResults = true;

    let intentionallyStopped = false;

    recognition.onresult = (event) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(result);
      if (event.results[event.results.length - 1].isFinal) {
        handleResult(result);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("Speech error:", event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // ✅ FIX #3: Restart if continuous and not intentionally stopped
      if (continuousRef.current && !intentionallyStopped) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.start();

    return () => {
      intentionallyStopped = true;
      recognition.abort(); // ✅ FIX #4: Cleanup
      recognitionRef.current = null;
    };
  }, [isListening, lang]); // ✅ Only isListening + lang

  return {
    isListening,
    transcript,
    start: () => {
      setTranscript("");
      setIsListening(true);
    },
    stop: () => {
      recognitionRef.current?.stop();
      setIsListening(false);
    },
  };
}
```

**5 bugs:**

1. `continuous` in deps → ref (nó thay đổi không cần restart recognition)
2. `onResult` unstable → `useEffectEvent`
3. `onend` luôn setIsListening(false) → continuous mode cần restart
4. Thiếu cleanup → recognition chạy sau unmount
5. `onResult` + `continuous` trong deps → restart speech recognition mỗi render

</details>

### Scenario 45: WebRTC Peer Connection

```tsx
// TÌM BUG VÀ FIX:
function useWebRTC({ roomId, localStream, onRemoteStream }) {
  const [connectionState, setConnectionState] = useState("new");

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    }); // ← BUG #1: localStream could be null on first render

    pc.ontrack = (event) => {
      onRemoteStream(event.streams[0]); // ← BUG #2: onRemoteStream unstable
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send({
          type: "candidate",
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    // Listen for signaling messages
    const unsubscribe = signaling.on("message", (msg) => {
      if (msg.roomId !== roomId) return;

      if (msg.type === "offer") {
        pc.setRemoteDescription(msg.offer)
          .then(() => pc.createAnswer())
          .then((answer) => pc.setLocalDescription(answer))
          .then(() =>
            signaling.send({
              type: "answer",
              answer: pc.localDescription,
              roomId,
            }),
          );
      } else if (msg.type === "answer") {
        pc.setRemoteDescription(msg.answer);
      } else if (msg.type === "candidate") {
        pc.addIceCandidate(msg.candidate);
        // ← BUG #3: No error handling — queuing ICE candidates before remote desc
      }
    });
    // ← BUG #4: Signaling listener not cleaned up

    return () => {
      pc.close();
      // ← Missing: unsubscribe()
    };
  }, [roomId, localStream, onRemoteStream]);
  // ← BUG #5: localStream + onRemoteStream force reconnect on every render
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useWebRTC({ roomId, localStream, onRemoteStream }) {
  const [connectionState, setConnectionState] = useState("new");
  const pcRef = useRef(null);

  const handleRemoteStream = useEffectEvent((stream) => {
    onRemoteStream(stream); // ✅ FIX #2
  });

  useEffect(() => {
    // ✅ FIX #1: Guard against null localStream
    if (!localStream) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;
    const pendingCandidates = []; // ✅ FIX #3: Queue candidates

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      handleRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send({
          type: "candidate",
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    const unsubscribe = signaling.on("message", async (msg) => {
      if (msg.roomId !== roomId) return;

      try {
        if (msg.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          // ✅ FIX #3: Flush pending candidates after remote desc is set
          for (const candidate of pendingCandidates) {
            await pc.addIceCandidate(candidate);
          }
          pendingCandidates.length = 0;
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.send({
            type: "answer",
            answer: pc.localDescription,
            roomId,
          });
        } else if (msg.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          for (const candidate of pendingCandidates) {
            await pc.addIceCandidate(candidate);
          }
          pendingCandidates.length = 0;
        } else if (msg.type === "candidate") {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } else {
            pendingCandidates.push(new RTCIceCandidate(msg.candidate));
          }
        }
      } catch (err) {
        console.error("WebRTC signaling error:", err);
      }
    });

    return () => {
      unsubscribe(); // ✅ FIX #4
      pc.close();
      pcRef.current = null;
    };
  }, [roomId, localStream]); // ✅ FIX #5: onRemoteStream via useEffectEvent

  return { connectionState, peerConnection: pcRef.current };
}
```

**5 bugs:**

1. `localStream` null → early return guard
2. `onRemoteStream` unstable → `useEffectEvent`
3. ICE candidates arriving before `setRemoteDescription` → queue + flush pattern
4. Signaling `unsubscribe()` missing in cleanup
5. `onRemoteStream` in deps → useEffectEvent removes it from deps

</details>

### Scenario 46: IndexedDB Persistence Hook

```tsx
// TÌM BUG VÀ FIX:
function useIndexedDB(dbName, storeName, key) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);

      getReq.onsuccess = () => {
        setData(getReq.result);
        setIsLoading(false);
      };
      // ← BUG #1: db connection never closed!
    };

    request.onerror = () => setIsLoading(false);
    // ← BUG #2: No cleanup — what if key or dbName changes mid-flight?
  }, [dbName, storeName, key]);

  // Save data
  const save = (newData) => {
    setData(newData);

    const request = indexedDB.open(dbName, 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(newData, key);
      // ← BUG #3: Opening a NEW connection for every save!
    };
  };
  // ← BUG #4: save function recreated every render — unstable ref

  return { data, isLoading, save };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useIndexedDB(dbName, storeName, key) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dbRef = useRef(null); // ✅ FIX #3: Reuse connection

  useEffect(() => {
    let cancelled = false;
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = (e) => {
      const db = e.target.result;
      dbRef.current = db; // ✅ Store connection for reuse

      if (cancelled) {
        db.close();
        return;
      }

      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);

      getReq.onsuccess = () => {
        if (!cancelled) {
          setData(getReq.result ?? null);
          setIsLoading(false);
        }
      };

      getReq.onerror = () => {
        if (!cancelled) setIsLoading(false);
      };
    };

    request.onerror = () => {
      if (!cancelled) setIsLoading(false);
    };

    return () => {
      cancelled = true; // ✅ FIX #2: Cancel flag
      if (dbRef.current) {
        dbRef.current.close(); // ✅ FIX #1: Close connection on cleanup
        dbRef.current = null;
      }
    };
  }, [dbName, storeName, key]);

  // ✅ FIX #4: Stable save function via useCallback + ref
  const save = useCallback(
    (newData) => {
      setData(newData);

      const db = dbRef.current;
      if (!db) return;

      try {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(newData, key);
      } catch (err) {
        // DB may have been closed — reopen
        console.warn("IndexedDB write failed, reopening:", err);
      }
    },
    [storeName, key],
  );

  const remove = useCallback(() => {
    setData(null);
    const db = dbRef.current;
    if (!db) return;
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
  }, [storeName, key]);

  return { data, isLoading, save, remove };
}
```

**4 bugs:**

1. DB connection never closed → `db.close()` in cleanup
2. Key/dbName change mid-flight → `cancelled` flag prevents stale writes
3. New `indexedDB.open()` for every save → reuse connection via `dbRef`
4. `save` recreated every render → `useCallback` with stable deps

</details>

### Scenario 47: Notification Queue Orchestrator

```tsx
// TÌM BUG VÀ FIX:
function useNotificationQueue({ maxVisible = 3, duration = 5000 }) {
  const [notifications, setNotifications] = useState([]);

  // Auto-dismiss after duration
  useEffect(() => {
    if (notifications.length === 0) return;

    const oldest = notifications[0];
    const timer = setTimeout(() => {
      setNotifications(notifications.filter((n) => n.id !== oldest.id));
      // ← BUG #1: stale notifications reference
    }, duration);

    return () => clearTimeout(timer);
  }, [notifications]); // ← BUG #2: notifications changes → timer resets every add!
  // Old notifications NEVER get dismissed because timer keeps resetting

  // Entrance animation tracking
  useEffect(() => {
    notifications.forEach((n) => {
      if (!n.animated) {
        n.animated = true; // ← BUG #3: Direct state mutation!
      }
    });
  }, [notifications]);

  const add = (notification) => {
    const id = Date.now();
    setNotifications((prev) => [
      ...prev.slice(-(maxVisible - 1)), // Keep only last N-1
      { ...notification, id, createdAt: Date.now() },
    ]);
  };

  const dismiss = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    // ← BUG #4: stale closure
  };

  return { notifications, add, dismiss };
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useNotificationQueue({ maxVisible = 3, duration = 5000 }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());

  // Auto-dismiss: set timer for each notification individually
  useEffect(() => {
    notifications.forEach((n) => {
      if (timersRef.current.has(n.id)) return; // Already has timer

      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== n.id));
        // ✅ FIX #1: Updater function — always latest state
        timersRef.current.delete(n.id);
      }, duration);

      timersRef.current.set(n.id, timer);
    });

    // Clean up timers for removed notifications
    // ✅ FIX #2: Individual timers — adding new ones doesn't reset existing
    const currentIds = new Set(notifications.map((n) => n.id));
    for (const [id, timer] of timersRef.current) {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }
  }, [notifications, duration]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const add = useCallback(
    (notification) => {
      const id = crypto.randomUUID();
      setNotifications((prev) => {
        const next = [
          ...prev,
          { ...notification, id, createdAt: Date.now(), animated: false },
        ];
        return next.slice(-maxVisible);
      });
    },
    [maxVisible],
  );

  // ✅ FIX #3: Animation tracking without mutation
  const markAnimated = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, animated: true } : n)),
    );
  }, []);

  // ✅ FIX #4: Updater function
  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
  }, []);

  return { notifications, add, dismiss, markAnimated };
}
```

**4 bugs:**

1. `notifications.filter(...)` captures stale state → updater function
2. Single timer for `notifications[0]` resets every time array changes → per-notification timer map
3. `n.animated = true` = direct mutation → immutable update via `markAnimated`
4. `dismiss` reads stale `notifications` → updater function

</details>

### Scenario 48: Theme-Aware CSS Custom Properties

```tsx
// TÌM BUG VÀ FIX:
function useThemeTokens(theme) {
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(theme.typography).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });
    // ← BUG #1: useEffect → flash of unstyled content (FOUC)
    // ← BUG #2: Old properties not removed when theme changes!
  }, [theme]); // ← BUG #3: theme = object → new ref every render!
}

// Usage:
function App() {
  const [mode, setMode] = useState("light");
  const theme = {
    colors:
      mode === "dark"
        ? { bg: "#1a1a1a", text: "#fff", accent: "#6366f1" }
        : { bg: "#fff", text: "#1a1a1a", accent: "#4f46e5" },
    spacing: { sm: "8px", md: "16px", lg: "24px" },
    typography: { body: "16px", heading: "24px" },
  };
  // ← BUG #4: theme CREATED in render → always new reference!

  useThemeTokens(theme);
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function useThemeTokens(theme) {
  const prevPropsRef = useRef(new Set());

  // ✅ FIX #1: useLayoutEffect — apply BEFORE paint
  useLayoutEffect(() => {
    const root = document.documentElement;
    const currentProps = new Set();

    const applyTokens = (prefix, tokens) => {
      Object.entries(tokens).forEach(([key, value]) => {
        const prop = `--${prefix}-${key}`;
        root.style.setProperty(prop, value);
        currentProps.add(prop);
      });
    };

    applyTokens("color", theme.colors);
    applyTokens("spacing", theme.spacing);
    applyTokens("font", theme.typography);

    // ✅ FIX #2: Remove old properties not in new theme
    for (const prop of prevPropsRef.current) {
      if (!currentProps.has(prop)) {
        root.style.removeProperty(prop);
      }
    }
    prevPropsRef.current = currentProps;

    return () => {
      // Clean all on unmount
      currentProps.forEach((prop) => root.style.removeProperty(prop));
    };
  }, [theme.colors, theme.spacing, theme.typography]);
  // ✅ FIX #3: Destructure — primitives or stable sub-objects
}

// ✅ FIX #4: Memoize theme object
function App() {
  const [mode, setMode] = useState("light");

  const theme = useMemo(
    () => ({
      colors:
        mode === "dark"
          ? { bg: "#1a1a1a", text: "#fff", accent: "#6366f1" }
          : { bg: "#fff", text: "#1a1a1a", accent: "#4f46e5" },
      spacing: { sm: "8px", md: "16px", lg: "24px" },
      typography: { body: "16px", heading: "24px" },
    }),
    [mode],
  ); // Only recreate when mode changes

  useThemeTokens(theme);
}
```

**4 bugs:**

1. `useEffect` → DOM changes visible after paint (FOUC) → `useLayoutEffect`
2. Theme change chỉ thêm mới, không xóa cũ → track + `removeProperty`
3. `theme` object = new ref mỗi render → destructure hoặc `useMemo`
4. Theme created inline in render → `useMemo` keyed on `mode`

</details>

### Scenario 49: Server-Sent Events With Cursor Presence

```tsx
// TÌM BUG VÀ FIX:
function usePresence({ docId, userId, onCursorUpdate }) {
  const [users, setUsers] = useState([]);
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0 });

  // SSE for receiving other cursors
  useEffect(() => {
    const eventSource = new EventSource(`/api/presence/${docId}`);

    eventSource.addEventListener("cursor", (e) => {
      const data = JSON.parse(e.data);
      setUsers((prev) => {
        const existing = prev.findIndex((u) => u.id === data.userId);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { ...next[existing], ...data };
          return next;
        }
        return [...prev, data];
      });
    });

    eventSource.addEventListener("leave", (e) => {
      const data = JSON.parse(e.data);
      setUsers(users.filter((u) => u.id !== data.userId));
      // ← BUG #1: stale users closure
    });

    eventSource.onerror = () => {
      eventSource.close();
      // ← BUG #2: No reconnect logic
    };

    // ← BUG #3: Missing cleanup — eventSource.close()
  }, [docId]);

  // Send my cursor position
  useEffect(() => {
    const handleMouseMove = (e) => {
      const position = { x: e.clientX, y: e.clientY };
      setMyPosition(position);

      fetch(`/api/presence/${docId}/cursor`, {
        method: "POST",
        body: JSON.stringify({ userId, ...position }),
      });
      // ← BUG #4: Fires on EVERY mousemove — floods server
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [docId, userId]);

  // Notify parent of cursor updates
  useEffect(() => {
    onCursorUpdate(users); // ← BUG #5: onCursorUpdate unstable
  }, [users, onCursorUpdate]);
  // ← BUG #6: onCursorUpdate changes → runs Effect unnecessarily
}
```

<details>
<summary>💡 Đáp án</summary>

```tsx
function usePresence({ docId, userId, onCursorUpdate }) {
  const [users, setUsers] = useState([]);
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0 });

  const handleCursorUpdate = useEffectEvent((currentUsers) => {
    onCursorUpdate(currentUsers); // ✅ FIX #5 & #6
  });

  // SSE for receiving cursors
  useEffect(() => {
    let eventSource;
    let reconnectTimer;
    let reconnectDelay = 1000;

    function connect() {
      eventSource = new EventSource(`/api/presence/${docId}`);

      eventSource.addEventListener("cursor", (e) => {
        const data = JSON.parse(e.data);
        setUsers((prev) => {
          const existing = prev.findIndex((u) => u.id === data.userId);
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = { ...next[existing], ...data };
            return next;
          }
          return [...prev, data];
        });
      });

      eventSource.addEventListener("leave", (e) => {
        const data = JSON.parse(e.data);
        setUsers((prev) => prev.filter((u) => u.id !== data.userId));
        // ✅ FIX #1: Updater function
      });

      eventSource.onerror = () => {
        eventSource.close();
        // ✅ FIX #2: Reconnect with backoff
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000);
          connect();
        }, reconnectDelay);
      };

      eventSource.onopen = () => {
        reconnectDelay = 1000; // Reset on successful connect
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close(); // ✅ FIX #3
    };
  }, [docId]);

  // Send cursor position — throttled
  useEffect(() => {
    let lastSent = 0;
    let rafId;

    const handleMouseMove = (e) => {
      const position = { x: e.clientX, y: e.clientY };
      setMyPosition(position);

      // ✅ FIX #4: Throttle to 50ms
      const now = Date.now();
      if (now - lastSent < 50) return;
      lastSent = now;

      // Use rAF to batch with paint
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        fetch(`/api/presence/${docId}/cursor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...position }),
          keepalive: true,
        }).catch(() => {}); // Ignore send errors
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [docId, userId]);

  // Notify parent — via useEffectEvent (no separate Effect needed)
  useEffect(() => {
    handleCursorUpdate(users);
  }, [users]);

  return { users, myPosition };
}
```

**6 bugs:**

1. `users.filter(...)` stale closure → updater function
2. `eventSource.close()` without reconnect → backoff reconnection
3. Missing cleanup → `eventSource.close()` in cleanup
4. Every `mousemove` → fetch → throttle (50ms interval + rAF)
5. `onCursorUpdate` unstable → `useEffectEvent`
6. `onCursorUpdate` in deps → Effect runs on every parent re-render

</details>

### Scenario 50: 🏆🏆 Ultimate Mega Challenge — Real-time Analytics Dashboard

```tsx
// TÌM TẤT CẢ BUGS (10+) VÀ VIẾT LẠI HOÀN CHỈNH:
function AnalyticsDashboard({ dashboardId, timeRange, filters, onDataUpdate }) {
  const [metrics, setMetrics] = useState({});
  const [charts, setCharts] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetch(`/api/dashboards/${dashboardId}?range=${timeRange}&filters=${JSON.stringify(filters)}`)
    // ← BUG #1: filters = object → serialized in URL but new ref every render
    // ← BUG #2: No AbortController
      .then(r => r.json())
      .then(data => {
        setMetrics(data.metrics);
        setCharts(data.charts);
        onDataUpdate(data); // ← BUG #3: onDataUpdate unstable
      })
      .catch(err => setError(err));
  }, [dashboardId, timeRange, filters, onDataUpdate]);
  // ← BUG #4: filters + onDataUpdate = infinite re-fetch

  // Auto-refresh when live mode
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      // Re-fetch data
      fetch(`/api/dashboards/${dashboardId}?range=${timeRange}`)
        .then(r => r.json())
        .then(data => {
          setMetrics(data.metrics);
          setCharts(data.charts);
        });
      // ← BUG #5: No abort for interval fetches
      // ← BUG #6: Stale dashboardId + timeRange in closure
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [isLive]); // ← BUG #7: refreshInterval, dashboardId, timeRange missing

  // WebSocket for real-time metric updates
  useEffect(() => {
    if (!isLive) return;

    const ws = new WebSocket(`wss://analytics.app/live/${dashboardId}`);

    ws.onmessage = (e) => {
      const update = JSON.parse(e.data);
      setMetrics({ ...metrics, [update.key]: update.value });
      // ← BUG #8: stale metrics closure
    };

    ws.onclose = () => setIsLive(false);
    // ← BUG #9: No reconnect logic

    return () => ws.close();
  }, [isLive, dashboardId]);

  // Track selected metric drill-down
  useEffect(() => {
    if (!selectedMetric) return;

    fetch(`/api/metrics/${selectedMetric}/details`)
      .then(r => r.json())
      .then(details => {
        // Update the specific chart with drill-down data
        const chartIndex = charts.findIndex(c => c.metricId === selectedMetric);
        // ← BUG #10: stale charts closure
        if (chartIndex >= 0) {
          charts[chartIndex].drillDown = details;
          setCharts([...charts]); // ← BUG #11: Mutation then spread!
        }
      });
    // ← BUG #12: No abort + no loading state
  }, [selectedMetric]);

  // Save user preferences
  useEffect(() => {
    localStorage.setItem('dashboard-prefs', JSON.stringify({
      refreshInterval, isLive, timeRange
    }));
  }, [refreshInterval, isLive, timeRange]);
  // ✅ This one is correct — but should it be an Effect?
  // ← BUG #13: Preference saving = event response, not synchronization

  return (/* ... */);
}
```

<details>
<summary>💡 Đáp án — Production-Ready Architecture</summary>

```tsx
// ── Types ──
interface DashboardData {
  metrics: Record<string, MetricValue>;
  charts: ChartConfig[];
}

type DashboardState = {
  data: DashboardData | null;
  drillDown: Record<string, any>;
  isLive: boolean;
  refreshInterval: number;
  error: Error | null;
  isLoading: boolean;
};

type DashboardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: DashboardData }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "LIVE_UPDATE"; payload: { key: string; value: MetricValue } }
  | { type: "SET_DRILLDOWN"; payload: { metricId: string; details: any } }
  | { type: "TOGGLE_LIVE"; payload: boolean }
  | { type: "SET_INTERVAL"; payload: number };

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction,
): DashboardState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, data: action.payload };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "LIVE_UPDATE":
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          metrics: {
            ...state.data.metrics,
            [action.payload.key]: action.payload.value,
          },
        },
      };
    case "SET_DRILLDOWN":
      return {
        ...state,
        drillDown: {
          ...state.drillDown,
          [action.payload.metricId]: action.payload.details,
        },
      };
    case "TOGGLE_LIVE":
      return { ...state, isLive: action.payload };
    case "SET_INTERVAL":
      return { ...state, refreshInterval: action.payload };
    default:
      return state;
  }
}

// ── Hook ──
function useAnalyticsDashboard({
  dashboardId,
  timeRange,
  filters,
  onDataUpdate,
}) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    data: null,
    drillDown: {},
    isLive: false,
    refreshInterval: 30000,
    error: null,
    isLoading: false,
  });

  // ✅ FIX #1: Stabilize filters
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // ✅ FIX #3: useEffectEvent for callback
  const handleDataUpdate = useEffectEvent((data) => {
    onDataUpdate(data);
  });

  // ── Effect 1: Fetch dashboard data ──
  useEffect(() => {
    const controller = new AbortController(); // ✅ FIX #2
    dispatch({ type: "FETCH_START" });

    fetch(
      `/api/dashboards/${dashboardId}?range=${timeRange}&filters=${filtersKey}`,
      {
        signal: controller.signal,
      },
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        dispatch({ type: "FETCH_SUCCESS", payload: data });
        handleDataUpdate(data); // ✅ FIX #3
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          dispatch({ type: "FETCH_ERROR", payload: err });
        }
      });

    return () => controller.abort();
  }, [dashboardId, timeRange, filtersKey]); // ✅ FIX #4: Stable deps only

  // ── Effect 2: Auto-refresh (polling) ──
  useEffect(() => {
    if (!state.isLive) return;

    const timer = setInterval(() => {
      const controller = new AbortController(); // ✅ FIX #5
      // ✅ FIX #6: dashboardId + timeRange are in closure via deps
      fetch(
        `/api/dashboards/${dashboardId}?range=${timeRange}&filters=${filtersKey}`,
        {
          signal: controller.signal,
        },
      )
        .then((r) => r.json())
        .then((data) => {
          dispatch({ type: "FETCH_SUCCESS", payload: data });
          handleDataUpdate(data);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            dispatch({ type: "FETCH_ERROR", payload: err });
          }
        });
    }, state.refreshInterval);
    // ✅ FIX #7: All deps included

    return () => clearInterval(timer);
  }, [state.isLive, state.refreshInterval, dashboardId, timeRange, filtersKey]);

  // ── Effect 3: WebSocket for real-time updates ──
  useEffect(() => {
    if (!state.isLive) return;

    let ws;
    let reconnectTimer;
    let reconnectDelay = 1000;

    function connect() {
      ws = new WebSocket(`wss://analytics.app/live/${dashboardId}`);

      ws.onmessage = (e) => {
        const update = JSON.parse(e.data);
        // ✅ FIX #8: dispatch — no stale closure issue
        dispatch({ type: "LIVE_UPDATE", payload: update });
      };

      ws.onclose = (e) => {
        // ✅ FIX #9: Reconnect with backoff
        if (e.code !== 1000) {
          // Not intentional close
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connect();
          }, reconnectDelay);
        }
      };

      ws.onopen = () => {
        reconnectDelay = 1000;
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close(1000, "Component unmount");
    };
  }, [state.isLive, dashboardId]);

  // ── Drill-down: Event handler, NOT Effect ──
  // ✅ FIX #10 & #11 & #12: Convert to event handler with proper state update
  const drillDown = useCallback(async (metricId) => {
    const controller = new AbortController();
    try {
      const r = await fetch(`/api/metrics/${metricId}/details`, {
        signal: controller.signal,
      });
      const details = await r.json();
      // ✅ Immutable update via dispatch
      dispatch({ type: "SET_DRILLDOWN", payload: { metricId, details } });
    } catch (err) {
      if (err.name !== "AbortError") console.error("Drill-down failed:", err);
    }
  }, []);

  // ✅ FIX #13: Preference saving as event handler
  const savePreferences = useCallback(() => {
    localStorage.setItem(
      "dashboard-prefs",
      JSON.stringify({
        refreshInterval: state.refreshInterval,
        isLive: state.isLive,
      }),
    );
  }, [state.refreshInterval, state.isLive]);

  return {
    ...state,
    drillDown,
    toggleLive: (live) => {
      dispatch({ type: "TOGGLE_LIVE", payload: live });
      savePreferences();
    },
    setRefreshInterval: (interval) => {
      dispatch({ type: "SET_INTERVAL", payload: interval });
      savePreferences();
    },
  };
}
```

**🏆 13 BUGS — ALL PATTERNS COMBINED:**

| #   | Bug                              | Pattern                   | Fix                          |
| --- | -------------------------------- | ------------------------- | ---------------------------- |
| 1   | `filters` object = new ref       | Object dependency         | `JSON.stringify` + `useMemo` |
| 2   | No AbortController               | Cleanup                   | `AbortController` in Effect  |
| 3   | `onDataUpdate` unstable          | Callback dependency       | `useEffectEvent`             |
| 4   | `filters + onDataUpdate` in deps | Infinite loop             | Stabilize + remove           |
| 5   | Interval fetch no abort          | Cleanup in setInterval    | Local `AbortController`      |
| 6   | Stale `dashboardId/timeRange`    | Stale closure in interval | Include in deps              |
| 7   | Missing deps in interval Effect  | Missing dependencies      | Add all deps                 |
| 8   | `{ ...metrics, ... }` stale      | Stale closure             | `dispatch` (never stale)     |
| 9   | WS close without reconnect       | Resilience                | Backoff reconnect            |
| 10  | Stale `charts.findIndex`         | Stale closure             | `dispatch` to reducer        |
| 11  | `charts[i].drillDown = x`        | State mutation            | Immutable via reducer        |
| 12  | Drill-down has no abort          | Effect vs Event handler   | Convert to handler           |
| 13  | Preferences in Effect            | Event response            | `savePreferences()` handler  |

**ARCHITECTURE SCORING:**

- ✅ `useReducer` — all state transitions centralized (impossible states impossible)
- ✅ 3 Effects, each with ONE synchronization purpose
- ✅ Event handlers for user-initiated actions (drill-down, preferences)
- ✅ `useEffectEvent` for parent callbacks
- ✅ `AbortController` on all fetches
- ✅ WebSocket with backoff reconnect
- ✅ Stable deps via `useMemo`/`JSON.stringify`

**Interview Level:** Staff+ / Principal Engineer

</details>

---

## RECAP — TÓM TẮT TOÀN BỘ

```
10 NGUYÊN TẮC VÀNG VỀ EFFECT DEPENDENCIES:

1. Dependencies PHẢN ÁNH code — KHÔNG PHẢI ngược lại
2. Muốn thay đổi dependencies → thay đổi CODE trước
3. KHÔNG BAO GIỜ suppress linter — luôn có cách tốt hơn
4. Muốn xóa dependency → "CHỨNG MINH" nó không reactive
5. State chỉ để tính state tiếp → UPDATER FUNCTION
6. Đọc nhưng không react → useEffectEvent
7. Object/function dependency → di chuyển vào/ra hoặc destructure
8. Event-specific logic → EVENT HANDLER, không phải Effect
9. Unrelated logic → TÁCH thành nhiều Effects
10. Mỗi Effect = MỘT mục đích đồng bộ hóa
```
