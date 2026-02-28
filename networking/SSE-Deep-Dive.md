# Server-Sent Events (SSE) — Deep Dive

> 📅 2026-02-13 · ⏱ 15 phút đọc
>
> SSE Protocol, EventSource API, Event Stream Format,
> Reconnection & Last-Event-ID, Custom Events, Server Implementation (Node.js / NestJS / PHP)
> So sánh SSE vs WebSocket vs Long Polling vs Short Polling
> Độ khó: ⭐️⭐️⭐️ | Real-time Communication Interview

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | SSE là gì? Bản chất & Cơ chế                         |
| 2   | Đặc điểm SSE — So sánh với WebSocket                 |
| 3   | Client API — EventSource chi tiết                    |
| 4   | Event Stream Format — 4 Fields                       |
| 5   | Server Implementation — Node.js / PHP / NestJS       |
| 6   | Ví dụ đầy đủ: Like Counter Realtime (React + NestJS) |
| 7   | Reconnection & Last-Event-ID — Cơ chế đồng bộ        |
| 8   | SSE vs WebSocket vs Polling — Khi nào dùng gì?       |
| 9   | Kỹ thuật nâng cao & Lưu ý thực tế                    |
| 10  | Tổng kết & Checklist phỏng vấn                       |

---

## §1. SSE là gì? Bản chất & Cơ chế

```
SERVER-SENT EVENTS — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  SSE = Server-Sent Events
  → Công nghệ SERVER ĐẨY dữ liệu xuống CLIENT!
  → Qua kết nối HTTP thông thường (KHÔNG cần protocol riêng!)
  → Client TỰ ĐỘNG nhận updates — KHÔNG cần request lại!

  ┌──────────┐   HTTP Request (1 lần!)    ┌──────────┐
  │  Client  │  ────────────────────────→  │  Server  │
  │ (Browser)│                             │          │
  │          │  ← ─ ─ ─ data stream ─ ─   │          │
  │          │  ← event 1                  │  open    │
  │          │  ← event 2                  │  HTTP    │
  │          │  ← event 3                  │  conn    │
  │          │  ← ...                      │          │
  └──────────┘  (kết nối giữ mở!)         └──────────┘

  → 1 HTTP request → server GIỮ kết nối mở
  → Server gửi data DẦN DẦN (streaming!)
  → Client KHÔNG thể gửi thêm data qua kết nối này!
    (gửi thêm = tạo kết nối HTTP MỚI!)

  ⚠️ MỘT CHIỀU: Server → Client ONLY!
  (Khác WebSocket: hai chiều!)
```

```
BẢN CHẤT CỦA SSE:
═══════════════════════════════════════════════════════════════

  HTTP protocol KHÔNG CHO PHÉP server chủ động push!
  → SSE dùng MẸO: server khai báo sẽ gửi streaming data!
  → Thay vì gửi 1 data packet xong đóng → gửi data stream liên tục!
  → Client KHÔNG đóng kết nối mà CHỜ data mới từ server!
  → Video streaming cũng là ví dụ tương tự!

  → Bản chất: HOÀN THÀNH 1 QUÁ TRÌNH DOWNLOAD DÀI HẠN
    bằng cách sử dụng streaming information!

  → Mỗi notification = 1 đoạn text stream (UTF-8!)
  → Kết thúc bằng CẶP ký tự newline (\n\n)

  BROWSER SUPPORT:
  → Tất cả browsers hiện đại đều hỗ trợ!
  → ❌ IE/Edge cũ KHÔNG hỗ trợ! (cần polyfill!)
  → Kiểm tra:
    if ('EventSource' in window) {
        // SSE được hỗ trợ!
    }
```

---

## §2. Đặc điểm SSE — So sánh với WebSocket

```
SSE vs WEBSOCKET — SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  SSE và WebSocket phục vụ MỤC ĐÍCH TƯƠNG TỰ:
  → Thiết lập kênh giao tiếp browser ↔ server
  → Server push data xuống browser!

  NHƯNG có sự khác biệt quan trọng:

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí        │ SSE              │ WebSocket             │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Hướng giao tiếp │ MỘT chiều        │ HAI chiều (full-duplex)│
  │                 │ Server → Client  │ Server ↔ Client       │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Protocol        │ HTTP (!)         │ ws:// hoặc wss://     │
  │                 │ Dùng luôn HTTP   │ Protocol RIÊNG!       │
  │                 │ Server có sẵn!   │ Cần WS server riêng!  │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Dữ liệu        │ Text only (UTF-8)│ Text + Binary!        │
  │                 │ Binary→ encode!  │ ArrayBuffer, Blob!    │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Reconnect       │ TỰ ĐỘNG! ✅      │ PHẢI tự implement!   │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Độ phức tạp     │ ĐƠN GIẢN!       │ Phức tạp hơn!        │
  │                 │ Vài dòng code!   │ Upgrade, handshake!  │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Custom events   │ CÓ! ✅ Built-in  │ Phải tự implement!   │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Proxy/Firewall  │ Hoạt động! ✅     │ CÓ THỂ bị block!    │
  │                 │ (HTTP thường!)   │ (Protocol lạ!)       │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Browser support │ Tất cả trừ IE!  │ Tất cả! ✅             │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Use case        │ Notifications,   │ Chat, gaming,         │
  │                 │ feeds, dashboards│ collaborative edit    │
  └─────────────────┴──────────────────┴──────────────────────┘

  TÓM TẮT:
  → WebSocket: MẠNH hơn + linh hoạt hơn (full-duplex!)
  → SSE: ĐƠN GIẢN hơn + dùng HTTP có sẵn + auto-reconnect!
  → Mỗi cái phù hợp tình huống khác nhau!
```

---

## §3. Client API — EventSource chi tiết

```javascript
// ═══ EVENTSOURCE — TẠO KẾT NỐI ═══

// ① Cùng origin:
const evtSource = new EventSource("sse-demo.php");

// ② Cross-origin (cần CORS + cookies):
const evtSource = new EventSource("//api.example.com/sse", {
  withCredentials: true, // Gửi cookies cross-origin!
});

// ③ Kiểm tra browser support:
if ("EventSource" in window) {
  // SSE được hỗ trợ!
} else {
  // Dùng polyfill hoặc fallback!
}
```

```javascript
// ═══ READYSTATE PROPERTY ═══
// (Read-only — trạng thái kết nối hiện tại)

evtSource.readyState;

// Giá trị:
// 0 = EventSource.CONNECTING → Đang kết nối / reconnecting!
// 1 = EventSource.OPEN       → Đã kết nối, nhận data!
// 2 = EventSource.CLOSED     → Đã đóng, KHÔNG reconnect!
```

```javascript
// ═══ 3 EVENTS CƠ BẢN ═══

// ① OPEN — Kết nối thành công:
evtSource.onopen = function (event) {
  console.log("✅ SSE connected!");
};
// Hoặc:
evtSource.addEventListener(
  "open",
  function (event) {
    // ...
  },
  false,
);

// ② MESSAGE — Nhận data (event MẶC ĐỊNH "message"):
evtSource.onmessage = function (event) {
  const data = event.data; // ← String! Dữ liệu text từ server!
  console.log(data);

  // Thường là JSON string → parse:
  const parsed = JSON.parse(event.data);
};
// Hoặc:
evtSource.addEventListener(
  "message",
  function (event) {
    // → CHỈ nhận messages KHÔNG CÓ event field!
    // → Messages CÓ event field → phải listen tên riêng!
    const newElement = document.createElement("li");
    newElement.textContent = `message: ${event.data}`;
    document.getElementById("list").appendChild(newElement);
  },
  false,
);

// ③ ERROR — Lỗi kết nối (CORS, timeout, network...):
evtSource.onerror = function (err) {
  console.error("EventSource failed:", err);
  // Browser sẽ TỰ ĐỘNG reconnect!
  // (trừ khi server trả status khác 200 hoặc close() đã gọi!)
};
// Hoặc:
evtSource.addEventListener(
  "error",
  function (event) {
    // handle error
  },
  false,
);
```

```javascript
// ═══ CUSTOM EVENTS — TÙY CHỈNH TÊN EVENT ═══

// Server gửi: event: ping\n data: {...}\n\n
// → KHÔNG trigger "message" event!
// → PHẢI listen "ping" event riêng!

evtSource.addEventListener("ping", function (event) {
  const time = JSON.parse(event.data).time;
  console.log(`ping at ${time}`);
});

// Server gửi: event: addLikeCount\n data: {...}\n\n
evtSource.addEventListener("addLikeCount", function (event) {
  const data = JSON.parse(event.data);
  console.log("Like:", data.payload.likeCount);
});

// Server gửi: event: userconnect\n data: {...}\n\n
evtSource.addEventListener("userconnect", function (event) {
  const { username, time } = JSON.parse(event.data);
  console.log(`${username} connected at ${time}`);
});

// ⚠️ QUY TẮC:
// → Message KHÔNG CÓ event field → trigger "message" event (onmessage)
// → Message CÓ event field → trigger event CÙNG TÊN → dùng addEventListener!
// → onmessage KHÔNG nhận custom events!
```

```javascript
// ═══ ĐÓNG KẾT NỐI ═══

evtSource.close();
// → readyState = 2 (CLOSED)
// → Browser KHÔNG reconnect nữa!
// → Mặc định: nếu connection bị mất → browser TỰ ĐỘNG reconnect!
// → close() = CHỦ ĐỘNG đóng → KHÔNG reconnect!
```

---

## §4. Event Stream Format — 4 Fields

```
EVENT STREAM FORMAT — QUY TẮC:
═══════════════════════════════════════════════════════════════

  ① RESPONSE HEADERS BẮT BUỘC:
  ┌────────────────────────────────────────────────────┐
  │ Content-Type: text/event-stream   ← BẮT BUỘC!     │
  │ Cache-Control: no-cache           ← KHÔNG cache!   │
  │ Connection: keep-alive            ← Giữ kết nối!   │
  └────────────────────────────────────────────────────┘

  ② DATA ENCODING: UTF-8 text ONLY!

  ③ MỖI MESSAGE: gồm nhiều FIELDS (1 field/dòng)
     → Format: [field]: value\n
     → Kết thúc message = DÒNG TRỐNG (\n\n)

  ④ 4 FIELDS ĐƯỢC HỖ TRỢ:
  ┌─────────┬───────────────────────────────────────────────────┐
  │ Field   │ Ý nghĩa                                           │
  ├─────────┼───────────────────────────────────────────────────┤
  │ data:   │ Payload chính! Nếu NHIỀU DÒNG data liên tiếp:    │
  │         │ → browser NỐI bằng \n thành 1 string!             │
  │         │ → Trailing newlines bị XÓA!                        │
  ├─────────┼───────────────────────────────────────────────────┤
  │ event:  │ Tên event TÙY CHỈNH! Mặc định = "message"        │
  │         │ → Dùng addEventListener("tên") để listen!          │
  │         │ → onmessage CHỈ nhận khi KHÔNG có event field!    │
  ├─────────┼───────────────────────────────────────────────────┤
  │ id:     │ ID cho message! Browser lưu lastEventId            │
  │         │ → Reconnect → gửi header Last-Event-ID!            │
  │         │ → Cơ chế ĐỒNG BỘ khi mất kết nối!                │
  ├─────────┼───────────────────────────────────────────────────┤
  │ retry:  │ Thời gian reconnect (ms)! Phải là SỐ NGUYÊN!     │
  │         │ → Không phải integer → bị BỎ QUA!                 │
  │         │ → Mặc định ~3 giây (tùy browser!)                 │
  └─────────┴───────────────────────────────────────────────────┘

  ⑤ COMMENT: dòng bắt đầu bằng ":" (colon) → bị BỎ QUA!
  → Dùng để keep-alive (gửi định kỳ, tránh connection timeout!)

  ⑥ Dòng KHÔNG CÓ colon → toàn bộ dòng = field name, value = ""

  ⑦ Tất cả field names KHÁC 4 field trên → bị BỎ QUA!
```

```
VÍ DỤ EVENT STREAM — TỪ ĐƠN GIẢN ĐẾN PHỨC TẠP:
═══════════════════════════════════════════════════════════════

  ① DATA-ONLY MESSAGES (đơn giản nhất):

  : this is a test stream\n          ← Comment → bỏ qua!
  \n
  data: some text\n                  ← Message 1: "some text"
  \n
  data: another message\n            ← Message 2: "another message\nwith two lines"
  data: with two lines\n             ← (2 dòng data → nối bằng \n!)
  \n

  ② NAMED EVENTS (custom event types):

  event: userconnect\n
  data: {"username": "bobby", "time": "02:33:48"}\n
  \n
  event: usermessage\n
  data: {"username": "bobby", "time": "02:34:11", "text": "Hi everyone."}\n
  \n
  event: userdisconnect\n
  data: {"username": "bobby", "time": "02:34:23"}\n
  \n
  event: usermessage\n
  data: {"username": "sean", "time": "02:34:36", "text": "Bye, bobby."}\n
  \n

  → Client listen: addEventListener("userconnect", handler)
  → Client listen: addEventListener("usermessage", handler)
  → Client listen: addEventListener("userdisconnect", handler)

  ③ MIX — Named + Unnamed events:

  event: userconnect\n
  data: {"username": "bobby", "time": "02:33:48"}\n
  \n
  data: Here's a system message of some kind that will get used\n
  data: to accomplish some task.\n
  \n
  event: usermessage\n
  data: {"username": "bobby", "time": "02:34:11", "text": "Hi everyone."}\n
  \n

  → Message 1: trigger "userconnect" event
  → Message 2: trigger "message" event (KHÔNG CÓ event field!)
  → Message 3: trigger "usermessage" event

  ④ ĐẦY ĐỦ TẤT CẢ FIELDS:

  id: 12345\n
  event: addLikeCount\n
  retry: 10000\n
  data: {\n
  data: "likeCount": 1\n
  data: }\n
  \n

  → id: 12345 → browser lưu lastEventId = "12345"
  → event: addLikeCount → trigger "addLikeCount" event
  → retry: 10000 → reconnect sau 10 giây nếu mất kết nối!
  → data nhiều dòng → nối thành: '{\n"likeCount": 1\n}'

  ⑤ GỬI JSON (phổ biến nhất — backend gửi object dưới dạng JSON string):

  data: {\n
  data: "foo": "bar",\n
  data: "baz": 555\n
  data: }\n
  \n

  → Client: JSON.parse(event.data)
  → Kết quả: { foo: "bar", baz: 555 }
```

---

## §5. Server Implementation — Node.js / PHP / NestJS

```javascript
// ═══ NODE.JS RAW — SSE SERVER ═══

var http = require("http");

http
  .createServer(function (req, res) {
    if (req.url === "/stream") {
      // ① Response headers BẮT BUỘC:
      res.writeHead(200, {
        "Content-Type": "text/event-stream", // ← BẮT BUỘC!
        "Cache-Control": "no-cache", // ← Không cache!
        Connection: "keep-alive", // ← Giữ kết nối!
        "Access-Control-Allow-Origin": "*", // ← CORS!
      });

      // ② Retry interval:
      res.write("retry: 10000\n");

      // ③ Gửi custom event ban đầu:
      res.write("event: connecttime\n");
      res.write("data: " + new Date() + "\n\n");

      // ④ Gửi default message:
      res.write("data: " + new Date() + "\n\n");

      // ⑤ Gửi event mỗi 1 giây:
      var interval = setInterval(function () {
        res.write("data: " + new Date() + "\n\n");
      }, 1000);

      // ⑥ Cleanup khi client disconnect:
      req.connection.addListener(
        "close",
        function () {
          clearInterval(interval);
        },
        false,
      );
    }
  })
  .listen(8844, "127.0.0.1");

// → SSE yêu cầu server DUY TRÌ connection!
// → Apache: MỖI connection = 1 thread riêng → TỐN tài nguyên!
// → Node.js: TẤT CẢ connections = 1 thread → TIẾT KIỆM!
// → Nhưng: tránh blocking I/O (disk/DB) trong SSE handler!
```

```php
// ═══ PHP — SSE SERVER ═══

<?php
date_default_timezone_set("America/New_York");
header("X-Accel-Buffering: no");        // ← Tắt buffering Nginx!
header("Content-Type: text/event-stream");
header("Cache-Control: no-cache");

$counter = rand(1, 10);

while (true) {
    // Gửi "ping" event mỗi giây:
    echo "event: ping\n";
    $curDate = date(DATE_ISO8601);
    echo 'data: {"time": "' . $curDate . '"}';
    echo "\n\n";

    // Gửi message mặc định ngẫu nhiên:
    $counter--;
    if (!$counter) {
        echo 'data: This is a message at time ' . $curDate . "\n\n";
        $counter = rand(1, 10);
    }

    // Flush output buffer:
    if (ob_get_contents()) {
        ob_end_flush();
    }
    flush();

    // Dừng nếu client ngắt kết nối:
    if (connection_aborted()) break;

    sleep(1);
}
?>

// ⚠️ LƯU Ý PHP:
// → X-Accel-Buffering: no → Nginx KHÔNG buffer response!
// → ob_end_flush() + flush() → Gửi data NGAY, không chờ buffer đầy!
// → connection_aborted() → Kiểm tra client còn kết nối không!
// → sleep(1) → Chờ 1 giây trước event tiếp theo!
```

```typescript
// ═══ NESTJS — SSE SERVER (RxJS) ═══

// sse.service.ts
import { Injectable } from "@nestjs/common";
import { interval } from "rxjs";
import { map } from "rxjs/operators";
import { randomSeries } from "yancey-js-util";

@Injectable()
export class SSEService {
  public sse() {
    let count = 1;
    return interval(2000).pipe(
      // Emit mỗi 2 giây!
      map((_) => ({
        id: randomSeries(6), // → id: abc123
        type: "addLikeCount", // → event: addLikeCount
        data: {
          // → data: JSON string
          payload: {
            tweetId: randomSeries(6),
            likeCount: count++,
          },
        },
        retry: 10000, // → retry: 10000
      })),
    );
  }
}

// sse.controller.ts
import { Controller, MessageEvent, Sse } from "@nestjs/common";
import { Observable } from "rxjs";
import { SSEService } from "./sse.service";

@Controller()
export class SSEController {
  constructor(private readonly sseService: SSEService) {}

  @Sse("sse") // ← NestJS decorator! Route: GET /sse
  public sse(): Observable<MessageEvent> {
    return this.sseService.sse();
    // NestJS TỰ ĐỘNG:
    // → Set Content-Type: text/event-stream
    // → Transform object → SSE format string!
    // → Handle connection lifecycle!
  }
}

// sse.module.ts
import { Module } from "@nestjs/common";
import { SSEController } from "./sse.controller";
import { SSEService } from "./sse.service";

@Module({
  controllers: [SSEController],
  providers: [SSEService],
})
export class SSEModule {}
```

---

## §6. Ví dụ đầy đủ: Like Counter Realtime (React + NestJS)

```tsx
// ═══ REACT CLIENT — Like Counter SSE ═══

import { FC, useState, useEffect } from "react";

interface CustomEvent extends Event {
  data: string;
}

interface Data {
  payload: {
    likeCount: number;
  };
}

const SSEDemo: FC = () => {
  const [like, setLike] = useState(0);

  useEffect(() => {
    const evtSource = new EventSource("http://localhost:3002/sse", {
      withCredentials: true, // Gửi cookies cross-origin!
    });

    evtSource.addEventListener("open", () => {
      console.log("✅ SSE connected!");
    });

    // Custom event "addLikeCount":
    // → Server gửi: event: addLikeCount\n data: {...}\n\n
    evtSource.addEventListener("addLikeCount", ((e: CustomEvent) => {
      const {
        payload: { likeCount },
      }: Data = JSON.parse(e.data);
      setLike(likeCount);

      // Client CHỦ ĐỘNG đóng khi like > 10:
      if (likeCount > 10) {
        evtSource.close();
        console.log("🛑 SSE closed by client");
      }
    }) as EventListener);

    // Fallback — message event mặc định:
    evtSource.addEventListener("message", (e: MessageEvent) => {
      console.log("Default message:", e.data);
    });

    evtSource.addEventListener("error", (err: Event) => {
      console.error("SSE error:", err);
      // Browser TỰ ĐỘNG reconnect!
    });

    // Cleanup khi component unmount:
    return () => evtSource.close();
  }, []);

  return <div>❤️ {like}</div>;
};

export default SSEDemo;
```

```
RESPONSE TỪ SERVER — PHÂN TÍCH:
═══════════════════════════════════════════════════════════════

  Response Headers:
  ┌────────────────────────────────────────────────────┐
  │ HTTP/1.1 200 OK                                    │
  │ Content-Type: text/event-stream   ← SSE marker!   │
  │ Cache-Control: no-cache           ← KHÔNG cache!   │
  │ Connection: keep-alive            ← Keep open!     │
  │ Transfer-Encoding: chunked        ← Streaming!     │
  └────────────────────────────────────────────────────┘

  EventStream Data (từng chunk):
  ┌────────────────────────────────────────────────────┐
  │ id: abc123                                         │
  │ event: addLikeCount                                │
  │ retry: 10000                                       │
  │ data: {"payload":{"tweetId":"xyz789","likeCount":1}}│
  │                                                    │
  │ id: def456                                         │
  │ event: addLikeCount                                │
  │ retry: 10000                                       │
  │ data: {"payload":{"tweetId":"uvw012","likeCount":2}}│
  │                                                    │
  │ ...                                                │
  └────────────────────────────────────────────────────┘

  2 FLAGS QUAN TRỌNG:
  → Content-Type: text/event-stream → browser biết là SSE!
  → Cache-Control: no-cache → KHÔNG cache (data dynamic!)
```

---

## §7. Reconnection & Last-Event-ID — Cơ chế đồng bộ

```
AUTO RECONNECT — CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  Connection bị mất → browser TỰ ĐỘNG reconnect!
  → Thời gian chờ = retry field (mặc định ~3s)

  2 TÌNH HUỐNG reconnect:
  ① Hết khoảng thời gian retry interval!
  ② Lỗi mạng hoặc lỗi khác khiến kết nối thất bại!

  QUY TRÌNH RECONNECT:
  ① Server gán id cho mỗi event:
     id: 42\n
     data: {...}\n\n

  ② Browser lưu lastEventId = "42"!

  ③ Connection bị mất!

  ④ Browser reconnect → gửi HTTP header:
     Last-Event-ID: 42

  ⑤ Server đọc header Last-Event-ID
     → Biết client nhận đến event 42!
     → Gửi events từ 43 trở đi!

  → Last-Event-ID = CƠ CHẾ ĐỒNG BỘ!
  → Giúp client KHÔNG BỊ MẤT events khi reconnect!

  ⚠️ close() = CHỦ ĐỘNG đóng → KHÔNG reconnect!
  ⚠️ Server trả status KHÁC 200 → KHÔNG reconnect!
```

```javascript
// ═══ SERVER-SIDE LAST-EVENT-ID HANDLING ═══

app.get("/sse", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Kiểm tra Last-Event-ID từ client (reconnecting!):
  const lastEventId = req.headers["last-event-id"];

  if (lastEventId) {
    console.log(`Client reconnecting from event: ${lastEventId}`);
    // Gửi events bị mất (từ database/queue):
    const missedEvents = getEventsSince(parseInt(lastEventId));
    missedEvents.forEach((event) => {
      res.write(`id: ${event.id}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    });
  }

  // Retry interval:
  res.write("retry: 10000\n\n");

  // Tiếp tục streaming events mới...
  let eventId = lastEventId ? parseInt(lastEventId) : 0;

  const intervalId = setInterval(() => {
    eventId++;
    res.write(`id: ${eventId}\n`);
    res.write(`data: ${JSON.stringify({ time: new Date() })}\n\n`);
  }, 1000);

  req.on("close", () => {
    clearInterval(intervalId);
  });
});
```

---

## §8. SSE vs WebSocket vs Polling — Khi nào dùng gì?

```
SO SÁNH 4 PHƯƠNG PHÁP REAL-TIME:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬──────────┬──────────┬──────────┬──────────┐
  │               │ Short    │ Long     │ SSE      │ WebSocket│
  │               │ Polling  │ Polling  │          │          │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Hướng         │ Client→  │ Client→  │ Server→  │ Hai chiều│
  │               │ Server   │ Server   │ Client   │          │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Protocol      │ HTTP     │ HTTP     │ HTTP     │ ws://    │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Latency       │ Cao      │ Trung    │ Thấp     │ Rất thấp │
  │               │ (polling │ bình     │          │          │
  │               │ interval)│          │          │          │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Server load   │ CAO!     │ Trung    │ Thấp     │ Thấp     │
  │               │ (repeat  │ bình     │ (1 conn) │ (1 conn) │
  │               │ requests)│          │          │          │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Complexity    │ Đơn giản │ Trung    │ Đơn giản │ Phức tạp │
  │               │          │ bình     │          │          │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Reconnect     │ Manual   │ Manual   │ TỰ ĐỘNG! │ Manual!  │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Binary        │ ✅       │ ✅       │ ❌ Text  │ ✅       │
  ├───────────────┼──────────┼──────────┼──────────┼──────────┤
  │ rateLimit?    │ CÓ THỂ   │ CÓ THỂ  │ KHÔNG!   │ KHÔNG!   │
  │               │ bị block!│ bị block!│ (1 req!) │ (1 req!) │
  └───────────────┴──────────┴──────────┴──────────┴──────────┘

  ⚠️ SSE & rateLimit:
  → SSE = 1 HTTP request → KHÔNG bị rateLimit!
  → Polling = NHIỀU requests → CÓ THỂ bị block!
  → Ví dụ:
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,  // 15 phút
        max: 100,                    // max 100 requests/15 phút
    }));
    → Polling mỗi giây = 900 requests/15 phút → BỊ BLOCK!
    → SSE = 1 request → an toàn! ✅
```

```
KHI NÀO DÙNG GÌ — HƯỚNG DẪN:
═══════════════════════════════════════════════════════════════

  DÙNG SSE KHI:
  ✅ Server push 1 chiều — notifications, feeds, dashboards!
  ✅ Real-time stock prices, live scores, social media likes!
  ✅ Live logs, build status, CI/CD pipeline updates!
  ✅ ChatGPT/Claude/Gemini streaming responses! (token by token!)
  ✅ News feeds, social media timeline auto-update!
  ✅ Cần auto-reconnect + Last-Event-ID tracking!
  ✅ Serverless environment (không hỗ trợ WebSocket!)

  DÙNG WEBSOCKET KHI:
  ✅ Chat hai chiều (Slack, Discord, Messenger)
  ✅ Online gaming (ultra-low latency!)
  ✅ Collaborative editing (Google Docs, Figma)
  ✅ Binary data streaming (audio, video calls)
  ✅ Bidirectional control (IoT, remote desktop)

  DÙNG POLLING KHI:
  ✅ Updates không thường xuyên (mỗi 30s-1 phút)
  ✅ Simple dashboard, email check
  ✅ Không cần real-time thực sự
  ✅ Legacy browser support (IE cũ!)

  ⚠️ TREND 2024-2026:
  → AI LLMs (ChatGPT, Claude, Gemini) → đều dùng SSE cho streaming!
  → SSE đang được dùng RỘNG RÃI hơn bao giờ hết nhờ AI wave!
```

---

## §9. Kỹ thuật nâng cao & Lưu ý thực tế

```
6 CONNECTION LIMIT — VẤN ĐỀ QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ⚠️ HTTP/1.1: Giới hạn 6 connections/domain PER BROWSER!
  → Mở 6 tabs → 6 SSE connections → HẾT SLOT!
  → Tab 7 KHÔNG kết nối SSE được! (block!)
  → Chrome & Firefox: đã đánh dấu "Won't fix"!

  → Limit = PER BROWSER + PER DOMAIN:
  → 6 SSE connections đến www.example1.com (OK!)
  → 6 SSE connections đến www.example2.com (OK!) — domain KHÁC!

  → HTTP/2: Max simultaneous streams do server+client negotiate!
  → Mặc định 100 streams → GẤP ~17 lần HTTP/1.1!
  → Giải quyết vấn đề 6 connection limit!

  GIẢI PHÁP CHO HTTP/1.1:
  ① Dùng HTTP/2!
  ② SharedWorker — 1 connection, broadcast nhiều tabs!
  ③ Dùng domain sharding (chia nhiều subdomain!)
```

```javascript
// ═══ SHARED WORKER — GIẢI QUYẾT 6 CONNECTION LIMIT ═══

// shared-sse-worker.js
const connections = [];
let evtSource = null;

self.addEventListener("connect", (e) => {
  const port = e.ports[0];
  connections.push(port);

  // Chỉ tạo 1 SSE connection cho TẤT CẢ tabs:
  if (!evtSource) {
    evtSource = new EventSource("/sse");
    evtSource.onmessage = (event) => {
      // Broadcast đến TẤT CẢ tabs:
      connections.forEach((conn) => {
        conn.postMessage(event.data);
      });
    };
  }
  port.start();
});

// Trong mỗi tab:
const worker = new SharedWorker("shared-sse-worker.js");
worker.port.onmessage = (e) => {
  console.log("SSE data:", e.data);
};
worker.port.start();
```

```javascript
// ═══ FETCH + READABLESTREAM — ALTERNATIVE ĐỂ THAY EventSource ═══

// EventSource CHỈ hỗ trợ: GET, no custom headers!
// Cần POST / custom headers? → Dùng fetch + ReadableStream!

async function sseWithFetch(url, body) {
  const response = await fetch(url, {
    method: "POST", // ← EventSource không làm được!
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer token", // ← Custom header!
    },
    body: JSON.stringify(body),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    // Parse SSE format thủ công...
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        console.log(data);
      }
    }
  }
}

// ⚠️ Trade-offs:
// ✅ Custom headers, POST method, request body!
// ❌ KHÔNG có auto-reconnect! Phải tự implement!
// ❌ KHÔNG có Last-Event-ID! Phải tự tracking!
// → Đây là cách ChatGPT frontend gọi API streaming!
```

```
GRAPHQL & SSE:
═══════════════════════════════════════════════════════════════

  GraphQL KHÔNG hỗ trợ SSE trực tiếp!
  → GraphQL đã có Subscription system riêng (dùng WebSocket!)
  → Subscriptions mạnh hơn SSE cho GraphQL use cases!

  NHƯNG: graphql-sse package tồn tại!
  → SSE transport cho GraphQL subscriptions!
  → Phù hợp serverless (không hỗ trợ WebSocket!)

  APACHE vs NODE.JS — TÀI NGUYÊN:
  → Apache: MỖI SSE connection = 1 thread riêng → TỐN RAM!
  → Node.js: TẤT CẢ connections = 1 thread → TIẾT KIỆM!
  → Node.js phù hợp hơn cho SSE!
  → NHưng: tránh blocking operations (disk I/O, heavy computation)!

  NGINX BUFFERING:
  → Nginx MẶC ĐỊNH buffer response!
  → SSE streaming bị delay vì buffer!
  → Giải pháp: X-Accel-Buffering: no trong response headers!
  → Hoặc: proxy_buffering off; trong nginx config!

  IE POLYFILL:
  → npm install eventsource-polyfill
  → import 'eventsource-polyfill'; // Trước khi dùng EventSource!
```

---

## §10. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Server-Sent Events (SSE)
  ├── Bản chất: Server → Client ONE-WAY qua HTTP stream (text/event-stream)
  │   └── Thực chất = "download dài hạn" bằng streaming information!
  ├── vs WebSocket: 1 chiều/HTTP/text/auto-reconnect vs 2 chiều/ws/binary/manual
  ├── Client: new EventSource(url, {withCredentials})
  │   ├── readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
  │   ├── Events: open, message, error + custom addEventListener!
  │   ├── onmessage: CHỈ nhận message KHÔNG CÓ event field!
  │   └── close(): đóng + KHÔNG reconnect!
  ├── Event Stream Format:
  │   ├── 4 fields: data, event, id, retry
  │   ├── Message separator: \n\n (blank line!)
  │   ├── Comment: ":" → bỏ qua (keep-alive!)
  │   └── Multi-line data → nối bằng \n!
  ├── Server Headers: Content-Type: text/event-stream + no-cache + keep-alive
  │   ├── Node.js: res.write("data: ...\n\n")
  │   ├── PHP: echo "data: ...\n\n" + flush()
  │   └── NestJS: @Sse decorator + RxJS Observable!
  ├── Reconnection:
  │   ├── Auto-reconnect khi mất kết nối!
  │   ├── retry field = khoảng thời gian chờ (ms)!
  │   └── Last-Event-ID header → đồng bộ events bị mất!
  ├── Limitations:
  │   ├── 6 conn limit (HTTP/1.1) → SharedWorker / HTTP/2!
  │   ├── Text only → binary phải encode!
  │   ├── No IE → polyfill!
  │   └── GET only → fetch+ReadableStream cho POST!
  └── Use cases: ChatGPT streaming, notifications, feeds, live updates!
```

### Checklist

- [ ] **SSE là gì**: Server → Client one-way push qua HTTP; bản chất = "download dài hạn" bằng streaming; Content-Type: text/event-stream!
- [ ] **SSE vs WebSocket**: SSE = 1 chiều/HTTP/text/auto-reconnect; WS = 2 chiều/ws/binary/manual reconnect; SSE đơn giản hơn, WS mạnh hơn!
- [ ] **EventSource API**: new EventSource(url, {withCredentials}); readyState: 0/1/2; open/message/error events; close() dừng reconnect!
- [ ] **Custom events**: server gửi event: tên → client addEventListener("tên"); onmessage CHỈ nhận message KHÔNG CÓ event field!
- [ ] **Event Stream format**: 4 fields (data/event/id/retry); \n\n separator; ":" = comment/keep-alive; multi-line data nối bằng \n!
- [ ] **data field**: payload chính; nhiều dòng data → nối bằng \n; trailing newlines bị xóa; thường gửi JSON string!
- [ ] **id field**: identifier cho mỗi event; browser lưu lastEventId; reconnect → gửi Last-Event-ID header → cơ chế đồng bộ!
- [ ] **retry field**: thời gian reconnect (ms); phải là integer dương; không phải integer → bỏ qua!
- [ ] **Server headers**: Content-Type: text/event-stream + Cache-Control: no-cache + Connection: keep-alive; Nginx: X-Accel-Buffering: no!
- [ ] **Last-Event-ID**: browser gửi header khi reconnect → server biết client nhận đến đâu → gửi events bị mất!
- [ ] **Auto reconnect**: 2 tình huống (hết retry interval / lỗi mạng); close() = KHÔNG reconnect; server trả khác 200 = KHÔNG reconnect!
- [ ] **6 connection limit**: HTTP/1.1 max 6/domain PER BROWSER (Won't fix!); HTTP/2 giải quyết (100 streams mặc định); SharedWorker workaround!
- [ ] **rateLimit**: SSE = 1 HTTP request → KHÔNG bị rateLimit! Polling = nhiều requests → CÓ THỂ bị!
- [ ] **fetch alternative**: EventSource chỉ GET; cần POST/custom headers → fetch + ReadableStream; mất auto-reconnect + Last-Event-ID!
- [ ] **Server resources**: Apache = 1 thread/connection (tốn!); Node.js = cùng thread (tiết kiệm!); tránh blocking I/O!
- [ ] **Use cases**: ChatGPT/Claude streaming, notifications, live scores, feeds, dashboards; KHÔNG dùng cho chat 2 chiều/gaming!

---

_Nguồn: MDN Web Docs — "Using server-sent events" · Ruan Yifeng — "Server-Sent Events Tutorial" · ConardLi — TikTok Frontend Security Team · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
