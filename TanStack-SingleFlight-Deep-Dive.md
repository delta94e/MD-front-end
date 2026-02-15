# TanStack Start — Single Flight Mutations Cơ Chế Chuyên Sâu

> Phân tích cơ chế Single Flight Mutations trong TanStack Start: mutation + refetch trong MỘT lần network round-trip duy nhất. Bao gồm: refetch middleware pattern, server function serialization, sendContext/context flow, query cache integration, hierarchical key matching, active/inactive query handling, và TypeScript overload typing.
> Độ khó: ⭐️⭐️⭐️⭐️ | Thời gian đọc: ~20 phút

---

## Mục Lục

1. [Single Flight Mutations Là Gì?](#1-single-flight-mutations-là-gì)
2. [Vấn Đề Với Cách Làm Truyền Thống](#2-vấn-đề-với-cách-làm-truyền-thống)
3. [Kiến Trúc Middleware — Client/Server Flow](#3-kiến-trúc-middleware--clientserver-flow)
4. [Xây Dựng Refetch Middleware](#4-xây-dựng-refetch-middleware)
5. [TypeScript — Fix Context Typing Bằng Middleware Chaining](#5-typescript--fix-context-typing-bằng-middleware-chaining)
6. [Hierarchical Key Matching — Active vs Inactive](#6-hierarchical-key-matching--active-vs-inactive)
7. [Helper Utility — refetchedQueryOptions](#7-helper-utility--refetchedqueryoptions)
8. [TypeScript Overload — Type-Safe Server Functions](#8-typescript-overload--type-safe-server-functions)
9. [Câu Hỏi Phỏng Vấn](#9-câu-hỏi-phỏng-vấn)

---

## 1. Single Flight Mutations Là Gì?

```
SINGLE FLIGHT MUTATIONS — Ý TƯỞNG CỐT LÕI:
═══════════════════════════════════════════════════════════════

  TRUYỀN THỐNG — 2+ round-trips:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Client                           Server                │
  │    │                                 │                   │
  │    │──── POST /update-epic ─────────►│                   │
  │    │◄─── { success: true } ─────────│  ① Mutation       │
  │    │                                 │                   │
  │    │──── GET /epics?page=1 ─────────►│                   │
  │    │◄─── [epic1, epic2...] ─────────│  ② Refetch list  │
  │    │                                 │                   │
  │    │──── GET /epics/summary ────────►│                   │
  │    │◄─── { count: 42 } ────────────│  ③ Refetch summary│
  │    │                                 │                   │
  │    = 3 NETWORK ROUND-TRIPS!                              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  SINGLE FLIGHT — 1 round-trip:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Client                           Server                │
  │    │                                 │                   │
  │    │──── POST /update-epic ─────────►│                   │
  │    │     + "refetch these queries"   │                   │
  │    │                                 │  ① Mutation       │
  │    │                                 │  ② Refetch list  │
  │    │                                 │  ③ Refetch summary│
  │    │◄─── mutation result            │                   │
  │    │     + epics list data           │                   │
  │    │     + summary data              │                   │
  │    │                                 │                   │
  │    = 1 NETWORK ROUND-TRIP!                               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → Giảm latency: 1 trip thay vì 3+ trips               │
  │  → UI update NGAY LẬP TỨC sau mutation                  │
  │  → Không có "loading states" giữa mutation và refetch  │
  │  → Network tab: KHÔNG có extra requests!                │
  │                                                          │
  │  ⚠️ LƯU Ý:                                             │
  │  → Không phải mọi app đều CẦN single flight mutations  │
  │  → Nhiều app nhỏ: refetch trực tiếp là ĐỦ              │
  │  → Giá trị lớn nhất cho app CẦN low-latency updates    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 2. Vấn Đề Với Cách Làm Truyền Thống

```
PART 1 — CÁCH LÀM "NAIVE":
═══════════════════════════════════════════════════════════════

  "Hardcode refetch bên trong server function"

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Server function — hardcoded refetch                 │
  │  const updateEpic = createServerFn(...)                  │
  │    .handler(async ({ data }) => {                        │
  │      // ① Do mutation                                   │
  │      await db.update(epicsTable)                         │
  │        .set({ name: data.name });                        │
  │                                                          │
  │      // ② Manually refetch everything needed            │
  │      const epics = await getEpicsList({ data: 1 });     │
  │      const summary = await getEpicsSummary();            │
  │                                                          │
  │      return { epics, summary }; ←── hardcoded!          │
  │    });                                                   │
  │                                                          │
  │  ❌ Vấn đề:                                             │
  │  → COUPLING: server function biết quá nhiều về UI       │
  │  → INFLEXIBLE: page nào đang active? key nào cần?      │
  │  → NOT REUSABLE: mỗi mutation phải viết lại logic      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  PART 2 — GIẢI PHÁP: REFETCH MIDDLEWARE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → Tách "refetch logic" thành MIDDLEWARE tái sử dụng    │
  │  → Caller chỉ cần truyền QueryKey[] muốn refetch       │
  │  → Middleware TỰ ĐỘNG:                                   │
  │    ① Tìm server function + args từ query cache          │
  │    ② Gửi lên server qua sendContext                     │
  │    ③ Server chạy tất cả refetch                         │
  │    ④ Gửi kết quả về client                              │
  │    ⑤ Client setQueryData vào cache                      │
  │                                                          │
  │  → DECOUPLED: server function không biết về UI          │
  │  → REUSABLE: gắn middleware vào BẤT KỲ server function │
  │  → FLEXIBLE: caller quyết định refetch cái gì          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 3. Kiến Trúc Middleware — Client/Server Flow

```
TANSTACK MIDDLEWARE — sendContext / context FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  BROWSER (Client)              SERVER                    │
  │  ┌─────────────────────┐      ┌──────────────────────┐  │
  │  │ .client() callback  │      │ .server() callback   │  │
  │  │                     │      │                      │  │
  │  │ ① Collect query    │      │                      │  │
  │  │   keys + serverFns │      │                      │  │
  │  │   from QueryCache  │      │                      │  │
  │  │                     │      │                      │  │
  │  │ ② next({           │ ───► │ ③ context =          │  │
  │  │   sendContext: {    │      │   { revalidate }     │  │
  │  │     revalidate      │      │                      │  │
  │  │   }                 │      │ ④ Execute mutation   │  │
  │  │ })                  │      │   (the actual        │  │
  │  │                     │      │    server function)  │  │
  │  │                     │      │                      │  │
  │  │                     │      │ ⑤ Execute all        │  │
  │  │                     │      │   refetch serverFns  │  │
  │  │                     │      │                      │  │
  │  │ ⑦ result.context = │ ◄─── │ ⑥ result.sendContext │  │
  │  │   { payloads }     │      │   = { payloads }     │  │
  │  │                     │      │                      │  │
  │  │ ⑧ setQueryData()  │      │                      │  │
  │  │   for each payload │      │                      │  │
  │  │                     │      │                      │  │
  │  └─────────────────────┘      └──────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  KEY CONCEPTS:
  ┌───────────────────────┬──────────────────────────────────┐
  │ sendContext           │ Gửi data từ phía này SANG phía  │
  │                       │ kia (client→server hoặc ngược)  │
  ├───────────────────────┼──────────────────────────────────┤
  │ context               │ ĐỌC data mà phía kia đã gửi    │
  │                       │ qua sendContext                  │
  ├───────────────────────┼──────────────────────────────────┤
  │ next()                │ Trigger pipeline tiếp theo       │
  │                       │ (server function hoặc middleware)│
  ├───────────────────────┼──────────────────────────────────┤
  │ result                │ Kết quả trả về SAU next()       │
  │                       │ bao gồm context từ server       │
  ├───────────────────────┼──────────────────────────────────┤
  │ Server function       │ CÓ THỂ serialize! TanStack dùng │
  │ serialization         │ internal ID → gửi ID qua mạng  │
  │                       │ → deserialize thành function     │
  └───────────────────────┴──────────────────────────────────┘

  ⭐ SERVER FUNCTION SERIALIZATION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Bình thường: functions KHÔNG serialize được             │
  │  → Có state, closure, context...                        │
  │                                                          │
  │  TanStack Start server functions: CÓ THỂ!               │
  │  → Mỗi server function có INTERNAL ID                   │
  │  → Client gửi ID → server deserialize thành function   │
  │  → Cho phép "gửi function qua mạng"                    │
  │                                                          │
  │  Đây là KEY INSIGHT cho refetch middleware:              │
  │  → Client tìm serverFn từ query cache meta             │
  │  → Gửi serverFn (ID) + args lên server                 │
  │  → Server deserialize → chạy → trả kết quả            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 4. Xây Dựng Refetch Middleware

### Bước 1: Chuẩn Bị Query Options Với Meta

```
ĐĂNG KÝ serverFn + arg VÀO QUERY OPTIONS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  export const epicsQueryOptions = (page: number) => {   │
  │    return queryOptions({                                 │
  │      queryKey: ["epics", "list", page],                  │
  │      queryFn: async () => {                              │
  │        return await getEpicsList({ data: page });        │
  │      },                                                  │
  │      staleTime: 1000 * 60 * 5,                           │
  │      meta: {                     // ← KEY ADDITION!     │
  │        __revalidate: {                                   │
  │          serverFn: getEpicsList, // server function ref  │
  │          arg: page,              // arguments            │
  │        },                                                │
  │      },                                                  │
  │    });                                                   │
  │  };                                                      │
  │                                                          │
  │  → meta.__revalidate lưu CÁCH refetch query này         │
  │  → Middleware sẽ đọc meta này từ QueryCache              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Bước 2: Client Callback — Collect & Send

```
CLIENT CALLBACK — THU THẬP VÀ GỬI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  type RevalidationPayload = {                            │
  │    refetch: {                                            │
  │      key: QueryKey;    // query key để map kết quả      │
  │      fn: any;          // server function ref (ID)       │
  │      arg: any;         // arguments cho function         │
  │    }[];                                                  │
  │  };                                                      │
  │                                                          │
  │  .client(async ({ next, data }) => {                     │
  │    const { refetch = [] } = data ?? {};                  │
  │                                                          │
  │    // ① Lấy QueryClient từ Router context               │
  │    const router = await getRouterInstance();              │
  │    const queryClient = router.options.context.queryClient│
  │    const cache = queryClient.getQueryCache();            │
  │                                                          │
  │    // ② Với mỗi key, tìm trong cache → lấy serverFn   │
  │    const revalidate: RevalidationPayload = { refetch: []│
  │    };                                                    │
  │                                                          │
  │    refetch.forEach((key: QueryKey) => {                  │
  │      const entry = cache.find({                          │
  │        queryKey: key, exact: true                        │
  │      });                                                 │
  │      if (!entry) return; // ← không có = skip           │
  │                                                          │
  │      const payload = entry?.meta?.__revalidate;          │
  │      if (payload) {                                      │
  │        revalidate.refetch.push({                         │
  │          key,                                            │
  │          fn: payload.serverFn,                           │
  │          arg: payload.arg,                               │
  │        });                                               │
  │      }                                                   │
  │    });                                                   │
  │                                                          │
  │    // ③ Gửi payload lên server qua sendContext          │
  │    const result = await next({                           │
  │      sendContext: { revalidate }                         │
  │    });                                                   │
  │                                                          │
  │    // ④ Nhận kết quả → ghi vào QueryCache              │
  │    for (const entry of result.context?.payloads ?? []) { │
  │      queryClient.setQueryData(entry.key, entry.result);  │
  │    }                                                     │
  │                                                          │
  │    return result;                                        │
  │  })                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Bước 3: Server Callback — Execute & Return

```
SERVER CALLBACK — THỰC THI VÀ TRẢ VỀ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  .server(async ({ next, context }) => {                  │
  │    // ① Chạy server function gốc (mutation)             │
  │    const result = await next({                           │
  │      sendContext: {                                      │
  │        payloads: [] as any[]  // ← sẽ gửi về client    │
  │      }                                                   │
  │    });                                                   │
  │                                                          │
  │    // ② Đọc revalidate từ context (client gửi lên)     │
  │    const allPayloads = context.revalidate.refetch        │
  │      .map(refetchPayload => ({                           │
  │        key: refetchPayload.key,                          │
  │        result: refetchPayload.fn({                       │
  │          data: refetchPayload.arg                        │
  │        })                           // ← PROMISE!       │
  │      }));                                                │
  │                                                          │
  │    // ③ Await tất cả results, push vào payloads        │
  │    for (const payload of allPayloads) {                  │
  │      result.sendContext.payloads.push({                   │
  │        key: payload.key,                                 │
  │        result: await payload.result  // ← await result  │
  │      });                                                 │
  │    }                                                     │
  │                                                          │
  │    return result;                                        │
  │    // → payloads sẽ tự động đến client qua              │
  │    //   result.context.payloads                          │
  │  })                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  FLOW TÓM TẮT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  CLIENT:                                                 │
  │  ① data.refetch = [["epics","list",1], ...]             │
  │  ② cache.find(key) → meta.__revalidate → {fn, arg}     │
  │  ③ sendContext → { revalidate: { refetch: [...] } }     │
  │                        ↓ (qua mạng)                     │
  │  SERVER:                                                 │
  │  ④ context.revalidate → chạy tất cả serverFns          │
  │  ⑤ result.sendContext.payloads = [{key, result}, ...]   │
  │                        ↓ (qua mạng)                     │
  │  CLIENT:                                                 │
  │  ⑥ result.context.payloads → setQueryData cho mỗi key │
  │                                                          │
  │  = 1 ROUND-TRIP: mutation + all refetches!              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 5. TypeScript — Fix Context Typing Bằng Middleware Chaining

```
VẤN ĐỀ: SERVER CONTEXT KHÔNG VISIBLE Ở CLIENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Trong 1 middleware:                                      │
  │                                                          │
  │  .client(async ({ next }) => {                           │
  │    const result = await next({ sendContext: {...} });     │
  │    // result.context?.payloads ← TS ERROR!               │
  │    // Server callback GỬI payloads qua sendContext       │
  │    // Nhưng client callback KHÔNG BIẾT server sẽ gửi gì│
  │    // → Type inference KHÔNG chạy ngược được!            │
  │  })                                                      │
  │  .server(async ({ next }) => {                           │
  │    const result = await next({                           │
  │      sendContext: { payloads: [] }  // ← TS thấy       │
  │    });                                                   │
  │    return result;                                        │
  │  })                                                      │
  │                                                          │
  │  → .client KHÔNG thấy .server sendContext                │
  │  → Type inference chỉ chạy XUÔI, không ngược            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP: TÁCH THÀNH 2 MIDDLEWARE + CHAINING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Middleware 1: Thu thập + gửi + server xử lý         │
  │  const prelimRefetchMiddleware = createMiddleware(...)   │
  │    .client(async ({ next, data }) => {                   │
  │      // Thu thập revalidate payload                      │
  │      // ...                                              │
  │      return await next({                                 │
  │        sendContext: { revalidate }                        │
  │      });                                                 │
  │      // ← KHÔNG đọc result.context ở đây               │
  │    })                                                    │
  │    .server(async ({ next, context }) => {                │
  │      const result = await next({                         │
  │        sendContext: { payloads: [] as any[] }            │
  │      });                                                 │
  │      // ... execute refetches, push to payloads         │
  │      return result;                                      │
  │    });                                                   │
  │                                                          │
  │  // Middleware 2: Đọc kết quả từ server                 │
  │  export const refetchMiddleware = createMiddleware(...)  │
  │    .middleware([prelimRefetchMiddleware]) // ← CHAIN!    │
  │    .client(async ({ next }) => {                         │
  │      const result = await next();                        │
  │      // result.context.payloads ← TS OK! ✅             │
  │      // Vì prelimRefetchMiddleware là INPUT              │
  │      // → TS biết server sendContext có payloads        │
  │      for (const entry of result.context.payloads) {      │
  │        queryClient.setQueryData(entry.key, entry.result);│
  │      }                                                   │
  │      return result;                                      │
  │    });                                                   │
  │                                                          │
  │  TẠI SAO HOẠT ĐỘNG:                                      │
  │  → refetchMiddleware BIẾT prelimRefetchMiddleware       │
  │  → Nên biết server gửi về payloads                      │
  │  → Type inference chạy XUÔI qua middleware chain        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 6. Hierarchical Key Matching — Active vs Inactive

```
CẢI TIẾN: HIERARCHICAL KEYS + ACTIVE/INACTIVE:
═══════════════════════════════════════════════════════════════

  ① EXACT → HIERARCHICAL MATCHING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Trước: exact: true → phải truyền ĐÚNG key              │
  │  refetch: [["epics","list",1], ["epics","list","summary"]│
  │                                                          │
  │  Sau: exact: false → hỗ trợ KEY PREFIX                   │
  │  refetch: [["epics","list"]]                             │
  │  → Match TẤT CẢ queries bắt đầu bằng ["epics","list"]  │
  │  → Bao gồm: page 1, page 2, summary...                 │
  │                                                          │
  │  // Dùng flatMap + findAll thay vì find                  │
  │  const allQueriesFound = refetch.flatMap(k =>            │
  │    cache.findAll({ queryKey: k, exact: false })          │
  │  );                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ② VẤN ĐỀ: REFETCH QUÁ NHIỀU!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  User đã xem page 1, 2, 3 → tất cả trong cache         │
  │  Nhưng hiện tại chỉ ĐANG XEM page 1!                    │
  │                                                          │
  │  ["epics","list"] match:                                 │
  │  → ["epics","list",1]        ← ACTIVE (đang xem)       │
  │  → ["epics","list",2]        ← INACTIVE (đã rời)       │
  │  → ["epics","list",3]        ← INACTIVE (đã rời)       │
  │  → ["epics","list","summary"]← ACTIVE (đang xem)       │
  │                                                          │
  │  → Refetch page 2, 3 là LÃNG PHÍ!                      │
  │    (user không đang xem, data trả về không ai dùng)     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ③ GIẢI PHÁP: CHỈ REFETCH ACTIVE, INVALIDATE INACTIVE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Chỉ refetch ACTIVE queries                           │
  │  const allQueriesFound = refetch.flatMap(key =>          │
  │    cache.findAll({                                       │
  │      queryKey: key,                                      │
  │      exact: false,                                       │
  │      type: "active"    // ← CHỈ active!                 │
  │    })                                                    │
  │  );                                                      │
  │                                                          │
  │  // Invalidate INACTIVE queries (không refetch ngay)     │
  │  data?.refetch.forEach(key => {                          │
  │    queryClient.invalidateQueries({                       │
  │      queryKey: key,                                      │
  │      exact: false,                                       │
  │      type: "inactive",      // ← chỉ inactive           │
  │      refetchType: "none"    // ← KHÔNG refetch ngay!    │
  │    });                                                   │
  │  });                                                     │
  │                                                          │
  │  Kết quả:                                                │
  │  → Page 1 + summary: refetch qua single flight ✅       │
  │  → Page 2, 3: đánh dấu STALE ✅                         │
  │  → User quay lại page 2: TQ TỰ ĐỘNG refetch            │
  │    (vì đã invalidated → stale → refetch on mount)      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ⭐ setQueryData VỚI updatedAt:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  queryClient.setQueryData(                               │
  │    entry.key,                                            │
  │    entry.result,                                         │
  │    { updatedAt: Date.now() }  // ← QUAN TRỌNG!         │
  │  );                                                      │
  │                                                          │
  │  → Đặt updatedAt = now → TQ biết data là FRESH          │
  │  → Không bị coi là stale ngay sau khi set               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 7. Helper Utility — refetchedQueryOptions

```
XÓA BỎ DUPLICATION — refetchedQueryOptions:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: VIẾT 2 LẦN serverFn + arg:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  queryOptions({                                          │
  │    queryKey: ["epics", "list", page],                    │
  │    queryFn: async () => {                                │
  │      return await getEpicsList({ data: page }); // ①    │
  │    },                                                    │
  │    meta: {                                               │
  │      __revalidate: {                                     │
  │        serverFn: getEpicsList,  // ② LẶP LẠI!          │
  │        arg: page,               // ② LẶP LẠI!          │
  │      },                                                  │
  │    },                                                    │
  │  });                                                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP: HELPER FUNCTION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  function refetchedQueryOptions(                         │
  │    queryKey: QueryKey,                                   │
  │    serverFn: any,                                        │
  │    arg?: any                                             │
  │  ) {                                                     │
  │    const queryKeyToUse = [...queryKey];                   │
  │    if (arg != null) {                                    │
  │      queryKeyToUse.push(arg);  // auto-append arg to key│
  │    }                                                     │
  │    return queryOptions({                                 │
  │      queryKey: queryKeyToUse,                            │
  │      queryFn: async () => serverFn({ data: arg }),       │
  │      meta: {                                             │
  │        __revalidate: { serverFn, arg },                  │
  │      },                                                  │
  │    });                                                   │
  │  }                                                       │
  │                                                          │
  │  // Sử dụng — CLEAN!                                    │
  │  export const epicsQueryOptions = (page: number) => {   │
  │    return queryOptions({                                 │
  │      ...refetchedQueryOptions(                           │
  │        ["epics", "list"], getEpicsList, page             │
  │      ),                                                  │
  │      staleTime: 1000 * 60 * 5,                           │
  │      gcTime: 1000 * 60 * 5,                              │
  │    });                                                   │
  │  };                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 8. TypeScript Overload — Type-Safe Server Functions

```
FULL TYPE SAFETY VỚI FUNCTION OVERLOADS:
═══════════════════════════════════════════════════════════════

  YÊU CẦU:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Server function CÓ arg → arg BẮT BUỘC + đúng type  │
  │  ② Server function KHÔNG arg → arg BỎ QUA được         │
  │  ③ Return type tự suy ra từ server function             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  UTILITY TYPES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  type AnyAsyncFn = (...args: any[]) => Promise<any>;    │
  │                                                          │
  │  // Lấy data type từ server function argument           │
  │  type ServerFnArgs<TFn> =                                │
  │    Parameters<TFn>[0] extends { data: infer T }         │
  │      ? T : undefined;                                    │
  │                                                          │
  │  // Kiểm tra server function CÓ args hay KHÔNG         │
  │  type ServerFnHasArgs<TFn> =                             │
  │    ServerFnArgs<TFn> extends undefined ? false : true;  │
  │                                                          │
  │  // Conditional types cho overload                       │
  │  type ServerFnWithArgs<TFn> =                            │
  │    ServerFnHasArgs<TFn> extends true ? TFn : never;     │
  │  type ServerFnWithoutArgs<TFn> =                         │
  │    ServerFnHasArgs<TFn> extends false ? TFn : never;    │
  │                                                          │
  │  // Custom error message type!                           │
  │  type ValidateServerFunction<Provided, Expected> =       │
  │    Provided extends Expected                             │
  │      ? Provided                                          │
  │      : "This server function requires an argument!";    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  FUNCTION OVERLOADS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Overload 1: Server function CÓ args → 3 params     │
  │  function refetchedQueryOptions<TFn>(                    │
  │    queryKey: QueryKey,                                   │
  │    serverFn: ServerFnWithArgs<TFn>,                      │
  │    arg: Parameters<TFn>[0]["data"]   // BẮT BUỘC!      │
  │  ): RefetchQueryOptions<Awaited<ReturnType<TFn>>>;      │
  │                                                          │
  │  // Overload 2: Server function KHÔNG args → 2 params   │
  │  function refetchedQueryOptions<TFn>(                    │
  │    queryKey: QueryKey,                                   │
  │    serverFn: ValidateServerFunction<                     │
  │      TFn, ServerFnWithoutArgs<TFn>                       │
  │    >                                                     │
  │  ): RefetchQueryOptions<Awaited<ReturnType<TFn>>>;      │
  │                                                          │
  │  // Implementation                                       │
  │  function refetchedQueryOptions<TFn>(                    │
  │    queryKey: QueryKey,                                   │
  │    serverFn: any,                                        │
  │    arg?: any                                             │
  │  ) { ... }                                               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  KẾT QUẢ TYPE-CHECKING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // ✅ CÓ arg, đúng type                                │
  │  refetchedQueryOptions(                                  │
  │    ["epics","list"], getEpicsList, 1                     │
  │  );                                                      │
  │                                                          │
  │  // ❌ CÓ arg, SAI type                                 │
  │  refetchedQueryOptions(                                  │
  │    ["epics","list"], getEpicsList, ""                    │
  │  ); // Error: string ≠ number                           │
  │                                                          │
  │  // ❌ CÓ arg, THIẾU arg                               │
  │  refetchedQueryOptions(                                  │
  │    ["epics","list"], getEpicsList                        │
  │  ); // Error: "This server function requires an argument│
  │                                                          │
  │  // ✅ KHÔNG arg, bỏ qua                                │
  │  refetchedQueryOptions(                                  │
  │    ["epics","list","summary"], getEpicsSummary           │
  │  );                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 9. Câu Hỏi Phỏng Vấn

### Q1: Single Flight Mutations là gì? Tại sao cần?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Thông thường sau mutation, UI cần refetch data mới.         │
│  Nhưng mỗi refetch = 1 network round-trip:                  │
│  mutation + refetch list + refetch summary = 3 trips!       │
│                                                              │
│  Single flight mutations = gộp tất cả refetch vào           │
│  CÙNG 1 round-trip với mutation:                             │
│  → Client gửi: mutation data + "refetch these queries"     │
│  → Server: execute mutation + execute all refetches          │
│  → Server trả: mutation result + all refetch results         │
│  → Client: setQueryData → UI update ngay lập tức            │
│                                                              │
│  → Giảm latency, không extra loading states                 │
│  → Nhưng không phải mọi app đều cần — chỉ có giá trị      │
│    khi cần low-latency updates cho nhiều queries            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: Server functions serialize qua mạng thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Functions bình thường KHÔNG serialize được:                  │
│  → Có state, closure, context → không thể JSON.stringify   │
│                                                              │
│  TanStack Start server functions: CÓ THỂ serialize!         │
│  → Mỗi server function có INTERNAL ID (build-time)         │
│  → Khi "serialize": chỉ gửi ID qua mạng                   │
│  → Khi "deserialize": ID → tìm lại function ở server      │
│                                                              │
│  Đây là key insight cho refetch middleware:                  │
│  → Client tìm serverFn reference từ query cache meta       │
│  → Gửi serverFn (= ID) + args lên server qua sendContext  │
│  → Server deserialize ID → function → chạy → trả về       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: sendContext vs context — flow data thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  sendContext: GỬI data sang phía bên kia                    │
│  context: ĐỌC data mà phía bên kia đã gửi                 │
│                                                              │
│  Client → Server:                                            │
│  .client: next({ sendContext: { revalidate } })             │
│  .server: context.revalidate ← đọc được                    │
│                                                              │
│  Server → Client:                                            │
│  .server: result.sendContext.payloads = [...]                │
│  .client: result.context.payloads ← đọc được               │
│                                                              │
│  ⚠️ TypeScript: trong CÙNG 1 middleware, .client KHÔNG      │
│  thấy type của .server sendContext (inference chạy xuôi).   │
│  → Giải pháp: tách thành 2 chained middlewares!             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: Tại sao phải tách middleware thành 2 để fix TypeScript?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Trong 1 middleware:                                         │
│  .client → next() → .server                                 │
│  → .client không biết .server sendContext có gì             │
│  → Type inference chạy XUÔI, không ngược                    │
│  → result.context.payloads = TS ERROR!                      │
│                                                              │
│  Tách thành 2 middleware + chaining:                         │
│  prelimMiddleware: .client (collect) + .server (execute)    │
│  refetchMiddleware:                                          │
│    .middleware([prelimMiddleware])  ← CHAIN!                │
│    .client (read results)                                    │
│                                                              │
│  → refetchMiddleware BIẾT prelimMiddleware                  │
│  → Biết server gửi payloads trong sendContext               │
│  → Type inference chạy XUÔI qua chain → TS OK!             │
│                                                              │
│  Logic hoàn toàn giống, chỉ TÁCH để TypeScript thấy types  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: Active vs inactive queries — xử lý thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  User xem page 1, 2, 3 → tất cả trong cache                │
│  Hiện tại đang xem page 1 (active)                          │
│  Page 2, 3 đã rời (inactive)                                │
│                                                              │
│  Nếu refetch TẤT CẢ → lãng phí (page 2, 3 không ai xem)  │
│                                                              │
│  Giải pháp:                                                  │
│  ① Active queries: refetch qua single flight mutation       │
│     cache.findAll({ queryKey, type: "active" })             │
│     → Server chạy → data trả về → setQueryData             │
│                                                              │
│  ② Inactive queries: đánh dấu STALE, không refetch ngay   │
│     queryClient.invalidateQueries({                         │
│       queryKey, type: "inactive", refetchType: "none"       │
│     })                                                       │
│     → Khi user quay lại page 2 → TQ tự refetch             │
│       (vì data đã stale → refetch on mount)                 │
│                                                              │
│  → Active: cập nhật ngay (single flight)                    │
│  → Inactive: cập nhật lazy (khi user cần)                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: Function overloads giải quyết vấn đề gì cho refetchedQueryOptions?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Vấn đề: refetchedQueryOptions nhận serverFn + arg          │
│  → Có serverFn CẦN arg (getEpicsList cần page: number)    │
│  → Có serverFn KHÔNG cần arg (getEpicsSummary)             │
│                                                              │
│  Không overload:                                             │
│  → arg luôn optional → quên truyền arg cho fn cần → bug   │
│  → Hoặc arg luôn required → fn không cần phải truyền      │
│    undefined → xấu code                                    │
│                                                              │
│  Với function overloads:                                     │
│  → Overload 1: serverFn CÓ arg → arg REQUIRED + TYPED     │
│  → Overload 2: serverFn KHÔNG arg → arg OMITTED            │
│  → TS tự chọn overload phù hợp dựa trên serverFn type    │
│                                                              │
│  Kết hợp ValidateServerFunction utility type:               │
│  → Truyền sai arg → TS error: "string ≠ number"           │
│  → Thiếu arg → TS error: "requires an argument!"          │
│  → Custom error message trong TYPE SYSTEM!                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
