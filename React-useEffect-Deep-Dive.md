# React useEffect — Deep Dive!

> **Hiểu sâu useEffect từ Source Code React!**
> Cấu trúc dữ liệu Effect, Mount/Update Phase, Commit Phase, và useLayoutEffect!

---

## §1. Tổng Quan — Side Effects Trong React!

```
  SIDE EFFECTS TRONG REACT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REACT = FUNCTIONAL PROGRAMMING PHILOSOPHY!                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Component = PURE FUNCTION!                            │    │
  │  │ → Input (props) cố định → Output (UI) cố định!     │    │
  │  │ → Không tác dụng phụ!                               │    │
  │  │                                                      │    │
  │  │ NHƯNG thực tế CẦN side effects:                      │    │
  │  │ → Gọi API fetch data! 📡                             │    │
  │  │ → Subscribe/unsubscribe events! 🔔                   │    │
  │  │ → Thao tác DOM trực tiếp! 🖱️                       │    │
  │  │ → Thiết lập timer/interval! ⏱️                       │    │
  │  │ → Đồng bộ với hệ thống bên ngoài!                 │    │
  │  │                                                      │    │
  │  │ GIẢI PHÁP:                                            │    │
  │  │ → useEffect → side effects KHÔNG ĐỒNG BỘ! ★       │    │
  │  │ → useLayoutEffect → side effects ĐỒNG BỘ! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÁC BIỆT CHÍNH:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ useEffect:                                             │    │
  │  │ → Chạy SAU khi browser paint! ★                     │    │
  │  │ → KHÔNG chặn render!                                 │    │
  │  │ → Async — Scheduler lên lịch!                        │    │
  │  │ → Dùng cho: fetch data, subscribe, timer!            │    │
  │  │                                                      │    │
  │  │ useLayoutEffect:                                       │    │
  │  │ → Chạy TRƯỚC khi browser paint! ★                   │    │
  │  │ → CÓ CHẶN render!                                   │    │
  │  │ → Sync — chạy ngay trong commit phase!               │    │
  │  │ → Dùng cho: đo DOM, chỉnh layout, tooltip!         │    │
  │  │                                                      │    │
  │  │ TIMELINE:                                              │    │
  │  │ Render → Commit → useLayoutEffect → Paint            │    │
  │  │                     → useEffect (async, sau paint!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cấu Trúc Dữ Liệu Effect!

```
  EFFECT OBJECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  const effect = {                                              │
  │    tag,      // Loại effect (useEffect / useLayoutEffect!)   │
  │    create,   // Hàm callback! (tham số 1 của useEffect!) ★  │
  │    destroy,  // Hàm cleanup! (return từ create!) ★           │
  │    deps,     // Mảng dependencies! (tham số 2!)              │
  │    next,     // Trỏ đến effect tiếp theo! (linked list!)   │
  │  };                                                          │
  │                                                              │
  │  GIẢI THÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ tag: phân biệt kiểu effect!                         │    │
  │  │   → HookPassive (9) = useEffect!                     │    │
  │  │   → HookLayout (5) = useLayoutEffect!                │    │
  │  │   → HookHasEffect = cần chạy lại effect!            │    │
  │  │                                                      │    │
  │  │ create: callback truyền vào useEffect!                │    │
  │  │   useEffect(() => {                                    │    │
  │  │     console.log("side effect!"); ← ĐÂY LÀ CREATE!  │    │
  │  │     return () => { cleanup(); }; ← CREATE TRẢ VỀ!   │    │
  │  │   }, [deps]);                                          │    │
  │  │                                                      │    │
  │  │ destroy: hàm được TRẢ VỀ từ create!                 │    │
  │  │   → Chạy KHI component unmount!                      │    │
  │  │   → Hoặc TRƯỚC khi create chạy lại! (cleanup!)     │    │
  │  │   → Mount lần đầu: destroy = undefined! ★           │    │
  │  │                                                      │    │
  │  │ deps: mảng dependencies!                              │    │
  │  │   → [] = chỉ chạy 1 lần (mount!)                    │    │
  │  │   → [a, b] = chạy khi a hoặc b thay đổi!           │    │
  │  │   → undefined = chạy MỌI render!                     │    │
  │  │                                                      │    │
  │  │ next: con trỏ → effect tiếp theo!                   │    │
  │  │   → Tạo DANH SÁCH LIÊN KẾT VÒNG (circular!) ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Hooks Linked List & updateQueue!

```
  CẤU TRÚC LƯU TRỮ TRÊN FIBER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VÍ DỤ CODE:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const App = () => {                                   │    │
  │  │   const [count, setCount] = useState(0);    // hook 1│    │
  │  │   useEffect(() => { log(1); }, []);         // hook 2│    │
  │  │   useLayoutEffect(() => { log(3); }, [3]);  // hook 3│    │
  │  │   useEffect(() => { log(2); }, [count]);    // hook 4│    │
  │  │   return <div>1</div>;                                │    │
  │  │ };                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HAI CẤU TRÚC LƯU TRỮ:                                        │
  │                                                              │
  │  ① fiber.memoizedState → DANH SÁCH MỘT CHIỀU (singly!)    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ fiber.memoizedState                                   │    │
  │  │    ↓                                                  │    │
  │  │ ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐│    │
  │  │ │useState │→→→│useEffect│→→→│useLayout│→→→│useEffect││   │
  │  │ │ hook 1  │next│ hook 2 │next│ hook 3 │next│ hook 4 ││   │
  │  │ │state: 0 │    │effect a│    │effect b│    │effect c││    │
  │  │ └────────┘    └────────┘    └────────┘    └────────┘│    │
  │  │                    ↓              ↓            ↓      │    │
  │  │               memoizedState  memoizedState memoizedState│  │
  │  │               = effect obj  = effect obj = effect obj │    │
  │  │                                                      │    │
  │  │ ★ Singly linked list: hook1 → hook2 → hook3 → hook4 → null│
  │  │ ★ ĐÚNG THỨ TỰ gọi trong component! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② fiber.updateQueue → DANH SÁCH VÒNG (circular!) ★        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ fiber.updateQueue.lastEffect                          │    │
  │  │    ↓                                                  │    │
  │  │ ┌──────────────────────────────────────────┐          │    │
  │  │ │                                          │          │    │
  │  │ │  effect a ──→ effect b ──→ effect c      │          │    │
  │  │ │     ↑                          │          │          │    │
  │  │ │     └──────────────────────────┘          │          │    │
  │  │ │              CIRCULAR! ★                 │          │    │
  │  │ └──────────────────────────────────────────┘          │    │
  │  │                                                      │    │
  │  │ lastEffect trỏ đến EFFECT CUỐI CÙNG!                │    │
  │  │ lastEffect.next trỏ đến EFFECT ĐẦU TIÊN! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN CẢ HAI?                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ memoizedState (singly linked list):                    │    │
  │  │ → Lưu STATE + DATA hiện tại của component!           │    │
  │  │ → Giữ đúng THỨ TỰ hooks! (rules of hooks!)        │    │
  │  │ → Dùng trong RENDER phase!                            │    │
  │  │                                                      │    │
  │  │ updateQueue (circular linked list):                    │    │
  │  │ → Lưu CÁC EFFECT cần xử lý!                        │    │
  │  │ → Dùng trong COMMIT phase!                            │    │
  │  │ → Circular → dễ duyệt, thêm/xóa nhanh! ★         │    │
  │  │ → Hỗ trợ batch updates theo priority!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Mount Phase — Tạo Hook Lần Đầu!

```
  MOUNT PHASE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHI COMPONENT MOUNT LẦN ĐẦU:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ useEffect → dispatch → mountEffect!                  │    │
  │  │                                                      │    │
  │  │ HooksDispatcherOnMount = {                             │    │
  │  │   useState:         mountState,                        │    │
  │  │   useEffect:        mountEffect,   ← MOUNT! ★       │    │
  │  │   useLayoutEffect:  mountLayoutEffect,                 │    │
  │  │   useCallback:      mountCallback,                     │    │
  │  │   useMemo:          mountMemo,                         │    │
  │  │   useRef:           mountRef,                          │    │
  │  │   ...                                                  │    │
  │  │ };                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LUỒNG GỌI HÀM:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ useEffect(create, deps)                                │    │
  │  │   ↓                                                    │    │
  │  │ mountEffect(create, deps)                              │    │
  │  │   ↓                                                    │    │
  │  │ mountEffectImpl(fiberFlags, hookFlags, create, deps)   │    │
  │  │   ↓                                                    │    │
  │  │ ① mountWorkInProgressHook() → TẠO hook object! ★    │    │
  │  │   ↓                                                    │    │
  │  │ ② pushEffect(tag, create, undefined, deps) ★          │    │
  │  │   ↓  (destroy = undefined vì lần đầu mount!)        │    │
  │  │ ③ hook.memoizedState = effect                          │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: mountEffectImpl — MÔ PHỎNG REACT SOURCE!
// ═══════════════════════════════════════════════════════════

// Biến toàn cục mô phỏng React internals!
let currentlyRenderingFiber = null;
let workInProgressHook = null;

// ① mountWorkInProgressHook — TẠO HOOK MỚI!
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, // giá trị lưu trữ (effect / state!)
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null, // trỏ đến hook tiếp theo!
  };

  if (workInProgressHook === null) {
    // Hook ĐẦU TIÊN! Gắn vào fiber.memoizedState!
    currentlyRenderingFiber.memoizedState = hook;
  } else {
    // Hook TIẾP THEO! Nối vào danh sách!
    workInProgressHook.next = hook;
  }
  workInProgressHook = hook;
  return hook;
}

// ② mountEffectImpl — TẠO EFFECT!
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  // Bước 1: Tạo hook object!
  const hook = mountWorkInProgressHook();

  // Bước 2: Xử lý deps!
  const nextDeps = deps === undefined ? null : deps;

  // Bước 3: Đánh dấu fiber cần xử lý effect!
  currentlyRenderingFiber.flags |= fiberFlags;

  // Bước 4: Tạo effect và gắn vào hook!
  // ★ destroy = undefined vì MOUNT lần đầu!
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags, // tag: CẦN chạy!
    create, // hàm callback!
    undefined, // destroy = undefined! ★
    nextDeps, // dependencies!
  );
}

// ③ pushEffect — THÊM EFFECT VÀO CIRCULAR LINKED LIST!
function pushEffect(tag, create, destroy, deps) {
  // Tạo effect object!
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null, // sẽ nối vào circular list!
  };

  // Lấy updateQueue từ fiber!
  let updateQueue = currentlyRenderingFiber.updateQueue;

  if (updateQueue === null) {
    // ★ LẦN ĐẦU: tạo queue mới!
    updateQueue = { lastEffect: null };
    currentlyRenderingFiber.updateQueue = updateQueue;

    // Effect duy nhất → trỏ về CHÍNH NÓ (circular!)
    updateQueue.lastEffect = effect.next = effect;
    //    ┌───────┐
    //    │effect │←──┐
    //    │  .next ───┘  (trỏ về chính nó!)
    //    └───────┘
  } else {
    const lastEffect = updateQueue.lastEffect;

    if (lastEffect === null) {
      // Queue tồn tại nhưng rỗng!
      updateQueue.lastEffect = effect.next = effect;
    } else {
      // ★ THÊM effect vào CUỐI circular list!
      const firstEffect = lastEffect.next; // lưu first!
      lastEffect.next = effect; // last → new!
      effect.next = firstEffect; // new → first! ★
      updateQueue.lastEffect = effect; // cập nhật last!

      //  TRƯỚC: first → ... → last → first (circular!)
      //  SAU:   first → ... → last → NEW → first ★
      //         updateQueue.lastEffect = NEW!
    }
  }

  return effect;
}
```

---

## §5. Update Phase — Cập Nhật Effect!

```
  UPDATE PHASE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHI COMPONENT RE-RENDER (state thay đổi):                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ useEffect → dispatch → updateEffect!                 │    │
  │  │                                                      │    │
  │  │ HooksDispatcherOnUpdate = {                            │    │
  │  │   useState:         updateState,                       │    │
  │  │   useEffect:        updateEffect,  ← UPDATE! ★      │    │
  │  │   useLayoutEffect:  updateLayoutEffect,                │    │
  │  │   ...                                                  │    │
  │  │ };                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LUỒNG CHÍNH:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ updateEffect(create, deps)                             │    │
  │  │   ↓                                                    │    │
  │  │ updateEffectImpl(fiberFlags, hookFlags, create, deps)  │    │
  │  │   ↓                                                    │    │
  │  │ ① updateWorkInProgressHook() → lấy hook CŨ!         │    │
  │  │   ↓                                                    │    │
  │  │ ② So sánh deps CŨ vs MỚI!                            │    │
  │  │   ├── GIỐNG → pushEffect KHÔNG có HookHasEffect!     │    │
  │  │   │          → KHÔNG chạy lại create! ★              │    │
  │  │   │          → Return sớm!                            │    │
  │  │   │                                                    │    │
  │  │   └── KHÁC → pushEffect CÓ HookHasEffect!            │    │
  │  │              → SẼ chạy lại create! ★                 │    │
  │  │              → Gọi destroy cũ trước! (cleanup!)      │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ KEY INSIGHT:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ MOUNT: create LUÔN chạy! (destroy = undefined!)      │    │
  │  │ UPDATE: create CHỈ chạy khi deps THAY ĐỔI! ★       │    │
  │  │                                                      │    │
  │  │ Nếu deps KHÔNG đổi:                                  │    │
  │  │ → pushEffect(hookFlags, ...) ← KHÔNG có HookHasEffect│   │
  │  │ → Effect được tạo nhưng KHÔNG có tag "cần chạy"!   │    │
  │  │ → Commit phase BỎ QUA effect này! ★                 │    │
  │  │                                                      │    │
  │  │ Nếu deps THAY ĐỔI:                                   │    │
  │  │ → pushEffect(HookHasEffect | hookFlags, ...)         │    │
  │  │ → Effect CÓ tag "cần chạy"!                        │    │
  │  │ → Commit phase SẼ chạy destroy cũ + create mới!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: updateEffectImpl — MÔ PHỎNG UPDATE PHASE!
// ═══════════════════════════════════════════════════════════

let currentHook = null; // hook từ lần render TRƯỚC!

// ① updateWorkInProgressHook — LẤY HOOK CŨ!
function updateWorkInProgressHook() {
  // Lấy hook tương ứng từ lần render trước!
  const current = currentHook;
  currentHook = currentHook.next; // di chuyển đến hook tiếp!

  // Tạo hook mới DỰA TRÊN hook cũ!
  const newHook = {
    memoizedState: current.memoizedState,
    baseState: current.baseState,
    baseQueue: current.baseQueue,
    queue: current.queue,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = newHook;
  } else {
    workInProgressHook.next = newHook;
  }
  workInProgressHook = newHook;
  return newHook;
}

// ② areHookInputsEqual — SO SÁNH DEPS!
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return false; // null → luôn chạy lại!

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    // Object.is → so sánh THAM CHIẾU! ★
    // → Không deep equal!
    // → {} !== {} (khác reference!)
    // → [1,2] !== [1,2] (khác reference!)
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue; // GIỐNG → tiếp!
    }
    return false; // KHÁC → deps đã thay đổi!
  }
  return true; // TẤT CẢ giống → deps không đổi!
}

// ③ updateEffectImpl — LOGIC CHÍNH!
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    // Lấy effect CŨ từ lần render trước!
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy; // hàm cleanup CŨ!

    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;

      // ★ SO SÁNH DEPS CŨ vs MỚI!
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // DEPS KHÔNG ĐỔI → KHÔNG chạy lại effect!
        hook.memoizedState = pushEffect(
          hookFlags, // ★ KHÔNG có HookHasEffect!
          create,
          destroy,
          nextDeps,
        );
        return; // ★ RETURN SỚM! Không đánh dấu fiber!
      }
    }
  }

  // DEPS ĐÃ THAY ĐỔI → ĐÁNH DẤU cần chạy effect!
  currentlyRenderingFiber.flags |= fiberFlags;

  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags, // ★ CÓ HookHasEffect!
    create,
    destroy, // destroy CŨ (sẽ chạy trước create mới!)
    nextDeps,
  );
}
```

---

## §6. Commit Phase — 3 Giai Đoạn!

```
  COMMIT PHASE OVERVIEW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  RENDER vs COMMIT:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ RENDER PHASE:                                         │    │
  │  │ → Tạo/cập nhật hooks linked list!                   │    │
  │  │ → Tạo effect linked list!                            │    │
  │  │ → So sánh deps!                                      │    │
  │  │ → KHÔNG thao tác DOM!                                │    │
  │  │                                                      │    │
  │  │ COMMIT PHASE:                                         │    │
  │  │ → Thao tác DOM thật!                                 │    │
  │  │ → Chạy effects!                                      │    │
  │  │ → Chia thành 3 GIAI ĐOẠN: ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 GIAI ĐOẠN CỦA COMMIT:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① BEFORE MUTATION (Trước thay đổi DOM!)             │    │
  │  │    ↓ getSnapshotBeforeUpdate (class component!)      │    │
  │  │    ↓ Đọc DOM trước khi thay đổi!                   │    │
  │  │                                                      │    │
  │  │ ② MUTATION (Thay đổi DOM!) ★                        │    │
  │  │    ↓ Thêm/Xóa/Cập nhật DOM nodes!                  │    │
  │  │    ↓ useLayoutEffect DESTROY chạy ở đây! ★         │    │
  │  │    ↓ ref detach!                                      │    │
  │  │                                                      │    │
  │  │ ③ LAYOUT (Sau thay đổi DOM!) ★                       │    │
  │  │    ↓ useLayoutEffect CREATE chạy ở đây! ★           │    │
  │  │    ↓ componentDidMount/componentDidUpdate!            │    │
  │  │    ↓ ref attach!                                      │    │
  │  │    ↓ useEffect được LÊN LỊCH (async!) ★             │    │
  │  │                                                      │    │
  │  │ → Browser PAINT! 🎨                                   │    │
  │  │                                                      │    │
  │  │ ④ useEffect chạy SAU paint! (async!) ★               │    │
  │  │    ↓ flushPassiveEffects()                             │    │
  │  │    ↓ destroy CŨ chạy trước!                         │    │
  │  │    ↓ create MỚI chạy sau!                            │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ TIMELINE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ commitRoot()                                           │    │
  │  │   │                                                    │    │
  │  │   ├── flushPassiveEffects() ← effect CŨ từ lần trước│   │
  │  │   │                                                    │    │
  │  │   ├── ① commitBeforeMutationEffects()                 │    │
  │  │   │      └── getSnapshotBeforeUpdate()                 │    │
  │  │   │                                                    │    │
  │  │   ├── ② commitMutationEffects()                       │    │
  │  │   │      ├── commitDeletion() ← xóa DOM!             │    │
  │  │   │      ├── commitPlacement() ← thêm DOM!           │    │
  │  │   │      ├── commitUpdate() ← cập nhật DOM!          │    │
  │  │   │      └── useLayoutEffect DESTROY! ★               │    │
  │  │   │                                                    │    │
  │  │   ├── ③ commitLayoutEffects()                         │    │
  │  │   │      ├── useLayoutEffect CREATE! ★                │    │
  │  │   │      ├── componentDidMount()!                      │    │
  │  │   │      └── ref.current = DOM!                        │    │
  │  │   │                                                    │    │
  │  │   └── scheduleCallback(flushPassiveEffects)            │    │
  │  │          └── useEffect (ASYNC — sau paint!) ★         │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Mutation Phase — Xóa, Chèn, Cập Nhật DOM!

```
  MUTATION PHASE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  commitMutationEffectsOnFiber(fiber):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Xử lý THEO LOẠI fiber.tag:                           │    │
  │  │                                                      │    │
  │  │ ① recursivelyTraverseMutationEffects() → XÓA!       │    │
  │  │ ② commitReconciliationEffects() → CHÈN!             │    │
  │  │ ③ commitUpdate() → CẬP NHẬT! (cho HostComponent!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  XÓA — commitDeletionEffectsOnFiber:                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ HostComponent (div, span, ...):                        │    │
  │  │   ① safelyDetachRef() → xóa ref!                    │    │
  │  │   ② Đệ quy xóa children!                            │    │
  │  │   ③ removeChild() → xóa DOM node!                   │    │
  │  │                                                      │    │
  │  │ ClassComponent:                                        │    │
  │  │   ① safelyDetachRef() → xóa ref!                    │    │
  │  │   ② componentWillUnmount() → lifecycle! ★           │    │
  │  │   ③ Đệ quy xóa children!                            │    │
  │  │                                                      │    │
  │  │ FunctionComponent (+ ForwardRef, Memo):                │    │
  │  │   ① Duyệt updateQueue (circular linked list!)       │    │
  │  │   ② Với mỗi effect:                                  │    │
  │  │      ├── HookInsertion? → gọi destroy!              │    │
  │  │      ├── HookLayout? → gọi destroy! ★               │    │
  │  │      └── HookPassive? → BỎ QUA! ★                   │    │
  │  │   ③ Đệ quy xóa children!                            │    │
  │  │                                                      │    │
  │  │ ★ useLayoutEffect.destroy chạy ở MUTATION phase!    │    │
  │  │ ★ useEffect.destroy KHÔNG chạy ở đây! (async sau!) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHÈN — commitReconciliationEffects:                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ if (flags & Placement) {                              │    │
  │  │   commitPlacement(finishedWork);  ← chèn DOM! ★     │    │
  │  │   finishedWork.flags &= ~Placement; ← xóa flag!     │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẬP NHẬT — commitUpdate:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ commitUpdate(dom, updatePayload, type, old, new):     │    │
  │  │   ① updateProperties(dom, payload, ...) ← cập nhật!│    │
  │  │   ② updateFiberProps(dom, newProps) ← sync fiber!    │    │
  │  │                                                      │    │
  │  │ → Áp dụng thay đổi từ Virtual DOM → Real DOM! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Layout Phase — Chạy Effects!

```
  LAYOUT PHASE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SAU mutation → DOM đã được cập nhật!                        │
  │  → Bây giờ chạy layout effects!                             │
  │                                                              │
  │  commitLayoutEffects → commitLayoutEffectOnFiber:              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ClassComponent:                                        │    │
  │  │   → componentDidMount() (mount!) ★                   │    │
  │  │   → componentDidUpdate() (update!)                    │    │
  │  │                                                      │    │
  │  │ FunctionComponent:                                     │    │
  │  │   → commitHookEffectListMount(HookLayout, fiber)      │    │
  │  │   → Chạy useLayoutEffect CREATE! ★                   │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: commitHookEffectListMount — CHẠY EFFECTS!
// ═══════════════════════════════════════════════════════════

function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  if (updateQueue === null) return;

  const lastEffect = updateQueue.lastEffect;
  if (lastEffect === null) return;

  const firstEffect = lastEffect.next; // đầu circular list!
  let effect = firstEffect;

  do {
    // Kiểm tra tag CÓ KHỚP flags không!
    if ((effect.tag & flags) === flags) {
      // ★ GỌI CREATE! Lưu hàm cleanup vào destroy!
      const create = effect.create;
      effect.destroy = create();
      // → create() chạy! (side effect!)
      // → Giá trị return = destroy! (cleanup function!)
      //
      // useEffect(() => {
      //   subscribe();          ← create() chạy ở đây!
      //   return () => {
      //     unsubscribe();      ← destroy = hàm này!
      //   };
      // }, [deps]);
    }
    effect = effect.next;
  } while (effect !== firstEffect); // duyệt hết circular list!
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: commitHookEffectListUnmount — CLEANUP EFFECTS!
// ═══════════════════════════════════════════════════════════

function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  if (updateQueue === null) return;

  const lastEffect = updateQueue.lastEffect;
  if (lastEffect === null) return;

  const firstEffect = lastEffect.next;
  let effect = firstEffect;

  do {
    if ((effect.tag & flags) === flags) {
      const destroy = effect.destroy;
      if (destroy !== undefined) {
        // ★ GỌI DESTROY! (cleanup!)
        destroy();
        // → unsubscribe, clearTimeout, etc.!
      }
    }
    effect = effect.next;
  } while (effect !== firstEffect);
}
```

---

## §9. useEffect — Async Scheduling!

```
  useEffect — LUỒNG ASYNC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  useEffect KHÔNG chạy trong commit phase đồng bộ!            │
  │  → Được LÊN LỊCH qua Scheduler! ★                          │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Trong commitRoot:                                   │    │
  │  │ scheduleCallback(NormalPriority, () => {               │    │
  │  │   flushPassiveEffects(); ← chạy SAU paint! ★        │    │
  │  │   return null;                                         │    │
  │  │ });                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  flushPassiveEffects:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Duyệt tất cả effects!                             │    │
  │  │ ② Chạy DESTROY CŨ trước! (cleanup!) ★               │    │
  │  │ ③ Chạy CREATE MỚI sau! ★                             │    │
  │  │                                                      │    │
  │  │ THỨ TỰ: CON trước → CHA sau!                        │    │
  │  │ (child components cleanup/create trước parent!)       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH TIMELINE:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ useLayoutEffect:                                       │    │
  │  │ ──render──┬──mutation──┬──layout──┬──paint──          │    │
  │  │           │destroy ★  │create ★ │                    │    │
  │  │           │(đồng bộ!) │(đồng bộ)│                   │    │
  │  │                                                      │    │
  │  │ useEffect:                                             │    │
  │  │ ──render──┬──mutation──┬──layout──┬──paint──┬──idle──│    │
  │  │           │            │schedule │         │destroy ★│   │
  │  │           │            │         │         │create ★ │   │
  │  │           │            │         │         │(bất đồng│   │
  │  │           │            │         │         │  bộ!)    │   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. useEffect vs useLayoutEffect!

```
  SO SÁNH CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────┬───────────────────┐    │
  │  │ TIÊU CHÍ          │ useEffect    │ useLayoutEffect   │    │
  │  ├──────────────────┼──────────────┼───────────────────┤    │
  │  │ Thời điểm        │ SAU paint!   │ TRƯỚC paint! ★    │    │
  │  │ Đồng bộ?        │ ASYNC!       │ SYNC! ★            │    │
  │  │ Chặn render?    │ KHÔNG!       │ CÓ! ★              │    │
  │  │ destroy chạy    │ Async (idle) │ Mutation phase! ★  │    │
  │  │ create chạy     │ Async (idle) │ Layout phase! ★    │    │
  │  │ Performance      │ TỐT hơn!    │ Có thể chậm!     │    │
  │  │ Tag              │ HookPassive  │ HookLayout         │    │
  │  │ PassiveEffect    │ Có           │ Không              │    │
  │  ├──────────────────┼──────────────┼───────────────────┤    │
  │  │ Dùng khi         │ Fetch data   │ Đo DOM size!      │    │
  │  │                  │ Subscribe    │ Chỉnh tooltip!    │    │
  │  │                  │ Timer        │ Scroll position!   │    │
  │  │                  │ Log          │ Animation sync!    │    │
  │  └──────────────────┴──────────────┴───────────────────┘    │
  │                                                              │
  │  KHI NÀO DÙNG useLayoutEffect?                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Cần đọc DOM layout (getBoundingClientRect!)       │    │
  │  │ → Cần thay đổi DOM TRƯỚC khi user thấy! (no flicker)│   │
  │  │ → Đồng bộ scroll position!                         │    │
  │  │ → Tooltip cần biết vị trí element!                  │    │
  │  │                                                      │    │
  │  │ ★ MẶC ĐỊNH: LUÔN dùng useEffect! ★                  │    │
  │  │ ★ CHỈ dùng useLayoutEffect khi BẮT BUỘC!            │    │
  │  │ ★ Vì useLayoutEffect CHẶN paint → giảm performance!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN — useEffect:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: useEffect chạy ở giai đoạn nào?                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ASYNC! Chạy SAU browser paint! ★                   │    │
  │  │ → Được Scheduler lên lịch (scheduleCallback!)        │    │
  │  │ → KHÔNG chặn render!                                 │    │
  │  │ → Destroy cũ chạy trước, create mới chạy sau!      │    │
  │  │ → Thứ tự: child → parent!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: Effect data structure như thế nào?                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Effect = { tag, create, destroy, deps, next }!      │    │
  │  │ → Lưu trong fiber.memoizedState (singly linked list!)│    │
  │  │ → VÀ trong fiber.updateQueue (circular linked list!) │    │
  │  │ → Circular list: lastEffect.next = firstEffect! ★    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: Mount vs Update khác nhau thế nào?                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mount: create LUÔN chạy! destroy = undefined!      │    │
  │  │ → Update: SO SÁNH deps (Object.is!) ★                │    │
  │  │   → Deps giống → KHÔNG chạy lại (bỏ HookHasEffect!)│   │
  │  │   → Deps khác → CHẠY lại (có HookHasEffect!)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: 3 sub-phases của Commit là gì?                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ① Before Mutation: đọc DOM trước khi thay đổi!   │    │
  │  │ → ② Mutation: thêm/xóa/cập nhật DOM! ★             │    │
  │  │     + useLayoutEffect DESTROY chạy ở đây!            │    │
  │  │ → ③ Layout: useLayoutEffect CREATE + componentDidMount│   │
  │  │     + ref attach + schedule useEffect!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: useLayoutEffect destroy/create chạy khi nào?         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → DESTROY chạy ở MUTATION phase! (trước DOM update!)│    │
  │  │ → CREATE chạy ở LAYOUT phase! (sau DOM update!) ★   │    │
  │  │ → Cả hai đều ĐỒNG BỘ → chặn browser paint!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: Deps so sánh bằng gì? Deep equal?                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Object.is()! KHÔNG phải deep equal! ★              │    │
  │  │ → Object.is(NaN, NaN) = true!                        │    │
  │  │ → Object.is(+0, -0) = false!                         │    │
  │  │ → Object.is({}, {}) = false! (khác reference!) ★     │    │
  │  │ → Nên dùng primitive hoặc memo object trong deps!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 7: Tại sao hooks linked list phải giữ THỨ TỰ?          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mỗi hook = 1 node trong linked list!               │    │
  │  │ → Update phase dựa vào THỨ TỰ để map hook cũ → mới!│   │
  │  │ → Nếu đổi thứ tự → map SAI hook → BUG! ★          │    │
  │  │ → VÌ VẬY: Rules of Hooks:                            │    │
  │  │   • Không đặt hook trong if/else/for!                │    │
  │  │   • Luôn gọi ở TOP LEVEL! ★                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 8: Tại sao updateQueue dùng CIRCULAR linked list?       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Thêm effect cuối = O(1)! (lastEffect.next = new!) │    │
  │  │ → Truy cập đầu = O(1)! (lastEffect.next = first!)  │    │
  │  │ → Duyệt toàn bộ = O(n)! (do...while !== first!)    │    │
  │  │ → Hỗ trợ batch updates theo priority! ★              │    │
  │  │ → Linh hoạt hơn singly list cho commit phase!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 9: useEffect deps = [] vs undefined vs [a,b]?            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → [] → chạy MỘT LẦN khi mount! (cleanup khi unmount)│   │
  │  │ → undefined → chạy MỌI render! ★ (không truyền deps)│   │
  │  │ → [a,b] → chạy khi a hoặc b thay đổi!              │    │
  │  │ → React so sánh từng item bằng Object.is()!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 10: HookHasEffect flag có ý nghĩa gì?                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → CÓ HookHasEffect → effect CẦN chạy lại! ★       │    │
  │  │ → KHÔNG có → effect được TẠO nhưng BỎ QUA!         │    │
  │  │ → Mount: LUÔN có HookHasEffect!                      │    │
  │  │ → Update + deps giống: KHÔNG có → skip! ★           │    │
  │  │ → Update + deps khác: CÓ → chạy destroy + create!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Các Bẫy Phổ Biến Với useEffect!

```
  COMMON PITFALLS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① STALE CLOSURE (Giá trị cũ trong closure!)               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ BUG:                                                  │    │
  │  │ const [count, setCount] = useState(0);                │    │
  │  │ useEffect(() => {                                      │    │
  │  │   setInterval(() => {                                  │    │
  │  │     console.log(count); ← LUÔN IN 0! ★ BUG!        │    │
  │  │   }, 1000);                                            │    │
  │  │ }, []); // deps = [] → closure BẮT count = 0!       │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                            │    │
  │  │ → deps = [] → effect chỉ chạy 1 LẦN khi mount!    │    │
  │  │ → Closure bắt count = 0 TẠI THỜI ĐIỂM MOUNT!      │    │
  │  │ → Dù count thay đổi, closure VẪN GIỮ giá trị cũ!  │    │
  │  │                                                      │    │
  │  │ SỬA:                                                   │    │
  │  │ → Cách 1: Thêm count vào deps!                      │    │
  │  │   useEffect(() => {                                    │    │
  │  │     const id = setInterval(() => log(count), 1000);   │    │
  │  │     return () => clearInterval(id); ← cleanup! ★     │    │
  │  │   }, [count]); ← mỗi lần count đổi → re-create!    │    │
  │  │                                                      │    │
  │  │ → Cách 2: Dùng useRef!                               │    │
  │  │   const countRef = useRef(count);                      │    │
  │  │   countRef.current = count; ← CẬP NHẬT mỗi render! │    │
  │  │   useEffect(() => {                                    │    │
  │  │     setInterval(() => log(countRef.current), 1000);   │    │
  │  │   }, []); ← ref.current luôn MỚI NHẤT! ★           │    │
  │  │                                                      │    │
  │  │ → Cách 3: Dùng functional updater!                   │    │
  │  │   setCount(prev => prev + 1); ← không cần deps!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② INFINITE LOOP (Vòng lặp vô hạn!)                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ BUG 1: Không có deps!                                 │    │
  │  │ useEffect(() => {                                      │    │
  │  │   setState(count + 1); ← setState → re-render!      │    │
  │  │ }); ← KHÔNG CÓ DEPS → chạy MỌI render → LOOP! ❌ │    │
  │  │                                                      │    │
  │  │ BUG 2: Object/Array trong deps!                       │    │
  │  │ useEffect(() => {                                      │    │
  │  │   fetchData();                                         │    │
  │  │ }, [{ id: 1 }]); ← MỖI RENDER tạo object MỚI!     │    │
  │  │ // Object.is({id:1}, {id:1}) = false! ★              │    │
  │  │ // → Deps LUÔN "thay đổi" → LOOP! ❌               │    │
  │  │                                                      │    │
  │  │ SỬA: Dùng primitive hoặc useMemo!                     │    │
  │  │ useEffect(() => { fetchData(); }, [id]);              │    │
  │  │ // id là number/string → primitive → so sánh giá trị!│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ THIẾU CLEANUP FUNCTION!                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ BUG: Memory leak!                                      │    │
  │  │ useEffect(() => {                                      │    │
  │  │   window.addEventListener('resize', handler);         │    │
  │  │ }, []); ← KHÔNG cleanup! → listener tồn tại MÃI! ❌│    │
  │  │                                                      │    │
  │  │ SỬA:                                                   │    │
  │  │ useEffect(() => {                                      │    │
  │  │   window.addEventListener('resize', handler);         │    │
  │  │   return () => {                                       │    │
  │  │     window.removeEventListener('resize', handler); ★ │    │
  │  │   };                                                   │    │
  │  │ }, []);                                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ RACE CONDITION (Cuộc đua dữ liệu!)                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ BUG: Kết quả fetch cũ đến SAU fetch mới!           │    │
  │  │ useEffect(() => {                                      │    │
  │  │   fetch(`/api/${id}`).then(r => setData(r));          │    │
  │  │ }, [id]);                                              │    │
  │  │ // id=1 fetch chậm, id=2 fetch nhanh!                │    │
  │  │ // id=2 response đến trước → setData(2)!            │    │
  │  │ // id=1 response đến SAU → setData(1)! ❌           │    │
  │  │ // → Hiển thị data CỦA id=1 dù đang ở id=2! ★    │    │
  │  │                                                      │    │
  │  │ SỬA: Abort flag hoặc AbortController!                 │    │
  │  │ useEffect(() => {                                      │    │
  │  │   let cancelled = false; ← abort flag!                │    │
  │  │   fetch(`/api/${id}`)                                  │    │
  │  │     .then(r => {                                       │    │
  │  │       if (!cancelled) setData(r); ★                   │    │
  │  │     });                                                │    │
  │  │   return () => { cancelled = true; }; ← cleanup! ★  │    │
  │  │ }, [id]);                                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. React 18 Strict Mode — Double Invocation!

```
  STRICT MODE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REACT 18 STRICT MODE (Development only!):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Component mount 2 LẦN! ★                           │    │
  │  │ → useEffect chạy → cleanup → chạy LẠI!             │    │
  │  │ → CHỈ trong development mode!                        │    │
  │  │ → Production: chạy BÌNH THƯỜNG (1 lần!)             │    │
  │  │                                                      │    │
  │  │ MỤC ĐÍCH:                                              │    │
  │  │ → Phát hiện BUG trong cleanup function!              │    │
  │  │ → Đảm bảo effect có thể "mount → unmount → mount"! │    │
  │  │ → Chuẩn bị cho React Offscreen (tương lai!)         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ THỰC THI:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ PRODUCTION:                                            │    │
  │  │ mount → create() → ... → unmount → destroy()        │    │
  │  │                                                      │    │
  │  │ DEVELOPMENT (Strict Mode):                             │    │
  │  │ mount → create() → destroy() → create() LẠI! ★     │    │
  │  │                                                      │    │
  │  │ ★ Nếu cleanup KHÔNG đúng → BUG LỘ RA ngay!        │    │
  │  │                                                      │    │
  │  │ VD: Subscribe 2 lần nhưng unsubscribe 1 lần!         │    │
  │  │ → Memory leak! → Strict Mode phát hiện! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ useEffect(() => {                                      │    │
  │  │   const conn = createConnection(url);                  │    │
  │  │   conn.connect();                                      │    │
  │  │   return () => conn.disconnect(); ← cleanup ĐÚNG! ✅│    │
  │  │ }, [url]);                                             │    │
  │  │                                                      │    │
  │  │ Strict Mode:                                           │    │
  │  │ ① connect() → ② disconnect() → ③ connect() ✅      │    │
  │  │ → Kết quả: 1 connection duy nhất! ĐÚNG!            │    │
  │  │                                                      │    │
  │  │ NẾU THIẾU CLEANUP:                                    │    │
  │  │ useEffect(() => {                                      │    │
  │  │   const conn = createConnection(url);                  │    │
  │  │   conn.connect();                                      │    │
  │  │   // THIẾU return cleanup! ❌                         │    │
  │  │ }, [url]);                                             │    │
  │  │                                                      │    │
  │  │ Strict Mode:                                           │    │
  │  │ ① connect() → ② connect() LẦN 2! ❌                 │    │
  │  │ → 2 connections! Memory leak! BUG LỘ RA! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §14. useInsertionEffect — CSS-in-JS!

```
  useInsertionEffect (React 18):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Hook MỚI trong React 18! ★                         │    │
  │  │ → Chạy TRƯỚC cả useLayoutEffect!                     │    │
  │  │ → Dành cho THƯ VIỆN CSS-in-JS (styled-components!)   │    │
  │  │ → Chèn <style> tags TRƯỚC khi DOM cập nhật!         │    │
  │  │ → KHÔNG DÙNG trong application code! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THỨ TỰ THỰC THI:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ Render phase                                           │    │
  │  │   ↓                                                    │    │
  │  │ Commit phase:                                          │    │
  │  │   │                                                    │    │
  │  │   ├── ① useInsertionEffect ← TRƯỚC DOM update! ★    │    │
  │  │   │      (chèn <style> tags!)                         │    │
  │  │   │                                                    │    │
  │  │   ├── ② Mutation (DOM update!)                        │    │
  │  │   │      (useLayoutEffect DESTROY!)                    │    │
  │  │   │                                                    │    │
  │  │   ├── ③ Layout                                         │    │
  │  │   │      (useLayoutEffect CREATE!)                     │    │
  │  │   │                                                    │    │
  │  │   └── ④ useEffect (async, sau paint!)                 │    │
  │  │                                                      │    │
  │  │ TAG: HookInsertion                                     │    │
  │  │ → Khác với HookLayout và HookPassive!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HẠN CHẾ CỦA useInsertionEffect:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG có quyền truy cập refs! ★                   │    │
  │  │ → KHÔNG thể schedule state updates! ★                │    │
  │  │ → DOM chưa được cập nhật tại thời điểm chạy!       │    │
  │  │ → CHỈ cho thư viện → không dùng trực tiếp!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §15. Real-World Effect Patterns — Tự Viết!

```javascript
// ═══════════════════════════════════════════════════════════
// ① DEBOUNCE EFFECT — Trì hoãn thực thi!
// ═══════════════════════════════════════════════════════════

function useDebouncedEffect(callback, deps, delay = 300) {
  // Mỗi lần deps thay đổi → ĐỢI delay ms rồi mới chạy!
  // Nếu deps thay đổi TIẾP trong lúc đợi → HỦY timer cũ!

  useEffect(() => {
    const timer = setTimeout(() => {
      callback();
    }, delay);

    // Cleanup: hủy timer cũ khi deps thay đổi!
    return () => clearTimeout(timer);
  }, [...deps, delay]);
}

// Sử dụng: search input!
// useDebouncedEffect(() => {
//   fetchSearchResults(query);
// }, [query], 500);
// → User gõ liên tục → CHỈ fetch sau khi NGỪNG 500ms! ★

// ═══════════════════════════════════════════════════════════
// ② FETCH VỚI ABORT CONTROLLER — Hủy request khi unmount!
// ═══════════════════════════════════════════════════════════

function useFetchWithAbort(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController(); // ★ Native API!
    const signal = controller.signal;

    setLoading(true);
    setError(null);

    fetch(url, { signal }) // truyền signal vào fetch!
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          // ★ Request bị HỦY do cleanup → KHÔNG phải lỗi!
          console.log("Fetch aborted!");
          return;
        }
        setError(err);
        setLoading(false);
      });

    // Cleanup: HỦY request khi deps thay đổi hoặc unmount!
    return () => controller.abort(); // ★ Gọi abort()!
  }, [url]);

  return { data, loading, error };
}

// ═══════════════════════════════════════════════════════════
// ③ PREVIOUS VALUE — Lưu giá trị trước đó!
// ═══════════════════════════════════════════════════════════

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value; // Cập nhật SAU render!
  });
  // ★ Không có deps → chạy MỌI render!
  // ★ Nhưng ref.current cập nhật SAU render!
  // → Return giá trị CŨ trước khi cập nhật!

  return ref.current; // giá trị từ RENDER TRƯỚC! ★
}

// const prevCount = usePrevious(count);
// → count = 5, prevCount = 4! ★

// ═══════════════════════════════════════════════════════════
// ④ INTERSECTION OBSERVER — Theo dõi element hiển thị!
// ═══════════════════════════════════════════════════════════

function useIntersectionObserver(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element); // Bắt đầu theo dõi! ★

    // Cleanup: ngừng theo dõi!
    return () => observer.disconnect(); // ★
  }, [ref, options.threshold, options.root, options.rootMargin]);

  return isIntersecting;
}

// const ref = useRef();
// const isVisible = useIntersectionObserver(ref);
// <div ref={ref}>{isVisible ? "Đang hiển thị!" : "Ẩn!"}</div>

// ═══════════════════════════════════════════════════════════
// ⑤ EVENT LISTENER — Subscribe/unsubscribe!
// ═══════════════════════════════════════════════════════════

function useEventListener(eventName, handler, element = window) {
  // Dùng ref để luôn có handler MỚI NHẤT!
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler; // Cập nhật ref mỗi render!
  }, [handler]);

  useEffect(() => {
    // Wrapper gọi handler MỚI NHẤT qua ref!
    const eventListener = (event) => savedHandler.current(event);

    element.addEventListener(eventName, eventListener);

    // Cleanup!
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
  // ★ Không cần handler trong deps vì dùng ref!
  // → Tránh re-subscribe mỗi khi handler thay đổi reference!
}

// ═══════════════════════════════════════════════════════════
// ⑥ INTERVAL — setInterval với cleanup đúng cách!
// ═══════════════════════════════════════════════════════════

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Cập nhật callback MỚI NHẤT!
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup interval!
  useEffect(() => {
    if (delay === null) return; // null = pause!

    const id = setInterval(() => {
      savedCallback.current(); // Gọi callback MỚI NHẤT! ★
    }, delay);

    return () => clearInterval(id); // Cleanup! ★
  }, [delay]); // CHỈ re-create khi delay thay đổi!
}

// useInterval(() => setCount(c => c + 1), 1000);
// → Tăng count mỗi giây! Không bị stale closure! ★
```

---

## §16. Mini React Hooks Simulator — Tự Viết Hoàn Chỉnh!

```javascript
// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG HOÀN CHỈNH REACT HOOKS SYSTEM!
// ★ Tự viết bằng tay, không dùng thư viện!
// ═══════════════════════════════════════════════════════════

const MiniReact = (() => {
  // ═══ INTERNAL STATE ═══
  let fiber = {
    memoizedState: null, // hooks linked list!
    updateQueue: null, // effects circular list!
    flags: 0,
  };

  let workInProgressHook = null; // hook hiện tại (build time!)
  let currentHook = null; // hook cũ (update time!)
  let isMount = true; // mount hay update?
  let pendingEffects = []; // effects cần chạy!

  // ═══ FIBER FLAGS ═══
  const PassiveEffect = 0b0001;
  const LayoutEffect = 0b0010;
  const HookHasEffect = 0b0100;
  const HookPassive = 0b1000;
  const HookLayout = 0b10000;

  // ═══ HOOK CREATION ═══
  function getHook() {
    let hook;

    if (isMount) {
      // MOUNT: tạo hook MỚI!
      hook = {
        memoizedState: null,
        queue: null,
        next: null,
      };

      if (workInProgressHook === null) {
        fiber.memoizedState = hook; // hook đầu tiên!
      } else {
        workInProgressHook.next = hook; // nối tiếp!
      }
    } else {
      // UPDATE: lấy hook CŨ!
      hook = currentHook;
      currentHook = currentHook.next; // di chuyển!
    }

    workInProgressHook = hook;
    return hook;
  }

  // ═══ useState ═══
  function useState(initialValue) {
    const hook = getHook();

    if (isMount) {
      hook.memoizedState = initialValue;
      hook.queue = []; // queue chứa setState calls!
    }

    // Xử lý tất cả setState đã queue!
    hook.queue.forEach((action) => {
      hook.memoizedState =
        typeof action === "function"
          ? action(hook.memoizedState) // functional updater!
          : action; // direct value!
    });
    hook.queue = []; // reset queue!

    // setState function!
    const setState = (action) => {
      hook.queue.push(action);
      // ★ Trigger re-render! (trong React thật = scheduleUpdate!)
      scheduleRerender();
    };

    return [hook.memoizedState, setState];
  }

  // ═══ useEffect ═══
  function useEffect(create, deps) {
    const hook = getHook();

    if (isMount) {
      // MOUNT: LUÔN chạy!
      hook.memoizedState = {
        create,
        destroy: undefined,
        deps,
        tag: HookHasEffect | HookPassive,
      };
      pendingEffects.push(hook.memoizedState);
    } else {
      // UPDATE: so sánh deps!
      const prevEffect = hook.memoizedState;
      const prevDeps = prevEffect.deps;

      if (deps && areDepsEqual(deps, prevDeps)) {
        // Deps KHÔNG đổi → BỎ QUA!
        hook.memoizedState = {
          create,
          destroy: prevEffect.destroy,
          deps,
          tag: HookPassive, // ★ KHÔNG có HookHasEffect!
        };
      } else {
        // Deps THAY ĐỔI → cần chạy lại!
        hook.memoizedState = {
          create,
          destroy: prevEffect.destroy,
          deps,
          tag: HookHasEffect | HookPassive, // ★ CÓ HookHasEffect!
        };
        pendingEffects.push(hook.memoizedState);
      }
    }
  }

  // ═══ useLayoutEffect ═══
  function useLayoutEffect(create, deps) {
    const hook = getHook();

    if (isMount) {
      hook.memoizedState = {
        create,
        destroy: undefined,
        deps,
        tag: HookHasEffect | HookLayout,
      };
      // ★ Layout effects chạy ĐỒNG BỘ ngay lập tức!
      runLayoutEffect(hook.memoizedState);
    } else {
      const prevEffect = hook.memoizedState;
      const prevDeps = prevEffect.deps;

      if (deps && areDepsEqual(deps, prevDeps)) {
        hook.memoizedState = {
          create,
          destroy: prevEffect.destroy,
          deps,
          tag: HookLayout,
        };
      } else {
        hook.memoizedState = {
          create,
          destroy: prevEffect.destroy,
          deps,
          tag: HookHasEffect | HookLayout,
        };
        runLayoutEffect(hook.memoizedState);
      }
    }
  }

  // ═══ useRef ═══
  function useRef(initialValue) {
    const hook = getHook();
    if (isMount) {
      hook.memoizedState = { current: initialValue };
    }
    return hook.memoizedState;
  }

  // ═══ useMemo ═══
  function useMemo(factory, deps) {
    const hook = getHook();

    if (isMount) {
      const value = factory();
      hook.memoizedState = [value, deps];
      return value;
    }

    const [prevValue, prevDeps] = hook.memoizedState;
    if (areDepsEqual(deps, prevDeps)) {
      return prevValue; // deps không đổi → giá trị cũ!
    }

    const value = factory();
    hook.memoizedState = [value, deps];
    return value;
  }

  // ═══ HELPERS ═══
  function areDepsEqual(nextDeps, prevDeps) {
    if (prevDeps === null || prevDeps === undefined) return false;
    if (nextDeps.length !== prevDeps.length) return false;

    for (let i = 0; i < nextDeps.length; i++) {
      if (Object.is(nextDeps[i], prevDeps[i])) continue;
      return false;
    }
    return true;
  }

  function runLayoutEffect(effect) {
    // ★ ĐỒNG BỘ! Chạy ngay!
    // ① Cleanup cũ trước!
    if (effect.destroy) {
      effect.destroy();
    }
    // ② Chạy create mới!
    effect.destroy = effect.create();
  }

  function flushPassiveEffects() {
    // ★ ASYNC! Chạy sau paint!
    // ① Chạy TẤT CẢ destroy trước!
    pendingEffects.forEach((effect) => {
      if (effect.destroy) {
        effect.destroy();
      }
    });
    // ② Chạy TẤT CẢ create sau!
    pendingEffects.forEach((effect) => {
      effect.destroy = effect.create();
    });
    pendingEffects = []; // reset!
  }

  // ═══ RENDER CYCLE ═══
  let componentFn = null;
  let rerender = null;

  function scheduleRerender() {
    // Mô phỏng async scheduling!
    if (rerender) {
      setTimeout(rerender, 0);
    }
  }

  function render(component) {
    componentFn = component;

    function executeRender() {
      // Reset con trỏ!
      workInProgressHook = null;
      currentHook = isMount ? null : fiber.memoizedState;
      pendingEffects = [];

      // ★ GỌI COMPONENT FUNCTION!
      const output = componentFn();

      // Sau render:
      // ① Flush passive effects (async → mô phỏng bằng setTimeout)
      setTimeout(flushPassiveEffects, 0);

      // ② Đánh dấu đã mount xong!
      isMount = false;

      return output;
    }

    rerender = executeRender;
    return executeRender();
  }

  return {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useMemo,
    render,
  };
})();

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG MINI REACT:
// ═══════════════════════════════════════════════════════════

// function App() {
//   const [count, setCount] = MiniReact.useState(0);
//
//   MiniReact.useEffect(() => {
//     console.log("Effect chạy! count =", count);
//     return () => console.log("Cleanup! count =", count);
//   }, [count]);
//
//   MiniReact.useLayoutEffect(() => {
//     console.log("Layout effect! (đồng bộ!)");
//     return () => console.log("Layout cleanup!");
//   }, []);
//
//   const memoized = MiniReact.useMemo(() => count * 2, [count]);
//
//   return { count, doubled: memoized, increment: () => setCount(c => c + 1) };
// }
//
// const result = MiniReact.render(App);
// console.log(result); // { count: 0, doubled: 0, increment: fn }
// result.increment();  // → trigger re-render!
```

---

## §17. Fiber Architecture & Effect!

```
  FIBER NODE — NƠI LƯU TRỮ EFFECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỖI COMPONENT = 1 FIBER NODE!                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ FiberNode = {                                         │    │
  │  │   tag,              // loại component! (0=FC, 1=CC)  │    │
  │  │   type,             // function/class component!      │    │
  │  │   stateNode,        // DOM node (nếu HostComponent!) │    │
  │  │                                                      │    │
  │  │   // ★ QUAN TRỌNG CHO HOOKS:                          │    │
  │  │   memoizedState,    // → HOOKS LINKED LIST! ★        │    │
  │  │   updateQueue,      // → EFFECTS CIRCULAR LIST! ★    │    │
  │  │   flags,            // → bitwise flags (PassiveEffect!)│   │
  │  │                                                      │    │
  │  │   // Fiber tree connections:                           │    │
  │  │   return,           // parent fiber!                   │    │
  │  │   child,            // first child fiber!              │    │
  │  │   sibling,          // next sibling fiber!             │    │
  │  │   alternate,        // ★ CURRENT ↔ WORK-IN-PROGRESS! │    │
  │  │ };                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DOUBLE BUFFERING — 2 CÂY FIBER:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  CURRENT TREE          WORK-IN-PROGRESS TREE          │    │
  │  │  (đang hiển thị!)     (đang build mới!)              │    │
  │  │                                                      │    │
  │  │  ┌──────┐  alternate  ┌──────┐                       │    │
  │  │  │FiberA│ ←─────────→ │FiberA│                       │    │
  │  │  │.memo │              │.memo │ ← hooks MỚI!         │    │
  │  │  │State │              │State │                       │    │
  │  │  └──────┘              └──────┘                       │    │
  │  │                                                      │    │
  │  │  ★ Render phase: build WIP tree!                      │    │
  │  │  ★ Commit phase: swap current ↔ WIP!                 │    │
  │  │  ★ Hooks trên WIP = kết quả render MỚI!             │    │
  │  │  ★ Hooks trên current = lần render TRƯỚC!            │    │
  │  │                                                      │    │
  │  │  VÌ VẬY trong updateEffectImpl:                        │    │
  │  │  → currentHook = lấy từ CURRENT fiber! (cũ!)        │    │
  │  │  → hook mới gắn vào WIP fiber!                       │    │
  │  │  → So sánh deps: WIP.deps vs current.deps! ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLAGS — BITWISE OPERATIONS:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Fiber flags dùng BITWISE để đánh dấu:               │    │
  │  │                                                      │    │
  │  │  PassiveEffect     = 0b0000000000100000000000         │    │
  │  │  PassiveStaticEffect = ...                             │    │
  │  │  LayoutEffect       = 0b0000000000010000000000         │    │
  │  │  Placement          = 0b0000000000000000000010         │    │
  │  │  Update             = 0b0000000000000000000100         │    │
  │  │  Deletion           = 0b0000000000000000001000         │    │
  │  │                                                      │    │
  │  │  KIỂM TRA flag:                                       │    │
  │  │  fiber.flags & PassiveEffect !== 0                     │    │
  │  │  → CÓ passive effect (useEffect!) cần xử lý! ★      │    │
  │  │                                                      │    │
  │  │  THÊM flag:                                            │    │
  │  │  fiber.flags |= PassiveEffect                          │    │
  │  │  → Đánh dấu fiber CÓ passive effect!                 │    │
  │  │                                                      │    │
  │  │  XÓA flag:                                             │    │
  │  │  fiber.flags &= ~Placement                             │    │
  │  │  → Bỏ đánh dấu Placement (đã xử lý xong!)         │    │
  │  │                                                      │    │
  │  │  EFFECT TAG (trên effect object):                      │    │
  │  │  HookHasEffect = 0b001 → CẦN chạy effect! ★        │    │
  │  │  HookLayout    = 0b100 → useLayoutEffect!             │    │
  │  │  HookPassive   = 0b1000 → useEffect!                  │    │
  │  │  HookInsertion = 0b10 → useInsertionEffect!           │    │
  │  │                                                      │    │
  │  │  Kết hợp:                                              │    │
  │  │  HookHasEffect | HookPassive = CẦN chạy useEffect!  │    │
  │  │  HookPassive (không HookHasEffect) = BỎ QUA! ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SUBTREE FLAGS — TỐI ƯU DUYỆT CÂY:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  React KHÔNG duyệt toàn bộ fiber tree!               │    │
  │  │  → Dùng subtreeFlags để SKIP cây con! ★              │    │
  │  │                                                      │    │
  │  │  Ví dụ:                                                │    │
  │  │  App (subtreeFlags: PassiveEffect)                     │    │
  │  │   ├── Header (flags: 0, subtreeFlags: 0)              │    │
  │  │   │   └── Logo → SKIP! (không effect nào!)           │    │
  │  │   └── Content (flags: PassiveEffect) ★                │    │
  │  │       └── useEffect(...) → CẦN xử lý!               │    │
  │  │                                                      │    │
  │  │  → Header không có subtreeFlags                       │    │
  │  │  → React SKIP toàn bộ subtree Header! ★              │    │
  │  │  → Chỉ vào Content có PassiveEffect!                  │    │
  │  │  → TỐI ƯU HÓA rất lớn cho app lớn!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §18. Scheduler & Priority!

```
  SCHEDULER — LÊN LỊCH EFFECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REACT SCHEDULER:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Module RIÊNG BIỆT trong React! (packages/scheduler)│   │
  │  │ → Quản lý THỨ TỰ và THỜI ĐIỂM chạy tasks!         │    │
  │  │ → Dựa trên PRIORITY (độ ưu tiên!)                  │    │
  │  │ → Sử dụng MessageChannel (không phải setTimeout!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC MỨC ĐỘ ƯU TIÊN:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ImmediatePriority   = 1  (timeout: -1ms → NGAY!)    │    │
  │  │ → Sync effects! Click handlers!                       │    │
  │  │                                                      │    │
  │  │ UserBlockingPriority = 2  (timeout: 250ms!)           │    │
  │  │ → Input, hover! Phản hồi user nhanh!                │    │
  │  │                                                      │    │
  │  │ NormalPriority       = 3  (timeout: 5000ms!) ★        │    │
  │  │ → useEffect chạy ở mức này! ★                       │    │
  │  │ → Fetch data, subscriptions!                          │    │
  │  │                                                      │    │
  │  │ LowPriority          = 4  (timeout: 10000ms!)         │    │
  │  │ → Analytics, logging!                                  │    │
  │  │                                                      │    │
  │  │ IdlePriority          = 5  (timeout: INFINITY!)        │    │
  │  │ → Prefetch, background tasks!                         │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  useEffect SCHEDULING FLOW:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ commitRoot()                                           │    │
  │  │   ↓                                                    │    │
  │  │ scheduleCallback(NormalPriority, flushPassiveEffects)  │    │
  │  │   ↓                                                    │    │
  │  │ Scheduler thêm task vào MIN-HEAP! ★                   │    │
  │  │   ↓                                                    │    │
  │  │ Min-heap: [task1, task2, ...] sorted by expiration!   │    │
  │  │   ↓                                                    │    │
  │  │ requestAnimationFrame → workLoop!                      │    │
  │  │   ↓                                                    │    │
  │  │ workLoop: lấy task có priority CAO NHẤT!              │    │
  │  │   ↓                                                    │    │
  │  │ Chạy flushPassiveEffects()! ★                         │    │
  │  │   ↓                                                    │    │
  │  │ ① commitPassiveUnmountEffects() → destroy CŨ!       │    │
  │  │ ② commitPassiveMountEffects()   → create MỚI!       │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO DÙNG MessageChannel MÀ KHÔNG setTimeout?             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → setTimeout(fn, 0) thực tế ≥ 4ms! (browser clamp!)│    │
  │  │ → MessageChannel: gần 0ms delay! ★                   │    │
  │  │ → Nhanh hơn setTimeout cho micro-task scheduling!    │    │
  │  │                                                      │    │
  │  │ // React Scheduler sử dụng:                            │    │
  │  │ const channel = new MessageChannel();                  │    │
  │  │ channel.port1.onmessage = performWorkUntilDeadline;   │    │
  │  │ // Khi cần schedule:                                   │    │
  │  │ channel.port2.postMessage(null);                       │    │
  │  │ // → Nhanh hơn setTimeout(fn, 0)! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TIME SLICING (Concurrent Mode):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Scheduler chia work thành SLICES (5ms mỗi slice!)│    │
  │  │ → Mỗi slice: kiểm tra shouldYield()!                │    │
  │  │ → Nếu hết thời gian → NHƯỜNG cho browser! ★        │    │
  │  │ → Browser paint/input → tiếp tục slice tiếp!       │    │
  │  │                                                      │    │
  │  │ function workLoop(hasTimeRemaining, initialTime) {     │    │
  │  │   let currentTask = peek(taskQueue); // min-heap!     │    │
  │  │   while (currentTask !== null) {                       │    │
  │  │     if (shouldYieldToHost()) break; // ★ NHƯỜNG!      │    │
  │  │     const callback = currentTask.callback;             │    │
  │  │     callback(); // chạy task!                          │    │
  │  │     currentTask = peek(taskQueue); // task tiếp!      │    │
  │  │   }                                                    │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §19. useEffect vs Class Component Lifecycle!

```
  MAPPING useEffect → CLASS LIFECYCLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① componentDidMount ≈ useEffect(fn, [])                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Class:                                              │    │
  │  │ componentDidMount() {                                  │    │
  │  │   this.subscription = source.subscribe(handleChange); │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ // Hooks: ★                                            │    │
  │  │ useEffect(() => {                                      │    │
  │  │   const sub = source.subscribe(handleChange);         │    │
  │  │   return () => sub.unsubscribe(); // + cleanup!       │    │
  │  │ }, []); // deps = [] → chỉ mount!                    │    │
  │  │                                                      │    │
  │  │ ★ KHÁC BIỆT:                                          │    │
  │  │ → componentDidMount: ĐỒNG BỘ, trước paint!          │    │
  │  │ → useEffect(fn, []): BẤT ĐỒNG BỘ, sau paint! ★     │    │
  │  │ → Nếu cần đồng bộ: dùng useLayoutEffect!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② componentDidUpdate ≈ useEffect(fn, [deps])                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Class:                                              │    │
  │  │ componentDidUpdate(prevProps) {                        │    │
  │  │   if (prevProps.id !== this.props.id) {                │    │
  │  │     fetchData(this.props.id);                          │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ // Hooks: ★                                            │    │
  │  │ useEffect(() => {                                      │    │
  │  │   fetchData(id);                                       │    │
  │  │ }, [id]); // React tự so sánh deps!                  │    │
  │  │                                                      │    │
  │  │ ★ KHÁC BIỆT:                                          │    │
  │  │ → componentDidUpdate KHÔNG chạy lần mount đầu!      │    │
  │  │ → useEffect CHẠY cả mount + update! ★                │    │
  │  │ → Nếu chỉ muốn update (skip mount):                 │    │
  │  │   const isFirst = useRef(true);                        │    │
  │  │   useEffect(() => {                                    │    │
  │  │     if (isFirst.current) { isFirst.current = false; return; }│
  │  │     fetchData(id); // chỉ chạy từ lần 2!            │    │
  │  │   }, [id]);                                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ componentWillUnmount ≈ useEffect cleanup!                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Class:                                              │    │
  │  │ componentWillUnmount() {                               │    │
  │  │   this.subscription.unsubscribe();                     │    │
  │  │   clearInterval(this.timer);                           │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ // Hooks: ★                                            │    │
  │  │ useEffect(() => {                                      │    │
  │  │   const sub = source.subscribe(handler);               │    │
  │  │   const timer = setInterval(tick, 1000);               │    │
  │  │   return () => {                                       │    │
  │  │     sub.unsubscribe();       // ★ cleanup!            │    │
  │  │     clearInterval(timer);     // ★ cleanup!            │    │
  │  │   };                                                   │    │
  │  │ }, []);                                                │    │
  │  │                                                      │    │
  │  │ ★ KHÁC BIỆT:                                          │    │
  │  │ → componentWillUnmount: chỉ khi UNMOUNT!             │    │
  │  │ → useEffect cleanup: khi UNMOUNT + mỗi lần RE-RUN!  │    │
  │  │ → Cleanup chạy TRƯỚC create mới! ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BẢNG TỔNG HỢP:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Class Lifecycle             │ Hooks Equivalent         │    │
  │  ├────────────────────────────┼─────────────────────────┤    │
  │  │ componentDidMount           │ useEffect(fn, [])        │    │
  │  │ componentDidUpdate          │ useEffect(fn, [deps])    │    │
  │  │ componentWillUnmount        │ useEffect cleanup!       │    │
  │  │ shouldComponentUpdate       │ React.memo()             │    │
  │  │ getDerivedStateFromProps    │ Tính trong render!       │    │
  │  │ getSnapshotBeforeUpdate     │ không có! (dùng ref!)   │    │
  │  │ componentDidCatch           │ không có hook! ★         │    │
  │  │ componentWillMount (legacy) │ KHÔNG CẦN! (bỏ rồi!)  │    │
  │  └────────────────────────────┴─────────────────────────┘    │
  │                                                              │
  │  ★ MỘT useEffect = componentDidMount + componentDidUpdate     │
  │    + componentWillUnmount GỘP LẠI! ★                        │
  │  → Hooks tư duy theo ĐỒNG BỘ HÓA, không theo lifecycle!    │
  │  → "Effect synchronizes with external system!"              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §20. Effect Execution Order — Thứ Tự Chạy!

```
  THỨ TỰ THỰC THI EFFECTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① TRONG CÙNG 1 COMPONENT:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const App = () => {                                   │    │
  │  │   useEffect(() => log("A"), []);    // effect 1      │    │
  │  │   useEffect(() => log("B"), []);    // effect 2      │    │
  │  │   useEffect(() => log("C"), []);    // effect 3      │    │
  │  │ };                                                    │    │
  │  │                                                      │    │
  │  │ → Output: "A" "B" "C" ★                               │    │
  │  │ → Effects chạy THEO THỨ TỰ khai báo! ★              │    │
  │  │ → Vì hooks linked list giữ đúng thứ tự!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② PARENT vs CHILD:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const Child = () => {                                  │    │
  │  │   useEffect(() => log("Child effect"), []);           │    │
  │  │   return <div/>;                                       │    │
  │  │ };                                                    │    │
  │  │ const Parent = () => {                                 │    │
  │  │   useEffect(() => log("Parent effect"), []);          │    │
  │  │   return <Child />;                                    │    │
  │  │ };                                                    │    │
  │  │                                                      │    │
  │  │ → Output: "Child effect" → "Parent effect" ★          │    │
  │  │ → CON trước CHA! (bottom-up!) ★                      │    │
  │  │ → Vì commit phase duyệt từ LÁ lên GỐC!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ DESTROY trước CREATE:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Khi deps thay đổi:                                  │    │
  │  │ useEffect(() => {                                      │    │
  │  │   log("create", count);                                │    │
  │  │   return () => log("destroy", count);                 │    │
  │  │ }, [count]);                                           │    │
  │  │                                                      │    │
  │  │ count: 0 → 1                                           │    │
  │  │ → "destroy 0" → "create 1" ★                          │    │
  │  │                                                      │    │
  │  │ ★ TẤT CẢ destroy chạy TRƯỚC!                         │    │
  │  │ ★ Rồi TẤT CẢ create chạy SAU!                       │    │
  │  │ → KHÔNG PHẢI: destroy1 → create1 → destroy2 → create2│   │
  │  │ → MÀ LÀ: destroy1 → destroy2 → create1 → create2! ★│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ useLayoutEffect trước useEffect:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const App = () => {                                   │    │
  │  │   useEffect(() => log("useEffect"), []);              │    │
  │  │   useLayoutEffect(() => log("useLayoutEffect"), []);  │    │
  │  │ };                                                    │    │
  │  │                                                      │    │
  │  │ → Output: "useLayoutEffect" → "useEffect" ★           │    │
  │  │ → useLayoutEffect: ĐỒNG BỘ trong commit!            │    │
  │  │ → useEffect: BẤT ĐỒNG BỘ sau paint!                 │    │
  │  │ → Dù useEffect khai báo TRƯỚC, useLayoutEffect       │    │
  │  │   vẫn CHẠY TRƯỚC! ★                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ MULTIPLE COMPONENT UPDATE:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  App                                                    │    │
  │  │  ├── A (useEffect → log("A"))                         │    │
  │  │  ├── B (useEffect → log("B"))                         │    │
  │  │  └── C                                                  │    │
  │  │      └── D (useEffect → log("D"))                     │    │
  │  │                                                      │    │
  │  │  Commit order (bottom-up, left-to-right):              │    │
  │  │  → "A" → "B" → "D" → "C" → "App"                   │    │
  │  │                                                      │    │
  │  │  ★ LÁ trước GỐC! Trái trước Phải! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §21. useEffect Trong SSR!

```
  SSR (SERVER-SIDE RENDERING):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  useEffect KHÔNG CHẠY TRÊN SERVER! ★                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Server không có DOM!                                │    │
  │  │ → Server không có browser APIs!                       │    │
  │  │ → useEffect = side effect = CHỈ client! ★            │    │
  │  │ → useLayoutEffect CŨNG không chạy trên server!       │    │
  │  │                                                      │    │
  │  │ LUỒNG SSR:                                             │    │
  │  │ Server: render HTML → gửi client!                     │    │
  │  │ Client: hydrate (gắn event + chạy effects!) ★        │    │
  │  │                                                      │    │
  │  │ → useEffect chạy SAU hydration! ★                     │    │
  │  │ → Data fetch trong useEffect = waterfall!             │    │
  │  │   Server render → client hydrate → fetch → re-render │    │
  │  │   (CHẬM! Không lý tưởng cho SSR!)                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SSR + useEffect PATTERNS:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① KIỂM TRA client-only code:                          │    │
  │  │ useEffect(() => {                                      │    │
  │  │   // Chắc chắn chạy trên CLIENT!                    │    │
  │  │   window.addEventListener('scroll', handler);         │    │
  │  │   return () => window.removeEventListener(...);       │    │
  │  │ }, []);                                                │    │
  │  │ // ★ Không cần check typeof window!                   │    │
  │  │ // → useEffect tự động CHỈ chạy client!             │    │
  │  │                                                      │    │
  │  │ ② LAZY INITIALIZATION:                                 │    │
  │  │ const [isClient, setIsClient] = useState(false);       │    │
  │  │ useEffect(() => {                                      │    │
  │  │   setIsClient(true); // ★ Chỉ true trên client!      │    │
  │  │ }, []);                                                │    │
  │  │ if (!isClient) return <Skeleton />; // SSR fallback!  │    │
  │  │ return <ClientOnlyComponent />;     // Client render! │    │
  │  │                                                      │    │
  │  │ ③ useLayoutEffect WARNING trong SSR:                    │    │
  │  │ → React hiển thị WARNING trong console!               │    │
  │  │ → "useLayoutEffect does nothing on the server"        │    │
  │  │ → Giải pháp: kiểm tra environment:                   │    │
  │  │ const useIsomorphicLayoutEffect =                      │    │
  │  │   typeof window !== 'undefined'                        │    │
  │  │     ? useLayoutEffect                                  │    │
  │  │     : useEffect; // ★ Tránh SSR warning!              │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REACT 18 SERVER COMPONENTS:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Server Components: KHÔNG CÓ useEffect! ★           │    │
  │  │ → Server Components: KHÔNG CÓ state!                  │    │
  │  │ → Server Components: KHÔNG CÓ hooks nào!             │    │
  │  │ → Chỉ Client Components mới dùng useEffect!          │    │
  │  │ → Đánh dấu: "use client" directive!                  │    │
  │  │                                                      │    │
  │  │ // Server Component (KHÔNG có useEffect!)              │    │
  │  │ async function ServerComp() {                          │    │
  │  │   const data = await fetchData(); // trực tiếp!      │    │
  │  │   return <div>{data}</div>;                            │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ // Client Component (CÓ useEffect!)                    │    │
  │  │ "use client";                                          │    │
  │  │ function ClientComp() {                                │    │
  │  │   useEffect(() => { ... }, []);                        │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §22. Advanced Anti-Patterns & Performance!

```
  ANTI-PATTERNS NÂNG CAO:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① useEffect ĐỂ SYNC STATE (SAI!)                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ SAI: derived state trong useEffect!                │    │
  │  │ const [items, setItems] = useState([]);                │    │
  │  │ const [count, setCount] = useState(0);                 │    │
  │  │                                                      │    │
  │  │ useEffect(() => {                                      │    │
  │  │   setCount(items.length); // ★ KHÔNG CẦN useEffect!  │    │
  │  │ }, [items]);                                           │    │
  │  │ // → Re-render 2 lần! ❌ (set items → set count!)    │    │
  │  │                                                      │    │
  │  │ ✅ ĐÚNG: tính trực tiếp trong render!                │    │
  │  │ const [items, setItems] = useState([]);                │    │
  │  │ const count = items.length; // ★ Derived State!       │    │
  │  │ // → Re-render 1 lần! ✅                              │    │
  │  │                                                      │    │
  │  │ ★ QUY TẮC: Nếu có thể TÍNH từ props/state → TÍNH!  │    │
  │  │ → KHÔNG cần useEffect + setState cho derived data!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② useEffect ĐỂ HANDLE EVENTS (SAI!)                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ SAI:                                                │    │
  │  │ const [submitted, setSubmitted] = useState(false);     │    │
  │  │ useEffect(() => {                                      │    │
  │  │   if (submitted) {                                     │    │
  │  │     sendToServer(formData);                            │    │
  │  │     setSubmitted(false);                               │    │
  │  │   }                                                   │    │
  │  │ }, [submitted]);                                       │    │
  │  │ // → Phức tạp không cần thiết! ❌                    │    │
  │  │                                                      │    │
  │  │ ✅ ĐÚNG: xử lý trực tiếp trong event handler!       │    │
  │  │ function handleSubmit() {                              │    │
  │  │   sendToServer(formData); // ★ Trực tiếp!            │    │
  │  │ }                                                     │    │
  │  │ // → Đơn giản, rõ ràng! ✅                           │    │
  │  │                                                      │    │
  │  │ ★ QUY TẮC: Event → Event Handler!                     │    │
  │  │ → useEffect CHỈ cho SYNCHRONIZATION (đồng bộ hóa!) │    │
  │  │ → KHÔNG dùng useEffect cho event-driven logic!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ FETCH TRONG useEffect (XEM LẠI!)                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ CÓ NHIỀU VẤN ĐỀ:                                  │    │
  │  │ useEffect(() => {                                      │    │
  │  │   fetch('/api/data').then(r => setData(r));           │    │
  │  │ }, []);                                                │    │
  │  │                                                      │    │
  │  │ ★ VẤN ĐỀ:                                             │    │
  │  │ → Race condition! (responses trả về KHÔNG theo thứ tự)│   │
  │  │ → Không cache! (re-mount = fetch lại!)               │    │
  │  │ → Không SSR! (chỉ client!)                           │    │
  │  │ → Waterfall! (parent fetch → child fetch tuần tự!)  │    │
  │  │ → Không prefetch!                                     │    │
  │  │ → Không error boundary!                               │    │
  │  │                                                      │    │
  │  │ ✅ GIẢI PHÁP TỐT HƠN:                                │    │
  │  │ → Dùng framework: Next.js, Remix (loader!)           │    │
  │  │ → Dùng thư viện: React Query, SWR, RTK Query!       │    │
  │  │ → React 18+: use() hook (experimental!)               │    │
  │  │                                                      │    │
  │  │ ★ NẾU BẮT BUỘC dùng useEffect fetch:                 │    │
  │  │ → PHẢI có: abort controller + loading + error state!  │    │
  │  │ → PHẢI cleanup! (tránh race condition!)              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ useEffect CHAINING (EFFECT WATERFALL!)                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ SAI: effect chuỗi!                                 │    │
  │  │ useEffect(() => { fetchUser(id); }, [id]);            │    │
  │  │ useEffect(() => { fetchPosts(user); }, [user]);       │    │
  │  │ useEffect(() => { renderPosts(posts); }, [posts]);    │    │
  │  │ // → 3 re-renders! Waterfall! CHẬM! ❌              │    │
  │  │                                                      │    │
  │  │ ✅ ĐÚNG: gộp effects!                                │    │
  │  │ useEffect(() => {                                      │    │
  │  │   async function loadAll() {                           │    │
  │  │     const user = await fetchUser(id);                  │    │
  │  │     const posts = await fetchPosts(user);              │    │
  │  │     setData({ user, posts }); // ★ setState 1 LẦN!  │    │
  │  │   }                                                   │    │
  │  │   loadAll();                                           │    │
  │  │ }, [id]);                                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ OBJECT/FUNCTION LÀM DEPS:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ SAI:                                                │    │
  │  │ function App({ userId }) {                             │    │
  │  │   const config = { userId, page: 1 }; // MỚI mỗi render!│  │
  │  │   useEffect(() => {                                    │    │
  │  │     fetchData(config);                                 │    │
  │  │   }, [config]); // ❌ Object.is({},{}) = false!       │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ ✅ CÁCH SỬA:                                           │    │
  │  │ → Cách 1: Dùng primitive deps!                        │    │
  │  │   useEffect(() => {                                    │    │
  │  │     fetchData({ userId, page: 1 });                   │    │
  │  │   }, [userId]); // ★ Chỉ primitive! ✅                │    │
  │  │                                                      │    │
  │  │ → Cách 2: useMemo object!                              │    │
  │  │   const config = useMemo(                              │    │
  │  │     () => ({ userId, page: 1 }),                       │    │
  │  │     [userId] // ★ Chỉ tạo mới khi userId đổi!      │    │
  │  │   );                                                   │    │
  │  │   useEffect(() => fetchData(config), [config]);        │    │
  │  │                                                      │    │
  │  │ → Cách 3: JSON.stringify (đơn giản nhưng KO tối ưu!)│    │
  │  │   const key = JSON.stringify(config);                  │    │
  │  │   useEffect(() => fetchData(config), [key]);           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```
  PERFORMANCE OPTIMIZATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① MINIMAL DEPS — ít deps nhất có thể!                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mỗi dep thêm vào = thêm 1 lần re-run tiềm năng! │    │
  │  │ → Chỉ thêm những cái THẬT SỰ cần thiết!            │    │
  │  │ → Dùng useCallback, useMemo cho function/object deps!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② SPLIT EFFECTS — tách effect nhỏ!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ Gộp chung:                                         │    │
  │  │ useEffect(() => {                                      │    │
  │  │   fetchUser(id);        // deps: [id]                 │    │
  │  │   logPageView(page);    // deps: [page]               │    │
  │  │ }, [id, page]); // id ĐỔI → log pageview KHÔNG CẦN!│    │
  │  │                                                      │    │
  │  │ ✅ Tách riêng:                                        │    │
  │  │ useEffect(() => fetchUser(id), [id]);                  │    │
  │  │ useEffect(() => logPageView(page), [page]);            │    │
  │  │ // → Mỗi effect chỉ chạy khi deps RIÊNG thay đổi!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ REF PATTERN — tránh stale closure!                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Dùng ref để giữ giá trị MỚI NHẤT:                 │    │
  │  │ const callbackRef = useRef(onSomething);               │    │
  │  │ useLayoutEffect(() => {                                │    │
  │  │   callbackRef.current = onSomething;                   │    │
  │  │ }); // ★ Cập nhật ref mỗi render!                    │    │
  │  │                                                      │    │
  │  │ useEffect(() => {                                      │    │
  │  │   const handler = () => callbackRef.current();        │    │
  │  │   element.addEventListener('click', handler);          │    │
  │  │   return () => element.removeEventListener(handler);  │    │
  │  │ }, []); // ★ [] → chỉ subscribe 1 lần! Hiệu quả!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ TRÁNH UNNECESSARY EFFECTS:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ KHÔNG CẦN useEffect cho:                               │    │
  │  │ → Derived state (tính trực tiếp!)                    │    │
  │  │ → Event handling (xử lý trong handler!)              │    │
  │  │ → Transform data (tính trong render!)                 │    │
  │  │ → Reset state khi props đổi (dùng key!) ★            │    │
  │  │                                                      │    │
  │  │ // ❌ Reset state bằng useEffect:                      │    │
  │  │ useEffect(() => {                                      │    │
  │  │   setComment('');                                      │    │
  │  │ }, [userId]);                                          │    │
  │  │                                                      │    │
  │  │ // ✅ Reset state bằng KEY! ★                         │    │
  │  │ <CommentForm key={userId} /> // key đổi → remount!   │    │
  │  │ // → Component tự reset TẤT CẢ state! Sạch sẽ! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
