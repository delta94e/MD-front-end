# Next.js Forms — Deep Dive!

> **Chủ đề**: Forms + Server Actions — tạo form đúng cách!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/forms
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Forms + Server Actions](#1)
2. [§2. How It Works — action Attribute](#2)
3. [§3. Passing Additional Arguments — .bind()](#3)
4. [§4. Form Validation — Client + Server](#4)
5. [§5. Validation Errors — useActionState](#5)
6. [§6. Pending States — useFormStatus](#6)
7. [§7. Optimistic Updates — useOptimistic](#7)
8. [§8. Nested Elements + Programmatic Submit](#8)
9. [§9. Tự Viết — FormEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Forms + Server Actions!

```
  FORMS TRONG NEXT.JS — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  TRƯỚC ĐÂY (Traditional React):                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <form onSubmit={handleSubmit}>                      │  │
  │  │    → preventDefault()                                │  │
  │  │    → fetch('/api/endpoint', { method: 'POST' })      │  │
  │  │    → setState({ loading: true })                     │  │
  │  │    → try/catch error handling                        │  │
  │  │    → setState({ loading: false })                    │  │
  │  │  → Nhiều boilerplate! Client-side only!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  BÂY GIỜ (Next.js + Server Actions):                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <form action={serverAction}>                        │  │
  │  │    → Server Function nhận FormData tự động!         │  │
  │  │    → Chạy trên server (DB, auth, mutations)         │  │
  │  │    → Progressive enhancement (hoạt động khi no JS!)│  │
  │  │    → Built-in pending, errors, optimistic!          │  │
  │  │  → Ít code! Bảo mật! Liền mạch!                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  3 HOOKS QUAN TRỌNG:                                       │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Hook             │ Dùng cho                         │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ useActionState   │ State + errors + pending         │   │
  │  │ useFormStatus    │ Pending trong child components   │   │
  │  │ useOptimistic    │ Optimistic UI updates            │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. How It Works — action Attribute!

```
  FORM SUBMISSION FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Browser                          Server                   │
  │  ┌──────────────────┐            ┌──────────────────────┐  │
  │  │ <form              │            │ Server Action        │  │
  │  │   action={create}> │───POST───→│ async function       │  │
  │  │   <input name="a" />│  FormData │   create(formData)   │  │
  │  │   <input name="b" />│           │   {                  │  │
  │  │   <button>Submit   │           │     formData.get("a")│  │
  │  │ </form>            │           │     formData.get("b")│  │
  │  └──────────────────┘            │     // mutate DB!    │  │
  │                                   │     // revalidate!   │  │
  │                                   │   }                  │  │
  │                                   └──────────────────────┘  │
  │                                                            │
  │  React EXTENDS HTML <form>:                                │
  │  → action prop chấp nhận Server Function!                │
  │  → FormData tự động truyền vào!                          │
  │  → KHÔNG cần onSubmit, preventDefault, fetch!            │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Code cơ bản:**

```typescript
export default function Page() {
  async function createInvoice(formData: FormData) {
    'use server'

    const rawFormData = {
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    }
    // mutate data
    // revalidate the cache
  }

  return <form action={createInvoice}>...</form>
}
```

```
  FormData METHODS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  formData.get('name')       → 1 giá trị (string|File) │
  │  formData.getAll('name')   → array (cho checkbox!)     │
  │  formData.has('name')      → boolean                   │
  │  formData.entries()        → iterator                   │
  │                                                          │
  │  Nhiều fields? Dùng Object.fromEntries():               │
  │  const raw = Object.fromEntries(formData)               │
  │  ⚠️ Chứa extra $ACTION_ properties!                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Passing Additional Arguments — .bind()!

```
  .bind() — TRUYỀN THÊM DATA:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Cần truyền userId nhưng KHÔNG CÓ trong form!   │
  │                                                            │
  │  GIẢI PHÁP 1: .bind() ← KHUYÊN DÙNG!                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // Client Component                                 │  │
  │  │  const updateWithId = updateUser.bind(null, userId)  │  │
  │  │  <form action={updateWithId}>                         │  │
  │  │                                                      │  │
  │  │  // Server Action                                     │  │
  │  │  async function updateUser(userId, formData) { ... } │  │
  │  │  //                        ↑        ↑                │  │
  │  │  //                    bind arg  auto FormData       │  │
  │  │                                                      │  │
  │  │  ✅ Hoạt động cả Server + Client Components!        │  │
  │  │  ✅ Progressive enhancement!                         │  │
  │  │  ✅ Encoded (không lộ trong HTML!)                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP 2: hidden input ← KÉM HƠN!                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <input type="hidden" name="userId" value={userId} />│  │
  │  │                                                      │  │
  │  │  ⚠️ Value LỘ trong rendered HTML!                    │  │
  │  │  ⚠️ KHÔNG encoded!                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Form Validation — Client + Server!

```
  2 LAYERS VALIDATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  LAYER 1: CLIENT-SIDE (HTML attributes):                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <input required />           ← Bắt buộc!           │  │
  │  │  <input type="email" />       ← Validate email!     │  │
  │  │  <input minLength={3} />      ← Tối thiểu!          │  │
  │  │  <input pattern="[A-Z]+" />   ← Regex!              │  │
  │  │                                                      │  │
  │  │  ✅ Phản hồi ngay (UX tốt!)                         │  │
  │  │  ❌ Dễ bypass (DevTools, postman!)                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  LAYER 2: SERVER-SIDE (zod / manual):                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const schema = z.object({                            │  │
  │  │    email: z.string().email('Invalid Email'),         │  │
  │  │  })                                                   │  │
  │  │  const result = schema.safeParse({ email })           │  │
  │  │  if (!result.success) return { errors: ... }         │  │
  │  │                                                      │  │
  │  │  ✅ KHÔNG thể bypass!                                │  │
  │  │  ✅ Validation logic TRÊN SERVER!                    │  │
  │  │  ✅ Return errors → client hiển thị!                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  LUÔN CẦN CẢ HAI!                                         │
  │  Client = UX! Server = Security!                          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Server-side validation code:**

```typescript
"use server";
import { z } from "zod";

const schema = z.object({
  email: z.string({ invalid_type_error: "Invalid Email" }),
});

export default async function createUser(formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  // Mutate data
}
```

---

## §5. Validation Errors — useActionState!

```
  useActionState — STATE + ERRORS + PENDING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  const [state, formAction, pending] =                      │
  │    useActionState(serverAction, initialState)              │
  │                                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ state      → Server Action return value!            │  │
  │  │              → { message: '', errors: {} }           │  │
  │  │ formAction → Wrapped action cho <form>!             │  │
  │  │ pending    → Boolean: đang submit?                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ Server Action SIGNATURE THAY ĐỔI:                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // TRƯỚC (không useActionState):                     │  │
  │  │  async function create(formData: FormData) { }        │  │
  │  │                                                      │  │
  │  │  // SAU (có useActionState):                          │  │
  │  │  async function create(prevState: any,                │  │
  │  │                        formData: FormData) { }        │  │
  │  │                   ↑                                   │  │
  │  │             THÊM prevState!                           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  User submit → pending=true                          │  │
  │  │       ↓                                              │  │
  │  │  Server Action chạy                                   │  │
  │  │       ↓                                              │  │
  │  │  Return { message: 'Error!' }                        │  │
  │  │       ↓                                              │  │
  │  │  state = { message: 'Error!' }, pending=false        │  │
  │  │       ↓                                              │  │
  │  │  <p>{state.message}</p> → hiển thị lỗi!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Full example:**

```typescript
'use client'
import { useActionState } from 'react'
import { createUser } from '@/app/actions'

const initialState = { message: '' }

export function Signup() {
  const [state, formAction, pending] = useActionState(
    createUser, initialState
  )

  return (
    <form action={formAction}>
      <label htmlFor="email">Email</label>
      <input type="text" id="email" name="email" required />
      <p aria-live="polite">{state?.message}</p>
      <button disabled={pending}>Sign up</button>
    </form>
  )
}
```

---

## §6. Pending States — useFormStatus!

```
  2 CÁCH XỬ LÝ PENDING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CÁCH 1: useActionState → pending (built-in!)             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const [state, formAction, pending] =                │  │
  │  │    useActionState(action, initial)                    │  │
  │  │  <button disabled={pending}>Submit</button>          │  │
  │  │                                                      │  │
  │  │  ✅ Đơn giản! Pending trong cùng component!         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CÁCH 2: useFormStatus → CHILD component!                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // button.tsx — 'use client'                        │  │
  │  │  function SubmitButton() {                            │  │
  │  │    const { pending } = useFormStatus()                │  │
  │  │    return <button disabled={pending}>Submit</button>  │  │
  │  │  }                                                    │  │
  │  │                                                      │  │
  │  │  // page.tsx — Server Component!                     │  │
  │  │  <form action={createUser}>                           │  │
  │  │    <SubmitButton />  ← Reusable!                     │  │
  │  │  </form>                                              │  │
  │  │                                                      │  │
  │  │  ✅ Button tách riêng → reusable!                   │  │
  │  │  ✅ Form vẫn là Server Component!                   │  │
  │  │  ⚠️ PHẢI là CHILD của <form>!                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  React 19 useFormStatus:                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const { pending, data, method, action } =           │  │
  │  │    useFormStatus()                                    │  │
  │  │                                                      │  │
  │  │  pending  → Boolean: đang submit?                   │  │
  │  │  data     → FormData object (React 19+)             │  │
  │  │  method   → 'get' | 'post' (React 19+)             │  │
  │  │  action   → action function ref (React 19+)        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Optimistic Updates — useOptimistic!

```
  OPTIMISTIC UPDATE FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① User type "Hello" → click Send                         │
  │  ② NGAY LẬP TỨC → hiển thị "Hello" trên UI!            │
  │  ③ ĐỒNG THỜI → gửi đến server (Server Action!)          │
  │  ④ Server xong → state cập nhật (confirm hoặc rollback!)│
  │                                                            │
  │  TIMELINE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Click Send                                          │  │
  │  │  ├── t=0ms:   UI shows "Hello" (optimistic!)        │  │
  │  │  ├── t=50ms:  Server receives request               │  │
  │  │  ├── t=200ms: Server responds ✅                     │  │
  │  │  └── t=200ms: UI confirmed (no change needed!)      │  │
  │  │                                                      │  │
  │  │  Nếu server FAIL:                                    │  │
  │  │  ├── t=200ms: Server responds ❌                     │  │
  │  │  └── t=200ms: UI ROLLBACK (xóa "Hello"!)           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  → UX CỰC TỐT! User thấy phản hồi NGAY!               │
  │  → Cảm giác app cực nhanh!                               │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Code mẫu:**

```typescript
'use client'
import { useOptimistic } from 'react'
import { send } from './actions'

type Message = { message: string }

export function Thread({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    Message[], string
  >(messages, (state, newMessage) => [
    ...state,
    { message: newMessage },
  ])

  const formAction = async (formData: FormData) => {
    const message = formData.get('message') as string
    addOptimisticMessage(message)  // ← UI update NGAY!
    await send(message)            // ← Server Action (async!)
  }

  return (
    <div>
      {optimisticMessages.map((m, i) => (
        <div key={i}>{m.message}</div>
      ))}
      <form action={formAction}>
        <input type="text" name="message" />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

---

## §8. Nested Elements + Programmatic Submit!

```
  NESTED FORM ELEMENTS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  <form action={publishPost}>                             │
  │    <input name="title" />                                │
  │    <textarea name="content" />                           │
  │                                                          │
  │    <button type="submit">Publish</button>     ← default│
  │    <button formAction={saveDraft}>Save Draft</button>    │
  │           ↑                                              │
  │     formAction OVERRIDE form action!                     │
  │     → Click "Save Draft" → gọi saveDraft!              │
  │     → Click "Publish" → gọi publishPost!               │
  │                                                          │
  │  Hỗ trợ formAction:                                     │
  │  ┌────────────────────────────────────────────────┐      │
  │  │ <button formAction={fn}>                       │      │
  │  │ <input type="submit" formAction={fn}>          │      │
  │  │ <input type="image" formAction={fn}>           │      │
  │  └────────────────────────────────────────────────┘      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  PROGRAMMATIC SUBMISSION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  requestSubmit() — submit BẰNG CODE!                    │
  │                                                          │
  │  VD: ⌘+Enter (Ctrl+Enter) → submit form!              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  const handleKeyDown = (e) => {                    │  │
  │  │    if ((e.ctrlKey || e.metaKey)                    │  │
  │  │        && (e.key === 'Enter')) {                    │  │
  │  │      e.preventDefault()                             │  │
  │  │      e.currentTarget.form?.requestSubmit()         │  │
  │  │    }                                                │  │
  │  │  }                                                  │  │
  │  │                                                     │  │
  │  │  <textarea onKeyDown={handleKeyDown} />             │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  requestSubmit() vs submit():                            │
  │  ┌─────────────────┬─────────────────────────────────┐   │
  │  │ requestSubmit() │ submit()                        │   │
  │  ├─────────────────┼─────────────────────────────────┤   │
  │  │ ✅ Fire events  │ ❌ Skip submit event            │   │
  │  │ ✅ Run action   │ ❌ Skip Server Action           │   │
  │  │ ✅ Validate     │ ❌ Skip HTML validation         │   │
  │  └─────────────────┴─────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — FormEngine!

```javascript
var FormEngine = (function () {
  // ═══════════════════════════════════
  // 1. FORMDATA SIMULATION
  // ═══════════════════════════════════
  function FormData(entries) {
    this._data = {};
    if (entries) {
      for (var key in entries) {
        this._data[key] = entries[key];
      }
    }
  }
  FormData.prototype.get = function (name) {
    return this._data[name] || null;
  };
  FormData.prototype.getAll = function (name) {
    var val = this._data[name];
    return Array.isArray(val) ? val : val ? [val] : [];
  };
  FormData.prototype.has = function (name) {
    return name in this._data;
  };
  FormData.prototype.entries = function () {
    return Object.entries(this._data);
  };

  // ═══════════════════════════════════
  // 2. VALIDATION ENGINE (mini zod!)
  // ═══════════════════════════════════
  function createSchema(shape) {
    return {
      safeParse: function (data) {
        var errors = {};
        var valid = true;
        for (var key in shape) {
          var rule = shape[key];
          var val = data[key];
          if (rule.required && (!val || val === "")) {
            errors[key] = [key + " is required"];
            valid = false;
          }
          if (rule.type === "email" && val && val.indexOf("@") === -1) {
            errors[key] = ["Invalid email format"];
            valid = false;
          }
          if (rule.minLength && val && val.length < rule.minLength) {
            errors[key] = ["Min " + rule.minLength + " chars"];
            valid = false;
          }
        }
        return {
          success: valid,
          data: valid ? data : null,
          error: valid
            ? null
            : {
                flatten: function () {
                  return { fieldErrors: errors };
                },
              },
        };
      },
    };
  }

  // ═══════════════════════════════════
  // 3. useActionState SIMULATION
  // ═══════════════════════════════════
  function useActionState(serverAction, initialState) {
    var state = JSON.parse(JSON.stringify(initialState));
    var pending = false;

    function formAction(formData) {
      pending = true;
      console.log("  ⏳ pending = true");
      var result = serverAction(state, formData);
      state = result || state;
      pending = false;
      console.log("  ✅ pending = false");
      console.log("  📋 state = " + JSON.stringify(state));
      return state;
    }

    return [state, formAction, pending];
  }

  // ═══════════════════════════════════
  // 4. useOptimistic SIMULATION
  // ═══════════════════════════════════
  function useOptimistic(initial, reducer) {
    var optimistic = initial.slice();

    function addOptimistic(value) {
      optimistic = reducer(optimistic, value);
      console.log("  ⚡ Optimistic update: " + JSON.stringify(value));
      console.log(
        "  📋 UI shows: " +
          JSON.stringify(
            optimistic.map(function (m) {
              return m.message;
            }),
          ),
      );
    }

    return [optimistic, addOptimistic];
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  FORM ENGINE DEMO                   ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: FormData
    console.log("\n── Scenario 1: FormData ──");
    var fd = new FormData({ name: "Alice", email: "alice@test.com" });
    console.log("  name: " + fd.get("name"));
    console.log("  email: " + fd.get("email"));
    console.log("  has phone? " + fd.has("phone"));

    // Scenario 2: Validation
    console.log("\n── Scenario 2: Validation ──");
    var schema = createSchema({
      email: { required: true, type: "email" },
      name: { required: true, minLength: 3 },
    });
    var bad = schema.safeParse({ email: "nope", name: "AB" });
    console.log("  Valid? " + bad.success);
    console.log("  Errors: " + JSON.stringify(bad.error.flatten().fieldErrors));
    var good = schema.safeParse({ email: "a@b.com", name: "Alice" });
    console.log("  Valid? " + good.success);

    // Scenario 3: useActionState
    console.log("\n── Scenario 3: useActionState ──");
    function signupAction(prevState, formData) {
      var email = formData.get("email");
      if (!email || email.indexOf("@") === -1) {
        return { message: "Invalid email!" };
      }
      return { message: "Success!" };
    }
    var hook = useActionState(signupAction, { message: "" });
    hook[1](new FormData({ email: "bad" }));
    hook[1](new FormData({ email: "good@test.com" }));

    // Scenario 4: Optimistic
    console.log("\n── Scenario 4: Optimistic Updates ──");
    var msgs = [{ message: "Hello" }];
    var opt = useOptimistic(msgs, function (state, newMsg) {
      return state.concat([{ message: newMsg }]);
    });
    opt[1]("World");
    opt[1]("!!!");
  }

  return { demo: demo };
})();
// Chạy: FormEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: `<form action={serverAction}>` hoạt động thế nào? Progressive enhancement là gì?

<details><summary>Đáp án</summary>

React **extends** HTML `<form>` element — `action` prop chấp nhận **Server Function** thay vì URL.

Khi submit:

1. Browser serialize form inputs → **FormData** object
2. Gửi POST request đến server
3. Server Action nhận FormData → xử lý (DB, auth, mutations)
4. Return result → update UI

**Progressive Enhancement**: Form hoạt động **KỂ CẢ KHI JAVASCRIPT DISABLED**:

- HTML `<form>` vẫn submit bình thường (POST request)
- Server nhận FormData → xử lý → redirect
- Khi JS enabled → React intercept → UX tốt hơn (no page reload, pending states)

Đây là lý do dùng `action={}` thay vì `onSubmit={}` — onSubmit **yêu cầu JS**!

</details>

---

**Câu 2**: useActionState vs useFormStatus — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

|              | useActionState                        | useFormStatus                       |
| ------------ | ------------------------------------- | ----------------------------------- |
| **Import**   | `from 'react'`                        | `from 'react-dom'`                  |
| **Vị trí**   | Component **chứa** `<form>`           | Component **CON** của `<form>`      |
| **Trả về**   | `[state, formAction, pending]`        | `{ pending, data, method, action }` |
| **State**    | ✅ Nhận return value từ Server Action | ❌ Không có state                   |
| **Errors**   | ✅ Hiển thị validation errors         | ❌ Không                            |
| **Reusable** | Tied to specific form                 | ✅ Reusable button component        |

**Dùng useActionState khi**: Cần state + errors + pending trong cùng component.
**Dùng useFormStatus khi**: Tạo reusable `<SubmitButton>` component — form vẫn là Server Component!

</details>

---

**Câu 3**: Optimistic updates hoạt động thế nào? Khi nào rollback?

<details><summary>Đáp án</summary>

`useOptimistic(currentState, reducerFn)` trả về `[optimisticState, addOptimistic]`.

Flow:

1. User submit → `addOptimistic(newValue)` → **UI update NGAY** (trước server respond!)
2. Server Action chạy async
3. Server **thành công** → real state update → optimistic matches → no visible change
4. Server **thất bại** → React **tự rollback** optimistic state → UI revert về trạng thái trước

Rollback tự động vì: optimistic state chỉ tồn tại **trong khi action đang pending**. Khi action complete (success hoặc error), React dùng **real state** để render → nếu server fail → real state = cũ → UI revert!

</details>

---

**Câu 4**: Tại sao dùng .bind() thay vì hidden input để truyền extra args?

<details><summary>Đáp án</summary>

`.bind()` ưu việt hơn hidden input vì:

1. **Encoding**: `.bind()` args được **encoded/encrypted** bởi Next.js (closure encryption). Hidden input value **lộ trong HTML** — user thấy, modify được qua DevTools.

2. **Progressive Enhancement**: `.bind()` hoạt động cả **Server + Client Components**. Hidden input cũng OK nhưng value visible.

3. **Type Safety**: TypeScript kiểu đầy đủ cho bind args. Hidden input luôn là string — cần parse.

4. **Clean**: Không thêm DOM elements không cần thiết.

Hidden input phù hợp khi: Value là public (không nhạy cảm) và cần đơn giản.

</details>
